# 💻 PlacementPro - Frontend Web Application

The frontend user interface for **PlacementPro** is built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS v3.4**, and **Axios**. It consumes the FastAPI backend, enforcing strict Role-Based Access Control (**Student**, **Recruiter**, and **Admin / Placement Officer**), and integrates with the Groq AI ATS Compatibility Scoring engine.

---

## 🏗️ Project Architecture

```
frontend/
├── public/                           # Static assets & public resources
├── src/
│   ├── app/
│   │   ├── globals.css               # Tailwind CSS v3 directives & custom scrollbars
│   │   ├── layout.tsx                # Root layout with AuthProvider & global Navbar
│   │   ├── page.tsx                  # Landing page with interactive role portals
│   │   ├── login/
│   │   │   └── page.tsx              # LoginPage with role selector tabs & quick demo fill
│   │   ├── register/
│   │   │   └── page.tsx              # RegisterPage with dynamic role & academic profile setup
│   │   ├── student/
│   │   │   ├── dashboard/page.tsx    # StudentDashboard (Stats, upcoming schedule, recent apps)
│   │   │   ├── jobs/page.tsx         # JobSearch (Search bar, sidebar filters, JobCards)
│   │   │   └── applications/page.tsx # ApplicationTracker (Kanban board with 5 lifecycle stages)
│   │   ├── recruiter/
│   │   │   └── dashboard/page.tsx    # RecruiterDashboard (Job posting form modal, ApplicantDataTable)
│   │   └── admin/
│   │       └── dashboard/page.tsx    # AdminDashboard (Placement rate analytics & UserManagementTable)
│   ├── components/
│   │   ├── Navbar.tsx                # Role-aware navigation header & user profile badge
│   │   ├── ProtectedRoute.tsx        # RBAC route guard component redirecting unauthorized roles
│   │   └── student/
│   │       ├── AtsAnalyzerModal.tsx  # Groq AI ATS Match Score circular gauge & actionable feedback
│   │       └── JobCard.tsx           # Job card with CTC pill, skills tags, eligibility indicator
│   ├── context/
│   │   └── AuthContext.tsx           # React Context for JWT tokens, user state, and auth lifecycle
│   └── lib/
│       └── api.ts                    # Axios client, JWT request interceptor, 401 redirect handler
├── postcss.config.mjs                # PostCSS configuration for Tailwind v3
├── tailwind.config.ts                # Tailwind CSS v3 design tokens & color palette
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Next.js dependencies (axios, lucide-react, tailwindcss)
```

---

## ⚡ Key Highlights & Implementation Details

1. **Authentication & Axios Interceptor (`src/lib/api.ts`):**
   - Automatically injects `Authorization: Bearer <token>` into outgoing protected API calls.
   - Intercepts `401 Unauthorized` responses, clears invalid credentials, and redirects to `/login`.

2. **Role-Based Access Control (`src/components/ProtectedRoute.tsx`):**
   - Restricts view access to authorized roles (`allowedRoles={["student"]}`, `allowedRoles={["recruiter"]}`, `allowedRoles={["admin"]}`).
   - Redirects unauthenticated users to `/login`.

3. **Student Portal:**
   - **Student Dashboard:** Key metrics, upcoming interview timeline, recent applications.
   - **Job Search:** Real-time search, filters (Location, Minimum CTC, Eligibility toggle), and `JobCard` components.
   - **AtsAnalyzerModal (Unique Feature!):**
     - Consumes the backend Groq AI endpoint (`POST /ats/evaluate`).
     - Renders an animated **Circular SVG Progress Gauge** displaying the ATS Match percentage.
     - Breakdown cards: **Matching Skills** (green check pills) and **Missing Skills** (amber pills).
     - Bulleted list of actionable AI feedback and recommendations from Groq LLaMA 3.3.
     - "Apply with these insights" CTA button.
   - **Application Tracker:**
     - 5-column Kanban board (`Applied`, `Shortlisted`, `Interviewing`, `Offered`, `Rejected`).
     - Display of ATS Match Score badges, applied timestamps, recruiter feedback notes, and application withdrawal.

4. **Recruiter Portal:**
   - Active vacancy summaries, total applicants received, and offers count.
   - `JobPostingForm` modal to publish new campus vacancies with Title, CTC, Min CGPA, Eligible Branches, and Required Skills.
   - `ApplicantDataTable`: Candidate Name, Roll Number, Branch, CGPA, ATS Score badge, and an interactive status update dropdown with recruiter feedback modal.

5. **Placement Officer / Admin Console:**
   - Institutional placement rate metrics (`84.5%`), median package (`₹16.8 LPA`), and department breakdown charts.
   - `UserManagementTable` grid to audit system accounts, search by name/email, filter by role, and toggle account activation.

---

## 🏃 Running the Frontend

To start the Next.js development server:
```powershell
cd "d:\Fastapi project\frontend"
npm run dev
```

Open your browser at:
- **Web App:** [http://localhost:3000](http://localhost:3000)
- **Login Page:** [http://localhost:3000/login](http://localhost:3000/login)
- **Register Page:** [http://localhost:3000/register](http://localhost:3000/register)
- **FastAPI Backend Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
