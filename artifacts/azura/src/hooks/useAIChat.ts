import { useState, useCallback, useEffect } from "react";
import { db, ref, onValue, off, push, set } from "@/lib/firebase";
import { chatWithAI } from "@/lib/crypto";
import { logUserActivity } from "@/lib/activityTracker";

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: number;
  suggestedItems?: any[];
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useAIChat(uid?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    const chatRef = ref(db, `conversations/${uid}/barista`);
    onValue(chatRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const msgs = Object.entries(data)
          .map(([id, m]: any) => ({ id, ...m }))
          .sort((a, b) => a.timestamp - b.timestamp);
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    });
    return () => off(chatRef);
  }, [uid]);

  const sendMessage = useCallback(async (
    text: string,
    apiKey: string,
    systemPrompt: string,
    parseResponse: (text: string) => { text: string; suggestedItems: any[] }
  ) => {
    // We allow sending even without apiKey to support Pollinations free model fallback
    if (!uid || !text.trim()) return;

    setLoading(true);
    setError(null);
    setThinkingSteps([]);

    const userMsg: Omit<Message, "id"> = {
      role: "user",
      content: text,
      timestamp: Date.now()
    };

    try {
      // 1. Save user message
      await push(ref(db, `conversations/${uid}/barista`), userMsg);
      logUserActivity(uid, "ai_chat", { text }, 10);

      // 2. Start thinking simulation
      setIsThinking(true);
      const steps = [
        "Analyzing your request...",
        "Scanning Azura menu...",
        "Checking availability...",
        "Crafting perfect recommendation..."
      ];

      for (const step of steps) {
        setThinkingSteps(prev => [...prev, step]);
        await sleep(600);
      }

      // 3. Call AI
      const history = messages.slice(-10).map(m => ({
        role: m.role === "ai" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const aiResponse = await chatWithAI(apiKey, text, history, systemPrompt);
      setIsThinking(false);

      if (aiResponse) {
        const { text: cleanText, suggestedItems } = parseResponse(aiResponse);
        const aiMsg: Omit<Message, "id"> = {
          role: "ai",
          content: cleanText,
          timestamp: Date.now(),
          suggestedItems
        };
        await push(ref(db, `conversations/${uid}/barista`), aiMsg);
        logUserActivity(uid, "ai_reply", { response: cleanText, suggestionsCount: suggestedItems?.length || 0 }, 5);
      }
    } catch (err: any) {
      setError(err.message || "Failed to get AI response");
      setIsThinking(false);
      logUserActivity(uid, "ai_error", { errorMessage: err.message || "Failed to get AI response" }, -2);
    } finally {
      setLoading(false);
    }
  }, [uid, messages]);

  const clearChat = useCallback(async () => {
    if (!uid) return;
    await set(ref(db, `conversations/${uid}/barista`), null);
  }, [uid]);

  return { messages, loading, isThinking, thinkingSteps, error, sendMessage, clearChat };
}
