"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Action results, where the reader is looking.
 *
 * Every result used to render inline inside the form that produced it. On the
 * theme page that meant "Published v3. Link /t/northwind/…@3.css from your
 * application." appeared in a 22rem column in the page header — the most
 * important sentence the product ever says, in the least visible place it could
 * be.
 *
 * Two rules this is built on, and both are about not being a notification
 * system that people learn to ignore:
 *
 *   **Failures do not auto-dismiss.** A validation refusal names the pair, the
 *   ratio and the floor; that is something to read and act on, not something to
 *   catch before it fades. Successes dismiss after six seconds.
 *
 *   **It is an addition, not a replacement.** The inline `Callout` stays for
 *   anything a reader needs to keep looking at while they fix it. The toast is
 *   for the confirmation of something that has already happened.
 */

export type ToastTone = "pass" | "fail" | "info";

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  detail?: string;
}

interface ToastApi {
  show: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

/**
 * Reaching the toast queue.
 *
 * Returns a no-op outside a provider rather than throwing. A component that
 * wants to confirm something should not fail to render because it was mounted
 * somewhere without one — losing the confirmation is bad, losing the screen is
 * worse.
 */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? { show: () => undefined };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((toast: Omit<Toast, "id">) => {
    // `Date.now()` is fine as an id here — it never leaves the client and two
    // toasts cannot be raised in the same millisecond by a human.
    setToasts((current) => [...current.slice(-2), { ...toast, id: Date.now() }]);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}

      {/*
        `aria-live="polite"` and not `assertive`: a result arrives after a
        deliberate action, so it does not need to interrupt whatever a screen
        reader is currently saying. The region exists even when empty, because a
        live region added at the same moment as its content is not announced.
      */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const ICON = { pass: Check, fail: AlertTriangle, info: Info };

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = ICON[toast.tone];

  useEffect(() => {
    // A failure stays until it is dismissed: it is something to act on.
    if (toast.tone === "fail") return;
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [toast.tone, onDismiss]);

  return (
    <div
      role={toast.tone === "fail" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto w-full max-w-[26rem] rounded-xl border px-4 py-3 shadow-lg",
        "motion-safe:animate-[toast-in_240ms_var(--ease-out-expo)]",
        toast.tone === "pass" && "border-pass/25 bg-pass-wash",
        toast.tone === "fail" && "border-fail/30 bg-fail-wash",
        toast.tone === "info" && "border-rule bg-paper",
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon
          aria-hidden="true"
          strokeWidth={2}
          className={cn(
            "mt-0.5 size-4 shrink-0",
            toast.tone === "pass" && "text-pass",
            toast.tone === "fail" && "text-fail",
            toast.tone === "info" && "text-oxygen-deep",
          )}
        />

        <div className="min-w-0 flex-1">
          <p className="text-[0.8125rem] font-semibold">{toast.title}</p>
          {toast.detail && (
            <p className="body-sm mt-0.5 break-words text-graphite">{toast.detail}</p>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-m-1 shrink-0 rounded p-1 text-graphite-soft transition-colors duration-200 hover:text-ink"
        >
          <X aria-hidden="true" strokeWidth={2} className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
