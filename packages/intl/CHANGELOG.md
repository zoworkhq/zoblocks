# @zoblocks/intl

## 0.2.0

### Minor Changes

- 96ad5f2: First release: messages and clinical register.

  ADR 0008 argued this is a week's work at 24 components and an enormous project
  at 500. It is being done at five.

  Two things a generic i18n layer does not give a healthcare library. **Register**:
  patient-facing and clinician-facing strings are different catalogs, not
  different tones — `useTerm` requires both sides, so shipping clinical shorthand
  to a patient is a type error rather than a review note. **Absence**: a missing
  translation never renders as a blank, because an empty label on a wait is
  indistinguishable from a component that failed to render.

  Zero dependencies; `Intl` is in every runtime the library targets.

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
