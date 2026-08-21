import { Binary, ObjectId } from "mongodb";
import {
  BRAND_ASSET_ROLES,
  emptyAssets,
  type BrandAssetFile,
  type BrandAssetRole,
} from "@oxygenui-design/theme";
import { checkBrandAsset } from "@oxygenui-design/theme/logo";
import type { Authorized } from "./authorize";
import { ThemeError, orgSlug } from "./themes";

/**
 * Brand artwork, stored the way fonts are.
 *
 * Content-addressed by SHA-256, so uploading the same file twice is one
 * document and the serving URL is immutable by construction. The bytes live in
 * the org-scoped collection and the theme carries only the reference — which is
 * what lets a published version pin the artwork it shipped with, exactly as it
 * pins its fonts.
 *
 * One asset per role, replaced rather than appended. Two favicons is not a
 * state anybody wants; it is a state somebody reaches by uploading twice.
 */

/** `/f/{org}/{sha}.{ext}` — the same route that serves fonts. */
export function assetHref(orgSlug: string, sha256: string, format: string): string {
  return `/f/${orgSlug}/${sha256}.${format}`;
}

export interface UploadResult {
  asset: BrandAssetFile;
  /** Accepted, with something the person should know. Never a silent pass. */
  warnings: readonly string[];
}

export async function uploadBrandAsset(
  auth: Authorized,
  themeId: ObjectId,
  input: { bytes: Uint8Array; filename: string; role: string; alt: string },
): Promise<UploadResult> {
  const theme = await auth.data.themes.findOne({ _id: themeId });
  if (!theme) throw new ThemeError("No such theme.");

  const role = input.role as BrandAssetRole;
  if (!BRAND_ASSET_ROLES.includes(role)) throw new ThemeError("Unknown asset role.");

  /*
   * The alternative text is checked here rather than trusted from the form.
   *
   * A mark renders at the top of every screen a customer's application draws,
   * so an unnamed one is a WCAG 1.1.1 failure repeated on every page. The empty
   * string is allowed and means *deliberately decorative* — a real choice when
   * the organisation's name already sits beside the mark in text. What is not
   * allowed is whitespace pretending to be a name.
   */
  const alt = input.alt.trim();
  if (alt.length > 120) throw new ThemeError("That alternative text is too long.");
  if (input.alt.length > 0 && alt.length === 0) {
    throw new ThemeError("Alternative text cannot be only spaces.", [
      "Leave it completely empty to mark the artwork decorative, or describe it — usually the organisation's name.",
    ]);
  }

  const check = checkBrandAsset(input.bytes, role);
  if (!check.ok) throw new ThemeError(check.reason, check.detail ? [check.detail] : []);

  // Idempotent by digest, like fonts: the same bytes are one document.
  const existing = await auth.data.fontAssets.findOne({ _id: check.sha256 });
  if (!existing) {
    await auth.data.fontAssets.insertOne({
      _id: check.sha256,
      bytes: new Binary(input.bytes),
      // The font collection's `format` union does not cover images, and
      // widening it would let a font route serve a PNG. Stored as the artwork
      // kind it is; the serving route branches on the extension it was given.
      format: check.format as never,
      size: check.bytes,
      originalName: input.filename,
      uploadedAt: new Date(),
      uploadedBy: new ObjectId(auth.member.id),
    });
  }

  const asset: BrandAssetFile = {
    role,
    sha256: check.sha256,
    format: check.format,
    // Recorded rather than derived at read time, so an exported theme carries
    // a URL that resolves outside this app — the same reason a font face
    // stores its `src`.
    src: assetHref(await orgSlug(auth), check.sha256, check.format),
    alt,
    // Measured, so a host can reserve the space and the header stops jumping.
    ...(check.size
      ? { width: Math.round(check.size.width), height: Math.round(check.size.height) }
      : {}),
    uploadedAt: new Date().toISOString(),
  };

  /*
   * Written with array operators rather than by rewriting `assets` wholesale.
   *
   * Read-modify-write on the containing document loses concurrent writes: two
   * people uploading two *different* assets at the same moment each read the
   * array, each append their own, and whichever saves second erases the other.
   * It surfaced as a browser test timing out on a Remove button that never
   * appeared, which is what that failure mode looks like from the outside —
   * not an error, just an upload that quietly did not happen.
   *
   * Each statement below is atomic on its own, and the append is guarded by
   * the role being absent, so a writer that loses the race changes nothing
   * rather than overwriting.
   */
  const touched = {
    updatedAt: new Date(),
    updatedBy: new ObjectId(auth.member.id),
  };

  // Older documents predate the field. Creating it is idempotent and only
  // matches while it is genuinely missing.
  await auth.data.themes.updateOne(
    { _id: themeId, assets: { $exists: false } },
    { $set: { assets: emptyAssets() } },
  );
  await auth.data.themes.updateOne(
    { _id: themeId, "assets.brand": { $exists: false } },
    { $set: { "assets.brand": [] } },
  );

  const replaced = await auth.data.themes.updateOne(
    { _id: themeId, "assets.brand.role": role },
    { $set: { "assets.brand.$[slot]": asset, ...touched } },
    { arrayFilters: [{ "slot.role": role }] },
  );

  if (replaced.matchedCount === 0) {
    await auth.data.themes.updateOne(
      // Guarded: if another writer inserted this role in between, the filter
      // does not match and this becomes a no-op instead of a duplicate.
      { _id: themeId, "assets.brand.role": { $ne: role } },
      { $push: { "assets.brand": asset }, $set: touched },
    );
    // One retry covers exactly that case, and cannot loop: the role now exists.
    await auth.data.themes.updateOne(
      { _id: themeId, "assets.brand.role": role },
      { $set: { "assets.brand.$[slot]": asset, ...touched } },
      { arrayFilters: [{ "slot.role": role }] },
    );
  }

  await auth.data.audit.insertOne({
    _id: new ObjectId(),
    actorId: new ObjectId(auth.member.id),
    action: "theme.logo-uploaded",
    subject: theme.slug,
    detail: [
      role,
      check.format,
      `${(check.bytes / 1024).toFixed(0)} kB`,
      check.size ? `${check.size.width}×${check.size.height}` : "size unknown",
      check.sha256.slice(0, 12),
    ].join(" · "),
    at: new Date(),
  });

  return { asset, warnings: check.warnings ?? [] };
}

/** Detach one role. The bytes stay — another theme may reference them. */
export async function removeBrandAsset(
  auth: Authorized,
  themeId: ObjectId,
  role: string,
): Promise<void> {
  const theme = await auth.data.themes.findOne({ _id: themeId });
  if (!theme) throw new ThemeError("No such theme.");

  // `$pull` for the same reason the upload uses `$set` with an array filter:
  // rewriting the whole array would erase whatever another writer just added.
  await auth.data.themes.updateOne(
    { _id: themeId },
    {
      $pull: { "assets.brand": { role } },
      $set: { updatedAt: new Date(), updatedBy: new ObjectId(auth.member.id) },
    },
  );
}
