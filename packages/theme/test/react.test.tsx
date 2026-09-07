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
import { ZoblocksTheme } from "../src/react";

describe("<ZoblocksTheme>", () => {
  it("applies tokens to one element", () => {
    const { container } = render(
      <ZoblocksTheme tokens={{ "--zb-accent": "#1d63c9" }}>
        <button type="button">Sign</button>
      </ZoblocksTheme>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue("--zb-accent")).toBe("#1d63c9");
  });

  /**
   * An undefined value would still spread onto the element and blank the
   * property, defeating the fallback chain the stylesheets rely on. The same
   * rule the bridges follow.
   */
  it("drops undefined and empty values rather than blanking the property", () => {
    const { container } = render(
      <ZoblocksTheme tokens={{ "--zb-accent": undefined, "--zb-text": "", "--zb-bg": "#fff" }}>
        x
      </ZoblocksTheme>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue("--zb-accent")).toBe("");
    expect(wrapper.style.getPropertyValue("--zb-bg")).toBe("#fff");
  });

  it("ignores keys that are not custom properties", () => {
    const { container } = render(
      <ZoblocksTheme tokens={{ color: "red", "--zb-bg": "#fff" }}>x</ZoblocksTheme>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.color).toBe("");
  });

  it("sets the three axis attributes when asked", () => {
    const { container } = render(
      <ZoblocksTheme tokens={{}} brand="northwind" theme="high-contrast" density="clinical">
        x
      </ZoblocksTheme>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute("data-zb-brand")).toBe("northwind");
    expect(wrapper.getAttribute("data-zb-theme")).toBe("high-contrast");
    expect(wrapper.getAttribute("data-zb-density")).toBe("clinical");
  });

  it("omits an axis that was not asked for, rather than writing a default", () => {
    const { container } = render(<ZoblocksTheme tokens={{}}>x</ZoblocksTheme>);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.hasAttribute("data-zb-brand")).toBe(false);
    expect(wrapper.hasAttribute("data-zb-theme")).toBe(false);
  });

  it("adds nothing to the accessibility tree", () => {
    render(
      <ZoblocksTheme tokens={{ "--zb-accent": "#1d63c9" }}>
        <button type="button">Sign</button>
      </ZoblocksTheme>,
    );
    const wrapper = screen.getByRole("button", { name: "Sign" }).parentElement as HTMLElement;
    expect(wrapper.getAttribute("role")).toBeNull();
    expect(wrapper.getAttribute("aria-label")).toBeNull();
  });

  it("renders as a span where a block element would break the layout", () => {
    const { container } = render(
      <ZoblocksTheme tokens={{}} as="span">
        x
      </ZoblocksTheme>,
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
        <ZoblocksTheme tokens={{ "--zb-accent": "#1d63c9" }} brand="northwind">
          <span>a</span>
        </ZoblocksTheme>
        <ZoblocksTheme tokens={{ "--zb-accent": "#b91c1c" }} brand="southmere">
          <span>b</span>
        </ZoblocksTheme>
      </div>,
    );
    const [first, second] = [...container.querySelectorAll("[data-zb-brand]")] as HTMLElement[];
    expect(first!.style.getPropertyValue("--zb-accent")).toBe("#1d63c9");
    expect(second!.style.getPropertyValue("--zb-accent")).toBe("#b91c1c");
  });
});
