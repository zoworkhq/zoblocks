# @zoblocks/signature

## 0.2.0

### Minor Changes

- a6d27f6: New package: `@zoblocks/signature`, healthcare signature capture for Ant
  Design v6, built on the framework-free engine in `signature-core`.

  `<Signature>` is an antd `Form.Item` control offering draw, type and upload —
  plus the outcomes a signature pad has no answer for: declined, unable, verbal,
  on paper. `<SignatureManifest>` renders the read-only record 21 CFR 11.50 asks
  for. `useSignatureCapture()` is the headless hook.

  Three things worth knowing:

  - **`signatureRequired()` treats a decline as an answer.** A rule that demands
    `outcome === "signed"` makes refusal impossible to submit, which defeats the
    component. `signatureAffirmative()` is the stricter variant for consent gates.
  - **The typed path is required for WCAG 2.1.1 (Level A).** The new
    `@zoblocks/signature-requires-typed-path` lint rule makes `methods={["draw"]}`
    an error, because the mistake renders perfectly and passes every other test.
  - **No `dangerouslySetInnerHTML` anywhere.** `Ink` now carries structured render
    data (path strings, positioned text) alongside the SVG string, and
    `<SignatureInk>` builds real elements from it — a stored SVG rendered through
    innerHTML would be an XSS vector, since the value round-trips through a
    database.

  `signature-core` gains `toInkPaths()`, `Ink.render`, and
  `SignatureCapture.committedCount` (finished strokes, excluding one in progress —
  what a live region should count).

- 8809f44: SignatureBlock — the attestation at the foot of a document

  `SignatureManifest` is the record: every field 21 CFR §11.50 requires, laid out
  for somebody auditing what happened. `SignatureBlock` is the other thing a
  clinical enterprise needs — the compact strip under a discharge summary,
  referral letter or policy approval — and it answers a different question, for a
  reader who is not auditing anything: _did the right person sign this, and may I
  act on it?_

  That question is not answered by a signature and a name. A foundation doctor
  and a consultant may both be "Dr A Rao", and the difference decides whether a
  discharge is valid. So `Signer` gains two optional fields:

  - `role` — the job title held at the time of signing. Distinct from
    `credential`, which is a qualification somebody keeps for life; the role is
    what gave them the standing to sign _this_.
  - `register` — which body the identifier belongs to. A bare number is not a
    verifiable credential: "7412589" identifies nobody, and "GMC 7412589" is a
    lookup a reader can actually perform.

  Two properties the component holds deliberately:

  - **An unsigned document cannot be mistaken for a signed one.** Declined,
    unable, verbal, on-paper, pending and revoked render as a bordered notice
    saying "Not signed" — never as a rule with a name beneath it, which is how a
    reader skims a letter and comes away believing an attestation exists.
  - **Print is the primary medium.** The block refuses to break across a page,
    never depends on a background colour, and states every status in words as
    well as marking it, so it survives toner and forced colors.

  Integrity is shown only when the host supplies a verdict: an absent check and a
  passing check are different facts and must not look the same.

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

- Updated dependencies [a6d27f6]
- Updated dependencies [8809f44]
- Updated dependencies [547a263]
- Updated dependencies [e013de1]
- Updated dependencies [5899184]
  - @zoblocks/signature-core@0.2.0
