"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HealthBadge } from "@/components/HealthBadge";
import { 
  Building2, 
  User, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  Users, 
  MailCheck, 
  RefreshCw, 
  ArrowRight,
  History,
  Puzzle,
  TrendingUp,
  Activity
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [backendContext, setBackendContext] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    total_leads: 0,
    validated_leads: 0,
    enriched_leads: 0,
    synced_leads: 0,
    total_searches: 0,
  });
  const [loading, setLoading] = useState(true);

  // Quick Prompt input
  const [quickPrompt, setQuickPrompt] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const { data: { session }, error: authErr } = await supabase.auth.getSession();
      if (authErr || !session) {
        router.push("/login");
        return;
      }
      setSessionUser(session.user);
      setToken(session.access_token);
      await fetchDashboardData(session.access_token);
    }
    loadDashboard();
  }, [router, supabase]);

  const fetchDashboardData = async (accessToken: string) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // 1. Fetch user context & role
      const meRes = await fetch(`${apiUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (meRes.ok) {
        const data = await meRes.json();
        setBackendContext(data);
      }

      // 2. Fetch lead metrics
      const statsRes = await fetch(`${apiUrl}/api/v1/leads/stats`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.warn("Error loading dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    router.push("/assistant");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400 font-mono">Loading Sales Operations Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-slate-950 border border-slate-800 p-6 md:p-8 overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                Organization Active
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {backendContext?.tenant?.name || "Acme Sales Corp"} &bull; {backendContext?.profile?.role || "ADMIN"}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Welcome back, {backendContext?.profile?.full_name || "Sales Leader"}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Your AI Sales Agent is ready to discover, validate, and synchronize high-value B2B prospects.
            </p>
          </div>

          <Link
            href="/assistant"
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 self-start md:self-auto shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch AI Prospect Search</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Discovered Leads</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{stats.total_leads}</p>
          <p className="text-[11px] text-slate-500">Total prospects in database</p>
        </div>

        {/* Validated Leads */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Verified Deliverable</span>
            <MailCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{stats.validated_leads}</p>
          <p className="text-[11px] text-emerald-400/80 font-medium">SMTP/MX validated</p>
        </div>

        {/* Enriched Profiles */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Enriched Profiles</span>
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{stats.enriched_leads}</p>
          <p className="text-[11px] text-blue-400/80">Apollo / Social intelligence</p>
        </div>

        {/* CRM Synced */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Twenty CRM Synced</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{stats.synced_leads}</p>
          <p className="text-[11px] text-purple-400/80">Active in CRM pipeline</p>
        </div>
      </div>

      {/* Quick AI Search Prompt Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Quick AI Prospect Discovery
        </h3>
        <form onSubmit={handleQuickSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            placeholder="e.g. Find 50 SaaS CTOs and VP Engineers in Bangalore with verified emails..."
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors shrink-0"
          >
            <span>Run Search</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/leads"
          className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-850/60 hover:border-indigo-500/40 transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="font-bold text-white text-sm">Leads Directory</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Review discovered leads, filter by validation score, and sync approved contacts.
          </p>
        </Link>

        <Link
          href="/searches"
          className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-850/60 hover:border-indigo-500/40 transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="font-bold text-white text-sm">Search History &amp; Pipeline</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Monitor background agent discovery stages, progress meters, and tool execution logs.
          </p>
        </Link>

        <Link
          href="/integrations"
          className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-850/60 hover:border-indigo-500/40 transition-all space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Puzzle className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="font-bold text-white text-sm">Integrations Hub</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Manage Twenty CRM, Google Sheets, Apollo.io, and Apify scraper connections.
          </p>
        </Link>
      </div>

      {/* System Health Check Widget */}
      <HealthBadge />
    </div>
  );
}
