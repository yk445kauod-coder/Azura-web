import { useState, useEffect } from "react";
import { db, ref, push, set, get } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { 
  Layout, Plus, Trash2, Eye, Save, Type, Image, Square, 
  Circle, MousePointer2, Palette, AlignLeft, AlignCenter, 
  AlignRight, Move, Copy, Settings, Columns, Rows, ChevronDown,
  ChevronUp, GripVertical, Check, X, FileText, Link as LinkIcon
} from "lucide-react";

interface PageElement {
  id: string;
  type: "text" | "image" | "button" | "card" | "divider" | "spacer" | "link" | "container";
  props: Record<string, any>;
  children?: PageElement[];
  styles?: Record<string, string>;
}

interface CreatedPage {
  id: string;
  name: string;
  nameAr: string;
  path: string;
  elements: PageElement[];
  createdAt: number;
  createdBy: string;
}

const ELEMENT_TYPES = [
  { type: "text", label: "Text", labelAr: "نص", icon: Type },
  { type: "image", label: "Image", labelAr: "صورة", icon: Image },
  { type: "button", label: "Button", labelAr: "زر", icon: MousePointer2 },
  { type: "card", label: "Card", labelAr: "بطاقة", icon: Square },
  { type: "divider", label: "Divider", labelAr: "خط فاصل", icon: Columns },
  { type: "spacer", label: "Spacer", labelAr: "مسافة", icon: Rows },
  { type: "link", label: "Link", labelAr: "رابط", icon: LinkIcon },
  { type: "container", label: "Container", labelAr: "حاوية", icon: Layout },
];

const DEFAULT_PROPS: Record<string, Record<string, any>> = {
  text: { content: "New Text", fontSize: "16px", fontWeight: "400", color: "#333333", align: "left", backgroundColor: "transparent" },
  image: { src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80", alt: "Image", width: "100%", borderRadius: "12px" },
  button: { text: "Click Me", backgroundColor: "#5d3e23", color: "#fff", borderRadius: "12px", padding: "12px 24px", fontSize: "14px", fontWeight: "600" },
  card: { backgroundColor: "#fff", borderRadius: "16px", padding: "16px", shadow: "md", width: "100%" },
  divider: { color: "#e5e5e5", thickness: "1px", style: "solid", margin: "16px 0" },
  spacer: { height: "24px" },
  link: { text: "Link Text", href: "#", color: "#5d3e23", fontSize: "14px", underline: true },
  container: { backgroundColor: "transparent", padding: "16px", borderRadius: "12px", maxWidth: "100%" },
};

const PRESET_TEMPLATES = [
  {
    id: "promo",
    name: "Promotional Banner",
    nameAr: "بانر ترويجي",
    elements: [
      { id: "1", type: "container", props: { backgroundColor: "linear-gradient(135deg, #5d3e23, #8b6914)", padding: "32px", borderRadius: "20px" }, children: [
        { id: "2", type: "text", props: { content: "Special Offer!", fontSize: "28px", fontWeight: "700", color: "#fff", align: "center" } },
        { id: "3", type: "text", props: { content: "Get 20% off on your first order", fontSize: "16px", color: "rgba(255,255,255,0.9)", align: "center" } },
        { id: "4", type: "button", props: { text: "Order Now", backgroundColor: "#fff", color: "#5d3e23", borderRadius: "25px", padding: "14px 32px" } },
      ]},
    ],
  },
  {
    id: "about",
    name: "About Section",
    nameAr: "قسم عنا",
    elements: [
      { id: "1", type: "container", props: { padding: "24px", backgroundColor: "#fff", borderRadius: "20px", shadow: "md" }, children: [
        { id: "2", type: "image", props: { src: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80", alt: "Cafe", width: "100%", borderRadius: "16px", marginBottom: "16px" } },
        { id: "3", type: "text", props: { content: "Welcome to Azura", fontSize: "24px", fontWeight: "700", color: "#5d3e23", align: "center" } },
        { id: "4", type: "text", props: { content: "Experience the finest coffee and delicious meals in Alexandria. Our café offers a cozy atmosphere perfect for work, study, or relaxation.", fontSize: "14px", color: "#666", align: "center", lineHeight: "1.6" } },
      ]},
    ],
  },
  {
    id: "contact",
    name: "Contact Card",
    nameAr: "بطاقة اتصال",
    elements: [
      { id: "1", type: "container", props: { padding: "24px", backgroundColor: "#fff", borderRadius: "20px", shadow: "md" }, children: [
        { id: "2", type: "text", props: { content: "📍 Location", fontSize: "18px", fontWeight: "600", color: "#5d3e23", marginBottom: "8px" } },
        { id: "3", type: "text", props: { content: "Tivoli Dome, Alexandria, Egypt", fontSize: "14px", color: "#666", marginBottom: "16px" } },
        { id: "4", type: "text", props: { content: "📞 Phone", fontSize: "18px", fontWeight: "600", color: "#5d3e23", marginBottom: "8px" } },
        { id: "5", type: "text", props: { content: "+20 XX XXX XXXX", fontSize: "14px", color: "#666", marginBottom: "16px" } },
        { id: "6", type: "text", props: { content: "⏰ Hours", fontSize: "18px", fontWeight: "600", color: "#5d3e23", marginBottom: "8px" } },
        { id: "7", type: "text", props: { content: "Daily: 8:00 AM - 12:00 AM", fontSize: "14px", color: "#666" } },
      ]},
    ],
  },
];

export default function VisualPageBuilder() {
  const { lang } = useLang();
  const [pages, setPages] = useState<CreatedPage[]>([]);
  const [activePage, setActivePage] = useState<CreatedPage | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [newPageNameAr, setNewPageNameAr] = useState("");

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const snap = await get(ref(db, "custom-pages"));
      if (snap.exists()) {
        const data = snap.val() as Record<string, Omit<CreatedPage, "id">>;
        setPages(Object.entries(data).map(([id, p]) => ({ id, ...p })));
      }
    } catch (error) {
      console.error("Error loading pages:", error);
    }
  };

  const createNewPage = () => {
    if (!newPageName.trim()) return;
    const pageId = `page_${Date.now()}`;
    const path = `/${newPageName.toLowerCase().replace(/\s+/g, "-")}`;
    setActivePage({
      id: pageId,
      name: newPageName,
      nameAr: newPageNameAr || newPageName,
      path,
      elements: [],
      createdAt: Date.now(),
      createdBy: "admin",
    });
    setNewPageName("");
    setNewPageNameAr("");
  };

  const addElement = (type: string) => {
    if (!activePage) return;
    const elementId = `el_${Date.now()}`;
    const newElement: PageElement = {
      id: elementId,
      type: type as PageElement["type"],
      props: { ...DEFAULT_PROPS[type] },
      styles: {},
    };
    setActivePage({
      ...activePage,
      elements: [...activePage.elements, newElement],
    });
    setSelectedElement(elementId);
  };

  const updateElement = (id: string, updates: Partial<PageElement>) => {
    if (!activePage) return;
    const updateRecursive = (elements: PageElement[]): PageElement[] => {
      return elements.map(el => {
        if (el.id === id) return { ...el, ...updates };
        if (el.children) return { ...el, children: updateRecursive(el.children) };
        return el;
      });
    };
    setActivePage({
      ...activePage,
      elements: updateRecursive(activePage.elements),
    });
  };

  const deleteElement = (id: string) => {
    if (!activePage) return;
    const deleteRecursive = (elements: PageElement[]): PageElement[] => {
      return elements.filter(el => {
        if (el.id === id) return false;
        if (el.children) el.children = deleteRecursive(el.children);
        return true;
      });
    };
    setActivePage({
      ...activePage,
      elements: deleteRecursive(activePage.elements),
    });
    if (selectedElement === id) setSelectedElement(null);
  };

  const savePage = async () => {
    if (!activePage) return;
    setSaving(true);
    try {
      await set(ref(db, `custom-pages/${activePage.id}`), {
        name: activePage.name,
        nameAr: activePage.nameAr,
        path: activePage.path,
        elements: activePage.elements,
        createdAt: activePage.createdAt,
        createdBy: activePage.createdBy,
      });
      await loadPages();
    } catch (error) {
      console.error("Error saving page:", error);
    }
    setSaving(false);
  };

  const applyTemplate = (template: typeof PRESET_TEMPLATES[0]) => {
    if (!activePage) return;
    setActivePage({
      ...activePage,
      elements: template.elements as PageElement[],
    });
    setShowTemplates(false);
  };

  const renderElement = (element: PageElement, isPreview = false) => {
    const isSelected = selectedElement === element.id;
    const baseClasses = `relative ${isSelected && !isPreview ? "ring-2 ring-primary ring-offset-2" : ""} ${isPreview ? "" : "group"}`;

    const commonProps = {
      key: element.id,
      className: baseClasses,
      onClick: () => !isPreview && setSelectedElement(element.id),
      style: element.styles,
    };

    switch (element.type) {
      case "text":
        return (
          <div {...commonProps} style={{ 
            fontSize: element.props.fontSize,
            fontWeight: element.props.fontWeight,
            color: element.props.color,
            textAlign: (element.props.align || "left") as any,
            backgroundColor: element.props.backgroundColor,
            lineHeight: "1.6",
          }}>
            {element.props.content}
            {!isPreview && (
              <div className="absolute -top-6 left-0 bg-primary text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Text
              </div>
            )}
          </div>
        );

      case "image":
        return (
          <div {...commonProps}>
            <img 
              src={element.props.src} 
              alt={element.props.alt}
              style={{
                width: element.props.width,
                borderRadius: element.props.borderRadius,
                marginBottom: element.props.marginBottom,
              }}
              className="object-cover"
            />
          </div>
        );

      case "button":
        return (
          <button {...commonProps} style={{
            backgroundColor: element.props.backgroundColor,
            color: element.props.color,
            borderRadius: element.props.borderRadius,
            padding: element.props.padding,
            fontSize: element.props.fontSize,
            fontWeight: element.props.fontWeight,
            cursor: isPreview ? "pointer" : "default",
          }}>
            {element.props.text}
          </button>
        );

      case "card":
        return (
          <div {...commonProps} style={{
            backgroundColor: element.props.backgroundColor,
            borderRadius: element.props.borderRadius,
            padding: element.props.padding,
            boxShadow: element.props.shadow === "md" ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
            width: element.props.width,
          }}>
            {element.children?.map(child => renderElement(child, isPreview))}
          </div>
        );

      case "divider":
        return (
          <hr {...commonProps} style={{
            borderColor: element.props.color,
            borderWidth: element.props.thickness,
            borderStyle: element.props.style,
            margin: element.props.margin,
          }} />
        );

      case "spacer":
        return <div {...commonProps} style={{ height: element.props.height }} />;

      case "link":
        return (
          <a {...commonProps} href={element.props.href} style={{
            color: element.props.color,
            fontSize: element.props.fontSize,
            textDecoration: element.props.underline ? "underline" : "none",
          }}>
            {element.props.text}
          </a>
        );

      case "container":
        return (
          <div {...commonProps} style={{
            backgroundColor: element.props.backgroundColor,
            padding: element.props.padding,
            borderRadius: element.props.borderRadius,
            maxWidth: element.props.maxWidth,
          }}>
            {element.children?.map(child => renderElement(child, isPreview))}
          </div>
        );

      default:
        return <div {...commonProps}>Unknown element</div>;
    }
  };

  const selectedElementData = activePage ? 
    (activePage.elements.find(el => el.id === selectedElement) || 
     activePage.elements.flatMap(el => el.children || []).find(el => el.id === selectedElement))
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">{tr("Visual Page Builder", "منشئ الصفحات المرئي")}</h3>
          <p className="text-sm text-muted-foreground">{tr("Create custom pages and features", "أنشئ صفحات وميزات مخصصة")}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="btn-secondary px-4 py-2 rounded-xl text-sm flex items-center gap-2"
          >
            <Layout size={14} />
            {tr("Templates", "قوالب")}
          </button>
        </div>
      </div>

      {/* New Page Form */}
      {!activePage && (
        <div className="card-elevated rounded-2xl p-6 space-y-4">
          <h4 className="font-bold">{tr("Create New Page", "إنشاء صفحة جديدة")}</h4>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input-field"
              placeholder="Page Name (EN)"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
            />
            <input
              className="input-field"
              placeholder="اسم الصفحة (AR)"
              value={newPageNameAr}
              onChange={(e) => setNewPageNameAr(e.target.value)}
            />
          </div>
          <button onClick={createNewPage} className="btn-primary w-full py-3 rounded-xl">
            <Plus size={16} className="inline mr-2" />
            {tr("Create Page", "إنشاء الصفحة")}
          </button>

          {/* Existing Pages */}
          {pages.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-bold text-sm mb-3">{tr("Your Pages", "صفحاتك")}</h4>
              <div className="grid grid-cols-2 gap-2">
                {pages.map(page => (
                  <button
                    key={page.id}
                    onClick={() => setActivePage(page)}
                    className="card p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-semibold text-sm">{page.name}</p>
                    <p className="text-xs text-muted-foreground">{page.path}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="card-elevated rounded-2xl p-6">
          <h4 className="font-bold mb-4">{tr("Choose a Template", "اختر قالباً")}</h4>
          <div className="grid grid-cols-3 gap-3">
            {PRESET_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => activePage ? applyTemplate(template) : (setActivePage({
                  id: `page_${Date.now()}`,
                  name: template.name,
                  nameAr: template.nameAr,
                  path: `/${template.id}`,
                  elements: template.elements as PageElement[],
                  createdAt: Date.now(),
                  createdBy: "admin",
                }), setShowTemplates(false))}
                className="card p-4 text-left hover:ring-2 hover:ring-primary transition-all"
              >
                <div className="w-full h-16 bg-muted rounded-lg mb-2 flex items-center justify-center text-2xl">
                  {template.id === "promo" ? "🎉" : template.id === "about" ? "☕" : "📞"}
                </div>
                <p className="font-semibold text-sm">{lang === "ar" ? template.nameAr : template.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      {activePage && (
        <div className="grid grid-cols-3 gap-4">
          {/* Elements Toolbar */}
          <div className="card-elevated rounded-2xl p-4">
            <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Plus size={14} />
              {tr("Add Element", "إضافة عنصر")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {ELEMENT_TYPES.map(({ type, label, labelAr, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => addElement(type)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Icon size={18} className="text-primary" />
                  <span className="text-[10px] font-medium">{lang === "ar" ? labelAr : label}</span>
                </button>
              ))}
            </div>

            {/* Page Settings */}
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-bold text-sm mb-3">{tr("Page Settings", "إعدادات الصفحة")}</h4>
              <div className="space-y-2">
                <input
                  className="input-field text-sm"
                  value={activePage.name}
                  onChange={(e) => setActivePage({ ...activePage, name: e.target.value })}
                  placeholder="Page name"
                />
                <input
                  className="input-field text-sm"
                  value={activePage.nameAr}
                  onChange={(e) => setActivePage({ ...activePage, nameAr: e.target.value })}
                  placeholder="اسم الصفحة"
                />
                <input
                  className="input-field text-sm"
                  value={activePage.path}
                  onChange={(e) => setActivePage({ ...activePage, path: e.target.value })}
                  placeholder="/page-path"
                />
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="col-span-2 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`btn-secondary px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${previewMode ? "bg-primary text-primary-foreground" : ""}`}
              >
                <Eye size={14} />
                {tr("Preview", "معاينة")}
              </button>
              <button
                onClick={savePage}
                disabled={saving}
                className="btn-primary px-4 py-2 rounded-xl text-sm flex items-center gap-2"
              >
                <Save size={14} />
                {saving ? tr("Saving...", "جاري الحفظ...") : tr("Save Page", "حفظ الصفحة")}
              </button>
              <button
                onClick={() => setActivePage(null)}
                className="btn-ghost px-4 py-2 rounded-xl text-sm"
              >
                {tr("Back", "رجوع")}
              </button>
            </div>

            {/* Canvas Area */}
            <div className={`bg-white rounded-2xl p-6 min-h-[400px] border-2 ${previewMode ? "border-transparent" : "border-dashed border-gray-300"}`}>
              {activePage.elements.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Layout size={48} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{tr("Add elements to start building", "أضف عناصر للبدء في البناء")}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {activePage.elements.map(element => renderElement(element, previewMode))}
                </div>
              )}
            </div>

            {/* Element Properties */}
            {selectedElementData && !previewMode && (
              <div className="card-elevated rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-sm">{tr("Element Properties", "خصائص العنصر")}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteElement(selectedElementData.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => setSelectedElement(null)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {Object.entries(selectedElementData.props || {}).map(([key, value]) => (
                    <div key={key}>
                      <label className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                      {typeof value === "string" && (key.includes("color") || key.includes("background")) ? (
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={value.startsWith("#") ? value : "#000000"}
                            onChange={(e) => updateElement(selectedElementData.id, {
                              props: { ...selectedElementData.props, [key]: e.target.value }
                            })}
                            className="w-10 h-8 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateElement(selectedElementData.id, {
                              props: { ...selectedElementData.props, [key]: e.target.value }
                            })}
                            className="input-field text-sm flex-1"
                          />
                        </div>
                      ) : typeof value === "string" ? (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateElement(selectedElementData.id, {
                            props: { ...selectedElementData.props, [key]: e.target.value }
                          })}
                          className="input-field text-sm"
                        />
                      ) : typeof value === "number" ? (
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => updateElement(selectedElementData.id, {
                            props: { ...selectedElementData.props, [key]: parseInt(e.target.value) }
                          })}
                          className="input-field text-sm"
                        />
                      ) : typeof value === "boolean" ? (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => updateElement(selectedElementData.id, {
                              props: { ...selectedElementData.props, [key]: e.target.checked }
                            })}
                          />
                          <span className="text-sm">{tr("Yes", "نعم")}</span>
                        </label>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}