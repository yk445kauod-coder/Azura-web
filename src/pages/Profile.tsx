import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { Globe, LogOut, Coffee, Smartphone, Hash } from "lucide-react";
import { type Lang } from "@/lib/i18n";

export default function Profile() {
  const { user, logout } = useAuth();
  const { lang, setLang, tr, isRTL } = useLang();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || "G")}&backgroundColor=5c3d2e&textColor=f3ede0`;

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
        <img src={avatar} alt={user?.name || "User"} className="w-16 h-16 rounded-full neo-sm flex-shrink-0 object-cover" />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-primary text-lg truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
            {user?.name || tr.guestUser}
          </h2>
          {(user?.tableNumber) && (
            <span className="inline-flex items-center gap-1 neo-sm rounded-full px-2 py-0.5 text-xs text-primary font-semibold mt-1">
              {tr.table} {user.tableNumber}
            </span>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="neo rounded-2xl px-4 py-2 mb-4">
        {settingRow(
          <Hash size={16} />,
          tr("User ID", "معرف المستخدم"),
          <span className="text-xs font-mono text-muted-foreground">{user?.uid?.slice(0, 12)}...</span>
        )}
        {settingRow(
          <Smartphone size={16} />,
          tr("Device", "الجهاز"),
          <span className="text-xs text-muted-foreground">{user?.deviceInfo?.platform || "-"}</span>
        )}
      </div>

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
