"use client";

/**
 * Safety — the risk follow-up queue.
 *
 * Ordered by minutes left, never by severity label, for the same reason the
 * dashboard is: an overdue plan review outranks a positive screen with most of
 * its window still to run. Closing an item goes through the shared store, so
 * the dashboard and the rail badge agree with this list the moment it changes.
 */

import * as React from "react";
import { BellRing, ClipboardPlus, FileText, Phone, Undo2, UserRoundPen } from "lucide-react";
import {
  CLINICIANS,
  ME,
  NOW,
  PATIENTS,
  RISKS,
  dayLabel,
  faceOf,
  patient,
  type ClinicianId,
  type RiskItem,
  type Sev,
} from "../data";
import { stamp, useNav } from "../shell";
import { AccItem, Face, Status, sevText, sevVar } from "../../kit";
import {
  Chips,
  ClinicianAvatar,
  EmptyState,
  KV,
  PatientLink,
  ScreenBody,
  ScreenHead,
  Segmented,
  Select,
  Sheet,
} from "../ui";

type Filter = "open" | "mine" | "overdue" | "due" | "closed";
type OwnerFilter = "all" | ClinicianId;
type Outcome = "safe" | "escalated" | "no-answer";

const OUTCOMES: readonly { value: Outcome; label: string }[] = [
  { value: "safe", label: "Reached — safe, plan reviewed" },
  { value: "escalated", label: "Reached — escalated to crisis team" },
  { value: "no-answer", label: "No answer — retry" },
];

const OWNER_OPTIONS: readonly { value: OwnerFilter; label: string }[] = [
  { value: "all", label: "All owners" },
  ...(Object.values(CLINICIANS).map((c) => ({ value: c.id, label: c.short })) as {
    value: OwnerFilter;
    label: string;
  }[]),
];

/** Review age in days against a 60-day cycle. Dates derive from the demo clock. */
const PLANS: readonly { id: string; age: number }[] = [
  { id: "ferreira", age: 62 },
  { id: "oyelaran", age: 54 },
  { id: "haddad", age: 30 },
  { id: "okonkwo", age: 8 },
  { id: "mwangi", age: 8 },
];
const PLAN_CYCLE = 60;

/** C-SSRS administrations this week, before anything logged in this session. */
const WEEK = { screened: 41, positive: 2 };

function duration(minutes: number): string {
  if (minutes >= 1440) {
    const d = Math.floor(minutes / 1440);
    const h = Math.floor((minutes % 1440) / 60);
    return h ? `${d}d ${h}h` : `${d}d`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/** "Overdue 2d" or "4h 12m left". Worded, so the colour is never the only signal. */
function leftLabel(r: RiskItem): string {
  return r.minutes < 0 ? `Overdue ${duration(-r.minutes)}` : `${r.left} left`;
}

function windowLabel(r: RiskItem): string {
  return r.minutes < 0 ? `past the ${r.window}` : `${r.left} remaining`;
}

const domId = (id: string) => `sf-item-${id}`;

/* ------------------------------------------------------------- the screen */

export function SafetyScreen() {
  const { route, go, toast, store, patch } = useNav();

  const [added, setAdded] = React.useState<RiskItem[]>([]);
  const [owners, setOwners] = React.useState<Record<string, ClinicianId>>({});
  const [attempts, setAttempts] = React.useState<Record<string, string[]>>({});
  const [outcomes, setOutcomes] = React.useState<Record<string, string>>({});
  const [filter, setFilter] = React.useState<Filter>(() =>
    route.view && store.resolved[route.view] ? "closed" : "open",
  );
  const [owner, setOwner] = React.useState<OwnerFilter>("all");
  const [contactId, setContactId] = React.useState<string | null>(() =>
    route.view && !store.resolved[route.view] && RISKS.some((r) => r.id === route.view)
      ? route.view
      : null,
  );
  const [flash, setFlash] = React.useState<string | null>(route.view ?? null);
  const [reassigning, setReassigning] = React.useState<string | null>(null);
  const [logOpen, setLogOpen] = React.useState(0);
  const [screens, setScreens] = React.useState({ screened: 0, positive: 0 });
  const tick = React.useRef(0);

  const nextStamp = () => {
    tick.current += 1;
    return stamp(tick.current);
  };

  const items = React.useMemo(
    () =>
      [...RISKS, ...added]
        .map((r) => (owners[r.id] ? { ...r, owner: owners[r.id]! } : r))
        .sort((a, b) => a.minutes - b.minutes),
    [added, owners],
  );

  const isOpen = (r: RiskItem) => !store.resolved[r.id];
  const open = items.filter(isOpen);
  const counts = {
    open: open.length,
    mine: open.filter((r) => r.owner === ME).length,
    overdue: open.filter((r) => r.minutes < 0).length,
    due: open.filter((r) => r.minutes >= 0 && r.minutes <= 1440).length,
    closed: items.length - open.length,
  };

  const shown = items.filter((r) => {
    if (owner !== "all" && r.owner !== owner) return false;
    switch (filter) {
      case "closed":
        return !isOpen(r);
      case "mine":
        return isOpen(r) && r.owner === ME;
      case "overdue":
        return isOpen(r) && r.minutes < 0;
      case "due":
        return isOpen(r) && r.minutes >= 0 && r.minutes <= 1440;
      default:
        return isOpen(r);
    }
  });

  // Arriving from a dashboard row: bring that item forward and let the flash fade.
  const target = route.view;
  React.useEffect(() => {
    if (!target) return;
    const el = document.getElementById(domId(target));
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = window.setTimeout(() => setFlash(null), 2400);
    return () => window.clearTimeout(t);
  }, [target]);

  const contactItem = contactId ? (items.find((r) => r.id === contactId) ?? null) : null;

  const saveContact = (r: RiskItem, outcome: Outcome) => {
    const p = patient(r.patient);
    const at = nextStamp();
    if (outcome === "no-answer") {
      const n = (attempts[r.id]?.length ?? 0) + 1;
      setAttempts((a) => ({ ...a, [r.id]: [...(a[r.id] ?? []), at] }));
      toast(`Attempt ${n} logged · ${p.name}`);
    } else {
      patch((s) => ({ ...s, resolved: { ...s.resolved, [r.id]: `Contacted · ${at}` } }));
      setOutcomes((o) => ({ ...o, [r.id]: OUTCOMES.find((x) => x.value === outcome)!.label }));
      toast(`${p.name} · follow-up recorded`);
      if (outcome === "escalated") toast(`Crisis team notified · on call ${CLINICIANS.tash.short}`);
    }
    setContactId(null);
  };

  const undo = (r: RiskItem) => {
    patch((s) => {
      const resolved = { ...s.resolved };
      delete resolved[r.id];
      return { ...s, resolved };
    });
    toast(`Follow-up reopened · ${patient(r.patient).name}`);
  };

  const reassign = (r: RiskItem, to: ClinicianId) => {
    setOwners((o) => ({ ...o, [r.id]: to }));
    setReassigning(null);
    toast(`Reassigned to ${CLINICIANS[to].short}`);
  };

  const logScreen = (pid: string, positive: boolean) => {
    const p = patient(pid);
    setScreens((s) => ({ screened: s.screened + 1, positive: s.positive + (positive ? 1 : 0) }));
    if (positive) {
      setAdded((a) => [
        ...a,
        {
          id: `rk-log-${a.length + 1}-${pid}`,
          patient: pid,
          kind: "cssrs",
          what: "C-SSRS positive",
          opened: `13 Aug ${NOW.time}`,
          owner: ME,
          sev: "crit",
          left: "24h 00m",
          usedPct: 0,
          window: "24h window",
          minutes: 1440,
        },
      ]);
      toast(`Follow-up opened · due ${NOW.time} tomorrow`);
    } else {
      toast(`Negative screen recorded · ${p.name}`);
    }
    setLogOpen(0);
  };

  const stats: { key: Filter; label: string; n: number; sev?: Sev }[] = [
    { key: "open", label: "Open", n: counts.open },
    {
      key: "overdue",
      label: "Overdue",
      n: counts.overdue,
      sev: counts.overdue ? "high" : undefined,
    },
    { key: "due", label: "Due within 24h", n: counts.due },
    { key: "closed", label: "Closed today", n: counts.closed },
  ];

  return (
    <>
      <ScreenHead
        title="Safety"
        sub="Risk follow-ups ordered by time remaining"
        actions={
          <button type="button" className="btn ghost sm" onClick={() => setLogOpen((n) => n + 1)}>
            <ClipboardPlus aria-hidden="true" size={14} strokeWidth={1.7} />
            Log a screen
          </button>
        }
      />
      <ScreenBody>
        <div className="sf-stats" role="group" aria-label="Summary">
          {stats.map((s) => (
            <button
              key={s.key}
              type="button"
              className="sf-stat"
              aria-pressed={filter === s.key}
              onClick={() => setFilter(s.key)}
            >
              <span className="sf-statN mono" style={s.sev ? { color: sevText(s.sev) } : undefined}>
                {s.n}
              </span>
              <span className="sf-statK">{s.label}</span>
            </button>
          ))}
        </div>

        <div className="sf-cols">
          <div className="sf-main">
            <div className="toolbar">
              <Chips
                label="Filter follow-ups"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "open", label: "All open", count: counts.open },
                  { value: "mine", label: "Mine", count: counts.mine },
                  { value: "overdue", label: "Overdue", count: counts.overdue },
                  { value: "due", label: "Due within 24h", count: counts.due },
                  { value: "closed", label: "Closed today", count: counts.closed },
                ]}
              />
              <span className="grow" />
              <Select label="Owner" value={owner} onChange={setOwner} options={OWNER_OPTIONS} />
            </div>

            <section className="panel sf-queue" aria-labelledby="sf-queue-title">
              <div className="panelTop">
                <div>
                  <h3 id="sf-queue-title">
                    {filter === "closed" ? "Closed today" : "Follow-up queue"}
                  </h3>
                  <p>
                    {shown.length} {shown.length === 1 ? "item" : "items"} · ordered by time
                    remaining, not by severity label
                  </p>
                </div>
              </div>
              {shown.length === 0 ? (
                <div className="sf-emptyWrap">
                  {filter === "closed" ? (
                    <EmptyState
                      title="Nothing closed yet today"
                      action={
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => setFilter("open")}
                        >
                          Show open follow-ups
                        </button>
                      }
                    >
                      Items move here once contact is recorded, with the outcome and time.
                    </EmptyState>
                  ) : (
                    <EmptyState
                      title="No open follow-ups"
                      action={
                        filter !== "open" || owner !== "all" ? (
                          <button
                            type="button"
                            className="btn ghost sm"
                            onClick={() => {
                              setFilter("open");
                              setOwner("all");
                            }}
                          >
                            Clear filters
                          </button>
                        ) : undefined
                      }
                    >
                      Nothing is waiting — this is an empty state, not a loading one.
                    </EmptyState>
                  )}
                </div>
              ) : (
                <ul className="sf-list">
                  {shown.map((r) => (
                    <QueueItem
                      key={r.id}
                      r={r}
                      flash={flash === r.id}
                      closed={store.resolved[r.id]}
                      outcome={outcomes[r.id]}
                      attempts={attempts[r.id]}
                      reassigning={reassigning === r.id}
                      onContact={() => setContactId(r.id)}
                      onReassignToggle={() => setReassigning((x) => (x === r.id ? null : r.id))}
                      onReassign={(to) => reassign(r, to)}
                      onUndo={() => undo(r)}
                      onRecord={() => go({ screen: "record", patient: r.patient, view: "safety" })}
                    />
                  ))}
                </ul>
              )}
              <p className="miniLegend">
                Ordered by minutes left in each window, never by severity — an overdue plan review
                sits above a positive screen that still has most of its day.
              </p>
            </section>
          </div>

          <aside className="colStack sf-side" aria-label="Safety context">
            <PlansCard />
            <ScreensCard
              screened={WEEK.screened + screens.screened}
              positive={WEEK.positive + screens.positive}
            />
            <ProtocolCard />
            <OnCallCard />
          </aside>
        </div>
      </ScreenBody>

      <ContactSheet
        key={contactItem?.id ?? "none"}
        item={contactItem}
        attempts={contactItem ? (attempts[contactItem.id]?.length ?? 0) : 0}
        onClose={() => setContactId(null)}
        onSave={saveContact}
      />
      <LogSheet
        key={`log-${logOpen}`}
        open={logOpen > 0}
        initial={route.patient ?? PATIENTS[0]!.id}
        onClose={() => setLogOpen(0)}
        onSave={logScreen}
      />
    </>
  );
}

/* --------------------------------------------------------------- one row */

function QueueItem({
  r,
  flash,
  closed,
  outcome,
  attempts,
  reassigning,
  onContact,
  onReassignToggle,
  onReassign,
  onUndo,
  onRecord,
}: {
  r: RiskItem;
  flash: boolean;
  closed?: string;
  outcome?: string;
  attempts?: string[];
  reassigning: boolean;
  onContact: () => void;
  onReassignToggle: () => void;
  onReassign: (to: ClinicianId) => void;
  onUndo: () => void;
  onRecord: () => void;
}) {
  const p = patient(r.patient);
  const sev: Sev = closed ? "norm" : r.sev;
  const last = attempts?.length ? attempts[attempts.length - 1] : null;

  return (
    <li
      id={domId(r.id)}
      className={`sf-item${flash ? " sf-flash" : ""}${closed ? " sf-closed" : ""}`}
    >
      <span
        className="sf-rail"
        style={{ background: closed ? "var(--site-rule-strong)" : sevVar(r.sev) }}
        aria-hidden="true"
      />
      <div className="sf-body">
        <div className="sf-top">
          <div className="sf-who">
            <PatientLink p={p} size={26} sub={`${r.what} · opened ${r.opened}`} />
          </div>
          <div className="sf-left mono" style={{ color: sevText(sev) }}>
            {closed ? "Closed" : leftLabel(r)}
          </div>
        </div>

        {closed ? (
          <p className="sf-outcome">
            <Status sev="norm">{outcome ?? "Contact recorded"}</Status>
            <span className="mono">{closed}</span>
          </p>
        ) : (
          <div className="sf-win">
            <div className="sf-winTrk">
              <i style={{ width: `${r.usedPct}%`, background: sevVar(r.sev) }} />
            </div>
            <div className="sf-winLbl">
              <span>
                {r.usedPct}% of the {r.window} used
              </span>
              <span>{windowLabel(r)}</span>
            </div>
          </div>
        )}

        {!closed && last ? (
          <p className="sf-attempt">
            <span className="mono">
              Attempt {attempts!.length} · {last}
            </span>{" "}
            · no answer
            {attempts!.length >= 2 ? (
              <span className="sf-attemptHint"> · two attempts, see escalation protocol</span>
            ) : null}
          </p>
        ) : null}

        <div className="sf-foot">
          <span className="sf-owner">
            <ClinicianAvatar id={r.owner} size={20} />
            <span>{CLINICIANS[r.owner].short}</span>
          </span>
          <div className="sf-actions">
            {closed ? (
              <button type="button" className="btn ghost sm" onClick={onUndo}>
                <Undo2 aria-hidden="true" size={13} strokeWidth={1.8} />
                Undo
              </button>
            ) : (
              <>
                <button type="button" className="btn primary sm" onClick={onContact}>
                  <Phone aria-hidden="true" size={13} strokeWidth={1.8} />
                  Record contact
                </button>
                <button
                  type="button"
                  className="btn ghost sm"
                  aria-expanded={reassigning}
                  aria-controls={reassigning ? `${domId(r.id)}-reassign` : undefined}
                  onClick={onReassignToggle}
                >
                  <UserRoundPen aria-hidden="true" size={13} strokeWidth={1.8} />
                  Reassign
                </button>
              </>
            )}
            <button type="button" className="btn ghost sm" onClick={onRecord}>
              <FileText aria-hidden="true" size={13} strokeWidth={1.8} />
              Open record
            </button>
          </div>
        </div>

        {reassigning && !closed ? (
          <div className="sf-reassign" id={`${domId(r.id)}-reassign`}>
            <span className="sf-reassignK">Assign {p.name} to</span>
            <div className="sf-reassignList" role="group" aria-label={`Reassign ${p.name}`}>
              {Object.values(CLINICIANS).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="sf-pick"
                  aria-pressed={c.id === r.owner}
                  onClick={() => (c.id === r.owner ? onReassignToggle() : onReassign(c.id))}
                >
                  <ClinicianAvatar id={c.id} size={20} />
                  <span>
                    {c.short}
                    <small>{c.role}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </li>
  );
}

/* ---------------------------------------------------------- side column */

function PlansCard() {
  const { go } = useNav();
  const rows = [...PLANS].sort((a, b) => b.age - a.age);
  return (
    <section className="card" aria-labelledby="sf-plans-title">
      <div className="cardTop">
        <h4 id="sf-plans-title">Safety plans</h4>
        <span className="seeAll">{PLAN_CYCLE}-day review</span>
      </div>
      <ul className="sf-plans">
        {rows.map((row) => {
          const p = patient(row.id);
          const pct = Math.min(100, Math.round((row.age / PLAN_CYCLE) * 100));
          const sev: Sev =
            row.age >= PLAN_CYCLE ? "high" : row.age >= PLAN_CYCLE - 10 ? "low" : "norm";
          const state =
            row.age >= PLAN_CYCLE
              ? `overdue ${row.age - PLAN_CYCLE}d`
              : row.age >= PLAN_CYCLE - 10
                ? `due in ${PLAN_CYCLE - row.age}d`
                : "current";
          return (
            <li key={row.id}>
              <button
                type="button"
                className="rowBtn sf-plan"
                onClick={() => go({ screen: "record", patient: row.id, view: "safety" })}
              >
                <span className="sf-planTop">
                  <Face name={p.name} src={faceOf(p.name)} size={20} />
                  <span className="sf-planName">{p.name}</span>
                  <span className="sf-planState" style={{ color: sevText(sev) }}>
                    {state}
                  </span>
                </span>
                <span className="sf-planTrk" aria-hidden="true">
                  <i style={{ width: `${pct}%`, background: sevVar(sev) }} />
                </span>
                <span className="sf-planSub">
                  Reviewed {dayLabel(-row.age)} · <span className="mono">{row.age}d</span> ago
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ScreensCard({ screened, positive }: { screened: number; positive: number }) {
  const pct = screened ? Math.round((positive / screened) * 1000) / 10 : 0;
  return (
    <section className="card" aria-labelledby="sf-cssrs-title">
      <div className="cardTop">
        <h4 id="sf-cssrs-title">C-SSRS this week</h4>
        <span className="seeAll">10–13 Aug</span>
      </div>
      <div className="sf-cardBody">
        <div className="sf-figs">
          <div>
            <span className="sf-fig mono">{screened}</span>
            <span className="sf-figK">screened</span>
          </div>
          <div>
            <span className="sf-fig mono" style={{ color: sevText("crit") }}>
              {positive}
            </span>
            <span className="sf-figK">positive</span>
          </div>
        </div>
        <div className="meter">
          <div className="meterTop">
            <span className="k">Positive share</span>
            <span className="v">{pct}%</span>
          </div>
          <div className="meterTrk" aria-hidden="true">
            <i style={{ width: `${Math.max(pct, 1.5)}%`, background: sevVar("crit") }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProtocolCard() {
  return (
    <section className="card" aria-labelledby="sf-proto-title">
      <div className="cardTop">
        <h4 id="sf-proto-title">Escalation protocol</h4>
        <span className="seeAll">Clinic policy</span>
      </div>
      <div className="acc">
        <AccItem sev="crit" title="Positive screen" summary="Contact within 24 hours">
          <div className="accInner">
            A positive C-SSRS opens a follow-up owned by the screening clinician. Reach the patient,
            review the safety plan and discuss means safety within 24 hours.
          </div>
        </AccItem>
        <AccItem
          sev="high"
          title="No contact after two attempts"
          summary="Welfare check escalation"
        >
          <div className="accInner">
            After two unanswered attempts, tell the on-call psychiatrist and request a welfare check
            through the clinic&apos;s escalation line. Record each attempt.
          </div>
        </AccItem>
        <AccItem sev="crit" title="Imminent risk" summary="Call 911 or mobile crisis">
          <div className="accInner">
            Stay with the patient and call 911 or the mobile crisis team. Give the patient the 988
            Suicide &amp; Crisis Lifeline for ongoing support.
          </div>
        </AccItem>
      </div>
    </section>
  );
}

function OnCallCard() {
  const { toast } = useNav();
  const c = CLINICIANS.tash;
  return (
    <section className="card" aria-labelledby="sf-oncall-title">
      <div className="cardTop">
        <h4 id="sf-oncall-title">On call today</h4>
      </div>
      <div className="sf-oncall">
        <ClinicianAvatar id={c.id} size={32} />
        <span className="sf-oncallText">
          <b>{c.name}</b>
          <span>
            {c.role} · <span className="mono">08:00–20:00</span>
          </span>
        </span>
        <button type="button" className="btn ghost sm" onClick={() => toast(`Paged ${c.short}`)}>
          <BellRing aria-hidden="true" size={13} strokeWidth={1.8} />
          Page
        </button>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- sheets */

function ContactSheet({
  item,
  attempts,
  onClose,
  onSave,
}: {
  item: RiskItem | null;
  attempts: number;
  onClose: () => void;
  onSave: (r: RiskItem, outcome: Outcome) => void;
}) {
  const [outcome, setOutcome] = React.useState<Outcome | null>(null);
  const [plan, setPlan] = React.useState(false);
  const [means, setMeans] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [next, setNext] = React.useState("tomorrow");
  const name = React.useId();

  if (!item)
    return (
      <Sheet open={false} onClose={onClose} title="Record contact">
        {null}
      </Sheet>
    );
  const p = patient(item.patient);

  return (
    <Sheet
      open
      onClose={onClose}
      title="Record contact"
      sub={`${item.what} · ${CLINICIANS[item.owner].short}`}
      footer={
        <>
          <button type="button" className="btn ghost sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary sm"
            disabled={!outcome}
            onClick={() => outcome && onSave(item, outcome)}
          >
            {outcome === "no-answer" ? `Log attempt ${attempts + 1}` : "Save contact"}
          </button>
        </>
      }
    >
      <div className="sf-sheetPt">
        <Face name={p.name} src={faceOf(p.name)} size={40} />
        <div>
          <b>{p.full}</b>
          <span>
            <span className="mono">{p.mrn}</span> · {p.age} · {p.pronouns}
          </span>
          <Status sev={item.sev}>{leftLabel(item)}</Status>
        </div>
      </div>

      <div className="sheetSection">
        <h4>Window</h4>
        <div className="sf-win">
          <div className="sf-winTrk">
            <i style={{ width: `${item.usedPct}%`, background: sevVar(item.sev) }} />
          </div>
          <div className="sf-winLbl">
            <span>
              {item.usedPct}% of the {item.window} used
            </span>
            <span>opened {item.opened}</span>
          </div>
        </div>
        {attempts ? (
          <p className="sf-attempt">
            {attempts} unanswered {attempts === 1 ? "attempt" : "attempts"} so far
          </p>
        ) : null}
      </div>

      <fieldset className="sf-fieldset">
        <legend>Outcome</legend>
        {OUTCOMES.map((o) => (
          <label key={o.value} className="check">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={outcome === o.value}
              onChange={() => setOutcome(o.value)}
            />
            {o.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="sf-fieldset">
        <legend>Covered</legend>
        <label className="check">
          <input type="checkbox" checked={plan} onChange={(e) => setPlan(e.target.checked)} />
          Safety plan reviewed with patient
        </label>
        <label className="check">
          <input type="checkbox" checked={means} onChange={(e) => setMeans(e.target.checked)} />
          Means safety discussed
        </label>
      </fieldset>

      <label className="field">
        Note
        <textarea
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was said, and what happens next"
        />
      </label>

      <div className="field">
        <span aria-hidden="true">Next contact</span>
        <Select
          label="Next contact"
          value={next}
          onChange={setNext}
          options={[
            { value: "4h", label: `Within 4 hours · by ${stamp(240)}` },
            { value: "tomorrow", label: `Tomorrow · ${NOW.time}` },
            { value: "session", label: `Next session · ${p.next}` },
          ]}
        />
      </div>
    </Sheet>
  );
}

function LogSheet({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: string;
  onClose: () => void;
  onSave: (patientId: string, positive: boolean) => void;
}) {
  const [pid, setPid] = React.useState(initial);
  const [result, setResult] = React.useState<"neg" | "pos">("neg");
  const [notes, setNotes] = React.useState("");
  const options = React.useMemo(
    () =>
      [...PATIENTS]
        .sort((a, b) => a.full.localeCompare(b.full))
        .map((p) => ({ value: p.id, label: p.full })),
    [],
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log a C-SSRS screen"
      sub={`Screener · ${NOW.day} ${NOW.time}`}
      footer={
        <>
          <button type="button" className="btn ghost sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary sm"
            onClick={() => onSave(pid, result === "pos")}
          >
            Save screen
          </button>
        </>
      }
    >
      <div className="field">
        <span aria-hidden="true">Patient</span>
        <Select label="Patient" value={pid} onChange={setPid} options={options} />
      </div>
      <div className="field">
        <span aria-hidden="true">Result</span>
        <Segmented
          label="Result"
          value={result}
          onChange={setResult}
          options={[
            { value: "neg", label: "Negative" },
            { value: "pos", label: "Positive" },
          ]}
        />
      </div>
      {result === "pos" ? (
        <div className="sf-callout">
          A positive screen opens a follow-up owned by you, due within 24 hours · by {NOW.time}{" "}
          tomorrow.
        </div>
      ) : null}
      <label className="field">
        Notes
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Items endorsed, context"
        />
      </label>
      <KV k="Screened by">{CLINICIANS[ME].name}</KV>
    </Sheet>
  );
}
