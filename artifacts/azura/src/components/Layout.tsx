import { type ReactNode, useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { db, ref, onValue, off } from "@/lib/firebase";
import SupportChatWidget from "@/components/SupportChatWidget";
import { X } from "lucide-react";

const NAV = [
  { path: "/menu",    emoji: "☕", label: { en: "Menu",    ar: "القائمة"  } },
  { path: "/barista", emoji: "🤖", label: { en: "AI",      ar: "الذكي"    } },
  { path: "/cart",    emoji: "🛒", label: { en: "Cart",    ar: "سلتي"     }, cart: true },
  { path: "/orders",  emoji: "📋", label: { en: "Orders",  ar: "طلباتي"   } },
  { path: "/profile", emoji: "👤", label: { en: "Profile", ar: "حسابي"    } },
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
                {lang === "ar" ? "أزورا كافيه" : "Azura Cafe"}
              </h1>
              <p className="text-[10px] text-muted-foreground leading-none">
                {lang === "ar" ? "التيفولي دوم، الإسكندرية" : "Tivoli Dome, Alexandria"}
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
          <Link href="/cart">
            <button className="relative btn-icon w-9 h-9">
              <span className="text-base">🛒</span>
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

      {/* Support Chat */}
      <SupportChatWidget />

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 px-2 pb-safe"
        style={{ background: "hsla(var(--card),0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(93,62,35,0.08)", boxShadow: "0 -4px 16px rgba(61,32,18,0.08)" }}>
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {NAV.map((item) => {
            const active = isActive(item.path);
            const badge = item.cart && totalItems > 0 ? totalItems : 0;
            return (
              <Link key={item.path} href={item.path}>
                <button className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[44px] transition-all duration-200 ${active ? "bg-primary/10" : "hover:bg-muted/60"}`}>
                  <div className="relative">
                    <span className={`text-[18px] leading-none ${active ? "scale-110" : ""} inline-block transition-transform`}>{item.emoji}</span>
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{badge}</span>
                    )}
                  </div>
                  <span className={`text-[9px] font-semibold leading-none transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {item.label[lang]}
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
