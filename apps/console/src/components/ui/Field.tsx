"use client";

import { useId } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { controlClasses } from "./control";

/**
 * A labelled control, with its hint and error actually bound to it.
 *
 * The binding is the entire reason this exists. A hint rendered in a
 * `<p>` beside an input is invisible to a screen reader, and an error message
 * that is only red is invisible to anyone who cannot see red — so both go
 * through `aria-describedby`, and an error also sets `aria-invalid`. Getting
 * that wrong once means getting it wrong on every form in the product, which
 * is what happened to the version this replaces.
 *
 * `children` receives the ids to spread, so the control stays whatever it needs
 * to be — an input, a select, a colour picker pair — rather than this component
 * guessing.
 *
 * **A callback is a function, so a `Field` cannot be rendered from a server
 * component.** Put the form in its own `"use client"` component — that is what
 * `LoginForm`, `NewThemeForm` and `ImportForm` are for. `next build` catches
 * the mistake ("Functions cannot be passed directly to Client Components"),
 * but it catches it at the end of a build rather than in the editor, so it is
 * worth knowing before you write the page.
 */
export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: React.ReactNode;
  /** Why this field exists, or what a good value looks like. */
  hint?: React.ReactNode;
  /**
   * What went wrong and how to fix it. Never "invalid" — a customer cannot act
   * on that, and the measured number is the part that tells them how far off
   * they are.
   */
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: (props: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": boolean | undefined;
    required: boolean | undefined;
  }) => React.ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1.5 block text-[0.8125rem] font-medium">
        {label}
        {/*
          The exception is marked, not the rule.

          Every field was marked `*` before this, including on a two-field sign-
          in form — and when everything is required, marking anything is
          decoration. `optional` is the word because it is the one a reader
          actually needs: it tells them they may skip the field.

          The explicit `{" "}` is load-bearing. This word joins the label to form
          the control's accessible name, and JSX discards whitespace that spans a
          newline — so without it the name was the single run-on token
          "Homepageoptional", which is what a screen reader would say. The
          margin only separates them for people who can see it.
        */}
        {!required && (
          <>
            {" "}
            <span className="ml-1 text-[0.6875rem] font-normal text-graphite-soft">optional</span>
          </>
        )}
      </label>

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        required: required || undefined,
      })}

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-[0.75rem] leading-relaxed text-graphite">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 flex gap-1.5 text-[0.75rem] leading-relaxed text-fail">
          {/* The icon is decorative; the word carries the meaning. */}
          <AlertTriangle aria-hidden="true" strokeWidth={2} className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/** The default text input, so every screen's fields are the same object. */
export function Input({
  className,
  mono,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return (
    <input
      {...props}
      // Shared with `Select` and `Textarea` rather than restated. This class
      // string used to live here alone, which is how five hand-copied subsets
      // of it ended up on other screens.
      className={controlClasses({
        invalid: Boolean(props["aria-invalid"]),
        mono,
        className,
      })}
    />
  );
}
