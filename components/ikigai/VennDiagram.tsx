"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface VennDiagramProps {
  quadrantItems?: {
    love: string[];
    skill: string[];
    world: string[];
    paid: string[];
  };
  vennDetails?: {
    love: string[];
    skill: string[];
    world: string[];
    paid: string[];
    passion: string[];
    mission: string[];
    profession: string[];
    vocation: string[];
    ikigai: string[];
  } | null;
}

type PopupKey = "love" | "skill" | "world" | "paid" | "passion" | "mission" | "profession" | "vocation" | "ikigai";

const CIRCLE_COLORS: Record<string, string> = {
  love: "#e8845a",
  skill: "#4ecdc4",
  world: "#9b6dff",
  paid: "#f5c842",
};

const POPUP_META: Record<PopupKey, { title: string; color: string; subtitle: string }> = {
  love:       { title: "What You Love",           color: "#e8845a", subtitle: "Your passion source" },
  skill:      { title: "What You're Good At",     color: "#4ecdc4", subtitle: "Your natural strengths" },
  world:      { title: "What The World Needs",    color: "#9b6dff", subtitle: "Your contribution" },
  paid:       { title: "What You Can Be Paid For",color: "#f5c842", subtitle: "Your market value" },
  passion:    { title: "Passion",                 color: "#f472b6", subtitle: "Love × Skill" },
  mission:    { title: "Mission",                 color: "#c084fc", subtitle: "Love × World" },
  profession: { title: "Profession",              color: "#22d3ee", subtitle: "Skill × Paid" },
  vocation:   { title: "Vocation",                color: "#fbbf24", subtitle: "World × Paid" },
  ikigai:     { title: "Your Ikigai",             color: "#fb923c", subtitle: "Where all four meet" },
};

// SVG viewBox: 0 0 480 480
// Circles r=110, centers: Love(170,170) Skill(310,170) World(170,310) Paid(310,310)
// All 4 circles contain center (240,240): dist = 70√2 ≈ 99 < 110

// Hit area positions as % of the container div (matches SVG coordinate space)
const CIRCLE_HITS: { key: PopupKey; left: string; top: string }[] = [
  { key: "love",  left: "35.4%", top: "19.8%" },   // (170, 95) — exclusive Love area
  { key: "skill", left: "64.6%", top: "19.8%" },   // (310, 95) — exclusive Skill area
  { key: "world", left: "35.4%", top: "80.2%" },   // (170, 385) — exclusive World area
  { key: "paid",  left: "64.6%", top: "80.2%" },   // (310, 385) — exclusive Paid area
];

const INTERSECTION_HITS: { key: PopupKey; left: string; top: string }[] = [
  { key: "passion",    left: "50%",   top: "31.3%" }, // (240, 150) — Love∩Skill
  { key: "mission",   left: "31.3%", top: "50%" },   // (150, 240) — Love∩World
  { key: "profession",left: "68.8%", top: "50%" },   // (330, 240) — Skill∩Paid
  { key: "vocation",  left: "50%",   top: "68.8%" }, // (240, 330) — World∩Paid
];

export function VennDiagram({ quadrantItems, vennDetails }: VennDiagramProps) {
  const [activePopup, setActivePopup] = useState<PopupKey | null>(null);

  if (!quadrantItems) return null;

  const meta = activePopup ? POPUP_META[activePopup] : null;

  function getPopupItems(key: PopupKey): string[] {
    if (vennDetails && vennDetails[key]?.length) return vennDetails[key];
    // Fallback for circles: use quadrantItems
    if (key === "love")  return quadrantItems?.love  ?? [];
    if (key === "skill") return quadrantItems?.skill ?? [];
    if (key === "world") return quadrantItems?.world ?? [];
    if (key === "paid")  return quadrantItems?.paid  ?? [];
    return [];
  }

  const popupItems = activePopup ? getPopupItems(activePopup) : [];

  function trunc(s: string, n: number) {
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  return (
    <div className="relative w-full select-none">
      {/* Hint */}
      <p className="text-center text-[10px] text-white/25 tracking-[0.25em] uppercase mb-3 font-light">
        Tap any area to explore
      </p>

      {/* Diagram + overlay buttons */}
      <div className="relative w-full" style={{ maxWidth: 480, margin: "0 auto" }}>
        <svg
          viewBox="0 0 480 480"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", display: "block" }}
          aria-hidden="true"
        >
          {/* Defs: radial gradients for each circle */}
          <defs>
            {(["love", "skill", "world", "paid"] as const).map((k) => (
              <radialGradient key={k} id={`grad-${k}`} cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor={CIRCLE_COLORS[k]} stopOpacity={0.22} />
                <stop offset="100%" stopColor={CIRCLE_COLORS[k]} stopOpacity={0.07} />
              </radialGradient>
            ))}
          </defs>

          {/* Circle fills — Love TL, Skill TR, World BL, Paid BR */}
          <circle cx={170} cy={170} r={110} fill="url(#grad-love)"  stroke="#e8845a" strokeWidth={1.2} strokeOpacity={0.45} />
          <circle cx={310} cy={170} r={110} fill="url(#grad-skill)" stroke="#4ecdc4" strokeWidth={1.2} strokeOpacity={0.45} />
          <circle cx={170} cy={310} r={110} fill="url(#grad-world)" stroke="#9b6dff" strokeWidth={1.2} strokeOpacity={0.45} />
          <circle cx={310} cy={310} r={110} fill="url(#grad-paid)"  stroke="#f5c842" strokeWidth={1.2} strokeOpacity={0.45} />

          {/* Glow rings (larger, very faint) */}
          <circle cx={170} cy={170} r={114} fill="none" stroke="#e8845a" strokeWidth={4} strokeOpacity={0.06} />
          <circle cx={310} cy={170} r={114} fill="none" stroke="#4ecdc4" strokeWidth={4} strokeOpacity={0.06} />
          <circle cx={170} cy={310} r={114} fill="none" stroke="#9b6dff" strokeWidth={4} strokeOpacity={0.06} />
          <circle cx={310} cy={310} r={114} fill="none" stroke="#f5c842" strokeWidth={4} strokeOpacity={0.06} />

          {/* Category labels — inside each circle's exclusive top/bottom area */}
          {/* Love */}
          <text x={170} y={76} textAnchor="middle" fontSize={8} fill="#e8845a" fillOpacity={0.75} fontWeight="700" letterSpacing="0.1em" fontFamily="system-ui,sans-serif">LOVE</text>
          {quadrantItems.love.slice(0, 2).map((item, i) => (
            <text key={i} x={170} y={89 + i * 10} textAnchor="middle" fontSize={6.2} fill="white" fillOpacity={0.32} fontFamily="system-ui,sans-serif">
              {trunc(item, 20)}
            </text>
          ))}

          {/* Skill */}
          <text x={310} y={76} textAnchor="middle" fontSize={8} fill="#4ecdc4" fillOpacity={0.75} fontWeight="700" letterSpacing="0.1em" fontFamily="system-ui,sans-serif">SKILL</text>
          {quadrantItems.skill.slice(0, 2).map((item, i) => (
            <text key={i} x={310} y={89 + i * 10} textAnchor="middle" fontSize={6.2} fill="white" fillOpacity={0.32} fontFamily="system-ui,sans-serif">
              {trunc(item, 20)}
            </text>
          ))}

          {/* World */}
          <text x={170} y={410} textAnchor="middle" fontSize={8} fill="#9b6dff" fillOpacity={0.75} fontWeight="700" letterSpacing="0.1em" fontFamily="system-ui,sans-serif">WORLD</text>
          {quadrantItems.world.slice(0, 2).map((item, i) => (
            <text key={i} x={170} y={420 + i * 10} textAnchor="middle" fontSize={6.2} fill="white" fillOpacity={0.32} fontFamily="system-ui,sans-serif">
              {trunc(item, 20)}
            </text>
          ))}

          {/* Paid */}
          <text x={310} y={410} textAnchor="middle" fontSize={8} fill="#f5c842" fillOpacity={0.75} fontWeight="700" letterSpacing="0.1em" fontFamily="system-ui,sans-serif">VALUE</text>
          {quadrantItems.paid.slice(0, 2).map((item, i) => (
            <text key={i} x={310} y={420 + i * 10} textAnchor="middle" fontSize={6.2} fill="white" fillOpacity={0.32} fontFamily="system-ui,sans-serif">
              {trunc(item, 20)}
            </text>
          ))}

          {/* Intersection labels */}
          <text x={240} y={147} textAnchor="middle" fontSize={6.5} fill="white" fillOpacity={0.28} letterSpacing="0.14em" fontFamily="system-ui,sans-serif">PASSION</text>
          <text x={148} y={244} textAnchor="middle" fontSize={6.5} fill="white" fillOpacity={0.28} letterSpacing="0.14em" fontFamily="system-ui,sans-serif">MISSION</text>
          <text x={332} y={244} textAnchor="middle" fontSize={6.2} fill="white" fillOpacity={0.28} letterSpacing="0.1em" fontFamily="system-ui,sans-serif">PROFESSION</text>
          <text x={240} y={341} textAnchor="middle" fontSize={6.5} fill="white" fillOpacity={0.28} letterSpacing="0.14em" fontFamily="system-ui,sans-serif">VOCATION</text>

          {/* Center IKIGAI */}
          <circle cx={240} cy={240} r={26} fill="rgba(249,115,22,0.08)" stroke="rgba(249,115,22,0.22)" strokeWidth={1} />
          <text x={240} y={237} textAnchor="middle" fontSize={8} fill="white" fillOpacity={0.8} letterSpacing="0.2em" fontWeight="600" fontFamily="system-ui,sans-serif">IKIGAI</text>
          <text x={240} y={249} textAnchor="middle" fontSize={5.5} fill="white" fillOpacity={0.3} letterSpacing="0.06em" fontFamily="system-ui,sans-serif">tap ↑</text>
        </svg>

        {/* Overlay hit buttons — circle exclusive areas */}
        {CIRCLE_HITS.map(({ key, left, top }) => (
          <button
            key={key}
            onClick={() => setActivePopup(key)}
            aria-label={POPUP_META[key].title}
            style={{
              position: "absolute", left, top,
              transform: "translate(-50%, -50%)",
              width: 60, height: 60,
              background: "transparent", border: "none",
              cursor: "pointer", WebkitTapHighlightColor: "transparent",
            }}
          />
        ))}

        {/* Overlay hit buttons — intersections */}
        {INTERSECTION_HITS.map(({ key, left, top }) => (
          <button
            key={key}
            onClick={() => setActivePopup(key)}
            aria-label={POPUP_META[key].title}
            style={{
              position: "absolute", left, top,
              transform: "translate(-50%, -50%)",
              width: 60, height: 60,
              background: "transparent", border: "none",
              cursor: "pointer", WebkitTapHighlightColor: "transparent",
            }}
          />
        ))}

        {/* Center IKIGAI hit button */}
        <button
          onClick={() => setActivePopup("ikigai")}
          aria-label="Your Ikigai"
          style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            width: 64, height: 64,
            background: "transparent", border: "none",
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
          }}
        />
      </div>

      {/* Bottom-sheet popup */}
      <AnimatePresence>
        {activePopup && meta && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActivePopup(null)}
            />

            {/* Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #0f0f1c 0%, #0a0a14 100%)",
                borderTop: `1px solid ${meta.color}28`,
                borderLeft: "1px solid rgba(255,255,255,0.06)",
                borderRight: "1px solid rgba(255,255,255,0.06)",
                maxHeight: "72vh",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
              </div>

              {/* Accent bar */}
              <div className="mx-5 mb-4 mt-2 h-px" style={{ background: `linear-gradient(to right, ${meta.color}55, transparent)` }} />

              {/* Header */}
              <div className="px-5 pb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] tracking-[0.3em] uppercase font-medium mb-1" style={{ color: meta.color, opacity: 0.7 }}>
                    {meta.subtitle}
                  </p>
                  <h3 className="text-[22px] font-semibold leading-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
                    {meta.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActivePopup(null)}
                  className="shrink-0 mt-0.5 w-9 h-9 rounded-full flex items-center justify-center touch-manipulation"
                  style={{ background: "rgba(255,255,255,0.07)", WebkitTapHighlightColor: "transparent" }}
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white/45" />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 pb-10 overflow-y-auto" style={{ maxHeight: "calc(72vh - 130px)" }}>
                {popupItems.length > 0 ? (
                  <ul className="space-y-3.5">
                    {popupItems.map((item, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.055 }}
                      >
                        <span
                          className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: meta.color, boxShadow: `0 0 5px ${meta.color}` }}
                        />
                        <span className="text-[14px] text-white/68 font-light leading-relaxed">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-white/30 font-light italic">
                    Complete your conversation to unlock insights here.
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
