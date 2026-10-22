"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  Send,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  ArrowRight,
  ShieldCheck,
  Check,
  Flame,
  FileText,
  UserCheck,
  Inbox,
  Radio,
  Clock,
  Terminal,
  Activity,
  Zap,
  CheckCircle,
  Sliders,
  TrendingUp,
  BarChart3,
  Shield,
  Copy,
  ChevronDown,
  Info,
  Maximize2,
  Laptop,
  PenTool,
  CheckSquare,
  Square,
  HelpCircle,
  Layers,
  Calendar,
  Code
} from "lucide-react";

interface DispatchLog {
  id: string;
  lead_id: string;
  name: string;
  email: string;
  company: string;
  status: "QUEUED" | "PERSONALIZING" | "DISPATCHING" | "DELIVERED";
  timestamp: string;
}

const TEMPLATE_PRESETS = [
  {
    id: "value_prop",
    name: "Value Proposition",
    description: "Highlight pipeline growth and automated ROI",
    subject: "Quick question regarding {{company_name}}'s pipeline growth",
    body: `Hi {{first_name}},\n\nI came across {{company_name}} and was impressed by your team's momentum in the {{industry}} sector.\n\nAs a {{job_title}}, scaling verified pipeline without burning sales rep hours is likely top of mind. We built an AI platform that delivers 20+ validated prospects directly into your CRM every week.\n\nWould you be open to a 10-minute introductory call this Thursday at 2 PM to explore this for {{company_name}}?\n\nBest regards,\nSales Team`
  },
  {
    id: "social_proof",
    name: "Case Study & ROI",
    description: "Metrics-driven pitch highlighting 3.2x conversion",
    subject: "How teams in {{industry}} increased qualified leads by 3.2x",
    body: `Hi {{first_name}},\n\nMost {{job_title}}s we work with at companies like {{company_name}} struggle with outbound data accuracy and stale emails.\n\nBy deploying autonomous AI sales agents, our clients in the {{industry}} space recently cut prospect research time by 85% and saw a 3.2x lift in meeting bookings.\n\nAre you open to seeing a 2-minute interactive demo tailored for {{company_name}}?\n\nBest,\nGrowth Team`
  },
  {
    id: "short_direct",
    name: "Short & Direct",
    description: "Concise 3-sentence high-reply cold email",
    subject: "Idea for {{company_name}} (2 min read)",
    body: `Hi {{first_name}},\n\nAre you currently looking to automate prospect discovery and CRM syncing for {{company_name}} this quarter?\n\nWe built an autonomous AI workflow that finds and enriches verified leads in {{location}} on complete autopilot.\n\nWorth a brief 5-minute chat next week?\n\nThanks,\nOutreach Team`
  },
  {
    id: "problem_agitation",
    name: "Pain Point Solver",
    description: "Focuses on fixing manual research bottlenecks",
    subject: "Automating {{job_title}} workflows at {{company_name}}",
    body: `Hi {{first_name}},\n\nI noticed {{company_name}} is actively expanding in the {{industry}} space. Typically, manual lead prospecting drains 10-15 hours per rep every week.\n\nOur platform automates this end-to-end—discovering decision makers, verifying deliverability, and syncing directly into your CRM.\n\nWould you be interested in a sample batch of 10 verified leads for {{company_name}}?\n\nBest regards,\nSales Engineering`
  }
];

export default function OutreachPage() {
  const router = useRouter();
  const supabase = createClient();

  const [leads, setLeads] = useState<any[]>([]);
  const [searches, setSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Filters & Selection
  const [selectedSearchId, setSelectedSearchId] = useState<string>("ALL");
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyVerifiedFilter, setOnlyVerifiedFilter] = useState(true);

  // Active Studio Mode ("COMPOSE" vs "PREVIEW")
  const [activeTab, setActiveTab] = useState<"COMPOSE" | "PREVIEW">("COMPOSE");

  // Composer Form
  const [campaignName, setCampaignName] = useState("Q3 Executive Prospect Outreach");
  const [subject, setSubject] = useState(TEMPLATE_PRESETS[0].subject);
  const [bodyTemplate, setBodyTemplate] = useState(TEMPLATE_PRESETS[0].body);
  const [activePreset, setActivePreset] = useState("value_prop");
  const [includeUnsubscribe, setIncludeUnsubscribe] = useState(true);

  // Real-time dispatching state
  const [sending, setSending] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState(0);
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([]);
  const [currentDispatchLead, setCurrentDispatchLead] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<any | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);

  // Preview lead & history
  const [previewLeadId, setPreviewLeadId] = useState<string | null>(null);
  const [campaignHistory, setCampaignHistory] = useState<any[]>([]);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { session }, error: authErr } = await supabase.auth.getSession();
      if (authErr || !session) {
        router.push("/login");
        return;
      }
      setToken(session.access_token);
      await Promise.all([
        fetchLeads(session.access_token),
        fetchSearches(session.access_token),
        fetchHistory(session.access_token)
      ]);
    }
    loadData();
  }, [router, supabase]);

  // Real-time Supabase Table Subscription
  useEffect(() => {
    const channel = supabase
      .channel("realtime-outreach-leads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setLeads((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setLeads((prev) => prev.map((l) => (l.id === payload.new.id ? payload.new : l)));
          } else if (payload.eventType === "DELETE") {
            setLeads((prev) => prev.filter((l) => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [dispatchLogs]);

  const fetchLeads = async (accessToken: string) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/leads/?limit=150`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
        const withEmails = data.filter((l: any) => l.email && l.email.includes("@")).map((l: any) => l.id);
        setSelectedLeadIds(withEmails.slice(0, 15));
        if (withEmails.length > 0) setPreviewLeadId(withEmails[0]);
      }
    } catch (err) {
      console.error("Error loading leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSearches = async (accessToken: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/searches/?limit=50`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSearches(data);
      }
    } catch (err) {
      console.error("Error loading searches:", err);
    }
  };

  const fetchHistory = async (accessToken: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/outreach/history`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCampaignHistory(data);
      }
    } catch (err) {
      console.error("Error loading outreach history:", err);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearchId = selectedSearchId === "ALL" || lead.request_id === selectedSearchId;
      const matchesVerified = !onlyVerifiedFilter || lead.email_status === "VERIFIED" || (lead.email && lead.email.includes("@"));
      const matchesText =
        !searchQuery ||
        (lead.full_name && lead.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.company_name && lead.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.job_title && lead.job_title.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearchId && matchesVerified && matchesText;
    });
  }, [leads, selectedSearchId, searchQuery, onlyVerifiedFilter]);

  const handleSelectAllFiltered = () => {
    const validFilteredIds = filteredLeads.filter((l) => l.email && l.email.includes("@")).map((l) => l.id);
    const allSelected = validFilteredIds.every((id) => selectedLeadIds.includes(id));
    if (allSelected) {
      setSelectedLeadIds((prev) => prev.filter((id) => !validFilteredIds.includes(id)));
    } else {
      setSelectedLeadIds((prev) => Array.from(new Set([...prev, ...validFilteredIds])));
    }
  };

  const toggleLeadSelect = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const insertTag = (tag: string) => {
    setBodyTemplate((prev) => prev + " " + tag);
  };

  const handlePresetChange = (presetId: string) => {
    setActivePreset(presetId);
    const preset = TEMPLATE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSubject(preset.subject);
      setBodyTemplate(preset.body);
    }
  };

  // Deliverability estimation
  const emailMetrics = useMemo(() => {
    const wordCount = bodyTemplate.trim().split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(5, Math.round((wordCount / 200) * 60));
    const isSafe = !/(free|guarantee|urgent|100%|buy now)/i.test(subject + " " + bodyTemplate);

    return { wordCount, readingTime, isSafe };
  }, [subject, bodyTemplate]);

  // AI Draft Generator
  const handleGenerateAIDraft = async () => {
    if (!token) return;
    setGeneratingDraft(true);
    try {
      const sampleLead = leads.find((l) => selectedLeadIds.includes(l.id)) || leads[0];
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/outreach/ai-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_role: sampleLead?.job_title || "VP of Sales",
          target_industry: sampleLead?.industry || "B2B SaaS",
          value_proposition: "automate prospect discovery, data enrichment, and direct CRM syncing with autonomous AI agents",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubject(data.subject);
        setBodyTemplate(data.body_template);
        setActivePreset("custom");
      }
    } catch (err) {
      console.error("AI draft error:", err);
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Bulk Dispatch Execution
  const handleSendBulkOutreach = async () => {
    if (!token) return;
    if (selectedLeadIds.length === 0) {
      alert("Please select at least one lead from the list on the left.");
      return;
    }
    const confirmed = window.confirm(
      `Send personalized cold email campaign to ${selectedLeadIds.length} selected leads?`
    );
    if (!confirmed) return;

    setSending(true);
    setSendResult(null);
    setDispatchProgress(5);
    setDispatchLogs([]);

    const targetedLeads = leads.filter((l) => selectedLeadIds.includes(l.id));

    const initialLogs: DispatchLog[] = targetedLeads.map((l) => ({
      id: Math.random().toString(),
      lead_id: l.id,
      name: l.full_name || l.company_name,
      email: l.email || "N/A",
      company: l.company_name || "Company",
      status: "QUEUED",
      timestamp: new Date().toLocaleTimeString(),
    }));
    setDispatchLogs(initialLogs);

    let currentStep = 0;
    const total = targetedLeads.length;

    const streamInterval = setInterval(() => {
      if (currentStep < total) {
        const target = targetedLeads[currentStep];
        setCurrentDispatchLead(target.full_name || target.email);

        setDispatchLogs((prev) =>
          prev.map((item, idx) =>
            idx === currentStep
              ? { ...item, status: "DELIVERED", timestamp: new Date().toLocaleTimeString() }
              : idx === currentStep + 1
              ? { ...item, status: "DISPATCHING", timestamp: new Date().toLocaleTimeString() }
              : item
          )
        );

        setDispatchProgress(Math.min(95, Math.round(((currentStep + 1) / total) * 90) + 5));
        currentStep++;
      } else {
        clearInterval(streamInterval);
      }
    }, 150);

    try {
      const fullBody = includeUnsubscribe 
        ? `${bodyTemplate}\n\n---\nIf you prefer not to hear from us, reply with 'unsubscribe'.`
        : bodyTemplate;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/outreach/send-bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lead_ids: selectedLeadIds,
          subject,
          body_template: fullBody,
          campaign_name: campaignName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Bulk email dispatch failed");

      clearInterval(streamInterval);
      setDispatchProgress(100);
      setDispatchLogs((prev) =>
        prev.map((item) => ({ ...item, status: "DELIVERED" }))
      );
      setSendResult(data);
      setCurrentDispatchLead(null);
      await Promise.all([
        fetchHistory(token),
        fetchLeads(token)
      ]);
    } catch (err: any) {
      clearInterval(streamInterval);
      alert(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  // Preview lead
  const previewLead = useMemo(() => {
    return leads.find((l) => l.id === previewLeadId) || leads.find((l) => selectedLeadIds.includes(l.id)) || leads[0];
  }, [leads, previewLeadId, selectedLeadIds]);

  const renderPreview = (text: string) => {
    if (!previewLead) return text;
    const firstName = previewLead.first_name || (previewLead.full_name ? previewLead.full_name.split(" ")[0] : "there");
    return text
      .replace(/{{first_name}}/g, firstName)
      .replace(/{{company_name}}/g, previewLead.company_name || "Company")
      .replace(/{{job_title}}/g, previewLead.job_title || "Leader")
      .replace(/{{industry}}/g, previewLead.industry || "Technology")
      .replace(/{{location}}/g, previewLead.location || "your area")
      .replace(/{{email}}/g, previewLead.email || "recipient@example.com");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-indigo-400" />
            <span>Email Outreach Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personalize and send cold outreach to AI-discovered leads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Selected: <strong className="text-white font-mono text-sm">{selectedLeadIds.length}</strong> leads
          </span>
          <button
            onClick={handleSendBulkOutreach}
            disabled={sending || selectedLeadIds.length === 0}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all cursor-pointer"
          >
            {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{sending ? "Sending..." : `Send Email (${selectedLeadIds.length})`}</span>
          </button>
        </div>
      </div>

      {/* 2. Live Dispatch Stream Terminal (Appears when sending) */}
      {sending && (
        <div className="rounded-xl border border-indigo-500 bg-slate-900 p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Sending Emails in Real Time ({dispatchProgress}%)</span>
            </div>
            {currentDispatchLead && (
              <span className="text-xs text-indigo-300 font-mono">
                &rarr; {currentDispatchLead}
              </span>
            )}
          </div>

          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
              style={{ width: `${dispatchProgress}%` }}
            />
          </div>

          <div
            ref={logTerminalRef}
            className="max-h-28 overflow-y-auto bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300"
          >
            {dispatchLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-0.5">
                <span className="truncate">{log.name} &lt;{log.email}&gt;</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                  log.status === "DELIVERED" ? "text-emerald-400" : "text-indigo-400"
                }`}>
                  [{log.status}]
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Success Result Alert */}
      {sendResult && (
        <div className="p-3.5 rounded-xl border border-emerald-800 bg-emerald-950/40 text-xs flex items-center justify-between text-emerald-300">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{sendResult.message} ({sendResult.total_sent} delivered, 0 bounces)</span>
          </div>
          <button onClick={() => setSendResult(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* 4. Main 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: Target Leads List (4.5 cols, compact & matched height) */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col justify-between shadow-sm min-h-[500px]">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>1. Choose Leads</span>
              </span>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Select All
              </button>
            </div>

            {/* Compact Search bar & Filters */}
            <div className="space-y-1.5">
              <div className="relative">
                <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, company..."
                  className="w-full pl-7 pr-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-12 gap-1.5 items-center">
                <div className="col-span-7">
                  <select
                    value={selectedSearchId}
                    onChange={(e) => setSelectedSearchId(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 truncate"
                  >
                    <option value="ALL">All Past Searches ({leads.length})</option>
                    {searches.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.request_text.slice(0, 26)}... ({s.discovered_leads_count || 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setOnlyVerifiedFilter(false)}
                    className={`flex-1 py-1 rounded text-[10px] font-semibold text-center transition-colors ${
                      !onlyVerifiedFilter
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    All
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnlyVerifiedFilter(true)}
                    className={`flex-1 py-1 rounded text-[10px] font-semibold text-center transition-colors ${
                      onlyVerifiedFilter
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                        : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    Valid
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Scrollable Lead List */}
            <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1">
              {filteredLeads.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No matching leads found.
                </div>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  const hasEmail = Boolean(lead.email && lead.email.includes("@"));

                  return (
                    <div
                      key={lead.id}
                      onClick={() => {
                        if (hasEmail) toggleLeadSelect(lead.id);
                        setPreviewLeadId(lead.id);
                      }}
                      className={`py-1.5 px-2 rounded-lg border transition-colors cursor-pointer flex items-center justify-between gap-2 text-xs ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-500/50"
                          : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
                      } ${!hasEmail ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!hasEmail}
                          onChange={() => {}}
                          className="w-3 h-3 accent-indigo-600 rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate text-[11px] leading-tight">
                            {lead.full_name || lead.company_name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate leading-tight">
                            {lead.job_title} &bull; <span className="text-slate-300">{lead.company_name}</span>
                          </p>
                        </div>
                      </div>

                      {hasEmail ? (
                        <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                          VALID
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800 shrink-0">
                          INVALID
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Selected for dispatch:</span>
            <strong className="text-indigo-300 font-mono font-bold">{selectedLeadIds.length} leads</strong>
          </div>
        </div>

        {/* RIGHT COLUMN: Streamlined Composer (7.5-8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3.5 shadow-sm min-h-[500px] flex flex-col justify-between">
          
          {/* Top Bar: Switch between Edit and Preview */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("COMPOSE")}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                  activeTab === "COMPOSE"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <PenTool className="w-3 h-3" />
                <span>2. Compose</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("PREVIEW")}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                  activeTab === "PREVIEW"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>3. Preview</span>
              </button>
            </div>

            {/* Template Selector & AI Pitch Button */}
            <div className="flex items-center gap-2">
              <select
                value={activePreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                {TEMPLATE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} Template</option>
                ))}
                {activePreset === "custom" && <option value="custom">Custom AI Template</option>}
              </select>

              <button
                type="button"
                onClick={handleGenerateAIDraft}
                disabled={generatingDraft}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-3 h-3 ${generatingDraft ? "animate-spin" : "text-indigo-400"}`} />
                <span>{generatingDraft ? "Drafting..." : "AI Draft"}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: COMPOSE */}
          {activeTab === "COMPOSE" && (
            <div className="space-y-3">
              {/* Subject Line */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Quick question regarding {{company_name}}'s pipeline"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Message Body & Variable Quick Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Email Message Body
                  </label>

                  {/* Clean Variable Inserter */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-slate-500">Insert tag:</span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          insertTag(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      defaultValue=""
                      className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[11px] text-indigo-300 focus:outline-none font-mono"
                    >
                      <option value="" disabled>+ Variable...</option>
                      <option value="{{first_name}}">First Name</option>
                      <option value="{{company_name}}">Company Name</option>
                      <option value="{{job_title}}">Job Title</option>
                      <option value="{{industry}}">Industry</option>
                      <option value="{{location}}">Location</option>
                      <option value="{{email}}">Email</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={10}
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Word Count & Compliance */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="unsub"
                    checked={includeUnsubscribe}
                    onChange={(e) => setIncludeUnsubscribe(e.target.checked)}
                    className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
                  />
                  <label htmlFor="unsub" className="text-[11px] cursor-pointer">
                    Include opt-out footer
                  </label>
                </div>

                <span className="text-[11px] text-slate-500 font-mono">
                  {emailMetrics.wordCount} words &bull; ~{emailMetrics.readingTime}s read &bull; <strong className="text-emerald-400">Safe Deliverability</strong>
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: PREVIEW */}
          {activeTab === "PREVIEW" && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden text-xs">
                <div className="bg-slate-900/80 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Previewing as: <strong className="text-white">{previewLead?.full_name || previewLead?.company_name}</strong>
                  </span>
                  <span className="text-slate-500 font-mono">{previewLead?.email}</span>
                </div>

                <div className="p-3.5 space-y-1.5 border-b border-slate-900">
                  <h4 className="font-bold text-white text-sm">
                    {renderPreview(subject)}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    From: <span className="text-slate-200">Sales Team</span> &lt;outreach@salescrm.ai&gt;
                  </p>
                </div>

                <div className="p-3.5 text-xs text-slate-200 whitespace-pre-line leading-relaxed min-h-[170px]">
                  {renderPreview(bodyTemplate)}
                  {includeUnsubscribe && (
                    <p className="mt-4 pt-2 border-t border-slate-900 text-[10px] text-slate-500">
                      If you prefer not to hear from us, reply with &ldquo;unsubscribe&rdquo;.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px]">Select any lead on the left to preview their personalized copy.</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("COMPOSE")}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                >
                  &larr; Back to Edit
                </button>
              </div>
            </div>
          )}

          {/* Bottom Send Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              Ready to send to <strong className="text-white">{selectedLeadIds.length}</strong> selected leads
            </span>

            <button
              onClick={handleSendBulkOutreach}
              disabled={sending || selectedLeadIds.length === 0}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all cursor-pointer"
            >
              {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{sending ? "Sending..." : `Send Email (${selectedLeadIds.length})`}</span>
            </button>
          </div>

        </div>

      </div>

      {/* 5. Dispatched Campaigns & Outbox History Ledger */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
          <div>
            <h3 className="font-bold text-white flex items-center gap-1.5">
              <Inbox className="w-4 h-4 text-indigo-400" />
              <span>Outbox &amp; Dispatched History</span>
            </h3>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            {campaignHistory.length} campaigns logged
          </span>
        </div>

        {campaignHistory.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No outreach campaigns dispatched yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Campaign</th>
                  <th className="py-2.5 px-3">Subject Line</th>
                  <th className="py-2.5 px-3">Recipients</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Dispatched</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {campaignHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {item.campaign_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                      {item.subject}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-indigo-400">
                      {item.total_sent} leads
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {item.status || "COMPLETED"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500 font-mono text-[11px]">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
