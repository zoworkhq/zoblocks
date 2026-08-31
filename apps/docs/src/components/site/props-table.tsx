"use client";

import * as React from "react";
import type { PropDoc } from "@oxygenui-design/component-meta";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

/**
 * One export's API, ten rows at a time.
 *
 * The full list was rendered in one go, which put 25 props and some 1300px of
 * table between the reader and everything below it — and a reader who arrives
 * knowing the prop they want was made to scan for it. Ten rows with a filter
 * answers both: the common case is a search, and the browse case is paged.
 *
 * Below `PAGE_SIZE` the controls do not render at all. A search box over eight
 * props is furniture, and an empty pager reads as a broken one.
 *
 * A stacked list, not a table. It was a four-column table and it was clipping:
 * table layout gives a column the width its content asks for, and `variant` on
 * DatePicker asks for eleven string literals — about 300 characters. The type
 * column took the row and "What it does" was squeezed to roughly one character
 * per line. No column width fixes that, because the problem is that a
 * TypeScript union and a sentence do not belong side by side. So the name keeps
 * its own column and stays scannable, and the type and the description each get
 * the full remaining width, stacked.
 */
export function PropsTable({ props, label }: { props: readonly PropDoc[]; label: string }) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(0);
  const paged = props.length > PAGE_SIZE;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props;
    return props.filter(
      (prop) =>
        prop.name.toLowerCase().includes(q) ||
        prop.type.toLowerCase().includes(q) ||
        prop.description.toLowerCase().includes(q),
    );
  }, [props, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  /*
   * Clamped rather than reset in an effect. A filter that empties the last page
   * would otherwise render nothing until a second paint moved the cursor back,
   * and the search box types one character at a time.
   */
  const current = Math.min(page, pageCount - 1);
  const rows = paged
    ? filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)
    : filtered;

  const searchId = `ox-props-search-${label.replace(/[^a-zA-Z0-9]/g, "-")}`;

  return (
    <div>
      {paged ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <label className="sr-only" htmlFor={searchId}>
              Search {label} props
            </label>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder="Search props…"
              className={cn(
                "w-full rounded-lg border border-rule bg-paper-sunk px-3 py-1.5",
                "text-xs text-ink placeholder:text-graphite-soft",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                "focus-visible:outline-oxygen",
              )}
            />
          </div>

          {/*
            Announced, not just shown. Filtering happens with no focus change
            and no navigation, so without a live region a screen-reader user
            types into the box and is told nothing about what happened.
          */}
          <p aria-live="polite" className="numeric text-[0.6875rem] text-graphite-soft">
            {filtered.length === props.length
              ? `${props.length} props`
              : `${filtered.length} of ${props.length} match`}
          </p>
        </div>
      ) : null}

      <dl className="divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-paper">
        {rows.map((prop) => (
          <div
            key={prop.name}
            className="grid gap-x-8 gap-y-1.5 px-5 py-3 sm:grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)]"
          >
            {/* `min-w-0` on both tracks: without it a long union expands the
                grid track instead of wrapping inside it, which is the same bug
                the table had, one layout system later. */}
            <dt className="min-w-0">
              <span className="numeric break-words text-xs font-medium text-ink">{prop.name}</span>
              {prop.required ? (
                <span className="numeric ml-1.5 text-[0.5625rem] uppercase tracking-wider text-critical">
                  req
                </span>
              ) : null}
              {prop.default ? (
                <span className="numeric mt-1 block text-[0.6875rem] text-graphite-soft">
                  = {prop.default}
                </span>
              ) : null}
            </dt>

            <dd className="min-w-0">
              <p className="numeric break-words text-xs leading-relaxed text-oxygen-deep">
                {prop.type}
              </p>
              {/*
                An undocumented public prop is stated as one rather than left
                blank — a blank reads as "nothing to say about this".
              */}
              <p className="mt-1.5 max-w-[92ch] text-xs leading-relaxed text-graphite">
                {prop.description ? (
                  prop.description
                ) : (
                  <span className="italic text-graphite-soft">Not yet documented.</span>
                )}
              </p>
            </dd>
          </div>
        ))}

        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-graphite-soft">
            No prop matches “{query}”.
          </p>
        ) : null}
      </dl>

      {paged && pageCount > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="numeric text-[0.6875rem] text-graphite-soft">
            Page {current + 1} of {pageCount}
          </p>
          <div className="flex items-center gap-2">
            <PageButton
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
              label={`Previous page of ${label} props`}
            >
              Previous
            </PageButton>
            <PageButton
              onClick={() => setPage(current + 1)}
              disabled={current >= pageCount - 1}
              label={`Next page of ${label} props`}
            >
              Next
            </PageButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PageButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        // min-h-6 is WCAG 2.5.8's floor for a target that is not inline text.
        "inline-flex min-h-6 items-center rounded-lg border px-2.5 py-1 text-[0.6875rem] font-semibold",
        "transition-colors duration-200",
        disabled
          ? "cursor-not-allowed border-rule text-graphite-soft/50"
          : "border-rule text-graphite hover:border-oxygen/40 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
