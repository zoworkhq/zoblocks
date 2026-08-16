"use client";

/**
 * `Tabs.Panel`.
 *
 * Two rules that most implementations get wrong:
 *
 *   A panel with no focusable content gets `tabIndex={0}` so it can be reached
 *   and scrolled by keyboard. A panel that *has* focusable content must not —
 *   an extra stop before the first control is pure noise. The check runs at
 *   mount and whenever the content changes, because "has a focusable child" is
 *   not a static property of a panel that loads asynchronously.
 *
 *   Panels swap; they never animate height. A height transition over arbitrary
 *   content is a jank generator, and it moves the thing the user is reading.
 */

import * as React from "react";
import { idFor, useTabsContext } from "./context.js";
import { useIsoLayoutEffect } from "./internal.js";

export interface TabsPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  /** Overrides the root's `mount` for this panel alone. */
  mount?: "eager" | "lazy" | "lazy-once";
  /** Keeps the panel in the DOM once mounted, even when hidden. */
  keepMounted?: boolean;
  children?: React.ReactNode;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),summary,audio[controls],video[controls],[contenteditable]:not([contenteditable="false"])';

export const TabsPanel = React.forwardRef<HTMLDivElement, TabsPanelProps>(function TabsPanel(
  { value, mount, keepMounted, className, children, ...rest },
  forwardedRef,
) {
  const ctx = useTabsContext("Tabs.Panel");
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [focusable, setFocusable] = React.useState(false);

  React.useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement);

  const selected = ctx.value === value;
  const strategy = mount ?? ctx.mount;
  const visited = ctx.visited.has(value);

  useIsoLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setFocusable(element.querySelector(FOCUSABLE) !== null);
  }, [selected, children]);

  // Scroll position is restored per panel so switching away and back does not
  // dump the user at the top of a long result list.
  useIsoLayoutEffect(() => {
    const element = ref.current;
    if (!element || !ctx.keepScroll) return;
    if (selected) {
      const saved = ctx.panelScroll.current.get(value);
      if (saved !== undefined) element.scrollTop = saved;
      return;
    }
    ctx.panelScroll.current.set(value, element.scrollTop);
  }, [selected, value, ctx.keepScroll]);

  const shouldRender =
    ctx.roles.ownsPanels &&
    (strategy === "eager" ||
      selected ||
      (strategy === "lazy-once" && visited) ||
      keepMounted === true);

  // Announce the panel's existence to the root so its trigger can point at it.
  // An `aria-controls` that references an element which is not in the DOM is
  // an outright ARIA violation, and lazy panels make that the common case.
  const { registerPanel } = ctx;
  React.useEffect(() => {
    if (!shouldRender) return;
    return registerPanel(value);
  }, [registerPanel, shouldRender, value]);

  if (!shouldRender) return null;

  return (
    <div
      {...rest}
      ref={ref}
      className={["ox-tabs__panel", className].filter(Boolean).join(" ")}
      role="tabpanel"
      id={idFor(ctx.baseId, value, "panel")}
      aria-labelledby={idFor(ctx.baseId, value, "trigger")}
      hidden={!selected}
      tabIndex={selected && !focusable ? 0 : undefined}
      data-ox-panel=""
    >
      {children}
    </div>
  );
});

/** Container for panels. Present so a host can style the region as a whole. */
export const TabsPanels = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function TabsPanels({ className, ...rest }, ref) {
    return (
      <div
        {...rest}
        ref={ref}
        className={["ox-tabs__panels", className].filter(Boolean).join(" ")}
      />
    );
  },
);
