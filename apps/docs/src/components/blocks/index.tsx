"use client";

/**
 * Slug to component, and the frame a block renders inside.
 *
 * The viewport attribute drives the layout rather than the browser width,
 * because a block is shown inside a frame on a page that is itself wider than
 * the block. Container queries would be the honest tool; they are not reliable
 * enough across the browsers this site supports to hang the whole gallery on,
 * so the frame states its own width and the CSS reads it.
 *
 * `auto` measures that width instead of being told it. The block pages used
 * the default, which was `desktop`, so a phone got a 216px sidebar beside a
 * 60px page — while the mobile CSS for every block sat unused.
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

/** The frame widths the gallery viewer offers: 390px mobile, 768px tablet. */
export function viewportFor(width: number): Viewport {
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function BlockBody({ slug, vp = "auto" }: { slug: BlockSlug; vp?: Viewport | "auto" }) {
  const frame = React.useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = React.useState<Viewport>("desktop");

  React.useEffect(() => {
    if (vp !== "auto") return;
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setMeasured(viewportFor(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [vp]);

  const Body = BY_SLUG[slug];
  if (!Body) return null;
  return (
    <div ref={frame} className="oxb" data-vp={vp === "auto" ? measured : vp}>
      <Body />
    </div>
  );
}
