import { useState, useEffect, useMemo, useRef } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { Plus, Check, ChevronDown, X, Star } from "lucide-react";

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
    category: String(raw.category || "food"),
    available: raw.available !== false,
    image: String(raw.image || raw.img || ""),
  };
}

const CATS = [
  { id: "all", emoji: "✨", en: "All", ar: "الكل" },
  { id: "food", emoji: "🍽️", en: "Food", ar: "طعام" },
  { id: "sandwiches", emoji: "🥪", en: "Sandwiches", ar: "ساندوتشات" },
  { id: "mains", emoji: "🍖", en: "Mains", ar: "أطباق" },
  { id: "burgers", emoji: "🍔", en: "Burgers", ar: "برجر" },
  { id: "hot_drinks", emoji: "☕", en: "Hot", ar: "ساخن" },
  { id: "cold_drinks", emoji: "🧊", en: "Cold", ar: "بارد" },
  { id: "fresh", emoji: "🍹", en: "Fresh", ar: "عصائر" },
  { id: "milkshake", emoji: "🥛", en: "Shakes", ar: "شيك" },
  { id: "desserts", emoji: "🍰", en: "Desserts", ar: "حلويات" },
  { id: "shisha", emoji: "💨", en: "Shisha", ar: "شيشة" },
];

const CAT_THEMES: Record<string, { bg: string; accent: string; emoji: string; particle: string }> = {
  food:       { bg: "from-orange-500 via-amber-500 to-yellow-500", accent: "text-orange-600", emoji: "🍽️", particle: "✨" },
  sandwiches: { bg: "from-pink-500 via-rose-500 to-red-500", accent: "text-pink-600", emoji: "🥪", particle: "💕" },
  mains:      { bg: "from-emerald-500 via-green-500 to-teal-500", accent: "text-emerald-600", emoji: "🍖", particle: "🌟" },
  burgers:    { bg: "from-yellow-500 via-amber-500 to-orange-500", accent: "text-yellow-600", emoji: "🍔", particle: "🔥" },
  hot_drinks: { bg: "from-amber-600 via-orange-500 to-red-500", accent: "text-amber-600", emoji: "☕", particle: "💫" },
  cold_drinks:{ bg: "from-cyan-500 via-blue-500 to-indigo-500", accent: "text-cyan-600", emoji: "🧊", particle: "❄️" },
  fresh:      { bg: "from-lime-500 via-green-500 to-emerald-500", accent: "text-lime-600", emoji: "🍹", particle: "🌿" },
  milkshake:  { bg: "from-pink-400 via-fuchsia-500 to-purple-500", accent: "text-pink-500", emoji: "🥛", particle: "🩷" },
  desserts:   { bg: "from-violet-500 via-purple-500 to-fuchsia-500", accent: "text-violet-600", emoji: "🍰", particle: "💜" },
  shisha:     { bg: "from-indigo-500 via-purple-500 to-pink-500", accent: "text-indigo-600", emoji: "💨", particle: "🌬️" },
};

function StarRating({ item }: { item: MenuItem }) {
  const rating = Number(item.price) > 200 ? 4.5 : Number(item.price) > 100 ? 4 : 3.5;
  return (
    <div className="flex items-center justify-center gap-1">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14} className={i <= Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-white/30"} />
      ))}
    </div>
  );
}

// Hero White Add Button
function HeroAddButton({ onAdd, justAdded, inCart, qty }: {
  onAdd: () => void; justAdded: boolean; inCart: boolean; qty: number;
}) {
  const getBg = () => {
    if (justAdded) return "bg-gradient-to-r from-green-500 to-emerald-500";
    if (inCart) return "bg-gradient-to-r from-amber-500 to-orange-500";
    return "bg-white";
  };
  const getText = () => {
    if (justAdded) return "✅ Added!";
    if (inCart) return `+ Add Another (${qty})`;
    return "🛒 Add to Cart";
  };
  const getTextColor = () => {
    if (justAdded || inCart) return "text-white";
    return "text-gray-800";
  };

  return (
    <button
      onClick={onAdd}
      className={`
        w-full py-5 rounded-2xl font-bold text-xl
        ${getBg()} ${getTextColor()}
        shadow-2xl hover:scale-[1.02] active:scale-[0.98]
        transition-all duration-300
        ${justAdded ? "animate-pulse" : ""}
      `}
    >
      {getText()}
    </button>
  );
}

// Cinematic Placeholder with Item Name
function CinematicPlaceholder({ name, category }: { name: string; category: string }) {
  const theme = CAT_THEMES[category] || CAT_THEMES.food;
  return (
    <div className={`w-full h-full bg-gradient-to-br ${theme.bg} flex items-center justify-center relative overflow-hidden`}>
      {/* Cinematic name display */}
      <div className="text-center z-10">
        <p className="text-white/90 text-2xl font-bold drop-shadow-lg" style={{ textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>
          {name}
        </p>
        <p className="text-white/60 text-sm mt-2">{theme.emoji}</p>
      </div>
      {/* Animated shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
  );
}

// Joyful Item Card - Reel Style
function JoyfulItem({ item, lang, onAdd, isInCart, getQty, justAdded }: {
  item: MenuItem; lang: "en" | "ar";
  onAdd: (item: MenuItem) => void;
  isInCart: (id: string) => boolean; getQty: (id: string) => number;
  justAdded: string | null;
}) {
  const [imageError, setImageError] = useState(false);
  const added = justAdded === item.id;
  const inCart = isInCart(item.id);
  const qty = getQty(item.id);
  const name = lang === "ar" ? item.nameAr : item.name;
  const desc = lang === "ar" ? item.descriptionAr : item.description;
  const theme = CAT_THEMES[item.category] || CAT_THEMES.food;
  const hasValidImage = item.image && !imageError;

  return (
    <div className="h-screen w-full snap-start flex flex-col relative overflow-hidden">
      {/* Background */}
      {hasValidImage ? (
        <div className="absolute inset-0">
          <img src={item.image} alt="" className="w-full h-full object-cover blur-xl scale-110" onError={() => setImageError(true)} />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800">
          <CinematicPlaceholder name={name} category={item.category} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-4">
        {/* Category Badge */}
        <div className="flex justify-center mb-2">
          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-xs font-bold flex items-center gap-1">
            <span>{theme.emoji}</span>
            {lang === "ar" ? CATS.find(c => c.id === item.category)?.ar : CATS.find(c => c.id === item.category)?.en}
          </span>
        </div>

        {/* Main Image */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {hasValidImage ? (
              <div className="relative w-56 h-56 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                <img src={item.image} alt={name} className="w-full h-full object-cover" onError={() => setImageError(true)} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl shadow-xl border-3 border-white">
                  {theme.particle}
                </div>
              </div>
            ) : (
              <div className="w-56 h-56 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                <CinematicPlaceholder name={name} category={item.category} />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="text-center mb-2">
          <h2 className="text-white text-2xl font-bold drop-shadow-lg" style={{ fontFamily: "Georgia, serif" }}>{name}</h2>
          <StarRating item={item} />
          {desc && <p className="text-white/60 text-xs max-w-xs mx-auto mt-1">{desc}</p>}
        </div>

        {/* Price */}
        <div className="flex justify-center mb-3">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-5 py-1 rounded-full shadow-lg">
            <span className="text-white text-xl font-bold">{item.price}</span>
            <span className="text-white/80 text-xs ml-1 font-bold">LE</span>
          </div>
        </div>

        {/* Hero Add Button - ABOVE nav bar with padding */}
        <div className="pb-24">
          <HeroAddButton onAdd={() => onAdd(item)} justAdded={added} inCart={inCart} qty={qty} />
        </div>

        {/* Swipe hint */}
        <div className="flex flex-col items-center text-white/30">
          <div className="animate-bounce"><ChevronDown size={18} /></div>
        </div>
      </div>
    </div>
  );
}

export default function Menu() {
  const { lang, isRTL } = useLang();
  const { addItem, isInCart, getQty } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load menu from Firebase
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

  // Filter items
  const filteredItems = useMemo(() => {
    let result = items.filter(i => i.available);
    if (cat !== "all") result = result.filter(i => i.category === cat);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(q) || i.nameAr.includes(q));
    }
    return result;
  }, [items, cat, search]);

  const handleAdd = (item: MenuItem) => {
    addItem({ id: item.id, name: item.name, nameAr: item.nameAr, price: item.price, category: item.category, image: item.image });
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 1500);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollTop = scrollRef.current.scrollTop;
    const newIndex = Math.round(scrollTop / window.innerHeight);
    setCurrentIndex(Math.min(newIndex, filteredItems.length - 1));
  };

  useEffect(() => {
    setCurrentIndex(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [cat, search]);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full fixed inset-0">
      {/* Search */}
      <div className="fixed top-20 left-4 right-4 z-40">
        <input
          type="text"
          placeholder={tr("Search...", "ابحث...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full py-3 px-6 rounded-2xl bg-white/20 backdrop-blur-xl border-2 border-white/30 text-white placeholder:text-white/50 outline-none text-center"
        />
      </div>

      {/* Categories */}
      <div className="fixed top-28 left-0 right-0 z-40 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${cat === c.id ? "bg-white text-gray-800" : "bg-white/20 text-white hover:bg-white/30"}`}
            >
              {c.emoji} {lang === "ar" ? c.ar : c.en}
            </button>
          ))}
          {cat !== "all" && (
            <button onClick={() => { setCat("all"); setSearch(""); }} className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-500 text-white flex-shrink-0">
              <X size={12} className="inline mr-1" />
            </button>
          )}
        </div>
      </div>

      {/* Items Counter */}
      <div className="fixed top-4 right-16 z-40">
        <span className="px-2 py-1 rounded-full bg-white/20 text-white text-xs backdrop-blur-md">
          {filteredItems.length}
        </span>
      </div>

      {/* Main Scroll */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ paddingTop: "160px" }}
      >
        {filteredItems.length === 0 ? (
          <div className="h-screen flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-5xl mb-3">🔍</p>
              <p className="text-lg font-bold">No items found</p>
            </div>
          </div>
        ) : (
          filteredItems.map((item) => (
            <JoyfulItem
              key={item.id}
              item={item}
              lang={lang as "en" | "ar"}
              onAdd={handleAdd}
              isInCart={isInCart}
              getQty={getQty}
              justAdded={justAdded}
            />
          ))
        )}
      </div>

      {/* Progress */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 z-40 hidden md:block">
        <div className="bg-white/10 backdrop-blur-md rounded-full px-1.5 py-2 flex flex-col items-center">
          <span className="text-white text-[10px] font-bold">{currentIndex + 1}</span>
          <div className="w-0.5 h-20 bg-white/20 rounded-full overflow-hidden my-1">
            <div className="w-full bg-gradient-to-b from-pink-500 to-purple-500 rounded-full transition-all" style={{ height: `${((currentIndex + 1) / Math.max(filteredItems.length, 1)) * 100}%` }} />
          </div>
          <span className="text-white/60 text-[9px]">{filteredItems.length}</span>
        </div>
      </div>
    </div>
  );
}
