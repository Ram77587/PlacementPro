import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings

logger = logging.getLogger("placementpro.database")

import re
from urllib.parse import urlsplit, urlunsplit

def _mask_db_url(url: str) -> str:
    """Masks database password for safe logging."""
    try:
        parsed = urlsplit(url)
        if parsed.password:
            netloc = f"{parsed.username or ''}:***@{parsed.hostname or ''}"
            if parsed.port:
                netloc += f":{parsed.port}"
            return urlunsplit((parsed.scheme, netloc, parsed.path, parsed.query, parsed.fragment))
    except Exception:
        pass
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", url)


# Read and normalize database URL (Supabase often uses 'postgres://' or 'postgresql://')
raw_db_url = settings.DATABASE_URL.strip()
if raw_db_url.startswith("postgres://"):
    db_url = raw_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+"):
    db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
else:
    db_url = raw_db_url

engine_kwargs = {"echo": False}

if os.environ.get("VERCEL"):
    sqlite_url = "sqlite:////tmp/placementpro.db"
    if "///./" in db_url:
        db_url = db_url.replace("///./", "////tmp/")
else:
    sqlite_url = "sqlite:///./placementpro.db"

sqlite_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
SqliteSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sqlite_engine)

if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL / Supabase connection pooling optimizations
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 60  # Recycle idle connections before Supavisor/AWS closes them
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

    connect_args = {
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    }
    # Enable SSL by default for remote PostgreSQL / Supabase connections if not explicitly specified
    if "sslmode" not in db_url and "localhost" not in db_url and "127.0.0.1" not in db_url:
        connect_args["sslmode"] = "require"

    engine_kwargs["connect_args"] = connect_args

# Test connection or fallback
try:
    _test_engine = create_engine(db_url, **engine_kwargs)
    with _test_engine.connect() as conn:
        pass
    engine = _test_engine
    logger.info(f"Connected to primary database: {_mask_db_url(db_url)}")
except Exception as e:
    logger.warning(
        f"Could not connect to primary database ({_mask_db_url(db_url)}): {e}. "
        "Initializing with local SQLite (placementpro.db) fallback."
    )
    engine = sqlite_engine

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency to provide a transactional database session per request with resilient failover."""
    db = SessionLocal()
    try:
        # Pre-validate connection fairy checkout to catch any transient SSL/pooler drops early
        db.connection()
    except Exception as exc:
        logger.warning(
            f"Primary database connection error ({exc}). Switching to local SQLite fallback."
        )
        try:
            db.close()
        except Exception:
            pass
        db = SqliteSessionLocal()

    try:
        yield db
    finally:
        db.close()


def init_db():
    """Creates all database tables defined in models on both primary and fallback engines."""
    try:
        Base.metadata.create_all(bind=engine)
        if engine != sqlite_engine:
            Base.metadata.create_all(bind=sqlite_engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise e
