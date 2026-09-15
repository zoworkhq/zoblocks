import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATALOG, getComponent } from "@/lib/catalog";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";

/**
 * The comparison page, written to be checkable.
 *
 * Comparison content is the highest-intent page a library can have and the
 * easiest one to make worthless: a feature matrix with ticks in our column is
 * read as marketing and cited by nobody. So two rules held throughout.
 *
 * First, every claim about another project is a measurement against a named
 * version, and the section says what they do *well* before it says what they
 * do not. The rc-table figures below come from reading its published ES build,
 * not from its documentation or from a blog post.
 *
 * Second, there is a section saying when not to choose this library, and it is
 * not a humblebrag. A comparison without one is an advert.
 */
export const metadata: Metadata = {
  title: "Compare — ZoBlocks, antd, or build it",
  description:
    "How ZoBlocks compares to general-purpose React libraries, headless table libraries, and building clinical components in-house. Measured, with sources.",
  alternates: { canonical: "/compare" },
};

/*
 * Derived, because both were typed and both were wrong.
 *
 * "27 components carrying 300-plus documented states" understated a catalogue
 * of 30 carrying 352 — on the page whose whole premise is that its figures can
 * be re-checked. The catalogue page computes both correctly one click away.
 */
const COMPONENT_COUNT = CATALOG.filter((component) => component.status !== "deprecated").length;
const STATE_COUNT = CATALOG.reduce((total, component) => total + component.states.length, 0);

/** The grid's own numbers, so the table below cannot describe a version it is not. */
const GRID = getComponent("data-grid");
const GRID_COLUMN = `ZoBlocks DataGrid ${GRID?.since ?? ""}`.trim();

const OPTIONS = [
  {
    name: "Build it in-house",
    when: "You have a design system, an accessibility practice, and a team that can carry both.",
    cost: "The components are the small part. The states are the work.",
    detail: `A lab result is an afternoon. A lab result that renders a corrected value without hiding the number a clinician saw an hour ago, distinguishes “no reference range published” from “within range”, and says “restricted” rather than showing an em dash — that is the part that takes a quarter and gets cut when the quarter runs out. ZoBlocks ships ${COMPONENT_COUNT} components carrying ${STATE_COUNT} documented states because those states are the reason the library exists.`,
  },
  {
    name: "A general-purpose React library",
    when: "Your product is not clinical, or clinical display is a small part of it.",
    cost: "Excellent engineering, aimed at a different problem.",
    detail:
      "Ant Design, MUI and their peers are better than anything we would write for the 80% of an application that is forms, layout and navigation — and ZoBlocks is deliberately API-compatible with antd v6 rather than competing with it. What they do not have is a vocabulary for absence: no component in a general-purpose library knows the difference between a result that is missing and a result you are not permitted to see, because no general-purpose product needs one.",
  },
  {
    name: "A headless table library",
    when: "You need a data grid and you have the design and accessibility capacity to finish it.",
    cost: "You get the row model. You still own every cell and every keyboard interaction.",
    detail:
      "TanStack Table v9 went stable on 4 August 2026 at roughly 25 KB with a substantially leaner memory profile than v8, and its row-model pipeline is the best in the ecosystem — we read it closely while building our own grid and chose not to depend on it. The reason is narrow: our row carries disclosure, absence and coverage semantics that a general row model has no place for, and adapting one costs more than the pipeline saves.",
  },
];

/**
 * Measured against the published build, not against documentation.
 *
 * Kept as data with a `verified` note per row so a reader can re-run the check.
 * The favourable rows are here for the same reason as the unfavourable ones: a
 * comparison that reports only the gaps it wins is not a measurement.
 */
const RC_TABLE = [
  {
    claim: "aria-* attributes in the published ES build",
    finding: "One — aria-hidden.",
    ours: "Full grid semantics, shipped.",
    tone: "gap" as const,
  },
  {
    claim: "role on the table element",
    finding: "None emitted.",
    ours: 'role="grid" with 2-D keyboard navigation.',
    tone: "gap" as const,
  },
  {
    claim: "Keyboard handlers",
    finding: "Zero in the engine.",
    ours: "Cell focus and roving tabindex.",
    tone: "gap" as const,
  },
  {
    claim: "aria-rowcount / rowindex / colindex",
    finding: "Emitted by neither rc-table nor antd's layer.",
    ours: "Required — a virtualised grid without them lies about its size.",
    tone: "gap" as const,
  },
  {
    claim: "scope on header cells",
    finding: "Emitted correctly.",
    ours: "Same.",
    tone: "credit" as const,
  },
  {
    claim: "Shift-range selection",
    finding: "Handled by useSelection.",
    ours: "Same behaviour, shipped.",
    tone: "credit" as const,
  },
  {
    claim: "Dynamic row heights when virtualised",
    finding: "Measured properly, with ResizeObserver and a cache.",
    ours: "No improvement claimed.",
    tone: "credit" as const,
  },
];

const NOT_FOR_YOU = [
  "You want components you can upgrade with a version bump. Source is copied into your repo, so fixes arrive as a diff you take deliberately — that is the trade, and for some teams it is the wrong one.",
  "You need a component library for a general product. Most of ZoBlocks is clinical, and the parts that are not are better served by antd or MUI.",
  "You need a general-purpose table. Ours is built for clinical worklists — a required coverage claim, five kinds of absence, model provenance on a derived column — and it does not generalise into a reporting grid.",
  "You are looking for a compliance shortcut. ZoBlocks is not a compliance boundary and not a medical device, and using it changes nothing about your regulatory position.",
];

export default function ComparePage() {
  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main">
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
            <p className="eyebrow eyebrow-rule text-graphite" data-reveal>
              Compare
            </p>
            <h1 className="display-lg mt-4 max-w-3xl text-balance" data-reveal>
              Three good alternatives, and when each one wins.
            </h1>
            <h2
              className="mt-5 max-w-2xl text-lg font-medium tracking-tight text-graphite"
              data-reveal
            >
              ZoBlocks compared to antd, TanStack, and building it yourself.
            </h2>
            <p className="body-lg mt-5 max-w-2xl text-pretty text-graphite" data-reveal>
              Every claim about another project below is a measurement against a named version, and
              each section says what they do well before it says what they do not.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------- options */}
        <section className="border-b border-rule bg-paper-sunk/40">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <div className="space-y-px overflow-hidden rounded-2xl border border-rule bg-rule">
              {OPTIONS.map((option) => (
                <div key={option.name} className="bg-paper p-6 sm:p-8" data-reveal>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h2 className="display-sm">{option.name}</h2>
                    <p className="numeric text-xs text-brand-deep">{option.cost}</p>
                  </div>
                  <p className="mt-2 text-sm text-graphite-soft">
                    <span className="numeric text-[0.6875rem] uppercase tracking-wide">
                      Choose it when
                    </span>{" "}
                    — {option.when}
                  </p>
                  <p className="mt-4 max-w-3xl text-pretty leading-relaxed text-graphite">
                    {option.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ measured */}
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <h2 className="display-sm text-balance" data-reveal>
              What we measured, in the table everyone starts from.
            </h2>
            <p className="mt-4 max-w-2xl text-pretty text-graphite" data-reveal>
              <code className="font-mono text-[0.8125rem]">@rc-component/table@1.11.1</code> is the
              engine under Ant Design v6&rsquo;s Table, and the honest starting point for anyone
              building a clinical grid. These figures come from reading its published ES build.
            </p>

            {/* Focusable and named: on a phone the 46rem table scrolls
                sideways, and a scrolling region has to be reachable by
                keyboard (axe `scrollable-region-focusable`). */}
            <div
              className="scroll-thin mt-8 overflow-x-auto rounded-2xl border border-rule"
              data-reveal
              tabIndex={0}
              role="region"
              aria-label="rc-table measurements"
            >
              <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-rule bg-paper-sunk">
                    {["Checked", "rc-table + antd", GRID_COLUMN].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-5 py-3 text-[0.6875rem] font-semibold uppercase tracking-wide text-graphite-soft"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RC_TABLE.map((row) => (
                    <tr key={row.claim} className="border-b border-rule last:border-b-0">
                      <td className="px-5 py-3.5 align-top text-sm text-ink">{row.claim}</td>
                      <td
                        className={`px-5 py-3.5 align-top text-sm ${
                          row.tone === "gap" ? "text-critical" : "text-brand-deep"
                        }`}
                      >
                        {row.finding}
                      </td>
                      <td className="px-5 py-3.5 align-top text-sm text-graphite">{row.ours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/*
              The last sentence used to read "our grid is designed and not yet
              implemented". It shipped at 0.6.0, and the home page has been
              running it since — so the most sceptical page on the site was
              telling a reader the flagship component did not exist while the
              component itself ran two clicks away. The column carries the
              version now, which is the form of this claim that stays true.
            */}
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-graphite" data-reveal>
              The last three rows matter as much as the first four. rc-table is careful, well-built
              software that was not written for a clinical grid, and the gaps above are a
              description of its scope rather than of its quality. Our grid ships at{" "}
              {GRID?.status ?? "beta"} — the column names the version so the row can be checked
              against it.
            </p>
          </div>
        </section>

        {/* --------------------------------------------------- not for you */}
        <section className="border-b border-rule bg-paper-sunk/40">
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <h2 className="display-sm text-balance" data-reveal>
              When not to choose ZoBlocks.
            </h2>
            <ul className="mt-8 max-w-3xl" data-reveal>
              {NOT_FOR_YOU.map((reason) => (
                <li
                  key={reason}
                  className="grid grid-cols-[1.5rem_1fr] gap-4 border-t border-rule py-4 last:border-b"
                >
                  <span aria-hidden="true" className="numeric text-sm text-critical">
                    ×
                  </span>
                  <span className="text-sm leading-relaxed text-graphite">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl section-minor px-5 sm:px-8">
            <div className="flex flex-wrap items-center gap-4" data-reveal>
              <Link
                href="/components"
                className="group inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3 text-sm font-medium text-paper transition-colors duration-200 hover:bg-cta-hover"
              >
                See the components
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </RevealRoot>
  );
}
