# 🎓 PlacementPro - Placement Management System API

**PlacementPro** is a university placement management system backend built with **FastAPI**, **SQLAlchemy ORM**, **PostgreSQL**, **Pydantic v2**, and **Groq AI (LLaMA 3.3 70B)**.

---

## 🚀 Core Features

1. **Strict Role-Based Access Control (RBAC):**
   - **Student:** Manage personal academic profile, search/filter verified jobs, submit job applications with eligibility checks, and run AI ATS compatibility scores.
   - **Recruiter:** Manage company profile, publish/edit/delete job postings, review applicants, and update application statuses (Shortlisted, Interviewing, Offered, Rejected).
   - **Admin / Placement Officer:** System-wide administrative privileges to audit, manage, and oversee all profiles, job postings, and student applications.

2. **Enterprise Authentication & Security:**
   - Password hashing utilizing **Bcrypt** with dynamic salts (no plain-text passwords stored).
   - Stateless JWT bearer token authentication with configurable expiration.
   - Secure dependency injection with `get_current_user` and `require_roles(...)`.

3. **Domain Entities & Full CRUD:**
   - `User` (Base Authentication & Role Management)
   - `StudentProfile` (Academics, CGPA, Branch, Skills, Resume text, Links)
   - `RecruiterProfile` (Company profile, website, industry, contact persons)
   - `JobPosting` (Vacancies, CTC, criteria, skills, deadlines, statuses)
   - `JobApplication` (Application lifecycle, notes, feedback, and ATS scores)

4. **Strict Business Rule Validation:**
   - Automated eligibility gatekeeping: prevents students from applying if their CGPA is below the minimum job threshold (`job.min_cgpa`) or if their department is not in `eligible_branches`.
   - Idempotency & duplicate prevention: duplicate applications for the same job are blocked with `409 Conflict`.
   - Deadline validation: applications are blocked if the deadline has passed.

5. **Groq AI ATS Compatibility Scoring (Unique Feature):**
   - Protected endpoint `POST /ats/evaluate` integrating the official `groq` Python client (`llama-3.3-70b-versatile`).
   - Compares candidate skills, academics, and resume text against the job description.
   - Generates an ATS score (0-100), match verdict, matching skills, missing skills, constructive feedback, and recommendations.
   - Built-in heuristic fallback engine ensuring high-availability scoring even if external keys or networks are offline.

---

## 📁 Modular Code Architecture

```
d:/Fastapi project/
├── .env                              # Environment variable secrets (DB, JWT, Groq)
├── .env.example                      # Environment template
├── config.py                         # Pydantic Settings configuration loader
├── database.py                       # SQLAlchemy engine, session maker, get_db dependency
├── models.py                         # SQLAlchemy database models & relationships
├── schemas.py                        # Pydantic v2 validation models & request/response schemas
├── auth.py                           # Bcrypt hashing, JWT issuance & verification, RBAC dependencies
├── ats_service.py                    # Groq API LLM integration & heuristic ATS scoring engine
├── routes.py                         # REST API endpoint routers for Auth, Profiles, Jobs, Applications, ATS
├── main.py                           # FastAPI application entry point, CORS, lifespan, and error handlers
├── pytest.ini                        # Pytest configuration
├── requirements.txt                  # Python dependencies
├── placementpro_postman_collection.json # Complete Postman v2.1.0 test suite
└── tests/
    └── test_api.py                   # Automated end-to-end test suite
```

---

## 🛠️ Installation & Setup

### 1. Clone & Navigate to Project Directory
```powershell
cd "d:\Fastapi project"
```

### 2. Activate Virtual Environment
```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```ini
# Supabase PostgreSQL Connection URL (Recommended: Session Pooler on port 5432)
DATABASE_URL=postgresql+psycopg2://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require

# Or Local PostgreSQL
# DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/placementpro

# JWT Authentication
SECRET_KEY=placementpro_super_secret_jwt_key_2026_change_in_production_xyz123
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Groq API Key (Obtain from https://console.groq.com/keys)
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```
> **Note:** If neither Supabase nor local PostgreSQL is connected, PlacementPro automatically falls back to local SQLite (`placementpro.db`) for immediate standalone development. All tables are automatically created on startup via `init_db()`.

---

## 🏃 Running the Application

Start the development server with Uvicorn:
```powershell
.\.venv\Scripts\uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Once running, access the interactive documentation:
- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc UI:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 🧪 Running Automated Tests

Run the complete test suite with verbose output:
```powershell
.\.venv\Scripts\pytest -v
```
All 7 test suites validate:
- User registration, duplicate detection (409), password hashing, and login (200/401).
- Bearer token authentication and `/auth/me` access.
- Student & Recruiter Profile CRUD and duplicate protection.
- Job Posting creation, updates, deletions, and query parameter filtering.
- Business rule eligibility enforcement (CGPA checks, duplicate applications).
- Groq AI ATS Compatibility scoring endpoint.

---

## 📮 Postman Collection

Import `placementpro_postman_collection.json` into Postman.
- Configured with `{{baseUrl}}` pointing to `http://127.0.0.1:8000`.
- Includes automated test scripts on login endpoints to automatically set `{{student_token}}`, `{{recruiter_token}}`, and `{{admin_token}}`.
- Contains 7 organized request folders covering every endpoint and HTTP method.
