import { classifyLocalTime, plainDate, plainTime } from "@/lib/zoblocks-datetime";

const scenarios = [
  {
    zone: "America/New_York",
    date: plainDate(2026, 3, 8),
    time: plainTime(2, 30),
    title: "Spring forward",
  },
  {
    zone: "America/New_York",
    date: plainDate(2026, 11, 1),
    time: plainTime(1, 30),
    title: "Fall back",
  },
  {
    zone: "Australia/Lord_Howe",
    date: plainDate(2026, 10, 4),
    time: plainTime(2, 15),
    title: "30-minute shift",
  },
  {
    zone: "Asia/Kathmandu",
    date: plainDate(2026, 8, 26),
    time: plainTime(9, 0),
    title: "No DST, +5:45",
  },
];

function formatDate(y: number, m: number, d: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

export default function DaylightSavingClassifiedExample() {
  return (
    <div className="w-full max-w-2xl space-y-6">
      {scenarios.map((scenario, index) => {
        const verdict = classifyLocalTime(scenario.zone, scenario.date, scenario.time);

        let result: string;

        switch (verdict.kind) {
          case "nonexistent":
            result = `Does not exist — ${verdict.skippedMinutes} minutes are skipped that morning`;
            break;

          case "ambiguous":
            result = `Happens twice — offsets ${verdict.earlierOffset} and ${verdict.laterOffset} minutes`;
            break;

          case "ok":
            result = `Happens once — offset ${verdict.offsetMinutes > 0 ? "+" : ""}${verdict.offsetMinutes} minutes`;
            break;

          case "unknown-zone":
            result = "Unknown time zone — classification unavailable";
            break;
        }

        return (
          <section key={scenario.zone + index} className="space-y-2">
            <span className="zb-dt-demo-cap">{scenario.zone}</span>

            <div>
              <strong>
                {formatDate(scenario.date.y, scenario.date.m, scenario.date.d)} ·{" "}
                {formatTime(scenario.time.h, scenario.time.mi)}
              </strong>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm font-semibold">{scenario.title}</span>

                <span
                  className={`text-sm font-semibold ${
                    verdict.kind === "nonexistent" || verdict.kind === "ambiguous"
                      ? "text-warning"
                      : "text-success"
                  }`}
                >
                  {result}
                </span>
              </div>
            </div>

            {index < scenarios.length - 1 && <hr />}
          </section>
        );
      })}
    </div>
  );
}
