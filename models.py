import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum as SqlEnum,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from database import Base


def utc_now():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    """Strict three-role Role-Based Access Control (RBAC)."""
    STUDENT = "student"
    RECRUITER = "recruiter"
    ADMIN = "admin"  # Admin / Placement Officer


class ApplicationStatus(str, enum.Enum):
    """Job application lifecycle statuses."""
    APPLIED = "applied"
    SHORTLISTED = "shortlisted"
    INTERVIEWING = "interviewing"
    OFFERED = "offered"
    REJECTED = "rejected"


class User(Base):
    """Base user entity for authentication and RBAC authorization."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(
        SqlEnum(UserRole, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=UserRole.STUDENT
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # 1:1 Relationships
    student_profile = relationship(
        "StudentProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    recruiter_profile = relationship(
        "RecruiterProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )


class StudentProfile(Base):
    """Profile entity for students seeking campus placements."""
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    roll_number = Column(String(50), unique=True, index=True, nullable=False)
    branch = Column(String(100), nullable=False, index=True)
    cgpa = Column(Float, nullable=False, index=True)
    graduation_year = Column(Integer, nullable=False)
    skills = Column(Text, nullable=False)  # JSON-encoded array or comma-delimited string
    resume_text = Column(Text, nullable=True)  # Resume content used for Groq ATS evaluation
    phone = Column(String(20), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    github_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    applications = relationship(
        "JobApplication",
        back_populates="student",
        cascade="all, delete-orphan"
    )


class RecruiterProfile(Base):
    """Profile entity for company recruiters posting jobs and evaluating applicants."""
    __tablename__ = "recruiter_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String(255), nullable=False, index=True)
    company_website = Column(String(255), nullable=True)
    industry = Column(String(100), nullable=True)
    contact_person = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="recruiter_profile")
    job_postings = relationship(
        "JobPosting",
        back_populates="recruiter",
        cascade="all, delete-orphan"
    )


class JobPosting(Base):
    """Job vacancy entity created by Recruiters or Admin/Placement Officers."""
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("recruiter_profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    location = Column(String(150), nullable=False, index=True)
    job_type = Column(String(50), default="Full-Time", nullable=False)  # Full-Time, Internship, Remote
    ctc = Column(Float, nullable=False, index=True)  # Cost to Company in LPA (Lakhs Per Annum)
    min_cgpa = Column(Float, default=0.0, nullable=False)  # Minimum CGPA eligibility criteria
    eligible_branches = Column(Text, nullable=True)  # JSON-encoded array of eligible branches
    required_skills = Column(Text, nullable=True)  # JSON-encoded array of required skills
    application_deadline = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    recruiter = relationship("RecruiterProfile", back_populates="job_postings")
    applications = relationship(
        "JobApplication",
        back_populates="job",
        cascade="all, delete-orphan"
    )


class JobApplication(Base):
    """Entity capturing a Student's application for a JobPosting."""
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    status = Column(
        SqlEnum(ApplicationStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=ApplicationStatus.APPLIED,
        nullable=False
    )
    ats_score = Column(Float, nullable=True)  # Groq AI ATS Compatibility Score (0 - 100)
    ats_feedback = Column(Text, nullable=True)  # Groq AI ATS analysis summary
    notes = Column(Text, nullable=True)  # Student cover note or remarks
    recruiter_feedback = Column(Text, nullable=True)  # Feedback provided by recruiter upon status update
    applied_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("job_id", "student_id", name="uq_job_student_application"),
    )

    # Relationships
    job = relationship("JobPosting", back_populates="applications")
    student = relationship("StudentProfile", back_populates="applications")
