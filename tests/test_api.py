import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app
from models import UserRole, ApplicationStatus

# Use an in-memory or dedicated test database
TEST_DB_URL = "sqlite:///./test_placementpro.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


def get_token(email: str, password: str, role: str):
    # Register if not exists
    client.post("/auth/register", json={"email": email, "password": password, "role": role})
    login_resp = client.post("/auth/login", json={"email": email, "password": password})
    return login_resp.json()["access_token"]


# -------------------------------------------------------------
# 1. AUTHENTICATION & RBAC TESTS
# -------------------------------------------------------------
def test_user_registration_and_login():
    email = "teststudent@campus.edu"
    password = "StudentPassword123!"

    # Registration 201 Created
    reg_res = client.post("/auth/register", json={
        "email": email,
        "password": password,
        "role": "student"
    })
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert data["email"] == email
    assert data["role"] == "student"
    assert "password" not in data

    # Duplicate registration 409 Conflict
    dup_res = client.post("/auth/register", json={
        "email": email,
        "password": password,
        "role": "student"
    })
    assert dup_res.status_code == 409

    # Login 200 OK
    login_res = client.post("/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["role"] == "student"

    # Login with invalid password 401 Unauthorized
    bad_login = client.post("/auth/login", json={
        "email": email,
        "password": "wrongpassword"
    })
    assert bad_login.status_code == 401


def test_auth_me_protected():
    token = get_token("student_me@campus.edu", "Password123!", "student")

    # Unauthorized access without token
    unauth_res = client.get("/auth/me")
    assert unauth_res.status_code == 401

    # Authorized access
    auth_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert auth_res.status_code == 200
    assert auth_res.json()["email"] == "student_me@campus.edu"


# -------------------------------------------------------------
# 2. PROFILES CRUD & ROLE ACCESS TESTS
# -------------------------------------------------------------
def test_student_profile_lifecycle():
    token = get_token("rahul.sharma@campus.edu", "RahulPass123!", "student")
    headers = {"Authorization": f"Bearer {token}"}

    # Profile not yet created
    me_res = client.get("/profiles/student/me", headers=headers)
    assert me_res.status_code == 404

    # Create profile
    profile_payload = {
        "full_name": "Rahul Sharma",
        "roll_number": "CS-2026-001",
        "branch": "Computer Science and Engineering",
        "cgpa": 8.85,
        "graduation_year": 2026,
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "resume_text": "Skilled backend engineer with FastAPI, relational databases, and microservices experience.",
        "phone": "+91-9876543210"
    }
    create_res = client.post("/profiles/student", json=profile_payload, headers=headers)
    assert create_res.status_code == 201
    student_profile = create_res.json()
    assert student_profile["full_name"] == "Rahul Sharma"
    assert student_profile["cgpa"] == 8.85

    # Prevent duplicate profile
    dup_res = client.post("/profiles/student", json=profile_payload, headers=headers)
    assert dup_res.status_code == 409

    # Update profile
    update_res = client.put("/profiles/student/me", json={"cgpa": 9.10}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["cgpa"] == 9.10


def test_recruiter_profile_lifecycle():
    token = get_token("recruiter.tech@corp.com", "RecruiterPass123!", "recruiter")
    headers = {"Authorization": f"Bearer {token}"}

    profile_payload = {
        "company_name": "Tech Corp Solutions",
        "company_website": "https://techcorp.example.com",
        "industry": "Information Technology",
        "contact_person": "Priya Nair",
        "contact_phone": "+91-9876500000"
    }
    create_res = client.post("/profiles/recruiter", json=profile_payload, headers=headers)
    assert create_res.status_code == 201
    assert create_res.json()["company_name"] == "Tech Corp Solutions"


# -------------------------------------------------------------
# 3. JOB POSTINGS & FILTERING TESTS
# -------------------------------------------------------------
def test_job_postings_crud_and_filters():
    recruiter_token = get_token("jobs_recruiter@company.com", "SecureJobPass123!", "recruiter")
    recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}

    # Setup recruiter profile
    client.post("/profiles/recruiter", json={
        "company_name": "CloudSphere Technologies",
        "contact_person": "Vikram Seth"
    }, headers=recruiter_headers)

    # Post Job 1: High CTC, Bangalore
    job1_payload = {
        "title": "Senior Cloud Backend Engineer",
        "description": "Designing high-scale distributed backend systems using Python, FastAPI, and PostgreSQL on AWS.",
        "location": "Bangalore",
        "job_type": "Full-Time",
        "ctc": 22.0,
        "min_cgpa": 7.5,
        "eligible_branches": ["Computer Science and Engineering", "Information Technology"],
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "AWS"]
    }
    res1 = client.post("/jobs", json=job1_payload, headers=recruiter_headers)
    assert res1.status_code == 201
    job1_id = res1.json()["id"]

    # Post Job 2: Hyderabad, Low CTC
    job2_payload = {
        "title": "Junior QA Automation Engineer",
        "description": "Quality assurance and end-to-end automated testing for web applications using Selenium and Python.",
        "location": "Hyderabad",
        "job_type": "Full-Time",
        "ctc": 9.5,
        "min_cgpa": 6.5,
        "eligible_branches": ["Computer Science and Engineering", "Electronics and Communication"],
        "required_skills": ["Python", "Selenium", "Pytest"]
    }
    res2 = client.post("/jobs", json=job2_payload, headers=recruiter_headers)
    assert res2.status_code == 201

    # Query Filter: location=Bangalore
    filter_loc = client.get("/jobs?location=Bangalore")
    assert filter_loc.status_code == 200
    assert len(filter_loc.json()) >= 1
    assert any("Bangalore" in j["location"] for j in filter_loc.json())

    # Query Filter: min_ctc=15.0
    filter_ctc = client.get("/jobs?min_ctc=15.0")
    assert filter_ctc.status_code == 200
    assert all(j["ctc"] >= 15.0 for j in filter_ctc.json())

    # Role enforcement: Student cannot create job posting -> 403 Forbidden
    student_token = get_token("student_cant_post@campus.edu", "Pass12345!", "student")
    student_headers = {"Authorization": f"Bearer {student_token}"}
    forbidden_job_res = client.post("/jobs", json=job1_payload, headers=student_headers)
    assert forbidden_job_res.status_code == 403


# -------------------------------------------------------------
# 4. JOB APPLICATIONS & ELIGIBILITY VERIFICATION TESTS
# -------------------------------------------------------------
def test_job_application_eligibility_and_lifecycle():
    # 1. Setup Recruiter and Job Posting (min_cgpa=8.0)
    recruiter_token = get_token("recruiter_eligibility@corp.com", "Pass12345!", "recruiter")
    r_headers = {"Authorization": f"Bearer {recruiter_token}"}
    client.post("/profiles/recruiter", json={
        "company_name": "Apex AI Systems",
        "contact_person": "Ananya"
    }, headers=r_headers)

    job_res = client.post("/jobs", json={
        "title": "Machine Learning Engineer",
        "description": "Build high performance NLP pipelines using PyTorch and Python. Minimum CGPA required: 8.0.",
        "location": "Remote",
        "job_type": "Full-Time",
        "ctc": 25.0,
        "min_cgpa": 8.0,
        "eligible_branches": ["Computer Science and Engineering"],
        "required_skills": ["Python", "PyTorch", "NLP"]
    }, headers=r_headers)
    job_id = job_res.json()["id"]

    # 2. Student with LOW CGPA (7.2 < 8.0) -> Should Fail with 400 Bad Request
    ineligible_token = get_token("low_cgpa_student@campus.edu", "Pass12345!", "student")
    ineligible_headers = {"Authorization": f"Bearer {ineligible_token}"}
    client.post("/profiles/student", json={
        "full_name": "Karan Verma",
        "roll_number": "CS-2026-099",
        "branch": "Computer Science and Engineering",
        "cgpa": 7.20,
        "graduation_year": 2026,
        "skills": ["Python", "PyTorch"]
    }, headers=ineligible_headers)

    ineligible_apply = client.post("/applications", json={"job_id": job_id}, headers=ineligible_headers)
    assert ineligible_apply.status_code == 400
    assert "CGPA requirement not met" in ineligible_apply.json()["detail"]

    # 3. Eligible Student (CGPA 8.75 >= 8.0) -> Should Succeed with 201 Created
    eligible_token = get_token("eligible_student@campus.edu", "Pass12345!", "student")
    eligible_headers = {"Authorization": f"Bearer {eligible_token}"}
    client.post("/profiles/student", json={
        "full_name": "Sneha Gupta",
        "roll_number": "CS-2026-015",
        "branch": "Computer Science and Engineering",
        "cgpa": 8.75,
        "graduation_year": 2026,
        "skills": ["Python", "PyTorch", "NLP", "FastAPI"],
        "resume_text": "Experienced in PyTorch NLP pipelines, fine-tuning LLMs, and deploying via FastAPI."
    }, headers=eligible_headers)

    apply_res = client.post("/applications", json={
        "job_id": job_id,
        "notes": "Eager to contribute to Apex AI systems."
    }, headers=eligible_headers)
    assert apply_res.status_code == 201
    application_data = apply_res.json()
    application_id = application_data["id"]
    assert application_data["status"] == "applied"
    assert application_data["ats_score"] is not None

    # Duplicate application prevention (409 Conflict)
    dup_apply = client.post("/applications", json={"job_id": job_id}, headers=eligible_headers)
    assert dup_apply.status_code == 409

    # Recruiter updates application status
    status_update = client.put(
        f"/applications/{application_id}/status",
        json={
            "status": "shortlisted",
            "recruiter_feedback": "Strong profile with NLP publications. Moving to technical round."
        },
        headers=r_headers
    )
    assert status_update.status_code == 200
    assert status_update.json()["status"] == "shortlisted"


# -------------------------------------------------------------
# 5. GROQ AI ATS COMPATIBILITY ENDPOINT TEST
# -------------------------------------------------------------
def test_groq_ats_compatibility_endpoint():
    student_token = get_token("ats_student@campus.edu", "Pass12345!", "student")
    headers = {"Authorization": f"Bearer {student_token}"}

    client.post("/profiles/student", json={
        "full_name": "Rohan Deshmukh",
        "roll_number": "IT-2026-033",
        "branch": "Information Technology",
        "cgpa": 8.60,
        "graduation_year": 2026,
        "skills": ["Python", "FastAPI", "SQLAlchemy", "PostgreSQL", "Docker"],
        "resume_text": "Backend engineer experienced in developing RESTful APIs with FastAPI and relational database schema design."
    }, headers=headers)

    # Public job listing to evaluate against
    jobs = client.get("/jobs").json()
    assert len(jobs) > 0
    target_job_id = jobs[0]["id"]

    # Student evaluates themselves against the job
    eval_res = client.post("/ats/evaluate", json={
        "job_id": target_job_id
    }, headers=headers)

    assert eval_res.status_code == 200
    ats_data = eval_res.json()
    assert "ats_score" in ats_data
    assert 0.0 <= ats_data["ats_score"] <= 100.0
    assert "match_verdict" in ats_data
    assert "matching_skills" in ats_data
    assert "detailed_feedback" in ats_data
    assert "recommendations" in ats_data
    assert ats_data["job_id"] == target_job_id
