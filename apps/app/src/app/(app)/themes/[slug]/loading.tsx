import { PageHeaderSkeleton, Skeleton } from "@/components/ui";

/**
 * A theme: header, the gate's verdict, then the grid of its screens.
 *
 * Also the file that stops `themes/loading.tsx` leaking its table down here —
 * a nested segment inherits the nearest skeleton above it, and a table is not
 * what this page renders.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <PageHeaderSkeleton />

      {/* The verdict callout, which is the first thing that lands. */}
      <Skeleton className="h-20 w-full rounded-xl" />

      {/* Seven cards, in the grid they arrive in. */}
      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[5.5rem] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
