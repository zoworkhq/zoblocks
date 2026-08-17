import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "accordion",
  title: "Accordion",
  tier: "free",
  status: "beta",
  since: "0.3.0",
  layer: "primitive",

  summary:
    "A disclosure widget whose headers can be read while closed, with a per-section access model for content a reader may not simply be shown.",
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
    "Requires styles/oxygen-accordion.css, installed with accordion-core.",
    "Above roughly 200 sections, render your own windowed list over useAccordion. Virtualising breaks find-in-page, so the component does not do it silently.",
    "persistKey is not implemented. Remembering which sections a reader opened is per-product storage, and storing it for a gated section would defeat the gate.",
  ],
  related: ["chart-accordion", "safety-plan"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "accordion-core"],

  usage: `import { Accordion } from "@/components/oxygen/accordion";

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
