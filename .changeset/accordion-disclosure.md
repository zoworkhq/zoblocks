---
"@oxygenui-design/react": minor
"@oxygenui-design/tokens": minor
"@oxygenui-design/codemod": minor
---

Accordion, Disclosure, ChartAccordion and SafetyPlan — a disclosure widget whose
headers can be read while closed, with a per-section access model for content a
reader may not simply be shown.

Three things separate it from a generic accordion, and all three come from what
gets collapsed in a behavioral health record.

- **Collapsed is not absent.** Items take a `summary` rendered in the header and
  a `severity` that paints a rail down its leading edge. A new lint rule,
  `@oxygenui/require-accordion-summary`, makes the pairing mandatory: a coloured
  rail with no words is a signal that forced-colors mode discards, monochrome
  printing discards, and roughly one in twelve men cannot resolve.
- **Expanding is not disclosing.** `access` describes what stands between the
  reader and the content — `advisory`, `reason`, `consent`, `withheld` — and
  `onDisclose` returns `boolean | Promise<boolean>`, which covers a synchronous
  policy check, an async consent lookup, and a modal that resolves on confirm.
  Content stays out of the DOM until the application says yes, including in the
  server-rendered output.
- **Withheld is a value.** A section this reader cannot obtain still renders a
  row that says so. `children` is typed `never` alongside `kind: "withheld"`, so
  the content cannot reach the bundle at all.

**Ant Design compatibility.** The API is `Collapse` prop for prop, including the
v6 names (`expandIconPlacement`, `size="medium"`, `destroyOnHidden`). One
deviation is deliberate and is a bug fix: antd's `accordion` boolean switches the
emitted markup from a disclosure widget to `role="tablist"`/`tab`/`tabpanel`, so
a prop meaning "one open at a time" silently changes the accessibility contract.
Here it changes the state policy and nothing else. `@oxygenui-design/codemod` ships
`antd-collapse` for the migration.

Also fixes, relative to what antd's Collapse emits: a real `<button>` inside a
real heading (so Space works and sections appear in the heading list),
`aria-controls` wired to a panel that has an id, `role="region"` up to six
simultaneously-openable sections and omitted above, and arrow-key navigation that
moves focus without toggling.

`hidden="until-found"` makes collapsed content reachable by find-in-page — React
serialises the attribute as `hidden=""`, so it is upgraded after commit, which is
also what keeps the server-rendered markup hidden on first paint.

**Tokens.** New `accordion.*` component tier, and `density.duration` as a fourth
density key (120/180/280ms), so motion is a property of density rather than a
per-component constant.
