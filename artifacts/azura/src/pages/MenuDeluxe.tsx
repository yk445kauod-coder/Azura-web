import { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "wouter";
import { Search, Plus, Check, Sparkles, ChevronDown, ChevronUp, X } from "lucide-react";

const SkeletonCard = lazy(() => import("./SkeletonCard"));

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

// Deluxe category definitions with icons and colors
const CATS = [
  { id: "all",        emoji: "✨", en: "Menu",        ar: "القائمة"       },
  { id: "food",       emoji: "🍽️", en: "Food",       ar: "طعام"          },
  { id: "sandwiches", emoji: "🥪", en: "Sandwiches", ar: "ساندوتشات"    },
  { id: "mains",      emoji: "🍖", en: "Main Dishes", ar: "أطباق رئيسية" },
  { id: "burgers",    emoji: "🍔", en: "Burgers",    ar: "برجر"         },
  { id: "hot_drinks", emoji: "☕", en: "Hot Drinks",  ar: "مشروبات ساخنة" },
  { id: "cold_drinks",emoji: "🧊", en: "Cold Drinks", ar: "مشروبات باردة" },
  { id: "fresh",      emoji: "🍹", en: "Fresh Juice", ar: "عصائر طازجة"  },
  { id: "milkshake",  emoji: "🥛", en: "Milkshakes",  ar: "ميلك شيك"      },
  { id: "desserts",   emoji: "🍰", en: "Desserts",    ar: "حلويات"       },
  { id: "extras",     emoji: "➕", en: "Extras",      ar: "إضافات"       },
  { id: "drinks",     emoji: "🥤", en: "Soft Drinks", ar: "مشروبات"       },
  { id: "shisha",     emoji: "💨", en: "Shisha",      ar: "شيشة"         },
];

const CAT_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  food:       { bg: "from-amber-50 to-orange-50", border: "border-amber-200", icon: "text-amber-600" },
  sandwiches: { bg: "from-red-50 to-orange-50", border: "border-red-200", icon: "text-red-600" },
  mains:      { bg: "from-emerald-50 to-teal-50", border: "border-emerald-200", icon: "text-emerald-600" },
  burgers:    { bg: "from-yellow-50 to-amber-50", border: "border-yellow-200", icon: "text-yellow-600" },
  hot_drinks: { bg: "from-brown-50 to-orange-50", border: "border-amber-700", icon: "text-amber-800" },
  cold_drinks:{ bg: "from-blue-50 to-cyan-50", border: "border-blue-200", icon: "text-blue-600" },
  fresh:      { bg: "from-green-50 to-emerald-50", border: "border-green-200", icon: "text-green-600" },
  milkshake:  { bg: "from-pink-50 to-rose-50", border: "border-pink-200", icon: "text-pink-600" },
  desserts:   { bg: "from-purple-50 to-violet-50", border: "border-purple-200", icon: "text-purple-600" },
  extras:     { bg: "from-gray-50 to-slate-50", border: "border-gray-200", icon: "text-gray-600" },
  drinks:     { bg: "from-sky-50 to-blue-50", border: "border-sky-200", icon: "text-sky-600" },
  shisha:     { bg: "from-indigo-50 to-purple-50", border: "border-indigo-200", icon: "text-indigo-600" },
};

function greeting(lang: "en" | "ar") {
  const h = new Date().getHours();
  if (h < 12) return lang === "ar" ? "صباح الخير! ☀️" : "Good morning! ☀️";
  if (h < 17) return lang === "ar" ? "طيب النهار! 🌤️" : "Good afternoon! 🌤️";
  return lang === "ar" ? "مساء النور! 🌙" : "Good evening! 🌙";
}

// Deluxe Menu Item Row Component
function MenuItemRow({ item, lang, isRTL, isInCart, getQty, onAdd, justAdded }: {
  item: MenuItem; lang: "en" | "ar"; isRTL: boolean;
  isInCart: (id: string) => boolean; getQty: (id: string) => number;
  onAdd: (item: MenuItem) => void; justAdded: string | null;
}) {
  const added = justAdded === item.id;
  const inCart = isInCart(item.id);
  const qty = getQty(item.id);
  const name = lang === "ar" ? item.nameAr : item.name;

  return (
    <div className={`group flex items-center gap-4 py-4 px-4 rounded-xl transition-all duration-300 hover:bg-white/60 ${inCart ? 'bg-primary/5' : 'bg-white/30'}`}>
      {/* Item Image */}
      {item.image && (
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
          <img src={item.image} alt={name} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      
      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-800 text-base leading-tight">{name}</h3>
          <span className="font-extrabold text-primary text-lg whitespace-nowrap">{item.price} LE</span>
        </div>
        {item.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{item.description}</p>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={() => onAdd(item)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-lg ${
          added ? "bg-green-500 scale-95" : inCart ? "bg-primary scale-105" : "bg-gradient-to-br from-primary to-primary/80 hover:scale-110 active:scale-95"
        }`}
      >
        {added ? <Check size={18} strokeWidth={3} className="text-white" /> : <Plus size={18} strokeWidth={2.5} className="text-white" />}
        {inCart && !added && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{qty}</span>
        )}
      </button>
    </div>
  );
}

// Collapsible Category Section
function CategorySection({ catId, catName, emoji, items, lang, isRTL, colors, isInCart, getQty, onAdd, justAdded, defaultOpen = false }: {
  catId: string; catName: string; emoji: string; items: MenuItem[];
  lang: "en" | "ar"; isRTL: boolean; colors: { bg: string; border: string; icon: string };
  isInCart: (id: string) => boolean; getQty: (id: string) => number;
  onAdd: (item: MenuItem) => void; justAdded: string | null; defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`mb-6 rounded-2xl overflow-hidden border ${colors.border} bg-gradient-to-br ${colors.bg}`}>
      {/* Section Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-2xl ${colors.icon}`}>{emoji}</span>
          <div className="text-left">
            <h2 className="font-bold text-gray-800 text-lg">{catName}</h2>
            <span className="text-xs text-gray-500">{items.length} items</span>
          </div>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </button>

      {/* Items List */}
      {isOpen && (
        <div className="px-3 pb-3 space-y-1">
          {items.map((item) => (
            <MenuItemRow
              key={item.id}
              item={item}
              lang={lang as "en" | "ar"}
              isRTL={isRTL}
              isInCart={isInCart}
              getQty={getQty}
              onAdd={onAdd}
              justAdded={justAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Menu() {
  const { lang, isRTL } = useLang();
  const { addItem, isInCart, getQty } = useCart();
  const [, navigate] = useLocation();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["food", "hot_drinks"]));

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

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    items.forEach(item => {
      if (!item.available) return;
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [items]);

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groupedItems;
    const q = search.toLowerCase();
    const result: Record<string, MenuItem[]> = {};
    Object.entries(groupedItems).forEach(([cat, items]) => {
      const filtered = items.filter(i => 
        i.name.toLowerCase().includes(q) || 
        i.nameAr.includes(q) || 
        i.description.toLowerCase().includes(q)
      );
      if (filtered.length) result[cat] = filtered;
    });
    return result;
  }, [groupedItems, search]);

  const handleAdd = (item: MenuItem) => {
    addItem({ id: item.id, name: item.name, nameAr: item.nameAr, price: item.price, category: item.category, image: item.image });
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 1400);
  };

  const toggleCat = (catId: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  return (
    <div className="max-w-2xl mx-auto pb-24" dir={isRTL ? "rtl" : "ltr"}>
      {/* ── Elegant Header ── */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-amber-50 via-white to-white backdrop-blur-md border-b border-amber-100/50">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-amber-700">{greeting(lang)}</p>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Georgia, serif" }}>
                {tr("Azura Menu", "قائمة أزورا")}
              </h1>
            </div>
            <button
              onClick={() => navigate("/barista")}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <Sparkles size={14} /> {tr("AI Order", "اطلب بالذكاء")}
            </button>
          </div>

          {/* ── Search Bar ── */}
          <div className="relative">
            <Search size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? "right-3.5" : "left-3.5"}`} />
            <input
              type="text"
              placeholder={tr("Search menu...", "ابحث في القائمة...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full py-3 px-10 rounded-xl bg-white/80 border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all ${isRTL ? "text-right pr-4 pl-4" : "text-left pl-4 pr-4"}`}
            />
            {search && (
              <button onClick={() => setSearch("")} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-3.5" : "right-3.5"}`}>
                <X size={16} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* ── Category Pills ── */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          {CATS.map((c) => {
            const count = c.id === "all" ? items.filter(i => i.available).length : (groupedItems[c.id]?.length || 0);
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  cat === c.id
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                    : "bg-white/80 text-gray-600 hover:bg-white shadow-sm border border-gray-100"
                }`}
              >
                <span>{c.emoji}</span>
                <span>{lang === "ar" ? c.ar : c.en}</span>
                <span className={`text-[10px] ${cat === c.id ? "text-white/80" : "text-gray-400"}`}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Menu Content ── */}
      <div className="px-4 py-4">
        {loading ? (
          <Suspense fallback={<div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-pulse bg-gray-200/50" />)}</div>}>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </Suspense>
        ) : Object.keys(filteredGroups).length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-gray-700">{tr("No items found", "لا توجد نتائج")}</h3>
            <p className="text-gray-500 mt-2">{tr("Try a different search term", "جرب كلمة بحث مختلفة")}</p>
          </div>
        ) : (
          Object.entries(filteredGroups).map(([catId, catItems]) => {
            const catInfo = CATS.find(c => c.id === catId) || { emoji: "📋", en: catId, ar: catId };
            const colors = CAT_COLORS[catId] || { bg: "from-gray-50 to-slate-50", border: "border-gray-200", icon: "text-gray-600" };
            const isOpen = expandedCats.has(catId) || cat !== "all";

            return (
              <CategorySection
                key={catId}
                catId={catId}
                catName={lang === "ar" ? catInfo.ar : catInfo.en}
                emoji={catInfo.emoji}
                items={catItems}
                lang={lang as "en" | "ar"}
                isRTL={isRTL}
                colors={colors}
                isInCart={isInCart}
                getQty={getQty}
                onAdd={handleAdd}
                justAdded={justAdded}
                defaultOpen={isOpen}
              />
            );
          })
        )}
      </div>
    </div>
  );
}