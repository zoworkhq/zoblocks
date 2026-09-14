# @zoblocks/identity

## 0.2.0

### Minor Changes

- 702bfee: Move `PatientChip` off `.zb-chip`, which Accordion already owns.

  `.zb-chip` is Accordion's severity badge. Any page loading both stylesheets gave
  every patient chip the badge's border, background and text-sized padding — so
  the avatar hung outside its own tint and a column of chips came out as a ragged
  staircase. The class is now `.zb-patient-chip`; anyone who styled the old name
  should update their selector.

  Escalation no longer changes the box. It was adding `padding-inline`, so running
  the disambiguation pass nudged every collided row sideways; it now changes
  colour and reveals an inset rail, at identical geometry.

  Adds `block` to `PatientChip` for worklists, and `enabled` to `IdentitySet` so
  the pass can be turned off without unmounting the list — which is what makes the
  escalation animate rather than snap. Set `--zb-row` on a row wrapper to stagger.

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

- 9d65848: Put Patient identity in the catalog, and make its stylesheet actually themeable.

  The components shipped without a `component.meta.ts`, which is what the
  generator builds the catalog from — so they existed on npm and were invisible
  on the docs site. Adds the metadata, seven live scenarios, and the card art the
  docs-coverage gate requires.

  Two real defects surfaced while wiring it up:

  - **The stylesheet ignored the theme.** It declared `--zb-fg`, `--zb-bg` and
    `--zb-radius` locally — shadowing the semantic tier for everything nested
    inside a banner — and read three names that do not exist
    (`--zb-bg-container`, `--zb-text-secondary`, `--zb-fill-tertiary`). It looked
    correct on a white page and was light chrome on a dark app, with no response
    to a brand at all. Rewired to the repo's three-tier chain with
    `--zb-identity-*` as the documented override surface.

  - **`antd` was a required peer that the package never imports.** Nothing under
    `src/` references it, so a non-antd consumer was being asked to install it
    for nothing. Removed.

  `component-meta` gains an optional `propsSource` — unversioned here because it
  is private and never publishes. The convention — extract props from `src/<Title>.tsx` — assumes a package has one
  public component; identity's surface is three, and contorting the catalog title
  into a filename would put the filename in front of the reader.

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

- e013de1: `SignatureModal`: going to "Can't sign?" and back now restores the drawn
  signature. Before, the pad came back blank but Sign still submitted the old ink.

  `IdentityCache` now re-resolves a patient whose record changed under the same
  id, such as a new security label, a death or a merge. Records with no id,
  identifier or name are no longer cached.

  `PatientVerify` in `birth-date` mode now accepts the DDMMYYYY it asks for, with
  or without `/`, `-`, `.` or spaces. It never confirms against a partial birth
  date.

  `SignatureCapture.cancel()` takes the cancelled pointer's id. When the OS
  cancels a rejected palm touch, the pen stroke being drawn is kept.

  `SignaturePad` no longer draws with a stylus eraser or barrel button. Its ids
  are stable across renders and match on hydration. Under `StrictMode`,
  `initialStrokes` no longer vanish on the next change.

  `PatientBanner`: unmounting one of two banners for the same patient no longer
  hides a later banner for a different patient.

  `IdentityProvider` no longer rebuilds its policy, clears its cache or reads a
  new clock when `identifierSystems` or a callback is passed inline. Changing a
  system's label, grouping or validator now re-resolves.

  `PatientVerify` in `birth-date` mode shows no field when the record has no day
  or no date of birth. It says so and points to initials or the wristband.

  `resolveAge` and `yearsBetween` handle `YYYY` and `YYYY-MM`. `1985-03` no longer
  ages the patient in January. A partial date shows a range when the window
  spans a boundary (`40–41 y`, `7–19 mo`); `yearsBetween` returns the lower
  bound. `2025` no longer renders as `24320 mo`.

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

- Updated dependencies [ed95b45]
- Updated dependencies [e013de1]
- Updated dependencies [5899184]
  - @zoblocks/identity-core@0.2.0
