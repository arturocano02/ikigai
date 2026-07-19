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
  const orbSize = useResponsiveSize(148, 200);

  function handleBegin() {
    setStarting(true);
    setTimeout(() => router.push("/conversation"), 1100);
  }

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden">
      <BackgroundField />

      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#04040e] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#04040e] to-transparent z-10" />

      <AnimatePresence>
        {!starting && (
          <motion.div
            className="flex flex-col items-center gap-7 sm:gap-9 z-20 px-6 w-full max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            {/* Orb */}
            <motion.div
              initial={{ opacity: 0, scale: 0.45, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.1, ease: [0.34, 1.56, 0.64, 1] }}
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
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.85, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white text-glow-soft">
                Find your{" "}
                <span
                  className="font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 40%, #ec4899 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  purpose.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-white/38 font-light leading-relaxed max-w-[280px] sm:max-w-xs mx-auto">
                A voice conversation that helps you understand what you&apos;re truly meant to do.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.82, duration: 0.6 }}
              className="flex flex-col items-center gap-3 w-full"
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
                    ? "rgba(139, 92, 246, 0.22)"
                    : "rgba(255, 255, 255, 0.05)",
                  border: hovering
                    ? "1px solid rgba(139, 92, 246, 0.55)"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: hovering
                    ? "0 0 32px rgba(139,92,246,0.28), inset 0 0 24px rgba(139,92,246,0.08)"
                    : "none",
                  WebkitTapHighlightColor: "transparent",
                  minHeight: 52,
                }}
              >
                <span className="relative z-10 tracking-[0.28em]">Begin</span>
                {hovering && (
                  <motion.div
                    className="absolute inset-0 shimmer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </button>

              <p className="text-[10px] sm:text-xs text-white/18 tracking-widest uppercase text-center">
                Voice conversation &middot; Free to start
              </p>
            </motion.div>

            {/* Dimension dots */}
            <motion.div
              className="flex gap-6 sm:gap-7"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 1 }}
            >
              {[
                { label: "Love", color: "#f43f5e" },
                { label: "Skill", color: "#10b981" },
                { label: "World", color: "#22d3ee" },
                { label: "Value", color: "#a78bfa" },
              ].map((d) => (
                <div key={d.label} className="flex flex-col items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: d.color, boxShadow: `0 0 8px ${d.color}80` }}
                  />
                  <span className="text-[9px] sm:text-[10px] text-white/22 tracking-widest uppercase">
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
                  "radial-gradient(circle, rgba(139,92,246,0.9) 0%, rgba(236,72,153,0.5) 40%, transparent 70%)",
              }}
              initial={{ width: orbSize, height: orbSize }}
              animate={{ width: "200vmax", height: "200vmax" }}
              transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function BackgroundField() {
  const dots = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    x: 5 + (i * 97) % 90,
    y: 5 + (i * 61) % 90,
    size: 0.6 + (i % 4) * 0.45,
    delay: (i % 6) * 0.7,
    duration: 3 + (i % 4),
    colorIdx: i % 3,
  }));

  const colors = [
    "rgba(139, 92, 246, 0.4)",
    "rgba(236, 72, 153, 0.3)",
    "rgba(34, 211, 238, 0.25)",
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Ambient blobs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full -top-32 -left-32 opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full -bottom-20 -right-20 opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(236,72,153,0.45) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
      {/* Particles */}
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            background: colors[dot.colorIdx],
          }}
          animate={{ opacity: [0, 0.65, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: dot.duration, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
