# @zoblocks/copilot-evals

## 0.2.0

### Minor Changes

- 4efc68d: First release: Copilot, a floating clinical assistant.

  The name is the category term, chosen for discoverability. It carries a tension
  worth naming: a copilot has shared control of the aircraft, and this component
  proposes while a human commits. Three things carry the weight the name gives up
  and none is optional now — the disclosure line is never dismissible, the confirm
  step defaults focus to Discard, and the answer register is derived rather than
  asserted by a provider.

  Not an AI chat component. The chat is the part customers recognise; the
  accountability layer around the model is the part they are buying. The floating
  dock and the streaming text are two weeks of work and compete with a hundred
  free widgets — deciding what the model may see, proving where an answer came
  from, keeping chart text from being read as instructions, and knowing whether
  the thing makes clinicians better or worse are the parts a digital-health team
  cannot build in a sprint.

  **Modes are scope contracts, not prompt presets.** A mode declares what it may
  read, which tools it may call, what it may output, and what risk it carries.
  "Can Look up see the problem list?" has an answer you read off a config object
  and hand to a compliance officer, rather than one you infer from English.

  **Verification is designed to cost less than acceptance.** Automation bias is an
  effort asymmetry, not a character flaw: if accepting costs one click and
  checking costs four and a new tab, people accept. Citations resolve _during_
  streaming so the sources drawer opens from cache, and it shows the retrieved
  passage with the supporting clause highlighted — a link is a citation, a passage
  is a verification.

  **Crisis is terminal, and deterministic.** A rule-based classifier runs before
  the model, evaluates the whole thread, and replaces the answer rather than
  annotating it. It is tuned so that clinical documentation — "denies SI",
  "C-SSRS negative", "history of overdose in 2019" — does not escalate, which is
  what makes it usable in the specialty that needs it most. Crisis lines resolve
  by locale, because 988 works in the United States and nowhere else.

  **Behavioral health ships clinician-facing only.** Illinois, Nevada and Utah
  each regulate AI in mental health differently and Nevada prohibits it outright,
  so the patient-facing configuration is not a flag — `assertClinicianFacing`
  throws. There is no sentiment or affect analysis anywhere in the package;
  Illinois enumerates that specifically.

  **The eval harness ships as a package**, with the 70% reliability floor as a
  release gate rather than a dashboard metric. Below it, decision support makes
  clinicians worse than no decision support, and that belongs in CI as a failing
  test.

  Four packages: a dependency-free engine, a headless React layer that owns the
  streaming-announcement strategy and the combobox keyboard model, an antd skin,
  and the eval harness. The registry item is a second skin over the same two
  packages — which settles the wrap-versus-registry question Signature left open,
  because almost none of Copilot is actually antd.

  Also adds `@zoblocks/no-stigmatising-language` to the ESLint plugin, matching
  the runtime check on model output.

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

- Updated dependencies [e013de1]
- Updated dependencies [4efc68d]
- Updated dependencies [5899184]
  - @zoblocks/copilot-core@0.2.0
