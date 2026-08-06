import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./status-badge";
import { itMeetsTheContract } from "../../../test/contract";

const TONES = ["critical", "high", "low", "normal", "unknown", "neutral"] as const;

describe("StatusBadge", () => {
  itMeetsTheContract("critical", () => <StatusBadge tone="critical">Critical</StatusBadge>);

  /**
   * Rule 1: there is no icon-only variant, because an icon alone is not a
   * label — it is a rebus. The label must always survive to the text layer.
   */
  it.each(TONES)("renders its label as text for the %s tone", (tone) => {
    const view = render(<StatusBadge tone={tone}>Potassium high</StatusBadge>);
    expect(view.container.textContent).toContain("Potassium high");
  });

  it("keeps the label when an icon is supplied", () => {
    const Icon = ({ className }: { className?: string }) => (
      <svg className={className} data-testid="icon" />
    );
    const view = render(
      <StatusBadge tone="critical" icon={Icon}>
        Critical
      </StatusBadge>,
    );
    expect(view.container.textContent).toContain("Critical");
  });

  it("hides its decorative icon from assistive technology", () => {
    // Spreads props: the badge passes aria-hidden down, and an icon that drops
    // it would be announced as a second, meaningless label.
    const Icon = (props: React.ComponentProps<"svg">) => <svg {...props} />;
    const view = render(
      <StatusBadge tone="critical" icon={Icon}>
        Critical
      </StatusBadge>,
    );
    expect(view.container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("hides the default tone icon too", () => {
    const view = render(<StatusBadge tone="critical">Critical</StatusBadge>);
    const svg = view.container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  /**
   * Rule 2: tone maps to a semantic token, never a raw color. A hard-coded hex
   * or a Tailwind palette class cannot respond to dark or forced-colors mode.
   */
  it.each(TONES)("maps the %s tone to a token rather than a raw colour", (tone) => {
    const view = render(<StatusBadge tone={tone}>Label</StatusBadge>);
    const className = view.container.firstElementChild?.className ?? "";
    expect(className).not.toMatch(/#[0-9a-f]{3,6}/i);
    expect(className).not.toMatch(/\b(text|bg)-(red|green|amber|yellow|blue|gray|grey)-\d{2,3}\b/);
  });

  it("gives each tone a visually distinct class, so severity is not flattened", () => {
    const classes = TONES.map(
      (tone) =>
        render(<StatusBadge tone={tone}>Label</StatusBadge>).container.firstElementChild
          ?.className ?? "",
    );
    expect(new Set(classes).size).toBe(TONES.length);
  });

  it("renders unknown as its own tone rather than falling back to normal", () => {
    const unknown =
      render(<StatusBadge tone="unknown">Label</StatusBadge>).container.firstElementChild
        ?.className ?? "";
    const normal =
      render(<StatusBadge tone="normal">Label</StatusBadge>).container.firstElementChild
        ?.className ?? "";
    expect(unknown).not.toEqual(normal);
  });
});
