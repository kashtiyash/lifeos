import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ListSkeletonProps = {
  rows?: number;
  className?: string;
};

/** Loading state for list/row data views. Announced to assistive tech. */
export function ListSkeleton({ rows = 5, className }: ListSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("space-y-2", className)}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg border border-border p-3"
        >
          <Skeleton className="size-5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
