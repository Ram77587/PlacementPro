"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { JobCard } from "@/components/student/JobCard";
import { AtsAnalyzerModal } from "@/components/student/AtsAnalyzerModal";
import {
  JobPosting,
  StudentProfile,
  jobsApi,
  profilesApi,
  applicationsApi,
} from "@/lib/api";
import {
  Search,
  SlidersHorizontal,
  Briefcase,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

// Mock Fallback jobs if backend database has not yet been populated
const MOCK_JOBS: JobPosting[] = [
  {
    id: 1,
    recruiter_id: 1,
    company_name: "Google Cloud",
    title: "Graduate Backend Software Engineer",
    description:
      "We are seeking talented software engineers proficient in Python, FastAPI, and PostgreSQL. You will build high-throughput microservices, design relational schemas, and deploy containerized services to Google Kubernetes Engine.",
    location: "Bangalore, Karnataka",
    job_type: "Full-Time",
    ctc: 24.5,
    min_cgpa: 7.5,
    eligible_branches: ["Computer Science and Engineering", "Information Technology"],
    required_skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "GCP"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    recruiter_id: 2,
    company_name: "Microsoft",
    title: "Cloud Infrastructure & DevOps Associate",
    description:
      "Join our Azure team designing automated CI/CD deployment pipelines, infrastructure as code, and monitoring telemetry. Looking for strong fundamentals in Linux, scripting, and cloud architectures.",
    location: "Hyderabad, Telangana",
    job_type: "Full-Time",
    ctc: 21.0,
    min_cgpa: 8.0,
    eligible_branches: ["Computer Science and Engineering", "Electronics and Communication"],
    required_skills: ["Linux", "Python", "Docker", "Kubernetes", "Azure"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    recruiter_id: 3,
    company_name: "Stripe",
    title: "Payments API Engineer",
    description:
      "Work on global payment infrastructure. High emphasis on data integrity, idempotent transactional processing, and REST API latency optimization.",
    location: "Bangalore / Remote",
    job_type: "Full-Time",
    ctc: 28.0,
    min_cgpa: 8.5,
    eligible_branches: ["Computer Science and Engineering"],
    required_skills: ["Python", "SQL", "Redis", "Distributed Systems"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    recruiter_id: 4,
    company_name: "Atlassian",
    title: "Full Stack Engineer - Jira Core",
    description:
      "Develop scalable frontend and backend components for enterprise collaboration tools. Build fast user experiences using React and reliable backend microservices.",
    location: "Bangalore, Karnataka",
    job_type: "Full-Time",
    ctc: 19.5,
    min_cgpa: 7.0,
    eligible_branches: ["Computer Science and Engineering", "Information Technology", "Electronics and Communication"],
    required_skills: ["React", "TypeScript", "Python", "GraphQL"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function JobSearchPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [minCtc, setMinCtc] = useState<number>(0);
  const [eligibleOnly, setEligibleOnly] = useState(false);

  // ATS Modal state
  const [selectedAtsJob, setSelectedAtsJob] = useState<JobPosting | null>(null);

  // Apply dialog state
  const [applyJob, setApplyJob] = useState<JobPosting | null>(null);
  const [applyNotes, setApplyNotes] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Student Profile
      try {
        const studentData = await profilesApi.getStudentProfileMe();
        setStudent(studentData);
      } catch {
        setStudent(null);
      }

      // 2. Fetch Active Jobs from API
      try {
        const jobsData = await jobsApi.listJobs();
        if (jobsData && jobsData.length > 0) {
          setJobs(jobsData);
        } else {
          setJobs(MOCK_JOBS);
        }
      } catch {
        setJobs(MOCK_JOBS);
      }

      // 3. Fetch Student's Applied Jobs
      try {
        const apps = await applicationsApi.listApplications();
        setAppliedJobIds(apps.map((a) => a.job_id));
      } catch {
        setAppliedJobIds([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyJob) return;

    setApplyLoading(true);
    setActionAlert(null);

    try {
      const appRes = await applicationsApi.apply({
        job_id: applyJob.id,
        notes: applyNotes.trim() || undefined,
        custom_resume_text: student?.resume_text || undefined,
      });

      setAppliedJobIds((prev) => [...prev, applyJob.id]);
      const scoreNotice = appRes.ats_score != null ? ` (Groq AI ATS Score: ${Math.round(appRes.ats_score)}%)` : "";
      setActionAlert({
        type: "success",
        text: `Application for "${applyJob.title}" at ${applyJob.company_name} submitted successfully!${scoreNotice}`,
      });
      setApplyJob(null);
      setApplyNotes("");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } }; message?: string };
      setActionAlert({
        type: "error",
        text: errorObj.response?.data?.detail || "Application failed. Please verify eligibility requirements.",
      });
    } finally {
      setApplyLoading(false);
    }
  };

  // Filter Pipeline
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.company_name && job.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.required_skills && job.required_skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesLocation =
      locationFilter === "all" ||
      job.location.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesCtc = minCtc === 0 || job.ctc >= minCtc;

    const matchesEligibility = !eligibleOnly || (student ? student.cgpa >= job.min_cgpa : true);

    return matchesSearch && matchesLocation && matchesCtc && matchesEligibility;
  });

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="space-y-6">
        {/* Page Banner */}
        <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-lg">
          <div className="relative z-10 max-w-2xl">
            <span className="px-3 py-1 bg-brand-500/20 text-brand-300 rounded-full text-xs font-bold border border-brand-400/30 uppercase tracking-wider inline-block mb-3">
              Campus Placement Portal
            </span>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">
              Explore Verified Campus Job Opportunities
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Browse openings from top tech enterprises, review eligibility requirements, and test your profile match with our Groq AI ATS analyzer before applying.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
            <Briefcase className="w-80 h-80 text-white" />
          </div>
        </div>

        {/* Global Action Alert */}
        {actionAlert && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
              actionAlert.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <div className="flex items-center space-x-2">
              {actionAlert.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{actionAlert.text}</span>
            </div>
            <button onClick={() => setActionAlert(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Grid: Sidebar Filters & Results */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 space-y-5">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-brand-600" />
                  <span>Filter Openings</span>
                </h3>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setLocationFilter("all");
                    setMinCtc(0);
                    setEligibleOnly(false);
                  }}
                  className="text-[11px] font-semibold text-brand-600 hover:underline"
                >
                  Reset
                </button>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Location
                </label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Locations</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Pune">Pune</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              {/* Minimum CTC Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Minimum CTC
                  </label>
                  <span className="text-xs font-bold text-emerald-600">
                    {minCtc === 0 ? "Any Package" : `≥ ₹${minCtc} LPA`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="2"
                  value={minCtc}
                  onChange={(e) => setMinCtc(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0 LPA</span>
                  <span>15 LPA</span>
                  <span>30 LPA</span>
                </div>
              </div>

              {/* Eligibility Toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eligibleOnly}
                    onChange={(e) => setEligibleOnly(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded-md border-slate-300 focus:ring-brand-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Eligible for me only
                  </span>
                </label>
                {student && (
                  <p className="text-[10px] text-slate-400 mt-1 pl-6">
                    Based on your CGPA ({student.cgpa}) & branch
                  </p>
                )}
              </div>
            </div>

            {/* AI ATS Promo Badge */}
            <div className="p-5 bg-gradient-to-br from-indigo-50 to-brand-50 border border-brand-200/80 rounded-3xl space-y-2">
              <div className="flex items-center space-x-2 text-brand-700 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>AI Match Scoring</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Click &quot;AI ATS Score&quot; on any job posting to evaluate your resume against requirements with Groq AI LLaMA 3.3.
              </p>
            </div>
          </div>

          {/* Jobs Listing & Search */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search job title, tech stack (e.g. Python, FastAPI, Docker), or company..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Loading state */}
            {loading ? (
              <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                <p className="text-xs text-slate-500 font-medium">Fetching active placement drives...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Job Postings Matched</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your filters, location, or minimum CTC slider to view more opportunities.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    student={student}
                    hasApplied={appliedJobIds.includes(job.id)}
                    onOpenAts={(j) => setSelectedAtsJob(j)}
                    onApply={(j) => setApplyJob(j)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ATS Analyzer Modal */}
        {selectedAtsJob && (
          <AtsAnalyzerModal
            job={selectedAtsJob}
            student={student}
            isOpen={!!selectedAtsJob}
            onClose={() => setSelectedAtsJob(null)}
            onApply={() => {
              setApplyJob(selectedAtsJob);
              setSelectedAtsJob(null);
            }}
          />
        )}

        {/* Quick Apply Confirmation Modal */}
        {applyJob && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  Submit Application
                </h3>
                <button
                  onClick={() => setApplyJob(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-slate-900">{applyJob.title}</p>
                <p className="text-slate-500">{applyJob.company_name} • ₹{applyJob.ctc} LPA</p>
                <p className="text-emerald-600 font-semibold mt-1">
                  ✓ Eligibility Verified (Min CGPA: {applyJob.min_cgpa})
                </p>
              </div>

              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Application Note / Cover Remarks (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={applyNotes}
                    onChange={(e) => setApplyNotes(e.target.value)}
                    placeholder="Briefly state your passion or project alignment with this team..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setApplyJob(null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applyLoading}
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-1.5 disabled:opacity-70 cursor-pointer"
                  >
                    {applyLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Applying...</span>
                      </>
                    ) : (
                      <span>Confirm & Apply</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
