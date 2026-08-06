# hq

**Internal task management for the Zowork team.** Deployed at `hq.oxygenui.design`.

Not part of the public registry, not published to npm, and not covered by the
MIT licence on the rest of this repository. It is a self-contained app under
`apps/hq/` so that it can be lifted into its own repository with a `git mv` if
the core is ever open-sourced — nothing outside this directory refers to it.

## Why it lives here

It is the dogfood consumer of the registry. Screens import Oxygen components by
the exact specifier the shadcn CLI writes into a customer's project
(`@/components/oxygen/app-shell`), mapped back to `registry/` source through
tsconfig paths. A component that breaks breaks our own daily tool first.

Currently exercising `AppShell`, `StatusBadge`, `EmptyState`, and `ActionGate`.
It does not exercise the FHIR components — a task tracker has no Observations —
so this validates the foundations layer only.

## Running it

```bash
cp .env.example .env.local          # point DATABASE_URL at Postgres
pnpm --filter @oxygenui-design/hq db:migrate
pnpm --filter @oxygenui-design/hq dev      # http://localhost:6002
```

Optional, for a board that is not empty:

```bash
node scripts/seed-dev.mjs
```

The seed refuses to run against anything that is not localhost.

| Command            | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `pnpm db:generate` | Generate a migration from schema changes |
| `pnpm db:migrate`  | Apply pending migrations                 |
| `pnpm db:studio`   | Browse the data                          |

## Access model

Signup is open; **an account grants nothing until an admin approves it** and
sets its role. Two roles only:

- **admin** — create and assign tasks, approve signups, set roles, disable accounts
- **member** — see the board, move tasks assigned to them

The first account ever created becomes an approved admin, because otherwise
there is nobody with the authority to approve anyone. Every later signup is
`pending`.

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

## Deploying

A second Vercel project on this repository, **Root Directory `apps/hq`**, with
`DATABASE_URL` set to a pooled Postgres connection string. Add
`hq.oxygenui.design` as its domain. DNS already sits on Vercel, so no records
need editing.

Migrations are not run at build time on purpose — run `db:migrate` deliberately
against production rather than letting a deploy alter the schema.

## Not built yet

Comments and the activity feed have tables and are written to, but nothing
renders them. Also absent, deliberately: projects UI, email notifications,
search, estimates, attachments, and a password reset flow — which is the most
important of these and should be next.
