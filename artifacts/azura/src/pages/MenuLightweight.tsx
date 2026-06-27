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
  { id: "recommended",      emoji: "⭐",  en: "Top Picks",           ar: "الأفضل"          },
  { id: "new_items",        emoji: "🆕",  en: "New",                 ar: "جديد"            },
  { id: "soups",            emoji: "🍲",  en: "Soup",                ar: "شوربة"           },
  { id: "appetizers",       emoji: "🍟",  en: "Appetizers",         ar: "مقبلات"          },
  { id: "salads",           emoji: "🥗",  en: "Salads",              ar: "سلطات"           },
  { id: "pasta",            emoji: "🍝",  en: "Pasta",               ar: "مكرونة"          },
  { id: "tortilla",         emoji: "🌯",  en: "Tortilla",            ar: "تورتيلا"         },
  { id: "sandwiches",       emoji: "🥪",  en: "Sandwiches",          ar: "ساندوتش"         },
  { id: "vina_sandwiches",  emoji: "🥖",  en: "Vina Sandwiches",     ar: "ساندوتش فينا"     },
  { id: "main_dishes",      emoji: "🍽️",  en: "Main Dishes",         ar: "أطباق رئيسية"     },
  { id: "beef_burgers",     emoji: "🍔",  en: "Beef Burgers",        ar: "برجر لحم"        },
  { id: "smash_burgers",    emoji: "🔥",  en: "Smash Burgers",       ar: "سماش برجر"       },
  { id: "fried_chicken",    emoji: "🍗",  en: "Fried Chicken",      ar: "فراخ مقلية"      },
  { id: "extra_kitchen",    emoji: "➕",  en: "Extra Kitchen",       ar: "إضافات مطبخ"     },
  { id: "hot_drinks",       emoji: "☕",  en: "Hot Drinks",          ar: "مشروبات ساخنة"   },
  { id: "espresso",         emoji: "☕",  en: "Espresso",            ar: "إسبريسو"         },
  { id: "corto",            emoji: "🥛",  en: "Corto",               ar: "كورتو"           },
  { id: "hot_chocolate",    emoji: "🍫",  en: "Hot Chocolate",       ar: "شوكولاتة ساخنة"  },
  { id: "frappe",           emoji: "🧊",  en: "Frappe",              ar: "فرابيه"          },
  { id: "iced_coffee",      emoji: "🧋",  en: "Iced Coffee",        ar: "قهوة مثلجة"      },
  { id: "mocktails",        emoji: "🍹",  en: "Mocktails",           ar: "موكتيل"          },
  { id: "boba_tea",         emoji: "🧋",  en: "Boba Tea",            ar: "بوبا تي"         },
  { id: "fresh_juice",      emoji: "🍊",  en: "Fresh Juice",         ar: "عصير طازج"       },
  { id: "cocktails",        emoji: "🍸",  en: "Cocktails",           ar: "كوكتيل"          },
  { id: "smoothie",         emoji: "🥤",  en: "Smoothie",            ar: "سموذي"           },
  { id: "milkshake",        emoji: "🥛",  en: "Milkshake",            ar: "ميلك شيك"        },
  { id: "waffle",           emoji: "🧇",  en: "Waffle",               ar: "وافل"            },
  { id: "desserts",         emoji: "🍰",  en: "Desserts",             ar: "حلويات"          },
  { id: "crepe",            emoji: "🥞",  en: "Crepe",                ar: "كريب"            },
  { id: "pancakes",         emoji: "🥞",  en: "Pancakes",             ar: "بان كيك"         },
  { id: "extra_drinks",     emoji: "🥤",  en: "Extra Drinks",         ar: "مشروبات إضافية"   },
  { id: "soft_drinks",      emoji: "🥤",  en: "Soft Drinks",          ar: "مشروبات غازية"   },
  { id: "shisha",           emoji: "💨",  en: "Hookah",                ar: "شيشة"            },
  { id: "all",              emoji: "✨",  en: "All",                  ar: "الكل"            },
];

const CAT_ALIASES: Record<string, string[]> = {
  recommended:    ["recommended"],
  new_items:      ["new_items", "new", "featured"],
  soups:          ["soup", "soups"],
  appetizers:     ["appetizer", "appetizers", "starters", "sides", "extras"],
  salads:         ["salad", "salads"],
  pasta:          ["pasta", "noodles"],
  tortilla:       ["tortilla", "wraps"],
  sandwiches:     ["sandwich", "sandwiches"],
  vina_sandwiches:["vina_sandwiches", "vina", "focaccia"],
  main_dishes:    ["main_dishes", "mains", "main", "food"],
  beef_burgers:   ["beef_burgers", "beef_burger", "beef"],
  smash_burgers:  ["smash_burgers", "smash_burger", "smash"],
  fried_chicken:  ["fried_chicken", "chicken_sandwich", "chicken_burger"],
  extra_kitchen:  ["extra_kitchen", "extras", "add_ons"],
  hot_drinks:     ["hot_drinks", "tea", "sahlab", "herbal_tea"],
  espresso:       ["espresso", "coffee"],
  corto:          ["corto"],
  hot_chocolate:  ["hot_chocolate", "chocolate"],
  frappe:         ["frappe", "frappuccino", "iced_coffee"],
  iced_coffee:    ["iced_coffee"],
  mocktails:      ["mocktails", "mocktail", "mojitos"],
  boba_tea:       ["boba_tea", "boba", "bubble_tea"],
  fresh_juice:    ["fresh_juice", "juice", "fresh_juices"],
  cocktails:      ["cocktails", "cocktail"],
  smoothie:       ["smoothie", "smoothies"],
  milkshake:      ["milkshake", "shake", "milkshakes"],
  waffle:         ["waffle", "waffles"],
  desserts:       ["dessert", "desserts", "sweet", "sweets"],
  crepe:          ["crepe", "crepes"],
  pancakes:       ["pancakes", "pancake"],
  extra_drinks:   ["extra_drinks"],
  soft_drinks:    ["soft_drinks", "soda", "cold_drinks"],
  shisha:         ["shisha", "hookah", "sheesha", "hookah"],
};

const ITEMS_PER_PAGE = 24;

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
        animationDelay: `${idx * 20}ms`,
        animation: "fadeInSimple 0.25s ease-out forwards",
        contentVisibility: "auto",
        containIntrinsicSize: "0 200px"
      }}
    >
      <div className="rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm active:scale-[0.97] transition-all duration-150">
        <div className="relative h-36 overflow-hidden bg-muted/30">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl opacity-40">{cat?.emoji || "🍽️"}</span>
            </div>
          )}

          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[9px] font-bold flex items-center gap-1">
            <span>{cat?.emoji}</span>
            <span>{lang === "ar" ? cat?.ar : cat?.en}</span>
          </div>
          {item.recommended && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black tracking-wide shadow-sm flex items-center gap-1">
              <span>⭐</span>
              <span>{lang === "ar" ? "مُوصى به" : "TOP"}</span>
            </div>
          )}
          {!item.recommended && item.category === "new_items" && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black tracking-wide">
              {lang === "ar" ? "جديد" : "NEW"}
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-bold text-sm text-foreground truncate">
            {lang === "ar" ? item.nameAr : item.name}
          </h3>
          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-base font-black text-primary">{item.price}</span>
              <span className="text-[8px] text-muted-foreground font-bold uppercase">{lang === "ar" ? "ج.م" : "EGP"}</span>
            </div>
            <div className="px-2 py-0.5 rounded-lg bg-primary/5 text-primary text-[9px] font-bold">
              {lang === "ar" ? "تفاصيل" : "Details"}
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

  // Debounced search - faster for snappier feel
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [cat, debouncedSearch]);

  // Unified filtering and counting in a single pass for optimization
  const { filtered, counts } = useMemo(() => {
    const countsMap: Record<string, number> = {};
    CATS.forEach(c => countsMap[c.id] = 0);

    const filteredList = items.filter((item) => {
      if (!item.available) return false;

      // Update counts for ALL categories this item belongs to
      CATS.forEach(c => {
        if (c.id === "all") {
          countsMap["all"]++;
        } else if (c.id === "recommended") {
          if (item.recommended) countsMap["recommended"]++;
        } else {
          const aliasSet = new Set(CAT_ALIASES[c.id] ?? [c.id]);
          if (aliasSet.has(item.category.toLowerCase())) {
            countsMap[c.id]++;
          }
        }
      });

      // Search filter (Global search)
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const ingMatch = (item.ingredients ?? []).some(i => i.toLowerCase().includes(q));
        const descMatch = (item.description || "").toLowerCase().includes(q) || (item.descriptionAr || "").includes(q);
        const nameMatch = item.name.toLowerCase().includes(q) || item.nameAr.includes(q);
        if (!(nameMatch || ingMatch || descMatch)) return false;
      } else {
        // Category filter (only apply if NOT searching, or decide if search should be scoped)
        // User wants stability, usually global search is better but let's see.
        // If they chose a category, they probably want to search in it.
        // Actually, "conflict on section" might mean they want to see it everywhere.
        // Let's make it scoped search if category is not "all".
        if (cat !== "all") {
           if (cat === "recommended") {
             if (!item.recommended) return false;
           } else {
             const aliasSet = new Set(CAT_ALIASES[cat] ?? [cat]);
             if (!aliasSet.has(item.category.toLowerCase())) return false;
           }
        }
      }

      return true;
    });

    return { filtered: filteredList, counts: countsMap };
  }, [items, cat, debouncedSearch]);

  // Paginated items
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF5E6] to-[#FAF0E6]" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div
        className="sticky top-0 z-30 bg-[#2D1B0F]"
        style={{
          background: "linear-gradient(180deg, #1A0F08 0%, #2D1B0F 100%)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        }}
      >
        {/* Hero band — logo + branding */}
        <div className="relative px-4 pt-4 pb-3 flex items-center gap-3 overflow-hidden">
          {/* subtle texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
              backgroundSize: "6px 6px",
            }}
          />

          {/* Logo */}
          <div className="relative flex-shrink-0">
            <div
              className="absolute inset-0 rounded-2xl blur-lg opacity-40"
              style={{ background: "rgba(255,200,80,0.6)", transform: "scale(1.2) translateY(4px)" }}
            />
            <div
              className="relative rounded-2xl p-[3px] border border-white/20"
              style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(6px)" }}
            >
              <img
                src="/logo.jpg"
                alt="Azura"
                className="w-14 h-14 rounded-[14px] object-cover"
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
              />
            </div>
          </div>

          {/* Brand text */}
          <div className="flex-1 min-w-0 z-10">
            <h1
              className="text-xl font-extrabold text-white leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-heading)", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
            >
              {lang === "ar" ? "أزورا كافيه" : "Azura Cafe"}
            </h1>
            <p
              className="text-[11px] font-medium mt-0.5 italic"
              style={{ color: "rgba(255,210,100,0.85)", fontFamily: "var(--font-handwritten)", fontSize: "0.85rem" }}
            >
              {tr("The quality is a habit", "الجودة عادة")}
            </p>
            <p className="text-[10px] text-white/50 mt-0.5">
              {filtered.length} {tr("items", "صنف")}
            </p>
          </div>

          {/* Full menu link */}
          <a
            href="https://azura-menu.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 z-10 px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)" }}
            title={tr("View Full Menu", "القائمة الكاملة")}
          >
            <span>📖</span>
            <span className="hidden sm:inline">{tr("Full Menu", "القائمة الكاملة")}</span>
          </a>
        </div>

        {/* Search */}
        <div className="relative px-4 pb-3">
          <Search size={16} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-7" : "left-7"} text-gray-400`} />
          <input
            ref={searchRef}
            type="text"
            placeholder={tr("Search for something tasty...", "ابحث عن شيء لذيذ...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full py-2.5 rounded-2xl text-sm bg-white shadow-lg border-0 focus:ring-2 focus:ring-amber-300 ${
              isRTL ? "pr-9 pl-4" : "pl-9 pr-4"
            }`}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-7" : "right-7"} text-gray-400 hover:text-gray-600`}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Categories - Simplified for performance on weak devices (removed backdrop-blur) */}
      <div className="sticky top-[105px] z-20 bg-[#FDF5E6] px-4 py-3 border-b border-[#D2B48C]">
        <div className="flex gap-2.5 overflow-x-auto scroll-hide pb-1 will-change-transform">
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
                {counts[c.id] || 0}
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