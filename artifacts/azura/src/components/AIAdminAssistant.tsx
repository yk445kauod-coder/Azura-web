import { useState, useEffect, useRef } from "react";
import { db, ref, get, onValue, off, set, remove } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { decryptKey, chatWithAI, isValidApiKey } from "@/lib/crypto";
import { 
  Bot, Send, Loader2, Users, 
  Package, DollarSign, RefreshCw,
  XCircle, BookOpen, ExternalLink, Maximize2, Minimize2, FileText, Trash2,
  Download, FileSpreadsheet, BarChart3, TrendingUp
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuViewerRef = useRef<HTMLDivElement>(null);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  useEffect(() => {
    loadApiKey();
    loadChatHistory();
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
  };

  const updateAnalytics = ({ users = undefined, feedback = undefined }: { users?: any[]; feedback?: any[] }) => {
    setAnalytics(prev => {
      const currentUsers = users ?? prev ? [prev] : [];
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
    // Get initial data for all
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
  };

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg = lang === "ar"
        ? `🤖 أهلاً بك في مساعد أزورا الذكي!

☕ ${CAFE_CONTEXT.name}
📍 ${CAFE_CONTEXT.location}

أستطيع مساعدتك في كل شيء يخص أزورا!`
        : `🤖 Welcome to Azura Admin Assistant!

☕ ${CAFE_CONTEXT.name}
📍 ${CAFE_CONTEXT.location}

I can help you with everything regarding Azura!`;

      const welcome = {
        id: "welcome",
        role: "assistant" as const,
        content: welcomeMsg,
        timestamp: Date.now(),
      };
      setMessages([welcome]);
      saveMessage(welcome);
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

  const generateResponse = async (userInput: string): Promise<string> => {
    const input = userInput.toLowerCase();

    // User Analytics
    if (input.includes("users") || input.includes("analytics") || input.includes("customers") || input.includes("تحليل") || input.includes("مستخدمين")) {
      if (!analytics) return tr("Loading analytics...", "جاري تحميل التحليلات...");
      return lang === "ar"
        ? `👥 تقرير المستخدمين

• إجمالي المستخدمين: ${analytics.totalCustomers}
• نشط اليوم: ${analytics.activeToday}
• مستخدمين دائمين: ${analytics.returningCustomers}
• مستخدمين نشطين جداً: ${analytics.heavyUsers}
• إجمالي وقت الاستخدام: ${formatDuration(analytics.totalUsageTime)}`
        : `👥 User Analytics Report

• Total Users: ${analytics.totalCustomers}
• Active Today: ${analytics.activeToday}
• Returning Customers: ${analytics.returningCustomers}
• Heavy Users (30m+): ${analytics.heavyUsers}
• Total App Usage Time: ${formatDuration(analytics.totalUsageTime)}`;
    }

    // Menu search
    const searchTerm = userInput.toLowerCase();
    const filteredItems = menuItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm) ||
      (item.nameAr && item.nameAr.includes(searchTerm)) ||
      item.category.toLowerCase().includes(searchTerm)
    ).slice(0, 8);

    if (filteredItems.length > 0) {
      const itemsList = filteredItems.map(item =>
        `• ${item.name}${item.nameAr ? ` (${item.nameAr})` : ''} - ${item.price} EGP [${item.category}]`
      ).join("\n");
      return lang === "ar"
        ? `🍽️ نتائج البحث (${filteredItems.length} عنصر)

${itemsList}`
        : `🍽️ Search Results (${filteredItems.length} items)

${itemsList}`;
    }

    // Suggestions
    if (input.includes("suggest") || input.includes("idea") || input.includes("اقتراح") || input.includes("فكرة")) {
      return lang === "ar"
        ? `💡 اقتراحات للتحسين

1. إضافة عروض يومية
2. برنامج ولاء للعملاء
3. إشعارات ذكية للطلبات
4. تحسين القائمة بصور احترافية
5. التعاون مع شركات قريبة`
        : `💡 Improvement Suggestions

1. Add daily special offers
2. Loyalty program for customers
3. Smart order notifications
4. Improve menu with professional photos
5. Partner with nearby businesses`;
    }

    // Help
    if (input.includes("help") || input.includes("مساعدة") || input.includes("ماذا") || input.includes("commands")) {
      return lang === "ar"
        ? `🤖 أوامري المتاحة:

• "تحليلات" أو "مستخدمين" - تقرير المستخدمين
• "[اسم العنصر]" - بحث في القائمة
• "اقتراحات" - أفكار للتحسين
• "عرض القائمة" - فتح القائمة`
        : `🤖 Available Commands:

• "analytics" or "users" - User activity report
• "[item name]" - Search menu
• "suggestions" - Improvement ideas
• "show menu" - Open menu viewer`;
    }

    // Default
    return lang === "ar"
      ? `🤔 يمكنني مساعدتك في:

• تحليلات المبيعات والطلبات
• البحث في القائمة وأسعارها
• اقتراحات للتحسين

اكتب "مساعدة" لرؤية جميع الأوامر.`
      : `🤔 I can help you with:

• Sales and order analytics
• Menu and price information
• Improvement suggestions

Type "help" to see all available commands.`;
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
    return `You are the 'Eye of Azura' — the master CRM Analyst, Media Buyer, and Strategic Business Advisor for Azura Cafe.

Your primary mission is to transform raw tracking data into actionable business intelligence.

## YOUR CAPABILITIES:
1. **CRM Analysis**: You monitor user retention, frequency, and total usage. Identify 'High Value Clients' and suggest loyalty rewards.
2. **Media Buying**: Based on peak activity times and popular categories, suggest budget allocation for Meta/Google Ads.
3. **Strategic Planning**: Recommend menu adjustments or price optimizations based on popularity.
4. **Report Generation**: You can generate structured business reports, marketing plans, and exportable data summaries (mention that the user can use the 'Export CSV' button for detailed logs).

## CURRENT CONTEXT:
- Cafe: ${CAFE_CONTEXT.name} (${CAFE_CONTEXT.location})
- Total Menu Items: ${menuItems.length}
- Live Analytics: ${JSON.stringify(analytics)}

## MENU SUMMARY:
${menuSummary}

## OPERATIONAL GUIDELINES:
- Be professional, data-driven, and highly strategic.
- Provide specific, actionable advice (e.g., "Run a 'Happy Hour' Meta Ad between 4 PM - 7 PM targeting local Alexandrians").
- When asked for reports, use professional business formatting (Headers, Bullet points, SWOT analysis).
- Help the owner understand 'Who' is using the app and 'How' to keep them coming back.
- If asked for technical reports, provide them in a clear Markdown structure.

Always prioritize ROI and customer lifetime value (LTV).`;
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
    saveMessage(userMessage);
    setInput("");
    setLoading(true);
    
    try {
      let response = "";
      if (apiKey) {
        const systemPrompt = buildSystemPrompt();

        const history = messages.slice(-10).map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

        response = await chatWithAI(apiKey, userMessage.content, history, systemPrompt);
      } else {
        response = await generateResponse(userMessage.content);
      }

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      saveMessage(assistantMessage);

      if (input.toLowerCase().includes("show menu") || input.toLowerCase().includes("عرض القائمة")) {
        setShowMenuViewer(true);
      }
    } catch (error) {
      console.error("AI Error:", error);
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
    <div className="flex flex-col h-[600px] bg-background rounded-2xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot size={16} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm">{tr("AI Assistant", "المساعد الذكي")}</p>
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
        <div className="bg-purple-50 border-b p-4 animate-in slide-in-from-top-2 duration-300">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-bl-md">
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
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={tr("Ask me anything about Azura...", "اسألني أي شيء عن أزورا...")}
            className="flex-1 px-4 py-2.5 rounded-xl bg-muted text-sm"
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
  );
}