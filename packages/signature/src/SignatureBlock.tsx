"use client";

/**
 * SignatureBlock — the attestation strip at the foot of a document.
 *
 * `SignatureManifest` is the *record*: every field 21 CFR §11.50 requires, laid
 * out for somebody auditing what happened. This is the other thing an
 * enterprise needs and does not have — the compact block that sits under a
 * discharge summary, a referral letter or a policy approval, and answers one
 * question for a reader who is not auditing anything:
 *
 *     Did the right person sign this, and may I act on it?
 *
 * That question is answered by four lines, and the interesting one is the
 * third. A signature and a printed name say *somebody* signed. The role and
 * the registration say whether they were entitled to — a foundation doctor and
 * a consultant may both be "Dr A Rao", and the difference decides whether a
 * discharge is valid. So `role` and `register` are rendered whenever present,
 * and the register is rendered *with* the number, because a bare identifier
 * tells a reader nothing: "7412589" identifies nobody, and "GMC 7412589" is a
 * lookup they can perform.
 *
 * Three decisions worth their comments:
 *
 *   - **Every outcome renders, and an unsigned document says so loudly.** The
 *     failure this exists to prevent is a letter that goes out with a blank
 *     space where the attestation should be, which reads as an oversight
 *     rather than as "nobody signed this". Declined, unable, verbal, on paper,
 *     pending and revoked each get an explicit, bordered notice.
 *   - **Print is the primary medium, not an afterthought.** This block is
 *     read on paper more often than on screen. It refuses to break across a
 *     page — an attestation split over a page boundary is one whose signature
 *     and name may end up on different sheets — and it never relies on a
 *     background colour, because printers drop those by default.
 *   - **Status is never carried by colour alone.** Every state is also named
 *     in words, which is what keeps it legible in forced-colors, in
 *     monochrome print, and for anyone who cannot distinguish the tints.
 */

import * as React from "react";
import type { SignatureValue, Signer } from "@zoblocks/signature-core";
import { SignatureInk } from "./SignatureInk";
import { useLocale, type SignatureLocale } from "./locale";

export interface SignatureBlockProps {
  value: SignatureValue;
  /**
   * The organisation the signer acted for — a trust, a practice, a department.
   *
   * Supplied by the host rather than read from the value, because it belongs
   * to the document, not to the signature: the same clinician signs for
   * different departments and the letterhead decides which one this is.
   */
  organisation?: React.ReactNode;
  /** Shown above the rule, e.g. "Approved by" or "Discharging clinician". */
  caption?: React.ReactNode;
  /**
   * Whether the signed document still matches its hash.
   *
   * Computed by the host — this component cannot verify anything — and shown
   * only when supplied, because an absent check and a passing check are
   * different facts and must not look the same.
   */
  verified?: boolean;
  locale?: Partial<SignatureLocale>;
  className?: string;
}

/** How a date appears in a clinical document: unambiguous, never numeric-only. */
function formatSigned(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(at);
}

/**
 * The signer's identity, as a reader needs it.
 *
 * Name and credential on one line because they are read as one thing; role and
 * registration each on their own, because each is a separate check somebody
 * may want to make and running them together invites skimming past.
 */
function SignerLines({ signer }: { signer: Signer }) {
  const registration = [signer.register, signer.identifier].filter(Boolean).join(" ");

  return (
    <div className="zb-signature-block__signer">
      <p className="zb-signature-block__name">
        {signer.name}
        {signer.credential ? (
          <span className="zb-signature-block__credential"> {signer.credential}</span>
        ) : null}
      </p>
      {signer.role ? <p className="zb-signature-block__role">{signer.role}</p> : null}
      {registration ? <p className="zb-signature-block__registration">{registration}</p> : null}
    </div>
  );
}

export function SignatureBlock({
  value,
  organisation,
  caption,
  verified,
  locale,
  className,
}: SignatureBlockProps) {
  const t = useLocale(locale);

  /*
   * Anything other than a signature is a notice, not a block.
   *
   * Rendering a decline in the shape of a signature — a rule, a name under it
   * — is how a reader skims a letter and comes away believing it was signed.
   * The unsigned states deliberately do not look like this component's
   * signed state.
   */
  if (value.outcome !== "signed") {
    const status: Record<string, string> = {
      declined: t.statusDeclined,
      unable: t.statusUnable,
      verbal: t.statusVerbal,
      "on-paper": t.statusOnPaper,
      pending: t.statusPending,
      revoked: t.statusRevoked,
    };

    return (
      <section
        className={["zb-signature-block", "zb-signature-block--unsigned", className]
          .filter(Boolean)
          .join(" ")}
        aria-label={t.notSigned}
      >
        <p className="zb-signature-block__notice">
          <strong>{t.notSigned}</strong>
          {" — "}
          {status[value.outcome] ?? value.outcome}
        </p>
        {"reason" in value && value.reason ? (
          <p className="zb-signature-block__detail">{String(value.reason)}</p>
        ) : null}
      </section>
    );
  }

  /*
   * `recordedAt`, supplied by the host, never a browser clock.
   *
   * 42 CFR 482.24(c)(1) requires record entries to be dated, timed and
   * authenticated, and a device clock is evidence of none of those — it is
   * whatever the machine was set to.
   */
  const signedAt = formatSigned(value.recordedAt);

  return (
    <section
      className={["zb-signature-block", className].filter(Boolean).join(" ")}
      aria-label={`${t.signedOn} ${signedAt}`}
    >
      {caption ? <p className="zb-signature-block__caption">{caption}</p> : null}

      {/*
        The alt text is whose signature it is and when — the equivalent purpose
        under SC 1.1.1. A description of the strokes would serve nobody.
      */}
      <SignatureInk
        ink={value.ink}
        label={`${value.signer.name}, ${signedAt}`}
        className="zb-signature-block__ink"
        height={56}
        preserveAspectRatio="xMinYMax meet"
      />

      <hr className="zb-signature-block__rule" />

      <SignerLines signer={value.signer} />

      {organisation ? <p className="zb-signature-block__org">{organisation}</p> : null}

      <p className="zb-signature-block__when">
        {t.signedOn} {signedAt}
      </p>

      {/*
        The meaning is not decoration: §11.50(a)(3) requires the manifestation
        to state what the signature meant, and "signed" alone does not.
      */}
      <p className="zb-signature-block__meaning">{t.meaning[value.meaning] ?? value.meaning}</p>

      {verified !== undefined ? (
        <p
          className={
            verified
              ? "zb-signature-block__integrity"
              : "zb-signature-block__integrity zb-signature-block__integrity--failed"
          }
        >
          {/* Named in words as well as marked, so monochrome print still says it. */}
          <span aria-hidden="true">{verified ? "✓ " : "✕ "}</span>
          {verified ? t.manifestIntegrity : t.manifestGraphicalOnly}
        </p>
      ) : null}
    </section>
  );
}
