"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { AiOrb } from "@/components/orb/AiOrb";
import { VennDiagram } from "@/components/ikigai/VennDiagram";
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
  Map,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useResponsiveSize } from "@/lib/useResponsiveSize";
import { createClient } from "@/lib/supabase/client";

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
  const [phase, setPhase] = useState<"cinematic" | "signin" | "title" | "expanded">("cinematic");
  const isSignedInRef = useRef<boolean | null>(null);
  const [openDeepDive, setOpenDeepDive] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

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
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        const signedIn = !!data.user;
        setIsSignedIn(signedIn);
        isSignedInRef.current = signedIn;
      });
    } catch {
      setIsSignedIn(false);
      isSignedInRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!synthesis) return;
    const t = setTimeout(() => {
      if (isSignedInRef.current === false) {
        setPhase("signin");
      } else {
        setPhase("title");
      }
    }, 2800);
    return () => clearTimeout(t);
  }, [synthesis]);

  if (!synthesis) return null;

  async function handleShare() {
    const text = `My Ikigai: "${synthesis!.title}" — ${synthesis!.subtitle}\n\nFind yours → ikigai.ai`;

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

          {/* ── Phase 1.5: sign-in gate (only for logged-out users) ── */}
          {phase === "signin" && (
            <motion.div
              key="signin"
              className="flex flex-col items-center gap-6 w-full max-w-xs text-center px-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.55, ease: [0.34, 1.2, 0.64, 1] }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.28)" }}
              >
                <Sparkles className="w-6 h-6" style={{ color: "#fb923c" }} />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white/90 leading-tight">Save your results</h2>
                <p className="text-sm text-white/45 font-light leading-relaxed">
                  Create a free account to access your profile anytime and track how your Ikigai evolves.
                </p>
              </div>

              <button
                onClick={async () => {
                  try { sessionStorage.setItem("ikigai_synthesis", JSON.stringify(synthesis)); } catch { /* ignore */ }
                  try {
                    const supabase = createClient();
                    await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: { redirectTo: `${window.location.origin}/auth/callback?next=/profile` },
                    });
                  } catch { router.push("/auth/login?next=/profile"); }
                }}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium text-white transition-all touch-manipulation"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  minHeight: 52,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                  <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <button
                onClick={() => setPhase("title")}
                className="text-sm text-white/30 hover:text-white/55 transition-colors touch-manipulation py-2"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Skip for now
              </button>
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
                  <p className="text-sm sm:text-base text-white/55 font-light leading-relaxed mb-5 max-w-sm mx-auto">
                    {synthesis.subtitle}
                  </p>

                  {/* Ikigai Score */}
                  {synthesis.ikigaiScore != null && (
                    <IkigaiScoreRing score={synthesis.ikigaiScore.score} reasoning={synthesis.ikigaiScore.reasoning} />
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

              {/* ── VENN DIAGRAM ── */}
              {synthesis.quadrantItems && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl px-4 py-5 sm:px-6 sm:py-6"
                  style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
                >
                  <VennDiagram quadrantItems={synthesis.quadrantItems} vennDetails={synthesis.vennDetails} />
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

              {/* ── KAMIYA NEEDS ── */}
              {synthesis.kamiyaNeeds && (synthesis.kamiyaNeeds.met.length > 0 || synthesis.kamiyaNeeds.unmet.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.44 }}
                  className="rounded-2xl p-5 sm:p-6"
                  style={{
                    background: "#12121a",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 16,
                  }}
                >
                  <p className="text-[9px] tracking-[0.45em] uppercase text-white/20 mb-4">
                    What your life is currently giving you
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Met needs */}
                    {synthesis.kamiyaNeeds.met.length > 0 && (
                      <div className="space-y-2.5">
                        <p className="text-[10px] tracking-widest uppercase font-medium mb-3" style={{ color: "#4ecdc4" }}>
                          Working for you
                        </p>
                        {synthesis.kamiyaNeeds.met.map((item, i) => {
                          const colonIdx = item.indexOf(":");
                          const needName = colonIdx > -1 ? item.slice(0, colonIdx) : null;
                          const rest = colonIdx > -1 ? item.slice(colonIdx + 1).trim() : item;
                          return (
                            <div key={i} className="flex items-start gap-2.5">
                              <span className="mt-1 w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center text-[8px]" style={{ background: "rgba(78,205,196,0.15)", border: "1px solid rgba(78,205,196,0.35)", color: "#4ecdc4" }}>✓</span>
                              <p className="text-xs text-white/55 font-light leading-relaxed">
                                {needName && <span className="text-white/75 font-medium">{needName}: </span>}{rest}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Unmet needs */}
                    {synthesis.kamiyaNeeds.unmet.length > 0 && (
                      <div className="space-y-2.5">
                        <p className="text-[10px] tracking-widest uppercase font-medium mb-3" style={{ color: "#e8845a" }}>
                          Not yet satisfied
                        </p>
                        {synthesis.kamiyaNeeds.unmet.map((item, i) => {
                          const colonIdx = item.indexOf(":");
                          const needName = colonIdx > -1 ? item.slice(0, colonIdx) : null;
                          const rest = colonIdx > -1 ? item.slice(colonIdx + 1).trim() : item;
                          return (
                            <div key={i} className="flex items-start gap-2.5">
                              <span className="mt-1 w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center text-[8px]" style={{ background: "rgba(232,132,90,0.12)", border: "1px solid rgba(232,132,90,0.3)", color: "#e8845a" }}>○</span>
                              <p className="text-xs text-white/55 font-light leading-relaxed">
                                {needName && <span className="text-white/75 font-medium">{needName}: </span>}{rest}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

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
                          <span className="flex-1 text-sm text-white/85 font-normal leading-snug pr-2">
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
                                className="px-5 pb-5 text-[14px] text-white/65 font-light leading-[1.65] pt-3"
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

              {/* ── SIDE QUESTS ── */}
              {synthesis.sideQuests && synthesis.sideQuests.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.52 }}
                  className="rounded-2xl p-5 sm:p-6 space-y-4"
                  style={{
                    background: "linear-gradient(145deg, rgba(168,85,247,0.06), rgba(255,255,255,0.02))",
                    border: "1px solid rgba(168,85,247,0.2)",
                    boxShadow: "0 0 28px rgba(168,85,247,0.06)",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg shrink-0" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
                      <Sparkles className="w-3.5 h-3.5" style={{ color: "#a855f7" }} />
                    </div>
                    <p className="text-[10px] tracking-widest uppercase font-medium" style={{ color: "#a855f7" }}>Side Quests</p>
                  </div>
                  <div className="h-px" style={{ background: "linear-gradient(to right, rgba(168,85,247,0.2), transparent)" }} />
                  <ul className="space-y-3">
                    {synthesis.sideQuests.map((quest, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium"
                          style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc" }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm text-white/65 font-light leading-relaxed">{quest}</span>
                      </li>
                    ))}
                  </ul>
                  {/* City button */}
                  <button
                    onClick={() => {
                      try { sessionStorage.setItem("ikigai_synthesis", JSON.stringify(synthesis)); } catch { /* ignore */ }
                      router.push("/activities");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium tracking-wide touch-manipulation transition-colors"
                    style={{
                      background: "rgba(168,85,247,0.1)",
                      border: "1px solid rgba(168,85,247,0.25)",
                      color: "#c084fc",
                      minHeight: 44,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Find side quests in my city
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </motion.div>
              )}

              {/* ── POTENTIAL FUTURES (4 career paths) ── */}
              {synthesis.careerPaths && synthesis.careerPaths.length > 0 && (
                <CareerPathsSection paths={synthesis.careerPaths} onJobSearch={handleCareers} />
              )}

              {/* ── PURPOSE & LIFE ADVICE ── */}
              {synthesis.purposeAdvice && synthesis.purposeAdvice.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="rounded-2xl p-5 sm:p-6 space-y-4"
                  style={{
                    background: "linear-gradient(145deg, rgba(245,158,11,0.06), rgba(255,255,255,0.02))",
                    border: "1px solid rgba(245,158,11,0.2)",
                    boxShadow: "0 0 28px rgba(245,158,11,0.06)",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg shrink-0" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <Flame className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
                    </div>
                    <p className="text-[10px] tracking-widest uppercase font-medium" style={{ color: "#f59e0b" }}>Purpose & Life</p>
                  </div>
                  <div className="h-px" style={{ background: "linear-gradient(to right, rgba(245,158,11,0.2), transparent)" }} />
                  <ul className="space-y-3.5">
                    {synthesis.purposeAdvice.map((advice, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#f59e0b", boxShadow: "0 0 6px #f59e0b" }} />
                        <span className="text-sm text-white/65 font-light leading-relaxed">{advice}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* ── YOUR STORY (deep read, moved to bottom) ── */}
              {synthesis.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.62 }}
                  className="rounded-2xl p-5 sm:p-6"
                  style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}
                >
                  <p className="text-[9px] tracking-[0.45em] uppercase text-white/20 mb-4">The full picture</p>
                  <div className="flex gap-4">
                    <div
                      className="shrink-0 w-0.5 rounded-full self-stretch"
                      style={{
                        background: "linear-gradient(180deg, rgba(249,115,22,0.5), rgba(20,184,166,0.4), transparent)",
                        minHeight: 48,
                      }}
                    />
                    <div className="space-y-3.5">
                      {synthesis.explanation.split(/\n\n+/).filter(Boolean).map((para, i) => (
                        <p key={i} className="text-[14px] text-white/55 font-light leading-[1.8]">{para}</p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── SIGN-UP CTA (only if not signed in) ── */}
              {isSignedIn === false && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.64 }}
                  className="relative rounded-2xl overflow-hidden p-5 sm:p-6 text-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(20,184,166,0.08))",
                    border: "1px solid rgba(249,115,22,0.3)",
                    boxShadow: "0 0 40px rgba(249,115,22,0.08)",
                  }}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-16 pointer-events-none"
                    style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(249,115,22,0.08), transparent)" }}
                  />
                  <p className="text-[9px] tracking-[0.45em] uppercase text-white/30 mb-3">Don&apos;t lose this</p>
                  <h3 className="text-base font-medium text-white/90 mb-2">Save your Ikigai profile</h3>
                  <p className="text-sm text-white/45 font-light mb-5 leading-relaxed">
                    Create a free account to save your results, come back anytime, and track how your Ikigai evolves.
                  </p>
                  <button
                    onClick={() => router.push("/auth/login?next=/profile")}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-medium text-white transition-all touch-manipulation"
                    style={{
                      background: "linear-gradient(135deg, rgba(249,115,22,0.35), rgba(249,115,22,0.22))",
                      border: "1px solid rgba(249,115,22,0.55)",
                      boxShadow: "0 0 24px rgba(249,115,22,0.18)",
                      minHeight: 44,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <span>Create free account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="mt-3 text-[10px] text-white/20">No credit card. Takes 30 seconds.</p>
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
                transition={{ delay: 0.7 }}
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
                transition={{ delay: 0.8 }}
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

function CareerPathsSection({
  paths,
  onJobSearch,
}: {
  paths: NonNullable<import("@/types/ikigai").IkigaiSynthesis["careerPaths"]>;
  onJobSearch: () => void;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const PATH_COLORS = ["#06b6d4", "#a855f7", "#f97316", "#10b981"];

  return (
    <motion.div
      id="career-paths"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.56 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2.5 px-1">
        <div className="p-1.5 rounded-lg shrink-0" style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>
          <Map className="w-3.5 h-3.5" style={{ color: "#06b6d4" }} />
        </div>
        <p className="text-[10px] tracking-widest uppercase font-medium" style={{ color: "#06b6d4" }}>Potential Futures</p>
      </div>

      {paths.map((path, idx) => {
        const color = PATH_COLORS[idx % PATH_COLORS.length];
        const isOpen = openIdx === idx;
        return (
          <div
            key={idx}
            className="rounded-2xl overflow-hidden transition-all"
            style={{
              background: isOpen ? `rgba(${color === "#06b6d4" ? "6,182,212" : color === "#a855f7" ? "168,85,247" : color === "#f97316" ? "249,115,22" : "16,185,129"},0.05)` : "rgba(255,255,255,0.025)",
              border: `1px solid ${isOpen ? color + "35" : "rgba(255,255,255,0.07)"}`,
            }}
          >
            {/* Header row — always visible */}
            <button
              className="w-full flex items-start gap-3.5 px-5 py-4 text-left touch-manipulation"
              style={{ WebkitTapHighlightColor: "transparent", minHeight: 64 }}
              onClick={() => setOpenIdx(isOpen ? null : idx)}
            >
              <span
                className="shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold"
                style={{ background: color + "22", border: `1px solid ${color}55`, color }}
              >
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/85 leading-snug mb-0.5">{path.title}</p>
                <p className="text-xs text-white/40 font-light leading-relaxed line-clamp-2">{path.tagline}</p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1.5 ml-2">
                {path.timeline && (
                  <span className="text-[9px] font-light tracking-wide whitespace-nowrap" style={{ color, opacity: 0.7 }}>
                    {path.timeline}
                  </span>
                )}
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.22 }}>
                  <ChevronDown className="w-4 h-4 text-white/25" />
                </motion.div>
              </div>
            </button>

            {/* Expanded milestones */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-1" style={{ borderTop: `1px solid ${color}18` }}>
                    {/* Timeline milestones */}
                    <ol className="relative space-y-3.5 mb-5">
                      <div
                        className="absolute left-[11px] top-3 bottom-3 w-px"
                        style={{ background: `linear-gradient(to bottom, ${color}55, transparent)` }}
                      />
                      {path.milestones.map((m, mi) => (
                        <li key={mi} className="flex items-start gap-3 pl-1">
                          <span
                            className="shrink-0 mt-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center z-10"
                            style={{ background: color + "20", border: `1px solid ${color}50` }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] tracking-wide uppercase font-medium mb-0.5" style={{ color, opacity: 0.65 }}>
                              {m.period}
                            </p>
                            <p className="text-sm text-white/65 font-light leading-relaxed">{m.action}</p>
                          </div>
                        </li>
                      ))}
                    </ol>

                    {/* Job search CTA */}
                    <button
                      onClick={onJobSearch}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium touch-manipulation"
                      style={{
                        background: color + "12",
                        border: `1px solid ${color}30`,
                        color,
                        minHeight: 40,
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      See matching job postings
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.div>
  );
}

function IkigaiScoreRing({ score, reasoning }: { score: number; reasoning: string }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const scoreColor =
    score >= 70 ? "#10b981" :
    score >= 45 ? "#f97316" :
    "#e8845a";

  return (
    <motion.div
      className="mx-auto mb-5 w-full max-w-xs rounded-2xl px-5 py-5 flex flex-col items-center gap-4"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${scoreColor}22`,
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <p className="text-[9px] tracking-[0.45em] uppercase text-white/20 self-start">Living your Ikigai</p>

      <div className="flex items-center gap-5 w-full">
        {/* Ring */}
        <div className="relative shrink-0 w-[96px] h-[96px]">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            {/* Track */}
            <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
            {/* Progress */}
            <motion.circle
              cx="48" cy="48" r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              style={{ filter: `drop-shadow(0 0 6px ${scoreColor}88)` }}
            />
          </svg>
          {/* Score number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-2xl font-semibold leading-none"
              style={{ color: scoreColor }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {score}
            </motion.span>
            <span className="text-[9px] text-white/25 font-light mt-0.5">%</span>
          </div>
        </div>

        {/* Reasoning */}
        <p className="flex-1 text-[12px] text-white/48 font-light leading-relaxed">{reasoning}</p>
      </div>
    </motion.div>
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
            <span className="text-[13px] text-white/75 font-light leading-relaxed">{item}</span>
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
