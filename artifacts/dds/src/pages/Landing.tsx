import { useState, useEffect, useRef } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useLocation, Link } from "wouter";
import { 
  Sparkles, ArrowRight, ShieldCheck, Cpu, Database, Laptop, Layers, MessageSquare, 
  Zap, Activity, Users, Star, Check, HelpCircle, ChevronDown, Monitor, Play, 
  ShoppingBag, Stethoscope, Hotel, GraduationCap, Tv, Coffee, Building2, Palette,
  Globe, BarChart3, Bot, Rocket, Lock, Target, Eye, Cog, Bell, ArrowUpRight,
  Menu, X, CheckCircle2
} from "lucide-react";
import { SECTOR_PRESETS, COLOR_PRESETS } from "./OnboardingWizard";

export default function Landing() {
  const { lang, setLang, isRTL } = useLang();
  const [, navigate] = useLocation();
  const [selectedDemoSector, setSelectedDemoSector] = useState("clinic");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [animatedFeatures, setAnimatedFeatures] = useState<number[]>([]);
  const featuresRef = useRef<HTMLDivElement>(null);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  const currentPreset = SECTOR_PRESETS.find(s => s.id === selectedDemoSector) || SECTOR_PRESETS[0];

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setTimeout(() => {
              setAnimatedFeatures(prev => [...prev, index]);
            }, index * 100);
          }
        });
      },
      { threshold: 0.2 }
    );

    const features = featuresRef.current?.querySelectorAll('.feature-item');
    features?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const FEATURES = [
    {
      icon: Database,
      title: tr("Dynamic Catalog Display", "عرض كتالوج ديناميكي"),
      desc: tr("Responsive layout that works as a mobile app, web platform, or tablet screen.", "تنسيق متجاوب يعمل كتطبيق جوال، منصة ويب، أو شاشات عرض ذكية."),
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Bot,
      title: tr("AI Assistant Agent", "مساعد ذكاء اصطناعي"),
      desc: tr("AI agent trained directly on your catalog details to guide and recommend solutions.", "عميل ذكاء اصطناعي مدرب بالكامل على تفاصيل بياناتك لمساعدة الزوار فورياً."),
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Activity,
      title: tr("Real-time Sync", "مزامنة لحظية"),
      desc: tr("Central dashboard to update catalog items, descriptions, and media instantly.", "لوحة تحكم مركزية لتعديل المحتويات والصور بشكل فوري."),
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: BarChart3,
      title: tr("Analytics Dashboard", "لوحة التحليلات"),
      desc: tr("Track customer interactions, popular items, and generate reports.", "تتبع تفاعلات العملاء والعناصر الشائعة وإنشاء تقارير."),
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: Globe,
      title: tr("Custom Domain", "نطاق مخصص"),
      desc: tr("Connect your own domain with Cloudflare integration for seamless experience.", "اربط نطاقك الخاص مع تكامل Cloudflare لتجربة سلسة."),
      color: "from-indigo-500 to-violet-500"
    },
    {
      icon: Palette,
      title: tr("30+ Themes", "أكثر من 30 ثيم"),
      desc: tr("Choose from pre-built themes and customize every aspect of your display.", "اختر من الثيمات الجاهزة وخصص كل جانب من عرضك."),
      color: "from-rose-500 to-red-500"
    },
    {
      icon: ShieldCheck,
      title: tr("Secure & Reliable", "آمن وموثوق"),
      desc: tr("Enterprise-grade security with Firebase backend and encrypted data.", "أمان على مستوى المؤسسات مع خلفية Firebase وبيانات مشفرة."),
      color: "from-cyan-500 to-blue-500"
    },
    {
      icon: Rocket,
      title: tr("Easy Deployment", "نشر سهل"),
      desc: tr("Deploy your display system in minutes with our one-click setup.", "انشر نظام العرض الخاص بك في دقائق مع إعداد بنقرة واحدة."),
      color: "from-fuchsia-500 to-pink-500"
    }
  ];

  const FAQS = [
    {
      q: tr("What is Dynamic Display System (DDS)?", "ما هو نظام العرض الديناميكي (DDS)؟"),
      a: tr(
        "DDS is an all-in-one dynamic system that helps businesses instantly create customized, interactive menus, course catalogs, services sheets, or general directories powered by real-time updates and localized AI agents.",
        "DDS هو نظام موحد يساعد الشركات على الإنشاء الفوري لقوائم الخدمات، كتالوجات المنتجات، أو الأدلة الذكية المدعومة بالتحديثات الفورية ومساعدين الذكاء الاصطناعي."
      )
    },
    {
      q: tr("How does the onboarding wizard work?", "كيف يعمل معالج الإعداد؟"),
      a: tr(
        "The Onboarding Wizard guides you through picking your sector, name, branding colors, and customizing the AI Persona. On completion, it seeds a matching live catalog preset into the Firebase database automatically.",
        "يقوم معالج الإعداد بمساعدتك في اختيار قطاعك، اسمك، ألوان الهوية، وتخصيص مساعد الذكاء. عند الانتهاء، يقوم بتحميل كتالوج متكامل متوافق مع اختيارك في ثوانٍ."
      )
    },
    {
      q: tr("Can I customize the branding colors?", "هل يمكنني تخصيص ألوان الهوية؟"),
      a: tr(
        "Yes! The system reads colors directly from the configuration, meaning all customer-facing cards, headings, and buttons automatically render with your chosen custom brand palette.",
        "نعم بالطبع! تم تصميم المنصة لتقرأ الألوان مباشرة من الإعدادات، مما يعني أن كافة الواجهات والأزرار تتلون تلقائياً لتناسب ألوان شركتك."
      )
    },
    {
      q: tr("What subscription plans are available?", "ما هي خطط الاشتراك المتاحة؟"),
      a: tr(
        "We offer Lifetime (DDS), Monthly (DDSM), Yearly (DDSY), Daily (DDD), Weekly (DDW), and Free (DDF) plans. Each plan includes different features and user limits.",
        "نقدم خطط مدى الحياة (DDS) والشهري (DDSM) والسنوي (DDSY) واليومي (DDD) والأسبوعي (DDW) والمجاني (DDF). كل خطة تتضمن ميزات وحدود مستخدمين مختلفة."
      )
    }
  ];

  const SECTORS = [
    { id: "clinic", icon: Stethoscope, name: tr("Medical", "طبي"), color: "bg-teal-500" },
    { id: "hotel", icon: Hotel, name: tr("Hotels", "فنادق"), color: "bg-amber-500" },
    { id: "academy", icon: GraduationCap, name: tr("Education", "تعليم"), color: "bg-emerald-500" },
    { id: "ecommerce", icon: ShoppingBag, name: tr("Retail", "تجزئة"), color: "bg-purple-500" },
    { id: "signage", icon: Tv, name: tr("Signage", "شاشات"), color: "bg-blue-500" },
    { id: "cafe", icon: Coffee, name: tr("Cafe", "مقاهي"), color: "bg-orange-500" },
    { id: "custom", icon: Building2, name: tr("Custom", "مخصص"), color: "bg-slate-500" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden relative" dir={isRTL ? "rtl" : "ltr"}>
      {/* Animated Grid Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-fuchsia-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400/50 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <span className="font-black text-white text-sm">DDS</span>
            </div>
            <div>
              <span className="font-black text-white text-sm tracking-tight block">Dynamic Display System</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold">DDS</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{tr("Features", "الميزات")}</a>
            <a href="#sectors" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{tr("Sectors", "القطاعات")}</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{tr("Pricing", "الأسعار")}</a>
            <a href="#faq" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{tr("FAQ", "الأسئلة")}</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-xs font-bold text-slate-300 transition-all"
            >
              {lang === "en" ? "العربية" : "English"}
            </button>
            <Link href="/activation">
              <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold uppercase text-white transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95">
                {tr("Get Started", "ابدأ الآن")}
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-20 pb-16 max-w-5xl mx-auto">
        {/* Animated badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6 animate-bounce-slow">
          <Sparkles size={14} />
          {tr("Next-Gen Dynamic Data Engine", "الجيل القادم من محركات البيانات الديناميكية")}
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-6">
          {tr("Transform Static Content Into ", "حوّل المحتوى الثابت إلى ")}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400">
            {tr("Interactive Experiences", "تجارب تفاعلية ذكية")}
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed mb-10">
          {tr(
            "DDS is a dynamic data display engine that empowers clinics, hotels, academies, and retail sectors to launch customized interactive catalogs, directories, and real-time AI persona assistants from one centralized administrative dashboard.",
            "منصة ذكية متكاملة لتبسيط ونشر البيانات الديناميكية وتصميم أدلة الخدمات، الكتالوجات، ومساعدين الذكاء الاصطناعي لكافة قطاعات الأعمال في ثوانٍ معدودة."
          )}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link href="/activation">
            <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-sm font-bold uppercase text-white transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 flex items-center gap-2 active:scale-95 group">
              {tr("Launch Your Platform", "أطلق منصتك")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link href="/admin">
            <button className="px-8 py-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-sm font-bold uppercase text-slate-300 transition-all flex items-center gap-2 active:scale-95">
              {tr("Admin Dashboard", "لوحة التحكم")}
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-3xl">
          {[
            { value: "30+", label: tr("Themes", "ثيمات") },
            { value: "1000+", label: tr("Max Users", "مستخدم كحد أقصى") },
            { value: "24/7", label: tr("AI Support", "دعم ذكي") },
            { value: "∞", label: tr("Lifetime Option", "خيار مدى الحياة") }
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm">
              <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-4 py-20 max-w-7xl mx-auto" ref={featuresRef}>
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            {tr("Powerful Features", "ميزات قوية")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {tr("Everything You Need", "كل ما تحتاجه")}
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            {tr(
              "A complete solution for creating and managing dynamic display systems for any business type.",
              "حل متكامل لإنشاء وإدارة أنظمة العرض الديناميكية لأي نوع من الأعمال."
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            const isAnimated = animatedFeatures.includes(idx);
            return (
              <div
                key={idx}
                data-index={idx}
                className={`feature-item p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-sm hover:border-slate-700/80 transition-all duration-500 ${
                  isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sectors Section */}
      <section id="sectors" className="relative z-10 px-4 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider mb-4">
            {tr("Industry Sectors", "القطاعات")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {tr("Perfect for Any Business", "مناسب لأي نشاط")}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {SECTORS.map((sector) => {
            const Icon = sector.icon;
            const isSelected = selectedDemoSector === sector.id;
            return (
              <button
                key={sector.id}
                onClick={() => setSelectedDemoSector(sector.id)}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${sector.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-bold text-white">{sector.name}</span>
              </button>
            );
          })}
        </div>

        {/* Preview Card */}
        <div className="mt-8 p-6 rounded-3xl bg-slate-900/80 border border-slate-800/60 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentPreset.themeId === 'teal' ? 'from-teal-500 to-cyan-500' : currentPreset.themeId === 'gold' ? 'from-amber-500 to-orange-500' : 'from-indigo-500 to-purple-500'} flex items-center justify-center`}>
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{tr(currentPreset.name, currentPreset.nameAr)}</h3>
              <p className="text-sm text-slate-400">{tr(currentPreset.description, currentPreset.descriptionAr)}</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700/50" />
              <div className="flex-1">
                <div className="h-2 w-24 rounded bg-slate-600 mb-1" />
                <div className="h-1.5 w-16 rounded bg-slate-700" />
              </div>
              <button className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500">
                {tr("View", "عرض")}
              </button>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700/50" />
              <div className="flex-1">
                <div className="h-2 w-28 rounded bg-slate-600 mb-1" />
                <div className="h-1.5 w-20 rounded bg-slate-700" />
              </div>
              <button className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500">
                {tr("View", "عرض")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 px-4 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
            {tr("Flexible Plans", "خطط مرنة")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {tr("Choose Your Plan", "اختر خطتك")}
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            {tr(
              "Select the perfect plan for your business needs. All plans include core features.",
              "اختر الخطة المثالية لاحتياجات عملك. جميع الخطط تتضمن الميزات الأساسية."
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { id: 'DDF', name: tr("Free", "مجاني"), price: tr("Free", "مجاني"), color: "from-emerald-500 to-teal-500", features: [tr("Up to 100 Users", "حتى 100 مستخدم"), tr("Basic Features", "ميزات أساسية"), tr("Community Support", "دعم المجتمع")] },
            { id: 'DDM', name: tr("Monthly", "شهري"), price: tr("Contact", "تواصل"), color: "from-blue-500 to-cyan-500", features: [tr("Up to 1000 Users", "حتى 1000 مستخدم"), tr("All Features", "جميع الميزات"), tr("Priority Support", "دعم أولوي")] },
            { id: 'DDY', name: tr("Yearly", "سنوي"), price: tr("Contact", "تواصل"), color: "from-purple-500 to-pink-500", features: [tr("Up to 1000 Users", "حتى 1000 مستخدم"), tr("All Features", "جميع الميزات"), tr("2 Months Free", "شهران مجاناً")] },
            { id: 'DDS', name: tr("Lifetime", "مدى الحياة"), price: tr("Contact", "تواصل"), color: "from-amber-500 to-orange-500", popular: true, features: [tr("Unlimited Users", "مستخدمين غير محدود"), tr("All Features", "جميع الميزات"), tr("Priority Support", "دعم أولوي")] }
          ].map((plan) => (
            <div key={plan.id} className={`relative p-6 rounded-3xl border transition-all ${plan.popular ? 'bg-gradient-to-b from-amber-950/50 to-slate-900 border-amber-500/40 ring-2 ring-amber-500/20' : 'bg-slate-900/60 border-slate-800/60'}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
                  {tr("Best Value", "أفضل قيمة")}
                </span>
              )}
              <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-3xl font-black text-white mb-4">{plan.price}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link href="/activation">
                <button className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg hover:shadow-amber-500/30' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}>
                  {tr("Get Started", "ابدأ الآن")}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 px-4 py-20 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white mb-4">{tr("FAQ", "الأسئلة الشائعة")}</h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden transition-all">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 flex items-center justify-between text-left"
                >
                  <span className="text-sm font-bold text-white pr-4">{faq.q}</span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} flex-shrink-0`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 py-20 max-w-4xl mx-auto">
        <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 overflow-hidden text-center">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
              {tr("Ready to Transform Your Business?", "هل أنت مستعد لتحويل عملك؟")}
            </h2>
            <p className="text-indigo-100 mb-8 max-w-lg mx-auto">
              {tr(
                "Start your journey with DDS today and create stunning dynamic displays in minutes.",
                "ابدأ رحلتك مع DDS اليوم وأنشئ شاشات ديناميكية مذهلة في دقائق."
              )}
            </p>
            <Link href="/activation">
              <button className="px-8 py-4 rounded-2xl bg-white text-indigo-600 font-bold text-sm uppercase tracking-wider hover:bg-indigo-50 transition-all shadow-xl active:scale-95">
                {tr("Get Started Now", "ابدأ الآن")}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="font-black text-white text-sm">DDS</span>
              </div>
              <div>
                <span className="font-black text-white text-sm block">Dynamic Display System</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">DDS</span>
              </div>
            </div>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">
              © {new Date().getFullYear()} DDS - Dynamic Display System
            </p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.5; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 1; }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
