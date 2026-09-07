---
"@zoblocks/react": minor
"@zoblocks/fhir": minor
---

Timeline and CareTimeline — a chronology that cannot be rendered without saying
what it is a view of.

A table is read as rows and a chart as a shape, but a timeline is read as an
_account_ — and an account is understood to be continuous, so a gap in it
becomes a fact. Meanwhile the timeline on screen is nearly always a slice:
paginated to five, filtered to one register, assembled from sources that fail
independently. All of those render as the same clean, confident, complete-looking
list. So `coverage` is a **required prop with no default**, because every
plausible default is a claim the caller did not make, and the sentence it
produces renders in a fixed place and prints.

- **A failed source interrupts.** A source that could not be reached is an
  `role="alert"` banner naming it and saying, in words, that this is not a
  statement that no such records exist. The failure it exists for: a clinician
  reads a timeline with no imaging on it and orders a CT that was done eleven
  weeks ago at another hospital.
- **Planned is not happened.** A future event sits above a `now` marker derived
  from the caller's `now`, never the clock. A planned event whose time has
  passed with nothing recorded against it is **lapsed**, and it says what is
  _not_ known — never "missed" or "no-show", which the record cannot support.
- **An entry recorded in error is retained and struck**, with the correction
  unstruck beneath it. There is no prop that hides it.
- **Collapsing may not hide.** Anything a reader would act on — a critical
  severity, an amendment, a restricted record — is promoted out of a cluster
  before the cluster forms, which is what makes the cluster's "none critical"
  chip honest. Held by a property test.
- **Three empty states, three sentences.** No record, none in this window, none
  you may see.
- **Time keeps the precision the record holds.** A FHIR `2019` renders as 2019,
  and a stamp carrying an offset renders in the record's zone rather than the
  reader's.

**Ant Design compatibility.** `Timeline` is antd v6's Timeline prop for prop,
including the v5 names it still accepts, and takes no dependency on antd. Two
divergences, both deliberate. It requires an accessible name in the type, which
antd exposes no way to give — `@rc-component/steps` emits no `role`, no
`aria-current` and no `aria-label` at all. And it has no current step: antd's
Timeline is an adapter over `Steps` and hardcodes `current: items.length - 1`,
which its own stylesheet renders as a dotted rail — so on a reversed chronology
a mark of incompleteness lands under the oldest event in the chart. Here that
affordance means something instead: a dotted rail is a declared gap in coverage.
`test/timeline-parity.test.ts` reads antd's own declarations and fails when it
renames anything.

**`@zoblocks/fhir`** gains `Encounter`, `Communication`,
`DiagnosticReport`, `Procedure`, `Immunization`, `QuestionnaireResponse` and
`Task`, and **`@zoblocks/fixtures`** gains a `Patient/$everything`-shaped
bundle whose states are the ones a demo skips. The thirteen adapters in
`timeline-fhir` report everything they could not map, by type and count: a
silent drop in a data adapter is the same lie one layer further down.

See [ADR 0011](../content/decisions/0011-summaries-declare-their-boundaries.md)
— the rule generalises to every component that shows some of a set.
