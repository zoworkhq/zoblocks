import { defineComponentMeta } from "@zoblocks/component-meta";

export default defineComponentMeta({
  name: "switch",
  title: "Switch",
  tier: "free",
  status: "experimental",
  since: "0.3.0",
  layer: "primitive",

  summary:
    "A binary control for a record that is shared, asynchronous, and often missing the fact you are asking it about.",

  tagline: "A binary control with a third value: nobody has said.",
  description:
    "Switch with three independent axes: the value the record holds, the phase of the write, and whether you may change it. Models the request and the outcome separately, so it never renders a state it cannot substantiate.",
  rationale:
    "A switch promises something it usually cannot keep — that a thing is now true. In healthcare that promise gets made over a hospital network, about a fact that may never have been asked, on a record that may already be signed and that somebody else may be editing. Every one of those is a state a clinician acts on, and a conventional switch renders all of them as ordinary on or off. This one separates the request from the outcome: a write in flight is visible and still operable, a failed write animates back and interrupts rather than snapping back silently, an absent answer says which kind of absence it is, and a value someone else changed underneath you shows both readings and asks. The API matches Ant Design's exactly and takes no dependency on it, so an existing antd form migrates by changing an import.",

  categories: ["Forms", "Primitives"],
  fhir: [],

  states: [
    "On",
    "Off",
    "Unknown (absence, with a reason)",
    "Pending — the write is in flight",
    "Committed",
    "Reverted — the write failed",
    "Blocked — refused before trying",
    "Queued — offline",
    "Stale — changed by someone else",
    "Read-only, with a reason",
    "Disabled",
    "Time-boxed (until)",
    "Awaiting confirmation",
    "Segmented — both answers visible",
    "Chip — a filter bar",
    "Row — the whole row is the target",
  ],

  a11y: [
    {
      label: "A real switch, not a styled div",
      detail:
        "A button with role=switch and aria-checked. Space and Enter both activate. The label is associated by aria-labelledby, and the state word, the locked reason and any error are wired through aria-describedby.",
    },
    {
      label: "The hit area never shrinks with the pill",
      detail:
        "The target is a pseudo-element sized max(track, --zb-switch-target-min), which follows the density profile. A 26x14px micro switch in a clinical table still presents a 24px-or-larger target.",
    },
    {
      label: "State survives without colour",
      detail:
        "Thumb position, a thumb glyph, and a text state word each carry the state alone. On-track and off-track sit within about 1.2:1 of each other in relative luminance, so colour cannot be the signal in monochrome or forced colours.",
    },
    {
      label: "Pending does not remove the control",
      detail:
        "No disabled attribute and no aria-disabled while a write is in flight: focus is retained, the accessible name is unchanged, and aria-busy is set. antd's loading prop maps here rather than to a disabled state.",
    },
    {
      label: "A failed write interrupts",
      detail:
        "Success is announced politely. A revert or a block is announced assertively and includes the word the value now holds, because a listener who hears only that it failed still does not know what is true.",
    },
    {
      label: "Read-only stays reachable",
      detail:
        "aria-readonly=true, still in the tab order, with the reason exposed through aria-describedby. disabled removes a control from a screen-reader user's world entirely, which is why it is documented as the last resort.",
    },
    {
      label: "Segmented changes the ARIA role on purpose",
      detail:
        "Two labelled cells that both look pressable are a radiogroup, not a switch. appearance=segmented renders role=radiogroup with two radios, so the semantics match what a reader sees.",
    },
    {
      label: "Holding is never the only path",
      detail:
        "confirm=hold is a timed input, so SC 2.2.1 applies. The hold duration is a token a host can set to zero, and keyboard or assistive-technology activation opens the confirmation dialog instead of requiring a sustained press.",
    },
    {
      label: "Reduced motion is designed",
      detail:
        "Thumb travel collapses to 1ms, the pending stripe holds a static diagonal rather than freezing mid-march, and a revert still ends at the record's value with its error visible.",
    },
  ],

  guidance: {
    use: [
      "A single independent setting that takes effect immediately, has two states, and is worth seeing at a glance in a list of similar settings.",
      "Anything written over a network you do not control — pass onCommit a promise and the pending, revert and announcement behaviour comes with it.",
      'Clinical flags whose absence is meaningful: pass checked="unknown" with an absentReason rather than defaulting to off.',
      'Suppressions and overrides — set tone="caution" or "critical" so an on-state that removes a safety net does not read as brand-affirmative green.',
      'Consequential but routine actions on a ward tablet: confirm="hold" prevents brush-taps without a second surface to hit.',
    ],
    avoid: [
      'A question with three real answers. Yes, No and Not asked are three equally selectable answers; reach for appearance="segmented", which renders both answers as visible choices.',
      'A form that commits on submit. A switch means applied now — use a checkbox, or set commit="deferred" and accept the unsaved-change marker.',
      "The only display of a safety state. A switch is a control and lives where you put it; a suppressed alarm also needs a persistent banner.",
      "Mutually exclusive options. Two switches where only one may be on is a radio group that has been taken apart.",
      'A group header meaning "some children are on". That is a checkbox with indeterminate — this component\'s third state means nobody was asked, which is a different fact.',
    ],
  },

  limitations: [
    'aria-checked="mixed" on role=switch is spec-valid but unevenly supported. The state word is always in the accessible description so the announcement is correct either way, but the NVDA, JAWS and VoiceOver matrix must be recorded before this reaches stable.',
    'Diverges from antd in one place, deliberately: loading maps to phase="pending" and does not disable the control.',
    "Does not write on expiry. until renders the window and fires onExpire; the application owns the write, because a client clock deciding to lift a clinical flag is a defect.",
    'confirm="countersign" collects a second identity through the caller\'s verify callback. It does not authenticate anyone, and it is not a signature capture — compose it with @zoblocks/signature when evidence is required.',
    "audience selects the default label preset and size. Wiring it to separate clinician and patient intl catalogs is not done yet.",
    "Requires styles/zoblocks-switch.css, installed with switch-core.",
  ],
  related: ["clinical-note", "tabs", "clinical-status", "date-picker"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "switch-core"],

  usage: `import { Switch, SwitchField, SwitchList } from "@/components/zoblocks/switch";

// The whole three-phase UX, including rollback and announcement.
<Switch
  label="Contact precautions"
  stateLabels="in-effect"
  tone="caution"
  checked={precautions}
  onCommit={async (next) => {
    await api.setPrecautions({ encounter, contact: next });
    setPrecautions(next);
  }}
  now={serverTime}
/>

// An absence that says which kind it is.
<Switch
  label="Advance directive on file"
  checked="unknown"
  absentReason="not-collected"
  stateLabels="yes-no"
/>

// A group, counting unknown separately from off.
<SwitchList title="Isolation precautions" counts={{ on: 2, total: 5, unknown: 1 }}>
  <SwitchField label="Contact" description="Gown and gloves on entry." checked />
  <SwitchField label="Airborne" readOnly lockedReason="No negative-pressure room on this unit." />
</SwitchList>`,
});
