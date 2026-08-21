"use client";

/**
 * Slug to component, and the frame a block renders inside.
 *
 * The viewport attribute drives the layout rather than the browser width,
 * because a block is shown inside a frame on a page that is itself wider than
 * the block. Container queries would be the honest tool; they are not reliable
 * enough across the browsers this site supports to hang the whole gallery on,
 * so the frame states its own width and the CSS reads it.
 */

import * as React from "react";
import { Dashboard01 } from "./dashboard-01";
import { Note01 } from "./note-01";
import { Patient01 } from "./patient-01";
import { Copilot01 } from "./copilot-01";
import type { BlockSlug } from "@/lib/blocks";

export type Viewport = "desktop" | "tablet" | "mobile";

/* Keyed by the union rather than by string: a registry entry with no
   component here will not compile. */
const BY_SLUG: Record<BlockSlug, () => React.JSX.Element> = {
  "dashboard-01": Dashboard01,
  "note-01": Note01,
  "patient-01": Patient01,
  "copilot-01": Copilot01,
};

export function BlockBody({ slug, vp = "desktop" }: { slug: BlockSlug; vp?: Viewport }) {
  const Body = BY_SLUG[slug];
  if (!Body) return null;
  return (
    <div className="oxb" data-vp={vp}>
      <Body />
    </div>
  );
}
