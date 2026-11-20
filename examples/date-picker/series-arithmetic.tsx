"use client";

import { GroupSeriesScheduler } from "@/components/zoblocks/date-picker";
import { plainDate } from "@/lib/zoblocks-datetime";

export default function EncounterRoutineExample() {
  return (
    <GroupSeriesScheduler
      name="DBT Skills — Emotion Regulation"
      rule={{
        freq: "WEEKLY",
        interval: 1,
        byWeekday: [2],
        count: 26,
      }}
      startDate={plainDate(2026, 9, 1)}
      timeLabel="5:30 – 7:00 PM"
      sessionMinutes={90}
      facilitators={["M. Reyes, LCSW", "J. Bhatt, LPC"]}
      room={{
        name: "Group Room 2",
        capacity: 12,
      }}
      modality="In person"
      capacity={12}
      enrolled={9}
      exclusions={[
        {
          date: plainDate(2026, 11, 24),
          reason: "Thanksgiving week — programme closed",
        },
        {
          date: plainDate(2026, 12, 22),
          reason: "Winter break",
        },
        {
          date: plainDate(2026, 12, 29),
          reason: "Winter break",
        },
      ]}
      showRRule
    />
  );
}
