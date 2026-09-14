# @zoblocks/host-react

## 0.2.0

### Minor Changes

- 5116e01: `@zoblocks/host-react` — the chrome an application puts around a clinical
  component, resolved from whichever UI framework the host runs, so one demo
  source renders under Ant Design, Material UI, or neither.

  ZoBlocks ships 28 components and none of them is a Button. That is ADR 0010
  working as intended — primitives match Ant Design's public API and take no
  dependency on it, which is what keeps copy-as-source distribution open for the
  whole form family — but it leaves a real gap when the question is "does this
  look like the rest of our app". Answering it honestly means rendering the
  customer's framework's real controls beside ours, not restyling a Button we do
  not have.

  - **Six primitives** — Button, Input, Switch, Checkbox, Select, Tabs — behind
    one context. Props are antd's, so the antd adapter is a pass-through and only
    the MUI adapter translates; every conversion it makes is named in `mui.tsx`.
  - **Real libraries, not reproductions.** The MUI adapter never sets
    `disableRipple`, and a test asserts `.MuiTouchRipple-root` appears on
    interaction — a copy cannot pass it.
  - **The frameworks stay behind subpath exports.** The root entry imports
    neither, so a consumer resolves antd or MUI only by mounting one. Measured:
    antd's seven components with `ConfigProvider` are 142 KB gzipped, MUI's 76 KB.
  - **Clinical colours are still refused.** Each host mounts its token bridge, and
    `bridge-core` throws if one ever writes `--zb-status-*`.

  Two normalisations worth knowing: antd calls `Switch.onChange(checked, event)`
  and the contract promises one argument, so the adapter drops the second; and
  antd v6 narrowed `cssVar` to an object, so it is no longer passed at all.

  A `dependency-cruiser` rule, `host-react-stays-at-composition`, fails the build
  if any package or registry item imports this. That is the whole safety of the
  arrangement: the day a component reaches for it, ADR 0010 is gone.

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

- e013de1: - `@zoblocks/elements`: importing the package on a server (Node, SSR) no longer throws `HTMLElement is not defined`.
  - `@zoblocks/loaders`: a loader moved in the DOM while showing now still closes after its minimum duration, and its stall hint still appears. It may stay up to one extra `min-duration` after the move.
  - `@zoblocks/host-react`: the ZoBlocks host's `Tabs` now supports arrow keys, Home and End. Arrows move focus; Enter or Space selects, as in the antd and MUI hosts.
- 5b1f446: The ZoBlocks host `Tabs` sets `aria-controls` only on the selected tab, and only when its panel is rendered. It used to point every tab at a panel that was never in the page, which is invalid ARIA.
- e013de1: These packages now import in plain Node. Their built files used imports without
  a `.js` extension, which only a bundler resolves.

  `host-react` no longer ships its test files. `figma-core` now ships type
  declarations and a license.

- Updated dependencies [e013de1]
- Updated dependencies [e013de1]
- Updated dependencies [958dba3]
- Updated dependencies [86098fe]
- Updated dependencies [8809f44]
- Updated dependencies [e013de1]
- Updated dependencies [5899184]
- Updated dependencies [8809f44]
  - @zoblocks/bridge-antd@0.2.0
  - @zoblocks/bridge-mui@0.2.0
  - @zoblocks/bridge-core@0.2.0
