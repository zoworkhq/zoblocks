---
"@oxygenui-design/tokens": minor
---

The dark theme's accent is the brand green, not a cyan

`semantic.dark` defined `accent`, `accent-hover` and `focus-ring` from
`ref.cyan.*` while `semantic.light` defined them from `ref.brand.*`. The result
was a design system that shipped teal-green in light and cyan in dark — a
difference nobody chose, and one that every user of both themes could see.

They now come from the brand ramp at the same steps: `brand.300` where
`cyan.300` was, `brand.200` where `cyan.200` was. The accent tint follows the
hue it is a tint of.

**Every contrast floor is untouched**, which is why this is a hue change rather
than a redesign. `text-on-accent` on `accent` measures 12.74:1 against the
cyan's 13.25; `accent` on `bg` is 12.91:1 against 13.42. Both were already an
order of magnitude above their floors, and the swap is the same step of a
different ramp rather than a new colour.

`ref.cyan.*` is left in the palette and no longer referenced by the semantic
tier. It is still emitted as `--ox-ref-cyan-*`, so nothing a consumer uses
disappears; `swatch.cyan.*`, which is a member of the distinguishable-swatch
palette rather than a brand colour, is unaffected.
