import { useState, useEffect, useRef, memo } from "react";
import { db, ref, get, onValue, off, set, remove, push, update } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { decryptKey, chatWithAI, isValidApiKey } from "@/lib/crypto";
import { 
  Bot, Send, Loader2, Users, 
  Package, DollarSign, RefreshCw,
  XCircle, BookOpen, ExternalLink, Maximize2, Minimize2, FileText, Trash2,
  Download, FileSpreadsheet, BarChart3, TrendingUp, Terminal, Cpu, Layers, Activity, CheckCircle2, ListChecks, HelpCircle
} from "lucide-react";

interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

interface AnalyticsData {
  totalCustomers: number;
  returningCustomers: number;
  heavyUsers: number;
  activeToday: number;
  totalUsageTime: number;
  avgRating: number;
  totalMenuItems: number;
}

interface MenuItemData {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  category: string;
  description?: string;
}

interface SwarmLog {
  id: string;
  agent: string;
  action: string;
  status: "success" | "running" | "idle";
  timestamp: number;
}

const CAFE_CONTEXT = {
  name: "Azura Café & Restaurant",
  location: "Tivoli Dome, Alexandria, Egypt",
};

export default function AIAdminAssistant() {
  const { lang } = useLang();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [showMenuViewer, setShowMenuViewer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [swarmLogs, setSwarmLogs] = useState<SwarmLog[]>([
    { id: "1", agent: "Maestro-01", action: "Initialized Orchestrator Node", status: "success", timestamp: Date.now() - 120000 },
    { id: "2", agent: "DataAnalyst-05", action: "Connected to Firebase RTDB node", status: "success", timestamp: Date.now() - 90000 },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuViewerRef = useRef<HTMLDivElement>(null);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  useEffect(() => {
    loadApiKey();
    loadAllData();
    // Real-time listeners for live data sync
    const unsubUsers = onValue(ref(db, "users"), (snap) => {
      updateAnalytics({ users: snap.exists() ? Object.values(snap.val()) : [] });
    });
    const unsubFeedback = onValue(ref(db, "feedback"), (snap) => {
      updateAnalytics({ feedback: snap.exists() ? Object.values(snap.val()) : [] });
    });
    const unsubMenu = onValue(ref(db, "menu"), (snap) => {
      loadMenuItems(snap);
    });
    return () => {
      unsubUsers();
      unsubFeedback();
      unsubMenu();
      off(ref(db, "conversations/admin/assistant"));
    };
  }, []);

  const loadApiKey = async () => {
    const snap = await get(ref(db, "api-settings"));
    if (snap.exists()) {
      const data = snap.val();
      const rawKey = data.groqKey || data.geminiKey;
      if (rawKey) {
        const decrypted = decryptKey(rawKey);
        if (isValidApiKey(decrypted)) setApiKey(decrypted);
      }
    }
  };

  const loadChatHistory = () => {
    onValue(ref(db, "conversations/admin/assistant"), (snap) => {
      if (snap.exists()) {
        const data = snap.val() as Record<string, AIMessage>;
        const sorted = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(sorted);
      }
    });
  };

  const saveMessage = async (msg: AIMessage) => {
    await set(ref(db, `conversations/admin/assistant/${msg.id}`), msg);
  };

  const clearHistory = async () => {
    await remove(ref(db, "conversations/admin/assistant"));
    setMessages([]);
    setSwarmLogs([
      { id: Date.now().toString(), agent: "Maestro-01", action: "Reset Swarm telemetry cache logs", status: "success", timestamp: Date.now() }
    ]);
  };

  const updateAnalytics = ({ users = undefined, feedback = undefined }: { users?: any[]; feedback?: any[] }) => {
    setAnalytics(prev => {
      const currentUsers = users ?? [];
      const currentFeedback = feedback ?? [];
      const allUsers = Array.isArray(currentUsers) ? currentUsers.filter(Boolean) : [];
      const allFeedback = Array.isArray(currentFeedback) ? currentFeedback.filter(Boolean) : [];
      
      const today = new Date().setHours(0, 0, 0, 0);
      const activeToday = allUsers.filter((u: any) => (u.lastLoginAt || 0) >= today).length;
      const returning = allUsers.filter((u: any) => (u.loginCount || 0) > 1).length;
      const heavy = allUsers.filter((u: any) => (u.totalUsageSeconds || 0) > 1800).length;
      const totalUsage = allUsers.reduce((sum: number, u: any) => sum + (u.totalUsageSeconds || 0), 0);
      const avgRating = allFeedback.length > 0 
        ? (allFeedback.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / allFeedback.length).toFixed(1)
        : "0.0";

      return {
        totalCustomers: allUsers.length,
        returningCustomers: returning,
        heavyUsers: heavy,
        activeToday,
        totalUsageTime: totalUsage,
        avgRating: parseFloat(avgRating),
        totalMenuItems: prev?.totalMenuItems || 0,
      };
    });
  };

  const loadMenuItems = (snap?: any) => {
    try {
      const data = snap?.val ? snap.val() : snap;
      if (!data) return;
      const items: MenuItemData[] = [];
      
      Object.entries(data).forEach(([category, val]: [string, any]) => {
        if (val && typeof val === "object" && !Array.isArray(val)) {
          Object.entries(val).forEach(([id, item]: [string, any]) => {
            if (item && typeof item === "object" && (item.price !== undefined || item.name)) {
              items.push({
                id,
                name: item.name || item.nameEn || id,
                nameAr: item.nameAr || "",
                price: item.price || 0,
                category: item.category || category,
                description: item.description || item.desc || "",
              });
            }
          });
        }
      });
      
      setMenuItems(items);
      // Update menu count in analytics
      setAnalytics(prev => prev ? { ...prev, totalMenuItems: items.length } : null);
    } catch (error) {
      console.error("Error loading menu:", error);
    }
  };

  const loadAllData = async () => {
    try {
      const [usersSnap, feedbackSnap, menuSnap] = await Promise.all([
        get(ref(db, "users")),
        get(ref(db, "feedback")),
        get(ref(db, "menu"))
      ]);
      updateAnalytics({
        users: usersSnap.exists() ? Object.values(usersSnap.val()) : [],
        feedback: feedbackSnap.exists() ? Object.values(feedbackSnap.val()) : []
      });
      loadMenuItems(menuSnap);
    } catch (e) {
      console.warn("Analytics load deferred.");
    }
  };

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg = lang === "ar"
        ? `🤖 أهلاً بك في مساعد أزورا الذكي الفائق!

☕ ${CAFE_CONTEXT.name}
📍 ${CAFE_CONTEXT.location}

أنا متصل بسرب عملاء ذكي (AI Swarm) يستطيع قراءة وتحليل وتعديل أي شيء في لوحة التحكم بشكل تلقائي تماماً!

💡 يمكنك أن تطلب مني القيام بأي شيء، مثل:
• "تغيير التبويب إلى قائمة الطعام"
• "إضافة عنصر جديد: سموزي الفراولة بسعر 120"
• "إرسال إشعار للمشتركين عن عروض الويكند"
• "تفعيل أو تعطيل ميزة المساعد الذكي للمستخدمين"
• "تصدير تقرير المستخدمين كملف CSV"`
        : `🤖 Welcome to the Ultra-Agentic Azura Swarm Assistant!

☕ ${CAFE_CONTEXT.name}
📍 ${CAFE_CONTEXT.location}

I am backed by a synchronized AI Swarm that has super-agentic control over the entire Admin Panel!

💡 You can ask me to execute tasks automatically, such as:
• "Switch tab to menu"
• "Add item: Strawberry Smoothie for 120 EGP"
• "Send broadcast: Enjoy our weekend specials tonight!"
• "Toggle feature flag baristaEnabled to true"
• "Create table number 15"` ;

      const welcome = {
        id: "welcome",
        role: "assistant" as const,
        content: welcomeMsg,
        timestamp: Date.now(),
      };
      setMessages([welcome]);
    }
  }, [lang, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const exportToCSV = () => {
    if (!analytics) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Customers", analytics.totalCustomers],
      ["Active Today", analytics.activeToday],
      ["Returning Customers", analytics.returningCustomers],
      ["Heavy Users", analytics.heavyUsers],
      ["Total Usage Time (s)", analytics.totalUsageTime],
      ["Average Rating", analytics.avgRating],
      ["Menu Items", analytics.totalMenuItems],
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `azura_analytics_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const buildSystemPrompt = () => {
    const menuSummary = menuItems.map(i => `[${i.category}] ${i.name}: ${i.price} EGP`).join("\n");
    return `You are the 'Eye of Azura' — the supreme AI Agent Swarm Commander for Azura Cafe.

Your primary mission is to orchestrate special operations and automatically use the admin tools by outputting specific system commands based on user input.

## DYNAMIC CONTEXTS:
- Total Menu Items: ${menuItems.length}
- Live Analytics: ${JSON.stringify(analytics)}
- Menu Summary: ${menuSummary}

## AGENTIC EXECUTION COMMANDS (STRICTLY ON THEIR OWN LINES IN YOUR REPLY):
If the user asks to perform an action, you MUST invoke one or more of these command tags exactly:
1. [EXECUTE: SWITCH_TAB:<tab_id>] -> TABS: overview, menu, features, users, chat, reviews, broadcast, reels, barista, api, system, tables, reservations.
2. [EXECUTE: ADD_ITEM:<name>:<price>:<category>] -> Example: [EXECUTE: ADD_ITEM:Mango Smoothie:140:smoothies]
3. [EXECUTE: DELETE_ITEM:<category>:<item_id>] -> Example: [EXECUTE: DELETE_ITEM:smoothies:mango-smoothie]
4. [EXECUTE: UPDATE_FLAG:<flag_key>:<true|false>] -> FLAGS: baristaEnabled, reelsEnabled, supportEnabled.
5. [EXECUTE: SEND_BROADCAST:<title>:<message>] -> Example: [EXECUTE: SEND_BROADCAST:Happy Hour:Get 20% off all milkshakes today!]
6. [EXECUTE: ADD_TABLE:<number>] -> Setup a seating table. Example: [EXECUTE: ADD_TABLE:12]

Ensure all coordinates, categories, and titles match the requested details. Quote all prices in Egyptian Pounds (EGP). Keep explanations short and highly strategic.`;
  };

  const processExecutedCommands = async (reply: string) => {
    const commands = reply.match(/\[EXECUTE:\s*[^\]]+\]/gi);
    if (!commands) return;

    for (const cmd of commands) {
      const body = cmd.replace(/\[EXECUTE:\s*/i, "").replace(/\]$/, "");
      const [action, ...args] = body.split(":");
      const cleanedAction = action.trim().toUpperCase();

      if (cleanedAction === "SWITCH_TAB" && args[0]) {
        const targetTab = args[0].trim().toLowerCase();
        await set(ref(db, "admin-config/activeTab"), targetTab);
        logSwarmAction("Maestro-01", `Transitioned active view panel to '${targetTab}'`, "success");
      }
      else if (cleanedAction === "ADD_ITEM" && args[0]) {
        const name = args[0].trim();
        const price = Number(args[1]) || 120;
        const category = args[2] ? args[2].trim().toLowerCase() : "smoothies";
        const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        await set(ref(db, `menu/${category}/${id}`), {
          id,
          name,
          price,
          category,
          available: true,
          createdAt: Date.now()
        });
        logSwarmAction("MenuBuilder-02", `Added menu item '${name}' in category '${category}' for ${price} EGP`, "success");
      }
      else if (cleanedAction === "DELETE_ITEM" && args[0]) {
        const category = args[0].trim().toLowerCase();
        const itemId = args[1] ? args[1].trim() : "";
        if (itemId) {
          await remove(ref(db, `menu/${category}/${itemId}`));
          logSwarmAction("MenuBuilder-02", `Deleted item '${itemId}' from category '${category}'`, "success");
        }
      }
      else if (cleanedAction === "UPDATE_FLAG" && args[0]) {
        const flagKey = args[0].trim();
        const val = args[1]?.trim() === "true";
        await update(ref(db, "feature-flags"), { [flagKey]: val });
        logSwarmAction("SecuritySys-03", `Set feature flag '${flagKey}' to ${val}`, "success");
      }
      else if (cleanedAction === "SEND_BROADCAST" && args[0]) {
        const title = args[0].trim();
        const message = args[1] ? args[1].trim() : "";
        await push(ref(db, "broadcast"), {
          title,
          message,
          type: "info",
          emoji: "✨",
          createdAt: Date.now()
        });
        logSwarmAction("BroadcastComms-04", `Broadcasted live notification: "${title}"`, "success");
      }
      else if (cleanedAction === "ADD_TABLE" && args[0]) {
        const num = Number(args[0]) || 12;
        await set(ref(db, `tables/table-${num}`), {
          number: num,
          capacity: 4,
          id: `table-${num}`
        });
        logSwarmAction("Maestro-01", `Registered physical table number ${num} in database`, "success");
      }
    }
  };

  const logSwarmAction = (agent: string, action: string, status: "success" | "running" | "idle") => {
    setSwarmLogs(prev => [
      {
        id: Date.now().toString() + Math.random().toString(),
        agent,
        action,
        status,
        timestamp: Date.now()
      },
      ...prev.slice(0, 20)
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    
    try {
      logSwarmAction("Maestro-01", `Analyzing request: "${userMessage.content}"`, "running");
      const systemPrompt = buildSystemPrompt();

      const history = messages.slice(-12).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      // Keyless/decrypted smart auto-selection (Groq/Gemini if configured, or falls back to free Pollinations)
      const response = await chatWithAI(apiKey, userMessage.content, history, systemPrompt);

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      await processExecutedCommands(response);

      if (input.toLowerCase().includes("show menu") || input.toLowerCase().includes("عرض القائمة")) {
        setShowMenuViewer(true);
      }
    } catch (error) {
      console.error("AI Error:", error);
      logSwarmAction("Maestro-01", `Encountered communication error, switching nodes`, "idle");
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      menuViewerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-1 h-[700px] max-h-[85vh]">
      {/* LEFT CHAT PANEL (7 Columns) */}
      <div className="lg:col-span-7 flex flex-col bg-background rounded-2xl border border-border/10 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot size={16} className="text-primary animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-sm">{tr("AI Advisor Chat", "محادثة المستشار الذكي")}</p>
              <p className="text-[10px] text-muted-foreground">{CAFE_CONTEXT.name}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={exportToCSV}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-green-600"
              title={tr("Export CSV", "تصدير CSV")}
            >
              <FileSpreadsheet size={16} />
            </button>
            <button
              onClick={() => setShowMenuViewer(!showMenuViewer)}
              className={`p-2 hover:bg-muted rounded-lg transition-colors ${showMenuViewer ? 'bg-primary/10' : ''}`}
              title={tr("View Menu", "عرض القائمة")}
            >
              <BookOpen size={14} className={showMenuViewer ? 'text-primary' : ''} />
            </button>
            <button
              onClick={loadAllData}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title={tr("Refresh Data", "تحديث البيانات")}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className={`p-2 hover:bg-muted rounded-lg transition-colors ${showPromptPreview ? 'bg-purple-100 text-purple-600' : ''}`}
              title={tr("System Prompt", "إعدادات النظام")}
            >
              <Bot size={14} />
            </button>
            <button
              onClick={clearHistory}
              className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
              title={tr("Clear Chat", "مسح المحادثة")}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Prompt Preview */}
        {showPromptPreview && (
          <div className="bg-purple-50/75 border-b p-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-purple-700 uppercase tracking-widest flex items-center gap-2">
                <Bot size={12}/> {tr("AI System Prompt (Real-time Menu Injected)", "موجه النظام (حقن المنيو المباشر)")}
              </h4>
              <button onClick={() => setShowPromptPreview(false)} className="text-purple-400 hover:text-purple-600"><XCircle size={14}/></button>
            </div>
            <pre className="text-[10px] font-mono bg-white/50 p-3 rounded-lg border border-purple-100 whitespace-pre-wrap max-h-40 overflow-y-auto text-purple-900 leading-relaxed">
              {buildSystemPrompt()}
            </pre>
          </div>
        )}

        {/* Menu Viewer */}
        {showMenuViewer && (
          <div className="border-b bg-muted/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-primary" />
                <span className="text-xs font-medium">{tr("Digital Menu", "القائمة الرقمية")}</span>
              </div>
              <div className="flex gap-1">
                <a
                  href="https://azura-app.pages.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                  title={tr("Open in new tab", "فتح في نافذة جديدة")}
                >
                  <ExternalLink size={12} />
                </a>
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                  title={isFullscreen ? tr("Exit fullscreen", "الخروج") : tr("Fullscreen", "ملء الشاشة")}
                >
                  {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                </button>
                <button
                  onClick={() => setShowMenuViewer(false)}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  <XCircle size={12} />
                </button>
              </div>
            </div>
            <div
              ref={menuViewerRef}
              className="w-full h-48 rounded-lg overflow-hidden border bg-white"
            >
              <iframe
                src="https://azura-app.pages.dev"
                className="w-full h-full"
                title={tr("Azura Menu", "قائمة أزورا")}
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Analytics Quick View */}
        {analytics && !showMenuViewer && (
          <div className="px-4 py-2 border-b bg-muted/30">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-1 text-xs">
                <Users size={12} className="text-primary" />
                <span className="font-medium">{analytics.activeToday}</span>
                <span className="text-muted-foreground">{tr("active today", "نشط اليوم")}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <RefreshCw size={12} className="text-blue-500" />
                <span className="font-medium">{analytics.returningCustomers}</span>
                <span className="text-muted-foreground">{tr("returning", "عائد")}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Maximize2 size={12} className="text-orange-500" />
                <span className="font-medium">{analytics.heavyUsers}</span>
                <span className="text-muted-foreground">{tr("heavy", "نشط جداً")}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className={analytics.avgRating >= 4 ? "text-green-500" : "text-yellow-500"}>⭐</span>
                <span className="font-medium">{analytics.avgRating}</span>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-[#FDF5E6] text-foreground border border-border/10 rounded-bl-md shadow-xs"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#FDF5E6] border px-4 py-2.5 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-card">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={tr("Type a command (e.g. 'switch to menu tab')...", "اكتب أمراً للذكاء الاصطناعي...")}
              className="flex-1 px-4 py-2.5 rounded-xl bg-muted text-sm border focus:outline-hidden focus:ring-1 focus:ring-primary/20"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="btn-primary px-4 rounded-xl flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT AI AGENT SWARM DECK (5 Columns) */}
      <div className="lg:col-span-5 flex flex-col bg-card rounded-2xl border border-border/10 overflow-hidden shadow-sm h-full">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-primary animate-spin" style={{ animationDuration: "6s" }} />
            <h3 className="font-bold text-sm tracking-wide uppercase">{tr("AI Agent Swarm Deck", "منصة سرب الوكلاء")}</h3>
          </div>
          <span className="badge bg-green-500/10 text-green-700 border border-green-500/20 text-[9px] font-bold uppercase tracking-wider px-2">
            5 Active Nodes
          </span>
        </div>

        {/* Agents Grid List */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Node 1 */}
          <div className="border border-border/10 rounded-xl p-3 bg-muted/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              M-01
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">Maestro Orcherstrator</span>
                <span className="text-[9px] text-green-600 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-green-500 animate-ping" /> Synchronized
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">Orchestrates navigation routing & commands.</p>
            </div>
          </div>

          {/* Node 2 */}
          <div className="border border-border/10 rounded-xl p-3 bg-muted/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
              MB-02
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">Menu Builder Agent</span>
                <span className="text-[9px] text-green-600 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-green-500" /> Active
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">Dispatches direct database item catalog updates.</p>
            </div>
          </div>

          {/* Node 3 */}
          <div className="border border-border/10 rounded-xl p-3 bg-muted/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold text-xs shrink-0">
              SS-03
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">Security & System guard</span>
                <span className="text-[9px] text-green-600 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-green-500" /> Safe
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">Updates system configurations & feature flags.</p>
            </div>
          </div>

          {/* Node 4 */}
          <div className="border border-border/10 rounded-xl p-3 bg-muted/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
              BC-04
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">Broadcast Comms Agent</span>
                <span className="text-[9px] text-amber-600 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" /> Listening
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">Launches promotions & broadcasts alerts.</p>
            </div>
          </div>

          {/* Live Action Terminal Feed */}
          <div className="border border-[#D2B48C] bg-[#FAF0E6]/50 rounded-xl p-3 space-y-2 flex flex-col h-44">
            <div className="flex items-center justify-between border-b pb-1.5 border-[#D2B48C]/30">
              <span className="text-[11px] font-black uppercase text-[#654321] flex items-center gap-1.5">
                <Terminal size={12} /> {tr("Live Telemetry Log", "سجل التشغيل المباشر")}
              </span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-[9px] leading-relaxed text-[#654321]/80 space-y-1.5">
              {swarmLogs.map(log => (
                <div key={log.id} className="flex items-start gap-1">
                  <span className="text-primary font-bold shrink-0">[{log.agent}]</span>
                  <span className="flex-1">{log.action}</span>
                  <span className="text-[8px] text-muted-foreground shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
