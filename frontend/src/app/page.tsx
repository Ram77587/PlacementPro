"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6 pt-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-brand-50 border border-brand-200 rounded-full text-brand-700 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Placement Automation Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          The Smart Campus Recruitment Platform for{" "}
          <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
            High-Impact Careers
          </span>
        </h1>

        <p className="text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          PlacementPro streamlines university hiring with strict Role-Based Access Control, instant student eligibility verification, and AI-driven ATS resume compatibility scoring powered by Groq LLaMA 3.3.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-600/25 flex items-center space-x-2 transition"
          >
            <span>Launch Placement Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-2xl font-bold text-sm shadow-xs transition"
          >
            <span>Create New Account</span>
          </Link>
        </div>
      </section>

      {/* 3 Dedicated Role Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Portal Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                For Candidates
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Student Portal</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore verified campus drives, check CGPA eligibility in real-time, test resume ATS compatibility with Groq AI, and track applications on an interactive Kanban board.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 font-medium">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                <span>AI-Powered ATS Compatibility Analyzer</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                <span>Kanban Pipeline & Interview Schedules</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                <span>Instant Academic Eligibility Checks</span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1 transition"
            >
              <span>Enter Student Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recruiter Portal Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                For Employers
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Recruiter Hub</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Publish comprehensive job vacancies with tailored CGPA and branch constraints. Review candidate credentials with automated ATS scores and manage interview stages.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 font-medium">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                <span>Targeted Campus Job Vacancy Publishing</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                <span>Sortable Applicant Review Grid with ATS</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                <span>Stage Progression & Feedback Notes</span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1 transition"
            >
              <span>Enter Recruiter Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Admin Placement Officer Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                For Institutions
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Placement Officer</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Supervise institution-wide recruitment drives, track department placement distributions and median packages, and maintain user access controls across the platform.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 font-medium">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Institutional Placement Rate Analytics</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Department Median CTC Tracking</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>User Governance & Access Moderation</span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1 transition"
            >
              <span>Enter Officer Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
