"use client";

import React, { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { AiOrb } from "@/components/orb/AiOrb";
import type { IkigaiSynthesis } from "@/types/ikigai";
import {
  ChevronDown,
  ChevronRight,
  Share2,
  RotateCcw,
  MessageCircle,
  ArrowLeft,
  Heart,
  Zap,
  Globe,
  DollarSign,
  TrendingUp,
  Compass,
  Flame,
} from "lucide-react";
import { useResponsiveSize } from "@/lib/useResponsiveSize";

const DIMENSION_CONFIG = [
  { label: "What You Love", Icon: Heart, color: "#f43f5e", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.22)" },
  { label: "What You're Good At", Icon: Zap, color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.22)" },
  { label: "What The World Needs", Icon: Globe, color: "#06b6d4", bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.22)" },
  { label: "What You Can Be Paid For", Icon: DollarSign, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.22)" },
];

const INSIGHT_CARDS = [
  { key: "patterns" as const, title: "Patterns We Observed", Icon: TrendingUp, color: "#f97316", rgba: { bg: "rgba(249,115,22,0.06)", border: "rgba(249,115,22,0.2)", glow: "rgba(249,115,22,0.08)" } },
  { key: "strengths" as const, title: "Natural Strengths", Icon: Zap, color: "#10b981", rgba: { bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.2)", glow: "rgba(16,185,129,0.08)" } },
  { key: "idealEnvironments" as const, title: "Where You Thrive", Icon: Compass, color: "#06b6d4", rgba: { bg: "rgba(6,182,212,0.06)", border: "rgba(6,182,212,0.2)", glow: "rgba(6,182,212,0.08)" } },
  { key: "motivations" as const, title: "Core Motivations", Icon: Flame, color: "#f59e0b", rgba: { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", glow: "rgba(245,158,11,0.08)" } },
];

const HIGHLIGHT_COLORS = [
  { bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.28)", color: "rgba(253,186,116,0.95)" },
  { bg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.28)", color: "rgba(94,234,212,0.95)" },
  { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.28)", color: "rgba(216,180,254,0.95)" },
  { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.28)", color: "rgba(253,230,138,0.95)" },
];

function RevealContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [synthesis, setSynthesis] = useState<IkigaiSynthesis | null>(null);
  const [phase, setPhase] = useState<"cinematic" | "title" | "expanded">("cinematic");
  const [openDeepDive, setOpenDeepDive] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const cinematicOrbSize = useResponsiveSize(120, 160);
  const titleOrbSize = useResponsiveSize(90, 120);

  useEffect(() => {
    const raw = searchParams.get("data");
    if (!raw) { router.replace("/"); return; }
    try {
      setSynthesis(JSON.parse(raw));
    } catch {
      router.replace("/");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!synthesis) return;
    const t = setTimeout(() => setPhase("title"), 2800);
    return () => clearTimeout(t);
  }, [synthesis]);

  if (!synthesis) return null;

  async function handleShare() {
    const highlights = synthesis!.highlights?.join(" · ") || "";
    const text = [
      `✨ My Ikigai: "${synthesis!.title}"`,
      ``,
      synthesis!.subtitle,
      highlights ? `\n${highlights}` : "",
      `\nDiscover yours → ikigai.ai`,
    ].filter(Boolean).join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: `My Ikigai: ${synthesis!.title}`, text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // user dismissed share sheet
    }
  }

  function handleAddContext() {
    try {
      const saved = sessionStorage.getItem("ikigai_session");
      if (saved) sessionStorage.setItem("ikigai_resume_session", saved);
    } catch { /* ignore */ }
    router.push("/conversation");
  }

  function handleStartOver() {
    try {
      sessionStorage.removeItem("ikigai_session");
      sessionStorage.removeItem("ikigai_resume_session");
      sessionStorage.removeItem("ikigai_synthesis");
    } catch { /* ignore */ }
    router.push("/conversation");
  }

  function handleCareers() {
    try {
      sessionStorage.setItem("ikigai_synthesis", JSON.stringify(synthesis));
    } catch { /* ignore */ }
    const kw = synthesis!.careerKeywords?.join(",") || "";
    router.push(`/careers?title=${encodeURIComponent(synthesis!.title)}&keywords=${encodeURIComponent(kw)}`);
  }

  return (
    <main className="relative min-h-dvh overflow-y-auto overflow-x-hidden">
      {/* Rich ambient background — one glow per dimension + centre orange */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 55% 45% at 10% 25%, rgba(244,63,94,0.045) 0%, transparent 65%)",
              "radial-gradient(ellipse 50% 45% at 90% 20%, rgba(16,185,129,0.045) 0%, transparent 65%)",
              "radial-gradient(ellipse 50% 50% at 15% 80%, rgba(6,182,212,0.04) 0%, transparent 65%)",
              "radial-gradient(ellipse 55% 45% at 85% 80%, rgba(245,158,11,0.04) 0%, transparent 65%)",
              "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(249,115,22,0.055) 0%, transparent 70%)",
            ].join(", "),
          }}
        />
      </div>

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="absolute top-5 left-5 z-20 flex items-center gap-1.5 text-white/25 hover:text-white/55 transition-colors touch-manipulation"
        style={{ minHeight: 40, WebkitTapHighlightColor: "transparent" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="text-xs tracking-wider">Back</span>
      </button>

      <div
        className={`relative z-10 w-full flex flex-col items-center px-4 sm:px-6
          ${phase === "expanded"
            ? "pt-12 pb-20 sm:pt-16 sm:pb-24"
            : "min-h-dvh justify-center py-16"
          }`}
      >
        <AnimatePresence mode="wait">

          {/* ── Phase 1: cinematic loading orb ── */}
          {phase === "cinematic" && (
            <motion.div
              key="cinematic"
              className="flex flex-col items-center gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <AiOrb state="thinking" size={cinematicOrbSize} />
              </motion.div>
              <motion.p
                className="text-xs sm:text-sm text-white/45 tracking-[0.35em] uppercase font-light text-center"
                animate={{ opacity: [0.3, 0.75, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Synthesising your identity...
              </motion.p>
            </motion.div>
          )}

          {/* ── Phase 2: title reveal ── */}
          {phase === "title" && (
            <motion.div
              key="title"
              className="flex flex-col items-center gap-8 sm:gap-10 w-full max-w-xl text-center"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <AiOrb state="speaking" size={titleOrbSize} />

              <motion.div
                className="space-y-3 sm:space-y-4 px-2"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                <p className="text-[10px] tracking-[0.45em] uppercase text-white/30">
                  Your Ikigai
                </p>
                <h1
                  className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight"
                  style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #fde68a 55%, #ffffff 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: "drop-shadow(0 0 24px rgba(249,115,22,0.4))",
                  }}
                >
                  {synthesis.title}
                </h1>
                <p className="text-sm sm:text-base text-white/50 font-light leading-relaxed">
                  {synthesis.subtitle}
                </p>
              </motion.div>

              <motion.button
                onClick={() => setPhase("expanded")}
                className="flex items-center gap-2 px-7 py-3.5 sm:px-8 rounded-full text-white text-sm font-light tracking-wider transition-all touch-manipulation"
                style={{
                  background: "rgba(249,115,22,0.16)",
                  border: "1px solid rgba(249,115,22,0.38)",
                  boxShadow: "0 0 32px rgba(249,115,22,0.14), inset 0 1px 0 rgba(255,255,255,0.06)",
                  minHeight: 48,
                  WebkitTapHighlightColor: "transparent",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.85 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span>Explore your Ikigai</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* ── Phase 3: full profile ── */}
          {phase === "expanded" && (
            <motion.div
              key="expanded"
              className="w-full max-w-2xl space-y-5 sm:space-y-6"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >

              {/* ── SHARE CARD ── */}
              <motion.div
                className="relative rounded-3xl overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                style={{
                  background:
                    "linear-gradient(rgba(8,8,18,0.94), rgba(8,8,18,0.94)) padding-box, " +
                    "linear-gradient(135deg, #f43f5e 0%, #10b981 33%, #06b6d4 66%, #f59e0b 100%) border-box",
                  border: "1.5px solid transparent",
                  boxShadow: "0 0 80px rgba(249,115,22,0.07), 0 0 40px rgba(20,184,166,0.05), 0 24px 48px rgba(0,0,0,0.35)",
                }}
              >
                {/* Inner ambient glow at top */}
                <div
                  className="absolute inset-x-0 top-0 h-28 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(249,115,22,0.07), transparent)" }}
                />

                <div className="relative px-6 py-7 sm:px-8 sm:py-8 text-center">
                  {/* Label row */}
                  <div className="flex items-center justify-center gap-2.5 mb-5">
                    <div className="h-px flex-1 max-w-10" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.14))" }} />
                    <p className="text-[9px] tracking-[0.55em] uppercase text-white/28 font-medium">Ikigai Profile</p>
                    <div className="h-px flex-1 max-w-10" style={{ background: "linear-gradient(to left, transparent, rgba(255,255,255,0.14))" }} />
                  </div>

                  {/* Title */}
                  <h1
                    className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight mb-3"
                    style={{
                      background: "linear-gradient(135deg, #ffffff 0%, #fde68a 55%, #ffffff 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      filter: "drop-shadow(0 0 20px rgba(249,115,22,0.35))",
                    }}
                  >
                    {synthesis.title}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-sm sm:text-base text-white/55 font-light leading-relaxed mb-6 max-w-sm mx-auto">
                    {synthesis.subtitle}
                  </p>

                  {/* Dimension tags */}
                  <div className="flex flex-wrap justify-center gap-2 mb-5">
                    {DIMENSION_CONFIG.map(({ label, Icon, color, bg, border }) => (
                      <div
                        key={label}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-light tracking-wide"
                        style={{ background: bg, border: `1px solid ${border}`, color }}
                      >
                        <Icon className="w-2.5 h-2.5 shrink-0" />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Highlight chips */}
                  {synthesis.highlights?.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      {synthesis.highlights.map((h, i) => {
                        const c = HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length];
                        return (
                          <motion.span
                            key={i}
                            className="px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide"
                            style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
                            initial={{ opacity: 0, scale: 0.82 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 + i * 0.07 }}
                          >
                            {h}
                          </motion.span>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer: branding + share */}
                  <div
                    className="flex items-center justify-between pt-4"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.055)" }}
                  >
                    <span className="text-[9px] text-white/18 tracking-[0.4em] uppercase font-light">ikigai.ai</span>
                    <button
                      onClick={handleShare}
                      className="inline-flex items-center gap-1.5 text-xs text-white/32 hover:text-white/65 transition-colors touch-manipulation"
                      style={{ minHeight: 36, WebkitTapHighlightColor: "transparent" }}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{copied ? "Copied!" : "Share"}</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* ── EXPLANATION ── */}
              {synthesis.explanation && (
                <motion.div
                  className="glass rounded-2xl px-6 py-5 sm:px-7 sm:py-6"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14 }}
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex gap-4">
                    <div
                      className="shrink-0 w-0.5 rounded-full self-stretch"
                      style={{
                        background: "linear-gradient(180deg, rgba(249,115,22,0.65), rgba(20,184,166,0.55), rgba(6,182,212,0.3), transparent)",
                        minHeight: 48,
                      }}
                    />
                    <div className="space-y-3">
                      {synthesis.explanation
                        .split(/\n\n+/)
                        .filter(Boolean)
                        .map((para, i) => (
                          <p key={i} className="text-sm text-white/55 font-light leading-relaxed">{para}</p>
                        ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── INSIGHT CARDS 2×2 ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {INSIGHT_CARDS.map((card, idx) => {
                  const items = synthesis[card.key] as string[] | undefined;
                  if (!items?.length) return null;
                  return (
                    <InsightCard
                      key={card.key}
                      title={card.title}
                      Icon={card.Icon}
                      items={items}
                      color={card.color}
                      rgba={card.rgba}
                      delay={0.22 + idx * 0.07}
                    />
                  );
                })}
              </div>

              {/* ── DEEP DIVE ── */}
              {synthesis.deepDive?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2.5"
                >
                  <p className="text-[9px] tracking-[0.45em] uppercase text-white/20 px-1 mb-3">Deep Dive</p>
                  {synthesis.deepDive.map((item, i) => {
                    const isOpen = openDeepDive === i;
                    return (
                      <div
                        key={i}
                        className="rounded-2xl overflow-hidden transition-all"
                        style={{
                          background: isOpen ? "rgba(249,115,22,0.04)" : "rgba(255,255,255,0.03)",
                          border: isOpen ? "1px solid rgba(249,115,22,0.22)" : "1px solid rgba(255,255,255,0.07)",
                          backdropFilter: "blur(20px)",
                        }}
                      >
                        <button
                          className="w-full flex items-center gap-3.5 px-5 py-4 text-left touch-manipulation"
                          style={{ WebkitTapHighlightColor: "transparent", minHeight: 58 }}
                          onClick={() => setOpenDeepDive(isOpen ? null : i)}
                        >
                          <span
                            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium transition-all"
                            style={{
                              background: isOpen ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.07)",
                              color: isOpen ? "rgba(249,115,22,0.95)" : "rgba(255,255,255,0.28)",
                              border: isOpen ? "1px solid rgba(249,115,22,0.35)" : "1px solid rgba(255,255,255,0.09)",
                            }}
                          >
                            {i + 1}
                          </span>
                          <span className="flex-1 text-sm text-white/72 font-light leading-snug pr-2">
                            {item.heading}
                          </span>
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.22 }}
                            className="shrink-0"
                          >
                            <ChevronDown className="w-4 h-4 text-white/22" />
                          </motion.div>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <p
                                className="px-5 pb-5 text-sm text-white/50 font-light leading-relaxed pt-3"
                                style={{ borderTop: "1px solid rgba(249,115,22,0.08)" }}
                              >
                                {item.detail}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {/* ── CTA: Careers ── */}
              <motion.button
                onClick={handleCareers}
                className="group relative flex items-center gap-3 px-8 sm:px-10 py-4 rounded-full text-white font-light text-sm tracking-wider transition-all w-full sm:w-auto justify-center touch-manipulation overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(249,115,22,0.22), rgba(20,184,166,0.18))",
                  border: "1px solid rgba(249,115,22,0.38)",
                  boxShadow: "0 0 40px rgba(249,115,22,0.12), 0 8px 24px rgba(0,0,0,0.25)",
                  minHeight: 52,
                  WebkitTapHighlightColor: "transparent",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Shimmer */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)" }}
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
                />
                <span className="relative">See Career Matches</span>
                <ChevronRight className="relative w-4 h-4 transition-transform group-hover:translate-x-1" />
              </motion.button>

              {/* ── Secondary actions ── */}
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.72 }}
              >
                <button
                  onClick={handleAddContext}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-white/55 text-sm font-light tracking-wide touch-manipulation transition-colors hover:text-white/80"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", minHeight: 44, WebkitTapHighlightColor: "transparent" }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Add more context</span>
                </button>
                <button
                  onClick={handleStartOver}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-white/30 text-sm font-light tracking-wide touch-manipulation transition-colors hover:text-white/55"
                  style={{ border: "1px solid rgba(255,255,255,0.06)", background: "transparent", minHeight: 44, WebkitTapHighlightColor: "transparent" }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start over</span>
                </button>
              </motion.div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}

function InsightCard({
  title,
  Icon,
  items,
  color,
  rgba,
  delay,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  items: string[];
  color: string;
  rgba: { bg: string; border: string; glow: string };
  delay: number;
}) {
  return (
    <motion.div
      className="rounded-2xl p-4 sm:p-5"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.48 }}
      style={{
        background: `linear-gradient(145deg, ${rgba.bg}, rgba(255,255,255,0.02))`,
        border: `1px solid ${rgba.border}`,
        boxShadow: `0 0 28px ${rgba.glow}`,
      }}
    >
      <div className="flex items-center gap-2.5 mb-3.5">
        <div className="p-1.5 rounded-lg shrink-0" style={{ background: rgba.bg, border: `1px solid ${rgba.border}` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <p className="text-[10px] tracking-widest uppercase font-medium" style={{ color }}>{title}</p>
      </div>
      <div className="mb-3.5 h-px" style={{ background: `linear-gradient(to right, ${rgba.border}, transparent)` }} />
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
            <span className="text-xs text-white/65 font-light leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function RevealPage() {
  return (
    <Suspense>
      <RevealContent />
    </Suspense>
  );
}
