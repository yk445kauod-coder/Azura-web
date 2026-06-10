import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { db, ref, onValue, off, update } from "@/lib/firebase";
import { Heart, Share2 } from "lucide-react";
import { swalInfo } from "@/lib/swal";
import { parseVideoUrl, type VideoProvider } from "@/lib/videoProviders";

interface Reel {
  id: string;
  image: string;
  caption: string;
  captionAr: string;
  likes: number;
  likedBy: Record<string, boolean>;
  createdAt: number;
  authorName: string;
  pinned?: boolean;
  videoUrl?: string;
  videoProvider?: VideoProvider;
}

export default function Reels() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [heartPop, setHeartPop] = useState<string | null>(null);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  // Simple load - no complex video handling
  useEffect(() => {
    setLoading(true);
    const reelsRef = ref(db, "reels");
    const unsub = onValue(reelsRef, (snap) => {
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
    }, (err) => {
      console.error("Reels load error:", err);
      setLoading(false);
    });
    return () => { try { off(reelsRef); } catch {} };
  }, []);

  const handleLike = useCallback(async (reel: Reel) => {
    if (!user) return;
    const liked = reel.likedBy?.[user.uid];
    const newLikes = liked ? Math.max(0, reel.likes - 1) : reel.likes + 1;
    const likedBy = { ...(reel.likedBy || {}) };
    if (liked) delete likedBy[user.uid];
    else likedBy[user.uid] = true;
    try {
      await update(ref(db, `reels/${reel.id}`), { likes: newLikes, likedBy });
    } catch (e) { console.error("Like error:", e); }
    if (!liked) {
      setHeartPop(reel.id);
      setTimeout(() => setHeartPop(null), 700);
    }
  }, [user]);

  const handleShare = async (reel: Reel) => {
    const text = lang === "ar" ? (reel.captionAr || reel.caption) : reel.caption;
    if (navigator.share) {
      try { await navigator.share({ title: "Azura Cafe", text, url: window.location.href }); } 
      catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      swalInfo(tr("Link copied!", "تم نسخ الرابط!"));
    }
  };

  const lastTap = useRef<Record<string, number>>({});
  const onTapImage = (reel: Reel) => {
    const now = Date.now();
    const last = lastTap.current[reel.id] || 0;
    if (now - last < 300) { handleLike(reel); lastTap.current[reel.id] = 0; }
    else lastTap.current[reel.id] = now;
  };

  const openVideo = (reel: Reel) => {
    if (!reel.videoUrl) return;
    
    // Handle YouTube embeds
    if (reel.videoProvider === "youtube" || reel.videoUrl.includes("youtube")) {
      const match = reel.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      if (match) {
        window.open(`https://www.youtube.com/embed/${match[1]}?autoplay=1`, "_blank", "noopener,noreferrer");
        return;
      }
    }
    
    // Handle Google Drive
    if (reel.videoProvider === "google_drive" || reel.videoUrl.includes("drive.google")) {
      const fileMatch = reel.videoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileMatch) {
        window.open(`https://drive.google.com/file/d/${fileMatch[1]}/preview`, "_blank", "noopener,noreferrer");
        return;
      }
    }
    
    // Default: open URL
    window.open(reel.videoUrl, "_blank", "noopener,noreferrer");
  };

  // Get embed URL for iframe
  const getEmbedUrl = (reel: Reel): string => {
    if (!reel.videoUrl) return "";
    
    if (reel.videoProvider === "youtube") {
      const match = reel.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
    }
    
    if (reel.videoProvider === "google_drive") {
      const fileMatch = reel.videoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
    }
    
    // Auto-detect provider
    const parsed = parseVideoUrl(reel.videoUrl);
    if (parsed.provider === "youtube") {
      return `https://www.youtube.com/embed/${parsed.id}?autoplay=1`;
    }
    
    return reel.videoUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{tr("Loading reels...", "جاري تحميل الريلز...")}</p>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-6xl mb-4">🎬</p>
          <p className="text-lg font-bold text-foreground mb-2">{tr("No reels yet", "لا توجد ريليز بعد")}</p>
          <p className="text-sm text-muted-foreground">{tr("Check back soon!", "تراجع لاحقاً!")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
        {reels.map((reel) => {
          const liked = user && reel.likedBy?.[user.uid];
          return (
            <div 
              key={reel.id} 
              className="relative aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer group"
              onClick={() => onTapImage(reel)}
            >
              {/* Image */}
              <img 
                src={reel.image || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80"} 
                alt={reel.caption}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80"; }}
              />
              
              {/* Video indicator */}
              {reel.videoUrl && (
                <button 
                  onClick={(e) => { e.stopPropagation(); openVideo(reel); }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30"
                >
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[14px] border-l-primary border-y-[8px] border-y-transparent ml-1" />
                  </div>
                </button>
              )}
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex items-center gap-4 text-white">
                  <div className="flex items-center gap-1">
                    <Heart size={18} className={liked ? "fill-red-500 text-red-500" : ""} />
                    <span className="text-sm font-bold">{reel.likes || 0}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleShare(reel); }} className="hover:scale-110 transition-transform">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
              
              {/* Heart pop animation */}
              {heartPop === reel.id && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Heart size={64} className="fill-red-500 text-red-500 animate-heart-pop" />
                </div>
              )}
              
              {/* Pinned indicator */}
              {reel.pinned && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  📌 {tr("Pinned", "مثبت")}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <style>{`
        @keyframes heart-pop {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-heart-pop {
          animation: heart-pop 0.7s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
