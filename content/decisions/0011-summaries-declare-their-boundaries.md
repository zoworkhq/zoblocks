# 0011 — A component that summarises a set declares the set's boundaries

**Status:** accepted · 18 August 2026

> **Relates to:** [0001](0001-fhir-typed-props.md) (FHIR-typed props),
> [0007](0007-story-derived-testing.md) (story-derived testing),
> [0010](0010-antd-compatible-primitives.md) (antd-compatible primitives)

## Context

`CareTimeline` forced a question the catalog will keep asking: what does a
component owe a reader about the data it is _not_ showing?

A table is read as a set of rows. A chart is read as a shape. A **timeline is
read as an account**, and an account is understood to be continuous — nothing
between two entries means nothing happened between them. That is not a
careless inference; it is what the form promises.

The list on screen is almost never continuous. It is paginated to five,
filtered to one register, capped by a page size, and assembled from source
systems that fail independently. Every one of those produces the same
rendering: a clean, confident, complete-looking list.

The consequence is measurable rather than theoretical. Roughly 13.6% of primary
care consultations proceed with clinical information missing, adversely
affecting care in about half of them; one emergency study found records missing
or incomplete on admission for 27% of patients, with unnecessary procedures —
including lumbar punctures — performed on 5% as a result. The literature's own
term for the underlying problem is _informative missingness_: a NULL read as a
negative.

The concrete failure this is about: a clinician opens a chart, reads a timeline
with no imaging on it, and orders a CT. The study was done eleven weeks ago at
another hospital; the regional exchange query timed out four seconds earlier and
the component rendered what it had. Nothing was wrong on screen.

This is not a timeline problem. It is the shape of every component that shows
some of a set: a worklist, a results list, a medication list, an allergy panel.
Each will meet the same question, and each will answer it differently unless the
answer is written down once.

## Decision

**A component that renders a subset of a larger set takes a required
description of that set, and renders it.**

Concretely, for any such component:

1. **The description is a required prop with no default.** Not optional with a
   warning, not defaulted to "everything" — every plausible default is a claim
   the caller did not make. On `CareTimeline` the prop is `coverage`, and
   `TimelineCoverage.sources` is typed as a non-empty tuple so an empty array
   cannot satisfy it.

2. **It names the sources and their health, not only the count.** A source that
   returned nothing and a source that could not be reached are different facts
   with different next actions. A source in any state other than `ok` must
   carry a reason; `validateCoverage` returns a problem when it does not, and
   the component renders that problem rather than rendering around it.

3. **It renders in a fixed place, in words, and it prints.** Never a tooltip,
   never an icon, never behind a disclosure. Print is where "See all" stops
   existing, so it is where the sentence matters most.

4. **A source that failed escalates from a footnote to an interruption**
   (`role="alert"`), because the reader is about to convert an absence into a
   clinical fact.

5. **Absence has as many states as the data has reasons.** "No record", "none
   in this window" and "none you may see" are three sentences. One empty card
   for all three is the ambiguity the library exists to prevent.

6. **Adapters inherit the obligation.** `toTimelineEvents` returns what it could
   not map, by type and count, for the caller to fold into the description. A
   silent drop in a data adapter is the same lie one layer further down, where
   nobody will look for it.

The description is a **report of what this query reached**, not a completeness
guarantee. A source that answers with an incomplete record is reported as
reached. That limit is stated in the component's own `limitations`, because a
safety control trusted beyond its actual guarantee is worse than none.

## Consequences

**Good.** The claim becomes reviewable. "Showing 8 of 43 events, newest first,
from 1 July 2025 to now; 33 beyond this page, 2 you do not have access to;
Northside Regional Exchange could not be reached" is a sentence a clinician, a
reviewer and a test can all check. It is testable in words rather than in
pixels, which is what makes the eleven assertions in
`care-timeline.test.tsx` possible at all.

**Good.** It composes. The same shape serves the worklist and the results list
without re-deriving the argument, and `describeCoverage` is exported so the
sentence in a print header, a CSV export and an audit record is the same
sentence.

**Cost.** It is friction on adoption. Every other timeline component in the
world takes an array and renders it; ours takes an array and an account of the
array. The mitigation is that the honest minimum is four lines and it is _true_:

```ts
coverage={{
  sources: [{ id: "app", label: "This application", status: "ok" }],
  order: "newest-first",
}}
```

**Cost.** It puts a sentence on every surface that uses one of these components,
including surfaces where the designer did not ask for one. That is the trade
being made deliberately: the sentence is the component's safety claim, and a
component that lets you turn its safety claim off does not have one.

**Rejected: optional with a development warning.** The repository's own rules
forbid `console` in component source, and `process.env` does not exist in a
copy-source consumer's build — so the warning would either not fire or not be
seen. A required prop fires in the one place that always works: the type
checker.

**Rejected: inferring gaps from the data.** Turning eleven quiet weeks into
"records may be missing" would be the component inventing a claim. Gaps are
declared by the caller, because the application is the thing that knows a source
timed out.

**Rejected: a `hideCoverage` escape hatch.** There is no state in which
rendering the list without the claim is the correct answer. A product that
genuinely cannot describe what it searched should render an error, not a
timeline.
