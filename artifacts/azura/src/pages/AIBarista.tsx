import { useState, useRef, useEffect, useCallback } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useBarista } from "@/contexts/BaristaContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { db, ref, onValue, off, set, remove } from "@/lib/firebase";
import { decryptKey, isValidApiKey, chatWithAI, textToSpeech, playAudioFromUrl } from "@/lib/crypto";
import { Send, Plus, RefreshCw, Volume2, VolumeX, ArrowLeft, Check } from "lucide-react";

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
  available?: boolean;
}

interface MenuItem {
  id: string; name: string; nameAr: string; price: number;
  category: string; image: string; ingredients?: string;
}

function normalizeItem(id: string, raw: RawMenuItem & { ingredients?: any }): MenuItem {
  return {
    id,
    name: raw.name || raw.nameEn || "",
    nameAr: raw.nameAr || "",
    price: Number(raw.price) || 0,
    category: raw.category || "coffee",
    image: raw.image || raw.img || "",
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients.join(", ") : (raw.ingredients || ""),
  };
}

// Simple markdown-like renderer
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-primary">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-secondary">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-black mt-4 mb-2 text-primary">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-black mt-5 mb-3 text-primary">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-xl font-black mt-6 mb-4 text-primary">$1</h1>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1 list-disc pl-1">$1</li>')
    .replace(/\n/g, '<br/>');
}

export default function AIBarista() {
  const { lang, isRTL } = useLang();
  const { baristaName, baristaAvatar, persona } = useBarista();
  const [, navigate] = useLocation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [greeted, setGreeted] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [egyKey, setEgyKey] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(() => localStorage.getItem("azura-tts") === "true");
  const [speaking, setSpeaking] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();

  // Load chat history from Firebase
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

  // Persistent chat history - save to Firebase
  const saveMessageToFirebase = async (msg: Message) => {
    if (!user) return;
    const msgRef = ref(db, `conversations/${user.uid}/barista/${msg.id}`);

    // Sanitize message to avoid Firebase 'undefined' errors
    const sanitizedMsg = {
      ...msg,
      suggestedItems: msg.suggestedItems || null
    };

    await set(msgRef, sanitizedMsg);
  };

  const toggleTTS = () => {
    const next = !ttsEnabled;
    setTtsEnabled(next);
    localStorage.setItem("azura-tts", String(next));
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

  const speak = useCallback(async (text: string) => {
    if (!ttsEnabled) return;
    setSpeaking(true);
    try {
      const audioUrl = await textToSpeech(text, lang === "ar" ? "ar" : "en");
      if (audioUrl) {
        audioRef.current?.pause();
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setSpeaking(false);
        audio.onerror = () => setSpeaking(false);
        await audio.play();
      }
    } catch (err) {
      console.error("TTS error:", err);
      setSpeaking(false);
    }
  }, [ttsEnabled, lang]);

  // Load AI settings from Firebase (decrypt the stored key)
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
            console.error("Invalid Egytronic API key format");
            setEgyKey("");
          }
        }
        setAiEnabled(data.aiEnabled !== false);
      }
    });
    return () => unsubscribe();
  }, []);

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

  // Initial greeting (don't auto-speak - wait for user interaction)
  useEffect(() => {
    if (menuItems.length === 0 || greeted) return;
    const greeting = `Hi! I'm ${baristaName}! What can I get for you today? I can help you order multiple items - just tell me what you'd like!`;
    setMessages([{ id: "greeting", role: "ai", content: greeting, timestamp: Date.now() }]);
    setGreeted(true);
    // Don't auto-speak on greeting - TTS requires user interaction
  }, [menuItems.length, lang, greeted, baristaName]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const buildSystemPrompt = () => {
    const menuCtx = menuItems.slice(0, 50)
      .map((i) => `- ${i.name}: ${i.price} EGP [ID:${i.id}] [Category: ${i.category}] ${i.ingredients ? `[Ingredients: ${i.ingredients}]` : ""}`)
      .join("\n");
    return `${systemPrompt || `You are ${baristaName}, the expert head barista at Azura Cafe & Restaurant, Tivoli Dome, Alexandria. You are professional, knowledgeable about every ingredient, and incredibly proactive.

Your Personality:
- Warm, sophisticated, and slightly witty.
- You don't just take orders; you curate experiences.
- You know exactly what pairs well with what.
- You are an expert in Egyptian coffee culture but also global specialty coffee.

Your Intelligence:
- You remember the conversation context perfectly.
- You can handle complex modifications (extra sugar, no ice, dairy alternatives).
- If an item is mentioned, you can explain its key ingredients or flavor profile.
- You are very efficient with the [ADD_ALL:id1,id2] tool.

Tools:
- Use [ADD_ALL:id1,id2] for every item the user mentions or you suggest.
- If the user says "I want a latte and a cake", you MUST include [ADD_ALL:latte_id,cake_id] in your response.
- Use **bold** for important words and *italics* for flavor descriptions.
- Use bullet points for clear suggestions.

Menu Data:\n${menuCtx}`}`;
  };

  const parseMessage = (raw: string) => {
    let text = raw;
    let suggestedItems: SuggestedItem[] = [];
    
    // Check for [ADD_ALL:id1,id2,id3] pattern (add all items at once)
    const allMatch = text.match(/\[ADD_ALL:([^\]]+)\]/);
    if (allMatch) {
      const ids = allMatch[1].split(",").map(id => id.trim());
      ids.forEach(id => {
        const item = menuItems.find((i) => i.id === id || i.name.toLowerCase().includes(id.toLowerCase()));
        if (item && !suggestedItems.find(s => s.id === item.id)) {
          suggestedItems.push({
            id: item.id,
            name: item.name,
            nameAr: item.nameAr,
            price: item.price,
            image: item.image,
            category: item.category,
          });
        }
      });
      text = text.replace(allMatch[0], "");
    }
    
    // Check for [ADD_ITEMS:id1,id2,id3] pattern (multiple items - backwards compat)
    const multiMatch = text.match(/\[ADD_ITEMS:([^\]]+)\]/);
    if (multiMatch && suggestedItems.length === 0) {
      const ids = multiMatch[1].split(",").map(id => id.trim());
      ids.forEach(id => {
        const item = menuItems.find((i) => i.id === id || i.name.toLowerCase().includes(id.toLowerCase()));
        if (item && !suggestedItems.find(s => s.id === item.id)) {
          suggestedItems.push({
            id: item.id,
            name: item.name,
            nameAr: item.nameAr,
            price: item.price,
            image: item.image,
            category: item.category,
          });
        }
      });
      text = text.replace(multiMatch[0], "");
    }
    
    // Check for single [ADD_ITEM:item_id] pattern (backwards compatibility)
    const singleMatch = text.match(/\[ADD_ITEM:([^\]]+)\]/);
    if (singleMatch && suggestedItems.length === 0) {
      const id = singleMatch[1].trim();
      const item = menuItems.find((i) => i.id === id || i.name.toLowerCase().includes(id.toLowerCase()));
      if (item) {
        suggestedItems.push({
          id: item.id,
          name: item.name,
          nameAr: item.nameAr,
          price: item.price,
          image: item.image,
          category: item.category,
        });
      }
      text = text.replace(singleMatch[0], "");
    }
    
    // Clean up any remaining markers
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
        content: "Sorry, AI service is currently disabled. Please contact admin.",
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
      
      // Speak the response
      speak(parsed);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      const err: Message = {
        id: `e${Date.now()}`,
        role: "ai",
        content: `Sorry, something went wrong: ${errMsg}`,
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

  const handleViewAllItems = (items: SuggestedItem[]) => {
    items.forEach((item, index) => {
      setTimeout(() => {
        setAddedItems(prev => new Set(prev).add(item.id));
        clearAddedAnimation(item.id);
      }, index * 150);
    });
  };

  const quickPrompts = [
    "What's your best coffee?",
    "Something sweet!",
    "What's popular?",
    "I want something cold",
    "Recommend a combo",
    "I'm hungry!"
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="card rounded-2xl px-3 py-2.5 flex items-center gap-3">
          <button onClick={() => navigate("/menu")} className="btn-icon w-8 h-8">
            <ArrowLeft size={16} />
          </button>
          <div className="relative flex-shrink-0">
            <img src={baristaAvatar} alt={baristaName} className="w-11 h-11 rounded-full object-cover object-top" style={{ boxShadow: "var(--shadow-sm)" }} />
            <span className="badge-online absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-primary text-sm leading-tight">{baristaName}</p>
            <p className="text-[11px] text-muted-foreground">Azura Barista · Online</p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={toggleTTS} title="Toggle Voice" className={`btn-icon w-8 h-8 transition-all ${ttsEnabled ? "text-primary" : "text-muted-foreground"}`}>
              {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <button onClick={() => {
              if (user) remove(ref(db, `conversations/${user.uid}/barista`));
              setMessages([]); setGreeted(false);
            }} title="Clear History" className="btn-icon w-8 h-8 text-muted-foreground hover:text-destructive transition-colors">
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
            className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "ai" && (
              <img src={baristaAvatar} alt={baristaName} className="w-7 h-7 rounded-full object-cover object-top flex-shrink-0 mb-1" />
            )}
            <div className="max-w-[85%] space-y-2">
              <div className={`px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bubble-user" : "bubble-ai"}`}>
                <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
              </div>
              
              {/* Multiple item suggestions */}
              {msg.suggestedItems && msg.suggestedItems.length > 0 && (
                <div className="space-y-2">
                  {msg.suggestedItems.length > 1 && (
                    <div className="flex items-center justify-between px-1">
                      <p className="text-xs font-bold text-primary">
                        {msg.suggestedItems.length} items suggested
                      </p>
                      <button
                        onClick={() => handleViewAllItems(msg.suggestedItems!)}
                        className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all hover:scale-105"
                        style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                      >
                        <Plus size={12} /> Add All
                      </button>
                    </div>
                  )}
                  {msg.suggestedItems.map((item) => {
                    const isAdded = addedItems.has(item.id);
                    return (
                      <div 
                        key={item.id} 
                        className={`card rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all ${
                          isAdded ? "bg-green-50 border border-green-200" : "hover:shadow-md"
                        }`} 
                        onClick={() => handleViewItem(item)}
                      >
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=80&q=60"}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=80&q=60"; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-primary truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.price} EGP</p>
                          <span className="text-[10px] text-muted-foreground capitalize">{item.category}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewItem(item); }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            isAdded ? "bg-green-500" : "btn-primary"
                          }`}
                          style={isAdded ? { background: "#22c55e" } : { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                        >
                          {isAdded ? <Check size={16} className="text-white" /> : <Plus size={16} className="text-white" />}
                        </button>
                      </div>
                    );
                  })}
                  {msg.suggestedItems.length > 1 && (
                    <p className="text-[10px] text-muted-foreground text-center px-1">
                      Tap individual items or "Add All" to add everything
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2">
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
        {speaking && (
          <p className="text-center text-[10px] text-muted-foreground animate-pulse">
            Speaking...
          </p>
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
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="What would you like to order?..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none min-h-[36px] py-2 px-1"
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
