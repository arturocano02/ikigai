"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/profile";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  function switchMode(to: "signin" | "signup") {
    setMode(to);
    setError(null);
    setHint(null);
    setSuccessMsg(null);
    setTimeout(() => passwordRef.current?.focus(), 80);
  }

  // Auto-focus email on mount
  useEffect(() => { emailRef.current?.focus(); }, []);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    setHint(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          data: { gdpr_consent_at: new Date().toISOString() },
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccessMsg("Check your inbox — we sent you a confirmation link.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // "Invalid login credentials" can mean no account OR wrong password.
        // Auto-switch to sign-up so the user can create one with the same email.
        const noAccount =
          error.message.toLowerCase().includes("invalid login credentials") ||
          error.message.toLowerCase().includes("user not found");

        if (noAccount) {
          setMode("signup");
          setHint("No account found with that email — fill in a password to create one.");
          setError(null);
        } else {
          setError(error.message);
        }
      } else {
        router.push(next);
        router.refresh();
      }
    }
    setLoading(false);
  }

  const isSignIn = mode === "signin";

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center px-5 overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(249,115,22,0.07) 0%, transparent 70%)",
        }}
      />

      <button
        onClick={() => router.back()}
        className="absolute top-5 left-5 z-20 flex items-center gap-1.5 text-white/25 hover:text-white/55 transition-colors"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="text-xs tracking-wider">Back</span>
      </button>

      <motion.div
        className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Mode tabs */}
        <div
          className="flex rounded-2xl p-1 mb-7"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all touch-manipulation"
              style={{
                background: mode === m ? "rgba(249,115,22,0.22)" : "transparent",
                color: mode === m ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.35)",
                border: mode === m ? "1px solid rgba(249,115,22,0.45)" : "1px solid transparent",
                boxShadow: mode === m ? "0 0 20px rgba(249,115,22,0.12)" : "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {m === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Subtitle */}
        <AnimatePresence mode="wait">
          <motion.p
            key={mode}
            className="text-center text-sm text-white/40 font-light mb-6"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {isSignIn
              ? "Welcome back — sign in to your account"
              : "New here? Create a free account to save your Ikigai"}
          </motion.p>
        </AnimatePresence>

        <div
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Google — primary CTA */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-medium text-sm transition-all touch-manipulation disabled:opacity-50"
            style={{
              background: googleLoading
                ? "rgba(249,115,22,0.18)"
                : "linear-gradient(135deg, rgba(249,115,22,0.28), rgba(249,115,22,0.18))",
              border: "1px solid rgba(249,115,22,0.55)",
              boxShadow: "0 0 28px rgba(249,115,22,0.15), inset 0 1px 0 rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.95)",
              minHeight: 52,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>{googleLoading ? "Redirecting to Google..." : `${isSignIn ? "Sign in" : "Sign up"} with Google`}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-white/20 tracking-widest uppercase">or use email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Hint (auto-switched to signup) */}
          <AnimatePresence>
            {hint && (
              <motion.div
                className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
                style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <span className="text-[10px] mt-0.5">✦</span>
                <p className="text-xs text-orange-300/80 font-light leading-relaxed">{hint}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email form */}
          {successMsg ? (
            <motion.div
              className="text-center py-5 space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-2xl">✉️</p>
              <p className="text-sm text-emerald-400/90 font-light">{successMsg}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  autoComplete="email"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none transition-all"
                  style={{ minHeight: 48 }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(249,115,22,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignIn ? "Password" : "Choose a password (8+ chars)"}
                  required
                  autoComplete={isSignIn ? "current-password" : "new-password"}
                  minLength={8}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder-white/25 outline-none transition-all"
                  style={{ minHeight: 48 }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(249,115,22,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/55 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    className="text-xs text-red-400/85 leading-relaxed px-1"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || googleLoading || !email || !password}
                className="w-full py-4 rounded-xl text-sm font-semibold text-white tracking-wide transition-all touch-manipulation disabled:opacity-40"
                style={{
                  background:
                    loading || !email || !password
                      ? "rgba(255,255,255,0.07)"
                      : "linear-gradient(135deg, rgba(249,115,22,0.55), rgba(234,88,12,0.45))",
                  border:
                    !email || !password
                      ? "1px solid rgba(255,255,255,0.1)"
                      : "1px solid rgba(249,115,22,0.5)",
                  boxShadow:
                    email && password && !loading
                      ? "0 0 28px rgba(249,115,22,0.2)"
                      : "none",
                  minHeight: 52,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {loading
                  ? isSignIn ? "Signing in..." : "Creating account..."
                  : isSignIn ? "Sign In" : "Create Account"}
              </button>
            </form>
          )}
        </div>

        {/* GDPR notice */}
        <p className="mt-5 text-center text-[10px] text-white/18 leading-relaxed px-2">
          By continuing, you agree to our{" "}
          <a href="/privacy" className="underline underline-offset-2 hover:text-white/40 transition-colors">
            Privacy Policy
          </a>
          . Your data is never shared with third parties.
        </p>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
