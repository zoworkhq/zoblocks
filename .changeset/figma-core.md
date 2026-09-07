---
"@zoblocks/figma-core": minor
---

ZoBlocks themes as Figma variable plans

A new pure package: it turns a resolved theme into a plan a Figma plugin can
apply, reads variables back as an import report, and diffs the two. No
`figma.*`, no DOM, no network, no `node:*` — asserted by a test over the source
rather than promised in a comment.

That purity is the whole point of the layout. A Figma plugin runs across two
isolated contexts — a sandbox with the Figma API and no networking, and an
iframe with networking and no Figma API — and neither is pleasant to test.
Keeping every rule here means the adapters on either side are thin enough to
have no conditionals worth testing, which is the same discipline that let
`bridge-core` serve both antd and MUI.

Three properties carry the value, and each degrades silently:

- **Aliases, not flattened hex.** A semantic token resolving to a ramp step is
  written as an alias to that step. Flattened, it renders identically and severs
  the link, so moving the brand stops moving the accent — the problem a token
  system exists to prevent, rebuilt inside somebody's design file.
- **Idempotence.** `diffPlan` over an unchanged file reports zero writes.
  Without it every sync churns the file's version history and a designer loses
  the ability to see what actually changed. Values compare as hex, because the
  same colour returns from Figma with rounding applied and float equality would
  report every variable as different.
- **Durable identity.** The ZoBlocks token name is stamped in plugin data; the
  label belongs to the designer. Matching on the label would create a duplicate
  the first time somebody tidies a collection, and claim a variable that was
  never ours.

Clinical tokens are pushed so a designer can see them, carry the reason they
cannot be edited in Figma's own description field, and are refused on the way
back — named in `discardedClinical`, deliberately the shape `importDtcg` already
returns. A theme that has quietly lost a clinical signal renders correctly and
passes every other check, which is what makes it the failure worth reporting.

Accompanied by ADR 0015, `proposed`, which records the per-tier owner and three
corrections to the counts the integration plan was written against.
