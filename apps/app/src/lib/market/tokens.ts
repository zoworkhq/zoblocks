/**
 * Credentials for the shadcn CLI.
 *
 * The shape is `sessions` and `password_resets`, deliberately: **only the
 * SHA-256 is stored.** The token is shown once, at mint time, and never again,
 * so a dump of this collection yields nothing anyone can install with. That is
 * the same reasoning the session cookie already gets, and it applies here for
 * the same reason — the thing being protected is reachable by anybody holding
 * the string.
 *
 * Three properties that make handing this to developers safe rather than
 * merely convenient:
 *
 *   - **Labelled.** "Ada's laptop" is revocable; an unlabelled token is a
 *     credential nobody dares revoke because nobody knows what it breaks.
 *   - **Expiring**, through a TTL index, so an abandoned token stops working
 *     without anyone remembering it exists.
 *   - **Revocable and audited**, so offboarding is one action with a record.
 */

import { createHash, randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { TOKEN_SCOPES, type RegistryTokenDoc, type TokenScope } from "@/db/collections";
import type { Authorized } from "@/lib/authorize";
import { MarketError } from "./entitlements";

/** 256 bits, base64url. Long enough that guessing is not a threat model. */
const TOKEN_BYTES = 32;

/** Ninety days. Long enough not to be a nuisance, short enough to matter. */
export const TOKEN_LIFETIME_DAYS = 90;

/**
 * Live tokens per organisation, per scope. A cap, so a leak is bounded.
 *
 * Counted per scope rather than in total, because the two are minted by
 * different people for different reasons: a designer refused a Figma key
 * because CI holds ten registry keys is a failure nobody can act on from the
 * screen they are looking at.
 */
export const MAX_TOKENS = 10;

/**
 * A token's scope, with the default that makes the field safe to add.
 *
 * Every token minted before scopes existed has no field, and the registry was
 * the only thing a token could reach — so absent means `registry`. Reading
 * `token.scope` directly anywhere else would treat those as scopeless, which a
 * `.includes()` would then read as "reaches nothing" or, worse, as a truthiness
 * check that reaches everything.
 */
export function scopeOf(token: Pick<RegistryTokenDoc, "scope">): TokenScope {
  return token.scope ?? "registry";
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface MintedToken {
  /** The only time this value exists outside the customer's machine. */
  token: string;
  label: string;
  scope: TokenScope;
  expiresAt: Date;
}

export async function mintToken(
  auth: Authorized,
  label: string,
  scope: TokenScope = "registry",
): Promise<MintedToken> {
  if (!TOKEN_SCOPES.includes(scope)) throw new MarketError("Unknown token scope.");

  const trimmed = label.trim();
  if (!trimmed) {
    throw new MarketError("Give the token a label.", [
      "Something that names the machine or the pipeline, so it can be revoked without guessing what breaks.",
    ]);
  }
  if (trimmed.length > 60) throw new MarketError("That label is too long.");

  /*
   * Counting registry tokens means counting the ones with no field at all.
   *
   * A plain `{ scope: "registry" }` would not see tokens minted before the
   * field existed, so an organisation at the cap could mint an eleventh by
   * being old enough. `$nin` over *every other* scope is the form that stays
   * correct when a third one is added — `$nin: ["figma"]` would silently start
   * counting it.
   */
  const others = TOKEN_SCOPES.filter((s) => s !== scope);
  const live = await auth.data.registryTokens.countDocuments({
    revokedAt: null,
    ...(scope === "registry" ? { scope: { $nin: others } } : { scope }),
  });
  if (live >= MAX_TOKENS) {
    throw new MarketError(`This organisation already has ${MAX_TOKENS} live ${scope} tokens.`, [
      "Revoke one you no longer recognise before minting another.",
    ]);
  }

  /*
   * `oxy_live_` rather than a bare string.
   *
   * Prefixed secrets are what secret scanners match on, so a token pasted into
   * a public repository is caught by GitHub's push protection instead of by us
   * noticing traffic six weeks later.
   */
  const token = `oxy_live_${randomBytes(TOKEN_BYTES).toString("base64url")}`;
  const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_DAYS * 24 * 60 * 60 * 1000);

  await auth.data.registryTokens.insertOne({
    _id: hashToken(token),
    scope,
    label: trimmed,
    createdBy: new ObjectId(auth.member.id),
    createdAt: new Date(),
    lastUsedAt: null,
    expiresAt,
    revokedAt: null,
  });

  await auth.data.audit.insertOne({
    _id: new ObjectId(),
    actorId: new ObjectId(auth.member.id),
    action: "market.token-minted",
    subject: trimmed,
    /*
     * The scope, in the log.
     *
     * The action name still says `market` because that is what these tokens
     * were for when the collection was written, and renaming an audit action
     * rewrites history for a word. What matters during an incident is which
     * key reached what, and that is here.
     */
    detail: scope,
    at: new Date(),
  });

  return { token, label: trimmed, scope, expiresAt };
}

export async function revokeToken(auth: Authorized, hash: string): Promise<void> {
  const token = await auth.data.registryTokens.findOne({ _id: hash });
  if (!token) throw new MarketError("No such token.");

  await auth.data.registryTokens.updateOne({ _id: hash }, { $set: { revokedAt: new Date() } });

  await auth.data.audit.insertOne({
    _id: new ObjectId(),
    actorId: new ObjectId(auth.member.id),
    action: "market.token-revoked",
    subject: token.label,
    detail: scopeOf(token),
    at: new Date(),
  });
}

/** For the screen. Carries digests, never anything that could be used to install. */
export async function listTokens(auth: Authorized) {
  return auth.data.registryTokens.find().sort({ createdAt: -1 }).toArray();
}
