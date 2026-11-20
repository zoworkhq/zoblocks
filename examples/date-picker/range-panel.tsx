import { Calendar } from "@/components/zoblocks/date-picker";

import {
  dateRangePresets,
  plainDate,
  type ZbDate,
  type ZbDateRange,
} from "@/lib/zoblocks-datetime";

export default function TwoMonthsOneControlsExample() {
  const currentDate = new Date();

  const today: ZbDate = plainDate(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate(),
  );

  const initialRange: ZbDateRange = {
    start: plainDate(2026, 8, 17),
    end: plainDate(2026, 9, 17),
  };

  const clinicClosed = (date: ZbDate): string | null => {
    const weekday = new Date(date.y, date.m - 1, date.d).getDay();

    return weekday === 0 ? "Clinic is closed on Sundays" : null;
  };

  return (
    <div>
      <Calendar
        mode="range"
        months={2}
        commit="explicit"
        hints
        weekStart={1}
        presets={dateRangePresets(today, {
          weekStart: 1,
        })}
        showCustomPreset
        now={today}
        defaultRange={initialRange}
        unavailable={clinicClosed}
      />
    </div>
  );
}
