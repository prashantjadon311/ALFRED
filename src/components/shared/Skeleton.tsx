import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-card", className)} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="glass-panel rounded-card p-5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-5 h-8 w-36" />
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
    </div>
  );
}
