/**
 * The value a signature field holds.
 *
 * This is the whole argument of the component expressed as a type. Almost
 * every signature library models its value as `string | null` — a base64 PNG
 * or nothing — and that shape cannot express what happens on a real ward.
 *
 * Ask a ward clerk what happens when they put a consent form in front of a
 * patient and you get seven answers, not two. A patient who *refused to sign*
 * and a form nobody opened are different facts with different consequences, and
 * a type with two states makes the difference unrecordable. That is the same
 * argument `no-absence-placeholder` enforces one tier down, at higher stakes:
 * there, a dash stands in for a missing measurement; here, an empty field
 * stands in for a documented refusal of treatment.
 *
 * A discriminated union rather than optional fields, because a flags shape
 * (`{ image?, declined?, witness? }`) permits states that cannot exist —
 * declined *with* an image, unable *without* a witness — and pushes the
 * validation into every consumer. Here, "unable without a witness" is a
 * compile error.
 *
 * See §03 of oxygen-signature-brief.html for the clinical reasoning, and
 * `fhir.ts` for how each member maps onto FHIR.
 */

/* ------------------------------------------------------------------ */
/* People and capacity                                                 */
/* ------------------------------------------------------------------ */

/**
 * The capacity someone signs in.
 *
 * The healthcare-specific axis, and the one generic e-signature components
 * omit entirely. A signature on a consent form is very often not the patient's
 * own — a parent for a minor, a proxy for an incapacitated adult — and which
 * it was changes both the legal effect and the FHIR representation.
 */
export type Capacity =
  /** The subject signing for themselves. */
  | "self"
  /** A parent or legal guardian signing for a minor. */
  | "parent"
  /** A healthcare proxy or attorney acting under a durable power. */
  | "proxy"
  /** A court-appointed or otherwise legally authorised representative. */
  | "legal-representative"
  /** A clinician signing their own entry. */
  | "clinician"
  /** Someone attesting that they observed the signing. */
  | "witness"
  /** Someone attesting that they conveyed the content in another language. */
  | "interpreter";

/** A person, as the component records them. */
export interface Signer {
  /** Printed name. Required by 21 CFR 11.50(a) in the manifestation. */
  name: string;
  /** "RN", "MD", "NP". Displayed beside the name where present. */
  credential?: string;
  /** A reference the host system understands, e.g. "Practitioner/1234". */
  reference?: string;
  /** NPI, licence number, or another identifier the host wants recorded. */
  identifier?: string;
}

/** Who the signature is *about*, which is not always who signed it. */
export interface Subject {
  display: string;
  reference?: string;
}

/**
 * What the signature means.
 *
 * 21 CFR 11.50(a)(3) requires the manifestation to state "the meaning (such as
 * review, approval, responsibility, or authorship) associated with the
 * signature", so this is not decoration — it is the clause that makes a
 * signature manifestation compliant. Each value maps to an ISO/ASTM E1762 code
 * in `fhir.ts`.
 */
export type SignatureMeaning =
  | "consent"
  | "author"
  | "coauthor"
  | "verification"
  | "validation"
  | "witness"
  | "interpreter"
  | "review";

/** How the mark was produced. */
export type CaptureMethod = "draw" | "type" | "upload";

/**
 * Why someone could not sign.
 *
 * A controlled list rather than free text, because this drives what happens
 * next — a patient who is temporarily sedated needs a different pathway from
 * one who permanently lacks capacity. `detail` carries the free text alongside.
 */
export type UnableReason =
  | "physically-unable"
  | "sedated-or-unconscious"
  | "lacks-capacity"
  | "language-barrier"
  | "no-assistive-technology"
  | "other";

/* ------------------------------------------------------------------ */
/* Evidence                                                            */
/* ------------------------------------------------------------------ */

/** One sampled point along a stroke. */
export interface Point {
  x: number;
  y: number;
  /** Milliseconds since the stroke began. Relative, never a wall clock. */
  t: number;
  /** 0–1 where the device reports it, 0.5 where it does not. */
  pressure: number;
}

/** One continuous mark, from pointer-down to pointer-up. */
export interface Stroke {
  points: Point[];
  /** What drew it. Recorded because a pen and a fingertip are different evidence. */
  pointerType: "pen" | "touch" | "mouse" | "unknown";
}

/** The rendered artifacts, and the strokes they came from. */
export interface Ink {
  /** The source of truth. Everything else is a render of this. */
  strokes: Stroke[];
  /** Trimmed SVG path markup. Vector, so print and archive are resolution-free. */
  svg: string;
  /** Trimmed PNG as a data URL, at the requested DPI. */
  png?: string;
  /** Ink bounding box in capture coordinates. */
  bounds: Bounds;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * How and where the capture happened.
 *
 * Deliberately excludes anything the component cannot honestly know. There is
 * no IP address and no session id here: a UI component that claims to record
 * them is recording what the browser told it, which is not the same thing. The
 * host supplies those from the server side, where they are evidence.
 */
export interface CaptureContext {
  method: CaptureMethod;
  /** Present for `draw`. */
  pointerType?: Stroke["pointerType"];
  strokeCount?: number;
  /** Total time from first contact to commit, in ms. */
  durationMs?: number;
  /** Viewport at capture, for reproducing what the signer actually saw. */
  viewport?: { width: number; height: number };
  /**
   * Stroke timing and pressure, for forensic comparison.
   *
   * Off unless the integrator explicitly opts in. A written signature is
   * excluded from Illinois BIPA's definition of a biometric identifier, and
   * Texas CUBI's definition does not reach it either — but whether the *stroke
   * dynamics* behind it are a "writing sample" or a behavioural biometric is
   * not settled by either text. The safe default is not to emit them.
   */
  biometrics?: BiometricSummary;
}

export interface BiometricSummary {
  /** Mean and peak speed in capture units per second. */
  meanSpeed: number;
  peakSpeed: number;
  meanPressure: number;
  /** Time the pen was off the surface between strokes, in ms. */
  pauseMs: number[];
}

/* ------------------------------------------------------------------ */
/* The union                                                           */
/* ------------------------------------------------------------------ */

interface Recorded {
  /**
   * When this was recorded, ISO 8601, supplied by the host.
   *
   * Never read from the client clock. 42 CFR 482.24(c)(1) requires record
   * entries to be "dated, timed, and authenticated", and a browser clock is
   * not evidence of either — it is whatever the device was set to. The
   * repository already lints against reading the current time inside a
   * component; on a signature the same call is a legal problem rather than a
   * testing one.
   */
  recordedAt: string;
  /** Who operated the interface. Often not the signer. */
  recordedBy?: Signer;
}

/**
 * The outcomes where nobody signed, and why `recordedBy` becomes required.
 *
 * A signed value has a `signer`, so somebody is accountable for it. The others
 * have no signer at all — and "the patient declined" with nobody attached is
 * exactly the unattributable record this whole union exists to prevent.
 * Somebody stood there and wrote it down; the record has to say who.
 *
 * It is also a hard FHIR requirement rather than a preference:
 * `Provenance.agent` is `1..*`, so a Provenance with no agent is invalid, and
 * an optional `recordedBy` here would let us emit one.
 */
interface Attributed extends Recorded {
  recordedBy: Signer;
}

/** Someone signed. */
export interface SignedValue extends Recorded {
  outcome: "signed";
  method: CaptureMethod;
  ink: Ink;
  signer: Signer;
  capacity: Capacity;
  meaning: SignatureMeaning;
  /** The statement that was on screen, stored so the manifest can reprint it. */
  attestation?: string;
  /** Set whenever `capacity` is not "self". */
  onBehalfOf?: Subject;
  /** Hash of what was signed, so later tampering is detectable. */
  documentHash?: string;
  provenance: CaptureContext;
}

/** They read it and chose not to agree. An exercise of autonomy, not a failure. */
export interface DeclinedValue extends Attributed {
  outcome: "declined";
  reason: string;
  reasonCode?: string;
  witness?: Signer;
}

/**
 * They would sign but cannot.
 *
 * `witness` is required rather than optional, and that is the whole point of
 * modelling this separately: an unwitnessed "unable" is not a record, it is an
 * assertion by whoever was holding the tablet.
 */
export interface UnableValue extends Attributed {
  outcome: "unable";
  reason: UnableReason;
  detail?: string;
  witness: Signer;
}

/** Consent given by phone or video. Routine in telehealth; no mark exists. */
export interface VerbalValue extends Attributed {
  outcome: "verbal";
  channel: "phone" | "video" | "in-person";
  /** What was read out, so the record shows what was agreed to. */
  script?: string;
  witness: Signer;
}

/** A wet signature was taken and will be scanned. */
export interface OnPaperValue extends Attributed {
  outcome: "on-paper";
  /** Pointer to the scan, once it exists. */
  scanRef?: string;
}

/** Signed by one party, awaiting another. The resident-awaiting-attending case. */
export interface PendingValue extends Attributed {
  outcome: "pending";
  awaiting: Capacity;
  since: string;
  /** Whoever has signed so far. */
  soFar: SignatureValue[];
}

/**
 * The signature was valid and no longer is.
 *
 * The original is retained, not deleted. Withdrawing consent is a right, and
 * the record has to show that consent was given and then withdrawn — which is
 * a different fact from consent never having been given.
 */
export interface RevokedValue extends Recorded {
  outcome: "revoked";
  original: SignedValue;
  revokedBy: Signer;
  revokedAt: string;
  reason: string;
}

export type SignatureValue =
  | SignedValue
  | DeclinedValue
  | UnableValue
  | VerbalValue
  | OnPaperValue
  | PendingValue
  | RevokedValue;

export type Outcome = SignatureValue["outcome"];

/** Every outcome, in the order they are offered in the interface. */
export const OUTCOMES = [
  "signed",
  "declined",
  "unable",
  "verbal",
  "on-paper",
  "pending",
  "revoked",
] as const satisfies readonly Outcome[];

/* ------------------------------------------------------------------ */
/* Guards                                                              */
/* ------------------------------------------------------------------ */

export const isSigned = (v: SignatureValue): v is SignedValue => v.outcome === "signed";
export const isDeclined = (v: SignatureValue): v is DeclinedValue => v.outcome === "declined";
export const isUnable = (v: SignatureValue): v is UnableValue => v.outcome === "unable";
export const isRevoked = (v: SignatureValue): v is RevokedValue => v.outcome === "revoked";

/**
 * Whether the field has been answered — which is not the same as "signed".
 *
 * This is the predicate a `required` form rule should use. A decline is a
 * complete answer to "does this person consent?", and a form that refuses to
 * submit until someone signs is a form that cannot record a refusal. Getting
 * this backwards is the single most likely integration mistake, which is why
 * it is a named export rather than left to each consumer.
 */
export function isAnswered(v: SignatureValue | null | undefined): boolean {
  if (!v) return false;
  return v.outcome !== "pending";
}

/**
 * Whether the subject actually agreed.
 *
 * Distinct from `isAnswered`. Use this to decide whether to proceed with a
 * procedure; use `isAnswered` to decide whether the form is complete.
 */
export function isAffirmative(v: SignatureValue | null | undefined): boolean {
  if (!v) return false;
  return v.outcome === "signed" || v.outcome === "verbal" || v.outcome === "on-paper";
}

/* ------------------------------------------------------------------ */
/* Runtime validation                                                  */
/* ------------------------------------------------------------------ */

/**
 * Invariants the type system cannot express, checked at the boundary.
 *
 * TypeScript enforces the shape for code we compile. A value arriving from a
 * server, a form library, or an older version of this package has not been
 * through that, and a malformed one would render a signature manifestation
 * that is subtly wrong rather than obviously broken.
 *
 * Returns problems rather than throwing, so a host can decide whether a
 * questionable historical record is worth surfacing or worth blocking.
 */
export function validate(value: SignatureValue): string[] {
  const problems: string[] = [];

  if (!value.recordedAt) {
    problems.push("recordedAt is required — a record entry must be dated and timed");
  } else if (Number.isNaN(Date.parse(value.recordedAt))) {
    problems.push(`recordedAt is not a valid ISO 8601 timestamp: ${value.recordedAt}`);
  }

  if (
    value.outcome !== "signed" &&
    value.outcome !== "revoked" &&
    !value.recordedBy?.name?.trim()
  ) {
    problems.push(
      `${value.outcome}: recordedBy is required — an outcome with no signer must say who recorded it, and FHIR Provenance.agent is 1..*`,
    );
  }

  switch (value.outcome) {
    case "signed": {
      if (!value.signer?.name.trim()) {
        problems.push("signed: signer.name is required — 21 CFR 11.50(a)(1) is the printed name");
      }
      if (!value.meaning) {
        problems.push("signed: meaning is required — 21 CFR 11.50(a)(3)");
      }
      if (value.capacity !== "self" && !value.onBehalfOf) {
        problems.push(
          `signed: capacity is "${value.capacity}" but onBehalfOf is missing — a signature given in a representative capacity must say who it is for`,
        );
      }
      if (value.method === "draw" && value.ink.strokes.length === 0) {
        problems.push("signed: method is draw but there are no strokes");
      }
      if (!value.ink.svg) {
        problems.push("signed: ink.svg is empty — nothing would render in the manifest");
      }
      break;
    }
    case "declined": {
      if (!value.reason?.trim()) {
        problems.push("declined: a reason is required — an unexplained refusal is not a record");
      }
      break;
    }
    case "unable": {
      // Enforced by the type for our own code; checked here for values that
      // did not come through it.
      if (!value.witness?.name?.trim()) {
        problems.push(
          "unable: a witness is required — an unwitnessed 'unable to sign' is an assertion, not a record",
        );
      }
      if (value.reason === "other" && !value.detail?.trim()) {
        problems.push('unable: reason is "other", so detail is required');
      }
      break;
    }
    case "verbal": {
      if (!value.witness?.name?.trim()) {
        problems.push("verbal: a witness is required for consent given without a mark");
      }
      break;
    }
    case "pending": {
      if (value.soFar.length === 0) {
        problems.push("pending: soFar is empty — nothing is actually pending");
      }
      break;
    }
    case "revoked": {
      if (!value.reason?.trim()) {
        problems.push("revoked: a reason is required");
      }
      if (!value.original) {
        problems.push("revoked: the original signature must be retained, never discarded");
      }
      break;
    }
    case "on-paper":
      break;
  }

  return problems;
}
