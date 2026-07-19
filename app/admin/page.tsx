"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Users, BarChart2, Zap, Globe, ChevronDown, ChevronRight,
  X, Calendar, MessageSquare, TrendingUp, ArrowLeft,
} from "lucide-react";

type SessionSummary = {
  id: string;
  title: string;
  subtitle: string | null;
  created_at: string;
  score: number | null;
  scoreReasoning: string | null;
  language: "en" | "es";
  depth: number;
  messageCount: number | null;
  highlights: string[];
  careerPaths: { title: string; tagline: string }[];
  sideQuests: string[];
  patterns: string[];
  strengths: string[];
  explanation: string | null;
  ikigaiTitle: string;
};

type AdminUser = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_sign_in: string | null;
  sessions: SessionSummary[];
  session_count: number;
  latest_title: string | null;
  latest_score: number | null;
  latest_language: "en" | "es";
};

type AdminData = {
  users: AdminUser[];
  total_users: number;
  total_sessions: number;
  sessions_with_data: number;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
function initials(email: string, name: string | null) {
  if (name) return name.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}
function scoreColor(score: number | null) {
  if (score === null) return "#ffffff30";
  if (score >= 70) return "#10b981";
  if (score >= 45) return "#f59e0b";
  return "#f43f5e";
}

// ── Mini SVG score ring ──────────────────────────────────────────────────────
function ScoreRing({ score, size = 32 }: { score: number | null; size?: number }) {
  const r = (size / 2) - 3;
  const circ = 2 * Math.PI * r;
  const pct = score != null ? score / 100 : 0;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2.5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={2.5}
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      {score !== null && (
        <text x={size / 2} y={size / 2 + 3.5} textAnchor="middle" fill={color}
          fontSize={size < 36 ? 7.5 : 9} fontWeight={600} fontFamily="inherit">
          {score}
        </text>
      )}
    </svg>
  );
}

// ── Weekly user growth chart ─────────────────────────────────────────────────
function GrowthChart({ users }: { users: AdminUser[] }) {
  const weeks: Record<string, number> = {};
  users.forEach((u) => {
    const d = new Date(u.created_at);
    // start of week (Monday)
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const key = monday.toISOString().slice(0, 10);
    weeks[key] = (weeks[key] ?? 0) + 1;
  });

  const sortedKeys = Object.keys(weeks).sort();
  const maxVal = Math.max(...Object.values(weeks), 1);
  const W = 560; const H = 80; const BAR_W = Math.max(6, Math.floor(W / (sortedKeys.length + 1)) - 2);
  const GAP = Math.floor(W / (sortedKeys.length + 1));

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 20}`} width="100%" style={{ minWidth: 240 }}>
        {sortedKeys.map((key, i) => {
          const count = weeks[key];
          const barH = Math.max(4, (count / maxVal) * H);
          const x = (i + 1) * GAP - BAR_W / 2;
          const y = H - barH;
          const label = new Date(key).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
          return (
            <g key={key}>
              <rect x={x} y={y} width={BAR_W} height={barH} rx={2}
                fill="rgba(168,85,247,0.55)" />
              {sortedKeys.length <= 12 && (
                <text x={x + BAR_W / 2} y={H + 14} textAnchor="middle"
                  fontSize={8} fill="rgba(255,255,255,0.2)" fontFamily="inherit">
                  {label}
                </text>
              )}
              <text x={x + BAR_W / 2} y={y - 3} textAnchor="middle"
                fontSize={8} fill="rgba(255,255,255,0.45)" fontFamily="inherit">
                {count}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── User detail drawer ───────────────────────────────────────────────────────
function UserDetail({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [openSession, setOpenSession] = useState<string | null>(
    user.sessions[0]?.id ?? null
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <motion.div
        className="relative z-10 w-full max-w-xl h-full overflow-y-auto flex flex-col"
        style={{ background: "#0d0d14", borderLeft: "1px solid rgba(255,255,255,0.07)" }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-5 flex items-center gap-4"
          style={{ background: "#0d0d14", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0"
            style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc" }}
          >
            {initials(user.email, user.display_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/85 truncate">
              {user.display_name ?? user.email}
            </p>
            <p className="text-[11px] text-white/35 truncate">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-white/30 hover:text-white/60 transition-colors"
            style={{ WebkitTapHighlightColor: "transparent" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Meta row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Signed up", value: fmtDate(user.created_at) },
              { label: "Last active", value: user.last_sign_in ? fmtRelative(user.last_sign_in) : "—" },
              { label: "Sessions", value: String(user.session_count) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] text-white/30 tracking-widest uppercase mb-1">{label}</p>
                <p className="text-sm font-medium text-white/75">{value}</p>
              </div>
            ))}
          </div>

          {/* Sessions */}
          {user.sessions.length === 0 ? (
            <p className="text-sm text-white/25 text-center py-8">No sessions saved yet</p>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/20">Sessions</p>
              {user.sessions.map((s) => {
                const isOpen = openSession === s.id;
                return (
                  <div key={s.id} className="rounded-2xl overflow-hidden transition-all"
                    style={{
                      background: isOpen ? "rgba(168,85,247,0.04)" : "rgba(255,255,255,0.02)",
                      border: isOpen ? "1px solid rgba(168,85,247,0.2)" : "1px solid rgba(255,255,255,0.06)",
                    }}>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left touch-manipulation"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                      onClick={() => setOpenSession(isOpen ? null : s.id)}
                    >
                      <ScoreRing score={s.score} size={34} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">{s.title}</p>
                        <p className="text-[11px] text-white/35 truncate">{s.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: s.language === "es" ? "rgba(250,204,21,0.1)" : "rgba(59,130,246,0.1)", color: s.language === "es" ? "#fbbf24" : "#60a5fa" }}>
                          {s.language === "es" ? "🇪🇸 ES" : "🇬🇧 EN"}
                        </span>
                        <span className="text-[10px] text-white/25">{fmtRelative(s.created_at)}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-white/20" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-5 pt-1 space-y-4"
                            style={{ borderTop: "1px solid rgba(168,85,247,0.08)" }}>

                            {/* Score detail */}
                            {s.score !== null && (
                              <div className="flex items-center gap-3 p-3 rounded-xl"
                                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <ScoreRing score={s.score} size={44} />
                                <div>
                                  <p className="text-xs font-medium" style={{ color: scoreColor(s.score) }}>
                                    Ikigai score: {s.score}%
                                  </p>
                                  {s.scoreReasoning && (
                                    <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{s.scoreReasoning}</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Session meta */}
                            <div className="flex gap-4 text-[11px] text-white/30">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {fmtDate(s.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <BarChart2 className="w-3 h-3" />
                                Depth: {s.depth}
                              </span>
                              {s.language === "es" && (
                                <span className="flex items-center gap-1">🇪🇸 Spanish session</span>
                              )}
                            </div>

                            {/* Highlights */}
                            {s.highlights.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {s.highlights.map((h, i) => (
                                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
                                    style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }}>
                                    {h}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Patterns */}
                            {s.patterns.length > 0 && (
                              <div>
                                <p className="text-[9px] tracking-widest uppercase text-white/20 mb-2">Patterns</p>
                                <div className="space-y-1">
                                  {s.patterns.map((p, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: "#a855f7" }} />
                                      <span className="text-xs text-white/50 font-light">{p}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Strengths */}
                            {s.strengths.length > 0 && (
                              <div>
                                <p className="text-[9px] tracking-widest uppercase text-white/20 mb-2">Strengths</p>
                                <div className="space-y-1">
                                  {s.strengths.map((p, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: "#10b981" }} />
                                      <span className="text-xs text-white/50 font-light">{p}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Career paths */}
                            {s.careerPaths.length > 0 && (
                              <div>
                                <p className="text-[9px] tracking-widest uppercase text-white/20 mb-2">Career paths</p>
                                <div className="space-y-1.5">
                                  {s.careerPaths.map((cp, i) => (
                                    <div key={i} className="px-3 py-2 rounded-lg"
                                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                      <p className="text-xs font-medium text-white/65">{cp.title}</p>
                                      <p className="text-[11px] text-white/30 font-light mt-0.5">{cp.tagline}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Side quests */}
                            {s.sideQuests.length > 0 && (
                              <div>
                                <p className="text-[9px] tracking-widets uppercase text-white/20 mb-2">Side quests</p>
                                <div className="space-y-1">
                                  {s.sideQuests.map((sq, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <span className="mt-1.5 text-[9px]" style={{ color: "#a855f7" }}>→</span>
                                      <span className="text-xs text-white/45 font-light">{sq}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Full explanation */}
                            {s.explanation && (
                              <details className="group">
                                <summary className="text-[10px] tracking-widets uppercase text-white/20 cursor-pointer select-none list-none flex items-center gap-1.5">
                                  <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                                  Full analysis
                                </summary>
                                <div className="mt-3 space-y-2">
                                  {s.explanation.split(/\n\n+/).filter(Boolean).map((para, i) => (
                                    <p key={i} className="text-xs text-white/40 font-light leading-relaxed">{para}</p>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main dashboard ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"sessions" | "joined" | "score">("sessions");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/data");
      if (res.status === 403) { router.replace("/"); return; }
      if (!res.ok) throw new Error("Failed to load");
      setData(await res.json());
    } catch {
      setError("Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const filtered = (data?.users ?? []).filter((u) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      (u.display_name ?? "").toLowerCase().includes(q) ||
      (u.latest_title ?? "").toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    if (sortBy === "sessions") return b.session_count - a.session_count;
    if (sortBy === "joined") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "score") return (b.latest_score ?? -1) - (a.latest_score ?? -1);
    return 0;
  });

  const spanishSessions = (data?.users ?? []).flatMap((u) => u.sessions).filter((s) => s.language === "es").length;
  const avgSessions = data && data.total_users > 0
    ? (data.total_sessions / data.total_users).toFixed(1)
    : "0";
  const avgScore = (() => {
    const scores = (data?.users ?? []).flatMap((u) => u.sessions).map((s) => s.score).filter((s): s is number => s !== null);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  })();

  return (
    <main className="relative min-h-dvh overflow-y-auto overflow-x-hidden"
      style={{ background: "#080810" }}>
      {/* Bg glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 50% 30% at 20% 10%, rgba(168,85,247,0.05) 0%, transparent 65%)",
        }} />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-20 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="p-2 text-white/25 hover:text-white/50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white/85 tracking-tight">Admin</h1>
              <p className="text-[11px] text-white/25 tracking-widest uppercase">ikigai.ai</p>
            </div>
          </div>
          <button
            onClick={load}
            className="text-[11px] text-white/25 hover:text-white/50 transition-colors px-3 py-1.5 rounded-lg"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <motion.div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-white/50"
              animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400/70 text-center py-12">{error}</div>
        )}

        {data && !loading && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total users", value: data.total_users, Icon: Users, color: "#a855f7" },
                { label: "Total sessions", value: data.total_sessions, Icon: MessageSquare, color: "#06b6d4" },
                { label: "Avg sessions/user", value: avgSessions, Icon: BarChart2, color: "#f59e0b" },
                { label: "Avg Ikigai score", value: avgScore != null ? `${avgScore}%` : "—", Icon: Zap, color: "#10b981" },
              ].map(({ label, value, Icon, color }) => (
                <motion.div key={label}
                  className="rounded-2xl p-4 space-y-2"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] tracking-[0.3em] uppercase text-white/25">{label}</p>
                    <Icon className="w-3.5 h-3.5" style={{ color, opacity: 0.7 }} />
                  </div>
                  <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
                </motion.div>
              ))}
            </div>

            {/* Language split */}
            {data.total_sessions > 0 && (
              <div className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Globe className="w-4 h-4 text-white/25 shrink-0" />
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{
                      width: `${((data.total_sessions - spanishSessions) / data.total_sessions) * 100}%`,
                      background: "linear-gradient(to right, #3b82f6, #06b6d4)",
                    }} />
                  </div>
                  <span className="text-xs text-white/35 shrink-0">
                    🇬🇧 {data.total_sessions - spanishSessions} EN · 🇪🇸 {spanishSessions} ES
                  </span>
                </div>
              </div>
            )}

            {/* Growth chart */}
            {data.users.length > 0 && (
              <motion.div className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-3.5 h-3.5 text-white/25" />
                  <p className="text-[9px] tracking-[0.3em] uppercase text-white/25">User signups by week</p>
                </div>
                <GrowthChart users={data.users} />
              </motion.div>
            )}

            {/* Users table */}
            <div className="space-y-3">
              {/* Controls */}
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="flex-1 min-w-40 bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2 text-sm text-white/70 placeholder-white/20 outline-none"
                  style={{ borderColor: "rgba(255,255,255,0.07)" }}
                />
                <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {(["sessions", "joined", "score"] as const).map((s) => (
                    <button key={s} onClick={() => setSortBy(s)}
                      className="px-3 py-1.5 rounded-lg text-[11px] transition-all capitalize"
                      style={{
                        background: sortBy === s ? "rgba(168,85,247,0.2)" : "transparent",
                        color: sortBy === s ? "#c084fc" : "rgba(255,255,255,0.3)",
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {filtered.length === 0 && (
                  <p className="text-sm text-white/25 text-center py-8">No users found</p>
                )}
                {filtered.map((user, i) => (
                  <motion.button
                    key={user.id}
                    className="w-full text-left rounded-2xl p-4 transition-all group"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ borderColor: "rgba(168,85,247,0.25)", background: "rgba(168,85,247,0.03)" }}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0"
                        style={{ background: "rgba(168,85,247,0.12)", color: "#c084fc" }}>
                        {user.avatar_url
                          ? <img src={user.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                          : initials(user.email, user.display_name)}
                      </div>

                      {/* Email + title */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm text-white/75 font-medium truncate">
                            {user.display_name ?? user.email}
                          </p>
                          {user.display_name && (
                            <p className="text-[11px] text-white/25 truncate hidden sm:block">{user.email}</p>
                          )}
                        </div>
                        {user.latest_title ? (
                          <p className="text-[11px] text-white/35 font-light truncate mt-0.5">{user.latest_title}</p>
                        ) : (
                          <p className="text-[11px] text-white/18 italic">No sessions yet</p>
                        )}
                      </div>

                      {/* Right side */}
                      <div className="flex items-center gap-3 shrink-0">
                        <ScoreRing score={user.latest_score} size={30} />
                        <div className="hidden sm:flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-white/30">{user.session_count} session{user.session_count !== 1 ? "s" : ""}</span>
                            <span className="text-[10px]">{user.latest_language === "es" ? "🇪🇸" : "🇬🇧"}</span>
                          </div>
                          <span className="text-[10px] text-white/20">{fmtRelative(user.created_at)}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/35 transition-colors" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User detail drawer */}
      <AnimatePresence>
        {selectedUser && (
          <UserDetail user={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </AnimatePresence>
    </main>
  );
}
