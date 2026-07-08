import { useReducer, useCallback, useEffect } from "react";
import { db, ref, onValue, off, set, remove } from "@/lib/firebase";
import { chatWithAI } from "@/lib/crypto";

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: number;
  suggestedItems?: any[];
  isThinking?: boolean;
  thinkingSteps?: string[];
}

interface ChatState {
  messages: Message[];
  loading: boolean;
  isThinking: boolean;
  thinkingSteps: string[];
  error: string | null;
}

type ChatAction =
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_THINKING"; payload: boolean }
  | { type: "ADD_THINKING_STEP"; payload: string }
  | { type: "CLEAR_THINKING" }
  | { type: "SET_ERROR"; payload: string | null };

const initialState: ChatState = {
  messages: [],
  loading: false,
  isThinking: false,
  thinkingSteps: [],
  error: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_MESSAGES":
      return { ...state, messages: action.payload };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_THINKING":
      return { ...state, isThinking: action.payload };
    case "ADD_THINKING_STEP":
      return { ...state, thinkingSteps: [...state.thinkingSteps, action.payload] };
    case "CLEAR_THINKING":
      return { ...state, thinkingSteps: [], isThinking: false };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export function useAIChat(userId: string | undefined, chatId: string = "barista") {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  useEffect(() => {
    if (!userId) return;
    const chatRef = ref(db, `conversations/${userId}/${chatId}`);
    const unsubscribe = onValue(chatRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val() as Record<string, Message>;
        const sorted = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
        dispatch({ type: "SET_MESSAGES", payload: sorted });
      } else {
        dispatch({ type: "SET_MESSAGES", payload: [] });
      }
    });
    return () => off(chatRef);
  }, [userId, chatId]);

  const saveMessage = useCallback(async (msg: Message) => {
    if (!userId) return;
    const msgRef = ref(db, `conversations/${userId}/${chatId}/${msg.id}`);
    await set(msgRef, { ...msg, suggestedItems: msg.suggestedItems || null });
  }, [userId, chatId]);

  const sendMessage = useCallback(async (
    text: string,
    apiKey: string,
    systemPrompt: string,
    onParsed: (content: string) => { text: string; suggestedItems: any[] }
  ) => {
    if (!text.trim() || !userId || !apiKey) return;

    const userMsg: Message = { id: `u${Date.now()}`, role: "user", content: text, timestamp: Date.now() };
    dispatch({ type: "ADD_MESSAGE", payload: userMsg });
    await saveMessage(userMsg);

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_THINKING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const history = state.messages.slice(-10).map((m) => ({
        role: m.role === "ai" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // Simulate agentic steps
      dispatch({ type: "ADD_THINKING_STEP", payload: "Analyzing request..." });
      await new Promise(r => setTimeout(r, 400));
      dispatch({ type: "ADD_THINKING_STEP", payload: "Searching menu and preferences..." });

      const content = await chatWithAI(apiKey, text, history, systemPrompt);
      const { text: parsed, suggestedItems } = onParsed(content);

      const aiMsg: Message = {
        id: `a${Date.now()}`,
        role: "ai",
        content: parsed,
        timestamp: Date.now(),
        suggestedItems: suggestedItems.length > 0 ? suggestedItems : undefined,
      };

      dispatch({ type: "CLEAR_THINKING" });
      dispatch({ type: "ADD_MESSAGE", payload: aiMsg });
      await saveMessage(aiMsg);
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error";
      dispatch({ type: "SET_ERROR", payload: errorMsg });
      dispatch({ type: "SET_THINKING", payload: false });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [userId, state.messages, saveMessage]);

  const clearChat = useCallback(async () => {
    if (!userId) return;
    await remove(ref(db, `conversations/${userId}/${chatId}`));
    dispatch({ type: "SET_MESSAGES", payload: [] });
  }, [userId, chatId]);

  return {
    ...state,
    sendMessage,
    clearChat,
    dispatch
  };
}
