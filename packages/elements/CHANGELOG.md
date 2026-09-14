# @zoblocks/elements

## 0.2.0

### Minor Changes

- 5b9d709: New package: ZoBlocks controls as dependency-free custom elements, starting with
  `<zb-switch>`.

  The framework-agnostic channel for the Switch. Same three axes and the same
  vocabulary as the React component — including the `"unknown"` value with its
  FHIR-shaped `absent-reason`, the seven commit phases, `tone`, and the hit area
  that does not shrink with the pill.

  The division of labour differs, on purpose. React's `onCommit` can take a
  promise, so the component owns the machine; an element cannot assume one, so
  the host sets `phase` and the element renders and announces. Activating it
  dispatches `zb-switch-request` and changes nothing on its own — a switch that
  flips optimistically and snaps back on failure is the defect this whole
  component exists to prevent.

  `test/switch-parity.test.ts` asserts the two channels cannot drift: same
  absence words, same label presets, same geometry, same keyframes, same
  reduced-motion and forced-colours behaviour, and the same rule that a user may
  leave `unknown` but never enter it.

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

- e013de1: `useZoBlocksTokens` re-reads when a stylesheet is added to `<head>` or a `<link>` finishes loading, and an inline `fallback` no longer rebuilds its observer each render. `<zb-switch>` drops `aria-label` when `label` is cleared. The recorder signal reads only the analyser's `fftSize` samples, so a smaller analyser can reach silence.

  `ZoBlocksAntdProvider` and `ZoBlocksMuiProvider` take an optional `scope` ref. Pass it when the brand is set on a wrapper rather than on `<html>`.

- e013de1: - `@zoblocks/elements`: importing the package on a server (Node, SSR) no longer throws `HTMLElement is not defined`.
  - `@zoblocks/loaders`: a loader moved in the DOM while showing now still closes after its minimum duration, and its stall hint still appears. It may stay up to one extra `min-duration` after the move.
  - `@zoblocks/host-react`: the ZoBlocks host's `Tabs` now supports arrow keys, Home and End. Arrows move focus; Enter or Space selects, as in the antd and MUI hosts.
