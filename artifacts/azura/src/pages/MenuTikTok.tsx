import { useState, useEffect, useMemo, useRef } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "wouter";
import { Plus, Check, ChevronDown, Sparkles, X } from "lucide-react";

// Lazy Image Component with Intersection Observer
function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px", threshold: 0 }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !src) return;
    const img = new Image();
    img.src = src;
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(true);
  }, [inView, src]);

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-white/10 animate-pulse" />
      )}
      {inView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
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
  { id: "all",        emoji: "✨", en: "All",        ar: "الكل"       },
  { id: "food",       emoji: "🍽️", en: "Food",       ar: "طعام"          },
  { id: "sandwiches", emoji: "🥪", en: "Sandwiches", ar: "ساندوتشات"    },
  { id: "mains",      emoji: "🍖", en: "Mains",     ar: "أطباق" },
  { id: "burgers",    emoji: "🍔", en: "Burgers",    ar: "برجر"         },
  { id: "hot_drinks", emoji: "☕", en: "Hot Drinks",  ar: "مشروبات ساخنة" },
  { id: "cold_drinks",emoji: "🧊", en: "Cold Drinks", ar: "باردة" },
  { id: "fresh",      emoji: "🍹", en: "Fresh Juice", ar: "عصائر"  },
  { id: "milkshake",  emoji: "🥛", en: "Milkshakes",  ar: "شيك"      },
  { id: "desserts",   emoji: "🍰", en: "Desserts",    ar: "حلويات"       },
  { id: "shisha",     emoji: "💨", en: "Shisha",      ar: "شيشة"         },
];

// Category gradients for backgrounds
const CAT_GRADIENTS: Record<string, string> = {
  food:       "from-amber-900 via-orange-800 to-amber-700",
  sandwiches: "from-red-900 via-rose-800 to-red-700",
  mains:      "from-emerald-900 via-teal-800 to-emerald-700",
  burgers:    "from-yellow-900 via-amber-800 to-yellow-700",
  hot_drinks: "from-stone-900 via-amber-900 to-stone-800",
  cold_drinks:"from-blue-900 via-cyan-800 to-blue-700",
  fresh:      "from-green-900 via-emerald-800 to-green-700",
  milkshake:  "from-pink-900 via-rose-800 to-pink-700",
  desserts:   "from-purple-900 via-violet-800 to-purple-700",
  extras:     "from-gray-900 via-slate-800 to-gray-700",
  drinks:     "from-sky-900 via-blue-800 to-sky-700",
  shisha:     "from-indigo-900 via-purple-800 to-indigo-700",
};

function greeting(lang: "en" | "ar") {
  const h = new Date().getHours();
  if (h < 12) return lang === "ar" ? "صباح الخير" : "Good Morning";
  if (h < 17) return lang === "ar" ? "طيب النهار" : "Good Afternoon";
  return lang === "ar" ? "مساء النور" : "Good Evening";
}

// Single Item Card - Full Screen
function TikTokItem({ item, lang, isRTL, onAdd, isInCart, getQty, justAdded }: {
  item: MenuItem; lang: "en" | "ar"; isRTL: boolean;
  onAdd: (item: MenuItem) => void;
  isInCart: (id: string) => boolean; getQty: (id: string) => number;
  justAdded: string | null;
}) {
  const added = justAdded === item.id;
  const inCart = isInCart(item.id);
  const qty = getQty(item.id);
  const name = lang === "ar" ? item.nameAr : item.name;
  const desc = lang === "ar" ? item.descriptionAr : item.description;
  const gradient = CAT_GRADIENTS[item.category] || "from-gray-900 via-gray-800 to-gray-700";

  return (
    <div className={`h-screen w-full snap-start flex flex-col relative bg-gradient-to-br ${gradient}`}>
      {/* Background Image - Lazy */}
      {item.image && (
        <div className="absolute inset-0">
          <LazyImage 
            src={item.image} 
            alt={name}
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/60 text-sm font-medium">{greeting(lang)}</p>
            <h2 className="text-white text-3xl font-bold mt-1" style={{ fontFamily: "Georgia, serif" }}>{name}</h2>
          </div>
          <button
            onClick={() => onAdd(item)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
              added ? "bg-green-500 scale-110" : inCart ? "bg-primary scale-110" : "bg-white/20 backdrop-blur-md hover:bg-white/30 active:scale-95"
            }`}
          >
            {added ? <Check size={24} strokeWidth={3} className="text-white" /> : <Plus size={24} strokeWidth={2.5} className="text-white" />}
            {inCart && !added && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">{qty}</span>
            )}
          </button>
        </div>

        {/* Center Image - Lazy */}
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="relative">
            {item.image ? (
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                <LazyImage 
                  src={item.image} 
                  alt={name}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border-4 border-white/20">
                <span className="text-6xl">🍽️</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Info */}
        <div className="pb-8">
          {desc && (
            <p className="text-white/80 text-base mb-4 text-center">{desc}</p>
          )}
          
          <div className="text-center mb-6">
            <span className="text-5xl font-bold text-white">{item.price}</span>
            <span className="text-xl text-white/80 ml-2">LE</span>
          </div>

          {/* Category Badge */}
          <div className="flex justify-center">
            <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-sm font-medium">
              {CATS.find(c => c.id === item.category)?.emoji} {lang === "ar" ? CATS.find(c => c.id === item.category)?.ar : CATS.find(c => c.id === item.category)?.en}
            </span>
          </div>
        </div>

        {/* Swipe Indicator */}
        <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center text-white/40">
          <ChevronDown size={24} className="animate-bounce" />
          <span className="text-xs mt-1">Swipe</span>
        </div>
      </div>
    </div>
  );
}

export default function Menu() {
  const { lang, isRTL } = useLang();
  const { addItem, isInCart, getQty } = useCart();
  const [, navigate] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch menu from Firebase
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
    });
    return () => off(ref(db, "menu"));
  }, []);

  // Filter and group items
  const filteredItems = useMemo(() => {
    let result = items.filter(i => i.available);
    if (cat !== "all") result = result.filter(i => i.category === cat);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => 
        i.name.toLowerCase().includes(q) || 
        i.nameAr.includes(q)
      );
    }
    return result;
  }, [items, cat, search]);

  const handleAdd = (item: MenuItem) => {
    addItem({ id: item.id, name: item.name, nameAr: item.nameAr, price: item.price, category: item.category, image: item.image });
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 1500);
  };

  // Handle scroll to update current index
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollTop = scrollRef.current.scrollTop;
    const itemHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    setCurrentIndex(newIndex);
  };

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  if (loading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🍽️</span>
          </div>
          <p className="text-white/60">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full fixed inset-0 bg-black" dir={isRTL ? "rtl" : "ltr"}>
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-white text-xl font-bold" style={{ fontFamily: "Georgia, serif" }}>Azura</h1>
          <span className="text-white/60 text-sm">({currentIndex + 1}/{filteredItems.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/barista")}
            className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
          >
            <Sparkles size={20} className="text-white" />
          </button>
          <button
            onClick={() => navigate("/cart")}
            className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
          >
            <span className="text-white text-sm font-bold">🛒</span>
          </button>
        </div>
      </div>

      {/* Search Overlay */}
      <div className="fixed top-16 left-4 right-4 z-30">
        <div className="relative">
          <input
            type="text"
            placeholder={tr("Search...", "ابحث...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-3 px-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/40 outline-none text-center"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X size={18} className="text-white/60" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="fixed top-32 left-0 right-0 z-30 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                cat === c.id
                  ? "bg-white text-gray-900 shadow-lg"
                  : "bg-white/10 text-white/80 backdrop-blur-md hover:bg-white/20"
              }`}
            >
              {c.emoji} {lang === "ar" ? c.ar : c.en}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Scroll Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ paddingTop: "160px", paddingBottom: "40px" }}
      >
        {filteredItems.length === 0 ? (
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-6xl mb-4">🔍</p>
              <p className="text-white/60 text-lg">{tr("No items found", "لا توجد نتائج")}</p>
            </div>
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <TikTokItem
              key={item.id}
              item={item}
              lang={lang as "en" | "ar"}
              isRTL={isRTL}
              onAdd={handleAdd}
              isInCart={isInCart}
              getQty={getQty}
              justAdded={justAdded}
            />
          ))
        )}
      </div>

      {/* Progress Indicator */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1">
        {filteredItems.slice(0, Math.min(filteredItems.length, 15)).map((_, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${
              i === currentIndex % 15 ? "h-6 bg-white" : "h-2 bg-white/30"
            }`}
          />
        ))}
        {filteredItems.length > 15 && (
          <span className="text-white/40 text-[10px] text-center mt-1">...</span>
        )}
      </div>
    </div>
  );
}