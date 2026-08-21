"use client";

/**
 * patient-01 — the record.
 *
 * Two things here that a conventional chart header cannot express, and each
 * one is the reason this block exists rather than a nicer-looking version of
 * what already ships:
 *
 *   - a record section that is *present and withheld* under 42 CFR Part 2,
 *     rather than deleted — removing the row claims the chart is complete;
 *   - instrument cards that carry a scale, a trajectory and a next-due date,
 *     where the reference shows a score and a delta arrow.
 */

import { AccItem, Instrument, ListRow, Pill, Rail, TabBar, TlItem } from "./kit";
import { TrajectoryOne } from "./charts";

function Fact({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="fact">
      <div className="fk">{k}</div>
      <div className="fv">{children}</div>
    </div>
  );
}

const TABS = [
  "Overview",
  "Chronology",
  "Instruments",
  "Notes",
  "Medications",
  "Safety",
  "Documents",
  "Billing",
] as const;

export function Patient01() {
  return (
    <div className="app">
      <Rail active="Patients" />
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div className="crumbs">
          Patients <span aria-hidden="true">›</span> <b>Okonkwo, Rachel</b>
        </div>

        <div className="ptHead">
          <div className="ptAvatar" aria-hidden="true">
            RO
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="nameRow">
              <h3>Okonkwo, Rachel</h3>
              <Pill sev="norm">In treatment</Pill>
              <Pill sev="crit">Risk review due 4h</Pill>
            </div>
            <div className="idline">
              <span>MRN 40-118-227</span>
              <span>DOB 1991-03-14 · 35y</span>
              <span>She/her</span>
            </div>
          </div>
          <div className="btnRow" style={{ display: "flex", gap: 7 }}>
            <button type="button" className="btn ghost">
              Message
            </button>
            <button type="button" className="btn primary">
              Start note
            </button>
          </div>
        </div>

        <div className="ptFacts">
          <Fact k="Episode">Ep-2026-0118 · week 9 of 16</Fact>
          <Fact k="Primary clinician">E. Lake, LCSW</Fact>
          <Fact k="Modality">Telehealth · weekly</Fact>
          <Fact k="Consent on file">Treatment · 12 Feb 2026</Fact>
          <Fact k="Allergies">
            <span style={{ color: "var(--crit)" }}>Sertraline — rash</span> · 1 more
          </Fact>
        </div>

        <TabBar tabs={TABS} />

        <div className="cols">
          <div className="colStack">
            <section className="card" aria-label="Measures">
              <div className="cardTop">
                <h4>Measures</h4>
                <span className="seeAll">Compare all ›</span>
              </div>
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
              <p className="miniLegend">
                Scale position is drawn against the instrument&rsquo;s own range, not a percentage.
                Sparkline is the last six administrations.
              </p>
            </section>

            <section className="card" aria-label="Treatment response">
              <div className="cardTop">
                <h4>Treatment response</h4>
                <Pill sev="crit">Above expected band since S5</Pill>
              </div>
              <div className="chartWrap">
                <TrajectoryOne />
              </div>
              <p className="miniLegend">
                The reading a delta arrow cannot give you: the score fell 2 points, and that is
                still failure.
              </p>
            </section>

            <div className="two">
              <section className="card" aria-label="Problem list">
                <div className="cardTop">
                  <h4>Problem list</h4>
                  <span className="seeAll">See all ›</span>
                </div>
                <ListRow
                  sev="crit"
                  title="Major depressive disorder, recurrent"
                  code="F33.1"
                  meta="since Feb 2026 · focus of treatment"
                  status="active"
                  statusSev="crit"
                />
                <ListRow
                  sev="high"
                  title="Generalised anxiety disorder"
                  code="F41.1"
                  meta="since Feb 2026"
                  status="improving"
                  statusSev="high"
                />
                <ListRow
                  sev="low"
                  title="Insomnia"
                  code="G47.00"
                  meta="since Mar 2026"
                  status="secondary"
                  statusSev="low"
                />
              </section>

              <section className="card" aria-label="Medications">
                <div className="cardTop">
                  <h4>Medications</h4>
                  <span className="seeAll">See all ›</span>
                </div>
                <ListRow
                  sev="low"
                  title="Sertraline 100 mg"
                  meta="oral, daily · since 12 Feb · unchanged at review"
                  status="active"
                  statusSev="low"
                />
                <ListRow
                  sev="high"
                  title="Trazodone 50 mg"
                  meta="oral, at night · started 05 Aug"
                  status="new"
                  statusSev="high"
                />
                <ListRow
                  sev="unk"
                  title="Zolpidem 5 mg"
                  meta="oral · discontinued 05 Aug"
                  status="stopped"
                  statusSev="unk"
                />
              </section>
            </div>

            <section className="card" aria-label="Chronology">
              <div className="cardTop">
                <h4>Chronology</h4>
                <Pill sev="unk">90 days · 3 sources · 2 filters</Pill>
              </div>
              <div className="tl">
                <div className="tlLine" aria-hidden="true" />
                <TlItem
                  when="12 Aug"
                  sev="crit"
                  what="PHQ-9 administered — 16"
                  sub="Third consecutive administration without movement"
                />
                <TlItem
                  when="12 Aug"
                  sev="crit"
                  what="C-SSRS positive — ideation, no plan"
                  sub="Safety plan updated same session"
                />
                <TlItem
                  when="12 Aug"
                  sev="norm"
                  what="Individual therapy, 50 min"
                  sub="E. Lake · note unsigned"
                />
                <TlItem
                  when="05 Aug"
                  sev="high"
                  what="Safety plan reviewed"
                  sub="Previous review 41 days earlier"
                />
                <TlItem
                  when="29 Jul"
                  sev="low"
                  what="Medication review"
                  sub="Sertraline continued at 100 mg"
                />
              </div>
              <p className="miniLegend">
                <span>
                  <b style={{ color: "var(--site-ink)" }}>This view is partial.</b> Two sources are
                  filtered out and one is withheld. The chronology says so rather than presenting
                  itself as the record.
                </span>
              </p>
            </section>

            <section className="card" aria-label="Record sections">
              <div className="cardTop">
                <h4>Record sections</h4>
              </div>
              <div className="acc">
                <AccItem
                  sev="crit"
                  title="Risk assessment"
                  summary="C-SSRS positive · follow-up due in 4h"
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
                    <div style={{ marginTop: 9 }}>
                      <button
                        type="button"
                        className="btn ghost"
                        style={{ fontSize: 12, padding: "6px 11px" }}
                      >
                        Request access with reason
                      </button>
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
              </div>
            </section>
          </div>

          <div className="colStack">
            <section className="card" aria-label="Next contact">
              <div className="cardTop">
                <h4>Next contact</h4>
              </div>
              <div style={{ padding: "13px 14px" }}>
                <div style={{ fontSize: 20, fontWeight: 640, letterSpacing: "-.03em" }}>
                  Thu 14 Aug
                </div>
                <div style={{ color: "var(--site-graphite)", fontSize: 12.5, marginTop: 3 }}>
                  14:00 · Telehealth · 50 min
                </div>
                <div
                  style={{
                    marginTop: 11,
                    padding: "9px 11px",
                    borderRadius: 9,
                    background: "var(--crit-bg)",
                    border: "1px solid color-mix(in srgb, var(--crit) 30%, transparent)",
                    fontSize: 11.5,
                  }}
                >
                  <b style={{ color: "var(--crit)" }}>Risk follow-up is due before this.</b> 4h 12m
                  remaining.
                </div>
              </div>
            </section>

            <section className="card" aria-label="Care team">
              <div className="cardTop">
                <h4>Care team</h4>
              </div>
              {(
                [
                  ["EL", "E. Lake, LCSW", "Primary clinician · Northwind", "On call"],
                  ["JT", "J. Tashpulatov, MD", "Prescriber · Northwind", ""],
                  ["MD", "M. Delacroix", "Care coordinator", ""],
                ] as const
              ).map(([ini, name, role, tag]) => (
                <div className="teamRow" key={name}>
                  <div className="tAv" aria-hidden="true">
                    {ini}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 545 }}>{name}</div>
                    <div style={{ color: "var(--site-graphite-soft)", fontSize: 11 }}>{role}</div>
                  </div>
                  {tag ? <Pill sev="norm">{tag}</Pill> : null}
                </div>
              ))}
            </section>

            <section className="card" aria-label="Engagement">
              <div className="cardTop">
                <h4>Engagement</h4>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div className="meter">
                  <div className="meterTop">
                    <span className="k">Sessions attended</span>
                    <span className="v">11 of 13</span>
                  </div>
                  <div className="meterTrk">
                    <i style={{ width: "85%", background: "var(--norm)" }} />
                  </div>
                </div>
                <div className="meter">
                  <div className="meterTop">
                    <span className="k">Cadence held</span>
                    <span className="v">weekly</span>
                  </div>
                  <div className="meterTrk">
                    <i style={{ width: "92%", background: "var(--norm)" }} />
                  </div>
                </div>
                <p style={{ fontSize: 11.5, color: "var(--site-graphite)", marginTop: 12 }}>
                  Engagement is intact. That is what makes the flat PHQ-9 a treatment question
                  rather than an attendance one.
                </p>
              </div>
            </section>

            <section className="card" aria-label="Details">
              <div className="cardTop">
                <h4>Details</h4>
              </div>
              {(
                [
                  ["Contact", "mobile"],
                  ["Insurance", "verified"],
                  ["Emergency contact", "1 listed"],
                  ["Pharmacy", "Riverside"],
                ] as const
              ).map(([k, v]) => (
                <div className="sideRow" key={k}>
                  <span>{k}</span>
                  <span
                    style={{
                      display: "flex",
                      gap: 9,
                      alignItems: "center",
                      color: "var(--site-graphite-soft)",
                      fontSize: 12,
                    }}
                  >
                    {v}
                    <span aria-hidden="true">›</span>
                  </span>
                </div>
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
                <div style={{ marginTop: 5, fontSize: 11.5 }}>
                  Nothing is pending — this is an empty state, not a loading one.
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
