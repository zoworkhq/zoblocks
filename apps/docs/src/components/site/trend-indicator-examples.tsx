"use client";

import {
  TrendIndicator,
  type TrendSeries,
} from "@/registry/zoblocks/trend-indicator/trend-indicator";
import "@/registry/zoblocks/lib/trend.css";

const phq9Series: TrendSeries = {
  id: "phq9",
  label: "PHQ-9",
  valence: "higher-is-worse",
  significantChange: 5,
  points: [
    { at: "2026-05-02", value: 18 },
    { at: "2026-06-06", value: 14 },
    { at: "2026-07-04", value: 12 },
  ],
};

const egfrSeries: TrendSeries = {
  id: "egfr",
  label: "eGFR",
  valence: "higher-is-better",
  unit: "mL/min",
  points: [
    { at: "2026-05-02", value: 92 },
    { at: "2026-06-06", value: 88 },
    { at: "2026-07-04", value: 86 },
  ],
};

const ferritinSeries: TrendSeries = {
  id: "ferritin",
  label: "Ferritin",
  valence: "higher-is-worse",
  unit: "ng/mL",
  points: [
    { at: "2026-01-04", value: 180 },
    { at: "2026-03-02", value: 176 },
    { at: "2026-04-10", value: 172 },
    {
      at: "2026-05-09",
      value: 212,
      breaksComparability: "Switched to Roche Elecsys",
    },
    { at: "2026-07-11", value: 218 },
  ],
};

const noisyPhq9Series: TrendSeries = {
  id: "phq9-noise",
  label: "PHQ-9",
  valence: "higher-is-worse",
  significantChange: 5,
  points: [
    { at: "2026-05-02", value: 14 },
    { at: "2026-06-06", value: 13 },
    { at: "2026-07-04", value: 12 },
  ],
};

const creatinineSeries: TrendSeries = {
  id: "creatinine",
  label: "Creatinine",
  valence: "higher-is-worse",
  unit: "µmol/L",
  points: [
    { at: "2026-06-01", value: 88 },
    { at: "2026-07-01", value: 104 },
  ],
};

function PreviewPanel({ children }: { children: React.ReactNode }) {
  return <div className="bg-paper p-5">{children}</div>;
}

export function ValencePreview() {
  return (
    <PreviewPanel>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-graphite">PHQ-9</span>
          <TrendIndicator series={phq9Series} width={120} height={32} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-graphite">eGFR</span>
          <TrendIndicator series={egfrSeries} width={120} height={32} />
        </div>
      </div>
    </PreviewPanel>
  );
}

export function ComparabilityPreview() {
  return (
    <PreviewPanel>
      <div className="space-y-3">
        <span className="text-sm font-medium text-graphite">Ferritin</span>
        <TrendIndicator series={ferritinSeries} width={180} height={36} />
      </div>
    </PreviewPanel>
  );
}

export function NoisePreview() {
  return (
    <PreviewPanel>
      <div className="space-y-3">
        <span className="text-sm font-medium text-graphite">PHQ-9</span>
        <TrendIndicator series={noisyPhq9Series} width={180} height={36} />
      </div>
    </PreviewPanel>
  );
}

export function TooFewPreview() {
  return (
    <PreviewPanel>
      <div className="space-y-3">
        <span className="text-sm font-medium text-graphite">Creatinine</span>
        <TrendIndicator series={creatinineSeries} width={180} height={36} />
      </div>
    </PreviewPanel>
  );
}
