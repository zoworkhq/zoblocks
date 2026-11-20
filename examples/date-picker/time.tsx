import { DatePicker, timeGrid } from "@/components/zoblocks/date-picker";

export default function TimePickerExample() {
  return (
    <div className="w-full max-w-md space-y-8">
      {/* 1. Manual time entry */}
      <section className="space-y-3">
        <span className="zb-dt-demo-cap">Type a bare 9</span>
        <DatePicker variant="time" label="Discharge time" />
      </section>

      {/* 2. Interval-based time presets */}
      <section className="space-y-3">
        <span className="zb-dt-demo-cap">presets=timeGrid(...)</span>
        <DatePicker
          variant="time"
          label="Time given"
          presets={timeGrid(8 * 60, 10 * 60, 20)}
          presetLabel="Available times"
        />
      </section>

      {/* 3. 24-hour observation time with seconds */}
      <section className="space-y-3">
        <span className="zb-dt-demo-cap">hour24 + showSecond</span>
        <DatePicker variant="time" label="Observation" hour24 showSecond />
      </section>
    </div>
  );
}
