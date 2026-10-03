"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, profilesApi, UserRole } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Hash,
  Award,
  Calendar,
  Building,
  Phone,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Student specific state
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [branch, setBranch] = useState("Computer Science and Engineering");
  const [cgpa, setCgpa] = useState<number>(8.5);
  const [gradYear, setGradYear] = useState<number>(2026);
  const [skillsStr, setSkillsStr] = useState("Python, FastAPI, PostgreSQL, Docker");
  const [resumeText, setResumeText] = useState("");

  // Recruiter specific state
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Software & Cloud Systems");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useRouter();

  const fillSampleStudent = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setRole("student");
    setEmail(`student.${randomSuffix}@placementpro.edu`);
    setPassword("StudentPass2026!");
    setFullName("Priya Patel");
    setRollNumber(`CS2026-${randomSuffix}`);
    setBranch("Computer Science and Engineering");
    setCgpa(8.9);
    setGradYear(2026);
    setSkillsStr("Python, FastAPI, Docker, PostgreSQL, React");
    setResumeText("Computer Science student passionate about distributed systems and cloud native development.");
    setErrorMsg(null);
  };

  const fillSampleRecruiter = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setRole("recruiter");
    setEmail(`recruiter.${randomSuffix}@globaltech.io`);
    setPassword("RecruiterPass2026!");
    setCompanyName("GlobalTech Dynamics");
    setIndustry("Cloud & Enterprise Systems");
    setContactPerson("David Miller");
    setContactPhone("+1-555-0248");
    setErrorMsg(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Client-side validations
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (role === "student") {
      if (fullName.trim().length < 2) {
        setErrorMsg("Full name must be at least 2 characters long.");
        return;
      }
      if (rollNumber.trim().length < 2) {
        setErrorMsg("Roll number must be at least 2 characters long.");
        return;
      }
      const numCgpa = Number(cgpa);
      if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
        setErrorMsg("CGPA must be a valid number between 0.0 and 10.0.");
        return;
      }
      const numGradYear = Number(gradYear);
      if (isNaN(numGradYear) || (numGradYear < 2000 && numGradYear > 99) || numGradYear > 2040) {
        setErrorMsg("Graduation year must be a valid 4-digit year (e.g., 2026).");
        return;
      }
    } else if (role === "recruiter") {
      if (companyName.trim().length < 2) {
        setErrorMsg("Company name must be at least 2 characters long.");
        return;
      }
      if (contactPerson.trim().length < 2) {
        setErrorMsg("Contact person name must be at least 2 characters long.");
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Register base user
      const userRes = await authApi.register({
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      // 2. Automatically log in to obtain JWT access token
      const loginRes = await authApi.login({ email: email.trim().toLowerCase(), password });
      login(loginRes.access_token, userRes);

      // 3. Create associated profile based on role
      if (role === "student") {
        const skillsArray = skillsStr
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        let finalGradYear = Number(gradYear);
        if (finalGradYear <= 99) finalGradYear += 2000;

        let finalCgpa = Number(cgpa);
        if (finalCgpa > 10 && finalCgpa <= 100) finalCgpa = finalCgpa / 10;

        await profilesApi.createStudentProfile({
          full_name: fullName.trim(),
          roll_number: rollNumber.trim().toUpperCase(),
          branch,
          cgpa: finalCgpa,
          graduation_year: finalGradYear,
          skills: skillsArray.length > 0 ? skillsArray : ["General Engineering"],
          resume_text:
            resumeText.trim() ||
            `${fullName.trim()} is a student in ${branch} with CGPA ${finalCgpa}. Proficient in ${skillsArray.join(", ") || "General Engineering"}.`,
        });
      } else if (role === "recruiter") {
        await profilesApi.createRecruiterProfile({
          company_name: companyName.trim(),
          industry: industry.trim() || undefined,
          contact_person: contactPerson.trim(),
          contact_phone: contactPhone.trim() || undefined,
        });
      }

      setSuccessMsg("Account & Profile registered successfully! Redirecting...");
      setTimeout(() => {
        if (role === "student") router.push("/student/dashboard");
        else if (role === "recruiter") router.push("/recruiter/dashboard");
        else router.push("/admin/dashboard");
      }, 1000);
    } catch (err: unknown) {
      const errorObj = err as {
        response?: {
          data?: {
            detail?: string;
            validation_errors?: string[];
          };
        };
        message?: string;
      };

      const data = errorObj.response?.data;
      if (data?.validation_errors && Array.isArray(data.validation_errors) && data.validation_errors.length > 0) {
        const cleanedErrors = data.validation_errors.map((item) =>
          item.replace(/^body\s*->\s*/i, "").replace(/^[a-z_]+\s*:\s*/i, "")
        );
        setErrorMsg(cleanedErrors.join(" • "));
      } else if (data?.detail) {
        setErrorMsg(data.detail);
      } else {
        setErrorMsg(errorObj.message || "Registration encountered an error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-6">
      <div className="w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/50 p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-brand-500/25">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Create PlacementPro Account
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose your role to configure your academic or recruiter profile
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Account Role
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition ${
                role === "student"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("recruiter")}
              className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition ${
                role === "recruiter"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Recruiter</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition ${
                role === "admin"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Quick Fill Test Accounts */}
        <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Quick Test:</span>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={fillSampleStudent}
              className="py-1 px-2 bg-white hover:bg-brand-50 hover:text-brand-700 border border-slate-200 rounded-lg text-slate-600 font-medium text-[11px] transition shadow-2xs"
            >
              Fill Student
            </button>
            <button
              type="button"
              onClick={fillSampleRecruiter}
              className="py-1 px-2 bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded-lg text-slate-600 font-medium text-[11px] transition shadow-2xs"
            >
              Fill Recruiter
            </button>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Base Auth Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@placementpro.edu"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Student Specific Profile Fields */}
          {role === "student" && (
            <div className="p-4 bg-brand-50/50 border border-brand-100 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wider flex items-center space-x-1.5">
                <GraduationCap className="w-4 h-4 text-brand-600" />
                <span>Student Academic Profile</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Aarav Sharma"
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Roll Number / Student ID
                  </label>
                  <div className="relative">
                    <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="CS2026-042"
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Branch / Dept
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Computer Science and Engineering">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics and Communication">Electronics & Comm</option>
                    <option value="Electrical Engineering">Electrical Eng</option>
                    <option value="Mechanical Engineering">Mechanical Eng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    CGPA (0 - 10)
                  </label>
                  <div className="relative">
                    <Award className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      required
                      value={cgpa}
                      onChange={(e) => setCgpa(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Graduation Year
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      required
                      value={gradYear}
                      onChange={(e) => setGradYear(parseInt(e.target.value) || 2026)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Technical Skills (Comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="Python, FastAPI, PostgreSQL, Docker, AWS"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Resume Summary / Key Projects (Used for Groq AI ATS Evaluation)
                </label>
                <textarea
                  rows={2}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Senior software engineering student with 2 internships building REST APIs and relational databases..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          {/* Recruiter Specific Profile Fields */}
          {role === "recruiter" && (
            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Briefcase className="w-4 h-4 text-purple-600" />
                <span>Recruiter & Company Profile</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="TechCorp Innovations"
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Industry Sector
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Cloud & AI Infrastructure"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Contact Person Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Priya Menon"
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91-9876543210"
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Specific Profile Fields */}
          {role === "admin" && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-1.5 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Placement Officer Privileges</span>
              </h3>
              <p className="text-xs text-slate-600">
                You will be granted supervisory control to audit student placements, manage company access, and inspect institutional metrics.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-brand-600/20 flex items-center justify-center space-x-2 transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering Account & Profile...</span>
              </>
            ) : (
              <span>Complete {role.charAt(0).toUpperCase() + role.slice(1)} Registration</span>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
