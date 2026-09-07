import { cn } from "@/lib/utils";

/**
 * The shared appearance of every form control.
 *
 * Extracted because it was being copied. `Input` had it; the five raw
 * `<select>` elements across the members and compare screens each had a
 * hand-typed subset, and the import textarea had a third variant — so the same
 * field looked like three different fields depending on which screen you were
 * on, and only one of them had a focus ring.
 *
 * One function, three components. A change to the focus treatment now happens
 * once instead of eight times, and the seven places that were already wrong
 * cannot drift back.
 */
export function controlClasses({
  invalid,
  mono,
  size = "md",
  className,
}: {
  invalid?: boolean;
  /** For values compared down a column — hex, versions, digests. */
  mono?: boolean;
  /** `sm` is for controls sitting inside a table row. */
  size?: "sm" | "md";
  className?: string;
} = {}): string {
  return cn(
    "w-full rounded-lg border bg-paper",
    "border-rule-strong placeholder:text-graphite-soft",
    "transition-[border-color,box-shadow] duration-200",
    // One focus treatment, not three. The global `:focus-visible` outline is
    // the floor for everything that does not style its own focus; a control
    // opts out of it and draws a single soft ring instead.
    //
    // The border goes to `zoblocks-deep` rather than `zoblocks` because the border
    // is the part carrying the meaning: `zoblocks` measures about 2.1:1 against
    // paper, under the 3:1 SC 1.4.11 asks of a focus indicator, so the lighter
    // accent would have been decoration around an indicator that was not one.
    "focus:border-brand-deep focus:outline-none focus:ring-[3px] focus:ring-brand/20",
    // Disabled reads as unavailable rather than as low-contrast text: opacity
    // would multiply both sides of a contrast pair by a number nobody checked.
    "disabled:cursor-not-allowed disabled:border-rule disabled:bg-paper-sunk disabled:text-graphite",
    size === "md" ? "px-3 py-2 text-[0.875rem]" : "px-2.5 py-1.5 text-[0.8125rem]",
    invalid && "border-fail bg-fail-wash",
    mono && "font-mono tabular",
    className,
  );
}
