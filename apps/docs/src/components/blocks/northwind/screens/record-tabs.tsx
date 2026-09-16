"use client";

import * as React from "react";
import { CLINICIANS, INSTRUMENT_MAX, band, dayLabel, latest, type Patient } from "../data";
import { stamp, useNav } from "../shell";
import { Chips, EmptyState } from "../ui";
import { AccItem, Instrument, ListRow, Pill, Status, TlItem } from "../../kit";
import { TrajectoryOne } from "../../charts";
import { Trajectory } from "./record-chart";
import {
  CLAIM_SEV,
  COORDINATOR,
  MED_SEV,
  administrations,
  booked,
  chronology,
  claims,
  details,
  documents,
  engagement,
  isOkonkwo,
  meds,
  notes,
  openRisk,
  presenting,
  presentingShort,
  recentEvents,
  problems,
  response,
  safetyPlan,
  scoreOffsets,
  sparkY,
  type DetailKey,
  type Doc,
  type NoteRow,
  type Source,
  type TabId,
} from "./record-data";

export type SheetState =
  | { kind: "new-note" }
  | { kind: "note"; note: NoteRow }
  | { kind: "doc"; doc: Doc }
  | { kind: "detail"; key: DetailKey }
  | { kind: "access" };

export interface RecordCtx {
  p: Patient;
  index: number;
  setTab: (tab: TabId) => void;
  open: (sheet: SheetState) => void;
  drafts: readonly NoteRow[];
  accessPending: string | null;
  reconciled: string | null;
  reconcile: () => void;
}

/** Tab panels open with an `h3` the eye does not need, so card `h4`s never skip a level. */
function PanelHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="sr-only">{children}</h3>;
}

function SeeAll({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="seeAll linkBtn" onClick={onClick}>
      {children} <span aria-hidden="true">›</span>
    </button>
  );
}

/* ------------------------------------------------------------- overview */

function PendingInstr({
  name,
  value,
  reading,
  foot,
  due,
}: {
  name: string;
  value: string;
  reading: string;
  foot: string;
  due: string;
}) {
  return (
    <div className="instr">
      <div className="instrTop">
        <span className="instrName">{name}</span>
        <Pill sev="unk">{reading}</Pill>
      </div>
      <div className="instrVal">
        <span className="v">{value}</span>
      </div>
      <div className="scaleBar rc-scaleIdle" />
      <p className="rc-instrNote">No administrations yet.</p>
      <div className="instrFoot">
        <span>{foot}</span>
        <span>{due}</span>
      </div>
    </div>
  );
}

function Measures({ p }: { p: Patient }) {
  const { store } = useNav();
  if (isOkonkwo(p)) {
    return (
      <div className="instrGrid">
        <Instrument
          name="PHQ-9"
          value="16"
          max="27"
          markPct={59}
          reading="Not on track"
          sev="crit"
          taken="taken 12 Aug"
          due="due 19 Aug"
          points={[10, 10, 11, 10, 11, 10]}
        />
        <Instrument
          name="GAD-7"
          value="9"
          max="21"
          markPct={43}
          reading="Responding"
          sev="norm"
          taken="taken 12 Aug"
          due="due 19 Aug"
          points={[6, 9, 13, 17, 20, 22]}
        />
        <Instrument
          name="C-SSRS"
          value="+"
          max="—"
          markPct={0}
          reading="Positive"
          sev="crit"
          taken="screened 12 Aug"
          due="f/u in 4h"
          points={[26, 26, 26, 10, 10, 10]}
        />
      </div>
    );
  }
  const next = booked(p);
  const due = next ? `due ${next.split(" ").slice(1, 3).join(" ")}` : "not booked";
  const v = latest(p);
  const risk = openRisk(p, store.resolved);
  const positive = risk && (risk.kind === "cssrs" || risk.kind === "crisis-call");
  const offs = scoreOffsets(p);
  if (v === null) {
    return (
      <div className="instrGrid rc-grid2">
        <PendingInstr
          name={p.instrument}
          value="—"
          reading="Awaiting baseline"
          foot="not yet taken"
          due={due}
        />
        <PendingInstr
          name="C-SSRS"
          value="—"
          reading="Not screened"
          foot="not yet screened"
          due={due}
        />
      </div>
    );
  }
  const max = INSTRUMENT_MAX[p.instrument];
  const b = band(p.instrument, v);
  const last = dayLabel(offs[offs.length - 1]!);
  return (
    <div className="instrGrid rc-grid2">
      <Instrument
        name={p.instrument}
        value={String(v)}
        max={String(max)}
        markPct={Math.round((v / max) * 100)}
        reading={b.label}
        sev={b.sev}
        taken={`taken ${last}`}
        due={due}
        points={p.scores.slice(-6).map((s) => sparkY(s, max))}
      />
      <Instrument
        name="C-SSRS"
        value={positive ? "+" : "−"}
        max="—"
        markPct={0}
        reading={positive ? "Positive" : "Negative"}
        sev={positive ? "crit" : "norm"}
        taken={`screened ${positive ? risk.opened.split(" ").slice(0, 2).join(" ") : last}`}
        due={positive ? `f/u in ${risk.left}` : due}
        points={positive ? [26, 26, 26, 26, 10, 10] : [26, 26, 26, 26, 26, 26]}
      />
    </div>
  );
}

export function OverviewPanel({ ctx }: { ctx: RecordCtx }) {
  const { p, setTab, open, accessPending, index } = ctx;
  const { store, go } = useNav();
  const ok = isOkonkwo(p);
  const clin = CLINICIANS[p.clinician];
  const risk = openRisk(p, store.resolved);
  const reading = response(p);
  const events = recentEvents(p, store.signed);
  const total = chronology(p, store.signed).length;
  const probs = problems(p);
  const medList = meds(p);
  const eng = engagement(p);
  const next = booked(p);
  const [day, ...rest] = (next ?? "").split(" ");
  const nextDay = `${day} ${rest.slice(0, 2).join(" ")}`;
  const nextTime = rest[2] ?? "";
  const cssrsRisk = ok ? store.resolved["rk-okonkwo-cssrs"] : undefined;

  return (
    <div className="cols">
      <PanelHeading>Overview</PanelHeading>
      <div className="colStack">
        <section className="card" aria-label="Measures">
          <div className="cardTop">
            <h4>Measures</h4>
            <SeeAll onClick={() => setTab("measures")}>Compare all</SeeAll>
          </div>
          <Measures p={p} />
          <p className="miniLegend">
            Scale position is drawn against the instrument&rsquo;s own range, not a percentage.
            Sparkline is the last six administrations.
          </p>
        </section>

        <section className="card" aria-label="Treatment response">
          <div className="cardTop">
            <h4>Treatment response</h4>
            {p.scores.length ? <Pill sev={reading.sev}>{reading.label}</Pill> : null}
          </div>
          <div className="chartWrap">{ok ? <TrajectoryOne /> : <Trajectory p={p} />}</div>
          <p className="miniLegend">
            {ok
              ? "The reading a delta arrow cannot give you: the score fell 2 points, and that is still failure."
              : p.scores.length > 1
                ? `The shaded band is where an intake of ${p.scores[0]} is expected to be by each session.`
                : "The expected band appears once a second administration exists."}
          </p>
        </section>

        <div className="two">
          <section className="card" aria-label="Problem list">
            <div className="cardTop">
              <h4>Problem list</h4>
              <SeeAll onClick={() => setTab("chronology")}>See all</SeeAll>
            </div>
            {probs.map((r) => (
              <ListRow
                key={r.code}
                sev={r.sev}
                title={r.title}
                code={r.code}
                meta={r.meta}
                status={r.status}
                statusSev={r.sev}
              />
            ))}
          </section>

          <section className="card" aria-label="Medications">
            <div className="cardTop">
              <h4>Medications</h4>
              <SeeAll onClick={() => setTab("medications")}>See all</SeeAll>
            </div>
            {medList.length ? (
              medList.map((m) => (
                <ListRow
                  key={m.drug}
                  sev={MED_SEV[m.status]}
                  title={`${m.drug} ${m.dose}`}
                  meta={`${m.route.toLowerCase()} · ${m.note}`}
                  status={m.status}
                  statusSev={MED_SEV[m.status]}
                />
              ))
            ) : (
              <EmptyState title="No medications recorded">
                Reconciliation is due at intake.
              </EmptyState>
            )}
          </section>
        </div>

        <section className="card" aria-label="Chronology">
          <div className="cardTop">
            <h4>Chronology</h4>
            {ok ? (
              <Pill sev="unk">90 days · 3 sources · 2 filters</Pill>
            ) : (
              <SeeAll onClick={() => setTab("chronology")}>Full timeline</SeeAll>
            )}
          </div>
          <div className="tl">
            <div className="tlLine" aria-hidden="true" />
            {events.map((e) => (
              <TlItem key={e.key} when={e.when} sev={e.sev} what={e.what} sub={e.sub} />
            ))}
          </div>
          <p className="miniLegend">
            <span>
              {ok || events.length < total ? (
                <b className="rc-ink">This view is partial. </b>
              ) : null}
              {ok
                ? "Two sources are filtered out and one is withheld. The chronology says so rather than presenting itself as the record."
                : events.length < total
                  ? `Showing ${events.length} of ${total} events. The full timeline is on the Chronology tab.`
                  : "Every event so far is shown."}
            </span>
          </p>
        </section>

        <section className="card" aria-label="Record sections">
          <div className="cardTop">
            <h4>Record sections</h4>
          </div>
          <div className="acc">
            {ok ? (
              <>
                <AccItem
                  sev={cssrsRisk ? "high" : "crit"}
                  title="Risk assessment"
                  summary={
                    cssrsRisk
                      ? `C-SSRS positive · ${cssrsRisk}`
                      : "C-SSRS positive · follow-up due in 4h"
                  }
                  defaultOpen
                >
                  <p className="accInner">
                    Ideation reported without plan or intent at the 12 Aug session. Safety plan
                    reviewed and updated the same day. Follow-up contact due within 24 hours of a
                    positive screen under clinic policy.
                  </p>
                </AccItem>
                <AccItem
                  sev="unk"
                  title="Substance use"
                  summary="Present · withheld under 42 CFR Part 2"
                >
                  <div className="gate">
                    <b>This section exists and is withheld.</b> Substance-use records are governed
                    by 42 CFR Part 2 and require a separate consent on file. The row is shown rather
                    than removed, because deleting it would claim the record is complete.
                    <div className="rc-gateAct">
                      {accessPending ? (
                        <Pill sev="high">Request pending · {accessPending}</Pill>
                      ) : (
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => open({ kind: "access" })}
                        >
                          Request access with reason
                        </button>
                      )}
                    </div>
                  </div>
                </AccItem>
                <AccItem
                  sev="low"
                  title="Presenting concerns"
                  summary="Low mood, early waking, six months"
                >
                  <p className="accInner">
                    Referred by primary care in February for low mood and sleep disruption of
                    roughly six months duration.
                  </p>
                </AccItem>
              </>
            ) : (
              <>
                <AccItem
                  sev={risk ? risk.sev : "norm"}
                  title="Risk assessment"
                  summary={
                    risk
                      ? `${risk.what} · ${risk.left === "overdue" ? "overdue" : `${risk.left} left`}`
                      : "No open risk items"
                  }
                  defaultOpen={Boolean(risk)}
                >
                  <div className="accInner">
                    {risk ? (
                      <>
                        Opened {risk.opened} and owned by {CLINICIANS[risk.owner].short}.{" "}
                        {risk.usedPct}% of the {risk.window} used.{" "}
                        <button
                          type="button"
                          className="linkBtn"
                          onClick={() => go({ screen: "safety", view: risk.id })}
                        >
                          Open in safety queue
                        </button>
                      </>
                    ) : p.scores.length ? (
                      `C-SSRS negative at last screen. Safety plan on file since intake.`
                    ) : (
                      "Not yet screened. C-SSRS is part of the intake assessment."
                    )}
                  </div>
                </AccItem>
                <AccItem sev="low" title="Presenting concerns" summary={presentingShort(p)}>
                  <p className="accInner">{presenting(p)}</p>
                </AccItem>
              </>
            )}
          </div>
        </section>
      </div>

      <div className="colStack">
        <section className="card" aria-label="Next contact">
          <div className="cardTop">
            <h4>Next contact</h4>
          </div>
          <div className="rc-next">
            <div className="rc-nextDay">{next ? nextDay : "None booked"}</div>
            <div className="rc-nextSub">
              {next
                ? `${nextTime} · ${p.modality} · ${p.scores.length === 0 ? "60 min intake" : "50 min"}`
                : `${p.cadence} ${p.modality.toLowerCase()} sessions are due.`}
            </div>
            {!next ? (
              <button
                type="button"
                className="btn ghost sm rc-bookBtn"
                onClick={() => go({ screen: "schedule", patient: p.id })}
              >
                Book a session
              </button>
            ) : null}
            {risk && risk.kind !== "plan-review" ? (
              <div className="rc-due">
                <b>{next ? "Risk follow-up is due before this." : "Risk follow-up is due."}</b>{" "}
                {risk.left} remaining.
              </div>
            ) : null}
          </div>
        </section>

        <section className="card" aria-label="Care team">
          <div className="cardTop">
            <h4>Care team</h4>
          </div>
          {[
            {
              ini: clin.initials,
              name: clin.name,
              role:
                p.clinician === "tash"
                  ? "Clinician and prescriber · Northwind"
                  : "Primary clinician · Northwind",
              tag: p.clinician === "lake" ? "On call" : "",
            },
            ...(p.clinician === "tash"
              ? []
              : [
                  {
                    ini: CLINICIANS.tash.initials,
                    name: CLINICIANS.tash.name,
                    role: "Prescriber · Northwind",
                    tag: "",
                  },
                ]),
            {
              ini: COORDINATOR.initials,
              name: COORDINATOR.name,
              role: "Care coordinator",
              tag: "",
            },
          ].map((m) => (
            <div className="teamRow" key={m.name}>
              <div className="tAv" aria-hidden="true">
                {m.ini}
              </div>
              <div className="rc-grow">
                <div className="rc-strong">{m.name}</div>
                <div className="rc-soft">{m.role}</div>
              </div>
              {m.tag ? <Pill sev="norm">{m.tag}</Pill> : null}
            </div>
          ))}
        </section>

        <section className="card" aria-label="Engagement">
          <div className="cardTop">
            <h4>Engagement</h4>
          </div>
          <div className="rc-pad">
            <div className="meter">
              <div className="meterTop">
                <span className="k">Sessions attended</span>
                <span className="v">
                  {eng.attended} of {eng.booked}
                </span>
              </div>
              <div className="meterTrk">
                <i
                  style={{
                    width: `${eng.booked ? Math.round((eng.attended / eng.booked) * 100) : 0}%`,
                    background: "var(--norm)",
                  }}
                />
              </div>
            </div>
            <div className="meter">
              <div className="meterTop">
                <span className="k">Cadence held</span>
                <span className="v rc-word">{p.cadence.toLowerCase()}</span>
              </div>
              <div className="meterTrk">
                <i
                  style={{
                    width: `${Math.max(0, eng.cadence)}%`,
                    background: eng.cadence >= 85 ? "var(--norm)" : "var(--high)",
                  }}
                />
              </div>
            </div>
            <p className="rc-note">
              {ok
                ? "Engagement is intact. That is what makes the flat PHQ-9 a treatment question rather than an attendance one."
                : eng.booked === 0
                  ? "No sessions yet. Engagement starts counting at intake."
                  : eng.attended < eng.booked
                    ? `${eng.booked - eng.attended} missed ${eng.booked - eng.attended === 1 ? "session" : "sessions"} this episode.`
                    : "Every booked session attended this episode."}
            </p>
          </div>
        </section>

        <section className="card" aria-label="Details">
          <div className="cardTop">
            <h4>Details</h4>
          </div>
          {details(p, index).map((d) => (
            <button
              type="button"
              className="sideRow rc-sideBtn"
              key={d.key}
              onClick={() => open({ kind: "detail", key: d.key })}
            >
              <span>{d.label}</span>
              <span className="rc-sideVal">
                {d.short}
                <span aria-hidden="true">›</span>
              </span>
            </button>
          ))}
        </section>

        <section className="card" aria-label="Upcoming orders">
          <div className="cardTop">
            <h4>Upcoming orders</h4>
          </div>
          <div className="empty">
            <div className="ic" aria-hidden="true">
              ◷
            </div>
            No orders scheduled.
            <div className="rc-emptySub">
              Nothing is pending — this is an empty state, not a loading one.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- chronology */

type Filter = "all" | Source;

export function ChronologyPanel({ ctx }: { ctx: RecordCtx }) {
  const { store } = useNav();
  const [filter, setFilter] = React.useState<Filter>("all");
  const all = chronology(ctx.p, store.signed);
  const shown = filter === "all" ? all : all.filter((e) => e.source === filter);
  const count = (s: Source) => all.filter((e) => e.source === s).length;
  const hidden = filter === "all" ? 0 : 3;

  return (
    <div className="rc-pane">
      <PanelHeading>Chronology</PanelHeading>
      <section className="card" aria-label="Full chronology">
        <div className="cardTop rc-wrapTop">
          <h4>Chronology</h4>
          <Chips<Filter>
            label="Source"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: all.length },
              { value: "sessions", label: "Sessions", count: count("sessions") },
              { value: "measures", label: "Measures", count: count("measures") },
              { value: "medications", label: "Medications", count: count("medications") },
              { value: "safety", label: "Safety", count: count("safety") },
            ]}
          />
        </div>
        {shown.length ? (
          <div className="tl">
            <div className="tlLine" aria-hidden="true" />
            {shown.map((e) => (
              <TlItem key={e.key} when={e.when} sev={e.sev} what={e.what} sub={e.sub} />
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing from this source yet" />
        )}
        <p className="miniLegend">
          <span>
            {hidden || isOkonkwo(ctx.p) ? (
              <>
                <b className="rc-ink">This view is partial.</b>{" "}
                {[
                  hidden ? "Three sources are filtered out" : "",
                  isOkonkwo(ctx.p) ? "one is withheld under 42 CFR Part 2" : "",
                ]
                  .filter(Boolean)
                  .join(" and ")
                  .replace(/^o/, "O")}
                . The chronology says so rather than presenting itself as the record.
              </>
            ) : (
              "All four sources are shown."
            )}
          </span>
        </p>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------- measures */

export function MeasuresPanel({ ctx }: { ctx: RecordCtx }) {
  const { p } = ctx;
  const { store, patch, toast } = useNav();
  const rows = administrations(p);
  const sent = store.sent[p.id];
  const reading = response(p);

  return (
    <div className="rc-pane">
      <PanelHeading>Measures</PanelHeading>
      <section className="card" aria-label="Administrations">
        <div className="cardTop">
          <h4>Administrations</h4>
          <button
            type="button"
            className="btn primary sm"
            disabled={Boolean(sent)}
            onClick={() => {
              patch((s) => ({ ...s, sent: { ...s.sent, [p.id]: p.instrument } }));
              toast(`${p.instrument} sent to ${p.name} · ${stamp()}`);
            }}
          >
            {sent ? `Sent · ${stamp()}` : `Send ${p.instrument}`}
          </button>
        </div>
        {rows.length ? (
          <div className="dtScroll" tabIndex={0} role="region" aria-label="Administrations table">
            <table className="dt">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Instrument</th>
                  <th scope="col" className="num">
                    Score
                  </th>
                  <th scope="col">Band</th>
                  <th scope="col">Change</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <td className="mono">{r.date}</td>
                    <td className="mono">{r.instrument}</td>
                    <td className="mono num">{r.score}</td>
                    <td>
                      <Status sev={r.sev}>{r.band}</Status>
                    </td>
                    <td className={/^[↑↓]/.test(r.change) ? "mono" : undefined}>{r.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No administrations yet">
            First {p.instrument} is due at intake{booked(p) ? `, ${p.next}` : ""}.
          </EmptyState>
        )}
      </section>

      <section className="card" aria-label="Trajectory">
        <div className="cardTop">
          <h4>Trajectory</h4>
          {p.scores.length ? <Pill sev={reading.sev}>{reading.label}</Pill> : null}
        </div>
        <div className="chartWrap">{isOkonkwo(p) ? <TrajectoryOne /> : <Trajectory p={p} />}</div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- notes */

const NOTE_SEV = { signed: "norm", unsigned: "high", draft: "unk" } as const;

export function NotesPanel({ ctx }: { ctx: RecordCtx }) {
  const { p, open, drafts } = ctx;
  const { store, patch, toast, go } = useNav();
  const rows = [...drafts, ...notes(p, store.signed)];

  const sign = (id: string) => {
    patch((s) => ({ ...s, signed: { ...s.signed, [id]: true } }));
    toast("Note signed");
  };

  return (
    <div className="rc-pane">
      <PanelHeading>Notes</PanelHeading>
      <section className="card" aria-label="Session notes">
        <div className="cardTop">
          <h4>Session notes</h4>
          <span className="rc-count">{rows.length}</span>
        </div>
        {rows.length ? (
          <ul className="rc-list">
            {rows.map((n) => {
              const toNote = n.id === "okonkwo-0812" && n.status === "unsigned";
              return (
                <li key={n.id} className="rc-item rc-noteItem">
                  <button
                    type="button"
                    className="rowBtn rc-itemMain"
                    onClick={() =>
                      toNote
                        ? go({ screen: "note", patient: "okonkwo" })
                        : open({ kind: "note", note: n })
                    }
                  >
                    <span className="rc-itemDate mono">{n.date}</span>
                    <span className="rc-itemText">
                      <span className="rc-itemTitle">{n.type}</span>
                      <span className="rc-itemSub">{n.clinician}</span>
                    </span>
                    <Pill sev={NOTE_SEV[n.status]}>
                      {n.status === "unsigned"
                        ? `Unsigned · ${n.age}`
                        : n.status === "draft"
                          ? "Draft"
                          : "Signed"}
                    </Pill>
                  </button>
                  {n.status === "unsigned" && !toNote ? (
                    <button type="button" className="btn ghost sm" onClick={() => sign(n.id)}>
                      Sign
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="No notes yet">The first note is written at intake.</EmptyState>
        )}
      </section>
    </div>
  );
}

export function NoteSheetFooter({ note, onClose }: { note: NoteRow; onClose: () => void }) {
  const { store, patch, toast } = useNav();
  const unsigned = note.status === "unsigned" && !store.signed[note.id];
  return (
    <>
      <button type="button" className="btn ghost" onClick={onClose}>
        Close
      </button>
      {unsigned ? (
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            patch((s) => ({ ...s, signed: { ...s.signed, [note.id]: true } }));
            toast("Note signed");
            onClose();
          }}
        >
          Sign note
        </button>
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------- medications */

export function MedicationsPanel({ ctx }: { ctx: RecordCtx }) {
  const { p, reconciled, reconcile } = ctx;
  const list = meds(p);
  return (
    <div className="rc-pane">
      <PanelHeading>Medications</PanelHeading>
      <section className="card" aria-label="Medication list">
        <div className="cardTop">
          <h4>Medication list</h4>
          <div className="rc-actions">
            {reconciled ? (
              <Pill sev="norm">Reconciled today · {reconciled}</Pill>
            ) : list.length ? (
              <button type="button" className="btn ghost sm" onClick={reconcile}>
                Reconcile
              </button>
            ) : null}
          </div>
        </div>
        {list.length ? (
          <div className="dtScroll" tabIndex={0} role="region" aria-label="Medication list table">
            <table className="dt">
              <thead>
                <tr>
                  <th scope="col">Drug</th>
                  <th scope="col">Dose</th>
                  <th scope="col">Route</th>
                  <th scope="col">Since</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m.drug}>
                    <td className="rc-strong">{m.drug}</td>
                    <td className="mono">{m.dose}</td>
                    <td>{m.route}</td>
                    <td className="mono">{m.since}</td>
                    <td>
                      <Status sev={MED_SEV[m.status]}>
                        {m.until ? `${m.status} ${m.until}` : m.status}
                      </Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No medications recorded">Reconciliation is due at intake.</EmptyState>
        )}
        <p className="miniLegend">
          Prescriber: {CLINICIANS.tash.name}. Pharmacy: Riverside Pharmacy.
        </p>
      </section>
    </div>
  );
}

/* --------------------------------------------------------------- safety */

export function SafetyPanel({ ctx }: { ctx: RecordCtx }) {
  const { p } = ctx;
  const { store, go } = useNav();
  const risk = openRisk(p, store.resolved);
  const flagged = risk && risk.kind !== "missed-contact";
  const plan = safetyPlan(p);
  const hasPlan = p.sessions > 0;

  return (
    <div className="rc-pane">
      <PanelHeading>Safety</PanelHeading>
      {flagged ? (
        <div className="rc-callout" role="note">
          <div className="rc-grow">
            <b>{risk.what}</b>
            <div className="rc-calloutSub">
              {risk.left === "overdue" ? "Overdue" : `${risk.left} left`} · {risk.window} ·{" "}
              {CLINICIANS[risk.owner].short}
            </div>
          </div>
          <button
            type="button"
            className="btn primary sm"
            onClick={() => go({ screen: "safety", view: risk.id })}
          >
            Open in safety queue
          </button>
        </div>
      ) : null}
      <section className="card" aria-label="Safety plan">
        <div className="cardTop rc-wrapTop">
          <h4>Safety plan</h4>
          {hasPlan ? <span className="rc-soft">Last reviewed {plan.reviewed}</span> : null}
        </div>
        {hasPlan ? (
          <div className="acc">
            {plan.sections.map((s, i) => (
              <AccItem
                key={s.title}
                sev="unk"
                title={s.title}
                summary={s.summary}
                defaultOpen={i === 0}
              >
                <ul className="rc-bullets">
                  {s.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </AccItem>
            ))}
          </div>
        ) : (
          <EmptyState title="No safety plan yet">
            Written together at intake{booked(p) ? `, ${p.next}` : ""}.
          </EmptyState>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------ documents */

export function DocumentsPanel({ ctx }: { ctx: RecordCtx }) {
  const { p, open } = ctx;
  const { toast } = useNav();
  return (
    <div className="rc-pane">
      <PanelHeading>Documents</PanelHeading>
      <section className="card" aria-label="Documents on file">
        <div className="cardTop">
          <h4>Documents</h4>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => toast("File upload isn't available in this demo")}
          >
            Upload
          </button>
        </div>
        <ul className="rc-list">
          {documents(p).map((d) => (
            <li key={d.id} className="rc-item rc-docItem">
              <button
                type="button"
                className="rowBtn rc-itemMain"
                onClick={() => open({ kind: "doc", doc: d })}
              >
                <span className="rc-docIc" aria-hidden="true" />
                <span className="rc-itemText">
                  <span className="rc-itemTitle">{d.title}</span>
                  <span className="rc-itemSub">{d.onFile ? "PDF" : "No file yet"}</span>
                </span>
                <Status sev={d.sev}>{d.status}</Status>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------- billing */

const usd = (n: number) => `$${n.toFixed(2)}`;

export function BillingPanel({ ctx }: { ctx: RecordCtx }) {
  const { p } = ctx;
  const rows = claims(p);
  const outstanding = rows.filter((c) => c.status !== "paid").reduce((t, c) => t + c.amount, 0);
  return (
    <div className="rc-pane">
      <PanelHeading>Billing</PanelHeading>
      <section className="card" aria-label="Claims">
        <div className="cardTop rc-wrapTop">
          <h4>Claims</h4>
          <span className="rc-soft">
            Outstanding <b className="mono rc-ink">{usd(outstanding)}</b>
          </span>
        </div>
        {rows.length ? (
          <div className="dtScroll" tabIndex={0} role="region" aria-label="Claims table">
            <table className="dt">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">CPT</th>
                  <th scope="col">Service</th>
                  <th scope="col">Payer</th>
                  <th scope="col" className="num">
                    Amount
                  </th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.date}</td>
                    <td className="mono">{c.cpt}</td>
                    <td>{c.desc}</td>
                    <td>{c.payer}</td>
                    <td className="mono num">{usd(c.amount)}</td>
                    <td>
                      <Status sev={CLAIM_SEV[c.status]}>{c.status}</Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No claims yet">The first claim follows the intake visit.</EmptyState>
        )}
        <p className="miniLegend">One claim per session, newest first. Billed to {p.payer}.</p>
      </section>
    </div>
  );
}
