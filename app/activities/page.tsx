"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Search, ExternalLink, Sparkles } from "lucide-react";
import type { IkigaiSynthesis } from "@/types/ikigai";

type Activity = {
  title: string;
  description: string;
  type: string;
  where: string;
  action: string;
};

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  workshop:  { color: "#4ecdc4", bg: "rgba(78,205,196,0.12)" },
  meetup:    { color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  community: { color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  online:    { color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  volunteer: { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  creative:  { color: "#f5c842", bg: "rgba(245,200,66,0.12)" },
};

export default function ActivitiesPage() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [dates, setDates] = useState("");
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [synthesis, setSynthesis] = useState<IkigaiSynthesis | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ikigai_synthesis");
      if (raw) setSynthesis(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) return;
    setLoading(true);
    setSubmitted(true);
    setActivities([]);

    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: city.trim(),
          dates: dates.trim() || undefined,
          ikigaiTitle: synthesis?.title,
          sideQuests: synthesis?.sideQuests,
        }),
      });
      const data = await res.json();
      setActivities(data.activities ?? []);
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-y-auto overflow-x-hidden">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 60% 40% at 20% 20%, rgba(168,85,247,0.06) 0%, transparent 65%)",
              "radial-gradient(ellipse 50% 40% at 80% 70%, rgba(6,182,212,0.05) 0%, transparent 65%)",
            ].join(", "),
          }}
        />
      </div>

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="absolute top-5 left-5 z-20 flex items-center gap-1.5 text-white/25 hover:text-white/55 transition-colors touch-manipulation"
        style={{ minHeight: 40, WebkitTapHighlightColor: "transparent" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="text-xs tracking-wider">Back</span>
      </button>

      <div className="relative z-10 w-full max-w-xl mx-auto px-4 sm:px-6 pt-16 pb-24 space-y-6">
        {/* Header */}
        <motion.div
          className="text-center space-y-2 pt-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)" }}
            >
              <MapPin className="w-5 h-5" style={{ color: "#a855f7" }} />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-white/90 leading-tight">Find side quests in your city</h1>
          {synthesis?.title && (
            <p className="text-xs text-white/35 font-light">
              Tailored for <span className="text-white/55">{synthesis.title}</span>
            </p>
          )}
        </motion.div>

        {/* Search form */}
        <motion.form
          onSubmit={handleSearch}
          className="space-y-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <MapPin className="w-4 h-4 text-white/30 shrink-0" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Your city (e.g. London, Berlin, São Paulo)"
              className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/25 outline-none"
              style={{ fontWeight: 300 }}
            />
          </div>
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Search className="w-4 h-4 text-white/30 shrink-0" />
            <input
              type="text"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              placeholder="Dates (optional, e.g. this weekend, July)"
              className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/25 outline-none"
              style={{ fontWeight: 300 }}
            />
          </div>

          <button
            type="submit"
            disabled={!city.trim() || loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium text-white touch-manipulation transition-all"
            style={{
              background: city.trim() ? "rgba(168,85,247,0.22)" : "rgba(255,255,255,0.05)",
              border: city.trim() ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.08)",
              minHeight: 50,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {loading ? (
              <>
                <motion.div
                  className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white/70"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                <span className="text-white/60">Searching...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" style={{ color: "#c084fc" }} />
                Find activities
              </>
            )}
          </button>
        </motion.form>

        {/* Note */}
        {!submitted && (
          <p className="text-center text-[11px] text-white/20 font-light px-4 leading-relaxed">
            AI-generated suggestions based on your Ikigai. For real events, check Eventbrite, Meetup.com, or local Facebook groups.
          </p>
        )}

        {/* Results */}
        <AnimatePresence>
          {submitted && !loading && activities.length === 0 && (
            <motion.p
              className="text-center text-sm text-white/30 font-light py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No suggestions generated. Try a different city or dates.
            </motion.p>
          )}

          {activities.length > 0 && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/20 px-1">
                {activities.length} ideas for {city}
              </p>
              {activities.map((a, i) => {
                const tc = TYPE_COLORS[a.type] ?? { color: "#a855f7", bg: "rgba(168,85,247,0.12)" };
                return (
                  <motion.div
                    key={i}
                    className="rounded-2xl p-4 sm:p-5 space-y-2.5"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-white/85 leading-snug">{a.title}</p>
                      <span
                        className="shrink-0 text-[9px] px-2 py-0.5 rounded-full font-medium tracking-wide capitalize"
                        style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.color}30` }}
                      >
                        {a.type}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 font-light leading-relaxed">{a.description}</p>
                    <div className="pt-1 flex items-start gap-2">
                      <ExternalLink className="w-3 h-3 shrink-0 mt-0.5" style={{ color: tc.color, opacity: 0.7 }} />
                      <p className="text-[11px] font-light leading-relaxed" style={{ color: tc.color, opacity: 0.8 }}>
                        {a.action}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              <p className="text-center text-[10px] text-white/18 font-light pt-2 leading-relaxed">
                These are AI suggestions. Verify details on Eventbrite, Meetup.com, or local sites.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
