/**
 * One section of a component page: an anchored, indexed block with a heading.
 *
 * `data-toc` is what the "On this page" list watches. The site's own
 * `scroll-padding-top` keeps a heading clear of the sticky header when a link
 * lands on it.
 */

import type * as React from "react";
import { cn } from "@/lib/utils";

export function DocSection({
  id,
  title,
  lead,
  aside,
  first = false,
  className,
  children,
}: {
  id: string;
  title: string;
  lead?: React.ReactNode;
  /** Rendered at the right of the heading row. */
  aside?: React.ReactNode;
  /** The first section after the overview draws no rule above itself. */
  first?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      data-toc={id}
      aria-labelledby={`${id}-title`}
      className={cn(
        "flex flex-col gap-4 pb-14",
        first ? "" : "border-t border-rule pt-10",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2
            id={`${id}-title`}
            className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-ink"
          >
            {title}
          </h2>
          {aside}
        </div>
        {lead ? (
          <p className="m-0 max-w-[640px] text-pretty text-[15px] text-graphite">{lead}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** A titled sub-block inside a section. */
export function DocSubsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="m-0 text-[15px] font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}
