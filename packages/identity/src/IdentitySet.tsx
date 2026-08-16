/**
 * `IdentitySet` — the context that lets a chip know about its siblings.
 *
 * Every hospital that has thought about this runs a "name alert" programme on
 * paper. It has never been in a component library because it requires exactly
 * this: a component that can see what else is on screen.
 *
 * Chips register on mount and deregister on unmount; the set recomputes the
 * disambiguation plan whenever membership changes. The plan is *what is
 * actually rendered*, not what is in the database — which is the right scope,
 * because the question is "could a reader confuse these two rows".
 */

import {
  disambiguate,
  disambiguationNotice,
  type DisambiguationResult,
  type Escalation,
  type Identity,
} from "@oxygenui-design/identity-core";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Two contexts, not one, and the split is load-bearing.
 *
 * Registration is an effect; the plan is render data. If they share a context
 * object, publishing a new plan changes the context value, which re-runs the
 * registration effect, which deregisters and re-registers, which produces a new
 * membership map, which produces a new plan — an infinite loop that a single
 * combined context makes almost impossible to avoid. Keeping the registry
 * value referentially stable for the life of the provider breaks the cycle at
 * its source rather than papering over it with a dependency-array omission.
 */
interface Registry {
  register: (identity: Identity) => void;
  deregister: (key: string) => void;
}

const RegistryContext = createContext<Registry | null>(null);
const PlanContext = createContext<DisambiguationResult | null>(null);

const EMPTY: DisambiguationResult = { plan: new Map(), escalated: 0, total: 0 };

export interface IdentitySetProps {
  children: ReactNode;
  /**
   * Called whenever the plan changes. An application can use this to render its
   * own list-level notice, or to record that a ward list contained confusable
   * patients — which safety teams genuinely want to know.
   */
  onDisambiguate?: (result: DisambiguationResult) => void;
}

export function IdentitySet({ children, onDisambiguate }: IdentitySetProps): ReactNode {
  const [members, setMembers] = useState<ReadonlyMap<string, Identity>>(() => new Map());

  // Stable for the life of the provider. This is what the effect depends on.
  const registry = useRef<Registry | null>(null);
  if (!registry.current) {
    registry.current = {
      register: (identity) =>
        setMembers((prev) => {
          // Identity objects are memoised by the resolution cache, so an
          // unchanged patient re-registering is reference-equal and must not
          // produce a new map.
          if (prev.get(identity.key) === identity) return prev;
          const next = new Map(prev);
          next.set(identity.key, identity);
          return next;
        }),
      deregister: (key) =>
        setMembers((prev) => {
          if (!prev.has(key)) return prev;
          const next = new Map(prev);
          next.delete(key);
          return next;
        }),
    };
  }

  const result = useMemo(() => disambiguate([...members.values()]), [members]);

  useEffect(() => {
    onDisambiguate?.(result);
  }, [result, onDisambiguate]);

  return (
    <RegistryContext.Provider value={registry.current}>
      <PlanContext.Provider value={result}>{children}</PlanContext.Provider>
    </RegistryContext.Provider>
  );
}

/**
 * Join the set in scope and get this identity's escalation, if any.
 *
 * Returns `undefined` outside a set, and outside a set nothing escalates —
 * which is correct: a lone chip has nothing to be confused with.
 */
export function useEscalation(identity: Identity | undefined): Escalation | undefined {
  const registry = useContext(RegistryContext);
  const result = useContext(PlanContext);
  const key = identity?.key;

  useEffect(() => {
    if (!registry || !identity || !key) return;
    registry.register(identity);
    return () => registry.deregister(key);
    // `registry` is stable for the life of the provider and `identity` is
    // memoised by the resolution cache, so this runs on mount, on a genuine
    // identity change, and on unmount — not on every plan update.
  }, [registry, identity, key]);

  return key ? result?.plan.get(key) : undefined;
}

/**
 * The list-level marker.
 *
 * Names the count and the action, per CONTENT.md §4. It does not ask "are you
 * sure?" — that would make the reader re-derive the consequence they were
 * already unsure about.
 */
export function IdentitySetNotice(): ReactNode {
  const result = useContext(PlanContext) ?? EMPTY;

  const text = useMemo(() => {
    // Only genuinely confusable identities earn the notice. A shared avatar
    // tint escalates the row quietly but must not raise a list-level alarm —
    // two people sharing one of six colours is expected, and a notice that
    // fires on it is a notice nobody reads.
    const marked = [...result.plan.values()].filter((e) => e.mark).length;
    if (marked === 0) return undefined;
    return disambiguationNotice({ ...result, escalated: marked });
  }, [result]);

  if (!text) return null;
  return (
    <div className="ox-identity-notice" role="status">
      <span aria-hidden="true">⚠</span> {text}
    </div>
  );
}
