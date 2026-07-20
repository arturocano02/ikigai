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
  love:        { title: "What You Love",            color: "#e8845a", subtitle: "Your passion source" },
  skill:       { title: "What You're Good At",      color: "#4ecdc4", subtitle: "Your natural strengths" },
  world:       { title: "What The World Needs",     color: "#9b6dff", subtitle: "Your contribution" },
  paid:        { title: "What You Can Be Paid For", color: "#f5c842", subtitle: "Your market value" },
  passion:     { title: "Passion",                  color: "#f472b6", subtitle: "Love × Skill" },
  mission:     { title: "Mission",                  color: "#c084fc", subtitle: "Love × World" },
  profession:  { title: "Profession",               color: "#22d3ee", subtitle: "Skill × Paid" },
  vocation:    { title: "Vocation",                 color: "#fbbf24", subtitle: "World × Paid" },
  ikigai:      { title: "Your Ikigai",              color: "#d4a017", subtitle: "Where all four meet" },
};

// SVG viewBox: 0 0 480 480, circles r=110
// Exclusive area hit zones (% of container width/height)
const CIRCLE_HITS: { key: PopupKey; cx: number; cy: number }[] = [
  { key: "love",  cx: 170, cy: 170 }, // top-left circle
  { key: "skill", cx: 310, cy: 170 }, // top-right circle
  { key: "world", cx: 170, cy: 310 }, // bottom-left circle
  { key: "paid",  cx: 310, cy: 310 }, // bottom-right circle
];

const INTERSECTION_HITS: { key: PopupKey; cx: number; cy: number }[] = [
  { key: "passion",    cx: 240, cy: 148 }, // love∩skill — top middle
  { key: "mission",   cx: 148, cy: 240 }, // love∩world — left middle
  { key: "profession", cx: 332, cy: 240 }, // skill∩paid — right middle
  { key: "vocation",  cx: 240, cy: 332 }, // world∩paid — bottom middle
];

function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function VennDiagram({ quadrantItems, vennDetails }: VennDiagramProps) {
  const [activePopup, setActivePopup] = useState<PopupKey | null>(null);
  const [hovered, setHovered] = useState<PopupKey | null>(null);

  if (!quadrantItems) return null;

  const meta = activePopup ? POPUP_META[activePopup] : null;

  function toArr(v: unknown): string[] {
    if (Array.isArray(v)) return v as string[];
    if (typeof v === "string" && v.length) return [v];
    return [];
  }

  function getPopupItems(key: PopupKey): string[] {
    const vd = vennDetails?.[key];
    if (vd) { const arr = toArr(vd); if (arr.length) return arr; }
    const love  = toArr(quadrantItems?.love);
    const skill = toArr(quadrantItems?.skill);
    const world = toArr(quadrantItems?.world);
    const paid  = toArr(quadrantItems?.paid);
    if (key === "love")       return love;
    if (key === "skill")      return skill;
    if (key === "world")      return world;
    if (key === "paid")       return paid;
    if (key === "passion")    return [...love,  ...skill];
    if (key === "mission")    return [...love,  ...world];
    if (key === "profession") return [...skill, ...paid];
    if (key === "vocation")   return [...world, ...paid];
    if (key === "ikigai")     return [...love,  ...skill].slice(0, 4);
    return [];
  }

  const popupItems = activePopup ? getPopupItems(activePopup) : [];

  return (
    <div className="relative w-full select-none">
      {/* Diagram container */}
      <div className="relative w-full" style={{ maxWidth: 480, margin: "0 auto" }}>
        <svg
          viewBox="0 0 480 480"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", display: "block", pointerEvents: "none" }}
          aria-hidden="true"
        >
          <defs>
            {(["love", "skill", "world", "paid"] as const).map((k) => (
              <radialGradient key={k} id={`grad-${k}`} cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor={CIRCLE_COLORS[k]} stopOpacity={0.28} />
                <stop offset="100%" stopColor={CIRCLE_COLORS[k]} stopOpacity={0.08} />
              </radialGradient>
            ))}
          </defs>

          {/* Circle fills */}
          <circle cx={170} cy={170} r={110} fill="url(#grad-love)"  stroke="#e8845a" strokeWidth={1.4} strokeOpacity={0.5} />
          <circle cx={310} cy={170} r={110} fill="url(#grad-skill)" stroke="#4ecdc4" strokeWidth={1.4} strokeOpacity={0.5} />
          <circle cx={170} cy={310} r={110} fill="url(#grad-world)" stroke="#9b6dff" strokeWidth={1.4} strokeOpacity={0.5} />
          <circle cx={310} cy={310} r={110} fill="url(#grad-paid)"  stroke="#f5c842" strokeWidth={1.4} strokeOpacity={0.5} />

          {/* Hover highlight rings */}
          {hovered === "love"  && <circle cx={170} cy={170} r={113} fill="none" stroke="#e8845a" strokeWidth={3} strokeOpacity={0.45} />}
          {hovered === "skill" && <circle cx={310} cy={170} r={113} fill="none" stroke="#4ecdc4" strokeWidth={3} strokeOpacity={0.45} />}
          {hovered === "world" && <circle cx={170} cy={310} r={113} fill="none" stroke="#9b6dff" strokeWidth={3} strokeOpacity={0.45} />}
          {hovered === "paid"  && <circle cx={310} cy={310} r={113} fill="none" stroke="#f5c842" strokeWidth={3} strokeOpacity={0.45} />}

          {/* Subtle glow rings */}
          <circle cx={170} cy={170} r={115} fill="none" stroke="#e8845a" strokeWidth={5} strokeOpacity={0.06} />
          <circle cx={310} cy={170} r={115} fill="none" stroke="#4ecdc4" strokeWidth={5} strokeOpacity={0.06} />
          <circle cx={170} cy={310} r={115} fill="none" stroke="#9b6dff" strokeWidth={5} strokeOpacity={0.06} />
          <circle cx={310} cy={310} r={115} fill="none" stroke="#f5c842" strokeWidth={5} strokeOpacity={0.06} />

          {/* Labels outside circles, items inside the exclusive (non-overlapping) top/bottom zone */}
          {/* LOVE — label above, items inside upper-left exclusive zone (y≈95-110, clear of edge + overlap) */}
          <text x={170} y={48} textAnchor="middle" fontSize={9.5} fill="#e8845a" fillOpacity={0.9} fontWeight="700" letterSpacing="0.12em" fontFamily="system-ui,sans-serif">LOVE</text>
          {toArr(quadrantItems.love).slice(0, 2).map((item, i) => (
            <text key={i} x={170} y={95 + i * 16} textAnchor="middle" fontSize={7.5} fill="white" fillOpacity={0.65} fontFamily="system-ui,sans-serif">{trunc(item, 18)}</text>
          ))}

          {/* SKILL — label above, items inside upper-right exclusive zone */}
          <text x={310} y={48} textAnchor="middle" fontSize={9.5} fill="#4ecdc4" fillOpacity={0.9} fontWeight="700" letterSpacing="0.12em" fontFamily="system-ui,sans-serif">SKILL</text>
          {toArr(quadrantItems.skill).slice(0, 2).map((item, i) => (
            <text key={i} x={310} y={95 + i * 16} textAnchor="middle" fontSize={7.5} fill="white" fillOpacity={0.65} fontFamily="system-ui,sans-serif">{trunc(item, 18)}</text>
          ))}

          {/* WORLD — items inside lower-left exclusive zone, label below */}
          {toArr(quadrantItems.world).slice(0, 2).map((item, i) => (
            <text key={i} x={170} y={374 + i * 16} textAnchor="middle" fontSize={7.5} fill="white" fillOpacity={0.65} fontFamily="system-ui,sans-serif">{trunc(item, 18)}</text>
          ))}
          <text x={170} y={432} textAnchor="middle" fontSize={9.5} fill="#9b6dff" fillOpacity={0.9} fontWeight="700" letterSpacing="0.12em" fontFamily="system-ui,sans-serif">WORLD</text>

          {/* VALUE — items inside lower-right exclusive zone, label below */}
          {toArr(quadrantItems.paid).slice(0, 2).map((item, i) => (
            <text key={i} x={310} y={374 + i * 16} textAnchor="middle" fontSize={7.5} fill="white" fillOpacity={0.65} fontFamily="system-ui,sans-serif">{trunc(item, 18)}</text>
          ))}
          <text x={310} y={432} textAnchor="middle" fontSize={9.5} fill="#f5c842" fillOpacity={0.9} fontWeight="700" letterSpacing="0.12em" fontFamily="system-ui,sans-serif">VALUE</text>

          {/* Intersection label hints — slightly visible so users know they're tappable */}
          <text x={240} y={151} textAnchor="middle" fontSize={7} fill="white" fillOpacity={hovered === "passion" ? 0.75 : 0.32} fontFamily="system-ui,sans-serif" letterSpacing="0.06em">PASSION</text>
          <text x={149} y={244} textAnchor="middle" fontSize={7} fill="white" fillOpacity={hovered === "mission" ? 0.75 : 0.32} fontFamily="system-ui,sans-serif" letterSpacing="0.06em">MISSION</text>
          <text x={331} y={244} textAnchor="middle" fontSize={6} fill="white" fillOpacity={hovered === "profession" ? 0.75 : 0.32} fontFamily="system-ui,sans-serif" letterSpacing="0.04em">PROFESSION</text>
          <text x={240} y={337} textAnchor="middle" fontSize={7} fill="white" fillOpacity={hovered === "vocation" ? 0.75 : 0.32} fontFamily="system-ui,sans-serif" letterSpacing="0.06em">VOCATION</text>

          {/* Center IKIGAI ring — text inside the ring */}
          <circle cx={240} cy={240} r={26} fill="rgba(212,160,23,0.14)" stroke="rgba(212,160,23,0.45)" strokeWidth={1.2} />
          <text x={240} y={244} textAnchor="middle" fontSize={7} fill="#d4a017" fillOpacity={0.85} fontFamily="system-ui,sans-serif" fontWeight="700" letterSpacing="0.1em">IKIGAI</text>
        </svg>

        {/* Full-coverage clickable SVG overlay — one path per region */}
        <svg
          viewBox="0 0 480 480"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          aria-hidden="true"
        >
          {/* Circle hit zones — large circles */}
          {CIRCLE_HITS.map(({ key, cx, cy }) => (
            <circle
              key={key}
              cx={cx} cy={cy} r={90}
              fill="rgba(0,0,0,0.001)"
              style={{ cursor: "pointer" }}
              onClick={() => setActivePopup(key)}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={() => setHovered(key)}
              onTouchEnd={() => setHovered(null)}
            />
          ))}

          {/* Intersection hit zones */}
          {INTERSECTION_HITS.map(({ key, cx, cy }) => (
            <circle
              key={key}
              cx={cx} cy={cy} r={32}
              fill="rgba(0,0,0,0.001)"
              style={{ cursor: "pointer" }}
              onClick={() => setActivePopup(key)}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={() => setHovered(key)}
              onTouchEnd={() => setHovered(null)}
            />
          ))}

          {/* Center IKIGAI hit zone */}
          <circle
            cx={240} cy={240} r={28}
            fill="rgba(0,0,0,0.001)"
            style={{ cursor: "pointer" }}
            onClick={() => setActivePopup("ikigai")}
            onMouseEnter={() => setHovered("ikigai")}
            onMouseLeave={() => setHovered(null)}
            onTouchStart={() => setHovered("ikigai")}
            onTouchEnd={() => setHovered(null)}
          />
        </svg>
      </div>

      {/* Tap hint */}
      <p className="text-center text-[10px] text-white/22 tracking-[0.25em] uppercase mt-2 font-light">
        Tap any area to explore
      </p>

      {/* POPUP MODAL */}
      <AnimatePresence>
        {activePopup && meta && (
          <>
            {/* Backdrop — no blur to avoid iOS Safari WebKit crash on fixed elements */}
            <motion.div
              className="fixed inset-0 z-[60]"
              style={{ background: "rgba(4,4,14,0.82)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setActivePopup(null)}
            />

            {/* Dialog — centered with flexbox, no transform animation conflicts */}
            <div
              className="fixed inset-0 z-[61] flex items-center justify-center px-4"
              onClick={() => setActivePopup(null)}
            >
              <motion.div
                className="w-full rounded-3xl"
                style={{
                  overflow: "hidden",
                  maxWidth: 420,
                  background: "linear-gradient(160deg, #13121e 0%, #0c0b16 100%)",
                  border: `1px solid ${meta.color}35`,
                  boxShadow: `0 0 60px ${meta.color}18, 0 24px 56px rgba(0,0,0,0.6)`,
                  maxHeight: "80vh",
                }}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.93 }}
                transition={{ type: "spring", damping: 26, stiffness: 380 }}
              >
                {/* Accent bar */}
                <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, ${meta.color}, ${meta.color}00)` }} />

                {/* Header */}
                <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] tracking-[0.3em] uppercase font-medium mb-1" style={{ color: meta.color, opacity: 0.75 }}>
                      {meta.subtitle}
                    </p>
                    <h3 className="text-[22px] font-semibold leading-tight text-white/92">
                      {meta.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActivePopup(null)}
                    className="shrink-0 mt-0.5 w-9 h-9 rounded-full flex items-center justify-center touch-manipulation"
                    style={{ background: "rgba(255,255,255,0.07)", WebkitTapHighlightColor: "transparent" }}
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-white/50" />
                  </button>
                </div>

                <div className="mx-6 mb-4 h-px" style={{ background: `linear-gradient(to right, ${meta.color}45, transparent)` }} />

                {/* Content */}
                <div className="px-6 pb-7 overflow-y-auto" style={{ maxHeight: "calc(80vh - 110px)" }}>
                  {popupItems.length > 0 ? (
                    <ul className="space-y-3.5">
                      {popupItems.map((item, i) => (
                        <motion.li
                          key={i}
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.22 }}
                        >
                          <span
                            className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: meta.color, boxShadow: `0 0 5px ${meta.color}` }}
                          />
                          <span className="text-[14px] text-white/72 font-light leading-relaxed">{item}</span>
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
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
