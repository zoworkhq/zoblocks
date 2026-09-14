---
"@zoblocks/bridge-antd": patch
"@zoblocks/bridge-core": patch
"@zoblocks/bridge-mui": patch
"@zoblocks/codemod": patch
"@zoblocks/figma-core": patch
"@zoblocks/host-react": patch
"@zoblocks/recorder-core": patch
"@zoblocks/theme": patch
---

These packages now import in plain Node. Their built files used imports without
a `.js` extension, which only a bundler resolves.

`host-react` no longer ships its test files. `figma-core` now ships type
declarations and a license.
