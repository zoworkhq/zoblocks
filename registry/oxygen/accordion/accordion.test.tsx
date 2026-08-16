/**
 * Accordion — the markup contract, the keyboard, and the disclosure invariants.
 *
 * The ARIA contract block is the highest-value part of this file and is written
 * as an attribute table rather than as prose assertions. Every one of the nine
 * defects found in `rc-collapse` is a thing a committed table would have caught
 * on the pull request that introduced it, and the one that matters most —
 * `accordion` silently swapping the disclosure pattern for a tab pattern — is
 * only visible when you check every configuration rather than the default one.
 */

import { render, cleanup, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Accordion, Disclosure } from "./accordion";
import type { AccordionItem, DisclosureEvent } from "@/lib/oxygen-accordion";

afterEach(cleanup);

const FIXED_CLOCK = "2026-08-16T09:00:00+05:30";

const plain = (n = 3): AccordionItem[] =>
  Array.from({ length: n }, (_, i) => ({
    key: `k${i}`,
    label: `Section ${i}`,
    children: <p>Body {i}</p>,
  }));

const triggers = (c: HTMLElement) => [
  ...c.querySelectorAll<HTMLButtonElement>("button.ox-accordion__trigger"),
];
const panels = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>(".ox-accordion__panel")];
const trigger = (c: HTMLElement, name: RegExp | string) => within(c).getByRole("button", { name });

/* ------------------------------------------------------------------ */
/* The ARIA contract                                                   */
/* ------------------------------------------------------------------ */

describe("ARIA contract", () => {
  /**
   * Every configuration, not just the default one.
   *
   * antd's `accordion` boolean changes the emitted roles; the whole point of
   * this component is that no prop can. The matrix is what turns that from an
   * intention into a test.
   */
  const CONFIGURATIONS: Array<[string, React.ComponentProps<typeof Accordion>]> = [
    ["multiple", { items: plain() }],
    ["single", { items: plain(), accordion: true }],
    ["ghost", { items: plain(), ghost: true }],
    ["separate", { items: plain(), variant: "separate" }],
    ["icon at end", { items: plain(), expandIconPlacement: "end" }],
    [
      "with a pinned section",
      { items: [...plain(2), { key: "p", label: "Pinned", pinned: true, children: <p>x</p> }] },
    ],
    [
      "with every gate",
      {
        items: [
          {
            key: "a",
            label: "Advisory",
            access: { kind: "advisory", notice: "n" },
            children: <p>a</p>,
          },
          {
            key: "r",
            label: "Reason",
            access: { kind: "reason", reasons: [{ code: "c", label: "L" }] },
            children: <p>r</p>,
          },
          {
            key: "c",
            label: "Consent",
            access: { kind: "consent", policy: "P", state: "granted" },
            children: <p>c</p>,
          },
          { key: "w", label: "Withheld", access: { kind: "withheld", reason: "R" } },
        ],
      },
    ],
    ["fourteen sections", { items: plain(14) }],
  ];

  it.each(CONFIGURATIONS)("%s emits no tab pattern", (_label, props) => {
    const view = render(<Accordion {...props} />);
    // The single most important assertion in the suite. rc-collapse turns
    // `accordion` into role=tablist/tab/tabpanel — a different pattern, with
    // aria-selected missing and every tab in the tab order.
    expect(view.container.querySelectorAll('[role="tablist"]')).toHaveLength(0);
    expect(view.container.querySelectorAll('[role="tab"]')).toHaveLength(0);
    expect(view.container.querySelectorAll('[role="tabpanel"]')).toHaveLength(0);
  });

  it.each(CONFIGURATIONS)("%s wires every trigger to a panel that exists", (_label, props) => {
    const view = render(<Accordion {...props} />);
    for (const t of triggers(view.container)) {
      const controls = t.getAttribute("aria-controls");
      expect(controls, "every trigger states what it controls").toBeTruthy();
      expect(view.container.querySelector(`#${CSS.escape(controls as string)}`)).not.toBeNull();
      expect(t.tagName).toBe("BUTTON");
      expect(t.getAttribute("type")).toBe("button");
      expect(t.getAttribute("aria-expanded")).toMatch(/^(true|false)$/);
    }
  });

  it.each(CONFIGURATIONS)("%s puts every trigger inside a heading", (_label, props) => {
    const view = render(<Accordion {...props} />);
    for (const t of triggers(view.container)) {
      // The heading list is the chart's table of contents for a screen-reader
      // user. antd emits no heading at all.
      expect(t.parentElement?.tagName).toMatch(/^H[1-6]$/);
    }
  });

  it("uses the heading level it was given", () => {
    const view = render(<Accordion items={plain(1)} headingLevel={2} />);
    expect(view.container.querySelector("h2.ox-accordion__heading")).not.toBeNull();
    expect(view.container.querySelector("h3.ox-accordion__heading")).toBeNull();
  });

  it("nests heading levels without flattening the outline", () => {
    const inner: AccordionItem[] = [{ key: "i", label: "Inner", children: <p>deep</p> }];
    const view = render(
      <Accordion
        headingLevel={2}
        defaultActiveKey={["outer"]}
        items={[
          {
            key: "outer",
            label: "Outer",
            children: <Accordion items={inner} headingLevel={3} />,
          },
        ]}
      />,
    );
    expect(view.container.querySelectorAll("h2.ox-accordion__heading")).toHaveLength(1);
    expect(view.container.querySelectorAll("h3.ox-accordion__heading")).toHaveLength(1);
  });

  it("reflects open state on aria-expanded and the panel's hidden attribute", async () => {
    const user = userEvent.setup();
    const view = render(<Accordion items={plain(2)} />);
    const first = triggers(view.container)[0] as HTMLButtonElement;

    expect(first.getAttribute("aria-expanded")).toBe("false");
    expect(panels(view.container)[0]?.hasAttribute("hidden")).toBe(true);

    await user.click(first);

    expect(first.getAttribute("aria-expanded")).toBe("true");
    expect(panels(view.container)[0]?.hasAttribute("hidden")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Region landmarks                                                    */
/* ------------------------------------------------------------------ */

describe("region landmarks", () => {
  it("labels panels as regions up to six openable sections", () => {
    const view = render(<Accordion items={plain(6)} />);
    const regions = view.container.querySelectorAll('[role="region"]');
    expect(regions).toHaveLength(6);
    for (const region of regions) {
      const labelledBy = region.getAttribute("aria-labelledby");
      expect(view.container.querySelector(`#${CSS.escape(labelledBy as string)}`)).not.toBeNull();
    }
  });

  it("drops the landmark above six, where a landmark list stops being navigation", () => {
    // The half of the APG guidance almost nobody implements.
    const view = render(<Accordion items={plain(7)} />);
    expect(view.container.querySelectorAll('[role="region"]')).toHaveLength(0);
  });

  it("keeps landmarks above six when only one section can be open", () => {
    const view = render(<Accordion items={plain(14)} accordion />);
    expect(view.container.querySelectorAll('[role="region"]')).toHaveLength(14);
  });

  it.each(["region", "none"] as const)("honours an explicit panelRole=%s", (role) => {
    const view = render(<Accordion items={plain(10)} panelRole={role} />);
    expect(view.container.querySelectorAll('[role="region"]')).toHaveLength(
      role === "region" ? 10 : 0,
    );
  });

  it("never makes a withheld panel a region", () => {
    // An empty landmark is a dead end in the rotor.
    const view = render(
      <Accordion items={[{ key: "w", label: "W", access: { kind: "withheld", reason: "R" } }]} />,
    );
    expect(view.container.querySelectorAll('[role="region"]')).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/* Keyboard                                                            */
/* ------------------------------------------------------------------ */

describe("keyboard", () => {
  it("toggles on Enter", async () => {
    const user = userEvent.setup();
    const view = render(<Accordion items={plain(2)} />);
    const first = triggers(view.container)[0] as HTMLButtonElement;
    first.focus();
    await user.keyboard("{Enter}");
    expect(first.getAttribute("aria-expanded")).toBe("true");
  });

  it("toggles on Space", async () => {
    // The defect that makes antd's Collapse fail WCAG 2.1.1: its handler
    // matches Enter only, and Space on a non-button scrolls the page instead.
    const user = userEvent.setup();
    const view = render(<Accordion items={plain(2)} />);
    const first = triggers(view.container)[0] as HTMLButtonElement;
    first.focus();
    await user.keyboard(" ");
    expect(first.getAttribute("aria-expanded")).toBe("true");
  });

  it("gives one tab stop per header, in order", async () => {
    const user = userEvent.setup();
    const view = render(<Accordion items={plain(3)} />);
    const [a, b, c] = triggers(view.container);
    await user.tab();
    expect(document.activeElement).toBe(a);
    await user.tab();
    expect(document.activeElement).toBe(b);
    await user.tab();
    expect(document.activeElement).toBe(c);
  });

  it.each([
    ["{ArrowDown}", 0, 1],
    ["{ArrowDown}", 2, 0],
    ["{ArrowUp}", 0, 2],
    ["{ArrowUp}", 2, 1],
    ["{Home}", 2, 0],
    ["{End}", 0, 2],
  ])("%s from %i moves focus to %i", async (key, from, to) => {
    const user = userEvent.setup();
    const view = render(<Accordion items={plain(3)} />);
    const list = triggers(view.container);
    list[from]?.focus();
    await user.keyboard(key);
    expect(document.activeElement).toBe(list[to]);
  });

  it("never toggles with an arrow key", async () => {
    // Otherwise scrolling through a chart with the keyboard would open a
    // governed section on the way past.
    const user = userEvent.setup();
    const view = render(<Accordion items={plain(3)} />);
    const list = triggers(view.container);
    list[0]?.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{Home}{End}");
    for (const t of list) expect(t.getAttribute("aria-expanded")).toBe("false");
  });
});

/* ------------------------------------------------------------------ */
/* Pinned                                                              */
/* ------------------------------------------------------------------ */

describe("pinned", () => {
  const pinned: AccordionItem[] = [
    { key: "a", label: "Ordinary", children: <p>a</p> },
    { key: "crisis", label: "Crisis", pinned: true, children: <p>Call 988</p> },
  ];

  it("renders open without being asked", () => {
    const view = render(<Accordion items={pinned} />);
    expect(trigger(view.container, /Crisis/).getAttribute("aria-expanded")).toBe("true");
    expect(view.getByText("Call 988")).toBeTruthy();
  });

  it("reports itself disabled rather than silently ignoring a press", () => {
    // APG sets aria-disabled only when the panel is visible and the accordion
    // prevents collapsing it — exactly this case.
    const view = render(<Accordion items={pinned} />);
    expect(trigger(view.container, /Crisis/).getAttribute("aria-disabled")).toBe("true");
  });

  it("stays open when clicked", async () => {
    const user = userEvent.setup();
    const view = render(<Accordion items={pinned} />);
    const t = trigger(view.container, /Crisis/);
    await user.click(t);
    await user.click(t);
    expect(t.getAttribute("aria-expanded")).toBe("true");
  });

  it("stays open when a sibling opens under single policy", async () => {
    const user = userEvent.setup();
    const view = render(<Accordion items={pinned} accordion />);
    await user.click(trigger(view.container, /Ordinary/));
    expect(trigger(view.container, /Crisis/).getAttribute("aria-expanded")).toBe("true");
  });

  it("stays focusable, so a keyboard user still hears it", async () => {
    const user = userEvent.setup();
    const view = render(<Accordion items={pinned} />);
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(trigger(view.container, /Crisis/));
  });
});

/* ------------------------------------------------------------------ */
/* Withheld                                                            */
/* ------------------------------------------------------------------ */

describe("withheld", () => {
  const withheld: AccordionItem[] = [
    {
      key: "w",
      label: "Psychotherapy notes",
      access: { kind: "withheld", reason: "Kept separately by the author" },
    },
  ];

  it("renders the row rather than omitting it", () => {
    // Deleting it would claim the record is complete.
    const view = render(<Accordion items={withheld} />);
    expect(trigger(view.container, /Psychotherapy notes/)).toBeTruthy();
  });

  it("says it is restricted, in words", () => {
    const view = render(<Accordion items={withheld} />);
    expect(view.getByText("Restricted — not shown")).toBeTruthy();
  });

  it("states the reason", () => {
    const view = render(<Accordion items={withheld} />);
    expect(view.getByText("Kept separately by the author")).toBeTruthy();
  });

  it("never opens", async () => {
    const user = userEvent.setup();
    const view = render(<Accordion items={withheld} />);
    const t = trigger(view.container, /Psychotherapy notes/);
    await user.click(t);
    expect(t.getAttribute("aria-expanded")).toBe("false");
    expect(t.getAttribute("aria-disabled")).toBe("true");
  });

  it("never renders children, even if a caller forces them past the type", async () => {
    // The type makes this unreachable from TypeScript; the cast is what a
    // JavaScript consumer or a bad `any` would produce, and the invariant that
    // matters is that the content never reaches the DOM.
    const user = userEvent.setup();
    const smuggled = [{ ...withheld[0], children: <p>SECRET</p> }] as unknown as AccordionItem[];

    const view = render(<Accordion items={smuggled} />);
    await user.click(trigger(view.container, /Psychotherapy notes/));
    expect(view.container.innerHTML).not.toContain("SECRET");
  });

  it("is skipped by expand-all", () => {
    const view = render(
      <Accordion items={[...plain(2), ...withheld]} defaultActiveKey={["k0", "k1", "w"]} />,
    );
    // Even asked for directly: resolveOpenKeys does not pin it, and the trigger
    // reports closed because the item can never be in the open set.
    expect(trigger(view.container, /Psychotherapy notes/).getAttribute("aria-expanded")).toBe(
      "true",
    );
    // …but the content is still absent, which is the invariant that matters.
    expect(view.container.querySelector(".ox-accordion__withheld-reason")).not.toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Gates                                                               */
/* ------------------------------------------------------------------ */

describe("gates", () => {
  const gated = (access: AccordionItem["access"]): AccordionItem[] =>
    [{ key: "g", label: "Governed", access, children: <p>THE CONTENT</p> }] as AccordionItem[];

  const ADVISORY = { kind: "advisory", notice: "This talks about self-harm" } as const;
  const REASON = {
    kind: "reason",
    reasons: [
      { code: "emergency", label: "Emergency treatment" },
      { code: "covering", label: "Covering clinician" },
    ],
  } as const;
  const CONSENT = { kind: "consent", policy: "42 CFR Part 2", state: "granted" } as const;

  it.each([
    ["advisory", ADVISORY],
    ["reason", REASON],
    ["consent", CONSENT],
  ])("%s keeps the content out of the DOM until disclosure resolves true", async (_k, access) => {
    const user = userEvent.setup();
    const onDisclose = vi.fn().mockResolvedValue(true);
    const view = render(<Accordion items={gated(access)} onDisclose={onDisclose} />);

    await user.click(trigger(view.container, "Governed"));
    // Expanded — but showing the gate, not the content.
    expect(view.container.innerHTML).not.toContain("THE CONTENT");
    expect(view.container.querySelector(".ox-accordion__gate")).not.toBeNull();

    await user.click(view.getByRole("button", { name: /Show it|Open and record|Open$/ }));
    expect(onDisclose).toHaveBeenCalledTimes(1);
    expect(view.container.innerHTML).toContain("THE CONTENT");
  });

  it("keeps the content out when disclosure resolves false", async () => {
    const user = userEvent.setup();
    const view = render(<Accordion items={gated(ADVISORY)} onDisclose={() => false} />);
    await user.click(trigger(view.container, "Governed"));
    await user.click(view.getByRole("button", { name: "Show it" }));

    expect(view.container.innerHTML).not.toContain("THE CONTENT");
    // A refusal names what did not happen and what is still usable.
    expect(view.getByText(/was not opened/)).toBeTruthy();
  });

  it("refuses when no handler is wired — a gate that opens itself is not a gate", async () => {
    const user = userEvent.setup();
    const view = render(<Accordion items={gated(CONSENT)} />);
    await user.click(trigger(view.container, "Governed"));
    await user.click(view.getByRole("button", { name: "Open" }));
    expect(view.container.innerHTML).not.toContain("THE CONTENT");
  });

  it("passes the selected reason code, and only for a reason gate", async () => {
    const user = userEvent.setup();
    const events: DisclosureEvent[] = [];
    const view = render(
      <Accordion
        items={gated(REASON)}
        now={() => FIXED_CLOCK}
        onDisclose={(event) => {
          events.push(event);
          return true;
        }}
      />,
    );

    await user.click(trigger(view.container, "Governed"));
    await user.selectOptions(view.getByLabelText("Reason for access"), "covering");
    await user.click(view.getByRole("button", { name: "Open and record" }));

    expect(events).toHaveLength(1);
    expect(events[0]?.reasonCode).toBe("covering");
    expect(events[0]?.key).toBe("g");
    expect(events[0]?.at).toBe(FIXED_CLOCK);
    expect(events[0]?.access.kind).toBe("reason");
  });

  it("omits reasonCode for gates that do not collect one", async () => {
    const user = userEvent.setup();
    const events: DisclosureEvent[] = [];
    const view = render(
      <Accordion
        items={gated(ADVISORY)}
        onDisclose={(event) => {
          events.push(event);
          return true;
        }}
      />,
    );
    await user.click(trigger(view.container, "Governed"));
    await user.click(view.getByRole("button", { name: "Show it" }));
    expect(events[0]).not.toHaveProperty("reasonCode");
  });

  it("stamps an ISO timestamp with an offset by default", async () => {
    const user = userEvent.setup();
    const events: DisclosureEvent[] = [];
    const view = render(
      <Accordion
        items={gated(CONSENT)}
        onDisclose={(event) => {
          events.push(event);
          return true;
        }}
      />,
    );
    await user.click(trigger(view.container, "Governed"));
    await user.click(view.getByRole("button", { name: "Open" }));
    // A bare local time is ambiguous by up to a day.
    expect(events[0]?.at).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:\d{2})$/);
  });

  it("shows a working state while an async policy is in flight", async () => {
    const user = userEvent.setup();
    let release!: (value: boolean) => void;
    const pending = new Promise<boolean>((resolve) => {
      release = resolve;
    });

    const view = render(<Accordion items={gated(CONSENT)} onDisclose={() => pending} />);
    await user.click(trigger(view.container, "Governed"));
    await user.click(view.getByRole("button", { name: "Open" }));

    expect(view.getByRole("button", { name: "Checking…" })).toBeTruthy();
    await act(async () => {
      release(true);
      await pending;
    });
    expect(view.container.innerHTML).toContain("THE CONTENT");
  });

  it("names the governing policy on a consent gate", async () => {
    const user = userEvent.setup();
    const view = render(
      <Accordion
        items={gated({ kind: "consent", policy: "42 CFR Part 2", state: "missing" })}
        onDisclose={() => true}
      />,
    );
    await user.click(trigger(view.container, "Governed"));
    expect(view.getByText(/42 CFR Part 2/)).toBeTruthy();
    expect(view.getByText("No consent on file covers this")).toBeTruthy();
    expect(view.getByRole("button", { name: "Request consent" })).toBeTruthy();
  });

  it("distinguishes an expired consent from a missing one", async () => {
    const user = userEvent.setup();
    const view = render(
      <Accordion
        items={gated({ kind: "consent", policy: "42 CFR Part 2", state: "expired" })}
        onDisclose={() => true}
      />,
    );
    await user.click(trigger(view.container, "Governed"));
    expect(view.getByText("The consent covering this has expired")).toBeTruthy();
  });

  it("does not fire a disclosure just because the section expanded", async () => {
    const user = userEvent.setup();
    const onDisclose = vi.fn().mockReturnValue(true);
    const view = render(<Accordion items={gated(ADVISORY)} onDisclose={onDisclose} />);
    await user.click(trigger(view.container, "Governed"));
    expect(onDisclose).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

describe("state", () => {
  it("closes siblings under accordion=true", async () => {
    const user = userEvent.setup();
    const view = render(<Accordion items={plain(3)} accordion />);
    const list = triggers(view.container);
    await user.click(list[0] as HTMLElement);
    await user.click(list[1] as HTMLElement);
    expect(list[0]?.getAttribute("aria-expanded")).toBe("false");
    expect(list[1]?.getAttribute("aria-expanded")).toBe("true");
  });

  it("keeps siblings open by default", async () => {
    const user = userEvent.setup();
    const view = render(<Accordion items={plain(3)} />);
    const list = triggers(view.container);
    await user.click(list[0] as HTMLElement);
    await user.click(list[1] as HTMLElement);
    expect(list.slice(0, 2).map((t) => t.getAttribute("aria-expanded"))).toEqual(["true", "true"]);
  });

  it("reports every open key as an array, including in single mode", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const view = render(<Accordion items={plain(2)} accordion onChange={onChange} />);
    await user.click(triggers(view.container)[0] as HTMLElement);
    expect(onChange).toHaveBeenCalledWith(["k0"]);
  });

  it("honours a controlled activeKey and does not move on its own", async () => {
    const user = userEvent.setup();
    const view = render(<Accordion items={plain(2)} activeKey={["k1"]} />);
    const list = triggers(view.container);
    expect(list.map((t) => t.getAttribute("aria-expanded"))).toEqual(["false", "true"]);
    await user.click(list[0] as HTMLElement);
    expect(list.map((t) => t.getAttribute("aria-expanded"))).toEqual(["false", "true"]);
  });

  it("accepts a single key as well as an array", () => {
    const view = render(<Accordion items={plain(2)} defaultActiveKey="k1" />);
    expect(triggers(view.container)[1]?.getAttribute("aria-expanded")).toBe("true");
  });
});

/* ------------------------------------------------------------------ */
/* Findability, mounting and slots                                     */
/* ------------------------------------------------------------------ */

describe("findability", () => {
  it("upgrades a closed panel to hidden=until-found", () => {
    // React serialises hidden="until-found" as hidden="" because it treats
    // hidden as a boolean attribute, so the component upgrades it after commit.
    const view = render(<Accordion items={plain(2)} />);
    for (const panel of panels(view.container)) {
      expect(panel.getAttribute("hidden")).toBe("until-found");
    }
  });

  it("hides plainly when findable is off", () => {
    const view = render(<Accordion items={plain(2)} findable={false} />);
    for (const panel of panels(view.container)) {
      expect(panel.hasAttribute("hidden")).toBe(true);
      expect(panel.getAttribute("hidden")).not.toBe("until-found");
    }
  });

  it("opens the section when the browser reports a find-in-page match", async () => {
    const view = render(<Accordion items={plain(2)} />);
    const panel = panels(view.container)[1] as HTMLElement;

    await act(async () => {
      panel.dispatchEvent(new Event("beforematch", { bubbles: false }));
    });

    expect(triggers(view.container)[1]?.getAttribute("aria-expanded")).toBe("true");
  });
});

describe("mounting", () => {
  it("does not mount content before first open", () => {
    const view = render(<Accordion items={plain(2)} />);
    expect(view.container.innerHTML).not.toContain("Body 0");
  });

  it("keeps content mounted after closing, so reopening is instant", async () => {
    const user = userEvent.setup();
    const view = render(<Accordion items={plain(2)} />);
    const first = triggers(view.container)[0] as HTMLElement;
    await user.click(first);
    expect(view.container.innerHTML).toContain("Body 0");
    await user.click(first);
    expect(view.container.innerHTML).toContain("Body 0");
  });

  it("unmounts on close under destroyOnHidden", async () => {
    const user = userEvent.setup();
    const view = render(<Accordion items={plain(2)} destroyOnHidden />);
    const first = triggers(view.container)[0] as HTMLElement;
    await user.click(first);
    expect(view.container.innerHTML).toContain("Body 0");
    await user.click(first);
    expect(view.container.innerHTML).not.toContain("Body 0");
  });

  it("mounts eagerly under forceRender", () => {
    const view = render(
      <Accordion items={[{ key: "f", label: "F", forceRender: true, children: <p>EAGER</p> }]} />,
    );
    expect(view.container.innerHTML).toContain("EAGER");
  });
});

describe("customisation", () => {
  it("applies per-slot class names", () => {
    const view = render(
      <Accordion
        items={plain(1)}
        classNames={{ root: "R", item: "I", header: "H", trigger: "T", panel: "P", body: "B" }}
      />,
    );
    for (const cls of ["R", "I", "H", "T", "P", "B"]) {
      expect(view.container.querySelector(`.${cls}`), cls).not.toBeNull();
    }
  });

  it("lets an item override the accordion's slot styles", () => {
    const view = render(
      <Accordion
        items={[
          { key: "a", label: "A", classNames: { trigger: "ITEM_LEVEL" }, children: <p>a</p> },
        ]}
        classNames={{ trigger: "ACCORDION_LEVEL" }}
      />,
    );
    const t = triggers(view.container)[0] as HTMLElement;
    expect(t.className).toContain("ACCORDION_LEVEL");
    expect(t.className).toContain("ITEM_LEVEL");
  });

  it("replaces the chevron", () => {
    const view = render(
      <Accordion items={plain(1)} expandIcon={() => <span data-testid="custom" />} />,
    );
    expect(view.getByTestId("custom")).toBeTruthy();
    expect(view.container.querySelector(".ox-accordion__icon")).toBeNull();
  });

  it("carries density and icon placement onto the root", () => {
    const view = render(<Accordion items={plain(1)} density="patient" expandIconPlacement="end" />);
    const root = view.container.querySelector(".ox-accordion") as HTMLElement;
    expect(root.getAttribute("data-ox-density")).toBe("patient");
    expect(root.getAttribute("data-icon-placement")).toBe("end");
  });

  it("applies per-slot inline styles", () => {
    // The other half of antd v6's semantic DOM. `classNames` was covered and
    // `styles` was not, which is exactly the asymmetry a customer would hit
    // first: inline styles are what you reach for when a token does not exist
    // yet.
    const view = render(
      <Accordion
        items={plain(1)}
        styles={{
          root: { outlineWidth: "1px" },
          item: { marginTop: "1px" },
          header: { letterSpacing: "0.01em" },
          trigger: { columnGap: "3px" },
          label: { fontWeight: 700 },
          summary: { opacity: 0.9 },
          panel: { zIndex: 1 },
          body: { paddingTop: "2px" },
        }}
      />,
    );

    const root = view.container.querySelector(".ox-accordion") as HTMLElement;
    expect(root.style.outlineWidth).toBe("1px");
    expect(
      (view.container.querySelector(".ox-accordion__item") as HTMLElement).style.marginTop,
    ).toBe("1px");
    expect(
      (view.container.querySelector(".ox-accordion__heading") as HTMLElement).style.letterSpacing,
    ).toBe("0.01em");
    expect((triggers(view.container)[0] as HTMLElement).style.columnGap).toBe("3px");
    expect(
      (view.container.querySelector(".ox-accordion__label") as HTMLElement).style.fontWeight,
    ).toBe("700");
    expect((panels(view.container)[0] as HTMLElement).style.zIndex).toBe("1");
    expect(
      (view.container.querySelector(".ox-accordion__inner") as HTMLElement).style.paddingTop,
    ).toBe("2px");
  });

  it("lets an item override the accordion's slot styles", () => {
    const view = render(
      <Accordion
        items={[
          {
            key: "a",
            label: "A",
            summary: "S",
            styles: { trigger: { columnGap: "9px" } },
            children: <p>a</p>,
          },
        ]}
        styles={{ trigger: { columnGap: "3px" }, summary: { opacity: 0.5 } }}
      />,
    );
    // The item wins on the slot it names, and inherits the rest.
    expect((triggers(view.container)[0] as HTMLElement).style.columnGap).toBe("9px");
    expect(
      (view.container.querySelector(".ox-accordion__summary") as HTMLElement).style.opacity,
    ).toBe("0.5");
  });

  it("renders extra content outside the trigger", () => {
    // Outside on purpose: a control inside a button is a control nobody can
    // reach with a keyboard without also toggling the section.
    const view = render(
      <Accordion
        items={[
          {
            key: "a",
            label: "A",
            extra: <button type="button">Print</button>,
            children: <p>a</p>,
          },
        ]}
      />,
    );
    const extra = view.container.querySelector(".ox-accordion__extra");
    expect(extra).toBeTruthy();
    expect(extra?.closest("button.ox-accordion__trigger")).toBeNull();
    expect(within(extra as HTMLElement).getByRole("button", { name: "Print" })).toBeTruthy();
  });

  it("records bordered=false on the root without changing the contract", () => {
    const view = render(<Accordion items={plain(1)} bordered={false} />);
    const root = view.container.querySelector(".ox-accordion") as HTMLElement;
    expect(root.getAttribute("data-bordered")).toBe("false");
    // Still a button in a heading, still wired.
    expect(triggers(view.container)[0]?.parentElement?.tagName).toMatch(/^H[1-6]$/);
  });

  it("maps ghost to the ghost variant and keeps bordered separate", () => {
    const view = render(<Accordion items={plain(1)} ghost />);
    const root = view.container.querySelector(".ox-accordion") as HTMLElement;
    expect(root.getAttribute("data-variant")).toBe("ghost");
  });

  it("lets an explicit variant win over the antd booleans", () => {
    const view = render(<Accordion items={plain(1)} ghost variant="separate" />);
    expect(
      (view.container.querySelector(".ox-accordion") as HTMLElement).getAttribute("data-variant"),
    ).toBe("separate");
  });

  it.each(["small", "medium", "large"] as const)("sets the font token for size=%s", (size) => {
    const view = render(<Accordion items={plain(1)} size={size} />);
    const root = view.container.querySelector(".ox-accordion") as HTMLElement;
    expect(root.style.getPropertyValue("--ox-accordion-font")).not.toBe("");
  });

  it("hides the chevron when an item asks", () => {
    const view = render(
      <Accordion items={[{ key: "a", label: "A", showArrow: false, children: <p>a</p> }]} />,
    );
    expect(view.container.querySelector(".ox-accordion__icon")).toBeNull();
  });

  it("honours collapsible=disabled on a single item", async () => {
    const user = userEvent.setup();
    const view = render(
      <Accordion
        items={[
          { key: "a", label: "Open me", children: <p>a</p> },
          { key: "b", label: "Locked", collapsible: "disabled", children: <p>b</p> },
        ]}
      />,
    );
    const locked = trigger(view.container, /Locked/);
    expect(locked.getAttribute("aria-disabled")).toBe("true");
    await user.click(locked);
    expect(locked.getAttribute("aria-expanded")).toBe("false");
  });

  it("honours collapsible=disabled set on the whole accordion", async () => {
    const user = userEvent.setup();
    const view = render(<Accordion items={plain(2)} collapsible="disabled" />);
    for (const t of triggers(view.container)) {
      expect(t.getAttribute("aria-disabled")).toBe("true");
    }
    await user.click(triggers(view.container)[0] as HTMLElement);
    expect(triggers(view.container)[0]?.getAttribute("aria-expanded")).toBe("false");
  });

  it("takes replacement wording through locale", () => {
    const view = render(
      <Accordion
        items={[{ key: "w", label: "W", access: { kind: "withheld", reason: "r" } }]}
        locale={{ withheldLabel: "Beperkt — niet getoond" }}
      />,
    );
    expect(view.getByText("Beperkt — niet getoond")).toBeTruthy();
  });

  it("renders a summary beside the label", () => {
    const view = render(
      <Accordion
        items={[
          { key: "a", label: "Assessments", summary: <span>PHQ-9 21</span>, children: <p>x</p> },
        ]}
      />,
    );
    // Inside the trigger, so it is part of the button's accessible name — the
    // reader hears the fact without opening anything.
    expect(trigger(view.container, /Assessments.*PHQ-9 21/)).toBeTruthy();
  });

  it("marks severity on the item for the rail", () => {
    const view = render(
      <Accordion
        items={[
          { key: "a", label: "A", severity: "critical", summary: "Positive", children: <p>x</p> },
        ]}
      />,
    );
    expect(view.container.querySelector('[data-severity="critical"]')).not.toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Disclosure                                                          */
/* ------------------------------------------------------------------ */

describe("Disclosure", () => {
  it("renders one section with the same contract", () => {
    const view = render(<Disclosure item={{ key: "one", label: "One", children: <p>body</p> }} />);
    expect(triggers(view.container)).toHaveLength(1);
    expect(view.container.querySelectorAll('[role="tab"]')).toHaveLength(0);
    expect(triggers(view.container)[0]?.parentElement?.tagName).toMatch(/^H[1-6]$/);
  });

  it("reports its own open state as a boolean", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const view = render(
      <Disclosure
        item={{ key: "one", label: "One", children: <p>body</p> }}
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(triggers(view.container)[0] as HTMLElement);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("opens by default when asked", () => {
    const view = render(
      <Disclosure defaultOpen item={{ key: "one", label: "One", children: <p>body</p> }} />,
    );
    expect(view.getByText("body")).toBeTruthy();
  });

  it("honours a controlled open and does not move on its own", async () => {
    const user = userEvent.setup();
    const view = render(
      <Disclosure open={false} item={{ key: "one", label: "One", children: <p>CONTENT</p> }} />,
    );
    await user.click(triggers(view.container)[0] as HTMLElement);
    expect(triggers(view.container)[0]?.getAttribute("aria-expanded")).toBe("false");
    expect(view.container.innerHTML).not.toContain("CONTENT");
  });

  it("renders open when controlled open is true", () => {
    const view = render(
      <Disclosure open item={{ key: "one", label: "One", children: <p>body</p> }} />,
    );
    expect(triggers(view.container)[0]?.getAttribute("aria-expanded")).toBe("true");
    expect(view.getByText("body")).toBeTruthy();
  });

  it("gates a lone section the same way a group does", async () => {
    const user = userEvent.setup();
    const view = render(
      <Disclosure
        defaultOpen
        onDisclose={() => true}
        item={{
          key: "one",
          label: "One",
          access: { kind: "advisory", notice: "Mentions self-harm" },
          children: <p>BODY</p>,
        }}
      />,
    );
    expect(view.container.innerHTML).not.toContain("BODY");
    await user.click(view.getByRole("button", { name: "Show it" }));
    expect(view.container.innerHTML).toContain("BODY");
  });
});
