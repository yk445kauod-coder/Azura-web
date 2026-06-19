import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { db, ref, push, set, onValue, off, update } from "@/lib/firebase";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";

interface ChatMsg {
  id: string;
  text: string;
  sender: "user" | "admin";
  createdAt: number;
  readByAdmin?: boolean;
}

export default function SupportChatWidget() {
  const { user, profile } = useAuth();
  const { lang, isRTL } = useLang();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  useEffect(() => {
    if (!user) return;
    const msgsRef = ref(db, `support-chat/${user.uid}/messages`);
    onValue(msgsRef, (snap) => {
      if (!snap.exists()) { setMsgs([]); return; }
      const data = snap.val() as Record<string, Omit<ChatMsg, "id">>;
      const list = Object.entries(data)
        .map(([id, m]) => ({ id, ...m }))
        .sort((a, b) => a.createdAt - b.createdAt);
      setMsgs(list);
      if (!open) {
        const adminUnread = list.filter((m) => m.sender === "admin" && !m.readByAdmin).length;
        setUnread(adminUnread);
      }
    });
    return () => off(ref(db, `support-chat/${user.uid}/messages`));
  }, [user, open]);

  useEffect(() => {
    if (open) { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); setUnread(0); }
  }, [msgs, open]);

  const ensureMeta = async () => {
    if (!user) return;
    const metaRef = ref(db, `support-chat/${user.uid}/meta`);
    await update(metaRef, {
      userName: profile?.name || "Guest",
      userEmail: profile?.email || "",
      userId: user.uid,
      tableNumber: profile?.tableNumber || "",
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

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed z-50 flex items-center justify-center rounded-full transition-all duration-200 ${open ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        style={{
          bottom: "6.5rem",
          [isRTL ? "left" : "right"]: "1rem",
          width: 48, height: 48,
          background: "hsl(var(--primary))",
          boxShadow: "var(--shadow-primary)",
        }}
      >
        <MessageCircle size={20} className="text-primary-foreground" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          className="fixed z-50 flex flex-col"
          style={{
            bottom: "5.5rem",
            [isRTL ? "left" : "right"]: "0.75rem",
            width: "min(360px, calc(100vw - 1.5rem))",
            maxHeight: "min(480px, 60dvh)",
            borderRadius: "1.25rem",
            background: "hsl(var(--card))",
            boxShadow: "var(--shadow-xl)",
            border: "1px solid rgba(93,62,35,0.08)",
          }}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0 rounded-t-[1.25rem]"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="font-bold text-sm">{tr("Support Chat", "دردشة الدعم")}</span>
            </div>
            <button onClick={() => setOpen(false)} className="opacity-80 hover:opacity-100">
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scroll-hide">
            {msgs.length === 0 && (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground">
                  {tr("Hi! How can we help you today?", "أهلاً! كيف يمكننا مساعدتك؟")}
                </p>
              </div>
            )}
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "user" ? (isRTL ? "justify-start" : "justify-end") : (isRTL ? "justify-end" : "justify-start")}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 text-sm rounded-2xl ${
                    m.sender === "user"
                      ? "bubble-user text-[13px]"
                      : "bubble-ai text-[13px]"
                  }`}
                >
                  {m.sender === "admin" && (
                    <p className="text-[10px] font-bold text-primary mb-0.5 opacity-70">{tr("Support", "الدعم")}</p>
                  )}
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 pb-3 pt-1 flex-shrink-0" style={{ borderTop: "1px solid rgba(93,62,35,0.07)" }}>
            <input
              className="flex-1 input-field px-3 py-2 text-sm"
              placeholder={tr("Type a message...", "اكتب رسالة...")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              dir={isRTL ? "rtl" : "ltr"}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="btn-icon w-9 h-9 flex-shrink-0 disabled:opacity-40"
              style={input.trim() ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", boxShadow: "var(--shadow-sm)" } : {}}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </>
  );
}
