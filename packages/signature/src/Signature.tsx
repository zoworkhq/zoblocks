"use client";

/**
 * Signature — the form control.
 *
 * What you put inside a `Form.Item`. It satisfies antd's custom-control
 * contract exactly, which is three props and not the two people usually
 * remember:
 *
 *   - **`id`** — passed down by `Form.Item` so `<label htmlFor>` resolves. A
 *     component that ignores it has a label that looks fine and is decorative.
 *   - **`value`** and **`onChange`** — the value passed directly rather than
 *     wrapped in an event, matching `Select` and `DatePicker` rather than
 *     `Input`, so no `getValueFromEvent` is needed.
 *
 * Validation status is read from context with `Form.Item.useStatus()`, which
 * is how antd's own controls get their error styling; an explicit `status`
 * prop is accepted too, for use outside a form.
 *
 * The `required` rule deserves its own note — see `signatureRequired` below.
 */

import * as React from "react";
import { Button, Form } from "antd";
import {
  isAffirmative,
  isAnswered,
  type Capacity,
  type CaptureMethod,
  type SignatureMeaning,
  type SignatureValue,
  type Signer,
  type Subject,
} from "@oxygenui-design/signature-core";
import { SignatureModal } from "./SignatureModal";
import { SignatureManifest } from "./SignatureManifest";
import { useLocale, type SignatureLocale } from "./locale";

export interface SignatureProps {
  /** Supplied by `Form.Item`. Attached to the trigger so the label resolves. */
  id?: string;
  value?: SignatureValue;
  defaultValue?: SignatureValue;
  onChange?: (value: SignatureValue) => void;

  /** ISO 8601 from the server. The component never reads the clock. */
  now: string;

  meaning?: SignatureMeaning;
  attestation?: React.ReactNode;
  subject?: Subject;
  signer?: Partial<Signer>;
  capacities?: Capacity[];
  /**
   * Which capture methods to offer.
   *
   * Omitting `"type"` produces a component that fails WCAG 2.1.1 at Level A:
   * drawing is a path-dependent input technique, and without the typed path
   * this control is not operable without a pointer. It is permitted because a
   * host may have a genuinely equivalent alternative elsewhere on the page,
   * but it is never the default — and `@oxygenui/signature-requires-typed-path`
   * makes it a lint error rather than a runtime console message, because a
   * component has no business writing to a customer's console.
   */
  methods?: CaptureMethod[];
  outcomes?: Array<"declined" | "unable" | "verbal" | "on-paper">;
  recordedBy?: Signer;
  documentHash?: string;
  captureBiometrics?: boolean;

  disabled?: boolean;
  status?: "error" | "warning";
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  locale?: Partial<SignatureLocale>;
  onAuditEvent?: (event: { type: string; at: string; detail?: string }) => void;
  className?: string;
}

export function Signature({
  id,
  value: controlled,
  defaultValue,
  onChange,
  now,
  disabled,
  status,
  title,
  subtitle,
  locale: localeOverrides,
  methods = ["draw", "type", "upload"],
  className,
  ...modalProps
}: SignatureProps) {
  const t = useLocale(localeOverrides);
  const [uncontrolled, setUncontrolled] = React.useState<SignatureValue | undefined>(defaultValue);
  const [open, setOpen] = React.useState(false);

  const value = controlled ?? uncontrolled;

  // antd does not pass status down as a prop; its own components read it from
  // context. Doing the same is what makes the error border appear without the
  // integrator wiring anything — but the component is also usable standalone,
  // and antd warns when the hook runs outside a Form.Item, so an explicit
  // `status` short-circuits it.
  const fromForm = Form.Item.useStatus?.()?.status;
  const effectiveStatus =
    status ?? (fromForm === "error" || fromForm === "warning" ? fromForm : undefined);

  const commit = (next: SignatureValue) => {
    if (controlled === undefined) setUncontrolled(next);
    onChange?.(next);
    setOpen(false);
  };

  return (
    <div
      className={["ox-signature-field", className ?? ""].filter(Boolean).join(" ")}
      data-status={effectiveStatus}
    >
      {value ? (
        <div style={{ display: "grid", gap: 8 }}>
          <SignatureManifest value={value} locale={localeOverrides} />
          {!disabled ? (
            <div>
              <Button id={id} size="small" onClick={() => setOpen(true)}>
                {t.change}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div
          style={{
            border: `1px dashed ${
              effectiveStatus === "error"
                ? "var(--ant-color-error, #ff4d4f)"
                : "var(--ant-color-border, #d9d9d9)"
            }`,
            borderRadius: "var(--ant-border-radius-lg, 8px)",
            padding: 24,
            display: "grid",
            placeItems: "center",
            background: disabled
              ? "var(--ant-color-fill-quaternary, rgb(0 0 0 / 0.02))"
              : undefined,
          }}
        >
          {disabled ? (
            <span style={{ opacity: 0.45 }}>{t.notSigned}</span>
          ) : (
            <Button id={id} type="primary" onClick={() => setOpen(true)}>
              ✎ {t.addSignature}
            </Button>
          )}
        </div>
      )}

      <SignatureModal
        {...modalProps}
        methods={methods}
        now={now}
        open={open}
        title={title}
        subtitle={subtitle}
        locale={localeOverrides}
        onCancel={() => setOpen(false)}
        onSubmit={commit}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * The validation rule to use for a required signature.
 *
 * Read this before writing `rules={[{ required: true }]}` against the raw
 * value, because the obvious thing is wrong in a way that is invisible in
 * review.
 *
 * antd's `required` rule passes for any non-empty value, which is *almost*
 * right. The trap is the opposite instinct — writing a validator that demands
 * `outcome === "signed"`. That makes a decline fail validation, which makes a
 * refusal impossible to submit, which means the product cannot record the one
 * thing the whole component exists to record.
 *
 * `isAnswered` is the correct predicate: a decline, an "unable", a verbal
 * consent are all complete answers to "has this been dealt with?". Use
 * `isAffirmative` separately to decide whether to *proceed* — they are
 * different questions and conflating them is the single most likely
 * integration mistake.
 */
export function signatureRequired(message?: string) {
  return {
    validator(_rule: unknown, value: SignatureValue | undefined) {
      if (isAnswered(value)) return Promise.resolve();
      return Promise.reject(
        new Error(message ?? "A signature is required before this form can be submitted."),
      );
    },
  };
}

/**
 * A rule for the stricter case: the subject must actually have agreed.
 *
 * Use this only where a decline genuinely cannot be recorded on the same form
 * — a research-consent gate, say. On a clinical consent form, prefer
 * `signatureRequired` and branch on `isAffirmative` afterwards, so the refusal
 * still gets written down.
 */
export function signatureAffirmative(message?: string) {
  return {
    validator(_rule: unknown, value: SignatureValue | undefined) {
      if (isAffirmative(value)) return Promise.resolve();
      return Promise.reject(new Error(message ?? "Consent has not been given."));
    },
  };
}
