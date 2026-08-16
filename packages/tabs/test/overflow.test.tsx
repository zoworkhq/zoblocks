/**
 * Overflow, wired up.
 *
 * jsdom has no layout, so `stubGeometry` supplies the boxes; the component
 * still does every piece of arithmetic itself.
 */

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "../src/index.js";
import { stubGeometry, stubScroll, triggerResize } from "./geometry.js";

const many = Array.from({ length: 8 }, (_, index) => ({
  value: `t${index}`,
  label: `Section ${index}`,
}));

let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
});

/**
 * Tell the component its boxes changed, then let the batched rAF measurement
 * run. Geometry can only be stubbed after render, so the observer has to be
 * fired by hand — in a browser the layout change does it.
 */
async function settle() {
  await act(async () => {
    triggerResize();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('overflow="scroll"', () => {
  it("renders nudge buttons outside the tab order", () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="t0" items={many} overflow="scroll" />);
    const nudges = document.querySelectorAll(".ox-tabs__nudge");
    expect(nudges).toHaveLength(2);
    // They duplicate what arrow keys already do; two extra tab stops that do
    // nothing for a keyboard user is a cost with no benefit.
    for (const nudge of Array.from(nudges)) {
      expect(nudge).toHaveAttribute("tabindex", "-1");
      expect(nudge).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("reports both edges when nothing overflows", async () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="t0" items={many} overflow="scroll" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 900, scrollWidth: 900, tabWidth: 100 });
    stubScroll(list, 0);
    await settle();

    const scroller = document.querySelector(".ox-tabs__bar");
    expect(scroller).toHaveAttribute("data-ox-start", "true");
    expect(scroller).toHaveAttribute("data-ox-end", "true");
  });

  it("drops the start fade once the strip is scrolled", async () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="t0" items={many} overflow="scroll" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 300, scrollWidth: 800, tabWidth: 100 });
    stubScroll(list, 250);
    await settle();

    const scroller = document.querySelector(".ox-tabs__bar");
    expect(scroller).toHaveAttribute("data-ox-start", "false");
    expect(scroller).toHaveAttribute("data-ox-end", "false");
  });

  it("treats RTL's negative scrollLeft as a distance from the start", async () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="t0" items={many} overflow="scroll" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 300, scrollWidth: 800, tabWidth: 100 });
    stubScroll(list, -500);
    await settle();
    expect(document.querySelector(".ox-tabs__bar")).toHaveAttribute("data-ox-end", "true");
  });

  it("scrolls the strip when a nudge is pressed", async () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="t0" items={many} overflow="scroll" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 300, scrollWidth: 800, tabWidth: 100 });
    stubScroll(list, 100);
    await settle();

    const scrollBy = vi.fn();
    list.scrollBy = scrollBy;
    const forward = document.querySelectorAll(".ox-tabs__nudge")[1] as HTMLElement;
    await userEvent.setup().click(forward);
    // 70% of a page: the edge tab stays visible as an anchor.
    expect(scrollBy).toHaveBeenCalledWith({ left: 210, behavior: "smooth" });
  });
});

describe('overflow="menu"', () => {
  it("moves the tabs that do not fit into a real menu", async () => {
    render(<Tabs as="tabs" aria-label="Report" defaultValue="t0" items={many} overflow="menu" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 400, scrollWidth: 800, tabWidth: 100, gap: 0 });
    await settle();

    const more = screen.getByRole("button", { name: /More/ });
    await userEvent.setup().click(more);

    // A menu, not a second tablist: a tablist split across two containers
    // reports an incoherent "n of m".
    const menu = screen.getByRole("menu");
    expect(within(menu).getAllByRole("menuitem").length).toBeGreaterThan(0);
  });

  it("keeps the selected tab visible even when it is far down the list", async () => {
    render(<Tabs as="tabs" aria-label="Report" defaultValue="t7" items={many} overflow="menu" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 400, scrollWidth: 800, tabWidth: 100 });
    await settle();

    // Losing your place because the window narrowed is the failure the pin
    // exists to prevent.
    const selected = screen.getByRole("tab", { name: "Section 7" });
    expect(selected.style.display).not.toBe("none");
  });

  it("selects from the menu and closes it", async () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Report"
        defaultValue="t0"
        items={many}
        overflow="menu"
        onChange={onChange}
      />,
    );
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 400, scrollWidth: 800, tabWidth: 100 });
    await settle();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /More/ }));
    const items = within(screen.getByRole("menu")).getAllByRole("menuitem");
    await user.click(items[0] as HTMLElement);

    expect(onChange).toHaveBeenCalledWith(expect.any(String), { via: "menu" });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("closes on Escape and returns focus to the button", async () => {
    render(<Tabs as="tabs" aria-label="Report" defaultValue="t0" items={many} overflow="menu" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 400, scrollWidth: 800, tabWidth: 100 });
    await settle();

    const user = userEvent.setup();
    const more = screen.getByRole("button", { name: /More/ });
    await user.click(more);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(more).toHaveFocus();
  });

  it("announces the hidden count", async () => {
    render(<Tabs as="tabs" aria-label="Report" defaultValue="t0" items={many} overflow="menu" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 400, scrollWidth: 800, tabWidth: 100 });
    await settle();
    expect(screen.getByRole("button", { name: /\d+ hidden/ })).toBeInTheDocument();
  });

  it("shows no More control when everything fits", async () => {
    render(<Tabs as="tabs" aria-label="Report" defaultValue="t0" items={many} overflow="menu" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 2000, scrollWidth: 800, tabWidth: 100 });
    await settle();
    expect(screen.queryByRole("button", { name: /More/ })).not.toBeInTheDocument();
  });
});

describe('overflow="collapse"', () => {
  it("becomes a native select in a narrow container", async () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Chart section"
        defaultValue="t0"
        items={many}
        overflow="collapse"
      />,
    );
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 320, scrollWidth: 800, tabWidth: 100 });
    await settle();

    // The only control that already has a platform picker on every phone.
    const select = await screen.findByRole("combobox", { name: "Chart section" });
    expect(within(select).getAllByRole("option")).toHaveLength(8);
  });

  it("changing the select selects the tab", async () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Chart section"
        defaultValue="t0"
        items={many}
        overflow="collapse"
        onChange={onChange}
      />,
    );
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 320, scrollWidth: 800, tabWidth: 100 });
    await settle();

    const select = await screen.findByRole("combobox");
    await userEvent.setup().selectOptions(select, "t3");
    expect(onChange).toHaveBeenCalledWith("t3", { via: "menu" });
  });

  it("stays a tablist in a wide container", async () => {
    render(
      <Tabs as="tabs" aria-label="Chart" defaultValue="t0" items={many} overflow="collapse" />,
    );
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 1200, scrollWidth: 800, tabWidth: 100 });
    await settle();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });
});

describe('overflow="wrap"', () => {
  it("is allowed in a radiogroup", () => {
    render(
      <Tabs
        as="radiogroup"
        aria-label="Speciality"
        defaultValue="t0"
        items={many}
        overflow="wrap"
      />,
    );
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
  });

  it("is refused on a tablist, where arrow navigation would become ambiguous", () => {
    expect(() =>
      render(<Tabs as="tabs" aria-label="Chart" defaultValue="t0" items={many} overflow="wrap" />),
    ).toThrow(/wrap-outside-radiogroup/);
  });
});
