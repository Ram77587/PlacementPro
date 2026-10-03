import axios, { AxiosError } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : typeof window !== "undefined"
    ? "/api"
    : "http://127.0.0.1:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("placementpro_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("placementpro_token");
        localStorage.removeItem("placementpro_user");
        if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
          window.location.href = "/login?session_expired=true";
        }
      }
    }
    return Promise.reject(error);
  }
);

// -------------------------------------------------------------
// Typed Data Models
// -------------------------------------------------------------
export type UserRole = "student" | "recruiter" | "admin";

export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "interviewing"
  | "offered"
  | "rejected";

export interface User {
  id: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  has_profile?: boolean;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  full_name: string;
  roll_number: string;
  branch: string;
  cgpa: number;
  graduation_year: number;
  skills: string[];
  resume_text?: string;
  phone?: string;
  linkedin_url?: string;
  github_url?: string;
  created_at: string;
  updated_at: string;
}

export interface RecruiterProfile {
  id: number;
  user_id: number;
  company_name: string;
  company_website?: string;
  industry?: string;
  contact_person: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface JobPosting {
  id: number;
  recruiter_id: number;
  company_name?: string;
  title: string;
  description: string;
  location: string;
  job_type: string;
  ctc: number;
  min_cgpa: number;
  eligible_branches: string[];
  required_skills: string[];
  application_deadline?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: number;
  job_id: number;
  student_id: number;
  job_title?: string;
  company_name?: string;
  student_name?: string;
  student_roll_number?: string;
  student_branch?: string;
  student_cgpa?: number;
  status: ApplicationStatus;
  ats_score?: number;
  ats_feedback?: string;
  notes?: string;
  recruiter_feedback?: string;
  applied_at: string;
  updated_at: string;
}

export interface ATSEvaluationResponse {
  job_id: number;
  job_title: string;
  student_id: number;
  student_name: string;
  ats_score: number;
  match_verdict: string;
  meets_eligibility_criteria: boolean;
  eligibility_notes: string;
  matching_skills: string[];
  missing_skills: string[];
  detailed_feedback: string;
  recommendations: string[];
}

// -------------------------------------------------------------
// API Service Methods
// -------------------------------------------------------------
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post<{
      access_token: string;
      token_type: string;
      user_id: number;
      email: string;
      role: UserRole;
    }>("/auth/login", credentials);
    return res.data;
  },
  register: async (payload: { email: string; password: string; role: UserRole }) => {
    const res = await apiClient.post<User>("/auth/register", payload);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get<User>("/auth/me");
    return res.data;
  },
};

export const profilesApi = {
  getStudentProfileMe: async () => {
    const res = await apiClient.get<StudentProfile>("/profiles/student/me");
    return res.data;
  },
  createStudentProfile: async (payload: Partial<StudentProfile>) => {
    const res = await apiClient.post<StudentProfile>("/profiles/student", payload);
    return res.data;
  },
  updateStudentProfile: async (payload: Partial<StudentProfile>) => {
    const res = await apiClient.put<StudentProfile>("/profiles/student/me", payload);
    return res.data;
  },
  getRecruiterProfileMe: async () => {
    const res = await apiClient.get<RecruiterProfile>("/profiles/recruiter/me");
    return res.data;
  },
  createRecruiterProfile: async (payload: Partial<RecruiterProfile>) => {
    const res = await apiClient.post<RecruiterProfile>("/profiles/recruiter", payload);
    return res.data;
  },
};

export const jobsApi = {
  listJobs: async (params?: {
    search?: string;
    location?: string;
    min_ctc?: number;
    max_ctc?: number;
    job_type?: string;
    branch?: string;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get<JobPosting[]>("/jobs", { params });
    return res.data;
  },
  getJob: async (jobId: number) => {
    const res = await apiClient.get<JobPosting>(`/jobs/${jobId}`);
    return res.data;
  },
  createJob: async (payload: Partial<JobPosting>) => {
    const res = await apiClient.post<JobPosting>("/jobs", payload);
    return res.data;
  },
  updateJob: async (jobId: number, payload: Partial<JobPosting>) => {
    const res = await apiClient.put<JobPosting>(`/jobs/${jobId}`, payload);
    return res.data;
  },
  deleteJob: async (jobId: number) => {
    const res = await apiClient.delete<{ message: string }>(`/jobs/${jobId}`);
    return res.data;
  },
};

export const applicationsApi = {
  apply: async (payload: { job_id: number; notes?: string; custom_resume_text?: string }) => {
    const res = await apiClient.post<JobApplication>("/applications", payload);
    return res.data;
  },
  listApplications: async (params?: { job_id?: number; status?: ApplicationStatus }) => {
    const res = await apiClient.get<JobApplication[]>("/applications", { params });
    return res.data;
  },
  getApplication: async (applicationId: number) => {
    const res = await apiClient.get<JobApplication>(`/applications/${applicationId}`);
    return res.data;
  },
  updateStatus: async (
    applicationId: number,
    payload: { status: ApplicationStatus; recruiter_feedback?: string }
  ) => {
    const res = await apiClient.put<JobApplication>(
      `/applications/${applicationId}/status`,
      payload
    );
    return res.data;
  },
  withdraw: async (applicationId: number) => {
    const res = await apiClient.delete<{ message: string }>(
      `/applications/${applicationId}`
    );
    return res.data;
  },
};

export const atsApi = {
  evaluate: async (payload: {
    job_id: number;
    student_id?: number;
    custom_resume_text?: string;
  }) => {
    const res = await apiClient.post<ATSEvaluationResponse>("/ats/evaluate", payload);
    return res.data;
  },
};
