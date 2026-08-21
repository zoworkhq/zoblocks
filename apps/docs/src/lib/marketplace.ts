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

export async function findItem(slug: string): Promise<MarketItem | undefined> {
  return (await catalogue()).find((item) => item.slug === slug);
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency.toUpperCase(),
    minimumFractionDigits: price.minor % 100 === 0 ? 0 : 2,
  }).format(price.minor / 100);
}
