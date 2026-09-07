/**
 * The accessibility tree, per semantic mode.
 *
 * These are the assertions that make `as` worth being required. Four modes,
 * four different trees, one set of pixels — and the failure they guard against
 * (a tablist of links) is invisible to every automated checker because each
 * individual attribute is spelled correctly.
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Tabs } from "../src/index.js";

const items = [
  { value: "summary", label: "Summary", children: <p>Summary panel</p> },
  { value: "labs", label: "Labs", children: <p>Labs panel</p> },
  { value: "meds", label: "Medications", children: <p>Meds panel</p> },
];

describe('as="tabs"', () => {
  it("renders a named tablist of buttons", () => {
    render(<Tabs as="tabs" aria-label="Chart sections" defaultValue="summary" items={items} />);
    const tablist = screen.getByRole("tablist", { name: "Chart sections" });
    expect(within(tablist).getAllByRole("tab")).toHaveLength(3);
  });

  it("marks exactly one tab selected", () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="labs" items={items} />);
    const selected = screen
      .getAllByRole("tab")
      .filter((tab) => tab.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveAccessibleName(/Labs/);
  });

  it("wires aria-controls to a panel that points back with aria-labelledby", () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="summary" items={items} />);
    const tab = screen.getByRole("tab", { name: "Summary" });
    const panel = screen.getByRole("tabpanel");
    expect(tab).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", tab.id);
  });

  it("exposes only the selected panel", () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="summary" items={items} />);
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    expect(screen.getByText("Summary panel")).toBeInTheDocument();
    expect(screen.queryByText("Labs panel")).not.toBeInTheDocument();
  });

  it("puts exactly one trigger in the tab order", () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="labs" items={items} />);
    const stops = screen.getAllByRole("tab").filter((tab) => tab.tabIndex === 0);
    expect(stops).toHaveLength(1);
    expect(stops[0]).toHaveAttribute("aria-selected", "true");
  });

  it("sets aria-orientation to match the arrow-key axis", () => {
    const { rerender } = render(
      <Tabs as="tabs" aria-label="Chart" defaultValue="summary" items={items} />,
    );
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "horizontal");
    rerender(
      <Tabs
        as="tabs"
        aria-label="Chart"
        orientation="vertical"
        defaultValue="summary"
        items={items}
      />,
    );
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
  });
});

describe('as="nav"', () => {
  const links = [
    { value: "account", label: "Account", href: "/account" },
    { value: "billing", label: "Billing", href: "/billing" },
  ];

  it("renders a real <nav> of anchors, not a tablist", () => {
    render(<Tabs as="nav" aria-label="Settings" defaultValue="account" items={links} />);
    expect(screen.getByRole("navigation", { name: "Settings" })).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("marks the current page with aria-current, not aria-selected", () => {
    render(<Tabs as="nav" aria-label="Settings" defaultValue="account" items={links} />);
    const current = screen.getByRole("link", { name: "Account" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).not.toHaveAttribute("aria-selected");
  });

  it("keeps every link in the tab order — no roving tabindex on navigation", () => {
    render(<Tabs as="nav" aria-label="Settings" defaultValue="account" items={links} />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("tabindex");
    }
  });

  it("keeps real hrefs, so cmd-click and middle-click still work", () => {
    render(<Tabs as="nav" aria-label="Settings" defaultValue="account" items={links} />);
    expect(screen.getByRole("link", { name: "Billing" })).toHaveAttribute("href", "/billing");
  });

  it("owns no panels", () => {
    render(<Tabs as="nav" aria-label="Settings" defaultValue="account" items={links} />);
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
  });
});

describe('as="radiogroup"', () => {
  const ranges = [
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "1y", label: "1 year" },
  ];

  it("renders a named radiogroup of radios", () => {
    render(
      <Tabs as="radiogroup" aria-label="Show results from" defaultValue="7d" items={ranges} />,
    );
    const group = screen.getByRole("radiogroup", { name: "Show results from" });
    expect(within(group).getAllByRole("radio")).toHaveLength(3);
  });

  it("uses aria-checked", () => {
    render(<Tabs as="radiogroup" aria-label="Range" defaultValue="30d" items={ranges} />);
    expect(screen.getByRole("radio", { name: "30 days" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "7 days" })).toHaveAttribute("aria-checked", "false");
  });

  it("owns no panels", () => {
    render(<Tabs as="radiogroup" aria-label="Range" defaultValue="7d" items={ranges} />);
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
  });

  it("refuses panel content rather than silently dropping it", () => {
    // Rendering the children with nothing to label them, or discarding them
    // quietly, are both worse than saying the mode is wrong for this content.
    expect(() =>
      render(
        <Tabs
          as="radiogroup"
          aria-label="Range"
          defaultValue="7d"
          items={[{ value: "7d", label: "7 days", children: <p>ignored</p> }]}
        />,
      ),
    ).toThrow(/panels-without-owner/);
  });
});

describe("counts, tones and dots reach the accessible name", () => {
  it('announces a critical count as the word "critical", never as colour alone', () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Results"
        defaultValue="chem"
        items={[{ value: "chem", label: "Chemistry", count: 2, tone: "critical" }]}
      />,
    );
    expect(screen.getByRole("tab")).toHaveAccessibleName("Chemistry, 2 critical");
  });

  it("announces a plain count as items", () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Inbox"
        defaultValue="all"
        items={[{ value: "all", label: "All", count: 12 }]}
      />,
    );
    expect(screen.getByRole("tab")).toHaveAccessibleName("All, 12 items");
  });

  it("announces a dirty marker and stale availability", () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Notes"
        defaultValue="note"
        items={[{ value: "note", label: "Progress note", dot: "dirty", availability: "stale" }]}
      />,
    );
    expect(screen.getByRole("tab")).toHaveAccessibleName(
      "Progress note, unsaved changes, showing cached data",
    );
  });

  it("hides the visual badge from assistive technology so the number is not read twice", () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Inbox"
        defaultValue="all"
        items={[{ value: "all", label: "All", count: 12 }]}
      />,
    );
    const badge = screen.getByRole("tab").querySelector(".zb-tabs__count");
    expect(badge).toHaveAttribute("aria-hidden", "true");
  });
});

describe("disabled triggers", () => {
  const withRestricted = [
    { value: "summary", label: "Summary" },
    {
      value: "bh",
      label: "Behavioural health",
      disabled: true,
      disabledReason: "Restricted — request access",
    },
  ];

  it("uses aria-disabled, never the disabled attribute", () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="summary" items={withRestricted} />);
    const tab = screen.getByRole("tab", { name: /Behavioural health/ });
    expect(tab).toHaveAttribute("aria-disabled", "true");
    // The attribute would remove it from the tree entirely, and "no such
    // section" is a different clinical fact from "restricted".
    expect(tab).not.toBeDisabled();
  });

  it("announces why through aria-describedby", () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="summary" items={withRestricted} />);
    expect(screen.getByRole("tab", { name: /Behavioural health/ })).toHaveAccessibleDescription(
      "Restricted — request access",
    );
  });

  it("stays discoverable — it is still rendered and still has a name", () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="summary" items={withRestricted} />);
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });
});

describe("the compound API produces the same tree", () => {
  it("wires ids across separately-declared parts", () => {
    render(
      <Tabs.Root as="tabs" defaultValue="one">
        <Tabs.List aria-label="Manual">
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panels>
          <Tabs.Panel value="one">First</Tabs.Panel>
          <Tabs.Panel value="two">Second</Tabs.Panel>
        </Tabs.Panels>
      </Tabs.Root>,
    );
    const tab = screen.getByRole("tab", { name: "One" });
    const panel = screen.getByRole("tabpanel");
    expect(tab).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", tab.id);
  });

  it("refuses to render a part outside its root, rather than doing nothing quietly", () => {
    // A trigger that renders as a button announcing nothing and controlling
    // nothing is the exact failure this whole component exists to avoid.
    expect(() => render(<Tabs.Trigger value="orphan">Orphan</Tabs.Trigger>)).toThrow(
      /must be rendered inside <Tabs.Root>/,
    );
  });
});
