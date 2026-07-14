import { useState, useEffect, useRef } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { ChevronRight, Sparkles, Coffee, MessageCircle, Star, Play } from "lucide-react";

interface TipOverlayProps {
  onComplete: () => void;
}

interface Tip {
  icon: React.ReactNode;
  title: { en: string; ar: string };
  desc: { en: string; ar: string };
  color: string;
}

const TIPS: Tip[] = [
  {
    icon: <Coffee size={32} />,
    title: { en: "Welcome to DDS ⚙️", ar: "أهلاً بيك في نظام DDS ⚙️" },
    desc: { en: "Your smart dynamic catalog, now at your fingertips! Explore interactive components.", ar: "كتالوجك الذكي التفاعلي، الآن بين يديك! استكشف المكونات فورياً." },
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: <Sparkles size={32} />,
    title: { en: "AI Personalization ✨", ar: "الذكاء الاصطناعي ✨" },
    desc: { en: "Interactive multi-agent swarms assist you with everything dynamically!", ar: "أسراب ذكاء اصطناعي متعددة المهام تساندك في كل شيء فورياً!" },
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: <MessageCircle size={32} />,
    title: { en: "Live Interactions 📦", ar: "التفاعل المباشر 📦" },
    desc: { en: "Real-time updates on services, rosters, and products. Sync on the fly!", ar: "مزامنة وتحديثات فورية للخدمات والمنتجات والأصناف المتاحة!" },
    color: "from-teal-500 to-cyan-500",
  },
  {
    icon: <Star size={32} />,
    title: { en: "Quality Standard ⭐", ar: "تقييم الجودة ⭐" },
    desc: { en: "Continuous optimization through analytical customer feedback monitors.", ar: "تحسين مستمر عبر نظام متقدم لرصد وتحليل آراء العملاء." },
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
      setTimeout(() => {
        localStorage.setItem("dds_tip_seen", "true");
        onComplete();
      }, 400);
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    setFadeOut(true);
    setTimeout(() => {
      localStorage.setItem("dds_tip_seen", "true");
      onComplete();
    }, 400);
  };

  return (
    <div className={`fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 transition-opacity duration-300 ${fadeOut ? "opacity-0" : "opacity-100"}`}>
      <div className="w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {TIPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/40" : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Tip card */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-2xl">
          {/* Animated header */}
          <div className={`relative h-32 bg-gradient-to-br ${currentTip.color} flex items-center justify-center`}>
            <div className={`w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-xl animate-bounce`} style={{ animationDuration: "2s" }}>
              {currentTip.icon}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <h2 className="text-lg font-bold mb-2">{tr(currentTip.title.en, currentTip.title.ar)}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">{tr(currentTip.desc.en, currentTip.desc.ar)}</p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                {tr("Skip", "تخطي")}
              </button>
              <button
                onClick={handleNext}
                className={`flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${currentTip.color} shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2`}
              >
                {isLast ? tr("Let's Go! 🚀", "يلا نبدأ! 🚀") : tr("Next", "التالي")}
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Step counter */}
        <p className="text-center text-white/50 text-xs mt-4">
          {step + 1} / {TIPS.length}
        </p>
      </div>
    </div>
  );
}