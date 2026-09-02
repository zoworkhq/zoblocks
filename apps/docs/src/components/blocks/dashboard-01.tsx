"use client";

/**
 * dashboard-01 — clinical caseload.
 *
 * The reference dashboards this replaces count Total Revenue, New Customers,
 * Active Accounts and Growth Rate. Those are safe to get wrong; someone re-runs
 * the report. Every tile here is a statement about people receiving care, read
 * at a glance by someone with six minutes between sessions, so each one carries
 * its denominator, its window, and one line of what to do.
 */

import { BarShare, BarTarget, Face, Rail, RiskRow, Seg, SevRail, Status, Tile } from "./kit";
import { facesFor } from "@/lib/faces";
import { FunnelPanel, TrajectoryPanel } from "./charts";

const CASELOAD: readonly (readonly [string, string, string, string, string, string, string])[] = [
  ["crit", "R. Okonkwo", "PHQ-9 16", "flat", "8", "not on track", "crit"],
  ["crit", "T. Almeida", "GAD-7 15", "↑ 2", "5", "not on track", "crit"],
  ["high", "J. Whitfield", "PHQ-9 11", "↓ 3", "12", "slow response", "high"],
  ["norm", "M. Delacroix", "PHQ-9 6", "↓ 9", "9", "responding", "norm"],
  ["norm", "S. Ferreira", "GAD-7 4", "↓ 11", "14", "remission", "norm"],
  ["unk", "A. Nakamura", "—", "—", "1", "awaiting baseline", "unk"],
];

/* One face each: `faceFor` alone collides at this list length. */
const FACE = facesFor(CASELOAD.map((row) => row[1]));

export function Dashboard01() {
  return (
    <div className="app">
      <Rail active="Dashboard" />
      <div className="main">
        <div className="tiles">
          <Tile
            cap="not on track"
            status="not responding"
            sev="crit"
            n="7"
            unit="of 68 active"
            bar={<BarShare pct={10.3} sev="crit" />}
            footLeft="measured to session 8"
            footRight="↑2 since last week"
          />
          <Tile
            cap="Risk follow-up due"
            status="C-SSRS positive"
            sev="crit"
            n="2"
            unit="next in 4h 12m"
            bar={<BarShare pct={83} sev="crit" />}
            footLeft="opened 12 Aug"
            footRight="24h window"
          />
          <Tile
            cap="First appointment"
            status="above target"
            sev="high"
            n="11"
            unit="days, median 30d"
            bar={<BarTarget pct={73} target={47} sev="high" />}
            footLeft="target 7d"
            footRight="↑3 vs last month"
          />
          <Tile
            cap="Notes unsigned"
            status="over 48h"
            sev="high"
            n="4"
            unit="of 214 this week"
            bar={<BarShare pct={1.9} sev="high" />}
            footLeft="oldest 5d"
            footRight="2 clinicians"
          />
        </div>

        <section className="panel" aria-label="Treatment response">
          <div className="panelTop">
            <div>
              <h3>Treatment response</h3>
              <p>PHQ-9 against the band predicted by intake severity · 68 patients</p>
            </div>
            <Seg options={["not on track", "All", "New"]} />
          </div>
          <div className="chartWrap">
            <TrajectoryPanel />
          </div>
        </section>

        <div className="two">
          <section className="panel" aria-label="Risk queue">
            <div className="panelTop">
              <div>
                <h3>Risk queue</h3>
                <p>Ordered by time remaining, not by severity label</p>
              </div>
            </div>
            <div className="grow" style={{ borderTop: "1px solid var(--site-rule)" }}>
              <RiskRow
                sev="crit"
                who="R. Okonkwo"
                what="C-SSRS positive"
                opened="12 Aug 14:20"
                owner="E. Lake"
                left="4h 12m"
                usedPct={83}
                windowLabel="24h window"
              />
              <RiskRow
                sev="crit"
                who="D. Mwangi"
                what="C-SSRS positive"
                opened="11 Aug 09:05"
                owner="J. Tashpulatov"
                left="19h"
                usedPct={21}
                windowLabel="24h window"
              />
              <RiskRow
                sev="high"
                who="S. Ferreira"
                what="Safety plan 62 days old"
                opened="11 Jun"
                owner="E. Lake"
                left="overdue"
                usedPct={100}
                windowLabel="60d review"
              />
            </div>
            <p className="miniLegend">
              A red count with no clock is wallpaper. Each row carries how much of its window has
              already gone, because 19h left means one thing on a 24-hour window and another on a
              60-day one.
            </p>
          </section>

          <section className="panel" aria-label="Engagement funnel">
            <div className="panelTop">
              <div>
                <h3>Engagement funnel</h3>
                <p>Referral to session three · last 90 days</p>
              </div>
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

        <section className="panel" aria-label="Caseload">
          <div className="panelTop">
            <div>
              <h3>Caseload</h3>
              <p>Ordered by attention needed, not by name</p>
            </div>
            <span className="seeAll">68 active</span>
          </div>
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
              {CASELOAD.map((r) => (
                <tr key={r[1]}>
                  <td>
                    <SevRail sev={r[0] as never} />
                    <span className="whoCell">
                      <Face name={r[1]} src={FACE(r[1])} />
                      {r[1]}
                    </span>
                  </td>
                  <td className="mono">{r[2]}</td>
                  <td className="mono">{r[3]}</td>
                  <td className="mono">{r[4]}</td>
                  <td>
                    <Status sev={r[6] as never}>{r[5]}</Status>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
