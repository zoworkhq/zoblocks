/**
 * The catalogue, fetched from the console.
 *
 * The console owns what is for sale — it is where a pack is published, priced
 * and delivered — so this site reads it rather than keeping a second copy that
 * drifts. What it deliberately does not do is read the console's database:
 *
 *   **A public marketing page must not fall over when a private console's
 *   MongoDB does.** `/c/catalog.json` is cached hard and marked
 *   `stale-while-revalidate` for a day, so a console outage shows up here as
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

export const CONSOLE = process.env.NEXT_PUBLIC_CONSOLE_URL ?? "https://console.oxygenui.design";

/** Where a reader goes to actually buy one. Buying needs an organisation. */
export const buyHref = (slug: string) => `${CONSOLE}/market/${slug}`;

export async function catalogue(): Promise<MarketItem[]> {
  try {
    const response = await fetch(`${CONSOLE}/c/catalog.json`, {
      // Ten minutes. The catalogue changes when somebody publishes a pack,
      // which is rare; the cost of being ten minutes late is nothing and the
      // cost of hammering the console on every request is not.
      next: { revalidate: 600 },
    });
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
