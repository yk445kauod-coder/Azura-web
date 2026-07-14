import { useState, useEffect } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBarista } from "@/contexts/BaristaContext";
import { db, ref, onValue, off } from "@/lib/firebase";
import { Globe, ArrowRight, ShieldCheck, Laptop, Cpu, Check, X } from "lucide-react";
import { type Lang } from "@/lib/i18n";

type Screen = "splash" | "main";

export default function Welcome() {
  const { lang, setLang, isRTL } = useLang();
  const { loginAnonymous } = useAuth();
  const { baristaName, baristaAvatar } = useBarista();

  const [screen, setScreen] = useState<Screen>("splash");
  const [tableNum, setTableNum] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Dynamic DDS configuration states
  const [ddsConfig, setDdsConfig] = useState<any>(null);

  /* Splash state variables */
  const [splashPhase, setSplashPhase] = useState(0); // 0=hidden 1=visible 2=logo+text
  const [typed, setTyped] = useState("");
  const [cursorOn, setCursorOn] = useState(true);

  // Homepage Banner
  const [banner, setBanner] = useState<{
    content: string; bgColor: string; textColor: string; enabled: boolean;
  } | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  /* Load configuration nodes */
  useEffect(() => {
    const ddsRef = ref(db, "dds-config");
    onValue(ddsRef, (snap) => {
      if (snap.exists()) {
        const cfg = snap.val();
        setDdsConfig(cfg);

        // Dynamically update document properties from onboarding setup!
        if (cfg.colors) {
          document.documentElement.style.setProperty("--primary", cfg.colors.primary);
          if (cfg.colors.secondary) document.documentElement.style.setProperty("--secondary", cfg.colors.secondary);
          if (cfg.colors.accent) document.documentElement.style.setProperty("--accent", cfg.colors.accent);
          if (cfg.colors.background) document.documentElement.style.setProperty("--background", cfg.colors.background);
          if (cfg.colors.card) document.documentElement.style.setProperty("--card", cfg.colors.card);
        }
      }
    });

    const bannerRef = ref(db, "homepage-banner");
    onValue(bannerRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val() as { content: string; bgColor: string; textColor: string; enabled: boolean };
        if (data.enabled) setBanner(data);
      }
    });

    return () => {
      off(ddsRef);
      off(bannerRef);
    };
  }, []);

  /* Splash animation sequence → transition to main */
  useEffect(() => {
    const t0 = setTimeout(() => setSplashPhase(1), 80);
    const t1 = setTimeout(() => setSplashPhase(2), 400);
    const t2 = setTimeout(() => setScreen("main"), 2200); // speed up splash for dynamic platform feel
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* Typing effect for dynamic display tagline */
  useEffect(() => {
    if (splashPhase < 2) return;
    const phrase = ddsConfig?.brandTagline || "Digital Interactive Display";
    if (typed.length >= phrase.length) return;
    const delay = typed.length === 0 ? 300 : 40 + Math.random() * 25;
    const t = setTimeout(() => setTyped(phrase.slice(0, typed.length + 1)), delay);
    return () => clearTimeout(t);
  }, [splashPhase, typed, ddsConfig]);

  /* Blinking cursor */
  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 520);
    return () => clearInterval(id);
  }, []);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  const handleGuestLogin = async () => {
    const n = parseInt(tableNum);
    if (!name.trim()) {
      setError(tr("Please enter your name", "يرجى إدخال اسمك"));
      return;
    }
    if (!tableNum.trim() || isNaN(n) || n < 1 || n > 999) {
      setError(tr("Enter a valid seat or desk number (1-999)", "ادخل رقم طاولة أو تذكرة صحيح (1-999)"));
      return;
    }
    setLoading(true);
    try {
      localStorage.setItem("azura-tips-pending", "true");
      await loginAnonymous(name.trim(), tableNum.trim());
    }
    catch {
      localStorage.removeItem("azura-tips-pending");
      setError(tr("Something went wrong. Try again.", "حدث خطأ، حاول مجدداً"));
    }
    setLoading(false);
  };

  const inp = "input-field px-4 py-3";

  // Dynamic names & descriptions
  const dynamicName = ddsConfig?.brandName || "DDS Display";
  const dynamicSlogan = ddsConfig?.brandTagline || tr("Interactive catalog platform", "منصة العرض التفاعلية الذكية");
  const dynamicDesc = ddsConfig?.brandDesc || tr("Interactive portal powered by AI", "بوابة تفاعلية مدعومة بالذكاء الاصطناعي");

  const customLabel = lang === "ar"
    ? (ddsConfig?.labels?.tableLabelAr || "رقم المقعد / الطاولة / المعرّف")
    : (ddsConfig?.labels?.tableLabelEn || "Seat / Desk / Room Number");

  /* ── SUMMER SPLASH (CLEAN DYNAMIC MATRIX EDITION) ───────────────── */
  if (screen === "splash") {
    return (
      <div
        className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-slate-950 text-white"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Dark grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

        {/* Content */}
        <div
          className="relative z-10 flex flex-col items-center px-6 w-full max-w-sm text-center"
          style={{
            opacity: splashPhase >= 1 ? 1 : 0,
            transform: splashPhase >= 1 ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          {/* High-tech glow symbol */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 rounded-2xl blur-xl opacity-35 bg-indigo-500 scale-125" />
            <div className="relative rounded-2xl p-[3px] border border-white/20 bg-indigo-600/20 text-indigo-400 w-16 h-16 flex items-center justify-center font-extrabold text-xl shadow-lg">
              DDS
            </div>
          </div>

          <p
            className="text-white/60 text-[10px] font-black tracking-widest mb-1.5 uppercase"
          >
            {dynamicName}
          </p>

          {/* Typing Effect */}
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ minHeight: "1.5em" }}
          >
            {typed}
            <span
              className="text-indigo-400 font-bold ml-0.5"
              style={{
                opacity: cursorOn ? 1 : 0,
                transition: "opacity 0.1s",
              }}
            >
              |
            </span>
          </h1>

          {/* Loading dots */}
          <div className="flex gap-1.5 mt-8 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo-400 dot-pulse"
                style={{ animationDelay: `${i * 0.22}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN LOGIN SCREEN ──────────────────────────────────────── */
  const BG = (
    <>
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.15), transparent 70%)", transform: "translate(30%,-30%)" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(var(--secondary)/0.12), transparent 70%)", transform: "translate(-30%,30%)" }} />
    </>
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-8 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--card)) 100%)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {BG}

      {/* Language toggle */}
      <div className="fixed top-4 right-4 z-10 flex items-center gap-1 rounded-full px-3 py-1.5"
        style={{ background: "hsla(var(--card),0.92)", backdropFilter: "blur(10px)", boxShadow: "var(--shadow-sm)", border: "0.5px solid hsl(var(--border))" }}>
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
            <div className="absolute inset-0 rounded-full blur-xl opacity-35 bg-primary/20 transform scale-110" />
            <div className="relative rounded-2xl p-1 bg-card border border-border flex items-center justify-center w-20 h-24 shadow-xl">
              {baristaAvatar ? (
                <img src={baristaAvatar} alt={dynamicName} className="w-16 h-16 rounded-full object-cover object-top" loading="lazy" />
              ) : (
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm rounded-xl">
                  DDS
                </div>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-black text-primary text-center leading-tight">
            {dynamicName}
          </h1>
          <p className="text-xs text-muted-foreground font-semibold mt-1.5 text-center">
            {dynamicSlogan}
          </p>
        </div>

        {/* Login card */}
        <div className="card-elevated rounded-2xl p-6 space-y-4 border border-border/85">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{tr("Your Name", "اسمك")}</label>
              <input
                type="text"
                className={inp}
                placeholder={tr("Enter your name", "ادخل اسمك")}
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{customLabel}</label>
              <input
                type="number" min={1} max={999}
                className={`${inp} text-lg font-bold`}
                placeholder="1-999"
                value={tableNum}
                onChange={(e) => { setTableNum(e.target.value); setError(""); }}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/5 border border-red-200/20 rounded-xl px-3 py-2">
              <span className="text-red-500 text-sm">⚠️</span>
              <p className="text-red-600 dark:text-red-400 text-xs font-semibold flex-1">{error}</p>
            </div>
          )}

          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="btn-primary w-full py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 uppercase tracking-wider"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <>{tr("Explore Portal", "بدء الاستكشاف")}</>}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-[9px] text-muted-foreground font-bold tracking-widest uppercase mt-6">
          {tr("Powered by AI · Dynamic Display System", "بالذكاء الاصطناعي · نظام العرض الديناميكي")}
        </p>
      </div>
    </div>
  );
}
