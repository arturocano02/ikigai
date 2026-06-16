"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { AiOrb } from "@/components/orb/AiOrb";
import { useResponsiveSize } from "@/lib/useResponsiveSize";

export default function LandingPage() {
  const router = useRouter();
  const [hovering, setHovering] = useState(false);
  const [starting, setStarting] = useState(false);
  const orbSize = useResponsiveSize(160, 220);

  function handleBegin() {
    setStarting(true);
    setTimeout(() => router.push("/conversation"), 1200);
  }

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden">
      <BackgroundParticles />

      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#050508] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050508] to-transparent z-10" />

      <AnimatePresence>
        {!starting && (
          <motion.div
            className="flex flex-col items-center gap-8 sm:gap-10 z-20 px-6 w-full max-w-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {/* Orb */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <AiOrb
                state={hovering ? "listening" : "idle"}
                size={orbSize}
                onClick={handleBegin}
              />
            </motion.div>

            {/* Tagline */}
            <motion.div
              className="text-center space-y-3 sm:space-y-4 w-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white text-glow-soft">
                Find your{" "}
                <span
                  className="font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #fb923c, #f97316, #14b8a6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  purpose.
                </span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-white/40 font-light leading-relaxed">
                A conversation that helps you understand
                <br className="hidden sm:block" />
                {" "}what you&apos;re truly meant to do.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="flex flex-col items-center gap-3 sm:gap-4 w-full"
            >
              <button
                onClick={handleBegin}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
                onTouchStart={() => setHovering(true)}
                onTouchEnd={() => setHovering(false)}
                className="relative px-10 py-4 rounded-full text-white font-light text-sm tracking-widest uppercase overflow-hidden transition-all duration-300 w-full max-w-[200px] touch-manipulation"
                style={{
                  background: hovering
                    ? "rgba(249, 115, 22, 0.22)"
                    : "rgba(255, 255, 255, 0.05)",
                  border: hovering
                    ? "1px solid rgba(249, 115, 22, 0.55)"
                    : "1px solid rgba(255, 255, 255, 0.12)",
                  boxShadow: hovering
                    ? "0 0 30px rgba(249,115,22,0.28), inset 0 0 30px rgba(249,115,22,0.08)"
                    : "none",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span className="relative z-10 tracking-[0.3em]">Begin</span>
                {hovering && (
                  <motion.div
                    className="absolute inset-0 shimmer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </button>

              <p className="text-[10px] sm:text-xs text-white/20 tracking-widest uppercase text-center">
                Voice conversation &middot; Free to start
              </p>
            </motion.div>

            {/* Dimension dots */}
            <motion.div
              className="flex gap-5 sm:gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
            >
              {[
                { label: "Love", color: "#f43f5e" },
                { label: "Skill", color: "#10b981" },
                { label: "World", color: "#06b6d4" },
                { label: "Value", color: "#f59e0b" },
              ].map((d) => (
                <div key={d.label} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: d.color, boxShadow: `0 0 8px ${d.color}` }}
                  />
                  <span className="text-[9px] sm:text-[10px] text-white/25 tracking-widest uppercase">
                    {d.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic transition */}
      <AnimatePresence>
        {starting && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(249,115,22,0.9) 0%, rgba(20,184,166,0.5) 40%, transparent 70%)",
              }}
              initial={{ width: orbSize, height: orbSize }}
              animate={{ width: "200vmax", height: "200vmax" }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function BackgroundParticles() {
  const dots = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: 5 + (i * 97) % 90,
    y: 5 + (i * 61) % 90,
    size: 0.5 + (i % 4) * 0.5,
    delay: (i % 5) * 0.8,
    duration: 3 + (i % 4),
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            background: "rgba(249, 115, 22, 0.35)",
          }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: dot.duration, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
