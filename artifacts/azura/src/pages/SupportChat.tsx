import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { db, ref, push, set, onValue, off, update } from "@/lib/firebase";
import { ArrowLeft, Send, Phone, Mail, Clock, MessageCircle } from "lucide-react";

interface ChatMsg {
  id: string;
  text: string;
  sender: "user" | "admin";
  createdAt: number;
  readByAdmin?: boolean;
}

export default function SupportChat() {
  const { user, profile } = useAuth();
  const { lang, isRTL } = useLang();
  const [, navigate] = useLocation();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  useEffect(() => {
    if (!user) return;
    
    // Check if admin is online
    const adminRef = ref(db, "admin-online");
    onValue(adminRef, (snap) => {
      setAdminOnline(snap.exists() && snap.val() === true);
    });

    // Load messages
    const msgsRef = ref(db, `support-chat/${user.uid}/messages`);
    const unsubscribe = onValue(msgsRef, (snap) => {
      if (!snap.exists()) { setMsgs([]); return; }
      const data = snap.val() as Record<string, Omit<ChatMsg, "id">>;
      const list = Object.entries(data)
        .map(([id, m]) => ({ id, ...m }))
        .sort((a, b) => a.createdAt - b.createdAt);
      setMsgs(list);
      
      // Mark admin messages as read
      list.forEach((m) => {
        if (m.sender === "admin" && !m.readByAdmin) {
          update(ref(db, `support-chat/${user.uid}/messages/${m.id}`), { readByAdmin: true });
        }
      });
    });

    return () => {
      unsubscribe();
      off(adminRef);
    };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const ensureMeta = async () => {
    if (!user) return;
    const metaRef = ref(db, `support-chat/${user.uid}/meta`);
    await update(metaRef, {
      userName: profile?.name || "Guest",
      userEmail: profile?.email || "",
      userId: user.uid,
      tableNumber: profile?.tableNumber || "",
      lastAt: Date.now(),
    });
  };

  const send = async () => {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    await ensureMeta();
    
    const msgRef = push(ref(db, `support-chat/${user.uid}/messages`));
    await set(msgRef, {
      text: input.trim(),
      sender: "user",
      createdAt: Date.now(),
      readByAdmin: false,
    });
    
    await update(ref(db, `support-chat/${user.uid}/meta`), {
      lastMessage: input.trim(),
      lastAt: Date.now(),
      unreadAdmin: (msgs.filter((m) => m.sender === "user").length + 1),
    });
    
    setInput("");
    setSending(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{tr("Please login to access support", "الرجاء تسجيل الدخول للوصول للدعم")}</p>
          <button onClick={() => navigate("/")} className="btn-primary">
            {tr("Go to Login", "الذهاب لتسجيل الدخول")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3" 
        style={{ background: "hsl(var(--primary))", boxShadow: "var(--shadow-md)" }}>
        <button onClick={() => navigate("/menu")} className="text-primary-foreground/70 hover:text-primary-foreground">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xl">💬</span>
            </div>
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${adminOnline ? "bg-green-400" : "bg-gray-400"}`}
              style={{ borderColor: "hsl(var(--primary))" }} />
          </div>
          <div>
            <p className="font-bold text-primary-foreground text-sm">{tr("Support Center", "مركز الدعم")}</p>
            <p className="text-[11px] text-primary-foreground/70">
              {adminOnline ? tr("Admin online", "المدير متصل") : tr("Leave a message", "اترك رسالة")}
            </p>
          </div>
        </div>
      </header>

      {/* Info Banner */}
      <div className="px-4 py-3" style={{ background: "hsl(var(--card))", borderBottom: "1px solid rgba(93,62,35,0.08)" }}>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>{tr("Response time: 5-15 min", "وقت الرد: 5-15 دقيقة")}</span>
          </div>
          {profile?.tableNumber && (
            <div className="flex items-center gap-1.5">
              <span>🪑</span>
              <span>Table {profile.tableNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background">
        {msgs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={32} className="text-primary" />
            </div>
            <h3 className="font-bold text-primary text-lg mb-2">{tr("Welcome to Support!", "أهلاً بك في الدعم!")}</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {tr("How can we help you today? Our team is ready to assist you with any questions about your order or the cafe.", 
                "كيف يمكننا مساعدتك اليوم؟ فريقنا مستعد لمساعدتك في أي أسئلة عن طلبك أو المقهى.")}
            </p>
          </div>
        )}

        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "user" ? (isRTL ? "justify-start" : "justify-end") : (isRTL ? "justify-end" : "justify-start")}`}>
            <div className={`max-w-[85%] ${m.sender === "admin" ? "order-2" : ""}`}>
              <div className={`px-4 py-3 rounded-2xl ${
                m.sender === "user" 
                  ? "bg-primary text-primary-foreground rounded-br-md" 
                  : "bg-card border border-primary/20 rounded-bl-md"
              }`}>
                {m.sender === "admin" && (
                  <p className="text-[10px] font-bold text-primary mb-1 opacity-70">💬 Support Team</p>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                <p className={`text-[10px] mt-1.5 ${m.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        <div ref={bottomRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto scroll-hide" style={{ borderTop: "1px solid rgba(93,62,35,0.08)" }}>
        {[
          { emoji: "❓", label: "Question", ar: "سؤال" },
          { emoji: "📋", label: "Order Issue", ar: "مشكلة في الطلب" },
          { emoji: "💡", label: "Suggestion", ar: "اقتراح" },
        ].map((q) => (
          <button 
            key={q.label}
            onClick={() => setInput(`I'd like to ask about: ${q.label}`)}
            className="chip chip-inactive flex-shrink-0 text-xs"
          >
            <span>{q.emoji}</span>
            {q.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 bg-background" style={{ borderTop: "1px solid rgba(93,62,35,0.08)" }}>
        <div className="card rounded-2xl flex items-end gap-2 p-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target;
              requestAnimationFrame(() => {
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
              });
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={tr("Type your message...", "اكتب رسالتك...")}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none min-h-[36px] py-2 px-2"
            dir={isRTL ? "rtl" : "ltr"}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              input.trim() && !sending ? "" : "opacity-40"
            }`}
            style={input.trim() && !sending ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } : { background: "hsl(var(--muted))" }}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          {tr("Press Enter to send, Shift+Enter for new line", "اضغط Enter للإرسال، Shift+Enter لسطر جديد")}
        </p>
      </div>
    </div>
  );
}