"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";

/**
 * A submit button that knows the form is in flight.
 *
 * `useFormStatus` rather than a `pending` prop threaded down from the form.
 * The prop version was a render callback — `footer={(pending) => …}` — and it
 * could not be used from a server component at all: a function cannot cross the
 * server/client boundary, so every page with a form would have had to become a
 * client component to get a loading label. The build caught it, which is the
 * gate working, and this is the shape that does not have the problem.
 *
 * Must be rendered *inside* the `<form>`. `useFormStatus` reads the nearest
 * enclosing form's state and returns a permanently idle status outside one.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  reason,
  className,
  id,
}: {
  children: React.ReactNode;
  /** Shown while the action runs. Falls back to the idle label. */
  pendingLabel?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Present means blocked, with the reason rendered beneath. */
  reason?: string;
  className?: string;
  id?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      id={id}
      variant={variant}
      size={size}
      reason={reason}
      className={className}
      // Not `disabled`: that would drop the button out of the accessibility
      // tree mid-submit and move focus to the document body, which is
      // disorienting exactly when the reader is waiting for an answer.
      aria-busy={pending || undefined}
    >
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}
