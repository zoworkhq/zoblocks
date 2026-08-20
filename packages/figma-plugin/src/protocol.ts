/**
 * The messages that cross the two isolated halves of a Figma plugin.
 *
 * The sandbox holds the `figma` API and cannot reach the network; the UI is an
 * iframe with the DOM and no `figma` API. Everything between them goes through
 * `postMessage`, which means every payload here must be structured-cloneable
 * plain data — no class instances, no functions, no `Map`.
 *
 * That constraint is why the types live in their own module rather than being
 * declared beside whichever side happens to send them. One definition, imported
 * by both, is what makes a mismatch a compile error instead of an empty panel.
 */

import type { GateReport, PairKindName } from "./gate";

/** A collection, as the picker needs to show it. */
export interface CollectionSummary {
  id: string;
  name: string;
  /** Figma mode names, in the file's own order. */
  modes: string[];
  /** How many of its variables carry an Oxygen token stamp. */
  stamped: number;
  /**
   * Colour variables in total. The picker states both, because the difference
   * between them is what decides which of the two readings the panel can give.
   */
  colours: number;
}

/** Sandbox → UI. */
export type ToUi =
  | { type: "collections"; collections: CollectionSummary[] }
  | { type: "report"; report: GateReport }
  | { type: "error"; message: string };

/** UI → sandbox. */
export type FromUi =
  | { type: "ready" }
  | {
      type: "inspect";
      collection: string;
      mode: string;
      ground?: string;
      kind?: PairKindName;
    }
  | { type: "resize"; width: number; height: number };

/**
 * Figma wraps every message the UI sends in `{ pluginMessage }`, and delivers
 * it on `window.onmessage`. Narrowing here rather than at each call site keeps
 * the two entry points free of the shape-checking that would otherwise be the
 * only logic in them.
 */
export function readPluginMessage(data: unknown): FromUi | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const message = (data as { pluginMessage?: unknown }).pluginMessage ?? data;
  if (typeof message !== "object" || message === null) return undefined;
  const type = (message as { type?: unknown }).type;
  if (type === "ready" || type === "inspect" || type === "resize") return message as FromUi;
  return undefined;
}

export function readUiMessage(data: unknown): ToUi | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const message = (data as { pluginMessage?: unknown }).pluginMessage ?? data;
  if (typeof message !== "object" || message === null) return undefined;
  const type = (message as { type?: unknown }).type;
  if (type === "collections" || type === "report" || type === "error") return message as ToUi;
  return undefined;
}
