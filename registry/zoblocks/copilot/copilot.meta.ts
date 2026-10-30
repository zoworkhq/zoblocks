import { defineComponentMeta } from "@zoblocks/component-meta";

export default defineComponentMeta({
  name: "copilot",
  title: "Copilot",
  // Free, and deliberately so. `pro` would keep this out of the public registry
  // entirely, and the registry item *is* the adoption engine — a developer
  // tries `zoblocks add copilot`, then buys the services and enterprise contracts
  // that are the actual revenue line. Charging for the front door would be
  // charging for the wrong thing.
  tier: "free",
  status: "experimental",
  since: "0.3.0",
  layer: "pattern",
  frameworks: {
    antd: {
      // The registry copilot imports no antd — it is the copy-source skin, and
      // a component that copied antd's Modal and Input into someone's
      // repository would be a fork of a framework rather than source they own.
      // `@zoblocks/copilot` is the separate npm skin that does wrap it.
      policy: "neutral",
      bridge: false,
    },
  },

  summary:
    "A clinician-facing assistant dock for scoped questions, sourced answers, and auditable conversations alongside the chart.",

  tagline: "A chart dock that answers with sources and an audit trail.",
  description:
    "A clinician-facing assistant dock that sends questions to a host-provided endpoint and displays streamed answers, sources, safety states, and audit events. Configure its modes and optional chart context to control what each request may read.",
  rationale:
    "The floating dock and the streaming text are two weeks of work and compete with a hundred free widgets. The parts that are hard are deciding what the model may see, proving where an answer came from, keeping chart text from being read as instructions, and knowing whether the thing makes clinicians better or worse. Those are what a digital-health team cannot build in a sprint, and they are what this component is. The design target is not a better answer — it is verification that costs less than acceptance, because automation bias is an effort asymmetry rather than a character flaw, and incorrect decision support has been measured making clinicians worse than no decision support at all.",

  categories: ["Patterns", "AI"],
  fhir: [
    { name: "AuditEvent", url: "https://hl7.org/fhir/R4/auditevent.html" },
    { name: "Provenance", url: "https://hl7.org/fhir/R4/provenance.html" },
    { name: "QuestionnaireResponse", url: "https://hl7.org/fhir/R4/questionnaireresponse.html" },
  ],

  states: [
    "Rest",
    "Mode tray",
    "Shortcuts",
    "Dictating",
    "Streaming",
    "Grounded answer",
    "General-knowledge answer",
    "Sources open",
    "Refused",
    "Crisis",
    "Error",
    "Suppressed",
  ],

  a11y: [
    {
      label: "Streaming is never announced token by token",
      detail:
        "The answer container is aria-live=off with aria-busy while text arrives. A separate visually-hidden status region announces transitions only, and on completion reports word count and source count so a screen-reader user can decide whether to read it.",
    },
    {
      label: "The dock is a landmark, not a floating div",
      detail:
        "The resting dock uses a complementary landmark named 'Clinical assistant'; the conversation is a named section. The panel does not trap focus. Cmd/Ctrl+K focuses the question field. Closing or collapsing does not currently restore focus to the control that opened it.",
    },
    {
      label: "The slash menu is a real combobox",
      detail:
        "The input is a labelled combobox with aria-expanded, aria-controls, aria-autocomplete=list and aria-activedescendant. Arrow Up/Down cycle options, Home/End move to the first/last, Enter selects, and Escape closes the menu without clearing the draft. Enter submits when the menu is closed.",
    },
    {
      label: "Status and answer changes are announced separately",
      detail:
        "A polite role=status region announces state transitions and completion word/source counts. The answer uses aria-live=off and aria-busy while streaming, so tokens are not read automatically; progressive mode announces only complete sentences. Buttons and the follow-up field have accessible names.",
    },
    {
      label: "Citations are named, not numbered",
      detail:
        "Each marker is a button whose accessible name is 'Source 1, 2023 ACC/AHA AF Guideline, version 2023.1' rather than '1'.",
    },
    {
      label: "A live microphone is never conveyed by colour alone",
      detail:
        "Dictation announces start and stop through the status region and carries a visually-hidden label, so the state is available without seeing the waveform. Reduced motion replaces the animation with a static level meter rather than removing the indicator.",
    },
    {
      label: "Reflows to 320px and 400% zoom",
      detail:
        "The dock docks flush to the bottom edge and the panel becomes a full-width sheet. Every interactive target clears 24x24.",
    },
  ],

  guidance: {
    use: [
      "Clinician-facing reference lookup, where no patient data reaches the model at all. This is the safest first deployment and needs no BAA covering PHI in the model call.",
      "Record summarisation before an encounter, once a context resolver is wired and the scope strip can show what was read and what was withheld.",
      "Behavioral health measurement-based care — instrument trends restated from what was documented, which generates no clinical recommendation.",
    ],
    avoid: [
      "Patient-facing surfaces. Copilot throws rather than rendering: Illinois, Nevada and Utah each regulate AI in mental health differently and Nevada prohibits it outright. A patient-facing product is a separate product with a separate regulatory footing.",
      "Any moment the clinician is mid-procedure — administering medication, signing orders, in a documented timeout. Pass `suppressed` and the component removes itself entirely.",
      "Autonomous action. Copilot proposes; a human commits, and provenance attributes the act to the human. There is no configuration that changes this.",
      "Differential generation before you have evaluated your own stack. Below roughly 70% reliability, automation makes performance worse than no automation.",
    ],
  },

  limitations: [
    "Not clinical decision support as any regulator defines it, and not a medical device. The obligations belong to the team that ships it.",
    "The crisis classifier is deterministic and rule-based. It is tuned so that clinical documentation ('denies SI', 'C-SSRS negative') does not escalate, which is what makes it usable in psychiatry — but it is a floor, not a substitute for a risk protocol.",
    "Built-in crisis lines are a development default. 988 is US-only; a host must supply its own for production.",
    "Copilot cannot secure a backend. It guarantees the shape of what it sends and the provenance of what it renders; it cannot stop a host wiring an agent with standing EHR write access behind it.",
    "Requires @zoblocks/copilot-react and @zoblocks/copilot-core from npm. The engine is deliberately not inlined — a safety control nobody reads before pasting is not a safety control.",
  ],

  related: ["clinical-note"],

  dependencies: ["clsx", "tailwind-merge", "@zoblocks/copilot-core", "@zoblocks/copilot-react"],
  registryDependencies: ["utils", "tokens"],

  usage: `import { Copilot } from "@/components/zoblocks/copilot";
import { createStaticProvider, lookUp, prepare, minimalDisclosure } from "@zoblocks/copilot-core";

// Replace this scripted provider with an adapter for your own endpoint.
const provider = createStaticProvider({
  events: [
    { type: "delta", text: "Check the current local guideline before applying it." },
    { type: "done", finish: "stop" },
  ],
  disclosure: minimalDisclosure("demo-model@1", { developer: "Example Health" }),
});

// Safest first deployment: reference lookup, no patient data anywhere.
<Copilot provider={provider} modes={[lookUp]} />

// With the chart, once a resolver is wired.
<Copilot
  provider={provider}
  modes={[lookUp, prepare]}
  subject={{ reference: "Patient/syn-demo-204", display: "Riley Example" }}
  context={resolver}
  actor={{ display: "Jordan Lee", credential: "MD", reference: "Practitioner/syn-pr-204" }}
  onAudit={(event) => auditSink.write(event)}
  // The most valuable prop in the API.
  suppressed={isAdministeringMedication || isSigningOrders}
/>`,

  props: [
    { name: "provider", order: 1 },
    { name: "modes", order: 2 },
    { name: "initialModeId", order: 3 },
    { name: "context", order: 4 },
    { name: "subject", order: 5 },
    { name: "actor", order: 6 },
    { name: "onAudit", order: 7 },
    { name: "onTelemetry", order: 8 },
    { name: "classifiers", order: 9 },
    { name: "crisisLines", order: 10 },
    { name: "surface", order: 11 },
    { name: "locale", order: 12 },
    { name: "announcementMode", order: 13 },
    { name: "suppressed", order: 14 },
    { name: "shortcuts", order: 15 },
    { name: "role", order: 16 },
    { name: "anchor", order: 17 },
    { name: "className", order: 18 },
    { name: "onInsert", order: 19 },
    { name: "onRiskProtocol", order: 20 },
    { name: "now", order: 21 },
    { name: "newId", order: 22 },
  ],

  fixtures: ["copilotReferenceLookup", "copilotRecordSummary", "copilotCrisisEscalation"],

  examples: [
    {
      id: "reference-lookup",
      title: "Start with reference lookup and no chart context",
      description:
        "Use a mode that reads no patient data for a guideline question. The scripted provider makes this example deterministic; a production integration supplies its own endpoint adapter.",
      fixture: "copilotReferenceLookup",
      group: "Configurations",
      code: `import { Copilot } from "@/components/zoblocks/copilot";
import { createStaticProvider, lookUp, minimalDisclosure } from "@zoblocks/copilot-core";

const provider = createStaticProvider({
  events: [
    { type: "delta", text: "Review the current local guidance before applying it." },
    { type: "done", finish: "stop" },
  ],
  disclosure: minimalDisclosure("demo-model@1", { developer: "Example Health" }),
});

<Copilot provider={provider} modes={[lookUp]} anchor="bottom-right" />`,
    },
    {
      id: "scoped-record-summary",
      title: "Add a resolver for a scoped record summary",
      description:
        "Reading modes need a subject and a context resolver. The mode contract limits resource categories, and the provider must explicitly permit patient context before it can be sent.",
      fixture: "copilotRecordSummary",
      group: "Configurations",
      code: `import { Copilot } from "@/components/zoblocks/copilot";
import { lookUp, prepare } from "@zoblocks/copilot-core";

<Copilot
  provider={coveredProvider}
  modes={[lookUp, prepare]}
  initialModeId="prepare"
  subject={{ reference: "Patient/syn-demo-204", display: "Riley Example" }}
  context={contextResolver}
  actor={{ display: "Jordan Lee", credential: "MD" }}
  onAudit={(event) => auditSink.write(event)}
  onInsert={(text) => noteEditor.insertText(text)}
/>`,
    },
    {
      id: "quiet-during-procedure",
      title: "Suppress the dock during a time-critical task",
      description:
        "The host can remove Copilot completely while a clinician is administering medication or signing an order, then restore it when the task ends.",
      fixture: "copilotReferenceLookup",
      group: "Configurations",
      code: `<Copilot
  provider={provider}
  modes={[lookUp]}
  suppressed={isAdministeringMedication || isSigningOrder}
/>`,
    },
    {
      id: "role-specific-shortcuts",
      title: "Offer shortcuts to selected roles",
      description:
        "Shortcuts are filtered by the optional role prop. Each shortcut may select a mode and places its question in the composer; it does not bypass that mode's contract.",
      fixture: "copilotRecordSummary",
      group: "Configurations",
      code: `<Copilot
  provider={provider}
  modes={[lookUp, prepare]}
  role="nurse"
  shortcuts={[
    {
      id: "handoff",
      label: "Prepare handoff",
      keyword: "handoff",
      description: "Draft a concise handoff from the permitted record context.",
      modeId: "prepare",
      question: "Summarise the documented issues for handoff.",
      roles: ["nurse"],
    },
  ]}
/>`,
    },
  ],

  controls: [
    {
      prop: "announcementMode",
      control: "segmented",
      label: "Streaming announced as",
      options: ["summary", "progressive"],
      defaultValue: "summary",
    },
    {
      prop: "anchor",
      control: "segmented",
      label: "Dock position",
      options: ["bottom-center", "bottom-right", "inline"],
      defaultValue: "bottom-center",
    },
    { prop: "suppressed", control: "switch", label: "Suppress assistant", defaultValue: false },
  ],
});
