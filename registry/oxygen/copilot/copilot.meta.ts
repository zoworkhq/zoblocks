import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "copilot",
  title: "Copilot",
  // Free, and deliberately so. `pro` would keep this out of the public registry
  // entirely, and the registry item *is* the adoption engine — a developer
  // tries `oxygen add copilot`, then buys the services and enterprise contracts
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
      // `@oxygenui-design/copilot` is the separate npm skin that does wrap it.
      policy: "neutral",
      bridge: false,
    },
  },

  summary:
    "A floating clinical copilot: a dock above the chart that takes a question and opens into a sourced, auditable thread.",

  tagline: "A chart dock that answers with sources and an audit trail.",
  description:
    "Model-agnostic clinical assistant with mode-level scope contracts, inline source attribution, a deterministic crisis interrupt, and FHIR audit output. The engine and the accessibility behaviour ship as npm packages; this item is the Tailwind skin over them.",
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
        "role=complementary with an accessible name, so it can be found and — more importantly — skipped. The panel does not trap focus, because a clinician has to keep working in the chart with it open, but focus returns to the opener on close.",
    },
    {
      label: "The slash menu is a real combobox",
      detail:
        "Focus stays in the input; arrow keys move aria-activedescendant. Escape closes the menu and leaves the typed text alone, so a free-text question that begins with a slash is not destroyed.",
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
    "Requires @oxygenui-design/copilot-react and @oxygenui-design/copilot-core from npm. The engine is deliberately not inlined — a safety control nobody reads before pasting is not a safety control.",
  ],

  related: ["clinical-note"],

  dependencies: [
    "clsx",
    "tailwind-merge",
    "@oxygenui-design/copilot-core",
    "@oxygenui-design/copilot-react",
  ],
  registryDependencies: ["utils", "tokens"],

  usage: `import { Copilot } from "@/components/oxygen/copilot";
import { lookUp, prepare } from "@oxygenui-design/copilot-core";

// Safest first deployment: reference lookup, no patient data anywhere.
<Copilot provider={ourEndpoint} modes={[lookUp]} />

// With the chart, once a resolver is wired.
<Copilot
  provider={ourEndpoint}
  modes={[lookUp, prepare]}
  subject={{ reference: "Patient/123", display: "Amara Okonkwo" }}
  context={resolver}
  actor={{ display: "Dr Okafor", reference: "Practitioner/7" }}
  onAudit={(event) => auditSink.write(event)}
  // The most valuable prop in the API.
  suppressed={isAdministeringMedication || isSigningOrders}
/>`,
});
