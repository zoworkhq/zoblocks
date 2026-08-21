---
"@oxygenui-design/bridge-mui": patch
---

Never emit a MUI primary palette without `main`

`createTheme` runs `augmentColor` over any `palette.primary` it is given and
throws when `main` is absent — so an object carrying only `dark` was not a
partial theme, it was one that took the host's application down at import. That
state is one override away: a theme with `--ox-accent-hover` set and `--ox-accent`
not.

`toMuiTheme` now omits `primary` entirely rather than emitting shades with
nothing to be shades of, and the interface requires `main` so the next version
of this cannot compile. The rest of the palette is unaffected — the absence of
one entry must not take the others with it.

Found by pointing MUI's own `createTheme` at the output for the first time,
which is what the app's new export preview does.
