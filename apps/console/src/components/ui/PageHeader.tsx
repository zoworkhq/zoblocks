import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The first 120 pixels of every screen.
 *
 * One component rather than a convention, because the alternative is what this
 * console had: thirteen screens each opening with a slightly different
 * arrangement of heading, paragraph and button, and a primary action left
 * floating in the flow after the help text. A reader who cannot tell at a
 * glance which page they are on is reading an admin panel, not a product.
 *
 * `actions` is a fixed home for the primary control. That single decision is
 * the largest visual difference between the old screens and these.
 */
export function PageHeader({
  eyebrow,
  eyebrowHref,
  title,
  lede,
  actions,
  className,
}: {
  /** Names the context — the theme and version, the organisation, the section. */
  eyebrow?: React.ReactNode;
  /**
   * Makes the eyebrow the way back.
   *
   * The seven theme sub-screens already opened by naming their theme; this
   * turns that name into the link to it. A screen four levels into a hierarchy
   * with no upward path is a screen you leave with the browser's back button,
   * and the rail marks where you are without offering anywhere to go.
   *
   * The eyebrow rather than a separate breadcrumb row because the eyebrow is
   * already the parent's name — a second line repeating it to make it
   * clickable would be chrome apologising for the first.
   */
  eyebrowHref?: string;
  title: React.ReactNode;
  /** One paragraph. If it needs two, it belongs in the page body. */
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-8 flex flex-wrap items-start justify-between gap-x-6 gap-y-4 border-b border-rule pb-6",
        className,
      )}
    >
      {/*
        `flex-1 basis-[24rem]` rather than plain `min-w-0`.

        A wrapping flex container wraps *before* it shrinks: it lays items out
        at their base size, and a lede's unwrapped max-content is far wider
        than the header, so the action dropped onto its own line at every
        viewport — which is the floating primary action this component was
        built to remove. A zero-ish basis that grows keeps the action beside
        the title, and the 24rem floor is what still triggers a wrap on a
        genuinely narrow screen.
      */}
      <div className="min-w-0 flex-1 basis-[24rem]">
        {eyebrow &&
          (eyebrowHref ? (
            <p className="mb-2">
              <Link
                href={eyebrowHref}
                className="eyebrow group inline-flex items-center gap-1.5 text-oxygen-deep"
              >
                <ArrowLeft
                  aria-hidden="true"
                  strokeWidth={2.5}
                  className="size-3 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
                />
                <span className="group-hover:underline">{eyebrow}</span>
              </Link>
            </p>
          ) : (
            <p className="eyebrow mb-2 text-oxygen-deep">{eyebrow}</p>
          ))}
        <h1 className="display-sm">{title}</h1>
        {/*
          Supporting text, at supporting size.

          This used the `.lede` scale — 17px, the docs site's opening paragraph.
          That is the right size for a page somebody reads and the wrong one for
          a page somebody works on: at 17px the description carried nearly as
          much weight as the heading above it and pushed the actual content of
          every screen a further line down. 14px in graphite still reads on
          first arrival and stops competing with the title on the hundredth.
        */}
        {lede && (
          <p className="mt-1.5 max-w-[74ch] text-[0.875rem] leading-relaxed text-graphite">
            {lede}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
