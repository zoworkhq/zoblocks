/**
 * Which components have a playground, as a plain module.
 *
 * Split out of `playground.tsx` because that file is `"use client"`, and a
 * client module may only hand the server components — calling an ordinary
 * function exported from one throws at render. The page needs this answer
 * while deciding whether to emit the section and its rail entry, which is
 * server work.
 *
 * A component appears here once `playground.tsx` has a renderer for it. The
 * `controls` declaration is not enough on its own: something has to know what
 * a sensible set of items or a sensible value looks like, and that is
 * editorial work rather than something derivable from a type.
 */
export const PLAYGROUND_COMPONENTS: ReadonlySet<string> = new Set([
  "accordion",
  "chart-context-menu",
  "date-picker",
  "data-grid",
  "care-timeline",
  "recorder",
  "clinical-status",
  "tabs",
  "signature",
  "switch",
  "pulse-loader",
  "rhythm-loader",
  "breath-loader",
  "helix-loader",
  "infusion-loader",
  "trend-indicator",
  "care-team-presence",
  "chart-header",
  "provenance-chip",
  "recent-patient-stack",
  "result-value",
  "risk-indicator",
  "chart-accordion",
  "clinical-note",
  "safety-plan",
  "timeline",
  "copilot",
  "chart-command-palette",
]);

export function hasPlayground(name: string): boolean {
  return PLAYGROUND_COMPONENTS.has(name);
}
