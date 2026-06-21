import { useCart } from "@/contexts/CartContext";
import { useLang } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { items, notes, totalPrice, removeItem, setQty, setNotes } = useCart();
  const { lang, isRTL } = useLang();
  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

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

      <div className="card rounded-2xl px-4 py-3.5 flex justify-between items-center">
        <span className="font-bold text-foreground">{tr("Total", "الإجمالي")}</span>
        <span className="font-extrabold text-primary text-xl">{totalPrice} <span className="text-sm font-normal text-secondary">{lang === "ar" ? "ج.م" : "EGP"}</span></span>
      </div>
    </div>
  );
}
