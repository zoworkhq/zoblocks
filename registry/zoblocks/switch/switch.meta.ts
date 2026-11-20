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

  controls: [
    {
      prop: "size",
      control: "segmented",
      label: "size",
      options: ["micro", "small", "default", "large"],
      defaultValue: "large",
    },
    {
      prop: "appearance",
      control: "select",
      label: "appearance",
      options: ["switch", "labeled", "segmented", "chip", "row"],
      defaultValue: "switch",
    },
    {
      prop: "tone",
      control: "segmented",
      label: "tone",
      options: ["affirmative", "neutral", "caution", "critical"],
      defaultValue: "caution",
    },
    {
      prop: "stateLabels",
      control: "select",
      label: "stateLabels",
      options: [
        "on-off",
        "yes-no",
        "active-inactive",
        "in-effect",
        "allowed-blocked",
        "given-declined",
        "enabled-disabled",
      ],
      defaultValue: "in-effect",
    },
    {
      prop: "labelPlacement",
      control: "segmented",
      label: "labelPlacement",
      options: ["start", "end"],
      defaultValue: "end",
    },
    {
      prop: "commit",
      control: "segmented",
      label: "commit",
      options: ["instant", "deferred"],
      defaultValue: "instant",
    },
    {
      prop: "audience",
      control: "segmented",
      label: "audience",
      options: ["clinician", "patient"],
      defaultValue: "clinician",
    },
    { prop: "showState", control: "switch", label: "showState", defaultValue: true },
    { prop: "loading", control: "switch", label: "loading", defaultValue: false },
    { prop: "readOnly", control: "switch", label: "readOnly", defaultValue: false },
    { prop: "disabled", control: "switch", label: "disabled", defaultValue: false },
    { prop: "label", control: "text", label: "label", defaultValue: "Contact precautions" },
    {
      prop: "description",
      control: "text",
      label: "description",
      defaultValue: "Gown and gloves on entry.",
    },
  ],

  examples: [
    /* ---------------------------------------------------------------- */
    /* Anatomy                                                           */
    /* ---------------------------------------------------------------- */
    {
      id: "anatomy-matrix",
      group: "Anatomy",
      title: "Size, value and availability, independent",
      description:
        "The specimen sheet this component started from. Read-only is a dashed border and a filled thumb — a different object, not a weaker one, because dimming reads as “inactive”, which is a value rather than an availability.",
    },
    {
      id: "without-colour",
      group: "Anatomy",
      title: "State without colour",
      description:
        "On-track and off-track sit within about 1.2:1 of each other in relative luminance, so in monochrome and forced colours the fill carries nothing. Thumb position, thumb glyph and the state word each have to be enough alone.",
    },
    {
      id: "labeled-track",
      group: "Anatomy",
      title: "A labelled track that holds its width",
      description:
        "“Active” and “Inactive” are laid into the same grid cell, so the track is sized by the longer word and the thumb travel is constant. A switch that resizes as it toggles makes a whole table row jump.",
    },

    /* ---------------------------------------------------------------- */
    /* The write                                                          */
    /* ---------------------------------------------------------------- */
    {
      id: "write-and-fail",
      group: "The write",
      title: "The write, and the write that fails",
      description:
        "A switch is a request, not a change. Pass onCommit a promise: the first control saves; the second fails every other attempt, and animates back to the value the record actually holds and says so.",
    },
    {
      id: "every-phase",
      group: "The write",
      title: "Every phase, by hand",
      description:
        "The escape hatch for a caller that already owns a state machine — a mutation library, a websocket, an offline queue. Supplying phase takes the internal machine out of the loop and renders exactly what it would have.",
    },
    {
      id: "offline-and-overtaken",
      group: "The write",
      title: "Offline, and overtaken",
      description:
        "Queued is not pending: nothing has been sent, and the user may still change their mind. A conflict offers both readings and pre-selects neither, because each clinician had a reason.",
    },
    {
      id: "time-boxed",
      group: "The write",
      title: "An on that is not forever",
      description:
        "Turn it on and watch the window close — then note the switch is still on. It reports the lapse and waits, because a client clock deciding to lift a clinical flag is a defect.",
    },
    {
      id: "deferred",
      group: "The write",
      title: "A switch inside a form",
      description:
        "A switch means applied now. When it is not — a form that commits on submit — it has to say so. Toggle these and an unsaved marker appears rather than a write.",
    },

    /* ---------------------------------------------------------------- */
    /* What it means                                                      */
    /* ---------------------------------------------------------------- */
    {
      id: "absence",
      group: "What it means",
      title: "Off, and never asked",
      description:
        "Four switches in the same visual state saying four different things — the word changes, not the colour. “Declined” is a recorded clinical act, not an absence.",
    },
    {
      id: "tones",
      group: "What it means",
      title: "When on is the dangerous state",
      description:
        "Half the switches in a clinical system are suppressions. All four are on; only the middle two are situations anyone needs to know about, and the colour, glyph and state word all say so.",
    },
    {
      id: "locked",
      group: "What it means",
      title: "Locked, and why",
      description:
        "Disabled takes a control out of the tab order, so a screen-reader user never learns it exists. Read-only keeps it reachable and says what is holding it. Only the last is genuinely disabled.",
    },
    {
      id: "confirm",
      group: "What it means",
      title: "Friction matched to consequence",
      description:
        "Chosen by what the toggle costs if nobody meant it. Hold is a timed input, so activate any of these from the keyboard and the dialog opens instead — holding is never the only path.",
    },
    {
      id: "impact",
      group: "What it means",
      title: "The consequence, before the click",
      description:
        "A switch whose consequences reach other people carries them where they inform the decision, not in a dialog after it — and says who last moved it, the first question anyone asks of a shared record.",
    },
    {
      id: "panel",
      group: "What it means",
      title: "A real panel",
      description:
        "Four rows, four different situations, none rendered as an ordinary off. The count reports “not asked” apart from off, because folding it in is the failure this component exists to prevent.",
    },

    /* ---------------------------------------------------------------- */
    /* Surfaces                                                           */
    /* ---------------------------------------------------------------- */
    {
      id: "appearances",
      group: "Surfaces",
      title: "One value, five renderings",
      description:
        "The same state model behind every one. Segmented is the only appearance that changes the ARIA role: two labelled cells that both look pressable are a radiogroup.",
    },
    {
      id: "sizes",
      group: "Surfaces",
      title: "From a flowsheet row to a phone",
      description:
        "The pill shrinks; the target does not. Micro switches are 26×14px and still present a target at or above the 24px floor, because the hit area follows the density profile rather than the pill.",
    },
    {
      id: "antd-surface",
      group: "Surfaces",
      title: "The Ant Design surface, unchanged",
      description:
        "Prop names, shapes and defaults match Ant Design's Switch, so a form migrates by changing an import. The one divergence is loading: it renders as pending and never disables, so focus is kept.",
    },
    {
      id: "restyled",
      group: "Surfaces",
      title: "Restyled without a fork",
      description:
        "Tokens first, props second, slots last. All three are one component and one state model; only token values differ, so a brand restyles the control without editing its source.",
    },
    {
      id: "rtl",
      group: "Surfaces",
      title: "Right to left",
      description:
        "The thumb travels on inset-inline-start and labelPlacement is start or end rather than left or right, so nothing is mirrored by hand. The last block sets dir=rtl on itself.",
    },
  ],

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
