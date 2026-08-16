"use client";

/**
 * The live Signature demo.
 *
 * This is the real component with its real dependency — not a mark, not a
 * screenshot. It is the only place on the site that carries Ant Design, and it
 * earns that: Signature's whole argument is about the states a signature pad
 * has no answer for, and the only way to show that a decline is recordable is
 * to let someone record one and watch the field change.
 *
 * `now` is a fixed instant rather than the current time. The component requires
 * an injected timestamp by design — a browser clock is not evidence — and a
 * fixed one also keeps the demo deterministic for visual regression.
 */

import * as React from "react";
import { ConfigProvider, Form, theme } from "antd";
import {
  Signature,
  SignatureManifest,
  isAffirmative,
  signatureRequired,
  toFhirBundle,
  type SignatureValue,
  type SignedValue,
} from "@oxygenui-design/signature";
import "@oxygenui-design/signature/styles.css";
import { InstrumentGlow } from "@/components/site/interactions";
import { cn } from "@/lib/utils";

/** Fixed, because the component takes the clock as a prop and never reads it. */
const NOW = "2026-08-16T14:36:02.000Z";

const RECORDED_BY = { name: "A. Okafor", credential: "RN" } as const;
const SUBJECT = { display: "Randall, Josh", reference: "Patient/4471902" } as const;
const ATTESTATION =
  "I have read the information about this procedure, I have had the chance to ask questions, and I agree to go ahead.";

type Scenario = "consent" | "outcomes" | "locked" | "pending" | "revoked";

const SCENARIOS: Array<{ id: Scenario; label: string; note: string }> = [
  {
    id: "consent",
    label: "Consent",
    note: "Draw, type, or upload. The Type tab is not a fallback — it is the mechanism that makes this operable without a pointer, which WCAG 2.1.1 requires at Level A. Try signing with the keyboard alone.",
  },
  {
    id: "outcomes",
    label: "Can't sign",
    note: "The screen no signature pad has. A patient who declined and a form nobody opened are different facts, and only one of them is recordable anywhere else. Unable and verbal both require a witness — the type says so, and so does the option text.",
  },
  {
    id: "locked",
    label: "Locked",
    note: "A submitted form. The record stays legible and printable, and states plainly that a PNG of a mark is not a cryptographic signature — the row every other library omits.",
  },
  {
    id: "pending",
    label: "Awaiting",
    note: "Signed by the patient, waiting on the clinician. A form that is neither empty nor complete is the state a boolean cannot hold, and it is the normal case for anything needing a countersignature.",
  },
  {
    id: "revoked",
    label: "Withdrawn",
    note: "Consent given and later withdrawn. The original is struck through rather than deleted — that consent was given and then withdrawn is a different fact from consent never having been given, and both belong in the record.",
  },
];

/** Narrowed, because `revoked` carries the original signature specifically. */
const SIGNED_EXAMPLE: SignedValue = {
  outcome: "signed",
  method: "type",
  ink: {
    strokes: [],
    svg: "",
    render: {
      viewBox: "0 0 340 70",
      paths: [],
      text: {
        value: "Josh Randall",
        x: 16,
        y: 48,
        fontSize: 44,
        fontFamily: "Georgia, 'Times New Roman', serif",
        italic: true,
      },
    },
    bounds: { x: 0, y: 0, width: 340, height: 70 },
  },
  signer: { name: "Josh Randall" },
  capacity: "self",
  meaning: "consent",
  attestation: ATTESTATION,
  recordedAt: NOW,
  recordedBy: RECORDED_BY,
  documentHash: "sha256:9f4b…c210",
  provenance: { method: "type" },
};

/**
 * Follows the site's theme, and keeps following it.
 *
 * antd is themed by an algorithm passed in React, not by CSS that inherits, so
 * a demo that hardcodes `defaultAlgorithm` renders antd's light palette
 * whatever the page around it is doing. On the dark site that put near-black
 * body text on a near-black surface — the signed manifest, which is the one
 * scenario made almost entirely of text, was the worst of it.
 *
 * `false` on the server and on first paint, then corrected in an effect: the
 * class is written by a blocking script in `layout.tsx` before hydration, so
 * reading it during render would disagree with the server-rendered HTML.
 */
function useSiteTheme(): boolean {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const read = () => setDark(document.documentElement.classList.contains("dark"));
    read();

    // The site toggle mutates the class rather than firing an event, so the
    // class itself is what gets watched.
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

/** Signed by the patient, still waiting on the clinician who has to countersign. */
const PENDING_EXAMPLE: SignatureValue = {
  outcome: "pending",
  awaiting: "clinician",
  since: NOW,
  soFar: [SIGNED_EXAMPLE],
  recordedAt: NOW,
  recordedBy: RECORDED_BY,
};

/** Consent given, then withdrawn. The original is kept, struck through. */
const REVOKED_EXAMPLE: SignatureValue = {
  outcome: "revoked",
  original: SIGNED_EXAMPLE,
  revokedBy: { name: "Josh Randall" },
  revokedAt: "2026-08-18T09:12:00.000Z",
  reason: "Changed their mind after speaking with their daughter.",
  recordedAt: NOW,
  recordedBy: RECORDED_BY,
};

/** The scenarios whose value is supplied rather than captured in the demo. */
const FIXED: Partial<Record<Scenario, SignatureValue>> = {
  locked: SIGNED_EXAMPLE,
  pending: PENDING_EXAMPLE,
  revoked: REVOKED_EXAMPLE,
};

/**
 * True once the client has taken over from the server-rendered HTML.
 *
 * Surfaced as `data-hydrated` on the demo root purely so tests can wait for it.
 * `networkidle` says the network is quiet, which is not the same as React
 * having attached its handlers — a click in that gap hits server-rendered
 * markup, does nothing at all, and produces a failure that looks like a broken
 * dialog rather than a mistimed test. It was intermittent under parallel load
 * and invisible when the test ran alone, which is the worst shape a flake has.
 */
function useHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  return hydrated;
}

export function SignatureDemo() {
  const hydrated = useHydrated();
  const [scenario, setScenario] = React.useState<Scenario>("consent");
  const [value, setValue] = React.useState<SignatureValue | undefined>();

  // The demo's own toggle is an override, not the source of truth: it starts
  // wherever the site is and only diverges once someone presses it.
  const siteDark = useSiteTheme();
  const [override, setOverride] = React.useState<boolean | null>(null);
  const dark = override ?? siteDark;
  const setDark = (next: (previous: boolean) => boolean) => setOverride(next(dark));

  const current = SCENARIOS.find((s) => s.id === scenario) ?? SCENARIOS[0]!;
  const shown = FIXED[scenario] ?? value;

  return (
    <div className="instrument instrument-demo" data-hydrated={hydrated || undefined}>
      <InstrumentGlow />

      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-panel-rule px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-trace shadow-[0_0_8px_var(--color-trace)]" />
          <span className="eyebrow text-panel-muted">Live · the real component</span>
        </div>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          aria-pressed={dark}
          className="rounded-md px-2 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-panel-muted transition-colors hover:text-panel-fg"
        >
          {dark ? "Dark" : "Light"}
        </button>
      </div>

      {/*
        The demo is themed independently of the docs site so both antd
        algorithms can be shown. The signature re-themes because its ink is
        currentColor on real SVG rather than a canvas bitmap — a stored
        signature captured in light mode stays legible here.
      */}
      <div
        className={cn("relative p-4 sm:p-6", dark && "bg-[#141414]")}
        style={dark ? { colorScheme: "dark" } : undefined}
      >
        <ConfigProvider theme={{ algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
          <Form layout="vertical" style={{ maxWidth: 560, margin: "0 auto" }}>
            <Form.Item
              label="Patient signature"
              // signatureRequired() accepts a decline. A rule demanding
              // outcome === "signed" would make refusal impossible to submit.
              rules={[signatureRequired()]}
            >
              <Signature
                now={NOW}
                value={shown}
                onChange={setValue}
                disabled={scenario in FIXED}
                meaning="consent"
                attestation={ATTESTATION}
                subject={SUBJECT}
                recordedBy={RECORDED_BY}
                documentHash="sha256:9f4b…c210"
                title="Sign consent for treatment"
                subtitle="Randall, Josh · MRN 4471902 · DOB 12 Mar 1978"
                capacities={["self", "parent", "proxy", "legal-representative"]}
                methods={["draw", "type", "upload"]}
                outcomes={
                  scenario === "outcomes"
                    ? ["declined", "unable", "verbal", "on-paper"]
                    : ["declined", "unable"]
                }
              />
            </Form.Item>
          </Form>
        </ConfigProvider>

        {value ? <ValueInspector value={value} onReset={() => setValue(undefined)} /> : null}
      </div>

      <div className="relative border-t border-panel-rule bg-panel/60 px-3 py-3 sm:px-4">
        <div role="tablist" aria-label="Demo scenario" className="flex flex-wrap gap-1.5">
          {SCENARIOS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === scenario}
              onClick={() => {
                setScenario(item.id);
                setValue(undefined);
              }}
              className={cn(
                "rounded-lg px-2.5 py-1.5 font-mono text-[0.6875rem] uppercase tracking-wider",
                "transition-all duration-200 ease-[var(--ease-out-expo)]",
                item.id === scenario
                  ? "bg-trace/12 text-trace ring-1 ring-trace/35"
                  : "text-panel-muted hover:bg-panel-fg/6 hover:text-panel-fg/85",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="animate-rail-settle mt-3 max-w-2xl text-[0.8125rem] leading-relaxed text-panel-muted">
          {current.note}
        </p>
      </div>
    </div>
  );
}

/**
 * What the form actually received.
 *
 * The point of the demo is the value, not the ink — so it is shown. Someone
 * evaluating this library needs to see that a decline produces a real record
 * with a reason and an author, and that it is a different shape from a
 * signature rather than a null.
 */
function ValueInspector({ value, onReset }: { value: SignatureValue; onReset: () => void }) {
  const [showFhir, setShowFhir] = React.useState(false);

  const payload = showFhir
    ? toFhirBundle(value, { release: "R4", subject: SUBJECT })
    : // The ink is megabytes of path data and tells a reader nothing here.
      { ...value, ...(value.outcome === "signed" ? { ink: "…omitted…" } : {}) };

  return (
    <div className="mt-6 rounded-xl border border-panel-rule bg-panel/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="eyebrow text-panel-muted">What the form received</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider",
              isAffirmative(value) ? "bg-trace/12 text-trace" : "bg-panel-fg/10 text-panel-fg/80",
            )}
          >
            {/* Answered and agreed are different questions, and the demo says so. */}
            {isAffirmative(value) ? "consent given" : "answered, not consent"}
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setShowFhir((v) => !v)}
            aria-pressed={showFhir}
            className="rounded-md px-2 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-panel-muted hover:text-panel-fg"
          >
            {showFhir ? "Value" : "FHIR"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-md px-2 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-panel-muted hover:text-panel-fg"
          >
            Reset
          </button>
        </div>
      </div>

      <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-black/30 p-3 text-[0.6875rem] leading-relaxed text-panel-fg/85">
        <code>{JSON.stringify(payload, null, 2)}</code>
      </pre>

      {showFhir ? (
        <p className="mt-2 text-[0.75rem] text-panel-muted">
          A transaction Bundle, not a resource — <code className="font-mono">Consent</code> carries
          no signature element in R4 or R5, so the ink lives on a{" "}
          <code className="font-mono">Provenance</code> pointing at it.
        </p>
      ) : null}
    </div>
  );
}

export { SignatureManifest };
