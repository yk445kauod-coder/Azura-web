import { useState, useEffect, useMemo, useCallback } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { Search, Info, X } from "lucide-react";

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
  { id: "all",        emoji: "🍽️", en: "All",      ar: "الكل"       },
  { id: "coffee",     emoji: "☕",  en: "Coffee",   ar: "قهوة"       },
  { id: "food",       emoji: "🍴",  en: "Food",     ar: "طعام"       },
  { id: "beverages",  emoji: "🥤",  en: "Drinks",  ar: "مشروبات"    },
  { id: "desserts",   emoji: "🍰",  en: "Sweets",  ar: "حلويات"     },
  { id: "shisha",     emoji: "💨",  en: "Shisha",  ar: "شيشة"       },
];

const FALLBACK: Record<string, string> = {
  coffee:    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80",
  food:      "https://images.unsplash.com/photo-1568471173242-461f0a730452?w=500&q=80",
  beverages: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80",
  desserts:  "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&q=80",
  shisha:    "https://images.pexels.com/photos/760280/pexels-photo-760280.jpeg?w=500",
};

function greeting(lang: "en" | "ar") {
  const h = new Date().getHours();
  if (h < 12) return lang === "ar" ? "صباح الخير! ☀️" : "Good morning! ☀️";
  if (h < 17) return lang === "ar" ? "طيب النهار! 🌤️" : "Good afternoon! 🌤️";
  return lang === "ar" ? "مساء النور! 🌙" : "Good evening! 🌙";
}

export default function Menu() {
  const { lang, isRTL } = useLang();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const tr = useCallback((en: string, ar: string) => lang === "ar" ? ar : en, [lang]);

  useEffect(() => {
    const menuRef = ref(db, "menu");
    onValue(menuRef, (snap) => {
      if (!snap.exists()) { setLoading(false); return; }
      const data = snap.val() as Record<string, Record<string, unknown>>;
      const result: MenuItem[] = [];
      Object.entries(data).forEach(([key, val]) => {
        if (typeof val !== "object" || !val) return;
        const v = val as Record<string, unknown>;
        if (v.price !== undefined || v.name !== undefined) {
          result.push(normalizeItem(key, v));
        } else {
          Object.entries(v).forEach(([itemId, itemData]) => {
            if (typeof itemData === "object" && itemData) {
              result.push(normalizeItem(itemId, itemData as Record<string, unknown>));
            }
          });
        }
      });
      setItems(result);
      setLoading(false);
    });
    return () => off(ref(db, "menu"));
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!item.available) return false;
      if (cat !== "all" && item.category !== cat) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.name.toLowerCase().includes(q) || 
               item.nameAr.includes(q) || 
               item.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, cat, search]);

  const catCount = useCallback((c: string) => {
    if (c === "all") return items.filter((i) => i.available).length;
    return items.filter((i) => i.available && i.category === c).length;
  }, [items]);

  return (
    <div className="max-w-2xl mx-auto pb-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-sm font-semibold text-secondary">{greeting(lang)}</p>
        <h1 className="text-[22px] font-extrabold text-primary" style={{ fontFamily: "var(--font-heading)" }}>
          {tr("Our Menu", "قائمتنا")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {tr("Browse our selection of coffee, food, and more!", "تصفح تشكيلتنا من القهوة والطعام والمزيد!")}
        </p>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={14} className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${isRTL ? "right-3.5" : "left-3.5"}`} />
          <input
            type="text"
            placeholder={tr("Search…", "ابحث…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`input-field py-2.5 text-sm ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto scroll-hide px-4 mb-4 pb-0.5">
        {CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`flex items-center gap-1.5 flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              cat === c.id ? "text-primary-foreground scale-105" : "text-muted-foreground hover:text-foreground"
            }`}
            style={cat === c.id
              ? { background: "hsl(var(--primary))", boxShadow: "var(--shadow-primary)" }
              : { background: "hsl(var(--card))", boxShadow: "var(--shadow-xs)", border: "1px solid rgba(93,62,35,0.08)" }
            }
          >
            <span className="text-sm">{c.emoji}</span>
            {lang === "ar" ? c.ar : c.en}
            <span className={`rounded-full text-[9px] font-extrabold px-1.5 py-0.5 min-w-[18px] text-center ${cat === c.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
              {catCount(c.id)}
            </span>
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl animate-pulse bg-muted/60" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🔍</p>
            <p className="font-bold text-primary text-base mb-1">
              {search ? tr("Nothing found", "مفيش نتيجة") : tr("Nothing here yet", "لا يوجد عناصر")}
            </p>
            <p className="text-sm text-muted-foreground">
              {search ? tr("Try another keyword", "جرب كلمة أخرى") : tr("Check back soon!", "قريباً!")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => {
              const imgSrc = item.image || FALLBACK[item.category] || FALLBACK.coffee;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all hover:scale-[1.02]"
                  style={{
                    background: "hsl(var(--card))",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div className="relative overflow-hidden bg-muted" style={{ paddingTop: "68%" }}>
                    <img
                      src={imgSrc}
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK[item.category] || FALLBACK.coffee; }}
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white/90"
                      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
                      {CATS.find((c) => c.id === item.category)?.emoji} {CATS.find((c) => c.id === item.category)?.en || item.category}
                    </span>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-bold text-sm text-foreground leading-tight mb-0.5">{item.name}</h3>
                    {item.nameAr && <p className="text-[11px] text-muted-foreground mb-1">{item.nameAr}</p>}
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 flex-1 mb-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <span className="font-extrabold text-primary text-base leading-none">
                        {item.price} {lang === "ar" ? "ج.م" : "EGP"}
                      </span>
                      <button className="p-2 rounded-full bg-primary/10 text-primary">
                        <Info size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setSelectedItem(null)}>
          <div 
            className="w-full max-w-lg bg-background rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideUp 0.3s ease" }}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-extrabold text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                {selectedItem.name}
              </h2>
              <button onClick={() => setSelectedItem(null)} className="p-2 rounded-full hover:bg-muted">
                <X size={20} />
              </button>
            </div>
            
            {selectedItem.nameAr && (
              <p className="text-lg text-muted-foreground mb-2">{selectedItem.nameAr}</p>
            )}
            
            <div className="w-full h-48 rounded-2xl overflow-hidden mb-4">
              <img
                src={selectedItem.image || FALLBACK[selectedItem.category] || FALLBACK.coffee}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-extrabold text-primary">
                {selectedItem.price} {lang === "ar" ? "ج.م" : "EGP"}
              </span>
              <span className="text-sm px-3 py-1 rounded-full bg-muted">
                {CATS.find((c) => c.id === selectedItem.category)?.emoji} {selectedItem.category}
              </span>
            </div>
            
            {(selectedItem.description || selectedItem.descriptionAr) && (
              <div className="space-y-2">
                {selectedItem.description && (
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                )}
                {selectedItem.descriptionAr && (
                  <p className="text-sm text-muted-foreground" dir="rtl">{selectedItem.descriptionAr}</p>
                )}
              </div>
            )}
            
            {!selectedItem.available && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium">
                {tr("Currently unavailable", "غير متاح حالياً")}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
