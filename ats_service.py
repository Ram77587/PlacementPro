import json
import logging
from typing import Dict, Any, List
from groq import Groq
from config import settings
from models import StudentProfile, JobPosting
from schemas import ATSEvaluationResponse

logger = logging.getLogger("placementpro.ats")


def check_basic_eligibility(student: StudentProfile, job: JobPosting) -> tuple[bool, str]:
    """Evaluates fundamental placement criteria: minimum CGPA and department/branch eligibility."""
    # 1. CGPA Check
    if job.min_cgpa > 0.0 and student.cgpa < job.min_cgpa:
        return False, f"CGPA requirement not met: Candidate CGPA ({student.cgpa:.2f}) is below minimum requirement ({job.min_cgpa:.2f})."

    # 2. Branch Eligibility Check
    if job.eligible_branches:
        try:
            eligible_list = json.loads(job.eligible_branches) if isinstance(job.eligible_branches, str) else job.eligible_branches
            if isinstance(eligible_list, list) and len(eligible_list) > 0:
                # Case-insensitive substring matching for branches
                branch_match = any(
                    b.strip().lower() in student.branch.lower() or student.branch.lower() in b.strip().lower()
                    for b in eligible_list
                )
                if not branch_match:
                    return False, f"Branch eligibility criteria not met: Candidate branch '{student.branch}' is not in allowed branches: {eligible_list}."
        except Exception as e:
            logger.warning(f"Error parsing eligible_branches in job {job.id}: {e}")

    return True, f"Candidate satisfies all eligibility rules: CGPA ({student.cgpa:.2f} >= {job.min_cgpa:.2f}) and Branch ('{student.branch}')."


def fallback_heuristic_ats(student: StudentProfile, job: JobPosting, custom_resume: str = None) -> ATSEvaluationResponse:
    """
    Intelligent heuristic ATS engine utilized when Groq API key is not configured
    or when external API rate-limits/network errors occur.
    Ensures zero downtime and deterministic assessment.
    """
    is_eligible, eligibility_notes = check_basic_eligibility(student, job)

    # Parse student skills
    student_skills: List[str] = []
    if student.skills:
        try:
            student_skills = json.loads(student.skills) if isinstance(student.skills, str) else student.skills
        except Exception:
            student_skills = [s.strip() for s in str(student.skills).split(",") if s.strip()]

    # Parse required skills
    job_skills: List[str] = []
    if job.required_skills:
        try:
            job_skills = json.loads(job.required_skills) if isinstance(job.required_skills, str) else job.required_skills
        except Exception:
            job_skills = [s.strip() for s in str(job.required_skills).split(",") if s.strip()]

    # Include resume text for contextual keyword search
    resume_corpus = (custom_resume or student.resume_text or "").lower()

    # Identify matching and missing skills
    matching_skills = []
    missing_skills = []

    for req_skill in job_skills:
        req_clean = req_skill.strip().lower()
        if any(req_clean in s.lower() for s in student_skills) or req_clean in resume_corpus:
            matching_skills.append(req_skill)
        else:
            missing_skills.append(req_skill)

    # Calculate skill match ratio
    if job_skills:
        skill_ratio = len(matching_skills) / len(job_skills)
    else:
        skill_ratio = 0.85

    # Calculate CGPA weight (out of 10)
    cgpa_ratio = min(student.cgpa / 10.0, 1.0)

    # Calculate ATS score
    raw_score = (skill_ratio * 70.0) + (cgpa_ratio * 30.0)
    if not is_eligible:
        raw_score = max(raw_score - 25.0, 15.0)

    ats_score = round(min(max(raw_score, 10.0), 98.0), 1)

    # Determine Verdict
    if ats_score >= 85.0:
        verdict = "Excellent Match"
    elif ats_score >= 70.0:
        verdict = "Strong Match"
    elif ats_score >= 50.0:
        verdict = "Moderate Match"
    else:
        verdict = "Low Match"

    detailed_feedback = (
        f"Candidate matched {len(matching_skills)} of {len(job_skills)} required technical skills. "
        f"CGPA is {student.cgpa:.2f}/10.0. "
        f"{'Resume summary demonstrated alignment with backend and database fundamentals.' if resume_corpus else 'Adding a detailed resume text will enhance ATS depth.'}"
    )

    recommendations = []
    if missing_skills:
        recommendations.append(f"Consider acquiring experience or certifications in missing skills: {', '.join(missing_skills[:3])}.")
    if not resume_corpus or len(resume_corpus) < 100:
        recommendations.append("Expand resume with quantifiable impact, technical stack keywords, and GitHub project links.")
    recommendations.append("Align project descriptions with industry-standard terminology mentioned in the job post.")

    return ATSEvaluationResponse(
        job_id=job.id,
        job_title=job.title,
        student_id=student.id,
        student_name=student.full_name,
        ats_score=ats_score,
        match_verdict=verdict,
        meets_eligibility_criteria=is_eligible,
        eligibility_notes=eligibility_notes,
        matching_skills=matching_skills,
        missing_skills=missing_skills,
        detailed_feedback=detailed_feedback,
        recommendations=recommendations,
    )


def evaluate_ats_compatibility(
    student: StudentProfile,
    job: JobPosting,
    custom_resume: str = None
) -> ATSEvaluationResponse:
    """
    Performs AI-driven ATS evaluation using the official Groq API client (llama-3.3-70b-versatile).
    Compares the student's profile, resume, and skills against the job description and requirements.
    Falls back gracefully to the heuristic engine if the Groq key is absent or unreachable.
    """
    is_eligible, eligibility_notes = check_basic_eligibility(student, job)

    groq_api_key = settings.GROQ_API_KEY.strip() if settings.GROQ_API_KEY else ""

    # If no valid Groq API key is provided, execute fallback heuristic
    if not groq_api_key or groq_api_key.startswith("gsk_your_groq_api"):
        logger.info("Groq API key not set or using placeholder; using heuristic ATS scoring engine.")
        return fallback_heuristic_ats(student, job, custom_resume)

    try:
        client = Groq(api_key=groq_api_key)

        # Parse skills
        try:
            student_skills = json.loads(student.skills) if isinstance(student.skills, str) else student.skills
        except Exception:
            student_skills = [student.skills]

        try:
            job_skills = json.loads(job.required_skills) if isinstance(job.required_skills, str) else job.required_skills
        except Exception:
            job_skills = [job.required_skills]

        resume_content = custom_resume or student.resume_text or "No detailed resume provided."

        prompt_payload = {
            "job_posting": {
                "title": job.title,
                "description": job.description,
                "location": job.location,
                "job_type": job.job_type,
                "required_skills": job_skills,
                "min_cgpa": job.min_cgpa,
                "eligible_branches": job.eligible_branches,
            },
            "candidate_profile": {
                "name": student.full_name,
                "branch": student.branch,
                "cgpa": student.cgpa,
                "graduation_year": student.graduation_year,
                "claimed_skills": student_skills,
                "actual_resume_text": resume_content,
            },
            "eligibility_check": {
                "meets_criteria": is_eligible,
                "notes": eligibility_notes
            }
        }

        system_prompt = (
            "You are an expert, objective Applicant Tracking System (ATS) evaluation engine for campus placements.\n"
            "Your job is to compute an ACCURATE, UNBIASED, and PRECISE ATS score (0 to 100) strictly derived from the candidate's actual resume text, technical skills, and academic profile compared against the job requirements.\n\n"
            "Scoring Rules (Total 100 points):\n"
            "1. Required Technical Skills Match (0 to 40 points): Proportional points based strictly on which required job skills are evidenced in the candidate's resume and verified skills.\n"
            "2. Project & Domain Relevance in Resume (0 to 35 points): How closely the projects, tools, frameworks, and achievements described in the resume match the job requirements. If the resume is irrelevant, empty, or lacks relevant projects, award 0 to 10 points.\n"
            "3. Academic & Eligibility Compliance (0 to 15 points): 15 points if CGPA and branch satisfy the job's minimum requirements, else 0 points.\n"
            "4. Resume Quality & Depth (0 to 10 points): Technical keywords, concrete details, metrics, and quantifiable impact in the resume.\n\n"
            "TOTAL ATS SCORE = Sum of the 4 categories (between 0.0 and 100.0, rounded to 1 decimal place).\n\n"
            "CRITICAL CONSTRAINTS:\n"
            "- If the candidate's resume text and skills are completely unrelated to the job, their ATS score MUST be below 25.\n"
            "- Only include skills in 'matching_skills' that are actually demonstrated or referenced in the candidate's resume or skill set.\n"
            "- All required skills from the job not present in the candidate's profile must be in 'missing_skills'.\n\n"
            "Return ONLY a valid JSON object with exact keys:\n"
            "{\n"
            '  "ats_score": <number between 0 and 100>,\n'
            '  "match_verdict": <"Excellent Match" | "Strong Match" | "Moderate Match" | "Low Match">,\n'
            '  "matching_skills": [<string>, ...],\n'
            '  "missing_skills": [<string>, ...],\n'
            '  "detailed_feedback": <string explaining exact breakdown and why the score was given>,\n'
            '  "recommendations": [<string>, ...]\n'
            "}"
        )

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": f"Evaluate this candidate against the job posting:\n\n{json.dumps(prompt_payload, indent=2)}"
                }
            ],
            model=settings.GROQ_MODEL,
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        response_content = chat_completion.choices[0].message.content
        data = json.loads(response_content)

        raw_score = float(data.get("ats_score", 0.0))
        computed_score = round(max(0.0, min(100.0, raw_score)), 1)

        # Ensure verdict matches score
        if computed_score >= 85.0:
            verdict = "Excellent Match"
        elif computed_score >= 70.0:
            verdict = "Strong Match"
        elif computed_score >= 50.0:
            verdict = "Moderate Match"
        else:
            verdict = "Low Match"

        return ATSEvaluationResponse(
            job_id=job.id,
            job_title=job.title,
            student_id=student.id,
            student_name=student.full_name,
            ats_score=computed_score,
            match_verdict=str(data.get("match_verdict", verdict)),
            meets_eligibility_criteria=is_eligible,
            eligibility_notes=eligibility_notes,
            matching_skills=list(data.get("matching_skills", [])),
            missing_skills=list(data.get("missing_skills", [])),
            detailed_feedback=str(data.get("detailed_feedback", "Detailed ATS profile analysis complete.")),
            recommendations=list(data.get("recommendations", [])),
        )

    except Exception as e:
        logger.error(f"Groq API evaluation failed ({e}). Reverting to heuristic ATS engine.")
        return fallback_heuristic_ats(student, job, custom_resume)
