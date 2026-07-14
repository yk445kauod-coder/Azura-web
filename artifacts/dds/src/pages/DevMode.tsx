import { useState, useEffect } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { db, ref, get, set, update, remove } from "@/lib/firebase";
import { verifyDeveloperCode, getAllSubscriptions, blockFreeUser, type LicenseType } from "@/lib/activation";
import { Shield, Users, Key, AlertTriangle, Check, X, RefreshCw, Search, Trash2, Ban, Crown, Calendar, Clock } from "lucide-react";

export default function DevMode() {
  const { lang, isRTL } = useLang();
  const [, navigate] = useLocation();
  const [verified, setVerified] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Dashboard state
  const [subscriptions, setSubscriptions] = useState<Record<string, any>[]>([]);
  const [blocklist, setBlocklist] = useState<Record<string, any>[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'blocklist' | 'stats'>('subscriptions');

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  const handleVerify = () => {
    if (verifyDeveloperCode(code)) {
      setVerified(true);
      loadDashboardData();
    } else {
      setError(tr("Invalid developer code.", "رمز المطور غير صحيح."));
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load subscriptions
      const subs = await getAllSubscriptions();
      setSubscriptions(subs);

      // Load blocklist
      const blockSnap = await get(ref(db, 'blocklist'));
      if (blockSnap.exists()) {
        const blockData = blockSnap.val();
        setBlocklist(Object.values(blockData));
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (email: string) => {
    if (confirm(tr("Are you sure you want to block this user?", "هل أنت متأكد من حظر هذا المستخدم؟"))) {
      const success = await blockFreeUser(email);
      if (success) {
        loadDashboardData();
      }
    }
  };

  const handleDeleteSubscription = async (email: string) => {
    if (confirm(tr("Are you sure you want to delete this subscription?", "هل أنت متأكد من حذف هذا الاشتراك؟"))) {
      const safeEmail = email.replace(/[.#$\[\]]/g, '_');
      await remove(ref(db, `subscriptions/${safeEmail}`));
      loadDashboardData();
    }
  };

  const handleUnblockUser = async (email: string) => {
    const safeEmail = email.replace(/[.#$\[\]]/g, '_');
    await remove(ref(db, `blocklist/${safeEmail}`));
    loadDashboardData();
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return tr("Lifetime", "مدى الحياة");
    return new Date(timestamp).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
  };

  const getLicenseBadge = (type: LicenseType) => {
    const colors: Record<LicenseType, string> = {
      'DDS': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'DDSM': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'DDSY': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'DDD': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'DDW': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      'DDF': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    };
    return colors[type] || colors['DDF'];
  };

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.licenseType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    lifetime: subscriptions.filter(s => s.licenseType === 'DDS').length,
    monthly: subscriptions.filter(s => s.licenseType === 'DDSM').length,
    yearly: subscriptions.filter(s => s.licenseType === 'DDSY').length,
    free: subscriptions.filter(s => s.licenseType === 'DDF').length
  };

  if (!verified) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-red-500/20">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">
              {tr("Developer Mode", "وضع المطور")}
            </h1>
            <p className="text-slate-400 text-sm">
              {tr("Enter your developer access code to continue.", "أدخل رمز الوصول للمطور للمتابعة.")}
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  {tr("Developer Code", "رمز المطور")}
                </label>
                <input
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all font-mono text-center text-lg tracking-widest"
                  placeholder="DDS-DEV-XXXXXXXX"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleVerify}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all"
              >
                {tr("Access Developer Mode", "الوصول لوضع المطور")}
              </button>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full text-center text-slate-500 hover:text-white text-sm transition-colors"
          >
            {tr("← Back to Home", "← العودة للرئيسية")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-white text-sm">{tr("Developer Dashboard", "لوحة تحكم المطور")}</h1>
              <p className="text-[10px] text-red-400 uppercase tracking-widest">{tr("DDS Platform Control", "تحكم منصة DDS")}</p>
            </div>
          </div>
          <button
            onClick={() => setVerified(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-colors"
          >
            {tr("Logout", "خروج")}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">{tr("Total", "الإجمالي")}</span>
            </div>
            <p className="text-2xl font-black text-white">{stats.total}</p>
          </div>
          <div className="bg-emerald-900/30 border border-emerald-800/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400">{tr("Active", "نشط")}</span>
            </div>
            <p className="text-2xl font-black text-emerald-400">{stats.active}</p>
          </div>
          <div className="bg-amber-900/30 border border-amber-800/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400">{tr("Lifetime", "مدى الحياة")}</span>
            </div>
            <p className="text-2xl font-black text-amber-400">{stats.lifetime}</p>
          </div>
          <div className="bg-blue-900/30 border border-blue-800/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-blue-400">{tr("Monthly", "شهري")}</span>
            </div>
            <p className="text-2xl font-black text-blue-400">{stats.monthly}</p>
          </div>
          <div className="bg-purple-900/30 border border-purple-800/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-400">{tr("Yearly", "سنوي")}</span>
            </div>
            <p className="text-2xl font-black text-purple-400">{stats.yearly}</p>
          </div>
          <div className="bg-emerald-900/30 border border-emerald-800/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400">{tr("Free", "مجاني")}</span>
            </div>
            <p className="text-2xl font-black text-emerald-400">{stats.free}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['subscriptions', 'blocklist'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tr(tab === 'subscriptions' ? 'Subscriptions' : 'Blocklist', tab === 'subscriptions' ? 'الاشتراكات' : 'القائمة السوداء')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr("Search by email, name, or license type...", "البحث بالبريد الإلكتروني أو الاسم أو نوع الترخيص...")}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Subscriptions Table */}
        {activeTab === 'subscriptions' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{tr("Email", "البريد")}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{tr("Business", "النشاط")}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{tr("License", "الترخيص")}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{tr("Expires", "ينتهي")}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{tr("Users", "المستخدمين")}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{tr("Status", "الحالة")}</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{tr("Actions", "الإجراءات")}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        {tr("Loading...", "جاري التحميل...")}
                      </td>
                    </tr>
                  ) : filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        {tr("No subscriptions found.", "لم يتم العثور على اشتراكات.")}
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map((sub, idx) => (
                      <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-white">{sub.email || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{sub.businessName || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getLicenseBadge(sub.licenseType)}`}>
                            {sub.licenseType || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">{formatDate(sub.expiresAt)}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{sub.maxUsers || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            sub.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                            sub.status === 'blocked' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {sub.status || 'unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {sub.licenseType === 'DDF' && (
                              <button
                                onClick={() => handleBlockUser(sub.email)}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                title={tr("Block User", "حظر المستخدم")}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteSubscription(sub.email)}
                              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                              title={tr("Delete", "حذف")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Blocklist */}
        {activeTab === 'blocklist' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{tr("Email", "البريد")}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{tr("Blocked At", "تاريخ الحظر")}</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{tr("Reason", "السبب")}</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{tr("Actions", "الإجراءات")}</th>
                  </tr>
                </thead>
                <tbody>
                  {blocklist.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        {tr("No blocked users.", "لا يوجد مستخدمون محظورون.")}
                      </td>
                    </tr>
                  ) : (
                    blocklist.map((user: any, idx) => (
                      <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-white">{user.email || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{formatDate(user.blockedAt)}</td>
                        <td className="px-4 py-3 text-sm text-red-400">{user.reason || '-'}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleUnblockUser(user.email)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-colors"
                          >
                            {tr("Unblock", "إلغاء الحظر")}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
