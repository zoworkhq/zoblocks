"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, KeyRound } from "lucide-react";
import { issuePasswordReset } from "@/lib/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-outline" disabled={pending}>
      <KeyRound aria-hidden="true" className="size-3.5" />
      {pending ? "Creating…" : "Reset link"}
    </button>
  );
}

/**
 * Issues a one-time reset link and shows it once. There is nowhere to look it
 * up afterwards — only the hash is stored — so the UI has to make clear that
 * this is the only time it will be readable.
 */
export function ResetLinkButton({ userId, name }: { userId: string; name: string }) {
  const [state, action] = useActionState(issuePasswordReset, {});
  const [copied, setCopied] = useState(false);

  const url = state.link
    ? `${typeof window !== "undefined" ? window.location.origin : ""}${state.link}`
    : "";

  return (
    <>
      <form action={action}>
        <input type="hidden" name="userId" value={userId} />
        <Submit />
      </form>

      {state.error && (
        <p role="alert" className="row-popover text-[0.6875rem] text-[var(--zb-status-critical)]">
          {state.error}
        </p>
      )}

      {state.link && (
        <div className="row-popover flex flex-col gap-1">
          <p className="text-[0.625rem] leading-snug text-muted">
            One-time link for {name}. Valid 1 hour, shown once — copy it now.
          </p>
          <div className="flex items-center gap-1">
            <input
              readOnly
              value={url}
              aria-label={`Reset link for ${name}`}
              onFocus={(e) => e.currentTarget.select()}
              className="field px-1.5 py-1 text-[0.625rem]"
            />
            <button
              type="button"
              className="btn-outline shrink-0 px-1.5 py-1"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  // Clipboard can be blocked; the field is selectable either way.
                }
              }}
            >
              {copied ? (
                <Check aria-hidden="true" className="size-3" />
              ) : (
                <Copy aria-hidden="true" className="size-3" />
              )}
              <span className="sr-only">{copied ? "Copied" : "Copy link"}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
