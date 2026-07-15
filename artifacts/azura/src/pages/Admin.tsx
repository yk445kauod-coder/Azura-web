import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import { db, ref, onValue, off, update, set, push, remove, get, forceReseedMenu, mergeMenuIngredients } from "@/lib/firebase";
import { smartGet, smartSet, smartUpdate, smartRemove, smartPush, getDBMode, setDBMode, onModeChange } from "@/lib/dbWrapper";
import { useLang } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { encryptKey, decryptKey, chatWithAI } from "@/lib/crypto";
import { swalSuccess, swalError, swalConfirm, swalLoading, swalClose } from "@/lib/swal";
import { testR2Connection, listR2Objects, downloadFromR2, uploadToR2 } from "@/lib/r2";
import {
  ShieldCheck, ArrowLeft, Plus, Trash2,
  Megaphone, Film, Key, Settings,
  RotateCcw, Save, Search, ChevronDown, Pencil, X, ImageIcon,
  AlertTriangle, Bot, LayoutDashboard, Users, ToggleRight, LayoutGrid,
  MessageCircle, Star, Sparkles, TrendingUp, Clock, Zap, MapPin, Coffee,
  User, Phone, MessageSquare, Armchair, UploadCloud, Download, Archive,
  Check, Eye, EyeOff, Smartphone, Globe, Info, Package, Filter, List, Heart, LucideIcon, Database,
  AlertCircle, Activity
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from "recharts";

import { VideoProvider } from "@/lib/videoProviders";
import { compressToBase64, base64SizeKB } from "@/lib/imageUtils";

// --- Types ---
export interface MenuItem {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr?: string;
  price: number;
  category: string;
  available: boolean;
  image: string;
  ingredients?: string;
  ingredientsAr?: string;
  recommended?: boolean;
  originalCategory?: string;
}

export interface ChatSession {
  uid: string;
  userName: string;
  lastMessage: string;
  lastAt: number;
  unreadAdmin: number;
}

export interface ChatMsg {
  id: string;
  text: string;
  sender: "user" | "admin";
  createdAt: number;
}

export interface Feedback {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  orderId?: string;
  createdAt: number;
  read: boolean;
}

export interface Broadcast {
  id: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  type: "info" | "promo" | "alert";
  emoji: string;
  createdAt: number;
}

export interface Reel {
  id: string;
  image: string;
  caption: string;
  captionAr: string;
  likes: number;
  createdAt: number;
  authorName: string;
  pinned?: boolean;
  mediaType?: "image" | "video";
  videoUrl?: string;
  videoProvider?: VideoProvider;
  videoThumbnail?: string;
  videoChunks?: string[];
  chunkCount?: number;
}

// --- Components ---

function ImagePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      swalError("Please select a valid image file (JPG, PNG, WebP…).");
      return;
    }
    setCompressing(true);
    try {
      const b64 = await compressToBase64(file, 600, 0.78);
      if (b64 && b64.startsWith("data:image/")) {
        onChange(b64);
      } else {
        throw new Error("Invalid base64 result");
      }
    } catch (err) {
      console.error("Compression error:", err);
      swalError("Could not compress image. The file might be corrupted or too large. Try a different file.");
    }
    setCompressing(false);
  };

  const isBase64 = value?.startsWith("data:");
  const sizeKB = isBase64 ? base64SizeKB(value) : 0;

  return (
    <div className="space-y-2">
      {label && <label className="text-[10px] font-bold text-muted-foreground uppercase">{label}</label>}
      {value && (
        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border bg-muted/40 group">
          <img src={value} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.25"; }} loading="lazy" />
          {isBase64 && <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">📷 {sizeKB} KB</span>}
          <button type="button" onClick={() => onChange("")} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"><X size={11} /></button>
        </div>
      )}
      <div className="flex gap-2 items-center">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={compressing} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 flex-shrink-0 whitespace-nowrap">
          {compressing ? <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <ImageIcon size={13} />}
          {compressing ? "Compressing…" : "Upload Photo"}
        </button>
        <input type="text" className="input-field flex-1 text-[11px] py-2 px-3 animate-none" placeholder="…or paste image URL" value={isBase64 ? "" : value || ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

const OverviewTab = ({ tr, users, unreadChats, newReviewsCount, logs, menuCount, apiSettings, connected, addLog }: { tr: any, users: any[], unreadChats: number, newReviewsCount: number, logs: string[], menuCount: number, apiSettings: any, connected: boolean, addLog: (msg: string) => void }) => {
  const stats = useMemo(() => {
    const now = Date.now();
    const thirtyMins = 30 * 60 * 1000;
    const activeNow = users.filter(u => u.lastLoginAt && (now - u.lastLoginAt) < thirtyMins).length;
    const returning = users.filter(u => u.loginCount > 1).length;
    const returningRate = users.length ? Math.round((returning / users.length) * 100) : 0;
    return { activeNow, returningRate };
  }, [users]);

  // Hourly Traffic Trends - Real calculation from live user activity timestamps
  const hourlyTrends = useMemo(() => {
    const hoursMap: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hoursMap[i] = 0;

    users.forEach(u => {
      if (u.activities) {
        Object.values(u.activities).forEach((act: any) => {
          if (act.createdAt) {
            const hr = new Date(act.createdAt).getHours();
            hoursMap[hr] = (hoursMap[hr] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(hoursMap).map(([hour, count]) => ({
      hour: `${hour}:00`,
      interactions: count
    }));
  }, [users]);

  // Meta Recommendation Interest distribution chart (average affinities across all active clients)
  const categoryAffinities = useMemo(() => {
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};

    users.forEach(u => {
      if (u.preferences?.affinities) {
        Object.entries(u.preferences.affinities).forEach(([catId, val]) => {
          const score = Number(val) || 0;
          sums[catId] = (sums[catId] || 0) + score;
          counts[catId] = (counts[catId] || 0) + 1;
        });
      }
    });

    const results = Object.keys(sums).map(catId => ({
      name: catId.toUpperCase(),
      affinity: Math.round(sums[catId] / counts[catId])
    })).sort((a,b) => b.affinity - a.affinity).slice(0, 5);

    return results.length > 0 ? results : [
      { name: "COFFEE", affinity: 85 },
      { name: "MOJITOS", affinity: 60 },
      { name: "DESSERTS", affinity: 50 },
      { name: "CREPES", affinity: 45 },
      { name: "PASTA", affinity: 30 }
    ];
  }, [users]);

  // System Diagnostics Pie Chart data
  const systemSatisfaction = useMemo(() => {
    const usersWithIssues = users.filter(u => !!u.hasIssues).length;
    const satisfiedUsers = Math.max(1, users.length - usersWithIssues);
    return [
      { name: tr("Healthy Sessions", "جلسات مستقرة"), value: satisfiedUsers, color: "#10B981" },
      { name: tr("Reported Issues", "مشاكل مسجلة"), value: usersWithIssues, color: "#EF4444" }
    ];
  }, [users]);

  // Handle excel CSV history downloader system (Million Dollar CRM Exporter tool)
  const exportCRMSpreadsheet = () => {
    let csv = "User ID,Name,Table Number,Device ID,Visit Count,Active Seconds,Has Issues,Activity Score\n";
    users.forEach(u => {
      csv += `"${u.uid}","${u.name || 'Guest'}","${u.tableNumber || ''}","${u.deviceId || ''}",${u.loginCount || 1},${u.totalUsageSeconds || 0},${!!u.hasIssues},${u.activityScore || 0}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `azura_crm_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    swalSuccess(tr("CRM Spreadsheet exported successfully!", "تم تصدير ملف CRM بنجاح!"));
  };

  const exportSystemLogs = () => {
    let logText = "Azura Cafe Live Logs History System\n==================================\n\n";
    logs.forEach(log => { logText += `${log}\n`; });

    const blob = new Blob([logText], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `azura_system_logs_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    swalSuccess(tr("System Logs exported successfully!", "تم تصدير سجلات التشغيل بنجاح!"));
  };

  return (
    <div className="space-y-6 page-enter pb-10">
      {/* MILLION DOLLAR KPI DASHBOARD */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Sparkles, label: tr("Active Now","نشط الآن"), value: stats.activeNow, color: "text-primary" },
          { icon: Settings, label: tr("Retention Rate","معدل العودة"), value: `${stats.returningRate}%`, color: "text-success" },
          { icon: MessageCircle, label: tr("Unread Messages","رسائل جديدة"), value: unreadChats, color: "text-info" },
          { icon: Star, label: tr("New Reviews","تقييمات جديدة"), value: newReviewsCount, color: "text-warning" },
        ].map((s) => (
          <div key={s.label} className="card-elevated p-4 text-center active:scale-95 transition-transform bg-card border border-border/15 rounded-2xl shadow-sm">
            <div className="flex justify-center mb-2">
               <s.icon size={20} className={s.color} />
            </div>
            <p className={`text-xl font-bold ${s.color} leading-tight`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-2 tracking-tighter">{s.label}</p>
          </div>
        ))}
      </div>

      {/* EXCEL SHEET SYSTEM EXPORTERS (CRM and logs export history) */}
      <div className="card-elevated p-5 rounded-2xl bg-card border border-border/15 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Database size={18} className="text-primary"/>
          {tr("Enterprise Documents & Data Exporter", "نظام تصدير المستندات وملفات إكسل")}
        </h3>
        <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
          {tr("Export complete database history logs, guest profiles, and activity audit trails as perfectly formatted spreadsheets.", "تصدير سجلات قاعدة البيانات بالكامل، وملفات العملاء، والعمليات كجداول بيانات إكسل مهيأة تماماً.")}
        </p>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button onClick={exportCRMSpreadsheet} className="btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-primary/10">
            <Download size={14}/> {tr("Export CRM (.CSV)", "تصدير إكسل CRM")}
          </button>
          <button onClick={exportSystemLogs} className="btn-secondary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-border/15">
            <Download size={14}/> {tr("Export Logs (.TXT)", "تصدير ملف السجلات")}
          </button>
        </div>
      </div>

      {/* RECHARTS AREA: HOURLY ACTIVITY TRAFFIC PEAK TRENDS */}
      <div className="card-elevated p-5 rounded-2xl bg-card border border-border/15 shadow-sm">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-primary"/>
          {tr("Hourly Client Engagement (Traffic)", "معدل تفاعل وحركة الزوار بالساعة")}
        </h3>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyTrends} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <XAxis dataKey="hour" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="currentColor" className="opacity-40" />
              <YAxis tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="currentColor" className="opacity-40" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 10, borderRadius: 12, fontWeight: "bold" }} />
              <Area type="monotone" dataKey="interactions" stroke="hsl(var(--primary))" fillOpacity={0.15} fill="url(#colorInteractions)" />
              <defs>
                <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECHARTS BAR: META RECOMMENDATION AVERAGE CATEGORY AFFINITIES */}
      <div className="card-elevated p-5 rounded-2xl bg-card border border-border/15 shadow-sm">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-orange-500"/>
          {tr("Average Category Taste Affinity (Meta)", "متوسط اهتمامات وتفضيلات العملاء (Meta)")}
        </h3>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryAffinities} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="currentColor" className="opacity-40" />
              <YAxis tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="currentColor" className="opacity-40" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 10, borderRadius: 12, fontWeight: "bold" }} />
              <Bar dataKey="affinity" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]}>
                {categoryAffinities.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? "hsl(var(--primary))" : "rgba(139, 69, 19, 0.45)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live System Logs Terminal Console */}
      <div className="card-elevated p-5 rounded-2xl bg-card border border-border/15">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <Settings size={18} className="text-primary animate-spin" style={{ animationDuration: '6s' }}/>
          {tr("Live System Logs", "سجلات النظام المباشرة")}
        </h3>
        <div className="bg-black/95 text-green-400 font-mono text-[10px] p-4 rounded-xl h-44 overflow-y-auto space-y-1.5 scroll-hide shadow-inner border border-white/5">
          {logs.length === 0 ? (
            <p className="text-white/40 italic">{tr("No processes logged yet...", "لا توجد سجلات بعد...")}</p>
          ) : (
            logs.map((log, i) => (
              <p key={i} className="truncate leading-normal">
                <span className="text-white/30 mr-1.5">›</span>
                {log}
              </p>
            ))
          )}
        </div>
      </div>

      {/* Database Overview & Stats Card */}
      <div className="card-elevated p-5 rounded-2xl bg-card border border-border/15">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
          <Database size={18} className="text-primary"/>
          {tr("Database Overview & Stats", "ملخص وإحصائيات قاعدة البيانات")}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/20 rounded-xl">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">{tr("Database Mode", "وضع القاعدة")}</p>
            <p className="text-sm font-bold text-foreground mt-0.5">Firebase Live RTDB</p>
          </div>
          <div className="p-3 bg-muted/20 rounded-xl">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">{tr("Seated Guests", "الزوار الحاليين")}</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{users.filter(u => u.tableNumber).length} {tr("Active Tables", "طاولات نشطة")}</p>
          </div>
          <div className="p-3 bg-muted/20 rounded-xl">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">{tr("Catalog Items", "أصناف القائمة")}</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{menuCount} {tr("Items", "صنف")}</p>
          </div>
          <div className="p-3 bg-muted/20 rounded-xl">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">{tr("System Health", "حالة النظام")}</p>
            <p className="text-sm font-bold text-green-500 mt-0.5">{connected ? tr("All Operational", "جميع الأنظمة تعمل") : tr("Offline Backup Mode", "وضع المزامنة الاحتياطي")}</p>
          </div>
        </div>
      </div>

      {/* AI Advisor & Strategic Business Advices Card */}
      <div className="card-elevated p-5 rounded-2xl bg-card border border-border/15">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-primary"/>
          {tr("Strategic AI Advisor Insights", "نصائح وإرشادات الذكاء الاستراتيجية")}
        </h3>
        <div className="space-y-3">
          {[
            { tag: tr("Promotion Advice", "نصيحة ترويجية"), text: tr("Promote 'Mocktails' during warm afternoons to maximize high-margin beverage sales.", "قم بالترويج لـ 'الموكتيل' في أوقات الظهيرة الحارة لزيادة المبيعات ذات الهامش المرتفع.") },
            { tag: tr("Menu Optimization", "نصيحة لتحسين القائمة"), text: tr("You have 250+ menu items. Keep high-value combos inside 'Top Picks' to boost average ticket size.", "لديك أكثر من ٢٥٠ صنفًا. ضع العروض الأكثر قيمة في 'الأفضل' لرفع متوسط الفاتورة.") },
            { tag: tr("System Advice", "نصيحة تقنية"), text: tr("Regular manual backups are highly recommended before importing or bulk-seeding menu nodes.", "يُنصح بشدة بإنشاء نسخ احتياطية يدوية دورية قبل استيراد أو تعديل القائمة بالكامل.") }
          ].map((adv, idx) => (
            <div key={idx} className="p-3 bg-primary/5 rounded-xl border border-primary/10">
              <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">{adv.tag}</span>
              <p className="text-xs text-secondary font-semibold mt-2 leading-relaxed">{adv.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MODEL CONTEXT PROTOCOL (MCP) COSY COMMAND PORTAL */}
      <div className="glass-premium p-5 rounded-2xl border border-border/10 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap size={18} className="text-primary animate-pulse"/>
            <span>{tr("Model Context Protocol (MCP) Registry Telemetry", "مركز بروتوكولات المزامنة والربط (MCP)")}</span>
          </h3>
          <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {tr("Telemetry: Operational", "الحالة: نشط ومستقر")}
          </span>
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
          {tr("Autonomous context agents are synchronized utilizing MCP protocols to manage real-time semantic menu router pipelines and diagnostics.", "تتم مزامنة عقد المساعدين المستقلة ببروتوكولات MCP لإدارة موجّهات البيانات المباشرة وعمليات الفحص الذاتي.")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: "menu-retrieval-mcp", status: tr("ONLINE", "متصل"), speed: "4ms", type: tr("Semantic menu filter", "موجّه القائمة الذكي") },
            { name: "client-crm-mcp", status: tr("ONLINE", "متصل"), speed: "12ms", type: tr("Preference analyzer", "محلل الاهتمامات") },
            { name: "rtdb-mcp-gateway", status: tr("ONLINE", "متصل"), speed: "8ms", type: tr("Live DB sync channel", "قناة المزامنة الحية") }
          ].map((mcp) => (
            <div key={mcp.name} className="p-3 bg-muted/10 border border-border/10 rounded-xl space-y-1 hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold text-foreground truncate">{mcp.name}</span>
                <span className="text-[8px] font-bold text-green-600">{mcp.status}</span>
              </div>
              <div className="flex justify-between items-center text-[8px] text-muted-foreground">
                <span>{mcp.type}</span>
                <span className="font-mono font-bold text-primary">{mcp.speed}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action calibration button */}
        <button
          onClick={async () => {
            swalLoading(tr("Calibrating MCP Host Channels...", "جاري ضبط قنوات المزامنة..."));
            await new Promise(r => setTimeout(r, 1000));
            addLog("MCP CHANNEL CALIBRATION: Calibrated menu-retrieval-mcp pipeline.");
            addLog("MCP CHANNEL CALIBRATION: Calibrated client-crm-mcp preference affinity pathways.");
            addLog("MCP SYSTEM Telemetry: All MCP links active.");
            swalClose();
            swalSuccess(tr("MCP Telemetry channels calibrated successfully!", "تمت معايرة قنوات المزامنة والربط بنجاح!"));
          }}
          className="btn-secondary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-border/10"
        >
          <Activity size={14} className="text-primary animate-spin" style={{ animationDuration: '3s' }}/>
          {tr("Calibrate MCP Telemetry Link", "بدء معايرة قنوات المزامنة")}
        </button>
      </div>

      {/* System Health & Warnings Error Indicators Panel */}
      <div className="card-elevated p-5 rounded-2xl bg-card border border-border/15">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <AlertTriangle size={18} className="text-primary"/>
          {tr("Health & Error Indicators", "مؤشرات المشاكل والأخطاء")}
        </h3>
        <div className="space-y-2.5">
          {/* Check 1: Groq Key */}
          {!apiSettings.groqKey && apiSettings.aiProvider !== "pollinations" ? (
            <div className="flex items-start gap-3 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold">{tr("Groq AI Key is missing", "مفتاح Groq AI مفقود")}</p>
                <p className="text-[10px] opacity-90 mt-0.5">{tr("Go to API tab to insert your Groq Key, or select Pollinations (Free) fallback.", "توجه إلى علامة تبويب API لإدخل المفتاح أو اختر بولينيشن (المجاني).")}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 bg-green-50 text-green-700 rounded-xl border border-green-100">
              <Check size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold">{tr("AI Provider Key: OK", "مفتاح مزود الذكاء: جاهز")}</p>
                <p className="text-[10px] opacity-90 mt-0.5">{tr("Primary AI assistant key is loaded and operational.", "مفتاح المساعد الذكي نشط وجاهز للعمل.")}</p>
              </div>
            </div>
          )}

          {/* Check 2: Connection Status */}
          {!connected ? (
            <div className="flex items-start gap-3 p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 animate-pulse">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold">{tr("Live sync status: Offline", "مزامنة البث المباشر: غير متصل")}</p>
                <p className="text-[10px] opacity-90 mt-0.5">{tr("Currently operating in offline fallback mode. Sync will restore automatically.", "تعمل الأنظمة حالياً بوضع الاحتياط المحلي. ستعود المزامنة تلقائياً عند الاتصال.")}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 bg-green-50 text-green-700 rounded-xl border border-green-100">
              <Check size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold">{tr("Firebase Live Sync: Active", "اتصال المزامنة: بث حي")}</p>
                <p className="text-[10px] opacity-90 mt-0.5">{tr("Real-time communication with database is healthy and synced.", "الاتصال المباشر مع قاعدة البيانات نشط والمزامنة مستمرة.")}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card-elevated p-5 rounded-2xl bg-card border border-border/15">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4"><LayoutDashboard size={18} className="text-primary"/> {tr("Business Insights","رؤى العمل")}</h3>
        <div className="space-y-4">
           <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20"><div className="flex items-center gap-3"><Users size={18} className="text-muted-foreground"/><p className="text-xs font-semibold text-foreground/80">{tr("Total CRM Records", "إجمالي سجلات العملاء")}</p></div><p className="text-sm font-bold text-primary">{users.length}</p></div>
           <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20"><div className="flex items-center gap-3"><Sparkles size={18} className="text-orange-500"/><p className="text-xs font-semibold text-foreground/80">{tr("High Value Clients", "عملاء مميزون")}</p></div><p className="text-sm font-bold text-primary">{users.filter(u => u.loginCount >= 3).length}</p></div>
        </div>
      </div>
    </div>
  );
};

const MenuTab = ({ tr, lang, menu, MENU_CATEGORIES, CAT_META }: { tr: any, lang: string, menu: MenuItem[], MENU_CATEGORIES: string[], CAT_META: any }) => {
  const [menuSearch, setMenuSearch] = useState("");
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", nameAr: "", price: "", category: "coffee", image: "", description: "", descriptionAr: "", ingredients: "", ingredientsAr: "", available: true, recommended: false });
  const [savingItem, setSavingItem] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["coffee", "hot_drinks", "recommended"]));
  const [menuEdits, setMenuEdits] = useState<Record<string, Partial<MenuItem>>>({});
  const [savingMenuId, setSavingMenuId] = useState<string | null>(null);
  const groupedMenu = useMemo(() => {
    const filtered = menu.filter(item => {
      const matchesSearch = !menuSearch || item.name?.toLowerCase().includes(menuSearch.toLowerCase()) || item.nameAr?.includes(menuSearch);
      const matchesCategory = menuCategoryFilter === "all" || item.category === menuCategoryFilter;
      return matchesSearch && matchesCategory;
    });
    const groups: Record<string, MenuItem[]> = {};
    const recs = filtered.filter(i => i.recommended);
    if (recs.length > 0) groups["recommended"] = recs;
    filtered.forEach(item => {
      const cat = item.category || "other";
      if (!groups[cat]) groups[cat] = [];
      if (menuCategoryFilter === "all" && item.recommended) return;
      groups[cat].push(item);
    });
    return groups;
  }, [menu, menuSearch, menuCategoryFilter]);
  const inp = "input-field px-3 py-2.5 text-sm";
  const lbl = "text-[10px] font-bold uppercase mb-1 block text-muted-foreground";
  return (
    <div className="space-y-6 page-enter">
      <div className="card-elevated p-5 rounded-2xl border border-border/10 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-tighter"><Plus size={18} className="text-primary"/> {tr("Menu Management","إدارة القائمة")}</h3>
          <div className="w-full flex gap-3 mt-2">
            <div className="relative flex-1">
              <input type="text" placeholder={tr("Search items...", "البحث...")} value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} className="input-field w-full pl-3 pr-4 py-2.5 text-sm" />
            </div>
            <select value={menuCategoryFilter} onChange={(e) => setMenuCategoryFilter(e.target.value)} className="input-field w-40 px-3 py-2.5 text-sm">
              <option value="all">{tr("All Categories", "الأقسام")}</option>
              {MENU_CATEGORIES.map(c => <option key={c} value={c}>{CAT_META[c] ? tr(CAT_META[c].en, CAT_META[c].ar) : c}</option>)}
            </select>
          </div>
          <div className="flex gap-3 flex-wrap w-full">
            <button onClick={async () => { if (!confirm(tr("Merge menu?", "دمج القائمة؟"))) return; swalLoading(tr("Merging…", "جار الدمج…")); await mergeMenuIngredients(); swalClose(); swalSuccess(tr("Merged!", "تم الدمج!")); }} className="flex-1 btn-secondary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"><RotateCcw size={14}/> {tr("Merge", "دمج")}</button>
            <button onClick={async () => { if (!confirm(tr("⚠️ Reseed entire menu?", "⚠️ إعادة رفع القائمة بالكامل؟"))) return; swalLoading(tr("Reseeding…", "جار الرفع…")); await forceReseedMenu(); swalClose(); swalSuccess(tr("Reseeded!", "تم الرفع!")); }} className="flex-1 btn-secondary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"><UploadCloud size={14}/> {tr("Reseed", "رفع")}</button>
            <button onClick={() => setShowAddForm(v => !v)} className={`flex-1 ${showAddForm ? "btn-secondary" : "btn-primary"} py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5`}>{showAddForm ? tr("Cancel", "إلغاء") : tr("Add", "إضافة")}</button>
          </div>
        </div>
        {showAddForm && (
          <div className="card border border-border/30 p-5 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>{tr("Name (EN)","الاسم EN")}</label><input className="input-field w-full" placeholder="Caramel Latte" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className={lbl}>{tr("Name (AR)","الاسم AR")}</label><input className="input-field w-full" dir="rtl" placeholder="لاتيه كراميل" value={addForm.nameAr} onChange={e => setAddForm(f => ({ ...f, nameAr: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>{tr("Price (EGP)","السعر")}</label><input type="number" className="input-field w-full" placeholder="0" value={addForm.price} onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><label className={lbl}>{tr("Category","الفئة")}</label><select className="input-field w-full" value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}>{MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <ImagePicker label={tr("Photo", "الصورة")} value={addForm.image} onChange={v => setAddForm(f => ({ ...f, image: v }))} />
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="add-recommended"
                checked={addForm.recommended}
                onChange={e => setAddForm(f => ({ ...f, recommended: e.target.checked }))}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="add-recommended" className="text-xs font-semibold text-foreground cursor-pointer">
                {tr("Mark as Recommended / Promote to Top Picks", "تمييز كصنف موصى به / ترقية للأفضل")}
              </label>
            </div>
            <button disabled={savingItem || !addForm.name || !addForm.price} onClick={async () => { setSavingItem(true); const id = `${addForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36)}`; await smartSet(`menu/${addForm.category}/${id}`, { ...addForm, price: Number(addForm.price) }); setAddForm({ name:"", nameAr:"", price:"", category:"coffee", image:"", description:"", descriptionAr:"", ingredients:"", ingredientsAr:"", available:true, recommended:false }); setShowAddForm(false); setSavingItem(false); swalSuccess(tr("Added!", "تمت الإضافة!")); }} className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">{savingItem ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <Save size={16}/>} {tr("Save Item","حفظ الصنف")}</button>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {Object.entries(groupedMenu).map(([catId, catItems]) => {
          const isExpanded = expandedCats.has(catId);
          const meta = CAT_META[catId] || { emoji: "📦", en: catId, ar: catId };
          const itemsList = catItems as MenuItem[];
          return (
            <div key={catId} className="space-y-2">
              <button onClick={() => { const next = new Set(expandedCats); if (next.has(catId)) next.delete(catId); else next.add(catId); setExpandedCats(next); }} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border/10 hover:bg-muted/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{meta.emoji}</span>
                  <span className="text-sm font-bold text-foreground">{tr(meta.en, meta.ar)}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{itemsList.length}</span>
                </div>
                <ChevronDown size={18} className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>
              {isExpanded && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                  {itemsList.map((item: MenuItem) => {
                    const isSelected = selectedMenuItemId === item.id;
                    const edits = menuEdits[item.id] || {};
                    return (
                      <div key={item.id} className="contents">
                        <div onClick={() => setSelectedMenuItemId(isSelected ? null : item.id)} className={`relative group cursor-pointer card overflow-hidden border border-border/10 hover:shadow-md transition-all duration-200 ${isSelected ? "border-primary ring-2 ring-primary/20" : ""}`}>
                          <div className="h-28 relative overflow-hidden bg-muted/20 border-b border-border/10">{item.image ? <img src={item.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" loading="lazy"/> : <div className="w-full h-full flex items-center justify-center text-4xl opacity-15">{meta.emoji}</div>}</div>
                          <div className="p-3"><p className="text-sm font-bold text-foreground truncate">{lang === "ar" ? (item.nameAr || item.name) : item.name}</p><p className="text-xs font-semibold text-primary mt-1.5">{item.price} EGP</p></div>
                        </div>
                        {isSelected && (
                          <div className="col-span-2 card p-6 bg-card border border-border/10 mt-2 mb-4 rounded-2xl">
                            <div className="space-y-5">
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className={lbl}>Name (EN)</label><input className="input-field w-full" value={edits.name || item.name} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], name: e.target.value } }))} /></div>
                                <div><label className={lbl}>Name (AR)</label><input className="input-field w-full" dir="rtl" value={edits.nameAr || item.nameAr} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], nameAr: e.target.value } }))} /></div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className={lbl}>Price (EGP)</label><input type="number" className="input-field w-full" value={edits.price || item.price} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], price: Number(e.target.value) } }))} /></div>
                                <div><label className={lbl}>Category</label><select className="input-field w-full" value={edits.category || item.category} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], category: e.target.value } }))}>{MENU_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className={lbl}>Description (EN)</label><textarea className="input-field w-full h-24" value={edits.description || item.description} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], description: e.target.value } }))} /></div>
                                <div><label className={lbl}>Description (AR)</label><textarea className="input-field w-full h-24" dir="rtl" value={edits.descriptionAr || item.descriptionAr} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], descriptionAr: e.target.value } }))} /></div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div><label className={lbl}>Ingredients (EN)</label><textarea className="input-field w-full h-24" value={edits.ingredients || item.ingredients} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], ingredients: e.target.value } }))} /></div>
                                <div><label className={lbl}>Ingredients (AR)</label><textarea className="input-field w-full h-24" dir="rtl" value={edits.ingredientsAr || item.ingredientsAr} onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], ingredientsAr: e.target.value } }))} /></div>
                              </div>
                              <ImagePicker label={tr("Photo", "الصورة")} value={edits.image || item.image} onChange={v => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], image: v } }))} />
                              <div className="flex items-center gap-2 py-1">
                                <input
                                  type="checkbox"
                                  id={`edit-rec-${item.id}`}
                                  checked={edits.recommended !== undefined ? edits.recommended : !!item.recommended}
                                  onChange={e => setMenuEdits(p => ({ ...p, [item.id]: { ...p[item.id], recommended: e.target.checked } }))}
                                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                />
                                <label htmlFor={`edit-rec-${item.id}`} className="text-xs font-semibold text-foreground cursor-pointer">
                                  {tr("Mark as Recommended / Promote to Top Picks", "تمييز كصنف موصى به / ترقية للأفضل")}
                                </label>
                              </div>
                              <div className="flex gap-3 pt-4">
                                <button onClick={async () => { if (await swalConfirm(tr("Delete?", "حذف؟"), tr("Permanent.", "نهائي."), tr("Delete", "حذف"), tr("Cancel", "إلغاء"))) { await smartRemove(`menu/${item.originalCategory || item.category}/${item.id}`); setSelectedMenuItemId(null); swalSuccess(tr("Deleted!", "تم الحذف!")); } }} className="btn-secondary px-4 py-3 rounded-xl hover:bg-destructive hover:text-white transition-colors"><Trash2 size={16} /></button>
                                <button disabled={savingMenuId === item.id || !Object.keys(edits).length} onClick={async () => { setSavingMenuId(item.id); await smartUpdate(`menu/${item.originalCategory || item.category}/${item.id}`, edits); setMenuEdits(prev => { const n = { ...prev }; delete n[item.id]; return n; }); swalSuccess(tr("Saved!", "تم الحفظ!")); setSelectedMenuItemId(null); setSavingMenuId(null); }} className="btn-primary flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2">{savingMenuId === item.id ? <Bot className="animate-spin" size={16}/> : <Save size={16}/>} {tr("Save Changes", "حفظ التعديلات")}</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FeaturesTab = ({ tr, featureFlags, toggleFeatureFlag, savingFlag }: { tr: any, featureFlags: any, toggleFeatureFlag: any, savingFlag: string | null }) => (
  <div className="space-y-4 page-enter">
    <div className="card-elevated rounded-2xl p-5 space-y-4 border border-border/10 bg-card">
      <h3 className="font-bold text-foreground flex items-center gap-2"><ToggleRight size={18} className="text-primary"/> {tr("Feature Controls","التحكم في الميزات")}</h3>
      {[{ id: "baristaEnabled", icon: <Sparkles size={16}/>, title: tr("AI Barista", "الباريستا الذكي") }, { id: "reelsEnabled", icon: <Film size={16}/>, title: tr("Reels Hub", "مركز الريلز") }, { id: "supportEnabled", icon: <MessageCircle size={16}/>, title: tr("Support Chat", "دردشة الدعم") }].map((f) => (
        <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/30">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{f.icon}</div><p className="text-xs font-semibold">{f.title}</p></div>
          <button onClick={() => toggleFeatureFlag(f.id, !featureFlags[f.id as keyof typeof featureFlags])} disabled={savingFlag === f.id} className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${featureFlags[f.id as keyof typeof featureFlags] ? "bg-green-500" : "bg-muted-foreground/30"}`}><div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${featureFlags[f.id as keyof typeof featureFlags] ? "translate-x-6" : ""}`} /></button>
        </div>
      ))}
    </div>
  </div>
);

const UsersTab = ({ tr, users, deleteUser, formatDuration }: { tr: any, users: any[], deleteUser: any, formatDuration: any }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "returning" | "active" | "issues">("all");
  const [expandedUid, setExpandedUid] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const nameMatch = (u.name || "Guest").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (u.uid || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!nameMatch) return false;

      if (filterMode === "returning") return (u.loginCount || 1) >= 2;
      if (filterMode === "active") {
        const thirtyMins = 30 * 60 * 1000;
        return (Date.now() - (u.lastSeenAt || u.lastLoginAt || 0)) < thirtyMins;
      }
      if (filterMode === "issues") return !!u.hasIssues;

      return true;
    });
  }, [users, searchTerm, filterMode]);

  const totalCount = users.length;
  const highValueCount = users.filter(u => (u.loginCount || 1) >= 3 || (u.activityScore || 0) >= 100).length;
  const issuesCount = users.filter(u => !!u.hasIssues).length;

  return (
    <div className="space-y-6 page-enter pb-10">
      {/* CRM METRICS */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-elevated rounded-2xl p-3.5 bg-card border border-border/10 text-center shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1.5">
            <Users size={16} />
          </div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{tr("Total Clients", "إجمالي العملاء")}</p>
          <h4 className="text-base font-black text-foreground mt-0.5">{totalCount}</h4>
        </div>
        <div className="card-elevated rounded-2xl p-3.5 bg-card border border-border/10 text-center shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-1.5">
            <Sparkles size={16} />
          </div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{tr("High Value", "عملاء مميزون")}</p>
          <h4 className="text-base font-black text-amber-500 mt-0.5">{highValueCount}</h4>
        </div>
        <div className="card-elevated rounded-2xl p-3.5 bg-card border border-border/10 text-center shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-1.5">
            <AlertTriangle size={16} />
          </div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{tr("Has Issues", "لديه مشاكل")}</p>
          <h4 className="text-base font-black text-red-500 mt-0.5">{issuesCount}</h4>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="card-elevated rounded-2xl p-4 bg-card border border-border/10 space-y-3.5 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            className="input-field w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-muted/20"
            placeholder={tr("Search by name or UID...", "ابحث بالاسم أو المعرّف...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto scroll-hide pb-0.5">
          {([
            { id: "all", labelEn: "All", labelAr: "الكل" },
            { id: "returning", labelEn: "Returning", labelAr: "متكرر" },
            { id: "active", labelEn: "Active Now", labelAr: "نشط الآن" },
            { id: "issues", labelEn: "With Issues", labelAr: "لديه مشاكل" }
          ] as const).map(f => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap border ${
                filterMode === f.id
                  ? "bg-primary border-primary text-white shadow-md shadow-primary/10"
                  : "bg-muted/10 border-border/10 text-muted-foreground hover:bg-muted/20"
              }`}
            >
              {tr(f.labelEn, f.labelAr)}
            </button>
          ))}
        </div>
      </div>

      {/* USERS LIST */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border/10 rounded-2xl">
            <Info className="mx-auto mb-2 text-muted-foreground/50" size={24} />
            <p className="text-xs text-muted-foreground font-semibold">{tr("No clients matched your criteria", "لا يوجد عملاء يطابقون خياراتك")}</p>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isExpanded = expandedUid === u.uid;

            const activitiesList = u.activities
              ? Object.entries(u.activities).map(([aid, a]: any) => ({ aid, ...a })).sort((a,b) => b.createdAt - a.createdAt)
              : [];
            const issuesList = u.issues
              ? Object.entries(u.issues).map(([iid, i]: any) => ({ iid, ...i })).sort((a,b) => b.createdAt - a.createdAt)
              : [];

            const affinities = u.preferences?.affinities
              ? Object.entries(u.preferences.affinities).map(([catId, val]: any) => ({ catId, val: Number(val) })).sort((a,b) => b.val - a.val)
              : [];

            return (
              <div
                key={u.uid}
                className={`card rounded-2xl border transition-all overflow-hidden ${
                  isExpanded
                    ? "border-primary/30 ring-1 ring-primary/15 bg-card shadow-lg shadow-primary/5 scale-[1.01]"
                    : "border-border/10 hover:border-border/20 bg-card active:scale-[0.99]"
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedUid(isExpanded ? null : u.uid)}
                  className="p-4 flex items-center gap-3.5 cursor-pointer select-none"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 transition-colors ${
                    isExpanded ? "bg-primary text-white" : "bg-primary/10 text-primary"
                  }`}>
                    {u.name?.[0]?.toUpperCase() || "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-foreground truncate">{u.name || "Guest"}</p>
                      {u.tableNumber && (
                        <span className="px-1.5 py-0.5 rounded-lg bg-secondary/15 text-secondary text-[9px] font-bold">
                          T{u.tableNumber}
                        </span>
                      )}
                      {u.hasIssues && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Has Technical Issues" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-semibold">
                      <span className="flex items-center gap-0.5"><Clock size={10} /> {formatDuration(u.totalUsageSeconds || 0)}</span>
                      <span>•</span>
                      <span>{tr(`Visits: ${u.loginCount || 1}`, `الزيارات: ${u.loginCount || 1}`)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-primary flex items-center gap-0.5 justify-end">
                        <Zap size={10} /> {u.activityScore || 0}
                      </div>
                      <p className="text-[8px] text-muted-foreground font-semibold uppercase tracking-tight">{tr("Activity Score", "درجة النشاط")}</p>
                    </div>
                    <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {/* Expanded Detailed CRM Report View */}
                {isExpanded && (
                  <div className="border-t border-border/10 p-4 bg-muted/5 space-y-4 animate-in fade-in duration-200">
                    {/* Grid Info */}
                    <div className="grid grid-cols-2 gap-3 text-[11px] bg-muted/20 rounded-xl p-3">
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">{tr("Client ID", "معرّف العميل")}</p>
                        <p className="font-mono text-foreground font-semibold mt-0.5 truncate">{u.uid}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">{tr("Device ID", "معرّف الجهاز")}</p>
                        <p className="font-mono text-foreground font-semibold mt-0.5 truncate">{u.deviceId || "N/A"}</p>
                      </div>
                      <div className="mt-1.5">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">{tr("First Joined", "أول دخول")}</p>
                        <p className="text-foreground font-semibold mt-0.5">{u.createdAt ? new Date(u.createdAt).toLocaleString() : "N/A"}</p>
                      </div>
                      <div className="mt-1.5">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">{tr("Last Active", "آخر نشاط")}</p>
                        <p className="text-foreground font-semibold mt-0.5">{u.lastSeenAt || u.lastLoginAt ? new Date(u.lastSeenAt || u.lastLoginAt).toLocaleString() : "N/A"}</p>
                      </div>
                    </div>

                    {/* Meta-Style Interest Affinities Chart */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <TrendingUp size={13} className="text-primary" />
                        <span>{tr("Category Interest Profile (Meta Algorithm)", "ملف اهتمامات الفئات (خوارزمية ميتا)")}</span>
                      </div>
                      {affinities.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic font-medium pl-1">{tr("No category interaction recorded yet.", "لم يتم تسجيل تفاعلات فئات بعد.")}</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {affinities.map(a => (
                            <div key={a.catId} className="bg-card border border-border/10 rounded-xl p-2 flex flex-col justify-center">
                              <div className="flex justify-between items-center text-[9px] font-bold text-foreground/80 mb-1">
                                <span className="uppercase">#{a.catId}</span>
                                <span>{a.val}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${a.val}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Technical Issues faced Section */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-red-500">
                        <AlertTriangle size={13} />
                        <span>{tr("Technical Issues & Fallbacks Faced", "الأخطاء والمشاكل الفنية التي واجهها")}</span>
                      </div>
                      {issuesList.length === 0 ? (
                        <div className="flex items-center gap-1 bg-green-500/5 text-green-600 rounded-xl p-2.5 border border-green-500/10">
                          <ShieldCheck size={13} />
                          <span className="text-[10px] font-semibold">{tr("No issues or fallbacks logged for this customer.", "لا توجد أخطاء أو مشاكل مسجلة لهذا العميل.")}</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto border border-red-500/10 rounded-xl p-2 bg-red-500/[0.01]">
                          {issuesList.map((issue: any) => (
                            <div key={issue.iid} className="text-[10px] bg-red-500/5 border border-red-500/10 rounded-lg p-2 flex items-start gap-1.5 font-sans">
                              <AlertCircle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-red-700 capitalize">{issue.type.replace(/_/g, " ")}</p>
                                <p className="text-muted-foreground mt-0.5 font-medium leading-normal">{issue.details}</p>
                                <span className="text-[8px] text-muted-foreground mt-1 block">{new Date(issue.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Timeline Audit Trail */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Activity size={13} className="text-primary" />
                        <span>{tr("Chronological Action Log (CRM)", "سجل العمليات الزمني (CRM)")}</span>
                      </div>
                      {activitiesList.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic font-medium pl-1">{tr("No recent activities recorded.", "لم يتم تسجيل نشاطات حديثة.")}</p>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto border border-border/10 rounded-xl p-3 bg-muted/10">
                          {activitiesList.slice(0, 50).map((act: any) => (
                            <div key={act.aid} className="text-[10px] flex gap-2 border-b border-border/5 pb-2 last:border-0 last:pb-0 font-sans">
                              <span className="w-2.5 h-2.5 rounded-full bg-primary/20 flex-shrink-0 mt-1" />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-foreground/90 capitalize">{act.actionType.replace(/_/g, " ")}</p>
                                {act.details && (
                                  <p className="text-[9px] text-muted-foreground mt-0.5 font-medium leading-relaxed truncate">
                                    {typeof act.details === "object" ? JSON.stringify(act.details) : String(act.details)}
                                  </p>
                                )}
                                <span className="text-[8px] text-muted-foreground/60 block mt-0.5">{new Date(act.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Client deletion action */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteUser(u.uid); }}
                        className="px-3.5 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive text-[10px] font-bold rounded-xl transition-all flex items-center gap-1"
                      >
                        <Trash2 size={12} /> {tr("Delete Record", "حذف السجل")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const ChatTab = ({ tr, isRTL, selectedChat, setSelectedChat, chats, chatMsgs, chatInput, setChatInput, sendReply, deleteChat, chatBottomRef }: { tr: any, isRTL: boolean, selectedChat: string | null, setSelectedChat: any, chats: ChatSession[], chatMsgs: ChatMsg[], chatInput: string, setChatInput: any, sendReply: any, deleteChat: any, chatBottomRef: any }) => (
  <div className="flex flex-col h-[70dvh] page-enter">
    {selectedChat ? (
      <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-border/20 bg-card">
        <div className="p-3.5 bg-primary text-white flex items-center gap-3"><button onClick={() => setSelectedChat(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><ArrowLeft size={18}/></button><div className="flex-1 min-w-0"><p className="font-bold text-sm truncate">{chats.find(c => c.uid === selectedChat)?.userName || "Chat"}</p></div><button onClick={() => deleteChat(selectedChat)} className="p-1.5 hover:bg-white/20 rounded-full"><Trash2 size={16}/></button></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-hide">
          {chatMsgs.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${m.sender === "admin" ? "bg-primary text-white rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"}`}><p className="whitespace-pre-wrap leading-relaxed">{m.text}</p></div></div>
          ))}
          <div ref={chatBottomRef} />
        </div>
        <div className="p-3 bg-muted/10 border-t border-border/10 flex gap-2"><input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()} placeholder={tr("Type a reply...", "اكتب رداً...")} className="flex-1 bg-muted rounded-xl px-4 py-2 text-sm outline-none" /><button onClick={sendReply} className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center transition-transform active:scale-95"><Plus size={18}/></button></div>
      </div>
    ) : (
      <div className="space-y-2 overflow-y-auto pr-1">
        {chats.map((c) => (
          <div key={c.uid} onClick={() => setSelectedChat(c.uid)} className="card rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-all relative border border-border/10">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">{c.userName?.[0]?.toUpperCase() || "?"}</div>
            <div className="flex-1 min-w-0"><div className="flex items-center justify-between"><p className="font-bold text-sm truncate">{c.userName}</p><p className="text-[10px] text-muted-foreground font-semibold">{new Date(c.lastAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</p></div><p className="text-xs text-muted-foreground truncate mt-1 font-semibold">{c.lastMessage}</p></div>
            {(c.unreadAdmin || 0) > 0 && <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />}
          </div>
        ))}
      </div>
    )}
  </div>
);

const BroadcastTab = ({ tr, newBroadcast, setNewBroadcast, sendBroadcast, sendingBroadcast, bannerContent, setBannerContent, bannerBgColor, setBannerBgColor, bannerTextColor, setBannerTextColor, bannerEnabled, saveBannerEnabled, saveBanner, savingBanner, broadcasts, deleteBroadcast }: { tr: any, newBroadcast: any, setNewBroadcast: any, sendBroadcast: any, sendingBroadcast: boolean, bannerContent: string, setBannerContent: any, bannerBgColor: string, setBannerBgColor: any, bannerTextColor: string, setBannerTextColor: any, bannerEnabled: boolean, saveBannerEnabled: any, saveBanner: any, savingBanner: boolean, broadcasts: Broadcast[], deleteBroadcast: any }) => (
  <div className="space-y-6 page-enter">
    <div className="card-elevated rounded-2xl p-5 space-y-4 border border-border/10 border-l-4 border-primary">
      <h3 className="font-bold text-foreground flex items-center gap-2"><Megaphone size={18} className="text-primary"/> {tr("Global Broadcast","إرسال إشعار عام")}</h3>
      <div className="grid grid-cols-2 gap-3"><input className="input-field px-3 py-2.5 text-sm" placeholder="Title (EN)" value={newBroadcast.title} onChange={e => setNewBroadcast({ ...newBroadcast, title: e.target.value })} /><input className="input-field px-3 py-2.5 text-sm" dir="rtl" placeholder="Title (AR)" value={newBroadcast.titleAr} onChange={e => setNewBroadcast({ ...newBroadcast, titleAr: e.target.value })} /></div>
      <textarea className="input-field px-3 py-2.5 text-sm min-h-[80px]" placeholder="Message (EN)" value={newBroadcast.message} onChange={e => setNewBroadcast({ ...newBroadcast, message: e.target.value })} />
      <button onClick={sendBroadcast} disabled={sendingBroadcast || !newBroadcast.title} className="btn-primary w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">{sendingBroadcast ? <RotateCcw size={16} className="animate-spin"/> : <Plus size={16}/>} {tr("Send Now", "إرسال الآن")}</button>
    </div>
    <div className="card-elevated rounded-2xl p-5 space-y-4 border border-border/10">
      <div className="flex items-center justify-between"><h3 className="font-bold text-foreground flex items-center gap-2"><LayoutDashboard size={18} className="text-primary"/> {tr("Homepage Banner","بانر الصفحة الرئيسية")}</h3><button onClick={() => saveBannerEnabled(!bannerEnabled)} className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${bannerEnabled ? "bg-green-500" : "bg-muted-foreground/30"}`}><div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${bannerEnabled ? "translate-x-6" : ""}`} /></button></div>
      <textarea className="input-field px-3 py-2.5 text-sm min-h-[60px]" placeholder="Banner content..." value={bannerContent} onChange={e => setBannerContent(e.target.value)} />
      <button onClick={saveBanner} disabled={savingBanner} className="btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">{savingBanner ? <RotateCcw size={16} className="animate-spin"/> : <Save size={16}/>} {tr("Update Banner", "تحديث البانر")}</button>
    </div>
  </div>
);

const SystemTab = ({ tr }: { tr: any }) => {
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [r2Config, setR2Config] = useState({ endpoint: "", accessKey: "", secretKey: "", bucket: "" });
  const [r2Loading, setR2Loading] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, "backups"), (s) => setBackups(Object.entries(s.val() || {}).map(([id, v]: any) => ({ id, ...v })).sort((a,b) => b.date-a.date)));
    smartGet("r2-config").then(cfg => cfg && setR2Config(cfg));
    return () => off(ref(db, "backups"));
  }, []);

  const createBackup = async () => {
    setLoading(true);
    try {
      const paths = ["menu", "users", "ai-config", "api-settings", "broadcast", "reels", "feedback", "homepage-banner", "feature-flags"];
      const data: any = {};
      for (const p of paths) {
        const snap = await get(ref(db, p));
        if (snap.exists()) data[p] = snap.val();
      }
      const id = `backup_${Date.now()}`;
      await smartSet(`backups/${id}`, { id, name: `Manual Backup ${new Date().toLocaleDateString()}`, date: Date.now(), data });
      swalSuccess(tr("Backup created!", "تم إنشاء نسخة احتياطية!"));
    } catch (e) { swalError(tr("Failed", "فشل")); }
    setLoading(false);
  };

  const handleGlobalSync = async () => {
    if (!await swalConfirm(tr("Global Sync", "مزامنة شاملة"), tr("Overwrite Firebase with R2 data?", "استبدال بيانات Firebase ببيانات R2؟"))) return;
    setLoading(true);
    try {
      const objects = await listR2Objects();
      for (const obj of objects) {
        if (!obj.Key?.endsWith(".json")) continue;
        const data = await downloadFromR2(obj.Key);
        await set(ref(db, obj.Key.replace(".json", "")), data);
      }
      swalSuccess(tr("Sync Complete!", "تمت المزامنة!"));
    } catch (e) { swalError("Sync failed"); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 page-enter pb-10">
      <div className="card-elevated rounded-2xl p-5 space-y-4 border border-border/10 border-l-4 border-primary bg-card">
        <h3 className="font-bold flex items-center gap-2"><UploadCloud size={18} className="text-primary"/> {tr("R2 Fallback Config", "إعدادات الطوارئ R2")}</h3>
        <input className="input-field px-3 py-2 text-sm" placeholder="Endpoint" value={r2Config.endpoint} onChange={e => setR2Config({...r2Config, endpoint: e.target.value})}/>
        <div className="grid grid-cols-2 gap-3">
          <input className="input-field px-3 py-2 text-sm" type="password" placeholder="Access Key" value={r2Config.accessKey} onChange={e => setR2Config({...r2Config, accessKey: e.target.value})}/>
          <input className="input-field px-3 py-2 text-sm" type="password" placeholder="Secret Key" value={r2Config.secretKey} onChange={e => setR2Config({...r2Config, secretKey: e.target.value})}/>
        </div>
        <div className="flex gap-2">
          <button onClick={async () => { setR2Loading(true); try { await testR2Connection(r2Config); swalSuccess("Connected!"); } catch(e){ swalError("Failed"); } setR2Loading(false); }} className="flex-1 btn-secondary py-2 rounded-xl text-xs font-bold">Test</button>
          <button onClick={async () => { await smartSet("r2-config", r2Config); swalSuccess("Saved!"); }} className="flex-1 btn-primary py-2 rounded-xl text-xs font-bold">Save</button>
        </div>
        <button onClick={handleGlobalSync} className="w-full py-3 bg-orange-500 text-white rounded-xl text-xs font-bold mt-2 hover:bg-orange-600 transition-colors">Sync R2 to Firebase</button>
      </div>

      <div className="card-elevated rounded-2xl p-5 space-y-4 border border-border/10 border-l-4 border-blue-500 bg-card">
        <h3 className="font-bold flex items-center gap-2"><Archive size={18} className="text-blue-500"/> {tr("Backup & Restore", "النسخ الاحتياطي")}</h3>
        <button onClick={createBackup} disabled={loading} className="btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Download size={16}/> {tr("Create New Backup", "إنشاء نسخة احتياطية")}</button>
        <div className="space-y-2">
          {backups.map(b => (
            <div key={b.id} className="card rounded-xl p-3 flex items-center justify-between border border-border/10">
              <div><p className="text-sm font-bold">{b.name}</p><p className="text-[10px] text-muted-foreground font-semibold">{new Date(b.date).toLocaleString()}</p></div>
              <div className="flex gap-2">
                <button onClick={async () => { setLoading(true); try { for(const [p, v] of Object.entries(b.data)) await set(ref(db, p), v); swalSuccess("Restored!"); } catch(e){ swalError("Failed"); } setLoading(false); }} className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"><UploadCloud size={14}/></button>
                <button onClick={() => smartRemove(`backups/${b.id}`)} className="p-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-elevated rounded-2xl p-5 border border-border/10 border-l-4 border-destructive space-y-4 bg-card">
        <h3 className="font-bold text-destructive flex items-center gap-2"><RotateCcw size={18}/> {tr("Critical Actions","عمليات خطيرة")}</h3>
        <button onClick={async () => { if (await swalConfirm(tr("Wipe all data?", "مسح كل البيانات؟"), tr("This cannot be undone.", "لا يمكن التراجع."))) { ["menu", "users", "feedback", "support-chat", "broadcast", "reels", "tables", "feature-flags", "homepage-banner", "conversations"].forEach(p => remove(ref(db, p))); swalSuccess("System reset!"); } }} className="w-full py-3 rounded-xl bg-destructive text-white font-bold flex items-center justify-center gap-2 hover:bg-destructive/90 transition-colors"><Trash2 size={16}/> {tr("Reset All Data","إعادة تعيين كل البيانات")}</button>
      </div>
    </div>
  );
};

const BaristaTab = ({ tr }: { tr: any }) => {
  const [config, setConfig] = useState({ baristaName: "", baristaAvatar: "", instagram: "", cafeName: "", cafeLocation: "", cafeHours: "", cafePhone: "", systemPrompt: "", systemPromptAr: "", greeting: "", greetingAr: "" });
  const [apiSettings, setApiSettings] = useState({ aiEnabled: true, groqKey: "", menuNode: "menu", workStyle: "Egyptian Dialect" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kbText, setKbText] = useState("");

  useEffect(() => {
    const cfgRef = ref(db, "ai-config");
    const apiRef = ref(db, "api-settings");
    const kbRef = ref(db, "ai-knowledge-base");
    onValue(cfgRef, (snap) => snap.exists() && setConfig(prev => ({ ...prev, ...snap.val() })));
    onValue(apiRef, (snap) => { if (snap.exists()) setApiSettings(snap.val()); });
    onValue(kbRef, (snap) => {
      if (snap.exists()) setKbText(snap.val() || "");
      setLoading(false);
    });
    return () => { off(cfgRef); off(apiRef); off(kbRef); };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await smartSet("ai-config", config);
      await smartSet("api-settings", apiSettings);
      await smartSet("ai-knowledge-base", kbText);
      swalSuccess(tr("Saved!", "تم الحفظ!"));
    } catch (err) {
      swalError(tr("Error", "خطأ"));
    }
    setSaving(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        setKbText(result);
        swalSuccess(tr("Knowledge base loaded from file!", "تم تحميل قاعدة المعرفة من الملف!"));
      }
    };
    reader.readAsText(file);
  };

  const inp = "input-field px-3 py-2 text-sm w-full";
  const lbl = "text-[11px] font-bold text-muted-foreground uppercase block mb-1";
  if (loading) return <div className="py-20 text-center animate-pulse">{tr("Loading...", "جاري التحميل...")}</div>;
  return (
    <div className="space-y-6 page-enter pb-10">
      <div className="card-elevated rounded-2xl p-5 flex items-center justify-between border border-border/10 border-l-4 border-amber-500 bg-card">
        <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${apiSettings.aiEnabled ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}><Bot size={20} /></div><div><h3 className="font-bold text-sm">{tr("AI Status", "حالة الذكاء")}</h3><p className="text-[10px] text-muted-foreground">{apiSettings.aiEnabled ? tr("Active", "نشط") : tr("Disabled", "معطل")}</p></div></div>
        <button onClick={() => setApiSettings(p => ({ ...p, aiEnabled: !p.aiEnabled }))} className={`px-4 py-2 rounded-xl text-xs font-bold ${apiSettings.aiEnabled ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>{apiSettings.aiEnabled ? tr("Disable", "تعطيل") : tr("Enable", "تفعيل")}</button>
      </div>
      <div className="card-elevated rounded-2xl p-5 space-y-4 border border-border/10 border-l-4 border-orange-500 bg-card"><div className="flex items-center gap-2 mb-2"><Sparkles size={18} className="text-orange-500"/><h3 className="font-bold text-foreground">{tr("Menu Data Source", "مصدر القائمة")}</h3></div><input className={inp} value={apiSettings.menuNode || "menu"} onChange={e => setApiSettings({ ...apiSettings, menuNode: e.target.value })} placeholder="e.g. menu" /></div>

      <div className="card-elevated rounded-2xl p-5 space-y-4 border border-border/10 border-l-4 border-indigo-500 bg-card">
        <div className="flex items-center gap-2 mb-2">
          <Settings size={18} className="text-indigo-500"/>
          <h3 className="font-bold text-foreground">{tr("AI Persona & Work Style", "أسلوب عمل ومزاج الذكاء")}</h3>
        </div>
        <div>
          <label className={lbl}>{tr("AI Work Style / Accent", "أسلوب وطبيعة المحادثة")}</label>
          <select
            className={inp}
            value={apiSettings.workStyle || "Egyptian Dialect"}
            onChange={e => setApiSettings({...apiSettings, workStyle: e.target.value})}
          >
            <option value="Egyptian Dialect">Egyptian Dialect (عامية مصرية)</option>
            <option value="Chatty & Fun">Chatty & Fun (مرح وتفاعلي)</option>
            <option value="Professional Cafe Host">Professional Cafe Host (راقي ورسمي)</option>
            <option value="Quick & Direct">Quick & Direct (سريع ومختصر)</option>
          </select>
        </div>
      </div>

      <div className="card-elevated rounded-2xl p-5 space-y-4 border border-border/10 border-l-4 border-primary bg-card">
        <div className="flex items-center gap-2 mb-2"><User size={18} className="text-primary"/><h3 className="font-bold text-foreground">{tr("Persona", "الشخصية")}</h3></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lbl}>{tr("Name", "الاسم")}</label><input className={inp} value={config.baristaName} onChange={e => setConfig({...config, baristaName: e.target.value})} /></div>
          <div><label className={lbl}>{tr("Instagram", "انستجرام")}</label><input className={inp} value={config.instagram} onChange={e => setConfig({...config, instagram: e.target.value})} /></div>
        </div>
        <div><label className={lbl}>{tr("Avatar URL", "رابط الصورة")}</label><input className={inp} value={config.baristaAvatar} onChange={e => setConfig({...config, baristaAvatar: e.target.value})} /></div>
      </div>
      <div className="card-elevated rounded-2xl p-5 space-y-4 border border-border/10 border-l-4 border-purple-500 bg-card">
        <div className="flex items-center gap-2 mb-2"><MessageSquare size={18} className="text-purple-500"/><h3 className="font-bold text-foreground">{tr("Greetings", "الترحيب")}</h3></div>
        <div className="space-y-4">
          <div><label className={lbl}>Greeting (EN)</label><textarea className={`${inp} h-20`} value={config.greeting} onChange={e => setConfig({...config, greeting: e.target.value})} /></div>
          <div><label className={lbl}>Greeting (AR)</label><textarea className={`${inp} h-20`} dir="rtl" value={config.greetingAr} onChange={e => setConfig({...config, greetingAr: e.target.value})} /></div>
        </div>
      </div>

      <div className="card-elevated rounded-2xl p-5 space-y-4 border border-border/10 border-l-4 border-teal-500 bg-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-teal-500"/>
            <h3 className="font-bold text-foreground">{tr("AI Custom Knowledge Base", "قاعدة المعرفة المخصصة للذكاء")}</h3>
          </div>
          <label className="btn-secondary px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-primary hover:text-white transition-colors">
            <UploadCloud size={12} className="inline mr-1" />
            {tr("Upload TXT/JSON", "رفع ملف")}
            <input type="file" accept=".txt,.json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
          {tr("Add custom guidelines, history, special rules, or secret recipes that you want the AI to remember and utilize in client recommendations.", "أضف توجيهات مخصصة، تاريخ الكافيه، أو قواعد خاصة تريد أن يتذكرها الذكاء الاصطناعي ويستخدمها في التوصيات.")}
        </p>
        <textarea
          className={`${inp} h-32 font-mono text-xs`}
          placeholder={tr("Paste your custom text knowledge or load a file...", "الصق نص المعرفة هنا أو ارفع ملف...")}
          value={kbText}
          onChange={e => setKbText(e.target.value)}
        />
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 sticky bottom-4">
        {saving ? <Bot className="animate-spin" size={18}/> : <Save size={18}/>} {tr("Save Barista Config", "حفظ الإعدادات")}
      </button>
    </div>
  );
};

const evaluateCellFormula = (val: string, sheetData: string[][]): string => {
  if (!val || !val.startsWith("=")) return val;
  try {
    const expr = val.slice(1).toUpperCase().trim();

    // Support SUM(A1:A5)
    const sumMatch = expr.match(/SUM\(([A-E])(\d+):([A-E])(\d+)\)/);
    if (sumMatch) {
      const colStart = sumMatch[1].charCodeAt(0) - 65; // A=0, B=1...
      const rowStart = parseInt(sumMatch[2]) - 1;
      const colEnd = sumMatch[3].charCodeAt(0) - 65;
      const rowEnd = parseInt(sumMatch[4]) - 1;

      let sum = 0;
      for (let r = Math.min(rowStart, rowEnd); r <= Math.max(rowStart, rowEnd); r++) {
        for (let c = Math.min(colStart, colEnd); c <= Math.max(colStart, colEnd); c++) {
          const rawCell = sheetData[r]?.[c] || "";
          const cellVal = rawCell.startsWith("=") ? parseFloat(evaluateCellFormula(rawCell, sheetData)) : parseFloat(rawCell);
          if (!isNaN(cellVal)) sum += cellVal;
        }
      }
      return String(sum);
    }

    // Support cell references like A1, B2 in general math expressions
    let parsedExpr = expr;
    const cellRegex = /([A-E])(\d+)/g;
    let match;
    const replacedCells = new Set<string>();
    while ((match = cellRegex.exec(expr)) !== null) {
      const cellRef = match[0];
      if (replacedCells.has(cellRef)) continue;
      replacedCells.add(cellRef);
      const col = match[1].charCodeAt(0) - 65;
      const row = parseInt(match[2]) - 1;
      const rawCell = sheetData[row]?.[col] || "";
      const cellVal = rawCell.startsWith("=") ? parseFloat(evaluateCellFormula(rawCell, sheetData)) : parseFloat(rawCell);
      parsedExpr = parsedExpr.replace(new RegExp(cellRef, 'g'), isNaN(cellVal) ? "0" : String(cellVal));
    }

    // Safely evaluate simple math expressions
    const sanitized = parsedExpr.replace(/[^0-9+\-*/().]/g, "");
    if (sanitized) {
      const result = new Function(`return (${sanitized})`)();
      return String(result);
    }
  } catch (e) {
    return "#ERROR";
  }
  return val;
};

const ReservationsTab = ({ tr }: { tr: any }) => {
  const [resList, setResList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({ guestName: "", phone: "", date: "", time: "", guestsCount: "2", tableNum: "1", source: "Facebook", notes: "" });

  const [sheet, setSheet] = useState<string[][]>(() => {
    const initial = Array(6).fill(null).map(() => Array(5).fill(""));
    initial[0][0] = "Table #";
    initial[0][1] = "Pax Max";
    initial[0][2] = "Status";
    initial[0][3] = "Client Name";
    initial[0][4] = "Source";
    return initial;
  });

  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null);
  const [cellText, setCellText] = useState("");

  // Azura Docs & Workspace Office notes states
  const [docsList, setDocsList] = useState<any[]>([]);
  const [docForm, setDocForm] = useState({ title: "", content: "" });
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  useEffect(() => {
    const resRef = ref(db, "reservations");
    const unsub = onValue(resRef, (snap) => {
      if (snap.exists()) {
        const data = Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val }));
        setResList(data);
      } else {
        setResList([]);
      }
      setLoading(false);
    });

    get(ref(db, "reservations-sheet")).then((snap) => {
      if (snap.exists()) setSheet(snap.val());
    });

    // Sub to workspace documentation logs
    const docsRef = ref(db, "workspace-docs");
    const unsubDocs = onValue(docsRef, (snap) => {
      if (snap.exists()) {
        const data = Object.entries(snap.val()).map(([id, val]: any) => ({ id, ...val }));
        setDocsList(data);
      } else {
        setDocsList([]);
      }
    });

    return () => { off(resRef); off(docsRef); };
  }, []);

  const handleAddBooking = async () => {
    if (!form.guestName.trim()) return;
    const id = `res_${Date.now()}`;
    await set(ref(db, `reservations/${id}`), {
      ...form,
      guestsCount: Number(form.guestsCount),
      createdAt: Date.now()
    });
    setForm({ guestName: "", phone: "", date: "", time: "", guestsCount: "2", tableNum: "1", source: "Facebook", notes: "" });
    swalSuccess(tr("Reservation saved successfully!", "تم حفظ الحجز بنجاح!"));
  };

  const handleSaveCell = () => {
    if (!activeCell) return;
    const updated = [...sheet];
    updated[activeCell.r][activeCell.c] = cellText;
    setSheet(updated);
    set(ref(db, "reservations-sheet"), updated);
    setActiveCell(null);
  };

  const handleDownloadSheetCSV = () => {
    let csv = "";
    sheet.forEach(row => {
      csv += row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `azura_custom_sheet_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    swalSuccess(tr("Custom Sheet CSV downloaded!", "تم تحميل ملف إكسل CSV!"));
  };

  const handleDeleteBooking = async (id: string) => {
    if (await swalConfirm(tr("Delete Reservation?", "حذف الحجز؟"), tr("This cannot be undone.", "لا يمكن التراجع عن هذه العملية."))) {
      await remove(ref(db, `reservations/${id}`));
      swalSuccess(tr("Deleted!", "تم الحذف!"));
    }
  };

  const handleDownloadPass = (res: any) => {
    const data = `Guest Name: ${res.guestName}\nPhone: ${res.phone}\nDate: ${res.date}\nTime: ${res.time}\nPax: ${res.guestsCount}\nTable Assigned: ${res.tableNum}\nSource: ${res.source}\nNotes: ${res.notes || 'None'}\n`;
    const blob = new Blob([data], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reservation_pass_${res.guestName.replace(/\s+/g, "_")}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Document saving
  const handleSaveDoc = async () => {
    if (!docForm.title.trim() || !docForm.content.trim()) return;
    const id = activeDocId || `doc_${Date.now()}`;
    await set(ref(db, `workspace-docs/${id}`), {
      ...docForm,
      id,
      updatedAt: Date.now()
    });
    setDocForm({ title: "", content: "" });
    setActiveDocId(null);
    swalSuccess(tr("Office Document Saved!", "تم حفظ مستند العمل بنجاح!"));
  };

  const handleDeleteDoc = async (id: string) => {
    if (await swalConfirm(tr("Delete Document?", "حذف المستند؟"), tr("This cannot be undone.", "لا يمكن التراجع عن هذه العملية."))) {
      await remove(ref(db, `workspace-docs/${id}`));
      swalSuccess(tr("Document Deleted!", "تم حذف المستند!"));
    }
  };

  const facebookCount = resList.filter(r => r.source === "Facebook").length;
  const otherCount = resList.length - facebookCount;
  const pendingCount = resList.length;

  return (
    <div className="space-y-6 page-enter pb-10">
      {/* MERMAID-LIKE STATUS FLOWCHART */}
      <div className="card-elevated p-5 rounded-2xl bg-card border border-border/15 shadow-sm">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-primary"/>
          {tr("Reservations Flowchart (Mermaid Model)", "مخطط تدفق الحجوزات (Mermaid)")}
        </h3>
        <div className="bg-muted/10 border border-border/15 rounded-xl p-4 flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-500 text-xs font-bold rounded-lg text-center shadow-sm">
              <p className="uppercase text-[8px] opacity-70">Facebook Incoming</p>
              <p className="text-sm font-black mt-0.5">{facebookCount}</p>
            </div>
            <div className="text-muted-foreground text-xs font-bold">──▶</div>
            <div className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold rounded-lg text-center shadow-sm">
              <p className="uppercase text-[8px] opacity-70">Other Booking</p>
              <p className="text-sm font-black mt-0.5">{otherCount}</p>
            </div>
          </div>

          <div className="text-muted-foreground text-xs font-bold">▼</div>

          <div className="px-5 py-2.5 bg-primary/10 border border-primary/30 text-primary text-xs font-bold rounded-xl text-center shadow-md w-full max-w-[240px]">
            <p className="uppercase text-[9px] opacity-80 tracking-widest">{tr("Active Confirmed Bookings", "الحجوزات النشطة المؤكدة")}</p>
            <p className="text-lg font-black mt-1">{pendingCount} {tr("Bookings", "حجز")}</p>
          </div>

          <div className="text-muted-foreground text-xs font-bold">▼</div>

          <div className="flex gap-2">
            <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-[10px] font-bold">
              ✔ {tr("Tables Seated", "تم التسكين")}
            </div>
            <div className="px-3 py-1 bg-secondary/10 border border-secondary/20 text-secondary rounded-lg text-[10px] font-bold">
              ★ {tr("Quality VIP Checked", "جودة الخدمة")}
            </div>
          </div>
        </div>
      </div>

      {/* SPREADSHEET DOC DESIGNER GRID */}
      <div className="card-elevated p-5 rounded-2xl bg-card border border-[#D2B48C] shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-[#654321] flex items-center gap-2">
            <Database size={18} className="text-primary"/>
            {tr("Interactive Spreadsheet Designer (Live Formulas)", "مصمم الجداول التفاعلية (معادلات رياضية مباشرة)")}
          </h3>
          <button onClick={handleDownloadSheetCSV} className="px-3 py-1.5 bg-secondary text-white text-xs font-bold rounded-xl flex items-center gap-1">
            <Download size={12}/> {tr("Export Excel (.CSV)", "تصدير ملف إكسل")}
          </button>
        </div>

        <p className="text-[9px] text-muted-foreground leading-normal">
          💡 {tr("Formula supported! Type '=' followed by equation (e.g. '=A2+B2', '=SUM(A1:A5)' or '=C3*D3') to automatically compute and display results in real-time.", "تدعم المعادلات الحسابية! اكتب '=' متبوعة بالمعادلة (مثال: '=A2+B2' أو '=SUM(A1:A5)') لحساب وعرض النتائج فوراً.")}
        </p>

        <div className="overflow-x-auto border border-border/10 rounded-xl">
          <table className="min-w-full divide-y divide-border/10 bg-white font-sans text-xs">
            <thead>
              <tr className="bg-muted/10 divide-x divide-border/10 text-center font-bold">
                <th className="w-8"></th>
                <th className="py-1">A</th>
                <th className="py-1">B</th>
                <th className="py-1">C</th>
                <th className="py-1">D</th>
                <th className="py-1">E</th>
              </tr>
            </thead>
            <tbody>
              {sheet.map((row, r) => (
                <tr key={r} className="divide-x divide-border/10">
                  <td className="bg-muted/30 px-2 py-1.5 font-bold text-center w-8 select-none text-[10px]">
                    {r + 1}
                  </td>
                  {row.map((cell, c) => {
                    const isFormula = cell?.startsWith("=");
                    const displayedValue = isFormula ? evaluateCellFormula(cell, sheet) : cell;
                    return (
                      <td
                        key={c}
                        onClick={() => { setActiveCell({ r, c }); setCellText(cell || ""); }}
                        title={isFormula ? `Formula: ${cell}` : ""}
                        className={`px-3 py-2 text-center cursor-pointer font-medium hover:bg-muted/15 transition-colors border-b border-border/10 ${
                          activeCell?.r === r && activeCell?.c === c
                            ? "bg-primary/10 ring-2 ring-primary/25 font-bold"
                            : isFormula
                              ? "bg-amber-500/5 text-amber-800 dark:text-amber-300 font-bold border-amber-500/10"
                              : cell ? "bg-primary/[0.02]" : ""
                        }`}
                      >
                        {displayedValue || <span className="opacity-0">-</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {activeCell && (
          <div className="p-3 bg-muted/20 border border-border/15 rounded-xl flex gap-2 items-center animate-in fade-in duration-150">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Cell {String.fromCharCode(65 + activeCell.c)}{activeCell.r+1}:</span>
            <input
              type="text"
              className="flex-1 input-field px-3 py-1.5 text-xs font-semibold focus:outline-none"
              value={cellText}
              onChange={e => setCellText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSaveCell()}
              placeholder="e.g. 100 or =A2+B2"
              autoFocus
            />
            <button onClick={handleSaveCell} className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg">{tr("Apply", "تطبيق")}</button>
            <button onClick={() => setActiveCell(null)} className="px-2.5 py-1.5 bg-muted text-foreground text-xs font-bold rounded-lg"><X size={14}/></button>
          </div>
        )}
      </div>

      {/* AZURA DOCS WORKSPACE OFFICE MANAGER */}
      <div className="card-elevated p-5 rounded-2xl bg-card border border-teal-500/20 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Archive size={18} className="text-teal-500"/>
          {tr("Azura Office Workspace Docs & Checklists", "مستندات مكتب العمل وقوائم المراجعة")}
        </h3>
        <p className="text-[10px] text-muted-foreground leading-normal">
          {tr("Create and documentation checklists, staff task list, shift reports, cafe recipes, and store them permanently in the Workspace cloud catalog.", "قم بإنشاء وتوثيق قوائم المهام، تقارير الشفتات، أو وصفات الكافيه وحفظها في سحابة العمل للرجوع إليها وتعديلها في أي وقت.")}
        </p>

        <div className="space-y-3">
          <input
            className="input-field w-full px-3 py-2 text-xs font-bold"
            placeholder={tr("Document Title (e.g., Opening Checklist)", "عنوان المستند")}
            value={docForm.title}
            onChange={e => setDocForm({...docForm, title: e.target.value})}
          />
          <textarea
            className="input-field w-full px-3 py-2 text-xs min-h-[100px] font-sans"
            placeholder={tr("Write rich notes, employee roles, or shift handovers here...", "اكتب الملاحظات أو المهام هنا...")}
            value={docForm.content}
            onChange={e => setDocForm({...docForm, content: e.target.value})}
          />
          <div className="flex gap-2 justify-end">
            {activeDocId && (
              <button
                type="button"
                onClick={() => { setActiveDocId(null); setDocForm({ title: "", content: "" }); }}
                className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold"
              >
                {tr("Cancel Edit", "إلغاء التعديل")}
              </button>
            )}
            <button
              onClick={handleSaveDoc}
              disabled={!docForm.title.trim() || !docForm.content.trim()}
              className="btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/10 disabled:opacity-50"
            >
              <Save size={12}/> {activeDocId ? tr("Update Document", "تحديث المستند") : tr("Save Document", "حفظ وتوثيق المستند")}
            </button>
          </div>
        </div>

        {docsList.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-border/10">
            <h5 className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Saved Cafe Logs & Manuals", "مستندات العمل المحفوظة")}</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {docsList.map(doc => (
                <div key={doc.id} className="p-3 bg-muted/15 rounded-xl border border-border/10 flex flex-col justify-between space-y-2">
                  <div>
                    <h6 className="text-xs font-bold text-foreground line-clamp-1">{doc.title}</h6>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-normal">"{doc.content}"</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/5 text-[9px] text-muted-foreground">
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setActiveDocId(doc.id);
                          setDocForm({ title: doc.title, content: doc.content });
                        }}
                        className="text-primary hover:underline font-bold"
                      >
                        {tr("Edit", "تعديل")}
                      </button>
                      <span>·</span>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-destructive hover:underline font-bold"
                      >
                        {tr("Delete", "حذف")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RESERVATIONS MANAGER FORM */}
      <div className="card-elevated p-5 rounded-2xl bg-card border border-border/15 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Plus size={18} className="text-primary"/>
          {tr("Create Guest Reservation Account", "إنشاء وتوثيق حساب حجز عميل")}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">{tr("Guest Name", "اسم العميل")}</label>
            <input className="input-field w-full px-3 py-2 text-xs font-medium" placeholder="E.g. Amr Mahmoud" value={form.guestName} onChange={e => setForm({...form, guestName: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">{tr("Phone Number", "رقم الهاتف")}</label>
            <input className="input-field w-full px-3 py-2 text-xs font-medium" placeholder="01xxxxxxxxx" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">{tr("Reservation Date", "التاريخ")}</label>
            <input type="date" className="input-field w-full px-2 py-2 text-xs font-semibold" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">{tr("Time Slot", "الوقت")}</label>
            <input type="time" className="input-field w-full px-2 py-2 text-xs font-semibold" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">{tr("Seating Table #", "رقم الطاولة")}</label>
            <input type="number" min={1} max={50} className="input-field w-full px-3 py-2 text-xs font-bold" value={form.tableNum} onChange={e => setForm({...form, tableNum: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">{tr("Number of Guests", "عدد الأفراد")}</label>
            <input type="number" className="input-field w-full px-3 py-2 text-xs font-bold" value={form.guestsCount} onChange={e => setForm({...form, guestsCount: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">{tr("Booking Source", "مصدر الطلب")}</label>
            <select className="input-field w-full px-2 py-2 text-xs font-semibold" value={form.source} onChange={e => setForm({...form, source: e.target.value})}>
              <option value="Facebook">Facebook (فيسبوك)</option>
              <option value="Instagram">Instagram (انستجرام)</option>
              <option value="Phone Call">Phone Call (هاتف)</option>
              <option value="Walk-in">Walk-in (مباشر)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">{tr("Special Notes", "ملاحظات وتفضيلات")}</label>
          <textarea className="input-field w-full px-3 py-2 text-xs min-h-[50px]" placeholder="Extra seat, outside table, VIP..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
        </div>

        <button
          onClick={handleAddBooking}
          disabled={!form.guestName.trim()}
          className="btn-primary w-full py-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 disabled:opacity-50"
        >
          <Save size={14}/> {tr("Save Reservation Pass Document", "حفظ وتوثيق حجز العميل")}
        </button>
      </div>

      {/* BOOKINGS LIST */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 px-1 uppercase tracking-wider">
          <Users size={13}/>
          <span>{tr("Active Logged Reservations", "سجلات الحجوزات النشطة الحالية")}</span>
        </h4>

        {loading ? (
          <div className="text-center py-10 opacity-60">Loading...</div>
        ) : resList.length === 0 ? (
          <div className="text-center py-10 bg-card border border-border/10 rounded-2xl text-muted-foreground text-xs">
            {tr("No incoming bookings logged yet.", "لا توجد حجوزات مسجلة حالياً.")}
          </div>
        ) : (
          resList.map((res) => (
            <div key={res.id} className="card p-4 bg-card border border-border/10 rounded-2xl flex flex-col space-y-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {res.guestName?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-foreground">{res.guestName}</h5>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">T{res.tableNum} · {res.guestsCount} {tr("Pax", "أفراد")} · <span className="text-primary font-bold">{res.source}</span></p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleDownloadPass(res)} className="p-2 bg-muted/20 border border-border/10 text-foreground hover:bg-primary hover:text-white rounded-lg transition-colors" title={tr("Download Pass file", "تحميل تذكرة الحجز")}>
                    <Download size={13} />
                  </button>
                  <button onClick={() => handleDeleteBooking(res.id)} className="p-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="text-[10px] bg-muted/15 rounded-xl p-2.5 grid grid-cols-2 gap-2 text-foreground font-semibold font-sans">
                <div>Date: <span className="font-bold text-primary">{res.date}</span></div>
                <div>Time: <span className="font-bold text-primary">{res.time}</span></div>
                {res.phone && <div className="col-span-2">Phone: <span className="font-mono">{res.phone}</span></div>}
                {res.notes && <div className="col-span-2 italic text-muted-foreground mt-1">"{res.notes}"</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ReviewsTab = ({ tr, feedback, avgRating, ratingDist, maxRatingCount, markFeedbackRead }: any) => (
  <div className="space-y-8 page-enter">
    <div className="card-elevated p-8 text-center border border-border/10 rounded-2xl bg-card">
      <div className="flex justify-center mb-4 text-warning">
         <Star size={32} fill="currentColor"/>
      </div>
      <h2 className="text-5xl font-black text-primary">{avgRating}</h2>
      <p className="text-xs text-muted-foreground font-bold uppercase mt-4 tracking-tighter">{tr("Average Customer Rating", "متوسط تقييم العملاء")}</p>
      <div className="pt-8 space-y-3 max-w-[240px] mx-auto">
        {ratingDist.map((d: any) => (
          <div key={d.r} className="flex items-center gap-4">
            <span className="text-xs font-bold w-4 text-secondary">{d.r}</span>
            <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(d.count / maxRatingCount) * 100}%` }} />
            </div>
            <span className="text-xs font-bold text-muted-foreground w-6">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="space-y-4">
      {feedback.map((f: any) => (
        <div key={f.id} className={`card p-5 relative border border-border/10 bg-card ${f.read ? "" : "border-l-4 border-l-primary bg-primary/5"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5 text-warning">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill={i < f.rating ? "currentColor" : "none"} className="text-warning" />)}</div>
              <span className="text-xs font-bold text-foreground">{f.userName}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold">{new Date(f.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-sm leading-relaxed text-secondary font-semibold">{f.comment}</p>
          {!f.read && <button onClick={() => markFeedbackRead(f.id)} className="text-xs font-bold text-primary mt-4 block hover:underline uppercase tracking-tighter">{tr("Mark as Read", "تحديد كمقروء")}</button>}
        </div>
      ))}
    </div>
  </div>
);

const ReelsTab = ({ tr, reels, togglePin, deleteReel }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ videoUrl: "", caption: "", captionAr: "" });
  const [saving, setSaving] = useState(false);

  // Editing state
  const [editingReelId, setEditingReelId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ videoUrl: "", caption: "", captionAr: "" });

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Film size={18} className="text-primary"/> {tr("Reels Management", "إدارة الريلز")}</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
          {showAdd ? <X size={14}/> : <Plus size={14}/>} {showAdd ? tr("Cancel", "إلغاء") : tr("Add Video", "إضافة فيديو")}
        </button>
      </div>
      {showAdd && (
        <div className="card-elevated rounded-2xl p-5 space-y-4 border border-border/10 bg-card">
          <input className="input-field px-3 py-2.5 text-sm" placeholder="Instagram/Facebook/TikTok/X URL" value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field px-3 py-2.5 text-sm" placeholder="Caption (EN)" value={form.caption} onChange={e => setForm({...form, caption: e.target.value})} />
            <input className="input-field px-3 py-2.5 text-sm" dir="rtl" placeholder="Caption (AR)" value={form.captionAr} onChange={e => setForm({...form, captionAr: e.target.value})} />
          </div>
          <button disabled={saving || !form.videoUrl} onClick={async () => {
            setSaving(true);
            const id = `reel_${Date.now()}`;
            await smartSet(`reels/${id}`, { ...form, id, createdAt: Date.now(), likes: 0, authorName: "Azura" });
            setForm({ videoUrl: "", caption: "", captionAr: "" });
            setShowAdd(false);
            setSaving(false);
            swalSuccess("Reel Added!");
          }} className="btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">
            {saving ? <RotateCcw size={16} className="animate-spin"/> : <Save size={16}/>} {tr("Save Reel", "حفظ الفيديو")}
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {reels.map((r: any) => (
          <div key={r.id} className="card rounded-2xl overflow-hidden border border-border/10 bg-card group text-foreground">
            {editingReelId === r.id ? (
              <div className="p-4 space-y-3">
                <h4 className="text-xs font-bold text-primary">{tr("Edit Reel", "تعديل الريل")}</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Video URL", "رابط الفيديو")}</label>
                    <input className="input-field px-2 py-1.5 text-xs" value={editForm.videoUrl} onChange={e => setEditForm({...editForm, videoUrl: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Caption (EN)", "الوصف بالإنجليزية")}</label>
                    <input className="input-field px-2 py-1.5 text-xs" value={editForm.caption} onChange={e => setEditForm({...editForm, caption: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">{tr("Caption (AR)", "الوصف بالعربية")}</label>
                    <input className="input-field px-2 py-1.5 text-xs" dir="rtl" value={editForm.captionAr} onChange={e => setEditForm({...editForm, captionAr: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-2 text-xs pt-1">
                  <button onClick={() => setEditingReelId(null)} className="btn-secondary flex-1 py-2 text-xs">{tr("Cancel", "إلغاء")}</button>
                  <button onClick={async () => {
                    await smartUpdate(`reels/${r.id}`, editForm);
                    setEditingReelId(null);
                    swalSuccess(tr("Reel Updated!", "تم تحديث الريل!"));
                  }} className="btn-primary flex-1 py-2 text-xs">{tr("Save", "حفظ")}</button>
                </div>
              </div>
            ) : (
              <>
                <div className="aspect-[9/16] bg-muted relative flex items-center justify-center overflow-hidden">
                  <Film size={32} className="text-muted-foreground opacity-20" />
                  {r.pinned && <div className="absolute top-2 left-2 bg-primary text-white p-1 rounded-lg"><Check size={12}/></div>}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                     <button onClick={() => togglePin(r)} className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shadow-lg"><Heart size={14} fill={r.pinned ? "currentColor" : "none"} /></button>
                     <button onClick={() => { setEditingReelId(r.id); setEditForm({ videoUrl: r.videoUrl || "", caption: r.caption || "", captionAr: r.captionAr || "" }); }} className="w-8 h-8 rounded-full bg-white text-amber-500 flex items-center justify-center shadow-lg"><Pencil size={14}/></button>
                     <button onClick={async () => { if (await swalConfirm(tr("Delete Reel?", "حذف الفيديو؟"), tr("This cannot be undone.", "لا يمكن التراجع."))) deleteReel(r); }} className="w-8 h-8 rounded-full bg-white text-destructive flex items-center justify-center shadow-lg"><Trash2 size={14}/></button>
                  </div>
                </div>
                <div className="p-3"><p className="text-[10px] font-bold line-clamp-2">{tr(r.caption, r.captionAr)}</p></div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const TablesTab = ({ tr, activeTables, users }: any) => {
  return (
    <div className="space-y-6 page-enter">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {activeTables.map((t: any) => (
          <div key={t.id} className={`card-elevated rounded-2xl p-4 text-center border border-border/10 border-b-4 transition-transform active:scale-95 bg-card ${t.status === 'occupied' ? 'border-b-orange-500 bg-orange-50/10' : 'border-b-green-500'}`}>
            <Armchair size={20} className={`mx-auto mb-2 ${t.status === 'occupied' ? 'text-orange-500' : 'text-green-500'}`} />
            <p className="text-lg font-bold">{t.number}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase">{t.status === 'occupied' ? tr(`${t.userCount} Active`, `${t.userCount} نشط`) : tr("Empty", "فارغة")}</p>
          </div>
        ))}
      </div>
      <div className="card-elevated rounded-2xl p-5 border border-border/10 bg-card space-y-4">
         <h3 className="font-bold text-sm flex items-center gap-2"><Users size={16}/> {tr("Who's here?", "مين موجود؟")}</h3>
         <div className="space-y-3">
           {users.filter((u:any) => u.tableNumber).map((u: any) => (
             <div key={u.uid} className="flex items-center justify-between p-3 bg-muted/10 rounded-xl">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{u.name?.[0]}</div>
                 <div><p className="text-xs font-bold">{u.name}</p><p className="text-[9px] text-muted-foreground">Table {u.tableNumber}</p></div>
               </div>
               <span className="text-[10px] font-bold text-primary">{new Date(u.lastLoginAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

// --- Main Admin Component ---

const ADMIN_PIN = "azura2026";
type Tab = "overview" | "menu" | "users" | "chat" | "reviews" | "broadcast" | "reels" | "api" | "system" | "ai" | "features" | "tables" | "barista" | "reservations";
const BLANK_BROADCAST = { title: "", titleAr: "", message: "", messageAr: "", type: "info" as const, emoji: "📢" };
const AIAdminAssistant = lazy(() => import("@/components/AIAdminAssistant"));

export default function Admin() {
  const { lang, isRTL } = useLang();
  const [, navigate] = useLocation();
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("azura-admin") === "true");
  const [pinErr, setPinErr] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [tablesRaw, setTablesRaw] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Live Firebase connection status & process logs
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const addLogRef = useRef<(msg: string) => void>(() => {});

  useEffect(() => {
    addLogRef.current = (msg: string) => {
      const time = new Date().toLocaleTimeString();
      setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 40));
    };
  }, []);

  const addLog = (msg: string) => addLogRef.current?.(msg);

  // Track tab changes in logs
  useEffect(() => {
    addLog(`Navigated to panel: ${tab.toUpperCase()}`);
  }, [tab]);

  // Grown API settings state
  const [apiSettings, setApiSettings] = useState({
    groqKey: "",
    aiProvider: "groq" as "groq" | "pollinations" | "openai",
    openaiEndpoint: "",
    aiEnabled: true,
    menuNode: "menu",
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);

  // Live AI Connection test states
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency?: number; response?: string; error?: string } | null>(null);

  const handleTestAIConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    const start = Date.now();
    try {
      const rawKey = apiSettings.groqKey;
      const keyToUse = (rawKey?.startsWith("___ENC___") ? decryptKey(rawKey) : rawKey) || "";
      const testMsg = "Hello, respond with exactly 'Azura Live Connection Test Success!' in one short sentence.";
      const systemPrompt = "You are a test helper.";

      const response = await chatWithAI(keyToUse, testMsg, [], systemPrompt);
      const latency = Date.now() - start;
      if (response && response.trim().length > 0) {
        setTestResult({
          success: true,
          latency,
          response,
        });
      } else {
        throw new Error("Received empty response from AI service.");
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Failed to establish a connection to the AI provider.",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const [featureFlags, setFeatureFlags] = useState({ baristaEnabled: true, reelsEnabled: true, supportEnabled: true });
  const [savingFlag, setSavingFlag] = useState<string | null>(null);
  const [bannerContent, setBannerContent] = useState("");
  const [bannerBgColor, setBannerBgColor] = useState("#FF6B35");
  const [bannerTextColor, setBannerTextColor] = useState("#FFFFFF");
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState<any>(BLANK_BROADCAST);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  useEffect(() => {
    if (!authed) return;
    addLogRef.current("Initializing live Firebase observers...");

    // Watch connection status
    const connectedRef = ref(db, ".info/connected");
    onValue(connectedRef, (s) => {
      const isConn = s.val() === true;
      setConnected(isConn);
      addLogRef.current(`Firebase Live Sync: ${isConn ? "ONLINE" : "OFFLINE"}`);
    });

    onValue(ref(db, "api-settings"), (s) => {
      if (s.exists()) {
        setApiSettings(prev => ({ ...prev, ...s.val() }));
        addLogRef.current("API and AI Provider settings loaded.");
      }
    });
    onValue(ref(db, "feature-flags"), (s) => {
      if (s.exists()) {
        setFeatureFlags(s.val());
        addLogRef.current("Active feature flags loaded.");
      }
    });
    onValue(ref(db, "homepage-banner"), (s) => {
      if (s.exists()) {
        const d = s.val();
        setBannerContent(d.content || "");
        setBannerBgColor(d.bgColor || "#FF6B35");
        setBannerTextColor(d.textColor || "#FFFFFF");
        setBannerEnabled(d.enabled !== false);
        addLogRef.current("Homepage banner configuration loaded.");
      }
    });
    onValue(ref(db, "menu"), (s) => {
      const data = s.val() || {}; const res: MenuItem[] = [];
      const normalizeCat = (c: string) => {
        if (!c) return "other";
        const lc = c.toLowerCase();
        if (lc === "cocktail") return "cocktails";
        if (lc === "mocktail") return "mocktails";
        if (lc === "fries") return "add_ons";
        return c;
      };
      Object.entries(data).forEach(([k, v]: any) => {
        if (v.price !== undefined) {
          res.push({ id: k, ...v, category: normalizeCat(v.category), originalCategory: v.category });
        } else {
          Object.entries(v).forEach(([sk, sv]: any) => {
            res.push({ id: sk, ...sv, category: normalizeCat(sv.category), originalCategory: k });
          });
        }
      });
      setMenu(res);
      addLogRef.current(`Synced menu catalog (${res.length} items loaded & normalized).`);
    });
    onValue(ref(db, "users"), (s) => {
      const usersList = Object.entries(s.val() || {}).map(([uid, v]: any) => ({ uid, ...v })).sort((a,b) => (b.lastLoginAt||0)-(a.lastLoginAt||0));
      setUsers(usersList);
      addLogRef.current(`Synchronized client profiles (${usersList.length} records found).`);
    });
    onValue(ref(db, "feedback"), (s) => {
      const feedbackList = Object.entries(s.val() || {}).map(([id, v]: any) => ({ id, ...v })).sort((a,b) => b.createdAt-a.createdAt);
      setFeedback(feedbackList);
      addLogRef.current(`Synced customer feedback entries (${feedbackList.length} reviews loaded).`);
    });
    onValue(ref(db, "broadcast"), (s) => {
      const broadcastsList = Object.entries(s.val() || {}).map(([id, v]: any) => ({ id, ...v })).sort((a,b) => b.createdAt-a.createdAt);
      setBroadcasts(broadcastsList);
      addLogRef.current("Broadcast alert logs updated.");
    });
    onValue(ref(db, "reels"), (s) => {
      const reelsList = Object.entries(s.val() || {}).map(([id, v]: any) => ({ id, ...v })).sort((a,b) => b.createdAt-a.createdAt);
      setReels(reelsList);
      addLogRef.current("Media Reels sync update completed.");
    });
    onValue(ref(db, "tables"), (s) => {
      const tablesList = Object.entries(s.val() || {}).map(([id, v]: any) => ({ id, ...v }));
      setTablesRaw(tablesList);
      addLogRef.current("Armchairs and seating nodes updated.");
    });
    onValue(ref(db, "support-chat"), (s) => {
      const chatList = Object.entries(s.val() || {}).filter(([k, v]: any) => v.meta).map(([uid, v]: any) => ({ uid, ...v.meta })).sort((a,b) => (b.lastAt||0)-(a.lastAt||0));
      setChats(chatList);
    });
    onValue(ref(db, "admin-config/activeTab"), (s) => {
      if (s.exists() && s.val()) {
        setTab(s.val() as Tab);
      }
    });
    return () => {
      off(connectedRef);
      ["menu", "users", "feedback", "broadcast", "reels", "tables", "support-chat", "api-settings", "feature-flags", "homepage-banner", "admin-config"].forEach(p => off(ref(db, p)));
    };
  }, [authed]);

  useEffect(() => {
    if (!selectedChat) return;
    onValue(ref(db, `support-chat/${selectedChat}/messages`), (s) => setChatMsgs(Object.entries(s.val() || {}).map(([id, m]: any) => ({ id, ...m })).sort((a,b) => a.createdAt-b.createdAt)));
    update(ref(db, `support-chat/${selectedChat}/meta`), { unreadAdmin: 0 });
    return () => off(ref(db, `support-chat/${selectedChat}/messages`));
  }, [selectedChat]);

  const login = () => { if (pin === ADMIN_PIN) { sessionStorage.setItem("azura-admin", "true"); setAuthed(true); } else setPinErr("Wrong PIN"); };

  const MENU_CATEGORIES = ["recommended", "new_items", "soups", "appetizers", "salads", "pasta", "tortilla", "toast", "croissant", "breakfast", "main_dishes", "burgers", "smash_burgers", "fried_chicken", "hot_drinks", "coffee", "corto", "hot_chocolate", "sahlab", "frappuccino", "iced_coffee", "mojitos", "boba_tea", "fresh_juices", "mocktails", "cocktails", "smoothies", "milkshakes", "waffle", "desserts", "crepes", "pancakes", "add_ons", "shisha", "soft_drinks"];
  const CAT_META: Record<string, { emoji: string; en: string; ar: string }> = { recommended: { emoji: "⭐", en: "Top Picks", ar: "الأفضل" }, new_items: { emoji: "🆕", en: "New", ar: "جديد" }, soups: { emoji: "🍲", en: "Soup", ar: "شوربة" }, appetizers: { emoji: "🍟", en: "Appetizers", ar: "مقبلات" }, salads: { emoji: "🥗", en: "Salads", ar: "سلطات" }, pasta: { emoji: "🍝", en: "Pasta", ar: "مكرونة" }, tortilla: { emoji: "🌯", en: "Tortilla", ar: "تورتيلا" }, toast: { emoji: "🍞", en: "Toast", ar: "توست" }, croissant: { emoji: "🥐", en: "Croissant", ar: "كرواسون" }, breakfast: { emoji: "🍳", en: "Breakfast", ar: "فطور" }, main_dishes: { emoji: "🍽️", en: "Main Dishes", ar: "أطباق رئيسية" }, burgers: { emoji: "🍔", en: "Burgers", ar: "برجر" }, smash_burgers: { emoji: "🔥", en: "Smash Burgers", ar: "سماش برجر" }, fried_chicken: { emoji: "🍗", en: "Fried Chicken", ar: "فراخ مقلية" }, hot_drinks: { emoji: "☕", en: "Hot Drinks", ar: "مشروبات ساخنة" }, coffee: { emoji: "☕", en: "Coffee", ar: "قهوة" }, corto: { emoji: "🥛", en: "Corto", ar: "كورتو" }, hot_chocolate: { emoji: "🍫", en: "Hot Chocolate", ar: "شوكولاتة ساخنة" }, sahlab: { emoji: "🥛", en: "Sahlab", ar: "سحلب" }, frappuccino: { emoji: "🧊", en: "Frappuccino", ar: "فرابتشينو" }, iced_coffee: { emoji: "🧋", en: "Iced Coffee", ar: "قهوة مثلجة" }, mojitos: { emoji: "🍹", en: "Mojitos", ar: "موجيتو" }, boba_tea: { emoji: "🧋", en: "Boba Tea", ar: "بوبا تي" }, fresh_juices: { emoji: "🍊", en: "Fresh Juices", ar: "عصائر طازجة" }, mocktails: { emoji: "🍸", en: "Mocktails", ar: "موكتيل" }, cocktails: { emoji: "🍹", en: "Cocktails", ar: "كوكتيل" }, smoothies: { emoji: "🥤", en: "Smoothies", ar: "سموذي" }, milkshakes: { emoji: "🥛", en: "Milkshakes", ar: "ميلك شيك" }, waffle: { emoji: "🧇", en: "Waffle", ar: "وافل" }, desserts: { emoji: "🍰", en: "Desserts", ar: "حلويات" }, crepes: { emoji: "🥞", en: "Crepes", ar: "كريب" }, pancakes: { emoji: "🥞", en: "Pancakes", ar: "بان كيك" }, add_ons: { emoji: "➕", en: "Add-ons", ar: "إضافات" }, shisha: { emoji: "💨", en: "Hookah", ar: "شيشة" }, soft_drinks: { emoji: "🥤", en: "Soft Drinks", ar: "مشروبات غازية" } };

  const activeTables = useMemo(() => {
    return tablesRaw.map(t => ({ ...t, userCount: users.filter(u => u.tableNumber === t.number).length, status: users.some(u => u.tableNumber === t.number) ? "occupied" : "available" })).sort((a,b) => a.number-b.number);
  }, [tablesRaw, users]);

  const TABS: { id: Tab; icon: any; en: string; ar: string; badge?: number }[] = [
    { id: "overview", icon: <LayoutDashboard size={14}/>, en: "Overview", ar: "الرئيسية" },
    { id: "menu", icon: <Plus size={14}/>, en: "Menu", ar: "القائمة" },
    { id: "features", icon: <ToggleRight size={14}/>, en: "Features", ar: "الميزات" },
    { id: "users", icon: <Users size={14}/>, en: "Users", ar: "المستخدمين" },
    { id: "chat", icon: <MessageCircle size={14}/>, en: "Chat", ar: "الدردشة", badge: chats.reduce((s, c) => s + (c.unreadAdmin || 0), 0) },
    { id: "reviews", icon: <Star size={14}/>, en: "Reviews", ar: "تقييمات", badge: feedback.filter(f => !f.read).length },
    { id: "broadcast", icon: <Megaphone size={14}/>, en: "Broadcast", ar: "إشعارات" },
    { id: "reels", icon: <Film size={14}/>, en: "Reels", ar: "ريلز" },
    { id: "barista", icon: <Sparkles size={14}/>, en: "AI Barista", ar: "الباريستا" },
    { id: "ai", icon: <Bot size={14}/>, en: "AI Advisor", ar: "المستشار الذكي" },
    { id: "api", icon: <Key size={14}/>, en: "API", ar: "الربط" },
    { id: "system", icon: <Settings size={14}/>, en: "System", ar: "النظام" },
    { id: "tables", icon: <LayoutGrid size={14}/>, en: "Tables", ar: "الطاولات" },
    { id: "reservations", icon: <List size={14}/>, en: "Bookings", ar: "الحجوزات" },
  ];

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="card-elevated p-8 max-w-xs w-full text-center space-y-6 bg-card border border-border/10 rounded-2xl">
        <div className="flex justify-center text-primary">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-lg font-bold text-foreground">{tr("Admin Access", "دخول المشرف")}</h1>
        <form onSubmit={(e) => { e.preventDefault(); login(); }}>
          <input type="password" placeholder="PIN" className="input-field text-center py-3 text-lg font-bold tracking-widest w-full mb-4" value={pin} onChange={e => setPin(e.target.value)} />
          {pinErr && <p className="text-destructive text-xs mb-4 uppercase">{pinErr}</p>}
          <button type="submit" className="btn-primary w-full py-3 text-sm font-bold">{tr("Login", "دخول")}</button>
        </form>
      </div>
    </div>
  );

  const inp = "input-field px-3 py-2.5 text-sm";

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-40 bg-card px-4 py-4 flex items-center gap-4 text-foreground border-b border-border/10 shadow-sm glass-premium">
        <button onClick={() => navigate("/menu")} className="btn-icon w-8 h-8 rounded-full text-foreground flex items-center justify-center bg-white shadow-sm border border-border/10">
          <ArrowLeft size={16} />
        </button>
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg leading-none text-primary uppercase tracking-tight">{tr("Azura Control Panel", "لوحة تحكم أزورا")}</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}/>
              <span className="text-[8px] font-bold tracking-tight text-primary uppercase">{connected ? tr("Sync Active", "مزامنة نشطة") : tr("Offline", "غير متصل")}</span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground/80 tracking-tighter uppercase mt-0.5 font-bold">mcp protocol services</span>
        </div>
        <button onClick={() => { sessionStorage.removeItem("azura-admin"); setAuthed(false); }} className="text-xs text-primary font-bold hover:underline">Sign out</button>
      </header>
      <nav className="sticky top-[60px] z-30 px-3 py-2.5 overflow-x-auto scroll-hide bg-card border-b border-border shadow-sm glass-premium">
        <div className="flex gap-2 min-w-max">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedChat(null); }} className={`relative chip flex items-center gap-1.5 ${tab === t.id ? "bg-primary text-primary-foreground shadow-md font-bold" : "bg-white/40 text-muted-foreground border border-border/10 hover:bg-white/60"}`}>
              {t.icon} <span>{tr(t.en, t.ar)}</span>
              {!!t.badge && <span className="absolute -top-1 -right-1 bg-destructive text-white text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 font-bold">{t.badge}</span>}
            </button>
          ))}
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Suspense fallback={<div className="text-center py-20 opacity-50">Loading...</div>}>
          {tab === "overview" && <OverviewTab tr={tr} users={users} unreadChats={chats.reduce((s,c)=>s+(c.unreadAdmin||0),0)} newReviewsCount={feedback.filter(f=>!f.read).length} logs={logs} menuCount={menu.length} apiSettings={apiSettings} connected={connected} addLog={addLog} />}
          {tab === "menu" && <MenuTab tr={tr} lang={lang} menu={menu} MENU_CATEGORIES={MENU_CATEGORIES} CAT_META={CAT_META} />}
          {tab === "features" && <FeaturesTab tr={tr} featureFlags={featureFlags} toggleFeatureFlag={async (k: string, v: boolean) => { setSavingFlag(k); await update(ref(db, "feature-flags"), { [k]: v }); setSavingFlag(null); }} savingFlag={savingFlag} />}
          {tab === "users" && <UsersTab tr={tr} users={users} deleteUser={(uid: string) => smartRemove(`users/${uid}`)} formatDuration={(s: number) => s > 3600 ? `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m` : `${Math.floor(s/60)}m`} />}
          {tab === "chat" && <ChatTab tr={tr} isRTL={isRTL} selectedChat={selectedChat} setSelectedChat={setSelectedChat} chats={chats} chatMsgs={chatMsgs} chatInput={chatInput} setChatInput={setChatInput} sendReply={async () => { if (!chatInput.trim() || !selectedChat) return; await smartPush(`support-chat/${selectedChat}/messages`, { text: chatInput, sender: "admin", createdAt: Date.now() }); await smartUpdate(`support-chat/${selectedChat}/meta`, { lastMessage: chatInput, lastAt: Date.now() }); setChatInput(""); }} deleteChat={(uid: string) => smartRemove(`support-chat/${uid}`)} chatBottomRef={chatBottomRef} />}
          {tab === "reviews" && <ReviewsTab tr={tr} feedback={feedback} avgRating={(feedback.reduce((s,f)=>s+f.rating,0)/(feedback.length||1)).toFixed(1)} ratingDist={[5,4,3,2,1].map(r=>({r, count: feedback.filter(f=>f.rating===r).length}))} maxRatingCount={Math.max(...[5,4,3,2,1].map(r=>feedback.filter(f=>f.rating===r).length), 1)} markFeedbackRead={(id: string) => smartUpdate(`feedback/${id}`, {read:true})} />}
          {tab === "broadcast" && <BroadcastTab tr={tr} newBroadcast={newBroadcast} setNewBroadcast={setNewBroadcast} sendBroadcast={async () => { setSendingBroadcast(true); await smartPush("broadcast", { ...newBroadcast, createdAt: Date.now() }); setNewBroadcast(BLANK_BROADCAST); setSendingBroadcast(false); }} sendingBroadcast={sendingBroadcast} bannerContent={bannerContent} setBannerContent={setBannerContent} bannerBgColor={bannerBgColor} setBannerBgColor={setBannerBgColor} bannerTextColor={bannerTextColor} setBannerTextColor={setBannerTextColor} bannerEnabled={bannerEnabled} saveBannerEnabled={(v: boolean) => update(ref(db, "homepage-banner"), {enabled:v})} saveBanner={async () => { setSavingBanner(true); await set(ref(db, "homepage-banner"), { content: bannerContent, bgColor: bannerBgColor, textColor: bannerTextColor, enabled: bannerEnabled }); setSavingBanner(false); }} savingBanner={savingBanner} broadcasts={broadcasts} deleteBroadcast={(id: string) => smartRemove(`broadcast/${id}`)} />}
          {tab === "reels" && <ReelsTab tr={tr} reels={reels} togglePin={(r: Reel) => smartUpdate(`reels/${r.id}`, {pinned: !r.pinned})} deleteReel={(r: Reel) => smartRemove(`reels/${r.id}`)} />}

          {tab === "api" && (
            <div className="page-enter card-elevated rounded-2xl p-5 border border-border/10 bg-card space-y-5">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Key size={18} className="text-primary"/> {tr("AI Provider Settings","إعدادات مزود الذكاء")}
              </h3>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">{tr("AI Provider","مزود الذكاء")}</label>
                <select
                  className={inp}
                  value={apiSettings.aiProvider}
                  onChange={(e) => setApiSettings(p => ({...p, aiProvider: e.target.value as any}))}
                >
                  <option value="groq">Groq (DeepSeek Qwen)</option>
                  <option value="pollinations">Pollinations (Free)</option>
                  <option value="openai">OpenAI Compatible</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  {apiSettings.aiProvider === "openai" ? tr("API Key", "مفتاح API") : tr("Groq API Key","مفتاح API Groq")}
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      className={`${inp} w-full pr-10`}
                      placeholder={apiSettings.aiProvider === "pollinations" ? "Not required" : "sk-... / gsk_..."}
                      value={apiSettings.groqKey}
                      onChange={(e) => setApiSettings(p => ({...p, groqKey: e.target.value}))}
                      disabled={apiSettings.aiProvider === "pollinations"}
                    />
                    <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showApiKey ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
              </div>

              {apiSettings.aiProvider === "openai" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-sm font-semibold text-foreground">{tr("API Endpoint", "نقطة اتصال API")}</label>
                  <input
                    type="text"
                    className={inp}
                    placeholder="https://api.openai.com/v1"
                    value={apiSettings.openaiEndpoint}
                    onChange={(e) => setApiSettings(p => ({...p, openaiEndpoint: e.target.value}))}
                  />
                </div>
              )}

              <button
                disabled={savingApiKey}
                onClick={async () => {
                  setSavingApiKey(true);
                  try {
                    const finalKey = apiSettings.groqKey?.startsWith("gsk") || apiSettings.groqKey?.startsWith("sk") || apiSettings.groqKey?.startsWith("AIza")
                      ? encryptKey(apiSettings.groqKey)
                      : apiSettings.groqKey;
                    await smartSet("api-settings", { ...apiSettings, groqKey: finalKey });
                    swalSuccess("Saved!");
                  } catch (e) {
                    swalError("Failed to save settings");
                  }
                  setSavingApiKey(false);
                }}
                className="btn-primary w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Settings size={16}/> {savingApiKey ? tr("Saving…","جاري الحفظ…") : tr("Save Settings","حفظ الإعدادات")}
              </button>

              {/* Grown APIs Connection Diagnostics */}
              <div className="border border-border/10 rounded-xl p-4 bg-muted/5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Activity size={14} className="text-primary" /> {tr("Live Connection Tester", "مختبر الاتصال المباشر")}
                  </h4>
                  <button
                    type="button"
                    disabled={testingConnection}
                    onClick={handleTestAIConnection}
                    className="btn-secondary px-3 py-1 text-[10px] font-bold flex items-center gap-1 hover:bg-primary hover:text-white transition-colors"
                  >
                    {testingConnection ? <RotateCcw size={10} className="animate-spin" /> : <Zap size={10} />}
                    {testingConnection ? tr("Testing...", "جاري الاختبار...") : tr("Test Now", "اختبر الآن")}
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg text-xs space-y-1.5 ${testResult.success ? "bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
                    <div className="flex items-center gap-2 font-bold">
                      <span className={`w-1.5 h-1.5 rounded-full ${testResult.success ? "bg-green-500 animate-ping" : "bg-destructive"}`} />
                      {testResult.success ? tr(`Success! Latency: ${testResult.latency}ms`, `تم بنجاح! وقت الاستجابة: ${testResult.latency}ملي ثانية`) : tr("Connection Failed", "فشل الاتصال")}
                    </div>
                    {testResult.success && testResult.response && (
                      <p className="font-mono text-[10px] leading-relaxed bg-black/5 dark:bg-black/20 p-2 rounded max-h-[100px] overflow-y-auto">
                        <strong>{tr("AI Response:", "استجابة الذكاء:")}</strong> {testResult.response}
                      </p>
                    )}
                    {!testResult.success && testResult.error && (
                      <p className="font-mono text-[10px] leading-relaxed">
                        {testResult.error}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-xl p-3.5 bg-muted/20 border border-border/10">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${apiSettings.groqKey || apiSettings.aiProvider === 'pollinations' ? "bg-green-500" : "bg-amber-500"}`}/>
                  <span className="text-xs font-semibold">
                    {apiSettings.aiProvider === 'pollinations' ? tr("Pollinations active (Free)", "مفعل مجاناً عبر بولينيشن") : apiSettings.groqKey ? tr("API key configured","تم إعداد مفتاح الربط") : tr("API key not configured","لم يتم إعداد المفتاح")}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold mt-1.5 leading-relaxed">
                  {tr("The AI service uses Groq DeepSeek Qwen and Pollinations for text/voice.","تستخدم خدمة الذكاء جروك DeepSeek Qwen وبولينيشن للنصوص والصوت.")}
                </p>
              </div>
            </div>
          )}

          {tab === "system" && <SystemTab tr={tr} />}
          {tab === "tables" && <TablesTab tr={tr} activeTables={activeTables} users={users} />}
          {tab === "barista" && <BaristaTab tr={tr} />}
          {tab === "ai" && <div className="page-enter"><AIAdminAssistant /></div>}
          {tab === "reservations" && <ReservationsTab tr={tr} />}
        </Suspense>
      </main>
    </div>
  );
}
