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
                <div className="rounded-xl border border-dashed border-gray-300 bg-[#F8FAFC] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium">Clinical note</h3>
                    {isDirty && <span className="text-xs text-amber-700">Unsaved changes</span>}
                  </div>

                  <textarea
                    aria-label="Clinical note"
                    defaultValue="Patient reports feeling better today. Follow-up planned."
                    onChange={() => setIsDirty(true)}
                    rows={3}
                    className="w-full resize-y rounded-md border border-gray-300 bg-white p-3 text-sm outline-none focus:border-teal-700"
                  />

                  <button
                    type="button"
                    onClick={() => setIsDirty(false)}
                    className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
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
                <div className="rounded-xl border border-dashed border-gray-300 bg-[#F8FAFC] p-4">
                  <h3 className="font-medium">Note preview</h3>
                  <p className="mt-2 text-sm text-gray-600">Review the note before signing.</p>
                </div>
              ),
            },
            {
              value: "history",
              label: "History",
              children: (
                <div className="rounded-xl border border-dashed border-gray-300 bg-[#F8FAFC] p-4">
                  <h3 className="font-medium">Version history</h3>
                  <p className="mt-2 text-sm text-gray-600">No previous versions available.</p>
                </div>
              ),
            },
          ]}
        />

        {dialogOpen && (
          <div
            role="dialog"
            aria-labelledby="unsaved-dialog-title"
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm"
          >
            <h3 id="unsaved-dialog-title" className="text-base font-semibold text-gray-900">
              This note has unsigned changes
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              You have unsaved changes. Would you like to switch tabs and keep your draft?
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => finishDialog(false)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-100"
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
