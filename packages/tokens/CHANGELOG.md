# @zoblocks/tokens

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

- 7df0039: The dark theme's accent is the brand green, not a cyan

  `semantic.dark` defined `accent`, `accent-hover` and `focus-ring` from
  `ref.cyan.*` while `semantic.light` defined them from `ref.brand.*`. The result
  was a design system that shipped teal-green in light and cyan in dark — a
  difference nobody chose, and one that every user of both themes could see.

  They now come from the brand ramp at the same steps: `brand.300` where
  `cyan.300` was, `brand.200` where `cyan.200` was. The accent tint follows the
  hue it is a tint of.

  **Every contrast floor is untouched**, which is why this is a hue change rather
  than a redesign. `text-on-accent` on `accent` measures 12.74:1 against the
  cyan's 13.25; `accent` on `bg` is 12.91:1 against 13.42. Both were already an
  order of magnitude above their floors, and the swap is the same step of a
  different ramp rather than a new colour.

  `ref.cyan.*` is left in the palette and no longer referenced by the semantic
  tier. It is still emitted as `--zb-ref-cyan-*`, so nothing a consumer uses
  disappears; `swatch.cyan.*`, which is a member of the distinguishable-swatch
  palette rather than a brand colour, is unaffected.

- 8809f44: DTCG spec compliance at the boundary, and themes in five formats.

  **The format fix.** `dimension`, `duration`, `cubicBezier` and `shadow` are
  structured objects in the W3C spec and CSS strings in our source, and the loader
  coerced with `String($value)` — so a spec-compliant file parsed to
  `"[object Object]"`, emitted a custom property with a meaningless value, and
  rendered as nothing. No error, no warning, no failing test.

  Fixed at the edges rather than in the middle: internally a token value stays a
  CSS string, because that is what the emitters need. What changed is that
  **export serialises to the spec form and import reads it**, so a customer's file
  round-trips through Tokens Studio, Style Dictionary v4 or Figma Variables and
  comes back meaning the same thing. Proven over all 543 shipped tokens: out to
  the spec form and back, byte-identical.

  **Five exports.** DTCG, CSS, Tailwind `@theme`, an antd `ConfigProvider` token
  object, and an MUI `createTheme` call. The last two are the bridge mapping
  tables run backwards — a bridge reads `colorPrimary` and writes `--zb-accent`;
  the export reads the accent and writes `colorPrimary` — so a customer can theme
  their _own_ antd or MUI components from the brand they configured once, and the
  correspondence stays correct automatically when a bridge is corrected.

  **Import** reads DTCG, Tokens Studio and an existing antd or MUI theme object.
  Clinical tokens found in a file are discarded and _reported_, before
  confirmation: a customer whose file contained a status colour needs to know it
  did not take effect, or the first they hear of it is a support conversation
  about a red that did not change.

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

- 0299902: The brand ramp moves into the validator

  `ramp.ts` — `generateRamp`, `nearestPassing`, `RAMP_STEPS`, `ANCHOR_STEP` and
  the HSL conversions — now lives in `@zoblocks/tokens/validate`, beside
  the colour maths it was already importing. `@zoblocks/theme` re-exports
  every one of them, so no caller changes.

  The move has a cause, and it is the same one that made the validator a package
  in the first place. A new fourth caller — a Figma plugin sandbox, running
  ZoBlocks's accessibility gate inside a design file — offers a nearest passing
  colour per failing pair, exactly as the app's token editor does. Reaching
  `nearestPassing` through `theme` would have made that sandbox depend on the
  theme document schema, zod and both framework bridges to make one suggestion.

  `ramp.ts` was pure the whole time; it was simply in the package that had grown
  around it. Its only import was the validator, and its only caller outside its
  own tests was the app's new-theme form.

  The plugin itself is `@zoblocks/figma-plugin`, private and distributed
  through Figma rather than npm. It reads the variables already in an open file,
  measures them with this package's own `CONTRAST_PAIRS`, `STATUS_PAIRS` and
  floors, and declares no network access — a claim its tests check against its
  source rather than against its manifest.

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

- 8809f44: The component token surface is now a generated, published contract, and the
  token gate is a module rather than a build script.

  Two new entry points on `@zoblocks/tokens`:

  - **`/validate`** — the accessibility gate as pure functions. No `node:*`, no
    DOM, so the build, a browser preview and a server-side publish check run
    identical code. It had no direct tests; it now has 85.
  - **`/surface`** — every `--zb-<component>-*` token a consumer may set or a
    theme bridge may write. 282 entries across 19 components, each carrying its
    semantic fallback, the host-framework variables already in its chain, whether
    it terminates in a literal, and whether a bridge is allowed near it.

  Generating the surface found four live defects, all of the same silent shape —
  valid CSS, correct pixels, and the component quietly not participating in the
  theming system it appears to be part of:

  - **Seven component tokens referenced tokens that do not exist.** `--zb-fg`,
    `--zb-fg-muted`, `--zb-fg-subtle` in `tabs`; `--zb-rule` and
    `--zb-status-accent` in `copilot`. Those colours never followed a ZoBlocks or
    customer brand — they fell through to antd's value or a literal. The docs
    site masked it by defining the invented names in its own stylesheet. Now
    corrected to `--zb-text*`, `--zb-border` and `--zb-accent`, and a dangling
    fallback fails the build.
  - **`@zoblocks/identity` was documented as needing antd** and imports it
    nowhere. Its own metadata already said so. The README row is corrected and
    the unused `devDependency` removed; a test now holds every package's declared
    framework dependency against what it actually imports.

  Also: clinical tokens are marked `bridgeable: false`, so a theme bridge cannot
  map a host framework's `colorError` onto `status.critical` — ours carries a
  validated contrast floor and a 60° hue separation from `status.low`, and a
  brand red carries neither. Components declare their framework relationship in
  metadata, and ADR 0010's requirement that a wrapping component _name_ the
  behaviour it inherits is now enforced by the schema rather than by review.

  See ADR 0012.

- bce5c77: Fix three WCAG 2.2 AA contrast failures, and widen the gate that missed them.

  The focus indicator measured **2.50:1** against the 3:1 floor in SC 1.4.11 and
  2.4.11 — it governs every focusable element in every component. `text-on-accent`
  measured **3.81:1** against 4.5:1, which is every primary button label.
  `border-strong`, which backs `--zb-field-border` and `--zb-chart-axis`, measured
  **1.48:1** on light and **2.02:1** on dark against a 3:1 floor.

  Values changed: `accent` → `brand.700`, `accent-hover` → `brand.800`,
  `focus-ring` → `brand.600`, `border-strong` → `slate.500` (light) and a new
  `ref.ink.500` (dark). Expect a slightly deeper accent and a more visible field
  border — both deliberate.

  The real fix is the gate. It checked four hand-picked text pairs; it now checks
  every foreground the system composes over a background, split by the WCAG rule
  that applies (4.5:1 for text, 3:1 for interface components), and the published
  `contrast.json` reports the same floors the gate enforces. The validator also
  has tests for the first time.

  Also fixed: unresolved DTCG aliases leaked into `tokens.json`, which is
  documented as a flat map for external tooling — density and component values
  now resolve to literals, or to a runtime `var()` where they genuinely vary.

  The package is properly publishable for the first time: `main`, `types`,
  `type: module`, a real build, and a `check-tarball` gate. The previously
  published 0.1.0 predated the token pipeline entirely and still contained a
  zero-alpha `surface-overlay` that rendered dialogs and popovers transparent.

### Patch Changes

- 9e0ded1: A note on dimming a filled control

  No token changed here, but the finding belongs with them. Both site palettes
  used `hover:opacity-90` on their primary button. Against the near-black CTA
  that was harmless — it had contrast to spare. Against a mid-tone brand colour
  it is not: the green composited over the page at `#1e8371`, and the label
  measured **4.37:1** against the 4.5 floor. The primary action, below AA, on
  hover only, in light mode only.

  The lesson generalises past this repository. **Opacity is not a hover state for
  anything that carries text.** It moves both the foreground and the background
  toward whatever is behind, and how far depends on the page — so a control that
  passes in isolation can fail in place. Hover now darkens in light and lightens
  in dark, through `--site-cta-hover`, which is a colour somebody chose and a
  test can measure.

  Caught by axe in Firefox and nowhere else, because the failure only exists
  while the pointer is over the button and only Firefox happened to leave it
  there after the click that preceded the audit.

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

- 2d3313e: Component tokens that track density now actually follow it.

  `var()` inside a custom-property declaration is substituted against the element
  the declaration applies to. So `--zb-switch-target-min: var(--zb-density-target)`
  written once on `:root` captured the root profile's value and inherited that
  literal everywhere — and a container marked `data-zb-density="clinical"` moved
  `--zb-density-target` beneath it while every component inside kept the root
  profile's spacing.

  Nothing looked broken, which is why it shipped. But `--zb-switch-target-min` is
  the hit area, and Switch's own accessibility note claims the target follows the
  density profile. It did not: every switch on every page presented the root
  profile's target regardless of the scope it sat in. `--zb-accordion-*` had the
  same freeze.

  The emitter now re-declares every density-linked component token inside each
  profile block, so the reference resolves against that profile. Same specificity
  as the profile block a host would write, so the override surface is unchanged.

- 8809f44: Print artwork, an honest token surface, and one field removed

  Two more asset roles for paper. `letterhead` is the header band on a discharge
  summary or referral letter; `watermark-draft` is laid across any note that has
  not been countersigned — the one asset in this set with a patient-safety
  argument, because an unsigned note that prints clean gets filed and read as
  final. Both emit at the root and are used only by `@media print`: a customer
  working in the dark theme still prints on white, and a letterhead that followed
  the screen theme would come out reversed on the page.

  The surface manifest also stopped lying about what kind of value three tokens
  hold. Both causes were ordering, and both reported green for as long as nobody
  looked:

  - `kindOf` tested colour before shadow, and a shadow _contains_ a colour — so
    every shadow in the system was typed `color`. Composite kinds are now tested
    before the scalar kinds they are built out of.
  - A DTCG group `$type` is flattened onto every token beneath it, so
    `switch.ease` — an alias to a cubic-bezier — inherited `color` from the fifty
    switch tokens that genuinely are colours. An alias now takes its type from
    what it points at, which fixes the class rather than the instance.

  Consumers act on `kind`: a bridge writing an antd theme, an editor rendering a
  colour picker, a validator deciding what a customer may type. A timing function
  labelled `color` is a swatch picker on a cubic-bezier, which is what the app
  was showing. Five tests now hold the manifest to it in both directions, so a
  future fix cannot pass by labelling everything `dimension`.

  **Removed:** `themeAssetsSchema.iconSet`. It offered a choice between `lucide`
  — a library this design system deliberately does not use, as
  `copilot-react/icons.tsx` says in as many words — and `custom`, which nothing
  implemented and no component could have consumed, because the library has no
  icon layer at all. A field that advertises a capability that does not exist and
  misnames the default is worse than no field. If customer icon overrides are
  wanted later, the shape to generalise is the 30-glyph registry already in
  `copilot-react`, and that is a project rather than a schema line.
