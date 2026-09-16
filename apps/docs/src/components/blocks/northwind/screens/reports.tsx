"use client";

/**
 * Reports — measurement-based care, for whoever runs the clinic.
 *
 * The 30-day view is the live cohort and agrees with the dashboard to the
 * patient: 68 active, 7 not on track. Longer windows add the episodes that
 * closed inside them, generated from a fixed seed, so the numbers move when
 * the period does and stay put when the page reloads.
 */

import * as React from "react";
import { Download } from "lucide-react";
import {
  CLINICIANS,
  PATIENTS,
  TRACK,
  type ClinicianId,
  type Patient,
  type Program,
  type Track,
} from "../data";
import { useNav } from "../shell";
import {
  ClinicianAvatar,
  KV,
  PatientLink,
  ScreenBody,
  ScreenHead,
  Segmented,
  Sheet,
  TabPanel,
  Tabs,
} from "../ui";
import { BarShare, BarTarget, Status, Tile } from "../../kit";

/* ---------------------------------------------------------------- model */

type Period = "30d" | "90d" | "12m";
type Tab = "outcomes" | "access" | "engagement" | "clinicians";

const PERIODS: readonly { value: Period; label: string }[] = [
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "90 days" },
  { value: "12m", label: "12 months" },
];

const TABS: readonly { value: Tab; label: string }[] = [
  { value: "outcomes", label: "Outcomes" },
  { value: "access", label: "Access" },
  { value: "engagement", label: "Engagement" },
  { value: "clinicians", label: "Clinicians" },
];

const PROGRAMS: readonly Program[] = ["Adult depression", "Anxiety", "Perinatal", "Young adult"];
const CLIN_IDS: readonly ClinicianId[] = ["lake", "tash", "osei", "brandt"];

/** Response is judged from the sixth measure; earlier than that it is noise. */
const ASSESS_FROM = 6;
const SMALL = 10;

interface Episode {
  id: string;
  program: Program;
  clinician: ClinicianId;
  track: Track;
  measures: number;
  sessions: number;
  every: boolean;
  active: boolean;
  modality: Patient["modality"];
  cadence: Patient["cadence"];
}

function hash(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* A missed measure is a session with no score. The cohort records every
   session as measured, so a fixed sixth of patients are marked as having
   skipped one — otherwise the tile would read a flattering 100%. */
const ACTIVE: readonly Episode[] = PATIENTS.map((p) => ({
  id: p.id,
  program: p.program,
  clinician: p.clinician,
  track: p.track,
  measures: p.scores.length,
  sessions: p.sessions,
  every: p.scores.length > 0 && p.scores.length >= p.sessions && hash(p.id) % 6 !== 0,
  active: true,
  modality: p.modality,
  cadence: p.cadence,
}));

/** Episodes that closed inside the window, per program. */
const CLOSED: Record<Period, readonly number[]> = {
  "30d": [0, 0, 0, 0],
  "90d": [12, 10, 6, 8],
  "12m": [58, 47, 29, 37],
};

function closedFor(period: Period): Episode[] {
  const r = rng(period === "90d" ? 90 : 365);
  const out: Episode[] = [];
  PROGRAMS.forEach((program, pi) => {
    for (let k = 0; k < CLOSED[period][pi]!; k += 1) {
      const x = r();
      const track: Track =
        x < 0.36 ? "remission" : x < 0.68 ? "responding" : x < 0.84 ? "slow" : "not-on-track";
      const measures = 6 + Math.floor(r() * 10);
      const sessions = measures + (r() > 0.82 ? 1 : 0);
      out.push({
        id: `closed-${period}-${pi}-${k}`,
        program,
        clinician: CLIN_IDS[(pi + k) % CLIN_IDS.length]!,
        track,
        measures,
        sessions,
        every: sessions === measures,
        active: false,
        modality: r() > 0.45 ? "Telehealth" : "In person",
        cadence: "Weekly",
      });
    }
  });
  return out;
}

const EPISODES: Record<Period, readonly Episode[]> = {
  "30d": ACTIVE,
  "90d": [...ACTIVE, ...closedFor("90d")],
  "12m": [...ACTIVE, ...closedFor("12m")],
};

const isResp = (e: Episode) => e.track === "responding" || e.track === "remission";
const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));

function median(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : Math.round((s[m - 1]! + s[m]!) / 2);
}

/** Notes unsigned past 48 hours, now. A backlog, not a rate, so no period. */
const UNSIGNED: Record<ClinicianId, { count: number; oldest: string }> = {
  lake: { count: 2, oldest: "7d" },
  osei: { count: 0, oldest: "—" },
  tash: { count: 0, oldest: "—" },
  brandt: { count: 2, oldest: "3d" },
};

/* ------------------------------------------------------------- CSV export */

function download(name: string, rows: readonly (readonly (string | number)[])[]) {
  const cell = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const text = rows.map((r) => r.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------- outcomes */

function programRows(period: Period) {
  return PROGRAMS.map((program) => {
    const eps = EPISODES[period].filter((e) => e.program === program && e.measures >= ASSESS_FROM);
    const resp = eps.filter(isResp).length;
    const rem = eps.filter((e) => e.track === "remission").length;
    return { program, n: eps.length, resp, rem, small: eps.length < SMALL };
  });
}

const MONTH_NAMES = [
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
];
const MONTH_SHARE = [54, 55, 57, 56, 58, 59, 58, 61, 60, 64, 66];
const MONTH_N = [44, 46, 47, 49, 50, 52, 48, 52, 55, 57, 59];

function monthly(period: Period) {
  const measured = ACTIVE.filter((e) => e.measures > 0);
  const aug = {
    month: "Aug",
    share: pct(measured.filter(isResp).length, measured.length),
    n: measured.length,
  };
  const all = [
    ...MONTH_NAMES.slice(0, 11).map((month, i) => ({
      month,
      share: MONTH_SHARE[i]!,
      n: MONTH_N[i]!,
    })),
    aug,
  ];
  return period === "12m" ? all : all.slice(-6);
}

function LineChart({ period }: { period: Period }) {
  const data = monthly(period);
  const [active, setActive] = React.useState<number | null>(null);
  const W = 640;
  const H = 210;
  const L = 36;
  const R = 18;
  const T = 14;
  const B = 28;
  const lo = 40;
  const hi = 80;
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, data.length - 1);
  const y = (v: number) => T + ((hi - v) / (hi - lo)) * (H - T - B);
  const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.share).toFixed(1)}`).join(" ");
  const first = data[0]!;
  const last = data[data.length - 1]!;
  const cur = active === null ? null : data[active]!;

  return (
    <div className="rp-lineBox">
      <svg
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Share responding by month, ${first.month} to ${last.month}: from ${first.share}% to ${last.share}%.`}
      >
        {[40, 50, 60, 70, 80].map((v) => (
          <g key={v}>
            <line
              className={v === 50 ? "refline" : "gridline"}
              x1={L}
              x2={W - R}
              y1={y(v)}
              y2={y(v)}
            />
            <text className="axis rp-axis" x={L - 8} y={y(v) + 3.5} textAnchor="end">
              {v}%
            </text>
          </g>
        ))}
        <text className="axis rp-axis" x={W - R} y={y(50) - 5} textAnchor="end">
          benchmark 50%
        </text>
        <path
          d={`M${x(0)},${y(data[0]!.share)} ${data.map((d, i) => `L${x(i)},${y(d.share)}`).join(" ")} L${x(data.length - 1)},${H - B} L${x(0)},${H - B} Z`}
          fill="color-mix(in srgb, var(--norm) 10%, transparent)"
        />
        <polyline
          points={pts}
          fill="none"
          stroke="var(--norm)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => (
          <g key={d.month}>
            <circle
              cx={x(i)}
              cy={y(d.share)}
              r={active === i ? 5 : 3.5}
              fill={active === i ? "var(--norm)" : "var(--site-paper-sunk)"}
              stroke="var(--norm)"
              strokeWidth="2"
            />
            <text className="axis rp-axis" x={x(i)} y={H - 8} textAnchor="middle">
              {d.month}
            </text>
          </g>
        ))}
      </svg>
      {data.map((d, i) => (
        <button
          key={d.month}
          type="button"
          className="rp-pt"
          style={{ left: `${(x(i) / W) * 100}%`, top: `${(y(d.share) / H) * 100}%` }}
          aria-label={`${d.month}: ${d.share}% responding, ${d.n} measured`}
          onMouseEnter={() => setActive(i)}
          onMouseLeave={() => setActive(null)}
          onFocus={() => setActive(i)}
          onBlur={() => setActive(null)}
          onClick={() => setActive(i)}
        />
      ))}
      {cur && active !== null ? (
        <div
          className={`rp-tip${active === 0 ? " start" : active === data.length - 1 ? " end" : ""}`}
          style={{ left: `${(x(active) / W) * 100}%`, top: `${(y(cur.share) / H) * 100}%` }}
          aria-hidden="true"
        >
          <b>{cur.month} 2026</b>
          <span>
            <span className="mono">{cur.share}%</span> responding
          </span>
          <span>
            <span className="mono">{cur.n}</span> measured
          </span>
        </div>
      ) : null}
    </div>
  );
}

function Outcomes({ period }: { period: Period }) {
  const { go } = useNav();
  const eps = EPISODES[period];
  const measured = eps.filter((e) => e.measures > 0);
  const inCare = eps.filter((e) => e.sessions > 0);
  const resp = measured.filter(isResp).length;
  const rem = measured.filter((e) => e.track === "remission").length;
  const not = eps.filter((e) => e.track === "not-on-track").length;
  const every = inCare.filter((e) => e.every).length;
  const everyPct = pct(every, inCare.length);
  const denom = period === "30d" ? `of ${eps.length} active` : `of ${eps.length} episodes`;
  const rows = programRows(period);
  const max = 100;

  return (
    <>
      <div className="tiles">
        <button
          type="button"
          className="rp-tileBtn"
          onClick={() => go({ screen: "caseload", view: "responding" })}
        >
          <Tile
            cap="Response rate"
            status={pct(resp, measured.length) >= 50 ? "above benchmark" : "below benchmark"}
            sev={pct(resp, measured.length) >= 50 ? "norm" : "high"}
            n={`${pct(resp, measured.length)}%`}
            unit={`${resp} of ${measured.length} measured`}
            bar={<BarTarget pct={pct(resp, measured.length)} target={50} sev="norm" />}
            footLeft="≥50% drop"
            footRight="target 50%"
          />
        </button>
        <button
          type="button"
          className="rp-tileBtn"
          onClick={() => go({ screen: "caseload", view: "remission" })}
        >
          <Tile
            cap="Remission"
            status="score under 5"
            sev="norm"
            n={`${pct(rem, measured.length)}%`}
            unit={`${rem} of ${measured.length} measured`}
            bar={<BarShare pct={pct(rem, measured.length)} sev="norm" />}
            footLeft="score < 5"
            footRight="2 readings"
          />
        </button>
        <button
          type="button"
          className="rp-tileBtn"
          onClick={() => go({ screen: "caseload", view: "not-on-track" })}
        >
          <Tile
            cap="Not on track"
            status="review due"
            sev="crit"
            n={String(not)}
            unit={denom}
            bar={<BarShare pct={(not / eps.length) * 100} sev="crit" />}
            footLeft="above band"
            footRight={`${pct(not, eps.length)}% of total`}
          />
        </button>
        <button
          type="button"
          className="rp-tileBtn"
          onClick={() => go({ screen: "caseload", view: "baseline" })}
        >
          <Tile
            cap="Measured every session"
            status={everyPct >= 90 ? "on target" : "below target"}
            sev={everyPct >= 90 ? "norm" : "high"}
            n={`${everyPct}%`}
            unit={`${every} of ${inCare.length} in care`}
            bar={<BarTarget pct={everyPct} target={90} sev={everyPct >= 90 ? "norm" : "high"} />}
            footLeft="every session"
            footRight="target 90%"
          />
        </button>
      </div>

      <section className="panel" aria-labelledby="rp-prog-h">
        <div className="panelTop">
          <div>
            <h3 id="rp-prog-h">Response and remission by program</h3>
            <p>Episodes with {ASSESS_FROM} or more measures · n is the denominator</p>
          </div>
        </div>
        <div className="rp-prog">
          {rows.map((r) => (
            <div key={r.program} className={`rp-progRow${r.small ? " small" : ""}`}>
              <div className="rp-progLbl">
                <b>{r.program}</b>
                <span className="mono">n={r.n}</span>
                {r.small ? <span className="rp-smallTag">small sample</span> : null}
              </div>
              <div className="rp-progBars">
                <div className="rp-hbar">
                  <span className="rp-hbarK">Response</span>
                  <span className="rp-hbarTrk">
                    <i className="resp" style={{ width: `${(pct(r.resp, r.n) / max) * 100}%` }} />
                    <span className="rp-mark50" aria-hidden="true" />
                  </span>
                  <span className="mono rp-hbarV">
                    {pct(r.resp, r.n)}% <span>{r.resp}</span>
                  </span>
                </div>
                <div className="rp-hbar">
                  <span className="rp-hbarK">Remission</span>
                  <span className="rp-hbarTrk">
                    <i className="rem" style={{ width: `${(pct(r.rem, r.n) / max) * 100}%` }} />
                    <span className="rp-mark50" aria-hidden="true" />
                  </span>
                  <span className="mono rp-hbarV">
                    {pct(r.rem, r.n)}% <span>{r.rem}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="miniLegend">
          <span className="rp-key">
            <i className="resp" aria-hidden="true" />
            Response
          </span>
          <span className="rp-key">
            <i className="rem" aria-hidden="true" />
            Remission
          </span>
          <span className="rp-key">
            <i className="hatch" aria-hidden="true" />
            Under {SMALL} episodes: read with care
          </span>
          <span>Tick marks 50%</span>
        </p>
      </section>

      <section className="panel" aria-labelledby="rp-line-h">
        <div className="panelTop">
          <div>
            <h3 id="rp-line-h">Share responding, by month</h3>
            <p>All measured patients at month end · hover or focus a point for its denominator</p>
          </div>
        </div>
        <div className="chartWrap">
          <LineChart period={period} />
        </div>
      </section>
    </>
  );
}

/* --------------------------------------------------------------- access */

const ACCESS: Record<
  Period,
  {
    median: number;
    referrals: number;
    within48: number;
    added: number;
    buckets: readonly number[];
    prior: string;
  }
> = {
  "30d": {
    median: 11,
    referrals: 72,
    within48: 44,
    added: 21,
    buckets: [14, 15, 12, 6],
    prior: "↑3 vs last month",
  },
  "90d": {
    median: 10,
    referrals: 214,
    within48: 139,
    added: 58,
    buckets: [48, 45, 34, 14],
    prior: "↑2 vs prior",
  },
  "12m": {
    median: 9,
    referrals: 846,
    within48: 575,
    added: 203,
    buckets: [224, 186, 128, 52],
    prior: "↑1 vs 2025",
  },
};

const BUCKETS = ["0–7", "8–14", "15–30", "30+"] as const;
const BUCKET_SEV = ["norm", "low", "high", "crit"] as const;

/* People referred, not yet patients — so not in the cohort. */
const WAITLIST: readonly {
  id: string;
  name: string;
  program: Program;
  source: string;
  days: number;
  referred: string;
}[] = [
  {
    id: "wl-ashworth",
    name: "N. Ashworth",
    program: "Adult depression",
    source: "Primary care",
    days: 34,
    referred: "10 Jul",
  },
  {
    id: "wl-brennan",
    name: "O. Brennan",
    program: "Perinatal",
    source: "Midwife",
    days: 27,
    referred: "17 Jul",
  },
  {
    id: "wl-delgado",
    name: "S. Delgado",
    program: "Anxiety",
    source: "Self-referral",
    days: 19,
    referred: "25 Jul",
  },
  {
    id: "wl-fischer",
    name: "M. Fischer",
    program: "Young adult",
    source: "Campus health",
    days: 12,
    referred: "01 Aug",
  },
  {
    id: "wl-halvorsen",
    name: "R. Halvorsen",
    program: "Adult depression",
    source: "Emergency dept",
    days: 9,
    referred: "04 Aug",
  },
  {
    id: "wl-okafor",
    name: "C. Okafor",
    program: "Anxiety",
    source: "Primary care",
    days: 4,
    referred: "09 Aug",
  },
];
const WAITING_NOW = 18;

function Access({ period }: { period: Period }) {
  const { go, toast } = useNav();
  const a = ACCESS[period];
  const seen = a.buckets.reduce((s, v) => s + v, 0);
  const top = Math.max(...a.buckets);

  return (
    <>
      <div className="tiles">
        <Tile
          cap="First appointment"
          status={a.median > 7 ? "above target" : "on target"}
          sev={a.median > 7 ? "high" : "norm"}
          n={String(a.median)}
          unit="days, median"
          bar={
            <BarTarget
              pct={(a.median / 15) * 100}
              target={(7 / 15) * 100}
              sev={a.median > 7 ? "high" : "norm"}
            />
          }
          footLeft="target 7d"
          footRight={a.prior}
        />
        <Tile
          cap="Referrals"
          status="received"
          sev="low"
          n={String(a.referrals)}
          unit={`${seen} seen so far`}
          bar={<BarShare pct={(seen / a.referrals) * 100} sev="low" />}
          footLeft={`${pct(seen, a.referrals)}% reached S1`}
          footRight="all sources"
        />
        <Tile
          cap="Waitlist"
          status="waiting now"
          sev="high"
          n={String(WAITING_NOW)}
          unit="people"
          bar={<BarShare pct={(WAITING_NOW / 30) * 100} sev="high" />}
          footLeft="longest 34d"
          footRight={`${a.added} added`}
        />
        <Tile
          cap="First contact in 48h"
          status={pct(a.within48, a.referrals) >= 80 ? "on target" : "below target"}
          sev={pct(a.within48, a.referrals) >= 80 ? "norm" : "high"}
          n={`${pct(a.within48, a.referrals)}%`}
          unit={`${a.within48} of ${a.referrals}`}
          bar={<BarTarget pct={pct(a.within48, a.referrals)} target={80} sev="high" />}
          footLeft="any channel"
          footRight="target 80%"
        />
      </div>

      <div className="two">
        <section className="panel" aria-labelledby="rp-wait-h">
          <div className="panelTop">
            <div>
              <h3 id="rp-wait-h">Wait to first appointment</h3>
              <p>{seen} first appointments · days from referral</p>
            </div>
          </div>
          <div className="chartWrap grow">
            <div
              className="rp-cols"
              role="img"
              aria-label={`Wait to first appointment: ${BUCKETS.map((b, i) => `${b} days ${a.buckets[i]}`).join(", ")}. Target 7 days.`}
            >
              {BUCKETS.map((b, i) => (
                <div key={b} className="rp-col">
                  <span className="rp-colV mono">{a.buckets[i]}</span>
                  <span className="rp-colTrk">
                    <i
                      style={{
                        height: `${(a.buckets[i]! / top) * 100}%`,
                        background: `var(--${BUCKET_SEV[i]})`,
                      }}
                    />
                  </span>
                  <span className="rp-colK">{b} d</span>
                  <span className="rp-colP mono">{pct(a.buckets[i]!, seen)}%</span>
                  {i === 0 ? (
                    <span className="rp-target" aria-hidden="true">
                      <span>target 7d</span>
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <p className="miniLegend">
            {pct(a.buckets[0]!, seen)}% seen within the 7-day target · {pct(a.buckets[3]!, seen)}%
            waited over 30 days
          </p>
        </section>

        <section className="panel" aria-labelledby="rp-wl-h">
          <div className="panelTop">
            <div>
              <h3 id="rp-wl-h">Waitlist</h3>
              <p>
                Longest wait first · {WAITLIST.length} of {WAITING_NOW} shown
              </p>
            </div>
            <button
              type="button"
              className="seeAll linkBtn"
              onClick={() => toast("Full waitlist exported to intake team")}
            >
              Send list to intake
            </button>
          </div>
          <div className="dtScroll grow rp-wlWrap">
            <table className="dt rp-wl">
              <thead>
                <tr>
                  <th>Referral</th>
                  <th className="num">Waiting</th>
                  <th>Program</th>
                  <th className="num">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {WAITLIST.map((w) => {
                  const sev =
                    w.days > 30 ? "crit" : w.days > 14 ? "high" : w.days > 7 ? "low" : "norm";
                  return (
                    <tr key={w.id}>
                      <td>
                        <span className="rp-wlName">{w.name}</span>
                        <span className="rp-wlSub">
                          {w.source} · {w.referred}
                        </span>
                      </td>
                      <td className="num">
                        <span className="mono rp-days" style={{ color: `var(--${sev}-text)` }}>
                          {w.days}d
                        </span>
                      </td>
                      <td className="rp-wlProg">{w.program}</td>
                      <td className="num">
                        <button
                          type="button"
                          className="btn ghost sm"
                          aria-label={`Book first appointment for ${w.name}`}
                          onClick={() => go({ screen: "schedule" })}
                        >
                          Book
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

/* ----------------------------------------------------------- engagement */

const FUNNEL: Record<Period, readonly { label: string; count: number }[]> = {
  "30d": [
    { label: "Referred", count: 72 },
    { label: "First contact", count: 58 },
    { label: "Session 1", count: 47 },
    { label: "Session 3", count: 26 },
  ],
  "90d": [
    { label: "Referred", count: 214 },
    { label: "First contact", count: 173 },
    { label: "Session 1", count: 141 },
    { label: "Session 3", count: 79 },
  ],
  "12m": [
    { label: "Referred", count: 846 },
    { label: "First contact", count: 702 },
    { label: "Session 1", count: 590 },
    { label: "Session 3", count: 352 },
  ],
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const WEEKS: Record<Period, number> = { "30d": 4, "90d": 13, "12m": 52 };
const FACTOR: Record<Period, number> = { "30d": 1, "90d": 3, "12m": 11 };
const NO_SHOW: Record<Period, { tele: number; inPerson: number }> = {
  "30d": { tele: 0.062, inPerson: 0.119 },
  "90d": { tele: 0.068, inPerson: 0.124 },
  "12m": { tele: 0.071, inPerson: 0.116 },
};

function weeks(period: Period) {
  const n = WEEKS[period];
  const r = rng(n * 7919);
  const out: { label: string; booked: number; attended: number }[] = [];
  for (let i = 0; i < n; i += 1) {
    const booked = 58 + Math.floor(r() * 12);
    const rate = 0.8 + r() * 0.11;
    const d = new Date(Date.UTC(2026, 7, 10 - (n - 1 - i) * 7));
    const label = `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]}`;
    out.push({ label, booked, attended: Math.round(booked * rate) });
  }
  return out;
}

function modality(period: Period) {
  const sessions = (m: Patient["modality"]) =>
    ACTIVE.filter((e) => e.modality === m && e.sessions > 0).reduce(
      (s, e) => s + (e.cadence === "Weekly" ? 4 : 2),
      0,
    ) * FACTOR[period];
  const tele = sessions("Telehealth");
  const inPerson = sessions("In person");
  return [
    { label: "Telehealth", booked: tele, missed: Math.round(tele * NO_SHOW[period].tele) },
    {
      label: "In person",
      booked: inPerson,
      missed: Math.round(inPerson * NO_SHOW[period].inPerson),
    },
  ];
}

function Engagement({ period }: { period: Period }) {
  const steps = FUNNEL[period];
  const first = steps[0]!.count;
  const drops = steps.slice(1).map((s, i) => steps[i]!.count - s.count);
  const worst = Math.max(...drops);
  const wk = weeks(period);
  const booked = wk.reduce((s, w) => s + w.booked, 0);
  const attended = wk.reduce((s, w) => s + w.attended, 0);
  const mods = modality(period);
  const W = 520;
  const H = 120;
  const gap = wk.length > 20 ? 2 : 6;
  const bw = (W - gap * (wk.length - 1)) / wk.length;
  const y = (rate: number) => H - ((rate - 0.6) / 0.4) * H;
  const labelEvery = wk.length > 20 ? 13 : wk.length > 6 ? 3 : 1;

  return (
    <>
      <div className="two">
        <section className="panel" aria-labelledby="rp-fun-h">
          <div className="panelTop">
            <div>
              <h3 id="rp-fun-h">Engagement funnel</h3>
              <p>
                Referral to session three ·{" "}
                {PERIODS.find((p) => p.value === period)!.label.toLowerCase()}
              </p>
            </div>
          </div>
          <div className="chartWrap grow">
            {steps.map((step, i) => {
              const share = Math.round((step.count / first) * 100);
              const isWorst = i > 0 && drops[i - 1] === worst;
              return (
                <div key={step.label} className={`funRow${isWorst ? " worst" : ""}`}>
                  <span className="lbl">{step.label}</span>
                  <span className="cnt">{step.count}</span>
                  <span className="fbar">
                    <i style={{ width: `${share}%` }} />
                  </span>
                  <span className="pct">{share}%</span>
                </div>
              );
            })}
          </div>
          <p className="miniLegend">
            Largest loss is between session one and three: {worst} people.
          </p>
        </section>

        <section className="panel" aria-labelledby="rp-ns-h">
          <div className="panelTop">
            <div>
              <h3 id="rp-ns-h">No-show rate by modality</h3>
              <p>Missed without notice · booked sessions as denominator</p>
            </div>
          </div>
          <div className="chartWrap grow">
            {mods.map((m) => {
              const rate = (m.missed / m.booked) * 100;
              const sev = rate >= 10 ? "high" : "low";
              return (
                <div key={m.label} className="rp-ns">
                  <div className="rp-nsTop">
                    <b>{m.label}</b>
                    <span className="mono" style={{ color: `var(--${sev}-text)` }}>
                      {rate.toFixed(1)}%
                    </span>
                  </div>
                  <span className="rp-nsTrk" aria-hidden="true">
                    <i style={{ width: `${(rate / 20) * 100}%`, background: `var(--${sev})` }} />
                  </span>
                  <span className="rp-nsSub mono">
                    {m.missed} of {m.booked} booked
                  </span>
                </div>
              );
            })}
          </div>
          <p className="miniLegend">Scale 0–20% · in-person misses cluster on Monday mornings</p>
        </section>
      </div>

      <section className="panel" aria-labelledby="rp-att-h">
        <div className="panelTop">
          <div>
            <h3 id="rp-att-h">Attendance by week</h3>
            <p>
              {attended} of {booked} booked sessions attended · {pct(attended, booked)}%
            </p>
          </div>
        </div>
        <div className="chartWrap">
          <svg
            className="chart rp-att"
            viewBox={`0 -4 ${W} ${H + 24}`}
            role="img"
            aria-label={`Weekly attendance over ${wk.length} weeks, between ${Math.min(...wk.map((w) => pct(w.attended, w.booked)))}% and ${Math.max(...wk.map((w) => pct(w.attended, w.booked)))}%.`}
          >
            <line className="refline" x1="0" x2={W} y1={y(0.85)} y2={y(0.85)} />
            <text className="axis rp-axis" x={W} y={y(0.85) - 4} textAnchor="end">
              target 85%
            </text>
            {wk.map((w, i) => {
              const rate = w.attended / w.booked;
              const bx = i * (bw + gap);
              return (
                <g key={w.label}>
                  <rect
                    x={bx}
                    y={y(rate)}
                    width={bw}
                    height={H - y(rate)}
                    rx={Math.min(3, bw / 3)}
                    fill={
                      rate >= 0.85
                        ? "color-mix(in srgb, var(--norm) 70%, transparent)"
                        : "color-mix(in srgb, var(--high) 70%, transparent)"
                    }
                  >
                    <title>{`Week of ${w.label}: ${w.attended} of ${w.booked} attended`}</title>
                  </rect>
                  {i % labelEvery === 0 || i === wk.length - 1 ? (
                    <text className="axis rp-axis" x={bx + bw / 2} y={H + 16} textAnchor="middle">
                      {w.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>
        <p className="miniLegend">
          <span className="rp-key">
            <i style={{ background: "var(--norm)" }} aria-hidden="true" />
            At or above 85%
          </span>
          <span className="rp-key">
            <i style={{ background: "var(--high)" }} aria-hidden="true" />
            Below 85%
          </span>
          <span>Axis 60–100%</span>
        </p>
      </section>
    </>
  );
}

/* ----------------------------------------------------------- clinicians */

interface ClinRow {
  id: ClinicianId;
  name: string;
  caseload: number;
  measured: number;
  responding: number;
  notOnTrack: number;
  unsigned: number;
  sessions: number;
}

type SortKey = Exclude<keyof ClinRow, "id">;

function clinRows(period: Period): ClinRow[] {
  return CLIN_IDS.map((id) => {
    const eps = EPISODES[period].filter((e) => e.clinician === id);
    const inCare = eps.filter((e) => e.sessions > 0);
    const measured = eps.filter((e) => e.measures > 0);
    return {
      id,
      name: CLINICIANS[id].name,
      caseload: eps.filter((e) => e.active).length,
      measured: pct(inCare.filter((e) => e.every).length, inCare.length),
      responding: pct(measured.filter(isResp).length, measured.length),
      notOnTrack: eps.filter((e) => e.track === "not-on-track").length,
      unsigned: UNSIGNED[id].count,
      sessions: median(inCare.map((e) => e.sessions)),
    };
  });
}

const COLS: readonly { key: SortKey; label: string; num: boolean }[] = [
  { key: "name", label: "Clinician", num: false },
  { key: "caseload", label: "Caseload", num: true },
  { key: "measured", label: "Measured", num: true },
  { key: "responding", label: "Responding", num: true },
  { key: "notOnTrack", label: "Not on track", num: true },
  { key: "unsigned", label: "Notes >48h", num: true },
  { key: "sessions", label: "Median sessions", num: true },
];

function sortRows(rows: ClinRow[], key: SortKey, dir: "ascending" | "descending"): ClinRow[] {
  const k = dir === "ascending" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    const d =
      typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb));
    return d * k;
  });
}

function Clinicians({
  period,
  sort,
  onSort,
}: {
  period: Period;
  sort: { key: SortKey; dir: "ascending" | "descending" };
  onSort: (key: SortKey) => void;
}) {
  const { go, toast } = useNav();
  const [open, setOpen] = React.useState<ClinicianId | null>(null);
  const rows = sortRows(clinRows(period), sort.key, sort.dir);
  const sel = open ? clinRows(period).find((r) => r.id === open)! : null;
  const selEps = open ? EPISODES[period].filter((e) => e.clinician === open) : [];
  const selNot = open
    ? PATIENTS.filter((p) => p.clinician === open && p.track === "not-on-track")
    : [];

  return (
    <section className="panel" aria-labelledby="rp-cl-h">
      <div className="panelTop">
        <div>
          <h3 id="rp-cl-h">By clinician</h3>
          <p>Caseload and notes are as of now; rates cover the period</p>
        </div>
      </div>
      <div className="dtScroll">
        <table className="dt rp-cl">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className={c.num ? "num" : undefined}
                  {...(sort.key === c.key ? { "aria-sort": sort.dir } : {})}
                >
                  <button type="button" className="sort" onClick={() => onSort(c.key)}>
                    {c.label}
                    <span aria-hidden="true" className="rp-sortIc">
                      {sort.key === c.key ? (sort.dir === "ascending" ? "↑" : "↓") : "↕"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <button type="button" className="rp-clBtn" onClick={() => setOpen(r.id)}>
                    <ClinicianAvatar id={r.id} size={24} />
                    <span className="rp-clText">
                      <span className="rp-clName">{r.name}</span>
                      <span className="rp-clRole">{CLINICIANS[r.id].role}</span>
                    </span>
                  </button>
                </td>
                <td className="num mono">{r.caseload}</td>
                <td className="num mono">
                  <span style={{ color: r.measured < 90 ? "var(--high-text)" : undefined }}>
                    {r.measured}%
                  </span>
                </td>
                <td className="num mono">{r.responding}%</td>
                <td className="num mono">
                  <span style={{ color: r.notOnTrack > 0 ? "var(--crit-text)" : undefined }}>
                    {r.notOnTrack}
                  </span>
                </td>
                <td className="num mono">
                  <span style={{ color: r.unsigned > 0 ? "var(--high-text)" : undefined }}>
                    {r.unsigned}
                  </span>
                </td>
                <td className="num mono">{r.sessions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="miniLegend">
        {rows.reduce((s, r) => s + r.unsigned, 0)} notes unsigned over 48h across{" "}
        {rows.filter((r) => r.unsigned > 0).length} clinicians · select a name for the breakdown
      </p>

      <Sheet
        open={sel !== null}
        onClose={() => setOpen(null)}
        title={sel?.name ?? ""}
        sub={
          sel
            ? `${CLINICIANS[sel.id].role} · ${PERIODS.find((p) => p.value === period)!.label.toLowerCase()}`
            : undefined
        }
        footer={
          sel ? (
            <>
              {sel.unsigned > 0 ? (
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => toast(`Reminder sent to ${CLINICIANS[sel.id].short}`)}
                >
                  Remind about notes
                </button>
              ) : null}
              <button
                type="button"
                className="btn primary"
                onClick={() => go({ screen: "caseload" })}
              >
                Open caseload
              </button>
            </>
          ) : null
        }
      >
        {sel ? (
          <>
            <section className="sheetSection">
              <h4>Summary</h4>
              <KV k="Active caseload">
                <span className="mono">{sel.caseload}</span>
              </KV>
              <KV k="Measured every session">
                <span className="mono">{sel.measured}%</span>
              </KV>
              <KV k="Responding">
                <span className="mono">{sel.responding}%</span>
              </KV>
              <KV k="Median sessions">
                <span className="mono">{sel.sessions}</span>
              </KV>
              <KV k="Notes unsigned over 48h">
                <span className="mono">
                  {sel.unsigned}
                  {sel.unsigned > 0 ? ` · oldest ${UNSIGNED[sel.id].oldest}` : ""}
                </span>
              </KV>
            </section>
            <section className="sheetSection">
              <h4>By status</h4>
              <div className="rp-mix" aria-hidden="true">
                {(["not-on-track", "slow", "responding", "remission", "baseline"] as const).map(
                  (t) => {
                    const n = selEps.filter((e) => e.track === t).length;
                    return n ? (
                      <i
                        key={t}
                        style={{
                          flexGrow: n,
                          background: `var(--${TRACK[t].sev})`,
                          opacity: t === "remission" ? 0.6 : 1,
                        }}
                      />
                    ) : null;
                  },
                )}
              </div>
              {(["not-on-track", "slow", "responding", "remission", "baseline"] as const).map(
                (t) => (
                  <KV key={t} k={TRACK[t].label.replace(/^./, (c) => c.toUpperCase())}>
                    <span className="mono">{selEps.filter((e) => e.track === t).length}</span>
                  </KV>
                ),
              )}
            </section>
            <section className="sheetSection">
              <h4>Not on track now</h4>
              {selNot.length ? (
                <ul className="rp-notList">
                  {selNot.map((p) => (
                    <li key={p.id}>
                      <PatientLink p={p} sub={`${p.program} · session ${p.sessions}`} />
                      <Status sev="crit">not on track</Status>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rp-none">No patients off track.</p>
              )}
            </section>
          </>
        ) : null}
      </Sheet>
    </section>
  );
}

/* ---------------------------------------------------------------- screen */

export function ReportsScreen() {
  const { route, toast } = useNav();
  const [period, setPeriod] = React.useState<Period>("30d");
  const [tab, setTab] = React.useState<Tab>(() =>
    TABS.some((t) => t.value === route.view) ? (route.view as Tab) : "outcomes",
  );
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "ascending" | "descending" }>({
    key: "notOnTrack",
    dir: "descending",
  });

  const onSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "ascending" ? "descending" : "ascending" }
        : { key, dir: key === "name" ? "ascending" : "descending" },
    );

  const exportCsv = () => {
    let rows: (string | number)[][];
    if (tab === "outcomes") {
      rows = [
        [
          "Program",
          "Episodes (n)",
          "Responding",
          "Response %",
          "Remission",
          "Remission %",
          "Small sample",
        ],
        ...programRows(period).map((r) => [
          r.program,
          r.n,
          r.resp,
          pct(r.resp, r.n),
          r.rem,
          pct(r.rem, r.n),
          r.small ? "yes" : "no",
        ]),
      ];
    } else if (tab === "access") {
      rows = [
        ["Referral", "Program", "Source", "Referred", "Days waiting"],
        ...WAITLIST.map((w) => [w.name, w.program, w.source, w.referred, w.days]),
      ];
    } else if (tab === "engagement") {
      rows = [
        ["Week of", "Booked", "Attended", "Attendance %"],
        ...weeks(period).map((w) => [w.label, w.booked, w.attended, pct(w.attended, w.booked)]),
      ];
    } else {
      rows = [
        [
          "Clinician",
          "Caseload",
          "Measured %",
          "Responding %",
          "Not on track",
          "Notes unsigned >48h",
          "Median sessions",
        ],
        ...sortRows(clinRows(period), sort.key, sort.dir).map((r) => [
          r.name,
          r.caseload,
          r.measured,
          r.responding,
          r.notOnTrack,
          r.unsigned,
          r.sessions,
        ]),
      ];
    }
    const name = `northwind-${tab}-${period}.csv`;
    download(name, rows);
    toast(`Exported ${name} · ${rows.length - 1} rows`);
  };

  return (
    <>
      <ScreenHead
        title="Reports"
        sub="Measurement-based care · Northwind Health"
        actions={
          <>
            <Segmented
              label="Reporting period"
              options={PERIODS}
              value={period}
              onChange={setPeriod}
            />
            <button type="button" className="btn ghost" onClick={exportCsv}>
              <Download aria-hidden="true" size={14} strokeWidth={1.7} />
              Export CSV
            </button>
          </>
        }
      />
      <div className="rp-tabs">
        <Tabs idBase="rp" label="Report" tabs={TABS} value={tab} onChange={setTab} />
      </div>
      <ScreenBody className="rp-body">
        <TabPanel idBase="rp" value={tab}>
          <div className="rp-panel">
            {tab === "outcomes" ? <Outcomes period={period} /> : null}
            {tab === "access" ? <Access period={period} /> : null}
            {tab === "engagement" ? <Engagement period={period} /> : null}
            {tab === "clinicians" ? (
              <Clinicians period={period} sort={sort} onSort={onSort} />
            ) : null}
          </div>
        </TabPanel>
      </ScreenBody>
    </>
  );
}
