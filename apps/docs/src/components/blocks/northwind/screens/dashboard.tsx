"use client";

/**
 * Dashboard — the clinical caseload at a glance.
 *
 * The reference dashboards this replaces count Total Revenue, New Customers,
 * Active Accounts and Growth Rate. Those are safe to get wrong; someone re-runs
 * the report. Every tile here is a statement about people receiving care, read
 * at a glance by someone with six minutes between sessions, so each one carries
 * its denominator, its window, and opens the list behind its number.
 */

import * as React from "react";
import { BarShare, BarTarget, RiskRow, SevRail, Status, Tile } from "../../kit";
import { FunnelPanel, TrajectoryPanel, type TrajectoryFocus } from "../../charts";
import { CLINICIANS, PATIENTS, RISKS, TRACK, patient, reading, trend } from "../data";
import { useNav } from "../shell";
import { PatientLink, Segmented, Sheet } from "../ui";

const TABLE = ["okonkwo", "almeida", "whitfield", "delacroix", "ferreira", "nakamura"] as const;

/** The lines the response panel draws, by focus, so the legend can name them. */
const DRAWN: Record<TrajectoryFocus, readonly string[]> = {
  "not-on-track": ["okonkwo", "mwangi"],
  slow: ["whitfield"],
  all: ["okonkwo", "mwangi", "whitfield", "delacroix", "chen"],
};

/** Notes open more than 48 hours. Okonkwo's, at 20 hours, is not one of them. */
const LATE_NOTES = [
  { patient: "whitfield", date: "06 Aug", age: "7d", clinician: "lake" },
  { patient: "ibrahim", date: "06 Aug", age: "7d", clinician: "lake" },
  { patient: "lindqvist", date: "10 Aug", age: "3d", clinician: "brandt" },
  { patient: "kowalski", date: "11 Aug", age: "2d", clinician: "brandt" },
] as const;

export function DashboardScreen() {
  const { go, store, toast } = useNav();
  const [focus, setFocus] = React.useState<TrajectoryFocus>("not-on-track");
  const [notesOpen, setNotesOpen] = React.useState(false);
  const [reminded, setReminded] = React.useState<Record<string, true>>({});

  const active = PATIENTS.length;
  const offTrack = PATIENTS.filter((p) => p.track === "not-on-track").length;
  const slow = PATIENTS.filter((p) => p.track === "slow").length;

  // Follow-ups logged this session join the fixed queue, in time order.
  const all = [...RISKS, ...store.logged].sort((a, b) => a.minutes - b.minutes);
  const screens = all.filter((r) => r.kind === "cssrs" || r.kind === "crisis-call");
  const openScreens = screens.filter((r) => !store.resolved[r.id]);
  const nextScreen = openScreens[0];

  const queue = all.filter((r) => !store.resolved[r.id]).slice(0, 3);
  const openCount = all.filter((r) => !store.resolved[r.id]).length;

  return (
    <div className="main">
      <div className="tiles">
        <Tile
          cap="Not on track"
          status="not responding"
          sev="crit"
          n={String(offTrack)}
          unit={`of ${active} active`}
          bar={<BarShare pct={(offTrack / active) * 100} sev="crit" />}
          footLeft="at session 8"
          footRight="↑2 this week"
          onClick={() => go({ screen: "caseload", view: "not-on-track" })}
        />
        <Tile
          cap="Risk follow-up"
          status={nextScreen ? "C-SSRS positive" : "all contacted"}
          sev={nextScreen ? "crit" : "norm"}
          n={String(openScreens.length)}
          unit={nextScreen ? `next in ${nextScreen.left}` : "open today"}
          bar={<BarShare pct={nextScreen ? nextScreen.usedPct : 0} sev="crit" />}
          footLeft={nextScreen ? `opened ${nextScreen.opened.slice(0, 6)}` : "queue clear"}
          footRight="24h window"
          onClick={() => go({ screen: "safety", ...(nextScreen ? { view: nextScreen.id } : {}) })}
        />
        <Tile
          cap="First appointment"
          status="above target"
          sev="high"
          n="11"
          unit="days median wait"
          bar={<BarTarget pct={73} target={47} sev="high" />}
          footLeft="target 7d"
          footRight="↑3 vs July"
          onClick={() => go({ screen: "reports", view: "access" })}
        />
        <Tile
          cap="Unsigned notes"
          status="over 48h"
          sev="high"
          n={String(LATE_NOTES.length)}
          unit="of 214 this week"
          bar={<BarShare pct={1.9} sev="high" />}
          footLeft="oldest 7d"
          footRight="2 clinicians"
          onClick={() => setNotesOpen(true)}
        />
      </div>

      <section className="panel" aria-labelledby="db-response">
        <div className="panelTop">
          <div>
            <h3 id="db-response">Treatment response</h3>
            <p>PHQ-9 against the band its intake score predicts · {active} patients</p>
          </div>
          <Segmented
            label="Show"
            value={focus}
            onChange={setFocus}
            options={[
              { value: "not-on-track", label: "Not on track" },
              { value: "slow", label: "Slow" },
              { value: "all", label: "All" },
            ]}
          />
        </div>
        <div className="chartWrap">
          <TrajectoryPanel focus={focus} />
        </div>
        <div className="db-legend">
          <span className="db-legendK">Drawn</span>
          {DRAWN[focus].map((id) => {
            const p = patient(id);
            return (
              <PatientLink
                key={id}
                p={p}
                size={16}
                sub={
                  <span style={{ color: `var(--${TRACK[p.track].sev}-text)` }}>{reading(p)}</span>
                }
              />
            );
          })}
          <button
            type="button"
            className="linkBtn db-legendAll"
            onClick={() => go({ screen: "caseload", ...(focus === "all" ? {} : { view: focus }) })}
          >
            {focus === "all"
              ? `All ${active} in caseload ›`
              : `All ${focus === "slow" ? slow : offTrack} ${focus === "slow" ? "slow" : "not on track"} ›`}
          </button>
        </div>
      </section>

      <div className="two">
        <section className="panel" aria-labelledby="db-risk">
          <div className="panelTop">
            <div>
              <h3 id="db-risk">Risk queue</h3>
              <p>Ordered by time remaining, not by severity label</p>
            </div>
            <button
              type="button"
              className="linkBtn seeAll"
              onClick={() => go({ screen: "safety" })}
            >
              {openCount} open ›
            </button>
          </div>
          {/*
            Ordered by time remaining. Overdue is less than four hours, which is
            less than nineteen — so the least severe row can come first, and
            that is the point: a safety plan past its review outranks a risk
            screen with most of its window still to run.
          */}
          <div className="grow" style={{ borderTop: "1px solid var(--site-rule)" }}>
            {queue.length ? (
              queue.map((r) => (
                <RiskRow
                  key={r.id}
                  sev={r.sev}
                  who={patient(r.patient).name}
                  what={r.what}
                  opened={r.opened}
                  owner={CLINICIANS[r.owner].short}
                  left={r.left}
                  usedPct={r.usedPct}
                  windowLabel={r.window}
                  onClick={() => go({ screen: "safety", view: r.id })}
                />
              ))
            ) : (
              <div className="empty">
                <b className="emptyTitle">Queue clear</b>
                <div className="emptyText">Every follow-up has a recorded contact.</div>
              </div>
            )}
          </div>
          <p className="miniLegend">
            Each row carries how much of its window has gone, because 19h left means one thing on a
            24-hour window and another on a 60-day one.
          </p>
        </section>

        <section className="panel" aria-labelledby="db-funnel">
          <div className="panelTop">
            <div>
              <h3 id="db-funnel">Engagement funnel</h3>
              <p>Referral to session three · last 90 days</p>
            </div>
            <button
              type="button"
              className="linkBtn seeAll"
              onClick={() => go({ screen: "reports", view: "engagement" })}
            >
              Report ›
            </button>
          </div>
          <div className="chartWrap grow">
            <FunnelPanel />
          </div>
          <p className="miniLegend">
            The wall is between session one and three — where behavioral health loses people, and
            where a clinic-wide no-show rate hides it.
          </p>
        </section>
      </div>

      <section className="panel" aria-labelledby="db-caseload">
        <div className="panelTop">
          <div>
            <h3 id="db-caseload">Caseload</h3>
            <p>Ordered by attention needed, not by name</p>
          </div>
          <button
            type="button"
            className="linkBtn seeAll"
            onClick={() => go({ screen: "caseload" })}
          >
            All {active} active ›
          </button>
        </div>
        {/* Its own scroller: five columns do not fit a phone. */}
        <div className="dtScroll">
          <table className="dt">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Instrument</th>
                <th>Trend</th>
                <th>Sessions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {TABLE.map((id) => {
                const p = patient(id);
                const t = TRACK[p.track];
                return (
                  <tr
                    key={id}
                    className="clickable"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("button")) return;
                      go({ screen: "record", patient: id });
                    }}
                  >
                    <td>
                      <span className="db-who">
                        <SevRail
                          sev={t.sev === "norm" && p.track === "remission" ? "norm" : t.sev}
                        />
                        <PatientLink p={p} size={18} />
                      </span>
                    </td>
                    <td className="mono">{reading(p)}</td>
                    <td className="mono">{trend(p)}</td>
                    <td className="mono">{p.sessions}</td>
                    <td>
                      <Status sev={t.sev}>{t.label}</Status>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Sheet
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        title="Unsigned notes over 48 hours"
        sub={`${LATE_NOTES.length} notes · 2 clinicians · oldest 7 days`}
        footer={
          <button type="button" className="btn ghost" onClick={() => setNotesOpen(false)}>
            Done
          </button>
        }
      >
        <div className="sheetSection">
          <h4>Open notes</h4>
          {LATE_NOTES.map((n) => {
            const p = patient(n.patient);
            const mine = n.clinician === "lake";
            const key = `${n.patient}-${n.date}`;
            return (
              <div className="db-noteRow" key={key}>
                <PatientLink
                  p={p}
                  size={22}
                  sub={`Session ${n.date} · ${CLINICIANS[n.clinician].short}`}
                />
                <span className="db-noteAge">{n.age}</span>
                {mine ? (
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => {
                      setNotesOpen(false);
                      go({ screen: "record", patient: p.id, view: "notes" });
                    }}
                  >
                    Open
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn ghost sm"
                    disabled={Boolean(reminded[key])}
                    onClick={() => {
                      setReminded((r) => ({ ...r, [key]: true }));
                      toast(`Reminder sent to ${CLINICIANS[n.clinician].short} · ${p.name}`);
                    }}
                  >
                    {reminded[key] ? "Reminded" : "Remind"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="sheetSection">
          <h4>Under 48 hours</h4>
          {/* The same row as above, so the one note still in time reads as one of the set. */}
          <div className="db-noteRow">
            <PatientLink
              p={patient("okonkwo")}
              size={22}
              sub={`Session 12 Aug · ${CLINICIANS.lake.short}`}
            />
            {store.signed["okonkwo-0812"] ? (
              <span className="db-noteAge db-noteSigned">Signed</span>
            ) : (
              <>
                <span className="db-noteAge db-noteFresh">20h</span>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => {
                    setNotesOpen(false);
                    go({ screen: "note", patient: "okonkwo" });
                  }}
                >
                  Open
                </button>
              </>
            )}
          </div>
        </div>
      </Sheet>
    </div>
  );
}
