import { useState } from "react";

import { DatePicker, relativeDateOptions } from "@/components/zoblocks/date-picker";

import type { ZbDate } from "@/lib/zoblocks-datetime";

export default function AppointmentDateExample() {
  const [date, setDate] = useState<ZbDate | null>(null);

  // The host application supplies today's date.
  const currentDate = new Date();

  const today: ZbDate = {
    kind: "date",
    y: currentDate.getFullYear(),
    m: currentDate.getMonth() + 1,
    d: currentDate.getDate(),
  };

  // Generate Today, Tomorrow, Next Monday and In 2 weeks.
  const shortcuts = relativeDateOptions(today);

  // Sample clinic availability for demonstration purposes.
  const unavailable = (date: ZbDate): string | null => {
    const weekday = new Date(date.y, date.m - 1, date.d).getDay();

    // The clinic is closed on Sundays.
    return weekday === 0 ? "Clinic is closed on Sundays" : null;
  };

  // Return a sample number of available appointment slots.
  const load = (date: ZbDate): number | null => {
    const weekday = new Date(date.y, date.m - 1, date.d).getDay();

    // No slots are available on Sundays.
    if (weekday === 0) {
      return null;
    }

    // Illustrative availability: 1–4 slots.
    return (date.d % 4) + 1;
  };

  return (
    <div className="w-full max-w-md">
      <DatePicker
        variant="picker"
        label="Appointment date"
        value={date}
        onChange={setDate}
        now={today}
        calendarShortcuts={shortcuts}
        unavailable={unavailable}
        load={load}
      />

      <p className="mt-3 text-sm text-[var(--zb-text-muted)]">
        {date
          ? `Selected date: ${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`
          : "value = null"}
      </p>

      <p className="mt-2 text-xs text-[var(--zb-text-muted)]">
        Demo availability: the clinic is closed on Sundays. Other dates show sample appointment slot
        counts.
      </p>
    </div>
  );
}
