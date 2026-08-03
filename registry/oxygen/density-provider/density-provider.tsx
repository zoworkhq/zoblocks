"use client";

/**
 * DensityProvider — sets the spacing and target-size contract for a subtree.
 *
 * Density is a contract, not a preference. The same component serves a patient
 * reading on a phone and a nurse scanning ninety rows, and the difference
 * between those is spacing and target size — never which clinical facts appear.
 * Hiding a fact to save a row is a defect, not a density mode.
 *
 * Two things this enforces that a plain CSS variable cannot:
 *
 *   1. A WCAG 2.2 target-size floor. `clinical` density is allowed to be
 *      tight, but it is not allowed to shrink an interactive target below the
 *      24px minimum. The provider clamps rather than trusting every component
 *      to remember.
 *   2. Nesting. A patient-facing card inside a clinical worklist keeps its own
 *      density, because innermost wins.
 *
 * Density and breakpoint are independent axes. A clinical worklist stays
 * clinical on a tablet at the bedside; it does not become patient density
 * because the viewport got narrower.
 */

import * as React from "react";

export type Density = "patient" | "standard" | "clinical";

interface DensityContextValue {
  density: Density;
  /** True when the value came from a provider rather than the root default. */
  explicit: boolean;
}

const DensityContext = React.createContext<DensityContextValue>({
  density: "standard",
  explicit: false,
});

/** Read the density in force. Components adapt behaviour, not only spacing. */
export function useDensity(): Density {
  return React.useContext(DensityContext).density;
}

/**
 * WCAG 2.2 AA target size (minimum) is 24×24 CSS pixels. Clinical density is
 * dense by design, but this is the floor it may not cross.
 */
const MIN_TARGET_PX = 24;

export interface DensityProviderProps {
  density: Density;
  /**
   * Render without a wrapping element by cloning the single child. Use inside
   * table rows and other places where an extra div would break layout.
   */
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function DensityProvider({
  density,
  asChild = false,
  className,
  children,
}: DensityProviderProps) {
  const value = React.useMemo<DensityContextValue>(() => ({ density, explicit: true }), [density]);

  // The attribute is what the token file keys off; the context is what
  // components read when spacing alone is not enough.
  const props = {
    "data-ox-density": density,
    style: { "--ox-density-target-floor": `${MIN_TARGET_PX}px` } as React.CSSProperties,
    className,
  };

  if (asChild && React.isValidElement(children)) {
    return (
      <DensityContext.Provider value={value}>
        {React.cloneElement(children as React.ReactElement<Record<string, unknown>>, props)}
      </DensityContext.Provider>
    );
  }

  return (
    <DensityContext.Provider value={value}>
      <div {...props}>{children}</div>
    </DensityContext.Provider>
  );
}

/**
 * A control that honours the density floor.
 *
 * Wraps any interactive element so that clinical density can tighten its
 * spacing without taking the hit area below the accessible minimum. The visual
 * box may be small; the touch target is not.
 */
export function DensityTarget({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: `max(${MIN_TARGET_PX}px, var(--ox-density-target, ${MIN_TARGET_PX}px))`,
        minHeight: `max(${MIN_TARGET_PX}px, var(--ox-density-target, ${MIN_TARGET_PX}px))`,
      }}
    >
      {children}
    </span>
  );
}
