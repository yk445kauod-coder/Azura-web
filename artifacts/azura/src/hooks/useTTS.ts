import { useCallback, useEffect, useRef, useState } from "react";
import { type Lang } from "@/lib/i18n";

export function useTTS(lang: Lang, persona: "female" | "male" = "female") {
  const [enabled, setEnabled] = useState(() => localStorage.getItem("azura-tts") !== "false");
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("azura-tts", String(next));
    if (!next) stop();
  };

  const stop = useCallback(() => {
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
        // Use browser's built-in Web Speech API
        if (!window.speechSynthesis) throw new Error("No TTS support");
        
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = lang === "ar" ? "ar-EG" : "en-US";
        utterance.rate = 0.95;
        utterance.pitch = persona === "female" ? 1.1 : 0.9;
        
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        window.speechSynthesis.speak(utterance);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") { setSpeaking(false); return; }
        setSpeaking(false);
      }
    },
    [enabled, lang, persona, stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { enabled, toggle, speak, stop, speaking };
}
