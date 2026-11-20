import { DatePicker } from "@/components/zoblocks/date-picker";

import type { ZbDate, ZbInstant } from "@/lib/zoblocks-datetime";

export default function ReadoutExample() {
  // The date used for calculating the relative reading aid.
  const today: ZbDate = {
    kind: "date",
    y: 2026,
    m: 8,
    d: 26,
  };

  // The original recorded timestamp, including its IANA timezone.
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

  // A value that was requested but declined.
  const absentValue = {
    kind: "absent",
    reason: "asked-declined",
  } as const;

  return (
    <div className="w-full max-w-2xl space-y-8">
      {/* 1. Recorded timestamp with relative reading aid */}
      <section className="space-y-3">
        <span className="zb-dt-demo-cap">showRelative showZone</span>
        <div>
          <DatePicker
            variant="readout"
            as="time"
            value={signedAt}
            now={today}
            showRelative
            showZone
          />
        </div>
      </section>

      <hr />

      {/* 2. Recorded timestamp viewed from another timezone */}
      <section className="space-y-3">
        <span className="zb-dt-demo-cap">Different viewer timezone</span>
        <div>
          <DatePicker
            variant="readout"
            as="time"
            value={signedAt}
            viewerZone="America/Los_Angeles"
            showZone
          />
        </div>
      </section>

      <hr />

      {/* 3. Explicitly absent value */}
      <section className="space-y-3">
        <span className="zb-dt-demo-cap">Absent</span>
        <div>
          <DatePicker variant="readout" value={absentValue} />
        </div>
      </section>

      <hr />

      {/* 4. Restricted value */}
      <section className="space-y-3">
        <span className="zb-dt-demo-cap">Restricted</span>
        <div>
          <DatePicker variant="readout" value={signedAt} restricted />
        </div>
      </section>
    </div>
  );
}
