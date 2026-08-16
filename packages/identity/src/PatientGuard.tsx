/**
 * `PatientGuard` — the coupling that makes the banner a control rather than a
 * heading.
 *
 * Adelman et al. (JAMIA 2013) found that a dismissible "check the patient"
 * alert cut wrong-patient orders by about 16%, while making the clinician
 * re-enter the patient's initials cut them by about 40%. Both interventions
 * require the *action* to know which patient the *chart* is showing. That is
 * what this file provides.
 *
 * Two invariants live here, and neither can be a type:
 *
 *   - One banner per screen. Two authoritative answers to "whose chart is
 *     this" is the defect, not a layout choice.
 *   - A form's patient must equal the displayed patient.
 *
 * **Neither throws, and neither logs.** An earlier draft threw in development
 * and wrote to `console` in production, which is the React-ecosystem habit —
 * and which this repo has explicitly decided against: `process.env` does not
 * exist in a copy-source consumer's build, and a component that writes to the
 * console writes PHI onward to whatever error reporter the customer installed.
 * See `@oxygenui/no-forbidden-capability` and ADR 0009.
 *
 * A violation does two things instead, both of which are better: it renders a
 * blocking, non-dismissible state in place of the children, and it calls a
 * handler the application supplied. For a wrong-patient mismatch **a refused
 * render is the correct output in every environment** — the alternative is a
 * working screen showing the wrong human, which is not a thing to reserve for
 * development builds.
 */

import type { Identity } from "@oxygenui-design/identity-core";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";

const PatientContext = createContext<Identity | null>(null);

/** Registry of mounted banners. The count is the assertion. */
const mountedBanners = new Set<string>();

export interface BannerViolation {
  kind: "duplicate-banner";
  displayed: string;
  other: string;
  message: string;
}

/**
 * Handlers for the one-banner-per-screen invariant.
 *
 * A module-level registry rather than a context, because two banners in
 * *different* React trees on one page is the same defect as two in one tree,
 * and a context-scoped check would miss it entirely.
 */
const violationHandlers = new Set<(v: BannerViolation) => void>();

/**
 * Register an application handler for structural violations.
 *
 * Returns an unsubscribe function. Applications wire this to their own logger;
 * the library deliberately has no opinion about where it goes, because the only
 * opinion it could have would put PHI somewhere the customer did not choose.
 */
export function onBannerViolation(handler: (v: BannerViolation) => void): () => void {
  violationHandlers.add(handler);
  return () => violationHandlers.delete(handler);
}

function reportViolation(v: BannerViolation): void {
  for (const handler of violationHandlers) handler(v);
}

export function PatientContextProvider({
  identity,
  children,
}: {
  identity: Identity;
  children: ReactNode;
}): ReactNode {
  return <PatientContext.Provider value={identity}>{children}</PatientContext.Provider>;
}

/**
 * Asserts one banner per screen.
 *
 * The set is module-level rather than context-level on purpose: two banners in
 * *different* React trees on one page is the same defect as two in one tree,
 * and a context-scoped check would miss it.
 */
export function useBannerRegistration(key: string | undefined): void {
  const registered = useRef<string | null>(null);

  useEffect(() => {
    if (!key) return;
    if (mountedBanners.size > 0 && !mountedBanners.has(key)) {
      const other = [...mountedBanners][0] ?? "";
      // The banner still renders. A hard crash would take the whole record
      // down, which is worse than an ambiguous header the application has been
      // told about.
      reportViolation({
        kind: "duplicate-banner",
        displayed: key,
        other,
        message:
          `Two PatientBanners are mounted at once (${other} and ${key}). ` +
          `A screen has one authoritative answer to "whose chart is this". ` +
          `Use PatientChip for a reference to a second patient.`,
      });
    }
    mountedBanners.add(key);
    registered.current = key;
    return () => {
      if (registered.current) mountedBanners.delete(registered.current);
      registered.current = null;
    };
  }, [key]);
}

/** Test-only reset. Module state does not survive a page load in production. */
export function __resetBannerRegistry(): void {
  mountedBanners.clear();
  violationHandlers.clear();
}

/** The patient the banner in scope is displaying, if any. */
export function useDisplayedPatient(): Identity | null {
  return useContext(PatientContext);
}

export interface PatientGuardProps {
  /**
   * The patient this subtree was opened for. Almost always captured when a form
   * was created, not read from the banner — reading it from the banner would
   * make the check tautological.
   */
  expect: string;
  /** A human-readable name for the mismatch message. */
  expectName?: string;
  children: ReactNode;
  /** Rendered instead of `children` on mismatch. Defaults to a blocking notice. */
  fallback?: (info: MismatchInfo) => ReactNode;
  /** Fired on mismatch so the application can record the near miss. */
  onMismatch?: (info: MismatchInfo) => void;
}

export interface MismatchInfo {
  expected: string;
  expectedName?: string | undefined;
  displayed: string;
  displayedName: string;
}

/**
 * Refuses to render its children when the chart on screen is not the chart this
 * subtree was opened for.
 */
export function PatientGuard(props: PatientGuardProps): ReactNode {
  const { expect: expected, expectName, children, fallback, onMismatch } = props;
  const displayed = useDisplayedPatient();

  const mismatch: MismatchInfo | null =
    displayed && displayed.key !== expected
      ? {
          expected,
          expectedName: expectName,
          displayed: displayed.key,
          displayedName: displayed.name.text,
        }
      : null;

  useEffect(() => {
    if (!mismatch) return;
    onMismatch?.(mismatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mismatch?.expected, mismatch?.displayed]);

  if (!mismatch) return <>{children}</>;
  if (fallback) return <>{fallback(mismatch)}</>;

  return (
    <div className="ox-guard" role="alert" data-ox-guard="mismatch">
      <span className="ox-guard__rail" aria-hidden="true" />
      <div>
        <p className="ox-guard__title">Wrong patient</p>
        <p className="ox-guard__body">
          This form was opened for <strong>{mismatch.expectedName ?? mismatch.expected}</strong>.
          The chart currently displayed is <strong>{mismatch.displayedName}</strong>. Nothing has
          been submitted.
        </p>
      </div>
    </div>
  );
}
