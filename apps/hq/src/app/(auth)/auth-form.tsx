"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CircleAlert, Info } from "lucide-react";
import type { FormState } from "@/lib/actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn w-full" disabled={pending}>
      {pending ? "Checking…" : label}
    </button>
  );
}

export function AuthForm({
  action,
  submitLabel,
  children,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5">
      {children}

      {/* Announced, and paired with an icon — the message has to survive
          grayscale and forced-colors, so colour never carries it alone. */}
      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-[var(--zb-status-critical-border)] bg-[var(--zb-status-critical-bg)] px-3 py-2.5 text-[0.8125rem] leading-snug text-[var(--zb-status-critical)]"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      )}

      {state.notice && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-rule bg-vellum px-3 py-2.5 text-[0.8125rem] leading-snug text-ink"
        >
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {state.notice}
        </p>
      )}

      <Submit label={submitLabel} />
    </form>
  );
}

export function Field({
  id,
  label,
  hint,
  ...props
}: {
  id: string;
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.75rem] font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="field"
        {...props}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
