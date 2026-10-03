-- ====================================================================
-- PlacementPro: Supabase PostgreSQL Database Schema
-- ====================================================================
-- Note: Supabase Table Editor / Starter templates create a default 
-- 'public.users' table with a 'UUID' primary key by default.
-- PlacementPro uses integer primary keys (SERIAL) across all tables.
-- The DROP statements below ensure any conflicting placeholder tables 
-- are cleanly replaced with the schema expected by the FastAPI backend.
-- ====================================================================

-- 0. Clean up existing / conflicting tables
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.job_postings CASCADE;
DROP TABLE IF EXISTS public.recruiter_profiles CASCADE;
DROP TABLE IF EXISTS public.student_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Users Table (public.users)
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'recruiter', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON public.users(email);

-- 2. Student Profiles Table
CREATE TABLE public.student_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    branch VARCHAR(100) NOT NULL,
    cgpa DOUBLE PRECISION NOT NULL,
    graduation_year INTEGER NOT NULL,
    skills TEXT NOT NULL,
    resume_text TEXT,
    phone VARCHAR(20),
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_profiles_roll ON public.student_profiles(roll_number);
CREATE INDEX idx_student_profiles_branch ON public.student_profiles(branch);
CREATE INDEX idx_student_profiles_cgpa ON public.student_profiles(cgpa);

-- 3. Recruiter Profiles Table
CREATE TABLE public.recruiter_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    company_website VARCHAR(255),
    industry VARCHAR(100),
    contact_person VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recruiter_profiles_company ON public.recruiter_profiles(company_name);

-- 4. Job Postings Table
CREATE TABLE public.job_postings (
    id SERIAL PRIMARY KEY,
    recruiter_id INTEGER NOT NULL REFERENCES public.recruiter_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(150) NOT NULL,
    job_type VARCHAR(50) NOT NULL DEFAULT 'Full-Time',
    ctc DOUBLE PRECISION NOT NULL,
    min_cgpa DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    eligible_branches TEXT,
    required_skills TEXT,
    application_deadline TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_postings_title ON public.job_postings(title);
CREATE INDEX idx_job_postings_location ON public.job_postings(location);
CREATE INDEX idx_job_postings_ctc ON public.job_postings(ctc);

-- 5. Job Applications Table
CREATE TABLE public.job_applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'interviewing', 'offered', 'rejected')),
    ats_score DOUBLE PRECISION,
    ats_feedback TEXT,
    notes TEXT,
    recruiter_feedback TEXT,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_job_student_application UNIQUE (job_id, student_id)
);

CREATE INDEX idx_job_applications_job ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_student ON public.job_applications(student_id);
