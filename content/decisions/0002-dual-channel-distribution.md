# 0002 — npm is the source of truth; the registry is generated from it

**Status:** proposed · 6 August 2026
**Supersedes part of:** the distribution assumption implicit in [0001](0001-fhir-typed-props.md)

## Context

Oxygen ships today through a shadcn registry: the CLI copies component source
into the customer's repository. The README sells this deliberately — "yours to
read, audit, and change" — and for a healthcare buyer who must review what
renders a potassium result, that auditability is a genuine feature.

It also means there is no channel back to the customer.

Once `clinical-value.tsx` is written into their repo, we cannot patch it. If the
comparator handling turns out to drop a `<` in some locale, every customer who
installed it renders `0.01` where the lab said `<0.01` — "detected at 0.01"
instead of "undetectable" — and no release we publish reaches them. Not a patch,
not a security advisory, not a codemod.

That is in direct conflict with four stated platform requirements: versioning,
backward compatibility, migration paths, and deprecation strategy. None of them
are implementable over copy-source. It also conflicts with the roadmap's premise
of free and Pro **npm packages**.

A second, quieter cost: because registry source is written with consumer-shaped
specifiers (`@/lib/utils`, `@/components/oxygen/status-badge`), the root
`tsconfig.json` must map each one backwards so the repo typechecks. That file
carries the comment *"Add a mapping for every shared registry component the
catalog grows."* It is an O(n) manual step that exists solely because the import
direction is inverted.

## Decision

**npm is the source of truth. The registry is a generated projection of it.**

1. Component source lives in npm packages under `packages/`, written with real
   package specifiers (`import { cn } from "@oxygenui/utils"`). It typechecks
   natively; no path mapping.

2. The registry generator emits copy-source output from those same files,
   **rewriting specifiers** to the `@/` form the shadcn CLI expects. The rewrite
   is one function with a test table, replacing a hand-maintained map that grows
   with the catalog.

3. Both channels ship from every release. Neither is a hand-maintained parallel
   copy of the other.

4. The docs state plainly that installing from the registry means forgoing
   updates — the customer has forked, deliberately, and that is a supported
   choice rather than an unadvertised consequence.

5. `tier` in each component's metadata routes distribution: free items to public
   npm and the public CDN; Pro items to a private npm channel and an
   authenticated registry endpoint. CI fails if a `pro` item appears in public
   registry output.

## Consequences

**Good.** Semver, patches, security fixes, deprecation warnings, and codemods
become possible for the first time. The copy-source promise is kept intact for
customers who want it. The root tsconfig path map and its manual step disappear.
There is a real seam for the free/Pro boundary — one that a business model can
sit on, which copy-source alone cannot support.

**Costs.** Two distribution channels to test and release, and the specifier
rewrite is a real piece of machinery that must be correct — a bad rewrite
produces components that install and fail to compile in the customer's project.
It is covered by a snapshot test over the full catalog. Registry-channel
customers still get no updates; that limitation is inherent and is now disclosed
rather than implied.

**Rejected: registry only.** It is the status quo, and it makes four of the
platform's stated requirements permanently unimplementable. It also caps the
commercial model, since a copy-source item has no renewal logic.

**Rejected: npm only.** It discards a differentiator that the product currently
leads with, and abandons the shadcn ecosystem's distribution and agent-tooling
advantages for no gain — the two channels are the same build.

**Noted, not solved: Pro source is redistributable.** Any copy-source Pro item
can be republished by a customer. Obfuscation is not worth attempting. What is
sold is updates, support, and the clinical review behind the components; pricing
and messaging follow that, not access control.
