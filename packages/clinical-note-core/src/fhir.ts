/**
 * A note as FHIR.
 *
 * Three resources, because no single one carries all of it — the same finding
 * that shapes `signature-core`, arrived at from the other direction:
 *
 *   `Composition`        the note itself: coded sections, each with narrative
 *   `DocumentReference`  how it is indexed, found and retrieved
 *   `Provenance`         who did what, when — and the only one of the three
 *                        that can carry a signature at all
 *
 * `Composition.attester` records *that* someone attested and when, but has no
 * element for the signature itself. Only `Provenance.signature`,
 * `Contract.signer.signature` and `Bundle.signature` carry the `Signature`
 * datatype. So "produce a signed note" cannot mean "produce one resource", and
 * everything here returns a transaction `Bundle`.
 *
 * Written to the R4 shape throughout. R4's cardinality is a strict subset of
 * what R5 accepts, so populating it produces a payload valid under both.
 *
 * No dependency on `@oxygenui-design/fhir`: this emits plain JSON, so the
 * engine stays light and a consumer validates with whatever they already run.
 */

import type { Node as PMNode } from "prosemirror-model";
import { composition, type Composition } from "./compose.js";
import { toCanonical } from "./canonical.js";
import { sectionNarrative, toNarrative, type NarrativeOptions } from "./narrative.js";
import {
  LOINC,
  noteType,
  sectionAttrs,
  sections,
  type NoteTypeDef,
  type NoteTypeName,
} from "./schema.js";

/* ------------------------------------------------------------------ */
/* Minimal FHIR shapes                                                 */
/* ------------------------------------------------------------------ */

export interface FhirReference {
  reference?: string;
  display?: string;
  identifier?: { system?: string; value?: string };
}

export interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

export interface FhirNarrative {
  status: "generated" | "extensions" | "additional" | "empty";
  div: string;
}

export interface FhirExtension {
  url: string;
  valueString?: string;
  valueDecimal?: number;
  valueInteger?: number;
  extension?: FhirExtension[];
}

export interface FhirAttester {
  mode: "personal" | "professional" | "legal" | "official";
  time?: string;
  party?: FhirReference;
}

export interface FhirCompositionSection {
  title?: string;
  code?: FhirCodeableConcept;
  text?: FhirNarrative;
}

export interface FhirComposition {
  resourceType: "Composition";
  status: "preliminary" | "final" | "amended" | "entered-in-error";
  type: FhirCodeableConcept;
  subject?: FhirReference;
  encounter?: FhirReference;
  date: string;
  author: FhirReference[];
  title: string;
  attester?: FhirAttester[];
  relatesTo?: { code: string; targetReference: FhirReference }[];
  text?: FhirNarrative;
  section: FhirCompositionSection[];
}

export interface FhirDocumentReference {
  resourceType: "DocumentReference";
  status: "current" | "superseded" | "entered-in-error";
  docStatus?: "preliminary" | "final" | "amended" | "entered-in-error";
  type: FhirCodeableConcept;
  subject?: FhirReference;
  date: string;
  author: FhirReference[];
  content: { attachment: { contentType: string; data?: string; title?: string } }[];
}

export interface FhirSignature {
  type: FhirCoding[];
  when: string;
  who: FhirReference;
  sigFormat?: string;
  data?: string;
}

export interface FhirProvenance {
  resourceType: "Provenance";
  target: FhirReference[];
  recorded: string;
  agent: { type?: FhirCodeableConcept; who: FhirReference }[];
  signature?: FhirSignature[];
  extension?: FhirExtension[];
}

export interface FhirBundle {
  resourceType: "Bundle";
  type: "transaction";
  entry: { resource: FhirComposition | FhirDocumentReference | FhirProvenance }[];
}

/* ------------------------------------------------------------------ */
/* Codes                                                               */
/* ------------------------------------------------------------------ */

/** ISO/ASTM E1762-95 signature purposes, matching `signature-core`. */
export const SIGNATURE_TYPE_SYSTEM = "urn:iso-astm:E1762-95:2013";

export const AUTHORS_SIGNATURE: FhirCoding = {
  system: SIGNATURE_TYPE_SYSTEM,
  code: "1.2.840.10065.1.12.1.1",
  display: "Author's Signature",
};

export const COAUTHORS_SIGNATURE: FhirCoding = {
  system: SIGNATURE_TYPE_SYSTEM,
  code: "1.2.840.10065.1.12.1.2",
  display: "Coauthor's Signature",
};

/**
 * The Oxygen extension carrying composition ratios.
 *
 * **Not standard, and this file says so in the URL rather than hoping nobody
 * notices.** There is no FHIR element for per-range authorship or for "what
 * fraction of this note was copied forward", and it is the most valuable thing
 * the component produces. An unrecognised extension is safely ignored by a
 * conforming server, so the cost of being non-standard is that the data may not
 * survive a round trip — which is a fact a customer's integration engineer
 * should learn from our documentation, not from their own debugging.
 */
export const COMPOSITION_EXTENSION = "https://oxygenui.design/fhir/StructureDefinition/note-composition";

/* ------------------------------------------------------------------ */
/* Options                                                             */
/* ------------------------------------------------------------------ */

/** Someone who signed, and when. */
export interface Attestation {
  who: FhirReference;
  /** ISO 8601 with offset. From the host's clock. */
  when: string;
  /** `personal` for the author; `official` for an attending countersigning. */
  mode?: FhirAttester["mode"];
  /** Base64 signature bytes, if the host captured one. */
  data?: string;
  /** Media type of `data`, e.g. `image/png` or `application/jose`. */
  sigFormat?: string;
  /** Defaults to author's signature; use coauthor for a countersignature. */
  purpose?: FhirCoding;
}

export interface ToFhirOptions {
  noteType: NoteTypeName | NoteTypeDef;
  /** Who the note is about. */
  subject: FhirReference;
  /** Who wrote it. */
  author: FhirReference;
  /**
   * When the note was authored — ISO 8601 with offset, from the host's clock.
   *
   * Required, with no default. 42 CFR 482.24(c)(1) requires record entries to
   * be dated, timed and authenticated; a browser clock satisfies none of those
   * in a way anyone would defend, and a component that silently reads one has
   * made a claim about *when* on the host's behalf.
   */
  date: string;
  encounter?: FhirReference;
  /** Signatures, in order. Empty means an unsigned draft. */
  attestations?: readonly Attestation[];
  /** Composition status. Defaults to `final` when signed, `preliminary` when not. */
  status?: FhirComposition["status"];
  /** Set on an addendum: the note this one appends to. */
  appendsTo?: FhirReference;
  /** Emit the non-standard composition-ratio extension. Default true. */
  includeComposition?: boolean;
  /** Passed through to the narrative serializer. */
  narrative?: NarrativeOptions;
  /** Warnings the author acknowledged at signing. Recorded on the Provenance. */
  acknowledgedWarnings?: readonly string[];
}

/* ------------------------------------------------------------------ */
/* Builders                                                            */
/* ------------------------------------------------------------------ */

function ratioExtension(c: Composition, acknowledged: readonly string[]): FhirExtension {
  const parts: FhirExtension[] = [
    { url: "total", valueInteger: c.total },
    { url: "typed", valueDecimal: round(c.ratio.typed) },
    { url: "dictated", valueDecimal: round(c.ratio.dictated) },
    { url: "template", valueDecimal: round(c.ratio.template) },
    { url: "pulled", valueDecimal: round(c.ratio.pulled) },
    { url: "copied", valueDecimal: round(c.ratio.copied) },
    { url: "ai", valueDecimal: round(c.ratio.ai) },
  ];
  for (const id of acknowledged) parts.push({ url: "acknowledgedWarning", valueString: id });
  return { url: COMPOSITION_EXTENSION, extension: parts };
}

// Four places is more precision than any consumer needs and enough that the
// ratios still sum to 1 after rounding on a realistic note.
function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Build the `Composition`. */
export function toComposition(doc: PMNode, options: ToFhirOptions): FhirComposition {
  const def = noteType(options.noteType);
  const attestations = options.attestations ?? [];
  const signed = attestations.length > 0;

  const composed: FhirComposition = {
    resourceType: "Composition",
    status: options.status ?? (signed ? "final" : "preliminary"),
    type: { coding: [{ system: LOINC, code: def.code, display: def.title }] },
    subject: options.subject,
    date: options.date,
    author: [options.author],
    title: def.title,
    text: { status: "generated", div: toNarrative(doc, options.narrative) },
    section: sections(doc).map(({ node }) => {
      const { code, title, system } = sectionAttrs(node);
      const section: FhirCompositionSection = {
        title,
        code: { coding: [{ system, code }] },
        // `additional` rather than `generated`: the narrative carries content
        // that exists nowhere else in the resource, which is precisely what
        // that code means.
        text: { status: "additional", div: sectionNarrative(node, options.narrative) },
      };
      return section;
    }),
  };

  if (options.encounter) composed.encounter = options.encounter;

  if (signed) {
    composed.attester = attestations.map((a) => ({
      mode: a.mode ?? "personal",
      time: a.when,
      party: a.who,
    }));
  }

  if (options.appendsTo) {
    composed.relatesTo = [{ code: "appends", targetReference: options.appendsTo }];
  }

  return composed;
}

/** Build the `DocumentReference`. */
export function toDocumentReference(doc: PMNode, options: ToFhirOptions, text: string): FhirDocumentReference {
  const def = noteType(options.noteType);
  const signed = (options.attestations ?? []).length > 0;
  return {
    resourceType: "DocumentReference",
    status: "current",
    docStatus: signed ? "final" : "preliminary",
    type: { coding: [{ system: LOINC, code: def.code, display: def.title }] },
    subject: options.subject,
    date: options.date,
    author: [options.author],
    content: [
      {
        attachment: {
          contentType: "text/plain",
          // Base64 because that is what `Attachment.data` is. The plain-text
          // rendering rather than the narrative, because this is the copy that
          // reaches a v2 interface.
          data: base64(text),
          title: def.title,
        },
      },
    ],
  };
}

/** Build the `Provenance` — the resource that carries signatures. */
export function toProvenance(doc: PMNode, options: ToFhirOptions, target: FhirReference): FhirProvenance {
  const attestations = options.attestations ?? [];

  const provenance: FhirProvenance = {
    resourceType: "Provenance",
    target: [target],
    recorded: options.date,
    agent: [{ who: options.author }],
  };

  if (attestations.length > 0) {
    provenance.signature = attestations.map((a, i) => {
      const signature: FhirSignature = {
        type: [a.purpose ?? (i === 0 ? AUTHORS_SIGNATURE : COAUTHORS_SIGNATURE)],
        when: a.when,
        who: a.who,
      };
      if (a.sigFormat !== undefined) signature.sigFormat = a.sigFormat;
      if (a.data !== undefined) signature.data = a.data;
      return signature;
    });
  }

  if (options.includeComposition !== false) {
    provenance.extension = [
      ratioExtension(composition(doc), options.acknowledgedWarnings ?? []),
    ];
  }

  return provenance;
}

/**
 * The whole note as a transaction `Bundle`.
 *
 * `text` is passed in rather than computed so the caller controls the
 * plain-text options — line endings in particular, which an HL7 v2 interface
 * cares about a great deal.
 */
export function toFhirBundle(doc: PMNode, options: ToFhirOptions, text: string): FhirBundle {
  const composed = toComposition(doc, options);
  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: [
      { resource: composed },
      { resource: toDocumentReference(doc, options, text) },
      { resource: toProvenance(doc, options, { display: composed.title }) },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Integrity                                                           */
/* ------------------------------------------------------------------ */

/**
 * Attach a digest of the canonical serialization to a bundle's `Provenance`.
 *
 * `digest` is supplied by the caller. No crypto ships here: which
 * implementation to use — Node's `crypto`, WebCrypto, an HSM, a signing service
 * — is a deployment decision, and the keys involved must never be within reach
 * of a UI package. This is the seam, matching `withDetachedSignature` in
 * `signature-core`.
 *
 *     const bytes = toCanonical(doc);
 *     const hash  = createHash("sha256").update(bytes).digest("base64");
 *     withDigest(bundle, doc, () => hash);
 */
export function withDigest(
  bundle: FhirBundle,
  doc: PMNode,
  digest: (canonical: string) => string,
): FhirBundle {
  const canonical = toCanonical(doc);
  const value = digest(canonical);

  return {
    ...bundle,
    entry: bundle.entry.map((entry) => {
      if (entry.resource.resourceType !== "Provenance") return entry;
      const provenance = entry.resource;
      return {
        resource: {
          ...provenance,
          extension: [
            ...(provenance.extension ?? []),
            {
              url: "https://oxygenui.design/fhir/StructureDefinition/note-digest",
              valueString: value,
            },
          ],
        },
      };
    }),
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * UTF-8 safe base64, without assuming Node's `Buffer` or the browser's `btoa`.
 *
 * `btoa` throws on any character above U+00FF, which in a clinical note means
 * it throws on the first em dash — and clinical prose is full of them.
 */
export function base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  // `charAt` rather than indexing: it is total over the alphabet, so the six-bit
  // groups below need no assertions to satisfy `noUncheckedIndexedAccess`.
  const sextet = (n: number): string => alphabet.charAt(n);

  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    // Uint8Array indexes as `number`; past the end it is `undefined`, which the
    // length checks below distinguish from a real trailing zero byte.
    const a = bytes[i] ?? 0;
    const hasB = i + 1 < bytes.length;
    const hasC = i + 2 < bytes.length;
    const b = hasB ? (bytes[i + 1] ?? 0) : 0;
    const c = hasC ? (bytes[i + 2] ?? 0) : 0;

    out += sextet(a >> 2);
    out += sextet(((a & 3) << 4) | (b >> 4));
    out += hasB ? sextet(((b & 15) << 2) | (c >> 6)) : "=";
    out += hasC ? sextet(c & 63) : "=";
  }
  return out;
}
