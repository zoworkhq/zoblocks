---
"@oxygenui-design/theme": minor
"@oxygenui-design/bridge-antd": minor
"@oxygenui-design/bridge-mui": minor
---

The framework exports go through the bridges, and the setting decides who is offered them

The antd and MUI exports were a private re-implementation of the bridges' own
mapping tables. The copy knew four tokens where `bridge-antd` knows twenty, and
nothing compared them — so the file a customer downloaded was a quieter version
of what the runtime bridge would have produced, and a fix applied to one was
invisible in the other.

`exportTheme` now calls `toAntdTheme` and `toMuiTheme`. Both are imported from a
new `/inverse` subpath, which depends only on `bridge-core` — so this pulls in a
mapping table, not React or a component library.

**One behaviour change worth knowing about.** `colorPrimary` used to be the ramp
step the customer picked; it is now the accent Oxygen actually renders.
`--ox-accent` resolves to the ramp's 700, so a theme built from the 600 sat one
shade away from the Oxygen components beside it and the two looked subtly
unrelated. Consequently `exportTheme` takes the theme's resolved tokens as a
third argument: "resolved" means Oxygen's defaults, with this customer's ramp
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
