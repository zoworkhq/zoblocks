import { Calendar, relativeDateOptions } from "@/components/zoblocks/date-picker";

import { plainDate, type ZbDate } from "@/lib/zoblocks-datetime";

export default function OneTabStopExample() {
  // The host application supplies today's date.
  const currentDate = new Date();

  const today: ZbDate = plainDate(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate(),
  );

  // Clinic is closed on Sundays.
  const clinicClosed = (date: ZbDate): string | null => {
    const weekday = new Date(date.y, date.m - 1, date.d).getDay();

    return weekday === 0 ? "Clinic is closed on Sundays" : null;
  };

  // Demo appointment availability.
  const openSlotCount = (date: ZbDate): number | null => {
    if (clinicClosed(date)) {
      return null;
    }

    return (date.d % 5) + 1;
  };

  return (
    <div>
      <Calendar
        now={today}
        defaultValue={today}
        load={openSlotCount}
        unavailable={clinicClosed}
        shortcuts={relativeDateOptions(today)}
        showCustomPreset
        hints
        commit="explicit"
      />
    </div>
  );
}
