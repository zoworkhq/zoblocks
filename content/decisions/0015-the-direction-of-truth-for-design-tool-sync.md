# 0015 — The direction of truth for design-tool sync

**Status:** accepted · 21 August 2026

## Context

A brand reaches production today by a person retyping hex values into the
app. The designer who owns that brand works in Figma and never opens it.
Closing that loop means two systems can write the same values — and two systems
that can both write one token, with no written rule about which wins, is how a
sync feature becomes a permanent source of "why did my colour change back".

This ADR is the rule, and it exists before the code deliberately. The request to
"just also let us set the semantic layer from Figma" will arrive; the answer
should be a document rather than a per-ticket argument.

## Decision

Each tier has one owner. The other side may display it and may propose, never
write.

| Tier                        | Owner   | Direction              | Why                                                                                                                  |
| --------------------------- | ------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Brand anchor (the 600 step) | Figma   | Figma → app            | A brand decision, held by the designer. One swatch, not eleven.                                                      |
| Ramp steps (50–950)         | App     | App → Figma            | Derived by `generateRamp` and validated. A per-step override is a proposal; the app decides whether it ships.        |
| Semantic                    | App     | App → Figma            | The tier the gate measures. If Figma could write it, a palette could reach a file without ever having passed.        |
| Component                   | App     | App → Figma, opt-in    | Large enough to make a variable panel unusable. Off by default.                                                      |
| Clinical                    | Neither | App → Figma, read-only | Pushed so a designer can see them, refused on the way back — exactly as the framework bridges treat the same tokens. |

Three consequences worth stating explicitly:

- **Push is one anchor, not a palette.** The plugin sends a proposed brand
  colour and receives an app URL. It cannot publish, and it cannot write
  anything the gate has not measured.
- **Aliases, not flattened hex.** A semantic token that resolves to a ramp step
  is written as a Figma alias to that step. Flattening it renders identically
  and severs the link, so moving the brand stops moving the accent — which is
  the problem a token system exists to prevent, rebuilt inside a design file.
- **Identity is stamped, not named.** Every variable this plugin creates carries
  its ZoBlocks token name in `setPluginData`. A designer will rename things; the
  label is theirs and the plugin data is the key.

## Distribution, and the plan the REST API needs

Two facts the plan asked to confirm before building. Both were checked against
Figma's own documentation on 21 August rather than assumed, and both change
something.

**The REST Variables API is Enterprise-only, and needs a Full seat.** It is not
available as an add-on to Professional or Organization teams. The Plugin API's
variables access carries no such restriction — which is the entire reason
phases 1 to 5 were ordered not to touch REST, and that ordering is now
vindicated rather than lucky. The consequence is narrow and worth stating
plainly: **everything through push works on any plan; automated sync is
reachable only for customers already on Enterprise.** Automation is therefore a
feature for a subset, and should be sold as one.

**Distribution: private to our own organisation first, Community when the
app is customer-facing.** Private publishing skips Figma's review entirely;
Community takes up to two weeks. But the fact that decides this is a different
one: _private_ means private to the **publisher's** organisation, so a privately
published plugin does not reach a customer's designers at all. It reaches ours.

That makes distribution a consequence of
[0013](0013-open-questions-for-product.md) question 3 rather than an independent
choice. The app is customer-facing _staged_, run internally first with our
own team authoring real themes on customers' behalf — and the plugin belongs in
exactly the same stage. Private now costs nothing, because the plugin's audience
during that stage is us. Community publishing arrives with the login page.

Going private first also forecloses nothing: converting a private plugin to a
public one requires the review it would have needed anyway.

## Code Connect and automated sync are not being built

Decided on 21 August, and recorded here rather than left as an unstarted item,
because the reason is not "we ran out of time".

**Code Connect maps Figma components to real React exports.** It could be
generated from `component-meta`, which is already the source every other
artefact derives from, so the engineering is a day. What it maps _to_ is a
maintained Figma component library, and there is no library and no named owner
for one. Generating mappings to components that do not exist produces a Dev Mode
panel that confidently shows the wrong import — worse than the blank one it
replaces, because a developer will believe it.

_Build it when:_ somebody owns a Figma component library and has kept it current
for a release cycle. Not before, and not as part of a sprint that also has to
create the library.

**Automated sync removes the human step from the pull direction.** It needs the
REST Variables API, which is Enterprise plan and Full seat, and webhooks. So
even built, it would work for a subset of customers — and the one-way rule this
ADR sets means what it automates is the _console to Figma_ leg, which is the leg
a designer can already run in two clicks.

_Build it when:_ a customer on Enterprise asks, having used the manual pull
enough to be tired of it. That order matters. Automating a step nobody has found
tedious is how a sync feature acquires a schedule, a failure mode and an on-call
rotation before it has a user.

## Consequences

Automated two-way sync stays out of scope until there is a concrete reason for
it. One-way with a per-tier owner is a feature; two-way without one is a way for
both sides to end up wrong and for neither to be able to say which is right.

**ADR 0013's clinical question is now answered: no.** It was accepted on the
same day as this record, so the clinical row above is a decision rather than an
assumption, and the pull direction can be built against it. What that buys
concretely: a designer who edits a clinical variable and pulls again has it
restored, with the reason in the variable's own description — a refusal path,
not a re-validation path.

The conditions under which that answer should be reopened are written in 0013
beside the answer itself, deliberately, so that reopening it is a decision made
against stated criteria rather than in a deal review.

## What was verified, and three corrections to the plan this came from

The counts in the original integration plan were checked against the working
tree on 21 August. Three were wrong, and one of them changes the mapping:

- **Semantic tokens: 59, not 62.** Counted from `source.semantic.light`.
- **Component tokens: 169, not 282.** The 282 figure is `TOKEN_SURFACE`, which
  is the _surface manifest_ — every custom property a consumer may set. Only 169
  of those exist in the DTCG component tier with a value to push; the remaining
  113 are declared in stylesheets and have no value a theme holds. **A Figma
  component collection can only carry the 169.** Pushing the rest would mean
  inventing values for properties that deliberately have none.
- **`nearestPassing` is not in the validator.** It lives in
  `@zoblocks/theme/src/ramp.ts`, whose only import is that validator — so
  it is pure and could move, but `theme` also carries the document schema, zod
  and both framework bridges. Making a plugin sandbox depend on all of that for
  one suggestion is the wrong trade. Moving `ramp.ts` into the token package is
  the right fix and has one call site outside its own tests.

Unchanged and confirmed: 19 clinical semantic tokens, 11 ramp steps, 3 themes,
zero `node:*` imports in the validator, and `importDtcg` returning
`{ matched, unmatched, discardedClinical }`.
