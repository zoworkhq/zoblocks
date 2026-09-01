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
    "Every menu opens with a non-interactive header naming the record under the pointer, so the first thing under the pointer is never a verb. Four consequence tiers decide the interaction rather than the colour: run; run and say what was written; take a second step inside the menu; take a recorded reason. A masked row produces a masked header, and a disclosure is audited on every path.",
  rationale:
    "A context menu is the shortest path in a clinical interface to an irreversible act, and it opens on top of the row that said whose act it was. An observational study of EHR multitasking named invisible patient identifiers as a wrong-patient-selection risk, and clinicians in it described controls close enough together that a click lands in the wrong place — a context menu is the most adjacent control surface in the interface and it covers its own subject by construction. The mechanics of a popup are solved elsewhere and solved well. What is not modelled anywhere is what the menu is about: which verbs belong on this noun, which this person may run, what each one costs, and what happens to the ones they may not see. That is the component; the popup is the cheap half.",

  categories: ["Clinical", "Navigation"],

  fhir: [
    {
      name: "Patient",
      url: "https://hl7.org/fhir/R4/patient.html",
      note: "The subject of a worklist menu, and the only resource whose header shows initials. A masked patient row yields a header that reads 'Restricted record' and nothing more.",
    },
    {
      name: "MedicationRequest",
      url: "https://hl7.org/fhir/R4/medicationrequest.html",
      note: "Discontinue, hold and renew are the verbs that made the clinical tier necessary — each one has to name what it stops and when.",
    },
    {
      name: "Observation",
      url: "https://hl7.org/fhir/R4/observation.html",
      note: "Acknowledging a critical result stops an escalation, so the confirmation states the time. A preliminary result cannot be released, and the reason is the row rather than a tooltip.",
    },
    {
      name: "DocumentReference",
      url: "https://hl7.org/fhir/R4/documentreference.html",
      note: "Addendum, amendment and retraction are three different legal acts that most interfaces render as one Edit. Revealing 42 CFR Part 2 content is the disclosive tier's reference case.",
    },
    {
      name: "AuditEvent",
      url: "https://hl7.org/fhir/R4/auditevent.html",
      note: "The shape onDisclose produces maps onto AuditEvent, but the component never writes one — it has no actor and no session. It never carries the subject's label either, because an audit line with a patient's name in it has made the disclosure a second time.",
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
        'The subject header is role="presentation" and unreachable, and the popup carries aria-labelledby pointing at it — so a screen reader announces "Aluel Okonkwo, MRN 44-2871, menu, 8 items" before any item. A sighted reader gets the wrong-patient check by reading it; a screen-reader user gets it in the role announcement. One element, both audiences.',
    },
    {
      label: "Shift+F10 and the Menu key open it",
      detail:
        "Handled explicitly rather than relying on the browser synthesising a contextmenu event: Chrome and Firefox do, Safari does not, and a menu reachable only by a secondary click fails SC 2.1.1 outright. The trigger props carry tabIndex and a default role for the same reason.",
    },
    {
      label: "Unavailable rows stay reachable and say why",
      detail:
        "aria-disabled rather than disabled, with the reason rendered as text rather than as a title attribute — a tooltip is unavailable to the person using a keyboard, and that is exactly the person who needs the reason.",
    },
    {
      label: "Rows still being checked are skipped, not activated",
      detail:
        "nextIndex passes over a pending row, so a fast Enter cannot land on an answer that has not arrived. The row keeps its position and its height throughout, so nothing moves when the answer does arrive.",
    },
    {
      label: "Focus returns to the trigger on every close path",
      detail:
        "Escape, running an item, and Tab all restore focus to the element that opened the menu. Clicking away deliberately does not, because moving focus on a click elsewhere is what strands a reader mid-page.",
    },
    {
      label: "The withheld count is a row, not a footnote",
      detail:
        "It sits inside the menu above the bottom edge. A reader who does not see it concludes the record supports nothing else, which is the one wrong conclusion available.",
    },
    {
      label: "Activation is on the up-event",
      detail:
        "SC 2.5.2. Opening happens on contextmenu; running happens on click. Pressing down on Discontinue and dragging off it does nothing, and a long press on touch opens the menu without ever activating a row.",
    },
    {
      label: "The tier is never carried by colour alone",
      detail:
        "Each tier has a glyph, a band position and — above routine — a sentence. In forced-colours mode the tints are discarded and the bands, the strike-through, the lock and the wording all survive.",
    },
  ],

  limitations: [
    "The trigger announces aria-haspopup but never aria-expanded. Axe rejects the latter on a generic element and treats it as conditional on a table row, and it is wrong on the merits anyway — a transient popup is not content belonging to the row, and announcing every row of a worklist as collapsed is a claim about structure that is not true.",
    'Submenus have a 100ms hover intent and no safe triangle. Instead of geometry, an open child closes when the pointer reaches a *different* row rather than when it leaves the trigger — so crossing the gap between the two menus closes nothing, which is the case a safe triangle exists to protect. validateActions still refuses anything above tier="routine" inside one, because the cost of an accidental close has to stay "move the mouse again" rather than a mis-click on whatever the pointer crossed.',
    "Type-ahead matches the first letter only. A full buffer competes with the shortcuts the menu displays, and the ambiguity is worse than the omission.",
    "The menu follows its trigger on scroll and closes on a viewport resize. Following is right because the popup is anchored to a place inside the row rather than to a viewport coordinate; closing on resize is right because a rotation reflows the layout the placement was computed against, and there is no correct place to put a stale popup.",
    "Break-glass is signalled, never performed. The component says an override exists, takes the reason and reports it; the step-up authentication and the incident report behind it are a separate surface with their own consent and their own record.",
    "The disclosure record is produced, not written. The component knows the action and the subject; it does not know the actor or the session, and a component that guessed at either would be worse than one that hands the host a partial record to complete.",
    "Strings are English and are not routed through @oxygenui/intl. That is true of every registry component today and is the same open question for all of them; the package channel is where it will be answered.",
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
      "The four tiers came out of asking what a chart actually distinguishes. `documented` exists because “this writes something other clinicians will read” is the most common surprise in an EHR and costs one line of copy to remove. `disclosive` exists because break-glass and 42 CFR Part 2 reveals are a different kind of act from anything else in a menu: HIPAA does not name break-glass, but 45 CFR §164.312(a)(2)(ii) requires an emergency access procedure, and every implementation of one takes a documented reason before the record opens.",
    workflows: ["documentation", "medication", "care-coordination", "assessment"],
    phi: {
      handles: true,
      notes:
        "The subject header renders whatever the trigger row rendered, and refuses to render more when the row was masked. The disclosure record deliberately carries resource and id but never the label, because an audit line with a patient's name in it has made the disclosure a second time to a wider audience.",
    },
    auditable: true,
    permissions: ["chart.read", "audit.write"],
    terminology: ["FHIR"],
  },

  variants: [
    {
      id: "popup",
      label: "Pointer popup",
      description:
        "Opened at the cursor, with the subject header as the safe landing. The corner sits three pixels behind the pointer, because with it exactly on the cursor an 8px radius leaves the pointer outside the menu shape.",
      args: { presentation: "popup" },
    },
    {
      id: "anchored",
      label: "Anchored to a button",
      description:
        "The discoverable path, aligned to the ⋯ trigger and offset so it does not cover the control focus returns to.",
      args: { presentation: "anchored" },
    },
    {
      id: "sheet",
      label: "Touch sheet",
      description:
        "Long press below 40rem or on a coarse pointer. Pinned to the bottom edge rather than floating at the finger, with 44px rows, and cancelled by a scroll or a 10px drift.",
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
      how: "Shift+F10 and the Menu key open the menu from a focused trigger; arrows, Home, End, first-letter type-ahead, Enter, Space and Escape drive it. Nothing needs a pointer.",
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: 'role="menu" named by the subject header through aria-labelledby; menuitem, menuitemcheckbox and menuitemradio with aria-checked; aria-haspopup="menu" on the trigger, with role="button" as a default a host can override; aria-disabled rather than disabled so a blocked row keeps its name and its reason.',
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "2.4.3",
      name: "Focus order",
      status: "pass",
      how: "Focus enters the popup on open and returns to the trigger on Escape, on running an item, and on Tab. A test asserts all three, because this is the failure that strands the keyboard user the feature was built for.",
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "2.4.11",
      name: "Focus not obscured (minimum)",
      status: "pass",
      how: "The anchored presentation flips above the trigger when there is not room below, so the control focus returns to is never underneath the menu.",
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "2.5.2",
      name: "Pointer cancellation",
      status: "pass",
      how: "Opening is on contextmenu; activation is on click, which is the up-event. A long press opens the sheet and never activates a row, and it is cancelled by a 10px drift.",
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "2.5.8",
      name: "Target size (minimum)",
      status: "pass",
      how: "Rows are 30px comfortable and 26px compact, both expressed as max() against the density floor so no density profile can take them under 24px. The touch sheet uses 44px.",
      evidence: "menu.css",
    },
    {
      wcag: "1.4.1",
      name: "Use of colour",
      status: "pass",
      how: "Every tier carries a glyph, a band position and a word. Unavailable is struck through and states its reason; withheld carries a lock and a sentence.",
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "4.1.3",
      name: "Status messages",
      status: "pass",
      how: 'A polite live region announces the action count and the withheld count on open. When nothing is withheld the clause is absent rather than read as "0 hidden".',
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "3.3.4",
      name: "Error prevention",
      status: "pass",
      how: "Clinical and disclosive actions take a second deliberate step, drawn inside the menu under the row it belongs to. The confirm control is labelled with the verb rather than OK, and Keep is always available.",
      evidence: "chart-context-menu.test.tsx",
    },
    {
      wcag: "1.4.10",
      name: "Reflow",
      status: "pass",
      how: "Below 40rem, and on any coarse pointer, the menu becomes a bottom sheet with 44px rows and the subject header pinned above the list.",
      evidence: "menu.css",
    },
  ],

  fixtures: ["patientRoutine", "patientRestricted"],

  examples: [
    {
      id: "subject",
      title: "The subject header is the safe landing",
      description:
        "The menu opens with a non-interactive header naming the record under the pointer, so the first thing under the pointer is never a verb — one decision closing two holes at once, the wrong-patient check and the accidental click-through. There is no prop that removes it, because a configurable safety feature is one that is off in the codebase that needed it most.",
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
        "Four tiers, and the tier decides the interaction rather than the colour. A routine action runs on the click; a recorded one runs and says what it wrote before it is chosen; a clinical one takes a second step inside the menu; a disclosure takes a reason. The bands lay out in that order with a rule between them, so a discontinue can never end up adjacent to a copy no matter how the array was written.",
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
        "Policy removes the verb from the list and leaves a number in its place, as a row inside the menu rather than a footnote under it. It is the same rule the command palette applies to patients outside your treatment relationships, down to the sentence shape: a reader who does not see the count concludes the record supports nothing else, which is the one wrong conclusion available.",
      fixture: "patientRestricted",
      code: `resolveMenu(subject, actions, { permitted: ["open", "copy"] }).withheld;  // → 3

describeHiddenActions(3, { role: "a registered nurse", breakGlass: true });
// → "3 further actions on this record, hidden for a registered nurse — break-glass required"`,
    },
    {
      id: "disclosure",
      title: "The record is made when the reasons are offered",
      description:
        "A disclosure emits its audit record the moment the reason list is drawn, again when a reason is chosen, and again with outcome \"abandoned\" if the reader closes the menu instead. That symmetry is the point: in a privacy review the abandoned ones are the interesting ones. Note what is not in the record — the subject's label never appears, because an audit line carrying a patient's name into a log with a wider readership than the chart has made the disclosure a second time.",
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
        "An entitlement check that has not come back renders as a placeholder at the row's final height, in its final position — never appended when the answer arrives. Every EHR has async checks behind its menus, and the obvious implementation renders what it knows and appends the rest, which moves rows under a pointer already in flight. The arrow keys skip a pending row too, so a fast Enter cannot land on an answer that has not arrived.",
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
