"use client";

/**
 * Live examples for Signature, one per state a signature pad has no answer for.
 *
 * Every preview is the real component inside a real antd Form, themed the way
 * the playground is — the component calls `Form.Item.useStatus()` and reads
 * antd's tokens, so outside a Form and a ConfigProvider it would be showing
 * something other than what a host gets.
 *
 * The captured value is shown under the examples that capture one. The point
 * of the component is the value, not the ink: a decline is a record with a
 * reason and an author, and a reader evaluating the library has to see that it
 * is a different shape from a signature rather than a null.
 */

import * as React from "react";
import { Button, ConfigProvider, Form, theme } from "antd";
import {
  Signature,
  SignatureInk,
  isAffirmative,
  signatureRequired,
  toFhirBundle,
  type SignatureProps,
  type SignatureValue,
} from "@zoblocks/signature";
import "@zoblocks/signature/styles.css";
import { useSiteTheme } from "./use-site-theme";
import { useAntdBrandTokens } from "./language-antd-theme";
import {
  ATTESTATION,
  NOW,
  PENDING_EXAMPLE,
  RECORDED_BY,
  REVOKED_EXAMPLE,
  SIGNED_EXAMPLE,
  SUBJECT,
} from "./signature-demo";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Frame                                                              */
/* ------------------------------------------------------------------ */

/** antd is themed by an algorithm in React, not by inherited CSS. */
function Themed({ children }: { children: React.ReactNode }) {
  const dark = useSiteTheme();
  const brand = useAntdBrandTokens(dark);
  return (
    <ConfigProvider
      theme={{ algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm, token: brand }}
    >
      <div className="mx-auto w-full max-w-xl" style={dark ? { colorScheme: "dark" } : undefined}>
        {children}
      </div>
    </ConfigProvider>
  );
}

/** The props every example shares: the host's clock, the patient, the clinician. */
const BASE = {
  now: NOW,
  attestation: ATTESTATION,
  subject: SUBJECT,
  recordedBy: RECORDED_BY,
  documentHash: "sha256:9f4b…c210",
} satisfies Partial<SignatureProps>;

/**
 * What the form received. The ink is path data and tells a reader nothing
 * here, so it is elided.
 */
function ValueReadout({ value }: { value: SignatureValue | undefined }) {
  if (!value) {
    return (
      <p className="m-0 mt-3 text-xs text-graphite">
        Nothing captured yet — the form field is empty, which is not the same as a refusal.
      </p>
    );
  }
  const shown = value.outcome === "signed" ? { ...value, ink: "…omitted…" } : value;
  return (
    <div className="mt-4 grid gap-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium text-ink">What the form received</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider",
            isAffirmative(value) ? "bg-trace/12 text-trace" : "bg-rule/60 text-graphite",
          )}
        >
          {isAffirmative(value) ? "consent given" : "answered, not consent"}
        </span>
      </div>
      <pre className="scroll-thin m-0 max-h-56 overflow-auto rounded-lg border border-rule bg-paper-sunk p-3 font-mono text-[0.6875rem] leading-relaxed text-ink">
        {JSON.stringify(shown, null, 2)}
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Capture                                                            */
/* ------------------------------------------------------------------ */

/**
 * The common case, with the rule doing its job: submit empty and the field
 * says so; decline and the form submits, because a decline is an answer.
 */
export function ConsentInAForm() {
  const [form] = Form.useForm<{ consent?: SignatureValue }>();
  const [value, setValue] = React.useState<SignatureValue | undefined>();
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <Themed>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) =>
          setSubmitted(`Submitted — outcome "${values.consent?.outcome ?? "none"}"`)
        }
        onFinishFailed={() => setSubmitted("Not submitted — the signature field is required")}
      >
        <Form.Item name="consent" label="Patient signature" rules={[signatureRequired()]}>
          <Signature
            {...BASE}
            meaning="consent"
            methods={["draw", "type", "upload"]}
            outcomes={["declined", "unable"]}
            onChange={setValue}
          />
        </Form.Item>
        <div className="flex items-center gap-3">
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
          <span className="text-xs text-graphite" aria-live="polite">
            {submitted}
          </span>
        </div>
      </Form>
      <ValueReadout value={value} />
    </Themed>
  );
}

/** Typed, and only typed: the path that makes this operable without a pointer. */
export function KeyboardOnly() {
  const [value, setValue] = React.useState<SignatureValue | undefined>();
  return (
    <Themed>
      <Form layout="vertical">
        <Form.Item label="Patient signature" rules={[signatureRequired()]}>
          <Signature {...BASE} meaning="consent" methods={["type"]} onChange={setValue} />
        </Form.Item>
      </Form>
      <ValueReadout value={value} />
    </Themed>
  );
}

/* ------------------------------------------------------------------ */
/* When there is no signature                                         */
/* ------------------------------------------------------------------ */

export function CannotSign() {
  const [value, setValue] = React.useState<SignatureValue | undefined>();
  return (
    <Themed>
      <Form layout="vertical">
        <Form.Item label="Patient signature" rules={[signatureRequired()]}>
          <Signature
            {...BASE}
            meaning="consent"
            outcomes={["declined", "unable", "verbal", "on-paper"]}
            onChange={setValue}
          />
        </Form.Item>
      </Form>
      <ValueReadout value={value} />
    </Themed>
  );
}

/* ------------------------------------------------------------------ */
/* After signing                                                      */
/* ------------------------------------------------------------------ */

function Recorded({ value, label }: { value: SignatureValue; label: string }) {
  return (
    <Themed>
      <Form layout="vertical">
        <Form.Item label={label}>
          <Signature {...BASE} meaning="consent" value={value} disabled />
        </Form.Item>
      </Form>
    </Themed>
  );
}

export function Locked() {
  return <Recorded value={SIGNED_EXAMPLE} label="Patient signature" />;
}

export function AwaitingCountersignature() {
  return <Recorded value={PENDING_EXAMPLE} label="Signatures" />;
}

export function Withdrawn() {
  return <Recorded value={REVOKED_EXAMPLE} label="Patient signature" />;
}

/* ------------------------------------------------------------------ */
/* The record                                                         */
/* ------------------------------------------------------------------ */

/** The real mapping, run on the signed value above — not a pasted sample. */
export function ProvenanceBundle() {
  const bundle = React.useMemo(
    () => toFhirBundle(SIGNED_EXAMPLE, { release: "R4", subject: SUBJECT }),
    [],
  );
  const entries = (bundle.entry ?? []) as Array<{
    resource?: { resourceType?: string };
    request?: { method?: string; url?: string };
  }>;
  return (
    <div className="mx-auto grid w-full max-w-xl gap-3">
      <ol className="m-0 grid list-none gap-2 p-0">
        {entries.map((entry, index) => (
          <li
            key={index}
            className="flex items-baseline gap-3 rounded-lg border border-rule bg-paper px-3 py-2 text-sm"
          >
            <span className="font-mono text-xs text-graphite">entry[{index}]</span>
            <span className="font-medium text-ink">
              {entry.request?.method} {entry.resource?.resourceType}
            </span>
          </li>
        ))}
      </ol>
      <details className="text-xs">
        <summary className="cursor-pointer text-graphite">The whole transaction Bundle</summary>
        <pre className="scroll-thin m-0 mt-2 max-h-72 overflow-auto rounded-lg border border-rule bg-paper-sunk p-3 font-mono text-[0.6875rem] leading-relaxed text-ink">
          {JSON.stringify(bundle, null, 2)}
        </pre>
      </details>
    </div>
  );
}

/**
 * The same stored ink on a light and a dark surface. It is `currentColor` on
 * SVG, so the colour comes from where it is shown, not from when it was taken.
 */
export function InkInAnyTheme() {
  if (SIGNED_EXAMPLE.outcome !== "signed") return null;
  const ink = SIGNED_EXAMPLE.ink;
  return (
    <div className="mx-auto grid w-full max-w-xl gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-rule bg-white p-4 text-[#111827]">
        <SignatureInk ink={ink} label="Josh Randall's signature" height={56} />
        <p className="m-0 mt-2 text-xs text-[#4b5563]">Light surface</p>
      </div>
      <div className="rounded-lg border border-rule bg-[#0f172a] p-4 text-[#f1f5f9]">
        <SignatureInk ink={ink} label="Josh Randall's signature" height={56} />
        <p className="m-0 mt-2 text-xs text-[#94a3b8]">Dark surface</p>
      </div>
    </div>
  );
}
