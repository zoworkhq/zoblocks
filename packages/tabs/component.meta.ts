import { defineComponentMeta } from "@oxygenui-design/component-meta";

/**
 * Tabs is the second `package` component, and it is one for a different
 * reason than Signature.
 *
 * Signature ships on npm because copying antd's Modal and Form into someone's
 * repository would be a fork rather than a component. Tabs has no such
 * dependency — antd is an optional peer here — but it carries a headless core
 * that a host on a different design system should be able to take on its own,
 * and copy-as-source cannot express "take the engine, leave the skin".
 */
export default defineComponentMeta({
  name: "tabs",
  title: "Tabs",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "primitive",
  frameworks: {
    antd: {
      policy: "compatible",
      bridge: true,
      divergences: [
        "`as` is required. antd's Tabs infers nothing, so a strip that navigates and a strip that switches views are the same component with the same accessibility tree; here they are not.",
      ],
    },
  },

  distribution: "package",
  packageName: "@oxygenui-design/tabs",

  summary:
    "Tabs that know what they are: a view switch, a link list, a form value or a wizard — four accessibility trees behind one silhouette.",
  description:
    "Four semantic modes across eleven visual variants, with the WAI-ARIA keyboard model, five overflow strategies, and the states a clinical surface actually reaches — restricted, stale, unsaved. `as` is required and has no default, because the mode is the accessibility tree and the variant is only CSS.",
  rationale:
    "Almost every tab component solves the easy half: show one panel, hide the others, move an underline. The hard half is that “tabs” is four different components sharing a shape. A view switch owns panels and answers to arrow keys. A navigation menu is a list of links, and hijacking arrows on it destroys a keyboard user's focus the moment they press one. A segmented filter is a form value that belongs in a Form.Item. A wizard is ordered and gated. Shipping one of them and using it as all four is the most-reported tab defect in every design system audit, and it is invisible: a role=tablist wrapped around anchors spells every attribute correctly, so axe passes it. Making `as` required is the whole design — everything else follows from having said out loud what the control is.",

  categories: ["Navigation", "Layout"],
  fhir: [],

  states: [
    "Selected",
    "Unselected",
    "Disabled with a stated reason",
    "Restricted (present, gated, explained)",
    "Stale — showing cached data",
    "Unavailable offline",
    "Unsaved changes pending",
    "Locked step",
    "Completed step",
    "Overflowing into a menu",
    "Collapsed to a native picker",
    "Awaiting an async guard",
  ],

  a11y: [
    {
      label: "The mode is declared, not guessed",
      detail:
        '`as` selects the accessibility tree: tablist of buttons, a real nav of anchors, a radiogroup, or a gated tablist. It has no default, `@oxygenui/tabs-semantic-mode` makes omitting it a lint error, and passing an href under as="tabs" throws. A tablist of links passes every automated checker and then destroys focus on the first arrow key.',
    },
    {
      label: "One tab stop, and it follows selection",
      detail:
        "Roving tabindex rather than aria-activedescendant, because real DOM focus is what carries the focus ring under Windows High Contrast. Tab enters at the selected trigger and the next Tab leaves the group entirely.",
    },
    {
      label: "Disabled means present, not absent",
      detail:
        "aria-disabled, never the disabled attribute, and a `disabledReason` is mandatory. In a chart, “no behavioural health section” and “behavioural health, restricted” are different clinical facts, and a keyboard user has to be able to tell which one they are looking at.",
    },
    {
      label: "Colour is never the signal",
      detail:
        "A count and a tone reach the accessible name as a word: a red 2 on a Labs tab announces “Labs, 2 critical”, not “Labs 2”. The same holds for the unsaved dot and for stale availability.",
    },
    {
      label: "The strip owns only tabs",
      detail:
        "The add button, the overflow trigger and the scroll nudges are siblings of the tablist, not children. Anything else inside it fails aria-required-children and corrupts the “n of m” position a screen reader announces.",
    },
    {
      label: "Nothing interactive inside a trigger",
      detail:
        "A close button nested in a role=tab is invalid ARIA; assistive technology either flattens the tab or skips the button. The visible affordance is aria-hidden for the pointer, and the keyboard path is Delete on the tab itself, which is what APG prescribes.",
    },
    {
      label: "Correct before hydration",
      detail:
        "The server-rendered strip carries the roving tab stop and paints selection from CSS, so a keyboard user who arrives before the JavaScript does still has an entry point. Configuration is validated at render, so an invalid strip fails in renderToString rather than only in a browser.",
    },
    {
      label: "Motion is reduced, not removed",
      detail:
        "prefers-reduced-motion collapses the indicator transition to 1ms rather than deleting it, because a removed transition never fires transitionend and leaves a permanently promoted compositor layer.",
    },
  ],

  guidance: {
    use: [
      'Panels of one object — a chart with Summary, Vitals, Labs, Notes. That is as="tabs".',
      'A list of URLs, where each item is a route. That is as="nav", and it keeps cmd-click, middle-click and the back button working.',
      'A segmented control that filters or sets a value. That is as="radiogroup", and it belongs inside a Form.Item.',
      'An ordered flow where later steps may be unreachable. That is as="steps": backwards is free, forwards is earned.',
      "Long strips: pick an overflow strategy deliberately — scroll for touch, menu for dense desktop, collapse for narrow containers.",
    ],
    avoid: [
      'as="tabs" for anything that navigates. It is the defect this component exists to prevent, and it is a lint error.',
      'overflow="wrap" on a tablist. Once a strip wraps onto two rows, "the next tab" stops being a direction and arrow navigation has no correct answer.',
      "Hiding a disabled or empty tab. Both change the tab count between sessions and destroy the muscle memory that makes a chart fast to work in.",
      "Reordering tabs by importance or recency. Position is memory; a chart that rearranges itself between visits is how people open the wrong section.",
      'activation="automatic" when a panel fetches. Arrowing across six tabs fires six requests and reads six live regions.',
    ],
  },

  limitations: [
    "It does not own routing. `syncTo` writes through an adapter you supply, because a component library that picks a router picks its customers.",
    "It does not enforce permissions. `disabled` and `availability` are presentation; a hidden panel is not a security control, and authorisation belongs on the server.",
    "It will not animate panel height. A height transition over arbitrary content moves the thing the user is reading, and janks while doing it.",
    'transition="view" is opt-in and unsupported in Firefox as of this writing. It serialises the update, which is wrong for a strip you arrow through quickly; the standard transition is the default for that reason.',
    "`hotkeys` is off by default. Ctrl+1…9 belongs to the browser first on Windows and Linux, so claiming it takes a shortcut the user already had.",
    "Drag-to-reorder is not implemented. Keyboard reorder is (Ctrl+Shift+Arrow), because a pointer-only affordance for a destructive-feeling action is the wrong half to build first.",
  ],

  related: ["accordion", "chart-accordion", "switch"],

  usage: `import { Tabs } from "@oxygenui-design/tabs";
import "@oxygenui-design/tabs/styles.css";

// \`as\` is required and has no default: it selects the accessibility tree.
// \`variant\` is orthogonal and changes no ARIA at all.
<Tabs
  as="tabs"
  variant="segmented"
  aria-label="Chart sections"
  defaultValue="summary"
  items={[
    { value: "summary", label: "Summary", children: <Summary /> },
    // The tone reaches the accessible name as a word: "Labs, 2 critical".
    { value: "labs", label: "Labs", count: 2, tone: "critical", children: <Labs /> },
    {
      value: "bh",
      label: "Behavioural health",
      disabled: true,
      disabledReason: "Restricted — opening records an access event",
    },
  ]}
/>;`,

  technicalName: "Tabs",
  aliases: ["tab strip", "segmented control", "view switcher", "wizard steps", "chart sections"],
  tags: ["navigation", "keyboard-first", "disclosure", "themeable", "headless"],

  /*
   * `general` and `healthcare` both, and the conditional FHIR rule below is
   * the reason that is not a contradiction. Tabs reads no resource — it is a
   * navigation primitive. What makes it clinical is the set of states it has
   * to render honestly: a section that is restricted is not a section that is
   * absent, and a strip that renders them the same way is the defect this
   * component exists to prevent.
   */
  domain: {
    industries: ["general", "healthcare"],
    clinicalContext:
      "Consumes no FHIR resource. It is listed as clinical because a chart's section strip must distinguish a section that is empty from one that is restricted, stale, or unavailable offline — four facts that a generic tab component collapses into one, and that a clinician reads as if they were the same.",
    workflows: ["documentation", "care-coordination"],
    phi: {
      handles: false,
      notes:
        "Renders no PHI of its own. A tab label supplied by the host may carry it — a patient name on a chart tab — so labels are never logged and never sent to telemetry.",
    },
    auditable: false,
    permissions: [],
    terminology: [],
  },

  uxGuidelines: {
    do: [
      "Declare `as` on every strip. It selects the accessibility tree, and there is no default.",
      'Give a disabled tab a `disabledReason`. "Restricted" and "not applicable here" are different clinical facts.',
      "Keep the count of tabs under about seven for a view switch; beyond that, use the rail or a menu.",
      "Let the overflow strategy be chosen by the surface, not by the tab count.",
    ],
    dont: [
      'Do not wrap anchors in `as="tabs"` — it passes every automated checker and destroys focus on the first arrow key.',
      "Do not nest an interactive control inside a trigger. The close affordance is aria-hidden and the keyboard path is Delete on the tab.",
      'Do not use colour alone for a count\'s tone. A red 2 must announce as "2 critical".',
    ],
  },

  variants: [
    {
      id: "underline",
      label: "Underline",
      description:
        "The default. An underline indicator on a hairline track, for a page's primary sections.",
      args: { variant: "underline" },
    },
    {
      id: "enclosed",
      label: "Enclosed",
      description: "Tabs as connected cards. For a workspace where each tab owns a document.",
      args: { variant: "enclosed" },
    },
    {
      id: "segmented",
      label: "Segmented",
      description: "A form control. Belongs in a Form.Item and carries a value, not a view.",
      args: { variant: "segmented", as: "radiogroup" },
    },
    {
      id: "rail",
      label: "Rail",
      description:
        "Vertical. Arrow keys become up and down, because the orientation is the keyboard model.",
      args: { variant: "rail", orientation: "vertical" },
    },
    {
      id: "ghost",
      label: "Ghost",
      description: "No track, no indicator, no measurement pass. For dense toolbars and popovers.",
      args: { variant: "ghost" },
    },
  ],

  controls: [
    {
      prop: "as",
      control: "segmented",
      label: "Semantic mode",
      options: ["tabs", "nav", "radiogroup", "steps"],
      defaultValue: "tabs",
    },
    {
      prop: "variant",
      control: "select",
      label: "Variant",
      // All eleven. A playground that offers five has decided for the reader
      // which half of the API is real.
      options: [
        "underline",
        "segmented",
        "pill",
        "enclosed",
        "rail",
        "ghost",
        "stepper",
        "command",
        "card",
        "stat",
        "unstyled",
      ],
      defaultValue: "underline",
    },
    {
      prop: "orientation",
      control: "segmented",
      label: "Orientation",
      options: ["horizontal", "vertical"],
      defaultValue: "horizontal",
    },
    {
      prop: "size",
      control: "segmented",
      label: "Size",
      options: ["sm", "md", "lg"],
      defaultValue: "md",
    },
    {
      prop: "overflow",
      control: "select",
      label: "Overflow",
      options: ["scroll", "menu", "wrap", "collapse", "none"],
      defaultValue: "scroll",
    },
    {
      prop: "items",
      control: "fixture",
      label: "Chart",
      options: ["patientRoutine", "patientRestricted"],
    },
  ],

  a11yChecks: [
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: '`as` selects the tree: a tablist of buttons, a real nav of anchors, or a radiogroup. Passing an href under as="tabs" throws.',
      evidence: "tabs.test.tsx",
    },
    {
      wcag: "2.1.1",
      name: "Keyboard",
      status: "pass",
      how: "Roving tabindex. Tab enters at the selected trigger; the next Tab leaves the group entirely.",
      evidence: "tabs.test.tsx",
    },
    {
      wcag: "2.4.3",
      name: "Focus order",
      status: "pass",
      how: "After a close, focus moves to the neighbour deterministically rather than to body.",
      evidence: "tabs.test.tsx",
    },
    {
      wcag: "1.4.1",
      name: "Use of colour",
      status: "pass",
      how: 'A count\'s tone reaches the accessible name as a word — "Labs, 2 critical", never "Labs 2".',
      evidence: "tabs.test.tsx",
    },
    {
      wcag: "1.4.11",
      name: "Non-text contrast",
      status: "pass",
      how: "Indicator, track and focus ring are gated in the token build across three themes.",
      evidence: "contrast.gate",
    },
    {
      wcag: "2.5.8",
      name: "Target size",
      status: "pass",
      how: "Triggers hold a 24px minimum at every density; density changes spacing, never target size.",
      evidence: "e2e/docs-site.spec.ts",
    },
    {
      wcag: "2.3.3",
      name: "Animation from interactions",
      status: "pass",
      how: "prefers-reduced-motion collapses the indicator transition to a designed still state.",
      evidence: "tabs.test.tsx",
    },
    {
      wcag: "2.2.1",
      name: "Timing adjustable",
      status: "not-applicable",
      how: "No time limit exists anywhere in the component.",
    },
  ],

  /*
   * The chart the playground renders is assembled from these, not typed out.
   * A tab's count is `allergyList.length`, so a count that drifts from the data
   * behind it is a build error rather than a screenshot nobody re-took.
   */
  fixtures: [
    "patientRoutine",
    "patientRestricted",
    "observationPanel",
    "allergyList",
    "medicationList",
  ],

  examples: [
    {
      id: "chart-sections",
      title: "Chart sections",
      description:
        "The common case: a view switch over a patient chart, with a critical count on Labs that reaches the accessible name as a word.",
      fixture: "patientRoutine",
      code: `import { Tabs } from "@oxygenui-design/tabs";
import { allergyList, medicationList, observationPanel } from "@oxygenui-design/fixtures";
import "@oxygenui-design/tabs/styles.css";

const critical = observationPanel.filter(isCritical);

<Tabs
  as="tabs"
  aria-label="Chart sections"
  defaultValue="summary"
  items={[
    { value: "summary", label: "Summary", children: <Summary /> },
    {
      value: "labs",
      label: "Labs",
      // Counted from the data, never typed in. A tone is a claim about the
      // patient, so it has to come from the same place the panel does.
      count: critical.length,
      tone: critical.length ? "critical" : "neutral",
      children: <Labs observations={observationPanel} />,
    },
    { value: "meds", label: "Medications", count: medicationList.length, children: <Meds /> },
    { value: "allergies", label: "Allergies", count: allergyList.length, children: <Allergies /> },
  ]}
/>;`,
    },
    {
      id: "restricted-section",
      title: "A section that is restricted, not absent",
      description:
        "A disabled tab requires a reason. Omitting the section entirely would tell the clinician it does not exist; greying it silently tells them nothing.",
      fixture: "patientRestricted",
      code: `import { patientRestricted } from "@oxygenui-design/fixtures";

<Tabs
  as="tabs"
  aria-label="Chart sections"
  defaultValue="summary"
  items={[
    { value: "summary", label: "Summary", children: <Summary /> },
    {
      value: "bh",
      label: "Behavioural health",
      disabled: true,
      // Mandatory. aria-disabled, never the disabled attribute — a keyboard
      // user has to be able to reach it to find out why they cannot open it.
      disabledReason:
        "Restricted. Opening it records an access event and notifies the record owner.",
    },
  ]}
/>;`,
    },
    {
      id: "segmented-filter",
      title: "A segmented control is a form value",
      description:
        'Not every tab strip is a view switch. A filter is a form control and belongs in a Form.Item, which is what `as="radiogroup"` declares.',
      // No fixture: a density filter is a preference, not patient data, and
      // dressing it in a chart would misrepresent what the mode is for.
      code: `import { Form } from "antd";

<Form.Item name="density" label="Density">
  <Tabs
    as="radiogroup"
    variant="segmented"
    items={[
      { value: "compact", label: "Compact" },
      { value: "default", label: "Default" },
      { value: "comfortable", label: "Comfortable" },
    ]}
  />
</Form.Item>;`,
    },
  ],

  relationships: {
    builtWith: [],
    usedIn: [],
    patterns: ["clinical-documentation"],
    alternatives: [
      {
        ref: "accordion",
        when: "the sections should be readable at the same time, or the surface is a phone",
      },
      { ref: "switch", when: "there are exactly two states and one of them is the default" },
    ],
  },

  seo: {
    slug: "tabs",
    title: "Tabs — accessible React tab component",
    description:
      "A React tabs component with four semantic modes — view switch, navigation, form value, steps — each with the correct ARIA tree and keyboard model.",
    primaryKeyword: "react tabs component",
    secondaryKeywords: [
      "accessible tabs react",
      "vertical tabs react",
      "segmented control react",
      "aria tablist",
    ],
    searchIntent: "commercial",
    ogImage: "generated",
  },

  dependencies: ["@oxygenui-design/tabs-core"],
  registryDependencies: [],
});
