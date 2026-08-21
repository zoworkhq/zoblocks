# 0013 — Four questions the engineering work cannot answer

**Status:** accepted · 21 August 2026

> **Relates to:** [0002](0002-dual-channel-distribution.md) (dual-channel
> distribution), [0010](0010-antd-compatible-primitives.md) (antd-compatible
> primitives), [0012](0012-token-surface-is-a-contract.md) (the token surface
> is a contract)

## Context

The theme-bridge architecture and the customer theme app are built and
green. Four questions came up during that work that are **not** engineering
decisions, and answering them by writing code would have been answering them by
stealth.

Each was recorded here with the position the implementation takes, so that
position is visible and reversible rather than accidental.

**All four are now decided, on 21 August 2026, in favour of the recommendation
each already carried.** Nothing in the code changed as a result — which is the
outcome to expect when the recommendations were written by the people who
built the thing, and is also why this ADR was worth writing rather than
assuming. The value was never in the answer being surprising; it was in the
position being written down somewhere it can be argued with.

The decision was delegated rather than deliberated at length, and the four
answers are not equally cheap to revisit. Three are reversible in about a week
each. **Question 1 is not**, and the conditions under which it should be
reopened are stated in its own section rather than left to judgement in the
moment.

---

## 1. May a customer override clinical status colours?

> **Decided: no.** Clinical colours stay fixed. The Figma plugin pushes them so
> a designer can see them, carries the reason in the variable's own description,
> and refuses them on the way back — the same treatment the framework bridges
> give the same tokens.

**Current implementation: no.** `--ox-status-*` and `--ox-flag-*` are marked
`bridgeable: false` in the generated surface, the theme emitter is structurally
incapable of writing them, a bridge that tries throws, and the app renders
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

**What would make reopening this legitimate.** Not a customer asking — a
customer will ask. Two things would: a customer whose product genuinely does not
display clinical results, where the tokens carry no signal to remove and the
right fix is a build that omits the clinical tier rather than a theme that
overrides it; or a regulator or house style that mandates specific status
colours, where the floors can be re-measured against _their_ values and the
answer is a validated exception rather than an unlocked field. Both are
narrower than "may a customer override clinical colours", and both are the
question worth answering instead.

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

> **Decided: a commitment, with a ceiling.** MUI is supported — documented, in
> the version matrix, and answered for. The ceiling is the operative half: a
> third framework bridge needs a named customer behind it before it is written,
> not after. The reason to write that down now is that the marginal bridge
> always looks cheap in the week somebody asks for it.

## 3. Is the app a product surface or an internal tool?

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

> **Decided: customer-facing, staged — internal first.** The staging is not
> hedging; it is what makes the stylesheet commitment safe to make. Authoring
> real customer themes on their behalf exercises validation and delivery against
> real palettes while an outage is still our problem rather than theirs.
>
> This decision now has a dependent. The Figma plugin's distribution follows it
> directly, and the reasoning is in
> [0015](0015-the-direction-of-truth-for-design-tool-sync.md): a plugin
> published privately is private to _our_ organisation, so it reaches customers
> only once the app does.

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

> **Decided: accept it for these two, and treat two as the ceiling.** A third
> component wanting to wrap antd is not a third exception; it is the trigger for
> the overlay-primitives project. Naming the number is the whole point — "we
> allow a few" has no edge, and a rule with no edge is a rule that has already
> been crossed.

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

**Accepted 21 August 2026.** Every position is the one the implementation
already took, so no code changed on acceptance. What changed is that four
defaults became four decisions, each with the conditions for reopening it
written beside it.

**Two of the four now carry a stated ceiling** — one more framework bridge, one
more antd-wrapping component — and a ceiling is only worth writing if it is
enforced when somebody has a good reason to cross it. That is the point at which
this file is either useful or decorative.
