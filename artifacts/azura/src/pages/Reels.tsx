import { useState, useEffect, useRef } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { Heart, Share2, Play, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { Link } from "wouter";

interface ReelSlide {
  id: string;
  image: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  emoji: string;
}

const APP_REELS: ReelSlide[] = [
  {
    id: "welcome",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    title: "Welcome to Azura Cafe",
    titleAr: "مرحباً بكم في كافيه أزورا",
    subtitle: "Your favorite spot for delicious food & drinks",
    subtitleAr: "وجهتك المفضلة للطعام والمشروبات اللذيذة",
    emoji: "🎉"
  },
  {
    id: "menu",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
    title: "Browse Our Menu",
    titleAr: "تصفح قائمتنا",
    subtitle: "Swipe through 200+ items • Food • Drinks • Desserts",
    subtitleAr: "مرر بين 200+ صنف • طعام • مشروبات • حلويات",
    emoji: "📱"
  },
  {
    id: "order",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    title: "Order Easily",
    titleAr: "اطلب بسهولة",
    subtitle: "Add to cart • Check out • Done!",
    subtitleAr: "أضف للسلة • ادفع • خلاص!",
    emoji: "🛒"
  },
  {
    id: "ai",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80",
    title: "AI Assistant",
    titleAr: "المساعد الذكي",
    subtitle: "Ask for recommendations • Get personalized suggestions",
    subtitleAr: "اسأل عن توصيات • احصل على اقتراحات شخصية",
    emoji: "🤖"
  },
  {
    id: "track",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    title: "Track Your Order",
    titleAr: "تابع طلبك",
    subtitle: "Real-time updates • Know when it's ready",
    subtitleAr: "تحديثات مباشرة • اعرف متى يجهز",
    emoji: "📍"
  },
  {
    id: "shisha",
    image: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&q=80",
    title: "Shisha Time?",
    titleAr: "وقت الشيشة؟",
    subtitle: "Choose from premium flavors • Relax & enjoy",
    subtitleAr: "اختر من النكهات الفاخرة • استرخ واستمتع",
    emoji: "💨"
  },
  {
    id: "desserts",
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80",
    title: "Sweet Treats",
    titleAr: "حلويات لذيذة",
    subtitle: "Cakes • Crepes • Pancakes • And more!",
    subtitleAr: "كيك • كريب • بان كيك والمزيد!",
    emoji: "🍰"
  },
  {
    id: "start",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80",
    title: "Let's Go!",
    titleAr: "يلا نبدأ!",
    subtitle: "Tap Menu to start exploring",
    subtitleAr: "اضغط على القائمة وابدأ الاستكشاف",
    emoji: "☕"
  },
];

export default function Reels() {
  const { lang } = useLang();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const handleScroll = () => {
      const index = Math.round(el.scrollTop / window.innerHeight);
      setCurrentIndex(index);
    };
    
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const reel = APP_REELS[currentIndex];

  return (
    <div className="h-screen w-full fixed inset-0 bg-black">
      {/* Vertical Scroll */}
      <div 
        ref={scrollRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
      >
        {APP_REELS.map((slide, index) => {
          const isActive = index === currentIndex;
          
          return (
            <div 
              key={slide.id}
              className="h-screen w-full snap-start flex flex-col relative overflow-hidden"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img 
                  src={slide.image} 
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80"; }}
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full p-6 items-center justify-center text-center">
                {/* Emoji */}
                <div className="text-6xl mb-6 animate-bounce">{slide.emoji}</div>
                
                {/* Title */}
                <h2 className="text-white text-3xl font-bold mb-4" style={{ fontFamily: "Georgia, serif" }}>
                  {tr(slide.title, slide.titleAr)}
                </h2>
                
                {/* Subtitle */}
                <p className="text-white/80 text-lg max-w-md">
                  {tr(slide.subtitle, slide.subtitleAr)}
                </p>

                {/* CTA for last slide */}
                {slide.id === "start" && (
                  <Link href="/menu">
                    <button className="mt-8 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl text-white font-bold text-lg shadow-xl hover:scale-105 transition-transform">
                      {tr("Explore Menu 🍽️", "استكشف القائمة 🍽️")}
                    </button>
                  </Link>
                )}
              </div>

              {/* Progress dots */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
                {APP_REELS.map((_, i) => (
                  <div 
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? "bg-white h-6" : "bg-white/30"}`}
                  />
                ))}
              </div>

              {/* Swipe hint */}
              <div className="absolute bottom-20 inset-x-0 flex flex-col items-center text-white/50 z-20">
                <span className="text-xs mb-1">{tr("Swipe up", "اسحب لأعلى")}</span>
                <div className="animate-bounce"><ChevronDown size={20} /></div>
              </div>

              {/* Counter */}
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-bold z-20">
                {currentIndex + 1}/{APP_REELS.length}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
