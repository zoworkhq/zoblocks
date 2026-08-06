import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "unsaved-guard",
  title: "Unsaved Guard",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "pattern",

  summary: "Stops clinical documentation being lost to a navigation, a patient switch, or a closed tab.",
  description: "Central registry that stops clinical documentation being lost to a navigation, a patient switch, or a closed tab. Distinguishes recoverable drafts from work that exists only in this tab.",
  rationale: "Lost notes are among the most reliably enraging failures in clinical software, and they are almost always a coordination failure rather than a bug in any one form. Dirtiness is registered centrally so every editor participates, and the guard blocks navigation, patient-context changes, and tab close. Two distinctions decide whether the prompt is honest: recoverable drafts versus work that exists only in this tab, and trivially recreatable state versus twenty minutes of documentation — so the registry takes a description and the prompt names what is at stake.",

  categories: [
    "Primitive",
    "System",
  ],
  fhir: [],

  states: [
    "Clean",
    "Saving",
    "Saved",
    "Autosave failed",
    "Prompt on navigation",
    "Prompt on patient switch",
    "Browser close guard",
  ],

  a11y: [
    {
      label: "Managed focus",
      detail: "The prompt is an alertdialog; focus moves in on open and Escape cancels the departure.",
    },
    {
      label: "Failure is assertive",
      detail: "Autosave failure announces assertively. A silent failure lets someone write for twenty minutes believing their note is filed.",
    },
    {
      label: "Named stakes",
      detail: "The dialog lists each dirty surface by description, so the consequence is legible rather than generic.",
    },
  ],

  guidance: {
    use: [
      "Around the whole application, once, at the root.",
      "In every editing surface \\u2014 a guard only some forms use is a guard that does not work.",
      "Before any patient-context change, not just route changes.",
    ],
    avoid: [
      "Describing a surface as \\u201cform\\u201d or \\u201cchanges\\u201d. Name what would be lost.",
      "Treating a failed autosave as recoverable. That draft exists only in this tab.",
      "Relying on the browser prompt alone \\u2014 it cannot be styled or worded.",
    ],
  },

  limitations: [
    "The browser-level prompt cannot be styled or worded \\u2014 that is a platform limit.",
    "Does not persist drafts; it reports save state and blocks. Persistence is yours.",
    "Route interception depends on your router calling confirmLeave.",
  ],
  related: [
    "action-gate",
    "app-shell",
  ],

  dependencies: [
    "lucide-react",
    "clsx",
    "tailwind-merge",
  ],
  registryDependencies: [
    "utils",
    "tokens",
  ],

  usage: `import {
  UnsavedGuardProvider,
  useUnsavedWork,
  useConfirmLeave,
  SaveStatus,
} from "@/components/oxygen/unsaved-guard";

useUnsavedWork({ id: "note-42", description: "Progress note", saveState });

const confirmLeave = useConfirmLeave();
if (await confirmLeave("Switching to another patient.")) switchPatient();`,
});
