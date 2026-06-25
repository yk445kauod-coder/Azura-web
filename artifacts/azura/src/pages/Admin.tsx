import { useState, useEffect, useRef } from "react";
import { db, ref, onValue, off, update, set, push, remove, get } from "@/lib/firebase";
import { smartGet, smartSet, smartUpdate, smartRemove, smartPush, getDBMode, setDBMode, onModeChange } from "@/lib/dbWrapper";
import { testR2Connection, type R2Config, listR2Objects, downloadFromR2, uploadToR2 } from "@/lib/r2";
import { useLang } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { compressToBase64, base64SizeKB } from "@/lib/imageUtils";
import { swalSuccess, swalError, swalConfirm, swalLoading, swalClose } from "@/lib/swal";
import { fileToChunks, getChunksSizeMB, saveToIndexedDB } from "@/lib/chunkedVideo";
import { encryptKey } from "@/lib/crypto";
import { parseVideoUrl, getProviderName, getProviderIcon, type VideoProvider } from "@/lib/videoProviders";
import {
  MessageCircle, Star,
  TrendingUp, ShieldCheck, ArrowLeft, Plus, Trash2,
  Send, CheckCircle, XCircle,
  ImageIcon, Megaphone, Film, Pin, Key, Settings, Eye, EyeOff,
  RotateCcw, Download, Archive, UploadCloud, Save,
  Video, AlertTriangle, Bot, LayoutDashboard, Users,
} from "lucide-react";
import AIAdminAssistant from "@/components/AIAdminAssistant";

const ADMIN_PIN = "azura2024";
type Tab = "overview" | "menu" | "users" | "chat" | "reviews" | "reports" | "broadcast" | "reels" | "api" | "system" | "ai";

interface MenuItem { id: string; name: string; nameAr: string; description: string; descriptionAr?: string; price: number; category: string; available: boolean; image: string; ingredients?: string; ingredientsAr?: string; }
interface ChatSession { uid: string; userName: string; lastMessage: string; lastAt: number; unreadAdmin: number; }
interface ChatMsg { id: string; text: string; sender: "user" | "admin"; createdAt: number; }
interface Feedback { id: string; userName: string; rating: number; comment: string; orderId?: string; createdAt: number; read: boolean; }
interface Report { id: string; userName: string; description: string; type: string; status: string; createdAt: number; }
interface Broadcast { id: string; title: string; titleAr: string; message: string; messageAr: string; type: "info" | "promo" | "alert"; emoji: string; createdAt: number; }
interface Reel { id: string; image: string; caption: string; captionAr: string; likes: number; createdAt: number; authorName: string; pinned?: boolean; mediaType?: "image" | "video"; videoUrl?: string; videoProvider?: VideoProvider; videoThumbnail?: string; videoChunks?: string[]; chunkCount?: number; }

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

export default function Admin() {
  const { lang, isRTL } = useLang();
  const [, navigate] = useLocation();
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("azura-admin") === "true");
  const [pinErr, setPinErr] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [dbMode, setDbModeState] = useState(getDBMode());

  useEffect(() => {
    return onModeChange(() => setDbModeState(getDBMode()));
  }, []);

  // Data
  const [menu, setMenu]           = useState<MenuItem[]>([]);
  const [users, setUsers]         = useState<any[]>([]);
  const [chats, setChats]         = useState<ChatSession[]>([]);
  const [feedback, setFeedback]   = useState<Feedback[]>([]);
  const [reports, setReports]     = useState<Report[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [reels, setReels]         = useState<Reel[]>([]);

  // Chat
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMsgs, setChatMsgs]         = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput]       = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Broadcast form
  const [newBroadcast, setNewBroadcast] = useState<{
    title: string; titleAr: string; message: string; messageAr: string; type: "info" | "promo" | "alert"; emoji: string;
  }>(BLANK_BROADCAST);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Reels form
  const [newReel, setNewReel] = useState<{
    image: string; caption: string; captionAr: string; mediaType: "image" | "video"; videoUrl: string; videoProvider: VideoProvider | undefined; videoThumbnail: string; videoChunks?: string[]; chunkCount?: number;
  }>({
    image: "", caption: "", captionAr: "", mediaType: "image" as "image" | "video", videoUrl: "", videoProvider: undefined as VideoProvider | undefined, videoThumbnail: "",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // API settings
  const [apiSettings, setApiSettings] = useState({
    groqKey: "",
    aiProvider: "groq" as "groq" | "pollinations" | "openai",
    openaiEndpoint: "",
    aiEnabled: true,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);

  // Homepage Banner settings
  const [bannerContent, setBannerContent] = useState("");
  const [bannerBgColor, setBannerBgColor] = useState("#FF6B35");
  const [bannerTextColor, setBannerTextColor] = useState("#FFFFFF");
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);

  // Load banner from Firebase
  useEffect(() => {
    if (!authed) return;
    const bannerRef = ref(db, "homepage-banner");
    onValue(bannerRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setBannerContent(data.content || "");
        setBannerBgColor(data.bgColor || "#FF6B35");
        setBannerTextColor(data.textColor || "#FFFFFF");
        setBannerEnabled(data.enabled !== false);
      }
    });
    return () => off(ref(db, "homepage-banner"));
  }, [authed]);

  const saveBanner = async () => {
    setSavingBanner(true);
    setBannerPreview(true);
    try {
      await set(ref(db, "homepage-banner"), {
        content: bannerContent,
        bgColor: bannerBgColor,
        textColor: bannerTextColor,
        enabled: bannerEnabled,
      });
      setTimeout(() => setBannerPreview(false), 2000);
    } catch (err) {
      console.error(err);
    }
    setSavingBanner(false);
  };

  const saveBannerEnabled = async (enabled: boolean) => {
    setBannerEnabled(enabled);
    await set(ref(db, "homepage-banner"), {
      content: bannerContent,
      bgColor: bannerBgColor,
      textColor: bannerTextColor,
      enabled,
    });
  };

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;
  const inp = "input-field px-3 py-2.5 text-sm";

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // ── Load all data ──────────────────────────────────────────────
  useEffect(() => {
    if (!authed) return;

    // Menu
    onValue(ref(db, "menu"), (snap) => {
      if (!snap.exists()) { setMenu([]); return; }
      const data = snap.val() as Record<string, any>;
      const result: MenuItem[] = [];
      Object.entries(data).forEach(([key, val]) => {
        if (typeof val !== "object" || val === null) return;
        const v = val as Record<string, any>;
        if (v.price !== undefined || v.name !== undefined) {
          result.push({ id: key, ...v } as MenuItem);
        } else {
          Object.entries(v).forEach(([subId, subVal]) => {
            if (typeof subVal === "object" && subVal !== null)
              result.push({ id: subId, ...subVal as any } as MenuItem);
          });
        }
      });
      setMenu(result);
    });

    // Users
    onValue(ref(db, "users"), (snap) => {
      if (!snap.exists()) { setUsers([]); return; }
      const data = snap.val() as Record<string, any>;
      const list = Object.entries(data).map(([uid, val]) => ({ uid, ...val }));
      setUsers(list.sort((a, b) => (b.lastLoginAt || 0) - (a.lastLoginAt || 0)));
    });

    // Feedback
    onValue(ref(db, "feedback"), (snap) => {
      if (!snap.exists()) { setFeedback([]); return; }
      const data = snap.val() as Record<string, Omit<Feedback, "id">>;
      setFeedback(Object.entries(data).map(([id, f]) => ({ id, ...f })).sort((a, b) => b.createdAt - a.createdAt));
    });

    // User Reports
    onValue(ref(db, "reports"), (snap) => {
      if (!snap.exists()) { setReports([]); return; }
      const data = snap.val() as Record<string, Omit<Report, "id">>;
      setReports(Object.entries(data).map(([id, r]) => ({ id, ...r })).sort((a, b) => b.createdAt - a.createdAt));
    });

    // Support chat
    onValue(ref(db, "support-chat"), (snap) => {
      if (!snap.exists()) { setChats([]); return; }
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
      const data = snap.val() as Record<string, any>;
      setApiSettings({
        groqKey: data.groqKey || "",
        aiProvider: data.aiProvider || "groq",
        openaiEndpoint: data.openaiEndpoint || "",
        aiEnabled: data.aiEnabled !== false,
      });
    });

    return () => {
      ["menu","users","feedback","reports","support-chat","broadcast","reels","api-settings"].forEach((p) => off(ref(db, p)));
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

  // ── Chat helpers ──────────────────────────────────────────────
  const sendReply = async () => {
    if (!chatInput.trim() || !selectedChat) return;
    await smartPush(`support-chat/${selectedChat}/messages`, { text: chatInput.trim(), sender: "admin", createdAt: Date.now(), readByAdmin: true });
    await smartUpdate(`support-chat/${selectedChat}/meta`, { lastMessage: chatInput.trim(), lastAt: Date.now() });
    setChatInput("");
  };

  // ── Feedback helpers ──────────────────────────────────────────
  const markFeedbackRead = (id: string) => smartUpdate(`feedback/${id}`, { read: true });

  // ── Report helpers ──────────────────────────────────────────
  const updateReportStatus = (id: string, status: string) =>
    smartUpdate(`reports/${id}`, { status });

  const deleteUser = async (uid: string, name: string) => {
    if (await swalConfirm(tr(`Delete User ${name}?`, `حذف المستخدم ${name}؟`), tr("This will remove all user data. Chat logs will remain in conversations.", "سيتم حذف بيانات المستخدم. ستبقى سجلات الدردشة."), tr("Delete", "حذف"), tr("Cancel", "إلغاء"))) {
      await smartRemove(`users/${uid}`);
      swalSuccess(tr("User deleted", "تم حذف المستخدم"));
    }
  };

  // ── Broadcast helpers ─────────────────────────────────────────
  const sendBroadcast = async () => {
    if (!newBroadcast.title || !newBroadcast.message) return;
    setSendingBroadcast(true);
    await smartPush("broadcast", { ...newBroadcast, createdAt: Date.now() });
    setNewBroadcast(BLANK_BROADCAST);
    setSendingBroadcast(false);
  };
  const deleteBroadcast = (id: string) => smartRemove(`broadcast/${id}`);

  // ── Reels helpers ─────────────────────────────────────────────
  const createReel = async () => {
    if (!newReel.image || (!newReel.caption && !newReel.captionAr)) return;
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const r = push(ref(db, "reels"));
      const reelId = r.key!;
      
      // Save reel metadata with video URL info
      await smartSet(`reels/${reelId}`, {
        image: newReel.image,
        caption: newReel.caption,
        captionAr: newReel.captionAr,
        likes: 0,
        createdAt: Date.now(),
        authorName: "Admin",
        mediaType: newReel.mediaType,
        videoUrl: newReel.videoUrl || "",
        videoProvider: newReel.videoProvider || "direct",
        videoThumbnail: newReel.videoThumbnail || "",
        chunkCount: newReel.chunkCount || 0,
      });
      
      // If video has chunks (uploaded file), save to IndexedDB and RTDB
      if (newReel.videoChunks && newReel.videoChunks.length > 0) {
        const fullVideo = newReel.videoChunks.join("");
        await saveToIndexedDB(`reel_${reelId}`, fullVideo);
        
        const batchSize = 5;
        for (let i = 0; i < newReel.videoChunks.length; i += batchSize) {
          const batch: Record<string, string> = {};
          const end = Math.min(i + batchSize, newReel.videoChunks.length);
          
          for (let j = i; j < end; j++) {
            batch[`chunk_${j}`] = newReel.videoChunks![j];
          }
          
          await update(chunksRef, batch);
          setUploadProgress(Math.round(((i + batchSize) / newReel.videoChunks!.length) * 90));
        }
      } else if (newReel.mediaType === "video" && newReel.videoUrl && newReel.videoProvider !== "direct") {
        // URL-based video - save to IndexedDB for caching
        await saveToIndexedDB(`reel_${reelId}`, newReel.videoUrl);
      }
      
      setUploadProgress(100);
      swalSuccess(tr("Reel created!", "تم إنشاء المنشور!"));
      setNewReel({ image: "", caption: "", captionAr: "", mediaType: "image", videoUrl: "", videoProvider: undefined, videoThumbnail: "" });
    } catch (err) {
      console.error(err);
      swalError(tr("Failed to create reel", "فشل في إنشاء المنشور"));
    }
    
    setUploading(false);
  };
  const togglePin = (reel: Reel) => smartUpdate(`reels/${reel.id}`, { pinned: !reel.pinned });
  const deleteReel = async (reel: Reel) => { 
    if (await swalConfirm(tr("Delete Post", "حذف المنشور"), tr("Delete this post?", "حذف المنشور؟"), tr("Delete", "حذف"), tr("Cancel", "إلغاء"))) {
      await smartRemove(`reels/${reel.id}`);
      if (reel.chunkCount) {
        await smartRemove(`reelChunks/${reel.id}`);
      }
    }
  };

  // ── API Settings helpers ────────────────────────────────────
  const saveApiSettings = async () => {
    setSavingApiKey(true);
    await smartSet("api-settings", {
      groqKey: apiSettings.groqKey ? (apiSettings.groqKey.startsWith("gsk") ? encryptKey(apiSettings.groqKey) : apiSettings.groqKey) : "",
      aiProvider: apiSettings.aiProvider,
      openaiEndpoint: apiSettings.openaiEndpoint,
      aiEnabled: apiSettings.aiEnabled,
      updatedAt: Date.now(),
    });
    setSavingApiKey(false);
  };

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

  const unreadChats = chats.reduce((s, c) => s + (c.unreadAdmin || 0), 0);

  const TABS: { id: Tab; icon: React.ReactNode; en: string; ar: string; badge?: number }[] = [
    { id: "overview",   icon: <LayoutDashboard size={14}/>, en: "Overview",    ar: "الرئيسية"   },
    { id: "menu",       icon: <Plus size={14}/>,            en: "Menu",        ar: "القائمة"    },
    { id: "users",      icon: <Users size={14}/>,           en: "Users",       ar: "المستخدمين" },
    { id: "chat",       icon: <MessageCircle size={14}/>,  en: "Chat",        ar: "الدردشة",   badge: unreadChats || 0 },
    { id: "reviews",    icon: <Star size={14}/>,           en: "Reviews",     ar: "تقييمات",   badge: feedback.filter((f) => !f.read).length || 0 },
    { id: "reports",    icon: <TrendingUp size={14}/>,    en: "Reports",     ar: "التقارير",  badge: reports.filter((r) => r.status === "pending").length || 0 },
    { id: "broadcast",  icon: <Megaphone size={14}/>,      en: "Broadcast",   ar: "إشعارات"    },
    { id: "reels",      icon: <Film size={14}/>,           en: "Reels",       ar: "ريلز"       },
    { id: "ai",         icon: <Bot size={14}/>,             en: "AI Assistant", ar: "المساعد الذكي" },
    { id: "api",        icon: <Key size={14}/>,            en: "Egytronic",   ar: "إيچترونيك" },
    { id: "system",     icon: <Settings size={14}/>,       en: "System",      ar: "النظام"     },
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


        {/* ━━━ MENU MANAGEMENT ━━━ */}
        {tab === "menu" && (
          <div className="space-y-4 page-enter">
            <div className="card-elevated rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Plus size={18} className="text-primary"/> {tr("Menu Management","إدارة القائمة")}
                </h3>
                <button
                  onClick={() => {
                    const id = prompt("Item ID (e.g. espresso_1):");
                    if (!id) return;
                    smartSet(`menu/items/${id}`, {
                      name: "New Item", nameAr: "صنف جديد", price: 50, category: "coffee", available: true, image: "", description: "", ingredients: ""
                    });
                  }}
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-bold"
                >
                  {tr("Add Item", "إضافة صنف")}
                </button>
              </div>

              <div className="space-y-4">
                {menu.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">{tr("No menu items found.","لا توجد عناصر في القائمة.")}</p>
                    <button
                      onClick={async () => {
                        const { fullMenuData } = await import("@/lib/fullMenu");
                        await smartSet("menu", fullMenuData);
                        swalSuccess(tr("Menu data restored!","تم استعادة بيانات القائمة!"));
                      }}
                      className="mt-3 text-primary text-xs font-bold underline"
                    >
                      {tr("Restore default menu data","استعادة القائمة الافتراضية")}
                    </button>
                  </div>
                )}
                {menu.map((item) => (
                  <div key={item.id} className="card rounded-2xl p-4 border border-border/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Name (EN)","الاسم إنجليزي")}</label>
                            <input className={inp} value={item.name} onChange={e => smartUpdate(`menu/items/${item.id}`, { name: e.target.value })}/>
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Name (AR)","الاسم عربي")}</label>
                            <input className={inp} dir="rtl" value={item.nameAr} onChange={e => smartUpdate(`menu/items/${item.id}`, { nameAr: e.target.value })}/>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Price","السعر")}</label>
                            <input type="number" className={inp} value={item.price} onChange={e => smartUpdate(`menu/items/${item.id}`, { price: Number(e.target.value) })}/>
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Category","الفئة")}</label>
                            <input className={inp} value={item.category} onChange={e => smartUpdate(`menu/items/${item.id}`, { category: e.target.value })}/>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => smartUpdate(`menu/items/${item.id}`, { available: !item.available })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${item.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                          >
                            {item.available ? tr("Available", "متاح") : tr("Sold Out", "نفذ")}
                          </button>
                          <button
                            onClick={async () => {
                              if (await swalConfirm("Delete Item?", "Are you sure?", "Delete", "Cancel")) {
                                smartRemove(`menu/items/${item.id}`);
                              }
                            }}
                            className="p-1.5 text-destructive/50 hover:text-destructive ml-auto"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Image URL","رابط الصورة")}</label>
                          <div className="flex gap-2">
                            <input className={inp} value={item.image} onChange={e => smartUpdate(`menu/items/${item.id}`, { image: e.target.value })}/>
                            {item.image && <img src={item.image} className="w-10 h-10 rounded-lg object-cover" />}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Ingredients (EN)","المكونات (EN)")}</label>
                            <textarea className={`${inp} min-h-[60px] resize-none text-[11px]`} value={item.ingredients || ""} onChange={e => smartUpdate(`menu/items/${item.id}`, { ingredients: e.target.value })} placeholder="Coffee, Milk..."/>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Ingredients (AR)","المكونات (AR)")}</label>
                            <textarea className={`${inp} min-h-[60px] resize-none text-[11px]`} dir="rtl" value={item.ingredientsAr || ""} onChange={e => smartUpdate(`menu/items/${item.id}`, { ingredientsAr: e.target.value })} placeholder="قهوة، حليب..."/>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ━━━ OVERVIEW ━━━ */}
        {tab === "overview" && (
          <div className="space-y-4 page-enter">
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: "👥", label: tr("Total Users","إجمالي المستخدمين"), value: users.length },
                { emoji: "💬", label: tr("Unread Messages","رسائل جديدة"), value: unreadChats },
                { emoji: "⭐", label: tr("New Reviews","تقييمات جديدة"), value: feedback.filter((f)=>!f.read).length },
              ].map((s) => (
                <div key={s.label} className="card-elevated rounded-2xl p-4 text-center">
                  <p className="text-2xl mb-1">{s.emoji}</p>
                  <p className="text-2xl font-extrabold text-primary leading-tight">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <h2 className="font-bold text-sm text-foreground">{tr("Recent User Activity","نشاط المستخدمين الأخير")}</h2>
            <div className="space-y-2">
              {users.slice(0, 8).map((u) => (
                <div key={u.uid} className="card rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {u.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{u.name || "Unknown Name"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.loginCount || 0} logins · Table {u.tableNumber || "N/A"}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "—"}
                  </span>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">{tr("No users yet","لا يوجد مستخدمين بعد")}</p>
              )}
            </div>
          </div>
        )}

        {/* ━━━ USERS ━━━ */}
        {tab === "users" && (
          <div className="space-y-4 page-enter">
            <div className="card-elevated rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Users size={18} className="text-primary"/> {tr("User Management","إدارة المستخدمين")}
                </h3>
                <span className="badge bg-primary/10 text-primary font-bold">{users.length}</span>
              </div>

              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.uid} className="card rounded-2xl p-4 border border-border/50 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xl font-black shadow-lg">
                        {u.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-foreground">{u.name || "Unknown Name"}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              Table {u.tableNumber || "N/A"}
                            </span>
                            <button onClick={() => deleteUser(u.uid, u.name)} className="p-1 text-destructive/50 hover:text-destructive transition-colors">
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {u.loginCount > 1 && (
                            <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md font-bold uppercase">Returning User</span>
                          )}
                          {u.totalUsageSeconds > 1800 && (
                            <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md font-bold uppercase">Heavy User</span>
                          )}
                          <span className="text-[9px] text-muted-foreground/60 font-mono bg-muted/30 px-1 rounded truncate flex-1">{u.uid}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-border/40">
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{tr("Last Active","آخر نشاط")}</p>
                            <p className="text-xs font-semibold text-foreground">
                              {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{tr("Usage Time","وقت الاستخدام")}</p>
                            <p className="text-xs font-semibold text-foreground">{formatDuration(u.totalUsageSeconds || 0)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{tr("Device ID","معرف الجهاز")}</p>
                            <p className="text-xs font-mono text-muted-foreground truncate" title={u.deviceId}>{u.deviceId || "Unknown"}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{tr("Account Created","تاريخ التسجيل")}</p>
                            <p className="text-xs font-semibold text-foreground">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Unknown"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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


        {/* ━━━ USER REPORTS ━━━ */}
        {tab === "reports" && (
          <div className="space-y-3 page-enter">
            <div className="card rounded-xl p-3 bg-red-50 border border-red-200">
              <p className="text-xs text-red-800 font-semibold">📋 {tr("Customer reports and feedback about issues with the restaurant.","تقارير العملاء وم反馈 حول مشاكل المطعم")}</p>
            </div>
            {reports.length === 0 && (
              <div className="text-center py-12"><AlertTriangle size={40} className="mx-auto text-muted-foreground/25 mb-2"/><p className="text-muted-foreground text-sm">{tr("No reports yet","لا يوجد تقارير")}</p></div>
            )}
            {reports.map((report) => (
              <div key={report.id} className="card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-foreground">{tr("Issue Report","بلاغ")}</span>
                      <span className={`badge px-2 py-0.5 ${report.status==="resolved"?"status-ready":report.status==="declined"?"status-cancelled":"status-pending"}`}>
                        {report.status === "resolved" ? tr("Resolved","تم الحل") : report.status === "declined" ? tr("Dismissed","مرفوض") : tr("Pending","انتظار")}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{report.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{tr("From","من")} {report.userName || "Guest"} · {new Date(report.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {report.status === "pending" && (
                  <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                    <button onClick={() => updateReportStatus(report.id, "resolved")} className="flex-1 py-2 rounded-xl text-xs font-bold status-ready flex items-center justify-center gap-1">
                      <CheckCircle size={12}/> {tr("Resolve","تم الحل")}
                    </button>
                    <button onClick={() => updateReportStatus(report.id, "declined")} className="flex-1 py-2 rounded-xl text-xs font-bold status-cancelled flex items-center justify-center gap-1">
                      <XCircle size={12}/> {tr("Dismiss","رفض")}
                    </button>
                  </div>
                )}
              </div>
            ))}
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

            {/* Homepage Banner Editor */}
            <div className="card-elevated rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Pin size={16} className="text-primary"/> {tr("Homepage Banner","بانر الصفحة الرئيسية")}
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">{tr("Banner Content (HTML allowed)","محتوى البانر (يدعم HTML)")}</label>
                <textarea 
                  rows={3} 
                  className={`${inp} resize-none font-mono text-xs`} 
                  placeholder={tr("e.g. 🎉 Happy Hour! 50% off until 8 PM","مثال: 🎉 ساعة سعيدة! خصم 50% حتي 8 مساءً")}
                  value={bannerContent}
                  onChange={(e) => setBannerContent(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">{tr("HTML tags supported: <b>, <strong>, <a href=...>, <br>, <em>","تدعم: <b>, <strong>, <a href=...>, <br>, <em>")}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{tr("Background Color","لون الخلفية")}</label>
                  <input 
                    type="color" 
                    value={bannerBgColor}
                    onChange={(e) => setBannerBgColor(e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{tr("Text Color","لون النص")}</label>
                  <input 
                    type="color" 
                    value={bannerTextColor}
                    onChange={(e) => setBannerTextColor(e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{tr("Enable","تفعيل")}</span>
                  <button
                    onClick={() => saveBannerEnabled(!bannerEnabled)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${bannerEnabled ? "bg-green-500" : "bg-muted"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${bannerEnabled ? "translate-x-6" : "translate-x-0.5"}`}/>
                  </button>
                </div>
                <button 
                  onClick={saveBanner}
                  disabled={savingBanner}
                  className="btn-primary py-2 px-4 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={14}/> {tr("Save Banner","حفظ البانر")}
                </button>
              </div>
              {bannerPreview && (
                <div 
                  className="p-3 rounded-xl text-center text-sm font-semibold"
                  style={{ background: bannerBgColor, color: bannerTextColor }}
                  dangerouslySetInnerHTML={{ __html: bannerContent }}
                />
              )}
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
            {/* Create New Reel Form */}
            <div className="card-elevated rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Film size={18} className="text-primary"/> {tr("Create New Post","إنشاء منشور جديد")}
              </h3>
              
              <div className="space-y-3">
                {/* Media Type Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewReel({ ...newReel, mediaType: 'image' })}
                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${newReel.mediaType === 'image' ? 'btn-primary' : 'bg-muted'}`}
                  >
                    <ImageIcon size={16} className="inline mr-1"/> {tr("Image","صورة")}
                  </button>
                  <button
                    onClick={() => setNewReel({ ...newReel, mediaType: 'video' })}
                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${newReel.mediaType === 'video' ? 'btn-primary' : 'bg-muted'}`}
                  >
                    <Video size={16} className="inline mr-1"/> {tr("Video","فيديو")}
                  </button>
                </div>

                {/* Image Upload */}
                {newReel.mediaType === 'image' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">{tr("Image URL","رابط الصورة")}</label>
                      <input
                        type="text"
                        className={inp}
                        placeholder={tr("Paste image URL or upload below","الصق رابط الصورة أو ارفع من الأسفل")}
                        value={newReel.image}
                        onChange={(e) => setNewReel({ ...newReel, image: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold">{tr("Or Upload Image","أو ارفع صورة")}</label>
                      <div className="border-2 border-dashed border-muted rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="reel-upload"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploading(true);
                            try {
                              const base64 = await compressToBase64(file);
                              setNewReel({ ...newReel, image: base64 });
                            } catch (err) {
                              console.error(err);
                              swalError(tr("Failed to upload image", "فشل في رفع الصورة"));
                            }
                            setUploading(false);
                          }}
                        />
                        <label htmlFor="reel-upload" className="cursor-pointer">
                          <ImageIcon size={24} className="mx-auto text-muted-foreground mb-2"/>
                          <p className="text-xs text-muted-foreground">
                            {uploading ? tr("Uploading...", "جاري الرفع...") : tr("Click to upload image", "انقر لرفع صورة")}
                          </p>
                          {newReel.image && newReel.image.startsWith("data:") && (
                            <img src={newReel.image} className="w-16 h-16 object-cover rounded-lg mx-auto mt-2"/>
                          )}
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* Video URL Input - supports YouTube, Instagram, Facebook, Google Drive, Direct URLs */}
                {newReel.mediaType === 'video' && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold">{tr("Video URL","رابط الفيديو")}</label>
                    
                    {/* URL Input */}
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder={tr("Paste video URL here...", "الصق رابط الفيديو هنا...")}
                        className={`${inp} flex-1`}
                        value={newReel.videoUrl}
                        onChange={(e) => {
                          const url = e.target.value;
                          setNewReel({ ...newReel, videoUrl: url });
                          
                          // Auto-parse URL
                          if (url) {
                            const parsed = parseVideoUrl(url);
                            setNewReel(prev => ({
                              ...prev,
                              videoUrl: url,
                              videoProvider: parsed.provider,
                              videoThumbnail: parsed.thumbnail,
                              image: parsed.thumbnail || prev.image,
                            }));
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (!newReel.videoUrl) return;
                          const parsed = parseVideoUrl(newReel.videoUrl);
                          setNewReel(prev => ({
                            ...prev,
                            videoProvider: parsed.provider,
                            videoThumbnail: parsed.thumbnail,
                            image: parsed.thumbnail || prev.image,
                          }));
                        }}
                        className="px-4 py-2 bg-primary text-white rounded-xl font-semibold"
                      >
                        <CheckCircle size={18} />
                      </button>
                    </div>
                    
                    {/* Provider Detection */}
                    {newReel.videoProvider && (
                      <div className="flex items-center gap-2 text-sm">
                        <span>{getProviderIcon(newReel.videoProvider)}</span>
                        <span className="text-muted-foreground">{getProviderName(newReel.videoProvider)}</span>
                        {newReel.videoProvider === "unknown" && (
                          <span className="text-amber-500 text-xs">{tr("Direct URL will be used as-is", "سيتم استخدام الرابط المباشر كما هو")}</span>
                        )}
                      </div>
                    )}
                    
                    {/* Thumbnail Preview */}
                    {newReel.videoThumbnail && (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden bg-muted">
                        <img src={newReel.videoThumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded-lg">
                          {getProviderIcon(newReel.videoProvider!)} {getProviderName(newReel.videoProvider!)}
                        </span>
                      </div>
                    )}
                    
                    {/* Quick Links */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{tr("Supported platforms:", "المنصات المدعومة:")}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-muted rounded-lg">▶️ YouTube</span>
                        <span className="text-xs px-2 py-1 bg-muted rounded-lg">📸 Instagram Reels</span>
                        <span className="text-xs px-2 py-1 bg-muted rounded-lg">👤 Facebook</span>
                        <span className="text-xs px-2 py-1 bg-muted rounded-lg">📁 Google Drive</span>
                        <span className="text-xs px-2 py-1 bg-muted rounded-lg">🎬 Direct MP4</span>
                      </div>
                    </div>
                    
                    {/* Direct Upload Alternative */}
                    <details className="group">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                        {tr("Or upload a video file instead...", "أو ارفع ملف فيديو بدلاً من ذلك...")}
                      </summary>
                      <div className="mt-2 border-2 border-dashed border-muted rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          id="reel-video-upload"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            const maxSize = 100 * 1024 * 1024;
                            if (file.size > maxSize) {
                              swalError(tr("Video too large. Max 100MB.", "الفيديو كبير جداً. الحد الأقصى 100 ميجابايت."));
                              return;
                            }
                            
                            setUploading(true);
                            setUploadProgress(0);
                            
                            try {
                              if (file.size <= 10 * 1024 * 1024) {
                                const base64 = await new Promise<string>((resolve, reject) => {
                                  const reader = new FileReader();
                                  reader.onload = () => resolve(reader.result as string);
                                  reader.onerror = reject;
                                  reader.readAsDataURL(file);
                                });
                                setNewReel({ ...newReel, videoUrl: base64, image: base64, videoProvider: "direct" });
                              } else {
                                swalLoading(tr("Processing large video...", "جاري معالجة الفيديو الكبير..."));
                                const chunks = await fileToChunks(file, (progress) => setUploadProgress(progress));
                                const sizeMB = getChunksSizeMB(chunks);
                                swalClose();
                                
                                if (sizeMB > 100) {
                                  swalError(tr("Video too large after processing. Max 100MB.", "الفيديو كبير جداً بعد المعالجة. الحد الأقصى 100 ميجابايت."));
                                  setUploading(false);
                                  return;
                                }
                                
                                setNewReel({ 
                                  ...newReel, 
                                  videoUrl: chunks[0],
                                  image: chunks[0],
                                  videoProvider: "direct",
                                  videoChunks: chunks,
                                  chunkCount: chunks.length
                                });
                              }
                              setUploadProgress(100);
                            } catch (err) {
                              console.error(err);
                              swalError(tr("Failed to upload video", "فشل في رفع الفيديو"));
                            }
                            setUploading(false);
                          }}
                        />
                        <label htmlFor="reel-video-upload" className="cursor-pointer">
                          <Video size={24} className="mx-auto text-muted-foreground mb-2"/>
                          <p className="text-xs text-muted-foreground">
                            {uploading ? `${tr("Processing...", "جاري المعالجة...")} ${uploadProgress}%` : tr("Click to upload video (max 100MB)", "انقر لرفع فيديو (حد أقصى 100 ميجابايت)")}
                          </p>
                        </label>
                      </div>
                    </details>
                  </div>
                )}

                {/* English Caption */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">{tr("Caption (English)","الوصف (إنجليزي)")}</label>
                  <textarea
                    className={`${inp} min-h-[60px] resize-none`}
                    placeholder={tr("Write caption in English...","اكتب الوصف بالإنجليزية...")}
                    value={newReel.caption}
                    onChange={(e) => setNewReel({ ...newReel, caption: e.target.value })}
                  />
                </div>

                {/* Arabic Caption */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">{tr("Caption (Arabic)","الوصف (عربي)")}</label>
                  <textarea
                    className={`${inp} min-h-[60px] resize-none`}
                    placeholder={tr("اكتب الوصف بالعربية...","اكتب الوصف بالعربية...")}
                    value={newReel.captionAr}
                    onChange={(e) => setNewReel({ ...newReel, captionAr: e.target.value })}
                    dir="rtl"
                  />
                </div>

                {/* Create Button */}
                <button
                  onClick={createReel}
                  disabled={!newReel.image || (!newReel.caption && !newReel.captionAr)}
                  className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus size={16}/> {tr("Create Post","إنشاء المنشور")}
                </button>
              </div>
            </div>

            {/* Existing Reels */}
            <div className="card-elevated rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-foreground">{tr("Manage Posts","إدارة المنشورات")}</h3>
              {reels.length === 0 && (
                <div className="text-center py-8"><Film size={40} className="mx-auto text-muted-foreground/25 mb-2"/><p className="text-muted-foreground text-sm">{tr("No posts yet","لا يوجد منشورات بعد")}</p></div>
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
          </div>
        )}

        {/* ━━━ API SETTINGS ━━━ */}
        {tab === "api" && (
          <div className="space-y-4 page-enter">
            <div className="card-elevated rounded-2xl p-5 space-y-5">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Key size={18} className="text-primary"/> {tr("AI Provider Settings","إعدادات مزود الذكاء")}
              </h3>

              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">{tr("AI Provider","مزود الذكاء")}</label>
                <select
                  className={inp}
                  value={apiSettings.aiProvider}
                  onChange={(e) => setApiSettings(p => ({...p, aiProvider: e.target.value as any}))}
                >
                  <option value="groq">Groq (Llama 3.3)</option>
                  <option value="pollinations">Pollinations (Free)</option>
                  <option value="openai">OpenAI Compatible</option>
                </select>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  {apiSettings.aiProvider === "openai" ? tr("API Key", "مفتاح API") : tr("Groq API Key","مفتاح API Groq")}
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      className={`${inp} w-full pr-10`}
                      placeholder={apiSettings.aiProvider === "pollinations" ? "Not required" : "sk-... / gsk_..."}
                      value={apiSettings.groqKey}
                      onChange={(e) => setApiSettings((p) => ({...p, groqKey: e.target.value}))}
                      disabled={apiSettings.aiProvider === "pollinations"}
                    />
                    <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showApiKey ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
              </div>

              {apiSettings.aiProvider === "openai" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">{tr("API Endpoint", "نقطة اتصال API")}</label>
                  <input
                    type="text"
                    className={inp}
                    placeholder="https://api.openai.com/v1"
                    value={apiSettings.openaiEndpoint}
                    onChange={(e) => setApiSettings(p => ({...p, openaiEndpoint: e.target.value}))}
                  />
                </div>
              )}

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
                  <div className={`w-2 h-2 rounded-full ${apiSettings.groqKey ? "bg-green-500" : "bg-amber-500"}`}/>
                  <span className="text-xs font-medium">
                    {apiSettings.groqKey ? tr("Groq API configured","تم إعداد مفتاح Groq") : tr("Groq API not configured","لم يتم إعداد مفتاح Groq")}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {tr("The AI service uses Groq Llama 3.3 and Pollinations for text/voice.","تستخدم خدمة الذكاء جروك Llama 3.3 وبولينيشن للنصوص والصوت.")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ━━━ SYSTEM TAB ━━━ */}
        {tab === "system" && (
          <SystemTab tr={tr} db={db} ref={ref} set={set} remove={remove} push={push} get={get} lang={lang} />
        )}


        {/* ━━━ AI ASSISTANT ━━━ */}
        {tab === "ai" && (
          <div className="page-enter">
            <AIAdminAssistant />
          </div>
        )}
      </div>
    </div>
  );
}

// System Management Component
function SystemTab({ tr, db, ref, set, remove, push, get, lang }: {
  tr: (en: string, ar: string) => string;
  db: any; ref: any; set: any; remove: any; push: any; get: any; lang: string;
}) {
  const [backups, setBackups] = useState<{ id: string; name: string; date: number; size: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [r2Loading, setR2Loading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>("");

  // Load backups list
  useEffect(() => {
    const unsub = onValue(ref(db, "backups"), (snap) => {
      if (snap.exists()) {
        const data = snap.val() as Record<string, any>;
        const list = Object.entries(data).map(([id, v]: [string, any]) => ({
          id,
          name: v.name || "Backup",
          date: v.createdAt || Date.now(),
          size: v.size || "0 KB",
        }));
        setBackups(list.sort((a, b) => b.date - a.date));
      } else {
        setBackups([]);
      }
    });
    return () => unsub();
  }, [db, ref]);

  const createBackup = async () => {
    setLoading(true);
    try {
      const snapshot: Record<string, any> = {};
      
      // Collect all data
      const paths = ["menu", "users", "ai-config", "api-settings", "broadcast", "reels", "feedback", "homepage-banner"];
      for (const path of paths) {
        const data = await smartGet(path);
        if (data) snapshot[path] = data;
      }

      const backupData = {
        data: snapshot,
        createdAt: Date.now(),
        name: `Backup ${new Date().toLocaleString()}`,
        size: `${Math.round(JSON.stringify(snapshot).length / 1024)} KB`,
      };

      // Save to Firebase/R2
      await smartPush("backups", backupData);

      // Download to device
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `azura-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      swalSuccess(tr("Backup created and downloaded!", "تم إنشاء النسخة الاحتياطية وت تحميلها!"));
    } catch (err) {
      console.error(err);
      swalError(tr("Failed to create backup", "فشل في إنشاء النسخة الاحتياطية"));
    }
    setLoading(false);
  };

  const restoreBackup = async (backupId: string) => {
    if (!await swalConfirm(tr("Restore Backup", "استعادة النسخة"), tr("Restore this backup? Current data will be overwritten.", "استعادة هذه النسخة؟ البيانات الحالية سيتم استبدالها."), tr("Restore", "استعادة"), tr("Cancel", "إلغاء"))) return;
    
    setLoading(true);
    try {
      const data = await smartGet(`backups/${backupId}/data`);
      if (!data) throw new Error("Backup not found");
      
      // Restore each path
      for (const [path, content] of Object.entries(data)) {
        await smartSet(path, content);
      }

      swalSuccess(tr("Backup restored successfully!", "تم استعادة النسخة بنجاح!"));
    } catch (err) {
      console.error(err);
      swalError(tr("Failed to restore backup", "فشل في استعادة النسخة"));
    }
    setLoading(false);
  };

  const resetSystem = async () => {
    setLoading(true);
    try {
      // Create final backup before reset
      await createBackup();

      // Clear all data paths
      const paths = [
        "menu", "users", "ai-config", "api-settings",
        "broadcast", "reels", "feedback", "conversations",
        "notifications", "homepage-banner", "backups"
      ];
      for (const path of paths) {
        await smartRemove(path);
      }

      swalSuccess(tr("System reset complete! A backup was saved to your device.", "تم إعادة تعيين النظام! تم حفظ نسخة احتياطية على جهازك."));
    } catch (err) {
      console.error(err);
      swalError(tr("Failed to reset system", "فشل في إعادة تعيين النظام"));
    }
    setLoading(false);
    setShowConfirm(false);
  };

  const deleteBackup = async (id: string) => {
    if (!await swalConfirm(tr("Delete Backup", "حذف النسخة"), tr("Delete this backup?", "حذف هذه النسخة؟"), tr("Delete", "حذف"), tr("Cancel", "إلغاء"))) return;
    await smartRemove(`backups/${id}`);
  };

  // R2 Config State
  const [r2Config, setR2Config] = useState<R2Config>({
    endpoint: "",
    accessKey: "",
    secretKey: "",
    bucket: ""
  });

  useEffect(() => {
    smartGet("r2-config").then(cfg => {
      if (cfg) setR2Config(cfg);
    });
  }, []);

  const handleSaveR2 = async () => {
    setR2Loading(true);
    try {
      await smartSet("r2-config", r2Config);
      swalSuccess(tr("R2 Config Saved", "تم حفظ إعدادات R2"));
    } catch (e) {
      swalError(tr("Save failed", "فشل الحفظ"));
    }
    setR2Loading(false);
  };

  const handleTestR2 = async () => {
    setR2Loading(true);
    try {
      await testR2Connection(r2Config);
      swalSuccess(tr("R2 Connection Successful!", "تم الاتصال بـ R2 بنجاح!"));
    } catch (e) {
      swalError(tr("R2 Connection Failed", "فشل الاتصال بـ R2"));
    }
    setR2Loading(false);
  };

  const handleGlobalSync = async () => {
    if (!await swalConfirm(tr("Global Sync", "مزامنة شاملة"), tr("This will push all R2 data back to Firebase. Existing Firebase data will be overwritten.", "سيتم رفع كافة بيانات R2 إلى Firebase. سيتم استبدال البيانات الحالية."), tr("Sync Now", "مزامنة الآن"), tr("Cancel", "إلغاء"))) return;

    setLoading(true);
    try {
      const objects = await listR2Objects();
      for (const obj of objects) {
        if (!obj.Key?.endsWith(".json")) continue;
        const data = await downloadFromR2(obj.Key);
        const path = obj.Key.replace(".json", "");
        await set(ref(db, path), data);
      }
      swalSuccess(tr("Global Sync Complete!", "تمت المزامنة الشاملة بنجاح!"));
    } catch (e) {
      console.error(e);
      swalError(tr("Sync failed", "فشلت المزامنة"));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Fallback Mode Indicator */}
      {getDBMode() === "r2" && (
        <div className="card rounded-2xl p-4 bg-red-500 text-white flex items-center justify-between shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20}/>
            <div>
              <p className="font-bold text-sm">{tr("OFFLINE FALLBACK MODE ACTIVE", "وضع الطوارئ (R2) مفعّل")}</p>
              <p className="text-[10px] opacity-80">{tr("Firebase is unavailable. Changes are being saved to R2.", "Firebase غير متاح. يتم حفظ التغييرات على R2.")}</p>
            </div>
          </div>
          <button onClick={() => setDBMode("firebase")} className="px-3 py-1 bg-white text-red-600 rounded-lg text-xs font-bold">
            {tr("Try Reconnect", "إعادة الاتصال")}
          </button>
        </div>
      )}

      {/* R2 Configuration Section */}
      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <UploadCloud size={18} className="text-primary"/> {tr("R2 Fallback Config (S3)","إعدادات الطوارئ R2")}
        </h3>
        <p className="text-xs text-muted-foreground">{tr("Configure Cloudflare R2 or any S3-compatible storage for automated admin fallback.", "قم بتهيئة R2 أو أي مخزن S3 لوضع الطوارئ التلقائي للأدمن.")}</p>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Endpoint","نقطة الاتصال")}</label>
            <input className="input-field px-3 py-2 text-sm" placeholder="https://<id>.r2.cloudflarestorage.com" value={r2Config.endpoint} onChange={e => setR2Config({...r2Config, endpoint: e.target.value})}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Access Key","مفتاح الوصول")}</label>
              <input className="input-field px-3 py-2 text-sm" type="password" value={r2Config.accessKey} onChange={e => setR2Config({...r2Config, accessKey: e.target.value})}/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Secret Key","المفتاح السري")}</label>
              <input className="input-field px-3 py-2 text-sm" type="password" value={r2Config.secretKey} onChange={e => setR2Config({...r2Config, secretKey: e.target.value})}/>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Bucket Name","اسم الباكت")}</label>
            <input className="input-field px-3 py-2 text-sm" value={r2Config.bucket} onChange={e => setR2Config({...r2Config, bucket: e.target.value})}/>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleTestR2} disabled={r2Loading} className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-2">
              <Eye size={14}/> {tr("Test Connection", "فحص الاتصال")}
            </button>
            <button onClick={handleSaveR2} disabled={r2Loading} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg">
              <Save size={14}/> {tr("Save Config", "حفظ الإعدادات")}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-border/40">
          <button onClick={handleGlobalSync} disabled={loading} className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-200">
            <RotateCcw size={16}/> {tr("Global Sync: R2 → Firebase", "مزامنة شاملة: من R2 إلى Firebase")}
          </button>
        </div>
      </div>

      {/* Backup Section */}
      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Archive size={18} className="text-primary"/> {tr("Backup & Restore","النسخ الاحتياطي والاستعادة")}
        </h3>

        <button onClick={createBackup} disabled={loading}
          className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2">
          <Download size={16}/> {loading ? tr("Creating...", "جاري الإنشاء...") : tr("Create New Backup","إنشاء نسخة احتياطية جديدة")}
        </button>

        <div className="space-y-2">
          <p className="text-sm font-semibold">{tr("Available Backups","النسخ الاحتياطية المتاحة")}</p>
          {backups.length === 0 && (
            <p className="text-muted-foreground text-sm">{tr("No backups yet","لا توجد نسخ احتياطية بعد")}</p>
          )}
          {backups.map((b) => (
            <div key={b.id} className="card rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{b.name}</p>
                <p className="text-xs text-muted-foreground">{new Date(b.date).toLocaleString()} • {b.size}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => restoreBackup(b.id)} className="btn-ghost text-primary px-3 py-1 rounded-lg text-sm">
                  <UploadCloud size={14}/> {tr("Restore","استعادة")}
                </button>
                <button onClick={() => deleteBackup(b.id)} className="btn-ghost text-destructive px-3 py-1 rounded-lg text-sm">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Reset System */}
      <div className="card-elevated rounded-2xl p-5 space-y-4 border-2 border-destructive/20">
        <h3 className="font-bold text-destructive flex items-center gap-2">
          <RotateCcw size={18}/> {tr("Reset System","إعادة تعيين النظام")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {tr("This will delete all app data (menu, users, etc.) and create a backup first.", "سيتم حذف جميع البيانات (القائمة، المستخدمين، إلخ) وإنشاء نسخة احتياطية أولاً.")}
        </p>
        <button onClick={() => { setShowConfirm(true); setConfirmAction("reset"); }}
          className="w-full py-3 rounded-xl bg-destructive text-white font-bold flex items-center justify-center gap-2 hover:bg-destructive/90">
          <RotateCcw size={16}/> {tr("Reset Everything","إعادة تعيين كل شيء")}
        </button>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card-elevated rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-bold text-lg text-destructive">{tr("Confirm Action","تأكيد العملية")}</h3>
            <p className="text-sm">{tr("Are you sure? This action cannot be undone.","هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.")}</p>
            <div className="flex gap-3">
              <button onClick={() => { if (confirmAction === "reset") resetSystem(); setShowConfirm(false); }}
                className="flex-1 py-2 rounded-xl bg-destructive text-white font-bold">
                {tr("Yes, Reset","نعم، أعيد التعيين")}
              </button>
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-muted font-bold">
                {tr("Cancel","إلغاء")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
