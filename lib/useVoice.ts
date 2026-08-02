"use client";

import { useRef, useState, useCallback } from "react";

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  transcript: string;
  error: string | null;
  /** Which TTS engine is currently being used. null = not speaking yet. */
  ttsMode: "elevenlabs" | "browser" | null;
  /** True when ElevenLabs returned quota_exceeded so UI can show a specific message. */
  quotaExceeded: boolean;
}

export function useVoice(onTranscript: (text: string) => void, language: "en" | "es" = "en") {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    audioLevel: 0,
    transcript: "",
    error: null,
    ttsMode: null,
    quotaExceeded: false,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const levelRafRef = useRef<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  // Tracks everything spoken so far (final + interim) so manual stop can flush it
  const pendingTranscriptRef = useRef<string>("");
  // Prevents onend from restarting when we intentionally stopped
  const intentionalStopRef = useRef(false);
  // Prevents onend from restarting while AI is speaking (paused to avoid feedback)
  const pausedForSpeechRef = useRef(false);
  // Language ref so the inner startRecognition closure always uses the latest value
  const languageRef = useRef(language);
  languageRef.current = language;

  // Creates and starts a fresh SpeechRecognition instance. Called on first start
  // and on every restart (onend or post-speech resume). Always a fresh object so
  // iOS/Safari don't choke on reusing a stopped instance.
  const startRecognitionRef = useRef<(() => void) | null>(null);

  const startListening = useCallback(async () => {
    intentionalStopRef.current = false;

    // If stream already exists (e.g. called again after error), skip getUserMedia
    if (!streamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const ctx = new AudioContext();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const buf = new Uint8Array(analyser.frequencyBinCount);
        function measureLevel() {
          analyser.getByteFrequencyData(buf);
          const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
          setState((s) => ({ ...s, audioLevel: avg / 128 }));
          levelRafRef.current = requestAnimationFrame(measureLevel);
        }
        measureLevel();
      } catch {
        setState((s) => ({
          ...s,
          error: "Microphone access denied. Please allow microphone access.",
        }));
        return;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) { setState((s) => ({ ...s, isListening: true, error: null })); return; }

    function startRecognition() {
      if (intentionalStopRef.current || !streamRef.current) return;
      // Stop and discard the previous instance before creating a new one
      if (recognitionRef.current) {
        try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }

      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = languageRef.current === "es" ? "es-ES" : "en-US";
      let finalTranscript = "";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript;
          } else {
            interim += e.results[i][0].transcript;
          }
        }
        pendingTranscriptRef.current = finalTranscript + interim;
        setState((s) => ({ ...s, transcript: finalTranscript + interim }));
      };

      rec.onspeechend = () => {
        const toSend = pendingTranscriptRef.current.trim();
        if (toSend) {
          onTranscript(toSend);
          finalTranscript = "";
          pendingTranscriptRef.current = "";
          setState((s) => ({ ...s, transcript: "" }));
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onerror = (e: any) => {
        // "no-speech" and "aborted" are normal — don't surface them
        if (e.error !== "no-speech" && e.error !== "aborted") {
          setState((s) => ({ ...s, error: e.error }));
        }
      };

      // On unexpected end, create a fresh instance and restart (100ms delay avoids
      // race on browsers that fire onend synchronously before fully stopped)
      rec.onend = () => {
        if (!intentionalStopRef.current && !pausedForSpeechRef.current && streamRef.current) {
          setTimeout(startRecognition, 100);
        }
      };

      try {
        rec.start();
        recognitionRef.current = rec;
      } catch {
        // Start failed — retry after a short delay
        setTimeout(startRecognition, 500);
      }
    }

    startRecognitionRef.current = startRecognition;
    startRecognition();
    setState((s) => ({ ...s, isListening: true, error: null, transcript: "" }));
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    cancelAnimationFrame(levelRafRef.current);
    intentionalStopRef.current = true;
    startRecognitionRef.current = null;

    // Flush any pending speech before tearing down
    const pending = pendingTranscriptRef.current.trim();
    if (pending) {
      onTranscript(pending);
      pendingTranscriptRef.current = "";
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setState((s) => ({ ...s, isListening: false, audioLevel: 0, transcript: "" }));
  }, [onTranscript]);

  // Speak via ElevenLabs API → fallback to browser TTS
  const speak = useCallback((text: string, onEnd?: () => void): Promise<void> => {
    return new Promise(async (resolve) => {
      if (typeof window === "undefined") { onEnd?.(); resolve(); return; }

      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      window.speechSynthesis?.cancel();

      // Pause recognition while AI speaks so its audio isn't captured as user input
      pausedForSpeechRef.current = true;
      if (recognitionRef.current) {
        // Null onend first so the stopped instance doesn't trigger a restart
        try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }

      setState((s) => ({ ...s, isSpeaking: true, ttsMode: null }));

      const resumeRecognition = () => {
        pausedForSpeechRef.current = false;
        // Use the same factory that handles iOS fresh-instance requirement
        if (!intentionalStopRef.current && streamRef.current && startRecognitionRef.current) {
          startRecognitionRef.current();
        }
      };

      let resolved = false;
      let loadTimeoutId: ReturnType<typeof setTimeout> | null = null;
      let nuclearTimeoutId: ReturnType<typeof setTimeout> | null = null;
      // AbortController lets us cancel a slow ElevenLabs fetch before it plays into an open mic
      const abortCtrl = new AbortController();

      const finish = () => {
        if (resolved) return;
        resolved = true;
        if (loadTimeoutId) { clearTimeout(loadTimeoutId); loadTimeoutId = null; }
        if (nuclearTimeoutId) { clearTimeout(nuclearTimeoutId); nuclearTimeoutId = null; }
        setState((s) => ({ ...s, isSpeaking: false, ttsMode: null }));
        resumeRecognition();
        onEnd?.();
        resolve();
      };

      // Nuclear safety: if nothing calls finish() within 20s, force it so mic always resumes
      nuclearTimeoutId = setTimeout(() => {
        if (!resolved) {
          console.warn("[voice] Nuclear timeout — forcing speech end so mic can resume");
          finish();
        }
      }, 20000);

      // Give ElevenLabs 10s before giving up — cold start + audio generation can take 3-7s
      loadTimeoutId = setTimeout(() => {
        if (resolved) return;
        console.warn("[voice] ElevenLabs timeout after 10s — falling back to browser TTS");
        abortCtrl.abort();
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current = null;
        }
        window.speechSynthesis?.cancel();
        setState((s) => ({ ...s, ttsMode: "browser" }));
        fallbackTTS(text, finish, language);
      }, 10000);

      // Try ElevenLabs first
      try {
        const res = await fetch("/api/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language }),
          signal: abortCtrl.signal,
        });

        if (resolved) return; // timeout already fired — don't play anything

        if (res.ok) {
          const blob = await res.blob();
          if (resolved) return; // timeout fired while downloading blob

          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          currentAudioRef.current = audio;
          setState((s) => ({ ...s, ttsMode: "elevenlabs" }));
          // 350ms buffer: lets speakers fully clear before mic re-opens to prevent feedback
          audio.onended = () => { URL.revokeObjectURL(url); setTimeout(finish, 350); };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            console.error("[voice] ElevenLabs audio playback error, falling back to browser TTS");
            if (!resolved) { setState((s) => ({ ...s, ttsMode: "browser" })); fallbackTTS(text, finish, language); }
          };
          try {
            await audio.play();
            // Audio is playing — clear the ElevenLabs timeout so it plays to completion
            if (loadTimeoutId) { clearTimeout(loadTimeoutId); loadTimeoutId = null; }
          } catch {
            // Autoplay blocked (common on iOS) — fall through to browser TTS below
            URL.revokeObjectURL(url);
            currentAudioRef.current = null;
          }
          return;
        } else {
          const detail = await res.json().catch(() => ({})) as Record<string, unknown>;
          const isQuota = detail.code === "quota_exceeded";
          console.error(`[voice] ElevenLabs ${res.status} (${detail.code ?? "unknown"}) — falling back to browser TTS`, detail);
          if (isQuota) {
            console.warn("[voice] ElevenLabs quota exhausted. Upgrade at elevenlabs.io/pricing to restore the AI voice.");
            setState((s) => ({ ...s, quotaExceeded: true }));
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // intentional abort — timeout handler took over
        console.error("[voice] ElevenLabs fetch failed, falling back to browser TTS:", err);
      }

      if (!resolved) { setState((s) => ({ ...s, ttsMode: "browser" })); fallbackTTS(text, finish, language); }
    });
  }, [language]);

  const cancelSpeech = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setState((s) => ({ ...s, isSpeaking: false }));
  }, []);

  return { state, startListening, stopListening, speak, cancelSpeech };
}

function fallbackTTS(text: string, onEnd: () => void, language: "en" | "es" = "en") {
  if (typeof window === "undefined" || !window.speechSynthesis) { onEnd(); return; }

  function speakWithVoices(voices: SpeechSynthesisVoice[]) {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = language === "es" ? "es-ES" : "en-US";
    utt.rate = 0.9;
    utt.pitch = 1;
    utt.volume = 1;
    const preferred = language === "es"
      ? voices.find((v) => v.lang.startsWith("es") && v.localService) ?? voices.find((v) => v.lang.startsWith("es"))
      : voices.find((v) => v.name.includes("Samantha") || v.name.includes("Karen") || (v.lang.startsWith("en") && v.localService));
    if (preferred) utt.voice = preferred;

    // Safety timeout: iOS sometimes silently blocks speechSynthesis without firing onend/onerror.
    // After 12s, force onEnd so the mic always resumes.
    const safetyId = setTimeout(() => {
      utt.onend = null;
      utt.onerror = null;
      window.speechSynthesis?.cancel();
      onEnd();
    }, 12000);

    utt.onend = () => { clearTimeout(safetyId); setTimeout(onEnd, 350); };
    utt.onerror = () => { clearTimeout(safetyId); onEnd(); };
    window.speechSynthesis.speak(utt);
  }

  // Voices load asynchronously on first call — if the list is empty, wait for it
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    speakWithVoices(voices);
  } else {
    const handler = () => {
      window.speechSynthesis.onvoiceschanged = null;
      speakWithVoices(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.onvoiceschanged = handler;
    // Safety net: if event never fires, try after 800ms anyway
    setTimeout(() => {
      if (window.speechSynthesis.onvoiceschanged === handler) {
        window.speechSynthesis.onvoiceschanged = null;
        speakWithVoices(window.speechSynthesis.getVoices());
      }
    }, 800);
  }
}
