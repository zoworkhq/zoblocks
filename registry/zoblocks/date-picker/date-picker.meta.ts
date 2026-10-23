import { defineComponentMeta } from "@zoblocks/component-meta";

export default defineComponentMeta({
  name: "date-picker",
  title: "Date Picker",
  technicalName: "DatePicker",
  tier: "free",
  status: "beta",
  since: "0.5.0",
  layer: "clinical",

  summary:
    "One temporal control with sixteen variants: field, calendar, date and time ranges, birth date, session, slots, recurrence and the read-only record.",

  tagline: "One temporal control, sixteen variants, one value space.",
  description:
    "Sixteen presentations of one value space, one keyboard model and one accessibility contract. `variant` picks the surface; the parts are separately testable components underneath.",
  rationale:
    'A clinician does not shop for a "birth date field". They reach for the date control, and it has to behave differently in sixteen places: a service date they already know, an appointment they have to be shown, a birth date that wants an age beside it, a session that is three numbers with two degrees of freedom, a course of treatment that is a rule rather than a date, and a signed timestamp that is a legal instrument. Splitting those into sixteen catalogue entries hides the thing that makes them a system — that every one shares a value space, a keyboard model and an accessibility contract — and it makes a reader choose between components before they have understood the choice. The deeper reason is that healthcare temporal input is four distinct jobs, not one: recall (the user knows the value), choose (the system knows the options), construct (the value is a structure with derived members) and witness (the value is an assertion about the past). Every general-purpose picker builds only for choose, which is the rarest of the four in an electronic record, and that inversion is why EHR date fields are the way they are.',

  /*
   * The dispatch is one file and the sixteen variants are another.
   *
   * Without this the props table is the *intersection* of sixteen prop
   * interfaces — `variant`, `value`, `onChange` — and a reader looking for
   * `set`, `providers` or `durationPresets` finds nothing at all.
   */
  extraPropsSources: ["../lib/datetime-parts.tsx"],

  categories: ["Clinical", "Forms"],

  fhir: [
    {
      name: "Patient",
      url: "https://hl7.org/fhir/R4/patient.html",
      note: "birthDate permits YYYY and YYYY-MM, so the birth-date variant stores a partial date rather than inventing 1 January.",
    },
    {
      name: "Slot",
      url: "https://hl7.org/fhir/R4/slot.html",
      note: "The slots variant renders a Slot set. busy-tentative becomes a hold rather than a booking, because it expires.",
    },
    {
      name: "Schedule",
      url: "https://hl7.org/fhir/R4/schedule.html",
      note: "The scheduler variant asks the host for a Schedule's slots; it never fetches them itself.",
    },
    {
      name: "PractitionerRole",
      url: "https://hl7.org/fhir/R4/practitionerrole.html",
      note: "availableTime and notAvailable are different facts — 'does not work Thursdays' and 'on leave until the 15th' — and are read separately.",
    },
    {
      name: "Timing",
      url: "https://hl7.org/fhir/R4/datatypes.html#Timing",
      note: "The recurrence variant emits a real RFC 5545 RRULE with its EXDATE, so a series round-trips.",
    },
  ],

  states: [
    "Picker — field with a calendar behind a button",
    "Field — no popover at all",
    "Calendar — inline month grid",
    "Range — two clicks, never a drag",
    "Date range — both ends typed, two months behind them, named periods down the side",
    "Multiple dates — capped, click again to remove",
    "Birth date — age, partial dates, stated absence",
    "Time — and the ambiguity it refuses to resolve",
    "Session — start, end, duration, visible driver",
    "Time range — two columns, a filtered end, a derived length",
    "Slots — grouped, counted, four states",
    "Scheduler — provider, date and time on one surface",
    "Recurrence — the rule in words",
    "Series — conflicts resolved before anything is written",
    "Group — the room, the roster and the real count",
    "Read-only — the record a reviewer sees",
  ],

  a11y: [
    {
      label: "One tab stop per field, not three",
      detail:
        "Every segmented variant is a single tab stop whose segments move with arrow keys, which is what the APG specifies for a composite. Three tab stops in a date field is nine in a date range, and a form with six dates becomes fifty-four presses to cross.",
    },
    {
      label: "One roving tabstop in every grid",
      detail:
        "Exactly one calendar cell carries tabindex 0, resolved against the month actually displayed. Forty-two focusable cells is the most common accessibility failure in a date picker, and a calendar opened on a month with no focus date has none at all — which is the same bug from the other side.",
    },
    {
      label: "Every cell and slot is named in full",
      detail:
        'A cell reads "Wednesday, August 26, 2026, 8 times available", not "26"; a slot reads its whole interval and why it cannot be taken. An element in a grid has no column header in its accessible context.',
    },
    {
      label: "Three message tiers, three ARIA treatments",
      detail:
        'An error is role="alert", assertive, and sets aria-invalid. A conflict is a legal value colliding with other state: role="status", polite, not invalid. An advisory is polite and toneless — a clinician documenting last Friday\'s session must not be told they have made a mistake.',
    },
    {
      label: "One tabstop across two months, not one per month",
      detail:
        "Two adjacent panels overlap by up to a fortnight, so the adjacent-month days are not drawn at all when more than one month is shown. Drawing them gives the same date two cells, both matching the focus date, which is where a second tabstop comes from. For the same reason there is one previous and one next control for the whole window rather than one pair per month.",
    },
    {
      label: "Colour is never the only channel",
      detail:
        "Today is a dot as well as a weight, an unavailable day is struck as well as dimmed, and a held session member carries a lock glyph and the word Held beside its tint. All three survive greyscale, forced-colors and a red-green deficiency.",
    },
    {
      label: "The value never mirrors in RTL",
      detail:
        'dir="ltr" is set on the field itself. The grid mirrors; the digits do not. Letting the segments inherit dir="rtl" renders 26/08/2026 as 2026/08/26, which is plausible and is the wrong date.',
    },
    {
      label: "Target size holds at every density",
      detail:
        "Clinical density tightens type and gaps and never the target: every interactive element measures at least 24px in every profile, which is the WCAG 2.2 SC 2.5.8 floor. A mis-tap on a calendar cell is clinically consequential in a way it is not on a marketing site.",
    },
    {
      label: "Escape keeps what was typed",
      detail:
        "Closing a calendar preserves a half-entered value and returns focus to the trigger. An Escape that discards it is the reason people stop using keyboards.",
    },
  ],

  limitations: [
    "The value is an ZbDate, not a Dayjs. This is the deliberate divergence from Ant Design: matching the value type would put a date library in the graph of every form component — exactly what ADR 0010 exists to prevent — and would make a birth date representable as midnight UTC. A Dayjs codebase converts at the boundary.",
    'Ant Design\'s prop names are not implemented, and ADR 0010 requires the divergences be named: there is no picker, showTime, allowClear, status or DatePicker.RangePicker, and antd\'s disabledDate and format are spelled unavailable and order. The reasons differ. unavailable returns the reason a day cannot be chosen rather than a boolean, because that reason is spoken and shown, and a boolean cannot carry it. picker="week" and picker="quarter" have no healthcare workflow we have found, and a stub rendering a day grid would be worse than an honest absence. The rest is unbuilt rather than rejected. A migration from antd is not yet one changed import line.',
    "Recurrence implements a named RFC 5545 subset — DAILY, WEEKLY, MONTHLY with INTERVAL, BYDAY, BYSETPOS, BYMONTHDAY, COUNT, UNTIL and EXDATE. Anything else is refused and rendered read-only with its original string, rather than silently mis-expanded.",
    "Nothing here fetches, holds, or books. Availability arrives as data with an age and every transition is reported through a callback — ADR 0009 forbids the network in component source, and the host is the only party that can reconcile a rejection anyway.",
    'The range panel commits explicitly by default and the inline calendar does not. `Calendar` keeps `commit="immediate"` so no existing use changes behaviour; `DateRangeField` opts into `explicit` because a range is two clicks and the first is often wrong. A host that wants one rule everywhere has to say so on both.',
    "Non-Gregorian calendar input is not supported. Intl will format a Hijri or Buddhist date today, but a grid whose months have variable length and a year field with a different epoch is a project rather than a flag.",
    "Duration bands and session presets ship empty. A fifty-three-minute session is a fact about somebody's payer contract rather than about therapy, and asserting a code would be clinical decision support, which ADR 0009 prohibits.",
  ],

  related: ["clinical-note", "switch", "care-timeline"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "datetime-core"],

  usage: `import { DatePicker } from "@/components/zoblocks/date-picker";
import { plainDate } from "@/lib/zoblocks-datetime";
import "@/styles/zoblocks-datetime.css";

// The clock is injected. Nothing in this family reads it.
const today = plainDate(2026, 8, 26);

<DatePicker variant="picker" label="Appointment date" now={today} value={date} onChange={setDate} />
<DatePicker variant="birth-date" now={today} allowEstimated allowAbsent />
<DatePicker variant="session" durationPresets={org.presets} bands={org.bands} />
<DatePicker variant="slots" set={availability} now={now} onSelect={hold} />

// Or reach for a part directly when the surface chose at design time.
import { SessionTimeField } from "@/components/zoblocks/date-picker";`,

  guidance: {
    use: [
      'variant="field" for a date the user already knows — service date, admission, assessment. Four-fifths of healthcare date fields are this, and a popover there is four clicks where eight keystrokes would do.',
      'variant="picker" where they may need to see a month to answer, and as the drop-in for an existing antd DatePicker.',
      'variant="birth-date" at every registration and intake. The age readout is the field\'s own error check, not decoration.',
      'variant="date-range" for a span of days somebody has to state — an authorisation window, a leave of absence, a reporting period. Two months, because most ranges cross a month boundary, and presets, because most range answers have a name.',
      'variant="time-range" where a start and an end have to agree and neither is derived from a duration. Reach for "session" instead wherever the length is the thing the organisation cares about, because that is the variant that shows which member is held.',
      'variant="session" wherever a session, shift or block has a start, an end and a length that have to agree.',
      'variant="slots" or "scheduler" only where the system knows the options and the user cannot — that is the one job in the four that needs availability at all.',
      "With now passed from the server, so the field and the page agree about which day it is.",
    ],
    avoid: [
      "Reaching for the scheduler variants on a documentation form. A clinician entering a session timestamp should not load, see, or tab through the machinery required to schedule a twelve-week series.",
      'futurePolicy="block" as a reflex. A discharge date can legitimately be in the future, and blocking it teaches staff to enter a wrong date to get past the validator.',
      "Using the band readout to recommend a code. The component reports which band a value falls in; choosing a code is a human act and a compliance question.",
      "Hiding the held/derived badge on the session variant. That returns the component to the defect it was built to fix.",
      'commit="immediate" on a range panel whose parent refetches. Every click is reported, so a mis-clicked start filters a report on a range nobody chose.',
      'Shipping the general preset set unedited. `dateRangePresets` is a starting point: "This year" on a two-week authorisation window is noise, and seven periods nobody uses is seven rows between the reader and the two they do.',
    ],
  },

  uxGuidelines: {
    do: [
      "Pick the variant by the job — recall, choose, construct or witness — not by the shape of the data.",
      "Let the reason be a string. `unavailable` and `disabledDate` return why, and the why reaches the accessible name.",
      "Say Optional in words. An unmarked field is ambiguous: the reader cannot tell optional from an author who forgot.",
      "Let a paste through. A date copied out of a referral letter is how a great deal of clinical data actually moves.",
    ],
    dont: [
      "Do not colour-code the reasons a day or a slot is closed. One muted treatment and a spoken reason beats five hues nobody has a legend for.",
      "Do not clamp a duration silently. The session variant reports an overrun and offers a correction on purpose.",
      "Do not render absence as an em dash or N/A. Which kind of absence it is, is a fact.",
      "Do not refuse a session that crosses midnight. It is a real shift, and refusing it corrupts the data you were protecting.",
    ],
  },

  tags: ["form-control", "data-entry", "overlay", "keyboard-first", "themeable", "print-safe"],
  aliases: [
    "react date picker",
    "healthcare date time picker",
    "appointment scheduler react",
    "session time picker",
    "react date range picker",
    "time range picker react",
    "date of birth input",
    "recurrence rule builder react",
  ],

  domain: {
    industries: ["healthcare", "behavioral-health"],
    clinicalContext:
      "Every temporal field in an electronic record, from a date of birth at intake to a twelve-week group series — organised around the four jobs healthcare temporal input actually is, rather than around the calendar that serves the rarest of them.",
    workflows: ["intake", "documentation", "care-coordination", "assessment", "medication"],
    phi: {
      handles: true,
      notes:
        "Dates are identifying under HIPAA's Safe Harbor list. Nothing here logs a value, places one in a URL or query string, or writes one to browser storage — a prefilled date in a query string is a birth date in a web-server access log, a referrer header and a CDN cache. The restricted read-only mode exists so a protected value can be acknowledged on a screen its reader is not cleared for.",
    },
    auditable: false,
    permissions: [],
    terminology: ["FHIR"],
  },

  variants: [
    {
      id: "picker",
      label: "Picker",
      description: "Field with a calendar behind a button. antd's DatePicker, with our value type.",
      args: { variant: "picker" },
    },
    {
      id: "field",
      label: "Field",
      description: "No popover at all. A whole date in eight keystrokes.",
      args: { variant: "field" },
    },
    {
      id: "calendar",
      label: "Calendar",
      description: "The month grid inline, with availability density under the numerals.",
      args: { variant: "calendar" },
    },
    {
      id: "range",
      label: "Range",
      description: "Two clicks and a preview between them. Never a drag.",
      args: { variant: "range" },
    },
    {
      id: "date-range",
      label: "Date range",
      description:
        "Two typeable ends in one shell, two contiguous months behind them, and named periods down the side.",
      args: { variant: "date-range" },
    },
    {
      id: "multiple",
      label: "Multiple dates",
      description: "Capped; clicking a selected date removes it.",
      args: { variant: "multiple" },
    },
    {
      id: "birth-date",
      label: "Birth date",
      description: "Live age, year-only precision, and absence with a reason.",
      args: { variant: "birth-date" },
    },
    {
      id: "time",
      label: "Time",
      description: "Bounded segments, optional seconds, and a bare 9 it will not resolve.",
      args: { variant: "time" },
    },
    {
      id: "session",
      label: "Session",
      description: "Start, end and duration, with the held member always marked.",
      args: { variant: "session" },
    },
    {
      id: "time-range",
      label: "Time range",
      description:
        "A start, an end and the length between them. The end column is filtered, not merely ordered.",
      args: { variant: "time-range" },
    },
    {
      id: "slots",
      label: "Slots",
      description: "Availability grouped and counted. Four states, three reasons, one treatment.",
      args: { variant: "slots" },
    },
    {
      id: "scheduler",
      label: "Scheduler",
      description: "Provider, day and time on one surface, with a rejection path.",
      args: { variant: "scheduler" },
    },
    {
      id: "recurrence",
      label: "Recurrence",
      description: "The rule in plain language, and a real RRULE beneath it.",
      args: { variant: "recurrence" },
    },
    {
      id: "series",
      label: "Series",
      description: "A course of treatment, conflicts resolved before anything is written.",
      args: { variant: "series" },
    },
    {
      id: "group",
      label: "Group",
      description: "Room, roster, capacity — and the count that survives the closures.",
      args: { variant: "group" },
    },
    {
      id: "readout",
      label: "Read-only",
      description: "The record a reviewer, an auditor or a printer sees.",
      args: { variant: "readout" },
    },
  ],

  controls: [
    {
      prop: "variant",
      control: "select",
      label: "Variant",
      options: [
        "picker",
        "field",
        "calendar",
        "range",
        "date-range",
        "multiple",
        "birth-date",
        "time",
        "session",
        "time-range",
        "slots",
        "scheduler",
        "recurrence",
        "series",
        "group",
        "readout",
      ],
      defaultValue: "picker",
    },
  ],

  a11yChecks: [
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: 'Segments are role="spinbutton" with aria-valuetext; grids are role="grid" with rows, columnheaders and named gridcells; the calendar is role="dialog".',
      evidence: "date-picker.test.tsx",
    },
    {
      wcag: "2.1.1",
      name: "Keyboard",
      status: "pass",
      how: "Every value is reachable with digits and arrow keys. PageUp/PageDown change month, Shift with them changes year, Escape closes and keeps the typed value.",
      evidence: "date-picker.test.tsx",
    },
    {
      wcag: "2.4.3",
      name: "Focus order",
      status: "pass",
      how: "One tab stop per field and one roving tabstop per grid, resolved against the month displayed.",
      evidence: "date-picker.test.tsx",
    },
    {
      wcag: "2.4.11",
      name: "Focus not obscured",
      status: "pass",
      how: "The calendar flips above the field when the space below it is too short, so the focused element is never what the popover covers.",
      evidence: "date-picker.test.tsx",
    },
    {
      wcag: "2.5.7",
      name: "Dragging movements",
      status: "pass",
      how: "Range selection is two clicks. There is no drag path anywhere in the component.",
      evidence: "date-picker.test.tsx",
    },
    {
      wcag: "2.5.8",
      name: "Target size",
      status: "pass",
      how: "Every interactive element holds 24px at all three density profiles; clinical density tightens type and gaps only.",
      evidence: "date-picker.test.tsx",
    },
    {
      wcag: "1.4.1",
      name: "Use of colour",
      status: "pass",
      how: "Today is a dot as well as a weight; unavailable is a strike as well as a tint; held carries a glyph and a word.",
      evidence: "date-picker.test.tsx",
    },
    {
      wcag: "3.3.1",
      name: "Error identification",
      status: "pass",
      how: 'Errors set aria-invalid and use role="alert"; conflicts and advisories are role="status" and do not, because the value is legal.',
      evidence: "date-picker.test.tsx",
    },
    {
      wcag: "3.3.7",
      name: "Redundant entry",
      status: "pass",
      how: "The birth-date variant offers a value already on file as a one-press fill rather than pre-filling it — pre-filling a legal attestation is a different defect.",
      evidence: "date-picker.test.tsx",
    },
    {
      wcag: "2.2.1",
      name: "Timing adjustable",
      status: "not-applicable",
      how: "Slot holds are the host's timers; the component renders the remaining time it is given and never enforces one.",
    },
  ],

  fixtures: ["patientRoutine", "appointmentBooked", "encounterRoutine"],

  examples: [
    /* ---------------------------------------------------------------- */
    /* Fields — recall: the user already knows the value                  */
    /* ---------------------------------------------------------------- */
    {
      id: "four-jobs",
      group: "Fields",
      title: "Four jobs, four variants",
      description:
        "The organising idea. Recall is a value the user already holds; choose is one only the system knows; construct is a structure with derived members; witness is an assertion about the past. Each wants a different primary control, and picking the wrong one is how a date field becomes something staff route around.",
      fixture: "patientRoutine",
      code: `<DatePicker variant="field"   label="Date of service" now={today} showRelative />
<DatePicker variant="slots"   label="Available times" set={availability} now={now} />
<DatePicker variant="session" label="Individual therapy" durationPresets={BEHAVIORAL_HEALTH_DURATIONS} />
<DatePicker variant="readout" as="time" value={signedAt} now={today} showZone />`,
    },
    {
      id: "picker",
      group: "Fields",
      title: "Picker: a field with a calendar behind it",
      description:
        "Type 09022026 without opening anything; press the button and the grid opens on September, with closed days struck and the open-slot count under each numeral. Escape closes and keeps what was typed. The rail is the host's: `relativeDateOptions(now)`, passed in, because “Next Monday” is a scheduling convention, not a component default.",
      code: `<DateField
  label="Appointment date"
  showCalendar
  now={today}
  value={value}
  onChange={setValue}
  unavailable={clinicClosed}   // returns the reason, or null
  load={openSlotCount}
  calendarShortcuts={relativeDateOptions(today)}
  calendarShowCustom
  calendarHints
  calendarCommit="explicit"
/>`,
    },
    {
      id: "field",
      group: "Fields",
      title: "Field: three segments, one tab stop",
      description:
        "The variant most healthcare fields actually want. A segment advances itself the moment no further digit could be valid — 9 in the month jumps on, 1 waits for a possible 12 — which is what makes eight keystrokes enough. With a `name`, it posts ISO into a plain HTML form.",
      code: `<DateField label="Date of service" now={today} showRelative />

<DateField
  label="Referral received"
  now={today}
  name="referral_date"          // posts 2026-08-21
  defaultValue={plainDate(2026, 8, 21)}
  showRelative
/>`,
    },
    {
      id: "tiers",
      group: "Fields",
      title: "Three tiers, three behaviours",
      description:
        "There is no correct default for the future. A date of birth may never be in it: blocked, announced assertively, aria-invalid. A documentation date in the future is suspicious, not impossible: a polite warning, not invalid. A retrospective service date is ordinary — blocking it is what teaches staff to date notes to today.",
      code: `<DateField label="Date of birth" now={today} futurePolicy="block" />
<DateField label="Session documented" now={today} futurePolicy="warn" />
<DateField label="Date of service" now={today} showRelative />`,
    },
    {
      id: "birth-date",
      group: "Fields",
      title: "Birth date, read back as an age",
      description:
        "A transposed year is invisible in 07/18/1968 and screaming in “58 years old”. Under two years it reads in months and under four weeks in days, because a paediatric chart that says “0 years old” has discarded the number a weight-based dose is calculated from. The calendar, when it opens, opens on the year.",
      fixture: "patientRoutine",
      code: `<BirthDateField now={today} defaultValue={plainDate(1986, 7, 18)} calendarHints />
<BirthDateField now={today} defaultValue={plainDate(2026, 4, 20)} />  // 4 months
<BirthDateField now={today} defaultValue={plainDate(2026, 8, 9)} />   // 17 days`,
    },
    {
      id: "birth-date-partial",
      group: "Fields",
      title: "Partial and absent birth dates",
      description:
        "FHIR permits YYYY and YYYY-MM for Patient.birthDate, because homeless services, unaccompanied minors and forensic intake produce them. Coercing “born around 1962” to 1 January invents a fact. Absence carries its reason, so “not recorded” and “nobody asked” stay different.",
      code: `<BirthDateField
  now={today}
  allowEstimated
  allowAbsent
  precision="year"
  value={{ kind: "partial-date", y: 1962 }}
/>

<BirthDateField
  now={today}
  allowAbsent
  absentReason="asked-declined"
  value={{ kind: "absent", reason: "asked-declined" }}
/>`,
    },
    {
      id: "time",
      group: "Fields",
      title: "Time that refuses to guess",
      description:
        "Type a bare 9 into the first field: the meridiem stays empty, the value stays incomplete, and the field asks — rather than silently turning a 9 PM discharge into a 9 AM one. Presets are an interval, not a menu. The third is 24-hour with seconds, for an observation timestamp.",
      code: `<TimeField label="Discharge time" />
<TimeField label="Time given" presets={timeGrid(8 * 60, 10 * 60, 20)} />
<TimeField label="Observation" hour24 showSecond />`,
    },
    {
      id: "readout",
      group: "Fields",
      title: "Readout: the instant, then the reading aid",
      description:
        "“3 days after service” is a reading aid; the timestamp is the record. Anything a signature depends on prints its stored instant and IANA zone, and a second zone only when the reader's differs. Absent and restricted are explained rather than blank, because a blank cell reads as “nothing happened”.",
      code: `<ClinicalDateTime as="time" value={signedAt} now={today} showRelative showZone />
<ClinicalDateTime as="time" value={signedAt} now={today} viewerZone="America/Los_Angeles" showZone />
<ClinicalDateTime value={{ kind: "absent", reason: "asked-declined" }} />
<ClinicalDateTime value={serviceDate} restricted />`,
    },
    {
      id: "antd-migration",
      group: "Fields",
      title: "Coming from antd",
      description:
        "Not yet one changed import line, and the differences are named rather than hidden: antd's disabledDate is `unavailable` and returns the reason instead of a boolean, because the reason is spoken and shown; the value is a plain `ZbDate`, not a Dayjs, so a birth date is never midnight UTC. There is no picker, showTime, allowClear or status yet.",
      fixture: "appointmentBooked",
      code: `- import { DatePicker } from "antd";
+ import { DatePicker } from "@zoblocks/react";

  <DatePicker
-   disabledDate={(day) => isClosed(day)}
+   unavailable={(date) => (isClosed(date) ? "Clinic closed" : null)}
-   value={dayjsValue}
+   value={zbDate}               // { kind: "date", y, m, d }
+   now={today}
  />`,
    },

    /* ---------------------------------------------------------------- */
    /* Calendars                                                          */
    /* ---------------------------------------------------------------- */
    {
      id: "anatomy",
      group: "Calendars",
      title: "Why the panel is shaped like this",
      description:
        "The panel never moves; the explanation does. Each note is measured off the real DOM — the accessible name it quotes is the one the cell carries, the target size is what it measures in your browser now. Every note is a real button, so paused or through a screen reader this reads as six labelled paragraphs. It never starts under reduced motion.",
      code: `<Calendar
  mode="range"
  months={2}
  weekStart={1}
  commit="explicit"
  hints
  presets={dateRangePresets(today)}
  showCustomPreset
  now={today}
  defaultRange={{ start: plainDate(2026, 8, 17), end: plainDate(2026, 9, 11) }}
/>`,
    },
    {
      id: "calendar",
      group: "Calendars",
      title: "One tab stop, every cell named",
      description:
        "Tab to the grid and move with the arrows; PageUp/PageDown change month, with Shift the year — which the legend exists to tell you. Exactly one cell is reachable by Tab, and every cell is named as its whole date plus its state: “Wednesday, 26 August 2026, 8 times available”, not “26”.",
      code: `<Calendar
  now={today}
  defaultValue={today}
  load={openSlotCount}
  unavailable={clinicClosed}
  shortcuts={relativeDateOptions(today)}
  showCustomPreset
  hints
  commit="explicit"
/>`,
    },
    {
      id: "multiple",
      group: "Calendars",
      title: "Several dates that are not a range",
      description:
        "The make-up sessions after a missed fortnight. Clicking a selected date removes it — a remove control inside a 32px cell would fall under the 24px target floor. The cap is refused silently at the boundary: a fifth click that does nothing teaches better than a dialog.",
      code: `<Calendar mode="multiple" maxDates={4} now={today} unavailable={clinicClosed} hints />`,
    },
    {
      id: "range",
      group: "Calendars",
      title: "A range in two clicks, never a drag",
      description:
        "There is no drag path anywhere (WCAG 2.2 SC 2.5.7). The second click completes the range in either direction: clicking the later date first has told you both ends, and swapping them is right.",
      code: `<Calendar
  mode="range"
  months={2}
  weekStart={1}
  now={today}
  unavailable={clinicClosed}
  presets={dateRangePresets(today, { weekStart: 1 })}
  showCustomPreset
  hints
  commit="explicit"
/>`,
    },
    {
      id: "range-panel",
      group: "Calendars",
      title: "Two months, one set of controls",
      description:
        "Most ranges cross a month boundary, so the panel shows two contiguous months paged together — previous on the first, next on the last, so no two buttons announce the same name. The rail is data from `dateRangePresets(now)`, and nothing reaches the host until Done.",
      code: `<Calendar
  mode="range"
  months={2}
  commit="explicit"
  hints
  weekStart={1}
  presets={dateRangePresets(today, { weekStart: 1 })}
  showCustomPreset
  now={today}
  defaultRange={{ start: plainDate(2026, 8, 17), end: plainDate(2026, 9, 17) }}
/>`,
    },
    {
      id: "date-range",
      group: "Calendars",
      title: "Range field: both ends typed",
      description:
        "One shell, two typed halves. The day count is inclusive — the 1st to the 7th is seven days of care — and it is the field's own proof-read: a transposed month is invisible in 03/07 – 07/07 and unmissable as “123 days”. An end before its start is an error, not a silent swap.",
      code: `<DateRangeField
  label="Authorisation window"
  now={today}
  weekStart={1}
  months={2}
  showSpan
  hints
  presets={dateRangePresets(today, { weekStart: 1 })}
  showCustomPreset
  maxSpanDays={90}
  value={range}
  onChange={setRange}
/>`,
    },

    /* ---------------------------------------------------------------- */
    /* Sessions                                                           */
    /* ---------------------------------------------------------------- */
    {
      id: "session",
      group: "Sessions",
      title: "Three values, two degrees of freedom",
      description:
        "Press a duration chip and the end moves, marked Derived. Type an end and the duration recomputes — and the Held badge moves with it. Move the start: hold the duration and the session slides; hold the end and it stretches. Which one you got is shown, rather than discovered on a real appointment.",
      code: `<SessionTimeField
  label="Individual therapy"
  defaultValue={sessionFrom(plainTime(9, 0), 53)}
  durationPresets={BEHAVIORAL_HEALTH_DURATIONS}
  bands={org.thresholds}
/>`,
    },
    {
      id: "overnight",
      group: "Sessions",
      title: "Overnight, and the guard",
      description:
        "11:30 PM to 7:30 AM is a crisis-line shift, not a typo, so the day boundary is stated as a labelled next-day marker rather than refused. The guard catches the absurd one — a start past a held end — and offers the likely correction: somebody typed 2:00 meaning the afternoon.",
      code: `<SessionTimeField
  label="Crisis line shift"
  maxMinutes={720}
  allowOvernight
  nextDateLabel="Aug 27"
  defaultValue={withSessionEnd(sessionFrom(plainTime(23, 30), 0), plainTime(7, 30), {
    allowOvernight: true,
  })}
/>`,
    },
    {
      id: "bands",
      group: "Sessions",
      title: "Bands are the host's",
      description:
        "The band under the duration comes from the host's array; the component ships it empty. A fifty-three-minute session is a fact about a payer contract, and a library asserting a billing code from a duration would be clinical decision support, which ADR 0009 prohibits.",
      code: `const thresholds = [
  { minMinutes: 0, maxMinutes: 15, code: null, label: "Not billable" },
  { minMinutes: 16, maxMinutes: 52, code: "SHORT", label: "Standard session" },
  { minMinutes: 53, maxMinutes: 999, code: "LONG", label: "Extended session" },
];

<SessionTimeField
  label="Documentation time"
  defaultValue={sessionFrom(plainTime(15, 0), 12)}
  durationPresets={BEHAVIORAL_HEALTH_DURATIONS}
  bands={thresholds}
/>`,
    },
    {
      id: "time-range",
      group: "Sessions",
      title: "Time range: two columns, filtered",
      description:
        "Every time that cannot be an end — before the start, shorter than the minimum, longer than the maximum — is struck and says why. The length badge is the proof-read. A night shift is accepted, and its next-day crossing is said in words.",
      code: `<TimeRangeField
  label="Time range"
  stepMinutes={60}
  minDurationMinutes={30}
  maxDurationMinutes={480}
  value={range}
  onChange={setRange}
/>

<TimeRangeField label="Night shift" stepMinutes={30} allowOvernight />`,
    },

    /* ---------------------------------------------------------------- */
    /* Booking                                                            */
    /* ---------------------------------------------------------------- */
    {
      id: "slots",
      group: "Booking",
      title: "Availability with an age",
      description:
        "“As of 3 minutes ago”, with a refresh, because a grid that looks live and is four minutes stale is how two receptionists book the same 2 PM. Four unavailable states, each saying why. A hold is not a booking: it counts down and comes back. Nothing here fetches or books.",
      code: `<TimeSlotGrid
  label="Available times — Thu 27 Aug"
  set={availability}            // { asOf, staleAfterSeconds, slots, exhausted }
  now={now}
  value={slotId}
  onSelect={(slot) => hold(slot.id)}
  onRefresh={refetch}
/>`,
    },
    {
      id: "exhausted",
      group: "Booking",
      title: "Exhausted, not empty",
      description:
        "“No times available” and “we have not looked yet” are different facts. `exhausted` says the search completed and found nothing, which licenses the next sentence: another day, another provider, the waitlist.",
      code: `<TimeSlotGrid
  label="Available times — Fri 28 Aug"
  set={{ asOf: now, slots: [], exhausted: true }}
  now={now}
/>`,
    },
    {
      id: "scheduler",
      group: "Booking",
      title: "Provider, day and time on one surface",
      description:
        "Change the provider and the day strip recolours by open-slot count before you pick a date. Buffers belong to the interval: a 50-minute session with a 10-minute turnaround occupies 60 minutes. The provider's zone is named only where it differs from yours, and nothing chosen is called a booking.",
      code: `<AppointmentScheduler
  label="Book an appointment"
  providers={providers}
  actorId={providerId}
  onActorChange={setProviderId}
  date={date}
  onDateChange={setDate}
  dayLoads={dayLoads}
  availability={availability}
  now={now}
  durationMinutes={50}
  buffers={{ before: 0, after: 10 }}
  value={slotId}
  onSelect={(choice) => hold(choice.slot.id)}
  viewerZone="America/New_York"
/>`,
    },

    /* ---------------------------------------------------------------- */
    /* Series                                                             */
    /* ---------------------------------------------------------------- */
    {
      id: "recurrence",
      group: "Series",
      title: "The rule in words, before anything exists",
      description:
        "“Every week on Tuesday at 2:00 PM, 16 times, ending 15 December”, with the first occurrences listed. A rule you cannot read before you commit is how a patient gets fifty-two appointments. The RRULE emitted is real RFC 5545 with its EXDATE.",
      code: `<RecurrenceField
  label="Repeats"
  startDate={plainDate(2026, 9, 1)}
  timeLabel="2:00 – 2:50 PM"
  defaultValue={{ freq: "WEEKLY", byWeekday: [2], count: 16 }}
  countOptions={[4, 6, 8, 12, 16, 24]}
  showRRule
/>`,
    },
    {
      id: "recurrence-refused",
      group: "Series",
      title: "Refusal, in full",
      description:
        "A rule outside the implemented subset is refused loudly, read-only, with the original string intact and the unsupported parts named — because a partial RRULE parser does not error, it expands to the wrong dates and gets booked.",
      code: `<RecurrenceField
  label="Repeats"
  startDate={plainDate(2026, 9, 1)}
  unsupported={{
    source: "FREQ=YEARLY;BYMONTH=3;BYDAY=2SU;BYHOUR=14",
    parts: ["FREQ=YEARLY", "BYMONTH", "BYHOUR"],
  }}
  showRRule
/>`,
    },
    {
      id: "series",
      group: "Series",
      title: "Collisions resolved before anything is written",
      description:
        "Sixteen weekly sessions, three colliding with things the host knows: leave, a closure, a room clash with no alternative. Each row offers the nearest working date, or says it has none. Nothing is written until every collision is resolved or accepted.",
      code: `<RecurringSeriesScheduler
  label="Weekly therapy — 16 sessions"
  rule={{ freq: "WEEKLY", interval: 1, count: 16 }}
  startDate={plainDate(2026, 9, 1)}
  timeLabel="2:00 – 2:50 PM"
  verdicts={conflicts}          // { date, reason, alternative? }[]
  resolved={resolved}
  onResolve={resolve}
  onUnresolve={unresolve}
  onResolveAll={resolveAll}
/>`,
    },
    {
      id: "series-arithmetic",
      group: "Series",
      title: "26 weeks, 3 closures, 23 sessions",
      description:
        "The arithmetic is the feature. A group scheduler that prints the naive count has told billing a number that will not match, and told nine patients about sessions that will not happen. Room, facilitators and enrolment are checked together, and the closures are listed with their reasons and written into the rule as EXDATE.",
      fixture: "encounterRoutine",
      code: `<GroupSeriesScheduler
  name="DBT Skills — Emotion Regulation"
  rule={{ freq: "WEEKLY", interval: 1, byWeekday: [2], count: 26 }}
  startDate={plainDate(2026, 9, 1)}
  timeLabel="5:30 – 7:00 PM"
  sessionMinutes={90}
  facilitators={["M. Reyes, LCSW", "J. Bhatt, LPC"]}
  room={{ name: "Group Room 2", capacity: 12 }}
  capacity={12}
  enrolled={9}
  exclusions={[
    { date: plainDate(2026, 11, 24), reason: "Thanksgiving week — programme closed" },
    { date: plainDate(2026, 12, 22), reason: "Winter break" },
    { date: plainDate(2026, 12, 29), reason: "Winter break" },
  ]}
  showRRule
/>`,
    },

    /* ---------------------------------------------------------------- */
    /* Rules it keeps                                                     */
    /* ---------------------------------------------------------------- */
    {
      id: "dst",
      group: "Rules it keeps",
      title: "Daylight saving, classified",
      description:
        "2:30 AM on 8 March in New York does not exist; 1:30 AM on 1 November happens twice; Lord Howe shifts by thirty minutes; Kathmandu is +5:45 — why every offset here is minutes. The component does not decide what to do about any of it; this is what a host decides with.",
      code: `import { classifyLocalTime, plainDate, plainTime } from "@/lib/zoblocks-datetime";

classifyLocalTime("America/New_York", plainDate(2026, 3, 8), plainTime(2, 30));
// → { kind: "nonexistent", skippedMinutes: 60 }
classifyLocalTime("America/New_York", plainDate(2026, 11, 1), plainTime(1, 30));
// → { kind: "ambiguous", earlierOffset: -240, laterOffset: -300 }`,
    },
    {
      id: "family",
      group: "Rules it keeps",
      title: "Density and direction, across the family",
      description:
        "The compact variants side by side. Clinical density tightens the ink and never the target: nothing interactive goes under 24px (WCAG 2.2 SC 2.5.8), segments included. `dir=“ltr”` stays pinned on the field, because inheriting RTL renders 26/08/2026 as 2026/08/26 — plausible, and wrong.",
      code: `<div data-zb-density="clinical" dir="rtl">
  <DatePicker variant="picker" label="Picker" now={today} />
  <DatePicker variant="field" label="Field" now={today} />
  <DatePicker variant="birth-date" now={today} />
  <DatePicker variant="time" label="Time" />
  <DatePicker variant="session" label="Session" />
  <DatePicker variant="readout" as="time" value={signedAt} now={today} showZone />
</div>`,
    },
    {
      id: "theme-density",
      group: "Rules it keeps",
      title: "Every theme against every density",
      description:
        "Light, dark and high contrast against patient, standard and clinical density — nine combinations at once, which is how a token bug is caught, and where the 24px floor at clinical density can be measured.",
      code: `{["light", "dark", "high-contrast"].map((theme) =>
  ["patient", "standard", "clinical"].map((density) => (
    <div key={theme + density} data-zb-theme={theme} data-zb-density={density}>
      <Calendar now={today} defaultValue={today} unavailable={clinicClosed} />
    </div>
  )),
)}`,
    },
  ],

  relationships: {
    builtWith: [],
    patterns: ["clinical-documentation", "intake"],
    alternatives: [],
  },

  seo: {
    slug: "date-picker",
    title: "Date Picker — accessible healthcare control",
    description:
      "A React date picker for healthcare: sixteen variants over one value space — fields, calendars, date and time ranges, birth dates, sessions and recurrence.",
    primaryKeyword: "react healthcare date picker",
    secondaryKeywords: [
      "accessible date picker react",
      "antd date picker alternative",
      "appointment scheduler react component",
      "session duration picker react",
      "date of birth input react",
    ],
    ogImage: "generated",
    searchIntent: "informational",
  },
});
