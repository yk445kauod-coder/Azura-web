import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Search, X, ChevronDown, Bot, Send, Loader2, Sparkles, Star } from "lucide-react";
import { chatWithAI } from "@/lib/aiService";

interface MenuItem {
  id: string; name: string; nameAr: string;
  description: string; descriptionAr: string;
  price: number; category: string; available: boolean; image: string;
}

interface AIMsg { role: "user" | "ai"; content: string; }

function normalizeItem(id: string, raw: Record<string, unknown>): MenuItem {
  return {
    id,
    name: String(raw.name || raw.nameEn || raw.title || ""),
    nameAr: String(raw.nameAr || raw.titleAr || ""),
    description: String(raw.description || raw.descEn || raw.desc || ""),
    descriptionAr: String(raw.descriptionAr || raw.descAr || ""),
    price: Number(raw.price) || 0,
    category: String(raw.category || "coffee"),
    available: raw.available !== false,
    image: String(raw.image || raw.img || ""),
  };
}

const CATS = [
  { id: "all",       emoji: "🍽️", en: "All",     ar: "الكل"    },
  { id: "coffee",    emoji: "☕",  en: "Coffee",  ar: "قهوة"    },
  { id: "food",      emoji: "🍴",  en: "Food",    ar: "طعام"    },
  { id: "beverages", emoji: "🥤",  en: "Drinks",  ar: "مشروبات" },
  { id: "desserts",  emoji: "🍰",  en: "Sweets",  ar: "حلويات"  },
  { id: "shisha",    emoji: "💨",  en: "Shisha",  ar: "شيشة"    },
];

const FALLBACK: Record<string, string> = {
  coffee:    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80",
  food:      "https://images.unsplash.com/photo-1568471173242-461f0a730452?w=500&q=80",
  beverages: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80",
  desserts:  "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&q=80",
  shisha:    "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?w=500",
};

function greeting(lang: "en" | "ar") {
  const h = new Date().getHours();
  if (h < 12) return lang === "ar" ? "صباح الخير ☀️" : "Good morning ☀️";
  if (h < 17) return lang === "ar" ? "طيب النهار 🌤️" : "Good afternoon 🌤️";
  return lang === "ar" ? "مساء النور 🌙" : "Good evening 🌙";
}

export default function MenuLightweight() {
  const { lang, isRTL } = useLang();
  const { user } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // AI Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<AIMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [aiConfig, setAiConfig] = useState({ systemPrompt: "", baristaFemale: "Zura", baristaMale: "Zure", groqKey: "" });
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const tr = useCallback((en: string, ar: string) => lang === "ar" ? ar : en, [lang]);

  // Load menu from Firebase
  useEffect(() => {
    const menuRef = ref(db, "menu");
    onValue(menuRef, (snap) => {
      if (!snap.exists()) { setLoading(false); return; }
      const data = snap.val() as Record<string, Record<string, unknown>>;
      const result: MenuItem[] = [];
      Object.entries(data).forEach(([key, val]) => {
        if (typeof val !== "object" || !val) return;
        const v = val as Record<string, unknown>;
        if (v.price !== undefined || v.name !== undefined) {
          result.push(normalizeItem(key, v));
        } else {
          Object.entries(v).forEach(([itemId, itemData]) => {
            if (typeof itemData === "object" && itemData)
              result.push(normalizeItem(itemId, itemData as Record<string, unknown>));
          });
        }
      });
      setItems(result);
      setLoading(false);
    });
    return () => off(ref(db, "menu"));
  }, []);

  // Load AI config
  useEffect(() => {
    const cfgRef = ref(db, "ai-config");
    onValue(cfgRef, (snap) => {
      if (!snap.exists()) return;
      const d = snap.val() as Record<string, unknown>;
      setAiConfig({
        systemPrompt: String(d.systemPrompt || ""),
        baristaFemale: String(d.baristaFemale || "Zura"),
        baristaMale: String(d.baristaMale || "Zure"),
        groqKey: "",
      });
    });
    const apiRef = ref(db, "api-settings");
    onValue(apiRef, (snap) => {
      if (!snap.exists()) return;
      const d = snap.val() as Record<string, unknown>;
      setAiConfig((prev) => ({ ...prev, groqKey: String(d.groqKey || "") }));
    });
    return () => { off(ref(db, "ai-config")); off(ref(db, "api-settings")); };
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, chatOpen]);

  const filtered = useMemo(() => items.filter((item) => {
    if (!item.available) return false;
    if (cat !== "all" && item.category !== cat) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.nameAr.includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  }), [items, cat, search]);

  const catCount = useCallback((c: string) => {
    if (c === "all") return items.filter((i) => i.available).length;
    return items.filter((i) => i.available && i.category === c).length;
  }, [items]);

  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput("");
    const userMsg: AIMsg = { role: "user", content: msg };
    setChatMsgs((prev) => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const history = chatMsgs.map((m) => ({
        role: m.role === "ai" ? "model" as const : "user" as const,
        parts: [{ text: m.content }],
      }));
      const baristaName = lang === "ar" ? aiConfig.baristaMale : aiConfig.baristaFemale;
      const { response } = await chatWithAI(aiConfig.groqKey, msg, history, aiConfig.systemPrompt, baristaName);
      setChatMsgs((prev) => [...prev, { role: "ai", content: response }]);
    } catch {
      setChatMsgs((prev) => [...prev, {
        role: "ai",
        content: tr("Sorry, I'm having trouble right now. Please try again!", "عذراً، أواجه مشكلة الآن. حاول مجدداً!")
      }]);
    }
    setChatLoading(false);
  };

  const openChat = () => {
    setChatOpen(true);
    if (chatMsgs.length === 0) {
      const name = lang === "ar" ? aiConfig.baristaMale : aiConfig.baristaFemale;
      setTimeout(() => {
        setChatMsgs([{
          role: "ai",
          content: tr(
            `Hi ${user?.name || "there"}! I'm ${name || "Zura"}, your AI barista 🌿 Ask me anything about our menu, ingredients, or recommendations!`,
            `أهلاً ${user?.name || ""}! أنا ${name || "زورا"} الباريستا الذكي 🌿 اسألني عن أي حاجة في المنيو أو توصيات!`
          )
        }]);
      }, 300);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Hero Header */}
      <div
        className="relative overflow-hidden px-4 pt-5 pb-6 mb-1"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(28,72%,32%) 100%)",
        }}
      >
        {/* Background texture */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative z-10">
          <p className="text-primary-foreground/70 text-xs font-semibold tracking-wide uppercase mb-1">
            {greeting(lang)}
          </p>
          <h1 className="text-2xl font-extrabold text-white mb-0.5" style={{ fontFamily: "var(--font-heading)", textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            {tr("Our Menu", "قائمتنا")}
          </h1>
          <p className="text-primary-foreground/60 text-xs">
            {tr(`${items.filter(i=>i.available).length} items available • Browse & enjoy`, `${items.filter(i=>i.available).length} عنصر متاح • تصفح واستمتع`)}
          </p>
        </div>

        {/* AI Chat bubble */}
        <button
          onClick={openChat}
          className="absolute top-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
          style={{
            [isRTL ? "left" : "right"]: "1rem",
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "white",
          }}
        >
          <Bot size={13} />
          {tr("Ask Zura", "اسأل زورا")}
          <Sparkles size={11} className="opacity-70" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 mb-3 -mt-3 relative z-10">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
        >
          <Search size={14} className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${isRTL ? "right-4" : "left-4"}`} />
          <input
            type="text"
            placeholder={tr("Search menu…", "ابحث في المنيو…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full py-3 text-sm bg-card ${isRTL ? "pr-10 pl-10" : "pl-10 pr-10"}`}
            style={{ outline: "none", border: "none" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-3" : "right-3"} p-1 rounded-full hover:bg-muted`}>
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto px-4 mb-4 pb-1 scrollbar-none">
        {CATS.map((c) => {
          const active = cat === c.id;
          const count = catCount(c.id);
          return (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${active ? "scale-105" : "active:scale-95"}`}
              style={active
                ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", boxShadow: "var(--shadow-primary)" }
                : { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", boxShadow: "var(--shadow-xs)", border: "1px solid rgba(93,62,35,0.08)" }
              }
            >
              <span>{c.emoji}</span>
              {lang === "ar" ? c.ar : c.en}
              {count > 0 && (
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Items Grid */}
      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)" }}>
                <div className="h-32 animate-pulse" style={{ background: "hsl(var(--muted))" }} />
                <div className="p-3 space-y-2">
                  <div className="h-3 rounded animate-pulse" style={{ background: "hsl(var(--muted))", width: "70%" }} />
                  <div className="h-2.5 rounded animate-pulse" style={{ background: "hsl(var(--muted))", width: "50%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">{search ? "🔍" : "🍽️"}</div>
            <p className="font-bold text-primary text-base mb-1">
              {search ? tr("Nothing found", "مفيش نتيجة") : tr("Nothing here yet", "لا يوجد عناصر")}
            </p>
            <p className="text-sm text-muted-foreground">
              {search ? tr("Try another keyword", "جرب كلمة أخرى") : tr("Check back soon!", "قريباً!")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => {
              const imgSrc = item.image || FALLBACK[item.category] || FALLBACK.coffee;
              const catInfo = CATS.find((c) => c.id === item.category);
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="text-left rounded-2xl overflow-hidden flex flex-col transition-all active:scale-[0.97]"
                  style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)" }}
                >
                  <div className="relative overflow-hidden bg-muted" style={{ paddingTop: "65%" }}>
                    <img
                      src={imgSrc}
                      alt={item.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK[item.category] || FALLBACK.coffee; }}
                    />
                    {/* Category badge */}
                    <span
                      className="absolute top-2 px-2 py-0.5 text-[10px] font-bold text-white rounded-full"
                      style={{ [isRTL ? "right" : "left"]: "8px", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
                    >
                      {catInfo?.emoji} {lang === "ar" ? catInfo?.ar : catInfo?.en}
                    </span>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-bold text-sm text-foreground leading-tight">{item.name}</h3>
                    {item.nameAr && <p className="text-[11px] text-muted-foreground mt-0.5">{item.nameAr}</p>}
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mt-1 flex-1">
                        {item.description}
                      </p>
                    )}
                    <div className="mt-2 pt-1.5 border-t border-border/30">
                      <span className="font-extrabold text-primary text-[15px] leading-none">
                        {item.price} {lang === "ar" ? "ج.م" : "EGP"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ITEM DETAIL MODAL ── */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl overflow-hidden"
            style={{ background: "hsl(var(--background))", animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)", maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative h-52 overflow-hidden">
              <img
                src={selectedItem.image || FALLBACK[selectedItem.category] || FALLBACK.coffee}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }} />
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto" style={{ maxHeight: "50vh" }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <h2 className="text-xl font-extrabold text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                    {selectedItem.name}
                  </h2>
                  {selectedItem.nameAr && (
                    <p className="text-base text-muted-foreground mt-0.5">{selectedItem.nameAr}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-extrabold text-primary">{selectedItem.price}</p>
                  <p className="text-xs text-muted-foreground">{lang === "ar" ? "ج.م" : "EGP"}</p>
                </div>
              </div>

              {(selectedItem.description || selectedItem.descriptionAr) && (
                <div className="space-y-1.5 mt-3">
                  {selectedItem.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedItem.description}</p>
                  )}
                  {selectedItem.descriptionAr && (
                    <p className="text-sm text-muted-foreground leading-relaxed" dir="rtl">{selectedItem.descriptionAr}</p>
                  )}
                </div>
              )}

              {!selectedItem.available && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-semibold text-center">
                  {tr("Currently unavailable", "غير متاح حالياً")}
                </div>
              )}

              {/* Ask AI */}
              <button
                onClick={() => { setSelectedItem(null); setChatInput(tr(`Tell me about ${selectedItem.name}`, `قولي عن ${selectedItem.nameAr || selectedItem.name}`)); openChat(); }}
                className="w-full mt-4 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--primary))" }}
              >
                <Bot size={15} />
                {tr("Ask AI about this item", "اسأل الذكاء الاصطناعي عن هذا العنصر")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI CHAT PANEL ── */}
      {chatOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          dir={isRTL ? "rtl" : "ltr"}
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setChatOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 flex flex-col rounded-t-3xl overflow-hidden"
            style={{ background: "hsl(var(--background))", maxHeight: "75vh", animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Chat Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(28,72%,32%) 100%)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{lang === "ar" ? aiConfig.baristaMale : aiConfig.baristaFemale || "Zura"}</p>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-white/70 text-[10px]">{tr("AI Barista Online", "البارستا الذكي متاح")}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: "200px" }}>
              {chatMsgs.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🤖</div>
                  <p className="text-muted-foreground text-sm">{tr("Say hi to your AI barista!", "قول أهلاً للبارستا الذكي!")}</p>
                </div>
              )}
              {chatMsgs.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? (isRTL ? "justify-start" : "justify-end") : (isRTL ? "justify-end" : "justify-start")}`}>
                  {msg.role === "ai" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-auto mb-0.5 mx-2">
                      <Bot size={14} className="text-primary" />
                    </div>
                  )}
                  <div
                    className="max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={msg.role === "user"
                      ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderRadius: isRTL ? "1rem 1rem 1rem 0.25rem" : "1rem 1rem 0.25rem 1rem" }
                      : { background: "hsl(var(--muted))", color: "hsl(var(--foreground))", borderRadius: isRTL ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem" }
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className={`flex ${isRTL ? "justify-end" : "justify-start"} items-end gap-2`}>
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot size={14} className="text-primary" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl" style={{ background: "hsl(var(--muted))" }}>
                    <div className="flex gap-1">
                      {[0,1,2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick prompts */}
            {chatMsgs.length <= 1 && (
              <div className="px-4 pb-2">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    tr("What's popular?", "إيه الأكثر طلباً؟"),
                    tr("Recommend a coffee", "أنصحني بقهوة"),
                    tr("Any vegan options?", "في خيارات نباتية؟"),
                    tr("Best desserts?", "أحسن حلويات؟"),
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => { setChatInput(prompt); }}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95"
                      style={{ background: "hsl(var(--muted))", color: "hsl(var(--primary))", border: "1px solid rgba(93,62,35,0.15)" }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-6 pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
              <div className="flex gap-2 items-end">
                <input
                  type="text"
                  placeholder={tr("Ask about the menu…", "اسأل عن المنيو…")}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                  className="flex-1 px-4 py-3 rounded-2xl text-sm"
                  style={{ background: "hsl(var(--muted))", outline: "none", border: "none" }}
                  autoFocus
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                >
                  {chatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0.8; }
          to { transform: translateY(0); opacity: 1; }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
