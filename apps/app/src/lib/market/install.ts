/**
 * Putting a purchase to work.
 *
 * The rule that shapes every branch below: **nothing bought ever reaches
 * production by itself.** An icon pack lands in a theme's draft; a theme pack
 * arrives as a draft theme. Publishing stays where it was — behind
 * `theme.publish`, held by admins only — because publishing is what reaches a
 * customer's live application, and a purchase must not become a back door
 * around the separation the app already draws between editing and
 * publishing.
 *
 * The second rule: **purchased artwork goes through the same gate uploaded
 * artwork does.** `uploadIcons` runs `checkLogo`, which refuses executable
 * SVGs. Skipping it for our own files would rest on "we drew it", and that is
 * exactly the assumption that eventually ships a glyph with a script in it.
 */

import { ObjectId } from "mongodb";
import { unscopedMarketAsset } from "@/db/scope";
import type { Authorized } from "@/lib/authorize";
import { uploadIcons } from "@/lib/icons";
import { createTheme, saveDraft, ThemeError } from "@/lib/themes";
import { detail, versionFor } from "./catalogue";
import { assertEntitled, MarketError } from "./entitlements";

export interface InstallResult {
  message: string;
  /** Where the person should go next, when there is somewhere. */
  href?: string;
}

/**
 * Install an owned item.
 *
 * `themeId` is required for the kinds that edit a theme and ignored for the
 * kinds that do not, rather than there being two entry points — the caller is
 * a form, and a form that has to know which of two actions to post to is a
 * form that eventually posts to the wrong one.
 */
export async function install(
  auth: Authorized,
  slug: string,
  themeId?: ObjectId,
): Promise<InstallResult> {
  const { item } = await detail(auth.member.orgId, slug);
  const entitlement = await assertEntitled(auth.member.orgId, item._id);
  const version = await versionFor(item, entitlement.versionLine);

  switch (item.kind) {
    case "icons": {
      if (!themeId) throw new MarketError("Choose which theme to install the glyphs into.");

      const glyphs = version.files.filter((file) => file.slot);
      if (glyphs.length === 0) {
        throw new MarketError(`${item.title} has no glyphs mapped to slots.`);
      }

      const files = [];
      for (const file of glyphs) {
        const asset = await unscopedMarketAsset(file.sha256);
        if (!asset) continue;
        files.push({
          slot: file.slot as string,
          name: file.path,
          bytes: new Uint8Array(asset.bytes.buffer),
        });
      }

      /*
       * Copied into the organisation's own asset store rather than served from
       * ours, and that is deliberate: an installed glyph ends up in a published
       * stylesheet, which a browser fetches with no credentials. It cannot live
       * behind an entitlement check without breaking the customer's site.
       *
       * The consequence is stated in the licence rather than hidden: a glyph
       * already installed survives a refund. Revocation stops future fetches of
       * the pack; it does not reach into a stylesheet somebody published.
       */
      const { saved, skipped } = await uploadIcons(auth, themeId, files);

      await auth.data.audit.insertOne({
        _id: new ObjectId(),
        actorId: new ObjectId(auth.member.id),
        action: "market.installed",
        subject: item.slug,
        detail: `${saved.length} glyph(s) into a draft`,
        at: new Date(),
      });

      const note = skipped.length > 0 ? ` ${skipped.length} skipped.` : "";
      return {
        message: `Installed ${saved.length} glyph${saved.length === 1 ? "" : "s"} into the draft. Publish the theme when you are ready.${note}`,
      };
    }

    case "theme": {
      if (!version.tokens) throw new MarketError(`${item.title} has no token document.`);

      /*
       * A brand colour is required to create a theme, and taking it from the
       * pack rather than defaulting means the new draft looks like what was
       * bought from the first render — before the tokens below overwrite the
       * generated ramp anyway.
       */
      const brand = version.tokens.ref?.brand?.["600"];
      let created;
      try {
        created = await createTheme(auth, {
          name: item.title,
          brandColour: typeof brand === "string" ? brand : "#10b995",
        });
      } catch (error) {
        if (error instanceof ThemeError && error.message.includes("already exists")) {
          throw new MarketError(`A theme called "${item.title}" already exists.`, [
            "Rename or archive it first — installing would otherwise overwrite a design somebody is working on.",
          ]);
        }
        throw error;
      }

      await saveDraft(auth, created.id, version.tokens, `installed from ${item.slug}`);

      await auth.data.audit.insertOne({
        _id: new ObjectId(),
        actorId: new ObjectId(auth.member.id),
        action: "market.installed",
        subject: item.slug,
        detail: `created draft theme ${created.slug}`,
        at: new Date(),
      });

      return {
        message: `Created the draft theme "${item.title}". Nothing is live until an admin publishes it.`,
        href: `/themes/${created.slug}`,
      };
    }

    case "component":
      return {
        message:
          "Components install with the ZoBlocks CLI. Mint an access token and add the @zoblocks-pro registry to zoblocks.json.",
        href: "/market/tokens",
      };

    case "illustration":
    case "fixtures":
      return {
        message:
          "Download the pack — these are files for your own repository rather than theme tokens.",
        href: `/market/${item.slug}`,
      };
  }
}
