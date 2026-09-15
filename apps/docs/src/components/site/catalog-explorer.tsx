"use client";

/**
 * The catalogue, as something you can shop rather than scroll.
 *
 * Twenty-six components in one alphabetical grid was navigable. Fifty will not
 * be, and the phase-two brief is fifty. The failure is quiet: nobody complains
 * that a catalogue is long, they just stop at the fold and conclude the library
 * is whatever was above it.
 *
 * Three decisions worth keeping.
 *
 *   Filtering is client-side and instant. The whole catalogue is already in the
 *   bundle — it is generated metadata, a few tens of kilobytes — so a round
 *   trip to filter twenty-six items would be latency in exchange for nothing.
 *
 *   Every facet states its count, and a facet that would return nothing is
 *   disabled rather than hidden. A filter that disappears when it stops
 *   matching teaches the reader that the catalogue is smaller than it is.
 *
 *   The result count is a live region. Filtering with the keyboard otherwise
 *   changes the whole page below the fold with no announcement at all, which
 *   is the most common way a faceted list fails a screen-reader user.
 */

import * as React from "react";
import { ChevronDown, Search, X } from "lucide-react";
import type { ComponentDoc } from "@/lib/catalog";
import { ComponentCard } from "@/components/site/component-card";
import { cn } from "@/lib/utils";
import { isReady, readyRank } from "@/lib/readiness";

type Facet = { id: string; label: string; count: number };

/** Case-insensitive substring over the fields a reader would actually type. */
function matches(component: ComponentDoc, term: string): boolean {
  if (!term) return true;
  const needle = term.toLowerCase();
  const haystack = [
    component.title,
    component.name,
    component.summary,
    component.resource ?? "",
    ...component.categories,
    ...(component.aliases ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function CatalogExplorer({ catalog }: { catalog: readonly ComponentDoc[] }) {
  const [term, setTerm] = React.useState("");
  const [category, setCategory] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);

  const current = React.useMemo(
    () => catalog.filter((component) => component.status !== "deprecated"),
    [catalog],
  );
  const deprecated = React.useMemo(
    () => catalog.filter((component) => component.status === "deprecated"),
    [catalog],
  );

  /*
   * Counts are computed against the *other* filters, not against the whole
   * catalogue and not against the current result set.
   *
   * Against the whole catalogue the numbers lie once anything is selected;
   * against the result set every unselected facet reads zero and the reader
   * concludes the filters are broken. Against the others is the only version
   * that answers the question being asked: "how many would I get if I clicked
   * this one too".
   */
  const categories: Facet[] = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const component of current) {
      if (!matches(component, term)) continue;
      if (status && component.status !== status) continue;
      for (const name of component.categories) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const all = new Set(current.flatMap((component) => component.categories));
    return [...all].sort().map((name) => ({ id: name, label: name, count: counts.get(name) ?? 0 }));
  }, [current, term, status]);

  const statuses: Facet[] = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const component of current) {
      if (!matches(component, term)) continue;
      if (category && !component.categories.includes(category)) continue;
      counts.set(component.status, (counts.get(component.status) ?? 0) + 1);
    }
    // Fixed order, not the order they happen to appear: stability is a ladder
    // and a reader scanning it expects the rungs in the same place every time.
    return (["stable", "beta", "experimental"] as const)
      .filter((id) => current.some((component) => component.status === id))
      .map((id) => ({ id, label: id, count: counts.get(id) ?? 0 }));
  }, [current, term, category]);

  const filtered = React.useMemo(
    () =>
      current.filter(
        (component) =>
          matches(component, term) &&
          (!category || component.categories.includes(category)) &&
          (!status || component.status === status),
      ),
    [current, term, category, status],
  );

  const filtering = Boolean(term || category || status);

  /*
   * Finished components lead, in the order `readiness.ts` declares.
   *
   * This replaced a pair of double-width "Start here" cells interleaved into
   * the grid. One of them was Trend Indicator, which is not finished — a
   * banner recommending a card that cannot be opened. The sequence carries the
   * emphasis now, so nothing needs to span two columns to earn attention.
   */
  const ordered = React.useMemo(() => {
    if (filtering) return filtered;
    return [...filtered].sort((a, b) => readyRank(a.name) - readyRank(b.name));
  }, [filtered, filtering]);

  /*
   * The catalogue, grouped.
   *
   * It used to render 27 cards as one flat grid under a single heading, which
   * gave the page no outline at all — nothing for a reader to skim and nothing
   * for a crawler to build a document structure from. The facets above were
   * doing the categorising and leaving no trace in the markup.
   *
   * Grouping applies only to the unfiltered view. Once somebody has filtered,
   * they have already said what they are looking for, and re-sorting their
   * results into bands they did not ask for is the kind of help that gets in
   * the way.
   *
   * A component may carry several categories; it appears once, under its first,
   * so the bands partition the catalogue rather than overlapping it.
   */
  const bands = React.useMemo(() => {
    if (filtering) return null;
    const ready = ordered.filter((component) => isReady(component.name));
    const soon = ordered.filter((component) => !isReady(component.name));
    return [
      ready.length && {
        name: "Available now",
        blurb: "Finished, documented, and installable one at a time.",
        components: ready,
      },
      soon.length && {
        /*
         * Not "Coming soon", which was wrong about almost everything in it.
         *
         * All but one of these components are in the registry and install
         * today — the band was describing a documentation backlog in the
         * language of a product roadmap, under cards carrying working install
         * commands. What they share is that nobody has written the page.
         */
        name: "Installable, not yet documented",
        blurb:
          "These install from the registry today. Their pages are not written yet, so the card is all there is to read — the install line on each one works.",
        components: soon,
      },
    ].filter(Boolean) as Array<{ name: string; blurb: string; components: ComponentDoc[] }>;
  }, [ordered, filtering]);

  const clear = () => {
    setTerm("");
    setCategory(null);
    setStatus(null);
  };

  return (
    <div>
      {/* ---- the controls ---------------------------------------- */}
      {/*
        One row, not a panel.

        This was 186 pixels of sticky chrome: a search field, thirteen category
        pills wrapping to two lines, and three stability pills, following the
        reader down a long page and taking a third of a laptop viewport with it.

        The counts were the stated reason for pills over a select — a select
        hides them until it is opened. They are in the option labels instead, so
        nothing is lost on opening, and the trigger carries the active one. A
        native select rather than a custom popover: keyboard behaviour, mobile
        pickers and typeahead all come free and none of them can be got subtly
        wrong here.
      */}
      {/*
        Not sticky on a phone. There the row wraps to three lines, and 140px
        pinned under the header left a 667px screen with little room for
        the cards it filters.
      */}
      <div
        className={cn(
          "surface-2 sticky z-20 flex flex-wrap items-center gap-2 rounded-xl px-2.5 py-2 backdrop-blur-md max-sm:static",
          "top-[calc(var(--header-h)+0.5rem)]",
        )}
      >
        <label className="relative flex min-w-[12rem] flex-1 items-center">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 size-3.5 text-graphite-soft"
          />
          <span className="sr-only">Filter components</span>
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Filter components…"
            className={cn(
              "w-full rounded-lg border border-transparent bg-transparent py-1.5 pl-8 pr-2 text-sm",
              "placeholder:text-graphite-soft",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1",
              "focus-visible:outline-brand",
            )}
          />
        </label>

        <Picker
          label="Category"
          all={`All categories (${current.length})`}
          facets={categories}
          value={category}
          onChange={setCategory}
        />
        <Picker
          label="Stability"
          all="Any stability"
          facets={statuses}
          value={status}
          onChange={setStatus}
        />

        <p
          aria-live="polite"
          className="numeric shrink-0 px-1 text-xs text-graphite-soft"
          // Live, because filtering with the keyboard otherwise changes the
          // whole page below the fold and says nothing about it.
        >
          {filtered.length} of {current.length}
        </p>

        {filtering ? (
          <button
            type="button"
            onClick={clear}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5",
              "text-xs text-graphite transition-colors hover:text-ink",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-brand",
            )}
          >
            <X aria-hidden="true" className="size-3" />
            Clear
          </button>
        ) : null}
      </div>

      {/* ---- the grid --------------------------------------------- */}
      {bands ? (
        bands.map((band) => {
          /*
           * Slug, not just de-spaced.
           *
           * Replacing whitespace alone turned "Entry & forms" into
           * `band-entry-&-forms`. That is legal in an id attribute and
           * useless everywhere it matters: `querySelector("#band-entry-&-forms")`
           * throws, and it cannot be linked as a fragment without escaping.
           * Anything that is not a letter or a digit becomes a hyphen.
           */
          const id = `band-${band.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")}`;
          return (
            <section
              key={band.name}
              aria-labelledby={id}
              // Clears the sticky filter row, which is 52px once the facets
              // moved into two selects. Without this a linked heading lands
              // underneath the thing that scrolled it into view.
              className="mt-16 scroll-mt-[calc(var(--header-h)+5rem)] first:mt-8"
            >
              <h2 id={id} className="display-sm">
                {band.name}
                <span className="numeric ml-3 align-middle text-sm font-normal text-graphite-soft">
                  {band.components.length}
                </span>
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-graphite">{band.blurb}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {band.components.map((component, index) => (
                  <ComponentCard
                    key={component.name}
                    component={component}
                    index={index}
                    featured={false}
                  />
                ))}
              </div>
            </section>
          );
        })
      ) : ordered.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((component, index) => (
            <ComponentCard
              key={component.name}
              component={component}
              index={index}
              featured={false}
            />
          ))}
        </div>
      ) : (
        <p className="mt-6 max-w-xl rounded-2xl border border-dashed border-rule px-6 py-8 text-sm leading-relaxed text-graphite">
          Nothing in the catalogue matches that yet. Clearing the filter brings back all{" "}
          {current.length}.
        </p>
      )}

      {deprecated.length > 0 && !filtering && (
        <>
          <h2 className="display-sm mt-16">Deprecated</h2>
          <p className="mt-2 max-w-xl text-sm text-graphite">
            Still installable and still documented, with a removal version and a migration note on
            each page.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deprecated.map((component, index) => (
              <ComponentCard key={component.name} component={component} index={index} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * One filter, as a native select.
 *
 * The counts live in the option labels rather than on visible chips. That was
 * the objection to a select — it hides them until it is opened — and putting
 * them inside answers it: the trigger shows the active choice, opening shows
 * every choice with its count, and the row stays one line high.
 *
 * Native rather than a custom listbox. Typeahead, Home and End, the mobile
 * wheel and the platform's own focus ring all arrive correct, and a bespoke
 * popover would be a new place to get the keyboard subtly wrong for no gain
 * over what a `<select>` already does.
 */
function Picker({
  label,
  all,
  facets,
  value,
  onChange,
}: {
  label: string;
  all: string;
  facets: Facet[];
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const id = `filter-${label.toLowerCase()}`;
  return (
    <span className="relative shrink-0">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className={cn(
          "cursor-pointer appearance-none rounded-lg border border-rule bg-transparent",
          "py-1.5 pl-2.5 pr-7 text-xs text-graphite transition-colors",
          "hover:border-rule-strong hover:text-ink",
          // The trigger reads as set rather than as empty once a filter is on,
          // because the row is small enough that a changed word is easy to miss.
          value && "border-brand/45 text-ink",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1",
          "focus-visible:outline-brand",
        )}
      >
        <option value="">{all}</option>
        {facets.map((facet) => (
          <option key={facet.id} value={facet.id}>
            {facet.label} ({facet.count})
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-graphite-soft"
      />
    </span>
  );
}
