"use client";

/**
 * Schedule — the week, the day, and what is due before the next session.
 *
 * The appointment book is state, not a constant: checking a patient in,
 * moving a session or booking a new one changes what every view on this
 * screen draws, so the grid, the agenda, the counts and the month all read
 * from the same list.
 */

import * as React from "react";
import { ChevronLeft, ChevronRight, Clock, Plus, ShieldAlert, Users, Video } from "lucide-react";
import {
  CLINICIANS,
  PATIENTS,
  RISKS,
  TRACK,
  band,
  dayLabel,
  latest,
  reading,
  type ClinicianId,
} from "../data";
import { Pill, Status } from "../../kit";
import { useNav, stamp } from "../shell";
import {
  EmptyState,
  KV,
  PatientLink,
  ScreenBody,
  ScreenHead,
  Segmented,
  Select,
  Sheet,
} from "../ui";
import {
  APPOINTMENTS,
  DAY_END,
  DAY_START,
  NOW_MIN,
  STATUS,
  TYPES,
  clinicianShort,
  dayName,
  dayShort,
  dueLabel,
  freeSlots,
  hhmm,
  isPast,
  isWeekend,
  measureFor,
  mondayOf,
  nextWeekday,
  patientOf,
  riskFor,
  span,
  weekRange,
  type Appt,
  type ApptType,
  type Modality,
} from "./schedule-data";

type Filter = ClinicianId | "all";
type Mode = "day" | "week";

const HOUR = 64;
const MIN_VISUAL = 22;
const THIS_WEEK = mondayOf(0);
const OKONKWO_RISK = "rk-okonkwo-cssrs";
/** Block names for lanes too narrow for the word: three lanes, then four. */
const BLOCK_SUB: Partial<Record<ApptType, string>> = {
  admin: "Protected time",
  supervision: "Weekly supervision",
  group: "8 enrolled · Room 2",
};
const BLOCK_ABBR: Partial<Record<ApptType, [string, string]>> = {
  admin: ["Admin", "Adm"],
  supervision: ["Sup.", "Sup"],
  group: ["Group", "Grp"],
};

const FILTERS: readonly { value: Filter; label: string }[] = [
  { value: "lake", label: "My schedule" },
  { value: "tash", label: CLINICIANS.tash.short },
  { value: "osei", label: CLINICIANS.osei.short },
  { value: "brandt", label: CLINICIANS.brandt.short },
  { value: "all", label: "All clinicians" },
];

const MODES = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
] as const;

const BOOK_DAYS = [0, 1, 4, 5, 6, 7, 8];
const CANCEL_REASONS = [
  "Patient request",
  "Clinician unavailable",
  "Patient unwell",
  "Transport or weather",
] as const;

const shows = (f: Filter) => (a: Appt) => f === "all" || a.clinician === f;
const nameOf = (a: Appt) => patientOf(a)?.name ?? a.title ?? "";
const typeClass = (a: Appt) => `t-${a.type}`;

/** A risk flag is only a flag while its item is open. */
function useOpenRisk() {
  const { store } = useNav();
  return React.useCallback(
    (a: Appt) => {
      if (!a.patient || !a.risk) return null;
      const r = riskFor(a.patient);
      return r && !store.resolved[r.id] ? r : null;
    },
    [store.resolved],
  );
}

/* ------------------------------------------------------------- layout */

/** Side-by-side lanes for events that overlap in time. */
function lanes(list: readonly Appt[]): Map<string, { lane: number; of: number }> {
  const sorted = [...list].sort((a, b) => a.start - b.start || b.minutes - a.minutes);
  const out = new Map<string, { lane: number; of: number }>();
  let group: { id: string; lane: number }[] = [];
  let ends: number[] = [];
  let groupEnd = -1;
  const flush = () => {
    for (const g of group) out.set(g.id, { lane: g.lane, of: ends.length });
    group = [];
    ends = [];
  };
  for (const a of sorted) {
    const end = a.start + Math.max(a.minutes, MIN_VISUAL);
    if (a.start >= groupEnd) {
      flush();
      groupEnd = -1;
    }
    let lane = ends.findIndex((e) => e <= a.start);
    if (lane < 0) {
      lane = ends.length;
      ends.push(end);
    } else ends[lane] = end;
    group.push({ id: a.id, lane });
    groupEnd = Math.max(groupEnd, end);
  }
  flush();
  return out;
}

function describe(a: Appt, risky: boolean): string {
  if (!a.patient) {
    return [
      a.title,
      `${hhmm(a.start)} to ${hhmm(a.start + a.minutes)}`,
      isPast(a) ? "Done" : "Upcoming",
    ].join(", ");
  }
  const bits = [
    nameOf(a),
    TYPES[a.type].label,
    `${hhmm(a.start)} to ${hhmm(a.start + a.minutes)}`,
    STATUS[a.status].label,
  ];
  if (a.patient) bits.push(a.modality);
  if (a.measureDue && a.status !== "cancelled") bits.push(a.measureDue);
  if (risky) bits.push("risk flag");
  return bits.join(", ");
}

/* ----------------------------------------------------------- week grid */

function WeekGrid({
  monday,
  list,
  filter,
  highlight,
  showTask,
  onOpen,
  onDay,
}: {
  monday: number;
  list: readonly Appt[];
  filter: Filter;
  highlight: string | null;
  showTask: boolean;
  onOpen: (id: string) => void;
  onDay: (day: number) => void;
}) {
  const { go, store } = useNav();
  const openRisk = useOpenRisk();
  const days = [0, 1, 2, 3, 4].map((i) => monday + i);
  const hours = Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, i) => DAY_START + i * 60);
  const risk = RISKS.find((r) => r.id === OKONKWO_RISK)!;

  return (
    <div className="sc-gridScroll">
      <div
        className={`sc-grid${filter === "all" ? " is-all" : ""}`}
        style={{ "--sc-hour": `${HOUR}px` } as React.CSSProperties}
      >
        <div className="sc-gh">
          <span className="sc-gutter" aria-hidden="true" />
          {days.map((d) => {
            const n = list.filter(
              (a) => a.day === d && a.patient && a.status !== "cancelled" && shows(filter)(a),
            ).length;
            return (
              <button
                key={d}
                type="button"
                className="sc-dh"
                {...(d === 0 ? { "aria-current": "date" as const } : {})}
                onClick={() => onDay(d)}
                aria-label={`${dayName(d)}, ${n} sessions. Open day`}
              >
                <span className="sc-dhWd">{dayShort(d)}</span>
                <span className="sc-dhN mono">{dayName(d).slice(4, 6)}</span>
                <span className="sc-dhCount">{n ? `${n} sessions` : "—"}</span>
              </button>
            );
          })}
        </div>

        {showTask ? (
          <div className="sc-tasks">
            <span className="sc-gutter sc-tasksLabel">Due</span>
            {days.map((d) => (
              <div key={d} className="sc-taskCell">
                {d === 0 ? (
                  <button
                    type="button"
                    className="sc-task"
                    aria-label={`Risk follow-up for R. Okonkwo, due by ${dueLabel(risk)}`}
                    onClick={() => go({ screen: "safety", view: OKONKWO_RISK })}
                  >
                    <ShieldAlert aria-hidden="true" size={12} strokeWidth={1.9} />
                    <span>
                      <b className="mono">{dueLabel(risk)}</b>
                      <span className="sc-taskWho"> · R. Okonkwo</span>
                    </span>
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="sc-gb">
          <div className="sc-gutter sc-hours" aria-hidden="true">
            {/* An hour label within 20 minutes of the now tag would sit under it. */}
            {hours
              .filter((h) => monday !== THIS_WEEK || Math.abs(h - NOW_MIN) > 20)
              .map((h) => (
                <span key={h} style={{ top: ((h - DAY_START) / 60) * HOUR }}>
                  {hhmm(h)}
                </span>
              ))}
            {monday === THIS_WEEK ? (
              <span className="sc-nowTag" style={{ top: ((NOW_MIN - DAY_START) / 60) * HOUR }}>
                {hhmm(NOW_MIN)}
              </span>
            ) : null}
          </div>
          {days.map((d) => {
            const all = list.filter((a) => a.day === d && shows(filter)(a));
            // A cancelled slot that has been rebooked gives way; the agenda still lists it.
            const events = all.filter(
              (a) =>
                a.status !== "cancelled" ||
                !all.some(
                  (b) =>
                    b.status !== "cancelled" &&
                    b.start < a.start + a.minutes &&
                    a.start < b.start + b.minutes,
                ),
            );
            const pos = lanes(events);
            return (
              <div
                key={d}
                className={`sc-col${d === 0 ? " is-today" : ""}`}
                role="group"
                aria-label={dayName(d)}
              >
                {d === 0 ? (
                  <div className="sc-now" style={{ top: ((NOW_MIN - DAY_START) / 60) * HOUR }}>
                    <span className="sr-only">Now, {hhmm(NOW_MIN)}</span>
                  </div>
                ) : null}
                {events.map((a) => {
                  const p = pos.get(a.id) ?? { lane: 0, of: 1 };
                  const top = ((a.start - DAY_START) / 60) * HOUR;
                  const height = (Math.max(a.minutes, MIN_VISUAL) / 60) * HOUR - 2;
                  const r = openRisk(a);
                  const short = a.minutes <= 30;
                  const pt = patientOf(a);
                  const [head, tail] = (a.title ?? "").split(" · ");
                  const name = pt
                    ? p.of >= 3
                      ? pt.name.replace(/[^A-Z]/g, "")
                      : p.of === 2
                        ? pt.name.split(" ").slice(1).join(" ")
                        : pt.name
                    : p.of >= 3
                      ? BLOCK_ABBR[a.type]![p.of >= 4 ? 1 : 0]
                      : short && p.of === 1
                        ? a.title
                        : head;
                  const live = a.status === "booked" || a.status === "checked-in";
                  // In a narrow lane the risk shield outranks the measure dot.
                  const due =
                    live &&
                    !!a.measureDue &&
                    !(pt && store.sent[pt.id]) &&
                    (p.of === 1 || (!r && p.of < 3));
                  const struck = a.status === "no-show" || a.status === "cancelled";
                  const cls = [
                    "sc-ev",
                    typeClass(a),
                    `s-${a.status}`,
                    pt ? "" : "is-block",
                    isPast(a) ? "is-past" : "",
                    a.id === highlight ? "is-hl" : "",
                    short ? "is-short" : "",
                    p.of >= 2 ? "is-narrow" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <button
                      key={a.id}
                      type="button"
                      className={cls}
                      data-appt={a.id}
                      aria-label={describe(a, !!r)}
                      title={describe(a, !!r)}
                      onClick={() => onOpen(a.id)}
                      style={{
                        top,
                        height,
                        left: `calc(${p.lane} * (100% - 4px) / ${p.of} + 2px)`,
                        width: `calc((100% - 4px) / ${p.of} - 2px)`,
                      }}
                    >
                      <span className="sc-evTop" aria-hidden="true">
                        {short && p.of === 1 ? (
                          <span className="mono sc-evT">{hhmm(a.start)}</span>
                        ) : null}
                        <span className="sc-evName">{name}</span>
                        {due ? <span className="sc-evDot" /> : null}
                        {r ? (
                          <ShieldAlert className="sc-evRisk" size={11} strokeWidth={2.2} />
                        ) : null}
                      </span>
                      {!short && p.of < 4 ? (
                        <span className="sc-evMeta mono" aria-hidden="true">
                          {hhmm(a.start)}
                          {p.of === 1 ? ` · ${a.minutes}m` : ""}
                          {p.of === 1 && filter === "all"
                            ? ` · ${CLINICIANS[a.clinician].initials}`
                            : ""}
                        </span>
                      ) : null}
                      {!short && p.of === 1 && a.minutes >= 45 && (struck || tail) ? (
                        <span className={`sc-evL3${struck ? " is-st" : ""}`} aria-hidden="true">
                          {struck ? STATUS[a.status].label : tail}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- agenda */

function Agenda({
  day,
  list,
  filter,
  highlight,
  showTask,
  onOpen,
}: {
  day: number;
  list: readonly Appt[];
  filter: Filter;
  highlight: string | null;
  showTask: boolean;
  onOpen: (id: string) => void;
}) {
  const { go, store } = useNav();
  const openRisk = useOpenRisk();
  const items = list.filter((a) => a.day === day && shows(filter)(a));
  const risk = RISKS.find((r) => r.id === OKONKWO_RISK)!;

  if (!items.length && !(showTask && day === 0)) {
    return (
      <EmptyState title={`Nothing booked on ${dayName(day)}`}>
        {isWeekend(day)
          ? "The clinic is closed at weekends."
          : "No sessions or blocks for this view."}
      </EmptyState>
    );
  }

  return (
    <ol className="sc-agenda">
      {showTask && day === 0 ? (
        <li className="sc-ag is-task">
          <div className="sc-agTime">
            <span className="mono">{dueLabel(risk)}</span>
            <span>due by</span>
          </div>
          <span className="sc-agRail t-risk" aria-hidden="true" />
          <div className="sc-agMain">
            <b>Risk follow-up · R. Okonkwo</b>
            <span>
              {risk.what} · {risk.left} left
            </span>
          </div>
          <div className="sc-agTags">
            <Status sev="crit">Task</Status>
          </div>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => go({ screen: "safety", view: OKONKWO_RISK })}
          >
            Open
          </button>
        </li>
      ) : null}
      {items.map((a) => {
        const p = patientOf(a);
        const r = openRisk(a);
        const sent = p ? store.sent[p.id] : undefined;
        return (
          <li
            key={a.id}
            data-appt={a.id}
            className={`sc-ag s-${a.status}${isPast(a) ? " is-past" : ""}${a.id === highlight ? " is-hl" : ""}`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("button")) return;
              onOpen(a.id);
            }}
          >
            <div className="sc-agTime">
              <span className="mono">{hhmm(a.start)}</span>
              <span>{a.minutes} min</span>
            </div>
            <span className={`sc-agRail ${typeClass(a)}`} aria-hidden="true" />
            <div className="sc-agMain">
              {p ? (
                <PatientLink
                  p={p}
                  size={22}
                  sub={
                    <>
                      <span className="sc-long">{TYPES[a.type].label}</span>
                      <span className="sc-short">{TYPES[a.type].short}</span>
                      {` · ${a.modality}${filter === "all" ? ` · ${clinicianShort(a.clinician)}` : ""}`}
                    </>
                  }
                />
              ) : (
                <div className="sc-agBlock">
                  <span className="sc-agIc" aria-hidden="true">
                    {a.type === "admin" ? (
                      <Clock size={12} strokeWidth={1.8} />
                    ) : (
                      <Users size={12} strokeWidth={1.8} />
                    )}
                  </span>
                  <span className="sc-agBlockText">
                    <b className="sc-agTitle">{a.title}</b>
                    <span>
                      {BLOCK_SUB[a.type]}
                      {filter === "all" ? ` · ${clinicianShort(a.clinician)}` : ""}
                    </span>
                  </span>
                </div>
              )}
            </div>
            <div className="sc-agTags">
              {r ? (
                <span className="sc-riskTag">
                  <ShieldAlert aria-hidden="true" size={12} strokeWidth={2} />
                  Risk
                </span>
              ) : null}
              {sent && a.measureDue ? (
                <Pill sev="norm">{sent} sent</Pill>
              ) : a.measureDue && a.status !== "cancelled" && a.status !== "completed" ? (
                <Pill sev="high">{a.measureDue}</Pill>
              ) : null}
              {p ? (
                <Status sev={STATUS[a.status].sev}>{STATUS[a.status].label}</Status>
              ) : (
                <Status sev={isPast(a) ? "unk" : "low"}>{isPast(a) ? "Done" : "Upcoming"}</Status>
              )}
            </div>
            <button
              type="button"
              className="iconBtn"
              aria-label={`Open ${hhmm(a.start)} ${nameOf(a)}`}
              onClick={() => onOpen(a.id)}
            >
              <ChevronRight aria-hidden="true" size={15} strokeWidth={1.7} />
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* --------------------------------------------------------- side column */

function TodayCard({
  list,
  filter,
  onOpen,
  onDay,
  showingToday,
}: {
  list: readonly Appt[];
  filter: Filter;
  onOpen: (id: string) => void;
  onDay: (day: number) => void;
  showingToday: boolean;
}) {
  const today = list.filter((a) => a.day === 0 && shows(filter)(a));
  const sessions = today.filter((a) => a.patient && a.status !== "cancelled");
  const done = sessions.filter((a) => a.status === "completed").length;
  const left = sessions.filter((a) => a.status === "booked" || a.status === "checked-in").length;
  const upcoming = today.filter((a) => !isPast(a) && a.status !== "cancelled");
  const shown = upcoming.slice(0, 6);

  return (
    <section className="card sc-card" aria-labelledby="sc-today">
      <div className="cardTop">
        <h3 id="sc-today">Today</h3>
        <span className="sc-cardSub">{dayName(0)}</span>
      </div>
      <dl className="sc-stats">
        <div>
          <dt>Booked</dt>
          <dd className="mono">{sessions.length}</dd>
        </div>
        <div>
          <dt>Completed</dt>
          <dd className="mono">{done}</dd>
        </div>
        <div>
          <dt>Remaining</dt>
          <dd className="mono">{left}</dd>
        </div>
      </dl>
      {shown.length ? (
        <ul className="sc-mini">
          {shown.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className={`rowBtn sc-miniRow s-${a.status}`}
                onClick={() => onOpen(a.id)}
              >
                <span className="mono sc-miniT">{hhmm(a.start)}</span>
                <span className={`sc-miniDot ${typeClass(a)}`} aria-hidden="true" />
                <span className="sc-miniName">{nameOf(a)}</span>
                <span className="sc-miniSt">
                  {a.status === "checked-in" || a.status === "no-show" || a.status === "cancelled"
                    ? STATUS[a.status].label
                    : filter === "all"
                      ? CLINICIANS[a.clinician].initials
                      : a.patient
                        ? TYPES[a.type].short
                        : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sc-quiet">Nothing left today.</p>
      )}
      {showingToday ? null : (
        <div className="sc-cardFoot sc-todayFoot">
          <button type="button" className="linkBtn" onClick={() => onDay(0)}>
            {upcoming.length > shown.length ? `All ${today.length} in day view` : "Open day view"}
          </button>
        </div>
      )}
    </section>
  );
}

function DueCard({ list, filter }: { list: readonly Appt[]; filter: Filter }) {
  const { go, store } = useNav();
  const owner: ClinicianId = filter === "all" ? "lake" : filter;
  const risk = RISKS.find(
    (r) => r.owner === owner && (r.kind === "cssrs" || r.kind === "crisis-call"),
  );
  const upcoming = list.find(
    (a) => a.clinician === owner && a.patient && !isPast(a) && a.status === "booked",
  );
  if (!risk) {
    return (
      <section className="card sc-card" aria-labelledby="sc-due">
        <div className="cardTop">
          <h3 id="sc-due">Due before your next session</h3>
        </div>
        <p className="sc-quiet">No time-boxed risk items for {CLINICIANS[owner].short}.</p>
      </section>
    );
  }
  const p = PATIENTS.find((x) => x.id === risk.patient)!;
  const closed = store.resolved[risk.id];
  return (
    <section className={`card sc-card sc-due${closed ? "" : " is-open"}`} aria-labelledby="sc-due">
      <div className="cardTop">
        <h3 id="sc-due">Due before your next session</h3>
      </div>
      <div className="sc-dueBody">
        <PatientLink p={p} size={28} sub={`${risk.what} · opened ${risk.opened}`} />
        {closed ? (
          <p className="sc-quiet">
            <Status sev="norm">Closed</Status> {closed}
          </p>
        ) : (
          <>
            <p className="sc-dueLine">
              <Status sev="crit">Follow-up due by {dueLabel(risk)}</Status>
              <span className="mono sc-dueLeft">{risk.left} left</span>
            </p>
            <div className="sc-dueBar" aria-hidden="true">
              <span style={{ width: `${risk.usedPct}%` }} />
            </div>
            <button
              type="button"
              className="btn primary sm"
              onClick={() => go({ screen: "safety", view: risk.id })}
            >
              Open safety item
            </button>
          </>
        )}
      </div>
      {upcoming ? (
        <div className="sc-cardFoot sc-quiet">
          Next session {hhmm(upcoming.start)} · {nameOf(upcoming)}
        </div>
      ) : null}
    </section>
  );
}

function MonthCard({
  list,
  filter,
  selected,
  onPick,
}: {
  list: readonly Appt[];
  filter: Filter;
  selected: number;
  onPick: (day: number) => void;
}) {
  // 1 Aug 2026 is a Saturday: five blank Monday-first cells lead.
  const first = 1 - 13;
  const cells: (number | null)[] = [...Array<null>(5).fill(null)];
  for (let d = 1; d <= 31; d += 1) cells.push(first + d - 1);
  while (cells.length % 7) cells.push(null);
  const counts = new Map<number, number>();
  for (const a of list)
    if (a.patient && a.status !== "cancelled" && shows(filter)(a))
      counts.set(a.day, (counts.get(a.day) ?? 0) + 1);

  return (
    <section className="card sc-card" aria-labelledby="sc-month">
      <div className="cardTop">
        <h3 id="sc-month">August 2026</h3>
        <span className="sc-cardSub">Pick a day</span>
      </div>
      <div className="sc-cal">
        {["M", "T", "W", "T", "F", "S", "S"].map((w, i) => (
          <span key={i} className="sc-calWd" aria-hidden="true">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={i} aria-hidden="true" />;
          const n = counts.get(d) ?? 0;
          const date = d + 13;
          if (isWeekend(d)) {
            return (
              <span key={i} className="sc-calDay is-weekend" aria-hidden="true">
                {date}
              </span>
            );
          }
          return (
            <button
              key={i}
              type="button"
              className={`sc-calDay${d === 0 ? " is-today" : ""}`}
              aria-pressed={d === selected}
              {...(d === 0 ? { "aria-current": "date" as const } : {})}
              aria-label={`${dayName(d)}, ${n ? `${n} sessions` : "nothing booked"}`}
              onClick={() => onPick(d)}
            >
              {date}
              {n ? <span className="sc-calDot" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- sheets */

function ApptSheet({
  appt,
  list,
  onClose,
  onOpen,
  onChange,
  onRebook,
  onFollowUp,
  onViewClinician,
}: {
  appt: Appt | null;
  list: readonly Appt[];
  onClose: () => void;
  onOpen: (id: string) => void;
  onChange: (id: string, patch: Partial<Appt>) => void;
  onRebook: (from: Appt, day: number, start: number) => void;
  onFollowUp: (patientId: string) => void;
  onViewClinician: (id: ClinicianId) => void;
}) {
  const { go, toast, store, patch } = useNav();
  const openRisk = useOpenRisk();
  const [panel, setPanel] = React.useState<"none" | "move" | "cancel">("none");
  const [reason, setReason] = React.useState<string>(CANCEL_REASONS[0]);
  const shownId = appt?.id;
  const [lastId, setLastId] = React.useState(shownId);
  if (lastId !== shownId) {
    setLastId(shownId);
    setPanel("none");
  }

  const a = appt;
  if (!a) {
    return (
      <Sheet open={false} onClose={onClose} title="Appointment">
        {null}
      </Sheet>
    );
  }

  const p = patientOf(a);
  const when = `${dayName(a.day)} · ${span(a)}`;

  if (!p) {
    const other: ClinicianId | null =
      a.type === "supervision" ? (a.clinician === "lake" ? "osei" : "lake") : null;
    const [head, tail] = (a.title ?? "").split(" · ");
    return (
      <Sheet
        open
        onClose={onClose}
        title={head}
        sub={when}
        footer={
          <>
            {other ? (
              <button type="button" className="btn ghost" onClick={() => onViewClinician(other)}>
                View {CLINICIANS[other].short}’s week
              </button>
            ) : null}
            {a.type === "group" && !isPast(a) ? (
              <button
                type="button"
                className="btn ghost"
                onClick={() => toast("Reminder sent to 8 group members")}
              >
                Remind group
              </button>
            ) : null}
            <button type="button" className="btn primary" onClick={onClose}>
              Done
            </button>
          </>
        }
      >
        <div className="sheetSection">
          <h4>Details</h4>
          {a.type === "supervision" ? <KV k="With">{CLINICIANS[other!].name}</KV> : null}
          {a.type === "admin" ? <KV k="Purpose">Notes and letters</KV> : null}
          {a.type === "group" ? <KV k="Programme">{tail}</KV> : null}
          <KV k="Clinician">{CLINICIANS[a.clinician].name}</KV>
          <KV k="Length">{a.minutes} min</KV>
          {a.type === "group" ? <KV k="Roster">8 enrolled · Room 2</KV> : null}
          <KV k="Status">
            <Status sev={isPast(a) ? "unk" : "low"}>{isPast(a) ? "Done" : "Upcoming"}</Status>
          </KV>
        </div>
        <p className="sc-quiet">
          {a.type === "admin"
            ? "Protected time. The booking form never offers it."
            : a.type === "supervision"
              ? "Held weekly. Both calendars show it."
              : "Runs weekly. Members book it through their clinician."}
        </p>
      </Sheet>
    );
  }

  const r = openRisk(a);
  const sent = store.sent[p.id];
  const today = a.day === 0;
  const live = a.status === "booked" || a.status === "checked-in";
  const tele = a.modality === "Telehealth";
  const code = p.instrument;
  const base = Math.max(a.day, 0);
  const moveDays = isWeekend(base) ? [nextWeekday(base)] : [base, nextWeekday(base)];
  const rebooking = a.status === "no-show" || a.status === "cancelled";
  const score = latest(p);
  const history = list.filter((x) => x.patient === p.id && x.id !== a.id).slice(0, 5);
  const track = TRACK[p.track];

  const startNote = () => {
    onClose();
    if (p.id === "okonkwo") go({ screen: "note", patient: "okonkwo" });
    else go({ screen: "record", patient: p.id, view: "notes" });
  };

  let footer: React.ReactNode;
  if (panel === "move") {
    footer = (
      <button type="button" className="btn ghost" onClick={() => setPanel("none")}>
        Back
      </button>
    );
  } else if (panel === "cancel") {
    footer = (
      <>
        <button type="button" className="btn ghost" onClick={() => setPanel("none")}>
          Keep it
        </button>
        <button
          type="button"
          className="btn danger sc-dangerBtn"
          onClick={() => {
            onChange(a.id, { status: "cancelled", reason });
            setPanel("none");
            toast(`Cancelled · ${p.name} ${hhmm(a.start)}`);
          }}
        >
          Cancel appointment
        </button>
      </>
    );
  } else if (a.status === "booked") {
    footer = (
      <>
        <button
          type="button"
          className="btn ghost sc-danger sc-footLead"
          onClick={() => setPanel("cancel")}
        >
          Cancel
        </button>
        {today ? (
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              onChange(a.id, { status: "no-show" });
              toast(`${p.name} marked no-show`);
            }}
          >
            No-show
          </button>
        ) : null}
        <button type="button" className="btn ghost" onClick={() => setPanel("move")}>
          Reschedule
        </button>
        {today ? (
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              onChange(a.id, { status: "checked-in" });
              toast(`${p.name} checked in · ${stamp(1)}`);
            }}
          >
            Check in
          </button>
        ) : (
          <button
            type="button"
            className="btn primary"
            onClick={() => toast(`Reminder sent to ${p.name}`)}
          >
            Send reminder
          </button>
        )}
      </>
    );
  } else if (a.status === "checked-in") {
    footer = (
      <>
        <button
          type="button"
          className="btn ghost sc-footLead"
          onClick={() => {
            onChange(a.id, { status: "booked" });
            toast(`Check-in undone · ${p.name}`);
          }}
        >
          Undo check-in
        </button>
        <button type="button" className="btn primary" onClick={startNote}>
          Start note
        </button>
      </>
    );
  } else if (a.status === "completed") {
    footer = (
      <>
        <button type="button" className="btn ghost" onClick={startNote}>
          Open notes
        </button>
        <button type="button" className="btn primary" onClick={() => onFollowUp(p.id)}>
          Book follow-up
        </button>
      </>
    );
  } else {
    footer = (
      <>
        {a.status === "no-show" ? (
          <button
            type="button"
            className="btn ghost"
            onClick={() => toast(`Outreach message sent to ${p.name}`)}
          >
            Message patient
          </button>
        ) : null}
        <button type="button" className="btn primary" onClick={() => setPanel("move")}>
          Rebook
        </button>
      </>
    );
  }

  return (
    <Sheet open onClose={onClose} title={TYPES[a.type].label} sub={when} footer={footer}>
      <div className="sc-ptRow">
        <PatientLink p={p} size={36} sub={`${p.program} · ${p.pronouns}`} />
        <Status sev={track.sev}>{track.label[0]!.toUpperCase() + track.label.slice(1)}</Status>
      </div>

      {panel === "move" ? (
        <div className="sheetSection">
          <h4>{rebooking ? "Rebook into" : "Move to"}</h4>
          {moveDays.map((d) => {
            const slots = freeSlots(
              list,
              a.clinician,
              d,
              a.minutes,
              rebooking ? undefined : a.id,
            ).filter((t) => rebooking || d !== a.day || t !== a.start);
            return (
              <div key={d} className="sc-slotDay">
                <p className="sc-slotLabel">
                  {dayName(d)}
                  <span>
                    {slots.length} free · {a.minutes} min
                  </span>
                </p>
                {slots.length ? (
                  <div className="sc-slots">
                    {slots.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="chip"
                        aria-label={`${rebooking ? "Rebook" : "Move"} to ${dayName(d)} ${hhmm(t)}`}
                        onClick={() => {
                          setPanel("none");
                          if (rebooking) onRebook(a, d, t);
                          else {
                            onChange(a.id, { day: d, start: t, status: "booked" });
                            toast(`Moved to ${dayName(d)} ${hhmm(t)}`);
                          }
                        }}
                      >
                        {hhmm(t)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="sc-quiet">{CLINICIANS[a.clinician].short} is fully booked.</p>
                )}
              </div>
            );
          })}
        </div>
      ) : panel === "cancel" ? (
        <div className="sheetSection">
          <h4>Cancel appointment</h4>
          <div className="field">
            <span aria-hidden="true">Reason</span>
            <Select
              label="Cancellation reason"
              value={reason}
              onChange={setReason}
              options={CANCEL_REASONS.map((x) => ({ value: x, label: x }))}
            />
          </div>
          <p className="sc-quiet sc-note">
            {p.name} is told by text. The slot goes back into {CLINICIANS[a.clinician].short}’s free
            time.
          </p>
        </div>
      ) : (
        <>
          <div className="sheetSection">
            <h4>Details</h4>
            <KV k="Status">
              <Status sev={STATUS[a.status].sev}>{STATUS[a.status].label}</Status>
              {a.reason ? <span className="sc-reason"> · {a.reason}</span> : null}
            </KV>
            <KV k="Modality">
              {a.modality}
              {live && tele ? (
                <>
                  {" · "}
                  <button
                    type="button"
                    className="linkBtn sc-rowAct"
                    onClick={() => toast(`Link sent to ${p.name}`)}
                  >
                    Send link
                  </button>
                </>
              ) : null}
            </KV>
            <KV k="Clinician">{CLINICIANS[a.clinician].name}</KV>
            <KV k="Measure">
              {sent ? (
                `${sent} sent`
              ) : live && a.measureDue ? (
                <>
                  {a.measureDue}
                  {" · "}
                  <button
                    type="button"
                    className="linkBtn sc-rowAct"
                    onClick={() => {
                      patch((s) => ({ ...s, sent: { ...s.sent, [p.id]: code } }));
                      toast(`${code} sent to ${p.name}`);
                    }}
                  >
                    Send {code}
                  </button>
                </>
              ) : (
                "None due"
              )}
            </KV>
            <KV k="Last score">
              {score === null
                ? "Awaiting baseline"
                : `${code} ${score} · ${band(code, score).label}`}
            </KV>
            {r ? (
              <KV k="Risk">
                <button
                  type="button"
                  className="linkBtn sc-riskLink"
                  onClick={() => go({ screen: "safety", view: r.id })}
                >
                  {r.what} · due {dueLabel(r)}
                </button>
              </KV>
            ) : null}
          </div>

          <div className="sheetSection">
            <h4>Other sessions, 03–21 Aug</h4>
            {history.length ? (
              <ul className="sc-hist">
                {history.map((x) => (
                  <li key={x.id}>
                    <button
                      type="button"
                      className="rowBtn sc-histRow"
                      onClick={() => onOpen(x.id)}
                    >
                      <span className="sc-histWhen">
                        {dayName(x.day)} · {hhmm(x.start)}
                      </span>
                      <span className="sc-histType">{TYPES[x.type].short}</span>
                      <Status sev={STATUS[x.status].sev}>{STATUS[x.status].label}</Status>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sc-quiet">None in the book.</p>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}

const PATIENT_OPTIONS = [...PATIENTS]
  .sort((a, b) => a.full.localeCompare(b.full))
  .map((p) => ({ value: p.id, label: `${p.full} · ${CLINICIANS[p.clinician].short}` }));

const TYPE_OPTIONS = (["individual", "intake", "med", "risk"] as const).map((t) => ({
  value: t,
  label: `${TYPES[t].label} · ${TYPES[t].minutes} min`,
}));

const MODALITIES = [
  { value: "In person", label: "In person" },
  { value: "Telehealth", label: "Telehealth" },
] as const;

function NewAppt({
  open,
  list,
  initialPatient,
  initialDay,
  onClose,
  onBook,
}: {
  open: boolean;
  list: readonly Appt[];
  initialPatient: string;
  initialDay: number;
  onClose: () => void;
  onBook: (a: Appt) => void;
}) {
  const first = PATIENTS.find((p) => p.id === initialPatient) ?? PATIENTS[0]!;
  const [pid, setPid] = React.useState(first.id);
  const [clin, setClin] = React.useState<ClinicianId>(first.clinician);
  const [type, setType] = React.useState<ApptType>(
    first.track === "baseline" ? "intake" : first.clinician === "tash" ? "med" : "individual",
  );
  const [day, setDay] = React.useState(BOOK_DAYS.includes(initialDay) ? initialDay : 0);
  const [time, setTime] = React.useState<number | null>(null);
  const [modality, setModality] = React.useState<Modality>(first.modality);

  const p = PATIENTS.find((x) => x.id === pid)!;
  const minutes = TYPES[type].minutes;
  const slots = freeSlots(list, clin, day, minutes);
  const start = time !== null && slots.includes(time) ? time : (slots[0] ?? null);

  const book = () => {
    if (start === null) return;
    onBook({
      id: "",
      patient: p.id,
      clinician: clin,
      day,
      start,
      minutes,
      type,
      modality,
      status: "booked",
      measureDue: measureFor(p, type, 1, true),
      risk: RISKS.some((r) => r.patient === p.id),
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New appointment"
      sub="Books into the clinician’s free time"
      footer={
        <>
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn primary" disabled={start === null} onClick={book}>
            Book appointment
          </button>
        </>
      }
    >
      <div className="sc-form">
        <div className="field">
          <span aria-hidden="true">Patient</span>
          <Select
            label="Patient"
            value={pid}
            options={PATIENT_OPTIONS}
            onChange={(v) => {
              const next = PATIENTS.find((x) => x.id === v)!;
              setPid(v);
              setClin(next.clinician);
              setModality(next.modality);
            }}
          />
        </div>
        <div className="field">
          <span aria-hidden="true">Clinician</span>
          <Select
            label="Clinician"
            value={clin}
            options={(Object.keys(CLINICIANS) as ClinicianId[]).map((c) => ({
              value: c,
              label: CLINICIANS[c].name,
            }))}
            onChange={setClin}
          />
        </div>
        <div className="field">
          <span aria-hidden="true">Type</span>
          <Select label="Appointment type" value={type} options={TYPE_OPTIONS} onChange={setType} />
        </div>
        <div className="sc-formRow">
          <div className="field">
            <span aria-hidden="true">Day</span>
            <Select
              label="Day"
              value={String(day)}
              options={BOOK_DAYS.map((d) => ({ value: String(d), label: dayName(d) }))}
              onChange={(v) => setDay(Number(v))}
            />
          </div>
          <div className="field">
            <span aria-hidden="true">Time</span>
            {start !== null ? (
              <Select
                label="Start time"
                value={String(start)}
                options={slots.map((t) => ({
                  value: String(t),
                  label: `${hhmm(t)}–${hhmm(t + minutes)}`,
                }))}
                onChange={(v) => setTime(Number(v))}
              />
            ) : (
              <span className="sc-noSlot">No free slots</span>
            )}
          </div>
        </div>
        <div className="field">
          <span aria-hidden="true">Modality</span>
          <Segmented
            label="Modality"
            options={MODALITIES}
            value={modality}
            onChange={setModality}
          />
        </div>
        <p className="sc-quiet">
          {slots.length} free {slots.length === 1 ? "slot" : "slots"} for {CLINICIANS[clin].short}{" "}
          on {dayName(day)}. Last score {reading(p)}.
        </p>
      </div>
    </Sheet>
  );
}

/* --------------------------------------------------------------- screen */

function bootFrom(patient?: string, view?: string): Appt | null {
  const byId = view ? APPOINTMENTS.find((a) => a.id === view) : undefined;
  if (byId) return byId;
  if (!patient) return null;
  return (
    APPOINTMENTS.find((a) => a.patient === patient && !isPast(a) && a.status === "booked") ?? null
  );
}

export function ScheduleScreen() {
  const { route, toast, store } = useNav();
  const [boot] = React.useState(() => bootFrom(route.patient, route.view));

  const [list, setList] = React.useState<readonly Appt[]>(APPOINTMENTS);
  const [monday, setMonday] = React.useState(boot ? mondayOf(boot.day) : THIS_WEEK);
  const [day, setDay] = React.useState(boot ? boot.day : 0);
  const [mode, setMode] = React.useState<Mode>("week");
  const [filter, setFilter] = React.useState<Filter>(boot ? boot.clinician : "lake");
  const [highlight, setHighlight] = React.useState<string | null>(boot?.id ?? null);
  const [openId, setOpenId] = React.useState<string | null>(boot?.id ?? null);
  const [newOpen, setNewOpen] = React.useState(false);
  const [newKey, setNewKey] = React.useState(0);
  const [newFor, setNewFor] = React.useState<string>(route.patient ?? "okonkwo");
  const seq = React.useRef(0);
  const root = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!highlight) return;
    root.current
      ?.querySelector(`[data-appt="${highlight}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [highlight, monday, mode, filter]);

  const inWeek = list.filter((a) => a.day >= monday && a.day < monday + 5);
  const visible = inWeek.filter(shows(filter));
  const sessions = visible.filter((a) => a.patient && a.status !== "cancelled").length;
  const showTask = (filter === "lake" || filter === "all") && !store.resolved[OKONKWO_RISK];
  const suffix =
    filter === "lake"
      ? ""
      : filter === "all"
        ? " · all clinicians"
        : ` · ${CLINICIANS[filter].short}`;
  const weekDays = [0, 1, 2, 3, 4].map((i) => monday + i);
  const openAppt = openId ? (list.find((a) => a.id === openId) ?? null) : null;

  const reveal = (a: Appt) => {
    setMonday(mondayOf(a.day));
    setDay(a.day);
    setFilter((f) => (f === "all" || f === a.clinician ? f : a.clinician));
    setHighlight(a.id);
  };

  const shiftWeek = (by: number) => {
    setMonday((m) => m + by);
    setDay((d) => d + by);
  };

  const pickDay = (d: number) => {
    setMonday(mondayOf(d));
    setDay(d);
  };

  const openDay = (d: number) => {
    pickDay(d);
    setMode("day");
  };

  const add = (a: Appt) => {
    seq.current += 1;
    const made = { ...a, id: `new-${seq.current}` };
    setList((l) => [...l, made].sort((x, y) => x.day - y.day || x.start - y.start));
    reveal(made);
    return made;
  };

  const startNew = (pid: string) => {
    setOpenId(null);
    setNewFor(pid);
    setNewKey((k) => k + 1);
    setNewOpen(true);
  };

  const dayOptions = weekDays.map((d) => ({
    day: d,
    count: list.filter(
      (a) => a.day === d && a.patient && a.status !== "cancelled" && shows(filter)(a),
    ).length,
  }));

  const empty = !inWeek.length;
  const defaultPatient =
    route.patient ??
    (filter === "all" || filter === "lake"
      ? "okonkwo"
      : (PATIENTS.find((p) => p.clinician === filter)?.id ?? "okonkwo"));

  return (
    <>
      <ScreenHead
        title="Schedule"
        sub={`Week of ${dayLabel(monday)} · ${sessions} ${sessions === 1 ? "session" : "sessions"}${suffix}`}
        actions={
          <button type="button" className="btn primary" onClick={() => startNew(defaultPatient)}>
            <Plus aria-hidden="true" size={15} strokeWidth={1.9} />
            New appointment
          </button>
        }
      />
      <ScreenBody className="sc">
        <div className="toolbar sc-bar">
          <div className="sc-nav">
            <button
              type="button"
              className="iconBtn"
              aria-label="Previous week"
              onClick={() => shiftWeek(-7)}
            >
              <ChevronLeft aria-hidden="true" size={15} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              className="btn ghost sm"
              aria-pressed={monday === THIS_WEEK && day === 0}
              onClick={() => pickDay(0)}
            >
              Today
            </button>
            <button
              type="button"
              className="iconBtn"
              aria-label="Next week"
              onClick={() => shiftWeek(7)}
            >
              <ChevronRight aria-hidden="true" size={15} strokeWidth={1.8} />
            </button>
            <b className="sc-weekLabel" aria-live="polite">
              {weekRange(monday)} 2026
            </b>
          </div>
          <span className="grow" />
          <div className="sc-modes">
            <Segmented label="View" options={MODES} value={mode} onChange={setMode} />
          </div>
          <div className="sc-filter">
            <Select label="Clinician" value={filter} options={FILTERS} onChange={setFilter} />
          </div>
        </div>

        <div className="sc-layout" ref={root}>
          <section className="panel sc-main" aria-labelledby="sc-main-h">
            <h3 id="sc-main-h" className="sr-only">
              {mode === "week" ? `Week of ${weekRange(monday)}` : dayName(day)}
            </h3>

            {empty ? (
              <EmptyState
                title="Nothing booked this week"
                action={
                  <button type="button" className="btn ghost sm" onClick={() => pickDay(0)}>
                    Back to this week
                  </button>
                }
              >
                The demo book covers 03–21 Aug.
              </EmptyState>
            ) : (
              <>
                {mode === "week" ? (
                  <div className="sc-wkOnly">
                    <WeekGrid
                      monday={monday}
                      list={list}
                      filter={filter}
                      highlight={highlight}
                      showTask={showTask && monday === THIS_WEEK}
                      onOpen={(id) => {
                        setHighlight(id);
                        setOpenId(id);
                      }}
                      onDay={openDay}
                    />
                  </div>
                ) : null}
                <div className={mode === "week" ? "sc-dayOnly" : "sc-dayWrap"}>
                  <div className="sc-dayChips">
                    <div className="chips sc-days" role="group" aria-label="Day">
                      {dayOptions.map((o) => (
                        <button
                          key={o.day}
                          type="button"
                          className="chip sc-dayChip"
                          aria-pressed={o.day === day}
                          aria-label={`${dayName(o.day)}, ${o.count} sessions`}
                          onClick={() => setDay(o.day)}
                        >
                          <span>{dayShort(o.day)}</span>
                          <span>{dayName(o.day).slice(4, 6)}</span>
                          <span className="chipCount">{o.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Agenda
                    day={day}
                    list={list}
                    filter={filter}
                    highlight={highlight}
                    showTask={showTask}
                    onOpen={(id) => {
                      setHighlight(id);
                      setOpenId(id);
                    }}
                  />
                </div>
              </>
            )}

            <div className="miniLegend sc-legend">
              {(["individual", "intake", "med", "risk", "group", "admin"] as const).map((t) => (
                <span key={t} className="sc-key">
                  <span className={`sc-sw t-${t}`} aria-hidden="true" />
                  {t === "admin" ? "Admin, supervision" : TYPES[t].short}
                </span>
              ))}
              <span className="sc-key">
                <ShieldAlert aria-hidden="true" size={11} strokeWidth={2} className="sc-evRisk" />{" "}
                Open risk item
              </span>
              <span className="sc-key">
                <span className="sc-evDot" aria-hidden="true" /> Measure due
              </span>
              <span className="sc-key">
                <Video aria-hidden="true" size={11} strokeWidth={1.8} /> Telehealth
              </span>
            </div>
          </section>

          <aside className="sc-side" aria-label="Today and calendar">
            <TodayCard
              list={list}
              filter={filter}
              onOpen={setOpenId}
              onDay={openDay}
              showingToday={mode === "day" && day === 0}
            />
            <DueCard list={list} filter={filter} />
            <MonthCard list={list} filter={filter} selected={day} onPick={pickDay} />
          </aside>
        </div>
      </ScreenBody>

      <ApptSheet
        appt={openAppt}
        list={list}
        onClose={() => setOpenId(null)}
        onOpen={(id) => {
          const x = list.find((y) => y.id === id);
          if (x) reveal(x);
          setOpenId(id);
        }}
        onChange={(id, patch) => {
          setList((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));
          // A moved session takes the view with it.
          if (patch.day !== undefined) {
            pickDay(patch.day);
            setHighlight(id);
          }
        }}
        onRebook={(from, d, t) => {
          const copy: Appt = { ...from, day: d, start: t, status: "booked" };
          delete copy.reason;
          const made = add(copy);
          setOpenId(made.id);
          toast(`Rebooked ${nameOf(from)} · ${dayName(d)} ${hhmm(t)}`);
        }}
        onFollowUp={startNew}
        onViewClinician={(c) => {
          setOpenId(null);
          setFilter(c);
        }}
      />
      <NewAppt
        key={newKey}
        open={newOpen}
        list={list}
        initialPatient={newFor}
        initialDay={day}
        onClose={() => setNewOpen(false)}
        onBook={(a) => {
          const made = add(a);
          setNewOpen(false);
          toast(`Booked ${nameOf(made)} · ${dayName(made.day)} ${hhmm(made.start)}`);
        }}
      />
    </>
  );
}
