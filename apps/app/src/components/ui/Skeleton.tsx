import { cn } from "@/lib/utils";

/**
 * A placeholder shaped like what is coming.
 *
 * Matching the final layout is the whole requirement: a skeleton of the wrong
 * height moves the content when it arrives, and a reader who was already
 * reading loses their place — which is worse than a blank space that never
 * moved.
 *
 * `aria-hidden`, with the loading state announced once by the region that owns
 * it. Announcing every bar would read a wall of nothing.
 *
 * The treatment is a travelling sweep rather than `animate-pulse`. A bar that
 * fades in and out is wearing the same clothes as a disabled control, and a
 * whole screen of them reads as "none of this is available" instead of "this
 * is on its way". A sweep moves in one direction, and direction is what makes
 * it legible as progress. See `.shimmer` in `globals.css`, which also turns
 * itself off under `prefers-reduced-motion` rather than freezing mid-stripe.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("shimmer block rounded bg-paper-sunk", className)} />
  );
}

/** A skeleton shaped like a `DataTable`, for a list that is still loading. */
export function TableSkeleton({ rows = 4, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div
      className="surface overflow-hidden"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex gap-4 border-b border-rule bg-paper-sunk px-4 py-2.5">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-4 border-b border-rule px-4 py-3 last:border-b-0">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * The header every screen opens with.
 *
 * Extracted because four `loading.tsx` files now draw it, and a page header
 * skeleton that has drifted from `PageHeader` is worse than none — it reserves
 * the wrong height and the content jumps anyway, which is the exact fault a
 * skeleton exists to prevent.
 */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-7 border-b border-rule pb-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-full max-w-[52ch]" />
    </div>
  );
}
