"use client";

/**
 * DensityProvider — sets the surface contract for a subtree.
 *
 * Density began as a spacing axis and is not one. The same component serves a
 * patient reading on a phone and a nurse scanning ninety rows, and the
 * difference between those two surfaces is spacing, target size, how much is
 * disclosed before asking, and *which words are used*. A surface that gives the
 * patient a nurse's row height and the nurse's vocabulary has only solved a
 * quarter of the problem.
 *
 * So `data-ox-density` now selects a **surface profile** with four parts:
 *
 *   spacing     row height, gap, padding, font size          (CSS, from tokens)
 *   target      minimum interactive target                   (CSS, clamped)
 *   register    patient vocabulary or clinician vocabulary   (React context)
 *   disclosure  how much detail is shown before asking       (React context)
 *
 * The register is the part that is easy to get wrong and expensive to retrofit.
 * Patient-facing and clinician-facing strings are different catalogs, not
 * different tones of the same string — "potassium" and "K+" are not a formality
 * setting, and "your result is higher than the usual range" is not a politer
 * way of writing "H 6.8 mmol/L". Binding the catalog to the profile now means
 * the translation layer has somewhere to plug into later; binding it after the
 * catalog exists is a migration across every component.
 *
 * Two things this enforces that a plain CSS variable cannot:
 *
 *   1. A WCAG 2.2 target-size floor. `clinical` density is allowed to be tight,
 *      but not to shrink an interactive target below the 24px minimum. The
 *      provider clamps rather than trusting every component to remember.
 *   2. Nesting. A patient-facing card inside a clinical worklist keeps its own
 *      profile, because innermost wins.
 *
 * Density and breakpoint are independent axes. A clinical worklist stays
 * clinical on a tablet at the bedside; it does not become patient density
 * because the viewport got narrower.
 */

import * as React from "react";

export type Density = "patient" | "standard" | "clinical";

/**
 * Which vocabulary a surface speaks.
 *
 * Deliberately two values, not a scale. There is no halfway between "potassium"
 * and "K+"; a third register would be a third catalog nobody maintains.
 */
export type Register = "patient" | "clinician";

/**
 * How much a component reveals before the reader asks for it.
 *
 * `full` is not "more information" — it is the same information with fewer
 * interactions in front of it. No profile is ever allowed to remove a clinical
 * fact; hiding a fact to save a row is a defect, not a disclosure level.
 */
export type Disclosure = "progressive" | "full";

export interface SurfaceProfile {
  density: Density;
  register: Register;
  disclosure: Disclosure;
  /** True when the value came from a provider rather than the root default. */
  explicit: boolean;
}

/**
 * What each density implies when nothing overrides it.
 *
 * `standard` and `clinical` both speak clinician, because both are staff-facing
 * — the difference between them is how many rows fit on screen, not who is
 * reading. Only `patient` changes the vocabulary.
 */
const PROFILE_DEFAULTS: Record<Density, { register: Register; disclosure: Disclosure }> = {
  patient: { register: "patient", disclosure: "progressive" },
  standard: { register: "clinician", disclosure: "progressive" },
  clinical: { register: "clinician", disclosure: "full" },
};

const SurfaceContext = React.createContext<SurfaceProfile>({
  density: "standard",
  register: "clinician",
  disclosure: "progressive",
  explicit: false,
});

/** Read the density in force. Components adapt behaviour, not only spacing. */
export function useDensity(): Density {
  return React.useContext(SurfaceContext).density;
}

/** Read the whole surface profile. */
export function useSurface(): SurfaceProfile {
  return React.useContext(SurfaceContext);
}

/** Read the vocabulary in force. */
export function useRegister(): Register {
  return React.useContext(SurfaceContext).register;
}

/**
 * Pick the wording for the surface in force.
 *
 *   const label = useTerm({ clinician: "K+", patient: "Potassium" });
 *
 * Both sides are required. An optional patient string would make "we forgot to
 * write the patient wording" render as clinical shorthand on a patient's
 * screen, which is precisely the failure this exists to prevent — so the type
 * makes forgetting impossible rather than making it default to the safer-looking
 * of the two.
 */
export function useTerm(wording: Record<Register, string>): string {
  return wording[React.useContext(SurfaceContext).register];
}

/**
 * WCAG 2.2 AA target size (minimum) is 24×24 CSS pixels. Clinical density is
 * dense by design; this is the floor it may not cross.
 */
const MIN_TARGET_PX = 24;

export interface DensityProviderProps {
  density: Density;
  /**
   * Override the vocabulary the density implies. The case this exists for is
   * real but rare: a patient-facing summary rendered inside a clinician's
   * workflow, where the clinician needs to see exactly what the patient will.
   */
  register?: Register;
  /** Override the disclosure level the density implies. */
  disclosure?: Disclosure;
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
  register,
  disclosure,
  asChild = false,
  className,
  children,
}: DensityProviderProps) {
  const value = React.useMemo<SurfaceProfile>(
    () => ({
      density,
      register: register ?? PROFILE_DEFAULTS[density].register,
      disclosure: disclosure ?? PROFILE_DEFAULTS[density].disclosure,
      explicit: true,
    }),
    [density, register, disclosure],
  );

  // The density attribute is what the token file keys off. The register is
  // mirrored onto the DOM as well so that CSS and test selectors can see it —
  // it is not read by the token file, but "which vocabulary is this subtree
  // speaking" is the kind of thing worth being able to assert on.
  const props = {
    "data-ox-density": density,
    "data-ox-register": value.register,
    className,
  };

  if (asChild && React.isValidElement(children)) {
    return (
      <SurfaceContext.Provider value={value}>
        {React.cloneElement(children as React.ReactElement<Record<string, unknown>>, props)}
      </SurfaceContext.Provider>
    );
  }

  return (
    <SurfaceContext.Provider value={value}>
      <div {...props}>{children}</div>
    </SurfaceContext.Provider>
  );
}

/**
 * A control that honours the density floor.
 *
 * Wraps any interactive element so that clinical density can tighten its
 * spacing without taking the hit area below the accessible minimum. The visual
 * box may be small; the touch target is not.
 *
 * The floor comes from `--ox-density-target-floor` rather than being inlined,
 * so a custom density profile cannot drop a hit area below the minimum by
 * accident — and so the value is auditable in one place rather than compiled
 * into every copy of this file that ships.
 */
export function DensityTarget({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const floor = `var(--ox-density-target-floor, ${MIN_TARGET_PX}px)`;
  const target = `var(--ox-density-target, ${floor})`;

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: `max(${floor}, ${target})`,
        minHeight: `max(${floor}, ${target})`,
      }}
    >
      {children}
    </span>
  );
}
