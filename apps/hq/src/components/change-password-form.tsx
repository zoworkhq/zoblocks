"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CircleAlert, Check } from "lucide-react";
import { changeOwnPassword } from "@/lib/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? "Saving…" : "Change password"}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState(changeOwnPassword, {});
  const form = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={form}
      action={async (data) => {
        const result = await action(data);
        // Clear the fields on success only — on failure the person should not
        // have to retype what was already right.
        if (!("error" in (result ?? {}))) form.current?.reset();
        return result;
      }}
      className="space-y-3"
    >
      <div>
        <label htmlFor="current" className="mb-1.5 block text-[0.75rem] font-medium text-ink">
          Current password
        </label>
        <input
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          required
          className="field"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[0.75rem] font-medium text-ink">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          aria-describedby="new-hint"
          className="field"
        />
        <p id="new-hint" className="mt-1.5 text-[0.6875rem] text-muted">
          At least 12 characters.
        </p>
      </div>

      <div>
        <label htmlFor="confirm" className="mb-1.5 block text-[0.75rem] font-medium text-ink">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className="field"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-[var(--ox-status-critical-border)] bg-[var(--ox-status-critical-bg)] px-3 py-2 text-[0.75rem] text-[var(--ox-status-critical)]"
        >
          <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {state.error}
        </p>
      )}

      {state.notice && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-rule bg-vellum px-3 py-2 text-[0.75rem] text-ink"
        >
          <Check aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {state.notice}
        </p>
      )}

      <Submit />
    </form>
  );
}
