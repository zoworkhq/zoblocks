"use client";

/**
 * Overflow: scroll edges, priority-plus fitting, and container-driven collapse.
 *
 * Widths are measured once with everything visible and cached. The obvious
 * implementation — hide with CSS, then re-measure — reads zero for hidden
 * elements, concludes everything fits, un-hides them, and oscillates forever.
 */

import * as React from "react";
import { fitTabs, scrollEdges, shouldCollapse, type OverflowStrategy } from "@zoblocks/tabs-core";
import { useIsoLayoutEffect } from "./internal.js";

export interface UseOverflowOptions {
  listRef: React.RefObject<HTMLElement | null>;
  strategy: OverflowStrategy;
  count: number;
  selectedIndex: number;
  /** Space to keep free for the More control. */
  reserve?: number;
  deps: React.DependencyList;
}

export interface OverflowState {
  atStart: boolean;
  atEnd: boolean;
  /** Indices hidden into the menu. Empty unless strategy is "menu". */
  overflowIndices: number[];
  /** True when a narrow container should render a native picker instead. */
  collapsed: boolean;
  scrollBy: (direction: 1 | -1) => void;
  refresh: () => void;
}

export function useOverflow({
  listRef,
  strategy,
  count,
  selectedIndex,
  reserve = 96,
  deps,
}: UseOverflowOptions): OverflowState {
  const [edges, setEdges] = React.useState({ atStart: true, atEnd: true });
  const [overflowIndices, setOverflowIndices] = React.useState<number[]>([]);
  const [collapsed, setCollapsed] = React.useState(false);
  const widths = React.useRef<number[] | null>(null);
  const frame = React.useRef<number | null>(null);

  const readEdges = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setEdges(scrollEdges(list.scrollLeft, list.scrollWidth, list.clientWidth));
  }, [listRef]);

  const measureWidths = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return null;
    const tabs = Array.from(list.querySelectorAll<HTMLElement>("[data-zb-tab]"));
    // Everything visible for the duration of the read.
    const restore = tabs.map((tab) => tab.style.display);
    for (const tab of tabs) tab.style.display = "";
    const measured = tabs.map((tab) => tab.getBoundingClientRect().width);
    tabs.forEach((tab, i) => {
      tab.style.display = restore[i] ?? "";
    });
    return measured;
  }, [listRef]);

  const refit = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    if (strategy === "collapse") {
      setCollapsed(shouldCollapse(list.clientWidth, count));
      return;
    }
    if (strategy !== "menu") return;

    if (!widths.current || widths.current.length !== count) {
      widths.current = measureWidths();
    }
    if (!widths.current) return;

    const gap = Number.parseFloat(getComputedStyle(list).columnGap || "0") || 0;
    const { overflow } = fitTabs({
      widths: widths.current,
      available: list.clientWidth,
      gap,
      reserve,
      pinned: selectedIndex,
    });
    setOverflowIndices((current) =>
      current.length === overflow.length && current.every((v, i) => v === overflow[i])
        ? current
        : overflow,
    );
  }, [listRef, strategy, count, selectedIndex, reserve, measureWidths]);

  /*
   * Coalesce a burst of notifications into one pass — and then one more.
   *
   * This used to `return` when a frame was already queued, which drops the
   * notification rather than deferring it. That is only safe if the size a
   * dropped notification carried is the size the queued pass will read, and it
   * often is not: the pass reads at the *start* of the frame, so any change
   * arriving after that is lost, and ResizeObserver never repeats itself
   * because the change has already happened. The strip is then laid out for a
   * width it no longer has, permanently.
   *
   * It shows up as everything and nothing: a strip that never collapses to its
   * picker, an indicator still sized for the density before last, a menu
   * button in the wrong place. All of it needs several size changes inside one
   * frame to reproduce — page load with a webfont swap, or a contended CI
   * runner — which is why it survived a suite that passes locally.
   */
  const again = React.useRef(false);

  const refresh = React.useCallback(() => {
    if (typeof requestAnimationFrame === "undefined") {
      readEdges();
      refit();
      return;
    }
    if (frame.current !== null) {
      again.current = true;
      return;
    }
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      /*
       * The cache is dropped on every resize, not only when the tab set
       * changes.
       *
       * `refit` re-measures when the *number* of tabs changes, which catches a
       * tab being added and misses every reason a tab's width changes while
       * the set stays the same: a density switch, a webfont arriving, a label
       * translated, the container narrowing enough to wrap. The fit then runs
       * against widths measured against an earlier layout, and decides to hide
       * or show exactly the wrong tabs.
       */
      widths.current = null;
      readEdges();
      refit();

      // Something changed while that was queued, and its notification is not
      // coming again.
      if (again.current) {
        again.current = false;
        refresh();
      }
    });
  }, [readEdges, refit]);

  useIsoLayoutEffect(() => {
    // A changed tab set invalidates the cache: stale widths would fit the
    // wrong number of tabs, which is worse than measuring again.
    widths.current = null;
    readEdges();
    refit();
  }, [readEdges, refit, ...deps]);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const onScroll = () => readEdges();
    list.addEventListener("scroll", onScroll, { passive: true });
    return () => list.removeEventListener("scroll", onScroll);
  }, [listRef, readEdges]);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(refresh);
    observer.observe(list);
    return () => observer.disconnect();
  }, [listRef, refresh]);

  React.useEffect(() => {
    if (strategy !== "menu") return;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fonts?.ready) return;
    let cancelled = false;
    void fonts.ready.then(() => {
      if (cancelled) return;
      widths.current = null;
      refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [strategy, refresh]);

  React.useEffect(
    () => () => {
      if (frame.current !== null && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(frame.current);
      }
    },
    [],
  );

  const scrollBy = React.useCallback(
    (direction: 1 | -1) => {
      const list = listRef.current;
      if (!list) return;
      const rtl = getComputedStyle(list).direction === "rtl";
      const magnitude = list.clientWidth * 0.7 * direction;
      list.scrollBy({ left: rtl ? -magnitude : magnitude, behavior: "smooth" });
    },
    [listRef],
  );

  return { ...edges, overflowIndices, collapsed, scrollBy, refresh };
}
