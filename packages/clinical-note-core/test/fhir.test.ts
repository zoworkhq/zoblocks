import { describe, expect, it } from "vitest";
import {
  AUTHORS_SIGNATURE,
  COAUTHORS_SIGNATURE,
  COMPOSITION_EXTENSION,
  SIGNATURE_TYPE_SYSTEM,
  base64,
  toComposition,
  toDocumentReference,
  toFhirBundle,
  toProvenance,
  withDigest,
  type Attestation,
  type FhirProvenance,
  type ToFhirOptions,
} from "../src/fhir.js";
import { LOINC, NOTE_TYPES, emptyNote } from "../src/schema.js";
import { toCanonical } from "../src/canonical.js";
import { toText } from "../src/text.js";
import { sampleNote } from "./helpers.js";

const AUTHOR = { reference: "Practitioner/88", display: "Rohit Menon, MD" };
const ATTENDING = { reference: "Practitioner/12", display: "Anjali Iyer, MD" };
const SUBJECT = { reference: "Patient/4471902", display: "RANDOL, Joshua" };
const DATE = "2026-08-16T14:41:07+05:30";

const base: ToFhirOptions = { noteType: "progress", subject: SUBJECT, author: AUTHOR, date: DATE };

const signed: readonly Attestation[] = [
  { who: AUTHOR, when: DATE },
  { who: ATTENDING, when: "2026-08-16T18:02:55+05:30", mode: "official" },
];

describe("toComposition", () => {
  it("codes the document with its LOINC type", () => {
    const c = toComposition(sampleNote(), base);
    expect(c.type.coding![0]).toEqual({
      system: LOINC,
      code: NOTE_TYPES.progress.code,
      display: "Progress note",
    });
  });

  it("is preliminary until it is signed, and final once it is", () => {
    expect(toComposition(sampleNote(), base).status).toBe("preliminary");
    expect(toComposition(sampleNote(), { ...base, attestations: signed }).status).toBe("final");
  });

  it("honours an explicit status", () => {
    expect(toComposition(sampleNote(), { ...base, status: "amended" }).status).toBe("amended");
  });

  it("emits one coded section per section, each with its own narrative", () => {
    // Not one narrative blob: `Composition.section.text` is where a consuming
    // system looks for the assessment, and a single div gives it nowhere to look.
    const c = toComposition(sampleNote(), base);
    expect(c.section).toHaveLength(4);
    for (const section of c.section) {
      expect(section.code!.coding![0]!.system).toBe(LOINC);
      expect(section.text!.div).toContain("xmlns");
    }
  });

  it("marks section narratives as additional, because they carry content nothing else does", () => {
    expect(toComposition(sampleNote(), base).section[0]!.text!.status).toBe("additional");
  });

  it("records every attester, in order, with their own time", () => {
    const c = toComposition(sampleNote(), { ...base, attestations: signed });
    expect(c.attester).toHaveLength(2);
    expect(c.attester![0]).toEqual({ mode: "personal", time: DATE, party: AUTHOR });
    expect(c.attester![1]!.mode).toBe("official");
  });

  it("has no attester at all while unsigned", () => {
    expect(toComposition(sampleNote(), base).attester).toBeUndefined();
  });

  it("links an addendum to the note it appends to, rather than editing it", () => {
    // The original stays `final` and unchanged. This is what makes the record
    // admissible, and it falls out of the same model that satisfies a patient's
    // right to amend under 45 CFR 164.526.
    const c = toComposition(sampleNote(), { ...base, appendsTo: { reference: "Composition/1" } });
    expect(c.relatesTo).toEqual([{ code: "appends", targetReference: { reference: "Composition/1" } }]);
  });

  it("carries an encounter when the host supplies one", () => {
    const c = toComposition(sampleNote(), { ...base, encounter: { reference: "Encounter/7" } });
    expect(c.encounter).toEqual({ reference: "Encounter/7" });
    expect(toComposition(sampleNote(), base).encounter).toBeUndefined();
  });

  it("uses the host's clock verbatim, offset and all", () => {
    // 42 CFR 482.24(c)(1) wants entries dated and timed; a browser clock is not
    // evidence, so the package never reads one.
    expect(toComposition(sampleNote(), base).date).toBe(DATE);
  });

  it("keeps provenance out of the narrative unless asked", () => {
    expect(JSON.stringify(toComposition(sampleNote(), base))).not.toContain("data-ox-origin");
    expect(
      JSON.stringify(toComposition(sampleNote(), { ...base, narrative: { provenance: true } })),
    ).toContain("data-ox-origin");
  });
});

describe("toDocumentReference", () => {
  it("carries the plain-text rendering, because that is the copy a v2 interface receives", () => {
    const text = toText(sampleNote());
    const ref = toDocumentReference(sampleNote(), base, text);
    expect(ref.content[0]!.attachment.contentType).toBe("text/plain");
    expect(ref.content[0]!.attachment.data).toBe(base64(text));
  });

  it("tracks the signing state in docStatus", () => {
    expect(toDocumentReference(sampleNote(), base, "x").docStatus).toBe("preliminary");
    expect(toDocumentReference(sampleNote(), { ...base, attestations: signed }, "x").docStatus).toBe("final");
  });
});

describe("toProvenance", () => {
  const target = { reference: "Composition/1" };

  it("is where the signature lives, because Composition.attester has no element for it", () => {
    // The finding that shapes the whole file, and the same one that shapes
    // signature-core: only Provenance.signature, Contract.signer.signature and
    // Bundle.signature carry the Signature datatype at all.
    const p = toProvenance(sampleNote(), { ...base, attestations: signed }, target);
    expect(p.signature).toHaveLength(2);
    expect(p.signature![0]!.type[0]).toEqual(AUTHORS_SIGNATURE);
    expect(p.signature![0]!.type[0]!.system).toBe(SIGNATURE_TYPE_SYSTEM);
  });

  it("codes the second signature as a coauthor's", () => {
    const p = toProvenance(sampleNote(), { ...base, attestations: signed }, target);
    expect(p.signature![1]!.type[0]).toEqual(COAUTHORS_SIGNATURE);
    expect(p.signature![1]!.when).toBe("2026-08-16T18:02:55+05:30");
  });

  it("takes an explicit purpose over the positional default", () => {
    const purpose = { system: SIGNATURE_TYPE_SYSTEM, code: "1.2.840.10065.1.12.1.5", display: "Verification Signature" };
    const p = toProvenance(sampleNote(), { ...base, attestations: [{ who: AUTHOR, when: DATE, purpose }] }, target);
    expect(p.signature![0]!.type[0]).toEqual(purpose);
  });

  it("carries signature bytes when the host captured them", () => {
    const p = toProvenance(
      sampleNote(),
      { ...base, attestations: [{ who: AUTHOR, when: DATE, data: "AAAA", sigFormat: "image/png" }] },
      target,
    );
    expect(p.signature![0]!.data).toBe("AAAA");
    expect(p.signature![0]!.sigFormat).toBe("image/png");
  });

  it("omits signature entirely on an unsigned draft", () => {
    expect(toProvenance(sampleNote(), base, target).signature).toBeUndefined();
  });

  it("records the composition ratios, because they were true at the moment of signing", () => {
    const p = toProvenance(sampleNote(), base, target);
    const ext = p.extension!.find((e) => e.url === COMPOSITION_EXTENSION)!;
    const copied = ext.extension!.find((e) => e.url === "copied")!;
    expect(copied.valueDecimal).toBeGreaterThan(0);
    expect(ext.extension!.find((e) => e.url === "total")!.valueInteger).toBeGreaterThan(0);
  });

  it("records the warnings the author acknowledged", () => {
    // A signature over a note with five acknowledged warnings is a different
    // artifact from one with none, and the record should say so.
    const p = toProvenance(sampleNote(), { ...base, acknowledgedWarnings: ["copy-forward", "stale-pull"] }, target);
    const ext = p.extension!.find((e) => e.url === COMPOSITION_EXTENSION)!;
    const acknowledged = ext.extension!.filter((e) => e.url === "acknowledgedWarning");
    expect(acknowledged.map((e) => e.valueString)).toEqual(["copy-forward", "stale-pull"]);
  });

  it("can be told to omit the non-standard extension", () => {
    expect(toProvenance(sampleNote(), { ...base, includeComposition: false }, target).extension).toBeUndefined();
  });

  it("advertises the extension as ours rather than pretending it is standard", () => {
    // The most valuable thing the component produces travels as a custom
    // extension. That is an acceptable trade only if it is stated.
    expect(COMPOSITION_EXTENSION).toContain("oxygenui.design");
  });
});

describe("toFhirBundle", () => {
  it("returns all three resources, because no one of them carries everything", () => {
    const bundle = toFhirBundle(sampleNote(), { ...base, attestations: signed }, toText(sampleNote()));
    expect(bundle.type).toBe("transaction");
    expect(bundle.entry.map((e) => e.resource.resourceType)).toEqual([
      "Composition",
      "DocumentReference",
      "Provenance",
    ]);
  });

  it("produces a bundle for an empty draft without throwing", () => {
    expect(() => toFhirBundle(emptyNote("progress"), base, "")).not.toThrow();
  });

  it("is JSON-serialisable", () => {
    const bundle = toFhirBundle(sampleNote(), base, toText(sampleNote()));
    expect(() => JSON.parse(JSON.stringify(bundle))).not.toThrow();
  });
});

describe("withDigest", () => {
  it("attaches a digest of the canonical bytes to the Provenance", () => {
    const doc = sampleNote();
    const bundle = toFhirBundle(doc, base, toText(doc));
    const sealed = withDigest(bundle, doc, (canonical) => `len:${canonical.length}`);
    const provenance = sealed.entry.find((e) => e.resource.resourceType === "Provenance")!
      .resource as FhirProvenance;
    const digest = provenance.extension!.find((e) => e.url.endsWith("note-digest"))!;
    expect(digest.valueString).toMatch(/^len:\d+$/);
  });

  it("hands the caller the canonical serialization, not the JSON blob", () => {
    const doc = sampleNote();
    let seen = "";
    withDigest(toFhirBundle(doc, base, ""), doc, (canonical) => {
      seen = canonical;
      return "x";
    });
    expect(seen).toBe(toCanonical(doc));
  });

  it("leaves the other resources untouched", () => {
    const doc = sampleNote();
    const bundle = toFhirBundle(doc, base, "");
    const sealed = withDigest(bundle, doc, () => "x");
    expect(sealed.entry[0]!.resource).toEqual(bundle.entry[0]!.resource);
    expect(sealed.entry[1]!.resource).toEqual(bundle.entry[1]!.resource);
  });

  it("preserves an existing extension rather than replacing it", () => {
    const doc = sampleNote();
    const sealed = withDigest(toFhirBundle(doc, base, ""), doc, () => "x");
    const provenance = sealed.entry.find((e) => e.resource.resourceType === "Provenance")!
      .resource as FhirProvenance;
    expect(provenance.extension!.some((e) => e.url === COMPOSITION_EXTENSION)).toBe(true);
  });

  it("ships no crypto of its own", async () => {
    // Which implementation — Node's crypto, WebCrypto, an HSM — is a deployment
    // decision, and the keys must never be within reach of a UI package.
    // Comments are stripped first: the JSDoc shows a host how to call it, which
    // is documentation rather than a dependency.
    const fs = await import("node:fs");
    const source = fs
      .readFileSync(new URL("../src/fhir.ts", import.meta.url), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(source).not.toMatch(/from ["']node:crypto|require\(["']crypto|createHash|crypto\.subtle/);
  });
});

describe("base64", () => {
  it("round-trips ASCII", () => {
    expect(base64("hello")).toBe("aGVsbG8=");
  });

  it("pads correctly at every length", () => {
    expect(base64("a")).toBe("YQ==");
    expect(base64("ab")).toBe("YWI=");
    expect(base64("abc")).toBe("YWJj");
  });

  it("survives the em dash that btoa throws on", () => {
    // Clinical prose is full of them, and `btoa` throws on anything above
    // U+00FF — so the first sentence of a real note would take it down.
    const text = "Hemoglobin 7.1 g/dL — down from 11.8";
    expect(() => base64(text)).not.toThrow();
    expect(Buffer.from(base64(text), "base64").toString("utf8")).toBe(text);
  });

  it("agrees with Node's own encoder on a realistic note", () => {
    const text = toText(sampleNote());
    expect(base64(text)).toBe(Buffer.from(text, "utf8").toString("base64"));
  });

  it("encodes the empty string as the empty string", () => {
    expect(base64("")).toBe("");
  });
});
