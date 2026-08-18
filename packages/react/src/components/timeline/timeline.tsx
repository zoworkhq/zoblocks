"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/timeline/timeline.tsx. Edit that file, not this one.
/**
 * Timeline — Ant Design v6's Timeline, with the accessibility it does not have.
 *
 * The API is antd's, prop for prop, including the v6 spellings (`title`,
 * `content`, `icon`, `placement`) and the v5 names it still accepts. An
 * existing antd call site migrates by changing one import. There is no
 * dependency on antd: `Timeline` is an ordered list with a rail, and taking a
 * dependency for that would put antd into every consumer of a primitive and
 * end copy-as-source distribution for the whole family.
 *
 * Three divergences, each deliberate and each in `limitations`.
 *
 *   1. **No `current`, and no equivalent.** antd's Timeline is a thin adapter
 *      over `Steps` and hardcodes `current: items.length - 1`, which marks the
 *      last rendered item `process` — and antd's own timeline stylesheet gives
 *      that state a *dotted rail*. On a wizard "the step you are on, and it
 *      continues" is right. On a chronology it is a mark of incompleteness
 *      applied to whichever event happened to be last, and with `reverse` it
 *      lands on the oldest event in the chart. A history has no current step,
 *      so this one does not have the prop.
 *
 *   2. **An accessible name is required**, in the type. antd exposes no way to
 *      name the list — `@rc-component/steps` emits no `role`, no
 *      `aria-current`, no `aria-label` at all — so a page with a care timeline
 *      and an access-history timeline gives a screen-reader user two unnamed
 *      lists.
 *
 *   3. **`role="list"` is stated explicitly.** Safari drops list semantics from
 *      any list with `list-style: none`, and VoiceOver then announces neither
 *      the list nor its item count. The redundant role is the accepted fix;
 *      the HTML validator's complaint about it is wrong here.
 *
 * Styling lives in `styles/oxygen-timeline.css`, installed alongside.
 */

import * as React from "react";
import { cn } from "../../lib/utils";

/** antd v5 accepted physical sides; v6 renamed them to logical ones. */
export type TimelineItemPosition = "left" | "right" | "start" | "end";
export type TimelineItemPlacement = "start" | "end";
export type TimelineMode = TimelineItemPosition | "alternate";
export type TimelineOrientation = "horizontal" | "vertical";
export type TimelineVariant = "filled" | "outlined";

/** antd's four presets, plus any CSS colour. */
export type TimelineColor = "blue" | "red" | "green" | "gray" | (string & {});

/**
 * The parts of the rendered tree a caller may reach, matching Ant Design v6's
 * semantic DOM keys exactly. Same names, same nesting, so a `classNames` object
 * written for antd keeps working.
 */
export type TimelineSlot =
  | "root"
  | "item"
  | "itemWrapper"
  | "itemIcon"
  | "itemSection"
  | "itemHeader"
  | "itemTitle"
  | "itemContent"
  | "itemRail";

export interface TimelineItemType {
  key?: React.Key;
  /** v6 name for the node's heading. */
  title?: React.ReactNode;
  /** v6 name for the node's body. */
  content?: React.ReactNode;
  /** v6 name for the node mark. */
  icon?: React.ReactNode;
  color?: TimelineColor;
  loading?: boolean;
  /** Which side, in `mode="alternate"`. v6 name. */
  placement?: TimelineItemPlacement;
  className?: string;
  style?: React.CSSProperties;
  classNames?: Partial<Record<TimelineSlot, string>>;
  styles?: Partial<Record<TimelineSlot, React.CSSProperties>>;

  /** @deprecated Ant Design v6 renamed this to `title`. Accepted for parity. */
  label?: React.ReactNode;
  /** @deprecated Ant Design v6 renamed this to `content`. Accepted for parity. */
  children?: React.ReactNode;
  /** @deprecated Ant Design v6 renamed this to `icon`. Accepted for parity. */
  dot?: React.ReactNode;
  /** @deprecated Ant Design v6 renamed this to `placement`. Accepted for parity. */
  position?: TimelineItemPosition;
}

interface TimelineOwnProps extends Omit<
  React.HTMLAttributes<HTMLOListElement>,
  "className" | "style" | "children"
> {
  items?: readonly TimelineItemType[];
  /** `<Timeline.Item>` children, as antd v5 wrote them. Accepted for parity. */
  children?: React.ReactNode;
  /** Ant Design v6 resolves an unset value to `start`. So does this. */
  mode?: TimelineMode;
  orientation?: TimelineOrientation;
  variant?: TimelineVariant;
  /** Distance to the centre of the node. A number is a ratio; a string is a length. */
  titleSpan?: string | number;
  reverse?: boolean;
  prefixCls?: string;
  rootClassName?: string;
  className?: string;
  style?: React.CSSProperties;
  classNames?: Partial<Record<TimelineSlot, string>>;
  styles?: Partial<Record<TimelineSlot, React.CSSProperties>>;

  /** @deprecated Ant Design v6 takes a pending item in `items`. Accepted for parity. */
  pending?: React.ReactNode;
  /** @deprecated Ant Design v6 takes `items[].icon`. Accepted for parity. */
  pendingDot?: React.ReactNode;
}

/**
 * One of the two has to be present.
 *
 * Expressed in the type rather than checked at runtime, because an unnamed
 * list is invisible in review, invisible in a rendering test, and obvious to
 * exactly one group of people.
 */
export type TimelineProps = TimelineOwnProps &
  ({ "aria-label": string } | { "aria-labelledby": string });

/**
 * The class names this component renders, spelled out.
 *
 * A literal table rather than interpolation at the call site, for the reason
 * `@oxygenui/no-dynamic-class-name` exists: a class assembled from a variable
 * is invisible to anything that resolves classes by scanning source text, and
 * an unstyled element is a defect that renders perfectly.
 *
 * `prefixCls` is Ant Design's escape hatch and it has to keep working, so
 * `partsFor` rebuilds the table for a caller who supplies one. A caller who
 * changes the prefix is supplying their own stylesheet by definition — the
 * names below are the ones `timeline.css` defines, and they are static there.
 */
const PARTS = {
  root: "ox-timeline",
  item: "ox-timeline__item",
  rail: "ox-timeline__rail",
  node: "ox-timeline__node",
  line: "ox-timeline__line",
  body: "ox-timeline__body",
  section: "ox-timeline__section",
  header: "ox-timeline__header",
  title: "ox-timeline__title",
  content: "ox-timeline__content",
  itemStart: "ox-timeline__item--start",
  itemEnd: "ox-timeline__item--end",
  modeStart: "ox-timeline--start",
  modeEnd: "ox-timeline--end",
  modeAlternate: "ox-timeline--alternate",
  vertical: "ox-timeline--vertical",
  horizontal: "ox-timeline--horizontal",
  outlined: "ox-timeline--outlined",
  filled: "ox-timeline--filled",
} as const;

const DEFAULT_PREFIX = "ox-timeline";

type Parts = typeof PARTS;

function partsFor(prefixCls: string): Parts {
  if (prefixCls === DEFAULT_PREFIX) return PARTS;
  const swap = (value: string) => prefixCls + value.slice(DEFAULT_PREFIX.length);
  return Object.fromEntries(
    Object.entries(PARTS).map(([key, value]) => [key, swap(value)]),
  ) as Parts;
}

const PRESET_COLOR: Readonly<Record<string, string>> = {
  blue: "var(--ox-accent)",
  red: "var(--ox-status-critical)",
  green: "var(--ox-status-normal)",
  gray: "var(--ox-text-subtle)",
};

/** antd v5's physical sides mean the same thing as v6's logical ones. */
function normalizeMode(mode: TimelineMode | undefined): "start" | "end" | "alternate" {
  if (mode === "left") return "start";
  if (mode === "right") return "end";
  if (mode === "start" || mode === "end" || mode === "alternate") return mode;
  return "start";
}

function normalizePlacement(item: TimelineItemType): TimelineItemPlacement | undefined {
  if (item.placement) return item.placement;
  if (item.position === "left" || item.position === "start") return "start";
  if (item.position === "right" || item.position === "end") return "end";
  return undefined;
}

/**
 * `<Timeline.Item>` children, read into the `items` shape.
 *
 * antd's own `Timeline.Item` is a no-op function whose props are harvested by
 * the parent; this does the same thing, so children and `items` produce an
 * identical tree.
 */
function itemsFromChildren(children: React.ReactNode): TimelineItemType[] {
  const collected: TimelineItemType[] = [];
  React.Children.forEach(children, (child, index) => {
    if (!React.isValidElement(child)) return;
    const props = child.props as TimelineItemType;
    collected.push({ ...props, key: child.key ?? props.key ?? index });
  });
  return collected;
}

/**
 * A node with nothing else to show. Not a status: purely the default mark.
 */
function DefaultIcon() {
  return (
    <span
      aria-hidden="true"
      style={{
        inlineSize: "0.4375rem",
        blockSize: "0.4375rem",
        borderRadius: "var(--ox-radius-full)",
        background: "currentColor",
        display: "block",
      }}
    />
  );
}

/**
 * The item type. Renders nothing itself — its props are harvested by the
 * parent, exactly as Ant Design's own `Timeline.Item` works.
 */
const TimelineItem: React.FC<TimelineItemType> = () => null;
TimelineItem.displayName = "Timeline.Item";

function TimelineRoot({ ref, ...props }: TimelineProps & { ref?: React.Ref<HTMLOListElement> }) {
  const {
    items,
    children,
    mode,
    orientation = "vertical",
    variant = "outlined",
    titleSpan,
    reverse = false,
    prefixCls = "ox-timeline",
    rootClassName,
    className,
    style,
    classNames: slotClassNames,
    styles: slotStyles,
    pending,
    pendingDot,
    ...rest
  } = props;

  const resolvedMode = normalizeMode(mode);
  const parts = partsFor(prefixCls);

  const resolved = React.useMemo(() => {
    const base = items && items.length > 0 ? [...items] : itemsFromChildren(children);
    if (pending !== undefined && pending !== false) {
      base.push({
        key: "__pending__",
        content: pending === true ? undefined : pending,
        icon: pendingDot,
        loading: true,
      });
    }
    return reverse ? base.reverse() : base;
  }, [items, children, pending, pendingDot, reverse]);

  const rootStyle: React.CSSProperties = { ...slotStyles?.root, ...style };
  if (titleSpan !== undefined) {
    (rootStyle as Record<string, string | number>)["--ox-timeline-title-span"] =
      typeof titleSpan === "number" ? `${titleSpan}` : titleSpan;
  }

  return (
    <ol
      {...rest}
      ref={ref}
      role="list"
      data-ox-timeline=""
      data-ox-mode={resolvedMode}
      data-ox-orientation={orientation}
      data-ox-variant={variant}
      className={cn(
        parts.root,
        resolvedMode === "alternate"
          ? parts.modeAlternate
          : resolvedMode === "end"
            ? parts.modeEnd
            : parts.modeStart,
        orientation === "horizontal" ? parts.horizontal : parts.vertical,
        variant === "filled" ? parts.filled : parts.outlined,
        slotClassNames?.root,
        rootClassName,
        className,
      )}
      style={rootStyle}
    >
      {resolved.map((item, index) => {
        const placement =
          normalizePlacement(item) ??
          (resolvedMode === "alternate" && index % 2 === 1 ? "start" : "end");
        const title = item.title ?? item.label;
        const content = item.content ?? item.children;
        const icon = item.icon ?? item.dot;
        const color = item.color ? (PRESET_COLOR[item.color] ?? item.color) : undefined;

        return (
          <li
            key={item.key ?? index}
            className={cn(
              parts.item,
              placement === "start" ? parts.itemStart : parts.itemEnd,
              slotClassNames?.item,
              item.classNames?.item,
              item.className,
            )}
            style={{ ...slotStyles?.item, ...item.styles?.item, ...item.style }}
          >
            <span
              className={cn(parts.rail, slotClassNames?.itemRail, item.classNames?.itemRail)}
              style={{ ...slotStyles?.itemRail, ...item.styles?.itemRail }}
            >
              <span
                className={cn(parts.node, slotClassNames?.itemIcon, item.classNames?.itemIcon)}
                style={{
                  ...slotStyles?.itemIcon,
                  ...item.styles?.itemIcon,
                  ...(color ? { color, borderColor: color } : undefined),
                }}
                data-loading={item.loading ? "" : undefined}
              >
                {icon ?? <DefaultIcon />}
              </span>
              <span className={parts.line} />
            </span>

            <div
              className={cn(parts.body, slotClassNames?.itemWrapper, item.classNames?.itemWrapper)}
              style={{ ...slotStyles?.itemWrapper, ...item.styles?.itemWrapper }}
            >
              <div
                className={cn(
                  parts.section,
                  slotClassNames?.itemSection,
                  item.classNames?.itemSection,
                )}
                style={{ ...slotStyles?.itemSection, ...item.styles?.itemSection }}
              >
                {title === undefined ? null : (
                  <div
                    className={cn(
                      parts.header,
                      slotClassNames?.itemHeader,
                      item.classNames?.itemHeader,
                    )}
                    style={{ ...slotStyles?.itemHeader, ...item.styles?.itemHeader }}
                  >
                    <div
                      className={cn(
                        parts.title,
                        slotClassNames?.itemTitle,
                        item.classNames?.itemTitle,
                      )}
                      style={{ ...slotStyles?.itemTitle, ...item.styles?.itemTitle }}
                    >
                      {title}
                    </div>
                  </div>
                )}
                {content === undefined ? null : (
                  <div
                    className={cn(
                      parts.content,
                      slotClassNames?.itemContent,
                      item.classNames?.itemContent,
                    )}
                    style={{ ...slotStyles?.itemContent, ...item.styles?.itemContent }}
                  >
                    {content}
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

TimelineRoot.displayName = "Timeline";

export const Timeline = Object.assign(TimelineRoot, { Item: TimelineItem });
