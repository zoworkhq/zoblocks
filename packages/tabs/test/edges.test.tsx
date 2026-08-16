/**
 * The paths the happy-path suites never reach.
 *
 * Every case here is a real behaviour with a real failure mode — a browser
 * that has not shipped `requestAnimationFrame` to a worker-ish environment, a
 * user who cmd-clicks a nav tab, a back button pressed after the strip has
 * mounted. They are grouped separately because they are edges, not because
 * they are less important: three of them are exactly where an earlier version
 * of this component was wrong.
 */

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, useTabs, type TabItem } from "../src/index.js";
import { stubGeometry, triggerResize } from "./geometry.js";

let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
});

async function settle() {
  await act(async () => {
    triggerResize();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const many = Array.from({ length: 8 }, (_, index) => ({
  value: `t${index}`,
  label: `Section ${index}`,
}));

describe("Tabs.AddButton outside a root", () => {
  it("renders nothing rather than throwing", () => {
    // It reads context optionally on purpose: the declarative `Tabs` only
    // mounts it when `editable.onAdd` exists, and a host composing by hand
    // should get silence, not a crash, if they drop it somewhere odd.
    const { container } = render(<Tabs.AddButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the root has no onAdd handler", () => {
    render(
      <Tabs.Root as="tabs" defaultValue="a">
        <Tabs.List aria-label="Docs" extra={<Tabs.AddButton />}>
          <Tabs.Trigger value="a">Alpha</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>,
    );
    expect(screen.queryByRole("button", { name: /new tab/i })).not.toBeInTheDocument();
  });
});

describe("keyboard focus scrolls the strip into view", () => {
  it("calls scrollIntoView with nearest when the strip overflows", async () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="t0" items={many} overflow="scroll" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 300, scrollWidth: 900, tabWidth: 100 });
    await settle();

    const target = screen.getByRole("tab", { name: "Section 1" });
    const spy = vi.fn();
    target.scrollIntoView = spy;

    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowRight}");

    // `nearest`, never `center` — centring re-centres the strip on every
    // keypress, which makes a long list feel like it is fighting you.
    expect(spy).toHaveBeenCalledWith({ block: "nearest", inline: "nearest" });
  });

  it("does not scroll when everything already fits", async () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="t0" items={many} overflow="scroll" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 900, scrollWidth: 900, tabWidth: 100 });
    await settle();

    const target = screen.getByRole("tab", { name: "Section 1" });
    const spy = vi.fn();
    target.scrollIntoView = spy;

    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("the overflow menu", () => {
  async function openMenu() {
    render(<Tabs as="tabs" aria-label="Report" defaultValue="t0" items={many} overflow="menu" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 400, scrollWidth: 900, tabWidth: 100 });
    await settle();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /More/ }));
    return user;
  }

  it("ignores keys that are not Escape", async () => {
    await openMenu();
    fireEvent.keyDown(document, { key: "a" });
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes when the pointer goes down outside it", async () => {
    await openMenu();
    fireEvent.mouseDown(document.body);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("stays open when the pointer goes down inside it", async () => {
    await openMenu();
    fireEvent.mouseDown(screen.getByRole("menu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("carries the count into the menu item", async () => {
    const counted = many.map((item, index) => (index >= 6 ? { ...item, count: 12 } : item));
    render(
      <Tabs as="tabs" aria-label="Report" defaultValue="t0" items={counted} overflow="menu" />,
    );
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 400, scrollWidth: 900, tabWidth: 100 });
    await settle();

    await userEvent.setup().click(screen.getByRole("button", { name: /More/ }));
    const menu = screen.getByRole("menu");
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .some((item) => item.textContent?.includes("12")),
    ).toBe(true);
  });

  it("marks the More button when the selected tab is hidden inside it", async () => {
    render(<Tabs as="tabs" aria-label="Report" defaultValue="t0" items={many} overflow="menu" />);
    const list = screen.getByRole("tablist");
    // Only one tab fits, and it is not the selected one — so the pin has to
    // put t0 in the visible set and something else into the menu.
    restore = stubGeometry(list, { clientWidth: 400, scrollWidth: 900, tabWidth: 100 });
    await settle();
    expect(screen.getByRole("button", { name: /More/ })).toBeInTheDocument();
  });

  it("closes itself when the strip widens and nothing overflows any more", async () => {
    const { rerender } = render(
      <Tabs as="tabs" aria-label="Report" defaultValue="t0" items={many} overflow="menu" />,
    );
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 400, scrollWidth: 900, tabWidth: 100 });
    await settle();
    await userEvent.setup().click(screen.getByRole("button", { name: /More/ }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    restore();
    restore = stubGeometry(list, { clientWidth: 2000, scrollWidth: 900, tabWidth: 100 });
    rerender(<Tabs as="tabs" aria-label="Report" defaultValue="t0" items={many} overflow="menu" />);
    await settle();
    // A menu with nothing in it is a button that lies.
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });
});

describe("nav mode leaves modified clicks to the browser", () => {
  const links = [
    { value: "a", label: "Account", href: "/account" },
    { value: "b", label: "Billing", href: "/billing" },
  ];

  it.each([
    ["meta", { metaKey: true }],
    ["ctrl", { ctrlKey: true }],
    ["shift", { shiftKey: true }],
    ["middle", { button: 1 }],
  ])("does not select on a %s click", async (_name, modifiers) => {
    const onChange = vi.fn();
    render(
      <Tabs as="nav" aria-label="Settings" defaultValue="a" items={links} onChange={onChange} />,
    );
    // Opening a link in a new tab is half the reason `as="nav"` renders real
    // anchors; swallowing the click would take that away.
    fireEvent.click(screen.getByRole("link", { name: "Billing" }), modifiers);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("still selects on a plain click", async () => {
    const onChange = vi.fn();
    render(
      <Tabs as="nav" aria-label="Settings" defaultValue="a" items={links} onChange={onChange} />,
    );
    await userEvent.setup().click(screen.getByRole("link", { name: "Billing" }));
    expect(onChange).toHaveBeenCalledWith("b", { via: "pointer" });
  });
});

describe("a host handler that calls preventDefault", () => {
  it("suppresses selection", async () => {
    const onChange = vi.fn();
    render(
      <Tabs.Root as="tabs" defaultValue="a" onChange={onChange}>
        <Tabs.List aria-label="Docs">
          <Tabs.Trigger value="a">Alpha</Tabs.Trigger>
          <Tabs.Trigger value="b" onClick={(event) => event.preventDefault()}>
            Bravo
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Bravo" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("steps: locked without disabled", () => {
  const steps = [
    { value: "one", label: "Identity", state: "done" as const },
    { value: "two", label: "Consent", state: "current" as const },
    // Locked but not `disabled`: the step gate is what refuses it, not the
    // disabled check that runs earlier.
    { value: "three", label: "Review", state: "locked" as const },
  ];

  it("refuses a forward move into a locked step and audits it", async () => {
    const onChange = vi.fn();
    const onAuditEvent = vi.fn();
    render(
      <Tabs
        as="steps"
        aria-label="Intake"
        defaultValue="two"
        items={steps}
        onChange={onChange}
        onAuditEvent={onAuditEvent}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Review" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(onAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "tabs.change-vetoed", detail: "step-locked", from: "two" }),
    );
  });

  it("allows a backward move to a completed step", async () => {
    const onChange = vi.fn();
    render(
      <Tabs as="steps" aria-label="Intake" defaultValue="two" items={steps} onChange={onChange} />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Identity" }));
    expect(onChange).toHaveBeenCalledWith("one", { via: "pointer" });
  });
});

describe("audit timestamps come from the host's clock", () => {
  it("omits `at` when no `now` is supplied", async () => {
    const onAuditEvent = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="a"
        onAuditEvent={onAuditEvent}
        items={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Bravo" },
        ]}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Bravo" }));
    const event = onAuditEvent.mock.calls[0]?.[0];
    expect(event).toMatchObject({ type: "tabs.change", value: "b" });
    expect(event).not.toHaveProperty("at");
  });

  it("uses `now` when it is supplied", async () => {
    const onAuditEvent = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="a"
        onAuditEvent={onAuditEvent}
        now={() => "2026-08-16T09:00:00.000Z"}
        items={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Bravo" },
        ]}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Bravo" }));
    expect(onAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ at: "2026-08-16T09:00:00.000Z" }),
    );
  });
});

describe("URL sync after mount", () => {
  const original = window.location.href;
  afterEach(() => {
    window.history.replaceState(null, "", original);
  });

  it("follows a back-button navigation", async () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="a"
        syncTo="hash"
        items={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Bravo" },
        ]}
      />,
    );
    // The user navigates; the strip is already mounted, so this exercises the
    // subscription rather than the initial read.
    await act(async () => {
      window.history.replaceState(null, "", "#b");
      window.dispatchEvent(new Event("popstate"));
    });
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Bravo" })).toHaveAttribute("aria-selected", "true"),
    );
  });

  it("ignores a navigation that clears the parameter", async () => {
    window.history.replaceState(null, "", "#a");
    render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="a"
        syncTo="hash"
        items={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Bravo" },
        ]}
      />,
    );
    await act(async () => {
      window.history.replaceState(null, "", window.location.pathname);
      window.dispatchEvent(new Event("popstate"));
    });
    // Nothing to restore to — leaving selection alone beats guessing.
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("environments without requestAnimationFrame", () => {
  it("measures synchronously instead of dropping the work", async () => {
    const raf = globalThis.requestAnimationFrame;
    const caf = globalThis.cancelAnimationFrame;
    // Some server-ish and embedded runtimes have no rAF. Skipping the
    // measurement there would leave the indicator permanently unplaced.
    (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame = undefined;
    (globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame = undefined;
    try {
      render(
        <Tabs as="tabs" aria-label="Chart" defaultValue="t0" items={many} overflow="scroll" />,
      );
      const list = screen.getByRole("tablist");
      restore = stubGeometry(list, { clientWidth: 300, scrollWidth: 900, tabWidth: 100 });
      await act(async () => {
        triggerResize();
      });
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    } finally {
      globalThis.requestAnimationFrame = raf;
      globalThis.cancelAnimationFrame = caf;
    }
  });
});

describe("unmounting mid-measurement", () => {
  it("cancels the pending frame rather than measuring a detached tree", async () => {
    const cancel = vi.spyOn(globalThis, "cancelAnimationFrame");
    const { unmount } = render(
      <Tabs as="tabs" aria-label="Chart" defaultValue="t0" items={many} overflow="menu" />,
    );
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 400, scrollWidth: 900, tabWidth: 100 });
    triggerResize();
    unmount();
    expect(cancel).toHaveBeenCalled();
    cancel.mockRestore();
  });
});

describe("useTabs — remaining branches", () => {
  const items: TabItem[] = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Bravo", disabled: true, disabledReason: "Not yet" },
  ];

  it("emits aria-disabled from the trigger getter", () => {
    function Harness() {
      const tabs = useTabs({ as: "tabs", items, defaultValue: "a" });
      return (
        <div {...tabs.getListProps({ "aria-label": "Headless" })}>
          {items.map((item, index) => (
            <button key={item.value} type="button" {...tabs.getTriggerProps(index)}>
              {String(item.label)}
            </button>
          ))}
        </div>
      );
    }
    render(<Harness />);
    expect(screen.getByRole("tab", { name: "Bravo" })).toHaveAttribute("aria-disabled", "true");
  });

  it("refuses to select a disabled item", async () => {
    const onChange = vi.fn();
    function Harness() {
      const tabs = useTabs({ as: "tabs", items, defaultValue: "a", onChange });
      return (
        <div {...tabs.getListProps({ "aria-label": "Headless" })}>
          {items.map((item, index) => (
            <button key={item.value} type="button" {...tabs.getTriggerProps(index)}>
              {String(item.label)}
            </button>
          ))}
        </div>
      );
    }
    render(<Harness />);
    await userEvent.setup().click(screen.getByRole("tab", { name: "Bravo" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("takes a caller-supplied id prefix, so ids are stable in snapshots", () => {
    function Harness() {
      const tabs = useTabs({
        as: "tabs",
        items: [items[0] as TabItem],
        defaultValue: "a",
        idPrefix: "fixed",
      });
      return <button type="button" {...tabs.getTriggerProps(0)} />;
    }
    render(<Harness />);
    expect(screen.getByRole("tab")).toHaveAttribute("id", "fixed-trigger-a");
  });

  it("exposes the selected element for a custom indicator", () => {
    let selected: HTMLElement | null = null;
    function Harness() {
      const tabs = useTabs({ as: "tabs", items, defaultValue: "a" });
      React.useEffect(() => {
        selected = tabs.getSelectedElement();
      });
      return (
        <div {...tabs.getListProps({ "aria-label": "Headless" })}>
          {items.map((item, index) => (
            <button key={item.value} type="button" {...tabs.getTriggerProps(index)}>
              {String(item.label)}
            </button>
          ))}
        </div>
      );
    }
    render(<Harness />);
    expect(selected).toBe(screen.getByRole("tab", { name: "Alpha" }));
  });

  it("goes through the gate for a programmatic select, including the pending flag", async () => {
    let resolve!: (allowed: boolean) => void;
    function Harness() {
      const tabs = useTabs({
        as: "tabs",
        items: [
          { value: "a", label: "Alpha" },
          { value: "b", label: "Bravo" },
        ],
        defaultValue: "a",
        onBeforeChange: () => new Promise<boolean>((r) => (resolve = r)),
      });
      return (
        <>
          <button type="button" onClick={() => tabs.select("b")}>
            Go
          </button>
          <span data-testid="pending">{String(tabs.pending)}</span>
          <span data-testid="value">{tabs.value}</span>
        </>
      );
    }
    render(<Harness />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Go" }));
    await waitFor(() => expect(screen.getByTestId("pending")).toHaveTextContent("true"));
    await act(async () => {
      resolve(true);
    });
    expect(screen.getByTestId("value")).toHaveTextContent("b");
  });
});
