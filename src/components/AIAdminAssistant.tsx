import { useState, useEffect, useRef, useCallback } from "react";
import { db, ref, get, onValue } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { decryptKey, isValidApiKey } from "@/lib/crypto";
import { 
  Bot, Send, Loader2, Users, 
  Package, DollarSign, RefreshCw,
  XCircle, BookOpen, ExternalLink, Maximize2, Minimize2, FileText,
  Sparkles, Zap, TrendingDown, TrendingUp, Calendar, Clock
} from "lucide-react";

interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  totalCustomers: number;
  ordersToday: number;
  revenueToday: number;
  topItems: { name: string; nameAr?: string; count: number }[];
  ordersByStatus: Record<string, number>;
  avgRating: number;
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

// Agentic AI Response Generator - Uses Pollinations AI for intelligent responses
async function generateAgenticResponse(
  userInput: string,
  context: {
    analytics: AnalyticsData | null;
    menuItems: MenuItemData[];
    orders: any[];
    lang: string;
  }
): Promise<string> {
  const { analytics, menuItems, orders, lang } = context;
  const isArabic = lang === "ar";
  
  // Build rich context for the AI
  const contextSummary = {
    analytics: analytics ? {
      totalRevenue: analytics.totalRevenue,
      revenueToday: analytics.revenueToday,
      ordersToday: analytics.ordersToday,
      totalOrders: analytics.totalOrders,
      avgOrderValue: analytics.avgOrderValue,
      totalCustomers: analytics.totalCustomers,
      topItems: analytics.topItems.slice(0, 5),
      avgRating: analytics.avgRating
    } : null,
    menuStats: {
      totalItems: menuItems.length,
      categories: [...new Set(menuItems.map(m => m.category))]
    },
    recentOrders: orders.slice(0, 10).map(o => ({
      id: o.orderId,
      status: o.status,
      total: o.total,
      items: o.items?.slice(0, 3).map(i => i.name) || []
    }))
  };

  const prompt = `You are an expert AI assistant for Azura Café & Restaurant admin dashboard.

CONTEXT:
${JSON.stringify(contextSummary, null, 2)}

USER QUESTION: ${userInput}

INSTRUCTIONS:
1. Respond in ${isArabic ? "Egyptian Arabic (العامية المصرية)" : "English"}
2. Be helpful, concise, and actionable
3. Provide specific numbers and insights from the context
4. If the user asks for analytics, provide clear breakdowns
5. If they need help with orders, suggest specific actions
6. Always be professional and business-focused

Format your response with emojis for clarity. Keep it comprehensive but concise.`;

  try {
    const encodedPrompt = encodeURIComponent(prompt.slice(-3000));
    const url = `https://text.pollinations.ai/${encodedPrompt}?model=openai&seed=${Date.now()}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }
    
    return await response.text();
  } catch (err) {
    console.error("Agentic AI error:", err);
    // Fallback to basic response
    return isArabic
      ? "عذراً، لم أتمكن من معالجة طلبك الآن. حاول مرة أخرى."
      : "Sorry, I couldn't process your request right now. Please try again.";
  }
}

export default function AIAdminAssistant() {
  const { lang } = useLang();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showMenuViewer, setShowMenuViewer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuViewerRef = useRef<HTMLDivElement>(null);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  // Load AI settings from Firebase
  useEffect(() => {
    const apiRef = ref(db, "api-settings");
    const unsubscribe = onValue(apiRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val() as Record<string, unknown>;
        const storedKey = data.geminiKey as string;
        
        if (storedKey) {
          const decrypted = decryptKey(storedKey);
          if (decrypted && isValidApiKey(decrypted)) {
            setApiKey(decrypted);
          }
        }
        setAiEnabled(data.aiEnabled !== false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadAnalytics(), loadMenuItems()]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const ordersSnap = await get(ref(db, "orders"));
      const feedbackSnap = await get(ref(db, "feedback"));
      
      let ordersData: any[] = [];
      let feedback: any[] = [];
      
      if (ordersSnap.exists()) {
        const data = ordersSnap.val();
        Object.entries(data).forEach(([key, val]) => {
          if (val && typeof val === "object") {
            if ((val as any).items) {
              ordersData.push({ ...(val as any), userId: key });
            } else {
              Object.values(val as object).forEach((order: any) => {
                if (order?.orderId) ordersData.push({ ...order, userId: key });
              });
            }
          }
        });
      }
      
      // Store orders for AI context
      setOrders(ordersData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      
      if (feedbackSnap.exists()) {
        const data = feedbackSnap.val();
        feedback = Object.entries(data).map(([id, f]) => ({ id, ...(f as any) }));
      }

      const today = new Date().setHours(0, 0, 0, 0);
      const ordersToday = ordersData.filter(o => (o.createdAt || 0) >= today);
      const revenueToday = ordersToday.reduce((sum, o) => sum + (o.total || 0), 0);
      
      const itemCounts: Record<string, { name: string; nameAr?: string; count: number }> = {};
      ordersData.forEach(order => {
        (order.items || []).forEach((item: any) => {
          const key = item.name;
          if (!itemCounts[key]) {
            itemCounts[key] = { name: item.name, nameAr: item.nameAr, count: 0 };
          }
          itemCounts[key].count += item.quantity;
        });
      });
      const topItems = Object.entries(itemCounts)
        .map(([name, data]) => ({ name, nameAr: data.nameAr, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const ordersByStatus: Record<string, number> = {};
      ordersData.forEach(o => {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
      });

      const avgRating = feedback.length > 0 
        ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
        : "0.0";

      setAnalytics({
        totalOrders: ordersData.length,
        totalRevenue: ordersData.reduce((sum, o) => sum + (o.total || 0), 0),
        avgOrderValue: ordersData.length > 0 ? Math.round(ordersData.reduce((sum, o) => sum + (o.total || 0), 0) / ordersData.length) : 0,
        totalCustomers: new Set(ordersData.map(o => o.userId)).size,
        ordersToday: ordersToday.length,
        revenueToday,
        topItems,
        ordersByStatus,
        avgRating: parseFloat(avgRating),
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const loadMenuItems = async () => {
    try {
      const snap = await get(ref(db, "menu"));
      if (snap.exists()) {
        const data = snap.val();
        const items: MenuItemData[] = [];
        
        Object.entries(data).forEach(([category, val]) => {
          if (val && typeof val === "object") {
            const firstItem = Object.values(val as object)[0] as any;
            if (firstItem && (firstItem.price !== undefined || firstItem.name)) {
              Object.entries(val as Record<string, any>).forEach(([id, item]) => {
                if (item && typeof item === "object") {
                  items.push({
                    id,
                    name: item.name || item.nameEn || id,
                    nameAr: item.nameAr || "",
                    price: item.price || 0,
                    category: item.category || category,
                    description: item.description || "",
                  });
                }
              });
            } else {
              Object.entries(val as Record<string, any>).forEach(([subCat, subItems]) => {
                if (subItems && typeof subItems === "object") {
                  Object.entries(subItems as Record<string, any>).forEach(([id, item]) => {
                    if (item && typeof item === "object") {
                      items.push({
                        id,
                        name: item.name || item.nameEn || id,
                        nameAr: item.nameAr || "",
                        price: item.price || 0,
                        category: item.category || subCat,
                        description: item.description || "",
                      });
                    }
                  });
                }
              });
            }
          }
        });
        
        setMenuItems(items);
      }
    } catch (error) {
      console.error("Error loading menu:", error);
    }
  };

  useEffect(() => {
    const welcomeMsg = lang === "ar" 
      ? `🤖 أهلاً بك في مساعد أزورا الذكي!

☕ ${CAFE_CONTEXT.name}
📍 ${CAFE_CONTEXT.location}

أستطيع مساعدتك في:

📊 التحليلات - تقارير شاملة عن المبيعات والطلبات
📦 الطلبات - متابعة حالة الطلبات
👥 العملاء - معلومات العملاء والمبيعات
💰 الإيرادات - تفاصيل الإيرادات والأرباح
🍽️ القائمة - البحث في القائمة وأسعارها
💡 اقتراحات - أفكار لتحسين الخدمة

⚡ إجراءات سريعة مقترحة:
• "ما هي الإيرادات اليوم؟"
• "أكثر العناصر مبيعاً"
• "حالة الطلبات"
• "اقتراحات للتحسين"

اكتب سؤالك وسأساعدك!`
      : `🤖 Welcome to Azura AI Assistant!

☕ ${CAFE_CONTEXT.name}
📍 ${CAFE_CONTEXT.location}

I can help you with:

📊 Analytics - Comprehensive sales and order reports
📦 Orders - Track order status
👥 Customers - Customer and sales info
💰 Revenue - Revenue and profit details
🍽️ Menu - Search menu and prices
💡 Suggestions - Ideas to improve service

⚡ Suggested quick actions:
• "What's today's revenue?"
• "Top selling items"
• "Order status"
• "Improvement suggestions"

Just ask me anything and I'll help!`;
    
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: welcomeMsg,
      timestamp: Date.now(),
    }]);
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Agentic AI Response Handler - Uses real AI API
  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;
    
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setLoading(true);
    
    try {
      // Use agentic AI to generate response with full context
      const response = await generateAgenticResponse(currentInput, {
        analytics,
        menuItems,
        orders,
        lang,
      });
      
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-open menu viewer if requested
      if (currentInput.toLowerCase().includes("show menu") || 
          currentInput.includes("عرض القائمة") ||
          currentInput.includes("القائمة")) {
        setShowMenuViewer(true);
      }
    } catch (error) {
      console.error("Agentic AI Error:", error);
      // Fallback message
      const errorMsg = lang === "ar" 
        ? "عذراً، حدث خطأ. حاول مرة أخرى."
        : "Sorry, an error occurred. Please try again.";
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorMsg,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, analytics, menuItems, orders, lang]);

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
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center relative">
            <Bot size={16} className="text-primary" />
            {/* AI Active Indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
              <Sparkles size={8} className="text-white" />
            </div>
          </div>
          <div>
            <p className="font-bold text-sm flex items-center gap-1.5">
              {tr("AI Assistant", "المساعد الذكي")}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {aiEnabled ? "AI" : "OFF"}
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground">{CAFE_CONTEXT.name}</p>
          </div>
        </div>
        <div className="flex gap-1">
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
        </div>
      </div>

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
                href="https://azura-menu.pages.dev"
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
              src="https://azura-menu.pages.dev" 
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
              <Package size={12} className="text-primary" />
              <span className="font-medium">{analytics.ordersToday}</span>
              <span className="text-muted-foreground">{tr("today", "اليوم")}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <DollarSign size={12} className="text-green-500" />
              <span className="font-medium">{analytics.revenueToday}</span>
              <span className="text-muted-foreground">EGP</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Users size={12} className="text-blue-500" />
              <span className="font-medium">{analytics.totalCustomers}</span>
              <span className="text-muted-foreground">{tr("customers", "عميل")}</span>
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