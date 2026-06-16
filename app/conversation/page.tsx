"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { AiOrb, type OrbState } from "@/components/orb/AiOrb";
import { IkigaiMap } from "@/components/ikigai/IkigaiMap";
import { useVoice } from "@/lib/useVoice";
import { useIkigai, type SavedSession } from "@/lib/useIkigai";
import { useResponsiveSize, useIsMobile } from "@/lib/useResponsiveSize";
import { Mic, MicOff, Send, Keyboard, ArrowLeft } from "lucide-react";

type ConvLength = "ultra" | "short" | "medium" | "long";

const LENGTH_META: Record<ConvLength, { label: string; desc: string }> = {
  ultra:  { label: "Quick",  desc: "1 min" },
  short:  { label: "Short",  desc: "5 min" },
  medium: { label: "Medium", desc: "10 min" },
  long:   { label: "Long",   desc: "In depth" },
};

const INTRO_MESSAGE =
  "Hey. I'm going to ask you a few questions and we'll figure out your Ikigai together. " +
  "No wrong answers. What kind of things make you lose track of time?";

const RESUME_INTRO =
  "Welcome back. Based on what we covered, I have a few more questions to sharpen your profile. " +
  "What did we miss - is there a side of you we haven't touched yet?";

const SYNTHESIS_STAGES = [
  "Mapping what drives you...",
  "Finding the intersection of your passions...",
  "Weighing your strengths...",
  "Listening for what the world needs...",
  "Aligning purpose with livelihood...",
  "Drawing the circles together...",
  "Searching for your center...",
  "Composing your portrait...",
  "Revealing what was always there...",
  "Almost ready...",
];

const DIM_COLORS = { love: "#f43f5e", good: "#10b981", world: "#06b6d4", paid: "#f59e0b" } as const;
const DIM_LABELS = {
  love: "What You Love",
  good: "What You're Good At",
  world: "What The World Needs",
  paid: "What You Can Be Paid For",
} as const;

export default function ConversationPage() {
  const router = useRouter();

  const [resumeSession] = useState<SavedSession | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    try {
      const raw = sessionStorage.getItem("ikigai_resume_session");
      if (!raw) return undefined;
      sessionStorage.removeItem("ikigai_resume_session");
      return JSON.parse(raw) as SavedSession;
    } catch {
      return undefined;
    }
  });

  const isResume = !!resumeSession;

  const [convLength, setConvLength] = useState<ConvLength>("medium");
  const { state: ikigai, sendMessage, triggerSynthesis } = useIkigai(convLength, resumeSession);
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [currentText, setCurrentText] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [showMap, setShowMap] = useState(isResume);
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [typedMessage, setTypedMessage] = useState("");
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [synthesisStageIdx, setSynthesisStageIdx] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [explorationMode, setExplorationMode] = useState(false);
  // Keeps the overlay locked on screen until navigation completes (prevents flicker)
  const [overlayLocked, setOverlayLocked] = useState(false);

  const orbSize = useResponsiveSize(150, 180);
  const mapSize = useResponsiveSize(260, 380);
  const isMobile = useIsMobile();

  const isProcessingRef = useRef(false);
  const speakRef = useRef<((text: string, onEnd?: () => void) => Promise<void>) | null>(null);
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;
  const inputRef = useRef<HTMLInputElement>(null);
  const unlockRef = useRef<() => void>(() => {});

  const explorationModeRef = useRef(false);
  explorationModeRef.current = explorationMode;

  const handleTranscript = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setOrbState("thinking");
    setCurrentText(""); // clear previous AI response when user starts speaking

    await sendMessageRef.current(text, (aiResponse, exitExploration) => {
      if (exitExploration) setExplorationMode(false);
      setOrbState("speaking");
      setCurrentText(aiResponse);
      speakRef.current?.(aiResponse, () => {
        setOrbState("listening");
        isProcessingRef.current = false;
        // keep currentText on screen — it clears when the user speaks next
      });
    }, explorationModeRef.current);
  }, []);

  const voice = useVoice(handleTranscript);

  useEffect(() => {
    speakRef.current = voice.speak;
  }, [voice.speak]);

  // Cycle through labels while synthesizing
  useEffect(() => {
    if (ikigai.phase !== "synthesizing" && !overlayLocked) return;
    const interval = setInterval(() => {
      setSynthesisStageIdx((i) => (i + 1) % SYNTHESIS_STAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [ikigai.phase, overlayLocked]);

  // Navigate to reveal — lock the overlay to prevent flicker
  useEffect(() => {
    if (ikigai.phase === "revealed" && ikigai.synthesis) {
      voice.stopListening();
      voice.cancelSpeech();
      setOverlayLocked(true); // keep the dark overlay on screen during navigation
      sessionStorage.setItem("ikigai_session", JSON.stringify({
        messages: ikigai.messages,
        progress: ikigai.progress,
        insights: ikigai.insights,
        currentFocus: ikigai.currentFocus,
      }));
      router.push(`/reveal?data=${encodeURIComponent(JSON.stringify(ikigai.synthesis))}`);
    }
  }, [ikigai.phase, ikigai.synthesis]); // eslint-disable-line react-hooks/exhaustive-deps

  function unlockAndStart() {
    if (audioUnlocked) return;
    setAudioUnlocked(true);
    const intro = isResume ? RESUME_INTRO : INTRO_MESSAGE;
    setOrbState("speaking");
    setCurrentText(intro);

    setTimeout(() => {
      voice.speak(intro, () => {
        setOrbState("listening");
        // Text stays on screen — cleared only when user starts responding
        setHasStarted(true);
        voice.startListening();
      });
    }, 120);

    setTimeout(() => setShowMap(true), 2500);
  }
  unlockRef.current = unlockAndStart;

  function beginWithCountdown() {
    if (audioUnlocked || countdown !== null) return;
    setCountdown(3);
  }

  // Countdown tick: 3 → 2 → 1 → 0 → fire
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      unlockRef.current();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleCenterClick() {
    voice.stopListening();
    voice.cancelSpeech();
    isProcessingRef.current = false;
    setOrbState("thinking");
    triggerSynthesis();
  }

  function switchToText() {
    voice.stopListening();
    setInputMode("text");
    if (orbState === "listening") setOrbState("idle");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function switchToVoice() {
    setInputMode("voice");
    voice.startListening();
    setOrbState("listening");
  }

  function toggleListening() {
    if (!audioUnlocked) { beginWithCountdown(); return; }
    if (voice.state.isListening) {
      voice.stopListening();
      setOrbState("idle");
    } else {
      voice.startListening();
      setOrbState("listening");
    }
  }

  async function submitTyped() {
    const text = typedMessage.trim();
    if (!text || isProcessingRef.current) return;
    setTypedMessage("");
    await handleTranscript(text);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitTyped(); }
  }

  const allProgress = Object.values(ikigai.progress);
  const overallProgress = Math.round(allProgress.reduce((a, b) => a + b, 0) / allProgress.length);
  const hasAnyProgress = allProgress.some((p) => p > 0);
  const isProcessing = isProcessingRef.current || orbState === "thinking" || orbState === "speaking";
  const showOverlay = ikigai.phase === "synthesizing" || overlayLocked;
  const mapIsReady = ikigai.phase === "ready";

  // Confidence score drives the reveal button
  const confidenceScore = overallProgress; // 0-100
  const canReveal = confidenceScore >= 20;
  const glowT = Math.max(0, (confidenceScore - 20) / 80); // 0 at 20%, 1 at 100%

  return (
    <main className="relative min-h-dvh flex flex-col lg:flex-row overflow-x-hidden">

      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-5 left-5 z-20 flex items-center gap-1.5 text-white/25 hover:text-white/55 transition-colors touch-manipulation"
        style={{ minHeight: 40, WebkitTapHighlightColor: "transparent" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="text-xs tracking-wider">Home</span>
      </button>

      {/* Orb + conversation pane */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pt-14 pb-6 lg:py-10 relative z-10 min-h-[55dvh] lg:min-h-dvh">

        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <AiOrb
            state={orbState}
            size={orbSize}
            audioLevel={voice.state.audioLevel}
            onClick={audioUnlocked ? toggleListening : beginWithCountdown}
          />
        </motion.div>

        {/* Pre-start: length picker + begin */}
        <AnimatePresence>
          {!audioUnlocked && countdown === null && (
            <motion.div
              className="mt-6 flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.8 }}
            >
              {isResume ? (
                <p className="text-xs text-white/40 tracking-widest uppercase">Continuing your session</p>
              ) : (
                <div className="flex items-center gap-2">
                  {(["ultra", "short", "medium", "long"] as ConvLength[]).map((opt) => {
                    const active = convLength === opt;
                    return (
                      <button key={opt} onClick={() => setConvLength(opt)}
                        className="flex flex-col items-center px-3 py-2.5 rounded-xl text-xs transition-all touch-manipulation"
                        style={{
                          border: active ? "1px solid rgba(249,115,22,0.6)" : "1px solid rgba(255,255,255,0.08)",
                          background: active ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)",
                          color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
                          minHeight: 52, minWidth: 64,
                          WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        <span className="font-medium tracking-wide">{LENGTH_META[opt].label}</span>
                        <span className="mt-0.5 text-[10px] opacity-60">{LENGTH_META[opt].desc}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <button onClick={beginWithCountdown}
                className="px-8 py-3 rounded-full text-white/70 text-sm font-light tracking-wider touch-manipulation"
                style={{
                  border: "1px solid rgba(249,115,22,0.25)",
                  background: "rgba(249,115,22,0.1)",
                  minHeight: 44,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {isResume ? "Continue" : "Begin conversation"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Countdown */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              className="mt-8 flex flex-col items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={countdown}
                  className="text-8xl font-extralight tabular-nums select-none"
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    textShadow: "0 0 60px rgba(249,115,22,0.6), 0 0 20px rgba(249,115,22,0.4)",
                  }}
                  initial={{ opacity: 0, scale: 1.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  {countdown}
                </motion.span>
              </AnimatePresence>
              <motion.p
                className="text-xs text-white/30 tracking-[0.3em] uppercase"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                Get ready...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status label */}
        <AnimatePresence>
          {audioUnlocked && (
            <motion.div className="mt-5 flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <StatusDot state={orbState} isListening={voice.state.isListening} />
              <span className="text-xs text-white/40 tracking-widest uppercase">
                {orbState === "listening" ? "Listening"
                  : orbState === "thinking" ? "Thinking"
                  : orbState === "speaking" ? "Speaking"
                  : inputMode === "text" ? "Type your answer"
                  : "Tap to speak"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>


        {/* AI response text */}
        <AnimatePresence mode="wait">
          {currentText && (
            <motion.div key={currentText.slice(0, 20)}
              className="mt-6 w-full max-w-xs sm:max-w-sm text-center px-2"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}
            >
              <p className="text-sm text-white/70 font-light leading-relaxed">{currentText}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice transcript */}
        <AnimatePresence>
          {voice.state.transcript && inputMode === "voice" && (
            <motion.div className="mt-3 w-full max-w-xs sm:max-w-sm text-center px-2"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <p className="text-xs text-white/30 font-light italic line-clamp-2">
                &ldquo;{voice.state.transcript}&rdquo;
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input controls */}
        <AnimatePresence>
          {hasStarted && (
            <motion.div
              className="mt-7 w-full max-w-xs sm:max-w-sm flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            >
              {inputMode === "voice" ? (
                <div className="flex items-center gap-3">
                  <motion.button
                    className="flex items-center gap-2 px-5 py-3 rounded-full glass text-xs text-white/60 touch-manipulation"
                    style={{
                      border: voice.state.isListening ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(255,255,255,0.08)",
                      boxShadow: voice.state.isListening ? "0 0 20px rgba(249,115,22,0.15)" : "none",
                      minHeight: 44, WebkitTapHighlightColor: "transparent",
                    }}
                    onClick={toggleListening} whileTap={{ scale: 0.95 }}
                  >
                    {voice.state.isListening
                      ? <Mic className="w-4 h-4" style={{ color: "#f97316" }} />
                      : <MicOff className="w-4 h-4 text-white/40" />}
                    <span>{voice.state.isListening ? "Listening..." : "Tap to speak"}</span>
                  </motion.button>
                  <button
                    onClick={() => { setExplorationMode(true); handleTranscript("I don't know"); }}
                    disabled={isProcessing}
                    className="px-3.5 py-2.5 rounded-full text-[11px] text-white/30 hover:text-white/55 transition-colors touch-manipulation disabled:opacity-0"
                    style={{ border: "1px solid rgba(255,255,255,0.07)", minHeight: 44, WebkitTapHighlightColor: "transparent" }}
                  >
                    I don&apos;t know
                  </button>
                  <button onClick={switchToText}
                    className="p-2.5 rounded-full glass text-white/30 hover:text-white/60 transition-colors touch-manipulation"
                    style={{ minHeight: 44, minWidth: 44, WebkitTapHighlightColor: "transparent" }}
                  >
                    <Keyboard className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <input ref={inputRef} type="text" value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your answer..."
                    disabled={isProcessing}
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all disabled:opacity-40"
                    style={{ minHeight: 44, borderColor: "rgba(255,255,255,0.1)" }}
                    autoComplete="off" autoCorrect="off" spellCheck={false}
                    onFocus={(e) => { e.target.style.borderColor = "rgba(249,115,22,0.5)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  />
                  <motion.button onClick={submitTyped}
                    disabled={!typedMessage.trim() || isProcessing}
                    className="p-3 rounded-full transition-all touch-manipulation shrink-0 disabled:opacity-30"
                    style={{
                      background: typedMessage.trim() && !isProcessing ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(249,115,22,0.3)",
                      minHeight: 44, minWidth: 44, WebkitTapHighlightColor: "transparent",
                    }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <Send className="w-4 h-4 text-white/70" />
                  </motion.button>
                  <button onClick={switchToVoice}
                    className="p-3 rounded-full glass text-white/30 hover:text-white/60 transition-colors touch-manipulation shrink-0"
                    style={{ minHeight: 44, minWidth: 44, WebkitTapHighlightColor: "transparent" }}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setExplorationMode(true); handleTranscript("I don't know"); }}
                    disabled={isProcessing}
                    className="px-3.5 py-2.5 rounded-full text-[11px] text-white/30 hover:text-white/55 transition-colors touch-manipulation shrink-0 disabled:opacity-0"
                    style={{ border: "1px solid rgba(255,255,255,0.07)", minHeight: 44, WebkitTapHighlightColor: "transparent" }}
                  >
                    I don&apos;t know
                  </button>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

        {voice.state.error && (
          <motion.p className="mt-3 text-xs text-red-400/70 max-w-[260px] text-center leading-relaxed"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {voice.state.error}
          </motion.p>
        )}

        {/* Reveal Ikigai button — always visible once conversation starts, dims below 20% */}
        <AnimatePresence>
          {hasStarted && (
            <motion.div
              className="mt-8 flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
            >
              <motion.button
                onClick={canReveal && !isProcessing ? handleCenterClick : undefined}
                className="relative flex items-center gap-3 px-7 py-3.5 rounded-full font-light text-sm tracking-wider touch-manipulation transition-all duration-700"
                style={{
                  background: canReveal
                    ? `rgba(249,115,22,${0.08 + glowT * 0.2})`
                    : "rgba(255,255,255,0.03)",
                  border: canReveal
                    ? `1px solid rgba(249,115,22,${0.2 + glowT * 0.5})`
                    : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: glowT > 0.1
                    ? `0 0 ${16 + glowT * 40}px rgba(249,115,22,${0.08 + glowT * 0.28})`
                    : "none",
                  color: canReveal ? `rgba(255,255,255,${0.5 + glowT * 0.45})` : "rgba(255,255,255,0.2)",
                  cursor: canReveal && !isProcessing ? "pointer" : "default",
                  minHeight: 48,
                  WebkitTapHighlightColor: "transparent",
                }}
                animate={mapIsReady ? { scale: [1, 1.025, 1] } : {}}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                whileTap={canReveal && !isProcessing ? { scale: 0.96 } : {}}
              >
                <span>Reveal Ikigai</span>
                {confidenceScore > 0 && (
                  <span
                    className="text-xs font-mono"
                    style={{ color: canReveal ? `rgba(249,115,22,${0.55 + glowT * 0.45})` : "rgba(255,255,255,0.15)" }}
                  >
                    {confidenceScore}%
                  </span>
                )}
              </motion.button>
              <p className="text-[10px] text-white/20 tracking-wider">
                {!canReveal ? "Keep sharing to build confidence" : mapIsReady ? "Your map is complete" : "Continue or reveal now"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ikigai Map pane */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            className="flex flex-col items-center w-full lg:w-auto lg:shrink-0 px-5 pb-10 pt-6 lg:pt-10 lg:pb-10 lg:pr-10 border-t border-white/[0.06] lg:border-t-0"
            initial={{ opacity: 0, y: isMobile ? 20 : 0, x: isMobile ? 0 : 40 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/25 mb-5">Your Ikigai Map</p>

            <IkigaiMap
              progress={ikigai.progress}
              insights={ikigai.insights}
              isComplete={ikigai.isComplete}
              size={mapSize}
            />

            {hasAnyProgress && (
              <motion.div className="mt-6 grid grid-cols-2 gap-2 w-full lg:max-w-[280px]"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              >
                {(["love", "good", "world", "paid"] as const).map((dim) => {
                  const p = ikigai.progress[dim];
                  const lastInsight = ikigai.insights[dim][ikigai.insights[dim].length - 1];
                  return (
                    <div key={dim} className="glass rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: DIM_COLORS[dim], opacity: p > 0 ? 1 : 0.3 }} />
                        <span className="text-[10px] text-white/45 leading-tight min-w-0 truncate">{DIM_LABELS[dim]}</span>
                      </div>
                      {lastInsight ? (
                        <p className="text-[9px] text-white/30 leading-relaxed line-clamp-2">{lastInsight}</p>
                      ) : (
                        <p className="text-[9px] text-white/15 italic">Not yet explored</p>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Synthesizing overlay — stays locked until navigation completes */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ background: "rgba(5,5,8,0.97)", backdropFilter: "blur(24px)" }}
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <AiOrb state="thinking" size={isMobile ? 120 : 160} />
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.p
                key={synthesisStageIdx}
                className="mt-10 text-white/55 font-light tracking-wide text-sm text-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.7 }}
              >
                {SYNTHESIS_STAGES[synthesisStageIdx]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function StatusDot({ state, isListening }: { state: OrbState; isListening: boolean }) {
  const color =
    state === "listening" ? "#f97316"
    : state === "thinking" ? "#06b6d4"
    : state === "speaking" ? "#14b8a6"
    : "rgba(255,255,255,0.2)";

  return (
    <motion.div className="w-1.5 h-1.5 rounded-full shrink-0"
      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      animate={isListening ? { scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] } : {}}
      transition={{ duration: 1, repeat: Infinity }}
    />
  );
}
