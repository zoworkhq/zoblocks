/**
 * DataGrid — the claims, not the render.
 *
 * Every failure this component exists to prevent looks fine on screen. A grid
 * that reports the page size as the cohort total, sorts four awaited results
 * above a phq9 of 3.2, moves a row out from under a keyboard cursor, or
 * exports a name beginning `=cmd|` all render perfectly and pass a snapshot.
 * So the assertions below are the claims themselves, in words, in the output —
 * and the engine ones run with no DOM at all, because that is where they are
 * cheapest to keep true.
 */

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectStatedInWords, itMeetsTheContract } from "../../../test/contract";
import { DataGrid, type DataGridColumn } from "./data-grid";
import {
  ARRIVALS,
  DISENGAGEMENT,
  UNKNOWN_TOTAL_COVERAGE,
  CASELOAD,
  CASELOAD_COLUMNS,
  CASELOAD_COVERAGE,
  CASELOAD_WITH_EVERY_ABSENCE,
  type CaseloadRow,
} from "./data-grid.fixtures";
import {
  compareGridValues,
  describeGridCoverage,
  describeGridLoaded,
  describeGridSelection,
  describeGridIdentity,
  gridCapacityRefusal,
  gridSelectionState,
  shouldLoadMoreGridRows,
  gridUnseenCount,
  localGridCoverage,
  moveGridCursor,
  neutraliseGridCell,
  nextGridSort,
  sortGridRows,
  toGridDelimited,
  toggleAllGridSelection,
  toggleGridSelection,
  type GridColumnSpec,
  type GridValue,
} from "@/lib/zoblocks-grid";

const COLUMNS = CASELOAD_COLUMNS as DataGridColumn<CaseloadRow>[];

const base = {
  caption: "Clients on this team's caseload with a raised PHQ-9 or a recent risk screen",
  title: "Caseload · adult outpatient",
  columns: COLUMNS,
  rows: CASELOAD,
  rowKey: (row: CaseloadRow) => row.mrn,
} as const;

itMeetsTheContract("DataGrid", () => <DataGrid {...base} coverage={CASELOAD_COVERAGE} />);

/* ------------------------------------------------------------------ */
/* Coverage                                                            */
/* ------------------------------------------------------------------ */

describe("the claim about the population", () => {
  it("states what is on screen out of what, above the rows", () => {
    const view = render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);
    expectStatedInWords(view, /6 of 312 clients on this team's caseload\./);
    expectStatedInWords(view, /a risk screen in the last 14 days\./);
  });

  it("counts what the reader cannot see", () => {
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);
  });

  it("says the source would not give a total rather than inventing one", () => {
    // The failure mode this replaces: rendering `rows.length` as the total, so
    // a page of six reads as a cohort of six.
    render(<DataGrid {...base} coverage={UNKNOWN_TOTAL_COVERAGE} />);
    expect(screen.getByText(/The source did not say how many match\./)).toBeTruthy();
  });

  it("counts the cohort in aria-rowcount, and admits when it cannot", () => {
    const { unmount } = render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);
    // 312 rows plus the header row: what a screen reader reads out.
    expect(screen.getByRole("grid").getAttribute("aria-rowcount")).toBe("313");
    unmount();

    render(<DataGrid {...base} coverage={UNKNOWN_TOTAL_COVERAGE} />);
    expect(screen.getByRole("grid").getAttribute("aria-rowcount")).toBe("-1");
  });

  it("has a one-line escape hatch for a caller who genuinely has everything", () => {
    expect(describeGridCoverage(localGridCoverage(CASELOAD, "referrals"))).toBe("All 6 referrals.");
    expect(gridUnseenCount(localGridCoverage(CASELOAD))).toBe(0);
    expect(gridUnseenCount(UNKNOWN_TOTAL_COVERAGE)).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Absence                                                             */
/* ------------------------------------------------------------------ */

describe("absence is a value, not a hole", () => {
  it("says which kind of missing, in words", () => {
    render(
      <DataGrid {...base} rows={CASELOAD_WITH_EVERY_ABSENCE} coverage={{ shown: 8, total: 312 }} />,
    );
    // `getAllBy`, because Lindqvist's row is restricted in two columns — the
    // PHQ-9 and the risk screen are one Part 2 record between them.
    for (const word of ["Awaiting", "Restricted", "Not recorded", "Declined"]) {
      expect(screen.getAllByText(word).length, word).toBeGreaterThan(0);
    }
    // The em dash this replaces cannot distinguish any of them.
    expect(screen.queryByText("—")).toBeNull();
  });

  it("explains each reason in a numbered footnote, once", () => {
    render(
      <DataGrid {...base} rows={CASELOAD_WITH_EVERY_ABSENCE} coverage={{ shown: 8, total: 312 }} />,
    );
    expect(screen.getByText(/Part 2 record — not available to you\./)).toBeTruthy();
    // De-duplicated by reason: the two restricted cells on Lindqvist's row —
    // the PHQ-9 and the risk screen, both Part 2 — make one footnote, not two.
    expect(screen.getAllByText(/Part 2 record — not available to you\./)).toHaveLength(1);
  });

  it("never lets a caller's renderer draw over an absence", () => {
    // The renderer below would print an em dash for every row. It is not
    // reached for an absent value, which is the point of drawing absence in
    // the grid rather than in caller code.
    const columns: DataGridColumn<CaseloadRow>[] = [
      { key: "name", header: "Client", kind: "text", value: (row) => row.name },
      {
        key: "phq9",
        header: "PHQ-9",
        kind: "measure",
        value: (row) => row.phq9,
        cell: () => <span>—</span>,
      },
    ];
    render(<DataGrid {...base} columns={columns} coverage={CASELOAD_COVERAGE} />);
    expect(screen.getByText("Awaiting")).toBeTruthy();
    expect(screen.getByText("Restricted")).toBeTruthy();
  });

  it("sorts an absence last in both directions", () => {
    // The load-bearing assertion in the file. Ascending with absence treated
    // as zero puts four awaited results above a phq9 of 3.2, which tells
    // a reader the sickest patient on the ward is fine.
    const phq9 = COLUMNS.find((column) => column.key === "phq9")!;

    const up = sortGridRows(CASELOAD, phq9, "ascending").map((row) => row.phq9);
    expect(up.slice(0, 4)).toEqual([7, 11, 18, 22]);
    expect(up.slice(4).every((value) => typeof value === "object")).toBe(true);

    const down = sortGridRows(CASELOAD, phq9, "descending").map((row) => row.phq9);
    expect(down.slice(0, 4)).toEqual([22, 18, 11, 7]);
    expect(down.slice(4).every((value) => typeof value === "object")).toBe(true);
  });

  it("compares identifiers as text, because 044 and 44 are two patients", () => {
    expect(compareGridValues("044", "44", "identifier")).toBeLessThan(0);
    expect(compareGridValues("44", "044", "identifier")).toBeGreaterThan(0);
    // A number column does the opposite, correctly.
    expect(compareGridValues(9, 10, "number")).toBeLessThan(0);
  });

  it("sorts a result with a comparator by its number, never as NaN", () => {
    // eGFR ">90" and troponin "<0.01" are strings; `Number(">90")` is NaN, and
    // a NaN comparator left a critical value wherever it happened to land.
    type Lab = { id: string; value: GridValue };
    const column: GridColumnSpec<Lab> = {
      key: "value",
      header: "Result",
      kind: "measure",
      value: (row) => row.value,
    };
    const rows: Lab[] = [
      { id: "haemolysed", value: "haemolysed" },
      { id: "gt90", value: ">90" },
      { id: "absent", value: { absent: "awaiting" } },
      { id: "n45", value: 45 },
      { id: "lt001", value: "<0.01" },
      { id: "n90", value: "90" },
      { id: "ge90", value: ">= 90" },
      { id: "le90", value: "<=90" },
      { id: "lt90", value: "<90" },
      { id: "n0.5", value: 0.5 },
      { id: "nan", value: Number.NaN },
      { id: "empty", value: "" },
      { id: "bool", value: true },
    ];

    const up = sortGridRows(rows, column, "ascending").map((row) => row.id);
    expect(up).toEqual([
      "lt001",
      "n0.5",
      "n45",
      "lt90",
      "le90",
      "n90",
      "ge90",
      "gt90",
      // Text that is not a number sits after numbers in both directions, above
      // absence; among itself it follows the direction like any text.
      "empty",
      "haemolysed",
      "nan",
      "bool",
      "absent",
    ]);

    const down = sortGridRows(rows, column, "descending").map((row) => row.id);
    expect(down).toEqual([
      "gt90",
      "ge90",
      "n90",
      "le90",
      "lt90",
      "n45",
      "n0.5",
      "lt001",
      "bool",
      "nan",
      "haemolysed",
      "empty",
      "absent",
    ]);

    expect(compareGridValues("<0.01", 0.01, "number")).toBeLessThan(0);
    expect(compareGridValues(">90", "90", "number")).toBeGreaterThan(0);
    expect(compareGridValues("90", 90, "number")).toBe(0);
    expect(compareGridValues("haemolysed", 1e9, "number")).toBeGreaterThan(0);
    expect(compareGridValues(1e9, "haemolysed", "number")).toBeLessThan(0);
    expect(Number.isNaN(compareGridValues("x", "y", "measure"))).toBe(false);
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
        coverage={CASELOAD_COVERAGE}
        defaultSort={{ key: "risk", direction: "descending" }}
      />,
    );
    expect(
      screen.getByText(
        /disengagement v1\.8, validated on 9,140 outpatient episodes, adults, English-language intake only\./,
      ),
    ).toBeTruthy();
  });

  it("cites the note rather than printing the derivation twice", () => {
    render(
      <DataGrid
        {...base}
        coverage={CASELOAD_COVERAGE}
        defaultSort={{ key: "risk", direction: "descending" }}
      />,
    );
    expect(screen.getByText(/Sorted by a prediction — see note 1\./)).toBeTruthy();
    // One canonical statement of the model on the page. Two is how a reader
    // ends up unsure whether they are looking at two different models.
    expect(
      screen.getAllByText(/disengagement v1\.8, validated on 9,140 outpatient episodes/),
    ).toHaveLength(1);
  });

  it("marks the derived column with a footnote even before it is sorted", () => {
    // The derivation is a property of the column, not of the sort. A reader
    // scanning the numbers has to know what they are whether or not anybody
    // clicked.
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);
    expect(screen.getByText(/is model output, not an observation\./)).toBeTruthy();
    expect(screen.queryByText(/Sorted by a derived column\./)).toBeNull();
  });

  it("does not sort by anything until asked", () => {
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);
    // The caller's own order is arrival order, which carries information no
    // column does. A grid that boots pre-sorted by a model column has made
    // the clinical act before anybody asked for it.
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("Novak, K.");
  });

  it("goes worst-first for a quantity and A–Z for words", () => {
    const risk: GridColumnSpec<CaseloadRow> = {
      ...COLUMNS.find((column) => column.key === "risk")!,
      derived: DISENGAGEMENT,
    };
    expect(nextGridSort(null, risk)).toEqual({ key: "risk", direction: "descending" });

    const name = COLUMNS[0]!;
    expect(nextGridSort(null, name)).toEqual({ key: "name", direction: "ascending" });
  });

  it("offers a way back to the caller's order on the third activation", () => {
    const risk = COLUMNS.find((column) => column.key === "risk")!;
    const one = nextGridSort(null, risk)!;
    const two = nextGridSort(one, risk)!;
    expect(two.direction).toBe("ascending");
    expect(nextGridSort(two, risk)).toBeNull();
  });

  it("sorts from the keyboard, because the header is in the tab sequence", async () => {
    const user = userEvent.setup();
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);

    const header = screen.getByRole("columnheader", { name: /Disengagement risk/ });
    const button = within(header).getByRole("button");
    button.focus();
    await user.keyboard("{Enter}");

    expect(header.getAttribute("aria-sort")).toBe("descending");
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("Adeyemi, R.");
  });

  it("reports sort state to a screen reader on every sortable column", () => {
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);
    const headers = screen.getAllByRole("columnheader");
    expect(headers.every((header) => header.hasAttribute("aria-sort"))).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Live data                                                           */
/* ------------------------------------------------------------------ */

describe("nothing moves under the hand", () => {
  it("counts what arrived and leaves the table alone", () => {
    render(
      <DataGrid {...base} coverage={CASELOAD_COVERAGE} arrivals={ARRIVALS} arrivalsAt="11:47" />,
    );
    expect(screen.getByText("3 results arrived at 11:47 — nothing moved.")).toBeTruthy();
    // Six rows plus the header: the arrivals are counted, not inserted.
    expect(screen.getAllByRole("row")).toHaveLength(CASELOAD.length + 1);
  });

  it("announces arrivals politely, so the announcement never coincides with movement", () => {
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} arrivals={ARRIVALS} />);
    const line = screen.getByText(/nothing moved\./);
    expect(line.getAttribute("aria-live")).toBe("polite");
  });

  it("hands the arrivals back rather than merging them itself", async () => {
    const user = userEvent.setup();
    const admit = vi.fn();
    render(
      <DataGrid
        {...base}
        coverage={CASELOAD_COVERAGE}
        arrivals={ARRIVALS}
        onAdmitArrivals={admit}
      />,
    );
    await user.click(screen.getByRole("button", { name: /let them in/i }));
    expect(admit).toHaveBeenCalledWith(ARRIVALS);
  });

  it("keeps the cursor on the row it was on when the order changes", async () => {
    // The whole claim, at the level of one cell. A cursor stored as a pair of
    // indices lands on a different patient the moment anything re-sorts, and
    // the reader's next keystroke acts on somebody they never selected.
    const user = userEvent.setup();
    const view = render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} sort={null} />);

    const cell = within(screen.getAllByRole("row")[2]!).getAllByRole("gridcell")[0]!;
    expect(cell.textContent).toContain("Adeyemi, R.");
    await user.click(cell);
    expect(document.activeElement).toBe(cell);

    // The caller re-sorts under the reader. Adeyemi moves from row 2 to row 1.
    view.rerender(
      <DataGrid
        {...base}
        coverage={CASELOAD_COVERAGE}
        sort={{ key: "risk", direction: "descending" }}
      />,
    );
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("Adeyemi, R.");

    // Both the focus and the single tab stop went with the patient, not with
    // the position.
    expect((document.activeElement as HTMLElement).closest("tr")?.textContent).toContain(
      "Adeyemi, R.",
    );
    const stop = document.querySelector<HTMLElement>('[data-zb-cell][tabindex="0"]');
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
        coverage={CASELOAD_COVERAGE}
        identify={(row) => ({ primary: row.name, secondary: `MRN ${row.mrn}` })}
      />,
    );
    await user.click(screen.getAllByRole("gridcell")[0]!);
    expect(screen.getByText("Row 1 of 312 — Novak, K., MRN 5518203.")).toBeTruthy();
  });

  it("never names a masked record", () => {
    // The menu rule, applied here: a surface may say less than the row it came
    // from; it may never say more.
    expect(
      describeGridIdentity(
        { primary: "Adeyemi, R.", secondary: "MRN 4471902", masked: true },
        {
          row: 1,
          of: 312,
        },
      ),
    ).toBe("Row 1 of 312 — restricted record.");
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
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);
    const grid = screen.getByRole("grid");
    expect(grid.getAttribute("aria-colcount")).toBe("6");

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
      "6",
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
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);

    await user.click(screen.getAllByRole("gridcell")[0]!);
    await user.keyboard("{ArrowRight}{ArrowDown}");

    const focused = document.activeElement as HTMLElement;
    expect(focused.getAttribute("aria-colindex")).toBe("2");
    expect(focused.textContent).toBe("4471902");
  });

  it("keeps exactly one cell in the tab sequence", async () => {
    const user = userEvent.setup();
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);
    await user.click(screen.getAllByRole("gridcell")[0]!);

    const reachable = Array.from(document.querySelectorAll<HTMLElement>("[data-zb-cell]")).filter(
      (cell) => cell.getAttribute("tabindex") === "0",
    );
    expect(reachable).toHaveLength(1);
  });

  it("activates a row on Enter", async () => {
    const user = userEvent.setup();
    const activate = vi.fn();
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} onRowActivate={activate} />);

    await user.click(screen.getAllByRole("gridcell")[0]!);
    await user.keyboard("{Enter}");
    expect(activate).toHaveBeenCalledWith(CASELOAD[0]);
  });
});

/* ------------------------------------------------------------------ */
/* Framing the host already does                                       */
/* ------------------------------------------------------------------ */

describe("gives the framing back to the host when asked", () => {
  it("drops the masthead and keeps the accessible name", () => {
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} masthead={false} />);
    // The claim is gone from the page.
    expect(screen.queryByText(describeGridCoverage(CASELOAD_COVERAGE))).toBeNull();
    // The grid is still named. Turning off chrome must never unname a table.
    expect(screen.getByRole("grid").getAttribute("aria-label")).toBe(base.caption);
  });

  it("drops the foot without letting an absence go unlabelled", () => {
    render(
      <DataGrid
        {...base}
        rows={CASELOAD_WITH_EVERY_ABSENCE}
        coverage={{ ...CASELOAD_COVERAGE, shown: CASELOAD_WITH_EVERY_ABSENCE.length }}
        identify={(row) => ({ primary: row.name })}
        footer={false}
      />,
    );
    // No reading line, no notes, no numbered list.
    expect(screen.queryByText(/^Reading$/)).toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
    // But the cell still says the word. The superscript went; the meaning did not.
    expect(screen.getAllByText("Restricted").length).toBeGreaterThan(0);
    expect(document.querySelector(".zb-grid__mark")).toBeNull();
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
    const columns: DataGridColumn<CaseloadRow>[] = [
      { key: "name", header: "Client", kind: "text", value: (row) => row.name },
      { key: "mrn", header: "MRN", kind: "identifier", value: (row) => row.mrn, sortable: false },
    ];
    render(<DataGrid {...base} columns={columns} coverage={CASELOAD_COVERAGE} />);

    const header = screen.getByRole("columnheader", { name: "MRN" });
    // No button, so nothing to press — and no aria-sort, because "none" would
    // announce it as a sortable column that happens to be unsorted.
    expect(within(header).queryByRole("button")).toBeNull();
    expect(header.hasAttribute("aria-sort")).toBe(false);

    // The sortable one still is.
    const patient = screen.getByRole("columnheader", { name: /Client/ });
    expect(patient.getAttribute("aria-sort")).toBe("none");
    await user.click(within(patient).getByRole("button"));
    expect(patient.getAttribute("aria-sort")).toBe("ascending");
  });

  it("shows the direction it is sorted in, both ways", async () => {
    const user = userEvent.setup();
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);
    const header = screen.getByRole("columnheader", { name: /Client/ });
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
    render(
      <DataGrid {...base} coverage={CASELOAD_COVERAGE} sort={null} onSortChange={onSortChange} />,
    );
    await user.click(
      within(screen.getByRole("columnheader", { name: /Client/ })).getByRole("button"),
    );

    expect(onSortChange).toHaveBeenCalledWith({ key: "name", direction: "ascending" });
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("Novak, K.");
  });

  it("says Yes and No rather than true and false", () => {
    // `[object Object]` and a bare `true` are both the contract suite's
    // definition of a value reaching the screen that should have been handled.
    const columns: DataGridColumn<CaseloadRow>[] = [
      { key: "name", header: "Client", kind: "text", value: (row) => row.name },
      { key: "flag", header: "On a hold", value: (row) => row.mrn === "4471902" },
    ];
    render(<DataGrid {...base} columns={columns} coverage={CASELOAD_COVERAGE} />);
    expect(screen.getAllByText("Yes")).toHaveLength(1);
    expect(screen.getAllByText("No")).toHaveLength(CASELOAD.length - 1);
  });

  it("draws no foot at all when there is nothing to put in it", () => {
    // The rule that keeps a bare grid from closing with a 2px rule under it and
    // nothing beneath — which reads as a rendering fault rather than restraint.
    const columns: DataGridColumn<CaseloadRow>[] = [
      { key: "name", header: "Client", kind: "text", value: (row) => row.name },
    ];
    const { container } = render(
      <DataGrid
        {...base}
        columns={columns}
        rows={CASELOAD.slice(0, 2)}
        coverage={{ shown: 2, total: 2 }}
      />,
    );
    expect(container.querySelector(".zb-grid__foot")).toBeNull();

    // One derived column is enough to bring it back.
    cleanup();
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);
    expect(document.querySelector(".zb-grid__foot")).toBeTruthy();
  });

  it("honours an explicit alignment over the one its kind implies", () => {
    // The escape hatch a measured value with a qualifier word beside it needs:
    // right-aligning the pair lines up the words and leaves the numbers ragged.
    const columns: DataGridColumn<CaseloadRow>[] = [
      { key: "name", header: "Client", kind: "text", value: (row) => row.name },
      {
        key: "phq9",
        header: "PHQ-9",
        kind: "measure",
        align: "start",
        value: (row) => row.phq9,
      },
    ];
    render(<DataGrid {...base} columns={columns} coverage={CASELOAD_COVERAGE} />);
    const cell = within(screen.getAllByRole("row")[1]!).getAllByRole("gridcell")[1]!;
    expect(cell.className).toContain("zb-grid__td--start");
    expect(cell.className).not.toContain("zb-grid__td--end");
  });

  it("falls back to the header when the focused row is no longer there", async () => {
    // Not a hypothetical: a worklist row disappears when the filter behind it
    // moves. The cursor goes to the header rather than to whoever inherited the
    // position, which is the whole reason it is a key and not an index.
    const user = userEvent.setup();
    const view = render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);
    await user.click(within(screen.getAllByRole("row")[2]!).getAllByRole("gridcell")[0]!);

    view.rerender(
      <DataGrid
        {...base}
        rows={CASELOAD.filter((row) => row.mrn !== "4471902")}
        coverage={CASELOAD_COVERAGE}
      />,
    );

    const stops = [...document.querySelectorAll('[data-zb-cell][tabindex="0"]')];
    expect(stops).toHaveLength(1);
    expect(stops[0]?.closest("thead")).not.toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Selection                                                           */
/* ------------------------------------------------------------------ */

describe("selection, and what a bulk action may reach", () => {
  it("renders no selection column until it can lead somewhere", () => {
    // A checkbox with no handler teaches a reader to expect a bulk action the
    // product does not have.
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.getByRole("grid").hasAttribute("aria-multiselectable")).toBe(false);
  });

  it("names every checkbox after the row it selects", () => {
    render(
      <DataGrid
        {...base}
        coverage={CASELOAD_COVERAGE}
        selectedKeys={[]}
        onSelectionChange={() => {}}
        identify={(row) => ({ primary: row.name, secondary: `MRN ${row.mrn}` })}
      />,
    );
    // "Select row 3" is a name that means nothing once the grid is sorted.
    expect(screen.getByRole("checkbox", { name: "Select Adeyemi, R." })).toBeTruthy();
    expect(screen.getByRole("grid").getAttribute("aria-multiselectable")).toBe("true");
  });

  it("says select-all means this page, not the cohort", () => {
    render(
      <DataGrid
        {...base}
        coverage={CASELOAD_COVERAGE}
        selectedKeys={[]}
        onSelectionChange={() => {}}
      />,
    );
    // 6 on screen, 312 in the caseload. A checkbox that silently meant 312 is
    // how a bulk action reaches a chart nobody has looked at.
    expect(screen.getByRole("checkbox", { name: /Select all 6 rows on this page/ })).toBeTruthy();
  });

  it("reports the page's rows rather than clearing when some are picked", () => {
    const keys = CASELOAD.map((row) => row.mrn);
    expect(gridSelectionState([], keys)).toBe("none");
    expect(gridSelectionState([keys[0]!], keys)).toBe("some");
    expect(gridSelectionState(keys, keys)).toBe("all");

    // Partially selected: the header adds the rest, it does not wipe the four
    // a reader hand-picked.
    expect(toggleAllGridSelection([keys[0]!], keys)).toHaveLength(keys.length);
    expect(toggleAllGridSelection(keys, keys)).toEqual([]);
    expect(toggleGridSelection([], "a")).toEqual(["a"]);
    expect(toggleGridSelection(["a", "b"], "a")).toEqual(["b"]);
  });

  it("marks selected rows for a screen reader, not only for the eye", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <DataGrid
        {...base}
        coverage={CASELOAD_COVERAGE}
        selectedKeys={["4471902"]}
        onSelectionChange={onSelectionChange}
      />,
    );
    const selected = screen
      .getAllByRole("row")
      .filter((row) => row.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
    expect(selected[0]?.textContent).toContain("Adeyemi, R.");

    await user.click(screen.getAllByRole("checkbox")[1]!);
    expect(onSelectionChange).toHaveBeenCalled();
  });

  it("keeps the bar's box while nothing is picked, so nothing moves when something is", () => {
    const { unmount } = render(
      <DataGrid
        {...base}
        coverage={CASELOAD_COVERAGE}
        selectedKeys={[]}
        onSelectionChange={() => {}}
        bulkActions={() => <button type="button">Assign clinician</button>}
      />,
    );
    /*
     * Laid out, and off. It used to be unmounted, and the first click then
     * pushed every row down by the bar's height — under a pointer already
     * moving towards the next checkbox, which in a caseload is how somebody
     * actions the wrong client. The box stays; only its visibility changes.
     */
    const idle = document.querySelector(".zb-grid__bulk");
    expect(idle?.getAttribute("data-zb-on")).toBe("false");
    // Inert, so its buttons are not in the tab ring while it is hidden.
    expect(idle?.hasAttribute("inert")).toBe(true);
    unmount();

    render(
      <DataGrid
        {...base}
        coverage={CASELOAD_COVERAGE}
        selectedKeys={["4471902", "3320145"]}
        onSelectionChange={() => {}}
        bulkActions={(rows) => <button type="button">Assign {rows.length}</button>}
      />,
    );
    const bar = screen.getByRole("region", { name: "Selection actions" });
    expect(bar.getAttribute("data-zb-on")).toBe("true");
    expect(bar.hasAttribute("inert")).toBe(false);
    // Polite, because selecting one row at a time otherwise announces only
    // that a checkbox changed — never that a bar of verbs appeared above it.
    expect(within(bar).getByText("2 rows selected").getAttribute("aria-live")).toBe("polite");
    expect(within(bar).getByRole("button", { name: "Assign 2" })).toBeTruthy();
  });

  it("counts one row in the singular", () => {
    expect(describeGridSelection(1)).toBe("1 row selected");
    expect(describeGridSelection(4, "client")).toBe("4 clients selected");
    expect(describeGridSelection(0)).toBe("");
  });
});

/* ------------------------------------------------------------------ */
/* Loading more                                                        */
/* ------------------------------------------------------------------ */

describe("the pinned column, measured rather than guessed", () => {
  it("writes a left offset for every pinned cell, and leaves the rest alone", () => {
    render(
      <DataGrid
        {...base}
        coverage={CASELOAD_COVERAGE}
        pinnedColumns={1}
        selectedKeys={[]}
        onSelectionChange={() => {}}
        bulkActions={() => null}
      />,
    );
    /*
     * A hard-coded `left` is the usual version and it is wrong the moment a
     * name is long, the density changes or a translation lands. The offsets
     * come from the header's own widths, so the checkbox column and the
     * identity column stack correctly whatever they turn out to measure.
     */
    const pinned = document.querySelectorAll(".zb-grid__pin");
    expect(pinned.length).toBeGreaterThan(0);
    const first = pinned[0] as HTMLElement | undefined;
    expect(first?.style.left).toBe("0px");
  });

  it("keeps the same array when a re-measure finds the same widths", () => {
    const props = {
      ...base,
      coverage: CASELOAD_COVERAGE,
      pinnedColumns: 1,
      selectedKeys: [] as readonly string[],
      onSelectionChange: () => {},
      bulkActions: () => null,
    };
    const { rerender } = render(<DataGrid {...props} density="regular" />);
    // Density is in the effect's dependencies, so this measures a second time.
    // Identical offsets have to return the *same* array: a new one every
    // measure re-renders every pinned cell for nothing, and a ResizeObserver
    // fires on every window drag.
    rerender(<DataGrid {...props} density="comfortable" />);
    rerender(<DataGrid {...props} density="regular" />);
    const first = document.querySelector(".zb-grid__pin") as HTMLElement | null;
    expect(first?.style.left).toBe("0px");
  });

  it("pins the identity column without being asked, and marks where the pin ends", () => {
    // A phone scrolls every grid sideways. The name leaving the screen is the
    // wrong-patient error, so keeping it is the default rather than an option.
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);
    const [identity, next] = screen.getAllByRole("columnheader");
    expect(identity).toHaveClass("zb-grid__pin", "zb-grid__pin--edge");
    expect(next).not.toHaveClass("zb-grid__pin");
    expect(document.querySelectorAll("td.zb-grid__pin--edge")).toHaveLength(CASELOAD.length);
  });

  it("pins nothing when told to, and never more columns than exist", () => {
    const { unmount } = render(
      <DataGrid {...base} coverage={CASELOAD_COVERAGE} pinnedColumns={0} />,
    );
    expect(document.querySelector(".zb-grid__pin, .zb-grid__pin--edge")).toBeNull();
    unmount();

    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} pinnedColumns={99} />);
    const headers = screen.getAllByRole("columnheader");
    expect(headers.every((header) => header.classList.contains("zb-grid__pin"))).toBe(true);
    expect(headers.at(-1)).toHaveClass("zb-grid__pin--edge");
  });

  it("says when something has scrolled under the pinned column, and only when it changes", () => {
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);
    const scroller = document.querySelector(".zb-grid__scroll") as HTMLElement;
    const scrollTo = (left: number) => {
      Object.defineProperty(scroller, "scrollLeft", { configurable: true, value: left });
      fireEvent.scroll(scroller);
    };

    scrollTo(200);
    expect(scroller.dataset.zbScrolled).toBe("true");
    scrollTo(240);
    expect(scroller.dataset.zbScrolled).toBe("true");
    // RTL reports a negative scrollLeft; it is still scrolled.
    scrollTo(-40);
    expect(scroller.dataset.zbScrolled).toBe("true");
    scrollTo(0);
    expect(scroller.dataset.zbScrolled).toBe("false");
  });

  it("takes a tap on the area around a checkbox, not only on its 15px box", async () => {
    const onSelectionChange = vi.fn();
    render(
      <DataGrid
        {...base}
        coverage={CASELOAD_COVERAGE}
        selectedKeys={[]}
        onSelectionChange={onSelectionChange}
      />,
    );
    const box = screen.getByRole("checkbox", { name: "Select row 1" });
    const target = box.closest("label");
    expect(target).toHaveClass("zb-grid__hit");
    await userEvent.setup().click(target as HTMLElement);
    expect(onSelectionChange).toHaveBeenCalledWith([CASELOAD[0]?.mrn]);

    const all = screen.getByRole("checkbox", { name: /Select all/ });
    await userEvent.setup().click(all.closest("label") as HTMLElement);
    expect(onSelectionChange).toHaveBeenLastCalledWith(CASELOAD.map((row) => row.mrn));
  });
});

describe("the engine's two remaining orderings", () => {
  it("ranks a status column by its declared vocabulary, worst first", () => {
    // "None reported" sorting above "Ideation with plan" because N precedes I
    // is how a worklist buries the row it was built to surface.
    const cssrs = COLUMNS.find((column) => column.key === "cssrs");
    const words = sortGridRows(CASELOAD, cssrs, "ascending").map((row) => row.cssrs);
    expect(words[0]).toBe("Ideation with plan");

    // A term the vocabulary does not list sorts after every term it does,
    // rather than wherever the alphabet happens to put it.
    const first = CASELOAD[0];
    if (!first) throw new Error("no caseload row");
    const odd = [...CASELOAD, { ...first, mrn: "0000001", cssrs: "Not in the list" }];
    const withOdd = sortGridRows(odd, cssrs, "ascending")
      .map((row) => row.cssrs)
      // Absence still sorts below everything, so the last *word* is the one
      // the vocabulary does not know about.
      .filter((value) => typeof value === "string");
    expect(withOdd.at(-1)).toBe("Not in the list");
  });

  it("moves a page at a time, and stops at both ends", () => {
    const bounds = { rows: 40, columns: 5 };
    expect(moveGridCursor({ row: 0, column: 0 }, "PageDown", bounds)).toEqual({
      row: 10,
      column: 0,
    });
    expect(moveGridCursor({ row: 12, column: 2 }, "PageUp", bounds)).toEqual({
      row: 2,
      column: 2,
    });
    // Clamped rather than wrapped, and the floor is -1 — the header row — so a
    // reader who pages up off the top lands on the sort controls rather than
    // on the bottom of the list they were trying to leave.
    expect(moveGridCursor({ row: 3, column: 1 }, "PageUp", bounds)).toEqual({
      row: -1,
      column: 1,
    });
    expect(moveGridCursor({ row: 38, column: 1 }, "PageDown", bounds)).toEqual({
      row: 39,
      column: 1,
    });
  });
});

describe("the controls a mouse reaches", () => {
  it("selects and clears the whole page from the header", async () => {
    const user = userEvent.setup();
    const changes: string[][] = [];
    const { rerender } = render(
      <DataGrid
        {...base}
        coverage={CASELOAD_COVERAGE}
        selectedKeys={[]}
        onSelectionChange={(next) => changes.push([...next])}
        bulkActions={() => <button type="button">Assign clinician</button>}
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: /Select all 6 rows/ }));
    expect(changes[0]).toHaveLength(CASELOAD.length);

    // And the bar's own Clear, which is the only way back out without
    // un-ticking six boxes one at a time.
    rerender(
      <DataGrid
        {...base}
        coverage={CASELOAD_COVERAGE}
        selectedKeys={CASELOAD.map((row) => row.mrn)}
        onSelectionChange={(next) => changes.push([...next])}
        bulkActions={() => <button type="button">Assign clinician</button>}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(changes[1]).toEqual([]);
  });

  it("shows the header box as part-selected rather than as off", () => {
    render(
      <DataGrid
        {...base}
        coverage={CASELOAD_COVERAGE}
        selectedKeys={[CASELOAD[0]?.mrn ?? ""]}
        onSelectionChange={() => {}}
        bulkActions={() => null}
      />,
    );
    // Indeterminate, not unchecked: "some" and "none" are different answers and
    // an unticked box in a header that has two rows selected is a lie.
    const box = screen.getByRole("checkbox", { name: /Select all 6 rows/ });
    expect((box as HTMLInputElement).indeterminate).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Reaching the end                                                    */
/* ------------------------------------------------------------------ */

describe("the sentinel, once something actually crosses it", () => {
  /**
   * jsdom has no IntersectionObserver, so the callback the component installs
   * is never invoked and the one line that matters — "should I ask for more?"
   * — goes untested. This captures it and calls it by hand.
   */
  function captureObserver() {
    const calls: IntersectionObserverCallback[] = [];
    class Fake {
      constructor(callback: IntersectionObserverCallback) {
        calls.push(callback);
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
      root = null;
      rootMargin = "";
      thresholds = [];
    }
    vi.stubGlobal("IntersectionObserver", Fake);
    return calls;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks for more when the sentinel comes into view, and not otherwise", () => {
    const calls = captureObserver();
    const onReachEnd = vi.fn();
    render(
      <DataGrid
        {...base}
        coverage={{ shown: 6, total: 312, noun: "clients" }}
        onReachEnd={onReachEnd}
      />,
    );
    const fire = calls[0];
    expect(fire).toBeTruthy();

    // Nothing intersecting: nothing asked for.
    fire?.([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(onReachEnd).not.toHaveBeenCalled();

    fire?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(onReachEnd).toHaveBeenCalledTimes(1);
  });

  it("does not ask twice while a request is in flight", () => {
    const calls = captureObserver();
    const onReachEnd = vi.fn();
    render(
      <DataGrid
        {...base}
        coverage={{ shown: 6, total: 312, noun: "clients" }}
        onReachEnd={onReachEnd}
        loadingMore
      />,
    );
    calls[0]?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    // The defect every hand-rolled infinite scroll ships with, refused here.
    expect(onReachEnd).not.toHaveBeenCalled();
  });
});

describe("nothing matched", () => {
  it("says so inside the grid, with the headers still there", () => {
    render(<DataGrid {...base} rows={[]} coverage={{ shown: 0, total: 0, noun: "clients" }} />);
    expect(screen.getByRole("status").textContent).toBe("No clients match.");
    // The headers survive, because undoing the filter or the sort is the next
    // thing the reader does and both controls live in them.
    expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(0);
  });

  it("lets the host say the thing the grid cannot know", () => {
    render(
      <DataGrid
        {...base}
        rows={[]}
        coverage={{ shown: 0, total: 0 }}
        empty="No clients match. Try dropping the PHQ-9 filter."
      />,
    );
    expect(screen.getByRole("status").textContent).toContain("dropping the PHQ-9 filter");
  });
});

describe("the end of the list, rather than a page number", () => {
  it("says how far through it is, and admits when the end is not knowable", () => {
    expect(describeGridLoaded({ shown: 24, total: 312, noun: "clients" })).toBe(
      "24 of 312 clients loaded.",
    );
    expect(describeGridLoaded({ shown: 312, total: 312, noun: "clients" })).toBe(
      "All 312 clients loaded.",
    );
    // The reason this replaced a pager: against a FHIR search the total is
    // often withheld, and "page 4 of 7" is then a control that cannot be built.
    expect(describeGridLoaded({ shown: 24, total: "unknown", noun: "clients" })).toBe(
      "24 clients loaded. The source did not say how many match.",
    );
    expect(describeGridLoaded({ shown: 24, total: "unknown", noun: "clients" }, "exhausted")).toBe(
      "All 24 clients loaded.",
    );
    expect(describeGridLoaded({ shown: 24, total: 312, noun: "clients" }, "loading")).toBe(
      "Loading more clients…",
    );
  });

  it("refuses a second request while one is in flight", () => {
    // The defect every hand-rolled infinite scroll ships with: a scroll that
    // crosses the sentinel twice fetches the same batch twice, and the list
    // ends up holding it twice.
    const coverage = { shown: 24, total: 312 };
    expect(shouldLoadMoreGridRows(coverage, false, false)).toBe(true);
    expect(shouldLoadMoreGridRows(coverage, true, false)).toBe(false);
    expect(shouldLoadMoreGridRows(coverage, false, true)).toBe(false);
    // Nothing left to ask for.
    expect(shouldLoadMoreGridRows({ shown: 312, total: 312 }, false, false)).toBe(false);
    // And an unknown total is always worth one more ask.
    expect(shouldLoadMoreGridRows({ shown: 24, total: "unknown" }, false, false)).toBe(true);
  });

  it("announces its state rather than spinning", () => {
    render(
      <DataGrid
        {...base}
        coverage={{ ...CASELOAD_COVERAGE, shown: 6 }}
        onReachEnd={() => {}}
        loadingMore
      />,
    );
    // A sentence a screen reader reads out, where a spinner is nothing at all.
    expect(screen.getByRole("status").textContent).toBe(
      "Loading more clients on this team's caseload…",
    );
  });

  it("draws no end-of-list furniture when there is nothing more to fetch", () => {
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} />);
    expect(screen.queryByRole("status")).toBeNull();
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
    render(<DataGrid {...base} coverage={CASELOAD_COVERAGE} ceiling={4} />);
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
    const csv = toGridDelimited(CASELOAD, CASELOAD_COLUMNS, { coverage: CASELOAD_COVERAGE });
    const lines = csv.split("\r\n");
    expect(lines[0]).toContain("6 of 312 clients on this team's caseload.");
    expect(lines[1]).toContain("is model output, not an observation.");
    expect(lines[2]).toBe("Client,MRN,PHQ-9,Risk screen,Disengagement risk,Next contact");
  });

  it("writes an absence as its word rather than as a blank cell", () => {
    // A blank in a spreadsheet is indistinguishable from a value nobody typed.
    const csv = toGridDelimited(CASELOAD, CASELOAD_COLUMNS, {});
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
