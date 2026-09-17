# Deployment

Everything ships from CI. Nothing ships from a laptop.

That is not a style preference. Production sat three merges stale because
deploys were run manually with `vercel --prod`, and the working copy happened to
be on a feature branch nine commits behind `main` — so the command succeeded,
reported success, and published the wrong code. CI has no checkout to get wrong.

## What runs when

| Trigger              | Workflow         | Effect                                                          |
| -------------------- | ---------------- | --------------------------------------------------------------- |
| PR opened or updated | `ci.yml`         | Checks, then a preview deployment                               |
| Merge to `main`      | `ci.yml`         | Checks, then production deploys, then the "Version packages" PR |
| Merge the version PR | —                | Nothing ships. The bumps land on `main` and wait.               |
| Manual               | `publish.yml`    | Publishes to npm                                                |
| Manual               | `hq-indexes.yml` | Applies hq's MongoDB indexes                                    |

The gate set itself lives in `verify.yml`, a reusable workflow that `ci.yml` and
`publish.yml` both call. It used to be written out twice — `ci.yml` ran it on
every push, and `release.yml` ran nine of the same gates again on the same
commit, on a second runner — which cost a full extra machine per merge and was
free to drift apart the moment one file was edited and not the other.

**Nothing publishes on a merge.** Merging the version PR lands the bumps and
stops there; shipping is **Actions → Publish to npm → Run workflow**, on
purpose. The site can ship many times a day, but an npm release changes what
every existing consumer resolves to and should happen when someone decided it
would. Its **Mode** dropdown defaults to `publish`; pick `dry-run` to rehearse
every gate, pack every tarball and print `changeset publish-plan` without
shipping.

Every job past the gates declares `needs: [gates]`, so a red build can reach
neither production nor npm. This is the main reason deployment lives here rather than in
Vercel's own Git integration — that integration deploys on every push whether or
not the checks passed, which is the wrong default for a site publishing WCAG
conformance and healthcare guidance.

## Secrets and variables

Set under **Settings → Secrets and variables → Actions**.

| Name                   | Kind     | Needed for  | Notes                                                                                  |
| ---------------------- | -------- | ----------- | -------------------------------------------------------------------------------------- |
| `VERCEL_TOKEN`         | secret   | all deploys | Vercel → Account Settings → Tokens. Scope it to the team.                              |
| `VERCEL_PROJECT_ID_HQ` | variable | hq deploys  | From `apps/hq/.vercel/project.json` after linking. The hq job skips until this exists. |
| `HQ_DATABASE_URL`      | secret   | indexes     | Connection string for the `hq`-scoped database user — see below.                       |
| `NPM_TOKEN`            | secret   | npm publish | Optional — see below.                                                                  |

The Vercel org and docs project IDs are in `ci.yml` in plain text on purpose.
They are identifiers, not credentials: they sit in `.vercel/project.json` on
every machine that has ever run `vercel link`. Treating them as secrets adds
setup friction and protects nothing.

### npm publishing

Preferred is **trusted publishing** (OIDC): configure it per package in the npm
UI against this repository, and `NPM_TOKEN` can stay unset. Nothing is stored,
nothing expires, and npm attests the tarball came from this repo at this commit.

Two limits decide how the first release has to work. Trusted publishing
authenticates with an OIDC token that only a CI runner can mint, so it cannot
publish from a laptop at all; and it is configured per package under Packages →
the package → Settings → Trusted publishing, which requires the package to
already exist. All 27 of ours are new, so OIDC cannot perform their first
publish however it is set up. A granular access token with _Bypass two-factor
authentication_ is the only way to bootstrap them.

That bootstrap credential is on a clock. npm is deprecating direct publishing
with bypass-2FA tokens: since August 2026 they can no longer perform
account-identity or governance actions, and **the ability to publish with one
is removed in January 2027**. The trigger was Mini Shai-Hulud, where a single
stolen token pushed 639 malicious versions across 323 packages in 22 minutes.

So the token is a one-time bootstrap, not the steady state. Configure trusted
publishing on all 27 packages as soon as the first release lands, then revoke
it. Leaving the migration until the deadline means doing it under time pressure
across 27 packages at once.

### pnpm cannot do OIDC or provenance, and changesets picks pnpm

This is the constraint that shapes the whole release design, so it is worth
stating plainly. `changeset publish` chooses its publish tool by detecting the
workspace — `getPublishTool` in `@changesets/cli` returns pnpm here — and
`pnpm publish --help` on 9.15.4 offers only `--access`, `--otp` and `--tag`.
There is no `--provenance` and no OIDC.

Two consequences, both easy to miss because neither fails loudly:

- `NPM_CONFIG_PROVENANCE` is inert. It has been set in the publish workflow since
  provenance was introduced, and no release has ever been attested, because the
  tool reading it was never npm.
- Configuring trusted publishing and deleting `NPM_TOKEN` would break the
  release outright. pnpm would have no credential and no way to mint one.

Swapping to `npm publish` is not the fix either: `publishConfig`'s rewrite of
`main`, `types` and `exports` to `./dist` is a pnpm feature that npm ignores, so
npm would publish entry points still pointing at `./src/index.ts`.

The way out is that `pnpm pack` bakes the rewritten manifest _into the tarball_ —
verified: the tarball for `@zoblocks/intl` carries `main: ./dist/index.js`. A
tarball published by npm keeps the manifest it already has. So packing with pnpm
and publishing that tarball with npm gets both halves: pnpm resolves the
workspace ranges and applies `publishConfig`, npm supplies OIDC and provenance.

Upgrading to pnpm 10, which did support OIDC, is the other option. Note that
pnpm 11 regressed it, so that route needs a version pin and a watch on the
upstream issue.

Until one of those lands, CI publishes with `NPM_TOKEN` and ships unattested.

Before any release: `pnpm build && pnpm release:check`. It packs every
publishable package with pnpm and fails on a missing README or LICENSE, an entry
point absent from the tarball, a leftover `workspace:` range, test files, or an
import Node cannot resolve. CI and `publish.yml` run the same script — and
`publish.yml` runs it even under `skip-checks`, because it is the one assertion
that is about the artifact rather than about the source.

### The `@zoblocks` scope is not the `zoworkhq` org

An npm scope maps one-to-one onto the account of the same name. Owning the
`zoworkhq` org grants `@zoworkhq/*` and nothing else, so `@zoblocks/react` needs
an account literally named `zoblocks` — there is no way to alias one scope onto
another org, and no setting that grants it.

Orgs are free for unlimited public packages, so the fix is to create a second
one named `zoblocks` and publish under that. Renaming the packages instead would
mean rewriting the scope in about 570 files and would leave the docs site, the
registry and the `zoblocks` CLI binary reading as a different product.

### Provenance needs the repository names to agree

Every manifest declares `repository.url` as `github.com/zoworkhq/zoblocks`, and
the repository is still called `zoworkhq/oxygenui`. npm attests provenance <!-- rename-sweep-exempt: the repository's actual name until it is renamed -->
against the repository that built the tarball and the registry rejects an
attestation that names a different one, so asking for provenance while the two
disagree fails the publish rather than skipping the attestation.

`publish.yml` therefore reads the declared repository, compares it with the one
running the job, and sets `NPM_CONFIG_PROVENANCE` from the result. Releases ship
unattested with a warning in the log until the repository is renamed, and
attestation turns itself back on the moment it is — no workflow edit, and no
window where a release quietly ships unattested because a flag was left off.

Publishing from a laptop is unattested either way: provenance requires the OIDC
token only a CI run holds.

### Publishing from a developer machine

The first release is being cut by hand, before CI holds any credential. `pnpm
release` is the same path the workflow takes — build, inspect every tarball,
then `changeset publish`.

1. **Log in.** `npm login`, then `npm whoami` to confirm. `npm org ls zoblocks`
   should list you.
2. **Version.** `pnpm changeset version`. This consumes the pending changesets
   and writes the CHANGELOG entries. Do it before publishing, not after: the
   changes those changesets describe are already in the code, so publishing
   first ships them under a version whose changelog does not mention them.
3. **Prove the permission on one package.** `pnpm build`, then
   `cd packages/intl && pnpm publish --access public --no-git-checks`.

   pnpm, never npm — `publishConfig` here rewrites `main`, `types` and
   `exports` to `./dist`, and that rewrite is a pnpm feature. npm honours only
   `access`, `registry`, `tag` and `provenance`, so an `npm publish` ships
   entry points still pointing at `./src/index.ts` and breaks every consumer
   that does not compile TypeScript out of `node_modules`. `--no-git-checks`
   because step 2 has just left version bumps uncommitted in the tree.

   `intl` is one of six packages carrying a `prepublishOnly` guard that refuses
   npm outright; the other 21 would publish a broken tarball without complaint.
   `pnpm release` is safe for all 27 whatever the guard says — `changeset
publish` detects the workspace and shells out to `pnpm publish` — so the gap
   only bites a hand-run `npm publish`, which is to say this step.

   This release creates 27 packages that do not yet exist, and creating a
   package is a different permission from publishing a new version of one. An
   account with developer rather than admin rights on the org is exactly where
   that distinction bites, and `changeset publish` walks the packages one at a
   time: a permission error partway leaves some of the 27 on npm and the rest
   not. A published version cannot be replaced, and an unpublished name is
   blocked for 24 hours, so an aborted run is genuinely awkward to redo.

   `intl` is the cheapest probe — eight files, no `@zoblocks` dependencies, so
   it can go first without anything else being on the registry yet. A 403 here
   means ask an org owner for publish rights; nothing else has moved.

4. **Publish the rest.** `pnpm release`. It skips `intl`, whose version is now
   on the registry, and publishes the other 26. Commit the version bumps
   afterwards.
5. **Check.** `npm view @zoblocks/cli version`, then
   `npx @zoblocks/cli@latest add pulse-loader` in an empty directory.

If the account has 2FA set to "authorization and writes", `changeset publish`
will prompt for an OTP once per package — 27 times. Either set 2FA to
"authorization only" for the duration, or publish with a granular access token,
which is exempt.

Everything after this first release should go through CI, which runs gates a
laptop does not.

### First publish through CI

Nothing is on npm under this scope yet, so trusted publishing cannot be set up
first. In order:

1. **Token.** On npmjs.com, create a granular access token: read and write,
   scoped to the `@zoblocks` org, 7-day expiry. Add it as the `NPM_TOKEN`
   repository secret.
2. **Version PR.** Either tick _Settings → Actions → General → Allow GitHub
   Actions to create and approve pull requests_, or open the PR by hand from the
   `changeset-release/main` branch the version job pushes. Check every package
   reads `0.2.0` (`fhir` included) before merging.
3. **Merge it, then publish.** Merging only lands the bumps. Run **Actions →
   Publish to npm → Run workflow** to ship all 27 packages — with provenance
   only once the repository rename above has landed. A `dry-run` first tells you
   exactly which versions the registry does not have yet.
4. **Check.** `npm view @zoblocks/cli version` and
   `npx @zoblocks/cli@latest add pulse-loader` in an empty project.
5. **Switch to OIDC.** For each package on npmjs.com, add a trusted publisher:
   repository `zoworkhq/zoblocks`, workflow `publish.yml`. Then delete
   `NPM_TOKEN` and revoke the token.

There is no old scope to retire. This step used to say to `npm deprecate` the
two pre-rename packages named in `.changeset/the-rename.md`; that changeset has
since been consumed, and `@oxygenui/intl` and `@oxygenui-design/react` both <!-- rename-sweep-exempt: names the retired packages -->
return 404 on the registry — the rename happened before anything was ever
published. `@zoblocks/codemod` still rewrites those imports, which is worth
keeping for anyone who used the packages from source, but nothing on npm needs
deprecating.

## Setting up hq

hq is a **separate Vercel project** on the same repository:

1. Create the project, Root Directory **`apps/hq`**.
2. Set `DATABASE_URL` in its environment to a connection string for a database
   user **scoped to the `hq` database** — see below. hq always opens the
   database named `hq` inside that cluster, never the site's, so the two cannot
   collide.
3. Move the `hq.zoblocks.design` domain onto it. It is currently attached to the
   docs project, which would serve the marketing site from that hostname.
4. Add `VERCEL_PROJECT_ID_HQ` and `HQ_DATABASE_URL` to the repository.
5. Run `hq-indexes` once, then merge to `main`.

Both projects must have their Root Directory set explicitly. With two apps in
one repository, a project that defaults to the root builds the wrong app.

hq's `vercel.json` pins its functions to `bom1`, next to the Atlas cluster in
`ap-south-1`. That is load-bearing, not a preference — on the default region the
functions ran in Virginia and every query crossed the Atlantic twice. See
[apps/hq/README.md](apps/hq/README.md#why-verceljson-pins-the-region-to-bom1).
The docs site is unaffected: it is static and served from the edge cache.

### The database user hq should hold

hq currently shares the marketing site's Atlas credential. That credential can
read and write the site's Payload database, so the blast radius of a bug or a
leak in hq is the production website's content — a scope hq has no reason to
have, and one that is invisible until it matters.

Fixing it is one Atlas user. **Create it yourself** — it involves choosing a
password, which is not something to hand to a tool or paste into a chat.

In Atlas → **Database Access → Add New Database User**:

- Authentication: password. Generate one; do not reuse the site's.
- Built-in role: **Read and write to any database** → change to **Specific
  Privileges**, granting `readWrite` on database `hq` only.
- Restrict to the same network access list the site user uses.

`readWrite` on `hq` is exactly the privilege hq needs and no more. That is not
a guess — the surface is small and checkable:

| Fact                                            | Where                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| One database, named in code, never from the URI | a single `client.db(DB_NAME)` in `apps/hq/src/db/client.ts`                      |
| Six collections                                 | `users`, `sessions`, `tasks`, `comments`, `activity`, `counters`                 |
| Reads and writes documents                      | `findOne`, `countDocuments`, `insert*`, `update*`, `delete*`, `findOneAndUpdate` |
| Creates its own indexes                         | `ensureIndexes`, run by the `hq-indexes` workflow                                |

No aggregation, no `dropDatabase`, no administrative commands, and no second
database — so nothing here needs a role broader than `readWrite`, and index
creation is already inside it.

Then, in order:

1. Update `DATABASE_URL` in the hq Vercel project (all environments) to the new
   string. Keep the `hq` database name in the path or leave it off — the code
   ignores it either way.
2. Update the `HQ_DATABASE_URL` repository secret, which the indexes workflow
   uses.
3. Redeploy hq and sign in once to confirm.
4. Only then, rotate the site credential hq was borrowing. Until that rotation
   the old credential is still valid and still known to two systems.

## What the deploy jobs assert

A 200 response is not evidence that a deploy worked. Both production jobs check
the thing that would actually be broken:

- **docs** — fetches the deployed registry and fails unless it references
  `@zoblocks/fhir` _and_ the dependency is version-pinned. A stale or
  malformed registry is a broken install for every customer, and it is precisely
  what went unnoticed for three merges.
- **hq** — requests `/tasks` signed out and fails unless it redirects. A wrong
  Root Directory would serve the marketing site from `hq.zoblocks.design`, and
  that redirect is what distinguishes them.

The release job inspects the tarball before publishing: entry points present,
README and LICENSE present, no test files, no extensionless relative imports in
`dist`. Each of those is a defect that actually shipped in `0.1.0`.

## Indexes

`hq-indexes` is manual and requires typing `apply` to confirm. Mongo has no
schema to migrate — collections appear on first write — so the only thing
applied deliberately is the indexes.

Two of them are correctness, not performance:

- `users.emailLower` unique — stops `Ada@` and `ada@` becoming two accounts,
  which would silently split one person's task list in two.
- `tasks.ref` unique — stops two tasks both being called `HQ-42`.

A unique index **fails to build if existing data already violates it**, which is
the one case worth watching rather than firing and walking away.

Three more are TTL indexes, and they replace cleanup the SQL version needed a
sweep for: sessions, reset grants, and failed sign-in attempts expire on their
own.

## Rollback

Vercel keeps every deployment. Promote a previous one from the dashboard, or:

```bash
vercel rollback <deployment-url>
```

Rolling back code does not roll back the database. Documents written under the
new code keep whatever shape it gave them, and Mongo will not complain — so a
rollback that matters is a forward fix, not a reversal.
