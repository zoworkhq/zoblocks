---
"@zoblocks/react": minor
"@zoblocks/fhir": minor
---

Add DataGrid — a clinical worklist that states what it is showing, out of what.

`role="grid"` with real two-dimensional keyboard navigation, set as a ruled
ledger: a masthead carrying the coverage claim above the data, numbered
footnotes underneath, and a print block that keeps the whole thing a document.
The behaviours below are the component rather than decoration on it, and the
ones that can be are proved in `grid-core` without a DOM.

**Coverage is required, and `total` may be `"unknown"`.** `Bundle.total` is
optional in FHIR, the spec forbids constructing paging URLs, and some servers
return a `next` link and nothing else — so "24 of 1,438" is a sentence a
conformant integration often cannot say. The union makes the honest answer
representable; the alternative is a component that renders the page size as the
cohort and is wrong in production rather than in theory.

**The list scrolls; it does not page.** The same FHIR facts that make `total`
optional make "page 4 of 7" a control with no addressable target, so the grid
watches a sentinel below the last row and says when the reader reached it —
`onReachEnd`, `loadingMore`, `exhausted`. `shouldLoadMoreGridRows` refuses a
second request while one is in flight, which is the defect every hand-rolled
infinite scroll ships with. The waiting state is a sentence in a live region
rather than a spinner.

**`GridValue` has no null member.** An assessment booked and not completed, a
42 CFR Part 2 record this reader may not see, a question nobody asked and a
questionnaire the client declined are four facts with four different next
actions, and one em dash in every other grid. Absence is drawn by the grid
rather than by the caller's renderer, so a cell function returning a dash
cannot paint over a restricted value. It sorts last in both directions, which
is the load-bearing line: four "Awaiting" rows above a PHQ-9 of 22 tells a
reader the client at most risk on the caseload is fine.

**Sorting by a derived column is cited.** A column can declare the model, its
version, what it was validated on and in whom; the grid turns that into a
footnote, and sorting by it says the sort ranks a prediction.

**Arrivals are counted, never merged.** The grid holds them behind a ruled
strip with a polite live region and hands them back when the reader asks. The
cursor is a row key rather than a pair of indices, so nothing — a sort, an
admit, the caller replacing the array — can move focus onto a different client.

**Selection costs no layout shift.** The bulk bar and the arrivals strip share
one grid cell, both always laid out, so ticking the first checkbox moves
nothing. A bar that appears on the first click pushes every row down under a
pointer that is already travelling, which in a caseload is how somebody actions
the wrong client.

Also: pinned columns with offsets measured from the header rather than
hard-coded; `masthead` and `footer` for hosts that frame the grid themselves,
with the accessible name falling back to `caption` so turning off chrome never
unnames a table; an empty state inside the grid, headers intact, so the reader
can widen the filter that emptied it; a measured client-side row ceiling the
grid refuses past rather than degrading; and a delimited writer that
neutralises spreadsheet formula injection, including the full-width forms Excel
normalises, with no way to switch it off.

`@zoblocks/fhir` gains `Bundle.link`, so the paging relations a search
returns are representable at all. The private fixtures package gains
`caseloadPhq9` and `unknownTotal` alongside it — the same search against two
conformant servers, one of which states a total and one of which will not.
