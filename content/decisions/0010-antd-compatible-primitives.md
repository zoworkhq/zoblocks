# 0010 — Primitives are antd-compatible and antd-free

**Status:** accepted · 16 August 2026

> **Relates to:** [0002](0002-dual-channel-distribution.md) (dual-channel
> distribution), [0009](0009-supply-chain-and-component-constraints.md)
> (dependency policy)

## Context

Zoblocks follows Ant Design. That was stated as a standing constraint on every
new component, and `@zoblocks/signature` acted on it directly: it wraps
antd, with antd as a peer dependency.

The note on that decision was explicit that it was a pilot, not a precedent:

> Before starting another antd-dependent component, revisit whether the
> registry channel survives — wrapping ends copy-as-source distribution for
> anything that takes it.

`Switch` is that component, and it forces the question harder than Signature
did, because a switch is a **primitive**. Whatever it depends on, every form
component that contains one inherits.

Three things make the wrap/own choice concrete here rather than philosophical.

**1. The extension is not expressible as a wrapper.** antd's `checked` is
`boolean`. Zoblocks's Switch has a third value — `"unknown"`, carrying a FHIR
`dataAbsentReason` — because a binary control cannot distinguish "no" from
"nobody asked", and that distinction is the component's main clinical
contribution. Adding a third value to a wrapped control means shadowing the
prop and reimplementing the rendering, at which point the dependency is being
paid for and routed around. The same is true of the commit phase machine, which
must render a value that is neither the prop nor the server's.

**2. There is no expensive behaviour to inherit.** Signature wraps antd because
Modal's focus trap and Tabs' ARIA wiring are genuinely hard to rebuild well,
and rebuilding them badly would have undermined a component whose whole argument
is accessibility. `rc-switch` is a button with `aria-checked` and two key
handlers. Nothing there is worth a peer dependency.

**3. A primitive spreads its dependencies.** Wrapping here would put antd in the
graph of every future form component, which ends copy-source distribution for
the entire form family — the channel ADR 0002 deliberately preserved, and the
one the README leads with for a healthcare buyer who must read what renders a
consent flag before trusting it.

## Decision

**Primitives match Ant Design's public API exactly and take no dependency on
it. Compound clinical organisms may wrap antd, and each one must name the
expensive behaviour it is inheriting.**

Concretely:

1. **A primitive** — a control with no clinical payload of its own: Switch,
   Checkbox, Radio, Input, Select — is implemented in this repository. Its prop
   names, shapes, defaults and form-control contract match antd's, so that

   ```diff
   - import { Switch } from "antd";
   + import { Switch } from "@zoblocks/react";
   ```

   is the entire migration. Divergences are permitted only where antd's
   behaviour is a defect, and each one is listed in the component's metadata
   under `limitations` and in its docs page.

2. **A compound clinical organism** — Signature, and anything else that
   assembles modals, tabs, uploads or overlays around a clinical workflow — may
   take antd as a peer dependency. The ADR or the component's `rationale` must
   name the specific antd behaviour being inherited and why reimplementing it
   would be worse. "It is consistent" is not that reason; "Modal's focus trap
   and Tabs' `aria-controls` wiring" is.

3. **Compatibility is tested, not asserted.** Each antd-compatible primitive
   carries a props-parity table in its test suite. A rename in an antd major
   fails our build rather than a customer's.

4. **An optional bridge, never a dependency.** `@zoblocks/react` may
   ship an `antd-bridge` subpath that reads `theme.useToken()` and writes the
   `--zb-<component>-*` tokens, so an antd application gets Zoblocks's behaviour
   in its own brand. antd is imported only by that subpath, so it stays out of
   the main module graph and out of every bundle that does not ask for it.

## Consequences

**Good.** The registry channel survives for the entire form family — the
components a buyer is most likely to read line by line. The `"unknown"` value,
the seven-phase commit machine, `confirm="hold" | "countersign"`, and the
`segmented` appearance that switches ARIA role are all implementable, and none
of them are expressible over `rc-switch`. No new runtime dependency means no
version matrix and no v5/v6 rename audit on the primitive tier. Bundle cost is
ours to control rather than inherited.

**Costs.** We own the accessibility of every primitive outright, including the
parts antd would have given us for free — keyboard handling, focus management,
form-control integration. The compatibility promise has to be actively
maintained: a props-parity table per component, re-verified on each antd major.
And there are now two rules in the codebase rather than one, so a reviewer must
classify a new component as primitive or organism before reviewing it. The
boundary is: **does it own a clinical concept, or is it a control?**

**Rejected: wrap antd everywhere.** Consistent, and it forecloses the third
state, the phase machine, and the registry channel simultaneously. The cost is
not the dependency; it is that the component becomes a skin over a control whose
value model is wrong for the domain.

**Rejected: ignore antd entirely.** Discards a real migration story. Healthcare
teams building on antd are exactly the buyer, and "change the import" is a
materially different sales conversation from "rewrite your forms".

**Rejected: fork `rc-switch`.** Inherits the maintenance without the upgrades,
and the forked code would need the same three extensions anyway.
