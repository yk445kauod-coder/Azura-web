import { useState, useEffect } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBarista } from "@/contexts/BaristaContext";
import { db, ref, onValue, off } from "@/lib/firebase";
import { Globe, Coffee, Sparkles, X } from "lucide-react";
import { type Lang } from "@/lib/i18n";

type Screen = "intro" | "main" | "guest" | "login" | "register";

// Animated coffee steam dots
function Steam() {
  return (
    <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
      {[0,1,2].map((i) => (
        <div key={i} className="w-1 h-1 rounded-full opacity-0 bg-primary/40"
          style={{ animation: `steamRise 2.2s ease-in-out ${i * 0.5}s infinite` }} />
      ))}
    </div>
  );
}

export default function Welcome() {
  const { lang, setLang, isRTL } = useLang();
  const { loginAnonymous, loginGoogle, loginEmail, registerEmail } = useAuth();
  const { persona, setPersona } = useBarista();

  const [screen, setScreen] = useState<Screen>("intro");
  const [tableNum, setTableNum] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  
  // Homepage Banner
  const [banner, setBanner] = useState<{ content: string; bgColor: string; textColor: string; enabled: boolean } | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Load banner from Firebase
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

  // Show intro for 2.2s then slide to main
  useEffect(() => {
    const t = setTimeout(() => setScreen("main"), 2200);
    return () => clearTimeout(t);
  }, []);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  const handleGuest = async () => {
    const n = parseInt(tableNum);
    if (!tableNum.trim() || isNaN(n) || n < 1 || n > 99) {
      setError(tr("Enter a valid table number (1-99)", "ادخل رقم طاولة صحيح (1-99)")); return;
    }
    setLoading(true);
    try { await loginAnonymous(tableNum.trim()); }
    catch { setError(tr("Something went wrong. Try again.", "حدث خطأ، حاول مجدداً")); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    try { await loginGoogle(); }
    catch { setError(tr("Google sign-in failed.", "فشل الدخول بجوجل.")); }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) { setError(tr("Fill all fields.", "اكمل البيانات.")); return; }
    setLoading(true);
    try { await loginEmail(email, password); }
    catch { setError(tr("Wrong email or password.", "بريد أو كلمة مرور خاطئة.")); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!email || !password || !name) { setError(tr("Fill all fields.", "اكمل البيانات.")); return; }
    setLoading(true);
    try { await registerEmail(email, password, name); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : tr("Failed to register.", "فشل التسجيل.")); }
    setLoading(false);
  };

  const inp = "input-field px-4 py-3";
  const err = error && (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
      <span className="text-red-500 text-sm">⚠️</span>
      <p className="text-red-700 text-xs font-semibold flex-1">{error}</p>
    </div>
  );

  const back = (
    <button onClick={() => { setScreen("main"); setError(""); }}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 font-semibold transition-colors">
      ← {tr("Back", "رجوع")}
    </button>
  );

  const BG = (
    <>
      {/* Radial blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(35,65%,68%,0.28), transparent 70%)", transform: "translate(30%,-30%)" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(22,55%,38%,0.18), transparent 70%)", transform: "translate(-30%,30%)" }} />
      {/* Floating shapes */}
      {[
        { shape: "circle", x:"10%", y:"18%", s:0.7, d:"6s" },
        { shape: "circle", x:"85%", y:"25%", s:0.6, d:"8s" },
        { shape: "circle", x:"15%", y:"72%", s:0.55, d:"7s" },
        { shape: "circle", x:"80%", y:"70%", s:0.6, d:"5s" },
      ].map((b, i) => (
        <div key={i} className="absolute pointer-events-none select-none rounded-full"
          style={{ left: b.x, top: b.y, width: "1.5rem", height: "1.5rem", opacity: 0.1, background: "hsl(var(--primary))", animation: `floatBob ${b.d} ease-in-out infinite`, transform: `scale(${b.s})`, animationDelay: `${i * 0.8}s` }} />
      ))}
    </>
  );

  // ── INTRO SPLASH ──────────────────────────────────────────────
  if (screen === "intro") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(160deg,hsl(38,52%,90%) 0%,hsl(35,42%,85%) 50%,hsl(28,46%,82%) 100%)" }}
        dir={isRTL ? "rtl" : "ltr"}>
        {BG}
        <div className="flex flex-col items-center" style={{ animation: "splashEnter 0.7s cubic-bezier(0.34,1.56,0.64,1) both" }}>
          {/* Logo with glow */}
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-[28px] blur-xl opacity-40" style={{ background: "hsl(var(--primary))", transform: "scale(0.9) translateY(8px)" }} />
            <div className="relative rounded-[28px] p-1.5" style={{ background: "hsl(var(--card))", boxShadow: "0 24px 60px rgba(93,62,35,0.25), 0 0 0 1px rgba(93,62,35,0.06)" }}>
              <img
                src="/logo.jpg" alt="Azura"
                className="w-28 h-28 rounded-[22px] object-cover"
                onLoad={() => setLogoLoaded(true)}
                style={{ opacity: logoLoaded ? 1 : 0, transition: "opacity 0.4s" }}
              />
              {/* Shine overlay */}
              <div className="absolute inset-0 rounded-[22px] pointer-events-none overflow-hidden">
                <div style={{ position: "absolute", top: "-50%", left: "-50%", width: "70%", height: "200%", background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.18) 50%,transparent 60%)", animation: "logoShine 3s ease-in-out 0.8s infinite" }} />
              </div>
            </div>
            <Steam />
          </div>
          <h1 className="text-3xl font-extrabold text-primary mb-1 text-center" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
            {lang === "ar" ? "أزورا كافيه" : "Azura Cafe"}
          </h1>
          <p className="text-sm text-secondary font-medium">{tr("Tivoli Dome, Alexandria", "التيفولي دوم، الإسكندرية")}</p>
          {/* Loading dots */}
          <div className="flex gap-1.5 mt-6">
            {[0,1,2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40 dot-pulse" style={{ animationDelay: `${i*0.22}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg,hsl(38,52%,90%) 0%,hsl(35,42%,85%) 50%,hsl(28,46%,82%) 100%)" }}
      dir={isRTL ? "rtl" : "ltr"}>
      {BG}

      {/* Language toggle */}
      <div className="fixed top-4 right-4 z-10 flex items-center gap-1 rounded-full px-3 py-1.5" style={{ background: "hsla(var(--card),0.92)", backdropFilter: "blur(10px)", boxShadow: "var(--shadow-sm)" }}>
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
          <div 
            className="flex-1 text-center text-sm font-semibold"
            dangerouslySetInnerHTML={{ __html: banner.content }}
          />
          <button 
            onClick={() => setBannerDismissed(true)}
            className="ml-3 p-1 hover:opacity-70 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── MAIN ── */}
      {screen === "main" && (
        <div className="w-full max-w-sm page-enter">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-[28px] blur-xl opacity-35" style={{ background: "hsl(var(--primary))", transform: "scale(0.9) translateY(8px)" }} />
              <div className="relative rounded-[28px] p-1.5" style={{ background: "hsl(var(--card))", boxShadow: "0 20px 50px rgba(93,62,35,0.22)" }}>
                <img src="/logo.jpg" alt="Azura" className="w-24 h-24 rounded-[22px] object-cover" />
              </div>
              <Steam />
            </div>
            <h1 className="text-[28px] font-extrabold text-primary text-center leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
              {tr("Welcome to Azura", "أهلاً بيك في أزورا")}
            </h1>
            <p className="text-sm text-secondary font-medium mt-1 text-center">
              {tr("Your cozy corner in Alexandria", "ركنك الدافي في الإسكندرية")}
            </p>
          </div>

          {/* AI Barista Picker */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: "hsla(var(--card),0.88)", backdropFilter: "blur(12px)", boxShadow: "var(--shadow-md)", border: "1px solid rgba(93,62,35,0.06)" }}>
            <p className="text-[11px] font-bold text-muted-foreground text-center uppercase tracking-widest mb-3 flex items-center justify-center gap-1.5">
              <Sparkles size={10} /> {tr("Choose your AI barista", "اختار باريستاك الذكي")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPersona("female")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ${persona === "female" ? "ring-2 ring-primary" : "hover:bg-muted/30"}`}
                style={persona === "female" ? { background: "hsl(var(--primary)/0.08)", boxShadow: "var(--shadow-sm)" } : {}}>
                <img src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Zura&backgroundColor=b6e3f4&clothColor=5d3e6e&mouthColor=ec4899&hairColor=7c3aed" alt="Zura" className="w-14 h-14 rounded-full" style={{ filter: persona === "female" ? "drop-shadow(0 2px 8px hsl(var(--primary)/0.3))" : "opacity(0.7)" }} />
                <div className="text-center">
                  <p className="font-extrabold text-sm text-primary">{tr("Zura", "زورا")}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{tr("Warm & friendly", "دافية ومبتسمة دايماً")}</p>
                </div>
                {persona === "female" && <div className="w-5 h-1 rounded-full" style={{ background: "hsl(var(--primary))" }} />}
              </button>
              <button onClick={() => setPersona("male")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ${persona === "male" ? "ring-2 ring-primary" : "hover:bg-muted/30"}`}
                style={persona === "male" ? { background: "hsl(var(--primary)/0.08)", boxShadow: "var(--shadow-sm)" } : {}}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Zure&backgroundColor=c0aede&clothesColor=3d5a80" alt="Zure" className="w-14 h-14 rounded-full" style={{ filter: persona === "male" ? "drop-shadow(0 2px 8px hsl(var(--primary)/0.3))" : "opacity(0.7)" }} />
                <div className="text-center">
                  <p className="font-extrabold text-sm text-primary">{tr("Zure", "زور")}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{tr("Cool & knowledgeable", "هادي ومتمكن")}</p>
                </div>
                {persona === "male" && <div className="w-5 h-1 rounded-full" style={{ background: "hsl(var(--primary))" }} />}
              </button>
            </div>
          </div>

          {/* Auth buttons */}
          <div className="space-y-2.5">
            <button onClick={() => { setScreen("guest"); setError(""); }} disabled={loading}
              className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 relative overflow-hidden">
              <Coffee size={16} /> {tr("Continue as Guest", "كمّل كزائر")}
            </button>
            <button onClick={handleGoogle} disabled={loading}
              className="btn-secondary w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
              {tr("Sign in with Google", "الدخول بجوجل")}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setScreen("login"); setError(""); }} className="btn-secondary py-3 rounded-xl text-xs font-bold">
                {tr("Login", "الدخول")}
              </button>
              <button onClick={() => { setScreen("register"); setError(""); }} className="btn-secondary py-3 rounded-xl text-xs font-bold">
                {tr("Register", "تسجيل")}
              </button>
            </div>
          </div>
          {error && <div className="mt-3">{err}</div>}

          {/* Footer */}
          <p className="text-center text-[10px] text-muted-foreground mt-5">
            {tr("Powered by AI · Made in Egypt", "بالذكاء الاصطناعي · صُنع في مصر")}
          </p>
        </div>
      )}

      {/* ── GUEST ── */}
      {screen === "guest" && (
        <div className="w-full max-w-xs page-enter">
          {back}
          <div className="card-elevated rounded-2xl p-6 space-y-4">
            <div className="text-center">
              <span className="text-5xl">🪑</span>
              <h2 className="text-xl font-bold text-primary mt-2" style={{ fontFamily: "var(--font-heading)" }}>
                {tr("Your Table Number", "رقم طاولتك")}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">{tr("Ask your waiter for your table number", "اسأل النادل عن رقم طاولتك")}</p>
            </div>
            <input type="number" min={1} max={99}
              className={`${inp} text-center text-2xl font-extrabold text-primary`}
              placeholder="1 – 99"
              value={tableNum}
              onChange={(e) => { setTableNum(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleGuest()}
              autoFocus
            />
            {err}
            <button onClick={handleGuest} disabled={loading} className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-60">
              {loading ? "..." : tr("Let's go! 🚀", "هيا بنا! 🚀")}
            </button>
          </div>
        </div>
      )}

      {/* ── LOGIN ── */}
      {screen === "login" && (
        <div className="w-full max-w-xs page-enter">
          {back}
          <div className="card-elevated rounded-2xl p-6 space-y-3">
            <h2 className="text-xl font-bold text-primary text-center" style={{ fontFamily: "var(--font-heading)" }}>{tr("Welcome back", "أهلاً من جديد")}</h2>
            <input type="email" className={inp} placeholder={tr("Email", "البريد الإلكتروني")} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" className={inp} placeholder={tr("Password", "كلمة المرور")} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            {err}
            <button onClick={handleLogin} disabled={loading} className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-60">
              {loading ? "..." : tr("Login", "دخول")}
            </button>
            <button onClick={() => { setScreen("register"); setError(""); }} className="btn-ghost w-full py-2 text-xs text-muted-foreground">
              {tr("Don't have an account? Register", "مفيش حساب؟ سجل")}
            </button>
          </div>
        </div>
      )}

      {/* ── REGISTER ── */}
      {screen === "register" && (
        <div className="w-full max-w-xs page-enter">
          {back}
          <div className="card-elevated rounded-2xl p-6 space-y-3">
            <h2 className="text-xl font-bold text-primary text-center" style={{ fontFamily: "var(--font-heading)" }}>{tr("Create Account", "إنشاء حساب")}</h2>
            <input type="text" className={inp} placeholder={tr("Full Name", "الاسم الكامل")} value={name} onChange={(e) => setName(e.target.value)} />
            <input type="email" className={inp} placeholder={tr("Email", "البريد الإلكتروني")} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" className={inp} placeholder={tr("Password (min 6 chars)", "كلمة المرور (6 حروف)")} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRegister()} />
            {err}
            <button onClick={handleRegister} disabled={loading} className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-60">
              {loading ? "..." : tr("Create Account", "إنشاء")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
