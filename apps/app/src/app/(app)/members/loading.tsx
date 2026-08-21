import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui";

/** A header and a table, because that is exactly what arrives. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <PageHeaderSkeleton />
      <TableSkeleton rows={4} columns={5} />
    </div>
  );
}
