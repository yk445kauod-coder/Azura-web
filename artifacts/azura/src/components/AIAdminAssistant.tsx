import { useState, useEffect, useRef } from "react";
import { db, ref, onValue, off, push, set, get } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { 
  Bot, Send, Loader2, Sparkles, BarChart3, TrendingUp, Users, 
  Package, DollarSign, Clock, AlertCircle, Lightbulb, RefreshCw,
  MessageSquare, CheckCircle, XCircle, ArrowUp, ArrowDown
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
  topItems: { name: string; count: number }[];
  ordersByStatus: Record<string, number>;
  recentTrend: "up" | "down" | "stable";
  peakHour: number;
  avgRating: number;
}

export default function AIAdminAssistant() {
  const { lang } = useLang();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  // Load analytics data
  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const ordersSnap = await get(ref(db, "orders"));
      const feedbackSnap = await get(ref(db, "feedback"));
      
      let orders: any[] = [];
      let feedback: any[] = [];
      
      if (ordersSnap.exists()) {
        const data = ordersSnap.val();
        Object.entries(data).forEach(([key, val]) => {
          if (val && typeof val === "object") {
            if ((val as any).items) {
              orders.push({ ...(val as any), userId: key });
            } else {
              Object.values(val as object).forEach((order: any) => {
                if (order?.orderId) orders.push({ ...order, userId: key });
              });
            }
          }
        });
      }
      
      if (feedbackSnap.exists()) {
        const data = feedbackSnap.val();
        feedback = Object.entries(data).map(([id, f]) => ({ id, ...(f as any) }));
      }

      const now = Date.now();
      const today = new Date().setHours(0, 0, 0, 0);
      const ordersToday = orders.filter(o => (o.createdAt || 0) >= today);
      const revenueToday = ordersToday.reduce((sum, o) => sum + (o.total || 0), 0);
      
      // Calculate top items
      const itemCounts: Record<string, number> = {};
      orders.forEach(order => {
        (order.items || []).forEach((item: any) => {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
      });
      const topItems = Object.entries(itemCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate orders by status
      const ordersByStatus: Record<string, number> = {};
      orders.forEach(o => {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
      });

      // Calculate peak hour
      const hourCounts: Record<number, number> = {};
      orders.forEach(o => {
        const hour = new Date(o.createdAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 12;

      // Calculate avg rating
      const avgRating = feedback.length > 0 
        ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
        : "0.0";

      setAnalytics({
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
        avgOrderValue: orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length) : 0,
        totalCustomers: new Set(orders.map(o => o.userId)).size,
        ordersToday: ordersToday.length,
        revenueToday,
        topItems,
        ordersByStatus,
        recentTrend: "up",
        peakHour,
        avgRating: parseFloat(avgRating),
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  // Initial welcome message
  useEffect(() => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: lang === "ar" 
        ? "مرحباً! أنا مساعدك الذكي في أزورا. يمكنني مساعدتك في:\n\n📊 **التحليلات**: اطلب تقارير عن المبيعات والطلبات\n📦 **الطلبات**: استعلم عن حالة الطلبات\n👥 **العملاء**: معلومات عن العملاء\n💡 **اقتراحات**: أفكار لتحسين الخدمة\n🔧 **إدارة**: أسئلة عن النظام\n\nكيف يمكنني مساعدتك اليوم؟"
        : "Hello! I'm your AI assistant at Azura. I can help you with:\n\n📊 **Analytics**: Request sales and order reports\n📦 **Orders**: Query order status\n👥 **Customers**: Customer information\n💡 **Suggestions**: Ideas to improve service\n🔧 **Management**: System questions\n\nHow can I help you today?",
      timestamp: Date.now(),
    }]);
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateResponse = async (userInput: string): Promise<string> => {
    const input = userInput.toLowerCase();
    
    // Analytics queries
    if (input.includes("analytics") || input.includes("report") || input.includes("تحليل") || input.includes("تقارير")) {
      if (!analytics) return tr("Loading analytics...", "جاري تحميل التحليلات...");
      return lang === "ar" 
        ? `📊 **تقرير التحليلات**\n\n` +
          `• إجمالي الطلبات: ${analytics.totalOrders}\n` +
          `• إجمالي الإيرادات: ${analytics.totalRevenue} ج.م\n` +
          `• متوسط قيمة الطلب: ${analytics.avgOrderValue} ج.م\n` +
          `• عدد العملاء: ${analytics.totalCustomers}\n` +
          `• طلبات اليوم: ${analytics.ordersToday}\n` +
          `• إيرادات اليوم: ${analytics.revenueToday} ج.م\n` +
          `• التقييم المتوسط: ${analytics.avgRating} ⭐\n` +
          `• ساعة الذروة: ${analytics.peakHour}:00`
        : `📊 **Analytics Report**\n\n` +
          `• Total Orders: ${analytics.totalOrders}\n` +
          `• Total Revenue: ${analytics.totalRevenue} EGP\n` +
          `• Avg Order Value: ${analytics.avgOrderValue} EGP\n` +
          `• Total Customers: ${analytics.totalCustomers}\n` +
          `• Orders Today: ${analytics.ordersToday}\n` +
          `• Revenue Today: ${analytics.revenueToday} EGP\n` +
          `• Avg Rating: ${analytics.avgRating} ⭐\n` +
          `• Peak Hour: ${analytics.peakHour}:00`;
    }

    // Top items
    if (input.includes("top item") || input.includes("best seller") || input.includes("الأكثر مبيعاً")) {
      if (!analytics || analytics.topItems.length === 0) return tr("No item data available.", "لا توجد بيانات عناصر.");
      const itemsList = analytics.topItems.map((item, i) => `${i + 1}. ${item.name} - ${item.count} orders`).join("\n");
      return lang === "ar" 
        ? `🏆 **الأكثر مبيعاً**\n\n${itemsList}`
        : `🏆 **Top Sellers**\n\n${itemsList}`;
    }

    // Orders status
    if (input.includes("order status") || input.includes("pending") || input.includes("حالة الطلبات")) {
      if (!analytics) return tr("Loading...", "جاري التحميل...");
      const { ordersByStatus } = analytics;
      return lang === "ar"
        ? `📦 **حالة الطلبات**\n\n` +
          `• في الانتظار: ${ordersByStatus.pending || 0}\n` +
          `• قيد التحضير: ${ordersByStatus.preparing || 0}\n` +
          `• جاهز: ${ordersByStatus.ready || 0}\n` +
          `• تم التسليم: ${ordersByStatus.delivered || 0}\n` +
          `• ملغي: ${ordersByStatus.cancelled || 0}`
        : `📦 **Order Status**\n\n` +
          `• Pending: ${ordersByStatus.pending || 0}\n` +
          `• Preparing: ${ordersByStatus.preparing || 0}\n` +
          `• Ready: ${ordersByStatus.ready || 0}\n` +
          `• Delivered: ${ordersByStatus.delivered || 0}\n` +
          `• Cancelled: ${ordersByStatus.cancelled || 0}`;
    }

    // Revenue
    if (input.includes("revenue") || input.includes("إيراد")) {
      if (!analytics) return tr("Loading...", "جاري التحميل...");
      return lang === "ar"
        ? `💰 **الإيرادات**\n\n` +
          `• إجمالي الإيرادات: ${analytics.totalRevenue} ج.م\n` +
          `• إيرادات اليوم: ${analytics.revenueToday} ج.م\n` +
          `• متوسط قيمة الطلب: ${analytics.avgOrderValue} ج.م`
        : `💰 **Revenue**\n\n` +
          `• Total Revenue: ${analytics.totalRevenue} EGP\n` +
          `• Today's Revenue: ${analytics.revenueToday} EGP\n` +
          `• Avg Order Value: ${analytics.avgOrderValue} EGP`;
    }

    // Suggestions
    if (input.includes("suggest") || input.includes("idea") || input.includes("اقتراح") || input.includes("فكرة")) {
      const suggestions = lang === "ar"
        ? [
            "💡 **اقتراحات للتحسين**",
            "",
            "1. **إضافة عروض يومية**: تقديم خصم يومي على عنصر معين",
            "2. **برنامج ولاء**: نظام نقاط للعملاء المتكررين",
            "3. **إشعارات ذكية**: تنبيهات عند جاهزية الطلب",
            "4. **تحسين القائمة**: إضافة صور احترافية للأطباق",
            "5. **تعاون مع الشركات**: عروض للشركات والمكاتب القريبة",
          ]
        : [
            "💡 **Improvement Suggestions**",
            "",
            "1. **Daily Offers**: Discount on specific item daily",
            "2. **Loyalty Program**: Points system for repeat customers",
            "3. **Smart Notifications**: Alerts when order is ready",
            "4. **Menu Improvement**: Professional photos for dishes",
            "5. **Corporate Partnerships**: Offers for nearby offices",
          ];
      return suggestions.join("\n");
    }

    // Help
    if (input.includes("help") || input.includes("مساعدة") || input.includes("ماذا")) {
      return lang === "ar"
        ? `🤖 **أوامر يمكنني مساعدتك بها:**\n\n` +
          `• اكتب "تحليلات" أو "تقارير" للحصول على تقرير شامل\n` +
          `• اكتب "الأكثر مبيعاً" لمعرفة أفضل العناصر\n` +
          `• اكتب "حالة الطلبات" لمعرفة عدد الطلبات بكل حالة\n` +
          `• اكتب "الإيرادات" للحصول على تقرير الإيرادات\n` +
          `• اكتب "اقتراحات" للحصول على أفكار للتحسين\n` +
          `• اكتب أي سؤال وسأحاول مساعدتك!`
        : `🤖 **Commands I can help with:**\n\n` +
          `• Type "analytics" or "reports" for comprehensive report\n` +
          `• Type "top items" to see best sellers\n` +
          `• Type "order status" to see orders by status\n` +
          `• Type "revenue" for revenue report\n` +
          `• Type "suggestions" for improvement ideas\n` +
          `• Ask any question and I'll try to help!`;
    }

    // Default response
    return lang === "ar"
      ? `🤔 لم أفهم سؤالك تماماً. اكتب "مساعدة" لرؤية الأوامر المتاحة.`
      : `🤔 I didn't quite understand your question. Type "help" to see available commands.`;
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
      const response = await generateResponse(input);
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-background rounded-2xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">{tr("AI Assistant", "المساعد الذكي")}</h3>
            <p className="text-[10px] text-muted-foreground">{tr("Powered by Azura AI", "مدعوم من أزورا AI")}</p>
          </div>
        </div>
        <button 
          onClick={loadAnalytics}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title={tr("Refresh Data", "تحديث البيانات")}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Analytics Quick View */}
      {analytics && (
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
            placeholder={tr("Ask me anything...", "اسألني أي شيء...")}
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