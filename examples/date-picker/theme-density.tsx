import { Calendar } from "@/components/zoblocks/date-picker";

import { plainDate, type ZbDate } from "@/lib/zoblocks-datetime";

export default function EveryThemeAgainstEveryDensityExample() {
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

  const themes = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "high-contrast", label: "High contrast" },
  ] as const;

  const densities = [
    { value: "patient", label: "Patient" },
    { value: "standard", label: "Standard" },
    { value: "clinical", label: "Clinical" },
  ] as const;

  return (
    <main className="mx-auto w-full max-w-7xl">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-4">
        {themes.map((theme) =>
          densities.map((density) => (
            <section
              key={`${theme.value}-${density.value}`}
              className="space-y-3 rounded-lg border border-[var(--zb-border)] p-3"
            >
              <h3 className="text-sm font-semibold">
                {theme.label} · {density.label}
              </h3>

              <div
                data-zb-theme={theme.value}
                data-zb-density={density.value}
                className="rounded-md border p-3"
                style={{
                  backgroundColor: "var(--zb-bg)",
                  color: "var(--zb-text)",
                }}
              >
                <Calendar now={today} defaultValue={today} unavailable={clinicClosed} />
              </div>
            </section>
          )),
        )}
      </div>
    </main>
  );
}
