/**
 * Every string the component can utter.
 *
 * Counts and status tones are the reason this file is not optional. A red "2"
 * on a Labs tab is a colour signal, and Zoblocks's rule is that colour is
 * reinforcement and never the signal itself — so the tone travels into the
 * accessible name as a word. "Labs, 2 critical results" is the announcement;
 * "Labs 2" is the bug.
 */

import type { Availability, Tone } from "./types.js";

export interface TabsLocale {
  /** Overflow trigger. `{count}` is substituted. */
  more: string;
  moreWithCount: string;
  /** Announced suffix for a plain count. */
  items: string;
  itemsOne: string;
  /** Announced suffix per tone, in place of `items`. */
  toneCritical: string;
  toneCriticalOne: string;
  toneHigh: string;
  toneHighOne: string;
  toneNormal: string;
  toneNormalOne: string;
  /** Close button label. `{label}` is the tab's text. */
  close: string;
  add: string;
  scrollBack: string;
  scrollForward: string;
  /** Availability, announced after the name. */
  stale: string;
  unavailable: string;
  /** Dot markers. */
  unsaved: string;
  error: string;
  /** Fallback used when a disabled item has no `disabledReason`. */
  unavailableReason: string;
  /** Label for the `<select>` an overflow="collapse" strip becomes. */
  sectionPicker: string;
}

export const DEFAULT_LOCALE: TabsLocale = {
  more: "More",
  moreWithCount: "More, {count} hidden",
  items: "{count} items",
  itemsOne: "1 item",
  toneCritical: "{count} critical",
  toneCriticalOne: "1 critical",
  toneHigh: "{count} abnormal",
  toneHighOne: "1 abnormal",
  toneNormal: "{count} normal",
  toneNormalOne: "1 normal",
  close: "Close {label}",
  add: "Open a new tab",
  scrollBack: "Scroll tabs backward",
  scrollForward: "Scroll tabs forward",
  stale: "showing cached data",
  unavailable: "unavailable",
  unsaved: "unsaved changes",
  error: "failed to load",
  unavailableReason: "This section is not available.",
  sectionPicker: "Section",
};

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * The visually-hidden text that turns a badge into part of the accessible
 * name. Singular forms exist because "1 items" is the kind of detail that
 * makes a product feel unfinished to the people who hear every string.
 */
export function describeCount(
  count: number,
  tone: Tone | undefined,
  locale: TabsLocale = DEFAULT_LOCALE,
): string {
  const one = count === 1;
  switch (tone) {
    case "critical":
      return one ? locale.toneCriticalOne : interpolate(locale.toneCritical, { count });
    case "high":
      return one ? locale.toneHighOne : interpolate(locale.toneHigh, { count });
    case "normal":
      return one ? locale.toneNormalOne : interpolate(locale.toneNormal, { count });
    default:
      return one ? locale.itemsOne : interpolate(locale.items, { count });
  }
}

export function describeAvailability(
  availability: Availability | undefined,
  locale: TabsLocale = DEFAULT_LOCALE,
): string | undefined {
  if (availability === "stale") return locale.stale;
  if (availability === "unavailable") return locale.unavailable;
  return undefined;
}

export function describeDot(
  dot: boolean | "dirty" | "error" | undefined,
  locale: TabsLocale = DEFAULT_LOCALE,
): string | undefined {
  if (dot === "dirty") return locale.unsaved;
  if (dot === "error") return locale.error;
  return undefined;
}

/**
 * The full accessible-name supplement for one trigger, in announcement order.
 *
 * Returned as a single string so the caller renders exactly one
 * visually-hidden node. Several nodes would be announced as several
 * fragments, with pauses that read as separate controls.
 */
export function describeTrigger(
  input: {
    count?: number | undefined;
    tone?: Tone | undefined;
    dot?: boolean | "dirty" | "error" | undefined;
    availability?: Availability | undefined;
  },
  locale: TabsLocale = DEFAULT_LOCALE,
): string | undefined {
  const parts: string[] = [];
  if (typeof input.count === "number") parts.push(describeCount(input.count, input.tone, locale));
  const dot = describeDot(input.dot, locale);
  if (dot) parts.push(dot);
  const availability = describeAvailability(input.availability, locale);
  if (availability) parts.push(availability);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

export function resolveLocale(overrides?: Partial<TabsLocale>): TabsLocale {
  return overrides ? { ...DEFAULT_LOCALE, ...overrides } : DEFAULT_LOCALE;
}
