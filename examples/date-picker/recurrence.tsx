"use client";

import { RecurrenceField } from "@/components/zoblocks/date-picker";
import { plainDate } from "@/lib/zoblocks-datetime";

export default function RuleInWordsExample() {
  return (
    <RecurrenceField
      label="Repeats"
      startDate={plainDate(2026, 9, 1)}
      timeLabel="2:00 – 2:50 PM"
      defaultValue={{
        freq: "WEEKLY",
        byWeekday: [2],
        count: 16,
      }}
      countOptions={[4, 6, 8, 12, 16, 24]}
      previewCount={16}
      showRRule
    />
  );
}
