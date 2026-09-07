---
"@zoblocks/clinical-note-core": minor
---

Add `@zoblocks/clinical-note-core` — the engine behind ClinicalNote.

Every character in a clinical note has an origin: typed, dictated, template,
pulled, copied forward, or generated. In every EHR shipping today all of it
collapses into identical black text, and the clinician signs and attests to it
equally. Note bloat, copy-paste error and AI attribution are that one missing
data structure seen three times.

This package stores origin per range and builds the rest on top of it:

- **LOINC-coded sections as schema nodes**, chosen as a subset of what FHIR
  narrative permits — so a note that cannot be transmitted cannot be
  constructed, and `toNarrative()` has no failure branch.
- **A provenance mark** that survives arbitrary editing, with `inclusive: false`
  so that typing beside generated text is not attributed to the model.
- **A composable sign gate**: nine default rules over three severities, with
  hosts adding their own. Nothing signs while a `block` stands.
- **Dot phrases**, `***` blanks with F2 traversal, and `{a:b:c}` pick lists.
- **Deterministic serialization** — same document, same bytes — plus FHIR
  (`Composition` + `DocumentReference` + `Provenance`), FHIR-legal XHTML, and a
  real plain-text serializer for HL7 v2.

No React, no Ant Design, no DOM: the whole package runs in Node, so a server can
validate, render or re-hash a note without a browser. There is no clock in it
either — every function that compares against the present takes a `now: Date`,
and a test greps the source to keep it that way.

262 tests, 99% line and 100% function coverage, including a seeded fuzzer that
throws 2,000 random transforms at a marked document and asserts that provenance
ranges never overlap, never go empty, always coalesce, and always serialize.
