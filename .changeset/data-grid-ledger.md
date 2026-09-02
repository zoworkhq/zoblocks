---
"@oxygenui-design/react": minor
"@oxygenui-design/fhir": minor
---

Add DataGrid — a clinical worklist that states what it is showing, out of what.

`role="grid"` with real two-dimensional keyboard navigation, set as a ruled
ledger: a masthead carrying the coverage claim above the data, numbered
footnotes underneath, and a print block that keeps the whole thing a document.
Four behaviours are the component rather than decoration on it, and all four
live in `grid-core` so they can be proved without a DOM.

**Coverage is required, and `total` may be `"unknown"`.** `Bundle.total` is
optional in FHIR, the spec forbids constructing paging URLs, and some servers
return a `next` link and nothing else — so "24 of 1,438" is a sentence a
conformant integration often cannot say. The union makes the honest answer
representable; the alternative is a component that renders the page size as the
cohort and is wrong in production rather than in theory.

**`GridValue` has no null member.** A specimen with the lab, a record this
reader may not see, a question nobody asked and an answer the patient declined
are four facts with four different next actions, and one em dash in every other
grid. Absence is drawn by the grid rather than by the caller's renderer, so a
cell function returning a dash cannot paint over a restricted value. It sorts
last in both directions, which is the load-bearing line: four "Awaiting" rows
above a potassium of 3.2 tells a reader the sickest patient on the ward is fine.

**Sorting by a derived column is cited.** A column can declare the model, its
version, what it was validated on and in whom; the grid turns that into a
footnote, and sorting by it says the sort ranks a prediction.

**Arrivals are counted, never merged.** The grid holds them behind a ruled
strip with a polite live region and hands them back when the reader asks. The
cursor is a row key rather than a pair of indices, so nothing — a sort, an
admit, the caller replacing the array — can move focus onto a different patient.

Also: a measured client-side row ceiling the grid refuses past rather than
degrading, and a delimited writer that neutralises spreadsheet formula
injection, including the full-width forms Excel normalises, with no way to
switch it off.

`@oxygenui-design/fhir` gains `Bundle.link`, so the paging relations a search
returns are representable at all. The private fixtures package gains
`wardPotassium` and `unknownTotal` alongside it — the same search against two
conformant servers, one of which states a total and one of which will not.
