"use client";

/**
 * Live compositions for the showcase.
 *
 * These are not screenshots. Each entry mounts the real registry components
 * against the real synthetic fixtures, which means the showcase can never
 * drift from the library — and a visitor can see composition behaviour
 * (density, escalation, masking) rather than a picture of it.
 *
 * The map is empty while the catalog is rebuilt. Each showcase entry in
 * `lib/offerings.ts` gets its composition back here, keyed by slug, once the
 * components it composes exist again. Until then the frame shows the fallback.
 */

import * as React from "react";

const COMPOSITIONS: Record<string, () => React.ReactNode> = {};

export function ShowcasePreview({
  slug,
  density,
}: {
  slug: string;
  density: "patient" | "standard" | "clinical";
}) {
  const render = COMPOSITIONS[slug];

  return (
    <div className="instrument instrument-demo">
      <div className="relative flex items-center justify-between gap-4 border-b border-panel-rule px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-trace shadow-[0_0_8px_var(--color-trace)]" />
          <span className="eyebrow text-panel-muted">Live composition · synthetic data</span>
        </div>
        <span className="eyebrow hidden text-panel-muted sm:block">{density} density</span>
      </div>

      <div data-ox-density={density} className="relative p-4 sm:p-5">
        {render ? (
          render()
        ) : (
          <p className="py-8 text-center text-sm text-panel-muted">Composition coming soon.</p>
        )}
      </div>
    </div>
  );
}
