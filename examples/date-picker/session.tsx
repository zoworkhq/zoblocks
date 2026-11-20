import { SessionTimeField, BEHAVIORAL_HEALTH_DURATIONS } from "@/components/zoblocks/date-picker";

import { plainTime, sessionFrom, type DurationBand } from "@/lib/zoblocks-datetime";

const org = {
  thresholds: [
    {
      minMinutes: 0,
      maxMinutes: 44,
      code: "SHORT",
      label: "Standard session",
    },
    {
      minMinutes: 45,
      maxMinutes: 480,
      code: "LONG",
      label: "Extended session",
    },
  ] satisfies readonly DurationBand[],
};

export default function ThreeValuesTwoDegreesExample() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <div className="[&_.zb-dt-chip__code]:hidden">
        <SessionTimeField
          label="Individual therapy"
          defaultValue={sessionFrom(plainTime(9, 0), 53)}
          durationPresets={BEHAVIORAL_HEALTH_DURATIONS}
          bands={org.thresholds}
        />
      </div>
    </main>
  );
}
