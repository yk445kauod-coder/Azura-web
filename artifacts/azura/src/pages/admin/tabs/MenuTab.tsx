import React, { useState, useMemo } from "react";
import { Search, LayoutGrid, RotateCcw, UploadCloud, Plus, ChevronDown, Pencil, Save, Trash2, X } from "lucide-react";
import { MenuItem } from "../types";
import { smartSet, smartUpdate, smartRemove } from "@/lib/dbWrapper";
import { swalSuccess, swalError, swalConfirm, swalLoading, swalClose } from "@/lib/swal";
import { forceReseedMenu, mergeMenuIngredients } from "@/lib/firebase";
import { ImagePicker } from "../components/ImagePicker";

interface MenuTabProps {
  tr: (en: string, ar: string) => string;
  lang: string;
  menu: MenuItem[];
  MENU_CATEGORIES: string[];
  CAT_META: Record<string, { emoji: string; en: string; ar: string }>;
}

export const MenuTab: React.FC<MenuTabProps> = ({ tr, lang, menu, MENU_CATEGORIES, CAT_META }) => {
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
    const filtered = menu.filter(item => {
      const matchesSearch = !menuSearch ||
        item.name?.toLowerCase().includes(menuSearch.toLowerCase()) ||
        item.nameAr?.includes(menuSearch) ||
        item.description?.toLowerCase().includes(menuSearch.toLowerCase()) ||
        item.id?.toLowerCase().includes(menuSearch.toLowerCase());
      const matchesCategory = menuCategoryFilter === "all" || item.category === menuCategoryFilter;
      return matchesSearch && matchesCategory;
    });

    const groups: Record<string, MenuItem[]> = {};

    // We want items to appear in ONLY one section to avoid "conflict/overlap"
    // Priority: Recommended > Primary Category

    const recs = filtered.filter(i => i.recommended);
    if (recs.length > 0) {
      groups["recommended"] = recs;
    }

    filtered.forEach(item => {
      // If it's already in recommended and we are showing all categories,
      // maybe don't show it again in its primary category to avoid duplication?
      // Actually, if a user filters by a specific category, they SHOULD see it.
      // But if category filter is "all", it shows the grouped accordion.

      const cat = item.category || "other";
      if (!groups[cat]) groups[cat] = [];

      // Only avoid duplication if viewing "all" categories and item is recommended
      if (menuCategoryFilter === "all" && item.recommended) {
        // Skip adding to primary category section because it's already in "Recommended" section
        return;
      }

      groups[cat].push(item);
    });

    return groups;
  }, [menu, menuSearch, menuCategoryFilter]);

  const inp = "input-field px-3 py-2.5 text-sm";

  return (
    <div className="space-y-4 page-enter">
      {/* Header / Actions */}
      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <LayoutGrid size={18} className="text-primary"/> {tr("Menu Management","إدارة القائمة")}
          </h3>

          <div className="w-full flex gap-2 mt-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={tr("Search items...", "البحث في القائمة...")}
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <select
              value={menuCategoryFilter}
              onChange={(e) => setMenuCategoryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-muted text-sm border-0 focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">{tr("All Categories", "كل الأقسام")}</option>
              {MENU_CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {CAT_META[c] ? tr(CAT_META[c].en, CAT_META[c].ar) : c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 flex-wrap w-full">
            <button
              onClick={async () => {
                if (!confirm(tr("Merge new items & ingredients into Firebase without overwriting prices/availability?", "دمج العناصر الجديدة في Firebase بدون حذف الأسعار؟"))) return;
                swalLoading(tr("Merging menu…", "جار الدمج…"));
                await mergeMenuIngredients();
                swalClose();
                swalSuccess(tr("Menu merged! New items added.", "تم الدمج! تمت إضافة العناصر الجديدة."));
              }}
              className="flex-1 btn-secondary px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
            >
              <RotateCcw size={13}/> {tr("Merge", "دمج")}
            </button>
            <button
              onClick={async () => {
                if (!confirm(tr("⚠️ FORCE RESEED: This will OVERWRITE the entire Firebase menu with the latest 251-item menu. Prices you changed in Firebase will be reset. Continue?", "⚠️ سيتم الكتابة فوق القائمة بالكامل في Firebase. الأسعار المعدّلة ستُعاد. متأكد؟"))) return;
                swalLoading(tr("Reseeding 251 items…", "جار رفع 251 صنف…"));
                await forceReseedMenu();
                swalClose();
                swalSuccess(tr("✅ Full menu (251 items, 30 categories) pushed to Firebase!", "✅ تم رفع القائمة الكاملة (251 صنف, 30 قسم) إلى Firebase!"));
              }}
              className="flex-1 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <UploadCloud size={13}/> {tr("Reseed", "رفع")}
            </button>
            <button
              onClick={() => setShowAddForm(v => !v)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors ${showAddForm ? "bg-muted text-foreground" : "btn-primary"}`}
            >
              <Plus size={13}/> {showAddForm ? tr("Cancel", "إلغاء") : tr("Add", "إضافة")}
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="rounded-2xl border border-primary/20 bg-primary/3 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs font-black text-primary uppercase tracking-widest">{tr("New Menu Item", "صنف جديد")}</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Name (EN)","الاسم EN")}</label>
                <input className={inp} placeholder="Caramel Latte" value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Name (AR)","الاسم AR")}</label>
                <input className={inp} dir="rtl" placeholder="لاتيه كراميل" value={addForm.nameAr}
                  onChange={e => setAddForm(f => ({ ...f, nameAr: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Price (EGP)","السعر")}</label>
                <input type="number" className={inp} placeholder="0" value={addForm.price}
                  onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Category","الفئة")}</label>
                <select className={inp} value={addForm.category}
                  onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}>
                  {MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <ImagePicker label={tr("Photo", "الصورة")} value={addForm.image} onChange={v => setAddForm(f => ({ ...f, image: v }))} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Description (EN)","الوصف EN")}</label>
                <input className={inp} placeholder="..." value={addForm.description}
                  onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Description (AR)","الوصف AR")}</label>
                <input className={inp} dir="rtl" placeholder="..." value={addForm.descriptionAr}
                  onChange={e => setAddForm(f => ({ ...f, descriptionAr: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <textarea className={`${inp} resize-none h-16`} placeholder={tr("Ingredients (EN)", "المكونات EN")} value={addForm.ingredients} onChange={e => setAddForm(f => ({ ...f, ingredients: e.target.value }))} />
              <textarea className={`${inp} resize-none h-16`} dir="rtl" placeholder={tr("Ingredients (AR)", "المكونات AR")} value={addForm.ingredientsAr} onChange={e => setAddForm(f => ({ ...f, ingredientsAr: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${addForm.available ? "bg-green-500" : "bg-muted"}`}
                  onClick={() => setAddForm(f => ({ ...f, available: !f.available }))}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${addForm.available ? "translate-x-4" : ""}`} />
                </div>
                <span className="text-xs font-semibold">{addForm.available ? tr("Available","متاح") : tr("Sold Out","نفذ")}</span>
              </label>
              <button
                disabled={savingItem || !addForm.name || !addForm.price}
                onClick={async () => {
                  setSavingItem(true);
                  const id = `${addForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36)}`;
                  await smartSet(`menu/${addForm.category}/${id}`, {
                    ...addForm,
                    price: Number(addForm.price),
                  });
                  setAddForm({ name:"", nameAr:"", price:"", category:"coffee", image:"", description:"", descriptionAr:"", ingredients:"", ingredientsAr:"", available:true });
                  setShowAddForm(false);
                  setSavingItem(false);
                  swalSuccess(tr("Added!", "تمت الإضافة!"));
                }}
                className="btn-primary px-5 py-2 rounded-xl text-xs font-bold ms-auto flex items-center gap-2"
              >
                {savingItem ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <Save size={14}/>}
                {tr("Save Item","حفظ الصنف")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {Object.keys(groupedMenu).length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
            <Search size={40} className="mx-auto text-muted-foreground/30 mb-3"/>
            <p className="text-muted-foreground text-sm">{tr("No items found", "لا توجد نتائج")}</p>
          </div>
        )}

        {Object.entries(groupedMenu).map(([catId, catItems]) => {
          const isExpanded = expandedCats.has(catId);
          const meta = CAT_META[catId] || { emoji: "📦", en: catId, ar: catId };
          const itemsList = catItems as MenuItem[];

          return (
            <div key={catId} className="space-y-2">
              <button
                onClick={() => {
                  const next = new Set(expandedCats);
                  if (next.has(catId)) next.delete(catId);
                  else next.add(catId);
                  setExpandedCats(next);
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-muted/50 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{meta.emoji}</span>
                  <span className="font-black text-sm uppercase tracking-tight text-foreground/80">
                    {tr(meta.en, meta.ar)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                    {itemsList.length}
                  </span>
                </div>
                <ChevronDown size={18} className={`text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
              </button>

              {isExpanded && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                  {itemsList.map((item: MenuItem) => {
                    const isSelected = selectedMenuItemId === item.id;
                    const edits = menuEdits[item.id] || {};
                    const isDirty = Object.keys(edits).length > 0;

                    return (
                      <div key={item.id} className="contents">
                        <div
                          onClick={() => setSelectedMenuItemId(isSelected ? null : item.id)}
                          className={`relative group cursor-pointer card rounded-2xl overflow-hidden border transition-all duration-200 ${
                            isSelected
                              ? "ring-2 ring-primary border-transparent shadow-lg scale-[1.02] bg-primary/5"
                              : isDirty
                                ? "border-amber-300 bg-amber-50/30"
                                : "border-border/40 hover:border-primary/30"
                          }`}
                          style={{
                            contentVisibility: "auto",
                            containIntrinsicSize: "0 150px",
                            willChange: "transform"
                          }}
                        >
                          <div className="h-24 relative overflow-hidden bg-muted/20">
                            {item.image ? (
                              <img src={item.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" loading="lazy"/>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">{meta.emoji}</div>
                            )}
                            {!item.available && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="bg-white/90 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase">{tr("Sold Out", "نفذ")}</span>
                              </div>
                            )}
                            {item.recommended && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] shadow-sm">⭐</div>
                            )}
                          </div>
                          <div className="p-2.5">
                            <p className="font-bold text-xs text-foreground truncate">{lang === "ar" ? (item.nameAr || item.name) : item.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[10px] font-black text-primary">{item.price} <span className="text-[8px] opacity-60">EGP</span></p>
                              <Pencil size={10} className={`transition-opacity ${isSelected ? "text-primary opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`} />
                            </div>
                          </div>
                          {isDirty && <div className="absolute top-1 left-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-sm shadow-amber-500/50" />}
                        </div>

                        {isSelected && (
                          <div className="col-span-2 card-elevated rounded-3xl p-5 border-2 border-primary/20 bg-card shadow-2xl animate-in zoom-in-95 duration-200 mt-1 mb-3">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                  <Pencil size={20} />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">{tr("Edit Item", "تعديل الصنف")}</p>
                                  <h4 className="font-bold text-foreground">{item.name}</h4>
                                </div>
                              </div>
                              <button onClick={() => setSelectedMenuItemId(null)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                                <X size={16} />
                              </button>
                            </div>

                            <div className="space-y-4">
                              {(() => {
                                const currentEdits = menuEdits[item.id] || {};
                                const val = (f: keyof MenuItem) => f in currentEdits ? currentEdits[f] : item[f];
                                const patch = (f: keyof MenuItem, v: any) => setMenuEdits(prev => ({ ...prev, [item.id]: { ...prev[item.id], [f]: v } }));

                                const handleSave = async () => {
                                  setSavingMenuId(item.id);
                                  try {
                                    await smartUpdate(`menu/${item.category}/${item.id}`, currentEdits);
                                    setMenuEdits(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                                    swalSuccess(tr("Changes saved!", "تم حفظ التعديلات!"));
                                    setSelectedMenuItemId(null);
                                  } catch (e) {
                                    swalError(tr("Save failed", "فشل الحفظ"));
                                  }
                                  setSavingMenuId(null);
                                };

                                const handleDelete = async () => {
                                  if (await swalConfirm(tr("Delete this item?", "حذف الصنف؟"), tr("This action is permanent.", "هذا الإجراء نهائي ولا يمكن التراجع عنه."), tr("Delete", "حذف"), tr("Cancel", "إلغاء"))) {
                                    await smartRemove(`menu/${item.category}/${item.id}`);
                                    setSelectedMenuItemId(null);
                                    swalSuccess(tr("Item deleted", "تم حذف الصنف"));
                                  }
                                };

                                return (
                                  <>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Name (EN)", "الاسم EN")}</label>
                                        <input className={inp} value={val("name") as string} onChange={e => patch("name", e.target.value)} />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Name (AR)", "الاسم AR")}</label>
                                        <input className={inp} dir="rtl" value={val("nameAr") as string} onChange={e => patch("nameAr", e.target.value)} />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Price (EGP)", "السعر")}</label>
                                        <input type="number" className={inp} value={val("price") as number} onChange={e => patch("price", Number(e.target.value))} />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Category", "الفئة")}</label>
                                        <select className={inp} value={val("category") as string} onChange={e => patch("category", e.target.value)}>
                                          {MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                      </div>
                                    </div>

                                    <ImagePicker label={tr("Photo", "الصورة")} value={val("image") as string} onChange={v => patch("image", v)} />

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Description (EN)", "الوصف EN")}</label>
                                        <input className={inp} value={val("description") as string} onChange={e => patch("description", e.target.value)} />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Description (AR)", "الوصف AR")}</label>
                                        <input className={inp} dir="rtl" value={val("descriptionAr") as string} onChange={e => patch("descriptionAr", e.target.value)} />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Ingredients (EN)", "المكونات EN")}</label>
                                        <textarea className={`${inp} resize-none h-20 text-[11px]`} value={val("ingredients") as string} onChange={e => patch("ingredients", e.target.value)} />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase">{tr("Ingredients (AR)", "المكونات AR")}</label>
                                        <textarea className={`${inp} resize-none h-20 text-[11px]`} dir="rtl" value={val("ingredientsAr") as string} onChange={e => patch("ingredientsAr", e.target.value)} />
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 pt-2">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${val("available") ? "bg-green-500" : "bg-muted"}`}
                                          onClick={() => patch("available", !val("available"))}>
                                          <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${val("available") ? "translate-x-5" : ""}`} />
                                        </div>
                                        <span className="text-xs font-bold">{val("available") ? tr("In Stock", "متاح") : tr("Sold Out", "نفذ")}</span>
                                      </label>

                                      <button
                                        onClick={() => patch("recommended", !val("recommended"))}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 ${
                                          val("recommended") ? "bg-amber-400 text-white shadow-lg shadow-amber-200" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        }`}
                                      >
                                        <span>{val("recommended") ? "⭐" : "☆"}</span>
                                        {tr("Recommended", "مُوصى به")}
                                      </button>

                                      <div className="flex gap-2 ms-auto">
                                        <button
                                          onClick={handleDelete}
                                          className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive transition-colors hover:text-white"
                                        >
                                          <Trash2 size={18} />
                                        </button>
                                        <button
                                          disabled={savingMenuId === item.id || !Object.keys(currentEdits).length}
                                          onClick={handleSave}
                                          className="btn-primary px-6 h-10 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-40"
                                        >
                                          {savingMenuId === item.id ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <Save size={16}/>}
                                          {tr("Save Changes", "حفظ التعديلات")}
                                        </button>
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
