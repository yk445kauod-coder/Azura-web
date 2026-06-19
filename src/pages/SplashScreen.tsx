import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: 16 + (i % 5) * 12,
  x: (i * 17 + 8) % 100,
  y: (i * 23 + 5) % 100,
  dur: 5 + (i % 4),
  delay: (i * 0.4) % 3,
}));

const SPARKLE_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

export default function SplashScreen() {
  const { lang } = useLang();
  const { user, login } = useAuth();
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState(0);
  const [name, setName] = useState(() => localStorage.getItem("azura-name") || "");
  const [tableNum, setTableNum] = useState(() => localStorage.getItem("azura-table") || "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  useEffect(() => {
    if (user) { navigate("/menu"); return; }
    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 1600);
    const t3 = setTimeout(() => { setPhase(3); nameRef.current?.focus(); }, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [user, navigate]);

  const handleLogin = async () => {
    setError("");
    const trimmedName = name.trim();
    const trimmedTable = tableNum.trim();
    if (!trimmedName) { setError(tr("Please enter your name", "الرجاء إدخال اسمك")); return; }
    if (!trimmedTable) { setError(tr("Please enter your table number", "الرجاء إدخال رقم الطاولة")); return; }
    const n = parseInt(trimmedTable);
    if (isNaN(n) || n < 1 || n > 99) { setError(tr("Table number must be 1–99", "رقم الطاولة من 1 إلى 99")); return; }
    setIsLoading(true);
    localStorage.setItem("azura-name", trimmedName);
    localStorage.setItem("azura-table", trimmedTable);
    try {
      await login(trimmedName, trimmedTable);
      navigate("/menu");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tr("Something went wrong", "حدث خطأ"));
    }
    setIsLoading(false);
  };

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden select-none"
      style={{
        background: "linear-gradient(145deg, hsl(28,72%,28%) 0%, hsl(22,68%,35%) 40%, hsl(18,60%,30%) 100%)",
      }}
    >
      {/* Ambient background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.id % 3 === 0
                ? "rgba(255,220,120,0.12)"
                : p.id % 3 === 1
                ? "rgba(255,255,255,0.07)"
                : "rgba(200,140,60,0.10)",
              animation: `floatPart ${p.dur}s ease-in-out ${p.delay}s infinite`,
              filter: "blur(1px)",
            }}
          />
        ))}
      </div>

      {/* Gold shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255,200,80,0.10) 0%, transparent 70%)",
        }}
      />

      {/* ── LOGO SECTION ── */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Outer glow ring */}
        <div
          className="relative"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "scale(1)" : "scale(0.4)",
            transition: "all 0.9s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {/* Pulsing rings */}
          <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(255,200,80,0.15)", animationDuration: "2.4s" }} />
          <div className="absolute -inset-3 rounded-full animate-ping" style={{ background: "rgba(255,200,80,0.08)", animationDuration: "3.2s", animationDelay: "0.6s" }} />

          {/* Sparkle dots */}
          {phase >= 1 && SPARKLE_ANGLES.map((angle, i) => (
            <div
              key={angle}
              className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-yellow-200"
              style={{
                transform: `translate(-50%,-50%) rotate(${angle}deg) translateY(-72px)`,
                opacity: 0,
                animation: `sparklePop 0.6s ease-out ${0.6 + i * 0.05}s forwards`,
              }}
            />
          ))}

          {/* Logo circle */}
          <div
            className="relative w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              border: "3px solid rgba(255,220,120,0.6)",
              boxShadow: "0 0 0 8px rgba(255,200,80,0.12), 0 20px 60px rgba(0,0,0,0.4), inset 0 -4px 12px rgba(0,0,0,0.3)",
              background: "linear-gradient(145deg, hsl(28,65%,40%), hsl(18,55%,28%))",
            }}
          >
            <img
              src="/logo.jpg"
              alt="Azura"
              className="w-24 h-24 rounded-full object-cover"
              style={{ filter: "brightness(1.05) contrast(1.05)" }}
            />
          </div>
        </div>

        {/* Brand name */}
        <div
          className="mt-5 text-center"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.7s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          <h1
            className="text-5xl font-black text-white tracking-tight leading-none"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              textShadow: "0 2px 16px rgba(0,0,0,0.4), 0 0 40px rgba(255,200,80,0.3)",
              letterSpacing: "0.06em",
            }}
          >
            AZURA
          </h1>
          <div
            className="flex items-center justify-center gap-2 mt-2"
            style={{
              opacity: phase >= 2 ? 1 : 0,
              transition: "opacity 0.5s 0.3s",
            }}
          >
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-yellow-300/50" />
            <p className="text-yellow-200/80 text-[11px] font-semibold tracking-[0.25em] uppercase">
              {tr("Café & Restaurant", "كافيه ومطعم")}
            </p>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-yellow-300/50" />
          </div>
        </div>
      </div>

      {/* ── LOGIN FORM ── */}
      <div
        className="absolute bottom-0 left-0 right-0 px-5 pb-10"
        style={{
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? "translateY(0)" : "translateY(40px)",
          transition: "all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      >
        <div
          className="max-w-sm mx-auto rounded-3xl p-5 space-y-3"
          style={{
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
          }}
        >
          <p className="text-white/70 text-xs text-center font-medium tracking-wide uppercase mb-1">
            {tr("Welcome! Tell us about yourself", "أهلاً! عرفنا بنفسك")}
          </p>

          <input
            ref={nameRef}
            type="text"
            inputMode="text"
            autoComplete="name"
            placeholder={tr("Your name", "اسمك")}
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full px-4 py-3.5 rounded-2xl text-gray-800 font-medium placeholder-gray-400 text-[15px]"
            style={{
              background: "rgba(255,255,255,0.95)",
              outline: "none",
              border: "2px solid transparent",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          />

          <input
            type="number"
            inputMode="numeric"
            placeholder={tr("Table number (1–99)", "رقم الطاولة (1–99)")}
            value={tableNum}
            onChange={(e) => { setTableNum(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            min={1}
            max={99}
            className="w-full px-4 py-3.5 rounded-2xl text-gray-800 font-medium placeholder-gray-400 text-[15px]"
            style={{
              background: "rgba(255,255,255,0.95)",
              outline: "none",
              border: "2px solid transparent",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          />

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.25)" }}>
              <span className="text-sm">⚠️</span>
              <p className="text-white text-xs font-semibold">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] disabled:opacity-60"
            style={{
              background: isLoading
                ? "rgba(255,255,255,0.5)"
                : "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,240,200,0.95) 100%)",
              color: "hsl(22,60%,22%)",
              boxShadow: isLoading ? "none" : "0 4px 20px rgba(255,200,80,0.3), 0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-amber-800/30 border-t-amber-900 rounded-full animate-spin" />
                {tr("Entering…", "جاري الدخول…")}
              </>
            ) : (
              <>
                <span>{tr("Enter Azura", "دخول أزورا")}</span>
                <span className="text-lg">☕</span>
              </>
            )}
          </button>
        </div>

        <p className="text-center text-white/30 text-[10px] mt-4 tracking-widest">
          TIVOLI DOME · ALEXANDRIA
        </p>
      </div>

      <style>{`
        @keyframes floatPart {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-18px) scale(1.06); }
        }
        @keyframes sparklePop {
          0% { opacity: 0; transform: translate(-50%,-50%) rotate(var(--r,0deg)) translateY(-40px) scale(0); }
          60% { opacity: 1; transform: translate(-50%,-50%) rotate(var(--r,0deg)) translateY(-72px) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-50%) rotate(var(--r,0deg)) translateY(-100px) scale(0.4); }
        }
      `}</style>
    </div>
  );
}
