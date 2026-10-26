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
]);

export function hasPlayground(name: string): boolean {
  return PLAYGROUND_COMPONENTS.has(name);
}

/**
 * Playgrounds that draw no host-chrome band above the component.
 *
 * The same reasoning as `NO_CHROME` in component-preview, which decided this
 * for the Preview stage the playground replaced: the loaders are clinical and
 * motion tokens with nothing a toolbar would sit beside, Recorder owns its own
 * transport controls, Data Grid is a whole screen with no room for a band, and
 * Signature brings its own modal and manifest. Everything else is something a
 * reader would place inside a form or toolbar they already own, so it is shown
 * beside the design language's real Button, Input and Tabs.
 *
 * Kept here rather than imported from component-preview: that module carries
 * every gallery scenario and every registry library they render, and the
 * playground should not load all of it to answer a yes-or-no.
 */
const NO_CHROME: ReadonlySet<string> = new Set([
  "pulse-loader",
  "breath-loader",
  "helix-loader",
  "infusion-loader",
  "rhythm-loader",
  "recorder",
  "data-grid",
  "signature",
]);

export function playgroundChrome(name: string): boolean {
  return !NO_CHROME.has(name);
}
