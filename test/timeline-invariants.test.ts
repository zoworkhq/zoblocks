/**
 * The chronology engine, held to the three things that can break it silently.
 *
 * Sort, group and cluster are three transformations over one list. Each can
 * drop a record without a visible symptom — the timeline still renders, still
 * looks complete, and is missing an event. That is the exact failure the
 * component exists to prevent one layer up, so it gets a property test rather
 * than an example.
 *
 * The generator is seeded rather than random. A property test that fails once
 * in forty runs and cannot be reproduced is a test the team learns to re-run.
 */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_TIMELINE_LOCALE,
  KIND_REGISTER,
  buildTimeline,
  chooseGrouping,
  compareByTime,
  describeCoverage,
  emptyStateOf,
  formatFhirDateTime,
  instantOf,
  parseDuration,
  precisionOf,
  resolveStatus,
  validateCoverage,
  type TimelineCoverage,
  type TimelineEvent,
  type TimelineKind,
  type TimelineStatus,
} from "../registry/zoblocks/lib/timeline-core";

const NOW = "2026-08-18T10:40:00+05:30";
const SOURCE = { id: "ehr", label: "Northside EHR", status: "ok" } as const;
const COVERAGE: TimelineCoverage = { order: "newest-first", sources: [SOURCE] };

/** A small linear congruential generator, so a failure reproduces exactly. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

const KINDS = Object.keys(KIND_REGISTER) as TimelineKind[];
const STATUSES: TimelineStatus[] = [
  "occurred",
  "planned",
  "cancelled",
  "not-done",
  "amended",
  "in-error",
  "unknown",
];

function generate(seed: number, count: number): TimelineEvent[] {
  const random = seeded(seed);
  const events: TimelineEvent[] = [];
  for (let index = 0; index < count; index += 1) {
    const year = 2024 + Math.floor(random() * 3);
    const month = 1 + Math.floor(random() * 12);
    const day = 1 + Math.floor(random() * 28);
    const precision = random();
    const occurred =
      precision < 0.1
        ? `${year}`
        : precision < 0.25
          ? `${year}-${String(month).padStart(2, "0")}`
          : precision < 0.55
            ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            : `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T0${Math.floor(
                random() * 9,
              )}:30:00Z`;

    const kind = KINDS[Math.floor(random() * KINDS.length)] ?? "encounter";
    const status = STATUSES[Math.floor(random() * STATUSES.length)] ?? "occurred";
    const critical = random() < 0.08;

    // Built as two branches rather than a spread, because the union is the
    // point: severity and its status word travel together or not at all, and a
    // spread would let the type collapse to "maybe both, maybe neither".
    const base = {
      id: `e${index}`,
      kind: kind === "other" ? ("encounter" as const) : kind,
      occurred,
      status,
      title: `Event ${index}`,
    };
    events.push(
      critical ? { ...base, severity: "critical", severityStatus: "Potassium 6.8" } : base,
    );
  }
  return events;
}

describe("the pipeline loses nothing", () => {
  it.each([1, 2, 3, 7, 11, 13, 42, 99])(
    "accounts for every event across sort, group and cluster (seed %i)",
    (seed) => {
      const events = generate(seed, 60);
      for (const group of ["auto", "month", "quarter", "year", "none"] as const) {
        for (const order of ["newest-first", "oldest-first"] as const) {
          for (const limit of [undefined, 5, 25]) {
            const model = buildTimeline({
              events,
              now: NOW,
              coverage: { ...COVERAGE, order },
              group,
              cluster: { kinds: ["observation", "laboratory"], within: "P7D", min: 3 },
              limit,
            });

            const rendered = model.sections.reduce(
              (total, section) =>
                total +
                section.rows.reduce(
                  (rows, row) =>
                    rows +
                    (row.type === "event" ? 1 : row.type === "cluster" ? row.members.length : 0),
                  0,
                ),
              0,
            );

            expect(rendered + model.truncated, `${group}/${order}/${limit}`).toBe(events.length);
            expect(model.shown + model.truncated).toBe(events.length);
          }
        }
      }
    },
  );

  it("emits every event exactly once", () => {
    const events = generate(5, 40);
    const model = buildTimeline({
      events,
      now: NOW,
      coverage: COVERAGE,
      cluster: { kinds: ["observation"], within: "P7D", min: 2 },
    });

    const seen: string[] = [];
    for (const section of model.sections) {
      for (const row of section.rows) {
        if (row.type === "event") seen.push(row.resolved.event.id);
        if (row.type === "cluster") seen.push(...row.members.map((member) => member.event.id));
      }
    }
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen.sort()).toEqual(events.map((event) => event.id).sort());
  });
});

describe("collapsing may not hide", () => {
  it("never puts a critical event inside a cluster", () => {
    // The cluster chip says "none critical". That is honest only because
    // reaching a cluster is the only way one gets made, and this is the rule
    // that makes it true.
    for (const seed of [1, 2, 3, 4, 5]) {
      const model = buildTimeline({
        events: generate(seed, 80),
        now: NOW,
        coverage: COVERAGE,
        cluster: { kinds: KINDS, within: "P30D", min: 2 },
      });
      for (const section of model.sections) {
        for (const row of section.rows) {
          if (row.type !== "cluster") continue;
          for (const member of row.members) {
            expect(member.event.severity, `seed ${seed}`).toBeUndefined();
            expect(member.status).not.toBe("in-error");
            expect(member.status).not.toBe("lapsed");
          }
        }
      }
    }
  });

  it("never puts a restricted event inside a cluster", () => {
    const events: TimelineEvent[] = [
      { id: "a", kind: "observation", occurred: "2026-08-01", title: "One" },
      { id: "b", kind: "observation", occurred: "2026-08-02", title: "Two" },
      {
        id: "c",
        kind: "observation",
        occurred: "2026-08-03",
        title: "Three",
        access: { kind: "withheld", reason: "Kept separately." },
      },
      { id: "d", kind: "observation", occurred: "2026-08-04", title: "Four" },
    ];
    const model = buildTimeline({
      events,
      now: NOW,
      coverage: COVERAGE,
      group: "none",
      cluster: { kinds: ["observation"], within: "P7D", min: 2 },
    });
    const clustered = model.sections
      .flatMap((section) => section.rows)
      .filter((row) => row.type === "cluster")
      .flatMap((row) => (row.type === "cluster" ? row.members : []))
      .map((member) => member.event.id);
    expect(clustered).not.toContain("c");
  });
});

describe("ordering is total and stable", () => {
  it("orders identical timestamps identically on every render", () => {
    // Bulk-imported records routinely share an instant to the second. Falling
    // back to input order would mean the same data renders two ways in two
    // sessions, and neither would be wrong on screen.
    const events: TimelineEvent[] = ["c", "a", "b", "d"].map((id) => ({
      id,
      kind: "observation",
      occurred: "2026-08-10T09:00:00Z",
      title: id,
    }));

    const ids = (input: TimelineEvent[]) =>
      buildTimeline({ events: input, now: NOW, coverage: COVERAGE, group: "none" })
        .sections.flatMap((section) => section.rows)
        .flatMap((row) => (row.type === "event" ? [row.resolved.event.id] : []));

    expect(ids(events)).toEqual(ids([...events].reverse()));
    expect(ids(events)).toEqual(["a", "b", "c", "d"]);
  });

  it("orders a coarser value before the finer ones inside it", () => {
    const year = { id: "y", kind: "condition" as const, occurred: "2019", title: "Year" };
    const day = { id: "d", kind: "condition" as const, occurred: "2019-01-01", title: "Day" };
    const resolve = (event: TimelineEvent) => ({
      event,
      status: "occurred" as const,
      register: "clinical" as const,
      at: instantOf(event.occurred),
      precision: precisionOf(event.occurred),
      future: false,
      isNew: false,
      protectedFromClustering: false,
    });
    expect(compareByTime(resolve(year), resolve(day), "newest-first")).toBeLessThan(0);
  });
});

describe("time keeps the precision the record holds", () => {
  it.each([
    ["2019", "year"],
    ["2019-04", "month"],
    ["2019-04-02", "day"],
    ["2019-04-02T09:15:00+05:30", "second"],
    ["2019-04-02T09:15+05:30", "minute"],
  ])("reads %s as %s", (value, expected) => {
    expect(precisionOf(value)).toBe(expected);
  });

  it("reports an unreadable value as unreadable rather than as absent", () => {
    expect(precisionOf("last Tuesday")).toBeUndefined();
    expect(Number.isNaN(instantOf("last Tuesday"))).toBe(true);
  });

  it("renders a year as a year", () => {
    expect(formatFhirDateTime("2019", { locale: "en-GB" })).toBe("2019");
  });

  it("renders a stamp in the record's zone, not the reader's", () => {
    // 09:30 in New York stays 09:30 in New York, whatever the viewer's zone is.
    const rendered = formatFhirDateTime("2026-04-02T09:30:00-04:00", { locale: "en-GB" });
    expect(rendered).toContain("09:30");
    expect(rendered).toContain("-04:00");
  });

  it("reads the ISO durations a timeline needs, and nothing else", () => {
    expect(parseDuration("P3D")).toBe(3 * 86_400_000);
    expect(parseDuration("PT4H")).toBe(4 * 3_600_000);
    expect(parseDuration("P1M")).toBe(30 * 86_400_000);
    expect(parseDuration("three days")).toBeUndefined();
    expect(parseDuration(undefined)).toBeUndefined();
  });

  it("chooses a grouping from the span rather than hardcoding one", () => {
    const day = 86_400_000;
    expect(chooseGrouping(200 * day)).toBe("month");
    expect(chooseGrouping(3 * 365 * day)).toBe("quarter");
    expect(chooseGrouping(12 * 365 * day)).toBe("year");
  });
});

describe("grouping never invents a precision", () => {
  it("puts a year-only date in a year bucket, whatever grouping was asked for", () => {
    // Grouped by month, a FHIR `2019` produced a header reading "January 2019"
    // — inventing a January in exactly the place the component refuses to
    // invent one on the event itself. Caught by looking at the rendered page,
    // which is why this assertion exists rather than a screenshot.
    const model = buildTimeline({
      events: [
        { id: "a", kind: "condition", occurred: "2019", title: "Gestational diabetes" },
        { id: "b", kind: "encounter", occurred: "2026-08-12T10:00:00Z", title: "Clinic" },
      ],
      now: NOW,
      coverage: COVERAGE,
      group: "month",
    });
    const keys = model.sections.map((section) => section.key);
    expect(keys).toContain("2019");
    expect(keys).not.toContain("2019-01");
  });

  it("keeps a month-only date out of a day-level claim", () => {
    const model = buildTimeline({
      events: [{ id: "a", kind: "note", occurred: "2026-03", title: "Letter" }],
      now: NOW,
      coverage: COVERAGE,
      group: "month",
    });
    expect(model.sections[0]?.key).toBe("2026-03");
  });

  it("does not title the section that has no period", () => {
    // `group="none"` produces one section covering everything. Naming it "All"
    // is a heading that says nothing, and a heading that says nothing is still
    // in the outline a screen-reader user navigates by.
    const model = buildTimeline({
      events: [{ id: "a", kind: "note", occurred: "2026-03-04", title: "Letter" }],
      now: NOW,
      coverage: COVERAGE,
      group: "none",
    });
    expect(model.sections[0]?.titled).toBe(false);
  });

  it("still titles a real period", () => {
    const model = buildTimeline({
      events: [{ id: "a", kind: "note", occurred: "2026-03-04", title: "Letter" }],
      now: NOW,
      coverage: COVERAGE,
      group: "month",
    });
    expect(model.sections[0]?.titled).toBe(true);
  });
});

describe("a group heading agrees with the row under it", () => {
  // Grouping by UTC put 2026-09-01T02:00+10:00 under August while its row read
  // "1 Sep 2026, 02:00 +10:00". Headings read the record's own wall clock.
  const LATER = "2030-01-01T00:00:00Z";
  const keysFor = (occurred: string, group: "month" | "quarter" | "year") =>
    buildTimeline({
      events: [{ id: "a", kind: "note", occurred, title: "Letter" }],
      now: LATER,
      coverage: COVERAGE,
      group,
    }).sections.map((section) => section.key);

  it.each([
    ["2026-09-01T02:00:00+10:00", "month", "2026-09"],
    ["2026-08-31T22:00:00-05:00", "month", "2026-08"],
    ["2026-10-01T01:00:00+05:30", "quarter", "2026-Q4"],
    ["2026-06-30T23:30:00-04:00", "quarter", "2026-Q2"],
    ["2027-01-01T00:30:00+01:00", "year", "2027"],
    ["2026-12-31T20:00:00-08:00", "year", "2026"],
  ] as const)("%s by %s is %s", (occurred, group, key) => {
    expect(keysFor(occurred, group)).toEqual([key]);
  });

  it("orders by true instant, and keeps keys unique when zones interleave months", () => {
    const model = buildTimeline({
      events: [
        { id: "aug-utc", kind: "note", occurred: "2026-08-31T20:00:00Z", title: "B" },
        // 2026-08-31T16:00Z — earlier than the row above, but September on its own clock.
        { id: "sep-local", kind: "note", occurred: "2026-09-01T02:00:00+10:00", title: "A" },
        { id: "aug", kind: "note", occurred: "2026-08-30T12:00:00Z", title: "C" },
      ],
      now: LATER,
      coverage: COVERAGE,
      group: "month",
    });
    const ids = model.sections.flatMap((section) =>
      section.rows.flatMap((row) => (row.type === "event" ? [row.resolved.event.id] : [])),
    );
    expect(ids).toEqual(["aug-utc", "sep-local", "aug"]);
    expect(model.sections.map((section) => section.label)).toEqual([
      "2026-08",
      "2026-09",
      "2026-08",
    ]);
    expect(new Set(model.sections.map((section) => section.key)).size).toBe(3);
    // The repeat is marked, so a caller can say so rather than print the same
    // heading twice.
    expect(model.sections.map((section) => section.continued)).toEqual([false, false, true]);
  });
});

describe("planned and lapsed are derived, never written", () => {
  it("turns a planned event whose time has passed into a lapsed one", () => {
    const nowAt = instantOf(NOW);
    const future: TimelineEvent = {
      id: "a",
      kind: "appointment",
      occurred: "2026-09-01",
      status: "planned",
      title: "Later",
    };
    const past: TimelineEvent = { ...future, id: "b", occurred: "2026-08-01" };
    expect(resolveStatus(future, nowAt)).toBe("planned");
    expect(resolveStatus(past, nowAt)).toBe("lapsed");
  });

  it("leaves a cancelled appointment cancelled, whatever the date", () => {
    // Someone decided. That is not the same fact as nothing being recorded.
    const cancelled: TimelineEvent = {
      id: "a",
      kind: "appointment",
      occurred: "2026-08-01",
      status: "cancelled",
      title: "Called off",
    };
    expect(resolveStatus(cancelled, instantOf(NOW))).toBe("cancelled");
  });
});

describe("the coverage claim", () => {
  it("says the total, the order and what is hidden", () => {
    const coverage: TimelineCoverage = {
      order: "newest-first",
      total: 43,
      window: { from: "2025-07-01" },
      hidden: [
        { reason: "filter", count: 5, label: "Clinical" },
        { reason: "access", count: 2 },
      ],
      sources: [SOURCE],
    };
    const sentence = describeCoverage(
      coverage,
      { shown: 8, truncated: 0 },
      DEFAULT_TIMELINE_LOCALE,
    );
    expect(sentence.headline).toBe("Showing 8 of 43 events");
    expect(sentence.detail).toContain("newest first");
    expect(sentence.detail).toContain("5 hidden by the “Clinical” filter");
    expect(sentence.detail).toContain("2 you do not have access to");
    expect(sentence.detail).toContain("28 beyond this page");
  });

  it("compresses to sources reached, and never to nothing", () => {
    const sentence = describeCoverage(
      {
        order: "newest-first",
        sources: [
          SOURCE,
          { id: "hie", label: "Exchange", status: "unavailable", detail: "Timed out." },
        ],
      },
      { shown: 3, truncated: 0 },
      DEFAULT_TIMELINE_LOCALE,
    );
    expect(sentence.compact).toBe("1 of 2 sources reached");
    expect(sentence.degraded).toBe(true);
  });

  it("refuses a failure with no reason", () => {
    const problems = validateCoverage({
      order: "newest-first",
      sources: [{ id: "hie", label: "Exchange", status: "unavailable" }],
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("say what happened");
  });

  it("tells the three empty states apart", () => {
    const none = { shown: 0 };
    expect(emptyStateOf({ order: "newest-first", sources: [SOURCE] }, none)).toBe("no-record");
    expect(
      emptyStateOf(
        { order: "newest-first", window: { from: "2025-01-01" }, sources: [SOURCE] },
        none,
      ),
    ).toBe("none-in-window");
    expect(
      emptyStateOf(
        { order: "newest-first", hidden: [{ reason: "access", count: 2 }], sources: [SOURCE] },
        none,
      ),
    ).toBe("none-visible");
    expect(emptyStateOf({ order: "newest-first", sources: [SOURCE] }, { shown: 1 })).toBe("none");
  });
});

describe("declared gaps are placed, including across a group boundary", () => {
  it("puts a gap between the two events it falls between", () => {
    const events: TimelineEvent[] = [
      { id: "new", kind: "encounter", occurred: "2026-06-22", title: "After the gap" },
      { id: "old", kind: "medication", occurred: "2026-04-02", title: "Before the gap" },
    ];
    const model = buildTimeline({
      events,
      now: NOW,
      // The interesting gaps are exactly the ones that span a month boundary,
      // so grouping must not be able to swallow them.
      group: "month",
      coverage: {
        ...COVERAGE,
        gaps: [{ from: "2026-04-03", to: "2026-06-21", reason: "one source was not reached" }],
      },
    });
    const rows = model.sections.flatMap((section) => section.rows);
    const gapIndex = rows.findIndex((row) => row.type === "gap");
    expect(gapIndex).toBeGreaterThan(-1);
    expect(rows[gapIndex - 1]?.type).toBe("event");
  });
});
