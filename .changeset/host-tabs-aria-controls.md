---
"@zoblocks/host-react": patch
---

The ZoBlocks host `Tabs` sets `aria-controls` only on the selected tab, and only when its panel is rendered. It used to point every tab at a panel that was never in the page, which is invalid ARIA.
