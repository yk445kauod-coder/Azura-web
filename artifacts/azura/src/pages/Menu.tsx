import { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy, memo } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "wouter";
import { Search, Plus, Check, Sparkles, ChevronRight, X } from "lucide-react";

const SkeletonCard = lazy(() => import("./SkeletonCard"));

function LazyImage({ src, alt, className, fallback }: { src: string; alt: string; className?: string; fallback: string }) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observerRef.current?.disconnect(); } },
      { rootMargin: "200px 0px", threshold: 0 }
    );
    if (imgRef.current) observerRef.current.observe(imgRef.current);
    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !src || error) return;
    const img = new Image();
    img.src = src;
    img.onload = () => { setLoaded(true); setError(false); };
    img.onerror = () => { setError(true); setLoaded(true); };
    return () => { img.onload = null; img.onerror = null; };
  }, [inView, src, error]);

  const displaySrc = error ? fallback : (inView && src ? src : fallback);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      <img
        src={displaySrc}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        loading="lazy"
        decoding="async"
      />
      {!loaded && <div className="absolute inset-0 bg-muted" />}
    </div>
  );
}

interface MenuItem {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  category: string;
  available: boolean;
  image: string;
  ingredients?: string[];
  ingredientsAr?: string[];
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
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients as string[] : [],
    ingredientsAr: Array.isArray(raw.ingredientsAr) ? raw.ingredientsAr as string[] : [],
  };
}

const CATS = [
  { id: "all",        emoji: "🍽️", en: "All",        ar: "الكل"      },
  { id: "food",       emoji: "🍗",  en: "Main",       ar: "أطباق"     },
  { id: "sandwiches", emoji: "🥪",  en: "Sandwiches", ar: "ساندوتش"  },
  { id: "burgers",    emoji: "🍔",  en: "Burgers",    ar: "برجر"      },
  { id: "pasta",      emoji: "🍝",  en: "Pasta",      ar: "مكرونة"    },
  { id: "salads",     emoji: "🥗",  en: "Salads",     ar: "سلطات"     },
  { id: "soups",      emoji: "🍲",  en: "Soups",      ar: "شوربة"     },
  { id: "appetizers", emoji: "🍟",  en: "Starters",   ar: "مقبلات"    },
  { id: "breakfast",  emoji: "🍳",  en: "Breakfast",  ar: "إفطار"     },
  { id: "desserts",   emoji: "🍰",  en: "Sweets",     ar: "حلويات"    },
  { id: "hot_drinks", emoji: "☕",  en: "Hot",        ar: "ساخن"      },
  { id: "milkshake",  emoji: "🥛",  en: "Shakes",     ar: "شيك"       },
  { id: "mocktails",  emoji: "🍹",  en: "Cold",       ar: "بارد"      },
  { id: "shisha",     emoji: "💨",  en: "Shisha",     ar: "شيشة"      },
];

const CAT_ALIASES: Record<string, string[]> = {
  food:        ["food", "mains", "main"],
  sandwiches:  ["sandwich", "sandwiches", "toast", "croissant"],
  burgers:     ["burger", "burgers"],
  pasta:       ["pasta", "noodles"],
  salads:      ["salad", "salads"],
  soups:       ["soup", "soups"],
  appetizers:  ["appetizer", "appetizers", "starters", "sides", "extras"],
  breakfast:   ["breakfast", "brunch"],
  desserts:    ["dessert", "desserts", "sweet", "sweets", "pancakes", "crepes"],
  hot_drinks:  ["hot", "hot_drinks", "coffee", "tea"],
  milkshake:   ["milkshake", "shake", "milkshakes"],
  mocktails:   ["mocktail", "mocktails", "cold", "cold_drinks", "juice", "fresh"],
  shisha:      ["shisha", "hookah", "sheesha"],
};

const FALLBACK: Record<string, string> = {
  food:        "https://images.unsplash.com/photo-1568471173242-461f0a730452?w=500&q=80",
  sandwiches:  "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&q=80",
  burgers:     "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
  pasta:       "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&q=80",
  salads:      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80",
  soups:       "https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80",
  appetizers:  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80",
  breakfast:   "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&q=80",
  desserts:    "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&q=80",
  hot_drinks:  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80",
  milkshake:   "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80",
  mocktails:   "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500&q=80",
  shisha:      "https://images.unsplash.com/photo-1527137342181-19aab11a8ee1?w=500&q=80",
  default:     "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80",
};

function greeting(lang: "en" | "ar") {
  const h = new Date().getHours();
  if (h < 12) return lang === "ar" ? "صباح الخير! ☀️" : "Good morning! ☀️";
  if (h < 17) return lang === "ar" ? "طيب النهار! 🌤️" : "Good afternoon! 🌤️";
  return lang === "ar" ? "مساء النور! 🌙" : "Good evening! 🌙";
}

// Item detail modal
const ItemModal = memo(({
  item, lang, isRTL, inCart, qty, added, onAdd, onClose, tr, FALLBACK
}: {
  item: MenuItem; lang: string; isRTL: boolean;
  inCart: boolean; qty: number; added: boolean;
  onAdd: (item: MenuItem) => void; onClose: () => void;
  tr: (en: string, ar: string) => string; FALLBACK: Record<string, string>;
}) => {
  const imgSrc = item.image || FALLBACK[item.category] || FALLBACK.default;
  const ingredients = lang === "ar" ? (item.ingredientsAr || item.ingredients || []) : (item.ingredients || []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ background: "hsl(var(--card))", maxHeight: "88dvh" }}
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Image */}
        <div className="relative flex-shrink-0" style={{ paddingTop: "55%" }}>
          <LazyImage
            src={imgSrc}
            alt={item.name}
            className="absolute inset-0 w-full h-full"
            fallback={FALLBACK[item.category] || FALLBACK.default}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)" }} />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          >
            <X size={15} className="text-white" />
          </button>
          {inCart && qty > 0 && (
            <span
              className="absolute top-3 left-3 text-xs font-extrabold text-white rounded-full px-2.5 py-1"
              style={{ background: "hsl(var(--primary))" }}
            >
              {qty}× {tr("in cart", "في السلة")}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          <h2 className="text-xl font-extrabold text-foreground leading-tight mb-1">
            {lang === "ar" ? item.nameAr : item.name}
          </h2>
          {(item.description || item.descriptionAr) && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {lang === "ar" ? (item.descriptionAr || item.description) : item.description}
            </p>
          )}

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {tr("Ingredients", "المكونات")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: "hsl(var(--primary)/0.08)",
                      color: "hsl(var(--primary))",
                      border: "1px solid hsl(var(--primary)/0.18)"
                    }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Price + Add */}
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "hsl(var(--border)/0.5)" }}>
            <div>
              <span className="text-2xl font-extrabold text-primary">{item.price}</span>
              <span className="text-sm text-muted-foreground font-semibold ms-1.5">{tr("EGP", "ج.م")}</span>
            </div>
            <button
              onClick={() => onAdd(item)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 ${added ? "scale-95" : "active:scale-95"}`}
              style={added
                ? { background: "#22c55e", color: "white", boxShadow: "0 4px 14px rgba(34,197,94,0.4)" }
                : { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", boxShadow: "var(--shadow-primary)" }
              }
            >
              {added ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={2.5} />}
              {added ? tr("Added!", "تمت الإضافة!") : tr("Add to Cart", "أضف للسلة")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const MenuItemCard = memo(({
  item, lang, isRTL, inCart, qty, added, visible, idx, onAdd, onOpenDetail, tr, FALLBACK
}: {
  item: MenuItem; lang: string; isRTL: boolean;
  inCart: boolean; qty: number; added: boolean;
  visible: boolean; idx: number;
  onAdd: (item: MenuItem) => void;
  onOpenDetail: (item: MenuItem) => void;
  tr: (en: string, ar: string) => string;
  FALLBACK: Record<string, string>;
}) => {
  const imgSrc = item.image || FALLBACK[item.category] || FALLBACK.default;
  const ingredients = lang === "ar" ? (item.ingredientsAr || item.ingredients || []) : (item.ingredients || []);

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col cursor-pointer active:scale-[0.98] transition-all duration-300"
      style={{
        background: "hsl(var(--card))",
        boxShadow: inCart
          ? "0 0 0 2px hsl(var(--primary)/0.4), 0 4px 16px rgba(0,0,0,0.10)"
          : "0 2px 12px rgba(0,0,0,0.07)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.3s ease ${Math.min(idx * 35, 280)}ms, transform 0.3s ease ${Math.min(idx * 35, 280)}ms, box-shadow 0.2s ease`,
      }}
      onClick={() => onOpenDetail(item)}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-muted flex-shrink-0" style={{ paddingTop: "65%" }}>
        <LazyImage
          src={imgSrc}
          alt={lang === "ar" ? item.nameAr : item.name}
          className="absolute inset-0 w-full h-full"
          fallback={FALLBACK[item.category] || FALLBACK.default}
        />
        {inCart && qty > 0 && (
          <span
            className="absolute top-2 right-2 text-[10px] font-extrabold text-white rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--primary))", minWidth: 20, height: 20, padding: "0 5px" }}
          >
            {qty}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col flex-1">
        <h3 className="font-bold text-[13px] text-foreground leading-tight mb-1 line-clamp-1">
          {lang === "ar" ? item.nameAr : item.name}
        </h3>

        {/* Ingredients preview — show first 2 */}
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 flex-1">
            {ingredients.slice(0, 2).map((ing, i) => (
              <span
                key={i}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full leading-none"
                style={{
                  background: "hsl(var(--primary)/0.08)",
                  color: "hsl(var(--primary))"
                }}
              >
                {ing}
              </span>
            ))}
            {ingredients.length > 2 && (
              <span
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full leading-none"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
              >
                +{ingredients.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="font-extrabold text-primary text-[15px] leading-none">{item.price}</span>
            <span className="text-[9px] text-muted-foreground font-semibold ms-1">{tr("EGP", "ج.م")}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(item); }}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${added ? "scale-90" : "active:scale-95"}`}
            style={added
              ? { background: "#22c55e", boxShadow: "0 3px 10px rgba(34,197,94,0.45)" }
              : { background: "hsl(var(--primary))", boxShadow: "0 3px 10px hsl(var(--primary)/0.35)" }
            }
            aria-label={tr("Add to cart", "أضف للسلة")}
          >
            {added
              ? <Check size={13} strokeWidth={3} className="text-white" />
              : <Plus size={13} strokeWidth={2.5} className="text-primary-foreground" />
            }
          </button>
        </div>
      </div>
    </div>
  );
});

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
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const catBarRef = useRef<HTMLDivElement>(null);

  const tr = useCallback((en: string, ar: string) => lang === "ar" ? ar : en, [lang]);

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

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 280);
    return () => clearTimeout(t);
  }, [search]);

  const matchesCategory = useCallback((itemCat: string, filterCat: string): boolean => {
    if (filterCat === "all") return true;
    if (itemCat === filterCat) return true;
    const aliases = CAT_ALIASES[filterCat];
    if (aliases) return aliases.some(a => itemCat.toLowerCase().includes(a) || a.includes(itemCat.toLowerCase()));
    return false;
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!item.available) return false;
      if (!matchesCategory(item.category, cat)) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const ingMatch = (item.ingredients || []).some(i => i.toLowerCase().includes(q));
        const ingArMatch = (item.ingredientsAr || []).some(i => i.includes(q));
        return item.name.toLowerCase().includes(q) ||
               item.nameAr.includes(q) ||
               item.description.toLowerCase().includes(q) ||
               ingMatch || ingArMatch;
      }
      return true;
    });
  }, [items, cat, debouncedSearch, matchesCategory]);

  const featured = useMemo(() => items.filter(i => i.available && i.image).slice(0, 10), [items]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    items.forEach(item => {
      if (!item.available) return;
      counts.all++;
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  const getCatCount = useCallback((id: string) => categoryCounts[id] || 0, [categoryCounts]);

  const handleAdd = useCallback((item: MenuItem) => {
    addItem({ id: item.id, name: item.name, nameAr: item.nameAr, price: item.price, category: item.category, image: item.image });
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 1400);
  }, [addItem]);

  const handleCatChange = useCallback((id: string) => {
    setCat(id);
    setVisible(false);
    setTimeout(() => setVisible(true), 50);
  }, []);

  // Scroll selected category pill into view
  useEffect(() => {
    if (!catBarRef.current) return;
    const active = catBarRef.current.querySelector(`[data-cat="${cat}"]`) as HTMLElement;
    if (active) active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [cat]);

  return (
    <div className="max-w-lg mx-auto pb-4" dir={isRTL ? "rtl" : "ltr"}>

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-secondary truncate">{greeting(lang)}</p>
            <h1 className="text-xl font-extrabold text-primary leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
              {tr("What would you like?", "إيه اللي تحب تطلب؟")}
            </h1>
          </div>
          <button
            onClick={() => navigate("/barista")}
            className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl"
            style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.2)" }}
          >
            <Sparkles size={12} />
            <span className="hidden xs:inline">{tr("Ask AI", "اسأل")}</span>
            <span className="xs:hidden">AI</span>
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={14} className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none ${isRTL ? "right-3.5" : "left-3.5"}`} />
          <input
            ref={searchRef}
            type="search"
            inputMode="search"
            placeholder={tr("Search menu, ingredients…", "ابحث في القائمة…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full rounded-xl py-2.5 text-sm bg-card border outline-none transition-shadow focus:ring-2 focus:ring-primary/25 ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
            style={{ borderColor: "hsl(var(--border))" }}
          />
          {search && (
            <button
              className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${isRTL ? "left-3" : "right-3"}`}
              onClick={() => setSearch("")}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Category Pills ── */}
      <div ref={catBarRef} className="flex gap-2 overflow-x-auto px-4 mb-4 pb-1" style={{ scrollbarWidth: "none" }}>
        {CATS.filter(c => c.id === "all" || getCatCount(c.id) > 0).map((c) => {
          const active = cat === c.id;
          return (
            <button
              key={c.id}
              data-cat={c.id}
              onClick={() => handleCatChange(c.id)}
              className={`flex items-center gap-1 flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${active ? "text-primary-foreground" : "text-muted-foreground"}`}
              style={active
                ? { background: "hsl(var(--primary))", boxShadow: "0 4px 14px hsl(var(--primary)/0.35)" }
                : { background: "hsl(var(--card))", border: "1px solid hsl(var(--border)/0.7)" }
              }
            >
              <span className="text-sm leading-none">{c.emoji}</span>
              <span>{lang === "ar" ? c.ar : c.en}</span>
              {getCatCount(c.id) > 0 && (
                <span className={`rounded-full text-[9px] font-extrabold px-1.5 py-0.5 min-w-[16px] text-center ${active ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"}`}>
                  {getCatCount(c.id)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Featured horizontal scroll ── */}
      {!loading && !debouncedSearch && cat === "all" && featured.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <h2 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
              🔥 {tr("Popular Now", "الأكثر طلباً")}
            </h2>
            <button onClick={() => navigate("/barista")} className="flex items-center gap-0.5 text-[11px] font-semibold text-secondary">
              {tr("Ask AI", "اسأل الذكاء")} <ChevronRight size={11} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
            {featured.map((item) => {
              const added = justAdded === item.id;
              const inCart = isInCart(item.id);
              return (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-32 rounded-2xl overflow-hidden relative cursor-pointer active:scale-95 transition-transform"
                  style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
                  onClick={() => setSelectedItem(item)}
                >
                  <LazyImage
                    src={item.image || FALLBACK[item.category] || FALLBACK.default}
                    alt={lang === "ar" ? item.nameAr : item.name}
                    className="w-full h-24"
                    fallback={FALLBACK[item.category] || FALLBACK.default}
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)" }} />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-[11px] font-bold leading-tight line-clamp-1">
                      {lang === "ar" ? item.nameAr : item.name}
                    </p>
                    <p className="text-white/80 text-[10px] font-semibold">{item.price} {tr("EGP", "ج.م")}</p>
                  </div>
                  <div
                    className={`absolute top-1.5 ${isRTL ? "left-1.5" : "right-1.5"} w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200`}
                    style={{ background: added ? "#22c55e" : "rgba(255,255,255,0.92)", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
                    onClick={(e) => { e.stopPropagation(); handleAdd(item); }}
                  >
                    {added
                      ? <Check size={12} strokeWidth={3} className="text-white" />
                      : <Plus size={12} strokeWidth={2.5} style={{ color: "hsl(var(--primary))" }} />
                    }
                    {inCart && !added && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                        {getQty(item.id)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="px-3">
        {loading ? (
          <Suspense fallback={
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-muted/60" />)}
            </div>
          }>
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </Suspense>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-5xl mb-3">{debouncedSearch ? "🔍" : "☕"}</p>
            <p className="font-bold text-primary text-base mb-1">
              {debouncedSearch ? tr("Nothing found", "مفيش نتيجة") : tr("Nothing here yet", "لا يوجد عناصر")}
            </p>
            <p className="text-sm text-muted-foreground">
              {debouncedSearch ? tr("Try another keyword", "جرب كلمة أخرى") : tr("Check back soon!", "قريباً!")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map((item, idx) => (
              <MenuItemCard
                key={item.id}
                item={item}
                lang={lang}
                isRTL={isRTL}
                inCart={isInCart(item.id)}
                qty={getQty(item.id)}
                added={justAdded === item.id}
                visible={visible}
                idx={idx}
                onAdd={handleAdd}
                onOpenDetail={setSelectedItem}
                tr={tr}
                FALLBACK={FALLBACK}
              />
            ))}
          </div>
        )}
      </div>

      <div className="h-6" />

      {/* ── Item Detail Modal ── */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          lang={lang}
          isRTL={isRTL}
          inCart={isInCart(selectedItem.id)}
          qty={getQty(selectedItem.id)}
          added={justAdded === selectedItem.id}
          onAdd={handleAdd}
          onClose={() => setSelectedItem(null)}
          tr={tr}
          FALLBACK={FALLBACK}
        />
      )}
    </div>
  );
}
