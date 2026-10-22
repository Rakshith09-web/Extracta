"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Settings as SettingsIcon, 
  Building2, 
  User, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  ShieldCheck 
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Feedback states
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [tenantMessage, setTenantMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [profileSaving, setProfileSaving] = useState(false);
  const [tenantSaving, setTenantSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { session }, error: authErr } = await supabase.auth.getSession();
      if (authErr || !session) {
        router.push("/login");
        return;
      }
      setToken(session.access_token);
      await fetchSettingsData(session.access_token);
    }
    loadData();
  }, [router, supabase]);

  const fetchSettingsData = async (accessToken: string) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const meRes = await fetch(`${apiUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (meRes.ok) {
        const data = await meRes.json();
        setProfile(data.profile);
        setFullName(data.profile.full_name || "");
      }

      const tenantRes = await fetch(`${apiUrl}/api/v1/tenants/current`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (tenantRes.ok) {
        const tenantData = await tenantRes.json();
        setTenant(tenantData);
        setOrgName(tenantData.name || "");
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/profiles/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ full_name: fullName }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();
      setProfile(updated);
      setProfileMessage({ text: "Profile information updated successfully!", type: "success" });
    } catch (err: any) {
      setProfileMessage({ text: err.message || "Failed to update profile", type: "error" });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setTenantSaving(true);
    setTenantMessage(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/tenants/current`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: orgName }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update organization");
      }
      const updated = await res.json();
      setTenant((prev: any) => ({ ...prev, name: updated.name }));
      setTenantMessage({ text: "Organization name updated successfully!", type: "success" });
    } catch (err: any) {
      setTenantMessage({ text: err.message || "Failed to update organization", type: "error" });
    } finally {
      setTenantSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMessage({ text: "Password must be at least 6 characters long.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setPasswordSaving(true);
    setPasswordMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage({ text: "Password updated successfully!", type: "success" });
    } catch (err: any) {
      setPasswordMessage({ text: err.message || "Failed to update password", type: "error" });
    } finally {
      setPasswordSaving(false);
    }
  };

  const isAdmin = profile?.role === "ADMIN";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-indigo-400" />
          Settings &amp; Preferences
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your personal profile, organization information, and security credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Profile Settings */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <User className="w-4 h-4" />
              <span>Personal Profile</span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-800 font-semibold">
              Role: {profile?.role}
            </span>
          </div>

          {profileMessage && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
              profileMessage.type === "success" 
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                : "bg-red-950/40 border-red-800 text-red-300"
            }`}>
              {profileMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ""}
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-850 rounded-lg text-sm text-slate-400 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              {profileSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{profileSaving ? "Saving..." : "Save Profile"}</span>
            </button>
          </form>
        </div>

        {/* Tenant Organization Settings */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Building2 className="w-4 h-4" />
              <span>Organization &amp; Workspace</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Members: {tenant?.member_count || 1}
            </span>
          </div>

          {tenantMessage && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
              tenantMessage.type === "success" 
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                : "bg-red-950/40 border-red-800 text-red-300"
            }`}>
              {tenantMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{tenantMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateTenant} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Organization Name {isAdmin ? "" : "(View Only)"}
                </label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className={`w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 ${
                    !isAdmin ? "bg-slate-950/60 border-slate-850 text-slate-400 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tenant ID</label>
                <input
                  type="text"
                  disabled
                  value={tenant?.id || ""}
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-850 rounded-lg text-sm text-slate-400 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            {isAdmin && (
              <button
                type="submit"
                disabled={tenantSaving}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                {tenantSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{tenantSaving ? "Saving..." : "Update Organization"}</span>
              </button>
            )}
          </form>
        </div>

        {/* Security & Password */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <KeyRound className="w-4 h-4" />
              <span>Password &amp; Security</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Supabase Auth Engine
            </span>
          </div>

          {passwordMessage && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
              passwordMessage.type === "success" 
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                : "bg-red-950/40 border-red-800 text-red-300"
            }`}>
              {passwordMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              {passwordSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{passwordSaving ? "Updating..." : "Change Password"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
