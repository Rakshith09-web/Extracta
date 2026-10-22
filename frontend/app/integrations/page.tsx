"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Puzzle, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Play, 
  Database, 
  FileSpreadsheet, 
  Search, 
  Mail, 
  ShieldCheck,
  Settings2,
  Key,
  Globe,
  Save,
  X,
  Zap
} from "lucide-react";

export default function IntegrationsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [key: string]: any }>({});
  
  // Modal state
  const [activeModal, setActiveModal] = useState<any | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiUrlInput, setApiUrlInput] = useState("");
  const [mockToggle, setMockToggle] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadIntegrations() {
      const { data: { session }, error: authErr } = await supabase.auth.getSession();
      if (authErr || !session) {
        router.push("/login");
        return;
      }
      setToken(session.access_token);
      await fetchIntegrations(session.access_token);
    }
    loadIntegrations();
  }, [router, supabase]);

  const fetchIntegrations = async (accessToken: string) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/integrations/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
      }
    } catch (err) {
      console.error("Error loading integrations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestIntegration = async (provider: string) => {
    if (!token) return;
    setTestingProvider(provider);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/integrations/${provider}/test`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [provider]: data }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { status: "ERROR", message: err.message },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const openConfigModal = (item: any) => {
    setActiveModal(item);
    setApiKeyInput("");
    setApiUrlInput(item.configuration?.api_url || "");
    setMockToggle(item.is_mocked ?? true);
    setSaveSuccess(null);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeModal) return;
    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/integrations/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: activeModal.provider,
          api_key: apiKeyInput,
          api_url: apiUrlInput,
          mock_mode: mockToggle,
          status: "ACTIVE",
        }),
      });
      if (!res.ok) throw new Error("Failed to save configuration");
      setSaveSuccess("Configuration saved successfully!");
      await fetchIntegrations(token);
      setTimeout(() => {
        setActiveModal(null);
        setSaveSuccess(null);
      }, 1500);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "TWENTY_CRM":
        return <Database className="w-6 h-6 text-purple-400" />;
      case "GOOGLE_SHEETS":
        return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
      case "APOLLO":
        return <Search className="w-6 h-6 text-blue-400" />;
      case "APIFY":
        return <Globe className="w-6 h-6 text-amber-400" />;
      case "EMAIL_VALIDATION":
        return <Mail className="w-6 h-6 text-pink-400" />;
      case "N8N":
        return <Zap className="w-6 h-6 text-amber-400" />;
      default:
        return <Puzzle className="w-6 h-6 text-indigo-400" />;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800">
              Normalized Provider Architecture
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Live &amp; Mock Switches
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Puzzle className="w-7 h-7 text-indigo-400" />
            Integrations &amp; Providers
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure Apollo.io, Apify Web Scraping, Email Deliverability, Google Sheets review layer, and Twenty CRM sync.
          </p>
        </div>
      </div>

      {/* Mock Mode Banner */}
      <div className="rounded-xl border border-indigo-800/60 bg-indigo-950/30 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-white">Unified Adapter Layer Active</p>
          <p className="text-slate-300 leading-relaxed">
            All integrations use standard normalized contracts. You can switch between built-in high-fidelity simulated engines or enter your live production API keys at any time!
          </p>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((item) => {
          const testResult = testResults[item.provider];
          const isTesting = testingProvider === item.provider;

          return (
            <div
              key={item.provider}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {getProviderIcon(item.provider)}
                    <div>
                      <h3 className="font-bold text-white text-sm">{item.name}</h3>
                      <span className="text-[10px] text-slate-500 font-mono">{item.type}</span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                    item.is_mocked
                      ? "bg-indigo-950 text-indigo-400 border-indigo-800"
                      : "bg-emerald-950 text-emerald-400 border-emerald-800"
                  }`}>
                    {item.is_mocked ? "MOCK ENGINE" : "LIVE API"}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.provider === "APOLLO" && "Fetches company intelligence, headcount, decision maker profiles, and verified emails."}
                  {item.provider === "APIFY" && "Crawls public directories and social sources for local business leads."}
                  {item.provider === "EMAIL_VALIDATION" && "Performs syntax, MX record, and SMTP mailbox deliverability validation."}
                  {item.provider === "GOOGLE_SHEETS" && "Exports qualified leads into a collaborative Google Sheet for sales manager review."}
                  {item.provider === "TWENTY_CRM" && "Bi-directional lead sync to Twenty CRM with deduplication and update tracking."}
                  {item.provider === "N8N" && "Orchestrates multi-step async pipelines for lead enrichment, CRM sync, and scheduled triggers."}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                {testResult && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
                    <div className="flex items-center justify-between text-emerald-400 font-semibold">
                      <span>Status: {testResult.status}</span>
                      {testResult.latency_ms && <span>{testResult.latency_ms}ms</span>}
                    </div>
                    <p className="text-slate-300 text-[10px]">{testResult.message}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openConfigModal(item)}
                    className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Configure</span>
                  </button>

                  <button
                    onClick={() => handleTestIntegration(item.provider)}
                    disabled={isTesting}
                    className="py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Test</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configure Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                {getProviderIcon(activeModal.provider)}
                <span>Configure {activeModal.name}</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* Mock mode toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <p className="font-semibold text-white">Use Simulated Mock Engine</p>
                  <p className="text-slate-400 text-[11px]">Enables zero-cost realistic data simulation</p>
                </div>
                <input
                  type="checkbox"
                  checked={mockToggle}
                  onChange={(e) => setMockToggle(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
              </div>

              {!mockToggle && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      API Key / Secret Token
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="Enter live API secret key..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {activeModal.provider === "TWENTY_CRM" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Instance Base URL
                      </label>
                      <input
                        type="text"
                        value={apiUrlInput}
                        onChange={(e) => setApiUrlInput(e.target.value)}
                        placeholder="http://localhost:3000"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
