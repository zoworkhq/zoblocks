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
    | "theme.logo-uploaded";
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
}
