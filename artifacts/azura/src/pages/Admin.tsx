import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import {
  db, ref, onValue, off, update, set, push, remove, get,
  forceReseedMenu, mergeMenuIngredients
} from "@/lib/firebase";
import {
  smartGet, smartSet, smartUpdate, smartRemove, smartPush,
  getDBMode, setDBMode, onModeChange
} from "@/lib/dbWrapper";
import {
  testR2Connection, type R2Config, listR2Objects, downloadFromR2, uploadToR2
} from "@/lib/r2";
import { useLang } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { encryptKey } from "@/lib/crypto";
import { swalSuccess, swalError, swalConfirm, swalLoading, swalClose } from "@/lib/swal";
import {
  ShieldCheck, ArrowLeft, Plus, Trash2,
  Megaphone, Film, Key, Settings,
  RotateCcw, Save,
  AlertTriangle, Bot, LayoutDashboard, Users, ToggleRight, LayoutGrid,
  MessageCircle, Star, Search, ChevronDown, Pencil, X, EyeOff, Eye,
  Pin, Archive, Download, Armchair, ImageIcon, Video, CheckCircle,
  TrendingUp, Zap, Clock, Calendar, MapPin, UploadCloud
} from "lucide-react";

import { VideoProvider, parseVideoUrl, getProviderIcon, getProviderName } from "@/lib/videoProviders";
import { saveToIndexedDB } from "@/lib/chunkedVideo";
import { compressToBase64, base64SizeKB } from "@/lib/imageUtils";
import { fileToChunks, getChunksSizeMB } from "@/lib/chunkedVideo";

// --- Types ---
export interface MenuItem {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr?: string;
  price: number;
  category: string;
  available: boolean;
  image: string;
  ingredients?: string;
  ingredientsAr?: string;
  recommended?: boolean;
}

export interface ChatSession {
  uid: string;
  userName: string;
  lastMessage: string;
  lastAt: number;
  unreadAdmin: number;
}

export interface ChatMsg {
  id: string;
  text: string;
  sender: "user" | "admin";
  createdAt: number;
}

export interface Feedback {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  orderId?: string;
  createdAt: number;
  read: boolean;
}

export interface Broadcast {
  id: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  type: "info" | "promo" | "alert";
  emoji: string;
  createdAt: number;
}

export interface Reel {
  id: string;
  image: string;
  caption: string;
  captionAr: string;
  likes: number;
  createdAt: number;
  authorName: string;
  pinned?: boolean;
  mediaType?: "image" | "video";
  videoUrl?: string;
  videoProvider?: VideoProvider;
  videoThumbnail?: string;
  videoChunks?: string[];
  chunkCount?: number;
}

const AIAdminAssistant = lazy(() => import("@/components/AIAdminAssistant"));

const ADMIN_PIN = "azura2026";

type Tab = "overview" | "menu" | "users" | "chat" | "reviews" | "broadcast" | "reels" | "api" | "system" | "ai" | "features" | "tables";

const BLANK_BROADCAST = { title: "", titleAr: "", message: "", messageAr: "", type: "info" as const, emoji: "📢" };

const MENU_CATEGORIES = [
  "recommended", "new_items", "soups", "appetizers", "salads", "pasta", "tortilla", "toast", "croissant", "breakfast", "main_dishes", "burgers", "smash_burgers", "fried_chicken", "hot_drinks", "coffee", "corto", "hot_chocolate", "sahlab", "frappuccino", "iced_coffee", "mojitos", "boba_tea", "fresh_juices", "cocktails", "smoothies", "milkshakes", "waffle", "desserts", "crepes", "pancakes", "add_ons", "shisha", "soft_drinks"
];

const CAT_META: Record<string, { emoji: string; en: string; ar: string }> = {
  recommended:      { emoji: "⭐",  en: "Top Picks",           ar: "الأفضل"          },
  new_items:        { emoji: "🆕",  en: "New",                 ar: "جديد"            },
  soups:            { emoji: "🍲",  en: "Soup",                ar: "شوربة"           },
  appetizers:       { emoji: "🍟",  en: "Appetizers",         ar: "مقبلات"          },
  salads:           { emoji: "🥗",  en: "Salads",              ar: "سلطات"           },
  pasta:            { emoji: "🍝",  en: "Pasta",               ar: "مكرونة"          },
  tortilla:         { emoji: "🌯",  en: "Tortilla",            ar: "تورتيلا"         },
  toast:            { emoji: "🍞",  en: "Toast",                ar: "توست"            },
  croissant:        { emoji: "🥐",  en: "Croissant",            ar: "كرواسون"         },
  breakfast:        { emoji: "🍳",  en: "Breakfast",            ar: "فطور"            },
  main_dishes:      { emoji: "🍽️",  en: "Main Dishes",         ar: "أطباق رئيسية"     },
  burgers:          { emoji: "🍔",  en: "Burgers",             ar: "برجر"            },
  smash_burgers:    { emoji: "🔥",  en: "Smash Burgers",       ar: "سماش برجر"       },
  fried_chicken:    { emoji: "🍗",  en: "Fried Chicken",      ar: "فراخ مقلية"      },
  hot_drinks:       { emoji: "☕",  en: "Hot Drinks",          ar: "مشروبات ساخنة"   },
  coffee:           { emoji: "☕",  en: "Coffee",              ar: "قهوة"            },
  corto:            { emoji: "🥛",  en: "Corto",               ar: "كورتو"           },
  hot_chocolate:    { emoji: "🍫",  en: "Hot Chocolate",       ar: "شوكولاتة ساخنة"  },
  sahlab:           { emoji: "🥛",  en: "Sahlab",               ar: "سحلب"            },
  frappuccino:      { emoji: "🧊",  en: "Frappuccino",        ar: "فرابتشينو"       },
  iced_coffee:      { emoji: "🧋",  en: "Iced Coffee",        ar: "قهوة مثلجة"      },
  mojitos:          { emoji: "🍹",  en: "Mojitos",             ar: "موجيتو"          },
  boba_tea:         { emoji: "🧋",  en: "Boba Tea",            ar: "بوبا تي"         },
  fresh_juices:     { emoji: "🍊",  en: "Fresh Juices",        ar: "عصائر طازجة"     },
  cocktails:        { emoji: "🍸",  en: "Cocktails",           ar: "كوكتيل"          },
  smoothies:        { emoji: "🥤",  en: "Smoothies",           ar: "سموذي"           },
  milkshakes:       { emoji: "🥛",  en: "Milkshakes",          ar: "ميلك شيك"        },
  waffle:           { emoji: "🧇",  en: "Waffle",               ar: "وافل"            },
  desserts:         { emoji: "🍰",  en: "Desserts",             ar: "حلويات"          },
  crepes:           { emoji: "🥞",  en: "Crepes",               ar: "كريب"            },
  pancakes:         { emoji: "🥞",  en: "Pancakes",             ar: "بان كيك"         },
  add_ons:          { emoji: "➕",  en: "Add-ons",              ar: "إضافات"          },
  shisha:           { emoji: "💨",  en: "Hookah",                ar: "شيشة"            },
  soft_drinks:      { emoji: "🥤",  en: "Soft Drinks",          ar: "مشروبات غازية"   },
};

// --- Inlined Components ---

function ImagePicker({ value, onChange, label, tr }: { value: string; onChange: (v: string) => void; label?: string; tr: (en: string, ar: string) => string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { swalError(tr("Please select a valid image file.","يرجى اختيار ملف صورة صالح.")); return; }
    setCompressing(true);
    try {
      const b64 = await compressToBase64(file, 600, 0.78);
      if (b64?.startsWith("data:image/")) onChange(b64);
      else throw new Error("Invalid base64");
    } catch (err) { swalError(tr("Could not compress image.","تعذر ضغط الصورة.")); }
    setCompressing(false);
  };
  const isBase64 = value?.startsWith("data:");
  const sizeKB = isBase64 ? base64SizeKB(value) : 0;
  return (
    <div className="space-y-2">
      {label && <label className="text-[10px] font-bold text-muted-foreground uppercase">{label}</label>}
      {value && (
        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border bg-muted/40 group">
          <img src={value} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.opacity = "0.25")} loading="lazy" />
          {isBase64 && <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">📷 {sizeKB} KB</span>}
          <button type="button" onClick={() => onChange("")} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"><X size={11} /></button>
        </div>
      )}
      <div className="flex gap-2 items-center">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={compressing} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 flex-shrink-0">
          {compressing ? <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <ImageIcon size={13} />}
          {compressing ? tr("Compressing…", "جاري الضغط…") : tr("Upload Photo", "رفع صورة")}
        </button>
        <input type="text" className="input-field px-3 py-2 text-[11px] flex-1" placeholder={tr("…or paste URL", "…أو الصق رابط")} value={isBase64 ? "" : value || ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <span key={i} style={{ fontSize: size, color: i <= n ? "#F59E0B" : "#D1D5DB" }}>★</span>
      ))}
    </span>
  );
}

function CssBar({ pct, color = "hsl(var(--primary))" }: { pct: number; color?: string }) {
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 0)}%`, background: color }} />
    </div>
  );
}

// --- Tab Components ---

const OverviewTab = ({ tr, users, unreadChats, feedback }: { tr: any, users: any[], unreadChats: number, feedback: any[] }) => {
  const stats = useMemo(() => {
    const active = users.filter(u => u.lastLoginAt && (Date.now() - u.lastLoginAt) < 30*60*1000).length;
    const rate = users.length ? Math.round((users.filter(u=>u.loginCount>1).length/users.length)*100) : 0;
    return { active, rate };
  }, [users]);
  return (
    <div className="space-y-4 page-enter">
      <div className="grid grid-cols-2 gap-3">
        {[
          { emoji: "🔥", label: tr("Active Now","نشط الآن"), value: stats.active, color: "text-orange-600" },
          { emoji: "🔄", label: tr("Retention","العودة"), value: `${stats.rate}%`, color: "text-blue-600" },
          { emoji: "💬", label: tr("Unread","جديدة"), value: unreadChats, color: "text-green-600" },
          { emoji: "⭐", label: tr("Reviews","تقييمات"), value: feedback.filter(f=>!f.read).length, color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="card-elevated rounded-2xl p-4 text-center">
            <p className="text-2xl mb-1">{s.emoji}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="card-elevated rounded-2xl p-5 border border-primary/5">
        <h3 className="font-bold text-sm flex items-center gap-2 mb-4"><TrendingUp size={16} className="text-primary"/> {tr("Insights","رؤى")}</h3>
        <div className="space-y-3">
           <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
             <div className="flex items-center gap-3"><Users size={14} className="text-primary"/><p className="text-xs font-bold">{tr("Total Clients", "إجمالي العملاء")}</p></div>
             <p className="text-sm font-black text-primary">{users.length}</p>
           </div>
           <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
             <div className="flex items-center gap-3"><Zap size={14} className="text-orange-600"/><p className="text-xs font-bold">{tr("High Value", "عملاء مميزون")}</p></div>
             <p className="text-sm font-black text-orange-600">{users.filter(u => u.loginCount >= 3).length}</p>
           </div>
        </div>
      </div>
      <h2 className="font-bold text-sm px-1">{tr("Live Activity","نشط مباشر")}</h2>
      <div className="space-y-2 pb-4">
        {users.slice(0, 10).map(u => (
          <div key={u.uid} className="card rounded-xl p-3 flex items-center gap-3 border border-border/40">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">{u.name?.[0]?.toUpperCase() || "?"}</div>
            <div className="flex-1 min-w-0"><p className="font-bold text-sm truncate">{u.name || "Guest"}</p><p className="text-[10px] font-bold text-muted-foreground uppercase">Table {u.tableNumber || "N/A"}</p></div>
            <div className="text-right"><p className="text-[10px] font-bold text-primary">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "—"}</p><p className="text-[9px] text-muted-foreground">{tr("Seen", "شوهد")}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MenuTab = ({ tr, menu, lang }: { tr: any, menu: MenuItem[], lang: string }) => {
  const [search, setSearch] = useState(""), [catFilter, setCatFilter] = useState("all"), [expanded, setExpanded] = useState<Set<string>>(new Set(["coffee", "hot_drinks", "recommended"])), [edits, setEdits] = useState<Record<string, Partial<MenuItem>>>({}), [selectedId, setSelectedId] = useState<string | null>(null), [saving, setSaving] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", nameAr: "", price: "", category: "coffee", image: "", description: "", descriptionAr: "", ingredients: "", ingredientsAr: "", available: true });
  const [savingItem, setSavingItem] = useState(false);

  const grouped = useMemo(() => {
    const filtered = menu.filter(i => (!search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.nameAr?.includes(search)) && (catFilter === "all" || i.category === catFilter));
    const groups: Record<string, MenuItem[]> = {};
    const recs = filtered.filter(i => i.recommended); if (recs.length) groups["recommended"] = recs;
    filtered.forEach(i => { if (catFilter === "all" && i.recommended) return; const c = i.category || "other"; if (!groups[c]) groups[c] = []; groups[c].push(i); });
    return groups;
  }, [menu, search, catFilter]);

  return (
    <div className="space-y-4 page-enter">
      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <div className="w-full flex gap-2">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder={tr("Search...", "بحث...")} value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted text-sm" /></div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2.5 rounded-xl bg-muted text-sm border-0">{MENU_CATEGORIES.map(c => <option key={c} value={c}>{CAT_META[c] ? tr(CAT_META[c].en, CAT_META[c].ar) : c}</option>)}</select>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={async () => { swalLoading(tr("Merging…","جاري الدمج…")); await mergeMenuIngredients(); swalClose(); }} className="flex-1 btn-secondary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"><RotateCcw size={13}/> {tr("Merge", "دمج")}</button>
          <button onClick={async () => { if (await swalConfirm(tr("Reseed?","رفع؟"), tr("This overwrites prices.","سيتم استبدال الأسعار."))) { swalLoading(tr("Reseeding…","جاري الرفع…")); await forceReseedMenu(); swalClose(); } }} className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-amber-50 text-amber-700 border border-amber-200"><UploadCloud size={13}/> {tr("Reseed", "رفع")}</button>
          <button onClick={() => setShowAddForm(!showAddForm)} className="flex-1 btn-primary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"><Plus size={13}/> {tr("Add", "إضافة")}</button>
        </div>
        {showAddForm && (
          <div className="rounded-2xl border border-primary/20 bg-primary/3 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2"><input className="input-field px-3 py-2 text-sm" placeholder="Name EN" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} /><input className="input-field px-3 py-2 text-sm" dir="rtl" placeholder="الاسم AR" value={addForm.nameAr} onChange={e => setAddForm({...addForm, nameAr: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-2"><input type="number" className="input-field px-3 py-2 text-sm" placeholder="Price" value={addForm.price} onChange={e => setAddForm({...addForm, price: e.target.value})} /><select className="input-field px-3 py-2 text-sm" value={addForm.category} onChange={e => setAddForm({...addForm, category: e.target.value})}>{MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <ImagePicker label={tr("Photo", "الصورة")} value={addForm.image} onChange={v => setAddForm({...addForm, image: v})} tr={tr} />
            <button disabled={savingItem || !addForm.name || !addForm.price} onClick={async () => { setSavingItem(true); const id = `${addForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36)}`; await smartSet(`menu/${addForm.category}/${id}`, { ...addForm, price: Number(addForm.price) }); setAddForm({ name:"", nameAr:"", price:"", category:"coffee", image:"", description:"", descriptionAr:"", ingredients:"", ingredientsAr:"", available:true }); setShowAddForm(false); setSavingItem(false); }} className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2">{savingItem ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <Save size={14}/>} {tr("Save Item","حفظ الصنف")}</button>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {Object.entries(grouped).map(([cId, items]) => {
          const exp = expanded.has(cId), meta = CAT_META[cId] || { emoji: "📦", en: cId, ar: cId };
          return (
            <div key={cId} className="space-y-2">
              <button onClick={() => { const n = new Set(expanded); if (n.has(cId)) n.delete(cId); else n.add(cId); setExpanded(n); }} className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-muted/50 rounded-xl transition-colors">
                <div className="flex items-center gap-2"><span className="text-xl">{meta.emoji}</span><span className="font-black text-sm uppercase tracking-tight">{tr(meta.en, meta.ar)}</span><span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">{items.length}</span></div>
                <ChevronDown size={18} className={`text-muted-foreground transition-transform ${exp ? "rotate-180" : ""}`} />
              </button>
              {exp && (
                <div className="grid grid-cols-2 gap-3">
                  {items.map(item => {
                    const sel = selectedId === item.id, itemEdits = edits[item.id] || {}, dirty = Object.keys(itemEdits).length > 0;
                    return (
                      <div key={item.id} className="contents">
                        <div onClick={() => setSelectedId(sel ? null : item.id)} className={`relative group cursor-pointer card rounded-2xl overflow-hidden border transition-all ${sel ? "ring-2 ring-primary bg-primary/5 scale-[1.02]" : "border-border/40 hover:border-primary/30"}`}>
                          <div className="h-24 relative overflow-hidden bg-muted/20">
                            {item.image ? <img src={item.image} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">{meta.emoji}</div>}
                            {!item.available && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="bg-white/90 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase">{tr("Sold Out", "نفذ")}</span></div>}
                            {item.recommended && <div className="absolute top-1 right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] shadow-sm">⭐</div>}
                          </div>
                          <div className="p-2.5">
                            <p className="font-bold text-xs truncate">{lang === "ar" ? (item.nameAr || item.name) : item.name}</p>
                            <div className="flex items-center justify-between mt-1"><p className="text-[10px] font-black text-primary">{item.price} <span className="text-[8px] opacity-60">EGP</span></p><Pencil size={10} className={`transition-opacity ${sel ? "text-primary opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`} /></div>
                          </div>
                          {dirty && <div className="absolute top-1 left-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-sm" />}
                        </div>
                        {sel && (
                          <div className="col-span-2 card-elevated rounded-3xl p-5 border-2 border-primary/20 bg-card shadow-2xl mt-1 mb-3">
                            <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Pencil size={20} /></div><div><p className="text-[10px] font-black text-primary uppercase tracking-widest">{tr("Edit Item", "تعديل الصنف")}</p><h4 className="font-bold text-foreground">{item.name}</h4></div></div><button onClick={() => setSelectedId(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><X size={16} /></button></div>
                            <div className="space-y-4">
                              {(() => {
                                const val = (f: keyof MenuItem) => f in itemEdits ? itemEdits[f] : item[f];
                                const patch = (f: keyof MenuItem, v: any) => setEdits(prev => ({ ...prev, [item.id]: { ...prev[item.id], [f]: v } }));
                                return (
                                  <>
                                    <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-[10px] font-black uppercase">Name EN</label><input className="input-field px-3 py-2 text-sm" value={val("name") as string} onChange={e => patch("name", e.target.value)} /></div><div className="space-y-1"><label className="text-[10px] font-black uppercase">الاسم AR</label><input className="input-field px-3 py-2 text-sm" dir="rtl" value={val("nameAr") as string} onChange={e => patch("nameAr", e.target.value)} /></div></div>
                                    <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><label className="text-[10px] font-black uppercase">Price</label><input type="number" className="input-field px-3 py-2 text-sm" value={val("price") as number} onChange={e => patch("price", Number(e.target.value))} /></div><div className="space-y-1"><label className="text-[10px] font-black uppercase">Category</label><select className="input-field px-3 py-2 text-sm" value={val("category") as string} onChange={e => patch("category", e.target.value)}>{MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>
                                    <ImagePicker label={tr("Photo", "الصورة")} value={val("image") as string} onChange={v => patch("image", v)} tr={tr} />
                                    <div className="flex flex-wrap items-center gap-4 pt-2">
                                      <label className="flex items-center gap-2 cursor-pointer" onClick={() => patch("available", !val("available"))}><div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${val("available") ? "bg-green-500" : "bg-muted"}`}><div className={`w-4 h-4 rounded-full bg-white transition-transform ${val("available") ? "translate-x-5" : ""}`} /></div><span className="text-xs font-bold">{val("available") ? tr("In Stock", "متاح") : tr("Sold Out", "نفذ")}</span></label>
                                      <button onClick={() => patch("recommended", !val("recommended"))} className={`px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 ${val("recommended") ? "bg-amber-400 text-white" : "bg-muted text-muted-foreground"}`}>{val("recommended") ? "⭐" : "☆"} {tr("Top Picks", "الأفضل")}</button>
                                      <div className="flex gap-2 ms-auto">
                                        <button onClick={async () => { if (await swalConfirm(tr("Delete?", "حذف؟"), tr("Permanent action.", "إجراء نهائي."))) { await smartRemove(`menu/${item.category}/${item.id}`); setSelectedId(null); } }} className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white"><Trash2 size={18} /></button>
                                        <button disabled={saving === item.id || !dirty} onClick={async () => { setSaving(item.id); try { await smartUpdate(`menu/${item.category}/${item.id}`, itemEdits); setEdits(p => { const n = {...p}; delete n[item.id]; return n; }); setSelectedId(null); swalSuccess(tr("Saved", "تم الحفظ")); } finally { setSaving(null); } }} className="btn-primary px-6 h-10 rounded-xl text-xs font-bold flex items-center gap-2">{saving === item.id ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <Save size={16}/>} {tr("Save", "حفظ")}</button>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FeaturesTab = ({ tr, featureFlags, savingFlag, apiSettings, setApiSettings, toggleFeatureFlag }: { tr: any, featureFlags: any, savingFlag: string | null, apiSettings: any, setApiSettings: any, toggleFeatureFlag: any }) => (
  <div className="space-y-4 page-enter">
    <div className="card-elevated rounded-2xl p-5 space-y-5">
      <h3 className="font-bold flex items-center gap-2"><ToggleRight size={20} className="text-primary"/> {tr("Features", "الميزات")}</h3>
      {[
        { id: "baristaEnabled", icon: <Bot className="text-purple-600"/>, bg: "bg-purple-100", label: tr("AI Barista", "الباريستا"), desc: tr("Chat with Zura", "دردش مع زورا") },
        { id: "reelsEnabled", icon: <Film className="text-pink-600"/>, bg: "bg-pink-100", label: tr("Reels", "ريلز"), desc: tr("Videos & Photos", "فيديو وصور") },
        { id: "supportEnabled", icon: <MessageCircle className="text-blue-600"/>, bg: "bg-blue-100", label: tr("Support", "الدعم"), desc: tr("Live Support", "دعم مباشر") },
      ].map(f => (
        <div key={f.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
          <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center`}>{f.icon}</div><div><p className="font-semibold text-sm">{f.label}</p><p className="text-[11px] text-muted-foreground">{f.desc}</p></div></div>
          <button disabled={savingFlag === f.id} onClick={() => toggleFeatureFlag(f.id, !(featureFlags as any)[f.id])} className={`relative w-14 h-7 rounded-full transition-colors ${(featureFlags as any)[f.id] ? "bg-green-500" : "bg-muted"}`}><div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${(featureFlags as any)[f.id] ? "translate-x-8" : "translate-x-1"}`}/></button>
        </div>
      ))}
      <div className="flex items-center justify-between py-3 border-t">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Bot className="text-amber-600"/></div><div><p className="font-semibold text-sm">{tr("AI Service", "خدمة الذكاء")}</p><p className="text-[11px] text-muted-foreground">{tr("Global AI switch", "مفتاح الذكاء العام")}</p></div></div>
        <button onClick={() => setApiSettings({...apiSettings, aiEnabled: !apiSettings.aiEnabled})} className={`relative w-14 h-7 rounded-full transition-colors ${apiSettings.aiEnabled ? "bg-green-500" : "bg-muted"}`}><div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${apiSettings.aiEnabled ? "translate-x-8" : "translate-x-1"}`}/></button>
      </div>
    </div>
  </div>
);

const UsersTab = ({ tr, users, deleteUser }: { tr: any, users: any[], deleteUser: any }) => (
  <div className="space-y-4 page-enter">
    <div className="card-elevated rounded-2xl p-5 space-y-4">
      <h3 className="font-bold flex items-center gap-3"><Users size={20} className="text-primary"/> {tr("CRM", "العملاء")}</h3>
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.uid} className="card rounded-2xl p-4 border border-border/40">
            <div className="flex items-start gap-4">
              <div className="relative"><div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black">{u.name?.[0]?.toUpperCase() || "?"}</div><div className="absolute -bottom-1 -right-1 bg-amber-400 text-white text-[8px] font-black px-1 py-0.5 rounded-lg border-2 border-white">T{u.tableNumber || "0"}</div></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between"><p className="font-bold text-sm truncate">{u.name || "Guest"}</p><button onClick={() => deleteUser(u.uid, u.name)} className="text-destructive/30 hover:text-destructive"><Trash2 size={14}/></button></div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-dashed">
                  <div><p className="text-[8px] font-black text-muted-foreground uppercase">{tr("Joined", "انضم")}</p><p className="text-[10px] font-bold">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</p></div>
                  <div><p className="text-[8px] font-black text-muted-foreground uppercase">{tr("Visits", "زيارات")}</p><p className="text-[10px] font-bold">{u.loginCount || 0}</p></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ChatTab = ({ tr, selectedChat, setSelectedChat, chats, chatMsgs, chatInput, setChatInput, sendReply, deleteChat, chatBottomRef, isRTL }: { tr: any, selectedChat: string | null, setSelectedChat: any, chats: any[], chatMsgs: any[], chatInput: string, setChatInput: any, sendReply: any, deleteChat: any, chatBottomRef: any, isRTL: boolean }) => (
  <div className="page-enter">
    {selectedChat ? (
      <div className="flex flex-col h-[calc(100dvh-12rem)]">
        <button onClick={() => setSelectedChat(null)} className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-3"><ArrowLeft size={14}/> {tr("All Chats","كل الدردشات")}</button>
        <div className="card rounded-2xl overflow-hidden flex flex-col flex-1">
          <div className="px-4 py-2.5 bg-muted border-b"><p className="font-bold text-sm text-primary">{chats.find(c => c.uid === selectedChat)?.userName || "Guest"}</p></div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scroll-hide">
            {chatMsgs.map(m => (
              <div key={m.id} className={`flex ${m.sender==="user"?(isRTL?"justify-end":"justify-start"):(isRTL?"justify-start":"justify-end")}`}>
                <div className={`max-w-[80%] px-3 py-2 text-sm rounded-xl ${m.sender==="user"?"bg-muted text-foreground":"bg-primary text-primary-foreground"}`}>{m.text}</div>
              </div>
            ))}
            <div ref={chatBottomRef}/>
          </div>
          <div className="flex items-center gap-2 p-3 border-t">
            <input className="flex-1 input-field px-3 py-2 text-sm" placeholder="Reply…" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==="Enter" && sendReply()} />
            <button onClick={sendReply} disabled={!chatInput.trim()} className="btn-icon w-9 h-9 bg-primary text-white disabled:opacity-40"><ArrowLeft className={isRTL ? "" : "rotate-180"} size={14}/></button>
          </div>
        </div>
      </div>
    ) : (
      <div className="space-y-2">
        {chats.map(c => (
          <div key={c.uid} className="card rounded-xl p-3 flex items-center gap-3 hover:shadow-md cursor-pointer" onClick={() => setSelectedChat(c.uid)}>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{c.userName?.[0]?.toUpperCase() || "?"}</div>
            <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{c.userName}</p><p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p></div>
            {c.unreadAdmin > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{c.unreadAdmin}</span>}
            <button onClick={(e) => { e.stopPropagation(); deleteChat(c.uid, c.userName); }} className="p-2 text-destructive/30 hover:text-destructive"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ReviewsTab = ({ tr, feedback, avgRating, ratingDist, maxRatingCount }: { tr: any, feedback: Feedback[], avgRating: string, ratingDist: any[], maxRatingCount: number }) => (
  <div className="space-y-4 page-enter">
    <div className="card-elevated rounded-2xl p-4 flex items-center gap-4">
      <div className="text-center"><p className="text-4xl font-extrabold text-primary">{avgRating}</p><Stars n={parseFloat(avgRating) || 0}/><p className="text-[10px] text-muted-foreground">{feedback.length} {tr("reviews","تقييم")}</p></div>
      <div className="flex-1 space-y-1.5">{ratingDist.map(d => (
        <div key={d.r} className="flex items-center gap-2 text-xs"><span>{d.r}</span><span className="text-yellow-400">★</span><div className="flex-1"><CssBar pct={(d.count/maxRatingCount)*100} color="#F59E0B"/></div><span className="w-5">{d.count}</span></div>
      ))}</div>
    </div>
    {feedback.map(f => (
      <div key={f.id} className={`card rounded-xl p-4 ${!f.read ? "ring-1 ring-primary/30" : ""}`}>
        <div className="flex justify-between mb-1"><div><p className="font-semibold text-sm">{f.userName}</p><Stars n={f.rating} size={12}/></div>{!f.read && <button onClick={() => smartUpdate(`feedback/${f.id}`, {read:true})} className="text-[10px] text-primary font-bold">Mark Read</button>}</div>
        {f.comment && <p className="text-sm text-muted-foreground italic">"{f.comment}"</p>}
      </div>
    ))}
  </div>
);

const BroadcastTab = ({ tr, newBroadcast, setNewBroadcast, sendBroadcast, sendingBroadcast, bannerContent, setBannerContent, setBannerEnabled, bannerEnabled, setSavingBanner, bannerBgColor, bannerTextColor, savingBanner }: { tr: any, newBroadcast: any, setNewBroadcast: any, sendBroadcast: any, sendingBroadcast: boolean, bannerContent: string, setBannerContent: any, setBannerEnabled: any, bannerEnabled: boolean, setSavingBanner: any, bannerBgColor: string, bannerTextColor: string, savingBanner: boolean }) => (
  <div className="space-y-4 page-enter">
    <div className="card-elevated rounded-2xl p-4 space-y-3">
      <h3 className="font-bold flex items-center gap-2"><Megaphone size={16} className="text-primary"/> {tr("Announcement","إعلان")}</h3>
      <div className="grid grid-cols-6 gap-1">{(["📢","🎉","⚠️","🔥","💝","☕"] as const).map(e => <button key={e} onClick={() => setNewBroadcast({...newBroadcast, emoji: e})} className={`py-2 rounded-lg text-lg ${newBroadcast.emoji === e ? "bg-primary/20 ring-1 ring-primary" : "bg-muted"}`}>{e}</button>)}</div>
      <div className="grid grid-cols-2 gap-2"><input className="input-field px-3 py-2 text-sm" placeholder="Title EN" value={newBroadcast.title} onChange={e => setNewBroadcast({...newBroadcast, title: e.target.value})} /><input className="input-field px-3 py-2 text-sm" dir="rtl" placeholder="العنوان" value={newBroadcast.titleAr} onChange={e => setNewBroadcast({...newBroadcast, titleAr: e.target.value})} /></div>
      <textarea rows={2} className="input-field px-3 py-2 text-sm resize-none" placeholder="Message" value={newBroadcast.message} onChange={e => setNewBroadcast({...newBroadcast, message: e.target.value})} />
      <button onClick={sendBroadcast} disabled={sendingBroadcast || !newBroadcast.title} className="btn-primary w-full py-2.5 rounded-xl font-bold">{sendingBroadcast ? "..." : tr("Send All", "أرسل للكل")}</button>
    </div>
    <div className="card-elevated rounded-2xl p-4 space-y-3">
      <h3 className="font-bold flex items-center gap-2"><Pin size={16} className="text-primary"/> {tr("Banner","بانر")}</h3>
      <textarea rows={2} className="input-field px-3 py-2 text-xs font-mono" value={bannerContent} onChange={e => setBannerContent(e.target.value)} />
      <div className="flex items-center justify-between"><button onClick={() => setBannerEnabled(!bannerEnabled)} className={`w-12 h-6 rounded-full relative transition-colors ${bannerEnabled ? "bg-green-500" : "bg-muted"}`}><div className={`w-5 h-5 rounded-full bg-white shadow transition-all ${bannerEnabled ? "translate-x-6" : "translate-x-1"}`}/></button><button onClick={async () => { setSavingBanner(true); await smartSet("homepage-banner", { content: bannerContent, bgColor: bannerBgColor, textColor: bannerTextColor, enabled: bannerEnabled }); setSavingBanner(false); }} className="btn-primary px-4 py-2 rounded-xl text-xs font-bold">{savingBanner ? "..." : tr("Save", "حفظ")}</button></div>
    </div>
  </div>
);

const ReelsTab = ({ tr, reels, uploading, setNewReel, newReel }: { tr: any, reels: Reel[], uploading: boolean, setNewReel: any, newReel: any }) => (
  <div className="space-y-4 page-enter">
    <div className="card-elevated rounded-2xl p-5 space-y-4">
      <h3 className="font-bold flex items-center gap-2"><Film size={18} className="text-primary"/> {tr("New Post","منشور جديد")}</h3>
      <div className="flex gap-2"><button onClick={() => setNewReel({...newReel, mediaType:'image'})} className={`flex-1 py-2 rounded-xl text-xs ${newReel.mediaType==='image'?'btn-primary':'bg-muted'}`}>Image</button><button onClick={() => setNewReel({...newReel, mediaType:'video'})} className={`flex-1 py-2 rounded-xl text-xs ${newReel.mediaType==='video'?'btn-primary':'bg-muted'}`}>Video</button></div>
      {newReel.mediaType === 'image' ? <ImagePicker label="Photo" value={newReel.image} onChange={v => setNewReel({...newReel, image: v})} tr={tr} /> : (
        <div className="space-y-2">
          <input className="input-field px-3 py-2 text-sm" placeholder="Video URL" value={newReel.videoUrl} onChange={e => { const u = e.target.value; if (u) { const p = parseVideoUrl(u); setNewReel({...newReel, videoUrl: u, videoProvider: p.provider, image: p.thumbnail || ""}); } }} />
          {newReel.image && <img src={newReel.image} className="h-20 w-full object-cover rounded-lg" />}
        </div>
      )}
      <textarea className="input-field px-3 py-2 text-sm h-16 resize-none" placeholder="Caption" value={newReel.caption} onChange={e => setNewReel({...newReel, caption: e.target.value})} />
      <button disabled={uploading || !newReel.image} onClick={async () => {
        try {
          const r = push(ref(db, "reels")), rId = r.key!;
          await smartSet(`reels/${rId}`, { ...newReel, likes: 0, createdAt: Date.now(), authorName: "Admin" });
          setNewReel({ image: "", caption: "", captionAr: "", mediaType: "image", videoUrl: "", videoProvider: undefined, videoThumbnail: "" });
          swalSuccess(tr("Created!","تم الإنشاء!"));
        } catch (e) { console.error(e); }
      }} className="btn-primary w-full py-2.5 rounded-xl font-bold">{uploading ? "..." : tr("Create", "إنشاء")}</button>
    </div>
    <div className="space-y-3">{reels.map(r => (
      <div key={r.id} className="card rounded-xl overflow-hidden flex">
        <div className="w-16 h-16 bg-muted">{r.image && <img src={r.image} className="w-full h-full object-cover" />}</div>
        <div className="flex-1 p-3 min-w-0"><p className="text-xs font-bold truncate">{r.caption || "No Caption"}</p><p className="text-[10px] text-muted-foreground">❤️ {r.likes||0}</p></div>
        <div className="flex flex-col gap-1 p-1"><button onClick={async () => await smartUpdate(`reels/${r.id}`, {pinned: !r.pinned})} className="p-1.5"><Pin size={12} className={r.pinned ? "fill-primary" : ""}/></button><button onClick={async () => { if (await swalConfirm(tr("Delete?","حذف؟"), tr("Sure?","متأكد؟"))) await smartRemove(`reels/${r.id}`); }} className="p-1.5 text-destructive"><Trash2 size={12}/></button></div>
      </div>
    ))}</div>
  </div>
);

const ApiTab = ({ tr, apiSettings, setApiSettings, showApiKey, setShowApiKey, saveApiSettings, savingApiKey }: { tr: any, apiSettings: any, setApiSettings: any, showApiKey: boolean, setShowApiKey: any, saveApiSettings: any, savingApiKey: boolean }) => (
  <div className="space-y-4 page-enter">
    <div className="card-elevated rounded-2xl p-5 space-y-4">
      <h3 className="font-bold flex items-center gap-2"><Key size={18} className="text-primary"/> {tr("AI Settings", "إعدادات الذكاء")}</h3>
      <select className="input-field px-3 py-2 text-sm" value={apiSettings.aiProvider} onChange={e => setApiSettings({...apiSettings, aiProvider: e.target.value as any})}>
        <option value="groq">Groq</option><option value="pollinations">Pollinations</option><option value="openai">OpenAI</option>
      </select>
      <div className="relative"><input type={showApiKey ? "text" : "password"} className="input-field px-3 py-2 pr-10 text-sm w-full" placeholder="API Key" value={apiSettings.groqKey} onChange={e => setApiSettings({...apiSettings, groqKey: e.target.value})} /><button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showApiKey ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
      <button onClick={saveApiSettings} disabled={savingApiKey} className="btn-primary w-full py-2.5 rounded-xl font-bold">{savingApiKey ? "..." : tr("Save", "حفظ")}</button>
    </div>
  </div>
);

const SystemTab = ({ tr }: { tr: any }) => (
  <div className="space-y-4 page-enter">
    <div className="card-elevated rounded-2xl p-5 space-y-4">
      <h3 className="font-bold flex items-center gap-2"><Archive size={18} className="text-primary"/> {tr("System", "النظام")}</h3>
      <button onClick={async () => {
        swalLoading(tr("Backing up…","جاري النسخ…")); try {
          const snapshot: any = {}; for (const p of ["menu","users","api-settings","broadcast","reels","feedback"]) snapshot[p] = await smartGet(p);
          const data = { data: snapshot, createdAt: Date.now(), name: `Backup ${new Date().toLocaleString()}`, size: `${Math.round(JSON.stringify(snapshot).length/1024)} KB` };
          await smartPush("backups", data);
          const b = new Blob([JSON.stringify(data)], {type:"application/json"}), u = URL.createObjectURL(b), a = document.createElement("a");
          a.href = u; a.download = `backup.json`; a.click(); swalSuccess(tr("Backup saved!","تم الحفظ!"));
        } finally { swalClose(); }
      }} className="btn-primary w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"><Download size={16}/> {tr("Backup", "نسخة احتياطية")}</button>
    </div>
    <div className="card rounded-2xl p-5 border-2 border-destructive/20 space-y-4">
      <h3 className="font-bold text-destructive flex items-center gap-2"><RotateCcw size={18}/> {tr("Reset", "تصفير")}</h3>
      <button onClick={async () => { if (await swalConfirm(tr("Reset All?", "تصفير الكل؟"), tr("Data loss!", "فقدان بيانات!"))) { swalLoading(tr("Resetting…","جاري التصفير…")); for (const p of ["menu","users","broadcast","reels","feedback"]) await smartRemove(p); swalClose(); swalSuccess(tr("Reset Done","تم")); } }} className="w-full py-2.5 rounded-xl bg-destructive text-white font-bold">{tr("Reset System", "تصفير النظام")}</button>
    </div>
  </div>
);

const TablesTab = ({ tr, activeTables }: { tr: any, activeTables: any[] }) => (
  <div className="space-y-4 page-enter">
    <div className="card-elevated rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><LayoutGrid size={18} className="text-primary"/> {tr("Tables", "الطاولات")}</h3><button onClick={async () => { const n = prompt(tr("Table #:", "رقم الطاولة:")); if (n && /^\d+$/.test(n)) await smartSet(`tables/table_${n}`, { number: parseInt(n), status: "available" }); }} className="btn-primary px-4 py-2 rounded-xl text-xs font-bold">+ {tr("Add", "إضافة")}</button></div>
      <div className="grid grid-cols-3 gap-2">
        {activeTables.map(t => (
          <div key={t.id} className="relative card rounded-xl p-3 text-center bg-muted">
            <Armchair size={20} className={`mx-auto mb-1 ${t.status === "occupied" ? "text-green-600" : "text-muted-foreground"}`} />
            <p className="font-bold text-xs">{t.number}</p>
            <button onClick={async () => { if (await swalConfirm(tr("Delete?", "حذف؟"), tr("Sure?","متأكد؟"))) await smartRemove(`tables/${t.id}`); }} className="absolute -top-1 -right-1 text-destructive"><X size={12}/></button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- Main Admin Component ---

export default function Admin() {
  const { lang, isRTL } = useLang();
  const [, navigate] = useLocation();
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("azura-admin") === "true");
  const [pinErr, setPinErr] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [dbMode, setDbModeState] = useState(getDBMode());

  useEffect(() => {
    const unsub = onModeChange(() => setDbModeState(getDBMode()));
    return () => { unsub(); };
  }, []);

  // Data
  const [menu, setMenu]           = useState<MenuItem[]>([]);
  const [users, setUsers]         = useState<any[]>([]);
  const [chats, setChats]         = useState<ChatSession[]>([]);
  const [feedback, setFeedback]   = useState<Feedback[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [reels, setReels]         = useState<Reel[]>([]);
  const [tablesRaw, setTablesRaw] = useState<any[]>([]);

  // Support Chat
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMsgs, setChatMsgs]         = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput]       = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Forms & Flags
  const [newBroadcast, setNewBroadcast] = useState<{ title: string; titleAr: string; message: string; messageAr: string; type: "info" | "promo" | "alert"; emoji: string; }>(BLANK_BROADCAST);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [newReel, setNewReel] = useState<{ image: string; caption: string; captionAr: string; mediaType: "image" | "video"; videoUrl: string; videoProvider: VideoProvider | undefined; videoThumbnail: string; videoChunks?: string[]; chunkCount?: number; }>({ image: "", caption: "", captionAr: "", mediaType: "image", videoUrl: "", videoProvider: undefined, videoThumbnail: "" });
  const [uploading, setUploading] = useState(false);
  const [apiSettings, setApiSettings] = useState({ groqKey: "", aiProvider: "groq" as "groq" | "pollinations" | "openai", openaiEndpoint: "", aiEnabled: true });
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [bannerContent, setBannerContent] = useState("");
  const [bannerBgColor, setBannerBgColor] = useState("#FF6B35");
  const [bannerTextColor, setBannerTextColor] = useState("#FFFFFF");
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [featureFlags, setFeatureFlags] = useState({ baristaEnabled: true, reelsEnabled: true, supportEnabled: true });
  const [savingFlag, setSavingFlag] = useState<string | null>(null);

  // Derived Stats
  const activeTables = useMemo(() => {
    const tables = tablesRaw.map(t => {
      const userCount = users.filter(u => u.tableNumber === t.number).length;
      return { id: t.id, number: t.number, status: userCount > 0 ? "occupied" : "available", userCount, lastAt: t.lastAssigned || null };
    });
    return tables.sort((a, b) => a.number - b.number);
  }, [tablesRaw, users]);
  const avgRating = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : "—";
  const ratingDist = [5,4,3,2,1].map((r) => ({ r, count: feedback.filter((f) => f.rating === r).length }));
  const maxRatingCount = Math.max(...ratingDist.map((d) => d.count), 1);
  const unreadChats = chats.reduce((s, c) => s + (c.unreadAdmin || 0), 0);

  // Effects
  useEffect(() => {
    if (!authed) return;
    const unsubMenu = onValue(ref(db, "menu"), (snap) => {
      const res: MenuItem[] = [];
      if (snap.exists()) {
        Object.entries(snap.val()).forEach(([cat, val]: [string, any]) => {
          if (typeof val === "object" && val !== null) Object.entries(val).forEach(([id, item]: [string, any]) => { if (typeof item === "object") res.push({ id, ...item } as MenuItem); });
        });
      }
      setMenu(res);
    });
    const unsubUsers = onValue(ref(db, "users"), (snap) => {
      setUsers(snap.exists() ? Object.entries(snap.val()).map(([uid, v]: [string, any]) => ({ uid, ...v })).sort((a,b) => (b.lastLoginAt || 0) - (a.lastLoginAt || 0)) : []);
    });
    const unsubFeedback = onValue(ref(db, "feedback"), (snap) => {
      setFeedback(snap.exists() ? Object.entries(snap.val()).map(([id, v]: [string, any]) => ({ id, ...v })).sort((a,b) => b.createdAt - a.createdAt) : []);
    });
    const unsubBroadcast = onValue(ref(db, "broadcast"), (snap) => {
      setBroadcasts(snap.exists() ? Object.entries(snap.val()).map(([id, v]: [string, any]) => ({ id, ...v })).sort((a,b) => b.createdAt - a.createdAt) : []);
    });
    const unsubReels = onValue(ref(db, "reels"), (snap) => {
      setReels(snap.exists() ? Object.entries(snap.val()).map(([id, v]: [string, any]) => ({ id, ...v })).sort((a,b) => (a.pinned ? -1 : b.pinned ? 1 : b.createdAt - a.createdAt)) : []);
    });
    const unsubTables = onValue(ref(db, "tables"), (snap) => {
      setTablesRaw(snap.exists() ? Object.entries(snap.val()).map(([id, v]: [string, any]) => ({ id, ...v })) : []);
    });
    const unsubSupport = onValue(ref(db, "support-chat"), (snap) => {
      if (!snap.exists()) { setChats([]); return; }
      const sessions = Object.entries(snap.val() as Record<string, any>).filter(([, v]) => v?.meta).map(([uid, v]) => ({ ...v.meta!, uid })).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
      setChats(sessions);
    });
    const unsubApi = onValue(ref(db, "api-settings"), (snap) => { if (snap.exists()) setApiSettings(prev => ({ ...prev, ...snap.val() })); });
    const unsubBanner = onValue(ref(db, "homepage-banner"), (snap) => {
      if (snap.exists()) { const d = snap.val(); setBannerContent(d.content || ""); setBannerBgColor(d.bgColor || "#FF6B35"); setBannerTextColor(d.textColor || "#FFFFFF"); setBannerEnabled(d.enabled !== false); }
    });
    const unsubFF = onValue(ref(db, "feature-flags"), (snap) => { if (snap.exists()) setFeatureFlags(prev => ({ ...prev, ...snap.val() })); });
    return () => { [unsubMenu, unsubUsers, unsubFeedback, unsubBroadcast, unsubReels, unsubTables, unsubSupport, unsubApi, unsubBanner, unsubFF].forEach(fn => fn()); };
  }, [authed]);

  useEffect(() => {
    if (!selectedChat) return;
    const msgsRef = ref(db, `support-chat/${selectedChat}/messages`);
    const unsub = onValue(msgsRef, (snap) => {
      setChatMsgs(snap.exists() ? Object.entries(snap.val() as Record<string, any>).map(([id, m]) => ({ id, ...m })).sort((a, b) => a.createdAt - b.createdAt) : []);
    });
    update(ref(db, `support-chat/${selectedChat}/meta`), { unreadAdmin: 0 });
    return () => unsub();
  }, [selectedChat]);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  // Handlers
  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;
  const login = () => { if (pin === ADMIN_PIN) { sessionStorage.setItem("azura-admin", "true"); setAuthed(true); } else setPinErr(tr("Wrong PIN", "PIN خاطئ")); };
  const deleteUser = async (uid: string, name: string) => { if (await swalConfirm(tr(`Delete ${name}?`, `حذف ${name}؟`), tr("This will remove all user data.","سيتم حذف كافة بيانات المستخدم."))) { await smartRemove(`users/${uid}`); swalSuccess(tr("Deleted", "تم الحذف")); } };
  const deleteChat = async (uid: string, name: string) => { if (await swalConfirm(tr(`Delete chat with ${name}?`, `حذف محادثة ${name}؟`), tr("Messages will be permanently deleted.","سيتم حذف الرسائل نهائياً."))) { if (selectedChat === uid) setSelectedChat(null); await smartRemove(`support-chat/${uid}`); } };
  const sendReply = async () => { if (!chatInput.trim() || !selectedChat) return; await smartPush(`support-chat/${selectedChat}/messages`, { text: chatInput.trim(), sender: "admin", createdAt: Date.now(), readByAdmin: true }); await smartUpdate(`support-chat/${selectedChat}/meta`, { lastMessage: chatInput.trim(), lastAt: Date.now() }); setChatInput(""); };
  const sendBroadcast = async () => { setSendingBroadcast(true); await smartPush("broadcast", { ...newBroadcast, createdAt: Date.now() }); setNewBroadcast(BLANK_BROADCAST); setSendingBroadcast(false); };
  const saveApiSettings = async () => { setSavingApiKey(true); await smartSet("api-settings", { ...apiSettings, groqKey: apiSettings.groqKey.startsWith("gsk") ? encryptKey(apiSettings.groqKey) : apiSettings.groqKey, updatedAt: Date.now() }); setSavingApiKey(false); };
  const toggleFeatureFlag = async (key: string, val: boolean) => { setSavingFlag(key); await smartUpdate("feature-flags", { [key]: val }); setSavingFlag(null); };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-orange-50 to-amber-100">
        <div className="card-elevated rounded-3xl p-8 max-w-xs w-full text-center page-enter">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20"><ShieldCheck size={26} className="text-white" /></div>
          <h1 className="text-xl font-bold text-primary mb-1">{tr("Azura Admin", "إدارة أزورا")}</h1>
          <p className="text-xs text-muted-foreground mb-5">{tr("Enter PIN", "أدخل الرمز")}</p>
          <form onSubmit={e => { e.preventDefault(); login(); }} autoComplete="off">
            <input type="password" autoFocus placeholder="PIN" value={pin} onChange={e => { setPin(e.target.value); setPinErr(""); }} className="input-field px-3 py-2.5 text-center text-xl font-bold tracking-[0.3em] mb-3 w-full" />
            {pinErr && <p className="text-destructive text-xs mb-3 font-semibold">{pinErr}</p>}
            <button type="submit" className="btn-primary w-full py-3 rounded-xl font-bold">{tr("Login", "دخول")}</button>
          </form>
          <button onClick={() => navigate("/menu")} className="btn-ghost w-full py-2.5 text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1"><ArrowLeft size={12}/> {tr("Back", "رجوع")}</button>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; icon: React.ReactNode; en: string; ar: string; badge?: number }[] = [
    { id: "overview",   icon: <LayoutDashboard size={14}/>, en: "Overview",    ar: "الرئيسية"   },
    { id: "menu",       icon: <Plus size={14}/>,            en: "Menu",        ar: "القائمة"    },
    { id: "features",   icon: <ToggleRight size={14}/>,     en: "Features",    ar: "الميزات"    },
    { id: "users",      icon: <Users size={14}/>,           en: "Users",       ar: "المستخدمين" },
    { id: "chat",       icon: <MessageCircle size={14}/>,   en: "Chat",        ar: "الدردشة",   badge: unreadChats || 0 },
    { id: "reviews",    icon: <Star size={14}/>,            en: "Reviews",     ar: "تقييمات",   badge: feedback.filter(f => !f.read).length || 0 },
    { id: "broadcast",  icon: <Megaphone size={14}/>,       en: "Broadcast",   ar: "إشعارات"    },
    { id: "reels",      icon: <Film size={14}/>,            en: "Reels",       ar: "ريلز"       },
    { id: "ai",         icon: <Bot size={14}/>,             en: "AI Assistant", ar: "المساعد" },
    { id: "api",        icon: <Key size={14}/>,             en: "API",         ar: "API"        },
    { id: "system",     icon: <Settings size={14}/>,        en: "System",      ar: "النظام"     },
    { id: "tables",     icon: <LayoutGrid size={14}/>,      en: "Tables",      ar: "الطاولات"   },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground shadow-md">
        <button onClick={() => navigate("/menu")} className="opacity-70 hover:opacity-100"><ArrowLeft size={18}/></button>
        <span className="font-bold text-sm flex-1">Azura Admin</span>
        <button onClick={() => { sessionStorage.removeItem("azura-admin"); navigate("/menu"); }} className="text-xs opacity-60 hover:opacity-100">{tr("Sign out", "خروج")}</button>
      </header>
      <nav className="sticky top-[52px] z-30 px-3 py-2 overflow-x-auto scroll-hide bg-card border-b">
        <div className="flex gap-1.5 min-w-max">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedChat(null); }} className={`relative chip flex items-center gap-1.5 ${tab === t.id ? "chip-active" : "chip-inactive"}`}>
              {t.icon}<span>{lang === "ar" ? t.ar : t.en}</span>
              {(t.badge ?? 0) > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 font-bold">{t.badge}</span>}
            </button>
          ))}
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-4 pb-8">
        <Suspense fallback={<div className="py-20 text-center text-muted-foreground animate-pulse">{tr("Loading tab...", "جاري التحميل...")}</div>}>
          {tab === "overview" && <OverviewTab tr={tr} users={users} unreadChats={unreadChats} feedback={feedback} />}
          {tab === "menu" && <MenuTab tr={tr} menu={menu} lang={lang} />}
          {tab === "features" && <FeaturesTab tr={tr} featureFlags={featureFlags} savingFlag={savingFlag} apiSettings={apiSettings} setApiSettings={setApiSettings} toggleFeatureFlag={toggleFeatureFlag} />}
          {tab === "users" && <UsersTab tr={tr} users={users} deleteUser={deleteUser} />}
          {tab === "chat" && <ChatTab tr={tr} selectedChat={selectedChat} setSelectedChat={setSelectedChat} chats={chats} chatMsgs={chatMsgs} chatInput={chatInput} setChatInput={setChatInput} sendReply={sendReply} deleteChat={deleteChat} chatBottomRef={chatBottomRef} isRTL={isRTL} />}
          {tab === "reviews" && <ReviewsTab tr={tr} feedback={feedback} avgRating={avgRating} ratingDist={ratingDist} maxRatingCount={maxRatingCount} />}
          {tab === "broadcast" && <BroadcastTab tr={tr} newBroadcast={newBroadcast} setNewBroadcast={setNewBroadcast} sendBroadcast={sendBroadcast} sendingBroadcast={sendingBroadcast} bannerContent={bannerContent} setBannerContent={setBannerContent} setBannerEnabled={setBannerEnabled} bannerEnabled={bannerEnabled} setSavingBanner={setSavingBanner} bannerBgColor={bannerBgColor} bannerTextColor={bannerTextColor} savingBanner={savingBanner} />}
          {tab === "reels" && <ReelsTab tr={tr} reels={reels} uploading={uploading} setNewReel={setNewReel} newReel={newReel} />}
          {tab === "api" && <ApiTab tr={tr} apiSettings={apiSettings} setApiSettings={setApiSettings} showApiKey={showApiKey} setShowApiKey={setShowApiKey} saveApiSettings={saveApiSettings} savingApiKey={savingApiKey} />}
          {tab === "system" && <SystemTab tr={tr} />}
          {tab === "tables" && <TablesTab tr={tr} activeTables={activeTables} />}
          {tab === "ai" && <div className="page-enter"><AIAdminAssistant /></div>}
        </Suspense>
      </div>
    </div>
  );
}
