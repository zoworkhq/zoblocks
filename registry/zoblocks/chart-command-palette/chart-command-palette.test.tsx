/**
 * ChartCommandPalette — the three things that make a clinical palette
 * different from every other palette.
 *
 * It counts the people it may not name, it records the searches nobody
 * remembers making, and it refuses to run a consequential verb on the first
 * Enter. The suite is organised around the three, plus the keyboard model
 * that is the point of having one at all.
 */

import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ChartCommandPalette,
  KIND_ORDER,
  applyScope,
  auditFor,
  describeResults,
  describeWithheld,
  group,
  outcomeFor,
  rank,
  score,
  scoreItem,
  type PaletteItem,
} from "./chart-command-palette";

const items: PaletteItem[] = [
  { id: "phq", kind: "action", label: "Start PHQ-9", detail: "Assessment · 9 items" },
  { id: "safety", kind: "action", label: "Open safety plan" },
  {
    id: "order",
    kind: "action",
    label: "Order lithium level",
    argument: { label: "when" },
  },
  {
    id: "stop",
    kind: "action",
    label: "Discontinue lithium",
    significant: true,
  },
  {
    id: "sign",
    kind: "action",
    label: "Sign note",
    unavailable: { reason: "Offline" },
  },
  { id: "phq-doc", kind: "chart-resource", label: "PHQ-9 result, 12 Aug" },
  { id: "p-mine", kind: "patient", label: "A. Okonkwo", detail: "093-441-208" },
  { id: "p-other-1", kind: "patient", label: "A. Okonjo", detail: "093-118-774" },
  { id: "p-other-2", kind: "patient", label: "A. Okoro", detail: "093-772-115" },
  { id: "theme", kind: "setting", label: "Appearance and theme" },
];

const scope = { inScope: new Set(["p-mine"]), breakGlass: true };

/* ------------------------------------------------------------------ */
/* Claim 1 — counting the people it may not name                       */
/* ------------------------------------------------------------------ */

describe("treatment-relationship scoping", () => {
  it("names the patient in scope and counts the rest", () => {
    const results = applyScope(rank("oko", items), scope);

    expect(results.visible.filter((entry) => entry.item.kind === "patient")).toHaveLength(1);
    expect(results.visible[0]?.item.id).not.toBe("p-other-1");
    expect(results.withheld).toBe(2);
  });

  it("leaves everything that is not a patient alone", () => {
    const results = applyScope(rank("phq", items), scope);
    expect(results.withheld).toBe(0);
    expect(results.visible.map((entry) => entry.item.id)).toContain("phq");
  });

  it("scopes nothing when the host supplies no scope", () => {
    const results = applyScope(rank("oko", items), undefined);
    expect(results.withheld).toBe(0);
    expect(results.visible.filter((entry) => entry.item.kind === "patient")).toHaveLength(3);
  });

  it("says whether break-glass is even available to this role", () => {
    expect(describeWithheld(3, { inScope: new Set(), breakGlass: true })).toContain(
      "break-glass required",
    );
    expect(describeWithheld(3, { inScope: new Set() })).toContain("not available to your role");
    expect(describeWithheld(1, scope)).toContain("1 further match");
    expect(describeWithheld(0, scope)).toBeNull();
  });

  it("renders the count as a row inside the list, not as a footnote", async () => {
    const { container } = render(<ChartCommandPalette open items={items} scope={scope} />);

    expect(container.querySelector(".zb-palette__withheld")).toBeNull();
    await userEvent.type(screen.getByRole("combobox"), "oko");

    const row = container.querySelector(".zb-palette__withheld");
    // Immediately after the list, inside the same scroll region, where the
    // results would be. A reader who misses it concludes the search was empty.
    expect(row?.previousElementSibling).toBe(screen.getByRole("listbox"));
    expect(row?.textContent).toContain("2 further matches");
  });

  it("never names a withheld patient anywhere in the DOM", async () => {
    const { container } = render(<ChartCommandPalette open items={items} scope={scope} />);

    await userEvent.type(screen.getByRole("combobox"), "oko");

    expect(container.textContent).toContain("A. Okonkwo");
    expect(container.textContent).not.toContain("A. Okonjo");
    expect(container.textContent).not.toContain("A. Okoro");
    expect(container.textContent).toContain("2 further matches");
  });
});

/* ------------------------------------------------------------------ */
/* Claim 2 — recording the searches nobody remembers making            */
/* ------------------------------------------------------------------ */

describe("the audit record", () => {
  it("counts what was shown and what was withheld", () => {
    const results = applyScope(rank("oko", items), scope);
    expect(auditFor("oko", results, true)).toEqual({
      term: "oko",
      shown: 1,
      withheld: 2,
      empty: false,
    });
  });

  it("records a search that matched nobody, because that is still a search", () => {
    const results = applyScope(rank("zzzzz", items), scope);
    expect(auditFor("zzzzz", results, true)).toEqual({
      term: "zzzzz",
      shown: 0,
      withheld: 0,
      empty: true,
    });
  });

  it("records nothing when the patient index was never touched", () => {
    const results = applyScope(rank("theme", items), scope);
    // Not the same as matching zero patients: this term never reached the
    // index, so there is nothing to record.
    expect(auditFor("theme", results, false)).toBeNull();
  });

  describe("through the component", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("emits one settled record rather than one per keystroke", () => {
      const onSearchAudit = vi.fn();
      const { rerender } = render(
        <ChartCommandPalette open items={items} scope={scope} onSearchAudit={onSearchAudit} />,
      );

      const input = screen.getByRole("combobox");
      for (const value of ["o", "ok", "oko"]) {
        act(() => void fireEvent.change(input, { target: { value } }));
        act(() => void vi.advanceTimersByTime(100));
      }

      expect(onSearchAudit).not.toHaveBeenCalled();

      act(() => void vi.advanceTimersByTime(350));
      expect(onSearchAudit).toHaveBeenCalledTimes(1);
      expect(onSearchAudit).toHaveBeenCalledWith(
        expect.objectContaining({ term: "oko", shown: 1, withheld: 2 }),
      );

      rerender(
        <ChartCommandPalette open items={items} scope={scope} onSearchAudit={onSearchAudit} />,
      );
    });

    it("writes nothing for a term that never reached the patient index", () => {
      const onSearchAudit = vi.fn();
      render(
        <ChartCommandPalette
          open
          items={items.filter((item) => item.kind !== "patient")}
          onSearchAudit={onSearchAudit}
        />,
      );

      act(() => void fireEvent.change(screen.getByRole("combobox"), { target: { value: "phq" } }));
      act(() => void vi.advanceTimersByTime(400));

      // Not the same as an empty result: no patient source was consulted, so
      // there is no privacy event to record.
      expect(onSearchAudit).not.toHaveBeenCalled();
    });

    it("records the empty search too", () => {
      const onSearchAudit = vi.fn();
      render(
        <ChartCommandPalette open items={items} scope={scope} onSearchAudit={onSearchAudit} />,
      );

      act(
        () => void fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzzzz" } }),
      );
      act(() => void vi.advanceTimersByTime(400));

      expect(onSearchAudit).toHaveBeenCalledWith(expect.objectContaining({ empty: true }));
    });
  });
});

/* ------------------------------------------------------------------ */
/* Claim 3 — the second Enter                                          */
/* ------------------------------------------------------------------ */

describe("running an item", () => {
  const stop = items.find((item) => item.id === "stop") as PaletteItem;
  const order = items.find((item) => item.id === "order") as PaletteItem;
  const sign = items.find((item) => item.id === "sign") as PaletteItem;
  const phq = items.find((item) => item.id === "phq") as PaletteItem;

  it("runs an ordinary action straight away", () => {
    expect(outcomeFor(phq)).toEqual({ kind: "run" });
  });

  it("asks for a second Enter on a significant one", () => {
    const outcome = outcomeFor(stop);
    expect(outcome.kind).toBe("confirm");
    if (outcome.kind !== "confirm") throw new Error("expected a confirm");
    expect(outcome.prompt).toContain("Enter again");
    expect(outcomeFor(stop, true)).toEqual({ kind: "run" });
  });

  it("asks for the argument before it will run the verb", () => {
    expect(outcomeFor(order)).toEqual({ kind: "argument", label: "when" });
  });

  it("blocks an unavailable action, and says why", () => {
    expect(outcomeFor(sign)).toEqual({ kind: "blocked", reason: "Offline" });
    // Even a confirmed one. Unavailable outranks everything.
    expect(outcomeFor(sign, true)).toEqual({ kind: "blocked", reason: "Offline" });
  });

  it("shows no confirmation until somebody has pressed Enter once", async () => {
    render(<ChartCommandPalette open items={items} onRun={vi.fn()} />);
    await userEvent.type(screen.getByRole("combobox"), "discontinue");
    expect(screen.queryByText(/press Enter again/i)).toBeNull();
  });

  it("does not run a significant action on the first Enter", async () => {
    const onRun = vi.fn();
    render(<ChartCommandPalette open items={items} onRun={onRun} />);

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "discontinue");
    await userEvent.keyboard("{Enter}");

    expect(onRun).not.toHaveBeenCalled();
    // The prompt appears after the first Enter, not on every significant row
    // from the moment it is listed.
    expect(screen.getByText(/press Enter again to confirm/i)).toBeInTheDocument();

    await userEvent.keyboard("{Enter}");
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ id: "stop" }));
  });

  it("forgets a pending confirmation when the selection moves", async () => {
    const onRun = vi.fn();
    render(<ChartCommandPalette open items={items} onRun={onRun} />);

    await userEvent.type(screen.getByRole("combobox"), "lithium");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    // Whatever is selected now, the earlier confirmation must not carry over.
    await userEvent.keyboard("{ArrowUp}");
    expect(screen.queryByText(/press Enter again/i)).toBeNull();
  });

  it("keeps the palette open for a verb that still needs its object", async () => {
    const onRun = vi.fn();
    const onClose = vi.fn();
    render(<ChartCommandPalette open items={items} onRun={onRun} onClose={onClose} />);

    const input = screen.getByRole("combobox") as HTMLInputElement;
    await userEvent.type(input, "order lith");
    await userEvent.keyboard("{Enter}");

    expect(onRun).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(input.value).toBe("Order lithium level ");
  });

  it("does nothing at all on an unavailable action", async () => {
    const onRun = vi.fn();
    const onClose = vi.fn();
    render(<ChartCommandPalette open items={items} onRun={onRun} onClose={onClose} />);

    await userEvent.type(screen.getByRole("combobox"), "sign note");
    await userEvent.keyboard("{Enter}");

    expect(onRun).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/* Ranking                                                             */
/* ------------------------------------------------------------------ */

describe("ranking", () => {
  it("puts actions above records, whatever the text match says", () => {
    const ranked = rank("phq", items);
    expect(ranked[0]?.item.id).toBe("phq");
  });

  it("keeps the group order stable", () => {
    expect([...KIND_ORDER]).toEqual([
      "action",
      "chart-resource",
      "patient",
      "template",
      "setting",
      "help",
    ]);
  });

  it("treats an empty term as no search at all", () => {
    // Matching everything would count every patient the user has no
    // relationship with, before a letter is typed — which discloses the size
    // of the index.
    expect(rank("", items)).toEqual([]);
    expect(rank("   ", items)).toEqual([]);
  });

  it("groups the results and drops the empty groups", () => {
    const grouped = group(rank("phq", items));
    expect(grouped.map((entry) => entry.kind)).toEqual(["action", "chart-resource"]);
  });

  it("keeps an unavailable action in the list, below its group", () => {
    const ranked = rank("sign", items);
    // Shown, not filtered: an action that vanishes teaches somebody the
    // feature does not exist.
    expect(ranked.map((entry) => entry.item.id)).toContain("sign");
  });

  it("does not let frequency outrank the group", () => {
    const ranked = rank("phq", [
      { id: "doc", kind: "chart-resource", label: "PHQ-9 result", frequency: 500 },
      { id: "run", kind: "action", label: "Start PHQ-9" },
    ]);
    expect(ranked[0]?.item.id).toBe("run");
  });

  it("uses frequency to break a tie inside a group", () => {
    const ranked = rank("note", [
      { id: "cold", kind: "action", label: "Sign note" },
      { id: "warm", kind: "action", label: "Sign note", frequency: 8 },
    ]);
    expect(ranked[0]?.item.id).toBe("warm");
  });

  it("matches keywords that are never shown", () => {
    const ranked = rank("depression", [
      { id: "phq", kind: "action", label: "Start PHQ-9", keywords: ["depression screen"] },
    ]);
    expect(ranked).toHaveLength(1);
  });
});

describe("the matcher", () => {
  it("prefers a prefix over a subsequence", () => {
    const prefix = score("sign", "Sign note");
    const scattered = score("sign", "Start the imaging note");
    expect(prefix).not.toBeNull();
    expect(scattered).not.toBeNull();
    expect(prefix as number).toBeGreaterThan(scattered as number);
  });

  it("rewards word starts, so sph finds Start PHQ-9", () => {
    const wanted = score("sph", "Start PHQ-9");
    const other = score("sph", "Sign the physiotherapy note");
    expect(wanted).not.toBeNull();
    expect(other).not.toBeNull();
    expect(wanted as number).toBeGreaterThan(other as number);
  });

  it("returns null rather than zero for no match", () => {
    expect(score("zzz", "Sign note")).toBeNull();
    expect(scoreItem("zzz", { id: "a", kind: "action", label: "Sign note" })).toBeNull();
  });

  it("is neutral on an empty term rather than refusing", () => {
    expect(score("", "anything")).toBe(0);
  });

  it("is case-insensitive in both directions", () => {
    expect(score("SIGN", "sign note")).not.toBeNull();
    expect(score("sign", "SIGN NOTE")).not.toBeNull();
  });

  it("breaks a tie towards the shorter label", () => {
    const short = score("sign", "Sign note") as number;
    const long = score("sign", "Sign note and close the encounter") as number;
    expect(short).toBeGreaterThan(long);
  });
});

/* ------------------------------------------------------------------ */
/* The keyboard and the tree                                           */
/* ------------------------------------------------------------------ */

describe("the keyboard model", () => {
  it("is a combobox pointing at its listbox and its active option", async () => {
    render(<ChartCommandPalette open items={items} />);

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "phq");

    const list = screen.getByRole("listbox", { name: "Results" });
    expect(input).toHaveAttribute("aria-controls", list.id);
    expect(input.getAttribute("aria-activedescendant")).toBe(`${list.id}-phq`);
  });

  it("moves the active option without moving focus", async () => {
    render(<ChartCommandPalette open items={items} />);

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "phq");
    await userEvent.keyboard("{ArrowDown}");

    // Focus never leaves the field a person is typing into.
    expect(input).toHaveFocus();
    expect(input.getAttribute("aria-activedescendant")).toBe(
      `${screen.getByRole("listbox").id}-phq-doc`,
    );
  });

  it("stops at the ends rather than wrapping into a surprise", async () => {
    render(<ChartCommandPalette open items={items} />);
    const input = screen.getByRole("combobox");

    await userEvent.type(input, "phq");
    await userEvent.keyboard("{ArrowUp}");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      `${screen.getByRole("listbox").id}-phq`,
    );
  });

  it("keeps an option active when the results shrink under it", async () => {
    const onRun = vi.fn();
    const { rerender } = render(<ChartCommandPalette open items={items} onRun={onRun} />);
    const input = screen.getByRole("combobox");

    await userEvent.type(input, "phq");
    await userEvent.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      `${screen.getByRole("listbox").id}-phq-doc`,
    );

    // Same query, fewer items: the highlight must not point past the end.
    rerender(
      <ChartCommandPalette
        open
        items={items.filter((item) => item.id !== "phq-doc")}
        onRun={onRun}
      />,
    );
    expect(input.getAttribute("aria-activedescendant")).toBe(
      `${screen.getByRole("listbox").id}-phq`,
    );
    await userEvent.keyboard("{Enter}");
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ id: "phq" }));
  });

  it("highlights the first result that arrives after arrowing an empty list", async () => {
    const { rerender } = render(<ChartCommandPalette open items={items} />);
    const input = screen.getByRole("combobox");

    await userEvent.type(input, "ferritin");
    await userEvent.keyboard("{ArrowDown}");
    rerender(
      <ChartCommandPalette
        open
        items={[...items, { id: "ferritin", kind: "chart-resource", label: "Ferritin, 14 Aug" }]}
      />,
    );
    expect(input.getAttribute("aria-activedescendant")).toBe(
      `${screen.getByRole("listbox").id}-ferritin`,
    );
  });

  it("accepts an argument with Tab", async () => {
    render(<ChartCommandPalette open items={items} />);
    const input = screen.getByRole("combobox") as HTMLInputElement;

    await userEvent.type(input, "order lith");
    await userEvent.tab();
    expect(input.value).toBe("Order lithium level ");
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    render(<ChartCommandPalette open items={items} onClose={onClose} />);

    await userEvent.type(screen.getByRole("combobox"), "phq");
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("returns focus to whatever opened it", async () => {
    function Host() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open palette
          </button>
          <ChartCommandPalette open={open} items={items} onClose={() => setOpen(false)} />
        </>
      );
    }

    render(<Host />);
    const opener = screen.getByRole("button", { name: "Open palette" });

    await userEvent.click(opener);
    expect(screen.getByRole("combobox")).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    // A palette that drops focus to the body has stranded the keyboard user it
    // exists for.
    expect(opener).toHaveFocus();
  });

  it("renders nothing at all when closed", () => {
    const { container } = render(<ChartCommandPalette open={false} items={items} />);
    expect(container).toBeEmptyDOMElement();
  });
});

/* ------------------------------------------------------------------ */
/* The pointer                                                         */
/*                                                                     */
/* The suite above is keyboard-only, which is the right emphasis for a  */
/* palette and left the mouse path entirely untested — including the    */
/* mousedown-not-click decision, which exists for a reason a reader     */
/* cannot verify by looking at it.                                     */
/* ------------------------------------------------------------------ */

describe("selecting with a pointer", () => {
  it("runs the row that was pressed, not the one that was highlighted", async () => {
    const onRun = vi.fn();
    const onClose = vi.fn();
    render(<ChartCommandPalette open items={items} onRun={onRun} onClose={onClose} />);

    await userEvent.type(screen.getByRole("combobox"), "o");
    const target = screen.getByRole("option", { name: /Open safety plan/ });
    await userEvent.click(target);

    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ id: "safety" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps the focus in the input, so the combobox does not lose its own selection", async () => {
    render(<ChartCommandPalette open items={items} onRun={vi.fn()} />);

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "phq");
    await userEvent.click(screen.getByRole("option", { name: /PHQ-9 result/ }));

    // Mousedown rather than click: click would blur the field first, and a
    // combobox with no focus has no activedescendant to act on.
    expect(input).toHaveFocus();
  });

  it("arms a significant action on the first press rather than running it", async () => {
    const onRun = vi.fn();
    render(<ChartCommandPalette open items={items} onRun={onRun} />);

    await userEvent.type(screen.getByRole("combobox"), "discontinue");
    const row = screen.getByRole("option", { name: /Discontinue lithium/ });

    await userEvent.click(row);
    expect(onRun).not.toHaveBeenCalled();
    expect(screen.getByText(/press Enter again to confirm/i)).toBeInTheDocument();

    await userEvent.click(row);
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ id: "stop" }));
  });

  it("does nothing when an unavailable row is pressed", async () => {
    const onRun = vi.fn();
    const onClose = vi.fn();
    render(<ChartCommandPalette open items={items} onRun={onRun} onClose={onClose} />);

    await userEvent.type(screen.getByRole("combobox"), "sign note");
    await userEvent.click(screen.getByRole("option", { name: /Sign note/ }));

    expect(onRun).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("accepts an argument on a press, keeping the palette open", async () => {
    const onRun = vi.fn();
    render(<ChartCommandPalette open items={items} onRun={onRun} />);

    const input = screen.getByRole("combobox") as HTMLInputElement;
    await userEvent.type(input, "order lith");
    await userEvent.click(screen.getByRole("option", { name: /Order lithium level/ }));

    expect(onRun).not.toHaveBeenCalled();
    expect(input.value).toBe("Order lithium level ");
  });
});

describe("the announcement", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("is debounced, so typing is not a running commentary", () => {
    render(<ChartCommandPalette open items={items} scope={scope} />);

    const region = document.querySelector('[aria-live="polite"]');
    const input = screen.getByRole("combobox");

    act(() => void fireEvent.change(input, { target: { value: "oko" } }));
    act(() => void vi.advanceTimersByTime(100));
    expect(region?.textContent).toBe("");

    act(() => void vi.advanceTimersByTime(350));
    expect(region?.textContent).toContain("2 further matches");
  });

  it("counts and names what it may not show", () => {
    const results = applyScope(rank("oko", items), scope);
    expect(describeResults(results, scope)).toContain("further matches");
    expect(describeResults({ visible: [], withheld: 0 })).toBe("No results.");
  });
});
