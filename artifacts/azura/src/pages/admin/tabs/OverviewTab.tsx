import React from "react";
import { LayoutDashboard, Users, MessageCircle } from "lucide-react";

interface OverviewTabProps {
  tr: (en: string, ar: string) => string;
  users: any[];
  unreadChats: number;
  newReviewsCount: number;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ tr, users, unreadChats, newReviewsCount }) => {
  return (
    <div className="space-y-4 page-enter">
      <div className="grid grid-cols-2 gap-3">
        {[
          { emoji: "👥", label: tr("Total Users","إجمالي المستخدمين"), value: users.length },
          { emoji: "💬", label: tr("Unread Messages","رسائل جديدة"), value: unreadChats },
          { emoji: "⭐", label: tr("New Reviews","تقييمات جديدة"), value: newReviewsCount },
        ].map((s) => (
          <div key={s.label} className="card-elevated rounded-2xl p-4 text-center">
            <p className="text-2xl mb-1">{s.emoji}</p>
            <p className="text-2xl font-extrabold text-primary leading-tight">{s.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <h2 className="font-bold text-sm text-foreground">{tr("Recent User Activity","نشاط المستخدمين الأخير")}</h2>
      <div className="space-y-2">
        {users.slice(0, 8).map((u) => (
          <div key={u.uid} className="card rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {u.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{u.name || "Unknown Name"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {u.loginCount || 0} logins · Table {u.tableNumber || "N/A"}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "—"}
            </span>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">{tr("No users yet","لا يوجد مستخدمين بعد")}</p>
        )}
      </div>
    </div>
  );
};
