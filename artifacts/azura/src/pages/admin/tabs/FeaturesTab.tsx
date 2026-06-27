import React from "react";
import { ToggleRight, Sparkles, Film, MessageCircle, Bot } from "lucide-react";

interface FeaturesTabProps {
  tr: (en: string, ar: string) => string;
  featureFlags: { baristaEnabled: boolean; reelsEnabled: boolean; supportEnabled: boolean };
  toggleFeatureFlag: (key: string, value: boolean) => void;
  savingFlag: string | null;
  apiSettings: { aiEnabled: boolean };
  setApiSettings: React.Dispatch<React.SetStateAction<any>>;
  updateApiSettings: (data: any) => Promise<void>;
}

export const FeaturesTab: React.FC<FeaturesTabProps> = ({
  tr, featureFlags, toggleFeatureFlag, savingFlag, apiSettings, setApiSettings, updateApiSettings
}) => {
  return (
    <div className="space-y-4 page-enter">
      <div className="card-elevated rounded-2xl p-5 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <ToggleRight size={20} className="text-primary"/>
          <h3 className="font-bold text-foreground">{tr("App Features & Pages", "ميزات وصفحات التطبيق")}</h3>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">{tr("Toggle pages and features on/off for all users in real time.", "تفعيل أو تعطيل الصفحات والميزات لجميع المستخدمين فوراً.")}</p>

        <div className="flex items-center justify-between gap-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-purple-600"/>
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{tr("AI Barista Page", "صفحة الباريستا الذكي")}</p>
              <p className="text-[11px] text-muted-foreground">{tr("Chat with Zura AI assistant", "الدردشة مع زورا الذكية")}</p>
            </div>
          </div>
          <button
            disabled={savingFlag === "baristaEnabled"}
            onClick={() => toggleFeatureFlag("baristaEnabled", !featureFlags.baristaEnabled)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${featureFlags.baristaEnabled ? "bg-green-500" : "bg-muted"} disabled:opacity-60`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${featureFlags.baristaEnabled ? "translate-x-8" : "translate-x-1"}`}/>
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0">
              <Film size={18} className="text-pink-600"/>
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{tr("Reels Page", "صفحة الريلز")}</p>
              <p className="text-[11px] text-muted-foreground">{tr("Video & image feed for customers", "فيد الفيديو والصور للعملاء")}</p>
            </div>
          </div>
          <button
            disabled={savingFlag === "reelsEnabled"}
            onClick={() => toggleFeatureFlag("reelsEnabled", !featureFlags.reelsEnabled)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${featureFlags.reelsEnabled ? "bg-green-500" : "bg-muted"} disabled:opacity-60`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${featureFlags.reelsEnabled ? "translate-x-8" : "translate-x-1"}`}/>
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <MessageCircle size={18} className="text-blue-600"/>
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{tr("Support Chat Page", "صفحة الدعم")}</p>
              <p className="text-[11px] text-muted-foreground">{tr("Customer live support chat", "محادثة الدعم المباشر للعملاء")}</p>
            </div>
          </div>
          <button
            disabled={savingFlag === "supportEnabled"}
            onClick={() => toggleFeatureFlag("supportEnabled", !featureFlags.supportEnabled)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${featureFlags.supportEnabled ? "bg-green-500" : "bg-muted"} disabled:opacity-60`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${featureFlags.supportEnabled ? "translate-x-8" : "translate-x-1"}`}/>
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Bot size={18} className="text-amber-600"/>
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{tr("AI Service (Groq/Gemini)", "خدمة الذكاء الاصطناعي")}</p>
              <p className="text-[11px] text-muted-foreground">{tr("Disable to pause all AI responses", "تعطيل لإيقاف جميع ردود الذكاء")}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              const next = !apiSettings.aiEnabled;
              setApiSettings((p: any) => ({ ...p, aiEnabled: next }));
              await updateApiSettings({ aiEnabled: next });
            }}
            className={`relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${apiSettings.aiEnabled ? "bg-green-500" : "bg-muted"}`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${apiSettings.aiEnabled ? "translate-x-8" : "translate-x-1"}`}/>
          </button>
        </div>
      </div>

      <div className="card rounded-2xl p-4 space-y-3">
        <h4 className="font-bold text-sm text-foreground">{tr("Current Status", "الحالة الحالية")}</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: tr("AI Barista", "الباريستا"), key: "baristaEnabled", value: featureFlags.baristaEnabled },
            { label: tr("Reels", "الريلز"), key: "reelsEnabled", value: featureFlags.reelsEnabled },
            { label: tr("Support", "الدعم"), key: "supportEnabled", value: featureFlags.supportEnabled },
            { label: tr("AI Service", "خدمة الذكاء"), key: "aiService", value: apiSettings.aiEnabled },
          ].map(item => (
            <div key={item.key} className={`rounded-xl px-3 py-2.5 flex items-center gap-2 ${item.value ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.value ? "bg-green-500" : "bg-red-500"}`}/>
              <div>
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
                <p className={`text-[10px] font-bold ${item.value ? "text-green-600" : "text-red-600"}`}>
                  {item.value ? tr("Active", "مفعّل") : tr("Disabled", "معطّل")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
