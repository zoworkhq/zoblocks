import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "chart-command-palette",
  title: "Chart Command Palette",
  technicalName: "ChartCommandPalette",
  tier: "free",
  status: "stable",
  since: "0.4.0",
  layer: "clinical",

  summary:
    "A command palette that understands clinical verbs, scopes every search to a treatment relationship, and audits the searches it refuses.",

  tagline: "Clinical verbs, scoped to a treatment relationship.",
  description:
    "Actions rank above records, because a verb is usually what was meant. Patients outside your relationships are counted rather than named. Every patient search emits an audit event, including the ones that matched nobody, and a clinically significant action never runs on the first Enter.",
  rationale:
    "Clinical navigation is a menu tree six levels deep, and the fastest people in every organisation have memorised a set of shortcuts nobody documented. A palette is the obvious answer and almost nobody ships one, for a reason that is not obvious: in healthcare, search is a regulated act. Typing a name into a global patient search is a privacy event whether or not you open the chart, and a palette that helpfully autocompletes across the whole patient index has created a compliance problem at the speed of thought. So out-of-scope matches are rendered as a count — 3 further matches, break-glass required — which is the whole design: the reader learns the search was not empty without learning who.",

  categories: ["Clinical", "Navigation"],

  fhir: [
    {
      name: "Patient",
      url: "https://hl7.org/fhir/R4/patient.html",
      note: "Searched, and the only kind of result that is scoped. Matches outside the treatment relationship are counted, never named, and the search is audited whether or not it matched.",
    },
    {
      name: "Task",
      url: "https://hl7.org/fhir/R4/task.html",
      note: "Actions map to Task, ServiceRequest and Communication creation in the host. The palette runs the verb; it never writes the resource.",
    },
  ],

  states: [
    "Empty, before anything is typed",
    "Actions ranked above records",
    "A verb waiting for its argument",
    "A significant action, first Enter",
    "An action that cannot run",
    "Out-of-scope patients, counted",
    "Break-glass unavailable to this role",
    "Nothing matches",
    "Grouped results",
    "Keyboard navigation",
    "Frequency weighting",
    "Every match named, with no scope",
  ],

  a11y: [
    {
      label: "A combobox with an active descendant",
      detail:
        'role="combobox" on the input with aria-activedescendant pointing at the highlighted option, so focus never leaves the field a person is typing into.',
    },
    {
      label: "The result count is announced once, not per keystroke",
      detail:
        "The live region is debounced by 350ms. A palette that announces on every keystroke restarts its own announcement before the previous word finishes, and a screen-reader user hears nothing in full.",
    },
    {
      label: "Focus returns to the invoking element on every close path",
      detail:
        "Escape, running an item, and an external close all restore focus to whatever was focused when the palette opened. A palette that drops focus to the body has stranded the user it exists for.",
    },
    {
      label: "Unavailable actions are shown with the reason",
      detail:
        'aria-disabled with the reason as text — "Offline", "Requires prescriber role". An action that vanishes teaches somebody the feature does not exist; one shown disabled teaches them what to change.',
    },
    {
      label: "The withheld count is a row, not a footnote",
      detail:
        "It sits in the list where the results would be. A reader who does not see it concludes the search was empty, which is the one wrong conclusion available.",
    },
    {
      label: "Groups are labelled groups",
      detail:
        'Each section is role="group" with its own name inside the listbox, so a screen reader announces "Actions, 3 items" rather than reading twelve options as one undifferentiated list.',
    },
  ],

  limitations: [
    "Sources are a flat array rather than registered providers. The provider interface, its abort signals and its per-source failure handling belong to the host, which is the only place that knows which of them is a slow terminology server.",
    "Ranking is synchronous and unwindowed. Above roughly a thousand candidates it belongs in a worker, and the host should pre-filter rather than hand the palette its whole index.",
    "The audit record is produced, not written. The palette says what was searched and what was withheld; where that goes is the host's, because it is the host that knows the actor and the session.",
    "Break-glass is signalled, never performed. The palette says an override exists and that the user may request one; the workflow behind it is a separate surface with its own consent and its own record.",
    "The matcher is deliberately about sixty lines. It does not do transposition or phonetic matching, so a genuine typo in a patient's name will miss — which is the safer failure for a component whose other job is to not over-report people.",
  ],

  related: ["recent-patient-stack", "chart-header", "chart-context-menu"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "palette-core"],

  usage: `import { ChartCommandPalette } from "@/components/oxygen/chart-command-palette";
import "@/styles/oxygen-palette.css";

<ChartCommandPalette
  open={open}
  items={items}
  scope={{ inScope: myPatients, breakGlass: true }}
  onRun={run}
  onSearchAudit={(audit) => log("patient-search", audit)}
  onClose={() => setOpen(false)}
/>`,

  guidance: {
    use: [
      "Behind ⌘K, everywhere. The palette is the shortcut the fastest clinicians already invented for themselves.",
      "With a scope. Without one, patient results are unfiltered — which is the compliance problem the component exists to avoid.",
      "With `onSearchAudit` wired before the first patient source is added. A palette that searches the index without recording it is worse than no palette.",
      "With `significant` set on anything destructive or clinically consequential, so it takes a second Enter rather than the first.",
    ],
    avoid: [
      "Without an audit sink. The component will still produce the record; nothing will keep it.",
      "As a replacement for the menu. It is the fast path for people who know what they want, not the only path.",
      "With the whole patient index passed as items. Pre-filter server-side; ranking a hundred thousand candidates in the render is not what this is.",
      "With confirmations delegated to a modal. The palette is a keyboard surface and a modal takes the keyboard away from it mid-flow.",
    ],
  },

  uxGuidelines: {
    do: [
      "Give behavioral-health verbs first-class entries: start PHQ-9, open safety plan, log a collateral contact, document a no-show, begin group note.",
      "Route a Part 2 disclosure request to the consent workflow, never to the document. The verb is legitimate; the shortcut to the file is not.",
      "Put enough in `detail` to choose between two similar rows. Two identical labels with no detail is a coin toss with a chart.",
      "Show unavailable actions rather than hiding them, and say why.",
    ],
    dont: [
      "Do not name a patient outside the treatment relationship, under any weighting. The count is the answer.",
      "Do not suppress the audit for an empty search. In a privacy review the empty ones are the interesting ones.",
      "Do not let frequency outrank the group. A much-visited document above the verb somebody just typed has stopped being a command palette.",
      "Do not run a significant action on the first Enter, even when the user is fast. Especially then.",
    ],
  },

  tags: ["navigation", "keyboard-first", "overlay", "themeable", "headless"],
  aliases: ["command palette", "cmd k", "quick search", "clinical search", "spotlight"],

  domain: {
    industries: ["healthcare", "behavioral-health"],
    clinicalContext:
      "Behavioral-health verbs are distinct and worth first-class ranking — start PHQ-9, open safety plan, log a collateral contact, document a no-show, begin group note — and one of them has consequences: a Part 2 disclosure request routes to a consent workflow rather than to a document.",
    workflows: ["documentation", "medication", "care-coordination", "intake"],
    phi: {
      handles: true,
      notes:
        "Searches the patient index. The out-of-scope count and the audit record exist because a search is a privacy event before any chart is opened.",
    },
    auditable: true,
    permissions: ["patient.read", "audit.write"],
    terminology: ["FHIR"],
  },

  variants: [
    {
      id: "scoped",
      label: "Scoped",
      description:
        "With a treatment-relationship scope. Out-of-scope patients are counted rather than named.",
      args: { open: true },
    },
    {
      id: "unscoped",
      label: "Unscoped",
      description:
        "No treatment-relationship scope, so every match is named. The contrast is the argument.",
      args: { open: true, scope: undefined },
    },
  ],

  controls: [
    { prop: "open", control: "switch", label: "Open", defaultValue: true },
    { prop: "onRun", control: "event", label: "onRun" },
    { prop: "onSearchAudit", control: "event", label: "onSearchAudit" },
  ],

  a11yChecks: [
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: "A labelled combobox with aria-expanded, aria-controls and aria-activedescendant; a listbox of options with aria-selected, and labelled groups inside it.",
      evidence: "chart-command-palette.test.tsx",
    },
    {
      wcag: "2.1.1",
      name: "Keyboard",
      status: "pass",
      how: "Arrows move the active option, Tab accepts an argument, Enter runs, Escape closes. Nothing needs a pointer.",
      evidence: "chart-command-palette.test.tsx",
    },
    {
      wcag: "2.4.3",
      name: "Focus order",
      status: "pass",
      how: "Focus stays in the input for the whole session and returns to the invoking element on close — a test asserts it, because this is the failure that strands a keyboard user.",
      evidence: "chart-command-palette.test.tsx",
    },
    {
      wcag: "4.1.3",
      name: "Status messages",
      status: "pass",
      how: 'aria-live="polite" carrying the result count and the withheld count, debounced by 350ms so typing does not restart the announcement on every keystroke.',
      evidence: "chart-command-palette.test.tsx",
    },
    {
      wcag: "3.3.4",
      name: "Error prevention",
      status: "pass",
      how: "A significant action requires a second Enter, and the confirmation is a row in the palette rather than a modal that takes the keyboard away.",
      evidence: "chart-command-palette.test.tsx",
    },
    {
      wcag: "1.4.1",
      name: "Use of colour",
      status: "pass",
      how: "The active row carries a bar and a background; a significant action carries a marker before its confirmation; an unavailable one is struck through and states its reason in words.",
      evidence: "chart-command-palette.test.tsx",
    },
    {
      wcag: "2.5.8",
      name: "Target size (minimum)",
      status: "pass",
      how: "Options are 32px on a pointer device and 44px below 40rem, both above the 24px floor.",
      evidence: "chart-command-palette.test.tsx",
    },
    {
      wcag: "1.4.10",
      name: "Reflow",
      status: "pass",
      how: "Below 40rem the palette becomes a full-screen sheet with taller rows and no keyboard hints, because there is no keyboard to hint at.",
      evidence: "chart-command-palette.test.tsx",
    },
  ],

  fixtures: ["patientRoutine", "patientRestricted", "patients"],

  examples: [
    {
      id: "counted",
      title: "Out of scope is a count, never a name",
      description:
        "Typing a name into a global patient search is a privacy event whether or not you open the chart. Matches outside your treatment relationships are rendered as a number, so the reader learns the search was not empty without learning who — and the row sits in the list rather than under it, because a reader who misses it concludes the search was empty.",
      fixture: "patients",
      code: `applyScope(rank("okon", items), { inScope: new Set(["p-mine"]) });
// → { visible: [ … 1 patient … ], withheld: 3 }

describeWithheld(3, { breakGlass: true });
// → "3 further matches outside your patients — break-glass required"`,
    },
    {
      id: "audit",
      title: "Every patient search is recorded, including the empty ones",
      description:
        "A search that found nobody is still a search that was made, and in a privacy review the empty ones are the interesting ones. The component produces the record and the host keeps it; a term that never reached the patient index produces nothing, because there is nothing to record.",
      fixture: "patientRestricted",
      code: `auditFor("okonkwo", results, /* searchedPatients */ true);
// → { term: "okonkwo", shown: 1, withheld: 3, empty: false }

auditFor("zzzz", empty, true);   // → { …, shown: 0, withheld: 0, empty: true }
auditFor("dark mode", results, false); // → null — the index was never touched`,
    },
    {
      id: "verbs",
      title: "Actions rank above records, because a verb is what was meant",
      description:
        "The gap between a group and the next is deliberately larger than anything frequency can close. A palette where a much-visited document outranks the verb somebody just typed has stopped being a command palette — and behavioral-health verbs are first-class here, including the one with consequences: a Part 2 disclosure request routes to consent, never to a file.",
      fixture: "patientRoutine",
      code: `rank("phq", [
  { id: "doc", kind: "chart-resource", label: "PHQ-9 result, 12 Aug" },
  { id: "run", kind: "action",         label: "Start PHQ-9" },
])[0].item.id;
// → "run"`,
    },
    {
      id: "second-enter",
      title: "A significant action never runs on the first Enter",
      description:
        "The confirmation is a row inside the palette rather than a modal, because a modal takes the keyboard away from the surface that was built for it. The marker is on the row before it is chosen, so the second Enter is not a surprise mid-keystroke.",
      fixture: "patientRoutine",
      code: `outcomeFor(discontinue);        // { kind: "confirm", prompt: "… press Enter again" }
outcomeFor(discontinue, true);  // { kind: "run" }
outcomeFor(offlineOrder);       // { kind: "blocked", reason: "Offline" }`,
    },
  ],

  relationships: {
    builtWith: [],
    usedIn: [],
    patterns: ["chart-review", "care-coordination", "documentation"],
    alternatives: [{ ref: "recent-patient-stack", when: "the chart you want is already open" }],
  },

  seo: {
    slug: "chart-command-palette",
    title: "Chart Command Palette — React clinical ⌘K",
    description:
      "React ⌘K for clinical apps: verb-first ranking, relationship scoping that counts rather than names, and an audit for every patient search.",
    primaryKeyword: "react clinical command palette",
    secondaryKeywords: [
      "cmd k healthcare ui",
      "treatment relationship scoping",
      "patient search audit",
      "break glass component",
    ],
    ogImage: "generated",
    searchIntent: "informational",
  },
});
