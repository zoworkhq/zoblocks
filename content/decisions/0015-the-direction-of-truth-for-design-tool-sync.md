# 0015 — The direction of truth for design-tool sync

**Status:** proposed · 21 August 2026

## Context

A brand reaches production today by a person retyping hex values into the
console. The designer who owns that brand works in Figma and never opens it.
Closing that loop means two systems can write the same values — and two systems
that can both write one token, with no written rule about which wins, is how a
sync feature becomes a permanent source of "why did my colour change back".

This ADR is the rule, and it exists before the code deliberately. The request to
"just also let us set the semantic layer from Figma" will arrive; the answer
should be a document rather than a per-ticket argument.

## Decision

Each tier has one owner. The other side may display it and may propose, never
write.

| Tier                        | Owner   | Direction                  | Why                                                                                                                  |
| --------------------------- | ------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Brand anchor (the 600 step) | Figma   | Figma → console            | A brand decision, held by the designer. One swatch, not eleven.                                                      |
| Ramp steps (50–950)         | Console | Console → Figma            | Derived by `generateRamp` and validated. A per-step override is a proposal; the console decides whether it ships.    |
| Semantic                    | Console | Console → Figma            | The tier the gate measures. If Figma could write it, a palette could reach a file without ever having passed.        |
| Component                   | Console | Console → Figma, opt-in    | Large enough to make a variable panel unusable. Off by default.                                                      |
| Clinical                    | Neither | Console → Figma, read-only | Pushed so a designer can see them, refused on the way back — exactly as the framework bridges treat the same tokens. |

Three consequences worth stating explicitly:

- **Push is one anchor, not a palette.** The plugin sends a proposed brand
  colour and receives a console URL. It cannot publish, and it cannot write
  anything the gate has not measured.
- **Aliases, not flattened hex.** A semantic token that resolves to a ramp step
  is written as a Figma alias to that step. Flattening it renders identically
  and severs the link, so moving the brand stops moving the accent — which is
  the problem a token system exists to prevent, rebuilt inside a design file.
- **Identity is stamped, not named.** Every variable this plugin creates carries
  its Oxygen token name in `setPluginData`. A designer will rename things; the
  label is theirs and the plugin data is the key.

## Consequences

Automated two-way sync stays out of scope until there is a concrete reason for
it. One-way with a per-tier owner is a feature; two-way without one is a way for
both sides to end up wrong and for neither to be able to say which is right.

This rule inherits an unanswered question. **ADR 0013 asks whether a customer
may override clinical status colours and is still `proposed`.** The clinical row
above assumes today's answer — no. If that changes, the plugin's refusal path
becomes a re-validation path, which is a different feature with different tests.
That question has to be settled before the pull direction is built, not after.

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
  `@oxygenui-design/theme/src/ramp.ts`, whose only import is that validator — so
  it is pure and could move, but `theme` also carries the document schema, zod
  and both framework bridges. Making a plugin sandbox depend on all of that for
  one suggestion is the wrong trade. Moving `ramp.ts` into the token package is
  the right fix and has one call site outside its own tests.

Unchanged and confirmed: 19 clinical semantic tokens, 11 ramp steps, 3 themes,
zero `node:*` imports in the validator, and `importDtcg` returning
`{ matched, unmatched, discardedClinical }`.
