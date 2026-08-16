/**
 * Panels: mounting, focusability, and the state that survives a switch.
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "../src/index.js";

function Probe({ label, onMount }: { label: string; onMount: () => void }) {
  React.useEffect(onMount, [onMount]);
  return <p>{label}</p>;
}

describe("mount strategies", () => {
  it("lazy-once mounts on first visit and keeps it mounted afterwards", async () => {
    const mountedB = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Chart"
        defaultValue="a"
        items={[
          { value: "a", label: "A", children: <p>Panel A</p> },
          { value: "b", label: "B", children: <Probe label="Panel B" onMount={mountedB} /> },
        ]}
      />,
    );
    expect(mountedB).not.toHaveBeenCalled();

    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "B" }));
    expect(mountedB).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("tab", { name: "A" }));
    await user.click(screen.getByRole("tab", { name: "B" }));
    // Still one: the panel stayed mounted, so its state — a half-typed note,
    // a scroll position, an open accordion — survived the round trip.
    expect(mountedB).toHaveBeenCalledTimes(1);
  });

  it("lazy unmounts on the way out", async () => {
    const mountedB = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Chart"
        mount="lazy"
        defaultValue="a"
        items={[
          { value: "a", label: "A", children: <p>Panel A</p> },
          { value: "b", label: "B", children: <Probe label="Panel B" onMount={mountedB} /> },
        ]}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "B" }));
    await user.click(screen.getByRole("tab", { name: "A" }));
    await user.click(screen.getByRole("tab", { name: "B" }));
    expect(mountedB).toHaveBeenCalledTimes(2);
  });

  it("eager mounts everything up front but hides the inactive panels", () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Chart"
        mount="eager"
        defaultValue="a"
        items={[
          { value: "a", label: "A", children: <p>Panel A</p> },
          { value: "b", label: "B", children: <p>Panel B</p> },
        ]}
      />,
    );
    // Present in the DOM, absent from the accessibility tree.
    expect(screen.getByText("Panel B")).toBeInTheDocument();
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  });

  it("takes a per-panel override", async () => {
    const mountedB = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Chart"
        mount="lazy"
        defaultValue="a"
        items={[
          { value: "a", label: "A", children: <p>Panel A</p> },
          {
            value: "b",
            label: "B",
            mount: "eager",
            children: <Probe label="Panel B" onMount={mountedB} />,
          },
        ]}
      />,
    );
    expect(mountedB).toHaveBeenCalledTimes(1);
  });
});

describe("panel focusability", () => {
  it("a panel with no focusable content is reachable by keyboard", async () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Chart"
        defaultValue="a"
        items={[{ value: "a", label: "A", children: <p>Just prose.</p> }]}
      />,
    );
    // Otherwise a long, scrollable panel of text cannot be scrolled without a
    // pointer at all.
    expect(screen.getByRole("tabpanel")).toHaveAttribute("tabindex", "0");
  });

  it("a panel that has focusable content does not add a stop of its own", () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Chart"
        defaultValue="a"
        items={[
          {
            value: "a",
            label: "A",
            children: <button type="button">Inside</button>,
          },
        ]}
      />,
    );
    expect(screen.getByRole("tabpanel")).not.toHaveAttribute("tabindex");
  });

  it("re-evaluates when the content changes", async () => {
    function Switcher() {
      const [rich, setRich] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setRich(true)}>
            Load
          </button>
          <Tabs
            as="tabs"
            aria-label="Chart"
            defaultValue="a"
            items={[
              {
                value: "a",
                label: "A",
                children: rich ? <button type="button">Arrived</button> : <p>Loading…</p>,
              },
            ]}
          />
        </>
      );
    }
    render(<Switcher />);
    expect(screen.getByRole("tabpanel")).toHaveAttribute("tabindex", "0");
    // "Has a focusable child" is not a static property of a panel that loads
    // asynchronously.
    await userEvent.setup().click(screen.getByRole("button", { name: "Load" }));
    expect(screen.getByRole("tabpanel")).not.toHaveAttribute("tabindex");
  });
});

describe("controlled and uncontrolled", () => {
  it("an uncontrolled strip selects the first enabled tab when given no default", () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Chart"
        items={[
          { value: "a", label: "A", disabled: true, disabledReason: "Restricted" },
          { value: "b", label: "B" },
        ]}
      />,
    );
    // Starting on a disabled tab would leave an empty panel and no keyboard
    // way out of it.
    expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute("aria-selected", "true");
  });

  it("a controlled strip does not move on its own", async () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Chart"
        value="a"
        onChange={onChange}
        items={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "B" }));
    expect(onChange).toHaveBeenCalledWith("b", { via: "pointer" });
    // The owner did not update `value`, so the component must not either.
    expect(screen.getByRole("tab", { name: "A" })).toHaveAttribute("aria-selected", "true");
  });

  it("follows a controlled value that changes from outside", () => {
    const { rerender } = render(
      <Tabs
        as="tabs"
        aria-label="Chart"
        value="a"
        items={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
      />,
    );
    rerender(
      <Tabs
        as="tabs"
        aria-label="Chart"
        value="b"
        items={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
      />,
    );
    expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute("aria-selected", "true");
  });
});
