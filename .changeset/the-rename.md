---
"@zoblocks/bridge-antd": major
"@zoblocks/bridge-core": major
"@zoblocks/bridge-mui": major
"@zoblocks/cli": major
"@zoblocks/clinical-note-core": major
"@zoblocks/codemod": major
"@zoblocks/copilot": major
"@zoblocks/copilot-core": major
"@zoblocks/copilot-evals": major
"@zoblocks/copilot-react": major
"@zoblocks/elements": major
"@zoblocks/fhir": major
"@zoblocks/figma-core": major
"@zoblocks/host-react": major
"@zoblocks/identity": major
"@zoblocks/identity-core": major
"@zoblocks/intl": major
"@zoblocks/loaders": major
"@zoblocks/react": major
"@zoblocks/recorder-core": major
"@zoblocks/signature": major
"@zoblocks/signature-core": major
"@zoblocks/tabs": major
"@zoblocks/tabs-core": major
"@zoblocks/tabs-testing": major
"@zoblocks/theme": major
"@zoblocks/tokens": major
---

Oxygen UI is now Zoblocks.

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
| `OxygenAntdProvider`, `OxygenMuiProvider`, `OxygenTheme`, `OxygenHost`, `useOxygenTokens`, `resolveOxygenTokens`, `oxygenPrimitives`, `OxygenTokens`, `OxygenConfig` | the same names with `Zoblocks`              |
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
