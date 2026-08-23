"use client";

import { cn } from "@/lib/utils";

/**
 * Eleven steps, each one operable.
 *
 * Every step is a real button with an accessible name of "step 600, #1D63C9" —
 * so the ramp can be read and driven without sight, which a row of coloured
 * `<div>`s cannot. The generated ramp is the main thing a customer looks at on
 * the brand screen, and making it inert would make the screen a picture.
 *
 * The anchor step is outlined rather than merely darker: it is the colour they
 * actually chose, and "which one is mine" is the first question they ask.
 */
export function Ramp({
  steps,
  anchor = "600",
  selected,
  onSelect,
  label = "Brand ramp",
}: {
  /** Ordered light to dark, keyed by step. */
  steps: Readonly<Record<string, string>>;
  anchor?: string;
  selected?: string;
  onSelect?: (step: string) => void;
  label?: string;
}) {
  const order = Object.keys(steps).sort((a, b) => Number(a) - Number(b));

  return (
    /*
     * Scrolls rather than squeezes.
     *
     * Eleven steps sharing the width meant 19px each at 320px — under WCAG
     * 2.5.8's 24px floor, and the Spacing exception cannot rescue it because
     * adjacent swatches touch, so their 24px circles always intersect. Each
     * step now claims 24px and the strip scrolls when the container cannot
     * hold 264px of them. A colour ramp is a natural scroll strip; a row of
     * untappable slivers is not.
     */
    <div
      className="flex overflow-x-auto overflow-y-hidden rounded-lg border border-rule-strong"
      role="group"
      aria-label={label}
    >
      {order.map((step) => {
        const value = steps[step] as string;
        const isAnchor = step === anchor;

        return (
          <button
            key={step}
            type="button"
            onClick={onSelect ? () => onSelect(step) : undefined}
            aria-pressed={selected ? step === selected : undefined}
            // The name carries both facts, because the swatch carries neither.
            aria-label={`Step ${step}, ${value.toUpperCase()}${isAnchor ? ", your chosen colour" : ""}`}
            className={cn(
              "relative h-11 min-w-6 flex-1 transition-[flex-grow] duration-300",
              onSelect && "cursor-pointer hover:flex-[1.4]",
              !onSelect && "cursor-default",
              step === selected && "flex-[1.4]",
            )}
            style={{ background: value }}
          >
            {isAnchor && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0.5 rounded-sm ring-2 ring-ink"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
