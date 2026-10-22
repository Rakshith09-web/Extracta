"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  LogOut, 
  LayoutDashboard, 
  Sparkles, 
  Users, 
  History, 
  Puzzle, 
  Settings, 
  Activity,
  Mail,
  Menu,
  X
} from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.access_token) {
        fetchRole(session.access_token);
      } else {
        setLoading(false);
      }
    }
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.access_token) {
        fetchRole(session.access_token);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const fetchRole = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRole(data.profile?.role || "SALES_REPRESENTATIVE");
      }
    } catch (err) {
      console.warn("Could not fetch user role:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    router.push("/login");
    router.refresh();
  };

  const navItemClass = (path: string) =>
    `text-xs font-medium transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
      pathname === path
        ? "text-white bg-slate-900 border border-slate-800"
        : "text-slate-300 hover:text-white hover:bg-slate-900/50"
    }`;

  const isManagerOrAdmin = role === "ADMIN" || role === "SALES_MANAGER";

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
              AI
            </div>
            <Link href="/" className="font-bold text-base tracking-tight text-white flex items-center gap-2">
              <span>Sales CRM</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link href="/" className={navItemClass("/")}>
              Overview
            </Link>

            {user && (
              <>
                <Link href="/dashboard" className={navItemClass("/dashboard")}>
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>

                <Link href="/assistant" className={navItemClass("/assistant")}>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Assistant</span>
                </Link>

                <Link href="/leads" className={navItemClass("/leads")}>
                  <Users className="w-3.5 h-3.5" />
                  <span>Leads</span>
                </Link>

                <Link href="/searches" className={navItemClass("/searches")}>
                  <History className="w-3.5 h-3.5" />
                  <span>Searches</span>
                </Link>

                <Link href="/outreach" className={navItemClass("/outreach")}>
                  <Mail className="w-3.5 h-3.5 text-pink-400" />
                  <span>Outreach</span>
                </Link>

                <Link href="/integrations" className={navItemClass("/integrations")}>
                  <Puzzle className="w-3.5 h-3.5" />
                  <span>Integrations</span>
                </Link>

                {isManagerOrAdmin && (
                  <Link href="/users" className={navItemClass("/users")}>
                    <Users className="w-3.5 h-3.5" />
                    <span>Team</span>
                  </Link>
                )}

                {isManagerOrAdmin && (
                  <Link href="/audit-logs" className={navItemClass("/audit-logs")}>
                    <Activity className="w-3.5 h-3.5" />
                    <span>Audit Logs</span>
                  </Link>
                )}

                <Link href="/settings" className={navItemClass("/settings")}>
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </Link>
              </>
            )}
          </div>

          {/* Right User Status & Sign Out */}
          <div className="hidden lg:flex items-center space-x-3 pl-2 border-l border-slate-800">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    {role && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {role}
                      </span>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 border border-slate-700"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm shadow-indigo-600/30"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-2">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className={navItemClass("/")}>
            Overview
          </Link>
          {user && (
            <>
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className={navItemClass("/dashboard")}>
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link href="/assistant" onClick={() => setMobileMenuOpen(false)} className={navItemClass("/assistant")}>
                <Sparkles className="w-4 h-4 text-indigo-400" /> AI Assistant
              </Link>
              <Link href="/leads" onClick={() => setMobileMenuOpen(false)} className={navItemClass("/leads")}>
                <Users className="w-4 h-4" /> Leads
              </Link>
              <Link href="/searches" onClick={() => setMobileMenuOpen(false)} className={navItemClass("/searches")}>
                <History className="w-4 h-4" /> Searches
              </Link>
              <Link href="/outreach" onClick={() => setMobileMenuOpen(false)} className={navItemClass("/outreach")}>
                <Mail className="w-4 h-4 text-pink-400" /> Bulk Outreach
              </Link>
              <Link href="/integrations" onClick={() => setMobileMenuOpen(false)} className={navItemClass("/integrations")}>
                <Puzzle className="w-4 h-4" /> Integrations
              </Link>
              {isManagerOrAdmin && (
                <Link href="/users" onClick={() => setMobileMenuOpen(false)} className={navItemClass("/users")}>
                  <Users className="w-4 h-4" /> Team Users
                </Link>
              )}
              {isManagerOrAdmin && (
                <Link href="/audit-logs" onClick={() => setMobileMenuOpen(false)} className={navItemClass("/audit-logs")}>
                  <Activity className="w-4 h-4" /> Audit Logs
                </Link>
              )}
              <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className={navItemClass("/settings")}>
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-mono">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-200 border border-slate-700"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
