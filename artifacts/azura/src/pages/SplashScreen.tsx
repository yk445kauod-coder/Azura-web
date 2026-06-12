import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Sparkles, Star, Coffee, Crown } from "lucide-react";

export default function SplashScreen() {
  const { lang } = useLang();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState(0); // 0=logo, 1=animate, 2=login
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const logoRef = useRef<HTMLDivElement>(null);
  const sparklesRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Auto-redirect if already logged in
    if (user) {
      navigate("/menu");
      return;
    }

    // Check for redirect result
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        navigate("/menu");
      }
    });

    // Start animation sequence
    const timer1 = setTimeout(() => setPhase(1), 100);
    const timer2 = setTimeout(() => setPhase(2), 2500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      // Try popup first, fallback to redirect
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

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  // Generate sparkles
  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i * 30) + Math.random() * 15,
    delay: 0.8 + Math.random() * 0.5,
    size: 4 + Math.random() * 4,
  }));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" 
      style={{ background: "linear-gradient(160deg, hsl(35, 80%, 35%) 0%, hsl(25, 70%, 45%) 50%, hsl(15, 60%, 35%) 100%)" }}>
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: `${20 + Math.random() * 60}px`,
              height: `${20 + Math.random() * 60}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Logo & Animation Container */}
      <div className="relative flex flex-col items-center z-10">
        
        {/* Logo Circle */}
        <div 
          ref={logoRef}
          className={`relative transition-all duration-1000 ${phase >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
          style={{ 
            transform: phase >= 1 ? 'scale(1)' : 'scale(0)',
            opacity: phase >= 1 ? 1 : 0,
          }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-white/30 blur-2xl scale-150 animate-pulse" />
          
          {/* Logo container */}
          <div className="relative w-32 h-32 rounded-full flex items-center justify-center overflow-hidden border-4 border-white/50 shadow-2xl"
            style={{ 
              background: "linear-gradient(145deg, hsl(35, 80%, 45%), hsl(25, 70%, 35%))",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3), inset 0 -5px 20px rgba(0,0,0,0.2)",
            }}>
            <img src="/logo.jpg" alt="Azura" className="w-24 h-24 rounded-full object-cover" />
          </div>

          {/* Sparkles */}
          {sparkles.map((s, i) => (
            <div
              key={s.id}
              ref={(el) => { if (el) sparklesRef.current[i] = el; }}
              className="absolute"
              style={{
                width: `${s.size}px`,
                height: `${s.size}px`,
                transform: `rotate(${s.angle}deg) translateY(-80px)`,
                animation: phase >= 1 ? `sparkle 1s ease-out ${s.delay}s forwards` : "none",
                opacity: 0,
              }}
            >
              <Star size={s.size} className="text-white fill-white" />
            </div>
          ))}
        </div>

        {/* Brand Name */}
        <div className={`mt-6 text-center transition-all duration-700 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '0.5s' }}>
          <h1 
            className="text-5xl font-black text-white tracking-tight"
            style={{ 
              fontFamily: "'Playfair Display', Georgia, serif",
              textShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            AZURA
          </h1>
          <p className="text-white/80 text-sm mt-1 font-medium tracking-widest uppercase">
            {tr("Cafe & Restaurant", "كافيه ومطعم")}
          </p>
        </div>

        {/* Decorative line */}
        <div 
          className={`mt-4 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-500 ${phase >= 1 ? 'w-48 opacity-100' : 'w-0 opacity-0'}`}
          style={{ transitionDelay: '1s' }}
        />
      </div>

      {/* Login Section */}
      {phase >= 2 && (
        <div className={`absolute bottom-16 left-4 right-4 max-w-sm mx-auto transition-all duration-700 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-white text-gray-800 font-bold text-base flex items-center justify-center gap-3 transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-70 shadow-xl"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? tr("Signing in...", "جاري الدخول...") : tr("Continue with Google", "الدخول بحساب Google")}
          </button>

          {error && (
            <p className="text-white/90 text-sm text-center mt-3 bg-red-500/20 py-2 px-4 rounded-xl">
              {error}
            </p>
          )}

          <p className="text-white/60 text-xs text-center mt-4">
            {tr("By continuing, you agree to our Terms of Service", "بالاستمرار، فأنت توافق على شروط الخدمة")}
          </p>
        </div>
      )}

      {/* Version */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-white/40 text-[10px]">v2.0</p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes sparkle {
          0% { opacity: 0; transform: rotate(var(--angle)) translateY(-60px) scale(0); }
          50% { opacity: 1; transform: rotate(var(--angle)) translateY(-100px) scale(1); }
          100% { opacity: 0; transform: rotate(var(--angle)) translateY(-140px) scale(0.5); }
        }
      `}</style>
    </div>
  );
}