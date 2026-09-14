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
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
    expect(menu.firstElementChild!.className).toContain("zb-menu__subject");
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

/* ------------------------------------------------------------------ */
/* The tier has to be visible without the host's help                  */
/* ------------------------------------------------------------------ */

/*
 * `meta.a11yChecks` claims for SC 1.4.1 that every tier carries "a glyph, a
 * band position and a word as well as a hue". It did not. The tier colour is
 * painted on the icon slot, and the icon was entirely the host's to supply —
 * so a host that passed none, the docs demo among them, got a menu where
 * `Discontinue` and `Copy as text` were typographically identical and the only
 * difference was which side of a rule they sat on. The claim was true of the
 * CSS and false of every actual menu.
 */
describe("consequence is visible even when the host supplies no icons", () => {
  const bare: ChartMenuAction[] = [
    { id: "copy", label: "Copy", tier: "routine" },
    {
      id: "note",
      label: "Note it",
      tier: "documented",
      applies: ["MedicationRequest"],
      records: "Writes.",
    },
    {
      id: "stop",
      label: "Stop it",
      tier: "clinical",
      applies: ["MedicationRequest"],
      confirm: "Stops it.",
    },
    {
      id: "reveal",
      label: "Reveal",
      tier: "disclosive",
      applies: ["MedicationRequest"],
      reasons: ["Care"],
    },
  ];

  async function open() {
    const user = userEvent.setup();
    render(<Row actions={bare} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    return within(await screen.findByRole("menu"));
  }

  it("draws a mark on every row that costs something", async () => {
    const menu = await open();
    for (const name of [/Note it/, /Stop it/, /Reveal/]) {
      const row = menu.getByRole("menuitem", { name });
      const icon = row.querySelector(".zb-menu__icon");
      expect(icon?.querySelector("svg"), `${name} has no glyph`).toBeTruthy();
    }
  });

  it("leaves a routine row unmarked, so the mark means something", async () => {
    const menu = await open();
    const row = menu.getByRole("menuitem", { name: /Copy/ });
    expect(row.querySelector(".zb-menu__icon svg")).toBeNull();
    // The slot is still there, so every label starts at the same x.
    expect(row.querySelector(".zb-menu__icon")).toBeTruthy();
  });

  it("lets the host's own icon win", async () => {
    const user = userEvent.setup();
    render(<Row actions={[{ ...bare[2]!, icon: <svg data-testid="host-icon" /> }]} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    const menu = within(await screen.findByRole("menu"));
    expect(menu.getByTestId("host-icon")).toBeTruthy();
  });

  it("names the subject's kind with a glyph rather than a stray initial", async () => {
    const user = userEvent.setup();
    render(<Row actions={bare} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    const menu = await screen.findByRole("menu");
    const avatar = menu.querySelector(".zb-menu__avatar");
    // A medication is not a person, and "M" in a circle reads as one.
    expect(avatar?.querySelector("svg")).toBeTruthy();
    expect(avatar?.textContent).toBe("");
  });

  it("still shows initials for a person", async () => {
    const user = userEvent.setup();
    render(
      <ChartContextMenu
        subject={{ resource: "Patient", id: "p1", label: "Aluel Okonkwo" }}
        actions={[bare[0]!]}
        now={NOW}
      >
        {(t) => (
          <div {...t} data-testid="row">
            row
          </div>
        )}
      </ChartContextMenu>,
    );
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    const menu = await screen.findByRole("menu");
    expect(menu.querySelector(".zb-menu__avatar")?.textContent).toBe("AO");
  });
});

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

/*
 * jsdom has no layout, so every measurement here is supplied by hand: a 240px
 * menu in the default 1024 × 768 viewport. What is asserted is where the popup
 * goes relative to the pointer or the row, which is the part a reader sees.
 */

function rectAt(top: number, left: number, height = 30, width = 360): DOMRect {
  return {
    top,
    left,
    bottom: top + height,
    right: left + width,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function measureMenus(width = 240, height = 0) {
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains("zb-menu") ? width : 0;
  });
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains("zb-menu") ? height : 0;
  });
}

const originOf = (menu: HTMLElement) => menu.style.getPropertyValue("--zb-menu-origin");

describe("where the popup goes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens to the left of the cursor near the right edge, rather than under it", () => {
    measureMenus();
    render(<Row />);
    fireEvent.contextMenu(screen.getByTestId("row"), { clientX: 900, clientY: 100 });
    const menu = screen.getByRole("menu");
    expect(originOf(menu)).toBe("top right");
    // The menu's right edge sits at the cursor: 900 - 240 + the 3px inset.
    expect(menu.style.left).toBe("663px");
  });

  it("opens upward near the bottom edge, anchored by its bottom so the cursor lands on nothing", () => {
    measureMenus();
    render(<Row />);
    fireEvent.contextMenu(screen.getByTestId("row"), { clientX: 100, clientY: 700 });
    const menu = screen.getByRole("menu");
    expect(originOf(menu)).toBe("bottom left");
    expect(menu.style.top).toBe("");
    // Its bottom edge is a padding above the cursor, not on it.
    expect(menu.style.bottom).toBe("76px");
  });

  it("flips a keyboard-opened menu above its row, never on top of where focus returns", async () => {
    measureMenus();
    const user = userEvent.setup();
    render(<Row />);
    const row = screen.getByTestId("row");
    row.getBoundingClientRect = () => rectAt(700, 40);
    row.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    const menu = await screen.findByRole("menu");
    expect(originOf(menu)).toBe("bottom left");
    expect(menu.style.bottom).toBe("72px");
  });

  it("puts a child menu on the other side, bottom-anchored, when its row is in the corner", async () => {
    measureMenus();
    const user = userEvent.setup();
    render(<Row actions={trendActions} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    const trend = await screen.findByRole("menuitem", { name: /Trend/ });
    trend.getBoundingClientRect = () => rectAt(700, 800, 30, 200);
    await user.click(trend);

    const child = screen.getAllByRole("menu")[1]!;
    expect(originOf(child)).toBe("bottom right");
    expect(child.style.left).toBe("564px");
    expect(child.style.bottom).toBe("8px");
  });

  it("follows its row when the page scrolls, and closes when the viewport resizes", () => {
    measureMenus();
    const onOpenChange = vi.fn();
    render(<Row onOpenChange={onOpenChange} />);
    const row = screen.getByTestId("row");
    fireEvent.contextMenu(row, { clientX: 100, clientY: 100 });
    const menu = screen.getByRole("menu");
    expect(menu.style.top).toBe("97px");

    row.getBoundingClientRect = () => rectAt(-50, 0);
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    // Still open, and still at the same point inside the row.
    expect(screen.getByRole("menu").style.top).toBe("47px");

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(false, medication);
    // A reflow is not the reader choosing to go back to the row.
    expect(document.activeElement).not.toBe(row);
  });

  it("still places the popup where there is no animation frame to measure in", () => {
    measureMenus();
    vi.stubGlobal("requestAnimationFrame", undefined);
    try {
      render(<Row />);
      fireEvent.contextMenu(screen.getByTestId("row"), { clientX: 100, clientY: 100 });
      const menu = screen.getByRole("menu");
      expect(menu.style.visibility).toBe("");
      expect(menu.style.top).toBe("97px");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("positions inside a bounded container rather than against the viewport", async () => {
    measureMenus(240, 200);
    const user = userEvent.setup();
    const pane = document.createElement("div");
    document.body.append(pane);
    pane.getBoundingClientRect = () => rectAt(100, 50, 400, 600);
    Object.defineProperty(pane, "clientHeight", { configurable: true, value: 400 });
    Object.defineProperty(pane, "clientWidth", { configurable: true, value: 600 });

    try {
      render(<Row container={pane} actions={trendActions} />);
      fireEvent.contextMenu(screen.getByTestId("row"), { clientX: 100, clientY: 700 });
      const menu = within(pane).getByRole("menu");
      expect(menu.hasAttribute("data-zb-contained")).toBe(true);
      // Flipped, then resolved to a top edge and clamped to the pane's floor:
      // 400 - 200 - 8. The last row can never fall off the stage.
      expect(menu.style.top).toBe("192px");
      expect(menu.style.left).toBe("47px");

      const trend = within(menu).getByRole("menuitem", { name: /Trend/ });
      trend.getBoundingClientRect = () => rectAt(700, 100);
      await user.click(trend);
      const child = within(pane).getAllByRole("menu")[1]!;
      expect(child.style.top).toBe("");
      expect(child.style.bottom).not.toBe("");
    } finally {
      pane.remove();
    }
  });
});

/* ------------------------------------------------------------------ */
/* Touch and the sheet                                                 */
/* ------------------------------------------------------------------ */

function coarsePointer() {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query === "(pointer: coarse)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList,
  );
}

describe("the bottom sheet", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens as a sheet on a coarse pointer, and a tap on the backdrop dismisses it", () => {
    coarsePointer();
    render(<Row />);
    const row = screen.getByTestId("row");
    fireEvent.contextMenu(row);
    const menu = screen.getByRole("menu");
    expect(menu.className).toContain("zb-menu--sheet");
    expect(menu.querySelector(".zb-menu__grip")).toBeTruthy();
    // A sheet is placed by the stylesheet, not by the pointer.
    expect(menu.getAttribute("style")).toBeNull();

    fireEvent.click(document.querySelector(".zb-menu__backdrop")!);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(row);
  });

  it("keeps the presentation a host asked for, whatever the pointer", () => {
    coarsePointer();
    render(<Row presentation="popup" />);
    fireEvent.contextMenu(screen.getByTestId("row"));
    expect(screen.getByRole("menu").className).not.toContain("zb-menu--sheet");
  });
});

describe("a long press", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const touch = { pointerType: "touch", clientX: 40, clientY: 60 };

  it("opens the sheet after half a second, and not before", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    render(<Row />);
    const row = screen.getByTestId("row");
    // A move with no press in progress is just a finger passing over.
    fireEvent.pointerMove(row, touch);
    fireEvent.pointerDown(row, touch);
    // A slight wobble is still a press.
    fireEvent.pointerMove(row, { ...touch, clientX: 45, clientY: 64 });

    act(() => vi.advanceTimersByTime(499));
    expect(screen.queryByRole("menu")).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("menu").className).toContain("zb-menu--sheet");
  });

  it("treats a press that drifts as a scroll, so a palm on a tablet opens nothing", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    render(<Row />);
    const row = screen.getByTestId("row");
    fireEvent.pointerDown(row, touch);
    fireEvent.pointerMove(row, { ...touch, clientY: 90 });
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole("menu")).toBeNull();

    fireEvent.pointerDown(row, touch);
    fireEvent.pointerMove(row, { ...touch, clientX: 80 });
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens nothing when the finger lifts early", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    render(<Row />);
    const row = screen.getByTestId("row");
    fireEvent.pointerDown(row, touch);
    // A second press restarts the count rather than stacking two timers.
    fireEvent.pointerDown(row, touch);
    fireEvent.pointerUp(row, touch);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Keyboard, continued                                                 */
/* ------------------------------------------------------------------ */

describe("the trigger's guards", () => {
  it("ignores the contextmenu a browser synthesises after Shift+F10", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Row onOpenChange={onOpenChange} />);
    const row = screen.getByTestId("row");
    row.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await screen.findByRole("menu");
    fireEvent.contextMenu(row);
    // Still the keyboard open, highlight and all.
    expect(document.activeElement!.textContent).toContain("Open order");
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("does not open from the keyboard when disabled either", async () => {
    const user = userEvent.setup();
    render(<Row disabled />);
    screen.getByTestId("row").focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("a menu the reader did not summon", () => {
  it("leaves focus alone, and still closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Row autoFocus={false} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    const menu = await screen.findByRole("menu");
    expect(menu.contains(document.activeElement)).toBe(false);

    await user.keyboard("a");
    expect(screen.getByRole("menu")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("leaves a focused menu's Escape to the menu, one level at a time", async () => {
    const user = userEvent.setup();
    render(<Row actions={trendActions} />);
    screen.getByTestId("row").focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await screen.findByRole("menu");
    // An Escape that reaches the document while focus is inside is not a
    // dismissal of everything.
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getAllByRole("menu")).toHaveLength(1);

    await user.keyboard("{ArrowDown}{ArrowRight}");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getAllByRole("menu")).toHaveLength(2);
  });
});

describe("the panel's keyboard", () => {
  async function openFromKeyboard(
    props: Partial<React.ComponentProps<typeof ChartContextMenu>> = {},
  ) {
    const user = userEvent.setup();
    render(<Row {...props} />);
    screen.getByTestId("row").focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await screen.findByRole("menu");
    return user;
  }

  const focused = () => document.activeElement!.textContent;

  it("jumps to the ends with Home and End, and wraps upward from the first verb", async () => {
    const user = await openFromKeyboard();
    await user.keyboard("{End}");
    expect(focused()).toContain("Reveal Part 2 content");
    await user.keyboard("{Home}");
    expect(focused()).toContain("Open order");
    await user.keyboard("{ArrowUp}");
    expect(focused()).toContain("Reveal Part 2 content");
  });

  it("moves to the next verb starting with a typed letter, and stays put when there is none", async () => {
    const user = await openFromKeyboard();
    await user.keyboard("d");
    expect(focused()).toContain("Discontinue");
    await user.keyboard("d");
    expect(focused()).toContain("Discontinue");
    // A shortcut chord is not a letter.
    await user.keyboard("{Control>}o{/Control}");
    expect(focused()).toContain("Discontinue");
    await user.keyboard("{Meta>}o{/Meta}{Alt>}o{/Alt}");
    expect(focused()).toContain("Discontinue");
    await user.keyboard("o");
    expect(focused()).toContain("Open order");
  });

  it("treats ArrowRight and ArrowLeft as no-ops on a row with no children", async () => {
    const user = await openFromKeyboard();
    await user.keyboard("{ArrowRight}{ArrowLeft}");
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(focused()).toContain("Open order");
  });

  it("runs the highlighted verb on Enter and returns focus to the row", async () => {
    const onRun = vi.fn();
    const user = await openFromKeyboard({ onRun });
    await user.keyboard("{Enter}");
    expect(onRun).toHaveBeenCalledWith(
      expect.objectContaining({ id: "open" }),
      medication,
      expect.objectContaining({ kind: "run" }),
    );
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(screen.getByTestId("row"));
  });

  it("asks for confirmation on Space, exactly as a click would", async () => {
    const onRun = vi.fn();
    const user = await openFromKeyboard({ onRun });
    await user.keyboard("d[Space]");
    expect(onRun).not.toHaveBeenCalled();
    expect(screen.getByText(/next scheduled dose is 14:00/)).toBeTruthy();
  });

  it("closes on Tab rather than trapping focus in a transient popup", async () => {
    const onOpenChange = vi.fn();
    const user = await openFromKeyboard({ onOpenChange });
    await user.keyboard("{Tab}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(false, medication);
  });

  it("does nothing on Enter when a pointer opened it and no row is highlighted", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<Row onRun={onRun} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await screen.findByRole("menu");
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onRun).not.toHaveBeenCalled();
    expect(screen.getAllByRole("menu")).toHaveLength(1);
  });
});

describe("a submenu opened by hovering", () => {
  async function hoverOpen(props: Partial<React.ComponentProps<typeof ChartContextMenu>> = {}) {
    const user = userEvent.setup();
    const view = render(<Row actions={trendActions} {...props} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    const trend = await screen.findByRole("menuitem", { name: /Trend/ });
    await user.hover(trend);
    await waitFor(() => expect(screen.getAllByRole("menu")).toHaveLength(2));
    return { user, view, trend };
  }

  it("opens after the intent delay and does not take focus, because a hover committed to nothing", async () => {
    const { user, trend } = await hoverOpen();
    const child = screen.getAllByRole("menu")[1]!;
    expect(child.contains(document.activeElement)).toBe(false);
    expect(trend.getAttribute("aria-expanded")).toBe("true");

    // Resting on the same row again does not re-open or flicker the child.
    await user.unhover(trend);
    await user.hover(trend);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(screen.getAllByRole("menu")).toHaveLength(2);
  });

  it("closes the child on ArrowLeft and hands focus back to its row", async () => {
    const { user, trend } = await hoverOpen();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(document.activeElement).toBe(trend);
  });

  it("closes only the child on Escape from the parent", async () => {
    const { user } = await hoverOpen();
    await user.keyboard("{Escape}");
    expect(screen.getAllByRole("menu")).toHaveLength(1);
  });

  it("closes the child when the pointer reaches a different row", async () => {
    const { user } = await hoverOpen();
    await user.hover(screen.getByRole("menuitem", { name: /Open result/ }));
    expect(screen.getAllByRole("menu")).toHaveLength(1);
  });

  it("runs nothing on Enter inside a hovered child when no item is highlighted", async () => {
    const onRun = vi.fn();
    const { user } = await hoverOpen({ onRun });
    const child = screen.getAllByRole("menu")[1]!;
    child.focus();
    await user.keyboard("{Enter}");
    expect(onRun).not.toHaveBeenCalled();
    expect(screen.getAllByRole("menu")).toHaveLength(2);
  });

  it("highlights a child item under the pointer", async () => {
    const { user } = await hoverOpen();
    const child = screen.getAllByRole("menu")[1]!;
    await user.hover(within(child).getByRole("menuitem", { name: "Last 7 days" }));
    expect(
      within(child).getByRole("menuitem", { name: "Last 7 days" }).hasAttribute("data-zb-active"),
    ).toBe(true);
  });
});

describe("a submenu from the keyboard", () => {
  async function openChild(props: Partial<React.ComponentProps<typeof ChartContextMenu>> = {}) {
    const user = userEvent.setup();
    render(<Row actions={trendActions} {...props} />);
    screen.getByTestId("row").focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await screen.findByRole("menu");
    await user.keyboard("{ArrowDown}{ArrowRight}");
    return user;
  }

  it("wraps in both directions and runs the highlighted child on Enter", async () => {
    const onRun = vi.fn();
    const user = await openChild({ onRun });
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toContain("Last 30 days");
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toContain("Last 7 days");
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement?.textContent).toContain("Last 30 days");
    // An unbound key inside the child does nothing to either menu.
    await user.keyboard("x");
    expect(screen.getAllByRole("menu")).toHaveLength(2);

    await user.keyboard("{Enter}");
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ id: "t30" }), medication, {
      kind: "run",
    });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("runs a child on Space too", async () => {
    const onRun = vi.fn();
    const user = await openChild({ onRun });
    await user.keyboard("[Space]");
    expect(onRun.mock.calls[0]![0].id).toBe("t7");
  });

  it("carries a compact density onto both menus", async () => {
    await openChild({ density: "compact" });
    for (const menu of screen.getAllByRole("menu")) {
      expect(menu.getAttribute("data-zb-density")).toBe("compact");
    }
  });
});

describe("a menu whose actions change while it is open", () => {
  it("does not let a child outlive a parent that is no longer offered", async () => {
    const user = userEvent.setup();
    const view = render(<Row actions={trendActions} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.click(await screen.findByRole("menuitem", { name: /Trend/ }));
    expect(screen.getAllByRole("menu")).toHaveLength(2);

    view.rerender(<Row actions={[trendActions[0]!]} />);
    expect(screen.getAllByRole("menu")).toHaveLength(1);
  });

  it("opens nothing when the row a hover was resting on goes away", async () => {
    const user = userEvent.setup();
    const view = render(<Row actions={trendActions} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.hover(await screen.findByRole("menuitem", { name: /Trend/ }));
    view.rerender(<Row actions={[trendActions[0]!]} />);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(screen.getAllByRole("menu")).toHaveLength(1);
  });

  it("withdraws a pending confirmation when its verb becomes unavailable", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    const view = render(<Row onRun={onRun} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.click(await screen.findByRole("menuitem", { name: /Discontinue/ }));
    expect(screen.getByRole("button", { name: "Discontinue" })).toBeTruthy();

    view.rerender(
      <Row
        onRun={onRun}
        actions={open({
          id: "dc",
          availability: { status: "unavailable", reason: "Order locked" },
        })}
      />,
    );
    expect(screen.queryByRole("button", { name: "Discontinue" })).toBeNull();
    expect(screen.getByRole("menuitem", { name: /Discontinue/ }).textContent).toContain(
      "Order locked",
    );
  });
});

/* ------------------------------------------------------------------ */
/* The header, continued                                               */
/* ------------------------------------------------------------------ */

describe("the subject header's avatar", () => {
  async function avatarFor(subject: MenuSubject) {
    const user = userEvent.setup();
    render(
      <ChartContextMenu
        subject={subject}
        actions={[{ id: "copy", label: "Copy", tier: "routine" }]}
      >
        {(trigger) => (
          <div {...trigger} data-testid="row">
            row
          </div>
        )}
      </ChartContextMenu>,
    );
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    return (await screen.findByRole("menu")).querySelector(".zb-menu__avatar")!;
  }

  it("uses initials for a clinician as well as a patient", async () => {
    const avatar = await avatarFor({ resource: "Practitioner", id: "pr1", label: "Ama Mensah" });
    expect(avatar.textContent).toBe("AM");
  });

  it("uses one initial for a one-word name", async () => {
    expect((await avatarFor({ resource: "Patient", id: "p1", label: "Cher" })).textContent).toBe(
      "C",
    );
  });

  it("draws a placeholder rather than spelling nothing when the name has no letters", async () => {
    const avatar = await avatarFor({ resource: "Patient", id: "p3", label: "004417" });
    expect(avatar.textContent).toBe("··");
  });

  it("falls back to the resource's own initial for a type it has no glyph for", async () => {
    const avatar = await avatarFor({ resource: "Coverage", id: "c1", label: "Blue Shield PPO" });
    expect(avatar.textContent).toBe("C");
  });

  it("counts people for a selection and names no one member's detail", async () => {
    const avatar = await avatarFor({
      ...medication,
      plural: "orders",
      also: [{ resource: "MedicationRequest", id: "m2" }],
    });
    expect(avatar.querySelector("svg")).toBeTruthy();
    expect(screen.getByRole("menu").querySelector(".zb-menu__what")).toBeNull();
  });
});

describe("the scope a portalled menu carries", () => {
  it("inherits the theme and direction of the row it was opened from", async () => {
    const user = userEvent.setup();
    render(
      <div data-zb-theme="dark" dir="rtl">
        <Row />
      </div>,
    );
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    const menu = await screen.findByRole("menu");
    expect(menu.getAttribute("data-zb-theme")).toBe("dark");
    expect(menu.getAttribute("dir")).toBe("rtl");
    expect(menu.hasAttribute("data-zb-brand")).toBe(false);
  });
});

describe("the disclosure record, from the component", () => {
  it("stamps a blank time rather than reading the clock when the host passed no `now`", async () => {
    const user = userEvent.setup();
    const onDisclose = vi.fn<(record: DisclosureRecord) => void>();
    render(<Row now={undefined} onDisclose={onDisclose} />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.click(await screen.findByRole("menuitem", { name: /Reveal Part 2/ }));
    expect(onDisclose.mock.calls[0]![0].at).toBe("");
  });
});

describe("a bulk confirmation, from the component", () => {
  it("states the count in the confirmation, not only in the header", async () => {
    const user = userEvent.setup();
    const twelve: MenuSubject = {
      ...medication,
      plural: "orders",
      also: Array.from({ length: 11 }, (_, index) => ({
        resource: "MedicationRequest",
        id: `m-${index}`,
      })),
    };
    render(
      <Row
        subject={twelve}
        actions={open({ id: "dc", bulk: "allowed", bulkConfirm: "Stops {n} orders." })}
      />,
    );
    await user.pointer({ keys: "[MouseRight]", target: screen.getByTestId("row") });
    await user.click(await screen.findByRole("menuitem", { name: /Discontinue/ }));
    expect(screen.getByRole("group", { name: "Discontinue" }).textContent).toContain(
      "Stops 12 orders.",
    );
  });
});

describe("a pending timer does not outlive its row", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const touch = { pointerType: "touch", clientX: 40, clientY: 60 };

  it("opens nothing when the row is removed mid long-press", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const onOpenChange = vi.fn();
    const view = render(<Row onOpenChange={onOpenChange} />);
    fireEvent.pointerDown(screen.getByTestId("row"), touch);
    view.unmount();
    act(() => vi.advanceTimersByTime(1000));
    // A menu for a patient no longer on screen is the wrong patient's menu.
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("opens nothing when the row now shows a different subject", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const onOpenChange = vi.fn();
    const view = render(<Row onOpenChange={onOpenChange} />);
    fireEvent.pointerDown(screen.getByTestId("row"), touch);
    // A recycled virtual row: same element, another record.
    view.rerender(<Row onOpenChange={onOpenChange} subject={{ ...medication, id: "med-9" }} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("keeps a long press through a re-render that keeps the subject", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const onOpenChange = vi.fn();
    const view = render(<Row onOpenChange={onOpenChange} />);
    fireEvent.pointerDown(screen.getByTestId("row"), touch);
    // A new object with the same identity is the same record.
    view.rerender(<Row onOpenChange={onOpenChange} subject={{ ...medication }} />);
    act(() => vi.advanceTimersByTime(500));
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ id: "med-4471" }));
  });

  it("drops a pending submenu hover when the menu unmounts", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const view = render(<Row actions={trendActions} />);
    fireEvent.contextMenu(screen.getByTestId("row"));
    const trend = screen.getByRole("menuitem", { name: /Trend/ });
    // React's scheduler shares the fake clock, so the timer is found by its delay.
    const set = vi.spyOn(window, "setTimeout");
    const clear = vi.spyOn(window, "clearTimeout");
    fireEvent.mouseEnter(trend);
    const index = set.mock.calls.findIndex(([, delay]) => typeof delay === "number" && delay > 0);
    const id = set.mock.results[index]!.value;
    view.unmount();
    expect(clear).toHaveBeenCalledWith(id);
  });
});
