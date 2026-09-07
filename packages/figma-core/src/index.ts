/**
 * @zoblocks/figma-core — Zoblocks themes as Figma variable plans.
 *
 * Pure by construction: no `figma.*`, no DOM, no network, no `node:*`. A Figma
 * plugin runs across two isolated contexts — a sandbox with the Figma API and
 * no networking, and an iframe with networking and no Figma API — and neither
 * is pleasant to test. Keeping every rule in here makes that irrelevant: the
 * adapter on either side reads plain data in and applies plain data out, and
 * has no conditionals worth a test.
 *
 * The validator is re-exported so a plugin has one import rather than two, and
 * so the answer it gives is provably the answer the app and the publish
 * gate give. Three implementations of one contrast rule is the failure this
 * whole package layout exists to avoid.
 */

export { hexToFigmaRgb, figmaRgbToHex, type FigmaRgb } from "./color";

export {
  COLLECTION,
  THEMES,
  labelFor,
  toVariablePlan,
  type PlanOptions,
  type PlannedValue,
  type PlannedVariable,
  type ResolvedTheme,
  type ThemeName,
  type Tier,
  type VariablePlan,
} from "./plan";

export { diffPlan, type PlanDiff, type SnapshotVariable, type VariableSnapshot } from "./diff";

export { fromVariables, type ImportOptions, type ImportReport } from "./import";

export {
  ANCHOR_STEP,
  RAMP_STEPS,
  contrastBetween,
  contrastRatio,
  floorForPair,
  generateRamp,
  measureContrast,
  nearestPassing,
  parseHex,
  validateTokens,
  CONTRAST_PAIRS,
  STATUS_PAIRS,
} from "@zoblocks/tokens/validate";

/*
 * One import, not two — the plan's own requirement, and the reason `theme` is
 * absent from this package's dependencies.
 *
 * `nearestPassing` used to live in `@zoblocks/theme/src/ramp.ts`. It was
 * pure, but `theme` also carries the document schema, zod and both framework
 * bridges, and making a plugin sandbox depend on all of that to offer one
 * suggestion is the wrong trade. `ramp.ts` now sits in the validator beside the
 * colour maths it was already importing; `theme` re-exports it, so nothing that
 * used it had to change.
 */
