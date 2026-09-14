# @zoblocks/copilot-core

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
