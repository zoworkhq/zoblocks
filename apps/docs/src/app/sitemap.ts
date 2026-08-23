import type { MetadataRoute } from "next";
import { CATALOG } from "@/lib/catalog";

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
const SITE = "https://oxygenui.design";

const STATIC_ROUTES: ReadonlyArray<{ path: string; priority: number }> = [
  { path: "", priority: 1 },
  { path: "/components", priority: 0.9 },
  { path: "/showcase", priority: 0.7 },
  { path: "/pro", priority: 0.7 },
  { path: "/marketplace", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${SITE}${route.path}`,
      changeFrequency: "weekly" as const,
      priority: route.priority,
    })),
    ...CATALOG.map((component) => ({
      url: `${SITE}/components/${component.seo?.slug ?? component.name}`,
      changeFrequency: "monthly" as const,
      // Stable components are the ones worth landing on. An experimental
      // component ranking above a finished one sends the first-time reader to
      // the least representative page in the library.
      priority: component.status === "stable" ? 0.8 : 0.5,
    })),
  ];
}
