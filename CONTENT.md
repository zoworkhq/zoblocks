# ZoBlocks — Clinical Content Style Guide

Every rule here came from a decision already made inside a component. The
components enforce them for the surfaces they own; this document exists because
a customer writes most of the strings in their application, and nothing in the
library reaches those.

Two of these rules are enforced by lint. The rest are review material.

> **Scope.** Sections 1–9 govern user-visible text in clinical interfaces.
> Section 10 governs our own product surfaces — `zoblocks.design` and the
> console — which were outside this document until a content audit found that
> both places it was being broken were places it did not claim to reach.
>
> It is not a brand voice guide, and it does not override a regulator, a
> formulary, or a local terminology policy.

---

## The one idea

**An interface that omits a fact it already has is making a claim.**

A blank cell claims there was nothing to say. A dash claims a value exists and
is unremarkable. "Normal" claims someone looked. Each of these is cheap to
write, renders perfectly, survives review, and shifts meaning at the moment a
reader acts on it.

Almost every rule below is a specific instance of that one.

---

## 1. Absence and uncertainty

Absence is a value with a reason, not a gap in the layout.

Six kinds of absence are clinically distinct and must never collapse into one
another. The wording column is not illustrative — it is what the components
actually render, so a team writing its own strings alongside them stays in one
vocabulary:

| Kind         | Means                                     | The word the components use |
| ------------ | ----------------------------------------- | --------------------------- |
| Not asked    | Nobody collected it                       | "Not asked"                 |
| Not recorded | Asked, and nothing written down           | "Not recorded"              |
| Declined     | The person refused                        | "Declined"                  |
| Masked       | Policy withheld it from you               | "Restricted"                |
| Pending      | Collected, result not back                | "Awaiting"                  |
| Unattributed | No value came back, and no reason with it | "Not known"                 |

A seventh case is not absence and does not belong in this table: a section that
**failed to load** is an error, and §5 governs it. "Could not load allergies"
is a statement about the system, not about the patient.

> The five members of `GridAbsence` are the last five rows; `Not asked` is
> `switch`'s, where a tri-state control is the thing doing the asking. A
> component that needs a distinction not listed here is a conversation, not a
> new string.

✅ **Do**

- Route absence through `AbsentValue` with a `dataAbsentReason`.
- State the absence in words when a component is not available:
  `Start not recorded`, `Role not recorded`, `No code`.
- Distinguish a recorded negative from an empty list. "No known allergies" is a
  clinical assertion someone made. An empty allergy list is not.

❌ **Don't**

- `{value ?? "—"}`, `"N/A"`, `"--"`, `"?"`, `"None"`, `"TBD"`.
- Render an unavailable section as an empty one. An allergies panel that failed
  to load must not look like a patient with no allergies.

> **Linted.** `@zoblocks/no-absence-placeholder` (error) catches a placeholder
> string in the substitution position — the branch taken when a value is
> missing. A dash used as a separator between two rendered things is
> typography and is not flagged.

---

## 2. Interpretation

**"Not interpreted" is not "Normal".** A result with no
`Observation.interpretation` has not been assessed; saying it is normal invents
an assessment that nobody made.

✅ **Do**

- Derive the label from the resolved interpretation (`INTERPRETATION_LABEL`).
- Say "Within range" when you mean the value sits inside a stated reference
  range — that is a measurement fact, not a clinical judgement.
- State that a range was not supplied when it was not: `ReferenceRange` refuses
  to draw a band rather than inventing plausible bounds.

❌ **Don't**

- Label an uninterpreted result "Normal".
- Compute an interpretation from a threshold the component invented.
- Present a provisional diagnosis as settled.

> **Linted.** `@zoblocks/no-ambiguous-clinical-copy` (warning) flags a bare
> "Normal" or "Abnormal" in prose position.

---

## 3. Status and severity

Never colour alone. Every status pairs a colour with an icon **and** a text
label, because forced-colors mode discards the colour, monochrome printing
discards the hue, and roughly one in twelve men cannot separate red from green.

✅ **Do**

- Give each state its own label. `MedicationCard` distinguishes on-hold,
  stopped, completed and expired rather than greying all four identically.
- Reserve critical for what must interrupt. Severity is an interruption budget:
  if everything is critical, nothing is.
- Name the specific finding, not its category — "Potassium 6.8 mmol/L, critical
  high" rather than "Abnormal result".

❌ **Don't**

- Communicate a state by dimming it. Dim reads as "inactive", not as "stopped".
- Escalate for emphasis. An alert that was styled critical to get attention
  spends attention the next real one needs.

---

## 4. Confirmation and consequence

✅ **Do**

- State what will happen, to whom, and what cannot be undone.
  _"Discharges Ada Lovelace and closes the encounter. This cannot be undone."_
- Name the patient in any action that applies to one. Wrong-patient actions are
  what this friction exists to prevent.
- Match friction to consequence. Too little and mistakes happen; too much and
  clinicians route around the system, which is worse because the work moves
  somewhere you cannot see.

❌ **Don't**

- Ask "Are you sure?". It asks the reader to re-derive the consequence they
  were already unsure about.
- Put the consequence in a tooltip and the question in the button.

> **Linted.** `@zoblocks/no-ambiguous-clinical-copy` (warning).

---

## 5. Errors and degraded states

An error message has two jobs: name what failed, and say whether what is still
on screen is complete.

✅ **Do**

- _"Could not load allergies. This list may be incomplete."_
- Say what remains usable. Partial failure is the normal case in a record
  assembled from several sources.
- Keep failure contained to its section. `ErrorBoundary` exists so one dead
  panel does not blank a record — and so a partial record is never rendered as
  a whole one.

❌ **Don't**

- "Something went wrong", "An error occurred", "Error".
- Put an identifier, a name, or any other PHI in a message that will be logged
  or reported.

---

## 6. Time

✅ **Do**

- State the time zone, always. A medication administration time without one is
  ambiguous by up to a day.
- Preserve the precision that was recorded. A FHIR date of `2026-08` means
  August, not the 1st of August.
- Mark a future timestamp as future rather than rendering it as fact.
- Separate when something happened from when it was charted.

❌ **Don't**

- Infer a time zone from the browser. The reader's clock is not the event's
  clock.
- Render a relative time alone ("3 hours ago") on a clinical surface. Keep the
  absolute time available.

---

## 6a. Coverage — saying what a view is a view of

A component that shows _some_ of a set has to say so, in words, in a fixed
place. The sentence is **composed by the component from typed data**, never
written by the caller — a hand-written "showing recent results" drifts from the
query the moment either changes, and a claim that has drifted is worse than no
claim. See [ADR 0011](content/decisions/0011-summaries-declare-their-boundaries.md).

The grammar, in order, because a reader takes the first clause and stops:

1. **The count.** `Showing 8 of 43 events` — or `Showing all 12 events` when
   there is no remainder. Never "showing recent", never "top results".
2. **The order.** `newest first`. A list that silently reverses tells a
   different story with no visible difference.
3. **The window.** `from 1 July 2025 to now`, at the precision the caller gave.
4. **What is missing, and why.** One clause per reason, each with a number:
   `33 beyond this page`, `5 hidden by the "Clinical" filter`, `2 you do not
have access to`, `6 of a type this view cannot render`.
5. **The sources, and their health.** A source that did not answer is named.

✅ **Do**

- Say what was _searched_, not what exists. "1 of 2 sources reached" is true;
  "complete record" is a claim the query cannot support.
- Escalate a source that failed from a footnote to an interruption. The reader
  is about to convert an absence into a clinical fact.
- Add the sentence that says an absence is not a finding: _"This is not a
  statement that no such records exist."_
- Keep the claim in print. Print is where "See all" stops existing.

❌ **Don't**

- Punctuate the remainder. "…" and "+35 more" are not counts.
- Hide the count behind the control that caused it. A filter that says how much
  it hid only inside its own popover — usually off screen — has not said it.
- Let a failure render as an emptiness. Three different empty states —
  _no record_, _none in this window_, _none you may see_ — are three different
  facts with three different next actions, and one shrug for all three is the
  defect this guide exists to prevent.
- Write the sentence by hand. Call `describeCoverage()`, which is exported so
  the print header, the export and the audit record all say the same thing.

---

## 7. Register — who is reading

Patient-facing and clinician-facing strings are **different catalogs, not
different tones of the same string**. "Potassium" and "K+" are not a formality
setting, and _"your result is higher than the usual range"_ is not a politer way
of writing _"H 6.8 mmol/L"_.

Bind wording to the surface profile rather than assuming an audience:

```tsx
const label = useTerm({ clinician: "K+", patient: "Potassium" });
```

|                  | Clinician                              | Patient                                 |
| ---------------- | -------------------------------------- | --------------------------------------- |
| Vocabulary       | Abbreviations, codes, units as written | Whole words, expanded units             |
| Reference ranges | The numbers                            | What the numbers mean, then the numbers |
| Uncertainty      | Stated plainly                         | Stated plainly, and what happens next   |
| Reading level    | Domain-fluent                          | Target grade 8 unless stated otherwise  |

✅ **Do**

- Write both sides. `useTerm` requires both, so forgetting the patient wording
  is a type error rather than clinical shorthand on a patient's screen.
- Keep the same facts in both registers. Register changes words, never content.

❌ **Don't**

- Soften a fact for a patient. "Slightly raised" for a critical potassium is
  not kindness.
- Assume patient-facing means less detail. It means different words and more
  room, not fewer facts.

---

## 8. Identity and people

✅ **Do**

- Describe behaviour, not people. _"Requires two staff for personal care"_, not
  a label attached to the person.
- Treat deceased and restricted as text, not as a colour or an icon alone.
- Use the name the record holds, including the used name where one is recorded.

❌ **Don't**

- Infer anything demographic from a name or from initials.
- Let a decorative colour carry meaning. Avatar tints are drawn from a hue set
  that is deliberately disjoint from the clinical palette.

---

## 9. Units and numbers

✅ **Do**

- Keep the value and its unit in one element so they cannot drift apart under
  truncation, wrapping or translation.
- Preserve reported precision. A lab that reported `5.10` meant three
  significant figures.
- Keep comparators. `<0.01` is not `0.01`; dropping the comparator turns
  "undetectable" into a number.
- Use tabular figures so decimal points align down a column.
- Follow ISMP dose formatting: no trailing zero (`5 mg`, not `5.0 mg`), no naked
  decimal (`0.5 mg`, not `.5 mg`).

❌ **Don't**

- Convert between unit systems silently. mg/dL and mmol/L differ by a
  clinically significant factor; conversion is explicit or it does not happen.
- Re-round a value before displaying it.

---

## 10. Our own surfaces

Sections 1–9 are about a clinical record. This one is about the marketing site
and the console, and it exists because a content audit found the two rules we
break most often are broken on our own pages rather than in the library.

The failure mode is specific and worth naming: **a claim that was true when it
was written, in a place nobody re-reads.** Not one of the defects below was a
lie when it was typed.

### 10.1 A countable number is derived or it is absent

If a reader can count it, the page computes it. `27 components` sat in three
page descriptions against a catalogue of thirty; `Twenty-two of the forty-four
registry items` described a registry of fifty. Both were written accurately.

✅ **Do**

- Read the count from the catalogue: `` `${CATALOG.length} components` ``.
- Prefer a qualifier to a stale integer when a figure is not worth deriving:
  "about half the registry" cannot go wrong by one.
- Use numerals for anything countable. Words are for figures inside a
  rhetorical sentence — "twelve hours of a record being wrong" — where the
  number is doing prose work rather than reporting a quantity.

❌ **Don't**

- Type a number into a meta description. Descriptions are the strings nobody
  sees while editing and search results quote verbatim.
- Spell out a countable figure. "All fourteen states" is the shape every stale
  number here started as.

### 10.2 Never publish a number you did not measure

A decorative `0.8ms` sat in the home page's hero panel, measuring nothing. It
is the first thing a technical reader tests, on the one site whose argument is
that its figures can be re-checked.

❌ **Don't** invent a latency, a trace identifier, or a throughput for texture.
A panel labelled "worked example" is honest; one labelled "live parser" is not.

### 10.3 Availability is three facts

Built · documented · purchasable. One label carrying all three was wrong about
two of them: fifteen components that install from the registry today were
badged "Coming soon" beside a working install command.

| Fact                  | Says               |
| --------------------- | ------------------ |
| Not in the registry   | "Not built"        |
| Installs, no page yet | "Docs in progress" |
| Finished, shop closed | "Not on sale"      |

✅ **Do** suppress the control when the fact makes it meaningless. A card with
no page does not show "View"; a component with nothing to install does not
offer a command.

### 10.4 A link is a promise about its destination

"The full table is on the Pro page" pointed at a holding page with no table.
"Compare with Pro" pointed at the same page with nothing to compare.

✅ **Do** re-read the destination when you change it. A page that loses its
table has to lose the links that promised one.

### 10.5 One name per destination

The blocks page was "Showcase" in the navigation, "Blocks" in its own heading
and landmark, and "examples compositions demos" in the command palette. The
shop was "Marketplace" on the site and "Catalogue" in the console, one click
apart — while "catalogue" already meant the component catalogue.

✅ **Do** make the navigation label, the eyebrow, the heading, the landmark and
the search keywords the same word, across both applications.

### 10.6 A CTA names what happens next

"Sign up" led to a form requiring an organisation address that only we can
issue. The console's own heading had said "Request access" all along.

✅ **Do** name the outcome the click actually produces, and say so where the
reader is, not one screen later.

### 10.7 §4 and §5 apply here too

The console's root error boundary said "Something went wrong" — the first
entry on §5's forbidden list. Publish, Archive and Disable fired on one click
with no consequence stated, against §4.

✅ **Do** state the consequence at the control, not in the page lede. A reader
deciding whether to click has the lede behind them.

> `ConfirmSubmit` is the console's implementation of §4, and `ActionGate` is
> the library's. Neither asks "Are you sure?".

### 10.8 One English

British, throughout both applications: **colour, catalogue, licence,
behaviour, organisation**. `organisation` is a data field, which settles it.

Exempt: code identifiers, CSS properties, Tailwind class names, and quoted
external vocabulary such as schema.org's `Organization`.

### 10.9 A density budget for prose

Measured across 33,579 words of catalogue copy: 367 em dashes — one every 91
words — and 186 uses of "rather than", one every 180. The voice is fine. The
density is a tic.

✅ **Do** aim for one em dash per 250 words of body copy, sentences under about
35 words in rationale sections, and a full stop where a semicolon is carrying a
third clause.

❌ **Don't** reach for "rather than" when "not" or "instead of" will do.

---

## Enforcement

| Rule                                   | Severity | Applies to    | Catches                                                            |
| -------------------------------------- | -------- | ------------- | ------------------------------------------------------------------ |
| `@zoblocks/no-absence-placeholder`     | error    | components    | A placeholder string substituted for a missing value               |
| `@zoblocks/no-ambiguous-clinical-copy` | warning  | components    | Bare "Normal", "Are you sure?", generic error copy, bare "Unknown" |
| `@zoblocks/no-hardcoded-count`         | error    | site, console | A countable figure typed into copy instead of derived (§10.1)      |
| `@zoblocks/no-vague-failure`           | error    | site, console | A failure message that names nothing (§10.7, §5)                   |

The two clinical rules are scoped to prose positions in JSX. A comparison
operand, a React key, a `className` and an enum-ish prop value are not copy,
and firing on those would train everyone to ignore the rule.

The rest of this document is review material. If a rule here turns out to be
mechanically checkable without false positives, it should become a rule —
`packages/eslint-plugin/rules/`, with cases in `content-rules.test.js` for
sections 1–9 and `product-rules.test.js` for section 10.

Two of section 10 are linted: **10.1** and **10.7**, as
`no-hardcoded-count` and `no-vague-failure`, applied through
`configs.product` to `apps/docs` and `apps/app`. Neither existed when this
section was written, and writing them was worth it on the first run —
`no-hardcoded-count` immediately found four wrong prop counts on the home
page's featured cards that the audit and two reviews had both read past.

Both are scoped by file rather than by string, and the scope is the
interesting part. Demo modules are exempt, because a panel labelled "Nine
states, one green dot" is describing the nine things in _that panel_ — a
curated set no expression can derive — while a page saying "27 components"
asserts a total this repository can compute. The rule cannot tell those apart
from the string alone. Where a page genuinely needs a typed figure, the
exemption is a disable comment carrying the reason, as the install page's
record of what was actually run does.

The rest of section 10 is review material. Two more look checkable and are
not yet written: a link whose text promises something the destination does not
contain (10.4), and the American spellings in prose positions (10.8).

---

## Related

- [`DESIGN.md`](DESIGN.md) — the per-product design contract. It asks a team to
  define escalation language, clinician vs patient terminology, and a reading
  level target. This document is how to answer those.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) §10 — internationalisation, and why
  patient and clinician catalogs are separate.
- [`ENGINEERING.md`](ENGINEERING.md) §6 — the accessibility bar every component
  must clear, including why a text label is mandatory rather than decorative.
