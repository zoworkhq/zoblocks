---
"@oxygenui-design/loaders": minor
---

First release: five healthcare loaders as dependency-free custom elements.

`<ox-pulse-loader>` (an open heart with a rhythm line running through it),
`<ox-rhythm-loader>` (one rhythm strip, swept), `<ox-breath-loader>` (three
rings at a resting breath), `<ox-helix-loader>` (for laboratory surfaces), and
`<ox-infusion-loader>` (the only one that can show real progress).

Each is importable on its own subpath, works in React, Vue, Angular, Svelte or
plain HTML, themes through Oxygen's semantic tokens, and ships a designed
reduced-motion state rather than a paused one. Waits are announced in words:
`role="status"` while indeterminate, `role="progressbar"` with a spoken value
when a percentage is genuinely known.
