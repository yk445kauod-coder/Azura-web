// Standardized Premium Skeleton for Menu items
import { motion } from "framer-motion";

export default function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl overflow-hidden bg-card border border-border/30 shadow-sm"
    >
      <div className="relative h-36 bg-muted/40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
      </div>
      <div className="p-3 space-y-3">
        <div className="h-4 bg-muted/40 rounded-full w-3/4 overflow-hidden relative">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="h-4 bg-muted/40 rounded-full w-1/4 overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
          </div>
          <div className="h-7 bg-muted/40 rounded-lg w-1/3 overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
