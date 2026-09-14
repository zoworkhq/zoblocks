# @zoblocks/fhir

## 0.2.0

### Minor Changes

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

- ed95b45: Patient identity: avatar, chip and banner, with the engine underneath.

  `@zoblocks/identity-core` is React-free and antd-free. It resolves a FHIR
  `Patient` into a renderable identity — chosen name over legal name, unambiguous
  dates, ages that are correct for neonates and frozen for the deceased,
  script-aware initials, identifier systems with check digits, and the five states
  that every design system collapses into one grey "Inactive" pill. It also ships
  `disambiguate()`, which keeps two patients with one name apart on a worklist.

  `@zoblocks/identity` renders that value for Ant Design, and encodes four
  invariants in the type system: two identifiers before a care action
  (NPSG.01.01.01), a stated reason for reaching the legal name, an atomic identity
  that cannot be half-loaded, and no way to render `Patient.gender` at all.

  `@zoblocks/fhir` gains `Patient.link` and `Patient.extension`, which is
  what makes merged records and the Gender Harmony fields readable.

  `@zoblocks/tokens` gains a motion group, including a deliberately zero
  alert duration and the one looping animation the system permits.

  `@zoblocks/eslint-plugin` gains three rules:
  `identity-requires-stable-key`, `no-room-number-identifier`, and
  `no-truncated-identity`.

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

- e013de1: Correctness fixes in fhir, intl, clinical-note-core and copilot-evals.

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

## 0.1.1

### Patch Changes

- Fix ESM resolution: emit explicit `.js` extensions on relative imports.

  `dist/index.js` and `dist/index.d.ts` in 0.1.0 emitted `export * from "./types"`
  with no file extension. Node's ESM resolver requires explicit extensions, so any
  consumer importing the package outside a bundler failed with
  `ERR_MODULE_NOT_FOUND`, and TypeScript projects on `moduleResolution: NodeNext`
  could not resolve the types either. Bundled consumers (Next, Vite) were
  unaffected, which is why the build, typecheck, and `npm publish --dry-run` all
  passed.

  Relative imports in `src` now carry `.js`, which TypeScript resolves back to the
  `.ts` source during development and emits verbatim for Node at runtime.

  Also corrects the README example, which called `formatHumanName(patient.name)` —
  that helper takes a single `HumanName`, not the array on a Patient. The correct
  entry point for a Patient is `resolvePatientName`, which applies FHIR name-use
  precedence and skips names marked `old`.
