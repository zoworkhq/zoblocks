"use client";

/**
 * DatePicker — one temporal control, fourteen variants.
 *
 *     <DatePicker variant="picker"     label="Appointment date" now={today} />
 *     <DatePicker variant="birth-date" now={today} allowEstimated allowAbsent />
 *     <DatePicker variant="session"    durationPresets={org.presets} />
 *     <DatePicker variant="slots"      set={availability} now={now} />
 *
 * **Why one component rather than eleven.** A clinician does not shop for a
 * "birth date field". They reach for the date control, and it needs to behave
 * differently in fourteen places: a service date they already know, an
 * appointment they have to be shown, a birth date that wants an age beside it,
 * a session that is three numbers with two degrees of freedom, a course of
 * treatment that is a rule rather than a date, and a signed timestamp that is
 * a legal instrument. Splitting those into fourteen catalogue entries hides
 * the thing that makes them a system — that every one of them shares a value
 * space, a keyboard model and an accessibility contract. Tabs made the same
 * call for the same reason.
 *
 * The variants are not a switch statement standing in for design. Each is a
 * real component in `@/lib/oxygen-datetime-parts`, separately testable and
 * separately rendered; `variant` is the front door.
 *
 * **Ant Design parity holds for the default.** `variant="picker"` matches
 * antd's `DatePicker` — `picker`, `disabledDate`, `allowClear`, `status` — so
 * a migration is one changed import line. The one divergence is the value
 * type: ours is a plain `OxDate`, not a `Dayjs`, because putting a date
 * library in the graph of every form component is exactly what ADR 0010 exists
 * to prevent, and because a `Dayjs` birth date is representable as midnight
 * UTC, which is the single most common temporal defect in healthcare software.
 */

import * as React from "react";
import type { OxDate } from "@/lib/oxygen-datetime";
import {
  AppointmentScheduler,
  BirthDateField,
  Calendar,
  ClinicalDateTime,
  DateField,
  GroupSeriesScheduler,
  RecurrenceField,
  RecurringSeriesScheduler,
  SessionTimeField,
  TimeField,
  TimeSlotGrid,
  type AppointmentSchedulerProps,
  type BirthDateFieldProps,
  type CalendarProps,
  type ClinicalDateTimeProps,
  type DateFieldProps,
  type GroupSeriesSchedulerProps,
  type RecurrenceFieldProps,
  type RecurringSeriesSchedulerProps,
  type SessionTimeFieldProps,
  type TimeFieldProps,
  type TimeSlotGridProps,
} from "@/lib/oxygen-datetime-parts";

/**
 * Which presentation. The default is `picker` — the field with a calendar
 * behind a button, which is what "date picker" means to everyone who has not
 * read the rest of this file.
 */
export type DatePickerVariant =
  /** Field plus calendar. antd's DatePicker, with our value type. */
  | "picker"
  /** The field alone. No popover — the recall case, and most of them. */
  | "field"
  /** The month grid alone, inline. */
  | "calendar"
  /** Two clicks, never a drag. */
  | "range"
  /** Several dates, capped, click-again to remove. */
  | "multiple"
  /** Age beside it, partial dates, absence with a reason. */
  | "birth-date"
  /** Bounded time segments, and one ambiguity it refuses to resolve. */
  | "time"
  /** Start, end and duration, with a visible driver. */
  | "session"
  /** Availability as a grid, grouped and counted. */
  | "slots"
  /** Provider, date and time on one surface. */
  | "scheduler"
  /** A rule, in words, before it is created. */
  | "recurrence"
  /** A course of treatment, conflicts resolved before anything is written. */
  | "series"
  /** A group, its room, its roster and its real count. */
  | "group"
  /** Read-only: absolute value first, relative aid second, zone where it matters. */
  | "readout";

/** Every variant carries the same clock contract: nothing reads the wall clock. */
export interface DatePickerCommonProps {
  /**
   * Which of the fourteen temporal controls to render. They share one contract and one
   * keyboard model; this picks the surface.
   */
  variant?: DatePickerVariant;
  /** Today, supplied by the host. ENGINEERING.md §9 — never read here. */
  now?: OxDate;
}

/**
 * The dispatch union. Each member pairs a `variant` with exactly the props that
 * variant accepts, so passing `durationPresets` to a calendar is a type error
 * rather than a prop that is silently ignored.
 *
 * `variant` carries its description on every branch. The prop extractor reads
 * the union member rather than `DatePickerCommonProps`, so a doc comment on the
 * shared interface alone leaves the published table blank.
 */
export type DatePickerProps =
  | ({
      /** Which of the fourteen temporal controls to render. Defaults to the date field. */
      variant?: "picker" | "field";
    } & DateFieldProps & { showCalendar?: boolean })
  | ({
      /** A month grid. `range` is two clicks, `multiple` is a capped set. */
      variant: "calendar" | "range" | "multiple";
    } & CalendarProps)
  | ({
      /** A date of birth, with its own precision and absence handling. */
      variant: "birth-date";
    } & BirthDateFieldProps)
  | ({
      /** A time of day, with optional organisation presets. */
      variant: "time";
    } & TimeFieldProps)
  | ({
      /** A start, an end and a derived duration that may cross midnight. */
      variant: "session";
    } & SessionTimeFieldProps)
  | ({
      /** A grid of bookable times. */
      variant: "slots";
    } & TimeSlotGridProps)
  | ({
      /** Provider, date and slot, resolved together. */
      variant: "scheduler";
    } & AppointmentSchedulerProps)
  | ({
      /** A recurrence rule, expressed in words and emitted as RRULE. */
      variant: "recurrence";
    } & RecurrenceFieldProps)
  | ({
      /** A recurring series with its conflicts resolved one occurrence at a time. */
      variant: "series";
    } & RecurringSeriesSchedulerProps)
  | ({
      /** A recurring group with capacity, facilitators and a room. */
      variant: "group";
    } & GroupSeriesSchedulerProps)
  | ({
      /** The read-only record rendering. Not an input. */
      variant: "readout";
    } & ClinicalDateTimeProps);

/**
 * The front door.
 *
 * Deliberately a dispatch and nothing else: every behaviour lives in the part
 * it belongs to, so this file cannot become the place where eleven variants
 * quietly grow eleven different answers to what Escape does.
 */
export function DatePicker(props: DatePickerProps) {
  switch (props.variant) {
    case "calendar":
      return <Calendar {...(props as CalendarProps)} />;
    case "range":
      return <Calendar {...(props as CalendarProps)} mode="range" />;
    case "multiple":
      return <Calendar {...(props as CalendarProps)} mode="multiple" />;
    case "birth-date":
      return <BirthDateField {...(props as BirthDateFieldProps)} />;
    case "time":
      return <TimeField {...(props as TimeFieldProps)} />;
    case "session":
      return <SessionTimeField {...(props as SessionTimeFieldProps)} />;
    case "slots":
      return <TimeSlotGrid {...(props as TimeSlotGridProps)} />;
    case "scheduler":
      return <AppointmentScheduler {...(props as AppointmentSchedulerProps)} />;
    case "recurrence":
      return <RecurrenceField {...(props as RecurrenceFieldProps)} />;
    case "series":
      return <RecurringSeriesScheduler {...(props as RecurringSeriesSchedulerProps)} />;
    case "group":
      return <GroupSeriesScheduler {...(props as GroupSeriesSchedulerProps)} />;
    case "readout":
      return <ClinicalDateTime {...(props as ClinicalDateTimeProps)} />;
    case "field":
      return <DateField {...(props as DateFieldProps)} showCalendar={false} />;
    case "picker":
    default:
      return <DateField {...(props as DateFieldProps)} showCalendar />;
  }
}

DatePicker.displayName = "DatePicker";

/**
 * The parts, named.
 *
 * A host that already knows it wants the session triple should be able to say
 * so, rather than passing a string. `variant` is for a surface that chooses at
 * runtime; these are for one that chose at design time, and both are the same
 * components.
 */
export {
  AppointmentScheduler,
  BirthDateField,
  Calendar,
  ClinicalDateTime,
  DateField,
  GroupSeriesScheduler,
  RecurrenceField,
  RecurringSeriesScheduler,
  SessionTimeField,
  TimeField,
  TimeSlotGrid,
  BEHAVIORAL_HEALTH_DURATIONS,
  dateToSegments,
  relativeDateOptions,
  reviewDate,
  segmentsToDate,
  segmentsToTime,
  timeGrid,
  timeToSegments,
  type AppointmentSchedulerProps,
  type AvailabilityQuery,
  type BirthDateFieldProps,
  type BirthDatePrecision,
  type BirthDateValue,
  type CalendarProps,
  type ClinicalDateTimeProps,
  type DateFieldProps,
  type DayLoad,
  type GroupSeriesSchedulerProps,
  type RecurrenceEnd,
  type RecurrenceFieldProps,
  type RecurringSeriesSchedulerProps,
  type SchedulableActor,
  type SelectionRejection,
  type SeriesExclusion,
  type SessionTimeFieldProps,
  type TemporalPolicy,
  type TimeFieldProps,
  type TimeSlotGridProps,
} from "@/lib/oxygen-datetime-parts";
