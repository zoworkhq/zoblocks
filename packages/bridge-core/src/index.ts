/**
 * @oxygenui-design/bridge-core — the theme-bridge contract.
 *
 * A bridge is the only sanctioned way a UI framework reaches an Oxygen
 * component: it reads that framework's resolved theme and writes Oxygen's
 * token surface. Nothing else crosses the boundary — no component is swapped,
 * no prop is remapped, and no capability is reduced to what two frameworks
 * happen to share.
 *
 * Implementations: `@oxygenui-design/bridge-antd`, `@oxygenui-design/bridge-mui`.
 */

export {
  MIN_TARGET_PX,
  compact,
  concentric,
  resolvePatch,
  targetFloor,
  type BridgeDefinition,
  type TokenPatch,
} from "./contract";

export {
  clinicalViolations,
  contrastViolations,
  unknownTokens,
  assertBridgeOutput,
  verifyPatch,
  type BridgeViolation,
} from "./verify";

export {
  READABLE_TOKENS,
  THEME_ATTRIBUTES,
  resolveOxygenTokens,
  toMs,
  toPx,
  type OxygenTokens,
  type ReadableToken,
} from "./read";

export { useOxygenTokens, type UseOxygenTokensOptions } from "./useOxygenTokens";
