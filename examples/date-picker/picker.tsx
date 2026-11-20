import { useState } from "react";

import { DateField, relativeDateOptions } from "@/components/zoblocks/date-picker";

import { formatPlainDate, plainDate, type ZbDate } from "@/lib/zoblocks-datetime";

export default function AppointmentPickerExample() {
  const [value, setValue] = useState<ZbDate | null>(plainDate(2026, 9, 2));

  // The host application supplies today's date.
  const currentDate = new Date();

  const today = plainDate(
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
    <div className="w-full max-w-xl space-y-4">
      <DateField
        label="Appointment date"
        showCalendar
        now={today}
        value={value}
        onChange={setValue}
        unavailable={clinicClosed} // returns the reason, or null
        load={openSlotCount}
        calendarShortcuts={relativeDateOptions(today)}
        calendarShowCustom
        calendarHints
        calendarCommit="explicit"
      />

      <span className="zb-dt-demo-cap">value = {value ? formatPlainDate(value, "iso") : ""}</span>
    </div>
  );
}
