/**
 * The block registry.
 *
 * Deliberately separate from `CATALOG`. The catalog describes parts — one
 * component, its states, its props. This describes assemblies: several
 * components on one screen at the density that screen actually runs at. A
 * reader browsing for "a patient header" is doing a different job from one
 * browsing for "Accordion", and collapsing the two lists would serve neither.
 */

/**
 * The implemented blocks, as a union.
 *
 * `components/blocks/index.tsx` maps this exact union to components, so adding
 * an entry here without building it is a type error rather than a 404 someone
 * finds later. It also keeps the check on the server: `hasBlock()` used to live
 * in the client module, and importing it into a route handed the server a
 * client reference instead of a function — the page 500'd on every slug.
 */
export type BlockSlug =
  | "dashboard-01"
  | "caseload-01"
  | "patient-01"
  | "schedule-01"
  | "messages-01"
  | "note-01"
  | "safety-01"
  | "instruments-01"
  | "reports-01"
  | "directory-01"
  | "copilot-01";

export interface BlockDoc {
  slug: BlockSlug;
  title: string;
  /** One sentence on what the block is for, shown under the frame. */
  blurb: string;
  /** What it demonstrates that a conventional version of the same screen cannot. */
  demonstrates: string;
  /** Component names. Linked when the catalog has them, plain text when it does not. */
  uses: readonly string[];
}

export const BLOCKS: readonly BlockDoc[] = [
  {
    slug: "dashboard-01",
    title: "Clinical caseload dashboard",
    blurb:
      "Four tiles that each carry a denominator and open the list behind them, a response panel that compares patients against their predicted curve, and a caseload ordered by attention.",
    demonstrates:
      "The tile grid a SaaS dashboard uses, with clinical numbers in it. Every figure renders the quantity it is part of, so nothing reads as a bare count — and there is no count-up animation, because for the second it runs the dashboard would be showing numbers that are wrong.",
    uses: ["chart-accordion", "timeline", "switch", "tabs"],
  },
  {
    slug: "caseload-01",
    title: "Caseload",
    blurb:
      "All 68 active patients, ordered by who needs attention. Filter by response, clinician or program, search by name, and open any row into the record.",
    demonstrates:
      "Filters that carry their own counts, so a reader knows how many people a view hides before choosing it. The default order is attention, not the alphabet.",
    uses: ["data-grid", "clinical-status", "tabs"],
  },
  {
    slug: "patient-01",
    title: "Patient details view",
    blurb:
      "A chart header dense enough to work from, a chronology that states what it is a view of, and a record section that is present and withheld rather than quietly deleted.",
    demonstrates:
      "Two things a conventional chart header cannot say: that this view of the record is partial, and that a substance-use section exists but is governed by a different federal rule than the chart around it. The instrument cards carry a scale, a trajectory and a next-due date, where a conventional snapshot shows a score and a delta arrow.",
    uses: ["identity", "care-timeline", "chart-accordion", "safety-plan"],
  },
  {
    slug: "schedule-01",
    title: "Schedule",
    blurb:
      "A clinician's week, with each session carrying the measure it is due and the risk it follows up. Open any slot to check in, start the note or reschedule.",
    demonstrates:
      "A calendar that knows what a session is for. A risk follow-up due before a booked slot is shown against the slot, not left in another screen.",
    uses: ["date-picker", "clinical-status", "switch"],
  },
  {
    slug: "messages-01",
    title: "Secure messages",
    blurb:
      "Patient, pharmacy and colleague threads in one inbox, each tied to a record. Reply, flag or file a thread to the chart.",
    demonstrates:
      "A message is part of the record. Every thread names its patient, and a reply is filed to the chart rather than living only in an inbox.",
    uses: ["chart-context-menu", "provenance-chip", "clinical-status"],
  },
  {
    slug: "note-01",
    title: "Progress note with provenance",
    blurb:
      "A session note where every passage records where it came from — typed, dictated, template, copied forward, or drafted by the copilot — and the signature refuses until the note has actually been read.",
    demonstrates:
      "One paragraph is copied forward from last week and contradicted by the paragraph after it. That is what the read gate is for: a signature attests that you read what you signed, and the meter makes the precondition visible instead of turning it into a refusal at the last click.",
    uses: ["clinical-note", "signature", "switch", "accordion"],
  },
  {
    slug: "safety-01",
    title: "Safety queue",
    blurb:
      "Open risk follow-ups ordered by time left, each with the window it answers to. Record the contact, and the item leaves the queue everywhere.",
    demonstrates:
      "An alert that can be closed only by recording what happened. The queue, the rail badge and the dashboard all update from the same action.",
    uses: ["safety-plan", "care-timeline", "risk-indicator"],
  },
  {
    slug: "instruments-01",
    title: "Measurement instruments",
    blurb:
      "The validated measures in use, their scoring bands, and who is due one this week. Send a measure to a patient from the list.",
    demonstrates:
      "Scoring bands drawn on each instrument's own range, so a GAD-7 of 15 and a PHQ-9 of 15 are never read as the same thing.",
    uses: ["chart-accordion", "trend-indicator", "switch"],
  },
  {
    slug: "reports-01",
    title: "Outcome reports",
    blurb:
      "Response and remission rates by clinician and program, time to first appointment, and engagement. Change the period, then export the table.",
    demonstrates:
      "Rates that carry their denominators. A remission rate from nine patients is labelled as nine patients, not rounded into a trend.",
    uses: ["data-grid", "tabs", "trend-indicator"],
  },
  {
    slug: "directory-01",
    title: "Patient directory",
    blurb:
      "Every patient in the clinic, searchable by name, MRN or date of birth, with clinician, program and next contact. Open any card into the record.",
    demonstrates:
      "Search by the identifiers staff actually use, and an open risk follow-up shown on the card before the record is opened.",
    uses: ["data-grid", "recent-patient-stack", "clinical-status"],
  },
  {
    slug: "copilot-01",
    title: "Clinical copilot, sourced",
    blurb:
      "A question about a chart, answered with every claim carrying a citation back to the row it came from — press one and the source flashes in the record beside it.",
    demonstrates:
      "The citation round-trip. The answer is streamed and cursored so it never reads as part of the record, it may only cite what is on screen, and the thread ends in an audit line rather than disappearing when the tab closes.",
    uses: ["copilot", "care-timeline", "chart-accordion", "signature"],
  },
];

export function getBlock(slug: string): BlockDoc | undefined {
  return BLOCKS.find((b) => b.slug === slug);
}
