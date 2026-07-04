import React from "react";
import { Star } from "lucide-react";
import { Feedback } from "../types";

interface ReviewsTabProps {
  tr: (en: string, ar: string) => string;
  feedback: Feedback[];
  avgRating: string | number;
  ratingDist: { r: number; count: number }[];
  maxRatingCount: number;
  markFeedbackRead: (id: string) => void;
}

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <span key={i} style={{ fontSize: size, color: i <= n ? "#F59E0B" : "#D1D5DB" }}>★</span>
      ))}
    </span>
  );
}

function CssBar({ pct, color = "hsl(var(--primary))" }: { pct: number; color?: string }) {
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 0)}%`, background: color }} />
    </div>
  );
}

export const ReviewsTab: React.FC<ReviewsTabProps> = ({ tr, feedback, avgRating, ratingDist, maxRatingCount, markFeedbackRead }) => {
  return (
    <div className="space-y-4 page-enter">
      {feedback.length > 0 && (
        <div className="card-elevated rounded-2xl p-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-primary">{avgRating}</p>
              <Stars n={parseFloat(avgRating as string) || 0}/>
              <p className="text-[10px] text-muted-foreground mt-0.5">{feedback.length} {tr("reviews","تقييم")}</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {ratingDist.map((d) => (
                <div key={d.r} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-right font-semibold text-foreground">{d.r}</span>
                  <span className="text-yellow-400">★</span>
                  <div className="flex-1"><CssBar pct={(d.count/maxRatingCount)*100} color="#F59E0B"/></div>
                  <span className="w-5 text-muted-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {feedback.length === 0 && (
        <div className="text-center py-12"><Star size={40} className="mx-auto text-muted-foreground/25 mb-2"/><p className="text-muted-foreground text-sm">{tr("No reviews yet","لا يوجد تقييمات")}</p></div>
      )}
      {feedback.map((f) => (
        <div key={f.id} className={`card rounded-xl p-4 ${!f.read ? "ring-1 ring-primary/30" : ""}`}>
          <div className="flex items-start justify-between mb-1.5">
            <div><p className="font-semibold text-sm text-foreground">{f.userName}</p><Stars n={f.rating} size={13}/></div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <p className="text-[10px] text-muted-foreground">{new Date(f.createdAt).toLocaleDateString()}</p>
              {!f.read && <button onClick={() => markFeedbackRead(f.id)} className="text-[10px] text-primary font-semibold">{tr("Mark read","قراءة")}</button>}
            </div>
          </div>
          {f.comment && <p className="text-sm text-muted-foreground italic">"{f.comment}"</p>}
        </div>
      ))}
    </div>
  );
};
