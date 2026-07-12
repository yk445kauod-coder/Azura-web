import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { db, ref, onValue, update, push, remove } from "@/lib/firebase";
import { Heart, MessageCircle, ChevronRight, ChevronLeft, Send, X, Star, ThumbsUp, Trash2, Reply, Flag, AlertTriangle, AlertCircle, ShieldCheck } from "lucide-react";
import { swalInfo, swalSuccess } from "@/lib/swal";
import { logUserActivity } from "@/lib/activityTracker";

// Banned words list for comment quality control (English & Arabic)
const BANNED_WORDS = [
  "shit", "fuck", "bitch", "asshole", "crap", "dick", "bastard", "idiot", "suck",
  "كلب", "حمار", "غبي", "وسخ", "ابن الكلب", "لعنة", "يا جزمة", "حقير", "حيوان", "تفو"
];

function censorText(text: string): string {
  let censored = text;
  BANNED_WORDS.forEach(word => {
    const regex = new RegExp(word, "gi");
    censored = censored.replace(regex, "***");
  });
  return censored;
}

interface Comment {
  id: string;
  text: string;
  userName: string;
  userId?: string;
  createdAt: number;
  likes?: number;
  likedBy?: Record<string, boolean>;
  reported?: boolean;
  replies?: Record<string, {
    id: string;
    text: string;
    userName: string;
    userId?: string;
    createdAt: number;
    likes?: number;
    likedBy?: Record<string, boolean>;
    reported?: boolean;
  }>;
}

interface Reel {
  id: string;
  image: string;
  caption: string;
  captionAr: string;
  category?: string; // category affinity tag e.g. "mojitos", "desserts"
  likes: number;
  likedBy: Record<string, boolean>;
  createdAt: number;
  authorName: string;
  pinned?: boolean;
  videoUrl?: string;
  comments?: Record<string, Comment>;
}

interface Rating {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

const PLACEHOLDER = "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800";

function normalizeFacebookUrl(url: string): string {
  return url.replace(/m\.facebook\.com/g, "web.facebook.com").replace(/www\.facebook\.com/g, "web.facebook.com");
}

export default function Reels() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentPage, setCommentPage] = useState(0);

  // Wheel and Swipe Navigation refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const lastScrollTime = useRef<number>(0);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  // Load Reels
  useEffect(() => {
    const unsub = onValue(ref(db, "reels"), (snap) => {
      if (!snap.exists()) { setReels([]); setLoading(false); return; }
      const data = snap.val() as Record<string, Omit<Reel, "id">>;
      const loaded = Object.entries(data).map(([id, r]) => ({ id, ...r })).sort((a, b) => (a.pinned ? -1 : 1) - (b.pinned ? -1 : 1) || b.createdAt - a.createdAt);
      setReels(loaded);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load ratings
  useEffect(() => {
    const unsub = onValue(ref(db, "ratings"), (snap) => {
      if (!snap.exists()) { setRatings([]); return; }
      const data = snap.val() as Record<string, Omit<Rating, "id">>;
      setRatings(Object.entries(data).map(([id, r]) => ({ id, ...r })).sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  const currentReel = reels[currentIndex];
  const liked = currentReel && user && currentReel.likedBy?.[user.uid];
  const avgRating = ratings.length > 0 ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1) : "0.0";

  // Filter out reported comments/replies for quality standard
  const commentsArray = currentReel?.comments
    ? Object.entries(currentReel.comments)
        .map(([id, c]) => ({ ...c, id }))
        .filter(c => !c.reported)
        .sort((a, b) => (b.likes || 0) - (a.likes || 0) || b.createdAt - a.createdAt) // bubble top-rated comments
    : [];

  const totalPages = Math.ceil(commentsArray.length / 10);
  const paginatedComments = commentsArray.slice(commentPage * 10, (commentPage + 1) * 10);

  // Log Reel viewing and Category affinity update (Meta Algorithm)
  useEffect(() => {
    if (!currentReel || !user) return;

    // Log active view event
    logUserActivity(user.uid, "view_reel", {
      reelId: currentReel.id,
      caption: currentReel.caption,
      category: currentReel.category || "general"
    }, 5);

    // Update user category affinity (Meta recommendation model)
    if (currentReel.category) {
      const affinityRef = ref(db, `users/${user.uid}/preferences/affinities/${currentReel.category}`);
      update(ref(db, `users/${user.uid}/preferences/affinities`), {
        [currentReel.category]: (currentReel.likedBy?.[user.uid] ? 15 : 0) + 5 // increment score
      });
    }
  }, [currentIndex, currentReel?.id, user?.uid]);

  // Touch Swipe Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY;

    if (Math.abs(diffY) > 60) {
      if (diffY > 0) {
        // Swipe Up (Next Reel)
        if (currentIndex < reels.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setShowComments(false);
        }
      } else {
        // Swipe Down (Previous Reel)
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          setShowComments(false);
        }
      }
    }
  };

  // Mouse Wheel Navigation with Throttling
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastScrollTime.current < 800) return; // 800ms throttle

    if (Math.abs(e.deltaY) > 30) {
      lastScrollTime.current = now;
      if (e.deltaY > 0) {
        // Scroll Down (Next)
        if (currentIndex < reels.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setShowComments(false);
        }
      } else {
        // Scroll Up (Previous)
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          setShowComments(false);
        }
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showComments) return;
      if (e.key === "ArrowDown") {
        if (currentIndex < reels.length - 1) {
          setCurrentIndex(prev => prev + 1);
        }
      } else if (e.key === "ArrowUp") {
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, showComments, reels.length]);

  const handleLike = async () => {
    if (!user || !currentReel) return;
    const newLikes = liked ? Math.max(0, currentReel.likes - 1) : currentReel.likes + 1;
    const likedBy = { ...(currentReel.likedBy || {}) };
    liked ? delete likedBy[user.uid] : likedBy[user.uid] = true;
    await update(ref(db, `reels/${currentReel.id}`), { likes: newLikes, likedBy });

    // Track activity & affinity
    logUserActivity(user.uid, liked ? "unlike_reel" : "like_reel", {
      reelId: currentReel.id,
      category: currentReel.category || "general"
    }, liked ? -5 : 10);

    if (currentReel.category) {
      const affinityPath = `users/${user.uid}/preferences/affinities/${currentReel.category}`;
      onValue(ref(db, affinityPath), (snap) => {
        const currentVal = snap.val() || 0;
        update(ref(db, `users/${user.uid}/preferences/affinities`), {
          [currentReel.category!]: liked ? Math.max(0, currentVal - 10) : currentVal + 20
        });
      }, { onlyOnce: true });
    }
  };

  const handleComment = async () => {
    if (!user || !currentReel || !comment.trim()) return;
    const censored = censorText(comment.trim());

    await push(ref(db, `reels/${currentReel.id}/comments`), {
      text: censored,
      userName: user.displayName || "Guest",
      userId: user.uid,
      createdAt: Date.now(),
      likes: 0,
      likedBy: {}
    });

    logUserActivity(user.uid, "comment_reel", {
      reelId: currentReel.id,
      text: censored
    }, 15);

    setComment("");
    setReplyingTo(null);
    setCommentPage(0);
  };

  const handleReply = async (parentId: string) => {
    if (!user || !currentReel || !comment.trim()) return;
    const censored = censorText(comment.trim());

    await push(ref(db, `reels/${currentReel.id}/comments/${parentId}/replies`), {
      text: censored,
      userName: user.displayName || "Guest",
      userId: user.uid,
      createdAt: Date.now(),
      likes: 0,
      likedBy: {}
    });

    logUserActivity(user.uid, "reply_reel_comment", {
      reelId: currentReel.id,
      parentId,
      text: censored
    }, 12);

    setComment("");
    setReplyingTo(null);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentReel) return;
    await remove(ref(db, `reels/${currentReel.id}/comments/${commentId}`));
    if (user) {
      logUserActivity(user.uid, "delete_comment", { commentId }, -10);
    }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!currentReel) return;
    await remove(ref(db, `reels/${currentReel.id}/comments/${commentId}/replies/${replyId}`));
  };

  const handleLikeComment = async (commentId: string, currentLikes: number, likedBy: Record<string, boolean> = {}) => {
    if (!user || !currentReel) return;
    const commentLiked = likedBy[user.uid];
    const newLikes = commentLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    const newLikedBy = { ...likedBy };
    commentLiked ? delete newLikedBy[user.uid] : newLikedBy[user.uid] = true;
    await update(ref(db, `reels/${currentReel.id}/comments/${commentId}`), { likes: newLikes, likedBy: newLikedBy });
  };

  const handleLikeReply = async (commentId: string, replyId: string, currentLikes: number = 0, likedBy: Record<string, boolean> = {}) => {
    if (!user || !currentReel) return;
    const replyLiked = likedBy[user.uid];
    const newLikes = replyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    const newLikedBy = { ...likedBy };
    replyLiked ? delete newLikedBy[user.uid] : newLikedBy[user.uid] = true;
    await update(ref(db, `reels/${currentReel.id}/comments/${commentId}/replies/${replyId}`), { likes: newLikes, likedBy: newLikedBy });
  };

  const handleReportComment = async (commentId: string) => {
    if (!currentReel || !user) return;
    await update(ref(db, `reels/${currentReel.id}/comments/${commentId}`), { reported: true });

    // Log issue faced
    await push(ref(db, `users/${user.uid}/issues`), {
      type: "reported_comment",
      details: `User reported comment ID ${commentId} in Reel ${currentReel.id}`,
      createdAt: Date.now()
    });

    logUserActivity(user.uid, "report_comment", { commentId }, 2);
    swalSuccess(tr("Comment reported and hidden.", "تم الإبلاغ عن التعليق وإخفاؤه."));
  };

  const handleReportReply = async (commentId: string, replyId: string) => {
    if (!currentReel || !user) return;
    await update(ref(db, `reels/${currentReel.id}/comments/${commentId}/replies/${replyId}`), { reported: true });

    // Log issue faced
    await push(ref(db, `users/${user.uid}/issues`), {
      type: "reported_reply",
      details: `User reported reply ID ${replyId} in comment ${commentId}`,
      createdAt: Date.now()
    });

    logUserActivity(user.uid, "report_reply", { replyId }, 2);
    swalSuccess(tr("Reply reported and hidden.", "تم الإبلاغ عن الرد وإخفاؤه."));
  };

  const handleRate = async () => {
    if (!user || userRating === 0) return;
    await push(ref(db, "ratings"), { userId: user.uid, userName: user.displayName || "Guest", rating: userRating, comment: userComment.trim(), createdAt: Date.now() });

    logUserActivity(user.uid, "rate_cafe", { rating: userRating, comment: userComment.trim() }, 30);

    // If rating is low (1 or 2 stars), log it as an issue/feedback warning for CRM
    if (userRating <= 2) {
      await push(ref(db, `users/${user.uid}/issues`), {
        type: "low_rating_given",
        details: `${userRating}-star rating: "${userComment.trim()}"`,
        createdAt: Date.now()
      });
    }

    setShowRateModal(false);
    setUserRating(0);
    setUserComment("");
    swalInfo(tr("Thanks for your rating!", "شكراً على تقييمك!"));
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return tr("Now", "الآن");
    if (mins < 60) return tr(`${mins}m`, `${mins}د`);
    if (hours < 24) return tr(`${hours}h`, `${hours}س`);
    return tr(`${days}d`, `${days}ي`);
  };

  const getFacebookEmbedUrl = (videoUrl: string) => `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(normalizeFacebookUrl(videoUrl))}&show_text=false&autoplay=true&width=500`;
  const isFacebookUrl = (url: string) => url.includes("facebook.com") || url.includes("fb.watch") || url.includes("fb.com");
  const isInstagramUrl = (url: string) => url.includes("instagram.com") || url.includes("ddinstagram.com");

  useEffect(() => {
    if (currentReel?.videoUrl && isInstagramUrl(currentReel.videoUrl)) {
      // Instagram embeds need to be processed by their SDK
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
      script.onload = () => {
        if ((window as any).instgrm) {
          (window as any).instgrm.Embeds.process();
        }
      };
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [currentReel?.id]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" /></div>;

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <p className="text-6xl mb-4">🎬</p>
        <p className="text-white text-lg">{tr("No reels yet", "لا توجد ريليز")}</p>
        <div className="mt-12 w-full max-w-md bg-white/10 rounded-2xl p-6">
          <div className="text-center mb-4">
            <p className="text-white text-3xl font-bold">{avgRating} ⭐</p>
            <p className="text-white/60 text-sm">{ratings.length} {tr("reviews", "تقييمات")}</p>
          </div>
          <button onClick={() => setShowRateModal(true)} className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-bold">{tr("Rate Us", "قيمنا")}</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-black relative select-none"
      ref={scrollContainerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div className="h-screen w-full flex flex-col relative overflow-hidden">
        {/* Video/Image Section with Buffered Recycling rendering (Step 1 requirement) */}
        <div className="flex-1 relative overflow-hidden">
          {reels.map((reel, idx) => {
            // Memory recycling: Only mount DOM if it is current, previous, or next (active buffer)
            const isActive = idx === currentIndex;
            const isBuffered = Math.abs(idx - currentIndex) <= 1;

            if (!isBuffered) return null;

            return (
              <div
                key={reel.id}
                className={`absolute inset-0 transition-opacity duration-500 ${isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
              >
                {reel.videoUrl ? (
                  isFacebookUrl(reel.videoUrl) ? (
                    isActive ? (
                      <iframe
                        src={getFacebookEmbedUrl(reel.videoUrl)}
                        className="w-full h-full border-0"
                        allow="autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${reel.image || PLACEHOLDER})` }} />
                    )
                  ) : isInstagramUrl(reel.videoUrl) ? (
                    isActive ? (
                      <div className="w-full h-full flex items-center justify-center bg-black overflow-y-auto pt-20">
                        <blockquote
                          className="instagram-media w-full"
                          data-instgrm-permalink={reel.videoUrl}
                          data-instgrm-version="14"
                          style={{ minWidth: '326px' }}
                        >
                        </blockquote>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${reel.image || PLACEHOLDER})` }} />
                    )
                  ) : (
                    isActive ? (
                      <video
                        src={reel.videoUrl}
                        className="w-full h-full object-contain bg-black"
                        controls
                        autoPlay
                        playsInline
                      />
                    ) : (
                      <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${reel.image || PLACEHOLDER})` }} />
                    )
                  )
                ) : (
                  <img src={reel.image || PLACEHOLDER} alt="" className="w-full h-full object-cover" loading="eager" />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Overlay with content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none z-10" />
        
        {/* Author/Caption */}
        <div className="absolute bottom-24 left-4 right-20 pointer-events-none z-20">
          <p className="text-white font-bold text-base mb-1 drop-shadow-md">{currentReel.authorName}</p>
          <p className="text-white/95 text-xs line-clamp-3 leading-relaxed drop-shadow-sm">{lang === "ar" ? currentReel.captionAr : currentReel.caption}</p>
          {currentReel.category && (
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-primary/25 border border-primary/20 text-primary text-[10px] font-bold tracking-tight uppercase">
              #{currentReel.category}
            </span>
          )}
        </div>

        {/* Floating Interaction Sidebar */}
        <div className="absolute right-3.5 bottom-28 flex flex-col gap-5 items-center z-20">
          <button onClick={handleLike} className="flex flex-col items-center group active:scale-90 transition-transform">
            <div className="w-12 h-12 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors">
              <Heart size={24} className={liked ? "fill-red-500 text-red-500 scale-110" : "text-white"} />
            </div>
            <span className="text-white text-[11px] font-bold mt-1.5 drop-shadow-md">{currentReel.likes || 0}</span>
          </button>

          <button onClick={() => { setShowComments(!showComments); setCommentPage(0); }} className="flex flex-col items-center active:scale-90 transition-transform">
            <div className="w-12 h-12 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors">
              <MessageCircle size={24} className="text-white" />
            </div>
            <span className="text-white text-[11px] font-bold mt-1.5 drop-shadow-md">{commentsArray.length}</span>
          </button>

          <button onClick={() => setShowRateModal(true)} className="flex flex-col items-center active:scale-90 transition-transform">
            <div className="w-12 h-12 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors">
              <Star size={24} className="text-white" />
            </div>
            <span className="text-white text-[11px] font-bold mt-1.5 drop-shadow-md">{tr("Rate", "تقييم")}</span>
          </button>
        </div>

        {/* Slide navigation controls */}
        {reels.length > 1 && (
          <>
            <button onClick={() => { setCurrentIndex(prev => Math.max(0, prev - 1)); setShowComments(false); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/35 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform z-20 disabled:opacity-30" disabled={currentIndex === 0}><ChevronLeft size={22} /></button>
            <button onClick={() => { setCurrentIndex(prev => Math.min(reels.length - 1, prev + 1)); setShowComments(false); }} className="absolute right-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/35 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform z-20 disabled:opacity-30" disabled={currentIndex === reels.length - 1}><ChevronRight size={22} /></button>
          </>
        )}

        {/* Indicators dot bar */}
        {reels.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {reels.map((_, i) => (
              <button key={i} onClick={() => { setCurrentIndex(i); setShowComments(false); }} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? "bg-white w-4.5" : "bg-white/30"}`} />
            ))}
          </div>
        )}
      </div>

      {/* Modern sliding Bottom Sheet for Comments & Nested Replies */}
      {showComments && (
        <div className="absolute inset-x-0 bottom-0 z-40 bg-background rounded-t-3xl max-h-[72vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="w-12 h-1 bg-muted rounded-full mx-auto mt-2.5 flex-shrink-0" />
          <div className="flex items-center justify-between p-4 border-b border-border/15">
            <h3 className="font-bold text-foreground text-base">{tr("Comments", "التعليقات")} ({commentsArray.length})</h3>
            <button onClick={() => setShowComments(false)} className="p-1 hover:bg-muted rounded-full transition-colors"><X size={20} className="text-muted-foreground" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-hide">
            {paginatedComments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">{tr("No comments yet. Start the conversation!", "لا توجد تعليقات. ابدأ النقاش!")}</p>
              </div>
            ) : (
              paginatedComments.map((c) => {
                const commentLiked = user && c.likedBy?.[user.uid];
                const repliesList = c.replies ? Object.entries(c.replies).map(([rid, r]) => ({ ...r, id: rid })).filter(r => !r.reported).sort((a,b) => a.createdAt - b.createdAt) : [];

                return (
                  <div key={c.id} className="space-y-3.5 border-b border-border/5 pb-3">
                    <div className="flex gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">{c.userName?.charAt(0).toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="font-bold text-xs text-foreground truncate">{c.userName}</span><span className="text-[9px] text-muted-foreground font-semibold">{formatTime(c.createdAt)}</span></div>
                        <p className="text-sm text-foreground/90 mt-1 leading-relaxed break-words">{c.text}</p>

                        <div className="flex items-center gap-4 mt-2">
                          <button onClick={() => handleLikeComment(c.id, c.likes || 0, c.likedBy || {})} className={`text-[11px] font-semibold flex items-center gap-1 ${commentLiked ? "text-red-500 animate-pulse" : "text-muted-foreground hover:text-foreground"}`}>
                            <ThumbsUp size={11} className={commentLiked ? "fill-current" : ""} /> {c.likes || 0}
                          </button>

                          {user && (
                            <button onClick={() => setReplyingTo({ id: c.id, name: c.userName })} className="text-[11px] font-semibold text-muted-foreground hover:text-primary flex items-center gap-1">
                              <Reply size={11} /> {tr("Reply", "رد")}
                            </button>
                          )}

                          <button onClick={() => handleReportComment(c.id)} className="text-[11px] font-semibold text-muted-foreground/60 hover:text-amber-500 flex items-center gap-1 ml-auto">
                            <Flag size={11} /> {tr("Report", "إبلاغ")}
                          </button>

                          {(user?.uid === c.userId || user?.uid === "admin" || sessionStorage.getItem("azura-admin")) && (
                            <button onClick={() => handleDeleteComment(c.id)} className="text-[11px] font-semibold text-muted-foreground hover:text-destructive flex items-center gap-1">
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Visually Nested replies (Step 1 requirement) */}
                    {repliesList.length > 0 && (
                      <div className={`${lang === "ar" ? "mr-10 border-r-2" : "ml-10 border-l-2"} border-border/15 pl-3.5 pr-2 space-y-3.5`}>
                        {repliesList.map((r) => {
                          const rLiked = user && r.likedBy?.[user.uid];
                          return (
                            <div key={r.id} className="flex gap-2">
                              <div className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-black text-[10px] flex-shrink-0">{r.userName?.charAt(0).toUpperCase()}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2"><span className="font-bold text-[11px] text-foreground/80 truncate">{r.userName}</span><span className="text-[8px] text-muted-foreground font-semibold">{formatTime(r.createdAt)}</span></div>
                                <p className="text-xs text-foreground/85 mt-0.5 leading-relaxed break-words">{r.text}</p>

                                <div className="flex items-center gap-3 mt-1.5">
                                  <button onClick={() => handleLikeReply(c.id, r.id, r.likes || 0, r.likedBy || {})} className={`text-[10px] font-semibold flex items-center gap-0.5 ${rLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"}`}>
                                    <ThumbsUp size={10} className={rLiked ? "fill-current" : ""} /> {r.likes || 0}
                                  </button>

                                  <button onClick={() => handleReportReply(c.id, r.id)} className="text-[10px] font-semibold text-muted-foreground/50 hover:text-amber-500 flex items-center gap-0.5">
                                    <Flag size={10} /> {tr("Report", "إبلاغ")}
                                  </button>

                                  {(user?.uid === r.userId || user?.uid === "admin" || sessionStorage.getItem("azura-admin")) && (
                                    <button onClick={() => handleDeleteReply(c.id, r.id)} className="text-[10px] font-semibold text-muted-foreground hover:text-destructive flex items-center gap-0.5">
                                      <Trash2 size={10} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-3">
                <button onClick={() => setCommentPage(Math.max(0, commentPage - 1))} disabled={commentPage === 0} className="px-3 py-1 bg-muted rounded-xl text-xs font-bold disabled:opacity-40">←</button>
                <span className="text-xs font-bold text-muted-foreground py-1">{commentPage + 1} / {totalPages}</span>
                <button onClick={() => setCommentPage(Math.min(totalPages - 1, commentPage + 1))} disabled={commentPage === totalPages - 1} className="px-3 py-1 bg-muted rounded-xl text-xs font-bold disabled:opacity-40">→</button>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border/15 space-y-2 bg-card">
            {replyingTo && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-xl px-3 py-1.5 animate-in fade-in duration-150">
                <Reply size={12} /><span>{tr("Reply to", "رد على")} @{replyingTo.name}</span>
                <button onClick={() => setReplyingTo(null)} className="ml-auto p-0.5 hover:bg-muted-foreground/10 rounded-full"><X size={12} /></button>
              </div>
            )}
            <div className="flex gap-2">
              <input className="flex-1 px-4 py-3 rounded-xl bg-muted text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/45" placeholder={tr("Add comment...", "أضف تعليق...")} value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (replyingTo ? handleReply(replyingTo.id) : handleComment())} />
              <button onClick={() => replyingTo ? handleReply(replyingTo.id) : handleComment()} disabled={!comment.trim()} className="btn-primary px-4 rounded-xl flex items-center justify-center disabled:opacity-50"><Send size={15} /></button>
            </div>
          </div>
        </div>
      )}

      {showRateModal && (
        <div className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-foreground text-base">{tr("Rate Us", "قيمنا")}</h3>
              <button onClick={() => setShowRateModal(false)} className="p-1 hover:bg-muted rounded-full"><X size={18} /></button>
            </div>
            <div className="flex justify-center gap-2.5 mb-5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setUserRating(star)} className="p-1 hover:scale-110 transition-transform">
                  <Star size={38} className={(hoverRating || userRating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                </button>
              ))}
            </div>
            <textarea className="w-full px-4 py-3 rounded-xl bg-muted mb-4 resize-none text-sm font-medium focus:outline-none" placeholder={tr("Write review (optional)", "اكتب تقييم (اختياري)")} rows={3} value={userComment} onChange={(e) => setUserComment(e.target.value)} />
            <button onClick={handleRate} disabled={userRating === 0} className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-bold text-sm tracking-wide shadow-lg disabled:opacity-50">{tr("Submit", "إرسال")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
