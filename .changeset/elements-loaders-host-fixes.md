---
"@zoblocks/elements": patch
"@zoblocks/loaders": patch
"@zoblocks/host-react": patch
---

- `@zoblocks/elements`: importing the package on a server (Node, SSR) no longer throws `HTMLElement is not defined`.
- `@zoblocks/loaders`: a loader moved in the DOM while showing now still closes after its minimum duration, and its stall hint still appears. It may stay up to one extra `min-duration` after the move.
- `@zoblocks/host-react`: the ZoBlocks host's `Tabs` now supports arrow keys, Home and End. Arrows move focus; Enter or Space selects, as in the antd and MUI hosts.
