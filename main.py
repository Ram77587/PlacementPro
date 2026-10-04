import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from config import settings
from database import init_db, engine, _mask_db_url
from routes import (
    auth_router,
    profiles_router,
    jobs_router,
    applications_router,
    ats_router
)

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("placementpro.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager to bootstrap database schemas and resources."""
    logger.info("Starting PlacementPro API application...")
    init_db()
    yield
    logger.info("Shutting down PlacementPro API application.")


# OpenAPI documentation tags metadata
tags_metadata = [
    {
        "name": "Authentication & RBAC",
        "description": "User registration, login, and identity verification with role-based JWT tokens."
    },
    {
        "name": "Profiles Management",
        "description": "Comprehensive CRUD for Student Profiles (academics, skills, resume) and Recruiter Profiles (company details)."
    },
    {
        "name": "Job Postings Management",
        "description": "Create, search, filter, update, and manage job vacancies with eligibility requirements."
    },
    {
        "name": "Job Applications Management",
        "description": "Apply for jobs with automated eligibility verification (CGPA & Branch) and status tracking."
    },
    {
        "name": "AI ATS Compatibility Scoring",
        "description": "AI-powered resume evaluation against job requirements powered by the Groq API (LLaMA 3.3 70B)."
    }
]

app = FastAPI(
    title=settings.APP_NAME,
    description="""
# PlacementPro - Placement Management System API

PlacementPro is a role-based, end-to-end placement automation engine designed for universities, recruiters, and students.

### Key Architecture Features:
* **Strict Role-Based Access Control (RBAC):** Exactly three roles: `Student`, `Recruiter`, and `Admin` (Placement Officer).
* **Robust Data Validation:** Pydantic validation across all schemas, business logic (e.g., minimum CGPA and Branch eligibility checks).
* **Enterprise Security:** Bcrypt password hashing and signed JWT bearer tokens.
* **Intelligent Querying:** Advanced path and query parameters for filtering jobs by CTC, location, skills, and branches.
* **Groq AI Integration:** Dedicated ATS compatibility endpoint comparing student resumes and profiles against job descriptions.
    """,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Cross-Origin Resource Sharing (CORS) - Allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$|^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------
# Global Exception Handlers
# -------------------------------------------------------------
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "detail": exc.detail
        },
        headers=getattr(exc, "headers", None)
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err.get("loc", [])])
        msg = err.get("msg")
        errors.append(f"{field}: {msg}")
    
    error_summary = "; ".join(errors) if errors else "Request validation failed."
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": True,
            "status_code": status.HTTP_400_BAD_REQUEST,
            "detail": f"Validation Error: {error_summary}",
            "validation_errors": errors
        }
    )


# -------------------------------------------------------------
# Include Application Routers (Both root and /api prefix for Vercel)
# -------------------------------------------------------------
# Direct routes (e.g. /auth, /jobs, /profiles)
app.include_router(auth_router)
app.include_router(profiles_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(ats_router)

# Vercel serverless proxy routes (e.g. /api/auth, /api/jobs, /api/profiles)
api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(profiles_router)
api_router.include_router(jobs_router)
api_router.include_router(applications_router)
api_router.include_router(ats_router)
app.include_router(api_router)


# -------------------------------------------------------------
# Root & Health Check Endpoints
# -------------------------------------------------------------
@app.get(
    "/",
    tags=["System Status"],
    summary="API Root Information",
    status_code=status.HTTP_200_OK
)
@app.get(
    "/api",
    tags=["System Status"],
    include_in_schema=False
)
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "status": "online",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "roles_supported": ["student", "recruiter", "admin"]
    }


@app.get(
    "/health",
    tags=["System Status"],
    summary="Health Check",
    status_code=status.HTTP_200_OK
)
@app.get(
    "/api/health",
    tags=["System Status"],
    include_in_schema=False
)
def health_check():
    db_connected = False
    try:
        with engine.connect() as conn:
            db_connected = True
    except Exception:
        db_connected = False

    return {
        "status": "healthy" if db_connected else "degraded",
        "database_connected": db_connected,
        "database_url": _mask_db_url(str(engine.url)),
        "groq_configured": bool(settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("gsk_your_groq"))
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
