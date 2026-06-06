import { useState, useEffect, useRef } from "react";
import { db, ref, onValue, off, update, set, push, remove } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { compressToBase64, base64SizeKB } from "@/lib/imageUtils";
import {
  BarChart3, Package, UtensilsCrossed, MessageCircle, Star, Lightbulb,
  TrendingUp, ShieldCheck, ArrowLeft, Plus, Trash2, ToggleLeft, ToggleRight,
  Send, ChevronDown, Upload, CheckCircle, XCircle, Clock, ChefHat, Truck,
  ImageIcon, Megaphone, Film, Pin, Key, Settings, Eye, EyeOff,
} from "lucide-react";

const ADMIN_PIN = "azura2024";
type Tab = "overview" | "orders" | "menu" | "chat" | "reviews" | "ideas" | "reports" | "broadcast" | "reels" | "api";

interface Order {
  orderId: string; userId?: string; userName: string; tableNumber: string;
  items: { name: string; nameAr: string; quantity: number; price: number; subtotal: number }[];
  total: number; status: string; notes?: string; createdAt: number;
}
interface MenuItem { id: string; name: string; nameAr: string; description: string; price: number; category: string; available: boolean; image: string; }
interface ChatSession { uid: string; userName: string; lastMessage: string; lastAt: number; unreadAdmin: number; }
interface ChatMsg { id: string; text: string; sender: "user" | "admin"; createdAt: number; }
interface Feedback { id: string; userName: string; rating: number; comment: string; orderId?: string; createdAt: number; read: boolean; }
interface Suggestion { id: string; userName: string; itemName: string; description: string; category: string; image?: string; status: string; adminNote?: string; votes: number; createdAt: number; }
interface Broadcast { id: string; title: string; titleAr: string; message: string; messageAr: string; type: "info" | "promo" | "alert"; emoji: string; createdAt: number; }
interface Reel { id: string; image: string; caption: string; captionAr: string; likes: number; createdAt: number; authorName: string; pinned?: boolean; }

const STATUS_META: Record<string, { label: string; ar: string; icon: React.ReactNode; cls: string }> = {
  pending:   { label: "Pending",   ar: "انتظار",  icon: <Clock size={11}/>,       cls: "status-pending"   },
  preparing: { label: "Preparing", ar: "يُحضَّر",  icon: <ChefHat size={11}/>,     cls: "status-preparing" },
  ready:     { label: "Ready!",    ar: "جاهز!",   icon: <CheckCircle size={11}/>, cls: "status-ready"     },
  delivered: { label: "Done",      ar: "اتسلم",   icon: <Truck size={11}/>,       cls: "status-delivered" },
  cancelled: { label: "Cancelled", ar: "اتلغى",   icon: <XCircle size={11}/>,     cls: "status-cancelled" },
};
const STATUS_FLOW = ["pending", "preparing", "ready", "delivered", "cancelled"] as const;

const SAMPLE_IMAGES: Record<string, { url: string; label: string }[]> = {
  coffee: [
    { url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=75", label: "Espresso" },
    { url: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=75", label: "Latte" },
    { url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75", label: "Sunrise" },
    { url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&q=75", label: "Mocha" },
    { url: "https://images.unsplash.com/photo-1572119865084-43c285814d63?w=400&q=75", label: "Cold Brew" },
    { url: "https://images.unsplash.com/photo-1485808191679-5f86510bd652?w=400&q=75", label: "Flat White" },
  ],
  beverages: [
    { url: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=400&q=75", label: "Iced" },
    { url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=75", label: "Smoothie" },
    { url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=75", label: "Lemonade" },
    { url: "https://images.unsplash.com/photo-1546173159-315724a31696?w=400&q=75", label: "Matcha" },
    { url: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=75", label: "Juice" },
    { url: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=75", label: "Cocktail" },
  ],
  food: [
    { url: "https://images.unsplash.com/photo-1568471173242-461f0a730452?w=400&q=75", label: "Avocado Toast" },
    { url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=75", label: "Pancakes" },
    { url: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=75", label: "Salad" },
    { url: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=75", label: "Eggs" },
    { url: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=75", label: "Burger" },
    { url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=75", label: "Bowl" },
  ],
  desserts: [
    { url: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=75", label: "Tiramisu" },
    { url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=75", label: "Cake" },
    { url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=75", label: "Chocolate" },
    { url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=75", label: "Croissant" },
    { url: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=400&q=75", label: "Cupcake" },
    { url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=75", label: "Tart" },
  ],
};

const CATS = ["coffee", "beverages", "food", "desserts"] as const;
const BLANK_ITEM = { name: "", nameAr: "", description: "", price: "", category: "coffee", image: "" };
const BLANK_BROADCAST = { title: "", titleAr: "", message: "", messageAr: "", type: "info" as const, emoji: "📢" };

function normalizeItem(id: string, raw: Record<string, unknown>): MenuItem {
  return {
    id, name: String(raw.name || raw.nameEn || ""), nameAr: String(raw.nameAr || ""),
    description: String(raw.description || raw.descEn || ""),
    price: Number(raw.price) || 0, category: String(raw.category || "coffee"),
    available: raw.available !== false, image: String(raw.image || raw.img || ""),
  };
}

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

export default function Admin() {
  const { lang, isRTL } = useLang();
  const [, navigate] = useLocation();
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("azura-admin") === "true");
  const [pinErr, setPinErr] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  // Data
  const [orders, setOrders]       = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [chats, setChats]         = useState<ChatSession[]>([]);
  const [feedback, setFeedback]   = useState<Feedback[]>([]);
  const [ideas, setIdeas]         = useState<Suggestion[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [reels, setReels]         = useState<Reel[]>([]);

  // Chat
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMsgs, setChatMsgs]         = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput]       = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Menu form
  const [adding, setAdding]         = useState(false);
  const [newItem, setNewItem]       = useState(BLANK_ITEM);
  const [uploading, setUploading]   = useState(false);
  const [imgSize, setImgSize]       = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Broadcast form
  const [newBroadcast, setNewBroadcast] = useState(BLANK_BROADCAST);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Orders filter
  const [orderFilter, setOrderFilter] = useState("all");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Reports range
  const [range, setRange] = useState<"today" | "week" | "month">("week");

  // API settings
  const [apiSettings, setApiSettings] = useState({
    geminiKey: "",
    ttsKey: "",
    aiEnabled: true,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;
  const inp = "input-field px-3 py-2.5 text-sm";

  // ── Load all data ──────────────────────────────────────────────
  useEffect(() => {
    if (!authed) return;

    // Orders: handle both old flat format and new per-user nested format
    const ordersRef = ref(db, "orders");
    onValue(ordersRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, unknown>;
      const allOrders: Order[] = [];
      Object.entries(data).forEach(([key, val]) => {
        if (!val || typeof val !== "object") return;
        const v = val as Record<string, unknown>;
        // Has createdAt or total → it's a direct Order (old flat format)
        if (v.createdAt !== undefined || v.total !== undefined || v.orderId !== undefined) {
          allOrders.push({ ...(v as unknown as Order), orderId: (v.orderId as string) || key });
        } else {
          // New format: key = userId, val = map of orders
          Object.entries(v).forEach(([orderId, order]) => {
            if (order && typeof order === "object") {
              const o = order as Order;
              allOrders.push({ ...o, userId: key, orderId: o.orderId || orderId });
            }
          });
        }
      });
      allOrders.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(allOrders);
    });

    // Menu
    onValue(ref(db, "menu"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, Record<string, unknown>>;
      const result: MenuItem[] = [];
      Object.entries(data).forEach(([key, val]) => {
        if (typeof val !== "object" || !val) return;
        const v = val as Record<string, unknown>;
        if (v.price !== undefined || v.name !== undefined || v.nameEn !== undefined) {
          result.push(normalizeItem(key, v));
        } else {
          Object.entries(v).forEach(([sid, sv]) => {
            if (typeof sv === "object" && sv) result.push(normalizeItem(sid, sv as Record<string, unknown>));
          });
        }
      });
      setMenuItems(result);
    });

    // Feedback
    onValue(ref(db, "feedback"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, Omit<Feedback, "id">>;
      setFeedback(Object.entries(data).map(([id, f]) => ({ id, ...f })).sort((a, b) => b.createdAt - a.createdAt));
    });

    // Suggestions
    onValue(ref(db, "suggestions"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, Omit<Suggestion, "id">>;
      setIdeas(Object.entries(data).map(([id, s]) => ({ id, ...s })).sort((a, b) => b.createdAt - a.createdAt));
    });

    // Support chat
    onValue(ref(db, "support-chat"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, { meta?: ChatSession }>;
      const sessions = Object.entries(data)
        .filter(([, v]) => v?.meta)
        .map(([uid, v]) => ({ ...v.meta!, uid }))
        .sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
      setChats(sessions);
    });

    // Broadcasts
    onValue(ref(db, "broadcast"), (snap) => {
      if (!snap.exists()) { setBroadcasts([]); return; }
      const data = snap.val() as Record<string, Omit<Broadcast, "id">>;
      setBroadcasts(Object.entries(data).map(([id, b]) => ({ id, ...b })).sort((a, b) => b.createdAt - a.createdAt));
    });

    // Reels
    onValue(ref(db, "reels"), (snap) => {
      if (!snap.exists()) { setReels([]); return; }
      const data = snap.val() as Record<string, Omit<Reel, "id">>;
      setReels(Object.entries(data).map(([id, r]) => ({ id, ...r })).sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt - a.createdAt;
      }));
    });

    // API Settings
    onValue(ref(db, "api-settings"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, unknown>;
      setApiSettings({
        geminiKey: (data.geminiKey as string) || "",
        ttsKey: (data.ttsKey as string) || "",
        aiEnabled: data.aiEnabled !== false,
      });
    });

    // Real-time notifications - orders
    const ordersRef = ref(db, "orders");
    onValue(ordersRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.val() as Record<string, unknown>;
      // This will trigger re-render with updated orders
    });

    return () => {
      ["orders","menu","feedback","suggestions","support-chat","broadcast","reels","api-settings"].forEach((p) => off(ref(db, p)));
    };
  }, [authed]);

  // Chat messages
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

  // ── Auth ──────────────────────────────────────────────────────
  const login = () => {
    if (pin === ADMIN_PIN) { sessionStorage.setItem("azura-admin", "true"); setAuthed(true); }
    else setPinErr(tr("Wrong PIN. Try: azura2024", "PIN خاطئ. جرب: azura2024"));
  };

  // ── Order helpers ─────────────────────────────────────────────
  const setOrderStatus = (order: Order, status: string) => {
    if (order.userId) update(ref(db, `orders/${order.userId}/${order.orderId}`), { status });
    else update(ref(db, `orders/${order.orderId}`), { status });
  };

  // ── Menu helpers ──────────────────────────────────────────────
  const toggleAvail = (item: MenuItem) => update(ref(db, `menu/${item.category}/${item.id}`), { available: !item.available });
  const deleteItem = async (item: MenuItem) => {
    if (!confirm(tr(`Delete "${item.name}"?`, `حذف "${item.nameAr || item.name}"؟`))) return;
    await remove(ref(db, `menu/${item.category}/${item.id}`));
  };
  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const b64 = await compressToBase64(file, 400, 0.72);
      setNewItem((p) => ({ ...p, image: b64 }));
      setImgSize(base64SizeKB(b64));
    } catch { alert(tr("Image compression failed", "فشل ضغط الصورة")); }
    setUploading(false);
  };
  const saveItem = async () => {
    if (!newItem.name || !newItem.price) return;
    setSavingItem(true);
    const r = push(ref(db, `menu/${newItem.category}`));
    await set(r, { name: newItem.name, nameAr: newItem.nameAr, description: newItem.description, price: Number(newItem.price), category: newItem.category, available: true, image: newItem.image });
    setNewItem(BLANK_ITEM); setAdding(false); setSavingItem(false); setImgSize(0); setShowGallery(false);
  };

  // ── Chat helpers ──────────────────────────────────────────────
  const sendReply = async () => {
    if (!chatInput.trim() || !selectedChat) return;
    const r = push(ref(db, `support-chat/${selectedChat}/messages`));
    await set(r, { text: chatInput.trim(), sender: "admin", createdAt: Date.now(), readByAdmin: true });
    await update(ref(db, `support-chat/${selectedChat}/meta`), { lastMessage: chatInput.trim(), lastAt: Date.now() });
    setChatInput("");
  };

  // ── Feedback helpers ──────────────────────────────────────────
  const markFeedbackRead = (id: string) => update(ref(db, `feedback/${id}`), { read: true });

  // ── Suggestion helpers ────────────────────────────────────────
  const setSuggestionStatus = (id: string, status: string, note?: string) =>
    update(ref(db, `suggestions/${id}`), { status, ...(note ? { adminNote: note } : {}) });

  // ── Broadcast helpers ─────────────────────────────────────────
  const sendBroadcast = async () => {
    if (!newBroadcast.title || !newBroadcast.message) return;
    setSendingBroadcast(true);
    const r = push(ref(db, "broadcast"));
    await set(r, { ...newBroadcast, createdAt: Date.now() });
    setNewBroadcast(BLANK_BROADCAST);
    setSendingBroadcast(false);
  };
  const deleteBroadcast = (id: string) => remove(ref(db, `broadcast/${id}`));

  // ── Reels helpers ─────────────────────────────────────────────
  const togglePin = (reel: Reel) => update(ref(db, `reels/${reel.id}`), { pinned: !reel.pinned });
  const deleteReel = (reel: Reel) => { if (confirm(tr("Delete post?", "حذف المنشور؟"))) remove(ref(db, `reels/${reel.id}`)); };

  // ── API Settings helpers ────────────────────────────────────
  const saveApiSettings = async () => {
    setSavingApiKey(true);
    await set(ref(db, "api-settings"), {
      geminiKey: apiSettings.geminiKey,
      ttsKey: apiSettings.ttsKey,
      aiEnabled: apiSettings.aiEnabled,
      updatedAt: Date.now(),
    });
    setSavingApiKey(false);
  };

  // ── Reports ───────────────────────────────────────────────────
  const now = Date.now();
  const rangeMs = range === "today" ? 86400000 : range === "week" ? 604800000 : 2592000000;
  const filteredOrders = orders.filter((o) => o.createdAt >= now - rangeMs);
  const revenue = filteredOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const cancelRate = filteredOrders.length ? Math.round((filteredOrders.filter((o) => o.status === "cancelled").length / filteredOrders.length) * 100) : 0;
  const itemFreq: Record<string, { name: string; count: number }> = {};
  filteredOrders.forEach((o) => o.items?.forEach((i) => {
    itemFreq[i.name] = { name: i.name, count: (itemFreq[i.name]?.count || 0) + i.quantity };
  }));
  const topItems = Object.values(itemFreq).sort((a, b) => b.count - a.count).slice(0, 6);
  const maxFreq = topItems[0]?.count || 1;
  const dayBuckets: number[] = Array(7).fill(0);
  orders.filter((o) => o.createdAt >= now - 604800000).forEach((o) => {
    const daysAgo = Math.floor((now - o.createdAt) / 86400000);
    if (daysAgo < 7) dayBuckets[6 - daysAgo]++;
  });
  const maxDayCount = Math.max(...dayBuckets, 1);
  const avgRating = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : "—";
  const ratingDist = [5,4,3,2,1].map((r) => ({ r, count: feedback.filter((f) => f.rating === r).length }));
  const maxRatingCount = Math.max(...ratingDist.map((d) => d.count), 1);

  // ── PIN screen ────────────────────────────────────────────────
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

  const pendingOrdersCount = orders.filter((o) => o.status === "pending" || o.status === "preparing").length;
  const unreadChats = chats.reduce((s, c) => s + (c.unreadAdmin || 0), 0);

  const TABS: { id: Tab; icon: React.ReactNode; en: string; ar: string; badge?: number }[] = [
    { id: "overview",   icon: <BarChart3 size={14}/>,    en: "Overview",   ar: "الرئيسية"  },
    { id: "orders",     icon: <Package size={14}/>,      en: "Orders",     ar: "الطلبات",   badge: pendingOrdersCount || 0 },
    { id: "menu",       icon: <UtensilsCrossed size={14}/>, en: "Menu",    ar: "القائمة"    },
    { id: "chat",       icon: <MessageCircle size={14}/>, en: "Chat",      ar: "الدردشة",   badge: unreadChats || 0 },
    { id: "reviews",    icon: <Star size={14}/>,          en: "Reviews",   ar: "تقييمات",   badge: feedback.filter((f) => !f.read).length || 0 },
    { id: "ideas",      icon: <Lightbulb size={14}/>,     en: "Ideas",     ar: "الأفكار",   badge: ideas.filter((i) => i.status === "pending").length || 0 },
    { id: "reports",    icon: <TrendingUp size={14}/>,    en: "Reports",   ar: "التقارير"   },
    { id: "broadcast",  icon: <Megaphone size={14}/>,     en: "Broadcast", ar: "إشعارات"   },
    { id: "reels",      icon: <Film size={14}/>,          en: "Reels",     ar: "ريلز"       },
    { id: "api",        icon: <Key size={14}/>,           en: "API Keys",  ar: "مفاتيح API" },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>

      {/* Admin Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3" style={{ background: "hsl(var(--primary))", boxShadow: "var(--shadow-md)" }}>
        <button onClick={() => navigate("/menu")} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
          <ArrowLeft size={18}/>
        </button>
        <ShieldCheck size={16} className="text-primary-foreground/80"/>
        <span className="font-bold text-primary-foreground text-sm flex-1">{tr("Azura Admin", "إدارة أزورا")}</span>
        <button onClick={() => { sessionStorage.removeItem("azura-admin"); navigate("/menu"); }} className="text-xs text-primary-foreground/60 hover:text-primary-foreground/90 font-medium">
          {tr("Sign out", "خروج")}
        </button>
      </header>

      {/* Tab Bar */}
      <nav className="sticky top-[52px] z-30 px-3 py-2 overflow-x-auto scroll-hide" style={{ background: "hsl(var(--card))", borderBottom: "1px solid rgba(93,62,35,0.08)", boxShadow: "var(--shadow-xs)" }}>
        <div className="flex gap-1.5 min-w-max">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedChat(null); }}
              className={`relative chip flex items-center gap-1.5 ${tab === t.id ? "chip-active" : "chip-inactive"}`}>
              {t.icon}
              <span>{lang === "ar" ? t.ar : t.en}</span>
              {(t.badge ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 font-bold">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4 pb-8">

        {/* ━━━ OVERVIEW ━━━ */}
        {tab === "overview" && (
          <div className="space-y-4 page-enter">
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: "📋", label: tr("Today's Orders","طلبات اليوم"), value: orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length },
                { emoji: "🔥", label: tr("Active","نشطة الآن"), value: pendingOrdersCount },
                { emoji: "💰", label: tr("Today Revenue","إيراد اليوم"), value: `${orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString() && o.status !== "cancelled").reduce((s,o) => s+o.total, 0)} EGP` },
                { emoji: "💬", label: tr("Unread","رسائل جديدة"), value: unreadChats + feedback.filter((f)=>!f.read).length + ideas.filter((i)=>i.status==="pending").length },
              ].map((s) => (
                <div key={s.label} className="card-elevated rounded-2xl p-4 text-center">
                  <p className="text-2xl mb-1">{s.emoji}</p>
                  <p className="text-2xl font-extrabold text-primary leading-tight">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <h2 className="font-bold text-sm text-foreground">{tr("Recent Activity","آخر النشاطات")}</h2>
            <div className="space-y-2">
              {[
                ...orders.slice(0,3).map((o) => ({ name: o.userName, sub: `Table ${o.tableNumber} · ${o.total} EGP`, time: o.createdAt, icon: "📋" })),
                ...feedback.slice(0,2).map((f) => ({ name: f.userName, sub: `${"★".repeat(f.rating)}${"☆".repeat(5-f.rating)} · ${f.comment.slice(0,40)}`, time: f.createdAt, icon: "⭐" })),
                ...ideas.slice(0,2).map((i) => ({ name: i.userName, sub: `Suggests: ${i.itemName}`, time: i.createdAt, icon: "💡" })),
              ].sort((a,b) => b.time - a.time).slice(0,8).map((a, i) => (
                <div key={i} className="card rounded-xl p-3 flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.sub}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {new Date(a.time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                  </span>
                </div>
              ))}
              {orders.length === 0 && feedback.length === 0 && ideas.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">{tr("No activity yet","لا يوجد نشاط بعد")}</p>
              )}
            </div>
          </div>
        )}

        {/* ━━━ ORDERS ━━━ */}
        {tab === "orders" && (
          <div className="space-y-4 page-enter">
            {/* Table Grid - 1-11 inside, 14 outside */}
            <div className="grid grid-cols-3 gap-3">
              {/* Inside tables (1-11) */}
              <div className="col-span-3">
                <h3 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-2">
                  <span>🏠</span> {tr("Inside Tables (1-11)","الطاولات الداخلية (1-11)")}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({length: 11}, (_, i) => i + 1).map((tableNum) => {
                    const tableOrders = orders.filter((o) => o.tableNumber === String(tableNum));
                    const hasActive = tableOrders.some((o) => o.status === "pending" || o.status === "preparing");
                    const hasNew = tableOrders.some((o) => {
                      const created = o.createdAt || 0;
                      return Date.now() - created < 300000; // 5 min
                    });
                    return (
                      <button key={tableNum} onClick={() => setSelectedTable(String(tableNum))}
                        className={`relative p-3 rounded-xl text-center transition-all ${
                          selectedTable === String(tableNum) 
                            ? "bg-primary/20 ring-2 ring-primary" 
                            : hasActive 
                              ? "bg-amber-50 ring-1 ring-amber-300"
                              : "bg-card hover:bg-muted/50"
                        }`}>
                        <div className="text-2xl font-bold text-primary">{tableNum}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {tableOrders.length} {tr("orders","طلب")}
                        </div>
                        {hasNew && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                        )}
                        {hasActive && !hasNew && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"/>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Outside table (14) */}
              <div className="col-span-3">
                <h3 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-2">
                  <span>🌳</span> {tr("Outside (14)","الخارجي (14)")}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[14].map((tableNum) => {
                    const tableOrders = orders.filter((o) => o.tableNumber === String(tableNum));
                    const hasActive = tableOrders.some((o) => o.status === "pending" || o.status === "preparing");
                    const hasNew = tableOrders.some((o) => {
                      const created = o.createdAt || 0;
                      return Date.now() - created < 300000;
                    });
                    return (
                      <button key={tableNum} onClick={() => setSelectedTable(String(tableNum))}
                        className={`relative p-3 rounded-xl text-center transition-all ${
                          selectedTable === String(tableNum) 
                            ? "bg-primary/20 ring-2 ring-primary" 
                            : hasActive 
                              ? "bg-amber-50 ring-1 ring-amber-300"
                              : "bg-card hover:bg-muted/50"
                        }`}>
                        <div className="text-2xl font-bold text-primary">{tableNum}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {tableOrders.length} {tr("orders","طلب")}
                        </div>
                        {hasNew && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                        )}
                        {hasActive && !hasNew && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"/>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Table Orders */}
            {selectedTable && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-primary flex items-center gap-2">
                    {tr("Table","طاولة")} {selectedTable} - {tr("Orders","الطلبات")}
                  </h3>
                  <button onClick={() => setSelectedTable(null)} className="text-xs text-muted-foreground hover:text-foreground">
                    {tr("Close","إغلاق")}
                  </button>
                </div>
                
                {orders.filter((o) => o.tableNumber === selectedTable).length === 0 ? (
                  <div className="text-center py-8 card rounded-xl">
                    <Package size={36} className="mx-auto text-muted-foreground/30 mb-2"/>
                    <p className="text-muted-foreground text-sm">{tr("No orders for this table","لا يوجد طلبات لهذه الطاولة")}</p>
                  </div>
                ) : (
                  orders.filter((o) => o.tableNumber === selectedTable).map((o) => (
                    <details key={`${o.userId || ""}-${o.orderId}`} className="card rounded-2xl overflow-hidden group">
                      <summary className="p-4 cursor-pointer flex items-center gap-3 select-none list-none">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-bold text-sm text-foreground">{o.userName}</p>
                            <span className="text-[10px] text-muted-foreground">#{o.orderId?.slice(-5)}</span>
                            {Date.now() - (o.createdAt || 0) < 300000 && (
                              <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{o.items?.length||0} {tr("items","عناصر")} · {o.total} {tr("EGP","ج.م")}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(o.createdAt).toLocaleString(lang==="ar"?"ar-EG":"en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                          </p>
                        </div>
                        <span className={`badge px-2 py-1 flex-shrink-0 ${STATUS_META[o.status]?.cls || ""}`}>
                          {STATUS_META[o.status]?.icon}
                          <span className="ms-1">{lang==="ar"?STATUS_META[o.status]?.ar:STATUS_META[o.status]?.label}</span>
                        </span>
                        <ChevronDown size={14} className="text-muted-foreground flex-shrink-0 group-open:rotate-180 transition-transform"/>
                      </summary>
                      <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                        <div className="space-y-1">
                          {o.items?.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-foreground">{lang==="ar"?(item.nameAr||item.name):item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                              <span className="font-semibold text-secondary">{item.subtotal} {tr("EGP","ج.م")}</span>
                            </div>
                          ))}
                          {o.notes && <p className="text-xs italic text-muted-foreground mt-1">📝 {o.notes}</p>}
                          <div className="flex justify-between text-sm font-bold pt-1 border-t border-border/40">
                            <span>{tr("Total","الإجمالي")}</span>
                            <span className="text-primary">{o.total} {tr("EGP","ج.م")}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {STATUS_FLOW.filter((s) => s !== o.status).map((s) => (
                            <button key={s} onClick={() => setOrderStatus(o, s)} className={`chip text-[11px] ${STATUS_META[s]?.cls}`}>
                              {STATUS_META[s]?.icon} <span className="ms-1">{lang==="ar"?STATUS_META[s]?.ar:STATUS_META[s]?.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </details>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ━━━ MENU ━━━ */}
        {tab === "menu" && (
          <div className="space-y-3 page-enter">
            <button onClick={() => setAdding(!adding)} className="btn-primary w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              <Plus size={16}/> {tr("Add Menu Item","إضافة عنصر")}
            </button>
            {adding && (
              <div className="card-elevated rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-foreground">{tr("New Item","عنصر جديد")}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inp} placeholder={tr("Name (EN) *","الاسم EN *")} value={newItem.name} onChange={(e) => setNewItem((p) => ({...p, name: e.target.value}))} />
                  <input className={inp} placeholder="اسم بالعربي" dir="rtl" value={newItem.nameAr} onChange={(e) => setNewItem((p) => ({...p, nameAr: e.target.value}))} />
                </div>
                <input className={inp} placeholder={tr("Description","وصف قصير")} value={newItem.description} onChange={(e) => setNewItem((p) => ({...p, description: e.target.value}))} />
                <div className="grid grid-cols-2 gap-2">
                  <input className={inp} type="number" placeholder={tr("Price (EGP) *","السعر ج.م *")} value={newItem.price} onChange={(e) => setNewItem((p) => ({...p, price: e.target.value}))} />
                  <select className={inp} value={newItem.category} onChange={(e) => { setNewItem((p) => ({...p, category: e.target.value})); setShowGallery(false); }}>
                    {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {/* Image */}
                <div className="rounded-xl overflow-hidden" style={{ border: "1.5px dashed hsl(var(--border))" }}>
                  {newItem.image ? (
                    <div className="relative">
                      <img src={newItem.image} alt="preview" className="w-full h-32 object-cover"/>
                      <div className="absolute inset-0 flex items-end px-3 pb-2" style={{ background: "linear-gradient(transparent,rgba(0,0,0,0.4))" }}>
                        <span className="text-white text-xs font-medium">{imgSize > 0 ? `${imgSize} KB` : "Sample"}</span>
                      </div>
                      <button onClick={() => { setNewItem((p) => ({...p, image: ""})); setImgSize(0); }} className="absolute top-2 right-2 btn-icon w-7 h-7 bg-white/90 text-destructive">
                        <XCircle size={13}/>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      <label className="flex items-center justify-center gap-2 cursor-pointer rounded-lg py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors">
                        <Upload size={16}/>
                        {uploading ? tr("Compressing…","جاري الضغط…") : tr("Upload & Compress","رفع وضغط")}
                        <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}/>
                      </label>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <hr className="flex-1 border-border"/> <span>{tr("or sample","أو نموذج")}</span> <hr className="flex-1 border-border"/>
                      </div>
                    </div>
                  )}
                  {!newItem.image && (
                    <>
                      <button onClick={() => setShowGallery(!showGallery)} className="w-full py-2 text-xs font-semibold text-primary flex items-center justify-center gap-1.5" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                        <ImageIcon size={13}/> {tr(`Samples (${newItem.category})`,`نماذج (${newItem.category})`)}
                      </button>
                      {showGallery && (
                        <div className="grid grid-cols-3 gap-1 p-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                          {(SAMPLE_IMAGES[newItem.category] || []).map((img) => (
                            <button key={img.url} onClick={() => { setNewItem((p) => ({...p, image: img.url})); setImgSize(0); setShowGallery(false); }} className="relative rounded-lg overflow-hidden aspect-square hover:ring-2 ring-primary transition-all">
                              <img src={img.url} alt={img.label} className="w-full h-full object-cover"/>
                              <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[9px] text-center py-0.5">{img.label}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={saveItem} disabled={savingItem || !newItem.name || !newItem.price} className="btn-primary flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50">
                    {savingItem ? tr("Saving…","حفظ…") : tr("Save Item","حفظ العنصر")}
                  </button>
                  <button onClick={() => { setAdding(false); setNewItem(BLANK_ITEM); setImgSize(0); setShowGallery(false); }} className="btn-secondary px-5 py-3 rounded-xl text-sm">{tr("Cancel","إلغاء")}</button>
                </div>
              </div>
            )}
            {menuItems.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">{tr("No menu items","لا توجد عناصر")}</p>}
            <div className="space-y-2">
              {menuItems.map((item) => (
                <div key={item.id} className={`card rounded-xl p-3 flex items-center gap-3 transition-opacity ${!item.available ? "opacity-55" : ""}`}>
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }}/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">{item.category === "coffee" ? "☕" : item.category === "desserts" ? "🍰" : item.category === "beverages" ? "🧃" : "🥗"}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-secondary font-bold">{item.price} {tr("EGP","ج.م")}</p>
                    <span className={`badge px-1.5 py-0.5 text-[10px] mt-0.5 ${item.available ? "status-ready" : "status-cancelled"}`}>
                      {item.available ? tr("Available","متاح") : tr("Hidden","مخفي")}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => toggleAvail(item)} className="btn-icon w-8 h-8 text-primary">
                      {item.available ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
                    </button>
                    <button onClick={() => deleteItem(item)} className="btn-icon w-8 h-8 text-destructive/70 hover:text-destructive">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ━━━ CHAT ━━━ */}
        {tab === "chat" && (
          <div className="page-enter">
            {selectedChat ? (
              <div className="flex flex-col h-[calc(100dvh-12rem)]">
                <button onClick={() => setSelectedChat(null)} className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-3">
                  <ArrowLeft size={14}/> {tr("All Chats","كل الدردشات")}
                </button>
                <div className="card rounded-2xl overflow-hidden flex flex-col flex-1">
                  <div className="px-4 py-2.5 flex-shrink-0" style={{ background: "hsl(var(--muted))", borderBottom: "1px solid hsl(var(--border))" }}>
                    <p className="font-bold text-sm text-primary">{chats.find((c) => c.uid === selectedChat)?.userName || "Guest"}</p>
                    <p className="text-[10px] text-muted-foreground">{tr("Support session","جلسة دعم")}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scroll-hide">
                    {chatMsgs.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">{tr("No messages yet","لا توجد رسائل")}</p>}
                    {chatMsgs.map((m) => (
                      <div key={m.id} className={`flex ${m.sender==="user"?(isRTL?"justify-end":"justify-start"):(isRTL?"justify-start":"justify-end")}`}>
                        <div className={`max-w-[78%] px-3 py-2 text-sm rounded-xl ${m.sender==="user"?"bg-muted text-foreground":"bubble-user"}`}>
                          {m.sender!=="user" && <p className="text-[9px] font-bold text-primary-foreground/70 mb-0.5">{tr("You (Admin)","أنت (مدير)")}</p>}
                          {m.text}
                          <p className="text-[9px] opacity-50 mt-0.5">{new Date(m.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatBottomRef}/>
                  </div>
                  <div className="flex items-center gap-2 p-3 flex-shrink-0" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                    <input className="flex-1 input-field px-3 py-2 text-sm" placeholder={tr("Reply…","رد…")} value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key==="Enter" && sendReply()} dir={isRTL?"rtl":"ltr"}/>
                    <button onClick={sendReply} disabled={!chatInput.trim()} className="btn-icon w-9 h-9 disabled:opacity-40"
                      style={chatInput.trim()?{background:"hsl(var(--primary))",color:"hsl(var(--primary-foreground))"}:{}}>
                      <Send size={14}/>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {chats.length === 0 && (
                  <div className="text-center py-14">
                    <MessageCircle size={44} className="mx-auto text-muted-foreground/25 mb-2"/>
                    <p className="text-muted-foreground text-sm">{tr("No support chats yet","لا يوجد محادثات دعم")}</p>
                  </div>
                )}
                {chats.map((c) => (
                  <button key={c.uid} onClick={() => setSelectedChat(c.uid)} className="card rounded-xl p-3 w-full flex items-center gap-3 hover:shadow-md transition-shadow text-left">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                      {c.userName?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{c.userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <p className="text-[10px] text-muted-foreground">{c.lastAt ? new Date(c.lastAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : ""}</p>
                      {c.unreadAdmin > 0 && <span className="badge px-1.5 py-0.5 bg-red-500 text-white text-[9px]">{c.unreadAdmin}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ━━━ REVIEWS ━━━ */}
        {tab === "reviews" && (
          <div className="space-y-4 page-enter">
            {feedback.length > 0 && (
              <div className="card-elevated rounded-2xl p-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-4xl font-extrabold text-primary">{avgRating}</p>
                    <Stars n={parseFloat(avgRating as string) || 0}/>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{feedback.length} {tr("reviews","تقييم")}</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {ratingDist.map((d) => (
                      <div key={d.r} className="flex items-center gap-2 text-xs">
                        <span className="w-4 text-right font-semibold text-foreground">{d.r}</span>
                        <span className="text-yellow-400">★</span>
                        <div className="flex-1"><CssBar pct={(d.count/maxRatingCount)*100} color="#F59E0B"/></div>
                        <span className="w-5 text-muted-foreground">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {feedback.length === 0 && (
              <div className="text-center py-12"><Star size={40} className="mx-auto text-muted-foreground/25 mb-2"/><p className="text-muted-foreground text-sm">{tr("No reviews yet","لا يوجد تقييمات")}</p></div>
            )}
            {feedback.map((f) => (
              <div key={f.id} className={`card rounded-xl p-4 ${!f.read ? "ring-1 ring-primary/30" : ""}`}>
                <div className="flex items-start justify-between mb-1.5">
                  <div><p className="font-semibold text-sm text-foreground">{f.userName}</p><Stars n={f.rating} size={13}/></div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-[10px] text-muted-foreground">{new Date(f.createdAt).toLocaleDateString()}</p>
                    {!f.read && <button onClick={() => markFeedbackRead(f.id)} className="text-[10px] text-primary font-semibold">{tr("Mark read","قراءة")}</button>}
                  </div>
                </div>
                {f.comment && <p className="text-sm text-muted-foreground italic">"{f.comment}"</p>}
              </div>
            ))}
          </div>
        )}

        {/* ━━━ IDEAS (Suggestions) ━━━ */}
        {tab === "ideas" && (
          <div className="space-y-3 page-enter">
            <div className="card rounded-xl p-3 bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-800 font-semibold">💡 {tr("Customers can suggest items to add to your menu. Approve to accept, Decline to reject.","يقترح العملاء عناصر لإضافتها للقائمة. وافق أو ارفض.")}</p>
            </div>
            {ideas.length === 0 && (
              <div className="text-center py-12"><Lightbulb size={40} className="mx-auto text-muted-foreground/25 mb-2"/><p className="text-muted-foreground text-sm">{tr("No suggestions yet","لا يوجد اقتراحات")}</p></div>
            )}
            {ideas.map((idea) => (
              <div key={idea.id} className="card rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  {idea.image && <img src={idea.image} alt={idea.itemName} className="w-16 h-16 rounded-xl object-cover flex-shrink-0"/>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm text-foreground">{idea.itemName}</p>
                        <p className="text-[11px] text-secondary font-semibold capitalize">{idea.category}</p>
                      </div>
                      <span className={`badge px-2 py-0.5 flex-shrink-0 ${idea.status==="approved"?"status-ready":idea.status==="declined"?"status-cancelled":"status-pending"}`}>
                        {idea.status}
                      </span>
                    </div>
                    {idea.description && <p className="text-xs text-muted-foreground mt-1">{idea.description}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{tr("By","من")} {idea.userName} · {new Date(idea.createdAt).toLocaleDateString()}</p>
                    {idea.adminNote && <p className="text-xs text-primary font-medium mt-1">💬 {idea.adminNote}</p>}
                  </div>
                </div>
                {idea.status === "pending" && (
                  <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                    <button onClick={() => setSuggestionStatus(idea.id, "approved")} className="flex-1 py-2 rounded-xl text-xs font-bold status-ready flex items-center justify-center gap-1">
                      <CheckCircle size={12}/> {tr("Approve","موافقة")}
                    </button>
                    <button onClick={() => setSuggestionStatus(idea.id, "declined")} className="flex-1 py-2 rounded-xl text-xs font-bold status-cancelled flex items-center justify-center gap-1">
                      <XCircle size={12}/> {tr("Decline","رفض")}
                    </button>
                    <button onClick={() => { const note = prompt(tr("Add note for customer:","أضف ملاحظة للعميل:")); if (note) setSuggestionStatus(idea.id, "pending", note); }} className="flex-1 py-2 rounded-xl text-xs font-bold chip-inactive flex items-center justify-center gap-1">
                      💬 {tr("Note","ملاحظة")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ━━━ REPORTS ━━━ */}
        {tab === "reports" && (
          <div className="space-y-5 page-enter">
            <div className="flex gap-2">
              {(["today","week","month"] as const).map((r) => (
                <button key={r} onClick={() => setRange(r)} className={`chip flex-1 justify-center ${range===r?"chip-active":"chip-inactive"}`}>
                  {r==="today"?tr("Today","اليوم"):r==="week"?tr("7 Days","7 أيام"):tr("30 Days","30 يوم")}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: tr("Orders","طلبات"),    value: filteredOrders.length },
                { label: tr("Revenue","إيراد"),   value: `${revenue} EGP` },
                { label: tr("Avg Order","متوسط"), value: filteredOrders.filter(o=>o.status!=="cancelled").length ? `${Math.round(revenue/filteredOrders.filter(o=>o.status!=="cancelled").length)||0} EGP` : "—" },
                { label: tr("Cancel Rate","إلغاء"), value: `${cancelRate}%` },
              ].map((k) => (
                <div key={k.label} className="card-elevated rounded-2xl p-4 text-center">
                  <p className="text-xl font-extrabold text-primary">{k.value}</p>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>
            <div className="card rounded-2xl p-4">
              <h3 className="font-bold text-sm text-foreground mb-3">{tr("Orders – Last 7 Days","الطلبات – آخر 7 أيام")}</h3>
              <div className="flex items-end gap-1.5 h-20">
                {dayBuckets.map((count, i) => {
                  const label = new Date(Date.now()-(6-i)*86400000).toLocaleDateString(lang==="ar"?"ar-EG":"en-US",{weekday:"short"});
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-muted-foreground font-bold">{count||""}</span>
                      <div className="w-full rounded-t-md transition-all" style={{ height:`${(count/maxDayCount)*100}%`, minHeight:4, background:count?"hsl(var(--primary))":"hsl(var(--muted))" }}/>
                      <span className="text-[8px] text-muted-foreground leading-none">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {topItems.length > 0 && (
              <div className="card rounded-2xl p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">{tr("Most Ordered","الأكثر طلباً")}</h3>
                <div className="space-y-2.5">
                  {topItems.map((item, i) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-foreground">{i+1}. {item.name}</span>
                        <span className="text-secondary font-bold">{item.count}×</span>
                      </div>
                      <CssBar pct={(item.count/maxFreq)*100}/>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="card rounded-2xl p-4">
              <h3 className="font-bold text-sm text-foreground mb-3">{tr("Order Statuses","توزيع الحالات")}</h3>
              <div className="space-y-2">
                {STATUS_FLOW.map((s) => {
                  const cnt = filteredOrders.filter((o) => o.status === s).length;
                  const pct = filteredOrders.length ? (cnt/filteredOrders.length)*100 : 0;
                  return (
                    <div key={s} className="flex items-center gap-2 text-xs">
                      <span className="w-16 text-muted-foreground capitalize">{lang==="ar"?STATUS_META[s]?.ar:STATUS_META[s]?.label}</span>
                      <div className="flex-1"><CssBar pct={pct}/></div>
                      <span className="w-8 text-right font-bold text-foreground">{cnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ━━━ BROADCAST ━━━ */}
        {tab === "broadcast" && (
          <div className="space-y-4 page-enter">
            {/* Compose */}
            <div className="card-elevated rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Megaphone size={16} className="text-primary"/> {tr("Send Announcement","إرسال إشعار للجميع")}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(["📢","🎉","⚠️","🔥","💝","☕"] as const).map((e) => (
                  <button key={e} onClick={() => setNewBroadcast((p) => ({...p, emoji: e}))}
                    className={`py-2 rounded-xl text-xl transition-all ${newBroadcast.emoji === e ? "ring-2 ring-primary bg-primary/10" : "bg-muted/50"}`}>
                    {e}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["info","promo","alert"] as const).map((t) => (
                  <button key={t} onClick={() => setNewBroadcast((p) => ({...p, type: t}))}
                    className={`py-2 rounded-xl text-xs font-bold transition-all capitalize ${newBroadcast.type === t ? (t==="info"?"bg-blue-500 text-white":t==="promo"?"bg-amber-500 text-white":"bg-red-500 text-white") : "chip-inactive"}`}>
                    {t === "info" ? tr("Info","معلومة") : t === "promo" ? tr("Promo","عرض") : tr("Alert","تنبيه")}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className={inp} placeholder={tr("Title (EN)","العنوان EN")} value={newBroadcast.title} onChange={(e) => setNewBroadcast((p) => ({...p, title: e.target.value}))}/>
                <input className={inp} dir="rtl" placeholder="العنوان عربي" value={newBroadcast.titleAr} onChange={(e) => setNewBroadcast((p) => ({...p, titleAr: e.target.value}))}/>
              </div>
              <textarea rows={2} className={`${inp} resize-none`} placeholder={tr("Message (EN)","الرسالة EN")} value={newBroadcast.message} onChange={(e) => setNewBroadcast((p) => ({...p, message: e.target.value}))}/>
              <textarea rows={2} className={`${inp} resize-none`} dir="rtl" placeholder="الرسالة بالعربي" value={newBroadcast.messageAr} onChange={(e) => setNewBroadcast((p) => ({...p, messageAr: e.target.value}))}/>
              <button onClick={sendBroadcast} disabled={sendingBroadcast || !newBroadcast.title || !newBroadcast.message}
                className="btn-primary w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                <Send size={14}/> {sendingBroadcast ? tr("Sending…","جاري الإرسال…") : tr("Send to All Users","أرسل للجميع")}
              </button>
            </div>

            {/* Past broadcasts */}
            <h3 className="font-bold text-sm text-foreground">{tr("Sent Announcements","الإشعارات المُرسلة")}</h3>
            {broadcasts.length === 0 && (
              <div className="text-center py-8"><Megaphone size={36} className="mx-auto text-muted-foreground/25 mb-2"/><p className="text-muted-foreground text-sm">{tr("No announcements yet","لم يُرسل أي إشعار بعد")}</p></div>
            )}
            {broadcasts.map((b) => (
              <div key={b.id} className={`card rounded-xl p-3 flex items-start gap-3 ${b.type==="alert"?"border border-red-200":b.type==="promo"?"border border-amber-200":"border border-blue-200"}`}>
                <span className="text-2xl flex-shrink-0">{b.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground">{b.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{b.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(b.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => deleteBroadcast(b.id)} className="btn-icon w-8 h-8 text-destructive/60 hover:text-destructive flex-shrink-0"><Trash2 size={13}/></button>
              </div>
            ))}
          </div>
        )}

        {/* ━━━ REELS ━━━ */}
        {tab === "reels" && (
          <div className="space-y-4 page-enter">
            <div className="card rounded-xl p-3 bg-purple-50 border border-purple-200">
              <p className="text-xs text-purple-800 font-semibold">🎬 {tr("Manage your cafe posts. To add a new post, visit the Reels page in the app (+ button).","أدر منشورات الكافيه. لإضافة منشور جديد، اذهب لصفحة الريلز في التطبيق (زر +).")}</p>
            </div>
            {reels.length === 0 && (
              <div className="text-center py-12"><Film size={40} className="mx-auto text-muted-foreground/25 mb-2"/><p className="text-muted-foreground text-sm">{tr("No posts yet","لا يوجد منشورات بعد")}</p></div>
            )}
            <div className="space-y-3">
              {reels.map((reel) => (
                <div key={reel.id} className="card rounded-xl overflow-hidden flex">
                  <div className="w-20 h-20 flex-shrink-0 bg-muted">
                    {reel.image && <img src={reel.image} alt={reel.caption} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }}/>}
                  </div>
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {reel.pinned && <span className="badge px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold mb-1">📌 {tr("Pinned","مثبت")}</span>}
                        <p className="text-xs text-foreground font-medium line-clamp-2">{reel.caption || reel.captionAr || tr("No caption","بدون وصف")}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">❤️ {reel.likes||0} · {new Date(reel.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-2 flex-shrink-0 justify-center">
                    <button onClick={() => togglePin(reel)} className="btn-icon w-8 h-8 text-primary" title={reel.pinned ? "Unpin" : "Pin"}>
                      <Pin size={13} className={reel.pinned ? "fill-primary" : ""}/>
                    </button>
                    <button onClick={() => deleteReel(reel)} className="btn-icon w-8 h-8 text-destructive/60 hover:text-destructive">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ━━━ API SETTINGS ━━━ */}
        {tab === "api" && (
          <div className="space-y-4 page-enter">
            <div className="card-elevated rounded-2xl p-5 space-y-5">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Key size={18} className="text-primary"/> {tr("API & AI Configuration","إعدادات API والذكاء الاصطناعي")}
              </h3>

              {/* Gemini API Key */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">{tr("Gemini API Key","مفتاح Gemini API")}</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      className={`${inp} w-full pr-10`}
                      placeholder={tr("Enter your Gemini API key","أدخل مفتاح Gemini")}
                      value={apiSettings.geminiKey}
                      onChange={(e) => setApiSettings((p) => ({...p, geminiKey: e.target.value}))}
                    />
                    <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showApiKey ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">{tr("Get your key from","احصل على مفتاحك من")} <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google AI Studio</a></p>
              </div>

              {/* TTS API Key */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">{tr("Text-to-Speech Key (Optional)","مفتاح الصوت (اختياري)")}</label>
                <input
                  type="password"
                  className={inp}
                  placeholder={tr("ElevenLabs or Google TTS key","مفتاح ElevenLabs أو Google TTS")}
                  value={apiSettings.ttsKey}
                  onChange={(e) => setApiSettings((p) => ({...p, ttsKey: e.target.value}))}
                />
                <p className="text-[11px] text-muted-foreground">{tr("Optional: For AI voice responses","اختياري: لأصوات الذكاء الاصطناعي")}</p>
              </div>

              {/* AI Toggle */}
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50">
                <div>
                  <p className="font-semibold text-sm">{tr("AI Barista","الباريستا الذكي")}</p>
                  <p className="text-[11px] text-muted-foreground">{tr("Enable AI chat feature","تفعيل محادثة الذكاء الاصطناعي")}</p>
                </div>
                <button onClick={() => setApiSettings((p) => ({...p, aiEnabled: !p.aiEnabled}))}
                  className={`w-12 h-7 rounded-full relative transition-colors ${apiSettings.aiEnabled ? "bg-primary" : "bg-muted"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-all ${apiSettings.aiEnabled ? "translate-x-6" : "translate-x-1"}`}/>
                </button>
              </div>

              {/* Save Button */}
              <button onClick={saveApiSettings} disabled={savingApiKey}
                className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                <Settings size={16}/> {savingApiKey ? tr("Saving…","جاري الحفظ…") : tr("Save Settings","حفظ الإعدادات")}
              </button>

              {/* Status */}
              <div className="rounded-xl p-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${apiSettings.geminiKey ? "bg-green-500" : "bg-amber-500"}`}/>
                  <span className="text-xs font-medium">
                    {apiSettings.geminiKey ? tr("Gemini API configured","Gemini API مُعدّ") : tr("Gemini API not configured","Gemini API غير مُعدّ")}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {tr("AI features require a valid API key. Get one free at makersuite.google.com","تتطلب ميزات الذكاء الاصطناعي مفتاح API صالح. احصل على واحد مجاناً من makersuite.google.com")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
