"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  ShieldAlert, 
  RefreshCw, 
  AlertCircle, 
  Clock, 
  User, 
  Terminal,
  Activity
} from "lucide-react";

export default function AuditLogsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      const { data: { session }, error: authErr } = await supabase.auth.getSession();
      if (authErr || !session) {
        router.push("/login");
        return;
      }
      fetchLogs(session.access_token);
    }
    loadLogs();
  }, [router, supabase]);

  const fetchLogs = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/audit-logs/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        if (res.status === 403) throw new Error("Access Restricted: Audit logs are reserved for Admins and Sales Managers.");
        throw new Error("Failed to load audit logs");
      }
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
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
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800">
            Compliance &amp; Security
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Total Events: {logs.length}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Activity className="w-7 h-7 text-indigo-400" />
          Audit &amp; Security Logs
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Chronological record of searches, lead modifications, role updates, and system operations.
        </p>
      </div>

      {error ? (
        <div className="p-4 bg-amber-950/40 border border-amber-900/60 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">RBAC Notice</p>
            <p className="mt-1 text-amber-300/80">{error}</p>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No audit events recorded yet</h3>
          <p className="text-xs text-slate-400">
            Audit entries are automatically logged whenever a team member performs a sales search or modifies records.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {log.action}
                  </span>
                  <span className="text-slate-400">on resource</span>
                  <span className="font-mono text-slate-300 font-semibold">{log.resource_type}</span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Actor: <strong className="text-slate-200">{log.actor_name || "System"}</strong></span>
                  &bull;
                  <span className="font-mono text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </p>
              </div>

              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="p-2 rounded bg-slate-950 border border-slate-850 font-mono text-[10px] text-slate-400 max-w-xs md:max-w-md overflow-x-auto truncate">
                  {JSON.stringify(log.metadata)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
