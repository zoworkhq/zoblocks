"use client";

/**
 * The date gallery — every variant of the temporal control, live.
 *
 * The component's whole claim is that sixteen presentations share one value
 * space, one keyboard model and one accessibility contract. A claim about
 * sameness cannot be shown with one example, and it cannot be shown with
 * screenshots at all: that the calendar and the session triple and the slot
 * grid all answer Escape the same way is only visible if you press Escape.
 *
 * So everything here is the shipped component. Type into it, arrow through it,
 * flip it to RTL, and read the announced names in a screen reader.
 *
 * There was a control bar over this — theme, density and direction, one click
 * each, applied to every demo at once. It is gone. The "Theme × density"
 * chapter still renders every combination side by side, which is where the 24px
 * target floor at clinical density can still be measured; direction is no longer
 * checkable from this page. That is a real loss of evidence rather than a
 * tidy-up, and it is recorded here so it is not mistaken for an oversight.
 */

import * as React from "react";
import { DemoNote } from "@/components/site/demo-note";
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
  type DatePickerVariant,
} from "@/registry/oxygen/date-picker/date-picker";
import {
  addCalendarDays,
  classifyLocalTime,
  dateRangePresets,
  formatPlainDate,
  plainDate,
  plainTime,
  sessionFrom,
  withSessionEnd,
  type OxDate,
  type OxTime,
  type OxTimeRange,
} from "@/lib/oxygen-datetime";
import { buildSlots, type AvailabilitySet, type Slot } from "@/lib/oxygen-availability";
import { THERAPY_CADENCES, type OccurrenceVerdict } from "@/lib/oxygen-recurrence";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/*                                                                     */
/* Every date on this page is a literal. ENGINEERING.md §9 forbids the  */
/* component reading the wall clock, and the gallery holds itself to    */
/* the same rule — a demo whose output depends on when it rendered      */
/* cannot be visually regression-tested, and the screenshot in a review */
/* would disagree with the page a day later.                           */
/* ------------------------------------------------------------------ */

const TODAY: OxDate = plainDate(2026, 8, 26);
const NOW_TIME: OxTime = plainTime(10, 42);
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
function clinicClosed(date: OxDate): string | null {
  const day = (date.d + 5) % 7;
  if (day === 0 || day === 6) return "Weekend — clinic closed";
  if (date.m === 9 && date.d === 7) return "Labor Day — clinic closed";
  if (date.m === 9 && date.d >= 14 && date.d <= 16) return "Dr Osei on leave";
  return null;
}

function dayLoad(date: OxDate): number | null {
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
  return <div className="ox-dt-demo-row">{children}</div>;
}

function Caption({ children }: { children: React.ReactNode }) {
  return <span className="ox-dt-demo-cap">{children}</span>;
}

function Labelled({ what, children }: { what: string; children: React.ReactNode }) {
  return (
    <div className="ox-dt-demo-col">
      <Caption>{what}</Caption>
      {children}
    </div>
  );
}

interface DemoProps {
  id: string;
  name: string;
  api: string;
  tags?: string[];
  note: React.ReactNode;
  children: React.ReactNode;
  /** Stretches the stage for a wide composition — a scheduler, a series. */
  wide?: boolean;
}

/**
 * One framed demo.
 *
 * The frame states the API being demonstrated, because a gallery where you
 * cannot tell which prop produced which pixels teaches nothing.
 *
 * Deliberately not a `data-reveal` target — see `tabs-gallery.tsx`. These
 * mount on a chapter press rather than on scroll.
 */
function Demo({ id, name, api, tags, note, children, wide }: DemoProps) {
  return (
    <figure id={id} className="ox-demo scroll-mt-28">
      <figcaption className="ox-demo__head">
        <span className="ox-demo__id">{id.toUpperCase()}</span>
        <span className="ox-demo__name">{name}</span>
        <code className="ox-demo__api">{api}</code>
        <span className="grow" />
        {tags?.map((tag) => (
          <span key={tag} className="ox-demo__tag">
            {tag}
          </span>
        ))}
      </figcaption>
      <div className={cn("ox-demo__stage", wide && "ox-demo__stage--wide")}>{children}</div>
      <DemoNote>{note}</DemoNote>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Individual demos                                                    */
/* ------------------------------------------------------------------ */

/** v01 — the default variant: a field with a calendar behind a button. */
function PickerDemo() {
  const [value, setValue] = React.useState<OxDate | null>(null);
  return (
    <div className="ox-dt-demo-col">
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
  const [range, setRange] = React.useState<{ start: OxDate | null; end: OxDate | null }>({
    start: plainDate(2026, 8, 24),
    end: plainDate(2026, 9, 11),
  });
  return (
    <div className="ox-dt-demo-col">
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
  const [range, setRange] = React.useState<OxTimeRange>({
    start: plainTime(7, 0),
    end: plainTime(10, 0),
  });
  return (
    <div className="ox-dt-demo-col">
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
  const [date, setDate] = React.useState<OxDate>(addCalendarDays(TODAY, 1));
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
const DST_CASES: Array<{ zone: string; label: string; date: OxDate; time: OxTime }> = [
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
    <div className="ox-dt-demo-list">
      {DST_CASES.map((item) => {
        const verdict = classifyLocalTime(item.zone, item.date, item.time);
        return (
          <div key={`${item.zone}-${item.label}`} className="ox-dt-demo-listrow">
            <code>{item.zone}</code>
            <b>
              {formatPlainDate(item.date, "medium")} · {item.time.h}:
              {String(item.time.mi).padStart(2, "0")}
            </b>
            <Caption>{item.label}</Caption>
            <span data-ox-verdict={verdict.kind}>{describeVerdict(verdict)}</span>
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
    <div className="ox-dt-demo-list">
      {COMPACT_VARIANTS.map((item) => (
        <div key={item.variant} className="ox-dt-demo-listrow ox-dt-demo-listrow--stack">
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
      className="ox-matrix__cell"
      data-ox-theme={theme === "hc" ? "high-contrast" : theme}
      data-ox-density={density}
    >
      <div className="ox-matrix__label">
        {label} · {density}
      </div>
      <div className="ox-matrix__body">
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
    find: first(".ox-dt-cal__day--in-range:not(.ox-dt-cal__day--selected)"),
    body: (el) =>
      `A screen reader announces this cell as “${el?.getAttribute("aria-label") ?? "…"}”. A cell in a grid has no column header in its accessible context, so a grid of bare numerals is navigable and useless.`,
  },
  {
    id: "caps",
    title: "The band is capped at every week",
    find: first(".ox-dt-cal__day--week-hi"),
    body: () =>
      "The band runs unbroken across a week and breaks between them, so it is capped here as well as at the two ends of the range. Left uncapped, a selection reads as one slab rather than as a set of weeks — and the columns close up while the rows open out precisely to make that difference visible.",
  },
  {
    id: "rail",
    title: "The rail is data, not a feature",
    find: first(".ox-dt-cal__preset"),
    body: () =>
      "Named periods come from the host: `dateRangePresets(now)` is a starting point, not a default. The right seven periods for a billing report and for an authorisation window are not the same seven, and a component that decides is one every host has to work around.",
  },
  {
    id: "commit",
    title: "Nothing leaves until Done",
    find: first(".ox-dt-cal__action--primary"),
    body: () =>
      "A range is two clicks and the first is often wrong. Every click above redraws the panel and none of them reaches your state — a parent already told about a half-built range has already filtered a report on a range nobody chose.",
  },
  {
    id: "target",
    title: "24px, measured rather than claimed",
    find: (root) =>
      root.querySelector<HTMLElement>(".ox-dt-cal__day--today") ??
      root.querySelector<HTMLElement>(".ox-dt-cal__day"),
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
    <div className="ox-dt-tour">
      <div className="ox-dt-tour__bar">
        <button
          type="button"
          className="ox-dt-tour__toggle"
          aria-pressed={playing}
          onClick={() => setPlaying((was) => !was)}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <p className="ox-dt-tour__count">
          {at + 1} of {ANNOTATIONS.length} · {active?.title}
        </p>
      </div>

      <div className="ox-dt-tour__stage" ref={stageRef}>
        {/* The panel itself, and it never changes. A completed range is the
            state that has something to point at in every direction: two
            endpoints, a band, week caps, a pressed preset and a live Done. */}
        <div className="ox-dt-tour__pick" ref={pickRef} onPointerDown={() => setPlaying(false)}>
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
              className="ox-dt-tour__halo"
              aria-hidden="true"
              style={{
                transform: `translate(${box.l - 4}px, ${box.t - 4}px)`,
                width: box.w + 8,
                height: box.h + 8,
              }}
            />
          ) : null}
        </div>

        <ol className="ox-dt-tour__list">
          {ANNOTATIONS.map((note, index) => (
            <li key={note.id}>
              <button
                type="button"
                className={cn("ox-dt-tour__note", index === at && "ox-dt-tour__note--on")}
                aria-current={index === at ? "true" : undefined}
                onClick={() => {
                  setPlaying(false);
                  setAt(index);
                }}
              >
                <span className="ox-dt-tour__title">{note.title}</span>
                <span className="ox-dt-tour__body">{bodies[index]}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The gallery                                                         */
/* ------------------------------------------------------------------ */

type Chapter = "fields" | "calendars" | "sessions" | "booking" | "series" | "rules" | "matrix";

const CHAPTERS: Array<{ id: Chapter; label: string; blurb: string }> = [
  {
    id: "fields",
    label: "Fields",
    blurb: "Recall — the user already knows the value. Four fifths of healthcare date input.",
  },
  {
    id: "calendars",
    label: "Calendars",
    blurb: "One roving tabstop, and every cell named as its whole date.",
  },
  {
    id: "sessions",
    label: "Sessions",
    blurb: "Three numbers, two degrees of freedom, and a visible driver.",
  },
  {
    id: "booking",
    label: "Booking",
    blurb: "Choose — the system knows the options, and how old that knowledge is.",
  },
  {
    id: "series",
    label: "Series",
    blurb: "A course of treatment is a rule, not a date. Reviewed before it is written.",
  },
  {
    id: "rules",
    label: "Rules it keeps",
    blurb: "Time zones, DST, target size — the parts that are only visible when wrong.",
  },
  {
    id: "matrix",
    label: "Theme × density",
    blurb: "Nine combinations at once, which is how a token bug is caught.",
  },
];

export function DatePickerGallery() {
  const [chapter, setChapter] = React.useState<Chapter>("fields");
  const [theme, setTheme] = React.useState<"light" | "dark" | "hc">("light");

  /*
   * The demo theme starts at whatever the site is showing, and follows it
   * until the reader pins one here. The stages set their own literal `--ox-*`
   * values — that is the point of them, and why the matrix can show three
   * themes at once — so without this a dark site opens on a wall of white
   * slabs, which argues the opposite of what the page claims.
   *
   * `hc` is only ever a deliberate choice: the site has no high-contrast mode
   * to follow, so it is never selected automatically.
   */

  React.useEffect(() => {
    const root = document.documentElement;
    const sync = () => setTheme(root.classList.contains("dark") ? "dark" : "light");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const active = CHAPTERS.find((item) => item.id === chapter) ?? CHAPTERS[0]!;

  return (
    <div className="ox-gallery">
      {/* Control bar — the three axes nobody checks by hand, one click each. */}
      {/* Chapter navigation. A radiogroup, not a tablist: these are seven
          filters over one stage, and the stage is not a panel any one of
          them owns. */}
      <div className="ox-gallery__chapters">
        <div className="ox-dt-chapters" role="radiogroup" aria-label="Gallery chapter">
          {CHAPTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={chapter === item.id}
              onClick={() => setChapter(item.id)}
              className="ox-dt-chapter"
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="ox-gallery__blurb">{active.blurb}</p>
      </div>

      <div className="ox-gallery__stage" data-ox-theme={theme === "hc" ? "high-contrast" : theme}>
        {chapter === "fields" ? (
          <div className="ox-gallery__grid">
            <Demo
              id="v01"
              name="Picker"
              api='variant="picker" · showCalendar'
              tags={["default", "antd parity"]}
              note="The default, and the one everybody means by “date picker”: a typed field with a calendar behind a button. Type 09022026 without opening anything; then press the button and the grid appears on September, with the closed days struck and the open-slot count under each numeral. Escape closes and keeps what was typed — an Escape that discards a half-entered date is the reason people stop using keyboards. The rail down the side is the host's, not the component's: “Next Monday” is a scheduling convention, and a component that ships one has decided what your clinic's week looks like. It is `relativeDateOptions(now)`, passed in, and Custom is pressed the moment the reader picks a day the rail cannot name."
            >
              <PickerDemo />
            </Demo>

            <Demo
              id="v02"
              name="Field"
              api='variant="field"'
              tags={["1 tab stop", "no popover"]}
              note="The same component with the popover switched off, and the variant most healthcare fields actually want. Count what a clinician touches in a day: a date of birth at intake, a service date on every note, a signature timestamp on every signed note, and — perhaps twice a week — an appointment picked from a calendar. Three bounded segments, one tab stop, and a segment that advances itself the moment no further digit could be valid: typing 9 in the month jumps on, typing 1 waits for a possible 12. That rule is what makes eight keystrokes enough. The second field posts ISO into a plain HTML form; a form body carrying a locale-formatted date is a bug in somebody else's parser six months from now."
            >
              <FieldDemo />
            </Demo>

            <Demo
              id="v03"
              name="Three tiers, three behaviours"
              api="futurePolicy · pastPolicy · showRelative"
              tags={["role=alert", "role=status"]}
              note="The same component with three different rules about the future, because there is no correct default — and a picker that hardcodes one is wrong three times out of four. A date of birth may never be in the future: it blocks, announces assertively, and sets aria-invalid. Documentation dated into the future is suspicious rather than impossible: it warns politely, through role=status, and does not mark the field invalid, because the value is legal. A retrospective service date is ordinary and gets an advisory with no colour weight at all — blocking it is what teaches staff to date notes to today to get past the validator, which is how the real data is lost."
              wide
            >
              <TiersDemo />
            </Demo>

            <Demo
              id="v04"
              name="Birth date"
              api='variant="birth-date"'
              tags={["age", "proof-read"]}
              note="Type 07181986 into the first one. The age is not decoration: a transposed year is invisible in 07/18/1968 and screaming in “58 years old”, and it is the only error check this field has. Under two years it reads in months and under four weeks in days, because a paediatric chart that says “0 years old” for a four-month-old has discarded the only number that mattered — and that number is what a weight-based dose is calculated from. No calendar opens by default, and when one does it opens on the year: a date-of-birth calendar that opens on this month has decided the patient was born this month."
              wide
            >
              <BirthDateDemo />
            </Demo>

            <Demo
              id="v05"
              name="Birth date · partial and absent"
              api="precision · allowEstimated · allowAbsent"
              tags={["FHIR", "third value"]}
              note="FHIR permits YYYY and YYYY-MM for Patient.birthDate, because homeless services, unaccompanied minors and forensic intake all produce them — and coercing “born around 1962” to 1 January 1962 invents a fact every downstream system reads as precise, including the one calculating a dose. Absence is the same argument Switch makes for its third value: a form that cannot tell “no date of birth recorded” from “nobody asked” is lying about what it knows, and the reason travels with the value rather than being punctuated away as an em dash."
              wide
            >
              <BirthDatePartialDemo />
            </Demo>

            <Demo
              id="v06"
              name="Time"
              api='variant="time" · presets · hour24'
              tags={["refuses to guess"]}
              note="Type a bare 9 into the first field. The meridiem segment stays empty, the value stays incomplete, and the field asks. Every other time picker resolves this silently, and on some ward that turns a 9 PM discharge into a 9 AM one — twelve hours of a record being wrong with nothing on screen to suggest anybody guessed. The presets are an interval, not a menu: twenty minutes is as real as fifteen, and so is fifty-three. The third field is the same component in 24-hour with seconds, which is what an observation timestamp needs and a booking screen does not."
              wide
            >
              <TimeDemo />
            </Demo>

            <Demo
              id="v07"
              name="Readout"
              api='variant="readout"'
              tags={["record", "print"]}
              note="“3 days after service” is a reading aid; the timestamp is the record, and a reviewer will ask. Anything a signature depends on prints its stored instant and its IANA zone, because “8:12 AM” on a countersignature is not a time until somebody says where — and it survives print, which is where a great many of these are actually read. The second zone appears only when the zones differ: rendering “3:00 PM ET” to somebody already in Eastern Time is noise that teaches readers to stop reading zone labels. Absent and restricted are present-and-explained rather than blank, because a blank cell reads as “nothing happened”."
              wide
            >
              <ReadoutDemo />
            </Demo>
          </div>
        ) : null}

        {chapter === "calendars" ? (
          <div className="ox-gallery__grid">
            <Demo
              id="c0"
              name="Why it is shaped like this"
              api='mode="range" · months={2} · presets · commit="explicit"'
              tags={["annotated", "reads paused", "stops under reduced motion"]}
              note="The panel below is the shipped component and it never moves; the explanation does. Each note is measured off the real DOM rather than written from memory — the accessible name is the name that element actually carries, and the target size is the size it actually is in your browser right now, so a note cannot go on being true after the thing it describes has changed. The list is the content and the halo is decoration: every note is a real button, so paused, unscripted, or through a screen reader this reads as six labelled paragraphs about a calendar. Press any of them to jump there; it never starts under `prefers-reduced-motion`, and Pause is a real button, which is what WCAG 2.2.2 asks of anything that moves for more than five seconds."
              wide
            >
              <AnatomyDemo />
            </Demo>

            <Demo
              id="c1"
              name="Calendar"
              api='variant="calendar" · shortcuts · hints'
              tags={["role=grid", "roving tabstop"]}
              note="Tab to the grid and move with the arrow keys; PageUp and PageDown change month, Shift with them changes year — which is what the legend under it exists to tell somebody who would otherwise never find out. Exactly one cell is reachable by Tab — forty-two tab stops is the most common accessibility failure in a date picker, and a calendar opened on a month containing no focus date has none at all, which is the same bug from the other side. Every cell is named as its whole date plus its state: “Wednesday, 26 August 2026, 8 times available”, not “26”. A cell in a grid has no column header in its accessible context, so a grid of bare numerals is navigable and useless."
            >
              <CalendarDemo />
            </Demo>

            <Demo
              id="c2"
              name="Multiple"
              api='variant="multiple" maxDates={4} · shortcuts'
              tags={["capped", "click to remove"]}
              note="Several dates that are not a range — the make-up sessions after a missed fortnight, the three days a form is being backfilled for. Clicking a selected date removes it: a remove control inside a 32px cell would sit under the 24px target floor, and a second click is what people try first anyway. The cap is refused silently at the boundary rather than dialogued, because a modal that says “you may only pick four” after the fourth click is a worse teacher than a fifth click that simply does nothing. The rail toggles rather than replaces here, because that is what every other press in this mode does."
            >
              <MultipleDemo />
            </Demo>

            <Demo
              id="c3"
              name="Range"
              api='variant="range" · months={2} · presets'
              tags={["two clicks", "SC 2.5.7"]}
              note="Two clicks, and there is no drag path anywhere in the component — WCAG 2.2 SC 2.5.7 asks that no function require a drag, and a drag across a month boundary is a hostile gesture on a touchscreen at the best of times. The second click completes the range regardless of direction: clicking backwards swaps the ends rather than refusing, because a user who clicked the later date first has told you both ends and does not need to be corrected."
              wide
            >
              <RangeDemo />
            </Demo>

            <Demo
              id="c4"
              name="Range panel"
              api={'months={2} · presets · commit="explicit"'}
              tags={["two months", "named periods", "Cancel/Done"]}
              note="Most ranges cross a month boundary, and choosing an end you cannot see is how a range picker ends up needing three attempts — so the panel shows two contiguous months with one set of controls paging both. Two buttons in the same dialog both announced as “Previous month” would be a riddle, so the previous control sits on the first month and the next on the last, and the interior heading keeps its centre with a spacer that is not a button. The rail is data: `dateRangePresets(now)` is the general set, and a host drops what its field has no use for rather than working around seven periods somebody else chose. Custom is pressed whenever the selection matches none of them, so a reader who built their own range can still read their own state. Nothing reaches the host until Done — a range is built by two clicks and the first is often wrong, and a parent that has already been told about a half-built range has already filtered a report on one nobody chose."
              wide
            >
              <RangePanelDemo />
            </Demo>

            <Demo
              id="c5"
              name="Range field"
              api='variant="date-range" · showSpan · maxSpanDays'
              tags={["two tab stops", "day count", "proof-read"]}
              note="One shell, two typed halves and an arrow. Two bordered boxes with an arrow between them read as two questions; a reader answering “when does this start and end” is answering one. The halves stay two tab stops on purpose — the single-tab-stop rule is per field, and arrowing through six segments to reach the end date is past the point where you can tell which half you are in. The day count is inclusive of both ends, because an authorisation from the 1st to the 7th is seven days of care rather than six, and it is the field's own proof-read: a transposed month is invisible in 03/07 – 07/07 and unmissable as “123 days”. The second field is deliberately backwards — an end before its start is an error rather than a silent swap, because the swap is only obviously right when a calendar made both clicks."
              wide
            >
              <DateRangeFieldDemo />
            </Demo>
          </div>
        ) : null}

        {chapter === "sessions" ? (
          <div className="ox-gallery__grid">
            <Demo
              id="s1"
              name="Session"
              api='variant="session" · durationPresets · bands'
              tags={["hold", "derived"]}
              note="Press a duration chip and the end moves, marked Derived. Type an end time instead and the duration recomputes — and the Held badge moves with it. Now move the start: hold the duration and the whole session slides; hold the end and it stretches. Both are correct, only one can be the default, and which one you got is information you would otherwise discover by making a mistake on a real appointment. That badge is the component. Start, end and duration are three values with two degrees of freedom, and every scheduling tool that hides which member is derived is one edit away from surprising you."
              wide
            >
              <SessionDemo />
            </Demo>

            <Demo
              id="s2"
              name="Overnight, and the guard"
              api="allowOvernight · maxMinutes"
              tags={["crosses midnight"]}
              note="11:30 PM to 7:30 AM is a crisis-line shift and a residential handover, not a typo. Refusing it teaches staff to type the wrong date to get past the validator, which is how you lose the real data — so the day boundary is stated in the value instead, as a labelled next-day marker rather than a silent wrap. The second is the guard: a start dragged past a held end is the only way to reach an absurd duration, and the component says so and offers the likeliest correction — somebody typed 2:00 meaning the afternoon — rather than quietly rounding it into range."
              wide
            >
              <SessionEdgeDemo />
            </Demo>

            <Demo
              id="s3"
              name="Bands are the host's"
              api="bands={org.thresholds}"
              tags={["no CDS"]}
              note="The band under the duration reads from the array above this demo, and the component ships that array empty. A fifty-three-minute session is a fact about somebody's payer contract rather than about therapy, and a library asserting a billing code from a duration would be clinical decision support — which ADR 0009 prohibits outright, and which would be wrong in most of the jurisdictions this ships into. The same argument covers the duration presets: BEHAVIORAL_HEALTH_DURATIONS is an exported convenience, not a default."
              wide
            >
              <SessionTimeField
                label="Documentation time"
                defaultValue={sessionFrom(plainTime(15, 0), 12)}
                durationPresets={BEHAVIORAL_HEALTH_DURATIONS}
                bands={BANDS}
              />
            </Demo>

            <Demo
              id="s4"
              name="Time range"
              api='variant="time-range" · stepMinutes · allowOvernight'
              tags={["two columns", "filtered end", "derived length"]}
              note="A day at half-hour steps is forty-eight times and therefore over a thousand possible spans, so a single list of spans is unreadable. Two columns is the shape the question actually has. The end column is filtered rather than merely ordered: every time that cannot be an end — before the start, shorter than the minimum, longer than the maximum — is struck and says why, because offering a time that will be rejected on commit is how a booking form teaches people to distrust it. The badge is the proof-read: a start typed as PM when the reader meant AM is invisible in 7:00 → 10:00 and unmissable as a negative span. The second field is a night shift, which is a real shift — refusing 22:00 to 06:30 corrupts the data the refusal was protecting — so it is accepted, and the next-day crossing is said in words rather than wrapped in silence."
              wide
            >
              <TimeRangeDemo />
            </Demo>
          </div>
        ) : null}

        {chapter === "booking" ? (
          <div className="ox-gallery__grid">
            <Demo
              id="b1"
              name="Slots"
              api='variant="slots" · set={availability}'
              tags={["four states", "age"]}
              note="Availability arrives as data with an age, and the age is on screen: “as of 3 minutes ago”, with a refresh, because a slot grid that looks live and is four minutes stale is how two receptionists book the same 2 PM. Four states, and each says why rather than greying out: booked, no room, provider unavailable, facility closed. The 1:30 slot is held by somebody else and counts down — a hold is not a booking, it expires, and rendering it as taken loses a slot that is about to come back. Nothing here fetches or books: ADR 0009 forbids the network in component source, and the host is the only party that can reconcile a rejection anyway."
              wide
            >
              <SlotsDemo />
            </Demo>

            <Demo
              id="b2"
              name="Exhausted, not empty"
              api="set.exhausted"
              tags={["empty state"]}
              note="“No times available” and “we have not looked yet” are different facts, and a grid that renders both as an empty box has told the user nothing. `exhausted` says the search completed and found nothing, which is what licenses the next sentence — try another day, another provider, the waitlist. A spinner that never resolves and an honest nothing look identical for the first four seconds; only one of them is still honest at ten."
            >
              <SlotsEmptyDemo />
            </Demo>

            <Demo
              id="b3"
              name="Scheduler"
              api='variant="scheduler"'
              tags={["provider × date × time"]}
              note="Three questions on one surface, in the order people actually ask them. Change the provider and the day strip recolours by open-slot count before you have picked a date — density is visible before a click, which is the difference between finding the first free Tuesday in one pass and in nine. Buffers belong to the interval rather than to the display: a 50-minute session with a 10-minute turnaround occupies 60 minutes of the room, the summary says so, and that is the figure the next slot was tested against. Pick a time and the summary names the provider's zone — but only where it differs from the reader's, because “3 PM ET” shown to somebody already in Eastern Time is the noise that teaches people to stop reading zone labels. Nothing is asserted until a slot is chosen, and what is asserted then says it is not a booking."
              wide
            >
              <SchedulerDemo />
            </Demo>
          </div>
        ) : null}

        {chapter === "series" ? (
          <div className="ox-gallery__grid">
            <Demo
              id="r1"
              name="Recurrence"
              api='variant="recurrence" · showRRule'
              tags={["RFC 5545"]}
              note="The rule in words before anything is created — “Every week on Tuesday at 2:00 PM, 16 times, ending 15 December” — with the first occurrences listed underneath. A recurrence editor whose output you cannot read before you commit is how a patient ends up with fifty-two appointments they did not agree to. The emitted RRULE is real RFC 5545 with its EXDATE, so the series round-trips through a scheduling system rather than living only in this UI."
              wide
            >
              <RecurrenceDemo />
            </Demo>

            <Demo
              id="r2"
              name="Refusal, in full"
              api="unsupported={{ source, parts }}"
              tags={["named subset"]}
              note="The implemented subset is DAILY, WEEKLY and MONTHLY with INTERVAL, BYDAY, BYSETPOS, BYMONTHDAY, COUNT, UNTIL and EXDATE. A rule outside it is refused loudly, rendered read-only, and shown with the original string intact — because the failure mode of a partial RRULE parser is not an error, it is a series that silently expands to the wrong dates and gets booked. The parts it could not handle are named individually, so the person reading knows whether to edit it elsewhere or ask for the feature."
            >
              <RecurrenceRefusedDemo />
            </Demo>

            <Demo
              id="r3"
              name="Series"
              api='variant="series" · verdicts'
              tags={["resolve before book"]}
              note="Sixteen weekly sessions, three of which collide with something the host knows about: provider leave, a programme closure, and a room clash with no alternative. Each row offers the nearest working date and resolves individually, or all at once; the third has no alternative and says so rather than offering a button that cannot work. Nothing is written until every collision is resolved or accepted, which is the entire point — a series booked first and repaired afterwards is sixteen notifications to a patient, then three more."
              wide
            >
              <SeriesDemo />
            </Demo>

            <Demo
              id="r4"
              name="Group"
              api='variant="group"'
              tags={["room", "roster", "count"]}
              note="A group is a series with three extra facts that decide whether it can run at all: a room with a capacity, facilitators who must both be free, and an enrolment that is checked against the smaller of room and programme capacity. The count in the header is the one that is actually true — 26 weekly occurrences minus three programme closures is 23 sessions, and a header that says 26 is what a patient's treatment plan gets written against. The exclusions are listed with their reasons rather than folded silently into the arithmetic."
              wide
            >
              <GroupDemo />
            </Demo>
          </div>
        ) : null}

        {chapter === "rules" ? (
          <div className="ox-gallery__grid">
            <Demo
              id="t1"
              name="Daylight saving, classified"
              api="classifyLocalTime(zone, date, time)"
              tags={["engine", "tzdb"]}
              note="Three cases that a naive offset probe gets wrong. 2:30 AM on 8 March 2026 in New York does not exist — the clock jumps 2:00 to 3:00 — and asking for its offset returns a plausible number for a time nobody can attend. 1:30 AM on 1 November happens twice, an hour apart, which is a real problem for an overnight shift boundary. Lord Howe shifts by thirty minutes, and Kathmandu sits at +5:45 with no DST at all, which is why every offset in this library is minutes and never hours. The component does not decide what to do about any of it; a host does, and this is what it decides with."
              wide
            >
              <DstDemo />
            </Demo>

            <Demo
              id="t2"
              name="Density and direction, across the family"
              api="data-ox-density · dir"
              tags={["target ≥ 24px", "RTL"]}
              note="The six compact variants, side by side. Clinical density tightens the ink and never the target: no interactive element goes under 24px — the WCAG 2.2 SC 2.5.8 floor, held by the segments as well as the buttons, which is where it is usually lost. A mis-tap on a calendar cell is clinically consequential in a way it is not on a marketing site. The Theme × density chapter renders every combination if you want to measure it. dir=“ltr” stays pinned on the field itself, because letting the segments inherit RTL renders 26/08/2026 as 2026/08/26 — plausible, and the wrong date. The scheduler and the series surfaces are the width of a page and get their own chapters."
              wide
            >
              <TargetDemo />
            </Demo>
          </div>
        ) : null}

        {chapter === "matrix" ? (
          <div className="ox-matrix">
            {THEMES.map(([themeKey]) =>
              DENSITIES.map((densityKey) => (
                <MatrixCell
                  key={`${themeKey}-${densityKey}`}
                  theme={themeKey}
                  density={densityKey}
                />
              )),
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
