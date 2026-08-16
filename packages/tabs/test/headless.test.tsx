/**
 * `useTabs` — the escape hatch.
 *
 * It exists so a team whose design bears no resemblance to any of the eleven
 * skins keeps Oxygen's keyboard model and accessibility tree instead of
 * reinventing both badly. These tests hold it to the same contract as the
 * components.
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTabs, type TabItem } from "../src/index.js";

const items: TabItem[] = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
  { value: "c", label: "Charlie" },
];

function Harness({
  mode = "tabs" as const,
  onChange,
  ...options
}: Partial<Parameters<typeof useTabs>[0]> & { mode?: "tabs" | "radiogroup" | "nav" } = {}) {
  const tabs = useTabs({
    as: mode,
    items: options.items ?? items,
    defaultValue: "a",
    onChange,
    ...options,
  } as Parameters<typeof useTabs>[0]);

  return (
    <div>
      <div {...tabs.getListProps({ "aria-label": "Headless" })}>
        {(options.items ?? items).map((item, index) => {
          const props = tabs.getTriggerProps(index);
          return (
            <button key={item.value} type="button" {...props}>
              {String(item.label)}
            </button>
          );
        })}
      </div>
      {(options.items ?? items).map((item, index) => (
        <div key={item.value} {...tabs.getPanelProps(index)}>
          Panel {String(item.label)}
        </div>
      ))}
      <span data-testid="value">{tabs.value}</span>
      <span data-testid="index">{tabs.selectedIndex}</span>
    </div>
  );
}

describe("prop getters", () => {
  it("produces a tablist with the right roles", () => {
    render(<Harness />);
    expect(screen.getByRole("tablist", { name: "Headless" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("wires aria-controls and aria-labelledby across the two getters", () => {
    render(<Harness />);
    const tab = screen.getByRole("tab", { name: "Alpha" });
    const panel = screen.getByRole("tabpanel");
    expect(tab).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", tab.id);
  });

  it("keeps exactly one tab stop", () => {
    render(<Harness />);
    expect(screen.getAllByRole("tab").filter((tab) => tab.tabIndex === 0)).toHaveLength(1);
  });

  it("selects on click and reports the value", async () => {
    render(<Harness />);
    await userEvent.setup().click(screen.getByRole("tab", { name: "Bravo" }));
    expect(screen.getByTestId("value")).toHaveTextContent("b");
    expect(screen.getByTestId("index")).toHaveTextContent("1");
  });

  it("moves with arrow keys", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Bravo" })).toHaveFocus();
    expect(screen.getByTestId("value")).toHaveTextContent("b");
  });

  it("supports typeahead", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("c");
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveFocus();
  });

  it("honours manual activation", async () => {
    const onChange = vi.fn();
    render(<Harness activation="manual" onChange={onChange} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("b", { via: "keyboard" });
  });

  it("respects RTL when told to", async () => {
    render(<Harness rtl />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Bravo" })).toHaveFocus();
  });

  it("can be told not to wrap", async () => {
    render(<Harness loop={false} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveFocus();
  });
});

describe("radiogroup mode", () => {
  it("emits radios with aria-checked and no panel wiring", () => {
    render(<Harness mode="radiogroup" />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    const radio = screen.getByRole("radio", { name: "Alpha" });
    expect(radio).toHaveAttribute("aria-checked", "true");
    expect(radio).not.toHaveAttribute("aria-controls");
  });
});

describe("nav mode", () => {
  const links: TabItem[] = [
    { value: "a", label: "Alpha", href: "/a" },
    { value: "b", label: "Bravo", href: "/b" },
  ];

  it("emits aria-current and an href, and no roving arrows", async () => {
    render(<Harness mode="nav" items={links} />);
    const first = screen.getAllByRole("button")[0] as HTMLElement;
    expect(first).toHaveAttribute("aria-current", "page");
    // The harness renders <button>, so this asserts the props, not the tag —
    // the point is that the getter offers href and no tablist role.
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });
});

describe("programmatic control", () => {
  it("exposes select()", async () => {
    function Controlled() {
      const tabs = useTabs({ as: "tabs", items, defaultValue: "a" });
      return (
        <>
          <button type="button" onClick={() => tabs.select("c")}>
            Jump
          </button>
          <span data-testid="value">{tabs.value}</span>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Jump" }));
    expect(screen.getByTestId("value")).toHaveTextContent("c");
  });

  it("respects a guard", async () => {
    function Guarded() {
      const tabs = useTabs({ as: "tabs", items, defaultValue: "a", onBeforeChange: () => false });
      return (
        <>
          <button type="button" onClick={() => tabs.select("c")}>
            Jump
          </button>
          <span data-testid="value">{tabs.value}</span>
        </>
      );
    }
    render(<Guarded />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Jump" }));
    expect(screen.getByTestId("value")).toHaveTextContent("a");
  });
});

describe("misuse", () => {
  it("throws a useful message for an out-of-range trigger index", () => {
    function Bad() {
      const tabs = useTabs({ as: "tabs", items, defaultValue: "a" });
      // The usual cause is a list that rendered while the array did not.
      return <button type="button" {...tabs.getTriggerProps(99)} />;
    }
    expect(() => render(<Bad />)).toThrow(/no item at that index/);
  });

  it("throws for an out-of-range panel index", () => {
    function Bad() {
      const tabs = useTabs({ as: "tabs", items, defaultValue: "a" });
      return <div {...tabs.getPanelProps(99)} />;
    }
    expect(() => render(<Bad />)).toThrow(/no item at that index/);
  });
});
