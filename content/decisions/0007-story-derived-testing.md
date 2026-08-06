# 0007 — Tests derive from stories; quality is gated at the catalog level

**Status:** proposed · 6 August 2026

## Context

The repository has one test file, covering `@oxygenui/fhir` helpers. No
component has a test. Accessibility is checked by an axe run against the docs
site, which catches page-level violations — its first run found four real ones,
including a contrast failure on the footer's own legal statement — but says
nothing about a component's states.

The brief requires unit, integration, visual regression, accessibility, and
end-to-end testing. Written as five separate obligations per component, that is
2,500 test artifacts at 500 components, and the honest prediction is that
coverage decays as the catalog grows and deadlines arrive.

The second problem is enforcement. Nobody reviews 500 components by hand, so
"every component must have tests" degrades into "most components have tests,
and nobody knows which."

## Decision

**Most test artifacts derive from stories, and the standard is enforced against
the generated catalog rather than per pull request.**

1. **`<component>.stories.tsx` is written once and consumed four ways:** as
   documentation, as the visual-regression fixture, as the accessibility
   fixture, and — through play functions — as the interaction test. Adding a
   state to a component means adding a story, and the other three follow.

2. **The full pyramid:**

   | Level | Tool | Scope |
   | --- | --- | --- |
   | Unit | Vitest + Testing Library | logic and rendering |
   | Interaction | Storybook play functions | keyboard paths, focus, transitions |
   | Accessibility | axe per story | × 2 themes × 3 densities, plus forced-colors |
   | Visual regression | Playwright | every story × theme × density |
   | Type | `expect-type` | public prop contracts |
   | API surface | `api-extractor` | committed report, diffed in review |
   | Bundle | `size-limit` | per subpath and per barrel |
   | E2E | Playwright | docs site and a reference application |

3. **Visual regression must be deterministic.** Frozen time, animation and
   transitions disabled, fonts pinned as local files, browser version pinned,
   fixed-size container. Flaky VRT is the standard failure mode of VRT: the team
   learns to re-approve without looking, and the suite becomes theatre.

4. **The gate is a catalog-level assertion.** CI reads the generated coverage
   manifest and fails if any component marked `stable` lacks a story, lacks a
   test, has an axe violation, or has no VRT baseline. A component that does not
   meet the bar cannot be marked stable — which ties quality to
   [0006](0006-stability-tiers-and-deprecation.md) rather than to reviewer
   attention.

## Consequences

**Good.** Test artifacts scale with component count roughly automatically,
because the marginal cost of a state is one story. Accessibility is verified per
component and per state instead of per page, and forced-colors — where the
"never colour alone" rule actually gets tested — is covered. The quality
standard is a build failure rather than a cultural norm, so it survives
deadlines and new contributors.

**Costs.** Substantial infrastructure before the first component benefits:
Storybook, a VRT baseline store, and CI runners for both. VRT baselines are
binary artifacts that grow with the catalog and need storage and pruning
policy. Story × theme × density multiplies screenshot count quickly — at 500
components this needs sharding and affected-only runs, budgeted for from the
start rather than discovered when CI takes forty minutes.

**Rejected: separate test files for each concern.** Five obligations per
component that decay independently. The library ends up with unit tests and
nothing else, because unit tests are the cheapest and everything else slips.

**Rejected: page-level accessibility only.** It is what exists now. It cannot
see a component's error state, its restricted-record state, or its
forced-colors rendering — which is exactly where this library's claims live.
