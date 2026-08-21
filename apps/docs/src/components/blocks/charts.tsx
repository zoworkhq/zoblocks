"use client";

/**
 * Two charts, hand-authored.
 *
 * No charting library, for two reasons that both hold independently. The
 * barrel takes no UI dependency and a chart package would be the largest one
 * in it — and more to the point, the chart that matters here is one no generic
 * library models: a series drawn against the band its own starting value
 * predicts. A line library gives you the line. The band is the finding.
 */

import * as React from "react";

/**
 * A PHQ-9 trajectory against the response band predicted by intake severity.
 *
 * This is the widget the reference dashboards do not have. A patient who
 * starts at 18 and reads 16 by session eight is failing quietly: the score
 * fell, so a delta arrow renders green and a sparkline renders a gentle
 * decline. Drawn against the band, the same two points say "this treatment is
 * not working" while there is still time to change it.
 */
export function TrajectoryPanel() {
  return (
    <svg
      className="chart"
      viewBox="0 0 720 220"
      role="img"
      aria-label="PHQ-9 trajectories for six patients against the expected response band. Two remain above the band across every session and are flagged as not on track."
    >
      <g className="axis">
        <text x="0" y="16">
          27
        </text>
        <text x="0" y="76">
          18
        </text>
        <text x="4" y="136">
          9
        </text>
        <text x="4" y="196">
          0
        </text>
      </g>
      {[12, 72, 132, 192].map((y) => (
        <line key={y} className="gridline" x1="26" y1={y} x2="716" y2={y} />
      ))}
      <line className="refline" x1="26" y1="126" x2="716" y2="126" />
      <text className="axis" x="646" y="122">
        moderate · 10
      </text>
      <line className="refline" x1="26" y1="160" x2="716" y2="160" />
      <text className="axis" x="641" y="156">
        remission · 5
      </text>

      <path
        d="M40,72 L120,80 L200,90 L280,100 L360,110 L440,118 L520,124 L600,130 L680,134 L680,168 L600,162 L520,155 L440,147 L360,138 L280,127 L200,114 L120,98 L40,72 Z"
        fill="color-mix(in srgb, var(--site-oxygen) 12%, transparent)"
      />
      <text className="axis" x="452" y="146" fill="var(--site-oxygen)">
        expected response band
      </text>

      {/* responding */}
      <polyline
        className="draw"
        style={{ ["--len" as string]: "800", ["--dd" as string]: "300ms" }}
        points="40,72 120,92 200,108 280,122 360,134 440,144 520,152 600,158 680,163"
        fill="none"
        stroke="var(--norm)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".75"
      />
      <polyline
        className="draw"
        style={{ ["--len" as string]: "800", ["--dd" as string]: "420ms" }}
        points="40,80 120,96 200,110 280,120 360,130 440,138 520,146 600,150 680,156"
        fill="none"
        stroke="var(--norm)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".45"
      />
      {/* slow */}
      <polyline
        className="draw"
        style={{ ["--len" as string]: "800", ["--dd" as string]: "540ms" }}
        points="40,70 120,78 200,86 280,96 360,104 440,112 520,118 600,122 680,126"
        fill="none"
        stroke="var(--high)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* not on track */}
      <polyline
        className="draw"
        style={{ ["--len" as string]: "800", ["--dd" as string]: "660ms" }}
        points="40,72 120,72 200,76 280,74 360,78 440,76 520,80 600,76 680,78"
        fill="none"
        stroke="var(--crit)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        className="draw"
        style={{ ["--len" as string]: "800", ["--dd" as string]: "780ms" }}
        points="40,64 120,66 200,64 280,68 360,66 440,70 520,68 600,72 680,70"
        fill="none"
        stroke="var(--crit)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".7"
      />
      {/* The one looping animation in the set, because it is the alert. */}
      <circle
        className="pulseRing"
        cx="680"
        cy="78"
        fill="none"
        stroke="var(--crit)"
        strokeWidth="1.5"
        r="4"
      />
      <circle cx="680" cy="78" r="4" fill="var(--crit)" />
      <g className="axis">
        <text x="34" y="212">
          intake
        </text>
        <text x="270" y="212">
          S4
        </text>
        <text x="510" y="212">
          S8
        </text>
        <text x="660" y="212">
          S12
        </text>
      </g>
    </svg>
  );
}

/** One patient, for the chart panel inside a record. */
export function TrajectoryOne() {
  return (
    <svg
      className="chart"
      viewBox="0 0 700 190"
      role="img"
      aria-label="One patient's PHQ-9 trajectory, sitting above the band predicted by an intake score of 18 from session five onward."
    >
      <g className="axis">
        <text x="0" y="14">
          27
        </text>
        <text x="0" y="70">
          18
        </text>
        <text x="4" y="126">
          9
        </text>
        <text x="4" y="170">
          0
        </text>
      </g>
      {[10, 66, 122, 166].map((y) => (
        <line key={y} className="gridline" x1="26" y1={y} x2="696" y2={y} />
      ))}
      <line className="refline" x1="26" y1="118" x2="696" y2="118" />
      <text className="axis" x="626" y="114">
        moderate · 10
      </text>
      <line className="refline" x1="26" y1="148" x2="696" y2="148" />
      <text className="axis" x="621" y="144">
        remission · 5
      </text>
      <path
        d="M40,66 L150,76 L260,88 L370,100 L480,110 L590,118 L680,122 L680,154 L590,148 L480,140 L370,130 L260,116 L150,96 L40,66 Z"
        fill="color-mix(in srgb, var(--site-oxygen) 13%, transparent)"
      />
      <text className="axis" x="450" y="136" fill="var(--site-oxygen)">
        expected for an intake of 18
      </text>
      <polyline
        className="draw"
        style={{ ["--len" as string]: "760", ["--dd" as string]: "280ms" }}
        points="40,66 150,70 260,68 370,72 480,70 590,74 680,72"
        fill="none"
        stroke="var(--crit)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        className="pulseRing"
        cx="680"
        cy="72"
        fill="none"
        stroke="var(--crit)"
        strokeWidth="1.5"
        r="4"
      />
      <circle cx="680" cy="72" r="4" fill="var(--crit)" />
      <g className="axis">
        <text x="34" y="184">
          intake
        </text>
        <text x="250" y="184">
          S4
        </text>
        <text x="470" y="184">
          S8
        </text>
        <text x="658" y="184">
          S10
        </text>
      </g>
    </svg>
  );
}

interface Step {
  label: string;
  count: number;
}

const FUNNEL: readonly Step[] = [
  { label: "Referred", count: 214 },
  { label: "First contact", count: 173 },
  { label: "Session 1", count: 141 },
  { label: "Session 3", count: 79 },
];

/**
 * Referral through to session three.
 *
 * Four aligned rows on a common baseline. Two earlier versions tried harder —
 * a hatched remainder for the people lost, then a tapering ribbon — and both
 * were more drawing than reading. The panel has one job: show where the cohort
 * falls away. Bars do that without anyone having to interpret a shape.
 *
 * A funnel rather than a no-show percentage, because a clinic-wide rate hides
 * where the loss is. Someone who does not return after session two never
 * reaches an outcomes report at all — they are simply absent from the
 * denominator, which is the most flattering way to lose a patient.
 */
export function FunnelPanel() {
  const first = FUNNEL[0]?.count ?? 1;
  const drops = FUNNEL.slice(1).map((s, i) => (FUNNEL[i]?.count ?? 0) - s.count);
  const worst = Math.max(...drops);

  return (
    <div>
      {FUNNEL.map((step, i) => {
        const pct = Math.round((step.count / first) * 100);
        const isWorst = i > 0 && drops[i - 1] === worst;
        return (
          <div key={step.label} className={`funRow${isWorst ? " worst" : ""}`}>
            <span className="lbl">{step.label}</span>
            <span className="cnt">{step.count}</span>
            <span className="fbar">
              <i style={{ width: `${pct}%` }} />
            </span>
            <span className="pct">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}
