import { useState } from "react";

import { TimeRangeField } from "@/components/zoblocks/date-picker";

import { plainTime, type ZbTimeRange } from "@/lib/zoblocks-datetime";

// First example: a normal three-hour time range.
const initialRange: ZbTimeRange = {
  start: plainTime(9, 0),
  end: plainTime(12, 0),
};

// Second example: an overnight shift from 10 PM to 6:30 AM.
const nightShift: ZbTimeRange = {
  start: plainTime(22, 0),
  end: plainTime(6, 30),
};

export default function TimeRangeTwoColumnsFilteredExample() {
  const [range, setRange] = useState<ZbTimeRange>(initialRange);
  const [nightRange, setNightRange] = useState<ZbTimeRange>(nightShift);

  const handleRangeChange = (newRange: ZbTimeRange) => {
    console.log("Old range:", range);
    console.log("New range:", newRange);

    setRange(newRange);
  };

  console.log("Current React range:", range);
  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 p-6">
      <TimeRangeField
        key={`${range.start?.h ?? ""}:${range.start?.mi ?? ""}-${range.end?.h ?? ""}:${range.end?.mi ?? ""}`}
        label="Time range"
        stepMinutes={60}
        minDurationMinutes={undefined}
        maxDurationMinutes={undefined}
        value={range}
        onChange={handleRangeChange}
      />

      <TimeRangeField
        key={`night-${nightRange.start?.h ?? ""}:${nightRange.start?.mi ?? ""}-${nightRange.end?.h ?? ""}:${nightRange.end?.mi ?? ""}`}
        label="Night shift"
        stepMinutes={30}
        allowOvernight
        value={nightRange}
        onChange={setNightRange}
      />
    </main>
  );
}
