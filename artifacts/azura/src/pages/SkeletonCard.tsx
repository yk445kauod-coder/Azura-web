// Lazy loaded skeleton card for Menu page
export default function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-sm)" }}>
      <div className="h-40 bg-muted/60" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-muted rounded-full w-3/4" />
        <div className="h-3 bg-muted rounded-full w-1/2" />
        <div className="flex items-center justify-between mt-3">
          <div className="h-5 bg-muted rounded-full w-16" />
          <div className="w-8 h-8 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}