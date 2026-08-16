/**
 * The safety verdict, and the order the classifiers run in.
 *
 * The order is not configurable, and that is the point. A host can replace any
 * individual classifier — the interfaces below are the extension seam — but it
 * cannot reorder them, because the ordering carries the guarantee: crisis is
 * evaluated before anything else touches the request, and nothing downstream
 * can un-block it.
 */

import { classifyCrisis, NO_CRISIS, type CrisisInput, type CrisisVerdict } from "./crisis.js";
import { classifyInjection, type InjectionVerdict } from "./injection.js";
import { classifyScope, type ScopeInput, type ScopeOutcome } from "./scope.js";

export * from "./crisis.js";
export * from "./injection.js";
export * from "./scope.js";

/**
 * A determination made about one exchange.
 *
 * Carried on the wire as well as in-process: an endpoint that runs its own
 * server-side classification reports it back as a `safety` event, and the
 * client merges the two. Neither side trusts the other to have done it — a
 * client classifier stops mistakes, a server one stops attacks, and a product
 * that only has one of them has chosen which of those to tolerate.
 */
export interface SafetyVerdict {
  readonly crisis: CrisisVerdict;
  readonly injection?: InjectionVerdict;
  readonly scope?: ScopeOutcome;
  /** True if anything in here stops the exchange. */
  readonly blocking: boolean;
}

/** Pluggable classifier seams. Each defaults to the built-in. */
export interface SafetyClassifiers {
  crisis?(input: CrisisInput): CrisisVerdict;
  scope?(input: ScopeInput): ScopeOutcome;
  injection?(text: string, options: { neutralised: number }): InjectionVerdict;
}

export const defaultClassifiers: Required<SafetyClassifiers> = {
  crisis: classifyCrisis,
  scope: classifyScope,
  injection: (text, options) => classifyInjection(text, options),
};

/** Merge a locally-computed verdict with one reported by the endpoint. */
export function mergeVerdicts(
  local: SafetyVerdict,
  remote: SafetyVerdict | undefined,
): SafetyVerdict {
  if (!remote) return local;
  const crisis =
    severityRank(remote.crisis) > severityRank(local.crisis) ? remote.crisis : local.crisis;
  const merged: SafetyVerdict = {
    crisis,
    injection: worstInjection(local.injection, remote.injection),
    scope: local.scope?.inScope === false ? local.scope : remote.scope,
    blocking: local.blocking || remote.blocking || crisis.blocking,
  };
  return merged;
}

function severityRank(verdict: CrisisVerdict): number {
  switch (verdict.severity) {
    case "imminent":
      return 3;
    case "ideation":
      return 2;
    case "clinical-risk":
      return 1;
    default:
      return 0;
  }
}

function worstInjection(
  a: InjectionVerdict | undefined,
  b: InjectionVerdict | undefined,
): InjectionVerdict | undefined {
  if (!a) return b;
  if (!b) return a;
  const rank = (v: InjectionVerdict) =>
    v.severity === "hostile" ? 2 : v.severity === "suspicious" ? 1 : 0;
  return rank(b) > rank(a) ? b : a;
}

export const SAFE_VERDICT: SafetyVerdict = { crisis: NO_CRISIS, blocking: false };
