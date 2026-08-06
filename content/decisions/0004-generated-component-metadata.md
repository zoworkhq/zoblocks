# 0004 — Component metadata is colocated and everything shared is generated

**Status:** proposed · 6 August 2026

## Context

Adding a component today edits five shared files:

| File                                      | Work per component               |
| ----------------------------------------- | -------------------------------- |
| `registry.json`                           | hand-written entry               |
| `apps/docs/src/lib/catalog.ts`            | ~70 hand-written lines           |
| `tsconfig.json` `paths`                   | one mapping per shared component |
| `apps/docs/src/app/globals.css` `@source` | one entry per new directory      |
| `apps/docs/src/app/page.tsx`              | catalog listing                  |

Each carries a comment reminding the next author. At 24 components that is
sound. At 500 it is a merge-conflict generator worked on by every contributor,
and `catalog.ts` alone projects to roughly 35,000 lines.

Two of the five fail _silently_. A missing `@source` entry produces a component
that typechecks and renders completely unstyled — the README documents this as a
known way to break a component. A rule that is enforced by a comment is not
enforced.

Separately, `catalog.ts` restates each component's props in prose. Nothing
checks the restatement against the implementation. Prop tables are read as
contracts, so documentation that has silently drifted is worse than no
documentation.

## Decision

**One metadata file per component, colocated with it. Every shared artifact is
generated.**

1. `<component>.meta.ts` exports a typed, schema-validated object: name, title,
   tier, status, categories, FHIR resources, states rendered, accessibility
   notes, guidance, limitations, related components.

2. **Props are never written by hand.** They are extracted from the component's
   TypeScript types with `react-docgen-typescript`. The type is the single
   statement of the contract.

3. `pnpm gen` produces `registry.json`, `public/r/*.json`, the docs catalog and
   navigation, tsconfig paths, the Tailwind `@source` list, package barrels and
   `exports` maps, `llms.txt`, an MCP manifest, and the coverage manifest.

4. Generated files carry a header banner and are verified in CI with
   `gen --check`, which fails when the working tree differs from generator
   output. Drift becomes a build failure rather than a review burden.

5. `pnpm gen:component` scaffolds the directory, so the layout is uniform by
   construction rather than by discipline.

## Consequences

**Good.** Adding a component touches exactly one directory. The silent-failure
modes — unstyled components, missing path mappings — become structurally
impossible. Prop documentation cannot drift from the implementation. Tooling can
operate over the whole catalog uniformly, which is what makes the coverage gate
in [0007](0007-story-derived-testing.md) and the Pro boundary check in
[0002](0002-dual-channel-distribution.md) possible at all.

**Costs.** A generator is infrastructure that must itself be maintained and
tested; a bug in it affects every component at once. Contributors must run
`pnpm gen` before committing, which is a new step to learn — mitigated by the
`--check` failure naming the exact command to run. Generated files in version
control produce large, noisy diffs; they are marked `linguist-generated` so
review tooling collapses them.

**Rejected: keeping metadata in the docs app.** It is where the data is consumed,
but colocation is what makes a component directory self-contained and therefore
movable, scaffoldable, and independently reviewable.

**Rejected: extracting everything from source with no metadata file.** Guidance,
limitations, and clinical rationale are the parts carrying the product's actual
value. They cannot be derived from types, and they should not be squeezed into
JSDoc where they are hard to review and impossible to schema-validate.
