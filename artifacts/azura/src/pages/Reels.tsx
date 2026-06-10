import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { db, ref, onValue, off, update, push } from "@/lib/firebase";
import { Heart, MessageCircle, Share2, ChevronRight, ChevronLeft, Send, X, Star } from "lucide-react";
import { swalInfo } from "@/lib/swal";

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
  comments?: Record<string, { text: string; userName: string; createdAt: number }>;
}

interface Rating {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

const PLACEHOLDER = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80";

export default function Reels() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [showRateModal, setShowRateModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [hoverRating, setHoverRating] = useState(0);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  // Load reels
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
    return () => off(reelsRef);
  }, []);

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
      createdAt: Date.now()
    };
    await push(commentsRef, newComment);
    setComment("");
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
      <div className="h-screen w-full flex items-center justify-center relative">
        <img 
          src={currentReel.image || PLACEHOLDER}
          alt=""
          className="w-full h-full object-cover"
        />
        
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
              className={`${liked ? "fill-red-500 text-red-500" : "text-white"} transition-all`} 
            />
            <span className="text-white text-xs mt-1">{currentReel.likes || 0}</span>
          </button>
          
          <button onClick={() => setShowComments(!showComments)} className="flex flex-col items-center">
            <MessageCircle size={32} className="text-white" />
            <span className="text-white text-xs mt-1">
              {Object.keys(currentReel.comments || {}).length}
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
            <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white">
              <ChevronLeft size={32} />
            </button>
            <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white">
              <ChevronRight size={32} />
            </button>
          </>
        )}

        {/* Progress */}
        <div className="absolute top-4 left-4 right-4 flex gap-1">
          {reels.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 flex-1 rounded-full ${i === currentIndex ? "bg-white" : "bg-white/30"}`}
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
              <h3 className="font-bold">{tr("Comments", "التعليقات")}</h3>
              <button onClick={() => setShowComments(false)}><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Object.entries(currentReel.comments || {}).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{tr("No comments yet", "لا توجد تعليقات")}</p>
              ) : (
                Object.entries(currentReel.comments || {}).map(([id, c]) => (
                  <div key={id} className="bg-muted rounded-xl p-3">
                    <p className="font-semibold text-sm">{c.userName}</p>
                    <p className="text-sm mt-1">{c.text}</p>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t flex gap-2">
              <input
                className="flex-1 px-4 py-2 rounded-xl bg-muted"
                placeholder={tr("Add a comment...", "أضف تعليق...")}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
              />
              <button onClick={handleComment} className="btn-primary px-4 rounded-xl">
                <Send size={18} />
              </button>
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
                  className="p-1"
                >
                  <Star 
                    size={40} 
                    className={`${(hoverRating || userRating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
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
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl text-white font-bold disabled:opacity-50"
            >
              {tr("Submit Rating", "إرسال التقييم")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
