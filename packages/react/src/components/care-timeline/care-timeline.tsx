"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/zoblocks/care-timeline/care-timeline.tsx. Edit that file, not this one.
/**
 * CareTimeline — a chronology that states what it is a view of.
 *
 * Every other timeline renders the events it is handed. What makes a timeline
 * dangerous is the ones it was not: a chronological list is read as an
 * *account*, and an account is understood to be continuous, so a gap becomes a
 * fact. Meanwhile the list on screen is a slice — paginated to five, filtered
 * to one register, assembled from sources that fail independently. A clinician
 * who reads a timeline with no imaging on it orders a CT; the study was done
 * eleven weeks ago at another hospital and the exchange query timed out.
 *
 * So `coverage` is required. Not conventionally required — required in the
 * type, with no default, because every plausible default is a claim the caller
 * did not make. It names the window, the sources and their health, the
 * filters, the order and the counts; it renders as a sentence in a fixed place;
 * and it is one of the few things in this library that always prints.
 *
 * Three more rules the component will not let a caller break.
 *
 *   1. **Planned is not happened.** A future event sits above a `now` marker
 *      derived from the caller's `now`; a planned event whose time has passed
 *      with nothing recorded against it is `lapsed`, and it says what is *not*
 *      known rather than asserting a no-show.
 *   2. **An erroneous record is retained and marked.** `in-error` renders
 *      struck, with the correction unstruck beneath it. There is no prop that
 *      hides it, because removing it is the one behaviour the record's own
 *      rules forbid.
 *   3. **Collapsing may not hide.** A cluster's "none critical" chip is honest
 *      only because anything a reader would act on is promoted out before the
 *      cluster forms. That promotion is in `timeline-core`, with a test.
 *
 * Layout, dates and words are all replaceable. The coverage sentence is not.
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import { Timeline, type TimelineItemType } from "../../components/timeline/timeline";
import {
  DEFAULT_TIMELINE_LOCALE,
  PATIENT_TIMELINE_LOCALE,
  TIMELINE_REGISTERS,
  buildTimeline,
  describeCoverage,
  emptyStateOf,
  formatFhirDateTime,
  formatGroupLabel,
  formatRelative,
  instantOf,
  registerOf,
  splitByRegister,
  typeLabelOf,
  validateCoverage,
  type ClusterOptions,
  type FhirDateTime,
  type GroupBy,
  type HiddenCount,
  type ResolvedEvent,
  type TimelineCoverage,
  type TimelineEvent,
  type TimelineKind,
  type TimelineLocale,
  type TimelineRegister,
  type TimelineRow,
  type TimelineSection,
  type TimelineStep,
  type SourceStatus,
  type TypedTimelineEvent,
} from "../../lib/timeline-core";

export type CareTimelineLayout = "default" | "card" | "compact" | "register";
export type CareTimelineAudience = "clinician" | "patient";
export type CareTimelineHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * `onSelect` shadows the DOM event of the same name deliberately.
 *
 * Naming the handler after the event is this repository's rule, and a timeline
 * whose selection handler is called `onEventSelect` reads as though there is a
 * second, plainer one somewhere. The native text-selection event is not
 * something a caller wants on a chronology.
 */
interface CareTimelineOwnProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "children" | "onSelect"
> {
  /**
   * The events.
   *
   * `TypedTimelineEvent` rather than `TimelineEvent`: `kind: "other"` requires
   * a `typeLabel`, so an unlabelled unknown is a build error at the call site
   * instead of a blank chip in a chart.
   */
  events: readonly TypedTimelineEvent[];

  /**
   * What this timeline is a view of. Required, with no default.
   *
   * The one prop that makes the component worth using. Four honest lines is
   * the floor: `{ sources: [{ id, label, status: "ok" }], order }`.
   */
  coverage: TimelineCoverage;

  /**
   * Now, supplied by the caller.
   *
   * Reading the clock here would make the `now` marker, the lapsed state and
   * every relative time undoable by a visual-regression baseline, and this
   * repository lints against it for that reason.
   */
  now: FhirDateTime;

  /**
   * How the chronology is laid out — a single rail, or split by source. Changes the reading
   * order, so it is a content decision rather than a visual one.
   */
  layout?: CareTimelineLayout;
  /**
   * What events are grouped by: day, encounter, or source. Ungrouped, a busy chart reads as a
   * list of timestamps.
   */
  group?: GroupBy;
  /**
   * When to collapse a run of similar events into one row, or `false` never to. Twelve vitals
   * recorded in one hour are one event to a reader and twelve to a renderer.
   */
  cluster?: ClusterOptions | false;

  /** What the reader had already seen. Never computed here. */
  seenThrough?: FhirDateTime;
  /** ISO 8601. A recording gap at least this long is stated on the event. */
  lateEntryAfter?: string;
  /** Render at most this many events. The remainder is reported, never dropped. */
  limit?: number;

  /** Selects the string catalog. Different words, not a softer tone. */
  audience?: CareTimelineAudience;
  /** Replace individual strings. Merged over the audience's catalog. */
  locale?: Partial<TimelineLocale>;
  /** BCP 47. Passed to `Intl` for dates. */
  localeTag?: string;

  /**
   * Heading level for the group headers.
   *
   * Omitted by default. A timeline nested in a tab panel inside a chart page
   * can sit four levels deep, and a component that hardcodes its level
   * produces an outline worse than no headings at all — so with no level given
   * the groups are labelled regions rather than headings.
   */
  headingLevel?: CareTimelineHeadingLevel;

  /** Registers to show, controlled. Hidden events are counted in the sentence. */
  registers?: readonly TimelineRegister[];
  /**
   * Which registers are shown on first render — labs, medications, notes, encounters. The
   * reader can change them; this is only where they start.
   */
  defaultRegisters?: readonly TimelineRegister[];
  /**
   * Fired when the reader shows or hides a register. Worth persisting: a clinician's register
   * selection is a working preference, not a one-off.
   */
  onRegistersChange?: (registers: TimelineRegister[]) => void;
  /**
   * Kinds to show, controlled. No built-in UI: twenty-one toggles is not a
   * filter bar, it is a form. The cost still reaches the coverage sentence.
   */
  kinds?: readonly TimelineKind[];
  /** Show the register filter. Off for `layout="card"`, which has no room. */
  filters?: boolean;
  /**
   * Show the jump control. Moves the reader to a period and announces where it
   * landed; it never changes what is rendered, because a control that filtered
   * and navigated at once would make the coverage sentence ambiguous.
   */
  jump?: boolean;

  /** Per-kind node marks. Decoration: the kind is always rendered as text too. */
  icons?: Partial<Record<string, React.ReactNode>>;

  /**
   * Fired with the chosen event. Without it the timeline is a read-only account, which is a
   * legitimate way to use it.
   */
  onSelect?: (event: TimelineEvent) => void;
  /**
   * Fired when the reader reaches the start of the loaded window. The component states how
   * many events lie beyond the page rather than pretending the window is the record.
   */
  onLoadOlder?: () => void;
  /**
   * Fires once per rendered coverage claim.
   *
   * For the host's audit record. The component does not write one itself — a
   * component that writes audit records is infrastructure.
   */
  onRead?: (coverage: TimelineCoverage) => void;
}

export type CareTimelineProps = CareTimelineOwnProps &
  ({ "aria-label": string } | { "aria-labelledby": string });

/* ------------------------------------------------------------------ */
/* Marks                                                               */
/* ------------------------------------------------------------------ */

function Glyph({ d }: { d: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

/**
 * Nine marks, chosen by register and by the states a reader acts on.
 *
 * Not one per kind. The kind is always rendered as text beside the node, so an
 * icon here is emphasis; twenty-one glyphs would be twenty-one chances for the
 * picture and the word to disagree.
 */
const MARKS = {
  clinical:
    "M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1M8 15a6 6 0 0 0 12 0v-3",
  administrative:
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  communication:
    "M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2ZM2 7l9.5 6L21 7",
  "patient-reported": "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z",
  system: "M3 5a9 3 0 1 0 18 0 9 3 0 1 0-18 0M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0",
  critical:
    "M10.3 3.1 1.8 17.5A2 2 0 0 0 3.5 20.5h17a2 2 0 0 0 1.7-3L13.7 3.1a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01",
  restricted:
    "M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2ZM7 11V7a5 5 0 0 1 10 0v4",
  "in-error": "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM15 9l-6 6M9 9l6 6",
  gap: "M10.3 3.1 1.8 17.5A2 2 0 0 0 3.5 20.5h17a2 2 0 0 0 1.7-3L13.7 3.1a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01",
} as const;

function markFor(resolved: ResolvedEvent): React.ReactNode {
  if (resolved.event.severity === "critical") return <Glyph d={MARKS.critical} />;
  if (resolved.status === "in-error") return <Glyph d={MARKS["in-error"]} />;
  if (resolved.event.access && resolved.event.access.kind !== "open")
    return <Glyph d={MARKS.restricted} />;
  return <Glyph d={MARKS[resolved.register]} />;
}

/* ------------------------------------------------------------------ */
/* Parts                                                               */
/* ------------------------------------------------------------------ */

/**
 * Class names spelled out rather than assembled.
 *
 * `@zoblocks/no-dynamic-class-name` is right about this even where Tailwind is
 * not involved: a class built from a variable cannot be grepped, so the set of
 * things a stylesheet has to cover stops being visible from the code that uses
 * them. Each table is also the exhaustive list of a closed vocabulary, so a
 * value added to the union without a class here is a build error.
 */
const LAYOUT_CLASS: Readonly<Record<CareTimelineLayout, string>> = {
  default: "zb-care-timeline--default",
  card: "zb-care-timeline--card",
  compact: "zb-care-timeline--compact",
  register: "zb-care-timeline--register",
};

const REGISTER_CLASS: Readonly<Record<TimelineRegister, string>> = {
  clinical: "zb-care-timeline__item--clinical",
  administrative: "zb-care-timeline__item--administrative",
  communication: "zb-care-timeline__item--communication",
  "patient-reported": "zb-care-timeline__item--patient-reported",
  system: "zb-care-timeline__item--system",
};

const SOURCE_CLASS: Readonly<Record<SourceStatus, string>> = {
  ok: "zb-care-timeline__source--ok",
  partial: "zb-care-timeline__source--partial",
  unavailable: "zb-care-timeline__source--unavailable",
  excluded: "zb-care-timeline__source--excluded",
};

const STEP_CLASS: Readonly<Record<TimelineStep["state"], string>> = {
  done: "zb-care-timeline__step--done",
  open: "zb-care-timeline__step--open",
  "not-done": "zb-care-timeline__step--not-done",
};

type ChipTone = "plain" | "caution" | "critical" | "info";

const CHIP_CLASS: Readonly<Record<ChipTone, string>> = {
  plain: "zb-care-timeline__chip zb-care-timeline__chip--plain",
  caution: "zb-care-timeline__chip zb-care-timeline__chip--caution",
  critical: "zb-care-timeline__chip zb-care-timeline__chip--critical",
  info: "zb-care-timeline__chip zb-care-timeline__chip--info",
};

function partyText(party: { name: string; role?: string; organization?: string }): string {
  return [party.name, party.role, party.organization].filter(Boolean).join(" · ");
}

function Chip({ tone, children }: { tone: ChipTone; children: React.ReactNode }) {
  return <span className={CHIP_CLASS[tone]}>{children}</span>;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function CareTimeline({
  ref,
  events,
  coverage,
  now,
  layout = "default",
  group = "auto",
  cluster = false,
  seenThrough,
  lateEntryAfter,
  limit,
  audience = "clinician",
  locale: localeOverrides,
  localeTag,
  headingLevel,
  registers,
  defaultRegisters,
  onRegistersChange,
  kinds,
  filters = layout !== "card",
  jump = false,
  icons,
  onSelect,
  onLoadOlder,
  onRead,
  className,
  style,
  ...rest
}: CareTimelineProps & {
  /** The scrolling region. Useful for restoring a reader's position when they return to a chart. */
  ref?: React.Ref<HTMLElement>;
}) {
  const locale = React.useMemo<TimelineLocale>(
    () => ({
      ...(audience === "patient" ? PATIENT_TIMELINE_LOCALE : DEFAULT_TIMELINE_LOCALE),
      ...localeOverrides,
    }),
    [audience, localeOverrides],
  );

  const [uncontrolled, setUncontrolled] = React.useState<readonly TimelineRegister[]>(
    defaultRegisters ?? TIMELINE_REGISTERS,
  );
  const shown = registers ?? uncontrolled;
  const showAll = shown.length >= TIMELINE_REGISTERS.length;

  const setRegisters = React.useCallback(
    (next: TimelineRegister[]) => {
      if (registers === undefined) setUncontrolled(next);
      onRegistersChange?.(next);
    },
    [registers, onRegistersChange],
  );

  const visible = React.useMemo(
    () =>
      events.filter(
        (event) =>
          (showAll || shown.includes(registerOf(event))) && (!kinds || kinds.includes(event.kind)),
      ),
    [events, shown, showAll, kinds],
  );
  const filteredOut = events.length - visible.length;

  const model = React.useMemo(
    () =>
      buildTimeline({
        events: visible,
        now,
        coverage,
        group: layout === "card" ? "none" : group,
        cluster,
        seenThrough,
        lateEntryAfter,
        limit,
      }),
    [visible, now, coverage, group, cluster, seenThrough, lateEntryAfter, limit, layout],
  );

  /**
   * The filter's own cost, folded into the claim.
   *
   * A filter that hides five events and says so only inside its own popover —
   * which is usually off screen — has not said so.
   */
  const declaredCoverage = React.useMemo<TimelineCoverage>(() => {
    if (filteredOut <= 0) return coverage;
    const hidden: HiddenCount[] = [
      ...(coverage.hidden ?? []),
      {
        reason: "filter",
        count: filteredOut,
        label: shown.map((r) => locale.register[r]).join(", "),
      },
    ];
    return { ...coverage, hidden };
  }, [coverage, filteredOut, shown, locale]);

  const formatDate = React.useCallback(
    (value: FhirDateTime) => formatFhirDateTime(value, { locale: localeTag }) ?? value,
    [localeTag],
  );

  const sentence = describeCoverage(declaredCoverage, model, locale, formatDate);
  const problems = React.useMemo(() => validateCoverage(coverage), [coverage]);
  const empty = emptyStateOf(declaredCoverage, model);
  const nowAt = instantOf(now);
  const baseId = React.useId();

  /**
   * Where the jump control can land.
   *
   * A map of section key to its heading, populated by the sections themselves.
   * Focus moves with the scroll: a control that scrolls without moving focus
   * leaves a keyboard user exactly where they were and tells them nothing.
   */
  const headings = React.useRef(new Map<string, HTMLElement>());
  const registerHeading = React.useCallback((key: string, element: HTMLElement | null) => {
    if (element) headings.current.set(key, element);
    else headings.current.delete(key);
  }, []);

  /**
   * What arrived since the last render, announced as content.
   *
   * "3 new items" is a notification. The point of a live region on a chart is
   * that a result announces *itself*, so the reader learns what landed without
   * going to look. Silent on first render, because everything is new then and
   * announcing the whole chart is the same as announcing nothing.
   */
  const knownIds = React.useRef<Set<string> | undefined>(undefined);
  const [announcement, setAnnouncement] = React.useState("");
  React.useEffect(() => {
    const ids = new Set(visible.map((event) => event.id));
    const previous = knownIds.current;
    knownIds.current = ids;
    if (!previous) return;

    const arrived = visible.filter((event) => !previous.has(event.id));
    if (arrived.length === 0) return;
    setAnnouncement(
      arrived
        .map((event) =>
          [
            typeLabelOf(event, locale),
            event.title,
            formatFhirDateTime(event.occurred, { locale: localeTag }) ?? event.occurred,
          ].join(", "),
        )
        .join(". "),
    );
  }, [visible, locale, localeTag]);

  const readRef = React.useRef<string>("");
  React.useEffect(() => {
    const stamp = `${sentence.headline}|${sentence.detail}`;
    if (readRef.current === stamp) return;
    readRef.current = stamp;
    onRead?.(declaredCoverage);
  }, [sentence.headline, sentence.detail, declaredCoverage, onRead]);

  const label = "aria-label" in rest ? rest["aria-label"] : undefined;

  return (
    <section
      {...rest}
      ref={ref}
      data-zb-care-timeline=""
      data-zb-layout={layout}
      data-zb-order={coverage.order}
      data-zb-degraded={sentence.degraded ? "" : undefined}
      className={cn("zb-care-timeline", LAYOUT_CLASS[layout], className)}
      style={style}
    >
      {filters ? (
        <div className="zb-care-timeline__toolbar">
          {TIMELINE_REGISTERS.map((register) => {
            const on = shown.includes(register);
            return (
              <button
                key={register}
                type="button"
                className="zb-care-timeline__filter"
                aria-pressed={on}
                onClick={() =>
                  setRegisters(
                    on ? shown.filter((value) => value !== register) : [...shown, register],
                  )
                }
              >
                {locale.register[register]}
              </button>
            );
          })}
        </div>
      ) : null}

      {jump && model.sections.length > 1 ? (
        <div className="zb-care-timeline__toolbar">
          <label className="zb-care-timeline__jump-label" htmlFor={`${baseId}-jump`}>
            {locale.jumpToDate}
          </label>
          <select
            id={`${baseId}-jump`}
            className="zb-care-timeline__jump"
            aria-describedby={`${baseId}-jump-hint`}
            defaultValue=""
            onChange={(event) => {
              const target = headings.current.get(event.target.value);
              if (!target) return;
              // Guarded because scrolling is the optional half. A host without
              // `scrollIntoView` — jsdom, an older webview, a print context —
              // must still get the half that matters, which is focus landing
              // on the heading so a keyboard user is told where they are.
              target.scrollIntoView?.({ block: "start" });
              target.focus();
            }}
          >
            <option value="" disabled>
              {locale.jumpToDate}
            </option>
            {model.sections.map((section) => (
              <option key={section.key} value={section.key}>
                {sectionHeading(section, locale, localeTag)}
              </option>
            ))}
          </select>
          <span className="zb-care-timeline__hint" id={`${baseId}-jump-hint`}>
            {locale.jumpToDateHint}
          </span>
        </div>
      ) : null}

      {/* Announced as content, not as a count. Empty until something arrives —
          an empty live region announces nothing, which is what makes this safe
          to render unconditionally. */}
      <div role="status" aria-live="polite" className="zb-care-timeline__announce">
        {announcement}
      </div>

      {sentence.degraded || problems.length > 0 ? (
        <div className="zb-care-timeline__banner" role="alert">
          <span className="zb-care-timeline__banner-mark">
            <Glyph d={MARKS.gap} />
          </span>
          <div>
            <strong>{locale.sourceUnavailableLead}</strong>{" "}
            {coverage.sources
              .filter((source) => source.status === "unavailable")
              .map((source) =>
                source.detail
                  ? `${locale.sourceUnavailable(source.label)}: ${source.detail}`
                  : locale.sourceUnavailable(source.label),
              )
              .join(" ")}{" "}
            {locale.sourceNotAClaim}
            {problems.length > 0 ? (
              <ul className="zb-care-timeline__problems">
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}

      {model.sections.map((section, index) => (
        <Section
          key={section.key}
          section={section}
          previous={model.sections[index - 1]}
          locale={locale}
          localeTag={localeTag}
          headingLevel={headingLevel}
          nowAt={nowAt}
          now={now}
          seenThrough={seenThrough}
          icons={icons}
          onSelect={onSelect}
          listLabel={label ?? locale.listLabel}
          layout={layout}
          registerHeading={registerHeading}
        />
      ))}

      {empty === "none" ? null : (
        <p className="zb-care-timeline__empty">
          {empty === "no-record"
            ? locale.emptyNoRecord
            : empty === "none-in-window"
              ? locale.emptyNoneInWindow
              : locale.emptyNoneVisible}
        </p>
      )}

      <footer className="zb-care-timeline__coverage">
        <div>
          <span className="zb-care-timeline__coverage-lead">{sentence.headline}</span>
          {sentence.detail ? <> — {sentence.detail}</> : null}
          <ul className="zb-care-timeline__sources" aria-label={locale.sourcesLabel}>
            {declaredCoverage.sources.map((source) => (
              <li
                key={source.id}
                className={cn("zb-care-timeline__source", SOURCE_CLASS[source.status])}
              >
                <span className="zb-care-timeline__source-dot" aria-hidden="true" />
                {source.status === "ok"
                  ? source.label
                  : `${source.label} — ${source.detail ?? source.status}`}
              </li>
            ))}
          </ul>
        </div>
        {onLoadOlder ? (
          <button type="button" className="zb-care-timeline__action" onClick={onLoadOlder}>
            {locale.loadOlder}
          </button>
        ) : null}
      </footer>
    </section>
  );
}

CareTimeline.displayName = "CareTimeline";

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

/**
 * A heading level the caller chose, or a labelled div when they did not.
 *
 * A timeline nested in a tab panel inside a chart page can sit four levels
 * deep. A component that hardcodes its level produces an outline worse than no
 * headings at all, so the default is not to claim one.
 */
const HEADING_TAG = {
  0: "div",
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const;

/**
 * A section's name, as the heading, its list and the jump control all say it.
 *
 * One function so the three cannot disagree: a jump option reading "August
 * 2026 (continued)" must land on a heading that reads the same.
 */
function sectionHeading(
  section: TimelineSection,
  locale: TimelineLocale,
  localeTag: string | undefined,
): string {
  if (section.type === "planned") return locale.planned;
  const label = formatGroupLabel(section.label, localeTag);
  return section.continued ? locale.continued(label) : label;
}

interface SectionProps {
  section: TimelineSection;
  previous: TimelineSection | undefined;
  locale: TimelineLocale;
  localeTag: string | undefined;
  headingLevel: CareTimelineHeadingLevel | undefined;
  nowAt: number;
  now: FhirDateTime;
  seenThrough: FhirDateTime | undefined;
  icons: Partial<Record<string, React.ReactNode>> | undefined;
  onSelect: ((event: TimelineEvent) => void) | undefined;
  listLabel: string;
  layout: CareTimelineLayout;
  registerHeading: (key: string, element: HTMLElement | null) => void;
}

function Section({
  section,
  previous,
  locale,
  localeTag,
  headingLevel,
  nowAt,
  now,
  seenThrough,
  icons,
  onSelect,
  listLabel,
  layout,
  registerHeading,
}: SectionProps) {
  const heading = sectionHeading(section, locale, localeTag);
  const Heading = HEADING_TAG[headingLevel ?? 0];

  /**
   * The "new since you last looked" divider splits the section into two lists.
   *
   * A divider cannot be an `<li>` without lying about the list's contents, and
   * two named lists is what a rotor can actually navigate. So the boundary
   * becomes a real structural break rather than a horizontal rule floating
   * inside a list.
   */
  const boundary = seenThrough
    ? section.rows.findIndex((row) => row.type !== "event" || !row.resolved.isNew)
    : -1;
  const split = boundary > 0 && boundary < section.rows.length;
  // Computed here rather than at the divider: `split` already implies
  // `seenThrough` is set, and a second ternary down there would be a branch
  // that cannot be taken and cannot be tested.
  const shared = { locale, localeTag, nowAt, icons, onSelect, layout } as const;

  const seenLabel = seenThrough
    ? (formatFhirDateTime(seenThrough, { locale: localeTag }) ?? seenThrough)
    : "";
  const head = split ? section.rows.slice(0, boundary) : section.rows;
  const tail = split ? section.rows.slice(boundary) : [];

  return (
    <>
      {previous?.type === "planned" ? (
        <p className="zb-care-timeline__divider zb-care-timeline__divider--now">
          {locale.now} — {formatFhirDateTime(now, { locale: localeTag }) ?? now}
          <span className="zb-care-timeline__divider-rule" aria-hidden="true" />
        </p>
      ) : null}

      {section.titled ? (
        <Heading
          className="zb-care-timeline__group"
          tabIndex={-1}
          ref={(element: HTMLElement | null) => registerHeading(section.key, element)}
        >
          {heading}
          <span className="zb-care-timeline__group-rule" aria-hidden="true" />
          <span className="zb-care-timeline__group-count">{section.count}</span>
        </Heading>
      ) : null}

      <Rows rows={head} label={`${listLabel} — ${heading}`} {...shared} />

      {split ? (
        <>
          <p className="zb-care-timeline__divider">
            {locale.newSince(seenLabel)}
            <span className="zb-care-timeline__divider-rule" aria-hidden="true" />
          </p>
          <Rows rows={tail} label={`${listLabel} — ${heading}, earlier`} {...shared} />
        </>
      ) : null}
    </>
  );
}

/**
 * One list, or two columns split on register.
 *
 * `layout="register"` is the one alternating timeline that alternates on a
 * fact: which side an event is on *is* its register, which is what lets a
 * reader see that a results-ready email went out three minutes after the
 * result landed. Ant Design's `alternate` alternates to fill space, which
 * carries no information and doubles the horizontal scan distance for nothing.
 *
 * Two columns is the maximum. Under 768px the stylesheet collapses them and
 * the register survives as the kind label, because a two-column chronology on
 * a phone is not a design.
 */
function Rows({ rows, label, layout, ...context }: RowListProps & { layout: CareTimelineLayout }) {
  if (layout !== "register") return <RowList rows={rows} label={label} {...context} />;

  const { clinical, other } = splitByRegister(rows);
  return (
    <div className="zb-care-timeline__columns">
      <div className="zb-care-timeline__column">
        <p className="zb-care-timeline__column-head">{context.locale.registerColumnClinical}</p>
        <RowList
          rows={clinical}
          label={`${label} — ${context.locale.registerColumnClinical}`}
          {...context}
        />
      </div>
      <div className="zb-care-timeline__column">
        <p className="zb-care-timeline__column-head">{context.locale.registerColumnOther}</p>
        <RowList
          rows={other}
          label={`${label} — ${context.locale.registerColumnOther}`}
          {...context}
        />
      </div>
    </div>
  );
}

interface RowListProps {
  rows: readonly TimelineRow[];
  label: string;
  locale: TimelineLocale;
  localeTag: string | undefined;
  nowAt: number;
  icons: Partial<Record<string, React.ReactNode>> | undefined;
  onSelect: ((event: TimelineEvent) => void) | undefined;
}

function RowList({ rows, label, locale, localeTag, nowAt, icons, onSelect }: RowListProps) {
  if (rows.length === 0) return null;
  const items: TimelineItemType[] = rows.map((row) =>
    toItem(row, { locale, localeTag, nowAt, icons, onSelect }),
  );
  return <Timeline aria-label={label} items={items} />;
}

interface RenderContext {
  locale: TimelineLocale;
  localeTag: string | undefined;
  nowAt: number;
  icons: Partial<Record<string, React.ReactNode>> | undefined;
  onSelect: ((event: TimelineEvent) => void) | undefined;
}

function toItem(row: TimelineRow, context: RenderContext): TimelineItemType {
  if (row.type === "gap") {
    return {
      key: row.key,
      className: "zb-care-timeline__item--gap",
      icon: <Glyph d={MARKS.gap} />,
      content: (
        <p className="zb-care-timeline__gap-notice">{context.locale.gapNotice(row.gap.reason)}</p>
      ),
    };
  }

  if (row.type === "cluster") {
    return {
      key: row.key,
      className: "zb-care-timeline__item--cluster",
      icon: <Glyph d={MARKS[row.register]} />,
      content: <Cluster row={row} context={context} />,
    };
  }

  return eventItem(row.resolved, context);
}

function Cluster({
  row,
  context,
}: {
  row: Extract<TimelineRow, { type: "cluster" }>;
  context: RenderContext;
}) {
  const [open, setOpen] = React.useState(false);
  const { locale } = context;
  const kindWord = row.kind === "other" ? locale.kindOther : locale.kind[row.kind];

  return (
    <>
      <button
        type="button"
        className="zb-care-timeline__cluster"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="zb-care-timeline__cluster-count">
          {locale.clusterSummary(row.members.length, kindWord)}
        </span>
        <span className="zb-care-timeline__cluster-note">{locale.clusterNoneCritical}</span>
      </button>
      {open ? (
        <Timeline
          aria-label={locale.clusterSummary(row.members.length, kindWord)}
          items={row.members.map((member) => eventItem(member, context))}
        />
      ) : null}
    </>
  );
}

function eventItem(resolved: ResolvedEvent, context: RenderContext): TimelineItemType {
  const { locale, localeTag, nowAt, icons, onSelect } = context;
  const { event, status } = resolved;
  const withheld = event.access?.kind === "withheld";
  const gated = Boolean(event.access && event.access.kind !== "open" && !withheld);

  const kindWord = typeLabelOf(event, locale);
  const statusWord = status === "occurred" ? undefined : locale.status[status];
  const absolute = formatFhirDateTime(event.occurred, { locale: localeTag });
  // `lateBy` is only set when `recorded` parsed, so this is one branch rather
  // than a guard and a fallback that cannot both be reached.
  const recordedLabel =
    resolved.lateBy === undefined
      ? undefined
      : formatFhirDateTime(event.recorded, { locale: localeTag });
  const relative = formatRelative(resolved.at, nowAt, localeTag);

  const title = withheld ? locale.withheldTitle : gated ? locale.gatedTitle : event.title;

  return {
    key: event.id,
    className: cn(
      "zb-care-timeline__item",
      REGISTER_CLASS[resolved.register],
      status === "in-error" ? "zb-care-timeline__item--in-error" : undefined,
      status === "planned" ? "zb-care-timeline__item--planned" : undefined,
      event.severity === "critical" ? "zb-care-timeline__item--critical" : undefined,
    ),
    icon: icons?.[event.kind] ?? markFor(resolved),
    title: (
      <>
        <span className="zb-care-timeline__kind">
          {kindWord}
          {/* Shown for the two registers that change how a reader weighs the
              fact. "Patient reported" beside a symptom onset is not a hedge,
              it is the correct attribution. */}
          {resolved.register === "patient-reported" || resolved.register === "system" ? (
            <span className="zb-care-timeline__provenance">
              · {locale.register[resolved.register]}
            </span>
          ) : null}
          {statusWord ? (
            <Chip
              tone={status === "in-error" ? "critical" : status === "lapsed" ? "caution" : "plain"}
            >
              {statusWord}
            </Chip>
          ) : null}
          {event.severity ? (
            <Chip tone={event.severity === "critical" ? "critical" : "caution"}>
              {event.severityStatus}
            </Chip>
          ) : null}
        </span>
        <span className="zb-timeline__title-text">
          {event.href ? (
            <a className="zb-care-timeline__link" href={event.href}>
              {title}
            </a>
          ) : onSelect ? (
            <button
              type="button"
              className="zb-care-timeline__link"
              onClick={() => onSelect(event)}
            >
              {title}
            </button>
          ) : (
            title
          )}
        </span>
      </>
    ),
    content: (
      <>
        {event.detail && !withheld ? (
          <p className="zb-care-timeline__detail">{event.detail}</p>
        ) : null}
        {withheld && event.access?.kind === "withheld" ? (
          <p className="zb-care-timeline__detail">{event.access.reason}</p>
        ) : null}

        {event.steps && event.steps.length > 0 ? (
          <ol
            className="zb-care-timeline__steps"
            aria-label={locale.stepsLabel(String(event.title))}
          >
            {event.steps.map((step) => (
              <li key={step.label} className={cn("zb-care-timeline__step", STEP_CLASS[step.state])}>
                <span className="zb-care-timeline__step-dot" aria-hidden="true" />
                <span>{step.label}</span>
                <span className="zb-care-timeline__step-time">
                  {step.at ? (formatFhirDateTime(step.at, { locale: localeTag }) ?? step.at) : ""}
                </span>
              </li>
            ))}
          </ol>
        ) : null}

        {event.actor || event.recipient ? (
          <p className="zb-care-timeline__who">
            {event.actor ? partyText(event.actor) : null}
            {event.recipient ? ` → ${partyText(event.recipient)}` : null}
          </p>
        ) : null}

        <p className="zb-care-timeline__when">
          {/*
            `suppressHydrationWarning`: the instant is the same on both sides,
            but the words are the runtime's ICU data. Node renders
            "2 Sep 2026 at 09:30" and Safari "2 Sept 2026, 09:30" for the same
            `en-GB`, and the mismatch threw on every page with a timeline.
          */}
          <time dateTime={event.occurred} suppressHydrationWarning>
            {absolute ?? event.occurred}
          </time>
          {relative ? (
            <span aria-hidden="true" className="zb-care-timeline__ago">
              {relative}
            </span>
          ) : null}
          {recordedLabel ? <span>{locale.recordedLater(recordedLabel)}</span> : null}
        </p>

        {status === "lapsed" ? (
          <p className="zb-care-timeline__note zb-care-timeline__note--caution">
            {locale.lapsedDetail}
          </p>
        ) : null}

        {event.revision ? (
          <p
            className={cn(
              "zb-care-timeline__note",
              status === "in-error" ? "zb-care-timeline__note--critical" : undefined,
            )}
          >
            <strong>
              {locale.amendedBy(
                formatFhirDateTime(event.revision.at, { locale: localeTag }) ?? event.revision.at,
              )}
            </strong>
            {event.revision.reason ? ` — ${event.revision.reason}` : null}
            {event.revision.was ? ` (${locale.wasValue(event.revision.was)})` : null}
          </p>
        ) : null}

        {gated ? <p className="zb-care-timeline__note">{locale.gatedAction}</p> : null}
      </>
    ),
  };
}
