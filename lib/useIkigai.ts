"use client";

import { useState, useCallback, useRef } from "react";
import type { IkigaiDimension, ConversationMessage, IkigaiSynthesis } from "@/types/ikigai";

export interface IkigaiSessionState {
  messages: ConversationMessage[];
  progress: Record<IkigaiDimension, number>;
  insights: Record<IkigaiDimension, string[]>;
  currentFocus: IkigaiDimension | null;
  isComplete: boolean;
  synthesis: IkigaiSynthesis | null;
  isSynthesizing: boolean;
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
  initialSession?: SavedSession
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
    setState((s) => ({ ...s, isSynthesizing: true, phase: "synthesizing" }));

    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress, insights, messages }),
      });

      const data = await res.json();

      setState((s) => ({
        ...s,
        synthesis: data,
        isSynthesizing: false,
        phase: "revealed",
        isComplete: true,
      }));
    } catch (err) {
      console.error("Synthesis error:", err);
      setState((s) => ({ ...s, isSynthesizing: false }));
    }
  }, []);

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
    setState({
      messages: [],
      progress: makeInitialProgress(),
      insights: makeInitialInsights(),
      currentFocus: null,
      isComplete: false,
      synthesis: null,
      isSynthesizing: false,
      phase: "intro",
    });
  }, []);

  return { state, sendMessage, triggerSynthesis, reset };
}
