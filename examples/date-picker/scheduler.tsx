import { useState } from "react";

import {
  AppointmentScheduler,
  type AvailabilityQuery,
  type DayLoad,
  type SchedulableActor,
} from "@/components/zoblocks/date-picker";

import { plainDate, plainTime, type ZbDate } from "@/lib/zoblocks-datetime";

import type { AvailabilitySet, Slot } from "@/lib/zoblocks-availability";

// --------------------------------------------------
// 1. SAMPLE DATE AND CURRENT TIME
// --------------------------------------------------

const sampleNow = {
  date: plainDate(2026, 8, 27),
  time: plainTime(8, 15),
};

const days: ZbDate[] = [
  plainDate(2026, 8, 27),
  plainDate(2026, 8, 28),
  plainDate(2026, 8, 29),
  plainDate(2026, 8, 30),
  plainDate(2026, 8, 31),
  plainDate(2026, 9, 1),
  plainDate(2026, 9, 2),
];

// --------------------------------------------------
// 2. PROVIDERS
// --------------------------------------------------

const providers: SchedulableActor[] = [
  {
    id: "ama-osei",
    name: "Dr Ama Osei",
    role: "Psychiatrist",
    zone: "America/New_York",
    zoneLabel: "Eastern Time",
  },
  {
    id: "m-reyes",
    name: "M. Reyes, LCSW",
    role: "Therapist",
    zone: "America/Los_Angeles",
    zoneLabel: "Pacific Time",
  },
  {
    id: "wei-lin",
    name: "Dr Wei Lin",
    role: "Psychiatrist",
    zone: "America/New_York",
    zoneLabel: "Eastern Time",
  },
];

// The viewer is in Eastern Time.
// Providers in another zone will have their zone displayed.
const viewerZone = "America/New_York";

// --------------------------------------------------
// 3. DAY AVAILABILITY COUNTS
// --------------------------------------------------

const providerDayCounts: Record<string, number[]> = {
  "ama-osei": [10, 8, 6, 4, 0, 5, 7],
  "m-reyes": [8, 6, 4, 3, 0, 2, 5],
  "wei-lin": [6, 5, 3, 2, 0, 4, 6],
};

function getDayLoads(providerId: string): DayLoad[] {
  const counts = providerDayCounts[providerId] ?? [];

  return days.map((date, index) => ({
    date,
    openCount: counts[index] ?? 0,
  }));
}

// --------------------------------------------------
// 4. APPOINTMENT AVAILABILITY
// --------------------------------------------------

// Morning: 8:00 AM – 11:30 AM
// Afternoon: 12:00 PM – 4:00 PM

const slotTimes: [number, number][] = [
  [8, 0],
  [8, 30],
  [9, 0],
  [9, 30],
  [10, 0],
  [10, 30],
  [11, 0],
  [11, 30],
  [12, 0],
  [12, 30],
  [13, 0],
  [13, 30],
  [14, 0],
  [14, 30],
  [15, 0],
  [15, 30],
  [16, 0],
];

const openSlotIndexes = [0, 1, 2, 3, 4, 5, 8, 9, 10, 11];

function createAvailability(providerId: string, date: ZbDate): AvailabilitySet {
  const providerCounts = providerDayCounts[providerId];

  const dayIndex = days.findIndex(
    (day) => day.y === date.y && day.m === date.m && day.d === date.d,
  );

  const openCount = dayIndex >= 0 ? (providerCounts?.[dayIndex] ?? 0) : 0;

  const availableIndexes = new Set(openSlotIndexes.slice(0, openCount));

  const slots: Slot[] = slotTimes.map(([hour, minute], index) => ({
    id: `${providerId}-${date.y}-${date.m}-${date.d}-${hour}-${minute}`,
    start: plainTime(hour, minute),
    durationMinutes: 50,
    state: availableIndexes.has(index)
      ? { kind: "free" }
      : {
          kind: "blocked",
          reason: "booked",
        },
  }));

  return {
    asOf: {
      date: sampleNow.date,
      time: plainTime(8, 12),
    },
    staleAfterSeconds: 120,
    slots,
    exhausted: true,
  };
}

// --------------------------------------------------
// 5. MAIN EXAMPLE
// --------------------------------------------------

export default function ProviderDayTimeOneSurfaceExample() {
  const [providerId, setProviderId] = useState("ama-osei");

  const [date, setDate] = useState<ZbDate>(sampleNow.date);

  const [slotId, setSlotId] = useState<string | null>(null);

  const [availability, setAvailability] = useState<AvailabilitySet>(() =>
    createAvailability("ama-osei", sampleNow.date),
  );

  // Change provider and load that provider's availability.
  function handleProviderChange(nextProviderId: string) {
    setProviderId(nextProviderId);
    setSlotId(null);
    setAvailability(createAvailability(nextProviderId, date));
  }

  // Change date and load availability for that day.
  function handleDateChange(nextDate: ZbDate) {
    setDate(nextDate);
    setSlotId(null);
    setAvailability(createAvailability(providerId, nextDate));
  }

  // Simulate the availability request locally.
  function handleAvailabilityRequest(query: AvailabilityQuery) {
    setAvailability(createAvailability(query.actorId, query.date));
  }

  // Selecting a time is not the same as booking it.
  function handleSelect(choice: { actor: SchedulableActor; date: ZbDate; slot: Slot }) {
    setSlotId(choice.slot.id);
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <AppointmentScheduler
        label="Book an appointment"
        providers={providers}
        actorId={providerId}
        onActorChange={handleProviderChange}
        date={date}
        onDateChange={handleDateChange}
        dayLoads={getDayLoads(providerId)}
        availability={availability}
        onRequestAvailability={handleAvailabilityRequest}
        now={sampleNow}
        durationMinutes={50}
        buffers={{
          before: 0,
          after: 10,
        }}
        value={slotId}
        onSelect={handleSelect}
        viewerZone={viewerZone}
      />
    </main>
  );
}
