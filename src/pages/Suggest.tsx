import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { db, ref, push, set } from "@/lib/firebase";
import { Lightbulb, AlertTriangle, Send, CheckCircle, Upload, Sparkles, MessageSquare } from "lucide-react";
import { compressToBase64 } from "@/lib/imageUtils";
import { swalError } from "@/lib/swal";

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
    { id: "coffee", en: "Coffee", ar: "قهوة", icon: "☕" },
    { id: "desserts", en: "Desserts", ar: "حلويات", icon: "🍰" },
    { id: "beverages", en: "Beverages", ar: "مشروبات", icon: "🧃" },
    { id: "food", en: "Food", ar: "طعام", icon: "🍔" },
    { id: "snacks", en: "Snacks", ar: "مقبلات", icon: "🍿" },
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
      swalError(tr("Failed to upload image", "فشل في رفع الصورة"));
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (type === "suggest" && !name.trim()) {
      swalError(tr("Please enter item name", "الرجاء إدخال اسم العنصر"));
      return;
    }
    if (type === "report" && !reportDesc.trim()) {
      swalError(tr("Please describe the issue", "الرجاء وصف المشكلة"));
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
      swalError(tr("Failed to submit", "فشل في الإرسال"));
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
        <div className="card-elevated rounded-3xl p-8 text-center max-w-sm w-full space-y-5">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle size={40} className="text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              {type === "suggest" 
                ? tr("Got it! 🎉", "تمام! 🎉")
                : tr("Got it! 📋", "تمام! 📋")
              }
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {type === "suggest"
                ? tr("Your idea is with our team. We'll consider adding it to the menu!", "فكرتك عند فريقنا. هندرس اضافتها للقائمة!")
                : tr("We'll take a look and fix it as soon as possible.", "هنشوف المشكلة ونصلحها بأسرع وقت.")
              }
            </p>
          </div>
          <button onClick={resetForm} className="btn-primary w-full py-3.5 rounded-xl font-semibold">
            {tr("Share another idea", "شارك فكرة تانية")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 pb-16">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Lightbulb size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{tr("Your Ideas","أفكارك")}</h1>
            <p className="text-primary-foreground/80 text-sm mt-0.5">{tr("Suggest items or report issues","اقترح عناصر أو ابلغ عن مشاكل")}</p>
          </div>
        </div>
      </div>

      {/* Type Toggle - Floating Card */}
      <div className="px-4 -mt-10">
        <div className="card-elevated rounded-2xl p-1.5 flex shadow-xl">
          <button
            onClick={() => setType("suggest")}
            className={`flex-1 py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 font-semibold transition-all ${
              type === "suggest" 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Lightbulb size={18} /> 
            <span className="text-sm">{tr("Suggest","اقترح")}</span>
          </button>
          <button
            onClick={() => setType("report")}
            className={`flex-1 py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 font-semibold transition-all ${
              type === "report" 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <MessageSquare size={18} /> 
            <span className="text-sm">{tr("Feedback","رأي")}</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 mt-6 space-y-5">
        {type === "suggest" ? (
          <>
            {/* Suggest Form */}
            <div className="card-elevated rounded-2xl p-5 space-y-5">
              <div className="flex items-center gap-2 text-primary">
                <Lightbulb size={18} />
                <span className="font-semibold text-sm">{tr("What would you like to see on our menu?","إيه اللي تحب تشوفه في قائمتنا؟")}</span>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr("Item Name","اسم العنصر")}</label>
                  <input
                    type="text"
                    className="input-field px-4 py-3.5 w-full rounded-xl text-base"
                    placeholder={tr("What do you have in mind?","إيه اللي في بالك؟")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr("Category","الفئة")}</label>
                  <div className="grid grid-cols-5 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`py-3 rounded-xl text-center transition-all ${
                          category === cat.id 
                            ? "bg-primary text-primary-foreground shadow-md" 
                            : "bg-muted text-muted-foreground hover:bg-secondary/20"
                        }`}
                      >
                        <span className="text-lg">{cat.icon}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr("Details (optional)","التفاصيل (اختياري)")}</label>
                  <textarea
                    className="input-field px-4 py-3 w-full min-h-[70px] resize-none rounded-xl"
                    placeholder={tr("Describe it! Size, taste, ingredients...","صفه! الحجم، الطعم، المكونات...")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr("Picture (optional)","صورة (اختياري)")}</label>
                  {image ? (
                    <div className="relative w-full h-28 rounded-xl overflow-hidden border-2 border-border">
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setImage("")}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all block">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <Upload size={22} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {uploading ? tr("Compressing...","جاري الضغط...") : tr("Add a photo of the item","ضيف صورة للعنصر")}
                      </p>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Report/Feedback Form */}
            <div className="card-elevated rounded-2xl p-5 space-y-5">
              <div className="flex items-center gap-2 text-primary">
                <AlertTriangle size={18} />
                <span className="font-semibold text-sm">{tr("Tell us what's on your mind","قولنا إيه اللي في بالك")}</span>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tr("Your Feedback","رأييك")}</label>
                  <textarea
                    className="input-field px-4 py-3.5 w-full min-h-[140px] resize-none rounded-xl text-base"
                    placeholder={tr("Missing something? Wrong price? Slow service? Just tell us!","في حاجة ناقصة؟ سعر غلط؟ خدمة بطيئة؟ قولنا بس!")}
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                  />
                </div>

                <div className="bg-muted/50 rounded-xl p-4 text-sm text-foreground space-y-1">
                  <p className="font-semibold">💡 {tr("We read every message!","بنقرأ كل رسالة!")}</p>
                  <p className="text-muted-foreground text-xs">{tr("From missing items to wrong prices, we want to know.","من عناصر ناقصة لحد أسعار غلط، عايزين نعرف.")}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || (type === "suggest" && !name.trim()) || (type === "report" && !reportDesc.trim())}
          className="w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              {tr("Sending...","جاري الإرسال...")}
            </>
          ) : (
            <>
              <Send size={18} /> 
              {type === "suggest" ? tr("Send Suggestion","ابعت الاقتراح") : tr("Send Feedback","ابعت الراي")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}