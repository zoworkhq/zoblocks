import { BirthDateField } from "@/components/zoblocks/date-picker";
import { plainDate } from "@/lib/zoblocks-datetime";

export default function PatientRoutineExample() {
  // The host application supplies today's date.
  const currentDate = new Date();

  const today = plainDate(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate(),
  );

  const adultBirthDate = plainDate(1986, 7, 18);
  const infantBirthDate = plainDate(2026, 4, 20);
  const newbornBirthDate = plainDate(2026, 8, 9);

  return (
    <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
      <section className="space-y-3">
        <span className="zb-dt-demo-cap">Adult</span>

        <BirthDateField now={today} defaultValue={adultBirthDate} calendarHints />
      </section>

      <section className="space-y-3">
        <span className="zb-dt-demo-cap">Under two years</span>

        <BirthDateField now={today} defaultValue={infantBirthDate} />
      </section>

      <section className="space-y-3">
        <span className="zb-dt-demo-cap">Under four weeks</span>

        <BirthDateField now={today} defaultValue={newbornBirthDate} />
      </section>
    </div>
  );
}
