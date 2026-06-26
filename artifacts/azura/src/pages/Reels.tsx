import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { db, ref, onValue, update, push, remove } from "@/lib/firebase";
import { Heart, MessageCircle, ChevronRight, ChevronLeft, Send, X, Star, ThumbsUp, Trash2, Reply } from "lucide-react";
import { swalInfo } from "@/lib/swal";

interface Comment {
  id: string; text: string; userName: string; userId?: string; createdAt: number;
  likes?: number; likedBy?: Record<string, boolean>;
  replies?: Record<string, { id: string; text: string; userName: string; userId?: string; createdAt: number }>;
}

interface Reel {
  id: string; image: string; caption: string; captionAr: string; likes: number;
  likedBy: Record<string, boolean>; createdAt: number; authorName: string;
  pinned?: boolean; videoUrl?: string; comments?: Record<string, Comment>;
}

interface Rating { id: string; userId: string; userName: string; rating: number; comment: string; createdAt: number; }

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

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  useEffect(() => {
    const unsub = onValue(ref(db, "reels"), (snap) => {
      if (!snap.exists()) { setReels([]); setLoading(false); return; }
      const data = snap.val() as Record<string, Omit<Reel, "id">>;
      setReels(Object.entries(data).map(([id, r]) => ({ id, ...r })).sort((a, b) => (a.pinned ? -1 : 1) - (b.pinned ? -1 : 1) || b.createdAt - a.createdAt));
      setLoading(false);
    });
    return () => unsub();
  }, []);

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

  const commentsArray = currentReel?.comments ? Object.entries(currentReel.comments).map(([id, c]) => ({ ...c, id })).sort((a, b) => b.createdAt - a.createdAt) : [];
  const totalPages = Math.ceil(commentsArray.length / 10);
  const paginatedComments = commentsArray.slice(commentPage * 10, (commentPage + 1) * 10);

  const handleLike = async () => {
    if (!user || !currentReel) return;
    const newLikes = liked ? Math.max(0, currentReel.likes - 1) : currentReel.likes + 1;
    const likedBy = { ...(currentReel.likedBy || {}) };
    liked ? delete likedBy[user.uid] : likedBy[user.uid] = true;
    await update(ref(db, `reels/${currentReel.id}`), { likes: newLikes, likedBy });
  };

  const handleComment = async () => {
    if (!user || !currentReel || !comment.trim()) return;
    await push(ref(db, `reels/${currentReel.id}/comments`), { text: comment.trim(), userName: user.displayName || "Guest", userId: user.uid, createdAt: Date.now(), likes: 0, likedBy: {} });
    setComment(""); setReplyingTo(null); setCommentPage(0);
  };

  const handleReply = async (parentId: string) => {
    if (!user || !currentReel || !comment.trim()) return;
    await push(ref(db, `reels/${currentReel.id}/comments/${parentId}/replies`), { id: Date.now().toString(), text: comment.trim(), userName: user.displayName || "Guest", userId: user.uid, createdAt: Date.now() });
    setComment(""); setReplyingTo(null);
  };

  const handleDeleteComment = async (commentId: string) => { if (!currentReel) return; await remove(ref(db, `reels/${currentReel.id}/comments/${commentId}`)); };

  const handleLikeComment = async (commentId: string, currentLikes: number, likedBy: Record<string, boolean> = {}) => {
    if (!user || !currentReel) return;
    const newLikes = likedBy[user.uid] ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    const newLikedBy = { ...likedBy };
    likedBy[user.uid] ? delete newLikedBy[user.uid] : newLikedBy[user.uid] = true;
    await update(ref(db, `reels/${currentReel.id}/comments/${commentId}`), { likes: newLikes, likedBy: newLikedBy });
  };

  const handleRate = async () => {
    if (!user || userRating === 0) return;
    await push(ref(db, "ratings"), { userId: user.uid, userName: user.displayName || "Guest", rating: userRating, comment: userComment.trim(), createdAt: Date.now() });
    setShowRateModal(false); setUserRating(0); setUserComment("");
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
    <div className="min-h-screen bg-black relative">
      <div className="h-screen w-full flex flex-col relative overflow-hidden">
        {/* Video/Image Section */}
        <div className="flex-1 relative">
          {currentReel?.videoUrl ? (
            isFacebookUrl(currentReel.videoUrl) ? (
              <iframe 
                src={getFacebookEmbedUrl(currentReel.videoUrl)} 
                className="w-full h-full" 
                frameBorder="0" 
                allow="autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture" 
                allowFullScreen
              />
            ) : (
              <video 
                src={currentReel.videoUrl} 
                className="w-full h-full object-contain bg-black" 
                controls 
                autoPlay 
                playsInline
              />
            )
          ) : (
            <img src={currentReel.image || PLACEHOLDER} alt="" className="w-full h-full object-cover" loading="eager" />
          )}
        </div>
        
        {/* Overlay with content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        
        {/* Author/Caption */}
        <div className="absolute bottom-20 left-4 right-16 pointer-events-none">
          <p className="text-white font-bold text-lg mb-1">{currentReel.authorName}</p>
          <p className="text-white/90 text-sm line-clamp-2">{lang === "ar" ? currentReel.captionAr : currentReel.caption}</p>
        </div>

        <div className="absolute right-3 bottom-24 flex flex-col gap-5 items-center">
          <button onClick={handleLike} className="flex flex-col items-center">
            <Heart size={30} className={liked ? "fill-red-500 text-red-500" : "text-white"} />
            <span className="text-white text-[11px] mt-0.5">{currentReel.likes || 0}</span>
          </button>
          <button onClick={() => { setShowComments(!showComments); setCommentPage(0); }} className="flex flex-col items-center">
            <MessageCircle size={30} className="text-white" />
            <span className="text-white text-[11px] mt-0.5">{commentsArray.length}</span>
          </button>
          <button onClick={() => setShowRateModal(true)} className="flex flex-col items-center">
            <Star size={30} className="text-white" />
            <span className="text-white text-[11px] mt-0.5">{tr("Rate", "تقييم")}</span>
          </button>
        </div>

        {reels.length > 1 && (
          <>
            <button onClick={() => { setCurrentIndex(prev => Math.max(0, prev - 1)); setShowComments(false); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white disabled:opacity-30" disabled={currentIndex === 0}><ChevronLeft size={24} /></button>
            <button onClick={() => { setCurrentIndex(prev => Math.min(reels.length - 1, prev + 1)); setShowComments(false); }} className="absolute right-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white disabled:opacity-30" disabled={currentIndex === reels.length - 1}><ChevronRight size={24} /></button>
          </>
        )}

        {reels.length > 1 && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5">
            {reels.map((_, i) => (
              <button key={i} onClick={() => { setCurrentIndex(i); setShowComments(false); }} className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? "bg-white w-4" : "bg-white/40"}`} />
            ))}
          </div>
        )}
      </div>

      {showComments && (
        <div className="absolute inset-x-0 bottom-0 z-40 bg-background rounded-t-3xl max-h-[70vh] flex flex-col shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-bold">{tr("Comments", "التعليقات")} ({commentsArray.length})</h3>
            <button onClick={() => setShowComments(false)}><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {paginatedComments.map((c) => {
              const commentLiked = user && c.likedBy?.[user.uid];
              return (
                <div key={c.id} className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">{c.userName?.charAt(0).toUpperCase()}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><span className="font-medium text-sm">{c.userName}</span><span className="text-[10px] text-muted-foreground">{formatTime(c.createdAt)}</span></div>
                    <p className="text-sm mt-0.5">{c.text}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <button onClick={() => handleLikeComment(c.id, c.likes || 0, c.likedBy || {})} className={`text-xs ${commentLiked ? "text-red-500" : "text-muted-foreground"}`}><ThumbsUp size={12} className={`inline ${commentLiked ? "fill-current" : ""}`} /> {c.likes || 0}</button>
                      {user && <button onClick={() => setReplyingTo({ id: c.id, name: c.userName })} className="text-xs text-muted-foreground"><Reply size={12} className="inline" /> {tr("Reply", "رد")}</button>}
                      {user?.uid === c.userId && <button onClick={() => handleDeleteComment(c.id)} className="text-xs text-muted-foreground hover:text-red-500"><Trash2 size={12} className="inline" /></button>}
                    </div>
                  </div>
                </div>
              );
            })}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                <button onClick={() => setCommentPage(Math.max(0, commentPage - 1))} disabled={commentPage === 0} className="px-3 py-1 bg-muted rounded-lg text-sm">←</button>
                <span className="text-sm text-muted-foreground py-1">{commentPage + 1}/{totalPages}</span>
                <button onClick={() => setCommentPage(Math.min(totalPages - 1, commentPage + 1))} disabled={commentPage === totalPages - 1} className="px-3 py-1 bg-muted rounded-lg text-sm">→</button>
              </div>
            )}
          </div>
          <div className="p-4 border-t space-y-2">
            {replyingTo && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                <Reply size={12} /><span>{tr("Reply to", "رد على")} @{replyingTo.name}</span>
                <button onClick={() => setReplyingTo(null)} className="ml-auto"><X size={12} /></button>
              </div>
            )}
            <div className="flex gap-2">
              <input className="flex-1 px-4 py-2 rounded-xl bg-muted text-sm" placeholder={tr("Add comment...", "أضف تعليق...")} value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (replyingTo ? handleReply(replyingTo.id) : handleComment())} />
              <button onClick={() => replyingTo ? handleReply(replyingTo.id) : handleComment()} disabled={!comment.trim()} className="btn-primary px-4 rounded-xl"><Send size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {showRateModal && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{tr("Rate Us", "قيمنا")}</h3>
              <button onClick={() => setShowRateModal(false)}><X size={20} /></button>
            </div>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setUserRating(star)} className="p-1 hover:scale-110 transition-transform">
                  <Star size={40} className={(hoverRating || userRating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                </button>
              ))}
            </div>
            <textarea className="w-full px-4 py-3 rounded-xl bg-muted mb-4 resize-none" placeholder={tr("Write review (optional)", "اكتب تقييم (اختياري)")} rows={3} value={userComment} onChange={(e) => setUserComment(e.target.value)} />
            <button onClick={handleRate} disabled={userRating === 0} className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-bold disabled:opacity-50">{tr("Submit", "إرسال")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
