/**
 * @oxygenui-design/figma-core — Oxygen themes as Figma variable plans.
 *
 * Pure by construction: no `figma.*`, no DOM, no network, no `node:*`. A Figma
 * plugin runs across two isolated contexts — a sandbox with the Figma API and
 * no networking, and an iframe with networking and no Figma API — and neither
 * is pleasant to test. Keeping every rule in here makes that irrelevant: the
 * adapter on either side reads plain data in and applies plain data out, and
 * has no conditionals worth a test.
 *
 * The validator is re-exported so a plugin has one import rather than two, and
 * so the answer it gives is provably the answer the console and the publish
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
  contrastBetween,
  measureContrast,
  parseHex,
  validateTokens,
} from "@oxygenui-design/tokens/validate";

/*
 * `nearestPassing` is deliberately *not* re-exported, and that is a finding
 * rather than an omission.
 *
 * The plan assumed it sat with the rest of the colour maths in
 * `@oxygenui-design/tokens/validate`. It does not — it lives in
 * `@oxygenui-design/theme/src/ramp.ts`, whose only import is that validator, so
 * it is pure and could move. But `theme` also carries the document schema, zod
 * and both framework bridges, and making a plugin sandbox depend on all of that
 * to offer one suggestion is the wrong trade.
 *
 * Phase 2 needs it, because the panel offers a nearest passing colour exactly
 * as the token editor does. The choice there is to move `ramp.ts` into the
 * validator package — where `generateRamp` and `ANCHOR_STEP` arguably belong
 * too — or to duplicate four lines of binary search. The first is right and is
 * a refactor with one call site outside its own tests, which is why it is
 * called out here rather than done quietly as part of something else.
 */
