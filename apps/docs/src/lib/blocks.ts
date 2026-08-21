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
export type BlockSlug = "dashboard-01" | "note-01" | "patient-01" | "copilot-01";

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
      "Four tiles that each carry a denominator and a window, a response panel that compares every patient against their own predicted curve, and a caseload ordered by who needs attention rather than alphabetically.",
    demonstrates:
      "The tile grid a SaaS dashboard uses, with clinical numbers in it. Every figure renders the quantity it is part of, so nothing reads as a bare count — and there is no count-up animation, because for the second it runs the dashboard would be showing numbers that are wrong.",
    uses: ["chart-accordion", "timeline", "switch", "tabs"],
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
    slug: "patient-01",
    title: "Patient details view",
    blurb:
      "A chart header dense enough to work from, a chronology that states what it is a view of, and a record section that is present and withheld rather than quietly deleted.",
    demonstrates:
      "Two things a conventional chart header cannot say: that this view of the record is partial, and that a substance-use section exists but is governed by a different federal rule than the chart around it. The instrument cards carry a scale, a trajectory and a next-due date, where a conventional snapshot shows a score and a delta arrow.",
    uses: ["identity", "care-timeline", "chart-accordion", "safety-plan"],
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
