"use client";

import { RecurrenceField } from "@/components/zoblocks/date-picker";
import { plainDate } from "@/lib/zoblocks-datetime";

export default function RefusalInFullExample() {
  return (
    <RecurrenceField
      label="Repeats"
      startDate={plainDate(2026, 9, 1)}
      unsupported={{
        source: "FREQ=YEARLY;BYMONTH=3;BYDAY=2SU;BYHOUR=14",
        parts: ["FREQ=YEARLY", "BYMONTH", "BYHOUR"],
      }}
      showRRule
    />
  );
}
