/**
 * What is finished, and in what order it leads the catalogue.
 *
 * One list, because three places need the same answer and must not be able to
 * disagree: the catalogue orders and tags from it, the card decides whether it
 * is a link from it, and the component route refuses to render a page for
 * anything not on it. A card that says "Coming soon" over a URL that still
 * serves a full page is not a soft launch, it is a leak.
 *
 * The five loaders are all here because they ship as a family — one core, five
 * faces, one shared reduced-motion contract — and each already carries its own
 * visual baselines. Marking four of the five unfinished would be a claim about
 * them that nothing in the repository supports.
 *
 * Order is the order they appear. Everything absent from this list is
 * announced rather than hidden: still on the shelf, still described, not yet
 * openable.
 */
export const READY_ORDER: readonly string[] = [
  "signature",
  "pulse-loader",
  "breath-loader",
  "helix-loader",
  "infusion-loader",
  "rhythm-loader",
  "tabs",
  "switch",
  "date-picker",
  "clinical-status",
  "accordion",
  "recorder",
];

const READY = new Set(READY_ORDER);

/** Whether a component has a page worth opening. */
export function isReady(name: string): boolean {
  return READY.has(name);
}

/**
 * Rank for sorting: ready components first in their declared order, everything
 * else after, in whatever order it arrived.
 */
export function readyRank(name: string): number {
  const index = READY_ORDER.indexOf(name);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}
