# 0006 — Stability tiers gate the export path; deprecation is a sequence

**Status:** accepted · 6 August 2026

> **Ratified 16 August 2026.** Stability tiers drive the catalog quality gate, which is armed: `pnpm gen --strict` runs in CI and in the release workflow.

## Context

A library aiming to be maintained for a decade has two failure modes at
opposite ends.

Freeze too early and every experiment becomes a permanent public API — the
library accumulates components nobody uses and cannot remove, and semver becomes
a straitjacket that discourages shipping anything new.

Freeze too late and semver becomes dishonest. Minor releases break builds,
enterprise customers stop upgrading, and the library forks into whatever version
each customer pinned. In healthcare that is worse than usual: a customer stuck
on an old minor is a customer not receiving clinical display fixes.

Neither is solved by a policy document. It has to be structural.

## Decision

**`status` in a component's metadata determines its export path, and therefore
what semver promises about it.**

| Status         | Export path                    | Breaking-change policy                       |
| -------------- | ------------------------------ | -------------------------------------------- |
| `experimental` | `@zoblocks/react/experimental` | may break in any minor                       |
| `beta`         | main barrel, flagged in docs   | may break in a minor, noted in the changeset |
| `stable`       | main barrel                    | breaks only in a major                       |
| `deprecated`   | main barrel, dev-time warning  | removed in the next major                    |

Routing experimental work through a separate export path is the mechanism. A
consumer importing from `/experimental` has opted in explicitly, so breaking it
does not make the package's semver a lie.

**Deprecation is a sequence, not an announcement:**

1. `status: "deprecated"` with `deprecatedIn`, `removeIn`, and `replacement` in
   the metadata.
2. A development-only `console.warn` naming the replacement, stripped from
   production builds.
3. A codemod shipped in `@zoblocks/codemod` **in the same release** as the
   deprecation, not later.
4. Minimum two minor versions of overlap.
5. Removal in the next major, listed in the migration guide.

**Enforcement:** `api-extractor` writes a committed API report per package. Any
change to the public surface appears as a diff in the pull request. Accidental
breakage is caught at review time rather than in a customer's build.

**Support window:** N−1 major receives security fixes for 12 months.

## Consequences

**Good.** New components can ship without freezing their API. Semver means what
it says, so enterprise customers can upgrade minors without a regression sweep —
which is the actual goal. Deprecations arrive with the migration already
written, so upgrading is mechanical. The support window is answered once in a
document rather than per procurement conversation.

**Costs.** A second export path to build, test, and document. The API report is
a file that must be regenerated and reviewed, and reviewers must learn to
actually read it rather than approving the diff reflexively. Promoting a
component from experimental to stable is a deliberate step someone has to
remember to take — surfaced by a report of components that have been
experimental for more than two minors.

**Rejected: a policy document without structure.** Everyone writes one; it is
followed until the first deadline.

**Rejected: `0.x` forever to avoid the question.** It works until the first
enterprise procurement review, which reads a `0.x` version as "not production
ready" regardless of what the maintainers intend by it.
