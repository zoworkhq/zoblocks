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
  status: "beta",
  since: "0.1.0",
  layer: "primitive",

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

  related: [],

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

  dependencies: ["@oxygenui-design/tabs-core"],
  registryDependencies: [],
});
