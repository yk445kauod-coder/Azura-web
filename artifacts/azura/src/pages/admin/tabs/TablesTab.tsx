import React from "react";
import { LayoutGrid, Plus, Armchair, X, Users } from "lucide-react";
import { smartSet, smartRemove } from "@/lib/dbWrapper";
import { swalSuccess, swalConfirm } from "@/lib/swal";

interface TablesTabProps {
  tr: (en: string, ar: string) => string;
  activeTables: any[];
  users: any[];
}

export const TablesTab: React.FC<TablesTabProps> = ({ tr, activeTables, users }) => {
  return (
    <div className="space-y-4 page-enter">
      <div className="card-elevated rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <LayoutGrid size={18} className="text-primary"/> {tr("Table Management","إدارة الطاولات")}
          </h3>
          <button
            onClick={async () => {
              const tableNum = prompt(tr("Enter table number:", "أدخل رقم الطاولة:"));
              if (tableNum && /^\d+$/.test(tableNum)) {
                await smartSet(`tables/table_${tableNum}`, {
                  number: parseInt(tableNum),
                  status: "available",
                  lastAssigned: null,
                });
                swalSuccess(tr("Table added", "تمت إضافة الطاولة"));
              }
            }}
            className="btn-primary px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Plus size={16}/> {tr("Add Table","إضافة طاولة")}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{tr("Manage cafe tables and track active users by table number.","إدارة طاولات المقهى وتتبع المستخدمين النشطين حسب رقم الطاولة.")}</p>
      </div>

      <div className="card-elevated rounded-2xl p-5 space-y-3">
        <h4 className="font-bold text-foreground flex items-center gap-2">
          <Armchair size={16} className="text-primary"/> {tr("Active Tables","الطاولات النشطة")}
        </h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {activeTables.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-6">{tr("No active tables","لا توجد طاولات نشطة")}</p>
          ) : (
            activeTables.map((t) => (
              <div key={t.id} className="relative">
                <div className={`rounded-xl p-3 text-center ${t.status === "occupied" ? "bg-green-100 border-2 border-green-500" : "bg-muted"}`}>
                  <Armchair size={24} className={`mx-auto mb-1 ${t.status === "occupied" ? "text-green-600" : "text-muted-foreground"}`} />
                  <p className="font-bold text-sm">{tr("Table", "طاولة")} {t.number}</p>
                  <p className="text-[10px] text-muted-foreground">{t.userCount || 0} {tr("users","مستخدمين")}</p>
                  {t.lastAt && (
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {t.status === "occupied" ? tr("Active","نشط") : new Date(t.lastAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                    </p>
                  )}
                </div>
                <button
                  onClick={async () => {
                    if (await swalConfirm(tr("Remove this table?", "إزالة هذه الطاولة؟"), tr("This will clear table data.","سيتم مسح بيانات الطاولة."), tr("Remove","إزالة"), tr("Cancel","إلغاء"))) {
                      await smartRemove(`tables/${t.id}`);
                    }
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card-elevated rounded-2xl p-5 space-y-3">
        <h4 className="font-bold text-foreground flex items-center gap-2">
          <Users size={16} className="text-primary"/> {tr("Users by Table","المستخدمين حسب الطاولة")}
        </h4>
        {users.filter(u => u.tableNumber).length === 0 ? (
          <p className="text-center text-muted-foreground py-6">{tr("No users assigned to tables","لا يوجد مستخدمين معينين لطاولات")}</p>
        ) : (
          <div className="space-y-2">
            {[...new Set(users.filter(u => u.tableNumber).map(u => u.tableNumber))].sort((a,b) => (a||0) - (b||0)).map(tn => (
              <div key={tn} className="card rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Armchair size={16} className="text-primary"/>
                  <span className="font-bold">{tr("Table", "طاولة")} {tn}</span>
                  <span className="text-xs text-muted-foreground">({users.filter(u => u.tableNumber === tn).length} {tr("users","مستخدمين")})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {users.filter(u => u.tableNumber === tn).map(u => (
                    <div key={u.uid} className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                        {u.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-xs font-medium truncate max-w-[100px]">{u.name || "Guest"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
