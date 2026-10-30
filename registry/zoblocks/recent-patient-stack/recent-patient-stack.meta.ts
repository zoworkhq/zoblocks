import { defineComponentMeta } from "@zoblocks/component-meta";

export default defineComponentMeta({
  name: "recent-patient-stack",
  title: "Recent Patient Stack",
  technicalName: "RecentPatientStack",
  tier: "free",
  status: "stable",
  since: "0.4.0",
  layer: "clinical",

  summary:
    "A compact chart switcher that keeps open patient records, active status, and unfinished work visible together.",

  tagline: "A multi-chart workspace where the active patient is unmistakable.",
  description:
    "Recent Patient Stack displays open patient charts in a compact, selectable workspace so clinicians can see which chart is active and what work remains. Use it in a clinical application shell when users move between several charts; it keeps chart identity and status visible and helps reduce wrong-chart actions.",
  rationale:
    'Clinicians work several charts at once and the tooling pretends they do not. The state of the art is a dropdown of names, or worse, eleven browser tabs whose titles truncate to "Chart — Riverside…". Wrong-patient documentation survives every amount of staff training because it is not a training problem: it is two charts that look identical, one keyboard shortcut, and an interruption. A stack does three things a dropdown cannot — it makes the set visible without being opened, it gives each chart a persistent visual identity, and it carries per-chart state. The identity has to be derived from the chart rather than handed out in arrival order, or a clinician who has learned "Okonkwo is the green one" has learned something that will be false tomorrow.',

  categories: ["Clinical", "Navigation"],

  // The component consumes its OpenChart view model; the host maps FHIR data into it.
  fhir: [],

  states: [
    "Four charts, one active",
    "A pinned chart",
    "An unsigned note",
    "A draft order",
    "Two charts with similar names",
    "Closing a clean chart",
    "Closing one with an unsigned note",
    "Closing one with a draft order",
    "Returning after fifteen minutes",
    "Expanded panel",
    "Keyboard reordering",
    "Roving focus across the stack",
    "One chart",
    "Notes owed across the caseload",
  ],

  a11y: [
    {
      label: "A tablist with roving focus",
      detail:
        "The named Open charts tablist has a roving tab stop. Arrow keys move focus through tabs (without activating them); Home and End move to the first and last tab. Tab enters the stack at the active chart, or the first tab if activeId is missing or unmatched, and native tab order continues to later controls. Enter and Space activate a focused native button tab.",
    },
    {
      label: "Every drag has a keyboard equivalent",
      detail:
        "Alt with the up and down arrows moves a chart rather than the focus (WCAG 2.5.7). Reordering never crosses the pinned boundary, so a keystroke cannot silently pin or unpin a chart.",
    },
    {
      label: "Colour is never the only chart identity",
      detail:
        "The initials and the name are drawn in every mode, and the active chart is marked by weight and a ring as well as a hue. Eight accents rather than twelve, because twelve near-neighbours nobody can tell apart is a decoration pretending to be an identity.",
    },
    {
      label: "The accessible name carries the outstanding work",
      detail:
        '"A. Okonkwo. Ward round. Unsigned note." A screen-reader user should not have to open a chart to learn there is something owed on it.',
    },
    {
      label: "Refusal is not dressed as a question",
      detail:
        "A refused close and a close needing confirmation render a role=alertdialog with an accessible name and a reason. Confirmation offers Close and lose the draft; refusal offers only Back to the chart. The alertdialog's action buttons are native buttons.",
    },
    {
      label: "Small screens get one legible chart",
      detail:
        "Below 40rem the inactive tabs shrink to their avatar and only the active chart keeps its name. A multi-chart workspace on a phone is a wrong-patient generator, so the set stays visible and only one chart is legible enough to act on.",
    },
  ],

  limitations: [
    "It holds no state. Which charts are open, which is active and what is outstanding all belong to the host's workspace store — a component that owned them would be a second source of truth for the thing a wrong-patient event turns on.",
    "The similarity pass is deliberately blunt: it compares folded names and their first four letters. A false positive costs a visible identifier on a row and a false negative costs a note in the wrong chart, so it is tuned to over-report.",
    "Re-assertion is reported, not performed. The component says the clinician has been away long enough; showing the confirmation is the host's, because only the host knows what the chart is about to reveal.",
    "No LRU eviction, no refetch on restore. Both belong to the workspace store — and a nine-hour-old vitals set that looks live is a hazard the store has to prevent, not the tab strip.",
    "Pointer drag reordering is not implemented; the keyboard path is. A drag with no keyboard equivalent fails WCAG 2.5.7, and shipping the accessible half first is the order that cannot produce an inaccessible release.",
    "The close alertdialog does not move focus into itself, trap focus, close on Escape, or restore focus to the initiating close button. It also has no aria-describedby link to its reason. Hosts should account for this gap; the current implementation does not provide modal focus management.",
    "The tablist describes the selectable chart tabs, while the host renders the active chart content separately. The component does not connect tabs to tabpanels with aria-controls or aria-labelledby; hosts should provide the chart view and its accessible context.",
  ],

  related: ["identity", "chart-header", "chart-command-palette"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "workspace-core"],

  usage: `import { useState } from "react";
import { RecentPatientStack, type OpenChart } from "@/components/zoblocks/recent-patient-stack";
import "@/styles/zoblocks-workspace.css";

const initialCharts: OpenChart[] = [
  {
    id: "syn-chart-ember-17",
    display: "Mira Solano",
    identifier: "EX-204-711",
    reason: "Care review",
    lastActiveAt: "2026-08-24T09:58:00Z",
  },
  {
    id: "syn-chart-cedar-42",
    display: "Noel Hartwell",
    identifier: "EX-204-928",
    reason: "Follow-up note",
    lastActiveAt: "2026-08-24T09:30:00Z",
    work: [{ kind: "unsigned-note", label: "Visit summary", since: "2026-08-21T09:00:00Z" }],
  },
];

function WorkspaceStack() {
  const [charts, setCharts] = useState(initialCharts);
  const [activeId, setActiveId] = useState("syn-chart-ember-17");
  const [expanded, setExpanded] = useState(false);

  return (
    <RecentPatientStack
      charts={charts}
      activeId={activeId}
      now={new Date().toISOString()}
      expanded={expanded}
      onActivate={(chart, { reassert }) => {
        if (!reassert || window.confirm("Confirm chart for " + chart.display + "?")) setActiveId(chart.id);
      }}
      onClose={(chart) => setCharts((open) => open.filter((item) => item.id !== chart.id))}
      onPin={(chart, pinned) => setCharts((open) => open.map((item) => item.id === chart.id ? { ...item, pinned } : item))}
      onReorder={setCharts}
      onExpandedChange={setExpanded}
    />
  );
}`,

  guidance: {
    use: [
      "In the top bar of a clinical workspace, above the chart header rather than inside it.",
      "With `now` from the server, so the fifteen-minute re-assertion is not decided by a clock the user can change.",
      "With the outstanding work resolved upstream — a draft order and an unsigned note are different consequences and the component ranks them, but it cannot discover them.",
      "With `onReorder` wired. Without it the keyboard move is silently inert, and a drag with no keyboard path is a 2.5.7 failure.",
    ],
    avoid: [
      "As a substitute for the chart header. The stack says which chart; the header says who the patient is and what must not be forgotten about them.",
      "With more than about eight charts open. Past that the accents repeat, the names truncate and the stack stops being scannable — which is a workflow signal, not a component limit.",
      "On a phone as a full workspace. The component narrows itself deliberately; do not widen it back.",
      "With an accent assigned by arrival order. The whole value is that the hue is the same tomorrow.",
    ],
  },

  uxGuidelines: {
    do: [
      "Keep chart ids stable across sessions. The accent is derived from the id, and an id that changes is a chart that changes colour.",
      "Show the identifier on both charts of a similar pair. One row with an identifier and one without is a harder comparison than two that both have one.",
      "Refuse to close a chart with a draft order. An order that vanishes with its tab is an order somebody believes they placed, and nothing downstream will show its absence.",
      "Surface the caseload total. Six unsigned notes with the oldest at three days is the number that decides whether the week ends on time.",
    ],
    dont: [
      "Do not put a close affordance on the tab. It is one mis-tap from losing a draft, and the tab is already the target for the thing people mean to do.",
      "Do not use the accent as the only difference between two charts. Some readers cannot see it and nobody has learned it on their first day.",
      "Do not reorder charts automatically. A chart that moves while the clinician is reaching for it is the interruption this component exists to survive.",
      "Do not treat pinned as a sort key the user can trip over. Reordering must not cross the pinned boundary.",
    ],
  },

  tags: ["navigation", "keyboard-first", "themeable", "print-safe", "headless"],
  aliases: [
    "chart switcher",
    "patient tabs",
    "multi chart workspace",
    "open charts",
    "caseload switcher",
  ],

  domain: {
    industries: ["healthcare", "behavioral-health"],
    clinicalContext:
      "A therapist's day is six to eight charts with a note owed on each. The stack shows which notes are unsigned and how long they have been unsigned, which is the number that determines whether the week ends on time — and it is the number no dropdown of names can carry.",
    workflows: ["documentation", "care-coordination", "intake"],
    phi: {
      handles: true,
      notes:
        "Every open patient's name is on screen at once, persistently, including during a screen share. The small-screen behaviour narrows that deliberately.",
    },
    auditable: false,
    permissions: ["patient.read"],
    terminology: ["FHIR"],
  },

  variants: [
    {
      id: "bar",
      label: "Bar",
      description: "The tab strip. The set is visible without being opened.",
      args: { expanded: false },
    },
    {
      id: "panel",
      label: "Panel",
      description: "Expanded, with the per-chart pin and close actions.",
      args: { expanded: true },
    },
  ],

  controls: [
    { prop: "expanded", control: "switch", label: "Expanded", defaultValue: false },
    { prop: "onActivate", control: "event", label: "onActivate" },
    { prop: "onClose", control: "event", label: "onClose" },
  ],

  a11yChecks: [
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: "A tablist of tabs with aria-selected, each named with the patient, the reason the chart is open and the work outstanding on it.",
      evidence: "recent-patient-stack.test.tsx",
    },
    {
      wcag: "2.1.1",
      name: "Keyboard",
      status: "pass",
      how: "Roving tabindex with arrow, Home and End navigation; every affordance is a native button.",
      evidence: "recent-patient-stack.test.tsx",
    },
    {
      wcag: "2.5.7",
      name: "Dragging movements",
      status: "pass",
      how: "Reordering is Alt with the up and down arrows. The pointer drag is not shipped without it, so no release can have one and not the other.",
      evidence: "recent-patient-stack.test.tsx",
    },
    {
      wcag: "1.4.1",
      name: "Use of colour",
      status: "pass",
      how: "The accent is one of four channels: initials, name, weight and ring. A test asserts two charts with the same accent index are still told apart by name and identifier.",
      evidence: "recent-patient-stack.test.tsx",
    },
    {
      wcag: "3.2.2",
      name: "On input",
      status: "pass",
      how: "Moving focus across the stack never activates a chart; activation is a click or native button Enter/Space. Arrowing past a chart must not open it.",
      evidence: "recent-patient-stack.test.tsx",
    },
    {
      wcag: "2.5.8",
      name: "Target size (minimum)",
      status: "pass",
      how: "Tabs carry a 36px minimum block size and every action a 28px one, both above the 24px floor.",
      evidence: "recent-patient-stack.test.tsx",
    },
    {
      wcag: "4.1.3",
      name: "Status messages",
      status: "pass",
      how: 'A close that is refused or needs confirming opens role="alertdialog" with the reason as its content rather than as a toast that disappears.',
      evidence: "recent-patient-stack.test.tsx",
    },
    {
      wcag: "1.4.10",
      name: "Reflow",
      status: "pass",
      how: "Below 40rem the inactive tabs shrink to their avatar and the active one keeps its name, rather than the strip scrolling eleven full-width tabs off the side.",
      evidence: "recent-patient-stack.test.tsx",
    },
  ],

  fixtures: [
    "recentPatientStackRoutine",
    "recentPatientStackSimilarNames",
    "recentPatientStackCloseStates",
  ],

  examples: [
    {
      id: "workspace",
      title: "Show recently opened charts in the workspace shell",
      description:
        "Pass the workspace's open chart records and active chart id. The component keeps pinned charts first and otherwise sorts by last activity, while the host remains the source of truth.",
      fixture: "recentPatientStackRoutine",
      code: `<RecentPatientStack
  charts={openCharts}
  activeId={activeChartId}
  now={serverTime}
  onActivate={(chart, { reassert }) => {
    if (reassert) confirmPatientIdentity(chart);
    else setActiveChartId(chart.id);
  }}
/>`,
    },
    {
      id: "manage-open-charts",
      title: "Pin, reorder, and close from the expanded panel",
      description:
        "Expanded mode exposes pin and close actions when their callbacks are provided. Pin and reorder callbacks report proposed state; the host updates its chart list. Closing an unsigned note asks first, while a draft order blocks closing.",
      fixture: "recentPatientStackCloseStates",
      code: `<RecentPatientStack
  charts={openCharts}
  activeId={activeChartId}
  expanded
  onPin={(chart, pinned) => updatePin(chart.id, pinned)}
  onReorder={saveChartOrder}
  onClose={(chart) => removeChart(chart.id)}
/>`,
    },
    {
      id: "identity",
      title: "The hue is derived, not handed out",
      description:
        'A chart that was blue this morning must be blue this afternoon. The accent is an FNV-1a hash of the chart id modulo eight, so it is stable across sessions and machines — and it is never the only identity, because a clinician who has learned "Okonkwo is the green one" has learned something no new colleague knows.',
      fixture: "recentPatientStackRoutine",
      code: `chartAccent("syn-chart-ember-17"); // stable accent for this synthetic chart
chartAccent("syn-chart-cedar-42"); // derived independently from its stable id`,
    },
    {
      id: "similar",
      title: "Two charts that look alike both grow an identifier",
      description:
        "Marking only the newcomer would leave the reader comparing a row that has an identifier against a row that does not, which is a harder comparison than two that both do. The pass is deliberately over-eager: a false positive costs a visible MRN and a false negative costs a note in the wrong chart.",
      fixture: "recentPatientStackSimilarNames",
      code: `needsIdentifier([
  { id: "syn-chart-similar-1", display: "Ari Bell", identifier: "EX-771-204" },
  { id: "syn-chart-similar-2", display: "Ari Bellamy", identifier: "EX-771-928" },
]);
// → Set { "syn-chart-similar-1", "syn-chart-similar-2" }`,
    },
    {
      id: "closing",
      title: "Closing is graded, not binary",
      description:
        "A clean chart closes. One with an unsigned note asks, because losing the draft is a real loss that a person may still choose. One with a draft order refuses, because an order that vanishes with its tab is an order somebody believes they placed and nothing downstream will show its absence.",
      fixture: "recentPatientStackCloseStates",
      code: `canClose(clean);     // { kind: "close" }
canClose(withNote);  // { kind: "confirm", reason: "… Close and lose the draft?" }
canClose(withOrder); // { kind: "refuse",  reason: "… Sign it or discard it first." }`,
    },
    {
      id: "return",
      title: "Coming back re-asserts who the chart belongs to",
      description:
        "Fifteen minutes, because that is roughly the length of an interruption you do not remember having — and that is the interruption that produces the wrong-chart note. A chart with no recorded activity re-asserts too: not knowing how long you were away is not the same as having just left.",
      fixture: "recentPatientStackRoutine",
      code: `needsReassertion({ id, display, lastActiveAt: "10:00" }, "10:20"); // true
needsReassertion({ id, display, lastActiveAt: "10:00" }, "10:05"); // false
needsReassertion({ id, display }, "10:05");                        // true`,
    },
  ],

  relationships: {
    builtWith: [],
    usedIn: [],
    patterns: ["chart-review", "care-coordination"],
    alternatives: [
      { ref: "chart-header", when: "there is one chart and the question is who the patient is" },
    ],
  },

  props: [
    { name: "charts", order: 1 },
    { name: "activeId", order: 2 },
    { name: "now", order: 3 },
    { name: "onActivate", order: 4 },
    { name: "onClose", order: 5 },
    { name: "onPin", order: 6 },
    { name: "onReorder", order: 7 },
    { name: "expanded", order: 8 },
    { name: "onExpandedChange", order: 9 },
  ],

  seo: {
    slug: "recent-patient-stack",
    title: "Recent Patient Stack — multi-chart workspace",
    description:
      "A React chart switcher for clinicians: a stable per-chart accent, automatic disambiguation of similar names, unsigned-note badges and a graded close.",
    primaryKeyword: "react multi chart workspace",
    secondaryKeywords: [
      "patient chart switcher react",
      "wrong patient error prevention ui",
      "clinical tab strip component",
      "caseload switcher",
    ],
    ogImage: "generated",
    searchIntent: "informational",
  },
});
