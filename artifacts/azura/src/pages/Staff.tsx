import { useEffect, useState } from "react";
import { db, ref, onValue, off } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";

interface StaffMember {
  id: string;
  name: string;
  nameAr: string;
  role: string;
  roleAr: string;
  bio: string;
  bioAr: string;
  photo: string;
}

export default function Staff() {
  const { lang, tr, isRTL } = useLang();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StaffMember | null>(null);

  useEffect(() => {
    const staffRef = ref(db, "staff");
    onValue(staffRef, (snap) => {
      if (!snap.exists()) { setLoading(false); return; }
      const data = snap.val() as Record<string, Omit<StaffMember, "id">>;
      setStaff(Object.entries(data).map(([id, s]) => ({ id, ...s })));
      setLoading(false);
    });
    return () => off(ref(db, "staff"));
  }, []);

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
          {tr.staffTitle}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{tr.staffSub}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="neo rounded-2xl overflow-hidden animate-pulse">
              <div className="h-40 bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted rounded w-2/3 mx-auto" />
                <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {staff.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelected(member)}
              className="neo rounded-2xl overflow-hidden card-hover text-left transition-all"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={member.photo}
                  alt={lang === "ar" ? member.nameAr : member.name}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=300&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="font-bold text-white text-sm leading-tight">
                    {lang === "ar" ? member.nameAr : member.name}
                  </p>
                  <p className="text-white/80 text-xs">
                    {lang === "ar" ? member.roleAr : member.role}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Member Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="neo-lg rounded-3xl p-5 w-full max-w-sm page-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <img
                src={selected.photo}
                alt={lang === "ar" ? selected.nameAr : selected.name}
                className="w-16 h-16 rounded-full object-cover object-top neo-sm flex-shrink-0"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&q=60"; }}
              />
              <div>
                <h3 className="font-bold text-primary text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {lang === "ar" ? selected.nameAr : selected.name}
                </h3>
                <p className="text-secondary text-sm font-semibold">
                  {lang === "ar" ? selected.roleAr : selected.role}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lang === "ar" ? selected.bioAr : selected.bio}
            </p>
            <button
              onClick={() => setSelected(null)}
              className="w-full neo-btn bg-background py-3 rounded-xl font-semibold text-sm text-foreground mt-4"
            >
              {tr.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
