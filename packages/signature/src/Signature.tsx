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
} from "@zoblocks/signature-core";
import { SignatureModal } from "./SignatureModal";
import { SignatureManifest } from "./SignatureManifest";
import { useLocale, type SignatureLocale } from "./locale";

export interface SignatureProps {
  /** Supplied by `Form.Item`. Attached to the trigger so the label resolves. */
  id?: string;
  /**
   * The signature, controlled. A discriminated union over seven outcomes rather than `string |
   * null`, because a refusal and an untouched field are different facts.
   */
  value?: SignatureValue;
  /** The starting signature, uncontrolled. Use for a form re-opened on an existing record. */
  defaultValue?: SignatureValue;
  /**
   * Fired whenever the outcome changes — including when somebody declines, which is a value
   * and not an error.
   */
  onChange?: (value: SignatureValue) => void;

  /** ISO 8601 from the server. The component never reads the clock. */
  now: string;

  /**
   * What signing this asserts: consent, attestation, witness, receipt. It selects the wording
   * and it is recorded, because a signature with no stated meaning is not evidence of
   * anything.
   */
  meaning?: SignatureMeaning;
  /**
   * The sentence the signer is agreeing to, shown above the control. Required for
   * `meaning="attestation"`; a signature over unstated words is not an attestation.
   */
  attestation?: React.ReactNode;
  /**
   * Who or what is being signed for. Rendered so the signer can check it before signing, which
   * is the entire point of showing it.
   */
  subject?: Subject;
  /** Who is signing, as far as the host already knows. Anything omitted is asked for. */
  signer?: Partial<Signer>;
  /**
   * The capacities this signer may sign in — clinician, patient, guardian, interpreter.
   * Offered as a choice when there is more than one, because the capacity changes what the
   * signature means.
   */
  capacities?: Capacity[];
  /**
   * Which capture methods to offer.
   *
   * Omitting `"type"` produces a component that fails WCAG 2.1.1 at Level A:
   * drawing is a path-dependent input technique, and without the typed path
   * this control is not operable without a pointer. It is permitted because a
   * host may have a genuinely equivalent alternative elsewhere on the page,
   * but it is never the default — and `@zoblocks/signature-requires-typed-path`
   * makes it a lint error rather than a runtime app message, because a
   * component has no business writing to a customer's app.
   */
  methods?: CaptureMethod[];
  /**
   * Which non-signing outcomes are offered. Removing `"declined"` makes a refusal
   * unrecordable, which forces staff to either lie or abandon the form.
   */
  outcomes?: Array<"declined" | "unable" | "verbal" | "on-paper">;
  /**
   * The person operating the device when the signer is not. Required for `unable` — an
   * unwitnessed `unable` is a compile error.
   */
  recordedBy?: Signer;
  /**
   * A hash of exactly what was signed. Without it the signature attests to a document nobody
   * can later identify.
   */
  documentHash?: string;
  /**
   * Record stroke timing and pressure alongside the image. Off by default: it is additional
   * personal data and most workflows do not need it.
   */
  captureBiometrics?: boolean;

  /**
   * Blocks every path including the refusals. Rarely right — if the form is not signable yet,
   * say why rather than removing the ability to decline.
   */
  disabled?: boolean;
  /**
   * Validation state from the surrounding form. Renders the field's error styling without
   * inventing a message.
   */
  status?: "error" | "warning";
  /** The heading above the control. Also its accessible name. */
  title?: React.ReactNode;
  /** A line under the title for the qualification the title cannot carry. */
  subtitle?: React.ReactNode;
  /**
   * Overrides for every generated string, including the seven outcome names. Supply it for any
   * language that is not English.
   */
  locale?: Partial<SignatureLocale>;
  /**
   * Each capture, change and refusal as a structured event. Timed by `now`, never by the
   * browser.
   */
  onAuditEvent?: (event: { type: string; at: string; detail?: string }) => void;
  /** Applied to the outer element. */
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
      className={["zb-signature-field", className ?? ""].filter(Boolean).join(" ")}
      /*
       * Namespaced, like every other root in the library. A bare
       * `data-status` on a public component root is a name a host page is
       * entitled to use for its own purposes, and the collision would style
       * this field from somewhere nobody thinks to look.
       */
      data-zb-signature=""
      data-zb-status={effectiveStatus}
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
