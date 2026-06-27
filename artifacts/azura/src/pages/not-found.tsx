import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 page-enter">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150" />
        <img
          src="https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80"
          alt="404"
          className="w-48 h-48 object-cover rounded-full shadow-2xl border-4 border-white/50 relative z-10"
          loading="lazy"
        />
        <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center text-xl font-black shadow-lg z-20">
          404
        </div>
      </div>

      <h1 className="text-3xl font-bold text-primary mb-3">
        Oops! Lost in the aroma?
      </h1>
      <p className="text-muted-foreground mb-8 max-w-xs leading-relaxed">
        The page you're looking for seems to have evaporated. Let's get you back to something delicious.
      </p>

      <Link href="/menu">
        <button className="btn-primary px-10 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 flex items-center gap-2">
          <span>☕</span> Return to Menu
        </button>
      </Link>
    </div>
  );
}
