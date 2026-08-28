"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/chart-accordion/chart-accordion.tsx. Edit that file, not this one.
/**
 * ChartAccordion — the record's sections, readable while closed.
 *
 * `Accordion` will let you build a header that says nothing. This one will not.
 * A section's summary is composed here from a small, closed vocabulary — a
 * status with a severity, a count, a time — so the two rules that matter cannot
 * be forgotten at the call site:
 *
 *   1. **Severity never travels alone.** A rail with no words is colour
 *      carrying meaning, which forced-colors mode discards, monochrome printing
 *      discards, and roughly one in twelve men cannot resolve. Passing
 *      `severity` without `status` is a type error.
 *   2. **A time is a time.** `updatedAt` is rendered from the string the record
 *      holds, at the precision the record holds it, beside its zone. A relative
 *      time alone ("3 hours ago") is not a clinical timestamp.
 *
 * Everything else is `Accordion`, including the access model. The toolbar is
 * here rather than there because expanding a whole chart is a chart-shaped
 * action: it is what makes the record printable and searchable in one press,
 * and it must never expand a section the reader may not have.
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import {
  Accordion,
  type AccordionDensity,
  type AccordionProps,
} from "../../components/accordion/accordion";
import {
  DEFAULT_ACCORDION_LOCALE,
  isWithheld,
  type AccessDescriptor,
  type AccordionHeadingLevel,
  type AccordionItem,
  type AccordionSeverity,
  type DisclosureEvent,
} from "../../lib/accordion-core";

interface ChartSectionBase {
  key: React.Key;
  /** The section's name, as the reader's vocabulary spells it. */
  label: React.ReactNode;
  /** Content. Omitted for a withheld section, which has none. */
  children?: React.ReactNode;
  /**
   * The one fact that would change what the reader does next.
   *
   * Required alongside `severity`, because a coloured rail with nothing beside
   * it is a signal only some readers receive.
   */
  status?: React.ReactNode;
  /** How many things are in here. Rendered beside the status, never instead of it. */
  count?: React.ReactNode;
  /**
   * When this section last changed, as the record spells it.
   *
   * A string rather than a Date: a FHIR `2026-08` means August, and widening it
   * to the first of the month invents a precision nobody recorded.
   */
  updatedAt?: string;
  access?: AccordionItem["access"];
  pinned?: boolean;
}

/**
 * Severity and status travel together or not at all.
 *
 * Enforced in the type rather than at runtime, so the omission is a build
 * failure at the call site instead of a missing signal in a rendered chart.
 */
export type ChartSection =
  | (ChartSectionBase & { severity: AccordionSeverity; status: React.ReactNode })
  | (ChartSectionBase & { severity?: undefined });

export interface ChartAccordionProps extends Omit<
  AccordionProps,
  "items" | "activeKey" | "defaultActiveKey" | "accordion" | "onChange"
> {
  /**
   * The record's sections, in the order the house reads them. Each carries its own summary,
   * severity and access rules.
   */
  sections: readonly ChartSection[];
  /** Open on first render. */
  defaultOpenKeys?: readonly React.Key[];
  /** Fired with the open sections whenever they change. */
  onChange?: (keys: React.Key[]) => void;
  /** Show "Expand all" and "Collapse all". On by default. */
  toolbar?: boolean;
  /** Leading content in the toolbar — usually who the record belongs to. */
  toolbarLabel?: React.ReactNode;
  headingLevel?: AccordionHeadingLevel;
  density?: AccordionDensity;
  onDisclose?: (event: DisclosureEvent) => boolean | Promise<boolean>;
}

const SEVERITY_CLASS: Record<AccordionSeverity, string> = {
  critical: "ox-chip--critical",
  high: "ox-chip--high",
  low: "ox-chip--low",
  normal: "ox-chip--normal",
  unknown: "ox-chip--unknown",
};

/**
 * A severity chip.
 *
 * A literal lookup rather than an interpolated class name: Tailwind resolves
 * classes by scanning source text, so a class assembled at runtime produces no
 * CSS — which on a severity chip silently deletes the signal.
 *
 * This should route through StatusBadge once that component lands, so that
 * critical reads identically here, on a lab result, and on a medication. Until
 * then it uses the same `--ox-badge-*` tokens, which is what makes that a
 * refactor rather than a re-design.
 */
function Chip({ severity, children }: { severity?: AccordionSeverity; children: React.ReactNode }) {
  return (
    <span className={cn("ox-chip", severity ? SEVERITY_CLASS[severity] : undefined)}>
      {children}
    </span>
  );
}

function summaryFor(section: ChartSection): React.ReactNode {
  const parts: React.ReactNode[] = [];

  if (section.status !== undefined && section.status !== null) {
    parts.push(
      <Chip key="status" {...(section.severity ? { severity: section.severity } : {})}>
        {section.status}
      </Chip>,
    );
  }
  if (section.count !== undefined && section.count !== null) {
    parts.push(
      <span key="count" className="ox-chart-accordion__count">
        {section.count}
      </span>,
    );
  }
  if (section.updatedAt) {
    parts.push(
      <time key="time" className="ox-chart-accordion__time" dateTime={section.updatedAt}>
        {section.updatedAt}
      </time>,
    );
  }

  return parts.length ? parts : undefined;
}

export function ChartAccordion({
  sections,
  defaultOpenKeys,
  onChange,
  toolbar = true,
  toolbarLabel,
  headingLevel = 3,
  density = "clinical",
  locale: localeOverride,
  className,
  ...rest
}: ChartAccordionProps) {
  const locale = React.useMemo(
    () => ({ ...DEFAULT_ACCORDION_LOCALE, ...localeOverride }),
    [localeOverride],
  );

  const [openKeys, setOpenKeys] = React.useState<React.Key[]>(() => [...(defaultOpenKeys ?? [])]);

  const commit = React.useCallback(
    (keys: React.Key[]) => {
      setOpenKeys(keys);
      onChange?.(keys);
    },
    [onChange],
  );

  const items = React.useMemo<AccordionItem[]>(
    () =>
      sections.map((section) => {
        const summary = summaryFor(section);
        const base = {
          /*
           * Typed from the target rather than inferred from the source.
           *
           * Both sides declare `React.Key`, but React 19 leaves that alias open
           * for a host to extend, and Next does extend it. Compiled under this
           * repository's config the two agree; compiled under the docs app's,
           * the inferred literal picked up the widened alias and the declared
           * one did not, so building the items failed to typecheck in the only
           * project that renders them. Reading the type off `AccordionItem`
           * makes them the same type by construction, under any host.
           */
          key: section.key as AccordionItem["key"],
          label: section.label,
          ...(summary === undefined ? {} : { summary }),
          ...(section.severity ? { severity: section.severity } : {}),
          ...(section.pinned ? { pinned: section.pinned } : {}),
        };

        // The withheld arm is a separate object literal rather than a spread,
        // so the discriminated union still discriminates: TypeScript cannot see
        // through a conditional spread to know `children` was never set.
        const access = section.access as AccessDescriptor | undefined;
        if (access?.kind === "withheld") {
          return { ...base, access };
        }
        return {
          ...base,
          ...(access ? { access } : {}),
          ...(section.children === undefined ? {} : { children: section.children }),
        };
      }),
    [sections],
  );

  const expandable = React.useMemo(
    () => items.filter((item) => !isWithheld(item)).map((item) => item.key),
    [items],
  );

  return (
    <div className={cn("ox-chart-accordion", className)}>
      {toolbar ? (
        <div className="ox-chart-accordion__toolbar">
          {toolbarLabel ? (
            <span className="ox-chart-accordion__toolbar-label">{toolbarLabel}</span>
          ) : null}
          <span className="ox-chart-accordion__toolbar-actions">
            <button
              type="button"
              className="ox-chart-accordion__action"
              onClick={() => commit([...expandable])}
            >
              {locale.expandAll}
            </button>
            <button type="button" className="ox-chart-accordion__action" onClick={() => commit([])}>
              {locale.collapseAll}
            </button>
          </span>
        </div>
      ) : null}

      <Accordion
        {...rest}
        items={items}
        activeKey={openKeys}
        onChange={commit}
        headingLevel={headingLevel}
        density={density}
        locale={locale}
      />
    </div>
  );
}
