"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Layers,
  Code
} from "lucide-react";

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;
  const supabase = createClient();

  const [leadData, setLeadData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLead() {
      const { data: { session }, error: authErr } = await supabase.auth.getSession();
      if (authErr || !session) {
        router.push("/login");
        return;
      }
      fetchLead(session.access_token);
    }
    loadLead();
  }, [leadId, router, supabase]);

  const fetchLead = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Lead record not found");
      const data = await res.json();
      setLeadData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load lead details");
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

  if (error || !leadData?.lead) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl border border-slate-800 bg-slate-900/60 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Lead Not Found</h2>
        <p className="text-xs text-slate-400">{error || "The requested lead does not exist in your tenant."}</p>
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Leads Table
        </Link>
      </div>
    );
  }

  const { lead, validations, enrichments, mappings } = leadData;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-2">
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Leads
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {lead.full_name || `${lead.first_name || ""} ${lead.last_name || ""}`}
          </h1>
          <p className="text-sm text-slate-300">
            {lead.job_title} at <strong className="text-white">{lead.company_name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              lead.lead_status === "APPROVED" || lead.lead_status === "SYNCED_TO_CRM"
                ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                : "bg-slate-800 text-slate-300 border-slate-700"
            }`}
          >
            {lead.lead_status}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800 font-mono">
            {lead.source}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2 pb-3 border-b border-slate-800">
            <Mail className="w-4 h-4 text-indigo-400" />
            Contact Profile
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-slate-500 uppercase text-[10px] tracking-wider">Email Address</p>
              <p className="font-mono text-indigo-300 break-all">{lead.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase text-[10px] tracking-wider">Phone</p>
              <p className="text-slate-300">{lead.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase text-[10px] tracking-wider">Location</p>
              <p className="text-slate-300">{lead.location || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Company Info Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2 pb-3 border-b border-slate-800">
            <Building2 className="w-4 h-4 text-indigo-400" />
            Company Details
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-slate-500 uppercase text-[10px] tracking-wider">Company Name</p>
              <p className="font-medium text-white">{lead.company_name}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase text-[10px] tracking-wider">Industry</p>
              <p className="text-slate-300">{lead.industry || "Technology"}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase text-[10px] tracking-wider">Company Size</p>
              <p className="text-slate-300">{lead.company_size || "50-250 Employees"}</p>
            </div>
          </div>
        </div>

        {/* CRM Sync Status Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2 pb-3 border-b border-slate-800">
            <Database className="w-4 h-4 text-indigo-400" />
            Twenty CRM &amp; Sheets
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-slate-500 uppercase text-[10px] tracking-wider">Twenty CRM Status</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800 mt-1">
                {mappings.length > 0 ? mappings[0].sync_status : "Ready for Sync"}
              </span>
            </div>
            <div>
              <p className="text-slate-500 uppercase text-[10px] tracking-wider">External Record ID</p>
              <p className="font-mono text-slate-400 truncate">
                {mappings.length > 0 ? mappings[0].crm_record_id : "tw_auto_provision"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation & Enrichment Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Validation Checks */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Email Deliverability &amp; Validation Log
          </h3>

          {validations.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No validation tests run yet.</p>
          ) : (
            <div className="space-y-3">
              {validations.map((v: any) => (
                <div key={v.id} className="p-3.5 rounded-lg bg-slate-950 border border-slate-850 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{v.validation_type}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {v.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Provider: {v.provider}</p>
                  <pre className="p-2 rounded bg-slate-900 text-[10px] font-mono text-slate-300 overflow-x-auto">
                    {JSON.stringify(v.result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enrichment Details */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Third-Party Enrichment Payload
          </h3>

          {enrichments.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No enrichment payload available.</p>
          ) : (
            <div className="space-y-3">
              {enrichments.map((e: any) => (
                <div key={e.id} className="p-3.5 rounded-lg bg-slate-950 border border-slate-850 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Enrichment Result</span>
                    <span className="text-[11px] text-slate-400 font-mono">{e.provider}</span>
                  </div>
                  <pre className="p-2 rounded bg-slate-900 text-[10px] font-mono text-indigo-200 overflow-x-auto">
                    {JSON.stringify(e.result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
