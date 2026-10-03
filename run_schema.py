"""Executes supabase_schema.sql directly against the configured PostgreSQL/Supabase database in .env.

Usage:
    python run_schema.py
"""
import sys
from sqlalchemy import create_engine, text
from config import settings
from database import _mask_db_url, engine_kwargs


def run_schema():
    raw_db_url = settings.DATABASE_URL.strip()

    # Normalize PostgreSQL URL
    if raw_db_url.startswith("postgres://"):
        db_url = raw_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+"):
        db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    else:
        db_url = raw_db_url

    print("=" * 60)
    print(" Supabase / PostgreSQL Schema Runner")
    print("=" * 60)
    print(f"Target Database: {_mask_db_url(db_url)}")

    if "localhost" in db_url or "127.0.0.1" in db_url or db_url.startswith("sqlite"):
        print("\n[!] Notice: DATABASE_URL in .env is currently set to:")
        print(f"    {_mask_db_url(db_url)}")
        print("\nTo run this against your live Supabase database:")
        print("1. Open your .env file.")
        print("2. Paste your Supabase URI into DATABASE_URL:")
        print("   DATABASE_URL=postgresql+psycopg2://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require")
        print("3. Re-run: python run_schema.py")
        print("\nAlternatively:")
        print("Copy the contents of supabase_schema.sql and paste them directly into the")
        print("Supabase Dashboard SQL Editor (https://supabase.com/dashboard) and click 'Run'.")
        print("=" * 60)
        return False

    # Read the SQL file
    try:
        with open("supabase_schema.sql", "r", encoding="utf-8") as f:
            sql_script = f.read()
    except Exception as e:
        print(f"[ERROR] Could not read supabase_schema.sql: {e}")
        return False

    # Connect directly to PostgreSQL / Supabase
    try:
        print("\n[1/2] Connecting to Supabase database...")
        pg_engine = create_engine(db_url, **engine_kwargs)
        with pg_engine.begin() as conn:
            print("[2/2] Connected! Executing schema script...")

            # Split into individual statements
            statements = [stmt.strip() for stmt in sql_script.split(";") if stmt.strip()]

            executed_count = 0
            for stmt in statements:
                clean_lines = [line for line in stmt.split("\n") if not line.strip().startswith("--")]
                clean_stmt = "\n".join(clean_lines).strip()
                if not clean_stmt:
                    continue

                conn.execute(text(clean_stmt))
                executed_count += 1

            print(f"[OK] Successfully executed {executed_count} SQL statements!")

        print("\n" + "=" * 60)
        print(" SUCCESS: All 5 tables and indexes successfully created on Supabase!")
        print("=" * 60)
        return True

    except Exception as exc:
        print(f"\n[ERROR] Database execution failed: {exc}")
        print("\nTroubleshooting tips:")
        print("1. Did you replace [password] with your actual Supabase database password in .env?")
        print("2. If your password has special characters like '@', ':', '#', or '%', URL-encode them.")
        print("3. Verify that your project is not paused in the Supabase Dashboard.")
        print("=" * 60)
        return False


if __name__ == "__main__":
    success = run_schema()
    sys.exit(0 if success else 1)
