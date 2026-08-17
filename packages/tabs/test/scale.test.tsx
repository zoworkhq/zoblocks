/**
 * Behaviour that only appears at scale, or on the way out.
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "../src/index.js";

const many = Array.from({ length: 60 }, (_, index) => ({
  value: `t${index}`,
  label: `Section ${index}`,
}));

describe("a long strip", () => {
  it("still renders every trigger, so the announced count is the true one", () => {
    render(<Tabs as="tabs" aria-label="Sections" defaultValue="t0" items={many} />);
    // Past the observation threshold the component stops watching each trigger
    // individually — but it never stops rendering them. A tablist that reports
    // "20 tabs" when there are 60 has lied to a screen reader.
    expect(screen.getAllByRole("tab")).toHaveLength(60);
  });

  it("keeps the roving tab stop correct", () => {
    render(<Tabs as="tabs" aria-label="Sections" defaultValue="t30" items={many} />);
    const stops = screen.getAllByRole("tab").filter((tab) => tab.tabIndex === 0);
    expect(stops).toHaveLength(1);
    expect(stops[0]).toHaveAccessibleName("Section 30");
  });

  it("still selects", async () => {
    render(<Tabs as="tabs" aria-label="Sections" defaultValue="t0" items={many} />);
    await userEvent.setup().click(screen.getByRole("tab", { name: "Section 42" }));
    expect(screen.getByRole("tab", { name: "Section 42" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("virtualise does not change the accessibility tree", () => {
    const { rerender } = render(
      <Tabs as="tabs" aria-label="Sections" defaultValue="t0" items={many} />,
    );
    const plain = screen.getAllByRole("tab").length;
    rerender(<Tabs as="tabs" aria-label="Sections" defaultValue="t0" items={many} virtualise />);
    expect(screen.getAllByRole("tab")).toHaveLength(plain);
  });
});

describe("panels on the way out", () => {
  it("drops aria-controls when the panel unmounts", async () => {
    const items = [
      { value: "a", label: "Alpha", children: <p>Panel A</p> },
      { value: "b", label: "Bravo", children: <p>Panel B</p> },
    ];
    render(<Tabs as="tabs" aria-label="Docs" mount="lazy" defaultValue="a" items={items} />);
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-controls");

    await userEvent.setup().click(screen.getByRole("tab", { name: "Bravo" }));
    // `mount="lazy"` unmounts the panel behind you. Leaving the reference
    // behind would point at an element that no longer exists.
    expect(screen.getByRole("tab", { name: "Alpha" })).not.toHaveAttribute("aria-controls");
    expect(screen.getByRole("tab", { name: "Bravo" })).toHaveAttribute("aria-controls");
  });

  it("survives the whole strip unmounting mid-interaction", async () => {
    function Host() {
      const [show, setShow] = React.useState(true);
      return (
        <>
          <button type="button" onClick={() => setShow(false)}>
            Hide
          </button>
          {show ? (
            <Tabs
              as="tabs"
              aria-label="Docs"
              defaultValue="a"
              items={[
                { value: "a", label: "Alpha" },
                { value: "b", label: "Bravo" },
              ]}
            />
          ) : null}
        </>
      );
    }
    render(<Host />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Bravo" }));
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Hide" }));
    });
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });
});
