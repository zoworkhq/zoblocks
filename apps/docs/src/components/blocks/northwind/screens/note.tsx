"use client";

/**
 * Progress note — a note that knows where its text came from.
 *
 * One passage is copied forward from last week and contradicted by the
 * paragraph after it. That is the whole reason the signing gate exists: a
 * signature attests that you read what you are signing, and the meter makes
 * that precondition visible instead of a refusal at the last click.
 */

import * as React from "react";
import { Check } from "lucide-react";
import { AttnRow, Instrument, Pill } from "../../kit";
import { stamp, useNav } from "../shell";
import { ScreenHead } from "../ui";

const NOTE_ID = "okonkwo-0812";

type Origin = { cls: string; label: string };

const ORIGIN: Record<string, Origin> = {
  tmpl: { cls: "pv-tmpl", label: "Template · CBT session skeleton" },
  dict: { cls: "pv-dict", label: "Dictated · 12 Aug 14:32" },
  typed: { cls: "", label: "Typed directly" },
  fwd: { cls: "pv-fwd", label: "Copied forward · note of 05 Aug — REVIEW" },
  ai: { cls: "pv-ai", label: "Copilot draft · accepted by clinician, 12 Aug 15:04" },
};

function Prov({
  o,
  children,
  onHover,
}: {
  o: keyof typeof ORIGIN;
  children: React.ReactNode;
  onHover: (s: string | null) => void;
}) {
  const origin = ORIGIN[o];
  if (!origin) return <>{children}</>;
  return (
    <span
      className={`prov ${origin.cls}`}
      onMouseEnter={() => onHover(origin.label)}
      onMouseLeave={() => onHover(null)}
      // A finger has no hover: a tap names the origin and it stays named.
      onClick={() => onHover(origin.label)}
      onFocus={() => onHover(origin.label)}
      onBlur={() => onHover(null)}
      tabIndex={0}
      title={origin.label}
    >
      {children}
    </span>
  );
}

const HINT = "Hover or tap a passage for its origin";

export function NoteScreen() {
  const { go, back, store, patch, toast } = useNav();
  const [hint, setHint] = React.useState(HINT);
  const [read, setRead] = React.useState(0);
  const signed = Boolean(store.signed[NOTE_ID]);
  const [draftAt, setDraftAt] = React.useState<string | null>(null);
  const [signedAt, setSignedAt] = React.useState(stamp());
  const body = React.useRef<HTMLDivElement>(null);

  const measure = React.useCallback(() => {
    const el = body.current;
    if (!el) return;
    const range = el.scrollHeight - el.clientHeight;
    const ratio = range <= 2 ? 1 : Math.min(1, el.scrollTop / range);
    setRead((prev) => Math.max(prev, ratio));
  }, []);

  // Measured after layout rather than during render: before the first frame
  // scrollHeight and clientHeight are equal, which reads as "fully read" and
  // opens the gate on a note nobody has seen.
  React.useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(measure));
    return () => cancelAnimationFrame(id);
  }, [measure]);

  const canSign = read > 0.985;
  const onHover = (s: string | null) => setHint(s ?? HINT);

  const sign = () => {
    setSignedAt(stamp());
    patch((s) => ({ ...s, signed: { ...s.signed, [NOTE_ID]: true } }));
    toast(`Note signed · E. Lake · ${stamp()}`);
  };

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
            <b>Progress note</b>
          </>
        }
        title="Progress note · 12 Aug 2026"
        sub="Individual therapy, 50 min · CPT 90834 · E. Lake"
        actions={
          <>
            <button
              type="button"
              className="btn ghost"
              onClick={() => go({ screen: "copilot", patient: "okonkwo" })}
            >
              Ask copilot
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => go({ screen: "record", patient: "okonkwo" })}
            >
              Open record
            </button>
          </>
        }
      />
      <div className="main">
        <section className="panel" aria-labelledby="nt-note">
          <div className="panelTop">
            <div>
              <h3 id="nt-note">Session note</h3>
              <p>Every passage records where its text came from</p>
            </div>
            <Pill sev={signed ? "norm" : "high"}>{signed ? "Signed" : "Unsigned · 20h"}</Pill>
          </div>

          <div className="note" ref={body} onScroll={measure}>
            <p>
              <Prov o="tmpl" onHover={onHover}>
                Session began with a review of the between-session practice.
              </Prov>{" "}
              <Prov o="dict" onHover={onHover}>
                Patient reported that the thought record was completed on four of seven days, and
                described the fourth entry as the one that shifted something.
              </Prov>{" "}
              <Prov o="typed" onHover={onHover}>
                Affect was brighter than at intake and congruent.
              </Prov>
            </p>
            <p style={{ marginTop: 12 }}>
              <Prov o="fwd" onHover={onHover}>
                Sleep remains disrupted, averaging four to five hours, with early waking.
              </Prov>{" "}
              <Prov o="typed" onHover={onHover}>
                This was contradicted in session: patient now reports six hours and one early waking
                in the last week.
              </Prov>
            </p>
            <p style={{ marginTop: 12 }}>
              <Prov o="ai" onHover={onHover}>
                PHQ-9 administered at the start of session: 16, unchanged from session 6. Score has
                not moved in three administrations despite reported behavioural gains.
              </Prov>
            </p>
            <p style={{ marginTop: 12 }}>
              <Prov o="typed" onHover={onHover}>
                Plan: continue weekly. Given the flat PHQ-9 against reported improvement, will
                review the measure with the patient next session to check for item-level masking,
                and consult in supervision on Thursday.
              </Prov>
            </p>
          </div>

          <div className="legend">
            <span>
              <i className="sw" style={{ border: "1px solid var(--site-rule-strong)" }} />
              Typed
            </span>
            <span>
              <i
                className="sw"
                style={{ background: "color-mix(in srgb, var(--low) 35%, transparent)" }}
              />
              Dictated
            </span>
            <span>
              <i
                className="sw"
                style={{ background: "color-mix(in srgb, var(--unk) 35%, transparent)" }}
              />
              Template
            </span>
            <span>
              <i
                className="sw"
                style={{ background: "color-mix(in srgb, var(--high) 35%, transparent)" }}
              />
              Copied forward
            </span>
            <span>
              <i
                className="sw"
                style={{ background: "color-mix(in srgb, var(--site-brand) 35%, transparent)" }}
              />
              Copilot draft
            </span>
            <span style={{ marginLeft: "auto", color: "var(--site-graphite-soft)" }}>{hint}</span>
          </div>

          <div className="signBar">
            <div className="readMeter">
              <p className="railGroup" style={{ margin: 0, padding: "0 0 5px" }}>
                Read <span className="mono">{Math.round(read * 100)}%</span>
              </p>
              <div className="bar">
                <i style={{ width: `${read * 100}%` }} />
              </div>
            </div>
            {signed ? (
              // Signed is a state, not a disabled button: nothing here is waiting.
              <p className="nt-signed">
                <Check aria-hidden="true" size={14} strokeWidth={2} />
                Signed by E. Lake at {signedAt} · locked
              </p>
            ) : (
              <div className="nt-actions">
                {draftAt ? (
                  <span className="nt-saved">
                    Draft saved <span className="mono">{draftAt}</span>
                  </span>
                ) : canSign ? null : (
                  <span className="nt-saved" id="nt-gate">
                    Read to the end to sign
                  </span>
                )}
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    setDraftAt(stamp());
                    toast("Draft saved");
                  }}
                >
                  Save draft
                </button>
                <button
                  type="button"
                  className="btn primary"
                  disabled={!canSign}
                  aria-describedby={canSign ? undefined : "nt-gate"}
                  onClick={sign}
                >
                  Sign note
                </button>
              </div>
            )}
          </div>
        </section>

        <div className="two">
          <section className="panel" aria-labelledby="nt-measure">
            <div className="panelTop">
              <div>
                <h3 id="nt-measure">Measure taken this session</h3>
                <p>Rendered from the instrument, not retyped into prose</p>
              </div>
              <button
                type="button"
                className="linkBtn seeAll"
                onClick={() => go({ screen: "record", patient: "okonkwo", view: "measures" })}
              >
                History ›
              </button>
            </div>
            <div style={{ padding: "12px 14px" }}>
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
            </div>
            <p className="miniLegend">
              A score typed into a note is a number. A score linked to the instrument is a
              measurement with a date, a scale and a trend.
            </p>
          </section>

          <section className="panel" aria-labelledby="nt-sup">
            <div className="panelTop">
              <div>
                <h3 id="nt-sup">Raised for supervision</h3>
                <p>Supervision with P. Osei · today</p>
              </div>
              <button
                type="button"
                className="linkBtn seeAll"
                onClick={() => go({ screen: "schedule" })}
              >
                Schedule ›
              </button>
            </div>
            <div style={{ borderTop: "1px solid var(--site-rule)" }}>
              <AttnRow
                sev="high"
                text="Flat PHQ-9 against reported functional gain"
                who="to discuss"
                clock="14:00"
              />
              <AttnRow
                sev="unk"
                text="Copied-forward sleep line contradicted in session"
                who="resolved in note"
                clock="12 Aug"
              />
            </div>
            <p className="miniLegend">
              The note is where the clinical question surfaced. This is where it goes next.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
