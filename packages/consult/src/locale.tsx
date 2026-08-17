/**
 * Strings, as a provider rather than a bag of props.
 *
 * Two things this file does that a plain object would not.
 *
 * **It separates the clinician register from the patient register** — the same
 * split `@oxygenui-design/intl` already makes. There is no patient surface in
 * Consult today, but the disclosure and crisis strings are the ones a host is
 * most likely to want to reword for a lay reader, and having the seam already
 * cut is cheaper than retrofitting it.
 *
 * **It refuses to hardcode English into antd's chrome.** antd's own close
 * button ships `aria-label="Close"` outside its locale system — a gap found
 * during the Signature work — so every antd control this skin renders gets an
 * explicit label from here.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";

export interface ConsultLocale {
  /** The dock */
  dockLabel: string;
  placeholder: string;
  placeholderPatient: string;
  placeholderSuppressed: string;
  send: string;
  stop: string;
  startDictation: string;
  stopDictation: string;
  dictationLive: string;
  shortcuts: string;
  allShortcuts: string;
  modes: string;
  closeTray: string;

  /** The panel */
  panelLabel: string;
  newChat: string;
  expand: string;
  collapse: string;
  close: string;
  followUp: string;
  reasoning: string;
  thinking: string;

  /** Verification */
  showSources: string;
  hideSources: string;
  basisOfAnswer: string;
  retrieved: string;
  version: string;
  match: string;
  unsupported: string;
  unsupportedHint: string;

  /** Registers */
  grounded: string;
  general: string;
  declined: string;

  /** Scope */
  reading: string;
  readingNothing: string;
  withheld: (count: number) => string;
  changeScope: string;
  asOf: string;

  /** Crisis */
  crisisTitle: string;
  crisisBodyUser: string;
  crisisBodyThirdParty: string;
  crisisProtocol: string;
  crisisOnCall: string;

  /** Feedback */
  helpful: string;
  notHelpful: string;
  copy: string;
  insert: string;
  more: string;

  /** Proposals */
  proposalTitle: string;
  proposalConfirm: string;
  proposalDismiss: string;
  proposalDiff: string;

  /** Disclosure */
  disclosureTitle: string;
  disclosureCompleteness: (answered: number, total: number) => string;
  disclosureUnanswered: string;

  /** Status */
  errorTitle: string;
  retry: string;
  refusedTitle: string;
  switchMode: (label: string) => string;
  emptyTitle: string;
  emptyBody: string;
  stoppedNotice: string;
  partialNotice: string;

  /** The standing line. Never dismissible. */
  disclaimer: string;
}

export const DEFAULT_LOCALE: ConsultLocale = {
  dockLabel: "Clinical assistant",
  // Not "Ask anything". That is a consumer chatbot's placeholder, and it makes
  // a promise the component must not keep.
  placeholder: "Ask about this patient…",
  placeholderPatient: "Search the evidence…",
  placeholderSuppressed: "Paused during this task",
  send: "Send",
  stop: "Stop",
  startDictation: "Start dictation",
  stopDictation: "Stop dictation",
  dictationLive: "Microphone is live",
  shortcuts: "Shortcuts",
  allShortcuts: "See all shortcuts",
  modes: "Change mode",
  closeTray: "Close mode list",

  panelLabel: "Assistant conversation",
  newChat: "New chat",
  expand: "Expand",
  collapse: "Collapse",
  close: "Close",
  followUp: "Ask a follow-up…",
  reasoning: "Reasoning",
  thinking: "Working…",

  showSources: "Show sources",
  hideSources: "Hide sources",
  basisOfAnswer: "Basis of this answer",
  retrieved: "Retrieved",
  version: "Version",
  match: "Match",
  unsupported: "Not supported by a source",
  unsupportedHint: "No source was cited for this sentence. Verify it before acting.",

  grounded: "Grounded",
  general: "General knowledge",
  declined: "Declined",

  reading: "Reading",
  readingNothing: "No patient data is being used",
  withheld: (count) => `${count} record${count === 1 ? "" : "s"} withheld`,
  changeScope: "Change",
  asOf: "as of",

  crisisTitle: "This needs a person, not a model",
  crisisBodyUser:
    "This assistant is not able to help with this. Please reach a person now — the options below connect you to someone who can.",
  crisisBodyThirdParty:
    "This assistant does not answer questions about a patient in immediate danger. Use your organisation's escalation path.",
  crisisProtocol: "Open risk protocol",
  crisisOnCall: "Page on-call",

  helpful: "Helpful",
  notHelpful: "Not helpful",
  copy: "Copy",
  insert: "Insert into note",
  more: "More actions",

  proposalTitle: "Proposed change",
  proposalConfirm: "Insert into the record",
  proposalDismiss: "Discard",
  proposalDiff: "What changes",

  disclosureTitle: "About this assistant",
  disclosureCompleteness: (answered, total) => `${answered} of ${total} attributes answered`,
  disclosureUnanswered: "Not answered",

  errorTitle: "The assistant could not answer",
  retry: "Try again",
  refusedTitle: "Outside what this assistant answers",
  switchMode: (label) => `Switch to ${label}`,
  emptyTitle: "Ask a clinical question",
  emptyBody: "Answers cite their sources so you can check them.",
  stoppedNotice: "You stopped this answer. What is shown may be incomplete.",
  partialNotice: "This answer stopped early and may be incomplete.",

  disclaimer:
    "Medical knowledge only. Not for autonomous decision making. Check sources and use your clinical judgement.",
};

const LocaleContext = createContext<ConsultLocale>(DEFAULT_LOCALE);

export function ConsultLocaleProvider(props: {
  value?: Partial<ConsultLocale>;
  children: ReactNode;
}): ReactNode {
  const merged = useMemo(() => ({ ...DEFAULT_LOCALE, ...props.value }), [props.value]);
  return <LocaleContext.Provider value={merged}>{props.children}</LocaleContext.Provider>;
}

export function useLocale(): ConsultLocale {
  return useContext(LocaleContext);
}
