/**
 * Reading the shelf.
 *
 * The catalogue is global — every organisation sees the same items at the same
 * prices — so these read through the `unscopedCatalog*` helpers in `scope.ts`,
 * which sit beside sign-in and the public stylesheet as documented exceptions.
 * The moment a function here starts answering "who bought this", it stops
 * being a catalogue read and goes through `scoped()` like everything else.
 *
 * That boundary is the reason `listing()` takes an `orgId` and joins rather
 * than accepting an entitlement set from its caller: the join is the only
 * place the two halves meet, and having exactly one of them is what keeps the
 * global half from quietly learning about customers.
 */

import { ObjectId } from "mongodb";
import {
  unscopedCatalogItem,
  unscopedCatalogItemById,
  unscopedCatalogItemsByIds,
  unscopedCatalogListed,
  unscopedCatalogVersion,
} from "@/db/scope";
import type { CatalogItemDoc, CatalogVersionDoc, EntitlementDoc } from "@/db/collections";
import { MarketError, heldIncludingRevoked } from "./entitlements";

export interface Listed {
  item: CatalogItemDoc;
  /** A live entitlement. Revoked ones are reported through `entitlement`. */
  owned: boolean;
  entitlement?: EntitlementDoc;
}

/** Everything listed, with this organisation's ownership joined on. */
export async function listing(orgId: ObjectId): Promise<Listed[]> {
  const [items, entitlements] = await Promise.all([
    unscopedCatalogListed().toArray(),
    heldIncludingRevoked(orgId),
  ]);

  const byItem = new Map(entitlements.map((e) => [e.itemId.toHexString(), e]));

  return items.map((item) => {
    const entitlement = byItem.get(item._id.toHexString());
    return {
      item,
      owned: entitlement !== undefined && entitlement.revokedAt === null,
      ...(entitlement ? { entitlement } : {}),
    };
  });
}

export interface Detail extends Listed {
  /** The live version. Absent for an item listed before anything was published. */
  version?: CatalogVersionDoc;
}

export async function detail(orgId: ObjectId, slug: string): Promise<Detail> {
  const item = await unscopedCatalogItem(slug);
  if (!item) throw new MarketError("No such item.");

  const [version, entitlements] = await Promise.all([
    unscopedCatalogVersion(item._id, item.liveVersion),
    heldIncludingRevoked(orgId),
  ]);

  const entitlement = entitlements.find((e) => e.itemId.equals(item._id));

  return {
    item,
    owned: entitlement !== undefined && entitlement.revokedAt === null,
    ...(entitlement ? { entitlement } : {}),
    ...(version ? { version } : {}),
  };
}

/** The item behind a slug, or a refusal. Unlisted items resolve — see below. */
export async function itemBySlug(slug: string): Promise<CatalogItemDoc> {
  const item = await unscopedCatalogItem(slug);
  if (!item) throw new MarketError("No such item.");
  return item;
}

/**
 * Deliberately resolves unlisted items.
 *
 * Withdrawing something from sale must not break delivery for the customers
 * who already bought it. Listing controls the shelf; the entitlement controls
 * access, and conflating the two is how a customer loses a pack because
 * marketing retired it.
 */
export async function itemById(id: ObjectId): Promise<CatalogItemDoc | undefined> {
  return (await unscopedCatalogItemById(id)) ?? undefined;
}

export async function itemsByIds(ids: readonly ObjectId[]): Promise<CatalogItemDoc[]> {
  if (ids.length === 0) return [];
  return unscopedCatalogItemsByIds(ids).toArray();
}

/** The files a purchase actually delivers, at the version the org is entitled to. */
export async function versionFor(
  item: CatalogItemDoc,
  version = item.liveVersion,
): Promise<CatalogVersionDoc> {
  const found = await unscopedCatalogVersion(item._id, version);
  if (!found) throw new MarketError(`${item.title} has no published version ${version}.`);
  return found;
}

/**
 * `18000` → `$180.00`.
 *
 * Minor units in the database and formatting at the edge, because a price
 * stored as a float is a price that eventually renders as `179.99999`.
 */
export function priceLabel(item: Pick<CatalogItemDoc, "priceMinor" | "currency">): string {
  if (item.priceMinor === null) return "By arrangement";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: item.currency.toUpperCase(),
    minimumFractionDigits: item.priceMinor % 100 === 0 ? 0 : 2,
  }).format(item.priceMinor / 100);
}

/** What the catalogue calls each kind, in the words a customer reads. */
export const KIND_LABEL = {
  icons: "Icon pack",
  illustration: "Illustration",
  theme: "Theme pack",
  component: "Component",
  fixtures: "Fixtures",
} as const;
