import { useState } from "react";

import {
  BirthDateField,
  type BirthDateValue,
  type BirthDatePrecision,
} from "@/components/zoblocks/date-picker";

import type { ZbDate } from "@/lib/zoblocks-datetime";

export default function PartialBirthDateExample() {
  const currentDate = new Date();

  const today: ZbDate = {
    kind: "date",
    y: currentDate.getFullYear(),
    m: currentDate.getMonth() + 1,
    d: currentDate.getDate(),
  };

  // Example 1: Birth year is known, but exact date is unknown.
  const [partialDate, setPartialDate] = useState<BirthDateValue>({
    kind: "partial-date",
    y: 1962,
  });

  const [precision, setPrecision] = useState<BirthDatePrecision>("year");

  // Example 2: Birth date was requested but declined.
  const [absentDate, setAbsentDate] = useState<BirthDateValue>({
    kind: "absent",
    reason: "asked-declined",
  });

  return (
    <div className="grid w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">
      {/* Partial birth date */}
      <section className="space-y-4">
        <span className="zb-dt-demo-cap">precision=&quot;year&quot;</span>
        <BirthDateField
          label="Date of birth"
          now={today}
          allowEstimated
          allowAbsent
          precision={precision}
          onPrecisionChange={setPrecision}
          value={partialDate}
          onChange={setPartialDate}
        />
      </section>

      {/* Absent birth date */}
      <section className="space-y-4">
        <span className="zb-dt-demo-cap">allowAbsent</span>
        <BirthDateField
          label="Date of birth"
          now={today}
          allowAbsent
          absentReason="asked-declined"
          value={absentDate}
          onChange={setAbsentDate}
        />
      </section>
    </div>
  );
}
