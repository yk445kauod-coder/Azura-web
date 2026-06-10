import { type ReactNode, useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { db, ref, onValue, off } from "@/lib/firebase";
import { X, ShoppingCart } from "lucide-react";
import { 
  HomeIcon, 
  SparklesIcon, 
  ClipboardDocumentListIcon, 
  FilmIcon, 
  ChatBubbleLeftRightIcon, 
  UserIcon,
  Cog6ToothIcon
} from "@heroicons/react/24/outline";
import { 
  HomeIcon as HomeIconSolid, 
  SparklesIcon as SparklesIconSolid, 
  ClipboardDocumentListIcon as ClipboardIconSolid, 
  FilmIcon as FilmIconSolid, 
  ChatBubbleLeftRightIcon as ChatIconSolid, 
  UserIcon as UserIconSolid,
  Cog6ToothIcon as CogIconSolid
} from "@heroicons/react/24/solid";

const NAV = [
  { path: "/menu",    key: "menu",    label: "القائمة",      labelEn: "Menu",    icon: HomeIcon,    iconActive: HomeIconSolid },
  { path: "/barista", key: "barista", label: "المساعد",      labelEn: "AI",       icon: SparklesIcon, iconActive: SparklesIconSolid },
  { path: "/cart",    key: "cart",    label: "السلة",        labelEn: "Cart",     icon: ShoppingCart, iconActive: ShoppingCart, cart: true },
  { path: "/orders",  key: "orders",  label: "الطلبات",      labelEn: "Orders",   icon: ClipboardDocumentListIcon, iconActive: ClipboardIconSolid },
  { path: "/reels",   key: "reels",   label: "الفيديو",       labelEn: "Reels",    icon: FilmIcon, iconActive: FilmIconSolid },
  { path: "/support", key: "support", label: "الدعم",        labelEn: "Support",  icon: ChatBubbleLeftRightIcon, iconActive: ChatIconSolid },
  { path: "/profile", key: "profile", label: "حسابي",        labelEn: "Profile",  icon: UserIcon, iconActive: UserIconSolid },
];

interface Broadcast {
  id: string; title: string; titleAr: string;
  message: string; messageAr: string;
  type: "info" | "promo" | "alert"; emoji: string; createdAt: number;
}

const BROADCAST_TYPE_STYLE: Record<string, string> = {
  info:  "bg-gradient-to-r from-purple-500 to-pink-500 border-white/30 text-white",
  promo: "bg-gradient-to-r from-amber-500 to-orange-500 border-white/30 text-white",
  alert: "bg-gradient-to-r from-red-500 to-pink-500 border-white/30 text-white",
};

const DEFAULT_BROADCAST: Broadcast = {
  id: "welcome-new",
  title: "✨ Welcome to NEW Azura App!",
  titleAr: "✨ مرحباً بكم في تطبيق أزورا الجديد!",
  message: "🎬 Check out our NEW Video Reels! Swipe through delicious dishes 🍽️",
  messageAr: "🎬 شاهدREELs الجديدة! اسحب لرؤية الأطباق اللذيذة 🍽️",
  type: "promo",
  emoji: "🎉",
  createdAt: Date.now(),
};

export default function Layout({ children }: { children: ReactNode }) {
  const { lang, isRTL } = useLang();
  const { totalItems } = useCart();
  const { profile } = useAuth();
  const [location] = useLocation();
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);

  const isActive = (p: string) => location === p || (p === "/menu" && (location === "/" || location === ""));

  // Listen for admin broadcasts OR show default welcome
  useEffect(() => {
    const bRef = ref(db, "broadcast");
    onValue(bRef, (snap) => {
      if (!snap.exists()) {
        // Show default welcome broadcast if none in Firebase
        const readIds: string[] = JSON.parse(localStorage.getItem("azura-read-broadcasts") || "[]");
        if (!readIds.includes("welcome-new")) {
          setBroadcast(DEFAULT_BROADCAST);
        }
        return;
      }
      const data = snap.val() as Record<string, Omit<Broadcast, "id">>;
      const readIds: string[] = JSON.parse(localStorage.getItem("azura-read-broadcasts") || "[]");
      const latest = Object.entries(data)
        .map(([id, v]) => ({ id, ...v }))
        .filter((b) => !readIds.includes(b.id))
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      if (latest) setBroadcast(latest);
    });
    return () => off(ref(db, "broadcast"));
  }, []);

  const dismissBroadcast = () => {
    if (!broadcast) return;
    const readIds: string[] = JSON.parse(localStorage.getItem("azura-read-broadcasts") || "[]");
    localStorage.setItem("azura-read-broadcasts", JSON.stringify([...readIds, broadcast.id]));
    setBroadcast(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-2.5"
        style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)", borderBottom: "1px solid rgba(93,62,35,0.08)" }}>
        <Link href="/menu">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <img src="/logo.jpg" alt="Azura" className="w-9 h-9 rounded-full object-cover" style={{ boxShadow: "var(--shadow-sm)" }} />
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
              Table {profile.tableNumber}
            </span>
          )}
          <Link href="/cart">
            <button className="relative btn-icon w-9 h-9">
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center font-bold leading-none px-1">
                  {totalItems}
                </span>
              )}
            </button>
          </Link>
        </div>
      </header>

      {/* Animated Broadcast Banner */}
      {broadcast && (
        <div className={`mx-3 mt-2 rounded-2xl px-4 py-3 border text-sm overflow-hidden relative ${BROADCAST_TYPE_STYLE[broadcast.type] || BROADCAST_TYPE_STYLE.info} animate-slide-down`}>
          {/* Animated sparkle emojis */}
          <div className="absolute top-1 left-2 text-xs animate-pulse opacity-60">✨</div>
          <div className="absolute top-2 right-4 text-xs animate-bounce" style={{ animationDelay: "0.3s" }}>⭐</div>
          <div className="absolute bottom-1 right-8 text-xs animate-pulse" style={{ animationDelay: "0.6s" }}>💫</div>
          
          <div className="flex items-center gap-3">
            <span className="text-2xl flex-shrink-0 animate-wiggle">{broadcast.emoji || "🎉"}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight flex items-center gap-1">
                {lang === "ar" ? (broadcast.titleAr || broadcast.title) : broadcast.title}
              </p>
              <p className="text-xs opacity-90 leading-snug mt-0.5 flex items-center gap-1">
                {lang === "ar" ? (broadcast.messageAr || broadcast.message) : broadcast.message}
              </p>
            </div>
            <button 
              onClick={dismissBroadcast} 
              className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all hover:scale-110"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
          
          {/* Animated progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30">
            <div className="h-full bg-white/80 animate-progress" style={{ width: "60%" }} />
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="page-enter">{children}</div>
      </main>

      {/* Bottom Nav - Amazing iOS Style */}
      <nav className="fixed bottom-0 inset-x-0 z-40 px-1 pb-safe">
        {/* Background blur container - Pure white glass, unaffected by bg */}
        <div 
          className="mx-3 mb-2 rounded-2xl overflow-hidden"
          style={{ 
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(24px) saturate(200%)",
            WebkitBackdropFilter: "blur(24px) saturate(200%)",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.15), 0 -4px 16px rgba(0,0,0,0.08), inset 0 0.5px 0 rgba(255,255,255,1)",
            border: "0.5px solid rgba(255,255,255,0.8)"
          }}
        >
          <div className="flex items-stretch justify-around py-2 px-1">
            {NAV.map((item, index) => {
              const active = isActive(item.path);
              const badge = item.cart && totalItems > 0 ? totalItems : 0;
              const Icon = active ? item.iconActive : item.icon;
              const displayLabel = lang === "ar" ? item.label : item.labelEn;
              
              return (
                <Link key={item.path} href={item.path} className="flex-1">
                  <button 
                    className={`
                      relative flex flex-col items-center justify-center gap-1 px-1 py-1.5 w-full
                      transition-all duration-300 ease-out
                      ${active ? "" : "hover:scale-[1.08] active:scale-[0.92]"}
                    `}
                  >
                    {/* Active indicator pill */}
                    {active && (
                      <div 
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full"
                        style={{ 
                          background: "linear-gradient(180deg, hsl(22,55%,28%), hsl(22,55%,18%))",
                          boxShadow: "0 3px 10px rgba(93,62,35,0.5), 0 1px 3px rgba(93,62,35,0.3)"
                        }}
                      />
                    )}
                    
                    {/* Icon container with dynamic background */}
                    <div className="relative">
                      <div 
                        className={`
                          p-1.5 rounded-xl transition-all duration-300 ease-out
                          ${active 
                            ? "bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg ring-2 ring-primary/20" 
                            : "bg-transparent hover:bg-muted/60 active:bg-muted/80"
                          }
                        `}
                      >
                        <Icon 
                          className={`
                            w-5 h-5 transition-all duration-300 ease-out
                            ${active 
                              ? "text-primary scale-110 drop-shadow-md" 
                              : "text-muted-foreground group-hover:text-foreground"
                            }
                          `} 
                        />
                      </div>
                      
                      {/* Animated badge */}
                      {badge > 0 && (
                        <span 
                          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-lg"
                          style={{ 
                            background: "linear-gradient(135deg, hsl(22,55%,25%), hsl(22,55%,15%))",
                            boxShadow: "0 3px 8px rgba(93,62,35,0.5)",
                            animation: "badgePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
                          }}
                        >
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </div>
                    
                    {/* Label with active highlight */}
                    <span 
                      className={`
                        text-[10px] font-semibold leading-none tracking-wide transition-all duration-300
                        ${active 
                          ? "text-primary font-bold" 
                          : "text-muted-foreground"
                        }
                      `}
                    >
                      {displayLabel}
                    </span>
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
