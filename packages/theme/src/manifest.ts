/**
 * What a stylesheet cannot deliver.
 *
 * The CSS carries the tokens and the three marks that CSS actually draws. It
 * cannot carry four things a host still needs:
 *
 *   - **Alternative text.** A mark placed with `background-image` announces
 *     nothing. A host that renders a real `<img>` — which it should, for the
 *     logo in its header — has to get the words from somewhere, and the
 *     somewhere has to be the theme, or the alt text stops being reviewed
 *     alongside the artwork it describes.
 *   - **Assets CSS never draws.** A favicon is placed by `<link>`, a
 *     link-preview card by `<meta>`. Emitting those as custom properties would
 *     put two permanently unusable declarations in every customer's stylesheet.
 *   - **Absolute URLs.** A relative `/f/…` path resolves against the host's own
 *     origin, which is not where the artwork lives. Fine inside the console;
 *     useless in an email that Outlook renders three days later.
 *   - **The size on record**, so a host can set width and height and stop the
 *     page reflowing when the mark loads.
 *
 * Served at the same immutable, version-pinned URL as the stylesheet, because
 * artwork and tokens that disagree about which version they are is exactly the
 * bug the pinning exists to prevent.
 */

import { BRAND_ASSETS } from "./assets";
import type { ThemeDocument } from "./document";

export interface ManifestAsset {
  role: string;
  label: string;
  /** Absolute, so it survives being pasted into an email template. */
  href: string;
  format: string;
  /** Empty means deliberately decorative — render `alt=""`, not a filename. */
  alt: string;
  width?: number;
  height?: number;
  /** Where the host is expected to put it. */
  usage: string;
}

export interface ThemeManifest {
  slug: string;
  name: string;
  version: number;
  /** The stylesheet these assets belong with. Same version, by construction. */
  stylesheet: string;
  assets: ManifestAsset[];
}

/**
 * The manifest for one published theme.
 *
 * `origin` is where this console serves from. It is a parameter rather than
 * read from configuration because the value that matters is the one in the
 * request that produced this response — a console reachable on two hostnames
 * must not hand out the other one's URLs.
 */
export function brandManifest(
  theme: ThemeDocument,
  { origin, orgSlug }: { origin: string; orgSlug: string },
): ThemeManifest {
  const base = origin.replace(/\/+$/, "");

  const assets: ManifestAsset[] = [];
  // Iterated in registry order rather than upload order, so the response is
  // stable between publishes and a diff of two manifests is a diff in content.
  for (const spec of BRAND_ASSETS) {
    const file = (theme.assets.brand ?? []).find((a) => a.role === spec.role);
    if (!file) continue;

    assets.push({
      role: file.role,
      label: spec.label,
      href: file.src.startsWith("http") ? file.src : `${base}${file.src}`,
      format: file.format,
      alt: file.alt,
      ...(file.width ? { width: file.width } : {}),
      ...(file.height ? { height: file.height } : {}),
      usage: spec.delivery,
    });
  }

  return {
    slug: theme.slug,
    name: theme.name,
    version: theme.version,
    stylesheet: `${base}/t/${orgSlug}/${theme.slug}@${theme.version}.css`,
    assets,
  };
}
