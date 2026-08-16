/**
 * @oxygenui-design/consult-react — headless React for Oxygen Consult.
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
 *     const consult = useConsult({ provider, modes, context, subject });
 *     <ConsultRoot api={consult}>…</ConsultRoot>
 */

export {
  useConsult,
  type ConsultApi,
  type ScopeSummary,
  type UseConsultOptions,
} from "./use-consult.js";

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
  type ConsultShortcut,
  type ShortcutMenu,
  type UseShortcutMenuOptions,
} from "./shortcuts.js";

export {
  citationLabel,
  ConsultAnswerRegion,
  ConsultDockRegion,
  ConsultLiveRegion,
  ConsultRoot,
  segmentAnswer,
  useConsultContext,
  useFocusReturn,
  usePrefersReducedMotion,
  useRegisterLabel,
  useSummonShortcut,
  type CitationSegment,
} from "./primitives.js";

// Re-exported so a consumer never reaches past this package for the engine's
// types. The same courtesy `@oxygenui-design/signature` extends for its core.
export type {
  ActionProposal,
  Actor,
  Answer,
  AnswerRegister,
  CheckFinding,
  CheckResult,
  ConsultContextResolver,
  ConsultError,
  ConsultEvent,
  ConsultMessage,
  ConsultMode,
  ConsultProvider,
  ConsultStatus,
  CrisisLine,
  FeedbackReason,
  ModelDisclosure,
  ResolvedContext,
  SessionState,
  Source,
  TelemetryEvent,
  Withheld,
} from "@oxygenui-design/consult-core";

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
} from "@oxygenui-design/consult-core";
