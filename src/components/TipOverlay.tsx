import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { ChevronRight, Sparkles, Coffee, MessageCircle, Star } from "lucide-react";

interface TipOverlayProps { onComplete: () => void; }

const TIPS = [
  {
    icon: <Coffee size={32} />,
    title: { en: "Welcome to Azura ☕", ar: "أهلاً بيك في أزورا ☕" },
    desc: { en: "Your favorite café experience — explore our full menu, discover amazing flavors, and enjoy every moment.", ar: "تجربة كافيهك المفضل — استكشف القائمة الكاملة واكتشف نكهات رائعة واستمتع بكل لحظة." },
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: <Sparkles size={32} />,
    title: { en: "AI Barista ✨", ar: "البارستا الذكي ✨" },
    desc: { en: "Chat with Zura, our AI barista, to get personalized recommendations and learn about any menu item!", ar: "تكلم مع زورا البارستا الذكي عشان توصيات شخصية وتعرف أكتر عن أي عنصر في المنيو!" },
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: <MessageCircle size={32} />,
    title: { en: "Live Support 💬", ar: "الدعم المباشر 💬" },
    desc: { en: "Need help? Chat with our friendly team instantly through the Support tab — we're always here for you!", ar: "محتاج مساعدة؟ تكلم مع فريقنا الودود فوراً من تبويب الدعم — دايماً هنا!" },
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: <Star size={32} />,
    title: { en: "Share Feedback ⭐", ar: "شارك رأيك ⭐" },
    desc: { en: "Rate your experience and suggest new items from the Ideas tab. Your opinion shapes our menu!", ar: "قيّم تجربتك واقترح عناصر جديدة من تبويب الأفكار. رأيك يشكّل قائمتنا!" },
    color: "from-green-500 to-emerald-500",
  },
];

export default function TipOverlay({ onComplete }: TipOverlayProps) {
  const { lang } = useLang();
  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;
  const [step, setStep] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  const currentTip = TIPS[step];
  const isLast = step === TIPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      setFadeOut(true);
      setTimeout(() => { localStorage.setItem("azura_tip_seen", "true"); onComplete(); }, 400);
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    setFadeOut(true);
    setTimeout(() => { localStorage.setItem("azura_tip_seen", "true"); onComplete(); }, 400);
  };

  return (
    <div className={`fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 transition-opacity duration-300 ${fadeOut ? "opacity-0" : "opacity-100"}`}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center gap-2 mb-6">
          {TIPS.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/40" : "w-2 bg-white/20"}`} />
          ))}
        </div>
        <div className="bg-card rounded-3xl overflow-hidden shadow-2xl">
          <div className={`relative h-32 bg-gradient-to-br ${currentTip.color} flex items-center justify-center`}>
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-xl animate-bounce" style={{ animationDuration: "2s" }}>
              {currentTip.icon}
            </div>
          </div>
          <div className="p-6 text-center">
            <h2 className="text-lg font-bold mb-2">{tr(currentTip.title.en, currentTip.title.ar)}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">{tr(currentTip.desc.en, currentTip.desc.ar)}</p>
            <div className="flex gap-3">
              <button onClick={handleSkip} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                {tr("Skip", "تخطي")}
              </button>
              <button onClick={handleNext} className={`flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${currentTip.color} shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2`}>
                {isLast ? tr("Let's Go! 🚀", "يلا نبدأ! 🚀") : tr("Next", "التالي")}
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-white/50 text-xs mt-4">{step + 1} / {TIPS.length}</p>
      </div>
    </div>
  );
}
