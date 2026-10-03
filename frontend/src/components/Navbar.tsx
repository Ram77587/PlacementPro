"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  Briefcase,
  Layers,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from "lucide-react";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-950 via-slate-900 to-brand-700 bg-clip-text text-transparent">
              Placement<span className="text-brand-600">Pro</span>
            </span>
            <span className="block text-[10px] font-semibold tracking-wider uppercase text-slate-600">
              Campus Recruitment
            </span>
          </div>
        </Link>

        {/* Dynamic Role Navigation */}
        {user && (
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {user.role === "student" && (
              <>
                <Link
                  href="/student/dashboard"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    pathname === "/student/dashboard"
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/student/jobs"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    pathname === "/student/jobs"
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Explore Jobs</span>
                </Link>
                <Link
                  href="/student/applications"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    pathname === "/student/applications"
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Kanban Tracker</span>
                </Link>
              </>
            )}

            {user.role === "recruiter" && (
              <>
                <Link
                  href="/recruiter/dashboard"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    pathname.startsWith("/recruiter")
                      ? "bg-purple-50 text-purple-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Recruiter Hub</span>
                </Link>
              </>
            )}

            {user.role === "admin" && (
              <>
                <Link
                  href="/admin/dashboard"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    pathname.startsWith("/admin")
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Placement Officer Console</span>
                </Link>
              </>
            )}
          </nav>
        )}

        {/* User Identity & Auth Actions */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">
                  {user.email}
                </span>
                <span className="text-[11px] font-medium capitalize">
                  {user.role === "student" && (
                    <span className="text-brand-600 font-semibold">Student Portal</span>
                  )}
                  {user.role === "recruiter" && (
                    <span className="text-purple-600 font-semibold">Recruiter Portal</span>
                  )}
                  {user.role === "admin" && (
                    <span className="text-emerald-600 font-semibold">Placement Officer</span>
                  )}
                </span>
              </div>

              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  user.role === "student"
                    ? "bg-brand-100 text-brand-700"
                    : user.role === "recruiter"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {user.email.charAt(0).toUpperCase()}
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : !isAuthPage ? (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-brand-600 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm transition"
              >
                Get Started
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
