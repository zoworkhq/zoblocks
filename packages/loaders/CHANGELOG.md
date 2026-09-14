# @zoblocks/loaders

## 0.2.0

### Minor Changes

- 04b516b: Fix two defects that made the elements unusable in React 19, Vue, and Angular,
  and add the smoke applications that found them.

  **Every attribute is now a writable property.** React 19 and Vue both decide per
  binding whether to write a DOM property or an attribute, and both decide with
  `if (key in element)`. Every attribute-backed value was a getter with no setter,
  which passes that test and then throws:

  ```
  TypeError: Cannot set property label of #<ZbLoaderElement> which has only a getter
  ```

  The elements did not render at all in React 19 or Vue. Setters now reflect to
  the attribute, so a property write and an attribute write are indistinguishable
  afterwards and attributes remain the source of truth. `delay`, `minDuration`,
  `slowAfter`, `hint`, `slowHint`, `motion`, `scrim`, `announce`, and `size` are
  newly readable as properties too.

  **Events are hyphenated: `zb-loader-show`, `zb-loader-slow`, `zb-loader-hide`**
  (previously `zb-loader:show` and friends). Angular's `(event)` binding reserves
  the colon for its global-target syntax — `(window:resize)` — so `(zb-loader:show)`
  does not compile, with no escape syntax available. Angular consumers would have
  had to drop to `addEventListener` for every subscription. The names are exported
  as `LOADER_EVENTS`. Breaking for anyone already subscribing, which is nobody:
  the package has not been published.

  `open` also gained a property, alongside the now-deprecated `isOpen` getter.

  Both defects were found by `apps/smoke` — six applications, one per supported
  framework, each built by that framework's real compiler and driven through the
  same script in Chromium, Firefox, and WebKit on every CI run. The unit suite
  could not have found either: it drives elements through `setAttribute`, which is
  the one path that always worked.

- bce5c77: First release: five healthcare loaders as dependency-free custom elements.

  `<zb-pulse-loader>` (an open heart with a rhythm line running through it),
  `<zb-rhythm-loader>` (one rhythm strip, swept), `<zb-breath-loader>` (three
  rings at a resting breath), `<zb-helix-loader>` (for laboratory surfaces), and
  `<zb-infusion-loader>` (the only one that can show real progress).

  Each is importable on its own subpath, works in React, Vue, Angular, Svelte or
  plain HTML, themes through ZoBlocks's semantic tokens, and ships a designed
  reduced-motion state rather than a paused one. Waits are announced in words:
  `role="status"` while indeterminate, `role="progressbar"` with a spoken value
  when a percentage is genuinely known.

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
- bce5c77: Fix a crash when the package is imported in any Node context.

  `class ZbLoaderElement extends HTMLElement` was evaluated at module scope, so
  importing the package on a server threw `ReferenceError: HTMLElement is not
defined` before anything rendered — breaking Nuxt, Angular Universal, Astro,
  SvelteKit, and Next.js server components, every one of which this package's
  README promised to support.

  The class now extends an inert stand-in when there is no DOM. Nothing registers
  on a server, which is what a server needs from a client-side package.

  A `node`-environment test suite now covers every entry point. Its absence is why
  this shipped: the existing suite runs in jsdom, which supplies `HTMLElement`, so
  a browser-environment test could not have caught it.

  Also: the minimum-duration gate no longer reads the wall clock, matching the
  React implementation exactly.
