"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  JobPosting,
  JobApplication,
  ApplicationStatus,
  jobsApi,
  applicationsApi,
} from "@/lib/api";
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";

export default function RecruiterDashboardPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Job creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Bangalore, Karnataka");
  const [jobType, setJobType] = useState("Full-Time");
  const [ctc, setCtc] = useState<number>(18.0);
  const [minCgpa, setMinCgpa] = useState<number>(7.5);
  const [branchesStr, setBranchesStr] = useState("Computer Science and Engineering, Information Technology");
  const [skillsStr, setSkillsStr] = useState("Python, FastAPI, PostgreSQL, Docker");
  const [createLoading, setCreateLoading] = useState(false);

  // Status update modal state
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>("shortlisted");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      try {
        const jobsData = await jobsApi.listJobs();
        setJobs(jobsData);
      } catch {
        setJobs([]);
      }

      try {
        const appsData = await applicationsApi.listApplications();
        setApplications(appsData || []);
      } catch {
        setApplications([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const newJob = await jobsApi.createJob({
        title,
        description,
        location,
        job_type: jobType,
        ctc: Number(ctc),
        min_cgpa: Number(minCgpa),
        eligible_branches: branchesStr.split(",").map((s) => s.trim()),
        required_skills: skillsStr.split(",").map((s) => s.trim()),
        is_active: true,
      });

      setJobs((prev) => [newJob, ...prev]);
      setShowCreateModal(false);
      // Reset form
      setTitle("");
      setDescription("");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } }; message?: string };
      alert(errorObj.response?.data?.detail || "Failed to create job posting.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setStatusLoading(true);
    try {
      await applicationsApi.updateStatus(selectedApp.id, {
        status: newStatus,
        recruiter_feedback: feedbackNote.trim() || undefined,
      });

      setApplications((prev) =>
        prev.map((app) => (app.id === selectedApp.id ? { ...app, status: newStatus, recruiter_feedback: feedbackNote } : app))
      );
      setSelectedApp(null);
      setFeedbackNote("");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } }; message?: string };
      alert(errorObj.response?.data?.detail || "Failed to update application status.");
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                Recruiter Portal
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Hiring Pipeline & Applicant Review
            </h1>
            <p className="text-xs text-slate-500">
              Manage job vacancies, evaluate candidates with AI ATS scores, and advance applicants through interview stages.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 flex items-center space-x-2 transition self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Job Vacancy</span>
          </button>
        </div>

        {/* 4 Metric Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">{jobs.length}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Postings
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">{applications.length}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Applicants
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">
              {applications.filter((a) => a.status === "shortlisted" || a.status === "interviewing").length}
            </p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              In Active Rounds
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">
              {applications.filter((a) => a.status === "offered").length}
            </p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Offers Extended
            </p>
          </div>
        </div>

        {/* ApplicantDataTable */}
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Applicant Review Table
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review candidate academics, AI ATS compatibility scores, and update candidate hiring status.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {applications.length} Candidates
            </span>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-xs text-slate-500 font-medium">Loading candidate applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No applications submitted yet for your postings.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    <th className="py-3.5 px-6">Candidate</th>
                    <th className="py-3.5 px-6">Branch & CGPA</th>
                    <th className="py-3.5 px-6">Job Position</th>
                    <th className="py-3.5 px-6">Groq AI ATS Score</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">
                          {app.student_name || "Aarav Sharma"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Roll: {app.student_roll_number || "CS2026-042"}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-slate-800">
                          {app.student_branch || "Computer Science"}
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-600">
                          CGPA: {app.student_cgpa ?? 8.85}/10.0
                        </div>
                      </td>

                      <td className="py-4 px-6 text-slate-800">
                        {app.job_title || "Backend Engineer"}
                      </td>

                      <td className="py-4 px-6">
                        {app.ats_score ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg text-xs">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{Math.round(app.ats_score)}% Match</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Pending</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                            app.status === "shortlisted"
                              ? "bg-purple-100 text-purple-700"
                              : app.status === "interviewing"
                              ? "bg-amber-100 text-amber-800"
                              : app.status === "offered"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "rejected"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setNewStatus(app.status);
                            setFeedbackNote(app.recruiter_feedback || "");
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Job Posting Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  Post New Campus Placement Vacancy
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateJob} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Distributed Backend Software Engineer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Job Description
                  </label>
                  <textarea
                    rows={4}
                    required
                    minLength={20}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe role responsibilities, tech stack, and qualifications for students..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Annual CTC (LPA)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      required
                      value={ctc}
                      onChange={(e) => setCtc(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Minimum CGPA Required
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      required
                      value={minCgpa}
                      onChange={(e) => setMinCgpa(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Job Location
                    </label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Job Type
                    </label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Eligible Academic Branches (Comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={branchesStr}
                    onChange={(e) => setBranchesStr(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Required Technical Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={skillsStr}
                    onChange={(e) => setSkillsStr(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-1.5"
                  >
                    {createLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Publish Job Vacancy</span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  Update Candidate Status
                </h3>
                <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-slate-900">{selectedApp.student_name || "Aarav Sharma"}</p>
                <p className="text-slate-500">Applying for: {selectedApp.job_title}</p>
                {selectedApp.ats_score && (
                  <p className="text-indigo-600 font-semibold">
                    ATS Match Score: {Math.round(selectedApp.ats_score)}%
                  </p>
                )}
              </div>

              <form onSubmit={handleStatusUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select New Lifecycle Stage
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="applied">Applied</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offered">Offered 🎉</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recruiter Feedback / Next Steps Note
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder="e.g. Cleared technical interview round. Scheduling final HR discussion..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={statusLoading}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-1.5"
                  >
                    {statusLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Save Status</span>}
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
