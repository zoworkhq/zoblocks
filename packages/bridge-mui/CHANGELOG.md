# @zoblocks/bridge-mui

## 0.2.0

### Minor Changes

- e013de1: `useZoBlocksTokens` re-reads when a stylesheet is added to `<head>` or a `<link>` finishes loading, and an inline `fallback` no longer rebuilds its observer each render. `<zb-switch>` drops `aria-label` when `label` is cleared. The recorder signal reads only the analyser's `fftSize` samples, so a smaller analyser can reach silence.

  `ZoBlocksAntdProvider` and `ZoBlocksMuiProvider` take an optional `scope` ref. Pass it when the brand is set on a wrapper rather than on `<html>`.

- 86098fe: The framework exports go through the bridges, and the setting decides who is offered them

  The antd and MUI exports were a private re-implementation of the bridges' own
  mapping tables. The copy knew four tokens where `bridge-antd` knows twenty, and
  nothing compared them — so the file a customer downloaded was a quieter version
  of what the runtime bridge would have produced, and a fix applied to one was
  invisible in the other.

  `exportTheme` now calls `toAntdTheme` and `toMuiTheme`. Both are imported from a
  new `/inverse` subpath, which depends only on `bridge-core` — so this pulls in a
  mapping table, not React or a component library.

  **One behaviour change worth knowing about.** `colorPrimary` used to be the ramp
  step the customer picked; it is now the accent ZoBlocks actually renders.
  `--zb-accent` resolves to the ramp's 700, so a theme built from the 600 sat one
  shade away from the ZoBlocks components beside it and the two looked subtly
  unrelated. Consequently `exportTheme` takes the theme's resolved tokens as a
  third argument: "resolved" means ZoBlocks's defaults, with this customer's ramp
  applied, with their overrides on top, and the first of those lives in the token
  package rather than in a theme document.

  The MUI export keeps its `createTheme(...)` wrapper, and both still refuse to
  write a clinical colour: severity is carried by hue separation and a validated
  contrast floor, and neither framework has anywhere to record either.

  The Frameworks screen now decides something. An organisation that does not list
  Material UI is not offered a MUI export — and is told the format exists and
  which setting hid it, rather than being shown a shorter list. The screen's
  callout claimed two effects that were never wired; it now describes the one that
  is.

- 8809f44: The inverse bridge: a ZoBlocks brand, pushed into the host's own framework.

  ```diff
    <ZoBlocksAntdProvider>
  -   <YourAntdApp />   // antd's default blue
  +   <YourAntdApp />   // your brand
    </ZoBlocksAntdProvider>
  ```

  The forward bridge answers "make ZoBlocks's components look like our antd app".
  This answers the question customers ask second and care about more: _we
  configured our brand in your app — why do our **own** buttons still look
  like Ant Design's default blue?_ A customer configures once and their whole
  application follows, which is the difference between a component library with
  theming and a design system.

  It is the same correspondence read backwards, which is what keeps both
  directions honest: if `colorPrimary ↔ --zb-accent` is ever wrong, it is wrong
  both ways and one round-trip test catches it. `ZoBlocksAntdProvider` and
  `ZoBlocksMuiProvider` take the same props, so switching framework stays one
  import.

  `useZoBlocksTokens()` in `bridge-core` resolves the live `--zb-*` values from
  computed style — the browser is the only authority on what a token currently
  means, since it depends on which brand loaded and which `data-zb-theme` is set.
  It is SSR-safe, scopeable to a subtree so two customers can render on one page,
  and it follows a theme change through a `MutationObserver`: without that, a
  framework holding the previous values renders half a theme, which looks like a
  bug in the customer's code rather than in ours.

  **Clinical status is not pushed either way**, and the outbound reason is the
  more surprising one. A framework applies `colorError` to a validation message
  and a delete button, so a colour meaning _this result is dangerous_ would come
  to mean _this field is wrong_. The hex survives; the meaning does not.

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

- 8809f44: Theme bridges: ZoBlocks components now take a host framework's design language
  without importing that framework.

  Three new packages. `@zoblocks/bridge-core` is the contract — a bridge
  is a pure function from a framework's resolved theme to a set of CSS custom
  properties, and it renders nothing. `bridge-antd` and `bridge-mui` implement it.

  ```diff
  - <ConfigProvider theme={brand}><AntdBridge>{app}</AntdBridge></ConfigProvider>
  + <ThemeProvider theme={brand}><MuiBridge>{app}</MuiBridge></ThemeProvider>
  ```

  Everything between the wrappers is untouched. `apps/smoke-hosts` mounts the
  same `<Application />` module under antd, MUI and neither, and
  `e2e/bridge-hosts.spec.ts` asserts the three accessibility trees are identical
  — so a framework leaking into a component fails the build rather than a
  customer's page.

  **Material UI was built before any customer asked for it**, to find out whether
  a token surface derived from Ant Design was genuinely framework-independent or
  merely antd-shaped. It is the former: both bridges write the same core ten
  tokens, and the gaps run in both directions — antd has no `contrastText`, MUI
  has no background or radius scale. Each declares what it cannot express rather
  than approximating it.

  **Clinical status is never bridged.** A host's `colorError` is an arbitrary
  brand red; `status.critical` holds a validated contrast floor in three themes
  and 60° of hue separation from `status.low`, so the direction of an abnormal
  result survives colour-vision deficiency. `bridge-core` refuses the write and
  the E2E proves it with a host theme that sets its error colour to magenta.

  Also in this release:

  - **`@zoblocks/tabs/antd` is deprecated**, re-exporting its original
    behaviour with a development warning. Removed in 0.3.0; use `bridge-antd`,
    which writes the semantic tier so one wrapper themes every component rather
    than only tabs.
  - **The high-contrast theme is reachable.** 59 tokens at a 7:1 floor had been
    shipping under `[data-zb-theme="high-contrast"]`, an attribute nothing set,
    audited by nothing. It is now a fourth option in the docs theme toggle, the
    site has a matching high-contrast palette, and `scripts/a11y.ts` covers three
    themes instead of two.
  - **Seven timeline tokens now terminate in a literal**, so a component dropped
    into a page without the token stylesheet keeps its rails and node borders.
  - **`pnpm gen` is idempotent again.** The token surface was built before the
    react package emitted the stylesheets it reads, so one run could describe the
    previous run's CSS. Caught by the fallback gate added alongside it.

### Patch Changes

- e013de1: `zoblocks add` no longer writes through a symlink that leads out of the project,
  or through a target file that is a symlink. A bare dependency of an item added
  by URL now resolves beside that URL, not in the public catalog.

  `ZoBlocksMuiProvider` now derives `primary.dark`, `light` and `contrastText`
  from your brand, and your font reaches every typography variant.

  `toFhirBundle` entries now carry `fullUrl` and `request`, as FHIR transactions
  require, and the Provenance targets the Composition. Pass `uuid` to supply your
  own ids; by default they derive from the note.

- 958dba3: Never emit a MUI primary palette without `main`

  `createTheme` runs `augmentColor` over any `palette.primary` it is given and
  throws when `main` is absent — so an object carrying only `dark` was not a
  partial theme, it was one that took the host's application down at import. That
  state is one override away: a theme with `--zb-accent-hover` set and `--zb-accent`
  not.

  `toMuiTheme` now omits `primary` entirely rather than emitting shades with
  nothing to be shades of, and the interface requires `main` so the next version
  of this cannot compile. The rest of the palette is unaffected — the absence of
  one entry must not take the others with it.

  Found by pointing MUI's own `createTheme` at the output for the first time,
  which is what the app's new export preview does.

- e013de1: These packages now import in plain Node. Their built files used imports without
  a `.js` extension, which only a bundler resolves.

  `host-react` no longer ships its test files. `figma-core` now ships type
  declarations and a license.

- Updated dependencies [e013de1]
- Updated dependencies [8809f44]
- Updated dependencies [e013de1]
- Updated dependencies [5899184]
- Updated dependencies [8809f44]
  - @zoblocks/bridge-core@0.2.0
