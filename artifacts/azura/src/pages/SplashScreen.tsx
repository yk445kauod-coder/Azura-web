import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const SUMMER_PHRASE = "Summer Edition";
const BEACH_BG =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80";

export default function SplashScreen() {
  const { lang } = useLang();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<0 | 1 | 2>(0); // 0=loading bg, 1=animate, 2=login
  const [typed, setTyped] = useState("");
  const [cursorOn, setCursorOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const typingDone = typed.length === SUMMER_PHRASE.length;

  const tr = (en: string, ar: string) => (lang === "ar" ? ar : en);

  /* ── auth redirect check ── */
  useEffect(() => {
    if (user) { navigate("/menu"); return; }
    getRedirectResult(auth).then((r) => { if (r?.user) navigate("/menu"); });

    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [user, navigate]);

  /* ── typing effect ── */
  useEffect(() => {
    if (phase < 1) return;
    if (typed.length >= SUMMER_PHRASE.length) return;
    const delay = typed.length === 0 ? 600 : 55 + Math.random() * 35;
    const t = setTimeout(
      () => setTyped(SUMMER_PHRASE.slice(0, typed.length + 1)),
      delay
    );
    return () => clearTimeout(t);
  }, [phase, typed]);

  /* ── blinking cursor ── */
  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 520);
    return () => clearInterval(id);
  }, []);

  /* ── Google login ── */
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch {
        await signInWithRedirect(auth, provider);
      }
      navigate("/menu");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Login failed");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
      {/* ── Beach background ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${BEACH_BG}")` }}
      />

      {/* ── Dark + gradient overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,18,40,0.62) 0%, rgba(0,10,28,0.52) 40%, rgba(0,6,18,0.72) 100%)",
        }}
      />

      {/* ── Animated light-wave strips ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px opacity-20"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,220,120,0.8), transparent)",
              top: `${30 + i * 22}%`,
              animation: `waveSlide ${4 + i * 1.5}s ease-in-out ${i * 0.8}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-sm">

        {/* Logo */}
        <div
          className={`mb-6 transition-all duration-700 ${phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"}`}
          style={{ transitionDelay: "0.1s" }}
        >
          <div className="relative">
            <div
              className="absolute inset-0 rounded-[22px] blur-2xl opacity-50"
              style={{ background: "rgba(255,210,100,0.4)", transform: "scale(1.1) translateY(6px)" }}
            />
            <div
              className="relative rounded-[22px] p-1.5 border border-white/20"
              style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}
            >
              <img
                src="/logo.jpg"
                alt="Azura"
                className="w-24 h-24 rounded-[18px] object-cover"
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
              />
            </div>
          </div>
        </div>

        {/* Cafe name */}
        <div
          className={`text-center mb-2 transition-all duration-700 ${phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "0.3s" }}
        >
          <p className="text-white/70 text-sm font-semibold tracking-[0.25em] uppercase mb-1">
            {tr("AZURA CAFE", "أزورا كافيه")}
          </p>
        </div>

        {/* ── "Summer Edition" hero typing text ── */}
        <div
          className={`text-center mb-2 transition-all duration-700 ${phase >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          style={{ transitionDelay: "0.5s" }}
        >
          <h1
            style={{
              fontFamily: "var(--font-handwritten)",
              fontSize: "clamp(2.6rem, 8vw, 3.4rem)",
              lineHeight: 1.15,
              color: "#FFD97D",
              textShadow: "0 2px 20px rgba(255,200,60,0.55), 0 4px 40px rgba(255,140,0,0.3)",
              letterSpacing: "0.01em",
            }}
          >
            {typed}
            <span
              style={{
                opacity: typingDone && !cursorOn ? 0 : cursorOn ? 1 : 0,
                color: "#FFD97D",
                transition: "opacity 0.1s",
              }}
            >
              |
            </span>
          </h1>
        </div>

        {/* Slogan */}
        <div
          className={`text-center mb-8 transition-all duration-700 ${typed.length > 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
          style={{ transitionDelay: "0s", transition: "opacity 0.8s ease, transform 0.8s ease" }}
        >
          <p
            className="text-white/60 text-[11px] tracking-widest uppercase"
            style={{ letterSpacing: "0.2em" }}
          >
            {tr("The quality is a habit", "الجودة عادة")}
          </p>
          <div className="mx-auto mt-2 h-px w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>

        {/* ── Login section ── */}
        {phase >= 2 && (
          <div
            className="w-full space-y-3"
            style={{ animation: "fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) both" }}
          >
            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-70"
              style={{
                background: "rgba(255,255,255,0.96)",
                color: "#1a1a1a",
                boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>
                {loading
                  ? tr("Signing in…", "جاري الدخول…")
                  : tr("Continue with Google", "الدخول بحساب Google")}
              </span>
            </button>

            {error && (
              <p className="text-white/90 text-sm text-center bg-red-500/25 backdrop-blur-sm py-2 px-4 rounded-xl border border-red-400/30">
                {error}
              </p>
            )}

            <p className="text-white/40 text-[10px] text-center">
              {tr(
                "By continuing you agree to our Terms of Service",
                "بالاستمرار، فأنت توافق على شروط الخدمة"
              )}
            </p>
          </div>
        )}
      </div>

      {/* ── Version ── */}
      <p className="absolute bottom-4 left-0 right-0 text-center text-white/25 text-[9px] z-10">
        v2.1 · Summer 2025
      </p>

      <style>{`
        @keyframes waveSlide {
          0%, 100% { transform: translateX(-60%) scaleX(0.6); opacity: 0.1; }
          50%       { transform: translateX(20%)  scaleX(1.4); opacity: 0.3; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
