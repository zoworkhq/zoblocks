/**
 * DataGrid — the claims, not the render.
 *
 * Every failure this component exists to prevent looks fine on screen. A grid
 * that reports the page size as the cohort total, sorts four awaited results
 * above a potassium of 3.2, moves a row out from under a keyboard cursor, or
 * exports a name beginning `=cmd|` all render perfectly and pass a snapshot.
 * So the assertions below are the claims themselves, in words, in the output —
 * and the engine ones run with no DOM at all, because that is where they are
 * cheapest to keep true.
 */

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectStatedInWords, itMeetsTheContract } from "../../../test/contract";
import { DataGrid, type DataGridColumn } from "./data-grid";
import {
  ARRIVALS,
  EARLY_WARNING,
  UNKNOWN_TOTAL_COVERAGE,
  WARD,
  WARD_COLUMNS,
  WARD_COVERAGE,
  WARD_WITH_EVERY_ABSENCE,
  type WardRow,
} from "./data-grid.fixtures";
import {
  compareGridValues,
  describeGridCoverage,
  describeGridIdentity,
  gridCapacityRefusal,
  gridUnseenCount,
  localGridCoverage,
  moveGridCursor,
  neutraliseGridCell,
  nextGridSort,
  sortGridRows,
  toGridDelimited,
  type GridColumnSpec,
} from "@/lib/oxygen-grid";

const COLUMNS = WARD_COLUMNS as DataGridColumn<WardRow>[];

const base = {
  caption: "Patients on 4-West with a potassium outside the reference range",
  title: "Worklist · 4-West",
  columns: COLUMNS,
  rows: WARD,
  rowKey: (row: WardRow) => row.mrn,
} as const;

itMeetsTheContract("DataGrid", () => <DataGrid {...base} coverage={WARD_COVERAGE} />);

/* ------------------------------------------------------------------ */
/* Coverage                                                            */
/* ------------------------------------------------------------------ */

describe("the claim about the population", () => {
  it("states what is on screen out of what, above the rows", () => {
    const view = render(<DataGrid {...base} coverage={WARD_COVERAGE} />);
    expectStatedInWords(view, /6 of 1,438 patients in the cohort\./);
    expectStatedInWords(view, /potassium outside the reference range in the last 24 hours\./);
  });

  it("counts what the reader cannot see", () => {
    render(<DataGrid {...base} coverage={WARD_COVERAGE} />);
    expect(screen.getByText(/1,432 not shown by this filter\./)).toBeTruthy();
  });

  it("says the source would not give a total rather than inventing one", () => {
    // The failure mode this replaces: rendering `rows.length` as the total, so
    // a page of six reads as a cohort of six.
    render(<DataGrid {...base} coverage={UNKNOWN_TOTAL_COVERAGE} />);
    expect(screen.getByText(/The source did not say how many match\./)).toBeTruthy();
    expect(screen.queryByText(/not shown by this filter/)).toBeNull();
  });

  it("counts the cohort in aria-rowcount, and admits when it cannot", () => {
    const { unmount } = render(<DataGrid {...base} coverage={WARD_COVERAGE} />);
    // 1,438 rows plus the header row: what a screen reader reads out.
    expect(screen.getByRole("grid").getAttribute("aria-rowcount")).toBe("1439");
    unmount();

    render(<DataGrid {...base} coverage={UNKNOWN_TOTAL_COVERAGE} />);
    expect(screen.getByRole("grid").getAttribute("aria-rowcount")).toBe("-1");
  });

  it("has a one-line escape hatch for a caller who genuinely has everything", () => {
    expect(describeGridCoverage(localGridCoverage(WARD, "referrals"))).toBe("All 6 referrals.");
    expect(gridUnseenCount(localGridCoverage(WARD))).toBe(0);
    expect(gridUnseenCount(UNKNOWN_TOTAL_COVERAGE)).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Absence                                                             */
/* ------------------------------------------------------------------ */

describe("absence is a value, not a hole", () => {
  it("says which kind of missing, in words", () => {
    render(
      <DataGrid {...base} rows={WARD_WITH_EVERY_ABSENCE} coverage={{ shown: 8, total: 1438 }} />,
    );
    for (const word of ["Awaiting", "Restricted", "Not recorded", "Declined"]) {
      expect(screen.getByText(word), word).toBeTruthy();
    }
    // The em dash this replaces cannot distinguish any of them.
    expect(screen.queryByText("—")).toBeNull();
  });

  it("explains each reason in a numbered footnote, once", () => {
    render(
      <DataGrid {...base} rows={WARD_WITH_EVERY_ABSENCE} coverage={{ shown: 8, total: 1438 }} />,
    );
    expect(screen.getByText(/A value exists and is not available to you\./)).toBeTruthy();
    // De-duplicated by reason: two restricted rows do not make two footnotes.
    expect(screen.getAllByText(/A value exists and is not available to you\./)).toHaveLength(1);
  });

  it("never lets a caller's renderer draw over an absence", () => {
    // The renderer below would print an em dash for every row. It is not
    // reached for an absent value, which is the point of drawing absence in
    // the grid rather than in caller code.
    const columns: DataGridColumn<WardRow>[] = [
      { key: "name", header: "Patient", kind: "text", value: (row) => row.name },
      {
        key: "potassium",
        header: "Potassium",
        kind: "measure",
        value: (row) => row.potassium,
        cell: () => <span>—</span>,
      },
    ];
    render(<DataGrid {...base} columns={columns} coverage={WARD_COVERAGE} />);
    expect(screen.getByText("Awaiting")).toBeTruthy();
    expect(screen.getByText("Restricted")).toBeTruthy();
  });

  it("sorts an absence last in both directions", () => {
    // The load-bearing assertion in the file. Ascending with absence treated
    // as zero puts four awaited results above a potassium of 3.2, which tells
    // a reader the sickest patient on the ward is fine.
    const potassium = COLUMNS.find((column) => column.key === "potassium")!;

    const up = sortGridRows(WARD, potassium, "ascending").map((row) => row.potassium);
    expect(up.slice(0, 4)).toEqual([3.2, 4.1, 5.4, 6.8]);
    expect(up.slice(4).every((value) => typeof value === "object")).toBe(true);

    const down = sortGridRows(WARD, potassium, "descending").map((row) => row.potassium);
    expect(down.slice(0, 4)).toEqual([6.8, 5.4, 4.1, 3.2]);
    expect(down.slice(4).every((value) => typeof value === "object")).toBe(true);
  });

  it("compares identifiers as text, because 044 and 44 are two patients", () => {
    expect(compareGridValues("044", "44", "identifier")).toBeLessThan(0);
    expect(compareGridValues("44", "044", "identifier")).toBeGreaterThan(0);
    // A number column does the opposite, correctly.
    expect(compareGridValues(9, 10, "number")).toBeLessThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* Sorting is a clinical act                                           */
/* ------------------------------------------------------------------ */

describe("sorting by a model is ranking a prediction", () => {
  it("names the model, its version and the population under the table", () => {
    render(
      <DataGrid
        {...base}
        coverage={WARD_COVERAGE}
        defaultSort={{ key: "risk", direction: "descending" }}
      />,
    );
    expect(
      screen.getByText(
        /early-warning v2\.4, validated on 12,410 med-surg admissions, adults only\./,
      ),
    ).toBeTruthy();
  });

  it("cites the note rather than printing the derivation twice", () => {
    render(
      <DataGrid
        {...base}
        coverage={WARD_COVERAGE}
        defaultSort={{ key: "risk", direction: "descending" }}
      />,
    );
    expect(screen.getByText(/Sorted by a derived column — this ranks a prediction\./)).toBeTruthy();
    // One canonical statement of the model on the page. Two is how a reader
    // ends up unsure whether they are looking at two different models.
    expect(
      screen.getAllByText(/early-warning v2\.4, validated on 12,410 med-surg admissions/),
    ).toHaveLength(1);
  });

  it("marks the derived column with a footnote even before it is sorted", () => {
    // The derivation is a property of the column, not of the sort. A reader
    // scanning the numbers has to know what they are whether or not anybody
    // clicked.
    render(<DataGrid {...base} coverage={WARD_COVERAGE} />);
    expect(screen.getByText(/is model output, not an observation\./)).toBeTruthy();
    expect(screen.queryByText(/Sorted by a derived column\./)).toBeNull();
  });

  it("does not sort by anything until asked", () => {
    render(<DataGrid {...base} coverage={WARD_COVERAGE} />);
    // The caller's own order is arrival order, which carries information no
    // column does. A grid that boots pre-sorted by a model column has made
    // the clinical act before anybody asked for it.
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("Novak, K.");
  });

  it("goes worst-first for a quantity and A–Z for words", () => {
    const risk: GridColumnSpec<WardRow> = { ...COLUMNS[3]!, derived: EARLY_WARNING };
    expect(nextGridSort(null, risk)).toEqual({ key: "risk", direction: "descending" });

    const name = COLUMNS[0]!;
    expect(nextGridSort(null, name)).toEqual({ key: "name", direction: "ascending" });
  });

  it("offers a way back to the caller's order on the third activation", () => {
    const risk = COLUMNS[3]!;
    const one = nextGridSort(null, risk)!;
    const two = nextGridSort(one, risk)!;
    expect(two.direction).toBe("ascending");
    expect(nextGridSort(two, risk)).toBeNull();
  });

  it("sorts from the keyboard, because the header is in the tab sequence", async () => {
    const user = userEvent.setup();
    render(<DataGrid {...base} coverage={WARD_COVERAGE} />);

    const header = screen.getByRole("columnheader", { name: /Deterioration risk/ });
    const button = within(header).getByRole("button");
    button.focus();
    await user.keyboard("{Enter}");

    expect(header.getAttribute("aria-sort")).toBe("descending");
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("Adeyemi, R.");
  });

  it("reports sort state to a screen reader on every sortable column", () => {
    render(<DataGrid {...base} coverage={WARD_COVERAGE} />);
    const headers = screen.getAllByRole("columnheader");
    expect(headers.every((header) => header.hasAttribute("aria-sort"))).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Live data                                                           */
/* ------------------------------------------------------------------ */

describe("nothing moves under the hand", () => {
  it("counts what arrived and leaves the table alone", () => {
    render(<DataGrid {...base} coverage={WARD_COVERAGE} arrivals={ARRIVALS} arrivalsAt="11:47" />);
    expect(screen.getByText("3 results arrived at 11:47 — nothing moved.")).toBeTruthy();
    // Six rows plus the header: the arrivals are counted, not inserted.
    expect(screen.getAllByRole("row")).toHaveLength(WARD.length + 1);
  });

  it("announces arrivals politely, so the announcement never coincides with movement", () => {
    render(<DataGrid {...base} coverage={WARD_COVERAGE} arrivals={ARRIVALS} />);
    const line = screen.getByText(/nothing moved\./);
    expect(line.getAttribute("aria-live")).toBe("polite");
  });

  it("hands the arrivals back rather than merging them itself", async () => {
    const user = userEvent.setup();
    const admit = vi.fn();
    render(
      <DataGrid {...base} coverage={WARD_COVERAGE} arrivals={ARRIVALS} onAdmitArrivals={admit} />,
    );
    await user.click(screen.getByRole("button", { name: /let them in/i }));
    expect(admit).toHaveBeenCalledWith(ARRIVALS);
  });

  it("keeps the cursor on the row it was on when the order changes", async () => {
    // The whole claim, at the level of one cell. A cursor stored as a pair of
    // indices lands on a different patient the moment anything re-sorts, and
    // the reader's next keystroke acts on somebody they never selected.
    const user = userEvent.setup();
    const view = render(<DataGrid {...base} coverage={WARD_COVERAGE} sort={null} />);

    const cell = within(screen.getAllByRole("row")[2]!).getAllByRole("gridcell")[0]!;
    expect(cell.textContent).toContain("Adeyemi, R.");
    await user.click(cell);
    expect(document.activeElement).toBe(cell);

    // The caller re-sorts under the reader. Adeyemi moves from row 2 to row 1.
    view.rerender(
      <DataGrid
        {...base}
        coverage={WARD_COVERAGE}
        sort={{ key: "risk", direction: "descending" }}
      />,
    );
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("Adeyemi, R.");

    // Both the focus and the single tab stop went with the patient, not with
    // the position.
    expect((document.activeElement as HTMLElement).closest("tr")?.textContent).toContain(
      "Adeyemi, R.",
    );
    const stop = document.querySelector<HTMLElement>('[data-ox-cell][tabindex="0"]');
    expect(stop?.closest("tr")?.textContent).toContain("Adeyemi, R.");
  });
});

/* ------------------------------------------------------------------ */
/* Row identity                                                        */
/* ------------------------------------------------------------------ */

describe("the row identity is re-stated where the action is", () => {
  it("names the focused row, with its identifier", async () => {
    const user = userEvent.setup();
    render(
      <DataGrid
        {...base}
        coverage={WARD_COVERAGE}
        identify={(row) => ({ primary: row.name, secondary: `MRN ${row.mrn}` })}
      />,
    );
    await user.click(screen.getAllByRole("gridcell")[0]!);
    expect(screen.getByText("Row 1 of 1,438 — Novak, K., MRN 5518203.")).toBeTruthy();
  });

  it("never names a masked record", () => {
    // The menu rule, applied here: a surface may say less than the row it came
    // from; it may never say more.
    expect(
      describeGridIdentity(
        { primary: "Adeyemi, R.", secondary: "MRN 4471902", masked: true },
        {
          row: 1,
          of: 1438,
        },
      ),
    ).toBe("Row 1 of 1,438 — restricted record.");
  });

  it("does not claim a position out of a total it does not have", () => {
    expect(describeGridIdentity({ primary: "Adeyemi, R." }, { row: 3, of: "unknown" })).toBe(
      "Row 3 — Adeyemi, R.",
    );
  });
});

/* ------------------------------------------------------------------ */
/* Keyboard                                                            */
/* ------------------------------------------------------------------ */

describe("a real grid, not a table with a click handler", () => {
  it("states its roles, and indexes every cell", () => {
    render(<DataGrid {...base} coverage={WARD_COVERAGE} />);
    const grid = screen.getByRole("grid");
    expect(grid.getAttribute("aria-colcount")).toBe("5");

    const rows = screen.getAllByRole("row");
    // Header is ARIA row 1; the first body row is 2.
    expect(rows[0]?.getAttribute("aria-rowindex")).toBe("1");
    expect(rows[1]?.getAttribute("aria-rowindex")).toBe("2");

    const cells = within(rows[1]!).getAllByRole("gridcell");
    expect(cells.map((cell) => cell.getAttribute("aria-colindex"))).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
  });

  it("moves one cell at a time, and clamps at the edges", () => {
    const bounds = { rows: 6, columns: 5 };
    expect(moveGridCursor({ row: 0, column: 0 }, "ArrowRight", bounds)).toEqual({
      row: 0,
      column: 1,
    });
    expect(moveGridCursor({ row: 0, column: 0 }, "ArrowLeft", bounds)).toEqual({
      row: 0,
      column: 0,
    });
    expect(moveGridCursor({ row: 5, column: 0 }, "ArrowDown", bounds)).toEqual({
      row: 5,
      column: 0,
    });
  });

  it("reaches the header by going up from the first row", () => {
    // Row -1 is the header. A keyboard user who cannot reach it cannot sort.
    expect(moveGridCursor({ row: 0, column: 2 }, "ArrowUp", { rows: 6, columns: 5 })).toEqual({
      row: -1,
      column: 2,
    });
  });

  it("takes Ctrl+Home to the header and Ctrl+End to the last cell", () => {
    const bounds = { rows: 6, columns: 5 };
    expect(moveGridCursor({ row: 3, column: 3 }, "Home", bounds, { ctrl: true })).toEqual({
      row: -1,
      column: 0,
    });
    expect(moveGridCursor({ row: 3, column: 3 }, "End", bounds, { ctrl: true })).toEqual({
      row: 5,
      column: 4,
    });
    // Without the modifier, Home and End stay on the row.
    expect(moveGridCursor({ row: 3, column: 3 }, "Home", bounds)).toEqual({ row: 3, column: 0 });
  });

  it("returns null for a key it does not handle, so the page still scrolls", () => {
    expect(moveGridCursor({ row: 0, column: 0 }, "Tab", { rows: 6, columns: 5 })).toBeNull();
    expect(moveGridCursor({ row: 0, column: 0 }, "a", { rows: 6, columns: 5 })).toBeNull();
  });

  it("navigates the rendered grid with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<DataGrid {...base} coverage={WARD_COVERAGE} />);

    await user.click(screen.getAllByRole("gridcell")[0]!);
    await user.keyboard("{ArrowRight}{ArrowDown}");

    const focused = document.activeElement as HTMLElement;
    expect(focused.getAttribute("aria-colindex")).toBe("2");
    expect(focused.textContent).toBe("4471902");
  });

  it("keeps exactly one cell in the tab sequence", async () => {
    const user = userEvent.setup();
    render(<DataGrid {...base} coverage={WARD_COVERAGE} />);
    await user.click(screen.getAllByRole("gridcell")[0]!);

    const reachable = Array.from(document.querySelectorAll<HTMLElement>("[data-ox-cell]")).filter(
      (cell) => cell.getAttribute("tabindex") === "0",
    );
    expect(reachable).toHaveLength(1);
  });

  it("activates a row on Enter", async () => {
    const user = userEvent.setup();
    const activate = vi.fn();
    render(<DataGrid {...base} coverage={WARD_COVERAGE} onRowActivate={activate} />);

    await user.click(screen.getAllByRole("gridcell")[0]!);
    await user.keyboard("{Enter}");
    expect(activate).toHaveBeenCalledWith(WARD[0]);
  });
});

/* ------------------------------------------------------------------ */
/* The rest of the surface                                             */
/* ------------------------------------------------------------------ */

/*
 * Seven behaviours that shipped with no test, found by reading the branch
 * coverage rather than by reading the diff — which is the point of running it.
 * Each is a prop somebody can set today and a path nothing was exercising.
 */
describe("the parts of the API nothing was exercising", () => {
  it("leaves a column out of the sort when it says so", async () => {
    const user = userEvent.setup();
    const columns: DataGridColumn<WardRow>[] = [
      { key: "name", header: "Patient", kind: "text", value: (row) => row.name },
      { key: "mrn", header: "MRN", kind: "identifier", value: (row) => row.mrn, sortable: false },
    ];
    render(<DataGrid {...base} columns={columns} coverage={WARD_COVERAGE} />);

    const header = screen.getByRole("columnheader", { name: "MRN" });
    // No button, so nothing to press — and no aria-sort, because "none" would
    // announce it as a sortable column that happens to be unsorted.
    expect(within(header).queryByRole("button")).toBeNull();
    expect(header.hasAttribute("aria-sort")).toBe(false);

    // The sortable one still is.
    const patient = screen.getByRole("columnheader", { name: /Patient/ });
    expect(patient.getAttribute("aria-sort")).toBe("none");
    await user.click(within(patient).getByRole("button"));
    expect(patient.getAttribute("aria-sort")).toBe("ascending");
  });

  it("shows the direction it is sorted in, both ways", async () => {
    const user = userEvent.setup();
    render(<DataGrid {...base} coverage={WARD_COVERAGE} />);
    const header = screen.getByRole("columnheader", { name: /Patient/ });
    const button = within(header).getByRole("button");

    // Text sorts A–Z first, so this is the ascending glyph.
    await user.click(button);
    expect(button.textContent).toContain("↑");
    await user.click(button);
    expect(button.textContent).toContain("↓");
  });

  it("hands the sort to the caller and renders nothing without it", async () => {
    // Controlled: the grid reports and does not decide. A component that also
    // re-sorted itself would fight whatever the caller did with the event.
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<DataGrid {...base} coverage={WARD_COVERAGE} sort={null} onSortChange={onSortChange} />);
    await user.click(
      within(screen.getByRole("columnheader", { name: /Patient/ })).getByRole("button"),
    );

    expect(onSortChange).toHaveBeenCalledWith({ key: "name", direction: "ascending" });
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("Novak, K.");
  });

  it("says Yes and No rather than true and false", () => {
    // `[object Object]` and a bare `true` are both the contract suite's
    // definition of a value reaching the screen that should have been handled.
    const columns: DataGridColumn<WardRow>[] = [
      { key: "name", header: "Patient", kind: "text", value: (row) => row.name },
      { key: "flag", header: "On a hold", value: (row) => row.mrn === "4471902" },
    ];
    render(<DataGrid {...base} columns={columns} coverage={WARD_COVERAGE} />);
    expect(screen.getAllByText("Yes")).toHaveLength(1);
    expect(screen.getAllByText("No")).toHaveLength(WARD.length - 1);
  });

  it("draws no foot at all when there is nothing to put in it", () => {
    // The rule that keeps a bare grid from closing with a 2px rule under it and
    // nothing beneath — which reads as a rendering fault rather than restraint.
    const columns: DataGridColumn<WardRow>[] = [
      { key: "name", header: "Patient", kind: "text", value: (row) => row.name },
    ];
    const { container } = render(
      <DataGrid
        {...base}
        columns={columns}
        rows={WARD.slice(0, 2)}
        coverage={{ shown: 2, total: 2 }}
      />,
    );
    expect(container.querySelector(".ox-grid__foot")).toBeNull();

    // One derived column is enough to bring it back.
    cleanup();
    render(<DataGrid {...base} coverage={WARD_COVERAGE} />);
    expect(document.querySelector(".ox-grid__foot")).toBeTruthy();
  });

  it("honours an explicit alignment over the one its kind implies", () => {
    // The escape hatch a measured value with a qualifier word beside it needs:
    // right-aligning the pair lines up the words and leaves the numbers ragged.
    const columns: DataGridColumn<WardRow>[] = [
      { key: "name", header: "Patient", kind: "text", value: (row) => row.name },
      {
        key: "potassium",
        header: "Potassium",
        kind: "measure",
        align: "start",
        value: (row) => row.potassium,
      },
    ];
    render(<DataGrid {...base} columns={columns} coverage={WARD_COVERAGE} />);
    const cell = within(screen.getAllByRole("row")[1]!).getAllByRole("gridcell")[1]!;
    expect(cell.className).toContain("ox-grid__td--start");
    expect(cell.className).not.toContain("ox-grid__td--end");
  });

  it("falls back to the header when the focused row is no longer there", async () => {
    // Not a hypothetical: a worklist row disappears when the filter behind it
    // moves. The cursor goes to the header rather than to whoever inherited the
    // position, which is the whole reason it is a key and not an index.
    const user = userEvent.setup();
    const view = render(<DataGrid {...base} coverage={WARD_COVERAGE} />);
    await user.click(within(screen.getAllByRole("row")[2]!).getAllByRole("gridcell")[0]!);

    view.rerender(
      <DataGrid
        {...base}
        rows={WARD.filter((row) => row.mrn !== "4471902")}
        coverage={WARD_COVERAGE}
      />,
    );

    const stops = [...document.querySelectorAll('[data-ox-cell][tabindex="0"]')];
    expect(stops).toHaveLength(1);
    expect(stops[0]?.closest("thead")).not.toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Capacity                                                            */
/* ------------------------------------------------------------------ */

describe("it refuses rather than degrading", () => {
  it("renders honestly under the ceiling and refuses over it", () => {
    expect(gridCapacityRefusal(18_000)).toBeNull();
    expect(gridCapacityRefusal(120_000)).toContain("the ceiling is 20,000");
    expect(gridCapacityRefusal(120_000)).toContain("move paging to the server");
  });

  it("says so on the surface, as a status rather than an error", () => {
    render(<DataGrid {...base} coverage={WARD_COVERAGE} ceiling={4} />);
    // Not an error: the grid was asked for more than it can render honestly
    // and is saying what to do instead.
    expect(screen.getByRole("status").textContent).toContain("the ceiling is 4");
    expect(screen.queryByRole("grid")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

describe("an export is an attack surface", () => {
  it("neutralises every character a spreadsheet treats as a formula", () => {
    for (const payload of ["=cmd|' /C calc'!A0", "+1+1", "-2+3", "@SUM(A1)", "\tSUM", "\rSUM"]) {
      expect(neutraliseGridCell(payload).startsWith("'"), payload).toBe(true);
    }
  });

  it("neutralises the full-width forms, which Excel normalises in some locales", () => {
    // The reason a naive filter for "=" is not enough, and the reason this is
    // in the writer rather than left to the caller.
    for (const payload of ["＝cmd", "＋1", "－2", "＠SUM(A1)"]) {
      expect(neutraliseGridCell(payload).startsWith("'"), payload).toBe(true);
    }
  });

  it("leaves an ordinary name alone", () => {
    expect(neutraliseGridCell("Ade-Smith, R.")).toBe("Ade-Smith, R.");
    expect(neutraliseGridCell("4471902")).toBe("4471902");
  });

  it("carries the coverage sentence and the provenance into the file", () => {
    // An export outlives the screen it came from. A spreadsheet of six
    // patients with no record that 1,432 others matched the same filter is
    // the same lie as the grid without a coverage line, in somebody's inbox.
    const csv = toGridDelimited(WARD, WARD_COLUMNS, { coverage: WARD_COVERAGE });
    const lines = csv.split("\r\n");
    expect(lines[0]).toContain("6 of 1,438 patients in the cohort.");
    expect(lines[1]).toContain("is model output, not an observation.");
    expect(lines[2]).toBe("Patient,MRN,Potassium,Deterioration risk,Next due");
  });

  it("writes an absence as its word rather than as a blank cell", () => {
    // A blank in a spreadsheet is indistinguishable from a value nobody typed.
    const csv = toGridDelimited(WARD, WARD_COLUMNS, {});
    expect(csv).toContain("Awaiting");
    expect(csv).toContain("Restricted");
  });

  it("quotes a field containing the delimiter", () => {
    const columns: GridColumnSpec<{ note: string }>[] = [
      { key: "note", header: "Note", value: (row) => row.note },
    ];
    const csv = toGridDelimited([{ note: 'Okonkwo, A. said "no"' }], columns, {});
    expect(csv).toContain('"Okonkwo, A. said ""no"""');
  });
});
