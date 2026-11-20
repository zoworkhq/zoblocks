import { Tabs } from "@zoblocks/tabs";

type StatProps = {
  name: string;
  value: string;
  delta: string;
  good?: boolean;
};

function Stat({ name, value, delta, good = false }: StatProps) {
  return (
    <div className="min-w-32 space-y-1 text-left">
      <p className="text-xs font-medium text-[var(--zb-text-muted)]">{name}</p>
      <p className="text-xl font-semibold text-[var(--zb-text)]">{value}</p>
      <p className={`text-xs font-medium ${good ? "text-green-700" : "text-red-700"}`}>{delta}</p>
    </div>
  );
}

const trendData: Record<string, { title: string; values: number[]; labels: string[] }> = {
  appts: {
    title: "Appointments per day",
    values: [168, 192, 174, 210, 186, 225, 129],
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  noshow: {
    title: "Daily no-show rate (%)",
    values: [5.2, 6.1, 5.7, 6.8, 6.0, 7.4, 6.5],
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  wait: {
    title: "Median wait per day (minutes)",
    values: [18, 15, 17, 13, 16, 11, 12],
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  portal: {
    title: "Portal messages per day",
    values: [65, 82, 74, 96, 88, 112, 97],
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
};

function Trend({ metric }: { metric: string }) {
  const chart = trendData[metric];
  if (!chart) return null;
  const minValue = Math.min(...chart.values);
  const maxValue = Math.max(...chart.values);
  const range = maxValue - minValue;

  return (
    <div className="rounded-xl border border-dashed border-[var(--zb-border)] bg-[var(--zb-bg-subtle)] p-4">
      <div className="flex h-40 items-end gap-3">
        {chart.values.map((value, index) => {
          const height = range === 0 ? 60 : 20 + ((value - minValue) / range) * 80;

          return (
            <div key={index} className="flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${height}%`,
                  backgroundColor: "#067662",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StatVariantExample() {
  return (
    <section className="space-y-4">
      <Tabs
        as="tabs"
        variant="stat"
        aria-label="Metric"
        defaultValue="appts"
        items={[
          {
            value: "appts",
            textLabel: "Appointments, 1,284, better than last week",
            label: <Stat name="Appointments" value="1,284" delta="▲ 6.2 % vs last week" good />,
            children: <Trend metric="appts" />,
          },
          {
            value: "noshow",
            textLabel: "No-show rate, 7.4 %, worse than last week",
            label: <Stat name="No-show rate" value="7.4 %" delta="▲ 1.1 pt vs last week" />,
            children: <Trend metric="noshow" />,
          },
          {
            value: "wait",
            textLabel: "Median wait, 12 m, better than last week",
            label: <Stat name="Median wait" value="12 m" delta="▼ 3 m vs last week" good />,
            children: <Trend metric="wait" />,
          },
          {
            value: "portal",
            textLabel: "Portal messages, 612, worse than last week",
            label: <Stat name="Portal messages" value="612" delta="▲ 18 % vs last week" />,
            children: <Trend metric="portal" />,
          },
        ]}
      />
    </section>
  );
}
