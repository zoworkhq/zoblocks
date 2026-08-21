# @oxygenui-design/fhir

**FHIR R4 type contracts and pure read helpers for healthcare UI.**

Zero runtime dependencies. This package is the data layer behind
[Oxygen UI](https://oxygenui.design) — the components are installed as source
through the Oxygen CLI, and they import their types and read helpers from here.

```bash
npm install @oxygenui-design/fhir
```

## What it is

Narrow TypeScript types for the FHIR R4 resources a user interface actually
renders, plus the read helpers that get the awkward cases right:

```ts
import { resolvePatientName, getInterpretation, resolveAbsentReason } from "@oxygenui-design/fhir";

// Prefers official/usual over nicknames, skips `old` names, undefined when
// there is no name at all — never "Unknown".
resolvePatientName(patient);

// "unknown" unless the payload states an interpretation — never "normal".
getInterpretation(observation);

// The dataAbsentReason taxonomy, grouped by what a reader must do about it.
resolveAbsentReason(observation.dataAbsentReason);
```

The types are deliberately narrower than the full R4 specification. They cover
the elements a component reads, so that a missing element is a compile error
rather than a runtime blank.

## Design rules

**Absence is a value.** Helpers return `undefined` for missing data rather than
a placeholder string. A component decides how to render absence; a helper never
decides it for them.

**Nothing clinical is inferred.** An interpretation stated in the payload always
wins. Where none is stated, it is derived only by comparing a value against its
own stated reference range. An uninterpreted result reads as uninterpreted —
never as normal.

**Comparators are preserved.** `<0.01` is not `0.01`. Helpers that format
quantities keep the comparator attached to the value.

**Partial dates stay partial.** A FHIR date of `2026` is not `2026-01-01`.
Precision is carried through so a component can render what was actually
recorded.

## Scope

This package is types and pure functions only. No React, no rendering, no
network, no side effects — it is safe on a server, in a worker, or in a test.

It is **not a compliance boundary**. Using it does not make an application
HIPAA, GDPR, or DPDP compliant, and it is not a medical device or clinical
decision support. Access control, audit, data residency, and clinical
validation remain yours.

## License

MIT — see [LICENSE](./LICENSE). Built by [Zowork](https://github.com/zoworkhq).
