import type { ChartMenuAction, MenuSubject } from "@/components/zoblocks/chart-context-menu";

/**
 * Synthetic chart data for the examples. Ids, names and clinicians are
 * invented.
 */

/** Injected, never read from a clock — the disclosure record takes it as a prop. */
export const now = "2026-08-31T09:24:00-04:00";
export const serverTime = now;

export const nurse = { role: "a registered nurse", breakGlass: true } as const;

/* Subjects --------------------------------------------------------- */

export const order: MenuSubject = {
  resource: "MedicationRequest",
  id: "med-4471",
  label: "Lisinopril 10 mg",
  detail: "Oral · daily · started 4 Mar 2026",
};

/** The first of a twelve-order selection, and the eleven behind it. */
export const firstOrder = order;
export const otherOrders = Array.from({ length: 11 }, (_, index) => ({
  id: `med-${4472 + index}`,
}));

/** Buprenorphine is prescribed by a Part 2 program, so its notes are Part 2 records. */
export const buprenorphineOrder: MenuSubject = {
  resource: "MedicationRequest",
  id: "med-5120",
  label: "Buprenorphine–naloxone 8/2 mg",
  detail: "Sublingual · daily · OTP prescriber",
};

export const potassium: MenuSubject = {
  resource: "Observation",
  id: "obs-8812",
  label: "Potassium 6.8 mmol/L",
  detail: "Critical high · preliminary · 09:12 today",
};

export const note = { id: "doc-9911" };

/* Actions ---------------------------------------------------------- */

export const openOrder: ChartMenuAction = {
  id: "open",
  label: "Open order",
  tier: "routine",
  shortcut: "↵",
};
export const copyAsText: ChartMenuAction = {
  id: "copy",
  label: "Copy as text",
  tier: "routine",
  shortcut: "⌘C",
};
export const history: ChartMenuAction = {
  id: "history",
  label: "Administration history",
  tier: "routine",
};

export const marNote: ChartMenuAction = {
  id: "mar",
  label: "Add a note to the MAR",
  tier: "documented",
  applies: ["MedicationRequest"],
  records: "Writes a note on the medication record. Nursing sees it at the next round.",
};

export const pharmacyReview: ChartMenuAction = {
  id: "pharmacy",
  label: "Flag for pharmacy review",
  tier: "documented",
  applies: ["MedicationRequest"],
  records: "Creates a Task for pharmacy. It appears in their queue with your name on it.",
};

export const discontinue: ChartMenuAction = {
  id: "dc",
  label: "Discontinue",
  tier: "clinical",
  applies: ["MedicationRequest"],
  confirm: "The next scheduled dose is 14:00 today. Discontinuing stops it.",
  confirmVerb: "Discontinue",
};

export const deleteOrder: ChartMenuAction = {
  id: "delete",
  label: "Delete order",
  tier: "clinical",
  applies: ["MedicationRequest"],
  confirm: "Removes the order entirely.",
  availability: { status: "withheld" },
};

export const part2Reasons = [
  "Treatment of this patient",
  "Medical emergency (42 CFR §2.51)",
  "Written patient consent on file",
];

/** Every verb a medication row offers, routine through clinical. */
export const medicationActions: ChartMenuAction[] = [
  openOrder,
  copyAsText,
  history,
  marNote,
  discontinue,
  deleteOrder,
];

/** What a therapy note row offers. */
export const noteActions: ChartMenuAction[] = [
  { id: "open", label: "Open note", tier: "routine" },
  { id: "print", label: "Print", tier: "routine", shortcut: "⌘P" },
  {
    id: "part2",
    label: "Reveal Part 2 content",
    tier: "disclosive",
    applies: ["DocumentReference"],
    reasons: part2Reasons,
  },
];
