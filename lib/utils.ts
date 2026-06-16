import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}
