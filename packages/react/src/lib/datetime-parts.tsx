"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/lib/datetime-parts.tsx. Edit that file, not this one.
/**
 * The parts of the date, time and session system.
 *
 * Eleven presentations of one temporal contract, in one module rather than
 * eleven catalogue entries. That is a product decision and worth stating:
 * a clinician does not shop for a "birth date field", they reach for the date
 * control and need it to behave differently in eleven places. Tabs made the
 * same call for the same reason — one component, eleven skins, one keyboard
 * model — and splitting it would have hidden the argument that the skins are
 * the same component.
 *
 * So `DatePicker` is the public surface and its `variant` selects one of
 * these. Each is still a real, separately testable component: composition did
 * not become a switch statement, it became an internal module.
 */

import * as React from "react";
import { cn } from "../lib/utils";
import {
  addCalendarDays,
  ageOn,
  bandFor,
  compareDates,
  describeAgeLabel,
  describeRelativeDay,
  describeZoneShift,
  formatClockTime,
  formatDuration,
  formatPlainDate,
  isSameDate,
  isValidDate,
  minutesOfTime,
  parseClockTime,
  parseDateDigits,
  plainDate,
  plainTime,
  sessionFrom,
  timeFromMinutes,
  WEEKDAY_ABBREVIATIONS,
  WEEKDAY_NAMES,
  weekdayOf,
  withSessionDuration,
  withSessionEnd,
  withSessionStart,
  type DateOrder,
  type DurationBand,
  type DurationPreset,
  type MonthRef,
  type OxAbsentDate,
  type OxDate,
  type OxPartialDate,
  type OxTemporal,
  type OxTime,
  type SessionInterval,
  type TemporalAbsence,
} from "../lib/datetime";
import {
  CalendarGlyph,
  CalendarGrid,
  dateSegments,
  FieldMessage,
  LockGlyph,
  SegmentedField,
  TemporalPopover,
  timeSegments,
  useTemporalValue,
  useValueSync,
  type CalendarMode,
  type DateRangeValue,
  type FieldMessageTone,
  type FieldSegment,
  type SegmentedFieldHandle,
  type SegmentValues,
} from "../lib/datetime-field";
import {
  groupSlots,
  isStale,
  secondsSince,
  SLOT_BLOCK_WORDS,
  type AvailabilitySet,
  type Buffers,
  type Slot,
} from "../lib/availability";
import {
  describeRule,
  describeSeries,
  expandRule,
  keptOccurrences,
  reviewSeries,
  toExDate,
  toRRule,
  type Occurrence,
  type OccurrenceVerdict,
  type RecurrenceFrequency,
  type RecurrenceRule,
  type Weekday,
} from "../lib/recurrence";

/* ------------------------------------------------------------------ */
/* Value keys                                                         */
/*                                                                    */
/* A temporal value is a plain object, so a host that maps over its    */
/* state hands back a new identity for the same date on every render.  */
/* Reconciliation compares these strings instead — see `useValueSync`. */
/* ------------------------------------------------------------------ */

function dateKey(value: OxDate | null | undefined): string {
  return value ? `${value.y}-${value.m}-${value.d}` : "";
}

function timeKey(value: OxTime | null | undefined): string {
  return value ? `${value.h}:${value.mi}:${value.s ?? 0}` : "";
}

function birthKey(value: BirthDateValue | undefined): string {
  if (!value) return "";
  switch (value.kind) {
    case "date":
      return `d|${dateKey(value)}`;
    case "partial-date":
      return `p|${value.y}-${value.m ?? ""}`;
    case "absent":
      return `a|${value.reason}`;
    default:
      return "";
  }
}

/* ================================================================== */
/* date-field
/* ================================================================== */

/**
 * DateField — a date typed in eight keystrokes, with no calendar at all.
 *
 *     <DateField label="Date of service" now={today} value={date} onChange={setDate} />
 *
 * The control most date pickers are missing, and the one most healthcare
 * fields actually want. Count what a clinician touches in a day: a date of
 * birth at intake, a service date on every note, a signature timestamp on
 * every signed note, and — perhaps twice a week — an appointment picked from a
 * calendar. The calendar is the rare case. The common case is somebody who
 * already knows the value and needs the software to get out of the way, and
 * for them a popover is four clicks where eight keystrokes would do.
 *
 * So there is no popup here. `DatePicker` is the one with a calendar; this is
 * the field, and it is deliberately the plainest thing in the family.
 *
 * Three segments, one tabstop, arrow keys that step the right unit, and a
 * segment that advances itself the moment no further digit could be valid. It
 * is impossible to enter 13 as a month or 30 February as a date, because the
 * segments are bounded and the day is checked against the month and year — not
 * validated afterwards and complained about.
 */

/* ------------------------------------------------------------------ */
/* Segment plumbing                                                   */
/* ------------------------------------------------------------------ */

export function dateToSegments(date: OxDate | null): SegmentValues {
  if (!date) return { m: null, d: null, y: null };
  return { m: date.m, d: date.d, y: date.y };
}

/**
 * A date from three segments, or null.
 *
 * Null covers both "not finished" and "not a real date", and the caller cannot
 * tell them apart on purpose: an incomplete field and an impossible one are
 * both "no value yet", and the field's own message says which.
 */
export function segmentsToDate(values: SegmentValues): OxDate | null {
  const { y, m, d } = values;
  if (y == null || m == null || d == null) return null;
  return isValidDate(y, m, d) ? plainDate(y, m, d) : null;
}

/* ------------------------------------------------------------------ */
/* Policy                                                             */
/* ------------------------------------------------------------------ */

/**
 * What a field does about a date on the wrong side of today.
 *
 * There is no sensible default here, which is exactly why it is a prop. A date
 * of birth may never be in the future. A discharge date may, because it can be
 * planned. An appointment is expected to be. Session documentation in the
 * future is suspicious but not impossible, so it warns. A generic date
 * component that hardcodes any one of those is wrong three times out of four.
 */
export type TemporalPolicy = "allow" | "warn" | "block";

export interface DateFieldProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue" | "children"
> {
  /** Controlled value. Pass `null` for empty, never `undefined`. */
  value?: OxDate | null;
  /**
   * Uncontrolled initial value.
   *
   * Pass this **or** `value`, never both. There is deliberately no runtime
   * warning: ADR 0009 forbids component source writing to the console at all,
   * because a component that logs is one error-reporting integration away from
   * putting a date of birth in a third party's index. When both are passed,
   * `value` wins — the ordinary React contract.
   */
  defaultValue?: OxDate | null;
  /**
   * Fired on every complete, valid date, and with `null` when the field is cleared. Never
   * fired mid-typing.
   */
  onChange?: (value: OxDate | null) => void;

  /**
   * Today, supplied by the host.
   *
   * Required wherever a policy or a relative label is in play, because
   * ENGINEERING.md §9 forbids a component reading the wall clock to decide
   * what to render — output that depends on when it rendered cannot be
   * visually regression-tested, and server and client would disagree on the
   * boundary between one day and the next.
   */
  now?: OxDate;

  /** Segment order. From the locale, never guessed. */
  order?: DateOrder;
  /**
   * Two-digit years above this resolve to the 1900s, at or below to the 2000s.
   *
   * Only reachable through a paste — the year segment takes four digits — but
   * pastes are how clinical dates actually move between systems, and a sliding
   * window would make the same pasted text mean different things in different
   * years. Defaults to 30.
   */
  twoDigitYearPivot?: number;

  /**
   * Earliest selectable date, inclusive. Dates before it are refused with a spoken reason
   * rather than silently ignored.
   */
  min?: OxDate;
  /** Latest selectable date, inclusive. */
  max?: OxDate;
  /**
   * What a future date means here — allowed, warned about, or refused. A date of birth and an
   * appointment want opposite answers.
   */
  futurePolicy?: TemporalPolicy;
  /** What a past date means here. The mirror of `futurePolicy`, and just as rarely the same. */
  pastPolicy?: TemporalPolicy;

  /** The field's visible label, and its accessible name. */
  label?: string;
  /** Renders "Optional" beside the label. An unmarked field is ambiguous. */
  optional?: boolean;
  /** Marks the field required and announces it. Does not itself validate. */
  required?: boolean;
  /** Advisory text under the field. Never announced assertively. */
  hint?: React.ReactNode;
  /** A host-supplied error. Overrides the field's own policy message. */
  error?: React.ReactNode;
  /** Show "Today", "5 days ago" under a complete value. Needs `now`. */
  showRelative?: boolean;

  /**
   * Removes the field from the tab order entirely. Prefer `readOnly` for anything the reader
   * may still need to read.
   */
  disabled?: boolean;
  /**
   * Readable and focusable but not editable — the right prop for a value governed by policy or
   * record state.
   */
  readOnly?: boolean;
  /**
   * Renders the invalid styling and sets `aria-invalid`. Pair with `error` so the reason is
   * stated, not merely coloured.
   */
  invalid?: boolean;
  /** Form field name, for an uncontrolled submit. */
  name?: string;

  /**
   * Puts a calendar behind a trigger button at the end of the field.
   *
   * Off by default, and that default is the component's argument rather than
   * an oversight: the field is the common case and the calendar is the rare
   * one. `variant="picker"` turns it on; `variant="field"` leaves it off.
   */
  showCalendar?: boolean;
  /** Forwarded to the popover calendar — the reason a day cannot be chosen. */
  unavailable?: (date: OxDate) => string | null;
  /** Forwarded to the popover calendar — open-slot count under the numeral. */
  load?: (date: OxDate) => number | null;
  /** 0 = Sunday. Forwarded to the popover calendar. */
  weekStart?: number;
  /** Rendered under the popover grid — relative-date chips, a clear action. */
  calendarFooter?: React.ReactNode;
}

interface FieldNotice {
  tone: FieldMessageTone;
  text: React.ReactNode;
  /** Whether the field is `aria-invalid`. A conflict is not invalid. */
  invalid: boolean;
}

/**
 * The field's own verdict on its value.
 *
 * Exported because `BirthDateField` and every host form need the same three
 * tiers, and because the distinction is the component's argument: an error
 * blocks and is announced assertively, a warning is a legal value colliding
 * with a rule and never blocks, an advisory is said once and politely.
 */
export function reviewDate(
  value: OxDate | null,
  options: {
    now?: OxDate;
    min?: OxDate;
    max?: OxDate;
    futurePolicy?: TemporalPolicy;
    pastPolicy?: TemporalPolicy;
    showRelative?: boolean;
  },
): FieldNotice | null {
  if (!value) return null;
  const { now, min, max, futurePolicy = "allow", pastPolicy = "allow", showRelative } = options;

  if (min && compareDates(value, min) < 0) {
    return {
      tone: "error",
      invalid: true,
      text: `Earliest allowed is ${formatPlainDate(min, "medium")}.`,
    };
  }
  if (max && compareDates(value, max) > 0) {
    return {
      tone: "error",
      invalid: true,
      text: `Latest allowed is ${formatPlainDate(max, "medium")}.`,
    };
  }

  if (now) {
    const delta = compareDates(value, now);
    if (delta > 0 && futurePolicy !== "allow") {
      const relative = describeRelativeDay(value, now).toLowerCase();
      return futurePolicy === "block"
        ? {
            tone: "error",
            invalid: true,
            text: `This date cannot be in the future. ${formatPlainDate(value, "medium")} is ${relative}.`,
          }
        : {
            tone: "warning",
            invalid: false,
            text: `${formatPlainDate(value, "medium")} is ${relative}.`,
          };
    }
    if (delta < 0 && pastPolicy !== "allow") {
      const relative = describeRelativeDay(value, now).toLowerCase();
      return pastPolicy === "block"
        ? {
            tone: "error",
            invalid: true,
            text: `This date cannot be in the past. ${formatPlainDate(value, "medium")} is ${relative}.`,
          }
        : {
            tone: "warning",
            invalid: false,
            text: `${formatPlainDate(value, "medium")} is ${relative}.`,
          };
    }
    if (showRelative) {
      // An advisory, deliberately toneless. A clinician documenting last
      // Friday's session is doing something ordinary and must not be told
      // they have made a mistake.
      return { tone: "hint", invalid: false, text: describeRelativeDay(value, now) };
    }
  }

  return null;
}

export const DateField = React.forwardRef<HTMLDivElement, DateFieldProps>(
  function DateField(props, ref) {
    const {
      value: controlled,
      defaultValue = null,
      onChange,
      now,
      order = "MDY",
      twoDigitYearPivot,
      min,
      max,
      futurePolicy = "allow",
      pastPolicy = "allow",
      label,
      optional,
      required,
      hint,
      error,
      showRelative,
      disabled,
      readOnly,
      invalid,
      name,
      showCalendar,
      unavailable,
      load,
      weekStart,
      calendarFooter,
      id,
      className,
      ...rest
    } = props;

    const [value, setUncontrolled] = useTemporalValue(controlled, defaultValue);
    const [segments, setSegments] = React.useState<SegmentValues>(() => dateToSegments(value));
    const [open, setOpen] = React.useState(false);
    const fieldHandle = React.useRef<SegmentedFieldHandle>(null);

    // Sync only from a value the field did not itself produce: the parent's echo
    // is one keystroke stale while the field has focus, and writing it back
    // mid-entry resets the typing buffer — which is how "1100" resolves a digit
    // at a time to 12:00. See `useValueSync` for why this is not an effect.
    const markEmitted = useValueSync(dateKey(value), () => setSegments(dateToSegments(value)));

    const reactId = React.useId();
    const fieldId = id ?? `${reactId}-field`;
    const messageId = `${reactId}-message`;

    const handleSegments = (next: SegmentValues) => {
      setSegments(next);
      const parsed = segmentsToDate(next);
      if (parsed === null && value === null) return;
      if (parsed && value && compareDates(parsed, value) === 0) return;
      markEmitted(dateKey(parsed));
      setUncontrolled(parsed);
      onChange?.(parsed);
    };

    // Escape keeps what was typed and returns focus to the field it came from.
    // An Escape that discards a half-entered date is the reason people stop
    // using keyboards.
    const dismiss = React.useCallback(() => {
      setOpen(false);
      fieldHandle.current?.focusSegment(0);
    }, []);

    const notice = error
      ? ({ tone: "error", invalid: true, text: error } as FieldNotice)
      : reviewDate(segmentsToDate(segments), {
          now,
          min,
          max,
          futurePolicy,
          pastPolicy,
          showRelative,
        });

    const isInvalid = invalid || notice?.invalid || false;
    const describedBy = notice || hint ? messageId : undefined;
    const withCalendar = showCalendar && !disabled && !readOnly;

    return (
      <div
        ref={ref}
        data-ox-date-field={value ? "set" : "empty"}
        className={cn("ox-dt-stack", className)}
        {...rest}
      >
        {label ? (
          <label className="ox-dt-label" htmlFor={fieldId}>
            {label}
            {required ? (
              <span className="ox-dt-label__required" aria-hidden="true">
                *
              </span>
            ) : null}
            {optional ? <span className="ox-dt-label__optional">Optional</span> : null}
          </label>
        ) : null}

        <div className={withCalendar ? "ox-dt-anchor" : undefined}>
          <SegmentedField
            ref={fieldHandle}
            id={fieldId}
            segments={dateSegments(order)}
            values={segments}
            onValues={handleSegments}
            label={label ?? "Date"}
            invalid={isInvalid}
            disabled={disabled}
            readOnly={readOnly}
            describedBy={describedBy}
            trigger={
              withCalendar
                ? {
                    icon: <CalendarGlyph />,
                    label: "Choose from calendar",
                    expanded: open,
                    onPress: () => setOpen((was) => !was),
                  }
                : undefined
            }
            onPasteText={(text) => {
              const parsed = parseDateDigits(text, { order, twoDigitYearPivot });
              if (parsed) handleSegments(dateToSegments(parsed));
            }}
          />

          {withCalendar ? (
            <TemporalPopover open={open} onDismiss={dismiss} label={label ?? "Choose a date"}>
              <Calendar
                value={value}
                onChange={(next) => {
                  handleSegments(dateToSegments(next));
                  dismiss();
                }}
                now={now ?? null}
                min={min}
                max={max}
                unavailable={unavailable}
                load={load}
                weekStart={weekStart}
                footer={calendarFooter}
              />
            </TemporalPopover>
          ) : null}
        </div>

        {/* A hidden input so the field posts in a plain HTML form. ISO, always:
          a form body carrying a locale-formatted date is a bug in somebody
          else's parser six months from now. */}
        {name ? (
          <input type="hidden" name={name} value={value ? formatPlainDate(value, "iso") : ""} />
        ) : null}

        {notice ? (
          <FieldMessage id={messageId} tone={notice.tone}>
            {notice.text}
          </FieldMessage>
        ) : hint ? (
          <FieldMessage id={messageId} tone="hint">
            {hint}
          </FieldMessage>
        ) : null}
      </div>
    );
  },
);

DateField.displayName = "DateField";

/* ================================================================== */
/* calendar
/* ================================================================== */

/**
 * Calendar — the month grid, on its own.
 *
 *     <Calendar now={today} value={date} onChange={setDate} />
 *     <Calendar mode="range" range={range} onRangeChange={setRange} />
 *     <Calendar mode="multiple" dates={dates} onDatesChange={setDates} />
 *
 * A `role="grid"` with a single roving tabstop, which is what the APG
 * specifies and the only arrangement that keeps a month navigable without
 * trapping a screen-reader user in forty-two tab stops.
 *
 * Two details carry more weight than they look.
 *
 * **Every cell is named in full.** "Wednesday, August 26, 2026, 8 times
 * available" rather than "26". A cell in a grid has no column header in its
 * accessible context, and a grid of bare numerals is navigable and useless.
 *
 * **Unavailable is a shape, not a shade.** A closed day is struck through as
 * well as dimmed, and the reason — a holiday, provider leave, no room — is in
 * the accessible name and the tooltip rather than in five different greys
 * nobody can tell apart.
 */

export interface CalendarProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue" | "children"
> {
  /** `single` is the default. `range` is two clicks; there is no drag path. */
  mode?: CalendarMode;

  /** Controlled value. Pass `null` for empty, never `undefined`. */
  value?: OxDate | null;
  /**
   * Uncontrolled initial value. Pass this or `value`, never both; `value` wins if you pass
   * both.
   */
  defaultValue?: OxDate | null;
  /** Fired when a single date is chosen. Only meaningful in `mode="single"`. */
  onChange?: (value: OxDate | null) => void;

  /** The selected range, controlled. Only meaningful in `mode="range"`. */
  range?: DateRangeValue | null;
  /** Fired when a range completes — on the second click, not the first. */
  onRangeChange?: (range: DateRangeValue) => void;

  /** The selected dates, controlled. Only meaningful in `mode="multiple"`. */
  dates?: OxDate[];
  /** Fired whenever the multiple-selection set changes. */
  onDatesChange?: (dates: OxDate[]) => void;
  /** Cap for `mode="multiple"`. Further dates are refused, never dialogued. */
  maxDates?: number;

  /** The month on screen. Uncontrolled when omitted. */
  month?: MonthRef;
  /**
   * The month shown on first render, uncontrolled. Defaults to the month of the value, or of
   * `now`.
   */
  defaultMonth?: MonthRef;
  /**
   * Fired when the reader pages the grid. Use it to fetch availability for the month coming
   * into view.
   */
  onMonthChange?: (month: MonthRef) => void;

  /**
   * The day marked "today". Required to mark one — the component reads no
   * clock, so a calendar without `now` simply has no today, which is correct
   * for a historical picker and deliberate everywhere else.
   */
  now?: OxDate | null;

  /** Earliest selectable date, inclusive. */
  min?: OxDate;
  /** Latest selectable date, inclusive. */
  max?: OxDate;
  /**
   * The reason a date cannot be chosen, or null.
   *
   * A string rather than a boolean because the reason is spoken and shown. One
   * muted treatment covers every reason; five colours would be five things to
   * learn and still illegible to a colour-blind reader.
   */
  unavailable?: (date: OxDate) => string | null;
  /** Open-slot count under the numeral, so density is visible before a click. */
  load?: (date: OxDate) => number | null;

  /** 0 = Sunday. From `Intl.Locale.getWeekInfo`, never hardcoded. */
  weekStart?: number;
  /**
   * The two-letter column headings. Visual only — each cell still carries its full weekday
   * name for a screen reader.
   */
  weekdayLabels?: readonly string[];
  /**
   * Full weekday names, used in each cell's accessible name. Supply both these and
   * `weekdayLabels` for any language that is not English.
   */
  weekdayNames?: readonly string[];
  /** Full month names, for the header and for each cell's accessible name. */
  monthNames?: readonly string[];
  /**
   * Overrides the rendered month heading, for a host that formats it differently from the
   * default.
   */
  monthLabel?: (month: MonthRef) => string;

  /** Fills its container rather than sitting at its natural 252px. */
  fluid?: boolean;
  /** Rendered under the grid — relative-date chips, a clear action. */
  footer?: React.ReactNode;
}

export const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  function Calendar(props, ref) {
    const {
      mode = "single",
      value: controlledValue,
      defaultValue = null,
      onChange,
      range: controlledRange,
      onRangeChange,
      dates: controlledDates,
      onDatesChange,
      maxDates,
      month: controlledMonth,
      defaultMonth,
      onMonthChange,
      now = null,
      min,
      max,
      unavailable,
      load,
      weekStart = 0,
      weekdayLabels,
      weekdayNames,
      monthNames,
      monthLabel,
      fluid,
      footer,
      className,
      ...rest
    } = props;

    const [value, setValue] = useTemporalValue(controlledValue, defaultValue);
    const [range, setRange] = useTemporalValue<DateRangeValue>(controlledRange ?? undefined, {
      start: null,
      end: null,
    });
    const [dates, setDates] = useTemporalValue<OxDate[]>(controlledDates, []);

    const anchor = value ?? range?.start ?? dates[0] ?? now ?? null;
    const [month, setMonth] = useTemporalValue<MonthRef>(
      controlledMonth,
      defaultMonth ?? (anchor ? { y: anchor.y, m: anchor.m } : { y: 2026, m: 1 }),
    );

    /**
     * `min`/`max` fold into the same predicate as the host's own reasons, so
     * there is exactly one path to "this day cannot be chosen" and exactly one
     * treatment for it.
     */
    const isUnavailable = React.useCallback(
      (date: OxDate): string | null => {
        if (min && compareDates(date, min) < 0) return "before the earliest allowed date";
        if (max && compareDates(date, max) > 0) return "after the latest allowed date";
        return unavailable?.(date) ?? null;
      },
      [min, max, unavailable],
    );

    const handleSelect = (date: OxDate) => {
      if (mode === "range") {
        const next: DateRangeValue =
          !range?.start || range.end
            ? { start: date, end: null }
            : compareDates(date, range.start) < 0
              ? { start: date, end: range.start }
              : { start: range.start, end: date };
        setRange(next);
        onRangeChange?.(next);
        return;
      }

      if (mode === "multiple") {
        const at = dates.findIndex((existing) => isSameDate(existing, date));
        let next: OxDate[];
        if (at > -1) {
          // Clicking a selected date removes it. A remove control inside a 32px
          // cell would be under the target floor, and a second click is what
          // people try first anyway.
          next = [...dates.slice(0, at), ...dates.slice(at + 1)];
        } else {
          if (maxDates != null && dates.length >= maxDates) return;
          next = [...dates, date].sort((a, b) => compareDates(a, b));
        }
        setDates(next);
        onDatesChange?.(next);
        return;
      }

      setValue(date);
      onChange?.(date);
    };

    return (
      <div ref={ref} data-ox-calendar={mode} className={cn(className)} {...rest}>
        <CalendarGrid
          mode={mode}
          value={value}
          range={range}
          dates={dates}
          month={month}
          onMonth={(next) => {
            setMonth(next);
            onMonthChange?.(next);
          }}
          onSelect={handleSelect}
          today={now}
          unavailable={isUnavailable}
          load={load}
          weekStart={weekStart}
          weekdayLabels={weekdayLabels}
          weekdayNames={weekdayNames}
          monthNames={monthNames}
          monthLabel={monthLabel}
          fluid={fluid}
          footer={footer}
        />
      </div>
    );
  },
);

Calendar.displayName = "Calendar";

/**
 * The four relative shortcuts that cover most real answers.
 *
 * Exported as data rather than rendered here, so a host can drop the ones that
 * make no sense for its field — "Tomorrow" on a date of service is noise —
 * and translate the words without forking the component.
 *
 * Deliberately not a natural-language parser. A free-text box that resolves
 * "next Tuesday" also resolves "nxt tues" to *something*, and a silent wrong
 * answer in a clinical date field is worse than no shortcut at all.
 */
export function relativeDateOptions(
  now: OxDate,
): Array<{ id: string; label: string; date: OxDate }> {
  // Sunday is 0, so the distance to the next Monday is (8 - weekday) mod 7 —
  // and 0 means today is Monday, which should offer the Monday after.
  const toNextMonday = (8 - weekdayOf(now)) % 7 || 7;
  return [
    { id: "today", label: "Today", date: now },
    { id: "tomorrow", label: "Tomorrow", date: addCalendarDays(now, 1) },
    { id: "next-monday", label: "Next Monday", date: addCalendarDays(now, toNextMonday) },
    { id: "two-weeks", label: "In 2 weeks", date: addCalendarDays(now, 14) },
  ];
}

/* ================================================================== */
/* time-field
/* ================================================================== */

/**
 * TimeField — a time typed the way people actually type times.
 *
 *     <TimeField label="Time given" value={time} onChange={setTime} />
 *
 * `930a`, `0930`, `9:30 pm`, `14:05` — a paste of any of them resolves; typed
 * digits fill bounded segments the same way `DateField`'s do.
 *
 * **The ambiguity it refuses to resolve.** Typing `9` in a twelve-hour locale
 * is genuinely ambiguous, and a picker that quietly decides it means 9 AM
 * will, on some ward, turn a 9 PM discharge into a 9 AM one. So the meridiem
 * segment stays unfilled and the value stays incomplete until somebody says
 * which. That is the whole reason `parseClockTime` returns an `ambiguous`
 * flag rather than a time.
 *
 * Seconds are off by default and available where the workflow needs them — a
 * rapid response, a restraint application, a code narrative. Everywhere else
 * they are two more segments to tab past and two more chances to be wrong.
 */

/* ------------------------------------------------------------------ */
/* Segment plumbing                                                   */
/* ------------------------------------------------------------------ */

/**
 * A time into segments, in the display's own hour convention.
 *
 * The stored value is always 24-hour. Twelve-hour is presentation, and
 * conflating the two is how a component ends up with two sources of truth for
 * midnight.
 */
export function timeToSegments(time: OxTime | null, hour24 = false): SegmentValues {
  if (!time) return { h: null, mi: null, s: null, ap: null };
  if (hour24) return { h: time.h, mi: time.mi, s: time.s ?? null, ap: null };
  return {
    h: time.h % 12 === 0 ? 12 : time.h % 12,
    mi: time.mi,
    s: time.s ?? null,
    ap: time.h >= 12 ? 1 : 0,
  };
}

export function segmentsToTime(
  values: SegmentValues,
  options: { hour24?: boolean; showSecond?: boolean } = {},
): OxTime | null {
  const { h, mi, s, ap } = values;
  if (h == null || mi == null) return null;
  if (options.showSecond && s == null) return null;
  if (options.hour24) return plainTime(h, mi, options.showSecond ? (s ?? 0) : undefined);
  // The meridiem is part of the value in a twelve-hour field, not a decoration
  // on it. Without it there is no time yet.
  if (ap == null) return null;
  const hour = (h % 12) + (ap ? 12 : 0);
  return plainTime(hour, mi, options.showSecond ? (s ?? 0) : undefined);
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export interface TimeFieldProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue" | "children"
> {
  /** Controlled value. Pass `null` for empty, never `undefined`. */
  value?: OxTime | null;
  /**
   * Uncontrolled initial value. Pass this or `value`, never both; `value` wins if you pass
   * both.
   */
  defaultValue?: OxTime | null;
  /** Fired on every complete time, and with `null` when cleared. */
  onChange?: (value: OxTime | null) => void;

  /** 24-hour display. The stored value is 24-hour either way. */
  hour24?: boolean;
  /** A seconds segment. Off by default; on for a code call or a restraint. */
  showSecond?: boolean;
  /**
   * Times offered as one-press chips — the organisation's own grid.
   *
   * Minutes past midnight, so `[480, 495, 510]` is 8:00, 8:15, 8:30. A
   * psychiatry clinic on twenty-minute follow-ups and a therapy practice on
   * fifty-three-minute sessions are the same component with different data.
   */
  presets?: readonly number[];
  /**
   * The heading above the preset chips. Name them for what they are — “Clinic slots”, not
   * “Presets”.
   */
  presetLabel?: string;

  /** Earliest selectable time, inclusive. */
  min?: OxTime;
  /** Latest selectable time, inclusive. */
  max?: OxTime;

  /** The field's visible label, and its accessible name. */
  label?: string;
  /** Marks the field required and announces it. Does not itself validate. */
  required?: boolean;
  /**
   * Marks the field explicitly optional. Use where most fields on the form are required and
   * the exception needs saying.
   */
  optional?: boolean;
  /**
   * Guidance under the field, associated with it so assistive technology reads it as part of
   * the field.
   */
  hint?: React.ReactNode;
  /** The validation message. Announced, and it replaces the hint rather than stacking under it. */
  error?: React.ReactNode;

  /**
   * Removes the field from the tab order entirely. Prefer `readOnly` for anything the reader
   * may still need to read.
   */
  disabled?: boolean;
  /**
   * Readable and focusable but not editable — the right prop for a value governed by policy or
   * record state.
   */
  readOnly?: boolean;
  /**
   * Renders the invalid styling and sets `aria-invalid`. Pair with `error` so the reason is
   * stated, not merely coloured.
   */
  invalid?: boolean;
  /** Form field name, for an uncontrolled submit. */
  name?: string;
}

export const TimeField = React.forwardRef<HTMLDivElement, TimeFieldProps>(
  function TimeField(props, ref) {
    const {
      value: controlled,
      defaultValue = null,
      onChange,
      hour24 = false,
      showSecond = false,
      presets,
      presetLabel = "Quick times",
      min,
      max,
      label,
      required,
      optional,
      hint,
      error,
      disabled,
      readOnly,
      invalid,
      name,
      id,
      className,
      ...rest
    } = props;

    const [value, setValue] = useTemporalValue(controlled, defaultValue);
    const [segments, setSegments] = React.useState<SegmentValues>(() =>
      timeToSegments(value, hour24),
    );
    const [ambiguous, setAmbiguous] = React.useState(false);

    // `hour24` is in the key because flipping it rebuilds the segment list, and
    // a buffer built for a 12-hour field is not one a 24-hour field can read.
    const markEmitted = useValueSync(`${hour24 ? 24 : 12}|${timeKey(value)}`, () =>
      setSegments(timeToSegments(value, hour24)),
    );

    const reactId = React.useId();
    const fieldId = id ?? `${reactId}-field`;
    const messageId = `${reactId}-message`;

    const emit = (next: OxTime | null) => {
      markEmitted(`${hour24 ? 24 : 12}|${timeKey(next)}`);
      setValue(next);
      onChange?.(next);
    };

    const commitSegments = (next: SegmentValues) => {
      setSegments(next);
      setAmbiguous(false);
      const parsed = segmentsToTime(next, { hour24, showSecond });
      if (parsed === null && value === null) return;
      if (parsed && value && minutesOfTime(parsed) === minutesOfTime(value)) return;
      emit(parsed);
    };

    const outOfRange =
      value != null &&
      ((min !== undefined && minutesOfTime(value) < minutesOfTime(min)) ||
        (max !== undefined && minutesOfTime(value) > minutesOfTime(max)));
    const rangeText =
      min !== undefined && max !== undefined
        ? `Allowed between ${formatClockTime(min, { hour24 })} and ${formatClockTime(max, { hour24 })}.`
        : min !== undefined
          ? `Cannot be earlier than ${formatClockTime(min, { hour24 })}.`
          : max !== undefined
            ? `Cannot be later than ${formatClockTime(max, { hour24 })}.`
            : "";

    const notice: { tone: "error" | "warning" | "hint"; text: React.ReactNode } | null = error
      ? { tone: "error", text: error }
      : outOfRange
        ? { tone: "error", text: rangeText }
        : ambiguous
          ? {
              tone: "warning",
              // Never resolved silently. A 9 PM discharge read as 9 AM is not a
              // formatting slip; it is twelve hours of a record being wrong.
              text: "Morning or afternoon? Add AM or PM to finish this time.",
            }
          : hint
            ? { tone: "hint", text: hint }
            : null;

    return (
      <div
        ref={ref}
        data-ox-time-field={hour24 ? "24-hour" : "12-hour"}
        className={cn("ox-dt-stack", className)}
        {...rest}
      >
        {label ? (
          <label className="ox-dt-label" htmlFor={fieldId}>
            {label}
            {required ? (
              <span className="ox-dt-label__required" aria-hidden="true">
                *
              </span>
            ) : null}
            {optional ? <span className="ox-dt-label__optional">Optional</span> : null}
          </label>
        ) : null}

        <SegmentedField
          id={fieldId}
          segments={timeSegments({ hour24, showSecond })}
          values={segments}
          onValues={commitSegments}
          label={label ?? "Time"}
          separator=":"
          invalid={invalid || !!outOfRange || !!error}
          disabled={disabled}
          readOnly={readOnly}
          describedBy={notice ? messageId : undefined}
          onPasteText={(text) => {
            const parsed = parseClockTime(text, { hour24 });
            if (!parsed) return;
            setAmbiguous(parsed.ambiguous);
            const next = timeToSegments(parsed.time, hour24);
            if (parsed.ambiguous) next.ap = null;
            setSegments(next);
            if (!parsed.ambiguous) emit(parsed.time);
          }}
        />

        {presets?.length ? (
          <div className="ox-dt-chips" role="group" aria-label={presetLabel}>
            {presets.map((minutes) => {
              const time = plainTime(Math.floor(minutes / 60) % 24, minutes % 60);
              const on = value != null && minutesOfTime(value) === minutes % 1440;
              return (
                <button
                  key={minutes}
                  type="button"
                  className="ox-dt-chip"
                  aria-pressed={on}
                  disabled={disabled || readOnly}
                  onClick={() => {
                    setSegments(timeToSegments(time, hour24));
                    setAmbiguous(false);
                    emit(time);
                  }}
                >
                  {formatClockTime(time, { hour24 })}
                </button>
              );
            })}
          </div>
        ) : null}

        {name ? (
          <input
            type="hidden"
            name={name}
            value={value ? formatClockTime(value, { hour24: true, showSecond }) : ""}
          />
        ) : null}

        {notice ? (
          <FieldMessage id={messageId} tone={notice.tone}>
            {notice.text}
          </FieldMessage>
        ) : null}
      </div>
    );
  },
);

TimeField.displayName = "TimeField";

/**
 * A run of times at a fixed interval, as minutes past midnight.
 *
 * `timeGrid(8*60, 18*60, 15)` is every quarter hour from eight to six. The
 * interval is a number rather than an enum because organisations really do run
 * on twenty and on fifty-three, and an enum would be a pull request every time.
 */
export function timeGrid(fromMinutes: number, toMinutes: number, everyMinutes: number): number[] {
  if (everyMinutes <= 0) return [];
  const out: number[] = [];
  for (let m = fromMinutes; m <= toMinutes; m += everyMinutes) out.push(m);
  return out;
}

/* ================================================================== */
/* session-time-field
/* ================================================================== */

/**
 * SessionTimeField — start, end, duration, and a driver you can see.
 *
 *     <SessionTimeField value={session} onChange={setSession} durationPresets={org.presets} />
 *
 * Three values with two degrees of freedom. Any two determine the third, and
 * **which one is derived is the entire design problem**. A triple that
 * silently recomputes is the most common defect in scheduling software: the
 * user asserted one of the three, and which one survives the next edit is
 * information they otherwise have to discover by experiment.
 *
 * So `hold` is explicit state, and it is rendered. Change the duration and the
 * end follows, marked *Derived*; type an end and the duration follows instead,
 * and the **Held** badge moves with it. Moving the start keeps whatever was
 * asserted: hold the duration and the session slides, hold the end and it
 * stretches. Both are correct; only one can be the default, so the component
 * says which one you got.
 *
 * Two more decisions worth naming.
 *
 * **Crossing midnight is a value, not an error.** 11:30 PM to 12:30 AM is a
 * crisis-line shift and a residential handover. Refusing it teaches staff to
 * type the wrong date to get past the validator, which is how you lose the
 * real data.
 *
 * **Duration bands are data.** The component renders the band a value lands in
 * and asserts nothing. ADR 0009 prohibits a component deriving a coding
 * recommendation, and the thresholds differ by payer, by contract and by year.
 */

export interface SessionTimeFieldProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue" | "children"
> {
  /** Controlled value. Pass `null` for empty, never `undefined`. */
  value?: SessionInterval | null;
  /**
   * Uncontrolled initial value. Pass this or `value`, never both; `value` wins if you pass
   * both.
   */
  defaultValue?: SessionInterval | null;
  /**
   * Fired whenever start, end or duration changes. The interval is always internally
   * consistent when it fires.
   */
  onChange?: (value: SessionInterval) => void;

  /**
   * Durations offered as one-press chips. Organisation configuration.
   *
   * Behavioural health does not run on a tidy 15/30/45/60 ladder, and a
   * component that ships one has made an assumption about somebody's contract.
   */
  durationPresets?: readonly DurationPreset[];
  /**
   * Bands a duration is reported against — the organisation's own thresholds.
   * Rendered, never asserted, and never used to recommend anything.
   */
  bands?: readonly DurationBand[];

  /**
   * Upper bound on a derived duration. Eight hours by default.
   *
   * Not a clamp. A start dragged past a held end is the one way to reach an
   * absurd duration, and the component says so and offers the likeliest
   * correction rather than quietly rounding the value into range.
   */
  maxMinutes?: number;
  /** Whether an end at or before the start is read as the next day. */
  allowOvernight?: boolean;

  /** 24-hour display. The stored interval is 24-hour either way. */
  hour24?: boolean;
  /** The date the session starts on, so the next-day badge can name a day. */
  startDateLabel?: string;
  /**
   * How a session crossing midnight is labelled — “next day” by default. The crossing is a
   * value, not a warning.
   */
  nextDateLabel?: string;

  /** The field's visible label, and its accessible name. */
  label?: string;
  /** Label for the start segment. */
  startLabel?: string;
  /** Label for the end segment. */
  endLabel?: string;
  /**
   * Label for the derived duration. Derived and editable — typing a duration moves the end,
   * not the start.
   */
  durationLabel?: string;

  /**
   * Removes the field from the tab order entirely. Prefer `readOnly` for anything the reader
   * may still need to read.
   */
  disabled?: boolean;
  /**
   * Readable and focusable but not editable — the right prop for a value governed by policy or
   * record state.
   */
  readOnly?: boolean;
  /** The validation message. Announced, and it replaces the hint rather than stacking under it. */
  error?: React.ReactNode;
}

const DEFAULT_SESSION = (): SessionInterval => sessionFrom({ kind: "time", h: 9, mi: 0 }, 60);

export const SessionTimeField = React.forwardRef<HTMLDivElement, SessionTimeFieldProps>(
  function SessionTimeField(props, ref) {
    const {
      value: controlled,
      defaultValue,
      onChange,
      durationPresets,
      bands,
      maxMinutes = 480,
      allowOvernight = true,
      hour24 = false,
      startDateLabel,
      nextDateLabel,
      label = "Session",
      startLabel = "Start",
      endLabel = "End",
      durationLabel = "Duration",
      disabled,
      readOnly,
      error,
      className,
      ...rest
    } = props;

    const [session, setSession] = useTemporalValue(
      controlled ?? undefined,
      defaultValue ?? DEFAULT_SESSION(),
    );

    const reactId = React.useId();
    const messageId = `${reactId}-message`;
    const options = { maxMin: maxMinutes, allowOvernight };

    const emit = (next: SessionInterval) => {
      setSession(next);
      onChange?.(next);
    };

    const band = bands?.length ? bandFor(session.durationMin, bands) : null;
    const suggestedEnd = session.suggestedEnd;

    /**
     * The verdict, in the same three tiers every field in the family uses.
     * `exceedsMax` is an error because the value is not a session anybody
     * meant; a band with no code is an advisory because it is legal and worth
     * saying once.
     */
    const notice: { tone: "error" | "warning" | "hint"; text: React.ReactNode } | null = error
      ? { tone: "error", text: error }
      : session.exceedsMax
        ? {
            tone: "error",
            text: (
              <>
                {`Longer than the ${formatDuration(session.maxMin)} maximum for this session type.`}
                {suggestedEnd ? (
                  <>
                    {" "}
                    <button
                      type="button"
                      className="ox-dt-chip"
                      onClick={() => emit(withSessionEnd(session, suggestedEnd, options))}
                    >
                      {`End at ${formatClockTime(suggestedEnd, { hour24 })} instead`}
                    </button>
                  </>
                ) : null}
              </>
            ),
          }
        : bands?.length && !band?.code
          ? {
              tone: "warning",
              text: "Shorter than the organisation's shortest billable band.",
            }
          : band?.code
            ? { tone: "hint", text: `Falls in the ${band.code} band — ${band.label}.` }
            : null;

    return (
      <div
        ref={ref}
        role="group"
        aria-label={label}
        // The driver, queryable. A VRT shot and an interaction test both need
        // to know which member is held, and reading it off a class name is
        // how a test comes to depend on a style.
        data-ox-session={session.hold}
        className={cn("ox-dt-stack", className)}
        {...rest}
      >
        <div className="ox-dt-session">
          <TimeField
            label={startLabel}
            hour24={hour24}
            value={session.start}
            disabled={disabled}
            readOnly={readOnly}
            onChange={(time) => {
              if (time) emit(withSessionStart(session, time, options));
            }}
          />

          <span className="ox-dt-session__arrow" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12h15m-6-6 6 6-6 6" />
            </svg>
          </span>

          <div className="ox-dt-stack">
            <TimeField
              label={endLabel}
              hour24={hour24}
              value={session.end}
              disabled={disabled}
              readOnly={readOnly}
              onChange={(time) => {
                if (time) emit(withSessionEnd(session, time, options));
              }}
            />
            <DriverBadge held={session.hold === "end"} />
            {session.endDayOffset ? (
              <span className="ox-dt-nextday">
                {nextDateLabel ? `next day · ${nextDateLabel}` : "next day"}
              </span>
            ) : null}
          </div>

          <div className="ox-dt-stack">
            <span className="ox-dt-label" id={`${reactId}-duration`}>
              {durationLabel}
            </span>
            <output
              className={cn(
                "ox-dt-session__duration",
                session.hold === "duration" && "ox-dt-session__duration--held",
                session.exceedsMax && "ox-dt-session__duration--invalid",
              )}
              aria-labelledby={`${reactId}-duration`}
            >
              {formatDuration(session.durationMin)}
            </output>
            <DriverBadge held={session.hold === "duration"} />
          </div>
        </div>

        {durationPresets?.length ? (
          <div className="ox-dt-chips" role="group" aria-label="Session length">
            {durationPresets.map((preset) => (
              <button
                key={preset.minutes}
                type="button"
                className="ox-dt-chip"
                aria-pressed={session.durationMin === preset.minutes}
                disabled={disabled || readOnly}
                title={preset.label}
                onClick={() => emit(withSessionDuration(session, preset.minutes, options))}
              >
                {`${preset.minutes}m`}
                {bands?.length ? (
                  <span className="ox-dt-chip__code">
                    {bandFor(preset.minutes, bands)?.code ?? ""}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        {/* The whole session as one sentence, for a screen reader that would
            otherwise have to assemble it from three separate controls and a
            badge. Polite: it changes on every keystroke. */}
        <span className="ox-dt-sr" role="status" aria-live="polite">
          {`${formatClockTime(session.start, { hour24 })} to ${formatClockTime(session.end, { hour24 })}${
            session.endDayOffset ? " the next day" : ""
          }, ${formatDuration(session.durationMin)}. ${
            session.hold === "duration"
              ? "Duration is held; the end time follows it."
              : "End time is held; the duration follows it."
          }`}
        </span>

        {startDateLabel ? (
          <span className="ox-dt-sr">{`Session date ${startDateLabel}`}</span>
        ) : null}

        {notice ? (
          <FieldMessage id={messageId} tone={notice.tone}>
            {notice.text}
          </FieldMessage>
        ) : null}
      </div>
    );
  },
);

SessionTimeField.displayName = "SessionTimeField";

/**
 * The badge that is the component.
 *
 * A lock glyph, a word, and a tint — three channels for one bit, so it
 * survives greyscale, forced-colors and a reader who cannot separate the
 * accent from the muted text.
 */
function DriverBadge(props: { held: boolean }) {
  return (
    <span className={cn("ox-dt-driver", props.held && "ox-dt-driver--held")}>
      {props.held ? <LockGlyph /> : null}
      {props.held ? "Held" : "Derived"}
    </span>
  );
}

/**
 * The duration presets a behavioural-health practice usually starts from.
 *
 * Exported as a starting point, not a default: the component ships no presets
 * of its own, because a fifty-three-minute session is a fact about somebody's
 * payer contract rather than about therapy.
 */
export const BEHAVIORAL_HEALTH_DURATIONS: readonly DurationPreset[] = [
  { minutes: 15, label: "Check-in" },
  { minutes: 20, label: "Medication follow-up" },
  { minutes: 30, label: "Brief" },
  { minutes: 45, label: "Therapy" },
  { minutes: 53, label: "Psychotherapy" },
  { minutes: 60, label: "Session" },
  { minutes: 90, label: "Intake or group" },
];

/* ================================================================== */
/* birth-date-field
/* ================================================================== */

/**
 * BirthDateField — the highest-volume date in healthcare, and the one
 * general-purpose pickers serve worst.
 *
 *     <BirthDateField now={today} value={dob} onChange={setDob} />
 *
 * Type `07181986`. Eight keystrokes, no mouse, and the age appears beside it.
 *
 * **No calendar opens by default, and when one does it opens on the year.** A
 * date-of-birth calendar that opens on the current month has decided the
 * patient was born this month, and navigating back four hundred and eighty
 * months is not an interaction anybody designed — it is one nobody thought
 * about.
 *
 * **The age is the proof-read.** A transposed year is invisible in
 * `07/18/1968` and screaming in *58 years old*. Under two years it reads in
 * months and under four weeks in days, because a paediatric chart that says
 * "0 years old" for a four-month-old has discarded the only number that
 * mattered.
 *
 * **A partial date is a real date.** FHIR permits `YYYY` and `YYYY-MM` for
 * `Patient.birthDate`, and homeless services, unaccompanied minors and
 * forensic intake all produce them. Coercing "born around 1962" to 1 January
 * 1962 invents a fact that will be read as precise for the rest of the
 * record's life.
 *
 * **And absence is stated.** `onChange` can emit `{ kind: "absent", reason }`,
 * which renders "Not recorded" — never an em dash, never "N/A". A registration
 * form that cannot distinguish "no date of birth" from "nobody asked" is
 * lying, and that is the same argument Switch makes for its third value.
 */

/** Everything a birth date can legitimately be. */
export type BirthDateValue = OxDate | OxPartialDate | OxAbsentDate | null;

/** How much of the date the workflow is asking for. */
export type BirthDatePrecision = "day" | "month" | "year";

export interface BirthDateFieldProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue" | "children"
> {
  /** Controlled value. Pass `null` for empty, never `undefined`. */
  value?: BirthDateValue;
  /**
   * Uncontrolled initial value. Pass this or `value`, never both; `value` wins if you pass
   * both.
   */
  defaultValue?: BirthDateValue;
  /**
   * Fired with the whole birth-date value, which carries its precision and any absence reason
   * alongside the date.
   */
  onChange?: (value: BirthDateValue) => void;

  /** Today, supplied by the host. The age and the future check both need it. */
  now: OxDate;

  /**
   * How exactly the date is known — full, month, or year. Controlled; pair with
   * `onPrecisionChange`.
   */
  precision?: BirthDatePrecision;
  /** Fired when the reader downgrades precision, e.g. choosing “Exact date unknown”. */
  onPrecisionChange?: (precision: BirthDatePrecision) => void;
  /** Offers "Exact date unknown", which switches the field to year only. */
  allowEstimated?: boolean;
  /** Offers "Not recorded", which emits an absent value carrying a reason. */
  allowAbsent?: boolean;
  /**
   * Why no date is recorded. A date of birth that is missing and one that was refused are
   * different facts about the record.
   */
  absentReason?: TemporalAbsence;

  /**
   * Segment order — from the locale, never guessed. A US and a UK intake form disagree, and
   * getting it wrong silently swaps day and month.
   */
  order?: DateOrder;
  /** The year two-digit input pivots on. Below it reads as 20xx, at or above as 19xx. */
  twoDigitYearPivot?: number;

  /**
   * A value already on file, offered as a one-press fill.
   *
   * WCAG 2.2 SC 3.3.7 asks that previously entered information be available
   * rather than re-typed — intake asks for a date of birth two and three times.
   * Offered rather than applied, because silently pre-filling a legal
   * attestation is a different defect from making somebody type it twice.
   */
  suggested?: OxDate;

  /** The field's visible label, and its accessible name. */
  label?: string;
  /** Marks the field required and announces it. Does not itself validate. */
  required?: boolean;
  /**
   * Guidance under the field, associated with it so assistive technology reads it as part of
   * the field.
   */
  hint?: React.ReactNode;
  /** The validation message. Announced, and it replaces the hint rather than stacking under it. */
  error?: React.ReactNode;
  /** Hide the age readout. Rarely right — it is the field's own error check. */
  hideAge?: boolean;

  /**
   * Removes the field from the tab order entirely. Prefer `readOnly` for anything the reader
   * may still need to read.
   */
  disabled?: boolean;
  /**
   * Readable and focusable but not editable — the right prop for a value governed by policy or
   * record state.
   */
  readOnly?: boolean;
  /** Form field name, for an uncontrolled submit. */
  name?: string;
}

const YEAR_SEGMENT: FieldSegment = {
  key: "y",
  length: 4,
  min: 1,
  max: 9999,
  placeholder: "YYYY",
  label: "Year of birth",
  wide: true,
};

function isAbsent(value: BirthDateValue): value is OxAbsentDate {
  return !!value && value.kind === "absent";
}

function asFullDate(value: BirthDateValue): OxDate | null {
  return value && value.kind === "date" ? value : null;
}

export const BirthDateField = React.forwardRef<HTMLDivElement, BirthDateFieldProps>(
  function BirthDateField(props, ref) {
    const {
      value: controlled,
      defaultValue = null,
      onChange,
      now,
      precision: controlledPrecision,
      onPrecisionChange,
      allowEstimated = false,
      allowAbsent = false,
      absentReason = "unknown",
      order = "MDY",
      twoDigitYearPivot,
      suggested,
      label = "Date of birth",
      required,
      hint,
      error,
      hideAge,
      disabled,
      readOnly,
      name,
      id,
      className,
      ...rest
    } = props;

    const [value, setValue] = useTemporalValue<BirthDateValue>(controlled, defaultValue);
    const [precision, setPrecision] = useTemporalValue<BirthDatePrecision>(
      controlledPrecision,
      "day",
    );
    const [segments, setSegments] = React.useState<SegmentValues>(() =>
      dateToSegments(asFullDate(value)),
    );
    const [open, setOpen] = React.useState(false);
    const [month, setMonth] = React.useState<MonthRef>(() => {
      const full = asFullDate(value);
      // Not the current month. A birth-date calendar that opens on today has
      // decided the patient was born this month.
      return full ? { y: full.y, m: full.m } : { y: now.y - 40, m: 1 };
    });

    const markEmitted = useValueSync(birthKey(value), () =>
      setSegments(dateToSegments(asFullDate(value))),
    );

    const reactId = React.useId();
    const fieldId = id ?? `${reactId}-field`;
    const messageId = `${reactId}-message`;

    const emit = (next: BirthDateValue) => {
      markEmitted(birthKey(next));
      setValue(next);
      onChange?.(next);
    };

    const commitSegments = (next: SegmentValues) => {
      setSegments(next);
      if (precision === "year") {
        emit(next.y == null ? null : { kind: "partial-date", y: next.y });
        return;
      }
      emit(segmentsToDate(next));
    };

    const switchPrecision = (next: BirthDatePrecision) => {
      setPrecision(next);
      onPrecisionChange?.(next);
      setSegments({ m: null, d: null, y: null });
      emit(null);
    };

    /* ---- the readout ------------------------------------------------ */

    const full = asFullDate(value);
    const future = full ? compareDates(full, now) > 0 : false;
    const age = full && !future ? ageOn(full, now) : null;

    let notice: { tone: "error" | "warning" | "hint" | "success"; text: React.ReactNode } | null =
      null;

    if (error) {
      notice = { tone: "error", text: error };
    } else if (future && full) {
      // A hard error, not a warning. A person cannot be born tomorrow, and
      // this is the one date field where the future is genuinely impossible.
      notice = {
        tone: "error",
        text: `A date of birth cannot be in the future. ${formatPlainDate(full, "medium")} has not happened yet.`,
      };
    } else if (isAbsent(value)) {
      notice = {
        tone: "warning",
        text:
          absentReason === "asked-declined"
            ? "Not recorded — the person declined to give it."
            : absentReason === "not-asked"
              ? "Not recorded — not asked at this visit."
              : "Not recorded — unknown.",
      };
    } else if (value?.kind === "partial-date") {
      notice = {
        tone: "warning",
        text: `Year only. Recorded as ${value.y} with precision "year", not as 1 January.`,
      };
    } else if (full) {
      notice = { tone: "success", text: formatPlainDate(full, "full") };
    } else if (hint) {
      notice = { tone: "hint", text: hint };
    }

    const segmentSet = precision === "year" ? [YEAR_SEGMENT] : dateSegments(order);

    return (
      <div
        ref={ref}
        data-ox-birth-date={isAbsent(value) ? "absent" : precision}
        className={cn("ox-dt-stack", className)}
        {...rest}
      >
        <label className="ox-dt-label" htmlFor={fieldId}>
          {label}
          {required ? (
            <span className="ox-dt-label__required" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>

        {isAbsent(value) ? (
          <div className="ox-dt-readout">
            <span className="ox-dt-readout__absent">Not recorded</span>
            {!readOnly && !disabled ? (
              <button
                type="button"
                className="ox-dt-chip"
                onClick={() => {
                  emit(null);
                  setSegments({ m: null, d: null, y: null });
                }}
              >
                Enter a date
              </button>
            ) : null}
          </div>
        ) : (
          <div className="ox-dt-anchor">
            <SegmentedField
              id={fieldId}
              segments={segmentSet}
              values={segments}
              onValues={commitSegments}
              label={label}
              invalid={future}
              disabled={disabled}
              readOnly={readOnly}
              describedBy={notice ? messageId : undefined}
              trigger={
                readOnly || precision === "year"
                  ? undefined
                  : {
                      icon: <CalendarGlyph />,
                      label: open ? "Close calendar" : "Open calendar",
                      expanded: open,
                      onPress: () => setOpen((was) => !was),
                    }
              }
              onPasteText={(text) => {
                const parsed = parseDateDigits(text, { order, twoDigitYearPivot });
                if (parsed) commitSegments(dateToSegments(parsed));
              }}
            />

            <TemporalPopover
              open={open}
              onDismiss={() => setOpen(false)}
              label="Choose a year of birth"
            >
              <CalendarGrid
                mode="single"
                value={full}
                month={month}
                onMonth={setMonth}
                onSelect={(date) => {
                  commitSegments(dateToSegments(date));
                  setOpen(false);
                }}
                today={now}
                unavailable={(date) => (compareDates(date, now) > 0 ? "in the future" : null)}
              />
            </TemporalPopover>
          </div>
        )}

        {!hideAge && (age || value?.kind === "partial-date") ? (
          <div className="ox-dt-age">
            {age ? (
              <>
                <span className="ox-dt-age__value">
                  {age.days < 28 ? age.days : age.years < 2 ? age.months : age.years}
                </span>
                <span className="ox-dt-age__unit">
                  {describeAgeLabel(age).replace(/^\d+\s/, "")}
                </span>
              </>
            ) : value?.kind === "partial-date" ? (
              <>
                <span className="ox-dt-age__value">{`about ${now.y - value.y}`}</span>
                <span className="ox-dt-age__unit">years old</span>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="ox-dt-chips">
          {suggested && !full ? (
            <button
              type="button"
              className="ox-dt-chip"
              disabled={disabled || readOnly}
              onClick={() => commitSegments(dateToSegments(suggested))}
            >
              {`Use ${formatPlainDate(suggested, "medium")} from the record`}
            </button>
          ) : null}

          {allowEstimated ? (
            <button
              type="button"
              className="ox-dt-chip"
              aria-pressed={precision === "year"}
              disabled={disabled || readOnly}
              onClick={() => switchPrecision(precision === "year" ? "day" : "year")}
            >
              Exact date unknown
            </button>
          ) : null}

          {allowAbsent ? (
            <button
              type="button"
              className="ox-dt-chip"
              aria-pressed={isAbsent(value)}
              disabled={disabled || readOnly}
              onClick={() =>
                emit(isAbsent(value) ? null : { kind: "absent", reason: absentReason })
              }
            >
              Not recorded
            </button>
          ) : null}
        </div>

        {name ? (
          <input
            type="hidden"
            name={name}
            value={
              full
                ? formatPlainDate(full, "iso")
                : value?.kind === "partial-date"
                  ? String(value.y)
                  : ""
            }
          />
        ) : null}

        {notice ? (
          <FieldMessage id={messageId} tone={notice.tone}>
            {notice.text}
          </FieldMessage>
        ) : null}
      </div>
    );
  },
);

BirthDateField.displayName = "BirthDateField";

/* ================================================================== */
/* clinical-date-time
/* ================================================================== */

/**
 * ClinicalDateTime — a temporal value in the state a reviewer, an auditor or a
 * printer sees.
 *
 *     <ClinicalDateTime value={signedAt} now={today} viewerZone={me.zone} showZone />
 *
 * Read-only, and the read-only case is not a lesser one: most temporal values
 * in a record are looked at far more often than they are entered.
 *
 * **The absolute value first, the relative second.** "3 days after service" is
 * a reading aid; the timestamp is the record, and a reviewer will ask. Any
 * component that leads with "3 days ago" has made the aid the value.
 *
 * **A signature prints its zone.** Anything a legal instrument depends on
 * renders the stored instant and its IANA zone, because "8:12 AM" on a
 * countersignature is not a time until somebody says where.
 *
 * **Absence is stated, never punctuated.** Not an em dash, not "N/A" —
 * CONTENT.md is normative and lint-backed on this, and an absent value carries
 * the reason it is absent.
 *
 * **Two zones appear only when there are two.** Rendering "3:00 PM ET" to
 * somebody already in Eastern Time is noise that teaches readers to stop
 * reading zone labels, so the second line is conditional on the zones actually
 * differing.
 */

export interface ClinicalDateTimeProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** Any member of the temporal value space, including absence. */
  value: OxTemporal | null;
  /** Today, for the relative aid. Omit it and no relative label is rendered. */
  now?: OxDate;
  /** Show "5 days ago" beside the value. */
  showRelative?: boolean;
  /**
   * Print the stored instant and its zone underneath.
   *
   * On for anything a signature depends on. It survives print, which is where
   * a great many of these values are actually read.
   */
  showZone?: boolean;
  /** The reader's own zone. A second line appears only if it differs. */
  viewerZone?: string;
  /** 24-hour display. The recorded value is 24-hour either way. */
  hour24?: boolean;
  /** Marks a value the reader's access level hides rather than removes. */
  restricted?: boolean;
  /** Wrapping element. `time` where the value is a real instant. */
  as?: "span" | "time" | "div";
}

const ABSENCE_WORDS: Record<string, string> = {
  unknown: "Not recorded",
  "asked-declined": "Not recorded — declined",
  "not-asked": "Not recorded — not asked",
  "temp-unknown": "Not recorded — pending",
};

export const ClinicalDateTime = React.forwardRef<HTMLElement, ClinicalDateTimeProps>(
  function ClinicalDateTime(props, ref) {
    const {
      value,
      now,
      showRelative,
      showZone,
      viewerZone,
      hour24 = false,
      restricted,
      as = "span",
      className,
      ...rest
    } = props;

    const Tag = as as React.ElementType;

    if (restricted) {
      return (
        <Tag
          ref={ref}
          data-ox-clinical-date-time="restricted"
          className={cn("ox-dt-readout", "ox-dt-readout--restricted", className)}
          {...rest}
        >
          {/* Masked rather than removed: a missing field reads as a missing
              record, and the difference matters to whoever asks next. */}
          <span aria-hidden="true">•• / •• / ••••</span>
          <span className="ox-dt-sr">Hidden by your access level</span>
        </Tag>
      );
    }

    if (!value) {
      return (
        <Tag
          ref={ref}
          data-ox-clinical-date-time="empty"
          className={cn("ox-dt-readout", className)}
          {...rest}
        >
          <span className="ox-dt-readout__absent">Not recorded</span>
        </Tag>
      );
    }

    if (value.kind === "absent") {
      return (
        <Tag
          ref={ref}
          data-ox-clinical-date-time="absent"
          className={cn("ox-dt-readout", className)}
          {...rest}
        >
          <span className="ox-dt-readout__absent">
            {ABSENCE_WORDS[value.reason] ?? "Not recorded"}
          </span>
        </Tag>
      );
    }

    /* ---- the parts ---------------------------------------------------- */

    let primary: string;
    let dateForRelative: OxDate | null = null;
    let machine: string | undefined;

    switch (value.kind) {
      case "date":
        primary = formatPlainDate(value, "medium");
        dateForRelative = value;
        machine = formatPlainDate(value, "iso");
        break;
      case "partial-date":
        // Rendered at the precision it was recorded at. Padding a year to
        // 1 January is the invention this whole value type exists to prevent.
        primary =
          value.m === undefined
            ? String(value.y)
            : value.d === undefined
              ? `${formatPlainDate({ kind: "date", y: value.y, m: value.m, d: 1 }, "medium").replace(/ \d+,/, "")}`
              : formatPlainDate({ kind: "date", y: value.y, m: value.m, d: value.d }, "medium");
        machine =
          value.m === undefined
            ? String(value.y)
            : `${value.y}-${String(value.m).padStart(2, "0")}`;
        break;
      case "time":
        primary = formatClockTime(value, { hour24, showSecond: value.s !== undefined });
        break;
      case "datetime":
        primary = `${formatPlainDate(value.date, "medium")} · ${formatClockTime(value.time, { hour24 })}`;
        dateForRelative = value.date;
        machine = `${formatPlainDate(value.date, "iso")}T${formatClockTime(value.time, { hour24: true })}`;
        break;
      case "instant":
      default: {
        const instant = value as Extract<OxTemporal, { kind: "instant" }>;
        primary = `${formatPlainDate(instant.date, "medium")} · ${formatClockTime(instant.time, { hour24 })}`;
        dateForRelative = instant.date;
        machine = `${formatPlainDate(instant.date, "iso")}T${formatClockTime(instant.time, { hour24: true })} ${instant.zone}`;
        break;
      }
    }

    /* ---- the viewer's own zone, only when it differs ------------------ */

    let secondZone: string | null = null;
    if (value.kind === "instant" && viewerZone && viewerZone !== value.zone) {
      const shifted = describeZoneShift(value, viewerZone);
      if (shifted && !shifted.sameZone) {
        const sameDay =
          shifted.date.y === value.date.y &&
          shifted.date.m === value.date.m &&
          shifted.date.d === value.date.d;
        secondZone = sameDay
          ? `${formatClockTime(shifted.local, { hour24 })} your time`
          : `${formatPlainDate(shifted.date, "short")} · ${formatClockTime(shifted.local, { hour24 })} your time`;
      }
    }

    const relative =
      showRelative && now && dateForRelative ? describeRelativeDay(dateForRelative, now) : null;

    return (
      <Tag
        ref={ref}
        data-ox-clinical-date-time={value.kind}
        dateTime={as === "time" ? machine : undefined}
        className={cn("ox-dt-readout", className)}
        {...rest}
      >
        <span>{primary}</span>
        {relative ? <span className="ox-dt-readout__relative">{relative}</span> : null}
        {secondZone ? <span className="ox-dt-readout__relative">{secondZone}</span> : null}
        {showZone && value.kind === "instant" ? (
          <span className="ox-dt-readout__zone">{machine}</span>
        ) : null}
      </Tag>
    );
  },
);

ClinicalDateTime.displayName = "ClinicalDateTime";

/* ================================================================== */
/* time-slot-grid
/* ================================================================== */

/**
 * TimeSlotGrid — the times a day actually has, grouped and counted.
 *
 *     <TimeSlotGrid set={availability} now={now} value={slotId} onSelect={setSlot} />
 *
 * Presentational, and deliberately so. It renders an `AvailabilitySet` the
 * host supplies and reports what the user did; it does not fetch, does not
 * rank, and does not decide what a conflict is. ADR 0009 forbids the first,
 * and the other two are clinical and commercial questions wearing a UI
 * costume.
 *
 * **Four states and no more.** Available, selected, held elsewhere, blocked.
 * The three reasons a slot can be blocked — booked, clinician unavailable, no
 * room — share one muted treatment and differ in the accessible name and the
 * tooltip, because five colours would be five things to learn and still
 * illegible to a reader who cannot separate them.
 *
 * **Held is not booked.** Somebody else's reservation expires; a grid that
 * renders the two identically tells a user to give up on a time that will be
 * free in four minutes.
 *
 * **Stale is a designed state.** The slots stay visible and dimmed with an
 * explicit age rather than disappearing, because clearing the grid on a
 * refresh throws away a selection somebody was in the middle of making.
 */

export interface TimeSlotGridProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect" | "children"
> {
  /** Availability as the host read it. Never fetched here. */
  set: AvailabilitySet;
  /** The clock, injected. Staleness is measured against it. */
  now?: { date: OxDate; time: OxTime };
  /** Selected slot id. Ids are stable across a refresh on purpose. */
  value?: string | null;
  /**
   * Fired with the chosen slot. A slot that is taken is rendered and disabled rather than
   * removed, so the grid does not reflow under the reader's cursor.
   */
  onSelect?: (slot: Slot) => void;
  /** Offered when the set is stale. Absent means refreshing is not possible. */
  onRefresh?: () => void;

  /** 24-hour display. */
  hour24?: boolean;
  /** Group label, read by assistive technology before the times. */
  label?: string;
  /** Rendered when there is nothing to choose. */
  emptyState?: React.ReactNode;
  /**
   * Disables the whole grid. Individual slot availability comes from the slot data, not from
   * here.
   */
  disabled?: boolean;
}

export const TimeSlotGrid = React.forwardRef<HTMLDivElement, TimeSlotGridProps>(
  function TimeSlotGrid(props, ref) {
    const {
      set,
      now,
      value = null,
      onSelect,
      onRefresh,
      hour24 = false,
      label = "Available times",
      emptyState,
      disabled,
      className,
      ...rest
    } = props;

    const groups = React.useMemo(() => groupSlots(set.slots), [set.slots]);
    const stale = now ? isStale(set, now) : false;
    const ageMinutes = now ? Math.max(0, Math.round(secondsSince(set, now) / 60)) : 0;

    const openTotal = groups.reduce((sum, group) => sum + group.openCount, 0);

    if (set.slots.length === 0 || openTotal === 0) {
      return (
        <div ref={ref} data-ox-slot-grid="empty" className={cn("ox-dt-stack", className)} {...rest}>
          {emptyState ?? (
            <p className="ox-dt-msg">
              {set.exhausted
                ? "No times on this day."
                : // "We stopped looking" and "there is nothing" are different
                  // sentences with different next actions, and a scheduler that
                  // conflates them has handed the problem back to somebody who
                  // cannot solve it.
                  "No times found in the window searched. Widening the search may find more."}
            </p>
          )}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        data-ox-slot-grid={stale ? "stale" : "fresh"}
        className={cn("ox-dt-stack", className)}
        {...rest}
      >
        {now ? (
          <p className="ox-dt-asof" role="status" aria-live="polite">
            {stale
              ? `Availability is ${ageMinutes} minute${ageMinutes === 1 ? "" : "s"} old.`
              : `${openTotal} time${openTotal === 1 ? "" : "s"} · as of ${formatClockTime(set.asOf.time, { hour24 })}`}
            {stale && onRefresh ? (
              <button type="button" className="ox-dt-chip" onClick={onRefresh}>
                Refresh
              </button>
            ) : null}
          </p>
        ) : null}

        <div className={cn(stale && "ox-dt-slots--stale")}>
          {groups.map((group) => (
            <section key={group.part} className="ox-dt-slotgroup">
              <h6 className="ox-dt-slotgroup__head" id={`${group.part}-head`}>
                {group.label}
                <span className="ox-dt-slotgroup__rule" aria-hidden="true" />
                <span>{`${group.openCount} open`}</span>
              </h6>
              <div className="ox-dt-slots" role="group" aria-labelledby={`${group.part}-head`}>
                {group.slots.map((slot) => (
                  <SlotButton
                    key={slot.id}
                    slot={slot}
                    selected={slot.id === value}
                    hour24={hour24}
                    disabled={disabled}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* The group label, once, for a reader arriving by landmark. */}
        <span className="ox-dt-sr">{label}</span>
      </div>
    );
  },
);

TimeSlotGrid.displayName = "TimeSlotGrid";

function SlotButton(props: {
  slot: Slot;
  selected: boolean;
  hour24: boolean;
  disabled?: boolean;
  onSelect?: (slot: Slot) => void;
}) {
  const { slot, selected, hour24, disabled, onSelect } = props;
  const state = slot.state;
  const blocked = state.kind === "blocked";
  const held = state.kind === "held";
  const end = timeFromMinutes(minutesOfTime(slot.start) + slot.durationMinutes).time;

  // The whole interval and its state, spoken. A grid of bare start times gives
  // a screen-reader user no way to know how long anything is, or why a time
  // they can hear is one they cannot take.
  let name = `${formatClockTime(slot.start, { hour24 })} to ${formatClockTime(end, { hour24 })}`;
  if (blocked) name += `, unavailable, ${SLOT_BLOCK_WORDS[state.reason]}`;
  if (held) {
    const minutes = Math.max(1, Math.round(state.expiresInSeconds / 60));
    name +=
      state.by === "me"
        ? `, held for you, ${minutes} minute${minutes === 1 ? "" : "s"} remaining`
        : `, held by someone else, ${minutes} minute${minutes === 1 ? "" : "s"} remaining`;
  }
  if (state.kind === "booked") name += ", booked";

  return (
    <button
      type="button"
      data-ox-slot={state.kind}
      className={cn(
        "ox-dt-slot",
        selected && "ox-dt-slot--selected",
        blocked && "ox-dt-slot--blocked",
        held && "ox-dt-slot--held",
      )}
      aria-label={name}
      aria-pressed={selected}
      aria-disabled={blocked || undefined}
      title={blocked ? SLOT_BLOCK_WORDS[state.reason] : undefined}
      disabled={disabled}
      onClick={() => {
        if (blocked) return;
        onSelect?.(slot);
      }}
    >
      {formatClockTime(slot.start, { hour24 })}
    </button>
  );
}

/* ================================================================== */
/* recurrence-field
/* ================================================================== */

/**
 * RecurrenceField — the rule, in words, before it is created.
 *
 *     <RecurrenceField value={rule} onChange={setRule} startDate={first} />
 *
 * **The sentence is the product.** It is the only part of a recurrence builder
 * most users read, so it is rendered as content rather than as a hint, and it
 * is what the live region announces when the rule changes. A builder whose
 * summary lives in a tooltip has a dozen controls and no answer.
 *
 * The rule is emitted as a real RFC 5545 `RRULE` with its `EXDATE`, so a
 * series round-trips with iCalendar, FHIR `Timing` and every calendar the
 * customer already runs. A rule outside the implemented subset is rendered
 * read-only with its original string intact rather than silently truncated —
 * the failure being avoided is a twelve-week plan quietly losing four sessions
 * on import, which nobody notices until a patient arrives on a day that is not
 * in the diary.
 */

export type RecurrenceEnd = "count" | "until" | "never";

export interface RecurrenceFieldProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue" | "children"
> {
  /** Controlled value. Pass `null` for empty, never `undefined`. */
  value?: RecurrenceRule;
  /**
   * Uncontrolled initial value. Pass this or `value`, never both; `value` wins if you pass
   * both.
   */
  defaultValue?: RecurrenceRule;
  /** Fired with the recurrence rule whenever any part of it changes. */
  onChange?: (rule: RecurrenceRule) => void;

  /** The first occurrence. The rule is meaningless without one. */
  startDate: OxDate;
  /** Rendered into the sentence — "at 3:00 PM". */
  timeLabel?: string;
  /** How far the preview expands. Bounded twice; this is the softer bound. */
  previewCount?: number;
  /** Session counts a practice offers. Configuration, not a ladder we chose. */
  countOptions?: readonly number[];
  /** Whether "no end date" may be chosen at all. */
  allowNoEnd?: boolean;
  /** Emitted whenever the expansion changes, so a host can check conflicts. */
  onExpand?: (dates: OxDate[]) => void;

  /**
   * A rule imported from elsewhere that this component cannot express.
   *
   * Rendered read-only with the original string. Refusing is the feature: a
   * general expander that drops what it does not understand is worse.
   */
  unsupported?: { source: string; parts: string[] } | null;

  /** The field's visible label, and its accessible name. */
  label?: string;
  /**
   * Removes the field from the tab order entirely. Prefer `readOnly` for anything the reader
   * may still need to read.
   */
  disabled?: boolean;
  /**
   * Shows the generated RFC 5545 RRULE. For an integrator checking what the control produces,
   * not for a clinician.
   */
  showRRule?: boolean;
}

interface FrequencyOption {
  id: RecurrenceFrequency;
  label: string;
  unit: string;
  units: string;
}

const WEEKLY: FrequencyOption = { id: "WEEKLY", label: "Weekly", unit: "week", units: "weeks" };

const FREQUENCIES: FrequencyOption[] = [
  { id: "DAILY", label: "Daily", unit: "day", units: "days" },
  WEEKLY,
  { id: "MONTHLY", label: "Monthly", unit: "month", units: "months" },
];

export const RecurrenceField = React.forwardRef<HTMLDivElement, RecurrenceFieldProps>(
  function RecurrenceField(props, ref) {
    const {
      value: controlled,
      defaultValue,
      onChange,
      startDate,
      timeLabel,
      previewCount = 8,
      countOptions = [6, 8, 12, 16, 24],
      allowNoEnd = true,
      onExpand,
      unsupported = null,
      label = "Repeat",
      disabled,
      showRRule = true,
      className,
      ...rest
    } = props;

    const [rule, setRule] = useTemporalValue<RecurrenceRule>(
      controlled,
      defaultValue ?? { freq: "WEEKLY", interval: 1, count: 12 },
    );
    const reactId = React.useId();

    const endMode: RecurrenceEnd = rule.count ? "count" : rule.until ? "until" : "never";

    const emit = (next: RecurrenceRule) => {
      setRule(next);
      onChange?.(next);
    };

    const occurrences = React.useMemo(
      () => expandRule(rule, startDate, Math.max(previewCount, 60)),
      [rule, startDate, previewCount],
    );
    const kept = React.useMemo(() => keptOccurrences(occurrences), [occurrences]);

    const lastReported = React.useRef<string>("");
    React.useEffect(() => {
      const key = kept.map((o) => formatPlainDate(o.date, "iso")).join(",");
      if (key === lastReported.current) return;
      lastReported.current = key;
      onExpand?.(kept.map((o) => o.date));
    }, [kept, onExpand]);

    if (unsupported) {
      return (
        <div
          ref={ref}
          data-ox-recurrence="unsupported"
          className={cn("ox-dt-stack", className)}
          {...rest}
        >
          <span className="ox-dt-label">{label}</span>
          <p className="ox-dt-summary">
            <b>This series cannot be edited here.</b>{" "}
            {`It uses ${unsupported.parts.join(", ")}, which this builder does not implement.`}
            <code>{unsupported.source}</code>
          </p>
          <FieldMessage tone="warning">
            The rule is preserved exactly as received. Editing it elsewhere is safer than
            re-creating it from a partial reading.
          </FieldMessage>
        </div>
      );
    }

    const frequency = FREQUENCIES.find((f) => f.id === rule.freq) ?? WEEKLY;
    const sentence = describeSeries(rule, { timeLabel });
    const firstKept = kept[0];
    const lastKept = kept.at(-1);
    const bounded = rule.count != null || rule.until != null;

    return (
      <div
        ref={ref}
        role="group"
        aria-label={label}
        data-ox-recurrence={rule.freq.toLowerCase()}
        className={cn("ox-dt-stack", className)}
        {...rest}
      >
        <div className="ox-dt-stack">
          <span className="ox-dt-label" id={`${reactId}-freq`}>
            Frequency
          </span>
          <div className="ox-dt-chips" role="group" aria-labelledby={`${reactId}-freq`}>
            {FREQUENCIES.map((option) => (
              <button
                key={option.id}
                type="button"
                className="ox-dt-chip"
                aria-pressed={option.id === rule.freq}
                disabled={disabled}
                onClick={() => emit({ ...rule, freq: option.id })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ox-dt-stack">
          <span className="ox-dt-label" id={`${reactId}-interval`}>
            Every
          </span>
          <div className="ox-dt-chips" role="group" aria-labelledby={`${reactId}-interval`}>
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                className="ox-dt-chip"
                aria-pressed={(rule.interval ?? 1) === n}
                disabled={disabled}
                onClick={() => emit({ ...rule, interval: n })}
              >
                {n === 1 ? frequency.unit : `${n} ${frequency.units}`}
              </button>
            ))}
          </div>
        </div>

        {rule.freq === "WEEKLY" ? (
          <div className="ox-dt-stack">
            <span className="ox-dt-label" id={`${reactId}-days`}>
              On
            </span>
            <div className="ox-dt-weekdays" role="group" aria-labelledby={`${reactId}-days`}>
              {([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map((day) => {
                const on = (rule.byWeekday ?? []).includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    aria-label={WEEKDAY_NAMES[day]}
                    disabled={disabled}
                    onClick={() => {
                      const current = rule.byWeekday ?? [];
                      // Never empty: a weekly rule with no days is a rule that
                      // expands to nothing, which is not what unticking the
                      // last day means.
                      const next = on
                        ? current.length > 1
                          ? current.filter((d) => d !== day)
                          : current
                        : [...current, day].sort((a, b) => a - b);
                      emit({ ...rule, byWeekday: next });
                    }}
                  >
                    {WEEKDAY_ABBREVIATIONS[day]?.slice(0, 2)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="ox-dt-stack">
          <span className="ox-dt-label" id={`${reactId}-ends`}>
            Ends
          </span>
          <div className="ox-dt-chips" role="group" aria-labelledby={`${reactId}-ends`}>
            <button
              type="button"
              className="ox-dt-chip"
              aria-pressed={endMode === "count"}
              disabled={disabled}
              onClick={() => emit({ ...rule, count: countOptions[2] ?? 12, until: undefined })}
            >
              After a number of sessions
            </button>
            <button
              type="button"
              className="ox-dt-chip"
              aria-pressed={endMode === "until"}
              disabled={disabled}
              onClick={() =>
                emit({ ...rule, count: undefined, until: kept.at(-1)?.date ?? startDate })
              }
            >
              On a date
            </button>
            {allowNoEnd ? (
              <button
                type="button"
                className="ox-dt-chip"
                aria-pressed={endMode === "never"}
                disabled={disabled}
                onClick={() => emit({ ...rule, count: undefined, until: undefined })}
              >
                No end date
              </button>
            ) : null}
          </div>

          {endMode === "count" ? (
            <div className="ox-dt-chips" role="group" aria-label="Number of sessions">
              {countOptions.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="ox-dt-chip"
                  aria-pressed={rule.count === n}
                  disabled={disabled}
                  onClick={() => emit({ ...rule, count: n, until: undefined })}
                >
                  {`${n} sessions`}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <p className="ox-dt-summary" role="status" aria-live="polite">
          <b>{sentence.charAt(0).toUpperCase() + sentence.slice(1)}</b>
          {/* "Last" only where the rule actually has one. An unbounded rule's
              final previewed date is an artefact of the preview cap, and
              printing it as the last session is how a patient is told their
              course of treatment ends on a date nobody chose. */}
          {firstKept && lastKept
            ? bounded
              ? ` — first ${formatPlainDate(firstKept.date, "medium")}, last ${formatPlainDate(lastKept.date, "medium")}.`
              : ` — first ${formatPlainDate(firstKept.date, "medium")}; the preview stops at ${formatPlainDate(lastKept.date, "medium")}.`
            : " — this rule produces no dates."}
          {showRRule ? <code>{toRRule(rule)}</code> : null}
          {showRRule && toExDate(rule) ? <code>{toExDate(rule)}</code> : null}
        </p>

        {!bounded ? (
          <FieldMessage tone="warning">
            No end date. The preview is capped at {previewCount} occurrences; the series itself is
            unbounded until something stops it.
          </FieldMessage>
        ) : null}
      </div>
    );
  },
);

RecurrenceField.displayName = "RecurrenceField";

/* ================================================================== */
/* appointment-scheduler
/* ================================================================== */

/**
 * AppointmentScheduler — provider, date and time on one surface.
 *
 *     <AppointmentScheduler
 *       providers={providers}
 *       availability={set}
 *       onRequestAvailability={(q) => load(q)}
 *       onSelect={setChoice}
 *     />
 *
 * The one component in the family that consumes an `AvailabilitySet`, and the
 * only place the *choosing* job lives. Everything else here is recall: the
 * user already knows the answer and needs the software out of the way. Here
 * they cannot know it, and the system's knowledge of who is free is the whole
 * product.
 *
 * **It asks; the host fetches.** `onRequestAvailability` is called whenever
 * the question changes — a different clinician, a different day, a different
 * appointment length. ADR 0009 forbids the component making the request, and
 * that turns out to be right anyway: the host owns caching, cancellation and
 * the retry, and it is the only party that can reconcile a rejection.
 *
 * **Selecting is not booking.** `onSelect` reports a choice. Nothing is
 * written until the host says so, and `rejected` — the slot taken while the
 * form was open — arrives back as a set of alternatives rather than a toast,
 * because a lost slot has to be a choice rather than a restart.
 *
 * **Changing the clinician clears the time.** Silently keeping a time the new
 * clinician does not have is the single most common defect in a three-part
 * scheduler.
 */

/** Whoever or whatever the appointment is with. */
export interface SchedulableActor {
  id: string;
  name: string;
  /** "Psychiatrist", "Group Room B". Rendered beside the name. */
  role?: string;
  /** Clinic timezone, shown only when it differs from the viewer's. */
  zone?: string;
  zoneLabel?: string;
}

/** What the host is being asked for. */
export interface AvailabilityQuery {
  actorId: string;
  date: OxDate;
  durationMinutes: number;
}

/** Open counts per day, so the strip can be drawn without loading each day. */
export interface DayLoad {
  date: OxDate;
  openCount: number;
}

/**
 * The server's answer to a save.
 *
 * `alternatives` is what makes losing a slot recoverable: three specific times
 * beat "that time is no longer available" by roughly the whole task.
 */
export interface SelectionRejection {
  reason: string;
  alternatives?: Slot[];
}

export interface AppointmentSchedulerProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect" | "children"
> {
  /**
   * The people who can be booked. Each carries its own availability; the grid is the
   * intersection of provider, date and duration.
   */
  providers: readonly SchedulableActor[];
  /** Controlled actor. Uncontrolled falls back to the first. */
  actorId?: string;
  /**
   * Fired when the reader switches provider, so the host can fetch that provider's
   * availability.
   */
  onActorChange?: (actorId: string) => void;

  /** The day whose slots are shown. */
  date?: OxDate;
  /** Fired when the reader moves to another day. */
  onDateChange?: (date: OxDate) => void;
  /** Open counts for the strip. The host supplies these; nothing is derived. */
  dayLoads?: readonly DayLoad[];
  /** How many days the strip shows. */
  horizonDays?: number;

  /**
   * Bookable slots for the current provider and date. Absence of a slot is not the same as a
   * slot that is taken, and the grid draws both.
   */
  availability: AvailabilitySet;
  /** Called whenever the question changes. The host does the loading. */
  onRequestAvailability?: (query: AvailabilityQuery) => void;

  /** The clock, injected. Staleness and the strip both need it. */
  now: { date: OxDate; time: OxTime };
  /** How long the appointment being booked is. Changes which slots can accommodate it. */
  durationMinutes?: number;
  /**
   * Time held before and after each appointment. Rendered, so the reader can see why an
   * apparently free slot is not offered.
   */
  buffers?: Buffers;

  value?: string | null;
  /**
   * Fired with the chosen slot. Booking itself is the host's, because it needs a write the
   * component cannot make.
   */
  onSelect?: (choice: { actor: SchedulableActor; date: OxDate; slot: Slot }) => void;
  /** A hold that ran out while the form was open. */
  onHoldExpired?: (slot: Slot) => void;
  /** The server said no. Rendered with its alternatives. */
  rejection?: SelectionRejection | null;

  onRefresh?: () => void;
  hour24?: boolean;
  /** The viewer's own zone. A second line appears only when it differs. */
  viewerZone?: string;
  /** The field's visible label, and its accessible name. */
  label?: string;
}

export const AppointmentScheduler = React.forwardRef<HTMLDivElement, AppointmentSchedulerProps>(
  function AppointmentScheduler(props, ref) {
    const {
      providers,
      actorId: controlledActor,
      onActorChange,
      date: controlledDate,
      onDateChange,
      dayLoads,
      horizonDays = 7,
      availability,
      onRequestAvailability,
      now,
      durationMinutes = 30,
      buffers,
      value: controlledValue,
      onSelect,
      rejection,
      onRefresh,
      hour24 = false,
      viewerZone,
      label = "Schedule an appointment",
      className,
      ...rest
    } = props;

    const [uncontrolledActor, setUncontrolledActor] = React.useState(() => providers[0]?.id ?? "");
    const actorId = controlledActor ?? uncontrolledActor;
    const actor = providers.find((p) => p.id === actorId) ?? providers[0];

    const [uncontrolledDate, setUncontrolledDate] = React.useState<OxDate>(now.date);
    const date = controlledDate ?? uncontrolledDate;

    const [uncontrolledValue, setUncontrolledValue] = React.useState<string | null>(null);
    const selectedId = controlledValue !== undefined ? controlledValue : uncontrolledValue;

    const reactId = React.useId();

    const ask = (next: Partial<AvailabilityQuery>) => {
      if (!actor) return;
      onRequestAvailability?.({
        actorId: next.actorId ?? actor.id,
        date: next.date ?? date,
        durationMinutes: next.durationMinutes ?? durationMinutes,
      });
    };

    const pickActor = (nextId: string) => {
      if (nextId === actorId) return;
      if (controlledActor === undefined) setUncontrolledActor(nextId);
      // Clearing the time is the point. A clinician change that keeps a slot
      // the new clinician does not have is the classic three-part-scheduler bug.
      if (controlledValue === undefined) setUncontrolledValue(null);
      onActorChange?.(nextId);
      ask({ actorId: nextId });
    };

    const pickDate = (next: OxDate) => {
      if (isSameDate(next, date)) return;
      if (controlledDate === undefined) setUncontrolledDate(next);
      if (controlledValue === undefined) setUncontrolledValue(null);
      onDateChange?.(next);
      ask({ date: next });
    };

    const days = React.useMemo(
      () => Array.from({ length: horizonDays }, (_, i) => addCalendarDays(now.date, i)),
      [now.date, horizonDays],
    );

    const loadFor = (day: OxDate): number | null => {
      const found = dayLoads?.find((entry) => isSameDate(entry.date, day));
      return found ? found.openCount : null;
    };

    const selected = availability.slots.find((slot) => slot.id === selectedId) ?? null;

    // Buffers belong to the interval, not to the display: a 50-minute

    // session with a 10-minute turnaround occupies 60 minutes of the

    // room, and that is the figure overlap was tested against.

    const occupiedMinutes =
      (selected?.durationMinutes ?? 0) + (buffers?.before ?? 0) + (buffers?.after ?? 0);

    return (
      <div
        ref={ref}
        role="group"
        aria-label={label}
        data-ox-appointment-scheduler={selected ? "selected" : "choosing"}
        className={cn("ox-dt-stack", className)}
        {...rest}
      >
        {/* ---- who ---------------------------------------------------- */}
        {providers.length > 1 ? (
          <div className="ox-dt-chips" role="group" aria-label="Clinician">
            {providers.map((provider) => (
              <button
                key={provider.id}
                type="button"
                className="ox-dt-chip"
                aria-pressed={provider.id === actorId}
                onClick={() => pickActor(provider.id)}
              >
                {provider.name}
              </button>
            ))}
          </div>
        ) : null}

        {/* ---- when: the week strip ----------------------------------- */}
        <div className="ox-dt-daystrip" role="group" aria-label="Day">
          {days.map((day) => {
            const open = loadFor(day);
            const empty = open === 0;
            const name = `${formatPlainDate(day, "full")}, ${
              open == null
                ? "availability not loaded"
                : open === 0
                  ? "no times available"
                  : `${open} time${open === 1 ? "" : "s"} available`
            }`;
            return (
              <button
                key={formatPlainDate(day, "iso")}
                type="button"
                className={cn(
                  "ox-dt-day",
                  isSameDate(day, date) && "ox-dt-day--selected",
                  empty && "ox-dt-day--empty",
                )}
                aria-label={name}
                aria-pressed={isSameDate(day, date)}
                aria-disabled={empty || undefined}
                onClick={() => {
                  if (empty) return;
                  pickDate(day);
                }}
              >
                <span className="ox-dt-day__weekday" aria-hidden="true">
                  {WEEKDAY_ABBREVIATIONS[weekdayOf(day)]}
                </span>
                <span className="ox-dt-day__date" aria-hidden="true">
                  {day.d}
                </span>
                {/* The count, where there is one. An unknown load renders
                    nothing rather than a dash: a dash reads as "we looked and
                    there is nothing", which is a different fact from "we have
                    not looked", and the accessible name above says which. */}
                {open == null ? null : (
                  <span className="ox-dt-day__count" aria-hidden="true">
                    {open === 0 ? "0 open" : `${open} open`}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ---- what time ---------------------------------------------- */}
        <TimeSlotGrid
          set={availability}
          now={now}
          value={selectedId}
          hour24={hour24}
          onRefresh={onRefresh}
          label={`Times on ${formatPlainDate(date, "long")}`}
          onSelect={(slot) => {
            if (controlledValue === undefined) setUncontrolledValue(slot.id);
            if (actor) onSelect?.({ actor, date, slot });
          }}
        />

        {/* ---- the server said no ------------------------------------- */}
        {rejection ? (
          <div className="ox-dt-stack" data-ox-rejection="true">
            <FieldMessage tone="error" id={`${reactId}-rejection`}>
              {rejection.reason}
            </FieldMessage>
            {rejection.alternatives?.length ? (
              <>
                <p className="ox-dt-msg">Nothing was booked. These are still open:</p>
                <div className="ox-dt-slots" role="group" aria-label="Alternative times">
                  {rejection.alternatives.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      className="ox-dt-slot"
                      onClick={() => {
                        if (controlledValue === undefined) setUncontrolledValue(slot.id);
                        if (actor) onSelect?.({ actor, date, slot });
                      }}
                    >
                      {formatClockTime(slot.start, { hour24 })}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {/* ---- the sentence ------------------------------------------- */}
        {selected && actor ? (
          <p className="ox-dt-summary" role="status" aria-live="polite">
            <b>{actor.name}</b>
            {` · ${formatPlainDate(date, "long")} · ${formatClockTime(selected.start, { hour24 })} – ${formatClockTime(
              timeFromMinutes(minutesOfTime(selected.start) + selected.durationMinutes).time,
              { hour24 },
            )}`}
            {actor.zoneLabel && viewerZone && actor.zone !== viewerZone
              ? ` ${actor.zoneLabel}`
              : ""}
            {` · ${selected.durationMinutes} min`}
            {/* The room is held longer than the appointment lasts. Saying so
                is the difference between a 50-minute session and the hour it
                actually costs the room — and it is the number the next slot
                was tested against, so a reader who sees a gap they cannot
                book has been told why. */}
            {occupiedMinutes > selected.durationMinutes
              ? ` · room held ${occupiedMinutes} min`
              : ""}
            {/* Said out loud, because a scheduler that looks committed and is
                not is how double-bookings reach a diary. */}
            <span className="ox-dt-readout__relative"> Not booked yet.</span>
          </p>
        ) : (
          <p className="ox-dt-msg">Choose a time to see the appointment summary.</p>
        )}
      </div>
    );
  },
);

AppointmentScheduler.displayName = "AppointmentScheduler";

/* ================================================================== */
/* recurring-series-scheduler
/* ================================================================== */

/**
 * RecurringSeriesScheduler — a course of treatment, with its conflicts
 * resolved before anything is written.
 *
 *     <RecurringSeriesScheduler rule={rule} startDate={first} verdicts={fromServer} />
 *
 * Behavioural health does not book appointments; it books courses of
 * treatment, and the unit is the series. Twelve Tuesdays at three o'clock is
 * one decision, and finding out in week six that two of them were never
 * available is the failure this component exists to prevent.
 *
 * **The conflicts are the host's.** Checking twelve future Tuesdays against a
 * clinician's calendar, a patient's other appointments, a room and a payer
 * authorisation is a server query — ADR 0009 forbids the component making it,
 * and the component could not answer it correctly anyway. The contract is
 * narrow: expand the rule, hand the host the candidate dates through
 * `onExpand`, render whatever verdicts come back. It does not know what a
 * conflict is.
 *
 * **Nothing is written until the button at the bottom.** Each conflict can be
 * moved to a specific alternative the host proposed, or the whole series can
 * be booked around them. Both paths state the number that will result, because
 * "twelve sessions" and "ten sessions and two gaps" are different plans and
 * only one of them is what the patient was told.
 */

export interface RecurringSeriesSchedulerProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children" | "onSelect"
> {
  /** The recurrence rule the series expands from. */
  rule: RecurrenceRule;
  startDate: OxDate;
  /** Rendered into the sentence and each row — "3:00 PM – 3:53 PM". */
  timeLabel?: string;
  /** The host's answers. Absent means nothing has been checked yet. */
  verdicts?: readonly OccurrenceVerdict[];
  /** ISO dates the user has already resolved. */
  resolved?: ReadonlySet<string>;
  /**
   * Fired when the reader moves or drops one occurrence that conflicts. The series is edited
   * per occurrence, never regenerated.
   */
  onResolve?: (isoDate: string, to: OxDate) => void;
  /** Fired when the reader undoes a resolution and restores the original occurrence. */
  onUnresolve?: (isoDate: string) => void;
  /** Resolve every conflict that carries an alternative, in one press. */
  onResolveAll?: () => void;
  /**
   * Fired with the whole resolved series. Nothing is booked until every conflict is resolved
   * or explicitly kept.
   */
  onBook?: (dates: OxDate[]) => void;
  onExpand?: (dates: OxDate[]) => void;

  /** The field's visible label, and its accessible name. */
  label?: string;
  /** How many rows to show before collapsing. The rest are counted. */
  visibleRows?: number;
  /**
   * Removes the field from the tab order entirely. Prefer `readOnly` for anything the reader
   * may still need to read.
   */
  disabled?: boolean;
}

export const RecurringSeriesScheduler = React.forwardRef<
  HTMLDivElement,
  RecurringSeriesSchedulerProps
>(function RecurringSeriesScheduler(props, ref) {
  const {
    rule,
    startDate,
    timeLabel,
    verdicts = [],
    resolved = new Set<string>(),
    onResolve,
    onUnresolve,
    onResolveAll,
    onBook,
    onExpand,
    label = "Recurring series",
    visibleRows = 12,
    disabled,
    className,
    ...rest
  } = props;

  const occurrences = React.useMemo(() => expandRule(rule, startDate, 60), [rule, startDate]);
  const review = React.useMemo(
    () => reviewSeries(occurrences, verdicts, resolved),
    [occurrences, verdicts, resolved],
  );

  const lastReported = React.useRef("");
  React.useEffect(() => {
    const key = occurrences.map((o) => formatPlainDate(o.date, "iso")).join(",");
    if (key === lastReported.current) return;
    lastReported.current = key;
    onExpand?.(occurrences.filter((o) => !o.skippedReason).map((o) => o.date));
  }, [occurrences, onExpand]);

  const verdictFor = (iso: string) => verdicts.find((v) => v.date === iso);

  /*
   * The cap truncates the list, and never a row that still needs a decision.
   *
   * A plain `slice` hides the fourteenth session in a sixteen-session course,
   * which is fine, and it hides the conflict on it, which is not: the tally
   * says three conflicts, the list shows two, and the row that has to be
   * resolved before anything is booked cannot be reached at all. So an
   * unresolved conflict is pulled through the cap and the list stays in date
   * order — the position of a session is how a reader finds it.
   */
  const isOpenConflict = (occurrence: Occurrence) => {
    if (occurrence.skippedReason) return false;
    const iso = formatPlainDate(occurrence.date, "iso");
    return verdictFor(iso) != null && !resolved.has(iso);
  };
  const shown = occurrences.filter(
    (occurrence, position) => position < visibleRows || isOpenConflict(occurrence),
  );
  const hidden = occurrences.length - shown.length;

  const bookable = occurrences
    .filter((o) => !o.skippedReason)
    .filter((o) => {
      const iso = formatPlainDate(o.date, "iso");
      return !verdictFor(iso) || resolved.has(iso);
    })
    .map((o) => o.date);

  const resolvableCount = verdicts.filter((v) => v.alternative && !resolved.has(v.date)).length;

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      data-ox-series={review.conflicts > 0 ? "conflicts" : "clear"}
      className={cn("ox-dt-stack", className)}
      {...rest}
    >
      <p className="ox-dt-summary">
        <b>{describeSeries(rule, { timeLabel }).replace(/^./, (c) => c.toUpperCase())}</b>
        {` · starting ${formatPlainDate(startDate, "medium")}`}
      </p>

      {/* The arithmetic IS the feature. A scheduler that prints only the naive
          occurrence count has told the billing team a number that will not
          match reality, and told the patient about sessions that will not
          happen. */}
      <dl className="ox-dt-tally">
        <div>
          <dd>{review.total}</dd>
          <dt>dates in range</dt>
        </div>
        <div>
          <dd>{review.bookable}</dd>
          <dt>can be booked</dt>
        </div>
        <div>
          <dd data-ox-tally="conflicts">{review.conflicts}</dd>
          <dt>conflicts</dt>
        </div>
        {review.excluded > 0 ? (
          <div>
            <dd>{review.excluded}</dd>
            <dt>excluded</dt>
          </div>
        ) : null}
      </dl>

      <ol className="ox-dt-series">
        {shown.map((occurrence) => {
          const iso = formatPlainDate(occurrence.date, "iso");
          const verdict = verdictFor(iso);
          const alternative = verdict?.alternative;
          const isResolved = verdict != null && resolved.has(iso);
          const state = occurrence.skippedReason
            ? "excluded"
            : isResolved
              ? "moved"
              : verdict
                ? "conflict"
                : "open";

          return (
            <li key={iso} data-ox-occurrence={state}>
              <span className="ox-dt-series__n" aria-hidden="true">
                {occurrence.skippedReason ? "" : occurrence.index}
              </span>
              <span className="ox-dt-series__when">
                {isResolved && alternative
                  ? alternative.label
                  : `${formatPlainDate(occurrence.date, "weekday")}${timeLabel ? ` · ${timeLabel}` : ""}`}
                {occurrence.skippedReason ? (
                  <span className="ox-dt-series__why">Excluded — facility closed</span>
                ) : verdict && !isResolved ? (
                  <span className="ox-dt-series__why">{verdict.reason}</span>
                ) : isResolved ? (
                  <span className="ox-dt-series__why">
                    {`moved from ${formatPlainDate(occurrence.date, "weekday")}`}
                  </span>
                ) : null}
              </span>

              {verdict && !isResolved && alternative ? (
                <button
                  type="button"
                  className="ox-dt-chip"
                  disabled={disabled}
                  onClick={() => onResolve?.(iso, alternative.date)}
                >
                  {`Move to ${alternative.label}`}
                </button>
              ) : isResolved ? (
                <button
                  type="button"
                  className="ox-dt-chip"
                  disabled={disabled}
                  onClick={() => onUnresolve?.(iso)}
                >
                  Undo
                </button>
              ) : null}
            </li>
          );
        })}
        {hidden > 0 ? (
          <li data-ox-occurrence="more">
            <span className="ox-dt-series__n" aria-hidden="true" />
            <span className="ox-dt-series__when">{`+ ${hidden} more`}</span>
          </li>
        ) : null}
      </ol>

      <div className="ox-dt-chips">
        <button
          type="button"
          className="ox-dt-chip"
          disabled={disabled || bookable.length === 0}
          onClick={() => onBook?.(bookable)}
        >
          {review.conflicts > 0
            ? `Book ${review.bookable} and skip ${review.conflicts}`
            : `Book all ${review.bookable} sessions`}
        </button>
        {resolvableCount > 0 ? (
          <button type="button" className="ox-dt-chip" disabled={disabled} onClick={onResolveAll}>
            Resolve all automatically
          </button>
        ) : null}
      </div>

      <p className="ox-dt-msg" role="status" aria-live="polite">
        {review.conflicts > 0
          ? `${review.conflicts} conflict${review.conflicts === 1 ? "" : "s"} to resolve. Nothing is written until you choose.`
          : `All ${review.bookable} resolve cleanly. Nothing is written until you choose.`}
      </p>
    </div>
  );
});

RecurringSeriesScheduler.displayName = "RecurringSeriesScheduler";

/* ================================================================== */
/* group-series-scheduler
/* ================================================================== */

/**
 * GroupSeriesScheduler — a group, its room, its roster and its real count.
 *
 *     <GroupSeriesScheduler rule={rule} startDate={first} exclusions={closures} … />
 *
 * A group is not a repeating appointment with more people in it. It has a
 * room with a capacity, two clinicians who both have to be free, a roster that
 * is already enrolled, and a series length somebody quoted to a payer.
 *
 * **The arithmetic is the feature.** Tuesdays and Thursdays from 1 September
 * to 30 November is *26 dates*; two facility closures make it *24 sessions*.
 * A scheduler that prints the naive count has told the billing team a number
 * that will not match reality and told nine enrolled patients they are
 * attending two sessions that will not happen. The exclusions are written into
 * the series as `EXDATE`, so the count survives export.
 *
 * **Capacity is stated, never enforced here.** Whether a group may run over
 * its room's capacity is a clinical and fire-safety question, and the host
 * owns it. The component renders the numbers side by side so the decision is
 * taken with them in view.
 */

/** A date the group does not meet, and why. */
export interface SeriesExclusion {
  date: OxDate;
  reason: string;
}

export interface GroupSeriesSchedulerProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  name: string;
  rule: RecurrenceRule;
  startDate: OxDate;
  /** "4:00 PM – 5:30 PM". Rendered into the sentence and every row. */
  timeLabel?: string;
  /** How long each session runs. */
  sessionMinutes?: number;

  /** Dates the group does not meet. Folded into the rule as EXDATE. */
  exclusions?: readonly SeriesExclusion[];

  /**
   * Who runs the group. Their availability constrains the series in the same way a provider's
   * does.
   */
  facilitators?: readonly string[];
  /**
   * Where it meets. A room is a resource with its own availability, and double-booking one is
   * the most common group-scheduling failure.
   */
  room?: { name: string; capacity?: number };
  /** In-person, telehealth, or both. Rendered; never inferred. */
  modality?: string;
  /**
   * How many places the group has. Shown against enrolment, because a group at capacity is a
   * scheduling fact and not an error.
   */
  capacity?: number;
  /**
   * Who is already enrolled. Counted against `capacity` and listed, so the reader can see who
   * they are adding to.
   */
  enrolled?: number;

  label?: string;
  showRRule?: boolean;
}

export const GroupSeriesScheduler = React.forwardRef<HTMLDivElement, GroupSeriesSchedulerProps>(
  function GroupSeriesScheduler(props, ref) {
    const {
      name,
      rule,
      startDate,
      timeLabel,
      sessionMinutes,
      exclusions = [],
      facilitators = [],
      room,
      modality,
      capacity,
      enrolled,
      label = "Group series",
      showRRule = true,
      className,
      ...rest
    } = props;

    // The exclusions belong to the rule, not to a filter applied at render.
    // Anything else and the exported series disagrees with the screen.
    const ruleWithExclusions = React.useMemo<RecurrenceRule>(
      () => ({ ...rule, exceptions: exclusions.map((exclusion) => exclusion.date) }),
      [rule, exclusions],
    );

    const occurrences = React.useMemo(
      () => expandRule(ruleWithExclusions, startDate, 200),
      [ruleWithExclusions, startDate],
    );
    const kept = React.useMemo(() => keptOccurrences(occurrences), [occurrences]);

    const firstSession = kept[0];
    const lastSession = kept.at(-1);
    const totalMinutes = sessionMinutes ? kept.length * sessionMinutes : null;
    const overCapacity = capacity != null && enrolled != null && enrolled > capacity;
    const roomTooSmall = room?.capacity != null && capacity != null && capacity > room.capacity;

    return (
      <div
        ref={ref}
        role="group"
        aria-label={`${name} — ${label}`}
        data-ox-group-series={kept.length > 0 ? "scheduled" : "empty"}
        className={cn("ox-dt-stack", className)}
        {...rest}
      >
        <p className="ox-dt-summary">
          <b>{`${describeRule(rule)}${timeLabel ? `, ${timeLabel}` : ""}`}</b>
          {firstSession && lastSession
            ? ` · ${formatPlainDate(firstSession.date, "medium")} → ${formatPlainDate(lastSession.date, "medium")}`
            : " · no dates"}
          {showRRule ? <code>{toRRule(ruleWithExclusions)}</code> : null}
          {showRRule && toExDate(ruleWithExclusions) ? (
            <code>{toExDate(ruleWithExclusions)}</code>
          ) : null}
        </p>

        <dl className="ox-dt-tally">
          <div>
            <dd>{occurrences.length}</dd>
            <dt>dates in range</dt>
          </div>
          <div>
            <dd data-ox-tally={exclusions.length > 0 ? "conflicts" : undefined}>
              {exclusions.length}
            </dd>
            <dt>closures</dt>
          </div>
          <div>
            <dd>{kept.length}</dd>
            <dt>sessions</dt>
          </div>
          {capacity != null ? (
            <div>
              <dd>{capacity}</dd>
              <dt>capacity</dt>
            </div>
          ) : null}
          {enrolled != null ? (
            <div>
              <dd data-ox-tally={overCapacity ? "conflicts" : undefined}>{enrolled}</dd>
              <dt>enrolled</dt>
            </div>
          ) : null}
        </dl>

        <dl className="ox-dt-readout ox-dt-stack">
          {facilitators.length > 0 ? (
            <div>
              <dt className="ox-dt-label">Clinicians</dt>
              <dd>{facilitators.join(" · ")}</dd>
            </div>
          ) : null}
          {room ? (
            <div>
              <dt className="ox-dt-label">Room</dt>
              <dd>
                {room.name}
                {room.capacity != null ? ` · capacity ${room.capacity}` : ""}
              </dd>
            </div>
          ) : null}
          {modality ? (
            <div>
              <dt className="ox-dt-label">Modality</dt>
              <dd>{modality}</dd>
            </div>
          ) : null}
          {totalMinutes != null ? (
            <div>
              <dt className="ox-dt-label">Series duration</dt>
              <dd>
                {`${kept.length} sessions · ${sessionMinutes} min each · ${Math.round(totalMinutes / 60)} hr total`}
              </dd>
            </div>
          ) : null}
        </dl>

        {exclusions.length > 0 ? (
          <>
            <p className="ox-dt-msg">
              Excluded dates, written into the series as EXDATE so the count downstream matches the
              sessions that happen.
            </p>
            <ol className="ox-dt-series">
              {exclusions.map((exclusion) => (
                <li key={formatPlainDate(exclusion.date, "iso")} data-ox-occurrence="excluded">
                  <span className="ox-dt-series__n" aria-hidden="true" />
                  <span className="ox-dt-series__when">
                    {`${formatPlainDate(exclusion.date, "weekday")}${timeLabel ? ` · ${timeLabel}` : ""}`}
                  </span>
                  <span className="ox-dt-chip" aria-hidden="true">
                    {exclusion.reason}
                  </span>
                  <span className="ox-dt-sr">{exclusion.reason}</span>
                </li>
              ))}
            </ol>
          </>
        ) : null}

        {overCapacity ? (
          <FieldMessage tone="warning">
            {`${enrolled} enrolled against a capacity of ${capacity}. Whether a group may run over is a clinical and fire-safety decision, so it is stated rather than blocked.`}
          </FieldMessage>
        ) : null}
        {roomTooSmall ? (
          <FieldMessage tone="warning">
            {`${room?.name} holds ${room?.capacity}; this group is set to ${capacity}.`}
          </FieldMessage>
        ) : null}
      </div>
    );
  },
);

GroupSeriesScheduler.displayName = "GroupSeriesScheduler";
