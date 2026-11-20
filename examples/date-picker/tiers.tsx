import { DatePicker } from "@/components/zoblocks/date-picker";
import type { ZbDate } from "@/lib/zoblocks-datetime";

function createDate(year: number, month: number, day: number): ZbDate {
  return {
    kind: "date",
    y: year,
    m: month,
    d: day,
  };
}

export default function BirthDateExample() {
  const currentDate = new Date();

  const today = createDate(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate(),
  );

  return (
    <div className="flex w-full max-w-6xl flex-row items-center justify-center gap-6">
      <div className="min-w-0 flex-1">
        <span className="zb-dt-demo-cap">futurePolicy=&quot;block&quot;</span>
        <DatePicker label="Date of birth" now={today} futurePolicy="block" />
      </div>

      <div className="min-w-0 flex-1">
        <span className="zb-dt-demo-cap">futurePolicy=&quot;warn&quot;</span>
        <DatePicker label="Session documented" now={today} futurePolicy="warn" />
      </div>

      <div className="min-w-0 flex-1">
        <span className="zb-dt-demo-cap">showRelative</span>
        <DatePicker label="Date of service" now={today} showRelative />
      </div>
    </div>
  );
}
