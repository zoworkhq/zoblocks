/**
 * @zoblocks/copilot-react — headless React for ZoBlocks Copilot.
 *
 * Hooks and unstyled primitives. No design system, no CSS, no markup opinions
 * beyond the ones that are accessibility requirements.
 *
 * This package exists so the hard parts are written once. The streaming
 * announcement strategy, the combobox keyboard model, focus return, reduced
 * motion, citation segmentation — all of it is design-system-agnostic, and
 * putting it here means it is correct in the antd skin and the Tailwind
 * registry skin rather than half-correct in each.
 *
 *     const copilot = useCopilot({ provider, modes, context, subject });
 *     <CopilotRoot api={copilot}>…</CopilotRoot>
 */

export * from "./icons.js";

export {
  useCopilot,
  type CopilotApi,
  type CopilotCitation,
  type CopilotThreadSummary,
  type ScopeSummary,
  type UseCopilotOptions,
} from "./use-copilot.js";

export {
  countWords,
  DEFAULT_ANNOUNCER_MESSAGES,
  lastCompleteSentenceEnd,
  useAnnouncer,
  type Announcer,
  type AnnouncementMode,
  type AnnouncerMessages,
  type UseAnnouncerOptions,
} from "./use-announcer.js";

export {
  filterShortcuts,
  isShortcutQuery,
  shortcutQuery,
  useShortcutMenu,
  type CopilotShortcut,
  type ShortcutMenu,
  type UseShortcutMenuOptions,
} from "./shortcuts.js";

export {
  citationLabel,
  CopilotAnswerRegion,
  CopilotDockRegion,
  CopilotLiveRegion,
  CopilotRoot,
  segmentAnswer,
  useCopilotContext,
  useFocusReturn,
  usePrefersReducedMotion,
  useRegisterLabel,
  useSummonShortcut,
  type CitationSegment,
} from "./primitives.js";

// Re-exported so a consumer never reaches past this package for the engine's
// types. The same courtesy `@zoblocks/signature` extends for its core.
export type {
  ActionProposal,
  Actor,
  Answer,
  AnswerRegister,
  CheckFinding,
  CheckResult,
  CopilotContextResolver,
  CopilotError,
  CopilotEvent,
  CopilotMessage,
  CopilotMode,
  CopilotProvider,
  CopilotStatus,
  CrisisLine,
  FeedbackReason,
  ModelDisclosure,
  ResolvedContext,
  SessionState,
  Source,
  TelemetryEvent,
  Withheld,
} from "@zoblocks/copilot-core";

export {
  behavioralModes,
  betweenVisits,
  computeTrend,
  createStaticProvider,
  defaultModes,
  defineMode,
  describeTrend,
  disclosureCompleteness,
  disclosureFields,
  DISCLOSURE_LABELS,
  DISCLOSURE_SECTIONS,
  formulate,
  lookUp,
  minimalDisclosure,
  prepare,
  workUp,
} from "@zoblocks/copilot-core";
