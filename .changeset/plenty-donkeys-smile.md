---
"@zoblocks/react": minor
"@zoblocks/tokens": minor
---

Add `Switch`, `SwitchField` and `SwitchList` — a binary control for a record
that is shared, asynchronous, and often missing the fact you are asking it
about.

Three independent axes rather than one `checked`:

- **value** — `true`, `false`, or `"unknown"` with a FHIR-shaped
  `absentReason`, so "off" and "nobody asked" stop being the same pixel.
- **phase** — `idle · pending · committed · reverted · blocked · queued ·
stale`. Return a promise from `onCommit` and the component owns the whole
  machine, including the animated rollback and the assertive announcement that
  names what the value now holds.
- **availability** — `readOnly` with a `lockedReason` that stays in the tab
  order, rather than a `disabled` control that tells a screen-reader user
  nothing.

Also ships `useCommitPhase()` as a standalone export, five appearances
(`switch`, `labeled`, `segmented`, `chip`, `row` — `segmented` renders a
radiogroup, because two visible answers are not a switch), four sizes down to
a 26×14px `micro` that keeps a full-size hit area, `tone` so a suppression does
not read as brand-affirmative green, `until` for an on-state that is not
forever, and `confirm="hold" | "dialog" | "attest" | "countersign"`.

The API matches Ant Design's Switch and takes no dependency on it, so
`import { Switch } from "antd"` becomes `from "@zoblocks/react"` with no
other diff. One deliberate divergence: `loading` maps to `phase="pending"` and
does not disable the control. See ADR 0010.

Tokens: adds the `--zb-switch-*` component group, including `target-min`, which
decouples the hit area from the pill so density can shrink one without the
other.
