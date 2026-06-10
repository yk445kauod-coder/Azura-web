import { type ReactNode, useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { db, ref, onValue, off } from "@/lib/firebase";
import { X, ShoppingCart } from "lucide-react";

// Colorful emoji-style SVG icons for navigation
const NavIcons = {
  menu: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="6" cy="6" r="2" fill="#8B4513"/>
      <circle cx="18" cy="6" r="2" fill="#D2691E"/>
      <path d="M5 5c1.5-1 3-1 5-1s3.5 0 5 1" stroke="#8B4513" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  barista: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="16" height="10" rx="2" fill="#6B7280"/>
      <rect x="6" y="12" width="12" height="6" rx="1" fill="#374151"/>
      <path d="M8 10V8a4 4 0 018 0v2" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="5" r="3" fill="#818CF8"/>
      <circle cx="12" cy="5" r="1.5" fill="#C4B5FD"/>
      <path d="M9 2h6" stroke="#818CF8" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  cart: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6h15l-1.5 9H7.5L6 6z" fill="#F59E0B"/>
      <path d="M6 6L5 3H2" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="9" cy="20" r="2" fill="#D97706"/>
      <circle cx="18" cy="20" r="2" fill="#D97706"/>
      <rect x="9" y="10" width="6" height="4" rx="1" fill="#FEF3C7"/>
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="3" width="16" height="18" rx="2" fill="#10B981"/>
      <rect x="7" y="6" width="10" height="2" rx="1" fill="#A7F3D0"/>
      <rect x="7" y="10" width="8" height="1.5" rx="0.5" fill="#A7F3D0"/>
      <rect x="7" y="13" width="10" height="1.5" rx="0.5" fill="#A7F3D0"/>
      <rect x="7" y="16" width="6" height="1.5" rx="0.5" fill="#A7F3D0"/>
      <path d="M4 3l2 3h12l2-3" fill="#059669"/>
    </svg>
  ),
  reels: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="#EC4899"/>
      <polygon points="10,8 10,16 16,12" fill="white"/>
      <rect x="5" y="7" width="2" height="10" rx="1" fill="#F472B6"/>
      <rect x="17" y="7" width="2" height="10" rx="1" fill="#F472B6"/>
    </svg>
  ),
  support: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21c5.5 0 10-4.5 10-10S17.5 1 12 1 2 5.5 2 11c0 2.5 1 4.8 2.5 6.5L3 21l3.5-1.5C7.8 19.2 9.8 20 12 20z" fill="#3B82F6"/>
      <circle cx="12" cy="11" r="4" fill="#93C5FD"/>
      <circle cx="9" cy="9" r="1" fill="#1E40AF"/>
      <circle cx="15" cy="9" r="1" fill="#1E40AF"/>
      <path d="M9 13c1 1 2.5 1.5 3 1.5s2-0.5 3-1.5" stroke="#1E40AF" strokeWidth="1" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" fill="#8B5CF6"/>
      <path d="M4 20c0-4 4-7 8-7s8 3 8 7" fill="#A78BFA"/>
      <circle cx="12" cy="8" r="2" fill="#C4B5FD"/>
    </svg>
  ),
};

const NAV = [
  { path: "/menu",    key: "menu",    label: "Menu" },
  { path: "/barista", key: "barista", label: "AI" },
  { path: "/cart",    key: "cart",    label: "Cart", cart: true },
  { path: "/orders",  key: "orders",  label: "Orders" },
  { path: "/reels",   key: "reels",   label: "Reels" },
  { path: "/support", key: "support", label: "Support" },
  { path: "/profile", key: "profile", label: "Profile" },
];

interface Broadcast {
  id: string; title: string; titleAr: string;
  message: string; messageAr: string;
  type: "info" | "promo" | "alert"; emoji: string; createdAt: number;
}

const BROADCAST_TYPE_STYLE: Record<string, string> = {
  info:  "bg-blue-50 border-blue-200 text-blue-800",
  promo: "bg-amber-50 border-amber-200 text-amber-800",
  alert: "bg-red-50 border-red-200 text-red-800",
};

export default function Layout({ children }: { children: ReactNode }) {
  const { lang, isRTL } = useLang();
  const { totalItems } = useCart();
  const { profile } = useAuth();
  const [location] = useLocation();
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);

  const isActive = (p: string) => location === p || (p === "/menu" && (location === "/" || location === ""));

  // Listen for admin broadcasts
  useEffect(() => {
    const bRef = ref(db, "broadcast");
    onValue(bRef, (snap) => {
      if (!snap.exists()) return;
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

      {/* Broadcast Banner */}
      {broadcast && (
        <div className={`mx-3 mt-2 rounded-xl px-3 py-2.5 flex items-start gap-2.5 border text-sm ${BROADCAST_TYPE_STYLE[broadcast.type] || BROADCAST_TYPE_STYLE.info}`}>
          <span className="text-lg flex-shrink-0 leading-none mt-0.5">{broadcast.emoji || "📢"}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[13px] leading-tight">{lang === "ar" ? (broadcast.titleAr || broadcast.title) : broadcast.title}</p>
            <p className="text-[11px] opacity-80 leading-snug mt-0.5">{lang === "ar" ? (broadcast.messageAr || broadcast.message) : broadcast.message}</p>
          </div>
          <button onClick={dismissBroadcast} className="flex-shrink-0 opacity-60 hover:opacity-100 mt-0.5">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="page-enter">{children}</div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 px-2 pb-safe"
        style={{ background: "hsla(var(--card),0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(93,62,35,0.08)", boxShadow: "0 -4px 16px rgba(61,32,18,0.08)" }}>
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {NAV.map((item) => {
            const active = isActive(item.path);
            const badge = item.cart && totalItems > 0 ? totalItems : 0;
            const Icon = NavIcons[item.key as keyof typeof NavIcons];
            return (
              <Link key={item.path} href={item.path}>
                <button className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[44px] transition-all duration-200 ${active ? "bg-primary/10" : "hover:bg-muted/60"}`}>
                  <div className="relative">
                    <div className={`${active ? "scale-110" : ""} transition-transform`} style={{ color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                      {Icon}
                    </div>
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{badge}</span>
                    )}
                  </div>
                  <span className={`text-[9px] font-semibold leading-none transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
