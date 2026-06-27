import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { useBarista } from "@/contexts/BaristaContext";
import { db, ref, onValue, off, update } from "@/lib/firebase";
import { Globe, Bell, LogOut, User, Coffee, ChevronRight } from "lucide-react";
import { type Lang } from "@/lib/i18n";

interface Notification {
  id: string;
  message: string;
  messageAr: string;
  read: boolean;
  createdAt: number;
  type: string;
}

export default function Profile() {
  const { profile, user, logout } = useAuth();
  const { lang, setLang, tr, isRTL } = useLang();
  const { persona, setPersona, baristaName } = useBarista();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!user || user.isAnonymous) return;
    const notifRef = ref(db, `notifications/${user.uid}`);
    onValue(notifRef, (snap) => {
      if (!snap.exists()) { setNotifications([]); return; }
      const data = snap.val() as Record<string, Omit<Notification, "id">>;
      setNotifications(
        Object.entries(data)
          .map(([id, n]) => ({ id, ...n }))
          .sort((a, b) => b.createdAt - a.createdAt)
      );
    });
    return () => off(ref(db, `notifications/${user!.uid}`));
  }, [user?.uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    const updates: Record<string, boolean> = {};
    notifications.filter((n) => !n.read).forEach((n) => {
      updates[`notifications/${user.uid}/${n.id}/read`] = true;
    });
    if (Object.keys(updates).length > 0) await update(ref(db), updates);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const avatar = profile?.photoURL
    ? profile.photoURL
    : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.name || "G")}&backgroundColor=5c3d2e&textColor=f3ede0`;

  const settingRow = (icon: React.ReactNode, label: string, content: React.ReactNode) => (
    <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-3 text-sm font-medium text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </div>
      {content}
    </div>
  );

  return (
    <div className="px-4 py-4 max-w-lg mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      {/* Profile Card */}
      <div className="neo rounded-3xl p-5 mb-4 flex items-center gap-4">
        <img src={avatar} alt={profile?.name || "User"} className="w-16 h-16 rounded-full neo-sm flex-shrink-0 object-cover" loading="lazy" />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-primary text-lg truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
            {profile?.name || tr.guestUser}
          </h2>
          {profile?.email && <p className="text-muted-foreground text-xs truncate">{profile.email}</p>}
          {(profile?.tableNumber) && (
            <span className="inline-flex items-center gap-1 neo-sm rounded-full px-2 py-0.5 text-xs text-primary font-semibold mt-1">
              {tr.table} {profile.tableNumber}
            </span>
          )}
          {profile?.isGuest && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground mt-1">
              {tr.guestUser}
            </span>
          )}
        </div>
      </div>

      {/* Notifications (for logged in users) */}
      {!user?.isAnonymous && (
        <div className="neo rounded-2xl p-4 mb-4">
          <button
            className="w-full flex items-center justify-between"
            onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
          >
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-muted-foreground" />
              <span className="font-semibold text-sm text-foreground">{tr.notifications}</span>
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <ChevronRight size={16} className={`text-muted-foreground transition-transform ${showNotifs ? "rotate-90" : ""}`} />
          </button>
          {showNotifs && (
            <div className="mt-3 space-y-2">
              {notifications.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">{tr.noNotifications}</p>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className={`text-xs rounded-xl px-3 py-2 ${n.read ? "text-muted-foreground" : "neo-inset-sm text-foreground font-medium"}`}>
                    {lang === "ar" ? n.messageAr : n.message}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      <div className="neo rounded-2xl px-4 py-2 mb-4">
        {settingRow(
          <Globe size={16} />,
          tr.language,
          <div className="flex gap-1 neo-sm rounded-full p-1">
            {(["en", "ar"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lang === l ? "neo-inset text-primary" : "text-muted-foreground"}`}
              >
                {l === "en" ? "EN" : "عربي"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Café Info */}
      <div className="neo rounded-2xl px-4 py-3 mb-4 text-sm space-y-1">
        <p className="font-semibold text-foreground mb-1">{lang === "ar" ? "تواصل معنا" : "Contact Us"}</p>
        <p className="text-muted-foreground">📍 {tr.location}</p>
        <p className="text-muted-foreground">📞 {tr.phone}</p>
        <a href="https://instagram.com/azuracafee" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline block">
          📸 @azuracafee
        </a>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl neo-btn bg-background text-destructive font-semibold text-sm disabled:opacity-60"
      >
        <LogOut size={16} />
        {tr.signOut}
      </button>
    </div>
  );
}
