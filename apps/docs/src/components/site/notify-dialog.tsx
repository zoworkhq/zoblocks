"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";

/**
 * "Notify me when it ships", as a dialog rather than a `mailto:`.
 *
 * The button opened the visitor's mail client with a subject line filled in.
 * That works and asks a lot: it hands somebody a compose window when all they
 * wanted was to leave an address, and on a machine with no mail client
 * configured it does nothing at all.
 *
 * ## It cannot silently swallow an address
 *
 * There is no waitlist backend — see `app/api/notify/route.ts`. If
 * `NOTIFY_WEBHOOK_URL` is set the address is forwarded and the dialog says so.
 * If it is not, the route answers `501` and this **falls back to the mail
 * client**, prefilled, so the request still reaches somebody. A form that
 * accepts what you typed and drops it is worse than no form: you leave
 * believing you are on a list.
 *
 * ## The accessibility of it
 *
 * Modelled on `command-menu.tsx`, which is this site's existing dialog: a
 * portal, `role="dialog"` with `aria-modal`, the app root hidden from
 * assistive tech while it is open, scroll locked, focus moved to the field on
 * open and returned to the trigger on close, Escape and backdrop to dismiss.
 *
 * Focus is trapped by hand rather than with a library. There are four
 * focusable things in here and a `Tab` handler that wraps between the first
 * and last is a dozen lines; a dependency for that is a dependency to keep
 * patched forever.
 */

/** Where a fallback lands, and the address the showcase page already uses. */
const FALLBACK = "hello@zowork.com";

const mailtoFor = (email: string) =>
  `mailto:${FALLBACK}?subject=${encodeURIComponent("Notify me when ZoBlocks Pro ships")}` +
  `&body=${encodeURIComponent(`Please let me know when Pro ships.\n\n${email}\n`)}`;

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done" }
  /** Handed to the mail client instead. Not a failure, and not a success. */
  | { kind: "handoff" }
  | { kind: "error"; message: string };

export function NotifyDialog({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>({ kind: "idle" });

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // `createPortal` needs a document, so nothing renders until the client has
  // one. The trigger is server-rendered; only the dialog waits.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Lock scroll, hide the app from assistive tech, restore focus on close.
  React.useEffect(() => {
    if (!open) return;
    const app = document.getElementById("app-root");
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    app?.setAttribute("aria-hidden", "true");
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 0);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = overflow;
      app?.removeAttribute("aria-hidden");

      /*
       * The trigger first, and the previously focused element only if it is
       * still in the document and can actually take focus.
       *
       * `document.activeElement` is `<body>` when a click moved focus nowhere,
       * and `body.focus()` is a no-op — so restoring "what was focused before"
       * left focus nowhere at all in WebKit, which is a keyboard reader
       * stranded at the top of the document. This dialog is always opened by
       * its own button, so that button is the right place to come back to.
       */
      const back =
        triggerRef.current ??
        (previouslyFocused && previouslyFocused !== document.body ? previouslyFocused : null);
      back?.focus?.();
    };
  }, [open]);

  function close() {
    setOpen(false);
    // Left as it was on purpose: reopening after a mistyped address should not
    // make somebody type the whole thing again.
    setStatus({ kind: "idle" });
  }

  /*
   * Escape is a window listener, not a React handler on the panel.
   *
   * The panel's handler only fires while focus is inside it, and after a
   * submit that hands off to the mail client focus can be somewhere else
   * entirely — a `mailto:` navigation the browser declines to make still
   * disturbs it. A dialog that cannot be dismissed with Escape because of
   * where focus happened to land is a trap.
   */
  React.useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open]);

  /** Tab wraps between the first and last control, so focus cannot leave. */
  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "Tab") return;

    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), input:not([disabled])",
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const address = email.trim();
    if (!address) return;

    setStatus({ kind: "sending" });
    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: address }),
      });

      if (response.ok) {
        setStatus({ kind: "done" });
        return;
      }

      /*
       * 501 means the site has nowhere to put it, which is a fact about our
       * deployment rather than about the address. Hand the person to their
       * mail client with it filled in, so their request still arrives.
       */
      if (response.status === 501) {
        setStatus({ kind: "handoff" });
        window.location.href = mailtoFor(address);
        return;
      }

      if (response.status === 400) {
        setStatus({ kind: "error", message: "That does not look like an email address." });
        return;
      }
      setStatus({ kind: "error", message: "Something went wrong. Try again, or email us." });
    } catch {
      // Offline, or the request never left. Same answer: do not pretend.
      setStatus({ kind: "handoff" });
      window.location.href = mailtoFor(address);
    }
  }

  const sending = status.kind === "sending";

  return (
    <>
      <button ref={triggerRef} type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) close();
              }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] motion-safe:animate-[overlay-in_200ms_ease-out]"
              />

              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="notify-title"
                onKeyDown={onKeyDown}
                className="surface-3 relative w-full max-w-md overflow-hidden rounded-2xl motion-safe:animate-[dialog-in_260ms_var(--ease-out-expo)]"
              >
                <div className="flex items-start justify-between gap-4 px-5 pt-5">
                  <div>
                    <h2 id="notify-title" className="font-display text-base font-semibold">
                      Notify me when Pro ships
                    </h2>
                    <p className="body-sm mt-1 text-graphite">
                      One message when the console is available. Nothing else.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="-m-1.5 rounded-lg p-1.5 text-graphite-soft hover:text-ink"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                </div>

                {status.kind === "done" ? (
                  <div className="px-5 pb-5 pt-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-brand-deep">
                      <Check aria-hidden="true" className="size-4" />
                      You are on the list.
                    </p>
                    <p className="body-sm mt-2 text-graphite">
                      We will write to {email.trim()} once, when it ships.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={submit} className="px-5 pb-5 pt-4">
                    <label htmlFor="notify-email" className="axis-label">
                      Email
                    </label>
                    <input
                      ref={inputRef}
                      id="notify-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (status.kind === "error") setStatus({ kind: "idle" });
                      }}
                      placeholder="you@example.org"
                      aria-describedby={status.kind === "error" ? "notify-error" : undefined}
                      aria-invalid={status.kind === "error" ? true : undefined}
                      className="mt-2 w-full rounded-lg border border-rule bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-graphite-soft"
                    />

                    {/*
                      One live region for every outcome. Announcing the error in
                      one place and the hand-off in another means a screen
                      reader user hears whichever we happened to put first.
                    */}
                    <p
                      id="notify-error"
                      role="status"
                      className="body-sm mt-2 min-h-5 text-graphite"
                      data-warn={status.kind === "error" ? "" : undefined}
                    >
                      {status.kind === "error" ? status.message : null}
                      {status.kind === "handoff"
                        ? "Opening your mail app — send the message and we will have it."
                        : null}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={sending}
                        className="inline-flex items-center rounded-lg bg-cta px-4 py-2.5 text-sm font-semibold text-paper disabled:opacity-70"
                      >
                        {sending ? "Sending…" : "Notify me"}
                      </button>
                      <a
                        href={`mailto:${FALLBACK}`}
                        className="body-sm text-graphite underline-offset-4 hover:text-ink hover:underline"
                      >
                        or email us
                      </a>
                    </div>
                  </form>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
