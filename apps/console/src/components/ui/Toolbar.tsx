"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * One axis of the playground.
 *
 * A labelled radio group, not a row of buttons. Theme, density and bridge are
 * each a single choice from a set, which is what a radio group *is* — and
 * rendering them as unlabelled toggles gives a screen-reader user six buttons
 * with no indication that picking one unpicks another.
 *
 * The legend is visible: "Theme" beside its three options is the difference
 * between a control and a mystery, and the playground has four of these rows.
 */
export function AxisGroup<Value extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: readonly { value: Value; label: string; disabled?: boolean; reason?: string }[];
  value: Value;
  onChange: (next: Value) => void;
  className?: string;
}) {
  const id = React.useId();
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Arrow keys move the selection; Tab enters the group once and leaves it.
   *
   * Required rather than polish: these are `role="radio"`, and a radio group
   * that is a row of independent tab stops is one a keyboard user has to step
   * through option by option — five axes on the playground would be fifteen
   * stops before reaching the content. The roving tabindex below is what makes
   * the role honest.
   */
  const move = (from: number, delta: number) => {
    const usable = options
      .map((option, index) => ({ option, index }))
      .filter(({ option }) => !option.disabled);
    if (usable.length === 0) return;

    const at = usable.findIndex(({ index }) => index === from);
    const next = usable[(at + delta + usable.length) % usable.length]!;
    onChange(next.option.value);
    refs.current[next.index]?.focus();
  };

  return (
    /*
       The label sits above its options, not inline beside them.

       Inline, the controls started wherever the label happened to end — after
       THEME on one screen and after COLOUR VISION on another — so two screens
       using this component did not line up, and four axes in a row wrapped
       mid-axis with VISION orphaned on a line of its own. Stacking makes each
       axis a block that wraps whole, and every axis begins at the same edge
       whatever its label is called.
     */
    <div className={cn("min-w-0", className)}>
      <p id={id} className="eyebrow mb-1.5 text-[0.5625rem] text-graphite-soft">
        {label}
      </p>

      {/*
        One track with segments inside it, rather than a row of separate
        buttons.

        Three things were wrong with the row. Only the *unselected* options
        carried a border, so every selection changed every option's width and the
        row jittered as you clicked along it. The selected option inverted to
        solid near-black, which made a preference control the loudest thing on
        a screen whose entire job is showing the customer's colours. And the
        options had `role="radio"` with no `radiogroup` around them, which is
        not a grouping at all to a screen reader — it announces three unrelated
        radios with no name.

        A sunken track with one raised segment fixes all three: every segment is
        the same size in every state, the selection is legible without shouting,
        and the track is the group the role needs.
      */}
      <div
        role="radiogroup"
        aria-labelledby={id}
        className={cn(
          "inline-flex flex-wrap items-center gap-1 rounded-[0.625rem] p-1",
          // `paper-sunk` is a hair off the page on the lighter screens, which
          // left the track invisible and the segments floating. The stronger
          // rule is what makes it read as one control rather than three words.
          "border border-rule-strong bg-paper-sunk",
        )}
      >
        {options.map((option, index) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              aria-disabled={option.disabled || undefined}
              // Only the selected option is a tab stop, so the group is one.
              tabIndex={active ? 0 : -1}
              title={option.reason}
              onClick={option.disabled ? undefined : () => onChange(option.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  move(index, 1);
                } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault();
                  move(index, -1);
                }
              }}
              className={cn(
                // A 24px minimum on the short side, which SC 2.5.8 asks for and
                // the previous row missed at `py-1`.
                "min-h-[1.75rem] rounded-md px-3 py-1 text-[0.75rem] font-medium",
                "transition-[background-color,color,box-shadow] duration-200",
                active &&
                  "bg-paper text-ink shadow-[0_1px_2px_rgb(16_24_32/0.12)] ring-1 ring-rule",
                !active && !option.disabled && "text-graphite hover:text-ink",
                option.disabled && "cursor-not-allowed text-graphite-soft",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The bar the axis groups sit in. */
export function Toolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    /*
      A group of groups, and deliberately not a `radiogroup` itself.
      
      It used to carry that role while containing three or four `AxisGroup`s,
      each of which is its own set of radios. To a screen reader that is one
      radio group holding twelve unrelated radios — theme, density and vision
      all announced as alternatives to each other. The role belongs on each
      axis; this is just the bar they sit in.
    */
    <div
      role="group"
      className={cn(
        // `items-start` and a wider gap: the axes are blocks now, and a row of
        // blocks centred on each other leaves their labels at different heights.
        "flex flex-wrap items-start gap-x-7 gap-y-4 rounded-xl border border-rule bg-paper-sunk px-4 py-3.5",
        className,
      )}
    >
      {children}
    </div>
  );
}
