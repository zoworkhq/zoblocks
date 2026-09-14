/**
 * RecentPatientStack — the four things a dropdown of names cannot do.
 *
 * Give each chart an identity that survives the session, tell two similar
 * names apart, carry what is owed on each, and refuse to lose work quietly.
 * The suite is organised around the four, plus the keyboard model that makes
 * the stack usable at all.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ACCENT_COUNT,
  REASSERT_AFTER_MS,
  RecentPatientStack,
  WORK_ORDER,
  canClose,
  chartAccent,
  describeChart,
  describeWork,
  moveChart,
  needsIdentifier,
  needsReassertion,
  orderCharts,
  similarPairs,
  worstWork,
  type OpenChart,
} from "./recent-patient-stack";

const NOW = "2026-08-24T10:00:00Z";

const charts: OpenChart[] = [
  {
    id: "chart-okonkwo",
    display: "A. Okonkwo",
    identifier: "093-441-208",
    reason: "Ward round",
    lastActiveAt: "2026-08-24T09:58:00Z",
  },
  {
    id: "chart-boateng",
    display: "T. Boateng",
    identifier: "093-118-774",
    reason: "Discharge summary",
    lastActiveAt: "2026-08-24T09:30:00Z",
    work: [{ kind: "unsigned-note", label: "Progress note", since: "2026-08-21T09:00:00Z" }],
  },
  {
    id: "chart-marsh",
    display: "L. Marsh",
    identifier: "093-772-115",
    reason: "Triage",
    lastActiveAt: "2026-08-24T08:00:00Z",
    work: [{ kind: "draft-order", label: "Lithium level" }],
  },
  {
    id: "chart-vance",
    display: "R. Vance",
    identifier: "093-004-661",
    pinned: true,
    lastActiveAt: "2026-08-23T17:00:00Z",
  },
];

/* ------------------------------------------------------------------ */
/* Claim 1 — an identity that survives the session                     */
/* ------------------------------------------------------------------ */

describe("the chart accent", () => {
  it("is derived from the id, so it is the same hue tomorrow", () => {
    const first = chartAccent("chart-okonkwo");
    expect(chartAccent("chart-okonkwo")).toBe(first);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(ACCENT_COUNT);
  });

  it("gives different ids different slots more often than not", () => {
    const slots = new Set(charts.map((chart) => chartAccent(chart.id)));
    // Not a guarantee — eight slots and four charts collide sometimes — but a
    // hash that mapped everything to one slot would be a decoration.
    expect(slots.size).toBeGreaterThan(1);
  });

  it("stays inside the palette for any id", () => {
    for (const id of ["", "a", "chart-".repeat(40), "🙂", "093-441-208"]) {
      const slot = chartAccent(id);
      expect(Number.isInteger(slot)).toBe(true);
      expect(slot).toBeGreaterThanOrEqual(0);
      expect(slot).toBeLessThan(ACCENT_COUNT);
    }
  });

  it("is never the only identity on the tab", () => {
    render(<RecentPatientStack charts={charts} activeId="chart-okonkwo" now={NOW} />);
    for (const chart of charts) {
      expect(screen.getByText(chart.display)).toBeInTheDocument();
    }
  });
});

/* ------------------------------------------------------------------ */
/* Claim 2 — telling two similar names apart                           */
/* ------------------------------------------------------------------ */

describe("disambiguation", () => {
  const lookalikes: OpenChart[] = [
    { id: "a", display: "J. Okonkwo", identifier: "093-441-208" },
    { id: "b", display: "J. Okonjo", identifier: "093-118-774" },
    { id: "c", display: "T. Boateng", identifier: "093-772-115" },
  ];

  it("finds the pair, not the third chart", () => {
    expect(similarPairs(lookalikes)).toEqual([["a", "b"]]);
  });

  it("flags both sides of a pair, never only the newcomer", () => {
    const flagged = needsIdentifier(lookalikes);
    // One row with an identifier and one without is a harder comparison than
    // two that both have one.
    expect([...flagged].sort()).toEqual(["a", "b"]);
  });

  it("catches an exact duplicate name", () => {
    expect(
      needsIdentifier([
        { id: "a", display: "Amara Okonkwo" },
        { id: "b", display: "amara  okonkwo" },
      ]).size,
    ).toBe(2);
  });

  it("ignores punctuation and accents rather than being fooled by them", () => {
    expect(
      similarPairs([
        { id: "a", display: "José Núñez" },
        { id: "b", display: "Jose Nunez" },
      ]),
    ).toEqual([["a", "b"]]);
  });

  it("shows the identifier on the tab only for a flagged chart", () => {
    render(<RecentPatientStack charts={lookalikes} activeId="a" />);
    expect(screen.getByText("093-441-208")).toBeInTheDocument();
    expect(screen.getByText("093-118-774")).toBeInTheDocument();
    expect(screen.queryByText("093-772-115")).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Claim 3 — what is owed on each chart                                */
/* ------------------------------------------------------------------ */

describe("outstanding work", () => {
  it("ranks by consequence rather than by arrival", () => {
    expect([...WORK_ORDER]).toEqual([
      "draft-order",
      "unsigned-note",
      "unacknowledged-result",
      "pending-task",
    ]);
  });

  it("surfaces the worst item, not the first", () => {
    const chart: OpenChart = {
      id: "x",
      display: "X",
      work: [{ kind: "pending-task" }, { kind: "draft-order" }, { kind: "unsigned-note" }],
    };
    expect(worstWork(chart)?.kind).toBe("draft-order");
  });

  it("has nothing to say about a clean chart", () => {
    expect(worstWork({ id: "x", display: "X" })).toBeNull();
  });

  it("counts the caseload and names the age of the oldest", () => {
    // The number that decides whether the week ends on time.
    expect(describeWork(charts, NOW)).toBe("1 unsigned note, oldest 3 days");
  });

  it("counts without an age when the host gave no clock", () => {
    expect(describeWork(charts)).toBe("1 unsigned note");
  });

  it("says nothing at all when nothing is owed", () => {
    expect(describeWork([{ id: "x", display: "X" }], NOW)).toBeNull();
  });

  it("pluralises, because 1 unsigned notes is a bug people read as noise", () => {
    const two: OpenChart[] = [
      { id: "a", display: "A", work: [{ kind: "unsigned-note", since: "2026-08-24T04:00:00Z" }] },
      { id: "b", display: "B", work: [{ kind: "unsigned-note", since: "2026-08-24T08:00:00Z" }] },
    ];
    expect(describeWork(two, NOW)).toBe("2 unsigned notes, oldest 6 h");
  });

  it("puts the outstanding item in the accessible name", () => {
    render(<RecentPatientStack charts={charts} activeId="chart-okonkwo" now={NOW} />);
    expect(screen.getByRole("tab", { name: /T\. Boateng.*unsigned note/i })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Claim 4 — refusing to lose work quietly                             */
/* ------------------------------------------------------------------ */

describe("closing", () => {
  it("closes a clean chart without asking", () => {
    expect(canClose({ id: "x", display: "X" })).toEqual({ kind: "close" });
  });

  it("asks about an unsigned note", () => {
    const verdict = canClose({
      id: "x",
      display: "T. Boateng",
      work: [{ kind: "unsigned-note", label: "Progress note" }],
    });
    expect(verdict.kind).toBe("confirm");
    if (verdict.kind !== "confirm") throw new Error("expected a confirm");
    expect(verdict.reason).toContain("unsigned progress note");
  });

  it("refuses a draft order, because nothing downstream shows its absence", () => {
    const verdict = canClose({
      id: "x",
      display: "L. Marsh",
      work: [{ kind: "draft-order", label: "Lithium level" }],
    });
    expect(verdict.kind).toBe("refuse");
    if (verdict.kind !== "refuse") throw new Error("expected a refusal");
    expect(verdict.reason).toContain("Lithium level");
    expect(verdict.reason).toContain("Sign it or discard it first");
  });

  it("lets the worse verdict win when a chart has both", () => {
    expect(
      canClose({
        id: "x",
        display: "X",
        work: [{ kind: "unsigned-note" }, { kind: "draft-order" }],
      }).kind,
    ).toBe("refuse");
  });

  it("closes a clean chart straight through the component", async () => {
    const onClose = vi.fn();
    render(
      <RecentPatientStack charts={charts} activeId="chart-okonkwo" expanded onClose={onClose} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Close R. Vance" }));
    expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ id: "chart-vance" }));
  });

  it("asks before losing a draft, and only closes when told to", async () => {
    const onClose = vi.fn();
    render(
      <RecentPatientStack charts={charts} activeId="chart-okonkwo" expanded onClose={onClose} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Close T. Boateng" }));
    expect(onClose).not.toHaveBeenCalled();

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("data-zb-verdict", "confirm");

    await userEvent.click(within(dialog).getByRole("button", { name: /lose the draft/i }));
    expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ id: "chart-boateng" }));
  });

  it("offers no way through a refusal", async () => {
    const onClose = vi.fn();
    render(
      <RecentPatientStack charts={charts} activeId="chart-okonkwo" expanded onClose={onClose} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Close L. Marsh" }));

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("data-zb-verdict", "refuse");
    // One exit. A dialogue with only one way out that offers two is how people
    // learn to click through the ones that matter.
    expect(within(dialog).getAllByRole("button")).toHaveLength(1);

    await userEvent.click(within(dialog).getByRole("button", { name: /back to the chart/i }));
    expect(onClose).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/* Returning                                                           */
/* ------------------------------------------------------------------ */

describe("re-asserting identity on return", () => {
  it("uses fifteen minutes", () => {
    expect(REASSERT_AFTER_MS).toBe(15 * 60_000);
  });

  it("does not interrupt somebody who never left", () => {
    expect(
      needsReassertion({ id: "x", display: "X", lastActiveAt: "2026-08-24T09:58:00Z" }, NOW),
    ).toBe(false);
  });

  it("interrupts after long enough away", () => {
    expect(
      needsReassertion({ id: "x", display: "X", lastActiveAt: "2026-08-24T09:40:00Z" }, NOW),
    ).toBe(true);
  });

  it("interrupts when it cannot tell how long you were away", () => {
    // Not knowing is not the same as having just left.
    expect(needsReassertion({ id: "x", display: "X" }, NOW)).toBe(true);
    expect(needsReassertion({ id: "x", display: "X", lastActiveAt: "nonsense" }, NOW)).toBe(true);
  });

  it("reports the decision rather than making it", async () => {
    const onActivate = vi.fn();
    render(
      <RecentPatientStack
        charts={charts}
        activeId="chart-okonkwo"
        now={NOW}
        onActivate={onActivate}
      />,
    );

    await userEvent.click(screen.getByRole("tab", { name: /R\. Vance/ }));
    expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: "chart-vance" }), {
      reassert: true,
    });

    await userEvent.click(screen.getByRole("tab", { name: /A\. Okonkwo/ }));
    expect(onActivate).toHaveBeenLastCalledWith(expect.objectContaining({ id: "chart-okonkwo" }), {
      reassert: false,
    });
  });
});

/* ------------------------------------------------------------------ */
/* Order and the keyboard                                              */
/* ------------------------------------------------------------------ */

describe("order", () => {
  it("puts pinned charts first, then most recently active", () => {
    expect(orderCharts(charts).map((chart) => chart.id)).toEqual([
      "chart-vance",
      "chart-okonkwo",
      "chart-boateng",
      "chart-marsh",
    ]);
  });

  it("leaves charts with no activity where they were rather than shuffling them", () => {
    const quiet: OpenChart[] = [
      { id: "a", display: "A" },
      { id: "b", display: "B" },
      { id: "c", display: "C", lastActiveAt: NOW },
    ];
    expect(orderCharts(quiet).map((c) => c.id)).toEqual(["c", "a", "b"]);
  });

  it("moves a chart by one place", () => {
    const ordered = orderCharts(charts);
    expect(moveChart(ordered, "chart-boateng", 1).map((c) => c.id)).toEqual([
      "chart-vance",
      "chart-okonkwo",
      "chart-marsh",
      "chart-boateng",
    ]);
  });

  it("refuses a move that would cross the pinned boundary", () => {
    const ordered = orderCharts(charts);
    // chart-okonkwo is first among the unpinned; moving it up would put it
    // above a pinned chart, which is a decision a keystroke must not make.
    expect(moveChart(ordered, "chart-okonkwo", -1).map((c) => c.id)).toEqual(
      ordered.map((c) => c.id),
    );
  });

  it("does nothing at the ends, and nothing for an unknown id", () => {
    const ordered = orderCharts(charts);
    expect(moveChart(ordered, "chart-marsh", 1).map((c) => c.id)).toEqual(ordered.map((c) => c.id));
    expect(moveChart(ordered, "nope", 1).map((c) => c.id)).toEqual(ordered.map((c) => c.id));
  });
});

describe("the keyboard model", () => {
  it("is a tablist with one tab stop", () => {
    render(<RecentPatientStack charts={charts} activeId="chart-boateng" />);
    const tabs = within(screen.getByRole("tablist", { name: "Open charts" })).getAllByRole("tab");

    expect(tabs).toHaveLength(4);
    expect(tabs.filter((tab) => tab.getAttribute("tabindex") === "0")).toHaveLength(1);
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent("T. Boateng");
  });

  it("keeps a tab stop when the active chart is not in the stack", () => {
    // A stale activeId (the chart was closed elsewhere) must not take every
    // tab out of the tab order.
    render(<RecentPatientStack charts={charts} activeId="chart-closed-elsewhere" />);
    const tabs = screen.getAllByRole("tab");

    expect(tabs.filter((tab) => tab.getAttribute("tabindex") === "0")).toEqual([tabs[0]]);
  });

  it("moves focus with the arrows without opening anything", async () => {
    const onActivate = vi.fn();
    render(<RecentPatientStack charts={charts} activeId="chart-vance" onActivate={onActivate} />);

    const tabs = screen.getAllByRole("tab");
    tabs[0]?.focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(tabs[1]).toHaveFocus();
    // Focus is not activation. Arrowing past a chart must not open it.
    expect(onActivate).not.toHaveBeenCalled();
  });

  it("jumps to the ends with Home and End", async () => {
    render(<RecentPatientStack charts={charts} activeId="chart-vance" />);
    const tabs = screen.getAllByRole("tab");

    tabs[0]?.focus();
    await userEvent.keyboard("{End}");
    expect(tabs[tabs.length - 1]).toHaveFocus();

    await userEvent.keyboard("{Home}");
    expect(tabs[0]).toHaveFocus();
  });

  it("reorders with Alt and the arrows, which is the drag's keyboard equivalent", async () => {
    const onReorder = vi.fn();
    render(<RecentPatientStack charts={charts} activeId="chart-okonkwo" onReorder={onReorder} />);

    screen.getByRole("tab", { name: /T\. Boateng/ }).focus();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");

    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(onReorder.mock.calls[0]?.[0].map((c: OpenChart) => c.id)).toEqual([
      "chart-vance",
      "chart-okonkwo",
      "chart-marsh",
      "chart-boateng",
    ]);
  });

  it("does not move focus when Alt is held", async () => {
    render(<RecentPatientStack charts={charts} activeId="chart-okonkwo" onReorder={vi.fn()} />);
    const boateng = screen.getByRole("tab", { name: /T\. Boateng/ });
    boateng.focus();

    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(boateng).toHaveFocus();
  });
});

/* ------------------------------------------------------------------ */
/* The panel and the sentence                                          */
/* ------------------------------------------------------------------ */

describe("the panel", () => {
  it("is closed until the host opens it", () => {
    render(<RecentPatientStack charts={charts} activeId="chart-okonkwo" onClose={vi.fn()} />);
    // The close affordance lives in the panel, not on the tab: on the tab it is
    // one mis-tap from losing a draft.
    expect(screen.queryByRole("button", { name: /^Close / })).toBeNull();
  });

  it("reports the expand toggle rather than owning it", async () => {
    const onExpandedChange = vi.fn();
    render(
      <RecentPatientStack
        charts={charts}
        activeId="chart-okonkwo"
        onExpandedChange={onExpandedChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "4 charts" }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  it("pins from the panel", async () => {
    const onPin = vi.fn();
    render(<RecentPatientStack charts={charts} activeId="chart-okonkwo" expanded onPin={onPin} />);

    const unpin = screen.getByRole("button", { name: "Unpin" });
    expect(unpin).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(unpin);
    expect(onPin).toHaveBeenCalledWith(expect.objectContaining({ id: "chart-vance" }), false);
  });
});

/* ------------------------------------------------------------------ */
/* The quiet halves                                                    */
/* ------------------------------------------------------------------ */

describe("partial charts", () => {
  it("gives the first tab the tab stop when nothing is active yet", () => {
    // A workspace restored from a cold start has charts and no active one.
    // Without this branch the whole stack has no tab stop at all.
    render(<RecentPatientStack charts={charts} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("tabindex", "0");
    expect(tabs.filter((tab) => tab.getAttribute("tabindex") === "0")).toHaveLength(1);
  });

  it("takes initials from a single-word name without inventing a second letter", () => {
    const { container } = render(
      <RecentPatientStack charts={[{ id: "one", display: "Prince" }]} activeId="one" />,
    );
    expect(container.querySelector(".zb-stack__avatar")).toHaveTextContent("P");
  });

  it("draws an empty avatar rather than throwing on a chart with a blank name", () => {
    const { container } = render(
      <RecentPatientStack charts={[{ id: "blank", display: "" }]} activeId="blank" />,
    );
    expect(container.querySelector(".zb-stack__avatar")).toHaveTextContent("");
    expect(container.querySelectorAll(".zb-stack__tab")).toHaveLength(1);
  });

  it("renders a chart with no reason and no work", () => {
    const { container } = render(
      <RecentPatientStack charts={[{ id: "bare", display: "N. Osei" }]} activeId="bare" />,
    );
    expect(container.querySelector(".zb-stack__reason")).toBeNull();
    expect(container.querySelector(".zb-stack__work")).toBeNull();
  });

  it("falls back to the kind when an outstanding item carries no label", () => {
    render(
      <RecentPatientStack
        charts={[{ id: "x", display: "X", work: [{ kind: "unacknowledged-result" }] }]}
        activeId="x"
      />,
    );
    // The short word on the tab; the long form is in the accessible name.
    expect(screen.getByText("result")).toBeInTheDocument();
    // Capitalised, because each clause of the spoken statement is a sentence.
    expect(screen.getByRole("tab").getAttribute("aria-label")).toContain("Unacknowledged result");
  });

  it("re-asserts identity when the host supplies no clock at all", async () => {
    const onActivate = vi.fn();
    render(<RecentPatientStack charts={charts} activeId="chart-okonkwo" onActivate={onActivate} />);

    await userEvent.click(screen.getByRole("tab", { name: /T\. Boateng/ }));
    // Without a clock it cannot know how long you were away, and not knowing
    // is not the same as having just left.
    expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: "chart-boateng" }), {
      reassert: true,
    });
  });

  it("moves focus left and right, not only right", async () => {
    render(<RecentPatientStack charts={charts} activeId="chart-vance" />);
    const tabs = screen.getAllByRole("tab");

    tabs[2]?.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(tabs[1]).toHaveFocus();

    await userEvent.keyboard("{ArrowUp}");
    expect(tabs[0]).toHaveFocus();
  });

  it("ignores a key it has no meaning for", async () => {
    const onReorder = vi.fn();
    render(<RecentPatientStack charts={charts} activeId="chart-vance" onReorder={onReorder} />);

    const tabs = screen.getAllByRole("tab");
    tabs[1]?.focus();
    await userEvent.keyboard("x");

    expect(tabs[1]).toHaveFocus();
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("moves a chart up as well as down", async () => {
    const onReorder = vi.fn();
    render(<RecentPatientStack charts={charts} activeId="chart-okonkwo" onReorder={onReorder} />);

    screen.getByRole("tab", { name: /L\. Marsh/ }).focus();
    await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");

    expect(onReorder.mock.calls[0]?.[0].map((c: OpenChart) => c.id)).toEqual([
      "chart-vance",
      "chart-okonkwo",
      "chart-marsh",
      "chart-boateng",
    ]);
  });

  it("shows the identifier in the panel for a similar pair, and not otherwise", () => {
    const lookalikes: OpenChart[] = [
      { id: "a", display: "J. Okonkwo", identifier: "093-441-208" },
      { id: "b", display: "J. Okonjo", identifier: "093-118-774" },
      { id: "c", display: "T. Boateng", identifier: "093-772-115" },
    ];

    const { container } = render(<RecentPatientStack charts={lookalikes} activeId="a" expanded />);

    const panel = container.querySelector(".zb-stack__panel");
    expect(panel).not.toBeNull();
    expect(panel?.textContent).toContain("093-441-208");
    expect(panel?.textContent).toContain("093-118-774");
    expect(panel?.textContent).not.toContain("093-772-115");
  });

  it("renders a panel row with no actions when the host wired none", () => {
    const { container } = render(
      <RecentPatientStack charts={charts} activeId="chart-okonkwo" expanded />,
    );
    expect(container.querySelector(".zb-stack__panel")).not.toBeNull();
    expect(container.querySelectorAll(".zb-stack__action")).toHaveLength(0);
  });

  it("offers no expand toggle when the host does not own the state", () => {
    render(<RecentPatientStack charts={charts} activeId="chart-okonkwo" />);
    expect(screen.queryByRole("button", { name: /charts$/ })).toBeNull();
  });

  it("says nothing about owed work when nothing is owed", () => {
    const { container } = render(
      <RecentPatientStack
        charts={[{ id: "x", display: "X" }]}
        activeId="x"
        now={NOW}
        onExpandedChange={vi.fn()}
      />,
    );
    expect(container.querySelector(".zb-stack__owed")).toBeNull();
  });

  it("counts unsigned notes with no since, without claiming an age", () => {
    expect(describeWork([{ id: "x", display: "X", work: [{ kind: "unsigned-note" }] }], NOW)).toBe(
      "1 unsigned note",
    );
  });

  it("reports hours rather than days for a note owed this morning", () => {
    expect(
      describeWork(
        [
          {
            id: "x",
            display: "X",
            work: [{ kind: "unsigned-note", since: "2026-08-24T04:00:00Z" }],
          },
        ],
        NOW,
      ),
    ).toBe("1 unsigned note, oldest 6 h");
  });
});

describe("the spoken chart", () => {
  it("names the patient, the reason and what is owed", () => {
    expect(describeChart(charts[1] as OpenChart)).toBe(
      "T. Boateng. Discharge summary. Unsigned note.",
    );
  });

  it("adds the identifier only when asked", () => {
    expect(describeChart(charts[0] as OpenChart)).not.toContain("093-441-208");
    expect(describeChart(charts[0] as OpenChart, { showIdentifier: true })).toContain(
      "093-441-208",
    );
  });

  it("says a chart is pinned", () => {
    expect(describeChart(charts[3] as OpenChart)).toContain("Pinned");
  });

  it("counts repeated work of the same kind", () => {
    expect(
      describeChart({
        id: "x",
        display: "X",
        work: [{ kind: "unsigned-note" }, { kind: "unsigned-note" }],
      }),
    ).toContain("2 unsigned notes");
  });
});
