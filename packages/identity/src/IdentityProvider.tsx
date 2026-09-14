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
} from "@zoblocks/identity-core";
import type { Patient } from "@zoblocks/fhir";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** A layout effect in the browser; a no-op warning-free effect on a server. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

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
function versionOf(p: Omit<IdentityPolicy, "version" | "now">, now: Date): string {
  return [
    p.locale,
    p.disclosure,
    p.photos,
    p.nameContext,
    p.legalNameReason ?? "-",
    p.swatchCount,
    p.demoMode ? "demo" : "live",
    systemsKey(p.identifierSystems),
    // Age is resolved against the clock, so a moved clock is a new policy.
    now.getTime(),
  ].join("|");
}

/** One number per validator function, so swapping a validator changes the key. */
const validatorIds = new WeakMap<(raw: string) => boolean, number>();
let validatorCount = 0;

/**
 * Every field of the identifier systems that changes what renders, as a string.
 *
 * Compared by value, so an inline array literal is not a new policy on every
 * render. Kinds alone are not enough: a relabelled or regrouped system with
 * the same kind would be served from the cache under its old label.
 */
function systemsKey(specs: IdentifierSystemSpec[]): string {
  return JSON.stringify(
    specs.map((s) => {
      let check = 0;
      if (s.checkDigit) {
        check = validatorIds.get(s.checkDigit) ?? ++validatorCount;
        validatorIds.set(s.checkDigit, check);
      }
      return [s.kind, s.label, s.systems, s.maskVisible, s.group, s.weight, check];
    }),
  );
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

  // A policy must carry a clock, and a provider given none has to read one
  // somewhere. Once per mount: read per policy, every re-render moved ages.
  // Passing `now` is how a visual-regression run and a server render get
  // determinism, and every test in this package does.
  // eslint-disable-next-line no-restricted-syntax
  const [mountClock] = useState(() => new Date());

  // By value, so `identifierSystems={[...]}` inline is not a new policy.
  const systemsSignature = systemsKey(identifierSystems);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const systems = useMemo(() => identifierSystems, [systemsSignature]);

  // Callbacks through a ref, so an inline arrow does not rebuild the policy
  // and re-resolve every patient on screen. The context carries stable
  // wrappers that call whatever was passed last.
  const handlers = useRef({ onSensitiveReveal, onIdentifierCopy });
  useIsomorphicLayoutEffect(() => {
    handlers.current = { onSensitiveReveal, onIdentifierCopy };
  });
  const hasReveal = onSensitiveReveal !== undefined;
  const hasCopy = onIdentifierCopy !== undefined;
  const reveal = useCallback(
    (event: SensitiveRevealEvent) => handlers.current.onSensitiveReveal?.(event),
    [],
  );
  const copy = useCallback(
    (event: IdentifierCopyEvent) => handlers.current.onIdentifierCopy?.(event),
    [],
  );

  const value = useMemo<IdentityContextValue>(() => {
    const base = {
      locale,
      disclosure,
      photos,
      nameContext,
      legalNameReason,
      identifierSystems: systems,
      swatchCount,
      demoMode,
    } as Omit<IdentityPolicy, "version" | "now">;
    const clock = now ?? mountClock;
    const policy: IdentityPolicy = { ...base, now: clock, version: versionOf(base, clock) };
    return {
      policy,
      cache,
      onSensitiveReveal: hasReveal ? reveal : undefined,
      onIdentifierCopy: hasCopy ? copy : undefined,
    };
    // `now` is keyed by its time, not its identity: `new Date(x)` inline is the
    // same clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    locale,
    disclosure,
    photos,
    nameContext,
    legalNameReason,
    systems,
    swatchCount,
    demoMode,
    nowMs,
    mountClock,
    hasReveal,
    hasCopy,
    reveal,
    copy,
    cache,
  ]);

  /*
   * Emptied after a real policy change commits, never during render.
   *
   * The version is part of the cache key, so old entries can no longer be hit
   * and this is memory, not correctness. Clearing inside `useMemo` ran on
   * renders React may discard, and on every render an inline prop caused.
   */
  const version = value.policy.version;
  const clearedFor = useRef(version);
  useEffect(() => {
    if (clearedFor.current === version) return;
    clearedFor.current = version;
    cache.clear();
  }, [version, cache]);

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
