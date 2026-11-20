import { Calendar, relativeDateOptions } from "@/components/zoblocks/date-picker";

import { plainDate, type ZbDate } from "@/lib/zoblocks-datetime";

export default function SeveralDatesExample() {
  const currentDate = new Date();

  // Today's date.
  const today: ZbDate = plainDate(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate(),
  );

  // Generate a future date, skipping Sundays.
  const dateAfterDays = (days: number): ZbDate => {
    const date = new Date(today.y, today.m - 1, today.d + days);

    while (date.getDay() === 0) {
      date.setDate(date.getDate() + 1);
    }

    return plainDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  };

  // Three make-up sessions spread across two weeks.
  const initialDates = [dateAfterDays(2), dateAfterDays(7), dateAfterDays(12)];

  // Clinic is closed on Sundays.
  const clinicClosed = (date: ZbDate): string | null => {
    const weekday = new Date(date.y, date.m - 1, date.d).getDay();

    return weekday === 0 ? "Clinic is closed on Sundays" : null;
  };

  return (
    <div>
      <Calendar
        mode="multiple"
        maxDates={4}
        now={today}
        defaultDates={initialDates}
        unavailable={clinicClosed}
        shortcuts={relativeDateOptions(today)}
        showCustomPreset
        hints
        commit="explicit"
      />
    </div>
  );
}
