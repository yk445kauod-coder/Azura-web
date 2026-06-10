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

const CAT_THEMES: Record<string, { bg: string; accent: string; emoji: string; particle: string; placeholder: string }> = {
  food:       { bg: "from-orange-500 via-amber-500 to-yellow-500", accent: "text-orange-600", emoji: "🍽️", particle: "✨", placeholder: "🍽️" },
  sandwiches: { bg: "from-pink-500 via-rose-500 to-red-500", accent: "text-pink-600", emoji: "🥪", particle: "💕", placeholder: "🥪" },
  mains:      { bg: "from-emerald-500 via-green-500 to-teal-500", accent: "text-emerald-600", emoji: "🍖", particle: "🌟", placeholder: "🍖" },
  burgers:    { bg: "from-yellow-500 via-amber-500 to-orange-500", accent: "text-yellow-600", emoji: "🍔", particle: "🔥", placeholder: "🍔" },
  hot_drinks: { bg: "from-amber-600 via-orange-500 to-red-500", accent: "text-amber-600", emoji: "☕", particle: "💫", placeholder: "☕" },
  cold_drinks:{ bg: "from-cyan-500 via-blue-500 to-indigo-500", accent: "text-cyan-600", emoji: "🧊", particle: "❄️", placeholder: "🥤" },
  fresh:      { bg: "from-lime-500 via-green-500 to-emerald-500", accent: "text-lime-600", emoji: "🍹", particle: "🌿", placeholder: "🍹" },
  milkshake:  { bg: "from-pink-400 via-fuchsia-500 to-purple-500", accent: "text-pink-500", emoji: "🥛", particle: "🩷", placeholder: "🥛" },
  desserts:   { bg: "from-violet-500 via-purple-500 to-fuchsia-500", accent: "text-violet-600", emoji: "🍰", particle: "💜", placeholder: "🍰" },
  shisha:     { bg: "from-indigo-500 via-purple-500 to-pink-500", accent: "text-indigo-600", emoji: "💨", particle: "🌬️", placeholder: "💨" },
};

// Floating particles
function Particles() {
  const emojis = ["✨", "⭐", "💫", "🌟", "💕", "🔥"];
  return (
    <div className="absolute inset-0 overflow-hidden">
      {emojis.map((emoji, i) => (
        <div
          key={i}
          className="absolute text-2xl animate-float"
          style={{
            left: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.5}s`,
            opacity: 0.3,
          }}
        >
          {emoji}
        </div>
      ))}
    </div>
  );
}

// Star Rating
function StarRating({ item }: { item: MenuItem }) {
  const rating = Number(item.price) > 200 ? 4.5 : Number(item.price) > 100 ? 4 : 3.5;
  return (
    <div className="flex items-center justify-center gap-1">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={16}
          className={i <= Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : i - 0.5 <= rating ? "text-yellow-400/50" : "text-white/30"}
        />
      ))}
      <span className="text-white/60 text-xs ml-1">{rating}</span>
    </div>
  );
}

// Hero Add Button
function HeroAddButton({ onAdd, justAdded, inCart, qty }: {
  onAdd: () => void; justAdded: boolean; inCart: boolean; qty: number;
}) {
  const getBg = () => {
    if (justAdded) return "from-green-500 to-emerald-500";
    if (inCart) return "from-amber-500 to-orange-500";
    return "from-pink-500 via-rose-500 to-red-500";
  };
  
  const getText = () => {
    if (justAdded) return "✅ Added!";
    if (inCart) return `+ Add Another (${qty} in cart)`;
    return "🛒 Add to Cart";
  };

  return (
    <button
      onClick={onAdd}
      className={`
        w-full py-4 rounded-2xl font-bold text-lg
        bg-gradient-to-r ${getBg()}
        shadow-xl hover:scale-[1.02] active:scale-[0.98]
        transition-all duration-300
        ${justAdded ? "animate-pulse" : ""}
      `}
    >
      {getText()}
    </button>
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
      {/* Full Background Image - Semi Blur + Dark Shaded */}
      {hasValidImage ? (
        <div className="absolute inset-0">
          <img 
            src={item.image} 
            alt="" 
            className="w-full h-full object-cover blur-xl scale-110"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent" />
        </div>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg}`}>
          <Particles />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-4">
        {/* Category Badge */}
        <div className="flex justify-center mb-3">
          <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-sm font-bold flex items-center gap-2">
            <span className="text-lg">{theme.emoji}</span>
            {lang === "ar" ? CATS.find(c => c.id === item.category)?.ar : CATS.find(c => c.id === item.category)?.en}
          </span>
        </div>

        {/* Main Image */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {hasValidImage ? (
              <div className="relative w-64 h-64 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                <img src={item.image} alt={name} className="w-full h-full object-cover" onError={() => setImageError(true)} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl shadow-xl border-4 border-white">
                  {theme.particle}
                </div>
              </div>
            ) : (
              <div className="w-64 h-64 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border-4 border-white/20">
                <span className="text-7xl">{theme.placeholder}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="text-center mb-3">
          <h2 className="text-white text-3xl font-bold drop-shadow-lg" style={{ fontFamily: "Georgia, serif" }}>{name}</h2>
          <StarRating item={item} />
          {desc && <p className="text-white/60 text-sm max-w-xs mx-auto mt-1">{desc}</p>}
        </div>

        {/* Price */}
        <div className="flex justify-center mb-3">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-6 py-1.5 rounded-full shadow-lg">
            <span className="text-white text-2xl font-bold">{item.price}</span>
            <span className="text-white/80 text-sm ml-1 font-bold">LE</span>
          </div>
        </div>

        {/* Hero Button */}
        <HeroAddButton onAdd={() => onAdd(item)} justAdded={added} inCart={inCart} qty={qty} />

        {/* Swipe hint */}
        <div className="flex flex-col items-center text-white/30 mt-2">
          <div className="animate-bounce"><ChevronDown size={20} /></div>
          <span className="text-xs">Swipe</span>
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
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-bold">Loading menu...</p>
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
              <X size={12} className="inline mr-1" /> {tr("Clear", "مسح")}
            </button>
          )}
        </div>
      </div>

      {/* Items Counter */}
      <div className="fixed top-4 right-16 z-40">
        <span className="px-2 py-1 rounded-full bg-white/20 text-white text-xs backdrop-blur-md">
          {filteredItems.length} items
        </span>
      </div>

      {/* Main Scroll */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ paddingTop: "160px", paddingBottom: "80px" }}
      >
        {filteredItems.length === 0 ? (
          <div className="h-screen flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-6xl mb-4">🔍</p>
              <p className="text-xl font-bold">No items found</p>
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
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:block">
        <div className="bg-white/10 backdrop-blur-md rounded-full px-2 py-3 flex flex-col items-center">
          <span className="text-white text-xs font-bold">{currentIndex + 1}</span>
          <div className="w-1 h-24 bg-white/20 rounded-full overflow-hidden my-1">
            <div className="w-full bg-gradient-to-b from-pink-500 to-purple-500 rounded-full transition-all" style={{ height: `${((currentIndex + 1) / filteredItems.length) * 100}%` }} />
          </div>
          <span className="text-white/60 text-[10px]">{filteredItems.length}</span>
        </div>
      </div>
    </div>
  );
}
