"use client";

import React, { useState } from "react";
import { JobPosting, StudentProfile, atsApi, ATSEvaluationResponse } from "@/lib/api";
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  Loader2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface AtsAnalyzerModalProps {
  job: JobPosting;
  student: StudentProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onApply?: () => void;
}

export const AtsAnalyzerModal: React.FC<AtsAnalyzerModalProps> = ({
  job,
  student,
  isOpen,
  onClose,
  onApply,
}) => {
  const [customResume, setCustomResume] = useState(student?.resume_text || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ATSEvaluationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (student?.resume_text && !customResume) {
      setCustomResume(student.resume_text);
    }
  }, [student, customResume]);

  if (!isOpen) return null;

  const runEvaluation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await atsApi.evaluate({
        job_id: job.id,
        custom_resume_text: customResume.trim() || undefined,
      });
      setResult(data);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } }; message?: string };
      setErrorMsg(
        errorObj.response?.data?.detail || "Failed to evaluate ATS compatibility. Please check backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // Circular gauge calculations
  const score = result?.ats_score ?? 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (sc: number) => {
    if (sc >= 85) return { stroke: "#10b981", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
    if (sc >= 70) return { stroke: "#6366f1", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" };
    if (sc >= 50) return { stroke: "#f59e0b", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
    return { stroke: "#f43f5e", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" };
  };

  const scoreTheme = getScoreColor(score);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 via-white to-brand-50/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                  Powered by Groq AI (LLaMA 3.3)
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                ATS Compatibility Analyzer
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-md">
                Testing against <span className="font-semibold text-slate-800">{job.title}</span> at{" "}
                <span className="font-medium text-slate-700">{job.company_name || "Company"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Student Profile Quick Inspect */}
          {!result && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-600" />
                  <span>Profile Credentials for Comparison</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Candidate:</span>
                    <span className="font-semibold text-slate-800">{student?.full_name || "Active Student"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Branch:</span>
                    <span className="font-semibold text-slate-800">{student?.branch || "Engineering"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CGPA:</span>
                    <span className="font-semibold text-slate-800">{student?.cgpa ?? 8.5}/10.0</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-slate-400 block text-[10px] mb-1">Registered Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {student?.skills && student.skills.length > 0 ? (
                      student.skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-medium text-slate-700">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">No skills registered yet</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-brand-600" />
                    <span>Resume Content / Projects Evaluated by Groq AI</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Live resume text from your profile
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={customResume}
                  onChange={(e) => setCustomResume(e.target.value)}
                  placeholder="Paste or type your resume text, key projects, technical tools, and quantifiable accomplishments..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white leading-relaxed font-mono text-slate-800"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 <strong>Tip:</strong> Groq AI strictly reads this text to calculate technical skill matches, project depth, and ATS compatibility. Edit this text and recalculate to see your score change.
                </p>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={runEvaluation}
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-70 mx-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Groq AI Analyzing Resume & Job Profile...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Calculate ATS Compatibility Score</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Score Gauge & Verdict Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center p-5 bg-gradient-to-br from-slate-50 to-brand-50/20 border border-slate-200 rounded-2xl">
                {/* Circular Progress Gauge */}
                <div className="flex flex-col items-center justify-center sm:col-span-1">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                      {/* Background track */}
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        className="text-slate-200"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      {/* Progress ring */}
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke={scoreTheme.stroke}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-slate-900 leading-none">
                        {Math.round(result.ats_score)}%
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                        ATS Score
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verdict & Eligibility */}
                <div className="sm:col-span-2 space-y-2.5 text-center sm:text-left">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${scoreTheme.bg} ${scoreTheme.text} ${scoreTheme.border}`}
                    >
                      {result.match_verdict}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center space-x-1 ${
                        result.meets_eligibility_criteria
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span>{result.meets_eligibility_criteria ? "Eligible to Apply" : "Ineligible for Job"}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    {result.eligibility_notes}
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                    {result.detailed_feedback}
                  </p>
                </div>
              </div>

              {/* Skills Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Matching Skills */}
                <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-1.5 mb-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Matching Skills ({result.matching_skills.length})</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matching_skills.length > 0 ? (
                      result.matching_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-emerald-100/70 text-emerald-800 text-[11px] font-semibold rounded-md border border-emerald-200"
                        >
                          ✓ {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">No direct keyword overlap</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-2xl">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1.5 mb-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Missing / Desired Skills ({result.missing_skills.length})</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_skills.length > 0 ? (
                      result.missing_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-amber-100/70 text-amber-800 text-[11px] font-semibold rounded-md border border-amber-200"
                        >
                          + {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">All required skills present!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 mb-2">
                    <Lightbulb className="w-4 h-4 text-brand-600" />
                    <span>Actionable AI Recommendations</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <ChevronRight className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setResult(null)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-xl transition"
                >
                  ← Test Another Draft
                </button>

                {onApply && (
                  <button
                    onClick={() => {
                      onClose();
                      onApply();
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5"
                  >
                    <span>Proceed & Apply for this Job</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
