import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "chart-context-menu",
  title: "Chart Context Menu",
  technicalName: "ChartContextMenu",
  tier: "free",
  status: "beta",
  since: "0.5.0",
  layer: "clinical",

  summary:
    "A context menu that names what it is about before it offers to change it, ranks verbs by consequence, and counts the actions it withholds.",

  tagline: "Names its subject before it offers to change it.",
  description:
    "Every menu opens with a header naming the record, so the first thing under the pointer is never a verb. Four consequence tiers decide the interaction, not the colour. A masked row makes a masked header, and a disclosure is audited on every path.",
  rationale:
    "It is the shortest path to an irreversible act, and it opens on top of the row that said whose act it was. The popup is solved elsewhere. What is not modelled anywhere is what the menu is about: which verbs belong on this noun, which this person may run, and what each one costs.",

  categories: ["Clinical", "Navigation"],

  fhir: [
    {
      name: "Patient",
      url: "https://hl7.org/fhir/R4/patient.html",
      note: "The only subject whose header shows initials. Masked, it reads 'Restricted record' and nothing more.",
    },
    {
      name: "MedicationRequest",
      url: "https://hl7.org/fhir/R4/medicationrequest.html",
      note: "Discontinue, hold and renew made the clinical tier necessary: each must name what it stops, and when.",
    },
    {
      name: "Observation",
      url: "https://hl7.org/fhir/R4/observation.html",
      note: "Acknowledging a critical result stops an escalation, so the confirmation states the time.",
    },
    {
      name: "DocumentReference",
      url: "https://hl7.org/fhir/R4/documentreference.html",
      note: "Addendum, amendment and retraction are three legal acts most interfaces render as one Edit.",
    },
    {
      name: "AuditEvent",
      url: "https://hl7.org/fhir/R4/auditevent.html",
      note: "onDisclose produces this shape; the component never writes one, having no actor and no session. It never carries the label.",
    },
  ],

  states: [
    "Routine actions only",
    "A recorded action, saying what it writes",
    "A clinical action, first activation",
    "A clinical action, second step",
    "A disclosure, reasons offered",
    "Unavailable, with the reason in place",
    "Withheld by policy, counted",
    "An availability check still pending",
    "A masked subject",
    "A multiple selection",
    "Checkbox and radio view state",
    "A submenu, open beside its row",
    "This record supports no actions",
    "Every action withheld from this role",
  ],

  a11y: [
    {
      label: "The menu's accessible name is its subject",
      detail:
        'aria-labelledby points at the header, so a screen reader announces "Aluel Okonkwo, MRN 44-2871, menu, 8 items" before any item. One element, both audiences.',
    },
    {
      label: "Shift+F10 and the Menu key open it",
      detail:
        "Handled explicitly: Chrome and Firefox synthesise a contextmenu event for it, Safari does not.",
    },
    {
      label: "Unavailable rows stay reachable and say why",
      detail:
        "aria-disabled, with the reason as text. A tooltip is unavailable to the person who most needs it.",
    },
    {
      label: "Rows still being checked are skipped, not activated",
      detail:
        "The arrows skip a pending row, so a fast Enter cannot land on an answer that has not arrived.",
    },
    {
      label: "Focus returns to the trigger on every close path",
      detail:
        "Escape, running an item and Tab all restore it. Clicking away deliberately does not.",
    },
    {
      label: "The withheld count is a row, not a footnote",
      detail:
        "A reader who misses it concludes the record supports nothing else — the one wrong conclusion available.",
    },
    {
      label: "Activation is on the up-event",
      detail:
        "Opening is on contextmenu, running on click. Pressing down on Discontinue and dragging off does nothing.",
    },
    {
      label: "The tier is never carried by colour alone",
      detail:
        "Each tier above routine has a glyph the component supplies itself, a band position and a sentence — so a host that passes no icons still sees the difference. Forced colours discards the tints; everything else survives.",
    },
  ],

  limitations: [
    "The trigger announces aria-haspopup but never aria-expanded: axe rejects it on a generic element, and a transient popup is not content belonging to the row.",
    "Submenus have a 100ms hover intent and no safe triangle. An open child closes when the pointer reaches a different row, not when it leaves the trigger, so crossing the gap closes nothing. Routine actions only inside one.",
    "Type-ahead matches the first letter only. A full buffer competes with the shortcuts the menu displays, and the ambiguity is worse than the omission.",
    "The menu follows its trigger on scroll and closes on a viewport resize. It is anchored to a place inside the row, not to a viewport coordinate.",
    "Break-glass is signalled, never performed. The step-up authentication behind it is a separate surface.",
    "The disclosure record is produced, not written. The component knows the action and the subject, never the actor or the session.",
    "Strings are English and not routed through @oxygenui/intl — true of every registry component today.",
  ],

  related: ["chart-command-palette", "care-timeline"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "menu-core"],

  usage: `import { ChartContextMenu } from "@/components/oxygen/chart-context-menu";
import "@/styles/oxygen-menu.css";

<ChartContextMenu
  subject={{
    resource: "MedicationRequest",
    id: order.id,
    label: "Lisinopril 10 mg",
    detail: "Oral · daily · started 4 Mar 2026",
    masked: row.restricted,
  }}
  actions={medicationActions}
  policy={{ role: "a registered nurse", permitted, breakGlass: true }}
  now={serverTime}
  onRun={(action, subject) => dispatch(action.id, subject)}
  onDisclose={(record) => audit.write("disclosure", record)}
>
  {(trigger) => <tr {...trigger}>{cells}</tr>}
</ChartContextMenu>`,

  guidance: {
    use: [
      "On any row that already identifies a record — a medication, a result, a note, a patient in a worklist. The subject header is only honest if the row it came from was.",
      "With a policy. Without one nothing is withheld, which is right for a demo and wrong for a chart.",
      "With `onDisclose` wired before the first disclosive action is added. The component produces the record either way; nothing will keep it.",
      "With `now` set from server time whenever any action is disclosive — the record needs a timestamp and the component may not read a clock.",
      'Alongside a visible ⋯ affordance. A menu reachable only by a secondary click is one most people never find, and `presentation="anchored"` is the same menu from a button.',
    ],
    avoid: [
      "As the only way to reach an action. It is the fast path for people who already know the verb, not the only path.",
      'With `applies` omitted above `tier: "routine"`, which offers a discontinue on every resource in the chart.',
      "With a confirmation delegated to a modal. A modal moves focus off the surface and takes the keyboard away from the person who was using it.",
      "With a preview of the record's value in a submenu. A floating layer showing PHI is a disclosure surface during a screen-share, a screenshot and a recording — if the value is worth showing, the row already shows it.",
      'On a selection, with a disclosive action marked `bulk: "allowed"`. Twelve records with one justification is not a record a privacy officer accepts, and the validator refuses it.',
    ],
  },

  uxGuidelines: {
    do: [
      "Write `confirm` with the specifics: “the next scheduled dose is 14:00 today” rather than “this cannot be undone”.",
      "Write `records` from the reader's side: “creates a Task for pharmacy; it appears in their queue with your name on it”, not “saved”.",
      "Let the resolver place the separators. Consequence sorts to the bottom, so a discontinue cannot end up adjacent to a copy no matter what order the array is in.",
      'Keep toggles at `tier: "routine"`. Pinning a column and discontinuing a drug are not the same kind of act and must not look like one.',
      "Give a bulk-safe clinical action a `bulkConfirm`. Confirming twelve no-shows with a sentence written for one is a confirmation nobody read.",
    ],
    dont: [
      "Do not hide an action this person cannot run. The count teaches them something exists; the silence teaches them it does not.",
      "Do not resolve a name the row was masking. The menu may say less than its trigger; it may never say more.",
      "Do not append actions when an async check resolves. The row's place is reserved from the first paint, because a menu that grows has moved a destructive verb under a pointer aiming at something else.",
      "Do not reorder by frequency. This is the opposite of the command palette, deliberately: there you typed and are reading, here you have muscle memory and a pointer in flight.",
      "Do not suppress the disclosure record when the reader backs out. In a privacy review the abandoned ones are the interesting ones.",
    ],
  },

  tags: ["navigation", "overlay", "keyboard-first", "themeable", "headless"],
  aliases: [
    "context menu",
    "right click menu",
    "action menu",
    "row actions",
    "overflow menu",
    "dropdown menu",
  ],

  domain: {
    industries: ["healthcare", "behavioral-health"],
    clinicalContext:
      "`documented` exists because “this writes something other clinicians will read” is the most common surprise in an EHR, and costs one line of copy to remove. `disclosive` exists because HIPAA requires an emergency access procedure (45 CFR §164.312(a)(2)(ii)) and every implementation takes a reason first.",
    workflows: ["documentation", "medication", "care-coordination", "assessment"],
    phi: {
      handles: true,
      notes:
        "The header renders what the row rendered and refuses to render more. The disclosure record carries resource and id, never the label.",
    },
    auditable: true,
    permissions: ["chart.read", "audit.write"],
    terminology: ["FHIR"],
  },

  variants: [
    {
      id: "popup",
      label: "Pointer popup",
      description: "Opened at the cursor, with the subject header as the safe landing.",
      args: { presentation: "popup" },
    },
    {
      id: "anchored",
      label: "Anchored to a button",
      description:
        "The discoverable path, offset so it does not cover the button focus returns to.",
      args: { presentation: "anchored" },
    },
    {
      id: "sheet",
      label: "Touch sheet",
      description:
        "Long press below 40rem. Pinned to the bottom edge, 44px rows, cancelled by a scroll.",
      args: { presentation: "sheet" },
    },
  ],

  controls: [
    {
      prop: "presentation",
      control: "select",
      label: "Presentation",
      options: ["auto", "popup", "anchored", "sheet"],
      defaultValue: "auto",
    },
    { prop: "density", control: "select", label: "Density", options: ["comfortable", "compact"] },
    { prop: "disabled", control: "switch", label: "Disabled", defaultValue: false },
    { prop: "onRun", control: "event", label: "onRun" },
    { prop: "onDisclose", control: "event", label: "onDisclose" },
    { prop: "onBlocked", control: "event", label: "onBlocked" },
  ],

  a11yChecks: [
    {
      wcag: "2.1.1",
      name: "Keyboard",
      status: "pass",
      how: "Shift+F10 and the Menu key open it; arrows, Home, End, type-ahead, Enter and Escape drive it. Nothing needs a pointer.",
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: 'role="menu" named by the subject header; menuitem, menuitemcheckbox and menuitemradio; aria-disabled rather than disabled, so a blocked row keeps its name and reason.',
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "2.4.3",
      name: "Focus order",
      status: "pass",
      how: "Focus enters on open and returns to the trigger on Escape, on running an item, and on Tab. A test asserts all three.",
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "2.4.11",
      name: "Focus not obscured (minimum)",
      status: "pass",
      how: "The anchored menu flips above its trigger when there is no room below, so it never covers it.",
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "2.5.2",
      name: "Pointer cancellation",
      status: "pass",
      how: "Opening is on contextmenu, activation on click. A long press opens the sheet and never activates a row.",
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "2.5.8",
      name: "Target size (minimum)",
      status: "pass",
      how: "30px comfortable, 26px compact, both max() against the density floor so nothing goes under 24px. The sheet uses 44px.",
      evidence: "menu.css",
    },
    {
      wcag: "1.4.1",
      name: "Use of colour",
      status: "pass",
      how: "Every tier above routine carries a glyph the component supplies, a band position and a word. Asserted with the host passing no icons, which is how this was false before.",
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "4.1.3",
      name: "Status messages",
      status: "pass",
      how: 'A polite live region gives the action count and the withheld count on open. Nothing withheld, no clause — never "0 hidden".',
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "3.3.4",
      name: "Error prevention",
      status: "pass",
      how: "Clinical and disclosive actions take a second step, drawn under their row. The button carries the verb, never OK.",
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "1.4.10",
      name: "Reflow",
      status: "pass",
      how: "Below 40rem, and on a coarse pointer, it becomes a bottom sheet with the header pinned above the list.",
      evidence: "menu.css",
    },
  ],

  fixtures: ["patientRoutine", "patientRestricted"],

  examples: [
    {
      id: "subject",
      title: "The subject header is the safe landing",
      description:
        "The header names the record, so the first thing under the pointer is never a verb — the wrong-patient check and the accidental click-through, closed by one decision. No prop removes it.",
      fixture: "patientRoutine",
      code: `describeSubject({ resource: "MedicationRequest", id: "m1",
                  label: "Lisinopril 10 mg", detail: "Oral · daily" });
// → { who: "Lisinopril 10 mg", what: "Oral · daily", masked: false, bulk: 1 }

describeSubject({ ...subject, masked: true });
// → { who: "Restricted record", what: "Medication", masked: true, bulk: 1 }`,
    },
    {
      id: "tiers",
      title: "Consequence is a rank, not a boolean",
      description:
        "Routine runs on the click. Recorded runs and says what it wrote. Clinical takes a second step. A disclosure takes a reason. The resolver lays the bands out in that order, so a discontinue is never adjacent to a copy.",
      fixture: "patientRoutine",
      code: `actionOutcome(discontinue);
// → { kind: "confirm", prompt: "The next dose is 14:00 today…", verb: "Discontinue" }

actionOutcome(discontinue, { confirming: "dc" });   // → { kind: "run" }
actionOutcome(preliminary);
// → { kind: "blocked", reason: "Preliminary results are not released" }`,
    },
    {
      id: "withheld",
      title: "Withheld is counted, never hidden",
      description:
        "Policy removes the verb and leaves a number in its place, as a row inside the menu. The same rule the palette applies to patients it may not name.",
      fixture: "patientRestricted",
      code: `resolveMenu(subject, actions, { permitted: ["open", "copy"] }).withheld;  // → 3

describeHiddenActions(3, { role: "a registered nurse", breakGlass: true });
// → "3 further actions on this record, hidden for a registered nurse — break-glass required"`,
    },
    {
      id: "disclosure",
      title: "The record is made when the reasons are offered",
      description:
        'The record is written when the list is drawn, again when a reason is chosen, and again as "abandoned" if the reader closes instead. In a privacy review the abandoned ones are the interesting ones. The label never appears in it.',
      fixture: "patientRestricted",
      code: `disclosureRecord(revealPart2, subject, { now, outcome: "offered" });
// → { at: now, action: "part2", subject: { resource, id },
//     subjectNamed: false, masked: false, reason: null,
//     outcome: "offered", breakGlass: true }`,
    },
    {
      id: "pending",
      title: "A menu that never moves under the cursor",
      description:
        "A check still running renders at the row's final height, in its final position — never appended when the answer lands. Appending would move rows under a pointer already in flight. The arrows skip it too.",
      fixture: "patientRoutine",
      code: `nextIndex(rows, 0, 1);        // skips the row whose status is "pending"
actionOutcome(stillChecking);
// → { kind: "blocked", reason: "Still checking whether this can run" }`,
    },
  ],

  relationships: {
    builtWith: [],
    usedIn: [],
    patterns: ["chart-review", "care-coordination", "documentation"],
    alternatives: [
      {
        ref: "chart-command-palette",
        when: "the reader knows the verb's name but not which row it lives on",
      },
    ],
  },

  seo: {
    slug: "chart-context-menu",
    title: "Chart Context Menu — React healthcare row actions",
    description:
      "A React context menu for clinical apps: it names the record before offering to change it, ranks verbs by consequence, and counts the actions it withholds.",
    primaryKeyword: "react healthcare context menu",
    secondaryKeywords: [
      "clinical right click menu",
      "ehr row actions component",
      "break glass menu react",
      "destructive action confirmation menu",
    ],
    ogImage: "generated",
    searchIntent: "informational",
  },
});
