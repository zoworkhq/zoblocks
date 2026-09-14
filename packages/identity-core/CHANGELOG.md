# @zoblocks/identity-core

## 0.2.0

### Minor Changes

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

- Updated dependencies [2e46026]
- Updated dependencies [43e931e]
- Updated dependencies [e013de1]
- Updated dependencies [ed95b45]
- Updated dependencies [5899184]
  - @zoblocks/fhir@0.2.0
