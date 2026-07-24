import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import { db, ref, onValue, off, update, set, push, remove, get, forceReseedMenu, mergeMenuIngredients } from "@/lib/firebase";
import { smartGet, smartSet, smartUpdate, smartRemove, smartPush, getDBMode, setDBMode, onModeChange } from "@/lib/dbWrapper";
import { useLang } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { encryptKey } from "@/lib/crypto";
import { swalSuccess, swalError, swalConfirm, swalLoading, swalClose } from "@/lib/swal";
import { testR2Connection, listR2Objects, downloadFromR2, uploadToR2 } from "@/lib/r2";
import {
  ShieldCheck, ArrowLeft, Plus, Trash2,
  Megaphone, Film, Key, Settings,
  RotateCcw, Save, Search, ChevronDown, Pencil, X, ImageIcon,
  AlertTriangle, Bot, LayoutDashboard, Users, ToggleRight, LayoutGrid,
  MessageCircle, Star, Sparkles, TrendingUp, Clock, Zap, MapPin, Coffee,
  User, Phone, MessageSquare, Armchair, UploadCloud, Download, Archive,
  Check, Eye, Smartphone, Globe, Info, Package, Filter, List, Heart, LucideIcon
} from "lucide-react";

// --- Handcrafted SVG Pixel Icons ---

const PixelIcon = ({ d, color = "currentColor", size = 16 }: { d: string, color?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
    <path d={d} fill={color} fillRule="evenodd" clipRule="evenodd" />
  </svg>
);

const PX_ICONS = {
  dashboard: "M2 2H7V7H2V2ZM9 2H14V5H9V2ZM2 9H7V14H2V9ZM9 7H14V14H9V7Z",
  plus: "M7 2H9V7H14V9H9V14H7V9H2V7H7V2Z",
  users: "M6 2H10V5H13V9H10V14H6V9H3V5H6V2ZM8 6H8V8H8V6Z",
  chat: "M2 2H14V11H8L4 14V11H2V2ZM4 4V6H12V4H4ZM4 8V9H10V8H4Z",
  star: "M8 2L10 6H14L11 9L12 14L8 12L4 14L5 9L2 6H6L8 2Z",
  broadcast: "M2 6H5L9 2V14L5 10H2V6ZM11 5V6H12V5H11ZM13 7V9H14V7H13ZM11 10V11H12V10H11Z",
  reels: "M2 2H14V14H2V2ZM4 4V6H6V4H4ZM10 4V6H12V4H10ZM4 8V10H12V8H4ZM4 12V13H12V12H4Z",
  api: "M2 8H4V10H2V8ZM6 8H10V10H6V8ZM12 8H14V10H12V8ZM4 6V4H12V6H4Z",
  system: "M7 2H9V4H7V2ZM11 3L12 5L10 6L9 4L11 3ZM14 7V9H12V7H14ZM13 11L11 12L10 10L12 9L13 11ZM9 14H7V12H9V14ZM5 13L4 11L6 10L7 12L5 13ZM2 9V7H4V9H2ZM3 5L5 4L6 6L4 7L3 5Z",
  sparkles: "M8 2H9V4H8V2ZM12 4L13 5L11 7L10 6L12 4ZM14 8V9H12V8H14ZM12 12L10 11L11 9L13 10L12 12ZM8 14H7V12H8V14ZM4 12L3 11L5 9L6 10L4 12ZM2 8V7H4V8H2ZM4 4L6 5L5 7L3 6L4 4Z",
  menu: "M2 2H14V4H2V2ZM2 6H14V8H2V6ZM2 10H14V12H2V10ZM2 14H14V15H2V14Z",
  features: "M2 6H14V10H2V6ZM4 8H6V8H4V8ZM10 8H12V8H10V8Z"
};

import { VideoProvider } from "@/lib/videoProviders";
import { compressToBase64, base64SizeKB } from "@/lib/imageUtils";

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

// --- Components ---

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
      swalError("Please select a valid image file (JPG, PNG, WebP…).");
      return;
    }
    setCompressing(true);
    try {
      const b64 = await compressToBase64(file, 600, 0.78);
      if (b64 && b64.startsWith("data:image/")) {
        onChange(b64);
      } else {
        throw new Error("Invalid base64 result");
      }
    } catch (err) {
      console.error("Compression error:", err);
      swalError("Could not compress image. The file might be corrupted or too large. Try a different file.");
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
        <input type="text" className="input-field flex-1 text-[11px] py-2 px-3" placeholder="…or paste image URL" value={isBase64 ? "" : value || ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

const OverviewTab = ({ tr, users, unreadChats, newReviewsCount }: { tr: any, users: any[], unreadChats: number, newReviewsCount: number }) => {
  const stats = useMemo(() => {
    const now = Date.now();
    const thirtyMins = 30 * 60 * 1000;
    const activeNow = users.filter(u => u.lastLoginAt && (now - u.lastLoginAt) < thirtyMins).length;
    const returning = users.filter(u => u.loginCount > 1).length;
    const returningRate = users.length ? Math.round((returning / users.length) * 100) : 0;
    return { activeNow, returningRate };
  }, [users]);
  return (
    <div className="space-y-4 page-enter">
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: PX_ICONS.sparkles, label: tr("Active Now","نشط الآن"), value: stats.activeNow, color: "text-primary" },
          { icon: PX_ICONS.system, label: tr("Retention Rate","معدل العودة"), value: `${stats.returningRate}%`, color: "text-success" },
          { icon: PX_ICONS.chat, label: tr("Unread Messages","رسائل جديدة"), value: unreadChats, color: "text-info" },
          { icon: PX_ICONS.star, label: tr("New Reviews","تقييمات جديدة"), value: newReviewsCount, color: "text-warning" },
        ].map((s) => (
          <div key={s.label} className="pixel-card p-4 text-center active:scale-95 transition-transform">
            <div className="flex justify-center mb-2">
               <PixelIcon d={s.icon} size={20} color={s.color === 'text-primary' ? '#F28C28' : undefined} />
            </div>
            <p className={`pixel-font text-xl font-black ${s.color} leading-tight`}>{s.value}</p>
            <p className="pixel-font text-[8px] text-foreground/60 font-bold uppercase mt-2 tracking-tighter">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="pixel-card pixel-border-bronze p-5">
        <h3 className="pixel-font text-[10px] text-foreground flex items-center gap-2 mb-4"><PixelIcon d={PX_ICONS.dashboard} size={14}/> {tr("Business Insights","رؤى العمل")}</h3>
        <div className="space-y-4">
           <div className="flex items-center justify-between p-4 pixel-border-paper bg-opacity-50"><div className="flex items-center gap-3"><PixelIcon d={PX_ICONS.users} size={14}/><p className="pixel-font text-[9px]">{tr("Total CRM Records", "إجمالي سجلات العملاء")}</p></div><p className="pixel-font text-sm font-black text-primary">{users.length}</p></div>
           <div className="flex items-center justify-between p-4 pixel-border-paper bg-opacity-50"><div className="flex items-center gap-3"><PixelIcon d={PX_ICONS.sparkles} size={14} color="#F28C28"/><p className="pixel-font text-[9px]">{tr("High Value Clients", "عملاء مميزون")}</p></div><p className="pixel-font text-sm font-black text-primary">{users.filter(u => u.loginCount >= 3).length}</p></div>
        </div>
      </div>
    </div>
  );
};

const MenuTab = ({ tr, lang, menu, MENU_CATEGORIES, CAT_META }: { tr: any, lang: string, menu: MenuItem[], MENU_CATEGORIES: string[], CAT_META: any }) => {
  const [menuSearch, setMenuSearch] = useState("");
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", nameAr: "", price: "", category: "coffee", image: "", description: "", descriptionAr: "", ingredients: "", ingredientsAr: "", available: true });
  const [savingItem, setSavingItem] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["coffee", "hot_drinks", "recommended"]));
  const [menuEdits, setMenuEdits] = useState<Record<string, Partial<MenuItem>>>({});
  const [savingMenuId, setSavingMenuId] = useState<string | null>(null);
  const groupedMenu = useMemo(() => {
    const filtered = menu.filter(item => {
      const matchesSearch = !menuSearch || item.name?.toLowerCase().includes(menuSearch.toLowerCase()) || item.nameAr?.includes(menuSearch);
      const matchesCategory = menuCategoryFilter === "all" || item.category === menuCategoryFilter;
      return matchesSearch && matchesCategory;
    });
    const groups: Record<string, MenuItem[]> = {};
    const recs = filtered.filter(i => i.recommended);
    if (recs.length > 0) groups["recommended"] = recs;
    filtered.forEach(item => {
      const cat = item.category || "other";
      if (!groups[cat]) groups[cat] = [];
      if (menuCategoryFilter === "all" && item.recommended) return;
      groups[cat].push(item);
    });
    return groups;
  }, [menu, menuSearch, menuCategoryFilter]);
  const inp = "input-field px-3 py-2.5 text-sm";
  const lbl = "text-[10px] font-black uppercase mb-1 block";
  return (
    <div className="space-y-6 page-enter">
      <div className="pixel-card p-5 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="pixel-font text-[10px] text-foreground flex items-center gap-2 uppercase tracking-tighter"><PixelIcon d={PX_ICONS.plus} size={14}/> {tr("Menu Management","إدارة القائمة")}</h3>
          <div className="w-full flex gap-3 mt-2">
            <div className="relative flex-1">
              <input type="text" placeholder={tr("Search items...", "البحث...")} value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} className="pixel-input w-full pl-3 pr-4 py-3 pixel-font text-[9px] uppercase" />
            </div>
            <select value={menuCategoryFilter} onChange={(e) => setMenuCategoryFilter(e.target.value)} className="pixel-input px-3 py-3 pixel-font text-[8px] uppercase appearance-none">
              <option value="all">{tr("All Categories", "الأقسام")}</option>
              {MENU_CATEGORIES.map(c => <option key={c} value={c}>{CAT_META[c] ? tr(CAT_META[c].en, CAT_META[c].ar) : c}</option>)}
            </select>
          </div>
          <div className="flex gap-3 flex-wrap w-full">
            <button onClick={async () => { if (!confirm(tr("Merge menu?", "دمج القائمة؟"))) return; swalLoading(tr("Merging…", "جار الدمج…")); await mergeMenuIngredients(); swalClose(); swalSuccess(tr("Merged!", "تم الدمج!")); }} className="flex-1 pixel-btn pixel-btn-secondary text-[8px]"><RotateCcw size={12}/> {tr("Merge", "دمج")}</button>
            <button onClick={async () => { if (!confirm(tr("⚠️ Reseed entire menu?", "⚠️ إعادة رفع القائمة بالكامل؟"))) return; swalLoading(tr("Reseeding…", "جار الرفع…")); await forceReseedMenu(); swalClose(); swalSuccess(tr("Reseeded!", "تم الرفع!")); }} className="flex-1 pixel-btn pixel-btn-secondary text-[8px]"><UploadCloud size={12}/> {tr("Reseed", "رفع")}</button>
            <button onClick={() => setShowAddForm(v => !v)} className={`flex-1 pixel-btn ${showAddForm ? "pixel-btn-secondary" : "pixel-btn-primary"} text-[8px]`}>{showAddForm ? tr("Cancel", "إلغاء") : tr("Add", "إضافة")}</button>
          </div>
        </div>
        {showAddForm && (
          <div className="pixel-card pixel-border-paper p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>{tr("Name (EN)","الاسم EN")}</label><input className="pixel-input w-full" placeholder="Caramel Latte" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className={lbl}>{tr("Name (AR)","الاسم AR")}</label><input className="pixel-input w-full" dir="rtl" placeholder="لاتيه كراميل" value={addForm.nameAr} onChange={e => setAddForm(f => ({ ...f, nameAr: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>{tr("Price (EGP)","السعر")}</label><input type="number" className="pixel-input w-full" placeholder="0" value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><label className={lbl}>{tr("Category","الفئة")}</label><select className="pixel-input w-full" value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}>{MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <ImagePicker label={tr("Photo", "الصورة")} value={addForm.image} onChange={v => setAddForm(f => ({ ...f, image: v }))} />
            <button disabled={savingItem || !addForm.name || !addForm.price} onClick={async () => { setSavingItem(true); const id = `${addForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36)}`; await smartSet(`menu/${addForm.category}/${id}`, { ...addForm, price: Number(addForm.price) }); setAddForm({ name:"", nameAr:"", price:"", category:"coffee", image:"", description:"", descriptionAr:"", ingredients:"", ingredientsAr:"", available:true }); setShowAddForm(false); setSavingItem(false); swalSuccess(tr("Added!", "تمت الإضافة!")); }} className="pixel-btn pixel-btn-primary w-full py-4 text-[10px] uppercase font-black">{savingItem ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <Save size={14}/>} {tr("Save Item","حفظ الصنف")}</button>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {Object.entries(groupedMenu).map(([catId, catItems]) => {
          const isExpanded = expandedCats.has(catId);
          const meta = CAT_META[catId] || { emoji: "📦", en: catId, ar: catId };
          const itemsList = catItems as MenuItem[];
          return (
            <div key={catId} className="space-y-2">
              <button onClick={() => { const next = new Set(expandedCats); if (next.has(catId)) next.delete(catId); else next.add(catId); setExpandedCats(next); }} className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/30 pixel-border-paper bg-opacity-20 transition-colors group"><div className="flex items-center gap-3"><span className="text-xl grayscale group-hover:grayscale-0 transition-all">{meta.emoji}</span><span className="pixel-font text-[10px] uppercase font-black tracking-tighter text-foreground">{tr(meta.en, meta.ar)}</span><span className="pixel-font text-[8px] px-2 py-0.5 pixel-border-wood bg-opacity-50 text-secondary">{itemsList.length}</span></div><PixelIcon d={PX_ICONS.plus} size={14} color="#6F4E37" /></button>
              {isExpanded && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                  {itemsList.map((item: MenuItem) => {
                    const isSelected = selectedMenuItemId === item.id;
                    const edits = menuEdits[item.id] || {};
                    return (
                      <div key={item.id} className="contents">
                        <div onClick={() => setSelectedMenuItemId(isSelected ? null : item.id)} className={`relative group cursor-pointer pixel-card pixel-border-paper overflow-hidden transition-all duration-200 ${isSelected ? "pixel-border-bronze pixel-shadow" : ""}`}>
                          <div className="h-28 relative overflow-hidden bg-muted/20 border-b-2 pixel-border-paper border-t-0 border-x-0">{item.image ? <img src={item.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" loading="lazy" style={{ imageRendering: 'pixelated' }}/> : <div className="w-full h-full flex items-center justify-center text-4xl opacity-10 grayscale">{meta.emoji}</div>}</div>
                          <div className="p-3"><p className="pixel-font text-[10px] text-foreground truncate font-black">{lang === "ar" ? (item.nameAr || item.name) : item.name}</p><p className="pixel-font text-[9px] font-black text-primary mt-2">{item.price} EGP</p></div>
                        </div>
                        {isSelected && (
                          <div className="col-span-2 pixel-card pixel-border-wood p-6 bg-card mt-2 mb-4">
                            <div className="space-y-5">
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className={lbl}>Name (EN)</label><input className="pixel-input w-full" value={edits.name || item.name} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], name: e.target.value } }))} /></div>
                                <div><label className={lbl}>Name (AR)</label><input className="pixel-input w-full" dir="rtl" value={edits.nameAr || item.nameAr} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], nameAr: e.target.value } }))} /></div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className={lbl}>Price (EGP)</label><input type="number" className="pixel-input w-full" value={edits.price || item.price} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], price: Number(e.target.value) } }))} /></div>
                                <div><label className={lbl}>Category</label><select className="pixel-input w-full" value={edits.category || item.category} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], category: e.target.value } }))}>{MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className={lbl}>Description (EN)</label><textarea className="pixel-input w-full h-24" value={edits.description || item.description} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], description: e.target.value } }))} /></div>
                                <div><label className={lbl}>Description (AR)</label><textarea className="pixel-input w-full h-24" dir="rtl" value={edits.descriptionAr || item.descriptionAr} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], descriptionAr: e.target.value } }))} /></div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className={lbl}>Ingredients (EN)</label><textarea className="pixel-input w-full h-24" value={edits.ingredients || item.ingredients} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], ingredients: e.target.value } }))} /></div>
                                <div><label className={lbl}>Ingredients (AR)</label><textarea className="pixel-input w-full h-24" dir="rtl" value={edits.ingredientsAr || item.ingredientsAr} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], ingredientsAr: e.target.value } }))} /></div>
                              </div>
                              <ImagePicker label={tr("Photo", "الصورة")} value={edits.image || item.image} onChange={v => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], image: v } }))} />
                              <div className="flex gap-3 ms-auto pt-4">
                                <button onClick={async () => { if (await swalConfirm(tr("Delete?", "حذف؟"), tr("Permanent.", "نهائي."), tr("Delete", "حذف"), tr("Cancel", "إلغاء"))) { await smartRemove(`menu/${item.category}/${item.id}`); setSelectedMenuItemId(null); swalSuccess(tr("Deleted!", "تم الحذف!")); } }} className="pixel-btn pixel-btn-secondary p-3"><Trash2 size={16} /></button>
                                <button disabled={savingMenuId === item.id || !Object.keys(edits).length} onClick={async () => { setSavingMenuId(item.id); await smartUpdate(`menu/${item.category}/${item.id}`, edits); setMenuEdits(prev => { const n = { ...prev }; delete n[item.id]; return n; }); swalSuccess(tr("Saved!", "تم الحفظ!")); setSelectedMenuItemId(null); setSavingMenuId(null); }} className="pixel-btn pixel-btn-primary flex-1 py-4 text-[10px] font-black uppercase">{savingMenuId === item.id ? <Bot className="animate-spin" size={16}/> : <Save size={16}/>} {tr("Save Changes", "حفظ التعديلات")}</button>
                              </div>
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

const FeaturesTab = ({ tr, featureFlags, toggleFeatureFlag, savingFlag }: { tr: any, featureFlags: any, toggleFeatureFlag: any, savingFlag: string | null }) => (
  <div className="space-y-4 page-enter">
    <div className="card-elevated rounded-2xl p-5 space-y-4">
      <h3 className="font-bold text-foreground flex items-center gap-2"><ToggleRight size={18} className="text-primary"/> {tr("Feature Controls","التحكم في الميزات")}</h3>
      {[{ id: "baristaEnabled", icon: <Sparkles size={16}/>, title: tr("AI Barista", "الباريستا الذكي") }, { id: "reelsEnabled", icon: <Film size={16}/>, title: tr("Reels Hub", "مركز الريلز") }, { id: "supportEnabled", icon: <MessageCircle size={16}/>, title: tr("Support Chat", "دردشة الدعم") }].map((f) => (
        <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{f.icon}</div><p className="text-xs font-bold">{f.title}</p></div>
          <button onClick={() => toggleFeatureFlag(f.id, !featureFlags[f.id as keyof typeof featureFlags])} disabled={savingFlag === f.id} className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${featureFlags[f.id as keyof typeof featureFlags] ? "bg-green-500" : "bg-muted-foreground/30"}`}><div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${featureFlags[f.id as keyof typeof featureFlags] ? "translate-x-6" : ""}`} /></button>
        </div>
      ))}
    </div>
  </div>
);

const UsersTab = ({ tr, users, deleteUser, formatDuration }: { tr: any, users: any[], deleteUser: any, formatDuration: any }) => (
  <div className="space-y-4 page-enter">
    <div className="card-elevated rounded-2xl p-5 space-y-2"><h3 className="font-bold text-foreground flex items-center gap-2"><Users size={18} className="text-primary"/> {tr("User Management","إدارة المستخدمين")}</h3></div>
    <div className="space-y-4">
      {users.map((u) => (
        <div key={u.uid} className="pixel-card pixel-border-paper p-4 flex items-center gap-4 group active:scale-[0.99] transition-transform">
          <div className="w-12 h-12 pixel-border-wood flex items-center justify-center text-secondary font-black text-lg pixel-font">{u.name?.[0]?.toUpperCase() || "?"}</div>
          <div className="flex-1 min-w-0"><p className="pixel-font text-sm text-foreground truncate">{u.name || "Guest"}</p><div className="flex items-center gap-4 mt-2"><span className="pixel-font text-[8px] text-primary">visits: {u.loginCount || 1}</span><span className="pixel-font text-[8px] text-secondary">time: {formatDuration(u.totalUsageTime || 0)}</span></div></div>
          <button onClick={() => deleteUser(u.uid)} className="pixel-btn pixel-btn-secondary p-2 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
        </div>
      ))}
    </div>
  </div>
);

const ChatTab = ({ tr, isRTL, selectedChat, setSelectedChat, chats, chatMsgs, chatInput, setChatInput, sendReply, deleteChat, chatBottomRef }: { tr: any, isRTL: boolean, selectedChat: string | null, setSelectedChat: any, chats: ChatSession[], chatMsgs: ChatMsg[], chatInput: string, setChatInput: any, sendReply: any, deleteChat: any, chatBottomRef: any }) => (
  <div className="flex flex-col h-[70dvh] page-enter">
    {selectedChat ? (
      <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-border/40 bg-card/50">
        <div className="p-3 bg-primary text-white flex items-center gap-3"><button onClick={() => setSelectedChat(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><ArrowLeft size={18}/></button><div className="flex-1 min-w-0"><p className="font-bold text-sm truncate">{chats.find(c => c.uid === selectedChat)?.userName || "Chat"}</p></div><button onClick={() => deleteChat(selectedChat)} className="p-1.5 hover:bg-white/20 rounded-full"><Trash2 size={16}/></button></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-hide">
          {chatMsgs.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${m.sender === "admin" ? "bg-primary text-white rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"}`}><p className="whitespace-pre-wrap leading-relaxed">{m.text}</p></div></div>
          ))}
          <div ref={chatBottomRef} />
        </div>
        <div className="p-3 bg-background/50 border-t border-border/40 flex gap-2"><input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()} placeholder={tr("Type a reply...", "اكتب رداً...")} className="flex-1 bg-muted rounded-xl px-4 py-2 text-sm outline-none" /><button onClick={sendReply} className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center transition-transform active:scale-95"><Plus size={18}/></button></div>
      </div>
    ) : (
      <div className="space-y-2 overflow-y-auto pr-1">
        {chats.map((c) => (
          <div key={c.uid} onClick={() => setSelectedChat(c.uid)} className="card rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-all relative">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">{c.userName?.[0]?.toUpperCase() || "?"}</div>
            <div className="flex-1 min-w-0"><div className="flex items-center justify-between"><p className="font-bold text-sm truncate">{c.userName}</p><p className="text-[10px] text-muted-foreground">{new Date(c.lastAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</p></div><p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMessage}</p></div>
            {(c.unreadAdmin || 0) > 0 && <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />}
          </div>
        ))}
      </div>
    )}
  </div>
);

const BroadcastTab = ({ tr, newBroadcast, setNewBroadcast, sendBroadcast, sendingBroadcast, bannerContent, setBannerContent, bannerBgColor, setBannerBgColor, bannerTextColor, setBannerTextColor, bannerEnabled, saveBannerEnabled, saveBanner, savingBanner, broadcasts, deleteBroadcast }: { tr: any, newBroadcast: any, setNewBroadcast: any, sendBroadcast: any, sendingBroadcast: boolean, bannerContent: string, setBannerContent: any, bannerBgColor: string, setBannerBgColor: any, bannerTextColor: string, setBannerTextColor: any, bannerEnabled: boolean, saveBannerEnabled: any, saveBanner: any, savingBanner: boolean, broadcasts: Broadcast[], deleteBroadcast: any }) => (
  <div className="space-y-6 page-enter">
    <div className="card-elevated rounded-2xl p-5 space-y-4 border-l-4 border-primary">
      <h3 className="font-bold text-foreground flex items-center gap-2"><Megaphone size={18} className="text-primary"/> {tr("Global Broadcast","إرسال إشعار عام")}</h3>
      <div className="grid grid-cols-2 gap-3"><input className="input-field px-3 py-2.5 text-sm" placeholder="Title (EN)" value={newBroadcast.title} onChange={e => setNewBroadcast({ ...newBroadcast, title: e.target.value })} /><input className="input-field px-3 py-2.5 text-sm" dir="rtl" placeholder="Title (AR)" value={newBroadcast.titleAr} onChange={e => setNewBroadcast({ ...newBroadcast, titleAr: e.target.value })} /></div>
      <textarea className="input-field px-3 py-2.5 text-sm min-h-[80px]" placeholder="Message (EN)" value={newBroadcast.message} onChange={e => setNewBroadcast({ ...newBroadcast, message: e.target.value })} />
      <button onClick={sendBroadcast} disabled={sendingBroadcast || !newBroadcast.title} className="btn-primary w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">{sendingBroadcast ? <RotateCcw size={16} className="animate-spin"/> : <Plus size={16}/>} {tr("Send Now", "إرسال الآن")}</button>
    </div>
    <div className="card-elevated rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between"><h3 className="font-bold text-foreground flex items-center gap-2"><LayoutDashboard size={18} className="text-primary"/> {tr("Homepage Banner","بانر الصفحة الرئيسية")}</h3><button onClick={() => saveBannerEnabled(!bannerEnabled)} className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${bannerEnabled ? "bg-green-500" : "bg-muted-foreground/30"}`}><div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${bannerEnabled ? "translate-x-6" : ""}`} /></button></div>
      <textarea className="input-field px-3 py-2.5 text-sm min-h-[60px]" placeholder="Banner content..." value={bannerContent} onChange={e => setBannerContent(e.target.value)} />
      <button onClick={saveBanner} disabled={savingBanner} className="btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">{savingBanner ? <RotateCcw size={16} className="animate-spin"/> : <Save size={16}/>} {tr("Update Banner", "تحديث البانر")}</button>
    </div>
  </div>
);

const SystemTab = ({ tr }: { tr: any }) => {
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [r2Config, setR2Config] = useState({ endpoint: "", accessKey: "", secretKey: "", bucket: "" });
  const [r2Loading, setR2Loading] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, "backups"), (s) => setBackups(Object.entries(s.val() || {}).map(([id, v]: any) => ({ id, ...v })).sort((a,b) => b.date-a.date)));
    smartGet("r2-config").then(cfg => cfg && setR2Config(cfg));
    return () => off(ref(db, "backups"));
  }, []);

  const createBackup = async () => {
    setLoading(true);
    try {
      const paths = ["menu", "users", "ai-config", "api-settings", "broadcast", "reels", "feedback", "homepage-banner", "feature-flags"];
      const data: any = {};
      for (const p of paths) {
        const snap = await get(ref(db, p));
        if (snap.exists()) data[p] = snap.val();
      }
      const id = `backup_${Date.now()}`;
      await smartSet(`backups/${id}`, { id, name: `Manual Backup ${new Date().toLocaleDateString()}`, date: Date.now(), data });
      swalSuccess(tr("Backup created!", "تم إنشاء نسخة احتياطية!"));
    } catch (e) { swalError(tr("Failed", "فشل")); }
    setLoading(false);
  };

  const handleGlobalSync = async () => {
    if (!await swalConfirm(tr("Global Sync", "مزامنة شاملة"), tr("Overwrite Firebase with R2 data?", "استبدال بيانات Firebase ببيانات R2؟"))) return;
    setLoading(true);
    try {
      const objects = await listR2Objects();
      for (const obj of objects) {
        if (!obj.Key?.endsWith(".json")) continue;
        const data = await downloadFromR2(obj.Key);
        await set(ref(db, obj.Key.replace(".json", "")), data);
      }
      swalSuccess(tr("Sync Complete!", "تمت المزامنة!"));
    } catch (e) { swalError("Sync failed"); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 page-enter pb-10">
      <div className="card-elevated rounded-2xl p-5 space-y-4 border-l-4 border-primary">
        <h3 className="font-bold flex items-center gap-2"><UploadCloud size={18}/> {tr("R2 Fallback Config", "إعدادات الطوارئ R2")}</h3>
        <input className="input-field px-3 py-2 text-sm" placeholder="Endpoint" value={r2Config.endpoint} onChange={e => setR2Config({...r2Config, endpoint: e.target.value})}/>
        <div className="grid grid-cols-2 gap-3">
          <input className="input-field px-3 py-2 text-sm" type="password" placeholder="Access Key" value={r2Config.accessKey} onChange={e => setR2Config({...r2Config, accessKey: e.target.value})}/>
          <input className="input-field px-3 py-2 text-sm" type="password" placeholder="Secret Key" value={r2Config.secretKey} onChange={e => setR2Config({...r2Config, secretKey: e.target.value})}/>
        </div>
        <div className="flex gap-2">
          <button onClick={async () => { setR2Loading(true); try { await testR2Connection(r2Config); swalSuccess("Connected!"); } catch(e){ swalError("Failed"); } setR2Loading(false); }} className="flex-1 btn-secondary py-2 rounded-xl text-xs font-bold">Test</button>
          <button onClick={async () => { await smartSet("r2-config", r2Config); swalSuccess("Saved!"); }} className="flex-1 btn-primary py-2 rounded-xl text-xs font-bold">Save</button>
        </div>
        <button onClick={handleGlobalSync} className="w-full py-3 bg-orange-500 text-white rounded-xl text-xs font-bold mt-2">Sync R2 to Firebase</button>
      </div>

      <div className="card-elevated rounded-2xl p-5 space-y-4 border-l-4 border-blue-500">
        <h3 className="font-bold flex items-center gap-2"><Archive size={18}/> {tr("Backup & Restore", "النسخ الاحتياطي")}</h3>
        <button onClick={createBackup} disabled={loading} className="btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Download size={16}/> {tr("Create New Backup", "إنشاء نسخة احتياطية")}</button>
        <div className="space-y-2">
          {backups.map(b => (
            <div key={b.id} className="card rounded-xl p-3 flex items-center justify-between">
              <div><p className="text-sm font-bold">{b.name}</p><p className="text-[10px] text-muted-foreground">{new Date(b.date).toLocaleString()}</p></div>
              <div className="flex gap-2">
                <button onClick={async () => { setLoading(true); try { for(const [p, v] of Object.entries(b.data)) await set(ref(db, p), v); swalSuccess("Restored!"); } catch(e){ swalError("Failed"); } setLoading(false); }} className="p-2 bg-primary/10 text-primary rounded-lg"><UploadCloud size={14}/></button>
                <button onClick={() => smartRemove(`backups/${b.id}`)} className="p-2 bg-destructive/10 text-destructive rounded-lg"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-elevated rounded-2xl p-5 border-l-4 border-destructive space-y-4">
        <h3 className="font-bold text-destructive flex items-center gap-2"><RotateCcw size={18}/> {tr("Critical Actions","عمليات خطيرة")}</h3>
        <button onClick={async () => { if (await swalConfirm(tr("Wipe all data?", "مسح كل البيانات؟"), tr("This cannot be undone.", "لا يمكن التراجع."))) { ["menu", "users", "feedback", "support-chat", "broadcast", "reels", "tables", "feature-flags", "homepage-banner", "conversations"].forEach(p => remove(ref(db, p))); swalSuccess("System reset!"); } }} className="w-full py-3 rounded-xl bg-destructive text-white font-bold flex items-center justify-center gap-2"><Trash2 size={16}/> {tr("Reset All Data","إعادة تعيين كل البيانات")}</button>
      </div>
    </div>
  );
};

const BaristaTab = ({ tr }: { tr: any }) => {
  const [config, setConfig] = useState({ baristaName: "", baristaAvatar: "", instagram: "", cafeName: "", cafeLocation: "", cafeHours: "", cafePhone: "", systemPrompt: "", systemPromptAr: "", greeting: "", greetingAr: "" });
  const [apiSettings, setApiSettings] = useState({ aiEnabled: true, groqKey: "", menuNode: "menu" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const cfgRef = ref(db, "ai-config");
    const apiRef = ref(db, "api-settings");
    onValue(cfgRef, (snap) => snap.exists() && setConfig(prev => ({ ...prev, ...snap.val() })));
    onValue(apiRef, (snap) => { if (snap.exists()) setApiSettings(snap.val()); setLoading(false); });
    return () => { off(cfgRef); off(apiRef); };
  }, []);
  const handleSave = async () => { setSaving(true); try { await smartSet("ai-config", config); await smartSet("api-settings", apiSettings); swalSuccess(tr("Saved!", "تم الحفظ!")); } catch (err) { swalError(tr("Error", "خطأ")); } setSaving(false); };
  const inp = "input-field px-3 py-2 text-sm w-full";
  const lbl = "text-[11px] font-bold text-muted-foreground uppercase block mb-1";
  if (loading) return <div className="py-20 text-center animate-pulse">{tr("Loading...", "جاري التحميل...")}</div>;
  return (
    <div className="space-y-6 page-enter pb-10">
      <div className="card-elevated rounded-2xl p-5 flex items-center justify-between border-l-4 border-amber-500">
        <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${apiSettings.aiEnabled ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}><Bot size={20} /></div><div><h3 className="font-bold text-sm">{tr("AI Status", "حالة الذكاء")}</h3><p className="text-[10px] text-muted-foreground">{apiSettings.aiEnabled ? tr("Active", "نشط") : tr("Disabled", "معطل")}</p></div></div>
        <button onClick={() => setApiSettings(p => ({ ...p, aiEnabled: !p.aiEnabled }))} className={`px-4 py-2 rounded-xl text-xs font-bold ${apiSettings.aiEnabled ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>{apiSettings.aiEnabled ? tr("Disable", "تعطيل") : tr("Enable", "تفعيل")}</button>
      </div>
      <div className="card-elevated rounded-2xl p-5 space-y-4 border-l-4 border-orange-500"><div className="flex items-center gap-2 mb-2"><Sparkles size={18} className="text-orange-500"/><h3 className="font-bold text-foreground">{tr("Menu Data Source", "مصدر القائمة")}</h3></div><input className={inp} value={apiSettings.menuNode || "menu"} onChange={e => setApiSettings({ ...apiSettings, menuNode: e.target.value })} placeholder="e.g. menu" /></div>
      <div className="card-elevated rounded-2xl p-5 space-y-4 border-l-4 border-primary">
        <div className="flex items-center gap-2 mb-2"><User size={18} className="text-primary"/><h3 className="font-bold text-foreground">{tr("Persona", "الشخصية")}</h3></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lbl}>{tr("Name", "الاسم")}</label><input className={inp} value={config.baristaName} onChange={e => setConfig({...config, baristaName: e.target.value})} /></div>
          <div><label className={lbl}>{tr("Instagram", "انستجرام")}</label><input className={inp} value={config.instagram} onChange={e => setConfig({...config, instagram: e.target.value})} /></div>
        </div>
        <div><label className={lbl}>{tr("Avatar URL", "رابط الصورة")}</label><input className={inp} value={config.baristaAvatar} onChange={e => setConfig({...config, baristaAvatar: e.target.value})} /></div>
      </div>
      <div className="card-elevated rounded-2xl p-5 space-y-4 border-l-4 border-purple-500">
        <div className="flex items-center gap-2 mb-2"><MessageSquare size={18} className="text-purple-500"/><h3 className="font-bold text-foreground">{tr("Greetings", "الترحيب")}</h3></div>
        <div className="space-y-4">
          <div><label className={lbl}>Greeting (EN)</label><textarea className={`${inp} h-20`} value={config.greeting} onChange={e => setConfig({...config, greeting: e.target.value})} /></div>
          <div><label className={lbl}>Greeting (AR)</label><textarea className={`${inp} h-20`} dir="rtl" value={config.greetingAr} onChange={e => setConfig({...config, greetingAr: e.target.value})} /></div>
        </div>
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 sticky bottom-4">
        {saving ? <Bot className="animate-spin" size={18}/> : <Save size={18}/>} {tr("Save Barista Config", "حفظ الإعدادات")}
      </button>
    </div>
  );
};

const ReviewsTab = ({ tr, feedback, avgRating, ratingDist, maxRatingCount, markFeedbackRead }: any) => (
  <div className="space-y-8 page-enter">
    <div className="pixel-card pixel-border-wood p-8 text-center">
      <div className="flex justify-center mb-4 text-warning">
        <PixelIcon d={PX_ICONS.star} size={32} />
      </div>
      <h2 className="pixel-font text-5xl font-black text-primary pixel-text-shadow">{avgRating}</h2>
      <p className="pixel-font text-[10px] text-foreground/60 font-bold uppercase mt-4 tracking-tighter">{tr("Average Customer Rating", "متوسط تقييم العملاء")}</p>
      <div className="pt-8 space-y-3 max-w-[240px] mx-auto">
        {ratingDist.map((d: any) => (
          <div key={d.r} className="flex items-center gap-4">
            <span className="pixel-font text-[9px] font-bold w-4 text-secondary">{d.r}</span>
            <div className="flex-1 h-3 pixel-border-paper bg-opacity-20 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${(d.count / maxRatingCount) * 100}%` }} />
            </div>
            <span className="pixel-font text-[9px] font-bold text-foreground/40 w-6">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="space-y-4">
      {feedback.map((f: any) => (
        <div key={f.id} className={`pixel-card pixel-border-paper p-5 relative ${f.read ? "" : "pixel-border-bronze bg-primary/5"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1 text-warning">{Array.from({ length: 5 }).map((_, i) => <PixelIcon key={i} d={PX_ICONS.star} size={10} color={i < f.rating ? "#F28C28" : "#D9C2A3"} />)}</div>
              <span className="pixel-font text-[11px] font-bold text-foreground">{f.userName}</span>
            </div>
            <span className="pixel-font text-[8px] text-foreground/40">{new Date(f.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="pixel-font text-sm leading-relaxed text-secondary">{f.comment}</p>
          {!f.read && <button onClick={() => markFeedbackRead(f.id)} className="pixel-font text-[9px] font-bold text-primary mt-4 block hover:underline uppercase tracking-tighter">{tr("Mark as Read", "تحديد كمقروء")}</button>}
        </div>
      ))}
    </div>
  </div>
);

const ReelsTab = ({ tr, reels, togglePin, deleteReel }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ videoUrl: "", caption: "", captionAr: "" });
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Film size={18} className="text-primary"/> {tr("Reels Management", "إدارة الريلز")}</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
          {showAdd ? <X size={14}/> : <Plus size={14}/>} {showAdd ? tr("Cancel", "إلغاء") : tr("Add Video", "إضافة فيديو")}
        </button>
      </div>
      {showAdd && (
        <div className="card-elevated rounded-2xl p-5 space-y-4 border-2 border-primary/20">
          <input className="input-field px-3 py-2.5 text-sm" placeholder="Instagram/Facebook/TikTok URL" value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field px-3 py-2.5 text-sm" placeholder="Caption (EN)" value={form.caption} onChange={e => setForm({...form, caption: e.target.value})} />
            <input className="input-field px-3 py-2.5 text-sm" dir="rtl" placeholder="Caption (AR)" value={form.captionAr} onChange={e => setForm({...form, captionAr: e.target.value})} />
          </div>
          <button disabled={saving || !form.videoUrl} onClick={async () => {
            setSaving(true);
            const id = `reel_${Date.now()}`;
            await smartSet(`reels/${id}`, { ...form, id, createdAt: Date.now(), likes: 0, authorName: "Azura" });
            setForm({ videoUrl: "", caption: "", captionAr: "" });
            setShowAdd(false);
            setSaving(false);
            swalSuccess("Reel Added!");
          }} className="btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">
            {saving ? <RotateCcw size={16} className="animate-spin"/> : <Save size={16}/>} {tr("Save Reel", "حفظ الفيديو")}
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {reels.map((r: any) => (
          <div key={r.id} className="card rounded-2xl overflow-hidden group">
            <div className="aspect-[9/16] bg-muted relative flex items-center justify-center overflow-hidden">
              <Film size={32} className="text-muted-foreground opacity-20" />
              {r.pinned && <div className="absolute top-2 left-2 bg-primary text-white p-1 rounded-lg"><Check size={12}/></div>}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                 <button onClick={() => togglePin(r)} className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shadow-lg"><Heart size={14} fill={r.pinned ? "currentColor" : "none"} /></button>
                 <button onClick={async () => { if (confirm("Delete Reel?")) deleteReel(r); }} className="w-8 h-8 rounded-full bg-white text-destructive flex items-center justify-center shadow-lg"><Trash2 size={14}/></button>
              </div>
            </div>
            <div className="p-3"><p className="text-[10px] font-bold line-clamp-2">{tr(r.caption, r.captionAr)}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TablesTab = ({ tr, activeTables, users }: any) => {
  return (
    <div className="space-y-6 page-enter">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {activeTables.map((t: any) => (
          <div key={t.id} className={`card-elevated rounded-2xl p-4 text-center border-b-4 transition-transform active:scale-95 ${t.status === 'occupied' ? 'border-orange-500 bg-orange-50/30' : 'border-green-500'}`}>
            <Armchair size={20} className={`mx-auto mb-2 ${t.status === 'occupied' ? 'text-orange-500' : 'text-green-500'}`} />
            <p className="text-lg font-black">{t.number}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase">{t.status === 'occupied' ? tr(`${t.userCount} Active`, `${t.userCount} نشط`) : tr("Empty", "فارغة")}</p>
          </div>
        ))}
      </div>
      <div className="card-elevated rounded-2xl p-5 space-y-4">
         <h3 className="font-bold text-sm flex items-center gap-2"><Users size={16}/> {tr("Who's here?", "مين موجود؟")}</h3>
         <div className="space-y-3">
           {users.filter((u:any) => u.tableNumber).map((u: any) => (
             <div key={u.uid} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">{u.name?.[0]}</div>
                 <div><p className="text-xs font-bold">{u.name}</p><p className="text-[9px] text-muted-foreground">Table {u.tableNumber}</p></div>
               </div>
               <span className="text-[10px] font-bold text-primary">{new Date(u.lastLoginAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

// --- Main Admin Component ---

const ADMIN_PIN = "azura2026";
type Tab = "overview" | "menu" | "users" | "chat" | "reviews" | "broadcast" | "reels" | "api" | "system" | "ai" | "features" | "tables" | "barista";
const BLANK_BROADCAST = { title: "", titleAr: "", message: "", messageAr: "", type: "info" as const, emoji: "📢" };
const AIAdminAssistant = lazy(() => import("@/components/AIAdminAssistant"));

const MENU_CATEGORIES = ["recommended", "new_items", "soups", "appetizers", "salads", "pasta", "tortilla", "toast", "croissant", "breakfast", "main_dishes", "burgers", "smash_burgers", "fried_chicken", "hot_drinks", "coffee", "corto", "hot_chocolate", "sahlab", "frappuccino", "iced_coffee", "mojitos", "boba_tea", "fresh_juices", "cocktails", "smoothies", "milkshakes", "waffle", "desserts", "crepes", "pancakes", "add_ons", "shisha", "soft_drinks"];
const CAT_META: Record<string, { emoji: string; en: string; ar: string }> = { recommended: { emoji: "⭐", en: "Top Picks", ar: "الأفضل" }, new_items: { emoji: "🆕", en: "New", ar: "جديد" }, soups: { emoji: "🍲", en: "Soup", ar: "شوربة" }, appetizers: { emoji: "🍟", en: "Appetizers", ar: "مقبلات" }, salads: { emoji: "🥗", en: "Salads", ar: "سلطات" }, pasta: { emoji: "🍝", en: "Pasta", ar: "مكرونة" }, tortilla: { emoji: "🌯", en: "Tortilla", ar: "تورتيلا" }, toast: { emoji: "🍞", en: "Toast", ar: "توست" }, croissant: { emoji: "🥐", en: "Croissant", ar: "كرواسون" }, breakfast: { emoji: "🍳", en: "Breakfast", ar: "فطور" }, main_dishes: { emoji: "🍽️", en: "Main Dishes", ar: "أطباق رئيسية" }, burgers: { emoji: "🍔", en: "Burgers", ar: "برجر" }, smash_burgers: { emoji: "🔥", en: "Smash Burgers", ar: "سماش برجر" }, fried_chicken: { emoji: "🍗", en: "Fried Chicken", ar: "فراخ مقلية" }, hot_drinks: { emoji: "☕", en: "Hot Drinks", ar: "مشروبات ساخنة" }, coffee: { emoji: "☕", en: "Coffee", ar: "قهوة" }, corto: { emoji: "🥛", en: "Corto", ar: "كورتو" }, hot_chocolate: { emoji: "🍫", en: "Hot Chocolate", ar: "شوكولاتة ساخنة" }, sahlab: { emoji: "🥛", en: "Sahlab", ar: "سحلب" }, frappuccino: { emoji: "🧊", en: "Frappuccino", ar: "فرابتشينو" }, iced_coffee: { emoji: "🧋", en: "Iced Coffee", ar: "قهوة مثلجة" }, mojitos: { emoji: "🍹", en: "Mojitos", ar: "موجيتو" }, boba_tea: { emoji: "🧋", en: "Boba Tea", ar: "بوبا تي" }, fresh_juices: { emoji: "🍊", en: "Fresh Juices", ar: "عصائر طازجة" }, cocktails: { emoji: "🍸", en: "Cocktails", ar: "كوكتيل" }, smoothies: { emoji: "🥤", en: "Smoothies", ar: "سموذي" }, milkshakes: { emoji: "🥛", en: "Milkshakes", ar: "ميلك شيك" }, waffle: { emoji: "🧇", en: "Waffle", ar: "وافل" }, desserts: { emoji: "🍰", en: "Desserts", ar: "حلويات" }, crepes: { emoji: "🥞", en: "Crepes", ar: "كريب" }, pancakes: { emoji: "🥞", en: "Pancakes", ar: "بان كيك" }, add_ons: { emoji: "➕", en: "Add-ons", ar: "إضافات" }, shisha: { emoji: "💨", en: "Hookah", ar: "شيشة" }, soft_drinks: { emoji: "🥤", en: "Soft Drinks", ar: "مشروبات غازية" } };

export default function Admin() {
  const { lang, isRTL } = useLang();
  const [, navigate] = useLocation();
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("azura-admin") === "true");
  const [pinErr, setPinErr] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [tablesRaw, setTablesRaw] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [apiSettings, setApiSettings] = useState({ groqKey: "", aiProvider: "groq" as any, aiEnabled: true, menuNode: "menu" });
  const [featureFlags, setFeatureFlags] = useState({ baristaEnabled: true, reelsEnabled: true, supportEnabled: true });
  const [savingFlag, setSavingFlag] = useState<string | null>(null);
  const [bannerContent, setBannerContent] = useState("");
  const [bannerBgColor, setBannerBgColor] = useState("#FF6B35");
  const [bannerTextColor, setBannerTextColor] = useState("#FFFFFF");
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState<any>(BLANK_BROADCAST);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const activeTables = useMemo(() => {
    return tablesRaw.map(t => ({
      ...t,
      userCount: users.filter(u => u.tableNumber === t.number).length,
      status: users.some(u => u.tableNumber === t.number) ? "occupied" : "available"
    })).sort((a, b) => a.number - b.number);
  }, [tablesRaw, users]);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  useEffect(() => {
    if (!authed) return;
    onValue(ref(db, "api-settings"), (s) => s.exists() && setApiSettings(s.val()));
    onValue(ref(db, "feature-flags"), (s) => s.exists() && setFeatureFlags(s.val()));
    onValue(ref(db, "homepage-banner"), (s) => { if (!s.exists()) return; const d = s.val(); setBannerContent(d.content || ""); setBannerBgColor(d.bgColor || "#FF6B35"); setBannerTextColor(d.textColor || "#FFFFFF"); setBannerEnabled(d.enabled !== false); });
    onValue(ref(db, "menu"), (s) => {
      const data = s.val() || {}; const res: MenuItem[] = [];
      Object.entries(data).forEach(([k, v]: any) => { if (v.price !== undefined) res.push({ id: k, ...v }); else Object.entries(v).forEach(([sk, sv]: any) => res.push({ id: sk, ...sv })); });
      setMenu(res);
    });
    onValue(ref(db, "users"), (s) => setUsers(Object.entries(s.val() || {}).map(([uid, v]: any) => ({ uid, ...v })).sort((a,b) => (b.lastLoginAt||0)-(a.lastLoginAt||0))));
    onValue(ref(db, "feedback"), (s) => setFeedback(Object.entries(s.val() || {}).map(([id, v]: any) => ({ id, ...v })).sort((a,b) => b.createdAt-a.createdAt)));
    onValue(ref(db, "broadcast"), (s) => setBroadcasts(Object.entries(s.val() || {}).map(([id, v]: any) => ({ id, ...v })).sort((a,b) => b.createdAt-a.createdAt)));
    onValue(ref(db, "reels"), (s) => setReels(Object.entries(s.val() || {}).map(([id, v]: any) => ({ id, ...v })).sort((a,b) => b.createdAt-a.createdAt)));
    onValue(ref(db, "tables"), (s) => setTablesRaw(Object.entries(s.val() || {}).map(([id, v]: any) => ({ id, ...v }))));
    onValue(ref(db, "support-chat"), (s) => setChats(Object.entries(s.val() || {}).filter(([k, v]: any) => v.meta).map(([uid, v]: any) => ({ uid, ...v.meta })).sort((a,b) => (b.lastAt||0)-(a.lastAt||0))));
    return () => ["menu", "users", "feedback", "broadcast", "reels", "tables", "support-chat", "api-settings", "feature-flags", "homepage-banner"].forEach(p => off(ref(db, p)));
  }, [authed]);

  useEffect(() => {
    if (!selectedChat) return;
    onValue(ref(db, `support-chat/${selectedChat}/messages`), (s) => setChatMsgs(Object.entries(s.val() || {}).map(([id, m]: any) => ({ id, ...m })).sort((a,b) => a.createdAt-b.createdAt)));
    update(ref(db, `support-chat/${selectedChat}/meta`), { unreadAdmin: 0 });
    return () => off(ref(db, `support-chat/${selectedChat}/messages`));
  }, [selectedChat]);

  const login = () => { if (pin === ADMIN_PIN) { sessionStorage.setItem("azura-admin", "true"); setAuthed(true); } else setPinErr("Wrong PIN"); };

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="pixel-card pixel-border-wood p-8 max-w-xs w-full text-center space-y-6">
        <div className="flex justify-center text-primary">
          <ShieldCheck size={40} />
        </div>
        <h1 className="pixel-font text-lg font-bold text-foreground">{tr("Admin Access", "دخول المشرف")}</h1>
        <form onSubmit={(e) => { e.preventDefault(); login(); }}>
          <input type="password" placeholder="PIN" className="pixel-input text-center py-4 text-lg font-bold tracking-widest w-full mb-6 pixel-font" value={pin} onChange={e => setPin(e.target.value)} />
          {pinErr && <p className="pixel-font text-destructive text-[9px] mb-4 uppercase">{pinErr}</p>}
          <button type="submit" className="pixel-btn pixel-btn-primary w-full py-4 text-xs font-black">{tr("Login", "دخول")}</button>
        </form>
      </div>
    </div>
  );

  const TABS: { id: Tab; icon: any; en: string; ar: string; badge?: number }[] = [
    { id: "overview", icon: <PixelIcon d={PX_ICONS.dashboard} size={14} />, en: "Overview", ar: "الرئيسية" },
    { id: "menu", icon: <PixelIcon d={PX_ICONS.plus} size={14} />, en: "Menu", ar: "القائمة" },
    { id: "features", icon: <PixelIcon d={PX_ICONS.features} size={14} />, en: "Features", ar: "الميزات" },
    { id: "users", icon: <PixelIcon d={PX_ICONS.users} size={14} />, en: "Users", ar: "المستخدمين" },
    { id: "chat", icon: <PixelIcon d={PX_ICONS.chat} size={14} />, en: "Chat", ar: "الدردشة", badge: chats.reduce((s, c) => s + (c.unreadAdmin || 0), 0) },
    { id: "reviews", icon: <PixelIcon d={PX_ICONS.star} size={14} />, en: "Reviews", ar: "تقييمات", badge: feedback.filter(f => !f.read).length },
    { id: "broadcast", icon: <PixelIcon d={PX_ICONS.broadcast} size={14} />, en: "Broadcast", ar: "إشعارات" },
    { id: "reels", icon: <PixelIcon d={PX_ICONS.reels} size={14} />, en: "Reels", ar: "ريلز" },
    { id: "barista", icon: <PixelIcon d={PX_ICONS.sparkles} size={14} />, en: "AI Barista", ar: "الباريستا" },
    { id: "api", icon: <PixelIcon d={PX_ICONS.api} size={14} />, en: "API", ar: "الربط" },
    { id: "system", icon: <PixelIcon d={PX_ICONS.system} size={14} />, en: "System", ar: "النظام" },
    { id: "tables", icon: <PixelIcon d={PX_ICONS.menu} size={14} />, en: "Tables", ar: "الطاولات" },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-40 bg-muted px-4 py-4 flex items-center gap-4 text-white pixel-border-wood border-t-0 border-x-0">
        <button onClick={() => navigate("/menu")} className="pixel-btn pixel-btn-secondary p-2 min-w-0">
          <ArrowLeft size={16} />
        </button>
        <div className="flex flex-col flex-1">
          <span className="pixel-font font-bold text-lg leading-none text-foreground pixel-text-shadow">AZURA</span>
          <span className="pixel-font text-[8px] text-foreground/70 tracking-tighter uppercase mt-1">quality is habit</span>
        </div>
        <button onClick={() => { sessionStorage.removeItem("azura-admin"); setAuthed(false); }} className="pixel-font text-[9px] text-destructive font-black uppercase underline decoration-2">Sign out</button>
      </header>
      <nav className="sticky top-[76px] z-30 bg-card px-3 py-3 overflow-x-auto scroll-hide border-b-4 border-secondary/20 shadow-lg">
        <div className="flex gap-3 min-w-max">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setSelectedChat(null); }} className={`chip relative flex items-center gap-2 px-4 py-2 pixel-font text-[10px] ${activeTab === t.id ? "chip-active" : "chip-inactive"}`}>
              {t.icon} <span>{tr(t.en, t.ar)}</span>
              {!!t.badge && <span className="absolute -top-1.5 -right-1.5 bg-destructive text-white text-[8px] min-w-[18px] h-4 pixel-border-bronze flex items-center justify-center px-1 font-bold">{t.badge}</span>}
            </button>
          ))}
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Suspense fallback={<div className="text-center py-20 opacity-50">Loading...</div>}>
          {activeTab === "overview" && <OverviewTab tr={tr} users={users} unreadChats={chats.reduce((s,c)=>s+(c.unreadAdmin||0),0)} newReviewsCount={feedback.filter(f=>!f.read).length} />}
          {activeTab === "menu" && <MenuTab tr={tr} lang={lang} menu={menu} MENU_CATEGORIES={MENU_CATEGORIES} CAT_META={CAT_META} />}
          {activeTab === "features" && <FeaturesTab tr={tr} featureFlags={featureFlags} toggleFeatureFlag={async (k: string, v: boolean) => { setSavingFlag(k); await update(ref(db, "feature-flags"), { [k]: v }); setSavingFlag(null); }} savingFlag={savingFlag} />}
          {activeTab === "users" && <UsersTab tr={tr} users={users} deleteUser={(uid: string) => smartRemove(`users/${uid}`)} formatDuration={(s: number) => s > 3600 ? `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m` : `${Math.floor(s/60)}m`} />}
          {activeTab === "chat" && <ChatTab tr={tr} isRTL={isRTL} selectedChat={selectedChat} setSelectedChat={setSelectedChat} chats={chats} chatMsgs={chatMsgs} chatInput={chatInput} setChatInput={setChatInput} sendReply={async () => { if (!chatInput.trim() || !selectedChat) return; await smartPush(`support-chat/${selectedChat}/messages`, { text: chatInput, sender: "admin", createdAt: Date.now() }); await smartUpdate(`support-chat/${selectedChat}/meta`, { lastMessage: chatInput, lastAt: Date.now() }); setChatInput(""); }} deleteChat={(uid: string) => smartRemove(`support-chat/${uid}`)} chatBottomRef={chatBottomRef} />}
          {activeTab === "reviews" && <ReviewsTab tr={tr} feedback={feedback} avgRating={(feedback.reduce((s,f)=>s+f.rating,0)/(feedback.length||1)).toFixed(1)} ratingDist={[5,4,3,2,1].map(r=>({r, count: feedback.filter(f=>f.rating===r).length}))} maxRatingCount={Math.max(...[5,4,3,2,1].map(r=>feedback.filter(f=>f.rating===r).length), 1)} markFeedbackRead={(id: string) => smartUpdate(`feedback/${id}`, {read:true})} />}
          {activeTab === "broadcast" && <BroadcastTab tr={tr} newBroadcast={newBroadcast} setNewBroadcast={setNewBroadcast} sendBroadcast={async () => { setSendingBroadcast(true); await smartPush("broadcast", { ...newBroadcast, createdAt: Date.now() }); setNewBroadcast(BLANK_BROADCAST); setSendingBroadcast(false); }} sendingBroadcast={sendingBroadcast} bannerContent={bannerContent} setBannerContent={setBannerContent} bannerBgColor={bannerBgColor} setBannerBgColor={setBannerBgColor} bannerTextColor={bannerTextColor} setBannerTextColor={setBannerTextColor} bannerEnabled={bannerEnabled} saveBannerEnabled={(v: boolean) => update(ref(db, "homepage-banner"), {enabled:v})} saveBanner={async () => { setSavingBanner(true); await set(ref(db, "homepage-banner"), { content: bannerContent, bgColor: bannerBgColor, textColor: bannerTextColor, enabled: bannerEnabled }); setSavingBanner(false); }} savingBanner={savingBanner} broadcasts={broadcasts} deleteBroadcast={(id: string) => smartRemove(`broadcast/${id}`)} />}
          {activeTab === "reels" && <ReelsTab tr={tr} reels={reels} togglePin={(r: Reel) => smartUpdate(`reels/${r.id}`, {pinned: !r.pinned})} deleteReel={(r: Reel) => smartRemove(`reels/${r.id}`)} />}
          {activeTab === "api" && <div className="page-enter card-elevated rounded-2xl p-5 border-l-4 border-primary space-y-4"><h3 className="font-bold flex items-center gap-2"><Key size={18}/> API Settings</h3><input className="input-field px-3 py-2 text-sm w-full" type="password" value={apiSettings.groqKey} onChange={e => setApiSettings({...apiSettings, groqKey: e.target.value})} placeholder="Groq Key" /><button onClick={async () => { await smartSet("api-settings", { ...apiSettings, groqKey: apiSettings.groqKey?.startsWith("gsk") ? encryptKey(apiSettings.groqKey) : apiSettings.groqKey }); swalSuccess("Saved!"); }} className="btn-primary w-full py-3 rounded-xl font-bold">Save Settings</button></div>}
          {activeTab === "system" && <SystemTab tr={tr} />}
          {activeTab === "tables" && <TablesTab tr={tr} activeTables={activeTables} users={users} />}
          {activeTab === "barista" && <BaristaTab tr={tr} />}
          {activeTab === "ai" && <div className="page-enter"><AIAdminAssistant /></div>}
        </Suspense>
      </main>
    </div>
  );
}
