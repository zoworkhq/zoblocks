# 0013 — Four questions the engineering work cannot answer

**Status:** proposed · 19 August 2026

> **Relates to:** [0002](0002-dual-channel-distribution.md) (dual-channel
> distribution), [0010](0010-antd-compatible-primitives.md) (antd-compatible
> primitives), [0012](0012-token-surface-is-a-contract.md) (the token surface
> is a contract)

## Context

The theme-bridge architecture and the customer theme console are built and
green. Four questions came up during that work that are **not** engineering
decisions, and answering them by writing code would have been answering them by
stealth.

Each is recorded here with the position the implementation currently takes, so
that position is visible and reversible rather than accidental. **Status is
`proposed` rather than `accepted` deliberately: this ADR is a request for a
decision, not a record of one.** Whoever signs it off should change the status
and delete this paragraph.

Three of the four are reversible in a day. The first is not, and it is the one
worth the most attention.

---

## 1. May a customer override clinical status colours?

**Current implementation: no.** `--ox-status-*` and `--ox-flag-*` are marked
`bridgeable: false` in the generated surface, the theme emitter is structurally
incapable of writing them, a bridge that tries throws, and the console renders
them locked.

**Why the recommendation is no.** What the restriction protects is not the hue.
It is two relationships the token gate measures and nothing else in a customer's
stack would:

- a validated contrast floor against the matching background — 4.5:1, or 7:1 in
  high contrast; and
- more than 60° of hue separation between `status.high` and `status.low`, so
  the _direction_ of an abnormal result survives colour-vision deficiency and
  monochrome print.

A customer who sets both to shades of their corporate blue has not rebranded a
component. They have removed a clinical signal, in a way that renders correctly,
passes every other test, and looks like a successful theme.

**Why it will be challenged.** A large customer with a strong brand team will
ask, and "our design system says all semantic colours are ours" is a coherent
position for a company whose software does not display lab results.

**If the answer becomes yes**, it needs three things and none is free: per-theme
re-validation against the same floors (already possible — the gate takes a
brand), an explicit written acknowledgement captured per organisation, and a
decision about what happens to an existing published theme when the rules
tighten. **Do not answer yes under commercial pressure in a live deal.**

## 2. Is Material UI a commitment or a hedge?

**Current implementation: built.** `@oxygenui-design/bridge-mui` exists, is
tested to the same standard as the antd bridge, and ships in the same release.

**Why it was built with no customer asking.** A second bridge is the only way to
find out whether a token surface derived from Ant Design is genuinely
framework-independent or merely antd-shaped. It answered the question: the gaps
run in _both_ directions — antd has no `contrastText`, MUI has no background or
radius scale — and both write the same core ten tokens. Had the surface been
antd-shaped, MUI would have failed to express the core and antd would have had
no gaps at all.

**What is being asked** is whether MUI is now _supported_ — documented, in the
version matrix, upgraded on their majors, and answered for in a support
contract. Building it cost a week. Supporting it is ongoing.

**Recommendation: ship it, document it as supported, and add further bridges
only with a named customer behind each.** Three bridges maintained well beats
eight maintained by nobody.

## 3. Is the console a product surface or an internal tool?

**Current implementation: built as a product, deployed as neither.** It has
organisations, four roles, an authorisation boundary, per-tenant scoping proven
by test, and an audit trail. It has no SSO, no invitation flow, no audit export,
and no support runbook.

**Recommendation: customer-facing, staged.** Run it internally first with our
own team authoring real customer themes on their behalf. That exercises the
validation and delivery pipeline against real palettes before it carries a login
page, and the gap between the two is small — mostly SSO and invitations.

**What "product surface" adds:** SSO, an invitation and approval flow, audit
export, an availability commitment for the stylesheet endpoint, and a security
review. The endpoint is the part to think hardest about: once a customer's
application links `/t/{org}/{slug}@{v}.css`, our uptime is their page.

## 4. Do `signature` and `copilot` genuinely require Ant Design?

**Current implementation: yes, and now stated.** Both declare antd as a required
peer and name what they inherit in their metadata — ADR 0010 requires a wrapping
component to say what expensive behaviour it is taking, and the schema now
refuses one that does not.

**What is actually being asked** is whether that should remain true. Every
component that wraps antd is a component the copy-source channel cannot carry,
and ADR 0002 keeps that channel deliberately.

**Recommendation: accept it for these two and treat it as the ceiling.**
Signature inherits Modal's focus trap and Upload's file handling; Copilot
inherits Modal focus management and Input's composition handling for dictation.
Both are genuinely expensive to rebuild well, and rebuilding them badly would
undermine components whose argument is accessibility.

If the count ever needs to grow, that is the moment to build Oxygen's own
overlay primitives instead — a real project, and one that should be scheduled
rather than arrived at.

---

## Consequences

**Recorded, so they are decisions rather than defaults.** Each position above is
what the code does today. Someone reading this file in a year can see what was
chosen, what the alternative was, and what it would cost to change — which is
the difference between a decision and an accident.

**One is expensive to reverse.** Question 1 is the only one where saying yes
later is materially harder than saying yes now: published themes exist, and
widening what a theme may contain means deciding what happens to every theme
already live. The other three are a week each.

**This ADR stays `proposed` until someone with the authority signs it.** An
architecture decision record with no decision in it is a memo, and marking it
accepted without that signature would misrepresent the state.
