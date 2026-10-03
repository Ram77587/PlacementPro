"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/api";
import { ShieldAlert, Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/login");
    }
  }, [isLoading, token, router]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
        <p className="text-slate-500 font-medium text-sm">Verifying identity & session...</p>
      </div>
    );
  }

  if (!user || !token) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white border border-rose-200 rounded-2xl shadow-sm text-center">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-600 mb-6">
          This portal requires one of the following permissions:{" "}
          <span className="font-semibold text-rose-600">
            {allowedRoles.join(", ")}
          </span>
          . Your current role is <span className="font-semibold text-slate-800">{user.role}</span>.
        </p>
        <button
          onClick={() => {
            if (user.role === "student") router.push("/student/dashboard");
            else if (user.role === "recruiter") router.push("/recruiter/dashboard");
            else router.push("/admin/dashboard");
          }}
          className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl shadow-sm transition"
        >
          Return to My Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
