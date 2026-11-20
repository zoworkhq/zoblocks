import { TimeSlotGrid } from "@/components/zoblocks/date-picker";

import { plainDate, plainTime } from "@/lib/zoblocks-datetime";

import type { AvailabilitySet } from "@/lib/zoblocks-availability";

// Sample date: Friday, 28 August 2026.
const sampleDate = plainDate(2026, 8, 28);

// The host supplies the current date and time.
const now = {
  date: sampleDate,
  time: plainTime(9, 0),
};

// The availability search has completed,
// but it found no available appointment slots.
const exhaustedAvailability: AvailabilitySet = {
  asOf: {
    date: sampleDate,
    time: plainTime(9, 0),
  },
  slots: [],
  exhausted: true,
};

export default function ExhaustedNotEmptyExample() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <TimeSlotGrid label="Available times — Fri 28 Aug" set={exhaustedAvailability} now={now} />
    </main>
  );
}
