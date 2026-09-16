/**
 * ZoBlocks Premium: the theming console and the design packs, on one page.
 *
 * Marketplace and Pro were two nav items until 16 Sep 2026, when Rahul asked
 * for them to be merged under one plain name. `/pro` and `/marketplace` now
 * redirect to `/premium` (see `next.config.ts`).
 *
 * The console tile names live here so the page's contents list and the tiles
 * themselves cannot disagree. The packs live in `market-collection.ts`.
 */

export const PREMIUM_HREF = "/premium";
export const CONSOLE_ID = "theming-console";
export const PACKS_ID = "design-packs";

/** Heading of each console tile, in the order the bento lays them out. */
export const CONSOLE_TILES = {
  app: "Brand preview",
  ramp: "Colour ramp",
  gate: "Contrast gate",
  deliver: "Versioned stylesheets",
  hosts: "Framework bridges",
} as const;

/** The smaller capabilities, listed together in the last tile. */
export const CONSOLE_ALSO = [
  {
    id: "figma",
    name: "Figma plugin",
    body: "Variables out, a proposal back. Proposing is not publishing.",
  },
  {
    id: "roles",
    name: "Roles and permissions",
    body: "Thirteen capabilities per role. Publish and rollback are admin only.",
  },
  {
    id: "playground",
    name: "Playground",
    body: "Brand, mode, density and colour vision over real components.",
  },
  {
    id: "licensing",
    name: "Pack licensing",
    body: "Design packs, licensed to the organisation, perpetually.",
  },
] as const;

/** Every console capability the page shows, for its contents list. */
export const CONSOLE_FEATURES: readonly string[] = [
  ...Object.values(CONSOLE_TILES),
  ...CONSOLE_ALSO.map((item) => item.name),
];
