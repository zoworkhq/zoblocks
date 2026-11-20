import { useState } from "react";

import { DatePicker } from "@/components/zoblocks/date-picker";
import type { ZbDate } from "@/lib/zoblocks-datetime";

export default function DateFieldExample() {
  const [date, setDate] = useState<ZbDate | null>(null);

  // The host application supplies today's date.
  const currentDate = new Date();

  const today: ZbDate = {
    kind: "date",
    y: currentDate.getFullYear(),
    m: currentDate.getMonth() + 1,
    d: currentDate.getDate(),
  };

  return (
    <div className="flex w-full max-w-6xl flex-row items-center justify-center gap-6">
      <div className="flex-1 min-w-0">
        <span className="zb-dt-demo-cap">Typed, no calendar</span>
        <DatePicker
          variant="field"
          label="Date of service"
          name="dateOfService"
          value={date}
          onChange={setDate}
          now={today}
          showRelative
        />
      </div>
      <div className="flex-1 min-w-0">
        <span className="zb-dt-demo-cap">Posts ISO in a plain form</span>
        <DatePicker
          label="Referral received"
          now={today}
          name="referral_date" // posts 2026-08-21
          defaultValue={{
            kind: "date",
            y: 2026,
            m: 8,
            d: 21,
          }}
          showRelative
        />
      </div>
    </div>
  );
}
