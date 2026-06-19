import { type ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  HomeIcon, 
  SparklesIcon, 
  FilmIcon, 
  ChatBubbleLeftRightIcon, 
  UserIcon
} from "@heroicons/react/24/outline";
import { 
  HomeIcon as HomeIconSolid, 
  SparklesIcon as SparklesIconSolid, 
  FilmIcon as FilmIconSolid, 
  ChatBubbleLeftRightIcon as ChatIconSolid, 
  UserIcon as UserIconSolid
} from "@heroicons/react/24/solid";

const NAV = [
  { path: "/menu",    key: "menu",    label: "القائمة",      labelEn: "Menu",    icon: HomeIcon,    iconActive: HomeIconSolid },
  { path: "/reels",   key: "reels",   label: "الفيديو",       labelEn: "Reels",    icon: FilmIcon, iconActive: FilmIconSolid },
  { path: "/support", key: "support", label: "الدعم",        labelEn: "Support",  icon: ChatBubbleLeftRightIcon, iconActive: ChatIconSolid },
  { path: "/profile", key: "profile", label: "حسابي",        labelEn: "Profile",  icon: UserIcon, iconActive: UserIconSolid },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { lang, isRTL } = useLang();
  const { profile } = useAuth();
  const [location] = useLocation();

  const isActive = (p: string) => location === p || (p === "/menu" && (location === "/" || location === ""));

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-2.5"
        style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)", borderBottom: "1px solid rgba(93,62,35,0.08)" }}>
        <Link href="/menu">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <img src="/logo.jpg" alt="Azura" className="w-9 h-9 rounded-full object-cover" style={{ boxShadow: "var(--shadow-sm)" }} />
            <div>
              <h1 className="text-sm font-bold text-primary leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                Azura Cafe
              </h1>
              <p className="text-[10px] text-muted-foreground leading-none">
                Tivoli Dome, Alexandria
              </p>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {profile?.tableNumber && (
            <span className="text-[11px] font-bold text-primary px-2.5 py-1 rounded-full" style={{ background: "hsl(var(--muted))", boxShadow: "var(--shadow-xs)" }}>
              Table {profile.tableNumber}
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="page-enter">{children}</div>
      </main>

      {/* Bottom Nav - Amazing iOS Style */}
      <nav className="fixed bottom-0 inset-x-0 z-40 px-1 pb-safe">
        {/* Background blur container - Pure white glass, unaffected by bg */}
        <div 
          className="mx-3 mb-2 rounded-2xl overflow-hidden"
          style={{ 
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(24px) saturate(200%)",
            WebkitBackdropFilter: "blur(24px) saturate(200%)",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.15), 0 -4px 16px rgba(0,0,0,0.08), inset 0 0.5px 0 rgba(255,255,255,1)",
            border: "0.5px solid rgba(255,255,255,0.8)"
          }}
        >
          <div className="flex items-stretch justify-around py-2 px-1">
            {NAV.map((item, index) => {
              const active = isActive(item.path);
              const Icon = active ? item.iconActive : item.icon;
              const displayLabel = lang === "ar" ? item.label : item.labelEn;
              
              return (
                <Link key={item.path} href={item.path} className="flex-1">
                  <button 
                    className={`
                      relative flex flex-col items-center justify-center gap-1 px-1 py-1.5 w-full
                      transition-all duration-300 ease-out
                      ${active ? "" : "hover:scale-[1.08] active:scale-[0.92]"}
                    `}
                  >
                    {/* Active indicator pill */}
                    {active && (
                      <div 
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full"
                        style={{ 
                          background: "linear-gradient(180deg, hsl(22,55%,28%), hsl(22,55%,18%))",
                          boxShadow: "0 3px 10px rgba(93,62,35,0.5), 0 1px 3px rgba(93,62,35,0.3)"
                        }}
                      />
                    )}
                    
                    {/* Icon container with dynamic background */}
                    <div className="relative">
                      <div 
                        className={`
                          p-1.5 rounded-xl transition-all duration-300 ease-out
                          ${active 
                            ? "bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg ring-2 ring-primary/20" 
                            : "bg-transparent hover:bg-muted/60 active:bg-muted/80"
                          }
                        `}
                      >
                        <Icon 
                          className={`
                            w-5 h-5 transition-all duration-300 ease-out
                            ${active 
                              ? "text-primary scale-110 drop-shadow-md" 
                              : "text-muted-foreground group-hover:text-foreground"
                            }
                          `} 
                        />
                      </div>
                    </div>
                    
                    {/* Label with active highlight */}
                    <span 
                      className={`
                        text-[10px] font-semibold leading-none tracking-wide transition-all duration-300
                        ${active 
                          ? "text-primary font-bold" 
                          : "text-muted-foreground"
                        }
                      `}
                    >
                      {displayLabel}
                    </span>
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
