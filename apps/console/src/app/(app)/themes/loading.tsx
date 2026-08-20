import { PageHeaderSkeleton, Skeleton, TableSkeleton } from "@/components/ui";

/**
 * The theme list: header, the search row, then the table.
 *
 * `loading.tsx` covers its segment *and* every nested one without its own, so
 * this would otherwise show a table over the theme detail page too. That is
 * what `themes/[slug]/loading.tsx` is for — the override is the cost of putting
 * a specific shape at a segment that has children.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <PageHeaderSkeleton />
      <Skeleton className="mb-4 h-8 w-full max-w-[24rem]" />
      <TableSkeleton rows={3} columns={6} />
    </div>
  );
}
