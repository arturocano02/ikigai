"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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
  TrendingUp,
  Compass,
  Flame,
  Map,
  Sparkles,
  ArrowRight,
  X,
  ExternalLink,
} from "lucide-react";
import { useResponsiveSize } from "@/lib/useResponsiveSize";
import { createClient } from "@/lib/supabase/client";


const SYNTHESIS_KEY = "ikigai_synthesis_result";

function RevealContent() {
  const router = useRouter();
  const [synthesis, setSynthesis] = useState<IkigaiSynthesis | null>(null);
  const [phase, setPhase] = useState<"cinematic" | "signin" | "title" | "expanded">("cinematic");
  const isSignedInRef = useRef<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  const cinematicOrbSize = useResponsiveSize(120, 160);
  const titleOrbSize = useResponsiveSize(90, 120);

  useEffect(() => {
    // Read from sessionStorage first (current session), fall back to localStorage (survived refresh)
    let raw: string | null = null;
    try { raw = sessionStorage.getItem(SYNTHESIS_KEY); } catch { /* ignore */ }
    if (!raw) {
      try { raw = localStorage.getItem(SYNTHESIS_KEY); } catch { /* ignore */ }
    }
    if (!raw) { router.replace("/"); return; }
    try {
      setSynthesis(JSON.parse(raw));
    } catch {
      router.replace("/");
    }
  }, [router]);

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

  // Auto-save session to DB when user is signed in and synthesis is ready
  const savedToDbRef = useRef(false);
  useEffect(() => {
    if (!isSignedIn || !synthesis || savedToDbRef.current) return;
    savedToDbRef.current = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        let conversationData: object = {};
        try {
          const raw = sessionStorage.getItem("ikigai_session");
          if (raw) conversationData = JSON.parse(raw);
        } catch { /* ignore */ }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await supabase.from("ikigai_sessions").insert({
          user_id: userData.user.id,
          title: synthesis.title,
          subtitle: synthesis.subtitle ?? null,
          synthesis: synthesis as any,
          conversation_data: conversationData as any,
        });
        if (error) console.warn("[reveal] session save failed:", error.message);
        else {
          try { localStorage.removeItem("ikigai_synthesis_result"); } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    })();
  }, [isSignedIn, synthesis]);

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
      {/* Ambient background — dimension glows + violet centre */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 55% 45% at 10% 25%, rgba(244,63,94,0.042) 0%, transparent 65%)",
              "radial-gradient(ellipse 50% 45% at 90% 20%, rgba(16,185,129,0.038) 0%, transparent 65%)",
              "radial-gradient(ellipse 50% 50% at 15% 80%, rgba(34,211,238,0.035) 0%, transparent 65%)",
              "radial-gradient(ellipse 55% 45% at 85% 80%, rgba(168,85,247,0.04) 0%, transparent 65%)",
              "radial-gradient(ellipse 70% 55% at 50% 35%, rgba(212,160,23,0.065) 0%, transparent 70%)",
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
                style={{ background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.28)" }}
              >
                <Sparkles className="w-6 h-6" style={{ color: "#f5c842" }} />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white/90 leading-tight">Save your results</h2>
                <p className="text-sm text-white/45 font-light leading-relaxed">
                  Create a free account to access your profile anytime and track how your Ikigai evolves.
                </p>
              </div>

              <button
                onClick={async () => {
                  try {
                    const supabase = createClient();
                    await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: { redirectTo: `${window.location.origin}/auth/callback?next=/reveal` },
                    });
                  } catch { router.push("/auth/login?next=/reveal"); }
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
                    background: "linear-gradient(135deg, #ffffff 0%, #fde68a 55%, #f5c842 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: "drop-shadow(0 0 24px rgba(212,160,23,0.4))",
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
                  background: "linear-gradient(135deg, rgba(212,160,23,0.2), rgba(205,127,50,0.12))",
                  border: "1px solid rgba(212,160,23,0.42)",
                  boxShadow: "0 0 32px rgba(212,160,23,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
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

              {/* ── VENN CARD (shareable) ── */}
              <motion.div
                className="relative rounded-3xl overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                style={{
                  background:
                    "linear-gradient(rgba(6,4,18,0.97), rgba(6,4,18,0.97)) padding-box, " +
                    "linear-gradient(135deg, #d4a017 0%, #f5c842 33%, #cd7f32 66%, #fde68a 100%) border-box",
                  border: "1.5px solid transparent",
                  boxShadow: "0 0 80px rgba(212,160,23,0.1), 0 24px 56px rgba(0,0,0,0.5)",
                }}
              >
                <div className="absolute inset-x-0 top-0 h-24 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(212,160,23,0.06), transparent)" }}
                />

                <div className="relative px-5 pt-6 pb-5 sm:px-7 sm:pt-7">
                  {/* Header label */}
                  <div className="flex items-center justify-center gap-2.5 mb-4">
                    <div className="h-px flex-1 max-w-8" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.12))" }} />
                    <p className="text-[9px] tracking-[0.5em] uppercase text-white/25 font-medium">Ikigai Profile</p>
                    <div className="h-px flex-1 max-w-8" style={{ background: "linear-gradient(to left, transparent, rgba(255,255,255,0.12))" }} />
                  </div>

                  {/* Title */}
                  <h1
                    className="text-center text-2xl sm:text-3xl font-semibold leading-tight mb-2"
                    style={{
                      background: "linear-gradient(135deg, #ffffff 0%, #fde68a 55%, #f5c842 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      filter: "drop-shadow(0 0 20px rgba(212,160,23,0.35))",
                    }}
                  >
                    {synthesis.title}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-center text-sm text-white/50 font-light leading-relaxed mb-5 max-w-xs mx-auto">
                    {synthesis.subtitle}
                  </p>

                  {/* Circles */}
                  {synthesis.quadrantItems && (
                    <VennDiagram quadrantItems={synthesis.quadrantItems} vennDetails={synthesis.vennDetails} />
                  )}

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between mt-4 pt-4"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
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

              {/* ── IKIGAI SCORE compact ── */}
              {synthesis.ikigaiScore != null && (
                <IkigaiScoreCompact
                  score={synthesis.ikigaiScore.score}
                  reasoning={synthesis.ikigaiScore.reasoning}
                  detail={synthesis.ikigaiScore.detail}
                />
              )}

              {/* ── SECTION ACCORDION ── */}
              <SectionList
                synthesis={synthesis}
                onJobSearch={handleCareers}
                onCityQuests={() => {
                  try { sessionStorage.setItem("ikigai_synthesis", JSON.stringify(synthesis)); } catch { /* ignore */ }
                  router.push("/activities");
                }}
              />

              {/* ── SIGN-UP CTA (only if not signed in) ── */}
              {isSignedIn === false && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.64 }}
                  className="relative rounded-2xl overflow-hidden p-5 sm:p-6 text-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(212,160,23,0.1), rgba(205,127,50,0.08))",
                    border: "1px solid rgba(212,160,23,0.3)",
                    boxShadow: "0 0 40px rgba(212,160,23,0.08)",
                  }}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-16 pointer-events-none"
                    style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(212,160,23,0.08), transparent)" }}
                  />
                  <p className="text-[9px] tracking-[0.45em] uppercase text-white/30 mb-3">Don&apos;t lose this</p>
                  <h3 className="text-base font-medium text-white/90 mb-2">Save your Ikigai profile</h3>
                  <p className="text-sm text-white/45 font-light mb-5 leading-relaxed">
                    Create a free account to save your results, come back anytime, and track how your Ikigai evolves.
                  </p>
                  <button
                    onClick={() => router.push("/auth/login?next=/reveal")}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-medium text-white transition-all touch-manipulation"
                    style={{
                      background: "linear-gradient(135deg, rgba(212,160,23,0.35), rgba(212,160,23,0.22))",
                      border: "1px solid rgba(212,160,23,0.55)",
                      boxShadow: "0 0 24px rgba(212,160,23,0.18)",
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
                  background: "linear-gradient(135deg, rgba(212,160,23,0.25), rgba(205,127,50,0.18))",
                  border: "1px solid rgba(212,160,23,0.42)",
                  boxShadow: "0 0 40px rgba(212,160,23,0.16), 0 8px 28px rgba(0,0,0,0.3)",
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

  const PATH_COLORS = ["#06b6d4", "#a855f7", "#d4a017", "#10b981"];

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
              background: isOpen ? `rgba(${color === "#06b6d4" ? "6,182,212" : color === "#a855f7" ? "168,85,247" : color === "#d4a017" ? "139,92,246" : "16,185,129"},0.05)` : "rgba(255,255,255,0.025)",
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

function IkigaiScoreCompact({ score, reasoning, detail }: { score: number; reasoning: string; detail?: string }) {
  const [showPopup, setShowPopup] = useState(false);
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const scoreColor =
    score >= 70 ? "#10b981" :
    score >= 45 ? "#d4a017" :
    "#e8845a";

  return (
    <>
      <motion.button
        onClick={() => setShowPopup(true)}
        className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 text-left touch-manipulation"
        style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${scoreColor}20`, WebkitTapHighlightColor: "transparent" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Mini ring */}
        <div className="relative shrink-0 w-[56px] h-[56px]">
          <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
            <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
            <motion.circle
              cx="28" cy="28" r={radius}
              fill="none" stroke={scoreColor} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              style={{ filter: `drop-shadow(0 0 4px ${scoreColor}88)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-semibold leading-none" style={{ color: scoreColor }}>{score}</span>
            <span className="text-[8px] text-white/25 font-light">%</span>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[9px] tracking-[0.3em] uppercase text-white/20 mb-1">Living your Ikigai</p>
          <p className="text-sm text-white/65 font-light leading-snug">{reasoning}</p>
        </div>

        {/* Tap hint */}
        <ChevronRight className="shrink-0 w-4 h-4 text-white/18" />
      </motion.button>

      {/* Popup */}
      <AnimatePresence>
        {showPopup && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPopup(false)}
            />
            <motion.div
              className="fixed z-50 left-4 right-4 rounded-3xl overflow-hidden"
              style={{
                top: "50%", maxWidth: 420, marginLeft: "auto", marginRight: "auto",
                background: "linear-gradient(160deg, #13131f 0%, #0d0d18 100%)",
                border: `1px solid ${scoreColor}30`,
                boxShadow: `0 0 60px ${scoreColor}18, 0 24px 48px rgba(0,0,0,0.5)`,
              }}
              initial={{ opacity: 0, scale: 0.88, y: "-42%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%" }}
              exit={{ opacity: 0, scale: 0.92, y: "-46%" }}
              transition={{ type: "spring", damping: 28, stiffness: 340 }}
            >
              <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, ${scoreColor}, ${scoreColor}00)` }} />
              <div className="px-6 pt-5 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[9px] tracking-[0.3em] uppercase mb-1" style={{ color: scoreColor, opacity: 0.7 }}>Ikigai alignment</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-semibold" style={{ color: scoreColor }}>{score}</span>
                      <span className="text-base text-white/30 font-light">/ 100</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPopup(false)}
                    className="w-9 h-9 rounded-full flex items-center justify-center touch-manipulation"
                    style={{ background: "rgba(255,255,255,0.07)", WebkitTapHighlightColor: "transparent" }}
                  >
                    <X className="w-4 h-4 text-white/45" />
                  </button>
                </div>
                <div className="mx-0 mb-4 h-px" style={{ background: `linear-gradient(to right, ${scoreColor}40, transparent)` }} />
                <p className="text-[14px] text-white/65 font-light leading-relaxed mb-3">{reasoning}</p>
                {detail && <p className="text-[13px] text-white/45 font-light leading-relaxed">{detail}</p>}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SectionList({
  synthesis,
  onJobSearch,
  onCityQuests,
}: {
  synthesis: IkigaiSynthesis;
  onJobSearch: () => void;
  onCityQuests: () => void;
}) {
  const [openKey, setOpenKey] = useState<string | null>("futurePaths");
  const [openDeepDive, setOpenDeepDive] = useState<number | null>(0);

  type SectionDef = {
    key: string;
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    color: string;
    available: boolean;
    content: React.ReactNode;
  };

  const sections: SectionDef[] = [
    {
      key: "futurePaths",
      label: "Future Paths",
      icon: Map,
      color: "#06b6d4",
      available: !!synthesis.careerPaths?.length,
      content: <CareerPathsSection paths={synthesis.careerPaths ?? []} onJobSearch={onJobSearch} />,
    },
    {
      key: "purposeLife",
      label: "Purpose & Life",
      icon: Flame,
      color: "#f59e0b",
      available: !!synthesis.purposeAdvice?.length,
      content: (
        <ul className="space-y-3.5 pt-1">
          {synthesis.purposeAdvice?.map((advice, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#f59e0b", boxShadow: "0 0 6px #f59e0b" }} />
              <span className="text-sm text-white/65 font-light leading-relaxed">{advice}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "sideQuests",
      label: "Side Quests",
      icon: Sparkles,
      color: "#a855f7",
      available: !!synthesis.sideQuests?.length,
      content: (
        <div className="space-y-4 pt-1">
          <ul className="space-y-3">
            {synthesis.sideQuests?.map((quest, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium" style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc" }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/65 font-light leading-relaxed">{quest}</p>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(quest)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium touch-manipulation"
                    style={{ color: "#c084fc", opacity: 0.6 }}
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    Search
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={onCityQuests}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium tracking-wide touch-manipulation"
            style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", color: "#c084fc", minHeight: 44, WebkitTapHighlightColor: "transparent" }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Find side quests in my city
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>
      ),
    },
    {
      key: "patterns",
      label: "Patterns We Observed",
      icon: TrendingUp,
      color: "#d4a017",
      available: !!synthesis.patterns?.length,
      content: (
        <ul className="space-y-2.5 pt-1">
          {synthesis.patterns?.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#d4a017" }} />
              <span className="text-sm text-white/65 font-light leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "strengths",
      label: "Natural Strengths",
      icon: Zap,
      color: "#10b981",
      available: !!synthesis.strengths?.length,
      content: (
        <ul className="space-y-2.5 pt-1">
          {synthesis.strengths?.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#10b981" }} />
              <span className="text-sm text-white/65 font-light leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "environments",
      label: "Where You Thrive",
      icon: Compass,
      color: "#06b6d4",
      available: !!synthesis.idealEnvironments?.length,
      content: (
        <ul className="space-y-2.5 pt-1">
          {synthesis.idealEnvironments?.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#06b6d4" }} />
              <span className="text-sm text-white/65 font-light leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "lifeNeeds",
      label: "What Life Is Currently Giving You",
      icon: Heart,
      color: "#e8845a",
      available: !!(synthesis.kamiyaNeeds?.met.length || synthesis.kamiyaNeeds?.unmet.length),
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {synthesis.kamiyaNeeds?.met.length ? (
            <div className="space-y-2.5">
              <p className="text-[10px] tracking-widest uppercase font-medium mb-3" style={{ color: "#4ecdc4" }}>Working for you</p>
              {synthesis.kamiyaNeeds.met.map((item, i) => {
                const ci = item.indexOf(":");
                const name = ci > -1 ? item.slice(0, ci) : null;
                const rest = ci > -1 ? item.slice(ci + 1).trim() : item;
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="mt-1 w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center text-[8px]" style={{ background: "rgba(78,205,196,0.15)", border: "1px solid rgba(78,205,196,0.35)", color: "#4ecdc4" }}>✓</span>
                    <p className="text-xs text-white/55 font-light leading-relaxed">{name && <span className="text-white/75 font-medium">{name}: </span>}{rest}</p>
                  </div>
                );
              })}
            </div>
          ) : null}
          {synthesis.kamiyaNeeds?.unmet.length ? (
            <div className="space-y-2.5">
              <p className="text-[10px] tracking-widest uppercase font-medium mb-3" style={{ color: "#e8845a" }}>Not yet satisfied</p>
              {synthesis.kamiyaNeeds.unmet.map((item, i) => {
                const ci = item.indexOf(":");
                const name = ci > -1 ? item.slice(0, ci) : null;
                const rest = ci > -1 ? item.slice(ci + 1).trim() : item;
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="mt-1 w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center text-[8px]" style={{ background: "rgba(232,132,90,0.12)", border: "1px solid rgba(232,132,90,0.3)", color: "#e8845a" }}>○</span>
                    <p className="text-xs text-white/55 font-light leading-relaxed">{name && <span className="text-white/75 font-medium">{name}: </span>}{rest}</p>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "deepDive",
      label: "Deep Dive Q&A",
      icon: ChevronDown,
      color: "#d4a017",
      available: !!synthesis.deepDive?.length,
      content: (
        <div className="space-y-2 pt-1">
          {synthesis.deepDive?.map((item, i) => {
            const isOpen = openDeepDive === i;
            return (
              <div key={i} className="rounded-xl overflow-hidden" style={{ background: isOpen ? "rgba(212,160,23,0.04)" : "rgba(255,255,255,0.03)", border: isOpen ? "1px solid rgba(212,160,23,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent", minHeight: 52 }}
                  onClick={() => setOpenDeepDive(isOpen ? null : i)}
                >
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium" style={{ background: isOpen ? "rgba(212,160,23,0.2)" : "rgba(255,255,255,0.07)", color: isOpen ? "rgba(212,160,23,0.95)" : "rgba(255,255,255,0.28)", border: isOpen ? "1px solid rgba(212,160,23,0.35)" : "1px solid rgba(255,255,255,0.09)" }}>{i + 1}</span>
                  <span className="flex-1 text-sm text-white/70 font-light leading-snug pr-2">{item.heading}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                    <ChevronDown className="w-3.5 h-3.5 text-white/22" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                      <p className="px-4 pb-4 text-sm text-white/50 font-light leading-relaxed pt-2" style={{ borderTop: "1px solid rgba(212,160,23,0.08)" }}>{item.detail}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      key: "motivations",
      label: "Core Motivations",
      icon: Flame,
      color: "#f59e0b",
      available: !!synthesis.motivations?.length,
      content: (
        <ul className="space-y-2.5 pt-1">
          {synthesis.motivations?.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#f59e0b" }} />
              <span className="text-sm text-white/65 font-light leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "fullPicture",
      label: "Full Picture",
      icon: Globe,
      color: "#9b6dff",
      available: !!synthesis.explanation,
      content: (
        <div className="flex gap-4 pt-1">
          <div className="shrink-0 w-0.5 rounded-full self-stretch" style={{ background: "linear-gradient(180deg, rgba(212,160,23,0.5), rgba(205,127,50,0.4), transparent)", minHeight: 40 }} />
          <div className="space-y-3.5">
            {synthesis.explanation?.split(/\n\n+/).filter(Boolean).map((para, i) => (
              <p key={i} className="text-[14px] text-white/55 font-light leading-[1.8]">{para}</p>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "careerMatches",
      label: "Career Matches",
      icon: TrendingUp,
      color: "#10b981",
      available: true,
      content: (
        <div className="pt-2">
          <p className="text-sm text-white/45 font-light leading-relaxed mb-4">Search for real job postings that match your Ikigai on LinkedIn and other boards.</p>
          <button
            onClick={onJobSearch}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium touch-manipulation"
            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", minHeight: 48, WebkitTapHighlightColor: "transparent" }}
          >
            <TrendingUp className="w-4 h-4" />
            See Career Matches
            <ChevronRight className="w-4 h-4 opacity-60" />
          </button>
        </div>
      ),
    },
  ].filter((s) => s.available);

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {sections.map((section) => {
        const isOpen = openKey === section.key;
        const Icon = section.icon;
        return (
          <div
            key={section.key}
            className="rounded-2xl overflow-hidden transition-colors"
            style={{
              background: isOpen ? `${section.color}08` : "rgba(255,255,255,0.025)",
              border: isOpen ? `1px solid ${section.color}28` : "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* Row header */}
            <button
              className="w-full flex items-center gap-3.5 px-4 py-4 text-left touch-manipulation"
              style={{ WebkitTapHighlightColor: "transparent", minHeight: 56 }}
              onClick={() => setOpenKey(isOpen ? null : section.key)}
            >
              <span
                className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: isOpen ? `${section.color}20` : "rgba(255,255,255,0.06)", border: `1px solid ${isOpen ? section.color + "40" : "rgba(255,255,255,0.08)"}` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: isOpen ? section.color : "rgba(255,255,255,0.35)" }} />
              </span>
              <span className="flex-1 text-sm font-light" style={{ color: isOpen ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)" }}>
                {section.label}
              </span>
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.22 }} className="shrink-0">
                <ChevronDown className="w-4 h-4" style={{ color: isOpen ? section.color : "rgba(255,255,255,0.18)" }} />
              </motion.div>
            </button>

            {/* Expanded content */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-5" style={{ borderTop: `1px solid ${section.color}15` }}>
                    {section.content}
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


export default function RevealPage() {
  return (
    <Suspense>
      <RevealContent />
    </Suspense>
  );
}
