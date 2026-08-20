/**
 * The inline provider.
 *
 * Structurally a theme bridge — both write custom properties onto a wrapper —
 * which is why a brand and a bridge compose by cascade with no coordination
 * code between them.
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OxygenTheme } from "../src/react";

describe("<OxygenTheme>", () => {
  it("applies tokens to one element", () => {
    const { container } = render(
      <OxygenTheme tokens={{ "--ox-accent": "#1d63c9" }}>
        <button type="button">Sign</button>
      </OxygenTheme>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue("--ox-accent")).toBe("#1d63c9");
  });

  /**
   * An undefined value would still spread onto the element and blank the
   * property, defeating the fallback chain the stylesheets rely on. The same
   * rule the bridges follow.
   */
  it("drops undefined and empty values rather than blanking the property", () => {
    const { container } = render(
      <OxygenTheme tokens={{ "--ox-accent": undefined, "--ox-text": "", "--ox-bg": "#fff" }}>
        x
      </OxygenTheme>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue("--ox-accent")).toBe("");
    expect(wrapper.style.getPropertyValue("--ox-bg")).toBe("#fff");
  });

  it("ignores keys that are not custom properties", () => {
    const { container } = render(
      <OxygenTheme tokens={{ color: "red", "--ox-bg": "#fff" }}>x</OxygenTheme>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.color).toBe("");
  });

  it("sets the three axis attributes when asked", () => {
    const { container } = render(
      <OxygenTheme tokens={{}} brand="northwind" theme="high-contrast" density="clinical">
        x
      </OxygenTheme>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute("data-ox-brand")).toBe("northwind");
    expect(wrapper.getAttribute("data-ox-theme")).toBe("high-contrast");
    expect(wrapper.getAttribute("data-ox-density")).toBe("clinical");
  });

  it("omits an axis that was not asked for, rather than writing a default", () => {
    const { container } = render(<OxygenTheme tokens={{}}>x</OxygenTheme>);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.hasAttribute("data-ox-brand")).toBe(false);
    expect(wrapper.hasAttribute("data-ox-theme")).toBe(false);
  });

  it("adds nothing to the accessibility tree", () => {
    render(
      <OxygenTheme tokens={{ "--ox-accent": "#1d63c9" }}>
        <button type="button">Sign</button>
      </OxygenTheme>,
    );
    const wrapper = screen.getByRole("button", { name: "Sign" }).parentElement as HTMLElement;
    expect(wrapper.getAttribute("role")).toBeNull();
    expect(wrapper.getAttribute("aria-label")).toBeNull();
  });

  it("renders as a span where a block element would break the layout", () => {
    const { container } = render(
      <OxygenTheme tokens={{}} as="span">
        x
      </OxygenTheme>,
    );
    expect(container.firstElementChild?.tagName).toBe("SPAN");
  });

  /**
   * Two customers on one page. A root-scoped stylesheet cannot do this — the
   * last one loaded would win — which is the case this provider exists for.
   */
  it("scopes independently, so one page can render two customers' branding", () => {
    const { container } = render(
      <div>
        <OxygenTheme tokens={{ "--ox-accent": "#1d63c9" }} brand="northwind">
          <span>a</span>
        </OxygenTheme>
        <OxygenTheme tokens={{ "--ox-accent": "#b91c1c" }} brand="southmere">
          <span>b</span>
        </OxygenTheme>
      </div>,
    );
    const [first, second] = [...container.querySelectorAll("[data-ox-brand]")] as HTMLElement[];
    expect(first!.style.getPropertyValue("--ox-accent")).toBe("#1d63c9");
    expect(second!.style.getPropertyValue("--ox-accent")).toBe("#b91c1c");
  });
});
