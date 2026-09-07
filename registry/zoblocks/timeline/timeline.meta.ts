import { defineComponentMeta } from "@zoblocks/component-meta";

export default defineComponentMeta({
  name: "timeline",
  title: "Timeline",
  tier: "free",
  status: "experimental",
  since: "0.4.0",
  layer: "primitive",

  summary:
    "Ant Design v6's Timeline, prop for prop, with the accessible name and the ordered-list semantics it does not ship.",

  tagline: "Ant Design's Timeline, with the semantics it does not ship.",
  description:
    "An ordered list with a rail. The API matches Ant Design v6 exactly, including the v5 names it still accepts, and takes no dependency on it. Adds a required accessible name and drops the current-step behaviour a chronology has no use for.",
  rationale:
    "antd's Timeline is a thin adapter over Steps, and it inherits two things a chronology should not have. It hardcodes current to the last item, which marks that item process — and antd's own stylesheet gives that state a dotted rail. On a wizard that reads as 'the step you are on, and it continues'. On a history it is a mark of incompleteness applied to whichever event happened to be last, and because reverse reverses the array first, on a newest-first clinical timeline it lands on the oldest event in the chart. It also inherits rc-steps' accessibility, which is none: no role, no aria-current, no way to name the list, so a page with a care timeline and an access-history timeline gives a screen-reader user two unnamed lists. Matching the API rather than wrapping it means an existing antd call site migrates by changing one import, and no consumer of a primitive inherits antd.",

  categories: ["Data Display", "Primitives"],
  fhir: [],

  states: [
    "Vertical, the default",
    "Alternate, items on both sides",
    "Horizontal",
    "Filled and outlined variants",
    "Custom node icons",
    "Preset and custom node colours",
    "A loading node",
    "Reversed",
    "Ant Design v5 prop names, still accepted",
  ],

  a11y: [
    {
      label: "An accessible name is required, in the type",
      detail:
        "TimelineProps is intersected with a union requiring aria-label or aria-labelledby, so a list with no name does not compile. An unnamed list is invisible in review and in a rendering test, and obvious to exactly one group of readers.",
    },
    {
      label: 'An ordered list, with role="list" stated',
      detail:
        'A chronology is ordered, so the element is <ol> of <li>. The redundant role="list" is present because Safari drops list semantics from any list with list-style: none, and VoiceOver then announces neither the list nor its item count.',
    },
    {
      label: "A structure, not a widget",
      detail:
        "No roving tabindex and no arrow-key handling. Screen-reader users read a list with the arrow keys in browse mode, and claiming them would make the list less navigable rather than more. Only the caller's own controls inside an item are focusable.",
    },
  ],

  guidance: {
    use: [
      "Any ordered sequence of moments: a release history, an order's progress, an audit trail.",
      "Migrating an existing Ant Design Timeline without adding antd to a copy-source project.",
      "As the rail underneath a component that owns a clinical concept — CareTimeline is built on this.",
    ],
    avoid: [
      "A patient's chronology. Use CareTimeline, which states what it is a view of.",
      "A list whose order does not carry meaning. That is a list, and <ul> says so honestly.",
      "Carrying meaning in the node colour. The colour prop exists for API parity; a reader in forced-colors mode does not receive it.",
    ],
  },

  limitations: [
    "No current or activeIndex. antd hardcodes current to the last item and its stylesheet dots that item's rail; a history has no current step, so the prop does not exist here and the dotted rail is free to mean something.",
    "color accepts antd's four presets and any CSS colour, and nothing enforces a text equivalent beside it. That enforcement belongs on the clinical layer, where the vocabulary is closed.",
    "titleSpan sets --zb-timeline-title-span rather than reproducing antd's internal head-span calculation. The rendered geometry is close, not identical.",
    "The Ant Design documentation site and the 6.6.0 source disagree on mode's default — the table says end, the source falls back to start. This follows the source, and the parity test asserts against the installed version.",
    "Migrating an existing antd call site is one import plus an accessible name. The three deliberate divergences, and the dotted rail antd draws that this one does not, are written up in content/guides/migrating-from-antd-timeline.md.",
  ],
  related: ["care-timeline", "accordion", "chart-accordion"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "timeline-core"],

  usage: `import { Timeline } from "@/components/zoblocks/timeline";

<Timeline
  aria-label="Release history"
  mode="start"
  items={[
    { key: "1", title: "0.3.0", content: "Switch, Tabs, ChartAccordion." },
    { key: "2", title: "0.2.0", content: "Signature and Identity." },
    { key: "3", title: "0.1.0", content: "Five loaders." },
  ]}
/>`,
});
