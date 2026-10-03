import json
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from models import UserRole, ApplicationStatus


# -------------------------------------------------------------
# Base & Generic Schemas
# -------------------------------------------------------------
class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None


# -------------------------------------------------------------
# Authentication & User Schemas
# -------------------------------------------------------------
class UserRegister(BaseModel):
    email: EmailStr = Field(..., examples=["student@placementpro.edu"])
    password: str = Field(..., min_length=6, max_length=128, examples=["StrongPass123!"])
    role: UserRole = Field(default=UserRole.STUDENT, examples=[UserRole.STUDENT])

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v):
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("role", mode="before")
    @classmethod
    def normalize_role(cls, v):
        if isinstance(v, str):
            v_clean = v.strip().lower()
            for r in UserRole:
                if r.value == v_clean:
                    return r
        return v


class UserLogin(BaseModel):
    email: EmailStr = Field(..., examples=["student@placementpro.edu"])
    password: str = Field(..., examples=["StrongPass123!"])

    @field_validator("email", mode="before")
    @classmethod
    def normalize_login_email(cls, v):
        if isinstance(v, str):
            return v.strip().lower()
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: UserRole


class UserResponse(BaseModel):
    id: int
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime
    has_profile: bool = False

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Student Profile Schemas
# -------------------------------------------------------------
class StudentProfileBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255, examples=["Aarav Sharma"])
    roll_number: str = Field(..., min_length=2, max_length=50, examples=["CS2026-042"])
    branch: str = Field(..., min_length=2, max_length=100, examples=["Computer Science and Engineering"])
    cgpa: float = Field(..., ge=0.0, le=10.0, examples=[8.75])
    graduation_year: int = Field(..., ge=2000, le=2040, examples=[2026])
    skills: List[str] = Field(..., examples=[["Python", "FastAPI", "PostgreSQL", "Docker", "Machine Learning"]])
    resume_text: Optional[str] = Field(
        None,
        examples=["Computer Science senior with 2 internships in backend engineering. Proficient in Python, FastAPI, Docker, and PostgreSQL."]
    )
    phone: Optional[str] = Field(None, examples=["+91-9876543210"])
    linkedin_url: Optional[str] = Field(None, examples=["https://linkedin.com/in/aarav-sharma"])
    github_url: Optional[str] = Field(None, examples=["https://github.com/aaravsharma"])

    @field_validator("full_name", "roll_number", "branch", mode="before")
    @classmethod
    def strip_strings(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("skills", mode="before")
    @classmethod
    def parse_skills_input(cls, v):
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(s).strip() for s in parsed if str(s).strip()]
            except Exception:
                pass
            return [s.strip() for s in v.split(",") if s.strip()]
        elif isinstance(v, list):
            return [str(s).strip() for s in v if str(s).strip()]
        return v or []

    @field_validator("cgpa", mode="before")
    @classmethod
    def normalize_cgpa(cls, v):
        if v is not None and v != "":
            try:
                val = float(v)
                if 10.0 < val <= 100.0:
                    val = round(val / 10.0, 2)
                return val
            except (ValueError, TypeError):
                pass
        return v

    @field_validator("graduation_year", mode="before")
    @classmethod
    def normalize_grad_year(cls, v):
        if v is not None and v != "":
            try:
                val = int(v)
                if 0 <= val <= 99:
                    val = 2000 + val
                return val
            except (ValueError, TypeError):
                pass
        return v

    @field_validator("phone", "linkedin_url", "github_url", "resume_text", mode="before")
    @classmethod
    def clean_optional_student_fields(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v


class StudentProfileCreate(StudentProfileBase):
    pass


class StudentProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    branch: Optional[str] = Field(None, min_length=2, max_length=100)
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    graduation_year: Optional[int] = Field(None, ge=2000, le=2040)
    skills: Optional[List[str]] = None
    resume_text: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None


class StudentProfileResponse(StudentProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("skills", mode="before")
    @classmethod
    def parse_skills_list(cls, v):
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [s.strip() for s in v.split(",") if s.strip()]
        return v or []


# -------------------------------------------------------------
# Recruiter Profile Schemas
# -------------------------------------------------------------
class RecruiterProfileBase(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255, examples=["Google India"])
    company_website: Optional[str] = Field(None, examples=["https://careers.google.com"])
    industry: Optional[str] = Field(None, examples=["Software & Cloud Infrastructure"])
    contact_person: str = Field(..., min_length=2, max_length=255, examples=["Priya Menon"])
    contact_phone: Optional[str] = Field(None, examples=["+91-9123456780"])

    @field_validator("company_name", "contact_person", mode="before")
    @classmethod
    def strip_recruiter_strings(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("company_website", "industry", "contact_phone", mode="before")
    @classmethod
    def clean_optional_recruiter_fields(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v


class RecruiterProfileCreate(RecruiterProfileBase):
    pass


class RecruiterProfileUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=2, max_length=255)
    company_website: Optional[str] = None
    industry: Optional[str] = None
    contact_person: Optional[str] = Field(None, min_length=2, max_length=255)
    contact_phone: Optional[str] = None


class RecruiterProfileResponse(RecruiterProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# Job Posting Schemas
# -------------------------------------------------------------
class JobPostingBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, examples=["Graduate Backend Software Engineer"])
    description: str = Field(
        ...,
        min_length=20,
        examples=["We are seeking passionate backend engineers proficient in Python, FastAPI, and relational databases."]
    )
    location: str = Field(..., examples=["Bangalore, Karnataka / Hybrid"])
    job_type: str = Field(default="Full-Time", examples=["Full-Time"])
    ctc: float = Field(..., gt=0.0, examples=[18.5], description="Annual Cost to Company in LPA (Lakhs INR)")
    min_cgpa: float = Field(default=0.0, ge=0.0, le=10.0, examples=[7.5], description="Minimum CGPA required to apply")
    eligible_branches: List[str] = Field(
        default_factory=list,
        examples=[["Computer Science and Engineering", "Information Technology", "Electronics and Communication"]]
    )
    required_skills: List[str] = Field(
        default_factory=list,
        examples=[["Python", "FastAPI", "PostgreSQL", "Docker"]]
    )
    application_deadline: Optional[datetime] = Field(None, examples=["2026-12-31T23:59:59"])
    is_active: bool = Field(default=True, examples=[True])


class JobPostingCreate(JobPostingBase):
    pass


class JobPostingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=20)
    location: Optional[str] = None
    job_type: Optional[str] = None
    ctc: Optional[float] = Field(None, gt=0.0)
    min_cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    eligible_branches: Optional[List[str]] = None
    required_skills: Optional[List[str]] = None
    application_deadline: Optional[datetime] = None
    is_active: Optional[bool] = None


class JobPostingResponse(JobPostingBase):
    id: int
    recruiter_id: int
    company_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("eligible_branches", mode="before")
    @classmethod
    def parse_eligible_branches(cls, v):
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [b.strip() for b in v.split(",") if b.strip()]
        return v or []

    @field_validator("required_skills", mode="before")
    @classmethod
    def parse_required_skills(cls, v):
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [s.strip() for s in v.split(",") if s.strip()]
        return v or []


# -------------------------------------------------------------
# Job Application Schemas
# -------------------------------------------------------------
class JobApplicationCreate(BaseModel):
    job_id: int = Field(..., examples=[1], description="ID of the job posting to apply for")
    notes: Optional[str] = Field(None, examples=["Passionate about cloud-native backend development and distributed databases."])
    custom_resume_text: Optional[str] = Field(None, description="Optional custom resume text to evaluate for this specific job application")


class JobApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus = Field(..., examples=[ApplicationStatus.SHORTLISTED])
    recruiter_feedback: Optional[str] = Field(
        None,
        examples=["Profile matches backend requirements well. Moving forward to technical interview."]
    )


class JobApplicationResponse(BaseModel):
    id: int
    job_id: int
    student_id: int
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    student_name: Optional[str] = None
    student_roll_number: Optional[str] = None
    student_branch: Optional[str] = None
    student_cgpa: Optional[float] = None
    status: ApplicationStatus
    ats_score: Optional[float] = None
    ats_feedback: Optional[str] = None
    notes: Optional[str] = None
    recruiter_feedback: Optional[str] = None
    applied_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# External Integration: Groq ATS Compatibility Schemas
# -------------------------------------------------------------
class ATSEvaluationRequest(BaseModel):
    job_id: int = Field(..., examples=[1], description="Target Job Posting ID")
    student_id: Optional[int] = Field(
        None,
        examples=[1],
        description="Student Profile ID (Required for Recruiter/Admin; optional for Student evaluating their own profile)"
    )
    custom_resume_text: Optional[str] = Field(
        None,
        examples=["Detailed resume draft for comparison against job requirements."]
    )


class ATSEvaluationResponse(BaseModel):
    job_id: int
    job_title: str
    student_id: int
    student_name: str
    ats_score: float = Field(..., ge=0.0, le=100.0, examples=[87.5], description="ATS Match Score from 0 to 100")
    match_verdict: str = Field(..., examples=["Strong Match"])
    meets_eligibility_criteria: bool = Field(..., examples=[True])
    eligibility_notes: str = Field(..., examples=["Meets CGPA requirement (8.75 >= 7.50) and Department requirement."])
    matching_skills: List[str] = Field(default_factory=list, examples=[["Python", "FastAPI", "PostgreSQL", "Docker"]])
    missing_skills: List[str] = Field(default_factory=list, examples=[["Kubernetes", "AWS"]])
    detailed_feedback: str = Field(
        ...,
        examples=["The candidate demonstrates strong experience with the primary stack (FastAPI, PostgreSQL)."]
    )
    recommendations: List[str] = Field(
        default_factory=list,
        examples=[["Highlight CI/CD and cloud deployment experiences in projects."]]
    )
