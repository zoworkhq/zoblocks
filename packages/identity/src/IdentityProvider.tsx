/**
 * `IdentityProvider` — who is looking, and what the site allows.
 *
 * One object, set once, honoured by every identity surface underneath it. The
 * alternative — a `disclosure` prop on every chip — is how a reception screen
 * ends up rendering one unmasked identifier because somebody forgot a prop on
 * one row.
 */

import {
  DEFAULT_IDENTIFIER_SYSTEMS,
  DEFAULT_SWATCH_COUNT,
  IdentityCache,
  type DisclosureLevel,
  type Identity,
  type IdentifierSystemSpec,
  type IdentityPolicy,
  type LegalNameReason,
  type PhotoPolicy,
} from "@oxygenui-design/identity-core";
import type { Patient } from "@oxygenui-design/fhir";
import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";

/**
 * The name context, as a discriminated union.
 *
 * Reaching for the legal name costs a sentence: `reason` is required, and the
 * four values are the only situations that justify it. Russell et al. (2018)
 * is the reason this is a type error rather than a lint warning — see the
 * behavioural-health section of the identity brief.
 */
export type NameContextProp =
  | { nameContext?: "display"; legalNameReason?: never }
  | { nameContext: "legal"; legalNameReason: LegalNameReason };

export type IdentityProviderProps = NameContextProp & {
  children: ReactNode;
  locale?: string;
  disclosure?: DisclosureLevel;
  /**
   * Defaults to `"deny"`. A cached portrait is PHI at rest in a browser the
   * site may not control, and an intake photograph taken during an involuntary
   * admission was not meaningfully consented to. Opting in should be a decision
   * somebody made on purpose.
   */
  photos?: PhotoPolicy;
  identifierSystems?: IdentifierSystemSpec[];
  swatchCount?: number;
  /** Injected clock, so age is testable and server-renderable. */
  now?: Date;
  /**
   * Substitutes synthetic identities everywhere beneath this provider,
   * deterministically keyed off the real record. For conference screenshots,
   * demos against a staging database, and training environments.
   */
  demoMode?: boolean;
  /**
   * Fired when a user reveals a field the sensitivity labels had withheld.
   *
   * The component never writes an audit entry itself — that would be a browser
   * emitting PHI, which ARCHITECTURE §9 forbids. The application logs.
   */
  onSensitiveReveal?: (event: SensitiveRevealEvent) => void;
  /** Fired when a user copies an identifier. Same reasoning as above. */
  onIdentifierCopy?: (event: IdentifierCopyEvent) => void;
};

export interface SensitiveRevealEvent {
  patientId: string;
  codes: string[];
  at: string;
}

export interface IdentifierCopyEvent {
  patientId: string;
  kind: string;
  at: string;
}

interface IdentityContextValue {
  policy: IdentityPolicy;
  cache: IdentityCache;
  onSensitiveReveal?: ((event: SensitiveRevealEvent) => void) | undefined;
  onIdentifierCopy?: ((event: IdentifierCopyEvent) => void) | undefined;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

/**
 * A policy version derived from the values that change what gets rendered.
 *
 * Part of the resolution cache key. Without it, a disclosure change would leave
 * every already-resolved patient rendered under the previous policy — a privacy
 * defect, not a performance one.
 */
function versionOf(p: Omit<IdentityPolicy, "version" | "now">): string {
  return [
    p.locale,
    p.disclosure,
    p.photos,
    p.nameContext,
    p.legalNameReason ?? "-",
    p.swatchCount,
    p.demoMode ? "demo" : "live",
    p.identifierSystems.map((s) => s.kind).join("+"),
  ].join("|");
}

export function IdentityProvider(props: IdentityProviderProps): ReactNode {
  const {
    children,
    locale = "en",
    disclosure = "clinical",
    photos = "deny",
    identifierSystems = DEFAULT_IDENTIFIER_SYSTEMS,
    swatchCount = DEFAULT_SWATCH_COUNT,
    now,
    demoMode = false,
    nameContext = "display",
    legalNameReason,
    onSensitiveReveal,
    onIdentifierCopy,
  } = props;

  // One cache per provider instance, so unmounting a screen releases it.
  const cacheRef = useRef<IdentityCache | null>(null);
  if (!cacheRef.current) cacheRef.current = new IdentityCache(2000);
  const cache = cacheRef.current;

  // Extracted so the dependency array holds a statically checkable value; a
  // `now?.getTime()` call inside the array cannot be verified by the lint rule.
  const nowMs = now?.getTime();

  const value = useMemo<IdentityContextValue>(() => {
    const base = {
      locale,
      disclosure,
      photos,
      nameContext,
      legalNameReason,
      identifierSystems,
      swatchCount,
      demoMode,
    } as Omit<IdentityPolicy, "version" | "now">;
    const version = versionOf(base);
    // The clock is deliberately snapshotted once per policy rather than read
    // during render: a component that calls `new Date()` while rendering is
    // neither testable nor safe to server-render.
    // A policy must carry a clock, and a provider that was given none has to
    // read one somewhere. Passing `now` is how a visual-regression run and a
    // server render get determinism, and every test in this package does.
    // eslint-disable-next-line no-restricted-syntax
    const policy: IdentityPolicy = { ...base, now: now ?? new Date(), version };
    cache.clear();
    return { policy, cache, onSensitiveReveal, onIdentifierCopy };
    // `now` is intentionally not a dependency when undefined: re-snapshotting
    // the clock on every render would defeat the cache and make ages jitter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    locale,
    disclosure,
    photos,
    nameContext,
    legalNameReason,
    identifierSystems,
    swatchCount,
    demoMode,
    nowMs,
    onSensitiveReveal,
    onIdentifierCopy,
    cache,
  ]);

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

/**
 * The policy in scope.
 *
 * Falls back to a sensible default rather than throwing, so a chip dropped into
 * a Storybook story or a test renders instead of exploding. The default denies
 * photographs and shows clinical-level detail.
 */
export function useIdentityPolicy(): IdentityContextValue {
  const ctx = useContext(IdentityContext);
  const fallbackCache = useRef<IdentityCache | null>(null);
  if (!fallbackCache.current) fallbackCache.current = new IdentityCache(200);

  return useMemo(() => {
    if (ctx) return ctx;
    const policy: IdentityPolicy = {
      locale: "en",
      disclosure: "clinical",
      photos: "deny",
      nameContext: "display",
      identifierSystems: DEFAULT_IDENTIFIER_SYSTEMS,
      swatchCount: DEFAULT_SWATCH_COUNT,
      // Same reasoning as above, for a component rendered with no provider at
      // all — a Storybook story or a test that did not wrap it.
      // eslint-disable-next-line no-restricted-syntax
      now: new Date(),
      demoMode: false,
      version: "fallback",
    };
    return { policy, cache: fallbackCache.current as IdentityCache };
  }, [ctx]);
}

/** Resolve a patient under the policy in scope, memoised. */
export function useIdentity(patient: Patient | undefined, key?: string): Identity | undefined {
  const { policy, cache } = useIdentityPolicy();
  return useMemo(() => {
    if (!patient) return undefined;
    return cache.resolve(patient, policy, key ? { key } : {});
  }, [patient, policy, cache, key]);
}
