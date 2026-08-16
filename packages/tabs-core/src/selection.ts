/**
 * Selection as a request, not a fact.
 *
 * In a clinical documentation surface, switching tabs can mean abandoning an
 * unsigned note. So a change is proposed, something may veto it, and the veto
 * may be asynchronous because it usually means asking a human. While it is
 * pending the strip is inert — the one case where an unresponsive tab is
 * correct rather than a bug.
 *
 * The concurrency rule is `supersede`: a second request while one is pending
 * cancels the first rather than queueing it. Queueing would mean answering a
 * dialog about tab B and landing on tab C.
 */

import type { ChangeSource, TabItem } from "./types.js";

export type BeforeChange = (
  next: string,
  previous: string | undefined,
) => boolean | Promise<boolean>;

export type GateOutcome =
  | { status: "committed"; value: string }
  | { status: "vetoed"; value: string }
  | { status: "superseded"; value: string }
  | { status: "blocked"; value: string; reason: "disabled" | "unavailable" | "same" };

export interface ChangeGateOptions {
  onBeforeChange?: BeforeChange | undefined;
  /** Called only when the change actually happens. */
  onCommit: (value: string, source: ChangeSource) => void;
  /** Notified whenever pending flips, so the UI can go inert. */
  onPendingChange?: ((pending: boolean) => void) | undefined;
}

export interface ChangeGate {
  request(value: string, source: ChangeSource, item?: TabItem): Promise<GateOutcome>;
  readonly pending: boolean;
  /** Current value, tracked so the gate can refuse a no-op. */
  sync(value: string | undefined): void;
  dispose(): void;
}

export function createChangeGate(options: ChangeGateOptions): ChangeGate {
  let current: string | undefined;
  let pending = false;
  let token = 0;
  let disposed = false;

  const setPending = (next: boolean) => {
    if (pending === next) return;
    pending = next;
    options.onPendingChange?.(next);
  };

  return {
    get pending() {
      return pending;
    },

    sync(value) {
      current = value;
    },

    dispose() {
      disposed = true;
      // Any in-flight request is invalidated rather than left to resolve into
      // an unmounted tree.
      token++;
      setPending(false);
    },

    async request(value, source, item) {
      if (disposed) return { status: "superseded", value };

      // A disabled tab is still focusable and still clickable — that is the
      // point of aria-disabled — so refusing happens here, not by removing the
      // handler.
      if (item?.disabled) return { status: "blocked", value, reason: "disabled" };
      if (item?.availability === "unavailable") {
        return { status: "blocked", value, reason: "unavailable" };
      }
      if (value === current) return { status: "blocked", value, reason: "same" };

      const before = options.onBeforeChange;
      if (!before) {
        current = value;
        options.onCommit(value, source);
        return { status: "committed", value };
      }

      const mine = ++token;
      let verdict: boolean | Promise<boolean>;
      try {
        verdict = before(value, current);
      } catch {
        // A guard that throws is treated as a refusal. Committing anyway would
        // discard a note because someone's confirm dialog had a bug.
        return { status: "vetoed", value };
      }

      if (typeof verdict === "boolean") {
        if (!verdict) return { status: "vetoed", value };
        if (mine !== token) return { status: "superseded", value };
        current = value;
        options.onCommit(value, source);
        return { status: "committed", value };
      }

      setPending(true);
      let allowed: boolean;
      try {
        allowed = await verdict;
      } catch {
        if (mine === token) setPending(false);
        return { status: "vetoed", value };
      }
      if (mine !== token || disposed) return { status: "superseded", value };
      setPending(false);
      if (!allowed) return { status: "vetoed", value };
      current = value;
      options.onCommit(value, source);
      return { status: "committed", value };
    },
  };
}

/** Index of `value`, or -1. */
export function indexOfValue(items: readonly TabItem[], value: string | undefined): number {
  if (value === undefined) return -1;
  return items.findIndex((item) => item.value === value);
}

/**
 * The value an uncontrolled component should start on.
 *
 * Falls through to the first *enabled* item rather than the first item: an
 * initial selection that is disabled leaves the panel empty with no way to
 * fix it from the keyboard.
 */
export function initialValue(
  items: readonly TabItem[],
  defaultValue: string | undefined,
): string | undefined {
  if (defaultValue !== undefined && items.some((item) => item.value === defaultValue)) {
    return defaultValue;
  }
  const firstEnabled = items.find((item) => !item.disabled);
  return firstEnabled?.value ?? items[0]?.value;
}

/**
 * Steps only: whether a step may be entered.
 *
 * Backwards is always free. Locking completed steps is the most common wizard
 * mistake — it forces a restart to fix a typo — so the only gate is forwards
 * into something explicitly locked.
 */
export function canEnterStep(items: readonly TabItem[], from: number, to: number): boolean {
  if (to <= from) return true;
  const target = items[to];
  if (!target) return false;
  return target.state !== "locked" && !target.disabled;
}
