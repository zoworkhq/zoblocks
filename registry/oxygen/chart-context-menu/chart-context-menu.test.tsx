/**
 * ChartContextMenu — the suite is mostly a list of things that must not happen.
 *
 * The component's value is a set of refusals, so that is what is asserted:
 * a masked subject never yields its label, a disclosure never reaches `onRun`
 * without a recorded reason, a clinical action never runs on the first
 * activation, and an availability check that resolves never moves a row.
 *
 * Most of it runs against the pure core, which has no DOM and can therefore be
 * exhaustive rather than representative. The component tests cover the four
 * things the core cannot: the trigger contract, the keyboard, focus return,
 * and the three close paths that must each produce an audit record.
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ChartContextMenu,
  actionOutcome,
  appliesTo,
  bulkPartition,
  describeHiddenActions,
  describeSubject,
  disclosureRecord,
  focusableRows,
  matchFirstLetter,
  nextIndex,
  resolveMenu,
  tierOf,
  toPaletteItems,
  validateActions,
  type ChartMenuAction,
  type DisclosureRecord,
  type MenuSubject,
} from "./chart-context-menu";

const NOW = "2026-08-31T09:24:00-04:00";

const medication: MenuSubject = {
  resource: "MedicationRequest",
  id: "med-4471",
  label: "Lisinopril 10 mg",
  detail: "Oral · daily · started 4 Mar 2026",
};

const restrictedNote: MenuSubject = {
  resource: "DocumentReference",
  id: "doc-9911",
  label: "Group therapy note — Nwosu, C.",
  detail: "Signed by R. Adeyemi, LPC",
  masked: true,
};

const actions: ChartMenuAction[] = [
  { id: "open", label: "Open order", tier: "routine", shortcut: "↵" },
  { id: "copy", label: "Copy as text", tier: "routine" },
  {
    id: "mar",
    label: "Add a note to the MAR",
    tier: "documented",
    applies: ["MedicationRequest"],
    records: "Writes a note on the medication record. Nursing sees it at the next round.",
  },
  {
    id: "dc",
    label: "Discontinue",
    tier: "clinical",
    applies: ["MedicationRequest"],
    confirm: "The next scheduled dose is 14:00 today. Discontinuing stops it.",
    confirmVerb: "Discontinue",
  },
  {
    id: "renew",
    label: "Renew for 90 days",
    tier: "clinical",
    applies: ["MedicationRequest"],
    confirm: "Issues a new order in your name.",
    availability: { status: "unavailable", reason: "Prescriber role required" },
  },
  {
    id: "part2",
    label: "Reveal Part 2 content",
    tier: "disclosive",
    applies: ["MedicationRequest", "DocumentReference"],
    reasons: ["Treatment of this patient", "Medical emergency"],
  },
  {
    id: "delete",
    label: "Delete order",
    tier: "clinical",
    applies: ["MedicationRequest"],
    confirm: "Removes it entirely.",
    availability: { status: "withheld" },
  },
];

function open(action?: Partial<ChartMenuAction>) {
  return actions.map((candidate) =>
    action && candidate.id === action.id ? { ...candidate, ...action } : candidate,
  );
}

/* ------------------------------------------------------------------ */
/* Rule 1 — the subject                                                */
/* ------------------------------------------------------------------ */

describe("the menu states its subject", () => {
  it("names what was right-clicked", () => {
    expect(describeSubject(medication)).toEqual({
      who: "Lisinopril 10 mg",
      what: "Oral · daily · started 4 Mar 2026",
      masked: false,
      bulk: 1,
    });
  });

  it("falls back to the resource word when the row showed no detail", () => {
    expect(describeSubject({ resource: "Observation", id: "o1", label: "Potassium" }).what).toBe(
      "Result",
    );
  });

  it("counts a multiple selection rather than naming one member of it", () => {
    const line = describeSubject({
      ...medication,
      plural: "patients",
      also: [{ resource: "Patient", id: "p2" }],
    });
    expect(line.who).toBe("2 patients selected");
    /*
     * The defect this replaced: `detail` was the fallback, so the header read
     * "2 patients selected · Oral · daily" — one member's data at the top of a
     * menu whose whole job is to count rather than name.
     */
    expect(line.what).toBe("");
  });

  it("uses bulkDetail when the host gives one, because it is about the selection", () => {
    const line = describeSubject({
      ...medication,
      plural: "orders",
      bulkDetail: "Morning round",
      also: [{ resource: "MedicationRequest", id: "m2" }],
    });
    expect(line.what).toBe("Morning round");
  });

  it("the first focusable row is never the subject", () => {
    const rows = focusableRows(resolveMenu(medication, actions));
    expect(rows[0]!.action.id).toBe("open");
    expect(rows.some((row) => row.action.label === "Lisinopril 10 mg")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Rule 3 — the menu may not out-disclose its trigger                  */
/* ------------------------------------------------------------------ */

describe("a masked subject", () => {
  it("never yields its label, under any prop combination", () => {
    for (const policy of [{}, { role: "an RN" }, { permitted: ["open"] }, { breakGlass: true }]) {
      const serialised = JSON.stringify(resolveMenu(restrictedNote, actions, policy));
      expect(serialised).not.toContain("Nwosu");
      expect(serialised).not.toContain("Adeyemi");
    }
  });

  it("says what kind of record it is standing in for, and nothing more", () => {
    expect(describeSubject(restrictedNote)).toEqual({
      who: "Restricted record",
      what: "Document",
      masked: true,
      bulk: 1,
    });
  });

  it("does not render the label in the DOM either", async () => {
    const user = userEvent.setup();
    render(
      <ChartContextMenu subject={restrictedNote} actions={actions} now={NOW}>
        {(trigger) => (
          <div {...trigger} data-testid="row">
            Restricted record
          </div>
        )}
      </ChartContextMenu>,
    );
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    const menu = await screen.findByRole("menu");
    expect(menu.textContent).not.toContain("Nwosu");
    expect(within(menu).getByText("Restricted record")).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/* Rule 2 — consequence is a rank                                      */
/* ------------------------------------------------------------------ */

describe("consequence bands", () => {
  it("sorts consequence to the bottom and leaves declaration order alone inside a band", () => {
    const sections = resolveMenu(medication, actions).sections;
    expect(sections.map((section) => section.tier)).toEqual([
      "routine",
      "documented",
      "clinical",
      "disclosive",
    ]);
    expect(sections[0]!.items.map((row) => row.action.id)).toEqual(["open", "copy"]);
  });

  it("keeps a clinical verb out of the routine band however the array was written", () => {
    const shuffled = [actions[3]!, actions[0]!, actions[5]!, actions[1]!];
    const flat = focusableRows(resolveMenu(medication, shuffled)).map((row) => row.action.id);
    expect(flat.indexOf("dc")).toBeGreaterThan(flat.indexOf("copy"));
    expect(flat.indexOf("part2")).toBeGreaterThan(flat.indexOf("dc"));
  });

  it("honours group headings inside a band, in first-seen order", () => {
    const grouped: ChartMenuAction[] = [
      { id: "a", label: "A", tier: "routine", group: "Second" },
      { id: "b", label: "B", tier: "routine", group: "First" },
      { id: "c", label: "C", tier: "routine", group: "Second" },
    ];
    const sections = resolveMenu(medication, grouped).sections;
    expect(sections.map((section) => section.label)).toEqual(["Second", "First"]);
    expect(sections[0]!.items.map((row) => row.action.id)).toEqual(["a", "c"]);
  });

  it("never runs a clinical action on the first activation", () => {
    const dc = actions[3]!;
    expect(actionOutcome(dc)).toMatchObject({ kind: "confirm", verb: "Discontinue" });
    expect(actionOutcome(dc, { confirming: "dc" })).toEqual({ kind: "run" });
  });

  it("never runs a disclosure without a reason", () => {
    const part2 = actions[5]!;
    expect(actionOutcome(part2)).toMatchObject({ kind: "reason", waiting: false });
    expect(actionOutcome(part2, { reasoning: "part2" })).toMatchObject({ waiting: true });
    expect(actionOutcome(part2, { reasoning: "part2", reason: "Medical emergency" })).toEqual({
      kind: "run",
      reason: "Medical emergency",
    });
  });

  it("hands a recorded action its sentence, so the host can repeat it", () => {
    expect(actionOutcome(actions[2]!)).toMatchObject({ kind: "run", records: expect.any(String) });
  });

  it("defaults an unrecognised tier to routine rather than to the safest one", () => {
    // Safest-by-default would silently promote a copy to a two-step
    // confirmation the author never wrote a sentence for.
    expect(tierOf({ tier: "nonsense" as never })).toBe("routine");
  });
});

/* ------------------------------------------------------------------ */
/* Availability                                                        */
/* ------------------------------------------------------------------ */

describe("availability", () => {
  it("counts what policy withholds instead of listing it", () => {
    const resolved = resolveMenu(medication, actions, { permitted: ["open", "copy"] });
    expect(resolved.withheld).toBe(5);
    expect(focusableRows(resolved).map((row) => row.action.id)).toEqual(["open", "copy"]);
  });

  it("counts a withheld availability as well as an absent permission", () => {
    expect(resolveMenu(medication, actions).withheld).toBe(1);
  });

  it("says nothing at all when nothing was withheld", () => {
    // An empty live region announces nothing, so there must be no empty row.
    expect(describeHiddenActions(0)).toBeNull();
  });

  it("names the role and the override when there is one", () => {
    expect(describeHiddenActions(3, { role: "a registered nurse", breakGlass: true })).toBe(
      "3 further actions on this record, hidden for a registered nurse — break-glass required",
    );
    expect(describeHiddenActions(1)).toBe("1 further action on this record, hidden by your role");
  });

  it("keeps an unavailable row in its band, with its reason", () => {
    const rows = focusableRows(resolveMenu(medication, actions));
    const renew = rows.find((row) => row.action.id === "renew")!;
    expect(renew.availability).toEqual({
      status: "unavailable",
      reason: "Prescriber role required",
    });
  });

  it("blocks a pending row rather than letting a fast Enter land on it", () => {
    expect(actionOutcome({ ...actions[0]!, availability: { status: "pending" } })).toEqual({
      kind: "blocked",
      reason: "Still checking whether this can run",
    });
  });

  it("resolving a pending check does not move any row", () => {
    const pending = open({ id: "mar", availability: { status: "pending" } });
    const before = focusableRows(resolveMenu(medication, pending)).map((row) => row.action.id);
    const after = focusableRows(resolveMenu(medication, actions)).map((row) => row.action.id);
    expect(before).toEqual(after);
  });

  it("drops a verb that does not belong on this noun, silently", () => {
    expect(appliesTo(actions[2]!, medication)).toBe(true);
    expect(appliesTo(actions[2]!, { resource: "Patient", id: "p", label: "A" })).toBe(false);
    expect(resolveMenu({ resource: "Patient", id: "p", label: "A" }, actions).withheld).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* Bulk                                                                */
/* ------------------------------------------------------------------ */

describe("a multiple selection", () => {
  const twelve: MenuSubject = {
    ...medication,
    plural: "orders",
    also: Array.from({ length: 11 }, (_, index) => ({
      resource: "MedicationRequest",
      id: `m-${index}`,
    })),
  };

  it("disables a verb that is not bulk-safe rather than hiding it", () => {
    const rows = focusableRows(resolveMenu(twelve, actions));
    expect(rows.map((row) => row.action.id)).toContain("dc");
    expect(rows.find((row) => row.action.id === "dc")!.availability).toEqual({
      status: "unavailable",
      reason: "Not available for a multiple selection",
    });
  });

  it("leaves a bulk-safe verb alone", () => {
    const rows = focusableRows(resolveMenu(twelve, open({ id: "copy", bulk: "allowed" })));
    expect(rows.find((row) => row.action.id === "copy")!.availability.status).toBe("available");
  });

  it("interpolates the count into the bulk confirmation", () => {
    const bulkSafe = { ...actions[3]!, bulk: "allowed" as const, bulkConfirm: "Stops {n} orders." };
    expect(actionOutcome(bulkSafe, {}, 12)).toMatchObject({ bulkPrompt: "Stops 12 orders." });
  });

  it("partitions once, so a toolbar and a menu cannot disagree", () => {
    const { allowed, single } = bulkPartition(open({ id: "copy", bulk: "allowed" }), medication);
    expect(allowed.map((action) => action.id)).toEqual(["copy"]);
    expect(single.length).toBe(6);
  });
});

/* ------------------------------------------------------------------ */
/* The disclosure record                                               */
/* ------------------------------------------------------------------ */

describe("the disclosure record", () => {
  it("never carries the subject's label", () => {
    const record = disclosureRecord(actions[5]!, restrictedNote, { now: NOW, outcome: "offered" });
    expect(JSON.stringify(record)).not.toContain("Nwosu");
    expect(record).toEqual({
      at: NOW,
      action: "part2",
      subject: { resource: "DocumentReference", id: "doc-9911" },
      subjectNamed: false,
      masked: true,
      reason: null,
      outcome: "offered",
      breakGlass: false,
    });
  });

  it("is null for anything that is not a disclosure", () => {
    expect(disclosureRecord(actions[3]!, medication, { now: NOW, outcome: "offered" })).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Keyboard model                                                      */
/* ------------------------------------------------------------------ */

describe("the keyboard model", () => {
  const rows = focusableRows(
    resolveMenu(medication, open({ id: "copy", availability: { status: "pending" } })),
  );

  it("skips a row whose availability is unknown", () => {
    expect(rows[1]!.action.id).toBe("copy");
    expect(nextIndex(rows, 0, 1)).toBe(2);
  });

  it("keeps an unavailable row reachable, so its reason can be read", () => {
    const ids = rows.map((row) => row.action.id);
    let index = -1;
    const visited: string[] = [];
    for (let step = 0; step < ids.length; step += 1) {
      index = nextIndex(rows, index, 1, false);
      visited.push(rows[index]!.action.id);
    }
    expect(visited).toContain("renew");
  });

  it("wraps only when asked to", () => {
    expect(nextIndex(rows, rows.length - 1, 1, true)).toBe(0);
    expect(nextIndex(rows, rows.length - 1, 1, false)).toBe(rows.length - 1);
  });

  it("matches the first letter, forwards, wrapping", () => {
    const plain = focusableRows(resolveMenu(medication, actions));
    const target = plain.findIndex((row) => row.action.label.startsWith("R"));
    expect(matchFirstLetter(plain, "r", -1)).toBe(target);
  });
});

/* ------------------------------------------------------------------ */
/* The author-side rules                                               */
/* ------------------------------------------------------------------ */

describe("validateActions", () => {
  it("passes a well-formed list", () => {
    expect(validateActions(actions)).toEqual([]);
  });

  it("refuses a clinical action with no confirmation sentence", () => {
    const [problem] = validateActions([
      { id: "x", label: "Stop", tier: "clinical", applies: ["A"] },
    ]);
    expect(problem).toContain("`confirm`");
  });

  it("refuses a recorded action that never says what it writes", () => {
    expect(
      validateActions([{ id: "x", label: "File", tier: "documented", applies: ["A"] }])[0],
    ).toContain("`records`");
  });

  it("refuses an empty reason list", () => {
    const problems = validateActions([
      { id: "x", label: "Reveal", tier: "disclosive", applies: ["A"], reasons: [] },
    ]);
    expect(problems.join(" ")).toContain("no recorded justification");
  });

  it("refuses a consequential verb with no `applies`, which would offer it everywhere", () => {
    expect(
      validateActions([{ id: "x", label: "Stop", tier: "clinical", confirm: "Stops it." }]).join(
        " ",
      ),
    ).toContain("every resource in the chart");
  });

  it("refuses a toggle above routine", () => {
    expect(
      validateActions([
        {
          id: "x",
          label: "Lock",
          tier: "clinical",
          kind: "checkbox",
          confirm: "…",
          applies: ["A"],
        },
      ]).join(" "),
    ).toContain("may not be a clinical act");
  });

  it("refuses a disclosure offered in bulk", () => {
    expect(
      validateActions([
        {
          id: "x",
          label: "Reveal",
          tier: "disclosive",
          applies: ["A"],
          reasons: ["e"],
          bulk: "allowed",
        },
      ]).join(" "),
    ).toContain("one justification");
  });

  it("refuses a bulk-safe clinical action with a confirmation written for one", () => {
    expect(
      validateActions([
        { id: "x", label: "Stop", tier: "clinical", applies: ["A"], confirm: "…", bulk: "allowed" },
      ]).join(" "),
    ).toContain("bulkConfirm");
  });

  it("refuses anything above routine inside a submenu", () => {
    expect(
      validateActions([
        {
          id: "x",
          label: "Trend",
          tier: "routine",
          submenu: [{ id: "y", label: "Stop", tier: "clinical", confirm: "…", applies: ["A"] }],
        },
      ]).join(" "),
    ).toContain("safe triangle");
  });

  it("catches a duplicate id", () => {
    expect(
      validateActions([
        { id: "x", label: "A", tier: "routine" },
        { id: "x", label: "B", tier: "routine" },
      ])[0],
    ).toContain("Duplicate");
  });
});

/* ------------------------------------------------------------------ */
/* The palette adapter                                                 */
/* ------------------------------------------------------------------ */

describe("toPaletteItems", () => {
  it("marks everything above routine as significant, so ⌘K asks twice too", () => {
    const items = toPaletteItems(actions, medication);
    expect(items.find((item) => item.id === "copy")!.significant).toBe(false);
    expect(items.find((item) => item.id === "dc")!.significant).toBe(true);
  });

  it("carries the subject, so two identical verbs are not a coin toss", () => {
    expect(toPaletteItems(actions, medication)[0]!.detail).toBe("Lisinopril 10 mg");
  });

  it("does not name a masked subject there either", () => {
    expect(JSON.stringify(toPaletteItems(actions, restrictedNote))).not.toContain("Nwosu");
  });
});

/* ------------------------------------------------------------------ */
/* The component                                                       */
/* ------------------------------------------------------------------ */

function Row(props: Partial<React.ComponentProps<typeof ChartContextMenu>>) {
  return (
    <ChartContextMenu subject={medication} actions={actions} now={NOW} {...props}>
      {(trigger) => (
        <div {...trigger} data-testid="row">
          Lisinopril 10 mg
        </div>
      )}
    </ChartContextMenu>
  );
}

describe("the trigger contract", () => {
  it("opens on right-click", async () => {
    const user = userEvent.setup();
    render(<Row />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    expect(await screen.findByRole("menu")).toBeTruthy();
  });

  it("opens on Shift+F10, because a right-click-only feature fails SC 2.1.1", async () => {
    const user = userEvent.setup();
    render(<Row />);
    screen.getByTestId("row").focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    expect(await screen.findByRole("menu")).toBeTruthy();
  });

  it("opens on the Menu key, which is the other half of the same gesture", async () => {
    const user = userEvent.setup();
    render(<Row />);
    screen.getByTestId("row").focus();
    await user.keyboard("{ContextMenu}");
    expect(await screen.findByRole("menu")).toBeTruthy();
  });

  it("lets the browser's own menu through when disabled", async () => {
    const user = userEvent.setup();
    render(<Row disabled />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("announces the count and what is hidden, once, on open", async () => {
    const user = userEvent.setup();
    render(<Row policy={{ role: "a registered nurse" }} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    const menu = await screen.findByRole("menu");
    expect(menu.querySelector("[aria-live]")!.textContent).toBe(
      "6 actions for Lisinopril 10 mg, 1 hidden",
    );
  });
});

describe("names, roles and the second step", () => {
  it("names the popup after its subject", async () => {
    const user = userEvent.setup();
    render(<Row />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    const menu = await screen.findByRole("menu");
    const labelledBy = menu.getAttribute("aria-labelledby")!;
    expect(document.getElementById(labelledBy)!.textContent).toContain("Lisinopril 10 mg");
  });

  it("renders the subject header first and never as a menu item", async () => {
    const user = userEvent.setup();
    render(<Row />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    const menu = await screen.findByRole("menu");
    expect(menu.firstElementChild!.className).toContain("ox-menu__subject");
    for (const item of within(menu).getAllByRole("menuitem")) {
      expect(item.textContent).not.toContain("Lisinopril");
    }
  });

  it("does not run a clinical action on the first click", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<Row onRun={onRun} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.click(await screen.findByRole("menuitem", { name: /Discontinue/ }));
    expect(onRun).not.toHaveBeenCalled();
    expect(screen.getByText(/next scheduled dose is 14:00/)).toBeTruthy();
  });

  it("runs it on the second, and closes", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<Row onRun={onRun} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.click(await screen.findByRole("menuitem", { name: /Discontinue/ }));
    await user.click(screen.getByRole("button", { name: "Discontinue" }));
    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onRun.mock.calls[0]![0].id).toBe("dc");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("keeps the record when Keep is chosen", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<Row onRun={onRun} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.click(await screen.findByRole("menuitem", { name: /Discontinue/ }));
    await user.click(screen.getByRole("button", { name: "Keep" }));
    expect(onRun).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("reports a blocked verb with its reason rather than staying silent", async () => {
    const user = userEvent.setup();
    const onBlocked = vi.fn();
    render(<Row onBlocked={onBlocked} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.click(await screen.findByRole("menuitem", { name: /Renew/ }));
    expect(onBlocked).toHaveBeenCalledWith(
      expect.objectContaining({ id: "renew" }),
      "Prescriber role required",
    );
  });

  it("shows the reason as text, not as a tooltip a keyboard cannot reach", async () => {
    const user = userEvent.setup();
    render(<Row />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    const row = await screen.findByRole("menuitem", { name: /Renew/ });
    expect(row.getAttribute("aria-disabled")).toBe("true");
    expect(row.textContent).toContain("Prescriber role required");
    expect(row.getAttribute("title")).toBeNull();
  });

  it("puts the withheld count inside the menu", async () => {
    const user = userEvent.setup();
    render(<Row policy={{ role: "a registered nurse", breakGlass: true }} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    const menu = await screen.findByRole("menu");
    expect(menu.textContent).toContain("break-glass required");
  });
});

describe("the audit symmetry", () => {
  async function offerDisclosure() {
    const onDisclose = vi.fn<(record: DisclosureRecord) => void>();
    const user = userEvent.setup();
    render(<Row onDisclose={onDisclose} policy={{ breakGlass: true }} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.click(await screen.findByRole("menuitem", { name: /Reveal Part 2/ }));
    return { user, onDisclose };
  }

  it("records the offer the moment the reasons are drawn", async () => {
    const { onDisclose } = await offerDisclosure();
    expect(onDisclose).toHaveBeenCalledTimes(1);
    expect(onDisclose.mock.calls[0]![0]).toMatchObject({ outcome: "offered", breakGlass: true });
  });

  it("records the disclosure and its reason when one is chosen", async () => {
    const onDisclose = vi.fn();
    const onRun = vi.fn();
    const user = userEvent.setup();
    render(<Row onDisclose={onDisclose} onRun={onRun} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.click(await screen.findByRole("menuitem", { name: /Reveal Part 2/ }));
    await user.click(screen.getByRole("button", { name: "Medical emergency" }));
    expect(onDisclose.mock.calls.at(-1)![0]).toMatchObject({
      outcome: "disclosed",
      reason: "Medical emergency",
    });
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("records an abandonment on Escape", async () => {
    const { user, onDisclose } = await offerDisclosure();
    await user.keyboard("{Escape}");
    expect(onDisclose).toHaveBeenCalledTimes(2);
    expect(onDisclose.mock.calls[1]![0]).toMatchObject({ outcome: "abandoned" });
  });

  it("records an abandonment on a click away, which is the path everyone forgets", async () => {
    const { user, onDisclose } = await offerDisclosure();
    await user.click(document.body);
    expect(onDisclose.mock.calls.at(-1)![0]).toMatchObject({ outcome: "abandoned" });
  });

  it("does not reach onRun without a reason", async () => {
    const onRun = vi.fn();
    const user = userEvent.setup();
    render(<Row onRun={onRun} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.click(await screen.findByRole("menuitem", { name: /Reveal Part 2/ }));
    await user.keyboard("{Escape}");
    expect(onRun).not.toHaveBeenCalled();
  });
});

describe("focus and dismissal", () => {
  it("returns focus to the trigger on Escape", async () => {
    const user = userEvent.setup();
    render(<Row />);
    const row = screen.getByTestId("row");
    row.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(row);
  });

  it("returns focus to the trigger after running an item", async () => {
    const user = userEvent.setup();
    render(<Row />);
    const row = screen.getByTestId("row");
    await user.pointer({ keys: "[MouseRight]", target: row });
    await user.click(await screen.findByRole("menuitem", { name: /Open order/ }));
    expect(document.activeElement).toBe(row);
  });

  it("does not steal focus when the reader clicks elsewhere", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Row />
        <button type="button">Elsewhere</button>
      </>,
    );
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await screen.findByRole("menu");
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).not.toBe(screen.getByTestId("row"));
  });

  it("moves the highlight with the arrows and opens on the first verb from a keyboard", async () => {
    const user = userEvent.setup();
    render(<Row />);
    screen.getByTestId("row").focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await screen.findByRole("menu");
    expect(document.activeElement!.textContent).toContain("Open order");
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement!.textContent).toContain("Copy as text");
  });

  it("does not pre-arm a row when a pointer opened it", async () => {
    const user = userEvent.setup();
    render(<Row />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    const menu = await screen.findByRole("menu");
    expect(document.activeElement).toBe(menu);
  });
});

describe("view state", () => {
  const toggles: ChartMenuAction[] = [
    { id: "pin", label: "Pin this column", tier: "routine", kind: "checkbox", checked: true },
    { id: "abn", label: "Abnormal only", tier: "routine", kind: "checkbox", checked: false },
  ];

  it("reports through onToggle and leaves the menu open", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onRun = vi.fn();
    render(<Row actions={toggles} onToggle={onToggle} onRun={onRun} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.click(await screen.findByRole("menuitemcheckbox", { name: /Abnormal only/ }));
    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ id: "abn" }), true);
    expect(onRun).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("exposes the checked state", async () => {
    const user = userEvent.setup();
    render(<Row actions={toggles} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    expect(
      (await screen.findByRole("menuitemcheckbox", { name: /Pin this column/ })).getAttribute(
        "aria-checked",
      ),
    ).toBe("true");
  });
});

describe("the two empty states, which read differently on purpose", () => {
  it("says the record supports nothing", async () => {
    const user = userEvent.setup();
    render(<Row actions={[]} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    expect((await screen.findByRole("menu")).textContent).toContain(
      "This record supports no actions",
    );
  });

  it("says nothing is available to you when everything was withheld", async () => {
    const user = userEvent.setup();
    render(<Row policy={{ permitted: [] }} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    expect((await screen.findByRole("menu")).textContent).toContain(
      "No action on this record is available to you",
    );
  });
});

/* ------------------------------------------------------------------ */
/* Submenus                                                            */
/* ------------------------------------------------------------------ */

/*
 * These exist because the first version of this component shipped `submenu` as
 * a decoration: it drew a chevron, set `aria-haspopup="menu"`, and then ran the
 * *parent* as a command. The story asserted the ARIA attribute and passed, and
 * `meta.limitations` described an intent delay that was not there — a
 * capability declared, documented and absent. So the first assertion below is
 * the one that matters: choosing a row with children must not call `onRun`.
 */

const trendActions: ChartMenuAction[] = [
  { id: "open", label: "Open result", tier: "routine" },
  {
    id: "trend",
    label: "Trend",
    tier: "routine",
    submenu: [
      { id: "t7", label: "Last 7 days", tier: "routine" },
      { id: "t30", label: "Last 30 days", tier: "routine" },
    ],
  },
];

describe("a row with children is not a command", () => {
  it("returns a submenu outcome rather than run", () => {
    const trend = trendActions[1];
    expect(actionOutcome(trend!)).toMatchObject({ kind: "submenu" });
  });

  it("does not call onRun when the trigger is chosen", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<Row actions={trendActions} onRun={onRun} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.click(await screen.findByRole("menuitem", { name: /Trend/ }));

    expect(onRun).not.toHaveBeenCalled();
    // And the parent stays open — a submenu that closed its parent would be a
    // menu you cannot get back to.
    expect(screen.getAllByRole("menu").length).toBe(2);
  });

  it("renders the children, named by the row that owns them", async () => {
    const user = userEvent.setup();
    render(<Row actions={trendActions} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.click(await screen.findByRole("menuitem", { name: /Trend/ }));

    const child = screen.getAllByRole("menu")[1];
    expect(within(child!).getByRole("menuitem", { name: "Last 7 days" })).toBeTruthy();
    const labelledBy = child!.getAttribute("aria-labelledby");
    expect(document.getElementById(labelledBy!)?.textContent).toContain("Trend");
  });

  it("says on the trigger whether its menu is open", async () => {
    const user = userEvent.setup();
    render(<Row actions={trendActions} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    const trigger = await screen.findByRole("menuitem", { name: /Trend/ });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("runs a child and closes everything", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<Row actions={trendActions} onRun={onRun} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.click(await screen.findByRole("menuitem", { name: /Trend/ }));
    await user.click(screen.getByRole("menuitem", { name: "Last 30 days" }));

    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onRun.mock.calls[0]![0].id).toBe("t30");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens on ArrowRight and closes on ArrowLeft, one level at a time", async () => {
    const user = userEvent.setup();
    render(<Row actions={trendActions} />);
    screen.getByTestId("row").focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await screen.findByRole("menu");

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toContain("Trend");
    await user.keyboard("{ArrowRight}");
    expect(screen.getAllByRole("menu").length).toBe(2);
    // A keyboard open is a commitment, so it takes focus.
    expect(document.activeElement?.textContent).toContain("Last 7 days");

    await user.keyboard("{ArrowLeft}");
    expect(screen.getAllByRole("menu").length).toBe(1);
    expect(document.activeElement?.textContent).toContain("Trend");
  });

  it("closes the child on Escape and leaves the parent open", async () => {
    const user = userEvent.setup();
    render(<Row actions={trendActions} />);
    screen.getByTestId("row").focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await screen.findByRole("menu");
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(screen.getAllByRole("menu").length).toBe(2);

    await user.keyboard("{Escape}");
    expect(screen.getAllByRole("menu").length).toBe(1);
    // A second Escape takes the parent down, not both at once.
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("refuses an empty submenu at author time", () => {
    expect(
      validateActions([{ id: "x", label: "Trend", tier: "routine", submenu: [] }]).join(" "),
    ).toContain("nothing in it");
  });
});
