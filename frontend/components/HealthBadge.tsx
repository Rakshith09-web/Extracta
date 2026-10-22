"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, RefreshCw, Server, Database, Layers } from "lucide-react";

interface HealthData {
  status: string;
  version: string;
  environment: string;
  services: {
    fastapi?: { status: string; latency_ms?: number; details?: string };
    supabase?: { status: string; latency_ms?: number; details?: string };
    redis?: { status: string; latency_ms?: number; details?: string };
  };
}

export function HealthBadge() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/health`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setHealth(data);
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-white text-sm">System Health & Connectivity</h3>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          title="Refresh health status"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
        </button>
      </div>

      {error ? (
        <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-lg text-red-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Backend Unreachable</p>
            <p className="text-red-400/80 mt-0.5">{error}. Ensure FastAPI is running on port 8000.</p>
          </div>
        </div>
      ) : health ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* FastAPI */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-slate-300">FastAPI Backend</p>
                <p className="text-[11px] text-slate-500 font-mono">v{health.version}</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
              {health.services.fastapi?.status || "online"}
            </span>
          </div>

          {/* Supabase */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-slate-300">Supabase Auth/DB</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {health.services.supabase?.latency_ms ? `${health.services.supabase.latency_ms}ms` : "Connected"}
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
              health.services.supabase?.status === "healthy"
                ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                : "bg-amber-950 text-amber-400 border-amber-800"
            }`}>
              {health.services.supabase?.status || "ready"}
            </span>
          </div>

          {/* Redis */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="text-xs font-medium text-slate-300">Redis Broker</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {health.services.redis?.latency_ms ? `${health.services.redis.latency_ms}ms` : "Queue Ready"}
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
              health.services.redis?.status === "healthy"
                ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                : "bg-indigo-950 text-indigo-400 border-indigo-800"
            }`}>
              {health.services.redis?.status || "ready"}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500 animate-pulse py-2">Probing backend and Supabase services...</div>
      )}
    </div>
  );
}
