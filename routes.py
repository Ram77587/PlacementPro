import json
import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
from models import (
    User,
    UserRole,
    StudentProfile,
    RecruiterProfile,
    JobPosting,
    JobApplication,
    ApplicationStatus
)
from schemas import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserResponse,
    StudentProfileCreate,
    StudentProfileUpdate,
    StudentProfileResponse,
    RecruiterProfileCreate,
    RecruiterProfileUpdate,
    RecruiterProfileResponse,
    JobPostingCreate,
    JobPostingUpdate,
    JobPostingResponse,
    JobApplicationCreate,
    JobApplicationStatusUpdate,
    JobApplicationResponse,
    ATSEvaluationRequest,
    ATSEvaluationResponse,
    MessageResponse
)
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_roles,
    get_current_student,
    get_current_recruiter,
    get_current_admin,
    get_recruiter_or_admin
)
from ats_service import evaluate_ats_compatibility, check_basic_eligibility

logger = logging.getLogger("placementpro.routes")

router = APIRouter()


# ============================================================================
# 1. AUTHENTICATION & SECURITY ROUTES (/auth)
# ============================================================================
auth_router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])


@auth_router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new User with Role",
    description="Registers a new user with one of three roles: 'student', 'recruiter', or 'admin'."
)
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with email '{payload.email}' already exists. Please sign in instead."
        )

    # Hash password securely with Bcrypt
    hashed_pwd = hash_password(payload.password)

    new_user = User(
        email=payload.email.lower().strip(),
        hashed_password=hashed_pwd,
        role=payload.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        role=new_user.role,
        is_active=new_user.is_active,
        created_at=new_user.created_at,
        has_profile=False
    )


@auth_router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Login & Obtain JWT Access Token",
    description="Authenticates credentials and returns a signed JWT access token containing identity and role claims."
)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password combination.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently inactive. Please contact administration."
        )

    # Issue JWT token
    token_claims = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value
    }
    access_token = create_access_token(data=token_claims)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role
    )


@auth_router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current Authenticated User Identity",
    description="Retrieves the current authenticated user's account details and verifies profile presence."
)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    has_profile = False
    if current_user.role == UserRole.STUDENT and current_user.student_profile:
        has_profile = True
    elif current_user.role == UserRole.RECRUITER and current_user.recruiter_profile:
        has_profile = True
    elif current_user.role == UserRole.ADMIN:
        has_profile = True

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        has_profile=has_profile
    )


# ============================================================================
# 2. PROFILES CRUD ROUTES (/profiles)
# ============================================================================
profiles_router = APIRouter(prefix="/profiles", tags=["Profiles Management"])


# --- Student Profiles ---

@profiles_router.post(
    "/student",
    response_model=StudentProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Student Profile (Student Only)",
    description="Allows an authenticated student to create their academic and placement profile."
)
def create_student_profile(
    payload: StudentProfileCreate,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    # Verify student does not already have a profile
    if current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student profile already exists for this user. Use PUT to update."
        )

    # Check unique roll number
    existing_roll = db.query(StudentProfile).filter(StudentProfile.roll_number == payload.roll_number.strip()).first()
    if existing_roll:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Roll number '{payload.roll_number}' is already registered."
        )

    new_profile = StudentProfile(
        user_id=current_user.id,
        full_name=payload.full_name.strip(),
        roll_number=payload.roll_number.strip(),
        branch=payload.branch.strip(),
        cgpa=payload.cgpa,
        graduation_year=payload.graduation_year,
        skills=json.dumps(payload.skills),
        resume_text=payload.resume_text,
        phone=payload.phone,
        linkedin_url=payload.linkedin_url,
        github_url=payload.github_url
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile


@profiles_router.get(
    "/student/me",
    response_model=StudentProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get My Student Profile (Student Only)"
)
def get_my_student_profile(
    current_user: User = Depends(get_current_student)
):
    if not current_user.student_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile has not been created yet."
        )
    return current_user.student_profile


@profiles_router.get(
    "/student/{profile_id}",
    response_model=StudentProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Student Profile by ID (Owner, Recruiter, or Admin)"
)
def get_student_profile_by_id(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile with ID {profile_id} was not found."
        )

    # Authorization: Student can only view their own profile; Recruiters and Admin can view any
    if current_user.role == UserRole.STUDENT and profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot view other students' profiles."
        )

    return profile


@profiles_router.put(
    "/student/me",
    response_model=StudentProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update My Student Profile (Student Only)"
)
def update_my_student_profile(
    payload: StudentProfileUpdate,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = current_user.student_profile
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found. Please create one first."
        )

    update_data = payload.model_dump(exclude_unset=True)
    if "skills" in update_data and update_data["skills"] is not None:
        update_data["skills"] = json.dumps(update_data["skills"])

    for key, value in update_data.items():
        setattr(profile, key, value)

    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)
    return profile


@profiles_router.delete(
    "/student/{profile_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Student Profile (Owner or Admin)"
)
def delete_student_profile(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile with ID {profile_id} not found."
        )

    if current_user.role != UserRole.ADMIN and profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You can only delete your own profile."
        )

    db.delete(profile)
    db.commit()
    return MessageResponse(message=f"Student profile {profile_id} successfully deleted.")


# --- Recruiter Profiles ---

@profiles_router.post(
    "/recruiter",
    response_model=RecruiterProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Recruiter Profile (Recruiter Only)"
)
def create_recruiter_profile(
    payload: RecruiterProfileCreate,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db)
):
    if current_user.recruiter_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Recruiter profile already exists for this user. Use PUT to update."
        )

    new_profile = RecruiterProfile(
        user_id=current_user.id,
        company_name=payload.company_name.strip(),
        company_website=payload.company_website,
        industry=payload.industry,
        contact_person=payload.contact_person.strip(),
        contact_phone=payload.contact_phone
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile


@profiles_router.get(
    "/recruiter/me",
    response_model=RecruiterProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get My Recruiter Profile (Recruiter Only)"
)
def get_my_recruiter_profile(
    current_user: User = Depends(get_current_recruiter)
):
    if not current_user.recruiter_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recruiter profile has not been created yet."
        )
    return current_user.recruiter_profile


@profiles_router.get(
    "/recruiter/{profile_id}",
    response_model=RecruiterProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Recruiter Profile by ID"
)
def get_recruiter_profile_by_id(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(RecruiterProfile).filter(RecruiterProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recruiter profile with ID {profile_id} was not found."
        )
    return profile


@profiles_router.put(
    "/recruiter/me",
    response_model=RecruiterProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Update My Recruiter Profile (Recruiter Only)"
)
def update_my_recruiter_profile(
    payload: RecruiterProfileUpdate,
    current_user: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db)
):
    profile = current_user.recruiter_profile
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recruiter profile not found. Please create one first."
        )

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)
    return profile


@profiles_router.delete(
    "/recruiter/{profile_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Recruiter Profile (Owner or Admin)"
)
def delete_recruiter_profile(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(RecruiterProfile).filter(RecruiterProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recruiter profile with ID {profile_id} not found."
        )

    if current_user.role != UserRole.ADMIN and profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You can only delete your own profile."
        )

    db.delete(profile)
    db.commit()
    return MessageResponse(message=f"Recruiter profile {profile_id} successfully deleted.")


# ============================================================================
# 3. JOB POSTINGS CRUD & FILTERING ROUTES (/jobs)
# ============================================================================
jobs_router = APIRouter(prefix="/jobs", tags=["Job Postings Management"])


def enrich_job_response(job: JobPosting) -> JobPostingResponse:
    company_name = job.recruiter.company_name if job.recruiter else "Placement Office"
    return JobPostingResponse(
        id=job.id,
        recruiter_id=job.recruiter_id,
        company_name=company_name,
        title=job.title,
        description=job.description,
        location=job.location,
        job_type=job.job_type,
        ctc=job.ctc,
        min_cgpa=job.min_cgpa,
        eligible_branches=job.eligible_branches,  # Validator in schema parses JSON/list
        required_skills=job.required_skills,
        application_deadline=job.application_deadline,
        is_active=job.is_active,
        created_at=job.created_at,
        updated_at=job.updated_at
    )


@jobs_router.post(
    "",
    response_model=JobPostingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a New Job Posting (Recruiter or Admin)"
)
def create_job_posting(
    payload: JobPostingCreate,
    current_user: User = Depends(get_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    # Recruiter must have a completed RecruiterProfile
    if current_user.role == UserRole.RECRUITER:
        if not current_user.recruiter_profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please complete your recruiter profile before posting jobs."
            )
        recruiter_id = current_user.recruiter_profile.id
    else:
        # If Admin is creating, ensure they associate or use an existing recruiter profile or admin fallback
        first_recruiter = db.query(RecruiterProfile).first()
        if not first_recruiter:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one RecruiterProfile must exist in the system before Admin can create job postings."
            )
        recruiter_id = first_recruiter.id

    new_job = JobPosting(
        recruiter_id=recruiter_id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        location=payload.location.strip(),
        job_type=payload.job_type,
        ctc=payload.ctc,
        min_cgpa=payload.min_cgpa,
        eligible_branches=json.dumps(payload.eligible_branches),
        required_skills=json.dumps(payload.required_skills),
        application_deadline=payload.application_deadline,
        is_active=payload.is_active
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return enrich_job_response(new_job)


@jobs_router.get(
    "",
    response_model=List[JobPostingResponse],
    status_code=status.HTTP_200_OK,
    summary="List and Filter Job Postings",
    description="Search and filter job postings by query parameters: keyword search, location, min/max CTC, branch, and active status."
)
def list_jobs(
    search: Optional[str] = Query(None, description="Search term for title or description"),
    location: Optional[str] = Query(None, description="Filter by location (case-insensitive substring)"),
    min_ctc: Optional[float] = Query(None, ge=0.0, description="Minimum CTC in LPA"),
    max_ctc: Optional[float] = Query(None, ge=0.0, description="Maximum CTC in LPA"),
    job_type: Optional[str] = Query(None, description="Filter by job type (Full-Time, Internship, Remote)"),
    branch: Optional[str] = Query(None, description="Filter by eligible branch name"),
    is_active: Optional[bool] = Query(True, description="Filter active jobs (default: True)"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(20, ge=1, le=100, description="Pagination limit"),
    db: Session = Depends(get_db)
):
    query = db.query(JobPosting)

    if is_active is not None:
        query = query.filter(JobPosting.is_active == is_active)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                JobPosting.title.ilike(search_fmt),
                JobPosting.description.ilike(search_fmt),
                JobPosting.required_skills.ilike(search_fmt)
            )
        )

    if location:
        query = query.filter(JobPosting.location.ilike(f"%{location.strip()}%"))

    if min_ctc is not None:
        query = query.filter(JobPosting.ctc >= min_ctc)

    if max_ctc is not None:
        query = query.filter(JobPosting.ctc <= max_ctc)

    if job_type:
        query = query.filter(JobPosting.job_type.ilike(f"%{job_type.strip()}%"))

    if branch:
        query = query.filter(JobPosting.eligible_branches.ilike(f"%{branch.strip()}%"))

    jobs = query.order_by(JobPosting.created_at.desc()).offset(skip).limit(limit).all()
    return [enrich_job_response(j) for j in jobs]


@jobs_router.get(
    "/{job_id}",
    response_model=JobPostingResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Job Posting by ID"
)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job posting with ID {job_id} was not found."
        )
    return enrich_job_response(job)


@jobs_router.put(
    "/{job_id}",
    response_model=JobPostingResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Job Posting (Owner Recruiter or Admin)"
)
def update_job_posting(
    job_id: int,
    payload: JobPostingUpdate,
    current_user: User = Depends(get_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job posting with ID {job_id} not found."
        )

    # Check permission: Must be owner recruiter or Admin
    if current_user.role == UserRole.RECRUITER:
        if not current_user.recruiter_profile or job.recruiter_id != current_user.recruiter_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You cannot modify job postings owned by another recruiter."
            )

    update_data = payload.model_dump(exclude_unset=True)
    if "eligible_branches" in update_data and update_data["eligible_branches"] is not None:
        update_data["eligible_branches"] = json.dumps(update_data["eligible_branches"])
    if "required_skills" in update_data and update_data["required_skills"] is not None:
        update_data["required_skills"] = json.dumps(update_data["required_skills"])

    for key, value in update_data.items():
        setattr(job, key, value)

    job.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(job)
    return enrich_job_response(job)


@jobs_router.delete(
    "/{job_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Job Posting (Owner Recruiter or Admin)"
)
def delete_job_posting(
    job_id: int,
    current_user: User = Depends(get_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job posting with ID {job_id} not found."
        )

    if current_user.role == UserRole.RECRUITER:
        if not current_user.recruiter_profile or job.recruiter_id != current_user.recruiter_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You cannot delete job postings owned by another recruiter."
            )

    db.delete(job)
    db.commit()
    return MessageResponse(message=f"Job posting {job_id} ('{job.title}') successfully deleted.")


# ============================================================================
# 4. JOB APPLICATIONS CRUD & ELIGIBILITY VALIDATION ROUTES (/applications)
# ============================================================================
applications_router = APIRouter(prefix="/applications", tags=["Job Applications Management"])


def enrich_application_response(app: JobApplication) -> JobApplicationResponse:
    return JobApplicationResponse(
        id=app.id,
        job_id=app.job_id,
        student_id=app.student_id,
        job_title=app.job.title if app.job else None,
        company_name=app.job.recruiter.company_name if app.job and app.job.recruiter else None,
        student_name=app.student.full_name if app.student else None,
        student_roll_number=app.student.roll_number if app.student else None,
        student_branch=app.student.branch if app.student else None,
        student_cgpa=app.student.cgpa if app.student else None,
        status=app.status,
        ats_score=app.ats_score,
        ats_feedback=app.ats_feedback,
        notes=app.notes,
        recruiter_feedback=app.recruiter_feedback,
        applied_at=app.applied_at,
        updated_at=app.updated_at
    )


@applications_router.post(
    "",
    response_model=JobApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Apply for a Job Posting (Student Only with Eligibility Checks)",
    description="Validates student profile existence, job active status, deadline, and eligibility criteria (CGPA and Branch) before creating application."
)
def apply_for_job(
    payload: JobApplicationCreate,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your student profile before applying for jobs."
        )

    job = db.query(JobPosting).filter(JobPosting.id == payload.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job posting with ID {payload.job_id} does not exist."
        )

    if not job.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This job posting is inactive and no longer accepting applications."
        )

    # Check application deadline
    if job.application_deadline and job.application_deadline < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The application deadline ({job.application_deadline.strftime('%Y-%m-%d %H:%M')}) has passed."
        )

    # Check duplicate application (409 Conflict)
    existing_application = db.query(JobApplication).filter(
        JobApplication.job_id == job.id,
        JobApplication.student_id == student.id
    ).first()
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"You have already submitted an application for Job ID {job.id} ('{job.title}')."
        )

    # Strict Business Rule Validation: Eligibility Check (CGPA & Branch)
    is_eligible, eligibility_reason = check_basic_eligibility(student, job)
    if not is_eligible:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Eligibility criteria not met: {eligibility_reason}"
        )

    # Calculate initial ATS score strictly based on the candidate's resume and job requirements
    ats_result = evaluate_ats_compatibility(student, job, custom_resume=payload.custom_resume_text)

    new_application = JobApplication(
        job_id=job.id,
        student_id=student.id,
        status=ApplicationStatus.APPLIED,
        ats_score=ats_result.ats_score,
        ats_feedback=f"{ats_result.match_verdict} ({ats_result.ats_score}%): {ats_result.detailed_feedback[:250]}",
        notes=payload.notes
    )
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    return enrich_application_response(new_application)


@applications_router.get(
    "",
    response_model=List[JobApplicationResponse],
    status_code=status.HTTP_200_OK,
    summary="List Applications with RBAC Scoping & Query Filters",
    description="Returns applications filtered by user role: Students view their own, Recruiters view applications for their jobs, and Admins view all."
)
def list_applications(
    job_id: Optional[int] = Query(None, description="Filter applications for a specific job ID"),
    status_filter: Optional[ApplicationStatus] = Query(None, alias="status", description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(JobApplication)

    # Role-based query scoping
    if current_user.role == UserRole.STUDENT:
        if not current_user.student_profile:
            return []
        query = query.filter(JobApplication.student_id == current_user.student_profile.id)
    elif current_user.role == UserRole.RECRUITER:
        if not current_user.recruiter_profile:
            return []
        # Filter applications belonging to jobs posted by this recruiter
        recruiter_job_ids = [j.id for j in current_user.recruiter_profile.job_postings]
        query = query.filter(JobApplication.job_id.in_(recruiter_job_ids))
    # Admin has unfiltered access across all applications

    if job_id:
        query = query.filter(JobApplication.job_id == job_id)

    if status_filter:
        query = query.filter(JobApplication.status == status_filter)

    applications = query.order_by(JobApplication.applied_at.desc()).offset(skip).limit(limit).all()
    return [enrich_application_response(app) for app in applications]


@applications_router.get(
    "/{application_id}",
    response_model=JobApplicationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Job Application Details by ID"
)
def get_application_by_id(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job application with ID {application_id} was not found."
        )

    # Authorization verification
    if current_user.role == UserRole.STUDENT:
        if not current_user.student_profile or app.student_id != current_user.student_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You cannot view applications submitted by other students."
            )
    elif current_user.role == UserRole.RECRUITER:
        if not current_user.recruiter_profile or app.job.recruiter_id != current_user.recruiter_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You can only view applications for your own job postings."
            )

    return enrich_application_response(app)


@applications_router.put(
    "/{application_id}/status",
    response_model=JobApplicationResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Application Status & Recruiter Feedback (Recruiter or Admin)"
)
def update_application_status(
    application_id: int,
    payload: JobApplicationStatusUpdate,
    current_user: User = Depends(get_recruiter_or_admin),
    db: Session = Depends(get_db)
):
    app = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job application with ID {application_id} not found."
        )

    # Verify recruiter ownership
    if current_user.role == UserRole.RECRUITER:
        if not current_user.recruiter_profile or app.job.recruiter_id != current_user.recruiter_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You can only update applications for your own job postings."
            )

    app.status = payload.status
    if payload.recruiter_feedback is not None:
        app.recruiter_feedback = payload.recruiter_feedback

    app.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(app)
    return enrich_application_response(app)


@applications_router.delete(
    "/{application_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Withdraw Application (Student Owner or Admin)"
)
def withdraw_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job application with ID {application_id} not found."
        )

    if current_user.role == UserRole.STUDENT:
        if not current_user.student_profile or app.student_id != current_user.student_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You can only withdraw your own applications."
            )
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Recruiters cannot delete applications."
        )

    db.delete(app)
    db.commit()
    return MessageResponse(message=f"Application {application_id} successfully withdrawn/deleted.")


# ============================================================================
# 5. GROQ AI ATS COMPATIBILITY SCORING ROUTE (/ats)
# ============================================================================
ats_router = APIRouter(prefix="/ats", tags=["AI ATS Compatibility Scoring"])


@ats_router.post(
    "/evaluate",
    response_model=ATSEvaluationResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate ATS Compatibility Score & Feedback using Groq API",
    description="Compares student skills, resume, and academics against a Job Posting description using the Groq Python client (llama-3.3-70b-versatile)."
)
def evaluate_student_ats(
    payload: ATSEvaluationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve Job
    job = db.query(JobPosting).filter(JobPosting.id == payload.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job posting with ID {payload.job_id} not found."
        )

    # Determine Student Profile
    if current_user.role == UserRole.STUDENT:
        if not current_user.student_profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please complete your student profile before requesting ATS scoring."
            )
        # If student provided student_id, ensure it's their own
        if payload.student_id and payload.student_id != current_user.student_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only evaluate ATS score for their own profile."
            )
        student = current_user.student_profile
    else:
        # Recruiter or Admin evaluating an applicant or student
        if not payload.student_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Field 'student_id' is required for Recruiter/Admin ATS evaluation."
            )
        student = db.query(StudentProfile).filter(StudentProfile.id == payload.student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student profile with ID {payload.student_id} not found."
            )

    # Call Groq ATS Service
    ats_result = evaluate_ats_compatibility(
        student=student,
        job=job,
        custom_resume=payload.custom_resume_text
    )

    # If an application already exists between this student and job, update the score and feedback
    existing_app = db.query(JobApplication).filter(
        JobApplication.job_id == job.id,
        JobApplication.student_id == student.id
    ).first()
    if existing_app:
        existing_app.ats_score = ats_result.ats_score
        existing_app.ats_feedback = f"{ats_result.match_verdict}: {ats_result.detailed_feedback[:300]}"
        db.commit()

    return ats_result
