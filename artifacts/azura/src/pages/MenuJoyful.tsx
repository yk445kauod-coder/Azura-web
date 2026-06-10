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
  extras:     { bg: "from-gray-500 via-slate-500 to-zinc-500", accent: "text-gray-500", emoji: "➕", particle: "⚡" },
  drinks:     { bg: "from-sky-500 via-blue-500 to-cyan-500", accent: "text-sky-600", emoji: "🥤", particle: "💧" },
  shisha:     { bg: "from-indigo-500 via-purple-500 to-pink-500", accent: "text-indigo-600", emoji: "💨", particle: "🌬️" },
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

// Joyful Add Button - Fixed
function JoyfulButton({ onAdd, justAdded, inCart, qty }: {
  onAdd: () => void; justAdded: boolean; inCart: boolean; qty: number;
}) {
  // Button shows check when justAdded (just clicked), otherwise shows plus
  // If in cart with qty > 1, show quantity badge next to button
  const showCheck = justAdded;
  
  return (
    <div className="flex items-center gap-3">
      {/* Quantity Badge - shown separately when in cart */}
      {inCart && qty > 1 && !justAdded && (
        <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 shadow-lg">
          <span className="text-white font-bold">{qty}x</span>
        </div>
      )}
      
      {/* Main Add Button */}
      <button
        onClick={onAdd}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
          showCheck
            ? "bg-gradient-to-r from-green-400 to-emerald-500 scale-110 shadow-green-500/50" 
            : inCart 
              ? "bg-gradient-to-r from-amber-400 to-yellow-500 scale-105 shadow-amber-500/50"
              : "bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-110 active:scale-95 shadow-purple-500/50 hover:shadow-2xl"
        }`}
      >
        {showCheck ? (
          <Check size={28} strokeWidth={3} className="text-white" />
        ) : (
          <Plus size={28} strokeWidth={2.5} className="text-white" />
        )}
        
        {/* Pulse ring on click */}
        {showCheck && (
          <div className="absolute inset-0 rounded-full bg-green-400/40 animate-ping" />
        )}
      </button>
      
      {/* In Cart indicator - small dot */}
      {inCart && !showCheck && (
        <div className="w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
      )}
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

// Joyful Item Card
function JoyfulItem({ item, lang, onAdd, isInCart, getQty, justAdded }: {
  item: MenuItem; lang: "en" | "ar";
  onAdd: (item: MenuItem) => void;
  isInCart: (id: string) => boolean; getQty: (id: string) => number;
  justAdded: string | null;
}) {
  const added = justAdded === item.id;
  const inCart = isInCart(item.id);
  const qty = getQty(item.id);
  const name = lang === "ar" ? item.nameAr : item.name;
  const desc = lang === "ar" ? item.descriptionAr : item.description;
  const theme = CAT_THEMES[item.category] || CAT_THEMES.food;

  return (
    <div className={`h-screen w-full snap-start flex flex-col relative overflow-hidden`}>
      {/* Joyful gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg}`}>
        <Particles />
      </div>
      
      {/* Background Image with overlay */}
      {item.image && (
        <div className="absolute inset-0">
          <img src={item.image} alt={name} className="w-full h-full object-cover opacity-25 blur-sm scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-6">
        {/* Header with Greeting + Add Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-left">
            <p className="text-white/60 text-xs">{greeting(lang)}</p>
          </div>
          
          {/* Add Button in Header */}
          <JoyfulButton 
            onAdd={() => onAdd(item)} 
            justAdded={added} 
            inCart={inCart} 
            qty={qty}
          />
        </div>

        {/* Category Badge */}
        <div className="flex justify-center mb-4">
          <span className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-bold flex items-center gap-2 shadow-lg">
            <span className="text-xl">{theme.emoji}</span>
            {lang === "ar" ? CATS.find(c => c.id === item.category)?.ar : CATS.find(c => c.id === item.category)?.en}
          </span>
        </div>

        {/* Main Image */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="relative">
            {/* Glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} rounded-3xl blur-2xl opacity-50 scale-110`} />
            
            {item.image ? (
              <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30 transform hover:scale-105 transition-transform duration-500">
                <img src={item.image} alt={name} className="w-full h-full object-cover" />
                
                {/* Joyful overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                
                {/* Item emoji badge */}
                <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-2xl shadow-lg">
                  {theme.particle}
                </div>
              </div>
            ) : (
              <div className="w-72 h-72 md:w-80 md:h-80 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border-4 border-white/30">
                <span className="text-8xl">{theme.emoji}</span>
              </div>
            )}
          </div>
        </div>

        {/* Item Info */}
        <div className="text-center mb-4">
          <h2 className="text-white text-3xl font-bold mb-2 drop-shadow-lg" style={{ fontFamily: "Georgia, serif" }}>
            {name}
          </h2>
          
          {/* Star rating */}
          <StarRating item={item} />
          
          {desc && (
            <p className="text-white/80 text-sm mt-2 max-w-xs mx-auto">{desc}</p>
          )}
        </div>

        {/* Price Tag */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur-md opacity-75" />
            <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 px-8 py-3 rounded-2xl shadow-xl">
              <span className="text-white text-4xl font-bold drop-shadow-lg">{item.price}</span>
              <span className="text-white/90 text-xl ml-2 font-bold">LE</span>
            </div>
          </div>
        </div>

        {/* Swipe hint */}
        <div className="flex flex-col items-center text-white/50 mb-4">
          <div className="animate-bounce">
            <ChevronDown size={28} />
          </div>
          <span className="text-xs mt-1 font-medium">Swipe for more 🎉</span>
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