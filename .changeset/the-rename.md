---
"@zoblocks/bridge-antd": minor
"@zoblocks/bridge-core": minor
"@zoblocks/bridge-mui": minor
"@zoblocks/cli": minor
"@zoblocks/clinical-note-core": minor
"@zoblocks/codemod": minor
"@zoblocks/copilot": minor
"@zoblocks/copilot-core": minor
"@zoblocks/copilot-evals": minor
"@zoblocks/copilot-react": minor
"@zoblocks/elements": minor
"@zoblocks/fhir": minor
"@zoblocks/figma-core": minor
"@zoblocks/host-react": minor
"@zoblocks/identity": minor
"@zoblocks/identity-core": minor
"@zoblocks/intl": minor
"@zoblocks/loaders": minor
"@zoblocks/react": minor
"@zoblocks/recorder-core": minor
"@zoblocks/signature": minor
"@zoblocks/signature-core": minor
"@zoblocks/tabs": minor
"@zoblocks/tabs-core": minor
"@zoblocks/tabs-testing": minor
"@zoblocks/theme": minor
"@zoblocks/tokens": minor
---

Oxygen UI is now ZoBlocks.

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
