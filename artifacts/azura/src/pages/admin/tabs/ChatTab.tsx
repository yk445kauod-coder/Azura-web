import React from "react";
import { MessageCircle, ArrowLeft, Send, Trash2 } from "lucide-react";
import { ChatSession, ChatMsg } from "../types";

interface ChatTabProps {
  tr: (en: string, ar: string) => string;
  isRTL: boolean;
  selectedChat: string | null;
  setSelectedChat: (id: string | null) => void;
  chats: ChatSession[];
  chatMsgs: ChatMsg[];
  chatInput: string;
  setChatInput: (v: string) => void;
  sendReply: () => void;
  deleteChat: (uid: string, name: string) => void;
  chatBottomRef: React.RefObject<HTMLDivElement>;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  tr, isRTL, selectedChat, setSelectedChat, chats, chatMsgs, chatInput, setChatInput, sendReply, deleteChat, chatBottomRef
}) => {
  return (
    <div className="page-enter">
      {selectedChat ? (
        <div className="flex flex-col h-[calc(100dvh-12rem)]">
          <button onClick={() => setSelectedChat(null)} className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-3">
            <ArrowLeft size={14}/> {tr("All Chats","كل الدردشات")}
          </button>
          <div className="card rounded-2xl overflow-hidden flex flex-col flex-1">
            <div className="px-4 py-2.5 flex-shrink-0" style={{ background: "hsl(var(--muted))", borderBottom: "1px solid hsl(var(--border))" }}>
              <p className="font-bold text-sm text-primary">{chats.find((c) => c.uid === selectedChat)?.userName || "Guest"}</p>
              <p className="text-[10px] text-muted-foreground">{tr("Support session","جلسة دعم")}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scroll-hide">
              {chatMsgs.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">{tr("No messages yet","لا توجد رسائل")}</p>}
              {chatMsgs.map((m) => (
                <div key={m.id} className={`flex ${m.sender==="user"?(isRTL?"justify-end":"justify-start"):(isRTL?"justify-start":"justify-end")}`}>
                  <div className={`max-w-[78%] px-3 py-2 text-sm rounded-xl ${m.sender==="user"?"bg-muted text-foreground":"bubble-user"}`}>
                    {m.sender!=="user" && <p className="text-[9px] font-bold text-primary-foreground/70 mb-0.5">{tr("You (Admin)","أنت (مدير)")}</p>}
                    {m.text}
                    <p className="text-[9px] opacity-50 mt-0.5">{new Date(m.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</p>
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef}/>
            </div>
            <div className="flex items-center gap-2 p-3 flex-shrink-0" style={{ borderTop: "1px solid hsl(var(--border))" }}>
              <input className="flex-1 input-field px-3 py-2 text-sm" placeholder={tr("Reply…","رد…")} value={chatInput}
                onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key==="Enter" && sendReply()} dir={isRTL?"rtl":"ltr"}/>
              <button onClick={sendReply} disabled={!chatInput.trim()} className="btn-icon w-9 h-9 disabled:opacity-40"
                style={chatInput.trim()?{background:"hsl(var(--primary))",color:"hsl(var(--primary-foreground))"}:{}}>
                <Send size={14}/>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.length === 0 && (
            <div className="text-center py-14">
              <MessageCircle size={44} className="mx-auto text-muted-foreground/25 mb-2"/>
              <p className="text-muted-foreground text-sm">{tr("No support chats yet","لا يوجد محادثات دعم")}</p>
            </div>
          )}
          {chats.map((c) => (
            <div key={c.uid} className="card rounded-xl p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
              <button onClick={() => setSelectedChat(c.uid)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                  {c.userName?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{c.userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <p className="text-[10px] text-muted-foreground">{c.lastAt ? new Date(c.lastAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : ""}</p>
                  {c.unreadAdmin > 0 && <span className="badge px-1.5 py-0.5 bg-red-500 text-white text-[9px]">{c.unreadAdmin}</span>}
                </div>
              </button>
              <button
                onClick={() => deleteChat(c.uid, c.userName)}
                className="p-2 text-destructive/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0"
                title={tr("Delete Chat", "حذف المحادثة")}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
