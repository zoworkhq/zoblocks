/**
 * The component catalog, as the docs site sees it.
 *
 * A thin, stable surface over generated data. Everything below is derived by
 * `pnpm gen` from each component's `*.meta.ts` plus its TypeScript types, so
 * nothing about a component is described in two places.
 *
 * This file is hand-written on purpose: it is the seam between the generator's
 * output shape and what pages import. When the generated shape changes, this
 * absorbs the change and the pages do not.
 */

import type { ComponentDoc } from "@zoblocks/component-meta";
import { BY_NAME, CATALOG } from "./generated/catalog";

export type {
  ComponentDoc,
  ComponentExportDoc,
  PropDoc,
  Stability,
  Tier,
} from "@zoblocks/component-meta";
export { STATUS_LABEL, STATUS_CONTRACT } from "@zoblocks/component-meta";
export { CATALOG, ALL_CATEGORIES } from "./generated/catalog";

export function getComponent(name: string): ComponentDoc | undefined {
  return BY_NAME.get(name);
}

/**
 * Related components, in both directions.
 *
 * `related` is authored per component and is rarely symmetric — an author adds
 * a link from the new component to the old one and does not go back to edit the
 * old one. Reading the graph both ways means the link appears on both pages
 * without anyone having to maintain the reverse edge.
 */
export function getRelated(name: string): ComponentDoc[] {
  const component = BY_NAME.get(name);
  if (!component) return [];

  const names = new Set(component.related);
  for (const other of CATALOG) {
    if (other.related.includes(name)) names.add(other.name);
  }
  names.delete(name);

  return [...names]
    .map((n) => BY_NAME.get(n))
    .filter((c): c is ComponentDoc => c !== undefined)
    .sort((a, b) => a.title.localeCompare(b.title));
}
