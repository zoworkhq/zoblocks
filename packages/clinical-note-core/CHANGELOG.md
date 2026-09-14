# @zoblocks/clinical-note-core

## 0.2.0

### Minor Changes

- da04b93: Add `@zoblocks/clinical-note-core` — the engine behind ClinicalNote.

  Every character in a clinical note has an origin: typed, dictated, template,
  pulled, copied forward, or generated. In every EHR shipping today all of it
  collapses into identical black text, and the clinician signs and attests to it
  equally. Note bloat, copy-paste error and AI attribution are that one missing
  data structure seen three times.

  This package stores origin per range and builds the rest on top of it:

  - **LOINC-coded sections as schema nodes**, chosen as a subset of what FHIR
    narrative permits — so a note that cannot be transmitted cannot be
    constructed, and `toNarrative()` has no failure branch.
  - **A provenance mark** that survives arbitrary editing, with `inclusive: false`
    so that typing beside generated text is not attributed to the model.
  - **A composable sign gate**: nine default rules over three severities, with
    hosts adding their own. Nothing signs while a `block` stands.
  - **Dot phrases**, `***` blanks with F2 traversal, and `{a:b:c}` pick lists.
  - **Deterministic serialization** — same document, same bytes — plus FHIR
    (`Composition` + `DocumentReference` + `Provenance`), FHIR-legal XHTML, and a
    real plain-text serializer for HL7 v2.

  No React, no Ant Design, no DOM: the whole package runs in Node, so a server can
  validate, render or re-hash a note without a browser. There is no clock in it
  either — every function that compares against the present takes a `now: Date`,
  and a test greps the source to keep it that way.

  262 tests, 99% line and 100% function coverage, including a seeded fuzzer that
  throws 2,000 random transforms at a marked document and asserts that provenance
  ranges never overlap, never go empty, always coalesce, and always serialize.

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

- e013de1: `zoblocks add` no longer writes through a symlink that leads out of the project,
  or through a target file that is a symlink. A bare dependency of an item added
  by URL now resolves beside that URL, not in the public catalog.

  `ZoBlocksMuiProvider` now derives `primary.dark`, `light` and `contrastText`
  from your brand, and your font reaches every typography variant.

  `toFhirBundle` entries now carry `fullUrl` and `request`, as FHIR transactions
  require, and the Provenance targets the Composition. Pass `uuid` to supply your
  own ids; by default they derive from the note.

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
