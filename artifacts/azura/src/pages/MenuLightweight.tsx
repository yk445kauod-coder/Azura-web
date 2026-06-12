import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "wouter";
import { Search, Plus, Check, ChevronLeft, ChevronRight, Grid, List, SlidersHorizontal } from "lucide-react";

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
  { id: "all",        emoji: "🍽️", en: "All",      ar: "الكل"       },
  { id: "food",       emoji: "🍴",  en: "Food",    ar: "طعام"       },
  { id: "sandwiches", emoji: "🥪",  en: "Sandwich", ar: "ساندوتش"   },
  { id: "mains",      emoji: "🍖",  en: "Mains",   ar: "أطباق"      },
  { id: "burgers",    emoji: "🍔",  en: "Burgers", ar: "برجر"       },
  { id: "hot_drinks", emoji: "☕",  en: "Hot",     ar: "ساخن"       },
  { id: "cold_drinks",emoji: "🥤",  en: "Cold",    ar: "بارد"       },
  { id: "fresh",      emoji: "🍹",  en: "Fresh",    ar: "طازج"       },
  { id: "milkshake",  emoji: "🥛",  en: "Shakes",   ar: "شيك"        },
  { id: "desserts",   emoji: "🍰",  en: "Sweets",   ar: "حلويات"     },
  { id: "shisha",     emoji: "💨",  en: "Shisha",   ar: "شيشة"       },
];

const ITEMS_PER_PAGE = 15;

const FALLBACK = "https://images.unsplash.com/photo-1568471173242-461f0a730452?w=200&q=60";

export default function MenuLightweight() {
  const { lang, isRTL } = useLang();
  const { addItem, isInCart, getQty } = useCart();
  const [, navigate] = useLocation();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [justAdded, setJustAdded] = useState<string | null>(null);
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
      if (cat !== "all" && item.category !== cat) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.nameAr.includes(q);
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
    return items.filter((i) => i.available && i.category === c).length;
  }, [items]);

  const handleAdd = useCallback((item: MenuItem) => {
    addItem({ id: item.id, name: item.name, nameAr: item.nameAr, price: item.price, category: item.category, image: item.image });
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 1200);
  }, [addItem]);

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-primary text-primary-foreground px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{tr("Menu", "القائمة")}</h1>
            <p className="text-xs text-primary-foreground/70">{filtered.length} {tr("items", "عنصر")}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg ${viewMode === "table" ? "bg-white/20" : "bg-white/10"}`}>
              <List size={18} />
            </button>
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-white/20" : "bg-white/10"}`}>
              <Grid size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-[60px] z-20 bg-background px-4 py-3 border-b">
        <div className="relative">
          <Search size={16} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"} text-muted-foreground`} />
          <input
            ref={searchRef}
            type="text"
            placeholder={tr("Search...", "ابحث...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full py-2.5 rounded-xl text-sm ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} bg-muted`}
          />
        </div>
      </div>

      {/* Categories - Horizontal Scroll */}
      <div className="sticky top-[108px] z-10 bg-background px-4 py-2 overflow-x-auto scroll-hide border-b">
        <div className="flex gap-2 min-w-max">
          {CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                cat === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <span>{c.emoji}</span>
              <span>{lang === "ar" ? c.ar : c.en}</span>
              <span className={`text-[10px] ${cat === c.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {catCount(c.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">☕</p>
            <p className="font-bold text-primary">{tr("Nothing found", "لا توجد نتائج")}</p>
          </div>
        ) : viewMode === "table" ? (
          /* TABLE VIEW */
          <div className="space-y-2">
            {paginated.map((item) => {
              const added = justAdded === item.id;
              const inCart = isInCart(item.id);
              const qty = getQty(item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border transition-all hover:shadow-md"
                  style={{ boxShadow: inCart ? "0 0 0 2px hsl(var(--primary)/0.3)" : "var(--shadow-sm)" }}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {CATS.find(c => c.id === item.category)?.emoji || "🍽️"}
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{item.name}</p>
                    {item.nameAr && <p className="text-xs text-muted-foreground truncate">{item.nameAr}</p>}
                    <p className="text-primary font-extrabold text-sm mt-0.5">{item.price} EGP</p>
                  </div>
                  
                  {/* Add Button */}
                  <button
                    onClick={() => handleAdd(item)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      added ? "bg-green-500" : inCart ? "bg-primary" : "bg-primary/90"
                    } text-primary-foreground`}
                  >
                    {added ? <Check size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={2.5} />}
                    {inCart && !added && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {qty}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-2 gap-3">
            {paginated.map((item) => {
              const added = justAdded === item.id;
              const inCart = isInCart(item.id);
              const qty = getQty(item.id);
              return (
                <div key={item.id} className="rounded-xl overflow-hidden bg-card border">
                  <div className="aspect-square bg-muted relative">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        {CATS.find(c => c.id === item.category)?.emoji || "🍽️"}
                      </div>
                    )}
                    {inCart && (
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {qty}
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="font-bold text-xs truncate">{item.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-primary font-extrabold text-sm">{item.price}</p>
                      <button
                        onClick={() => handleAdd(item)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${added ? "bg-green-500" : "bg-primary"} text-primary-foreground`}
                      >
                        {added ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-muted disabled:opacity-30"
            >
              {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <span className="text-sm font-semibold px-3">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-muted disabled:opacity-30"
            >
              {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        )}
      </div>

      {/* Bottom spacer for nav */}
      <div className="h-20" />
    </div>
  );
}