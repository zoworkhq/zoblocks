/**
 * @zoblocks/tabs-core — the selection engine behind ZoBlocks Tabs.
 *
 * No React, no DOM, no dependencies. Everything here is a pure function or a
 * small state machine over plain data, which is what lets the same keyboard
 * model and the same accessibility contract be reused by a host on a different
 * design system — or tested exhaustively without rendering anything.
 *
 * The one idea worth carrying across: `as` (the semantic mode) and `variant`
 * (the skin) are independent axes. This package owns the first and knows
 * nothing about the second.
 */

export type {
  Activation,
  AuditEvent,
  Availability,
  Box,
  ChangeSource,
  FillMode,
  IndicatorKind,
  MountStrategy,
  Orientation,
  OverflowStrategy,
  SemanticMode,
  StepState,
  TabItem,
  TabSize,
  TabVariant,
  Tone,
  TransitionKind,
} from "./types.js";

export {
  ariaOrientation,
  disabledProps,
  isSemanticMode,
  rolesFor,
  type RoleSpec,
} from "./roles.js";

export {
  focusAfterClose,
  hotkeyIndex,
  isTypeaheadKey,
  keyToIntent,
  matchTypeahead,
  reorderIntent,
  rovingTabIndex,
  tabStopIndex,
  textOf,
  Typeahead,
  type CloseFocusTarget,
  type NavigationIntent,
  type NavigationOptions,
} from "./keyboard.js";

export {
  fitTabs,
  nudgeDistance,
  observationWindow,
  scrollEdges,
  shouldCollapse,
  type FitOptions,
  type FitResult,
  type ScrollEdges,
} from "./overflow.js";

export {
  geometryChanged,
  indicatorAxis,
  indicatorGeometry,
  indicatorStyle,
  resolveIndicator,
  scrollIntoViewDelta,
  type IndicatorGeometry,
  type TriggerOffsets,
} from "./indicator.js";

export {
  formatProblems,
  validateTabsConfig,
  type Problem,
  type ProblemCode,
  type ValidateInput,
} from "./validate.js";

export {
  canEnterStep,
  createChangeGate,
  indexOfValue,
  initialValue,
  type BeforeChange,
  type ChangeGate,
  type ChangeGateOptions,
  type GateOutcome,
} from "./selection.js";

export {
  DEFAULT_LOCALE,
  describeAvailability,
  describeCount,
  describeDot,
  describeTrigger,
  interpolate,
  resolveLocale,
  type TabsLocale,
} from "./locale.js";

export {
  hashAdapter,
  noopAdapter,
  resolveAdapter,
  searchParamAdapter,
  type SyncTarget,
  type UrlAdapter,
} from "./url.js";
