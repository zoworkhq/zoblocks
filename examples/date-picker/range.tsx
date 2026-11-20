import { Calendar } from "@/components/zoblocks/date-picker";

import { dateRangePresets, plainDate, type ZbDate } from "@/lib/zoblocks-datetime";

export default function TwoClickRangeExample() {
  const currentDate = new Date();

  const today: ZbDate = plainDate(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate(),
  );

  // Start the example with an existing range.
  const startDate = new Date(today.y, today.m - 1, today.d - 5);

  const initialRange = {
    start: plainDate(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()),
    end: today,
  };

  const clinicClosed = (date: ZbDate): string | null => {
    const weekday = new Date(date.y, date.m - 1, date.d).getDay();

    return weekday === 0 ? "Clinic is closed on Sundays" : null;
  };

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="rounded-xl border border-[var(--zb-border)] bg-[var(--zb-surface)] p-3">
        <Calendar
          mode="range"
          months={2}
          weekStart={1}
          now={today}
          defaultRange={initialRange}
          unavailable={clinicClosed}
          presets={dateRangePresets(today, {
            weekStart: 1,
          })}
          showCustomPreset
          hints
          commit="explicit"
        />
      </div>
    </section>
  );
}
