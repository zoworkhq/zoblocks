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
| Manual               | `migrate-hq.yml` | Applies pending database migrations                     |

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
| `HQ_DATABASE_URL`      | secret   | migrations  | The **pooled** connection string.                                                      |
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
2. Set `DATABASE_URL` in its environment to the pooled Postgres string.
3. Move the `hq.oxygenui.design` domain onto it. It is currently attached to the
   docs project, which would serve the marketing site from that hostname.
4. Add `VERCEL_PROJECT_ID_HQ` and `HQ_DATABASE_URL` to the repository.
5. Run `migrate-hq` once, then merge to `main`.

Both projects must have their Root Directory set explicitly. With two apps in
one repository, a project that defaults to the root builds the wrong app.

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

## Migrations

`migrate-hq` is manual and requires typing `migrate` to confirm. It is not part
of deploy, because a schema change that runs automatically on merge takes the
app down with nobody watching.

Sequence matters:

- **Additive** (new column, new table) — migrate **before** deploying the code
  that uses it.
- **Destructive** (drop, rename) — deploy the code that stopped using the old
  shape **first**, then migrate.

## Rollback

Vercel keeps every deployment. Promote a previous one from the dashboard, or:

```bash
vercel rollback <deployment-url>
```

Rolling back code does not roll back the database. If a migration is implicated,
that is a forward fix — write the reversing migration and run `migrate-hq`.
