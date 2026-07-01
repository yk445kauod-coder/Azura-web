import React, { useState, useEffect } from "react";
import { AlertTriangle, UploadCloud, Eye, Save, RotateCcw, Archive, Download, Trash2, X } from "lucide-react";
import { smartGet, smartSet, smartPush, smartRemove, getDBMode, setDBMode } from "@/lib/dbWrapper";
import { testR2Connection, type R2Config, listR2Objects, downloadFromR2 } from "@/lib/r2";
import { swalSuccess, swalError, swalConfirm } from "@/lib/swal";
import { onValue } from "@/lib/firebase";

interface SystemTabProps {
  tr: (en: string, ar: string) => string;
  db: any;
  fbRef: any;
  set: any;
  remove: any;
  push: any;
  get: any;
  lang: string;
}

export const SystemTab: React.FC<SystemTabProps> = ({ tr, db, fbRef, set, remove, push, get, lang }) => {
  const [backups, setBackups] = useState<{ id: string; name: string; date: number; size: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [r2Loading, setR2Loading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>("");

  // Load backups list
  useEffect(() => {
    const unsub = onValue(fbRef(db, "backups"), (snap: any) => {
      if (snap.exists()) {
        const data = snap.val() as Record<string, any>;
        const list = Object.entries(data).map(([id, v]: [string, any]) => ({
          id,
          name: v.name || "Backup",
          date: v.createdAt || Date.now(),
          size: v.size || "0 KB",
        }));
        setBackups(list.sort((a, b) => b.date - a.date));
      } else {
        setBackups([]);
      }
    });
    return () => unsub();
  }, [db, fbRef]);

  const createBackup = async () => {
    setLoading(true);
    try {
      const snapshot: Record<string, any> = {};
      const paths = ["menu", "users", "ai-config", "api-settings", "broadcast", "reels", "feedback", "homepage-banner"];
      for (const path of paths) {
        const data = await smartGet(path);
        if (data) snapshot[path] = data;
      }

      const backupData = {
        data: snapshot,
        createdAt: Date.now(),
        name: `Backup ${new Date().toLocaleString()}`,
        size: `${Math.round(JSON.stringify(snapshot).length / 1024)} KB`,
      };

      await smartPush("backups", backupData);

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `azura-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      swalSuccess(tr("Backup created and downloaded!", "تم إنشاء النسخة الاحتياطية وت تحميلها!"));
    } catch (err) {
      console.error(err);
      swalError(tr("Failed to create backup", "فشل في إنشاء النسخة الاحتياطية"));
    }
    setLoading(false);
  };

  const restoreBackup = async (backupId: string) => {
    if (!await swalConfirm(tr("Restore Backup", "استعادة النسخة"), tr("Restore this backup? Current data will be overwritten.", "استعادة هذه النسخة؟ البيانات الحالية سيتم استبدالها."), tr("Restore", "استعادة"), tr("Cancel", "إلغاء"))) return;

    setLoading(true);
    try {
      const data = await smartGet(`backups/${backupId}/data`);
      if (!data) throw new Error("Backup not found");
      for (const [path, content] of Object.entries(data)) {
        await smartSet(path, content);
      }
      swalSuccess(tr("Backup restored successfully!", "تم استعادة النسخة بنجاح!"));
    } catch (err) {
      console.error(err);
      swalError(tr("Failed to restore backup", "فشل في استعادة النسخة"));
    }
    setLoading(false);
  };

  const resetSystem = async () => {
    setLoading(true);
    try {
      await createBackup();
      const paths = ["menu", "users", "ai-config", "api-settings", "broadcast", "reels", "feedback", "conversations", "notifications", "homepage-banner", "backups"];
      for (const path of paths) {
        await smartRemove(path);
      }
      swalSuccess(tr("System reset complete! A backup was saved to your device.", "تم إعادة تعيين النظام! تم حفظ نسخة احتياطية على جهازك."));
    } catch (err) {
      console.error(err);
      swalError(tr("Failed to reset system", "فشل في إعادة تعيين النظام"));
    }
    setLoading(false);
    setShowConfirm(false);
  };

  const deleteBackup = async (id: string) => {
    if (!await swalConfirm(tr("Delete Backup", "حذف النسخة"), tr("Delete this backup?", "حذف هذه النسخة؟"), tr("Delete", "حذف"), tr("Cancel", "إلغاء"))) return;
    await smartRemove(`backups/${id}`);
  };

  const [r2Config, setR2Config] = useState<R2Config>({ endpoint: "", accessKey: "", secretKey: "", bucket: "" });

  useEffect(() => {
    smartGet("r2-config").then(cfg => { if (cfg) setR2Config(cfg); });
  }, []);

  const handleSaveR2 = async () => {
    setR2Loading(true);
    try {
      await smartSet("r2-config", r2Config);
      swalSuccess(tr("R2 Config Saved", "تم حفظ إعدادات R2"));
    } catch (e) {
      swalError(tr("Save failed", "فشل الحفظ"));
    }
    setR2Loading(false);
  };

  const handleTestR2 = async () => {
    setR2Loading(true);
    try {
      await testR2Connection(r2Config);
      swalSuccess(tr("R2 Connection Successful!", "تم الاتصال بـ R2 بنجاح!"));
    } catch (e) {
      swalError(tr("R2 Connection Failed", "فشل الاتصال بـ R2"));
    }
    setR2Loading(false);
  };

  const handleGlobalSync = async () => {
    if (!await swalConfirm(tr("Global Sync", "مزامنة شاملة"), tr("This will push all R2 data back to Firebase. Existing Firebase data will be overwritten.", "سيتم رفع كافة بيانات R2 إلى Firebase. سيتم استبدال البيانات الحالية."), tr("Sync Now", "مزامنة الآن"), tr("Cancel", "إلغاء"))) return;
    setLoading(true);
    try {
      const objects = await listR2Objects();
      for (const obj of objects) {
        if (!obj.Key?.endsWith(".json")) continue;
        const data = await downloadFromR2(obj.Key);
        const path = obj.Key.replace(".json", "");
        await set(fbRef(db, path), data);
      }
      swalSuccess(tr("Global Sync Complete!", "تمت المزامنة الشاملة بنجاح!"));
    } catch (e) {
      console.error(e);
      swalError(tr("Sync failed", "فشلت المزامنة"));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 page-enter">
      {getDBMode() === "r2" && (
        <div className="card rounded-2xl p-4 bg-red-500 text-white flex items-center justify-between shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20}/>
            <div>
              <p className="font-bold text-sm">{tr("OFFLINE FALLBACK MODE ACTIVE", "وضع الطوارئ (R2) مفعّل")}</p>
              <p className="text-[10px] opacity-80">{tr("Firebase is unavailable. Changes are being saved to R2.", "Firebase غير متاح. يتم حفظ التغييرات على R2.")}</p>
            </div>
          </div>
          <button onClick={() => setDBMode("firebase")} className="px-3 py-1 bg-white text-red-600 rounded-lg text-xs font-bold">
            {tr("Try Reconnect", "إعادة الاتصال")}
          </button>
        </div>
      )}

      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <UploadCloud size={18} className="text-primary"/> {tr("R2 Fallback Config (S3)","إعدادات الطوارئ R2")}
        </h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Endpoint","نقطة الاتصال")}</label>
            <input className="input-field px-3 py-2 text-sm" placeholder="https://<id>.r2.cloudflarestorage.com" value={r2Config.endpoint} onChange={e => setR2Config({...r2Config, endpoint: e.target.value})}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Access Key","مفتاح الوصول")}</label>
              <input className="input-field px-3 py-2 text-sm" type="password" value={r2Config.accessKey} onChange={e => setR2Config({...r2Config, accessKey: e.target.value})}/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Secret Key","المفتاح السري")}</label>
              <input className="input-field px-3 py-2 text-sm" type="password" value={r2Config.secretKey} onChange={e => setR2Config({...r2Config, secretKey: e.target.value})}/>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Bucket Name","اسم الباكت")}</label>
            <input className="input-field px-3 py-2 text-sm" value={r2Config.bucket} onChange={e => setR2Config({...r2Config, bucket: e.target.value})}/>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleTestR2} disabled={r2Loading} className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-2">
              <Eye size={14}/> {tr("Test Connection", "فحص الاتصال")}
            </button>
            <button onClick={handleSaveR2} disabled={r2Loading} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg">
              <Save size={14}/> {tr("Save Config", "حفظ الإعدادات")}
            </button>
          </div>
        </div>
        <div className="pt-4 border-t border-border/40">
          <button onClick={handleGlobalSync} disabled={loading} className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-200">
            <RotateCcw size={16}/> {tr("Global Sync: R2 → Firebase", "مزامنة شاملة: من R2 إلى Firebase")}
          </button>
        </div>
      </div>

      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Archive size={18} className="text-primary"/> {tr("Backup & Restore","النسخ الاحتياطي والاستعادة")}
        </h3>
        <button onClick={createBackup} disabled={loading} className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2">
          <Download size={16}/> {loading ? tr("Creating...", "جاري الإنشاء...") : tr("Create New Backup","إنشاء نسخة احتياطية جديدة")}
        </button>
        <div className="space-y-2">
          <p className="text-sm font-semibold">{tr("Available Backups","النسخ الاحتياطية المتاحة")}</p>
          {backups.length === 0 && <p className="text-muted-foreground text-sm">{tr("No backups yet","لا يوجد نسخ احتياطية بعد")}</p>}
          {backups.map((b) => (
            <div key={b.id} className="card rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{b.name}</p>
                <p className="text-xs text-muted-foreground">{new Date(b.date).toLocaleString()} • {b.size}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => restoreBackup(b.id)} className="btn-ghost text-primary px-3 py-1 rounded-lg text-sm"><UploadCloud size={14}/> {tr("Restore","استعادة")}</button>
                <button onClick={() => deleteBackup(b.id)} className="btn-ghost text-destructive px-3 py-1 rounded-lg text-sm"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-elevated rounded-2xl p-5 space-y-4 border-2 border-destructive/20">
        <h3 className="font-bold text-destructive flex items-center gap-2"><RotateCcw size={18}/> {tr("Reset System","إعادة تعيين النظام")}</h3>
        <button onClick={() => { setShowConfirm(true); setConfirmAction("reset"); }} className="w-full py-3 rounded-xl bg-destructive text-white font-bold flex items-center justify-center gap-2 hover:bg-destructive/90">
          <RotateCcw size={16}/> {tr("Reset Everything","إعادة تعيين كل شيء")}
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card-elevated rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-bold text-lg text-destructive">{tr("Confirm Action","تأكيد العملية")}</h3>
            <p className="text-sm">{tr("Are you sure? This action cannot be undone.","هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.")}</p>
            <div className="flex gap-3">
              <button onClick={() => { if (confirmAction === "reset") resetSystem(); setShowConfirm(false); }} className="flex-1 py-2 rounded-xl bg-destructive text-white font-bold">{tr("Yes, Reset","نعم، أعيد التعيين")}</button>
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 rounded-xl bg-muted font-bold">{tr("Cancel","إلغاء")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
