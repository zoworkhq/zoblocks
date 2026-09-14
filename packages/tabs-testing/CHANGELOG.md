# @zoblocks/tabs-testing

## 0.2.0

### Minor Changes

- 1b72a3e: Three defects found by mounting Tabs in a real application and a real browser,
  which a green unit suite had said nothing about.

  - **React StrictMode left every strip inert.** StrictMode mounts, cleans up and
    mounts again; the cleanup disposed the change gate, and disposal was
    terminal — so every request returned `superseded` before a user could touch
    anything. No click, no arrow key, no guard. StrictMode is on in the default
    Next.js template, and Testing Library does not wrap renders in it, so 252
    tests passed while the component did not work. `dispose()` is now reversible
    and `strict-mode.test.tsx` covers it.
  - **Flipping `dir` re-measured nothing.** A direction change mirrors every
    offset while changing no element's size, so no ResizeObserver fires and the
    indicator stayed at its LTR position — exactly what a live locale switch
    does. Direction is now a re-measure trigger.
  - **The indicator anchored to the wrong edge in RTL.** It set both `left` and
    `inset-inline-start`, which is an over-constrained absolutely positioned box;
    the over-constrained rule drops the start edge, so the thumb sat against the
    right edge and then translated further right.

  New in this release, completing the component brief:

  - `hotkeys` — Ctrl/Cmd + 1…9, off by default because those belong to the
    browser first on Windows and Linux. `9` is the last tab, as everywhere else.
  - `transition="view"` — routes the commit through `startViewTransition` where
    the engine has it, and falls through to the standard transition where it does
    not.
  - `virtualise` — `content-visibility` on off-screen triggers, and the
    per-trigger ResizeObserver capped above ~40 tabs. It never removes a trigger
    from the DOM: a tablist whose children come and go tells a screen reader
    there are twenty tabs when there are two hundred and forty.

  `@zoblocks/tabs-testing` is new: assertions that read a tab strip's
  accessibility tree rather than its props, so they catch what a snapshot cannot
  — a tablist of links, a strip with no tab stop, a dangling `aria-controls`, a
  nested interactive close button. The shipped component is held to them across
  all eleven variants.

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

- e013de1: `onBeforeChange` is now read when a change is requested, not on first render. A guard like `() => !isDirty` now blocks once the note is dirty, and a guard added after mount now counts. Before, both were ignored and a tab switch could drop an unsigned note. `useTabs` gets the same fix.

  Arrow keys now follow the on-screen order after keyed triggers move. After Ctrl+Shift+Arrow, focus stays on the tab that moved, so pressing it again moves the same tab.

  `overflow="collapse"` now hides the strip when it shows the select. Before, the stylesheet kept both on screen and in the accessibility tree.

  `overflow="menu"` now removes a tab from the strip when it moves to More, so no tab shows twice. Arrow keys skip those tabs. The More menu now takes ArrowUp, ArrowDown, Home and End, and Tab closes it.

  `keepScroll` now restores the scroll position. It saved 0 every time. It is on by default, and the docs now say so.

  A value that matches no tab no longer leaves the strip unreachable. The first enabled tab takes the tab stop. An unknown `?tab=` value is not selected; it applies if that tab appears later.

  `@zoblocks/tabs-testing`: `aria-labelledby` and `aria-describedby` with several ids, such as `"title count"`, no longer fail.
