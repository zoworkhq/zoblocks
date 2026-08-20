import { PageHeaderSkeleton } from "@/components/ui";

/**
 * The header, and nothing it cannot promise.
 *
 * This drew a header and a five-row table for every authenticated screen, on
 * the reasoning that one file beats nine near-identical ones. The reasoning was
 * right and the shape was wrong: four screens open with a table and nine do
 * not, so the token editor, the playground and the theme page all reserved
 * space for a table and then rendered something else — which moves the content
 * exactly as a missing skeleton would, while looking deliberate.
 *
 * The header is the one thing all thirteen genuinely share, so it is the one
 * thing the shared file claims. A screen whose shape is stable and worth
 * reserving gets its own `loading.tsx` beside it; the rest get an honest
 * header and content that arrives underneath it without pushing anything down.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <PageHeaderSkeleton />
    </div>
  );
}
