/**
 * Priority-plus overflow, as arithmetic.
 *
 * The naïve implementation hides tabs with CSS and counts what disappeared.
 * Hidden elements report a zero width, so the next measurement believes
 * everything fits, un-hides them, and the strip oscillates. Measurement here
 * is therefore a pure function of a cached width map — the DOM layer measures
 * once with everything visible and never re-reads a hidden box.
 */

export interface FitOptions {
  /** Measured width of each trigger, in order, with everything visible. */
  widths: readonly number[];
  /** Inline size available to the list. */
  available: number;
  /** Gap between triggers, applied between neighbours. */
  gap?: number;
  /** Width to keep free for the "More" control. */
  reserve?: number;
  /**
   * Index that must stay visible whatever else is dropped. The selected tab
   * disappearing into a menu is how users lose their place.
   */
  pinned?: number;
}

export interface FitResult {
  visible: number[];
  overflow: number[];
}

/**
 * Greedy fit from the start, with the pinned index promoted.
 *
 * Promoting rather than reordering is deliberate: the visible set keeps
 * document order, so the strip never appears to shuffle. Only membership
 * changes.
 */
export function fitTabs({
  widths,
  available,
  gap = 0,
  reserve = 0,
  pinned = -1,
}: FitOptions): FitResult {
  const n = widths.length;
  if (n === 0) return { visible: [], overflow: [] };

  // Everything fits: no reserve is needed, because there is no More button.
  const total = widths.reduce((sum, w) => sum + w, 0) + gap * Math.max(0, n - 1);
  if (total <= available) {
    return { visible: widths.map((_, i) => i), overflow: [] };
  }

  const budget = available - reserve;
  const visible: number[] = [];
  let used = 0;

  // The pinned item is charged first so it can never be the one that does not
  // fit, then skipped in the main pass.
  const pinnedWidth = pinned >= 0 && pinned < n ? (widths[pinned] ?? 0) : 0;
  if (pinned >= 0 && pinned < n) {
    used = pinnedWidth;
    visible.push(pinned);
  }

  for (let i = 0; i < n; i++) {
    if (i === pinned) continue;
    const w = widths[i] ?? 0;
    const next = used + (used > 0 ? gap : 0) + w;
    if (next > budget) continue;
    used = next;
    visible.push(i);
  }

  visible.sort((a, b) => a - b);
  const inVisible = new Set(visible);
  const overflow: number[] = [];
  for (let i = 0; i < n; i++) if (!inVisible.has(i)) overflow.push(i);

  return { visible, overflow };
}

/**
 * Scroll-edge state, for fade masks and nudge buttons.
 *
 * `scrollLeft` is negative in RTL in every current engine, so it is taken as
 * an absolute distance-from-start rather than a coordinate. The 1 px slack
 * absorbs fractional device pixels, which otherwise leave a fade permanently
 * visible at the end of a strip that is fully scrolled.
 */
export interface ScrollEdges {
  atStart: boolean;
  atEnd: boolean;
}

export function scrollEdges(
  scrollPos: number,
  scrollSize: number,
  clientSize: number,
): ScrollEdges {
  const max = Math.max(0, scrollSize - clientSize);
  const x = Math.abs(scrollPos);
  if (max <= 1) return { atStart: true, atEnd: true };
  return { atStart: x <= 1, atEnd: x >= max - 1 };
}

/** How far a nudge button should move the strip: most of a page, not all of
 *  it, so the tab at the edge stays visible as an anchor. */
export function nudgeDistance(clientSize: number, direction: 1 | -1, rtl = false): number {
  const magnitude = clientSize * 0.7 * direction;
  return rtl ? -magnitude : magnitude;
}

/**
 * Whether the strip should collapse to a native picker.
 *
 * Driven by the *container* size, never the viewport: tabs inside a 380 px
 * drawer on a 1440 px monitor need exactly the same treatment as tabs on a
 * phone, and a media query cannot see that.
 */
export function shouldCollapse(
  containerWidth: number,
  itemCount: number,
  threshold = 420,
): boolean {
  return itemCount > 2 && containerWidth > 0 && containerWidth < threshold;
}
