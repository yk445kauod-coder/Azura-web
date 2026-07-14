import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { logUserActivity, updateUserCategoryAffinity } from "@/lib/activityTracker";
import { Search, X, ChevronLeft, ChevronRight, Menu, Smartphone, Wifi, Battery, Home, Search as SearchIcon, Heart, User, AppWindow, ArrowLeft } from "lucide-react";

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

const normalizeText = (text: string) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, "")
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
        animationDelay: `${idx * 15}ms`,
        animation: "fadeInSimple 0.25s ease-out forwards",
        contentVisibility: "auto",
        containIntrinsicSize: "0 200px"
      }}
    >
      <div className="rounded-[1.5rem] overflow-hidden bg-card border border-border/30 shadow-md hover:shadow-lg active:scale-[0.97] transition-all duration-200 group-hover:border-primary/20">
        <div className="relative h-32 sm:h-36 overflow-hidden bg-muted/30">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900/40">
              <span className="text-3xl opacity-40">{cat?.emoji || "📦"}</span>
            </div>
          )}

          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[8px] font-bold flex items-center gap-1">
            <span>{cat?.emoji || "📦"}</span>
            <span>{lang === "ar" ? (item.categoryAr || cat?.ar || item.category) : (cat?.en || item.category)}</span>
          </div>
          {item.recommended && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-black tracking-wide shadow-sm flex items-center gap-1">
              <span>⭐</span>
              <span>{lang === "ar" ? "مُوصى به" : "TOP"}</span>
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-bold text-xs text-foreground truncate">
            {lang === "ar" ? item.nameAr : item.name}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm font-black text-primary">{item.price}</span>
              <span className="text-[8px] text-muted-foreground font-bold uppercase">{lang === "ar" ? "ج.م" : "EGP"}</span>
            </div>
            <div className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[8px] font-bold">
              {lang === "ar" ? "تفاصيل" : "Details"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function ItemModal({ item, onClose, lang, CATS }: { item: MenuItem; onClose: () => void; lang: "en" | "ar"; CATS: any[] }) {
  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;
  const cat = CATS.find(c => c.id === item.category);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ isolation: 'isolate' }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div
        className="relative w-full max-w-md bg-card rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden border border-border/20 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-4 mb-2 sm:hidden" />
        <div className="overflow-y-auto p-5 sm:p-6 scroll-hide">
          <div className="flex flex-col gap-4">
            <div className="w-full h-40 rounded-xl overflow-hidden bg-muted flex-shrink-0">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl bg-slate-800">
                  {cat?.emoji || "📦"}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-xl font-bold text-foreground leading-tight">
                    {item.name}
                  </h2>
                  {item.nameAr && (
                    <p className="text-base text-muted-foreground font-medium mt-1" dir="rtl">
                      {item.nameAr}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={lang === "ar" ? "إغلاق" : "Close"}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl font-black text-primary">{item.price}</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  {lang === "ar" ? "ج.م" : "EGP"}
                </span>
                <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {cat?.emoji || "📦"} {lang === "ar" ? (item.categoryAr || cat?.ar || item.category) : (cat?.en || item.category)}
                </span>
              </div>

              {(item.description || item.descriptionAr) && (
                <div className="mb-4 p-3 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-xs text-foreground/80 leading-relaxed italic">
                    "{lang === "ar" ? (item.descriptionAr || item.description) : item.description}"
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center text-[8px]">🧾</span>
                {tr("Detailed Specifications", "المواصفات والتفاصيل")}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {((lang === "ar" && item.ingredientsAr && item.ingredientsAr.length > 0) ? item.ingredientsAr : item.ingredients) && ((lang === "ar" && item.ingredientsAr && item.ingredientsAr.length > 0) ? item.ingredientsAr : item.ingredients)!.length > 0 ? (
                  ((lang === "ar" && item.ingredientsAr && item.ingredientsAr.length > 0) ? item.ingredientsAr : item.ingredients)!.map((ing, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1.5 rounded-lg bg-card border border-border/60 text-[10px] font-medium text-foreground/70 flex items-center gap-1.5"
                    >
                      <div className="w-1 h-1 rounded-full bg-primary/55" />
                      {ing}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="px-2.5 py-1.5 rounded-lg bg-card border border-border/60 text-[10px] font-medium text-foreground/70 flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-primary/55" />
                      {lang === "ar" ? "مواصفات ممتازة" : "Premium details"}
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-card border border-border/60 text-[10px] font-medium text-foreground/70 flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-primary/55" />
                      {lang === "ar" ? "جودة مضمونة" : "Verified quality"}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-border/40">
              <button
                onClick={onClose}
                className="btn-primary w-full py-3 rounded-xl text-xs font-bold shadow-md shadow-primary/10"
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

  // Dynamic customization and styling states
  const [ddsConfig, setDdsConfig] = useState<any>(null);
  const [curTime, setCurTime] = useState("");

  const tr = useCallback((en: string, ar: string) => lang === "ar" ? ar : en, [lang]);

  // Handle simulated Android-style status bar clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateClock();
    const timer = setInterval(updateClock, 60000);
    return () => clearInterval(timer);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    const element = document.getElementById("android-content-scroller");
    if (element) {
      element.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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

        // Dynamically update root colors from onboarding setup!
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

  const brandName = ddsConfig?.brandName || "DDS Display";
  const brandSlogan = ddsConfig?.brandTagline || tr("Interactive workspace portal", "بوابة تفاعلية ذكية");

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-3 font-arabic" dir={isRTL ? "rtl" : "ltr"}>

      {/* Dynamic Cozy Android-Style Shell Wrapper */}
      <div className="relative w-full max-w-md h-[812px] bg-slate-900 border-[10px] border-slate-950 rounded-[3rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">

        {/* Android Top Notch Screen Status Bar */}
        <div className="h-10 bg-slate-900 text-slate-400 text-xs px-6 flex items-center justify-between select-none border-b border-slate-800/20">
          <span className="font-semibold font-mono tracking-wider">{curTime}</span>
          <div className="absolute left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-b-xl" />
          <div className="flex items-center gap-1.5 text-slate-300">
            <Wifi size={12} className="text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold font-mono tracking-tighter">5G</span>
            <Battery size={14} className="text-emerald-500" />
          </div>
        </div>

        {/* Dynamic Android Body Content */}
        <div id="android-content-scroller" className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 scrollbar-hide flex flex-col pb-20">

          {/* Top Cozy Branding Banner card */}
          <div className="p-4 bg-gradient-to-r from-primary/10 to-transparent border-b border-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-extrabold text-sm border border-primary/30 text-primary">
                DDS
              </div>
              <div className="min-w-0">
                <h1 className="font-extrabold text-sm text-slate-100 truncate">{brandName}</h1>
                <p className="text-[10px] text-muted-foreground truncate">{brandSlogan}</p>
              </div>
            </div>
          </div>

          {/* Elegant Floating Search Box */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search size={14} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3.5" : "left-3.5"} text-slate-500`} />
              <input
                type="text"
                placeholder={tr("Search dynamically...", "بحث تفاعلي فوري...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 focus:border-primary text-slate-100 placeholder-slate-500 focus:outline-none ${
                  isRTL ? "pr-9 pl-4" : "pl-9 pr-4"
                }`}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-3.5" : "right-3.5"} text-slate-400 hover:text-slate-200`}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Cozy Scrollable horizontal category list */}
          <div className="px-4 py-1.5 overflow-x-auto scroll-hide flex gap-2 border-b border-slate-800/30">
            {activeCats.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCat(c.id);
                  if (search) setSearch("");
                }}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap
                  transition-all duration-200 shadow-sm border
                  ${cat === c.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-slate-950/60 text-slate-400 border-slate-800/80 hover:bg-slate-900"
                  }
                `}
              >
                <span>{c.emoji}</span>
                <span>{lang === "ar" ? c.ar : c.en}</span>
              </button>
            ))}
          </div>

          {/* Grid Layout of results */}
          <div className="p-4 flex-1">
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-sm animate-pulse h-40" />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center">
                <span className="text-5xl mb-3">🔍</span>
                <p className="text-xs font-bold text-slate-400">{tr("No dynamic entries found", "لا توجد نتائج مطابقة")}</p>
                <button
                  onClick={() => { setSearch(""); setCat("all"); }}
                  className="mt-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold"
                >
                  {tr("Reset Search", "إعادة ضبط")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
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

            {/* Simulated Android Pagination Footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 text-[10px] bg-slate-950/50 p-2 rounded-xl border border-slate-850">
                <button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-slate-300 disabled:opacity-30"
                >
                  {tr("Prev", "السابق")}
                </button>
                <span className="text-slate-500 font-mono">Page {page} of {totalPages}</span>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-slate-300 disabled:opacity-30"
                >
                  {tr("Next", "التالي")}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Simulated Android Sticky Bottom Navigation Bar */}
        <div className="absolute bottom-0 inset-x-0 h-14 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/40 flex items-center justify-around text-slate-400 z-40 px-4">
          <button onClick={() => { setCat("all"); setSearch(""); }} className="flex flex-col items-center gap-1 text-primary">
            <Home size={16} />
            <span className="text-[9px] font-bold font-mono">{tr("Home", "الرئيسية")}</span>
          </button>
          <button onClick={() => { const el = document.getElementById("android-content-scroller"); el?.scrollTo({ top: 120, behavior: "smooth" }); }} className="flex flex-col items-center gap-1 hover:text-slate-200">
            <SearchIcon size={16} />
            <span className="text-[9px] font-bold font-mono">{tr("Explore", "استكشاف")}</span>
          </button>
          <button onClick={() => { setSearch("top"); }} className="flex flex-col items-center gap-1 hover:text-slate-200">
            <Heart size={16} />
            <span className="text-[9px] font-bold font-mono">{tr("Favorite", "المفضلة")}</span>
          </button>
        </div>

        {/* Android Screen Bottom Native Bar indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full z-50 pointer-events-none" />

      </div>

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
