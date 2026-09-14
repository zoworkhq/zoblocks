# @zoblocks/figma-core

## 0.2.0

### Minor Changes

- d48186c: ZoBlocks themes as Figma variable plans

  A new pure package: it turns a resolved theme into a plan a Figma plugin can
  apply, reads variables back as an import report, and diffs the two. No
  `figma.*`, no DOM, no network, no `node:*` — asserted by a test over the source
  rather than promised in a comment.

  That purity is the whole point of the layout. A Figma plugin runs across two
  isolated contexts — a sandbox with the Figma API and no networking, and an
  iframe with networking and no Figma API — and neither is pleasant to test.
  Keeping every rule here means the adapters on either side are thin enough to
  have no conditionals worth testing, which is the same discipline that let
  `bridge-core` serve both antd and MUI.

  Three properties carry the value, and each degrades silently:

  - **Aliases, not flattened hex.** A semantic token resolving to a ramp step is
    written as an alias to that step. Flattened, it renders identically and severs
    the link, so moving the brand stops moving the accent — the problem a token
    system exists to prevent, rebuilt inside somebody's design file.
  - **Idempotence.** `diffPlan` over an unchanged file reports zero writes.
    Without it every sync churns the file's version history and a designer loses
    the ability to see what actually changed. Values compare as hex, because the
    same colour returns from Figma with rounding applied and float equality would
    report every variable as different.
  - **Durable identity.** The ZoBlocks token name is stamped in plugin data; the
    label belongs to the designer. Matching on the label would create a duplicate
    the first time somebody tidies a collection, and claim a variable that was
    never ours.

  Clinical tokens are pushed so a designer can see them, carry the reason they
  cannot be edited in Figma's own description field, and are refused on the way
  back — named in `discardedClinical`, deliberately the shape `importDtcg` already
  returns. A theme that has quietly lost a clinical signal renders correctly and
  passes every other check, which is what makes it the failure worth reporting.

  Accompanied by ADR 0015, `proposed`, which records the per-tier owner and three
  corrections to the counts the integration plan was written against.

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

- Updated dependencies [55822ea]
- Updated dependencies [e8aaef9]
- Updated dependencies [9e0ded1]
- Updated dependencies [7df0039]
- Updated dependencies [f4234de]
- Updated dependencies [2d3313e]
- Updated dependencies [8809f44]
- Updated dependencies [ed95b45]
- Updated dependencies [5b9d709]
- Updated dependencies [8809f44]
- Updated dependencies [0299902]
- Updated dependencies [5899184]
- Updated dependencies [8809f44]
- Updated dependencies [bce5c77]
  - @zoblocks/tokens@0.2.0
