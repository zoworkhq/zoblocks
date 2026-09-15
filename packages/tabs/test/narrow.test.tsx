/**
 * A vertical strip with no room beside it stacks above its panel.
 *
 * The drawing is the stylesheet's; what is tested here is the measurement that
 * drives it, and that stacking never touches the keyboard model.
 */

import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Tabs } from "../src/index.js";
import { triggerResize } from "./geometry.js";

const items = [
  { value: "profile", label: "Profile", children: "Name, photo, pronouns." },
  { value: "notifications", label: "Notifications", count: 4, children: "Channels." },
];

function root(container: HTMLElement) {
  return container.querySelector(".zb-tabs") as HTMLElement;
}

function setWidth(element: HTMLElement, width: number) {
  element.getBoundingClientRect = () => ({ width }) as DOMRect;
}

afterEach(() => {
  document.documentElement.style.fontSize = "";
});

describe("a rail in a narrow box", () => {
  it("is marked narrow below 28rem, and loses the mark when the box widens", () => {
    const { container } = render(
      <Tabs
        as="tabs"
        variant="rail"
        orientation="vertical"
        aria-label="Settings"
        defaultValue="profile"
        items={items}
      />,
    );
    const node = root(container);

    setWidth(node, 290);
    act(() => triggerResize());
    expect(node).toHaveAttribute("data-zb-narrow");
    // Only the drawing stacks: the arrow keys still go up and down.
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");

    setWidth(node, 900);
    act(() => triggerResize());
    expect(node).not.toHaveAttribute("data-zb-narrow");
  });

  it("says nothing about a box that has not been laid out", () => {
    const { container } = render(
      <Tabs
        as="tabs"
        variant="rail"
        orientation="vertical"
        aria-label="Settings"
        defaultValue="profile"
        items={items}
      />,
    );
    const node = root(container);
    setWidth(node, 0);
    act(() => triggerResize());
    expect(node).not.toHaveAttribute("data-zb-narrow");
  });

  it("measures in the page's rem, so a larger root font stacks sooner", () => {
    document.documentElement.style.fontSize = "20px";
    const { container } = render(
      <Tabs
        as="tabs"
        variant="rail"
        orientation="vertical"
        aria-label="Settings"
        defaultValue="profile"
        items={items}
      />,
    );
    const node = root(container);
    // 500px is wider than 28 × 16 but narrower than 28 × 20.
    setWidth(node, 500);
    act(() => triggerResize());
    expect(node).toHaveAttribute("data-zb-narrow");
  });

  it("marks a stepper too, so its steps can give up padding before their names", () => {
    const { container } = render(
      <Tabs
        as="steps"
        variant="stepper"
        aria-label="Patient intake"
        defaultValue="profile"
        items={items}
      />,
    );
    const node = root(container);
    setWidth(node, 290);
    act(() => triggerResize());
    expect(node).toHaveAttribute("data-zb-narrow");
  });

  it("never marks a horizontal strip that is not a stepper", () => {
    const { container } = render(
      <Tabs as="tabs" aria-label="Sections" defaultValue="profile" items={items} />,
    );
    const node = root(container);
    setWidth(node, 200);
    act(() => triggerResize());
    expect(node).not.toHaveAttribute("data-zb-narrow");
  });

  it("still hands the root to a caller's ref, object or callback", () => {
    const objectRef = React.createRef<HTMLDivElement>();
    const { container, unmount } = render(
      <Tabs as="tabs" aria-label="Sections" defaultValue="profile" items={items} ref={objectRef} />,
    );
    expect(objectRef.current).toBe(root(container));
    unmount();

    let received: HTMLDivElement | null = null;
    const view = render(
      <Tabs
        as="tabs"
        aria-label="Sections"
        defaultValue="profile"
        items={items}
        ref={(node) => {
          received = node;
        }}
      />,
    );
    expect(received).toBe(root(view.container));
  });

  it("stays unmarked where there is no ResizeObserver", () => {
    const original = globalThis.ResizeObserver;
    // @ts-expect-error — removing the global is the case under test.
    delete globalThis.ResizeObserver;
    try {
      const { container } = render(
        <Tabs
          as="tabs"
          variant="rail"
          orientation="vertical"
          aria-label="Settings"
          defaultValue="profile"
          items={items}
        />,
      );
      expect(root(container)).not.toHaveAttribute("data-zb-narrow");
    } finally {
      globalThis.ResizeObserver = original;
    }
  });
});
