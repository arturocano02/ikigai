"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { IkigaiDimension, ConversationMessage, IkigaiSynthesis } from "@/types/ikigai";

const BACKUP_KEY = "ikigai_conv_backup";
const SYNTHESIS_KEY = "ikigai_synthesis_result";

function saveBackup(data: object) {
  try { localStorage.setItem(BACKUP_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}
function clearBackup() {
  try { localStorage.removeItem(BACKUP_KEY); } catch { /* ignore */ }
}
function saveSynthesis(data: object) {
  try { sessionStorage.setItem(SYNTHESIS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  // Also persist to localStorage so it survives page refresh
  try { localStorage.setItem(SYNTHESIS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export interface IkigaiSessionState {
  messages: ConversationMessage[];
  progress: Record<IkigaiDimension, number>;
  insights: Record<IkigaiDimension, string[]>;
  currentFocus: IkigaiDimension | null;
  isComplete: boolean;
  synthesis: IkigaiSynthesis | null;
  isSynthesizing: boolean;
  synthesisError: boolean;
  phase: "intro" | "conversation" | "ready" | "synthesizing" | "revealed";
}

export interface SavedSession {
  messages: ConversationMessage[];
  progress: Record<IkigaiDimension, number>;
  insights: Record<IkigaiDimension, string[]>;
  currentFocus: IkigaiDimension | null;
}

const makeInitialProgress = (): Record<IkigaiDimension, number> => ({
  love: 0, good: 0, world: 0, paid: 0,
});

const makeInitialInsights = (): Record<IkigaiDimension, string[]> => ({
  love: [], good: [], world: [], paid: [],
});

export function useIkigai(
  length: "ultra" | "short" | "medium" | "long" = "medium",
  initialSession?: SavedSession,
  language: "en" | "es" = "en"
) {
  const completeThreshold = length === "ultra" ? 40 : length === "short" ? 60 : length === "medium" ? 75 : 85;

  const [state, setState] = useState<IkigaiSessionState>(() => ({
    messages: initialSession?.messages || [],
    progress: initialSession?.progress || makeInitialProgress(),
    insights: initialSession?.insights || makeInitialInsights(),
    currentFocus: initialSession?.currentFocus || null,
    isComplete: false,
    synthesis: null,
    isSynthesizing: false,
    synthesisError: false,
    phase: initialSession ? "conversation" : "intro",
  }));

  // Refs hold the authoritative mutable values — sendMessage always reads latest
  const messagesRef = useRef<ConversationMessage[]>(initialSession?.messages || []);
  const progressRef = useRef<Record<IkigaiDimension, number>>(initialSession?.progress || makeInitialProgress());
  const insightsRef = useRef<Record<IkigaiDimension, string[]>>(initialSession?.insights || makeInitialInsights());
  const focusRef = useRef<IkigaiDimension | null>(initialSession?.currentFocus || null);
  const abortRef = useRef<AbortController | null>(null);

  const synthesize = useCallback(async (
    progress: Record<IkigaiDimension, number>,
    insights: Record<IkigaiDimension, string[]>,
    messages: ConversationMessage[]
  ) => {
    setState((s) => ({ ...s, isSynthesizing: true, synthesisError: false, phase: "synthesizing" }));

    let userContext: { age?: string; currentRole?: string; otherContext?: string } | undefined;
    try {
      const raw = localStorage.getItem("ikigai_user_context");
      if (raw) userContext = JSON.parse(raw);
    } catch { /* ignore */ }

    const body = JSON.stringify({ progress, insights, messages, userContext, language });

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 2000 * attempt));

        const res = await fetch("/api/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.warn(`[synthesize] attempt ${attempt + 1} failed: ${res.status}`, err);
          if (attempt < 2) continue;
          setState((s) => ({ ...s, isSynthesizing: false, synthesisError: true }));
          return;
        }

        const data = await res.json();

        // Persist so reveal page can read it without a fragile URL param
        saveSynthesis(data);
        clearBackup(); // conversation completed successfully

        setState((s) => ({
          ...s,
          synthesis: data,
          isSynthesizing: false,
          synthesisError: false,
          phase: "revealed",
          isComplete: true,
        }));
        return;
      } catch (err) {
        console.warn(`[synthesize] attempt ${attempt + 1} threw:`, err);
        if (attempt >= 2) {
          setState((s) => ({ ...s, isSynthesizing: false, synthesisError: true }));
        }
      }
    }
  }, [language]);

  const sendMessage = useCallback(async (
    userText: string,
    onAiResponse: (text: string, exitExploration?: boolean) => void,
    explorationMode = false
  ): Promise<void> => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    const userMsg: ConversationMessage = {
      role: "user",
      content: userText,
      timestamp: Date.now(),
    };

    messagesRef.current = [...messagesRef.current, userMsg];

    setState((s) => ({
      ...s,
      messages: messagesRef.current,
      phase: s.phase === "intro" ? "conversation" : s.phase,
    }));

    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesRef.current,
          progress: progressRef.current,
          insights: insightsRef.current,
          currentFocus: focusRef.current,
          length,
          explorationMode,
          language,
        }),
        signal: abort.signal,
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();

      const aiMsg: ConversationMessage = {
        role: "assistant",
        content: data.response,
        timestamp: Date.now(),
      };

      const newProgress = { ...progressRef.current };
      const newInsights = { ...insightsRef.current };

      if (data.updates) {
        for (const [dim, val] of Object.entries(data.updates.progress || {})) {
          newProgress[dim as IkigaiDimension] = Math.min(
            100,
            Math.max(newProgress[dim as IkigaiDimension], val as number)
          );
        }
        for (const [dim, items] of Object.entries(data.updates.insights || {})) {
          const existing = newInsights[dim as IkigaiDimension];
          const newItems = (items as string[]).filter((i) => !existing.includes(i));
          newInsights[dim as IkigaiDimension] = [...existing, ...newItems].slice(0, 6);
        }
      }

      const newFocus = (data.currentFocus || focusRef.current) as IkigaiDimension | null;
      const isComplete = Object.values(newProgress).every((p) => p >= completeThreshold);

      messagesRef.current = [...messagesRef.current, aiMsg];
      progressRef.current = newProgress;
      insightsRef.current = newInsights;
      focusRef.current = newFocus;

      // Auto-backup so user doesn't lose work if they close mid-conversation
      saveBackup({
        messages: messagesRef.current,
        progress: newProgress,
        insights: newInsights,
        currentFocus: newFocus,
      });

      setState((s) => ({
        ...s,
        messages: messagesRef.current,
        progress: newProgress,
        insights: newInsights,
        currentFocus: newFocus,
        isComplete,
        // "ready" = AI has enough info; user clicks the map center to trigger synthesis
        phase: isComplete && s.phase !== "ready" && s.phase !== "synthesizing" ? "ready" : s.phase === "ready" || s.phase === "synthesizing" ? s.phase : "conversation",
      }));

      onAiResponse(data.response, data.exitExploration === true);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Conversation error:", err);
      }
    }
  }, [synthesize, length, completeThreshold]);

  // Trigger synthesis — called when user clicks the map center or "Get analysis"
  const triggerSynthesis = useCallback(() => {
    setState((s) => ({ ...s, phase: "synthesizing" }));
    synthesize(progressRef.current, insightsRef.current, messagesRef.current);
  }, [synthesize]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    messagesRef.current = [];
    progressRef.current = makeInitialProgress();
    insightsRef.current = makeInitialInsights();
    focusRef.current = null;
    clearBackup();
    setState({
      messages: [],
      progress: makeInitialProgress(),
      insights: makeInitialInsights(),
      currentFocus: null,
      isComplete: false,
      synthesis: null,
      isSynthesizing: false,
      synthesisError: false,
      phase: "intro",
    });
  }, []);

  return { state, sendMessage, triggerSynthesis, reset };
}
