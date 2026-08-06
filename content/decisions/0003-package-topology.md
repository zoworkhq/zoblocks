# 0003 — Domain-scoped packages, not one package per component

**Status:** proposed · 6 August 2026

## Context

At 500+ components the packaging granularity determines install ergonomics,
version hygiene, tree-shaking, and where the commercial boundary can sit. The
choice is effectively made once; changing it later renames every import in every
customer codebase.

Three shapes were considered.

## Decision

**Roughly fifteen domain-scoped packages, each with per-component subpath
exports.**

```
L0  @oxygenui/tokens  @oxygenui/fhir  @oxygenui/intl  @oxygenui/utils
L1  @oxygenui/primitives  @oxygenui/system
L2  @oxygenui/react  @oxygenui/icons  @oxygenui/pro-charts
    @oxygenui/pro-forms  @oxygenui/pro-scheduling
L3  @oxygenui/blocks  @oxygenui/pro-blocks
—   @oxygenui/codemod  @oxygenui/cli
```

Supporting decisions:

1. **ESM only**, `sideEffects: false` except CSS, with an `exports` map
   providing both a root barrel and `./<component>` subpaths. Tree-shaking is a
   property of the module format and the exports map, not of package count.

2. **Barrels are generated**, so they cannot go stale or drift in ordering.

3. **Layer direction is enforced** by `import/no-restricted-paths` and a
   `dependency-cruiser` check, not by convention.

4. **Bundle budgets** via `size-limit` per subpath and per barrel, failing CI on
   regression, because "tree-shaking works" is a claim that decays silently.

## Consequences

**Good.** A customer installs two or three packages, not forty. Release notes
are scoped to a domain the reader cares about. The free/Pro boundary is a
package boundary — the simplest kind to enforce and to explain. Shared internals
like `StatusBadge` exist once, in one version, with no resolution risk.

**Costs.** A patch to any component bumps its whole package's version, so
changelogs carry entries a given consumer may not care about. Package boundaries
must be chosen well early, since moving a component between packages is a
breaking change for its importers — mitigated by keeping domains broad and
few.

**Rejected: one package per component (500 packages).** Precise versioning, but
the shared-internals graph is disqualifying. `StatusBadge` is imported across
most of the catalog; per-component packaging means either every package inlines
a copy of it, or several hundred packages depend on `@oxygenui/status-badge` and
every consumer resolves version skew across them. Radix consolidated away from
this shape for the same reason. The operational cost — 500 manifests, 500
changelogs, a publish step that takes an hour — compounds it.

**Rejected: a single `@oxygenui/react`.** One version for everything means a
scheduling fix bumps the patient banner, every release note is mostly noise, and
there is no seam to place the commercial boundary on. It also removes any
ability to let a Pro pack move at a different cadence from the free core.
