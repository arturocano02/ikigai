"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DIMENSIONS, type IkigaiDimension } from "@/types/ikigai";

interface IkigaiMapProps {
  progress: Record<IkigaiDimension, number>;
  insights: Record<IkigaiDimension, string[]>;
  isComplete?: boolean;
  isReady?: boolean;          // AI has enough info — center becomes clickable
  onCenterClick?: () => void; // triggered when user clicks the center
  ikigaiTitle?: string | null;
  size?: number;
  className?: string;
}

const CIRCLE_CONFIG = {
  love:  { cx: 0.35, cy: 0.38, color: "#f43f5e", glow: "rgba(244, 63, 94, 0.35)" },
  good:  { cx: 0.65, cy: 0.38, color: "#10b981", glow: "rgba(16, 185, 129, 0.35)" },
  world: { cx: 0.35, cy: 0.62, color: "#06b6d4", glow: "rgba(6, 182, 212, 0.35)" },
  paid:  { cx: 0.65, cy: 0.62, color: "#f59e0b", glow: "rgba(245, 158, 11, 0.35)" },
} as const;

const RADIUS_RATIO = 0.22;

export function IkigaiMap({
  progress,
  insights: _insights,
  isComplete = false,
  isReady = false,
  onCenterClick,
  ikigaiTitle,
  size = 480,
  className = "",
}: IkigaiMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const progressRef = useRef(progress);
  const isReadyRef = useRef(isReady);
  progressRef.current = progress;
  isReadyRef.current = isReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const r = size * RADIUS_RATIO;

    function draw(ts: number) {
      if (!ctx) return;
      timeRef.current = ts * 0.001;
      const t = timeRef.current;
      const prog = progressRef.current;
      const ready = isReadyRef.current;

      ctx.clearRect(0, 0, size, size);

      const dims = Object.keys(CIRCLE_CONFIG) as IkigaiDimension[];

      // Base circles
      dims.forEach((key) => {
        const cfg = CIRCLE_CONFIG[key];
        const cx = cfg.cx * size;
        const cy = cfg.cy * size;
        const p = prog[key] / 100;

        if (p > 0) {
          ctx.save();
          ctx.shadowBlur = 20 + p * 30;
          ctx.shadowColor = cfg.glow;
          ctx.globalAlpha = 0.15 + p * 0.25;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = cfg.color;
          ctx.fill();
          ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = `${cfg.color}${Math.round((0.04 + p * 0.08) * 255).toString(16).padStart(2, "0")}`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `${cfg.color}${Math.round((0.2 + p * 0.4) * 255).toString(16).padStart(2, "0")}`;
        ctx.lineWidth = 1 + p * 1.5;
        ctx.stroke();
      });

      // Center intersection glow
      const minProg = Math.min(...dims.map((k) => prog[k])) / 100;
      if (minProg > 0.05) {
        const cx = size * 0.5;
        const cy = size * 0.5;

        // Extra pulse when ready to reveal
        const readyBoost = ready ? 1 + Math.sin(t * 3) * 0.18 : 1 + Math.sin(t * 2) * 0.05 * minProg;
        const glowRadius = r * 0.58 * readyBoost;

        ctx.save();
        ctx.shadowBlur = ready ? 60 + Math.sin(t * 3) * 20 : 40 * minProg;
        ctx.shadowColor = ready ? "rgba(249, 115, 22, 0.8)" : "rgba(255, 255, 255, 0.3)";

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        const alpha = minProg;

        if (isComplete || ready) {
          const intensity = ready ? 0.85 + Math.sin(t * 3) * 0.12 : 0.9;
          grad.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
          grad.addColorStop(0.3, `rgba(249, 115, 22, ${alpha * (ready ? 0.8 : 0.6)})`);
          grad.addColorStop(0.7, `rgba(20, 184, 166, ${alpha * 0.3})`);
          grad.addColorStop(1, "rgba(249, 115, 22, 0)");
        } else {
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.4})`);
          grad.addColorStop(0.5, `rgba(249, 115, 22, ${alpha * 0.18})`);
          grad.addColorStop(1, "rgba(20, 184, 166, 0)");
        }

        ctx.beginPath();
        ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      // Progress rings
      dims.forEach((key) => {
        const cfg = CIRCLE_CONFIG[key];
        const cx = cfg.cx * size;
        const cy = cfg.cy * size;
        const p = prog[key] / 100;

        if (p > 0) {
          const ringR = r + 8;
          ctx.beginPath();
          ctx.arc(cx, cy, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
          ctx.strokeStyle = cfg.color;
          ctx.lineWidth = 2.5;
          ctx.lineCap = "round";
          ctx.shadowBlur = 8;
          ctx.shadowColor = cfg.glow;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });

      // Labels
      dims.forEach((key) => {
        const cfg = CIRCLE_CONFIG[key];
        const dim = DIMENSIONS.find((d) => d.key === key)!;
        const cx = cfg.cx * size;
        const cy = cfg.cy * size;
        const p = prog[key] / 100;

        ctx.save();
        ctx.globalAlpha = 0.3 + p * 0.5;
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.font = `${Math.round(size * 0.026)}px -apple-system, sans-serif`;
        ctx.textBaseline = "middle";

        if (cfg.cy < 0.5) {
          // Top circles — centered above
          ctx.textAlign = "center";
          ctx.fillText(dim.label, cx, cy - r - 18);
        } else {
          // Bottom circles — push outward to avoid overlap
          const isLeft = cfg.cx < 0.5;
          ctx.textAlign = isLeft ? "right" : "left";
          const labelX = isLeft ? cx - 8 : cx + 8;
          ctx.fillText(dim.label, labelX, cy + r + 18);
        }

        ctx.restore();
      });

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [size, isComplete]);

  const centerSize = size * 0.28; // clickable center hitbox

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Clickable center — shown when isReady */}
      <AnimatePresence>
        {isReady && onCenterClick && (
          <motion.button
            className="absolute flex flex-col items-center justify-center"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: centerSize,
              height: centerSize,
              borderRadius: "50%",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              background: "transparent",
              border: "none",
            }}
            onClick={onCenterClick}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          />
        )}
      </AnimatePresence>

      {/* Completed title label */}
      {isComplete && ikigaiTitle && !isReady && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="text-center px-6">
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1">Your Ikigai</p>
            <p className="text-sm font-semibold text-white leading-tight"
              style={{ textShadow: "0 0 20px rgba(255,255,255,0.5)" }}>
              {ikigaiTitle}
            </p>
          </div>
        </motion.div>
      )}

      {/* Progress readouts */}
      <div className="absolute inset-0 pointer-events-none">
        {(Object.keys(CIRCLE_CONFIG) as IkigaiDimension[]).map((key) => {
          const cfg = CIRCLE_CONFIG[key];
          const p = progress[key];
          if (p === 0) return null;
          return (
            <motion.div key={key} className="absolute"
              style={{ left: `${cfg.cx * 100}%`, top: `${cfg.cy * 100}%`, transform: "translate(-50%, -50%)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              <span className="text-[10px] font-mono"
                style={{ color: cfg.color, textShadow: `0 0 8px ${cfg.glow}` }}>
                {p}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
