import React, { useState } from "react";
import { Users, Search, Trash2 } from "lucide-react";

interface UsersTabProps {
  tr: (en: string, ar: string) => string;
  users: any[];
  deleteUser: (uid: string, name: string) => void;
  formatDuration: (seconds: number) => string;
}

export const UsersTab: React.FC<UsersTabProps> = ({ tr, users, deleteUser, formatDuration }) => {
  const [userSearch, setUserSearch] = useState("");

  return (
    <div className="space-y-4 page-enter">
      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Users size={18} className="text-primary"/> {tr("User Management","إدارة المستخدمين")}
          </h3>
          <span className="badge bg-primary/10 text-primary font-bold">{users.length}</span>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={tr("Search users...", "البحث عن مستخدمين...")}
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary/30"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="space-y-3">
          {users.filter(u =>
            !userSearch ||
            u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.uid?.includes(userSearch)
          ).map((u) => (
            <div key={u.uid} className="card rounded-2xl p-4 border border-border/50 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xl font-black shadow-lg">
                  {u.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-foreground">{u.name || "Unknown Name"}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Table {u.tableNumber || "N/A"}
                      </span>
                      <button onClick={() => deleteUser(u.uid, u.name)} className="p-1 text-destructive/50 hover:text-destructive transition-colors">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {u.loginCount > 1 && (
                      <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md font-bold uppercase">Returning User</span>
                    )}
                    {u.totalUsageSeconds > 1800 && (
                      <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md font-bold uppercase">Heavy User</span>
                    )}
                    <span className="text-[9px] text-muted-foreground/60 font-mono bg-muted/30 px-1 rounded truncate flex-1">{u.uid}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-border/40">
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{tr("Last Active","آخر نشاط")}</p>
                      <p className="text-xs font-semibold text-foreground">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{tr("Usage Time","وقت الاستخدام")}</p>
                      <p className="text-xs font-semibold text-foreground">{formatDuration(u.totalUsageSeconds || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{tr("Device ID","معرف الجهاز")}</p>
                      <p className="text-xs font-mono text-muted-foreground truncate" title={u.deviceId}>{u.deviceId || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{tr("Account Created","تاريخ التسجيل")}</p>
                      <p className="text-xs font-semibold text-foreground">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
