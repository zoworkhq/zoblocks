"use client";

/**
 * `Tabs.Trigger` — one tab, one radio, or one link.
 *
 * Two details here are the difference between a control that works and one
 * that merely looks like it does:
 *
 *   `aria-disabled`, never `disabled`. The attribute removes the element from
 *   the accessibility tree and the tab order, so a keyboard user can never
 *   learn the section exists. In a chart, "no behavioural health tab" and
 *   "behavioural health, restricted" are different clinical facts.
 *
 *   The close affordance is `role="button"` with `tabindex="-1"`, not a
 *   `<button>`. A nested interactive element inside `role="tab"` is invalid;
 *   assistive technology either flattens it or skips it. APG's answer for a
 *   closable tab is Delete/Backspace on the tab itself, which is what the
 *   keyboard model implements.
 */

import * as React from "react";
import { describeTrigger, interpolate, type TabItem } from "@oxygenui-design/tabs-core";
import { idFor, useTabsContext, type TriggerVisuals } from "./context.js";
import { useIsoLayoutEffect } from "./internal.js";

export interface TabsTriggerProps
  extends TriggerVisuals, Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  value: string;
  children?: React.ReactNode;
  /** Needed for typeahead and the overflow menu when `children` is not text. */
  textLabel?: string;
  disabled?: boolean;
  /** Mandatory when `disabled` — announced through `aria-describedby`. */
  disabledReason?: string;
  closable?: boolean;
  /** Only legal when the root is `as="nav"`. */
  href?: string;
  /** Steps only. */
  state?: "done" | "current" | "locked";
}

export const TabsTrigger = React.forwardRef<HTMLElement, TabsTriggerProps>(function TabsTrigger(
  {
    value,
    children,
    textLabel,
    icon,
    count,
    tone,
    dot,
    availability,
    disabled,
    disabledReason,
    closable,
    href,
    state,
    className,
    onClick,
    ...rest
  },
  forwardedRef,
) {
  const ctx = useTabsContext("Tabs.Trigger");
  const elementRef = React.useRef<HTMLElement | null>(null);

  /*
   * Two different fallbacks, on purpose.
   *
   * `declaredText` is what the author actually gave us, and stays undefined
   * when they gave us nothing — otherwise the registry would always carry a
   * text label and the "rich label with no text equivalent" check could never
   * fire, which is the one thing it exists to catch.
   *
   * `resolvedText` is what we render with, and falls back to the value so a
   * close button still has a name and the width reservation still works. A
   * degraded runtime is fine; a check that can never fail is not.
   */
  const declaredText = textLabel ?? (typeof children === "string" ? children : undefined);
  const resolvedText = declaredText ?? value;

  const item = React.useMemo<TabItem>(
    () => ({
      value,
      label: children,
      textLabel: declaredText,
      count,
      tone,
      dot,
      availability,
      disabled,
      disabledReason,
      closable: closable ?? false,
      href,
      state,
    }),
    [
      value,
      children,
      declaredText,
      count,
      tone,
      dot,
      availability,
      disabled,
      disabledReason,
      closable,
      href,
      state,
    ],
  );

  // Registration is a layout effect so the registry is ordered by DOM order
  // before the list measures anything. An effect would let the indicator
  // measure against an empty registry on first paint.
  const itemRef = React.useRef(item);
  itemRef.current = item;
  useIsoLayoutEffect(() => {
    const entry = { value, element: elementRef.current, item: itemRef.current };
    const unregister = ctx.register(entry);
    return unregister;
    // Registering on every item change would reorder the registry; the entry
    // object is mutated in place below instead.
  }, [ctx.register, value]);

  useIsoLayoutEffect(() => {
    const entry = ctx.triggers.current.find((candidate) => candidate.value === value);
    if (entry) {
      entry.item = item;
      entry.element = elementRef.current;
    }
  });

  const selected = ctx.value === value;
  const index = ctx.triggers.current.findIndex((entry) => entry.value === value);
  const reasonId = disabled && disabledReason ? idFor(ctx.baseId, value, "reason") : undefined;

  /*
   * Roving tabindex, computed so that the server-rendered markup is already
   * correct.
   *
   * Deriving it from the registry alone would emit `-1` on every trigger
   * during SSR — the registry is populated by a layout effect, which never
   * runs on the server — leaving the strip with no tab stop at all for anyone
   * who reaches it before hydration. Keying off the selected *value* needs no
   * registry, and the "first item when nothing is selected" fallback keeps the
   * group reachable once the registry does exist.
   */
  const tabIndex = selected ? 0 : ctx.value === undefined && index === 0 ? 0 : -1;

  /*
   * The announced name, composed rather than assembled from nodes.
   *
   * A visually-hidden sibling span cannot produce "Labs, 2 critical": name
   * computation concatenates descendants with a space, so it comes out as
   * "Labs , 2 critical" or "Labs 2 critical" depending on where the comma
   * goes. An explicit `aria-label` is the only way to control the string
   * exactly — and it still satisfies WCAG 2.5.3, because the visible label is
   * a substring of it.
   */
  const supplement = describeTrigger({ count, tone, dot, availability }, ctx.locale);
  /*
   * A rich label also needs the explicit name. `label={<Icon />}` renders an
   * `aria-hidden` glyph and nothing else, so without this the trigger has no
   * accessible name at all — the icon-only view switcher, silently unusable.
   * Validation already requires `textLabel` in exactly that case.
   */
  const needsExplicitName = supplement !== undefined || typeof children !== "string";
  const composedLabel = needsExplicitName
    ? supplement
      ? `${resolvedText}, ${supplement}`
      : resolvedText
    : undefined;

  const setRef = (node: HTMLElement | null) => {
    elementRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    onClick?.(event as React.MouseEvent<HTMLElement, MouseEvent>);
    if (event.defaultPrevented) return;
    if (ctx.pending) return;
    // A modified click on a real link is the browser's to handle: cmd-click
    // opening a new tab is half the reason `as="nav"` renders anchors.
    if (
      ctx.mode === "nav" &&
      (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)
    ) {
      return;
    }
    ctx.select(value, "pointer", item);
  };

  const shared = {
    ref: setRef,
    className: ["ox-tabs__tab", className].filter(Boolean).join(" "),
    "data-ox-tab": "",
    "data-ox-value": value,
    "data-ox-state": state,
    "data-ox-availability": availability,
    "data-ox-selected": selected || undefined,
    onClick: handleClick,
    ...(composedLabel ? { "aria-label": composedLabel } : {}),
    ...(disabled ? { "aria-disabled": true as const } : {}),
    ...(reasonId ? { "aria-describedby": reasonId } : {}),
    ...rest,
  };

  const inner = (
    <>
      {icon ? (
        <span className="ox-tabs__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {/* `data-ox-text` feeds the stylesheet's width reservation: the selected
          state is bolder, and without holding the bold width the trigger grows
          as the indicator animates towards where it used to be. */}
      <span className="ox-tabs__label" data-ox-text={resolvedText}>
        {children}
      </span>
      {typeof count === "number" ? (
        <span className="ox-tabs__count" data-ox-tone={tone} aria-hidden="true">
          {count}
        </span>
      ) : null}
      {dot ? <span className="ox-tabs__dot" data-ox-dot={String(dot)} aria-hidden="true" /> : null}
      {/*
        A pointer affordance, and only that.

        `role="button"` here — or a real `<button>` — puts an interactive
        control inside `role="tab"`, which is invalid ARIA and which assistive
        technology resolves by either flattening the tab or skipping the
        button. axe flags it as `nested-interactive`, correctly.

        The keyboard path is Delete/Backspace on the tab itself, which is what
        APG prescribes and what the keyboard model implements; the affordance
        is therefore `aria-hidden` and carries no name of its own.
      */}
      {closable && ctx.onCloseTab ? (
        <span
          className="ox-tabs__close"
          aria-hidden="true"
          data-ox-close=""
          title={interpolate(ctx.locale.close, { label: resolvedText })}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            ctx.onCloseTab?.(value);
          }}
        >
          ×
        </span>
      ) : null}
      {reasonId ? (
        <span id={reasonId} className="ox-tabs__sr">
          {disabledReason}
        </span>
      ) : null}
    </>
  );

  if (ctx.mode === "nav") {
    return (
      <a
        {...(shared as React.AnchorHTMLAttributes<HTMLAnchorElement> & {
          ref: React.Ref<HTMLAnchorElement>;
        })}
        href={href}
        aria-current={selected ? "page" : undefined}
      >
        {inner}
      </a>
    );
  }

  const roleProps =
    ctx.mode === "radiogroup"
      ? { role: "radio" as const, "aria-checked": selected }
      : {
          role: "tab" as const,
          "aria-selected": selected,
          // Only when the panel is actually in the DOM — see `registerPanel`.
          "aria-controls": ctx.panels.has(value) ? idFor(ctx.baseId, value, "panel") : undefined,
        };

  return (
    <button
      {...(shared as React.ButtonHTMLAttributes<HTMLButtonElement> & {
        ref: React.Ref<HTMLButtonElement>;
      })}
      type="button"
      id={idFor(ctx.baseId, value, "trigger")}
      {...roleProps}
      tabIndex={tabIndex}
    >
      {inner}
    </button>
  );
});
