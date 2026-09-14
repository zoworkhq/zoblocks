/**
 * The tab strip is one tab stop, so arrows are the only way to the other tabs.
 *
 * The ZoBlocks host shipped with roving tabindex and no key handler: a
 * keyboard user could reach the selected tab and nothing else. Activation is
 * manual — arrows move focus, Enter or Space selects — because that is what
 * antd's rc-tabs and MUI's default (`selectionFollowsFocus` off) both do, and
 * switching framework must not change how the strip is driven.
 */

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MuiHost } from "./mui";
import { ZoBlocksHost } from "./zoblocks";
import { useHost } from "./context";
import type { HostProviderProps } from "./contract";

afterEach(cleanup);

/**
 * MUI is here as the reference the ZoBlocks strip must behave like. antd is
 * not: in jsdom the first Tab never lands on an antd tab, so its keys cannot
 * be observed. Its rc-tabs source moves only a focus key on arrows.
 */
const HOSTS: Array<[string, React.ComponentType<HostProviderProps>]> = [
  ["zoblocks", ZoBlocksHost],
  ["mui", MuiHost],
];

function Strip({ onChange }: { onChange?: (key: string) => void }) {
  const { Tabs } = useHost();
  return (
    <Tabs
      aria-label="Sections"
      onChange={onChange}
      items={[
        { key: "results", label: "Results", children: <p>Results panel</p> },
        { key: "trend", label: "Trend", children: <p>Trend panel</p> },
        { key: "audit", label: "Audit", disabled: true },
        { key: "notes", label: "Notes", children: <p>Notes panel</p> },
      ]}
    />
  );
}

const tab = (name: string) => screen.getByRole("tab", { name });

describe.each(HOSTS)("the %s host's tabs, by keyboard", (_id, Host) => {
  async function focusStrip(onChange?: (key: string) => void) {
    const user = userEvent.setup();
    render(
      <Host mode="light">
        <Strip onChange={onChange} />
      </Host>,
    );
    await user.tab();
    expect(document.activeElement).toBe(tab("Results"));
    return user;
  }

  it("moves focus with the arrows, skipping disabled tabs and wrapping", async () => {
    const user = await focusStrip();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tab("Trend"));
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tab("Notes"));
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tab("Results"));
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(tab("Notes"));
  });

  it("jumps to the ends with Home and End", async () => {
    const user = await focusStrip();
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(tab("Notes"));
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(tab("Results"));
  });

  it("selects on Enter, not on focus", async () => {
    const onChange = vi.fn();
    const user = await focusStrip(onChange);
    await user.keyboard("{ArrowRight}");
    expect(onChange).not.toHaveBeenCalled();
    expect(tab("Results").getAttribute("aria-selected")).toBe("true");

    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("trend");
    expect(tab("Trend").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Trend panel")).toBeTruthy();
  });
});
