import { useState, useRef, useEffect, useCallback } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useBarista } from "@/contexts/BaristaContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { db, ref, onValue, off, set, remove } from "@/lib/firebase";
import { decryptKey, isValidApiKey, chatWithAI } from "@/lib/crypto";
import { fullMenuData } from "@/lib/fullMenu";
import { Send, Eye, RefreshCw, ArrowLeft, Check, Instagram, Star, Zap, Coffee, Heart, Share2 } from "lucide-react";

interface SuggestedItem {
  id: string; name: string; nameAr: string; price: number; image: string; category: string;
}

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: number;
  suggestedItems?: SuggestedItem[];
  action?: "view_menu";
}

interface RawMenuItem {
  name?: string; nameEn?: string; nameAr?: string;
  price?: number; category?: string; image?: string; img?: string;
  available?: boolean; description?: string; descriptionAr?: string;
  ingredients?: any; ingredientsAr?: any;
}

interface MenuItem {
  id: string; name: string; nameAr: string; price: number;
  category: string; image: string; ingredients?: string; ingredientsAr?: string;
  description?: string; descriptionAr?: string; available: boolean;
}

function normalizeItem(id: string, raw: RawMenuItem): MenuItem {
  return {
    id,
    name: raw.name || raw.nameEn || "",
    nameAr: raw.nameAr || "",
    price: Number(raw.price) || 0,
    category: raw.category || "coffee",
    image: raw.image || raw.img || "",
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients.join(", ") : (raw.ingredients || ""),
    ingredientsAr: Array.isArray(raw.ingredientsAr) ? raw.ingredientsAr.join(", ") : (raw.ingredientsAr || ""),
    description: raw.description || "",
    descriptionAr: raw.descriptionAr || "",
    available: raw.available !== false,
  };
}

// Convert fullMenuData to flat array for initial state/fallback
const STATIC_MENU: MenuItem[] = Object.entries(fullMenuData).flatMap(([catId, items]) =>
  Object.entries(items).map(([id, item]) => ({
    id,
    name: item.name,
    nameAr: item.nameAr,
    price: item.price,
    category: catId,
    image: item.image,
    ingredients: item.ingredients?.join(", "),
    ingredientsAr: item.ingredientsAr?.join(", "),
    description: item.description,
    descriptionAr: item.descriptionAr,
    available: item.available !== false,
  }))
);

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-primary">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-secondary">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-black mt-4 mb-2 text-primary">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-black mt-5 mb-3 text-primary">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-xl font-black mt-6 mb-4 text-primary">$1</h1>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1 list-disc pl-1">$1</li>')
    // Instagram handle
    .replace(/@azuracafeegy/gi, '<a href="https://instagram.com/azuracafeegy" target="_blank" class="text-pink-500 font-bold underline">@azuracafeegy</a>')
    // Line breaks
    .replace(/\n/g, '<br/>');
}

export default function AIBarista() {
  const { lang, isRTL } = useLang();
  const { baristaName, baristaAvatar, instagram, cafeInfo } = useBarista();
  const [, navigate] = useLocation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(STATIC_MENU);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [greetingMsg, setGreetingMsg] = useState("");
  const [greeted, setGreeted] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [egyKey, setEgyKey] = useState("");
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const chatRef = ref(db, `conversations/${user.uid}/barista`);
    onValue(chatRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val() as Record<string, Message>;
        const sortedMessages = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(sortedMessages);
      } else {
        setMessages([]);
      }
    });
    return () => off(chatRef);
  }, [user]);

  const saveMessageToFirebase = async (msg: Message) => {
    if (!user) return;
    const msgRef = ref(db, `conversations/${user.uid}/barista/${msg.id}`);
    const sanitizedMsg = {
      ...msg,
      suggestedItems: msg.suggestedItems || null
    };
    await set(msgRef, sanitizedMsg);
  };

  const clearAddedAnimation = (id: string) => {
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1500);
  };

  useEffect(() => {
    const apiRef = ref(db, "api-settings");
    const unsubscribe = onValue(apiRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val() as Record<string, unknown>;
        const storedKey = (data.groqKey || data.geminiKey) as string;
        if (!storedKey) {
          setEgyKey("");
        } else {
          const decrypted = decryptKey(storedKey);
          if (decrypted && isValidApiKey(decrypted)) {
            setEgyKey(decrypted);
          } else if (isValidApiKey(storedKey)) {
            setEgyKey(storedKey);
          } else {
            setEgyKey("");
          }
        }
        setAiEnabled(data.aiEnabled !== false);
      }
    });
    return () => unsubscribe();
  }, []);

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
        setGreetingMsg(lang === "ar" ? (cfg.greetingAr || cfg.greeting) : cfg.greeting);
      }
    });

    return () => { off(ref(db, "menu")); off(ref(db, "ai-config")); };
  }, [lang]);

  useEffect(() => {
    if (menuItems.length === 0 || greeted) return;
    const defaultGreeting = lang === "ar"
      ? `مرحباً! أنا ${baristaName}! كيف يمكنني مساعدتك اليوم؟ يسعدني مساعدتك في اختيار أفضل ما في قائمتنا!`
      : `Hi! I'm ${baristaName}! What can I get for you today? I'm here to help you explore our full menu!`;

    const greeting = greetingMsg || defaultGreeting;
    setMessages([{ id: "greeting", role: "ai", content: greeting, timestamp: Date.now() }]);
    setGreeted(true);
  }, [menuItems.length, lang, greeted, baristaName, greetingMsg]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const buildSystemPrompt = () => {
    // Group items by category for better context, filtering unavailable items
    const byCategory = menuItems
      .filter(i => i.available)
      .reduce((acc, item) => {
        const cat = item.category || "other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {} as Record<string, MenuItem[]>);
    
    const menuCtx = Object.entries(byCategory)
      .map(([cat, items]) => `=== ${cat.toUpperCase()} ===\n` + 
        items.map((i) => {
          const details = lang === "ar"
            ? `${i.nameAr || i.name}${i.descriptionAr ? `: ${i.descriptionAr}` : ""}${i.ingredientsAr ? ` (المكونات: ${i.ingredientsAr})` : ""}`
            : `${i.name}${i.description ? `: ${i.description}` : ""}${i.ingredients ? ` (Ingredients: ${i.ingredients})` : ""}`;
          return `• [ID: ${i.id}] ${details}`;
        })
        .join("\n"))
      .join("\n");

    const isArabic = lang === "ar";
    const langInstruction = isArabic
      ? `IMPORTANT: RESPOND IN FLUENT EGYPTIAN ARABIC (عامية مصرية أصيلة). Use warm, local Alexandria-style hospitality. Keep it professional yet very friendly.`
      : `IMPORTANT: RESPOND IN NATURAL, SOPHISTICATED ENGLISH. Be warm and professional like a high-end Alexandrian cafe host.`;

    const userName = user?.displayName || user?.email?.split('@')[0] || (isArabic ? "صديقي" : "friend");
    
    const defaultPrompt = `You are ${baristaName}, the friendly and knowledgeable AI barista at ${cafeInfo.name}.

📍 Location: ${cafeInfo.location}
⏰ Hours: ${cafeInfo.hours}
📱 Instagram: ${instagram}
📞 Phone: ${cafeInfo.phone}

CURRENT USER: ${userName}

## PERSONALITY & LANGUAGE
- Warm, welcoming, and genuinely passionate about coffee and food.
- ${langInstruction}
- You speak naturally - not robotic, but like a knowledgeable friend.
- You are a proactive SALES AGENT: Your goal is to guide guests to our signature high-margin items like Turkish Coffee (Single/Double), Azura Plate, and special Mocktails.
- Use a proactive approach: "Would you like some almond milk with that?" or "That pairs perfectly with our croissant!"
- Avoid robotic or repetitive phrases. Match the user's energy.

## EXAMPLES OF GOOD CONVERSATION:
${isArabic ? `
User: "عاوز قهوة"
Good response: "يا ${userName}! ☕ عادي ولا كافي؟ لو حابب حاجة حلوه، ممكن أجيبلك لاتيه بالكراميل، تحفة!"
User: "إيه أحسن حاجة؟"
Good response: "يعتمد علي ذوقك! لو عايز حاجة قوية، الإسبرسو عندنا ممتاز. لو عايز حاجة خفيفه، السموتشي الفواكه تحفة! عايز أعرض عليك حاجة منهم؟"
` : `
User: "I want coffee"
Good response: "Hey ${userName}! ☕ Great choice! What kind of mood are you in? If you want something sweet, our Caramel Latte is amazing. Want me to recommend one?"
User: "What's your best?"
Good response: "Depends on your taste! For strong coffee lovers, our Espresso is top-notch. If you want something lighter, our Fruit Smoothie is super refreshing! Want me to show you either one?"
`}

## EXPERTISE:
- Deep knowledge of the Azura Menu provided below.
- You STRICTLY follow the names and IDs in the MENU DATA section.
- You can explain ingredients and descriptions exactly as provided in the menu context.

## TOOLS:
- [ADD_ITEM:item_id] - Show one item (Use the EXACT [ID: ...] provided in menu data)
- [ADD_ALL:id1,id2] - Show multiple items
- Use **bold** for item names
- Use *italics* for flavor descriptions
- Use emojis: ☕🍰🌟✨🔥❤️

## IMPORTANT RULES:
1. NEVER mention PRICES. Do not say how much things cost.
2. NEVER mention checkout, payment, or ordering - this is a digital menu only.
3. DO NOT invent items. If it is not in the MENU DATA list, it does not exist.
4. If a user asks for something not on the menu, politely steer them to a similar available item.
5. If the user asks for the price, politely inform them they can find latest prices in the menu sections.
6. Keep responses conversational, not robotic. Use friendly emojis occasionally.`;

    return `${systemPrompt || defaultPrompt}\n\nMENU DATA (STRICT NAMES & IDs):\n${menuCtx}`;
  };

  const parseMessage = (raw: string) => {
    let text = raw;
    let suggestedItems: SuggestedItem[] = [];
    
    const allMatch = text.match(/\[ADD_ALL:([^\]]+)\]/);
    if (allMatch) {
      const ids = allMatch[1].split(",").map(id => id.trim().replace(/^ID:\s*/i, ""));
      ids.forEach(id => {
        const item = menuItems.find((i) => i.id === id || i.name.toLowerCase().includes(id.toLowerCase()));
        if (item && !suggestedItems.find(s => s.id === item.id)) {
          suggestedItems.push({ id: item.id, name: item.name, nameAr: item.nameAr, price: item.price, image: item.image, category: item.category });
        }
      });
      text = text.replace(allMatch[0], "");
    }
    
    const multiMatch = text.match(/\[ADD_ITEMS:([^\]]+)\]/);
    if (multiMatch && suggestedItems.length === 0) {
      const ids = multiMatch[1].split(",").map(id => id.trim().replace(/^ID:\s*/i, ""));
      ids.forEach(id => {
        const item = menuItems.find((i) => i.id === id || i.name.toLowerCase().includes(id.toLowerCase()));
        if (item && !suggestedItems.find(s => s.id === item.id)) {
          suggestedItems.push({ id: item.id, name: item.name, nameAr: item.nameAr, price: item.price, image: item.image, category: item.category });
        }
      });
      text = text.replace(multiMatch[0], "");
    }
    
    const singleMatch = text.match(/\[ADD_ITEM:([^\]]+)\]/);
    if (singleMatch && suggestedItems.length === 0) {
      const id = singleMatch[1].trim().replace(/^ID:\s*/i, "");
      const item = menuItems.find((i) => i.id === id || i.name.toLowerCase().includes(id.toLowerCase()));
      if (item) {
        suggestedItems.push({ id: item.id, name: item.name, nameAr: item.nameAr, price: item.price, image: item.image, category: item.category });
      }
      text = text.replace(singleMatch[0], "");
    }
    
    text = text.replace(/\[[A-Z_]+:[^\]]*\]/g, "");
    text = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
    text = text.replace(/\n{3,}/g, "\n\n").trim();
    
    return { text, suggestedItems };
  };

  const sendMessage = async (msgText?: string) => {
    const text = (msgText || input).trim();
    if (!text || loading) return;

    if (!aiEnabled || !egyKey) {
      const err: Message = {
        id: `e${Date.now()}`,
        role: "ai",
        content: lang === "ar"
          ? "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً. تواصل مع الإدارة."
          : "Sorry, AI service is currently disabled. Please contact admin.",
        timestamp: Date.now(),
      };
      setMessages((p) => [...p, err]);
      return;
    }

    const userMsg: Message = { id: `u${Date.now()}`, role: "user", content: text, timestamp: Date.now() };
    setMessages((p) => [...p, userMsg]);
    saveMessageToFirebase(userMsg);
    setInput("");
    setLoading(true);
    
    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role === "ai" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const content = await chatWithAI(egyKey, text, history, buildSystemPrompt());
      const { text: parsed, suggestedItems } = parseMessage(content);
      
      const aiMsg: Message = {
        id: `a${Date.now()}`,
        role: "ai",
        content: parsed,
        timestamp: Date.now(),
        suggestedItems: suggestedItems.length > 0 ? suggestedItems : undefined,
      };
      setMessages((p) => [...p, aiMsg]);
      saveMessageToFirebase(aiMsg);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      const err: Message = {
        id: `e${Date.now()}`,
        role: "ai",
        content: lang === "ar" ? `عذراً، حدث خطأ: ${errMsg}` : `Sorry, something went wrong: ${errMsg}`,
        timestamp: Date.now(),
      };
      setMessages((p) => [...p, err]);
    }
    setLoading(false);
  };

  const handleViewItem = (item: SuggestedItem) => {
    setAddedItems(prev => new Set(prev).add(item.id));
    clearAddedAnimation(item.id);
  };

  const quickPrompts = lang === "ar" ? [
    "☕ أوصني بقهوة",
    "🍰 أريد حلويات",
    "⭐ الأكثر شعبية؟",
    "🧊 شيء بارد منعش",
    "🌟 كومبو مثالي",
    "🍔 أنا جائع"
  ] : [
    "☕ Best coffee?",
    "🍰 Something sweet",
    "⭐ What's popular?",
    "🧊 Something cold",
    "🌟 Perfect combo",
    "🍔 I'm hungry"
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] max-w-2xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="card rounded-2xl px-3 py-2.5 flex items-center gap-3">
          <button onClick={() => navigate("/menu")} className="btn-icon w-8 h-8">
            <ArrowLeft size={16} />
          </button>
          <div className="relative flex-shrink-0">
            <img src={baristaAvatar} alt={baristaName} className="w-11 h-11 rounded-full object-cover object-top" style={{ boxShadow: "var(--shadow-sm)" }} loading="lazy" />
            <span className="badge-online absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-primary text-sm leading-tight">{baristaName}</p>
            <a 
              href={`https://instagram.com/${instagram.replace('@','')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[11px] text-pink-500 font-medium hover:underline flex items-center gap-1"
            >
              <Instagram size={12} /> {instagram}
            </a>
          </div>
          <button onClick={() => {
            if (user) remove(ref(db, `conversations/${user.uid}/barista`));
            setMessages([]); setGreeted(false);
          }} title="Clear History" className="btn-icon w-8 h-8 text-muted-foreground hover:text-destructive transition-colors">
            <RefreshCw size={13} />
          </button>
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
            className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "ai" && (
              <img src={baristaAvatar} alt={baristaName} className="w-7 h-7 rounded-full object-cover object-top flex-shrink-0 mb-1" loading="lazy" />
            )}
            <div className="max-w-[85%] space-y-2">
              <div className={`px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bubble-user" : "bubble-ai"}`}>
                <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
              </div>
              
              {msg.suggestedItems && msg.suggestedItems.length > 0 && (
                <div className="space-y-2">
                  {msg.suggestedItems.length > 1 && (
                    <div className="flex items-center px-1">
                      <p className="text-xs font-bold text-primary">
                        {lang === "ar" ? `${msg.suggestedItems.length} أصناف من قائمتنا` : `${msg.suggestedItems.length} items from our menu`}
                      </p>
                    </div>
                  )}
                  {msg.suggestedItems.map((item) => {
                    const isSeen = addedItems.has(item.id);
                    return (
                      <div 
                        key={item.id} 
                        className={`card rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all ${
                          isSeen ? "bg-primary/5 border border-primary/20" : "hover:shadow-md"
                        }`} 
                        onClick={() => handleViewItem(item)}
                      >
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=80&q=60"}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=80&q=60"; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-primary truncate">
                            {lang === "ar" && item.nameAr ? item.nameAr : item.name}
                          </p>
                          <span className="text-[10px] text-muted-foreground capitalize">{item.category}</span>
                        </div>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            isSeen ? "bg-primary/20" : "bg-muted"
                          }`}
                        >
                          {isSeen ? <Check size={14} className="text-primary" /> : <Eye size={14} className="text-muted-foreground" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2">
            <img src={baristaAvatar} alt={baristaName} className="w-7 h-7 rounded-full object-cover object-top flex-shrink-0" loading="lazy" />
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
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target;
              requestAnimationFrame(() => {
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
              });
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={lang === "ar" ? "اسألني عن القائمة أو التوصيات..." : "Ask me about our menu, recommendations, ingredients..."}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none min-h-[36px] py-2 px-1"
            dir={isRTL ? "rtl" : "ltr"}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              input.trim() && !loading ? "" : "opacity-40"
            }`}
            style={input.trim() && !loading ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } : { background: "hsl(var(--muted))" }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
