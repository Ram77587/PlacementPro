import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PlacementPro - Next-Gen Campus Placement Management System",
  description:
    "End-to-end placement automation with Role-Based Access Control (Student, Recruiter, Admin) and Groq AI ATS Compatibility Scoring.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
            <p>© {new Date().getFullYear()} PlacementPro Systems. Built with FastAPI, PostgreSQL, and Groq AI.</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
