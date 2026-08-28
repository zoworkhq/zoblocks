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
import { Search, X } from "lucide-react";
import type { ComponentDoc } from "@/lib/catalog";
import { ComponentCard } from "@/components/site/component-card";
import { cn } from "@/lib/utils";

/**
 * The lead cells.
 *
 * Two, and they carry the argument rather than the alphabet: the signature
 * wait, and the component that refuses to render a trend it cannot justify.
 * They lose their span as soon as a filter is on — a "start here" cell inside
 * a filtered result set is a recommendation about a question the reader has
 * already narrowed past.
 */
const FEATURED = ["pulse-loader", "trend-indicator"];

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
   * Featured cells lead only in the unfiltered view.
   *
   * They are also interleaved rather than stacked: two double-width cells side
   * by side is a banner, and a banner at the top of a catalogue is the thing
   * readers scroll past to reach the catalogue.
   */
  const ordered = React.useMemo(() => {
    if (filtering) return filtered;
    const featured = FEATURED.map((name) => filtered.find((c) => c.name === name)).filter(
      (c): c is ComponentDoc => Boolean(c),
    );
    const rest = filtered.filter((component) => !FEATURED.includes(component.name));
    return [featured[0], rest[0], featured[1], rest[1], ...rest.slice(2)].filter(
      (c): c is ComponentDoc => Boolean(c),
    );
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
    const byName = new Map<string, ComponentDoc[]>();
    for (const component of ordered) {
      // The first category that maps to a band. "Clinical" maps to none, which
      // is what keeps it from swallowing two thirds of the catalogue.
      const primary =
        component.categories.map((c) => BAND_OF.get(c)).find(Boolean) ??
        BAND_ORDER[BAND_ORDER.length - 1]!.name;
      if (!byName.has(primary)) byName.set(primary, []);
      byName.get(primary)!.push(component);
    }
    return BAND_ORDER.filter((band) => byName.has(band.name)).map((band) => ({
      ...band,
      components: byName.get(band.name)!,
    }));
  }, [ordered, filtering]);

  const clear = () => {
    setTerm("");
    setCategory(null);
    setStatus(null);
  };

  return (
    <div>
      {/* ---- the controls ---------------------------------------- */}
      <div
        className={cn(
          // Sticks beneath the site header rather than under it. `--header-h`
          // is defined in globals.css from the same number `chrome.tsx` uses.
          "surface-2 sticky z-20 rounded-2xl p-4 backdrop-blur-md",
          "top-[calc(var(--header-h)+0.5rem)]",
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex min-w-[14rem] flex-1 items-center">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 size-4 text-graphite-soft"
            />
            <span className="sr-only">Filter components</span>
            <input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Filter — a name, a FHIR resource, “allergy”, “loader”…"
              className={cn(
                "w-full rounded-xl border border-rule bg-transparent py-2 pl-9 pr-3 text-sm",
                "placeholder:text-graphite-soft",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1",
                "focus-visible:outline-oxygen",
              )}
            />
          </label>

          <p
            aria-live="polite"
            className="numeric shrink-0 text-xs text-graphite-soft"
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
                "inline-flex shrink-0 items-center gap-1 rounded-lg border border-rule px-2.5 py-1.5",
                "text-xs text-graphite transition-colors hover:border-oxygen/45 hover:text-ink",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                "focus-visible:outline-oxygen",
              )}
            >
              <X aria-hidden="true" className="size-3" />
              Clear
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-4">
          <FacetGroup
            legend="Category"
            facets={categories}
            selected={category}
            onSelect={setCategory}
          />
          <FacetGroup legend="Stability" facets={statuses} selected={status} onSelect={setStatus} />
        </div>
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
              // Clears the sticky filter panel, which is 186px tall with every
              // facet shown. Without this a linked heading lands underneath it.
              className="mt-16 scroll-mt-[calc(var(--header-h)+13rem)] first:mt-8"
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
                    featured={FEATURED.includes(component.name)}
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
 * The bands, in reading order, each with the sentence that defines it.
 *
 * Merged rather than one band per category. Banding straight on the category
 * data produced ten headings for 27 components, six of which covered one or
 * two cards — a display heading, a blurb and a single card, six times. That
 * fragments the page rather than giving it an outline, which is the opposite
 * of the point.
 *
 * These five cover 3 to 8 components each. A band is worth a heading when a
 * reader could plausibly be looking for "one of those"; below about three it
 * is a list with extra steps.
 *
 * "Clinical" is not a band. It is the first category on 15 of 26 components
 * and describes 17, so it partitions nothing — the FHIR resource on each card
 * already says which components are clinical.
 */
const BAND_ORDER: ReadonlyArray<{ name: string; blurb: string; categories: readonly string[] }> = [
  {
    name: "Clinical data",
    blurb: "Values, trends and model output, rendered so the qualifier travels with the number.",
    categories: ["Data Display", "AI"],
  },
  {
    name: "Entry & forms",
    blurb: "Controls that write to the record, including the ones whose value has a third case.",
    categories: ["Data Entry", "Forms"],
  },
  {
    name: "Navigation & disclosure",
    blurb: "Moving through a record, and showing content a reader may not simply be shown.",
    categories: ["Navigation", "Disclosure"],
  },
  {
    name: "Waiting & feedback",
    blurb: "Five waits with different meanings, each with a designed still state.",
    categories: ["Loaders", "Feedback"],
  },
  {
    name: "Patterns & primitives",
    blurb: "Whole surfaces, and the vocabulary the clinical components are built from.",
    categories: ["Patterns", "Primitives", "Layout", "Documentation"],
  },
];

/** Category → band, derived once from the table above. */
const BAND_OF = new Map<string, string>(
  BAND_ORDER.flatMap((band) => band.categories.map((c) => [c, band.name] as const)),
);

/**
 * One row of facets.
 *
 * A group of toggle buttons rather than a `<select>`: the counts are the point,
 * and a select hides them until it is opened. `aria-pressed` rather than a
 * radiogroup, because clicking the selected facet clears it — which a radio
 * cannot express.
 */
function FacetGroup({
  legend,
  facets,
  selected,
  onSelect,
}: {
  legend: string;
  facets: Facet[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}) {
  if (!facets.length) return null;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5" role="group" aria-label={legend}>
      <span className="axis-label mr-1 shrink-0">{legend}</span>
      {facets.map((facet) => {
        const active = selected === facet.id;
        // Disabled, not hidden. A facet that vanishes when it stops matching
        // teaches the reader the catalogue is smaller than it is.
        const empty = facet.count === 0 && !active;

        return (
          <button
            key={facet.id}
            type="button"
            aria-pressed={active}
            disabled={empty}
            onClick={() => onSelect(active ? null : facet.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
              "text-[0.6875rem] transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-oxygen",
              active
                ? "border-oxygen/50 bg-oxygen/12 font-semibold text-oxygen-deep"
                : "border-rule text-graphite hover:border-oxygen/40 hover:text-ink",
              empty && "cursor-not-allowed opacity-40 hover:border-rule hover:text-graphite",
            )}
          >
            {facet.label}
            <span className="numeric text-[0.625rem] text-graphite-soft">{facet.count}</span>
          </button>
        );
      })}
    </div>
  );
}
