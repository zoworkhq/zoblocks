---
"@zoblocks/loaders": minor
---

First release: five healthcare loaders as dependency-free custom elements.

`<zb-pulse-loader>` (an open heart with a rhythm line running through it),
`<zb-rhythm-loader>` (one rhythm strip, swept), `<zb-breath-loader>` (three
rings at a resting breath), `<zb-helix-loader>` (for laboratory surfaces), and
`<zb-infusion-loader>` (the only one that can show real progress).

Each is importable on its own subpath, works in React, Vue, Angular, Svelte or
plain HTML, themes through ZoBlocks's semantic tokens, and ships a designed
reduced-motion state rather than a paused one. Waits are announced in words:
`role="status"` while indeterminate, `role="progressbar"` with a spoken value
when a percentage is genuinely known.
