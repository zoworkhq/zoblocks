import { useState } from "react";

import { DatePicker, BEHAVIORAL_HEALTH_DURATIONS } from "@/components/zoblocks/date-picker";

import type { SessionInterval, ZbDate, ZbInstant, ZbTime } from "@/lib/zoblocks-datetime";

import type { AvailabilitySet, Slot } from "@/lib/zoblocks-availability";

export default function FourJobsFourVariantsExample() {
  // Fixed sample date: Thursday, 27 August 2026.
  const today: ZbDate = {
    kind: "date",
    y: 2026,
    m: 8,
    d: 27,
  };

  // The host supplies the current date and time.
  const now: { date: ZbDate; time: ZbTime } = {
    date: today,
    time: {
      kind: "time",
      h: 8,
      mi: 15,
    },
  };

  // --------------------------------------------------
  // 1. RECALL — Date of service
  // --------------------------------------------------

  const [serviceDate, setServiceDate] = useState<ZbDate | null>(today);

  // --------------------------------------------------
  // 2. CHOOSE — Available appointment slots
  // --------------------------------------------------

  // Availability was retrieved three minutes earlier.
  const availability: AvailabilitySet = {
    asOf: {
      date: today,
      time: {
        kind: "time",
        h: 8,
        mi: 12,
      },
    },
    staleAfterSeconds: 600,
    exhausted: true,
    slots: [
      // Morning: 8:00 AM – 11:30 AM
      {
        id: "morning-0800",
        start: { kind: "time", h: 8, mi: 0 },
        durationMinutes: 30,
        state: { kind: "free" },
      },
      {
        id: "morning-0830",
        start: { kind: "time", h: 8, mi: 30 },
        durationMinutes: 30,
        state: { kind: "blocked", reason: "booked" },
      },
      {
        id: "morning-0900",
        start: { kind: "time", h: 9, mi: 0 },
        durationMinutes: 30,
        state: { kind: "free" },
      },
      {
        id: "morning-0930",
        start: { kind: "time", h: 9, mi: 30 },
        durationMinutes: 30,
        state: { kind: "free" },
      },
      {
        id: "morning-1000",
        start: { kind: "time", h: 10, mi: 0 },
        durationMinutes: 30,
        state: { kind: "free" },
      },
      {
        id: "morning-1030",
        start: { kind: "time", h: 10, mi: 30 },
        durationMinutes: 30,
        state: { kind: "blocked", reason: "booked" },
      },
      {
        id: "morning-1100",
        start: { kind: "time", h: 11, mi: 0 },
        durationMinutes: 30,
        state: { kind: "free" },
      },
      {
        id: "morning-1130",
        start: { kind: "time", h: 11, mi: 30 },
        durationMinutes: 30,
        state: { kind: "free" },
      },

      // Afternoon: 12:00 PM – 4:00 PM
      {
        id: "afternoon-1200",
        start: { kind: "time", h: 12, mi: 0 },
        durationMinutes: 30,
        state: { kind: "free" },
      },
      {
        id: "afternoon-1230",
        start: { kind: "time", h: 12, mi: 30 },
        durationMinutes: 30,
        state: { kind: "blocked", reason: "booked" },
      },
      {
        id: "afternoon-1300",
        start: { kind: "time", h: 13, mi: 0 },
        durationMinutes: 30,
        state: { kind: "free" },
      },
      {
        id: "afternoon-1330",
        start: { kind: "time", h: 13, mi: 30 },
        durationMinutes: 30,
        state: { kind: "blocked", reason: "booked" },
      },
      {
        id: "afternoon-1400",
        start: { kind: "time", h: 14, mi: 0 },
        durationMinutes: 30,
        state: { kind: "free" },
      },
      {
        id: "afternoon-1430",
        start: { kind: "time", h: 14, mi: 30 },
        durationMinutes: 30,
        state: { kind: "blocked", reason: "booked" },
      },
      {
        id: "afternoon-1500",
        start: { kind: "time", h: 15, mi: 0 },
        durationMinutes: 30,
        state: { kind: "free" },
      },
      {
        id: "afternoon-1530",
        start: { kind: "time", h: 15, mi: 30 },
        durationMinutes: 30,
        state: { kind: "blocked", reason: "booked" },
      },
      {
        id: "afternoon-1600",
        start: { kind: "time", h: 16, mi: 0 },
        durationMinutes: 30,
        state: { kind: "blocked", reason: "booked" },
      },
    ],
  };

  const [selectedSlot, setSelectedSlot] = useState<string | null>("morning-0900");

  // --------------------------------------------------
  // 3. CONSTRUCT — Session start, end and duration
  // --------------------------------------------------

  const initialSession: SessionInterval = {
    start: { kind: "time", h: 9, mi: 0 },
    end: { kind: "time", h: 9, mi: 53 },
    endDayOffset: 0,
    durationMin: 53,
    hold: "duration",
    maxMin: 480,
  };

  const [session, setSession] = useState<SessionInterval>(initialSession);

  // --------------------------------------------------
  // 4. WITNESS — Recorded timestamp
  // --------------------------------------------------

  const signedAt: ZbInstant = {
    kind: "instant",
    date: {
      kind: "date",
      y: 2026,
      m: 8,
      d: 24,
    },
    time: {
      kind: "time",
      h: 8,
      mi: 12,
    },
    zone: "America/New_York",
  };

  // Keep the selected slot available for displaying its time.
  const selectedSlotDetails: Slot | undefined = availability.slots.find(
    (slot) => slot.id === selectedSlot,
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* 1. RECALL */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--zb-text-muted)]">
          variant=&quot;field&quot; — recall
        </p>

        <DatePicker
          variant="field"
          label="Date of service"
          value={serviceDate}
          onChange={setServiceDate}
          now={today}
          showRelative
        />
      </section>

      <hr className="border-[var(--zb-border)]" />

      {/* 2. CHOOSE */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--zb-text-muted)]">
          variant=&quot;slots&quot; — choose
        </p>

        <h2 className="text-lg font-semibold">Available times</h2>

        <p className="text-sm text-[var(--zb-text-muted)]">
          Choose one of the available appointment times.
        </p>

        <DatePicker
          variant="slots"
          label="Available times"
          set={availability}
          now={now}
          value={selectedSlot}
          onSelect={(slot) => setSelectedSlot(slot.id)}
        />

        {selectedSlotDetails && (
          <p className="text-sm text-[var(--zb-text-muted)]">
            Selected time:{" "}
            <strong>
              {String(selectedSlotDetails.start.h % 12 || 12)}:
              {String(selectedSlotDetails.start.mi).padStart(2, "0")}{" "}
              {selectedSlotDetails.start.h >= 12 ? "PM" : "AM"}
            </strong>
          </p>
        )}
      </section>

      <hr className="border-[var(--zb-border)]" />

      {/* 3. CONSTRUCT */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--zb-text-muted)]">
          variant=&quot;session&quot; — construct
        </p>

        <h2 className="text-lg font-semibold">Individual therapy</h2>

        <p className="text-sm text-[var(--zb-text-muted)]">
          The end time follows the held duration.
        </p>

        <DatePicker
          variant="session"
          label="Individual therapy"
          value={session}
          onChange={setSession}
          durationPresets={BEHAVIORAL_HEALTH_DURATIONS}
        />
      </section>

      <hr className="border-[var(--zb-border)]" />

      {/* 4. WITNESS */}
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--zb-text-muted)]">
          variant=&quot;readout&quot; — witness
        </p>

        <h2 className="text-lg font-semibold">Recorded timestamp</h2>

        <p className="text-sm text-[var(--zb-text-muted)]">
          A read-only assertion about when an event occurred.
        </p>

        <DatePicker variant="readout" as="time" value={signedAt} now={today} showZone />
      </section>
    </div>
  );
}
