"use client";

/**
 * Shared plumbing. Nothing here is exported from the package.
 */

import * as React from "react";
import {
  formatProblems,
  isTypeaheadKey,
  keyToIntent,
  matchTypeahead,
  reorderIntent,
  Typeahead,
  validateTabsConfig,
  type ChangeSource,
  type NavigationOptions,
  type ProblemCode,
  type TabItem,
  type ValidateInput,
} from "@oxygenui-design/tabs-core";

/**
 * `useLayoutEffect` warns on the server, and the indicator genuinely needs to
 * measure before paint on the client. Swapping to `useEffect` where there is
 * no layout to read is the standard resolution and costs nothing: the
 * server-rendered strip paints selection from CSS alone (see `styles.css`,
 * `:not([data-ox-measured])`).
 */
export const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/**
 * The configuration check. It throws, and it runs everywhere.
 *
 * Not gated on `NODE_ENV`, for two reasons. Reading `process.env` from
 * component source is forbidden repo-wide — a registry component is copied
 * into a customer's project, where that variable does not exist — and gating
 * it would be pointless anyway: every problem here is deterministic, so an
 * environment that would throw in production has already thrown in
 * development and in CI.
 *
 * It throws rather than warns because writing to a customer's console is also
 * forbidden, and because a warning is the wrong volume for a defect that
 * renders perfectly. Nobody reads it, and the product ships with a tablist
 * full of links.
 */
export interface ValidateScope {
  /** Codes this caller must not report. */
  ignore?: readonly ProblemCode[];
  /** Codes this caller is the *only* one to report. */
  only?: readonly ProblemCode[];
}

export function useValidateConfig(input: ValidateInput, scope: ValidateScope = {}): void {
  const { ignore, only } = scope;
  // The dependency list is intentionally coarse — validation is dev-only and
  // cheap, and a fine-grained list would miss a mutated item object.
  React.useEffect(() => {
    const problems = validateTabsConfig(input).filter((problem) => {
      if (only) return only.includes(problem.code);
      return !ignore?.includes(problem.code);
    });
    if (problems.length === 0) return;
    throw new Error(formatProblems(problems));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.mode, input.items, input.overflow, input.value, input.defaultValue]);
}

/**
 * Codes the trigger registry cannot answer reliably.
 *
 * The registry is filled by layout effects, so it is one commit behind a host
 * that adds an item and selects it in the same update — a completely ordinary
 * thing to do with editable tabs. Reporting "value not in items" there would
 * throw on correct code, and a dev-mode error that fires on correct code gets
 * the whole check deleted.
 */
export const REGISTRY_UNRELIABLE: readonly ProblemCode[] = ["value-not-in-items"];

/**
 * Codes the declarative `Tabs` reports, and nothing else does.
 *
 * The split matters more than it looks: React collapses two errors thrown
 * from two effects in one commit into an `AggregateError` whose message is
 * the empty string. A developer would see "AggregateError" and none of the
 * explanation — for a check whose entire value is the explanation. So exactly
 * one component reports each problem.
 */
export const DECLARATIVE_ONLY: readonly ProblemCode[] = [
  "value-not-in-items",
  "panels-without-owner",
];

export interface ControllableOptions<T> {
  value: T | undefined;
  defaultValue: T | undefined;
  onChange?: ((value: T, source: ChangeSource) => void) | undefined;
}

/**
 * Controlled/uncontrolled, with the controlled branch never writing state.
 *
 * A component that mirrors a controlled prop into state renders the stale copy
 * for one frame after every parent update, which shows up as a tab that
 * flickers back before settling.
 */
export function useControllableValue<T>({
  value,
  defaultValue,
  onChange,
}: ControllableOptions<T>): [T | undefined, (next: T, source: ChangeSource) => void] {
  const controlled = value !== undefined;
  const [internal, setInternal] = React.useState<T | undefined>(defaultValue);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  const set = React.useCallback(
    (next: T, source: ChangeSource) => {
      if (!controlled) setInternal(next);
      onChangeRef.current?.(next, source);
    },
    [controlled],
  );

  return [controlled ? value : internal, set];
}

export interface KeyboardOptions extends NavigationOptions {
  getItems: () => readonly TabItem[];
  getFocusedIndex: () => number;
  focusIndex: (index: number) => void;
  select: (value: string, source: ChangeSource, item?: TabItem) => void;
  close?: ((value: string) => void) | undefined;
  reorder?: ((from: number, to: number) => void) | undefined;
  activation: "automatic" | "manual";
  enabled: boolean;
}

/**
 * The one keydown handler, shared by `Tabs.List` and the public `useTabs`.
 *
 * Automatic activation selects as focus moves; manual moves focus only and
 * waits for Enter or Space. The difference matters when a panel fetches:
 * arrowing across six tabs under automatic activation fires six requests and
 * reads six live regions to a screen-reader user.
 */
export function useTabsKeyboard(options: KeyboardOptions) {
  const typeahead = React.useRef(new Typeahead());
  const optionsRef = React.useRef(options);
  optionsRef.current = options;

  return React.useCallback((event: React.KeyboardEvent) => {
    const opts = optionsRef.current;
    if (!opts.enabled) return;

    const items = opts.getItems();
    const current = opts.getFocusedIndex();
    if (current < 0) return;

    // Checked before navigation, because the modifier combination is a
    // superset of the plain arrow that would otherwise move selection.
    if (opts.reorder) {
      const move = reorderIntent(
        event.key,
        { ctrl: event.ctrlKey, meta: event.metaKey, shift: event.shiftKey },
        current,
        items.length,
        { orientation: opts.orientation, rtl: opts.rtl ?? false },
      );
      if (move) {
        event.preventDefault();
        opts.reorder(move.from, move.to);
        // Focus follows the tab, not the position — otherwise a second press
        // moves whatever slid into the old slot.
        opts.focusIndex(move.to);
        return;
      }
    }

    if (isTypeaheadKey(event.key, event.ctrlKey, event.metaKey, event.altKey)) {
      // `event.timeStamp`, not a clock read: the component never reads the
      // current time (it is untestable and breaks visual-regression
      // determinism), and the buffer only needs elapsed time between two
      // events — which the events themselves already carry.
      const buffer = typeahead.current.push(event.key, event.timeStamp);
      const match = matchTypeahead(items, buffer, current);
      if (match !== null) {
        event.preventDefault();
        opts.focusIndex(match);
        const item = items[match];
        if (opts.activation === "automatic" && item) opts.select(item.value, "keyboard", item);
      }
      return;
    }

    const intent = keyToIntent(event.key, items, current, {
      orientation: opts.orientation,
      rtl: opts.rtl ?? false,
      loop: opts.loop ?? true,
    });

    switch (intent.kind) {
      case "move": {
        event.preventDefault();
        opts.focusIndex(intent.index);
        const item = items[intent.index];
        if (opts.activation === "automatic" && item) opts.select(item.value, "keyboard", item);
        return;
      }
      case "activate": {
        const item = items[current];
        if (!item) return;
        // Space must be swallowed even when it does nothing, or the page
        // scrolls out from under the strip.
        event.preventDefault();
        opts.select(item.value, "keyboard", item);
        return;
      }
      case "close": {
        const item = items[current];
        if (!item || !opts.close || !item.closable) return;
        event.preventDefault();
        opts.close(item.value);
        return;
      }
      default:
        return;
    }
  }, []);
}

/** Reads writing direction from the element rather than assuming it. */
export function useDirection(ref: React.RefObject<HTMLElement | null>): boolean {
  const [rtl, setRtl] = React.useState(false);
  useIsoLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setRtl(getComputedStyle(element).direction === "rtl");
  });
  return rtl;
}

/** Stable id that survives re-render and is unique per instance. */
export function useBaseId(provided?: string): string {
  const generated = React.useId();
  return provided ?? `ox-tabs-${generated.replace(/:/g, "")}`;
}
