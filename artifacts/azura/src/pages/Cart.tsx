import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { db, ref, push, set } from "@/lib/firebase";
import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingBag, CheckCircle, Table } from "lucide-react";

export default function Cart() {
  const { items, notes, totalPrice, removeItem, setQty, setNotes, clearCart } = useCart();
  const { lang, isRTL } = useLang();
  const { user, profile, tableNumber, setTableNumber } = useAuth();
  const [, navigate] = useLocation();

  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [tableInput, setTableInput] = useState(profile?.tableNumber || tableNumber || "");
  const [tableError, setTableError] = useState("");

  const effectiveTable = profile?.tableNumber || tableNumber || tableInput;
  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  const handlePlaceOrder = async () => {
    if (!user || items.length === 0) return;

    const table = effectiveTable.trim();
    if (!table) { setTableError(tr("Please enter your table number", "دخّل رقم الطاولة")); return; }
    const n = parseInt(table);
    if (isNaN(n) || n < 1 || n > 99) { setTableError(tr("Invalid table (1-99)", "رقم طاولة غير صحيح (1-99)")); return; }
    setTableError("");
    if (!profile?.tableNumber && !tableNumber) setTableNumber(table);

    setPlacing(true);
    try {
      // Orders stored per-user: /orders/{userId}/{orderId}
      const orderRef = push(ref(db, `orders/${user.uid}`));
      const order = {
        orderId: orderRef.key,
        userId: user.uid,
        userName: profile?.name || "Guest",
        tableNumber: table,
        items: items.map((i) => ({
          id: i.id, name: i.name, nameAr: i.nameAr,
          price: i.price, quantity: i.quantity, subtotal: i.price * i.quantity,
        })),
        notes, total: totalPrice, status: "pending", createdAt: Date.now(),
      };
      await set(orderRef, order);

      if (!user.isAnonymous) {
        const notifRef = push(ref(db, `notifications/${user.uid}`));
        await set(notifRef, {
          message: `Order #${orderRef.key?.slice(-6)} placed! Total: ${totalPrice} EGP`,
          messageAr: `تم تسجيل طلبك #${orderRef.key?.slice(-6)}! الإجمالي: ${totalPrice} ج.م`,
          read: false, createdAt: Date.now(), type: "order",
        });
      }

      setOrderId(orderRef.key?.slice(-6) || "");
      clearCart();
      setPlaced(true);
    } catch {
      alert(tr("Error placing order. Please try again.", "حدث خطأ، حاول مجدداً"));
    }
    setPlacing(false);
  };

  if (placed) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-5 text-center page-enter" dir={isRTL ? "rtl" : "ltr"}>
        <div className="card-elevated rounded-3xl p-8 max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            {tr("Order Placed! 🎉", "الطلب اتبعت! 🎉")}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{tr("We'll have it ready shortly.", "هنجهزه في أقرب وقت.")}</p>
          {orderId && (
            <div className="rounded-xl px-4 py-2 mb-5 inline-block" style={{ background: "hsl(var(--muted))" }}>
              <span className="font-bold text-primary">{tr("Order #", "طلب #")}{orderId}</span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button onClick={() => navigate("/orders")} className="btn-primary w-full py-3 rounded-xl text-sm">
              {tr("Track Order", "تتبع الطلب")}
            </button>
            <button onClick={() => { setPlaced(false); navigate("/menu"); }} className="btn-secondary w-full py-3 rounded-xl text-sm">
              {tr("Continue Browsing", "تصفح المزيد")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-5 text-center page-enter" dir={isRTL ? "rtl" : "ltr"}>
        <ShoppingBag size={64} className="text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold text-primary mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          {tr("Your cart is empty", "السلة فارغة")}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">{tr("Add some delicious items from the menu!", "أضف حاجات زاكية من القائمة!")}</p>
        <Link href="/menu"><button className="btn-primary px-8 py-3 rounded-xl text-sm">{tr("Browse Menu", "تصفح القائمة")}</button></Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto pb-8" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="text-2xl font-bold text-primary mb-4" style={{ fontFamily: "var(--font-heading)" }}>{tr("Your Cart", "سلتك")}</h1>

      <div className="card rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Table size={16} className="text-secondary" />
          <span className="font-semibold text-sm text-foreground">{tr("Table Number", "رقم الطاولة")}</span>
          <span className="text-xs text-destructive font-bold">*</span>
        </div>
        {profile?.tableNumber || tableNumber ? (
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-primary">{effectiveTable}</span>
            <span className="text-xs text-muted-foreground">{tr("Your table", "طاولتك")}</span>
          </div>
        ) : (
          <>
            <input type="number" min={1} max={99}
              placeholder={tr("Enter table number (1–99)", "رقم الطاولة (1-99)")}
              value={tableInput}
              onChange={(e) => { setTableInput(e.target.value); setTableError(""); }}
              className="input-field px-4 py-2.5 text-lg font-bold text-primary"
            />
            {tableError && <p className="text-destructive text-xs mt-1.5 font-medium">{tableError}</p>}
          </>
        )}
      </div>

      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.id} className="card rounded-2xl p-3 flex items-center gap-3">
            <img src={item.image || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100&q=60"}
              alt={lang === "ar" ? item.nameAr : item.name}
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100&q=60"; }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground leading-tight truncate">{lang === "ar" ? (item.nameAr || item.name) : item.name}</p>
              <p className="text-xs font-bold text-secondary">{item.price} {lang === "ar" ? "ج.م" : "EGP"}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => setQty(item.id, item.quantity - 1)} className="btn-icon w-7 h-7 text-muted-foreground"><Minus size={12} /></button>
              <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
              <button onClick={() => setQty(item.id, item.quantity + 1)} className="btn-icon w-7 h-7 text-primary"><Plus size={12} /></button>
              <button onClick={() => removeItem(item.id)} className="btn-icon w-7 h-7 text-destructive/70 hover:text-destructive ms-1"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <label className="text-sm font-semibold text-foreground mb-1.5 block">{tr("Special Notes", "ملاحظات خاصة")}</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder={tr("Any allergies or special requests...", "أي حساسية أو طلبات خاصة...")}
          className="input-field px-4 py-3 resize-none"
        />
      </div>

      <div className="card rounded-2xl px-4 py-3.5 mb-4 flex justify-between items-center">
        <span className="font-bold text-foreground">{tr("Total", "الإجمالي")}</span>
        <span className="font-extrabold text-primary text-xl">{totalPrice} <span className="text-sm font-normal text-secondary">{lang === "ar" ? "ج.م" : "EGP"}</span></span>
      </div>

      <button onClick={handlePlaceOrder} disabled={placing} className="btn-primary w-full py-4 rounded-xl text-base font-bold">
        {placing ? tr("Placing order…", "جاري الإرسال…") : tr("Place Order 🎉", "اتطلب دلوقتي 🎉")}
      </button>
    </div>
  );
}
