"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface AiOrbProps {
  state: OrbState;
  size?: number;
  audioLevel?: number; // 0-1 microphone level
  className?: string;
  onClick?: () => void;
}

export function AiOrb({
  state,
  size = 200,
  audioLevel = 0,
  className,
  onClick,
}: AiOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Particle system
  useEffect(() => {
    if (!mounted) return;
    particlesRef.current = Array.from({ length: 60 }, () => createParticle(size));
  }, [size, mounted]);

  // Canvas animation
  useEffect(() => {
    if (!mounted) return;
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

    const cx = size / 2;
    const cy = size / 2;

    function draw(timestamp: number) {
      if (!ctx) return;
      timeRef.current = timestamp * 0.001;
      const t = timeRef.current;

      ctx.clearRect(0, 0, size, size);

      const scale = 1 + audioLevel * 0.3;
      const baseRadius = (size / 2) * 0.32 * scale;

      // Outer ambient rings
      if (state !== "idle") {
        for (let i = 3; i >= 1; i--) {
          const ringRadius = baseRadius * (1 + i * 0.35);
          const alpha = (state === "listening" ? 0.08 : 0.05) * (1 + audioLevel) / i;
          ctx.beginPath();
          ctx.arc(cx, cy, ringRadius + Math.sin(t * 2 + i) * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(249, 115, 22, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Particles
      particlesRef.current.forEach((p) => {
        updateParticle(p, t, state, audioLevel, size);
        drawParticle(ctx, p, cx, cy);
      });

      // Core gradient orb
      drawCore(ctx, cx, cy, baseRadius, t, state, audioLevel);

      // Inner highlight
      const highlightGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.3,
        cy - baseRadius * 0.3,
        0,
        cx,
        cy,
        baseRadius * 0.7
      );
      highlightGrad.addColorStop(0, "rgba(255, 255, 255, 0.2)");
      highlightGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = highlightGrad;
      ctx.fill();

      // Ripple on listening
      if (state === "listening" && audioLevel > 0.1) {
        drawRipples(ctx, cx, cy, baseRadius, t, audioLevel);
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [state, audioLevel, size, mounted]);

  const floatY = useMotionValue(0);
  const springY = useSpring(floatY, { stiffness: 30, damping: 10 });

  useEffect(() => {
    let raf: number;
    let start = performance.now();
    function tick(now: number) {
      const t = (now - start) / 1000;
      floatY.set(Math.sin(t * 0.5) * 10);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [floatY]);

  return (
    <motion.div
      className={cn("relative cursor-pointer select-none touch-manipulation", className)}
      style={{
        width: size,
        height: size,
        y: springY,
        WebkitTapHighlightColor: "transparent",
      }}
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Outer glow layer */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow:
            state === "idle"
              ? [
                  "0 0 40px rgba(249,115,22,0.2), 0 0 80px rgba(20,184,166,0.1)",
                  "0 0 60px rgba(249,115,22,0.32), 0 0 100px rgba(20,184,166,0.15)",
                  "0 0 40px rgba(249,115,22,0.2), 0 0 80px rgba(20,184,166,0.1)",
                ]
              : state === "listening"
              ? [
                  "0 0 60px rgba(249,115,22,0.5), 0 0 120px rgba(245,158,11,0.25)",
                  "0 0 80px rgba(249,115,22,0.7), 0 0 160px rgba(245,158,11,0.35)",
                  "0 0 60px rgba(249,115,22,0.5), 0 0 120px rgba(245,158,11,0.25)",
                ]
              : state === "thinking"
              ? [
                  "0 0 50px rgba(6,182,212,0.45), 0 0 100px rgba(20,184,166,0.25)",
                  "0 0 70px rgba(6,182,212,0.6), 0 0 140px rgba(20,184,166,0.35)",
                  "0 0 50px rgba(6,182,212,0.45), 0 0 100px rgba(20,184,166,0.25)",
                ]
              : [
                  "0 0 60px rgba(245,158,11,0.5), 0 0 120px rgba(249,115,22,0.3)",
                  "0 0 90px rgba(245,158,11,0.7), 0 0 160px rgba(249,115,22,0.4)",
                  "0 0 60px rgba(245,158,11,0.5), 0 0 120px rgba(249,115,22,0.3)",
                ],
        }}
        transition={{
          duration: state === "listening" ? 0.8 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <canvas ref={canvasRef} className="relative z-10" style={{ touchAction: "none" }} />
    </motion.div>
  );
}

// ─── Particle helpers ────────────────────────────────────────────────────────

interface Particle {
  angle: number;
  radius: number;
  baseRadius: number;
  speed: number;
  size: number;
  opacity: number;
  color: string;
  orbitTilt: number;
  phase: number;
}

const COLORS = [
  "rgba(249,115,22,",
  "rgba(20,184,166,",
  "rgba(6,182,212,",
  "rgba(245,158,11,",
];

function createParticle(size: number): Particle {
  const baseRadius = size * 0.22;
  return {
    angle: Math.random() * Math.PI * 2,
    radius: baseRadius + Math.random() * size * 0.18,
    baseRadius,
    speed: (Math.random() * 0.4 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.6 + 0.2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    orbitTilt: Math.random() * Math.PI,
    phase: Math.random() * Math.PI * 2,
  };
}

function updateParticle(
  p: Particle,
  t: number,
  state: OrbState,
  audioLevel: number,
  size: number
) {
  const speedMult =
    state === "thinking" ? 2.5 : state === "listening" ? 1.5 + audioLevel * 2 : 0.6;
  p.angle += p.speed * 0.01 * speedMult;

  const radiusVariance = Math.sin(t * 0.8 + p.phase) * 8;
  const targetRadius = p.baseRadius + radiusVariance + audioLevel * size * 0.08;
  p.radius += (targetRadius - p.radius) * 0.05;

  if (state === "thinking") {
    p.opacity = 0.4 + Math.sin(t * 3 + p.phase) * 0.3;
  } else {
    p.opacity = 0.3 + Math.sin(t * 1.5 + p.phase) * 0.2;
  }
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  cx: number,
  cy: number
) {
  const x = cx + Math.cos(p.angle) * p.radius * Math.cos(p.orbitTilt);
  const y = cy + Math.sin(p.angle) * p.radius;

  ctx.beginPath();
  ctx.arc(x, y, p.size, 0, Math.PI * 2);
  ctx.fillStyle = `${p.color}${p.opacity})`;
  ctx.fill();
}

function drawCore(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  t: number,
  state: OrbState,
  audioLevel: number
) {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

  if (state === "thinking") {
    grad.addColorStop(0, `rgba(6, 182, 212, ${0.9 + Math.sin(t * 4) * 0.1})`);
    grad.addColorStop(0.4, `rgba(20, 184, 166, 0.8)`);
    grad.addColorStop(0.8, `rgba(249, 115, 22, 0.35)`);
    grad.addColorStop(1, `rgba(6, 182, 212, 0)`);
  } else if (state === "speaking") {
    grad.addColorStop(0, `rgba(245, 158, 11, ${0.9 + audioLevel * 0.1})`);
    grad.addColorStop(0.4, `rgba(249, 115, 22, 0.85)`);
    grad.addColorStop(0.8, `rgba(20, 184, 166, 0.5)`);
    grad.addColorStop(1, `rgba(249, 115, 22, 0)`);
  } else if (state === "listening") {
    grad.addColorStop(0, `rgba(249, 115, 22, ${0.9 + audioLevel * 0.1})`);
    grad.addColorStop(0.4, `rgba(245, 158, 11, 0.8)`);
    grad.addColorStop(0.8, `rgba(6, 182, 212, 0.4)`);
    grad.addColorStop(1, `rgba(249, 115, 22, 0)`);
  } else {
    const pulse = 0.8 + Math.sin(t * 1.2) * 0.1;
    grad.addColorStop(0, `rgba(249, 115, 22, ${pulse})`);
    grad.addColorStop(0.5, `rgba(20, 184, 166, ${pulse * 0.65})`);
    grad.addColorStop(1, `rgba(249, 115, 22, 0)`);
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

function drawRipples(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  baseRadius: number,
  t: number,
  audioLevel: number
) {
  const numRipples = 3;
  for (let i = 0; i < numRipples; i++) {
    const phase = ((t * 1.5 + i / numRipples) % 1);
    const radius = baseRadius * (1 + phase * 1.5 + audioLevel * 0.3);
    const alpha = (1 - phase) * 0.4 * audioLevel;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(249, 115, 22, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
