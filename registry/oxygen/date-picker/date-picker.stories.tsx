/**
 * Stories for DatePicker.
 *
 * Written once, consumed four ways (ADR 0007): as documentation, as the
 * visual-regression fixture, as the accessibility fixture, and — through play
 * functions — as the interaction test.
 *
 * `parameters.state` ties each story to a state declared in
 * date-picker.meta.ts, and the build asserts the two agree in both directions.
 * With sixteen variants that check is the spine of the component: the claim
 * is that all sixteen share one value space, one keyboard model and one
 * accessibility contract, and a variant with no fixture is a claim nobody can
 * check.
 *
 * Every date here is a literal. ENGINEERING.md §9 forbids the component
 * reading the wall clock, and the fixtures hold themselves to the same rule —
 * a story whose output depends on the day it ran is not a regression baseline.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import { buildSlots, type AvailabilitySet } from "@/lib/oxygen-availability";
import { dateRangePresets, plainDate, plainTime, sessionFrom } from "@/lib/oxygen-datetime";
import { DatePicker } from "./date-picker";

const TODAY = plainDate(2026, 8, 26);
const NOW = { date: TODAY, time: plainTime(10, 42) };

const SIGNED = {
  kind: "instant" as const,
  date: plainDate(2026, 8, 24),
  time: plainTime(8, 12),
  zone: "America/New_York",
};

const AVAILABILITY: AvailabilitySet = {
  asOf: { date: TODAY, time: plainTime(10, 39) },
  staleAfterSeconds: 120,
  slots: buildSlots({
    fromMinute: 8 * 60,
    toMinute: 12 * 60,
    everyMinutes: 30,
    durationMinutes: 50,
    idPrefix: "s",
    blocked: (start) => (start.h === 9 && start.mi === 0 ? "booked" : null),
  }),
  exhausted: false,
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
];

const meta: Meta<typeof DatePicker> = {
  title: "Clinical/Date Picker",
  component: DatePicker,
  args: { now: TODAY },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

/* ------------------------------------------------------------------ */
/* Recall — the user already knows the value                           */
/* ------------------------------------------------------------------ */

export const Picker: Story = {
  name: "Picker — the calendar most users never open",
  parameters: { state: "Picker — field with a calendar behind a button" },
  args: { variant: "picker", label: "Appointment date", defaultValue: plainDate(2026, 9, 2) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // One tab stop, three spinbuttons. Three tab stops in a date field is nine
    // in a range, and a form with six dates becomes fifty-four presses.
    expect(canvas.getAllByRole("spinbutton")).toHaveLength(3);
    // The calendar is behind a button and collapsed until asked for.
    const trigger = canvas.getByRole("button", { name: /calendar/i });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(canvas.queryByRole("dialog")).toBeNull();
  },
};

export const Field: Story = {
  name: "Field — eight keystrokes, no calendar",
  parameters: { state: "Field — no popover at all" },
  args: {
    variant: "field",
    label: "Date of service",
    showRelative: true,
    defaultValue: plainDate(2026, 8, 21),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getAllByRole("spinbutton")).toHaveLength(3);
    // No popover at all — that is the whole difference from `picker`.
    expect(canvas.queryByRole("button")).toBeNull();
    expect(canvasElement.textContent).toContain("5 days ago");
  },
};

export const BirthDate: Story = {
  name: "Birth date — the age is the proof-read",
  parameters: { state: "Birth date — age, partial dates, stated absence" },
  args: {
    variant: "birth-date",
    defaultValue: plainDate(1986, 7, 18),
    allowEstimated: true,
    allowAbsent: true,
  },
  play: async ({ canvasElement }) => {
    // A transposed year is invisible in 07/18/1968 and screaming in an age.
    // The number and its unit are separate elements so the number can carry
    // its own weight, which is why this reads the pair rather than the page.
    const age = canvasElement.querySelector(".ox-dt-age");
    expect(age?.querySelector(".ox-dt-age__value")?.textContent).toBe("40");
    expect(age?.querySelector(".ox-dt-age__unit")?.textContent).toBe("years old");
    // The stated absence and the imprecise year are offered, not hidden
    // behind a mode switch nobody finds.
    expect(canvasElement.textContent).toContain("Exact date unknown");
    expect(canvasElement.textContent).toContain("Not recorded");
  },
};

export const Time: Story = {
  name: "Time — the 9 it will not resolve",
  parameters: { state: "Time — and the ambiguity it refuses to resolve" },
  args: { variant: "time", label: "Discharge time" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Hour, minute and meridiem. The meridiem is a segment rather than an
    // assumption: resolving a bare 9 silently is how a 9 PM discharge becomes
    // a 9 AM one, with nothing on screen to suggest anybody guessed.
    const segments = canvas.getAllByRole("spinbutton");
    expect(segments.length).toBeGreaterThanOrEqual(2);
    expect(canvas.getByRole("spinbutton", { name: /AM or PM|meridiem/i })).toBeTruthy();
  },
};

export const Readout: Story = {
  name: "Read-only — the record a reviewer sees",
  parameters: { state: "Read-only — the record a reviewer sees" },
  args: { variant: "readout", value: SIGNED, showRelative: true, showZone: true, as: "time" },
  play: async ({ canvasElement }) => {
    // The absolute value first, the reading aid second, and the zone present:
    // "8:12 AM" on a countersignature is not a time until somebody says where.
    expect(canvasElement.textContent).toContain("8:12");
    expect(canvasElement.textContent).toMatch(/ET|New_York|Eastern/);
  },
};

/* ------------------------------------------------------------------ */
/* Choose a day                                                        */
/* ------------------------------------------------------------------ */

export const CalendarGridStory: Story = {
  name: "Calendar — one roving tabstop",
  parameters: { state: "Calendar — inline month grid" },
  args: {
    variant: "calendar",
    defaultMonth: { y: 2026, m: 9 },
    defaultValue: plainDate(2026, 9, 2),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("grid");
    expect(grid).toBeTruthy();
    // Exactly one cell is reachable by Tab. Forty-two focusable cells is the
    // most common accessibility failure in a date picker; zero is the same
    // bug from the other side, and happens whenever the displayed month
    // contains no focus date.
    const focusable = canvasElement.querySelectorAll('[role="gridcell"][tabindex="0"]');
    expect(focusable).toHaveLength(1);
    // Every cell is named as its whole date. A cell in a grid has no column
    // header in its accessible context, so a grid of bare numerals is
    // navigable and useless.
    for (const cell of canvas.getAllByRole("gridcell")) {
      expect(cell.getAttribute("aria-label") ?? "").toMatch(/\d{1,2}, \d{4}/);
    }
  },
};

export const Range: Story = {
  name: "Range — two clicks, never a drag",
  parameters: { state: "Range — two clicks, never a drag" },
  args: {
    variant: "range",
    defaultMonth: { y: 2026, m: 9 },
    range: { start: plainDate(2026, 9, 7), end: plainDate(2026, 9, 11) },
  },
  play: async ({ canvasElement }) => {
    const selected = canvasElement.querySelectorAll('[role="gridcell"][aria-selected="true"]');
    expect(selected.length).toBeGreaterThanOrEqual(2);
  },
};

export const DateRange: Story = {
  name: "Date range — two months, named periods, an explicit commit",
  parameters: {
    state: "Date range — both ends typed, two months behind them, named periods down the side",
  },
  args: {
    variant: "date-range",
    label: "Authorisation window",
    now: TODAY,
    weekStart: 1,
    showSpan: true,
    hints: true,
    showCustomPreset: true,
    presets: dateRangePresets(TODAY, { weekStart: 1 }),
    defaultValue: { start: plainDate(2026, 8, 24), end: plainDate(2026, 9, 11) },
  },
  play: async ({ canvasElement }) => {
    // Two tab stops, because the single-tab-stop rule is per field and a range
    // is two fields. Six segments to reach the end date is past the point
    // where a reader can tell which half they are in.
    const halves = canvasElement.querySelectorAll('.ox-dt-field[tabindex="0"]');
    expect(halves).toHaveLength(2);

    // Inclusive of both ends: 24 August to 11 September is nineteen days of
    // authorisation, not eighteen.
    expect(canvasElement.textContent).toContain("19 days");

    const trigger = within(canvasElement).getByRole("button", { name: "Choose from calendar" });
    await userEvent.click(trigger);
    const panel = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(panel).toBeTruthy();
    // Two contiguous months, one previous control and one next for the pair.
    expect(panel.querySelectorAll('[role="grid"]')).toHaveLength(2);
    expect(within(panel).getAllByRole("button", { name: /previous/i })).toHaveLength(1);
  },
};

export const Multiple: Story = {
  name: "Multiple — capped, click again to remove",
  parameters: { state: "Multiple dates — capped, click again to remove" },
  args: {
    variant: "multiple",
    defaultMonth: { y: 2026, m: 9 },
    maxDates: 4,
    dates: [plainDate(2026, 9, 3), plainDate(2026, 9, 10), plainDate(2026, 9, 17)],
  },
  play: async ({ canvasElement }) => {
    const selected = canvasElement.querySelectorAll('[role="gridcell"][aria-selected="true"]');
    expect(selected).toHaveLength(3);
  },
};

/* ------------------------------------------------------------------ */
/* Construct — a structure with derived members                        */
/* ------------------------------------------------------------------ */

export const Session: Story = {
  name: "Session — which number is the one you set",
  parameters: { state: "Session — start, end, duration, visible driver" },
  args: {
    variant: "session",
    label: "Individual therapy",
    defaultValue: sessionFrom(plainTime(9, 0), 53),
  },
  play: async ({ canvasElement }) => {
    // Three values, two degrees of freedom, and which member is derived is
    // rendered rather than inferred. The badge is never colour alone.
    expect(canvasElement.textContent).toContain("Held");
    expect(canvasElement.textContent).toContain("Derived");
  },
};

export const TimeRange: Story = {
  name: "Time range — two columns, and an end that is filtered",
  parameters: { state: "Time range — two columns, a filtered end, a derived length" },
  args: {
    variant: "time-range",
    label: "Time range",
    stepMinutes: 60,
    minDurationMinutes: 30,
    defaultValue: { start: plainTime(7, 0), end: plainTime(10, 0) },
  },
  play: async ({ canvasElement }) => {
    // The derived length is the reader's proof-read: a start typed as PM when
    // they meant AM is invisible in 7:00 to 10:00 and unmissable as a length.
    expect(canvasElement.textContent).toContain("3h");

    const trigger = within(canvasElement).getByRole("button", {
      name: "Choose from a list of times",
    });
    await userEvent.click(trigger);
    const panel = document.querySelector('[role="dialog"]') as HTMLElement;
    const lists = within(panel).getAllByRole("listbox");
    expect(lists).toHaveLength(2);

    // Offering a time that will be rejected on commit is how a booking form
    // teaches people to distrust it.
    const [, ends] = lists;
    const blocked = within(ends as HTMLElement)
      .getAllByRole("option")
      .filter((option) => option.getAttribute("aria-disabled") === "true");
    expect(blocked.length).toBeGreaterThan(0);
    const [first] = blocked;
    expect(first?.getAttribute("aria-label")).toContain("before the start time");
  },
};

/* ------------------------------------------------------------------ */
/* Choose a time — the system knows the options                        */
/* ------------------------------------------------------------------ */

export const Slots: Story = {
  name: "Slots — grouped, counted, four states",
  parameters: { state: "Slots — grouped, counted, four states" },
  args: { variant: "slots", set: AVAILABILITY, now: NOW, label: "Available times" },
  play: async ({ canvasElement }) => {
    // A blocked slot says why rather than greying out, and the reason is in
    // the accessible name where a screen-reader user will actually meet it.
    const blocked = canvasElement.querySelector('[data-ox-slot="blocked"]');
    expect(blocked?.getAttribute("aria-label") ?? "").toMatch(/booked/i);
    // Availability carries its age on screen. A grid that looks live and is
    // four minutes stale is how two receptionists book the same slot.
    expect(canvasElement.textContent).toMatch(/Availability is 3 minutes old/i);
  },
};

export const Scheduler: Story = {
  name: "Scheduler — provider, date and time on one surface",
  parameters: { state: "Scheduler — provider, date and time on one surface" },
  args: {
    variant: "scheduler",
    providers: PROVIDERS,
    availability: AVAILABILITY,
    now: NOW,
    durationMinutes: 50,
    label: "Book an appointment",
    viewerZone: "America/Chicago",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvasElement.textContent).toContain("Dr Ama Osei");
    // Nothing is asserted until a time is chosen, and what is asserted then
    // says it is not a booking. A scheduler that looks committed and is not
    // is how double-bookings reach a diary.
    expect(canvasElement.textContent).toContain("Choose a time");

    await userEvent.click(canvas.getByRole("button", { name: /8:30 AM/ }));

    const summary = canvasElement.querySelector('.ox-dt-summary[role="status"]');
    expect(summary?.textContent).toContain("Not booked yet");
    // The zone rides on the summary only where it differs from the reader's:
    // Osei is in Eastern Time and is labelled for a viewer in Chicago.
    // Labelling it for a reader already in that zone teaches people to stop
    // reading zone labels.
    expect(summary?.textContent).toContain("ET");
  },
};

/* ------------------------------------------------------------------ */
/* A rule rather than a date                                           */
/* ------------------------------------------------------------------ */

export const Recurrence: Story = {
  name: "Recurrence — the rule in words",
  parameters: { state: "Recurrence — the rule in words" },
  args: {
    variant: "recurrence",
    startDate: plainDate(2026, 9, 1),
    timeLabel: "2:00 – 2:50 PM",
    defaultValue: { freq: "WEEKLY", interval: 1, count: 16 },
    showRRule: true,
  },
  play: async ({ canvasElement }) => {
    // Readable before it is committed, and emitted as real RFC 5545 so the
    // series round-trips through a scheduling system rather than living here.
    expect(canvasElement.textContent).toMatch(/every week/i);
    expect(canvasElement.textContent).toContain("FREQ=WEEKLY");
  },
};

export const Series: Story = {
  name: "Series — conflicts resolved before anything is written",
  parameters: { state: "Series — conflicts resolved before anything is written" },
  args: {
    variant: "series",
    rule: { freq: "WEEKLY", interval: 1, count: 8 },
    startDate: plainDate(2026, 9, 1),
    timeLabel: "2:00 – 2:50 PM",
    verdicts: [
      {
        date: "2026-09-08",
        reason: "Dr Osei on leave",
        alternative: { date: plainDate(2026, 9, 10), label: "Thu 10 Sep" },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const flagged = canvasElement.querySelector('[data-ox-occurrence="conflict"]');
    expect(flagged).toBeTruthy();
    expect(canvasElement.textContent).toContain("Dr Osei on leave");
  },
};

export const Group: Story = {
  name: "Group — the room, the roster and the real count",
  parameters: { state: "Group — the room, the roster and the real count" },
  args: {
    variant: "group",
    name: "DBT Skills — Emotion Regulation",
    rule: { freq: "WEEKLY", interval: 1, count: 26 },
    startDate: plainDate(2026, 9, 1),
    timeLabel: "5:30 – 7:00 PM",
    sessionMinutes: 90,
    room: { name: "Group Room 2", capacity: 12 },
    capacity: 12,
    enrolled: 9,
    exclusions: [
      { date: plainDate(2026, 11, 24), reason: "Thanksgiving week — programme closed" },
      { date: plainDate(2026, 12, 22), reason: "Winter break" },
      { date: plainDate(2026, 12, 29), reason: "Winter break" },
    ],
  },
  play: async ({ canvasElement }) => {
    // 26 occurrences minus three programme closures is 23 sessions, and the
    // header has to say the number a treatment plan gets written against.
    const rows = Array.from(canvasElement.querySelectorAll(".ox-dt-tally > div"));
    const read = (term: string) =>
      rows.find((row) => row.querySelector("dt")?.textContent === term)?.querySelector("dd")
        ?.textContent;
    expect(read("dates in range")).toBe("26");
    expect(read("closures")).toBe("3");
    expect(read("sessions")).toBe("23");
    // The closure count is the one flagged, because it is the difference
    // between the rule and what will actually run.
    expect(canvasElement.querySelector('[data-ox-tally="conflicts"]')?.textContent).toBe("3");
  },
};
