/**
 * Accepting a customer's font file.
 *
 * The checking is not here — it is `checkFont` in `@zoblocks/theme`,
 * which works from the bytes rather than the filename and is tested against
 * a PNG renamed to `.woff2`. This module is the part that has a database: store
 * the bytes under their digest, attach a `@font-face` to the theme, and record
 * who did it.
 *
 * Two properties worth stating because they are load-bearing rather than tidy:
 *
 *   **Keyed by digest.** A re-upload of the same face is idempotent, two themes
 *   can share one stored copy, and "are these the bytes we approved" is
 *   answerable by recomputing rather than by trusting a name.
 *
 *   **Served from its own path with `nosniff` and CORP.** A customer's bytes
 *   are a customer's bytes; they get immutable cache headers because the URL
 *   contains the digest, and they never execute in this origin.
 */

import { Binary, ObjectId } from "mongodb";
import { emptyAssets, MAX_FONT_BYTES, checkFont, type FontFace } from "@zoblocks/theme";
import type { Authorized } from "./authorize";
import { ThemeError } from "./themes";

/** `/f/{org}/{sha256}.{ext}` — the immutable asset path. */
export function fontHref(orgSlug: string, sha256: string, format: string): string {
  const extension = format === "truetype" ? "ttf" : format === "opentype" ? "otf" : format;
  return `/f/${orgSlug}/${sha256}.${extension}`;
}

export interface UploadResult {
  face: FontFace;
  /** Absent when the container could not be read without decompressing it. */
  tabularNumerals: boolean | undefined;
  reused: boolean;
}

/**
 * Validate, store, and attach a face to a theme.
 *
 * The family name is the customer's to choose and is *not* read from the file:
 * a name inside a font is not something to trust into a CSS declaration, and
 * the emitter would have to escape it anyway. What comes from the bytes is the
 * format, the size, the digest and whether tabular figures are present.
 */
export async function uploadFont(
  auth: Authorized,
  themeId: ObjectId,
  input: { bytes: Uint8Array; filename: string; family: string; weight?: string },
): Promise<UploadResult> {
  const theme = await auth.data.themes.findOne({ _id: themeId });
  if (!theme) throw new ThemeError("No such theme.");

  const family = input.family.trim();
  if (!family) throw new ThemeError("Give the family a name.");
  if (family.length > 64) throw new ThemeError("That family name is too long.");

  const check = await checkFont(input.bytes, input.filename);
  if (!check.ok) {
    throw new ThemeError(check.reason, check.detail ? [check.detail] : []);
  }

  const organisation = await auth.data.organisation.get();
  if (!organisation) throw new ThemeError("Organisation not found.");

  // Idempotent by digest: the same bytes uploaded twice are one document.
  const existing = await auth.data.fontAssets.findOne({ _id: check.sha256 });
  if (!existing) {
    await auth.data.fontAssets.insertOne({
      _id: check.sha256,
      bytes: new Binary(input.bytes),
      format: check.format,
      size: check.bytes,
      ...(check.tabularNumerals === undefined ? {} : { tabularNumerals: check.tabularNumerals }),
      originalName: input.filename,
      uploadedAt: new Date(),
      uploadedBy: new ObjectId(auth.member.id),
    });
  }

  const face: FontFace = {
    family,
    // Absolute, because `fontFaceSchema` validates it as a URL and a browser
    // fetching a stylesheet from a CDN needs an origin it can resolve.
    src: new URL(
      fontHref(organisation.slug, check.sha256, check.format),
      process.env.CONSOLE_ASSET_ORIGIN ?? "https://assets.zoblocks.design",
    ).toString(),
    weight: input.weight?.trim() || "400",
    style: "normal",
    sha256: check.sha256,
    ...(check.tabularNumerals === undefined ? {} : { tabularNumerals: check.tabularNumerals }),
  };

  /*
   * One face per family: uploading a new file for a family replaces it rather
   * than stacking. A theme with two `@font-face` blocks naming one family and
   * one weight is a race the browser resolves however it likes.
   */
  /*
   * Array operators, not a whole-document rewrite.
   *
   * Rebuilding `assets` from a value read a moment ago erases anything another
   * writer changed in between — and because `assets` also holds brand artwork,
   * that is not confined to fonts: uploading a typeface would silently drop a
   * logo somebody saved while the font was being checked. Each statement here
   * is atomic and touches only the entry it names.
   */
  const touched = { updatedAt: new Date(), updatedBy: new ObjectId(auth.member.id) };

  await auth.data.themes.updateOne(
    { _id: themeId, assets: { $exists: false } },
    { $set: { assets: emptyAssets() } },
  );

  const replaced = await auth.data.themes.updateOne(
    { _id: themeId, "assets.fonts.family": family },
    { $set: { "assets.fonts.$[face]": face, ...touched } },
    { arrayFilters: [{ "face.family": family }] },
  );

  if (replaced.matchedCount === 0) {
    await auth.data.themes.updateOne(
      { _id: themeId, "assets.fonts.family": { $ne: family } },
      {
        // `$slice` keeps the cap where the array is, rather than in a length
        // check that only holds if every writer remembers to run it.
        $push: { "assets.fonts": { $each: [face], $slice: -8 } },
        $set: touched,
      },
    );
    await auth.data.themes.updateOne(
      { _id: themeId, "assets.fonts.family": family },
      { $set: { "assets.fonts.$[face]": face, ...touched } },
      { arrayFilters: [{ "face.family": family }] },
    );
  }

  await auth.data.audit.insertOne({
    _id: new ObjectId(),
    actorId: new ObjectId(auth.member.id),
    action: "theme.font-uploaded",
    subject: theme.slug,
    detail: `${family} · ${check.format} · ${(check.bytes / 1024).toFixed(0)} kB · ${check.sha256.slice(0, 12)}`,
    at: new Date(),
  });

  return { face, tabularNumerals: check.tabularNumerals, reused: Boolean(existing) };
}

/** Detach a face. The stored bytes stay — another theme may reference them. */
export async function removeFont(
  auth: Authorized,
  themeId: ObjectId,
  family: string,
): Promise<void> {
  const theme = await auth.data.themes.findOne({ _id: themeId });
  if (!theme) throw new ThemeError("No such theme.");

  await auth.data.themes.updateOne(
    { _id: themeId },
    {
      $pull: { "assets.fonts": { family } },
      $set: { updatedAt: new Date(), updatedBy: new ObjectId(auth.member.id) },
    },
  );
}

export { MAX_FONT_BYTES };
