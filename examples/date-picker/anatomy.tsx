import { Calendar } from "@/components/zoblocks/date-picker";
import { dateRangePresets, plainDate, type ZbDate } from "@/lib/zoblocks-datetime";

export default function PanelExplanationExample() {
  const todayDate = new Date();

  const today: ZbDate = plainDate(
    todayDate.getFullYear(),
    todayDate.getMonth() + 1,
    todayDate.getDate(),
  );

  // Start the selected range five days before today.
  const rangeStartDate = new Date(today.y, today.m - 1, today.d - 5);

  const rangeStart = plainDate(
    rangeStartDate.getFullYear(),
    rangeStartDate.getMonth() + 1,
    rangeStartDate.getDate(),
  );

  return (
    <section className="panel-explanation">
      <div className="panel-explanation__layout">
        <div className="panel-explanation__calendar">
          <Calendar
            mode="range"
            months={2}
            now={today}
            weekStart={1}
            defaultRange={{
              start: rangeStart,
              end: today,
            }}
            presets={dateRangePresets(today, { weekStart: 1 })}
            showCustomPreset
            commit="explicit"
            hints
          />
        </div>
      </div>
    </section>
  );
}
