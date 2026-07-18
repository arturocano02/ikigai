"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const DIMS = [
  { label: "Love", color: "#f43f5e", desc: "What excites you" },
  { label: "Skill", color: "#10b981", desc: "What you're good at" },
  { label: "World", color: "#06b6d4", desc: "What others need" },
  { label: "Value", color: "#f59e0b", desc: "What you can earn from" },
];

const STEPS = [
  {
    num: "1",
    title: "Have a conversation",
    body: "Answer honestly. Even rough answers work. No right or wrong.",
  },
  {
    num: "2",
    title: "Watch your map build",
    body: "Your Ikigai diagram fills in as you talk, in real time.",
  },
  {
    num: "3",
    title: "Tap “I don’t know”",
    body: "If you're stuck, the AI explores from a different angle until something clicks.",
  },
  {
    num: "4",
    title: "Reveal your Ikigai",
    body: "Get a full written analysis: your purpose, strengths, and path forward.",
  },
];

export default function InfoButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center rounded-full text-white/35 hover:text-white/65 transition-colors touch-manipulation"
        style={{
          width: 32,
          height: 32,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
          WebkitTapHighlightColor: "transparent",
          fontSize: 13,
          fontWeight: 500,
          fontStyle: "italic",
          fontFamily: "Georgia, serif",
        }}
        aria-label="How it works"
      >
        i
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center px-3 pb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)" }}
            />

            <motion.div
              className="relative w-full max-w-sm rounded-2xl overflow-hidden"
              style={{
                background: "rgba(10,10,14,0.98)",
                border: "1px solid rgba(255,255,255,0.09)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
              }}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.34, 1.2, 0.64, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <button
                  onClick={() => setOpen(false)}
                  className="absolute top-4 right-4 text-white/25 hover:text-white/55 transition-colors touch-manipulation"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase mb-1">What is</p>
                <h2 className="text-white/90 font-light text-xl tracking-wide">Ikigai</h2>
                <p className="text-xs text-white/40 font-light mt-0.5">Japanese concept, <em>reason for being</em></p>
              </div>

              {/* 4 circles */}
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] text-white/25 tracking-widest uppercase mb-3">The four areas</p>
                <div className="grid grid-cols-4 gap-2">
                  {DIMS.map((d) => (
                    <div key={d.label} className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: `${d.color}18`, border: `1px solid ${d.color}40` }}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      </div>
                      <span className="text-[10px] font-medium text-white/70 tracking-wide">{d.label}</span>
                      <span className="text-[9px] text-white/30 text-center leading-tight">{d.desc}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-center">
                  <span className="text-[10px] text-white/25">Where all four overlap → </span>
                  <span
                    className="text-[10px] font-medium"
                    style={{ background: "linear-gradient(90deg,#fb923c,#14b8a6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                  >
                    your purpose
                  </span>
                </div>
              </div>

              {/* Steps */}
              <div className="px-5 py-4">
                <p className="text-[10px] text-white/25 tracking-widest uppercase mb-3">How it works</p>
                <div className="space-y-3">
                  {STEPS.map((s, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div
                        className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-medium mt-0.5"
                        style={{
                          background: "rgba(249,115,22,0.12)",
                          border: "1px solid rgba(249,115,22,0.3)",
                          color: "rgba(249,115,22,0.8)",
                        }}
                      >
                        {s.num}
                      </div>
                      <div>
                        <p className="text-xs text-white/75 font-medium leading-tight">{s.title}</p>
                        <p className="text-[11px] text-white/35 font-light leading-relaxed mt-0.5">{s.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer CTA */}
              <div className="px-5 pb-5">
                <button
                  onClick={() => setOpen(false)}
                  className="w-full py-3 rounded-xl text-sm text-white/70 font-light tracking-wide transition-all touch-manipulation"
                  style={{
                    border: "1px solid rgba(249,115,22,0.35)",
                    background: "rgba(249,115,22,0.1)",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
