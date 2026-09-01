/**
 * The catalogue, fetched from the app.
 *
 * The app owns what is for sale — it is where a pack is published, priced
 * and delivered — so this site reads it rather than keeping a second copy that
 * drifts. What it deliberately does not do is read the app's database:
 *
 *   **A public marketing page must not fall over when a private app's
 *   MongoDB does.** `/c/catalog.json` is cached hard and marked
 *   `stale-while-revalidate` for a day, so an app outage shows up here as
 *   yesterday's catalogue rather than as a 500 on a page somebody arrived at
 *   from a search result.
 *
 * Every failure returns an empty list rather than throwing. A build that breaks
 * because a separate service was restarting is a build that will break again at
 * the worst possible time, and the page below reads perfectly well with nothing
 * in it — it just says so.
 */

export interface Provenance {
  accessibility: {
    checkedAt: string;
    checkerVersion: number;
    contrastPairs: { passed: number; total: number; floor: string };
    forcedColors: string;
    nonColourChannel: string;
  };
  clinical?: {
    reviewedBy: string;
    registration: string;
    reviewedAt: string;
    scope: string;
    doesNotClaim: string[];
  };
  authorship: { method: string; thirdPartyContent: string[] };
  licence: { id: string; grant: string; derivatives: string; resale: string };
  fhir?: { maps: string[]; release: string };
}

export interface MarketItem {
  slug: string;
  kind: "icons" | "illustration" | "theme" | "component" | "fixtures";
  title: string;
  blurb: string;
  price: { minor: number; currency: string } | null;
  version: number;
  frameworks: string[] | null;
  provenance: Provenance;
  files: number;
  publishedAt: string | null;
}

// Re-exported rather than redefined: `lib/app.ts` owns the address, and two
// copies of it drift the moment one deployment moves.
import { APP } from "./app";
import { PACK_LICENCE, PREVIEW_CATALOGUE, type PreviewArt } from "./market-preview";

export { APP };

/** Where a reader goes to actually buy one. Buying needs an organisation. */
export const buyHref = (slug: string) => `${APP}/market/${slug}`;

/**
 * `RequestInit` plus the field Next adds to it.
 *
 * Declared rather than inherited, because this module is compiled by two
 * programs. Next's own build sees `next-env.d.ts` and knows about `next`; the
 * root `tsconfig.json` reaches this file through `test/marketplace-public.test.ts`
 * and does not, so the plain `fetch` overload rejects the option and the root
 * typecheck fails while the app's passes. Narrower than adding Next's types to
 * the root program for one property.
 */
interface NextFetchInit extends RequestInit {
  next?: { revalidate?: number | false; tags?: string[] };
}

export async function catalogue(): Promise<MarketItem[]> {
  try {
    const init: NextFetchInit = {
      // Ten minutes. The catalogue changes when somebody publishes a pack,
      // which is rare; the cost of being ten minutes late is nothing and the
      // cost of hammering the app on every request is not.
      next: { revalidate: 600 },
    };
    const response = await fetch(`${APP}/c/catalog.json`, init);
    if (!response.ok) return [];
    const body = (await response.json()) as { items?: MarketItem[] };
    return body.items ?? [];
  } catch {
    return [];
  }
}

/**
 * An item as the shelf renders it, whichever half it came from.
 *
 * `source` is not decoration. A price the console served and a price this
 * repository remembers are different kinds of fact, and the page says which
 * one a reader is looking at rather than presenting both as live.
 */
export interface ShelfItem extends MarketItem {
  /**
   * Announced rather than built. Nothing exists to download yet.
   *
   * This is a fact about the pack, not about the shop, and the two came apart
   * the moment selling closed shelf-wide — see `SELLING_OPEN`. Ask
   * `purchasable` before offering a buy path; ask this one before claiming a
   * pack has files, a version or a measurement.
   */
  comingSoon: boolean;
  /**
   * Whether a reader can actually buy it today.
   *
   * False for everything while `SELLING_OPEN` is false, including packs that
   * are finished and measured.
   */
  purchasable: boolean;
  /** Every file the pack ships. Empty for an announced item, which ships none. */
  filePaths: string[];
  /** A real sample of the pack's own artwork, where it ships any. */
  art: PreviewArt[];
  /** The pack's own palette, for a theme pack. */
  swatches: { step: string; hex: string }[];
  source: "console" | "preview";
}

/** A shelf item before the shop's answer is attached to it. */
type ShelfEntry = Omit<ShelfItem, "purchasable">;

/** The date the seed publishes these under, so both halves agree on it. */
const PREVIEW_PUBLISHED = "2026-08-14T09:12:03.000Z";

function fromPreview(): ShelfEntry[] {
  return PREVIEW_CATALOGUE.map((item) => ({
    slug: item.slug,
    kind: item.kind,
    title: item.title,
    blurb: item.blurb,
    price: { minor: item.priceMinor, currency: item.currency },
    version: item.version,
    frameworks: item.frameworks ?? null,
    provenance: {
      accessibility: {
        checkedAt: PREVIEW_PUBLISHED,
        checkerVersion: 3,
        contrastPairs: {
          passed: item.checked?.contrastPairs ?? 0,
          total: item.checked?.contrastPairs ?? 0,
          floor: item.checked?.floor ?? "4.5:1",
        },
        forcedColors: item.checked?.forcedColors ?? "not-applicable",
        nonColourChannel: item.checked?.nonColourChannel ?? "not yet designed",
      },
      // `clinical` is deliberately absent. Nobody has reviewed these packs, and
      // the detail page renders the block only when it is present — so the
      // absence reads as "not yet reviewed" rather than as a claim.
      authorship: { method: item.authorship ?? "hand-drawn", thirdPartyContent: [] },
      licence: { ...PACK_LICENCE },
      ...(item.fhir ? { fhir: item.fhir } : {}),
    },
    files: item.files?.length ?? 0,
    publishedAt: item.comingSoon ? null : PREVIEW_PUBLISHED,
    comingSoon: item.comingSoon,
    filePaths: item.files ?? [],
    art: item.art ?? [],
    swatches: item.swatches ?? [],
    source: "preview",
  }));
}

/**
 * The pack's own artwork, which the console does not send.
 *
 * `catalog.json` carries `files: 4` — a count, not paths — and no SVG at all,
 * because the console's job is to say what is for sale and at what price, not
 * to serve illustrations. So when it answers, every published pack loses its
 * preview and the shelf renders "4 files · v2" where the empty-state drawings,
 * the severity ramp and the file manifests used to be. That is the storefront
 * getting worse the moment the backend starts working.
 *
 * Attaching this by slug is not merging two catalogues. The console still wins
 * outright on everything it owns — what exists, what it costs, which version,
 * whether it is published. This supplies one thing it has no field for, from
 * the repository the artwork is committed in.
 *
 * A pack the console publishes that this repository has never heard of gets no
 * artwork and falls back to its file count, which is honest: drawing something
 * for it would be inventing a picture of a pack nobody here has seen.
 */
const ARTWORK = new Map(
  PREVIEW_CATALOGUE.map((item) => [
    item.slug,
    { art: item.art ?? [], swatches: item.swatches ?? [], files: item.files ?? [] },
  ]),
);

/**
 * Drop the clinical review, whatever the console sent.
 *
 * No pack has been reviewed by a clinician. The seed says so in the field
 * itself — `reviewedBy` is the string "SEED DATA — nobody has reviewed this" —
 * and the detail page renders a reviewer when one is present, so a console with
 * a seeded database publishes "Clinically reviewed 2026-08-11 — SEED DATA —
 * nobody has reviewed this" to the open web. That is not a cosmetic bug. A
 * screenshot of it is indistinguishable from a real attestation, and this
 * product's entire claim is that its safety facts can be trusted.
 *
 * So the public site does not render a review at all, from any source. The
 * local fallback has never carried one; this makes the console agree, and the
 * page says review is pending instead — which is true.
 *
 * Re-enabling this is a deliberate act, not a cleanup. It needs a named
 * clinician with a registration, and it needs the console to distinguish a
 * verified review from a row somebody typed. Until both exist, the honest
 * output is the one below. See `test/marketplace-public.test.ts`.
 */
function withoutClinicalReview(provenance: Provenance): Provenance {
  const kept = { ...provenance };
  delete kept.clinical;
  return kept;
}

/**
 * The shelf, from the console when it answers and from this repository when it
 * does not.
 *
 * The console owns what is for sale and still wins outright: one item from it
 * replaces the whole local list rather than merging, because a half-live
 * catalogue is a catalogue nobody can reason about. What the fallback buys is
 * a page that works — `app.oxygenui.design` has no DNS record today, so every
 * fetch has failed and the storefront has rendered its empty state since the
 * day it shipped.
 */
/**
 * Nothing on the shelf is for sale yet.
 *
 * Checkout, entitlement and delivery all live in the console, and none of it
 * is open: `app.oxygenui.design` has no DNS record, so every buy control on
 * this site has been a link to a door that does not open. Until it does, the
 * storefront announces rather than sells.
 *
 * One switch here rather than a `comingSoon` guard added page by page, because
 * the listing, the detail page and anything else reading `shelf()` must not be
 * able to disagree about what is purchasable — the detail page was already
 * offering a buy CTA for packs the listing called unpurchasable.
 *
 * It sets `purchasable`, not `comingSoon`. Forcing `comingSoon` was the first
 * attempt and it overloaded the field with a second meaning: `comingSoon` had
 * said "nothing has been built" since the catalogue existed, and the preview
 * reads it to decide between a pack's file manifest and a placeholder motif.
 * With it forced true, `vitals-flowsheet` and `messy-fixtures` — both shipped,
 * both with files — advertised themselves on the open shelf as unbuilt. The
 * shop being shut is not a claim about what the packs contain.
 *
 * Flip this to `true` when the console can take money. Nothing else needs to
 * move: every buy path already asks `purchasable`.
 */
export const SELLING_OPEN = false;

export async function shelf(): Promise<ShelfItem[]> {
  const live = await catalogue();
  const items: ShelfEntry[] =
    live.length === 0
      ? fromPreview()
      : live.map((item) => {
          const local = ARTWORK.get(item.slug);
          return {
            ...item,
            provenance: withoutClinicalReview(item.provenance),
            comingSoon: item.publishedAt === null,
            filePaths: local?.files ?? [],
            art: local?.art ?? [],
            swatches: local?.swatches ?? [],
            source: "console",
          };
        });

  // Two questions, answered separately: does the pack exist, and can it be
  // bought. Only the second one is closed shelf-wide.
  return items.map((item) => ({
    ...item,
    purchasable: SELLING_OPEN && !item.comingSoon,
  }));
}

export async function findItem(slug: string): Promise<ShelfItem | undefined> {
  return (await shelf()).find((item) => item.slug === slug);
}

export const KIND_LABEL: Record<MarketItem["kind"], string> = {
  icons: "Icon pack",
  illustration: "Illustration",
  theme: "Theme pack",
  component: "Component",
  fixtures: "Fixtures",
};

/** `29000` → `$290`. Minor units in transit, formatting at the edge. */
export function priceLabel(price: MarketItem["price"]): string {
  if (!price) return "By arrangement";
  // Zero is a decision, not a missing price: the crisis-resources block is free
  // because charging for it is the wrong look. "$0" reads as a bug.
  if (price.minor === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency.toUpperCase(),
    minimumFractionDigits: price.minor % 100 === 0 ? 0 : 2,
  }).format(price.minor / 100);
}
