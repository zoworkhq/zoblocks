"use client";

/**
 * Copilot — the sourced answer.
 *
 * A clinical assistant that answers without citations is a liability, so the
 * whole design is the citation round-trip: every claim carries a source chip,
 * pressing one scrolls and flashes the row it came from, and the thread keeps
 * an audit line. It may only cite what is on this screen; a question the rows
 * cannot answer gets that said plainly rather than a guess.
 */

import * as React from "react";
import { TlItem } from "../../kit";
import { stamp, useNav } from "../shell";
import { ScreenHead } from "../ui";

type Part = { t: string } | { cite: string; id: string };

interface Turn {
  q: string;
  parts: readonly Part[];
  at: string;
}

const FIRST: Turn = {
  q: "Why has the PHQ-9 not moved when she reports improvement?",
  at: "10:02",
  parts: [
    { t: "Three administrations of the PHQ-9 have returned 16, 16 and 16 " },
    { cite: "PHQ-9 · 12 Aug", id: "src-phq" },
    {
      t: ", while the session note for the same day records improved sleep and practice adherence ",
    },
    { cite: "Note · 12 Aug", id: "src-note" },
    {
      t: ". That pattern is worth checking at item level rather than by total, because a stable total can hide movement in opposite directions across items. Sertraline has been unchanged since February ",
    },
    { cite: "Med review · 29 Jul", id: "src-med" },
    { t: ". I cannot see anything else in this window; the chart is filtered to 90 days." },
  ],
};

const SUGGESTED = [
  "What changed in her medication?",
  "When was the safety plan last reviewed?",
  "Summarise the last session",
] as const;

/**
 * Canned, because this is a demo with no model behind it. The routing is by
 * topic, and the fallback is the honest answer: the rows do not say.
 */
function answer(q: string): readonly Part[] {
  const s = q.toLowerCase();
  if (/(med|sertraline|trazodone|dose|prescri)/.test(s)) {
    return [
      { t: "Sertraline 100 mg has been continued unchanged since February " },
      { cite: "Med review · 29 Jul", id: "src-med" },
      {
        t: ". No row on this screen records a dose change or a new prescription, so I cannot say whether anything else was started.",
      },
    ];
  }
  if (/(safety|plan|risk|suicid|c-ssrs|cssrs)/.test(s)) {
    return [
      { t: "The safety plan was last reviewed on 05 Aug " },
      { cite: "Safety plan · 05 Aug", id: "src-plan" },
      {
        t: ", 41 days after the review before it. Any screen after that date is outside the rows I can see, so I have not used it.",
      },
    ];
  }
  if (/(session|note|summar|last visit|therapy)/.test(s)) {
    return [
      { t: "The 12 Aug session was 50 minutes of individual therapy " },
      { cite: "Note · 12 Aug", id: "src-note" },
      { t: ". She reported better sleep and practice adherence; the PHQ-9 taken that day was 16 " },
      { cite: "PHQ-9 · 12 Aug", id: "src-phq" },
      { t: ", unchanged from the two before it." },
    ];
  }
  return [
    {
      t: "None of the four rows on this screen covers that, so I will not answer it. Ask about her measures, medication, safety plan or last session, or widen the chart filter.",
    },
  ];
}

const citations = (parts: readonly Part[]) => parts.filter((p) => "cite" in p).length;

export function CopilotScreen() {
  const { go, back } = useNav();
  const [turns, setTurns] = React.useState<Turn[]>([FIRST]);
  const [shown, setShown] = React.useState(0);
  const [chars, setChars] = React.useState(0);
  const [draft, setDraft] = React.useState("");
  const stage = React.useRef<HTMLDivElement>(null);
  const thread = React.useRef<HTMLDivElement>(null);
  const [reduce, setReduce] = React.useState(false);

  React.useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const current = turns[turns.length - 1]!;
  const parts = current.parts;
  const done = reduce || shown >= parts.length;

  React.useEffect(() => {
    if (reduce || shown >= parts.length) return;
    const part = parts[shown];
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
  }, [shown, chars, reduce, parts]);

  // Follow the answer as it streams.
  React.useEffect(() => {
    const el = thread.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns.length, shown, chars]);

  const ask = (q: string) => {
    const text = q.trim();
    if (!text || !done) return;
    setTurns((t) => [...t, { q: text, parts: answer(text), at: stamp(t.length) }]);
    setShown(0);
    setChars(0);
    setDraft("");
  };

  const flash = (id: string) => {
    const el = stage.current?.querySelector<HTMLElement>(`#${id}`);
    if (!el) return;
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
    el.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  };

  const renderParts = (list: readonly Part[], live: boolean) =>
    list.map((p, i) => {
      if (live && i > shown) return null;
      if ("cite" in p) {
        if (live && i === shown && !done) return null;
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
      return <span key={i}>{live && i === shown && !done ? p.t.slice(0, chars) : p.t}</span>;
    });

  const audit = (list: readonly Part[]) => (
    <div className="srcCard">
      <div className="h">
        <b>Audit</b>
        <span className="mono" style={{ color: "var(--site-graphite-soft)" }}>
          {citations(list)} {citations(list) === 1 ? "source" : "sources"} · 0 uncited claims
        </span>
      </div>
      <div className="b">
        {citations(list)
          ? "Composed from the chronology rows on this screen. No external retrieval."
          : "Declined: no row on this screen supports an answer."}{" "}
        Thread retained with the record.
      </div>
    </div>
  );

  return (
    <>
      <ScreenHead
        crumbs={
          <>
            <button type="button" onClick={() => go({ screen: "patients" })}>
              Patients
            </button>
            <span aria-hidden="true">›</span>
            <button type="button" onClick={() => back({ screen: "record", patient: "okonkwo" })}>
              Okonkwo, Rachel
            </button>
            <span aria-hidden="true">›</span>
            <b>Copilot</b>
          </>
        }
        title="Ask about this chart"
        sub="Answers cite the rows on screen, and nothing else"
        actions={
          <button
            type="button"
            className="btn ghost"
            onClick={() => go({ screen: "record", patient: "okonkwo" })}
          >
            Open record
          </button>
        }
      />
      <div className="copGrid">
        <div className="main" ref={stage}>
          <section className="panel" aria-labelledby="cp-chron">
            <div className="panelTop">
              <div>
                <h3 id="cp-chron">Chronology · R. Okonkwo</h3>
                <p>The copilot may only cite what is on this screen</p>
              </div>
              <button
                type="button"
                className="linkBtn seeAll"
                onClick={() => go({ screen: "record", patient: "okonkwo", view: "chronology" })}
              >
                Full chronology ›
              </button>
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
            <p className="miniLegend">
              Filtered to 90 days · 4 rows · the copilot sees exactly these.
            </p>
          </section>
        </div>

        <div className="copSide">
          <div className="cp-head">
            <span className="cp-dot" aria-hidden="true" />
            <b>Copilot</b>
            <span className="railGroup cp-audited">Audited</span>
          </div>

          <div className="cop">
            <div className="copThread" ref={thread}>
              {turns.map((turn, n) => {
                const live = n === turns.length - 1;
                return (
                  <React.Fragment key={n}>
                    <div className="bubble me">{turn.q}</div>
                    <div className="bubble ai" aria-live={live ? "polite" : undefined}>
                      {renderParts(turn.parts, live)}
                      {live && !done ? <span aria-hidden="true" className="cp-caret" /> : null}
                      {!live || done ? audit(turn.parts) : null}
                    </div>
                  </React.Fragment>
                );
              })}
              {done ? (
                <div className="chips cp-suggest" role="group" aria-label="Suggested questions">
                  {SUGGESTED.filter((q) => !turns.some((t) => t.q === q)).map((q) => (
                    <button key={q} type="button" className="chip" onClick={() => ask(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <form
              className="copDock"
              onSubmit={(e) => {
                e.preventDefault();
                ask(draft);
              }}
            >
              <input
                className="copInput"
                placeholder="Ask about this chart…"
                aria-label="Ask about this chart"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit" className="btn primary" disabled={!draft.trim() || !done}>
                Ask
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
