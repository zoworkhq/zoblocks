# @zoblocks/cli

## 0.2.0

### Minor Changes

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

- 9a5eadd: First release: ZoBlocks installs its own components.

  `npx @zoblocks/cli add pulse-loader` replaces the third-party CLI the
  registry channel used to depend on. The public catalog now needs no
  configuration, no namespace, and no account — a bare name resolves against
  `zoblocks.design`, built into the binary.

  Paid components keep their namespace and bearer token, declared in `zoblocks.json`
  (which replaces `components.json`). Credentials are written as `${ZOBLOCKS_TOKEN}`
  and expanded from the environment; a token written literally into that file is
  refused rather than used, because the file is meant to be committed.

  Zero runtime dependencies, per ADR 0009 — this binary runs with write access to
  a customer's repository, so its transitive tree is the first thing a vendor
  security review opens.

  **Breaking for registry-channel consumers.** Registry documents now declare
  `zoblocks:*` file kinds and a `$schema` under `zoblocks.design`, so the old CLI
  cannot read them and this one cannot read the old ones. Deploy the docs site
  before publishing this package. See
  [ADR 0016](../content/decisions/0016-the-installer-is-ours.md).

### Patch Changes

- e013de1: `zoblocks add` no longer writes through a symlink that leads out of the project,
  or through a target file that is a symlink. A bare dependency of an item added
  by URL now resolves beside that URL, not in the public catalog.

  `ZoBlocksMuiProvider` now derives `primary.dark`, `light` and `contrastText`
  from your brand, and your font reaches every typography variant.

  `toFhirBundle` entries now carry `fullUrl` and `request`, as FHIR transactions
  require, and the Provenance targets the Composition. Pass `uuid` to supply your
  own ids; by default they derive from the note.
