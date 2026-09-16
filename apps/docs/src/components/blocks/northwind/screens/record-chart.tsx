"use client";

import { INSTRUMENT_MAX, type Patient } from "../data";
import { EmptyState } from "../ui";
import { expected, response } from "./record-data";

const X0 = 40;
const X1 = 680;
const Y0 = 10;
const Y1 = 166;

/**
 * A patient's scores against the band their intake predicts. Same geometry as
 * the authored `TrajectoryOne`, so the two charts read as one instrument.
 */
export function Trajectory({ p }: { p: Patient }) {
  const s = p.scores;
  const max = INSTRUMENT_MAX[p.instrument];

  if (s.length === 0) {
    return (
      <EmptyState title={`No baseline yet — first ${p.instrument} due at intake`}>
        {p.next === "—" ? "No intake booked." : `Booked ${p.next}.`}
      </EmptyState>
    );
  }

  const n = s.length;
  const y = (v: number) => Y1 - (v / max) * (Y1 - Y0);
  const x = (i: number) => (n <= 1 ? X0 : X0 + (i * (X1 - X0)) / (n - 1));
  const intake = s[0]!;
  const upper = s.map((_, i) => `${x(i).toFixed(1)},${y(expected(intake, i)[0]).toFixed(1)}`);
  const lower = s
    .map((_, i) => `${x(i).toFixed(1)},${y(expected(intake, i)[1]).toFixed(1)}`)
    .reverse();
  const band = `M${[...upper, ...lower].join(" L")} Z`;
  const pts = s.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = s[n - 1]!;
  const reading = response(p);
  const ticks = [max, Math.round((max * 2) / 3), Math.round(max / 3), 0];
  const mid = Math.round((n - 1) / 2);
  const labels: [number, string][] =
    n >= 3
      ? [
          [0, "intake"],
          [mid, `S${mid}`],
          [n - 1, `S${n - 1}`],
        ]
      : n === 2
        ? [
            [0, "intake"],
            [1, "S1"],
          ]
        : [[0, "intake"]];

  return (
    <svg
      className="chart"
      viewBox="0 0 700 190"
      role="img"
      aria-label={`${p.name}'s ${p.instrument}: ${intake} at intake, ${last} now. ${reading.label}.`}
    >
      <g className="axis">
        {ticks.map((t) => (
          <text key={t} x="0" y={y(t) + 4}>
            {t}
          </text>
        ))}
      </g>
      {ticks.map((t) => (
        <line key={t} className="gridline" x1="26" y1={y(t)} x2="696" y2={y(t)} />
      ))}
      {[
        [10, "moderate · 10"],
        [5, "remission · 5"],
      ].map(([v, label]) => (
        <g key={label}>
          <line className="refline" x1="26" y1={y(v as number)} x2="696" y2={y(v as number)} />
          <text className="axis" x="696" y={y(v as number) - 4} textAnchor="end">
            {label}
          </text>
        </g>
      ))}
      {n > 1 ? (
        <>
          <path d={band} fill="color-mix(in srgb, var(--site-brand) 13%, transparent)" />
          <text
            className="axis"
            x={x(Math.max(1, mid))}
            y={y(expected(intake, Math.max(1, mid))[1]) + 12}
            fill="var(--site-brand)"
            textAnchor="middle"
          >
            expected for an intake of {intake}
          </text>
          <polyline
            className="draw"
            style={{ ["--len" as string]: "900", ["--dd" as string]: "200ms" }}
            points={pts}
            fill="none"
            stroke={`var(--${reading.sev})`}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}
      <circle cx={x(n - 1)} cy={y(last)} r="4" fill={`var(--${reading.sev})`} />
      <g className="axis">
        {labels.map(([i, label]) => (
          <text
            key={label}
            x={x(i)}
            y="184"
            textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
          >
            {label}
          </text>
        ))}
      </g>
    </svg>
  );
}
