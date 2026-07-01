import React, { useState } from "react";
import { Users, Search, Trash2, Calendar, Clock, Star, Phone, MapPin } from "lucide-react";

interface UsersTabProps {
  tr: (en: string, ar: string) => string;
  users: any[];
  deleteUser: (uid: string, name: string) => void;
  formatDuration: (seconds: number) => string;
}

export const UsersTab: React.FC<UsersTabProps> = ({ tr, users, deleteUser, formatDuration }) => {
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.uid?.includes(userSearch) ||
    u.tableNumber?.toString().includes(userSearch)
  );

  return (
    <div className="space-y-4 page-enter">
      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <Users size={20}/>
            </div>
            <div>
              <h3 className="font-bold text-foreground leading-tight">{tr("CRM & Client Directory","إدارة سجلات العملاء")}</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{users.length} {tr("Registered Profiles", "ملف مسجل")}</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={tr("Search by Name, Table, or ID...", "ابحث بالاسم، الطاولة أو المعرف...")}
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full px-4 py-3 pl-10 rounded-2xl bg-muted text-sm border-0 focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="space-y-4">
          {filteredUsers.map((u) => (
            <div key={u.uid} className="card rounded-[2rem] p-5 border border-border/40 hover:shadow-xl transition-all group bg-card/50">
              <div className="flex items-start gap-4">
                <div className="relative">
                   <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center text-primary-foreground text-2xl font-black shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                    {u.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg border-2 border-white shadow-sm">
                    T{u.tableNumber || "0"}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-black text-foreground text-base tracking-tight">{u.name || "Anonymous Guest"}</p>
                      <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{u.uid}</p>
                    </div>
                    <button
                      onClick={() => deleteUser(u.uid, u.name)}
                      className="w-8 h-8 rounded-full bg-destructive/5 text-destructive/30 hover:bg-destructive hover:text-white transition-all flex items-center justify-center"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {u.loginCount > 2 && (
                      <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Star size={8} fill="currentColor"/> Loyal Member
                      </span>
                    )}
                    {u.totalUsageSeconds > 3600 && (
                      <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Clock size={8}/> Power User
                      </span>
                    )}
                    {u.lastLoginAt && (Date.now() - u.lastLoginAt) < 24 * 3600 * 1000 && (
                      <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        Active Today
                      </span>
                    )}
                  </div>

                  {/* CRM Insight Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-5 pt-5 border-t border-dashed border-border/60">
                    <div className="flex items-center gap-2">
                       <Calendar size={12} className="text-primary/40"/>
                       <div>
                         <p className="text-[8px] font-black text-muted-foreground/60 uppercase">{tr("Joined","تاريخ الانضمام")}</p>
                         <p className="text-[11px] font-bold text-foreground/80">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Clock size={12} className="text-primary/40"/>
                       <div>
                         <p className="text-[8px] font-black text-muted-foreground/60 uppercase">{tr("Engagement","وقت البقاء")}</p>
                         <p className="text-[11px] font-bold text-foreground/80">{formatDuration(u.totalUsageSeconds || 0)}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Star size={12} className="text-primary/40"/>
                       <div>
                         <p className="text-[8px] font-black text-muted-foreground/60 uppercase">{tr("Visit Count","عدد الزيارات")}</p>
                         <p className="text-[11px] font-bold text-foreground/80">{u.loginCount || 0} {tr("Total Logins", "مرة دخول")}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <MapPin size={12} className="text-primary/40"/>
                       <div>
                         <p className="text-[8px] font-black text-muted-foreground/60 uppercase">{tr("Preferred Spot","الطاولة المفضلة")}</p>
                         <p className="text-[11px] font-bold text-foreground/80">Table {u.tableNumber || "N/A"}</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed border-muted">
              <Users size={40} className="mx-auto text-muted-foreground/30 mb-3"/>
              <p className="text-muted-foreground font-bold">{tr("No clients found matching criteria","لا يوجد عملاء يطابقون البحث")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
