import { useState, useEffect, useRef } from "react";
import { db, ref, onValue, off, update, set, push, remove } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { compressToBase64, base64SizeKB } from "@/lib/imageUtils";
import { swalSuccess, swalError, swalConfirm } from "@/lib/swal";
import { encryptKey } from "@/lib/crypto";
import {
  BarChart3, UtensilsCrossed, MessageCircle, Star, Lightbulb,
  ShieldCheck, ArrowLeft, Plus, Trash2, Send, Upload,
  Megaphone, Key, Bot, Sparkles, Wifi, WifiOff, AlertTriangle,
  Users, Activity, ChevronDown, ChevronUp, Search, Filter,
  Globe, Smartphone, Edit3, Save, X, CheckCircle, Clock,
  TrendingUp, Eye, Hash, Zap,
} from "lucide-react";
import { fullMenuData } from "@/lib/fullMenu";
import AIAdminAssistant from "@/components/AIAdminAssistant";

const ADMIN_PIN = "azura2024";
type Tab = "overview" | "menu" | "chat" | "reviews" | "ideas" | "users" | "broadcast" | "ai" | "api";

interface MenuItem { id: string; name: string; nameAr: string; price: number; category: string; available: boolean; image: string; }
interface ChatSession { uid: string; userName: string; lastMessage: string; lastAt: number; unreadAdmin: number; }
interface ChatMsg { id: string; text: string; sender: "user" | "admin"; createdAt: number; }
interface Feedback { id: string; userName: string; rating: number; comment: string; createdAt: number; read: boolean; }
interface Broadcast { id: string; title: string; titleAr: string; message: string; messageAr: string; type: "info" | "promo" | "alert"; emoji: string; createdAt: number; }
interface Suggestion { id: string; itemName: string; itemNameAr: string; description: string; category: string; status: "pending" | "approved" | "rejected"; votes: number; createdAt: number; authorName: string; image?: string; }
interface UserLog { id: string; uid: string; name: string; tableNumber: string; loginCount: number; timestamp: number; deviceInfo: { userAgent: string; platform: string; language: string }; }
interface UserSummary { uid: string; name: string; tableNumber: string; totalVisits: number; firstLogin: number; lastLogin: number; platform: string; }

const CATS = ["New Items","Breakfast","Toast","Croissant","Soup","Appetizers","Salad","Pasta","Tortilla Sandwiches","Vina Sandwiches","Main Dishes - Chicken","Main Dishes - Meat","Beef Burger","Smash Burger","Fried Chicken Sandwich","Extra Kitchen","Hot Drinks","Iced Drinks","Fresh Juice","Cocktails","Smoothie","Milkshake","Waffle","Desserts","Crepe","Mini Pancakes","Pancakes","Extra Drinks","Soft Drink","Hookah"];
const BLANK_ITEM = { name: "", nameAr: "", price: "", category: "New Items", image: "" };
const BLANK_BROADCAST = { title: "", titleAr: "", message: "", messageAr: "", type: "info" as const, emoji: "📢" };

interface AIConfig {
  systemPrompt: string;
  systemPromptAr: string;
  baristaFemale: string;
  baristaMale: string;
  temperature: number;
  maxTokens: number;
}

function StatCard({ label, value, icon, color = "text-primary" }: { label: string; value: React.ReactNode; icon: React.ReactNode; color?: string }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)" }}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color === "text-primary" ? "bg-primary/10" : color === "text-green-500" ? "bg-green-50" : color === "text-yellow-500" ? "bg-yellow-50" : "bg-blue-50"}`}>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

function Stars({ n, size = 13 }: { n: number; size?: number }) {
  return <span className="flex gap-0.5">{[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: size, color: i <= n ? "#F59E0B" : "#E5E7EB" }}>★</span>)}</span>;
}

export default function Admin() {
  const { lang, isRTL } = useLang();
  const [, navigate] = useLocation();
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("azura-admin") === "true");
  const [pinErr, setPinErr] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [menuCatFilter, setMenuCatFilter] = useState("all");
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);

  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState(BLANK_ITEM);
  const [uploading, setUploading] = useState(false);
  const [imgSize, setImgSize] = useState(0);
  const [savingItem, setSavingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [newBroadcast, setNewBroadcast] = useState(BLANK_BROADCAST);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const [apiSettings, setApiSettings] = useState({ groqKey: "", aiEnabled: true });
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    systemPrompt: "You are Zura, a friendly AI barista at Azura Cafe. Help customers discover menu items and answer questions about the cafe.",
    systemPromptAr: "أنتِ زورا، باريستا ودودة في مقهى أزورا. ساعدي العملاء في استكشاف القائمة والإجابة على أسئلتهم.",
    baristaFemale: "Zura",
    baristaMale: "زورا",
    temperature: 0.85,
    maxTokens: 500,
  });
  const [savingAiConfig, setSavingAiConfig] = useState(false);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;
  const inp = "w-full px-3.5 py-2.5 rounded-xl text-sm outline-none";
  const inpStyle = { background: "hsl(var(--muted))", border: "1.5px solid transparent" };

  useEffect(() => {
    if (!authed) return;
    const refs = ["menu", "support-chat", "feedback", "broadcast", "api-settings", "ai-config", "suggestions", "userLogs"];

    const menuRef = ref(db, "menu");
    onValue(menuRef, (snap) => {
      if (!snap.exists()) {
        set(ref(db, "menu"), fullMenuData).catch(console.error);
        return;
      }
      const data = snap.val();
      const items: MenuItem[] = [];
      Object.entries(data as Record<string, unknown>).forEach(([cat, val]) => {
        if (typeof val === "object" && val) {
          Object.entries(val as Record<string, unknown>).forEach(([id, itemData]) => {
            if (typeof itemData === "object" && itemData) {
              const item = itemData as Record<string, unknown>;
              items.push({ id, name: String(item.name || id), nameAr: String(item.nameAr || ""), price: Number(item.price) || 0, category: cat, available: item.available !== false, image: String(item.image || "") });
            }
          });
        }
      });
      setMenuItems(items.sort((a, b) => a.category.localeCompare(b.category)));
    });

    onValue(ref(db, "support-chat"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, { meta?: ChatSession }>;
      const sessions = Object.entries(data).filter(([,v]) => v?.meta).map(([uid, v]) => ({ ...v.meta!, uid })).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
      setChats(sessions);
    });

    onValue(ref(db, "feedback"), (snap) => {
      if (!snap.exists()) { setFeedback([]); return; }
      const data = snap.val() as Record<string, Omit<Feedback, "id">>;
      setFeedback(Object.entries(data).map(([id, f]) => ({ id, ...f })).sort((a, b) => b.createdAt - a.createdAt));
    });

    onValue(ref(db, "broadcast"), (snap) => {
      if (!snap.exists()) { setBroadcasts([]); return; }
      const data = snap.val() as Record<string, Omit<Broadcast, "id">>;
      setBroadcasts(Object.entries(data).map(([id, b]) => ({ id, ...b })).sort((a, b) => b.createdAt - a.createdAt));
    });

    onValue(ref(db, "api-settings"), (snap) => {
      if (!snap.exists()) return;
      const d = snap.val() as Record<string, unknown>;
      setApiSettings({ groqKey: (d.groqKey as string) || "", aiEnabled: d.aiEnabled !== false });
    });

    onValue(ref(db, "ai-config"), (snap) => {
      if (!snap.exists()) return;
      const d = snap.val() as Record<string, unknown>;
      setAiConfig((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(d).filter(([k]) => k in prev)) }));
    });

    onValue(ref(db, "suggestions"), (snap) => {
      if (!snap.exists()) { setSuggestions([]); return; }
      const d = snap.val() as Record<string, Omit<Suggestion, "id">>;
      setSuggestions(Object.entries(d).map(([id, s]) => ({ id, ...s })).sort((a, b) => b.createdAt - a.createdAt));
    });

    onValue(ref(db, "userLogs"), (snap) => {
      if (!snap.exists()) { setUsers([]); return; }
      const d = snap.val() as Record<string, UserLog>;
      const byUser: Record<string, UserLog[]> = {};
      Object.values(d).forEach((log) => { if (!byUser[log.uid]) byUser[log.uid] = []; byUser[log.uid].push(log); });
      const summary = Object.entries(byUser).map(([uid, logs]) => {
        const sorted = logs.sort((a, b) => b.timestamp - a.timestamp);
        return { uid, name: sorted[0].name, tableNumber: sorted[0].tableNumber, totalVisits: sorted.length, firstLogin: sorted[sorted.length - 1].timestamp, lastLogin: sorted[0].timestamp, platform: sorted[0].deviceInfo?.platform || "—" };
      }).sort((a, b) => b.lastLogin - a.lastLogin);
      setUsers(summary);
    });

    return () => refs.forEach((r) => off(ref(db, r)));
  }, [authed]);

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

  const login = () => {
    if (pin === ADMIN_PIN) { sessionStorage.setItem("azura-admin", "true"); setAuthed(true); }
    else setPinErr(tr("Wrong PIN", "رمز خاطئ"));
  };

  const toggleAvail = (item: MenuItem) => update(ref(db, `menu/${item.category}/${item.id}`), { available: !item.available });

  const deleteItem = async (item: MenuItem) => {
    if (!await swalConfirm(tr("Delete?", "حذف؟"), tr(`Delete "${item.name}"?`, `حذف "${item.nameAr || item.name}"؟`), tr("Delete", "حذف"), tr("Cancel", "إلغاء"))) return;
    remove(ref(db, `menu/${item.category}/${item.id}`));
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const b64 = await compressToBase64(file, 400, 0.72);
      setNewItem((p) => ({ ...p, image: b64 }));
      setImgSize(base64SizeKB(b64));
    } catch { swalError(tr("Image upload failed", "فشل رفع الصورة")); }
    setUploading(false);
  };

  const saveItem = async () => {
    if (!newItem.name || !newItem.price) { swalError(tr("Name and price required", "الاسم والسعر مطلوبان")); return; }
    setSavingItem(true);
    const r = push(ref(db, `menu/${newItem.category}`));
    await set(r, { name: newItem.name, nameAr: newItem.nameAr, price: Number(newItem.price), category: newItem.category, available: true, image: newItem.image });
    setNewItem(BLANK_ITEM); setAdding(false); setSavingItem(false); setImgSize(0);
    swalSuccess(tr("Item added!", "تم الإضافة!"));
  };

  const sendReply = async () => {
    if (!chatInput.trim() || !selectedChat) return;
    const r = push(ref(db, `support-chat/${selectedChat}/messages`));
    await set(r, { text: chatInput.trim(), sender: "admin" as const, createdAt: Date.now(), readByAdmin: true });
    await update(ref(db, `support-chat/${selectedChat}/meta`), { lastMessage: chatInput.trim(), lastAt: Date.now() });
    setChatInput("");
  };

  const sendBroadcast = async () => {
    if (!newBroadcast.title || !newBroadcast.message) { swalError(tr("Title and message required", "العنوان والرسالة مطلوبان")); return; }
    setSendingBroadcast(true);
    await set(push(ref(db, "broadcast")), { ...newBroadcast, createdAt: Date.now() });
    setNewBroadcast(BLANK_BROADCAST);
    setSendingBroadcast(false);
    swalSuccess(tr("Broadcast sent!", "تم الإرسال!"));
  };

  const saveApiSettings = async () => {
    setSavingApiKey(true);
    await set(ref(db, "api-settings"), { groqKey: tempApiKey ? encryptKey(tempApiKey) : apiSettings.groqKey, aiEnabled: apiSettings.aiEnabled, updatedAt: Date.now() });
    setTempApiKey("");
    setSavingApiKey(false);
    swalSuccess(tr("Settings saved!", "تم الحفظ!"));
  };

  const saveAiConfig = async () => {
    setSavingAiConfig(true);
    await set(ref(db, "ai-config"), { ...aiConfig, updatedAt: Date.now() });
    setSavingAiConfig(false);
    swalSuccess(tr("AI config saved!", "تم حفظ إعدادات الذكاء!"));
  };

  const updateSuggestionStatus = (id: string, status: "approved" | "rejected") => update(ref(db, `suggestions/${id}`), { status });

  const avgRating = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : "—";
  const unreadChats = chats.reduce((s, c) => s + (c.unreadAdmin || 0), 0);
  const unreadFeedback = feedback.filter((f) => !f.read).length;
  const pendingSuggestions = suggestions.filter((s) => s.status === "pending").length;

  // PIN screen
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(145deg, hsl(35,60%,90%), hsl(22,45%,82%))" }}>
        <div className="w-full max-w-xs">
          <div className="rounded-3xl p-7 text-center space-y-5" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-lg)" }}>
            <div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "hsl(var(--primary))", boxShadow: "var(--shadow-primary)" }}>
                <ShieldCheck size={26} className="text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                {tr("Admin Portal", "بوابة الإدارة")}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">{tr("Azura CRM & Management System", "نظام إدارة أزورا")}</p>
            </div>
            <input
              type="password"
              autoFocus
              placeholder={tr("Enter Admin PIN", "أدخل رمز الدخول")}
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinErr(""); }}
              onKeyDown={(e) => e.key === "Enter" && login()}
              className="w-full px-5 py-3.5 rounded-2xl text-center text-xl font-bold tracking-[0.3em]"
              style={{ background: "hsl(var(--muted))", outline: "none", border: "none" }}
            />
            {pinErr && <p className="text-red-500 text-xs font-semibold">{pinErr}</p>}
            <button
              onClick={login}
              className="w-full py-3.5 rounded-2xl font-bold text-primary-foreground transition-all active:scale-97"
              style={{ background: "hsl(var(--primary))", boxShadow: "var(--shadow-primary)" }}
            >
              {tr("Access Dashboard", "دخول لوحة التحكم")}
            </button>
            <button onClick={() => navigate("/menu")} className="text-xs text-muted-foreground flex items-center justify-center gap-1 mx-auto hover:text-foreground transition-colors">
              <ArrowLeft size={12} /> {tr("Back to App", "العودة للتطبيق")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; icon: React.ReactNode; en: string; ar: string; badge?: number }[] = [
    { id: "overview",   icon: <BarChart3 size={13}/>,    en: "Overview",   ar: "الرئيسية" },
    { id: "menu",       icon: <UtensilsCrossed size={13}/>, en: "Menu",    ar: "القائمة" },
    { id: "chat",       icon: <MessageCircle size={13}/>, en: "Chat",      ar: "الدردشة",  badge: unreadChats },
    { id: "reviews",    icon: <Star size={13}/>,           en: "Reviews",   ar: "تقييمات", badge: unreadFeedback },
    { id: "ideas",      icon: <Lightbulb size={13}/>,      en: "Ideas",     ar: "أفكار",   badge: pendingSuggestions },
    { id: "users",      icon: <Users size={13}/>,          en: "Users",     ar: "الزوار" },
    { id: "broadcast",  icon: <Megaphone size={13}/>,      en: "Broadcast", ar: "إشعارات" },
    { id: "ai",         icon: <Bot size={13}/>,            en: "AI Config", ar: "إعدادات الذكاء" },
    { id: "api",        icon: <Key size={13}/>,            en: "API",       ar: "API" },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3" style={{ background: "hsl(var(--primary))", boxShadow: "0 2px 20px rgba(0,0,0,0.15)" }}>
        <button onClick={() => navigate("/menu")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors p-1 rounded-lg hover:bg-white/10">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-primary-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            {tr("Azura CRM", "إدارة أزورا")}
          </h1>
          <p className="text-[10px] text-primary-foreground/60 leading-none">{tr("Production Dashboard", "لوحة التحكم")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-primary-foreground/70">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {tr("Live", "مباشر")}
          </span>
          <button
            onClick={() => { sessionStorage.removeItem("azura-admin"); setAuthed(false); }}
            className="text-[11px] text-primary-foreground/70 hover:text-primary-foreground px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            {tr("Exit", "خروج")}
          </button>
        </div>
      </header>

      {/* Tab Nav */}
      <div className="sticky top-[50px] z-40 flex gap-1 px-3 py-2 overflow-x-auto border-b" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${tab === t.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}
            style={tab === t.id ? { background: "hsl(var(--primary))" } : {}}
          >
            {t.icon}
            {lang === "ar" ? t.ar : t.en}
            {t.badge && t.badge > 0 ? (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {t.badge > 9 ? "9+" : t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Page content */}
      <div className="p-4 max-w-4xl mx-auto pb-16">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-primary mb-0.5" style={{ fontFamily: "var(--font-heading)" }}>{tr("Dashboard", "لوحة التحكم")}</h2>
              <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label={tr("Menu Items", "عناصر القائمة")} value={menuItems.length} icon={<UtensilsCrossed size={16}/>} />
              <StatCard label={tr("Avg Rating", "متوسط التقييم")} value={<span className="flex items-center gap-1">{avgRating} <Star size={14} className="text-yellow-500 fill-yellow-500"/></span>} icon={<Star size={16}/>} color="text-yellow-500" />
              <StatCard label={tr("Total Reviews", "إجمالي التقييمات")} value={feedback.length} icon={<MessageCircle size={16}/>} color="text-green-500" />
              <StatCard label={tr("Visitors", "الزوار")} value={users.length} icon={<Users size={16}/>} color="text-blue-500" />
            </div>

            {/* Rating Distribution */}
            {feedback.length > 0 && (
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)" }}>
                <h3 className="font-bold text-sm flex items-center gap-2"><TrendingUp size={14} className="text-primary" /> {tr("Rating Distribution", "توزيع التقييمات")}</h3>
                {[5,4,3,2,1].map((star) => {
                  const count = feedback.filter(f => f.rating === star).length;
                  const pct = feedback.length ? (count / feedback.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs font-bold w-3 text-right">{star}</span>
                      <span className="text-yellow-500 text-xs">★</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-yellow-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-5 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: tr("Add Menu Item", "إضافة عنصر"), icon: <Plus size={16}/>, action: () => { setTab("menu"); setAdding(true); } },
                { label: tr("Send Broadcast", "إرسال إشعار"), icon: <Megaphone size={16}/>, action: () => setTab("broadcast") },
                { label: tr("View Reviews", "عرض التقييمات"), icon: <Star size={16}/>, action: () => setTab("reviews") },
                { label: tr("AI Assistant", "المساعد الذكي"), icon: <Bot size={16}/>, action: () => setTab("ai") },
              ].map((q, i) => (
                <button key={i} onClick={q.action} className="flex items-center gap-2 p-3.5 rounded-2xl text-sm font-semibold text-left transition-all active:scale-[0.97]" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)", border: "1px solid rgba(93,62,35,0.06)" }}>
                  <span className="text-primary">{q.icon}</span>
                  {q.label}
                </button>
              ))}
            </div>

            {/* AI Status */}
            <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)" }}>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm flex items-center gap-2">
                  {tr("AI System", "نظام الذكاء")}
                  {apiSettings.aiEnabled ? (
                    <span className="flex items-center gap-1 text-green-600 text-[10px]"><Wifi size={10}/>{tr("Active", "نشط")}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500 text-[10px]"><WifiOff size={10}/>{tr("Disabled", "معطل")}</span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {apiSettings.groqKey ? tr("Groq API connected", "Groq API متصل") : <span className="flex items-center gap-1"><AlertTriangle size={10}/>{tr("Using Pollinations fallback", "يستخدم Pollinations")}</span>}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── MENU ── */}
        {tab === "menu" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-between">
              <h2 className="text-base font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>{tr("Menu Management", "إدارة القائمة")}</h2>
              <button onClick={() => { setAdding(!adding); setNewItem(BLANK_ITEM); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-primary-foreground transition-all active:scale-95" style={{ background: "hsl(var(--primary))" }}>
                {adding ? <><X size={13}/>{tr("Cancel","إلغاء")}</> : <><Plus size={13}/>{tr("Add Item","إضافة")}</>}
              </button>
            </div>

            {/* Add form */}
            {adding && (
              <div className="rounded-2xl p-4 space-y-3 border border-primary/20" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)" }}>
                <h3 className="font-bold text-sm text-primary flex items-center gap-1.5"><Plus size={13}/>{tr("New Menu Item", "عنصر جديد")}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inp} style={inpStyle} placeholder={tr("Name (EN)*", "الاسم (EN)*")} value={newItem.name} onChange={(e) => setNewItem(p => ({ ...p, name: e.target.value }))} />
                  <input className={inp} style={inpStyle} placeholder={tr("Name (AR)", "الاسم (عربي)")} value={newItem.nameAr} onChange={(e) => setNewItem(p => ({ ...p, nameAr: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inp} style={inpStyle} type="number" placeholder={tr("Price (EGP)*", "السعر (ج.م)*")} value={newItem.price} onChange={(e) => setNewItem(p => ({ ...p, price: e.target.value }))} />
                  <select className={inp} style={{ ...inpStyle, appearance: "none" }} value={newItem.category} onChange={(e) => setNewItem(p => ({ ...p, category: e.target.value }))}>
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {/* Image upload */}
                {newItem.image ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden">
                    <img src={newItem.image} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => { setNewItem(p => ({ ...p, image: "" })); setImgSize(0); }} className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center">
                      <X size={13}/>
                    </button>
                    <span className="absolute bottom-2 right-2 text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded-full">{imgSize}KB</span>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                    <Upload size={16} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{uploading ? tr("Uploading…","جاري الرفع…") : tr("Upload image","رفع صورة")}</span>
                  </label>
                )}
                <button onClick={saveItem} disabled={savingItem || !newItem.name || !newItem.price} className="w-full py-3 rounded-xl font-bold text-sm text-primary-foreground disabled:opacity-50 transition-all active:scale-[0.97]" style={{ background: "hsl(var(--primary))" }}>
                  {savingItem ? tr("Saving…","جاري الحفظ…") : tr("Save Item","حفظ العنصر")}
                </button>
              </div>
            )}

            {/* Filters */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input className="w-full pl-8 pr-3 py-2 rounded-xl text-xs" style={inpStyle} placeholder={tr("Search items…","ابحث…")} value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} />
              </div>
              <select className="px-3 py-2 rounded-xl text-xs" style={inpStyle} value={menuCatFilter} onChange={(e) => setMenuCatFilter(e.target.value)}>
                <option value="all">{tr("All","الكل")}</option>
                {[...new Set(menuItems.map(i => i.category))].sort().map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Items list */}
            <div className="space-y-2">
              {menuItems
                .filter(i => (menuCatFilter === "all" || i.category === menuCatFilter) && (!menuSearch || i.name.toLowerCase().includes(menuSearch.toLowerCase()) || i.nameAr.includes(menuSearch)))
                .map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl transition-all" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-xs)", border: `1px solid ${item.available ? "transparent" : "rgba(239,68,68,0.15)"}` }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-lg">🍽️</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.category} · <span className="font-bold text-primary">{item.price} EGP</span></p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => toggleAvail(item)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${item.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {item.available ? tr("On","متاح") : tr("Off","مخفي")}
                      </button>
                      <button onClick={() => deleteItem(item)} className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-colors">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── CHAT ── */}
        {tab === "chat" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>{tr("Support Chat", "دردشة الدعم")}</h2>
            {!selectedChat ? (
              chats.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{tr("No chat sessions yet", "لا توجد محادثات بعد")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chats.map((c) => (
                    <button key={c.uid} onClick={() => setSelectedChat(c.uid)} className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all active:scale-[0.98]" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-xs)" }}>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {(c.userName || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{c.userName || tr("Unknown", "غير معروف")}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{c.lastMessage}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {c.unreadAdmin > 0 && <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{c.unreadAdmin}</span>}
                        <span className="text-[10px] text-muted-foreground">{c.lastAt ? new Date(c.lastAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col rounded-2xl overflow-hidden" style={{ height: "500px", background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)" }}>
                <div className="flex items-center gap-2 p-3 border-b" style={{ background: "hsl(var(--primary)/0.05)" }}>
                  <button onClick={() => setSelectedChat(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <ArrowLeft size={16} />
                  </button>
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {(chats.find(c => c.uid === selectedChat)?.userName || "?").charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm">{chats.find(c => c.uid === selectedChat)?.userName || tr("User", "مستخدم")}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {chatMsgs.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[80%] px-3.5 py-2 rounded-2xl text-sm" style={msg.sender === "admin" ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderRadius: "1rem 1rem 0.25rem 1rem" } : { background: "hsl(var(--muted))", borderRadius: "1rem 1rem 1rem 0.25rem" }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>
                <div className="p-3 border-t flex gap-2">
                  <input
                    className="flex-1 px-3.5 py-2.5 rounded-xl text-sm"
                    style={inpStyle}
                    placeholder={tr("Reply…","رد…")}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  />
                  <button onClick={sendReply} disabled={!chatInput.trim()} className="px-4 py-2.5 rounded-xl text-primary-foreground disabled:opacity-40 flex items-center gap-1.5" style={{ background: "hsl(var(--primary))" }}>
                    <Send size={14}/>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── REVIEWS ── */}
        {tab === "reviews" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>{tr("Customer Reviews", "آراء العملاء")}</h2>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold" style={{ background: "hsl(var(--muted))" }}>
                <Star size={13} className="text-yellow-500 fill-yellow-500" />
                {avgRating}
              </div>
            </div>
            {feedback.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Star size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">{tr("No reviews yet", "لا توجد تقييمات بعد")}</p>
              </div>
            ) : feedback.map((f) => (
              <div key={f.id} className="p-4 rounded-2xl space-y-2" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-xs)", opacity: f.read ? 0.7 : 1 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {(f.userName || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{f.userName}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(f.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stars n={f.rating} />
                    {!f.read && (
                      <button onClick={() => update(ref(db, `feedback/${f.id}`), { read: true })} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                        <CheckCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {f.comment && <p className="text-sm text-muted-foreground leading-relaxed">{f.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {/* ── IDEAS / SUGGESTIONS ── */}
        {tab === "ideas" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>{tr("Customer Ideas", "أفكار العملاء")}</h2>
              {pendingSuggestions > 0 && <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">{pendingSuggestions} {tr("pending","معلق")}</span>}
            </div>
            {suggestions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Lightbulb size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">{tr("No suggestions yet", "لا توجد اقتراحات بعد")}</p>
              </div>
            ) : suggestions.map((s) => (
              <div key={s.id} className="p-4 rounded-2xl space-y-3" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-xs)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{s.itemName}{s.itemNameAr ? ` / ${s.itemNameAr}` : ""}</p>
                    <p className="text-[10px] text-muted-foreground">{s.category} · {s.authorName} · {new Date(s.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${s.status === "pending" ? "bg-amber-100 text-amber-700" : s.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {tr(s.status, s.status === "pending" ? "معلق" : s.status === "approved" ? "موافق" : "مرفوض")}
                  </span>
                </div>
                {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                {s.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => updateSuggestionStatus(s.id, "approved")} className="flex-1 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition-colors">
                      <CheckCircle size={12} className="inline mr-1"/>{tr("Approve","موافقة")}
                    </button>
                    <button onClick={() => updateSuggestionStatus(s.id, "rejected")} className="flex-1 py-2 rounded-xl bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors">
                      <X size={12} className="inline mr-1"/>{tr("Reject","رفض")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>{tr("Visitors", "الزوار")}</h2>
              <span className="text-sm text-muted-foreground">{users.length} {tr("total","إجمالي")}</span>
            </div>
            {users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">{tr("No visitors logged yet", "لا يوجد زوار مسجلون بعد")}</p>
              </div>
            ) : users.map((u) => (
              <div key={u.uid} className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-xs)" }}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{u.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Hash size={9}/>{u.tableNumber}</span>
                    <span className="flex items-center gap-0.5"><Activity size={9}/>{u.totalVisits} {tr("visits","زيارات")}</span>
                    <span className="flex items-center gap-0.5"><Smartphone size={9}/>{u.platform}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-muted-foreground">{new Date(u.lastLogin).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── BROADCAST ── */}
        {tab === "broadcast" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>{tr("Broadcast", "إشعار لجميع المستخدمين")}</h2>
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)" }}>
              <div className="grid grid-cols-2 gap-2">
                <input className={inp} style={inpStyle} placeholder={tr("Title (EN)*","العنوان (EN)*")} value={newBroadcast.title} onChange={(e) => setNewBroadcast(p => ({ ...p, title: e.target.value }))} />
                <input className={inp} style={inpStyle} placeholder={tr("Title (AR)","العنوان (عربي)")} value={newBroadcast.titleAr} onChange={(e) => setNewBroadcast(p => ({ ...p, titleAr: e.target.value }))} />
              </div>
              <textarea className={inp} style={{ ...inpStyle, minHeight: "80px", resize: "none" }} placeholder={tr("Message (EN)*","الرسالة (EN)*")} value={newBroadcast.message} onChange={(e) => setNewBroadcast(p => ({ ...p, message: e.target.value }))} />
              <textarea className={inp} style={{ ...inpStyle, minHeight: "80px", resize: "none" }} placeholder={tr("Message (AR)","الرسالة (عربي)")} value={newBroadcast.messageAr} onChange={(e) => setNewBroadcast(p => ({ ...p, messageAr: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <select className={inp} style={{ ...inpStyle, appearance: "none" }} value={newBroadcast.type} onChange={(e) => setNewBroadcast(p => ({ ...p, type: e.target.value as "info" | "promo" | "alert" }))}>
                  <option value="info">ℹ️ {tr("Info","معلومات")}</option>
                  <option value="promo">🎉 {tr("Promo","عرض")}</option>
                  <option value="alert">⚠️ {tr("Alert","تنبيه")}</option>
                </select>
                <input className={inp} style={inpStyle} placeholder={tr("Emoji","إيموجي")} value={newBroadcast.emoji} onChange={(e) => setNewBroadcast(p => ({ ...p, emoji: e.target.value }))} />
              </div>
              <button onClick={sendBroadcast} disabled={sendingBroadcast || !newBroadcast.title || !newBroadcast.message} className="w-full py-3 rounded-xl text-sm font-bold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.97]" style={{ background: "hsl(var(--primary))" }}>
                <Send size={15}/>{sendingBroadcast ? tr("Sending…","إرسال…") : tr("Send Broadcast","إرسال الإشعار")}
              </button>
            </div>
            {/* Recent broadcasts */}
            {broadcasts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr("Sent Broadcasts","الإشعارات المرسلة")}</p>
                {broadcasts.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-xs)" }}>
                    <span className="text-xl flex-shrink-0">{b.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{b.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{b.message}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</span>
                      <button onClick={() => remove(ref(db, `broadcast/${b.id}`))} className="p-1 rounded-lg hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-colors">
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── AI CONFIG ── */}
        {tab === "ai" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>{tr("AI Configuration", "إعدادات الذكاء الاصطناعي")}</h2>
            <AIAdminAssistant />
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)" }}>
              <h3 className="font-bold text-sm">{tr("Barista Persona", "شخصية البارستا")}</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">{tr("Name (EN)","الاسم (EN)")}</label>
                  <input className={inp} style={inpStyle} value={aiConfig.baristaFemale} onChange={(e) => setAiConfig(p => ({ ...p, baristaFemale: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">{tr("Name (AR)","الاسم (عربي)")}</label>
                  <input className={inp} style={inpStyle} value={aiConfig.baristaMale} onChange={(e) => setAiConfig(p => ({ ...p, baristaMale: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">{tr("System Prompt (EN)","النص الأساسي (EN)")}</label>
                <textarea className={inp} style={{ ...inpStyle, minHeight: "100px", resize: "none" }} value={aiConfig.systemPrompt} onChange={(e) => setAiConfig(p => ({ ...p, systemPrompt: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">{tr("System Prompt (AR)","النص الأساسي (عربي)")}</label>
                <textarea className={inp} style={{ ...inpStyle, minHeight: "100px", resize: "none" }} value={aiConfig.systemPromptAr} onChange={(e) => setAiConfig(p => ({ ...p, systemPromptAr: e.target.value }))} />
              </div>
              <button onClick={saveAiConfig} disabled={savingAiConfig} className="w-full py-3 rounded-xl text-sm font-bold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.97]" style={{ background: "hsl(var(--primary))" }}>
                <Save size={15}/>{savingAiConfig ? tr("Saving…","جاري الحفظ…") : tr("Save AI Config","حفظ إعدادات الذكاء")}
              </button>
            </div>
          </div>
        )}

        {/* ── API SETTINGS ── */}
        {tab === "api" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>{tr("API Settings", "إعدادات API")}</h2>
            <div className="rounded-2xl p-4 space-y-4" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)" }}>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">{tr("Groq API Key (optional)","مفتاح Groq API (اختياري)")}</label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    className={`${inp} pr-10`}
                    style={inpStyle}
                    placeholder={apiSettings.groqKey ? "••••••••••••••••••••••••••" : tr("Enter Groq API key…","أدخل مفتاح Groq…")}
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                  />
                  <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Eye size={14}/>
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{tr("Leave blank to use free Pollinations AI fallback","اتركه فارغاً لاستخدام Pollinations AI المجاني")}</p>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-semibold text-sm">{tr("AI Features Enabled","تفعيل الذكاء الاصطناعي")}</p>
                  <p className="text-[11px] text-muted-foreground">{tr("Allow customers to use AI barista","السماح للعملاء باستخدام البارستا الذكي")}</p>
                </div>
                <button onClick={() => setApiSettings(p => ({ ...p, aiEnabled: !p.aiEnabled }))} className={`w-12 h-6 rounded-full transition-all relative ${apiSettings.aiEnabled ? "bg-primary" : "bg-muted"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${apiSettings.aiEnabled ? "left-6" : "left-0.5"}`}/>
                </button>
              </div>
              <button onClick={saveApiSettings} disabled={savingApiKey} className="w-full py-3 rounded-xl text-sm font-bold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.97]" style={{ background: "hsl(var(--primary))" }}>
                <Save size={15}/>{savingApiKey ? tr("Saving…","جاري الحفظ…") : tr("Save Settings","حفظ الإعدادات")}
              </button>
            </div>

            {/* System info */}
            <div className="rounded-2xl p-4 space-y-2" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-xs)" }}>
              <p className="font-semibold text-sm flex items-center gap-1.5"><Zap size={13} className="text-primary"/>{tr("System Info","معلومات النظام")}</p>
              {[
                [tr("AI Provider","مزود الذكاء"), apiSettings.groqKey ? "Groq + Pollinations" : "Pollinations AI (Free)"],
                [tr("Database","قاعدة البيانات"), "Firebase Realtime DB"],
                [tr("Architecture","البنية"), "React 19 + Vite + Tailwind v4"],
                [tr("Status","الحالة"), tr("Production Ready ✅","جاهز للإنتاج ✅")],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
