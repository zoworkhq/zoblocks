/**
 * Remaining public surface: props and strategies with no test of their own.
 *
 * `overflow="none"` is the notable one — a documented strategy that until now
 * nothing exercised, which is exactly how a documented strategy quietly stops
 * working.
 */

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigProvider } from "antd";
import { Tabs, useTabs, type TabItem } from "../src/index.js";
import { useAntdTabsTokens } from "../src/antd.js";
import { stubGeometry, triggerResize } from "./geometry.js";

let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
});

const items = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
];

describe('overflow="none"', () => {
  it("renders a plain strip with no scroll affordances and no menu", async () => {
    render(<Tabs as="tabs" aria-label="Docs" defaultValue="a" items={items} overflow="none" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 100, scrollWidth: 900, tabWidth: 100 });
    await act(async () => {
      triggerResize();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // "You have measured and they always fit" — so the component adds nothing.
    expect(document.querySelector(".ox-tabs__nudge")).toBeNull();
    expect(screen.queryByRole("button", { name: /More/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

  it("still selects normally", async () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="a"
        items={items}
        overflow="none"
        onChange={onChange}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Bravo" }));
    expect(onChange).toHaveBeenCalledWith("b", { via: "pointer" });
  });
});

describe("icons", () => {
  it("renders the icon and hides it from the accessible name", () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Chart"
        defaultValue="labs"
        items={[{ value: "labs", label: "Labs", icon: <svg data-testid="flask" /> }]}
      />,
    );
    const icon = screen.getByTestId("flask").parentElement;
    // An icon is decoration, never a name — a tab labelled only by a glyph is
    // a tab with no name at all.
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("tab")).toHaveAccessibleName("Labs");
  });
});

describe("collapsed picker details", () => {
  it("shows the count alongside the label, and disables an unavailable option", async () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Chart section"
        defaultValue="a"
        overflow="collapse"
        items={[
          { value: "a", label: "Alpha", count: 4 },
          { value: "b", label: "Bravo", disabled: true, disabledReason: "Restricted" },
          { value: "c", label: "Charlie" },
        ]}
      />,
    );
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 320, scrollWidth: 900, tabWidth: 100 });
    await act(async () => {
      triggerResize();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const select = await screen.findByRole("combobox", { name: "Chart section" });
    // The badge cannot survive into an <option>, so the count goes inline —
    // otherwise the collapsed strip silently loses information the wide one had.
    expect(select).toHaveTextContent("Alpha (4)");
    expect(screen.getByRole("option", { name: "Bravo" })).toBeDisabled();
  });
});

describe("ref forwarding", () => {
  it("accepts a callback ref on a trigger", () => {
    const seen: HTMLElement[] = [];
    render(
      <Tabs.Root as="tabs" defaultValue="a">
        <Tabs.List aria-label="Docs">
          <Tabs.Trigger
            value="a"
            ref={(node) => {
              if (node) seen.push(node);
            }}
          >
            Alpha
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>,
    );
    expect(seen[0]).toBe(screen.getByRole("tab", { name: "Alpha" }));
  });

  it("accepts an object ref on a trigger", () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Tabs.Root as="tabs" defaultValue="a">
        <Tabs.List aria-label="Docs">
          <Tabs.Trigger value="a" ref={ref}>
            Alpha
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>,
    );
    expect(ref.current).toBe(screen.getByRole("tab", { name: "Alpha" }));
  });

  it("forwards a ref to the root element", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Tabs as="tabs" aria-label="Docs" defaultValue="a" items={items} ref={ref} />);
    expect(ref.current).toHaveClass("ox-tabs");
  });
});

describe("Tabs.Root used directly", () => {
  it("refuses an unknown mode with the message that names the fix", () => {
    expect(() =>
      render(
        // @ts-expect-error deliberately invalid
        <Tabs.Root as="tabbed">
          <Tabs.List aria-label="Docs">
            <Tabs.Trigger value="a">Alpha</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>,
      ),
    ).toThrow(/missing-mode/);
  });

  it("still validates its own items when no declarative parent has done so", () => {
    expect(() =>
      render(
        <Tabs.Root as="tabs" defaultValue="a">
          <Tabs.List aria-label="Docs">
            <Tabs.Trigger value="a">Alpha</Tabs.Trigger>
            <Tabs.Trigger value="a">Also Alpha</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>,
      ),
    ).toThrow(/duplicate-value/);
  });
});

describe("keyboard no-ops", () => {
  it("Delete on a tab that is not closable does nothing", async () => {
    const onClose = vi.fn();
    render(
      <Tabs as="tabs" aria-label="Docs" defaultValue="a" items={items} editable={{ onClose }} />,
    );
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{Delete}");
    // A tab the host did not mark closable must not vanish because someone
    // pressed Delete while reading it.
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Delete does nothing when there is no close handler at all", async () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="a"
        items={[{ value: "a", label: "Alpha" }]}
      />,
    );
    const user = userEvent.setup();
    await user.tab();
    await expect(user.keyboard("{Delete}")).resolves.toBeUndefined();
    expect(screen.getByRole("tab", { name: "Alpha" })).toBeInTheDocument();
  });

  it("ignores keys pressed while focus is outside the strip", async () => {
    const onChange = vi.fn();
    render(
      <>
        <button type="button">Outside</button>
        <Tabs as="tabs" aria-label="Docs" defaultValue="a" items={items} onChange={onChange} />
      </>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Outside" }));
    await user.keyboard("{ArrowRight}");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("useTabs surface", () => {
  const list: TabItem[] = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Bravo" },
  ];

  it("getListProps works with no argument", () => {
    function Harness() {
      const tabs = useTabs({ as: "tabs", items: list, defaultValue: "a" });
      return <div {...tabs.getListProps()} data-testid="list" />;
    }
    render(<Harness />);
    expect(screen.getByTestId("list")).toHaveAttribute("role", "tablist");
  });

  it("offers the href in nav mode and no tablist role", () => {
    const links: TabItem[] = [
      { value: "a", label: "Alpha", href: "/a" },
      { value: "b", label: "Bravo", href: "/b" },
    ];
    function Harness() {
      const tabs = useTabs({ as: "nav", items: links, defaultValue: "a" });
      return (
        <div {...tabs.getListProps({ "aria-label": "Nav" })}>
          {links.map((item, index) => {
            const { ref, ...props } = tabs.getTriggerProps(index);
            return (
              <a key={item.value} ref={ref as React.Ref<HTMLAnchorElement>} {...props}>
                {String(item.label)}
              </a>
            );
          })}
        </div>
      );
    }
    render(<Harness />);
    expect(screen.getByRole("link", { name: "Bravo" })).toHaveAttribute("href", "/b");
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });
});

describe("the antd bridge falls back sensibly", () => {
  function Probe() {
    const tokens = useAntdTabsTokens();
    return <span data-testid="tokens">{JSON.stringify(tokens)}</span>;
  }

  it("uses borderRadius when the large variant is not set", () => {
    render(
      <ConfigProvider theme={{ token: { borderRadiusLG: undefined, borderRadius: 3 } }}>
        <Probe />
      </ConfigProvider>,
    );
    const tokens = JSON.parse(screen.getByTestId("tokens").textContent ?? "{}");
    // antd derives borderRadiusLG from borderRadius, so the point of the chain
    // is that a theme setting only the base value still gets a coherent pair.
    const inner = Number.parseFloat(String(tokens["--ox-tabs-thumb-radius"]));
    const outer = Number.parseFloat(String(tokens["--ox-tabs-track-radius"]));
    expect(Number.isFinite(inner)).toBe(true);
    expect(outer).toBeGreaterThan(inner);
  });
});
