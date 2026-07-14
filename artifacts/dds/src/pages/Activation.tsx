import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useLocation, Link } from "wouter";
import { validateAndActivateKey, LICENSE_CONFIG, type LicenseType } from "@/lib/activation";
import { Shield, Key, Check, AlertCircle, Clock, Crown, Zap, Calendar, Users, Mail } from "lucide-react";

const PLANS = [
  {
    id: 'DDS' as LicenseType,
    name: 'Lifetime',
    nameAr: 'مدى الحياة',
    price: 'اتصل',
    icon: Crown,
    color: 'from-amber-500 to-orange-600',
    features: {
      en: ['Lifetime Access', 'Up to 1000 Users', 'All Features', 'Priority Support', 'Custom Domain'],
      ar: ['وصول مدى الحياة', 'حتى 1000 مستخدم', 'جميع الميزات', 'دعم أولوي', 'نطاق مخصص']
    }
  },
  {
    id: 'DDSM' as LicenseType,
    name: 'Monthly',
    nameAr: 'شهري',
    price: 'اتصل',
    icon: Calendar,
    color: 'from-blue-500 to-cyan-600',
    features: {
      en: ['30 Days Access', 'Up to 1000 Users', 'All Features', 'Email Support', 'Auto Renewal'],
      ar: ['30 يوم وصول', 'حتى 1000 مستخدم', 'جميع الميزات', 'دعم بالبريد', 'تجديد تلقائي']
    }
  },
  {
    id: 'DDSY' as LicenseType,
    name: 'Yearly',
    nameAr: 'سنوي',
    price: 'اتصل',
    icon: Zap,
    color: 'from-purple-500 to-pink-600',
    features: {
      en: ['365 Days Access', 'Up to 1000 Users', 'All Features', 'Priority Support', '2 Months Free'],
      ar: ['365 يوم وصول', 'حتى 1000 مستخدم', 'جميع الميزات', 'دعم أولوي', 'شهران مجاناً']
    }
  },
  {
    id: 'DDF' as LicenseType,
    name: 'Free',
    nameAr: 'مجاني',
    price: 'مجاني',
    icon: Users,
    color: 'from-emerald-500 to-teal-600',
    features: {
      en: ['Limited Access', 'Up to 100 Users', 'Basic Features', 'Community Support'],
      ar: ['وصول محدود', 'حتى 100 مستخدم', 'ميزات أساسية', 'دعم المجتمع']
    }
  }
];

export default function Activation() {
  const { lang, isRTL } = useLang();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<'select' | 'activate'>('select');
  const [selectedPlan, setSelectedPlan] = useState<LicenseType | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  const handlePlanSelect = (planId: LicenseType) => {
    setSelectedPlan(planId);
    setStep('activate');
  };

  const handleActivate = async () => {
    if (!email.trim()) {
      setError(tr("Please enter your email address.", "يرجى إدخال بريدك الإلكتروني."));
      return;
    }

    if (!licenseKey.trim() && selectedPlan !== 'DDF') {
      setError(tr("Please enter your license key.", "يرجى إدخال مفتاح الترخيص."));
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (selectedPlan === 'DDF') {
        // Free plan - just register
        await validateAndActivateKey(`DDF-${Date.now()}`, email, name);
        setSuccess(true);
        setTimeout(() => navigate('/onboarding'), 2000);
      } else {
        const result = await validateAndActivateKey(licenseKey, email, name);
        if (result.valid) {
          setSuccess(true);
          setTimeout(() => navigate('/onboarding'), 2000);
        } else {
          setError(tr(result.message, result.messageAr));
        }
      }
    } catch (err) {
      setError(tr("An error occurred. Please try again.", "حدث خطأ. يرجى المحاولة مرة أخرى."));
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    window.location.href = 'mailto:egytronic.official@googlemail.com?subject=DDS Subscription Request';
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-white">
            {tr("Subscription Activated!", "تم تفعيل الاشتراك!")}
          </h1>
          <p className="text-slate-400">
            {tr(
              "Welcome to DDS! Your subscription is now active. Redirecting you to setup...",
              "مرحباً بك في DDS! اشتراكك نشط الآن. جاري توجيهك للإعداد..."
            )}
          </p>
          <div className="flex justify-center">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'activate' && selectedPlan) {
    const plan = PLANS.find(p => p.id === selectedPlan)!;
    const PlanIcon = plan.icon;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="max-w-lg w-full">
          {/* Back button */}
          <button 
            onClick={() => setStep('select')}
            className="mb-6 text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <span className="rtl:rotate-180">→</span>
            {tr("Back to Plans", "العودة للخطط")}
          </button>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6 backdrop-blur-xl">
            {/* Plan header */}
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                <PlanIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">{tr(plan.name, plan.nameAr)}</h2>
                <p className="text-slate-400 text-sm">{tr(LICENSE_CONFIG[selectedPlan].type === 'DDF' ? 'Free Plan' : 'Premium Plan', LICENSE_CONFIG[selectedPlan].type === 'DDF' ? 'خطة مجانية' : 'خطة مميزة')}</p>
              </div>
            </div>

            {/* Contact for paid plans */}
            {selectedPlan !== 'DDF' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                <p className="text-amber-300 text-sm font-semibold mb-3">
                  {tr("To get a license key, contact us:", "للحصول على مفتاح الترخيص، تواصل معنا:")}
                </p>
                <button
                  onClick={handleContact}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  egytronic.official@googlemail.com
                </button>
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  {tr("Email Address", "البريد الإلكتروني")} *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  {tr("Full Name", "الاسم الكامل")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  placeholder={tr("Your name", "اسمك")}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  {tr("Phone Number", "رقم الهاتف")}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="+20 xxx xxx xxxx"
                />
              </div>

              {selectedPlan !== 'DDF' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                    {tr("License Key", "مفتاح الترخيص")} *
                  </label>
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono"
                    placeholder={tr("e.g., DDS-XXXX-XXXX-XXXX", "مثال: DDS-XXXX-XXXX-XXXX")}
                  />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Activate button */}
            <button
              onClick={handleActivate}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  {tr("Activating...", "جاري التفعيل...")}
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  {tr("Activate Subscription", "تفعيل الاشتراك")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/75 backdrop-blur-md border-b border-slate-900/80 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-extrabold text-sm shadow-md">
              DDS
            </div>
            <div>
              <span className="font-black text-white text-sm">Dynamic Display System</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest block">DDS</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-4 py-16 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6">
          <Key className="w-3 h-3" />
          {tr("License Activation", "تفعيل الترخيص")}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white mb-4">
          {tr("Choose Your Plan", "اختر خطتك")}
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-base">
          {tr(
            "Select the perfect plan for your business. All plans include access to the full DDS platform with AI assistance, real-time sync, and more.",
            "اختر الخطة المثالية لنشاطك التجاري. تتضمن جميع الخطط الوصول الكامل لمنصة DDS مع المساعدة الذكية والمزامنة اللحظية والمزيد."
          )}
        </p>
      </section>

      {/* Plans Grid */}
      <section className="relative z-10 px-4 pb-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon;
            const isLifetime = plan.id === 'DDS';
            const isPopular = plan.id === 'DDSM';
            
            return (
              <div
                key={plan.id}
                className={`relative p-6 rounded-3xl border transition-all hover:scale-[1.02] cursor-pointer ${
                  isLifetime 
                    ? 'bg-gradient-to-b from-amber-950/50 to-slate-900 border-amber-500/40'
                    : isPopular
                    ? 'bg-gradient-to-b from-indigo-950/50 to-slate-900 border-indigo-500/40 ring-1 ring-indigo-500/20'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {isLifetime && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
                    {tr("Best Value", "أفضل قيمة")}
                  </span>
                )}
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
                    {tr("Popular", "الأكثر شعبية")}
                  </span>
                )}

                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <PlanIcon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-black text-white mb-1">{tr(plan.name, plan.nameAr)}</h3>
                <p className="text-2xl font-black text-white mb-4">
                  {plan.price}
                  {plan.price !== 'مجاني' && plan.price !== 'Free' && (
                    <span className="text-sm text-slate-400 font-normal">{tr("", "")}</span>
                  )}
                </p>

                <ul className="space-y-2 mb-6">
                  {plan.features[lang === 'ar' ? 'ar' : 'en'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                    isLifetime
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/30'
                      : isPopular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {tr("Select Plan", "اختر الخطة")}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-8 text-center">
        <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">
          © {new Date().getFullYear()} DDS - Dynamic Display System
        </p>
      </footer>
    </div>
  );
}
