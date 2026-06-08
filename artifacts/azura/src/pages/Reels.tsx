import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { db, ref, onValue, off, update, get } from "@/lib/firebase";
import { Heart, Share2, Camera, Play, ExternalLink } from "lucide-react";
import { swalInfo } from "@/lib/swal";
import { getFromIndexedDB, saveToIndexedDB } from "@/lib/chunkedVideo";
import { parseVideoUrl, getProviderIcon, type VideoProvider } from "@/lib/videoProviders";

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
  mediaType?: "image" | "video";
  videoUrl?: string;
  videoProvider?: VideoProvider;
  videoThumbnail?: string;
  chunkCount?: number;
}

const PLACEHOLDER = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80";

export default function Reels() {
  const { user } = useAuth();
  const { lang, isRTL } = useLang();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [heartPop, setHeartPop] = useState<string | null>(null);
  const [videoCache, setVideoCache] = useState<Record<string, string>>({});
  const [loadingVideos, setLoadingVideos] = useState<Set<string>>(new Set());
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  // Load video - tries IndexedDB first, then RTDB chunks
  const loadVideo = async (reel: Reel): Promise<string | null> => {
    const cacheKey = `reel_${reel.id}`;
    
    if (videoCache[cacheKey]) return videoCache[cacheKey];
    
    try {
      const cached = await getFromIndexedDB(cacheKey);
      if (cached) {
        setVideoCache(prev => ({ ...prev, [cacheKey]: cached }));
        return cached;
      }
    } catch (e) {
      console.warn("IndexedDB not available:", e);
    }
    
    try {
      const chunksSnap = await get(ref(db, `reelChunks/${reel.id}`));
      if (chunksSnap.exists()) {
        const chunksData = chunksSnap.val() as Record<string, string>;
        const chunks: string[] = [];
        
        const chunkKeys = Object.keys(chunksData).sort((a, b) => {
          const aIdx = parseInt(a.replace("chunk_", ""));
          const bIdx = parseInt(b.replace("chunk_", ""));
          return aIdx - bIdx;
        });
        
        for (const key of chunkKeys) {
          chunks.push(chunksData[key]);
        }
        
        if (chunks.length > 0) {
          const fullVideo = chunks.join("");
          saveToIndexedDB(cacheKey, fullVideo).catch(() => {});
          setVideoCache(prev => ({ ...prev, [cacheKey]: fullVideo }));
          return fullVideo;
        }
      }
    } catch (err) {
      console.error("Failed to load video from RTDB:", err);
    }
    
    return null;
  };

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

  // Get video URL for local videos
  const getVideoUrl = async (reel: Reel): Promise<string> => {
    if (reel.mediaType !== "video") return "";
    
    const cacheKey = `reel_${reel.id}`;
    
    if (videoCache[cacheKey]) return videoCache[cacheKey];
    if (loadingVideos.has(cacheKey)) return "";
    
    setLoadingVideos(prev => new Set(prev).add(cacheKey));
    const video = await loadVideo(reel);
    setLoadingVideos(prev => {
      const next = new Set(prev);
      next.delete(cacheKey);
      return next;
    });
    
    return video || reel.videoUrl || "";
  };

  // Check if video is URL-based (YouTube, Instagram, etc.)
  const isUrlBasedVideo = (reel: Reel): boolean => {
    if (!reel.videoUrl) return false;
    if (reel.videoProvider && reel.videoProvider !== "direct") return true;
    if (reel.chunkCount && reel.chunkCount > 0) return false;
    // Check if URL is from a known provider
    const parsed = parseVideoUrl(reel.videoUrl);
    return parsed.provider !== "direct";
  };

  // Get embed URL for URL-based videos
  const getEmbedUrl = (reel: Reel): string => {
    if (reel.videoProvider === "youtube") {
      const match = reel.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
    }
    if (reel.videoProvider === "google_drive") {
      const fileMatch = reel.videoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
    }
    return reel.videoUrl || "";
  };

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
      swalInfo(tr("Link copied!", "تم نسخ الرابط!"));
    }
  };

  const lastTap = useRef<Record<string, number>>({});
  const onTapImage = (reel: Reel) => {
    if (reel.mediaType === "video" && !isUrlBasedVideo(reel)) {
      // Play local video
      if (playingVideo === reel.id) {
        setPlayingVideo(null);
      } else {
        setPlayingVideo(reel.id);
      }
    } else {
      // Double tap to like for images
      const now = Date.now();
      const last = lastTap.current[reel.id] || 0;
      if (now - last < 300) { handleDoubleTap(reel); lastTap.current[reel.id] = 0; }
      else lastTap.current[reel.id] = now;
    }
  };

  // Open external video URL
  const openVideoUrl = (reel: Reel) => {
    if (reel.videoUrl) {
      window.open(reel.videoUrl, "_blank", "noopener,noreferrer");
    }
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
      {reels.length === 0 ? (
        <div className="h-[calc(100dvh-7.5rem)] flex flex-col items-center justify-center text-center px-6">
          <Camera size={56} className="text-muted-foreground/25 mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>{tr("No posts yet", "لا يوجد منشورات")}</h2>
          <p className="text-sm text-muted-foreground">{tr("Check back soon for cafe updates!", "ترقب منشوراتنا قريباً!")}</p>
        </div>
      ) : (
        <div
          className="overflow-y-scroll scroll-hide"
          style={{ height: "calc(100dvh - 7.5rem)", scrollSnapType: "y mandatory" }}
        >
          {reels.map((reel) => {
            const liked = !!(user && reel.likedBy?.[user.uid]);
            const isVideo = reel.mediaType === "video";
            const isUrlVideo = isUrlBasedVideo(reel);
            const isPlaying = playingVideo === reel.id;
            
            return (
              <div key={reel.id}
                className="relative w-full flex-shrink-0 overflow-hidden"
                style={{ height: "calc(100dvh - 7.5rem)", scrollSnapAlign: "start", scrollSnapStop: "always" }}
              >
                {/* Image/Video Content */}
                {isVideo && !isUrlVideo ? (
                  // Local video - show video element
                  isPlaying ? (
                    <video
                      src={reel.videoUrl || videoCache[`reel_${reel.id}`]}
                      className="absolute inset-0 w-full h-full object-cover"
                      controls
                      autoPlay
                      onEnded={() => setPlayingVideo(null)}
                    />
                  ) : (
                    <>
                      <img
                        src={reel.image || PLACEHOLDER}
                        alt={reel.caption}
                        className="absolute inset-0 w-full h-full object-cover select-none"
                        onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                        onClick={() => onTapImage(reel)}
                        draggable={false}
                      />
                      {/* Play button overlay */}
                      <button
                        onClick={() => onTapImage(reel)}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                      >
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                          <Play size={28} className="text-primary ml-1" />
                        </div>
                      </button>
                    </>
                  )
                ) : isVideo && isUrlVideo ? (
                  // URL-based video (YouTube, etc.) - show thumbnail with play button
                  <>
                    <img
                      src={reel.videoThumbnail || reel.image || PLACEHOLDER}
                      alt={reel.caption}
                      className="absolute inset-0 w-full h-full object-cover select-none"
                      onError={(e) => { (e.target as HTMLImageElement).src = reel.image || PLACEHOLDER; }}
                      draggable={false}
                    />
                    {/* Provider badge */}
                    <div className="absolute top-3 left-3">
                      <span className="flex items-center gap-1 text-white text-xs font-bold bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                        {getProviderIcon(reel.videoProvider || "unknown")} {reel.videoProvider?.replace("_", " ")}
                      </span>
                    </div>
                    {/* Play/Open button */}
                    <button
                      onClick={() => openVideoUrl(reel)}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                        <ExternalLink size={24} className="text-primary" />
                      </div>
                    </button>
                    <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-xs bg-black/50 px-3 py-1 rounded-full">
                      {tr("Tap to watch", "انقر للمشاهدة")}
                    </p>
                  </>
                ) : (
                  // Image only
                  <>
                    <img
                      src={reel.image || PLACEHOLDER}
                      alt={reel.caption}
                      className="absolute inset-0 w-full h-full object-cover select-none"
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                      onClick={() => onTapImage(reel)}
                      draggable={false}
                    />
                  </>
                )}

                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.0) 70%, rgba(0,0,0,0.25) 100%)" }} />

                {heartPop === reel.id && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Heart size={80} className="text-red-500 fill-red-500 heart-burst" />
                  </div>
                )}

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  {reel.pinned && (
                    <span className="flex items-center gap-1 text-white text-xs font-bold bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      📌 {tr("Pinned", "مثبت")}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-16 p-4 pb-5">
                  <p className="text-white/80 text-xs font-semibold mb-1">✨ {reel.authorName}</p>
                  {(lang === "ar" ? reel.captionAr : reel.caption) && (
                    <p className="text-white text-sm font-medium leading-relaxed line-clamp-3">
                      {lang === "ar" ? (reel.captionAr || reel.caption) : reel.caption}
                    </p>
                  )}
                </div>

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
    </div>
  );
}