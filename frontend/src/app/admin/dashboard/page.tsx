"use client";

import React, { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  TrendingUp,
  Award,
  Building,
  CheckCircle2,
  Search,
} from "lucide-react";

interface SystemUser {
  id: number;
  email: string;
  role: "student" | "recruiter" | "admin";
  name: string;
  departmentOrCompany: string;
  is_active: boolean;
  joined_date: string;
}

const MOCK_USERS: SystemUser[] = [
  {
    id: 1,
    email: "aarav.student@placementpro.edu",
    role: "student",
    name: "Aarav Sharma",
    departmentOrCompany: "Computer Science (CGPA: 8.85)",
    is_active: true,
    joined_date: "2026-08-15",
  },
  {
    id: 2,
    email: "rohan.patel@placementpro.edu",
    role: "student",
    name: "Rohan Patel",
    departmentOrCompany: "Information Technology (CGPA: 8.40)",
    is_active: true,
    joined_date: "2026-08-16",
  },
  {
    id: 3,
    email: "talent@techcorp.com",
    role: "recruiter",
    name: "Priya Menon",
    departmentOrCompany: "TechCorp Innovations (Software)",
    is_active: true,
    joined_date: "2026-08-20",
  },
  {
    id: 4,
    email: "careers@hyperscale.com",
    role: "recruiter",
    name: "Vikram Adve",
    departmentOrCompany: "HyperScale Cloud Systems",
    is_active: true,
    joined_date: "2026-08-22",
  },
  {
    id: 5,
    email: "officer@placementpro.edu",
    role: "admin",
    name: "Dr. K. S. Verma",
    departmentOrCompany: "Dean of Corporate Relations",
    is_active: true,
    joined_date: "2026-01-10",
  },
];

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<SystemUser[]>(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const toggleUserStatus = (userId: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active } : u))
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.departmentOrCompany.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Institutional Administration
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Placement Officer Executive Console
            </h1>
            <p className="text-xs text-slate-500">
              High-level campus placement rates, median package distributions, and university-wide user governance.
            </p>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">84.5%</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Placement Rate
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">₹16.8 LPA</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Median Annual CTC
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">342</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Offers Extended
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">28</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recruiters Onboard
            </p>
          </div>
        </div>

        {/* Department Placement Breakdown */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Department-wise Placement Performance (Class of 2026)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>Computer Science & Eng</span>
                <span className="text-emerald-600">92%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "92%" }} />
              </div>
              <span className="text-[10px] text-slate-500">142 of 154 students placed</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>Information Technology</span>
                <span className="text-blue-600">86%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "86%" }} />
              </div>
              <span className="text-[10px] text-slate-500">98 of 114 students placed</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>Electronics & Communication</span>
                <span className="text-purple-600">76%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: "76%" }} />
              </div>
              <span className="text-[10px] text-slate-500">102 of 134 students placed</span>
            </div>
          </div>
        </div>

        {/* UserManagementTable */}
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                User Governance & Management Grid
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit system accounts, monitor RBAC roles, and approve or deactivate access.
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search user name or email..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="recruiter">Recruiters</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="py-3.5 px-6">User Account</th>
                  <th className="py-3.5 px-6">System Role</th>
                  <th className="py-3.5 px-6">Affiliation / Credentials</th>
                  <th className="py-3.5 px-6">Account Status</th>
                  <th className="py-3.5 px-6 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          u.role === "student"
                            ? "bg-blue-100 text-blue-700"
                            : u.role === "recruiter"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-700">
                      {u.departmentOrCompany}
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {u.is_active ? "Active" : "Deactivated"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          u.is_active
                            ? "text-rose-600 hover:bg-rose-50 border border-rose-200"
                            : "text-emerald-600 hover:bg-emerald-50 border border-emerald-200"
                        }`}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
