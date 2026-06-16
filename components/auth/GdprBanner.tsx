"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const STORAGE_KEY = "ikigai_gdpr_ack";

export default function GdprBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // ignore storage errors (e.g. private browsing in some browsers)
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch { /* ignore */ }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:max-w-sm z-50"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="rounded-2xl px-5 py-4 space-y-3"
            style={{
              background: "rgba(12,12,18,0.96)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px)",
            }}
          >
            <p className="text-xs text-white/50 font-light leading-relaxed">
              We use essential cookies to keep you signed in. By using Ikigai, you agree to our{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-2 text-white/65 hover:text-white/85 transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </p>
            <button
              onClick={dismiss}
              className="w-full py-2.5 rounded-xl text-xs text-white/70 font-light tracking-wide transition-all touch-manipulation"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                minHeight: 36,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Got it
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
