---
"@zoblocks/signature-core": minor
---

New package: the capture engine behind ZoBlocks's Signature component.

Stroke model, pointer capture with palm rejection, velocity-based smoothing,
vector export, a minimum-ink gate, and the `SignatureValue` union with its FHIR
mapping. No React, no Ant Design, no DOM, no dependencies.

The value type is the point. Instead of `string | null`, it is a discriminated
union over seven outcomes — `signed`, `declined`, `unable`, `verbal`,
`on-paper`, `pending`, `revoked` — because a patient who refused to sign and a
form nobody opened are different facts, and a two-state type makes the
difference unrecordable. `unable` without a witness is a compile error.

`toFhirBundle()` emits a transaction Bundle rather than a resource, because
`Consent` carries no signature element in either R4 or R5; only
`Provenance.signature` does.
