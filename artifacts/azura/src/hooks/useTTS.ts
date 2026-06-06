import { useCallback, useEffect, useRef, useState } from "react";
import { type Lang } from "@/lib/i18n";

export function useTTS(lang: Lang, persona: "female" | "male" = "female") {
  const [enabled, setEnabled] = useState(() => localStorage.getItem("azura-tts") !== "false");
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("azura-tts", String(next));
    if (!next) stop();
  };

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!enabled) return;
      stop();

      const clean = text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/#+\s*/g, "")
        .replace(/\[SUGGEST:[^\]]+\]/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .trim();

      if (!clean) return;

      setSpeaking(true);

      try {
        abortRef.current = new AbortController();
        
        // Call our Cloudflare Function for TTS (Gemini)
        const res = await fetch("/api/ai/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: clean, lang }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error("TTS API failed");
        
        const { audio } = await res.json() as { audio: string };

        if (!audio) throw new Error("No audio data");

        // Convert base64 audio to blob and play
        const binary = atob(audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: "audio/mp3" });
        const url = URL.createObjectURL(blob);

        const audio_el = new Audio(url);
        audioRef.current = audio_el;
        audio_el.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
        audio_el.onerror = () => { 
          setSpeaking(false); 
          // Fallback to browser TTS
          fallbackBrowserTTS(clean);
        };
        await audio_el.play();
        
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") { setSpeaking(false); return; }
        // Fallback to browser TTS
        fallbackBrowserTTS(clean);
      }
    },
    [enabled, lang, persona, stop]
  );

  const fallbackBrowserTTS = (text: string) => {
    if (!window.speechSynthesis) { setSpeaking(false); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "ar" ? "ar-EG" : "en-US";
    u.rate = 0.95;
    u.pitch = persona === "female" ? 1.1 : 0.9;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  useEffect(() => () => stop(), [stop]);

  return { enabled, toggle, speak, stop, speaking };
}
