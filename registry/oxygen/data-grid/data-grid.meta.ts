import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "data-grid",
  title: "Data Grid",
  technicalName: "DataGrid",
  tier: "free",
  status: "beta",
  since: "0.6.0",
  layer: "clinical",

  summary:
    "A worklist that states what it is showing out of what, holds arriving results behind a line, and names the model when you sort by one.",

  tagline: "States its coverage before it shows you the rows.",
  description:
    'A ruled ledger with role="grid": coverage above the data rather than under it, a total that may honestly be unknown, absence said in words rather than an em dash, numbered footnotes naming the model behind a derived column, and results that arrive without anything moving under your hand.',
  rationale:
    'Every grid renders the six rows on screen and says nothing about the other 306. That is the defect, and it is not a missing feature — it is a claim the component makes and cannot support. A filtered caseload is a worse liar than a paginated one, because the filter was set by somebody at 07:00 who has since stopped seeing it, and the reader at 15:00 believes they are looking at the whole team\'s list. So coverage is required, the predicate prints as a sentence, and a total the source will not give is rendered as "the source did not say" rather than as the page size. Three further consequences follow from taking a worklist seriously as a safety surface. Absence has five reasons and no em dash: an assessment the client declined and a Part 2 record this reader may not see are different situations with different next actions. Sorting by a model-derived column ranks a prediction, so the column carries the model, its version and the population it was validated in. And results that land are counted and held rather than merged, because a grid that reorders under a pointer is how somebody actions the row that used to be there.',

  categories: ["Clinical", "Data Display"],

  fhir: [
    {
      name: "Bundle",
      url: "https://hl7.org/fhir/R4/bundle.html",
      note: 'Why `total` is `number | "unknown"`. `Bundle.total` is optional, the spec forbids constructing paging URLs, and some servers return only a `next` link — so "6 of 312" is a sentence a conformant server cannot always support.',
    },
    {
      name: "Observation",
      url: "https://hl7.org/fhir/R4/observation.html",
      note: "The absence vocabulary is `dataAbsentReason` narrowed to the five distinctions a reader acts on differently. `asked-declined` is the one this domain cannot afford to lose: a client refusing a PHQ-9 is a clinical event, not a gap.",
    },
    {
      name: "Patient",
      url: "https://hl7.org/fhir/R4/patient.html",
      note: 'The subject of the identity line. A masked row produces a line that says "restricted record" and names nobody — which is what 42 CFR Part 2 requires of every surface that touches such a record.',
    },
    {
      name: "RiskAssessment",
      url: "https://hl7.org/fhir/R4/riskassessment.html",
      note: "The shape a derived column usually carries — here a disengagement risk. `prediction.probabilityDecimal` is the number; the derivation is what makes it safe to sort by at all.",
    },
  ],

  states: [
    "Coverage above the data",
    "A total the source will not give",
    "Absence, said five ways",
    "Sorted by a derived column",
    "Results arrived, nothing moved",
    "The row the reader is on",
    "Compact density",
    "Everything, with nothing hidden",
    "Too many rows to render honestly",
    "Selected, with the verbs that reach them",
    "Pinned identity, scrolled sideways",
    "Loading more, and the end of what is known",
    "Framed by the host, not by itself",
    "The predicate matched nobody",
  ],

  a11y: [
    {
      label: "A real grid, with two-dimensional navigation",
      detail:
        'role="grid" with a roving tabindex over cells. Arrows move one cell, Home and End move within the row, Ctrl+Home and Ctrl+End reach the first header cell and the last cell, Page Up and Page Down move ten rows. The engine under the table most teams reach for ships zero keyboard handlers.',
    },
    {
      label: "aria-rowcount counts the cohort, not the page",
      detail:
        'A reader on row 4 of 6 in a caseload of 312 is told exactly that. Where the source will not give a total the attribute is -1, which is ARIA\'s "not known", rather than the page size dressed up as an answer.',
    },
    {
      label: "Focus follows the row, not the row's position",
      detail:
        "The cursor is a row key and a column key, so sorting, admitting arrivals, or the caller replacing the array cannot move focus onto a different patient. Every grid that stores a pair of indices has this defect.",
    },
    {
      label: "The header is reachable, so sorting is reachable",
      detail:
        "Sortable headers are buttons inside the columnheader and sit in the same roving sequence as the cells. A grid whose sort controls are only clickable cannot be sorted by keyboard at all.",
    },
    {
      label: "Nothing is carried by colour",
      detail:
        "Sort state is a glyph, a weight and aria-sort. The current row is a margin marker rather than a tint. Absence is a word in italic. All of it survives forced-colors, a monochrome print and a photograph of a monitor.",
    },
    {
      label: "Held results are announced without moving anything",
      detail:
        "The held line is a polite live region, so a screen-reader user learns results are arriving. Nothing is inserted into the table until they ask, so the announcement never coincides with rows moving under a cursor.",
    },
    {
      label: "The focus ring is drawn inside the cell",
      detail:
        "An outline on a cell under border-collapse is clipped by its neighbour's border, which loses half the ring exactly at the edge of a scroll container. It is an inset shadow with a second inset ring behind it, so it reads on any cell background.",
    },
    {
      label: "The table is named, and the name is not printed twice",
      detail:
        "`caption` is required and rendered visually hidden; the masthead carries the same claim in larger type. A grid with no accessible name is a wall of unlabelled cells.",
    },
  ],

  limitations: [
    "Client-side only, and it refuses past 20,000 rows rather than degrading. There is no virtualiser and no server row model yet; the ceiling is a measured number, not a placeholder, and the message says what to do instead.",
    "One sort column. Multi-column sort is a real requirement in a worklist and is not here yet.",
    "No column resize, reorder, pinning or grouping. Columns are typed objects precisely so a saved view can carry those later; today the caller sets width and order.",
    "No selection model and no row expansion. A grid that owns selection also owns the bulk-action confirmation, which is ChartContextMenu's job.",
    "Filtering is the caller's. The grid renders the predicate as a sentence and never composes one — a component that owned the filter would also own the query, and no Oxygen package makes a network call.",
    "The export helper produces delimited text, not XLSX. Typed cells are the stronger answer to formula injection; the quote prefix is what is available without a writer dependency.",
    "`status` columns sort by a declared order that the caller supplies. There is no terminology binding, so a mis-declared order sorts wrongly and nothing catches it.",
    "Strings are English and not routed through @oxygenui/intl — true of every registry component today.",
  ],

  related: ["chart-context-menu", "result-value", "risk-indicator", "clinical-status"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "grid-core"],

  usage: `import { DataGrid, type DataGridColumn } from "@/components/oxygen/data-grid";
import "@/styles/oxygen-grid.css";

const columns: DataGridColumn<Row>[] = [
  { key: "name", header: "Patient", kind: "text", value: (r) => r.name },
  { key: "mrn", header: "MRN", kind: "identifier", value: (r) => r.mrn },
  {
    key: "phq9",
    header: "PHQ-9",
    kind: "measure",
    // An absence is a value, not a hole. There is no null to pass here.
    value: (r) => r.phq9 ?? { absent: "awaiting" },
  },
  {
    key: "risk",
    header: "Disengagement risk",
    kind: "number",
    value: (r) => r.risk,
    derived: {
      model: "disengagement",
      version: "v1.8",
      validatedOn: "9,140 outpatient episodes",
      population: "adults, English-language intake only",
    },
  },
];

<DataGrid
  caption="Clients on this team's caseload with a raised PHQ-9 or a recent risk screen"
  title="Caseload · PHQ-9 raised or risk screened"
  columns={columns}
  rows={rows}
  rowKey={(row) => row.mrn}
  coverage={{
    shown: rows.length,
    total: cohortTotal,
    noun: "clients on this team's caseload",
    predicate: "PHQ-9 of 10 or more, or a risk screen in the last 14 days.",
  }}
  identify={(row) => ({ primary: row.name, secondary: \`MRN \${row.mrn}\` })}
  arrivals={held}
  onAdmitArrivals={admit}
/>`,

  guidance: {
    use: [
      "For any list somebody will act from — a worklist, a queue, a cohort, a results review. The coverage line is what makes it safe to act from, and it is the reason to reach for this rather than a table.",
      'With `coverage` computed from the query, not from the array. `shown` is the array; `total` is what the predicate matches, and if the source will not say, pass "unknown" rather than the array length again.',
      "With `derived` on every column whose values a model produced. The footnote is generated from it, so the alternative to filling it in is a page that presents a prediction as an observation.",
      "With `identify` wherever a row leads to an action. It is the line that re-states who the row is about at the point of action, which is the control the wrong-patient literature actually supports.",
      "With `arrivals` rather than by mutating `rows` when results stream in. The component's whole claim about live data is that it does not act on it until asked.",
    ],
    avoid: [
      "As a layout table. It is a grid with a keyboard model and a coverage claim; for two columns of static text a `<table>` is correct and cheaper.",
      "With `total` set to `rows.length` when it is not. That is the failure this component exists to prevent, written by hand — use `localGridCoverage(rows)` when you genuinely have everything.",
      'With an em dash, a blank or "N/A" returned from `value`. Return the absence object; a string "—" sorts as text and tells the reader nothing about why.',
      "With client-side data past a few thousand rows. The ceiling refuses at 20,000 and the honest answer well before that is server paging.",
      "As the surface that runs a destructive action. Compose ChartContextMenu on the row: the menu names its subject before it offers a verb, and this grid deliberately owns no actions.",
    ],
  },

  uxGuidelines: {
    do: [
      "Write `predicate` as a sentence somebody could read aloud in supervision: “PHQ-9 of 10 or more, or a risk screen in the last 14 days.”",
      "Give `noun` the thing being counted — “clients on this team's caseload”, “assessments awaiting review” — so the coverage line reads as a claim rather than as a row count.",
      "Put the identifier in `identity.secondary`. A name is not an identifier, and two clients on one caseload sharing a surname is in every study of this failure.",
      "Set `kind` on every column. It decides alignment, whether digits are compared as a quantity, and whether the first click sorts worst-first.",
      "Use `footnote` for anything the header cannot say in two words — a unit, a reference range, a collection method — instead of widening the header.",
    ],
    dont: [
      "Do not sort by a derived column on first paint. Ranking by model output is a clinical act, and doing it before anyone asked makes it the component's act rather than the reader's.",
      "Do not merge arrivals on a timer. The count waiting is information; the merge is a decision, and it belongs to whoever has their hand on the pointer.",
      "Do not colour a whole row by severity. The row marker means “you are here”; a second full-row tint makes the two indistinguishable, and both vanish in print.",
      "Do not hide the coverage line on small screens. It is the first thing to be dropped and the last thing that should be.",
      "Do not return different absence reasons for the same underlying fact across rows. The footnote is de-duplicated by reason, and three phrasings of “awaiting” produce three footnotes.",
    ],
  },

  tags: ["data-display", "sortable", "keyboard-first", "print-safe", "themeable"],
  aliases: [
    "data grid",
    "worklist",
    "patient list",
    "table",
    "results table",
    "cohort table",
    "census grid",
  ],

  domain: {
    industries: ["healthcare", "behavioral-health"],
    clinicalContext:
      "A caseload list is the screen behavioral health work is dispatched from, and it carries two structural failure modes: it can imply a completeness it does not have, and it can move a row out from under an action. Coverage answers the first and held arrivals the second. The third is specific to this field — 42 CFR Part 2 governs substance use records separately from the chart around them, so a grid that renders a withheld value and an unrecorded one identically is not merely unhelpful, it is wrong about which of them the reader is entitled to.",
    workflows: ["assessment", "care-coordination", "documentation", "medication"],
    phi: {
      handles: true,
      notes:
        "Every cell is caller-supplied and the grid stores none of it. The identity line renders what `identify` returns and refuses to render more; a masked identity produces a line that names nobody. The export helper writes what the columns already display.",
    },
    auditable: false,
    permissions: ["chart.read"],
    terminology: ["FHIR", "LOINC"],
  },

  controls: [
    {
      prop: "density",
      control: "select",
      label: "Density",
      options: ["comfortable", "regular", "compact"],
      defaultValue: "regular",
    },
    {
      prop: "pinnedColumns",
      control: "slider",
      label: "Pinned columns",
      min: 0,
      max: 2,
      step: 1,
      defaultValue: 0,
    },
    { prop: "onSortChange", control: "event", label: "onSortChange" },
    { prop: "onSelectionChange", control: "event", label: "onSelectionChange" },
    { prop: "onReachEnd", control: "event", label: "onReachEnd" },
    { prop: "onRowActivate", control: "event", label: "onRowActivate" },
    { prop: "onAdmitArrivals", control: "event", label: "onAdmitArrivals" },
  ],

  a11yChecks: [
    {
      wcag: "2.1.1",
      name: "Keyboard",
      status: "pass",
      how: "Arrows, Home, End, Ctrl+Home, Ctrl+End, Page Up and Page Down move the cursor; Enter activates a row; the header is in the same sequence so sorting is reachable. Nothing needs a pointer.",
      evidence: "data-grid.test.tsx",
    },
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: 'role="grid" named by the masthead title, with rowgroup, row, columnheader and gridcell stated explicitly, aria-sort on every sortable header, and aria-rowindex and aria-colindex on every cell.',
      evidence: "data-grid.test.tsx",
    },
    {
      wcag: "1.3.1",
      name: "Info and relationships",
      status: "pass",
      how: 'aria-rowcount is the cohort plus the header row, or -1 where the total is unknown. Header cells carry scope="col". The caption names the table for a screen reader without printing it twice.',
      evidence: "data-grid.test.tsx",
    },
    {
      wcag: "1.4.1",
      name: "Use of colour",
      status: "pass",
      how: "Sort is a glyph plus a weight plus aria-sort; the current row is a margin marker, not a tint; absence is a word. Asserted by rendering with no colour available.",
      evidence: "data-grid.test.tsx",
    },
    {
      wcag: "4.1.3",
      name: "Status messages",
      status: "pass",
      how: 'The held-arrivals line is a polite live region carrying the count and the words “nothing moved”. The capacity refusal is role="status".',
      evidence: "data-grid.test.tsx",
    },
    {
      wcag: "2.4.7",
      name: "Focus visible",
      status: "pass",
      how: "An inset two-ring shadow rather than an outline, because an outline on a collapsed-border cell is clipped by its neighbour exactly at the edge of a scroll container.",
      evidence: "grid.css",
    },
    {
      wcag: "1.4.10",
      name: "Reflow",
      status: "pass",
      how: "The table scrolls horizontally inside its own container; the masthead, held line and footnotes reflow and never scroll sideways, so the coverage claim survives a 320px viewport.",
      evidence: "grid.css",
    },
    {
      wcag: "2.5.8",
      name: "Target size (minimum)",
      status: "pass",
      how: "Header sort buttons take a 28px floor and the admit control 26px, rather than the 2.75rem density target — a pointer size for a thumb, and three times the height of the 10px labels inside them. Both clear the 24px minimum SC 2.5.8 asks for.",
      evidence: "grid.css",
    },
  ],

  fixtures: ["caseloadPhq9", "unknownTotal"],

  examples: [
    {
      id: "coverage",
      title: "Coverage is arithmetic, not a footer note",
      description:
        "The claim goes above the rows it is about, and a total the source will not give says so in words. Rendering the page size as the total is the one failure this type exists to prevent.",
      fixture: "caseloadPhq9",
      code: `describeGridCoverage({ shown: 6, total: 312, noun: "clients on this caseload" });
// → "6 of 312 clients on this caseload."

describeGridCoverage({ shown: 6, total: "unknown", noun: "clients" });
// → "6 clients shown. The source did not say how many match."

gridUnseenCount({ shown: 6, total: 312 });     // → 306
gridUnseenCount({ shown: 6, total: "unknown" }); // → null`,
    },
    {
      id: "absence",
      title: "An absence sorts last, in both directions",
      description:
        "The load-bearing line in the engine. A PHQ-9 the client has not completed is not a PHQ-9 of zero — sorting ascending and finding four “Awaiting” rows above the score of 7 tells the reader the caseload is doing better than it is.",
      fixture: "caseloadPhq9",
      code: `const phq9 = { key: "phq9", header: "PHQ-9", kind: "measure",
               value: (r) => r.phq9 };

sortGridRows(rows, phq9, "ascending").map((r) => r.phq9);
// → [7, 11, 18, 22, { absent: "awaiting" }, { absent: "restricted" }]

sortGridRows(rows, phq9, "descending").map((r) => r.phq9);
// → [22, 18, 11, 7, { absent: "awaiting" }, { absent: "restricted" }]`,
    },
    {
      id: "derived",
      title: "Sorting by a model is ranking a prediction",
      description:
        "The derivation travels with the column, so the footnote is generated rather than remembered. Sorting by it promotes that footnote to a statement under the table naming the model, its version and the population it was validated in.",
      fixture: "caseloadPhq9",
      code: `describeGridDerivation({
  model: "disengagement",
  version: "v1.8",
  validatedOn: "9,140 outpatient episodes",
  population: "adults, English-language intake only",
});
// → "disengagement v1.8, validated on 9,140 outpatient episodes,
//    adults, English-language intake only."`,
    },
    {
      id: "arrivals",
      title: "Results arrive; nothing moves",
      description:
        "The grid counts what has landed and holds it. Merging is the reader's decision, taken with their hand on the pointer — which is the difference between a live grid and one that actioned the row that used to be there.",
      fixture: "caseloadPhq9",
      code: `describeGridArrivals(3, "11:47");
// → "3 results arrived at 11:47 — nothing moved."

<DataGrid arrivals={held} arrivalsAt="11:47" onAdmitArrivals={admit} … />
// The rows prop never changes until admit() is called.`,
    },
    {
      id: "export",
      title: "An export is an attack surface",
      description:
        "A patient's preferred name is free text arriving from a registration desk. There is no option that turns this off, because the person who opens the file is rarely the person who chose the column.",
      fixture: "caseloadPhq9",
      code: `neutraliseGridCell("=cmd|' /C calc'!A0");   // → "'=cmd|' /C calc'!A0"
neutraliseGridCell("＝HYPERLINK(...)");      // → "'＝HYPERLINK(...)"  full-width too
neutraliseGridCell("Ade-Smith");             // → "Ade-Smith"        unchanged

toGridDelimited(rows, columns, { coverage });
// Row 1 is the coverage sentence, because an export outlives its screen.`,
    },
    {
      id: "refusal",
      title: "A refusal, not a nine-second paint",
      description:
        "Twenty thousand is measured rather than chosen: a forty-column client-side model on a shared 4 GB ward workstation stops being something you put in front of a nurse at handover somewhere around there.",
      fixture: "unknownTotal",
      code: `gridCapacityRefusal(18_000);   // → null
gridCapacityRefusal(120_000);
// → "120,000 rows is past what this renders on a ward workstation
//    (the ceiling is 20,000). Narrow the query or move paging to the
//    server — the grid will not pretend to hold them."`,
    },
  ],

  relationships: {
    builtWith: [],
    usedIn: [],
    patterns: ["chart-review", "care-coordination"],
    alternatives: [
      {
        ref: "care-timeline",
        when: "the rows are one patient's events over time rather than many patients at one moment",
      },
      {
        ref: "chart-command-palette",
        when: "the reader knows which record they want and would rather type its name than scan for it",
      },
    ],
  },

  seo: {
    slug: "data-grid",
    title: 'Data Grid — React healthcare worklist with role="grid"',
    description:
      "An accessible React data grid for clinical worklists: it states its coverage above the rows and names the model when you sort by a derived column.",
    primaryKeyword: "react healthcare data grid",
    secondaryKeywords: [
      "accessible react data grid",
      "clinical worklist component",
      "ehr patient list table react",
      "role grid keyboard navigation react",
      "csv formula injection react table",
    ],
    ogImage: "generated",
    searchIntent: "informational",
  },
});
