import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { db, ref, onValue, off, update, push, remove } from "@/lib/firebase";
import { parseVideoUrl, getEmbedHtml } from "@/lib/videoProviders";
import { Heart, MessageCircle, Share2, ChevronRight, ChevronLeft, Send, X, Star, MoreHorizontal, Trash2, Reply, ThumbsUp } from "lucide-react";
import { swalInfo } from "@/lib/swal";

interface Comment {
  id: string;
  text: string;
  userName: string;
  userId?: string;
  createdAt: number;
  likes?: number;
  likedBy?: Record<string, boolean>;
  parentId?: string;
  replies?: Record<string, { id: string; text: string; userName: string; userId?: string; createdAt: number }>;
}

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
  videoProvider?: string;
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
const COMMENTS_PER_PAGE = 10;

export default function Reels() {
  const { user } = useAuth();
  const { lang, isRTL } = useLang();
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
  const [deletingComment, setDeletingComment] = useState<string | null>(null);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  // Load reels and re-parse FB XFBML
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

      // Trigger Social SDK re-parsing
      setTimeout(() => {
        if (window.FB) window.FB.XFBML.parse();
        if (window.instgrm) window.instgrm.Embeds.process();
      }, 800);
    });
    return () => off(reelsRef);
  }, []);

  // Re-parse Social Embeds when current reel changes
  // NOTE: currentReelId is derived below — keep this effect AFTER the state declarations
  // but the dep value is captured via the state array (safe, no TDZ)
  const currentReelId = reels[currentIndex]?.id;
  useEffect(() => {
    setTimeout(() => {
      if (window.FB) window.FB.XFBML.parse();
      if (window.instgrm) window.instgrm.Embeds.process();
    }, 300);
  }, [currentIndex, currentReelId]);

  // Load ratings
  useEffect(() => {
    const ratingsRef = ref(db, "ratings");
    onValue(ratingsRef, (snap) => {
      if (!snap.exists()) { setRatings([]); return; }
      const data = snap.val() as Record<string, Omit<Rating, "id">>;
      const list = Object.entries(data).map(([id, r]) => ({ id, ...r }));
      setRatings(list.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => off(ratingsRef);
  }, []);

  const currentReel = reels[currentIndex];
  const liked = currentReel && user && currentReel.likedBy?.[user.uid];
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1)
    : "0.0";

  // Get comments as array with pagination
  const getCommentsArray = useCallback(() => {
    if (!currentReel?.comments) return [];
    return Object.entries(currentReel.comments)
      .map(([id, c]) => ({ id, ...c }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [currentReel?.comments]);

  const commentsArray = getCommentsArray();
  const totalCommentPages = Math.ceil(commentsArray.length / COMMENTS_PER_PAGE);
  const paginatedComments = commentsArray.slice(commentPage * COMMENTS_PER_PAGE, (commentPage + 1) * COMMENTS_PER_PAGE);

  const handleLike = async () => {
    if (!user || !currentReel) return;
    const newLikes = liked ? Math.max(0, currentReel.likes - 1) : currentReel.likes + 1;
    const likedBy = { ...(currentReel.likedBy || {}) };
    if (liked) delete likedBy[user.uid];
    else likedBy[user.uid] = true;
    await update(ref(db, `reels/${currentReel.id}`), { likes: newLikes, likedBy });
  };

  const handleComment = async () => {
    if (!user || !currentReel || !comment.trim()) return;
    const commentsRef = ref(db, `reels/${currentReel.id}/comments`);
    const newComment = {
      text: comment.trim(),
      userName: user.displayName || "Guest",
      userId: user.uid,
      createdAt: Date.now(),
      likes: 0,
      likedBy: {},
    };
    await push(commentsRef, newComment);
    setComment("");
    setReplyingTo(null);
    setCommentPage(0);
  };

  const handleReply = async (parentId: string) => {
    if (!user || !currentReel || !comment.trim()) return;
    const replyRef = ref(db, `reels/${currentReel.id}/comments/${parentId}/replies`);
    const newReply = {
      id: Date.now().toString(),
      text: comment.trim(),
      userName: user.displayName || "Guest",
      userId: user.uid,
      createdAt: Date.now(),
    };
    await push(replyRef, newReply);
    setComment("");
    setReplyingTo(null);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentReel) return;
    setDeletingComment(commentId);
    await remove(ref(db, `reels/${currentReel.id}/comments/${commentId}`));
    setDeletingComment(null);
  };

  const handleLikeComment = async (commentId: string, currentLikes: number, likedBy: Record<string, boolean> = {}) => {
    if (!user || !currentReel) return;
    const newLikes = likedBy[user.uid] ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    const newLikedBy = { ...likedBy };
    if (likedBy[user.uid]) delete newLikedBy[user.uid];
    else newLikedBy[user.uid] = true;
    await update(ref(db, `reels/${currentReel.id}/comments/${commentId}`), { likes: newLikes, likedBy: newLikedBy });
  };

  const handleRate = async () => {
    if (!user || userRating === 0) return;
    const ratingsRef = ref(db, "ratings");
    await push(ratingsRef, {
      userId: user.uid,
      userName: user.displayName || "Guest",
      rating: userRating,
      comment: userComment.trim(),
      createdAt: Date.now()
    });
    setShowRateModal(false);
    setUserRating(0);
    setUserComment("");
    swalInfo(tr("Thanks for your rating! 🌟", "شكراً على تقييمك! 🌟"));
  };

  const goNext = () => setCurrentIndex(prev => prev < reels.length - 1 ? prev + 1 : prev);
  const goPrev = () => setCurrentIndex(prev => prev > 0 ? prev - 1 : prev);

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return tr("Just now", "الآن");
    if (mins < 60) return tr(`${mins}m ago`, `منذ ${mins}د`);
    if (hours < 24) return tr(`${hours}h ago`, `منذ ${hours}س`);
    return tr(`${days}d ago`, `منذ ${days}ي`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <p className="text-6xl mb-4">🎬</p>
        <p className="text-white text-lg">{tr("No reels yet", "لا توجد ريليز")}</p>
        
        {/* Rating Section */}
        <div className="mt-12 w-full max-w-md bg-white/10 rounded-2xl p-6">
          <div className="text-center mb-4">
            <p className="text-white text-3xl font-bold">{avgRating} ⭐</p>
            <p className="text-white/60 text-sm">{ratings.length} {tr("reviews", "تقييمات")}</p>
          </div>
          <button 
            onClick={() => setShowRateModal(true)}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-bold"
          >
            {tr("Rate Us ⭐", "قيمنا ⭐")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Main Reel View */}
      <div className="h-screen w-full flex items-center justify-center relative overflow-hidden">
        {currentReel.videoUrl ? (
          <div className="w-full h-full">
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{
                __html: getEmbedHtml(parseVideoUrl(currentReel.videoUrl), "100%", "100%")
              }}
            />
          </div>
        ) : (
          <img
            src={currentReel.image || PLACEHOLDER}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <div className="max-w-lg">
            <p className="text-white font-bold text-lg mb-1">{currentReel.authorName}</p>
            <p className="text-white/90 text-sm">{lang === "ar" ? currentReel.captionAr : currentReel.caption}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center">
          <button onClick={handleLike} className="flex flex-col items-center">
            <Heart 
              size={32} 
              className={`${liked ? "fill-red-500 text-red-500" : "text-white"} transition-all transform hover:scale-110`} 
            />
            <span className="text-white text-xs mt-1">{currentReel.likes || 0}</span>
          </button>
          
          <button onClick={() => { setShowComments(!showComments); setCommentPage(0); }} className="flex flex-col items-center">
            <MessageCircle size={32} className="text-white" />
            <span className="text-white text-xs mt-1">
              {commentsArray.length}
            </span>
          </button>
          
          <button onClick={() => setShowRateModal(true)} className="flex flex-col items-center">
            <Star size={32} className="text-white" />
            <span className="text-white text-xs mt-1">{tr("Rate", "تقييم")}</span>
          </button>
        </div>

        {/* Navigation */}
        {reels.length > 1 && (
          <>
            <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white transition-colors">
              <ChevronLeft size={32} />
            </button>
            <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white transition-colors">
              <ChevronRight size={32} />
            </button>
          </>
        )}

        {/* Progress */}
        <div className="absolute top-4 left-4 right-4 flex gap-1">
          {reels.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 flex-1 rounded-full transition-all ${i === currentIndex ? "bg-white" : "bg-white/30"}`}
            />
          ))}
        </div>
      </div>

      {/* Comments Panel */}
      {showComments && (
        <div className="absolute inset-0 bg-black/80 z-50 flex">
          <div className="flex-1" onClick={() => setShowComments(false)} />
          <div className="w-full max-w-md bg-background h-full overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold">{tr("Comments", "التعليقات")} ({commentsArray.length})</h3>
              <button onClick={() => setShowComments(false)}><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {paginatedComments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{tr("No comments yet", "لا توجد تعليقات")}</p>
              ) : (
                <>
                  {paginatedComments.map((c) => {
                    const commentLiked = user && c.likedBy?.[user.uid];
                    return (
                      <div key={c.id} className="bg-muted/50 rounded-xl p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                            {c.userName?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{c.userName}</span>
                              <span className="text-[10px] text-muted-foreground">{formatTime(c.createdAt)}</span>
                            </div>
                            <p className="text-sm mt-0.5">{c.text}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <button 
                                onClick={() => handleLikeComment(c.id, c.likes || 0, c.likedBy || {})}
                                className={`flex items-center gap-1 text-xs transition-colors ${commentLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                              >
                                <ThumbsUp size={12} className={commentLiked ? "fill-current" : ""} />
                                {c.likes || 0}
                              </button>
                              {user && (
                                <button 
                                  onClick={() => setReplyingTo({ id: c.id, name: c.userName })}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <Reply size={12} />
                                  {tr("Reply", "رد")}
                                </button>
                              )}
                              {user?.uid === c.userId && (
                                <button 
                                  onClick={() => handleDeleteComment(c.id)}
                                  disabled={deletingComment === c.id}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Replies */}
                        {c.replies && Object.keys(c.replies).length > 0 && (
                          <div className="ms-8 space-y-2 border-l-2 border-muted pl-3">
                            {Object.entries(c.replies).map(([replyId, reply]) => (
                              <div key={replyId} className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-[10px] flex-shrink-0">
                                  {reply.userName?.charAt(0).toUpperCase() || "?"}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-xs">{reply.userName}</span>
                                    <span className="text-[10px] text-muted-foreground">{formatTime(reply.createdAt)}</span>
                                  </div>
                                  <p className="text-xs mt-0.5">{reply.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Pagination */}
                  {totalCommentPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        onClick={() => setCommentPage(Math.max(0, commentPage - 1))}
                        disabled={commentPage === 0}
                        className="px-3 py-1 text-sm bg-muted rounded-lg disabled:opacity-40"
                      >
                        ←
                      </button>
                      <span className="text-sm text-muted-foreground">
                        {commentPage + 1} / {totalCommentPages}
                      </span>
                      <button
                        onClick={() => setCommentPage(Math.min(totalCommentPages - 1, commentPage + 1))}
                        disabled={commentPage === totalCommentPages - 1}
                        className="px-3 py-1 text-sm bg-muted rounded-lg disabled:opacity-40"
                      >
                        →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Comment Input */}
            <div className="p-4 border-t space-y-2">
              {replyingTo && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                  <Reply size={12} />
                  <span>{tr("Replying to", "رد على")} @{replyingTo.name}</span>
                  <button onClick={() => setReplyingTo(null)} className="ml-auto"><X size={12} /></button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  className="flex-1 px-4 py-2 rounded-xl bg-muted text-sm"
                  placeholder={tr("Add a comment...", "أضف تعليق...")}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (replyingTo ? handleReply(replyingTo.id) : handleComment())}
                />
                <button 
                  onClick={() => replyingTo ? handleReply(replyingTo.id) : handleComment()} 
                  className="btn-primary px-4 rounded-xl flex items-center justify-center"
                  disabled={!comment.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {showRateModal && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{tr("Rate Us", "قيمنا")}</h3>
              <button onClick={() => setShowRateModal(false)}><X size={20} /></button>
            </div>
            
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setUserRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star 
                    size={40} 
                    className={`${(hoverRating || userRating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} transition-colors`}
                  />
                </button>
              ))}
            </div>
            
            <textarea
              className="w-full px-4 py-3 rounded-xl bg-muted mb-4 resize-none"
              placeholder={tr("Write a review (optional)", "اكتب تقييم (اختياري)")}
              rows={3}
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
            />
            
            <button 
              onClick={handleRate}
              disabled={userRating === 0}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-bold disabled:opacity-50 transition-opacity"
            >
              {tr("Submit Rating", "إرسال التقييم")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
