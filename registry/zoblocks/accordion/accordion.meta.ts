import { defineComponentMeta } from "@zoblocks/component-meta";

export default defineComponentMeta({
  name: "accordion",
  title: "Accordion",
  tier: "free",
  status: "beta",
  since: "0.3.0",
  layer: "primitive",

  summary:
    "A disclosure widget whose headers can be read while closed, with a per-section access model for content a reader may not simply be shown.",

  tagline: "Headers readable while closed, with per-section access control.",
  description:
    "Collapsible sections with a summary slot in the header, clinical severity on the leading edge, sections that cannot be closed, and four kinds of gate between a reader and content that is governed rather than merely hidden. Ant Design's Collapse API, with the accordion mode's accessibility defects fixed.",
  rationale:
    "Every accordion assumes hidden means unneeded. In a behavioral health record it does not: what is collapsed may be a suicide-risk item, a safety plan someone needs in ninety seconds, a note the patient has a legal right to read but may not be ready to, or a substance-use record governed by a different federal rule than the chart around it. Three consequences follow, and together they are the component. Collapsed is not absent, so the header carries a summary and a severity rail. Disclosure is an event rather than a state change, so opening a governed section can require a consent, a reason code, or nothing but the reader's own choice. And content this reader cannot obtain still gets a row that says so, because deleting it claims the record is complete — which is CONTENT.md's governing rule applied to the one component whose entire job is omitting facts on purpose.",

  categories: ["Disclosure", "Layout"],
  fhir: [],

  states: [
    "Closed",
    "Open",
    "Summary in the header",
    "Severity on the leading edge",
    "Pinned — cannot be closed",
    "Advisory gate",
    "Reason gate",
    "Consent gate",
    "Consent refused",
    "Withheld",
    "Single open at a time",
    "Nested, with heading levels",
  ],

  a11y: [
    {
      label: "Every trigger is a real button inside a real heading",
      detail:
        "The trigger is a <button> wrapped in an h1–h6 chosen by headingLevel, so Enter and Space both activate it and every section appears in a screen reader's heading list. Ant Design renders a div with role=button that handles Enter only — which means Space scrolls the page instead of opening the section — and no heading element at all, so a fourteen-section chart offers no outline.",
    },
    {
      label: "One pattern in every configuration",
      detail:
        "The accordion prop changes the state policy and nothing else. There is no role=tablist, tab, or tabpanel in any configuration, and aria-controls, the panel id, and aria-labelledby are wired identically whether one section opens at a time or several.",
    },
    {
      label: "Region landmarks, but only up to six",
      detail:
        "panelRole=auto follows APG: role=region with aria-labelledby up to six simultaneously-openable sections, omitted above that, where a landmark list stops being navigation and becomes noise. A withheld panel is never a region — an empty landmark is a dead end in the rotor.",
    },
    {
      label: "Collapsed content is still findable",
      detail:
        'Closed panels carry hidden="until-found", so Ctrl+F and fragment navigation reveal them. A clinician searching a chart for a drug name and getting no match concludes the record does not mention it.',
    },
    {
      label: "Disabled triggers still take focus",
      detail:
        "Pinned and withheld sections set aria-disabled rather than disabled, so a keyboard user lands on them and hears the label instead of tabbing past a row that appears not to exist.",
    },
    {
      label: "Arrow keys navigate, and never activate",
      detail:
        "Up, Down, Home and End move focus between headers and wrap. They never toggle a section, so a keyboard user cannot open a governed one by scrolling through the list.",
    },
  ],

  guidance: {
    use: [
      "Long records where most sections are not needed on most visits — charts, treatment plans, note histories.",
      "Anywhere a section is governed differently from the rest of the screen: 42 CFR Part 2, a Cures Act exception, a break-the-glass access.",
      "Patient-facing surfaces where the reader should choose when to see something, rather than meeting it on arrival.",
      "Ordered procedures with one step that must stay visible — a safety plan's crisis contacts.",
    ],
    avoid: [
      "Alternative views of the same region. That is a tab set, and the two patterns announce themselves differently.",
      "Content that is short enough to show in full. An accordion over four lines costs an interaction and saves nothing.",
      "Hiding a fact to save a row. Density is spacing, never which clinical facts appear.",
      "As an access control. The gate is an interface affordance for a policy the application owns and enforces elsewhere.",
    ],
  },

  limitations: [
    "Not an access control. onDisclose reports that a reader asked; refusing to render is not the same as refusing to serve, and the application still owns authorisation and audit.",
    "Severity is supplied, never derived. The component will not score an instrument or decide what is urgent — that would make it clinical decision support.",
    'React cannot express hidden="until-found": React 19 serialises it as hidden="", so the attribute is upgraded after commit. Between commit and effect a closed panel is hidden but not yet findable.',
    "Requires styles/zoblocks-accordion.css, installed with accordion-core.",
    "Above roughly 200 sections, render your own windowed list over useAccordion. Virtualising breaks find-in-page, so the component does not do it silently.",
    "persistKey is not implemented. Remembering which sections a reader opened is per-product storage, and storing it for a gated section would defeat the gate.",
  ],
  related: ["chart-accordion", "safety-plan", "care-timeline", "tabs", "timeline"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "accordion-core"],

  controls: [
    {
      prop: "variant",
      control: "segmented",
      label: "variant",
      options: ["bordered", "separate", "ghost"],
      defaultValue: "bordered",
    },
    {
      prop: "density",
      control: "segmented",
      label: "density",
      options: ["patient", "standard", "clinical"],
      defaultValue: "standard",
    },
    {
      prop: "size",
      control: "segmented",
      label: "size",
      options: ["small", "medium", "large"],
      defaultValue: "medium",
    },
    {
      prop: "expandIconPlacement",
      control: "segmented",
      label: "expandIconPlacement",
      options: ["start", "end"],
      defaultValue: "start",
    },
    {
      prop: "collapsible",
      control: "segmented",
      label: "collapsible",
      options: ["header", "icon", "disabled"],
      defaultValue: "header",
    },
    {
      prop: "headingLevel",
      control: "slider",
      label: "headingLevel",
      min: 2,
      max: 6,
      step: 1,
      defaultValue: 3,
    },
    { prop: "accordion", control: "switch", label: "accordion", defaultValue: false },
    { prop: "findable", control: "switch", label: "findable", defaultValue: true },
    { prop: "onChange", control: "event" },
  ],

  examples: [
    /* ---------------------------------------------------------------- */
    /* The record                                                         */
    /* ---------------------------------------------------------------- */
    {
      id: "record-while-closed",
      group: "The record",
      title: "A record that reads while closed",
      description:
        "Collapsed is not absent. Each header carries the fact that would change what the reader does next, and severity sits on the leading edge paired with a summary in words, never colour alone.",
      code: `import { Accordion } from "@/components/zoblocks/accordion";

export default function Example() {
  return (
    <Accordion
      headingLevel={3}
      items={[
        {
          key: "risk",
          label: "Risk & suicidality",
          severity: "critical",
          summary: "C-SSRS positive · 13 Aug",
          children: <RiskPanel />,
        },
        {
          key: "meds",
          label: "Medications",
          severity: "high",
          summary: "Clozapine ANC due 18 Aug",
          children: <Medications />,
        },
        { key: "plan", label: "Safety plan", severity: "normal", summary: "Current · revised 11 Aug", children: <SafetyPlan /> },
        { key: "audit", label: "AUDIT", severity: "unknown", summary: "Not asked this visit", children: <Audit /> },
      ]}
    />
  );
}`,
    },
    {
      id: "pinned",
      group: "The record",
      title: "A section that cannot be closed",
      description:
        "The crisis step of a safety plan. Someone opening it at 2am should reach a phone number without making a single correct decision about a chevron. Pinned stays focusable, so nobody tabs past it.",
      code: `<Accordion
  headingLevel={3}
  items={[
    { key: "signs", label: "1 · Signs that things are getting harder", children: <Signs /> },
    { key: "coping", label: "2 · Things I can do on my own", children: <Coping /> },
    {
      key: "crisis",
      label: "3 · If none of that is working",
      pinned: true,
      severity: "critical",
      summary: "Always open",
      children: <CrisisContacts />,
    },
  ]}
/>`,
    },
    {
      id: "single-open",
      group: "The record",
      title: "One section at a time",
      description:
        "accordion changes the state policy and nothing else. The roles are identical to the multi-open case — there is no tablist in any configuration, which is the defect Ant Design's accordion mode has.",
      code: `<Accordion accordion headingLevel={3} defaultActiveKey={["risk"]} items={chartSections} />`,
    },

    /* ---------------------------------------------------------------- */
    /* Governed sections                                                  */
    /* ---------------------------------------------------------------- */
    {
      id: "advisory",
      group: "Governed sections",
      title: "The reader chooses when to see it",
      description:
        "An advisory gate costs nothing but a choice and records nothing. Progressive disclosure at the reader's own pace is the core trauma-informed move: the point is that they decide, not that the content is concealed.",
      code: `<Accordion
  headingLevel={3}
  onDisclose={() => true}
  items={[
    {
      key: "note",
      label: "Your session summary — 13 August",
      access: { kind: "advisory", notice: "This summary talks about self-harm" },
      children: <SessionSummary />,
    },
  ]}
/>`,
    },
    {
      id: "reason",
      group: "Governed sections",
      title: "Break the glass, with a reason",
      description:
        "Permitted, but recorded. The reason is collected before the access, not after it, and onDisclose receives the code so the application can write the audit event.",
      code: `<Accordion
  headingLevel={3}
  onDisclose={async (event) => {
    await audit.record({ section: event.key, reason: event.reasonCode, at: event.at });
    return true;
  }}
  items={[
    {
      key: "external",
      label: "Records from another organisation",
      severity: "high",
      summary: "Access is recorded",
      access: {
        kind: "reason",
        reasons: [
          { code: "emergency", label: "Emergency treatment" },
          { code: "covering", label: "Covering clinician" },
          { code: "coordination", label: "Care coordination" },
        ],
      },
      children: <ExternalRecords />,
    },
  ]}
/>`,
    },
    {
      id: "consent",
      group: "Governed sections",
      title: "A consent gate",
      description:
        "Expanding a section and disclosing its content are separate events. The governing policy is named in the header, so a closed section says it too, and an expiry is stated before it lapses.",
      code: `<Accordion
  headingLevel={3}
  onDisclose={() => true}
  items={[
    {
      key: "sud",
      label: "Substance use treatment",
      summary: "42 CFR Part 2",
      access: { kind: "consent", policy: "42 CFR Part 2", state: "granted", expiresAt: "2027-02-02" },
      children: <SudTreatment />,
    },
    { key: "notes", label: "Progress notes", summary: "142 encounters", children: <ProgressNotes /> },
  ]}
/>`,
    },
    {
      id: "consent-refused",
      group: "Governed sections",
      title: "When the application refuses",
      description:
        "onDisclose returns false. The component says what did not happen and keeps the content where it was — the gate is an affordance for a policy the application owns, not the policy itself.",
      code: `<Accordion
  headingLevel={3}
  onDisclose={() => false}
  items={[
    {
      key: "sud",
      label: "Substance use treatment",
      access: { kind: "consent", policy: "42 CFR Part 2", state: "missing" },
      children: <SudTreatment />,
    },
  ]}
/>`,
    },
    {
      id: "withheld",
      group: "Governed sections",
      title: "Withheld, and saying so",
      description:
        "Content this reader cannot obtain still gets a row. Deleting it would claim the record is complete. A withheld item cannot take children at all, so the content never reaches the bundle.",
      code: `<Accordion
  headingLevel={3}
  items={[
    { key: "notes", label: "Progress notes", summary: "142 encounters", children: <ProgressNotes /> },
    {
      key: "psychotherapy",
      label: "Psychotherapy notes",
      access: { kind: "withheld", reason: "Kept separately by the author" },
    },
    {
      key: "sealed",
      label: "Adolescent visit, 2019",
      access: {
        kind: "withheld",
        reason: "Sealed under state minor-consent law. Not releasable to this account.",
      },
    },
  ]}
/>`,
    },

    /* ---------------------------------------------------------------- */
    /* Structure                                                          */
    /* ---------------------------------------------------------------- */
    {
      id: "nested",
      group: "Structure",
      title: "Nested, with heading levels",
      description:
        "The outline is the navigation model. Every trigger sits inside a real heading, so the nested accordion steps down a level and a screen reader's heading list shows the plan's shape.",
      code: `<Accordion
  headingLevel={2}
  items={[
    {
      key: "plan",
      label: "Treatment plan",
      summary: "2 problems · 5 goals",
      children: (
        <Accordion
          headingLevel={3}
          variant="ghost"
          items={[
            { key: "mdd", label: "Major depressive disorder, recurrent, severe", summary: "3 goals", children: <Goals problem="mdd" /> },
            { key: "aud", label: "Alcohol use disorder, moderate", summary: "2 goals", children: <Goals problem="aud" /> },
          ]}
        />
      ),
    },
  ]}
/>`,
    },
    {
      id: "variants",
      group: "Structure",
      title: "Three variants",
      description:
        "Bordered for a panel of its own, separate for sections that are cards, ghost for an accordion inside something that already has a border. The keyboard model and the markup are the same in all three.",
      code: `<Accordion variant="bordered" headingLevel={3} items={items} />
<Accordion variant="separate" headingLevel={3} items={items} />
<Accordion variant="ghost" headingLevel={3} items={items} />`,
    },
    {
      id: "density",
      group: "Structure",
      title: "Density is spacing, never content",
      description:
        "Patient, standard and clinical change padding and type size. No density ever drops the summary or the severity, because which clinical facts appear is not a layout decision.",
      code: `<Accordion density="patient" headingLevel={3} items={items} />
<Accordion density="standard" headingLevel={3} items={items} />
<Accordion density="clinical" headingLevel={3} items={items} />`,
    },
    {
      id: "disclosure",
      group: "Structure",
      title: "A single disclosure",
      description:
        "One section on its own is a Disclosure: the same trigger, heading and findable panel, without the list around it.",
      code: `import { Disclosure } from "@/components/zoblocks/accordion";

<Disclosure
  headingLevel={3}
  item={{
    key: "why",
    label: "Why are we asking this?",
    children: <p>Your answers help your care team spot changes early.</p>,
  }}
/>`,
    },
  ],

  usage: `import { Accordion } from "@/components/zoblocks/accordion";

<Accordion
  headingLevel={2}
  density="clinical"
  onDisclose={async (event) => {
    await audit.record({ section: event.key, reason: event.reasonCode, at: event.at });
    return true;
  }}
  items={[
    {
      key: "risk",
      label: "Risk & suicidality",
      severity: "critical",
      summary: "C-SSRS positive · 13 Aug",
      children: <RiskPanel {...risk} />,
    },
    {
      key: "sud",
      label: "Substance use treatment",
      access: { kind: "consent", policy: "42 CFR Part 2", state: "granted" },
      children: <SudPanel {...sud} />,
    },
    {
      key: "psychotherapy",
      label: "Psychotherapy notes",
      access: { kind: "withheld", reason: "Kept separately by the author" },
    },
  ]}
/>`,
});
