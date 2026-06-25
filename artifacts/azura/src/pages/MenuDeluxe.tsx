import { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "wouter";
import { Search, Plus, Check, Sparkles, ChevronDown, ChevronUp, X, Filter, SlidersHorizontal } from "lucide-react";

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

// Enhanced category definitions with icons, colors and gradients
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

// Enhanced color system with shimmer-compatible gradients
const CAT_COLORS: Record<string, { bg: string; border: string; icon: string; badge: string; shimmer: string }> = {
  food:       { bg: "from-amber-50 to-orange-50", border: "border-amber-200/50", icon: "text-amber-600", badge: "bg-amber-100 text-amber-700", shimmer: "from-amber-200/20 to-orange-200/20" },
  sandwiches: { bg: "from-red-50 to-orange-50", border: "border-red-200/50", icon: "text-red-600", badge: "bg-red-100 text-red-700", shimmer: "from-red-200/20 to-orange-200/20" },
  mains:      { bg: "from-emerald-50 to-teal-50", border: "border-emerald-200/50", icon: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700", shimmer: "from-emerald-200/20 to-teal-200/20" },
  burgers:    { bg: "from-yellow-50 to-amber-50", border: "border-yellow-200/50", icon: "text-yellow-600", badge: "bg-yellow-100 text-yellow-700", shimmer: "from-yellow-200/20 to-amber-200/20" },
  hot_drinks: { bg: "from-orange-50 to-amber-50", border: "border-orange-200/50", icon: "text-orange-600", badge: "bg-orange-100 text-orange-700", shimmer: "from-orange-200/20 to-amber-200/20" },
  cold_drinks:{ bg: "from-blue-50 to-cyan-50", border: "border-blue-200/50", icon: "text-blue-600", badge: "bg-blue-100 text-blue-700", shimmer: "from-blue-200/20 to-cyan-200/20" },
  fresh:      { bg: "from-green-50 to-emerald-50", border: "border-green-200/50", icon: "text-green-600", badge: "bg-green-100 text-green-700", shimmer: "from-green-200/20 to-emerald-200/20" },
  milkshake:  { bg: "from-pink-50 to-rose-50", border: "border-pink-200/50", icon: "text-pink-600", badge: "bg-pink-100 text-pink-700", shimmer: "from-pink-200/20 to-rose-200/20" },
  desserts:   { bg: "from-purple-50 to-violet-50", border: "border-purple-200/50", icon: "text-purple-600", badge: "bg-purple-100 text-purple-700", shimmer: "from-purple-200/20 to-violet-200/20" },
  extras:     { bg: "from-gray-50 to-slate-50", border: "border-gray-200/50", icon: "text-gray-600", badge: "bg-gray-100 text-gray-700", shimmer: "from-gray-200/20 to-slate-200/20" },
  drinks:     { bg: "from-sky-50 to-blue-50", border: "border-sky-200/50", icon: "text-sky-600", badge: "bg-sky-100 text-sky-700", shimmer: "from-sky-200/20 to-blue-200/20" },
  shisha:     { bg: "from-indigo-50 to-purple-50", border: "border-indigo-200/50", icon: "text-indigo-600", badge: "bg-indigo-100 text-indigo-700", shimmer: "from-indigo-200/20 to-purple-200/20" },
};

function greeting(lang: "en" | "ar") {
  const h = new Date().getHours();
  if (h < 12) return lang === "ar" ? "صباح الخير! ☀️" : "Good morning! ☀️";
  if (h < 17) return lang === "ar" ? "طيب النهار! 🌤️" : "Good afternoon! 🌤️";
  return lang === "ar" ? "مساء النور! 🌙" : "Good evening! 🌙";
}

// Shimmer loading effect component
function ShimmerEffect({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}

// Badge component for categories and counts
function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "count" | "status" }) {
  const variants = {
    default: "bg-primary/10 text-primary",
    count: "bg-secondary/20 text-secondary-foreground",
    status: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
}

// Enhanced Menu Item Card Component
function MenuItemCard({ item, lang, isRTL, isInCart, getQty, onAdd, onRemove, justAdded }: {
  item: MenuItem; lang: "en" | "ar"; isRTL: boolean;
  isInCart: (id: string) => boolean; getQty: (id: string) => number;
  onAdd: (item: MenuItem) => void; onRemove?: (item: MenuItem) => void;
  justAdded: string | null;
}) {
  const added = justAdded === item.id;
  const inCart = isInCart(item.id);
  const qty = getQty(item.id);
  const name = lang === "ar" ? item.nameAr : item.name;
  const description = lang === "ar" ? item.descriptionAr : item.description;

  return (
    <div className={`group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
      inCart ? 'bg-gradient-to-r from-primary/5 to-transparent ring-2 ring-primary/20' : 'bg-white/80 hover:bg-white'
    }`}>
      {/* Shimmer overlay on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full" />
      
      {/* Item Image with shimmer placeholder */}
      <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-md relative">
        {item.image ? (
          <img src={item.image} alt={name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <span className="text-3xl opacity-50">🍽️</span>
          </div>
        )}
        {/* Badge for cart indicator */}
        {inCart && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-md animate-spring-bounce">
            {qty}
          </div>
        )}
      </div>
      
      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-800 text-base leading-tight group-hover:text-primary transition-colors">{name}</h3>
          <span className="font-extrabold text-primary text-lg whitespace-nowrap bg-primary/10 px-2 py-0.5 rounded-lg">
            {item.price} LE
          </span>
        </div>
        {description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{description}</p>
        )}
        {/* Category badge */}
        <div className="mt-2">
          <Badge variant="status">{item.category}</Badge>
        </div>
      </div>

      {/* Add/Remove Button */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        <button
          onClick={() => onAdd(item)}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 ${
            added 
              ? "bg-green-500 text-white" 
              : inCart 
                ? "bg-primary text-primary-foreground" 
                : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70"
          }`}
        >
          {added ? <Check size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={2.5} />}
        </button>
        {inCart && onRemove && (
          <button
            onClick={() => onRemove(item)}
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <span className="text-lg font-bold">−</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Enhanced Collapsible Category Section with pagination
function CategorySection({ catId, catName, emoji, items, lang, isRTL, colors, isInCart, getQty, onAdd, onRemove, justAdded, defaultOpen = false }: {
  catId: string; catName: string; emoji: string; items: MenuItem[];
  lang: "en" | "ar"; isRTL: boolean; colors: { bg: string; border: string; icon: string; badge: string; shimmer: string };
  isInCart: (id: string) => boolean; getQty: (id: string) => number;
  onAdd: (item: MenuItem) => void; onRemove?: (item: MenuItem) => void;
  justAdded: string | null; defaultOpen?: boolean;
}) {
  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const ITEMS_PER_PAGE = 6;
  const [page, setPage] = useState(0);
  
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const paginatedItems = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setPage(0);
  };

  return (
    <div className={`mb-5 rounded-2xl overflow-hidden border ${colors.border} bg-gradient-to-br ${colors.bg} shadow-sm hover:shadow-md transition-shadow`}>
      {/* Section Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-black/5 transition-all duration-200 active:bg-black/10"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-white/80 shadow-sm flex items-center justify-center ${colors.icon}`}>
            <span className="text-xl">{emoji}</span>
          </div>
          <div className="text-left">
            <h2 className="font-bold text-gray-800 text-lg">{catName}</h2>
            <div className="flex items-center gap-2">
              <Badge variant="count">{items.length} items</Badge>
              {isOpen && <Badge variant="default">↓</Badge>}
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <span className="text-xs text-muted-foreground font-medium">
            {isOpen ? tr("Hide", "إخفاء") : tr("Show", "عرض")}
          </span>
          <ChevronDown size={20} className="text-gray-400" />
        </div>
      </button>

      {/* Items List with Pagination */}
      {isOpen && (
        <div className="px-3 pb-3 space-y-3">
          {paginatedItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              lang={lang as "en" | "ar"}
              isRTL={isRTL}
              isInCart={isInCart}
              getQty={getQty}
              onAdd={onAdd}
              onRemove={onRemove}
              justAdded={justAdded}
            />
          ))}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-3 pb-1">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="w-8 h-8 rounded-full bg-white/80 text-primary flex items-center justify-center disabled:opacity-40 hover:bg-white transition-colors shadow-sm"
              >
                <ChevronDown size={16} className="rotate-90" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      page === i ? "bg-primary w-6" : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
                className="w-8 h-8 rounded-full bg-white/80 text-primary flex items-center justify-center disabled:opacity-40 hover:bg-white transition-colors shadow-sm"
              >
                <ChevronDown size={16} className="-rotate-90" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Menu() {
  const { lang, isRTL } = useLang();
  const { addItem, removeItem, isInCart, getQty } = useCart();
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

  const handleRemove = (item: MenuItem) => {
    if (removeItem) {
      removeItem(item.id);
    }
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
            const colors = CAT_COLORS[catId] || { bg: "from-gray-50 to-slate-50", border: "border-gray-200", icon: "text-gray-600", badge: "bg-gray-100 text-gray-700", shimmer: "from-gray-200/20 to-slate-200/20" };
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
                onRemove={handleRemove}
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