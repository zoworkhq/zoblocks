import { SessionTimeField, BEHAVIORAL_HEALTH_DURATIONS } from "@/components/zoblocks/date-picker";

import { plainTime, sessionFrom, type DurationBand } from "@/lib/zoblocks-datetime";

// These billing thresholds belong to the host organisation.
// The date-picker component does not define or assume them.
const thresholds = [
  {
    minMinutes: 0,
    maxMinutes: 15,
    code: null,
    label: "Not billable",
  },
  {
    minMinutes: 16,
    maxMinutes: 52,
    code: "SHORT",
    label: "Standard session",
  },
  {
    minMinutes: 53,
    maxMinutes: 999,
    code: "LONG",
    label: "Extended session",
  },
] satisfies readonly DurationBand[];

export default function BandsAreTheHostsExample() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <SessionTimeField
        label="Documentation time"
        defaultValue={sessionFrom(plainTime(15, 0), 12)}
        durationPresets={BEHAVIORAL_HEALTH_DURATIONS}
        bands={thresholds}
      />
    </main>
  );
}
