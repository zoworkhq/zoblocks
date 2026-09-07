"use client";

/**
 * SignatureManifest — the record, read-only.
 *
 * 21 CFR §11.50(a) requires a signed electronic record to carry the printed
 * name of the signer, the date and time the signature was executed, and the
 * *meaning* associated with it — and §11.50(b) requires all three to appear in
 * any human-readable form, "whether displayed or printed". That is this
 * component, almost clause for clause, and it is the piece every other
 * signature library leaves to the integrator.
 *
 * It renders every outcome, not just `signed`. A decline that renders as an
 * empty field is the failure the whole value type exists to prevent, so
 * `declined`, `unable`, `verbal`, `on-paper`, `pending` and `revoked` each get
 * a real presentation with their own evidence.
 *
 * Two accessibility details worth their comments:
 *
 *   - The ink is `role="img"` here, which is correct — this is a static
 *     graphic, unlike the live capture surface where the same role would be a
 *     lie. Its alt text is *whose signature it is and when*, because that is
 *     the equivalent purpose under SC 1.1.1. A description of the strokes
 *     would serve no purpose at all.
 *   - Colour never carries a status alone. Every state is also named in text,
 *     which is what keeps it legible in forced-colors and for anyone who
 *     cannot distinguish the tints.
 */

import * as React from "react";
import type { SignatureValue, SignedValue } from "@zoblocks/signature-core";
import { SignatureInk } from "./SignatureInk";
import { useLocale, type SignatureLocale } from "./locale";

export interface SignatureManifestProps {
  value: SignatureValue;
  /** Heading above the record. */
  title?: React.ReactNode;
  /**
   * Whether the signed document still matches its hash.
   *
   * Computed by the host — the component cannot verify anything — and shown
   * only when supplied, because an absent check and a passing check are
   * different things and must not look the same.
   */
  verified?: boolean;
  /** Hide the "graphical only, not cryptographic" row. Off by default. */
  hideIntegrityNote?: boolean;
  locale?: Partial<SignatureLocale>;
  className?: string;
}

export function SignatureManifest({
  value,
  title,
  verified,
  hideIntegrityNote,
  locale: localeOverrides,
  className,
}: SignatureManifestProps) {
  const t = useLocale(localeOverrides);

  const signed =
    value.outcome === "signed" ? value : value.outcome === "revoked" ? value.original : null;

  return (
    <section
      className={[
        "zb-signature-manifest",
        value.outcome === "revoked" ? "zb-signature-manifest--revoked" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={typeof title === "string" ? title : undefined}
    >
      {title ? (
        <header className="zb-signature-manifest__ink" style={{ paddingBlock: 12 }}>
          <strong style={{ flex: 1 }}>{title}</strong>
          {verified !== undefined ? (
            <StatusText tone={verified ? "ok" : "bad"}>
              {verified ? "Valid — document unchanged" : "Document has changed since signing"}
            </StatusText>
          ) : null}
        </header>
      ) : null}

      {signed ? <Ink value={signed} t={t} revoked={value.outcome === "revoked"} /> : null}

      <dl className="zb-signature-manifest__rows">
        {signed ? (
          <>
            <Row label="Meaning">{t.meaning[signed.meaning] ?? signed.meaning}</Row>
            {signed.attestation ? (
              <Row label={t.manifestStatement}>
                <q>{signed.attestation}</q>
              </Row>
            ) : null}
            <Row label={t.signedOn}>
              <time dateTime={signed.recordedAt}>{formatInstant(signed.recordedAt)}</time>
            </Row>
            <Row label={t.manifestMethod}>{describeMethod(signed)}</Row>
            {signed.documentHash ? (
              <Row label="Document version">
                <code>{signed.documentHash}</code>
              </Row>
            ) : null}
          </>
        ) : (
          <OutcomeRows value={value} t={t} />
        )}

        {value.outcome === "revoked" ? (
          <>
            <Row label={t.statusRevoked}>
              <StatusText tone="bad">{value.reason}</StatusText>
            </Row>
            <Row label="Withdrawn">
              <time dateTime={value.revokedAt}>{formatInstant(value.revokedAt)}</time> ·{" "}
              {describePerson(value.revokedBy)}
            </Row>
          </>
        ) : null}

        {value.recordedBy ? (
          <Row label={t.manifestRecordedBy}>{describePerson(value.recordedBy)}</Row>
        ) : null}

        {signed && !hideIntegrityNote ? (
          <Row label={t.manifestIntegrity}>
            {/*
              The row every other library omits. A PNG of a mark carries no
              cryptographic guarantee whatsoever, and integrators routinely
              assume otherwise — saying so on the face of the record is the
              only place it reliably gets read.
            */}
            <StatusText tone="warn">{t.manifestGraphicalOnly}</StatusText>{" "}
            <span style={{ opacity: 0.7 }}>{t.manifestGraphicalNote}</span>
          </Row>
        ) : null}
      </dl>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Ink({ value, t, revoked }: { value: SignedValue; t: SignatureLocale; revoked: boolean }) {
  // The alt text is whose it is and when — the equivalent purpose of a
  // signature image under SC 1.1.1. Never "handwritten signature", which tells
  // a screen-reader user nothing they could act on.
  const alt = `${revoked ? "Withdrawn signature" : "Signature"} of ${value.signer.name}, ${t.signedOn.toLowerCase()} ${formatInstant(value.recordedAt)}`;

  return (
    <div className="zb-signature-manifest__ink">
      <SignatureInk ink={value.ink} label={alt} style={{ maxWidth: 260, height: "auto" }} />
      <div>
        <div style={{ fontWeight: 600, fontSize: "1.05em" }}>{value.signer.name}</div>
        <div style={{ opacity: 0.75 }}>
          {describeCapacity(value, t)}
          {value.signer.credential ? ` · ${value.signer.credential}` : ""}
        </div>
      </div>
    </div>
  );
}

function OutcomeRows({ value, t }: { value: SignatureValue; t: SignatureLocale }) {
  switch (value.outcome) {
    case "declined":
      return (
        <>
          <Row label="Outcome">
            <StatusText tone="warn">{t.statusDeclined}</StatusText>
          </Row>
          <Row label={t.reason}>{value.reason}</Row>
          <Row label="Recorded">
            <time dateTime={value.recordedAt}>{formatInstant(value.recordedAt)}</time>
          </Row>
          {value.witness ? <Row label={t.witness}>{describePerson(value.witness)}</Row> : null}
        </>
      );
    case "unable":
      return (
        <>
          <Row label="Outcome">
            <StatusText tone="warn">{t.statusUnable}</StatusText>
          </Row>
          <Row label={t.reason}>
            {UNABLE_REASON[value.reason] ?? value.reason}
            {value.detail ? ` — ${value.detail}` : ""}
          </Row>
          <Row label={t.witness}>{describePerson(value.witness)}</Row>
          <Row label="Recorded">
            <time dateTime={value.recordedAt}>{formatInstant(value.recordedAt)}</time>
          </Row>
        </>
      );
    case "verbal":
      return (
        <>
          <Row label="Outcome">
            <StatusText tone="ok">{t.statusVerbal}</StatusText>
          </Row>
          <Row label="Channel">{value.channel}</Row>
          {value.script ? <Row label="Wording used">{value.script}</Row> : null}
          <Row label={t.witness}>{describePerson(value.witness)}</Row>
          <Row label="Recorded">
            <time dateTime={value.recordedAt}>{formatInstant(value.recordedAt)}</time>
          </Row>
        </>
      );
    case "on-paper":
      return (
        <>
          <Row label="Outcome">
            <StatusText tone="ok">{t.statusOnPaper}</StatusText>
          </Row>
          {value.scanRef ? <Row label="Scan">{value.scanRef}</Row> : null}
          <Row label="Recorded">
            <time dateTime={value.recordedAt}>{formatInstant(value.recordedAt)}</time>
          </Row>
        </>
      );
    case "pending":
      return (
        <>
          <Row label="Outcome">
            <StatusText tone="info">{t.statusPending}</StatusText>
          </Row>
          <Row label="Awaiting">{t.capacity[value.awaiting] ?? value.awaiting}</Row>
          <Row label="Since">
            <time dateTime={value.since}>{formatInstant(value.since)}</time>
          </Row>
        </>
      );
    default:
      return null;
  }
}

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="zb-signature-manifest__row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/**
 * Status with a text label, never colour alone.
 *
 * The `·` glyph is aria-hidden decoration; the state itself is always the
 * adjacent text, which is what survives forced colors and colour blindness.
 */
function StatusText({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "bad" | "info";
  children: React.ReactNode;
}) {
  const color = {
    ok: "var(--ant-color-success, #52c41a)",
    warn: "var(--ant-color-warning-text, #d48806)",
    bad: "var(--ant-color-error, #ff4d4f)",
    info: "var(--ant-color-primary, #1677ff)",
  }[tone];

  return (
    <span style={{ color, fontWeight: 500 }}>
      <span aria-hidden="true">● </span>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */

const UNABLE_REASON: Record<string, string> = {
  "physically-unable": "Physically unable to hold a pen or stylus",
  "sedated-or-unconscious": "Sedated or unconscious",
  "lacks-capacity": "Lacks capacity to consent",
  "language-barrier": "Language barrier with no interpreter available",
  "no-assistive-technology": "Assistive technology not available",
  other: "Other",
};

function describePerson(person: { name: string; credential?: string }): string {
  return person.credential ? `${person.name}, ${person.credential}` : person.name;
}

function describeCapacity(value: SignedValue, t: SignatureLocale): string {
  const capacity = t.capacity[value.capacity] ?? value.capacity;
  if (value.capacity === "self") return `${capacity} · signing for themselves`;
  return value.onBehalfOf ? `${capacity} · on behalf of ${value.onBehalfOf.display}` : capacity;
}

function describeMethod(value: SignedValue): string {
  const method =
    value.method === "draw" ? "Drawn" : value.method === "type" ? "Typed" : "Uploaded as an image";

  const parts = [method];
  const strokes = value.provenance.strokeCount ?? value.ink.strokes.length;
  if (value.method === "draw" && strokes) {
    parts.push(`${strokes} ${strokes === 1 ? "stroke" : "strokes"}`);
  }
  if (value.provenance.pointerType && value.provenance.pointerType !== "unknown") {
    parts.push(POINTER[value.provenance.pointerType] ?? value.provenance.pointerType);
  }
  return parts.join(" · ");
}

const POINTER: Record<string, string> = {
  pen: "stylus",
  touch: "finger on a touchscreen",
  mouse: "mouse",
};

/**
 * A timestamp a person can read, in their own locale.
 *
 * `Intl` rather than a hand-rolled format, and the machine-readable value stays
 * on the `<time datetime>` attribute — so the record is unambiguous for a
 * parser and natural for a reader, which is what "human-readable form" in
 * §11.50(b) is asking for.
 */
function formatInstant(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "long",
      timeStyle: "medium",
    }).format(date);
  } catch {
    return iso;
  }
}
