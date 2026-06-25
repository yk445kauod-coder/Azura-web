import { useState, useEffect, useMemo } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { Plus, Check, Search } from "lucide-react";

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
  { id: "all", emoji: "✨", en: "All", ar: "الكل" },
  { id: "food", emoji: "🍽️", en: "Food", ar: "طعام" },
  { id: "sandwiches", emoji: "🥪", en: "Sandwiches", ar: "ساندوتشات" },
  { id: "mains", emoji: "🍖", en: "Mains", ar: "أطباق" },
  { id: "burgers", emoji: "🍔", en: "Burgers", ar: "برجر" },
  { id: "hot_drinks", emoji: "☕", en: "Hot", ar: "ساخن" },
  { id: "cold_drinks", emoji: "🧊", en: "Cold", ar: "بارد" },
  { id: "fresh", emoji: "🍹", en: "Fresh", ar: "عصائر" },
  { id: "milkshake", emoji: "🥛", en: "Shakes", ar: "شيك" },
  { id: "desserts", emoji: "🍰", en: "Desserts", ar: "حلويات" },
  { id: "shisha", emoji: "💨", en: "Shisha", ar: "شيشة" },
];

export default function MenuJoyful() {
  const { lang } = useLang();
  const { addItem, getQty } = useCart();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  useEffect(() => {
    const menuRef = ref(db, "menu");
    const unsub = onValue(menuRef, (snap) => {
      if (!snap.exists()) { setItems([]); setLoading(false); return; }
      const data = snap.val() as Record<string, Record<string, unknown>>;
      const list: MenuItem[] = [];
      Object.entries(data).forEach(([, categoryItems]) => {
        if (typeof categoryItems === "object") {
          Object.entries(categoryItems).forEach(([id, raw]) => {
            if (raw && typeof raw === "object") {
              list.push(normalizeItem(id, raw as Record<string, unknown>));
            }
          });
        }
      });
      setItems(list.filter(i => i.available));
      setLoading(false);
    });
    return () => { try { off(menuRef); } catch {} };
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (activeCat !== "all") {
      result = result.filter(item => item.category === activeCat);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.nameAr.includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, activeCat, searchQuery]);

  const handleAdd = (item: MenuItem) => {
    addItem({ id: item.id, name: item.name, nameAr: item.nameAr, price: item.price, image: item.image, category: item.category });
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-2xl font-bold text-foreground mb-3">{tr("Our Menu", "قائمتنا")}</h1>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input type="text" placeholder={tr("Search...", "ابحث...")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/50 border-0 text-sm" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATS.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCat(cat.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${activeCat === cat.id ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                <span>{cat.emoji}</span>
                <span>{tr(cat.en, cat.ar)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-3">{filteredItems.length} {tr("items", "عنصر")}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const qty = getQty(item.id);
            const isAdded = justAdded === item.id;
            const cat = CATS.find(c => c.id === item.category);
            
            return (
              <div key={item.id} className="card-elevated rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative aspect-square overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center"><p className="text-white text-sm font-medium px-2 text-center">{item.name}</p></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-[10px] font-medium">{cat?.emoji} {tr(cat?.en || "", cat?.ar || "")}</div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-foreground text-sm line-clamp-1">{lang === "ar" && item.nameAr ? item.nameAr : item.name}</h3>
                  {item.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{lang === "ar" && item.descriptionAr ? item.descriptionAr : item.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="font-bold text-primary">{item.price} {tr("EGP", "ج.م")}</p>
                      {qty > 0 && <p className="text-xs text-muted-foreground">{qty} {tr("in cart", "في السلة")}</p>}
                    </div>
                    <button onClick={() => handleAdd(item)} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isAdded ? "bg-green-500 text-white" : qty > 0 ? "bg-primary/10 text-primary" : "bg-primary text-primary-foreground shadow-lg hover:shadow-xl"}`}>
                      {isAdded ? <Check size={18} /> : qty > 0 ? <span className="text-sm font-bold">{qty}</span> : <Plus size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-muted-foreground">{tr("No items found", "لم يتم العثور على عناصر")}</p>
          </div>
        )}
      </div>
    </div>
  );
}