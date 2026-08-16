"use client";

/**
 * Overflow: scroll edges, priority-plus fitting, and container-driven collapse.
 *
 * Widths are measured once with everything visible and cached. The obvious
 * implementation — hide with CSS, then re-measure — reads zero for hidden
 * elements, concludes everything fits, un-hides them, and oscillates forever.
 */

import * as React from "react";
import {
  fitTabs,
  scrollEdges,
  shouldCollapse,
  type OverflowStrategy,
} from "@oxygenui-design/tabs-core";
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
    const tabs = Array.from(list.querySelectorAll<HTMLElement>("[data-ox-tab]"));
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

  const refresh = React.useCallback(() => {
    if (frame.current !== null) return;
    if (typeof requestAnimationFrame === "undefined") {
      readEdges();
      refit();
      return;
    }
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      readEdges();
      refit();
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
