import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";

interface MenuItem {
  id: string; name: string; nameAr: string;
  description: string; descriptionAr: string;
  price: number; category: string; available: boolean; image: string;
  ingredients?: string[];
  ingredientsAr?: string[];
  recommended?: boolean;
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
    recommended: raw.recommended === true,
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients as string[] : (typeof raw.ingredients === "string" ? raw.ingredients.split(",").map(i => i.trim()) : []),
    ingredientsAr: Array.isArray(raw.ingredientsAr) ? raw.ingredientsAr as string[] : (typeof raw.ingredientsAr === "string" ? raw.ingredientsAr.split("،").map(i => i.trim()) : []),
  };
}

const CATS = [
  { id: "recommended",emoji: "⭐",  en: "Top Picks",   ar: "الأفضل"    },
  { id: "new_items",  emoji: "🆕",  en: "New",         ar: "جديد"      },
  { id: "toast",      emoji: "🍞",  en: "Toast",       ar: "توست"      },
  { id: "croissant",  emoji: "🥐",  en: "Croissant",   ar: "كروسان"    },
  { id: "breakfast",  emoji: "🍳",  en: "Breakfast",   ar: "إفطار"     },
  { id: "hot_drinks", emoji: "☕",  en: "Hot Drinks",  ar: "مشروبات ساخنة" },
  { id: "iced_coffee",emoji: "🧊",  en: "Iced Coffee", ar: "ايس كوفي"  },
  { id: "mocktails",  emoji: "🍹",  en: "Cold Drinks", ar: "مشروبات باردة" },
  { id: "milkshake",  emoji: "🥛",  en: "Shakes",      ar: "شيك"       },
  { id: "all",        emoji: "✨",  en: "All",         ar: "الكل"      },
  { id: "burgers",    emoji: "🍔",  en: "Burgers",     ar: "برجر"      },
  { id: "sandwiches", emoji: "🥪",  en: "Sandwiches",  ar: "ساندوتش"   },
  { id: "food",       emoji: "🍗",  en: "Main",        ar: "أطباق"     },
  { id: "pasta",      emoji: "🍝",  en: "Pasta",       ar: "مكرونة"    },
  { id: "salads",     emoji: "🥗",  en: "Salads",      ar: "سلطات"     },
  { id: "soups",      emoji: "🍲",  en: "Soups",       ar: "شوربة"     },
  { id: "appetizers", emoji: "🍟",  en: "Starters",    ar: "مقبلات"    },
  { id: "desserts",   emoji: "🍰",  en: "Sweets",      ar: "حلويات"    },
  { id: "shisha",     emoji: "💨",  en: "Shisha",      ar: "شيشة"      },
];

const CAT_ALIASES: Record<string, string[]> = {
  beverages:   ["beverages", "drinks", "drink", "hot_drinks", "iced_coffee", "mocktails", "milkshake"],
  recommended: ["recommended"],
  new_items:   ["new_items", "new", "featured"],
  food:        ["food", "mains", "main", "main_dishes", "fried_chicken"],
  sandwiches:  ["sandwich", "sandwiches", "tortilla"],
  toast:       ["toast"],
  croissant:   ["croissant"],
  burgers:     ["burger", "burgers", "smash_burgers"],
  pasta:       ["pasta", "noodles"],
  salads:      ["salad", "salads"],
  soups:       ["soup", "soups"],
  appetizers:  ["appetizer", "appetizers", "starters", "sides", "extras", "add_ons"],
  breakfast:   ["breakfast", "brunch"],
  desserts:    ["dessert", "desserts", "sweet", "sweets", "pancakes", "crepes"],
  hot_drinks:  ["hot_drinks", "coffee", "tea", "corto", "hot_chocolate", "sahlab"],
  iced_coffee: ["iced_coffee", "frappuccino"],
  milkshake:   ["milkshake", "shake", "milkshakes"],
  mocktails:   ["mocktail", "mocktails", "cold", "cold_drinks", "juice", "fresh_juices", "mojitos", "boba_tea", "smoothies"],
  shisha:      ["shisha", "hookah", "sheesha"],
};

const ITEMS_PER_PAGE = 12;

// Memoized individual item card for peak scroll performance
const MenuItemCard = memo(({
  item,
  lang,
  idx,
  onClick,
  CATS
}: {
  item: MenuItem;
  lang: string;
  idx: number;
  onClick: (item: MenuItem) => void;
  CATS: any[];
}) => {
  const cat = CATS.find(c => c.id === item.category);
  return (
    <div
      className="group cursor-pointer"
      onClick={() => onClick(item)}
      style={{
        animationDelay: `${idx * 30}ms`,
        animation: "fadeInSimple 0.3s ease-out forwards"
      }}
    >
      {/* Card - Removed all hover shimmer and heavy effects as requested */}
      <div className="rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm active:scale-95 transition-transform duration-200">
        {/* Image Container */}
        <div className="relative h-36 overflow-hidden">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-5xl">{cat?.emoji || "🍽️"}</span>
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
            <span>{cat?.emoji}</span>
            <span>{lang === "ar" ? cat?.ar : cat?.en}</span>
          </div>
          {/* RECOMMENDED gold badge — highest priority */}
          {item.recommended && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[9px] font-black tracking-wide shadow-lg shadow-amber-200 flex items-center gap-1">
              <span>⭐</span>
              <span>{lang === "ar" ? "مُوصى به" : "TOP PICK"}</span>
            </div>
          )}
          {/* NEW badge — shown only when not recommended */}
          {!item.recommended && item.category === "new_items" && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-[9px] font-black tracking-wide shadow-lg">
              {lang === "ar" ? "جديد" : "NEW"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-bold text-sm text-foreground truncate">
            {lang === "ar" ? item.nameAr : item.name}
          </h3>
          {item.nameAr && lang !== "ar" && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5" dir="rtl">{item.nameAr}</p>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-primary">{item.price}</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase">{lang === "ar" ? "ج.م" : "EGP"}</span>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-[10px] font-bold">
              {lang === "ar" ? "التفاصيل" : "Details"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Item Detail Modal Component - Fixed for Mobile Comfort
function ItemModal({ item, onClose, lang }: { item: MenuItem; onClose: () => void; lang: "en" | "ar" }) {
  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;
  const cat = CATS.find(c => c.id === item.category);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      style={{ isolation: 'isolate' }}
    >
      {/* Background Overlay - Non-scrollable fixed backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content - Fixed position, centered, comfortable for eyes */}
      <div
        className="relative w-full max-w-md bg-card rounded-[2rem] shadow-2xl overflow-hidden border border-border/20 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeInSimple 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        <div className="overflow-y-auto p-6 sm:p-8 scroll-hide">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Image */}
            <div className="w-full sm:w-48 h-48 sm:h-48 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  {cat?.emoji || "🍽️"}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-foreground leading-tight">
                    {item.name}
                  </h2>
                  {item.nameAr && (
                    <p className="text-lg text-muted-foreground font-medium mt-1" dir="rtl">
                      {item.nameAr}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-black text-primary">
                  {item.price}
                </span>
                <span className="text-sm text-muted-foreground font-bold uppercase tracking-wider">
                  {lang === "ar" ? "ج.م" : "EGP"}
                </span>
                {cat && (
                  <span className="ml-auto badge bg-primary/5 text-primary border border-primary/10">
                    {cat.emoji} {lang === "ar" ? cat.ar : cat.en}
                  </span>
                )}
              </div>

              {/* Description */}
              {(item.description || item.descriptionAr) && (
                <div className="mb-6 p-4 rounded-2xl bg-muted/30 border border-border/30">
                  <p className="text-sm text-foreground/80 leading-relaxed italic">
                    "{lang === "ar" ? (item.descriptionAr || item.description) : item.description}"
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 space-y-6">
            {/* Ingredients */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">🧾</span>
                {tr("Detailed Ingredients", "المكونات التفصيلية")}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {((lang === "ar" && item.ingredientsAr && item.ingredientsAr.length > 0) ? item.ingredientsAr : item.ingredients) && ((lang === "ar" && item.ingredientsAr && item.ingredientsAr.length > 0) ? item.ingredientsAr : item.ingredients)!.length > 0 ? (
                  ((lang === "ar" && item.ingredientsAr && item.ingredientsAr.length > 0) ? item.ingredientsAr : item.ingredients)!.map((ing, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-xl bg-card border border-border/60 text-xs font-medium text-foreground/70 flex items-center gap-2"
                    >
                      <div className="w-1 h-1 rounded-full bg-primary/40" />
                      {ing}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="px-3 py-2 rounded-xl bg-card border border-border/60 text-xs font-medium text-foreground/70 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary/40" />
                      {lang === "ar" ? "مكونات طازجة" : "Fresh ingredients"}
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-card border border-border/60 text-xs font-medium text-foreground/70 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary/40" />
                      {lang === "ar" ? "جودة عالية" : "Premium quality"}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Info Footer */}
            <div className="flex flex-col gap-4 pt-6 mt-2 border-t border-border/40">
              <button
                onClick={onClose}
                className="btn-primary w-full py-4 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
              >
                {tr("Back to Menu", "العودة للقائمة")}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default function MenuLightweight() {
  const { lang, isRTL } = useLang();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("hot_drinks");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const tr = useCallback((en: string, ar: string) => lang === "ar" ? ar : en, [lang]);

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
        if (v.price !== undefined || v.name !== undefined) {
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

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [cat, debouncedSearch]);

  // Filtered items
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!item.available) return false;
      if (cat !== "all") {
        const aliasSet = new Set(CAT_ALIASES[cat] ?? [cat]);
        if (!aliasSet.has(item.category.toLowerCase())) return false;
      }
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const ingMatch = (item.ingredients ?? []).some(i => i.toLowerCase().includes(q));
        return item.name.toLowerCase().includes(q) || item.nameAr.includes(q) || ingMatch;
      }
      return true;
    });
  }, [items, cat, debouncedSearch]);

  // Paginated items
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  // Category counts
  const catCount = useCallback((c: string) => {
    if (c === "all") return items.filter((i) => i.available).length;
    const aliasSet = new Set(CAT_ALIASES[c] ?? [c]);
    return items.filter((i) => i.available && aliasSet.has(i.category.toLowerCase())).length;
  }, [items]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF5E6] to-[#FAF0E6]" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div 
        className="sticky top-0 z-30 px-4 pt-4 pb-3"
        style={{ 
          background: "linear-gradient(180deg, hsl(30, 59%, 26%) 0%, hsl(25, 50%, 30%) 100%)",
          boxShadow: "0 4px 20px rgba(101, 67, 33, 0.3)"
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-white drop-shadow-sm">{tr("Our Menu", "قائمتنا")}</h1>
            <p className="text-xs text-white/80">{filtered.length} {tr("delicious items", "عنصر لذيذ")}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://azura-menu.pages.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white text-xs font-bold flex items-center gap-1.5 hover:bg-white/30 transition-colors"
              title={tr("View Full Menu (Read-only)", "عرض القائمة الكاملة (للقراءة فقط)")}
            >
              <span>📖</span>
              <span className="hidden sm:inline">{tr("Full Menu", "القائمة الكاملة")}</span>
            </a>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search size={18} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"} text-gray-400`} />
          <input
            ref={searchRef}
            type="text"
            placeholder={tr("Search for something tasty...", "ابحث عن شيء لذيذ...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full py-3 pl-10 pr-4 rounded-2xl text-sm bg-white shadow-lg border-0 focus:ring-2 focus:ring-amber-300 ${
              isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
            }`}
          />
        </div>
      </div>

      {/* Categories - Premium Horizontal Scroll */}
      <div className="sticky top-[105px] z-20 bg-[#FDF5E6]/90 backdrop-blur-md px-4 py-3 border-b border-[#D2B48C]">
        <div className="flex gap-2.5 overflow-x-auto scroll-hide pb-1">
          {CATS.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap
                transition-all duration-300 ease-out shadow-sm
                ${cat === c.id 
                  ? "bg-gradient-to-r from-[#654321] to-[#8B4513] text-white shadow-lg shadow-[#D2B48C] scale-105" 
                  : "bg-white text-[#654321] hover:bg-[#FDF5E6] hover:scale-102"
                }
              `}
              style={{ 
                animationDelay: `${idx * 50}ms`,
                transform: cat === c.id ? "scale(1.05)" : "scale(1)"
              }}
            >
              <span className="text-lg">{c.emoji}</span>
              <span>{lang === "ar" ? c.ar : c.en}</span>
              <span className={`
                text-[10px] px-1.5 py-0.5 rounded-full font-bold
                ${cat === c.id ? "bg-white/20 text-white" : "bg-[#D2B48C] text-[#654321]"}
              `}>
                {catCount(c.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm animate-pulse">
                <div className="relative h-36 bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-7xl mb-4">🔍</div>
            <p className="text-xl font-bold text-gray-700">{tr("Nothing found", "لا توجد نتائج")}</p>
            <p className="text-sm text-gray-500 mt-2">{tr("Try a different search", "جرب بحث مختلف")}</p>
          </div>
        ) : (
          /* GRID VIEW WITH SHIMMER */
          <div className="grid grid-cols-2 gap-4">
            {paginated.map((item, idx) => (
              <MenuItemCard
                key={item.id}
                item={item}
                lang={lang}
                idx={idx}
                onClick={setSelectedItem}
                CATS={CATS}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center disabled:opacity-40 disabled:shadow-none hover:shadow-lg transition-all"
            >
              {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                    page === i + 1 
                      ? "bg-gradient-to-r from-[#654321] to-[#8B4513] text-white shadow-md" 
                      : "bg-white text-[#654321] hover:bg-[#FDF5E6]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center disabled:opacity-40 disabled:shadow-none hover:shadow-lg transition-all"
            >
              {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
        )}
      </div>

      {/* Bottom spacer for nav */}
      <div className="h-24" />
      
      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
          lang={lang}
        />
      )}
      
      {/* Global Styles */}
      <style>{`
        @keyframes fadeInSimple {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .scroll-hide::-webkit-scrollbar {
          display: none;
        }
        .scroll-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}