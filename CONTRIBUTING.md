# Contributing to Zoblocks

Thank you for helping. This document covers the mechanics. The _standard_ your
change is judged against is [ENGINEERING.md](ENGINEERING.md) — read its
definition of done before you start, not after review.

## Before you write code

**Open an issue first** for anything larger than a bug fix. A new component, a
new prop on an existing one, or a new runtime dependency are all decisions with
consequences past this pull request, and it is cheaper to disagree in an issue
than in a review.

**Never put real patient data anywhere.** Not in a test, a fixture, a
screenshot, an issue, or a commit message. Use
`@zoblocks/fixtures`, or invent values on reserved `example.org`
systems. CI scans for non-synthetic identifiers, but the scan is a backstop for
review, not a substitute.

## Setting up

```bash
corepack enable            # the repo pins pnpm via packageManager
pnpm install
pnpm gen                   # generate everything derived from component metadata
pnpm dev                   # docs site on :6001, hq on :6002
```

Node ≥ 20.11. Anything else and `pnpm install` will tell you.

## The loop

```bash
pnpm test:watch            # components, in watch mode
pnpm gen                   # after editing any *.meta.ts
pnpm lint --fix
pnpm format
```

Before pushing, run what CI runs:

```bash
pnpm verify
```

That runs the same gates as `.github/workflows/ci.yml`, in the same order, and
prints output only for the ones that fail. `pnpm verify --fast` skips the tests
and the build when you want the quick pass.

**`pre-push` runs `pnpm verify --fast` for you.** That is deliberate, and it is
worth knowing why there are two hooks rather than one:

| Hook         | Runs          | Sees                      |
| ------------ | ------------- | ------------------------- |
| `pre-commit` | `lint-staged` | only the files you staged |
| `pre-push`   | `pnpm verify` | the whole repository      |

`lint-staged` is the right tool for a commit — it is fast, and it keeps what you
wrote tidy. But it is structurally blind to the failures that actually break a
build: a new lint rule firing on a package you never opened, a shared lockfile
change breaking someone else's tests, a type error that only exists across a
package boundary, or `format:check`, which has no staged-files equivalent at
all. Every one of those passes `pre-commit` and fails CI.

If you need to push past it:

```bash
SKIP_VERIFY=1 git push     # or: git push --no-verify
```

Use it for a WIP branch where CI is the faster loop. Do not use it for a branch
you are about to open a pull request from.

## Adding a component

```bash
pnpm gen:component my-component
```

That scaffolds the whole directory. **Adding a component touches one directory** —
if you find yourself editing a shared file by hand, something is wrong; the
generator owns those. Then:

1. Write the implementation. Every colour through a semantic token, every
   user-visible string through `@zoblocks/intl`, no forbidden capabilities.
2. Fill in `*.meta.ts` honestly. `states` is the list a reviewer will check the
   stories against.
3. Write stories covering **every state you declared**.
4. Write tests to the bar for your stability tier (ENGINEERING.md §9).
5. `pnpm gen` and commit the generated output.

New components start at `experimental` or `beta`. Nothing starts `stable`.

## Commits

[Conventional Commits](https://www.conventionalcommits.org):

```
feat(pulse-loader): add bpm prop
fix(tokens): raise focus-ring to clear 3:1 on light surfaces
docs(readme): correct the install command
chore(deps): upgrade vitest to 3.2
```

Types: `feat` · `fix` · `docs` · `test` · `refactor` · `perf` · `build` · `ci` ·
`chore`. Scope is the package or component. A breaking change gets `!` after the
scope **and** a `BREAKING CHANGE:` footer explaining the migration.

## Changesets

Any change to a published package needs one:

```bash
pnpm changeset
```

Pick the bump honestly:

| Bump    | When                                                               |
| ------- | ------------------------------------------------------------------ |
| `patch` | A fix that changes no API and no rendered output beyond the defect |
| `minor` | A new optional prop, a new component, an additive capability       |
| `major` | Anything a consumer must change code for — see ENGINEERING.md §13  |

Write the changeset for the person upgrading, not for us. "Fixed the loader" is
useless; "the focus ring now clears 3:1, which darkens it slightly in light
mode" is what someone needs.

## Pull requests

- One logical change per PR. A refactor and a fix in one diff get reviewed as
  neither.
- Fill in the template. An unticked box with no explanation blocks review.
- Screenshots for any visual change, light **and** dark.
- Keep the branch rebased on `main`.

A maintainer reviews everything under `packages/`, `registry/`, `scripts/gen/`,
and `.github/workflows/` — see [CODEOWNERS](.github/CODEOWNERS).

## What gets a change rejected

Not to discourage you — to save you the round trip:

- A component that fetches, reads `process.env`, logs, or uses `innerHTML`
- A colour that is not a semantic token
- A Tailwind class assembled from a variable (it compiles to nothing, silently)
- An absence rendered as `—` or `N/A` instead of stating what is absent
- A new required prop on an existing component, outside a major
- A visual change with no updated VRT baseline
- A new runtime dependency with no ADR
- Missing states in `meta.ts` — if it renders it, declare it

## Architecture decisions

Anything that changes an invariant — package topology, the token tiers, the
distribution channels, the testing strategy — needs an ADR in
[`content/decisions/`](content/decisions/). Copy the format of an existing one:
context, decision, consequences. Propose it in the PR that implements it.

## Licence

By contributing you agree that your contributions are licensed under the MIT
Licence covering this repository, except `apps/hq`, which is proprietary and not
open to outside contribution.
