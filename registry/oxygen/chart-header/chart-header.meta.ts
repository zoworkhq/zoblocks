import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "chart-header",
  title: "Chart Header",
  technicalName: "ChartHeader",
  tier: "free",
  status: "stable",
  since: "0.4.0",
  layer: "clinical",

  summary:
    "Persistent patient context that collapses to a safety bar rather than to a name, and never renders administrative gender beside a dose.",

  tagline: "Patient context that collapses to a safety bar, not a name.",
  description:
    "Sticky chrome over PatientBanner. Collapse moves content behind a disclosure rather than out of the accessibility tree. The encounter is an explicit control that will sit in “none selected” rather than pick one for you. The Sex Parameter for Clinical Use appears only where an order or a result is in view, with the context it applies to.",
  rationale:
    "The chart header is the most-read eighty pixels in healthcare software and it is almost always built as a heading. Three consequences follow. It scrolls away, so the clinician acts with no identity on screen. It shows Patient.gender, which is the wrong field for every clinical decision — the right one is the Sex Parameter for Clinical Use, which is context-specific and can legitimately differ between a medication order and a reference range. And it treats the encounter as a subtitle, when which encounter am I documenting into is the single most common cause of a misfiled note. A subtitle cannot be wrong on purpose; a control can say nothing is selected and mean it.",

  categories: ["Clinical", "Navigation"],

  fhir: [
    {
      name: "Patient",
      url: "https://hl7.org/fhir/R4/patient.html",
      note: "Identity through PatientBanner. patient-sexParameterForClinicalUse is read with its comment and period; Patient.gender is never read, not even as a fallback.",
    },
    {
      name: "Encounter",
      url: "https://hl7.org/fhir/R4/encounter.html",
      note: "Each open encounter becomes one option. Nothing is auto-selected when more than one is open.",
    },
    {
      name: "EpisodeOfCare",
      url: "https://hl7.org/fhir/R4/episodeofcare.html",
      note: "status and type give the program; period.start gives the week, and an episode with no start gets no week rather than a guessed one.",
    },
  ],

  states: [
    "Expanded",
    "Collapsed to the safety strip",
    "No encounter is open",
    "Three encounters open — choose one",
    "Sex parameter, with its context",
    "Sex parameter not recorded, on an order screen",
    "Sex parameter withheld on an overview screen",
    "Allergies not asked",
    "Code status not recorded",
    "Isolation and fall risk",
    "Involuntary hold, with its expiry",
    "Hold expired",
    "Program and week",
    "With actions",
  ],

  a11y: [
    {
      label: "Collapse hides nothing from the accessibility tree",
      detail:
        "The expanded content moves behind a disclosure rather than out of the DOM, so a screen-reader user is never worse off than a sighted one. A test asserts the toggle's aria-expanded and aria-controls agree with the region's hidden state in both heights.",
    },
    {
      label: "Focus never lands behind the sticky bar",
      detail:
        "Everything below the header carries a scroll margin the height of the expanded bar (WCAG 2.4.11). A focus ring hidden under sticky chrome is the most common way a keyboard user loses their place in a long chart.",
    },
    {
      label: "The strip is one spoken statement",
      detail:
        "The banner landmark's accessible name is the whole safety strip in reading order, so a screen-reader user hears the six facts as a sentence rather than as six unlabelled chips.",
    },
    {
      label: "Absence is drawn as well as spoken",
      detail:
        '"Allergies not asked" is a dashed border and an italic label, not a missing chip. A blank space where an allergy status should be is the state that gets prescribed against, and it is the only one with no visual weight at all.',
    },
    {
      label: "Tone never carries a fact on its own",
      detail:
        "Each fact is a word plus a 3px bar. Remove the colour and the strip is unchanged in content — which matters here more than on most components, because this is the row read at a glance from two metres away.",
    },
    {
      label: "The encounter control keeps its place in the tab order",
      detail:
        "A header with no change handler renders the encounter as static text rather than as a disabled select. A disabled control leaves the tab order, so a keyboard user could not reach the one fact that says where their note is going.",
    },
  ],

  limitations: [
    "It does not own the scroll sentinel. Only the host knows what its scroll container is, and an IntersectionObserver wired to the wrong ancestor collapses at the wrong moment — so `collapsed` is a prop and the observer belongs to the application.",
    "The safety facts arrive pre-resolved. The allergy question in particular has five answers and its own component; taking a count here would collapse “none known” and “never asked” into the same zero.",
    "It renders one program. A patient in an IOP and a medication clinic has two, and which one belongs in the header is a decision the deployment makes.",
    "Guardianship and conservatorship are carried as an alert rather than modelled. The shape varies by jurisdiction, and a field that means something different in two states is worse than free text that means what it says.",
    "It does not re-guard forms on an encounter change. It reports the change; PatientGuard is what enforces it, and wiring the two is the application's call because only it knows which forms are open.",
  ],

  related: [
    "identity",
    "allergy-chip",
    "care-team-presence",
    "recent-patient-stack",
    "chart-command-palette",
  ],

  dependencies: ["clsx", "tailwind-merge", "@oxygenui-design/identity"],
  registryDependencies: ["utils", "tokens", "chart-header-core"],

  usage: `import { ChartHeader } from "@/components/oxygen/chart-header";
import "@/styles/oxygen-chart-header.css";

<ChartHeader
  patient={patient}
  identifiers={[{ kind: "mrn" }, { kind: "nhs" }]}
  surface="orders"
  now={serverTime}
  encounters={open}
  selectedEncounterId={encounterId}
  onSelectEncounter={setEncounterId}
  safety={{
    allergies: { label: "Penicillin — anaphylaxis", tone: "critical" },
    codeStatus: { label: "DNR" },
  }}
>
  <OrderForm />
</ChartHeader>`,

  guidance: {
    use: [
      "On every chart screen, for the whole session. It is chrome, not a section.",
      "Wrapping the screen rather than sitting above it — the children render inside the patient context the banner establishes, which is what lets PatientGuard compare a form against the chart on screen.",
      "With `surface` set to what is actually in view. That is what decides whether the Sex Parameter for Clinical Use appears at all.",
      "With the safety facts resolved upstream, so the strip states an answer rather than a count.",
    ],
    avoid: [
      "As a page title. A heading scrolls away; this is the thing that must not.",
      "With `Patient.gender` mapped into the SPCU slot. They are different fields and the whole point of the second one is that the first was being misused.",
      "With an encounter auto-selected when several are open. Picking one for the user is picking where the note lands.",
      "Collapsed by default. The first render of a chart is the one where identity matters most.",
    ],
  },

  uxGuidelines: {
    do: [
      "Keep the safety strip in the same order on every screen. Reading it at a glance is the only thing it is for, and contents that move are contents nobody can glance at.",
      "Pass `now` from the server. Whether a hold has expired is not a question to answer with a clock the user can change.",
      "Re-guard open forms when the encounter changes. The component reports the change deliberately so the host can.",
      "Show an expired hold as expired rather than removing it. Its disappearance is not the same signal as its lapse.",
    ],
    dont: [
      "Do not shorten a name to initials in the header. Initials are for avatars; the header is where the name is checked.",
      "Do not put a sixth alert on the strip because it fits. Every extra chip makes allergies and code status harder to find.",
      "Do not unmount the detail on collapse. `hidden` keeps it findable, searchable and reachable by a disclosure — unmounting makes the collapsed header worse for a screen-reader user than for a sighted one.",
      "Do not render the SPCU on an overview screen. Out of context it is a demographic wearing a clinical name.",
    ],
  },

  tags: ["navigation", "layout", "themeable", "print-safe", "headless"],
  aliases: [
    "patient header",
    "chart banner",
    "sticky patient bar",
    "safety strip",
    "encounter context",
  ],

  domain: {
    industries: ["healthcare", "behavioral-health"],
    clinicalContext:
      "Carries the fields behavioral health needs in a header and nowhere else: the program and the week (IOP, week 3 of 8), the legal status with its expiry, and the safety facts that must survive a collapse. The week is what decides whether today's session is a mid-course review or a discharge plan.",
    workflows: ["documentation", "medication", "care-coordination", "intake"],
    phi: {
      handles: true,
      notes:
        "The most PHI-dense element on any chart screen, and the one most likely to be in a screenshot. It is also sticky, so it is on screen during every screen share.",
    },
    auditable: false,
    permissions: ["patient.read", "encounter.read"],
    terminology: ["FHIR", "SNOMED CT"],
  },

  variants: [
    {
      id: "expanded",
      label: "Expanded",
      description: "Banner, encounter control, program and the safety strip.",
      args: { collapsed: false },
    },
    {
      id: "collapsed",
      label: "Collapsed",
      description:
        "The 44px strip a clinician must not act without. Everything else is behind a disclosure, not gone.",
      args: { collapsed: true },
    },
  ],

  controls: [
    {
      prop: "surface",
      control: "segmented",
      label: "Surface",
      options: ["overview", "orders", "results", "documentation"],
      defaultValue: "overview",
    },
    { prop: "collapsed", control: "switch", label: "Collapsed", defaultValue: false },
    { prop: "onSelectEncounter", control: "event", label: "onSelectEncounter" },
  ],

  a11yChecks: [
    {
      wcag: "1.3.1",
      name: "Info and relationships",
      status: "pass",
      how: "The strip is a list with an accessible name, each fact is a list item, and the disclosure is a button with aria-expanded and aria-controls pointing at the region it governs.",
      evidence: "chart-header.test.tsx",
    },
    {
      wcag: "2.4.11",
      name: "Focus not obscured (minimum)",
      status: "pass",
      how: "Content below the sticky header carries a scroll margin the height of the expanded bar, so a focused element is never rendered behind it.",
      evidence: "chart-header.test.tsx",
    },
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: 'role="banner" carrying the safety strip as its name; the encounter is a labelled select, or static text when the host supplies no handler rather than a disabled control.',
      evidence: "chart-header.test.tsx",
    },
    {
      wcag: "1.4.1",
      name: "Use of colour",
      status: "pass",
      how: "Every safety fact is a word before it is a tone, and the tone is a 3px bar rather than a fill. A test asserts the collapsed and expanded strips carry identical text — they differ in how they fit, never in what they say.",
      evidence: "chart-header.test.tsx",
    },
    {
      wcag: "4.1.3",
      name: "Status messages",
      status: "pass",
      how: 'The "no encounter selected" reason is role="status", because it changes as encounters open and close and the difference decides what the clinician does next.',
      evidence: "chart-header.test.tsx",
    },
    {
      wcag: "2.1.1",
      name: "Keyboard",
      status: "pass",
      how: "The disclosure is a native button and the encounter is a native select. Nothing is a div with a click handler and nothing traps focus.",
      evidence: "chart-header.test.tsx",
    },
    {
      wcag: "2.5.8",
      name: "Target size (minimum)",
      status: "pass",
      how: "The toggle and the encounter select both carry a 28px minimum block size, above the 24px floor.",
      evidence: "chart-header.test.tsx",
    },
    {
      wcag: "1.4.10",
      name: "Reflow",
      status: "pass",
      how: "Expanded, the strip wraps, so a patient with four alerts has none of them clipped. Collapsed, it scrolls behind a visible fade instead, because a second line there would move the content underneath at the moment the alerts are being read.",
      evidence: "chart-header.test.tsx",
    },
  ],

  fixtures: ["patientRoutine", "encounterRoutine", "allergyHighRisk"],

  examples: [
    {
      id: "collapse",
      title: "It collapses to the strip, not to the name",
      description:
        "Forty-four pixels carrying allergies, code status, isolation, fall risk, legal status and alerts. The detail moves behind a disclosure rather than out of the DOM, so a screen-reader user is never worse off than a sighted one.",
      fixture: "patientRoutine",
      code: `const [collapsed, setCollapsed] = useState(false);

<ChartHeader
  patient={patient}
  identifiers={[{ kind: "mrn" }, { kind: "nhs" }]}
  collapsed={collapsed}
  onCollapsedChange={setCollapsed}
  safety={safety}
/>`,
    },
    {
      id: "spcu",
      title: "The sex parameter, with its context — and never the gender",
      description:
        "On an order screen it is shown with what it applies to. On an overview screen it is not shown at all, because out of context it is a demographic wearing a clinical name. Where the surface calls for it and nothing is recorded, the header says so rather than leaving the space that invites somebody to reach for Patient.gender.",
      fixture: "patientRoutine",
      code: `resolveSpcu(patient, "orders");
// → { value: "female", context: "for medication dosing", recorded: true }

resolveSpcu(patient, "overview");
// → null — not a demographic

resolveSpcu({ extension: [] }, "orders");
// → { recorded: false } — "not recorded. Do not substitute the administrative gender."`,
    },
    {
      id: "encounter",
      title: "No encounter selected is a state, not a default",
      description:
        "One open encounter is chosen, because there is nothing to choose between. Three open encounters are not, because a note filed into an encounter nobody read is the most common misfiling in the building — and a selection that no longer matches an open encounter reverts to none rather than sliding to the first.",
      fixture: "encounterRoutine",
      code: `resolveEncounterContext(three);
// → { kind: "none", reason: "3 encounters are open — choose one before documenting" }

resolveEncounterContext(three, "enc-2");
// → { kind: "selected", encounter: … }

resolveEncounterContext(three, "enc-closed");
// → { kind: "none", reason: "The selected encounter is no longer open" }`,
    },
    {
      id: "absence",
      title: "Two facts are always on the strip, recorded or not",
      description:
        "Allergy status and code status appear whether or not the host supplied them, because their absence is the finding. Everything else appears only when it exists — an isolation chip on every chart in the hospital is noise, and noise here is what makes the two rows that matter invisible.",
      fixture: "allergyHighRisk",
      code: `safetyStrip({});
// → [{ kind: "allergy",     label: "Allergies not asked",     tone: "absent" },
//    { kind: "code-status", label: "Code status not recorded", tone: "absent" }]`,
    },
  ],

  relationships: {
    builtWith: [],
    usedIn: [],
    patterns: ["chart-review", "documentation", "patient-safety"],
    alternatives: [
      { ref: "identity", when: "the surface needs the safety banner without the workspace chrome" },
    ],
  },

  seo: {
    slug: "chart-header",
    title: "Chart Header — React sticky patient header",
    description:
      "A React chart header that collapses to a safety strip, makes the encounter an explicit control, and never renders administrative gender beside a dose.",
    primaryKeyword: "react patient chart header",
    secondaryKeywords: [
      "sticky patient banner react",
      "sex parameter for clinical use ui",
      "encounter context control",
      "clinical safety strip component",
    ],
    ogImage: "generated",
    searchIntent: "informational",
  },
});
