"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/accordion/accordion.tsx. Edit that file, not this one.
/**
 * Accordion — a disclosure widget that can be read while it is closed.
 *
 * The generic accordion assumes hidden means unneeded. In a clinical record it
 * does not: what is collapsed may be a suicide-risk item, a safety plan, or a
 * substance-use section governed by a different rule than the chart around it.
 * Three things follow, and they are the whole component.
 *
 *   1. **The header is a summary, not a label.** `summary` renders beside the
 *      label while closed, and `severity` paints a rail down the leading edge.
 *      If collapsing a section could change what the reader does next, the
 *      header carries the fact that would change it.
 *   2. **Expanding is not disclosing.** A gated item opens to an explanation
 *      and keeps its content behind `onDisclose`. See lib/oxygen-accordion.
 *   3. **Withheld is a value.** A section this reader cannot obtain still gets a
 *      row that says so, because deleting it claims the record is complete.
 *
 * The API is Ant Design's `Collapse`, prop for prop, including the v6 names
 * (`expandIconPlacement`, `size="medium"`, `destroyOnHidden`). One deviation is
 * deliberate and is a bug fix rather than a preference: antd's `accordion`
 * boolean switches the emitted markup from a disclosure widget to
 * `role="tablist"`/`tab`/`tabpanel`, so a prop that means "one open at a time"
 * silently changes the accessibility contract. Here it changes the state policy
 * and nothing else. The markup is identical in every configuration.
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import {
  DEFAULT_ACCORDION_LOCALE,
  accessOf,
  useAccordion,
  type AccessDescriptor,
  type AccessReason,
  type GatedAccess,
  type AccordionHeadingLevel,
  type AccordionItem,
  type AccordionLocale,
  type AccordionPanelRole,
  type AccordionPolicyName,
  type AccordionSlot,
  type AccordionVars,
  type DisclosureEvent,
} from "../../lib/accordion-core";

export type AccordionVariant = "bordered" | "separate" | "ghost";
export type AccordionSize = "small" | "medium" | "large";
export type AccordionDensity = "patient" | "standard" | "clinical";

export interface AccordionProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "children" | "defaultValue"
> {
  /** The sections. Extends Ant Design's `ItemType` with `summary`, `severity`, `pinned` and `access`. */
  items: readonly AccordionItem[];

  /* -- Ant Design's surface, unchanged ------------------------------- */

  /** Open sections, controlled. */
  activeKey?: React.Key | readonly React.Key[];
  /** Open sections on first render, uncontrolled. */
  defaultActiveKey?: React.Key | readonly React.Key[];
  /** Fires with every open key, always as an array — including in single mode. */
  onChange?: (keys: React.Key[]) => void;
  /**
   * One section open at a time.
   *
   * Ant Design's name, kept for familiarity. Unlike antd it changes only the
   * state policy; the roles, heading and region wiring are identical either way.
   */
  accordion?: boolean;
  /** Draw the container border. */
  bordered?: boolean;
  /** Transparent, borderless, no header fill. */
  ghost?: boolean;
  /** Which part of the header activates the section. */
  collapsible?: "header" | "icon" | "disabled";
  /** Ant Design v6 naming — `middle` was renamed in v6. */
  size?: AccordionSize;
  /** Replace the chevron. Receives the item and whether it is open. */
  expandIcon?: (props: { item: AccordionItem; isOpen: boolean }) => React.ReactNode;
  /** Ant Design v6 naming — `expandIconPosition` was renamed in v6. */
  expandIconPlacement?: "start" | "end";
  /** Unmount a section's content when it closes. Ant Design v6 naming. */
  destroyOnHidden?: boolean;
  /** Per-slot class names, matching Ant Design v6's semantic DOM. */
  classNames?: Partial<Record<AccordionSlot, string>>;
  /** Per-slot inline styles, matching Ant Design v6's semantic DOM. */
  styles?: Partial<Record<AccordionSlot, React.CSSProperties>>;

  /* -- Oxygen additions ---------------------------------------------- */

  /**
   * Heading level for every trigger.
   *
   * Required at a nesting boundary and not knowable by the component. For a
   * screen-reader user the heading list is the chart's table of contents, and a
   * nested accordion that hardcodes its level flattens it silently.
   */
  headingLevel?: AccordionHeadingLevel;
  /** Overrides any inherited `data-ox-density`. */
  density?: AccordionDensity;
  /** Container shape. `separate` gives each section its own card. */
  variant?: AccordionVariant;
  /**
   * Make collapsed content reachable by find-in-page and fragment navigation.
   *
   * On by default. Turning it off is a decision to make Ctrl+F miss content the
   * record contains.
   */
  findable?: boolean;
  /** Expand every permitted section for printing. Never a withheld one. */
  printExpanded?: boolean;
  /**
   * `region` landmarks on panels.
   *
   * `auto` follows APG: the landmark up to six simultaneously-openable sections,
   * omitted above that, where a landmark list stops being navigation.
   */
  panelRole?: AccordionPanelRole;
  /** Called when a reader asks to see gated content. Resolve false to refuse. */
  onDisclose?: (event: DisclosureEvent) => boolean | Promise<boolean>;
  /** Replaces the built-in wording. Patient and clinician catalogs are separate. */
  locale?: Partial<AccordionLocale>;
  /** Injectable clock for the disclosure timestamp. Defaults to now, ISO 8601. */
  now?: () => string;
}

const SIZE_FONT: Record<AccordionSize, string> = {
  small: "var(--ox-text-sm)",
  medium: "var(--ox-accordion-font)",
  large: "var(--ox-text-md)",
};

function Chevron() {
  return (
    <svg
      className="ox-accordion__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * The gate's own copy, chosen by access kind.
 *
 * Takes `GatedAccess` rather than the full union on purpose.
 *
 * `open` and `withheld` have no gate to title, and `Gate` has already returned
 * null for both by the time this is called. Narrowing the parameter is what
 * lets the switch be exhaustive: a fifth gate kind becomes a type error here
 * instead of falling through a `default` that silently renders an empty
 * heading — which would look like a rendering glitch rather than a missing case.
 */
function gateTitle(access: GatedAccess, locale: AccordionLocale): string {
  switch (access.kind) {
    case "advisory":
      return access.notice;
    // Falls back to its own heading rather than to `recorded`, which is already
    // rendered as the note underneath — saying the same sentence twice reads as
    // a rendering bug and spends the reader's attention on nothing.
    case "reason":
      return access.notice ?? locale.reasonTitle;
    case "consent":
      return access.state === "granted"
        ? locale.consentGranted
        : access.state === "expired"
          ? locale.consentExpired
          : locale.consentMissing;
  }
}

/**
 * What stands between the reader and the content, rendered as content.
 *
 * A gate is not a lock screen. It states the policy, says whether opening is
 * recorded, and offers the action — so a reader who cannot proceed still learns
 * why, and one who can does not have to guess what they are agreeing to.
 */
function Gate({
  access,
  locale,
  pending,
  refused,
  onConfirm,
}: {
  access: AccessDescriptor;
  locale: AccordionLocale;
  pending: boolean;
  refused: boolean;
  onConfirm: (reasonCode?: string) => void;
}) {
  const reasons: readonly AccessReason[] = access.kind === "reason" ? access.reasons : [];
  const [reasonCode, setReasonCode] = React.useState(reasons[0]?.code ?? "");
  const selectId = React.useId();

  if (access.kind === "open" || access.kind === "withheld") return null;

  const consentGranted = access.kind === "consent" && access.state === "granted";
  const confirmLabel =
    access.kind === "advisory"
      ? locale.advisoryConfirm
      : access.kind === "reason"
        ? locale.reasonConfirm
        : consentGranted
          ? locale.consentOpen
          : locale.consentRequest;

  return (
    <div className="ox-accordion__gate" data-kind={access.kind}>
      <p className="ox-accordion__gate-title">{gateTitle(access, locale)}</p>

      {access.kind === "consent" ? (
        <p className="ox-accordion__gate-note">
          {access.policy}
          {access.expiresAt ? ` · ${locale.consentExpires(access.expiresAt)}` : ""}
        </p>
      ) : null}

      {access.kind === "reason" || (access.kind === "consent" && consentGranted) ? (
        <p className="ox-accordion__gate-note">{locale.recorded}</p>
      ) : null}

      {access.kind === "reason" && reasons.length > 0 ? (
        <>
          <label className="ox-accordion__gate-reasons" htmlFor={selectId}>
            {locale.reasonLegend}
          </label>
          <select
            id={selectId}
            className="ox-accordion__gate-select"
            value={reasonCode}
            onChange={(event) => setReasonCode(event.target.value)}
          >
            {reasons.map((reason) => (
              <option key={reason.code} value={reason.code}>
                {reason.label}
              </option>
            ))}
          </select>
        </>
      ) : null}

      <div className="ox-accordion__gate-actions">
        <button
          type="button"
          className="ox-accordion__gate-confirm"
          disabled={pending}
          onClick={() => onConfirm(access.kind === "reason" ? reasonCode : undefined)}
        >
          {pending ? locale.working : confirmLabel}
        </button>
      </div>

      {refused ? (
        <p className="ox-accordion__gate-refused" role="status">
          {locale.refused}
        </p>
      ) : null}
    </div>
  );
}

export function Accordion({
  items,
  activeKey,
  defaultActiveKey,
  onChange,
  accordion = false,
  bordered = true,
  ghost = false,
  collapsible,
  size = "medium",
  expandIcon,
  expandIconPlacement = "start",
  destroyOnHidden = false,
  classNames,
  styles,
  headingLevel = 3,
  density,
  variant,
  findable = true,
  printExpanded = true,
  panelRole = "auto",
  onDisclose,
  locale: localeOverride,
  now,
  className,
  style,
  ...rest
}: AccordionProps) {
  const locale = React.useMemo(
    () => ({ ...DEFAULT_ACCORDION_LOCALE, ...localeOverride }),
    [localeOverride],
  );

  const policy: AccordionPolicyName = accordion ? "single" : "multiple";

  const resolvedVariant: AccordionVariant = variant ?? (ghost ? "ghost" : "bordered");

  const rootRef = React.useRef<HTMLDivElement | null>(null);

  /**
   * The accordion-level `collapsible` is folded into each item before the hook
   * sees it.
   *
   * The behaviour layer reasons about items, not about the component's props —
   * that is what keeps it usable by someone who rebuilt the visuals. So an
   * accordion-wide `collapsible="disabled"` has to arrive as a property of
   * every item, or the hook has no way to know about it.
   *
   * Without this the trigger rendered `aria-disabled="true"` and still toggled:
   * a control that announces itself disabled and then works is worse than one
   * that is plainly enabled, because a screen-reader user is told not to bother
   * with a section that would in fact have opened.
   */
  const resolvedItems = React.useMemo<readonly AccordionItem[]>(
    () =>
      collapsible === undefined
        ? items
        : items.map((item) =>
            item.collapsible === undefined ? ({ ...item, collapsible } as AccordionItem) : item,
          ),
    [collapsible, items],
  );

  const api = useAccordion({
    items: resolvedItems,
    policy,
    ...(activeKey === undefined ? {} : { activeKey }),
    ...(defaultActiveKey === undefined ? {} : { defaultActiveKey }),
    ...(onChange ? { onChange } : {}),
    headingLevel,
    panelRole,
    findable,
    ...(onDisclose ? { onDisclose } : {}),
    ...(now ? { now } : {}),
  });

  /** Content mounted once and kept, unless the caller asked for the opposite. */
  const [everOpened, setEverOpened] = React.useState<Set<React.Key>>(() => new Set());
  React.useEffect(() => {
    setEverOpened((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const key of api.openKeys) {
        if (!next.has(key)) {
          next.add(key);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [api.openKeys]);

  /**
   * Printing must reach content the UA has skipped.
   *
   * `content-visibility: hidden` cannot be undone from a print stylesheet for a
   * subtree the browser has already declined to render, so the attribute comes
   * off in JavaScript before the print dialog and goes back after. Withheld
   * sections are excluded — there is nothing behind them.
   */
  React.useEffect(() => {
    if (!printExpanded || typeof window === "undefined") return;

    let restored: Element[] = [];

    const onBefore = () => {
      const root = rootRef.current;
      if (!root) return;
      // Only sections this reader may actually have: `data-print-expanded` is
      // false for withheld items, and a gate is not content worth printing.
      restored = [
        ...root.querySelectorAll(
          ':scope > [data-print-expanded="true"] > .ox-accordion__panel[hidden]',
        ),
      ];
      for (const node of restored) node.removeAttribute("hidden");
    };

    const onAfter = () => {
      for (const node of restored) node.setAttribute("hidden", "until-found");
      restored = [];
    };

    window.addEventListener("beforeprint", onBefore);
    window.addEventListener("afterprint", onAfter);
    return () => {
      window.removeEventListener("beforeprint", onBefore);
      window.removeEventListener("afterprint", onAfter);
    };
  }, [printExpanded]);

  const rootStyle: AccordionVars = {
    ...styles?.root,
    ...style,
    "--ox-accordion-font": SIZE_FONT[size],
  };

  return (
    <div
      {...rest}
      ref={rootRef}
      className={cn("ox-accordion", classNames?.root, className)}
      style={rootStyle}
      // The root marker every Oxygen component carries, matching the loaders'
      // `data-ox-loader`. It is what a test, a VRT fixture or a host stylesheet
      // uses to find the component without depending on a class name that
      // customisation is explicitly allowed to replace.
      data-ox-accordion=""
      data-variant={resolvedVariant}
      data-bordered={bordered ? "true" : "false"}
      data-icon-placement={expandIconPlacement}
      {...(density ? { "data-ox-density": density } : {})}
    >
      {resolvedItems.map((item) => {
        const access = accessOf(item);
        const open = api.isOpen(item.key);
        const disclosed = api.isDisclosed(item.key);
        const withheld = access.kind === "withheld";
        const showArrow = item.showArrow !== false && !withheld;
        const effectiveCollapsible = item.collapsible ?? collapsible;

        const triggerProps = api.getTriggerProps(item);
        const panelProps = api.getPanelProps(item);
        const Heading = `h${api.headingLevel}` as "h3";

        const mount =
          item.forceRender === true ||
          open ||
          (!destroyOnHidden && everOpened.has(item.key) && !withheld);

        const body = withheld ? null : disclosed ? (
          item.children
        ) : (
          <Gate
            access={access}
            locale={locale}
            pending={api.isPending(item.key)}
            refused={api.isRefused(item.key)}
            onConfirm={(reasonCode) => {
              void api.requestDisclosure(item.key, reasonCode);
            }}
          />
        );

        return (
          <div
            key={item.key}
            className={cn("ox-accordion__item", item.classNames?.item, classNames?.item)}
            style={{ ...styles?.item, ...item.styles?.item }}
            data-open={open ? "true" : "false"}
            data-access={access.kind}
            data-print-expanded={printExpanded && !withheld ? "true" : "false"}
            {...(item.severity ? { "data-severity": item.severity } : {})}
            {...(item.pinned ? { "data-pinned": "true" } : {})}
          >
            <Heading
              className={cn("ox-accordion__heading", classNames?.header, item.classNames?.header)}
              style={{ ...styles?.header, ...item.styles?.header }}
            >
              <button
                {...triggerProps}
                className={cn(
                  "ox-accordion__trigger",
                  classNames?.trigger,
                  item.classNames?.trigger,
                )}
                style={{ ...styles?.trigger, ...item.styles?.trigger }}
                {...(effectiveCollapsible === "disabled" ? { "aria-disabled": true } : {})}
              >
                {showArrow ? expandIcon ? expandIcon({ item, isOpen: open }) : <Chevron /> : null}

                <span
                  className={cn("ox-accordion__label", classNames?.label, item.classNames?.label)}
                  style={{ ...styles?.label, ...item.styles?.label }}
                >
                  {item.label}
                </span>

                <span className="ox-accordion__spacer" />

                {item.summary || withheld || item.pinned ? (
                  <span
                    className={cn(
                      "ox-accordion__summary",
                      classNames?.summary,
                      item.classNames?.summary,
                    )}
                    style={{ ...styles?.summary, ...item.styles?.summary }}
                  >
                    {item.summary}
                    {/* Stated in words, because the rail and the cursor both
                        disappear in forced-colors mode and on paper. */}
                    {withheld ? <span>{locale.withheldLabel}</span> : null}
                    {item.pinned && !item.summary ? <span>{locale.pinnedHint}</span> : null}
                  </span>
                ) : null}
              </button>
            </Heading>

            {item.extra ? <div className="ox-accordion__extra">{item.extra}</div> : null}

            <div
              {...panelProps}
              className={cn("ox-accordion__panel", classNames?.panel, item.classNames?.panel)}
              style={{ ...styles?.panel, ...item.styles?.panel }}
            >
              <div className="ox-accordion__body">
                <div
                  className={cn("ox-accordion__inner", classNames?.body, item.classNames?.body)}
                  style={{ ...styles?.body, ...item.styles?.body }}
                >
                  {withheld ? (
                    <p className="ox-accordion__withheld-reason">{access.reason}</p>
                  ) : mount ? (
                    body
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Disclosure                                                          */
/* ------------------------------------------------------------------ */

export interface DisclosureProps extends Omit<AccordionProps, "items" | "accordion" | "onChange"> {
  /** The section. Same shape as an accordion item. */
  item: AccordionItem;
  /** Open, controlled. */
  open?: boolean;
  /** Open on first render, uncontrolled. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * One section, standing alone.
 *
 * A separate component rather than an accordion of length one, because the two
 * are different things to a reader: a lone disclosure has no siblings to arrow
 * between and no landmark-count question. React Aria draws the same line, and
 * the ARIA vocabulary already has both words.
 */
export function Disclosure({ item, open, defaultOpen, onOpenChange, ...rest }: DisclosureProps) {
  const items = React.useMemo(() => [item], [item]);

  return (
    <Accordion
      {...rest}
      items={items}
      {...(open === undefined ? {} : { activeKey: open ? [item.key] : [] })}
      {...(defaultOpen ? { defaultActiveKey: [item.key] } : {})}
      onChange={(keys) => onOpenChange?.(keys.includes(item.key))}
    />
  );
}
