"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, LogOut, Trash2, ChevronRight, Clock, Sparkles, LayoutDashboard } from "lucide-react";
import type { IkigaiSynthesis } from "@/types/ikigai";

interface SavedSession {
  id: string;
  title: string;
  subtitle: string | null;
  created_at: string;
}

interface UserInfo {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface Props {
  user: UserInfo;
  sessions: SavedSession[];
}

export default function ProfileClient({ user, sessions: initialSessions }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [sessions, setSessions] = useState(initialSessions);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // If user just signed in mid-session (fresh synthesis + active conversation in sessionStorage), send to /reveal
  useEffect(() => {
    try {
      const hasSynthesis = !!localStorage.getItem("ikigai_synthesis_result");
      const hasSession = !!sessionStorage.getItem("ikigai_session");
      if (hasSynthesis && hasSession) {
        router.replace("/reveal");
        return;
      }
    } catch { /* ignore */ }

    // Legacy: save pending session from localStorage (set before OAuth redirect)
    const pending = localStorage.getItem("ikigai_pending_save");
    if (!pending) return;

    try {
      const synthesis: IkigaiSynthesis = JSON.parse(pending);
      localStorage.removeItem("ikigai_pending_save");

      fetch("/api/profile/save-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ synthesis }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.session) {
            setSessions((prev) => [
              {
                id: data.session.id,
                title: data.session.title,
                subtitle: data.session.subtitle,
                created_at: data.session.created_at,
              },
              ...prev,
            ]);
          }
        });
    } catch {
      localStorage.removeItem("ikigai_pending_save");
    }
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    const res = await fetch("/api/profile/delete-account", { method: "DELETE" });
    if (res.ok) {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } else {
      setDeletingAccount(false);
      setShowDeleteAccount(false);
      alert("Failed to delete account. Please try again.");
    }
  }

  async function handleDeleteSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("ikigai_sessions").delete().eq("id", id);
  }

  function openSession(session: SavedSession) {
    fetch(`/api/profile/session/${session.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.synthesis) {
          router.push(`/reveal?data=${encodeURIComponent(JSON.stringify(data.synthesis))}`);
        }
      });
  }

  const initials = (user.displayName ?? user.email)
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return (
    <main className="relative min-h-dvh overflow-y-auto px-5 pt-14 pb-20">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(249,115,22,0.05) 0%, transparent 70%)",
        }}
      />

      <button
        onClick={() => router.push("/")}
        className="fixed top-5 left-5 z-20 flex items-center gap-1.5 text-white/25 hover:text-white/55 transition-colors"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="text-xs tracking-wider">Home</span>
      </button>

      <div className="relative z-10 mx-auto max-w-xl space-y-8 pt-4">

        {/* Profile header */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-medium text-lg shrink-0 overflow-hidden"
            style={{
              background: user.avatarUrl
                ? "transparent"
                : "linear-gradient(135deg, rgba(249,115,22,0.6), rgba(20,184,166,0.6))",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.displayName ?? ""} className="w-full h-full object-cover" />
            ) : (
              <span>{initials || "?"}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-light text-lg leading-snug truncate">
              {user.displayName ?? "My Profile"}
            </p>
            <p className="text-white/35 text-sm truncate">{user.email}</p>
          </div>
        </motion.div>

        {/* Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-white/25" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/25">Saved Ikigai</p>
          </div>

          {sessions.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-sm text-white/30 font-light mb-4">
                No saved sessions yet. Complete a conversation and save your results.
              </p>
              <button
                onClick={() => router.push("/conversation")}
                className="px-6 py-3 rounded-full text-sm text-white/60 font-light tracking-wide transition-all"
                style={{
                  border: "1px solid rgba(249,115,22,0.25)",
                  background: "rgba(249,115,22,0.08)",
                }}
              >
                Start a conversation
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  className="group relative rounded-2xl p-4 transition-all cursor-pointer"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => openSession(session)}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(249,115,22,0.25)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-white/85 font-light text-sm leading-snug mb-1 truncate">
                        {session.title}
                      </p>
                      {session.subtitle && (
                        <p className="text-white/35 text-xs font-light leading-relaxed line-clamp-1">
                          {session.subtitle}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className="w-2.5 h-2.5 text-white/20" />
                        <p className="text-[10px] text-white/25">
                          {new Date(session.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                        className="p-2 rounded-lg text-white/15 hover:text-red-400/60 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Account actions */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-4">Account</p>

          {user.email === "arturocanobusi@gmail.com" && (
            <button
              onClick={() => router.push("/admin")}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-light transition-all mb-1"
              style={{
                background: "linear-gradient(135deg, rgba(212,160,23,0.12), rgba(205,127,50,0.08))",
                border: "1px solid rgba(212,160,23,0.3)",
                color: "rgba(212,160,23,0.85)",
                minHeight: 48,
              }}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Dashboard</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
            </button>
          )}

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm text-white/55 font-light transition-all disabled:opacity-40"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              minHeight: 48,
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>{signingOut ? "Signing out..." : "Sign out"}</span>
          </button>

          <button
            onClick={() => setShowDeleteAccount(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm text-red-400/40 font-light transition-all hover:text-red-400/70"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.05)",
              minHeight: 48,
            }}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete account & data</span>
          </button>
        </motion.div>

        <p className="text-center text-[10px] text-white/15">
          <a href="/privacy" className="hover:text-white/35 transition-colors underline underline-offset-2">
            Privacy Policy
          </a>
          {" · "}
          Your data is stored securely and never shared.
        </p>
      </div>

      {/* Delete account confirmation */}
      <AnimatePresence>
        {showDeleteAccount && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "rgba(5,5,8,0.85)", backdropFilter: "blur(12px)" }}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl p-6 space-y-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: "rgba(15,15,20,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <h2 className="text-white font-light text-lg">Delete account?</h2>
              <p className="text-sm text-white/45 font-light leading-relaxed">
                This permanently deletes your account and all saved Ikigai sessions. This action cannot be undone.
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowDeleteAccount(false)}
                  className="flex-1 py-3 rounded-xl text-sm text-white/55 font-light transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="flex-1 py-3 rounded-xl text-sm text-red-400 font-light transition-all disabled:opacity-50"
                  style={{ border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.08)" }}
                >
                  {deletingAccount ? "Deleting..." : "Delete everything"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
