import { useState, useEffect, useRef } from "react";
import { db, ref, onValue, off, update, set, push, remove, get } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { compressToBase64, base64SizeKB } from "@/lib/imageUtils";
import { swalSuccess, swalError, swalConfirm } from "@/lib/swal";
import { encryptKey } from "@/lib/crypto";
import {
  BarChart3, UtensilsCrossed, MessageCircle, Star, Lightbulb,
  ShieldCheck, ArrowLeft, Plus, Trash2,
  Send, Upload, Clock,
  ImageIcon, Megaphone, Film,
  Key, Settings,
  Download, Trash, Save,
  Bot, Sparkles, Wifi, WifiOff, AlertTriangle,
  Users, Activity, Monitor, Smartphone, Globe,
} from "lucide-react";
import { fullMenuData } from "@/lib/fullMenu";

const ADMIN_PIN = "azura2024";
type Tab = "overview" | "menu" | "chat" | "reviews" | "ideas" | "broadcast" | "ai" | "api" | "users";

interface MenuItem { id: string; name: string; nameAr: string; price: number; category: string; available: boolean; image: string; }
interface ChatSession { uid: string; userName: string; lastMessage: string; lastAt: number; unreadAdmin: number; }
interface ChatMsg { id: string; text: string; sender: "user" | "admin"; createdAt: number; }
interface Feedback { id: string; userName: string; rating: number; comment: string; createdAt: number; read: boolean; }
interface Broadcast { id: string; title: string; titleAr: string; message: string; messageAr: string; type: "info" | "promo" | "alert"; emoji: string; createdAt: number; }
interface Reel { id: string; image: string; caption: string; captionAr: string; likes: number; createdAt: number; authorName: string; pinned?: boolean; }
interface UserLog { id: string; deviceId: string; uid: string; name: string; tableNumber: string; loginCount: number; timestamp: number; createdAt: number; eventType: string; deviceInfo: { userAgent: string; platform: string; language: string; }; }

// Aggregate users from logs
interface UserSummary { uid: string; name: string; deviceId: string; tableNumber: string; totalVisits: number; firstLogin: number; lastLogin: number; logs: UserLog[]; deviceInfo: { userAgent: string; platform: string; language: string; }; }

const CATS = ["New Items", "Breakfast", "Toast", "Croissant", "Soup", "Appetizers", "Salad", "Pasta", "Tortilla Sandwiches", "Vina Sandwiches", "Main Dishes - Chicken", "Main Dishes - Meat", "Beef Burger", "Smash Burger", "Fried Chicken Sandwich", "Extra Kitchen", "Hot Drinks", "Iced Drinks", "Fresh Juice", "Cocktails", "Smoothie", "Milkshake", "Waffle", "Desserts", "Crepe", "Mini Pancakes", "Pancakes", "Extra Drinks", "Soft Drink", "Hookah"];
const BLANK_ITEM = { name: "", nameAr: "", price: "", category: "New Items", image: "" };
const BLANK_BROADCAST = { title: "", titleAr: "", message: "", messageAr: "", type: "info" as const, emoji: "📢" };

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <span key={i} style={{ fontSize: size, color: i <= n ? "#F59E0B" : "#D1D5DB" }}>★</span>
      ))}
    </span>
  );
}

function CssBar({ pct, color = "hsl(var(--primary))" }: { pct: number; color?: string }) {
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 0)}%`, background: color }} />
    </div>
  );
}

// AI Configuration Interface
interface AIConfig {
  systemPrompt: string;
  systemPromptAr: string;
  baristaFemale: string;
  baristaMale: string;
  temperature: number;
  maxTokens: number;
}

export default function Admin() {
  const { lang, isRTL } = useLang();
  const [, navigate] = useLocation();
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("azura-admin") === "true");
  const [pinErr, setPinErr] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  
  // Data states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);

  // Chat state
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Menu form state
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState(BLANK_ITEM);
  const [uploading, setUploading] = useState(false);
  const [imgSize, setImgSize] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Broadcast form
  const [newBroadcast, setNewBroadcast] = useState(BLANK_BROADCAST);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // API Settings
  const [apiSettings, setApiSettings] = useState({
    groqKey: "",
    aiEnabled: true,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);

  // AI Config
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    systemPrompt: "You are Zura, a friendly AI barista at Azura Cafe. Help customers with their orders.",
    systemPromptAr: "أنتِ زورا، باريستا ودودة في مقهى أزورا. ساعدي العملاء في طلباتهم.",
    baristaFemale: "Zura",
    baristaMale: "Zure",
    temperature: 0.85,
    maxTokens: 500,
  });
  const [savingAiConfig, setSavingAiConfig] = useState(false);

  // User Logs state
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [userSummary, setUserSummary] = useState<UserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Translation helper
  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;
  const inp = "input-field px-3 py-2.5 text-sm w-full";

  // Load data from Firebase
  useEffect(() => {
    if (!authed) return;

    // Menu
    const menuRef = ref(db, "menu");
    onValue(menuRef, (snap) => {
      if (!snap.exists()) {
        // Seed menu from local data
        set(ref(db, "menu"), fullMenuData).catch(console.error);
        return;
      }
      const data = snap.val();
      if (typeof data === "object" && data !== null) {
        const items: MenuItem[] = [];
        Object.entries(data as Record<string, unknown>).forEach(([category, val]) => {
          if (typeof val === "object" && val !== null) {
            Object.entries(val as Record<string, unknown>).forEach(([id, itemData]) => {
              if (typeof itemData === "object" && itemData) {
                const item = itemData as Record<string, unknown>;
                items.push({
                  id,
                  name: String(item.name || item.nameEn || id),
                  nameAr: String(item.nameAr || ""),
                  price: Number(item.price) || 0,
                  category: String(category),
                  available: item.available !== false,
                  image: String(item.image || item.img || ""),
                });
              }
            });
          }
        });
        setMenuItems(items);
      }
    });

    // Support chat
    const chatRef = ref(db, "support-chat");
    onValue(chatRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, { meta?: ChatSession }>;
      const sessions = Object.entries(data)
        .filter(([, v]) => v?.meta)
        .map(([uid, v]) => ({ ...v.meta!, uid }))
        .sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
      setChats(sessions);
    });

    // Feedback
    onValue(ref(db, "feedback"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, Omit<Feedback, "id">>;
      setFeedback(Object.entries(data).map(([id, f]) => ({ id, ...f })).sort((a, b) => b.createdAt - a.createdAt));
    });

    // Broadcasts
    onValue(ref(db, "broadcast"), (snap) => {
      if (!snap.exists()) { setBroadcasts([]); return; }
      const data = snap.val() as Record<string, Omit<Broadcast, "id">>;
      setBroadcasts(Object.entries(data).map(([id, b]) => ({ id, ...b })).sort((a, b) => b.createdAt - a.createdAt));
    });

    // API Settings
    onValue(ref(db, "api-settings"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, unknown>;
      setApiSettings({
        groqKey: (data.groqKey as string) || "",
        aiEnabled: data.aiEnabled !== false,
      });
    });

    // AI Config
    onValue(ref(db, "ai-config"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, unknown>;
      setAiConfig({
        systemPrompt: String(data.systemPrompt || aiConfig.systemPrompt),
        systemPromptAr: String(data.systemPromptAr || aiConfig.systemPromptAr),
        baristaFemale: String(data.baristaFemale || aiConfig.baristaFemale),
        baristaMale: String(data.baristaMale || aiConfig.baristaMale),
        temperature: Number(data.temperature) || aiConfig.temperature,
        maxTokens: Number(data.maxTokens) || aiConfig.maxTokens,
      });
    });

    // User Logs
    onValue(ref(db, "userLogs"), (snap) => {
      if (!snap.exists()) { setUserLogs([]); setUserSummary([]); return; }
      const data = snap.val() as Record<string, UserLog>;
      const logs = Object.entries(data).map(([id, log]) => ({ id, ...log }));
      setUserLogs(logs.sort((a, b) => b.timestamp - a.timestamp));
      
      // Aggregate by user
      const byUser: Record<string, UserLog[]> = {};
      logs.forEach(log => {
        if (!byUser[log.uid]) byUser[log.uid] = [];
        byUser[log.uid].push(log);
      });
      
      const summary: UserSummary[] = Object.entries(byUser).map(([uid, userLogs]) => {
        const sortedLogs = userLogs.sort((a, b) => b.timestamp - a.timestamp);
        return {
          uid,
          name: sortedLogs[0].name,
          deviceId: sortedLogs[0].deviceId,
          tableNumber: sortedLogs[0].tableNumber,
          totalVisits: sortedLogs.length,
          firstLogin: sortedLogs[sortedLogs.length - 1].timestamp,
          lastLogin: sortedLogs[0].timestamp,
          logs: sortedLogs,
          deviceInfo: sortedLogs[0].deviceInfo,
        };
      }).sort((a, b) => b.lastLogin - a.lastLogin);
      
      setUserSummary(summary);
    });

    return () => {
      off(ref(db, "menu"));
      off(ref(db, "support-chat"));
      off(ref(db, "feedback"));
      off(ref(db, "broadcast"));
      off(ref(db, "api-settings"));
      off(ref(db, "ai-config"));
      off(ref(db, "userLogs"));
    };
  }, [authed]);

  // Chat messages listener
  useEffect(() => {
    if (!selectedChat) return;
    const msgsRef = ref(db, `support-chat/${selectedChat}/messages`);
    onValue(msgsRef, (snap) => {
      if (!snap.exists()) { setChatMsgs([]); return; }
      const data = snap.val() as Record<string, Omit<ChatMsg, "id">>;
      setChatMsgs(Object.entries(data).map(([id, m]) => ({ id, ...m })).sort((a, b) => a.createdAt - b.createdAt));
    });
    update(ref(db, `support-chat/${selectedChat}/meta`), { unreadAdmin: 0 });
    return () => off(ref(db, `support-chat/${selectedChat}/messages`));
  }, [selectedChat]);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  // Auth
  const login = () => {
    if (pin === ADMIN_PIN) { sessionStorage.setItem("azura-admin", "true"); setAuthed(true); }
    else setPinErr(tr("Wrong PIN. Try: azura2024", "PIN خاطئ. جرب: azura2024"));
  };

  // Menu helpers
  const toggleAvail = (item: MenuItem) => {
    const path = `menu/${item.category}/${item.id}`;
    update(ref(db, path), { available: !item.available });
  };

  const deleteItem = async (item: MenuItem) => {
    if (!await swalConfirm(tr("Delete Item", "حذف العنصر"), tr(`Delete "${item.name}"?`, `حذف "${item.nameAr || item.name}"؟`), tr("Delete", "حذف"), tr("Cancel", "إلغاء"))) return;
    remove(ref(db, `menu/${item.category}/${item.id}`));
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const b64 = await compressToBase64(file, 400, 0.72);
      setNewItem((p) => ({ ...p, image: b64 }));
      setImgSize(base64SizeKB(b64));
    } catch { swalError(tr("Image compression failed", "فشل ضغط الصورة")); }
    setUploading(false);
  };

  const saveItem = async () => {
    if (!newItem.name || !newItem.price) return;
    setSavingItem(true);
    const r = push(ref(db, `menu/${newItem.category}`));
    await set(r, {
      name: newItem.name,
      nameAr: newItem.nameAr,
      price: Number(newItem.price),
      category: newItem.category,
      available: true,
      image: newItem.image,
    });
    setNewItem(BLANK_ITEM);
    setAdding(false);
    setSavingItem(false);
    setImgSize(0);
    swalSuccess(tr("Item added!", "تم إضافة العنصر!"));
  };

  // Chat helpers
  const sendReply = async () => {
    if (!chatInput.trim() || !selectedChat) return;
    const r = push(ref(db, `support-chat/${selectedChat}/messages`));
    await set(r, { text: chatInput.trim(), sender: "admin" as const, createdAt: Date.now(), readByAdmin: true });
    await update(ref(db, `support-chat/${selectedChat}/meta`), { lastMessage: chatInput.trim(), lastAt: Date.now() });
    setChatInput("");
  };

  // Feedback helpers
  const markFeedbackRead = (id: string) => update(ref(db, `feedback/${id}`), { read: true });

  // Broadcast helpers
  const sendBroadcast = async () => {
    if (!newBroadcast.title || !newBroadcast.message) return;
    setSendingBroadcast(true);
    const r = push(ref(db, "broadcast"));
    await set(r, { ...newBroadcast, createdAt: Date.now() });
    setNewBroadcast(BLANK_BROADCAST);
    setSendingBroadcast(false);
    swalSuccess(tr("Broadcast sent!", "تم إرسال الإشعار!"));
  };
  const deleteBroadcast = (id: string) => remove(ref(db, `broadcast/${id}`));

  // API Settings helpers
  const saveApiSettings = async () => {
    setSavingApiKey(true);
    await set(ref(db, "api-settings"), {
      groqKey: apiSettings.groqKey ? encryptKey(apiSettings.groqKey) : "",
      aiEnabled: apiSettings.aiEnabled,
      updatedAt: Date.now(),
    });
    setSavingApiKey(false);
    swalSuccess(tr("API settings saved!", "تم حفظ إعدادات API!"));
  };

  // AI Config helpers
  const saveAiConfig = async () => {
    setSavingAiConfig(true);
    await set(ref(db, "ai-config"), {
      ...aiConfig,
      updatedAt: Date.now(),
    });
    setSavingAiConfig(false);
    swalSuccess(tr("AI config saved!", "تم حفظ إعدادات الذكاء الاصطناعي!"));
  };

  // Analytics
  const avgRating = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : "—";
  const unreadFeedback = feedback.filter((f) => !f.read).length;
  const unreadChats = chats.reduce((s, c) => s + (c.unreadAdmin || 0), 0);

  // PIN screen
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(160deg,hsl(38,50%,90%),hsl(22,40%,82%))" }}>
        <div className="card-elevated rounded-3xl p-8 max-w-xs w-full text-center page-enter">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "hsl(var(--primary))", boxShadow: "var(--shadow-primary)" }}>
            <ShieldCheck size={26} className="text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-primary mb-1" style={{ fontFamily: "var(--font-heading)" }}>{tr("Admin Panel", "لوحة الإدارة")}</h1>
          <p className="text-xs text-muted-foreground mb-5">{tr("Enter the admin PIN to continue", "أدخل رمز المدير للمتابعة")}</p>
          <input type="password" autoFocus placeholder={tr("Admin PIN", "رمز الدخول")}
            value={pin} onChange={(e) => { setPin(e.target.value); setPinErr(""); }}
            onKeyDown={(e) => e.key === "Enter" && login()}
            className={`${inp} mb-3 text-center text-xl font-bold tracking-[0.3em]`}
          />
          {pinErr && <p className="text-destructive text-xs mb-3 font-semibold">{pinErr}</p>}
          <button onClick={login} className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold">{tr("Login", "دخول")}</button>
          <button onClick={() => navigate("/menu")} className="btn-ghost w-full py-2.5 text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
            <ArrowLeft size={12}/> {tr("Back to App", "العودة للتطبيق")}
          </button>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; icon: React.ReactNode; en: string; ar: string; badge?: number }[] = [
    { id: "overview", icon: <BarChart3 size={14}/>, en: "Overview", ar: "الرئيسية" },
    { id: "menu", icon: <UtensilsCrossed size={14}/>, en: "Menu", ar: "القائمة" },
    { id: "chat", icon: <MessageCircle size={14}/>, en: "Chat", ar: "الدردشة", badge: unreadChats || 0 },
    { id: "reviews", icon: <Star size={14}/>, en: "Reviews", ar: "تقييمات", badge: unreadFeedback || 0 },
    { id: "users", icon: <Users size={14}/>, en: "Users", ar: "المستخدمين" },
    { id: "broadcast", icon: <Megaphone size={14}/>, en: "Broadcast", ar: "إشعارات" },
    { id: "ai", icon: <Bot size={14}/>, en: "AI Config", ar: "إعدادات الذكاء" },
    { id: "api", icon: <Key size={14}/>, en: "API", ar: "API" },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* Admin Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3" style={{ background: "hsl(var(--primary))", boxShadow: "var(--shadow-md)" }}>
        <button onClick={() => navigate("/menu")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
          <ArrowLeft size={20}/>
        </button>
        <h1 className="text-base font-bold text-primary-foreground flex-1" style={{ fontFamily: "var(--font-heading)" }}>
          {tr("Azura Admin", "إدارة أزورا")}
        </h1>
        <button onClick={() => { sessionStorage.removeItem("azura-admin"); setAuthed(false); }} className="text-primary-foreground/70 hover:text-primary-foreground text-xs">
          {tr("Logout", "خروج")}
        </button>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-hide" style={{ background: "hsl(var(--card))" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            <span className="flex items-center gap-1.5">
              {t.icon}
              {t.en}
              {t.badge && t.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{t.badge}</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="space-y-4 page-enter">
            <h2 className="text-lg font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              {tr("Dashboard", "لوحة التحكم")}
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="card-elevated rounded-2xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{tr("Menu Items", "عناصر القائمة")}</p>
                <p className="text-2xl font-extrabold text-primary">{menuItems.length}</p>
              </div>
              <div className="card-elevated rounded-2xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{tr("Reviews", "تقييمات")}</p>
                <p className="text-2xl font-extrabold text-primary">{feedback.length}</p>
              </div>
              <div className="card-elevated rounded-2xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{tr("Avg Rating", "متوسط التقييم")}</p>
                <p className="text-2xl font-extrabold text-primary flex items-center justify-center gap-1">
                  {avgRating} <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                </p>
              </div>
              <div className="card-elevated rounded-2xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{tr("Chats", "محادثات")}</p>
                <p className="text-2xl font-extrabold text-primary">{chats.length}</p>
              </div>
            </div>

            {/* AI Status */}
            <div className="card-elevated rounded-2xl p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Bot size={16} className="text-primary"/> {tr("AI Status", "حالة الذكاء الاصطناعي")}
              </h3>
              <div className="flex items-center gap-2">
                {apiSettings.aiEnabled ? (
                  <>
                    <Wifi size={16} className="text-green-500"/>
                    <span className="text-sm text-green-600 font-medium">{tr("AI Enabled", "الذكاء الاصطناعي مفعل")}</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={16} className="text-red-500"/>
                    <span className="text-sm text-red-600 font-medium">{tr("AI Disabled", "الذكاء الاصطناعي معطل")}</span>
                  </>
                )}
                {apiSettings.groqKey ? (
                  <span className="text-xs text-green-500 ml-auto">{tr("Groq Connected", "Groq متصل")}</span>
                ) : (
                  <span className="text-xs text-amber-500 ml-auto flex items-center gap-1">
                    <AlertTriangle size={12}/> {tr("Using Fallback", "يستخدم النسخة المجانية")}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Menu Tab */}
        {tab === "menu" && (
          <div className="space-y-4 page-enter">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                {tr("Menu Management", "إدارة القائمة")}
              </h2>
              <button onClick={() => setAdding(!adding)} className="btn-primary px-4 py-2 rounded-xl text-sm">
                {adding ? tr("Cancel", "إلغاء") : `+ ${tr("Add Item", "إضافة")}`}
              </button>
            </div>

            {/* Add Item Form */}
            {adding && (
              <div className="card-elevated rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-sm">{tr("Add New Item", "إضافة عنصر جديد")}</h3>
                <input className={inp} placeholder={tr("Name (EN)", "الاسم (EN)")} value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))} />
                <input className={inp} placeholder={tr("Name (AR)", "الاسم (AR)")} value={newItem.nameAr} onChange={(e) => setNewItem((p) => ({ ...p, nameAr: e.target.value }))} />
                <input className={inp} type="number" placeholder={tr("Price (EGP)", "السعر (ج.م)")} value={newItem.price} onChange={(e) => setNewItem((p) => ({ ...p, price: e.target.value }))} />
                <select className={inp} value={newItem.category} onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}>
                  {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="hidden" id="img-upload"/>
                  <label htmlFor="img-upload" className="btn-secondary px-4 py-2 rounded-xl text-sm cursor-pointer flex items-center gap-2">
                    <ImageIcon size={14}/> {tr("Upload Image", "رفع صورة")}
                  </label>
                  {newItem.image && <span className="text-xs text-green-600">{tr("Image selected", "تم اختيار صورة")}</span>}
                </div>
                <button onClick={saveItem} disabled={savingItem || !newItem.name || !newItem.price} className="btn-primary w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50">
                  {savingItem ? tr("Saving...", "جاري الحفظ...") : tr("Save Item", "حفظ العنصر")}
                </button>
              </div>
            )}

            {/* Menu Items by Category */}
            {CATS.map((cat) => {
              const items = menuItems.filter((i) => i.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat} className="space-y-2">
                  <h3 className="font-bold text-sm text-muted-foreground">{cat}</h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className={`card rounded-xl p-3 flex items-center gap-3 ${!item.available ? "opacity-50" : ""}`}>
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover"/>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.name}</p>
                          {item.nameAr && <p className="text-xs text-muted-foreground truncate">{item.nameAr}</p>}
                          <p className="text-xs font-bold text-primary">{item.price} EGP</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleAvail(item)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold ${item.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {item.available ? tr("Active", "مفعل") : tr("Inactive", "معطل")}
                          </button>
                          <button onClick={() => deleteItem(item)} className="text-destructive p-2 hover:bg-red-50 rounded-lg">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Chat Tab */}
        {tab === "chat" && (
          <div className="space-y-4 page-enter">
            <h2 className="text-lg font-bold text-primary">{tr("Support Chats", "محادثات الدعم")}</h2>
            
            {chats.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-30"/>
                <p>{tr("No chats yet", "لا توجد محادثات")}</p>
              </div>
            ) : selectedChat ? (
              <div className="space-y-3">
                <button onClick={() => setSelectedChat(null)} className="text-sm text-primary hover:underline flex items-center gap-1">
                  <ArrowLeft size={14}/> {tr("Back to chats", "العودة للمحادثات")}
                </button>
                <div className="card-elevated rounded-2xl p-4 space-y-3 max-h-96 overflow-y-auto">
                  {chatMsgs.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <p>{msg.text}</p>
                        <p className="text-[10px] opacity-60 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef}/>
                </div>
                <div className="flex gap-2">
                  <input className={`${inp} flex-1`} placeholder={tr("Type a reply...", "اكتب رد...")}
                    value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  />
                  <button onClick={sendReply} className="btn-primary px-4 rounded-xl">
                    <Send size={16}/>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {chats.map((chat) => (
                  <div key={chat.uid} onClick={() => setSelectedChat(chat.uid)}
                    className="card rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {chat.userName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{chat.userName || tr("Unknown User", "مستخدم غير معروف")}</p>
                      <p className="text-xs text-muted-foreground truncate">{chat.lastMessage || tr("No messages", "لا توجد رسائل")}</p>
                    </div>
                    {chat.unreadAdmin > 0 && (
                      <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {chat.unreadAdmin}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {tab === "reviews" && (
          <div className="space-y-4 page-enter">
            <h2 className="text-lg font-bold text-primary">{tr("Reviews & Feedback", "التقييمات")}</h2>
            
            {feedback.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Star size={48} className="mx-auto mb-3 opacity-30"/>
                <p>{tr("No reviews yet", "لا توجد تقييمات")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedback.map((f) => (
                  <div key={f.id} className={`card rounded-xl p-4 ${!f.read ? "border-l-4 border-l-primary" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{f.userName || tr("Anonymous", "مجهول")}</span>
                        <Stars n={f.rating}/>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {f.comment && <p className="text-sm text-muted-foreground">{f.comment}</p>}
                    {!f.read && (
                      <button onClick={() => markFeedbackRead(f.id)} className="text-xs text-primary mt-2 hover:underline">
                        {tr("Mark as read", "تحديد كمقروء")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Broadcast Tab */}
        {tab === "broadcast" && (
          <div className="space-y-4 page-enter">
            <h2 className="text-lg font-bold text-primary">{tr("Broadcasts", "الإشعارات")}</h2>
            
            {/* Send Broadcast Form */}
            <div className="card-elevated rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-sm">{tr("Send New Broadcast", "إرسال إشعار جديد")}</h3>
              <input className={inp} placeholder={tr("Title (EN)", "العنوان (EN)")} value={newBroadcast.title} onChange={(e) => setNewBroadcast((p) => ({ ...p, title: e.target.value }))}/>
              <input className={inp} placeholder={tr("Title (AR)", "العنوان (AR)")} value={newBroadcast.titleAr} onChange={(e) => setNewBroadcast((p) => ({ ...p, titleAr: e.target.value }))}/>
              <textarea className={`${inp} resize-none`} rows={2} placeholder={tr("Message (EN)", "الرسالة (EN)")} value={newBroadcast.message} onChange={(e) => setNewBroadcast((p) => ({ ...p, message: e.target.value }))}/>
              <textarea className={`${inp} resize-none`} rows={2} placeholder={tr("Message (AR)", "الرسالة (AR)")} value={newBroadcast.messageAr} onChange={(e) => setNewBroadcast((p) => ({ ...p, messageAr: e.target.value }))}/>
              <div className="flex gap-2">
                {["info", "promo", "alert"].map((type) => (
                  <button key={type} onClick={() => setNewBroadcast((p) => ({ ...p, type: type as "info" | "promo" | "alert" }))}
                    className={`px-4 py-2 rounded-xl text-xs font-bold ${newBroadcast.type === type ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {type === "info" ? "📢 Info" : type === "promo" ? "🎉 Promo" : "⚠️ Alert"}
                  </button>
                ))}
              </div>
              <button onClick={sendBroadcast} disabled={sendingBroadcast || !newBroadcast.title || !newBroadcast.message}
                className="btn-primary w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50">
                {sendingBroadcast ? tr("Sending...", "جاري الإرسال...") : tr("Send Broadcast", "إرسال الإشعار")}
              </button>
            </div>

            {/* Broadcast List */}
            <div className="space-y-2">
              {broadcasts.map((b) => (
                <div key={b.id} className="card rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{b.emoji} {b.title}</span>
                    <button onClick={() => deleteBroadcast(b.id)} className="text-destructive hover:bg-red-50 p-1 rounded">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{b.message}</p>
                  <span className="text-[10px] text-muted-foreground/60 mt-1 block">{new Date(b.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div className="space-y-4 page-enter">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">{tr("User Activity", "نشاط المستخدمين")}</h2>
              <div className="text-sm text-muted-foreground">
                {tr("Total Users", "إجمالي المستخدمين")}: <span className="font-bold">{userSummary.length}</span>
              </div>
            </div>

            {/* User Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-primary" />
                  <span className="text-xs text-muted-foreground">{tr("Total Users", "إجمالي")}</span>
                </div>
                <p className="text-2xl font-extrabold text-primary">{userSummary.length}</p>
              </div>
              <div className="card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={16} className="text-green-500" />
                  <span className="text-xs text-muted-foreground">{tr("Total Logins", "إجمالي الدخول")}</span>
                </div>
                <p className="text-2xl font-extrabold text-green-600">{userLogs.length}</p>
              </div>
            </div>

            {/* User List */}
            <div className="space-y-3">
              {userSummary.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p>{tr("No users yet", "لا يوجد مستخدمين بعد")}</p>
                </div>
              ) : (
                userSummary.map((user) => (
                  <div 
                    key={user.uid} 
                    className={`card rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${selectedUser?.uid === user.uid ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedUser(selectedUser?.uid === user.uid ? null : user)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tr("Table", "طاولة")} {user.tableNumber || "-"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="px-2 py-0.5 bg-primary/10 rounded-full text-primary font-medium">
                            {user.totalVisits} {tr("visits", "زيارة")}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedUser?.uid === user.uid && (
                      <div className="mt-4 pt-4 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
                        {/* Device Info */}
                        <div className="flex items-start gap-2 text-xs">
                          <Smartphone size={14} className="mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{tr("Device ID", "معرف الجهاز")}:</p>
                            <p className="text-muted-foreground font-mono text-[10px] break-all">{user.deviceId}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2 text-xs">
                          <Globe size={14} className="mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{tr("Platform", "النظام")}: {user.deviceInfo.platform}</p>
                            <p className="text-muted-foreground">{tr("Language", "اللغة")}: {user.deviceInfo.language}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <Clock size={14} className="text-muted-foreground" />
                          <span>{tr("First login", "أول دخول")}: {new Date(user.firstLogin).toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs">
                          <Activity size={14} className="text-muted-foreground" />
                          <span>{tr("Last login", "آخر دخول")}: {new Date(user.lastLogin).toLocaleString()}</span>
                        </div>

                        {/* Login History */}
                        <div className="mt-3">
                          <p className="text-xs font-medium mb-2">{tr("Login History", "سجل الدخول")}</p>
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {user.logs.map((log, idx) => (
                              <div key={log.id} className="flex items-center justify-between text-xs bg-muted/50 rounded-lg p-2">
                                <div>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${log.eventType === "first_login" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                    {log.eventType === "first_login" ? tr("First", "أول") : tr("Return", "عودة")}
                                  </span>
                                  <span className="ml-2 text-muted-foreground">
                                    {tr("Table", "طاولة")} {log.tableNumber}
                                  </span>
                                </div>
                                <span className="text-muted-foreground text-[10px]">
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* AI Config Tab */}
        {tab === "ai" && (
          <div className="space-y-4 page-enter">
            <h2 className="text-lg font-bold text-primary">{tr("AI Configuration", "إعدادات الذكاء الاصطناعي")}</h2>
            
            <div className="card-elevated rounded-2xl p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{tr("System Prompt (English)", "نص النظام (إنجليزي)")}</label>
                <textarea className={`${inp} resize-none`} rows={4} value={aiConfig.systemPrompt}
                  onChange={(e) => setAiConfig((p) => ({ ...p, systemPrompt: e.target.value }))}/>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">{tr("System Prompt (Arabic)", "نص النظام (عربي)")}</label>
                <textarea className={`${inp} resize-none`} rows={4} value={aiConfig.systemPromptAr}
                  onChange={(e) => setAiConfig((p) => ({ ...p, systemPromptAr: e.target.value }))}/>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">{tr("Female AI Name", "اسم الذكاء الاصطناعي (أنثي)")}</label>
                  <input className={inp} value={aiConfig.baristaFemale}
                    onChange={(e) => setAiConfig((p) => ({ ...p, baristaFemale: e.target.value }))}/>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{tr("Male AI Name", "اسم الذكاء الاصطناعي (ذكر)")}</label>
                  <input className={inp} value={aiConfig.baristaMale}
                    onChange={(e) => setAiConfig((p) => ({ ...p, baristaMale: e.target.value }))}/>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">{tr("Temperature", "الحرارة")}</label>
                  <input className={inp} type="number" step="0.1" min="0" max="1" value={aiConfig.temperature}
                    onChange={(e) => setAiConfig((p) => ({ ...p, temperature: Number(e.target.value) }))}/>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{tr("Max Tokens", "الحد الأقصى للكلمات")}</label>
                  <input className={inp} type="number" min="100" max="2000" value={aiConfig.maxTokens}
                    onChange={(e) => setAiConfig((p) => ({ ...p, maxTokens: Number(e.target.value) }))}/>
                </div>
              </div>
              
              <button onClick={saveAiConfig} disabled={savingAiConfig} className="btn-primary w-full py-3 rounded-xl text-sm font-bold">
                {savingAiConfig ? tr("Saving...", "جاري الحفظ...") : tr("Save AI Config", "حفظ الإعدادات")}
              </button>
            </div>
          </div>
        )}

        {/* API Tab */}
        {tab === "api" && (
          <div className="space-y-4 page-enter">
            <h2 className="text-lg font-bold text-primary">{tr("API Settings", "إعدادات API")}</h2>
            
            <div className="card-elevated rounded-2xl p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{tr("Groq API Key", "مفتاح Groq API")}</label>
                <div className="flex gap-2">
                  <input type={showApiKey ? "text" : "password"} className={`${inp} flex-1`} placeholder={tr("Enter Groq API Key", "أدخل مفتاح Groq API")}
                    value={apiSettings.groqKey} onChange={(e) => setApiSettings((p) => ({ ...p, groqKey: e.target.value }))}/>
                  <button onClick={() => setShowApiKey(!showApiKey)} className="btn-secondary px-4 rounded-xl">
                    {showApiKey ? <Eye size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {tr("Get your free API key from groq.com", "احصل على مفتاح API مجاني من groq.com")}
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{tr("Enable AI", "تفعيل الذكاء الاصطناعي")}</span>
                <button onClick={() => setApiSettings((p) => ({ ...p, aiEnabled: !p.aiEnabled }))}
                  className={`w-12 h-6 rounded-full transition-colors ${apiSettings.aiEnabled ? "bg-green-500" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${apiSettings.aiEnabled ? "translate-x-6" : "translate-x-0.5"}`}/>
                </button>
              </div>
              
              <button onClick={saveApiSettings} disabled={savingApiKey} className="btn-primary w-full py-3 rounded-xl text-sm font-bold">
                {savingApiKey ? tr("Saving...", "جاري الحفظ...") : tr("Save Settings", "حفظ الإعدادات")}
              </button>
            </div>
            
            <div className="card-elevated rounded-2xl p-4">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-primary"/>
                {tr("Free AI Options", "خيارات الذكاء الاصطناعي المجانية")}
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>Groq</strong> - Fast LLaMA models (recommended)</li>
                <li>• <strong>Pollinations AI</strong> - Free fallback, no API key needed</li>
                <li>• <strong>Menu-based</strong> - Smart responses without AI</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
