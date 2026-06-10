import { useState, useEffect, useMemo, useRef } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { Link } from "wouter";
import { Plus, Check, Search, X, Home, ShoppingCart, ClipboardList, Sparkles } from "lucide-react";

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
  { id: "all",        emoji: "✨", en: "All",        ar: "الكل"       },
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

const CAT_COLORS: Record<string, string> = {
  food:       "from-amber-500 to-orange-500",
  sandwiches: "from-pink-500 to-rose-500",
  mains:      "from-emerald-500 to-teal-500",
  burgers:    "from-yellow-500 to-amber-500",
  hot_drinks: "from-amber-600 to-orange-500",
  cold_drinks:"from-cyan-500 to-blue-500",
  fresh:      "from-lime-500 to-green-500",
  milkshake:  "from-pink-400 to-fuchsia-500",
  desserts:   "from-violet-500 to-purple-500",
  shisha:     "from-indigo-500 to-purple-500",
};

const PLACEHOLDERS: Record<string, string> = {
  food: "🍽️", sandwiches: "🥪", mains: "🍖", burgers: "🍔",
  hot_drinks: "☕", cold_drinks: "🥤", fresh: "🍹", milkshake: "🥛",
  desserts: "🍰", shisha: "💨",
};

export default function Menu() {
  const { lang, isRTL } = useLang();
  const { addItem, isInCart, getQty, totalItems } = useCart();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [justAdded, setJustAdded] = useState<string | null>(null);

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
    setTimeout(() => setJustAdded(null), 1000);
  };

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🍽️</span>
          </div>
          <p className="text-amber-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-amber-100 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-amber-800" style={{ fontFamily: "Georgia, serif" }}>Azura</h1>
              <p className="text-xs text-amber-600">{filteredItems.length} items</p>
            </div>
            <div className="flex gap-2">
              <Link href="/barista">
                <button className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                  <Sparkles size={18} />
                </button>
              </Link>
              <Link href="/cart">
                <button className="p-2.5 rounded-xl bg-amber-100 text-amber-700 relative">
                  <ShoppingCart size={18} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </button>
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={16} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"} text-amber-400`} />
            <input
              type="text"
              placeholder={tr("Search...", "ابحث...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full py-2.5 px-9 rounded-xl bg-amber-50 border border-amber-200 text-sm placeholder:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 ${isRTL ? "text-right pr-4" : "text-left pl-4"}`}
            />
            {search && (
              <button onClick={() => setSearch("")} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-3" : "right-3"}`}>
                <X size={16} className="text-amber-400" />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  cat === c.id
                    ? "bg-amber-500 text-white shadow-md"
                    : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50"
                }`}
              >
                {c.emoji} {lang === "ar" ? c.ar : c.en}
              </button>
            ))}
            {cat !== "all" && (
              <button
                onClick={() => { setCat("all"); setSearch(""); }}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-500 text-white"
              >
                <X size={12} className="inline mr-1" /> {tr("Clear", "مسح")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="px-4 py-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🔍</p>
            <p className="text-amber-700 font-bold">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const added = justAdded === item.id;
              const inCart = isInCart(item.id);
              const qty = getQty(item.id);
              const name = lang === "ar" ? item.nameAr : item.name;
              const gradient = CAT_COLORS[item.category] || CAT_COLORS.food;
              const placeholder = PLACEHOLDERS[item.category] || "🍽️";

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-amber-100"
                >
                  {/* Image */}
                  <div className="relative h-32 bg-gradient-to-br from-amber-100 to-orange-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        {placeholder}
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    {/* Category emoji */}
                    <span className="absolute top-2 right-2 text-lg bg-white/90 rounded-full w-8 h-8 flex items-center justify-center shadow">
                      {placeholder}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-bold text-gray-800 text-sm mb-1 leading-tight line-clamp-1">{name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-600 font-bold text-sm">{item.price} LE</span>
                      <button
                        onClick={() => handleAdd(item)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          added
                            ? "bg-green-500 text-white"
                            : inCart
                              ? "bg-amber-500 text-white"
                              : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-110"
                        }`}
                      >
                        {added ? <Check size={16} strokeWidth={3} /> : <Plus size={16} />}
                        {inCart && !added && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                            {qty}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 px-2 pb-2">
        <div
          className="mx-3 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
            border: "1px solid rgba(255,255,255,0.9)"
          }}
        >
          <div className="flex items-center justify-around py-2">
            <Link href="/barista">
              <button className="flex flex-col items-center gap-0.5 px-4 py-1">
                <Sparkles size={20} className="text-amber-600" />
                <span className="text-[10px] text-amber-700 font-medium">{lang === "ar" ? "المساعد" : "AI"}</span>
              </button>
            </Link>
            <button className="flex flex-col items-center gap-0.5 px-4 py-1">
              <div className="p-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
                <Home size={18} className="text-white" />
              </div>
              <span className="text-[10px] text-amber-600 font-bold">{lang === "ar" ? "القائمة" : "Menu"}</span>
            </button>
            <Link href="/cart">
              <button className="flex flex-col items-center gap-0.5 px-4 py-1 relative">
                <ShoppingCart size={20} className="text-amber-600" />
                <span className="text-[10px] text-amber-700 font-medium">{lang === "ar" ? "السلة" : "Cart"}</span>
                {totalItems > 0 && (
                  <span className="absolute top-0 right-3 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>
            </Link>
            <Link href="/orders">
              <button className="flex flex-col items-center gap-0.5 px-4 py-1">
                <ClipboardList size={20} className="text-amber-600" />
                <span className="text-[10px] text-amber-700 font-medium">{lang === "ar" ? "الطلبات" : "Orders"}</span>
              </button>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}