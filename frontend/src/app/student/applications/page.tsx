"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { JobApplication, ApplicationStatus, applicationsApi } from "@/lib/api";
import {
  Sparkles,
  Building,
  Calendar,
  Trash2,
  Loader2,
  Briefcase,
} from "lucide-react";

const COLUMNS: { status: ApplicationStatus; title: string; color: string; badge: string }[] = [
  { status: "applied", title: "Applied", color: "border-blue-200 bg-blue-50/30", badge: "bg-blue-100 text-blue-700" },
  { status: "shortlisted", title: "Shortlisted", color: "border-purple-200 bg-purple-50/30", badge: "bg-purple-100 text-purple-700" },
  { status: "interviewing", title: "Interviewing", color: "border-amber-200 bg-amber-50/30", badge: "bg-amber-100 text-amber-800" },
  { status: "offered", title: "Offered 🎉", color: "border-emerald-200 bg-emerald-50/30", badge: "bg-emerald-100 text-emerald-800" },
  { status: "rejected", title: "Archived / Rejected", color: "border-rose-200 bg-rose-50/30", badge: "bg-rose-100 text-rose-700" },
];

export default function ApplicationTrackerPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await applicationsApi.listApplications();
      setApplications(data || []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleWithdraw = async (applicationId: number) => {
    if (!confirm("Are you sure you want to withdraw this job application?")) return;
    setWithdrawingId(applicationId);
    try {
      await applicationsApi.withdraw(applicationId);
      setApplications((prev) => prev.filter((app) => app.id !== applicationId));
    } catch {
      alert("Failed to withdraw application.");
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                Application Lifecycle
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Kanban Application Tracker
            </h1>
            <p className="text-xs text-slate-500">
              Track real-time candidate progression through screening, recruiter rounds, and offers.
            </p>
          </div>

          <Link
            href="/student/jobs"
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition self-start sm:self-center"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Apply to More Jobs</span>
          </Link>
        </div>

        {/* Kanban Board Columns */}
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <p className="text-xs text-slate-500 font-medium">Loading your application pipeline...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {COLUMNS.map((col) => {
              const columnApps = applications.filter((app) => app.status === col.status);

              return (
                <div
                  key={col.status}
                  className={`border rounded-3xl p-4 flex flex-col ${col.color} min-h-[550px] shadow-xs`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
                    <span className="text-xs font-bold text-slate-800 tracking-tight">
                      {col.title}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}
                    >
                      {columnApps.length}
                    </span>
                  </div>

                  {/* Cards List */}
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {columnApps.length === 0 ? (
                      <div className="h-40 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-center p-3">
                        <span className="text-[11px] font-medium text-slate-400">
                          No applications in {col.title.toLowerCase()}
                        </span>
                      </div>
                    ) : (
                      columnApps.map((app) => (
                        <div
                          key={app.id}
                          className="bg-white border border-slate-200/90 hover:border-brand-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 leading-snug">
                              {app.job_title}
                            </span>
                            <button
                              onClick={() => handleWithdraw(app.id)}
                              disabled={withdrawingId === app.id}
                              title="Withdraw application"
                              className="text-slate-300 hover:text-rose-600 transition p-1"
                            >
                              {withdrawingId === app.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{app.company_name || "Company"}</span>
                          </div>

                          {/* ATS Score Chip */}
                          {app.ats_score && (
                            <div className="flex items-center space-x-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md w-fit">
                              <Sparkles className="w-3 h-3 text-indigo-500" />
                              <span>{Math.round(app.ats_score)}% ATS Match</span>
                            </div>
                          )}

                          {/* Recruiter Feedback Note */}
                          {app.recruiter_feedback && (
                            <div className="p-2 bg-slate-50 border border-slate-200/70 rounded-xl text-[11px] text-slate-700">
                              <span className="font-bold text-slate-900 block text-[10px] uppercase">
                                Recruiter Feedback:
                              </span>
                              <p className="mt-0.5">{app.recruiter_feedback}</p>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                            </span>
                            <span className="capitalize font-semibold text-slate-600">
                              {app.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
