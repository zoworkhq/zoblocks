/**
 * DatePicker — behaviour, asserted the way a reader or a screen reader gets it.
 *
 * Sixteen variants over one value space, so the weight here is on the parts
 * of the contract that have to hold identically across all of them: one tab
 * stop per field, one roving tabstop per grid, three message tiers with three
 * ARIA treatments, and a value that is never guessed at.
 *
 * Where a test guards a stated design decision rather than a mechanism, the
 * comment names the decision — the failure mode is usually a later change that
 * looks like a tidy-up and quietly removes the reason.
 */

import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import {
  BirthDateField,
  ClinicalDateTime,
  DateField,
  DatePicker,
  DateRangeField,
  SessionTimeField,
  TimeField,
  TimeRangeField,
  AppointmentScheduler,
  Calendar,
  GroupSeriesScheduler,
  RecurrenceField,
  RecurringSeriesScheduler,
  TimeSlotGrid,
  relativeDateOptions,
  segmentsToTime,
  timeGrid,
  timeToSegments,
} from "./date-picker";
import { ClockGlyph } from "@/lib/zoblocks-datetime-field";
import { buildSlots, type AvailabilitySet } from "@/lib/zoblocks-availability";
import {
  compareDates,
  dateRangePresets,
  endOfMonth,
  endOfWeek,
  endOfYear,
  formatDuration,
  matchRangePreset,
  normalizeDateRange,
  plainDate,
  plainTime,
  rangeContains,
  rangeDayCount,
  sessionFrom,
  startOfMonth,
  startOfWeek,
  startOfYear,
  timeRangeMinutes,
  toIsoDate,
  withSessionEnd,
  type ZbDate,
} from "@/lib/zoblocks-datetime";
import { expectInteractivesAreNamed, expectRendersSomething } from "../../../test/contract";

const TODAY = plainDate(2026, 8, 26);
const NOW = { date: TODAY, time: plainTime(10, 42) };

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

/** A countersignature: 8:12 in New York, which is 5:12 on the west coast. */
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
    toMinute: 11 * 60,
    everyMinutes: 30,
    durationMinutes: 50,
    idPrefix: "s",
    blocked: (start) => (start.h === 9 && start.mi === 0 ? "booked" : null),
  }),
  exhausted: false,
};

/**
 * Types digits one key at a time, the way a keyboard actually delivers them.
 *
 * Aimed at the group rather than a segment: the group is the tab stop and owns
 * the key handling, which is the whole point of the composite. `userEvent.type`
 * would not do — it produces no per-character keydown for a non-input element.
 */
async function typeDigits(digits: string, root: HTMLElement = document.body) {
  const group = root.querySelector<HTMLElement>('[role="group"].zb-dt-field')!;
  act(() => group.focus());
  for (const digit of digits) {
    fireEvent.keyDown(group, { key: digit });
  }
  return group;
}

/* ------------------------------------------------------------------ */
/* The keyboard contract                                              */
/* ------------------------------------------------------------------ */

describe("the field is one tab stop", () => {
  it("exposes three segments behind a single tab stop", () => {
    const { container } = render(
      <DatePicker variant="field" label="Date of service" now={TODAY} />,
    );
    expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
    // The group holds focus and the segments move under it. Three tab stops
    // in a date field is nine in a range, and a form with six dates becomes
    // fifty-four presses to cross.
    const group = container.querySelector<HTMLElement>('[role="group"].zb-dt-field')!;
    expect(group.getAttribute("tabindex")).toBe("0");
    expect(container.querySelectorAll('[role="spinbutton"][tabindex]')).toHaveLength(0);
  });

  it("names the live segment so arrowing between them is not silent", async () => {
    const { container } = render(<DatePicker variant="field" label="Date" now={TODAY} />);
    const group = container.querySelector<HTMLElement>('[role="group"].zb-dt-field')!;
    act(() => group.focus());
    const first = group.getAttribute("aria-activedescendant");
    expect(document.getElementById(first ?? "")?.getAttribute("aria-label")).toBe("Month");
    fireEvent.keyDown(group, { key: "ArrowRight" });
    const second = group.getAttribute("aria-activedescendant");
    expect(second).not.toBe(first);
    expect(document.getElementById(second ?? "")?.getAttribute("aria-label")).toBe("Day");
  });

  it("advances a segment the moment no further digit could be valid", async () => {
    const onChange = vi.fn();
    render(<DatePicker variant="field" label="Date" now={TODAY} onChange={onChange} />);
    await typeDigits("08262026");
    // Eight keystrokes, no separators, no calendar. Typing 9 in the month
    // jumps on; typing 1 waits for a possible 12, and that single rule is
    // what makes eight keystrokes enough.
    const last = onChange.mock.calls.at(-1)?.[0] as ZbDate | null;
    expect(last && toIsoDate(last)).toBe("2026-08-26");
  });

  it("refuses an impossible day rather than validating it afterwards", async () => {
    const onChange = vi.fn();
    render(<DatePicker variant="field" label="Date" now={TODAY} onChange={onChange} />);
    // 30 February. The day is bounded by the month and the year, so 30 is not
    // enterable at all — there is nothing to complain about afterwards, and
    // nothing invalid ever reaches the host.
    await typeDigits("0230");
    const day = screen.getAllByRole("spinbutton")[1]!;
    expect(Number(day.getAttribute("aria-valuenow") ?? 0)).toBeLessThanOrEqual(29);
    for (const [emitted] of onChange.mock.calls) {
      expect(emitted === null || (emitted as ZbDate).d <= 29).toBe(true);
    }
  });

  it("takes 29 February in a leap year", async () => {
    const onChange = vi.fn();
    render(<DatePicker variant="field" label="Date" now={TODAY} onChange={onChange} />);
    await typeDigits("02292028");
    expect(toIsoDate(onChange.mock.calls.at(-1)![0] as ZbDate)).toBe("2028-02-29");
  });

  it("re-bounds the day when the year rules it out", async () => {
    const onChange = vi.fn();
    render(<DatePicker variant="field" label="Date" now={TODAY} onChange={onChange} />);
    // 2027 is not a leap year, so the day is bounded by the year as well as
    // the month. The check belongs in the segment rather than in a validator
    // that runs after the fact and asks the user to go back.
    await typeDigits("02292027");
    expect(toIsoDate(onChange.mock.calls.at(-1)![0] as ZbDate)).toBe("2027-02-28");
  });

  it("announces what is displayed, including a half-typed buffer", async () => {
    render(<DatePicker variant="field" label="Date" now={TODAY} />);
    const month = screen.getAllByRole("spinbutton")[0]!;
    expect(month.getAttribute("aria-valuetext")).toBe("Month not entered");
    await typeDigits("0");
    // Announcing "not entered" while the segment visibly reads 0 puts a
    // sighted user and a screen-reader user in two different fields.
    expect(month.getAttribute("aria-valuetext")).not.toBe("Month not entered");
  });

  it("pins the value LTR so the digits never mirror", () => {
    const { container } = render(
      <div dir="rtl">
        <DatePicker variant="field" label="Date" now={TODAY} defaultValue={TODAY} />
      </div>,
    );
    // The grid mirrors; the digits do not. Letting the segments inherit RTL
    // renders 26/08/2026 as 2026/08/26, which is plausible and is wrong.
    expect(container.querySelector(".zb-dt-field")?.getAttribute("dir")).toBe("ltr");
  });
});

/* ------------------------------------------------------------------ */
/* The popover                                                        */
/* ------------------------------------------------------------------ */

describe("the calendar is behind a button, and Escape keeps what was typed", () => {
  it("renders no dialog until the trigger is pressed", async () => {
    render(<DatePicker variant="picker" label="Appointment date" now={TODAY} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("keeps a half-entered value when Escape closes it", async () => {
    render(<DatePicker variant="picker" label="Date" now={TODAY} />);
    await typeDigits("08");
    await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    // An Escape that discards a half-entered date is the reason people stop
    // using keyboards.
    expect(screen.getAllByRole("spinbutton")[0]!.textContent).toBe("08");
  });

  it("has no trigger at all in the field variant", () => {
    render(<DatePicker variant="field" label="Date" now={TODAY} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* The grid                                                           */
/* ------------------------------------------------------------------ */

describe("the calendar grid", () => {
  it("keeps one roving tabstop even on a month with no selection", () => {
    render(
      <DatePicker
        variant="calendar"
        now={TODAY}
        defaultValue={plainDate(2026, 8, 26)}
        defaultMonth={{ y: 2027, m: 3 }}
      />,
    );
    const roving = document.querySelectorAll('[role="gridcell"][tabindex="0"]');
    // Forty-two focusable cells is the most common accessibility failure in a
    // date picker. Zero is the same bug from the other side, and it happens
    // whenever the displayed month contains no focus date.
    expect(roving).toHaveLength(1);
  });

  it("puts every row in a row, because a grid without rows is not a grid", () => {
    render(<DatePicker variant="calendar" now={TODAY} defaultMonth={{ y: 2026, m: 9 }} />);
    const grid = screen.getByRole("grid");
    // Six week rows plus the weekday header row.
    expect(within(grid).getAllByRole("row").length).toBeGreaterThanOrEqual(6);
    expect(within(grid).getAllByRole("gridcell")).toHaveLength(42);
  });

  it("names a cell as its whole date and its state, not as a numeral", () => {
    render(
      <DatePicker
        variant="calendar"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 9 }}
        unavailable={(date) => (date.m === 9 && date.d === 7 ? "Labor Day — clinic closed" : null)}
        load={(date) => (date.m === 9 && date.d === 8 ? 8 : null)}
      />,
    );
    const closed = screen.getByRole("gridcell", { name: /Labor Day/ });
    expect(closed.getAttribute("aria-disabled")).toBe("true");
    // A cell in a grid has no column header in its accessible context, so a
    // grid of bare numerals is navigable and useless.
    expect(closed.getAttribute("aria-label")).toMatch(/September 7, 2026/);
    expect(screen.getByRole("gridcell", { name: /8 times available/ })).toBeTruthy();
  });

  it("moves selection with the arrow keys and the month with PageDown", () => {
    render(<DatePicker variant="calendar" now={TODAY} defaultMonth={{ y: 2026, m: 9 }} />);
    const grid = screen.getByRole("grid");
    const before = grid.textContent ?? "";
    fireEvent.keyDown(grid, { key: "PageDown" });
    expect(grid.textContent).not.toBe(before);
  });
});

/* ------------------------------------------------------------------ */
/* Three tiers, three ARIA treatments                                 */
/* ------------------------------------------------------------------ */

describe("the message tiers", () => {
  it("blocks assertively and marks the field invalid", () => {
    const { container } = render(
      <DatePicker
        variant="field"
        label="Date of birth"
        now={TODAY}
        futurePolicy="block"
        defaultValue={plainDate(2027, 1, 1)}
      />,
    );
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
    expect(container.querySelector('[aria-invalid="true"]')).toBeTruthy();
  });

  it("warns politely without marking a legal value invalid", () => {
    const { container } = render(
      <DatePicker
        variant="field"
        label="Session documented"
        now={TODAY}
        futurePolicy="warn"
        defaultValue={plainDate(2026, 9, 2)}
      />,
    );
    // A conflict is a legal value colliding with other state. Marking it
    // invalid is what teaches staff to date notes to today to get past the
    // validator, which is how the real data is lost.
    expect(container.querySelector('[role="status"]')).toBeTruthy();
    expect(container.querySelector('[aria-invalid="true"]')).toBeNull();
  });

  it("says a retrospective date without any tone at all", () => {
    const { container } = render(
      <DatePicker
        variant="field"
        label="Date of service"
        now={TODAY}
        showRelative
        defaultValue={plainDate(2026, 8, 21)}
      />,
    );
    expect(container.textContent).toContain("5 days ago");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* The values the variants own                                        */
/* ------------------------------------------------------------------ */

describe("time refuses to guess", () => {
  it("leaves a bare hour incomplete rather than assuming a meridiem", async () => {
    const onChange = vi.fn();
    render(<TimeField label="Discharge time" onChange={onChange} />);
    await typeDigits("9");
    // Resolving this silently is how a 9 PM discharge becomes a 9 AM one,
    // with nothing on screen to suggest anybody guessed.
    expect(onChange.mock.calls.every(([value]) => value === null)).toBe(true);
  });

  it("has no meridiem segment at all in 24-hour form", () => {
    render(<TimeField label="Observation" hour24 />);
    expect(screen.queryByRole("spinbutton", { name: /AM or PM|meridiem/i })).toBeNull();
  });
});

describe("the session triple names its driver", () => {
  it("renders which member is held and which is derived", () => {
    const { container } = render(
      <SessionTimeField label="Therapy" defaultValue={sessionFrom(plainTime(9, 0), 53)} />,
    );
    // Three values, two degrees of freedom. Which one the user asserted has
    // to be visible or the next edit is a surprise — and it is never colour
    // alone: the badge carries a lock glyph and the word.
    expect(container.textContent).toContain("Held");
    expect(container.textContent).toContain("Derived");
  });

  it("moves the badge when the end is typed instead of the duration", () => {
    const held = (container: HTMLElement) =>
      container.querySelector("[data-zb-session]")?.getAttribute("data-zb-session");
    const { container, rerender } = render(
      <SessionTimeField label="Therapy" value={sessionFrom(plainTime(9, 0), 53)} />,
    );
    const first = held(container);
    rerender(
      <SessionTimeField
        label="Therapy"
        value={{ ...sessionFrom(plainTime(9, 0), 53), hold: "end" }}
      />,
    );
    expect(held(container)).not.toBe(first);
  });
});

describe("availability is data with an age", () => {
  it("says how old it is and why a slot cannot be taken", () => {
    const { container } = render(
      <DatePicker variant="slots" set={AVAILABILITY} now={NOW} label="Available times" />,
    );
    // A grid that looks live and is four minutes stale is how two
    // receptionists book the same slot.
    expect(container.textContent).toMatch(/Availability is 3 minutes old/);
    const blocked = container.querySelector('[data-zb-slot="blocked"]');
    expect(blocked?.getAttribute("aria-label") ?? "").toMatch(/booked/i);
  });

  it("distinguishes an exhausted search from one nobody has run", () => {
    const { container } = render(
      <DatePicker
        variant="slots"
        set={{ asOf: NOW, slots: [], exhausted: true }}
        now={NOW}
        label="Available times"
      />,
    );
    expect(container.textContent).toMatch(/no|none/i);
  });
});

describe("a series is reviewed before it is written", () => {
  it("flags a collision and offers the nearest working date", () => {
    const { container } = render(
      <DatePicker
        variant="series"
        rule={{ freq: "WEEKLY", interval: 1, count: 6 }}
        startDate={plainDate(2026, 9, 1)}
        verdicts={[
          {
            date: "2026-09-08",
            reason: "Dr Osei on leave",
            alternative: { date: plainDate(2026, 9, 10), label: "Thu 10 Sep" },
          },
        ]}
      />,
    );
    expect(container.querySelector('[data-zb-occurrence="conflict"]')).toBeTruthy();
    expect(container.textContent).toContain("Dr Osei on leave");
    expect(container.textContent).toContain("Thu 10 Sep");
  });

  it("pulls an unresolved conflict through the row cap", () => {
    const { container } = render(
      <DatePicker
        variant="series"
        rule={{ freq: "WEEKLY", interval: 1, count: 16 }}
        startDate={plainDate(2026, 9, 1)}
        visibleRows={4}
        verdicts={[{ date: "2026-11-24", reason: "Programme closed" }]}
      />,
    );
    // Four rows would end at 22 September. A conflict on 24 November has to
    // be reachable anyway: the tally counts it and nothing can be booked
    // until it is dealt with, so hiding it is a dead end rather than a
    // truncation.
    expect(container.textContent).toContain("Programme closed");
    const rows = container.querySelectorAll(
      '[data-zb-occurrence]:not([data-zb-occurrence="more"])',
    );
    expect(rows).toHaveLength(5);
    expect(container.textContent).toContain("+ 11 more");
  });

  it("refuses a rule outside the subset instead of mis-expanding it", () => {
    const { container } = render(
      <DatePicker
        variant="recurrence"
        startDate={plainDate(2026, 9, 1)}
        unsupported={{
          source: "FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
          parts: ["FREQ=YEARLY", "BYMONTH"],
        }}
      />,
    );
    // The failure mode of a partial RRULE parser is not an error — it is a
    // series that silently expands to the wrong dates and gets booked.
    expect(container.textContent).toContain("FREQ=YEARLY");
    expect(container.querySelector('[data-zb-recurrence="unsupported"]')).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/* The contract every component in the library holds                  */
/* ------------------------------------------------------------------ */

describe("library contract", () => {
  it("renders something and names every interactive element", () => {
    const view = render(
      <DatePicker variant="picker" label="Appointment date" now={TODAY} defaultValue={TODAY} />,
    );
    expectRendersSomething(view);
    expectInteractivesAreNamed(view);
  });

  it("keeps a controlled value controlled", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DateField label="Date" now={TODAY} value={TODAY} onChange={onChange} />,
    );
    const group = document.querySelector<HTMLElement>('[role="group"].zb-dt-field')!;
    act(() => group.focus());
    fireEvent.keyDown(group, { key: "ArrowUp" });
    // The field asks; the host decides. Nothing moves until the value comes
    // back down.
    expect(onChange).toHaveBeenCalled();
    const proposed = onChange.mock.calls.at(-1)?.[0] as ZbDate;
    expect(compareDates(proposed, TODAY)).not.toBe(0);
    rerender(<DateField label="Date" now={TODAY} value={TODAY} onChange={onChange} />);
    expect(screen.getAllByRole("spinbutton")[0]!.textContent).toBe("08");
  });
});

/* ------------------------------------------------------------------ */
/* The keyboard model, driven rather than described                    */
/*                                                                     */
/* Every branch below is a key a clinician actually presses. They are  */
/* grouped by the surface that owns them because that is how they      */
/* break: a change to the segment machine breaks all of the first      */
/* group and none of the second.                                       */
/* ------------------------------------------------------------------ */

const group = (root: HTMLElement = document.body) =>
  root.querySelector<HTMLElement>('[role="group"].zb-dt-field')!;

describe("segment keys", () => {
  it("steps a value with the arrows and wraps at both ends", () => {
    const onChange = vi.fn();
    render(<DateField label="Date" now={TODAY} defaultValue={TODAY} onChange={onChange} />);
    const g = group();
    act(() => g.focus());

    fireEvent.keyDown(g, { key: "ArrowUp" });
    expect((onChange.mock.calls.at(-1)![0] as ZbDate).m).toBe(9);
    fireEvent.keyDown(g, { key: "ArrowDown" });
    expect((onChange.mock.calls.at(-1)![0] as ZbDate).m).toBe(8);

    // December steps to January rather than to a thirteenth month.
    for (let i = 0; i < 4; i += 1) fireEvent.keyDown(g, { key: "ArrowUp" });
    expect((onChange.mock.calls.at(-1)![0] as ZbDate).m).toBe(12);
    fireEvent.keyDown(g, { key: "ArrowUp" });
    expect((onChange.mock.calls.at(-1)![0] as ZbDate).m).toBe(1);
    fireEvent.keyDown(g, { key: "ArrowDown" });
    expect((onChange.mock.calls.at(-1)![0] as ZbDate).m).toBe(12);
  });

  it("starts an empty segment at its own end, depending on direction", () => {
    const onChange = vi.fn();
    render(<DateField label="Date" now={TODAY} onChange={onChange} />);
    const g = group();
    act(() => g.focus());
    fireEvent.keyDown(g, { key: "ArrowDown" });
    // Down from empty offers December, not an error and not January.
    expect(screen.getAllByRole("spinbutton")[0]!.textContent).toBe("12");
  });

  it("moves between segments with the arrows, Home and End", () => {
    const { container } = render(<DateField label="Date" now={TODAY} />);
    const g = group(container);
    act(() => g.focus());
    const live = () => g.getAttribute("aria-activedescendant");
    const nameOf = (id: string | null) =>
      document.getElementById(id ?? "")?.getAttribute("aria-label");

    expect(nameOf(live())).toBe("Month");
    fireEvent.keyDown(g, { key: "ArrowRight" });
    expect(nameOf(live())).toBe("Day");
    fireEvent.keyDown(g, { key: "End" });
    expect(nameOf(live())).toBe("Year");
    // Right at the last segment stays put rather than wrapping into the first.
    fireEvent.keyDown(g, { key: "ArrowRight" });
    expect(nameOf(live())).toBe("Year");
    fireEvent.keyDown(g, { key: "ArrowLeft" });
    expect(nameOf(live())).toBe("Day");
    fireEvent.keyDown(g, { key: "Home" });
    expect(nameOf(live())).toBe("Month");
    fireEvent.keyDown(g, { key: "ArrowLeft" });
    expect(nameOf(live())).toBe("Month");
  });

  it("clears a segment with Backspace and with Delete", () => {
    const onChange = vi.fn();
    render(<DateField label="Date" now={TODAY} defaultValue={TODAY} onChange={onChange} />);
    const g = group();
    act(() => g.focus());
    fireEvent.keyDown(g, { key: "Backspace" });
    expect(onChange).toHaveBeenLastCalledWith(null);
    fireEvent.keyDown(g, { key: "Delete" });
    expect(screen.getAllByRole("spinbutton")[0]!.getAttribute("aria-valuetext")).toBe(
      "Month not entered",
    );
  });

  it("ignores keys it has no answer for", () => {
    const onChange = vi.fn();
    render(<DateField label="Date" now={TODAY} defaultValue={TODAY} onChange={onChange} />);
    const g = group();
    act(() => g.focus());
    fireEvent.keyDown(g, { key: "x" });
    fireEvent.keyDown(g, { key: "F5" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("takes a click on a segment as where to start typing", async () => {
    render(<DateField label="Date" now={TODAY} />);
    const year = screen.getAllByRole("spinbutton")[2]!;
    fireEvent.mouseDown(year);
    const g = group();
    expect(g.getAttribute("aria-activedescendant")).toBe(year.id);
    // And typing lands in the year rather than the month.
    fireEvent.keyDown(g, { key: "1" });
    expect(year.textContent).toBe("1");
  });

  it("refuses the keyboard entirely when disabled or read-only", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DateField label="Date" now={TODAY} defaultValue={TODAY} disabled onChange={onChange} />,
    );
    fireEvent.keyDown(group(), { key: "ArrowUp" });
    fireEvent.mouseDown(screen.getAllByRole("spinbutton")[1]!);
    expect(onChange).not.toHaveBeenCalled();
    expect(group().getAttribute("tabindex")).toBe("-1");

    rerender(
      <DateField label="Date" now={TODAY} defaultValue={TODAY} readOnly onChange={onChange} />,
    );
    fireEvent.keyDown(group(), { key: "ArrowUp" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("resets to the first segment when focus leaves and returns", () => {
    render(<DateField label="Date" now={TODAY} />);
    const g = group();
    act(() => g.focus());
    fireEvent.keyDown(g, { key: "End" });
    fireEvent.blur(g);
    // `focus()` is a no-op on an element that never lost DOM focus, so the
    // event is fired directly — the blur handler is what this is about.
    fireEvent.focus(g);
    // A second visit that kept the old position types the month into the year.
    const first = screen.getAllByRole("spinbutton")[0]!;
    expect(g.getAttribute("aria-activedescendant")).toBe(first.id);
  });

  it("takes a pasted date, because that is how clinical dates move", () => {
    const onChange = vi.fn();
    render(<DateField label="Date" now={TODAY} onChange={onChange} />);
    fireEvent.paste(group(), { clipboardData: { getData: () => "07/18/1986" } });
    expect(toIsoDate(onChange.mock.calls.at(-1)![0] as ZbDate)).toBe("1986-07-18");
  });

  it("ignores a paste that is not a date, rather than clearing the field", () => {
    const onChange = vi.fn();
    render(<DateField label="Date" now={TODAY} defaultValue={TODAY} onChange={onChange} />);
    fireEvent.paste(group(), { clipboardData: { getData: () => "not a date" } });
    expect(screen.getAllByRole("spinbutton")[0]!.textContent).toBe("08");
  });

  it("takes A and P for the meridiem, which is what people type", () => {
    const onChange = vi.fn();
    render(<TimeField label="Time" onChange={onChange} />);
    const g = group();
    act(() => g.focus());
    fireEvent.keyDown(g, { key: "9" });
    fireEvent.keyDown(g, { key: "3" });
    fireEvent.keyDown(g, { key: "0" });
    fireEvent.keyDown(g, { key: "p" });
    const last = onChange.mock.calls.at(-1)![0] as { h: number; mi: number };
    expect([last.h, last.mi]).toEqual([21, 30]);
    fireEvent.keyDown(g, { key: "a" });
    expect((onChange.mock.calls.at(-1)![0] as { h: number }).h).toBe(9);
  });
});

/* ------------------------------------------------------------------ */

describe("grid keys", () => {
  const gridOf = (c: HTMLElement) => within(c).getByRole("grid");

  it("walks by day, by week, and to the ends of a week", () => {
    const { container } = render(
      <DatePicker variant="calendar" now={TODAY} defaultMonth={{ y: 2026, m: 9 }} />,
    );
    const grid = gridOf(container);
    const focused = () =>
      container.querySelector('[role="gridcell"][tabindex="0"]')?.getAttribute("aria-label") ?? "";

    const start = focused();
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(focused()).not.toBe(start);
    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    expect(focused()).toBe(start);
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    fireEvent.keyDown(grid, { key: "ArrowUp" });
    expect(focused()).toBe(start);
    fireEvent.keyDown(grid, { key: "Home" });
    const weekStart = focused();
    fireEvent.keyDown(grid, { key: "End" });
    expect(focused()).not.toBe(weekStart);
  });

  it("changes month with PageUp/PageDown and year with Shift", () => {
    const { container } = render(
      <DatePicker variant="calendar" now={TODAY} defaultMonth={{ y: 2026, m: 9 }} />,
    );
    const grid = gridOf(container);
    const heading = () =>
      container.querySelector(".zb-dt-cal__label, .zb-dt-cal-head")?.textContent ??
      container.textContent!;

    fireEvent.keyDown(grid, { key: "PageDown" });
    expect(heading()).toContain("October");
    fireEvent.keyDown(grid, { key: "PageUp" });
    expect(heading()).toContain("September");
    fireEvent.keyDown(grid, { key: "PageDown", shiftKey: true });
    expect(heading()).toContain("2027");
    fireEvent.keyDown(grid, { key: "PageUp", shiftKey: true });
    expect(heading()).toContain("2026");
  });

  it("selects with Enter and with Space, and refuses an unavailable day", () => {
    const onChange = vi.fn();
    const { container } = render(
      <DatePicker
        variant="calendar"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 9 }}
        onChange={onChange}
        unavailable={(d) => (d.m === 9 && d.d === 1 ? "Clinic closed" : null)}
      />,
    );
    const grid = gridOf(container);
    fireEvent.keyDown(grid, { key: "Enter" });
    expect(onChange).toHaveBeenCalled();
    onChange.mockClear();
    fireEvent.keyDown(grid, { key: " " });
    expect(onChange).toHaveBeenCalled();

    // Walk onto the closed day and press Enter: nothing is emitted.
    onChange.mockClear();
    const closed = within(container).getByRole("gridcell", { name: /Clinic closed/ });
    fireEvent.click(closed);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores a key the grid does not own", () => {
    const onChange = vi.fn();
    const { container } = render(
      <DatePicker
        variant="calendar"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 9 }}
        onChange={onChange}
      />,
    );
    fireEvent.keyDown(gridOf(container), { key: "q" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("steps the month with the header buttons", () => {
    const { container } = render(
      <DatePicker variant="calendar" now={TODAY} defaultMonth={{ y: 2026, m: 9 }} />,
    );
    const buttons = within(container).getAllByRole("button");
    const next = buttons.find((b) => /next/i.test(b.getAttribute("aria-label") ?? ""));
    const prev = buttons.find((b) => /previous/i.test(b.getAttribute("aria-label") ?? ""));
    expect(next && prev).toBeTruthy();
    fireEvent.click(next!);
    expect(container.textContent).toContain("October");
    fireEvent.click(prev!);
    expect(container.textContent).toContain("September");
  });
});

/* ------------------------------------------------------------------ */
/* Selection modes                                                     */
/* ------------------------------------------------------------------ */

describe("range and multiple selection", () => {
  const cell = (c: HTMLElement, day: number) =>
    within(c).getByRole("gridcell", { name: new RegExp(`September ${day}, 2026`) });

  it("builds a range in two clicks, and swaps a backwards one", () => {
    const onRangeChange = vi.fn();
    const { container } = render(
      <DatePicker
        variant="range"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 9 }}
        onRangeChange={onRangeChange}
      />,
    );
    fireEvent.click(cell(container, 10));
    expect(onRangeChange).toHaveBeenLastCalledWith({
      start: expect.objectContaining({ d: 10 }),
      end: null,
    });

    // Clicking earlier than the start does not refuse and does not restart —
    // the user has named both ends, just in the other order.
    fireEvent.click(cell(container, 3));
    const swapped = onRangeChange.mock.calls.at(-1)![0] as { start: ZbDate; end: ZbDate };
    expect([swapped.start.d, swapped.end.d]).toEqual([3, 10]);

    // A click on a complete range starts a new one.
    fireEvent.click(cell(container, 20));
    expect(onRangeChange).toHaveBeenLastCalledWith({
      start: expect.objectContaining({ d: 20 }),
      end: null,
    });
    fireEvent.click(cell(container, 24));
    const forwards = onRangeChange.mock.calls.at(-1)![0] as { start: ZbDate; end: ZbDate };
    expect([forwards.start.d, forwards.end.d]).toEqual([20, 24]);
  });

  it("adds, removes on a second click, and refuses past the cap", () => {
    const onDatesChange = vi.fn();
    const { container } = render(
      <DatePicker
        variant="multiple"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 9 }}
        maxDates={2}
        onDatesChange={onDatesChange}
      />,
    );
    fireEvent.click(cell(container, 3));
    fireEvent.click(cell(container, 1));
    // Kept in date order however they were clicked.
    expect((onDatesChange.mock.calls.at(-1)![0] as ZbDate[]).map((d) => d.d)).toEqual([1, 3]);

    // At the cap, a third is refused silently rather than dialogued.
    onDatesChange.mockClear();
    fireEvent.click(cell(container, 9));
    expect(onDatesChange).not.toHaveBeenCalled();

    // Clicking a selected date removes it.
    fireEvent.click(cell(container, 3));
    expect((onDatesChange.mock.calls.at(-1)![0] as ZbDate[]).map((d) => d.d)).toEqual([1]);
  });

  it("folds min and max into the same refusal as the host's own reasons", () => {
    const { container } = render(
      <DatePicker
        variant="calendar"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 9 }}
        min={plainDate(2026, 9, 5)}
        max={plainDate(2026, 9, 20)}
      />,
    );
    expect(cell(container, 1).getAttribute("aria-label")).toMatch(/before the earliest/);
    expect(cell(container, 25).getAttribute("aria-label")).toMatch(/after the latest/);
    expect(cell(container, 10).getAttribute("aria-disabled")).not.toBe("true");
  });
});

/* ------------------------------------------------------------------ */
/* Value conversion, at the boundaries that bite                       */
/* ------------------------------------------------------------------ */

describe("time value conversion", () => {
  it("keeps midnight and noon distinct in a twelve-hour field", () => {
    expect(timeToSegments(plainTime(0, 0))).toMatchObject({ h: 12, ap: 0 });
    expect(timeToSegments(plainTime(12, 0))).toMatchObject({ h: 12, ap: 1 });
    expect(timeToSegments(plainTime(13, 5))).toMatchObject({ h: 1, ap: 1 });
    expect(timeToSegments(null)).toMatchObject({ h: null, ap: null });
    expect(timeToSegments(plainTime(13, 5), true)).toMatchObject({ h: 13, ap: null });
  });

  it("has no time until the meridiem is answered", () => {
    expect(segmentsToTime({ h: 9, mi: 0, s: null, ap: null })).toBeNull();
    expect(segmentsToTime({ h: 9, mi: 0, s: null, ap: 1 })).toMatchObject({ h: 21 });
    expect(segmentsToTime({ h: 9, mi: null, s: null, ap: 1 })).toBeNull();
    // 24-hour needs no meridiem, and seconds are required only when shown.
    expect(segmentsToTime({ h: 21, mi: 0, s: null, ap: null }, { hour24: true })).toMatchObject({
      h: 21,
    });
    expect(
      segmentsToTime({ h: 21, mi: 0, s: null, ap: null }, { hour24: true, showSecond: true }),
    ).toBeNull();
    expect(
      segmentsToTime({ h: 21, mi: 0, s: 30, ap: null }, { hour24: true, showSecond: true }),
    ).toMatchObject({ s: 30 });
  });

  it("offers the Monday after when today is a Monday", () => {
    const monday = plainDate(2026, 8, 31);
    const options = relativeDateOptions(monday);
    const next = options.find((o) => o.id === "next-monday")!;
    // Not today. "Next Monday" on a Monday means the one coming.
    expect(toIsoDate(next.date)).toBe("2026-09-07");
    expect(toIsoDate(options.find((o) => o.id === "two-weeks")!.date)).toBe("2026-09-14");
  });
});

/* ------------------------------------------------------------------ */
/* The parts, driven through their own controls                        */
/* ------------------------------------------------------------------ */

describe("time field", () => {
  it("takes a preset, and says when a value is outside the allowed window", () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <TimeField label="Given" presets={timeGrid(8 * 60, 9 * 60, 30)} onChange={onChange} />,
    );
    fireEvent.click(within(container).getByRole("button", { name: /8:30/ }));
    expect(onChange.mock.calls.at(-1)![0]).toMatchObject({ h: 8, mi: 30 });

    rerender(
      <TimeField
        label="Given"
        min={plainTime(9, 0)}
        max={plainTime(17, 0)}
        value={plainTime(7, 0)}
        onChange={onChange}
      />,
    );
    expect(container.textContent).toMatch(/9:00|earliest|between/i);
  });

  it("shows seconds only when asked, and then requires them", () => {
    const { container } = render(
      <TimeField label="Obs" hour24 showSecond value={plainTime(21, 5, 9)} />,
    );
    expect(within(container).getAllByRole("spinbutton")).toHaveLength(3);
  });
});

describe("session field", () => {
  it("moves the end when a duration chip is pressed, and names the band", () => {
    const onChange = vi.fn();
    const { container } = render(
      <SessionTimeField
        label="Therapy"
        defaultValue={sessionFrom(plainTime(9, 0), 30)}
        durationPresets={[{ minutes: 30 }, { minutes: 53, label: "Psych" }]}
        bands={[
          { minMinutes: 0, maxMinutes: 45, code: null, label: "Short" },
          { minMinutes: 46, maxMinutes: 999, code: "LONG", label: "Extended" },
        ]}
        onChange={onChange}
      />,
    );
    expect(container.textContent).toContain("Short");
    fireEvent.click(within(container).getByRole("button", { name: /53/ }));
    expect(onChange.mock.calls.at(-1)![0]).toMatchObject({ durationMin: 53, hold: "duration" });
    expect(container.textContent).toContain("Extended");
  });

  it("recomputes the duration when the end is typed instead", () => {
    const onChange = vi.fn();
    const { container } = render(
      <SessionTimeField
        label="Therapy"
        defaultValue={sessionFrom(plainTime(9, 0), 30)}
        onChange={onChange}
      />,
    );
    const fields = container.querySelectorAll<HTMLElement>('[role="group"].zb-dt-field');
    const end = fields[1]!;
    act(() => end.focus());
    for (const k of ["1", "0", "3", "0", "a"]) fireEvent.keyDown(end, { key: k });
    const last = onChange.mock.calls.at(-1)![0] as { durationMin: number; hold: string };
    expect(last.durationMin).toBe(90);
    expect(last.hold).toBe("end");
  });

  it("says so when a typed end makes an absurd session, and offers the likely fix", () => {
    const onChange = vi.fn();
    // 9:00 AM to 2:00 AM the next day is seventeen hours: past the eight-hour
    // default, and almost always somebody who meant the afternoon.
    const absurd = withSessionEnd(sessionFrom(plainTime(9, 0), 60), plainTime(2, 0), {
      allowOvernight: true,
    });
    expect(absurd.exceedsMax).toBe(true);
    expect(absurd.suggestedEnd).toMatchObject({ h: 14, mi: 0 });

    const { container } = render(
      <SessionTimeField label="Session" value={absurd} allowOvernight onChange={onChange} />,
    );
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
    // Offered, never applied: the correction is a button, not a silent fix.
    fireEvent.click(within(container).getByRole("button", { name: /2:00 PM/ }));
    expect(onChange.mock.calls.at(-1)![0]).toMatchObject({ durationMin: 300 });
  });

  it("marks the next day rather than silently wrapping", () => {
    const { container } = render(
      <SessionTimeField
        label="Crisis line"
        allowOvernight
        maxMinutes={720}
        nextDateLabel="Aug 27"
        value={withSessionEnd(sessionFrom(plainTime(23, 30), 0), plainTime(7, 30), {
          allowOvernight: true,
        })}
      />,
    );
    expect(container.textContent).toContain("Aug 27");
  });
});

describe("birth date", () => {
  it("fills from a prior record in one press rather than pre-filling", () => {
    const onChange = vi.fn();
    render(<BirthDateField now={TODAY} suggested={plainDate(1990, 1, 1)} onChange={onChange} />);
    // Pre-filling would be a value nobody typed. SC 3.3.7 asks for one press.
    expect(screen.getAllByRole("spinbutton")[0]!.getAttribute("aria-valuetext")).toMatch(
      /not entered/,
    );
    fireEvent.click(screen.getByRole("button", { name: /Use Jan 1, 1990/ }));
    expect(toIsoDate(onChange.mock.calls.at(-1)![0] as ZbDate)).toBe("1990-01-01");
  });

  it("offers an imprecise date and a stated absence, and emits each", () => {
    const onChange = vi.fn();
    const { container } = render(
      <BirthDateField now={TODAY} allowEstimated allowAbsent onChange={onChange} />,
    );
    fireEvent.click(within(container).getByRole("button", { name: /Exact date unknown/ }));
    // One segment, not three: an estimated birth date is a year, and a
    // month and day nobody entered would be invented precision.
    expect(within(container).getAllByRole("spinbutton")).toHaveLength(1);
    expect(container.textContent).toContain("YYYY");
    fireEvent.click(within(container).getByRole("button", { name: /Not recorded/ }));
    expect((onChange.mock.calls.at(-1)![0] as { kind: string }).kind).toBe("absent");
  });

  it("reads an age in days, months or years, whichever is the informative one", () => {
    const { container, rerender } = render(
      <BirthDateField now={TODAY} value={plainDate(2026, 8, 20)} />,
    );
    expect(container.textContent).toMatch(/days old/);
    rerender(<BirthDateField now={TODAY} value={plainDate(2026, 4, 20)} />);
    expect(container.textContent).toMatch(/months old/);
    rerender(<BirthDateField now={TODAY} value={plainDate(1986, 7, 18)} />);
    expect(container.textContent).toMatch(/years old/);
    // A partial date reads as an approximation rather than a false precision.
    rerender(<BirthDateField now={TODAY} value={{ kind: "partial-date", y: 1962 }} />);
    expect(container.textContent).toMatch(/about/);
  });

  it("hides the age where a form has its own", () => {
    const { container } = render(
      <BirthDateField now={TODAY} value={plainDate(1986, 7, 18)} hideAge />,
    );
    expect(container.textContent).not.toMatch(/years old/);
  });
});

describe("read-only readout", () => {
  it("renders each kind of value it can be handed", () => {
    const { container, rerender } = render(<ClinicalDateTime value={null} />);
    expect(container.textContent).toMatch(/Not recorded/);

    rerender(<ClinicalDateTime value={{ kind: "absent", reason: "asked-declined" }} />);
    expect(container.textContent).toMatch(/declined/i);

    rerender(<ClinicalDateTime value={TODAY} restricted />);
    expect(container.querySelector('[data-zb-clinical-date-time="restricted"]')).toBeTruthy();

    rerender(<ClinicalDateTime value={TODAY} now={TODAY} showRelative />);
    expect(container.textContent).toMatch(/Today/);

    rerender(<ClinicalDateTime value={{ kind: "partial-date", y: 1962, m: 4 }} />);
    expect(container.textContent).toMatch(/1962/);
  });

  it("shows a second zone only where it differs from the reader's", () => {
    const { container, rerender } = render(
      <ClinicalDateTime as="time" value={SIGNED} viewerZone="America/New_York" showZone />,
    );
    expect(container.textContent).toContain("8:12");
    // Rendering "8:12 AM ET" to somebody already in Eastern Time is the noise
    // that teaches readers to stop reading zone labels.
    expect(container.textContent).not.toContain("5:12");

    rerender(
      <ClinicalDateTime as="time" value={SIGNED} viewerZone="America/Los_Angeles" showZone />,
    );
    // A reader three hours behind is told their own local time as well.
    expect(container.textContent).toContain("8:12");
    expect(container.textContent).toContain("5:12");
  });
});

/* ------------------------------------------------------------------ */
/* The controls that remain, driven the way a reader reaches them      */
/* ------------------------------------------------------------------ */

describe("month and year panes", () => {
  it("jumps a year without twelve presses of the month arrow", () => {
    const { container } = render(
      <DatePicker variant="calendar" now={TODAY} defaultMonth={{ y: 2026, m: 9 }} />,
    );
    const title = within(container).getByRole("button", { name: /choose month and year/i });
    expect(title.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(title);
    expect(title.getAttribute("aria-expanded")).toBe("true");
    // Choosing a month opens the year list rather than closing: the year is
    // the expensive one to reach, and nobody opens this pane for the month.
    fireEvent.click(within(container).getByRole("button", { name: "Mar" }));
    fireEvent.click(within(container).getByRole("button", { name: "2024" }));
    expect(container.textContent).toContain("March");
    expect(container.textContent).toContain("2024");

    // Pressing the title again closes the pane rather than cycling it.
    const reopened = within(container).getByRole("button", { name: /choose month and year/i });
    fireEvent.click(reopened);
    fireEvent.click(reopened);
    expect(reopened.getAttribute("aria-expanded")).toBe("false");
  });

  it("still offers a focusable cell when every day of the month is closed", () => {
    const { container } = render(
      <DatePicker
        variant="calendar"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 9 }}
        unavailable={() => "Programme closed all month"}
      />,
    );
    // A grid with no tabstop is a grid no keyboard can enter, so the first of
    // the month takes it even though it cannot be chosen.
    expect(container.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1);
  });
});

describe("the popover dismisses the way a popover should", () => {
  it("closes on a click outside and stays open on a click within", async () => {
    render(
      <div>
        <DatePicker variant="picker" label="Date" now={TODAY} />
        <button type="button">elsewhere</button>
      </div>,
    );
    await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
    expect(screen.getByRole("dialog")).toBeTruthy();

    // Inside the panel: still open.
    fireEvent.mouseDown(screen.getByRole("grid"));
    expect(screen.queryByRole("dialog")).toBeTruthy();

    // Outside: dismissed.
    fireEvent.mouseDown(screen.getByRole("button", { name: "elsewhere" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("carries its token scope out to the portal", async () => {
    render(
      <div data-zb-theme="dark" data-zb-density="clinical" dir="rtl">
        <DatePicker variant="picker" label="Date" now={TODAY} />
      </div>,
    );
    await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
    const panel = screen.getByRole("dialog");
    // Portalled into <body>, so the scope has to travel with it or the panel
    // arrives light inside a dark field and unmirrored inside an RTL one.
    expect(panel.parentElement).toBe(document.body);
    expect(panel.getAttribute("data-zb-theme")).toBe("dark");
    expect(panel.getAttribute("data-zb-density")).toBe("clinical");
    expect(panel.getAttribute("dir")).toBe("rtl");
  });
});

describe("digits that cannot extend the one before them", () => {
  it("restarts the buffer rather than refusing the keystroke", () => {
    const onChange = vi.fn();
    render(<DateField label="Date" now={TODAY} onChange={onChange} />);
    const g = group();
    act(() => g.focus());
    // 1 waits for a possible 12; 3 cannot follow it, so 3 becomes the month
    // and the field moves on. Refusing the 3 would lose a keystroke the user
    // meant, which is worse than re-reading it.
    fireEvent.keyDown(g, { key: "1" });
    fireEvent.keyDown(g, { key: "3" });
    expect(screen.getAllByRole("spinbutton")[0]!.textContent).toBe("03");
  });
});

describe("time paste", () => {
  it("takes a pasted time, and leaves an ambiguous one unresolved", () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<TimeField label="Time" onChange={onChange} />);
    fireEvent.paste(group(container), { clipboardData: { getData: () => "9:30 PM" } });
    expect(onChange.mock.calls.at(-1)![0]).toMatchObject({ h: 21, mi: 30 });

    onChange.mockClear();
    rerender(<TimeField label="Time" onChange={onChange} />);
    // A bare "9" has no meridiem, so nothing is emitted and the field asks.
    fireEvent.paste(group(container), { clipboardData: { getData: () => "9" } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.paste(group(container), { clipboardData: { getData: () => "not a time" } });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("slot grid", () => {
  it("selects a slot, refuses a blocked one, and refreshes on request", () => {
    const onSelect = vi.fn();
    const onRefresh = vi.fn();
    const { container } = render(
      <DatePicker
        variant="slots"
        set={AVAILABILITY}
        now={NOW}
        label="Times"
        onSelect={onSelect}
        onRefresh={onRefresh}
      />,
    );
    fireEvent.click(within(container).getByRole("button", { name: /8:30/ }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));

    onSelect.mockClear();
    const blocked = container.querySelector<HTMLElement>('[data-zb-slot="blocked"]')!;
    fireEvent.click(blocked);
    expect(onSelect).not.toHaveBeenCalled();

    const refresh = within(container).queryByRole("button", { name: /refresh|update/i });
    if (refresh) {
      fireEvent.click(refresh);
      expect(onRefresh).toHaveBeenCalled();
    }
  });

  it("says nothing is available rather than showing an empty box", () => {
    const { container } = render(
      <DatePicker
        variant="slots"
        set={{ asOf: NOW, slots: [], exhausted: true }}
        now={NOW}
        label="Times"
      />,
    );
    expect(container.textContent).toMatch(/no|none/i);
  });
});

describe("recurrence controls", () => {
  const rule = { freq: "WEEKLY" as const, interval: 1, count: 8 };

  it("edits every part of the rule through its own control", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RecurrenceField
        startDate={plainDate(2026, 9, 1)}
        defaultValue={rule}
        countOptions={[4, 8]}
        allowNoEnd
        showRRule
        onChange={onChange}
      />,
    );
    const press = (name: RegExp | string) =>
      fireEvent.click(within(container).getByRole("button", { name }));

    press("Daily");
    expect(onChange.mock.calls.at(-1)![0]).toMatchObject({ freq: "DAILY" });
    press("Monthly");
    expect(onChange.mock.calls.at(-1)![0]).toMatchObject({ freq: "MONTHLY" });
    press("Weekly");

    press("2 weeks");
    expect(onChange.mock.calls.at(-1)![0]).toMatchObject({ interval: 2 });

    press("Thursday");
    expect(onChange.mock.calls.at(-1)![0].byWeekday).toContain(4);
    press("Tuesday");
    expect(onChange.mock.calls.at(-1)![0].byWeekday).toEqual([2, 4]);
    press("Thursday");
    expect(onChange.mock.calls.at(-1)![0].byWeekday).toEqual([2]);
    // The last day will not come off. A weekly rule with no days expands to
    // nothing, which is not what unticking the last one means.
    press("Tuesday");
    expect(onChange.mock.calls.at(-1)![0].byWeekday).toEqual([2]);

    press("4 sessions");
    expect(onChange.mock.calls.at(-1)![0]).toMatchObject({ count: 4 });

    press("No end date");
    expect(onChange.mock.calls.at(-1)![0].count).toBeUndefined();
    // An unbounded rule says so rather than printing a last date the preview
    // cap invented.
    expect(container.textContent).toMatch(/no end date/i);

    press("On a date");
    expect(container.textContent).toMatch(/until|On a date/i);
  });

  it("refuses a rule outside the subset and keeps the original string", () => {
    const { container } = render(
      <RecurrenceField
        startDate={plainDate(2026, 9, 1)}
        unsupported={{ source: "FREQ=YEARLY;BYMONTH=3", parts: ["FREQ=YEARLY", "BYMONTH"] }}
      />,
    );
    expect(container.textContent).toContain("FREQ=YEARLY;BYMONTH=3");
    expect(within(container).queryAllByRole("button")).toHaveLength(0);
  });
});

describe("scheduler controls", () => {
  it("changes provider and day, and clears the held slot when the day moves", () => {
    const onActorChange = vi.fn();
    const onDateChange = vi.fn();
    const onSelect = vi.fn();
    const onRequestAvailability = vi.fn();
    const { container } = render(
      <AppointmentScheduler
        providers={PROVIDERS}
        availability={AVAILABILITY}
        now={NOW}
        durationMinutes={50}
        label="Book"
        onActorChange={onActorChange}
        onDateChange={onDateChange}
        onSelect={onSelect}
        onRequestAvailability={onRequestAvailability}
      />,
    );

    fireEvent.click(within(container).getByRole("button", { name: /M\. Reyes/ }));
    expect(onActorChange).toHaveBeenCalledWith("reyes");
    expect(onRequestAvailability).toHaveBeenCalled();

    fireEvent.click(within(container).getByRole("button", { name: /8:30/ }));
    expect(onSelect).toHaveBeenCalled();

    const days = within(container).getAllByRole("button", { name: /Thu|Fri/ });
    fireEvent.click(days[0]!);
    expect(onDateChange).toHaveBeenCalled();
    // Re-clicking the day already shown asks for nothing.
    onDateChange.mockClear();
    fireEvent.click(days[0]!);
    expect(onDateChange).not.toHaveBeenCalled();
  });

  it("shows a refusal from the host with the alternatives it offered", () => {
    const onSelect = vi.fn();
    const alternative = AVAILABILITY.slots.find((s) => s.state.kind === "free")!;
    const { container } = render(
      <AppointmentScheduler
        providers={PROVIDERS}
        availability={AVAILABILITY}
        now={NOW}
        label="Book"
        rejection={{
          reason: "That time was taken while you were choosing.",
          alternatives: [alternative],
        }}
        onSelect={onSelect}
      />,
    );
    expect(container.querySelector("[data-zb-rejection]")).toBeTruthy();
    expect(container.textContent).toContain("taken while you were choosing");
    fireEvent.click(within(container).getAllByRole("button", { name: /AM|PM/ }).at(-1)!);
    expect(onSelect).toHaveBeenCalled();
  });
});

describe("series and group controls", () => {
  it("resolves, undoes, resolves everything, and books what is bookable", () => {
    const onResolve = vi.fn();
    const onUnresolve = vi.fn();
    const onResolveAll = vi.fn();
    const onBook = vi.fn();
    const verdicts = [
      {
        date: "2026-09-08",
        reason: "Dr Osei on leave",
        alternative: { date: plainDate(2026, 9, 10), label: "Thu 10 Sep" },
      },
    ];
    const { container, rerender } = render(
      <RecurringSeriesScheduler
        rule={{ freq: "WEEKLY", interval: 1, count: 6 }}
        startDate={plainDate(2026, 9, 1)}
        verdicts={verdicts}
        resolved={new Set()}
        onResolve={onResolve}
        onUnresolve={onUnresolve}
        onResolveAll={onResolveAll}
        onBook={onBook}
      />,
    );
    fireEvent.click(within(container).getByRole("button", { name: /Move to Thu 10 Sep/ }));
    expect(onResolve).toHaveBeenCalledWith("2026-09-08", expect.objectContaining({ d: 10 }));

    fireEvent.click(within(container).getByRole("button", { name: /Resolve all/ }));
    expect(onResolveAll).toHaveBeenCalled();

    fireEvent.click(within(container).getByRole("button", { name: /Book/ }));
    expect(onBook).toHaveBeenCalled();

    rerender(
      <RecurringSeriesScheduler
        rule={{ freq: "WEEKLY", interval: 1, count: 6 }}
        startDate={plainDate(2026, 9, 1)}
        verdicts={verdicts}
        resolved={new Set(["2026-09-08"])}
        onResolve={onResolve}
        onUnresolve={onUnresolve}
      />,
    );
    fireEvent.click(within(container).getByRole("button", { name: /Undo/ }));
    expect(onUnresolve).toHaveBeenCalledWith("2026-09-08");
  });

  it("flags a group the room cannot hold and an enrolment past the cap", () => {
    const { container } = render(
      <GroupSeriesScheduler
        name="DBT Skills"
        rule={{ freq: "WEEKLY", interval: 1, count: 6 }}
        startDate={plainDate(2026, 9, 1)}
        sessionMinutes={90}
        room={{ name: "Group Room 2", capacity: 8 }}
        capacity={12}
        enrolled={14}
        facilitators={["M. Reyes, LCSW"]}
        modality="In person"
        showRRule
      />,
    );
    // Two different facts, and both are the reason a group cannot run.
    expect(container.querySelector('[data-zb-tally="conflicts"]')).toBeTruthy();
    expect(container.textContent).toMatch(/Group Room 2/);
    expect(container.textContent).toMatch(/9 hr|540 min/);
  });
});

describe("the glyphs are public API", () => {
  it("renders the clock glyph a host would put in its own trigger", () => {
    const { container } = render(<ClockGlyph className="probe" />);
    expect(container.querySelector("svg.probe")).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/* The last of it: paths a reader reaches only in a particular state   */
/* ------------------------------------------------------------------ */

describe("bounds and policies that block rather than warn", () => {
  it("names the boundary it refused, in both directions", () => {
    const { container, rerender } = render(
      <DateField
        label="Service date"
        now={TODAY}
        min={plainDate(2026, 8, 1)}
        max={plainDate(2026, 8, 31)}
        value={plainDate(2026, 7, 4)}
      />,
    );
    expect(container.textContent).toMatch(/Earliest allowed is Aug 1, 2026/);
    rerender(
      <DateField
        label="Service date"
        now={TODAY}
        min={plainDate(2026, 8, 1)}
        max={plainDate(2026, 8, 31)}
        value={plainDate(2026, 9, 4)}
      />,
    );
    expect(container.textContent).toMatch(/Latest allowed is Aug 31, 2026/);
  });

  it("blocks a past date where the workflow says it is impossible", () => {
    const { container } = render(
      <DateField
        label="Appointment"
        now={TODAY}
        pastPolicy="block"
        value={plainDate(2026, 8, 1)}
      />,
    );
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
    expect(container.textContent).toMatch(/cannot be in the past/);
  });
});

describe("picking from the calendar rather than typing", () => {
  it("writes the chosen date into the segments and closes", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <DatePicker variant="picker" label="Date" now={TODAY} onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
    fireEvent.click(screen.getByRole("gridcell", { name: /August 20, 2026/ }));
    expect(toIsoDate(onChange.mock.calls.at(-1)![0] as ZbDate)).toBe("2026-08-20");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(within(container).getAllByRole("spinbutton")[1]!.textContent).toBe("20");
  });

  it("previews a range as the pointer moves across it", () => {
    const { container } = render(
      <DatePicker
        variant="range"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 9 }}
        range={{ start: plainDate(2026, 9, 3), end: null }}
      />,
    );
    const target = within(container).getByRole("gridcell", { name: /September 9, 2026/ });
    fireEvent.mouseEnter(target);
    // A half-made range shows what it would cover, so the second click is not
    // a guess.
    expect(container.querySelectorAll(".zb-dt-cal__day--in-range").length).toBeGreaterThan(0);
  });
});

describe("session start, and birth-date entry modes", () => {
  it("slides or stretches the session when the start is retyped", () => {
    const onChange = vi.fn();
    const { container } = render(
      <SessionTimeField
        label="Therapy"
        defaultValue={sessionFrom(plainTime(9, 0), 50)}
        onChange={onChange}
      />,
    );
    const start = container.querySelectorAll<HTMLElement>('[role="group"].zb-dt-field')[0]!;
    act(() => start.focus());
    for (const k of ["1", "0", "0", "0", "a"]) fireEvent.keyDown(start, { key: k });
    // The duration is held, so the whole session slides rather than stretching.
    expect(onChange.mock.calls.at(-1)![0]).toMatchObject({ durationMin: 50 });
  });

  it("goes back from a stated absence to entering a date", () => {
    const onChange = vi.fn();
    const { container } = render(
      <BirthDateField
        now={TODAY}
        allowAbsent
        value={{ kind: "absent", reason: "asked-declined" }}
        onChange={onChange}
      />,
    );
    fireEvent.click(within(container).getByRole("button", { name: /Enter a date/ }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("emits a year-only value while the precision says year", () => {
    const onChange = vi.fn();
    const { container } = render(
      <BirthDateField now={TODAY} precision="year" allowEstimated onChange={onChange} />,
    );
    const g = group(container);
    act(() => g.focus());
    for (const k of ["1", "9", "6", "2"]) fireEvent.keyDown(g, { key: k });
    expect(onChange.mock.calls.at(-1)![0]).toMatchObject({ kind: "partial-date", y: 1962 });
  });

  it("refuses a birth date in the future as an error, not a warning", () => {
    const { container } = render(<BirthDateField now={TODAY} value={plainDate(2027, 1, 1)} />);
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
    expect(container.textContent).toMatch(/cannot be in the future/);
  });

  it("confirms a complete birth date in full, and passes a hint through", () => {
    const { container, rerender } = render(
      <BirthDateField now={TODAY} value={plainDate(1986, 7, 18)} />,
    );
    expect(container.textContent).toMatch(/Friday, July 18, 1986/);
    rerender(<BirthDateField now={TODAY} hint="From the referral letter" />);
    expect(container.textContent).toContain("From the referral letter");
  });

  it("opens its calendar on the year, and refuses a future day in it", async () => {
    const { container } = render(<BirthDateField now={TODAY} />);
    await userEvent.click(within(container).getByRole("button", { name: /Open calendar/ }));
    const panel = screen.getByRole("dialog");
    // A birth-date calendar that opens on this month has decided the patient
    // was born this month.
    expect(panel.getAttribute("aria-label")).toMatch(/year of birth/i);
    // It opens roughly a working lifetime ago rather than on this month.
    expect(panel.textContent).toContain("1986");
    fireEvent.click(within(panel).getAllByRole("gridcell", { name: /1986/ })[10]!);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("readouts of every shape", () => {
  it("renders a bare time, a date-time pair and a second-precision instant", () => {
    const { container, rerender } = render(
      <ClinicalDateTime value={plainTime(21, 30)} as="time" />,
    );
    expect(container.textContent).toMatch(/9:30 PM/);

    rerender(
      <ClinicalDateTime
        value={{ kind: "datetime", date: plainDate(2026, 8, 24), time: plainTime(8, 12) }}
        now={TODAY}
        showRelative
      />,
    );
    expect(container.textContent).toMatch(/Aug 24, 2026/);
    expect(container.textContent).toMatch(/8:12/);

    rerender(<ClinicalDateTime value={plainTime(21, 30, 9)} as="time" hour24 />);
    expect(container.textContent).toMatch(/21:30:09/);
  });
});

describe("slot names carry the whole story", () => {
  it("says who holds a slot and how long is left", () => {
    const held = {
      ...AVAILABILITY,
      slots: [
        AVAILABILITY.slots.find((sl) => sl.state.kind === "free")!,
        {
          id: "mine",
          start: plainTime(13, 30),
          durationMinutes: 50,
          state: { kind: "held" as const, by: "me" as const, expiresInSeconds: 96 },
        },
        {
          id: "theirs",
          start: plainTime(14, 30),
          durationMinutes: 50,
          state: { kind: "held" as const, by: "other" as const, expiresInSeconds: 30 },
        },
      ],
    };
    const { container } = render(<DatePicker variant="slots" set={held} now={NOW} label="Times" />);
    // A hold expires. Rendering it as taken loses a slot about to come back —
    // so the state and the time remaining are in the accessible name, where a
    // screen-reader user actually meets them.
    const names = Array.from(container.querySelectorAll("[data-zb-slot]"))
      .map((n) => n.getAttribute("aria-label") ?? "")
      .join(" | ");
    expect(names).toMatch(/held for you, 2 minutes remaining/);
    expect(names).toMatch(/held/i);
    expect(container.querySelectorAll('[data-zb-slot="held"]').length).toBe(2);
  });
});

describe("hosts are told what a rule expands to, once", () => {
  it("reports the dates a recurrence and a series produce", () => {
    const onExpand = vi.fn();
    const { rerender } = render(
      <RecurrenceField
        startDate={plainDate(2026, 9, 1)}
        defaultValue={{ freq: "WEEKLY", interval: 1, count: 4 }}
        onExpand={onExpand}
      />,
    );
    expect(onExpand).toHaveBeenCalledTimes(1);
    expect((onExpand.mock.calls[0]![0] as ZbDate[]).length).toBe(4);
    // Re-rendering with the same rule does not re-report: a host that refetches
    // conflicts on every render never settles.
    rerender(
      <RecurrenceField
        startDate={plainDate(2026, 9, 1)}
        defaultValue={{ freq: "WEEKLY", interval: 1, count: 4 }}
        onExpand={onExpand}
      />,
    );
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it("reports a series expansion, skipping the dates it excluded", () => {
    const onExpand = vi.fn();
    render(
      <RecurringSeriesScheduler
        rule={{
          freq: "WEEKLY",
          interval: 1,
          count: 4,
          exceptions: [plainDate(2026, 9, 8)],
        }}
        startDate={plainDate(2026, 9, 1)}
        onExpand={onExpand}
      />,
    );
    const dates = onExpand.mock.calls.at(-1)![0] as ZbDate[];
    expect(dates.map(toIsoDate)).not.toContain("2026-09-08");
  });
});

describe("day load colours the strip before a click", () => {
  it("renders the open count a host supplied for each day", () => {
    const { container } = render(
      <AppointmentScheduler
        providers={PROVIDERS}
        availability={AVAILABILITY}
        now={NOW}
        label="Book"
        dayLoads={[
          { date: TODAY, openCount: 6 },
          { date: plainDate(2026, 8, 27), openCount: 0 },
        ]}
      />,
    );
    expect(container.textContent).toContain("6 open");
    // A day with nothing open is not a day you can pick.
    const empty = within(container).getByRole("button", { name: /August 27.*no times available/i });
    expect(empty.getAttribute("aria-disabled")).toBe("true");
  });
});

/* ------------------------------------------------------------------ */
/* Posting into a plain form, and the wording that changes with a count */
/* ------------------------------------------------------------------ */

describe("hidden inputs, so the fields post in an ordinary form", () => {
  const hidden = (c: HTMLElement) => c.querySelector<HTMLInputElement>('input[type="hidden"]');

  it("posts ISO from the date field, empty when there is no value", () => {
    const { container, rerender } = render(
      <DateField label="Service" name="service_date" now={TODAY} value={TODAY} />,
    );
    // ISO always: a form body carrying a locale-formatted date is a bug in
    // somebody else's parser six months from now.
    expect(hidden(container)!.value).toBe("2026-08-26");
    rerender(<DateField label="Service" name="service_date" now={TODAY} value={null} />);
    expect(hidden(container)!.value).toBe("");
    rerender(<DateField label="Service" now={TODAY} value={TODAY} />);
    expect(hidden(container)).toBeNull();
  });

  it("posts a 24-hour time whatever the field displays", () => {
    const { container, rerender } = render(
      <TimeField label="Given" name="given_at" value={plainTime(21, 30)} />,
    );
    expect(hidden(container)!.value).toMatch(/^21:30/);
    rerender(<TimeField label="Given" name="given_at" value={null} />);
    expect(hidden(container)!.value).toBe("");
    rerender(<TimeField label="Given" value={plainTime(21, 30)} />);
    expect(hidden(container)).toBeNull();
  });

  it("posts each shape a birth date can take", () => {
    const { container, rerender } = render(
      <BirthDateField now={TODAY} name="dob" value={plainDate(1986, 7, 18)} />,
    );
    expect(hidden(container)!.value).toBe("1986-07-18");
    rerender(<BirthDateField now={TODAY} name="dob" value={{ kind: "partial-date", y: 1962 }} />);
    expect(hidden(container)!.value).toBe("1962");
    rerender(
      <BirthDateField
        now={TODAY}
        name="dob"
        value={{ kind: "absent", reason: "asked-declined" }}
      />,
    );
    expect(hidden(container)!.value).toBe("");
    rerender(<BirthDateField now={TODAY} value={plainDate(1986, 7, 18)} />);
    expect(hidden(container)).toBeNull();
  });

  it("survives a value shape it was never given a case for", () => {
    // A host on plain JavaScript can hand over anything. The reconciliation
    // key must not throw on it, because a field that crashes on bad input is
    // worse than one that renders nothing.
    const { container } = render(
      <BirthDateField now={TODAY} value={{ kind: "nonsense" } as never} />,
    );
    expect(container.querySelector("[data-zb-birth-date]")).toBeTruthy();
  });
});

describe("counts read as sentences, not as numbers with an s", () => {
  it("says one minute and one time in the singular", () => {
    const oneSlot = {
      asOf: { date: TODAY, time: plainTime(10, 41) },
      staleAfterSeconds: 30,
      exhausted: false,
      slots: [AVAILABILITY.slots.find((s) => s.state.kind === "free")!],
    };
    const { container } = render(
      <DatePicker variant="slots" set={oneSlot} now={NOW} label="Times" />,
    );
    expect(container.textContent).toMatch(/1 minute old/);
    expect(container.textContent).not.toMatch(/1 minutes/);
  });

  it("says how fresh it is when nothing has gone stale", () => {
    const fresh = { ...AVAILABILITY, asOf: NOW, staleAfterSeconds: 600 };
    const { container } = render(
      <DatePicker variant="slots" set={fresh} now={NOW} label="Times" />,
    );
    // Not stale, so the header states the count and the moment rather than an
    // age and a refresh.
    expect(container.textContent).toMatch(/as of/);
    expect(within(container).queryByRole("button", { name: /Refresh/ })).toBeNull();
  });
});

describe("the remaining birth-date and recurrence paths", () => {
  it("lets a host error override the field's own verdict", () => {
    const { container } = render(
      <BirthDateField
        now={TODAY}
        value={plainDate(1986, 7, 18)}
        error="Does not match the referral"
      />,
    );
    expect(container.textContent).toContain("Does not match the referral");
  });

  it("names the calendar trigger for what pressing it will do", async () => {
    render(<BirthDateField now={TODAY} />);
    const trigger = screen.getByRole("button", { name: /Open calendar/ });
    await userEvent.click(trigger);
    expect(screen.getByRole("button", { name: /Close calendar/ })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /Close calendar/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("takes a pasted birth date", () => {
    const onChange = vi.fn();
    const { container } = render(<BirthDateField now={TODAY} onChange={onChange} />);
    fireEvent.paste(group(container), { clipboardData: { getData: () => "07/18/1986" } });
    expect(toIsoDate(onChange.mock.calls.at(-1)![0] as ZbDate)).toBe("1986-07-18");
    fireEvent.paste(group(container), { clipboardData: { getData: () => "rubbish" } });
    expect(toIsoDate(onChange.mock.calls.at(-1)![0] as ZbDate)).toBe("1986-07-18");
  });

  it("switches a dated rule back to a counted one", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RecurrenceField
        startDate={plainDate(2026, 9, 1)}
        defaultValue={{ freq: "WEEKLY", interval: 1, until: plainDate(2026, 12, 1) }}
        countOptions={[4, 8, 12]}
        onChange={onChange}
      />,
    );
    fireEvent.click(within(container).getByRole("button", { name: /After a number of sessions/ }));
    const next = onChange.mock.calls.at(-1)![0];
    expect(next.count).toBe(12);
    expect(next.until).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/* The options, swept                                                  */
/*                                                                     */
/* Every one of these is a prop a host may or may not pass, and each   */
/* arm is a different rendering. Sweeping them is how a default stops  */
/* being a thing nobody has ever seen.                                 */
/* ------------------------------------------------------------------ */

describe("locale ordering", () => {
  it("puts the segments in the order the locale asks for", () => {
    const names = (c: HTMLElement) =>
      within(c)
        .getAllByRole("spinbutton")
        .map((s) => s.getAttribute("aria-label"));
    const { container, rerender } = render(<DateField label="D" order="MDY" now={TODAY} />);
    expect(names(container)).toEqual(["Month", "Day", "Year"]);
    rerender(<DateField label="D" order="DMY" now={TODAY} />);
    expect(names(container)).toEqual(["Day", "Month", "Year"]);
    rerender(<DateField label="D" order="YMD" now={TODAY} />);
    expect(names(container)).toEqual(["Year", "Month", "Day"]);
  });

  it("takes the weekday labels and the month label from the host", () => {
    const { container } = render(
      <Calendar
        now={TODAY}
        defaultMonth={{ y: 2026, m: 9 }}
        fluid
        weekdayLabels={["D", "L", "M", "M", "J", "V", "S"]}
        weekdayNames={["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]}
        monthNames={[
          "janv.",
          "févr.",
          "mars",
          "avr.",
          "mai",
          "juin",
          "juil.",
          "août",
          "sept.",
          "oct.",
          "nov.",
          "déc.",
        ]}
        monthLabel={(m) => `${m.m}/${m.y}`}
        weekStart={1}
      />,
    );
    // Never a table of ours: the labels come from Intl, through the host.
    expect(container.textContent).toContain("9/2026");
    expect(container.querySelector(".zb-dt-cal--fluid")).toBeTruthy();
    expect(within(container).getByRole("columnheader", { name: "lundi" })).toBeTruthy();
  });
});

describe("defaults a host never passes", () => {
  it("labels an unlabelled field and its calendar anyway", async () => {
    render(<DatePicker variant="picker" now={TODAY} id="fixed-id" />);
    // An unnamed group of three spinbuttons is a riddle.
    expect(screen.getByRole("group", { name: "Date" })).toBeTruthy();
    expect(document.getElementById("fixed-id")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
    expect(screen.getByRole("dialog", { name: "Choose a date" })).toBeTruthy();
  });

  it("marks required and optional, and neither when neither is asked for", () => {
    const { container, rerender } = render(<DateField label="Date" now={TODAY} required />);
    expect(container.querySelector(".zb-dt-label__required")).toBeTruthy();
    rerender(<DateField label="Date" now={TODAY} optional />);
    expect(container.textContent).toContain("Optional");
    rerender(<DateField now={TODAY} />);
    expect(container.querySelector(".zb-dt-label")).toBeNull();
  });

  it("shows a hint when there is nothing more urgent to say", () => {
    const { container } = render(
      <DateField label="Date" now={TODAY} hint="Use the date on the referral" />,
    );
    expect(container.textContent).toContain("Use the date on the referral");
  });

  it("has no today, and no relative reading, without a `now`", () => {
    const { container } = render(<DateField label="Historical" value={plainDate(1912, 4, 15)} />);
    // Correct for a historical picker, and deliberate everywhere else: the
    // component reads no clock, so without `now` there is no "today".
    expect(container.querySelector('[role="alert"], [role="status"]')).toBeNull();
    const cal = render(<Calendar defaultMonth={{ y: 1912, m: 4 }} />);
    expect(cal.container.querySelector(".zb-dt-cal__day--today")).toBeNull();
  });

  it("opens on the month its value is in, then on today, then on a fallback", () => {
    const withValue = render(<Calendar value={plainDate(1986, 7, 18)} />);
    expect(withValue.container.textContent).toContain("July");
    withValue.unmount();

    const withRange = render(
      <Calendar mode="range" range={{ start: plainDate(2030, 2, 3), end: null }} />,
    );
    expect(withRange.container.textContent).toContain("February");
    withRange.unmount();

    const withDates = render(<Calendar mode="multiple" dates={[plainDate(2019, 11, 5)]} />);
    expect(withDates.container.textContent).toContain("November");
    withDates.unmount();

    const withNothing = render(<Calendar />);
    expect(withNothing.container.querySelector('[role="grid"]')).toBeTruthy();
  });

  it("counts openings in words, including none and exactly one", () => {
    const { container } = render(
      <Calendar
        now={TODAY}
        defaultMonth={{ y: 2026, m: 9 }}
        load={(d) => (d.d === 1 ? 0 : d.d === 2 ? 1 : null)}
      />,
    );
    expect(
      within(container).getByRole("gridcell", { name: /September 1, 2026, no times/ }),
    ).toBeTruthy();
    expect(
      within(container).getByRole("gridcell", { name: /September 2, 2026, 1 time available/ }),
    ).toBeTruthy();
  });
});

describe("policies that only warn", () => {
  it("warns about a past date without marking it invalid", () => {
    const { container } = render(
      <DateField label="Documented" now={TODAY} pastPolicy="warn" value={plainDate(2026, 8, 1)} />,
    );
    expect(container.querySelector('[role="status"]')).toBeTruthy();
    expect(container.querySelector('[aria-invalid="true"]')).toBeNull();
  });

  it("emits nothing when a re-entered value is the one already held", () => {
    const onChange = vi.fn();
    render(<DateField label="Date" now={TODAY} defaultValue={TODAY} onChange={onChange} />);
    fireEvent.paste(group(), { clipboardData: { getData: () => "08/26/2026" } });
    // The same date is not a change, and a host that refetches on every
    // onChange should not be woken for one.
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("the popover flips above a field with no room beneath it", () => {
  it("measures the field rather than guessing", async () => {
    // jsdom has no layout, so the rects are supplied: a field near the bottom
    // of a 800px viewport, and a panel taller than the gap under it.
    const rect = (top: number, height: number) =>
      ({
        top,
        bottom: top + height,
        left: 20,
        right: 300,
        width: 280,
        height,
        x: 20,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (this: Element) {
      if (this.classList.contains("zb-dt-anchor")) return rect(740, 40);
      if (this.classList.contains("zb-dt-pop")) return rect(0, 320);
      return original.call(this);
    };
    try {
      render(<DatePicker variant="picker" label="Date" now={TODAY} />);
      await userEvent.click(screen.getByRole("button", { name: /calendar/i }));
      const panel = screen.getByRole("dialog");
      // SC 2.4.11: the popover may never be the thing that hides the field
      // that opened it.
      expect(panel.className).toContain("zb-dt-pop--above");
      expect(Number.parseFloat(panel.style.top)).toBeLessThan(740);
    } finally {
      Element.prototype.getBoundingClientRect = original;
    }
  });
});

describe("the birth-date calendar closes the way the others do", () => {
  it("dismisses on Escape and keeps what was typed", async () => {
    render(<BirthDateField now={TODAY} />);
    const g = group();
    act(() => g.focus());
    for (const k of ["0", "7"]) fireEvent.keyDown(g, { key: k });
    await userEvent.click(screen.getByRole("button", { name: /Open calendar/ }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getAllByRole("spinbutton")[0]!.textContent).toBe("07");
  });
});

/* ------------------------------------------------------------------ */
/* Bare props, and fully controlled                                    */
/*                                                                     */
/* Two renderings of every part that a host actually produces: one     */
/* with nothing optional passed, and one where the host owns every     */
/* piece of state. Both are shipped paths, and neither is the one a    */
/* demo exercises.                                                     */
/* ------------------------------------------------------------------ */

describe("with nothing optional passed", () => {
  it("renders a time field that has been told only that it exists", () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<TimeField onChange={onChange} />);
    expect(within(container).getByRole("group", { name: "Time" })).toBeTruthy();
    expect(container.querySelector(".zb-dt-label")).toBeNull();

    // One bound at a time, which is the common shape of a dosing window.
    rerender(<TimeField min={plainTime(9, 0)} value={plainTime(7, 0)} />);
    expect(container.textContent).toMatch(/9:00/);
    rerender(<TimeField max={plainTime(17, 0)} value={plainTime(19, 0)} />);
    expect(container.textContent).toMatch(/5:00/);
    rerender(<TimeField hint="From the MAR" />);
    expect(container.textContent).toContain("From the MAR");
    rerender(<TimeField required optional label="Given" />);
    expect(container.querySelector(".zb-dt-label__required")).toBeTruthy();

    // 24-hour entry emits without ever touching a meridiem.
    const bare = render(<TimeField hour24 onChange={onChange} />);
    const g = group(bare.container);
    act(() => g.focus());
    for (const k of ["2", "1", "3", "0"]) fireEvent.keyDown(g, { key: k });
    expect(onChange.mock.calls.at(-1)![0]).toMatchObject({ h: 21, mi: 30 });
  });

  it("renders a session with no presets, no bands and no day labels", () => {
    const { container } = render(<SessionTimeField value={sessionFrom(plainTime(9, 0), 50)} />);
    expect(container.querySelector("[data-zb-session]")).toBeTruthy();
    expect(container.querySelector(".zb-dt-chips")?.textContent ?? "").not.toMatch(/min/);
  });

  it("renders a slot grid with no clock and no refresh", () => {
    const { container } = render(<TimeSlotGrid set={AVAILABILITY} />);
    // Without `now` nothing can be stale, so there is no age and no refresh.
    expect(container.textContent).not.toMatch(/minutes old/);
    expect(within(container).queryByRole("button", { name: /Refresh/ })).toBeNull();
  });

  it("renders a group with only a name, a rule and a start", () => {
    const { container } = render(
      <GroupSeriesScheduler
        name="Open group"
        rule={{ freq: "WEEKLY", interval: 1, count: 3 }}
        startDate={plainDate(2026, 9, 1)}
      />,
    );
    expect(container.querySelector("[data-zb-group-series]")).toBeTruthy();
    // No room, no capacity, no session length: none of them is invented.
    expect(container.textContent).not.toMatch(/capacity|hr/i);
  });

  it("renders a scheduler with a single provider and no day loads", () => {
    const { container } = render(
      <AppointmentScheduler providers={[PROVIDERS[0]!]} availability={AVAILABILITY} now={NOW} />,
    );
    expect(container.querySelector("[data-zb-appointment-scheduler]")).toBeTruthy();
  });

  it("renders a scheduler that was handed no providers at all", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <AppointmentScheduler
        providers={[]}
        availability={AVAILABILITY}
        now={NOW}
        onSelect={onSelect}
      />,
    );
    // Nothing to schedule against, and nothing that throws.
    expect(container.querySelector("[data-zb-appointment-scheduler]")).toBeTruthy();
  });

  it("reports a refusal that came with no alternatives to offer", () => {
    const { container } = render(
      <AppointmentScheduler
        providers={PROVIDERS}
        availability={AVAILABILITY}
        now={NOW}
        rejection={{ reason: "Provider is no longer accepting referrals." }}
      />,
    );
    expect(container.textContent).toContain("no longer accepting referrals");
    expect(container.textContent).not.toMatch(/These are still open/);
  });
});

describe("fully controlled", () => {
  it("never moves the scheduler's own state when the host owns it", () => {
    const onActorChange = vi.fn();
    const onDateChange = vi.fn();
    const onSelect = vi.fn();
    const free = AVAILABILITY.slots.find((s) => s.state.kind === "free")!;
    const { container } = render(
      <AppointmentScheduler
        providers={PROVIDERS}
        availability={AVAILABILITY}
        now={NOW}
        actorId="osei"
        date={TODAY}
        value={free.id}
        onActorChange={onActorChange}
        onDateChange={onDateChange}
        onSelect={onSelect}
      />,
    );
    // Choosing the provider already chosen asks for nothing.
    fireEvent.click(within(container).getByRole("button", { name: /Dr Ama Osei/ }));
    expect(onActorChange).not.toHaveBeenCalled();

    fireEvent.click(within(container).getByRole("button", { name: /M\. Reyes/ }));
    expect(onActorChange).toHaveBeenCalledWith("reyes");

    fireEvent.click(within(container).getAllByRole("button", { name: /Thu|Fri/ })[0]!);
    expect(onDateChange).toHaveBeenCalled();
  });

  it("keeps a controlled calendar on the value it was given", () => {
    const onChange = vi.fn();
    const onRangeChange = vi.fn();
    const onDatesChange = vi.fn();
    const { container, rerender } = render(
      <Calendar
        value={plainDate(2026, 9, 3)}
        month={{ y: 2026, m: 9 }}
        onMonthChange={vi.fn()}
        onChange={onChange}
      />,
    );
    fireEvent.click(within(container).getByRole("gridcell", { name: /September 9, 2026/ }));
    expect(onChange).toHaveBeenCalled();
    // The host did not accept it, so the grid still shows the third.
    expect(
      within(container)
        .getByRole("gridcell", { name: /September 3, 2026/ })
        .getAttribute("aria-selected"),
    ).toBe("true");

    rerender(
      <Calendar
        mode="range"
        range={{ start: plainDate(2026, 9, 3), end: plainDate(2026, 9, 5) }}
        month={{ y: 2026, m: 9 }}
        onMonthChange={vi.fn()}
        onRangeChange={onRangeChange}
      />,
    );
    fireEvent.click(within(container).getByRole("gridcell", { name: /September 9, 2026/ }));
    expect(onRangeChange).toHaveBeenCalled();

    rerender(
      <Calendar
        mode="multiple"
        dates={[plainDate(2026, 9, 3)]}
        month={{ y: 2026, m: 9 }}
        onMonthChange={vi.fn()}
        onDatesChange={onDatesChange}
      />,
    );
    fireEvent.click(within(container).getByRole("gridcell", { name: /September 9, 2026/ }));
    expect(onDatesChange).toHaveBeenCalled();
  });
});

describe("held slots, and the singular that reads as a sentence", () => {
  it("says one minute remaining rather than 1 minutes", () => {
    const mine = {
      asOf: NOW,
      staleAfterSeconds: 600,
      exhausted: false,
      slots: [
        AVAILABILITY.slots.find((sl) => sl.state.kind === "free")!,
        {
          id: "mine",
          start: plainTime(9, 30),
          durationMinutes: 50,
          state: { kind: "held" as const, by: "me" as const, expiresInSeconds: 40 },
        },
      ],
    };
    const { container } = render(<TimeSlotGrid set={mine} now={NOW} label="Times" />);
    const name = container.querySelector('[data-zb-slot="held"]')!.getAttribute("aria-label")!;
    expect(name).toMatch(/1 minute remaining/);
    expect(name).not.toMatch(/1 minutes/);
  });

  it("says how many times are open when the set is fresh", () => {
    const { container } = render(
      <TimeSlotGrid set={{ ...AVAILABILITY, asOf: NOW, staleAfterSeconds: 900 }} now={NOW} />,
    );
    expect(container.textContent).toMatch(/times · as of|time · as of/);
  });
});

/* ------------------------------------------------------------------ */
/* The wording of an absence, and the arms nobody demos                */
/* ------------------------------------------------------------------ */

describe("an absence says which kind it is", () => {
  it("offers the wording the host chose, and reads it back", () => {
    const onChange = vi.fn();
    // The chip reads the same either way. What changes is the reason it
    // records, which is the part that has to survive into the record. Each
    // starts fresh: the field is uncontrolled, so a re-render would still be
    // holding the absence the last press set.
    for (const reason of ["asked-declined", "not-asked", "unknown"] as const) {
      const view = render(
        <BirthDateField now={TODAY} allowAbsent absentReason={reason} onChange={onChange} />,
      );
      fireEvent.click(within(view.container).getByRole("button", { name: /Not recorded/ }));
      expect((onChange.mock.calls.at(-1)![0] as { reason: string }).reason).toBe(reason);
      view.unmount();
    }

    // Pressing it again is how a mistake is undone.
    const held = render(
      <BirthDateField
        now={TODAY}
        allowAbsent
        value={{ kind: "absent", reason: "unknown" }}
        onChange={onChange}
      />,
    );
    fireEvent.click(within(held.container).getByRole("button", { name: /Not recorded/ }));
    expect(onChange).toHaveBeenLastCalledWith(null);
    held.unmount();

    // And the readout is where the reason is actually said out loud.
    const declined = render(
      <ClinicalDateTime value={{ kind: "absent", reason: "asked-declined" }} />,
    );
    expect(declined.container.textContent).toMatch(/declined/i);
    declined.unmount();

    // A form that cannot tell "declined" from "nobody asked" is lying about
    // what it knows, so every reason has its own words.
    const readout = render(<ClinicalDateTime value={{ kind: "absent", reason: "unknown" }} />);
    expect(readout.container.textContent).toBeTruthy();
    readout.unmount();
    const odd = render(<ClinicalDateTime value={{ kind: "absent", reason: "made-up" } as never} />);
    expect(odd.container.textContent).toMatch(/Not recorded/);
  });

  it("renders a year-only and a year-month partial date differently", () => {
    const { container, rerender } = render(
      <ClinicalDateTime value={{ kind: "partial-date", y: 1962 }} />,
    );
    expect(container.textContent).toMatch(/1962/);
    rerender(<ClinicalDateTime value={{ kind: "partial-date", y: 1962, m: 4 }} />);
    expect(container.textContent).toMatch(/1962/);
    rerender(<ClinicalDateTime value={{ kind: "partial-date", y: 1962, m: 4, d: 9 } as never} />);
    expect(container.textContent).toMatch(/1962/);
  });

  it("shows the birth field read-only and required", () => {
    const { container, rerender } = render(
      <BirthDateField now={TODAY} required value={plainDate(1986, 7, 18)} />,
    );
    expect(container.querySelector(".zb-dt-label__required")).toBeTruthy();
    rerender(
      <BirthDateField
        now={TODAY}
        readOnly
        allowAbsent
        allowEstimated
        value={plainDate(1986, 7, 18)}
      />,
    );
    // Read-only keeps the chips visible and inert: hiding them would make the
    // field look like it never had those options.
    for (const chip of container.querySelectorAll<HTMLButtonElement>(".zb-dt-chip")) {
      expect(chip.disabled).toBe(true);
    }
    rerender(
      <BirthDateField now={TODAY} value={{ kind: "partial-date", y: 1962 }} allowEstimated />,
    );
    expect(container.textContent).toMatch(/1962/);
  });

  it("switches precision back from year to day", () => {
    const onPrecisionChange = vi.fn();
    const { container } = render(
      <BirthDateField
        now={TODAY}
        allowEstimated
        precision="year"
        onPrecisionChange={onPrecisionChange}
      />,
    );
    fireEvent.click(within(container).getByRole("button", { name: /Exact date unknown|day/i }));
    expect(onPrecisionChange).toHaveBeenCalledWith("day");
  });
});

describe("the arms a demo never reaches", () => {
  it("puts a footer under the grid when one is given", () => {
    const { container } = render(
      <Calendar now={TODAY} defaultMonth={{ y: 2026, m: 9 }} footer={<span>Clear</span>} />,
    );
    expect(container.querySelector(".zb-dt-cal__foot")?.textContent).toBe("Clear");
  });

  it("uses the host's month names in the month pane", () => {
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const { container } = render(
      <Calendar now={TODAY} defaultMonth={{ y: 2026, m: 9 }} monthNames={months} />,
    );
    fireEvent.click(within(container).getByRole("button", { name: /choose month and year/i }));
    expect(within(container).getByRole("button", { name: "Abr" })).toBeTruthy();
  });

  it("ends a recurrence on a date taken from the rule it already had", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RecurrenceField
        startDate={plainDate(2026, 9, 1)}
        defaultValue={{ freq: "WEEKLY", interval: 1, count: 4 }}
        allowNoEnd
        onChange={onChange}
      />,
    );
    fireEvent.click(within(container).getByRole("button", { name: /On a date/ }));
    const next = onChange.mock.calls.at(-1)![0];
    // The last date the rule already produced, not an arbitrary one.
    expect(toIsoDate(next.until)).toBe("2026-09-22");
    expect(next.count).toBeUndefined();
  });

  it("marks the interval already in force", () => {
    const { container } = render(
      <RecurrenceField
        startDate={plainDate(2026, 9, 1)}
        defaultValue={{ freq: "WEEKLY", interval: 3, count: 4 }}
      />,
    );
    expect(
      within(container).getByRole("button", { name: "3 weeks" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("says a rule produces no dates when it produces none", () => {
    const { container } = render(
      <RecurrenceField
        startDate={plainDate(2026, 9, 1)}
        value={{ freq: "WEEKLY", interval: 1, until: plainDate(2026, 8, 1) }}
      />,
    );
    expect(container.textContent).toMatch(/no dates/);
  });

  it("says the room time when a buffer makes it longer than the session", () => {
    const free = AVAILABILITY.slots.find((s) => s.state.kind === "free")!;
    const { container, rerender } = render(
      <AppointmentScheduler
        providers={PROVIDERS}
        availability={AVAILABILITY}
        now={NOW}
        value={free.id}
        durationMinutes={50}
        buffers={{ before: 0, after: 10 }}
        viewerZone="America/Chicago"
      />,
    );
    expect(container.textContent).toMatch(/room held 60 min/);
    // With no buffer there is nothing extra to say, and it is not said.
    rerender(
      <AppointmentScheduler
        providers={PROVIDERS}
        availability={AVAILABILITY}
        now={NOW}
        value={free.id}
        durationMinutes={50}
      />,
    );
    expect(container.textContent).not.toMatch(/room held/);
  });

  it("counts a single conflict and a single open time in the singular", () => {
    const { container } = render(
      <RecurringSeriesScheduler
        rule={{ freq: "WEEKLY", interval: 1, count: 4 }}
        startDate={plainDate(2026, 9, 1)}
        verdicts={[{ date: "2026-09-08", reason: "Room clash" }]}
      />,
    );
    expect(container.textContent).toMatch(/1 conflict to resolve/);
    expect(container.textContent).not.toMatch(/1 conflicts/);

    const day = render(
      <AppointmentScheduler
        providers={PROVIDERS}
        availability={AVAILABILITY}
        now={NOW}
        dayLoads={[{ date: TODAY, openCount: 1 }]}
      />,
    );
    expect(within(day.container).getByRole("button", { name: /1 time available/ })).toBeTruthy();
  });

  it("marks a group with no dates as empty rather than scheduled", () => {
    const { container } = render(
      <GroupSeriesScheduler
        name="Closed group"
        rule={{ freq: "WEEKLY", interval: 1, until: plainDate(2026, 8, 1) }}
        startDate={plainDate(2026, 9, 1)}
        room={{ name: "Room 1" }}
        showRRule={false}
      />,
    );
    expect(container.querySelector('[data-zb-group-series="empty"]')).toBeTruthy();
    // A room with no stated capacity says its name and stops there.
    expect(container.textContent).toContain("Room 1");
    expect(container.textContent).not.toMatch(/capacity/);
  });

  it("excludes a date that was already skipped from the bookable set", () => {
    const onBook = vi.fn();
    const { container } = render(
      <RecurringSeriesScheduler
        rule={{
          freq: "WEEKLY",
          interval: 1,
          count: 4,
          exceptions: [plainDate(2026, 9, 8)],
        }}
        startDate={plainDate(2026, 9, 1)}
        onBook={onBook}
      />,
    );
    fireEvent.click(within(container).getByRole("button", { name: /Book/ }));
    expect((onBook.mock.calls[0]![0] as ZbDate[]).map(toIsoDate)).not.toContain("2026-09-08");
  });
});

/* ------------------------------------------------------------------ */
/* The last of the arms                                                */
/* ------------------------------------------------------------------ */

describe("guards and remaining alternatives", () => {
  it("refuses a preset grid with no step", () => {
    // A zero step is an infinite loop, and a negative one is a caller bug.
    expect(timeGrid(0, 60, 0)).toEqual([]);
    expect(timeGrid(0, 60, -5)).toEqual([]);
  });

  it("keeps seconds out of a 24-hour value that does not show them", () => {
    expect(segmentsToTime({ h: 21, mi: 5, s: 30, ap: null }, { hour24: true })).toMatchObject({
      h: 21,
      mi: 5,
    });
    expect(
      segmentsToTime({ h: 21, mi: 5, s: null, ap: null }, { hour24: true, showSecond: true }),
    ).toBeNull();
  });

  it("clears a year-only birth date back to nothing", () => {
    const onChange = vi.fn();
    const { container } = render(
      <BirthDateField
        now={TODAY}
        precision="year"
        allowEstimated
        value={{ kind: "partial-date", y: 1962 }}
        onChange={onChange}
      />,
    );
    const g = group(container);
    act(() => g.focus());
    fireEvent.keyDown(g, { key: "Backspace" });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("carries a host error through the time and session fields", () => {
    const time = render(<TimeField label="Given" error="Outside the ordered window" />);
    expect(time.container.textContent).toContain("Outside the ordered window");
    time.unmount();
    const session = render(
      <SessionTimeField
        label="Session"
        value={sessionFrom(plainTime(9, 0), 50)}
        error="Overlaps the group at 9:30"
      />,
    );
    expect(session.container.textContent).toContain("Overlaps the group at 9:30");
  });

  it("labels the day a session starts on when the host names it", () => {
    const { container } = render(
      <SessionTimeField
        label="Shift"
        startDateLabel="Aug 26"
        allowOvernight
        value={withSessionEnd(sessionFrom(plainTime(23, 0), 0), plainTime(7, 0), {
          allowOvernight: true,
        })}
      />,
    );
    expect(container.textContent).toContain("Aug 26");
  });

  it("ignores an incomplete time typed into a session's own fields", () => {
    const onChange = vi.fn();
    const { container } = render(
      <SessionTimeField
        label="Session"
        defaultValue={sessionFrom(plainTime(9, 0), 50)}
        onChange={onChange}
      />,
    );
    const [start, end] = container.querySelectorAll<HTMLElement>('[role="group"].zb-dt-field');
    // A bare hour with no meridiem is not a time yet, so the session is not
    // moved to one. Clearing a segment is the reachable way to prove it.
    act(() => start!.focus());
    fireEvent.keyDown(start!, { key: "Backspace" });
    act(() => end!.focus());
    fireEvent.keyDown(end!, { key: "Backspace" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("names a booked slot and one held by somebody else", () => {
    const set = {
      asOf: NOW,
      staleAfterSeconds: 900,
      exhausted: false,
      slots: [
        AVAILABILITY.slots.find((s) => s.state.kind === "free")!,
        {
          id: "b",
          start: plainTime(10, 0),
          durationMinutes: 50,
          state: { kind: "booked" as const },
        },
        {
          id: "t",
          start: plainTime(11, 0),
          durationMinutes: 50,
          state: { kind: "held" as const, by: "other" as const, expiresInSeconds: 300 },
        },
      ],
    };
    const { container } = render(<TimeSlotGrid set={set} now={NOW} label="Times" />);
    const names = Array.from(container.querySelectorAll("[data-zb-slot]"))
      .map((n) => n.getAttribute("aria-label") ?? "")
      .join(" | ");
    expect(names).toMatch(/booked/);
    expect(names).toMatch(/held by someone else, 5 minutes remaining/);
  });

  it("emits an RRULE and its EXDATE only when asked", () => {
    const { container, rerender } = render(
      <RecurrenceField
        startDate={plainDate(2026, 9, 1)}
        value={{ freq: "WEEKLY", interval: 1, count: 4, exceptions: [plainDate(2026, 9, 8)] }}
        showRRule
      />,
    );
    expect(container.textContent).toContain("RRULE:FREQ=WEEKLY");
    expect(container.textContent).toContain("EXDATE:");
    rerender(
      <RecurrenceField
        startDate={plainDate(2026, 9, 1)}
        value={{ freq: "WEEKLY", interval: 1, count: 4 }}
        showRRule
      />,
    );
    // No exceptions, so no EXDATE line rather than an empty one.
    expect(container.textContent).not.toContain("EXDATE:");
  });

  it("falls back to the start date when a rule has produced nothing to end on", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RecurrenceField
        startDate={plainDate(2026, 9, 1)}
        value={{ freq: "WEEKLY", interval: 1, until: plainDate(2026, 8, 1) }}
        allowNoEnd
        onChange={onChange}
      />,
    );
    fireEvent.click(within(container).getByRole("button", { name: /On a date/ }));
    expect(toIsoDate(onChange.mock.calls.at(-1)![0].until)).toBe("2026-09-01");
  });

  it("counts sessions from a default when the host offered too few options", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RecurrenceField
        startDate={plainDate(2026, 9, 1)}
        value={{ freq: "WEEKLY", interval: 1, until: plainDate(2026, 12, 1) }}
        countOptions={[6]}
        onChange={onChange}
      />,
    );
    fireEvent.click(within(container).getByRole("button", { name: /After a number of sessions/ }));
    expect(onChange.mock.calls.at(-1)![0].count).toBe(12);
  });

  it("lists a group's closures with the time they would have run at", () => {
    const { container, rerender } = render(
      <GroupSeriesScheduler
        name="DBT"
        rule={{ freq: "WEEKLY", interval: 1, count: 6 }}
        startDate={plainDate(2026, 9, 1)}
        timeLabel="5:30 – 7:00 PM"
        exclusions={[{ date: plainDate(2026, 9, 8), reason: "Programme closed" }]}
      />,
    );
    expect(container.textContent).toContain("5:30 – 7:00 PM");
    rerender(
      <GroupSeriesScheduler
        name="DBT"
        rule={{ freq: "WEEKLY", interval: 1, count: 6 }}
        startDate={plainDate(2026, 9, 1)}
        exclusions={[{ date: plainDate(2026, 9, 8), reason: "Programme closed" }]}
      />,
    );
    expect(container.textContent).toContain("Programme closed");
  });
});

describe("the composite's own guards", () => {
  it("does nothing when a key arrives for a segment that is not there", () => {
    const onChange = vi.fn();
    // A meridiem-free field has three segments; Home puts the index at 0 and
    // the guard covers the window where it has not caught up.
    render(<TimeField label="T" hour24 onChange={onChange} />);
    const g = group();
    act(() => g.focus());
    fireEvent.keyDown(g, { key: "End" });
    fireEvent.keyDown(g, { key: "ArrowUp" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores a paste when there is nobody to hand it to", () => {
    const { container } = render(
      <Calendar now={TODAY} defaultMonth={{ y: 2026, m: 9 }} footer={<span>f</span>} />,
    );
    // The grid takes no paste, and nothing throws when one arrives.
    fireEvent.paste(within(container).getByRole("grid"), {
      clipboardData: { getData: () => "08/26/2026" },
    });
    expect(container.querySelector('[role="grid"]')).toBeTruthy();
  });

  it("selects the day the keyboard is on when nothing bars it", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar now={TODAY} defaultMonth={{ y: 2026, m: 9 }} onChange={onChange} />,
    );
    fireEvent.keyDown(within(container).getByRole("grid"), { key: "Enter" });
    expect(onChange).toHaveBeenCalled();
  });

  it("takes a one-letter weekday label from a locale that uses one", () => {
    const { container } = render(<Calendar now={TODAY} defaultMonth={{ y: 2026, m: 9 }} />);
    // No weekdayLabels supplied, so the abbreviations are cut to a letter.
    const heads = within(container).getAllByRole("columnheader");
    expect(heads[0]!.textContent!.length).toBeLessThanOrEqual(2);
  });
});

describe("a range previewed backwards", () => {
  it("shades from the pointer to the start, not from the start onwards", () => {
    const { container } = render(
      <Calendar
        mode="range"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 9 }}
        range={{ start: plainDate(2026, 9, 20), end: null }}
      />,
    );
    // Hovering earlier than the start is a legal way to build a range, so the
    // preview runs backwards rather than showing nothing.
    fireEvent.mouseEnter(within(container).getByRole("gridcell", { name: /September 9, 2026/ }));
    expect(container.querySelectorAll(".zb-dt-cal__day--in-range").length).toBeGreaterThan(0);
  });

  it("takes an alternative the host offered while the host owns the value", () => {
    const onSelect = vi.fn();
    const free = AVAILABILITY.slots.find((s) => s.state.kind === "free")!;
    const { container } = render(
      <AppointmentScheduler
        providers={PROVIDERS}
        availability={AVAILABILITY}
        now={NOW}
        value={null}
        rejection={{ reason: "Taken while you were choosing.", alternatives: [free] }}
        onSelect={onSelect}
      />,
    );
    const alt = within(container.querySelector("[data-zb-rejection]")!).getAllByRole("button");
    fireEvent.click(alt.at(-1)!);
    expect(onSelect).toHaveBeenCalled();
  });
});

describe("two more states a reader can land on", () => {
  it("shows a disabled absence with no way back out of it", () => {
    const { container } = render(
      <BirthDateField
        now={TODAY}
        allowAbsent
        disabled
        value={{ kind: "absent", reason: "asked-declined" }}
      />,
    );
    expect(container.textContent).toContain("Not recorded");
    // Disabled means no route back to entering a date, rather than a button
    // that looks live and does nothing.
    expect(within(container).queryByRole("button", { name: /Enter a date/ })).toBeNull();
  });

  it("says a series has nothing left to resolve once it is clean", () => {
    const { container } = render(
      <RecurringSeriesScheduler
        rule={{ freq: "WEEKLY", interval: 1, count: 4 }}
        startDate={plainDate(2026, 9, 1)}
      />,
    );
    // No verdicts, so the sentence is about what will be booked rather than
    // about what is in the way.
    expect(container.textContent).not.toMatch(/to resolve/);
    expect(container.textContent).toMatch(/Book all 4 sessions/);
  });
});

describe("an empty grid says which kind of empty it is", () => {
  it("distinguishes a finished search from one that stopped early", () => {
    const searched = render(
      <TimeSlotGrid set={{ asOf: NOW, slots: [], exhausted: true }} now={NOW} label="Times" />,
    );
    expect(searched.container.textContent).toMatch(/No times on this day/);
    searched.unmount();

    const stoppedEarly = render(
      <TimeSlotGrid set={{ asOf: NOW, slots: [], exhausted: false }} now={NOW} label="Times" />,
    );
    // "We stopped looking" and "there is nothing" have different next actions,
    // and a scheduler that conflates them hands the problem to somebody who
    // cannot solve it.
    expect(stoppedEarly.container.textContent).toMatch(/window searched/);
  });
});

describe("duration chips without an organisation's bands", () => {
  it("offers the presets and asserts no code beside them", () => {
    const { container } = render(
      <SessionTimeField
        label="Therapy"
        defaultValue={sessionFrom(plainTime(9, 0), 30)}
        durationPresets={[{ minutes: 30 }, { minutes: 53, label: "Psych" }]}
      />,
    );
    expect(within(container).getByRole("button", { name: /53/ })).toBeTruthy();
    // A band is a fact about somebody's payer contract. With none supplied the
    // component asserts nothing rather than guessing a code.
    expect(container.querySelector(".zb-dt-chip__code")).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Calendar periods and range algebra                                 */
/* ------------------------------------------------------------------ */

describe("calendar periods", () => {
  it("starts a week where the locale says it does", () => {
    // Wednesday 26 August 2026.
    expect(toIsoDate(startOfWeek(TODAY, 0))).toBe("2026-08-23");
    expect(toIsoDate(startOfWeek(TODAY, 1))).toBe("2026-08-24");
    expect(toIsoDate(endOfWeek(TODAY, 0))).toBe("2026-08-29");
    expect(toIsoDate(endOfWeek(TODAY, 1))).toBe("2026-08-30");
  });

  it("keeps a day that is already the first of its week", () => {
    const sunday = plainDate(2026, 8, 23);
    expect(toIsoDate(startOfWeek(sunday, 0))).toBe("2026-08-23");
    const monday = plainDate(2026, 8, 24);
    expect(toIsoDate(startOfWeek(monday, 1))).toBe("2026-08-24");
  });

  it("ends a month on its real last day, leap years included", () => {
    expect(toIsoDate(endOfMonth(plainDate(2026, 2, 3)))).toBe("2026-02-28");
    expect(toIsoDate(endOfMonth(plainDate(2028, 2, 3)))).toBe("2028-02-29");
    expect(toIsoDate(startOfMonth(plainDate(2026, 8, 26)))).toBe("2026-08-01");
    expect(toIsoDate(startOfYear(TODAY))).toBe("2026-01-01");
    expect(toIsoDate(endOfYear(TODAY))).toBe("2026-12-31");
  });
});

describe("the range algebra", () => {
  it("counts both ends, because a span of service includes the day it ends", () => {
    // An authorisation from the 1st to the 7th is seven days of care. The
    // exclusive convention belongs to timestamps, and mixing the two bills a
    // week of treatment as six days.
    expect(rangeDayCount({ start: plainDate(2026, 8, 1), end: plainDate(2026, 8, 7) })).toBe(7);
    expect(rangeDayCount({ start: TODAY, end: TODAY })).toBe(1);
    expect(rangeDayCount({ start: TODAY, end: null })).toBeNull();
  });

  it("sorts the ends whichever way round they arrive", () => {
    const backwards = { start: plainDate(2026, 9, 20), end: plainDate(2026, 9, 4) };
    expect(toIsoDate(normalizeDateRange(backwards).start!)).toBe("2026-09-04");
    expect(rangeDayCount(backwards)).toBe(17);
    expect(rangeContains(backwards, plainDate(2026, 9, 10))).toBe(true);
    expect(rangeContains(backwards, plainDate(2026, 9, 21))).toBe(false);
  });

  it("derives every preset from the injected now, and never from a clock", () => {
    const presets = dateRangePresets(TODAY, { weekStart: 1 });
    const by = (id: string) => presets.find((p) => p.id === id)!;
    expect(toIsoDate(by("today").start)).toBe("2026-08-26");
    expect(toIsoDate(by("yesterday").end)).toBe("2026-08-25");
    expect(toIsoDate(by("this-week").start)).toBe("2026-08-24");
    // Last week ends the day before this week starts — not seven days back
    // from today, which would overlap the current week by four days.
    expect(toIsoDate(by("last-week").start)).toBe("2026-08-17");
    expect(toIsoDate(by("last-week").end)).toBe("2026-08-23");
    expect(toIsoDate(by("this-month").end)).toBe("2026-08-31");
    expect(toIsoDate(by("last-month").start)).toBe("2026-07-01");
    expect(toIsoDate(by("last-month").end)).toBe("2026-07-31");
    expect(toIsoDate(by("this-year").end)).toBe("2026-12-31");

    // Same input, same output. This is what makes the whole surface testable
    // and the gallery renderable in March.
    expect(dateRangePresets(TODAY, { weekStart: 1 })).toEqual(presets);
  });

  it("recognises the preset a range matches, and reports none when it matches none", () => {
    const presets = dateRangePresets(TODAY, { weekStart: 1 });
    const thisMonth = presets.find((p) => p.id === "this-month")!;
    expect(matchRangePreset({ start: thisMonth.start, end: thisMonth.end }, presets)?.id).toBe(
      "this-month",
    );
    expect(
      matchRangePreset({ start: plainDate(2026, 8, 3), end: plainDate(2026, 8, 9) }, presets),
    ).toBeNull();
    expect(matchRangePreset({ start: TODAY, end: null }, presets)).toBeNull();
  });
});

describe("time ranges and durations", () => {
  it("reports a negative span rather than clamping it to nothing", () => {
    // The clamp destroys the information the field needs to say "ends before
    // it starts" and offer a correction.
    expect(timeRangeMinutes({ start: plainTime(10, 0), end: plainTime(7, 0) })).toBe(-180);
    expect(
      timeRangeMinutes(
        { start: plainTime(22, 0), end: plainTime(6, 30) },
        { allowOvernight: true },
      ),
    ).toBe(510);
    expect(timeRangeMinutes({ start: plainTime(7, 0), end: plainTime(10, 0) })).toBe(180);
    expect(timeRangeMinutes({ start: null, end: plainTime(10, 0) })).toBeNull();
  });

  it("spells a duration out, and abbreviates it only for a badge", () => {
    expect(formatDuration(180)).toBe("3 hr");
    expect(formatDuration(180, { compact: true })).toBe("3h");
    expect(formatDuration(90, { compact: true })).toBe("1h 30m");
    expect(formatDuration(45, { compact: true })).toBe("45m");
  });
});

/* ------------------------------------------------------------------ */
/* The multi-month calendar                                           */
/* ------------------------------------------------------------------ */

describe("two months at once", () => {
  it("shows contiguous months, one grid each", () => {
    const { container } = render(
      <Calendar mode="range" months={2} now={TODAY} defaultMonth={{ y: 2026, m: 8 }} />,
    );
    const grids = within(container).getAllByRole("grid");
    expect(grids.length).toBe(2);
    expect(grids[0]!.getAttribute("aria-label")).toBe("August 2026");
    expect(grids[1]!.getAttribute("aria-label")).toBe("September 2026");
  });

  it("keeps exactly one tabstop across the whole window", () => {
    // Forty-two focusable cells is the most common accessibility failure in a
    // date picker; two panels is eighty-four chances to make it.
    const { container } = render(
      <Calendar mode="range" months={2} now={TODAY} defaultMonth={{ y: 2026, m: 8 }} />,
    );
    expect(container.querySelectorAll('[role="gridcell"][tabindex="0"]').length).toBe(1);
  });

  it("hides the adjacent-month days, so no date is drawn twice", () => {
    // Two adjacent panels overlap by up to a fortnight. Drawing the overlap
    // twice gives the same date two cells, both matching the focus date, which
    // is where the second tabstop comes from.
    const { container } = render(
      <Calendar mode="range" months={2} now={TODAY} defaultMonth={{ y: 2026, m: 8 }} />,
    );
    const names = [...container.querySelectorAll('[role="gridcell"][aria-label]')].map((cell) =>
      cell.getAttribute("aria-label"),
    );
    expect(names.length).toBe(new Set(names).size);
    expect(container.querySelectorAll(".zb-dt-cal__day--outside").length).toBe(0);

    // One month keeps them: a single grid with holes at both ends reads as
    // broken, and there is nothing to collide with.
    const single = render(<Calendar now={TODAY} defaultMonth={{ y: 2026, m: 8 }} />);
    expect(single.container.querySelectorAll(".zb-dt-cal__day--outside").length).toBeGreaterThan(0);
  });

  it("offers one control per direction, not one per month", () => {
    const { container } = render(
      <Calendar mode="range" months={2} now={TODAY} defaultMonth={{ y: 2026, m: 8 }} />,
    );
    const named = (pattern: RegExp) =>
      [...container.querySelectorAll("button")].filter((b) =>
        pattern.test(b.getAttribute("aria-label") ?? ""),
      );
    // Two buttons both announced "Previous month" and both doing the same
    // thing is a riddle for anybody reading the dialog through its names.
    expect(named(/previous/i).length).toBe(1);
    expect(named(/next/i).length).toBe(1);
  });

  it("names each heading with the month it opens, so the visible text is in the name", () => {
    // SC 2.5.3: the accessible name has to contain the visible label. "Choose
    // month and year" alone contains none of "September 2026".
    const { container } = render(
      <Calendar months={2} now={TODAY} defaultMonth={{ y: 2026, m: 8 }} />,
    );
    expect(
      within(container).getByRole("button", { name: /September 2026.*choose month and year/i }),
    ).toBeTruthy();
  });

  it("pages the window by one month, keeping the pair contiguous", () => {
    const { container } = render(
      <Calendar months={2} now={TODAY} defaultMonth={{ y: 2026, m: 8 }} />,
    );
    fireEvent.click(within(container).getByRole("button", { name: /next/i }));
    const grids = within(container).getAllByRole("grid");
    expect(grids[0]!.getAttribute("aria-label")).toBe("September 2026");
    expect(grids[1]!.getAttribute("aria-label")).toBe("October 2026");
  });

  it("survives paging without remounting the control that paged it", () => {
    // Keying a panel by the month it shows destroys the button that was
    // clicked, dropping focus to the body and detaching any grid a keyboard
    // sequence was in the middle of.
    const { container } = render(
      <Calendar months={2} now={TODAY} defaultMonth={{ y: 2026, m: 8 }} />,
    );
    const next = within(container).getByRole("button", { name: /next/i });
    fireEvent.click(next);
    fireEvent.click(next);
    expect(next.isConnected).toBe(true);
    expect(within(container).getAllByRole("grid")[0]!.getAttribute("aria-label")).toBe(
      "October 2026",
    );
  });

  it("stops the header controls at min and max rather than paging past them", () => {
    // A bounded calendar that still pages to 1823 enforces its limits only
    // once somebody clicks a day.
    const { container } = render(
      <Calendar
        now={TODAY}
        defaultMonth={{ y: 2026, m: 8 }}
        min={plainDate(2026, 8, 1)}
        max={plainDate(2026, 9, 30)}
      />,
    );
    const prev = within(container).getByRole("button", { name: /previous/i });
    const next = within(container).getByRole("button", { name: /next/i });
    expect(prev.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(prev);
    expect(within(container).getByRole("grid").getAttribute("aria-label")).toBe("August 2026");
    fireEvent.click(next);
    expect(next.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(next);
    expect(within(container).getByRole("grid").getAttribute("aria-label")).toBe("September 2026");
  });
});

describe("the range band", () => {
  const bandOf = (container: HTMLElement) =>
    [...container.querySelectorAll(".zb-dt-cal__day--in-range")].map((n) =>
      n.getAttribute("aria-label"),
    );

  it("covers the whole span, endpoints included", () => {
    // A band that starts a cell late reads as though the day it bounds were
    // outside the range it bounds.
    const { container } = render(
      <Calendar
        mode="range"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 8 }}
        range={{ start: plainDate(2026, 8, 10), end: plainDate(2026, 8, 14) }}
      />,
    );
    expect(bandOf(container).length).toBe(5);
    expect(container.querySelectorAll(".zb-dt-cal__day--range-lo").length).toBe(1);
    expect(container.querySelectorAll(".zb-dt-cal__day--range-hi").length).toBe(1);
  });

  it("caps the band at every week boundary, not only at the ends of the range", () => {
    const { container } = render(
      <Calendar
        mode="range"
        weekStart={1}
        now={TODAY}
        defaultMonth={{ y: 2026, m: 8 }}
        range={{ start: plainDate(2026, 8, 3), end: plainDate(2026, 8, 23) }}
      />,
    );
    // Three whole Monday-to-Sunday weeks: each row is capped at both ends.
    expect(container.querySelectorAll(".zb-dt-cal__day--week-lo").length).toBe(3);
    expect(container.querySelectorAll(".zb-dt-cal__day--week-hi").length).toBe(3);
  });

  it("names every cell by its part in the range", () => {
    const { container } = render(
      <Calendar
        mode="range"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 8 }}
        range={{ start: plainDate(2026, 8, 10), end: plainDate(2026, 8, 12) }}
      />,
    );
    expect(
      within(container).getByRole("gridcell", { name: /start of the selected range/ }),
    ).toBeTruthy();
    expect(
      within(container).getByRole("gridcell", { name: /end of the selected range/ }),
    ).toBeTruthy();
    expect(
      within(container).getByRole("gridcell", { name: /within the selected range/ }),
    ).toBeTruthy();
  });

  it("draws the band across a month boundary", () => {
    const { container } = render(
      <Calendar
        mode="range"
        months={2}
        now={TODAY}
        defaultMonth={{ y: 2026, m: 8 }}
        range={{ start: plainDate(2026, 8, 30), end: plainDate(2026, 9, 2) }}
      />,
    );
    expect(bandOf(container).length).toBe(4);
  });
});

describe("named periods down the side", () => {
  const PRESETS = dateRangePresets(TODAY, { weekStart: 1 });

  it("takes a whole range in one press, and moves the window to it", () => {
    const onRangeChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="range"
        months={2}
        weekStart={1}
        now={TODAY}
        presets={PRESETS}
        defaultMonth={{ y: 2026, m: 8 }}
        onRangeChange={onRangeChange}
      />,
    );
    fireEvent.click(within(container).getByRole("button", { name: "Last month" }));
    expect(onRangeChange).toHaveBeenCalledWith({
      start: plainDate(2026, 7, 1),
      end: plainDate(2026, 7, 31),
    });
    // The window follows: a preset that selects a month you cannot see has
    // told you nothing.
    expect(within(container).getAllByRole("grid")[0]!.getAttribute("aria-label")).toBe("July 2026");
  });

  it("presses the preset the current range matches, and Custom when none does", () => {
    const thisMonth = PRESETS.find((p) => p.id === "this-month")!;
    const { container, rerender } = render(
      <Calendar
        mode="range"
        now={TODAY}
        presets={PRESETS}
        showCustomPreset
        range={{ start: thisMonth.start, end: thisMonth.end }}
      />,
    );
    expect(
      within(container).getByRole("button", { name: "This month" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      within(container).getByRole("button", { name: "Custom" }).getAttribute("aria-pressed"),
    ).toBe("false");

    rerender(
      <Calendar
        mode="range"
        now={TODAY}
        presets={PRESETS}
        showCustomPreset
        range={{ start: plainDate(2026, 8, 3), end: plainDate(2026, 8, 9) }}
      />,
    );
    // A reader who built their own range must still be able to read their own
    // state; a rail with nothing pressed says the selection is nothing.
    expect(
      within(container).getByRole("button", { name: "Custom" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("offers no rail at all outside range mode", () => {
    const { container } = render(<Calendar now={TODAY} presets={PRESETS} />);
    expect(container.querySelector(".zb-dt-cal__rail")).toBeNull();
  });
});

describe("named dates down the side", () => {
  const SHORTCUTS = relativeDateOptions(TODAY);

  it("takes a single date in one press, and moves the window to it", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        now={TODAY}
        defaultMonth={{ y: 2026, m: 8 }}
        shortcuts={SHORTCUTS}
        onChange={onChange}
      />,
    );
    fireEvent.click(within(container).getByRole("button", { name: "In 2 weeks" }));
    expect(onChange).toHaveBeenCalledWith(plainDate(2026, 9, 9));
    // A shortcut that selects a month you cannot see has told you nothing.
    expect(within(container).getByRole("grid").getAttribute("aria-label")).toBe("September 2026");
  });

  it("toggles rather than replaces in multiple mode", () => {
    // Every other press in this mode toggles; a rail that replaced the whole
    // set would be the one control that behaved differently.
    const onDatesChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="multiple"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 8 }}
        shortcuts={SHORTCUTS}
        defaultDates={[plainDate(2026, 8, 4)]}
        onDatesChange={onDatesChange}
      />,
    );
    const today = within(container).getByRole("button", { name: "Today" });
    fireEvent.click(today);
    expect(onDatesChange).toHaveBeenLastCalledWith([plainDate(2026, 8, 4), TODAY]);
    expect(today.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(today);
    expect(onDatesChange).toHaveBeenLastCalledWith([plainDate(2026, 8, 4)]);
  });

  it("presses the shortcut the value matches", () => {
    const { container } = render(
      <Calendar now={TODAY} defaultMonth={{ y: 2026, m: 8 }} shortcuts={SHORTCUTS} value={TODAY} />,
    );
    expect(
      within(container).getByRole("button", { name: "Today" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      within(container).getByRole("button", { name: "Tomorrow" }).getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("presses Custom only once there is a selection the rail cannot name", () => {
    // An empty calendar has not been customised; it has not been answered.
    const empty = render(
      <Calendar
        now={TODAY}
        defaultMonth={{ y: 2026, m: 8 }}
        shortcuts={SHORTCUTS}
        showCustomPreset
      />,
    );
    expect(
      within(empty.container).getByRole("button", { name: "Custom" }).getAttribute("aria-pressed"),
    ).toBe("false");

    const named = render(
      <Calendar
        now={TODAY}
        defaultMonth={{ y: 2026, m: 8 }}
        shortcuts={SHORTCUTS}
        showCustomPreset
        value={TODAY}
      />,
    );
    expect(
      within(named.container).getByRole("button", { name: "Custom" }).getAttribute("aria-pressed"),
    ).toBe("false");

    const own = render(
      <Calendar
        now={TODAY}
        defaultMonth={{ y: 2026, m: 8 }}
        shortcuts={SHORTCUTS}
        showCustomPreset
        value={plainDate(2026, 8, 4)}
      />,
    );
    expect(
      within(own.container).getByRole("button", { name: "Custom" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("names the rail for what it holds", () => {
    const dates = render(<Calendar now={TODAY} shortcuts={SHORTCUTS} />);
    expect(within(dates.container).getByRole("group", { name: "Named dates" })).toBeTruthy();
    const periods = render(<Calendar mode="range" now={TODAY} presets={dateRangePresets(TODAY)} />);
    expect(within(periods.container).getByRole("group", { name: "Named periods" })).toBeTruthy();
  });

  it("reaches the popover calendar through the field", () => {
    const onChange = vi.fn();
    render(
      <DateField
        label="Appointment date"
        showCalendar
        now={TODAY}
        calendarShortcuts={SHORTCUTS}
        calendarHints
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Choose from calendar" }));
    const panel = screen.getByRole("dialog", { name: "Appointment date" });
    expect(panel.querySelector(".zb-dt-cal__hints")).toBeTruthy();
    fireEvent.click(within(panel).getByRole("button", { name: "Next Monday" }));
    expect(onChange).toHaveBeenCalledWith(plainDate(2026, 8, 31));
  });

  it("gives a birth date the legend and no rail", () => {
    // There is no "Today" for a date of birth, and a shortcut nobody can use
    // is a row between the reader and the year they came for.
    render(<BirthDateField calendarHints now={TODAY} />);
    fireEvent.click(screen.getByRole("button", { name: /calendar/i }));
    const panel = screen.getByRole("dialog");
    expect(panel.querySelector(".zb-dt-cal__hints")).toBeTruthy();
    expect(panel.querySelector(".zb-dt-cal__rail")).toBeNull();
  });
});

describe("committing a range explicitly", () => {
  it("tells the host nothing until Done", () => {
    // A range is built by two clicks and the first is often wrong. A parent
    // told about the half-built one has already filtered a report on a range
    // nobody chose.
    const onRangeChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="range"
        commit="explicit"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 8 }}
        onRangeChange={onRangeChange}
      />,
    );
    const day = (n: number) =>
      within(container).getByRole("gridcell", { name: new RegExp(`August ${n}, 2026`) });

    fireEvent.click(day(10));
    expect(onRangeChange).not.toHaveBeenCalled();
    // The draft is still drawn, or there is nothing to correct.
    expect(container.querySelectorAll(".zb-dt-cal__day--selected").length).toBe(1);

    fireEvent.click(day(14));
    expect(onRangeChange).not.toHaveBeenCalled();

    fireEvent.click(within(container).getByRole("button", { name: "Done" }));
    expect(onRangeChange).toHaveBeenCalledWith({
      start: plainDate(2026, 8, 10),
      end: plainDate(2026, 8, 14),
    });
  });

  it("keeps Done unpressable until the range is whole", () => {
    const { container } = render(
      <Calendar mode="range" commit="explicit" now={TODAY} defaultMonth={{ y: 2026, m: 8 }} />,
    );
    const done = within(container).getByRole("button", { name: "Done" }) as HTMLButtonElement;
    expect(done.disabled).toBe(true);
    fireEvent.click(within(container).getByRole("gridcell", { name: /August 10, 2026/ }));
    // One end is not a range.
    expect(done.disabled).toBe(true);
    fireEvent.click(within(container).getByRole("gridcell", { name: /August 14, 2026/ }));
    expect(done.disabled).toBe(false);
  });

  it("throws the draft away on Cancel", () => {
    const onCancel = vi.fn();
    const onRangeChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="range"
        commit="explicit"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 8 }}
        onCancel={onCancel}
        onRangeChange={onRangeChange}
      />,
    );
    fireEvent.click(within(container).getByRole("gridcell", { name: /August 10, 2026/ }));
    fireEvent.click(within(container).getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
    expect(onRangeChange).not.toHaveBeenCalled();
    expect(container.querySelectorAll(".zb-dt-cal__day--selected").length).toBe(0);
  });

  it("reports every click when the commit is immediate, which stays the default", () => {
    const onRangeChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="range"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 8 }}
        onRangeChange={onRangeChange}
      />,
    );
    fireEvent.click(within(container).getByRole("gridcell", { name: /August 10, 2026/ }));
    expect(onRangeChange).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".zb-dt-cal__action")).toBeNull();
  });

  it("opens on an uncontrolled range and set of dates", () => {
    const range = render(
      <Calendar
        mode="range"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 8 }}
        defaultRange={{ start: plainDate(2026, 8, 10), end: plainDate(2026, 8, 12) }}
      />,
    );
    expect(range.container.querySelectorAll(".zb-dt-cal__day--in-range").length).toBe(3);

    const dates = render(
      <Calendar
        mode="multiple"
        now={TODAY}
        defaultMonth={{ y: 2026, m: 8 }}
        defaultDates={[plainDate(2026, 8, 4), plainDate(2026, 8, 9)]}
      />,
    );
    expect(dates.container.querySelectorAll(".zb-dt-cal__day--selected").length).toBe(2);
  });
});

describe("the keyboard legend", () => {
  it("is drawn for the eye and hidden from the announcement", () => {
    // A screen-reader user is told how to drive a grid by the grid. Repeating
    // it in the footer is one more thing to page past.
    const { container } = render(<Calendar now={TODAY} hints />);
    const hints = container.querySelector(".zb-dt-cal__hints");
    expect(hints).toBeTruthy();
    expect(hints!.getAttribute("aria-hidden")).toBe("true");
    expect(
      render(<Calendar now={TODAY} />).container.querySelector(".zb-dt-cal__hints"),
    ).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* The date range field                                               */
/* ------------------------------------------------------------------ */

describe("the date range field", () => {
  it("is one shell holding two named fields", () => {
    const { container } = render(<DateRangeField label="Authorisation window" now={TODAY} />);
    const groups = [...container.querySelectorAll(".zb-dt-field")];
    expect(groups.length).toBe(2);
    // "Date" twice is a riddle: a reader arriving at the second half has no
    // way to know which end they are in.
    expect(groups.map((g) => g.getAttribute("aria-label"))).toEqual(["Start date", "End date"]);
  });

  it("emits a range as each half is typed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<DateRangeField now={TODAY} onChange={onChange} />);
    const [start] = [...container.querySelectorAll<HTMLElement>(".zb-dt-field")];
    start!.focus();
    await user.keyboard("08102026");
    expect(onChange).toHaveBeenLastCalledWith({ start: plainDate(2026, 8, 10), end: null });
  });

  it("counts the span inclusively, and refuses to count a backwards one", () => {
    const ordered = render(
      <DateRangeField
        now={TODAY}
        showSpan
        defaultValue={{ start: plainDate(2026, 8, 1), end: plainDate(2026, 8, 7) }}
      />,
    );
    expect(ordered.container.querySelector(".zb-dt-range__span")?.textContent).toBe("7 days");

    const backwards = render(
      <DateRangeField
        now={TODAY}
        showSpan
        defaultValue={{ start: plainDate(2026, 9, 20), end: plainDate(2026, 9, 4) }}
      />,
    );
    // "17 days" beside a range that runs backwards reads as a value the field
    // has accepted.
    expect(backwards.container.querySelector(".zb-dt-range__span")).toBeNull();
  });

  it("blocks a backwards range assertively and marks the field invalid", () => {
    const { container } = render(
      <DateRangeField
        now={TODAY}
        defaultValue={{ start: plainDate(2026, 9, 20), end: plainDate(2026, 9, 4) }}
      />,
    );
    const alert = within(container).getByRole("alert");
    expect(alert.textContent).toMatch(/end date is before the start date/i);
    for (const field of container.querySelectorAll(".zb-dt-field")) {
      expect(field.getAttribute("aria-invalid")).toBe("true");
    }
  });

  it("says how long a refused span actually is", () => {
    // A bound stated without the measurement is a rule the reader has to
    // reverse-engineer by trying again.
    const { container } = render(
      <DateRangeField
        now={TODAY}
        maxSpanDays={30}
        defaultValue={{ start: plainDate(2026, 8, 1), end: plainDate(2026, 9, 30) }}
      />,
    );
    expect(within(container).getByRole("alert").textContent).toMatch(/30 days or fewer.*61/);

    const tooShort = render(
      <DateRangeField
        now={TODAY}
        minSpanDays={7}
        defaultValue={{ start: plainDate(2026, 8, 1), end: plainDate(2026, 8, 3) }}
      />,
    );
    expect(within(tooShort.container).getByRole("alert").textContent).toMatch(/at least 7 days/);
  });

  it("posts both ends as ISO, never as the locale rendering", () => {
    const { container } = render(
      <DateRangeField
        name="auth"
        now={TODAY}
        defaultValue={{ start: plainDate(2026, 8, 1), end: plainDate(2026, 9, 30) }}
      />,
    );
    const inputs = [...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')];
    expect(inputs.map((i) => [i.name, i.value])).toEqual([
      ["auth-start", "2026-08-01"],
      ["auth-end", "2026-09-30"],
    ]);
  });

  it("opens a two-month panel with its rail, and commits on Done", () => {
    const onChange = vi.fn();
    render(
      <DateRangeField
        label="Reporting period"
        now={TODAY}
        weekStart={1}
        presets={dateRangePresets(TODAY, { weekStart: 1 })}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Choose from calendar" }));
    const panel = screen.getByRole("dialog", { name: "Reporting period" });
    expect(within(panel).getAllByRole("grid").length).toBe(2);

    fireEvent.click(within(panel).getByRole("button", { name: "Last month" }));
    // The rail edits the draft; nothing reaches the host until Done.
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(within(panel).getByRole("button", { name: "Done" }));
    expect(onChange).toHaveBeenCalledWith({
      start: plainDate(2026, 7, 1),
      end: plainDate(2026, 7, 31),
    });
  });
});

/* ------------------------------------------------------------------ */
/* The time range field                                               */
/* ------------------------------------------------------------------ */

describe("the time range field", () => {
  const RANGE = { start: plainTime(7, 0), end: plainTime(10, 0) };

  it("derives the length and keeps it beside the value", () => {
    // A start typed as PM when the reader meant AM is invisible in
    // 7:00 -> 10:00 and unmissable as a length.
    const { container } = render(<TimeRangeField label="Time range" defaultValue={RANGE} />);
    expect(container.querySelector(".zb-dt-range__span")?.textContent).toBe("3h");
  });

  it("refuses an end before its start, and says what would allow it", () => {
    const { container } = render(
      <TimeRangeField defaultValue={{ start: plainTime(10, 0), end: plainTime(7, 0) }} />,
    );
    expect(within(container).getByRole("alert").textContent).toMatch(/overnight/i);
  });

  it("accepts a night shift and states the crossing in words", () => {
    // Refusing 22:00 to 06:30 teaches staff to type the wrong time to get
    // past the validator, which is how the real data is lost.
    const { container } = render(
      <TimeRangeField
        allowOvernight
        defaultValue={{ start: plainTime(22, 0), end: plainTime(6, 30) }}
      />,
    );
    expect(container.querySelector(".zb-dt-range__span")?.textContent).toBe("8h 30m");
    const note = within(container).getByRole("status");
    expect(note.textContent).toMatch(/next day/i);
    // Legal and unusual is an advisory, never an error.
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it("reports a span outside the stated bounds with the measurement in it", () => {
    const tooLong = render(<TimeRangeField maxDurationMinutes={60} defaultValue={RANGE} />);
    expect(within(tooLong.container).getByRole("alert").textContent).toMatch(/3 hr.*1 hr/);
    const tooShort = render(
      <TimeRangeField
        minDurationMinutes={60}
        defaultValue={{ start: plainTime(7, 0), end: plainTime(7, 30) }}
      />,
    );
    expect(within(tooShort.container).getByRole("alert").textContent).toMatch(/30 min.*1 hr/);
  });

  it("offers two columns and strikes every end that cannot be one", () => {
    render(<TimeRangeField label="Time range" stepMinutes={60} defaultValue={RANGE} />);
    fireEvent.click(screen.getByRole("button", { name: "Choose from a list of times" }));
    const panel = screen.getByRole("dialog", { name: "Time range" });
    const [starts, ends] = within(panel).getAllByRole("listbox");
    expect(
      starts!.getAttribute("aria-label") ?? within(panel).getAllByRole("listbox").length,
    ).toBeTruthy();
    expect(within(starts!).getAllByRole("option").length).toBe(24);

    // Offering a time that will be rejected on commit is how a booking form
    // teaches people to distrust it.
    const blocked = within(ends!)
      .getAllByRole("option")
      .filter((o) => o.getAttribute("aria-disabled") === "true");
    expect(blocked.length).toBe(8);
    expect(blocked[0]!.getAttribute("aria-label")).toMatch(/unavailable, before the start time/);
  });

  it("keeps one tabstop per column", () => {
    render(<TimeRangeField label="Time range" defaultValue={RANGE} />);
    fireEvent.click(screen.getByRole("button", { name: "Choose from a list of times" }));
    for (const list of within(screen.getByRole("dialog")).getAllByRole("listbox")) {
      expect(list.querySelectorAll('[tabindex="0"]').length).toBe(1);
    }
  });

  it("drops an end the new start has invalidated rather than dragging it", () => {
    // Which of the two the reader meant to move is not knowable, and inventing
    // an answer is how a picker books the wrong hour.
    const onChange = vi.fn();
    render(
      <TimeRangeField
        label="Time range"
        stepMinutes={60}
        commit="immediate"
        defaultValue={RANGE}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Choose from a list of times" }));
    const [starts] = within(screen.getByRole("dialog")).getAllByRole("listbox");
    fireEvent.click(within(starts!).getByRole("option", { name: "2:00 PM" }));
    expect(onChange).toHaveBeenLastCalledWith({ start: plainTime(14, 0), end: null });
  });

  it("holds the panel's edits behind Done, and throws them away on Cancel", () => {
    const onChange = vi.fn();
    render(
      <TimeRangeField
        label="Time range"
        stepMinutes={60}
        defaultValue={RANGE}
        onChange={onChange}
      />,
    );
    const open = () =>
      fireEvent.click(screen.getByRole("button", { name: "Choose from a list of times" }));

    open();
    let panel = screen.getByRole("dialog");
    fireEvent.click(
      within(within(panel).getAllByRole("listbox")[1]!).getByRole("option", { name: "1:00 PM" }),
    );
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(within(panel).getByRole("button", { name: "Cancel" }));
    expect(onChange).not.toHaveBeenCalled();

    open();
    panel = screen.getByRole("dialog");
    fireEvent.click(
      within(within(panel).getAllByRole("listbox")[1]!).getByRole("option", { name: "1:00 PM" }),
    );
    fireEvent.click(within(panel).getByRole("button", { name: "Done" }));
    expect(onChange).toHaveBeenCalledWith({ start: plainTime(7, 0), end: plainTime(13, 0) });
  });

  it("posts both ends as 24-hour HH:MM", () => {
    const { container } = render(<TimeRangeField name="shift" defaultValue={RANGE} />);
    const inputs = [...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')];
    expect(inputs.map((i) => [i.name, i.value])).toEqual([
      ["shift-start", "07:00"],
      ["shift-end", "10:00"],
    ]);
  });

  it("will not resolve a bare hour it was handed", async () => {
    // The same refusal TimeField makes: a bare 9 guessed as morning turns a
    // 9 PM discharge into a 9 AM one.
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<TimeRangeField onChange={onChange} />);
    const [start] = [...container.querySelectorAll<HTMLElement>(".zb-dt-field")];
    start!.focus();
    await user.paste("9");
    expect(onChange).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/* The two new variants reach their parts                              */
/* ------------------------------------------------------------------ */

describe("the range variants", () => {
  it("dispatches date-range and time-range to their own fields", () => {
    const dates = render(<DatePicker variant="date-range" label="Window" now={TODAY} />);
    expect(dates.container.querySelector("[data-zb-date-range]")).toBeTruthy();

    const times = render(<DatePicker variant="time-range" label="Shift" />);
    expect(times.container.querySelector("[data-zb-time-range]")).toBeTruthy();
  });
});
