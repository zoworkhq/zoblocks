/**
 * Stories for DataGrid.
 *
 * Nine states, and every one of them is a claim the component makes rather
 * than an appearance it can take. A grid with a "default" story and a "dark"
 * story has documented its skin; these document what it does when the data is
 * incomplete, when the source will not answer, when results arrive mid-read,
 * and when there is more of it than can honestly be rendered — which is where
 * a worklist is actually used.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import { DataGrid, type DataGridColumn } from "./data-grid";
import {
  ARRIVALS,
  DISENGAGEMENT,
  UNKNOWN_TOTAL_COVERAGE,
  CASELOAD,
  CASELOAD_COVERAGE,
  CASELOAD_WITH_EVERY_ABSENCE,
  phq9Band,
  type CaseloadRow,
} from "./data-grid.fixtures";

const COLUMNS: DataGridColumn<CaseloadRow>[] = [
  { key: "name", header: "Client", kind: "text", value: (row) => row.name },
  { key: "mrn", header: "MRN", kind: "identifier", value: (row) => row.mrn, width: "7rem" },
  {
    key: "phq9",
    header: "PHQ-9",
    kind: "measure",
    value: (row) => row.phq9,
    footnote: "Serum phq9, mmol/L. Reference range 3.5–5.1.",
    // The qualifier is a word, supplied here rather than by the grid: the
    // component holds no reference ranges and inventing one is how a library
    // ends up asserting a threshold somebody else's lab disagrees with.
    cell: (row) => (
      <span>
        {String(row.phq9)}
        {phq9Band(row.phq9) ? <span> {phq9Band(row.phq9)}</span> : null}
      </span>
    ),
  },
  {
    key: "risk",
    header: "Disengagement risk",
    kind: "number",
    value: (row) => row.risk,
    derived: DISENGAGEMENT,
    cell: (row) => row.risk.toFixed(2),
  },
  { key: "due", header: "Next due", kind: "instant", value: (row) => row.due },
];

const meta: Meta<typeof DataGrid<CaseloadRow>> = {
  title: "Clinical/Data Grid",
  component: DataGrid,
  args: {
    caption: "Clients on this team's caseload with a raised PHQ-9 or a recent risk screen",
    title: "Caseload · adult outpatient",
    note: "24h window",
    columns: COLUMNS,
    rows: CASELOAD,
    rowKey: (row: CaseloadRow) => row.mrn,
    coverage: CASELOAD_COVERAGE,
  },
};

export default meta;
type Story = StoryObj<typeof DataGrid<CaseloadRow>>;

export const Coverage: Story = {
  name: "Coverage above the data",
  parameters: { state: "Coverage above the data" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The claim, in the masthead, before the rows it is about.
    expect(canvas.getByText(/6 of 312 clients on this team's caseload\./)).toBeTruthy();

    // aria-rowcount counts the cohort plus the header row, not the page.
    const grid = canvas.getByRole("grid");
    expect(grid.getAttribute("aria-rowcount")).toBe("313");
    expect(grid.getAttribute("aria-colcount")).toBe("5");
  },
};

export const UnknownTotal: Story = {
  name: "A total the source will not give",
  parameters: { state: "A total the source will not give" },
  args: { coverage: UNKNOWN_TOTAL_COVERAGE },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/The source did not say how many match\./)).toBeTruthy();
    // -1 is ARIA's "not known". The alternative is the page size dressed up
    // as an answer, which is the failure the union type exists to prevent.
    expect(canvas.getByRole("grid").getAttribute("aria-rowcount")).toBe("-1");
  },
};

export const Absence: Story = {
  name: "Absence, said five ways",
  parameters: { state: "Absence, said five ways" },
  args: { rows: CASELOAD_WITH_EVERY_ABSENCE, coverage: { shown: 8, total: 312 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Five words, not five dashes. Each leads somewhere different: chase the
    // lab, ask for access, ask the question, respect the answer — and, for the
    // last, know that there is nobody to ask because the source said nothing.
    for (const word of ["Awaiting", "Restricted", "Not recorded", "Declined", "Not known"]) {
      expect(canvas.getByText(word)).toBeTruthy();
    }
    // Every one of them earns a numbered footnote saying what it means.
    expect(canvas.getByText(/Assessment booked; the client has not completed it\./)).toBeTruthy();
    expect(canvas.getByText(/Part 2 record — not available to you\./)).toBeTruthy();
    expect(canvas.getByText(/The patient declined\./)).toBeTruthy();
  },
};

export const SortedByDerived: Story = {
  name: "Sorted by a derived column",
  parameters: { state: "Sorted by a derived column" },
  args: { defaultSort: { key: "risk", direction: "descending" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole("columnheader", { name: /Disengagement risk/ });
    expect(header.getAttribute("aria-sort")).toBe("descending");

    // The provenance is a statement under the table, not a tooltip: it has to
    // survive a print and a screenshot.
    expect(
      canvas.getByText(/disengagement v1\.8, validated on 9,140 outpatient episodes/),
    ).toBeTruthy();
    // Cited rather than restated: the derivation is footnote 1 whether or not
    // anybody sorted, and printing it twice on one page is how a reader ends
    // up unsure whether they are looking at two different models.
    expect(canvas.getByText(/Sorted by a prediction — see note 1\./)).toBeTruthy();

    // Worst first, and the row order actually changed.
    const first = canvas.getAllByRole("row")[1];
    expect(first?.textContent).toContain("Adeyemi, R.");
  },
};

export const Arrivals: Story = {
  name: "Results arrived, nothing moved",
  parameters: { state: "Results arrived, nothing moved" },
  args: { arrivals: ARRIVALS, arrivalsAt: "11:47" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText("3 results arrived at 11:47 — nothing moved.")).toBeTruthy();

    // The claim, asserted: the rows are still in the caller's order and the
    // arrivals are nowhere in the table.
    const rows = canvas.getAllByRole("row");
    expect(rows[1]?.textContent).toContain("Novak, K.");
    expect(rows).toHaveLength(CASELOAD.length + 1);
  },
};

export const Reading: Story = {
  name: "The row the reader is on",
  parameters: { state: "The row the reader is on" },
  args: {
    identify: (row: CaseloadRow) => ({ primary: row.name, secondary: `MRN ${row.mrn}` }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [cell] = canvas.getAllByRole("gridcell");
    if (!cell) throw new Error("the grid rendered no cells");
    await userEvent.click(cell);

    // The identity line names the row at the point of action. Acting on the
    // wrong row is the retract-and-reorder error, and re-stating the
    // identifier where the action happens is the intervention that reduces it.
    expect(canvas.getByText("Row 1 of 312 — Novak, K., MRN 5518203.")).toBeTruthy();

    // Arrow down moves the cursor and the line follows it.
    await userEvent.keyboard("{ArrowDown}");
    expect(canvas.getByText("Row 2 of 312 — Adeyemi, R., MRN 4471902.")).toBeTruthy();
  },
};

export const Compact: Story = {
  name: "Compact density",
  parameters: { state: "Compact density" },
  args: { density: "compact" },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('[data-ox-density="compact"]')).toBeTruthy();
  },
};

export const Everything: Story = {
  name: "Everything, with nothing hidden",
  parameters: { state: "Everything, with nothing hidden" },
  args: {
    coverage: { shown: CASELOAD.length, total: CASELOAD.length, noun: "referrals" },
    note: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The escape hatch, and the reason `coverage` can stay required: a caller
    // who genuinely has everything says so in one line rather than lying.
    expect(canvas.getByText(/All 6 referrals\./)).toBeTruthy();
  },
};

export const Selected: Story = {
  name: "Selected, with the verbs that reach them",
  parameters: { state: "Selected, with the verbs that reach them" },
  args: {
    selectedKeys: ["4471902", "3320145"],
    onSelectionChange: () => {},
    identify: (row: CaseloadRow) => ({ primary: row.name, secondary: `MRN ${row.mrn}` }),
    bulkActions: () => (
      <>
        <button type="button">Assign clinician</button>
        <button type="button">Schedule contact</button>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole("region", { name: "Selection actions" });
    expect(bar.textContent).toContain("2 rows selected");

    // Select-all covers the page, and says so. A checkbox that silently meant
    // 312 rows nobody has looked at is how a bulk action reaches a chart.
    expect(canvas.getByRole("checkbox", { name: /Select all 6 rows on this page/ })).toBeTruthy();
    // And every row checkbox is named after its client, not its position.
    expect(canvas.getByRole("checkbox", { name: "Select Adeyemi, R." })).toBeTruthy();
  },
};

export const Pinned: Story = {
  name: "Pinned identity, scrolled sideways",
  parameters: { state: "Pinned identity, scrolled sideways" },
  args: { pinnedColumns: 1, maxHeight: "18rem" },
  play: async ({ canvasElement }) => {
    // Scrolled right with no name in view, every row is the same row — which
    // is the wrong-patient error with the grid holding the door open.
    const pinned = canvasElement.querySelectorAll(".ox-grid__pin");
    expect(pinned.length).toBeGreaterThan(0);
  },
};

export const LoadingMore: Story = {
  name: "Loading more, and the end of what is known",
  parameters: { state: "Loading more, and the end of what is known" },
  args: { onReachEnd: () => {}, loadingMore: true, maxHeight: "18rem" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A sentence, not a spinner — and the noun comes from `coverage`, so the
    // grid says "clients" rather than "records" without being told twice.
    expect(canvas.getByRole("status").textContent).toContain("Loading more");
  },
};

export const HostFramed: Story = {
  name: "Framed by the host, not by itself",
  parameters: { state: "Framed by the host, not by itself" },
  args: { masthead: false, footer: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Both blocks gone — an application screen that already names the list and
    // its predicate should not be told either thing twice.
    expect(canvas.queryByText(/Showing/)).toBeNull();
    // And the grid is still named, by `caption`, with nothing drawn for it.
    expect(canvas.getByRole("grid")).toHaveAccessibleName(/caseload/i);
  },
};

export const Empty: Story = {
  name: "The predicate matched nobody",
  parameters: { state: "The predicate matched nobody" },
  args: { rows: [], coverage: { shown: 0, total: 0, noun: "clients" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Said inside the grid, so the headers a reader needs to widen the filter
    // or drop the sort are still on screen.
    expect(canvas.getByRole("status").textContent).toBe("No clients match.");
    expect(canvas.getAllByRole("columnheader").length).toBeGreaterThan(0);
  },
};

export const Refused: Story = {
  name: "Too many rows to render honestly",
  parameters: { state: "Too many rows to render honestly" },
  args: {
    ceiling: 4,
    coverage: { shown: CASELOAD.length, total: 1438, noun: "patients" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Not an error state. The grid was asked to hold more than it can render
    // honestly and says what to do instead.
    expect(canvas.getByRole("status").textContent).toContain("the ceiling is 4");
    expect(canvas.queryByRole("grid")).toBeNull();
  },
};
