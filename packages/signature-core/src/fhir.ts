/**
 * SignatureValue to FHIR.
 *
 * One finding shapes this entire file, and it surprises everyone who has not
 * checked: **the `Consent` resource has no signature element.** Not in R4, not
 * in R5. Neither does `Composition.attester`, nor `DocumentReference.attester`.
 * Only `Provenance.signature`, `Contract.signer.signature` and
 * `Bundle.signature` carry the `Signature` datatype at all.
 *
 * So "produce a consent signature" cannot mean "produce one resource". It has
 * to be a pair — the consent, plus a `Provenance` whose `.target` points at it
 * and whose `.signature` carries the ink — which is why everything here returns
 * a transaction `Bundle` rather than a resource.
 *
 * Written to the **R4** shape throughout, including for R5 output. R5 only
 * relaxed cardinality on `type`, `when` and `who` (each from required to
 * optional); R4's stricter shape is therefore a strict subset of what R5
 * accepts, and always populating those three produces a payload valid in both.
 * The relaxation is not an invitation to omit `who` — that is the element that
 * makes a signature attributable at all.
 *
 * No dependency on `@oxygenui-design/fhir`: this emits plain JSON objects, so
 * the engine stays dependency-free and a consumer can validate them with
 * whatever they already use.
 */

import type {
  Capacity,
  Signer,
  SignatureMeaning,
  SignatureValue,
  SignedValue,
  Subject,
} from "./value";

/* ------------------------------------------------------------------ */
/* Codes                                                               */
/* ------------------------------------------------------------------ */

/**
 * The signature-type value set.
 *
 * The codes are the full dotted OIDs, not the short integers the display order
 * suggests — a detail easy to get wrong from the prose pages and impossible to
 * get wrong from the value set expansion.
 */
export const SIGNATURE_TYPE_SYSTEM = "urn:iso-astm:E1762-95:2013";

export const SIGNATURE_TYPE: Record<SignatureMeaning, { code: string; display: string }> = {
  author: { code: "1.2.840.10065.1.12.1.1", display: "Author's Signature" },
  coauthor: { code: "1.2.840.10065.1.12.1.2", display: "Coauthor's Signature" },
  verification: { code: "1.2.840.10065.1.12.1.5", display: "Verification Signature" },
  validation: { code: "1.2.840.10065.1.12.1.6", display: "Validation Signature" },
  consent: { code: "1.2.840.10065.1.12.1.7", display: "Consent Signature" },
  // `.8` Signature Witness is witnessing the *signing*. `.11` Consent Witness
  // is witnessing the *counselling*. Different events; not interchangeable.
  witness: { code: "1.2.840.10065.1.12.1.8", display: "Signature Witness Signature" },
  interpreter: { code: "1.2.840.10065.1.12.1.12", display: "Interpreter Signature" },
  review: { code: "1.2.840.10065.1.12.1.13", display: "Review Signature" },
};

/**
 * Capacity to the reference type FHIR expects for the signer.
 *
 * A patient signing for themselves is a `Patient`; a daughter signing under a
 * power of attorney is a `RelatedPerson`; a clinician is a `Practitioner`.
 * Getting this wrong produces a technically valid resource that says something
 * false about who was in the room.
 */
const RESOURCE_FOR_CAPACITY: Record<Capacity, string> = {
  self: "Patient",
  parent: "RelatedPerson",
  proxy: "RelatedPerson",
  "legal-representative": "RelatedPerson",
  clinician: "Practitioner",
  witness: "Practitioner",
  interpreter: "Practitioner",
};

export interface FhirReference {
  reference?: string;
  display?: string;
}

export interface FhirSignature {
  type: Array<{ system: string; code: string; display: string }>;
  when: string;
  who: FhirReference;
  onBehalfOf?: FhirReference;
  targetFormat?: string;
  sigFormat?: string;
  data?: string;
}

export interface ToFhirOptions {
  /** Output release. Both receive the R4 shape; this only affects `Consent`. */
  release?: "R4" | "R5";
  /** Who the signature is about. */
  subject?: Subject;
  /** What was signed, for `Provenance.target`. */
  target?: FhirReference;
  /** Serialization the signature was computed over. */
  targetFormat?: string;
}

function referenceFor(signer: Signer, capacity: Capacity): FhirReference {
  const ref: FhirReference = {
    display: signer.credential ? `${signer.name}, ${signer.credential}` : signer.name,
  };
  if (signer.reference) ref.reference = signer.reference;
  else ref.reference = `${RESOURCE_FOR_CAPACITY[capacity]}/${"unknown"}`;
  return ref;
}

/**
 * Strip the data-URL prefix so `Signature.data` is bare base64.
 *
 * `data` is `base64Binary`. A value beginning `data:image/png;base64,` is a
 * URL, not base64, and a validator will accept it silently while every
 * consumer that decodes it gets garbage.
 */
function bareBase64(dataUrl: string | undefined): string | undefined {
  if (!dataUrl) return undefined;
  const comma = dataUrl.indexOf(",");
  return dataUrl.startsWith("data:") && comma !== -1 ? dataUrl.slice(comma + 1) : dataUrl;
}

/* ------------------------------------------------------------------ */
/* Signature                                                           */
/* ------------------------------------------------------------------ */

/**
 * A single `Signature` element.
 *
 * `sigFormat` is `image/png`, and that is an honest declaration rather than a
 * shrug: this is a *graphical* signature, a picture of a mark, carrying no
 * cryptographic integrity guarantee whatsoever. Anyone can crop it out and
 * paste it elsewhere. Integrators routinely assume `Signature` implies
 * cryptographic signing, and a component that does not say otherwise is
 * letting them.
 *
 * Where non-repudiation is genuinely required, the mature pattern is two
 * entries in the same `Provenance.signature` array sharing `who` and `when`:
 * this one for human review, and a second with `sigFormat: "application/jose"`
 * holding a JWS over the canonical resource bytes. Signing keys are a
 * deployment concern, so that second entry is the host's to add — see
 * `withDetachedSignature` below for the seam.
 */
export function toFhirSignature(value: SignedValue, options: ToFhirOptions = {}): FhirSignature {
  const type = SIGNATURE_TYPE[value.meaning];
  const signature: FhirSignature = {
    type: [{ system: SIGNATURE_TYPE_SYSTEM, code: type.code, display: type.display }],
    when: value.recordedAt,
    who: referenceFor(value.signer, value.capacity),
    sigFormat: "image/png",
  };

  if (value.capacity !== "self" && value.onBehalfOf) {
    signature.onBehalfOf = {
      display: value.onBehalfOf.display,
      ...(value.onBehalfOf.reference ? { reference: value.onBehalfOf.reference } : {}),
    };
  }

  if (options.targetFormat) signature.targetFormat = options.targetFormat;

  const data = bareBase64(value.ink.png);
  if (data) signature.data = data;

  return signature;
}

/** Attach a host-computed detached signature alongside the graphical one. */
export function withDetachedSignature(
  graphical: FhirSignature,
  jws: string,
  targetFormat = "application/fhir+json",
): FhirSignature[] {
  return [
    graphical,
    {
      ...graphical,
      sigFormat: "application/jose",
      targetFormat,
      data: jws,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Provenance                                                          */
/* ------------------------------------------------------------------ */

export interface FhirProvenance {
  resourceType: "Provenance";
  target: FhirReference[];
  recorded: string;
  activity?: { coding: Array<{ system: string; code: string; display: string }> };
  agent: Array<{ type?: { text: string }; who: FhirReference }>;
  signature?: FhirSignature[];
}

/**
 * The `Provenance` that carries the signature, or records that none was given.
 *
 * The non-signed outcomes get a Provenance with no `.signature` and an
 * `activity` naming what happened. That is the point: a decline is an event
 * with an actor and a time, and modelling it as the absence of a Provenance
 * would make it indistinguishable from a form nobody opened.
 */
export function toFhirProvenance(
  value: SignatureValue,
  options: ToFhirOptions = {},
): FhirProvenance {
  const target = options.target ? [options.target] : [];
  const agent: FhirProvenance["agent"] = [];

  const push = (signer: Signer | undefined, role: string) => {
    if (!signer) return;
    agent.push({
      type: { text: role },
      who: {
        display: signer.credential ? `${signer.name}, ${signer.credential}` : signer.name,
        ...(signer.reference ? { reference: signer.reference } : {}),
      },
    });
  };

  const provenance: FhirProvenance = {
    resourceType: "Provenance",
    target,
    recorded: value.outcome === "revoked" ? value.revokedAt : value.recordedAt,
    agent,
  };

  switch (value.outcome) {
    case "signed": {
      push(value.signer, "author");
      push(value.recordedBy, "enterer");
      provenance.signature = [toFhirSignature(value, options)];
      break;
    }
    case "declined": {
      push(value.recordedBy, "enterer");
      push(value.witness, "witness");
      provenance.activity = activity("declined", "Consent declined by the subject");
      break;
    }
    case "unable": {
      push(value.recordedBy, "enterer");
      push(value.witness, "witness");
      provenance.activity = activity("unable", "Subject unable to sign; witnessed");
      break;
    }
    case "verbal": {
      push(value.recordedBy, "enterer");
      push(value.witness, "witness");
      provenance.activity = activity("verbal", "Consent obtained verbally and witnessed");
      break;
    }
    case "on-paper": {
      push(value.recordedBy, "enterer");
      provenance.activity = activity("on-paper", "Signed on paper; scan pending or attached");
      break;
    }
    case "pending": {
      push(value.recordedBy, "enterer");
      provenance.activity = activity(
        "pending",
        `Awaiting signature in capacity: ${value.awaiting}`,
      );
      // Whoever has already signed keeps their signature on this Provenance —
      // the element is 0..*, so co-signers live together naturally.
      const signatures = value.soFar
        .filter((v): v is SignedValue => v.outcome === "signed")
        .map((v) => toFhirSignature(v, options));
      if (signatures.length) provenance.signature = signatures;
      break;
    }
    case "revoked": {
      push(value.revokedBy, "author");
      provenance.activity = activity("revoked", `Consent withdrawn: ${value.reason}`);
      // The original signature is retained, never dropped. The record must show
      // that consent was given and then withdrawn, which is a different fact
      // from consent never having been given.
      provenance.signature = [toFhirSignature(value.original, options)];
      break;
    }
  }

  return provenance;
}

/**
 * Local codes, deliberately.
 *
 * There is no standard value set for "the patient declined to sign" as a
 * Provenance activity, and inventing a plausible-looking standard code would
 * be worse than an obviously local one — a consumer can see this is ours and
 * map it, where a fake OID would be trusted and mismapped.
 */
function activity(code: string, display: string) {
  return {
    coding: [{ system: "https://oxygenui.design/fhir/signature-outcome", code, display }],
  };
}

/* ------------------------------------------------------------------ */
/* Bundle                                                              */
/* ------------------------------------------------------------------ */

export interface FhirBundle {
  resourceType: "Bundle";
  type: "transaction";
  entry: Array<{ resource: Record<string, unknown>; request: { method: "POST"; url: string } }>;
}

/**
 * The complete output: the record and its Provenance, as one transaction.
 *
 * A transaction rather than two calls because they must land together. A
 * consent stored without its Provenance is a consent with no signature and no
 * attribution — worse than not storing it, because it looks complete.
 */
export function toFhirBundle(value: SignatureValue, options: ToFhirOptions = {}): FhirBundle {
  const release = options.release ?? "R4";
  const provenance = toFhirProvenance(value, options);

  const entry: FhirBundle["entry"] = [];

  if (!options.target) {
    entry.push({
      resource: consentResource(value, release, options),
      request: { method: "POST", url: "Consent" },
    });
    provenance.target = [{ reference: "Consent/$this" }];
  }

  entry.push({
    resource: provenance as unknown as Record<string, unknown>,
    request: { method: "POST", url: "Provenance" },
  });

  return { resourceType: "Bundle", type: "transaction", entry };
}

/**
 * A minimal `Consent`, in the shape of the requested release.
 *
 * Two R4 to R5 changes are load-bearing and are the reason this is a switch
 * rather than one object: `scope` was **removed** in R5, and `dateTime` became
 * `date` — renamed *and* narrowed from `dateTime` to `date`, silently
 * discarding the time of day. The signing timestamp therefore never lives
 * here; it lives on `Signature.when`, which is an `instant`.
 */
function consentResource(
  value: SignatureValue,
  release: "R4" | "R5",
  options: ToFhirOptions,
): Record<string, unknown> {
  const subject = options.subject
    ? {
        display: options.subject.display,
        ...(options.subject.reference ? { reference: options.subject.reference } : {}),
      }
    : undefined;

  const decision =
    value.outcome === "signed" || value.outcome === "verbal" || value.outcome === "on-paper"
      ? "permit"
      : "deny";

  if (release === "R5") {
    return {
      resourceType: "Consent",
      status: value.outcome === "revoked" ? "inactive" : "active",
      ...(subject ? { subject } : {}),
      // R5 moved permit/deny from provision.type up to the root.
      decision,
      date: value.recordedAt.slice(0, 10),
    };
  }

  return {
    resourceType: "Consent",
    status: value.outcome === "revoked" ? "inactive" : "active",
    // Required in R4, gone in R5.
    scope: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: "patient-privacy",
        },
      ],
    },
    category: [
      {
        coding: [
          { system: "http://terminology.hl7.org/CodeSystem/consentcategorycodes", code: "acd" },
        ],
      },
    ],
    ...(subject ? { patient: subject } : {}),
    dateTime: value.recordedAt,
    provision: { type: decision },
  };
}
