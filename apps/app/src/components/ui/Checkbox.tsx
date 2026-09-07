import { cn } from "@/lib/utils";

/**
 * A checkbox that belongs to this product.
 *
 * The one it replaces was a bare `<input type="checkbox">` with an
 * `accent-color`. That tints the browser's own control but leaves everything
 * else the browser's: on macOS Chrome it draws heavier and larger than the
 * 16px it is given, with its own corner radius and its own tick, so the only
 * hand-drawn control on the screen sat next to a card built entirely out of
 * this kit's parts. It looked borrowed, because it was.
 *
 * `appearance-none` takes the drawing back. The box is then an ordinary styled
 * element and the tick is an SVG revealed by `peer-checked`, which means the
 * whole thing is still one real `<input>` — same keyboard behaviour, same form
 * participation, same announcement. Nothing here is a `<div>` pretending.
 *
 * The fill is `zoblocks-deep` rather than `zoblocks`: the tick is white, and white
 * on the lighter accent measures about 2.2:1 — below the 3:1 that SC 1.4.11
 * asks of a control's own parts. A checkbox whose tick is hard to see is a
 * checkbox that has to be clicked twice to be believed.
 *
 * Round rather than square, which is a deliberate departure worth naming: a
 * circle usually signals a radio, and radios are one-of-many. This is
 * many-of-many, and the shape says otherwise. It stays round because the
 * element it marks is a card that is *on* or *off* rather than an item in a
 * list of alternatives, and at that size a filled disc with a tick reads as a
 * state at a glance where a small square reads as a form field. The semantics
 * are unaffected — it is a real `<input type="checkbox">`, so it is still
 * announced as a checkbox and still toggles independently.
 */
export function Checkbox({
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <input
        {...props}
        type="checkbox"
        className={cn(
          /*
           * 18px of circle, 24px of target.
           *
           * WCAG 2.5.8 measures the control, and an 18px box fails it. An
           * `<input>` cannot carry a pseudo-element to borrow the extra space,
           * and growing the circle would coarsen every row it sits in — so the
           * box is 24px and `bg-clip-content` with 3px of padding keeps the
           * painted circle at 18px. The border is drawn by the sibling ring
           * below for the same reason: a border on a 24px box would be a 24px
           * circle.
           */
          "peer size-6 appearance-none rounded-full bg-paper bg-clip-content p-[3px]",
          "transition-[background-color] duration-150",
          "checked:bg-accent-solid",
          "disabled:cursor-not-allowed disabled:bg-paper-sunk",
          "disabled:checked:bg-graphite-soft",
        )}
      />
      {/*
        The ring, drawn as a sibling rather than as the input's own border.

        With the input grown to a 24px target, a border on it would be a 24px
        circle around an 18px fill. This sits exactly on the content box, so
        the control still looks 18px while remaining tappable at 24px.
      */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-[3px] top-[3px] size-[1.125rem] rounded-full",
          "border border-rule-strong transition-colors duration-150",
          "peer-checked:border-accent-solid peer-disabled:border-rule",
        )}
      />
      {/*
        Decorative: the input beside it already carries the state. Drawn rather
        than a glyph so it scales with the box and keeps its stroke weight.
      */}
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="pointer-events-none absolute left-[3px] top-[3px] size-[1.125rem] text-accent-on opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
      >
        <path
          d="M4.2 8.3 6.9 11 11.8 5.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
