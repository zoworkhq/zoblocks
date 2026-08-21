import { Binary, ObjectId } from "mongodb";
import {
  REPLACEABLE_SLOTS,
  emptyAssets,
  iconSlot,
  type IconOverride,
} from "@oxygenui-design/theme";
import { checkLogo } from "@oxygenui-design/theme/logo";
import type { Authorized } from "./authorize";
import { ThemeError, orgSlug } from "./themes";
import { assetHref } from "./brand-assets";

/**
 * Replaced glyphs, stored the way every other asset is.
 *
 * Content-addressed, checked by the same `checkLogo` that refuses executable
 * artwork, served from the same route. A glyph is a smaller file with a
 * narrower purpose and exactly the same danger: an SVG is a document, and one
 * served from this origin runs with the console's privileges whether it is a
 * hospital's wordmark or its send arrow.
 */

/** 64 KB. A single glyph is a handful of paths; anything larger is not one. */
export const MAX_ICON_BYTES = 64 * 1024;

export interface IconUploadResult {
  saved: readonly string[];
  /** Files that were skipped, and why — never a silent partial success. */
  skipped: readonly { name: string; reason: string }[];
}

/**
 * Accept one glyph.
 *
 * SVG only, and that is a real constraint rather than caution: these are
 * delivered as CSS masks, which take the shape and discard the paint. A raster
 * glyph would mask by its alpha channel — a PNG with an opaque background
 * becomes a filled square, which is a broken toolbar that looks like a
 * rendering bug rather than a bad upload.
 */
function check(bytes: Uint8Array, slot: string) {
  const spec = iconSlot(slot);
  if (spec.locked) {
    throw new ThemeError(`${spec.label} cannot be replaced.`, [spec.locked]);
  }

  if (bytes.byteLength > MAX_ICON_BYTES) {
    throw new ThemeError(
      `That glyph is ${Math.round(bytes.byteLength / 1024)} KB; the limit is ${MAX_ICON_BYTES / 1024} KB.`,
      ["A single glyph is a handful of paths. Anything this size is artwork rather than an icon."],
    );
  }

  const result = checkLogo(bytes);
  if (!result.ok) throw new ThemeError(result.reason, result.detail ? [result.detail] : []);

  if (result.format !== "svg") {
    throw new ThemeError("A glyph has to be an SVG.", [
      "Icons are drawn as CSS masks, which keep the shape and discard the colour. A raster image masks by its transparency, so a PNG with a solid background would render as a filled square.",
    ]);
  }

  return result;
}

export async function uploadIcons(
  auth: Authorized,
  themeId: ObjectId,
  files: readonly { slot: string; name: string; bytes: Uint8Array }[],
): Promise<IconUploadResult> {
  const theme = await auth.data.themes.findOne({ _id: themeId });
  if (!theme) throw new ThemeError("No such theme.");

  const org = await orgSlug(auth);
  const saved: string[] = [];
  const skipped: { name: string; reason: string }[] = [];

  for (const file of files) {
    if (!REPLACEABLE_SLOTS.includes(file.slot)) {
      skipped.push({ name: file.name, reason: "no slot with that name" });
      continue;
    }

    let checked;
    try {
      checked = check(file.bytes, file.slot);
    } catch (error) {
      /*
       * A bad file in a set of twenty-nine does not fail the other twenty-eight.
       *
       * A designer dropping a whole set has one glyph the exporter mangled;
       * refusing the batch means they fix it and re-upload everything, and the
       * second attempt has a different glyph wrong. Each file stands alone and
       * the ones that failed are named.
       */
      skipped.push({
        name: file.name,
        reason: error instanceof ThemeError ? error.message : "could not be read",
      });
      continue;
    }

    const existing = await auth.data.fontAssets.findOne({ _id: checked.sha256 });
    if (!existing) {
      await auth.data.fontAssets.insertOne({
        _id: checked.sha256,
        bytes: new Binary(file.bytes),
        format: "svg" as never,
        size: checked.bytes,
        originalName: file.name,
        uploadedAt: new Date(),
        uploadedBy: new ObjectId(auth.member.id),
      });
    }

    const override: IconOverride = {
      slot: file.slot,
      sha256: checked.sha256,
      src: assetHref(org, checked.sha256, "svg"),
      uploadedAt: new Date().toISOString(),
    };

    await writeOverride(auth, themeId, override);
    saved.push(file.slot);
  }

  if (saved.length > 0) {
    await auth.data.audit.insertOne({
      _id: new ObjectId(),
      actorId: new ObjectId(auth.member.id),
      action: "theme.logo-uploaded",
      subject: theme.slug,
      detail: `${saved.length} glyph${saved.length === 1 ? "" : "s"} · ${saved.join(", ")}`,
      at: new Date(),
    });
  }

  return { saved, skipped };
}

/**
 * One slot, written atomically.
 *
 * The same shape brand artwork uses, and for the same reason: rebuilding
 * `assets` from a value read a moment ago erases whatever another writer
 * changed in between — which here would mean uploading a set of glyphs and
 * keeping only the last one.
 */
async function writeOverride(auth: Authorized, themeId: ObjectId, override: IconOverride) {
  const touched = { updatedAt: new Date(), updatedBy: new ObjectId(auth.member.id) };

  await auth.data.themes.updateOne(
    { _id: themeId, assets: { $exists: false } },
    { $set: { assets: emptyAssets() } },
  );
  await auth.data.themes.updateOne(
    { _id: themeId, "assets.icons": { $exists: false } },
    { $set: { "assets.icons": [] } },
  );

  const replaced = await auth.data.themes.updateOne(
    { _id: themeId, "assets.icons.slot": override.slot },
    { $set: { "assets.icons.$[entry]": override, ...touched } },
    { arrayFilters: [{ "entry.slot": override.slot }] },
  );

  if (replaced.matchedCount === 0) {
    await auth.data.themes.updateOne(
      { _id: themeId, "assets.icons.slot": { $ne: override.slot } },
      { $push: { "assets.icons": override }, $set: touched },
    );
    await auth.data.themes.updateOne(
      { _id: themeId, "assets.icons.slot": override.slot },
      { $set: { "assets.icons.$[entry]": override, ...touched } },
      { arrayFilters: [{ "entry.slot": override.slot }] },
    );
  }
}

/** Put one slot back to the shipped glyph. */
export async function removeIcon(auth: Authorized, themeId: ObjectId, slot: string): Promise<void> {
  await auth.data.themes.updateOne(
    { _id: themeId },
    {
      $pull: { "assets.icons": { slot } },
      $set: { updatedAt: new Date(), updatedBy: new ObjectId(auth.member.id) },
    },
  );
}
