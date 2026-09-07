---
"@zoblocks/host-react": minor
---

`@zoblocks/host-react` — the chrome an application puts around a clinical
component, resolved from whichever UI framework the host runs, so one demo
source renders under Ant Design, Material UI, or neither.

Zoblocks ships 28 components and none of them is a Button. That is ADR 0010
working as intended — primitives match Ant Design's public API and take no
dependency on it, which is what keeps copy-as-source distribution open for the
whole form family — but it leaves a real gap when the question is "does this
look like the rest of our app". Answering it honestly means rendering the
customer's framework's real controls beside ours, not restyling a Button we do
not have.

- **Six primitives** — Button, Input, Switch, Checkbox, Select, Tabs — behind
  one context. Props are antd's, so the antd adapter is a pass-through and only
  the MUI adapter translates; every conversion it makes is named in `mui.tsx`.
- **Real libraries, not reproductions.** The MUI adapter never sets
  `disableRipple`, and a test asserts `.MuiTouchRipple-root` appears on
  interaction — a copy cannot pass it.
- **The frameworks stay behind subpath exports.** The root entry imports
  neither, so a consumer resolves antd or MUI only by mounting one. Measured:
  antd's seven components with `ConfigProvider` are 142 KB gzipped, MUI's 76 KB.
- **Clinical colours are still refused.** Each host mounts its token bridge, and
  `bridge-core` throws if one ever writes `--zb-status-*`.

Two normalisations worth knowing: antd calls `Switch.onChange(checked, event)`
and the contract promises one argument, so the adapter drops the second; and
antd v6 narrowed `cssVar` to an object, so it is no longer passed at all.

A `dependency-cruiser` rule, `host-react-stays-at-composition`, fails the build
if any package or registry item imports this. That is the whole safety of the
arrangement: the day a component reaches for it, ADR 0010 is gone.
