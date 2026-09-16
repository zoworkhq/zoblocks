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
import { Northwind } from "./northwind/app";
import type { Route } from "./northwind/shell";
import type { BlockSlug } from "@/lib/blocks";

export type Viewport = "desktop" | "tablet" | "mobile";

/* Keyed by the union rather than by string: a registry entry with no
   route here will not compile. Every block is the same application, opened
   at a different screen, so a rail click inside any of them goes somewhere. */
const BY_SLUG: Record<BlockSlug, Route> = {
  "dashboard-01": { screen: "dashboard" },
  "caseload-01": { screen: "caseload" },
  "patient-01": { screen: "record", patient: "okonkwo" },
  "schedule-01": { screen: "schedule" },
  "messages-01": { screen: "messages" },
  "note-01": { screen: "note", patient: "okonkwo" },
  "safety-01": { screen: "safety" },
  "instruments-01": { screen: "instruments" },
  "reports-01": { screen: "reports" },
  "directory-01": { screen: "patients" },
  "copilot-01": { screen: "copilot", patient: "okonkwo" },
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

  const route = BY_SLUG[slug];
  if (!route) return null;
  return (
    <div ref={frame} className="oxb" data-vp={vp === "auto" ? measured : vp}>
      <Northwind initial={route} />
    </div>
  );
}
