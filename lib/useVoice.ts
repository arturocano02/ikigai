"use client";

import { useRef, useState, useCallback } from "react";

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  transcript: string;
  error: string | null;
}

export function useVoice(onTranscript: (text: string) => void, language: "en" | "es" = "en") {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    audioLevel: 0,
    transcript: "",
    error: null,
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

  const startListening = useCallback(async () => {
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = language === "es" ? "es-ES" : "en-US";
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
          if (e.error !== "no-speech") {
            setState((s) => ({ ...s, error: e.error }));
          }
        };

        rec.start();
        recognitionRef.current = rec;
      }

      setState((s) => ({ ...s, isListening: true, error: null, transcript: "" }));
    } catch {
      setState((s) => ({
        ...s,
        error: "Microphone access denied. Please allow microphone access.",
      }));
    }
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    cancelAnimationFrame(levelRafRef.current);

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

      setState((s) => ({ ...s, isSpeaking: true }));

      let resolved = false;
      let loadTimeoutId: ReturnType<typeof setTimeout> | null = null;

      const finish = () => {
        if (resolved) return;
        resolved = true;
        if (loadTimeoutId) { clearTimeout(loadTimeoutId); loadTimeoutId = null; }
        setState((s) => ({ ...s, isSpeaking: false }));
        onEnd?.();
        resolve();
      };

      // If audio hasn't started playing within 2.5s, carry on without it
      loadTimeoutId = setTimeout(() => {
        if (resolved) return;
        console.warn("[voice] audio load timeout — carrying on with conversation");
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current = null;
        }
        window.speechSynthesis?.cancel();
        finish();
      }, 2500);

      // Try ElevenLabs first
      try {
        const res = await fetch("/api/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          currentAudioRef.current = audio;
          audio.onended = () => { URL.revokeObjectURL(url); finish(); };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            console.error("[voice] ElevenLabs audio failed to play, falling back to browser TTS");
            fallbackTTS(text, finish, language);
          };
          await audio.play();
          // Audio is playing — clear the load timeout so it plays to completion
          if (loadTimeoutId) { clearTimeout(loadTimeoutId); loadTimeoutId = null; }
          return;
        } else {
          const body = await res.text().catch(() => "");
          console.error(`[voice] /api/speak returned ${res.status}, falling back to browser TTS:`, body);
        }
      } catch (err) {
        console.error("[voice] /api/speak request failed, falling back to browser TTS:", err);
      }

      fallbackTTS(text, finish, language);
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
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = language === "es" ? "es-ES" : "en-US";
  utt.rate = 0.9;
  utt.pitch = 1;
  utt.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred = language === "es"
    ? voices.find((v) => v.lang.startsWith("es") && v.localService) ?? voices.find((v) => v.lang.startsWith("es"))
    : voices.find((v) => v.name.includes("Samantha") || v.name.includes("Karen") || (v.lang.startsWith("en") && v.localService));
  if (preferred) utt.voice = preferred;
  utt.onend = onEnd;
  utt.onerror = onEnd;
  window.speechSynthesis.speak(utt);
}
