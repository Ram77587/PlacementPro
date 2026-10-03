"use client";

import React from "react";
import { JobPosting, StudentProfile } from "@/lib/api";
import {
  Briefcase,
  MapPin,
  IndianRupee,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
} from "lucide-react";

interface JobCardProps {
  job: JobPosting;
  student: StudentProfile | null;
  hasApplied?: boolean;
  onOpenAts: (job: JobPosting) => void;
  onApply: (job: JobPosting) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  student,
  hasApplied = false,
  onOpenAts,
  onApply,
}) => {
  // Determine Student Eligibility
  const isCgpaEligible = student ? student.cgpa >= job.min_cgpa : true;
  const isBranchEligible =
    student && job.eligible_branches && job.eligible_branches.length > 0
      ? job.eligible_branches.some((b) =>
          student.branch.toLowerCase().includes(b.toLowerCase()) ||
          b.toLowerCase().includes(student.branch.toLowerCase())
        )
      : true;

  const isEligible = isCgpaEligible && isBranchEligible;

  return (
    <div className="bg-white border border-slate-200/90 hover:border-brand-300 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Header: Company & CTC */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-base shadow-xs group-hover:from-brand-50 group-hover:to-brand-100 group-hover:text-brand-700 transition">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                {job.company_name || "Enterprise Recruiter"}
              </span>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition">
                {job.title}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full font-bold text-xs">
              <IndianRupee className="w-3.5 h-3.5" />
              <span>{job.ctc} LPA</span>
            </div>
          </div>
        </div>

        {/* Location & Meta Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3.5">
          <span className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{job.location}</span>
          </span>
          <span className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
            <Briefcase className="w-3 h-3 text-slate-400" />
            <span>{job.job_type}</span>
          </span>
          {job.min_cgpa > 0 && (
            <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              Min CGPA: <strong className="text-slate-800">{job.min_cgpa}</strong>
            </span>
          )}
        </div>

        {/* Job Description Excerpt */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {job.description}
        </p>

        {/* Required Skills Chips */}
        {job.required_skills && job.required_skills.length > 0 && (
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Required Stack
            </span>
            <div className="flex flex-wrap gap-1">
              {job.required_skills.slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium rounded-md"
                >
                  {skill}
                </span>
              ))}
              {job.required_skills.length > 4 && (
                <span className="px-1.5 py-0.5 text-slate-400 text-[10px] font-medium">
                  +{job.required_skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer & Action CTAs */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        {/* Eligibility Indicator */}
        {student && (
          <div className="flex items-center justify-between text-[11px]">
            {isEligible ? (
              <span className="flex items-center space-x-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Eligible to Apply (CGPA {student.cgpa} / {job.min_cgpa})</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-rose-600 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>
                  {!isCgpaEligible
                    ? `CGPA ${student.cgpa} < Min ${job.min_cgpa}`
                    : `Branch '${student.branch}' not eligible`}
                </span>
              </span>
            )}

            {job.application_deadline && (
              <span className="flex items-center space-x-1 text-slate-400 text-[10px]">
                <Clock className="w-3 h-3" />
                <span>Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span>
              </span>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onOpenAts(job)}
            className="w-full py-2 px-3 bg-gradient-to-r from-brand-50 to-indigo-50 hover:from-brand-100 hover:to-indigo-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>AI ATS Score</span>
          </button>

          {hasApplied ? (
            <button
              disabled
              className="w-full py-2 px-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 cursor-not-allowed"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Applied</span>
            </button>
          ) : (
            <button
              onClick={() => onApply(job)}
              disabled={!isEligible}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 shadow-sm transition ${
                isEligible
                  ? "bg-brand-600 hover:bg-brand-700 text-white cursor-pointer"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              <span>{isEligible ? "Apply Now" : "Ineligible"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
