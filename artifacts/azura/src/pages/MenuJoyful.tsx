import { useState, useEffect, useMemo, useRef } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "wouter";
import { Plus, Check, ChevronDown, Sparkles, X, Heart, Star, Flame } from "lucide-react";

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
  { id: "all",        emoji: "🎉", en: "All",        ar: "الكل"       },
  { id: "food",       emoji: "🍽️", en: "Food",       ar: "طعام"          },
  { id: "sandwiches", emoji: "🥪", en: "Sandwiches", ar: "ساندوتشات"    },
  { id: "mains",      emoji: "🍖", en: "Mains",     ar: "أطباق" },
  { id: "burgers",    emoji: "🍔", en: "Burgers",    ar: "برجر"         },
  { id: "hot_drinks", emoji: "☕", en: "Hot Drinks",  ar: "مشروبات" },
  { id: "cold_drinks",emoji: "🧊", en: "Cold Drinks", ar: "باردة" },
  { id: "fresh",      emoji: "🍹", en: "Fresh Juice", ar: "عصائر"  },
  { id: "milkshake",  emoji: "🥛", en: "Milkshakes",  ar: "شيك"      },
  { id: "desserts",   emoji: "🍰", en: "Desserts",    ar: "حلويات"       },
  { id: "shisha",     emoji: "💨", en: "Shisha",      ar: "شيشة"         },
];

// Joyful colorful gradients
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
  extras:     { bg: "from-gray-500 via-slate-500 to-zinc-500", accent: "text-gray-500", emoji: "➕", particle: "⚡", placeholder: "➕" },
  drinks:     { bg: "from-sky-500 via-blue-500 to-cyan-500", accent: "text-sky-600", emoji: "🥤", particle: "💧", placeholder: "🥤" },
  shisha:     { bg: "from-indigo-500 via-purple-500 to-pink-500", accent: "text-indigo-600", emoji: "💨", particle: "🌬️", placeholder: "💨" },
};

// Floating particles
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute text-2xl animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
            opacity: 0.3,
          }}
        >
          {["✨", "⭐", "💫", "🌟", "💥", "🎉"][i % 6]}
        </div>
      ))}
    </div>
  );
}

function greeting(lang: "en" | "ar") {
  const h = new Date().getHours();
  if (h < 12) return lang === "ar" ? "صباح الخير ☀️" : "Good Morning ☀️";
  if (h < 17) return lang === "ar" ? "طيب النهار 🌤️" : "Good Afternoon 🌤️";
  return lang === "ar" ? "مساء النور 🌙" : "Good Evening 🌙";
}

// Joyful Star Rating
function StarRating({ item }: { item: MenuItem }) {
  // Simple hash based on item name for consistent "ratings"
  const hash = item.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const rating = 4 + (hash % 10) / 10; // 4.0 to 5.0
  
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-white/30"}
        />
      ))}
      <span className="text-white/70 text-xs ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// Hero Add Button - Big & Prominent
function HeroAddButton({ onAdd, justAdded, inCart, qty }: {
  onAdd: () => void; justAdded: boolean; inCart: boolean; qty: number;
}) {
  const baseClasses = "w-full py-4 px-8 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl";
  
  if (justAdded) {
    return (
      <button onClick={onAdd} className={`${baseClasses} bg-gradient-to-r from-green-500 to-emerald-600 text-white scale-105`}>
        <Check size={28} strokeWidth={3} />
        <span>Added to Cart!</span>
      </button>
    );
  }
  
  if (inCart) {
    return (
      <button onClick={onAdd} className={`${baseClasses} bg-gradient-to-r from-amber-500 to-orange-500 text-white`}>
        <Plus size={24} />
        <span>Add Another ({qty} in cart)</span>
      </button>
    );
  }
  
  return (
    <button onClick={onAdd} className={`${baseClasses} bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-pink-500/50 hover:shadow-pink-500/70`}>
      <Plus size={28} />
      <span>Add to Cart</span>
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
  
  // Use placeholder if no image or image error
  const hasValidImage = item.image && !imageError;

  return (
    <div className="h-screen w-full snap-start flex flex-col relative overflow-hidden">
      {/* Full Background Image - Super Blurred & Dark */}
      {hasValidImage ? (
        <div className="absolute inset-0">
          {/* Blurred background */}
          <img 
            src={item.image} 
            alt="" 
            className="w-full h-full object-cover blur-3xl scale-130 brightness-30"
            onError={() => setImageError(true)}
          />
          {/* Multiple dark gradients for eye comfort */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        </div>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg}`}>
          <Particles />
        </div>
      )}

      {/* Content - Centered Layout */}
      <div className="relative z-10 flex flex-col h-full p-6">
        {/* Top Bar - Category */}
        <div className="flex justify-center mb-4">
          <span className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-sm font-bold flex items-center gap-2 shadow-lg">
            <span className="text-xl">{theme.emoji}</span>
            {lang === "ar" ? CATS.find(c => c.id === item.category)?.ar : CATS.find(c => c.id === item.category)?.en}
          </span>
        </div>

        {/* Main Image - Hero Size */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {hasValidImage ? (
              <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                <img 
                  src={item.image} 
                  alt={name} 
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Emoji badge on image */}
                <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl shadow-xl border-4 border-white">
                  {theme.particle}
                </div>
              </div>
            ) : (
              /* Placeholder when no image */
              <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md flex items-center justify-center border-4 border-white/20">
                <span className="text-8xl drop-shadow-lg">{theme.placeholder}</span>
                {/* Glowing ring */}
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 blur-xl" />
              </div>
            )}
            
            {/* Glowing ring behind image */}
            {hasValidImage && (
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 blur-xl -z-10" />
            )}
          </div>
        </div>

        {/* Item Info */}
        <div className="text-center mb-4 space-y-2">
          <h2 className="text-white text-4xl font-bold drop-shadow-lg" style={{ fontFamily: "Georgia, serif" }}>
            {name}
          </h2>
          
          {/* Star rating */}
          <StarRating item={item} />
          
          {desc && (
            <p className="text-white/60 text-sm max-w-xs mx-auto">{desc}</p>
          )}
        </div>

        {/* Price */}
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-8 py-2 rounded-full shadow-lg">
            <span className="text-white text-3xl font-bold">{item.price}</span>
            <span className="text-white/80 text-lg ml-2 font-bold">LE</span>
          </div>
        </div>

        {/* HERO Add Button - Big at bottom */}
        <div className="mb-4">
          <HeroAddButton 
            onAdd={() => onAdd(item)} 
            justAdded={added} 
            inCart={inCart} 
            qty={qty}
          />
        </div>

        {/* Swipe hint */}
        <div className="flex flex-col items-center text-white/30">
          <div className="animate-bounce">
            <ChevronDown size={24} />
          </div>
          <span className="text-xs mt-1">Swipe for more</span>
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
    const itemHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    setCurrentIndex(newIndex);
  };

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  if (loading) {
    return (
      <div className={`h-screen w-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">🍽️</div>
          <h2 className="text-white text-2xl font-bold mb-2">Loading Menu...</h2>
          <p className="text-white/70">Getting your delicious items ✨</p>
          <div className="flex gap-2 justify-center mt-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-full fixed inset-0 ${isRTL ? "rtl" : "ltr"}`}>
      {/* Joyful Header */}
      <div className="fixed top-0 left-0 right-0 z-40 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl">🍴</span>
            </div>
            <div>
              <h1 className="text-white text-xl font-bold" style={{ fontFamily: "Georgia, serif" }}>Azura</h1>
              <p className="text-white/70 text-xs">✨ {filteredItems.length} items</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/barista")}
              className="p-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg hover:scale-105 transition-transform"
            >
              <Sparkles size={20} className="text-white" />
            </button>
            <button
              onClick={() => navigate("/cart")}
              className="p-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg hover:scale-105 transition-transform"
            >
              <span className="text-xl">🛒</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="fixed top-24 left-4 right-4 z-40">
        <div className="relative">
          <input
            type="text"
            placeholder={tr("Search delicious items...", "ابحث عن أشياء لذيذة...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-4 px-6 rounded-2xl bg-white/20 backdrop-blur-xl border-2 border-white/30 text-white placeholder:text-white/50 outline-none text-center text-lg font-medium shadow-xl"
          />
          {search && (
            <button 
              onClick={() => setSearch("")} 
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30"
            >
              <X size={18} className="text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="fixed top-40 left-0 right-0 z-40 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-lg ${
                cat === c.id
                  ? "bg-white text-gray-800 scale-105"
                  : "bg-white/20 backdrop-blur-md text-white hover:bg-white/30 hover:scale-105"
              }`}
            >
              {c.emoji} {lang === "ar" ? c.ar : c.en}
            </button>
          ))}
        </div>
      </div>

      {/* Main Scroll */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ paddingTop: "180px", paddingBottom: "40px" }}
      >
        {filteredItems.length === 0 ? (
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-8xl mb-4 animate-bounce">🔍</p>
              <p className="text-white text-xl font-bold">No items found</p>
              <p className="text-white/60 mt-2">Try a different search</p>
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

      {/* Joyful Progress */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40">
        <div className="flex flex-col items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-2 py-4">
          <span className="text-white text-xs font-bold">{currentIndex + 1}</span>
          <div className="w-1 h-32 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="w-full bg-gradient-to-b from-pink-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ height: `${((currentIndex + 1) / filteredItems.length) * 100}%` }}
            />
          </div>
          <span className="text-white/60 text-[10px]">{filteredItems.length}</span>
        </div>
      </div>
    </div>
  );
}