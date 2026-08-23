"use client";

import { useId, useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColorPicker } from "./ColorPicker";

/**
 * A colour, entered two ways.
 *
 * **The hex input is the real control.** A native colour picker cannot be
 * operated from a keyboard in any useful way, cannot be read by a screen
 * reader, and cannot be pasted into from a brand guideline — so it is the
 * convenience and the text field is the control. Wiring it the other way round
 * is the single most common accessibility failure in a theme editor.
 *
 * The swatch is `aria-hidden`: the value is already in the input beside it, and
 * announcing the colour twice is noise.
 */
export function ColorField({
  value,
  onChange,
  label,
  name,
  required,
  disabled,
  lockedReason,
  id: providedId,
  describedBy,
  invalid,
  trailing,
  ramp,
  against,
}: {
  value: string;
  onChange?: (next: string) => void;
  /**
   * The accessible name for the hex field.
   *
   * Needed wherever this is not wrapped in a `Field` — the token editor renders
   * eighty of these in a list, and without it a screen reader announces eighty
   * unlabelled text boxes. The visible token name beside the control is not a
   * label unless something says so.
   */
  label?: string;
  /**
   * Set when this field is part of a form submission. Only the text input
   * carries it — the picker is a second control over the same value, and giving
   * both a name would submit the colour twice.
   */
  name?: string;
  required?: boolean;
  disabled?: boolean;
  /**
   * Why this colour cannot be changed. Renders the field read-only with the
   * reason reachable, rather than removing it — a missing field raises more
   * questions than a locked one.
   */
  lockedReason?: string;
  id?: string;
  describedBy?: string;
  invalid?: boolean;
  /** A contrast badge, a revert control — anything that annotates the value. */
  trailing?: React.ReactNode;
  /** The brand ramp, offered inside the picker as approved starting points. */
  ramp?: Record<string, string>;
  /** What this colour is drawn against, so the picker can show the ratio. */
  against?: { value: string; label: string; floor: number };
}) {
  const fallbackId = useId();
  const id = providedId ?? fallbackId;
  const pickerId = `${id}-picker`;
  const lockId = lockedReason ? `${id}-lock` : undefined;
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);

  /*
   * Follow the value when it changes from outside.
   *
   * The field keeps its own draft so a half-typed `#1d6` is not thrown away or
   * pushed upstream — but that draft has to yield when the value moves without
   * the reader touching this input. Two controls do exactly that: "apply
   * nearest passing" and "revert". Without this the contrast readings updated
   * and the swatch and the hex kept showing the old colour, which reads as the
   * suggestion having silently failed.
   *
   * Adjusted during render rather than in an effect: React re-runs the
   * component immediately with the corrected state and never commits the stale
   * paint, where an effect would show the wrong value for one frame.
   */
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const locked = Boolean(lockedReason) || disabled;
  // A partial value like "#1d6" is a legal thing to be typing, so the picker
  // only follows once the text is a colour.
  const complete = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(draft);

  const commit = (next: string) => {
    setDraft(next);
    if (onChange && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(next)) onChange(next);
  };

  return (
    <div className="min-w-0">
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg border px-2.5 py-2",
          locked ? "border-rule bg-paper-sunk" : "border-rule-strong bg-paper",
          invalid && "border-fail bg-fail-wash",
        )}
      >
        {/*
          The swatch is the picker now.
          
          It used to be a decorative square beside a native `<input
          type="color">`, which meant two controls for one value and a visual
          path that no keyboard could take — the OS dialog that input opens is
          outside the page and outside the tab order. One button that opens a
          picker we own is fewer controls and more reach.
        */}
        {locked ? (
          <span
            aria-hidden="true"
            className="size-5 shrink-0 rounded border border-rule-strong"
            style={{ background: complete ? draft : "transparent" }}
          />
        ) : (
          <div className="relative shrink-0">
            <button
              id={pickerId}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-label={label ? `Pick ${label} visually` : "Pick colour visually"}
              onClick={() => setOpen((wasOpen) => !wasOpen)}
              /*
               * 20px of swatch, 24px of target.
               *
               * WCAG 2.5.8 wants 24×24 and this is icon-only, so none of the
               * exceptions apply: it is not inline text, and there is no other
               * control that opens the picker.
               *
               * The button carries the 24px box and an inner span paints the
               * 20px square, rather than the button being 20px with a
               * pseudo-element spilling over. That was tried first and is
               * unreliable — an `::after` with no stacking context is painted
               * under the adjacent field, so the bottom-right of the enlarged
               * area hit the sibling `div` instead of the button. A real box
               * cannot be overlapped by accident, and it is measurable, which
               * matters because the audit asserts this.
               */
              className="grid size-6 shrink-0 place-items-center rounded transition-transform duration-150 hover:scale-110"
            >
              <span
                aria-hidden="true"
                className="size-5 rounded border border-rule-strong"
                style={{ background: complete ? draft : "transparent" }}
              />
            </button>

            {open && (
              <>
                {/*
                  A click anywhere else closes it. Rendered before the panel so
                  the panel sits above it, and `aria-hidden` because it is a
                  dismissal surface rather than anything to announce.
                */}
                <span
                  aria-hidden="true"
                  className="fixed inset-0 z-40"
                  onClick={() => setOpen(false)}
                />
                <div
                  role="dialog"
                  aria-label={label ? `Pick ${label}` : "Pick a colour"}
                  className="absolute left-0 top-7 z-50"
                >
                  <ColorPicker
                    value={complete ? draft : "#000000"}
                    onChange={commit}
                    ramp={ramp}
                    against={against}
                    onClose={() => setOpen(false)}
                  />
                </div>
              </>
            )}
          </div>
        )}

        <input
          id={id}
          name={name}
          aria-label={label}
          required={required}
          /*
           * Three or six hex digits. Eight carry transparency, and contrast
           * against an unknown backdrop cannot be verified — so the gate would
           * refuse it anyway, and refusing it in the browser costs the customer
           * a round trip less.
           */
          pattern="#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})"
          value={draft}
          onChange={(event) => commit(event.target.value)}
          readOnly={locked}
          aria-describedby={[describedBy, lockId].filter(Boolean).join(" ") || undefined}
          aria-invalid={invalid || undefined}
          spellCheck={false}
          autoComplete="off"
          className={cn(
            /*
             * `min-h-6` is the WCAG 2.5.8 floor, not styling.
             *
             * The field is 13px mono with no vertical padding of its own, so
             * its box came out at 21px — under the 24px minimum, and unlike the
             * links around it a text input has no Inline exception. It sits
             * inside a bordered row that is already taller than this, so
             * raising the input's own box changes nothing visually and makes
             * the target honest.
             */
            "tabular min-h-6 min-w-0 flex-1 bg-transparent font-mono text-[0.8125rem] uppercase",
            "focus:outline-none",
            locked && "text-graphite",
          )}
        />

        {lockedReason && (
          <Lock aria-hidden="true" strokeWidth={2} className="size-3 shrink-0 text-graphite-soft" />
        )}
        {trailing && <span className="shrink-0">{trailing}</span>}
      </div>

      {lockedReason && (
        <p id={lockId} className="mt-1.5 text-[0.75rem] leading-relaxed text-graphite">
          {lockedReason}
        </p>
      )}
    </div>
  );
}
