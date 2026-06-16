"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, ArrowLeft, CheckCircle2, Bookmark, BookmarkCheck, ChevronDown } from "lucide-react";

const SAVED_JOBS_KEY = "ikigai_saved_jobs";
import type { JobMatch, IkigaiSynthesis } from "@/types/ikigai";

const COUNTRIES = [
  { code: "us", label: "US" },
  { code: "gb", label: "UK" },
  { code: "au", label: "AU" },
  { code: "ca", label: "CA" },
] as const;

type CountryCode = (typeof COUNTRIES)[number]["code"];

function CareersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allJobs, setAllJobs] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const [country, setCountry] = useState<CountryCode>("us");
  const [minScore, setMinScore] = useState(60);
  const [countryTotals, setCountryTotals] = useState<Record<string, number | null>>({});
  const [countryLoading, setCountryLoading] = useState<Record<string, boolean>>({});
  const [savedJobs, setSavedJobs] = useState<JobMatch[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_JOBS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [savedOpen, setSavedOpen] = useState(true);

  const ikigaiTitle = searchParams.get("title") || "Your Ikigai";
  const keywords = searchParams.get("keywords") || "creative problem solving";

  const toggleSave = useCallback((job: JobMatch) => {
    setSavedJobs((prev) => {
      const exists = prev.some((j) => j.id === job.id);
      const next = exists ? prev.filter((j) => j.id !== job.id) : [job, ...prev];
      try { localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const fetchJobs = useCallback(async (c: CountryCode, signal?: AbortSignal) => {
    setLoading(true);
    setSelectedJob(null);

    let synthesis: IkigaiSynthesis | undefined;
    try {
      const raw = sessionStorage.getItem("ikigai_synthesis");
      if (raw) synthesis = JSON.parse(raw);
    } catch { /* ignore */ }

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, synthesis, country: c }),
        signal,
      });
      const data = await res.json();
      setAllJobs(data.jobs || []);
      if (typeof data.totalFound === "number") {
        setCountryTotals((prev) => ({ ...prev, [c]: data.totalFound }));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setAllJobs([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [keywords]);

  // Initial load
  useEffect(() => {
    const controller = new AbortController();
    fetchJobs(country, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCountryChange = async (c: CountryCode) => {
    if (c === country) return;
    setCountry(c);
    fetchJobs(c);

    // If we haven't fetched total for this country yet, fetch it in background
    if (countryTotals[c] === undefined && !countryLoading[c]) {
      setCountryLoading((prev) => ({ ...prev, [c]: true }));
      let synthesis: IkigaiSynthesis | undefined;
      try {
        const raw = sessionStorage.getItem("ikigai_synthesis");
        if (raw) synthesis = JSON.parse(raw);
      } catch { /* ignore */ }
      try {
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords, synthesis, country: c }),
        });
        const data = await res.json();
        if (typeof data.totalFound === "number") {
          setCountryTotals((prev) => ({ ...prev, [c]: data.totalFound }));
        }
      } catch { /* ignore */ } finally {
        setCountryLoading((prev) => ({ ...prev, [c]: false }));
      }
    }
  };

  const filteredJobs = allJobs.filter((j) => j.matchScore >= minScore);

  return (
    <main className="relative min-h-dvh overflow-y-auto">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(249,115,22,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-16">

        {/* Header */}
        <motion.div
          className="mb-8 sm:mb-10"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/30 hover:text-white/60 active:text-white/60 text-xs tracking-wider uppercase mb-7 transition-colors touch-manipulation"
            style={{ WebkitTapHighlightColor: "transparent", minHeight: 44 }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <p className="text-xs tracking-[0.3em] uppercase text-white/30 mb-1.5">
            Careers aligned with
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white leading-tight">
            {ikigaiTitle}
          </h1>
          <p className="mt-2 text-sm text-white/40 font-light">
            Roles that match your purpose, strengths, and values.
          </p>
        </motion.div>

        {/* Saved Jobs */}
        <AnimatePresence>
          {savedJobs.length > 0 && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              <button
                className="flex items-center justify-between w-full mb-3 group touch-manipulation"
                style={{ WebkitTapHighlightColor: "transparent" }}
                onClick={() => setSavedOpen((o) => !o)}
              >
                <div className="flex items-center gap-2">
                  <BookmarkCheck className="w-3.5 h-3.5" style={{ color: "#f97316" }} />
                  <span className="text-[10px] uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
                    Saved Jobs
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}
                  >
                    {savedJobs.length}
                  </span>
                </div>
                <motion.div animate={{ rotate: savedOpen ? 0 : -90 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3.5 h-3.5 text-white/25" />
                </motion.div>
              </button>

              <AnimatePresence>
                {savedOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden space-y-3"
                  >
                    {savedJobs.map((job, i) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        index={i}
                        isSelected={selectedJob?.id === job.id}
                        isSaved
                        onSelect={() => setSelectedJob((s) => (s?.id === job.id ? null : job))}
                        onToggleSave={() => toggleSave(job)}
                      />
                    ))}
                    <div
                      className="h-px w-full mt-4"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <motion.div
          className="mb-6 space-y-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Country picker */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Country</p>
            <div className="flex gap-2 flex-wrap">
              {COUNTRIES.map(({ code, label }) => {
                const isActive = country === code;
                const total = countryTotals[code];
                return (
                  <button
                    key={code}
                    onClick={() => handleCountryChange(code)}
                    className="flex flex-col items-center px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 touch-manipulation"
                    style={{
                      WebkitTapHighlightColor: "transparent",
                      minWidth: 60,
                      background: isActive
                        ? "rgba(249,115,22,0.18)"
                        : "rgba(255,255,255,0.04)",
                      border: isActive
                        ? "1px solid rgba(249,115,22,0.5)"
                        : "1px solid rgba(255,255,255,0.08)",
                      color: isActive ? "#f97316" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    <span>{label}</span>
                    {total !== undefined && total !== null && (
                      <span
                        className="text-[9px] mt-0.5 font-light"
                        style={{ color: isActive ? "rgba(249,115,22,0.7)" : "rgba(255,255,255,0.2)" }}
                      >
                        {total.toLocaleString()} found
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Match score slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-white/30">Match threshold</p>
              <span className="text-xs font-semibold" style={{ color: "#f97316" }}>
                {minScore}%+
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] text-white/25 shrink-0">More results</span>
              <input
                type="range"
                min={60}
                max={100}
                step={5}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${((minScore - 60) / 40) * 100}%, rgba(255,255,255,0.1) ${((minScore - 60) / 40) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  WebkitAppearance: "none",
                }}
              />
              <span className="text-[9px] text-white/25 shrink-0">Exact match</span>
            </div>
          </div>
        </motion.div>

        {/* Jobs list */}
        <div className="space-y-3 sm:space-y-4">
          {loading && (
            <div className="flex flex-col items-center py-20 gap-4">
              <motion.div
                className="w-8 h-8 rounded-full border-2 border-t-transparent"
                style={{ borderColor: "rgba(249,115,22,0.6)", borderTopColor: "transparent" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-sm text-white/30">Searching for your ideal roles...</p>
            </div>
          )}

          {!loading && filteredJobs.length === 0 && allJobs.length > 0 && (
            <div className="text-center py-20">
              <p className="text-white/40 text-sm">No roles above {minScore}% match.</p>
              <p className="text-white/25 text-xs mt-1">Try lowering the threshold.</p>
            </div>
          )}

          {!loading && allJobs.length === 0 && (
            <div className="text-center py-20">
              <p className="text-white/40 text-sm">No roles found. Try a different country.</p>
            </div>
          )}

          {!loading &&
            filteredJobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                isSelected={selectedJob?.id === job.id}
                isSaved={savedJobs.some((s) => s.id === job.id)}
                onSelect={() => setSelectedJob((s) => (s?.id === job.id ? null : job))}
                onToggleSave={() => toggleSave(job)}
              />
            ))}
        </div>

        {!loading && filteredJobs.length > 0 && (
          <motion.p
            className="mt-10 text-center text-xs text-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Jobs sourced live from Adzuna &amp; RemoteOK
          </motion.p>
        )}
      </div>
    </main>
  );
}

function JobCard({
  job,
  index,
  isSelected,
  isSaved,
  onSelect,
  onToggleSave,
}: {
  job: JobMatch;
  index: number;
  isSelected: boolean;
  isSaved: boolean;
  onSelect: () => void;
  onToggleSave: () => void;
}) {
  const scoreColor =
    job.matchScore >= 90 ? "#06b6d4" : job.matchScore >= 80 ? "#10b981" : "#f97316";

  const hasLink = job.url && job.url !== "#";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45 }}
    >
      <div
        className="glass rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          border: isSelected ? "1px solid rgba(249,115,22,0.35)" : "1px solid rgba(255,255,255,0.07)",
          boxShadow: isSelected ? "0 0 30px rgba(249,115,22,0.08)" : "none",
        }}
      >
        {/* Main row */}
        <div
          className="p-4 sm:p-5 cursor-pointer active:opacity-80"
          style={{ WebkitTapHighlightColor: "transparent" }}
          onClick={onSelect}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-sm font-medium text-white leading-snug">
                  {job.title}
                </h3>
                {job.source === "Demo" && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/10 shrink-0">
                    Sample
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40">{job.company} · {job.location}</p>
              {job.salary && (
                <p className="text-xs text-white/30 mt-0.5">{job.salary}</p>
              )}
            </div>

            <div className="shrink-0 flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
                  className="touch-manipulation transition-all"
                  style={{ WebkitTapHighlightColor: "transparent", minHeight: 28, minWidth: 28 }}
                  aria-label={isSaved ? "Unsave job" : "Save job"}
                >
                  {isSaved ? (
                    <BookmarkCheck className="w-4 h-4" style={{ color: "#f97316" }} />
                  ) : (
                    <Bookmark className="w-4 h-4 text-white/25 hover:text-white/50 transition-colors" />
                  )}
                </button>
                <div className="flex flex-col items-end">
                  <div
                    className="text-base sm:text-lg font-semibold leading-none"
                    style={{ color: scoreColor, textShadow: `0 0 10px ${scoreColor}40` }}
                  >
                    {job.matchScore}%
                  </div>
                  <p className="text-[9px] text-white/25">match</p>
                </div>
              </div>
            </div>
          </div>

          {/* Apply link - visible in main card */}
          {hasLink && (
            <div className="mt-3">
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium touch-manipulation transition-opacity hover:opacity-80"
                style={{ color: "#f97316", minHeight: 32 }}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                <span>Apply now</span>
              </a>
            </div>
          )}
        </div>

        {/* Expanded - skills + personalized fit */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 border-t border-white/5 pt-4">

                {/* Personalized fit reasons */}
                {job.fitReasons?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
                      Why you're a great fit
                    </p>
                    <ul className="space-y-1.5">
                      {job.fitReasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-3.5 h-3.5 mt-0.5 shrink-0"
                            style={{ color: "#10b981" }}
                          />
                          <span className="text-xs text-white/60 font-light leading-relaxed">
                            {reason}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {job.skills.length > 0 && (
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
                      Key Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] px-2 py-1 rounded-full glass text-white/50 border border-white/10"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function CareersPage() {
  return (
    <Suspense>
      <CareersContent />
    </Suspense>
  );
}
