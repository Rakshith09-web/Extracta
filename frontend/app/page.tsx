import Link from "next/link";
import { HealthBadge } from "@/components/HealthBadge";
import { ShieldCheck, Database, Cpu, Zap, ArrowRight, CheckCircle2, Lock, Terminal } from "lucide-react";

export default function Home() {
  const phase1Checklist = [
    { title: "Next.js 14 App Router + Tailwind CSS", status: "Completed", desc: "Cookie-based SSR authentication via @supabase/ssr" },
    { title: "FastAPI Business Logic Backend", status: "Completed", desc: "Dual Supabase clients (User RLS vs Admin Service-Role)" },
    { title: "Supabase PostgreSQL Database", status: "Completed", desc: "Multi-tenant schema (tenants, profiles) + auto-provision triggers" },
    { title: "Row Level Security (RLS)", status: "Completed", desc: "Tenant isolation and RBAC enforced at PostgreSQL engine level" },
    { title: "Supabase Auth Token Verification", status: "Completed", desc: "FastAPI validates JWTs and extracts tenant context" },
    { title: "Redis Background Queue Setup", status: "Completed", desc: "Ready for Celery/RQ job dispatching (no duplicate postgres)" },
  ];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-900/80 to-slate-950 border border-slate-800 p-8 md:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Phase 1: Supabase &amp; Core Architecture Foundation
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Production-Ready <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              AI-Powered Sales CRM Platform
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Unified foundation pairing Supabase Auth, PostgreSQL Row Level Security (RLS), FastAPI, and Next.js SSR for tenant-isolated sales workflows.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 group"
            >
              Get Started / Sign Up
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm transition-colors flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-indigo-400" />
              Protected Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Realtime Health Badge */}
      <HealthBadge />

      {/* Phase 1 Verification Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Phase 1 Architecture Deliverables
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phase1Checklist.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-indigo-400 font-medium">0{idx + 1}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {item.status}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture Flow Diagram */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          End-to-End System Data Flow
        </h3>
        <pre className="p-4 rounded-lg bg-slate-950 border border-slate-850 text-xs font-mono text-indigo-200 overflow-x-auto leading-relaxed">
{`Sales Manager ──> Next.js ──> Supabase Auth (JWT) ──> FastAPI (/api/v1/auth/me)
                                                             │
                                   ┌─────────────────────────┴─────────────────────────┐
                                   ▼                                                   ▼
                       PostgreSQL (Supabase RLS)                             Redis (Job Broker)
                       ├── tenants                                           ├── Long-running Jobs
                       ├── profiles (User identity)                          └── Phase 6 Workers
                       └── (Phase 3: Leads, Jobs, Integrations)`}
        </pre>
      </div>
    </div>
  );
}
