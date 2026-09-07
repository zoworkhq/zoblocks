---
"@zoblocks/tokens": patch
---

Component tokens that track density now actually follow it.

`var()` inside a custom-property declaration is substituted against the element
the declaration applies to. So `--zb-switch-target-min: var(--zb-density-target)`
written once on `:root` captured the root profile's value and inherited that
literal everywhere — and a container marked `data-zb-density="clinical"` moved
`--zb-density-target` beneath it while every component inside kept the root
profile's spacing.

Nothing looked broken, which is why it shipped. But `--zb-switch-target-min` is
the hit area, and Switch's own accessibility note claims the target follows the
density profile. It did not: every switch on every page presented the root
profile's target regardless of the scope it sat in. `--zb-accordion-*` had the
same freeze.

The emitter now re-declares every density-linked component token inside each
profile block, so the reference resolves against that profile. Same specificity
as the profile block a host would write, so the override surface is unchanged.
