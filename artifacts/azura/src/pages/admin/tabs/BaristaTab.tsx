import React, { useState, useEffect } from "react";
import { db, ref, onValue, set, off } from "@/lib/firebase";
import { smartSet } from "@/lib/dbWrapper";
import { swalSuccess, swalError } from "@/lib/swal";
import { Bot, Save, User, Coffee, MapPin, Clock, Phone, Instagram, MessageSquare, Sparkles } from "lucide-react";

interface BaristaTabProps {
  tr: (en: string, ar: string) => string;
}

export const BaristaTab: React.FC<BaristaTabProps> = ({ tr }) => {
  const [config, setConfig] = useState({
    baristaName: "",
    baristaAvatar: "",
    instagram: "",
    cafeName: "",
    cafeLocation: "",
    cafeHours: "",
    cafePhone: "",
    systemPrompt: "",
    systemPromptAr: "",
    greeting: "",
    greetingAr: "",
  });
  const [apiSettings, setApiSettings] = useState({
    aiEnabled: true,
    groqKey: "",
    menuNode: "menu",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const cfgRef = ref(db, "ai-config");
    const apiRef = ref(db, "api-settings");

    onValue(cfgRef, (snap) => {
      if (snap.exists()) {
        setConfig(prev => ({ ...prev, ...snap.val() }));
      }
    });

    onValue(apiRef, (snap) => {
      if (snap.exists()) {
        setApiSettings(snap.val());
      }
      setLoading(false);
    });

    return () => {
      off(cfgRef);
      off(apiRef);
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await smartSet("ai-config", config);
      await smartSet("api-settings", apiSettings);
      swalSuccess(tr("AI Config saved!", "تم حفظ إعدادات الذكاء الاصطناعي!"));
    } catch (err) {
      swalError(tr("Failed to save config", "فشل حفظ الإعدادات"));
    }
    setSaving(false);
  };

  const toggleAi = () => {
    setApiSettings(prev => ({ ...prev, aiEnabled: !prev.aiEnabled }));
  };

  const inp = "input-field px-3 py-2 text-sm w-full";
  const label = "text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block";

  if (loading) return <div className="py-20 text-center animate-pulse text-muted-foreground">{tr("Loading config...", "جاري التحميل...")}</div>;

  return (
    <div className="space-y-6 page-enter pb-10">
      {/* Status & Control */}
      <div className="card-elevated rounded-2xl p-5 flex items-center justify-between border-l-4 border-amber-500">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${apiSettings.aiEnabled ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">{tr("AI Status", "حالة الذكاء الاصطناعي")}</h3>
            <p className="text-[10px] text-muted-foreground">
              {apiSettings.aiEnabled ? tr("Assistant is active", "المساعد نشط") : tr("Assistant is disabled", "المساعد معطل")}
              {apiSettings.groqKey ? " • " + tr("API Key Connected", "مفتاح API متصل") : " • " + tr("No API Key", "لا يوجد مفتاح API")}
            </p>
          </div>
        </div>
        <button
          onClick={toggleAi}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${apiSettings.aiEnabled ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
        >
          {apiSettings.aiEnabled ? tr("Disable", "تعطيل") : tr("Enable", "تفعيل")}
        </button>
      </div>

      {/* Menu Source Section */}
      <div className="card-elevated rounded-2xl p-5 space-y-4 border-l-4 border-orange-500">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} className="text-orange-500"/>
          <h3 className="font-bold text-foreground">{tr("Menu Data Source", "مصدر بيانات القائمة")}</h3>
        </div>
        <div className="space-y-1">
          <label className={label}>{tr("Firebase RTDB Menu Node", "مسار القائمة في Firebase")}</label>
          <div className="flex gap-2">
            <input
              className={inp}
              value={apiSettings.menuNode || "menu"}
              onChange={e => setApiSettings({ ...apiSettings, menuNode: e.target.value })}
              placeholder="e.g. menu or menu_v2"
            />
            <div className="px-3 py-2 bg-muted rounded-xl flex items-center gap-2 text-[10px] font-bold text-muted-foreground whitespace-nowrap">
              <MapPin size={12} />
              {tr("Current Node", "المسار الحالي")}: {apiSettings.menuNode || "menu"}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-1">
            {tr("* The AI uses this node to read current items, prices, and availability.", "* يستخدم الذكاء الاصطناعي هذا المسار لقراءة الأصناف والأسعار المتاحة حالياً.")}
          </p>
        </div>
      </div>

      {/* Persona Section */}
      <div className="card-elevated rounded-2xl p-5 space-y-4 border-l-4 border-primary">
        <div className="flex items-center gap-2 mb-2">
          <User size={18} className="text-primary"/>
          <h3 className="font-bold text-foreground">{tr("AI Barista Persona", "شخصية الباريستا الذكي")}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={label}>{tr("Barista Name", "اسم الباريستا")}</label>
            <input
              className={inp}
              value={config.baristaName}
              onChange={e => setConfig({ ...config, baristaName: e.target.value })}
              placeholder="e.g. Zura"
            />
          </div>
          <div className="space-y-1">
            <label className={label}>{tr("Instagram Handle", "حساب انستجرام")}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <input
                className={`${inp} pl-7`}
                value={config.instagram.replace('@','')}
                onChange={e => setConfig({ ...config, instagram: '@' + e.target.value.replace('@','') })}
                placeholder="azuracafeegy"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className={label}>{tr("Avatar URL", "رابط الصورة الرمزية")}</label>
          <div className="flex gap-3 items-center">
            <img src={config.baristaAvatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover bg-muted" onError={(e) => (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=Zura'} />
            <input
              className={inp}
              value={config.baristaAvatar}
              onChange={e => setConfig({ ...config, baristaAvatar: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Cafe Info Section */}
      <div className="card-elevated rounded-2xl p-5 space-y-4 border-l-4 border-blue-500">
        <div className="flex items-center gap-2 mb-2">
          <Coffee size={18} className="text-blue-500"/>
          <h3 className="font-bold text-foreground">{tr("Cafe Information", "معلومات الكافيه")}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={label}>{tr("Cafe Name", "اسم الكافيه")}</label>
            <input className={inp} value={config.cafeName} onChange={e => setConfig({ ...config, cafeName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className={label}>{tr("Phone", "رقم الهاتف")}</label>
            <input className={inp} value={config.cafePhone} onChange={e => setConfig({ ...config, cafePhone: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className={label}>{tr("Location", "الموقع")}</label>
            <input className={inp} value={config.cafeLocation} onChange={e => setConfig({ ...config, cafeLocation: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className={label}>{tr("Hours", "ساعات العمل")}</label>
            <input className={inp} value={config.cafeHours} onChange={e => setConfig({ ...config, cafeHours: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Prompts Section */}
      <div className="card-elevated rounded-2xl p-5 space-y-5 border-l-4 border-purple-500">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-purple-500"/>
          <h3 className="font-bold text-foreground">{tr("AI Behavior & Greetings", "سلوك الذكاء والترحيب")}</h3>
        </div>

        {/* Greeting */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className={label}>{tr("Initial Greeting (English)", "رسالة الترحيب (إنجليزي)")}</label>
            <textarea
              className={`${inp} min-h-[60px]`}
              value={config.greeting}
              onChange={e => setConfig({ ...config, greeting: e.target.value })}
            />
          </div>
          <div className="space-y-1" dir="rtl">
            <label className={label}>{tr("Initial Greeting (Arabic)", "رسالة الترحيب (عربي)")}</label>
            <textarea
              className={`${inp} min-h-[60px]`}
              value={config.greetingAr}
              onChange={e => setConfig({ ...config, greetingAr: e.target.value })}
            />
          </div>
        </div>

        {/* System Prompt */}
        <div className="space-y-4 pt-2 border-t border-border">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className={label}>{tr("Advanced System Prompt (English)", "موجه النظام المتقدم (إنجليزي)")}</label>
              <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold uppercase">{tr("Expert Only", "للمحترفين فقط")}</span>
            </div>
            <textarea
              className={`${inp} min-h-[120px] font-mono text-[11px] leading-relaxed`}
              value={config.systemPrompt}
              onChange={e => setConfig({ ...config, systemPrompt: e.target.value })}
              placeholder="Optional: Custom instructions to override default personality..."
            />
          </div>
          <div className="space-y-1" dir="rtl">
            <div className="flex justify-between items-center">
              <label className={label}>{tr("Advanced System Prompt (Arabic)", "موجه النظام المتقدم (عربي)")}</label>
              <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold uppercase">{tr("Expert Only", "للمحترفين فقط")}</span>
            </div>
            <textarea
              className={`${inp} min-h-[120px] font-mono text-[11px] leading-relaxed`}
              value={config.systemPromptAr}
              onChange={e => setConfig({ ...config, systemPromptAr: e.target.value })}
              placeholder="اختياري: تعليمات مخصصة لتغيير شخصية الباريستا..."
            />
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            {tr("* Leave blank to use the standard high-performance Zura personality.", "* اتركها فارغة لاستخدام شخصية زورا القياسية.")}
          </p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-primary/20 sticky bottom-4 z-10"
      >
        {saving ? <Bot className="animate-spin" size={18}/> : <Save size={18}/>}
        {saving ? tr("Saving...", "جاري الحفظ...") : tr("Save Barista Configuration", "حفظ إعدادات الباريستا")}
      </button>
    </div>
  );
};
