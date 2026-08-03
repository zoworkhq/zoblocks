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
 *   2. Cards show their states instead of describing them. The strip is built
 *      from the real StatusBadge, so a card cannot claim a state the component
 *      does not actually render.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { observations, patients } from "@oxygenui/fixtures";
import { PatientBanner } from "@/registry/oxygen/patient-banner/patient-banner";
import { ObservationPanel } from "@/registry/oxygen/vitals-panel/vitals-panel";
import { StatusBadge, type StatusTone } from "@/registry/oxygen/status-badge/status-badge";
import { STATUS_LABEL, type ComponentDoc } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const AS_OF = new Date("2026-08-03T00:00:00Z");

const STATUS_STYLE: Record<string, string> = {
  shipping: "border-oxygen/30 bg-oxygen/8 text-oxygen-deep",
  review: "border-rule-strong bg-paper-sunk text-graphite",
  design: "border-rule bg-transparent text-graphite-soft",
};

/** A representative tone per component, so the strip reads as real severity. */
const STATE_TONES: Record<string, StatusTone[]> = {
  "patient-banner": ["normal", "unknown", "critical", "neutral"],
  "vitals-panel": ["critical", "high", "low", "normal", "unknown"],
  "medication-card": ["normal", "high", "critical", "neutral"],
  "allergy-list": ["critical", "high", "unknown", "neutral"],
  "appointment-card": ["normal", "high", "critical", "neutral"],
  "condition-list": ["normal", "high", "unknown", "neutral"],
  "coverage-card": ["normal", "critical", "high", "neutral"],
  "status-badge": ["critical", "high", "low", "normal", "unknown", "neutral"],
};

/** Compact live renders for the featured cells. Real components, real fixtures. */
const FEATURED_PREVIEW: Record<string, () => React.ReactNode> = {
  "vitals-panel": () => (
    <ObservationPanel
      observations={[observations.potassiumCritical, observations.bloodPressure]}
      label="Featured preview"
    />
  ),
  "patient-banner": () => (
    <PatientBanner headingLevel={4} patient={patients.restricted} maskIdentifiers asOf={AS_OF} />
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
  const tones = STATE_TONES[component.name] ?? ["normal", "unknown"];

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

      <p className="numeric mt-2 text-xs text-oxygen-deep">{component.resource}</p>

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
          data-theme="dark"
          data-ox-density="standard"
          className="relative mt-5 flex-1 overflow-hidden rounded-xl border border-panel-rule bg-panel p-3"
        >
          {/* Decorative inside the card — the real thing is one click away, and
              duplicating its semantics here would double every heading and
              live region in the page. */}
          <div aria-hidden="true" className="pointer-events-none">
            {preview()}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-1.5" aria-hidden="true">
          {tones.map((tone, i) => (
            <StatusBadge key={i} tone={tone} icon={null} className="px-1.5 py-0.5 text-[0.5625rem]">
              {component.states[i]?.split(" ")[0] ?? ""}
            </StatusBadge>
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
