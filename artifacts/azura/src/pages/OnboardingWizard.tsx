import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { db, ref, set } from "@/lib/firebase";
import { smartSet } from "@/lib/dbWrapper";
import { swalSuccess, swalError, swalLoading, swalClose } from "@/lib/swal";
import { ShieldCheck, ArrowRight, ArrowLeft, Bot, Palette, Sparkles, Check, Layout, Database, ShoppingBag, Stethoscope, Hotel, GraduationCap, Tv, Coffee, HelpCircle, MapPin, Phone, Instagram, FileText, CheckCircle2, User } from "lucide-react";

export interface ColorPreset {
  id: string;
  name: string;
  nameAr: string;
  primary: string;       // HSL values formatted as string "H S L" for direct Tailwind binding
  secondary: string;     // HSL values formatted as string "H S L"
  accent: string;        // HSL values formatted as string "H S L"
  background: string;    // HSL values formatted as string "H S L"
  card: string;          // HSL values formatted as string "H S L"
  previewColor: string;  // Hex for preview circles
}

export const SECTOR_PRESETS = [
  {
    id: "clinic",
    icon: Stethoscope,
    name: "Medical Clinic",
    nameAr: "عيادة طبية",
    description: "Display doctors list, clinical specialties, and book consultations.",
    descriptionAr: "عرض قائمة الأطباء، التخصصات الطبية، وحجز الاستشارات.",
    themeId: "teal",
    assistantName: "HealthBot",
    assistantGreeting: "Hello! I am HealthBot, your personal medical assistant. How can I guide your clinical visit today?",
    assistantGreetingAr: "مرحباً! أنا هيلث بوت، مساعدك الطبي الشخصي. كيف يمكنني إرشادك في زيارتك الطبية اليوم؟"
  },
  {
    id: "hotel",
    icon: Hotel,
    name: "Luxury Hotel & Resort",
    nameAr: "فندق ومنتجع فاخر",
    description: "Present luxury suites, catalog room service menus, and concierge services.",
    descriptionAr: "عرض الأجنحة الفاخرة، قوائم خدمة الغرف، وخدمات الاستقبال.",
    themeId: "gold",
    assistantName: "AI Concierge",
    assistantGreeting: "Welcome to our Hotel! I am your virtual Concierge. How can I assist you with room services or bookings today?",
    assistantGreetingAr: "أهلاً بك في فندقنا! أنا المساعد الافتراضي لخدمتك. كيف يمكنني مساعدتك في حجز الغرف أو طلبات الخدمة اليوم؟"
  },
  {
    id: "academy",
    icon: GraduationCap,
    name: "Education Academy",
    nameAr: "أكاديمية تعليمية",
    description: "Showcase educational course catalogs, instructors list, and workshop schedules.",
    descriptionAr: "عرض كتالوجات الدورات التعليمية، قائمة المحاضرين، ومواعيد ورش العمل.",
    themeId: "emerald",
    assistantName: "EduHelper",
    assistantGreeting: "Hi there! I am EduHelper. Which course, workshop, or skill track can I help you explore today?",
    assistantGreetingAr: "مرحباً بك! أنا إيديو هيلبر. ما هي الدورة أو ورشة العمل التي تود استكشافها اليوم؟"
  },
  {
    id: "ecommerce",
    icon: ShoppingBag,
    name: "Retail E-Commerce",
    nameAr: "متجر تجارة إلكترونية",
    description: "Launch sleek product catalogs, list accessories, and answer customer queries.",
    descriptionAr: "إطلاق كتالوجات المنتجات، عرض الإكسسوارات، والإجابة على استفسارات المشترين.",
    themeId: "purple",
    assistantName: "StyleAdvisor",
    assistantGreeting: "Hello! I am StyleAdvisor, your shopping assistant. Tell me what style or product you're searching for!",
    assistantGreetingAr: "أهلاً بك! أنا ستايل أدفايزر، مساعد التسوق الخاص بك. أخبرني عن المنتج أو الموديل الذي تبحث عنه!",
    tableLabelEn: "Workspace / Seat",
    tableLabelAr: "رقم المقعد / المكتب"
  },
  {
    id: "signage",
    icon: Tv,
    name: "Digital Signage Screen",
    nameAr: "شاشة عرض رقمية",
    description: "Broadcast advertisements, video reels, bulletin notices, and promotions.",
    descriptionAr: "بث الإعلانات، عروض الفيديو، التنبيهات العامة، والعروض الترويجية.",
    themeId: "navy",
    assistantName: "SmartSign AI",
    assistantGreeting: "Hi! I am SmartSign AI. Ask me anything about our directory, current displays, or promotions!",
    assistantGreetingAr: "مرحباً! أنا سمارت ساين. اسألني عن دليل المبنى، العروض الحالية، أو التنبيهات المباشرة!"
  },
  {
    id: "cafe",
    icon: Coffee,
    name: "Café & Lounge",
    nameAr: "مقهى وصالة",
    description: "Digitize specialty coffees, warm lounge appetizers, and shisha catalog.",
    descriptionAr: "تحويل قائمة القهوة المختصة، المقبلات، وحلويات الصالة إلى تجربة رقمية تفاعلية.",
    themeId: "cafe",
    assistantName: "Zura AI",
    assistantGreeting: "Hey! I am Zura, your smart AI barista. What delicious coffee, dessert, or drink can I suggest for you today?",
    assistantGreetingAr: "أهلاً بك! أنا زورا، الباريستا الذكي لمساعدتك. ما هي القهوة أو الحلويات اللذيذة التي ترغب بها اليوم؟"
  },
  {
    id: "custom",
    icon: HelpCircle,
    name: "Custom Directory",
    nameAr: "دليل مخصص",
    description: "Fully customizable dynamic database platform adaptable to any sector.",
    descriptionAr: "منصة بيانات ديناميكية مرنة بالكامل ومناسبة لأي قطاع عمل.",
    themeId: "navy",
    assistantName: "Dynamic Agent",
    assistantGreeting: "Hello! How can I assist you with our dynamic business directory or catalog services today?",
    assistantGreetingAr: "مرحباً بك! كيف يمكنني مساعدتك اليوم في دليل الخدمات والكتالوج الذكي الخاص بنا؟"
  }
];

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "teal",
    name: "Ocean Teal (Medical Preset)",
    nameAr: "تيل المحيط (طبي ونظيف)",
    primary: "171 94% 28%",       // #0D9488
    secondary: "172 80% 50%",     // #14B8A6
    accent: "171 85% 20%",        // #0F766E
    background: "171 30% 96%",
    card: "171 20% 98%",
    previewColor: "#0D9488"
  },
  {
    id: "navy",
    name: "Corporate Navy (Enterprise)",
    nameAr: "أزرق كحلي (شركات ومؤسسات)",
    primary: "224 76% 36%",       // #1E3A8A
    secondary: "217 91% 60%",     // #3B82F6
    accent: "224 80% 28%",        // #1D4ED8
    background: "220 20% 95%",
    card: "220 15% 98%",
    previewColor: "#1E3A8A"
  },
  {
    id: "gold",
    name: "Luxury Gold (Hotels & Wellness)",
    nameAr: "ذهبي فاخر (فنادق ومنتجعات)",
    primary: "35 76% 25%",        // #78350F
    secondary: "35 90% 45%",       // #D97706
    accent: "35 85% 18%",         // #B45309
    background: "38 40% 94%",
    card: "38 30% 97%",
    previewColor: "#D97706"
  },
  {
    id: "purple",
    name: "Royal Purple (E-Commerce)",
    nameAr: "بنفسجي ملكي (متاجر وتجزئة)",
    primary: "275 80% 25%",       // #581C87
    secondary: "271 91% 65%",     // #8B5CF6
    accent: "272 85% 22%",        // #6D28D9
    background: "270 15% 95%",
    card: "270 10% 98%",
    previewColor: "#8B5CF6"
  },
  {
    id: "emerald",
    name: "Emerald Green (Education)",
    nameAr: "أخضر زمردي (تعليم وتدريب)",
    primary: "165 85% 18%",       // #064E3B
    secondary: "150 80% 40%",     // #10B981
    accent: "160 85% 15%",        // #047857
    background: "160 15% 94%",
    card: "160 10% 97%",
    previewColor: "#10B981"
  },
  {
    id: "cafe",
    name: "Warm Lounge (Classic Brown)",
    nameAr: "كافيه كلاسيكي دافئ",
    primary: "22 55% 22%",        // original rich brown
    secondary: "35 42% 52%",       // original warm golden tan
    accent: "35 50% 60%",         // gold accent
    background: "38 40% 93%",
    card: "38 35% 96%",
    previewColor: "#5D3E23"
  }
];

// Mock templates for immediate dynamic database seeding
const SEED_TEMPLATES: Record<string, Record<string, any>> = {
  clinic: {
    "specialists": {
      "dr-sarah": {
        name: "Dr. Sarah Jenkins - Cardiology",
        nameAr: "د. سارة جينكينز - أمراض القلب",
        description: "MD, FACC. 12+ years expertise in cardiovascular health and preventative care.",
        descriptionAr: "دكتوراه، زميل الكلية الأمريكية لأمراض القلب. خبرة تزيد عن 12 عاماً في صحة القلب.",
        price: 500,
        category: "specialists",
        categoryAr: "الأطباء والأخصائيين",
        available: true,
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80",
        ingredients: ["Cardiology Consult", "ECG Review", "Vascular Health Check"],
        ingredientsAr: ["استشارة قلبية", "مراجعة رسم القلب", "فحص صحة الأوعية الدموية"]
      },
      "dr-ahmed": {
        name: "Dr. Ahmed Rashed - Neurology",
        nameAr: "د. أحمد راشد - أمراض المخ والأعصاب",
        description: "Specialist in neurodegenerative diseases, stroke management, and sleep studies.",
        descriptionAr: "أخصائي أمراض المخ والأعصاب وإدارة الجلطات ودراسات النوم.",
        price: 550,
        category: "specialists",
        categoryAr: "الأطباء والأخصائيين",
        available: true,
        image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&q=80",
        ingredients: ["Neurology Consult", "Cognitive Assessment", "Reflex Testing"],
        ingredientsAr: ["استشارة مخ وأعصاب", "تقييم إدراكي وحركي", "فحص الانعكاسات العصبية"]
      }
    },
    "diagnostic_labs": {
      "mri-scan": {
        name: "High-Resolution MRI Scan",
        nameAr: "رنين مغناطيسي عالي الدقة",
        description: "Full body or targeted organ high-fidelity imaging using state-of-the-art MRI scanner.",
        descriptionAr: "تصوير عالي الدقة لكامل الجسم أو أعضاء محددة باستخدام أحدث أجهزة الرنين المغناطيسي.",
        price: 2400,
        category: "diagnostic_labs",
        categoryAr: "الفحوصات والأشعة",
        available: true,
        image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&q=80",
        ingredients: ["Detailed Imaging Report", "Digital CD Copy", "Consultation Brief"],
        ingredientsAr: ["تقرير طبي مفصل", "نسخة رقمية على CD", "ملخص استشاري"]
      },
      "blood-panel": {
        name: "Comprehensive Metabolic Blood Panel",
        nameAr: "تحليل دم شامل ووظائف أعضاء",
        description: "Measures 14 essential blood chemical levels, thyroid functions, and complete lipid profile.",
        descriptionAr: "يقيس 14 مؤشراً كيميائياً أساسياً، وظائف الغدة الدرقية، ومستويات الدهون الشاملة.",
        price: 750,
        category: "diagnostic_labs",
        categoryAr: "الفحوصات والأشعة",
        available: true,
        image: "https://images.unsplash.com/photo-1579154204601-01588f35116f?w=600&q=80",
        ingredients: ["Kidney & Liver Functions", "Cholesterol Levels", "Glucose Levels", "Complete Blood Count"],
        ingredientsAr: ["وظائف الكبد والكلى", "مستويات الكوليسترول والدهون", "معدل السكر", "صورة دم كاملة"]
      }
    }
  },
  hotel: {
    "suites_rooms": {
      "presidential-suite": {
        name: "Presidential Sea-View Suite",
        nameAr: "الجناح الرئاسي المطل على البحر",
        description: "Ultra-luxury 120sqm suite featuring master bedroom, lounge room, hot tub, and panorama balcony.",
        descriptionAr: "جناح فخم بمساحة 120م² يضم غرفة ماستر، صالة معيشة، جاكوزي، وشرفة بانورامية.",
        price: 8500,
        category: "suites_rooms",
        categoryAr: "الأجنحة والغرف",
        available: true,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
        ingredients: ["King Bed", "Ocean View", "Private Hot Tub", "Butler Service", "Free Minibar"],
        ingredientsAr: ["سرير كينج فخم", "إطلالة مباشرة للبحر", "جاكوزي خاص", "خدمة المساعد الشخصي", "ميني بار مجاني"]
      },
      "deluxe-king": {
        name: "Deluxe King Room",
        nameAr: "غرفة ديلوكس كينج فاخرة",
        description: "Contemporary 45sqm spacious room featuring garden view, premium bedding, and work desk.",
        descriptionAr: "غرفة واسعة بمساحة 45م² تطل على الحديقة، مع سرير فاخر ومكتب عمل مجهز.",
        price: 3200,
        category: "suites_rooms",
        categoryAr: "الأجنحة والغرف",
        available: true,
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80",
        ingredients: ["Garden View", "Rain Shower", "HD Smart TV", "Espresso Machine"],
        ingredientsAr: ["إطلالة حديقة مميزة", "شاور مطري", "تلفزيون ذكي HD", "ماكينة قهوة إسبرسو"]
      }
    },
    "spa_wellness": {
      "couple-massage": {
        name: "Couples Aromatherapy Massage",
        nameAr: "جلسة تدليك عطري للأزواج",
        description: "80 minutes of relaxing aromatherapy massage using organic botanical oils and warm stones.",
        descriptionAr: "80 دقيقة من الاسترخاء والتدليك العطري باستخدام زيوت نباتية عضوية وأحجار دافئة.",
        price: 1800,
        category: "spa_wellness",
        categoryAr: "السبا والمنتجع الصحي",
        available: true,
        image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&q=80",
        ingredients: ["Botanical Oils", "Hot Stones Therapy", "Head & Feet Reflexology"],
        ingredientsAr: ["زيوت نباتية عطرية", "علاج بالأحجار الدافئة", "مساج ضغط للرأس والقدمين"]
      }
    }
  },
  academy: {
    "courses": {
      "fullstack-web": {
        name: "Fullstack Web Engineering (React/Node)",
        nameAr: "هندسة الويب الشاملة (React/Node)",
        description: "16-week comprehensive certified bootcamp covering frontend, backend, databases, and deployment.",
        descriptionAr: "برنامج تدريبي شامل معتمد لمدة 16 أسبوعاً يغطي الواجهات، الخلفية، قواعد البيانات، والاستضافة.",
        price: 4500,
        category: "courses",
        categoryAr: "الدورات والمسارات التدريبية",
        available: true,
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80",
        ingredients: ["HTML/CSS/JS", "React & Redux", "NodeJS & Express", "MongoDB/SQL", "CI/CD & Docker"],
        ingredientsAr: ["أساسيات الويب والبرمجة", "تطوير الواجهات React", "برمجة الخلفية NodeJS", "قواعد البيانات SQL", "أدوات الاستضافة Docker"]
      },
      "uiux-design": {
        name: "UI/UX Product Design Masterclass",
        nameAr: "ماستر كلاس تصميم واجهات وتجربة المستخدم",
        description: "8-week intensive workshop covering wireframing, layout architecture, Figma prototyping, and user tests.",
        descriptionAr: "ورشة عمل مكثفة لمدة 8 أسابيع تغطي تصميم الهياكل السلكية، هندسة التنسيق، Figma، واختبارات المستخدمين.",
        price: 3200,
        category: "courses",
        categoryAr: "الدورات والمسارات التدريبية",
        available: true,
        image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&q=80",
        ingredients: ["Figma Mastery", "Information Architecture", "Prototyping", "A/B Testing", "Portfolio Project"],
        ingredientsAr: ["احتراف برنامج Figma", "هندسة المعلومات والمخططات", "بناء النماذج التفاعلية", "دراسة سلوك المستخدمين", "مشروع بورتفوليو احترافي"]
      }
    }
  },
  ecommerce: {
    "tech_gadgets": {
      "pro-headset": {
        name: "Pro Wireless ANC Headset",
        nameAr: "سماعة أذن احترافية لا سلكية عازلة للضوضاء",
        description: "High-fidelity active noise cancelling smart headphones with 45-hour playback and dual mic array.",
        descriptionAr: "سماعة ذكية عازلة للضوضاء تتميز بنقاء صوت فائق، بطارية تدوم 45 ساعة، وميكروفون ثنائي.",
        price: 1850,
        category: "tech_gadgets",
        categoryAr: "الأجهزة الإلكترونية",
        available: true,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
        ingredients: ["Active Noise Cancelling", "Hi-Res Audio Cert", "Bluetooth 5.3", "Fast Charging USBC"],
        ingredientsAr: ["نظام عزل الضوضاء النشط", "جودة صوت عالية الدقة", "بلوتوث الجيل الخامس", "شحن سريع USBC"]
      },
      "power-bank": {
        name: "Ultra-Thin 20,000mAh Power Bank",
        nameAr: "شاحن سفري فائق النحافة 20 ألف مللي أمبير",
        description: "Heavy duty slim aluminum housing power bank supporting 22.5W dual port fast charging.",
        descriptionAr: "شاحن سفري نحيف وقوي من الألمنيوم يدعم الشحن السريع بقوة 22.5 واط بمنافذ متعددة.",
        price: 650,
        category: "tech_gadgets",
        categoryAr: "الأجهزة الإلكترونية",
        available: true,
        image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80",
        ingredients: ["20,000mAh Capacity", "22.5W Power Delivery", "USBC & USBA Ports", "Digital LED Status Indicator"],
        ingredientsAr: ["سعة 20 ألف مللي أمبير", "شحن سريع بقوة 22.5 واط", "منافذ شحن USBC و USB", "شاشة رقمية LED لحالة البطارية"]
      }
    }
  },
  signage: {
    "announcements": {
      "maintenance": {
        name: "Mainframe System Upgrade Window",
        nameAr: "ترقية وصيانة خوادم النظام الرئيسية",
        description: "Global system maintenance window scheduled for midnight this Sunday. Intermittent connectivity is expected.",
        descriptionAr: "أعمال صيانة وتحديث مجدولة لخوادم النظام الأساسية يوم الأحد منتصف الليل. قد يحدث انقطاع طفيف.",
        price: 0,
        category: "announcements",
        categoryAr: "التنبيهات والأخبار العامة",
        available: true,
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
        ingredients: ["Sunday 12:00 AM - 4:00 AM", "Global Server Upgrade", "Performance Boosts"],
        ingredientsAr: ["الأحد 12:00 منتصف الليل - 4:00 فجراً", "ترقية خوادم شاملة", "تحسينات هائلة في سرعة المنصة"]
      }
    }
  },
  cafe: {
    "coffee": {
      "spanish-latte": {
        name: "Iced Spanish Latte",
        nameAr: "سبانش لاتيه بارد",
        description: "Double shot of premium espresso blended with sweet condensed milk, organic milk, and ice.",
        descriptionAr: "جرعتين من الإسبرسو الفاخر ممزوج ببراعة مع حليب مكثف محلى، حليب عضوي، ومكعبات الثلج.",
        price: 115,
        category: "coffee",
        categoryAr: "القهوة والمشروبات المختصة",
        available: true,
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
        ingredients: ["Double Espresso", "Sweetened Condensed Milk", "Premium Whole Milk", "Crystal Ice"],
        ingredientsAr: ["جرعتين إسبرسو", "حليب مكثف محلى", "حليب فاخر كامل الدسم", "مكعبات ثلج نقية"]
      }
    }
  }
};

export default function OnboardingWizard() {
  const { lang, setLang, isRTL } = useLang();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form States (Step 1-3)
  const [selectedSector, setSelectedSector] = useState("custom");
  const [brandName, setBrandName] = useState("");
  const [brandTagline, setBrandTagline] = useState("");
  const [brandDesc, setBrandDesc] = useState("");
  const [brandPhone, setBrandPhone] = useState("+20 100 000 0000");
  const [brandLocation, setBrandLocation] = useState("Cairo, Egypt");
  const [brandSocial, setBrandSocial] = useState("@mydynamic_display");
  const [selectedTheme, setSelectedTheme] = useState("navy");

  const [tableLabelEn, setTableLabelEn] = useState("Room / Table / Seat #");
  const [tableLabelAr, setTableLabelAr] = useState("رقم الغرفة / الطاولة / المقعد");

  // Step 4 State: AI Assistant Customization
  const [aiAssistantName, setAiAssistantName] = useState("DDS Assistant");
  const [aiAssistantGreeting, setAiAssistantGreeting] = useState("Hello! I am your dynamic AI assistant. How can I help you today?");
  const [aiAssistantGreetingAr, setAiAssistantGreetingAr] = useState("مرحباً! أنا المساعد الذكي لمساعدتك وتوجيهك اليوم. كيف يمكنني خدمتك؟");
  const [aiSystemPrompt, setAiSystemPrompt] = useState("");
  const [aiSystemPromptAr, setAiSystemPromptAr] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=DDSAssistant&backgroundColor=a3e635&clothingColor=312e81&skinColor=f5d0c5");

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;
  const activePreset = COLOR_PRESETS.find(p => p.id === selectedTheme) || COLOR_PRESETS[0];

  const handleSectorSelect = (sectorId: string) => {
    setSelectedSector(sectorId);
    const sector = SECTOR_PRESETS.find(s => s.id === sectorId);
    if (sector) {
      setSelectedTheme(sector.themeId);
      setAiAssistantName(sector.assistantName);
      setAiAssistantGreeting(sector.assistantGreeting);
      setAiAssistantGreetingAr(sector.assistantGreetingAr);

      // Auto-set labels depending on the sector
      if (sectorId === "clinic") {
        setTableLabelEn("Clinic Room / Ticket ID");
        setTableLabelAr("عيادة / تذكرة الدخول");
      } else if (sectorId === "hotel") {
        setTableLabelEn("Suite / Room Number");
        setTableLabelAr("رقم الغرفة / الجناح");
      } else if (sectorId === "academy") {
        setTableLabelEn("Seat / Student ID");
        setTableLabelAr("رقم المقعد / الطالب");
      } else if (sectorId === "ecommerce") {
        setTableLabelEn("Customer Session ID");
        setTableLabelAr("رقم الجلسة");
      } else if (sectorId === "signage") {
        setTableLabelEn("Display Screen ID");
        setTableLabelAr("رقم شاشة العرض");
      } else if (sectorId === "cafe") {
        setTableLabelEn("Table Number");
        setTableLabelAr("رقم الطاولة");
      } else {
        setTableLabelEn("Table / Session / Room #");
        setTableLabelAr("رقم الطاولة / الغرفة / الجلسة");
      }
    }
  };

  const handleRandomizeAvatar = () => {
    const seeds = ["Aria", "Leo", "Nova", "Max", "Luna", "Kai", "Sasha", "Zane", "Cleo", "Milo"];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + Math.floor(Math.random() * 100);
    const colors = ["c0aede", "a3e635", "fdba74", "818cf8", "f472b6", "2dd4bf"];
    const randColor = colors[Math.floor(Math.random() * colors.length)];
    setSelectedAvatar(`https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${randomSeed}&backgroundColor=${randColor}`);
  };

  const handleCompleteSetup = async () => {
    swalLoading(tr("Seeding Catalog & Deploying DDS System...", "جاري تهيئة قاعدة البيانات وبناء واجهة النظام..."));
    setLoading(true);

    try {
      // 1. Prepare Brand / System Configuration Model
      const ddsConfig = {
        brandName,
        brandTagline,
        brandDesc,
        brandPhone,
        brandLocation,
        brandSocial,
        sector: selectedSector,
        themeId: selectedTheme,
        colors: {
          primary: activePreset.primary,
          secondary: activePreset.secondary,
          accent: activePreset.accent,
          background: activePreset.background,
          card: activePreset.card,
        },
        labels: {
          tableLabelEn,
          tableLabelAr,
        },
        onboarded: true,
        updatedAt: Date.now()
      };

      // 2. Prepare AI Config Model
      const finalPrompt = aiSystemPrompt || `You are ${aiAssistantName}, the virtual AI assistant for ${brandName}. Your sector is ${selectedSector}. Be helpful, professional, and warmly guide our clients. Keep responses concise.`;
      const finalPromptAr = aiSystemPromptAr || `أنت ${aiAssistantName}، المساعد الافتراضي لـ ${brandName}. كن مفيداً ومحترفاً وأجيب عن التساؤلات بوضوح بالعامية المصرية المبسطة.`;

      const aiConfig = {
        baristaName: aiAssistantName,
        baristaAvatar: selectedAvatar,
        instagram: brandSocial,
        cafeName: brandName,
        cafeLocation: brandLocation,
        cafeHours: "9:00 AM - 10:00 PM",
        cafePhone: brandPhone,
        greeting: aiAssistantGreeting,
        greetingAr: aiAssistantGreetingAr,
        systemPrompt: finalPrompt,
        systemPromptAr: finalPromptAr,
      };

      const apiSettings = {
        aiEnabled: true,
        aiProvider: "pollinations", // free fallback
        menuNode: "menu",
      };

      // 3. Write configuration objects to Firebase
      await smartSet("dds-config", ddsConfig);
      await smartSet("ai-config", aiConfig);
      await smartSet("api-settings", apiSettings);

      // 4. Seed Sector Template Catalog
      const templateData = SEED_TEMPLATES[selectedSector] || SEED_TEMPLATES["cafe"];
      if (templateData) {
        await smartSet("menu", templateData);
      }

      swalClose();
      swalSuccess(tr("Deployment Complete! Enjoy your custom setup.", "تم التثبيت وبناء النظام بنجاح! استمتع بنظامك المخصص."));

      // Navigate to Dynamic Catalog
      navigate("/menu");
    } catch (err: any) {
      console.error(err);
      swalClose();
      swalError(tr("Failed to deploy system config. Try again.", "فشل في حفظ وتثبيت إعدادات النظام. حاول مجدداً."));
    } finally {
      setLoading(false);
    }
  };

  const inpClass = "w-full px-4 py-2.5 bg-slate-800 border border-slate-700/60 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors";
  const lblClass = "text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Decorative dynamic glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        {/* Logo/Identity */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-extrabold shadow-lg">
              DDS
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white">
                {tr("Dynamic Display System", "منصة العرض الديناميكية")}
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                {tr("Enterprise Setup Wizard", "معالج الإعداد للمؤسسات")}
              </p>
            </div>
          </div>

          {/* Lang toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>

        {/* Steps progress indicator */}
        <div className="grid grid-cols-5 gap-2 relative z-10">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex flex-col gap-1.5">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? "bg-indigo-500 shadow-md shadow-indigo-500/30" : "bg-slate-800"}`} />
              <span className={`text-[9px] text-center font-bold tracking-tighter ${s === step ? "text-indigo-400 font-extrabold" : "text-slate-500"}`}>
                {s === 1 ? tr("Industry", "القطاع") :
                 s === 2 ? tr("Branding", "الهوية") :
                 s === 3 ? tr("Visuals", "الألوان") :
                 s === 4 ? tr("AI Persona", "مساعد الذكاء") :
                 tr("Seed Catalog", "البيانات")}
              </span>
            </div>
          ))}
        </div>

        {/* Step container content */}
        <div className="min-h-[380px] flex flex-col justify-center relative z-10 py-2">

          {/* STEP 1: SELECT INDUSTRY / SECTOR */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1 text-center mb-2">
                <h3 className="text-base font-black text-white">{tr("Choose Your Business Industry", "اختر قطاع عملك")}</h3>
                <p className="text-xs text-slate-400">
                  {tr("We will pre-configure catalogs and layouts matching this setup.", "سنقوم بتهيئة الكتالوجات والقوائم المسبقة لتناسب هذا الاختيار.")}
                </p>
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                {SECTOR_PRESETS.map((preset) => {
                  const IconComp = preset.icon;
                  const isSel = selectedSector === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSectorSelect(preset.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 select-none ${
                        isSel
                          ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/20"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700/80 hover:bg-slate-800/40"
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${isSel ? "bg-indigo-500 text-white shadow-lg" : "bg-slate-800 text-slate-400"}`}>
                        <IconComp size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{tr(preset.name, preset.nameAr)}</h4>
                          {isSel && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold uppercase tracking-wider">{tr("Active", "مفعل")}</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">{tr(preset.description, preset.descriptionAr)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: GENERAL BRAND METADATA */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1 text-center mb-2">
                <h3 className="text-base font-black text-white">{tr("Configure Brand Details", "إعداد تفاصيل العلامة التجارية")}</h3>
                <p className="text-xs text-slate-400">
                  {tr("Enter the details that will represent your business workspace.", "أدخل التفاصيل التي ستظهر للعملاء والمستخدمين.")}
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className={lblClass}>{tr("Business Name", "اسم النشاط التجاري")}</label>
                  <input
                    type="text"
                    className={inpClass}
                    placeholder="e.g. MedCare Clinic, Elite Hotels"
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lblClass}>{tr("Tagline / Slogan", "الشعار اللفظي / Slogan")}</label>
                    <input
                      type="text"
                      className={inpClass}
                      placeholder="e.g. Health is Priority"
                      value={brandTagline}
                      onChange={e => setBrandTagline(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={lblClass}>{tr("Workspace Label", "تسمية المكان (طاولة/غرفة)")}</label>
                    <input
                      type="text"
                      className={inpClass}
                      placeholder="e.g. Room Number, Desk Number"
                      value={lang === "ar" ? tableLabelAr : tableLabelEn}
                      onChange={e => {
                        if (lang === "ar") setTableLabelAr(e.target.value);
                        else setTableLabelEn(e.target.value);
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className={lblClass}>{tr("Business Description", "وصف تفصيلي للنشاط")}</label>
                  <textarea
                    className={`${inpClass} h-16 resize-none`}
                    placeholder={tr("Write a short summary about your services or mission...", "اكتب خلاصة بسيطة عن الخدمات أو الرؤية العامة للنشاط...")}
                    value={brandDesc}
                    onChange={e => setBrandDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className={lblClass}>{tr("Phone", "رقم الهاتف")}</label>
                    <input type="text" className={inpClass} value={brandPhone} onChange={e => setBrandPhone(e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    <label className={lblClass}>{tr("Location", "الموقع")}</label>
                    <input type="text" className={inpClass} value={brandLocation} onChange={e => setBrandLocation(e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    <label className={lblClass}>{tr("Website/Instagram", "حساب التواصل")}</label>
                    <input type="text" className={inpClass} value={brandSocial} onChange={e => setBrandSocial(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: COLOR PALETTE & VISUAL CUSTOMIZATION */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1 text-center mb-2">
                <h3 className="text-base font-black text-white">{tr("Choose Brand Visual Identity", "اختر الهوية البصرية والألوان")}</h3>
                <p className="text-xs text-slate-400">
                  {tr("This palette dynamically controls all primary elements, highlights, and buttons across your display app.", "هذه اللوحة تتحكم تلقائياً في كافة العناصر، الأزرار، واللمسات البصرية في تطبيق العميل.")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {COLOR_PRESETS.map((preset) => {
                  const isSel = selectedTheme === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedTheme(preset.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                        isSel
                          ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/20"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700/80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full border border-white/20 shadow-inner flex-shrink-0"
                          style={{ backgroundColor: preset.previewColor }}
                        />
                        <span className="text-[11px] font-bold text-white truncate max-w-[120px]">
                          {tr(preset.name.split(" ")[0], preset.nameAr.split(" ")[0])}
                        </span>
                      </div>
                      {isSel && (
                        <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                          <Check size={10} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* App live preview simulator block */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-inner">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{tr("Interactive Layout Preview", "معاينة حية للتنسيق والألوان")}</h4>
                <div className="flex items-center gap-3 p-2 bg-slate-900 border border-slate-800 rounded-xl">
                  {/* Mock item card preview with dynamic color */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: activePreset.previewColor + "15", border: `1px solid ${activePreset.previewColor}40` }}>
                    <span style={{ color: activePreset.previewColor }}>★</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 w-24 rounded bg-slate-800" />
                    <div className="h-1.5 w-16 rounded bg-slate-800/60 mt-1.5" />
                  </div>
                  <button
                    className="px-2.5 py-1 rounded-lg text-[9px] font-bold text-white shadow-sm flex items-center gap-1"
                    style={{ backgroundColor: activePreset.previewColor }}
                  >
                    {tr("Select", "اختر")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: AI INTUITIVE PERSONA CUSTOMIZATION */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1 text-center mb-2">
                <h3 className="text-base font-black text-white">{tr("AI Persona Assistant Settings", "إعداد مساعد الذكاء الاصطناعي")}</h3>
                <p className="text-xs text-slate-400">
                  {tr("Configure the name, custom greetings, and systemic persona rules for the live support agent.", "قم بإعداد الاسم، رسائل الترحيب، وقواعد شخصية المساعد الذكي المباشر.")}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-span-1 flex flex-col items-center gap-2">
                  <div className="relative">
                    <img src={selectedAvatar} alt="Avatar" className="w-16 h-16 rounded-full border border-slate-700/80 p-0.5 bg-slate-800 shadow-md" />
                    <button
                      onClick={handleRandomizeAvatar}
                      className="absolute -bottom-1 -right-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full p-1 border border-slate-900 transition-colors"
                      title="Randomize Avatar"
                    >
                      <Sparkles size={11} />
                    </button>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{tr("Avatar", "الأفاتار")}</span>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className={lblClass}>{tr("Assistant Name", "اسم المساعد الذكي")}</label>
                  <input
                    type="text"
                    className={inpClass}
                    placeholder="e.g. CareBot, SpaConcierge"
                    value={aiAssistantName}
                    onChange={e => setAiAssistantName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={lblClass}>{tr("Greeting Message (EN)", "رسالة الترحيب (الإنجليزية)")}</label>
                  <input
                    type="text"
                    className={inpClass}
                    placeholder="Welcome greeting in English"
                    value={aiAssistantGreeting}
                    onChange={e => setAiAssistantGreeting(e.target.value)}
                  />
                </div>
                <div>
                  <label className={lblClass}>{tr("Greeting Message (AR)", "رسالة الترحيب (العربية)")}</label>
                  <input
                    type="text"
                    className={inpClass}
                    dir="rtl"
                    placeholder="رسالة الترحيب التلقائية بالعربية"
                    value={aiAssistantGreetingAr}
                    onChange={e => setAiAssistantGreetingAr(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: DEPLOY CATALOG & SEED PRESET DATABASE */}
          {step === 5 && (
            <div className="space-y-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <Database size={28} className="animate-bounce" />
              </div>

              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-base font-black text-white">{tr("Ready to Launch!", "جاهز للإطلاق والتثبيت!")}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {tr("We will now initialize your Firebase database with live catalog preset items tailored for ", "سنقوم الآن بتهيئة قاعدة بيانات Firebase مع تحميل كتالوج تجريبي فوري مخصص لـ ")}
                  <strong className="text-indigo-400 font-extrabold">{tr(SECTOR_PRESETS.find(s=>s.id===selectedSector)?.name || "Custom Sector", SECTOR_PRESETS.find(s=>s.id===selectedSector)?.nameAr || "قطاع مخصص")}</strong>.
                </p>
                <p className="text-[10px] text-slate-500 leading-snug">
                  {tr("This builds your customizable real-time portal, dynamic support channels, and AI personas instantly.", "يؤدي ذلك إلى تشغيل لوحة التحكم ومساعد الذكاء الاصطناعي وبث البيانات بشكل فوري ومباشر.")}
                </p>
              </div>

              <div className="pt-4 max-w-xs mx-auto">
                <button
                  disabled={loading}
                  onClick={handleCompleteSetup}
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <CheckCircle2 size={16} />
                  {tr("Complete Setup & Deploy", "إكمال الإعداد وتثبيت النظام")}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Navigation actions */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 relative z-10">
          <button
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            disabled={step === 1 || loading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-slate-300 transition-colors"
          >
            <ArrowLeft size={14} /> {tr("Back", "السابق")}
          </button>

          {step < 5 && (
            <button
              onClick={() => {
                if (step === 2 && !brandName.trim()) {
                  swalError(tr("Please enter your business name to continue.", "يرجى إدخال اسم النشاط التجاري للمتابعة."));
                  return;
                }
                setStep(prev => Math.min(5, prev + 1));
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              {tr("Next", "التالي")} <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
