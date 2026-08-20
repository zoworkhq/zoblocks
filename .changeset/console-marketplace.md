---
"@oxygenui-design/console": minor
---

A marketplace inside the console: buy packs, components and themes, and receive them.

The shape is **entitlements and delivery first, storefront second**, because the
retrofit cost is asymmetric — the record that has to survive refunds, contracts,
audits and revocation is the one nobody designs when it is invented inside a
webhook handler under deadline.

**Five collections**, and the first in this app that are deliberately global.
`catalogItems`, `catalogVersions` and `marketAssets` are the same shelf for every
customer and are reached only through `unscopedCatalog*` helpers in `scope.ts`,
beside the sign-in and public-stylesheet exceptions. Everything expressing _who
paid_ — `orders`, `entitlements`, `registryTokens` — carries `orgId` and goes
through `scoped()` exactly like themes. Catalogue versions are immutable and
entitlements are revoked rather than deleted, matching the conventions
`themeVersions` and members already set.

**Four capabilities.** `market.purchase` is admin-only for the same reason
`theme.publish` is: it is the action whose consequences land outside the console.
`market.install` follows `theme.write` and stops at a draft, so a purchase is
never a back door around the designer/admin split. `market.token` belongs to
developers. `market.browse` is universal.

**Stripe over `fetch`, with no SDK** — three calls and forty lines of HMAC
against a dependency in a workspace whose lockfile has twice turned `main` red.
`PaymentGateway` is the seam, so the whole purchase lifecycle is testable without
a network or an API key. Prices are resolved server-side from the catalogue; the
browser only ever sends a slug.

**Fulfilment happens exactly once**, claimed with a single atomic write keyed on
the Stripe session id — the same idiom as `claimFirstAdmin`. It is called by the
webhook _and_ by the success page, as Stripe recommends, and a concurrency test
caught the case that made that unsafe: an upsert whose filter no longer matches
attempts an insert against a taken `_id`, and E11000 is the answer rather than an
error. `checkout.session.async_payment_succeeded` is handled alongside
`completed`, so delayed bank payments are delivered rather than silently dropped.

**Delivery is per kind.** Icons install into a theme draft through the existing
`uploadIcons`, so purchased artwork passes the same `checkLogo` gate uploaded
artwork does. Illustrations and fixtures download as a deterministic store-only
zip written by hand. Themes arrive as drafts. Components install through a
private shadcn namespace at `/r/pro/{name}.json`, gated on a bearer token whose
SHA-256 alone is stored.

`/m/{item}/…` is the one route in this app that is not public, and it resolves an
entitlement before it resolves a file — `/t/` and `/f/` are public because a
browser fetches a stylesheet and a font without credentials, and paid bytes
cannot be.
