"use client";

/**
 * copilot-01 — the sourced answer.
 *
 * A clinical assistant that answers without citations is a liability, so the
 * whole design is the citation round-trip: every claim carries a source chip,
 * pressing one scrolls and flashes the row it came from, and the thread keeps
 * an audit line. The generated text is visibly generated — streamed, cursored,
 * and never styled like chart content, because the one thing worse than an
 * uncited answer is an uncited answer that looks like a record.
 */

import * as React from "react";
import { Rail, TlItem } from "./kit";

type Part = { t: string } | { cite: string; id: string };

const ANSWER: readonly Part[] = [
  { t: "Three administrations of the PHQ-9 have returned 16, 16 and 16 " },
  { cite: "PHQ-9 · 12 Aug", id: "src-phq" },
  { t: ", while the session note for the same day records improved sleep and practice adherence " },
  { cite: "Note · 12 Aug", id: "src-note" },
  {
    t: ". That pattern is worth checking at item level rather than by total, because a stable total can hide movement in opposite directions across items. Sertraline has been unchanged since February ",
  },
  { cite: "Med review · 29 Jul", id: "src-med" },
  { t: ". I cannot see anything else in this window; the chart is filtered to 90 days." },
];

export function Copilot01() {
  const [shown, setShown] = React.useState(0);
  const [chars, setChars] = React.useState(0);
  const stage = React.useRef<HTMLDivElement>(null);

  const reduce =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  React.useEffect(() => {
    if (reduce) {
      setShown(ANSWER.length);
      return;
    }
    if (shown >= ANSWER.length) return;
    const part = ANSWER[shown];
    if (!part) return;
    if ("cite" in part) {
      const id = window.setTimeout(() => setShown((s) => s + 1), 140);
      return () => window.clearTimeout(id);
    }
    if (chars >= part.t.length) {
      const id = window.setTimeout(() => {
        setShown((s) => s + 1);
        setChars(0);
      }, 0);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setChars((c) => c + 2), 14);
    return () => window.clearTimeout(id);
  }, [shown, chars, reduce]);

  const done = shown >= ANSWER.length;

  const flash = (id: string) => {
    const el = stage.current?.querySelector<HTMLElement>(`#${id}`);
    if (!el) return;
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return (
    <div className="app cop3">
      <Rail active="Patients" />
      <div className="main" ref={stage}>
        <section className="panel" style={{ flex: 1 }} aria-label="Chronology">
          <div className="panelTop">
            <div>
              <h3>Chronology · R. Okonkwo</h3>
              <p>The copilot may only cite what is on this screen</p>
            </div>
          </div>
          <div className="tl">
            <div className="tlLine" aria-hidden="true" />
            <div id="src-phq">
              <TlItem
                when="12 Aug"
                sev="crit"
                what="PHQ-9 administered — 16"
                sub="Unchanged across three administrations"
              />
            </div>
            <div id="src-note">
              <TlItem
                when="12 Aug"
                sev="norm"
                what="Individual therapy, 50 min"
                sub="Patient reports improved sleep and practice adherence"
              />
            </div>
            <div id="src-plan">
              <TlItem
                when="05 Aug"
                sev="high"
                what="Safety plan reviewed"
                sub="Previous review 41 days earlier"
              />
            </div>
            <div id="src-med">
              <TlItem
                when="29 Jul"
                sev="low"
                what="Medication review"
                sub="Sertraline 100mg · no change"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="copSide">
        <div
          style={{
            padding: "13px 14px",
            borderBottom: "1px solid var(--site-rule)",
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--site-brand)",
              display: "inline-block",
            }}
          />
          <b style={{ fontSize: 13.5 }}>Copilot</b>
          <span className="railGroup" style={{ margin: 0, padding: 0, marginLeft: "auto" }}>
            Audited
          </span>
        </div>

        <div className="cop">
          <div className="copThread">
            <div className="bubble me">
              Why has the PHQ-9 not moved when she reports improvement?
            </div>
            <div className="bubble ai" aria-live="polite">
              {ANSWER.slice(0, shown + 1).map((p, i) => {
                if (i > shown) return null;
                if ("cite" in p) {
                  if (i > shown - 1 && !done && i === shown) return null;
                  return (
                    <button
                      key={i}
                      type="button"
                      className="cite"
                      onClick={() => flash(p.id)}
                      title="Jump to the source"
                    >
                      ▸ {p.cite}
                    </button>
                  );
                }
                return <span key={i}>{i === shown ? p.t.slice(0, chars) : p.t}</span>;
              })}
              {!done ? (
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-block",
                    width: 7,
                    height: 15,
                    background: "var(--site-brand)",
                    verticalAlign: "-2px",
                  }}
                />
              ) : null}
              {done ? (
                <div className="srcCard">
                  <div className="h">
                    <b>Audit</b>
                    <span className="mono" style={{ color: "var(--site-graphite-soft)" }}>
                      3 sources · 0 uncited claims
                    </span>
                  </div>
                  <div className="b">
                    Answer composed from the four chronology rows visible on this screen. No
                    external retrieval. Thread retained with the record.
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="copDock">
            <input
              className="copInput"
              placeholder="Ask about this chart…"
              aria-label="Ask about this chart"
            />
            <button type="button" className="btn primary">
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
