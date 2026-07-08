import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import { db, ref, onValue, off, update, set, push, remove, get, forceReseedMenu, mergeMenuIngredients } from "@/lib/firebase";
import { smartGet, smartSet, smartUpdate, smartRemove, smartPush, getDBMode, setDBMode, onModeChange } from "@/lib/dbWrapper";
import { testR2Connection, type R2Config, listR2Objects, downloadFromR2, uploadToR2 } from "@/lib/r2";
import { useLang } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { encryptKey } from "@/lib/crypto";
import { swalSuccess, swalError, swalConfirm, swalLoading, swalClose } from "@/lib/swal";
import {
  ShieldCheck, ArrowLeft, Plus, Trash2,
  Megaphone, Film, Key, Settings,
  RotateCcw, Save,
  AlertTriangle, Bot, LayoutDashboard, Users, ToggleRight, LayoutGrid,
  MessageCircle, Star, TrendingUp, Clock, Zap, Search, ChevronDown, Pencil, X,
  Calendar, Phone, MapPin, Send, Pin, ImageIcon, Video, CheckCircle, Armchair,
  Archive, Download, EyeOff, Eye, Sparkles, UploadCloud
} from "lucide-react";

import { VideoProvider, parseVideoUrl, getProviderIcon, getProviderName } from "@/lib/videoProviders";
import { saveToIndexedDB, fileToChunks, getChunksSizeMB } from "@/lib/chunkedVideo";
import { compressToBase64, base64SizeKB } from "@/lib/imageUtils";
import { MenuItem, ChatSession, ChatMsg, Feedback, Broadcast, Reel } from "./admin/types";

const AIAdminAssistant = lazy(() => import("@/components/AIAdminAssistant"));

const ADMIN_PIN = "azura2026";
const inp = "input-field px-3 py-2.5 text-sm";

type Tab = "overview" | "menu" | "users" | "chat" | "reviews" | "broadcast" | "reels" | "api" | "system" | "ai" | "features" | "tables";

// ── Shared Helper Components ─────────────────────────────────

function ImagePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      swalError("Please select a valid image file.");
      return;
    }
    setCompressing(true);
    try {
      const b64 = await compressToBase64(file, 600, 0.78);
      if (b64 && b64.startsWith("data:image/")) {
        onChange(b64);
      } else {
        throw new Error("Invalid base64");
      }
    } catch (err) {
      console.error(err);
      swalError("Compression failed.");
    }
    setCompressing(false);
  };

  const isBase64 = value?.startsWith("data:");
  const sizeKB = isBase64 ? base64SizeKB(value) : 0;

  return (
    <div className="space-y-2">
      {label && <label className="text-[10px] font-bold text-muted-foreground uppercase">{label}</label>}
      {value && (
        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border bg-muted/40 group">
          <img src={value} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.25"; }} loading="lazy" />
          {isBase64 && <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">📷 {sizeKB} KB</span>}
          <button type="button" onClick={() => onChange("")} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"><X size={11} /></button>
        </div>
      )}
      <div className="flex gap-2 items-center">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={compressing} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 flex-shrink-0 whitespace-nowrap">
          {compressing ? <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <ImageIcon size={13} />}
          {compressing ? "Compressing…" : "Upload Photo"}
        </button>
        <input type="text" className={`${inp} flex-1 text-[11px] py-2`} placeholder="…or paste image URL" value={isBase64 ? "" : value || ""} onChange={(e) => onChange(e.target.value)} />
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

// ── Tab Components ───────────────────────────────────────────

const OverviewTab = ({ tr, users, unreadChats, newReviewsCount }: any) => {
  const stats = useMemo(() => {
    const now = Date.now();
    const thirtyMins = 30 * 60 * 1000;
    const activeNow = users.filter((u: any) => u.lastLoginAt && (now - u.lastLoginAt) < thirtyMins).length;
    const returning = users.filter((u: any) => u.loginCount > 1).length;
    const returningRate = users.length ? Math.round((returning / users.length) * 100) : 0;
    return { activeNow, returningRate };
  }, [users]);

  return (
    <div className="space-y-4 page-enter">
      <div className="grid grid-cols-2 gap-3">
        {[
          { emoji: "🔥", label: tr("Active Now","نشط الآن"), value: stats.activeNow, color: "text-orange-600" },
          { emoji: "🔄", label: tr("Retention Rate","معدل العودة"), value: `${stats.returningRate}%`, color: "text-blue-600" },
          { emoji: "💬", label: tr("Unread Messages","رسائل جديدة"), value: unreadChats, color: "text-green-600" },
          { emoji: "⭐", label: tr("New Reviews","تقييمات جديدة"), value: newReviewsCount, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="card-elevated rounded-2xl p-4 text-center transition-transform active:scale-95">
            <p className="text-2xl mb-1">{s.emoji}</p>
            <p className={`text-2xl font-black ${s.color} leading-tight`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="card-elevated rounded-2xl p-5 border border-primary/5">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-primary"/> {tr("Business Insights","رؤى العمل")}
        </h3>
        <div className="space-y-3">
           <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Users size={14}/></div>
               <p className="text-xs font-bold">{tr("Total CRM Records", "إجمالي سجلات العملاء")}</p>
             </div>
             <p className="text-sm font-black text-primary">{users.length}</p>
           </div>
           <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600"><Zap size={14}/></div>
               <p className="text-xs font-bold">{tr("High Value Clients", "عملاء مميزون")}</p>
             </div>
             <p className="text-sm font-black text-orange-600">{users.filter((u: any) => u.loginCount >= 3).length}</p>
           </div>
        </div>
      </div>
      <h2 className="font-bold text-sm text-foreground px-1">{tr("Live Workspace Activity","نشط بيئة العمل المباشر")}</h2>
      <div className="space-y-2 pb-4">
        {users.slice(0, 10).map((u: any) => {
          const isActive = u.lastLoginAt && (Date.now() - u.lastLoginAt) < 30 * 60 * 1000;
          return (
            <div key={u.uid} className="card rounded-xl p-3 flex items-center gap-3 border border-border/40">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shadow-inner">
                  {u.name?.[0]?.toUpperCase() || "?"}
                </div>
                {isActive && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{u.name || "Guest"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">Table {u.tableNumber || "N/A"}</span>
                  <span className="text-[10px] text-muted-foreground/60 italic">{u.loginCount} {tr("visits", "زيارة")}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-primary">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "—"}
                </p>
                <p className="text-[9px] text-muted-foreground">{tr("Last Seen", "آخر ظهور")}</p>
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <div className="text-center py-12 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
             <Clock className="mx-auto text-muted mb-2" size={32}/>
             <p className="text-muted-foreground text-sm">{tr("No activity recorded yet","لا يوجد نشاط مسجل بعد")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MenuTab = ({ tr, lang, menu, MENU_CATEGORIES, CAT_META }: any) => {
  const [menuSearch, setMenuSearch] = useState("");
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", nameAr: "", price: "", category: "coffee",
    image: "", description: "", descriptionAr: "",
    ingredients: "", ingredientsAr: "", available: true,
  });
  const [savingItem, setSavingItem] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["coffee", "hot_drinks", "recommended"]));
  const [menuEdits, setMenuEdits] = useState<Record<string, Partial<MenuItem>>>({});
  const [savingMenuId, setSavingMenuId] = useState<string | null>(null);

  const groupedMenu = useMemo(() => {
    const filtered = menu.filter((item: MenuItem) => {
      const matchesSearch = !menuSearch ||
        item.name?.toLowerCase().includes(menuSearch.toLowerCase()) ||
        item.nameAr?.includes(menuSearch) ||
        item.description?.toLowerCase().includes(menuSearch.toLowerCase()) ||
        item.id?.toLowerCase().includes(menuSearch.toLowerCase());
      const matchesCategory = menuCategoryFilter === "all" || item.category === menuCategoryFilter;
      return matchesSearch && matchesCategory;
    });
    const groups: Record<string, MenuItem[]> = {};
    const recs = filtered.filter((i: MenuItem) => i.recommended);
    if (recs.length > 0) groups["recommended"] = recs;
    filtered.forEach((item: MenuItem) => {
      const cat = item.category || "other";
      if (!groups[cat]) groups[cat] = [];
      if (menuCategoryFilter === "all" && item.recommended) return;
      groups[cat].push(item);
    });
    return groups;
  }, [menu, menuSearch, menuCategoryFilter]);

  return (
    <div className="space-y-4 page-enter">
      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-foreground flex items-center gap-2"><LayoutGrid size={18} className="text-primary"/> {tr("Menu Management","إدارة القائمة")}</h3>
          <div className="w-full flex gap-2 mt-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder={tr("Search items...", "البحث في القائمة...")} value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary/30" />
            </div>
            <select value={menuCategoryFilter} onChange={(e) => setMenuCategoryFilter(e.target.value)} className="px-3 py-2.5 rounded-xl bg-muted text-sm border-0 focus:ring-2 focus:ring-primary/30">
              <option value="all">{tr("All Categories", "كل الأقسام")}</option>
              {MENU_CATEGORIES.map((c: string) => <option key={c} value={c}>{CAT_META[c] ? tr(CAT_META[c].en, CAT_META[c].ar) : c}</option>)}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap w-full">
            <button onClick={async () => { if (!confirm(tr("Merge menu items?", "دمج عناصر القائمة؟"))) return; swalLoading(tr("Merging...", "جار الدمج…")); await mergeMenuIngredients(); swalClose(); swalSuccess(tr("Merged!", "تم الدمج!")); }} className="flex-1 btn-secondary px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"><RotateCcw size={13}/> {tr("Merge", "دمج")}</button>
            <button onClick={async () => { if (!confirm(tr("Force reseed?", "إعادة رفع القائمة؟"))) return; swalLoading(tr("Reseeding...", "جار الرفع…")); await forceReseedMenu(); swalClose(); swalSuccess(tr("Reseeded!", "تم الرفع!")); }} className="flex-1 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"><UploadCloud size={13}/> {tr("Reseed", "رفع")}</button>
            <button onClick={() => setShowAddForm(v => !v)} className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors ${showAddForm ? "bg-muted text-foreground" : "btn-primary"}`}><Plus size={13}/> {showAddForm ? tr("Cancel", "إلغاء") : tr("Add", "إضافة")}</button>
          </div>
        </div>
        {showAddForm && (
          <div className="rounded-2xl border border-primary/20 bg-primary/3 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs font-black text-primary uppercase tracking-widest">{tr("New Menu Item", "صنف جديد")}</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Name (EN)","الاسم EN")}</label><input className={inp} placeholder="Caramel Latte" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Name (AR)","الاسم AR")}</label><input className={inp} dir="rtl" placeholder="لاتيه كراميل" value={addForm.nameAr} onChange={e => setAddForm(f => ({ ...f, nameAr: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Price","السعر")}</label><input type="number" className={inp} placeholder="0" value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Category","الفئة")}</label><select className={inp} value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}>{MENU_CATEGORIES.map((c: string) => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <ImagePicker label={tr("Photo", "الصورة")} value={addForm.image} onChange={v => setAddForm(f => ({ ...f, image: v }))} />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Description (EN)","الوصف EN")}</label><input className={inp} placeholder="..." value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Description (AR)","الوصف AR")}</label><input className={inp} dir="rtl" placeholder="..." value={addForm.descriptionAr} onChange={e => setAddForm(f => ({ ...f, descriptionAr: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <textarea className={`${inp} resize-none h-16`} placeholder={tr("Ingredients (EN)", "المكونات EN")} value={addForm.ingredients} onChange={e => setAddForm(f => ({ ...f, ingredients: e.target.value }))} />
              <textarea className={`${inp} resize-none h-16`} dir="rtl" placeholder={tr("Ingredients (AR)", "المكونات AR")} value={addForm.ingredientsAr} onChange={e => setAddForm(f => ({ ...f, ingredientsAr: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${addForm.available ? "bg-green-500" : "bg-muted"}`} onClick={() => setAddForm(f => ({ ...f, available: !f.available }))}><div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${addForm.available ? "translate-x-4" : ""}`} /></div>
                <span className="text-xs font-semibold">{addForm.available ? tr("Available","متاح") : tr("Sold Out","نفذ")}</span>
              </label>
              <button disabled={savingItem || !addForm.name || !addForm.price} onClick={async () => { setSavingItem(true); const id = `${addForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36)}`; await smartSet(`menu/${addForm.category}/${id}`, { ...addForm, price: Number(addForm.price) }); setAddForm({ name:"", nameAr:"", price:"", category:"coffee", image:"", description:"", descriptionAr:"", ingredients:"", ingredientsAr:"", available:true }); setShowAddForm(false); setSavingItem(false); swalSuccess(tr("Added!", "تمت الإضافة!")); }} className="btn-primary px-5 py-2 rounded-xl text-xs font-bold ms-auto flex items-center gap-2">{savingItem ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <Save size={14}/>}{tr("Save Item","حفظ الصنف")}</button>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {Object.keys(groupedMenu).length === 0 && <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed"><Search size={40} className="mx-auto text-muted-foreground/30 mb-3"/><p className="text-muted-foreground text-sm">{tr("No items found", "لا توجد نتائج")}</p></div>}
        {Object.entries(groupedMenu).map(([catId, catItems]) => {
          const isExpanded = expandedCats.has(catId);
          const meta = CAT_META[catId] || { emoji: "📦", en: catId, ar: catId };
          const itemsList = catItems as MenuItem[];
          return (
            <div key={catId} className="space-y-2">
              <button onClick={() => { const next = new Set(expandedCats); if (next.has(catId)) next.delete(catId); else next.add(catId); setExpandedCats(next); }} className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-muted/50 rounded-xl transition-colors group"><div className="flex items-center gap-2"><span className="text-xl">{meta.emoji}</span><span className="font-black text-sm uppercase tracking-tight text-foreground/80">{tr(meta.en, meta.ar)}</span><span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">{itemsList.length}</span></div><ChevronDown size={18} className={`text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} /></button>
              {isExpanded && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                  {itemsList.map((item: MenuItem) => {
                    const isSelected = selectedMenuItemId === item.id;
                    const edits = menuEdits[item.id] || {};
                    const isDirty = Object.keys(edits).length > 0;
                    return (
                      <div key={item.id} className="contents">
                        <div onClick={() => setSelectedMenuItemId(isSelected ? null : item.id)} className={`relative group cursor-pointer card rounded-2xl overflow-hidden border transition-all duration-200 ${isSelected ? "ring-2 ring-primary border-transparent shadow-lg scale-[1.02] bg-primary/5" : isDirty ? "border-amber-300 bg-amber-50/30" : "border-border/40 hover:border-primary/30"}`} style={{ contentVisibility: "auto", containIntrinsicSize: "0 150px", willChange: "transform" }}>
                          <div className="h-24 relative overflow-hidden bg-muted/20">{item.image ? <img src={item.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" loading="lazy"/> : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">{meta.emoji}</div>}{!item.available && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="bg-white/90 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase">{tr("Sold Out", "نفذ")}</span></div>}{item.recommended && <div className="absolute top-1 right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] shadow-sm">⭐</div>}</div>
                          <div className="p-2.5"><p className="font-bold text-xs text-foreground truncate">{lang === "ar" ? (item.nameAr || item.name) : item.name}</p><div className="flex items-center justify-between mt-1"><p className="text-[10px] font-black text-primary">{item.price} <span className="text-[8px] opacity-60">EGP</span></p><Pencil size={10} className={`transition-opacity ${isSelected ? "text-primary opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`} /></div></div>
                          {isDirty && <div className="absolute top-1 left-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-sm shadow-amber-500/50" />}
                        </div>
                        {isSelected && (
                          <div className="col-span-2 card-elevated rounded-3xl p-5 border-2 border-primary/20 bg-card shadow-2xl animate-in zoom-in-95 duration-200 mt-1 mb-3">
                            <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Pencil size={20} /></div><div><p className="text-[10px] font-black text-primary uppercase tracking-widest">{tr("Edit Item", "تعديل الصنف")}</p><h4 className="font-bold text-foreground">{item.name}</h4></div></div><button onClick={() => setSelectedMenuItemId(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button></div>
                            <div className="space-y-4">
                              {(() => {
                                const currentEdits = menuEdits[item.id] || {};
                                const val = (f: keyof MenuItem) => f in currentEdits ? currentEdits[f] : item[f];
                                const patch = (f: keyof MenuItem, v: any) => setMenuEdits(prev => ({ ...prev, [item.id]: { ...prev[item.id], [f]: v } }));
                                const handleSave = async () => { setSavingMenuId(item.id); try { await smartUpdate(`menu/${item.category}/${item.id}`, currentEdits); setMenuEdits(prev => { const n = { ...prev }; delete n[item.id]; return n; }); swalSuccess(tr("Saved!", "تم الحفظ!")); setSelectedMenuItemId(null); } catch (e) { swalError(tr("Failed", "فشل")); } setSavingMenuId(null); };
                                const handleDelete = async () => { if (await swalConfirm(tr("Delete?", "حذف؟"), tr("Permanent.", "دائم."), tr("Delete", "حذف"), tr("Cancel", "إلغاء"))) { await smartRemove(`menu/${item.category}/${item.id}`); setSelectedMenuItemId(null); swalSuccess(tr("Deleted", "تم الحذف")); } };
                                return (
                                  <>
                                    <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Name (EN)", "الاسم EN")}</label><input className={inp} value={val("name") as string} onChange={e => patch("name", e.target.value)} /></div><div><label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Name (AR)", "الاسم AR")}</label><input className={inp} dir="rtl" value={val("nameAr") as string} onChange={e => patch("nameAr", e.target.value)} /></div></div>
                                    <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Price", "السعر")}</label><input type="number" className={inp} value={val("price") as number} onChange={e => patch("price", Number(e.target.value))} /></div><div><label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Category", "الفئة")}</label><select className={inp} value={val("category") as string} onChange={e => patch("category", e.target.value)}>{MENU_CATEGORIES.map((c:string) => <option key={c} value={c}>{c}</option>)}</select></div></div>
                                    <ImagePicker label={tr("Photo", "الصورة")} value={val("image") as string} onChange={v => patch("image", v)} />
                                    <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Description (EN)", "الوصف EN")}</label><input className={inp} value={val("description") as string} onChange={e => patch("description", e.target.value)} /></div><div><label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Description (AR)", "الوصف AR")}</label><input className={inp} dir="rtl" value={val("descriptionAr") as string} onChange={e => patch("descriptionAr", e.target.value)} /></div></div>
                                    <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Ingredients (EN)", "المكونات EN")}</label><textarea className={`${inp} resize-none h-20 text-[11px]`} value={val("ingredients") as string} onChange={e => patch("ingredients", e.target.value)} /></div><div><label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Ingredients (AR)", "المكونات AR")}</label><textarea className={`${inp} resize-none h-20 text-[11px]`} dir="rtl" value={val("ingredientsAr") as string} onChange={e => patch("ingredientsAr", e.target.value)} /></div></div>
                                    <div className="flex flex-wrap items-center gap-4 pt-2">
                                      <label className="flex items-center gap-2 cursor-pointer"><div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${val("available") ? "bg-green-500" : "bg-muted"}`} onClick={() => patch("available", !val("available"))}><div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${val("available") ? "translate-x-5" : ""}`} /></div><span className="text-xs font-bold">{val("available") ? tr("In Stock", "متاح") : tr("Sold Out", "نفذ")}</span></label>
                                      <button onClick={() => patch("recommended", !val("recommended"))} className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 ${val("recommended") ? "bg-amber-400 text-white shadow-lg shadow-amber-200" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}><span>{val("recommended") ? "⭐" : "☆"}</span>{tr("Recommended", "مُوصى به")}</button>
                                      <div className="flex gap-2 ms-auto"><button onClick={handleDelete} className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive transition-colors hover:text-white"><Trash2 size={18} /></button><button disabled={savingMenuId === item.id || !Object.keys(currentEdits).length} onClick={handleSave} className="btn-primary px-6 h-10 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-40">{savingMenuId === item.id ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <Save size={16}/>}{tr("Save Changes", "حفظ التعديلات")}</button></div>
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

const FeaturesTab = ({ tr, featureFlags, toggleFeatureFlag, savingFlag, apiSettings, setApiSettings, updateApiSettings }: any) => {
  return (
    <div className="space-y-4 page-enter">
      <div className="card-elevated rounded-2xl p-5 space-y-5">
        <div className="flex items-center gap-2 mb-1"><ToggleRight size={20} className="text-primary"/><h3 className="font-bold text-foreground">{tr("App Features & Pages", "ميزات وصفحات التطبيق")}</h3></div>
        <p className="text-xs text-muted-foreground -mt-2">{tr("Toggle pages and features on/off for all users.", "تفعيل أو تعطيل الصفحات والميزات لجميع المستخدمين.")}</p>
        <div className="flex items-center justify-between gap-4 py-3 border-b border-border/50"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0"><Sparkles size={18} className="text-purple-600"/></div><div><p className="font-semibold text-sm text-foreground">{tr("AI Barista Page", "صفحة الباريستا الذكي")}</p><p className="text-[11px] text-muted-foreground">{tr("Chat with Zura AI", "الدردشة مع زورا الذكية")}</p></div></div><button disabled={savingFlag === "baristaEnabled"} onClick={() => toggleFeatureFlag("baristaEnabled", !featureFlags.baristaEnabled)} className={`relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${featureFlags.baristaEnabled ? "bg-green-500" : "bg-muted"} disabled:opacity-60`}><div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${featureFlags.baristaEnabled ? "translate-x-8" : "translate-x-1"}`}/></button></div>
        <div className="flex items-center justify-between gap-4 py-3 border-b border-border/50"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0"><Film size={18} className="text-pink-600"/></div><div><p className="font-semibold text-sm text-foreground">{tr("Reels Page", "صفحة الريلز")}</p><p className="text-[11px] text-muted-foreground">{tr("Video & image feed", "فيد الفيديو والصور للعملاء")}</p></div></div><button disabled={savingFlag === "reelsEnabled"} onClick={() => toggleFeatureFlag("reelsEnabled", !featureFlags.reelsEnabled)} className={`relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${featureFlags.reelsEnabled ? "bg-green-500" : "bg-muted"} disabled:opacity-60`}><div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${featureFlags.reelsEnabled ? "translate-x-8" : "translate-x-1"}`}/></button></div>
        <div className="flex items-center justify-between gap-4 py-3 border-b border-border/50"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0"><MessageCircle size={18} className="text-blue-600"/></div><div><p className="font-semibold text-sm text-foreground">{tr("Support Chat", "صفحة الدعم")}</p><p className="text-[11px] text-muted-foreground">{tr("Customer live support", "محادثة الدعم المباشر")}</p></div></div><button disabled={savingFlag === "supportEnabled"} onClick={() => toggleFeatureFlag("supportEnabled", !featureFlags.supportEnabled)} className={`relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${featureFlags.supportEnabled ? "bg-green-500" : "bg-muted"} disabled:opacity-60`}><div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${featureFlags.supportEnabled ? "translate-x-8" : "translate-x-1"}`}/></button></div>
        <div className="flex items-center justify-between gap-4 py-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0"><Bot size={18} className="text-amber-600"/></div><div><p className="font-semibold text-sm text-foreground">{tr("AI Service", "خدمة الذكاء الاصطناعي")}</p><p className="text-[11px] text-muted-foreground">{tr("Disable to pause AI", "تعطيل لإيقاف ردود الذكاء")}</p></div></div><button onClick={async () => { const next = !apiSettings.aiEnabled; setApiSettings((p: any) => ({ ...p, aiEnabled: next })); await updateApiSettings({ aiEnabled: next }); }} className={`relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${apiSettings.aiEnabled ? "bg-green-500" : "bg-muted"}`}><div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${apiSettings.aiEnabled ? "translate-x-8" : "translate-x-1"}`}/></button></div>
      </div>
    </div>
  );
};

const UsersTab = ({ tr, users, deleteUser, formatDuration }: any) => {
  const [userSearch, setUserSearch] = useState("");
  const filteredUsers = users.filter((u: any) => !userSearch || u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()) || u.uid?.includes(userSearch) || u.tableNumber?.toString().includes(userSearch));
  return (
    <div className="space-y-4 page-enter">
      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Users size={20}/></div><div><h3 className="font-bold text-foreground leading-tight">{tr("CRM Directory","إدارة سجلات العملاء")}</h3><p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{users.length} {tr("Registered", "ملف مسجل")}</p></div></div></div>
        <div className="relative"><input type="text" placeholder={tr("Search by Name, Table, or ID...", "ابحث بالاسم...")} value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full px-4 py-3 pl-10 rounded-2xl bg-muted text-sm border-0 focus:ring-2 focus:ring-primary/20 transition-all" /><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" /></div>
        <div className="space-y-4">
          {filteredUsers.map((u: any) => (
            <div key={u.uid} className="card rounded-[2rem] p-5 border border-border/40 hover:shadow-xl transition-all group bg-card/50">
              <div className="flex items-start gap-4">
                <div className="relative"><div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center text-primary-foreground text-2xl font-black shadow-lg transition-transform group-hover:scale-105">{u.name?.[0]?.toUpperCase() || "?"}</div><div className="absolute -bottom-1 -right-1 bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg border-2 border-white shadow-sm">T{u.tableNumber || "0"}</div></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between"><div><p className="font-black text-foreground text-base tracking-tight">{u.name || "Guest"}</p><p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{u.uid}</p></div><button onClick={() => deleteUser(u.uid, u.name)} className="w-8 h-8 rounded-full bg-destructive/5 text-destructive/30 hover:bg-destructive hover:text-white transition-all flex items-center justify-center"><Trash2 size={14}/></button></div>
                  <div className="flex flex-wrap gap-1.5 mt-3">{u.loginCount > 2 && <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shadow-sm"><Star size={8} fill="currentColor"/> Loyal</span>}{u.totalUsageSeconds > 3600 && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shadow-sm"><Clock size={8}/> Power User</span>}{u.lastLoginAt && (Date.now() - u.lastLoginAt) < 24 * 3600 * 1000 && <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">Active</span>}</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-5 pt-5 border-t border-dashed border-border/60">
                    <div className="flex items-center gap-2"><Calendar size={12} className="text-primary/40"/><div><p className="text-[8px] font-black text-muted-foreground/60 uppercase">{tr("Joined","تاريخ الانضمام")}</p><p className="text-[11px] font-bold text-foreground/80">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</p></div></div>
                    <div className="flex items-center gap-2"><Clock size={12} className="text-primary/40"/><div><p className="text-[8px] font-black text-muted-foreground/60 uppercase">{tr("Engagement","وقت البقاء")}</p><p className="text-[11px] font-bold text-foreground/80">{formatDuration(u.totalUsageSeconds || 0)}</p></div></div>
                    <div className="flex items-center gap-2"><Star size={12} className="text-primary/40"/><div><p className="text-[8px] font-black text-muted-foreground/60 uppercase">{tr("Visit Count","عدد الزيارات")}</p><p className="text-[11px] font-bold text-foreground/80">{u.loginCount || 0} {tr("Logins", "مرة دخول")}</p></div></div>
                    <div className="flex items-center gap-2"><MapPin size={12} className="text-primary/40"/><div><p className="text-[8px] font-black text-muted-foreground/60 uppercase">{tr("Preferred Spot","الطاولة المفضلة")}</p><p className="text-[11px] font-bold text-foreground/80">Table {u.tableNumber || "N/A"}</p></div></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ChatTab = ({ tr, isRTL, selectedChat, setSelectedChat, chats, chatMsgs, chatInput, setChatInput, sendReply, deleteChat, chatBottomRef }: any) => {
  return (
    <div className="page-enter">
      {selectedChat ? (
        <div className="flex flex-col h-[calc(100dvh-12rem)]">
          <button onClick={() => setSelectedChat(null)} className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-3"><ArrowLeft size={14}/> {tr("All Chats","كل الدردشات")}</button>
          <div className="card rounded-2xl overflow-hidden flex flex-col flex-1">
            <div className="px-4 py-2.5 flex-shrink-0" style={{ background: "hsl(var(--muted))", borderBottom: "1px solid hsl(var(--border))" }}><p className="font-bold text-sm text-primary">{chats.find((c: any) => c.uid === selectedChat)?.userName || "Guest"}</p><p className="text-[10px] text-muted-foreground">{tr("Support session","جلسة دعم")}</p></div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scroll-hide">
              {chatMsgs.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">{tr("No messages yet","لا توجد رسائل")}</p>}
              {chatMsgs.map((m: any) => (
                <div key={m.id} className={`flex ${m.sender==="user"?(isRTL?"justify-end":"justify-start"):(isRTL?"justify-start":"justify-end")}`}><div className={`max-w-[78%] px-3 py-2 text-sm rounded-xl ${m.sender==="user"?"bg-muted text-foreground":"bubble-user"}`}>{m.sender!=="user" && <p className="text-[9px] font-bold text-primary-foreground/70 mb-0.5">{tr("You","مدير")}</p>}{m.text}<p className="text-[9px] opacity-50 mt-0.5">{new Date(m.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</p></div></div>
              ))}
              <div ref={chatBottomRef}/>
            </div>
            <div className="flex items-center gap-2 p-3 flex-shrink-0" style={{ borderTop: "1px solid hsl(var(--border))" }}><input className="flex-1 input-field px-3 py-2 text-sm" placeholder={tr("Reply…","رد…")} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key==="Enter" && sendReply()} dir={isRTL?"rtl":"ltr"}/><button onClick={sendReply} disabled={!chatInput.trim()} className="btn-icon w-9 h-9 disabled:opacity-40" style={chatInput.trim()?{background:"hsl(var(--primary))",color:"hsl(var(--primary-foreground))"}:{}}><Send size={14}/></button></div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.length === 0 && <div className="text-center py-14"><MessageCircle size={44} className="mx-auto text-muted-foreground/25 mb-2"/><p className="text-muted-foreground text-sm">{tr("No support chats","لا يوجد محادثات")}</p></div>}
          {chats.map((c: any) => (
            <div key={c.uid} className="card rounded-xl p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
              <button onClick={() => setSelectedChat(c.uid)} className="flex items-center gap-3 flex-1 min-w-0 text-left"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">{c.userName?.[0]?.toUpperCase() || "?"}</div><div className="flex-1 min-w-0"><p className="font-semibold text-sm text-foreground truncate">{c.userName}</p><p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p></div><div className="flex flex-col items-end gap-1 flex-shrink-0"><p className="text-[10px] text-muted-foreground">{c.lastAt ? new Date(c.lastAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : ""}</p>{c.unreadAdmin > 0 && <span className="badge px-1.5 py-0.5 bg-red-500 text-white text-[9px]">{c.unreadAdmin}</span>}</div></button>
              <button onClick={() => deleteChat(c.uid, c.userName)} className="p-2 text-destructive/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ReviewsTab = ({ tr, feedback, avgRating, ratingDist, maxRatingCount, markFeedbackRead }: any) => {
  return (
    <div className="space-y-4 page-enter">
      {feedback.length > 0 && (
        <div className="card-elevated rounded-2xl p-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="text-center"><p className="text-4xl font-extrabold text-primary">{avgRating}</p><Stars n={parseFloat(avgRating as string) || 0}/><p className="text-[10px] text-muted-foreground mt-0.5">{feedback.length} {tr("reviews","تقييم")}</p></div>
            <div className="flex-1 space-y-1.5">{ratingDist.map((d: any) => <div key={d.r} className="flex items-center gap-2 text-xs"><span className="w-4 text-right font-semibold text-foreground">{d.r}</span><span className="text-yellow-400">★</span><div className="flex-1"><CssBar pct={(d.count/maxRatingCount)*100} color="#F59E0B"/></div><span className="w-5 text-muted-foreground">{d.count}</span></div>)}</div>
          </div>
        </div>
      )}
      {feedback.length === 0 && <div className="text-center py-12"><Star size={40} className="mx-auto text-muted-foreground/25 mb-2"/><p className="text-muted-foreground text-sm">{tr("No reviews yet","لا يوجد تقييمات")}</p></div>}
      {feedback.map((f: any) => (
        <div key={f.id} className={`card rounded-xl p-4 ${!f.read ? "ring-1 ring-primary/30" : ""}`}><div className="flex items-start justify-between mb-1.5"><div><p className="font-semibold text-sm text-foreground">{f.userName}</p><Stars n={f.rating} size={13}/></div><div className="flex items-center gap-2 flex-shrink-0"><p className="text-[10px] text-muted-foreground">{new Date(f.createdAt).toLocaleDateString()}</p>{!f.read && <button onClick={() => markFeedbackRead(f.id)} className="text-[10px] text-primary font-semibold">{tr("Mark read","قراءة")}</button>}</div></div>{f.comment && <p className="text-sm text-muted-foreground italic">"{f.comment}"</p>}</div>
      ))}
    </div>
  );
};

const BroadcastTab = ({ tr, newBroadcast, setNewBroadcast, sendBroadcast, sendingBroadcast, bannerContent, setBannerContent, bannerBgColor, setBannerBgColor, bannerTextColor, setBannerTextColor, bannerEnabled, saveBannerEnabled, saveBanner, savingBanner, bannerPreview, broadcasts, deleteBroadcast }: any) => {
  return (
    <div className="space-y-4 page-enter">
      <div className="card-elevated rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Megaphone size={16} className="text-primary"/> {tr("Send Announcement","إرسال إشعار للجميع")}</h3>
        <div className="grid grid-cols-3 gap-2">{(["📢","🎉","⚠️","🔥","💝","☕"] as const).map((e) => <button key={e} onClick={() => setNewBroadcast((p: any) => ({...p, emoji: e}))} className={`py-2 rounded-xl text-xl transition-all ${newBroadcast.emoji === e ? "ring-2 ring-primary bg-primary/10" : "bg-muted/50"}`}>{e}</button>)}</div>
        <div className="grid grid-cols-3 gap-2">{(["info","promo","alert"] as const).map((t) => <button key={t} onClick={() => setNewBroadcast((p: any) => ({...p, type: t}))} className={`py-2 rounded-xl text-xs font-bold transition-all capitalize ${newBroadcast.type === t ? (t==="info"?"bg-blue-500 text-white":t==="promo"?"bg-amber-500 text-white":"bg-red-500 text-white") : "chip-inactive"}`}>{t === "info" ? tr("Info","معلومة") : t === "promo" ? tr("Promo","عرض") : tr("Alert","تنبيه")}</button>)}</div>
        <div className="grid grid-cols-2 gap-2"><input className={inp} placeholder={tr("Title (EN)","العنوان EN")} value={newBroadcast.title} onChange={(e) => setNewBroadcast((p: any) => ({...p, title: e.target.value}))}/><input className={inp} dir="rtl" placeholder="العنوان عربي" value={newBroadcast.titleAr} onChange={(e) => setNewBroadcast((p: any) => ({...p, titleAr: e.target.value}))}/></div>
        <textarea rows={2} className={`${inp} resize-none`} placeholder={tr("Message (EN)","الرسالة EN")} value={newBroadcast.message} onChange={(e) => setNewBroadcast((p: any) => ({...p, message: e.target.value}))}/><textarea rows={2} className={`${inp} resize-none`} dir="rtl" placeholder="الرسالة بالعربي" value={newBroadcast.messageAr} onChange={(e) => setNewBroadcast((p: any) => ({...p, messageAr: e.target.value}))}/><button onClick={sendBroadcast} disabled={sendingBroadcast || !newBroadcast.title || !newBroadcast.message} className="btn-primary w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"><Megaphone size={14}/> {sendingBroadcast ? tr("Sending…","جاري الإرسال…") : tr("Send to All Users","أرسل للجميع")}</button>
      </div>
      <div className="card-elevated rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Pin size={16} className="text-primary"/> {tr("Homepage Banner","بانر الصفحة الرئيسية")}</h3>
        <div className="space-y-2"><label className="text-xs font-semibold text-muted-foreground">{tr("Banner Content","محتوى البانر")}</label><textarea rows={3} className={`${inp} resize-none font-mono text-xs`} placeholder="..." value={bannerContent} onChange={(e) => setBannerContent(e.target.value)}/></div>
        <div className="grid grid-cols-2 gap-2"><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">{tr("BG Color","لون الخلفية")}</label><input type="color" value={bannerBgColor} onChange={(e) => setBannerBgColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer"/></div><div className="space-y-1"><label className="text-xs font-semibold text-muted-foreground">{tr("Text Color","لون النص")}</label><input type="color" value={bannerTextColor} onChange={(e) => setBannerTextColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer"/></div></div>
        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-xs font-semibold">{tr("Enable","تفعيل")}</span><button onClick={() => saveBannerEnabled(!bannerEnabled)} className={`w-12 h-6 rounded-full relative transition-colors ${bannerEnabled ? "bg-green-500" : "bg-muted"}`}><div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${bannerEnabled ? "translate-x-6" : "translate-x-0.5"}`}/></button></div><button onClick={saveBanner} disabled={savingBanner} className="btn-primary py-2 px-4 rounded-xl text-sm font-bold flex items-center gap-2"><Save size={14}/> {tr("Save Banner","حفظ البانر")}</button></div>
        {bannerPreview && <div className="p-3 rounded-xl text-center text-sm font-semibold" style={{ background: bannerBgColor, color: bannerTextColor }} dangerouslySetInnerHTML={{ __html: bannerContent }} />}
      </div>
      <div className="space-y-2">
        {broadcasts.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">{tr("No announcements yet","لم يُرسل أي إشعار بعد")}</p>}
        {broadcasts.map((b: any) => (<div key={b.id} className={`card rounded-xl p-3 flex items-start gap-3 border ${b.type==="alert"?"border-red-200":b.type==="promo"?"border-amber-200":"border-blue-200"}`}><span className="text-2xl">{b.emoji}</span><div className="flex-1 min-w-0"><p className="font-bold text-sm text-foreground">{b.title}</p><p className="text-xs text-muted-foreground line-clamp-2">{b.message}</p></div><button onClick={() => deleteBroadcast(b.id)} className="text-destructive/60 hover:text-destructive"><Trash2 size={13}/></button></div>))}
      </div>
    </div>
  );
};

const ReelsTab = ({ tr, reels, togglePin, deleteReel }: any) => {
  const [newReel, setNewReel] = useState<any>({ image: "", caption: "", captionAr: "", mediaType: "image", videoUrl: "", videoProvider: undefined, videoThumbnail: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createReel = async () => {
    if (!newReel.image || (!newReel.caption && !newReel.captionAr)) return;
    setUploading(true); setUploadProgress(0);
    try {
      const r = push(ref(db, "reels")); const reelId = r.key!;
      await smartSet(`reels/${reelId}`, { image: newReel.image, caption: newReel.caption, captionAr: newReel.captionAr, likes: 0, createdAt: Date.now(), authorName: "Admin", mediaType: newReel.mediaType, videoUrl: newReel.videoUrl || "", videoProvider: newReel.videoProvider || "direct", videoThumbnail: newReel.videoThumbnail || "", chunkCount: newReel.chunkCount || 0 });
      if (newReel.videoChunks && newReel.videoChunks.length > 0) {
        const fullVideo = newReel.videoChunks.join(""); await saveToIndexedDB(`reel_${reelId}`, fullVideo);
        const chunksRef = ref(db, `reelChunks/${reelId}`);
        const batchSize = 5;
        for (let i = 0; i < newReel.videoChunks.length; i += batchSize) {
          const batch: Record<string, string> = {}; const end = Math.min(i + batchSize, newReel.videoChunks.length);
          for (let j = i; j < end; j++) { batch[`chunk_${j}`] = newReel.videoChunks![j]; }
          await smartUpdate(`reelChunks/${reelId}`, batch); setUploadProgress(Math.round(((i + batchSize) / newReel.videoChunks!.length) * 90));
        }
      } else if (newReel.mediaType === "video" && newReel.videoUrl && newReel.videoProvider !== "direct") { await saveToIndexedDB(`reel_${reelId}`, newReel.videoUrl); }
      setUploadProgress(100); swalSuccess(tr("Reel created!", "تم إنشاء المنشور!")); setNewReel({ image: "", caption: "", captionAr: "", mediaType: "image", videoUrl: "", videoProvider: undefined, videoThumbnail: "" });
    } catch (err) { swalError(tr("Failed", "فشل")); } setUploading(false);
  };

  return (
    <div className="space-y-4 page-enter">
      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Film size={18} className="text-primary"/> {tr("Create Post","إنشاء منشور جديد")}</h3>
        <div className="space-y-3">
          <div className="flex gap-2"><button onClick={() => setNewReel({ ...newReel, mediaType: 'image' })} className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${newReel.mediaType === 'image' ? 'btn-primary' : 'bg-muted'}`}><ImageIcon size={16} className="inline mr-1"/> {tr("Image","صورة")}</button><button onClick={() => setNewReel({ ...newReel, mediaType: 'video' })} className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${newReel.mediaType === 'video' ? 'btn-primary' : 'bg-muted'}`}><Video size={16} className="inline mr-1"/> {tr("Video","فيديو")}</button></div>
          {newReel.mediaType === 'image' && <div className="space-y-2"><label className="text-sm font-semibold">{tr("Image","الصورة")}</label><input type="text" className={inp} value={newReel.image} onChange={(e) => setNewReel({ ...newReel, image: e.target.value })}/></div>}
          {newReel.mediaType === 'video' && <div className="space-y-3"><label className="text-sm font-semibold">{tr("Video URL","رابط الفيديو")}</label><div className="flex gap-2"><input type="url" className={`${inp} flex-1`} value={newReel.videoUrl} onChange={(e) => { const url = e.target.value; const parsed = parseVideoUrl(url); setNewReel({...newReel, videoUrl: url, videoProvider: parsed.provider, videoThumbnail: parsed.thumbnail, image: parsed.thumbnail || newReel.image }); }} /><button onClick={() => { const parsed = parseVideoUrl(newReel.videoUrl); setNewReel({...newReel, videoProvider: parsed.provider, videoThumbnail: parsed.thumbnail, image: parsed.thumbnail || newReel.image }); }} className="px-3 bg-primary text-white rounded-xl"><CheckCircle size={18} /></button></div></div>}
          <div className="space-y-2"><label className="text-sm font-semibold">{tr("Caption","الوصف")}</label><textarea className={`${inp} min-h-[60px] resize-none`} value={newReel.caption} onChange={(e) => setNewReel({ ...newReel, caption: e.target.value })}/></div>
          <button onClick={createReel} disabled={!newReel.image || (!newReel.caption && !newReel.captionAr)} className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"><Plus size={16}/> {tr("Create Post","إنشاء المنشور")}</button>
        </div>
      </div>
      <div className="space-y-3">
        {reels.map((reel: any) => (<div key={reel.id} className="card rounded-xl overflow-hidden flex"><div className="w-20 h-20 bg-muted">{reel.image && <img src={reel.image} className="w-full h-full object-cover" loading="lazy"/>}</div><div className="flex-1 p-3 min-w-0">{reel.pinned && <span className="badge px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] mb-1">📌 Pinned</span>}<p className="text-xs font-medium line-clamp-2">{reel.caption || reel.captionAr}</p></div><div className="flex flex-col gap-1 p-2 justify-center"><button onClick={() => togglePin(reel)} className="text-primary"><Pin size={13} className={reel.pinned ? "fill-primary" : ""}/></button><button onClick={() => deleteReel(reel)} className="text-destructive/60"><Trash2 size={13}/></button></div></div>))}
      </div>
    </div>
  );
};

const ApiTab = ({ tr, apiSettings, setApiSettings, showApiKey, setShowApiKey, saveApiSettings, savingApiKey }: any) => {
  return (
    <div className="space-y-4 page-enter">
      <div className="card-elevated rounded-2xl p-5 space-y-5">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Key size={18} className="text-primary"/> {tr("AI Provider Settings","إعدادات مزود الذكاء")}</h3>
        <div className="space-y-2"><label className="text-sm font-semibold">{tr("AI Provider","مزود الذكاء")}</label><select className={inp} value={apiSettings.aiProvider} onChange={(e) => setApiSettings((p: any) => ({...p, aiProvider: e.target.value}))}><option value="groq">Groq</option><option value="pollinations">Pollinations</option><option value="openai">OpenAI Compatible</option></select></div>
        <div className="space-y-2"><label className="text-sm font-semibold">{tr("API Key","المفتاح")}</label><div className="relative"><input type={showApiKey ? "text" : "password"} className={`${inp} w-full`} value={apiSettings.groqKey} onChange={(e) => setApiSettings((p: any) => ({...p, groqKey: e.target.value}))}/><button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showApiKey ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></div>
        <button onClick={saveApiSettings} disabled={savingApiKey} className="btn-primary w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"><Settings size={16}/> {savingApiKey ? tr("Saving…","جاري الحفظ…") : tr("Save Settings","حفظ الإعدادات")}</button>
      </div>
    </div>
  );
};

const SystemTab = ({ tr, db, fbRef, set, remove, push, get, lang }: any) => {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [r2Config, setR2Config] = useState<any>({ endpoint: "", accessKey: "", secretKey: "", bucket: "" });
  useEffect(() => { onValue(fbRef(db, "backups"), (snap: any) => { if (snap.exists()) { setBackups(Object.entries(snap.val()).map(([id, v]: [string, any]) => ({ id, ...v })).sort((a, b) => b.createdAt - a.createdAt)); } else setBackups([]); }); }, [db, fbRef]);
  const createBackup = async () => { setLoading(true); try { const snapshot: any = {}; const paths = ["menu", "users", "ai-config", "api-settings", "broadcast", "reels", "feedback", "homepage-banner"]; for (const path of paths) { const data = await smartGet(path); if (data) snapshot[path] = data; } const backupData = { data: snapshot, createdAt: Date.now(), name: `Backup ${new Date().toLocaleString()}`, size: `${Math.round(JSON.stringify(snapshot).length / 1024)} KB` }; await smartPush("backups", backupData); swalSuccess(tr("Backup created!", "تم إنشاء النسخة!")); } catch (err) { swalError(tr("Failed", "فشل")); } setLoading(false); };
  return (
    <div className="space-y-6 page-enter">
      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Archive size={18} className="text-primary"/> {tr("Backup & Restore","النسخ الاحتياطي والاستعادة")}</h3>
        <button onClick={createBackup} disabled={loading} className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2"><Download size={16}/> {tr("Create New Backup","إنشاء نسخة جديدة")}</button>
        <div className="space-y-2">{backups.map((b) => (<div key={b.id} className="card rounded-xl p-3 flex items-center justify-between"><div><p className="text-sm font-medium">{b.name}</p><p className="text-[10px] text-muted-foreground">{new Date(b.createdAt).toLocaleString()} • {b.size}</p></div><div className="flex gap-2"><button onClick={async () => { if (await swalConfirm(tr("Restore?", "استعادة؟"), tr("Overwrite current data?", "سيتم استبدال البيانات الحالية؟"), tr("Restore", "استعادة"), tr("Cancel", "إلغاء"))) { setLoading(true); try { const d = await smartGet(`backups/${b.id}/data`); if (d) for (const [p, c] of Object.entries(d)) await smartSet(p, c); swalSuccess(tr("Restored!", "تمت الاستعادة!")); } catch (e) { swalError(tr("Failed", "فشل")); } setLoading(false); } }} className="text-primary"><UploadCloud size={14}/></button><button onClick={() => smartRemove(`backups/${b.id}`)} className="text-destructive"><Trash2 size={14}/></button></div></div>))}</div>
      </div>
    </div>
  );
};

const TablesTab = ({ tr, activeTables, users }: any) => {
  return (
    <div className="space-y-4 page-enter">
      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between"><h3 className="font-bold text-foreground flex items-center gap-2"><LayoutGrid size={18} className="text-primary"/> {tr("Table Management","إدارة الطاولات")}</h3><button onClick={async () => { const num = prompt(tr("Table number:", "رقم الطاولة:")); if (num && /^\d+$/.test(num)) await smartSet(`tables/table_${num}`, { number: parseInt(num), status: "available", lastAssigned: null }); }} className="btn-primary px-4 py-2 rounded-xl flex items-center gap-2"><Plus size={16}/> {tr("Add Table","إضافة طاولة")}</button></div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {activeTables.map((t: any) => (
          <div key={t.id} className="relative card rounded-xl p-3 text-center border-2 border-transparent">
            <Armchair size={24} className={`mx-auto mb-1 ${t.status === "occupied" ? "text-green-600" : "text-muted-foreground"}`} />
            <p className="font-bold text-sm">T {t.number}</p>
            <p className="text-[10px] text-muted-foreground">{t.userCount || 0} users</p>
            <button onClick={async () => { if (await swalConfirm(tr("Remove?", "حذف؟"), tr("Clear table data?", "مسح بيانات الطاولة؟"), tr("Remove", "حذف"), tr("Cancel", "إلغاء"))) await smartRemove(`tables/${t.id}`); }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"><X size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Admin Component ───────────────────────────────────────────

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

  // Chat
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMsgs, setChatMsgs]         = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput]       = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  const [newBroadcast, setNewBroadcast] = useState<any>({ title: "", titleAr: "", message: "", messageAr: "", type: "info" as const, emoji: "📢" });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [apiSettings, setApiSettings] = useState<any>({ groqKey: "", aiProvider: "groq", openaiEndpoint: "", aiEnabled: true });
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [bannerContent, setBannerContent] = useState("");
  const [bannerBgColor, setBannerBgColor] = useState("#FF6B35");
  const [bannerTextColor, setBannerTextColor] = useState("#FFFFFF");
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [featureFlags, setFeatureFlags] = useState({ baristaEnabled: true, reelsEnabled: true, supportEnabled: true });
  const [savingFlag, setSavingFlag] = useState<string | null>(null);

  const activeTables = useMemo(() => {
    const tables = tablesRaw.map(t => {
      const userCount = users.filter(u => u.tableNumber === t.number).length;
      return { id: t.id, number: t.number, status: userCount > 0 ? "occupied" : "available", userCount, lastAt: t.lastAssigned || null };
    });
    return tables.sort((a, b) => a.number - b.number);
  }, [tablesRaw, users]);

  useEffect(() => {
    if (!authed) return;
    onValue(ref(db, "homepage-banner"), (snap) => { if (snap.exists()) { const d = snap.val(); setBannerContent(d.content || ""); setBannerBgColor(d.bgColor || "#FF6B35"); setBannerTextColor(d.textColor || "#FFFFFF"); setBannerEnabled(d.enabled !== false); } });
    onValue(ref(db, "feature-flags"), (snap) => { if (snap.exists()) { const d = snap.val(); setFeatureFlags({ baristaEnabled: d.baristaEnabled !== false, reelsEnabled: d.reelsEnabled !== false, supportEnabled: d.supportEnabled !== false }); } });
    onValue(ref(db, "menu"), (snap) => { if (snap.exists()) { const d = snap.val(); const res: MenuItem[] = []; Object.entries(d).forEach(([k, v]: any) => { if (v.price !== undefined) res.push({ id: k, ...v }); else Object.entries(v).forEach(([sk, sv]: any) => res.push({ id: sk, ...sv })); }); setMenu(res); } });
    onValue(ref(db, "users"), (snap) => { if (snap.exists()) setUsers(Object.entries(snap.val()).map(([uid, val]: any) => ({ uid, ...val })).sort((a, b) => (b.lastLoginAt || 0) - (a.lastLoginAt || 0))); });
    onValue(ref(db, "feedback"), (snap) => { if (snap.exists()) setFeedback(Object.entries(snap.val()).map(([id, f]: any) => ({ id, ...f })).sort((a, b) => b.createdAt - a.createdAt)); });
    onValue(ref(db, "support-chat"), (snap) => { if (snap.exists()) setChats(Object.entries(snap.val()).filter(([, v]: any) => v?.meta).map(([uid, v]: any) => ({ ...v.meta!, uid })).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0))); });
    onValue(ref(db, "broadcast"), (snap) => { if (snap.exists()) setBroadcasts(Object.entries(snap.val()).map(([id, b]: any) => ({ id, ...b })).sort((a, b) => b.createdAt - a.createdAt)); });
    onValue(ref(db, "reels"), (snap) => { if (snap.exists()) setReels(Object.entries(snap.val()).map(([id, r]: any) => ({ id, ...r })).sort((a, b) => (a.pinned ? -1 : b.pinned ? 1 : b.createdAt - a.createdAt))); });
    onValue(ref(db, "tables"), (snap) => { if (snap.exists()) setTablesRaw(Object.entries(snap.val()).map(([id, t]: any) => ({ id, ...t }))); });
    onValue(ref(db, "api-settings"), (snap) => { if (snap.exists()) { const d = snap.val(); setApiSettings({ groqKey: d.groqKey || "", aiProvider: d.aiProvider || "groq", openaiEndpoint: d.openaiEndpoint || "", aiEnabled: d.aiEnabled !== false }); } });
    return () => { ["homepage-banner", "feature-flags", "menu", "users", "feedback", "support-chat", "broadcast", "reels", "tables", "api-settings"].forEach(p => off(ref(db, p))); };
  }, [authed]);

  useEffect(() => {
    if (!selectedChat) return;
    onValue(ref(db, `support-chat/${selectedChat}/messages`), (snap) => { if (snap.exists()) setChatMsgs(Object.entries(snap.val()).map(([id, m]: any) => ({ id, ...m })).sort((a, b) => a.createdAt - b.createdAt)); });
    update(ref(db, `support-chat/${selectedChat}/meta`), { unreadAdmin: 0 });
    return () => off(ref(db, `support-chat/${selectedChat}/messages`));
  }, [selectedChat]);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;
  const login = () => { if (pin === ADMIN_PIN) { sessionStorage.setItem("azura-admin", "true"); setAuthed(true); } else setPinErr(tr("Wrong PIN", "رمز خاطئ")); };
  const sendReply = async () => { if (!chatInput.trim() || !selectedChat) return; await smartPush(`support-chat/${selectedChat}/messages`, { text: chatInput.trim(), sender: "admin", createdAt: Date.now(), readByAdmin: true }); await smartUpdate(`support-chat/${selectedChat}/meta`, { lastMessage: chatInput.trim(), lastAt: Date.now() }); setChatInput(""); };
  const toggleFeatureFlag = async (key: string, value: boolean) => { setSavingFlag(key); try { await update(ref(db, "feature-flags"), { [key]: value }); setFeatureFlags(p => ({ ...p, [key]: value })); } catch (e) { swalError(tr("Failed", "فشل")); } setSavingFlag(null); };
  const saveBanner = async () => { setSavingBanner(true); setBannerPreview(true); try { await set(ref(db, "homepage-banner"), { content: bannerContent, bgColor: bannerBgColor, textColor: bannerTextColor, enabled: bannerEnabled }); setTimeout(() => setBannerPreview(false), 2000); } catch (e) {} setSavingBanner(false); };
  const saveBannerEnabled = async (e: boolean) => { setBannerEnabled(e); await update(ref(db, "homepage-banner"), { enabled: e }); };
  const saveApiSettings = async () => { setSavingApiKey(true); await smartSet("api-settings", { groqKey: apiSettings.groqKey ? (apiSettings.groqKey.startsWith("gsk") ? encryptKey(apiSettings.groqKey) : apiSettings.groqKey) : "", aiProvider: apiSettings.aiProvider, openaiEndpoint: apiSettings.openaiEndpoint, aiEnabled: apiSettings.aiEnabled, updatedAt: Date.now() }); setSavingApiKey(false); };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(160deg,hsl(38,50%,90%),hsl(22,40%,82%))" }}>
        <div className="card-elevated rounded-3xl p-8 max-w-xs w-full text-center">
          <ShieldCheck size={48} className="mx-auto mb-4 text-primary" />
          <h1 className="text-xl font-bold mb-4">{tr("Admin Panel", "لوحة الإدارة")}</h1>
          <form onSubmit={(e) => { e.preventDefault(); login(); }}><input type="password" placeholder="PIN" value={pin} onChange={(e) => { setPin(e.target.value); setPinErr(""); }} className="w-full px-4 py-3 rounded-xl mb-3 text-center text-xl font-bold tracking-widest" /><button type="submit" className="btn-primary w-full py-3 rounded-xl font-bold">{tr("Login", "دخول")}</button></form>
          {pinErr && <p className="text-destructive text-xs mt-2 font-semibold">{pinErr}</p>}
        </div>
      </div>
    );
  }

  const unreadChats = chats.reduce((s, c) => s + (c.unreadAdmin || 0), 0);
  const TABS: any[] = [
    { id: "overview", icon: <LayoutDashboard size={14}/>, en: "Overview", ar: "الرئيسية" },
    { id: "menu", icon: <Plus size={14}/>, en: "Menu", ar: "القائمة" },
    { id: "features", icon: <ToggleRight size={14}/>, en: "Features", ar: "الميزات" },
    { id: "users", icon: <Users size={14}/>, en: "Users", ar: "المستخدمين" },
    { id: "chat", icon: <MessageCircle size={14}/>, en: "Chat", ar: "الدردشة", badge: unreadChats },
    { id: "reviews", icon: <Star size={14}/>, en: "Reviews", ar: "تقييمات", badge: feedback.filter(f=>!f.read).length },
    { id: "broadcast", icon: <Megaphone size={14}/>, en: "Broadcast", ar: "إشعارات" },
    { id: "reels", icon: <Film size={14}/>, en: "Reels", ar: "ريلز" },
    { id: "ai", icon: <Bot size={14}/>, en: "AI Assistant", ar: "المساعد" },
    { id: "api", icon: <Key size={14}/>, en: "API Settings", ar: "إعدادات" },
    { id: "system", icon: <Settings size={14}/>, en: "System", ar: "النظام" },
    { id: "tables", icon: <LayoutGrid size={14}/>, en: "Tables", ar: "الطاولات" },
  ];

  const avgRating = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : "—";
  const ratingDist = [5,4,3,2,1].map(r => ({ r, count: feedback.filter(f => f.rating === r).length }));
  const maxRatingCount = Math.max(...ratingDist.map(d => d.count), 1);

  return (
    <div className="min-h-screen bg-background pb-10" dir={isRTL ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 bg-primary text-white shadow-md">
        <button onClick={() => navigate("/menu")} className="opacity-80 hover:opacity-100"><ArrowLeft size={20}/></button>
        <span className="font-bold flex-1 text-sm">{tr("Azura Admin", "إدارة أزورا")}</span>
        <button onClick={() => { sessionStorage.removeItem("azura-admin"); setAuthed(false); }} className="text-xs opacity-80 hover:opacity-100">{tr("Sign out", "خروج")}</button>
      </header>
      <nav className="sticky top-[52px] z-40 px-3 py-2 bg-card border-b overflow-x-auto flex gap-1.5 scroll-hide shadow-sm">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelectedChat(null); }} className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-tight transition-all whitespace-nowrap ${tab === t.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
            {t.icon} {lang === "ar" ? t.ar : t.en}
            {t.badge > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold px-1">{t.badge}</span>}
          </button>
        ))}
      </nav>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Suspense fallback={<div className="py-20 text-center text-muted-foreground animate-pulse">{tr("Loading...", "جاري التحميل...")}</div>}>
          {tab === "overview" && <OverviewTab tr={tr} users={users} unreadChats={unreadChats} newReviewsCount={feedback.filter(f=>!f.read).length} />}
          {tab === "menu" && <MenuTab tr={tr} lang={lang} menu={menu} MENU_CATEGORIES={MENU_CATEGORIES} CAT_META={CAT_META} />}
          {tab === "features" && <FeaturesTab tr={tr} featureFlags={featureFlags} toggleFeatureFlag={toggleFeatureFlag} savingFlag={savingFlag} apiSettings={apiSettings} setApiSettings={setApiSettings} updateApiSettings={(d: any) => update(ref(db, "api-settings"), d)} />}
          {tab === "users" && <UsersTab tr={tr} users={users} deleteUser={async (uid: string, name: string) => { if (await swalConfirm(`Delete ${name}?`, "This is permanent.", "Delete", "Cancel")) await smartRemove(`users/${uid}`); }} formatDuration={(s: number) => `${Math.floor(s/60)}m`} />}
          {tab === "chat" && <ChatTab tr={tr} isRTL={isRTL} selectedChat={selectedChat} setSelectedChat={setSelectedChat} chats={chats} chatMsgs={chatMsgs} chatInput={chatInput} setChatInput={setChatInput} sendReply={sendReply} deleteChat={async (uid: string, name: string) => { if (await swalConfirm(`Delete chat with ${name}?`, "All messages will be deleted.", "Delete", "Cancel")) { if (selectedChat === uid) setSelectedChat(null); await smartRemove(`support-chat/${uid}`); } }} chatBottomRef={chatBottomRef} />}
          {tab === "reviews" && <ReviewsTab tr={tr} feedback={feedback} avgRating={avgRating} ratingDist={ratingDist} maxRatingCount={maxRatingCount} markFeedbackRead={(id: string) => smartUpdate(`feedback/${id}`, { read: true })} />}
          {tab === "broadcast" && <BroadcastTab tr={tr} newBroadcast={newBroadcast} setNewBroadcast={setNewBroadcast} sendBroadcast={async () => { setSendingBroadcast(true); await smartPush("broadcast", { ...newBroadcast, createdAt: Date.now() }); setNewBroadcast({ title: "", titleAr: "", message: "", messageAr: "", type: "info", emoji: "📢" }); setSendingBroadcast(false); }} sendingBroadcast={sendingBroadcast} bannerContent={bannerContent} setBannerContent={setBannerContent} bannerBgColor={bannerBgColor} setBannerBgColor={setBannerBgColor} bannerTextColor={bannerTextColor} setBannerTextColor={setBannerTextColor} bannerEnabled={bannerEnabled} saveBannerEnabled={saveBannerEnabled} saveBanner={saveBanner} savingBanner={savingBanner} bannerPreview={bannerPreview} broadcasts={broadcasts} deleteBroadcast={(id: string) => smartRemove(`broadcast/${id}`)} />}
          {tab === "reels" && <ReelsTab tr={tr} reels={reels} togglePin={(r: any) => smartUpdate(`reels/${r.id}`, { pinned: !r.pinned })} deleteReel={async (r: any) => { if (await swalConfirm("Delete Post?", "Delete this post?", "Delete", "Cancel")) await smartRemove(`reels/${r.id}`); }} />}
          {tab === "api" && <ApiTab tr={tr} apiSettings={apiSettings} setApiSettings={setApiSettings} showApiKey={showApiKey} setShowApiKey={setShowApiKey} saveApiSettings={saveApiSettings} savingApiKey={savingApiKey} />}
          {tab === "system" && <SystemTab tr={tr} db={db} fbRef={ref} set={set} remove={remove} push={push} get={get} lang={lang} />}
          {tab === "tables" && <TablesTab tr={tr} activeTables={activeTables} users={users} />}
          {tab === "ai" && <div className="page-enter"><AIAdminAssistant /></div>}
        </Suspense>
      </main>
    </div>
  );
}
