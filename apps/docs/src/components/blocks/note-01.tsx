"use client";

/**
 * note-01 — a progress note that knows where its text came from.
 *
 * One passage in this note is copied forward from last week and contradicted
 * by the paragraph after it. That is the whole reason the signing gate exists:
 * a signature is an attestation that you read what you are signing, and the
 * meter makes that precondition visible instead of turning it into a refusal
 * at the last click.
 */

import * as React from "react";
import { AttnRow, Instrument, Pill } from "./kit";

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
      title={origin.label}
    >
      {children}
    </span>
  );
}

const HINT = "Hover or tap a passage for its origin";

export function Note01() {
  const [hint, setHint] = React.useState(HINT);
  const [read, setRead] = React.useState(0);
  const [signed, setSigned] = React.useState(false);
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

  return (
    <div className="app">
      <div className="main" style={{ gridColumn: "1 / -1" }}>
        <section className="panel" aria-label="Progress note">
          <div className="panelTop">
            <div>
              <h3>Progress note · 12 Aug 2026</h3>
              <p>R. Okonkwo · Individual therapy, 50 min · CPT 90834</p>
            </div>
            <Pill sev={signed ? "norm" : "high"}>{signed ? "Signed" : "Unsigned · 2d"}</Pill>
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
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button type="button" className="btn ghost">
                Save draft
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={!canSign || signed}
                onClick={() => setSigned(true)}
              >
                {signed ? "Signed · E. Lake" : canSign ? "Sign note ✓" : "Sign note"}
              </button>
            </div>
          </div>
        </section>

        <div className="two">
          <section className="panel" aria-label="Measure taken this session">
            <div className="panelTop">
              <div>
                <h3>Measure taken this session</h3>
                <p>Rendered from the instrument, not retyped into prose</p>
              </div>
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

          <section className="panel" aria-label="Raised for supervision">
            <div className="panelTop">
              <div>
                <h3>Raised for supervision</h3>
              </div>
            </div>
            <div style={{ borderTop: "1px solid var(--site-rule)" }}>
              <AttnRow
                sev="high"
                text="Flat PHQ-9 against reported functional gain"
                who="Thu 14:00"
                clock="review"
              />
              <AttnRow
                sev="unk"
                text="Copied-forward sleep line contradicted in session"
                who="resolved in note"
                clock="fixed"
              />
            </div>
            <p className="miniLegend">
              The note is where the clinical question surfaced. This is where it goes next.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
