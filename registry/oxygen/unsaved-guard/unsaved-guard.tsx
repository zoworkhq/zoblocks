"use client";

/**
 * UnsavedGuard — a central registry that stops clinical documentation being lost.
 *
 * Lost notes are among the most reliably enraging failures in clinical
 * software, and they are almost always a coordination failure rather than a
 * bug in any one form: several editors mounted independently, none of them
 * aware of the others, and a patient switch that nobody vetoed.
 *
 * So dirtiness is registered centrally rather than handled per-form, and the
 * guard blocks three things, not one:
 *
 *   - navigation
 *   - the patient context changing
 *   - the tab closing
 *
 * Two distinctions that decide whether the prompt is honest:
 *
 *   1. Recoverable vs genuinely lost. Work with a successful autosave can be
 *      navigated away from with a notice. Work whose autosave is FAILING must
 *      block, because the draft exists nowhere but this tab.
 *   2. Trivially recreatable vs twenty minutes of documentation. The registry
 *      takes a description so the prompt can say what is at stake instead of
 *      asking about "unsaved changes".
 *
 * Silent autosave failure is worse than no autosave, so failure escalates to
 * an assertive announcement rather than a quiet icon.
 */

import * as React from "react";
import { CircleAlert, CircleCheck, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveState = "clean" | "saving" | "saved" | "failed";

export interface DirtySurface {
  id: string;
  /** What would be lost, in the user's terms. "Progress note", not "form-3". */
  description: string;
  saveState: SaveState;
  /** When the last successful save happened, for the prompt. */
  lastSavedLabel?: string;
}

interface GuardContextValue {
  register: (surface: DirtySurface) => void;
  unregister: (id: string) => void;
  surfaces: DirtySurface[];
  /** Blocking surfaces are those whose work exists nowhere but this tab. */
  blocking: DirtySurface[];
  /** Ask permission before a navigation or context change. */
  confirmLeave: (intent: string) => Promise<boolean>;
}

const GuardContext = React.createContext<GuardContextValue | undefined>(undefined);

/**
 * Register this surface as dirty. Every editing component must participate —
 * a guard that only some forms use is a guard that does not work.
 */
export function useUnsavedWork(surface: DirtySurface | undefined) {
  const context = React.useContext(GuardContext);
  // Depend on the registration functions, never on the context object. The
  // context value changes whenever ANY surface registers; depending on it
  // would make this effect tear down and re-register on every such change,
  // which itself changes the context — a loop that ends in an OOM rather than
  // an error. `register`/`unregister` are stable for the provider's lifetime.
  const register = context?.register;
  const unregister = context?.unregister;
  const { id, description, saveState, lastSavedLabel } = surface ?? {};

  React.useEffect(() => {
    if (!register || !unregister || !id || !description || !saveState) return;
    register({ id, description, saveState, lastSavedLabel });
    return () => unregister(id);
  }, [register, unregister, id, description, saveState, lastSavedLabel]);
}

/** Ask the guard whether it is safe to leave. Returns false if the user cancels. */
export function useConfirmLeave() {
  const context = React.useContext(GuardContext);
  return context?.confirmLeave ?? (async () => true);
}

export function UnsavedGuardProvider({ children }: { children: React.ReactNode }) {
  const [surfaces, setSurfaces] = React.useState<DirtySurface[]>([]);
  const [pending, setPending] = React.useState<{
    intent: string;
    resolve: (ok: boolean) => void;
  } | null>(null);

  const register = React.useCallback((surface: DirtySurface) => {
    setSurfaces((current) => {
      const existing = current.find((s) => s.id === surface.id);
      // Re-registering an unchanged surface must return the SAME array, or
      // React re-renders, the context value changes, the registering effect
      // runs again, and the three of them spin until the tab runs out of
      // memory. Callers re-register on every render by design.
      if (
        existing &&
        existing.saveState === surface.saveState &&
        existing.description === surface.description &&
        existing.lastSavedLabel === surface.lastSavedLabel
      ) {
        return current;
      }
      return [...current.filter((s) => s.id !== surface.id), surface];
    });
  }, []);

  const unregister = React.useCallback((id: string) => {
    setSurfaces((current) =>
      current.some((s) => s.id === id) ? current.filter((s) => s.id !== id) : current,
    );
  }, []);

  // Work that exists nowhere but this tab. A failed autosave is the case that
  // must never be navigated past with a soft notice.
  //
  // Memoized because these feed the context value: a fresh array here makes
  // every consumer's effect re-run on every render.
  const blocking = React.useMemo(
    () => surfaces.filter((s) => s.saveState === "failed" || s.saveState === "saving"),
    [surfaces],
  );
  const dirty = React.useMemo(() => surfaces.filter((s) => s.saveState !== "clean"), [surfaces]);

  const confirmLeave = React.useCallback(
    (intent: string) =>
      new Promise<boolean>((resolve) => {
        if (!dirty.length) {
          resolve(true);
          return;
        }
        setPending({ intent, resolve });
      }),
    [dirty.length],
  );

  // The browser-level guard. We cannot style this prompt or choose its words;
  // it exists so a closed tab does not bypass everything above.
  React.useEffect(() => {
    if (!blocking.length) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [blocking.length]);

  const value = React.useMemo<GuardContextValue>(
    () => ({ register, unregister, surfaces, blocking, confirmLeave }),
    [register, unregister, surfaces, blocking, confirmLeave],
  );

  return (
    <GuardContext.Provider value={value}>
      {children}
      {pending && (
        <UnsavedPrompt
          intent={pending.intent}
          surfaces={dirty}
          blocking={blocking}
          onResolve={(ok) => {
            pending.resolve(ok);
            setPending(null);
          }}
        />
      )}
    </GuardContext.Provider>
  );
}

function UnsavedPrompt({
  intent,
  surfaces,
  blocking,
  onResolve,
}: {
  intent: string;
  surfaces: DirtySurface[];
  blocking: DirtySurface[];
  onResolve: (ok: boolean) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const hardBlock = blocking.length > 0;

  React.useEffect(() => {
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onResolve(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onResolve]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ox-unsaved-title"
        aria-describedby="ox-unsaved-desc"
        className="w-full max-w-md rounded-[var(--ox-radius-lg)] border border-[var(--ox-border)] bg-[var(--ox-surface-overlay)] p-5 shadow-[var(--ox-shadow-lg)]"
      >
        <h2 id="ox-unsaved-title" className="text-[length:var(--ox-text-lg)] font-bold">
          {hardBlock ? "This work is not saved" : "You have unsaved work"}
        </h2>

        <p
          id="ox-unsaved-desc"
          className="mt-2 text-[length:var(--ox-text-sm)] leading-relaxed text-[var(--ox-text-muted)]"
        >
          {hardBlock
            ? "The last save failed, so this exists only in this tab. Leaving now loses it."
            : "This is saved as a draft and will still be here when you return."}{" "}
          {intent}
        </p>

        {/* Naming what is at stake, rather than "unsaved changes". */}
        <ul className="mt-3 flex flex-col gap-1.5">
          {surfaces.map((surface) => (
            <li
              key={surface.id}
              className="flex items-center justify-between gap-3 rounded-[var(--ox-radius-sm)] bg-[var(--ox-bg-subtle)] px-2 py-1.5 text-[length:var(--ox-text-sm)]"
            >
              <span className="font-medium">{surface.description}</span>
              <SaveStatus state={surface.saveState} lastSavedLabel={surface.lastSavedLabel} />
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onResolve(false)}
            className="rounded-[var(--ox-radius)] border border-[var(--ox-border-strong)] px-3 py-2 text-[length:var(--ox-text-sm)] font-semibold hover:bg-[var(--ox-bg-muted)]"
          >
            Stay and finish
          </button>
          <button
            type="button"
            onClick={() => onResolve(true)}
            className={cn(
              "rounded-[var(--ox-radius)] px-3 py-2 text-[length:var(--ox-text-sm)] font-semibold text-white",
              hardBlock ? "bg-[var(--ox-status-critical)]" : "bg-[var(--ox-accent)]",
            )}
          >
            {hardBlock ? "Leave and lose it" : "Leave"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The always-visible autosave indicator.
 *
 * Failure is announced assertively. A silent autosave failure lets a clinician
 * write for twenty minutes believing their note is filed.
 */
export function SaveStatus({
  state,
  lastSavedLabel,
  className,
}: {
  state: SaveState;
  lastSavedLabel?: string;
  className?: string;
}) {
  const content = {
    clean: null,
    saving: (
      <>
        <RotateCw aria-hidden="true" className="size-3 motion-safe:animate-spin" />
        Saving…
      </>
    ),
    saved: (
      <>
        <CircleCheck aria-hidden="true" className="size-3" />
        Saved{lastSavedLabel ? ` ${lastSavedLabel}` : ""}
      </>
    ),
    failed: (
      <>
        <CircleAlert aria-hidden="true" className="size-3" />
        Not saved — retrying
      </>
    ),
  }[state];

  if (!content) return null;

  return (
    <span
      role="status"
      aria-live={state === "failed" ? "assertive" : "polite"}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap text-[length:var(--ox-text-xs)] font-medium",
        state === "failed" ? "text-[var(--ox-status-critical)]" : "text-[var(--ox-text-subtle)]",
        className,
      )}
    >
      {content}
    </span>
  );
}
