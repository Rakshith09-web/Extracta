"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Mail, 
  KeyRound,
  X
} from "lucide-react";

export default function UsersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [members, setMembers] = useState<any[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("SALES_REPRESENTATIVE");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { session }, error: authErr } = await supabase.auth.getSession();
      if (authErr || !session) {
        router.push("/login");
        return;
      }
      setToken(session.access_token);
      await fetchInitialData(session.access_token);
    }
    loadData();
  }, [router, supabase]);

  const fetchInitialData = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // 1. Get current profile
      const meRes = await fetch(`${apiUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!meRes.ok) throw new Error("Could not verify user role");
      const meData = await meRes.json();
      setCurrentUserProfile(meData.profile);

      // 2. Fetch team members
      const usersRes = await fetch(`${apiUrl}/api/v1/users/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!usersRes.ok) {
        if (usersRes.status === 403) {
          throw new Error("Access Restricted: Team management is reserved for Administrators and Sales Managers.");
        }
        throw new Error("Failed to load organization members");
      }
      const usersData = await usersRes.json();
      setMembers(usersData);
    } catch (err: any) {
      setError(err.message || "Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!token) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update user role");
      }
      const updated = await res.json();
      setMembers((prev) => prev.map((m) => (m.id === userId ? updated : m)));
      setActionSuccess(`Role updated to ${newRole} successfully.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Error updating role: ${err.message}`);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    if (!token) return;
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update user status");
      }
      const updated = await res.json();
      setMembers((prev) => prev.map((m) => (m.id === userId ? updated : m)));
      setActionSuccess(`User status changed to ${newStatus}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setInviteLoading(true);
    setInviteError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/users/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: inviteName,
          email: inviteEmail,
          role: inviteRole,
          password: invitePassword || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to invite member");
      }

      const newMember = await res.json();
      setMembers((prev) => [...prev, newMember]);
      setShowInviteModal(false);
      setInviteName("");
      setInviteEmail("");
      setInvitePassword("");
      setActionSuccess(`Team member ${inviteEmail} provisioned successfully!`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setInviteError(err.message || "Failed to invite member");
    } finally {
      setInviteLoading(false);
    }
  };

  const isAdmin = currentUserProfile?.role === "ADMIN";

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
              Role-Based Access Control
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total Members: {members.length}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-400" />
            Team User Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage organization members, assign roles (Admin, Sales Manager, Representative), and control account status.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            Invite / Add Member
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error ? (
        <div className="p-4 bg-amber-950/40 border border-amber-900/60 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">RBAC Access Notice</p>
            <p className="mt-1 text-amber-300/80">{error}</p>
          </div>
        </div>
      ) : (
        /* Team Members Table */
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Joined</th>
                  {isAdmin && <th className="px-6 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {members.map((member) => {
                  const isSelf = member.id === currentUserProfile?.id;
                  return (
                    <tr key={member.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 text-xs">
                          {member.full_name ? member.full_name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">
                            {member.full_name || "Unnamed User"}
                            {isSelf && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-[150px]">{member.id}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-300 font-mono">{member.email}</td>

                      <td className="px-6 py-4">
                        {isAdmin && !isSelf ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="SALES_MANAGER">SALES_MANAGER</option>
                            <option value="SALES_REPRESENTATIVE">SALES_REPRESENTATIVE</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              member.role === "ADMIN"
                                ? "bg-purple-950 text-purple-400 border-purple-800"
                                : member.role === "SALES_MANAGER"
                                ? "bg-blue-950 text-blue-400 border-blue-800"
                                : "bg-slate-800 text-slate-300 border-slate-700"
                            }`}
                          >
                            {member.role}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                            member.status === "ACTIVE"
                              ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                              : "bg-red-950 text-red-400 border-red-800"
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-400 font-mono">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>

                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          {!isSelf && (
                            <button
                              onClick={() => handleStatusToggle(member.id, member.status)}
                              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                                member.status === "ACTIVE"
                                  ? "bg-red-950/40 hover:bg-red-900/60 text-red-300 border-red-800"
                                  : "bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800"
                              }`}
                            >
                              {member.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Invite Team Member</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteError && (
              <div className="p-3 bg-red-950/40 border border-red-900 text-red-300 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Taylor Smith"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="taylor@company.com"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assign Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="SALES_REPRESENTATIVE">SALES_REPRESENTATIVE (Lead Execution)</option>
                  <option value="SALES_MANAGER">SALES_MANAGER (Searches &amp; Lead Assignment)</option>
                  <option value="ADMIN">ADMIN (Full Organization Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Initial Password <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="password"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Auto-generate secure temporary password"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {inviteLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{inviteLoading ? "Adding..." : "Provision Member"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
