"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Building2, 
  MapPin,
  Check,
  X,
  PlusCircle
} from "lucide-react";

export default function LeadsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [validationFilter, setValidationFilter] = useState("ALL");
  const [enrichmentFilter, setEnrichmentFilter] = useState("ALL");

  const [seedLoading, setSeedLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { session }, error: authErr } = await supabase.auth.getSession();
      if (authErr || !session) {
        router.push("/login");
        return;
      }
      setToken(session.access_token);
      fetchLeads(session.access_token);
    }
    loadData();
  }, [router, supabase]);

  const fetchLeads = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("query", searchQuery.trim());
      if (statusFilter !== "ALL") params.append("lead_status", statusFilter);
      if (validationFilter !== "ALL") params.append("validation_status", validationFilter);
      if (enrichmentFilter !== "ALL") params.append("enrichment_status", enrichmentFilter);

      const res = await fetch(`${apiUrl}/api/v1/leads/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load leads");
      const data = await res.json();
      setLeads(data);
    } catch (err: any) {
      setError(err.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) fetchLeads(token);
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    if (!token) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lead_status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update lead status");
      const updated = await res.json();
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      setActionSuccess(`Lead marked as ${newStatus}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleSeedMock = async () => {
    if (!token) return;
    setSeedLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/leads/seed-mock`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to seed sample leads");
      await fetchLeads(token);
      setActionSuccess("Sample leads populated successfully!");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Seed failed: ${err.message}`);
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800">
              Pipeline Records
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total Discovered: {leads.length}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-400" />
            Lead Discovery &amp; Qualification
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review discovered prospects, verify email deliverability, inspect enrichment, and sync to Twenty CRM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {leads.length === 0 && (
            <button
              onClick={handleSeedMock}
              disabled={seedLoading}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>{seedLoading ? "Seeding..." : "Load Sample Leads"}</span>
            </button>
          )}
          <Link
            href="/assistant"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Search Assistant</span>
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by prospect name, company, email, or industry..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Status: All</option>
              <option value="NEW">Status: NEW</option>
              <option value="REVIEWED">Status: REVIEWED</option>
              <option value="APPROVED">Status: APPROVED</option>
              <option value="REJECTED">Status: REJECTED</option>
              <option value="SYNCED_TO_CRM">Status: SYNCED TO CRM</option>
            </select>

            <select
              value={validationFilter}
              onChange={(e) => setValidationFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Validation: All</option>
              <option value="VALID">Validation: VALID</option>
              <option value="PENDING">Validation: PENDING</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No leads found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria or launch the AI Assistant to discover prospects.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleSeedMock}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
            >
              Load Demo Leads
            </button>
            <Link
              href="/assistant"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium"
            >
              Launch Search
            </Link>
          </div>
        </div>
      ) : (
        /* Leads Table */
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Prospect &amp; Title</th>
                  <th className="px-5 py-3.5">Company &amp; Industry</th>
                  <th className="px-5 py-3.5">Email &amp; Deliverability</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Lead Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-850/40 transition-colors">
                    {/* Prospect */}
                    <td className="px-5 py-4">
                      <Link href={`/leads/${lead.id}`} className="font-semibold text-white hover:text-indigo-400 transition-colors block">
                        {lead.full_name || `${lead.first_name || ""} ${lead.last_name || ""}`}
                      </Link>
                      <span className="text-[11px] text-slate-400 block">{lead.job_title || "N/A"}</span>
                    </td>

                    {/* Company */}
                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-200 block">{lead.company_name || "N/A"}</span>
                      <span className="text-[11px] text-slate-500 block">{lead.industry || "General"}</span>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300">{lead.email || "No Email"}</span>
                        {lead.validation_status === "VALID" && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            VALID
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">{lead.phone || ""}</span>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4 text-slate-400">
                      <span>{lead.location || "India"}</span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          lead.lead_status === "APPROVED" || lead.lead_status === "SYNCED_TO_CRM"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : lead.lead_status === "REVIEWED"
                            ? "bg-blue-950 text-blue-400 border-blue-800"
                            : lead.lead_status === "REJECTED"
                            ? "bg-red-950 text-red-400 border-red-800"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {lead.lead_status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.lead_status !== "APPROVED" && (
                          <button
                            onClick={() => handleUpdateStatus(lead.id, "APPROVED")}
                            title="Approve Lead"
                            className="p-1.5 rounded-md bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link
                          href={`/leads/${lead.id}`}
                          title="View Details"
                          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
