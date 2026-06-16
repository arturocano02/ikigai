"use client";

import { useState, useEffect } from "react";

export function useResponsiveSize(mobile: number, desktop: number, breakpoint = 1024): number {
  const [size, setSize] = useState(mobile); // start mobile-first (safe for SSR)

  useEffect(() => {
    function update() {
      setSize(window.innerWidth >= breakpoint ? desktop : mobile);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [mobile, desktop, breakpoint]);

  return size;
}

export function useIsMobile(breakpoint = 1024): boolean {
  const [isMobile, setIsMobile] = useState(true); // safe SSR default

  useEffect(() => {
    function update() {
      setIsMobile(window.innerWidth < breakpoint);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);

  return isMobile;
}
