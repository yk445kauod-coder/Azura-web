import { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "wouter";
import { Search, Plus, Check, Sparkles, ChevronRight } from "lucide-react";

// Lazy load heavy components
const SkeletonCard = lazy(() => import("./SkeletonCard"));

// Lazy Image Component with Intersection Observer
function LazyImage({ src, alt, className, fallback }: { src: string; alt: string; className?: string; fallback: string }) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(fallback);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px", threshold: 0 }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setLoaded(true);
    };
    img.onerror = () => setLoaded(true);
  }, [inView, src]);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={inView ? currentSrc : fallback}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onError={(e) => { (e.target as HTMLImageElement).src = fallback; }}
      />
    </div>
  );
}

interface MenuItem {
  id: string; name: string; nameAr: string;
  description: string; descriptionAr: string;
  price: number; category: string; available: boolean; image: string;
}

function normalizeItem(id: string, raw: Record<string, unknown>): MenuItem {
  return {
    id,
    name: String(raw.name || raw.nameEn || raw.title || ""),
    nameAr: String(raw.nameAr || raw.titleAr || ""),
    description: String(raw.description || raw.descEn || raw.desc || ""),
    descriptionAr: String(raw.descriptionAr || raw.descAr || ""),
    price: Number(raw.price) || 0,
    category: String(raw.category || "coffee"),
    available: raw.available !== false,
    image: String(raw.image || raw.img || ""),
  };
}

const CATS = [
  { id: "all",        emoji: "🍽️", en: "All",      ar: "الكل"       },
  { id: "food",       emoji: "🍴",  en: "Food",    ar: "طعام"       },
  { id: "sandwiches", emoji: "🥪",  en: "Sandwich", ar: "ساندوتش"   },
  { id: "mains",      emoji: "🍖",  en: "Mains",   ar: "أطباق"      },
  { id: "burgers",    emoji: "🍔",  en: "Burgers", ar: "برجر"       },
  { id: "hot_drinks", emoji: "☕",  en: "Hot",     ar: "ساخن"       },
  { id: "cold_drinks",emoji: "🥤",  en: "Cold",    ar: "بارد"       },
  { id: "fresh",      emoji: "🍹",  en: "Fresh",    ar: "طازج"       },
  { id: "milkshake",  emoji: "🥛",  en: "Shakes",   ar: "شيك"        },
  { id: "desserts",   emoji: "🍰",  en: "Sweets",   ar: "حلويات"     },
  { id: "extras",     emoji: "➕",  en: "Extras",   ar: "إضافات"     },
  { id: "drinks",     emoji: "🥤",  en: "Drinks",   ar: "مشروبات"    },
  { id: "shisha",     emoji: "💨",  en: "Shisha",   ar: "شيشة"       },
];

const FALLBACK: Record<string, string> = {
  food:       "https://images.unsplash.com/photo-1568471173242-461f0a730452?w=500&q=80",
  sandwiches: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&q=80",
  mains:      "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80",
  burgers:    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
  hot_drinks: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80",
  cold_drinks:"https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80",
  fresh:      "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500&q=80",
  milkshake:  "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80",
  desserts:   "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&q=80",
  extras:     "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80",
  drinks:     "https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=500&q=80",
  shisha:     "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?auto=compress&cs=tinysrgb&w=500",
};

const SHISHA_EXAMPLES = [
  { name: "Classic Hookah", price: 80, desc: "Traditional tobacco with authentic flavor" },
  { name: "Double Apple", price: 90, desc: "Sweet & tangy apple flavor" },
  { name: "Mint Chill", price: 85, desc: "Cool refreshing mint" },
  { name: "Fruit Mix", price: 95, desc: "Blend of tropical fruits" },
  { name: "Grape Mint", price: 90, desc: "Grape with cooling mint" },
  { name: "Berry Blast", price: 95, desc: "Mixed berry sensation" },
  { name: "Lemon Mint", price: 85, desc: "Citrus with fresh mint" },
  { name: "Watermelon Fresh", price: 90, desc: "Sweet summer watermelon" },
  { name: "Two Hose Sharing", price: 150, desc: "Share with a friend - two hoses" },
  { name: "Premium Mix Bowl", price: 120, desc: "Mix of two flavors in one bowl" },
];

function greeting(lang: "en" | "ar") {
  const h = new Date().getHours();
  if (h < 12) return lang === "ar" ? "صباح الخير! ☀️" : "Good morning! ☀️";
  if (h < 17) return lang === "ar" ? "طيب النهار! 🌤️" : "Good afternoon! 🌤️";
  return lang === "ar" ? "مساء النور! 🌙" : "Good evening! 🌙";
}

// SkeletonCard is now lazy loaded

export default function Menu() {
  const { lang, isRTL } = useLang();
  const { addItem, isInCart, getQty } = useCart();
  const [, navigate] = useLocation();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Memoized translation function
  const tr = useCallback((en: string, ar: string) => lang === "ar" ? ar : en, [lang]);

  // Memoized data processing
  useEffect(() => {
    const menuRef = ref(db, "menu");
    onValue(menuRef, (snap) => {
      if (!snap.exists()) { setLoading(false); return; }
      const data = snap.val() as Record<string, Record<string, unknown>>;
      const result: MenuItem[] = [];
      Object.entries(data).forEach(([key, val]) => {
        if (typeof val !== "object" || val === null) return;
        const v = val as Record<string, unknown>;
        if (v.price !== undefined || v.name !== undefined || v.nameEn !== undefined) {
          result.push(normalizeItem(key, v));
        } else {
          Object.entries(v).forEach(([subId, subVal]) => {
            if (typeof subVal === "object" && subVal !== null)
              result.push(normalizeItem(subId, subVal as Record<string, unknown>));
          });
        }
      });
      setItems(result);
      setLoading(false);
      setTimeout(() => setVisible(true), 60);
    });
    return () => off(ref(db, "menu"));
  }, []);

  // Memoized filtered items
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!item.available) return false;
      if (cat !== "all" && item.category !== cat) return false;
      const q = search.toLowerCase();
      return !q || item.name.toLowerCase().includes(q) || item.nameAr.includes(q) || item.description.toLowerCase().includes(q);
    });
  }, [items, cat, search]);

  // Memoized featured items
  const featured = useMemo(() => {
    return items.filter((i) => i.available && i.image).slice(0, 8);
  }, [items]);

  // Memoized category counts
  const catCount = useCallback((c: string) => {
    if (c === "all") return items.filter((i) => i.available).length;
    return items.filter((i) => i.available && i.category === c).length;
  }, [items]);

  // Memoized add handler
  const handleAdd = useCallback((item: MenuItem) => {
    addItem({ id: item.id, name: item.name, nameAr: item.nameAr, price: item.price, category: item.category, image: item.image });
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 1400);
  }, [addItem]);

  return (
    <div className="max-w-2xl mx-auto pb-4" dir={isRTL ? "rtl" : "ltr"}>

      {/* ── Greeting Header ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-secondary">{greeting(lang)}</p>
            <h1 className="text-[22px] font-extrabold text-primary leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
              {tr("What would you like?", "إيه اللي تحب تطلب؟")}
            </h1>
          </div>
          <button
            onClick={() => navigate("/barista")}
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl flex-shrink-0"
            style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.2)" }}
          >
            <Sparkles size={12} /> {tr("Ask AI", "اسأل الذكاء")}
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={14} className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${isRTL ? "right-3.5" : "left-3.5"}`} />
          <input
            ref={searchRef}
            type="text"
            placeholder={tr("Search…", "ابحث…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`input-field py-2.5 text-sm ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
          />
        </div>
      </div>

      {/* ── Category Pills ── */}
      <div className="flex gap-2 overflow-x-auto scroll-hide px-4 mb-4 pb-0.5">
        {CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`flex items-center gap-1.5 flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
              cat === c.id
                ? "text-primary-foreground scale-105"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={cat === c.id
              ? { background: "hsl(var(--primary))", boxShadow: "var(--shadow-primary)" }
              : { background: "hsl(var(--card))", boxShadow: "var(--shadow-xs)", border: "1px solid rgba(93,62,35,0.08)" }
            }
          >
            <span className="text-sm">{c.emoji}</span>
            {lang === "ar" ? c.ar : c.en}
            <span className={`rounded-full text-[9px] font-extrabold px-1.5 py-0.5 min-w-[18px] text-center ${cat === c.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
              {catCount(c.id)}
            </span>
          </button>
        ))}
      </div>

      {/* ── Featured horizontal scroll (only when "all" + no search) ── */}
      {!loading && !search && cat === "all" && featured.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between px-4 mb-2.5">
            <h2 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
              <span className="text-base">🔥</span> {tr("Popular Now", "الأكثر طلباً")}
            </h2>
            <button onClick={() => navigate("/barista")} className="flex items-center gap-0.5 text-[11px] font-semibold text-secondary">
              {tr("Ask AI for suggestions", "اقتراحات بالذكاء")} <ChevronRight size={11} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto scroll-hide px-4 pb-1">
            {featured.map((item) => {
              const added = justAdded === item.id;
              const inCart = isInCart(item.id);
              return (
                <div key={item.id} className="flex-shrink-0 w-36 rounded-2xl overflow-hidden relative group cursor-pointer"
                  style={{ boxShadow: "var(--shadow-md)" }}
                  onClick={() => handleAdd(item)}
                >
                  <LazyImage
                    src={item.image || FALLBACK[item.category] || FALLBACK.coffee}
                    alt={item.name}
                    className="w-full h-24"
                    fallback={FALLBACK[item.category] || FALLBACK.coffee}
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-[11px] font-bold leading-tight line-clamp-1">{item.name}</p>
                    <p className="text-white/80 text-[10px] font-semibold">{item.price} EGP</p>
                  </div>
                  <div className={`absolute top-1.5 ${isRTL ? "left-1.5" : "right-1.5"} w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${added ? "scale-90" : ""}`}
                    style={{ background: added ? "#22c55e" : "rgba(255,255,255,0.9)", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
                    {added ? <Check size={12} strokeWidth={3} className="text-white" /> : <Plus size={12} strokeWidth={2.5} style={{ color: "hsl(var(--primary))" }} />}
                    {inCart && !added && <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">{getQty(item.id)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="px-4">
        {loading ? (
          <Suspense fallback={<div className="grid grid-cols-2 gap-3">{[...Array(6)].map((_, i) => <div key={i} className="h-48 rounded-2xl animate-pulse bg-muted/60" />)}</div>}>
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </Suspense>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">{search ? "🔍" : "☕"}</p>
            <p className="font-bold text-primary text-base mb-1">{search ? tr("Nothing found", "مفيش نتيجة") : tr("Nothing here yet", "لا يوجد عناصر")}</p>
            <p className="text-sm text-muted-foreground">{search ? tr("Try another keyword", "جرب كلمة أخرى") : tr("Check back soon!", "قريباً!")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item, idx) => {
              const inCart = isInCart(item.id);
              const qty = getQty(item.id);
              const added = justAdded === item.id;
              const imgSrc = item.image || FALLBACK[item.category] || FALLBACK.coffee;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl overflow-hidden flex flex-col group transition-all duration-300"
                  style={{
                    background: "hsl(var(--card))",
                    boxShadow: inCart ? "0 0 0 2px hsl(var(--primary)/0.35), var(--shadow-md)" : "var(--shadow-sm)",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(12px)",
                    transition: `opacity 0.35s ease ${idx * 40}ms, transform 0.35s ease ${idx * 40}ms, box-shadow 0.2s ease`,
                  }}
                >
                  {/* Image - Lazy loaded */}
                  <div className="relative overflow-hidden bg-muted" style={{ paddingTop: "68%" }}>
                    <LazyImage
                      src={imgSrc}
                      alt={item.name}
                      className="absolute inset-0 w-full h-full"
                      fallback={FALLBACK[item.category] || FALLBACK.coffee}
                    />
                    {/* Category badge */}
                    <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white/90"
                      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
                      {CATS.find((c) => c.id === item.category)?.emoji} {CATS.find((c) => c.id === item.category)?.en}
                    </span>
                    {/* Cart qty badge */}
                    {inCart && qty > 0 && (
                      <span className="absolute top-2 right-2 text-[10px] font-extrabold text-white rounded-full flex items-center justify-center"
                        style={{ background: "hsl(var(--primary))", minWidth: 20, height: 20, padding: "0 5px", boxShadow: "var(--shadow-sm)" }}>
                        {qty}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-bold text-sm text-foreground leading-tight mb-0.5">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 flex-1 mb-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <div>
                        <span className="font-extrabold text-primary text-base leading-none">
                          {item.price}
                        </span>
                        <span className="text-[10px] text-secondary font-semibold ms-1">{lang === "ar" ? "ج.م" : "EGP"}</span>
                      </div>
                      <button
                        onClick={() => handleAdd(item)}
                        className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
                          added ? "scale-90" : "hover:scale-110 active:scale-95"
                        }`}
                        style={added
                          ? { background: "#22c55e", boxShadow: "0 3px 10px rgba(34,197,94,0.45)" }
                          : { background: "hsl(var(--primary))", boxShadow: "var(--shadow-primary)" }
                        }
                      >
                        {added
                          ? <Check size={15} strokeWidth={3} className="text-white" />
                          : <Plus size={15} strokeWidth={2.5} className="text-primary-foreground" />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spacer for nav */}
      <div className="h-4" />
    </div>
  );
}
