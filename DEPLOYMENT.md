# Deployment

Everything ships from CI. Nothing ships from a laptop.

That is not a style preference. Production sat three merges stale because
deploys were run manually with `vercel --prod`, and the working copy happened to
be on a feature branch nine commits behind `main` — so the command succeeded,
reported success, and published the wrong code. CI has no checkout to get wrong.

## What runs when

| Trigger              | Workflow         | Effect                                                  |
| -------------------- | ---------------- | ------------------------------------------------------- |
| PR opened or updated | `ci.yml`         | Checks, then a preview deployment                       |
| Merge to `main`      | `ci.yml`         | Checks, then production deploys for docs and hq         |
| Merge to `main`      | `release.yml`    | Opens a "Version packages" PR if changesets are pending |
| Merge the version PR | `release.yml`    | Publishes to npm with provenance                        |
| Manual               | `hq-indexes.yml` | Applies hq's MongoDB indexes                            |

Deploy jobs declare `needs: [verify, no-phi]`, so a red build cannot reach
production. This is the main reason deployment lives here rather than in
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

It has to be enabled on a package that already exists, so `NPM_TOKEN` remains
supported as a fallback for the first publish of a new package.

## Setting up hq

hq is a **separate Vercel project** on the same repository:

1. Create the project, Root Directory **`apps/hq`**.
2. Set `DATABASE_URL` in its environment to a connection string for a database
   user **scoped to the `hq` database** — see below. hq always opens the
   database named `hq` inside that cluster, never the site's, so the two cannot
   collide.
3. Move the `hq.oxygenui.design` domain onto it. It is currently attached to the
   docs project, which would serve the marketing site from that hostname.
4. Add `VERCEL_PROJECT_ID_HQ` and `HQ_DATABASE_URL` to the repository.
5. Run `hq-indexes` once, then merge to `main`.

Both projects must have their Root Directory set explicitly. With two apps in
one repository, a project that defaults to the root builds the wrong app.

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
  `@oxygenui-design/fhir` _and_ the dependency is version-pinned. A stale or
  malformed registry is a broken install for every customer, and it is precisely
  what went unnoticed for three merges.
- **hq** — requests `/tasks` signed out and fails unless it redirects. A wrong
  Root Directory would serve the marketing site from `hq.oxygenui.design`, and
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
