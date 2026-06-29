import { useState, useEffect } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBarista } from "@/contexts/BaristaContext";
import { db, ref, onValue, off } from "@/lib/firebase";
import { Globe, Coffee, X } from "lucide-react";
import { type Lang } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

type Screen = "splash" | "main";

const SUMMER_PHRASE = "Summer Edition";
const BEACH_BG =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80";

export default function Welcome() {
  const { lang, setLang, isRTL } = useLang();
  const { loginAnonymous } = useAuth();
  const { persona, setPersona } = useBarista();

  const [screen, setScreen] = useState<Screen>("splash");
  const [tableNum, setTableNum] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* Summer splash state */
  const [splashPhase, setSplashPhase] = useState(0); // 0=hidden 1=visible 2=logo+text

  // Homepage Banner
  const [banner, setBanner] = useState<{
    content: string; bgColor: string; textColor: string; enabled: boolean;
  } | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  /* Load banner */
  useEffect(() => {
    const bannerRef = ref(db, "homepage-banner");
    onValue(bannerRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val() as { content: string; bgColor: string; textColor: string; enabled: boolean };
        if (data.enabled) setBanner(data);
      }
    });
    return () => off(bannerRef);
  }, []);

  /* Splash animation sequence → transition to main */
  useEffect(() => {
    const t0 = setTimeout(() => setSplashPhase(1), 80);
    const t1 = setTimeout(() => setSplashPhase(2), 400);
    const t2 = setTimeout(() => setScreen("main"), 5000); // More time for premium feel
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  const handleGuestLogin = async () => {
    const n = parseInt(tableNum);
    if (!name.trim()) { setError(tr("Please enter your name", "يرجى إدخال اسمك")); return; }
    if (!tableNum.trim() || isNaN(n) || n < 1 || n > 99) {
      setError(tr("Enter a valid table number (1-99)", "ادخل رقم طاولة صحيح (1-99)")); return;
    }
    setLoading(true);
    try { await loginAnonymous(name.trim(), tableNum.trim()); }
    catch { setError(tr("Something went wrong. Try again.", "حدث خطأ، حاول مجدداً")); }
    setLoading(false);
  };

  const inp = "input-field px-4 py-3";

  /* ── SUMMER SPLASH ──────────────────────────────────────────── */
  if (screen === "splash") {
    return (
      <div
        className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Beach background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{
            backgroundImage: `url("${BEACH_BG}")`,
            opacity: splashPhase >= 1 ? 1 : 0,
          }}
        />

        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,18,40,0.60) 0%, rgba(0,10,28,0.50) 40%, rgba(0,6,18,0.75) 100%)",
          }}
        />

        {/* Animated golden light waves */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-px"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,220,120,0.7), transparent)",
                top: `${28 + i * 22}%`,
                opacity: splashPhase >= 1 ? 0.22 : 0,
                animation: splashPhase >= 1
                  ? `waveSlide ${4 + i * 1.5}s ease-in-out ${i * 0.8}s infinite`
                  : "none",
                transition: "opacity 1s",
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div
          className="relative z-10 flex flex-col items-center px-6 w-full max-w-sm"
          style={{
            opacity: splashPhase >= 1 ? 1 : 0,
            transform: splashPhase >= 1 ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
        >
          {/* Logo */}
          <div className="mb-5">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-2xl blur-xl opacity-50"
                style={{ background: "rgba(255,200,80,0.45)", transform: "scale(1.15) translateY(6px)" }}
              />
              <div
                className="relative rounded-2xl p-[3px] border border-white/20"
                style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(10px)" }}
              >
                <img
                  src="/logo.jpg"
                  alt="Azura"
                  className="w-[88px] h-[88px] rounded-[18px] object-cover"
                  style={{ boxShadow: "0 6px 28px rgba(0,0,0,0.45)" }}
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Cafe label */}
          <p
            className="text-white/65 text-xs font-semibold mb-1"
            style={{ letterSpacing: "0.22em", textTransform: "uppercase" }}
          >
            {tr("AZURA CAFE", "أزورا كافيه")}
          </p>

          {/* "Summer Edition" iPhone-style handwritten reveal */}
          <div className="relative flex items-center justify-center min-h-[4rem]">
             <motion.h1
              className="handwritten-text flex flex-wrap justify-center"
              style={{
                fontFamily: "var(--font-handwritten)",
                fontSize: "clamp(2.4rem, 8vw, 3.2rem)",
                lineHeight: 1.18,
                color: "#FFD97D",
                textShadow: "0 2px 18px rgba(255,200,60,0.6), 0 4px 36px rgba(255,140,0,0.28)",
                letterSpacing: "0.01em",
                textAlign: "center",
              }}
            >
              {SUMMER_PHRASE.split("").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{
                    opacity: 0,
                    x: -2,
                    y: 2,
                    scale: 0.95,
                    filter: "blur(2px)",
                    clipPath: "inset(0 100% 0 0)"
                  }}
                  animate={splashPhase >= 2 ? {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    scale: 1,
                    filter: "blur(0px)",
                    clipPath: "inset(0 0 0 0)",
                    transition: {
                      delay: 0.8 + (index * 0.12),
                      duration: 0.8,
                      ease: "easeOut"
                    }
                  } : {}}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.h1>
          </div>

          {/* Slogan */}
          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={splashPhase >= 2 ? {
              opacity: 1,
              y: 0,
              transition: { delay: 2.5, duration: 1.2 }
            } : {}}
          >
            <p
              className="text-white/55 text-[11px] font-medium"
              style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              {tr("The quality is a habit", "الجودة عادة")}
            </p>
            <div className="mx-auto mt-2 h-px w-20 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </motion.div>

          {/* Loading dots */}
          <motion.div
            className="flex gap-1.5 mt-10"
            initial={{ opacity: 0 }}
            animate={splashPhase >= 2 ? {
              opacity: 1,
              transition: { delay: 3.2, duration: 1 }
            } : {}}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-white/40 dot-pulse"
                style={{ animationDelay: `${i * 0.22}s` }}
              />
            ))}
          </motion.div>
        </div>

        {/* Version */}
        <p className="absolute bottom-4 text-white/25 text-[9px] z-10">
          v2.1 · Summer 2025
        </p>

        <style>{`
          @keyframes waveSlide {
            0%, 100% { transform: translateX(-60%) scaleX(0.6); }
            50%       { transform: translateX(20%)  scaleX(1.4); }
          }
        `}</style>
      </div>
    );
  }

  /* ── MAIN LOGIN SCREEN ──────────────────────────────────────── */
  const BG = (
    <>
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(35,65%,68%,0.28), transparent 70%)", transform: "translate(30%,-30%)" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(22,55%,38%,0.18), transparent 70%)", transform: "translate(-30%,30%)" }} />
      {[
        { x: "10%", y: "18%", s: 0.7, d: "6s" },
        { x: "85%", y: "25%", s: 0.6, d: "8s" },
        { x: "15%", y: "72%", s: 0.55, d: "7s" },
        { x: "80%", y: "70%", s: 0.6, d: "5s" },
      ].map((b, i) => (
        <div key={i} className="absolute pointer-events-none select-none rounded-full"
          style={{ left: b.x, top: b.y, width: "1.5rem", height: "1.5rem", opacity: 0.1, background: "hsl(var(--primary))", animation: `floatBob ${b.d} ease-in-out infinite`, animationDelay: `${i * 0.8}s` }} />
      ))}
    </>
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-8 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg,hsl(38,52%,90%) 0%,hsl(35,42%,85%) 50%,hsl(28,46%,82%) 100%)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {BG}

      {/* Language toggle */}
      <div className="fixed top-4 right-4 z-10 flex items-center gap-1 rounded-full px-3 py-1.5"
        style={{ background: "hsla(var(--card),0.92)", backdropFilter: "blur(10px)", boxShadow: "var(--shadow-sm)" }}>
        <Globe size={12} className="text-muted-foreground" />
        {(["en", "ar"] as Lang[]).map((l) => (
          <button key={l} onClick={() => { setLang(l); setError(""); }}
            className={`text-xs font-bold px-2 py-0.5 rounded-full transition-all ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {l === "en" ? "EN" : "عربي"}
          </button>
        ))}
      </div>

      {/* Homepage Banner */}
      {banner && !bannerDismissed && (
        <div
          className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
          style={{ background: banner.bgColor || "#FF6B35", color: banner.textColor || "#fff" }}
        >
          <div className="flex-1 text-center text-sm font-semibold" dangerouslySetInnerHTML={{ __html: banner.content }} />
          <button onClick={() => setBannerDismissed(true)} className="ml-3 p-1 hover:opacity-70 transition-opacity">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="w-full max-w-sm page-enter">
        {/* Logo & heading */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-[28px] blur-xl opacity-35" style={{ background: "hsl(var(--primary))", transform: "scale(0.9) translateY(8px)" }} />
            <div className="relative rounded-[28px] p-1.5" style={{ background: "hsl(var(--card))", boxShadow: "0 20px 50px rgba(93,62,35,0.22)" }}>
              <img src="/logo.jpg" alt="Azura" className="w-24 h-24 rounded-[22px] object-cover" loading="lazy" />
              {/* Summer edition badge */}
              <div
                className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-lg"
                style={{
                  fontFamily: "var(--font-handwritten)",
                  fontSize: "0.75rem",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  boxShadow: "0 2px 8px rgba(217,119,6,0.5)",
                }}
              >
                Summer ☀️
              </div>
            </div>
          </div>
          <h1 className="text-[28px] font-extrabold text-primary text-center leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
            {tr("Welcome to Azura", "أهلاً بيك في أزورا")}
          </h1>
          <p className="text-sm text-secondary font-medium mt-1 text-center">
            {tr("Your cozy corner in Alexandria", "ركنك الدافي في الإسكندرية")}
          </p>
        </div>

        {/* Login card */}
        <div className="card-elevated rounded-2xl p-6 space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase ml-1">{tr("Your Name", "اسمك")}</label>
              <input
                type="text"
                className={inp}
                placeholder={tr("Enter your name", "ادخل اسمك")}
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase ml-1">{tr("Table Number", "رقم الطاولة")}</label>
              <input
                type="number" min={1} max={99}
                className={`${inp} text-lg font-bold`}
                placeholder="1-99"
                value={tableNum}
                onChange={(e) => { setTableNum(e.target.value); setError(""); }}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <span className="text-red-500 text-sm">⚠️</span>
              <p className="text-red-700 text-xs font-semibold flex-1">{error}</p>
            </div>
          )}

          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="btn-primary w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Coffee size={18} /> {tr("Start Ordering", "ابدأ الطلب")}</>}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground mt-5">
          {tr("Powered by AI · Made in Egypt", "بالذكاء الاصطناعي · صُنع في مصر")}
        </p>
      </div>

      <style>{`
        @keyframes floatBob {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes splashEnter {
          from { opacity: 0; transform: scale(0.8) translateY(20px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>
    </div>
  );
}
