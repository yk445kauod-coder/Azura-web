import { type ReactNode, useEffect, useState, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { db, ref, onValue, off } from "@/lib/firebase";
import { X, Bell } from "lucide-react";
import { 
  HomeIcon, 
  SparklesIcon, 
  FilmIcon, 
  ChatBubbleLeftRightIcon, 
  UserIcon,
} from "@heroicons/react/24/outline";
import { 
  HomeIcon as HomeIconSolid, 
  SparklesIcon as SparklesIconSolid, 
  FilmIcon as FilmIconSolid, 
  ChatBubbleLeftRightIcon as ChatIconSolid, 
  UserIcon as UserIconSolid,
} from "@heroicons/react/24/solid";

const ALL_NAV = [
  { path: "/menu",    key: "menu",    label: "القائمة",  labelEn: "Menu",    icon: HomeIcon,    iconActive: HomeIconSolid,    alwaysOn: true },
  { path: "/barista", key: "barista", label: "المساعد",  labelEn: "AI",       icon: SparklesIcon, iconActive: SparklesIconSolid, alwaysOn: false },
  { path: "/reels",   key: "reels",   label: "الفيديو",  labelEn: "Reels",    icon: FilmIcon,    iconActive: FilmIconSolid,     alwaysOn: false },
  { path: "/support", key: "support", label: "الدعم",    labelEn: "Support",  icon: ChatBubbleLeftRightIcon, iconActive: ChatIconSolid, alwaysOn: false },
  { path: "/profile", key: "profile", label: "حسابي",    labelEn: "Profile",  icon: UserIcon,    iconActive: UserIconSolid,     alwaysOn: true },
];

interface Broadcast {
  id: string; title: string; titleAr: string;
  message: string; messageAr: string;
  type: "info" | "promo" | "alert"; emoji: string; createdAt: number;
}

interface FeatureFlags {
  baristaEnabled: boolean;
  reelsEnabled: boolean;
  supportEnabled: boolean;
}

const BROADCAST_TYPE_STYLE: Record<string, string> = {
  info:  "bg-primary/5 border-primary/20 text-primary",
  promo: "bg-primary/5 border-primary/20 text-primary",
  alert: "bg-destructive/10 border-destructive/20 text-destructive",
};

const DEFAULT_BROADCAST: Broadcast = {
  id: "welcome-new",
  title: "✨ Welcome to NEW Azura App!",
  titleAr: "✨ مرحباً بكم في تطبيق أزورا الجديد!",
  message: "🎬 Check out our NEW Video Reels! Swipe through delicious dishes 🍽️",
  messageAr: "🎬 شاهد Reels الجديدة! اسحب لرؤية الأطباق اللذيذة 🍽️",
  type: "promo",
  emoji: "🎉",
  createdAt: Date.now(),
};

export default function Layout({ children }: { children: ReactNode }) {
  const { lang, isRTL } = useLang();
  const { profile } = useAuth();
  const [location] = useLocation();
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [allBroadcasts, setAllBroadcasts] = useState<Broadcast[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
    baristaEnabled: true,
    reelsEnabled: true,
    supportEnabled: true,
  });

  const isActive = (p: string) => location === p || (p === "/menu" && (location === "/" || location === ""));

  const getReadIds = (): string[] => JSON.parse(localStorage.getItem("azura-read-broadcasts") || "[]");
  const saveReadIds = (ids: string[]) => localStorage.setItem("azura-read-broadcasts", JSON.stringify(ids));

  // Listen for feature flags
  useEffect(() => {
    const ffRef = ref(db, "feature-flags");
    onValue(ffRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val() as Partial<FeatureFlags>;
        setFeatureFlags({
          baristaEnabled: data.baristaEnabled !== false,
          reelsEnabled: data.reelsEnabled !== false,
          supportEnabled: data.supportEnabled !== false,
        });
      }
    });
    return () => off(ref(db, "feature-flags"));
  }, []);

  // Listen for broadcasts
  useEffect(() => {
    const bRef = ref(db, "broadcast");
    onValue(bRef, (snap) => {
      const readIds = getReadIds();
      if (!snap.exists()) {
        setAllBroadcasts([DEFAULT_BROADCAST]);
        if (!readIds.includes("welcome-new")) setBroadcast(DEFAULT_BROADCAST);
        return;
      }
      const data = snap.val() as Record<string, Omit<Broadcast, "id">>;
      const all = Object.entries(data)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.createdAt - a.createdAt);
      setAllBroadcasts(all.length > 0 ? all : [DEFAULT_BROADCAST]);
      const latest = all.filter((b) => !readIds.includes(b.id))[0];
      if (latest) setBroadcast(latest);
    });
    return () => off(ref(db, "broadcast"));
  }, []);

  const unreadCount = allBroadcasts.filter(b => !getReadIds().includes(b.id)).length;

  const dismissBroadcast = () => {
    if (!broadcast) return;
    const readIds = getReadIds();
    saveReadIds([...readIds, broadcast.id]);
    setBroadcast(null);
  };

  const markAllRead = () => {
    saveReadIds(allBroadcasts.map(b => b.id));
    setBroadcast(null);
    setNotifOpen(false);
  };

  // Filter nav based on feature flags - memoized
  const NAV = useMemo(() => 
    ALL_NAV.filter(item => {
      if (item.alwaysOn) return true;
      if (item.key === "barista") return featureFlags.baristaEnabled;
      if (item.key === "reels") return featureFlags.reelsEnabled;
      if (item.key === "support") return featureFlags.supportEnabled;
      return true;
    }), [featureFlags]);

  // Memoized broadcast style
  const broadcastStyle = useMemo(() => 
    BROADCAST_TYPE_STYLE[broadcast?.type || "info"] || BROADCAST_TYPE_STYLE.info,
    [broadcast?.type]);

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-2.5"
        style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)", borderBottom: "1px solid rgba(93,62,35,0.08)" }}>
        <Link href="/menu">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <img src="/logo.jpg" alt="Azura" className="w-9 h-9 rounded-full object-cover" style={{ boxShadow: "var(--shadow-sm)" }} loading="lazy" />
            <div>
              <h1 className="text-sm font-bold text-primary leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                Azura Cafe
              </h1>
              <p className="text-[10px] text-muted-foreground leading-none">
                Tivoli Dome, Alexandria
              </p>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {profile?.tableNumber && (
            <span className="text-[11px] font-bold text-primary px-2.5 py-1 rounded-full" style={{ background: "hsl(var(--muted))", boxShadow: "var(--shadow-xs)" }}>
              {lang === "ar" ? `طاولة ${profile.tableNumber}` : `Table ${profile.tableNumber}`}
            </span>
          )}
          <button
            onClick={() => setNotifOpen(true)}
            className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-muted active:scale-95"
            aria-label="Notifications"
          >
            <Bell size={18} className="text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -end-0.5 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-extrabold flex items-center justify-center px-1 shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Notification Drawer */}
      <AnimatePresence>
        {notifOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setNotifOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-background rounded-t-[2.5rem] px-6 pt-3 pb-10 space-y-4 max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
              style={{ borderTop: "1px solid hsl(var(--border))" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-2 flex-shrink-0" />

              <div className="flex items-center justify-between flex-shrink-0">
                <h2 className="font-black text-foreground text-xl">
                  {lang === "ar" ? "الإشعارات" : "Notifications"}
                </h2>
                <button
                  onClick={markAllRead}
                  className="text-sm font-bold text-primary px-3 py-1.5 rounded-xl bg-primary/5 hover:bg-primary/10 transition-all active:scale-95"
                >
                  {lang === "ar" ? "مسح الكل" : "Mark all read"}
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 pr-1 scroll-hide">
                {allBroadcasts.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="text-5xl opacity-20">🔔</div>
                    <p className="text-muted-foreground font-medium text-sm">
                      {lang === "ar" ? "لا توجد إشعارات حالياً" : "No notifications yet"}
                    </p>
                  </div>
                ) : (
                  allBroadcasts.map((b) => {
                    const isUnread = !getReadIds().includes(b.id);
                    return (
                      <div
                        key={b.id}
                        className={`rounded-2xl px-4 py-4 border flex items-start gap-4 transition-all ${BROADCAST_TYPE_STYLE[b.type] || BROADCAST_TYPE_STYLE.info} ${isUnread ? "shadow-md ring-1 ring-primary/20 border-primary/20" : "opacity-60"}`}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white/50 backdrop-blur-sm flex items-center justify-center text-2xl shadow-sm border border-white/20">
                          {b.emoji || "✨"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-black text-sm leading-tight">
                              {lang === "ar" ? (b.titleAr || b.title) : b.title}
                            </p>
                            {isUnread && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 shadow-sm shadow-primary/40 animate-pulse" />}
                          </div>
                          <p className="text-xs opacity-75 leading-relaxed mt-1 font-medium">
                            {lang === "ar" ? (b.messageAr || b.message) : b.message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Broadcast Banner */}
      {broadcast && (
        <div className={`mx-3 mt-2 rounded-xl px-4 py-3 border text-sm overflow-hidden relative ${BROADCAST_TYPE_STYLE[broadcast.type] || BROADCAST_TYPE_STYLE.info}`}>
          <div className="flex items-center gap-3">
            <span className="text-xl flex-shrink-0">{broadcast.emoji || "✨"}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight">
                {lang === "ar" ? (broadcast.titleAr || broadcast.title) : broadcast.title}
              </p>
              <p className="text-xs opacity-80 leading-snug mt-0.5">
                {lang === "ar" ? (broadcast.messageAr || broadcast.message) : broadcast.message}
              </p>
            </div>
            <button 
              onClick={dismissBroadcast} 
              className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-black/5 flex items-center justify-center transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="page-enter">{children}</div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 px-1 pb-safe">
        <div 
          className="mx-3 mb-2 rounded-2xl overflow-hidden shadow-lg bg-background border"
        >
          <div className="flex items-stretch justify-around py-2 px-1">
            {NAV.map((item) => {
              const active = isActive(item.path);
              const Icon = active ? item.iconActive : item.icon;
              const displayLabel = lang === "ar" ? item.label : item.labelEn;
              
              return (
                <Link key={item.path} href={item.path} className="flex-1">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    className="relative flex flex-col items-center justify-center gap-1.5 px-1 py-2 w-full outline-none group"
                    aria-label={displayLabel}
                    aria-current={active ? "page" : undefined}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-primary"
                        transition={{ type: "spring", bounce: 0.35, duration: 0.6 }}
                      />
                    )}
                    <div className="relative">
                      <motion.div
                        animate={active ? { scale: 1.1 } : { scale: 1 }}
                        className={`p-1.5 rounded-2xl transition-colors duration-300 ${active ? "bg-primary/15" : "group-hover:bg-muted"}`}
                      >
                        <Icon 
                          className={`w-5 h-5 transition-colors duration-300 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                        />
                      </motion.div>
                    </div>
                    <span 
                      className={`text-[10px] tracking-tight font-black transition-all duration-300 ${active ? "text-primary scale-105" : "text-muted-foreground opacity-70"}`}
                    >
                      {displayLabel}
                    </span>
                  </motion.button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
