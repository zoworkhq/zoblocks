"use client";

/**
 * The catalog card.
 *
 * The grid used to be eight identical boxes of prose, which told a visitor
 * nothing about which component to open first and looked like every other
 * component library.
 *
 * Two changes fix that:
 *
 *   1. Hierarchy. The components that carry the product's argument get a
 *      featured cell — wider, taller art, and a "Start here" marker.
 *   2. Every card renders the real component, and shows the states it claims
 *      rather than describing them. Once the rebuilt StatusBadge exists the
 *      strip should be built from it, so a card cannot claim a state the
 *      component does not actually render.
 *
 * Hierarchy is carried by size, never by presence. An earlier version gave a
 * live render only to the two featured cells, and because a featured cell spans
 * two columns and is twice as tall, the standard cards stretched to match and
 * showed a void where the component should be. Add every new component to
 * PREVIEW below — a catalog whose pitch is "real components, real states" must
 * not have a cell that shows neither.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PulseLoader } from "@/registry/oxygen/pulse-loader/pulse-loader";
import { InfusionLoader } from "@/registry/oxygen/infusion-loader/infusion-loader";
import { RhythmLoader } from "@/registry/oxygen/rhythm-loader/rhythm-loader";
import { BreathLoader } from "@/registry/oxygen/breath-loader/breath-loader";
import { HelixLoader } from "@/registry/oxygen/helix-loader/helix-loader";
import { STATUS_LABEL, type ComponentDoc } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * Keyed by the stability tiers in ADR 0006. These used to be "shipping",
 * "review", and "design" — labels from an earlier vocabulary that no longer
 * match anything a component can declare, so every badge silently rendered
 * unstyled.
 */
const STATUS_STYLE: Record<string, string> = {
  stable: "border-oxygen/30 bg-oxygen/8 text-oxygen-deep",
  beta: "border-rule-strong bg-paper-sunk text-graphite",
  experimental: "border-rule bg-transparent text-graphite-soft",
  deprecated: "border-rule bg-transparent text-graphite-soft line-through",
};

/**
 * A live render for every card. Real components, unedited.
 *
 * This used to hold only the two featured entries, and the result was a grid
 * where two cards showed the product and three showed a void: a featured cell
 * spans two columns and is roughly twice as tall, the standard cards in the
 * same row stretch to match it, and a short summary plus four chips does not
 * fill that height. It read as three broken previews rather than a deliberate
 * hierarchy.
 *
 * Every loader can render itself in a hundred pixels, so every card now does.
 * Hierarchy is still carried — by the span, the "Start here" marker, and the
 * larger art — but no cell is empty, and a library whose whole argument is
 * "real components, real states" no longer shows two of them.
 *
 * `size` is passed per cell rather than left to the default: the featured cells
 * are twice as wide, and art scaled to a two-column cell overflows a one-column
 * one.
 */
const PREVIEW: Record<string, (featured: boolean) => React.ReactNode> = {
  "pulse-loader": (featured) => (
    <PulseLoader size={featured ? 92 : 64} label="Loading your records" />
  ),
  "infusion-loader": (featured) => (
    <InfusionLoader size={featured ? 150 : 116} progress={62} label="Importing records" />
  ),
  "rhythm-loader": (featured) => <RhythmLoader size={featured ? 92 : 68} label="Loading results" />,
  "breath-loader": (featured) => (
    <BreathLoader size={featured ? 92 : 64} label="Loading your information" />
  ),
  "helix-loader": (featured) => <HelixLoader size={featured ? 92 : 64} label="Running the panel" />,
};

export function ComponentCard({
  component,
  index,
  featured = false,
}: {
  component: ComponentDoc;
  index: number;
  featured?: boolean;
}) {
  const preview = PREVIEW[component.name];

  return (
    <Link
      href={`/components/${component.name}`}
      data-reveal
      style={{ "--reveal-delay": `${(index % 3) * 70}ms` } as React.CSSProperties}
      className={cn(
        "surface-2 lift group relative flex flex-col overflow-hidden rounded-2xl hover:border-oxygen/45",
        // Span only at 3 columns. At 2 columns a span-2 cell after an odd number
        // of standard cards leaves an empty grid slot.
        featured ? "p-6 lg:col-span-2" : "p-5",
      )}
    >
      {featured && (
        <span className="axis-label mb-3 inline-flex items-center gap-2 text-oxygen-deep">
          <span className="size-1.5 rounded-full bg-oxygen" aria-hidden="true" />
          Start here
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <h3
          className={cn(
            "font-display font-semibold tracking-tight",
            featured ? "text-xl" : "text-base",
          )}
        >
          {component.title}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider",
            STATUS_STYLE[component.status],
          )}
        >
          {STATUS_LABEL[component.status]}
        </span>
      </div>

      {/* Primitives take no FHIR resource; an empty line here would just be a
          gap the reader has to account for. */}
      {component.resource ? (
        <p className="numeric mt-2 text-xs text-oxygen-deep">{component.resource}</p>
      ) : null}

      <p
        className={cn(
          "mt-3 leading-relaxed text-graphite",
          featured ? "body max-w-lg" : "flex-1 text-sm",
        )}
      >
        {component.summary}
      </p>

      {preview ? (
        <div
          data-ox-density="standard"
          className="component-preview-frame relative mt-5 flex flex-1 items-center justify-center overflow-hidden rounded-xl p-3"
        >
          {/* Decorative inside the card. aria-hidden alone is a violation here:
              the panel contains a focusable scroll region, and hiding a
              focusable element from AT strands keyboard users on it. `inert`
              removes it from both the a11y tree and the tab order. */}
          <div
            inert
            aria-hidden="true"
            className={cn(
              "pointer-events-none flex w-full items-center justify-center",
              featured ? "min-h-[120px]" : "min-h-[92px]",
            )}
          >
            {preview(featured)}
          </div>
        </div>
      ) : (
        // No preview yet — the states are still worth showing, and they keep
        // the cell from collapsing next to a featured card twice its height.
        <div className="mt-5 flex flex-1 flex-wrap content-center gap-1.5" aria-hidden="true">
          {component.states.slice(0, 4).map((state) => (
            <span
              key={state}
              className="rounded-full border border-rule px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider text-graphite"
            >
              {state.split(" ")[0]}
            </span>
          ))}
        </div>
      )}

      {/* Below the preview rather than instead of it: the states are what the
          card is claiming, and a reader comparing five loaders wants both. */}
      {preview ? (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-hidden="true">
          {component.states.slice(0, featured ? 5 : 3).map((state) => (
            <span
              key={state}
              className="rounded-full border border-rule px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wider text-graphite"
            >
              {state.split(" ")[0]}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between border-t border-rule pt-3">
        <span className="numeric text-[0.6875rem] text-graphite-soft">
          {component.states.length} states
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-oxygen-deep">
          View
          <ArrowRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  );
}
