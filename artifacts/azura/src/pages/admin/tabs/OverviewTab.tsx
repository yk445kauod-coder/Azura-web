import React, { useState, useMemo } from "react";
import { LayoutDashboard, Users, MessageCircle, TrendingUp, Clock, Zap } from "lucide-react";

interface OverviewTabProps {
  tr: (en: string, ar: string) => string;
  users: any[];
  unreadChats: number;
  newReviewsCount: number;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ tr, users, unreadChats, newReviewsCount }) => {

  const stats = useMemo(() => {
    const now = Date.now();
    const thirtyMins = 30 * 60 * 1000;
    const activeNow = users.filter(u => u.lastLoginAt && (now - u.lastLoginAt) < thirtyMins).length;

    // CRM value: returning users
    const returning = users.filter(u => u.loginCount > 1).length;
    const returningRate = users.length ? Math.round((returning / users.length) * 100) : 0;

    return { activeNow, returningRate };
  }, [users]);

  return (
    <div className="space-y-4 page-enter">
      {/* KPI Section */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { emoji: "🔥", label: tr("Active Now","نشط الآن"), value: stats.activeNow, color: "text-orange-600" },
          { emoji: "🔄", label: tr("Retention Rate","معدل العودة"), value: `${stats.returningRate}%`, color: "text-blue-600" },
          { emoji: "💬", label: tr("Unread Messages","رسائل جديدة"), value: unreadChats, color: "text-green-600" },
          { emoji: "⭐", label: tr("New Reviews","تقييمات جديدة"), value: newReviewsCount, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="card-elevated rounded-2xl p-4 text-center transition-transform active:scale-95">
            <p className="text-2xl mb-1">{s.emoji}</p>
            <p className={`text-2xl font-black ${s.color} leading-tight`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* CRM Intelligence */}
      <div className="card-elevated rounded-2xl p-5 border border-primary/5">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-primary"/> {tr("Business Insights","رؤى العمل")}
        </h3>
        <div className="space-y-3">
           <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Users size={14}/></div>
               <p className="text-xs font-bold">{tr("Total CRM Records", "إجمالي سجلات العملاء")}</p>
             </div>
             <p className="text-sm font-black text-primary">{users.length}</p>
           </div>
           <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600"><Zap size={14}/></div>
               <p className="text-xs font-bold">{tr("High Value Clients", "عملاء مميزون")}</p>
             </div>
             <p className="text-sm font-black text-orange-600">{users.filter(u => u.loginCount >= 3).length}</p>
           </div>
        </div>
      </div>

      {/* Workspace Activity Feed */}
      <h2 className="font-bold text-sm text-foreground px-1">{tr("Live Workspace Activity","نشاط بيئة العمل المباشر")}</h2>
      <div className="space-y-2 pb-4">
        {users.slice(0, 10).map((u) => {
          const isActive = u.lastLoginAt && (Date.now() - u.lastLoginAt) < 30 * 60 * 1000;
          return (
            <div key={u.uid} className="card rounded-xl p-3 flex items-center gap-3 border border-border/40">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shadow-inner">
                  {u.name?.[0]?.toUpperCase() || "?"}
                </div>
                {isActive && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{u.name || "Guest"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">Table {u.tableNumber || "N/A"}</span>
                  <span className="text-[10px] text-muted-foreground/60 italic">{u.loginCount} {tr("visits", "زيارة")}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-primary">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "—"}
                </p>
                <p className="text-[9px] text-muted-foreground">{tr("Last Seen", "آخر ظهور")}</p>
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <div className="text-center py-12 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
             <Clock className="mx-auto text-muted mb-2" size={32}/>
             <p className="text-muted-foreground text-sm">{tr("No activity recorded yet","لا يوجد نشاط مسجل بعد")}</p>
          </div>
        )}
      </div>
    </div>
  );
};
