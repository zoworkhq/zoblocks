"use client";

/**
 * Instruments — the validated measures the clinic sends, and who is due one.
 *
 * The library is drawn on each instrument's own range. A PHQ-9 band bar and a
 * PCL-5 band bar are different lengths of different things, and a shared
 * 0–100 scale would put the PCL-5 cut-off where a PHQ-9 reader expects
 * "moderate". Item lists are short paraphrases, never the published wording.
 */

import * as React from "react";
import { Send } from "lucide-react";
import {
  CLINICIANS,
  ME,
  PATIENTS,
  band,
  byAttention,
  latest,
  patient,
  type InstrumentCode,
  type Patient,
  type Sev,
} from "../data";
import { stamp, useNav } from "../shell";
import {
  Chips,
  EmptyState,
  Pager,
  PatientLink,
  ScreenBody,
  ScreenHead,
  Select,
  Sheet,
} from "../ui";
import { Pill } from "../../kit";

/* ------------------------------------------------------------ library */

type Code = "PHQ-9" | "GAD-7" | "C-SSRS" | "PCL-5" | "AUDIT-C" | "WSAS";

interface BandDef {
  from: number;
  to: number;
  label: string;
  sev: Sev;
  /** Share of the hue, so two adjacent bands of one severity still read apart. */
  tone: number;
  action: string;
}

interface Def {
  code: Code;
  name: string;
  items: number;
  minutes: number;
  /** Categorical instruments have no score range; their bands are drawn equal. */
  categorical?: boolean;
  min: number;
  max: number;
  bands: readonly BandDef[];
  cadence: string;
  inUse: number;
  auto: boolean;
  description: string;
  itemLabels: readonly string[];
}

const inUseOf = (code: InstrumentCode) => PATIENTS.filter((p) => p.instrument === code).length;

const LIBRARY: readonly Def[] = [
  {
    code: "PHQ-9",
    name: "Patient Health Questionnaire",
    items: 9,
    minutes: 3,
    min: 0,
    max: 27,
    bands: [
      {
        from: 0,
        to: 4,
        label: "Minimal",
        sev: "norm",
        tone: 55,
        action: "Continue; consider step-down",
      },
      {
        from: 5,
        to: 9,
        label: "Mild",
        sev: "low",
        tone: 55,
        action: "Watchful waiting; repeat at next session",
      },
      {
        from: 10,
        to: 14,
        label: "Moderate",
        sev: "high",
        tone: 55,
        action: "Active treatment; review plan",
      },
      {
        from: 15,
        to: 19,
        label: "Moderately severe",
        sev: "crit",
        tone: 45,
        action: "Treat actively; consider medication review",
      },
      {
        from: 20,
        to: 27,
        label: "Severe",
        sev: "crit",
        tone: 75,
        action: "Prompt psychiatry review; check safety",
      },
    ],
    cadence: "Every session",
    inUse: inUseOf("PHQ-9"),
    auto: true,
    description:
      "Depression severity over the last two weeks. The primary outcome measure for the adult depression, perinatal and young adult programs.",
    itemLabels: [
      "Low interest or pleasure",
      "Low mood or hopelessness",
      "Sleep problems",
      "Tiredness or low energy",
      "Appetite change",
      "Feeling a failure",
      "Trouble concentrating",
      "Slowed down or restless",
      "Thoughts of self-harm",
    ],
  },
  {
    code: "GAD-7",
    name: "Generalized Anxiety Disorder scale",
    items: 7,
    minutes: 2,
    min: 0,
    max: 21,
    bands: [
      {
        from: 0,
        to: 4,
        label: "Minimal",
        sev: "norm",
        tone: 55,
        action: "Continue; consider step-down",
      },
      {
        from: 5,
        to: 9,
        label: "Mild",
        sev: "low",
        tone: 55,
        action: "Monitor; repeat at next session",
      },
      {
        from: 10,
        to: 14,
        label: "Moderate",
        sev: "high",
        tone: 55,
        action: "Active treatment; review plan",
      },
      {
        from: 15,
        to: 21,
        label: "Severe",
        sev: "crit",
        tone: 70,
        action: "Intensify treatment; consider psychiatry",
      },
    ],
    cadence: "Every session",
    inUse: inUseOf("GAD-7"),
    auto: true,
    description:
      "Anxiety severity over the last two weeks. The primary outcome measure for the anxiety program.",
    itemLabels: [
      "Nervous or on edge",
      "Unable to stop worrying",
      "Worrying about many things",
      "Trouble relaxing",
      "Restlessness",
      "Irritability",
      "Sense that something awful may happen",
    ],
  },
  {
    code: "C-SSRS",
    name: "Columbia suicide severity screener",
    items: 6,
    minutes: 2,
    categorical: true,
    min: 0,
    max: 1,
    bands: [
      {
        from: 0,
        to: 0,
        label: "Negative",
        sev: "norm",
        tone: 55,
        action: "Document; rescreen on any flag",
      },
      {
        from: 1,
        to: 1,
        label: "Positive",
        sev: "crit",
        tone: 70,
        action: "Opens a 24h follow-up in the risk queue",
      },
    ],
    cadence: "Intake, and on any flag",
    inUse: 68,
    auto: false,
    description:
      "Suicide risk screen. A positive answer to any of the higher-risk items opens a 24-hour follow-up with the owning clinician.",
    itemLabels: [
      "Wish to be dead",
      "Active suicidal thoughts",
      "Thoughts of a method",
      "Intent to act",
      "Plan with intent",
      "Recent suicidal behaviour",
    ],
  },
  {
    code: "PCL-5",
    name: "PTSD checklist for DSM-5",
    items: 20,
    minutes: 8,
    min: 0,
    max: 80,
    bands: [
      {
        from: 0,
        to: 32,
        label: "Below threshold",
        sev: "norm",
        tone: 45,
        action: "No further PTSD assessment needed",
      },
      {
        from: 33,
        to: 80,
        label: "Probable PTSD",
        sev: "crit",
        tone: 60,
        action: "Confirm with a structured interview",
      },
    ],
    cadence: "Intake, then monthly",
    inUse: 9,
    auto: false,
    description:
      "Post-traumatic stress symptoms over the last month. Sent when trauma is noted at intake.",
    itemLabels: [
      "Intrusive memories",
      "Nightmares",
      "Flashbacks",
      "Upset at reminders",
      "Physical reactions to reminders",
      "Avoiding memories",
      "Avoiding external reminders",
      "Gaps in memory",
      "Strong negative beliefs",
      "Blame of self or others",
      "Persistent negative feelings",
      "Loss of interest",
      "Feeling distant from others",
      "Trouble feeling positive",
      "Irritability or anger",
      "Risk-taking",
      "Being on guard",
      "Easily startled",
      "Trouble concentrating",
      "Sleep problems",
    ],
  },
  {
    code: "AUDIT-C",
    name: "Alcohol use screen",
    items: 3,
    minutes: 1,
    min: 0,
    max: 12,
    bands: [
      { from: 0, to: 2, label: "Negative", sev: "norm", tone: 55, action: "No action" },
      {
        from: 3,
        to: 3,
        label: "Positive for women",
        sev: "high",
        tone: 55,
        action: "Brief intervention if female",
      },
      {
        from: 4,
        to: 12,
        label: "Positive",
        sev: "crit",
        tone: 60,
        action: "Brief intervention; full AUDIT",
      },
    ],
    cadence: "Intake, then every 6 months",
    inUse: 41,
    auto: false,
    description: "Short alcohol use screen. Positive at 3 or more for women and 4 or more for men.",
    itemLabels: ["How often you drink", "Drinks on a typical day", "How often six or more drinks"],
  },
  {
    code: "WSAS",
    name: "Work and social adjustment scale",
    items: 5,
    minutes: 2,
    min: 0,
    max: 40,
    bands: [
      {
        from: 0,
        to: 9,
        label: "Subclinical",
        sev: "norm",
        tone: 55,
        action: "No functional concern",
      },
      {
        from: 10,
        to: 19,
        label: "Significant impairment",
        sev: "high",
        tone: 55,
        action: "Add functional goals to plan",
      },
      {
        from: 20,
        to: 40,
        label: "Moderately severe or worse",
        sev: "crit",
        tone: 60,
        action: "Review goals; consider occupational support",
      },
    ],
    cadence: "Intake, then monthly",
    inUse: 22,
    auto: true,
    description:
      "How much symptoms get in the way of work, home and relationships. Used alongside the primary measure.",
    itemLabels: [
      "Ability to work",
      "Home management",
      "Social leisure",
      "Private leisure",
      "Close relationships",
    ],
  },
];

const CODES = LIBRARY.map((d) => d.code) as readonly string[];

function BandBar({ def }: { def: Def }) {
  const span = def.max - def.min + 1;
  const width = (b: BandDef) => (def.categorical ? 1 : b.to - b.from + 1);
  const at = (v: number) => ((v - def.min) / span) * 100;
  return (
    <div className="in-band">
      <div className="in-bandTrk" aria-hidden="true">
        {def.bands.map((b) => (
          <i
            key={b.label}
            style={{
              flexGrow: width(b),
              background: `color-mix(in srgb, var(--${b.sev}) ${b.tone}%, transparent)`,
            }}
          />
        ))}
      </div>
      {def.categorical ? (
        <div className="in-bandCats" aria-hidden="true">
          {def.bands.map((b) => (
            <span key={b.label}>{b.label}</span>
          ))}
        </div>
      ) : (
        <div className="in-bandTicks" aria-hidden="true">
          {def.bands.map((b, i) => (
            <span
              key={b.label}
              style={{ left: `${at(b.from)}%` }}
              className={i === 0 ? "first" : undefined}
            >
              {b.from}
            </span>
          ))}
          <span className="last" style={{ left: "100%" }}>
            {def.max}
          </span>
        </div>
      )}
      <span className="sr-only">
        Bands:{" "}
        {def.bands
          .map((b) => (def.categorical ? b.label : `${b.label} ${b.from}–${b.to}`))
          .join(", ")}
      </span>
    </div>
  );
}

function Switch({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className="in-switch"
      onClick={() => onChange(!on)}
    >
      <span className="in-switchTrk" aria-hidden="true">
        <span className="in-switchKnob" />
      </span>
      <span>{label}</span>
    </button>
  );
}

function LibraryCard({
  def,
  auto,
  onAuto,
  onOpen,
}: {
  def: Def;
  auto: boolean;
  onAuto: (on: boolean) => void;
  onOpen: () => void;
}) {
  const titleId = `in-card-${def.code}`;
  return (
    <article className="in-card" aria-labelledby={titleId}>
      <div className="in-cardMain">
        <div className="in-cardTop">
          <h4 id={titleId} className="in-code">
            {def.code}
          </h4>
          <span className="in-use">
            <span className="mono">{def.inUse}</span> in use
          </span>
        </div>
        <p className="in-name">{def.name}</p>
        <p className="in-meta">
          {def.items} items · {def.minutes} min ·{" "}
          {def.categorical ? "positive / negative" : `${def.min}–${def.max}`}
        </p>
        <BandBar def={def} />
        <p className="in-cadence">{def.cadence}</p>
        {/* Stretched over the card's upper part, so the heading stays a heading. */}
        <button type="button" className="in-cover" onClick={onOpen}>
          <span className="sr-only">Open {def.code} details</span>
        </button>
      </div>
      <div className="in-cardFoot">
        <Switch on={auto} onChange={onAuto} label="Auto-send before session" />
      </div>
    </article>
  );
}

function InstrumentSheet({ def, onClose }: { def: Def | null; onClose: () => void }) {
  const { store, patch, toast } = useNav();
  const mine = React.useMemo(
    () => PATIENTS.filter((p) => p.clinician === ME).sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const [to, setTo] = React.useState(mine[0]!.id);
  const sentTo = def ? store.sent[to]?.startsWith(def.code) : false;

  return (
    <Sheet
      open={def !== null}
      onClose={onClose}
      title={def ? `${def.code} · ${def.name}` : ""}
      sub={
        def
          ? `${def.items} items · about ${def.minutes} min · ${def.cadence.toLowerCase()}`
          : undefined
      }
      footer={
        def ? (
          <div className="in-sendRow">
            <Select
              label={`Send ${def.code} to patient`}
              value={to}
              onChange={setTo}
              options={mine.map((p) => ({ value: p.id, label: p.name }))}
            />
            <button
              type="button"
              className="btn primary"
              disabled={sentTo}
              onClick={() => {
                patch((s) => ({ ...s, sent: { ...s.sent, [to]: def.code } }));
                toast(`${def.code} sent to ${patient(to).name}`);
              }}
            >
              <Send aria-hidden="true" size={14} strokeWidth={1.7} />
              {sentTo ? "Sent" : "Send"}
            </button>
          </div>
        ) : null
      }
    >
      {def ? (
        <>
          <p className="in-desc">{def.description}</p>
          <section className="sheetSection">
            <h4>Scoring bands</h4>
            <div className="dtScroll">
              <table className="dt in-bandTable">
                <thead>
                  <tr>
                    <th>{def.categorical ? "Result" : "Score"}</th>
                    <th>Band</th>
                    <th>Clinical action</th>
                  </tr>
                </thead>
                <tbody>
                  {def.bands.map((b) => (
                    <tr key={b.label}>
                      <td className="mono">
                        {def.categorical ? "—" : b.from === b.to ? b.from : `${b.from}–${b.to}`}
                      </td>
                      <td>
                        <Pill sev={b.sev}>{b.label}</Pill>
                      </td>
                      <td>{b.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="sheetSection">
            <h4>Items · paraphrased</h4>
            <ol className="in-items">
              {def.itemLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ol>
          </section>
          <section className="sheetSection">
            <h4>Send to patient</h4>
            <p className="in-desc">
              Goes to the patient portal and must be completed before their next session. Your
              caseload only.
            </p>
          </section>
        </>
      ) : null}
    </Sheet>
  );
}

/* ------------------------------------------------------- due this week */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TODAY_UTC = Date.UTC(2026, 7, 13);

/** Days between a "27 Jul" label and the demo's today; null when there is no date. */
function daysAgo(label: string): number | null {
  const m = /^(\d{2}) (\w{3})$/.exec(label);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2]!);
  if (month < 0) return null;
  return Math.round((TODAY_UTC - Date.UTC(2026, month, Number(m[1]))) / 86_400_000);
}

const interval = (p: Patient) => (p.cadence === "Fortnightly" ? 14 : 7);

function when(p: Patient): number {
  const m = /(\d+) Aug (\d+):(\d+)/.exec(p.next);
  if (!m) return Number.MAX_SAFE_INTEGER;
  return Number(m[1]) * 1440 + Number(m[2]) * 60 + Number(m[3]);
}

/** A full interval since the last measure, or no baseline at all. */
function isDue(p: Patient): boolean {
  if (p.scores.length === 0) return true;
  const d = daysAgo(p.lastSeen);
  return d !== null && d >= interval(p);
}

/** A whole interval missed, or seen without a baseline ever being taken. */
function isOverdue(p: Patient): boolean {
  if (p.scores.length === 0) return p.sessions > 0;
  const d = daysAgo(p.lastSeen);
  return d !== null && d >= interval(p) * 2;
}

const DUE: readonly Patient[] = PATIENTS.filter(isDue).sort((a, b) => {
  const o = Number(isOverdue(b)) - Number(isOverdue(a));
  return o !== 0 ? o : when(a) - when(b);
});

type DueFilter = "all" | "mine" | "overdue";

function dueRows(filter: DueFilter): readonly Patient[] {
  return DUE.filter((p) =>
    filter === "mine" ? p.clinician === ME : filter === "overdue" ? isOverdue(p) : true,
  );
}
const PAGE = 8;

function DuePanel({ filter, setFilter }: { filter: DueFilter; setFilter: (f: DueFilter) => void }) {
  const { store, patch, toast } = useNav();
  const [page, setPage] = React.useState(0);

  const rows = dueRows(filter);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const at = Math.min(page, pages - 1);
  const shown = rows.slice(at * PAGE, (at + 1) * PAGE);

  const send = (p: Patient) => {
    patch((s) => ({ ...s, sent: { ...s.sent, [p.id]: p.instrument } }));
    toast(`${p.instrument} sent to ${p.name}`);
  };

  return (
    <section className="panel" aria-labelledby="in-due-h">
      <div className="panelTop">
        <div>
          <h3 id="in-due-h">Due this week</h3>
          <p>A week since the last measure, two in remission, or no baseline yet</p>
        </div>
        <Chips
          label="Filter due measures"
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(0);
          }}
          options={[
            { value: "all", label: "All", count: DUE.length },
            { value: "mine", label: "Mine", count: DUE.filter((p) => p.clinician === ME).length },
            { value: "overdue", label: "Overdue", count: DUE.filter(isOverdue).length },
          ]}
        />
      </div>
      {shown.length === 0 ? (
        <EmptyState title="Nothing due">No measures match this filter.</EmptyState>
      ) : (
        <div className="dtScroll">
          <table className="dt in-due">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Measure</th>
                <th>Last score</th>
                <th>Last taken</th>
                <th>Session</th>
                <th className="num">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => {
                const v = latest(p);
                const b = v === null ? null : band(p.instrument, v);
                const sent = store.sent[p.id]?.startsWith(p.instrument);
                const overdue = isOverdue(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <PatientLink p={p} sub={CLINICIANS[p.clinician].short} />
                    </td>
                    <td>
                      <span className="in-measure">{p.instrument}</span>
                      {v === null ? <span className="in-sub">intake</span> : null}
                    </td>
                    <td>
                      {b ? (
                        <span className="in-score">
                          <span className="mono">{v}</span>
                          <Pill sev={b.sev}>{b.label}</Pill>
                        </span>
                      ) : (
                        <Pill sev="unk">Baseline due</Pill>
                      )}
                    </td>
                    <td className="mono">{v === null ? "—" : p.lastSeen}</td>
                    <td>
                      {p.next === "—" ? (
                        <span className="in-none">None booked</span>
                      ) : (
                        <span className="mono">{p.next}</span>
                      )}
                      {overdue ? <span className="in-overdue">overdue</span> : null}
                    </td>
                    <td className="num">
                      {sent ? (
                        <span className="in-sent">Sent · {stamp()}</span>
                      ) : (
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => send(p)}
                          aria-label={`Send ${p.instrument} to ${p.name}`}
                        >
                          Send
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={at} pages={pages} onPage={setPage} total={rows.length} size={PAGE} />
    </section>
  );
}

/* ------------------------------------------------ recent administrations */

const RECENT: readonly Patient[] = PATIENTS.filter(
  (p) => p.scores.length >= 2 && daysAgo(p.lastSeen) !== null,
)
  .sort((a, b) => {
    const d = daysAgo(a.lastSeen)! - daysAgo(b.lastSeen)!;
    return d !== 0 ? d : byAttention(a, b);
  })
  .slice(0, 8);

function RecentPanel() {
  const { go } = useNav();
  return (
    <section className="panel" aria-labelledby="in-recent-h">
      <div className="panelTop">
        <div>
          <h3 id="in-recent-h">Recent administrations</h3>
          <p>Latest completed measures · change from the previous one</p>
        </div>
      </div>
      <ul className="in-recent">
        {RECENT.map((p) => {
          const v = latest(p)!;
          const prev = p.scores[p.scores.length - 2]!;
          const d = v - prev;
          const b = band(p.instrument, v);
          const change = d === 0 ? "no change" : d < 0 ? `↓ ${-d}` : `↑ ${d}`;
          const changeSev: Sev = d === 0 ? "unk" : d < 0 ? "norm" : "crit";
          return (
            <li key={p.id}>
              <button
                type="button"
                className="rowBtn in-recentRow"
                onClick={() => go({ screen: "record", patient: p.id, view: "measures" })}
              >
                <span className="in-recentWho">
                  <b>{p.name}</b>
                  <span>
                    {p.instrument} · {p.lastSeen}
                  </span>
                </span>
                <span className="mono in-recentV">{v}</span>
                <Pill sev={b.sev}>{b.label}</Pill>
                <span className="mono in-change" style={{ color: `var(--${changeSev}-text)` }}>
                  {change}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------------------------------------------------------------- screen */

export function InstrumentsScreen() {
  const { route, store, patch, toast } = useNav();
  const [open, setOpen] = React.useState<Code | null>(
    route.view && CODES.includes(route.view) ? (route.view as Code) : null,
  );
  const [auto, setAuto] = React.useState<Record<Code, boolean>>(
    () => Object.fromEntries(LIBRARY.map((d) => [d.code, d.auto])) as Record<Code, boolean>,
  );

  const [filter, setFilter] = React.useState<DueFilter>("mine");
  const unsent = dueRows(filter).filter((p) => !store.sent[p.id]?.startsWith(p.instrument));

  const sendAll = () => {
    patch((s) => {
      const sent = { ...s.sent };
      for (const p of unsent) sent[p.id] = p.instrument;
      return { ...s, sent };
    });
    toast(
      `${unsent.length} measure${unsent.length === 1 ? "" : "s"} sent · due before next session`,
    );
  };

  return (
    <>
      <ScreenHead
        title="Instruments"
        sub={`Validated measures in use · ${LIBRARY.length}`}
        actions={
          <button
            type="button"
            className="btn primary"
            disabled={unsent.length === 0}
            onClick={sendAll}
          >
            <Send aria-hidden="true" size={14} strokeWidth={1.7} />
            {unsent.length === 0 ? "All measures sent" : `Send measures due · ${unsent.length}`}
          </button>
        }
      />
      <ScreenBody className="in-body">
        <section aria-labelledby="in-lib-h">
          <h3 id="in-lib-h" className="sr-only">
            Library
          </h3>
          <div className="in-grid">
            {LIBRARY.map((def) => (
              <LibraryCard
                key={def.code}
                def={def}
                auto={auto[def.code]}
                onOpen={() => setOpen(def.code)}
                onAuto={(on) => {
                  setAuto((a) => ({ ...a, [def.code]: on }));
                  toast(
                    `${def.code} ${on ? "will auto-send" : "no longer auto-sends"} before sessions`,
                  );
                }}
              />
            ))}
          </div>
        </section>
        <DuePanel filter={filter} setFilter={setFilter} />
        <RecentPanel />
      </ScreenBody>
      <InstrumentSheet
        def={LIBRARY.find((d) => d.code === open) ?? null}
        onClose={() => setOpen(null)}
      />
    </>
  );
}
