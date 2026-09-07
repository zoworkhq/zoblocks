# 0016 — The installer is ours

**Status:** accepted · 21 August 2026

> **Supersedes part of:** the delivery mechanism assumed by
> [0002](0002-dual-channel-distribution.md). That record's decision — npm is the
> source of truth, the registry is a generated projection — stands unchanged.
> What changes is the tool on the other end of the registry.

## Context

The registry channel worked, and every customer-facing surface described it in
somebody else's words. The console's Access tokens page called a token "a key
for the shadcn CLI". The docs homepage explained that `@zoblocks` is "a shadcn
registry namespace" that a reader must add to `components.json`. The install
command on every one of the 24 component pages began `pnpm dlx shadcn@latest`.

That is a real cost in three places, in increasing order of seriousness.

**Positioning.** A healthcare buyer evaluating a clinical component library is
told, at the moment of installation, that the delivery mechanism belongs to
another project. The first instruction we give a new customer names a vendor
who has no relationship with us.

**Onboarding.** The public catalog required a `components.json` entry before it
would resolve a single component, because a bare name meant nothing without a
declared namespace. The README carried a `<details>` block explaining how to
avoid the config by pasting a full URL — a workaround for a step that only
existed because we had no default.

**Control.** This is the load-bearing one. The registry format, the file kinds,
the resolution rules, and the on-disk layout were all defined elsewhere. Every
one of them is something we need to change as the catalog grows: a new file
kind, a different target convention, a mirror for an air-gapped customer. None
of that was ours to decide, and the `$schema` we served pointed at a document
we do not control.

There was a fourth thing, discovered while building the replacement and not
before: because bare `registryDependencies` were expanded to absolute
`zoblocks.design` URLs at build time, **no copy of the registry could ever be
self-contained**. A mirror, an enterprise cache, or a local build under test
resolved its dependencies back to production. An air-gapped customer permitted
to reach only their own mirror would have received components whose
dependencies silently pointed somewhere they could not reach.

## Decision

**ZoBlocks ships its own installer: `@zoblocks/cli`, binary `zoblocks`.**

1. **Our own registry format**, published at `https://zoblocks.design/schema/`
   and generated from the same metadata as the registry itself. File kinds are
   `zoblocks:component`, `zoblocks:lib`, `zoblocks:hook`, and so on. The schema
   documents are emitted by the build, so a new kind cannot reach the registry
   without reaching its schema.

2. **The public catalog needs no configuration.** A bare name resolves to
   `https://zoblocks.design/r/{name}.json`, built into the binary and not
   overridable from a config file. A developer installs a free component with
   one command and no account.

3. **`zoblocks.json` replaces `components.json`**, and carries two things: where
   the project's `@/` alias points, and which authenticated registries may be
   reached. Credentials are written as `${ENV_VAR}` and expanded at request
   time; a literal token in that file is refused rather than used, because the
   file is meant to be committed and a token in git history cannot be undone.

4. **Registry documents state relationships, not locations.** A bare
   `registryDependency` means "the registry this item came from", so a mirror
   resolves within itself. Genuinely cross-registry references still carry a
   full URL.

5. **Zero runtime dependencies.** Under [0009](0009-supply-chain-and-component-constraints.md)
   every runtime dependency is an architectural decision, and an install tool is
   the worst place to spend that budget: it runs with write access to a
   customer's repository, so its transitive tree is the first thing a vendor
   security review opens. Node 20 supplies `fetch`, `parseArgs`, and the rest.

### One path setting, not four

The CLI does **not** let a project place components, lib, hooks, and styles
independently, and this is the decision most likely to be revisited by someone
who has not hit the failure.

ZoBlocks source is copied verbatim and imports itself through `@/` —
`@/lib/utils`, `@/components/zoblocks/timeline`. Those specifiers are inside the
files. A component's location is therefore fixed by the source, not by
configuration: honouring a setting that moved `utils.ts` to `src/shared/` would
write nine files that compile to nothing.

Honouring it _properly_ would mean rewriting import specifiers at install time
— real machinery, operating on source we hand to healthcare teams precisely so
they can audit it. So the registry states the path under `@/` and `zoblocks.json`
states where `@/` points, which is the one degree of freedom that actually
exists.

The first implementation of this CLI got it wrong: it routed files by their
declared kind into per-kind alias roots. It produced `hooks/lib/zoblocks-accordion.tsx`
and `components/zoblocks/zoblocks/timeline.tsx`, and it was caught by installing a
real component from a real registry rather than by any unit test. The file kind
is metadata for humans and tooling; it is not a routing key.

## Consequences

**Good.** The format, the resolution rules, and the layout are ours to evolve.
The public catalog installs with no configuration step. The registry is
self-contained, so mirrors and air-gapped caches work. Error messages can be
written for the failure the developer actually hit — a Figma-scoped token used
for an install now says so, rather than returning a bare 401. And the product
no longer teaches every new customer a competitor's brand name at the moment of
first contact.

**Costs.** An installer is a real piece of software with a real maintenance
burden, and it runs with write access to customers' repositories: the target
sanitisation, the refusal to overwrite edited files, and the collision check
all exist because of what a bug here would do. We also lose the ecosystem's
tooling for free — anything that reads a registry now needs our schema.

**Migration.** Existing customers have `components.json` entries and
`shadcn add` in their scripts. Those keep working against the old published
registry documents until the docs site redeploys, and break after it. This
needs a release note and a deprecation window rather than a silent cutover, and
**the docs site must deploy before the CLI is published** — a CLI that only
understands `zoblocks:*` kinds is useless against a registry still serving
`registry:*` ones.

**Rejected: keep shadcn, rewrite only the prose.** It removes the brand from
sentences we write while leaving it in every command we tell people to run,
which is the half of the surface that matters. It also leaves the format,
the resolution rules, and the mirror problem exactly where they were.

**Rejected: a ZoBlocks CLI that wraps shadcn.** Cheaper, and it would have made
the visible surface entirely ours. But the dependency stays in the tree that a
vendor security review reads, the format is still not ours to change, and the
mirror bug is not fixable from a wrapper. It buys the presentation without any
of the control, which is the wrong half.
