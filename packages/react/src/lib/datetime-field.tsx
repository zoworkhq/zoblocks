"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/lib/datetime-field.tsx. Edit that file, not this one.
/**
 * The React core shared by every date and time control: the segmented field,
 * the calendar grid, and the small pieces both of them render.
 *
 * Split from `@/lib/oxygen-datetime` on purpose. That module is the temporal
 * engine — pure, synchronous, serialisable in and out, and testable to the
 * year 2400 without a DOM. This one is the behaviour: roving tabstops, typing
 * buffers, focus management and ARIA. Keeping them apart is what lets four
 * thousand timezone assertions run in milliseconds and what makes it obvious,
 * when something is wrong, which half to look in.
 *
 * The segmented field is the highest-leverage control in the set. A clinician
 * touches a date forty times a day, and the difference between eight
 * keystrokes and four clicks is the difference between a component people use
 * and one they route around. Four defects were found by driving an earlier
 * prototype of it from a console rather than by reading it, and each one has a
 * comment here saying what it was.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";
import {
  MONTH_ABBREVIATIONS,
  MONTH_NAMES,
  WEEKDAY_ABBREVIATIONS,
  WEEKDAY_NAMES,
  addCalendarDays,
  addCalendarMonths,
  buildMonthGrid,
  compareDates,
  daysInMonth,
  formatPlainDate,
  isSameDate,
  weekdayOf,
  weekdayOrder,
  type CalendarCell,
  type MonthRef,
  type OxDate,
} from "../lib/datetime";

/* ------------------------------------------------------------------ */
/* Controlled / uncontrolled                                          */
/* ------------------------------------------------------------------ */

/**
 * Not exported: the npm barrel is flat, `useControllable` already belongs to
 * Switch, and a second hook with the same job under a near-identical name is
 * how two components come to disagree about what "controlled" means.
 */
function useControlled<T>(controlled: T | undefined, initial: T): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(initial);
  const isControlled = controlled !== undefined;
  const set = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
    },
    [isControlled],
  );
  return [isControlled ? (controlled as T) : uncontrolled, set];
}

export { useControlled as useTemporalValue };

/**
 * Keeps a segment buffer in step with a controlled value — including the case
 * where the host refuses the change.
 *
 * A segmented field cannot render straight from its value: half of "0826" is
 * not a date, so the buffer has to be state. That state then has to be
 * reconciled with the prop, and an effect keyed on the value cannot do it. A
 * controlled host that rejects a change re-renders with the *same* value it
 * had before, so nothing in the dependency array changes, the effect never
 * runs, and the field goes on showing the value the host just refused. That is
 * the oldest bug in controlled inputs and the one React's own `<input>` avoids
 * by rewriting the DOM value on every render.
 *
 * So the comparison happens on every render, against what this field last
 * emitted rather than against the previous prop. Sync when they disagree; stay
 * out of the way when they do not, which is what protects a half-typed buffer
 * from the parent's one-keystroke-stale echo. `valueKey` is a serialisation
 * rather than the value itself because temporal values are plain objects and a
 * host that maps over them produces a new identity for the same date.
 *
 * Returns the function to call with each emitted value, so the field records
 * what it asked for.
 */
export function useValueSync(valueKey: string, sync: () => void): (emittedKey: string) => void {
  const emitted = React.useRef(valueKey);
  if (valueKey !== emitted.current) {
    emitted.current = valueKey;
    sync();
  }
  return React.useCallback((next: string) => {
    emitted.current = next;
  }, []);
}

/* ------------------------------------------------------------------ */
/* Segments                                                           */
/* ------------------------------------------------------------------ */

/** One unit of a segmented field. Never a free-text input. */
export interface FieldSegment {
  key: string;
  /** Digits it can hold. The year is 4, everything else is 2, meridiem is 1. */
  length: number;
  min: number;
  max: number;
  /** Shown when empty. Never a zero — an empty field is not midnight. */
  placeholder: string;
  /** The accessible name. "Month", not "MM". */
  label: string;
  /** Arrow-key step. Minutes step by 5 so the common case is one press. */
  step?: number;
  /** Wider track for the year. */
  wide?: boolean;
  /** Suppress the separator before this segment — the meridiem takes a space. */
  noSeparator?: boolean;
  /** Renders a value that is not a number, e.g. AM/PM. */
  format?: (value: number) => string;
  /**
   * A ceiling that depends on the other segments.
   *
   * The day is the only one that needs it, and it is the reason the whole
   * mechanism exists: 31 is a legal day in January and not in February, and
   * 29 February is legal in 2028 and not in 2027. Bounding the day statically
   * at 31 means the field accepts 30 February and something downstream
   * complains about it later — which is precisely the design this component
   * exists to argue against. The bound is enforced on entry, on the arrow
   * keys, and again whenever the month or year moves under a day already
   * entered.
   */
  maxFrom?: (values: SegmentValues) => number;
}

export type SegmentValues = Record<string, number | null>;

export const DATE_SEGMENTS: Record<"M" | "D" | "Y", FieldSegment> = {
  M: { key: "m", length: 2, min: 1, max: 12, placeholder: "MM", label: "Month" },
  D: {
    key: "d",
    length: 2,
    min: 1,
    max: 31,
    /*
     * The largest value still legal given what is known.
     *
     * With no month yet — the MDY order's first keystroke, and every paste —
     * that is 31. With a month but no year it is that month in a leap year,
     * so 29 February stays enterable while 30 February never is. The year
     * then re-bounds it on commit: 29 February 2027 clamps to the 28th,
     * rather than being accepted here and complained about somewhere else.
     */
    maxFrom: (values) => (values.m == null ? 31 : daysInMonth(values.y ?? 2000, values.m)),
    placeholder: "DD",
    label: "Day",
  },
  Y: { key: "y", length: 4, min: 1, max: 9999, placeholder: "YYYY", label: "Year", wide: true },
};

export function dateSegments(order: "MDY" | "DMY" | "YMD" = "MDY"): FieldSegment[] {
  const { M, D, Y } = DATE_SEGMENTS;
  if (order === "DMY") return [D, M, Y];
  if (order === "YMD") return [Y, M, D];
  return [M, D, Y];
}

export function timeSegments(
  options: { hour24?: boolean; showSecond?: boolean } = {},
): FieldSegment[] {
  const hour: FieldSegment = {
    key: "h",
    length: 2,
    min: options.hour24 ? 0 : 1,
    max: options.hour24 ? 23 : 12,
    placeholder: "--",
    label: "Hour",
  };
  const minute: FieldSegment = {
    key: "mi",
    length: 2,
    min: 0,
    max: 59,
    placeholder: "--",
    label: "Minute",
    step: 5,
  };
  const second: FieldSegment = {
    key: "s",
    length: 2,
    min: 0,
    max: 59,
    placeholder: "--",
    label: "Second",
  };
  const meridiem: FieldSegment = {
    key: "ap",
    length: 1,
    min: 0,
    max: 1,
    placeholder: "--",
    label: "AM or PM",
    noSeparator: true,
    format: (value) => (value ? "PM" : "AM"),
  };

  const parts = [hour, minute];
  if (options.showSecond) parts.push(second);
  if (!options.hour24) parts.push(meridiem);
  return parts;
}

/* ------------------------------------------------------------------ */
/* The segmented field                                                */
/* ------------------------------------------------------------------ */

export interface SegmentedFieldProps {
  segments: FieldSegment[];
  values: SegmentValues;
  onValues: (next: SegmentValues, complete: boolean) => void;
  /** Group label. A field of three spinbuttons with no group name is a riddle. */
  label: string;
  separator?: string;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /**
   * Drops the border, the background and the focus ring.
   *
   * For a field that is one half of a larger shell — a range's start beside
   * its end — where the box and the ring belong to the shell. Two bordered
   * boxes with an arrow between them read as two questions; one box with two
   * values in it reads as the one question it is.
   */
  bare?: boolean;
  /** Renders a trigger button at the end — the calendar or clock affordance. */
  trigger?: { icon: React.ReactNode; label: string; expanded?: boolean; onPress: () => void };
  /**
   * Pasted text, handed over raw.
   *
   * Segments cannot accept a paste on their own, and refusing one is worse
   * than it sounds: a date copied out of a referral letter or a lab report is
   * how a great deal of clinical data actually moves between systems. The
   * caller parses, because what "07/18/86" means depends on the field.
   */
  onPasteText?: (text: string) => void;
  describedBy?: string;
  className?: string;
  id?: string;
}

export interface SegmentedFieldHandle {
  focusSegment: (index: number) => void;
  element: HTMLDivElement | null;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

export const SegmentedField = React.forwardRef<SegmentedFieldHandle, SegmentedFieldProps>(
  function SegmentedField(props, ref) {
    const {
      segments,
      values,
      onValues,
      label,
      separator = "/",
      invalid,
      disabled,
      readOnly,
      bare,
      trigger,
      onPasteText,
      describedBy,
      className,
      id,
    } = props;

    const rootRef = React.useRef<HTMLDivElement>(null);
    const reactId = React.useId();
    const segmentId = (key: string) => `${id ?? reactId}-${key}`;
    const [index, setIndex] = React.useState(0);
    const [typed, setTyped] = React.useState("");
    const [focused, setFocused] = React.useState(false);
    // Whether focus arrived from a click on a specific segment. A click chooses
    // where entry begins; a Tab always begins at the first segment.
    const fromSegment = React.useRef(false);

    React.useImperativeHandle(ref, () => ({
      focusSegment: (next: number) => {
        fromSegment.current = true;
        setIndex(next);
        rootRef.current?.focus();
      },
      element: rootRef.current,
    }));

    /** The live ceiling for a segment, given what the others currently hold. */
    const maxOf = (segment: FieldSegment, from: SegmentValues = values) =>
      segment.maxFrom ? segment.maxFrom(from) : segment.max;

    /**
     * Writes a segment value up, re-bounding anything that depends on it.
     *
     * Typing 31 in the day and then 02 in the month has to leave a legal
     * date, and clamping is the only answer that does not silently discard
     * what the user typed in the other segment.
     *
     * `settled` is why this is not unconditional. A year grows a digit at a
     * time — 2, 20, 202, 2028 — and each of those is a real commit, so a
     * clamp that ran on every one would re-bound 29 February against the year
     * 2, decide it is not a leap year, and write the 28th before the user has
     * finished typing. Dependent bounds apply when a segment is finished,
     * never mid-buffer.
     */
    const commit = (next: SegmentValues, settled = true) => {
      const bounded = { ...next };
      if (settled) {
        for (const segment of segments) {
          if (!segment.maxFrom) continue;
          const held = bounded[segment.key];
          if (held == null) continue;
          const ceiling = maxOf(segment, bounded);
          if (held > ceiling) bounded[segment.key] = ceiling;
        }
      }
      onValues(
        bounded,
        segments.every((segment) => bounded[segment.key] != null),
      );
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled || readOnly) return;
      const segment = segments[index];
      if (!segment) return;

      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        const ceiling = maxOf(segment);
        let buffer = typed + event.key;
        let parsed = Number(buffer);
        if (buffer.length > segment.length || parsed > ceiling) {
          buffer = event.key;
          parsed = Number(buffer);
        }

        // Advance the moment no further digit could be valid: typing 9 in a
        // month jumps on, typing 1 waits for a possible 12. That single rule is
        // what makes eight keystrokes enough for a whole date.
        const canGrow = buffer.length < segment.length && parsed * 10 <= ceiling;

        if (!canGrow) {
          // Clamp on commit, never mid-buffer: 0 is an illegal hour and a legal
          // prefix of 09, so it has to be displayable without being stored.
          const clamped = Math.min(ceiling, Math.max(segment.min, parsed));
          commit({ ...values, [segment.key]: clamped });
          setTyped("");
          if (index < segments.length - 1) setIndex(index + 1);
        } else {
          if (parsed >= segment.min) commit({ ...values, [segment.key]: parsed }, false);
          setTyped(buffer);
        }
        return;
      }

      // The meridiem accepts its own letters, because that is what people type.
      if (segment.key === "ap" && /^[ap]$/i.test(event.key)) {
        event.preventDefault();
        commit({ ...values, ap: event.key.toLowerCase() === "p" ? 1 : 0 });
        setTyped("");
        return;
      }

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          if (index < segments.length - 1) setIndex(index + 1);
          setTyped("");
          return;
        case "ArrowLeft":
          event.preventDefault();
          if (index > 0) setIndex(index - 1);
          setTyped("");
          return;
        case "ArrowUp":
        case "ArrowDown": {
          event.preventDefault();
          const direction = event.key === "ArrowUp" ? 1 : -1;
          const current = values[segment.key];
          const step = segment.step ?? 1;
          const ceiling = maxOf(segment);
          let next =
            current == null ? (direction > 0 ? segment.min : ceiling) : current + direction * step;
          if (next > ceiling) next = segment.min;
          if (next < segment.min) next = ceiling;
          commit({ ...values, [segment.key]: next });
          setTyped("");
          return;
        }
        case "Backspace":
        case "Delete":
          event.preventDefault();
          commit({ ...values, [segment.key]: null });
          setTyped("");
          return;
        case "Home":
          event.preventDefault();
          setIndex(0);
          setTyped("");
          return;
        case "End":
          event.preventDefault();
          setIndex(segments.length - 1);
          setTyped("");
          return;
        default:
          return;
      }
    };

    return (
      <div
        ref={rootRef}
        id={id}
        role="group"
        aria-label={label}
        aria-describedby={describedBy}
        aria-disabled={disabled || undefined}
        // The group is the tab stop and the segments are its spinbuttons, so
        // the group has to say which one is live. Without this, arrowing from
        // month to day is silent: focus never moves in the DOM, and a screen
        // reader has nothing to announce. The alternative — a roving tabindex
        // over the segments — was rejected because it puts the trigger button
        // and the segments in one tab order and loses the single tab stop.
        aria-activedescendant={
          focused && !disabled ? segmentId(segments[index]?.key ?? "") : undefined
        }
        // Claimed in the docs and, until this line, only ever a class name.
        // An error tier that does not set aria-invalid tells a screen-reader
        // user the message and not the field it belongs to.
        aria-invalid={invalid || undefined}
        // A date is a run of numbers, and numbers read left-to-right in every
        // script. Inheriting dir="rtl" mirrors the segments and renders
        // 26/08/2026 as 2026/08/26 — plausible, and the wrong date. The grid
        // around it mirrors; the value inside it must not.
        dir="ltr"
        tabIndex={disabled || readOnly ? -1 : 0}
        className={cn(
          "ox-dt-field",
          invalid && "ox-dt-field--invalid",
          disabled && "ox-dt-field--disabled",
          readOnly && "ox-dt-field--readonly",
          bare && "ox-dt-field--bare",
          className,
        )}
        onFocus={() => {
          // Tabbing in starts at the first segment. Keeping whichever segment
          // was left off means a second visit types the month into the
          // meridiem, which is exactly what an earlier prototype did.
          if (!fromSegment.current) {
            setIndex(0);
            setTyped("");
          }
          fromSegment.current = false;
          setFocused(true);
        }}
        onBlur={() => {
          // Leaving ends the entry session, so the next visit starts clean.
          setFocused(false);
          setTyped("");
          setIndex(0);
        }}
        onKeyDown={handleKeyDown}
        onPaste={(event) => {
          if (disabled || readOnly || !onPasteText) return;
          event.preventDefault();
          onPasteText(event.clipboardData.getData("text"));
        }}
      >
        {segments.map((segment, position) => {
          const value = values[segment.key];
          const active = position === index && focused;
          const buffered = active && typed && typed.length < segment.length ? typed : null;

          let text: string;
          if (buffered) text = buffered;
          else if (value == null) text = segment.placeholder;
          else if (segment.format) text = segment.format(value);
          else text = pad(value, segment.length === 4 ? 4 : 2);

          return (
            <React.Fragment key={segment.key}>
              {position > 0 && !segment.noSeparator ? (
                <span className="ox-dt-field__sep" aria-hidden="true">
                  {separator}
                </span>
              ) : null}
              {position > 0 && segment.noSeparator ? " " : null}
              <span
                id={segmentId(segment.key)}
                role="spinbutton"
                aria-label={segment.label}
                aria-valuenow={value ?? undefined}
                aria-valuemin={segment.min}
                aria-valuemax={maxOf(segment)}
                // What is announced is what is displayed, including a
                // half-typed buffer. Announcing "Empty" while the segment
                // visibly reads 0 puts a sighted user and a screen-reader
                // user in two different fields.
                aria-valuetext={value == null && !buffered ? `${segment.label} not entered` : text}
                className={cn(
                  "ox-dt-field__seg",
                  segment.wide && "ox-dt-field__seg--year",
                  value == null && !buffered && "ox-dt-field__seg--empty",
                  active && "ox-dt-field__seg--active",
                )}
                onMouseDown={(event) => {
                  if (disabled || readOnly) return;
                  event.preventDefault();
                  fromSegment.current = true;
                  setIndex(position);
                  setTyped("");
                  rootRef.current?.focus();
                }}
              >
                {text}
              </span>
            </React.Fragment>
          );
        })}

        {trigger ? (
          <button
            type="button"
            className="ox-dt-field__trigger"
            aria-label={trigger.label}
            aria-haspopup="dialog"
            aria-expanded={trigger.expanded ?? undefined}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              trigger.onPress();
            }}
          >
            {trigger.icon}
          </button>
        ) : null}
      </div>
    );
  },
);

/* ------------------------------------------------------------------ */
/* Icons                                                              */
/* ------------------------------------------------------------------ */

/**
 * Drawn from geometry in `currentColor` rather than an icon font or a sprite,
 * so they cost no request, inherit the system colour in forced-colors, and
 * survive the theme being stripped entirely.
 */
export function CalendarGlyph(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={props.className}
    >
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    </svg>
  );
}

export function ClockGlyph(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={props.className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function ChevronGlyph(props: { direction: "left" | "right" | "down" }) {
  const path =
    props.direction === "left"
      ? "M14.5 5.5 8 12l6.5 6.5"
      : props.direction === "right"
        ? "M9.5 5.5 16 12l-6.5 6.5"
        : "M6 9.5 12 15.5 18 9.5";
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export function LockGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="ox-dt-driver__glyph"
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Calendar grid                                                      */
/* ------------------------------------------------------------------ */

export type CalendarMode = "single" | "range" | "multiple";

export interface DateRangeValue {
  start: OxDate | null;
  end: OxDate | null;
}

export interface CalendarGridProps {
  mode?: CalendarMode;
  value?: OxDate | null;
  range?: DateRangeValue | null;
  dates?: OxDate[];
  /** The leftmost month on screen. With `months > 1` the rest follow it. */
  month: MonthRef;
  onMonth: (month: MonthRef) => void;
  onSelect: (date: OxDate) => void;
  /**
   * How many months to show side by side.
   *
   * Two is the number a range picker wants: most ranges cross a month
   * boundary, and in a single grid that means picking a start, paging, and
   * losing sight of the end you were aiming at. The months stay contiguous —
   * one set of controls pages the whole window — because a band drawn across
   * June and September would be a lie about what is selected.
   */
  months?: number;
  /** The day marked "today". Required: nothing here reads the clock. */
  today?: OxDate | null;
  /** Returns the reason a date is unavailable, or null. The reason is spoken. */
  unavailable?: (date: OxDate) => string | null;
  /** Open-slot count under the numeral, so density is visible before a click. */
  load?: (date: OxDate) => number | null;
  /**
   * Renders the leading and trailing days of the adjacent months.
   *
   * Defaults to true for one month and **false for more than one**, which is
   * not a stylistic choice: two adjacent panels overlap by up to a fortnight,
   * so the same date is drawn twice, both copies match the focus date, and the
   * grid grows a second tabstop — the exact failure this component's own
   * documentation calls the most common one in a date picker.
   */
  showOutsideDays?: boolean;
  /** Earliest month reachable by the header controls. */
  min?: OxDate;
  /** Latest month reachable by the header controls. */
  max?: OxDate;
  weekStart?: number;
  /** Locale narrow weekday labels. Two-letter or one, whatever the locale uses. */
  weekdayLabels?: readonly string[];
  weekdayNames?: readonly string[];
  monthLabel?: (month: MonthRef) => string;
  monthNames?: readonly string[];
  fluid?: boolean;
  /** Rendered under the grid — relative-date chips, a clear button. */
  footer?: React.ReactNode;
  /** Rendered beside the grid — the named-period rail. */
  aside?: React.ReactNode;
  maxSelectable?: number;
  className?: string;
}

/** Months between two `MonthRef`s, signed. */
function monthDistance(from: MonthRef, to: MonthRef): number {
  return (to.y - from.y) * 12 + (to.m - from.m);
}

/** `n` months on from a `MonthRef`. */
function shiftMonth(month: MonthRef, n: number): MonthRef {
  const total = month.y * 12 + (month.m - 1) + n;
  return { y: Math.floor(total / 12), m: (((total % 12) + 12) % 12) + 1 };
}

export function CalendarGrid(props: CalendarGridProps) {
  const {
    mode = "single",
    value = null,
    range = null,
    dates = [],
    month,
    onMonth,
    onSelect,
    months: monthCountProp = 1,
    showOutsideDays,
    today = null,
    unavailable,
    load,
    min,
    max,
    weekStart = 0,
    weekdayLabels,
    weekdayNames = WEEKDAY_NAMES,
    monthLabel,
    monthNames = MONTH_NAMES,
    fluid,
    footer,
    aside,
    className,
  } = props;

  const monthCount = Math.max(1, Math.min(4, Math.round(monthCountProp)));
  const showOutside = showOutsideDays ?? monthCount === 1;

  const [pane, setPane] = React.useState<"days" | "months" | "years">("days");
  // Which panel opened the month/year pane, so choosing March from the second
  // panel puts March in the second panel rather than the first.
  const [paneIndex, setPaneIndex] = React.useState(0);
  const [focusDate, setFocusDate] = React.useState<OxDate | null>(null);
  const [hover, setHover] = React.useState<OxDate | null>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const shouldRefocus = React.useRef(false);

  const shown = React.useMemo(
    () => Array.from({ length: monthCount }, (_, i) => shiftMonth(month, i)),
    [month, monthCount],
  );

  /** Whether a date falls in one of the months currently on screen. */
  const isShown = React.useCallback(
    (date: OxDate) => {
      const offset = monthDistance(month, { y: date.y, m: date.m });
      return offset >= 0 && offset < monthCount;
    },
    [month, monthCount],
  );

  /**
   * A grid with no tabstop is a grid no keyboard can enter.
   *
   * The natural default for focus is today, so any calendar opened on another
   * month — a range starting in September, a birth date in 1986 — rendered
   * forty-two cells at tabindex -1 and was unreachable. Resolving against the
   * months actually displayed is the fix, and it is why this is derived rather
   * than stored. With two months on screen the window is two months wide, so
   * a focus date in either of them is kept rather than thrown away.
   */
  const effectiveFocus = React.useMemo<OxDate>(() => {
    const candidate = focusDate ?? value ?? range?.start ?? dates[0] ?? today;
    if (candidate && isShown(candidate)) return candidate;
    const total = daysInMonth(month.y, month.m);
    for (let day = 1; day <= total; day += 1) {
      const date = { kind: "date" as const, y: month.y, m: month.m, d: day };
      if (!unavailable?.(date)) return date;
    }
    return { kind: "date", y: month.y, m: month.m, d: 1 };
  }, [focusDate, value, range, dates, today, month, unavailable, isShown]);

  React.useEffect(() => {
    if (!shouldRefocus.current) return;
    shouldRefocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>('[data-ox-dt-focus="true"]')?.focus();
  });

  const order = React.useMemo(() => weekdayOrder(weekStart), [weekStart]);

  /*
   * Where the header controls stop.
   *
   * A bounded calendar that still pages to 1823 is a control whose limits are
   * enforced only once you try to click a day. The bound is expressed on the
   * month rather than the day, so the last reachable window always contains
   * `max` and never sits past it.
   */
  const minMonth = min ? { y: min.y, m: min.m } : null;
  const maxMonth = max ? shiftMonth({ y: max.y, m: max.m }, -(monthCount - 1)) : null;
  const atMin = minMonth ? monthDistance(minMonth, month) <= 0 : false;
  const atMax = maxMonth ? monthDistance(month, maxMonth) <= 0 : false;

  const step = (delta: number) => {
    let next = shiftMonth(month, delta);
    if (minMonth && monthDistance(minMonth, next) < 0) next = minMonth;
    if (maxMonth && monthDistance(next, maxMonth) < 0) next = maxMonth;
    onMonth(next);
  };

  /** Pages the window by the least it takes to bring `date` into view. */
  const revealMonth = (date: OxDate) => {
    const offset = monthDistance(month, { y: date.y, m: date.m });
    if (offset >= 0 && offset < monthCount) return;
    onMonth(
      offset < 0
        ? { y: date.y, m: date.m }
        : shiftMonth({ y: date.y, m: date.m }, -(monthCount - 1)),
    );
  };

  const moveFocus = (next: OxDate) => {
    setFocusDate(next);
    revealMonth(next);
    shouldRefocus.current = true;
  };

  const onGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const current = effectiveFocus;
    let next: OxDate;
    switch (event.key) {
      case "ArrowRight":
        next = addCalendarDays(current, 1);
        break;
      case "ArrowLeft":
        next = addCalendarDays(current, -1);
        break;
      case "ArrowDown":
        next = addCalendarDays(current, 7);
        break;
      case "ArrowUp":
        next = addCalendarDays(current, -7);
        break;
      case "Home":
        next = addCalendarDays(current, -((weekdayOf(current) - weekStart + 7) % 7));
        break;
      case "End":
        next = addCalendarDays(current, 6 - ((weekdayOf(current) - weekStart + 7) % 7));
        break;
      case "PageUp":
        next = addCalendarMonths(current, event.shiftKey ? -12 : -1);
        break;
      case "PageDown":
        next = addCalendarMonths(current, event.shiftKey ? 12 : 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!unavailable?.(current)) onSelect(current);
        return;
      default:
        return;
    }
    event.preventDefault();
    moveFocus(next);
  };

  const isSelected = (date: OxDate): boolean => {
    if (mode === "multiple") return dates.some((d) => isSameDate(d, date));
    if (mode === "range") return isSameDate(date, range?.start) || isSameDate(date, range?.end);
    return isSameDate(date, value);
  };

  const rangeBounds = React.useMemo(() => {
    if (mode !== "range" || !range?.start) return null;
    const other = range.end ?? hover;
    if (!other) return null;
    return compareDates(range.start, other) <= 0
      ? { lo: range.start, hi: other, provisional: !range.end }
      : { lo: other, hi: range.start, provisional: !range.end };
  }, [mode, range, hover]);

  function renderCell(cell: CalendarCell, position: number) {
    const reason = unavailable?.(cell.date) ?? null;
    const selected = isSelected(cell.date);
    const focused = isSameDate(cell.date, effectiveFocus);
    const inRange = Boolean(
      rangeBounds &&
      compareDates(cell.date, rangeBounds.lo) >= 0 &&
      compareDates(cell.date, rangeBounds.hi) <= 0,
    );
    const isLo = inRange && isSameDate(cell.date, rangeBounds?.lo);
    const isHi = inRange && isSameDate(cell.date, rangeBounds?.hi);
    const openings = reason ? null : (load?.(cell.date) ?? null);

    // The accessible name is the whole date plus its state. A cell
    // named "14" is navigable and useless: a screen-reader user has no
    // column header in scope and no way to know which month they are in.
    let name = formatPlainDate(cell.date, "full");
    if (isLo && isHi) name += ", the only day in the selected range";
    else if (isLo) name += ", start of the selected range";
    else if (isHi) name += ", end of the selected range";
    else if (inRange) name += ", within the selected range";
    if (reason) name += `, unavailable, ${reason}`;
    if (openings != null) {
      name +=
        openings === 0 ? ", no times" : `, ${openings} time${openings === 1 ? "" : "s"} available`;
    }

    return (
      <button
        key={formatPlainDate(cell.date, "iso")}
        type="button"
        role="gridcell"
        tabIndex={focused ? 0 : -1}
        data-ox-dt-focus={focused ? "true" : undefined}
        aria-label={name}
        aria-selected={mode === "multiple" ? selected : selected || undefined}
        aria-disabled={reason ? true : undefined}
        title={reason ?? undefined}
        className={cn(
          "ox-dt-cal__day",
          !cell.inMonth && "ox-dt-cal__day--outside",
          reason && "ox-dt-cal__day--unavailable",
          isSameDate(cell.date, today) && "ox-dt-cal__day--today",
          selected && "ox-dt-cal__day--selected",
          /*
           * The band covers the whole span, endpoints included, and the
           * selected chip is drawn on top of it. Excluding the endpoints —
           * which is what this did — leaves the band starting a cell late at
           * each end and reading as though the first and last day were not in
           * the range they bound.
           */
          inRange && "ox-dt-cal__day--in-range",
          rangeBounds?.provisional && inRange && "ox-dt-cal__day--previewed",
          isLo && "ox-dt-cal__day--range-lo",
          isHi && "ox-dt-cal__day--range-hi",
          // The band breaks at the end of every week, so it needs a cap there
          // as well as at the ends of the range itself.
          inRange && position === 0 && "ox-dt-cal__day--week-lo",
          inRange && position === 6 && "ox-dt-cal__day--week-hi",
        )}
        onClick={() => {
          if (reason) return;
          setFocusDate(cell.date);
          onSelect(cell.date);
        }}
        onMouseEnter={mode === "range" ? () => setHover(cell.date) : undefined}
      >
        {cell.date.d}
        {openings != null && openings > 0 ? (
          <span className="ox-dt-cal__load" aria-hidden="true">
            {Array.from({ length: Math.min(3, openings) }, (_, i) => (
              <i key={i} />
            ))}
          </span>
        ) : null}
      </button>
    );
  }

  const titleOf = (ref: MonthRef) =>
    monthLabel ? monthLabel(ref) : `${monthNames[ref.m - 1]} ${ref.y}`;

  function renderHead(ref: MonthRef, index: number) {
    // One control per direction across the whole window. Two buttons both
    // named "Previous month" doing the same thing is a riddle for anybody
    // reading the dialog through its accessible names.
    const first = index === 0;
    const last = index === monthCount - 1;
    return (
      <div className="ox-dt-cal__head">
        {first ? (
          <button
            type="button"
            className="ox-dt-cal__nav"
            aria-label={monthCount > 1 ? "Previous months" : "Previous month"}
            aria-disabled={atMin || undefined}
            onClick={() => {
              if (!atMin) step(-1);
            }}
          >
            <ChevronGlyph direction="left" />
          </button>
        ) : (
          <span className="ox-dt-cal__nav ox-dt-cal__nav--spacer" aria-hidden="true" />
        )}
        <button
          type="button"
          className="ox-dt-cal__title"
          aria-label={`${titleOf(ref)} — choose month and year`}
          aria-expanded={pane !== "days" && paneIndex === index}
          onClick={() => {
            setPaneIndex(index);
            setPane(pane === "days" || paneIndex !== index ? "months" : "days");
          }}
        >
          {titleOf(ref)}
          <ChevronGlyph direction="down" />
        </button>
        {last ? (
          <button
            type="button"
            className="ox-dt-cal__nav"
            aria-label={monthCount > 1 ? "Next months" : "Next month"}
            aria-disabled={atMax || undefined}
            onClick={() => {
              if (!atMax) step(1);
            }}
          >
            <ChevronGlyph direction="right" />
          </button>
        ) : (
          <span className="ox-dt-cal__nav ox-dt-cal__nav--spacer" aria-hidden="true" />
        )}
      </div>
    );
  }

  function renderMonth(ref: MonthRef, index: number) {
    const cells = buildMonthGrid(ref, weekStart);
    const weeks = Array.from({ length: 6 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
    const title = titleOf(ref);
    const paneOpen = pane !== "days" && paneIndex === index;

    /*
     * Keyed by position, never by the month it happens to show.
     *
     * A key of `${y}-${m}` remounts the whole panel on every page — which
     * destroys the very button that was clicked to page it, dropping focus to
     * the body, and detaches the grid a keyboard handler was mid-sequence in.
     * The panels are positional; only their contents change.
     */
    return (
      <div className="ox-dt-cal__month" key={`panel-${index}`}>
        {renderHead(ref, index)}

        {!paneOpen ? (
          <div
            role="grid"
            aria-label={title}
            aria-multiselectable={mode === "multiple" || undefined}
            className="ox-dt-cal__grid"
          >
            {/* A real row. `role="grid"` requires row children and
                `columnheader` requires a row parent — axe is right about both,
                and a flat seven-column grid satisfies neither. Each row is its
                own CSS grid rather than using `display: contents`, which avoids
                the accessibility-tree caveats that technique still carries. */}
            <div role="row" className="ox-dt-cal__row">
              {order.map((weekday, position) => (
                <div
                  key={`wd-${position}`}
                  role="columnheader"
                  aria-label={weekdayNames[weekday]}
                  className="ox-dt-cal__weekday"
                >
                  {/*
                    Two letters, not one. Tuesday and Thursday are both "T" and
                    Saturday and Sunday are both "S", so a single-letter header
                    row leaves four of seven columns unnamed for anybody
                    reading it rather than counting from the left. `Intl`'s own
                    narrow weekday names have the same collision, which is why
                    this is a deliberate choice rather than a default taken.
                  */}
                  {weekdayLabels
                    ? weekdayLabels[weekday]
                    : (WEEKDAY_ABBREVIATIONS[weekday] ?? "").slice(0, 2)}
                </div>
              ))}
            </div>

            {weeks.map((week, weekIndex) => (
              <div role="row" className="ox-dt-cal__row" key={`week-${weekIndex}`}>
                {week.map((cell, position) =>
                  showOutside || cell.inMonth ? (
                    renderCell(cell, position)
                  ) : (
                    // The cell still exists, so the row keeps seven columns and
                    // the weekday headers stay over the right days. It is just
                    // not a date, here.
                    <div
                      key={formatPlainDate(cell.date, "iso")}
                      role="gridcell"
                      className="ox-dt-cal__blank"
                    />
                  ),
                )}
              </div>
            ))}
          </div>
        ) : pane === "months" ? (
          <div className="ox-dt-cal__pane" role="group" aria-label="Month">
            {MONTH_ABBREVIATIONS.map((name, position) => (
              <button
                key={name}
                type="button"
                aria-pressed={position + 1 === ref.m}
                onClick={() => {
                  // The chosen month lands in the panel it was chosen from.
                  onMonth(shiftMonth({ y: ref.y, m: position + 1 }, -index));
                  setPane("years");
                }}
              >
                {monthNames === MONTH_NAMES ? name : monthNames[position]}
              </button>
            ))}
          </div>
        ) : (
          <div className="ox-dt-cal__pane ox-dt-cal__pane--years" role="group" aria-label="Year">
            {Array.from({ length: 25 }, (_, i) => ref.y + 4 - i).map((year) => (
              <button
                key={year}
                type="button"
                aria-pressed={year === ref.y}
                onClick={() => {
                  onMonth(shiftMonth({ y: year, m: ref.m }, -index));
                  setPane("days");
                }}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "ox-dt-cal",
        fluid && "ox-dt-cal--fluid",
        monthCount > 1 && "ox-dt-cal--multi",
        aside && "ox-dt-cal--railed",
        className,
      )}
    >
      {aside ? <div className="ox-dt-cal__aside">{aside}</div> : null}

      <div className="ox-dt-cal__body">
        {/* One keyboard handler for the whole window: arrowing off the end of
            June has to land in July, and a handler per grid would stop at the
            boundary the reader is trying to cross. */}
        <div ref={gridRef} className="ox-dt-cal__months" onKeyDown={onGridKeyDown}>
          {shown.map((ref, index) => renderMonth(ref, index))}
        </div>

        {footer ? <div className="ox-dt-cal__foot">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Popover                                                            */
/* ------------------------------------------------------------------ */

export interface TemporalPopoverProps {
  open: boolean;
  onDismiss: () => void;
  label: string;
  children: React.ReactNode;
}

/**
 * A dialog anchored to the field that opened it.
 *
 * Escape closes and **keeps the typed value** — an Escape that discards a
 * half-entered date is the reason people stop using keyboards. Focus returns
 * to the trigger, and the panel flips above the field when the space below it
 * is too short, because SC 2.4.11 says the focused element may not be the
 * thing a popover hides.
 */
export function TemporalPopover(props: TemporalPopoverProps) {
  const { open, onDismiss, label, children } = props;
  const panelRef = React.useRef<HTMLDivElement>(null);
  const anchorRef = React.useRef<HTMLSpanElement>(null);
  const [box, setBox] = React.useState<{ top: number; left: number; above: boolean } | null>(null);

  // A portal needs a document, and the server has none. Rendering nothing on
  // the first client pass as well keeps hydration matching the server's HTML.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useLayoutEffect(() => {
    if (!open || !mounted) return undefined;

    const place = () => {
      const anchor = anchorRef.current?.parentElement;
      const panel = panelRef.current;
      if (!anchor || typeof anchor.getBoundingClientRect !== "function") return;
      const field = anchor.getBoundingClientRect();
      const height = panel?.getBoundingClientRect().height ?? 0;
      const viewport = typeof window === "undefined" ? 0 : window.innerHeight;

      // SC 2.4.11: the popover may never be the thing that hides the field
      // that opened it. Flip above only when there is genuinely more room
      // there, so a short viewport does not just move the problem.
      const below = viewport - field.bottom;
      const above = height > 0 && below < height + 8 && field.top > below;
      setBox({
        top: above ? field.top - height - 4 : field.bottom + 4,
        left: field.left,
        above,
      });
    };

    place();
    // A second pass once the panel has a measured height, so the flip decision
    // is made against the real one rather than zero.
    const raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame(place) : null;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onDismiss();
      }
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.parentElement?.contains(target)) return;
      onDismiss();
    };

    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onPointer);
    // `capture` catches scrolling in any ancestor, not just the page: the
    // panel is fixed to the viewport, so an ancestor that scrolls would slide
    // out from under it.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      if (raf !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, mounted, onDismiss]);

  // The anchor is a zero-size marker that stays in the tree, so the panel can
  // find the field it belongs to after being portalled away from it.
  const marker = <span ref={anchorRef} className="ox-dt-anchor__mark" aria-hidden="true" />;

  if (!open || !mounted) return marker;

  return (
    <>
      {marker}
      {createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label={label}
          className={cn("ox-dt-pop", box?.above && "ox-dt-pop--above")}
          style={box ? { top: box.top, left: box.left } : { visibility: "hidden" }}
          {...scopeOf(anchorRef.current)}
        >
          {children}
        </div>,
        document.body,
      )}
    </>
  );
}

/**
 * The token scope an element sits in, as props for a portalled copy of it.
 *
 * Escaping the ancestor that clips you also escapes the ancestor that themes
 * you. Theme, density and brand are all attribute scopes on some container,
 * and a panel rendered into `<body>` inherits none of them — so a dark panel
 * opened from a dark field arrives white, which is worse than the clipping it
 * was moved to avoid.
 *
 * `dir` is here for the same reason and matters more than it looks: a calendar
 * grid mirrors in RTL, and one that does not while the field beside it does is
 * a grid whose weekday columns no longer line up with its dates.
 */
function scopeOf(marker: HTMLElement | null): Record<string, string> {
  const anchor = marker?.parentElement;
  if (!anchor || typeof anchor.closest !== "function") return {};
  const scope: Record<string, string> = {};
  for (const attribute of ["data-ox-theme", "data-ox-density", "data-ox-brand", "dir"]) {
    const owner = anchor.closest(`[${attribute}]`);
    const value = owner?.getAttribute(attribute);
    if (value) scope[attribute] = value;
  }
  return scope;
}

/* ------------------------------------------------------------------ */
/* Message row                                                        */
/* ------------------------------------------------------------------ */

export type FieldMessageTone = "hint" | "error" | "warning" | "success";

/**
 * A literal map, not an interpolation.
 *
 * `ox-dt-msg--${tone}` produces no CSS under a scanner that resolves classes
 * by reading source text, and the element renders unstyled — which for a
 * message tier means an error that looks like a hint.
 */
const MESSAGE_TONE_CLASS: Record<FieldMessageTone, string> = {
  hint: "",
  error: "ox-dt-msg--error",
  warning: "ox-dt-msg--warning",
  success: "ox-dt-msg--success",
};

/**
 * Three tiers, three ARIA treatments, and that is the practical reason to have
 * three tiers at all.
 *
 * An **error** blocks and is announced assertively. A **warning** is a
 * conflict — a legal value colliding with other state — and is polite and does
 * not set `aria-invalid`. A **hint** is an advisory: "5 days ago" read
 * assertively over a clinician's next keystroke is a defect, not a courtesy.
 */
export function FieldMessage(props: {
  tone: FieldMessageTone;
  children: React.ReactNode;
  id?: string;
}) {
  const { tone, children, id } = props;
  const assertive = tone === "error";
  return (
    <div
      id={id}
      role={assertive ? "alert" : "status"}
      aria-live={assertive ? "assertive" : "polite"}
      className={cn("ox-dt-msg", MESSAGE_TONE_CLASS[tone])}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="ox-dt-msg__glyph"
      >
        {tone === "error" ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5M12 16.3v.01" />
          </>
        ) : tone === "warning" ? (
          <>
            <path d="M12 3.2 1.8 20.8h20.4z" />
            <path d="M12 9.5v5M12 17.8v.01" />
          </>
        ) : tone === "success" ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12.2 2.8 2.8L16 9.8" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 7.8v.01" />
          </>
        )}
      </svg>
      <span>{children}</span>
    </div>
  );
}
