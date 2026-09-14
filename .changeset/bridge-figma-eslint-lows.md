---
"@zoblocks/bridge-antd": minor
"@zoblocks/bridge-mui": minor
"@zoblocks/bridge-core": patch
"@zoblocks/elements": patch
"@zoblocks/recorder-core": patch
---

`useZoBlocksTokens` re-reads when a stylesheet is added to `<head>` or a `<link>` finishes loading, and an inline `fallback` no longer rebuilds its observer each render. `<zb-switch>` drops `aria-label` when `label` is cleared. The recorder signal reads only the analyser's `fftSize` samples, so a smaller analyser can reach silence.

`ZoBlocksAntdProvider` and `ZoBlocksMuiProvider` take an optional `scope` ref. Pass it when the brand is set on a wrapper rather than on `<html>`.
