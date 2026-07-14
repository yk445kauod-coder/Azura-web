import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { logUserActivity, updateUserCategoryAffinity } from "@/lib/activityTracker";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";

interface MenuItem {
  id: string; name: string; nameAr: string;
  description: string; descriptionAr: string;
  price: number; category: string; categoryAr?: string; available: boolean; image: string;
  ingredients?: string[];
  ingredientsAr?: string[];
  recommended?: boolean;
  searchStr?: string;
}

function normalizeItem(id: string, raw: Record<string, any>): MenuItem {
  const name = String(raw.name || raw.nameEn || raw.title || "");
  const nameAr = String(raw.nameAr || raw.titleAr || "");
  const description = String(raw.description || raw.descEn || raw.desc || "");
  const descriptionAr = String(raw.descriptionAr || raw.descAr || "");
  const category = String(raw.category || "general");
  const categoryAr = String(raw.categoryAr || "");
  const ingredients = Array.isArray(raw.ingredients) ? raw.ingredients as string[] : (typeof raw.ingredients === "string" ? raw.ingredients.split(",").map((i: string) => i.trim()) : []);
  const ingredientsAr = Array.isArray(raw.ingredientsAr) ? raw.ingredientsAr as string[] : (typeof raw.ingredientsAr === "string" ? raw.ingredientsAr.split("،").map((i: string) => i.trim()) : []);

  const searchStr = normalizeText([
    name,
    nameAr,
    description,
    descriptionAr,
    category,
    ...ingredients,
    ...ingredientsAr
  ].join(" "));

  return {
    id,
    name,
    nameAr,
    description,
    descriptionAr,
    price: Number(raw.price) || 0,
    category,
    categoryAr,
    available: raw.available !== false,
    image: String(raw.image || raw.img || ""),
    recommended: raw.recommended === true,
    ingredients,
    ingredientsAr,
    searchStr,
  };
}

// Advanced Search Normalization & Synonyms
const normalizeText = (text: string) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, "") // Remove Harakat
    .trim();
};

const SEARCH_SYNONYMS: Record<string, string[]> = {
  "طبيب": ["دكتور", "doctor", "أخصائي", "specialist"],
  "غرفة": ["جناح", "suite", "room", "غرف"],
  "كورس": ["دورة", "مسار", "course", "تعليم"],
  "منتج": ["جهاز", "حقيبة", "product", "أجهزة"],
  "قهوه": ["كوفي", "coffee", "لاتيه"],
  "شاي": ["tea"],
  "عصير": ["juice", "فرش", "fresh"]
};

const NORMALIZED_SYNONYMS = Object.entries(SEARCH_SYNONYMS).map(([key, synonyms]) => ({
  key: normalizeText(key),
  synonyms: synonyms.map(s => normalizeText(s))
}));

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
      <div className="rounded-2xl overflow-hidden bg-card border border-border/30 shadow-md hover:shadow-lg active:scale-[0.97] transition-all duration-200 group-hover:border-primary/20">
        <div className="relative h-36 overflow-hidden bg-muted/30">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl opacity-40">{cat?.emoji || "📦"}</span>
            </div>
          )}

          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[9px] font-bold flex items-center gap-1">
            <span>{cat?.emoji || "📦"}</span>
            <span>{lang === "ar" ? (item.categoryAr || cat?.ar || item.category) : (cat?.en || item.category)}</span>
          </div>
          {item.recommended && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-amber-200/50 text-white text-[9px] font-black tracking-wide shadow-sm flex items-center gap-1">
              <span>⭐</span>
              <span>{lang === "ar" ? "مُوصى به" : "TOP"}</span>
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

// Item Detail Modal Component
function ItemModal({ item, onClose, lang, CATS }: { item: MenuItem; onClose: () => void; lang: "en" | "ar"; CATS: any[] }) {
  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;
  const cat = CATS.find(c => c.id === item.category);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ isolation: 'isolate' }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div
        className="relative w-full max-w-md bg-card rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl overflow-hidden border border-border/20 flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-4 mb-2 sm:hidden" />
        <div className="overflow-y-auto p-6 sm:p-8 scroll-hide">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-48 h-48 sm:h-48 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  {cat?.emoji || "📦"}
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
                  aria-label={lang === "ar" ? "إغلاق" : "Close"}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-black text-primary">{item.price}</span>
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  {lang === "ar" ? "ج.م" : "EGP"}
                </span>
                <span className="ml-auto badge bg-primary/5 text-primary border border-primary/10">
                  {cat?.emoji || "📦"} {lang === "ar" ? (item.categoryAr || cat?.ar || item.category) : (cat?.en || item.category)}
                </span>
              </div>

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
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">🧾</span>
                {tr("Detailed Specifications", "المواصفات والتفاصيل")}
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
                      {lang === "ar" ? "مواصفات ممتازة" : "Premium details"}
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-card border border-border/60 text-xs font-medium text-foreground/70 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary/40" />
                      {lang === "ar" ? "جودة مضمونة" : "Verified quality"}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 mt-2 border-t border-border/40">
              <button
                onClick={onClose}
                className="btn-primary w-full py-4 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20"
              >
                {tr("Back to Catalog", "العودة للكتالوج")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MenuLightweight() {
  const { lang, isRTL } = useLang();
  const { user } = useAuth();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Dynamic branding configuration states
  const [ddsConfig, setDdsConfig] = useState<any>(null);

  const tr = useCallback((en: string, ar: string) => lang === "ar" ? ar : en, [lang]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSelectItem = useCallback((item: MenuItem | null) => {
    setSelectedItem(item);
    if (user?.uid && item) {
      logUserActivity(user.uid, "view_item", {
        itemId: item.id,
        name: item.name,
        category: item.category
      }, 6);
      updateUserCategoryAffinity(user.uid, item.category, 8);
    }
  }, [user?.uid]);

  // Load configs & dynamic colors
  useEffect(() => {
    const ddsRef = ref(db, "dds-config");
    onValue(ddsRef, (snap) => {
      if (snap.exists()) {
        const cfg = snap.val();
        setDdsConfig(cfg);

        // Dynamically update document properties from onboarding setup!
        if (cfg.colors) {
          document.documentElement.style.setProperty("--primary", cfg.colors.primary);
          if (cfg.colors.secondary) document.documentElement.style.setProperty("--secondary", cfg.colors.secondary);
          if (cfg.colors.accent) document.documentElement.style.setProperty("--accent", cfg.colors.accent);
          if (cfg.colors.background) document.documentElement.style.setProperty("--background", cfg.colors.background);
          if (cfg.colors.card) document.documentElement.style.setProperty("--card", cfg.colors.card);
        }
      }
    });

    const menuRef = ref(db, "menu");
    onValue(menuRef, (snap) => {
      if (!snap.exists()) { setLoading(false); return; }
      const data = snap.val() as Record<string, Record<string, any>>;
      const result: MenuItem[] = [];
      Object.entries(data).forEach(([key, val]) => {
        if (typeof val !== "object" || val === null) return;
        const v = val as Record<string, any>;
        if (v.price !== undefined || v.name !== undefined) {
          result.push(normalizeItem(key, v));
        } else {
          Object.entries(v).forEach(([subId, subVal]) => {
            if (typeof subVal === "object" && subVal !== null)
              result.push(normalizeItem(subId, subVal as Record<string, any>));
          });
        }
      });
      setItems(result);
      setLoading(false);
    });

    return () => {
      off(ddsRef);
      off(menuRef);
    };
  }, []);

  // Compute dynamic category items from active database
  const CATS = useMemo(() => {
    const uniqueCats = Array.from(new Set(items.map(i => i.category)));
    const mapped = uniqueCats.map(catId => {
      const matched = items.find(i => i.category === catId);
      let emoji = "📦";
      if (catId === "specialists" || catId === "doctors") emoji = "🩺";
      else if (catId === "courses") emoji = "🎓";
      else if (catId === "suites_rooms") emoji = "🏨";
      else if (catId === "tech_gadgets") emoji = "🔌";
      else if (catId === "announcements") emoji = "📢";
      else if (catId === "coffee") emoji = "☕";

      return {
        id: catId,
        emoji,
        en: matched?.categoryAr ? catId.replace(/_/g, " ") : catId,
        ar: matched?.categoryAr || catId
      };
    });

    return [
      { id: "all", emoji: "✨", en: "All", ar: "الكل" },
      ...mapped
    ];
  }, [items]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch.trim() && user?.uid) {
      logUserActivity(user.uid, "search_menu", { query: debouncedSearch.trim() }, 3);
    }
  }, [debouncedSearch, user?.uid]);

  useEffect(() => { setPage(1); }, [cat, debouncedSearch]);

  const { filtered, counts, activeCats } = useMemo(() => {
    const countsMap: Record<string, number> = {};
    CATS.forEach(c => countsMap[c.id] = 0);

    const filteredList = items.filter((item) => {
      if (!item.available) return false;

      const itemCatLower = item.category.toLowerCase();
      const itemSearchStr = item.searchStr || "";

      CATS.forEach(c => {
        if (c.id === "all") {
          countsMap["all"]++;
        } else if (itemCatLower === c.id) {
          countsMap[c.id]++;
        }
      });

      if (debouncedSearch) {
        const q = normalizeText(debouncedSearch);
        let isMatch = itemSearchStr.includes(q);

        if (!isMatch) {
          for (const entry of NORMALIZED_SYNONYMS) {
            const { key: normalizedKey, synonyms } = entry;
            if (q.includes(normalizedKey) || normalizedKey.includes(q)) {
              if (synonyms.some(s => itemSearchStr.includes(s))) {
                isMatch = true;
                break;
              }
            }
          }
        }
        if (!isMatch) return false;
      }

      if (cat !== "all" && itemCatLower !== cat) return false;

      return true;
    });

    const active = CATS.filter(c => c.id === "all" || countsMap[c.id] > 0);
    return { filtered: filteredList, counts: countsMap, activeCats: active };
  }, [items, cat, debouncedSearch, CATS]);

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  // Dynamic text bindings
  const brandName = ddsConfig?.brandName || "DDS Display";
  const brandSlogan = ddsConfig?.brandTagline || tr("Interactive workspace portal", "بوابة تفاعلية ذكية");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3F4F6] to-[#E5E7EB] dark:from-slate-950 dark:to-slate-900" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-md">
        <div className="relative px-4 pt-4 pb-3 flex items-center gap-3 overflow-hidden">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-2xl blur-lg opacity-40 bg-white/30" />
            <div className="relative rounded-2xl p-[3px] border border-white/20 bg-white/10 text-white font-extrabold w-12 h-12 flex items-center justify-center">
              DDS
            </div>
          </div>

          <div className="flex-1 min-w-0 z-10">
            <h1 className="text-base font-extrabold truncate leading-tight">
              {brandName}
            </h1>
            <p className="text-[10px] text-white/70 italic truncate mt-0.5">
              {brandSlogan}
            </p>
            <p className="text-[9px] text-white/50 mt-0.5">
              {filtered.length} {tr("items loaded", "صنف متوفر")}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative px-4 pb-3">
          <Search size={16} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-7" : "left-7"} text-gray-400`} />
          <input
            type="text"
            placeholder={tr("Search catalog...", "ابحث في الكتالوج...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full py-2.5 rounded-xl text-xs bg-white text-slate-900 border-0 focus:ring-2 focus:ring-primary ${
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

      {/* Categories chips */}
      <div className="sticky top-[105px] z-20 bg-background/95 backdrop-blur-md px-4 py-3 border-b border-border">
        <div className="flex gap-2 overflow-x-auto scroll-hide pb-1">
          {activeCats.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCat(c.id);
                if (search) setSearch("");
              }}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap
                transition-all duration-200 shadow-sm
                ${cat === c.id 
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-card text-muted-foreground border border-border hover:bg-muted"
                }
              `}
            >
              <span className="text-sm">{c.emoji}</span>
              <span>{lang === "ar" ? c.ar : c.en}</span>
              <span className={`
                text-[9px] px-1.5 py-0.5 rounded-full font-bold
                ${cat === c.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}
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
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm animate-pulse">
                <div className="relative h-36 bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="text-7xl mb-4 animate-bounce">🔍</div>
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">{tr("No catalog entries found", "لا توجد نتائج مطابقة")}</p>
            <p className="text-xs text-slate-400 mt-1">{tr("Try a different keywords", "جرب كلمات بحث أخرى")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {paginated.map((item, idx) => (
              <MenuItemCard
                key={item.id}
                item={item}
                lang={lang}
                idx={idx}
                onClick={handleSelectItem}
                CATS={CATS}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-4 mt-8 mb-4">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-border flex items-center gap-1 disabled:opacity-30 text-xs font-bold"
              >
                {isRTL ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                <span>{tr("Prev", "السابق")}</span>
              </button>

              <div className="flex items-center gap-1.5 mx-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                      page === (i + 1)
                        ? "bg-primary text-primary-foreground shadow"
                        : "bg-white dark:bg-slate-900 border border-border hover:bg-muted text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-border flex items-center gap-1 disabled:opacity-30 text-xs font-bold"
              >
                <span>{tr("Next", "التالي")}</span>
                {isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-24" />
      
      {selectedItem && (
        <ItemModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
          lang={lang}
          CATS={CATS}
        />
      )}
    </div>
  );
}
