# @zoblocks/theme

## 0.2.1

### Patch Changes

- Updated dependencies [470ee7e]
  - @zoblocks/tokens@0.2.1
  - @zoblocks/bridge-core@0.2.1
  - @zoblocks/bridge-antd@0.2.1
  - @zoblocks/bridge-mui@0.2.1

## 0.2.0

### Minor Changes

- 8809f44: Font asset hosting, and the component tier made editable.

  **Uploads are judged by their bytes.** An endpoint that trusts a filename serves
  whatever was renamed to `.woff2`, so `checkFont` reads the four-byte signature
  instead, caps at 2 MB before doing any parsing work, and records a SHA-256 of
  exactly the bytes accepted — so what is served can be checked against what was
  approved, months later, by someone who was not there.

  It also detects tabular figures from the OpenType feature list. A face without
  `tnum` makes every numeric column ragged; in a flowsheet that is a real problem
  and it is invisible in a heading, so the customer is told at upload rather than
  discovering it in a vitals table. For a compressed container the answer is
  reported as _unknown_ rather than _absent_ — a face reported as lacking a
  feature it has would push someone away from a font that was fine.

  The app's component screen is now an editor over the generated 282-token
  surface, grouped by component, showing what each token inherits and locking the
  84 that resolve to clinical status.

- 8809f44: Brand artwork: seven roles, one table, and a manifest to deliver them

  A customer theme can now carry the artwork that goes with its palette, not just
  the palette. Seven roles — the wordmark on light, dark and single colour; a
  favicon; a home-screen icon; a link-preview card; a raster mark for email —
  held in one `BRAND_ASSETS` registry rather than seven fields, so what differs
  between them (accepted formats, required shape, where it is delivered) is data.

  Three things this changes that are worth knowing about:

  - **Uploads are checked, not sanitised.** An SVG is a document, not a picture:
    served from the app's origin it runs with the app's privileges. Any
    script, event handler, embedded document, remote `<use>` or entity
    declaration is refused, and the refusal names what was found — "invalid file"
    sends a designer back to the export settings that produced it. Raster formats
    are never parsed. Serving adds `nosniff` and a `default-src 'none'; sandbox`
    policy over the top.
  - **Shape problems warn rather than refuse.** A square link-preview card is a
    fine file in the wrong shape; a 192×192 home-screen icon is a size the
    platform genuinely fixes. The first is stored with a note about cropping, the
    second is refused. Dimensions are read from the file's own header.
  - **A manifest sits beside the stylesheet.** `…@7.json` alongside `…@7.css`,
    at the same pinned version, carrying what CSS cannot: alternative text,
    assets CSS never draws, absolute URLs, and the measured size so a host can
    reserve the space.

  The three marks also reach CSS as `--zb-logo-light`, `--zb-logo-dark`,
  `--zb-logo-mono`, plus `--zb-logo`, which switches with the theme so a host
  writes `background-image: var(--zb-logo)` and nothing else.

  `themeAssetsSchema.logos` is now `.brand`, and entries carry `role` instead of
  `variant`. `emptyAssets()` is exported, because the empty literal it replaces
  was written out in six places.

  In the app, the Brand screen now manages all seven, grouped by what renders
  them. Two bugs surfaced while wiring it: `/f/{org}/{file}` only ever served
  fonts, so uploaded artwork 404ed behind a broken image, and the previews
  followed the app's own theme — meaning "Mark, on light" previewed on black
  for anybody working in dark mode, which is precisely the failure a per-ground
  preview exists to catch.

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

- 86098fe: The framework exports go through the bridges, and the setting decides who is offered them

  The antd and MUI exports were a private re-implementation of the bridges' own
  mapping tables. The copy knew four tokens where `bridge-antd` knows twenty, and
  nothing compared them — so the file a customer downloaded was a quieter version
  of what the runtime bridge would have produced, and a fix applied to one was
  invisible in the other.

  `exportTheme` now calls `toAntdTheme` and `toMuiTheme`. Both are imported from a
  new `/inverse` subpath, which depends only on `bridge-core` — so this pulls in a
  mapping table, not React or a component library.

  **One behaviour change worth knowing about.** `colorPrimary` used to be the ramp
  step the customer picked; it is now the accent ZoBlocks actually renders.
  `--zb-accent` resolves to the ramp's 700, so a theme built from the 600 sat one
  shade away from the ZoBlocks components beside it and the two looked subtly
  unrelated. Consequently `exportTheme` takes the theme's resolved tokens as a
  third argument: "resolved" means ZoBlocks's defaults, with this customer's ramp
  applied, with their overrides on top, and the first of those lives in the token
  package rather than in a theme document.

  The MUI export keeps its `createTheme(...)` wrapper, and both still refuse to
  write a clinical colour: severity is carried by hue separation and a validated
  contrast floor, and neither framework has anywhere to record either.

  The Frameworks screen now decides something. An organisation that does not list
  Material UI is not offered a MUI export — and is told the format exists and
  which setting hid it, rather than being shown a shorter list. The screen's
  callout claimed two effects that were never wired; it now describes the one that
  is.

- 8809f44: Customer icon overrides, for the twenty-nine glyphs that are actually swappable

  "A custom icon set" implies two hundred icons across the design system. Read
  against the library it is twenty-nine, all of them copilot chrome — send, stop,
  close, copy, the chevron — plus five marks that must never be swappable and are
  now refused by name.

  **The five.** The switch draws `on`, `unknown`, `queued` and `locked`, and the
  accordion draws its chevron. These encode meaning rather than decorating it: the
  switch's `unknown` mark is the whole reason that component has a third value,
  because a binary control cannot tell "no" from "nobody asked". A customer who
  replaces it with something reading as "off" deletes that distinction and nothing
  downstream notices. They appear in the registry so the app can show them
  locked with the reason attached — a refusal nobody can see reads as a missing
  feature — and the schema will not accept them.

  **The mechanism is a CSS mask, not a React provider.** Every glyph is now a
  span whose shape comes from `mask-image: var(--zb-icon-{slot}, <built-in>)`, so
  an unset property draws what shipped and a set one draws the customer's. A
  provider was the obvious design and the wrong one: the Tailwind skin is a file
  copied _into_ the customer's tree and does not import our context, and a
  framework bridge writes CSS and knows nothing about React. CSS is the only
  surface all three share, and the `var()` fallback is the switching every token
  in this system already uses.

  Two consequences worth knowing:

  - **A glyph is one colour.** A mask keeps the shape and discards the paint.
    Every built-in was already monochrome `currentColor` stroke art so nothing is
    lost, but a two-colour brand glyph renders as its silhouette — stated on the
    upload screen rather than discovered later.
  - **`strokeWidth` is no longer a prop on an icon.** No call site used it. Size
    and colour still come from `em` and `currentColor` exactly as before.

  The built-in data URIs were produced by rendering the previous React components,
  so the geometry is byte-for-byte what shipped. They are readable rather than
  base64 so a glyph change stays a reviewable diff, and slots are selected by
  `data-icon` rather than a class because a class assembled from a variable is one
  Tailwind cannot see when it scans source text.

  Uploads take a whole folder at once, matched by filename to slot — a design team
  delivers a set, and twenty-nine separate uploads is a feature somebody uses once
  and abandons. A file matching no slot is named in the result rather than
  dropped, and one bad glyph does not fail the other twenty-eight.

- 8809f44: Empty-state illustrations, and cutting a favicon out of the wordmark

  Four more asset roles — `illustration-empty`, `illustration-search`,
  `illustration-denied`, `illustration-error` — reaching CSS as
  `--zb-illustration-*` and the manifest with their alternative text.

  They are four and not one because the states are genuinely different messages:
  "nothing here yet" and "not yours to see" look nothing alike to a reader and
  staff act on the difference. Each is previewed on a light _and_ a dark ground
  at the same time, which is the point of the new `ground: "both"` — an
  illustration is one file that has to survive both, nobody ships two, and a
  drawing with a baked white background looks perfect on the light preview and is
  a white rectangle in the dark theme.

  The app also now offers to cut a favicon out of the light mark. Nothing
  else here derives one asset from another, and the argument against it is weaker
  in exactly this one place: the alternative is not "somebody drew it" but "the
  tab shows a blank page icon". Three crops, previewed at 16, 32 and 64 pixels on
  both grounds, because sixteen is the size that decides and the person choosing
  should see that rather than be told. The cutting happens in a canvas in the
  browser — a favicon needs a rasteriser and the browser already is one — and the
  result is decoded server-side and put through `checkBrandAsset` like any
  uploaded file. A picture this app generated is not a picture it trusts.

  The role list also stopped being written down twice: `brandAssetSchema` now
  takes its enum from `BRAND_ASSET_ROLES` rather than restating it, which it had
  already drifted from within an hour of the registry growing.

- 9a60462: The logo checker moves to `@zoblocks/theme/logo`

  `checkLogo`, `checkBrandAsset`, `logoContentType`, `logoHeaders`,
  `MAX_LOGO_BYTES`, `LOGO_VARIANTS` and `imageSize` are no longer exported from
  the package barrel. They are at `@zoblocks/theme/logo`.

  **Breaking for anyone importing them from the barrel**, which is the point.
  `checkLogo` hashes uploaded bytes with `node:crypto`, so any consumer that
  bundled `@zoblocks/theme` for a browser was carrying an unresolvable
  import — and `imageSize` is 6 kB of PNG, JPEG, WebP and SVG header parsing that
  only makes sense when you are holding an upload. Both are server work, and the
  subpath says so.

  ```diff
  -import { checkLogo, MAX_LOGO_BYTES } from "@zoblocks/theme";
  +import { checkLogo, MAX_LOGO_BYTES } from "@zoblocks/theme/logo";
  ```

  The `LogoFormat` and `Dimensions` _types_ stay on the barrel. They describe an
  image rather than read one, and a caller naming a format should not have to
  import a server module to do it.

  `LogoFormat` is now declared in `assets.ts`, beside the roles that enumerate
  which formats each accepts. It was a type-only cycle between the two files —
  harmless at runtime, and refused by the architecture rules, correctly: the next
  edge added to that cycle may not be type-only.

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

- 8809f44: Customer themes at runtime: the document model, the ramp generator, the
  validation adapter, and the CSS payload a published theme is served as.

  A customer theme is a built-in brand plus an envelope. The `tokens` body is
  byte-compatible with `packages/tokens/tokens/brands/*.json`, so a theme authored
  in the app can be committed as a brand and a brand can be imported into the
  app — one format, not two, which is what keeps "bring your own design
  system" from meaning two things to support.

  - **`validateTheme()`** shapes a customer's ramp as a `Brand` and hands it to
    the Phase 1 validator, so a customer is demonstrably held to the same bar
    `northwind.json` is rather than to a second implementation that agrees today.
  - **`generateRamp()`** takes one brand colour and produces eleven steps, holding
    hue and saturation. The app asks for a colour rather than a ramp because
    most of what the contrast gate catches is a hand-picked step.
    `nearestPassing()` is the "apply nearest passing" repair — a rejection with no
    route out is how an accessibility gate becomes something a team works around.
  - **`emitThemeCss()`** writes an immutable, version-pinned stylesheet. Token
    values are parsed and re-serialised rather than interpolated: a value reaches
    it from a text field, and `red; } body { display: none` would otherwise close
    the rule and open another.
  - **`isServable()`** refuses a theme validated by an older validator, so
    tightening a rule cannot leave an older palette live and restoring an old
    version re-checks it.
  - **`<ZoBlocksTheme>`** applies tokens inline, for multi-tenant pages where a
    root-scoped stylesheet would let the last one loaded win.

  Only the primitive ramp is ever emitted. Semantic tokens are not, and cannot be
  — which is how a customer theme reaches every component without being able to
  redefine what `critical` means.

### Patch Changes

- 8809f44: App screens for import, export, comparison and typography.

  The export and import logic landed with tests but no interface. These wire it
  up, and the framing matters in two places:

  **Import previews before it saves.** An import that writes on upload gives a
  customer no chance to see that their status colours were discarded, and the
  first they hear of it is a support conversation about a red that did not change.
  The result names what was matched, what had no counterpart, and what was
  discarded — and an imported palette still has to clear the publish gate, so a
  file from another system cannot smuggle a failing colour into production.

  **Comparison shows the effect, not only the values.** A customer looking at
  `#1d63c9` beside `#7c3aed` cannot tell which one their primary button label will
  be readable on. Each version carries its validation result under today's rules,
  so a version that passed when it was published and would not pass now says so.

  Typography's specimen is a result table rather than a paragraph, because that is
  where a font choice actually fails: a face without tabular figures looks fine in
  a heading and makes every vitals column ragged.

- 958dba3: The export screen renders the file it is offering

  A theme file is a claim that a brand survived translation into somebody else's
  vocabulary, and the only thing that settles it is looking at _their_ Button. So
  each framework export card now draws Ant Design's or Material UI's own
  components under exactly the theme object the download beside it contains.

  Deliberately the outbound direction. The inbound bridge maps a host's resolved
  theme onto ZoBlocks's tokens, and the app does not have a customer's
  `ConfigProvider` config — an inbound preview here could only show a sample theme
  dressed up as theirs, which is worse than showing nothing.

  Loaded with `ssr: false`, and that is not an optimisation. `"use client"` marks
  where the client bundle begins, not where server rendering stops: Next still
  evaluates the module on the server for the first HTML, which pulled antd and MUI
  into the request path and took the render stream down with "the destination
  stream closed early".

  The app now declares antd and MUI, which an architectural test used to
  forbid outright. That rule was a proxy for the claim that matters — ZoBlocks's
  components need no UI framework — and it is now asserted directly and more
  strictly in two parts: the component packages declare no framework dependency,
  and inside the app a framework is reachable from exactly one named file and
  never from its own interface.

- f3915f6: Cover the asset store, the manifest and the picker, and fix a field that could not be typed into

  Writing tests for the pieces added this week found one real defect and closed
  several gaps where the only coverage was a browser test.

  **The colour picker's hex field could not be typed into.** It was bound straight
  to the value prop, and an incomplete hex is correctly not emitted upstream — so
  the parent's state never moved and React restored the old text on the very next
  render. Every keystroke disappeared as it was made. The field looked right,
  opened right, and could only be changed by pasting six characters over a full
  selection. `ColorField` had solved this with a local draft and the pattern did
  not get carried across.

  New coverage for things that previously had none:

  - **The asset store.** That a second upload replaces rather than appends, that
    two roles written at the same moment both survive — the reason those writes
    use array operators — that removing one leaves its neighbours, and every
    refusal: unknown role, executable artwork, whitespace-only alt text, a
    home-screen icon that is not the size the platform fixes.
  - **Glyph uploads.** A batch containing one bad file still stores the rest, a
    locked mark is refused, a raster glyph is refused because a mask reads its
    alpha, and a slot is replaced rather than accumulated.
  - **The manifest.** Absolute URLs, no doubled slash, an already-absolute source
    left alone, alternative text carried including the empty string, and registry
    ordering so two publishes of one theme produce the same file.
  - **WebP dimensions in all three container forms.** A design tool emits VP8L for
    lossless and VP8X whenever there is alpha — which a logo always has — so
    reading only the lossy header would have worked on the test file and returned
    nothing for what customers export.
  - **The segmented control's keyboard contract.** One tab stop rather than one
    per option, arrows in both directions, wrapping at the ends, and stepping over
    a disabled option.
  - **A replaced glyph reaching the emitted stylesheet**, which is the one step
    that can fail while every other part of the feature still appears to work.

- e013de1: These packages now import in plain Node. Their built files used imports without
  a `.js` extension, which only a bundler resolves.

  `host-react` no longer ships its test files. `figma-core` now ships type
  declarations and a license.

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

- a8b9645: Reword the draft-watermark note so it says what it means.

  "An unsigned note that prints clean gets filed and read as final" used "clean"
  to mean "without the watermark" — and `no-stigmatising-language` flagged it,
  correctly in the sense that matters: this library's own argument is that the
  word does work and changes how the next clinician reads a patient. A string that
  needs the reader to pick the harmless sense is a string worth rewriting, even
  when the sense was never in doubt here.

  It was also the ninth warning against a `--max-warnings 8` ceiling, so `pnpm
lint` failed on it.

- Updated dependencies [55822ea]
- Updated dependencies [e013de1]
- Updated dependencies [e8aaef9]
- Updated dependencies [e013de1]
- Updated dependencies [9e0ded1]
- Updated dependencies [7df0039]
- Updated dependencies [f4234de]
- Updated dependencies [2d3313e]
- Updated dependencies [8809f44]
- Updated dependencies [958dba3]
- Updated dependencies [86098fe]
- Updated dependencies [ed95b45]
- Updated dependencies [8809f44]
- Updated dependencies [5b9d709]
- Updated dependencies [8809f44]
- Updated dependencies [e013de1]
- Updated dependencies [0299902]
- Updated dependencies [5899184]
- Updated dependencies [8809f44]
- Updated dependencies [8809f44]
- Updated dependencies [bce5c77]
  - @zoblocks/tokens@0.2.0
  - @zoblocks/bridge-antd@0.2.0
  - @zoblocks/bridge-mui@0.2.0
  - @zoblocks/bridge-core@0.2.0
