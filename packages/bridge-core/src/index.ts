/**
 * @zoblocks/bridge-core — the theme-bridge contract.
 *
 * A bridge is the only sanctioned way a UI framework reaches a ZoBlocks
 * component: it reads that framework's resolved theme and writes ZoBlocks's
 * token surface. Nothing else crosses the boundary — no component is swapped,
 * no prop is remapped, and no capability is reduced to what two frameworks
 * happen to share.
 *
 * Implementations: `@zoblocks/bridge-antd`, `@zoblocks/bridge-mui`.
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
  resolveZoBlocksTokens,
  toMs,
  toPx,
  type ZoBlocksTokens,
  type ReadableToken,
} from "./read";

export { useZoBlocksTokens, type UseZoBlocksTokensOptions } from "./useZoBlocksTokens";
