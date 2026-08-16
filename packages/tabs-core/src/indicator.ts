/**
 * Indicator geometry.
 *
 * One element, two custom properties, no layout thrash. The naïve version —
 * animating `left` and `width` on a positioned div — repaints the strip every
 * frame, tears at fractional device pixels, and lands in the wrong place
 * whenever a web font arrives after hydration.
 *
 * Offsets are taken from `offsetLeft`/`offsetTop` at the call site rather than
 * from `getBoundingClientRect`, because those resolve against the same padding
 * edge an absolutely-positioned child does. That makes the maths
 * scroll-independent and identical in RTL, which a rect-delta approach is not:
 * `inset-inline-start` flips, physical `left` does not.
 */

import type { IndicatorKind, Orientation, TabVariant } from "./types.js";

export interface IndicatorGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TriggerOffsets {
  offsetLeft: number;
  offsetTop: number;
  offsetWidth: number;
  offsetHeight: number;
}

export function indicatorGeometry(trigger: TriggerOffsets): IndicatorGeometry {
  return {
    x: trigger.offsetLeft,
    y: trigger.offsetTop,
    width: trigger.offsetWidth,
    height: trigger.offsetHeight,
  };
}

/** The four custom properties the stylesheet consumes. */
export function indicatorStyle(geometry: IndicatorGeometry): Record<string, string> {
  return {
    "--ox-tabs-ind-x": `${geometry.x}px`,
    "--ox-tabs-ind-y": `${geometry.y}px`,
    "--ox-tabs-ind-w": `${geometry.width}px`,
    "--ox-tabs-ind-h": `${geometry.height}px`,
  };
}

/**
 * Which indicator a variant wants when the host says `auto`.
 *
 * Wrapping variants get `none`: with a line break there is no continuous path
 * between two triggers, so a sliding indicator would have to animate
 * diagonally across the wrap. Ghost, card and stat carry selection in their own
 * background and need no separate element at all — which also means no
 * measurement pass and no ResizeObserver for them.
 */
export function resolveIndicator(
  kind: IndicatorKind,
  variant: TabVariant,
): Exclude<IndicatorKind, "auto"> {
  if (kind !== "auto") return kind;
  switch (variant) {
    case "segmented":
    case "command":
      return "thumb";
    case "underline":
    case "rail":
      return "line";
    default:
      return "none";
  }
}

/**
 * A trigger's geometry is stale if either axis moved by more than half a
 * pixel. Half a pixel rather than zero because sub-pixel jitter from a
 * ResizeObserver would otherwise write custom properties on every frame of an
 * unrelated animation elsewhere on the page.
 */
export function geometryChanged(a: IndicatorGeometry | null, b: IndicatorGeometry): boolean {
  if (!a) return true;
  return (
    Math.abs(a.x - b.x) > 0.5 ||
    Math.abs(a.y - b.y) > 0.5 ||
    Math.abs(a.width - b.width) > 0.5 ||
    Math.abs(a.height - b.height) > 0.5
  );
}

/**
 * Whether a trigger needs scrolling into view, and by how much.
 *
 * `nearest` semantics, computed here rather than delegated to
 * `scrollIntoView({inline: "center"})` — centring re-centres the strip on
 * every arrow keypress, which makes a long tab list feel like it is fighting
 * you.
 */
export function scrollIntoViewDelta(
  triggerStart: number,
  triggerSize: number,
  scrollPos: number,
  clientSize: number,
  padding = 24,
): number {
  const start = triggerStart - padding;
  const end = triggerStart + triggerSize + padding;
  if (start < scrollPos) return start - scrollPos;
  if (end > scrollPos + clientSize) return end - (scrollPos + clientSize);
  return 0;
}

/** Which axis the indicator travels on. A vertical rail moves in block flow;
 *  everything else moves inline. */
export function indicatorAxis(orientation: Orientation): "inline" | "block" {
  return orientation === "vertical" ? "block" : "inline";
}
