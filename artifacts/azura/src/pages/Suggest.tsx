import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { db, ref, push, set } from "@/lib/firebase";
import { Lightbulb, AlertTriangle, Send, CheckCircle, ImageIcon, Upload } from "lucide-react";
import { compressToBase64 } from "@/lib/imageUtils";

export default function Suggest() {
  const { lang, isRTL } = useLang();
  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  const [type, setType] = useState<"suggest" | "report">("suggest");
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("coffee");
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportDesc, setReportDesc] = useState("");

  const categories = [
    { id: "coffee", en: "Coffee ☕", ar: "قهوة ☕" },
    { id: "desserts", en: "Desserts 🍰", ar: "حلويات 🍰" },
    { id: "beverages", en: "Beverages 🧃", ar: "مشروبات 🧃" },
    { id: "food", en: "Food 🍔", ar: "طعام 🍔" },
    { id: "snacks", en: "Snacks 🍿", ar: "مقبلات 🍿" },
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await compressToBase64(file, 400, 0.72);
      setImage(base64);
    } catch (err) {
      console.error(err);
      alert(tr("Failed to upload image", "فشل في رفع الصورة"));
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (type === "suggest" && !name.trim()) {
      alert(tr("Please enter item name", "الرجاء إدخال اسم العنصر"));
      return;
    }
    if (type === "report" && !reportDesc.trim()) {
      alert(tr("Please describe the issue", "الرجاء وصف المشكلة"));
      return;
    }

    setSubmitting(true);
    try {
      if (type === "suggest") {
        const r = push(ref(db, "suggestions"));
        await set(r, {
          itemName: name,
          itemNameAr: nameAr,
          description,
          category,
          image,
          status: "pending",
          votes: 1,
          createdAt: Date.now(),
          authorName: "Guest",
        });
      } else {
        const r = push(ref(db, "reports"));
        await set(r, {
          description: reportDesc,
          type: "issue",
          status: "pending",
          createdAt: Date.now(),
          authorName: "Guest",
        });
      }
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert(tr("Failed to submit", "فشل في الإرسال"));
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setName("");
    setNameAr("");
    setDescription("");
    setCategory("coffee");
    setImage("");
    setReportDesc("");
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="card-elevated rounded-2xl p-8 text-center max-w-sm w-full space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {type === "suggest" 
              ? tr("Thank you for your suggestion!", "شكراً على اقتراحك!")
              : tr("Thank you for your report!", "شكراً على بلاغك!")
            }
          </h2>
          <p className="text-muted-foreground text-sm">
            {type === "suggest"
              ? tr("We'll review your suggestion and add it if possible.", "سنراجع اقتراحك ونضيفه إن أمكن.")
              : tr("We'll look into this issue and fix it.", "سنتحقق من هذه المشكلة ونصلحها.")
            }
          </p>
          <button onClick={resetForm} className="btn-primary w-full py-3 rounded-xl">
            {tr("Submit Another", "إرسال آخر")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 pb-8 rounded-b-3xl">
        <h1 className="text-2xl font-bold">{tr("Suggest & Report","اقترح وأبلغ")}</h1>
        <p className="text-primary-foreground/80 text-sm mt-1">{tr("Help us improve your experience","ساعدنا في تحسين تجربتك")}</p>
      </div>

      {/* Type Toggle */}
      <div className="px-4 -mt-4">
        <div className="card rounded-2xl p-2 flex gap-2">
          <button
            onClick={() => setType("suggest")}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
              type === "suggest" ? "btn-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            <Lightbulb size={18} /> {tr("Suggest Item","اقترح عنصر")}
          </button>
          <button
            onClick={() => setType("report")}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
              type === "report" ? "btn-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            <AlertTriangle size={18} /> {tr("Report Issue","أبلغ عن مشكلة")}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 mt-4 space-y-4">
        {type === "suggest" ? (
          <>
            {/* Item Name */}
            <div className="card-elevated rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Lightbulb size={18} className="text-primary" /> {tr("What would you like to see?","ماذا تحب تشوف؟")}
              </h3>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">{tr("Item Name (English)","اسم العنصر (إنجليزي)")}</label>
                <input
                  type="text"
                  className="input-field px-4 py-3 w-full"
                  placeholder={tr("e.g. Nutella Frappuccino","مثال: نوتيلا فرابتشينو")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">{tr("Item Name (Arabic)","اسم العنصر (عربي)")}</label>
                <input
                  type="text"
                  className="input-field px-4 py-3 w-full"
                  placeholder={tr("مثال: نوتيلا فرابتشينو","مثال: نوتيلا فرابتشينو")}
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">{tr("Category","الفئة")}</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        category === cat.id 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground hover:bg-primary/10"
                      }`}
                    >
                      {lang === "ar" ? cat.ar : cat.en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">{tr("Description (optional)","الوصف (اختياري)")}</label>
                <textarea
                  className="input-field px-4 py-3 w-full min-h-[80px] resize-none"
                  placeholder={tr("Describe the item...","صف العنصر...")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">{tr("Image (optional)","الصورة (اختياري)")}</label>
                {image ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setImage("")}
                      className="absolute top-2 right-2 btn-icon w-8 h-8 bg-destructive text-white"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-muted rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors block">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {uploading ? tr("Uploading...", "جاري الرفع...") : tr("Click to upload image", "انقر لرفع صورة")}
                    </p>
                  </label>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Report Issue */}
            <div className="card-elevated rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <AlertTriangle size={18} className="text-destructive" /> {tr("What's the issue?","إيه المشكلة؟")}
              </h3>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">{tr("Describe the problem","صف المشكلة")}</label>
                <textarea
                  className="input-field px-4 py-3 w-full min-h-[120px] resize-none"
                  placeholder={tr("e.g. The wifi isn't working, or there's a missing item from the menu...","مثال: الواي فاي مش شغاله، أو فيه عنصر ناقص من القائمة...")}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                />
              </div>

              <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800">
                <p>💡 {tr("Common issues: missing items, wrong prices, technical problems, slow service.","المشاكل الشائعة: عناصر ناقصة، أسعار غلط، مشاكل تقنية، خدمة بطيئة.")}</p>
              </div>
            </div>
          </>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || (type === "suggest" && !name.trim()) || (type === "report" && !reportDesc.trim())}
          className="btn-primary w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <>{tr("Sending...","جاري الإرسال...")}</>
          ) : (
            <>
              <Send size={18} /> {tr("Submit","إرسال")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}