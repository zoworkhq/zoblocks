import { useState } from "react";

import { DateRangeField } from "@/components/zoblocks/date-picker";

import {
  dateRangePresets,
  plainDate,
  type ZbDate,
  type ZbDateRange,
} from "@/lib/zoblocks-datetime";

export default function RangeFieldBothEndsTypedExample() {
  const currentDate = new Date();

  const today: ZbDate = plainDate(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate(),
  );

  // Helper to create dates relative to today.
  const addDays = (date: ZbDate, days: number): ZbDate => {
    const result = new Date(date.y, date.m - 1, date.d + days);

    return plainDate(result.getFullYear(), result.getMonth() + 1, result.getDate());
  };

  // A valid five-day authorisation window.
  const [authorisationRange, setAuthorisationRange] = useState<ZbDateRange>({
    start: today,
    end: addDays(today, 4),
  });

  // An intentionally invalid reporting period.
  // The end date comes before the start date.
  const [reportingRange, setReportingRange] = useState<ZbDateRange>({
    start: addDays(today, 7),
    end: addDays(today, 2),
  });

  return (
    <section className="mx-auto w-full max-w-6xl space-y-8 p-6">
      <DateRangeField
        label="Authorisation window"
        value={authorisationRange}
        onChange={setAuthorisationRange}
        now={today}
        weekStart={1}
        months={2}
        showSpan
        hints
        presets={dateRangePresets(today, {
          weekStart: 1,
        })}
        showCustomPreset
        maxSpanDays={90}
      />
      <DateRangeField
        label="Reporting period"
        value={reportingRange}
        onChange={setReportingRange}
        now={today}
        weekStart={1}
        months={2}
        showSpan
        hints
        presets={dateRangePresets(today, {
          weekStart: 1,
        })}
        showCustomPreset
        maxSpanDays={90}
      />
    </section>
  );
}
