# @oxygenui-design/clinical-note-core

The engine behind Oxygen's `ClinicalNote`. Coded sections, per-range
provenance, a composable sign gate, and deterministic serialization to FHIR,
XHTML and plain text.

No React, no Ant Design, **no DOM** — the whole package runs in Node, which is
what lets a server validate, render or re-hash a note without a browser
anywhere in the picture.

```bash
npm install @oxygenui-design/clinical-note-core
```

---

## The idea

Every character in a clinical note has an origin. Some the clinician typed;
some was dictated and transcribed with errors; some a template fired; some was
pulled from a lab result and was true eight hours ago; some was copied forward
from a note about a different admission; and increasingly some was written by a
model.

In every EHR shipping today all of that collapses into identical black text the
moment it lands on screen. The clinician signs, and in doing so attests to it
equally.

Three well-documented problems fall out of that one missing data structure —
note bloat, copy-paste error, and AI attribution. Storing origin per range does
not solve any of them, but it makes all three **visible**, which is the
prerequisite.

```ts
import {
  emptyNote,
  runGate,
  DEFAULT_RULES,
  composition,
  toFhirBundle,
  toText,
} from "@oxygenui-design/clinical-note-core";

const doc = emptyNote("progress");

const gate = runGate(doc, DEFAULT_RULES, {
  noteType: "progress",
  now: await serverTime(), // there is no clock in this package
  subject: "Patient/4471902",
});

gate.canSign; // false — the assessment is empty
gate.blocking; // [{ id: "required-sections:51847-2", … }]

composition(doc).ratio.copied; // 0.62 — measured, not estimated
```

---

## What it does

| Module          | Responsibility                                                        |
| --------------- | --------------------------------------------------------------------- |
| `schema.ts`     | LOINC-coded sections as ProseMirror nodes. Invalid notes are unbuildable. |
| `provenance.ts` | The six origins, as a mark that survives arbitrary editing.            |
| `compose.ts`    | Origin ratios, copy-forward measurement, stale pulls, cross-patient text, diff. |
| `gate.ts`       | The rule engine and nine default rules. Nothing signs while a `block` stands. |
| `expand.ts`     | Dot phrases, `***` blanks, `{a:b:c}` pick lists, F2 traversal.         |
| `canonical.ts`  | Same document, same bytes, forever. What a signature is computed over. |
| `narrative.ts`  | FHIR-legal XHTML, as a string. A total function.                      |
| `text.ts`       | Plain text for HL7 v2 `OBX`. A real serializer, not `textContent`.     |
| `fhir.ts`       | `Composition` + `DocumentReference` + `Provenance`, as a transaction Bundle. |

---

## Three decisions worth knowing about

**The schema is a subset of what FHIR narrative permits.** A note that could not
be transmitted cannot be *constructed*, so `toNarrative()` has no failure branch
and there is no validation step that fails twenty minutes into a note. That
guarantee is why the formatting menu is four buttons: no underline (reads as a
link), no strikethrough (silently dropped by some renderers, which applied to a
retraction is a safety defect), no alignment, no arbitrary links, no inline
images.

**There is no clock.** Every function that compares against the present takes a
`now: Date`. A browser clock on a ward workstation is not evidence, and
42 CFR 482.24(c)(1) wants entries dated, timed and authenticated. A test greps
the source to keep it that way.

**Nothing clinical is hard-coded and nothing clinical has a default.** No phrase
library, no terminology, no attestation wording. Those are jurisdictional,
organisational or licensing decisions. The Joint Commission "Do Not Use" list is
the single exception — short, published, stable, always wrong — and it warns
rather than blocks, because it is an accreditation standard and its
trailing-zero carve-out guarantees false positives.

---

## Provenance

```ts
import { provenance, provenanceRanges, unreviewedAi } from "@oxygenui-design/clinical-note-core";

// Six origins: typed · dictated · template · pulled · copied · ai
provenance({ origin: "pulled", source: "Observation/cbc-1", at: "2026-08-16T06:12:00+05:30" });

provenanceRanges(doc); // every run, coalesced, in document order
unreviewedAi(doc); // what disables the sign button
```

The mark is `inclusive: false`, which is the most consequential setting in the
package: with ProseMirror's default, typing at the right edge of a generated
range extends the AI mark over the clinician's own words.

---

## Extending the gate

Rules are pure functions of `(document, context)`. Hosts add their own; a rule
that throws becomes a loud blocking finding rather than taking the editor down.

```ts
const withinWindow: GateRule = {
  id: "documentation-window",
  run(doc, ctx) {
    return hoursSinceEncounter(ctx.now) > 24
      ? { id: "documentation-window", severity: "warn", title: "This is a late entry" }
      : { id: "documentation-window", severity: "pass", title: "Within the documentation window" };
  },
};

runGate(doc, [...DEFAULT_RULES, withinWindow], ctx);
```

Three severities and only one stops you. A gate that blocks on everything is
routed around within a week; one that blocks on nothing is decoration.

---

## Signing

`toCanonical()` produces deterministic bytes — sorted keys, no incidental
whitespace, schema defaults dropped, Unicode normalised to NFC. Hash them with
whatever your deployment uses; no crypto ships here, because the keys must never
be within reach of a UI package.

```ts
import { createHash } from "node:crypto";
import { toCanonical, toFhirBundle, withDigest } from "@oxygenui-design/clinical-note-core";

const bundle = toFhirBundle(doc, options, toText(doc));
withDigest(bundle, doc, (bytes) => createHash("sha256").update(bytes).digest("base64"));
```

Signatures land on `Provenance.signature` — `Composition.attester` records
*that* someone attested but has no element for the signature itself, in R4 or
R5.

---

## Boundaries

Oxygen UI provides user-interface components. This package does not make an
application HIPAA, GDPR or DPDP compliant, is not a medical device, is not
clinical decision support, and does not by itself establish the legal validity
or admissibility of any record.

Per-range provenance is **not standardised anywhere in FHIR**. It travels as a
custom Oxygen extension that a conforming server may legitimately ignore or
strip. It is the most valuable thing this package produces and it is
non-standard; that trade is acceptable only because it is stated here.

The LOINC section codes in `SECTIONS` match published display names, but a
deployment must confirm them — and their C-CDA cardinality — against the
implementation guide it conforms to.

---

## Design reasoning

`oxygen-clinical-note-brief.html` at the repository root: the library survey
(§04), the sixty-three features and the v1 cut (§05), the accessibility
requirements (§07), the data contract (§09) and what the law actually requires
(§10).

## Licence

MIT
