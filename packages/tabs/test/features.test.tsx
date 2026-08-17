/**
 * The three opt-in features: hotkeys, View Transitions, and the observation
 * window. All three are off by default, and each is off for a stated reason.
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Tabs } from "../src/index.js";

const items = Array.from({ length: 12 }, (_, index) => ({
  value: `t${index}`,
  label: `Section ${index}`,
}));

describe("hotkeys", () => {
  it("is off by default, because the browser owns Ctrl+1…9 first", () => {
    const onChange = vi.fn();
    render(
      <Tabs as="tabs" aria-label="Docs" defaultValue="t0" items={items} onChange={onChange} />,
    );
    fireEvent.keyDown(document, { key: "3", ctrlKey: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("jumps to the n-th tab when enabled", () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="t0"
        items={items}
        hotkeys
        onChange={onChange}
      />,
    );
    fireEvent.keyDown(document, { key: "3", ctrlKey: true });
    expect(onChange).toHaveBeenCalledWith("t2", { via: "keyboard" });
  });

  it("accepts Cmd on macOS", () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="t0"
        items={items}
        hotkeys
        onChange={onChange}
      />,
    );
    fireEvent.keyDown(document, { key: "2", metaKey: true });
    expect(onChange).toHaveBeenCalledWith("t1", { via: "keyboard" });
  });

  it("sends 9 to the last tab, not the ninth", () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="t0"
        items={items}
        hotkeys
        onChange={onChange}
      />,
    );
    // The convention every browser and editor already uses, so a host with
    // twelve tabs still has a way to reach the end.
    fireEvent.keyDown(document, { key: "9", ctrlKey: true });
    expect(onChange).toHaveBeenCalledWith("t11", { via: "keyboard" });
  });

  it("ignores a number past the end", () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="a"
        hotkeys
        onChange={onChange}
        items={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Bravo" },
        ]}
      />,
    );
    fireEvent.keyDown(document, { key: "5", ctrlKey: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores the plain number, so typing is unaffected", () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="t0"
        items={items}
        hotkeys
        onChange={onChange}
      />,
    );
    fireEvent.keyDown(document, { key: "3" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("detaches the listener on unmount", () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="t0"
        items={items}
        hotkeys
        onChange={onChange}
      />,
    );
    unmount();
    fireEvent.keyDown(document, { key: "3", ctrlKey: true });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('transition="view"', () => {
  it("routes the commit through startViewTransition when the engine has it", async () => {
    const start = vi.fn((update: () => void) => {
      update();
      return { finished: Promise.resolve() };
    });
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      writable: true,
      value: start,
    });
    try {
      render(
        <Tabs as="tabs" aria-label="Docs" defaultValue="t0" items={items} transition="view" />,
      );
      fireEvent.click(screen.getByRole("tab", { name: "Section 1" }));
      await waitFor(() => expect(start).toHaveBeenCalled());
      expect(screen.getByRole("tab", { name: "Section 1" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    } finally {
      delete (document as Partial<Document>).startViewTransition;
    }
  });

  it("falls through to a plain commit where the API is absent", async () => {
    // Firefox has not shipped it. The standard transition is already correct,
    // so this is decoration on top rather than something to polyfill.
    expect((document as Partial<Document>).startViewTransition).toBeUndefined();
    render(<Tabs as="tabs" aria-label="Docs" defaultValue="t0" items={items} transition="view" />);
    fireEvent.click(screen.getByRole("tab", { name: "Section 1" }));
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Section 1" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
  });

  it("does not reach for it under any other transition setting", () => {
    const start = vi.fn();
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      writable: true,
      value: start,
    });
    try {
      render(<Tabs as="tabs" aria-label="Docs" defaultValue="t0" items={items} />);
      fireEvent.click(screen.getByRole("tab", { name: "Section 1" }));
      expect(start).not.toHaveBeenCalled();
    } finally {
      delete (document as Partial<Document>).startViewTransition;
    }
  });
});

describe("virtualise", () => {
  it("marks the root so the stylesheet can skip off-screen layout", () => {
    render(<Tabs as="tabs" aria-label="Docs" defaultValue="t0" items={items} virtualise />);
    expect(document.querySelector(".ox-tabs")).toHaveAttribute("data-ox-virtualised");
  });

  it("keeps every trigger in the accessibility tree", () => {
    render(<Tabs as="tabs" aria-label="Docs" defaultValue="t0" items={items} virtualise />);
    // The whole point of not windowing the DOM: a screen reader that is told
    // there are 20 tabs when there are 240 has been lied to.
    expect(screen.getAllByRole("tab")).toHaveLength(12);
  });

  it("is off by default", () => {
    render(<Tabs as="tabs" aria-label="Docs" defaultValue="t0" items={items} />);
    expect(document.querySelector(".ox-tabs")).not.toHaveAttribute("data-ox-virtualised");
  });
});
