import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "provenance-chip",
  title: "Provenance Chip",
  technicalName: "ProvenanceChip",
  tier: "free",
  status: "stable",
  since: "0.4.0",
  layer: "clinical",

  summary:
    "Where a value came from, how it got here, and how much of it a human has actually looked at.",

  tagline: "Where a value came from, and who has actually read it.",
  description:
    "A 20px affix beside a value, never competing with it. Six source classes with CSS glyphs rather than colours, staleness folded in against a per-datum policy, and — for an AI-extracted value — the model, the source span and whether anybody has confirmed it.",
  rationale:
    "A blood pressure typed by a medical assistant, streamed from a home cuff, pulled from an HIE document of unknown vintage, and extracted by a language model from a scanned fax all render as 128/76. They are not the same fact and they do not support the same decision. As ambient AI and external exchange both scale, the proportion of chart content that no human ever typed is rising fast, and there is no widely used convention for saying so. Two distinctions carry the component. Observed-at is kept separate from recorded-at, because a C-CDA authored in March may carry a reading measured in January and rendering the document's date as the observation's is how a nine-week-old value is acted on as current. And patient-reported is a source class rather than a caveat: self-report is the primary instrument in behavioral health, so a patient-reported PHQ-9 is the correct provenance and rendering it as second-class is its own error — the same class standing in for a blood-pressure measurement is a different matter, and that judgement belongs to the caller.",

  categories: ["Clinical", "AI"],

  fhir: [
    {
      name: "Provenance",
      url: "https://hl7.org/fhir/R4/provenance.html",
      note: "agent[].type and who, entity[].role, recorded and occurredDateTime as two separate fields, and activity. The adapter will not call an authorship an extraction on the strength of the agent type alone.",
    },
  ],

  states: [
    "Clinic — measured in the room",
    "Home device, with its caveats",
    "Patient-reported — the instrument",
    "External, with the exchange named",
    "AI-extracted, unconfirmed",
    "AI-extracted, confirmed by a clinician",
    "Amended — the original retained",
    "Stale against a per-datum policy",
    "Observed long before it was recorded",
    "Glyph only, in a dense grid",
    "Chain reachable",
    "Span reachable",
    "No ledger entry — renders nothing",
  ],

  a11y: [
    {
      label: "Six shapes, not six colours",
      detail:
        "Colour would put the source classes on a scale from better to worse, and they are not one. Each class is a CSS glyph in currentColor, so it survives greyscale and forced colours — where colour would have been the only channel, and where colour was never the right channel anyway.",
    },
    {
      label: "The name is the whole sentence",
      detail:
        '"Source: device, Omron BP7450, unvalidated cuff size, observed 4 d ago, stale." One string, in a fixed order: what kind of source, then who or what, then when, then whether anybody has looked. The confirmation clause is last because it decides whether to act, and a listener remembers the end of a sentence.',
    },
    {
      label: "A span when there is nothing to open",
      detail:
        'role="img" with a label by default; a real button only when the host supplies a chain. There is one of these beside every value on a chart, so a focusable element with no action is worse here than almost anywhere.',
    },
    {
      label: "Staleness is on the chip, not in the chain",
      detail:
        "A device reading from four days ago and one from four minutes ago carry different weight, and a reader who has to hover to learn which is a reader who will not. The threshold is injected per datum type: four days is nothing for a problem list and a lot for a blood pressure.",
    },
    {
      label: "Unreviewed is a word, not a dot",
      detail:
        "An unconfirmed extraction says so in text and in the accessible name. It is not a confidence score — a model can be very confident and wrong — and the fact a reader needs is whether a human has been involved at all.",
    },
  ],

  limitations: [
    'It renders nothing when the ledger has no entry. A chip reading "unknown" beside every unmapped value teaches readers to ignore the column, which costs more than the gap.',
    "No fetching. Components never request their own provenance: a chart with two hundred values would make two hundred requests and every chip would settle at a different moment. The host subscribes once and passes the ledger down.",
    "The FHIR adapter cannot reliably detect an extraction. R4's participation types do not distinguish one from an authorship, so an extraction is only recognised when the activity says so — guessing would label every transcription as a model output.",
    "Staleness needs a policy. Without one the chip says nothing about age rather than assuming a threshold, because a wrong threshold is worse than no threshold on a problem list.",
  ],

  related: ["result-value", "clinical-status"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "provenance-core"],

  usage: `import { ProvenanceChip, ledgerFrom } from "@/components/oxygen/provenance-chip";
import "@/styles/oxygen-provenance.css";

const ledger = ledgerFrom(records);

<ProvenanceChip
  resourceId="obs-bp-1"
  ledger={ledger}
  now={serverTime}
  stalenessPolicy={(r) => (r.source === "device" ? 48 * 3600_000 : null)}
/>`,

  guidance: {
    use: [
      "Beside any value whose origin changes what a reader should do with it — vitals, medication lists, problem lists, external documents, anything a model produced.",
      "With a ledger rather than a record per call site, so every chip on a screen describes the same snapshot.",
      "With onOpenSpan wherever extracted values appear. Jumping to the source span is the single most requested behaviour from clinicians reviewing extraction.",
      "With a staleness policy per datum type. A shared threshold either screams about every diagnosis or stays silent about every vital.",
    ],
    avoid: [
      "As a headline. It is an affix; a provenance that competes with the value it qualifies has inverted the reading order.",
      "As a quality score. It says where a value came from, not whether it is right — a clinic measurement can be wrong and a patient-reported PHQ-9 is the instrument.",
      "Without `now` when age matters. Omitting it renders no age at all, which is honest; a client clock is not.",
    ],
  },

  uxGuidelines: {
    do: [
      "Populate observedAt separately from recordedAt whenever the source distinguishes them. The gap between the two is the fact the component exists to render.",
      'Name the exchange as well as the organisation. "External" tells a reader nothing they can act on; "Northgate Family Med via Carequality" does.',
      "Carry the device's caveats. An unvalidated cuff size is why a home reading is not a clinic reading.",
    ],
    dont: [
      "Do not render patient-reported as a warning. It is the correct provenance for a screening instrument, and styling it as a defect teaches staff to distrust the right answer.",
      "Do not fold the confirmation state into a confidence number. They answer different questions and only one of them involves a human.",
      "Do not put the chip on its own line. It is an affix, and a provenance with its own row reads as a second value.",
    ],
  },

  tags: ["data-display", "themeable", "print-safe", "headless"],
  aliases: [
    "data source badge",
    "attribution chip",
    "source indicator",
    "ai attribution",
    "data lineage",
  ],

  domain: {
    industries: ["healthcare", "behavioral-health"],
    clinicalContext:
      "Every surface where a value's origin changes the decision. Self-report is the primary instrument in behavioral health, so the component distinguishes self-report as the instrument from self-report standing in for a measurement — the same class, two different weights, and the caller's judgement rather than the component's.",
    workflows: ["documentation", "assessment", "care-coordination", "medication"],
    phi: {
      handles: true,
      notes:
        "Names the clinician who observed a value, the organisation that sent it and the document it arrived in. The chain is the disclosive part and it opens on request rather than rendering inline.",
    },
    auditable: true,
    permissions: ["provenance.read"],
    terminology: ["FHIR"],
  },

  variants: [
    {
      id: "default",
      label: "Default",
      description: "Glyph, source word and age. The affix a value carries.",
      args: { glyphOnly: false },
    },
    {
      id: "glyph",
      label: "Glyph only",
      description:
        "For a dense grid where the column is entirely provenance. The word stays in the accessible name.",
      args: { glyphOnly: true },
    },
  ],

  controls: [
    { prop: "glyphOnly", control: "switch", label: "Glyph only", defaultValue: false },
    { prop: "now", control: "text", label: "Now (ISO 8601)" },
    { prop: "resourceId", control: "text", label: "Resource id" },
    { prop: "onOpenChain", control: "event", label: "onOpenChain" },
    { prop: "onOpenSpan", control: "event", label: "onOpenSpan" },
  ],

  a11yChecks: [
    {
      wcag: "1.4.1",
      name: "Use of colour",
      status: "pass",
      how: "Six CSS glyphs in currentColor rather than six hues, and a test asserts every source class renders a distinct glyph. Staleness and the unreviewed state carry words as well as backgrounds.",
      evidence: "provenance-chip.test.tsx",
    },
    {
      wcag: "1.3.1",
      name: "Info and relationships",
      status: "pass",
      how: "The whole provenance is one composed name in a fixed order, with every inner node aria-hidden — so a screen reader hears a sentence rather than five fragments beside a value.",
      evidence: "provenance-chip.test.tsx",
    },
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: 'role="img" with a label when static, a real button when a chain is supplied, and the span affordance is its own labelled button.',
      evidence: "provenance-chip.test.tsx",
    },
    {
      wcag: "2.1.1",
      name: "Keyboard",
      status: "pass",
      how: "Both affordances are native buttons reached and activated by keyboard, with no handler of the component's own.",
      evidence: "provenance-chip.test.tsx",
    },
    {
      wcag: "2.5.8",
      name: "Target size",
      status: "pass",
      how: "The chip and the span button hold a 20px box inside a 24px line, and the interactive form is padded to reach the floor without shifting the value beside it.",
      evidence: "provenance-chip.test.tsx",
    },
    {
      wcag: "1.4.11",
      name: "Non-text contrast",
      status: "pass",
      how: "The glyph is drawn in the inherited text colour, so it meets whatever the surrounding text meets; the two tinted states route through gated status tokens.",
      evidence: "contrast.gate",
    },
    {
      wcag: "1.4.12",
      name: "Text spacing",
      status: "pass",
      how: "An inline-flex row with no fixed height; increased line-height and letter-spacing grow the chip rather than clipping it.",
      evidence: "provenance-chip.test.tsx",
    },
    {
      wcag: "2.2.1",
      name: "Timing adjustable",
      status: "not-applicable",
      how: "No timing. Staleness is computed against a `now` the host supplies.",
    },
  ],

  fixtures: [
    "observationPotassiumCritical",
    "provenanceLateEntry",
    "practitionerSigner",
    "documentLateEntry",
  ],

  examples: [
    {
      id: "six-provenances",
      title: "One value, six provenances",
      description:
        "The same 128/76, six times. Each supports a different decision, and only the affix says which — the clinic reading is actionable, the HIE row carries a document date rather than an observation date, and the extracted row states that nobody has looked at it.",
      fixture: "observationPotassiumCritical",
      code: `<ProvenanceChip record={{ source: "clinic", observedAt: t12min,
  performer: { display: "M. Adeyemi", role: "MA" }, device: "Welch Allyn 6000" }} now={now} />

<ProvenanceChip record={{ source: "device", observedAt: t4days,
  device: "Omron BP7450", deviceNote: "unvalidated cuff size, median of 3" }} now={now} />

<ProvenanceChip record={{ source: "ai-extracted", model: "oxy-extract-3",
  span: { document: "Scanned referral", page: 2, line: 14 }, confirmed: false }} />`,
    },
    {
      id: "document-vintage",
      title: "Document vintage is not observation vintage",
      description:
        "A C-CDA authored on 11 March may carry a reading measured in January. Rendering the document's date as the observation's is how a nine-week-old value is acted on as current, so the two are separate fields and the age is measured from the first.",
      fixture: "documentLateEntry",
      code: `<ProvenanceChip
  now={now}
  record={{
    source: "external",
    organisation: "Northgate Family Med",
    exchange: "Carequality",
    document: "C-CDA, authored 11 Mar",
    observedAt: "2026-01-14T09:00:00Z", // the reading
    recordedAt: "2026-03-11T00:00:00Z", // the document
  }}
/>;`,
    },
    {
      id: "ledger",
      title: "One subscription, not two hundred requests",
      description:
        "Components never fetch their own provenance. A chart with two hundred values would make two hundred requests and every chip would settle at a different moment, so the host subscribes once and the chips are pure.",
      fixture: "provenanceLateEntry",
      code: `const ledger = ledgerFrom({
  "obs-1": { source: "clinic", observedAt: t },
  // Versioned first: an amended value and its original are two provenances.
  "obs-1@2": { source: "amended", supersedes: { value: "182/76", reason: "typo" } },
});

<ProvenanceChip resourceId="obs-1" versionId="2" ledger={ledger} now={now} />;`,
    },
    {
      id: "staleness-policy",
      title: "Four days differs by datum",
      description:
        "Four days is nothing for a problem list and a lot for a blood pressure, so the threshold is injected per datum type. Without a policy the chip says nothing about age rather than assuming one — a wrong threshold is worse than no threshold.",
      fixture: "practitionerSigner",
      code: `const policy: StalenessPolicy = (record) => {
  if (record.source === "device") return 48 * 3600_000;   // two days
  if (record.source === "patient-reported") return 30 * 86400_000;
  return null;  // no opinion, and the chip says nothing rather than guessing
};`,
    },
  ],

  relationships: {
    builtWith: [],
    usedIn: [],
    patterns: ["results-review", "clinical-documentation"],
    alternatives: [
      {
        ref: "result-value",
        when: "the question is what the value is rather than where it came from",
      },
    ],
  },

  seo: {
    slug: "provenance-chip",
    title: "Provenance Chip — React data source component",
    description:
      "A React provenance affix for clinical values: six source classes, AI extraction with its source span, and staleness measured against a per-datum policy.",
    primaryKeyword: "react data provenance component",
    secondaryKeywords: [
      "fhir provenance react",
      "ai attribution ui",
      "clinical data lineage",
      "data source indicator react",
    ],
    ogImage: "generated",
    searchIntent: "informational",
  },
});
