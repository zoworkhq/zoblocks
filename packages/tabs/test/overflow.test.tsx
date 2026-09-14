/**
 * Overflow, wired up.
 *
 * jsdom has no layout, so `stubGeometry` supplies the boxes; the component
 * still does every piece of arithmetic itself.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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
    const nudges = document.querySelectorAll(".zb-tabs__nudge");
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

    const scroller = document.querySelector(".zb-tabs__bar");
    expect(scroller).toHaveAttribute("data-zb-start", "true");
    expect(scroller).toHaveAttribute("data-zb-end", "true");
  });

  it("drops the start fade once the strip is scrolled", async () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="t0" items={many} overflow="scroll" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 300, scrollWidth: 800, tabWidth: 100 });
    stubScroll(list, 250);
    await settle();

    const scroller = document.querySelector(".zb-tabs__bar");
    expect(scroller).toHaveAttribute("data-zb-start", "false");
    expect(scroller).toHaveAttribute("data-zb-end", "false");
  });

  it("treats RTL's negative scrollLeft as a distance from the start", async () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="t0" items={many} overflow="scroll" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 300, scrollWidth: 800, tabWidth: 100 });
    stubScroll(list, -500);
    await settle();
    expect(document.querySelector(".zb-tabs__bar")).toHaveAttribute("data-zb-end", "true");
  });

  it("scrolls the strip when a nudge is pressed", async () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="t0" items={many} overflow="scroll" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 300, scrollWidth: 800, tabWidth: 100 });
    stubScroll(list, 100);
    await settle();

    const scrollBy = vi.fn();
    list.scrollBy = scrollBy;
    const forward = document.querySelectorAll(".zb-tabs__nudge")[1] as HTMLElement;
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

describe("hidden controls stay hidden under the stylesheet", () => {
  // A string, not `new URL(...)`: jsdom replaces the URL global with one
  // `fileURLToPath` rejects.
  const css = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), "../src/styles.css"),
    "utf8",
  );
  let sheet: HTMLStyleElement | null = null;
  afterEach(() => {
    sheet?.remove();
    sheet = null;
  });
  function installStyles() {
    sheet = document.createElement("style");
    sheet.textContent = css;
    document.head.append(sheet);
  }

  it("the collapsed tablist is display:none, not just hidden", async () => {
    installStyles();
    render(
      <Tabs
        as="tabs"
        aria-label="Chart section"
        defaultValue="t0"
        items={many}
        overflow="collapse"
        fill="equal"
      />,
    );
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 320, scrollWidth: 800, tabWidth: 100 });
    await settle();
    await screen.findByRole("combobox");

    expect(list).toHaveAttribute("hidden");
    // `.zb-tabs__list { display: flex }` beats the UA `[hidden]` rule, so
    // without an explicit rule the strip sat visible beside the select.
    expect(css).toMatch(/\.zb-tabs__list\[hidden\][^{]*\{\s*display:\s*none\s*!important/);
    expect(getComputedStyle(list).display).toBe("none");
  });

  it("an overflowed trigger is display:none in the strip", async () => {
    installStyles();
    render(<Tabs as="tabs" aria-label="Report" defaultValue="t0" items={many} overflow="menu" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 400, scrollWidth: 800, tabWidth: 100 });
    await settle();

    const overflowed = list.querySelector<HTMLElement>("[data-zb-overflowed]");
    expect(overflowed).not.toBeNull();
    expect(css).toMatch(/\.zb-tabs__tab\[hidden\][^{]*\{\s*display:\s*none\s*!important/);
    expect(getComputedStyle(overflowed as HTMLElement).display).toBe("none");
  });
});

describe('overflow="menu": one place per tab', () => {
  async function renderMenu(defaultValue = "t0") {
    render(
      <Tabs
        as="tabs"
        aria-label="Report"
        defaultValue={defaultValue}
        items={many}
        overflow="menu"
      />,
    );
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 400, scrollWidth: 800, tabWidth: 100 });
    await settle();
    return list;
  }

  it("hides overflowed tabs from the strip, so none appears twice", async () => {
    const list = await renderMenu();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /More/ }));
    const inMenu = within(screen.getByRole("menu"))
      .getAllByRole("menuitem")
      .map((item) => item.textContent);
    const inStrip = within(list)
      .getAllByRole("tab")
      .map((tab) => tab.textContent);

    expect(inMenu.length).toBeGreaterThan(0);
    for (const label of inMenu) expect(inStrip).not.toContain(label);
    expect(inStrip.length + inMenu.length).toBe(many.length);

    for (const tab of Array.from(list.querySelectorAll<HTMLElement>("[data-zb-overflowed]"))) {
      expect(tab).toHaveAttribute("hidden");
      expect(tab).toHaveAttribute("tabindex", "-1");
    }
  });

  it("keeps the arrow keys on the tabs that are still in the strip", async () => {
    const list = await renderMenu();
    const visible = within(list).getAllByRole("tab");
    const user = userEvent.setup();
    (visible[0] as HTMLElement).focus();
    await user.keyboard("{End}");
    expect(visible[visible.length - 1]).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    // Wraps to the first visible tab rather than a hidden one.
    expect(visible[0]).toHaveFocus();
  });

  it("brings a tab back into the strip once it is selected from the menu", async () => {
    const list = await renderMenu();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /More/ }));
    const last = within(screen.getByRole("menu")).getAllByRole("menuitem").at(-1) as HTMLElement;
    const label = last.textContent as string;
    await user.click(last);
    await settle();
    expect(within(list).getByRole("tab", { name: label })).toHaveAttribute("aria-selected", "true");
  });
});

describe("overflow menu keyboard", () => {
  async function openMenu() {
    render(<Tabs as="tabs" aria-label="Report" defaultValue="t0" items={many} overflow="menu" />);
    const list = screen.getByRole("tablist");
    restore = stubGeometry(list, { clientWidth: 400, scrollWidth: 800, tabWidth: 100 });
    await settle();
    const user = userEvent.setup();
    const more = screen.getByRole("button", { name: /More/ });
    await user.click(more);
    const menu = screen.getByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    return { user, more, menu, items };
  }

  it("moves focus with the arrow keys, Home and End", async () => {
    const { user, items } = await openMenu();
    expect(items.length).toBeGreaterThan(2);
    const first = items[0] as HTMLElement;
    const second = items[1] as HTMLElement;
    const last = items.at(-1) as HTMLElement;
    await waitFor(() => expect(first).toHaveFocus());

    await user.keyboard("{ArrowDown}");
    expect(second).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(first).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(last).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(first).toHaveFocus();
    await user.keyboard("{End}");
    expect(last).toHaveFocus();
    await user.keyboard("{Home}");
    expect(first).toHaveFocus();
  });

  it("keeps menu items out of the tab order", async () => {
    const { items } = await openMenu();
    for (const item of items) expect(item).toHaveAttribute("tabindex", "-1");
  });

  it("closes when Tab leaves it", async () => {
    const { user, items } = await openMenu();
    await waitFor(() => expect(items[0]).toHaveFocus());
    await user.tab();
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: /More/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape from inside the menu and returns focus to the button", async () => {
    const { user, more, items } = await openMenu();
    await waitFor(() => expect(items[0]).toHaveFocus());
    await user.keyboard("{ArrowDown}{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(more).toHaveFocus();
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
