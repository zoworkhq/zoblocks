import { ZoworkProvenance } from "@/components/site/zowork-provenance";
import { zoworkMono, zoworkSans } from "@/components/site/zowork-fonts";

/**
 * Zowork, on the home page.
 *
 * Zowork is a healthcare engineering services company, and ZoBlocks is
 * something it makes. This section says so and sells the services: Zowork at
 * the centre, its four longest clients around it with what Zowork built for
 * each, then what a reader can hire Zowork for.
 *
 * ## Zowork's palette, in the reader's theme
 *
 * It wears zowork.com's palette and type. It shipped always-dark first and read
 * as a slab dropped into a light page — the same mistake the `/pro` panel made
 * — so it follows the theme now: zowork.com as published under dark, the same
 * palette re-cut for paper under light, and pure black and white under high
 * contrast. All three are token blocks in `globals.css`.
 *
 * This file stays a server component so the fonts load at module scope; the
 * bento and its motion live in `zowork-provenance.tsx`.
 */
export function ZoworkPractice() {
  return (
    <section
      id="zowork"
      aria-labelledby="zwp-title"
      className={`zwp scroll-mt-16 ${zoworkSans.variable} ${zoworkMono.variable}`}
    >
      <div className="relative mx-auto max-w-6xl section-major px-5 sm:px-8">
        <ZoworkProvenance />
        {/* Said once, under the bento, the way the Data Grid section says it. */}
        <p className="zwpNote">
          Screens inside the client tiles are illustrations, not client data.
        </p>
      </div>
    </section>
  );
}
