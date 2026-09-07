/**
 * The component under React.StrictMode.
 *
 * This file exists because of a bug that shipped: StrictMode mounts, runs
 * cleanup, and mounts again, so an effect whose cleanup disposed the change
 * gate left every strip permanently inert — no click, no arrow key, nothing.
 * It reproduced in the docs site immediately and in no test at all, because
 * Testing Library does not wrap renders in StrictMode by default.
 *
 * Next.js turns StrictMode on in the default template, so "works outside
 * StrictMode" is close to worthless as a guarantee.
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, useTabs, type TabItem } from "../src/index.js";

const items = [
  { value: "a", label: "Alpha", children: <p>Panel A</p> },
  { value: "b", label: "Bravo", children: <p>Panel B</p> },
  { value: "c", label: "Charlie", children: <p>Panel C</p> },
];

function renderStrict(ui: React.ReactElement) {
  return render(<React.StrictMode>{ui}</React.StrictMode>);
}

describe("uncontrolled, under StrictMode", () => {
  it("still selects on click", async () => {
    renderStrict(<Tabs as="tabs" aria-label="Docs" defaultValue="a" items={items} />);
    await userEvent.setup().click(screen.getByRole("tab", { name: "Bravo" }));
    expect(screen.getByRole("tab", { name: "Bravo" })).toHaveAttribute("aria-selected", "true");
  });

  it("still selects on arrow keys", async () => {
    renderStrict(<Tabs as="tabs" aria-label="Docs" defaultValue="a" items={items} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Bravo" })).toHaveAttribute("aria-selected", "true");
  });

  it("swaps the panel", async () => {
    renderStrict(<Tabs as="tabs" aria-label="Docs" defaultValue="a" items={items} />);
    await userEvent.setup().click(screen.getByRole("tab", { name: "Charlie" }));
    expect(screen.getByText("Panel C")).toBeInTheDocument();
  });
});

describe("controlled, under StrictMode", () => {
  it("reports the change so the owner can drive it", async () => {
    function Controlled() {
      const [value, setValue] = React.useState("a");
      return (
        <Tabs
          as="radiogroup"
          aria-label="Range"
          value={value}
          onChange={(next) => setValue(next)}
          items={[
            { value: "a", label: "Alpha" },
            { value: "b", label: "Bravo" },
          ]}
        />
      );
    }
    renderStrict(<Controlled />);
    await userEvent.setup().click(screen.getByRole("radio", { name: "Bravo" }));
    // The exact shape the docs gallery uses for its own chapter switcher —
    // which is where this was first seen failing.
    expect(screen.getByRole("radio", { name: "Bravo" })).toHaveAttribute("aria-checked", "true");
  });
});

describe("guards and editing survive StrictMode", () => {
  it("an async guard still resolves and commits", async () => {
    let resolve!: (allowed: boolean) => void;
    renderStrict(
      <Tabs
        as="tabs"
        aria-label="Note"
        defaultValue="a"
        items={items}
        onBeforeChange={() => new Promise<boolean>((r) => (resolve = r))}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Bravo" }));
    await waitFor(() => expect(screen.getByRole("tablist")).toHaveAttribute("aria-busy", "true"));
    resolve(true);
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Bravo" })).toHaveAttribute("aria-selected", "true"),
    );
  });

  it("a veto is still a veto", async () => {
    const onChange = vi.fn();
    renderStrict(
      <Tabs
        as="tabs"
        aria-label="Note"
        defaultValue="a"
        items={items}
        onChange={onChange}
        onBeforeChange={() => false}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Bravo" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("closing a tab still works", async () => {
    const onClose = vi.fn();
    renderStrict(
      <Tabs
        as="tabs"
        aria-label="Notes"
        defaultValue="a"
        items={[{ value: "a", label: "Note A", closable: true }]}
        editable={{ onClose }}
      />,
    );
    const close = screen.getByRole("tab").querySelector(".zb-tabs__close") as HTMLElement;
    await userEvent.setup().click(close);
    expect(onClose).toHaveBeenCalledWith("a");
  });
});

describe("useTabs under StrictMode", () => {
  it("still selects", async () => {
    const list: TabItem[] = [
      { value: "a", label: "Alpha" },
      { value: "b", label: "Bravo" },
    ];
    function Harness() {
      const tabs = useTabs({ as: "tabs", items: list, defaultValue: "a" });
      return (
        <>
          <div {...tabs.getListProps({ "aria-label": "Headless" })}>
            {list.map((item, index) => (
              <button key={item.value} type="button" {...tabs.getTriggerProps(index)}>
                {String(item.label)}
              </button>
            ))}
          </div>
          <span data-testid="value">{tabs.value}</span>
        </>
      );
    }
    renderStrict(<Harness />);
    await userEvent.setup().click(screen.getByRole("tab", { name: "Bravo" }));
    expect(screen.getByTestId("value")).toHaveTextContent("b");
  });
});
