import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { db, ref, onValue, off, push, set, update, remove } from "@/lib/firebase";
import { compressToBase64, base64SizeKB } from "@/lib/imageUtils";
import { Heart, Share2, Plus, X, Upload, Trash2, Pin, Camera } from "lucide-react";

interface Reel {
  id: string;
  image: string;
  caption: string;
  captionAr: string;
  likes: number;
  likedBy: Record<string, boolean>;
  createdAt: number;
  authorName: string;
  authorId: string;
  pinned?: boolean;
}

const PLACEHOLDER = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80";

export default function Reels() {
  const { user, profile } = useAuth();
  const { lang, isRTL } = useLang();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  // Like animation
  const [heartPop, setHeartPop] = useState<string | null>(null);

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [newCaptionAr, setNewCaptionAr] = useState("");
  const [newImage, setNewImage] = useState("");
  const [imgSize, setImgSize] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = sessionStorage.getItem("azura-admin") === "true";
  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  useEffect(() => {
    const reelsRef = ref(db, "reels");
    onValue(reelsRef, (snap) => {
      if (!snap.exists()) { setReels([]); setLoading(false); return; }
      const data = snap.val() as Record<string, Omit<Reel, "id">>;
      const list = Object.entries(data)
        .map(([id, r]) => ({ id, ...r }))
        .sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.createdAt - a.createdAt;
        });
      setReels(list);
      setLoading(false);
    });
    return () => off(ref(db, "reels"));
  }, []);

  const handleLike = useCallback(async (reel: Reel) => {
    if (!user) return;
    const liked = reel.likedBy?.[user.uid];
    const newLikes = liked ? Math.max(0, reel.likes - 1) : reel.likes + 1;
    const likedBy = { ...(reel.likedBy || {}) };
    if (liked) delete likedBy[user.uid];
    else likedBy[user.uid] = true;
    await update(ref(db, `reels/${reel.id}`), { likes: newLikes, likedBy });
    if (!liked) {
      setHeartPop(reel.id);
      setTimeout(() => setHeartPop(null), 700);
    }
  }, [user]);

  const handleDoubleTap = useCallback((reel: Reel) => {
    handleLike(reel);
  }, [handleLike]);

  const handleShare = async (reel: Reel) => {
    const text = lang === "ar" ? (reel.captionAr || reel.caption) : reel.caption;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Azura Cafe", text, url: window.location.href });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      alert(tr("Link copied!", "تم النسخ!"));
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const b64 = await compressToBase64(file, 800, 0.78);
      setNewImage(b64);
      setImgSize(base64SizeKB(b64));
    } catch { alert(tr("Image failed to load", "فشل تحميل الصورة")); }
    setUploading(false);
  };

  const saveReel = async () => {
    if (!newImage || !user) return;
    setSaving(true);
    const r = push(ref(db, "reels"));
    await set(r, {
      image: newImage, caption: newCaption, captionAr: newCaptionAr,
      likes: 0, likedBy: {}, createdAt: Date.now(),
      authorName: profile?.name || "Azura Team", authorId: user.uid, pinned: false,
    });
    setNewImage(""); setNewCaption(""); setNewCaptionAr(""); setImgSize(0);
    setShowUpload(false); setSaving(false);
  };

  const togglePin = (reel: Reel) => update(ref(db, `reels/${reel.id}`), { pinned: !reel.pinned });
  const deleteReel = (reel: Reel) => { if (confirm(tr("Delete post?", "حذف المنشور؟"))) remove(ref(db, `reels/${reel.id}`)); };

  // Double-tap detection
  const lastTap = useRef<Record<string, number>>({});
  const onTapImage = (reel: Reel) => {
    const now = Date.now();
    const last = lastTap.current[reel.id] || 0;
    if (now - last < 300) { handleDoubleTap(reel); lastTap.current[reel.id] = 0; }
    else lastTap.current[reel.id] = now;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100dvh-7.5rem)]">
        <div className="flex gap-1.5">{[0,1,2].map((i) => <div key={i} className="w-2 h-2 rounded-full bg-primary dot-pulse" style={{ animationDelay: `${i*0.22}s` }} />)}</div>
      </div>
    );
  }

  return (
    <div className="relative" dir={isRTL ? "rtl" : "ltr"}>
      {/* Admin add button */}
      {isAdmin && (
        <button onClick={() => setShowUpload(true)}
          className="fixed z-40 flex items-center justify-center rounded-full"
          style={{ bottom: "6.5rem", [isRTL ? "left" : "right"]: "1rem", width: 48, height: 48, background: "hsl(var(--primary))", boxShadow: "var(--shadow-primary)" }}>
          <Plus size={20} className="text-primary-foreground" />
        </button>
      )}

      {/* Feed */}
      {reels.length === 0 ? (
        <div className="h-[calc(100dvh-7.5rem)] flex flex-col items-center justify-center text-center px-6">
          <Camera size={56} className="text-muted-foreground/25 mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>{tr("No posts yet", "لا يوجد منشورات")}</h2>
          <p className="text-sm text-muted-foreground">{isAdmin ? tr("Tap + to add the first post", "اضغط + لإضافة أول منشور") : tr("Check back soon for cafe updates!", "ترقب منشوراتنا قريباً!")}</p>
        </div>
      ) : (
        <div
          className="overflow-y-scroll scroll-hide"
          style={{ height: "calc(100dvh - 7.5rem)", scrollSnapType: "y mandatory" }}
        >
          {reels.map((reel) => {
            const liked = !!(user && reel.likedBy?.[user.uid]);
            return (
              <div key={reel.id}
                className="relative w-full flex-shrink-0 overflow-hidden"
                style={{ height: "calc(100dvh - 7.5rem)", scrollSnapAlign: "start", scrollSnapStop: "always" }}
              >
                {/* Image */}
                <img
                  src={reel.image || PLACEHOLDER}
                  alt={reel.caption}
                  className="absolute inset-0 w-full h-full object-cover select-none"
                  onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  onClick={() => onTapImage(reel)}
                  draggable={false}
                />

                {/* Gradient overlays */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.0) 70%, rgba(0,0,0,0.25) 100%)" }} />

                {/* Heart burst animation */}
                {heartPop === reel.id && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Heart size={80} className="text-red-500 fill-red-500 heart-burst" />
                  </div>
                )}

                {/* Top: pinned badge + admin controls */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  {reel.pinned && (
                    <span className="flex items-center gap-1 text-white text-xs font-bold bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <Pin size={10} /> {tr("Pinned", "مثبت")}
                    </span>
                  )}
                  {isAdmin && (
                    <div className={`flex gap-1.5 ${reel.pinned ? "" : "ms-auto"}`}>
                      <button onClick={() => togglePin(reel)} className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60">
                        <Pin size={13} className={reel.pinned ? "fill-white" : ""} />
                      </button>
                      <button onClick={() => deleteReel(reel)} className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-red-400 hover:bg-black/60">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-16 p-4 pb-5">
                  <p className="text-white/80 text-xs font-semibold mb-1">✨ {reel.authorName}</p>
                  {(lang === "ar" ? reel.captionAr : reel.caption) && (
                    <p className="text-white text-sm font-medium leading-relaxed line-clamp-3">
                      {lang === "ar" ? (reel.captionAr || reel.caption) : reel.caption}
                    </p>
                  )}
                </div>

                {/* Right action bar */}
                <div className="absolute right-3 bottom-16 flex flex-col gap-5 items-center">
                  <button onClick={() => handleLike(reel)} className="flex flex-col items-center gap-1 group">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${liked ? "bg-red-500" : "bg-black/40 backdrop-blur-sm group-hover:bg-black/60"}`}>
                      <Heart size={20} className={`transition-all ${liked ? "fill-white text-white" : "text-white"}`} />
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow">{reel.likes || 0}</span>
                  </button>
                  <button onClick={() => handleShare(reel)} className="flex flex-col items-center gap-1">
                    <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-all">
                      <Share2 size={18} className="text-white" />
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow">{tr("Share","شارك")}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowUpload(false)} />
          <div className="relative w-full max-w-sm bottom-sheet page-enter" dir={isRTL ? "rtl" : "ltr"}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-primary text-lg" style={{ fontFamily: "var(--font-heading)" }}>{tr("New Post", "منشور جديد")}</h3>
              <button onClick={() => setShowUpload(false)} className="btn-icon w-8 h-8 text-muted-foreground"><X size={15} /></button>
            </div>

            {/* Image area */}
            <div className="rounded-2xl overflow-hidden mb-3" style={{ border: "1.5px dashed hsl(var(--border))" }}>
              {newImage ? (
                <div className="relative">
                  <img src={newImage} alt="preview" className="w-full h-48 object-cover" />
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">{imgSize} KB</div>
                  <button onClick={() => { setNewImage(""); setImgSize(0); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-destructive">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 py-10 cursor-pointer text-muted-foreground hover:text-primary transition-colors">
                  <Upload size={28} />
                  <span className="text-sm font-medium">{uploading ? tr("Compressing…","جاري الضغط…") : tr("Upload Image", "رفع صورة")}</span>
                  <span className="text-xs">{tr("Auto-compressed before saving", "يُضغط تلقائياً قبل الحفظ")}</span>
                  <input type="file" accept="image/*" className="sr-only" disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                </label>
              )}
            </div>

            <input className="input-field px-4 py-3 text-sm mb-2"
              placeholder={tr("Caption (English)", "التعليق (إنجليزي)")}
              value={newCaption} onChange={(e) => setNewCaption(e.target.value)} />
            <input className="input-field px-4 py-3 text-sm mb-4" dir="rtl"
              placeholder="التعليق (عربي)"
              value={newCaptionAr} onChange={(e) => setNewCaptionAr(e.target.value)} />

            <button onClick={saveReel} disabled={!newImage || saving}
              className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-50">
              {saving ? tr("Publishing…","جاري النشر…") : tr("Publish Post", "نشر المنشور")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
