/**
 * @oxygenui-design/copilot — a floating clinical copilot for Ant Design.
 *
 *     import { Copilot } from "@oxygenui-design/copilot";
 *     import "@oxygenui-design/copilot/styles.css";
 *
 *     <Copilot
 *       provider={ourEndpoint}
 *       modes={[lookUp, prepare]}
 *       subject={{ reference: "Patient/123", display: "Amara Okonkwo" }}
 *       context={resolver}
 *       suppressed={isAdministeringMedication || isSigningOrders}
 *       onAudit={sink.write}
 *     />
 *
 * antd is a peer dependency, and a thin one — the engine
 * (`@oxygenui-design/copilot-core`) has no dependency on React or antd at all,
 * and the behaviour (`@oxygenui-design/copilot-react`) has no dependency on
 * antd. An application with a different design system can use either directly,
 * and the shadcn registry item is a second skin over the same two packages.
 */

export { Copilot, type CopilotProps } from "./Copilot.js";

export {
  AnswerBody,
  CheckNotices,
  CrisisNotice,
  DisclosureSheet,
  ProposalCard,
  RegisterBadge,
  ScopeStrip,
  SourcesPanel,
} from "./parts.js";

export { CopilotLocaleProvider, DEFAULT_LOCALE, useLocale, type CopilotLocale } from "./locale.js";

// Re-exported so a consumer never needs to reach past this package for the
// modes, the provider contract, or the value types.
export {
  behavioralModes,
  betweenVisits,
  computeTrend,
  createStaticProvider,
  defaultModes,
  defineMode,
  describeTrend,
  formulate,
  lookUp,
  minimalDisclosure,
  prepare,
  workUp,
  type ActionProposal,
  type Answer,
  type AnswerRegister,
  type CopilotContextResolver,
  type CopilotEvent,
  type CopilotMode,
  type CopilotProvider,
  type CopilotShortcut,
  type CrisisLine,
  type ModelDisclosure,
  type ResolvedContext,
  type Source,
  type TelemetryEvent,
  type Withheld,
} from "@oxygenui-design/copilot-react";

export { useCopilot, type CopilotApi } from "@oxygenui-design/copilot-react";
