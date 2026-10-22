"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Sparkles, 
  Search, 
  Sliders, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Building, 
  MapPin, 
  Briefcase, 
  MailCheck, 
  Layers 
} from "lucide-react";

export default function AssistantPage() {
  const router = useRouter();
  const supabase = createClient();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const samplePrompts = [
    "Find 100 software companies in Ahmedabad and identify their HR managers with verified email addresses.",
    "Find 50 VP of Sales at SaaS startups in Bangalore with deliverable emails.",
    "Discover 30 Fintech founders and Chief Technology Officers in Mumbai.",
    "Find 75 Healthcare directors and operations leads in Delhi NCR."
  ];

  const handleLaunchSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data: { session }, error: authErr } = await supabase.auth.getSession();
      if (authErr || !session) {
        router.push("/login");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/searches/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ request_text: prompt }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to initiate search request");
      }

      const data = await res.json();
      setResult(data);
      
      // Auto redirect to searches tracking page after 2 seconds
      setTimeout(() => {
        router.push("/searches");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit search prompt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Autonomous AI Sales Agent
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          AI Sales Lead Assistant
        </h1>
        <p className="text-sm text-slate-300">
          Describe the prospects you want in plain English. The AI agent extracts parameters, discovers matching companies, verifies emails, and enriches contact profiles.
        </p>
      </div>

      {/* Main Prompt Form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6">
        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-900 rounded-lg text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Search Request Created &amp; Queued in Supabase!</span>
            </div>
            <p className="text-xs text-slate-300 font-mono">
              Job ID: {result.job?.id} &bull; Target: {result.parsed_parameters?.lead_count} Leads &bull; Redirecting to Search History...
            </p>
          </div>
        )}

        <form onSubmit={handleLaunchSearch} className="space-y-4">
          <div className="relative">
            <textarea
              rows={4}
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Find 100 software companies in Ahmedabad and identify their HR managers with verified email addresses."
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <MailCheck className="w-4 h-4 text-indigo-400" />
              Includes real-time SMTP/MX email verification &amp; deduplication
            </span>

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting to Agent...</span>
                </>
              ) : (
                <>
                  <span>Find Leads Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Prompt Suggestions */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Suggested Sales Search Queries
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {samplePrompts.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(s)}
                className="p-3 text-left rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-850 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white transition-all flex items-start gap-2"
              >
                <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>{s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Execution Pipeline Overview */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          LangGraph Agent Execution Pipeline
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
          {["UNDERSTAND", "EXTRACT", "PLAN", "EXECUTE", "VALIDATE", "STORE", "SYNC"].map((stage, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-850">
              <span className="text-[10px] text-indigo-400 font-mono block">0{i+1}</span>
              <span className="font-semibold text-slate-300 text-[11px]">{stage}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
