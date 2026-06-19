import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-6xl mb-4">☕</p>
      <h1 className="text-2xl font-bold text-primary mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
        404
      </h1>
      <p className="text-muted-foreground mb-6">Page not found</p>
      <Link href="/menu">
        <button className="neo-primary px-6 py-3 rounded-xl font-semibold text-sm">
          Go to Menu
        </button>
      </Link>
    </div>
  );
}
