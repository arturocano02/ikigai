"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";

function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const msg = searchParams.get("msg");

  const isCredentials =
    msg?.toLowerCase().includes("exchange") ||
    msg?.toLowerCase().includes("client") ||
    msg?.toLowerCase().includes("secret");

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5">
      <motion.div
        className="w-full max-w-sm text-center space-y-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-light text-white">Sign-in failed</h1>

        {msg ? (
          <div
            className="rounded-xl px-4 py-3 text-left"
            style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.18)" }}
          >
            <p className="text-xs text-red-300/70 font-mono leading-relaxed break-words">{decodeURIComponent(msg)}</p>
          </div>
        ) : (
          <p className="text-sm text-white/40 font-light">Something went wrong during sign-in.</p>
        )}

        {isCredentials && (
          <div
            className="rounded-xl px-4 py-3 text-left space-y-1.5"
            style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.2)" }}
          >
            <p className="text-xs text-orange-300/80 font-medium">Fix: check Supabase → Auth → Providers → Google</p>
            <ul className="text-xs text-white/35 font-light space-y-1 list-none">
              <li>· Client ID and Client Secret must match Google Cloud Console exactly</li>
              <li>· Redirect URI in Google Console must be your Supabase callback URL</li>
              <li>· If app is in Testing mode, add your email as a test user</li>
            </ul>
          </div>
        )}

        <button
          onClick={() => router.push("/auth/login")}
          className="px-7 py-3 rounded-full text-sm text-white/70 font-light tracking-wide transition-all"
          style={{
            border: "1px solid rgba(249,115,22,0.3)",
            background: "rgba(249,115,22,0.1)",
          }}
        >
          Try again
        </button>
      </motion.div>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}
