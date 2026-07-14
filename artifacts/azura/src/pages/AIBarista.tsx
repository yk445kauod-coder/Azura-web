import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useBarista } from "@/contexts/BaristaContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { db, ref, onValue, off, set, remove, get } from "@/lib/firebase";
import { decryptKey, isValidApiKey, chatWithAI } from "@/lib/crypto";
import { useAIChat, type Message } from "@/hooks/useAIChat";
import { Send, Eye, RefreshCw, ArrowLeft, Check, Instagram, Star, Zap, Coffee, Heart, Share2, Loader2, BrainCircuit } from "lucide-react";

interface SuggestedItem {
  id: string; name: string; nameAr: string; price: number; image: string; category: string;
}

interface MenuItem {
  id: string; name: string; nameAr: string; price: number;
  category: string; image: string; ingredients?: string; ingredientsAr?: string;
  description?: string; descriptionAr?: string; available: boolean;
  categoryAr?: string;
}

function normalizeItem(id: string, raw: Record<string, any>): MenuItem {
  return {
    id,
    name: raw.name || raw.nameEn || "",
    nameAr: raw.nameAr || "",
    price: Number(raw.price) || 0,
    category: raw.category || "general",
    categoryAr: raw.categoryAr || "",
    image: raw.image || raw.img || "",
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients.join(", ") : (raw.ingredients || ""),
    ingredientsAr: Array.isArray(raw.ingredientsAr) ? raw.ingredientsAr.join(", ") : (raw.ingredientsAr || ""),
    description: raw.description || "",
    descriptionAr: raw.descriptionAr || "",
    available: raw.available !== false,
  };
}

function renderMarkdown(text: string): string {
  // Escape HTML to prevent XSS
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-primary">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-secondary">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-black mt-4 mb-2 text-primary">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-black mt-5 mb-3 text-primary">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-xl font-black mt-6 mb-4 text-primary">$1</h1>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1 list-disc pl-1">$1</li>')
    .replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
      const cleanSrc = src.replace(/&amp;/g, "&");
      return `<img src="${cleanSrc}" alt="${alt}" class="w-full h-auto rounded-xl my-3 shadow-sm border border-primary/10" loading="lazy" />`;
    });

  // Enhanced Table handling
  if (html.includes("|")) {
    const lines = html.split("\n");
    let inTable = false;
    let tableHtml = '<div class="overflow-x-auto my-4"><table class="w-full border-collapse text-xs border border-primary/20 rounded-lg shadow-sm overflow-hidden">';
    let newLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("|") && line.endsWith("|")) {
        const cells = line.split("|").map(c => c.trim()).filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1));

        if (!inTable) {
          inTable = true;
          newLines.push(tableHtml);
          newLines.push('<thead class="bg-primary/5"><tr>' + cells.map(c => `<th class="border border-primary/10 p-2 text-left font-extrabold text-primary">${c}</th>`).join("") + '</tr></thead><tbody class="divide-y divide-primary/10">');
        } else if (line.includes("---")) {
          // Skip separator line
          continue;
        } else {
          newLines.push('<tr>' + cells.map(c => `<td class="border border-primary/10 p-2 text-foreground/80">${c}</td>`).join("") + '</tr>');
        }
      } else {
        if (inTable) {
          inTable = false;
          newLines.push('</tbody></table></div>');
        }
        newLines.push(lines[i]);
      }
    }
    if (inTable) newLines.push('</tbody></table></div>');
    html = newLines.join("\n");
  }

  return html.replace(/\n/g, '<br/>');
}

export default function AIBarista() {
  const { lang, isRTL } = useLang();
  const { baristaName, baristaAvatar, instagram, cafeInfo } = useBarista();
  const [, navigate] = useLocation();
  const { user, profile } = useAuth();

  const {
    messages, loading, isThinking, thinkingSteps, error,
    sendMessage: baseSendMessage, clearChat
  } = useAIChat(user?.uid);

  const [input, setInput] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuNode, setMenuNode] = useState("menu");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [greetingMsg, setGreetingMsg] = useState("");
  const [greeted, setGreeted] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [egyKey, setEgyKey] = useState("");
  const [aiProvider, setAiProvider] = useState("groq");
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [memories, setMemories] = useState<string[]>([]);

  // DDS specific configurations
  const [ddsConfig, setDdsConfig] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    const ddsRef = ref(db, "dds-config");
    onValue(ddsRef, (snap) => {
      if (snap.exists()) {
        const cfg = snap.val();
        setDdsConfig(cfg);
        if (cfg.colors) {
          document.documentElement.style.setProperty("--primary", cfg.colors.primary);
          if (cfg.colors.secondary) document.documentElement.style.setProperty("--secondary", cfg.colors.secondary);
          if (cfg.colors.accent) document.documentElement.style.setProperty("--accent", cfg.colors.accent);
        }
      }
    });

    const apiRef = ref(db, "api-settings");
    const unsubscribe = onValue(apiRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val() as Record<string, any>;
        const storedKey = (data.groqKey || data.geminiKey) as string;
        if (storedKey) {
          const decrypted = decryptKey(storedKey);
          setEgyKey(decrypted || storedKey);
        } else {
          setEgyKey("");
        }
        setAiEnabled(data.aiEnabled !== false);
        setAiProvider(data.aiProvider || "groq");
        setMenuNode(data.menuNode || "menu");
      }
    });

    return () => {
      off(ddsRef);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const menuRef = ref(db, menuNode);
    onValue(menuRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, Record<string, unknown>>;
      const result: MenuItem[] = [];
      Object.entries(data).forEach(([key, val]) => {
        if (typeof val !== "object" || val === null) return;
        const v = val as Record<string, unknown>;
        if (v.price !== undefined || v.name !== undefined || v.nameEn !== undefined) {
          result.push(normalizeItem(key, v));
        } else {
          Object.entries(v).forEach(([subId, subVal]) => {
            if (typeof subVal === "object" && subVal !== null)
              result.push(normalizeItem(subId, subVal));
          });
        }
      });
      setMenuItems(result);
    });

    return () => off(menuRef);
  }, [menuNode]);

  useEffect(() => {
    const cfgRef = ref(db, "ai-config");
    onValue(cfgRef, (snap) => {
      if (snap.exists()) {
        const cfg = snap.val() as Record<string, string>;
        setSystemPrompt(lang === "ar" ? (cfg.systemPromptAr || cfg.systemPrompt) : cfg.systemPrompt);
        setGreetingMsg(lang === "ar" ? (cfg.greetingAr || cfg.greeting) : cfg.greeting);
      }
    });

    return () => { off(cfgRef); };
  }, [lang]);

  useEffect(() => {
    if (!user) return;
    const memRef = ref(db, `users/${user.uid}/memories`);
    onValue(memRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val() as Record<string, string>;
        setMemories(Object.values(data).slice(-5));
      }
    });
    return () => off(memRef);
  }, [user]);

  useEffect(() => {
    if (menuItems.length === 0 || greeted || messages.length > 0) return;
    const defaultGreeting = lang === "ar"
      ? `مرحباً! أنا ${baristaName}! كيف يمكنني مساعدتك اليوم؟`
      : `Hi! I'm ${baristaName}! How can I help you today? I am here to assist you with our services and catalogs.`;

    const greeting = greetingMsg || defaultGreeting;
    if (messages.length === 0 && user) {
      const greetingMsgObj: Message = { id: "greeting", role: "ai", content: greeting, timestamp: Date.now() };
      set(ref(db, `conversations/${user.uid}/barista/greeting`), greetingMsgObj);
    }
    setGreeted(true);
  }, [menuItems.length, lang, greeted, baristaName, greetingMsg, messages.length, user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const buildSystemPrompt = () => {
    const byCategory = menuItems
      .filter(i => i.available)
      .reduce((acc, item) => {
        const cat = item.category || "other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {} as Record<string, MenuItem[]>);
    
    const menuCtx = Object.entries(byCategory)
      .map(([cat, items]) => {
        if (!Array.isArray(items)) return "";
        return `=== ${cat.toUpperCase()} ===\n` +
          items.map((i) => {
            const details = lang === "ar"
              ? `${i.nameAr || i.name}${i.descriptionAr ? `: ${i.descriptionAr}` : ""}${i.ingredientsAr ? ` (المواصفات: ${i.ingredientsAr})` : ""} - القيمة: ${i.price} ج.م`
              : `${i.name}${i.description ? `: ${i.description}` : ""}${i.ingredients ? ` (Details: ${i.ingredients})` : ""} - Value: ${i.price} EGP`;
            return `• [ID: ${i.id}] ${details}`;
          })
          .join("\n");
      })
      .join("\n");

    const isArabic = lang === "ar";
    const langInstruction = isArabic
      ? `IMPORTANT: RESPOND IN FLUENT, PROFESSIONAL ARABIC (or Egyptian Dialect if friendly). Keep it helpful and smart.`
      : `IMPORTANT: RESPOND IN NATURAL, SOPHISTICATED ENGLISH. Be warm, precise, and professional.`;

    const userName = profile?.name || user?.displayName || user?.email?.split('@')[0] || (isArabic ? "صديقي" : "friend");
    const memCtx = memories.length > 0 ? `\nKNOWN ABOUT USER:\n${memories.map(m => `- ${m}`).join("\n")}` : "";

    const defaultPrompt = `You are ${baristaName}, the intelligent AI assistant for ${ddsConfig?.brandName || "our business platform"}.

CURRENT USER: ${userName}
SESSION ID: ${profile?.tableNumber || "N/A"}
${memCtx}

## PERSONALITY & RULES
- You are warm, professional, smart, and fully context-aware.
- ${langInstruction}
- You speak naturally like an expert advisor.
- Do not make any references to cafes, coffee, tables, or waitstaff unless the business sector is cafe/restaurant.
- Strive to help users explore our available dynamic categories and make correct recommendations.
- Keep responses concise and use structured tables or bullets if helpful.

## TOOLS:
- [ADD_ITEM:item_id] - Recommend one item/service (Use the EXACT [ID: ...] provided in catalog data)
- Use **bold** for item/service names
- Use emojis: ✨🌟📋📦❤️

## IMPORTANT RULES:
1. You can discuss values and listings directly from the CATALOG DATA.
2. DO NOT invent items or doctors or listings. If it is not in the data, it does not exist.
3. Steering rules apply: guide customers to suitable options listed.`;

    return `${systemPrompt || defaultPrompt}\n\nCATALOG DATA:\n${menuCtx}`;
  };

  const parseMessage = (raw: string) => {
    let text = raw;
    let suggestedItems: SuggestedItem[] = [];
    
    const singleMatch = text.match(/\[ADD_ITEM:([^\]]+)\]/);
    if (singleMatch) {
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

    const isFree = aiProvider === "pollinations";
    if (!aiEnabled || (!isFree && !egyKey)) return;

    setInput("");
    const keyToUse = egyKey || "pollinations_free";
    await baseSendMessage(text, keyToUse, buildSystemPrompt(), parseMessage);
    
    // Update memory asynchronously after response
    if (user) {
      setTimeout(async () => {
        try {
          const lastMsgs = messages.slice(-4);
          if (lastMsgs.length < 2) return;
          const summaryPrompt = `Based on these messages, extract 1 key fact about the user's preference or question.
          Format: "Interested in [X]". Keep it very short.
          Recent Chat:
          ${lastMsgs.map(m => `${m.role}: ${m.content}`).join("\n")}`;

          const fact = await chatWithAI(keyToUse, "Extract key user preference.", [], summaryPrompt);
          if (fact && fact.length > 5 && fact.length < 100) {
            const memRef = ref(db, `users/${user.uid}/memories/${Date.now()}`);
            await set(memRef, fact);
          }
        } catch (e) { console.warn("Memory update failed", e); }
      }, 3000);
    }
  };

  const handleViewItem = (item: SuggestedItem) => {
    setAddedItems(prev => new Set(prev).add(item.id));
    clearAddedAnimation(item.id);
  };

  const quickPrompts = lang === "ar" ? [
    "📋 ما هي الخدمات المتوفرة؟",
    "⭐ أريد توصية مميزة",
    "✨ كيف يمكنني التسجيل؟"
  ] : [
    "📋 What services do you offer?",
    "⭐ What do you recommend?",
    "✨ Help me get started"
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] max-w-2xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="card rounded-2xl px-3 py-2.5 flex items-center gap-3 border border-border">
          <button onClick={() => navigate("/menu")} className="btn-icon w-8 h-8">
            <ArrowLeft size={16} />
          </button>
          <div className="relative flex-shrink-0">
            <img src={baristaAvatar} alt={baristaName} className="w-11 h-11 rounded-full object-cover object-top" style={{ boxShadow: "var(--shadow-sm)" }} loading="lazy" />
            <span className="badge-online absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-primary text-sm leading-tight">{baristaName}</p>
            <span className="text-[9px] text-muted-foreground font-semibold mt-0.5 block">{ddsConfig?.brandName || "AI Assistant"}</span>
          </div>
          <button onClick={() => {
            clearChat();
            setGreeted(false);
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
                          src={item.image || "https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=80&q=60"}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          loading="lazy"
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

        {isThinking && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BrainCircuit size={14} className="text-primary animate-pulse" />
            </div>
            <div className="space-y-1.5 max-w-[80%]">
              <div className="bubble-ai px-4 py-2 border border-primary/20 bg-primary/5">
                <div className="flex gap-2 items-center">
                  <Loader2 size={12} className="animate-spin text-primary" />
                  <span className="text-[11px] font-bold text-primary animate-pulse">
                    {thinkingSteps[thinkingSteps.length - 1] || (lang === "ar" ? "يفكر..." : "Thinking...")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && !isThinking && (
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
        <div className="card rounded-2xl flex items-end gap-2 p-2 border border-border">
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
            placeholder={lang === "ar" ? "اسأل المساعد الذكي عن الكتالوج والتوصيات..." : "Ask me about our catalog, recommendations, guidelines..."}
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
