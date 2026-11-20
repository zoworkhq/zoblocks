import { DatePicker } from "@/components/zoblocks/date-picker";

import { plainDate, plainTime, sessionFrom } from "@/lib/zoblocks-datetime";

import type { ZbDate, ZbInstant } from "@/lib/zoblocks-datetime";

export default function DensityAndDirectionExample() {
  // Fixed reference date so the example remains deterministic.
  const today: ZbDate = plainDate(2026, 8, 26);

  // Recorded timestamp with its original IANA timezone.
  const signedAt: ZbInstant = {
    kind: "instant",
    date: plainDate(2026, 8, 24),
    time: plainTime(8, 12),
    zone: "America/New_York",
  };

  // A 50-minute session starting at 2:00 PM.
  // sessionFrom holds the duration and derives the end time.
  const session = sessionFrom(plainTime(14, 0), 50);

  return (
    <div className="w-full max-w-3xl space-y-6" data-zb-density="clinical" dir="ltr">
      <section className="space-y-3 text-left">
        <DatePicker variant="picker" label="Picker" defaultValue={today} now={today} />

        <DatePicker variant="field" label="Field" defaultValue={today} now={today} />
      </section>

      <hr />

      <section className="space-y-3 text-left">
        <DatePicker
          variant="birth-date"
          label="Date of birth"
          defaultValue={plainDate(1986, 7, 18)}
          now={today}
        />
      </section>

      <hr />

      <section className="space-y-3 text-left">
        <DatePicker variant="time" label="Time" defaultValue={plainTime(14, 0)} />
      </section>

      <hr />

      <section className="space-y-3 text-left">
        <DatePicker variant="session" label="Session" value={session} />
      </section>

      <hr />

      <section className="space-y-3 text-left" dir="ltr">
        <DatePicker variant="readout" as="time" value={signedAt} now={today} showZone />
      </section>
    </div>
  );
}
