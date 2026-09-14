# @zoblocks/codemod

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

- e013de1: These packages now import in plain Node. Their built files used imports without
  a `.js` extension, which only a bundler resolves.

  `host-react` no longer ships its test files. `figma-core` now ships type
  declarations and a license.
