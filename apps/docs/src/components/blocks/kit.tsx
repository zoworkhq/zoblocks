"use client";

/**
 * The parts every showcase block is built from.
 *
 * These are not library components and must never be mistaken for them. The
 * library's components live in `packages/*` and ship to customers; these are
 * the chrome a block needs to look like an application — a rail, a tile, a
 * panel — so that the real components can be seen doing work inside something.
 * Keeping them here rather than in a package is the point: a showcase that
 * quietly grew its own component library would be showing you the wrong thing.
 */

import * as React from "react";

/* ------------------------------------------------------------------ rail */

const ICON: Record<string, React.ReactNode> = {
  Dashboard: (
    <>
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </>
  ),
  Caseload: <path d="M2 4h12M2 8h12M2 12h8" />,
  Schedule: (
    <>
      <rect x="1.8" y="3" width="12.4" height="11.2" rx="1.6" />
      <path d="M1.8 6.6h12.4M5 1.6v2.6M11 1.6v2.6" />
    </>
  ),
  Messages: (
    <>
      <rect x="1.6" y="3.2" width="12.8" height="9.6" rx="1.6" />
      <path d="M2.4 4.6L8 8.8l5.6-4.2" />
    </>
  ),
  Reports: (
    <>
      <path d="M3.4 1.8h6.2L12.6 5v9.2H3.4z" />
      <path d="M5.8 8.6h4.4M5.8 11h3" />
    </>
  ),
  Patients: (
    <>
      <circle cx="8" cy="5.2" r="2.7" />
      <path d="M2.9 14.2c0-2.8 2.3-4.6 5.1-4.6s5.1 1.8 5.1 4.6" />
    </>
  ),
  Instruments: (
    <>
      <path d="M2 12a6 6 0 1 1 12 0" />
      <path d="M8 12l3-3.4" />
      <circle cx="8" cy="12" r="1" />
    </>
  ),
  Safety: <path d="M8 1.8l5 2v4.3c0 3.2-2.1 5.4-5 6.1-2.9-.7-5-2.9-5-6.1V3.8z" />,
};

function Ic({ name }: { name: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON[name] ?? ICON.Caseload}
    </svg>
  );
}

export function OxMark() {
  return (
    <svg viewBox="0 0 28 16" className="h-4 w-7" aria-hidden="true">
      <line x1="8" y1="8" x2="20" y2="8" stroke="var(--site-oxygen)" strokeWidth="2.5" />
      <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

const NAV = ["Dashboard", "Caseload", "Schedule", "Messages", "Reports"] as const;
const CLINICAL = ["Patients", "Instruments", "Safety"] as const;

export function Rail({ active }: { active: string }) {
  return (
    <nav className="rail" aria-label="Application">
      <div className="railBrand">
        <OxMark />
        Northwind Health
      </div>
      {NAV.map((t) => (
        <div key={t} className="railItem" {...(t === active ? { "aria-current": "page" } : {})}>
          <Ic name={t} />
          {t}
        </div>
      ))}
      <p className="railGroup">Clinical</p>
      {CLINICAL.map((t) => (
        <div key={t} className="railItem" {...(t === active ? { "aria-current": "page" } : {})}>
          <Ic name={t} />
          {t}
        </div>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ bits */

export type Sev = "crit" | "high" | "low" | "norm" | "unk";

/** For rails, dots and marks — non-text, so 3:1 is the bar. */
export const sevVar = (s: Sev) => `var(--${s})`;
/** For words. The light-mode amber is 3.82:1 as text and must not be used raw. */
export const sevText = (s: Sev) => `var(--${s}-text)`;

export function Pill({
  sev,
  children,
  num,
}: {
  sev: Sev;
  children: React.ReactNode;
  num?: boolean;
}) {
  return <span className={`pill p-${sev}${num ? " num" : ""}`}>{children}</span>;
}

/** A status word, carried by a dot rather than a chip. */
export function Status({ sev, children }: { sev: Sev; children: React.ReactNode }) {
  return (
    <span className="stDot" style={{ color: sevText(sev) }}>
      {children}
    </span>
  );
}

export function SevRail({ sev, height = 22 }: { sev: Sev; height?: number }) {
  return (
    <span className="rail-sev" style={{ background: sevVar(sev), height }} aria-hidden="true" />
  );
}

/**
 * One tile, four rows, always the same four.
 *
 * Caption and status, then the figure, then a bar of fixed height, then a
 * footing. The earlier version let each little chart bring its own label row,
 * which is why a strip of four cards had its status and its footing sitting at
 * four different heights — any scale labels now go in the footing, which every
 * tile has whether it needs it or not.
 *
 * The proportion is drawn rather than described. A tile reading "7 of 68" that
 * does not render 7/68 is asking a clinician to do arithmetic between sessions.
 */
export function Tile({
  cap,
  status,
  sev,
  n,
  unit,
  bar,
  footLeft,
  footRight,
}: {
  cap: string;
  status: string;
  sev: Sev;
  n: string;
  unit: string;
  bar: React.ReactNode;
  footLeft: string;
  footRight: string;
}) {
  return (
    <div className="tile">
      <div className="tHead">
        <span className="cap">{cap}</span>
        <span className="stat" style={{ color: sevText(sev) }}>
          {status}
        </span>
      </div>
      <div className="fig">
        <span className="n">{n}</span>
        <span className="u">{unit}</span>
      </div>
      <div className="tBar">{bar}</div>
      <div className="tFoot">
        <span>{footLeft}</span>
        <span>{footRight}</span>
      </div>
    </div>
  );
}

/** A share of a whole, with quartile ticks so the eye can read the fraction. */
export function BarShare({ pct, sev }: { pct: number; sev: Sev }) {
  return (
    <div className="trk">
      <i style={{ ["--w" as string]: `${pct}%`, background: sevVar(sev) }} />
      <span className="trkTicks" />
    </div>
  );
}

/** A value against the target it is measured to, with the target marked. */
export function BarTarget({ pct, target, sev }: { pct: number; target: number; sev: Sev }) {
  return (
    <div className="trk">
      <i style={{ ["--w" as string]: `${pct}%`, background: sevVar(sev) }} />
      <span className="tgt" style={{ left: `${target}%` }} />
    </div>
  );
}

/**
 * An instrument reading: the score, where it sits on that instrument's own
 * range, the last six administrations, and when the next one is due.
 *
 * The scale is the instrument's, not a percentage. A PHQ-9 of 16 is 59% of the
 * way up a 0–27 scale, and rendering it as "59%" would be arithmetic nobody
 * asked for on a number clinicians read directly.
 */
export function Instrument({
  name,
  value,
  max,
  markPct,
  reading,
  sev,
  taken,
  due,
  points,
}: {
  name: string;
  value: string;
  max: string;
  markPct: number;
  reading: string;
  sev: Sev;
  taken: string;
  due: string;
  points: readonly number[];
}) {
  const pts = points
    .map((y, i) => `${((i * 150) / Math.max(1, points.length - 1)).toFixed(1)},${y}`)
    .join(" ");
  const last = points[points.length - 1] ?? 0;
  return (
    <div className="instr">
      <div className="instrTop">
        <span className="instrName">{name}</span>
        <Pill sev={sev}>{reading}</Pill>
      </div>
      <div className="instrVal">
        <span className="v">{value}</span>
        <span className="of">/ {max}</span>
      </div>
      <div className="scaleBar">
        <i className="scaleMark" style={{ left: `${markPct}%` }} />
      </div>
      <svg
        className="chart"
        viewBox="0 0 150 34"
        preserveAspectRatio="none"
        style={{ height: 34, marginTop: 8 }}
        aria-hidden="true"
      >
        <polyline
          className="draw"
          style={{ ["--len" as string]: "200", ["--dd" as string]: "200ms" }}
          points={pts}
          fill="none"
          stroke={sevVar(sev)}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="150" cy={last} r="2.6" fill={sevVar(sev)} />
      </svg>
      <div className="instrFoot">
        <span>{taken}</span>
        <span>{due}</span>
      </div>
    </div>
  );
}

export function ListRow({
  sev,
  title,
  code,
  meta,
  status,
  statusSev,
}: {
  sev: Sev;
  title: string;
  /** The identifier, and the only part of the line set in mono. */
  code?: string;
  meta: string;
  status: string;
  statusSev: Sev;
}) {
  return (
    <div className="lrow">
      <span className="bar3" style={{ background: sevVar(sev) }} aria-hidden="true" />
      <span className="t">{title}</span>
      <span className="st" style={{ color: sevText(statusSev) }}>
        {status}
      </span>
      <span className="m">
        {code ? (
          <>
            <span className="code">{code}</span>
            {" · "}
          </>
        ) : null}
        {meta}
      </span>
    </div>
  );
}

export function TlItem({
  when,
  sev,
  what,
  sub,
}: {
  when: string;
  sev: Sev;
  what: string;
  sub: string;
}) {
  return (
    <div className="tlItem">
      <div className="when">{when}</div>
      <div className="dotCell">
        <div className="tlDot" style={{ background: sevVar(sev) }} />
      </div>
      <div className="what">
        {what}
        <div className="sub2">{sub}</div>
      </div>
    </div>
  );
}

export function AttnRow({
  sev,
  text,
  who,
  clock,
}: {
  sev: Sev;
  text: string;
  who: string;
  clock: string;
}) {
  return (
    <div className="attnRow">
      <SevRail sev={sev} height={16} />
      <span className="txt" style={{ flex: 1, minWidth: 0 }}>
        {text}
      </span>
      <span className="who">{who}</span>
      <span className="clock" style={{ color: sevText(sev) }}>
        {clock}
      </span>
    </div>
  );
}

/**
 * A row in the risk queue.
 *
 * Four things, because that is what a shift plan needs: who, what happened,
 * how long is left, and how much of the window has already gone. A clock on
 * its own says there is a deadline without saying where in it you are — and
 * "19h" reads very differently on a 24-hour window than on a 72-hour one.
 */
export function RiskRow({
  sev,
  who,
  what,
  opened,
  owner,
  left,
  usedPct,
  windowLabel,
}: {
  sev: Sev;
  who: string;
  what: string;
  opened: string;
  owner: string;
  left: string;
  usedPct: number;
  windowLabel: string;
}) {
  return (
    <div className="riskRow">
      <span className="bar3" style={{ background: sevVar(sev) }} aria-hidden="true" />
      <div className="who2">{who}</div>
      <div className="left" style={{ color: sevText(sev) }}>
        {left}
      </div>
      <div className="meta2">
        {what} · opened {opened}
      </div>
      <div className="owner2">{owner}</div>
      <div className="win">
        <div className="winTrk">
          <i style={{ width: `${usedPct}%`, background: sevVar(sev) }} />
        </div>
        <div className="winLbl">
          <span>
            {usedPct}% of the {windowLabel} used
          </span>
          <span>{left} remaining</span>
        </div>
      </div>
    </div>
  );
}

/** A disclosure whose closed state still says what is inside it. */
export function AccItem({
  sev,
  title,
  summary,
  defaultOpen,
  children,
}: {
  sev: Sev;
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(Boolean(defaultOpen));
  return (
    <div className="accItem">
      <button type="button" className="accBtn" aria-expanded={open} onClick={() => setOpen(!open)}>
        <SevRail sev={sev} />
        <span className="caret" aria-hidden="true">
          ›
        </span>
        <span className="cw">
          <span className="t">{title}</span>
          <span className="s">{summary}</span>
        </span>
      </button>
      <div className="accBody" {...(open ? { "data-open": "" } : {})}>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function Seg({ options, initial = 0 }: { options: readonly string[]; initial?: number }) {
  const [i, setI] = React.useState(initial);
  return (
    <div className="seg">
      {options.map((o, n) => (
        <button key={o} type="button" aria-pressed={n === i} onClick={() => setI(n)}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function TabBar({ tabs }: { tabs: readonly string[] }) {
  const [i, setI] = React.useState(0);
  return (
    <div className="tabbar" role="tablist">
      {tabs.map((t, n) => (
        <button key={t} type="button" role="tab" aria-selected={n === i} onClick={() => setI(n)}>
          {t}
        </button>
      ))}
    </div>
  );
}
