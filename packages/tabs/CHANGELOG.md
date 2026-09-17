# @zoblocks/tabs

## 0.2.1

### Patch Changes

- 27b41d0: Rail and stepper tabs now fit a phone. A rail narrower than 28rem stacks its list above the panel instead of drawing the panel over it; the tablist stays vertical, so arrow keys are unchanged. Stepper labels that do not fit end in an ellipsis rather than being cut mid-letter.

## 0.2.0

### Minor Changes

- f22cabe: New package: `@zoblocks/tabs`, a tab system built on the framework-free
  engine in `tabs-core`.

  The design premise is that "tabs" is four different components sharing one
  silhouette — a view switch, a navigation menu, a form value and a wizard — which
  need four different accessibility trees. So `as` is required and has no default,
  and `variant` (eleven skins) is an orthogonal axis that changes no ARIA.

  Three things worth knowing:

  - **`as` is required, and a tablist of links is an error.** A `role="tablist"`
    wrapped around anchors announces "tab, 2 of 5", then destroys the user's focus
    when an arrow key navigates the page. Every attribute is spelled correctly, so
    axe passes it. The new `@zoblocks/tabs-semantic-mode` rule catches it at lint
    time, and `validateTabsConfig` throws at runtime — the same posture as
    `signature-requires-typed-path`, and for the same reason.
  - **Colour never carries a status alone.** `count` + `tone` reaches the
    accessible name as a word, so a red 2 on a Labs tab announces "Labs, 2
    critical". Disabled tabs use `aria-disabled` with a mandatory
    `disabledReason` — in a chart, "no behavioural health section" and
    "behavioural health, restricted" are different clinical facts.
  - **Overflow is a choice, not a default.** Five strategies (`scroll`, `menu`,
    `collapse`, `wrap`, `none`) with different trade-offs; `wrap` is rejected on a
    tablist, because once a strip wraps onto two rows "the next tab" stops being a
    direction.

  Also included: `onBeforeChange` with async veto and an inert strip while
  pending, editable tabs with deterministic close-focus order and keyboard
  reordering, `availability` for offline/degraded panels, `syncTo` URL adapters,
  audit events, a `--zb-tabs-*` token surface that falls through to `--ant-*`, and
  `useTabs()` prop-getters for hosts that want the behaviour without the skin.

  `tabs-core` ships the parts with no React dependency: the role table, the
  keyboard model, priority-plus `fitTabs`, indicator geometry, the change gate,
  validation, locale strings and the URL adapters.

  Configuration is validated at render time by the declarative `Tabs`, so an
  invalid strip fails identically in `renderToString` and in a browser — a
  tablist of links must not be something you only discover after deploying. The
  compound `Tabs.Root` keeps a post-mount check, because it learns its items from
  a registry that layout effects fill.

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

- e013de1: `onBeforeChange` is now read when a change is requested, not on first render. A guard like `() => !isDirty` now blocks once the note is dirty, and a guard added after mount now counts. Before, both were ignored and a tab switch could drop an unsigned note. `useTabs` gets the same fix.

  Arrow keys now follow the on-screen order after keyed triggers move. After Ctrl+Shift+Arrow, focus stays on the tab that moved, so pressing it again moves the same tab.

  `overflow="collapse"` now hides the strip when it shows the select. Before, the stylesheet kept both on screen and in the accessibility tree.

  `overflow="menu"` now removes a tab from the strip when it moves to More, so no tab shows twice. Arrow keys skip those tabs. The More menu now takes ArrowUp, ArrowDown, Home and End, and Tab closes it.

  `keepScroll` now restores the scroll position. It saved 0 every time. It is on by default, and the docs now say so.

  A value that matches no tab no longer leaves the strip unreachable. The first enabled tab takes the tab stop. An unknown `?tab=` value is not selected; it applies if that tab appears later.

  `@zoblocks/tabs-testing`: `aria-labelledby` and `aria-describedby` with several ids, such as `"title count"`, no longer fail.

- 59056db: Two fixes to the shapes a caller actually reaches for first.

  **An icon-only trigger sizes its glyph.** Passing an icon as `label` — the
  supported shape, and the reason `textLabel` exists — left the SVG in a slot with
  no size constraint. An inline `<svg>` with a `viewBox` and no width or height
  has no intrinsic size, so it took whatever the strip offered: on the `command`
  variant, four glyphs meant to render at 14px filled the bar at roughly eighty.
  A bare SVG in the label slot is now 1em, matching the icon slot, so an icon-only
  trigger and an icon beside a label are the same size on the same strip. A caller
  who sets width and height on their own SVG still wins.

  **An unrecognised `as` is reported rather than crashed on.** Validation tested
  only for a _missing_ mode. A value outside the four — `"tablist"` is the one
  everybody tries, since that is the ARIA role — passed the guard, resolved to no
  role spec, and threw `Cannot read properties of undefined (reading 'ownsPanels')`
  from inside the validator. The one function whose job is to explain a
  misconfiguration was the one that failed to, with a stack trace pointing at
  library internals instead of at the caller's prop. It now names the value it was
  given and lists the four valid modes, exactly as the missing case does.
  `isSemanticMode` is exported for hosts validating an `as` that arrived as data.

- 8809f44: The component token surface is now a generated, published contract, and the
  token gate is a module rather than a build script.

  Two new entry points on `@zoblocks/tokens`:

  - **`/validate`** — the accessibility gate as pure functions. No `node:*`, no
    DOM, so the build, a browser preview and a server-side publish check run
    identical code. It had no direct tests; it now has 85.
  - **`/surface`** — every `--zb-<component>-*` token a consumer may set or a
    theme bridge may write. 282 entries across 19 components, each carrying its
    semantic fallback, the host-framework variables already in its chain, whether
    it terminates in a literal, and whether a bridge is allowed near it.

  Generating the surface found four live defects, all of the same silent shape —
  valid CSS, correct pixels, and the component quietly not participating in the
  theming system it appears to be part of:

  - **Seven component tokens referenced tokens that do not exist.** `--zb-fg`,
    `--zb-fg-muted`, `--zb-fg-subtle` in `tabs`; `--zb-rule` and
    `--zb-status-accent` in `copilot`. Those colours never followed a ZoBlocks or
    customer brand — they fell through to antd's value or a literal. The docs
    site masked it by defining the invented names in its own stylesheet. Now
    corrected to `--zb-text*`, `--zb-border` and `--zb-accent`, and a dangling
    fallback fails the build.
  - **`@zoblocks/identity` was documented as needing antd** and imports it
    nowhere. Its own metadata already said so. The README row is corrected and
    the unused `devDependency` removed; a test now holds every package's declared
    framework dependency against what it actually imports.

  Also: clinical tokens are marked `bridgeable: false`, so a theme bridge cannot
  map a host framework's `colorError` onto `status.critical` — ours carries a
  validated contrast floor and a 60° hue separation from `status.low`, and a
  brand red carries neither. Components declare their framework relationship in
  metadata, and ADR 0010's requirement that a wrapping component _name_ the
  behaviour it inherits is now enforced by the schema rather than by review.

  See ADR 0012.

- Updated dependencies [1b72a3e]
- Updated dependencies [59056db]
- Updated dependencies [f22cabe]
- Updated dependencies [5899184]
  - @zoblocks/tabs-core@0.2.0
