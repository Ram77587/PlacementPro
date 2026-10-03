"""Seeds initial demo data (Admin, Recruiter, Student, Profiles, and Job Postings)
into the live Supabase / PostgreSQL database so the frontend works immediately.

Run with:
    python seed_data.py
"""
import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
from models import (
    User,
    UserRole,
    StudentProfile,
    RecruiterProfile,
    JobPosting,
    JobApplication,
    ApplicationStatus,
)
from auth import hash_password


def seed():
    db: Session = SessionLocal()
    print("=" * 60)
    print(" Seeding PlacementPro Demo Accounts & Data into Supabase")
    print("=" * 60)

    try:
        # 1. Admin Officer
        admin_email = "officer@placementpro.edu"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                hashed_password=hash_password("AdminOfficer2026!"),
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"[+] Created Admin: {admin_email}")
        else:
            print(f"[*] Admin already exists: {admin_email}")

        # 2. Recruiter User & Profile
        recruiter_email = "talent@techcorp.com"
        recruiter_user = db.query(User).filter(User.email == recruiter_email).first()
        if not recruiter_user:
            recruiter_user = User(
                email=recruiter_email,
                hashed_password=hash_password("RecruiterPass123!"),
                role=UserRole.RECRUITER,
                is_active=True,
            )
            db.add(recruiter_user)
            db.commit()
            db.refresh(recruiter_user)
            print(f"[+] Created Recruiter: {recruiter_email}")
        else:
            print(f"[*] Recruiter user already exists: {recruiter_email}")

        recruiter_profile = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == recruiter_user.id).first()
        if not recruiter_profile:
            recruiter_profile = RecruiterProfile(
                user_id=recruiter_user.id,
                company_name="TechCorp Innovations",
                company_website="https://techcorp.example.com",
                industry="Cloud & AI Infrastructure",
                contact_person="Sarah Jenkins",
                contact_phone="+1-555-0199",
            )
            db.add(recruiter_profile)
            db.commit()
            db.refresh(recruiter_profile)
            print("[+] Created Recruiter Profile: TechCorp Innovations")

        # 3. Student User & Profile
        student_email = "aarav.student@placementpro.edu"
        student_user = db.query(User).filter(User.email == student_email).first()
        if not student_user:
            student_user = User(
                email=student_email,
                hashed_password=hash_password("SecurePass123!"),
                role=UserRole.STUDENT,
                is_active=True,
            )
            db.add(student_user)
            db.commit()
            db.refresh(student_user)
            print(f"[+] Created Student: {student_email}")
        else:
            print(f"[*] Student user already exists: {student_email}")

        student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == student_user.id).first()
        if not student_profile:
            student_profile = StudentProfile(
                user_id=student_user.id,
                full_name="Aarav Sharma",
                roll_number="CS2026-042",
                branch="Computer Science and Engineering",
                cgpa=8.85,
                graduation_year=2026,
                skills=json.dumps(["Python", "FastAPI", "React", "Next.js", "PostgreSQL", "Docker", "Machine Learning"]),
                resume_text=(
                    "Senior computer science undergraduate with strong foundations in algorithms, distributed systems, "
                    "and full-stack software development. Built automated placement platform with FastAPI, PostgreSQL, and Next.js. "
                    "Experienced with Docker containerization, REST API design, SQLAlchemy ORM, and integrating Groq AI LLM models."
                ),
                phone="+91-9876543210",
                linkedin_url="https://linkedin.com/in/aarav-sharma-demo",
                github_url="https://github.com/aaravsharma-demo",
            )
            db.add(student_profile)
            db.commit()
            db.refresh(student_profile)
            print("[+] Created Student Profile: Aarav Sharma")

        # 4. Sample Job Postings
        existing_jobs = db.query(JobPosting).filter(JobPosting.recruiter_id == recruiter_profile.id).all()
        if not existing_jobs:
            job1 = JobPosting(
                recruiter_id=recruiter_profile.id,
                title="Full Stack Software Engineer",
                description=(
                    "We are seeking an ambitious Software Engineer to build scalable microservices and responsive web applications. "
                    "You will work with FastAPI backends, PostgreSQL databases, and modern React/Next.js interfaces."
                ),
                location="Bengaluru / Remote",
                job_type="Full-Time",
                ctc=14.5,
                min_cgpa=7.5,
                eligible_branches=json.dumps(["Computer Science and Engineering", "Information Technology", "Electronics & Communication"]),
                required_skills=json.dumps(["Python", "FastAPI", "React", "PostgreSQL", "Docker"]),
                application_deadline=datetime.now(timezone.utc) + timedelta(days=30),
                is_active=True,
            )
            job2 = JobPosting(
                recruiter_id=recruiter_profile.id,
                title="AI / ML Engineer",
                description=(
                    "Join our core AI research group. You will train, optimize, and deploy LLM applications, retrieval-augmented systems, "
                    "and evaluation pipelines using state-of-the-art architectures."
                ),
                location="Hyderabad / Hybrid",
                job_type="Full-Time",
                ctc=18.0,
                min_cgpa=8.0,
                eligible_branches=json.dumps(["Computer Science and Engineering", "Data Science", "Artificial Intelligence"]),
                required_skills=json.dumps(["Python", "PyTorch", "Machine Learning", "FastAPI", "Docker"]),
                application_deadline=datetime.now(timezone.utc) + timedelta(days=45),
                is_active=True,
            )
            db.add_all([job1, job2])
            db.commit()
            print("[+] Created Sample Job Postings: 'Full Stack Software Engineer' and 'AI / ML Engineer'")

        print("\n" + "=" * 60)
        print(" SEEDING COMPLETE: Database populated with demo accounts!")
        print("=" * 60)
        print("Demo Credentials:")
        print("  - Student:   aarav.student@placementpro.edu  /  SecurePass123!")
        print("  - Recruiter: talent@techcorp.com             /  RecruiterPass123!")
        print("  - Admin:     officer@placementpro.edu        /  AdminOfficer2026!")
        print("=" * 60)

    except Exception as exc:
        db.rollback()
        print(f"[!] Error seeding data: {exc}")
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    seed()
