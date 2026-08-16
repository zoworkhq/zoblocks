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
 *   1. Hierarchy. Two components carry the product's argument — the ones that
 *      handle interpretation and identity — so they get a featured cell with a
 *      live render. The rest are standard.
 *   2. Cards show their states instead of describing them. Once the rebuilt
 *      StatusBadge exists the strip should be built from it, so a card cannot
 *      claim a state the component does not actually render.
 *
 * The featured-preview map is empty while the catalog is rebuilt; add an entry
 * per featured component (real component, real fixtures) as each one ships.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PulseLoader } from "@/registry/oxygen/pulse-loader/pulse-loader";
import { InfusionLoader } from "@/registry/oxygen/infusion-loader/infusion-loader";
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

/** Compact live renders for the featured cells. Real components, unedited. */
const FEATURED_PREVIEW: Record<string, () => React.ReactNode> = {
  "pulse-loader": () => (
    <div className="flex min-h-[120px] items-center justify-center">
      <PulseLoader size={92} label="Loading your records" />
    </div>
  ),
  "infusion-loader": () => (
    <div className="flex min-h-[120px] items-center justify-center">
      <InfusionLoader size={150} progress={62} label="Importing records" />
    </div>
  ),
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
  const preview = featured ? FEATURED_PREVIEW[component.name] : undefined;

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
          className="component-preview-frame relative mt-5 flex-1 overflow-hidden rounded-xl p-3"
        >
          {/* Decorative inside the card. aria-hidden alone is a violation here:
              the panel contains a focusable scroll region, and hiding a
              focusable element from AT strands keyboard users on it. `inert`
              removes it from both the a11y tree and the tab order. */}
          <div inert aria-hidden="true" className="pointer-events-none">
            {preview()}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-1.5" aria-hidden="true">
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
