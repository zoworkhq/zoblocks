import { useEffect, useRef, useState } from "react";
import { Tabs } from "@zoblocks/tabs";

export default function UnsavedChangesGuardExample() {
  const [isDirty, setIsDirty] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const resolveDialog = useRef<((allow: boolean) => void) | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  function confirmLeave(): Promise<boolean> {
    return new Promise((resolve) => {
      returnFocus.current = rootRef.current?.querySelector(
        '[role="tab"][aria-selected="true"]',
      ) as HTMLElement | null;

      resolveDialog.current = resolve;
      setDialogOpen(true);
    });
  }

  function finishDialog(allow: boolean) {
    resolveDialog.current?.(allow);
    resolveDialog.current = null;

    if (!allow) {
      setTimeout(() => returnFocus.current?.focus(), 0);
    }

    setDialogOpen(false);
  }

  useEffect(() => {
    if (!dialogOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        finishDialog(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogOpen]);

  return (
    <section className="space-y-4">
      <div ref={rootRef} className="space-y-4">
        <Tabs
          as="tabs"
          variant="segmented"
          aria-label="Note editor"
          defaultValue="compose"
          onBeforeChange={() => (isDirty ? confirmLeave() : true)}
          items={[
            {
              value: "compose",
              label: "Compose",
              dot: isDirty ? "dirty" : undefined,
              children: (
                <div className="rounded-xl border border-dashed border-[var(--zb-border)] bg-[var(--zb-bg-subtle)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium">Clinical note</h3>
                    {isDirty && (
                      <span className="text-xs text-[var(--zb-status-high)]">Unsaved changes</span>
                    )}
                  </div>

                  <textarea
                    aria-label="Clinical note"
                    defaultValue="Patient reports feeling better today. Follow-up planned."
                    onChange={() => setIsDirty(true)}
                    rows={3}
                    className="w-full resize-y rounded-md border border-[var(--zb-border)] bg-[var(--zb-surface)] p-3 text-sm outline-none focus:border-[var(--zb-accent)]"
                  />

                  <button
                    type="button"
                    onClick={() => setIsDirty(false)}
                    className="mt-3 rounded-md border border-[var(--zb-border)] px-3 py-1.5 text-sm hover:bg-[var(--zb-bg-subtle)]"
                  >
                    Mark as saved
                  </button>
                </div>
              ),
            },
            {
              value: "preview",
              label: "Preview",
              children: (
                <div className="rounded-xl border border-dashed border-[var(--zb-border)] bg-[var(--zb-bg-subtle)] p-4">
                  <h3 className="font-medium">Note preview</h3>
                  <p className="mt-2 text-sm text-[var(--zb-text-muted)]">
                    Review the note before signing.
                  </p>
                </div>
              ),
            },
            {
              value: "history",
              label: "History",
              children: (
                <div className="rounded-xl border border-dashed border-[var(--zb-border)] bg-[var(--zb-bg-subtle)] p-4">
                  <h3 className="font-medium">Version history</h3>
                  <p className="mt-2 text-sm text-[var(--zb-text-muted)]">
                    No previous versions available.
                  </p>
                </div>
              ),
            },
          ]}
        />

        {dialogOpen && (
          <div
            role="dialog"
            aria-labelledby="unsaved-dialog-title"
            className="rounded-xl border border-[var(--zb-status-high-border)] bg-[var(--zb-status-high-bg)] p-4 shadow-sm"
          >
            <h3 id="unsaved-dialog-title" className="text-base font-semibold text-[var(--zb-text)]">
              This note has unsigned changes
            </h3>

            <p className="mt-2 text-sm text-[var(--zb-text-muted)]">
              You have unsaved changes. Would you like to switch tabs and keep your draft?
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => finishDialog(false)}
                className="rounded-md border border-[var(--zb-border)] bg-[var(--zb-surface)] px-3 py-2 text-sm hover:bg-[var(--zb-bg-subtle)]"
              >
                Stay and sign
              </button>

              <button
                type="button"
                onClick={() => finishDialog(true)}
                className="rounded-md bg-[#067662] px-3 py-2 text-sm text-white hover:bg-[#055f4f]"
              >
                Switch, keep draft
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
