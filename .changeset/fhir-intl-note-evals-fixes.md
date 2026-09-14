---
"@zoblocks/fhir": patch
"@zoblocks/intl": patch
"@zoblocks/clinical-note-core": patch
"@zoblocks/copilot-evals": patch
---

Correctness fixes in fhir, intl, clinical-note-core and copilot-evals.

- **fhir: a date-only end lasts the whole day.** Coverage, flags, care-team
  members and prescriptions no longer lapse a day early. The date helpers take
  an optional `timeZone` (default: the runtime's).
- **fhir: ages no longer roll over a day early** west of UTC.
  `calculateAge` and `formatAge` use calendar dates.
- **fhir: `getInterpretation` claims only what it can prove.** An unrecognised
  code, a mismatched unit, or a `<`/`>` value that could fall either side reads
  as "unknown", never "normal".
- **fhir: `formatDosage` renders dose ranges, timing codes (BID), rates and max
  dose per period.**
- **fhir: an invalid time zone renders in UTC, marked "(UTC)"**, not in the
  browser's zone.
- **fhir: `amended` ignores timestamp-style `versionId`s.**
- **intl: a translated string beats an English register variant.** New
  optional `IntlValue.localeMessages`.
- **intl: `isRtl` reads script subtags** (`ha-Arab`, `ar-Latn`) and no longer
  marks Hausa or Kurdish right to left.
- **clinical-note-core: foreign-content check compares type and id.** A
  versioned reference to the same patient no longer blocks signing, and an
  absolute URL to another patient is caught.
- **clinical-note-core: narrative XHTML drops characters XML forbids.**
- **copilot-evals: an empty suite or empty run fails the release gate.**
- **copilot-evals: `defaultGrade` grades numbers, units and dosing
  abbreviations**, and fails a claim whose number the passage lacks.
