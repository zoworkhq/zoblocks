import type { MetadataRoute } from "next";
import { BLOCKS } from "@/lib/blocks";
import { CATALOG } from "@/lib/catalog";
import { isReady } from "@/lib/readiness";
import { shelf } from "@/lib/marketplace";
import { inCollection } from "@/lib/market-collection";

/**
 * The sitemap, derived from the catalog rather than listed by hand.
 *
 * A hand-written list is a second place to remember a new component, and the
 * one nobody remembers — the page ships, gets linked from the index, and is
 * simply never submitted. Deriving it means adding a component adds its URL.
 *
 * `slug` comes from the component's `seo` when it has declared one, because
 * that is the URL the canonical tag on the page points at. Two different URLs
 * for the same page is the specific mistake a sitemap is supposed to prevent.
 */
const SITE = "https://zoblocks.design";

const STATIC_ROUTES: ReadonlyArray<{ path: string; priority: number }> = [
  { path: "", priority: 1 },
  { path: "/components", priority: 0.9 },
  { path: "/install", priority: 0.8 },
  { path: "/showcase", priority: 0.7 },
  { path: "/premium", priority: 0.7 },
  { path: "/compare", priority: 0.6 },
];

/*
 * Async, because the marketplace shelf is.
 *
 * The component half of this file was already right — derived, not hand-listed,
 * with priority set by maturity. It just stopped at components: six showcase
 * blocks and four marketplace packs are statically generated, reachable only by
 * clicking through an index, and appeared in no sitemap at all. They are among
 * the most link-worthy pages on the domain and were effectively unlisted.
 *
 * `shelf()` can fail — it reaches for a catalogue the console owns. A sitemap
 * that throws is a sitemap that 500s, so a failure drops the packs and keeps
 * every other URL rather than taking the whole file down with it.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const packs = await shelf()
    .then((items) =>
      items
        .filter((item) => inCollection(item.slug))
        .map((item) => ({
          url: `${SITE}/marketplace/${item.slug}`,
          changeFrequency: "monthly" as const,
          priority: 0.5,
        })),
    )
    // A sitemap that throws is a sitemap that 500s. Losing the packs is worth
    // keeping the other 57 URLs indexable.
    .catch<MetadataRoute.Sitemap>(() => []);

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${SITE}${route.path}`,
      changeFrequency: "weekly" as const,
      priority: route.priority,
    })),
    ...CATALOG.filter((component) => isReady(component.name)).map((component) => ({
      url: `${SITE}/components/${component.seo?.slug ?? component.name}`,
      changeFrequency: "monthly" as const,
      // Stable components are the ones worth landing on. An experimental
      // component ranking above a finished one sends the first-time reader to
      // the least representative page in the library.
      priority: component.status === "stable" ? 0.8 : 0.5,
    })),
    // Blocks are whole screens rather than parts, which makes them the pages a
    // reader is most likely to land on from a search for a clinical interface
    // rather than for a control. They rank above individual components.
    ...BLOCKS.map((block) => ({
      url: `${SITE}/showcase/${block.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...packs,
  ];
}
