/**
 * @oxygenui-design/consult — a floating clinical copilot for Ant Design.
 *
 *     import { Consult } from "@oxygenui-design/consult";
 *     import "@oxygenui-design/consult/styles.css";
 *
 *     <Consult
 *       provider={ourEndpoint}
 *       modes={[lookUp, prepare]}
 *       subject={{ reference: "Patient/123", display: "Amara Okonkwo" }}
 *       context={resolver}
 *       suppressed={isAdministeringMedication || isSigningOrders}
 *       onAudit={sink.write}
 *     />
 *
 * antd is a peer dependency, and a thin one — the engine
 * (`@oxygenui-design/consult-core`) has no dependency on React or antd at all,
 * and the behaviour (`@oxygenui-design/consult-react`) has no dependency on
 * antd. An application with a different design system can use either directly,
 * and the shadcn registry item is a second skin over the same two packages.
 */

export { Consult, type ConsultProps } from "./Consult.js";

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

export {
  ConsultLocaleProvider,
  DEFAULT_LOCALE,
  useLocale,
  type ConsultLocale,
} from "./locale.js";

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
  type ConsultContextResolver,
  type ConsultEvent,
  type ConsultMode,
  type ConsultProvider,
  type ConsultShortcut,
  type CrisisLine,
  type ModelDisclosure,
  type ResolvedContext,
  type Source,
  type TelemetryEvent,
  type Withheld,
} from "@oxygenui-design/consult-react";

export { useConsult, type ConsultApi } from "@oxygenui-design/consult-react";
