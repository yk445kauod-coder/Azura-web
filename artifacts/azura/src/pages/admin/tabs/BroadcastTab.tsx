import React from "react";
import { Megaphone, Pin, Save, Trash2 } from "lucide-react";
import { Broadcast } from "../types";

interface BroadcastTabProps {
  tr: (en: string, ar: string) => string;
  newBroadcast: any;
  setNewBroadcast: React.Dispatch<React.SetStateAction<any>>;
  sendBroadcast: () => void;
  sendingBroadcast: boolean;
  bannerContent: string;
  setBannerContent: (v: string) => void;
  bannerBgColor: string;
  setBannerBgColor: (v: string) => void;
  bannerTextColor: string;
  setBannerTextColor: (v: string) => void;
  bannerEnabled: boolean;
  saveBannerEnabled: (v: boolean) => void;
  saveBanner: () => void;
  savingBanner: boolean;
  bannerPreview: boolean;
  broadcasts: Broadcast[];
  deleteBroadcast: (id: string) => void;
}

export const BroadcastTab: React.FC<BroadcastTabProps> = ({
  tr, newBroadcast, setNewBroadcast, sendBroadcast, sendingBroadcast,
  bannerContent, setBannerContent, bannerBgColor, setBannerBgColor, bannerTextColor, setBannerTextColor,
  bannerEnabled, saveBannerEnabled, saveBanner, savingBanner, bannerPreview,
  broadcasts, deleteBroadcast
}) => {
  const inp = "input-field px-3 py-2.5 text-sm";

  return (
    <div className="space-y-4 page-enter">
      <div className="card-elevated rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Megaphone size={16} className="text-primary"/> {tr("Send Announcement","إرسال إشعار للجميع")}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(["📢","🎉","⚠️","🔥","💝","☕"] as const).map((e) => (
            <button key={e} onClick={() => setNewBroadcast((p: any) => ({...p, emoji: e}))}
              className={`py-2 rounded-xl text-xl transition-all ${newBroadcast.emoji === e ? "ring-2 ring-primary bg-primary/10" : "bg-muted/50"}`}>
              {e}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["info","promo","alert"] as const).map((t) => (
            <button key={t} onClick={() => setNewBroadcast((p: any) => ({...p, type: t}))}
              className={`py-2 rounded-xl text-xs font-bold transition-all capitalize ${newBroadcast.type === t ? (t==="info"?"bg-blue-500 text-white":t==="promo"?"bg-amber-500 text-white":"bg-red-500 text-white") : "chip-inactive"}`}>
              {t === "info" ? tr("Info","معلومة") : t === "promo" ? tr("Promo","عرض") : tr("Alert","تنبيه")}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className={inp} placeholder={tr("Title (EN)","العنوان EN")} value={newBroadcast.title} onChange={(e) => setNewBroadcast((p: any) => ({...p, title: e.target.value}))}/>
          <input className={inp} dir="rtl" placeholder="العنوان عربي" value={newBroadcast.titleAr} onChange={(e) => setNewBroadcast((p: any) => ({...p, titleAr: e.target.value}))}/>
        </div>
        <textarea rows={2} className={`${inp} resize-none`} placeholder={tr("Message (EN)","الرسالة EN")} value={newBroadcast.message} onChange={(e) => setNewBroadcast((p: any) => ({...p, message: e.target.value}))}/>
        <textarea rows={2} className={`${inp} resize-none`} dir="rtl" placeholder="الرسالة بالعربي" value={newBroadcast.messageAr} onChange={(e) => setNewBroadcast((p: any) => ({...p, messageAr: e.target.value}))}/>
        <button onClick={sendBroadcast} disabled={sendingBroadcast || !newBroadcast.title || !newBroadcast.message}
          className="btn-primary w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          <Megaphone size={14}/> {sendingBroadcast ? tr("Sending…","جاري الإرسال…") : tr("Send to All Users","أرسل للجميع")}
        </button>
      </div>

      <div className="card-elevated rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Pin size={16} className="text-primary"/> {tr("Homepage Banner","بانر الصفحة الرئيسية")}
        </h3>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">{tr("Banner Content (HTML allowed)","محتوى البانر (يدعم HTML)")}</label>
          <textarea
            rows={3}
            className={`${inp} resize-none font-mono text-xs`}
            placeholder={tr("e.g. 🎉 Happy Hour! 50% off until 8 PM","مثال: 🎉 ساعة سعيدة! خصم 50% حتي 8 مساءً")}
            value={bannerContent}
            onChange={(e) => setBannerContent(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">{tr("Background Color","لون الخلفية")}</label>
            <input type="color" value={bannerBgColor} onChange={(e) => setBannerBgColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer"/>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">{tr("Text Color","لون النص")}</label>
            <input type="color" value={bannerTextColor} onChange={(e) => setBannerTextColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer"/>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">{tr("Enable","تفعيل")}</span>
            <button onClick={() => saveBannerEnabled(!bannerEnabled)} className={`w-12 h-6 rounded-full relative transition-colors ${bannerEnabled ? "bg-green-500" : "bg-muted"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${bannerEnabled ? "translate-x-6" : "translate-x-0.5"}`}/>
            </button>
          </div>
          <button onClick={saveBanner} disabled={savingBanner} className="btn-primary py-2 px-4 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
            <Save size={14}/> {tr("Save Banner","حفظ البانر")}
          </button>
        </div>
        {bannerPreview && (
          <div className="p-3 rounded-xl text-center text-sm font-semibold" style={{ background: bannerBgColor, color: bannerTextColor }} dangerouslySetInnerHTML={{ __html: bannerContent }} />
        )}
      </div>

      <h3 className="font-bold text-sm text-foreground">{tr("Sent Announcements","الإشعارات المُرسلة")}</h3>
      <div className="space-y-2">
        {broadcasts.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">{tr("No announcements yet","لم يُرسل أي إشعار بعد")}</p>}
        {broadcasts.map((b) => (
          <div key={b.id} className={`card rounded-xl p-3 flex items-start gap-3 ${b.type==="alert"?"border border-red-200":b.type==="promo"?"border border-amber-200":"border border-blue-200"}`}>
            <span className="text-2xl flex-shrink-0">{b.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground">{b.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{b.message}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(b.createdAt).toLocaleString()}</p>
            </div>
            <button onClick={() => deleteBroadcast(b.id)} className="btn-icon w-8 h-8 text-destructive/60 hover:text-destructive flex-shrink-0"><Trash2 size={13}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};
