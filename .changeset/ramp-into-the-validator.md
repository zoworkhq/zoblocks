---
"@zoblocks/tokens": minor
"@zoblocks/theme": patch
---

The brand ramp moves into the validator

`ramp.ts` — `generateRamp`, `nearestPassing`, `RAMP_STEPS`, `ANCHOR_STEP` and
the HSL conversions — now lives in `@zoblocks/tokens/validate`, beside
the colour maths it was already importing. `@zoblocks/theme` re-exports
every one of them, so no caller changes.

The move has a cause, and it is the same one that made the validator a package
in the first place. A new fourth caller — a Figma plugin sandbox, running
ZoBlocks's accessibility gate inside a design file — offers a nearest passing
colour per failing pair, exactly as the app's token editor does. Reaching
`nearestPassing` through `theme` would have made that sandbox depend on the
theme document schema, zod and both framework bridges to make one suggestion.

`ramp.ts` was pure the whole time; it was simply in the package that had grown
around it. Its only import was the validator, and its only caller outside its
own tests was the app's new-theme form.

The plugin itself is `@zoblocks/figma-plugin`, private and distributed
through Figma rather than npm. It reads the variables already in an open file,
measures them with this package's own `CONTRAST_PAIRS`, `STATUS_PAIRS` and
floors, and declares no network access — a claim its tests check against its
source rather than against its manifest.
