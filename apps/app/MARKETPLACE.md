# The marketplace

Buying packs, components and themes from inside the app, and receiving them.

Built **entitlements and delivery first, storefront second**. The storefront is
the cheap part and the part that can be rebuilt; the record that has to survive
refunds, contracts, audits and revocation is the one that is painful to retrofit
once real money has moved through it. It is also what the enterprise motion
already needed — a pack included in a $25k engagement is delivered by the same
machinery as a $180 card purchase, rather than by emailing a zip.

The design argument is `oxygen-marketplace-brief.html` at the repository root.
This file is how to run it.

## Running it locally

```bash
pnpm --filter @oxygenui-design/app db:dev          # leave running
pnpm --filter @oxygenui-design/app db:seed         # two organisations
pnpm --filter @oxygenui-design/app db:seed:market  # five catalogue items
pnpm --filter @oxygenui-design/app dev             # http://localhost:6003
```

Sign in as `admin@northwind.example`, open **Catalogue**.

Two worktrees both running `db:dev` collide on its fixed port. The second one
wants `APP_DEV_DB_PORT=59790 pnpm ... db:dev` and a matching
`DATABASE_URL` — a different port, rather than stopping the other one and
losing its data.

### Buying without Stripe

Every item page carries **"Granted with a contract, or paid against an
invoice?"** for admins. It grants the entitlement with a reason, writes the
audit row, and leaves the organisation in exactly the state a completed checkout
would. That is not a development shortcut — it is the fourth way money arrives,
and it is why entitlements exist separately from Stripe.

## Connecting Stripe

Nothing can be bought with a card until a Stripe account has Products and Prices
matching the catalogue. That is one command rather than dashboard typing, where
a transposed digit sells a $450 component for $45:

```bash
pnpm --filter @oxygenui-design/app stripe:sync            # prints the plan
pnpm --filter @oxygenui-design/app stripe:sync -- --apply # creates them
```

Dry run by default; a live key additionally needs `--live`. It is idempotent —
products carry a deterministic id derived from the catalogue slug, and a Price
is reused when one exists at the same amount. Stripe Prices are immutable, so
changing a price creates a new one and deactivates the old rather than editing
it.

Then the keys, in `.env.local`:

```
STRIPE_SECRET_KEY="sk_test_…"
STRIPE_WEBHOOK_SECRET="whsec_…"
```

The app refuses to start in production with an `sk_test_` key.

### The webhook is not optional

A customer can pay and lose their connection before the success page loads, and
delayed payment methods settle days after checkout completes. Without the
webhook, those customers are never delivered to.

```bash
stripe listen --forward-to localhost:6003/api/stripe/webhook
```

In the dashboard, point an endpoint at `https://<host>/api/stripe/webhook` and
send:

| Event                                      | What happens                                                                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `checkout.session.completed`               | Grants. The common path.                                                                                                      |
| `checkout.session.async_payment_succeeded` | Grants. Bank debits land here, sometimes days later. **Omitting this silently never delivers to the customers who pay most.** |
| `checkout.session.expired`                 | Records an abandoned order. A run of these is a pricing or tax surprise, not a bug.                                           |
| `invoice.paid`                             | Grants, for the enterprise route.                                                                                             |
| `invoice.payment_failed`                   | Nothing. A retry is not a reason to withdraw something delivered.                                                             |
| `charge.refunded`                          | Revokes.                                                                                                                      |
| `charge.dispute.created`                   | Revokes and needs a person.                                                                                                   |

The success page also fulfils, calling the same function. That is Stripe's
recommended shape and it is safe because the claim is a single atomic write
keyed on the session id — one caller wins, the other is told it already
happened.

### Invoices carry the attribution

An invoice raised in the Stripe dashboard must carry metadata, or the payment
cannot be attributed and fulfilment answers `unresolvable` rather than guessing
from the customer record:

```
orgId  = <the organisation's ObjectId>
items  = <comma-separated catalogue slugs>
```

## Installing what you bought

| Kind                    | Where it lands                                                          |
| ----------------------- | ----------------------------------------------------------------------- |
| Icons                   | Written into a theme's **draft** icon slots. Publishing stays separate. |
| Illustrations, fixtures | `GET /m/{item}/pack.zip` — a deterministic store-only archive.          |
| Themes                  | A **draft** theme. Nothing is live until an admin publishes it.         |
| Components              | The shadcn CLI, through a private namespace.                            |

```jsonc
// the customer's components.json
"registries": {
  "@oxygen-pro": {
    "url": "https://app.oxygenui.design/r/pro/{name}.json",
    "headers": { "Authorization": "Bearer ${OXYGEN_TOKEN}" }
  }
}
```

```bash
OXYGEN_TOKEN=oxy_live_… npx shadcn@latest add @oxygen-pro/vitals-flowsheet
```

Tokens are minted under **Access tokens**, shown once, and stored only as a
SHA-256 — the same reasoning as the session cookie. They are labelled, expire
after 90 days, are revocable, and are capped at ten live per organisation.

## The public shelf

The catalogue is also rendered on `oxygenui.design/marketplace`, because a
storefront reachable only after sign-up has no top of funnel — the app has
no anonymous traffic and the docs site does. The app keeps checkout,
entitlement and delivery; the docs site keeps discovery.

It reads `GET /c/catalog.json` — public, cached, and carrying the shelf only.
No entitlement, no order, no organisation, and not the Stripe price id.

```
# apps/docs
NEXT_PUBLIC_APP_URL="https://app.oxygenui.design"
```

**The docs site must never read this database.** A public marketing page that
500s because a private app's MongoDB is restarting is a worse property than
one showing yesterday's catalogue, so the endpoint is
`stale-while-revalidate` for a day and every failure on the docs side renders an
empty shelf that says so. That is why a CI build with no app reachable
produces a page that is correct and empty rather than a build failure.

## Things worth not undoing

**`/m/…` is the one route here that is not public.** `/t/` and `/f/` are public
because a browser fetches a stylesheet and a font without credentials; paid
bytes cannot be. A miss is a flat 404 in every case — wrong item, no
entitlement, revoked, unknown path — because "that item exists and you have not
bought it" is not a fact worth handing to somebody enumerating the catalogue.

**Prices are resolved server-side from the catalogue.** The browser sends a
slug. An endpoint that accepts a price sells a component for whatever the caller
says, with a valid Stripe receipt to show for it.

**Nothing purchased publishes itself.** Installing edits a draft; an admin still
decides when it goes live. A purchase must not be a back door around the
designer/admin split.

**Purchased artwork passes the same gate uploaded artwork does.** `checkLogo`
runs on our own SVGs too — "we drew it" is exactly the assumption that ships a
glyph with a script in it.

**The catalogue is the only global collection.** `catalogItems`,
`catalogVersions` and `marketAssets` are the same shelf for every customer and
are reached through `unscopedCatalog*` helpers, beside the sign-in and
public-stylesheet exceptions. Everything expressing _who paid_ carries `orgId`.

## Not built

- **Content.** Five sample items with line art drawn to demonstrate the shapes.
  The actual catalogue — glyph sets, the empty-state system in full — does not
  exist, and it is the real bottleneck.
- **Clinical review.** The provenance record's `clinical` block is the
  differentiator, and the seed deliberately fills it with
  `SEED DATA — nobody has reviewed this` rather than a plausible name and
  registration number. Nothing should carry a real-looking review until somebody
  has actually done one.
- **Raising invoices from the app.** The receiving half is built and tested;
  creating and sending the invoice is done in Stripe.
- **Multi-item purchase.** Fulfilment handles several slugs; checkout creates
  one item at a time and there is no cart.
- **Public catalogue pages.** A storefront only reachable after sign-in has no
  top of funnel. Whether the catalogue is mirrored onto `oxygenui.design` is an
  open question — it doubles the surface.
