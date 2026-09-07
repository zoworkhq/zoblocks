/**
 * Organisation scoping, enforced by construction.
 *
 * The severe risk in a multi-tenant theme app is one customer reading
 * another's themes, and the way it happens is never a decision — it is a
 * `find({ slug })` written in a hurry, which succeeds, returns a document, and
 * looks right in review. There is no foreign key to catch it and no row-level
 * security in Mongo to stop it.
 *
 * So scoping is not a convention here. `scoped()` returns an object whose
 * methods **cannot express an unscoped query**: every filter is merged with
 * `{ orgId }` after the caller's, so a caller that passes its own `orgId` is
 * overridden rather than obeyed. The only way to reach a collection without a
 * scope is to import `db()` directly, which one test asserts nothing under
 * `src/` does.
 *
 * The two deliberate exceptions are named `unscoped*` and documented
 * individually: sign-in, which must find a member before an organisation is
 * known, and the public stylesheet route, which resolves an org from its slug.
 */

import { ObjectId, type Filter, type FindOneAndUpdateOptions, type UpdateFilter } from "mongodb";
import { db } from "./client";
import type {
  AuditDoc,
  EntitlementDoc,
  FontAssetDoc,
  MemberDoc,
  OrderDoc,
  RegistryTokenDoc,
  ThemeDoc,
  ThemeVersionDoc,
} from "./collections";

/** Anything belonging to a customer carries this. */
interface OrgOwned {
  orgId: ObjectId;
}

/**
 * A view of the data restricted to one organisation.
 *
 * Every read and write goes through here. The generic parameters keep Mongo's
 * types intact so a caller still gets a typed document back.
 */
export function scoped(orgId: ObjectId) {
  const cols = db();

  /**
   * The caller's filter first, `orgId` last.
   *
   * Order is the whole mechanism: spreading `{ orgId }` after the caller's
   * filter means a caller who passes `orgId` — by mistake, or because a
   * parameter was attacker-controlled — has it replaced rather than honoured.
   */
  const within = <T extends OrgOwned>(filter: Filter<T>): Filter<T> =>
    ({ ...filter, orgId }) as Filter<T>;

  return {
    orgId,

    /**
     * The caller's own organisation, and only ever that one.
     *
     * Scoped by `_id` rather than `orgId` because the organisation *is* the
     * scope. It is here so nothing else has to reach for the raw client to
     * read a name or a slug — the moment one module does, the guarantee stops
     * being structural and becomes a convention again.
     */
    organisation: {
      get: () => cols.organisations.findOne({ _id: orgId }),
      updateOne: (update: Parameters<typeof cols.organisations.updateOne>[1]) =>
        cols.organisations.updateOne({ _id: orgId }, update),
    },

    themes: {
      find: (filter: Filter<ThemeDoc> = {}) => cols.themes.find(within(filter)),
      findOne: (filter: Filter<ThemeDoc> = {}) => cols.themes.findOne(within(filter)),
      /*
       * Options are passed through, which matters for exactly one of them.
       *
       * `arrayFilters` is what lets a caller replace one entry of an embedded
       * array in place. Without it the only way to change an array is to read
       * the document, rebuild the array and write the whole thing back — and
       * that loses concurrent writes to *other* entries, silently.
       */
      updateOne: (
        filter: Filter<ThemeDoc>,
        update: Parameters<typeof cols.themes.updateOne>[1],
        options?: Parameters<typeof cols.themes.updateOne>[2],
      ) => cols.themes.updateOne(within(filter), update, options ?? {}),
      insertOne: (doc: Omit<ThemeDoc, "orgId">) =>
        cols.themes.insertOne({ ...doc, orgId } as ThemeDoc),
      countDocuments: (filter: Filter<ThemeDoc> = {}) => cols.themes.countDocuments(within(filter)),
    },

    versions: {
      find: (filter: Filter<ThemeVersionDoc> = {}) => cols.themeVersions.find(within(filter)),
      findOne: (filter: Filter<ThemeVersionDoc> = {}) => cols.themeVersions.findOne(within(filter)),
      insertOne: (doc: Omit<ThemeVersionDoc, "orgId">) =>
        cols.themeVersions.insertOne({ ...doc, orgId } as ThemeVersionDoc),
      countDocuments: (filter: Filter<ThemeVersionDoc> = {}) =>
        cols.themeVersions.countDocuments(within(filter)),
    },

    /**
     * Uploaded font bytes.
     *
     * Scoped like everything else even though the `_id` is a content digest:
     * two customers uploading the same face get two documents, and one cannot
     * discover the other's typography by guessing a hash of a well-known font.
     */
    fontAssets: {
      findOne: (filter: Filter<FontAssetDoc> = {}) => cols.fontAssets.findOne(within(filter)),
      find: (filter: Filter<FontAssetDoc> = {}) => cols.fontAssets.find(within(filter)),
      insertOne: (doc: Omit<FontAssetDoc, "orgId">) =>
        cols.fontAssets.insertOne({ ...doc, orgId } as FontAssetDoc),
      countDocuments: (filter: Filter<FontAssetDoc> = {}) =>
        cols.fontAssets.countDocuments(within(filter)),
    },

    members: {
      find: (filter: Filter<MemberDoc> = {}) => cols.members.find(within(filter)),
      findOne: (filter: Filter<MemberDoc> = {}) => cols.members.findOne(within(filter)),
      updateOne: (
        filter: Filter<MemberDoc>,
        update: Parameters<typeof cols.members.updateOne>[1],
      ) => cols.members.updateOne(within(filter), update),
      countDocuments: (filter: Filter<MemberDoc> = {}) =>
        cols.members.countDocuments(within(filter)),
    },

    /**
     * Purchases. Scoped like everything else, even though the `_id` is a
     * Stripe session id nobody could guess: the guess is not the threat, a
     * mistyped query is.
     */
    orders: {
      find: (filter: Filter<OrderDoc> = {}) => cols.orders.find(within(filter)),
      findOne: (filter: Filter<OrderDoc> = {}) => cols.orders.findOne(within(filter)),
      /*
       * The atomic claim behind idempotent fulfilment.
       *
       * Exposed as `findOneAndUpdate` rather than a read followed by a write
       * because the two callers — the Stripe webhook and the customer landing
       * on the success page — can arrive at the same instant. A
       * check-then-act grants twice; this grants once and tells the loser.
       *
       * With `upsert`, Mongo seeds the new document from the filter's equality
       * fields, so the `orgId` merged in by `within()` lands on the insert
       * without the caller passing it — which is the property that makes an
       * unscoped order impossible to create through this path.
       */
      findOneAndUpdate: (
        filter: Filter<OrderDoc>,
        update: UpdateFilter<OrderDoc>,
        options?: FindOneAndUpdateOptions,
      ) => cols.orders.findOneAndUpdate(within(filter), update, options ?? {}),
      updateOne: (filter: Filter<OrderDoc>, update: Parameters<typeof cols.orders.updateOne>[1]) =>
        cols.orders.updateOne(within(filter), update),
      countDocuments: (filter: Filter<OrderDoc> = {}) => cols.orders.countDocuments(within(filter)),
    },

    /** What this organisation may fetch. Revoked, never deleted. */
    entitlements: {
      find: (filter: Filter<EntitlementDoc> = {}) => cols.entitlements.find(within(filter)),
      findOne: (filter: Filter<EntitlementDoc> = {}) => cols.entitlements.findOne(within(filter)),
      updateOne: (
        filter: Filter<EntitlementDoc>,
        update: Parameters<typeof cols.entitlements.updateOne>[1],
        options?: Parameters<typeof cols.entitlements.updateOne>[2],
      ) => cols.entitlements.updateOne(within(filter), update, options ?? {}),
      insertOne: (doc: Omit<EntitlementDoc, "orgId">) =>
        cols.entitlements.insertOne({ ...doc, orgId } as EntitlementDoc),
      countDocuments: (filter: Filter<EntitlementDoc> = {}) =>
        cols.entitlements.countDocuments(within(filter)),
    },

    /** CLI credentials. Only their digests are ever stored. */
    registryTokens: {
      find: (filter: Filter<RegistryTokenDoc> = {}) => cols.registryTokens.find(within(filter)),
      findOne: (filter: Filter<RegistryTokenDoc> = {}) =>
        cols.registryTokens.findOne(within(filter)),
      insertOne: (doc: Omit<RegistryTokenDoc, "orgId">) =>
        cols.registryTokens.insertOne({ ...doc, orgId } as RegistryTokenDoc),
      updateOne: (
        filter: Filter<RegistryTokenDoc>,
        update: Parameters<typeof cols.registryTokens.updateOne>[1],
      ) => cols.registryTokens.updateOne(within(filter), update),
      countDocuments: (filter: Filter<RegistryTokenDoc> = {}) =>
        cols.registryTokens.countDocuments(within(filter)),
    },

    /** Append-only: there is deliberately no update or delete. */
    audit: {
      find: (filter: Filter<AuditDoc> = {}) => cols.audit.find(within(filter)),
      insertOne: (doc: Omit<AuditDoc, "orgId">) =>
        cols.audit.insertOne({ ...doc, orgId } as AuditDoc),
    },
  };
}

export type Scoped = ReturnType<typeof scoped>;

/**
 * Find a member by email, before any organisation is known.
 *
 * Sign-in's genuine exception: the session does not exist yet, so there is no
 * scope to apply. The email index is unique across the whole collection, which
 * is what makes this safe — one address is one person, in one organisation.
 */
export function unscopedMemberByEmail(emailLower: string) {
  return db().members.findOne({ emailLower });
}

/**
 * Resolve an organisation from the slug in a stylesheet URL.
 *
 * The second exception, and the one worth reading twice. `/t/{org}/{slug}@{v}.css`
 * is public by design — it is a stylesheet a browser fetches without
 * credentials — so this lookup has no session to scope by. It is safe because
 * the route serves *only* published versions and returns nothing else: no
 * member, no draft, no audit entry. The org slug is not a secret; the data
 * behind it, other than a published palette a customer chose to publish, is
 * never reachable through this path.
 */
export function unscopedOrganisationBySlug(slug: string) {
  return db().organisations.findOne({ slug });
}

/**
 * Create a member during sign-up, before any session exists.
 *
 * Sign-up's genuine exception, and the mirror of `unscopedMemberByEmail`: the
 * person has no session yet, so there is no scope to apply. It is safe because
 * the organisation is resolved from a slug the person supplied and the member
 * is created **pending** — an account that grants nothing until an
 * administrator inside that organisation approves it. The worst a stranger can
 * do with a known org slug is create a row somebody has to decline.
 */
export async function unscopedSignUp(
  orgSlug: string,
  member: Omit<MemberDoc, "_id" | "orgId">,
): Promise<{ ok: true } | { ok: false; reason: "no-org" | "taken" }> {
  const organisation = await db().organisations.findOne({ slug: orgSlug });
  if (!organisation) return { ok: false, reason: "no-org" };

  try {
    await db().members.insertOne({
      ...member,
      _id: new ObjectId(),
      orgId: organisation._id,
    } as MemberDoc);
    return { ok: true };
  } catch (error) {
    // The unique index on `emailLower` is what decides, not a prior read: two
    // simultaneous sign-ups with the same address would both pass a check-then-
    // insert and one would win silently.
    if ((error as { code?: number }).code === 11000) return { ok: false, reason: "taken" };
    throw error;
  }
}

/**
 * Resolve an uploaded font for the public asset route.
 *
 * The third and last exception, and the narrowest. `/f/{org}/{sha}.woff2` is
 * fetched by a browser with no credentials — a `@font-face` src cannot carry a
 * session — so there is no scope to apply. It is safe because the org slug
 * decides which customer's assets are reachable and the digest decides which
 * bytes: guessing one without the other returns nothing, and what it returns is
 * a font file the customer chose to publish.
 */
export async function unscopedFontAsset(orgSlug: string, sha256: string) {
  const organisation = await db().organisations.findOne({ slug: orgSlug });
  if (!organisation) return undefined;

  const asset = await db().fontAssets.findOne({ _id: sha256, orgId: organisation._id });
  return asset ?? undefined;
}

/**
 * Resolve a published version for the public stylesheet route.
 *
 * A named helper rather than two finds in the route, because the route had the
 * `orgId` threaded through by hand — which is the exact shape this layer exists
 * to remove. Here the organisation is resolved first and every filter below it
 * carries that id, so a request for `/t/southmere/clinical@1.css` cannot return
 * Northwind's palette even though the theme slug matches.
 *
 * Returns the theme and the version together: the route needs both, and
 * fetching them separately is how one of the two loses its scope.
 */
export async function unscopedPublishedVersion(orgSlug: string, slug: string, version: number) {
  const organisation = await db().organisations.findOne({ slug: orgSlug });
  if (!organisation) return undefined;

  const theme = await db().themes.findOne({ orgId: organisation._id, slug });
  if (!theme) return undefined;

  const published = await db().themeVersions.findOne({
    orgId: organisation._id,
    themeId: theme._id,
    version,
  });
  if (!published) return undefined;

  return { organisation, theme, version: published };
}

/* ==========================================================================
 * The catalogue: global by nature, and the fourth documented exception.
 *
 * The three exceptions above are all "there is no session yet, or none is
 * possible". This one is different in kind and worth reading as such: there
 * *is* a session, and the data still is not scoped — because the catalogue is
 * not customer data. Every organisation sees the same Empty State System at
 * the same price.
 *
 * The line these helpers must never cross is returning anything that says who
 * *bought* something. Entitlements, orders and tokens all carry `orgId` and go
 * through `scoped()` exactly like themes; only the shelf is shared.
 * ======================================================================== */

/** Everything listed, newest first. */
export function unscopedCatalogListed() {
  return db()
    .catalogItems.find({ listedAt: { $ne: null } })
    .sort({ listedAt: -1 });
}

/** One item by the slug in its URL. Unlisted items are still resolvable by id. */
export function unscopedCatalogItem(slug: string) {
  return db().catalogItems.findOne({ slug });
}

export function unscopedCatalogItemById(id: ObjectId) {
  return db().catalogItems.findOne({ _id: id });
}

export function unscopedCatalogItemsByIds(ids: readonly ObjectId[]) {
  return db().catalogItems.find({ _id: { $in: [...ids] } });
}

/** A published catalogue version. Immutable once written. */
export function unscopedCatalogVersion(itemId: ObjectId, version: number) {
  return db().catalogVersions.findOne({ itemId, version });
}

/** Purchased bytes, by digest. The entitlement is checked before this is called. */
export function unscopedMarketAsset(sha256: string) {
  return db().marketAssets.findOne({ _id: sha256 });
}

/**
 * Resolve an organisation from a registry token.
 *
 * The Zoblocks CLI sends `Authorization: Bearer …` and no cookie, so there is no
 * session to scope by — the token *is* the identity. Safe because the lookup
 * is by digest, the caller never names an organisation, and everything the
 * route does afterwards goes through `scoped(token.orgId)`.
 *
 * Expiry is enforced here rather than left to the TTL index: a TTL monitor
 * runs about once a minute, so a token is briefly readable after it expires,
 * and "briefly" is not a word that belongs in an authorisation check.
 */
export async function unscopedRegistryToken(hash: string) {
  const token = await db().registryTokens.findOne({ _id: hash });
  if (!token) return undefined;
  if (token.revokedAt) return undefined;
  if (token.expiresAt.getTime() <= Date.now()) return undefined;
  return token;
}

/** Stamp last use. Failure here must never fail the request it is recording. */
export async function unscopedTouchRegistryToken(hash: string) {
  await db().registryTokens.updateOne({ _id: hash }, { $set: { lastUsedAt: new Date() } });
}
