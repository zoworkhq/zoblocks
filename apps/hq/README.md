# hq

**Internal task management for the Zowork team.** Deployed at `hq.oxygenui.design`.

Not part of the public registry, not published to npm, and not covered by the
MIT licence on the rest of this repository. It is a self-contained app under
`apps/hq/` so that it can be lifted into its own repository with a `git mv` if
the core is ever open-sourced — nothing outside this directory refers to it.

## Why it lives here

It is the dogfood consumer of the registry. Screens import Oxygen components by
the exact specifier the shadcn CLI writes into a customer's project
(`@/components/oxygen/app-shell`). A component that breaks breaks our own daily
tool first.

**Interim state (August 2026):** the proof-of-concept registry was cleared so
the component library can be planned and rebuilt from scratch. Until the new
components land, the two this app needs — `AppShell` and `ActionGate` — are
vendored under `src/components/oxygen/`, which is exactly the layout a customer
ends up with after `shadcn add`. When the rebuilt registry ships, delete those
copies and map the specifiers back to `registry/` source through tsconfig paths
(see the comment in `tsconfig.json`).

It does not exercise the FHIR components — a task tracker has no Observations —
so this validates the foundations layer only.

## Running it

```bash
cp .env.example .env.local          # point DATABASE_URL at MongoDB
pnpm --filter @oxygenui-design/hq db:indexes
pnpm --filter @oxygenui-design/hq dev      # http://localhost:6002
```

Optional, for a board that is not empty:

```bash
node scripts/seed-dev.mjs
```

The seed refuses to run against anything that is not localhost.

| Command           | Purpose                    |
| ----------------- | -------------------------- |
| `pnpm db:indexes` | Apply indexes (idempotent) |

## Access model

Signup is open; **an account grants nothing until an admin approves it** and
sets its role. Two roles only:

- **admin** — create and assign tasks, approve signups, set roles, disable accounts
- **member** — see the board, move tasks assigned to them

The first account ever created becomes an approved admin, because otherwise
there is nobody with the authority to approve anyone. Every later signup is
`pending`.

That decision is made **once**, by an atomic claim in the database, not by
reading a count and acting on it. A count is a read: when a team is told the
tool is ready and several people sign up in the same moment, every one of them
sees an empty user list and every one of them would be made an administrator.
It is the same reasoning as the unique index on `emailLower` — the database
decides, not the application. See `claimFirstAdmin` in `src/db/collections.ts`,
which also notes how to deliberately re-open the bootstrap.

Navigation is composed from scopes, so a member has no admin route rather than a
disabled one — but that is a usability decision. **Every permission is enforced
server-side in `src/lib/actions.ts`.** Hiding a control is never the control.

## Auth notes

- bcrypt at cost 12; password hashes never leave the data layer
- The session cookie is a 256-bit random token; the database stores only its
  SHA-256 hash, so a dump of `sessions` yields nothing usable
- Sessions are server-side rows, so disabling an account ends its sessions on
  the next request — a stateless JWT cannot be revoked, and offboarding is the
  security event that actually happens on a small team
- Sign-in failures are deliberately indistinguishable, and signup never reveals
  whether an address is already registered — neither form is an enumeration oracle

Auth and permissions are covered by `src/lib/auth.test.ts` and
`src/lib/actions.test.ts`, run against a real mongod via `mongodb-memory-server`
rather than a mocked driver — the guarantees here live in the database (a unique
index deciding a duplicate signup, an atomic claim deciding the first admin, a
`$ne` filter sparing the session in your hand), and a mock would only assert
that the code calls what it calls.

```bash
pnpm --filter @oxygenui-design/hq test
```

## Deploying

A second Vercel project on this repository, **Root Directory `apps/hq`**, with
`DATABASE_URL` set to the MongoDB connection string the marketing site already
uses. hq always opens the database named `hq` inside that cluster, never the
site's — so the connection string can be shared without the data being shared. Add
`hq.oxygenui.design` as its domain. DNS already sits on Vercel, so no records
need editing.

Indexes are not applied at build time on purpose — run `db:indexes` deliberately
against production. A unique index fails to build if existing data violates it,
which is a thing to watch rather than discover in a deploy log.

## Not built yet

Comments and the activity feed have tables and are written to, but nothing
renders them. Also absent, deliberately: projects UI, email notifications,
search, estimates, attachments, and a password reset flow — which is the most
important of these and should be next.
