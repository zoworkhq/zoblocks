/**
 * What a bridge is not allowed to do, checked.
 *
 * A bridge takes a colour a customer typed into a framework's config and puts
 * it behind a clinical component. Two things can go wrong that no rendering
 * test catches, because the result renders perfectly in both cases:
 *
 *   1. It writes a clinical token, replacing a colour that carries a validated
 *      contrast floor and a 60° hue separation with an arbitrary brand red.
 *   2. It writes a chrome colour that fails contrast against the surface it
 *      lands on, so the host's theme quietly makes text unreadable.
 *
 * The first is a build failure — `NOT_BRIDGEABLE` is generated, so the rule is
 * data rather than a list someone maintains. The second is a development-time
 * warning, because it depends on the host's theme and we cannot fail their
 * build; it is stripped from production by the `NODE_ENV` guard, the same way
 * deprecation warnings are.
 */

import { NOT_BRIDGEABLE, surfaceEntry } from "@oxygenui-design/tokens/surface";
import { contrastBetween } from "@oxygenui-design/tokens/validate";
import type { TokenPatch } from "./contract";

export interface BridgeViolation {
  token: string;
  reason: string;
}

/**
 * Clinical tokens a patch must not contain.
 *
 * Returned rather than thrown so a caller chooses: the test suite fails, the
 * dev-time check warns, and neither has to know about the other.
 */
export function clinicalViolations(patch: TokenPatch): BridgeViolation[] {
  const forbidden = new Set<string>(NOT_BRIDGEABLE);
  return Object.keys(patch)
    .filter((token) => forbidden.has(token))
    .map((token) => ({
      token,
      reason:
        `${token} resolves to clinical status. A framework's semantic colour has passed no ` +
        "contrast gate and carries no hue-separation guarantee, so mapping onto it would " +
        "replace a clinical signal with a brand colour.",
    }));
}

/** Tokens the patch writes that are not part of the published surface at all. */
export function unknownTokens(patch: TokenPatch): BridgeViolation[] {
  return Object.keys(patch)
    .filter((token) => token.startsWith("--ox-") && !surfaceEntry(token))
    .filter((token) => !SEMANTIC_WRITABLE.test(token))
    .map((token) => ({
      token,
      reason: `${token} is not in the published token surface. A bridge may only write tokens the manifest declares.`,
    }));
}

/**
 * A bridge writes the *semantic* tier as well as the component tier — mapping
 * `colorPrimary` once onto `--ox-accent` reaches every component, where
 * mapping it onto each component's accent would be forty declarations that
 * drift. Those names are not in the component surface manifest by
 * construction, so they are matched by shape.
 */
const SEMANTIC_WRITABLE =
  /^--ox-(accent|bg|surface|border|text|focus-ring|font|radius|shadow|duration|ease|density)(-[a-z0-9-]+)?$/;

/** Foreground/background pairs a bridge is expected to keep readable. */
const CHECKED_PAIRS: { fg: string; bg: string; floor: number; rule: string }[] = [
  { fg: "--ox-text", bg: "--ox-surface", floor: 4.5, rule: "SC 1.4.3 (text)" },
  { fg: "--ox-text", bg: "--ox-bg", floor: 4.5, rule: "SC 1.4.3 (text)" },
  { fg: "--ox-text-muted", bg: "--ox-surface", floor: 4.5, rule: "SC 1.4.3 (text)" },
  { fg: "--ox-text-on-accent", bg: "--ox-accent", floor: 4.5, rule: "SC 1.4.3 (text)" },
  { fg: "--ox-focus-ring", bg: "--ox-bg", floor: 3, rule: "SC 1.4.11 (interface component)" },
  { fg: "--ox-accent", bg: "--ox-surface", floor: 3, rule: "SC 1.4.11 (interface component)" },
];

/**
 * Contrast failures the host's theme introduces.
 *
 * Only pairs where the bridge supplies *both* sides are checked. If it maps a
 * foreground and leaves the background to Oxygen's own token, the ratio
 * depends on a value we cannot see from here, and a guess would be worse than
 * silence.
 */
export function contrastViolations(patch: TokenPatch): BridgeViolation[] {
  const out: BridgeViolation[] = [];

  for (const { fg, bg, floor, rule } of CHECKED_PAIRS) {
    const foreground = patch[fg as `--${string}`];
    const background = patch[bg as `--${string}`];
    if (typeof foreground !== "string" || typeof background !== "string") continue;

    const ratio = contrastBetween(foreground, background);
    if (ratio === undefined || ratio >= floor) continue;

    out.push({
      token: fg,
      reason:
        `${fg} on ${bg} is ${ratio.toFixed(2)}:1 in the host theme, below the ${floor}:1 ` +
        `floor for ${rule}. The bridge is passing the host's colours through faithfully; ` +
        "the host's theme is what fails.",
    });
  }

  return out;
}

/**
 * Everything, for a test.
 *
 * `clinical` and `unknown` are defects in the bridge. `contrast` is a defect
 * in the host's theme that the bridge merely reveals — worth warning about,
 * never worth failing our own build over.
 */
export function verifyPatch(patch: TokenPatch): {
  clinical: BridgeViolation[];
  unknown: BridgeViolation[];
  contrast: BridgeViolation[];
  ok: boolean;
} {
  const clinical = clinicalViolations(patch);
  const unknown = unknownTokens(patch);
  const contrast = contrastViolations(patch);
  return { clinical, unknown, contrast, ok: clinical.length === 0 && unknown.length === 0 };
}

/**
 * A programming error in a bridge, raised loudly.
 *
 * Deliberately not a `console.warn` behind a `NODE_ENV` guard, which is what
 * the first draft of this file did. `packages/tabs/src/internal.ts` had
 * already settled the question for shipped source and its reasoning holds
 * here: reading `process.env` from a package a customer copies is forbidden
 * because the variable does not exist in their build, and a warning is the
 * wrong volume for a defect that renders perfectly — nobody reads it, and the
 * product ships with a host's brand red standing in for `status.critical`.
 *
 * So a bridge writing a clinical or unknown token throws. It is deterministic:
 * a bridge that does it does it on the first render, in development and in CI,
 * long before a customer sees it. Both bridges have a test that would fail
 * first.
 *
 * Host *contrast* is deliberately not covered here. That depends on a colour
 * the customer chose, it is not a defect in the bridge, and failing someone's
 * application over their palette would be the wrong place to enforce it. It is
 * returned by `verifyPatch` instead, for the theme app to surface at the
 * point where a person can actually change the colour.
 */
export function assertBridgeOutput(bridgeId: string, patch: TokenPatch): void {
  const violations = [...clinicalViolations(patch), ...unknownTokens(patch)];
  if (violations.length === 0) return;

  throw new Error(
    `[oxygen:bridge-${bridgeId}] the bridge wrote ${violations.length} token(s) it must not:\n` +
      violations.map((v) => `  ${v.reason}`).join("\n"),
  );
}
