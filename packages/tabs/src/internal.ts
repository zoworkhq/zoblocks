"use client";

/**
 * Shared plumbing. Nothing here is exported from the package.
 */

import * as React from "react";
import {
  formatProblems,
  hotkeyIndex,
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
} from "@zoblocks/tabs-core";

/**
 * `useLayoutEffect` warns on the server, and the indicator genuinely needs to
 * measure before paint on the client. Swapping to `useEffect` where there is
 * no layout to read is the standard resolution and costs nothing: the
 * server-rendered strip paints selection from CSS alone (see `styles.css`,
 * `:not([data-zb-measured])`).
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

function report(input: ValidateInput, scope: ValidateScope): void {
  const { ignore, only } = scope;
  const problems = validateTabsConfig(input).filter((problem) => {
    if (only) return only.includes(problem.code);
    return !ignore?.includes(problem.code);
  });
  if (problems.length === 0) return;
  throw new Error(formatProblems(problems));
}

/**
 * Validation during render, for a caller that already knows its items.
 *
 * The effect-based variant below cannot run on a server, so a tablist of links
 * would pass straight through `renderToString` and only fail once it reached a
 * browser — the wrong half of the pipeline to find out in, and precisely the
 * defect this component exists to prevent. The declarative `Tabs` has its
 * items as a prop, so it checks them at render time and fails identically in
 * both places.
 */
export function useValidateProps(input: ValidateInput, scope: ValidateScope = {}): void {
  report(input, scope);
}

/**
 * Validation after mount, for the compound API.
 *
 * `Tabs.Root` learns its items from the trigger registry, which layout effects
 * fill — so there is nothing to validate until after the first commit, and
 * nothing at all on a server. This is the unavoidably late check; the
 * render-time one above covers everything that can be known earlier.
 */
export function useValidateConfig(input: ValidateInput, scope: ValidateScope = {}): void {
  const { ignore, only } = scope;
  // The dependency list is intentionally coarse — validation is cheap, and a
  // fine-grained list would miss a mutated item object.
  React.useEffect(() => {
    report(input, { ignore, only });
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
  return provided ?? `zb-tabs-${generated.replace(/:/g, "")}`;
}

/**
 * `Ctrl`/`Cmd` + 1…9, bound at the document.
 *
 * Document-level because a shortcut that only works while the strip already
 * has focus is not a shortcut — the whole point is reaching a tab from
 * wherever you are. It is opt-in for the reason in `hotkeyIndex`: on Windows
 * and Linux these belong to the browser first.
 */
export function useTabsHotkeys(options: {
  enabled: boolean;
  getItems: () => readonly TabItem[];
  select: (value: string, source: ChangeSource, item?: TabItem) => void;
}): void {
  const ref = React.useRef(options);
  ref.current = options;

  React.useEffect(() => {
    if (!options.enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const { getItems, select } = ref.current;
      const items = getItems();
      const index = hotkeyIndex(
        event.key,
        {
          ctrl: event.ctrlKey,
          meta: event.metaKey,
          alt: event.altKey,
          shift: event.shiftKey,
        },
        items.length,
      );
      if (index === null) return;
      const item = items[index];
      if (!item) return;
      event.preventDefault();
      select(item.value, "keyboard", item);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [options.enabled]);
}

/**
 * Runs an update inside a View Transition when the host asked for one.
 *
 * Opt-in, and not the default: `startViewTransition` serialises the update, so
 * arrowing quickly through a strip queues transitions instead of keeping up.
 * Unsupported engines fall through to a plain call rather than a polyfill —
 * the standard transition is already correct, and this is decoration on top.
 */
export function runWithTransition(enabled: boolean, update: () => void): void {
  if (!enabled || typeof document === "undefined") {
    update();
    return;
  }
  // Feature-detected rather than assumed: Firefox has not shipped it, and the
  // standard transition is already correct without it.
  const start = (document as Partial<Document>).startViewTransition;
  if (typeof start !== "function") {
    update();
    return;
  }
  start.call(document, update);
}
