/**
 * Console document shapes and indexes.
 *
 * Four collections, and the whole design turns on one property: **every
 * document that belongs to a customer carries `orgId`, and nothing reads a
 * collection directly.** Reads go through `scope.ts`, which cannot construct a
 * query without one. Mongo has no row-level security and no foreign keys, so a
 * single `find({ slug })` written in a hurry returns another customer's theme —
 * and it returns it successfully, which is the worst kind of bug to have in a
 * multi-tenant product.
 *
 * Two conventions Mongo cannot enforce, stated because they are load-bearing:
 *
 *   - **Published versions are immutable.** Editing a published theme creates a
 *     draft; publishing writes a new `themeVersions` document and moves a
 *     pointer. Rollback is therefore a pointer move rather than a restore, and
 *     "which theme was live when this screenshot was taken" is answerable —
 *     which matters when a regulator asks.
 *   - **Nothing referenced is ever deleted.** Members are disabled, themes are
 *     archived. Versions point at users and there is no foreign key to stop an
 *     orphan.
 */

import type { Binary, Collection, Db, ObjectId } from "mongodb";
import type {
  ThemeAssets,
  ThemeStatus,
  ThemeTokens,
  ThemeTokensInput,
  ValidationRecord,
} from "@oxygenui-design/theme";

/**
 * Four roles, against hq's two.
 *
 * The split that matters is Designer / Admin: a designer edits and previews,
 * an admin publishes. Publishing is what reaches a customer's production
 * application, so it is the action worth a second person — and separating them
 * is cheaper than an approval workflow.
 */
export type MemberRole = "admin" | "designer" | "developer" | "viewer";
export type MemberStatus = "pending" | "active" | "disabled";

/** Which UI frameworks an organisation's applications run on. */
export type FrameworkId = "antd" | "mui";

export interface OrganisationDoc {
  _id: ObjectId;
  name: string;
  /** Appears in every theme URL, so it is immutable after the first publish. */
  slug: string;
  /** Bridges enabled for this organisation. "none" is always available. */
  frameworks: FrameworkId[];
  defaultThemeId: ObjectId | null;
  createdAt: Date;
}

export interface MemberDoc {
  _id: ObjectId;
  orgId: ObjectId;
  name: string;
  email: string;
  /**
   * Lowercased, and the only thing the unique index covers — so "Ada@" and
   * "ada@" cannot become two accounts for one person.
   */
  emailLower: string;
  passwordHash: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: Date;
  approvedAt: Date | null;
  approvedBy: ObjectId | null;
}

/**
 * The current state of a theme — its draft, and a pointer at what is live.
 *
 * `tokens` here is the *working* copy, which may be an unpublished draft.
 * Anything served to an application comes from `themeVersions`, never from
 * this document, so an in-progress edit cannot reach production.
 */
export interface ThemeDoc {
  _id: ObjectId;
  orgId: ObjectId;
  name: string;
  slug: string;
  status: ThemeStatus;
  /**
   * The draft being edited, in the shape the database actually stores.
   *
   * `ThemeTokensInput`, not `ThemeTokens`, and the difference is a real bug
   * class rather than pedantry. `ThemeTokens` promises all three tiers are
   * present because zod fills them with `.default({})` — but that happens on
   * *parse*, and `findOne` returns raw BSON that was never parsed. The seeded
   * theme carries only `ref`, so the promise is false for the very first
   * document anybody meets.
   *
   * Typed honestly, the compiler now forces every reader through
   * `withTierDefaults` instead of leaving it to whoever remembers. That is the
   * whole reason to change it: the previous version type-checked a screen that
   * threw "Cannot convert undefined or null to object" the moment it rendered.
   *
   * A *published version* is different — see `ThemeVersionDoc` below, whose
   * tokens went through the publish path and really are complete.
   */
  tokens: ThemeTokensInput;
  /**
   * Fonts and the icon set.
   *
   * Optional because themes created before uploads existed do not have it, and
   * a published version is immutable — so the absence is permanent rather than
   * transitional, exactly as it is for the token tiers.
   */
  assets?: ThemeAssets;
  /** Highest published version, or null before the first publish. */
  liveVersion: number | null;
  updatedAt: Date;
  updatedBy: ObjectId;
  createdAt: Date;
  createdBy: ObjectId;
}

/** Immutable. One document per publish, never updated after it is written. */
export interface ThemeVersionDoc {
  _id: ObjectId;
  orgId: ObjectId;
  themeId: ObjectId;
  version: number;
  tokens: ThemeTokens;
  /**
   * The fonts as they were at publish, snapshotted rather than referenced.
   *
   * Immutability is the whole point of a version: reading them from the live
   * theme document instead would mean uploading a new face silently changed
   * what every already-published version serves. Optional because versions
   * published before uploads existed do not carry it.
   */
  assets?: ThemeAssets;
  validation: ValidationRecord;
  publishedAt: Date;
  publishedBy: ObjectId;
  /** Set when this version was created by rolling back to an earlier one. */
  rolledBackFrom?: number;
  reason?: string;
}

/**
 * An uploaded font, bytes and all.
 *
 * In Mongo rather than on a disk or in object storage, and the reason is the
 * cap: `MAX_FONT_BYTES` is 2 MB against a 16 MB document limit, so a face fits
 * with room to spare and the deployment stays one database and no bucket. If
 * the cap ever rises this is the thing to revisit.
 *
 * Keyed by digest, not by name. Two customers uploading the same face store it
 * once, a re-upload is idempotent, and "are these the bytes we approved" is
 * answerable by recomputing rather than by trusting a filename.
 */
export interface FontAssetDoc {
  /** Lowercase hex SHA-256 of the bytes, and the id in the serving URL. */
  _id: string;
  orgId: ObjectId;
  bytes: Binary;
  format: "woff2" | "woff" | "truetype" | "opentype";
  size: number;
  /** As reported by `checkFont`; `undefined` for a container it cannot read. */
  tabularNumerals?: boolean;
  originalName: string;
  uploadedAt: Date;
  uploadedBy: ObjectId;
}

/** Append-only. Never updated, never deleted. */
export interface AuditDoc {
  _id: ObjectId;
  orgId: ObjectId;
  actorId: ObjectId;
  action:
    | "theme.created"
    | "theme.updated"
    | "theme.published"
    | "theme.rolledback"
    | "theme.archived"
    | "theme.restored"
    | "member.approved"
    | "member.role-changed"
    | "org.frameworks-changed"
    | "org.renamed"
    | "theme.font-uploaded"
    | "theme.logo-uploaded"
    | "market.purchased"
    | "market.granted"
    | "market.installed"
    | "market.revoked"
    | "market.token-minted"
    | "market.token-revoked";
  subject: string;
  detail?: string;
  at: Date;
}

/*
 * Auth support, carried over from hq unchanged.
 *
 * Sessions, reset grants and failed attempts all expire through TTL indexes
 * rather than a sweep. Deliberately *not* org-scoped: a session identifies a
 * member, and the member document is what carries the organisation — putting
 * `orgId` on the session too would create a second source of truth for which
 * customer a request belongs to, and the two could disagree.
 */

export interface SessionDoc {
  /** SHA-256 of the cookie value. The value itself is never stored. */
  _id: string;
  userId: ObjectId;
  expiresAt: Date;
  createdAt: Date;
  userAgent: string | null;
}

export interface PasswordResetDoc {
  /** SHA-256 of the token. */
  _id: string;
  userId: ObjectId;
  expiresAt: Date;
  usedAt: Date | null;
  createdBy: ObjectId | null;
  createdAt: Date;
}

export interface LoginAttemptDoc {
  _id: ObjectId;
  /** "email:someone@example.com" or "ip:1.2.3.4". */
  key: string;
  createdAt: Date;
}

/* ==========================================================================
 * Marketplace
 *
 * Five collections, and the first documents in this app that are deliberately
 * **not** org-scoped. That needs saying loudly, because every scoping mistake
 * in a multi-tenant database looks like an ordinary query in review.
 *
 * The split is: the *catalogue* is the same for every customer — one Empty
 * State System, one price, one set of bytes — while everything expressing
 * **who paid for what** carries `orgId` and goes through `scoped()` like the
 * rest of the app. So `catalogItems`, `catalogVersions` and `marketAssets` are
 * global and reached only through the `unscopedCatalog*` helpers in `scope.ts`,
 * beside the sign-in and public-stylesheet exceptions; `orders`,
 * `entitlements` and `registryTokens` are scoped and reached no differently
 * from themes.
 *
 * Two conventions carried over from themes because they are the same problem:
 *
 *   - **Catalogue versions are immutable.** One document per publish, never
 *     updated. An organisation is entitled to a *version line*, so "which
 *     version did they buy and which have they installed" stays answerable
 *     after we ship an update — and a refund argument is settled by reading a
 *     row rather than by remembering.
 *   - **Nothing referenced is deleted.** An entitlement is revoked, not
 *     removed. A revoked row is the evidence that access was withdrawn and
 *     when; a deleted one is indistinguishable from one that never existed.
 * ======================================================================== */

/** What a catalogue item is, which decides how it is delivered. */
export type CatalogKind = "icons" | "illustration" | "theme" | "component" | "fixtures";

/**
 * What was checked, stored beside the thing it was checked on.
 *
 * The console already refuses to serve a theme version validated by an older
 * validator, because tightening a rule must not leave older palettes live.
 * This is the same idea pointed at purchased content: the item page renders
 * *this* record rather than an adjective, so "accessible" is a fact a customer
 * can hand to their own procurement rather than a word we chose.
 *
 * `doesNotClaim` is not defensive boilerplate. It is the difference between
 * artwork and a medical claim, and it is the sentence a hospital's clinical
 * safety officer reads first.
 */
export interface Provenance {
  accessibility: {
    checkedAt: Date;
    /** Bumped when the check tightens, exactly like `validatorVersion`. */
    checkerVersion: number;
    contrastPairs: { passed: number; total: number; floor: string };
    forcedColors: "verified" | "not-applicable";
    /** How meaning survives when colour does not. */
    nonColourChannel: string;
  };
  /** Absent for items with no clinical content at all — decorative artwork. */
  clinical?: {
    reviewedBy: string;
    registration: string;
    reviewedAt: Date;
    scope: string;
    doesNotClaim: readonly string[];
  };
  authorship: {
    /** Disclosed rather than implied. Procurement asks, and being caught is worse than being boring. */
    method: "hand-drawn" | "ai-assisted, human-finished" | "generated from tokens";
    thirdPartyContent: readonly string[];
  };
  licence: {
    id: string;
    grant: string;
    derivatives: string;
    resale: string;
  };
  /** Which FHIR resources the item speaks about, if any. */
  fhir?: { maps: readonly string[]; release: string };
}

/**
 * One purchasable thing. Global — every organisation sees the same row.
 *
 * `priceMinor` and `stripePriceId` live here and **nowhere else** that a
 * browser can reach. Checkout is created from a slug the client sends and a
 * price this document holds, which is the whole defence against the standard
 * marketplace defect: an endpoint that accepts `{ priceId }` sells a $450
 * component for whatever the caller says it costs.
 */
export interface CatalogItemDoc {
  _id: ObjectId;
  /** In the URL, so immutable once listed. */
  slug: string;
  kind: CatalogKind;
  title: string;
  blurb: string;
  /** Minor units. `null` for an item that is only ever granted by contract. */
  priceMinor: number | null;
  currency: string;
  stripePriceId: string | null;
  /** Highest published catalogue version. */
  liveVersion: number;
  /** `null` means framework-agnostic; otherwise the bridges it is drawn for. */
  frameworks: FrameworkId[] | null;
  provenance: Provenance;
  /** `null` while unlisted — drafted, or withdrawn without being deleted. */
  listedAt: Date | null;
  /**
   * Announced but not yet buyable.
   *
   * Distinct from `listedAt: null`, which hides an item entirely. A coming-soon
   * item is deliberately visible: it is the roadmap, and a customer deciding
   * whether to build something themselves deserves to know we are building it.
   *
   * Absent means available, so every item that predates this field stays
   * buyable. Every purchase path checks it — an announcement somebody can pay
   * for is worse than no announcement.
   */
  comingSoon?: true;
}

/** A file inside a catalogue version. Bytes live once, in `marketAssets`. */
export interface CatalogFile {
  /** Path inside the pack, e.g. `icons/route-iv.svg`. */
  path: string;
  /** Lowercase hex SHA-256 — the `_id` of the bytes. */
  sha256: string;
  contentType: string;
  size: number;
  /**
   * Which icon slot this file replaces, for `kind: "icons"`.
   *
   * Here rather than parsed out of the filename, because a filename is a
   * label and a slot is a contract: renaming the file must not silently stop
   * an install from filling a slot.
   */
  slot?: string;
}

/** Immutable. One document per publish, never updated after it is written. */
export interface CatalogVersionDoc {
  _id: ObjectId;
  itemId: ObjectId;
  version: number;
  files: CatalogFile[];
  /** For `kind: "theme"`, the token document imported on install. */
  tokens?: ThemeTokensInput;
  /** For `kind: "component"`, the registry item served to the shadcn CLI. */
  registry?: Record<string, unknown>;
  notes: string;
  publishedAt: Date;
}

/**
 * Purchased bytes, stored the way fonts are: content-addressed and global.
 *
 * Keyed by digest rather than by name, so shipping the same glyph in two packs
 * stores it once and "are these the bytes we published" is answerable by
 * recomputing rather than by trusting a path. Global rather than copied per
 * organisation because the bytes are ours; what is per-organisation is the
 * entitlement to fetch them.
 */
export interface MarketAssetDoc {
  /** Lowercase hex SHA-256 of the bytes. */
  _id: string;
  bytes: Binary;
  contentType: string;
  size: number;
  uploadedAt: Date;
}

/**
 * One purchase attempt.
 *
 * `_id` is the Stripe Checkout Session id, and that is the idempotency
 * mechanism rather than a convenience: fulfilment can be called twice — once
 * by the webhook, once by the customer landing on the success page, possibly
 * at the same moment — and the unique key is what makes the second call a
 * no-op instead of a second entitlement. It is the same reasoning that keys a
 * font by its digest and claims the first admin with one atomic write.
 */
export interface OrderDoc {
  _id: string;
  orgId: ObjectId;
  /** `null` when the order was reconstructed by a webhook after a session expired. */
  memberId: ObjectId | null;
  /** Catalogue slugs, as resolved server-side when checkout was created. */
  items: string[];
  amountMinor: number | null;
  currency: string | null;
  status: "open" | "paid" | "refunded" | "expired";
  /** Set exactly once, by whichever caller wins the claim. */
  fulfilledAt: Date | null;
  createdAt: Date;
  refundedAt?: Date;
  /**
   * Set at fulfilment, so a refund can find its way back here.
   *
   * `charge.refunded` arrives with a charge and no session, and the webhook has
   * no organisation to scope by until something tells it one. The charge
   * carries the metadata we put on the PaymentIntent, which is what actually
   * resolves the org — this field is the second, checkable route to the same
   * answer rather than the only one.
   */
  paymentIntent?: string;
}

/**
 * What an organisation may fetch, and why.
 *
 * Attached to the organisation, never to the member who bought it: a designer
 * who leaves does not take the icon pack with them, and the receipt does not
 * live in one person's inbox.
 */
export interface EntitlementDoc {
  _id: ObjectId;
  orgId: ObjectId;
  itemId: ObjectId;
  /** The version line bought into. Updates inside the line are included. */
  versionLine: number;
  grantedAt: Date;
  /** `null` when a webhook granted it — there is no member on that request. */
  grantedBy: ObjectId | null;
  /** An order `_id`, or `contract:<reason>` for a bundle inside an engagement. */
  grantedVia: string;
  revokedAt: Date | null;
  revokedReason: string | null;
}

/**
 * A credential the shadcn CLI sends to install a paid component.
 *
 * Only the SHA-256 is stored — the token itself is shown once at mint time and
 * never again — so a dump of this collection yields nothing usable. Exactly
 * the reasoning behind `sessions` and `password_resets`, and for the same
 * reason: the thing being protected is reachable by anyone holding the string.
 */
/**
 * What a token may reach.
 *
 * `registry` installs purchased components through the shadcn CLI; `figma`
 * reads themes and proposes drafts through the plugin API. They are separate
 * because the people are separate: handing a designer a Figma key that also
 * pulls down paid component source would grant a privilege nobody asked for,
 * and revoking the designer's key would break the CI that installs components.
 *
 * One scope per token, deliberately. A combined key is a key nobody can revoke
 * without deciding which of two things to break.
 */
export const TOKEN_SCOPES = ["registry", "figma"] as const;
export type TokenScope = (typeof TOKEN_SCOPES)[number];

export interface RegistryTokenDoc {
  /** SHA-256 of the token value. */
  _id: string;
  orgId: ObjectId;
  /**
   * Absent on every token minted before scopes existed, which is why nothing
   * reads this field directly — `scopeOf()` supplies `registry` for them,
   * because the registry was the only thing a token could reach.
   */
  scope?: TokenScope;
  label: string;
  createdBy: ObjectId;
  createdAt: Date;
  lastUsedAt: Date | null;
  /** TTL, so an abandoned token expires without anybody remembering to revoke it. */
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface Collections {
  organisations: Collection<OrganisationDoc>;
  members: Collection<MemberDoc>;
  themes: Collection<ThemeDoc>;
  themeVersions: Collection<ThemeVersionDoc>;
  fontAssets: Collection<FontAssetDoc>;
  audit: Collection<AuditDoc>;
  sessions: Collection<SessionDoc>;
  passwordResets: Collection<PasswordResetDoc>;
  loginAttempts: Collection<LoginAttemptDoc>;
  catalogItems: Collection<CatalogItemDoc>;
  catalogVersions: Collection<CatalogVersionDoc>;
  marketAssets: Collection<MarketAssetDoc>;
  orders: Collection<OrderDoc>;
  entitlements: Collection<EntitlementDoc>;
  registryTokens: Collection<RegistryTokenDoc>;
}

export function collections(db: Db): Collections {
  return {
    organisations: db.collection<OrganisationDoc>("organisations"),
    members: db.collection<MemberDoc>("members"),
    themes: db.collection<ThemeDoc>("themes"),
    themeVersions: db.collection<ThemeVersionDoc>("themeVersions"),
    fontAssets: db.collection<FontAssetDoc>("font_assets"),
    audit: db.collection<AuditDoc>("audit"),
    sessions: db.collection<SessionDoc>("sessions"),
    passwordResets: db.collection<PasswordResetDoc>("password_resets"),
    loginAttempts: db.collection<LoginAttemptDoc>("login_attempts"),
    catalogItems: db.collection<CatalogItemDoc>("catalog_items"),
    catalogVersions: db.collection<CatalogVersionDoc>("catalog_versions"),
    marketAssets: db.collection<MarketAssetDoc>("market_assets"),
    orders: db.collection<OrderDoc>("orders"),
    entitlements: db.collection<EntitlementDoc>("entitlements"),
    registryTokens: db.collection<RegistryTokenDoc>("registry_tokens"),
  };
}

/**
 * Idempotent. Applied by `pnpm db:indexes` and by the same GitHub workflow
 * shape hq uses.
 */
export async function ensureIndexes(db: Db): Promise<void> {
  const c = collections(db);

  await c.organisations.createIndex({ slug: 1 }, { unique: true });

  await c.members.createIndex({ emailLower: 1 }, { unique: true });
  await c.members.createIndex({ orgId: 1, status: 1 });

  // Unique *per organisation*, not globally: two customers may both have a
  // theme called `clinical`, and the URL is scoped by org slug.
  await c.themes.createIndex({ orgId: 1, slug: 1 }, { unique: true });

  // The version a request for `slug@7` resolves through, and the uniqueness
  // that makes a double publish impossible rather than merely unlikely.
  await c.themeVersions.createIndex({ themeId: 1, version: -1 }, { unique: true });
  await c.themeVersions.createIndex({ orgId: 1, publishedAt: -1 });

  // Scoped lookups, and the digest is already the `_id`.
  await c.fontAssets.createIndex({ orgId: 1, uploadedAt: -1 });

  await c.audit.createIndex({ orgId: 1, at: -1 });

  // TTL, so expiry is the database's job rather than a cron nobody notices has
  // stopped.
  await c.sessions.createIndex({ userId: 1 });
  await c.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await c.passwordResets.createIndex({ userId: 1 });
  await c.passwordResets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await c.loginAttempts.createIndex({ key: 1, createdAt: -1 });
  await c.loginAttempts.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });

  /* Marketplace -------------------------------------------------------- */

  // Global, not per organisation: the catalogue is the same for everybody, so
  // the slug in `/market/empty-state-system` means one item worldwide.
  await c.catalogItems.createIndex({ slug: 1 }, { unique: true });
  await c.catalogItems.createIndex({ listedAt: -1 });

  // The uniqueness that makes a double publish impossible rather than unlikely
  // — the same index `themeVersions` carries, for the same reason.
  await c.catalogVersions.createIndex({ itemId: 1, version: -1 }, { unique: true });

  await c.orders.createIndex({ orgId: 1, createdAt: -1 });

  // One live entitlement per organisation per item. Without this, a webhook
  // delivered twice in a way the claim did not catch leaves two rows, and
  // revoking one of them silently leaves access in place.
  await c.entitlements.createIndex({ orgId: 1, itemId: 1 }, { unique: true });
  await c.entitlements.createIndex({ orgId: 1, grantedAt: -1 });

  await c.registryTokens.createIndex({ orgId: 1, createdAt: -1 });
  await c.registryTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}
