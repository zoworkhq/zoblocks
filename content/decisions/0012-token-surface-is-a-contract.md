# 0012 — The component token surface is a public contract

**Status:** accepted · 19 August 2026

> **Relates to:** [0005](0005-three-tier-token-pipeline.md) (three-tier token
> pipeline), [0009](0009-supply-chain-and-component-constraints.md) (dependency
> policy), [0010](0010-antd-compatible-primitives.md) (antd-compatible
> primitives)

## Context

Management asked for Ant Design as a supported UI framework, an architecture
that admits Material UI later, and a way for enterprise customers to apply
their own design language. The obvious reading is an adapter layer: an abstract
component API with one implementation per framework.

That reading is wrong here, and [ADR 0010](0010-antd-compatible-primitives.md)
already contains the argument. An interface satisfiable by both antd and MUI
collapses to what they share, and what they share does not include the third
`Switch` value carrying a FHIR `dataAbsentReason`, or the commit phase machine,
or the absence taxonomy. Those are the product.

The seam that does work is already in the repository and was never named.
Component stylesheets resolve every value through an ordered chain:

```css
--zb-tabs-accent: var(--zb-accent, var(--ant-color-primary, #059478));
```

Read left to right: our token if the host set one, otherwise the host
framework's, otherwise a literal that passed the contrast gate. There are 145
such declarations across four shipped stylesheets, plus a working JavaScript
bridge at `@zoblocks/tabs/antd` that reads `theme.useToken()` and writes
the same properties. Three of the four layers of a pluggable theming
architecture existed; what was missing was a name and an enforcement mechanism.

Two consequences of leaving it unnamed showed up immediately when the surface
was first generated:

- **Seven component tokens referenced tokens that do not exist.** `--zb-fg`,
  `--zb-fg-muted`, `--zb-fg-subtle`, `--zb-rule` and `--zb-status-accent` are
  plausible, consistent with their neighbours, and defined nowhere. The
  affected components render correctly — against antd's colour or the literal —
  and silently never follow a ZoBlocks brand. The docs site masked it by
  defining the invented names in `tabs-gallery.css`.
- **Nothing distinguished a chrome token from a clinical one.** A bridge
  mapping a host's `colorError` onto `--zb-status-critical` would replace a
  colour holding a validated 4.5:1 floor and a 60° hue separation from
  `status.low` with an arbitrary brand red. Nothing in the build could object.

## Decision

**The `--zb-<component>-*` token surface is a published, versioned contract.
It is generated from the source that defines it, and a theme bridge is the only
sanctioned way a UI framework reaches a component.**

Concretely:

1. **The surface is generated, never hand-written.** `pnpm gen` reads the DTCG
   component tier and every component stylesheet and emits
   `@zoblocks/tokens/surface`: one entry per token, carrying its
   component, its semantic fallback, its kind, the host-framework variables
   already in its chain, whether it terminates in a literal, and whether a
   bridge may write it. The manifest is committed, so a change to the contract
   is a reviewable diff rather than a discovery.

2. **Removing or renaming an entry is a breaking change.** Customers style
   against these names.

3. **Every declaration terminates in a literal.** A chain ending in nothing
   renders as nothing on a page that has not loaded the token stylesheet — the
   component does not degrade, it disappears. Enforced by the generator. Seven
   tokens predating the rule are exempted by name; an eighth fails the build,
   and an exemption that becomes unnecessary also fails, so the list cannot
   quietly become permanent.

4. **A `--zb-*` fallback naming a token nothing defines fails the build.** This
   is the defect above, and it is invisible to every other check: valid CSS,
   correct pixels, silent non-participation in the theming system.

5. **Clinical tokens are not bridgeable.** Anything resolving to `status.*` or
   `flag.*` is marked `bridgeable: false`. A host framework's semantic colours
   have passed no contrast gate and carry no hue-separation guarantee. This is
   the same principle the brands README already states for customer palettes —
   _"letting a brand override semantic tokens would let it redefine what
   critical means"_ — applied to frameworks, which are not entitled to more than
   a paying customer is.

6. **The gate is a module, not a build script.** The rules moved from
   `scripts/gen/tokens/validate.ts` to `@zoblocks/tokens/validate`:
   pure functions, no `node:*`, no DOM. The build, a theme app's live
   preview, and a server-side publish gate run identical code. A customer whose
   palette passed in the browser and failed in CI has been told two different
   things about the same colour.

7. **A component declares its framework relationship in metadata.**
   `frameworks: { antd: { policy, inherits, bridge } }`, where `policy` is
   `compatible`, `wrapping`, or `neutral`. ADR 0010 requires a wrapping
   component to name the behaviour it inherits; the schema now refuses one that
   does not, which turns a prose requirement into a build failure.

## Consequences

**Good.** The framework integration layer is one small module per framework
rather than a second implementation of every component, so adding Material UI
is additive and costs no capability. Application code never names a framework,
so switching is changing which bridge is mounted. Both distribution channels
survive, because the coupling lives outside the component. Four classes of
silent failure — dangling references, unterminated chains, clinical tokens
reachable by a bridge, and undeclared framework dependencies — became build
failures, and the first of them was catching real defects on the day it landed.

**Costs.** The surface is now an API with semver obligations, and 282 tokens is
a large surface to have promised. The manifest must be regenerated whenever a
stylesheet changes, which is one more generated file in every relevant diff.
The `bridgeable` rule is conservative: 17 clinical tokens already fall through
to antd's semantic colours in CSS, which the manifest records and this ADR does
not resolve — see the open question below.

**Rejected: an adapter layer with one component implementation per framework.**
The abstraction degrades to the intersection of every supported library, which
deletes the third switch value, the commit machine and the absence taxonomy. It
also ends copy-source distribution for anything routed through it, and doubles
the accessibility surface per component. ADR 0010 reached this conclusion for
antd alone; a second framework only strengthens it.

**Rejected: leaving the fallback chain as a convention.** It was already a
convention, and the convention had seven live defects in it — including in
`tabs`, the component most often held up as the reference implementation.

**Open.** Sixteen tokens are marked unbridgeable while their CSS chain still
falls through to antd's `colorError` / `colorWarning` / `colorSuccess`. For a
tab badge that is defensible; as a general rule it is not. The count is pinned
by a test so it cannot grow while the question is open. Resolving it requires a
product decision about whether a host framework may tint a clinical signal at
all, which is listed for management approval rather than settled here.
