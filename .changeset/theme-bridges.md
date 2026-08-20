---
"@oxygenui-design/bridge-core": minor
"@oxygenui-design/bridge-antd": minor
"@oxygenui-design/bridge-mui": minor
"@oxygenui-design/tabs": minor
"@oxygenui-design/react": patch
---

Theme bridges: Oxygen components now take a host framework's design language
without importing that framework.

Three new packages. `@oxygenui-design/bridge-core` is the contract — a bridge
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

- **`@oxygenui-design/tabs/antd` is deprecated**, re-exporting its original
  behaviour with a development warning. Removed in 0.3.0; use `bridge-antd`,
  which writes the semantic tier so one wrapper themes every component rather
  than only tabs.
- **The high-contrast theme is reachable.** 59 tokens at a 7:1 floor had been
  shipping under `[data-ox-theme="high-contrast"]`, an attribute nothing set,
  audited by nothing. It is now a fourth option in the docs theme toggle, the
  site has a matching high-contrast palette, and `scripts/a11y.ts` covers three
  themes instead of two.
- **Seven timeline tokens now terminate in a literal**, so a component dropped
  into a page without the token stylesheet keeps its rails and node borders.
- **`pnpm gen` is idempotent again.** The token surface was built before the
  react package emitted the stylesheets it reads, so one run could describe the
  previous run's CSS. Caught by the fallback gate added alongside it.
