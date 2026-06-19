import { useState, useEffect, useRef, useCallback } from "react";
import { db, ref, get, onValue } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import {
  Bot, Send, Loader2, Users, Star,
  RefreshCw, XCircle, BookOpen, ExternalLink,
  Sparkles, TrendingUp, MessageCircle, Lightbulb,
} from "lucide-react";

interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface CafeData {
  menuItems: { id: string; name: string; nameAr: string; price: number; category: string }[];
  feedback: { rating: number; comment: string; createdAt: number }[];
  users: { uid: string; name: string; tableNumber: string; lastLogin: number }[];
  suggestions: { itemName: string; status: string; createdAt: number }[];
  broadcasts: number;
}

const CAFE = { name: "Azura Café & Restaurant", location: "Tivoli Dome, Alexandria, Egypt" };

async function generateAdminResponse(userInput: string, data: CafeData, lang: string): Promise<string> {
  const isArabic = lang === "ar";

  const avgRating = data.feedback.length
    ? (data.feedback.reduce((s, f) => s + f.rating, 0) / data.feedback.length).toFixed(1)
    : "N/A";

  const contextBlock = JSON.stringify({
    cafe: CAFE,
    menu: { totalItems: data.menuItems.length, categories: [...new Set(data.menuItems.map(m => m.category))] },
    feedback: { count: data.feedback.length, avgRating, recentComments: data.feedback.slice(0, 5).map(f => f.comment) },
    visitors: { total: data.users.length, recentNames: data.users.slice(0, 5).map(u => u.name) },
    pendingSuggestions: data.suggestions.filter(s => s.status === "pending").length,
    broadcasts: data.broadcasts,
  }, null, 2);

  const prompt = `You are a sovereign AI business intelligence assistant for ${CAFE.name} (${CAFE.location}).

LIVE BUSINESS DATA:
${contextBlock}

USER QUESTION: ${userInput}

RULES:
- Respond ONLY in ${isArabic ? "Egyptian Arabic (Egyptian dialect, friendly)" : "English (concise, professional)"}
- Provide actionable insights based on REAL data above
- Use emojis to structure the response
- Do NOT mention ordering or cart functionality — the cafe uses a display-only menu
- Be a strategic advisor: suggest improvements, identify trends, flag issues
- Keep response focused and under 250 words`;

  try {
    const encoded = encodeURIComponent(prompt.slice(0, 3500));
    const url = `https://text.pollinations.ai/${encoded}?model=openai&seed=${Date.now() % 9999}`;
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 22000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`${res.status}`);
    const text = (await res.text()).trim();
    if (text.length < 10) throw new Error("empty");
    return text;
  } catch {
    if (isArabic) return `عذراً، الذكاء الاصطناعي مشغول الآن. البيانات الحالية: ${data.menuItems.length} عنصر في القائمة، ${data.feedback.length} تقييم بمتوسط ${avgRating} نجمة، ${data.users.length} زائر.`;
    return `Sorry, AI is busy. Current snapshot: ${data.menuItems.length} menu items, ${data.feedback.length} reviews (avg ${avgRating}★), ${data.users.length} visitors.`;
  }
}

export default function AIAdminAssistant() {
  const { lang } = useLang();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cafeData, setCafeData] = useState<CafeData>({ menuItems: [], feedback: [], users: [], suggestions: [], broadcasts: 0 });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  const loadData = useCallback(async () => {
    setDataLoaded(false);
    try {
      const [menuSnap, feedbackSnap, usersSnap, suggestSnap, bcastSnap] = await Promise.all([
        get(ref(db, "menu")),
        get(ref(db, "feedback")),
        get(ref(db, "userLogs")),
        get(ref(db, "suggestions")),
        get(ref(db, "broadcast")),
      ]);

      const menuItems: CafeData["menuItems"] = [];
      if (menuSnap.exists()) {
        const d = menuSnap.val() as Record<string, unknown>;
        Object.entries(d).forEach(([cat, val]) => {
          if (typeof val === "object" && val) {
            Object.entries(val as Record<string, unknown>).forEach(([id, item]) => {
              if (item && typeof item === "object") {
                const i = item as Record<string, unknown>;
                menuItems.push({ id, name: String(i.name || ""), nameAr: String(i.nameAr || ""), price: Number(i.price) || 0, category: cat });
              }
            });
          }
        });
      }

      const feedback: CafeData["feedback"] = [];
      if (feedbackSnap.exists()) {
        const d = feedbackSnap.val() as Record<string, Record<string, unknown>>;
        Object.values(d).forEach((f) => feedback.push({ rating: Number(f.rating) || 0, comment: String(f.comment || ""), createdAt: Number(f.createdAt) || 0 }));
        feedback.sort((a, b) => b.createdAt - a.createdAt);
      }

      const users: CafeData["users"] = [];
      if (usersSnap.exists()) {
        const d = usersSnap.val() as Record<string, Record<string, unknown>>;
        const seen = new Set<string>();
        Object.values(d).forEach((log) => {
          const uid = String(log.uid || "");
          if (!seen.has(uid)) {
            seen.add(uid);
            users.push({ uid, name: String(log.name || ""), tableNumber: String(log.tableNumber || ""), lastLogin: Number(log.timestamp) || 0 });
          }
        });
        users.sort((a, b) => b.lastLogin - a.lastLogin);
      }

      const suggestions: CafeData["suggestions"] = [];
      if (suggestSnap.exists()) {
        const d = suggestSnap.val() as Record<string, Record<string, unknown>>;
        Object.values(d).forEach((s) => suggestions.push({ itemName: String(s.itemName || ""), status: String(s.status || "pending"), createdAt: Number(s.createdAt) || 0 }));
      }

      const broadcasts = bcastSnap.exists() ? Object.keys(bcastSnap.val()).length : 0;

      setCafeData({ menuItems, feedback, users, suggestions, broadcasts });
      setDataLoaded(true);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      setDataLoaded(true);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const avgRating = cafeData.feedback.length
      ? (cafeData.feedback.reduce((s, f) => s + f.rating, 0) / cafeData.feedback.length).toFixed(1)
      : "—";

    const welcome = lang === "ar"
      ? `🤖 أهلاً! أنا مساعد أزورا الذكي المتكامل\n\n☕ ${CAFE.name}\n📍 ${CAFE.location}\n\n📊 ملخص سريع:\n• 🍽️ ${cafeData.menuItems.length} عنصر في القائمة\n• ⭐ متوسط التقييم: ${avgRating}\n• 👥 ${cafeData.users.length} زائر مسجل\n• 💬 ${cafeData.feedback.length} تقييم\n\n⚡ جرب:\n• "ما هي أكثر التقييمات سلبية؟"\n• "اقتراحات لتحسين الخدمة"\n• "اعرض لي تقرير كامل"\n• "من هم أكثر الزوار؟"`
      : `🤖 Hi! I'm Azura's Sovereign AI Assistant\n\n☕ ${CAFE.name}\n📍 ${CAFE.location}\n\n📊 Live Snapshot:\n• 🍽️ ${cafeData.menuItems.length} menu items\n• ⭐ Avg rating: ${avgRating}\n• 👥 ${cafeData.users.length} registered visitors\n• 💬 ${cafeData.feedback.length} reviews\n\n⚡ Try asking:\n• "Show me negative feedback trends"\n• "Suggestions to improve service"\n• "Give me a full business report"\n• "Who are my top visitors?"`;

    setMessages([{ id: "welcome", role: "assistant", content: welcome, timestamp: Date.now() }]);
  }, [lang, dataLoaded]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg: AIMessage = { id: Date.now().toString(), role: "user", content: input.trim(), timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    const q = input.trim();
    setInput("");
    setLoading(true);
    try {
      const response = await generateAdminResponse(q, cafeData, lang);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: response, timestamp: Date.now() }]);
    } catch {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: tr("Error. Try again.", "خطأ. حاول مجدداً."), timestamp: Date.now() }]);
    }
    setLoading(false);
  }, [input, loading, cafeData, lang]);

  const QUICK_PROMPTS = [
    { en: "Business report", ar: "تقرير شامل" },
    { en: "Review analysis", ar: "تحليل التقييمات" },
    { en: "Top visitors", ar: "أكثر الزوار" },
    { en: "Improvement tips", ar: "نصائح التحسين" },
    { en: "Menu insights", ar: "رؤى القائمة" },
  ];

  const avgRating = cafeData.feedback.length
    ? (cafeData.feedback.reduce((s, f) => s + f.rating, 0) / cafeData.feedback.length).toFixed(1)
    : "—";

  return (
    <div className="flex flex-col rounded-2xl border overflow-hidden" style={{ height: "580px", background: "hsl(var(--background))" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.12) 0%, transparent 100%)" }}>
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <Bot size={16} className="text-primary" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
              <Sparkles size={7} className="text-white" />
            </span>
          </div>
          <div>
            <p className="font-bold text-sm">{tr("Sovereign AI", "الذكاء الاصطناعي")}</p>
            <p className="text-[10px] text-muted-foreground">{tr("Powered by Pollinations AI", "مشغّل بـ Pollinations AI")}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowMenu(!showMenu)} className={`p-1.5 rounded-lg transition-colors ${showMenu ? "bg-primary/15 text-primary" : "hover:bg-muted"}`}>
            <BookOpen size={14} />
          </button>
          <button onClick={() => { loadData(); }} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title={tr("Refresh data", "تحديث البيانات")}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Menu iframe */}
      {showMenu && (
        <div className="border-b bg-muted/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">{tr("Digital Menu Preview", "معاينة القائمة الرقمية")}</span>
            <div className="flex gap-1">
              <a href="https://azura-menu.pages.dev" target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-muted rounded transition-colors">
                <ExternalLink size={12} />
              </a>
              <button onClick={() => setShowMenu(false)} className="p-1 hover:bg-muted rounded transition-colors">
                <XCircle size={12} />
              </button>
            </div>
          </div>
          <div className="w-full h-40 rounded-xl overflow-hidden border bg-white">
            <iframe src="https://azura-menu.pages.dev" className="w-full h-full" title="Azura Menu" />
          </div>
        </div>
      )}

      {/* Live stats bar */}
      {!showMenu && (
        <div className="flex gap-4 px-4 py-2 border-b overflow-x-auto" style={{ background: "hsl(var(--muted)/0.4)" }}>
          {[
            { icon: <Star size={11} className="text-yellow-500" />, val: avgRating, label: tr("Rating", "تقييم") },
            { icon: <Users size={11} className="text-blue-500" />, val: cafeData.users.length, label: tr("Visitors", "زوار") },
            { icon: <MessageCircle size={11} className="text-green-500" />, val: cafeData.feedback.length, label: tr("Reviews", "آراء") },
            { icon: <Lightbulb size={11} className="text-purple-500" />, val: cafeData.suggestions.filter(s => s.status === "pending").length, label: tr("Ideas", "أفكار") },
            { icon: <TrendingUp size={11} className="text-primary" />, val: cafeData.menuItems.length, label: tr("Items", "عناصر") },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-1 flex-shrink-0 text-[11px]">
              {stat.icon}
              <span className="font-bold">{stat.val}</span>
              <span className="text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-auto mb-0.5 mr-1.5">
                <Bot size={12} className="text-primary" />
              </div>
            )}
            <div
              className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] whitespace-pre-wrap leading-relaxed"
              style={msg.role === "user"
                ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderRadius: "1rem 1rem 0.25rem 1rem" }
                : { background: "hsl(var(--muted))", color: "hsl(var(--foreground))", borderRadius: "1rem 1rem 1rem 0.25rem" }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-end gap-1.5">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot size={12} className="text-primary" />
            </div>
            <div className="px-4 py-3 rounded-2xl" style={{ background: "hsl(var(--muted))" }}>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-3 pb-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => { setInput(tr(p.en, p.ar)); }}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all active:scale-95"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--primary))", border: "1px solid rgba(93,62,35,0.12)" }}
              >
                {tr(p.en, p.ar)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={tr("Ask me anything about Azura…", "اسألني أي شيء عن أزورا…")}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm"
            style={{ background: "hsl(var(--muted))", outline: "none", border: "none" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all active:scale-95"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
