# @zoblocks/react

## 0.2.0

### Minor Changes

- 55822ea: Accordion, Disclosure, ChartAccordion and SafetyPlan — a disclosure widget whose
  headers can be read while closed, with a per-section access model for content a
  reader may not simply be shown.

  Three things separate it from a generic accordion, and all three come from what
  gets collapsed in a behavioral health record.

  - **Collapsed is not absent.** Items take a `summary` rendered in the header and
    a `severity` that paints a rail down its leading edge. A new lint rule,
    `@zoblocks/require-accordion-summary`, makes the pairing mandatory: a coloured
    rail with no words is a signal that forced-colors mode discards, monochrome
    printing discards, and roughly one in twelve men cannot resolve.
  - **Expanding is not disclosing.** `access` describes what stands between the
    reader and the content — `advisory`, `reason`, `consent`, `withheld` — and
    `onDisclose` returns `boolean | Promise<boolean>`, which covers a synchronous
    policy check, an async consent lookup, and a modal that resolves on confirm.
    Content stays out of the DOM until the application says yes, including in the
    server-rendered output.
  - **Withheld is a value.** A section this reader cannot obtain still renders a
    row that says so. `children` is typed `never` alongside `kind: "withheld"`, so
    the content cannot reach the bundle at all.

  **Ant Design compatibility.** The API is `Collapse` prop for prop, including the
  v6 names (`expandIconPlacement`, `size="medium"`, `destroyOnHidden`). One
  deviation is deliberate and is a bug fix: antd's `accordion` boolean switches the
  emitted markup from a disclosure widget to `role="tablist"`/`tab`/`tabpanel`, so
  a prop meaning "one open at a time" silently changes the accessibility contract.
  Here it changes the state policy and nothing else. `@zoblocks/codemod` ships
  `antd-collapse` for the migration.

  Also fixes, relative to what antd's Collapse emits: a real `<button>` inside a
  real heading (so Space works and sections appear in the heading list),
  `aria-controls` wired to a panel that has an id, `role="region"` up to six
  simultaneously-openable sections and omitted above, and arrow-key navigation that
  moves focus without toggling.

  `hidden="until-found"` makes collapsed content reachable by find-in-page — React
  serialises the attribute as `hidden=""`, so it is upgraded after commit, which is
  also what keeps the server-rendered markup hidden on first paint.

  **Tokens.** New `accordion.*` component tier, and `density.duration` as a fourth
  density key (120/180/280ms), so motion is a property of density rather than a
  per-component constant.

- 2e46026: Timeline and CareTimeline — a chronology that cannot be rendered without saying
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

- e8aaef9: ChartContextMenu — a context menu that names what it is about before it offers
  to change it.

  A right-click menu is the shortest path in a clinical interface to an
  irreversible act, and it opens on top of the row that said whose act it was. The
  mechanics of a popup are solved elsewhere and solved well; what is not modelled
  anywhere is what the menu is _about_. So this is an L0 resolver (`menu-core`)
  with a thin binding, and three rules the code refuses to break.

  **The menu states its subject, and the subject row is the safe landing.** Every
  menu opens with a non-interactive header naming the record, so the first thing
  under the pointer is never a verb — one decision closing the wrong-patient check
  and the accidental click-through at once. The header is also the popup's
  accessible name through `aria-labelledby`, so a screen reader announces the
  subject before any item. There is no prop that removes it.

  **Consequence is a rank, not a boolean.** Four tiers — `routine`,
  `documented`, `clinical`, `disclosive` — and the tier decides the interaction
  rather than the colour: run; run and say what was written; take a second step
  inside the menu; take a recorded reason. Bands sort consequence to the bottom
  with separators the resolver inserts, so an author cannot place a discontinue
  next to a copy. `validateActions` refuses a clinical action with no confirmation
  sentence, a disclosure with no reason list, and a toggle above `routine`.

  **The menu cannot out-disclose its trigger.** A masked row produces a masked
  header. An availability check still running holds its final position rather than
  being appended when it resolves. Actions the policy withholds are counted in a
  row inside the menu rather than silently dropped, and a disclosure emits its
  audit record on every path — including the one where the reader read the reasons
  and pressed Escape.

  Also new: `menu-core` (`resolveMenu`, `actionOutcome`, `describeSubject`,
  `disclosureRecord`, `validateActions`, `bulkPartition`, `toPaletteItems`) with
  no React and no DOM, a `menu` token group that is structural only because the
  four tiers resolve through the existing status ramp, and an `@a11y` Playwright
  suite that asserts the pointer never lands on a verb — from real coordinates, at
  three viewport positions, in Chromium, Firefox and WebKit.

- 43e931e: Add DataGrid — a clinical worklist that states what it is showing, out of what.

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

- 1492e0f: DatePicker — the range half of the component, which was previously a
  single-month calendar with no field in front of it.

  Selecting a range was the one temporal job this component could not really do.
  `mode="range"` existed, but only as an inline month grid: no trigger field, no
  readout, no way to reach a range that crossed a month boundary without paging
  and losing sight of the end you were aiming at, and no way to take "last month"
  in one press. Two variants and a rebuilt panel close that.

  - **`variant="date-range"`** — both ends typeable in one shell, a two-month
    panel behind them, named periods down the side and an inclusive day count
    beside the value. The halves stay two tab stops on purpose: the
    single-tab-stop rule is per field, and arrowing through six segments to reach
    the end date is past the point where a reader can tell which half they are in.
    The day count is inclusive of both ends, because an authorisation from the 1st
    to the 7th is seven days of care, and it is the field's own proof-read — a
    transposed month is invisible in `03/07 – 07/07` and unmissable as "123 days".
  - **`variant="time-range"`** — a start, an end, and the length between them. Two
    columns rather than one list of spans, because a day at half-hour steps is
    over a thousand spans. **The end column is filtered, not merely ordered**:
    every time that cannot be an end — before the start, shorter than the minimum,
    longer than the maximum — is struck with the reason in its accessible name.
    Offering a time that will be rejected on commit is how a booking form teaches
    people to distrust it. A night shift is accepted under `allowOvernight` and
    the crossing is stated in words, never wrapped in silence.
  - **`Calendar` gains `months`, `presets`, `shortcuts`, `commit`, `hints`,
    `defaultRange` and `defaultDates`.** Presets are data (`dateRangePresets(now)`), for the same
    reason `relativeDateOptions` is: the right seven periods for a billing report
    and for an authorisation window are not the same seven. `commit="explicit"`
    holds a draft behind Cancel and Done — a range is built by two clicks and the
    first is often wrong, and a parent already told about the half-built one has
    already filtered a report on a range nobody chose. `Calendar` keeps
    `commit="immediate"`, so nothing that exists today changes behaviour.

  **The rail is not range-only.** `shortcuts` takes the single-date half —
  `relativeDateOptions(now)`'s shape — so a plain date picker gets "Today",
  "Tomorrow", "Next Monday" beside its grid rather than as chips underneath it.
  It is a second way into the same answer and belongs next to the grid rather
  than after it. In `multiple` a shortcut toggles rather than replaces, because
  that is what every other press in that mode does, and "Custom" is pressed only
  once there is a selection the rail cannot name — an empty calendar has not been
  customised, it has not been answered. `DateField` reaches all of it through
  `calendarShortcuts`, `calendarShowCustom`, `calendarHints`, `calendarMonths`
  and `calendarCommit`, alongside the `calendarFooter` it already had;
  `BirthDateField` takes `calendarHints` and `calendarCommit` and deliberately no
  rail, because there is no "Today" for a date of birth and a shortcut nobody can
  use is a row between the reader and the year they came for.

  **Four defects fixed on the way, all of them visible.**

  1. **The range band was not a band.** Cells carried a 1px column gap, so the
     fill rendered as a dashed stripe, and `--range-start`/`--range-end` were dead
     classes that only ever landed on a cell already fully rounded by its selected
     state. The band now covers the whole span — endpoints included, because a
     band that starts a cell late reads as though the day it bounds were outside
     the range it bounds — and is capped at the ends of the range _and_ at every
     week boundary.
  2. **Two months drew the overlap twice.** Adjacent panels share up to a
     fortnight, so the same date got two cells, both matched the focus date, and
     the grid grew a second tabstop — the exact failure this component's own
     documentation calls the most common one in a date picker. Adjacent-month days
     are no longer drawn when more than one month is shown.
  3. **The header controls ignored `min` and `max`.** A bounded calendar paged to
     any year and enforced its limits only once somebody clicked a day. The CSS
     for the disabled state had been there since the beginning and nothing ever
     set it.
  4. **The footer set the panel's width.** A legend plus two buttons is wider
     than one month, so as a normal flex item it stretched a single-month
     calendar half a screen wide. It now takes the width it is given and
     contributes none of its own, wrapping instead.
  5. **The month heading failed SC 2.5.3.** Its accessible name was "Choose month
     and year", which contains none of the visible "September 2026". It now names
     the month it opens.

  Two smaller calls worth knowing about. Weekday headings are **two letters**
  rather than one: Tuesday and Thursday are both "T" and Saturday and Sunday are
  both "S", so a single-letter row leaves four of seven columns unnamed for
  anybody reading rather than counting. And with more than one month there is one
  previous control and one next for the whole window, not a pair per month — two
  buttons both announced "Previous month" and both doing the same thing is a
  riddle for anybody reading the dialog through its names.

  **`@zoblocks/react` engine additions:** `startOfWeek`, `endOfWeek`,
  `startOfMonth`, `endOfMonth`, `startOfYear`, `endOfYear`, `normalizeDateRange`,
  `rangeDayCount`, `rangeContains`, `isSameRange`, `isCompleteRange`,
  `dateRangePresets`, `matchRangePreset`, `timeRangeMinutes`, a `DateShortcut`
  type, and a `compact` option on `formatDuration`. Every one takes the caller's `now`; nothing here
  reads a clock, so a preset is deterministic and the surface stays testable.

  Measured rather than asserted: 0 contrast failures across 454 text nodes and 0
  targets under 24px across 624 interactive elements, in both themes at every
  density, with the panels open. RTL mirrors the rail, the months and the arrow,
  and pins `dir="ltr"` on both halves of the value — a range field that lets its
  segments inherit `dir="rtl"` renders a plausible and wrong date twice.

- 5b9d709: Add `Switch`, `SwitchField` and `SwitchList` — a binary control for a record
  that is shared, asynchronous, and often missing the fact you are asking it
  about.

  Three independent axes rather than one `checked`:

  - **value** — `true`, `false`, or `"unknown"` with a FHIR-shaped
    `absentReason`, so "off" and "nobody asked" stop being the same pixel.
  - **phase** — `idle · pending · committed · reverted · blocked · queued ·
stale`. Return a promise from `onCommit` and the component owns the whole
    machine, including the animated rollback and the assertive announcement that
    names what the value now holds.
  - **availability** — `readOnly` with a `lockedReason` that stays in the tab
    order, rather than a `disabled` control that tells a screen-reader user
    nothing.

  Also ships `useCommitPhase()` as a standalone export, five appearances
  (`switch`, `labeled`, `segmented`, `chip`, `row` — `segmented` renders a
  radiogroup, because two visible answers are not a switch), four sizes down to
  a 26×14px `micro` that keeps a full-size hit area, `tone` so a suppression does
  not read as brand-affirmative green, `until` for an on-state that is not
  forever, and `confirm="hold" | "dialog" | "attest" | "countersign"`.

  The API matches Ant Design's Switch and takes no dependency on it, so
  `import { Switch } from "antd"` becomes `from "@zoblocks/react"` with no
  other diff. One deliberate divergence: `loading` maps to `phase="pending"` and
  does not disable the control. See ADR 0010.

  Tokens: adds the `--zb-switch-*` component group, including `target-min`, which
  decouples the hit area from the pill so density can shrink one without the
  other.

- bce5c77: First release: the loaders as an installable React package.

  Until now the only React channel was copy-source through the ZoBlocks registry,
  which has no versioning and no upgrade path. This package covers teams who want
  semver instead.

  Both channels are **generated from one source**, so they cannot behave
  differently — the registry is authored, the package is derived from it by
  rewriting import specifiers, and nothing else. `react` and `react-dom` are peer
  dependencies supporting 18 and 19.

  Exports `PulseLoader`, `RhythmLoader`, `BreathLoader`, `HelixLoader`,
  `InfusionLoader`, the `PageLoader` preset, and `useLoadingGate` for building
  your own waits.

- 6c2eac5: Switch: the controlled-phase escape hatch, and three phase guards.

  `phase`, `requested` and `error` were in the design and not in the component,
  which left one class of caller unserved — anyone who already owns a state
  machine. A mutation library, a websocket subscription, an offline queue: each
  of those knows when a write is in flight and whether it landed, and the only
  way to use that knowledge before was to reimplement the rendering.

  Supplying `phase` now takes the internal machine out of the loop entirely.
  Nothing starts a timer, `requested` decides what is drawn while in flight, and
  `error` is announced verbatim. Every rendering, announcement and availability
  rule is the same code as the uncontrolled path, so the two cannot drift.

  Also exported: `isPending`, `isCommitted` and `isUnresolved`. They partition
  the seven phases exactly — `idle` is the only one none of them claim — and they
  exist because `phase === "commited"` is silently false forever, and the bug it
  produces is a confirmation that never appears.

- 5899184: Oxygen UI is now ZoBlocks.

  The name was carrying a known conflict rather than a resolved one: Soflyy holds
  the Oxygen trademark with a stated policy against "oxygen" in product names, and
  wso2 already ships a React design system called oxygen-ui. Renaming now costs
  one release; renaming after adoption costs everyone's tree.

  **Everything moved at once, and none of it can be aliased.** A stylesheet can
  forward a custom property but not a class name, and a package cannot answer to
  two scopes. So there is no compatibility layer — there is a codemod.

  ```bash
  pnpm dlx @zoblocks/codemod oxygen-to-zoblocks "src/**/*.{ts,tsx,css}" --write
  ```

  | Before                                                                                                                                                               | After                                       |
  | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
  | `@oxygenui-design/*`, `@oxygenui/*`                                                                                                                                  | `@zoblocks/*`                               |
  | `oxygen add`, `oxygen init`                                                                                                                                          | `zoblocks add`, `zoblocks init`             |
  | `oxygen.json`                                                                                                                                                        | `zoblocks.json`                             |
  | `@/components/oxygen/…`                                                                                                                                              | `@/components/zoblocks/…`                   |
  | `@/lib/oxygen-*`, `styles/oxygen-*.css`                                                                                                                              | `@/lib/zoblocks-*`, `styles/zoblocks-*.css` |
  | `oxygen:component` and friends                                                                                                                                       | `zoblocks:component` and friends            |
  | `--ox-*` (431 tokens)                                                                                                                                                | `--zb-*`                                    |
  | `.ox-*` class names                                                                                                                                                  | `.zb-*`                                     |
  | `data-ox-*` attributes                                                                                                                                               | `data-zb-*`                                 |
  | `<ox-pulse-loader>` and the other four loaders                                                                                                                       | `<zb-pulse-loader>`                         |
  | `OxygenAntdProvider`, `OxygenMuiProvider`, `OxygenTheme`, `OxygenHost`, `useOxygenTokens`, `resolveOxygenTokens`, `oxygenPrimitives`, `OxygenTokens`, `OxygenConfig` | the same names with `ZoBlocks`              |
  | `OxLoaderElement`, `OxSwitchElement`, `OxPulseLoader` and siblings                                                                                                   | `Zb…`                                       |
  | `OXYGEN_TOKEN`, `oxy_live_…`                                                                                                                                         | `ZOBLOCKS_TOKEN`, `zb_live_…`               |
  | `oxygenui.design`, `app.`, `hq.`                                                                                                                                     | `zoblocks.design`, `app.`, `hq.`            |

  **The one thing the CLI still accepts.** A project with a committed
  `oxygen.json` keeps working: the CLI reads it, warns once, and tells you what to
  rename it to. Nothing else has a fallback.

  **The token surface is a 1:1 rename.** All 431 entries in the published
  contract moved prefix and nothing else — no entry was added, removed or
  re-scoped. If you theme by overriding tokens, the codemod's `--ox-` rule is the
  whole migration.

  **`@oxygenui-design/tokens` and `@oxygenui-design/fhir` are deprecated on npm**
  and point at their `@zoblocks` equivalents. They are not unpublished; a missing
  package breaks a lockfile more loudly than a deprecated one.

  The mark changed too. It used to draw an oxygen molecule, which no longer means
  anything — it is now two blocks and the tenon that joins them.

### Patch Changes

- e013de1: Copilot safety fixes.

  - **Crisis detection no longer lets a negation cancel a disclosure.** "I want
    to kill myself, no plan yet" now escalates. A negation cancels only the phrase
    it covers ("denies SI or self-harm", "I don't want to hurt myself"), so notes
    that record present risk next to a denial now block where they did not.
  - **"od" after a dose is no longer read as overdose.** "ramipril 5 mg od" used
    to lock the thread in crisis. Overdose wording ("took an OD", "OD'd") still
    escalates.
  - **"Show sources" shows that answer's sources.** New `openSourcesFor(messageId)`
    opens one message's sources; `openSources()` still opens the latest. The new
    `citations` field pairs each source with its marker, and the drawer numbers
    sources by marker.
  - **Proposals are cleared on stop, error, crisis and mode change.** Confirming a
    prohibited proposal now shows a `contract-violation` error rather than
    throwing.
  - **History dates only the phrase it qualifies.** "History of SI, now actively
    suicidal" now escalates; "history of SI, no current ideation" stays clear.
    History is masked like negation, and "past week" or "prior to admission" are
    not history.
  - **Bare "suicidal" about a patient escalates.** "Patient is suicidal without a
    plan" and "pt suicidal" block. "Not suicidal" and "denies being suicidal" stay
    clear.
  - **A prohibited proposal renders no Confirm.** New `proposalRisk` on the hook;
    the card shows Discard and a notice.
  - **A proposal shows only once the answer is checked.** `proposal` is null
    mid-stream (new `pendingProposal` selector), and dropped when checks refuse
    the answer. Dwell time starts when the card can render.
  - **The registry skin shows each answer's own sources**, numbered by marker.
  - **Dictation cannot start mid-answer.** The mic is disabled while streaming, so
    Stop is never lost.
  - **Late actions from a stopped or replaced exchange are ignored.** Pipeline
    actions carry their exchange id, and the provider is not called once stopped.
  - **A provider error event is recorded as a failure**, in the audit and in new
    `failed` telemetry, not as an answer.
  - **Answers with a proposal are announced**, and start the verification clock.
  - **Feedback targets the answer it was given on.** New `sendFeedbackFor`; the
    reason picker shows under that answer only. Messages carry `exchangeId`.
  - **"Daily" and "weekly" count as dosing only beside a medication.** "Attends
    weekly sessions" is no longer refused.
  - **Apostrophes are not quotation marks.** Text after "patient's" is checked for
    stigmatising language again.
  - **Crisis detection catches acts, reported ideation and risk to others.** An
    overdose or attempt that has happened, "wants to kill himself", "cutting
    herself", "at risk of suicide", "homicidal", "wants to kill his wife", and
    risk about someone other than the patient now block as clinical risk. "I took
    an overdose" is imminent. "Cannot rule out" no longer negates.
  - **Recent past escalates; distant past is history.** Hours, days, weeks and
    months ("suicidal last week") block. Years, a year, and life stages ("as a
    teenager") stay clear, as does "family history of suicide".
  - **A drug name with a bare frequency is dosing.** "Bisoprolol daily" and "PO
    daily" are caught again; "daily walks" is not.
  - **Crisis detection catches lethal means and passive ideation.** "Jumped off a
    bridge", "found hanging", "has a noose", "stockpiling pills", "ingested
    bleach", "self-inflicted laceration", "passive death wish", "life is not worth
    living", "wishes she wouldn't wake up" and "endorses HI" block as clinical
    risk. "I drank bleach", "I have a noose", "I cut myself on purpose" and "I've
    been cutting myself" are imminent; "I cut myself" stays clear. Denials,
    accidental poisoning and old scars stay clear.
  - **Population statements and overdose management questions stay clear.** "High
    risk of suicide in men over 45" names no one, so it no longer blocks; naming a
    patient still does. "Treatment for patient who took an overdose" is a
    management question and clears, but "the patient took an overdose 2 hours ago"
    and any other risk in the same message still block. "Wanted to die as a
    teenager" is history.
  - **The registry skin records a thumbs-down.** It has no reason picker, so it
    records at once. New `{ askReason: false }` option on `sendFeedbackFor`.

- f0ecad7: DatePicker — the docs demo now explains the component instead of operating it,
  and the catalogue stops saying fourteen.

  The demo at the head of the Calendars chapter used to drive the panel through a
  range selection with a drawn cursor. It has been replaced with the opposite
  trade, which is the more useful one on a documentation page: a reader can
  already see what clicking does, and what they cannot see is why any of it is
  shaped the way it is. So the panel does not move at all, and six annotations
  arrive one at a time over the part each describes.

  **Every note is measured off the real DOM rather than written from memory.**
  The note about accessible naming quotes the name that cell actually carries;
  the note about target size prints the size that cell actually is, in the
  reader's own browser, at whatever density is set. A note that asserted either
  from memory would go on saying it after it stopped being true, which is the
  failure this whole page exists to avoid.

  **The list is the content and the halo is decoration.** Every note is a real
  button in a real ordered list, so paused — or unscripted, or through a screen
  reader — the demo reads as six labelled paragraphs about a calendar. Pressing
  any note jumps to it and stops the tour, which is what makes it usable without
  ever playing. It never starts under `prefers-reduced-motion`, autoplays only
  once it is actually on screen, and Pause is a real button, per WCAG 2.2.2.

  A floating bubble repeating the active note was built and then removed: it
  covered the grid it was explaining, and the list sits directly beside the
  panel already.

  **One bug worth recording.** The halo was measured against the outer stage
  while being positioned inside the panel, and the stage centres the panel within
  itself — so every halo sat one cell to the right of the thing it named. The two
  numbers agreed with each other and were both wrong, so it survived a numeric
  check and was only visible in a screenshot.

  **The home page's featured card is now the ghost-cursor calendar.** It showed
  three static fields, which said what the component holds but not what using it
  is like — and a card above the fold is the one place motion earns its keep. A
  drawn pointer chooses a range across the month boundary: two clicks with a live
  preview between them, which is the part a single-month picker cannot do at all.
  No preset rail there, deliberately — two months with one is 757px against the
  638px the card gives, and of the two the cross-boundary preview is worth the
  space. It stops on touch, never starts under `prefers-reduced-motion`, and
  Pause is a real button. The card's claim was rewritten to describe what the
  demo now shows rather than the time field it no longer contains.

  **Stale counts, corrected.** The home card, the gallery heading, the catalogue
  card and three comments all still said "fourteen variants" and "14 variants".
  It has been sixteen since the range work landed. The catalogue preview gains a
  range scenario for the same reason.

- f4234de: DatePicker — the calendar and the clock, matched to the design they were built
  from.

  Nothing here changes behaviour. It is the pass that closes the gap between what
  the range work shipped and the design it was drawn from, and four of the six
  changes are corrections rather than preferences.

  - **`Mo Tu We`, not `MO TU WE`.** Two letters set in caps with tracking read as
    an abbreviation of something else — a code, a column key — rather than as the
    day they name. It was also the only place in the system labelling in anything
    but sentence case.
  - **`7:00 AM`, not `07:00 AM`.** A padded hour belongs to a 24-hour clock,
    where `07:00` and `17:00` are the same width and the zero is part of the
    notation. On a twelve-hour clock nobody writes it, and the field disagreed
    with `formatClockTime` — so a picker reading `07:00 AM` sat above a list
    reading `7:00 AM` and looked like two different values.
  - **Both halves of a time lean on their colon.** Every segment is held at the
    24px target floor whatever it contains, so two digits at 13px leave slack on
    each side and `9:30` rendered as `9 : 30` — three things rather than one
    time. The outermost segments now sit against the separator and the slack
    moves to the ends of the run. (A zero-width separator was tried first and is
    worse: it centres on a boundary between segments whose slack differs, so a
    one-digit hour pushes the colon off centre and it ends up touching the
    minute.)
  - **Every month draws both chevrons.** A header with one arrow reads as a month
    that can only be left in one direction. They all page the whole window, so
    the months stay contiguous; only the outermost pair is a real control, and
    the repeats are taken out of the tab order and the accessibility tree
    together, because four buttons announced "Previous months" for one action is
    four times the work.
  - **Row gap, not cell gap.** The columns close up so a band runs unbroken
    across a week, and the rows open out so it breaks cleanly between them. At a
    1px row gap every week's band touched the next and a selection read as one
    slab rather than a set of weeks.
  - **`--zb-datetime-cell-size` 2rem → 2.25rem and `--zb-datetime-cell-radius`
    `radius-sm` → `radius`,** with the panel, rail, heading and commit buttons
    moved to match. The cells were wider than they were tall and cornered more
    tightly than anything else on the surface.

  **Two things in the mockup were deliberately not copied.** The column headings
  stay sentence case — `Start time`, not `Start Time` — because that is how every
  other label in this system is written and one component is not the place to
  break it. And the duplicated chevrons are visual only, for the reason above.

  **The demo page, which had its own problems.** A calendar is a fixed-width
  surface, so on a full-width stage it left-aligned against six hundred pixels of
  nothing; inline calendars now centre in their stage while form fields keep
  their left edge, because that is where a form puts them. Three demos sat alone
  in a two-column row with an empty half beside them — the two single-month grids
  are now adjacent so they pair, and the rest are full width. `.zb-dt-demo-chip`
  went with the Picker's relative-date chips when they became a rail.

  Measured after the change: 0 contrast failures across 454 text nodes and 0
  targets under 24px across 632 interactive elements, both themes, every density,
  panels open. 4,162 tests green.

- e013de1: Five registry fixes. Switch timestamps say which day they mean ("08:00 tomorrow", "12 Aug, 09:14"), and `SwitchList` takes `now`. RecentPatientStack keeps a tab stop when `activeId` matches no chart. ChartCommandPalette clamps its highlight when items or scope change. ClinicalNote scopes its blocked-reason id per instance. CareTimeline marks a month that resumes after another as "(continued)" in its heading, list name and jump option.
- e013de1: Fix four registry defects. ChartContextMenu clears a pending long press or submenu hover on unmount or subject change, so it can't open a menu for a row that is gone. TimeSlotGrid scopes group heading ids per grid. TimeRangeField treats an end equal to its start as empty, even with `allowOvernight`. Recorder takes `transcriptLagMs`, so Stream can say "Transcript stalled".
- e013de1: Three clinical fixes.

  - DataGrid: `number` and `measure` columns sort ">90" and "<0.01" by their number, with "<x" just below x and ">x" just above. Text that is not a number sorts after the numbers in both directions, above absent values. The comparator never returns NaN.
  - CareTimeline: group headings use the record's own wall clock, so an event at 2026-09-01T02:00+10:00 heads "September 2026", matching its row. Order still follows the true instant.
  - Switch: an `until` more than ~24.8 days away no longer calls `onExpire` on mount.

- 8809f44: Theme bridges: ZoBlocks components now take a host framework's design language
  without importing that framework.

  Three new packages. `@zoblocks/bridge-core` is the contract — a bridge
  is a pure function from a framework's resolved theme to a set of CSS custom
  properties, and it renders nothing. `bridge-antd` and `bridge-mui` implement it.

  ```diff
  - <ConfigProvider theme={brand}><AntdBridge>{app}</AntdBridge></ConfigProvider>
  + <ThemeProvider theme={brand}><MuiBridge>{app}</MuiBridge></ThemeProvider>
  ```

  Everything between the wrappers is untouched. `apps/smoke-hosts` mounts the
  same `<Application />` module under antd, MUI and neither, and
  `e2e/bridge-hosts.spec.ts` asserts the three accessibility trees are identical
  — so a framework leaking into a component fails the build rather than a
  customer's page.

  **Material UI was built before any customer asked for it**, to find out whether
  a token surface derived from Ant Design was genuinely framework-independent or
  merely antd-shaped. It is the former: both bridges write the same core ten
  tokens, and the gaps run in both directions — antd has no `contrastText`, MUI
  has no background or radius scale. Each declares what it cannot express rather
  than approximating it.

  **Clinical status is never bridged.** A host's `colorError` is an arbitrary
  brand red; `status.critical` holds a validated contrast floor in three themes
  and 60° of hue separation from `status.low`, so the direction of an abnormal
  result survives colour-vision deficiency. `bridge-core` refuses the write and
  the E2E proves it with a host theme that sets its error colour to magenta.

  Also in this release:

  - **`@zoblocks/tabs/antd` is deprecated**, re-exporting its original
    behaviour with a development warning. Removed in 0.3.0; use `bridge-antd`,
    which writes the semantic tier so one wrapper themes every component rather
    than only tabs.
  - **The high-contrast theme is reachable.** 59 tokens at a 7:1 floor had been
    shipping under `[data-zb-theme="high-contrast"]`, an attribute nothing set,
    audited by nothing. It is now a fourth option in the docs theme toggle, the
    site has a matching high-contrast palette, and `scripts/a11y.ts` covers three
    themes instead of two.
  - **Seven timeline tokens now terminate in a literal**, so a component dropped
    into a page without the token stylesheet keeps its rails and node borders.
  - **`pnpm gen` is idempotent again.** The token surface was built before the
    react package emitted the stylesheets it reads, so one run could describe the
    previous run's CSS. Caught by the fallback gate added alongside it.
