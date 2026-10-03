"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  StudentProfile,
  JobApplication,
  profilesApi,
  applicationsApi,
} from "@/lib/api";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  Building,
  ChevronRight,
  Loader2,
} from "lucide-react";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        try {
          const profileData = await profilesApi.getStudentProfileMe();
          setProfile(profileData);
        } catch {
          setProfile(null);
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
    }
    fetchData();
  }, []);

  // Compute metrics
  const totalApplied = applications.length;
  const shortlistedCount = applications.filter((a) => a.status === "shortlisted").length;
  const interviewingCount = applications.filter((a) => a.status === "interviewing").length;

  const validAtsScores = applications.filter((a) => a.ats_score != null).map((a) => a.ats_score as number);
  const avgAtsScore =
    validAtsScores.length > 0
      ? Math.round(validAtsScores.reduce((acc, curr) => acc + curr, 0) / validAtsScores.length)
      : null;

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                Student Placement Portal
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Hello, {profile?.full_name || user?.email.split("@")[0]} 👋
            </h1>
            <p className="text-xs text-slate-500">
              {profile
                ? `${profile.branch} • Roll: ${profile.roll_number} • CGPA: ${profile.cgpa}`
                : "Complete your profile to maximize placement visibility."}
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <Link
              href="/student/jobs"
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Browse Active Jobs</span>
            </Link>
            <Link
              href="/student/applications"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <span>View Tracker</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">{totalApplied}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Applications
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">{shortlistedCount}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Shortlisted
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">{interviewingCount}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Interviews
            </p>
          </div>

          <div className="p-5 bg-gradient-to-br from-brand-600 to-indigo-700 text-white rounded-3xl shadow-md space-y-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-white leading-none">{avgAtsScore !== null ? `${avgAtsScore}%` : "--"}</p>
            <p className="text-xs font-semibold text-brand-100 uppercase tracking-wider">
              {avgAtsScore !== null ? "Avg ATS Score" : "No Applications Yet"}
            </p>
          </div>
        </div>

        {/* 2-Column Section: Upcoming Interviews & Recent Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Interviews & Timeline (1 Col) */}
          <div className="lg:col-span-1 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>Upcoming Placement Schedule</span>
              </h3>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-brand-50/60 border border-brand-200/60 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-brand-800">
                  <span>Technical Round 1</span>
                  <span className="text-[10px] bg-brand-200/60 px-2 py-0.5 rounded-full text-brand-900">
                    Tomorrow
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800">Microsoft Cloud Associate</p>
                <p className="text-[11px] text-slate-500">2:00 PM - 3:00 PM • Video Call (Teams)</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Aptitude Assessment</span>
                  <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full text-slate-700">
                    Oct 5
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800">Google Cloud Drive</p>
                <p className="text-[11px] text-slate-500">10:00 AM • Lab 304, Campus Building</p>
              </div>

              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span>Resume Pre-Screening</span>
                  <span className="text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded-full text-emerald-900">
                    Done
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800">Stripe Payments API Engineer</p>
                <p className="text-[11px] text-slate-500">ATS Match verified at 87.5%</p>
              </div>
            </div>
          </div>

          {/* Recent Applications Feed (2 Cols) */}
          <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Award className="w-4 h-4 text-brand-600" />
                <span>Recent Job Applications</span>
              </h3>
              <Link
                href="/student/applications"
                className="text-xs font-semibold text-brand-600 hover:underline flex items-center space-x-1"
              >
                <span>Kanban Board</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
              </div>
            ) : applications.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-xs text-slate-500 font-medium">You haven&apos;t applied to any job postings yet.</p>
                <Link
                  href="/student/jobs"
                  className="inline-block px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
                >
                  Browse Campus Openings
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{app.job_title}</span>
                        {app.ats_score && (
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-md flex items-center space-x-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{Math.round(app.ats_score)}% ATS</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{app.company_name || "Enterprise Recruiter"}</span>
                        <span>•</span>
                        <span>Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                      </p>
                      {app.recruiter_feedback && (
                        <p className="text-[11px] text-brand-700 font-medium bg-brand-50/70 px-2 py-0.5 rounded-md inline-block mt-1">
                          Recruiter note: {app.recruiter_feedback}
                        </p>
                      )}
                    </div>

                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                          app.status === "shortlisted"
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : app.status === "interviewing"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : app.status === "offered"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : app.status === "rejected"
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-blue-100 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
