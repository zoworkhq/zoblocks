"use client";

/**
 * The indicator engine.
 *
 * Six things invalidate a measurement, and every one of them is a real bug if
 * you skip it:
 *
 *   1. selection change            — obvious
 *   2. the list resizing           — obvious
 *   3. a *trigger* resizing        — a count can change from 9 to 10 without
 *                                    the list changing width at all
 *   4. web fonts arriving          — miss this and the indicator is ~12px off
 *                                    for the first 300ms of every cold load
 *   5. the strip scrolling         — offsets are scroll-independent, but the
 *                                    scroll shadow state is not
 *   6. registry changes            — tabs added or closed
 *
 * Reads and writes are batched through one rAF so a strip of eleven tabs
 * causes one layout, not eleven.
 */

import * as React from "react";
import {
  geometryChanged,
  indicatorGeometry,
  indicatorStyle,
  type IndicatorGeometry,
} from "@oxygenui-design/tabs-core";
import { useIsoLayoutEffect } from "./internal.js";

export interface UseIndicatorOptions {
  listRef: React.RefObject<HTMLElement | null>;
  /** Returns the currently selected trigger element, or null. */
  getSelected: () => HTMLElement | null;
  enabled: boolean;
  /**
   * Observe the list only, not every trigger. Above a few dozen tabs the
   * per-trigger observers become the dominant cost, and a label whose width
   * changes without the list resizing is rare enough to trade away.
   */
  observeListOnly?: boolean;
  /** Any change to this re-measures. */
  deps: React.DependencyList;
}

export interface IndicatorState {
  style: React.CSSProperties;
  measured: boolean;
  remeasure: () => void;
}

export function useIndicator({
  listRef,
  getSelected,
  enabled,
  observeListOnly = false,
  deps,
}: UseIndicatorOptions): IndicatorState {
  const [geometry, setGeometry] = React.useState<IndicatorGeometry | null>(null);
  const previous = React.useRef<IndicatorGeometry | null>(null);
  const frame = React.useRef<number | null>(null);
  const getSelectedRef = React.useRef(getSelected);
  getSelectedRef.current = getSelected;

  const measure = React.useCallback(() => {
    if (!enabled) return;
    const element = getSelectedRef.current();
    if (!element) {
      previous.current = null;
      setGeometry(null);
      return;
    }
    // A hidden element reports zeros. Writing them would collapse the
    // indicator to nothing and then animate it back out when the strip
    // reappears, which reads as a glitch on every accordion open.
    if (element.offsetWidth === 0 && element.offsetHeight === 0) return;

    const next = indicatorGeometry({
      offsetLeft: element.offsetLeft,
      offsetTop: element.offsetTop,
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight,
    });
    if (!geometryChanged(previous.current, next)) return;
    previous.current = next;
    setGeometry(next);
  }, [enabled]);

  const remeasure = React.useCallback(() => {
    if (frame.current !== null) return;
    if (typeof requestAnimationFrame === "undefined") {
      measure();
      return;
    }
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      measure();
    });
  }, [measure]);

  // Selection and registry changes measure synchronously before paint, so the
  // indicator never renders one frame behind the label weight change.
  useIsoLayoutEffect(() => {
    measure();
  }, [measure, ...deps]);

  React.useEffect(() => {
    if (!enabled) return;
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;

    // Held in a variable and disconnected on cleanup. An unreferenced
    // ResizeObserver is collectable, and a collected observer is a resize
    // handler that silently stops firing.
    const observer = new ResizeObserver(remeasure);
    observer.observe(list);
    if (observeListOnly) {
      // Still watch the selected trigger: it is the one the indicator is sized
      // to, so its width changing is never negligible. Everything else is left
      // to the list resize, which is what makes a 200-tab strip affordable.
      const selected = getSelectedRef.current();
      if (selected) observer.observe(selected);
    } else {
      for (const child of Array.from(list.querySelectorAll("[data-ox-tab]"))) {
        observer.observe(child);
      }
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, listRef, remeasure, observeListOnly, ...deps]);

  React.useEffect(() => {
    if (!enabled) return;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fonts?.ready) return;
    let cancelled = false;
    void fonts.ready.then(() => {
      if (!cancelled) remeasure();
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, remeasure]);

  React.useEffect(
    () => () => {
      if (frame.current !== null && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(frame.current);
      }
    },
    [],
  );

  return {
    style: (geometry ? indicatorStyle(geometry) : {}) as React.CSSProperties,
    measured: geometry !== null,
    remeasure,
  };
}
