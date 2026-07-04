import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import { db, ref, onValue, off, update, set, push, remove, get, forceReseedMenu, mergeMenuIngredients } from "@/lib/firebase";
import { smartGet, smartSet, smartUpdate, smartRemove, smartPush, getDBMode, setDBMode, onModeChange } from "@/lib/dbWrapper";
import { testR2Connection, type R2Config, listR2Objects, downloadFromR2, uploadToR2 } from "@/lib/r2";
import { useLang } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { encryptKey } from "@/lib/crypto";
import { swalSuccess, swalError, swalConfirm } from "@/lib/swal";
import {
  ShieldCheck, ArrowLeft, Plus, Trash2,
  Megaphone, Film, Key, Settings,
  RotateCcw, Save,
  AlertTriangle, Bot, LayoutDashboard, Users, ToggleRight, LayoutGrid,
  MessageCircle, Star,
} from "lucide-react";

import { VideoProvider } from "@/lib/videoProviders";
import { saveToIndexedDB } from "@/lib/chunkedVideo";
import { SystemTab } from "./admin/tabs/SystemTab";
import { MenuItem, ChatSession, ChatMsg, Feedback, Broadcast, Reel } from "./admin/types";
import { OverviewTab } from "./admin/tabs/OverviewTab";
import { MenuTab } from "./admin/tabs/MenuTab";
import { FeaturesTab } from "./admin/tabs/FeaturesTab";
import { UsersTab } from "./admin/tabs/UsersTab";
import { ChatTab } from "./admin/tabs/ChatTab";
import { ReviewsTab } from "./admin/tabs/ReviewsTab";
import { BroadcastTab } from "./admin/tabs/BroadcastTab";
import { ReelsTab } from "./admin/tabs/ReelsTab";
import { ApiTab } from "./admin/tabs/ApiTab";
import { TablesTab } from "./admin/tabs/TablesTab";

const AIAdminAssistant = lazy(() => import("@/components/AIAdminAssistant"));

const ADMIN_PIN = "azura2026";

type Tab = "overview" | "menu" | "users" | "chat" | "reviews" | "broadcast" | "reels" | "api" | "system" | "ai" | "features" | "tables";

const BLANK_BROADCAST = { title: "", titleAr: "", message: "", messageAr: "", type: "info" as const, emoji: "📢" };

export default function Admin() {
  const { lang, isRTL } = useLang();
  const [, navigate] = useLocation();
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("azura-admin") === "true");
  const [pinErr, setPinErr] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [dbMode, setDbModeState] = useState(getDBMode());

  useEffect(() => {
    const unsub = onModeChange(() => setDbModeState(getDBMode()));
    return () => { unsub(); };
  }, []);

  // Data
  const [menu, setMenu]           = useState<MenuItem[]>([]);
  const [users, setUsers]         = useState<any[]>([]);
  const [chats, setChats]         = useState<ChatSession[]>([]);
  const [feedback, setFeedback]   = useState<Feedback[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [reels, setReels]         = useState<Reel[]>([]);
  const [tablesRaw, setTablesRaw] = useState<any[]>([]);

  // Chat
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMsgs, setChatMsgs]         = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput]       = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Add Item inline form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", nameAr: "", price: "", category: "coffee",
    image: "", description: "", descriptionAr: "",
    ingredients: "", ingredientsAr: "", available: true,
  });
  const [savingItem, setSavingItem] = useState(false);

  const MENU_CATEGORIES = [
    "recommended", "new_items", "soups", "appetizers", "salads", "pasta", "tortilla", "toast", "croissant", "breakfast", "main_dishes", "burgers", "smash_burgers", "fried_chicken", "hot_drinks", "coffee", "corto", "hot_chocolate", "sahlab", "frappuccino", "iced_coffee", "mojitos", "boba_tea", "fresh_juices", "cocktails", "smoothies", "milkshakes", "waffle", "desserts", "crepes", "pancakes", "add_ons", "shisha", "soft_drinks"
  ];

  const CAT_META: Record<string, { emoji: string; en: string; ar: string }> = {
    recommended:      { emoji: "⭐",  en: "Top Picks",           ar: "الأفضل"          },
    new_items:        { emoji: "🆕",  en: "New",                 ar: "جديد"            },
    soups:            { emoji: "🍲",  en: "Soup",                ar: "شوربة"           },
    appetizers:       { emoji: "🍟",  en: "Appetizers",         ar: "مقبلات"          },
    salads:           { emoji: "🥗",  en: "Salads",              ar: "سلطات"           },
    pasta:            { emoji: "🍝",  en: "Pasta",               ar: "مكرونة"          },
    tortilla:         { emoji: "🌯",  en: "Tortilla",            ar: "تورتيلا"         },
    toast:            { emoji: "🍞",  en: "Toast",                ar: "توست"            },
    croissant:        { emoji: "🥐",  en: "Croissant",            ar: "كرواسون"         },
    breakfast:        { emoji: "🍳",  en: "Breakfast",            ar: "فطور"            },
    main_dishes:      { emoji: "🍽️",  en: "Main Dishes",         ar: "أطباق رئيسية"     },
    burgers:          { emoji: "🍔",  en: "Burgers",             ar: "برجر"            },
    smash_burgers:    { emoji: "🔥",  en: "Smash Burgers",       ar: "سماش برجر"       },
    fried_chicken:    { emoji: "🍗",  en: "Fried Chicken",      ar: "فراخ مقلية"      },
    hot_drinks:       { emoji: "☕",  en: "Hot Drinks",          ar: "مشروبات ساخنة"   },
    coffee:           { emoji: "☕",  en: "Coffee",              ar: "قهوة"            },
    corto:            { emoji: "🥛",  en: "Corto",               ar: "كورتو"           },
    hot_chocolate:    { emoji: "🍫",  en: "Hot Chocolate",       ar: "شوكولاتة ساخنة"  },
    sahlab:           { emoji: "🥛",  en: "Sahlab",               ar: "سحلب"            },
    frappuccino:      { emoji: "🧊",  en: "Frappuccino",        ar: "فرابتشينو"       },
    iced_coffee:      { emoji: "🧋",  en: "Iced Coffee",        ar: "قهوة مثلجة"      },
    mojitos:          { emoji: "🍹",  en: "Mojitos",             ar: "موجيتو"          },
    boba_tea:         { emoji: "🧋",  en: "Boba Tea",            ar: "بوبا تي"         },
    fresh_juices:     { emoji: "🍊",  en: "Fresh Juices",        ar: "عصائر طازجة"     },
    cocktails:        { emoji: "🍸",  en: "Cocktails",           ar: "كوكتيل"          },
    smoothies:        { emoji: "🥤",  en: "Smoothies",           ar: "سموذي"           },
    milkshakes:       { emoji: "🥛",  en: "Milkshakes",          ar: "ميلك شيك"        },
    waffle:           { emoji: "🧇",  en: "Waffle",               ar: "وافل"            },
    desserts:         { emoji: "🍰",  en: "Desserts",             ar: "حلويات"          },
    crepes:           { emoji: "🥞",  en: "Crepes",               ar: "كريب"            },
    pancakes:         { emoji: "🥞",  en: "Pancakes",             ar: "بان كيك"         },
    add_ons:          { emoji: "➕",  en: "Add-ons",              ar: "إضافات"          },
    shisha:           { emoji: "💨",  en: "Hookah",                ar: "شيشة"            },
    soft_drinks:      { emoji: "🥤",  en: "Soft Drinks",          ar: "مشروبات غازية"   },
  };

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

  // Feature flags
  const [featureFlags, setFeatureFlags] = useState({
    baristaEnabled: true,
    reelsEnabled: true,
    supportEnabled: true,
  });
  const [savingFlag, setSavingFlag] = useState<string | null>(null);

  // User search
  const [userSearch, setUserSearch] = useState("");

  const activeTables = useMemo(() => {
    const tables = tablesRaw.map(t => {
      const userCount = users.filter(u => u.tableNumber === t.number).length;
      return {
        id: t.id,
        number: t.number,
        status: userCount > 0 ? "occupied" : "available",
        userCount,
        lastAt: t.lastAssigned || null
      };
    });
    return tables.sort((a, b) => a.number - b.number);
  }, [tablesRaw, users]);

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

  // Load feature flags from Firebase
  useEffect(() => {
    if (!authed) return;
    const ffRef = ref(db, "feature-flags");
    onValue(ffRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setFeatureFlags({
          baristaEnabled: data.baristaEnabled !== false,
          reelsEnabled: data.reelsEnabled !== false,
          supportEnabled: data.supportEnabled !== false,
        });
      }
    });
    return () => off(ref(db, "feature-flags"));
  }, [authed]);

  const toggleFeatureFlag = async (key: string, value: boolean) => {
    setSavingFlag(key);
    try {
      await update(ref(db, "feature-flags"), { [key]: value });
      setFeatureFlags(prev => ({ ...prev, [key]: value }));
    } catch (e) {
      swalError(tr("Failed to update setting", "فشل تحديث الإعداد"));
    }
    setSavingFlag(null);
  };

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

    // Tables
    onValue(ref(db, "tables"), (snap) => {
      if (!snap.exists()) { setTablesRaw([]); return; }
      const data = snap.val() as Record<string, any>;
      const list = Object.entries(data).map(([id, t]: [string, any]) => ({ id, ...t }));
      setTablesRaw(list);
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
      ["menu","users","feedback","support-chat","broadcast","reels","api-settings","tables"].forEach((p) => off(ref(db, p)));
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
    else setPinErr(tr("Wrong PIN. Try: azura2026", "PIN خاطئ. جرب: azura2026"));
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


  const deleteUser = async (uid: string, name: string) => {
    if (await swalConfirm(tr(`Delete User ${name}?`, `حذف المستخدم ${name}؟`), tr("This will remove all user data. Chat logs will remain in conversations.", "سيتم حذف بيانات المستخدم. ستبقى سجلات الدردشة."), tr("Delete", "حذف"), tr("Cancel", "إلغاء"))) {
      await smartRemove(`users/${uid}`);
      swalSuccess(tr("User deleted", "تم حذف المستخدم"));
    }
  };

  const deleteChat = async (uid: string, name: string) => {
    if (await swalConfirm(tr(`Delete chat with ${name}?`, `حذف محادثة ${name}؟`), tr("All messages in this chat will be permanently deleted.", "سيتم حذف جميع رسائل هذه المحادثة نهائياً."), tr("Delete", "حذف"), tr("Cancel", "إلغاء"))) {
      if (selectedChat === uid) setSelectedChat(null);
      await smartRemove(`support-chat/${uid}`);
      swalSuccess(tr("Chat deleted", "تم حذف المحادثة"));
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
        
        const chunksRef = ref(db, `reelChunks/${reelId}`);
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

  const updateApiSettings = async (data: any) => {
    await update(ref(db, "api-settings"), data);
  };

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
          <form onSubmit={(e) => { e.preventDefault(); login(); }} autoComplete="off">
            <input type="password" autoFocus autoComplete="current-password" placeholder={tr("Admin PIN", "رمز الدخول")}
              value={pin} onChange={(e) => { setPin(e.target.value); setPinErr(""); }}
              className={`${inp} mb-3 text-center text-xl font-bold tracking-[0.3em]`}
            />
            {pinErr && <p className="text-destructive text-xs mb-3 font-semibold">{pinErr}</p>}
            <button type="submit" className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold">{tr("Login", "دخول")}</button>
          </form>
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
    { id: "features",   icon: <ToggleRight size={14}/>,     en: "Features",    ar: "الميزات"    },
    { id: "users",      icon: <Users size={14}/>,           en: "Users",       ar: "المستخدمين" },
    { id: "chat",       icon: <MessageCircle size={14}/>,   en: "Chat",        ar: "الدردشة",   badge: unreadChats || 0 },
    { id: "reviews",    icon: <Star size={14}/>,            en: "Reviews",     ar: "تقييمات",   badge: feedback.filter((f) => !f.read).length || 0 },
    { id: "broadcast",  icon: <Megaphone size={14}/>,       en: "Broadcast",   ar: "إشعارات"    },
    { id: "reels",      icon: <Film size={14}/>,            en: "Reels",       ar: "ريلز"       },
    { id: "ai",         icon: <Bot size={14}/>,             en: "AI Assistant", ar: "المساعد الذكي" },
    { id: "api",        icon: <Key size={14}/>,             en: "API Settings", ar: "إعدادات الـ API" },
    { id: "system",     icon: <Settings size={14}/>,        en: "System",      ar: "النظام"     },
    { id: "tables",     icon: <LayoutGrid size={14}/>,      en: "Tables",      ar: "الطاولات"   },
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
        <Suspense fallback={<div className="py-20 text-center text-muted-foreground animate-pulse">{tr("Loading tab...", "جاري التحميل...")}</div>}>
          {tab === "overview" && <OverviewTab tr={tr} users={users} unreadChats={unreadChats} newReviewsCount={feedback.filter((f)=>!f.read).length} />}

          {tab === "menu" && (
            <MenuTab
              tr={tr} lang={lang} menu={menu}
              MENU_CATEGORIES={MENU_CATEGORIES}
              CAT_META={CAT_META}
            />
          )}

          {tab === "features" && (
            <FeaturesTab
              tr={tr} featureFlags={featureFlags} toggleFeatureFlag={toggleFeatureFlag}
              savingFlag={savingFlag} apiSettings={apiSettings}
              setApiSettings={setApiSettings} updateApiSettings={updateApiSettings}
            />
          )}

          {tab === "users" && <UsersTab tr={tr} users={users} deleteUser={deleteUser} formatDuration={formatDuration} />}

          {tab === "chat" && (
            <ChatTab
              tr={tr} isRTL={isRTL} selectedChat={selectedChat} setSelectedChat={setSelectedChat}
              chats={chats} chatMsgs={chatMsgs} chatInput={chatInput} setChatInput={setChatInput}
              sendReply={sendReply} deleteChat={deleteChat} chatBottomRef={chatBottomRef}
            />
          )}

          {tab === "reviews" && (
            <ReviewsTab
              tr={tr} feedback={feedback} avgRating={avgRating}
              ratingDist={ratingDist} maxRatingCount={maxRatingCount}
              markFeedbackRead={markFeedbackRead}
            />
          )}

          {tab === "broadcast" && (
            <BroadcastTab
              tr={tr} newBroadcast={newBroadcast} setNewBroadcast={setNewBroadcast}
              sendBroadcast={sendBroadcast} sendingBroadcast={sendingBroadcast}
              bannerContent={bannerContent} setBannerContent={setBannerContent}
              bannerBgColor={bannerBgColor} setBannerBgColor={setBannerBgColor}
              bannerTextColor={bannerTextColor} setBannerTextColor={setBannerTextColor}
              bannerEnabled={bannerEnabled} saveBannerEnabled={saveBannerEnabled}
              saveBanner={saveBanner} savingBanner={savingBanner}
              bannerPreview={bannerPreview} broadcasts={broadcasts}
              deleteBroadcast={deleteBroadcast}
            />
          )}

          {tab === "reels" && <ReelsTab tr={tr} reels={reels} togglePin={togglePin} deleteReel={deleteReel} />}

          {tab === "api" && (
            <ApiTab
              tr={tr} apiSettings={apiSettings} setApiSettings={setApiSettings}
              showApiKey={showApiKey} setShowApiKey={setShowApiKey}
              saveApiSettings={saveApiSettings} savingApiKey={savingApiKey}
            />
          )}

          {tab === "system" && <SystemTab tr={tr} db={db} fbRef={ref} set={set} remove={remove} push={push} get={get} lang={lang} />}

          {tab === "tables" && <TablesTab tr={tr} activeTables={activeTables} users={users} />}

          {tab === "ai" && <div className="page-enter"><AIAdminAssistant /></div>}
        </Suspense>
      </div>
    </div>
  );
}
