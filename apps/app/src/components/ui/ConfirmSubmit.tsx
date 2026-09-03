"use client";

/**
 * A submit button that states its consequence before it accepts one.
 *
 * The console's three outward actions — publishing a theme, archiving one, and
 * disabling a member — all fired on a single click with nothing between the
 * pointer and the effect. Publishing is the highest-consequence action in this
 * product: it reaches every application pinned to the theme, and the page lede
 * says so in the abstract while the button said nothing at the moment it
 * mattered. `CONTENT.md` §4 asks for the opposite of that — state what will
 * happen, to whom, and what cannot be undone — and the library already ships
 * the pattern in `ActionGate`.
 *
 * This is that pattern narrowed to what the console needs. One deliberate
 * click after reading the sentence, which §4 calls the right friction for
 * something reversible or supersedable. It is deliberately *not* a typed
 * confirmation phrase: nothing here destroys data, and friction that exceeds
 * the consequence is how people learn to click through the sentence without
 * reading it.
 *
 * Rendered inside the `<form>` and outside the disabled fieldset, like
 * `SubmitButton`, so the real submit can read `useFormStatus`.
 */

import { useEffect, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "./Button";
import { SubmitButton } from "./SubmitButton";
import type { ButtonSize, ButtonVariant } from "./Button";

export function ConfirmSubmit({
  children,
  consequence,
  confirmLabel,
  pendingLabel,
  variant = "primary",
  size = "md",
  reason,
  id,
}: {
  /** The action's name. The same word appears armed and unarmed. */
  children: React.ReactNode;
  /**
   * What actually happens, in plain language: to whom, and what cannot be
   * undone. Required, because a confirmation without one is "Are you sure?".
   */
  consequence: string;
  /** The armed label. Defaults to the action's own name. */
  confirmLabel?: React.ReactNode;
  pendingLabel?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Present means blocked, with the reason rendered beneath. */
  reason?: string;
  id?: string;
}) {
  const [armed, setArmed] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  /*
   * Focus moves to the confirm control when the sentence appears.
   *
   * Without it a keyboard reader presses Enter, the button they were on is
   * replaced by two new ones, and focus falls to the document body — so the
   * consequence they are being asked to read is somewhere behind them.
   */
  useEffect(() => {
    if (armed) confirmRef.current?.focus();
  }, [armed]);

  if (!armed) {
    return (
      <Button
        type="button"
        id={id}
        variant={variant}
        size={size}
        reason={reason}
        onClick={() => setArmed(true)}
      >
        {children}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {/*
        `role="alert"`, so the sentence is announced rather than merely
        rendered. It appeared in response to the reader's own action and it is
        the whole reason the second click exists.
      */}
      <p
        role="alert"
        className="flex max-w-[42ch] items-start gap-1.5 text-[0.75rem] leading-relaxed text-graphite"
      >
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-warn" />
        {consequence}
      </p>
      <div className="flex items-center gap-2">
        <SubmitButton
          id={id}
          ref={confirmRef}
          variant={variant}
          size={size}
          pendingLabel={pendingLabel}
        >
          {confirmLabel ?? children}
        </SubmitButton>
        <Button type="button" variant="ghost" size={size} onClick={() => setArmed(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
