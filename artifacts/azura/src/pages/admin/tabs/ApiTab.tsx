import React from "react";
import { Key, EyeOff, Eye, Settings, Bot } from "lucide-react";

interface ApiTabProps {
  tr: (en: string, ar: string) => string;
  apiSettings: any;
  setApiSettings: React.Dispatch<React.SetStateAction<any>>;
  showApiKey: boolean;
  setShowApiKey: (v: boolean) => void;
  saveApiSettings: () => void;
  savingApiKey: boolean;
}

export const ApiTab: React.FC<ApiTabProps> = ({
  tr, apiSettings, setApiSettings, showApiKey, setShowApiKey, saveApiSettings, savingApiKey
}) => {
  const inp = "input-field px-3 py-2.5 text-sm";

  return (
    <div className="space-y-4 page-enter">
      <div className="card-elevated rounded-2xl p-5 space-y-5">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Key size={18} className="text-primary"/> {tr("AI Provider Settings","إعدادات مزود الذكاء")}
        </h3>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">{tr("AI Provider","مزود الذكاء")}</label>
          <select
            className={inp}
            value={apiSettings.aiProvider}
            onChange={(e) => setApiSettings((p: any) => ({...p, aiProvider: e.target.value as any}))}
          >
            <option value="groq">Groq (DeepSeek Qwen)</option>
            <option value="pollinations">Pollinations (Free)</option>
            <option value="openai">OpenAI Compatible</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">
            {apiSettings.aiProvider === "openai" ? tr("API Key", "مفتاح API") : tr("Groq API Key","مفتاح API Groq")}
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showApiKey ? "text" : "password"}
                className={`${inp} w-full pr-10`}
                placeholder={apiSettings.aiProvider === "pollinations" ? "Not required" : "sk-... / gsk_..."}
                value={apiSettings.groqKey}
                onChange={(e) => setApiSettings((p: any) => ({...p, groqKey: e.target.value}))}
                disabled={apiSettings.aiProvider === "pollinations"}
              />
              <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showApiKey ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
        </div>

        {apiSettings.aiProvider === "openai" && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">{tr("API Endpoint", "نقطة اتصال API")}</label>
            <input
              type="text"
              className={inp}
              placeholder="https://api.openai.com/v1"
              value={apiSettings.openaiEndpoint}
              onChange={(e) => setApiSettings((p: any) => ({...p, openaiEndpoint: e.target.value}))}
            />
          </div>
        )}

        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50">
          <div>
            <p className="font-semibold text-sm">{tr("AI Barista","الباريستا الذكي")}</p>
            <p className="text-[11px] text-muted-foreground">{tr("Enable AI chat feature","تفعيل محادثة الذكاء الاصطناعي")}</p>
          </div>
          <button onClick={() => setApiSettings((p: any) => ({...p, aiEnabled: !p.aiEnabled}))}
            className={`w-12 h-7 rounded-full relative transition-colors ${apiSettings.aiEnabled ? "bg-primary" : "bg-muted"}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-all ${apiSettings.aiEnabled ? "translate-x-6" : "translate-x-1"}`}/>
          </button>
        </div>

        <button onClick={saveApiSettings} disabled={savingApiKey}
          className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          <Settings size={16}/> {savingApiKey ? tr("Saving…","جاري الحفظ…") : tr("Save Settings","حفظ الإعدادات")}
        </button>

        <div className="rounded-xl p-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${apiSettings.groqKey ? "bg-green-500" : "bg-amber-500"}`}/>
            <span className="text-xs font-medium">
              {apiSettings.groqKey ? tr("Groq API configured","تم إعداد مفتاح Groq") : tr("Groq API not configured","لم يتم إعداد مفتاح Groq")}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {tr("The AI service uses Groq DeepSeek Qwen and Pollinations for text/voice.","تستخدم خدمة الذكاء جروك DeepSeek Qwen وبولينيشن للنصوص والصوت.")}
          </p>
        </div>
      </div>
    </div>
  );
};
