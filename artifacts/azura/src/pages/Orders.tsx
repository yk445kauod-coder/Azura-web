import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { db, ref, onValue, off, push, set, update } from "@/lib/firebase";
import { Link } from "wouter";
import { Package, Star, X, Clock } from "lucide-react";

interface OrderItem {
  id: string; name: string; nameAr: string;
  price: number; quantity: number; subtotal: number;
}
interface Order {
  orderId: string; tableNumber: string; userId: string;
  items: OrderItem[]; notes: string; total: number;
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  createdAt: number;
}

const STATUS_META: Record<string, { en: string; ar: string; emoji: string; cls: string }> = {
  pending:   { en: "Pending",   ar: "في الانتظار", emoji: "⏳", cls: "status-pending"   },
  preparing: { en: "Preparing", ar: "يُحضَّر",      emoji: "👨‍🍳", cls: "status-preparing" },
  ready:     { en: "Ready! 🎉", ar: "جاهز! 🎉",    emoji: "✅", cls: "status-ready"     },
  delivered: { en: "Delivered", ar: "اتسلم",        emoji: "🎊", cls: "status-delivered" },
  cancelled: { en: "Cancelled", ar: "اتلغى",        emoji: "❌", cls: "status-cancelled" },
};

// Can cancel if order is pending and within 5 minutes
const canCancelOrder = (order: Order) => {
  if (order.status !== "pending") return false;
  const minutesPassed = (Date.now() - order.createdAt) / (1000 * 60);
  return minutesPassed <= 5;
};

function FeedbackModal({ orderId, onClose, lang, userName, userId }: { orderId: string; onClose: () => void; lang: "en" | "ar"; userName: string; userId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  const submit = async () => {
    if (!rating) return;
    setSubmitting(true);
    const r = push(ref(db, "feedback"));
    await set(r, { userId, userName, rating, comment, orderId, createdAt: Date.now(), read: false });
    setDone(true);
    setSubmitting(false);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bottom-sheet page-enter" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-primary text-lg" style={{ fontFamily: "var(--font-heading)" }}>
            {tr("Rate your experience", "قيّم تجربتك")}
          </h3>
          <button onClick={onClose} className="btn-icon w-8 h-8 text-muted-foreground"><X size={15} /></button>
        </div>
        {done ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-2">🙏</p>
            <p className="font-bold text-primary">{tr("Thank you!", "شكراً جزيلاً!")}</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-2 mb-4">
              {[1,2,3,4,5].map((s) => (
                <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setRating(s)}
                  className="text-4xl transition-transform hover:scale-110 active:scale-95"
                  style={{ color: s <= (hover || rating) ? "#F59E0B" : "#D1D5DB" }}>★</button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mb-3">
              {rating === 1 ? tr("Poor 😞","سيء 😞") : rating === 2 ? tr("Fair 😐","مقبول 😐") : rating === 3 ? tr("Good 🙂","جيد 🙂") : rating === 4 ? tr("Very Good 😊","جيد جداً 😊") : rating === 5 ? tr("Excellent! 🤩","ممتاز! 🤩") : tr("Tap a star","اختار نجمة")}
            </p>
            <textarea rows={3} className="input-field px-4 py-3 resize-none mb-4 text-sm"
              placeholder={tr("Any comments? (optional)", "أي تعليقات؟ (اختياري)")}
              value={comment} onChange={(e) => setComment(e.target.value)} />
            <button onClick={submit} disabled={!rating || submitting} className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-50">
              {submitting ? tr("Submitting…","جاري الإرسال…") : tr("Submit Feedback","إرسال التقييم")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Orders() {
  const { user, profile } = useAuth();
  const { lang, isRTL } = useLang();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackOrder, setFeedbackOrder] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  const cancelOrder = async (order: Order) => {
    if (!user) return;
    const minsLeft = Math.ceil(5 - (Date.now() - order.createdAt) / (1000 * 60));
    if (!confirm(tr(`Cancel this order? You have ${minsLeft} minute(s) left.`, `إلغاء الطلب؟ باقي ${minsLeft} دقيقة.`))) return;
    
    setCancelling(order.orderId);
    try {
      await update(ref(db, `orders/${user.uid}/${order.orderId}`), { status: "cancelled" });
    } catch (err) {
      console.error(err);
      alert(tr("Failed to cancel", "فشل في الإلغاء"));
    }
    setCancelling(null);
  };

  useEffect(() => {
    if (!user) return;
    // Read only THIS user's orders: /orders/{userId}
    const ordersRef = ref(db, `orders/${user.uid}`);
    onValue(ordersRef, (snap) => {
      if (!snap.exists()) { setLoading(false); setOrders([]); return; }
      const data = snap.val() as Record<string, Order>;
      const mine = Object.values(data)
        .filter((o) => o?.orderId)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 30);
      setOrders(mine);
      setLoading(false);
    });
    return () => off(ref(db, `orders/${user.uid}`));
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex gap-1.5">{[0,1,2].map((i) => <div key={i} className="w-2 h-2 rounded-full bg-primary dot-pulse" style={{ animationDelay: `${i*0.22}s` }} />)}</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-5 text-center page-enter" dir={isRTL ? "rtl" : "ltr"}>
        <Package size={56} className="text-muted-foreground/25 mb-4" />
        <h2 className="text-xl font-bold text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>{tr("No orders yet", "لا توجد طلبات")}</h2>
        <p className="text-sm text-muted-foreground mb-6">{tr("Your orders will appear here.", "طلباتك هتبان هنا.")}</p>
        <Link href="/menu"><button className="btn-primary px-8 py-3 rounded-xl text-sm">{tr("Browse Menu","تصفح القائمة")}</button></Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-bold text-primary mb-4" style={{ fontFamily: "var(--font-heading)" }}>{tr("My Orders","طلباتي")}</h1>
      <div className="space-y-3">
        {orders.map((order) => {
          const sm = STATUS_META[order.status];
          const cancelable = canCancelOrder(order);
          const minsLeft = cancelable ? Math.ceil(5 - (Date.now() - order.createdAt) / (1000 * 60)) : 0;
          return (
            <details key={order.orderId} className="card rounded-2xl overflow-hidden group">
              <summary className="p-4 flex items-center gap-3 cursor-pointer list-none select-none">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm text-foreground">#{order.orderId?.slice(-5)}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{tr("Table","طاولة")} {order.tableNumber}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={`badge px-2.5 py-1 flex-shrink-0 ${sm?.cls || ""}`}>
                  <span className="me-1">{sm?.emoji}</span>{lang === "ar" ? sm?.ar : sm?.en}
                </span>
              </summary>
              <div className="px-4 pb-4 pt-2 space-y-2" style={{ borderTop: "1px solid rgba(93,62,35,0.07)" }}>
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-foreground">{lang === "ar" ? (item.nameAr || item.name) : item.name} <span className="text-muted-foreground">× {item.quantity}</span></span>
                    <span className="font-semibold text-secondary">{item.subtotal} {tr("EGP","ج.م")}</span>
                  </div>
                ))}
                {order.notes && <p className="text-xs italic text-muted-foreground">📝 {order.notes}</p>}
                <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(93,62,35,0.07)" }}>
                  <span className="font-bold text-foreground">{tr("Total","الإجمالي")}: <span className="text-primary">{order.total} {tr("EGP","ج.م")}</span></span>
                  <div className="flex items-center gap-2">
                    {cancelable && (
                      <button 
                        onClick={() => cancelOrder(order)}
                        disabled={cancelling === order.orderId}
                        className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        <Clock size={12} />
                        {cancelling === order.orderId ? tr("Cancelling...","جاري الإلغاء...") : tr(`Cancel (${minsLeft}m)`,`إلغاء (${minsLeft}د)`)}
                      </button>
                    )}
                    {order.status === "delivered" && (
                      <button onClick={() => setFeedbackOrder(order.orderId)} className="flex items-center gap-1 text-xs font-bold text-yellow-600 hover:text-yellow-700 transition-colors">
                        <Star size={13} className="fill-yellow-400 text-yellow-400" /> {tr("Rate","قيّم")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </details>
          );
        })}
      </div>
      {feedbackOrder && (
        <FeedbackModal orderId={feedbackOrder} onClose={() => setFeedbackOrder(null)}
          lang={lang} userName={profile?.name || "Guest"} userId={user?.uid || ""} />
      )}
    </div>
  );
}
