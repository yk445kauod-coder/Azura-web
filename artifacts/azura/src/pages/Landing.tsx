import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useLocation, Link } from "wouter";
import { Sparkles, ArrowRight, ShieldCheck, Cpu, Database, Laptop, Layers, MessageSquare, Zap, Activity, Users, Star, ArrowUpRight, HelpCircle, CheckCircle, HelpCircle as HelpIcon, Plus, Minus, ChevronDown, Monitor, Check } from "lucide-react";
import { SECTOR_PRESETS, COLOR_PRESETS } from "./OnboardingWizard";

export default function Landing() {
  const { lang, setLang, isRTL } = useLang();
  const [, navigate] = useLocation();
  const [selectedDemoSector, setSelectedDemoSector] = useState("clinic");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  const currentPreset = SECTOR_PRESETS.find(s => s.id === selectedDemoSector) || SECTOR_PRESETS[0];
  const currentTheme = COLOR_PRESETS.find(t => t.id === currentPreset.themeId) || COLOR_PRESETS[0];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const FAQS = [
    {
      q: "What is Dynamic Display System (DDS)?",
      qAr: "ما هو نظام العرض الديناميكي (DDS)؟",
      a: "DDS is an all-in-one dynamic system that helps businesses instantly create customized, interactive menus, course catalogs, services sheets, or general directories powered by real-time updates and localized AI agents.",
      aAr: "DDS هو نظام موحد يساعد الشركات على الإنشاء الفوري لقوائم الخدمات، كتالوجات المنتجات، أو الأدلة الذكية المدعومة بالتحديثات الفورية ومساعدين الذكاء الاصطناعي."
    },
    {
      q: "How does the Advanced Business Onboarding Wizard work?",
      qAr: "كيف يعمل معالج إعداد وتهيئة النشاط المطور؟",
      a: "The Onboarding Wizard guides you through picking your sector, name, branding colors, and customizing the AI Persona. On completion, it seeds a matching live catalog preset into the Firebase RTDB automatically.",
      aAr: "يقوم معالج الإعداد بمساعدتك في اختيار قطاعك، اسمك، ألوان الهوية، وتخصيص مساعد الذكاء. عند الانتهاء، يقوم بتحميل كتالوج متكامل متوافق مع اختيارك في ثوانٍ."
    },
    {
      q: "Can I customize the primary and secondary branding colors?",
      qAr: "هل يمكنني تخصيص ألوان الهوية البصرية بنفسي؟",
      a: "Yes! The system is designed to read colors directly from the configuration, meaning all customer-facing cards, headings, and buttons automatically render with your chosen custom brand palette.",
      aAr: "نعم بالطبع! تم تصميم المنصة لتقرأ الألوان مباشرة من الإعدادات، مما يعني أن كافة الواجهات والأزرار تتلون تلقائياً لتناسب ألوان شركتك وهويتك."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden relative" dir={isRTL ? "rtl" : "ltr"}>
      {/* High-tech glow elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-fuchsia-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Cinematic grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-45" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/75 backdrop-blur-md border-b border-slate-900/80 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-extrabold text-sm shadow-md">
            DDS
          </div>
          <div>
            <span className="font-black text-white text-sm sm:text-base tracking-tight block">Dynamic Display System</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black leading-none mt-0.5">dynamic display system</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Lang toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[10px] font-black text-slate-300 transition-colors uppercase"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>

          <Link href="/onboarding">
            <button className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[11px] font-black uppercase text-white transition-all shadow-md shadow-indigo-600/25 active:scale-95">
              {tr("Onboard Business", "إنشاء منصتك")}
            </button>
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-16 pb-12 max-w-4xl mx-auto space-y-6">

        {/* Floating next-gen chip */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-wider animate-pulse">
          <Sparkles size={11} />
          {tr("Next-Gen Dynamic Data Engine", "الجيل القادم من محركات البيانات الديناميكية")}
        </div>

        {/* Dynamic Typography */}
        <h1 className="text-3xl sm:text-6xl font-black text-white leading-tight tracking-tight max-w-3xl">
          {tr("Transform Static Content Into ", "حول المحتوى الثابت إلى ")}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">
            {tr("Interactive Experiences", "تجارب تفاعلية ذكية")}
          </span>
        </h1>

        <p className="text-xs sm:text-base text-slate-400 max-w-2xl leading-relaxed">
          {tr(
            "DDS is a dynamic data display engine that empowers clinics, hotels, academies, and retail sectors to launch customized interactive catalogs, directories, and real-time AI persona assistants from one centralized administrative dashboard.",
            "منصة ذكية متكاملة لتبسيط ونشر البيانات الديناميكية وتصميم أدلة الخدمات، الكتالوجات، ومساعدين الذكاء الاصطناعي لكافة قطاعات الأعمال في ثوانٍ معدودة."
          )}
        </p>

        {/* Hero Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
          <Link href="/onboarding">
            <button className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black uppercase text-white transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95 cursor-pointer">
              {tr("Launch Onboarding Wizard", "معالج الإعداد والتهيئة")} <ArrowRight size={14} />
            </button>
          </Link>
          <Link href="/admin">
            <button className="px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-black uppercase text-slate-300 transition-all active:scale-95 cursor-pointer">
              {tr("Admin Command Center", "لوحة تحكم النظام")}
            </button>
          </Link>
        </div>
      </section>

      {/* INTERACTIVE DEMO SIMULATOR */}
      <section className="relative z-10 px-4 max-w-4xl mx-auto pb-16 w-full space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-black text-white">{tr("Live Sector Simulations", "عرض تفاعلي حي للقطاعات")}</h3>
          <p className="text-xs text-slate-400">
            {tr("Select an industry and watch the colors, labels, and AI persona adapt instantly.", "اختر قطاعاً لمشاهدة كيف تتغير الهوية والألوان والمساعد الذكي فورياً.")}
          </p>
        </div>

        {/* Industry chips selection */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
          {SECTOR_PRESETS.map((sector) => {
            const isSel = selectedDemoSector === sector.id;
            return (
              <button
                key={sector.id}
                onClick={() => setSelectedDemoSector(sector.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
                  isSel
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <span>{tr(sector.name.split(" ")[0], sector.nameAr.split(" ")[0])}</span>
              </button>
            );
          })}
        </div>

        {/* Visual Device Simulator Mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden items-stretch">

          {/* Left panel: Custom variables details */}
          <div className="sm:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{tr("Dynamic Schema Values", "قيم البيانات المتغيرة")}</span>
              <h4 className="text-xl font-black text-white">{tr(currentPreset.name, currentPreset.nameAr)}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{tr(currentPreset.description, currentPreset.descriptionAr)}</p>
            </div>

            <div className="space-y-2 bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-[11px] font-semibold text-slate-400 leading-normal">
              <div>
                <span className="text-slate-500 block text-[9px] font-bold uppercase tracking-wider">{tr("Active Theme preset", "الهوية اللونية النشطة")}</span>
                <span className="text-white font-bold capitalize mt-0.5 block">{currentPreset.themeId} Palette</span>
              </div>
              <div className="mt-2.5">
                <span className="text-slate-500 block text-[9px] font-bold uppercase tracking-wider">{tr("Dynamic Assistant Persona", "اسم ومساعد الذكاء")}</span>
                <span className="text-indigo-400 font-bold mt-0.5 block">{currentPreset.assistantName}</span>
              </div>
            </div>
          </div>

          {/* Right panel: Live device preview */}
          <div className="sm:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[300px] shadow-inner relative overflow-hidden">

            {/* Simulator header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentTheme.previewColor }} />
                <span className="text-[11px] font-black text-white">{tr(currentPreset.name, currentPreset.nameAr)}</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>

            {/* Simulated app core area */}
            <div className="flex-1 flex flex-col justify-center space-y-4 py-2">
              <div className="space-y-1 text-center">
                <h5 className="text-xs font-bold text-slate-300">
                  {tr("Enter Your ", "يرجى إدخال ")}
                  <span style={{ color: currentTheme.previewColor }}>
                    {selectedDemoSector === "clinic" ? tr("Clinic Room / Ticket ID", "عيادة / تذكرة الدخول") :
                     selectedDemoSector === "hotel" ? tr("Suite / Room Number", "رقم الغرفة / الجناح") :
                     selectedDemoSector === "academy" ? tr("Seat / Student ID", "رقم المقعد / الطالب") :
                     selectedDemoSector === "ecommerce" ? tr("Customer Session ID", "رقم الجلسة") :
                     selectedDemoSector === "signage" ? tr("Display Screen ID", "رقم شاشة العرض") :
                     selectedDemoSector === "cafe" ? tr("Table Number", "رقم الطاولة") :
                     tr("Room / Session ID", "رقم الغرفة / الجلسة")}
                  </span>
                </h5>
                <input
                  type="text"
                  disabled
                  placeholder="e.g. 104"
                  className="w-24 text-center py-1 bg-slate-900 border border-slate-800 rounded text-xs font-bold focus:outline-none"
                />
              </div>

              {/* Mini Assistant chat simulation bubble */}
              <div className="p-2.5 rounded-xl text-[10px] leading-relaxed flex items-start gap-2 max-w-[85%] border border-slate-900 bg-slate-900/50">
                <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-[8px] text-white" style={{ backgroundColor: currentTheme.previewColor }}>
                  A
                </div>
                <div>
                  <p className="font-bold text-white leading-none">{currentPreset.assistantName}</p>
                  <p className="text-slate-400 mt-1 leading-snug">{tr(currentPreset.assistantGreeting, currentPreset.assistantGreetingAr)}</p>
                </div>
              </div>
            </div>

            {/* Simulator bottom button */}
            <button
              className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase text-white shadow-sm flex-shrink-0"
              style={{ backgroundColor: currentTheme.previewColor }}
            >
              {tr("Explore Dynamic Catalog", "استكشاف كتالوج الخدمات")}
            </button>
          </div>

        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="relative z-10 px-4 max-w-4xl mx-auto py-12 w-full space-y-10">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-black text-white">{tr("Powerful Features For Growth", "ميزات متطورة لدعم نموك")}</h3>
          <p className="text-xs text-slate-400">{tr("Everything you need to showcase, support, and analyze interaction in real-time.", "كل ما تحتاجه لعرض بياناتك وتحديثها وتحليل سلوك الزوار فورياً.")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: Laptop, title: "Dynamic Catalog Display", titleAr: "كتالوج عرض تفاعلي", text: "Responsive layout that works as a mobile app, web platform, or tablet screen.", textAr: "تنسيق متجاوب يعمل كتطبيق جوال، منصة ويب، أو شاشات عرض ذكية للشركات." },
            { icon: MessageSquare, title: "Contextual AI Agent", titleAr: "مساعد ذكاء اصطناعي", text: "AI agent trained directly on your catalog details to guide and recommend solutions.", textAr: "عميل ذكاء اصطناعي مدرب بالكامل على تفاصيل بياناتك لمساعدة الزوار فورياً." },
            { icon: Activity, title: "Real-time Update Sync", titleAr: "مزامنة لحظية مباشرة", text: "Central administrative dashboard to patch catalog items, descriptions, and media instantly.", textAr: "لوحة تحكم مركزية لتعديل محتويات الكتالوج، المكونات، والصور بشكل فوري." }
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all text-center space-y-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                  <Icon size={20} />
                </div>
                <h4 className="text-xs font-bold text-white">{tr(feat.title, feat.titleAr)}</h4>
                <p className="text-[11px] text-slate-400 leading-normal">{tr(feat.text, feat.textAr)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ENTERPRISE PRICING TIE */}
      <section className="relative z-10 px-4 max-w-4xl mx-auto py-12 w-full space-y-10">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-black text-white">{tr("Flexible Pricing Plans", "خطط تسعير مرنة ومناسبة")}</h3>
          <p className="text-xs text-slate-400">{tr("No hidden fees. Select the subscription scale that fits your current operational size.", "بدون رسوم خفية. اختر الخطة التي تتناسب مع حجم أعمالك الحالي.")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-stretch">
          {[
            { name: "Starter", nameAr: "المبتدئ", price: "$49", period: "/mo", desc: "Perfect for single locations or small offices.", descAr: "مثالية للمقرات الفردية والمكاتب الصغيرة.", features: ["1 Active Workspace", "Up to 50 Catalog Items", "Interactive AI Support", "Standard Theme Palettes"] },
            { name: "Professional", nameAr: "المحترف", price: "$129", period: "/mo", desc: "Best for clinics, boutique hotels, and retail stores.", descAr: "الخيار الأفضل للعيادات، الفنادق، ومتاجر التجزئة.", features: ["5 Active Workspaces", "Up to 250 Catalog Items", "AI Persona customization", "Advanced CRM Analytics", "Priority Email Support"], premium: true },
            { name: "Enterprise Custom", nameAr: "المؤسسات", price: "Custom", period: "", desc: "Designed for medical chains, franchises, or digital signage boards.", descAr: "مصمم لسلاسل الفروع الكبرى وشبكات الشاشات الرقمية.", features: ["Unlimited Workspaces", "Unlimited Items", "Dedicated AI Trained Model", "Custom Domain Mapping", "API Integration Logs", "24/7 Phone Support"] }
          ].map((tier, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-3xl border flex flex-col justify-between space-y-6 transition-all ${
                tier.premium
                  ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/25 relative"
                  : "bg-slate-900 border-slate-800/80 hover:border-slate-700"
              }`}
            >
              {tier.premium && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider shadow">
                  Most Popular
                </span>
              )}
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-black text-white">{tr(tier.name, tier.nameAr)}</h4>
                  <p className="text-[10px] text-slate-400 leading-snug mt-1">{tr(tier.desc, tier.descAr)}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">{tier.price}</span>
                  <span className="text-xs text-slate-500">{tier.period}</span>
                </div>
                <div className="h-px bg-slate-800/60" />
                <ul className="space-y-2.5 text-[11px] text-slate-300 font-semibold">
                  {tier.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2">
                      <Check className="text-indigo-400 flex-shrink-0" size={12} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/onboarding">
                <button className={`w-full py-3 rounded-xl text-xs font-black uppercase transition-all active:scale-95 ${
                  tier.premium ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}>
                  {tr("Get Started", "ابدأ الآن")}
                </button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="relative z-10 px-4 max-w-4xl mx-auto py-12 w-full space-y-10">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-black text-white">{tr("Frequently Asked Questions", "الأسئلة الشائعة")}</h3>
          <p className="text-xs text-slate-400">{tr("Find rapid answers regarding system deployments, onboarding, and customized modules.", "اعثر على إجابات سريعة حول التثبيت، معالج الإعداد، والخصائص المتاحة.")}</p>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 flex items-center justify-between text-left font-black text-xs sm:text-sm text-white"
                >
                  <span>{tr(faq.q, faq.qAr)}</span>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/40 pt-2.5 animate-in fade-in duration-200">
                    {tr(faq.a, faq.aAr)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-900 py-8 px-6 text-center text-[10px] text-slate-500 uppercase tracking-widest font-black">
        <div>
          © {new Date().getFullYear()} {tr("Dynamic Display System (DDS) · Enterprise Suite", "منصة العرض الديناميكية (DDS) · حزمة الشركات")}
        </div>
        <div className="mt-2 text-[9px] text-slate-600 lowercase tracking-normal">
          {tr("built with dynamic variables and real-time syncing templates", "تم تطويرها بمستندات متغيرة لحظية وبث بيانات تفاعلي")}
        </div>
      </footer>
    </div>
  );
}
