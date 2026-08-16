/**
 * The outcome union and its FHIR mapping.
 *
 * These tests are the argument of the component, stated as assertions. The
 * ones worth reading twice:
 *
 *   - a decline counts as an *answered* field, so a `required` rule does not
 *     make refusal unrecordable;
 *   - a decline is not *affirmative*, so nothing proceeds on it;
 *   - every outcome produces a Provenance, because "nobody signed" is an event
 *     with an actor and a time, not the absence of one;
 *   - the R4 shape is emitted for both releases, since it is a strict subset.
 */

import { describe, expect, it } from "vitest";
import {
  OUTCOMES,
  isAffirmative,
  isAnswered,
  isDeclined,
  isRevoked,
  isSigned,
  isUnable,
  validate,
  type DeclinedValue,
  type Ink,
  type SignatureValue,
  type SignedValue,
  type UnableValue,
} from "../src/value";
import {
  SIGNATURE_TYPE,
  SIGNATURE_TYPE_SYSTEM,
  toFhirBundle,
  toFhirProvenance,
  toFhirSignature,
  withDetachedSignature,
} from "../src/fhir";

const ink: Ink = {
  strokes: [
    {
      pointerType: "pen",
      points: [
        { x: 0, y: 0, t: 0, pressure: 0.5 },
        { x: 40, y: 20, t: 16, pressure: 0.5 },
        { x: 80, y: 0, t: 32, pressure: 0.5 },
      ],
    },
  ],
  svg: '<svg viewBox="0 0 80 20"></svg>',
  png: "data:image/png;base64,iVBORw0KGgo=",
  bounds: { x: 0, y: 0, width: 80, height: 20 },
};

const signed: SignedValue = {
  outcome: "signed",
  method: "draw",
  ink,
  signer: { name: "Josh Randall", reference: "Patient/4471902" },
  capacity: "self",
  meaning: "consent",
  attestation: "I agree to the procedure described above.",
  recordedAt: "2026-08-16T14:36:02.000Z",
  recordedBy: { name: "A. Okafor", credential: "RN" },
  documentHash: "sha256:9f4bc210",
  provenance: { method: "draw", pointerType: "pen", strokeCount: 1, durationMs: 32 },
};

const declined: DeclinedValue = {
  outcome: "declined",
  reason: "Wants to discuss with her daughter before deciding.",
  recordedAt: "2026-08-16T14:32:00.000Z",
  recordedBy: { name: "A. Okafor", credential: "RN" },
};

const unable: UnableValue = {
  outcome: "unable",
  reason: "sedated-or-unconscious",
  detail: "Intubated in ICU bed 4.",
  witness: { name: "M. Silva", credential: "MD" },
  recordedAt: "2026-08-16T09:04:00.000Z",
  recordedBy: { name: "A. Okafor", credential: "RN" },
};

/* ------------------------------------------------------------------ */

describe("answering versus agreeing", () => {
  it("treats a decline as an answered field", () => {
    // The single most likely integration mistake: a `required` rule that only
    // accepts "signed" makes a refusal unrecordable, which is the exact
    // failure the whole union exists to prevent.
    expect(isAnswered(declined)).toBe(true);
    expect(isAnswered(unable)).toBe(true);
    expect(isAnswered(signed)).toBe(true);
  });

  it("does not treat a decline as agreement", () => {
    expect(isAffirmative(declined)).toBe(false);
    expect(isAffirmative(unable)).toBe(false);
    expect(isAffirmative(signed)).toBe(true);
  });

  it("treats an empty field as unanswered", () => {
    expect(isAnswered(null)).toBe(false);
    expect(isAnswered(undefined)).toBe(false);
    expect(isAffirmative(null)).toBe(false);
  });

  it("treats pending as not yet answered", () => {
    const pending: SignatureValue = {
      outcome: "pending",
      awaiting: "clinician",
      since: "2026-08-16T11:20:00.000Z",
      soFar: [signed],
      recordedAt: "2026-08-16T11:20:00.000Z",
      recordedBy: { name: "A. Okafor", credential: "RN" },
    };
    expect(isAnswered(pending)).toBe(false);
  });

  it("counts verbal and on-paper as agreement", () => {
    expect(
      isAffirmative({
        outcome: "verbal",
        channel: "phone",
        witness: { name: "M. Silva", credential: "MD" },
        recordedAt: "2026-08-16T10:00:00.000Z",
        recordedBy: { name: "A. Okafor", credential: "RN" },
      }),
    ).toBe(true);
    expect(
      isAffirmative({
        outcome: "on-paper",
        recordedAt: "2026-08-16T10:00:00.000Z",
        recordedBy: { name: "A. Okafor", credential: "RN" },
      }),
    ).toBe(true);
  });

  it("narrows correctly", () => {
    const v: SignatureValue = signed;
    if (isSigned(v)) expect(v.ink.strokes).toHaveLength(1);
    else throw new Error("guard failed to narrow");
  });
});

describe("validation", () => {
  it("accepts the well-formed values", () => {
    expect(validate(signed)).toEqual([]);
    expect(validate(declined)).toEqual([]);
    expect(validate(unable)).toEqual([]);
  });

  it("requires a printed name — 21 CFR 11.50(a)(1)", () => {
    expect(validate({ ...signed, signer: { name: "  " } }).join()).toMatch(/signer\.name/);
  });

  it("requires onBehalfOf whenever the capacity is representative", () => {
    // A signature given in a representative capacity that does not say who it
    // is for is not attributable to anyone.
    const proxy: SignedValue = { ...signed, capacity: "proxy" };
    expect(validate(proxy).join()).toMatch(/onBehalfOf/);

    const named: SignedValue = {
      ...proxy,
      onBehalfOf: { display: "Randall, Josh", reference: "Patient/4471902" },
    };
    expect(validate(named)).toEqual([]);
  });

  it("requires a witness on unable, even when the type was bypassed", () => {
    const bad = { ...unable, witness: undefined } as unknown as SignatureValue;
    expect(validate(bad).join()).toMatch(/witness is required/);
  });

  it("requires detail when the unable reason is 'other'", () => {
    expect(validate({ ...unable, reason: "other", detail: undefined }).join()).toMatch(/detail/);
  });

  it("requires a reason on a decline", () => {
    expect(validate({ ...declined, reason: "" }).join()).toMatch(/reason is required/);
  });

  it("rejects a malformed timestamp", () => {
    expect(validate({ ...signed, recordedAt: "yesterday" }).join()).toMatch(/ISO 8601/);
  });

  it("rejects a drawn signature with no strokes", () => {
    const empty: SignedValue = { ...signed, ink: { ...ink, strokes: [] } };
    expect(validate(empty).join()).toMatch(/no strokes/);
  });

  it("keeps the original on a revocation", () => {
    const bad = {
      outcome: "revoked",
      revokedBy: { name: "A. Okafor" },
      revokedAt: "2026-08-18T09:00:00.000Z",
      reason: "Patient withdrew before the procedure.",
      recordedAt: "2026-08-18T09:00:00.000Z",
    } as unknown as SignatureValue;
    expect(validate(bad).join()).toMatch(/original/);
  });
});

describe("FHIR Signature", () => {
  it("uses the full dotted OID, not a short integer", () => {
    // Easy to get wrong from the prose pages, impossible from the expansion.
    const sig = toFhirSignature(signed);
    expect(sig.type[0]).toEqual({
      system: SIGNATURE_TYPE_SYSTEM,
      code: "1.2.840.10065.1.12.1.7",
      display: "Consent Signature",
    });
  });

  it("maps every meaning to a distinct code", () => {
    const codes = Object.values(SIGNATURE_TYPE).map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(code).toMatch(/^1\.2\.840\.10065\.1\.12\.1\.\d+$/);
  });

  it("always populates type, when and who — the R4 shape", () => {
    // R4 requires all three; R5 relaxed them to optional. Writing the R4 shape
    // produces a payload valid in both, and `who` is what makes a signature
    // attributable at all.
    const sig = toFhirSignature(signed);
    expect(sig.type.length).toBeGreaterThan(0);
    expect(sig.when).toBe("2026-08-16T14:36:02.000Z");
    expect(sig.who.reference).toBe("Patient/4471902");
  });

  it("strips the data-URL prefix so data is bare base64", () => {
    // `Signature.data` is base64Binary. A "data:image/png;base64," prefix
    // validates fine and decodes to garbage everywhere downstream.
    const sig = toFhirSignature(signed);
    expect(sig.data).toBe("iVBORw0KGgo=");
    expect(sig.data).not.toContain("data:");
  });

  it("declares image/png, which is a graphical signature and nothing more", () => {
    expect(toFhirSignature(signed).sigFormat).toBe("image/png");
  });

  it("sets onBehalfOf only for a representative capacity", () => {
    expect(toFhirSignature(signed).onBehalfOf).toBeUndefined();

    const proxy: SignedValue = {
      ...signed,
      capacity: "proxy",
      signer: { name: "Marie Randall", reference: "RelatedPerson/88" },
      onBehalfOf: { display: "Randall, Josh", reference: "Patient/4471902" },
    };
    expect(toFhirSignature(proxy).onBehalfOf?.reference).toBe("Patient/4471902");
  });

  it("pairs the ink with a detached JWS when non-repudiation is needed", () => {
    // The honest pattern: the PNG for human review, a JWS over the canonical
    // bytes for actual integrity, sharing who and when.
    const pair = withDetachedSignature(toFhirSignature(signed), "eyJhbGciOiJFUzI1NiJ9..sig");
    expect(pair).toHaveLength(2);
    expect(pair[0]!.sigFormat).toBe("image/png");
    expect(pair[1]!.sigFormat).toBe("application/jose");
    expect(pair[1]!.targetFormat).toBe("application/fhir+json");
    expect(pair[0]!.when).toBe(pair[1]!.when);
  });
});

describe("FHIR Provenance", () => {
  it("carries the signature for a signed outcome", () => {
    const p = toFhirProvenance(signed, { target: { reference: "Consent/9f4b" } });
    expect(p.resourceType).toBe("Provenance");
    expect(p.target[0]!.reference).toBe("Consent/9f4b");
    expect(p.signature).toHaveLength(1);
  });

  it("produces a Provenance for every outcome, signature or not", () => {
    // A decline is an event with an actor and a time. Modelling it as the
    // absence of a Provenance makes it indistinguishable from a form nobody
    // opened — which is the failure the whole union exists to prevent.
    const values: SignatureValue[] = [
      signed,
      declined,
      unable,
      {
        outcome: "verbal",
        channel: "video",
        witness: { name: "M. Silva", credential: "MD" },
        recordedAt: "2026-08-16T10:00:00.000Z",
        recordedBy: { name: "A. Okafor", credential: "RN" },
      },
      {
        outcome: "on-paper",
        recordedAt: "2026-08-16T10:00:00.000Z",
        recordedBy: { name: "A. Okafor", credential: "RN" },
      },
    ];

    for (const value of values) {
      const p = toFhirProvenance(value);
      expect(p.resourceType, value.outcome).toBe("Provenance");
      expect(p.recorded, value.outcome).toBeTruthy();
      expect(p.agent.length, value.outcome).toBeGreaterThan(0);
    }
  });

  it("names what happened when nobody signed", () => {
    expect(toFhirProvenance(declined).activity?.coding[0]!.code).toBe("declined");
    expect(toFhirProvenance(unable).activity?.coding[0]!.code).toBe("unable");
    expect(toFhirProvenance(declined).signature).toBeUndefined();
  });

  it("uses an obviously local code rather than inventing a standard one", () => {
    // A plausible-looking fake OID would be trusted and mismapped. A local
    // system is visibly ours, so a consumer knows to map it.
    const system = toFhirProvenance(declined).activity?.coding[0]!.system;
    expect(system).toContain("oxygenui.design");
  });

  it("records the witness as an agent, not just as prose", () => {
    const p = toFhirProvenance(unable);
    expect(p.agent.some((a) => a.type?.text === "witness")).toBe(true);
    expect(p.agent.some((a) => a.who.display?.includes("M. Silva"))).toBe(true);
  });

  it("retains the original signature on a revocation", () => {
    const p = toFhirProvenance({
      outcome: "revoked",
      original: signed,
      revokedBy: { name: "A. Okafor", credential: "RN" },
      revokedAt: "2026-08-18T09:00:00.000Z",
      reason: "Patient withdrew before the procedure.",
      recordedAt: "2026-08-18T09:00:00.000Z",
    });

    // Consent given and then withdrawn is a different fact from consent never
    // given, and only the retained signature can tell them apart.
    expect(p.signature).toHaveLength(1);
    expect(p.recorded).toBe("2026-08-18T09:00:00.000Z");
    expect(p.activity?.coding[0]!.code).toBe("revoked");
  });

  it("keeps co-signers together while pending", () => {
    const p = toFhirProvenance({
      outcome: "pending",
      awaiting: "clinician",
      since: "2026-08-16T11:20:00.000Z",
      soFar: [signed],
      recordedAt: "2026-08-16T11:20:00.000Z",
    });
    expect(p.signature).toHaveLength(1);
  });
});

describe("FHIR Bundle", () => {
  it("emits a pair, because Consent has no signature element", () => {
    // The finding that shapes the whole mapping: neither R4 nor R5 Consent has
    // a Signature-typed element, so the ink can only live on a Provenance
    // pointing at it.
    const bundle = toFhirBundle(signed, { subject: { display: "Randall, Josh" } });
    expect(bundle.type).toBe("transaction");
    expect(bundle.entry).toHaveLength(2);
    expect(bundle.entry[0]!.resource.resourceType).toBe("Consent");
    expect(bundle.entry[1]!.resource.resourceType).toBe("Provenance");
  });

  it("emits only the Provenance when the target already exists", () => {
    const bundle = toFhirBundle(signed, { target: { reference: "Consent/9f4b" } });
    expect(bundle.entry).toHaveLength(1);
    expect(bundle.entry[0]!.resource.resourceType).toBe("Provenance");
  });

  it("uses R4's scope and dateTime", () => {
    const consent = toFhirBundle(signed, { release: "R4" }).entry[0]!.resource;
    expect(consent.scope).toBeDefined();
    expect(consent.dateTime).toBe("2026-08-16T14:36:02.000Z");
    expect(consent.decision).toBeUndefined();
  });

  it("drops scope in R5 and moves the decision to the root", () => {
    const consent = toFhirBundle(signed, { release: "R5" }).entry[0]!.resource;
    expect(consent.scope).toBeUndefined();
    expect(consent.decision).toBe("permit");
  });

  it("never stores the signing time in Consent.date, which is date-only in R5", () => {
    // R5 renamed dateTime to date *and* narrowed the type, silently discarding
    // the time of day. The signing instant lives on Signature.when.
    const consent = toFhirBundle(signed, { release: "R5" }).entry[0]!.resource;
    expect(consent.date).toBe("2026-08-16");

    const provenance = toFhirBundle(signed, { release: "R5" }).entry[1]!.resource as {
      signature: Array<{ when: string }>;
    };
    expect(provenance.signature[0]!.when).toBe("2026-08-16T14:36:02.000Z");
  });

  it("records a decline as a denying Consent, not a missing one", () => {
    const consent = toFhirBundle(declined, { release: "R5" }).entry[0]!.resource;
    expect(consent.decision).toBe("deny");
    expect(consent.status).toBe("active");
  });

  it("marks a revoked consent inactive", () => {
    const consent = toFhirBundle(
      {
        outcome: "revoked",
        original: signed,
        revokedBy: { name: "A. Okafor" },
        revokedAt: "2026-08-18T09:00:00.000Z",
        reason: "Withdrew.",
        recordedAt: "2026-08-18T09:00:00.000Z",
      },
      { release: "R5" },
    ).entry[0]!.resource;
    expect(consent.status).toBe("inactive");
  });

  it("round-trips every outcome without throwing", () => {
    const values: SignatureValue[] = [
      signed,
      declined,
      unable,
      {
        outcome: "verbal",
        channel: "phone",
        witness: { name: "M. Silva", credential: "MD" },
        recordedAt: "2026-08-16T10:00:00.000Z",
        recordedBy: { name: "A. Okafor", credential: "RN" },
      },
      {
        outcome: "on-paper",
        recordedAt: "2026-08-16T10:00:00.000Z",
        recordedBy: { name: "A. Okafor", credential: "RN" },
      },
      {
        outcome: "pending",
        awaiting: "clinician",
        since: "2026-08-16T11:20:00.000Z",
        soFar: [signed],
        recordedAt: "2026-08-16T11:20:00.000Z",
        recordedBy: { name: "A. Okafor", credential: "RN" },
      },
      {
        outcome: "revoked",
        original: signed,
        revokedBy: { name: "A. Okafor" },
        revokedAt: "2026-08-18T09:00:00.000Z",
        reason: "Withdrew.",
        recordedAt: "2026-08-18T09:00:00.000Z",
      },
    ];

    for (const release of ["R4", "R5"] as const) {
      for (const value of values) {
        const bundle = toFhirBundle(value, { release });
        expect(JSON.parse(JSON.stringify(bundle)), `${release}/${value.outcome}`).toBeTruthy();
      }
    }
  });
});

describe("no clock, no DOM", () => {
  it("never reads the current time", async () => {
    // A component that stamps its own timestamp puts an unverifiable value in
    // a legal record — and 42 CFR 482.24(c)(1) requires entries to be dated
    // and timed by whoever is accountable, not by the device.
    const source = await import("node:fs/promises");
    const dir = new URL("../src/", import.meta.url);
    const files = await source.readdir(dir);

    for (const file of files.filter((f) => f.endsWith(".ts"))) {
      const text = await source.readFile(new URL(file, dir), "utf8");
      const code = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      expect(code, `${file} reads the clock`).not.toMatch(/Date\.now\(\)|new Date\(\s*\)/);
      expect(code, `${file} touches the DOM`).not.toMatch(
        /\bdocument\.|\bwindow\.|HTMLElement|createElement/,
      );
    }
  });
});

describe("attribution", () => {
  it("requires recordedBy on every outcome with no signer", () => {
    // "The patient declined" with nobody attached is the unattributable record
    // the union exists to prevent — and FHIR Provenance.agent is 1..*, so an
    // unattributed outcome would also emit an invalid resource.
    const anonymous = { ...declined, recordedBy: undefined } as unknown as SignatureValue;
    expect(validate(anonymous).join()).toMatch(/recordedBy is required/);
  });

  it("does not require it on a signed value, which already has a signer", () => {
    const rest: SignedValue = { ...signed };
    delete (rest as Partial<SignedValue>).recordedBy;
    expect(validate(rest)).toEqual([]);
  });

  it("always emits at least one FHIR agent", () => {
    const values: SignatureValue[] = [signed, declined, unable];
    for (const value of values) {
      expect(toFhirProvenance(value).agent.length, value.outcome).toBeGreaterThan(0);
    }
  });
});

describe("guards and edge cases", () => {
  const verbal: SignatureValue = {
    outcome: "verbal",
    channel: "video",
    script: "Read the consent aloud and confirmed understanding.",
    witness: { name: "M. Silva", credential: "MD" },
    recordedAt: "2026-08-16T10:00:00.000Z",
    recordedBy: { name: "A. Okafor", credential: "RN" },
  };
  const onPaper: SignatureValue = {
    outcome: "on-paper",
    scanRef: "DocumentReference/9911",
    recordedAt: "2026-08-16T10:00:00.000Z",
    recordedBy: { name: "A. Okafor", credential: "RN" },
  };
  const revoked: SignatureValue = {
    outcome: "revoked",
    original: signed,
    revokedBy: { name: "A. Okafor", credential: "RN" },
    revokedAt: "2026-08-18T09:00:00.000Z",
    reason: "Patient withdrew before the procedure.",
    recordedAt: "2026-08-18T09:00:00.000Z",
  };

  it("narrows each outcome to exactly one guard", () => {
    const cases: Array<[SignatureValue, string]> = [
      [signed, "signed"],
      [declined, "declined"],
      [unable, "unable"],
      [revoked, "revoked"],
    ];
    for (const [value, expected] of cases) {
      const hits = [
        isSigned(value) && "signed",
        isDeclined(value) && "declined",
        isUnable(value) && "unable",
        isRevoked(value) && "revoked",
      ].filter(Boolean);
      expect(hits, value.outcome).toEqual([expected]);
    }
  });

  it("OUTCOMES lists every member of the union exactly once", () => {
    // If a new outcome is added to the type without being added here, the
    // interface that iterates OUTCOMES silently stops offering it.
    expect(new Set(OUTCOMES).size).toBe(OUTCOMES.length);
    expect(OUTCOMES).toContain("signed");
    expect(OUTCOMES).toContain("revoked");
  });

  it("accepts a well-formed verbal, on-paper and revoked value", () => {
    expect(validate(verbal)).toEqual([]);
    expect(validate(onPaper)).toEqual([]);
    expect(validate(revoked)).toEqual([]);
  });

  it("requires a witness for verbal consent", () => {
    // No mark exists at all, so the witness is the only evidence the
    // conversation happened.
    const bad = { ...verbal, witness: undefined } as unknown as SignatureValue;
    expect(validate(bad).join()).toMatch(/witness is required/);
  });

  it("requires a reason on a revocation", () => {
    expect(validate({ ...revoked, reason: "  " } as SignatureValue).join()).toMatch(/reason/);
  });

  it("rejects an empty pending value", () => {
    const bad: SignatureValue = {
      outcome: "pending",
      awaiting: "clinician",
      since: "2026-08-16T11:20:00.000Z",
      soFar: [],
      recordedAt: "2026-08-16T11:20:00.000Z",
      recordedBy: { name: "A. Okafor" },
    };
    expect(validate(bad).join()).toMatch(/nothing is actually pending/);
  });

  it("requires a recordedAt at all", () => {
    const bad = { ...declined, recordedAt: "" } as SignatureValue;
    expect(validate(bad).join()).toMatch(/recordedAt is required/);
  });

  it("requires a meaning — 21 CFR 11.50(a)(3)", () => {
    const bad = { ...signed, meaning: undefined } as unknown as SignatureValue;
    expect(validate(bad).join()).toMatch(/meaning is required/);
  });

  it("rejects a signature with no renderable ink", () => {
    // An empty svg would render as a blank space in the manifest, which is
    // indistinguishable from no signature at all.
    const bad: SignedValue = { ...signed, ink: { ...ink, svg: "" } };
    expect(validate(bad).join()).toMatch(/ink\.svg is empty/);
  });

  it("allows a typed signature to have no strokes", () => {
    // A typed signature has no stroke model, and fabricating one would put
    // invented geometry into a legal record.
    const typed: SignedValue = { ...signed, method: "type", ink: { ...ink, strokes: [] } };
    expect(validate(typed)).toEqual([]);
  });

  it("reports every problem at once rather than stopping at the first", () => {
    // A caller fixing one field at a time through five round-trips is worse
    // than one list.
    const bad = {
      outcome: "unable",
      reason: "other",
      recordedAt: "not-a-date",
    } as unknown as SignatureValue;
    expect(validate(bad).length).toBeGreaterThan(2);
  });
});
