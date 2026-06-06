import { useState, useRef, useEffect, useCallback } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useBarista } from "@/contexts/BaristaContext";
import { useTTS } from "@/hooks/useTTS";
import { useSTT } from "@/hooks/useSTT";
import { db, ref, onValue, off } from "@/lib/firebase";
import { Send, Mic, MicOff, Volume2, VolumeX, Plus, RefreshCw } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: number;
  suggestedItem?: { id: string; name: string; nameAr: string; price: number; image: string; category: string };
}

interface RawMenuItem {
  name?: string; nameEn?: string; nameAr?: string;
  price?: number; category?: string; image?: string; img?: string;
  available?: boolean;
}

interface MenuItem {
  id: string; name: string; nameAr: string; price: number;
  category: string; image: string;
}

function normalizeItem(id: string, raw: RawMenuItem): MenuItem {
  return {
    id,
    name: raw.name || raw.nameEn || "",
    nameAr: raw.nameAr || "",
    price: Number(raw.price) || 0,
    category: raw.category || "coffee",
    image: raw.image || raw.img || "",
  };
}

export default function AIBarista() {
  const { lang, isRTL } = useLang();
  const { addItem } = useCart();
  const { baristaName, baristaAvatar, persona } = useBarista();

  const { enabled: ttsEnabled, toggle: toggleTTS, speak, speaking } = useTTS(lang, persona);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [greeted, setGreeted] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load AI settings from Firebase
  useEffect(() => {
    const apiRef = ref(db, "api-settings");
    onValue(apiRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val() as Record<string, unknown>;
        setAiEnabled(data.aiEnabled !== false);
      }
    });
  }, []);

  const handleSTTResult = useCallback((text: string) => {
    setInput((prev) => prev ? `${prev} ${text}` : text);
  }, []);
  const { listening, supported: sttSupported, start: startSTT, stop: stopSTT } = useSTT(lang, handleSTTResult);

  // Load menu items
  useEffect(() => {
    const menuRef = ref(db, "menu");
    onValue(menuRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, Record<string, unknown>>;
      const result: MenuItem[] = [];
      Object.entries(data).forEach(([key, val]) => {
        if (typeof val !== "object" || val === null) return;
        const v = val as Record<string, unknown>;
        if (v.price !== undefined || v.name !== undefined || v.nameEn !== undefined) {
          result.push(normalizeItem(key, v as RawMenuItem));
        } else {
          Object.entries(v).forEach(([subId, subVal]) => {
            if (typeof subVal === "object" && subVal !== null)
              result.push(normalizeItem(subId, subVal as RawMenuItem));
          });
        }
      });
      setMenuItems(result);
    });

    const cfgRef = ref(db, "ai-config");
    onValue(cfgRef, (snap) => {
      if (snap.exists()) {
        const cfg = snap.val() as Record<string, string>;
        setSystemPrompt(lang === "ar" ? (cfg.systemPromptAr || cfg.systemPrompt) : cfg.systemPrompt);
      }
    });

    return () => { off(ref(db, "menu")); off(ref(db, "ai-config")); };
  }, [lang]);

  // Initial greeting
  useEffect(() => {
    if (menuItems.length === 0 || greeted) return;
    const greeting = lang === "ar"
      ? `أهلاً! أنا ${baristaName}، باريستاك في أزورا 👋 إيه اللي تحب تطلبه النهارده؟`
      : `Hi! I'm ${baristaName}, your barista at Azura! ☕ What can I get you today?`;
    setMessages([{ id: "greeting", role: "ai", content: greeting, timestamp: Date.now() }]);
    setGreeted(true);
    if (ttsEnabled) setTimeout(() => speak(greeting), 600);
  }, [menuItems.length, lang, greeted]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const buildSystemPrompt = () => {
    const menuCtx = menuItems.slice(0, 30)
      .map((i) => `- ${i.name}${i.nameAr ? ` (${i.nameAr})` : ""}: ${i.price} EGP [ID:${i.id}]`)
      .join("\n");
    return `${systemPrompt || `You are ${baristaName}, a ${persona === "female" ? "female" : "male"} AI barista at Azura Cafe & Restaurant, Tivoli Dome, Alexandria, Egypt. Be warm, friendly, and concise (2-4 sentences). When the user speaks Arabic, respond in Egyptian dialect (عامية مصرية). When recommending items, end with [SUGGEST:itemId:price] to suggest adding to cart.`}\n\nMenu:\n${menuCtx}`;
  };

  const parseMessage = (raw: string) => {
    // 1. Extract SUGGEST tag if present
    const m = raw.match(/\[SUGGEST:([^:\]]+)(?::(\d+))?\]/);
    let suggestedItem: MenuItem | undefined;
    let text = raw;
    if (m) {
      const itemId = m[1];
      suggestedItem = menuItems.find((i) => i.id === itemId);
      text = raw.replace(m[0], "");
    }
    // 2. Strip ALL remaining [TAG:...] internal markers
    text = text.replace(/\[[A-Z_]+:[^\]]*\]/g, "");
    // 3. Strip any accidental markdown code fences or JSON leakage
    text = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
    // 4. Collapse multiple blank lines
    text = text.replace(/\n{3,}/g, "\n\n").trim();
    return { text, suggestedItem };
  };

  const sendMessage = async (msgText?: string) => {
    const text = (msgText || input).trim();
    if (!text || loading) return;

    if (!aiEnabled) {
      const err: Message = {
        id: `e${Date.now()}`,
        role: "ai",
        content: lang === "ar" 
          ? "عذراً، خدمة الذكاء الاصطناعي غير مُفعّلة حالياً. تواصل مع الإدارة." 
          : "Sorry, AI service is currently disabled. Please contact admin.",
        timestamp: Date.now(),
      };
      setMessages((p) => [...p, err]);
      return;
    }

    const userMsg: Message = { id: `u${Date.now()}`, role: "user", content: text, timestamp: Date.now() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role === "ai" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // Call our Cloudflare Function - API key is hidden in the server
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          systemPrompt: buildSystemPrompt(),
          language: lang,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'API error' }));
        throw new Error(errData.error || 'API error');
      }

      const { content } = await res.json() as { content: string };
      const { text: parsed, suggestedItem } = parseMessage(content);
      
      const aiMsg: Message = {
        id: `a${Date.now()}`,
        role: "ai",
        content: parsed,
        timestamp: Date.now(),
        suggestedItem: suggestedItem ? {
          id: suggestedItem.id,
          name: suggestedItem.name,
          nameAr: suggestedItem.nameAr,
          price: suggestedItem.price,
          image: suggestedItem.image,
          category: suggestedItem.category,
        } : undefined,
      };
      setMessages((p) => [...p, aiMsg]);
      if (ttsEnabled) speak(parsed);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      const err: Message = {
        id: `e${Date.now()}`,
        role: "ai",
        content: lang === "ar" 
          ? `عذراً، في مشكلة: ${errMsg}` 
          : `Sorry, something went wrong: ${errMsg}`,
        timestamp: Date.now(),
      };
      setMessages((p) => [...p, err]);
    }
    setLoading(false);
  };

  const quickPrompts =
    lang === "ar"
      ? ["إيه الأحسن عندكم؟", "أنصحني بقهوة", "عندكم إيه حلو؟", "هاتلي حاجة بارده"]
      : ["What's your best coffee?", "Something sweet please!", "What's popular today?", "I want an iced drink"];

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] max-w-2xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="card rounded-2xl px-3 py-2.5 flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <img src={baristaAvatar} alt={baristaName} className="w-11 h-11 rounded-full object-cover object-top" style={{ boxShadow: "var(--shadow-sm)" }} />
            <span className="badge-online absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-primary text-sm leading-tight">{baristaName}</p>
            <p className="text-[11px] text-muted-foreground">
              {lang === "ar" ? "باريستا أزورا · متصل الآن" : "Azura Barista · Online"}
            </p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={toggleTTS} className={`btn-icon w-8 h-8 transition-all ${ttsEnabled ? "text-primary" : "text-muted-foreground"}`}>
              {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <button onClick={() => { setMessages([]); setGreeted(false); }} className="btn-icon w-8 h-8 text-muted-foreground hover:text-foreground">
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 scroll-hide">
        {messages.length === 0 && !loading && (
          <div className="flex flex-wrap gap-2 mt-3">
            {quickPrompts.map((p) => (
              <button key={p} onClick={() => sendMessage(p)} className="chip chip-inactive text-xs">
                {p}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${
              msg.role === "user"
                ? (isRTL ? "justify-start" : "justify-end")
                : (isRTL ? "justify-end" : "justify-start")
            }`}
          >
            {msg.role === "ai" && (
              <img src={baristaAvatar} alt={baristaName} className="w-7 h-7 rounded-full object-cover object-top flex-shrink-0 mb-1" />
            )}
            <div className="max-w-[80%] space-y-2">
              <div className={`px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bubble-user" : "bubble-ai"}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.suggestedItem && (
                <div className="card rounded-xl p-2.5 flex items-center gap-2.5">
                  <img
                    src={msg.suggestedItem.image || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=80&q=60"}
                    alt={msg.suggestedItem.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=80&q=60"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary truncate">
                      {lang === "ar" ? (msg.suggestedItem.nameAr || msg.suggestedItem.name) : msg.suggestedItem.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{msg.suggestedItem.price} {lang === "ar" ? "ج.م" : "EGP"}</p>
                  </div>
                  <button
                    onClick={() => addItem({ ...msg.suggestedItem! })}
                    className="btn-primary w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ padding: 0 }}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className={`flex items-end gap-2 ${isRTL ? "justify-end" : "justify-start"}`}>
            <img src={baristaAvatar} alt={baristaName} className="w-7 h-7 rounded-full object-cover object-top flex-shrink-0" />
            <div className="bubble-ai px-4 py-3">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground dot-pulse" style={{ animationDelay: `${i * 0.22}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-3 pt-2 flex-shrink-0">
        <div className="card rounded-2xl flex items-end gap-2 p-2">
          {sttSupported && (
            <button
              onPointerDown={startSTT}
              onPointerUp={stopSTT}
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                listening
                  ? "bg-red-500 text-white"
                  : "btn-ghost text-muted-foreground hover:text-primary"
              }`}
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={lang === "ar" ? "اكتب رسالة..." : "Type a message..."}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none min-h-[36px] py-2 px-1"
            dir={isRTL ? "rtl" : "ltr"}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              input.trim() && !loading ? "btn-primary" : "text-muted-foreground opacity-40"
            }`}
            style={input.trim() && !loading ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", boxShadow: "var(--shadow-primary)" } : {}}
          >
            <Send size={15} />
          </button>
        </div>
        {speaking && (
          <p className="text-center text-[10px] text-muted-foreground mt-1">
            🔊 {lang === "ar" ? "جاري الكلام..." : "Speaking..."}
          </p>
        )}
      </div>
    </div>
  );
}
