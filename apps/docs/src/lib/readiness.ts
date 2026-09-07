/**
 * What is finished, and in what order it leads the catalogue.
 *
 * The list itself now lives in `@zoblocks/component-meta`, beside the
 * metadata it qualifies. It moved because two readers could not reach it here:
 * the generator that writes `llms.txt` runs outside this app, and both it and
 * the command palette were building component lists from the whole catalogue —
 * publishing sixteen URLs that 404. A card that says "Coming soon" over a URL
 * that still serves a full page is not a soft launch, it is a leak; a link to a
 * page that was never built is the same leak pointing the other way.
 *
 * This module stays as the seam the pages import, so nothing here had to learn
 * where the list went.
 *
 * The rename is the substantive part. `isReady` answered "does this have a
 * page", and the catalogue read it as "does this exist" — which is how fifteen
 * components that install from the registry today came to be badged
 * "Coming soon" beside a working install command. Documentation and
 * distribution are two facts now, and they have two names.
 */

export {
  DOCUMENTED_ORDER as READY_ORDER,
  isDocumented,
  documentedRank,
  distributionState,
  DISTRIBUTION_LABEL,
  DISTRIBUTION_CONTRACT,
  installCommandFor,
  type DistributionState,
} from "@zoblocks/component-meta";

import { isDocumented, documentedRank } from "@zoblocks/component-meta";

/** Whether a component has a page worth opening. */
export function isReady(name: string): boolean {
  return isDocumented(name);
}

/**
 * Rank for sorting: documented components first in their declared order,
 * everything else after, in whatever order it arrived.
 */
export function readyRank(name: string): number {
  return documentedRank(name);
}
