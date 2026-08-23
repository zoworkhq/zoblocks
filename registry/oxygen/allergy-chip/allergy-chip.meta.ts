import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "allergy-chip",
  title: "Allergy Chip",
  technicalName: "AllergyChip",
  tier: "free",
  status: "stable",
  since: "0.4.0",
  layer: "clinical",

  summary:
    "The chip that refuses to conflate how bad the last reaction was with how bad the next one could be.",
  description:
    "Substance first at full weight, criticality as the primary signal, the worst past reaction as secondary text, and verification as a hairline affix. AllergyList carries the other half: a no-known-allergies assertion and an unasked question look nothing alike, and an assertion missing its author degrades to the second.",
  rationale:
    "AllergyIntolerance carries two severity-shaped fields that mean opposite things. `criticality` is a clinician's judgement of the risk of a future life-threatening reaction; `reaction.severity` describes how bad a past one was. A patient whose only documented reaction was mild urticaria can still be criticality high — that is the entire reason the field exists — and nearly every implementation renders one and drops the other, keeping the past. The second failure is subtler and more common: no known allergies and nobody asked are shown the same way, and an empty allergy list beside a prescribing button is an assertion the software has not earned. Both failures are structural rather than cosmetic, so both get shapes: the two fields render as different kinds of thing, and the two empty states are different components that look nothing alike.",

  categories: ["Clinical", "Data Display"],

  fhir: [
    {
      name: "AllergyIntolerance",
      url: "https://hl7.org/fhir/R4/allergyintolerance.html",
      note: "type, category, criticality, verificationStatus, reaction[].manifestation and severity, onset, lastOccurrence and asserter. The no-known-allergy SNOMED codes are read as a positive assertion with provenance rather than as an allergy to nothing.",
    },
  ],

  states: [
    "High criticality, mild past reaction",
    "Low criticality, same manifestation",
    "Intolerance, not an allergy",
    "Refuted after a rechallenge",
    "Entered in error",
    "Unconfirmed — reported at intake",
    "Unable to assess",
    "No reaction recorded",
    "Substance class expansion",
    "Contraindication",
    "No known allergies — asserted",
    "Allergy status not recorded",
    "An assertion with no author degrades",
    "Compact, in a banner",
    "Interactive — opens the history",
  ],

  a11y: [
    {
      label: "The name reads kind, substance, criticality, verification — in that order",
      detail:
        "Criticality before verification because it decides whether to prescribe; verification last because it decides how much to trust the rest. The past reaction comes after both, since leading with it is the mistake the component exists to correct.",
    },
    {
      label: "Criticality carries a shape",
      detail:
        "It routes through ClinicalStatus, so high criticality is a filled triangle as well as a red chip. A red chip is never the only cue, and this is the one component where a missed cue is a prescription.",
    },
    {
      label: "The two empty states differ in shape, not only in colour",
      detail:
        "The asserted state is a solid green panel; the unrecorded state is a dashed amber one. A reader scanning a chart has to tell them apart without reading either, and the dash survives greyscale, forced colours and the ward printer.",
    },
    {
      label: "A refuted entry stays readable",
      detail:
        "Struck through and dimmed rather than removed. A refuted allergy that vanishes gets re-reported at the next intake, and the rechallenge that disproved it is the most useful thing in the record — so it is dimmed to 0.75 rather than to the point of illegibility.",
    },
    {
      label: "Inert unless there is a history to open",
      detail:
        'role="group" with a label by default. The chip is never where a criticality is changed — that is a documented clinical act, not a click — so the only interaction it offers is reading more.',
    },
  ],

  limitations: [
    "Class expansion is an injected function. No RxNorm or SNOMED bundle ships here, so a deployment without a terminology service sees substances without their classes rather than a wrong class.",
    "FHIR R4 offers only allergy and intolerance for `type`. The other two kinds have to be set directly; the adapter will not guess, and an untyped resource becomes adverse-reaction rather than the stronger claim.",
    "The component renders one record. Deduplicating three penicillin entries from three source systems is a reconciliation problem, and solving it here would hide the fact that they disagree.",
  ],

  related: ["clinical-status", "result-value"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "allergy-core", "clinical-status"],

  usage: `import { AllergyChip, AllergyList, fromAllergyIntolerance } from "@/components/oxygen/allergy-chip";
import "@/styles/oxygen-allergy.css";

<AllergyList
  records={records}
  noneKnown={{ asserter: "R. Okafor, RN", assertedAt: "14 Aug 2026" }}
  onAsk={openIntake}
/>`,

  guidance: {
    use: [
      "In an allergy banner, a pre-prescribe check, a medication administration screen and intake reconciliation — the four places the criticality field decides what happens next.",
      "Through AllergyList rather than mapping AllergyChip yourself, so the two empty states are handled rather than falling through to a blank.",
      "With onAsk wired on any screen that can prescribe, so the unrecorded state is a gate rather than a note.",
      "For psychotropic histories, where intolerance rather than allergy dominates — akathisia on aripiprazole, sedation on quetiapine — and where those entries are the ones most often lost.",
    ],
    avoid: [
      "As a way to change a criticality. It is a documented clinical act with an author, not a click on a chip.",
      "With criticality omitted when the record has one. Rendering only the past reaction is the exact failure the component was built to stop.",
      "For a deduplicated view of several source systems. Three penicillin entries that disagree should look like three entries that disagree.",
    ],
  },

  uxGuidelines: {
    do: [
      "Pass both fields whenever the record has both. They answer different questions and the pairing is what teaches the reader that.",
      "Keep the asserter and the date on a no-known assertion. Without them the component renders not-asked, which is the honest answer.",
      "Let refuted entries stay in the list. The rechallenge that disproved an allergy is worth more than the absence of a row.",
    ],
    dont: [
      "Do not colour the card by criticality. The chip carries it with a shape; a red card behind it makes the manifestation — a different fact — harder to read.",
      "Do not label every row with its kind. Labelling the common case teaches that an intolerance is a weak allergy, which is what the four kinds exist to prevent.",
      "Do not truncate a substance mid-word to fit. Truncate at the ingredient boundary or widen the column.",
    ],
  },

  tags: ["data-display", "themeable", "print-safe", "headless"],
  aliases: [
    "allergy badge",
    "allergy banner",
    "adverse reaction chip",
    "intolerance display",
    "nkda",
  ],

  domain: {
    industries: ["healthcare", "behavioral-health"],
    clinicalContext:
      "The allergy banner and the pre-prescribe check. Also the reconciliation surface at intake, which is where a no-known assertion gets its author and date — and where, without them, a prescriber later reads an empty list as a cleared one.",
    workflows: ["intake", "medication", "documentation", "care-coordination"],
    phi: {
      handles: true,
      notes:
        "Renders substances, reactions and the clinician who asserted them. The unrecorded state is deliberately loud rather than discreet: an absence here is a safety signal, not a privacy one.",
    },
    auditable: false,
    permissions: ["allergy.read"],
    terminology: ["SNOMED CT", "RxNorm", "FHIR"],
  },

  variants: [
    {
      id: "default",
      label: "Default",
      description: "Substance, criticality, verification and the worst past reaction.",
      args: { density: "default" },
    },
    {
      id: "compact",
      label: "Compact",
      description:
        "For an allergy banner across the top of a chart, where vertical space is the constraint.",
      args: { density: "compact" },
    },
  ],

  controls: [
    {
      prop: "density",
      control: "segmented",
      label: "Density",
      options: ["compact", "default"],
      defaultValue: "default",
    },
    {
      prop: "record",
      control: "fixture",
      label: "Record",
      options: ["allergyHighRisk", "allergyModerate", "allergyUnconfirmed", "allergyRefuted"],
    },
    { prop: "onOpenDetail", control: "event", label: "onOpenDetail" },
  ],

  a11yChecks: [
    {
      wcag: "1.3.1",
      name: "Info and relationships",
      status: "pass",
      how: "One labelled group per record, with the four facts composed into a single name in a fixed order. The relationship between the two severity-shaped fields is in the sentence rather than in visual adjacency.",
      evidence: "allergy-chip.test.tsx",
    },
    {
      wcag: "1.4.1",
      name: "Use of colour",
      status: "pass",
      how: "Criticality routes through ClinicalStatus so it carries a shape and a word. The two empty states differ by border style as well as hue, and a test asserts the dash survives.",
      evidence: "allergy-chip.test.tsx",
    },
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: 'role="group" with a composed label; a real button only when onOpenDetail is supplied. The ask affordance in the unrecorded state is a native button.',
      evidence: "allergy-chip.test.tsx",
    },
    {
      wcag: "2.1.1",
      name: "Keyboard",
      status: "pass",
      how: "Both affordances — open detail and ask — are native buttons, reached and activated by keyboard with no handler of the component's own.",
      evidence: "allergy-chip.test.tsx",
    },
    {
      wcag: "2.5.8",
      name: "Target size",
      status: "pass",
      how: "The chip and the ask button both hold a 24px minimum at both densities.",
      evidence: "allergy-chip.test.tsx",
    },
    {
      wcag: "1.4.10",
      name: "Reflow",
      status: "pass",
      how: "The substance wraps at word boundaries rather than truncating mid-word, and the class expansion takes its own line below 480px.",
      evidence: "allergy-chip.test.tsx",
    },
    {
      wcag: "1.4.12",
      name: "Text spacing",
      status: "pass",
      how: "A three-row grid with no fixed heights; increased line-height and letter-spacing grow the card rather than clipping it.",
      evidence: "allergy-chip.test.tsx",
    },
    {
      wcag: "2.2.1",
      name: "Timing adjustable",
      status: "not-applicable",
      how: "No timing of any kind.",
    },
  ],

  fixtures: [
    "allergyHighRisk",
    "allergyModerate",
    "allergyUnconfirmed",
    "allergyRefuted",
    "allergyList",
  ],

  examples: [
    {
      id: "criticality-is-not-severity",
      title: "Two rows, one manifestation, opposite consequences",
      description:
        "Both patients reacted with mild urticaria. Only the criticality field separates them, and it is the field most implementations drop — so the two rows render as identical warnings and a prescriber treats them the same.",
      fixture: "allergyHighRisk",
      code: `<AllergyChip record={{
  id: "1", substance: "Penicillin G", kind: "allergy",
  criticality: "high", verification: "confirmed",
  reactions: [{ manifestation: "Urticaria", severity: "mild", onset: "1998", note: "age 6" }],
}} />

<AllergyChip record={{
  id: "2", substance: "Amoxicillin", kind: "allergy",
  criticality: "low", verification: "unconfirmed",
  reactions: [{ manifestation: "Urticaria", severity: "mild", onset: "2019" }],
}} />`,
    },
    {
      id: "two-empty-states",
      title: "The two absences that are not the same fact",
      description:
        "A no-known assertion is a positive clinical finding with an author and a date, and it is safe to prescribe against. An unrecorded status is neither. Supply an assertion without its author and the component renders the second, because that is what an unattributed assertion is worth.",
      fixture: "allergyList",
      code: `// Safe to prescribe against.
<AllergyList noneKnown={{ asserter: "R. Okafor, RN", assertedAt: "14 Aug 2026",
                          context: "reconciled at intake" }} />

// Degrades to "Allergy status not recorded": no author, no assertion.
<AllergyList noneKnown={{ assertedAt: "14 Aug 2026" }} onAsk={openIntake} />`,
    },
    {
      id: "intolerance",
      title: "An intolerance is not a weak allergy",
      description:
        "Akathisia on aripiprazole and sedation on quetiapine dominate psychotropic histories and are the entries most often lost, because somebody decided they were not real allergies. The kind is rendered as its own class.",
      fixture: "allergyModerate",
      code: `<AllergyChip record={{
  id: "3", substance: "Lithium carbonate", kind: "intolerance",
  criticality: "unable-to-assess", verification: "confirmed",
  reactions: [{ manifestation: "Tremor, polyuria", severity: "moderate",
                note: "ongoing at therapeutic level" }],
}} />`,
    },
    {
      id: "refuted",
      title: "A refuted entry stays in the record",
      description:
        "Struck through and dimmed rather than deleted. A refuted allergy that vanishes gets re-reported at the next intake, and the rechallenge that disproved it is the most useful thing in the chart.",
      fixture: "allergyRefuted",
      code: `<AllergyChip record={{
  id: "4", substance: "Sulfa drugs", kind: "allergy",
  verification: "refuted",
  note: "Rechallenged 2024 · tolerated · refuted by allergist",
}} />`,
    },
  ],

  relationships: {
    builtWith: [],
    usedIn: [],
    patterns: ["patient-intake", "medication-safety"],
    alternatives: [
      {
        ref: "clinical-status",
        when: "the thing being rendered is a bare state with no substance or reaction behind it",
      },
    ],
  },

  seo: {
    slug: "allergy-chip",
    title: "Allergy Chip — React allergy display component",
    description:
      "A React allergy component that separates criticality from reaction severity, and distinguishes no known allergies from an allergy history nobody took.",
    primaryKeyword: "react allergy component",
    secondaryKeywords: [
      "fhir allergyintolerance react",
      "allergy banner component",
      "nkda display",
      "medication allergy ui",
    ],
    ogImage: "generated",
    searchIntent: "informational",
  },
});
