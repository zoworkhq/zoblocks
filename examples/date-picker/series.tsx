"use client";

import * as React from "react";
import {
  RecurringSeriesScheduler,
  type RecurringSeriesSchedulerProps,
} from "@/components/zoblocks/date-picker";
import { plainDate } from "@/lib/zoblocks-datetime";

type Verdicts = NonNullable<RecurringSeriesSchedulerProps["verdicts"]>;

const conflicts: Verdicts = [
  {
    date: "2026-09-08",
    reason: "Dr Osei on leave",
    alternative: {
      date: plainDate(2026, 9, 10),
      label: "Thu 10 Sep",
    },
  },
  {
    date: "2026-10-13",
    reason: "Room 2 booked — no alternative room that hour",
  },
  {
    date: "2026-11-24",
    reason: "Thanksgiving week — programme closed",
    alternative: {
      date: plainDate(2026, 11, 25),
      label: "Wed 25 Nov",
    },
  },
];

export default function CollisionsResolvedBeforeWritingExample() {
  const [resolved, setResolved] = React.useState<Set<string>>(() => new Set());

  function resolve(isoDate: string) {
    setResolved((previous) => {
      const next = new Set(previous);
      next.add(isoDate);
      return next;
    });
  }

  function unresolve(isoDate: string) {
    setResolved((previous) => {
      const next = new Set(previous);
      next.delete(isoDate);
      return next;
    });
  }

  function resolveAll() {
    setResolved((previous) => {
      const next = new Set(previous);

      conflicts.forEach((conflict) => {
        if (conflict.alternative) {
          next.add(conflict.date);
        }
      });

      return next;
    });
  }

  return (
    <RecurringSeriesScheduler
      label="Weekly therapy — 16 sessions"
      rule={{
        freq: "WEEKLY",
        interval: 1,
        count: 16,
      }}
      startDate={plainDate(2026, 9, 1)}
      timeLabel="2:00 – 2:50 PM"
      verdicts={conflicts}
      resolved={resolved}
      onResolve={resolve}
      onUnresolve={unresolve}
      onResolveAll={resolveAll}
    />
  );
}
