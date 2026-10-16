"use client";

/**
 * Live examples for DatePicker — every variant of the temporal control.
 *
 * The component's whole claim is that sixteen presentations share one value
 * space, one keyboard model and one accessibility contract. A claim about
 * sameness cannot be shown with one example, and it cannot be shown with
 * screenshots at all: that the calendar and the session triple and the slot
 * grid all answer Escape the same way is only visible if you press Escape.
 *
 * So everything here is the shipped component, one example per argument,
 * registered as example previews on the component page. These began as the
 * chaptered gallery; the chapters are now the example groups.
 */

import * as React from "react";
import {
  AppointmentScheduler,
  BEHAVIORAL_HEALTH_DURATIONS,
  BirthDateField,
  Calendar,
  ClinicalDateTime,
  DateField,
  DateRangeField,
  GroupSeriesScheduler,
  RecurrenceField,
  RecurringSeriesScheduler,
  SessionTimeField,
  TimeField,
  TimeRangeField,
  TimeSlotGrid,
  relativeDateOptions,
  timeGrid,
  DatePicker,
  type DatePickerProps,
  type DatePickerVariant,
} from "@/registry/zoblocks/date-picker/date-picker";
import {
  addCalendarDays,
  classifyLocalTime,
  dateRangePresets,
  formatPlainDate,
  plainDate,
  plainTime,
  sessionFrom,
  weekdayOf,
  withSessionEnd,
  type ZbDate,
  type ZbTime,
  type ZbTimeRange,
} from "@/lib/zoblocks-datetime";
import { buildSlots, type AvailabilitySet, type Slot } from "@/lib/zoblocks-availability";
import { THERAPY_CADENCES, type OccurrenceVerdict } from "@/lib/zoblocks-recurrence";
import { cn } from "@/lib/utils";
import { useSiteTheme } from "./use-site-theme";

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/*                                                                     */
/* Every date on this page is a literal. ENGINEERING.md §9 forbids the  */
/* component reading the wall clock, and the gallery holds itself to    */
/* the same rule — a demo whose output depends on when it rendered      */
/* cannot be visually regression-tested, and the screenshot in a review */
/* would disagree with the page a day later.                           */
/* ------------------------------------------------------------------ */

const TODAY: ZbDate = plainDate(2026, 8, 26);
const NOW_TIME: ZbTime = plainTime(10, 42);
const NOW = { date: TODAY, time: NOW_TIME };

const SIGNED = {
  kind: "instant" as const,
  date: plainDate(2026, 8, 24),
  time: plainTime(8, 12),
  zone: "America/New_York",
};

/** An organisation's own thresholds. The component ships none — see below. */
const BANDS = [
  { minMinutes: 0, maxMinutes: 15, code: null, label: "Not billable" },
  { minMinutes: 16, maxMinutes: 52, code: "SHORT", label: "Standard session" },
  { minMinutes: 53, maxMinutes: 999, code: "LONG", label: "Extended session" },
];

/** Weekends closed, a public holiday, and one provider-leave block. */
function clinicClosed(date: ZbDate): string | null {
  // The real weekday. This was `(date.d + 5) % 7`, which is only right in
  // August 2026 — and the calendars here show July and September too, where
  // it closed Wednesdays as "Weekend".
  const day = weekdayOf(date);
  if (day === 0 || day === 6) return "Weekend — clinic closed";
  if (date.m === 9 && date.d === 7) return "Labor Day — clinic closed";
  if (date.m === 9 && date.d >= 14 && date.d <= 16) return "Dr Osei on leave";
  return null;
}

function dayLoad(date: ZbDate): number | null {
  if (clinicClosed(date)) return null;
  return [8, 2, 5, 0, 3, 11, 1][date.d % 7] ?? null;
}

/* One morning of a real clinic: booked appointments, a lunch block, a room
   that is out, and one slot somebody else is mid-way through taking. */
const SLOTS: Slot[] = buildSlots({
  fromMinute: 8 * 60,
  toMinute: 17 * 60,
  everyMinutes: 30,
  durationMinutes: 50,
  idPrefix: "s",
  blocked: (start) => {
    const minute = start.h * 60 + start.mi;
    if (minute >= 12 * 60 && minute < 13 * 60) return "facility-closed";
    if (minute === 9 * 60 || minute === 10 * 60 + 30) return "booked";
    if (minute === 14 * 60) return "no-room";
    if (minute === 15 * 60 + 30) return "provider-unavailable";
    return null;
  },
}).map((slot) =>
  slot.start.h === 13 && slot.start.mi === 30
    ? { ...slot, state: { kind: "held" as const, by: "other" as const, expiresInSeconds: 96 } }
    : slot,
);

const AVAILABILITY: AvailabilitySet = {
  asOf: { date: TODAY, time: plainTime(10, 39) },
  staleAfterSeconds: 120,
  slots: SLOTS,
  exhausted: false,
};

const EXHAUSTED: AvailabilitySet = {
  asOf: { date: TODAY, time: plainTime(10, 41) },
  slots: [],
  exhausted: true,
};

const PROVIDERS = [
  {
    id: "osei",
    name: "Dr Ama Osei",
    role: "Psychiatry",
    zone: "America/New_York",
    zoneLabel: "ET",
  },
  {
    id: "reyes",
    name: "M. Reyes, LCSW",
    role: "Therapy",
    zone: "America/Chicago",
    zoneLabel: "CT",
  },
  {
    id: "lin",
    name: "Dr Wei Lin",
    role: "Psychiatry",
    zone: "America/Los_Angeles",
    zoneLabel: "PT",
  },
];

const DAY_LOADS = Array.from({ length: 28 }, (_, index) => {
  const date = addCalendarDays(TODAY, index);
  return { date, openCount: dayLoad(date) ?? 0 };
});

/*
 * Three collisions on a Tuesday series, as a host would compute them.
 *
 * The dates are occurrences of the rule below, which is the only way this
 * demonstrates anything: a verdict for a date the series never reaches is a
 * fixture that quietly proves nothing, and it is exactly what the first draft
 * of this file did.
 */
const VERDICTS: OccurrenceVerdict[] = [
  {
    date: "2026-09-08",
    reason: "Dr Osei on leave",
    alternative: { date: plainDate(2026, 9, 10), label: "Thu 10 Sep" },
  },
  {
    date: "2026-11-24",
    reason: "Thanksgiving week — programme closed",
    alternative: { date: plainDate(2026, 11, 25), label: "Wed 25 Nov" },
  },
  { date: "2026-10-13", reason: "Room 2 booked — no alternative room that hour" },
];

/* ------------------------------------------------------------------ */
/* Stage furniture                                                     */
/* ------------------------------------------------------------------ */

/** Demos that put two or three controls beside each other. */
function Row({ children }: { children: React.ReactNode }) {
  return <div className="zb-dt-demo-row">{children}</div>;
}

function Caption({ children }: { children: React.ReactNode }) {
  return <span className="zb-dt-demo-cap">{children}</span>;
}

function Labelled({ what, children }: { what: string; children: React.ReactNode }) {
  return (
    <div className="zb-dt-demo-col">
      <Caption>{what}</Caption>
      {children}
    </div>
  );
}

/**
 * The theme scope every example sits in.
 *
 * The date components draw from `--zb-*` tokens that `data-zb-theme` sets, so
 * an example outside one would render light on a dark site. It follows the
 * site; high contrast is only shown in the theme × density example.
 */
function Stage({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  const dark = useSiteTheme();
  return (
    <div
      data-zb-theme={dark ? "dark" : "light"}
      className={cn("w-full min-w-0", wide ? "" : "mx-auto max-w-3xl")}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Individual demos                                                    */
/* ------------------------------------------------------------------ */

/** v01 — the default variant: a field with a calendar behind a button. */
function PickerDemo() {
  const [value, setValue] = React.useState<ZbDate | null>(null);
  return (
    <div className="zb-dt-demo-col">
      <DateField
        label="Appointment date"
        showCalendar
        now={TODAY}
        value={value}
        onChange={setValue}
        unavailable={clinicClosed}
        load={dayLoad}
        calendarShortcuts={DATE_SHORTCUTS}
        calendarShowCustom
        calendarHints
        calendarCommit="explicit"
      />
      <Caption>value = {value ? formatPlainDate(value, "iso") : "null"}</Caption>
    </div>
  );
}

/** v02 — the same component with the popover switched off. */
function FieldDemo() {
  return (
    <Row>
      <Labelled what="Typed, no calendar">
        <DateField label="Date of service" now={TODAY} showRelative />
      </Labelled>
      <Labelled what="Posts ISO in a plain form">
        <DateField
          label="Referral received"
          now={TODAY}
          name="referral_date"
          defaultValue={plainDate(2026, 8, 21)}
          showRelative
        />
      </Labelled>
    </Row>
  );
}

/** v03 — three policies, three ARIA treatments, one component. */
function TiersDemo() {
  return (
    <Row>
      <Labelled what='futurePolicy="block"'>
        <DateField
          label="Date of birth"
          now={TODAY}
          futurePolicy="block"
          defaultValue={plainDate(2027, 1, 1)}
        />
      </Labelled>
      <Labelled what='futurePolicy="warn"'>
        <DateField
          label="Session documented"
          now={TODAY}
          futurePolicy="warn"
          defaultValue={plainDate(2026, 9, 2)}
        />
      </Labelled>
      <Labelled what="showRelative">
        <DateField
          label="Date of service"
          now={TODAY}
          showRelative
          defaultValue={plainDate(2026, 8, 21)}
        />
      </Labelled>
    </Row>
  );
}

/** v04 — the month grid on its own. */
function CalendarDemo() {
  return (
    <Calendar
      now={TODAY}
      defaultValue={TODAY}
      defaultMonth={{ y: 2026, m: 8 }}
      load={dayLoad}
      unavailable={clinicClosed}
      shortcuts={DATE_SHORTCUTS}
      showCustomPreset
      hints
      commit="explicit"
    />
  );
}

/** v05, v06 — range and multiple. */
function RangeDemo() {
  return (
    <Calendar
      mode="range"
      months={2}
      weekStart={1}
      now={TODAY}
      defaultMonth={{ y: 2026, m: 9 }}
      unavailable={clinicClosed}
      presets={RANGE_PRESETS}
      showCustomPreset
      hints
      commit="explicit"
    />
  );
}

function MultipleDemo() {
  return (
    <Calendar
      mode="multiple"
      maxDates={4}
      now={TODAY}
      defaultMonth={{ y: 2026, m: 9 }}
      unavailable={clinicClosed}
      shortcuts={DATE_SHORTCUTS}
      showCustomPreset
      hints
      commit="explicit"
    />
  );
}

/** The named periods this page offers. Data, translated and trimmed by the host. */
const RANGE_PRESETS = dateRangePresets(TODAY, { weekStart: 1 });

/** The single-date half of the same rail. Also data, also the host's to trim. */
const DATE_SHORTCUTS = relativeDateOptions(TODAY);

/** c4 — the range panel: two months, a preset rail, and an explicit commit. */
function RangePanelDemo() {
  return (
    <Calendar
      mode="range"
      months={2}
      commit="explicit"
      hints
      weekStart={1}
      presets={RANGE_PRESETS}
      showCustomPreset
      now={TODAY}
      defaultMonth={{ y: 2026, m: 8 }}
      defaultRange={{ start: plainDate(2026, 8, 17), end: plainDate(2026, 9, 17) }}
    />
  );
}

/** c5 — the range as a field: both ends typed, the panel as the fallback. */
function DateRangeFieldDemo() {
  const [range, setRange] = React.useState<{ start: ZbDate | null; end: ZbDate | null }>({
    start: plainDate(2026, 8, 24),
    end: plainDate(2026, 9, 11),
  });
  return (
    <div className="zb-dt-demo-col">
      <DateRangeField
        label="Authorisation window"
        now={TODAY}
        weekStart={1}
        months={2}
        showSpan
        hints
        presets={RANGE_PRESETS}
        showCustomPreset
        maxSpanDays={90}
        value={range}
        onChange={setRange}
        hint="Both ends are typeable. The calendar is the fallback, not the main road."
      />
      <DateRangeField
        label="Reporting period"
        now={TODAY}
        weekStart={1}
        months={2}
        showSpan
        defaultValue={{ start: plainDate(2026, 9, 20), end: plainDate(2026, 9, 4) }}
      />
    </div>
  );
}

/** t2 — a time range, picked from two columns or typed into two halves. */
function TimeRangeDemo() {
  const [range, setRange] = React.useState<ZbTimeRange>({
    start: plainTime(7, 0),
    end: plainTime(10, 0),
  });
  return (
    <div className="zb-dt-demo-col">
      <TimeRangeField
        label="Time range"
        stepMinutes={60}
        minDurationMinutes={30}
        maxDurationMinutes={480}
        value={range}
        onChange={setRange}
      />
      <TimeRangeField
        label="Night shift"
        stepMinutes={30}
        allowOvernight
        defaultValue={{ start: plainTime(22, 0), end: plainTime(6, 30) }}
      />
    </div>
  );
}

/** v07, v08 — birth date: the age, and the two ways it can be imprecise. */
function BirthDateDemo() {
  return (
    <Row>
      <Labelled what="Adult">
        <BirthDateField
          calendarHints
          calendarCommit="explicit"
          now={TODAY}
          defaultValue={plainDate(1986, 7, 18)}
        />
      </Labelled>
      <Labelled what="Under two years">
        <BirthDateField
          calendarHints
          calendarCommit="explicit"
          now={TODAY}
          defaultValue={plainDate(2026, 4, 20)}
        />
      </Labelled>
      <Labelled what="Under four weeks">
        <BirthDateField
          calendarHints
          calendarCommit="explicit"
          now={TODAY}
          defaultValue={plainDate(2026, 8, 9)}
        />
      </Labelled>
    </Row>
  );
}

function BirthDatePartialDemo() {
  return (
    <Row>
      <Labelled what='precision="year"'>
        <BirthDateField
          calendarHints
          calendarCommit="explicit"
          now={TODAY}
          allowEstimated
          allowAbsent
          precision="year"
          value={{ kind: "partial-date", y: 1962 }}
        />
      </Labelled>
      <Labelled what="allowAbsent">
        <BirthDateField
          calendarHints
          calendarCommit="explicit"
          now={TODAY}
          allowAbsent
          absentReason="asked-declined"
          value={{ kind: "absent", reason: "asked-declined" }}
        />
      </Labelled>
    </Row>
  );
}

/** v09 — time, and the ambiguity it refuses to resolve. */
function TimeDemo() {
  return (
    <Row>
      <Labelled what="Type a bare 9">
        <TimeField label="Discharge time" />
      </Labelled>
      <Labelled what="presets={timeGrid(...)}">
        <TimeField
          label="Time given"
          presets={timeGrid(8 * 60, 10 * 60, 20)}
          defaultValue={plainTime(8, 20)}
        />
      </Labelled>
      <Labelled what="hour24 + showSecond">
        <TimeField label="Observation" hour24 showSecond defaultValue={plainTime(21, 30)} />
      </Labelled>
    </Row>
  );
}

/** v10 — the session triple, and its visible driver. */
function SessionDemo() {
  return (
    <SessionTimeField
      label="Individual therapy"
      defaultValue={sessionFrom(plainTime(9, 0), 53)}
      durationPresets={BEHAVIORAL_HEALTH_DURATIONS}
      bands={BANDS}
    />
  );
}

function SessionEdgeDemo() {
  return (
    <Row>
      <Labelled what="allowOvernight">
        <SessionTimeField
          label="Crisis line shift"
          maxMinutes={720}
          allowOvernight
          nextDateLabel="Aug 27"
          defaultValue={withSessionEnd(sessionFrom(plainTime(23, 30), 0), plainTime(7, 30), {
            allowOvernight: true,
          })}
        />
      </Labelled>
      <Labelled what="maxMinutes guard">
        <SessionTimeField
          label="Typed 2:00 meaning the afternoon"
          defaultValue={withSessionEnd(sessionFrom(plainTime(9, 0), 60), plainTime(2, 0))}
        />
      </Labelled>
    </Row>
  );
}

/** v11 — availability as a grid. */
function SlotsDemo() {
  const [value, setValue] = React.useState<string | null>(null);
  return (
    <TimeSlotGrid
      label="Available times — Thu 27 Aug"
      set={AVAILABILITY}
      now={NOW}
      value={value}
      onSelect={(slot) => setValue(slot.id)}
      onRefresh={() => undefined}
    />
  );
}

function SlotsEmptyDemo() {
  return <TimeSlotGrid label="Available times — Fri 28 Aug" set={EXHAUSTED} now={NOW} />;
}

/** v12 — provider, date and time on one surface. */
function SchedulerDemo() {
  const [actorId, setActorId] = React.useState("osei");
  const [date, setDate] = React.useState<ZbDate>(addCalendarDays(TODAY, 1));
  const [value, setValue] = React.useState<string | null>(null);
  return (
    <AppointmentScheduler
      label="Book an appointment"
      providers={PROVIDERS}
      actorId={actorId}
      onActorChange={setActorId}
      date={date}
      onDateChange={setDate}
      dayLoads={DAY_LOADS}
      availability={AVAILABILITY}
      now={NOW}
      durationMinutes={50}
      buffers={{ before: 0, after: 10 }}
      value={value}
      onSelect={(choice) => setValue(choice.slot.id)}
      viewerZone="America/New_York"
    />
  );
}

/** v13 — the rule, in words, before anything is created. */
function RecurrenceDemo() {
  return (
    <RecurrenceField
      label="Repeats"
      startDate={plainDate(2026, 9, 1)}
      timeLabel="2:00 – 2:50 PM"
      defaultValue={{ ...(THERAPY_CADENCES[0]?.rule ?? { freq: "WEEKLY" }), count: 16 }}
      countOptions={[4, 6, 8, 12, 16, 24]}
      showRRule
    />
  );
}

function RecurrenceRefusedDemo() {
  return (
    <RecurrenceField
      label="Repeats"
      startDate={plainDate(2026, 9, 1)}
      unsupported={{
        source: "FREQ=YEARLY;BYMONTH=3;BYDAY=2SU;BYHOUR=14",
        parts: ["FREQ=YEARLY", "BYMONTH", "BYHOUR"],
      }}
      showRRule
    />
  );
}

/** v14 — the course of treatment, reviewed before it is written. */
function SeriesDemo() {
  const [resolved, setResolved] = React.useState<ReadonlySet<string>>(new Set());
  return (
    <RecurringSeriesScheduler
      label="Weekly therapy — 16 sessions"
      rule={{ freq: "WEEKLY", interval: 1, count: 16 }}
      startDate={plainDate(2026, 9, 1)}
      timeLabel="2:00 – 2:50 PM"
      verdicts={VERDICTS}
      resolved={resolved}
      onResolve={(iso) => setResolved((was) => new Set(was).add(iso))}
      onUnresolve={(iso) =>
        setResolved((was) => {
          const next = new Set(was);
          next.delete(iso);
          return next;
        })
      }
      onResolveAll={() =>
        setResolved(new Set(VERDICTS.filter((v) => v.alternative).map((v) => v.date)))
      }
      visibleRows={7}
    />
  );
}

/** v15 — the group: a room, a roster, and the count that is actually true. */
function GroupDemo() {
  return (
    <GroupSeriesScheduler
      name="DBT Skills — Emotion Regulation"
      rule={{ freq: "WEEKLY", interval: 1, byWeekday: [2], count: 26 }}
      startDate={plainDate(2026, 9, 1)}
      timeLabel="5:30 – 7:00 PM"
      sessionMinutes={90}
      facilitators={["M. Reyes, LCSW", "J. Bhatt, LPC"]}
      room={{ name: "Group Room 2", capacity: 12 }}
      modality="In person"
      capacity={12}
      enrolled={9}
      exclusions={[
        { date: plainDate(2026, 11, 24), reason: "Thanksgiving week — programme closed" },
        { date: plainDate(2026, 12, 22), reason: "Winter break" },
        { date: plainDate(2026, 12, 29), reason: "Winter break" },
      ]}
      showRRule
    />
  );
}

/** v16 — the record a reviewer sees. */
function ReadoutDemo() {
  return (
    <Row>
      <Labelled what="showRelative showZone">
        <ClinicalDateTime as="time" value={SIGNED} now={TODAY} showRelative showZone />
      </Labelled>
      <Labelled what='viewerZone="America/Los_Angeles"'>
        <ClinicalDateTime
          as="time"
          value={SIGNED}
          now={TODAY}
          viewerZone="America/Los_Angeles"
          showZone
        />
      </Labelled>
      <Labelled what="absent">
        <ClinicalDateTime value={{ kind: "absent", reason: "asked-declined" }} />
      </Labelled>
      <Labelled what="restricted">
        <ClinicalDateTime value={TODAY} restricted />
      </Labelled>
    </Row>
  );
}

/**
 * The three DST verdicts, from the engine that ships with the component.
 *
 * Not a presentation — a host decides what to do about a nonexistent local
 * time, and the component refuses to decide for it. What ships is the
 * classification, and it is the part nobody writes correctly by hand.
 */
const DST_CASES: Array<{ zone: string; label: string; date: ZbDate; time: ZbTime }> = [
  {
    zone: "America/New_York",
    label: "Spring forward",
    date: plainDate(2026, 3, 8),
    time: plainTime(2, 30),
  },
  {
    zone: "America/New_York",
    label: "Fall back",
    date: plainDate(2026, 11, 1),
    time: plainTime(1, 30),
  },
  {
    zone: "Australia/Lord_Howe",
    label: "30-minute shift",
    date: plainDate(2026, 10, 4),
    time: plainTime(2, 15),
  },
  {
    zone: "Asia/Kathmandu",
    label: "No DST, +5:45",
    date: plainDate(2026, 8, 26),
    time: plainTime(9, 0),
  },
];

function describeVerdict(verdict: ReturnType<typeof classifyLocalTime>): string {
  switch (verdict.kind) {
    case "nonexistent":
      return `Does not exist — ${verdict.skippedMinutes} minutes are skipped that morning`;
    case "ambiguous":
      return `Happens twice — offsets ${verdict.earlierOffset} and ${verdict.laterOffset} minutes`;
    case "unknown-zone":
      return "Zone not in this platform's tzdb";
    default:
      return `Happens once — offset ${verdict.offsetMinutes} minutes`;
  }
}

function DstDemo() {
  return (
    <div className="zb-dt-demo-list">
      {DST_CASES.map((item) => {
        const verdict = classifyLocalTime(item.zone, item.date, item.time);
        return (
          <div key={`${item.zone}-${item.label}`} className="zb-dt-demo-listrow">
            <code>{item.zone}</code>
            <b>
              {formatPlainDate(item.date, "medium")} · {item.time.h}:
              {String(item.time.mi).padStart(2, "0")}
            </b>
            <Caption>{item.label}</Caption>
            <span data-zb-verdict={verdict.kind}>{describeVerdict(verdict)}</span>
          </div>
        );
      })}
    </div>
  );
}

/*
 * The compact variants side by side.
 *
 * Six rather than fourteen: the scheduler, the slot grid and the two series
 * surfaces are compositions the width of a page, and stacking them here would
 * make this a second copy of the gallery rather than a comparison. They are
 * shown in their own chapters instead.
 */
const COMPACT_VARIANTS: Array<{ variant: DatePickerVariant; render: () => React.ReactNode }> = [
  {
    variant: "picker",
    render: () => <DateField label="Picker" showCalendar now={TODAY} defaultValue={TODAY} />,
  },
  { variant: "field", render: () => <DateField label="Field" now={TODAY} defaultValue={TODAY} /> },
  {
    variant: "birth-date",
    render: () => (
      <BirthDateField
        calendarHints
        calendarCommit="explicit"
        now={TODAY}
        defaultValue={plainDate(1986, 7, 18)}
      />
    ),
  },
  { variant: "time", render: () => <TimeField label="Time" defaultValue={plainTime(14, 5)} /> },
  {
    variant: "session",
    render: () => (
      <SessionTimeField label="Session" defaultValue={sessionFrom(plainTime(14, 0), 50)} />
    ),
  },
  {
    variant: "readout",
    render: () => <ClinicalDateTime as="time" value={SIGNED} now={TODAY} showZone />,
  },
];

function TargetDemo() {
  return (
    <div className="zb-dt-demo-list">
      {COMPACT_VARIANTS.map((item) => (
        <div key={item.variant} className="zb-dt-demo-listrow zb-dt-demo-listrow--stack">
          <code>variant=&quot;{item.variant}&quot;</code>
          <div>{item.render()}</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The matrix                                                          */
/* ------------------------------------------------------------------ */

const THEMES = [
  ["light", "Light"],
  ["dark", "Dark"],
  ["hc", "High contrast"],
] as const;

const DENSITIES = ["patient", "standard", "clinical"] as const;

function MatrixCell({
  theme,
  density,
}: {
  theme: (typeof THEMES)[number][0];
  density: (typeof DENSITIES)[number];
}) {
  const label = THEMES.find(([key]) => key === theme)?.[1] ?? theme;
  return (
    <div
      className="zb-matrix__cell"
      data-zb-theme={theme === "hc" ? "high-contrast" : theme}
      data-zb-density={density}
    >
      <div className="zb-matrix__label">
        {label} · {density}
      </div>
      <div className="zb-matrix__body">
        <Calendar
          now={TODAY}
          defaultValue={TODAY}
          defaultMonth={{ y: 2026, m: 8 }}
          unavailable={clinicClosed}
        />
      </div>
    </div>
  );
}

/**
 * The reader's motion preference, watched rather than sampled once.
 *
 * Read in an effect so the server and the first client pass agree — starting
 * from `true` would flash the still state on every visit, and starting from a
 * `matchMedia` read during render is a hydration mismatch.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);
  return reduced;
}

/* ------------------------------------------------------------------ */
/* The anatomy tour                                                   */
/* ------------------------------------------------------------------ */

/**
 * One annotation: a part of the rendered component, and what it is for.
 *
 * `find` is a selector against the live DOM rather than a coordinate, and
 * `body` is handed the element it found — so a note about the accessible name
 * quotes the name the component actually rendered, and a note about target
 * size prints the size that element actually measures. An annotation that
 * asserted either from memory would go on saying it after it stopped being
 * true, which is the failure mode this whole page exists to avoid.
 */
interface Annotation {
  id: string;
  title: string;
  find: (root: HTMLElement) => HTMLElement | null;
  body: (el: HTMLElement | null) => string;
}

const first = (selector: string) => (root: HTMLElement) =>
  root.querySelector<HTMLElement>(selector);

const ANNOTATIONS: Annotation[] = [
  {
    id: "tabstop",
    title: "One tab stop, not forty-two",
    find: first('[role="gridcell"][tabindex="0"]'),
    body: () =>
      `Exactly one cell in the whole panel is reachable by Tab — this one. The rest sit at tabindex minus one and move under the arrow keys. Forty-two focusable cells is the commonest accessibility failure in a date picker, and a calendar opened on a month with no focus date has none at all, which is the same bug from the other side.`,
  },
  {
    id: "named",
    title: "Named in full, not by numeral",
    find: first(".zb-dt-cal__day--in-range:not(.zb-dt-cal__day--selected)"),
    body: (el) =>
      `A screen reader announces this cell as “${el?.getAttribute("aria-label") ?? "…"}”. A cell in a grid has no column header in its accessible context, so a grid of bare numerals is navigable and useless.`,
  },
  {
    id: "caps",
    title: "The band is capped at every week",
    find: first(".zb-dt-cal__day--week-hi"),
    body: () =>
      "The band runs unbroken across a week and breaks between them, so it is capped here as well as at the two ends of the range. Left uncapped, a selection reads as one slab rather than as a set of weeks — and the columns close up while the rows open out precisely to make that difference visible.",
  },
  {
    id: "rail",
    title: "The rail is data, not a feature",
    find: first(".zb-dt-cal__preset"),
    body: () =>
      "Named periods come from the host: `dateRangePresets(now)` is a starting point, not a default. The right seven periods for a billing report and for an authorisation window are not the same seven, and a component that decides is one every host has to work around.",
  },
  {
    id: "commit",
    title: "Nothing leaves until Done",
    find: first(".zb-dt-cal__action--primary"),
    body: () =>
      "A range is two clicks and the first is often wrong. Every click above redraws the panel and none of them reaches your state — a parent already told about a half-built range has already filtered a report on a range nobody chose.",
  },
  {
    id: "target",
    title: "24px, measured rather than claimed",
    find: (root) =>
      root.querySelector<HTMLElement>(".zb-dt-cal__day--today") ??
      root.querySelector<HTMLElement>(".zb-dt-cal__day"),
    body: (el) => {
      const box = el?.getBoundingClientRect();
      const size = box ? `${Math.round(box.width)} × ${Math.round(box.height)}` : "…";
      return `This cell measures ${size} px right now, in your browser. Every interactive element here clears the 24px floor of WCAG 2.2 SC 2.5.8 at every density — clinical density tightens the type and the gaps and never the target, because a mis-tap on a calendar cell is consequential in a way it is not on a marketing site.`;
    },
  },
];

/**
 * The component, held still, while the explanation moves.
 *
 * The other direction we built drove the picker through a range selection with
 * a drawn cursor. This one is the opposite trade and the more useful one here:
 * a reader on a documentation page can already see what clicking does, and
 * what they cannot see is why any of it is shaped the way it is. So the panel
 * does not move at all, and the annotations arrive one at a time over the part
 * they describe.
 *
 * **The list is the content; the halo is decoration.** Every note is a real
 * button in a real ordered list, so with the tour paused — or with no
 * JavaScript, or under a screen reader — the whole thing reads as six labelled
 * paragraphs about a calendar. The floating bubble repeats the active one for
 * the eye and is `aria-hidden`, so nobody hears it twice. Pressing any note
 * jumps to it, which is what makes this usable without ever playing it.
 */
function AnatomyDemo() {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const pickRef = React.useRef<HTMLDivElement>(null);
  const [at, setAt] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [box, setBox] = React.useState<{ t: number; l: number; w: number; h: number } | null>(null);
  /*
   * Every note's text, resolved against the rendered panel.
   *
   * Resolving only the active one left the other five reading their
   * null-element fallback — the note about the accessible name literally said
   * "…" until its turn came round. They are all real sentences about a real
   * panel, or none of them are.
   */
  const [bodies, setBodies] = React.useState<string[]>(() => ANNOTATIONS.map((n) => n.body(null)));
  const reduced = usePrefersReducedMotion();

  // Autoplay only once it is on screen and only where motion is welcome.
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => {
    const node = stageRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setSeen(true)),
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (seen && !reduced) setPlaying(true);
  }, [seen, reduced]);

  /*
   * Measure after paint, and re-measure on resize.
   *
   * The halo is positioned from the target's real rect rather than from a
   * hard-coded offset, so it stays on its cell when the panel reflows, the
   * density changes, or the reader zooms. A layout effect rather than an
   * effect: measuring after the browser has painted the old position shows one
   * frame of the halo in the wrong place.
   */
  React.useLayoutEffect(() => {
    const place = () => {
      /*
       * Measured against the panel, which is the halo's offset parent.
       *
       * Measuring against the outer stage put every halo a whole cell to the
       * right: the stage centres the panel inside itself, so the two origins
       * differ by that centring gap. The numbers agreed with each other and
       * were both wrong, which is why this was only visible in a screenshot.
       */
      const root = pickRef.current;
      const note = ANNOTATIONS[at];
      if (!root || !note) return;
      setBodies(ANNOTATIONS.map((n) => n.body(n.find(root))));
      const el = note.find(root);
      if (!el) return setBox(null);
      const base = root.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      setBox({ t: r.top - base.top, l: r.left - base.left, w: r.width, h: r.height });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [at]);

  React.useEffect(() => {
    if (!playing) return undefined;
    const hold = reduced ? 900 : 4200;
    const timer = setTimeout(() => setAt((n) => (n + 1) % ANNOTATIONS.length), hold);
    return () => clearTimeout(timer);
  }, [playing, at, reduced]);

  const active = ANNOTATIONS[at];

  return (
    <div className="zb-dt-tour">
      <div className="zb-dt-tour__bar">
        <button
          type="button"
          className="zb-dt-tour__toggle"
          aria-pressed={playing}
          onClick={() => setPlaying((was) => !was)}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <p className="zb-dt-tour__count">
          {at + 1} of {ANNOTATIONS.length} · {active?.title}
        </p>
      </div>

      <div className="zb-dt-tour__stage" ref={stageRef}>
        {/* The panel itself, and it never changes. A completed range is the
            state that has something to point at in every direction: two
            endpoints, a band, week caps, a pressed preset and a live Done. */}
        <div className="zb-dt-tour__pick" ref={pickRef} onPointerDown={() => setPlaying(false)}>
          <Calendar
            mode="range"
            months={2}
            weekStart={1}
            commit="explicit"
            hints
            presets={RANGE_PRESETS}
            showCustomPreset
            now={TODAY}
            defaultMonth={{ y: 2026, m: 8 }}
            defaultRange={{ start: plainDate(2026, 8, 17), end: plainDate(2026, 9, 11) }}
          />

          {box ? (
            <span
              className="zb-dt-tour__halo"
              aria-hidden="true"
              style={{
                transform: `translate(${box.l - 4}px, ${box.t - 4}px)`,
                width: box.w + 8,
                height: box.h + 8,
              }}
            />
          ) : null}
        </div>

        <ol className="zb-dt-tour__list">
          {ANNOTATIONS.map((note, index) => (
            <li key={note.id}>
              <button
                type="button"
                className={cn("zb-dt-tour__note", index === at && "zb-dt-tour__note--on")}
                aria-current={index === at ? "true" : undefined}
                onClick={() => {
                  setPlaying(false);
                  setAt(index);
                }}
              >
                <span className="zb-dt-tour__title">{note.title}</span>
                <span className="zb-dt-tour__body">{bodies[index]}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Exports — one per example                                          */
/* ------------------------------------------------------------------ */

/** The organising idea: four jobs, four primary controls. */
function FourJobsDemo() {
  return (
    <div className="zb-dt-demo-list">
      <div className="zb-dt-demo-listrow zb-dt-demo-listrow--stack">
        <code>variant=&quot;field&quot; — recall</code>
        <DateField label="Date of service" now={TODAY} showRelative />
      </div>
      <div className="zb-dt-demo-listrow zb-dt-demo-listrow--stack">
        <code>variant=&quot;slots&quot; — choose</code>
        <TimeSlotGrid label="Available times — Thu 27 Aug" set={AVAILABILITY} now={NOW} />
      </div>
      <div className="zb-dt-demo-listrow zb-dt-demo-listrow--stack">
        <code>variant=&quot;session&quot; — construct</code>
        <SessionTimeField
          label="Individual therapy"
          defaultValue={sessionFrom(plainTime(9, 0), 53)}
          durationPresets={BEHAVIORAL_HEALTH_DURATIONS}
        />
      </div>
      <div className="zb-dt-demo-listrow zb-dt-demo-listrow--stack">
        <code>variant=&quot;readout&quot; — witness</code>
        <ClinicalDateTime as="time" value={SIGNED} now={TODAY} showZone />
      </div>
    </div>
  );
}

/** antd's `disabledDate`, spelled `unavailable` — and returning the reason. */
function FromAntdDemo() {
  const [value, setValue] = React.useState<ZbDate | null>(null);
  return (
    <div className="zb-dt-demo-col">
      <DateField
        label="Appointment date"
        showCalendar
        now={TODAY}
        value={value}
        onChange={setValue}
        unavailable={clinicClosed}
      />
      <Caption>value = {value ? JSON.stringify(value) : "null"}</Caption>
    </div>
  );
}

/** The documentation-time session, banded by the host's own thresholds. */
function BandsDemo() {
  return (
    <SessionTimeField
      label="Documentation time"
      defaultValue={sessionFrom(plainTime(15, 0), 12)}
      durationPresets={BEHAVIORAL_HEALTH_DURATIONS}
      bands={BANDS}
    />
  );
}

/** Every theme against every density: how a token bug is caught. */
function MatrixDemo() {
  return (
    <div className="zb-matrix">
      {THEMES.map(([themeKey]) =>
        DENSITIES.map((densityKey) => (
          <MatrixCell key={`${themeKey}-${densityKey}`} theme={themeKey} density={densityKey} />
        )),
      )}
    </div>
  );
}

const staged = (Demo: () => React.ReactNode, wide = false) =>
  function Staged() {
    return (
      <Stage wide={wide}>
        <Demo />
      </Stage>
    );
  };

// Fields
export const FourJobs = staged(FourJobsDemo);
export const Picker = staged(PickerDemo);
export const Field = staged(FieldDemo);
export const Tiers = staged(TiersDemo, true);
export const BirthDate = staged(BirthDateDemo, true);
export const BirthDatePartial = staged(BirthDatePartialDemo);
export const Time = staged(TimeDemo, true);
export const Readout = staged(ReadoutDemo, true);
export const FromAntd = staged(FromAntdDemo);
// Calendars
export const Anatomy = staged(AnatomyDemo, true);
export const MonthCalendar = staged(CalendarDemo);
export const Multiple = staged(MultipleDemo);
export const Range = staged(RangeDemo, true);
export const RangePanel = staged(RangePanelDemo, true);
export const RangeField = staged(DateRangeFieldDemo);
// Sessions
export const Session = staged(SessionDemo);
export const SessionEdges = staged(SessionEdgeDemo, true);
export const Bands = staged(BandsDemo);
export const TimeRange = staged(TimeRangeDemo);
// Booking
export const Slots = staged(SlotsDemo, true);
export const SlotsExhausted = staged(SlotsEmptyDemo);
export const Scheduler = staged(SchedulerDemo, true);
// Series
export const Recurrence = staged(RecurrenceDemo);
export const RecurrenceRefused = staged(RecurrenceRefusedDemo);
export const Series = staged(SeriesDemo, true);
export const Group = staged(GroupDemo, true);
// Rules it keeps
export const Dst = staged(DstDemo, true);
export const Family = staged(TargetDemo, true);
export const ThemeDensity = staged(MatrixDemo, true);

/* ------------------------------------------------------------------ */
/* Playground                                                         */
/* ------------------------------------------------------------------ */

/**
 * What each variant needs to show something real, passed through the one
 * front door. Most of the family takes data — a slot grid with no set is an
 * empty box — so the playground supplies the fixtures the examples use, and
 * the generated code names them (see `datePickerPlaygroundAttrs`).
 */
const VARIANT_PROPS: Partial<Record<DatePickerVariant, Record<string, unknown>>> = {
  picker: {
    label: "Appointment date",
    now: TODAY,
    unavailable: clinicClosed,
    load: dayLoad,
    calendarHints: true,
  },
  field: { label: "Date of service", now: TODAY, showRelative: true },
  calendar: {
    now: TODAY,
    defaultMonth: { y: 2026, m: 8 },
    unavailable: clinicClosed,
    load: dayLoad,
    hints: true,
  },
  range: {
    now: TODAY,
    months: 2,
    weekStart: 1,
    defaultMonth: { y: 2026, m: 9 },
    unavailable: clinicClosed,
    presets: RANGE_PRESETS,
    showCustomPreset: true,
    hints: true,
    commit: "explicit",
  },
  multiple: { now: TODAY, maxDates: 4, defaultMonth: { y: 2026, m: 9 }, hints: true },
  "date-range": {
    label: "Authorisation window",
    now: TODAY,
    months: 2,
    weekStart: 1,
    showSpan: true,
    presets: RANGE_PRESETS,
  },
  "birth-date": { now: TODAY, calendarHints: true, calendarCommit: "explicit" },
  time: { label: "Discharge time" },
  session: {
    label: "Individual therapy",
    defaultValue: sessionFrom(plainTime(9, 0), 53),
    durationPresets: BEHAVIORAL_HEALTH_DURATIONS,
  },
  "time-range": { label: "Time range", stepMinutes: 30 },
  slots: { label: "Available times — Thu 27 Aug", set: AVAILABILITY, now: NOW },
  recurrence: {
    label: "Repeats",
    startDate: plainDate(2026, 9, 1),
    timeLabel: "2:00 – 2:50 PM",
    defaultValue: { ...(THERAPY_CADENCES[0]?.rule ?? { freq: "WEEKLY" }), count: 16 },
    showRRule: true,
  },
  group: {
    name: "DBT Skills — Emotion Regulation",
    rule: { freq: "WEEKLY", interval: 1, byWeekday: [2], count: 26 },
    startDate: plainDate(2026, 9, 1),
    timeLabel: "5:30 – 7:00 PM",
    sessionMinutes: 90,
    facilitators: ["M. Reyes, LCSW", "J. Bhatt, LPC"],
    room: { name: "Group Room 2", capacity: 12 },
    capacity: 12,
    enrolled: 9,
  },
  readout: { as: "time", value: SIGNED, now: TODAY, showZone: true },
};

/** The same, as the attributes the generated code writes. */
const VARIANT_ATTRS: Record<DatePickerVariant, readonly string[]> = {
  picker: [
    'label="Appointment date"',
    "now={today}",
    "unavailable={clinicClosed}",
    "load={openSlotCount}",
    "calendarHints",
  ],
  field: ['label="Date of service"', "now={today}", "showRelative"],
  calendar: ["now={today}", "unavailable={clinicClosed}", "load={openSlotCount}", "hints"],
  range: [
    "now={today}",
    "months={2}",
    "weekStart={1}",
    "presets={dateRangePresets(today)}",
    "showCustomPreset",
    'commit="explicit"',
  ],
  multiple: ["now={today}", "maxDates={4}", "hints"],
  "date-range": [
    'label="Authorisation window"',
    "now={today}",
    "months={2}",
    "showSpan",
    "presets={dateRangePresets(today)}",
  ],
  "birth-date": ["now={today}", "calendarHints"],
  time: ['label="Discharge time"'],
  session: [
    'label="Individual therapy"',
    "defaultValue={sessionFrom(plainTime(9, 0), 53)}",
    "durationPresets={BEHAVIORAL_HEALTH_DURATIONS}",
  ],
  "time-range": ['label="Time range"', "stepMinutes={30}"],
  slots: ['label="Available times"', "set={availability}", "now={now}", "onSelect={hold}"],
  scheduler: [
    'label="Book an appointment"',
    "providers={providers}",
    "actorId={providerId}",
    "onActorChange={setProviderId}",
    "date={date}",
    "onDateChange={setDate}",
    "dayLoads={dayLoads}",
    "availability={availability}",
    "now={now}",
    "durationMinutes={50}",
    "onSelect={hold}",
  ],
  recurrence: [
    'label="Repeats"',
    "startDate={plainDate(2026, 9, 1)}",
    'defaultValue={{ freq: "WEEKLY", count: 16 }}',
    "showRRule",
  ],
  series: [
    'label="Weekly therapy — 16 sessions"',
    'rule={{ freq: "WEEKLY", interval: 1, count: 16 }}',
    "startDate={plainDate(2026, 9, 1)}",
    "verdicts={conflicts}",
    "resolved={resolved}",
    "onResolve={resolve}",
  ],
  group: [
    'name="DBT Skills — Emotion Regulation"',
    'rule={{ freq: "WEEKLY", interval: 1, byWeekday: [2], count: 26 }}',
    "startDate={plainDate(2026, 9, 1)}",
    'room={{ name: "Group Room 2", capacity: 12 }}',
    "capacity={12}",
    "enrolled={9}",
  ],
  readout: ['as="time"', "value={signedAt}", "now={today}", "showZone"],
};

/** Attributes for the generated code, after the `variant` the knob writes. */
export function datePickerPlaygroundAttrs(props: Record<string, unknown>): readonly string[] {
  const variant = (props.variant as DatePickerVariant | undefined) ?? "picker";
  return VARIANT_ATTRS[variant] ?? [];
}

/** One variant through the front door, with what it needs to show something. */
export function DatePickerPlayground({ variant = "picker" }: { variant?: DatePickerVariant }) {
  // These two hold selection state a static prop set cannot: the scheduler's
  // provider and day, the series' resolved conflicts.
  if (variant === "scheduler") {
    return (
      <Stage wide>
        <SchedulerDemo />
      </Stage>
    );
  }
  if (variant === "series") {
    return (
      <Stage wide>
        <SeriesDemo />
      </Stage>
    );
  }
  const props = { variant, ...VARIANT_PROPS[variant] } as DatePickerProps;
  return (
    <Stage wide>
      <DatePicker key={variant} {...props} />
    </Stage>
  );
}
