import { useEffect, useState } from "react";

import { TimeSlotGrid } from "@/components/zoblocks/date-picker";

import { plainDate, plainTime } from "@/lib/zoblocks-datetime";

import type { AvailabilitySet, Slot } from "@/lib/zoblocks-availability";

// Sample appointment date: Thursday, 27 August 2026.
const sampleDate = plainDate(2026, 8, 27);

// The host supplies the current time.
const sampleNow = {
  date: sampleDate,
  time: plainTime(8, 15),
};

// Helper for creating appointment slots.
function createSlot(
  id: string,
  hour: number,
  minute: number,
  state: Slot["state"] = { kind: "free" },
): Slot {
  return {
    id,
    start: plainTime(hour, minute),
    durationMinutes: 30,
    state,
  };
}

// Availability was retrieved at 8:12 AM.
// The current time is 8:15 AM, so it is three minutes old.
const initialAvailability: AvailabilitySet = {
  asOf: {
    date: sampleDate,
    time: plainTime(8, 12),
  },
  staleAfterSeconds: 120,
  exhausted: true,
  slots: [
    // Morning: 8:00 AM – 11:30 AM
    createSlot("morning-0800", 8, 0),
    createSlot("morning-0830", 8, 30, {
      kind: "blocked",
      reason: "booked",
    }),
    createSlot("morning-0900", 9, 0),
    createSlot("morning-0930", 9, 30),
    createSlot("morning-1000", 10, 0),
    createSlot("morning-1030", 10, 30, {
      kind: "held",
      by: "other",
      expiresInSeconds: 240,
    }),
    createSlot("morning-1100", 11, 0),
    createSlot("morning-1130", 11, 30),

    // Afternoon: 12:00 PM – 4:00 PM
    createSlot("afternoon-1200", 12, 0),
    createSlot("afternoon-1230", 12, 30, {
      kind: "blocked",
      reason: "booked",
    }),
    createSlot("afternoon-1300", 13, 0),
    createSlot("afternoon-1330", 13, 30, {
      kind: "blocked",
      reason: "provider-unavailable",
    }),
    createSlot("afternoon-1400", 14, 0),
    createSlot("afternoon-1430", 14, 30, {
      kind: "blocked",
      reason: "no-room",
    }),
    createSlot("afternoon-1500", 15, 0),
    createSlot("afternoon-1530", 15, 30, {
      kind: "blocked",
      reason: "booked",
    }),
    createSlot("afternoon-1600", 16, 0, {
      kind: "blocked",
      reason: "booked",
    }),
  ],
};

export default function AvailabilityWithAnAgeExample() {
  const [availability, setAvailability] = useState<AvailabilitySet>(initialAvailability);

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // A temporary hold lasts 15 seconds in this demonstration.
  const [heldSlotId, setHeldSlotId] = useState<string | null>(null);
  const [holdSeconds, setHoldSeconds] = useState(0);

  const [message, setMessage] = useState("");

  // Update the held slot's countdown.
  // When the countdown reaches zero, release the slot.
  useEffect(() => {
    if (!heldSlotId) return;

    const timer = window.setTimeout(() => {
      if (holdSeconds <= 1) {
        setAvailability((current) => ({
          ...current,
          slots: current.slots.map((slot) =>
            slot.id === heldSlotId ? { ...slot, state: { kind: "free" } } : slot,
          ),
        }));

        setHeldSlotId(null);
        setSelectedSlot(null);
        setHoldSeconds(0);
        setMessage("Your temporary hold expired. The time is available again.");

        return;
      }

      const nextSeconds = holdSeconds - 1;

      setAvailability((current) => ({
        ...current,
        slots: current.slots.map((slot) =>
          slot.id === heldSlotId
            ? {
                ...slot,
                state: {
                  kind: "held",
                  by: "me",
                  expiresInSeconds: nextSeconds,
                },
              }
            : slot,
        ),
      }));

      setHoldSeconds(nextSeconds);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [heldSlotId, holdSeconds]);

  // Simulate refreshing availability.
  // No API request is made.
  function handleRefresh() {
    setAvailability((current) => ({
      ...current,
      asOf: {
        date: sampleNow.date,
        time: sampleNow.time,
      },
    }));

    setMessage("Availability refreshed successfully.");
  }

  // Selecting a free slot creates a temporary hold.
  function handleSelect(slot: Slot) {
    if (slot.state.kind !== "free") return;

    setAvailability((current) => ({
      ...current,
      slots: current.slots.map((item) => {
        // Release a previous temporary hold.
        if (item.id === heldSlotId) {
          return { ...item, state: { kind: "free" } };
        }

        // Place a new temporary hold.
        if (item.id === slot.id) {
          return {
            ...item,
            state: {
              kind: "held",
              by: "me",
              expiresInSeconds: 15,
            },
          };
        }

        return item;
      }),
    }));

    setSelectedSlot(slot.id);
    setHeldSlotId(slot.id);
    setHoldSeconds(15);

    setMessage("A temporary hold has started. This is not a booking.");
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 p-6">
      <section className="space-y-4">
        <TimeSlotGrid
          label="Available times — Thu 27 Aug"
          set={availability}
          now={sampleNow}
          value={selectedSlot}
          onSelect={handleSelect}
          onRefresh={handleRefresh}
        />

        {heldSlotId && (
          <div
            className="rounded-lg border border-amber-300 bg-amber-50 p-4"
            role="status"
            aria-live="polite"
          >
            <p className="font-medium text-amber-900">Temporary hold active</p>

            <p className="mt-1 text-sm text-amber-800">
              Your selected time is held for you. It expires in{" "}
              <strong>{holdSeconds} seconds</strong>.
            </p>

            <p className="mt-1 text-xs text-amber-700">A hold is not a confirmed booking.</p>
          </div>
        )}

        {message && (
          <p className="text-sm text-gray-600" role="status" aria-live="polite">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
