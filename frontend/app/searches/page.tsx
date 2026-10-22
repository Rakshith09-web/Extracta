"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  History, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Users, 
  Search, 
  PlayCircle,
  Cpu,
  Layers,
  RotateCw,
  Trash2
} from "lucide-react";

export default function SearchesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [searches, setSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [rerunningId, setRerunningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const STAGES = ["UNDERSTAND", "EXTRACT", "PLAN", "EXECUTE", "VALIDATE", "STORE", "SYNC"];

  useEffect(() => {
    async function loadSearches() {
      const { data: { session }, error: authErr } = await supabase.auth.getSession();
      if (authErr || !session) {
        router.push("/login");
        return;
      }
      setToken(session.access_token);
      await fetchSearches(session.access_token, true);
    }
    loadSearches();
  }, [router, supabase]);

  // Live polling interval for running jobs
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      const hasActiveJobs = searches.some(
        (s) => s.status === "PROCESSING" || s.job?.status === "RUNNING" || s.job?.status === "QUEUED" || s.job?.status === "PENDING"
      );
      if (hasActiveJobs) {
        fetchSearches(token, false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [token, searches]);

  const fetchSearches = async (accessToken: string, showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/searches/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load search history");
      const data = await res.json();
      setSearches(data);
    } catch (err: any) {
      if (showSpinner) setError(err.message || "Could not retrieve searches");
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleRerun = async (requestId: string) => {
    if (!token) return;
    setRerunningId(requestId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/searches/${requestId}/run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchSearches(token, false);
      }
    } catch (err) {
      console.error("Rerun failed:", err);
    } finally {
      setRerunningId(null);
    }
  };

  const handleDeleteSearch = async (requestId: string, requestText: string) => {
    if (!token) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this search?\n\n"${requestText}"\n\nThis will remove this search and its associated execution records.`
    );
    if (!confirmDelete) return;

    setDeletingId(requestId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/searches/${requestId}?delete_leads=true`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete search request");
      // Remove deleted item from local state immediately for instant feedback
      setSearches((prev) => prev.filter((s) => s.id !== requestId));
    } catch (err: any) {
      alert(err.message || "Failed to delete search");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800">
              Redis Queue &amp; Background Workers
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total Searches: {searches.length}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-indigo-400" />
            AI Search Requests &amp; Jobs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time pipeline execution monitor streaming LangGraph stages from background workers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => token && fetchSearches(token, true)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            href="/assistant"
            className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            New Search Request
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-950/40 border border-red-900 rounded-lg text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {searches.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No search requests yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Use the AI Sales Assistant to prompt your first natural language prospect search.
          </p>
          <Link
            href="/assistant"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium"
          >
            Launch AI Assistant <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {searches.map((search) => {
            const parsed = search.parsed_parameters || {};
            const job = search.job;
            const isRunning = job?.status === "RUNNING" || job?.status === "QUEUED" || search.status === "PROCESSING";
            const progress = job?.progress ?? (search.status === "COMPLETED" ? 100 : 20);
            const currentStage = (job?.stage || "UNDERSTAND").toUpperCase();

            return (
              <div
                key={search.id}
                className={`rounded-xl border bg-slate-900/60 p-6 space-y-4 shadow-lg transition-all ${
                  isRunning ? "border-indigo-500/60 ring-1 ring-indigo-500/30" : "border-slate-800"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="space-y-1">
                    <p className="font-semibold text-white text-sm leading-snug">
                      &ldquo;{search.request_text}&rdquo;
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Request ID: {search.id} &bull; Created: {new Date(search.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${
                        search.status === "COMPLETED" || job?.status === "COMPLETED"
                          ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                          : isRunning
                          ? "bg-indigo-950 text-indigo-400 border-indigo-800 animate-pulse"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {isRunning ? "PROCESSING (WORKER ACTIVE)" : (job?.status || search.status)}
                    </span>
                    <button
                      onClick={() => handleRerun(search.id)}
                      disabled={rerunningId === search.id || isRunning}
                      title="Re-run pipeline"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-40"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${rerunningId === search.id ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      onClick={() => handleDeleteSearch(search.id, search.request_text)}
                      disabled={deletingId === search.id}
                      title="Delete search request"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800 transition-colors disabled:opacity-40"
                    >
                      {deletingId === search.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Parsed Parameter Chips */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {parsed.industry && (
                    <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                      Industry: <strong className="text-indigo-300">{parsed.industry}</strong>
                    </span>
                  )}
                  {parsed.location && (
                    <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                      Location: <strong className="text-indigo-300">{parsed.location}</strong>
                    </span>
                  )}
                  {parsed.job_title && (
                    <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                      Title: <strong className="text-indigo-300">{parsed.job_title}</strong>
                    </span>
                  )}
                  {parsed.lead_count && (
                    <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                      Target: <strong className="text-indigo-300">{parsed.lead_count} Leads</strong>
                    </span>
                  )}
                </div>

                {/* Real-time Stage Pipeline Indicator */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 pt-1">
                  {STAGES.map((st, i) => {
                    const isCurrent = currentStage === st;
                    const isPassed = (search.status === "COMPLETED" || job?.status === "COMPLETED") || (STAGES.indexOf(currentStage) > i);

                    return (
                      <div
                        key={st}
                        className={`p-2 rounded-lg text-center text-[10px] font-mono transition-all border ${
                          isCurrent && isRunning
                            ? "bg-indigo-950/80 text-indigo-300 border-indigo-500 animate-pulse font-bold"
                            : isPassed
                            ? "bg-slate-950 text-emerald-400 border-emerald-900/60"
                            : "bg-slate-950/50 text-slate-600 border-slate-850"
                        }`}
                      >
                        <span className="block text-[9px] text-slate-500">0{i+1}</span>
                        <span>{st}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar and results link */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex-1 max-w-md space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>Worker Pipeline Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href="/leads"
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-slate-700 transition-colors shrink-0"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>View Discovered Leads ({search.discovered_leads_count || 0})</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
