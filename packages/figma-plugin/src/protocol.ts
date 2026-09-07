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
import type { Credential, ResolvedPayload } from "./app";
import type { PullPreview } from "./pull";

/** A collection, as the picker needs to show it. */
export interface CollectionSummary {
  id: string;
  name: string;
  /** Figma mode names, in the file's own order. */
  modes: string[];
  /** How many of its variables carry a Zoblocks token stamp. */
  stamped: number;
  /**
   * Colour variables in total. The picker states both, because the difference
   * between them is what decides which of the two readings the panel can give.
   */
  colours: number;
}

/** What the file is pinned to, and the key it would sync with. */
export interface Standing {
  /** Absent until somebody pastes a key. The iframe spends it; it lives here. */
  credential?: Credential;
  /** Absent until this file has been pulled at least once. */
  pinned?: { slug: string; version: number };
}

export interface Applied {
  created: number;
  updated: number;
  /** Clinical variables put back. Named, because these undid somebody's edit. */
  restored: string[];
}

/** Sandbox → UI. */
export type ToUi =
  | { type: "collections"; collections: CollectionSummary[] }
  | { type: "report"; report: GateReport }
  | { type: "standing"; standing: Standing }
  | { type: "preview"; preview: PullPreview }
  | { type: "applied"; applied: Applied }
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
  | { type: "resize"; width: number; height: number }
  | { type: "connect"; credential: Credential }
  | { type: "disconnect" }
  /**
   * Preview a pull. The iframe fetched the payload; the sandbox owns the file.
   *
   * The payload travels rather than the plan, because computing the plan needs
   * only the payload and computing the *diff* needs the file — so the side that
   * holds each does its own half and neither has to be told about the other.
   */
  | { type: "preview"; payload: ResolvedPayload; includeComponent?: boolean }
  /**
   * Apply the pull that was previewed.
   *
   * Carries the payload again rather than a token for a remembered preview. The
   * diff is recomputed against the file as it is *now*, so a designer who
   * changed something between preview and apply gets their change respected
   * rather than silently overwritten by a decision made a minute ago.
   */
  | { type: "apply"; payload: ResolvedPayload; includeComponent?: boolean };

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
  const accepted = ["ready", "inspect", "resize", "connect", "disconnect", "preview", "apply"];
  return accepted.includes(type as string) ? (message as FromUi) : undefined;
}

export function readUiMessage(data: unknown): ToUi | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const message = (data as { pluginMessage?: unknown }).pluginMessage ?? data;
  if (typeof message !== "object" || message === null) return undefined;
  const type = (message as { type?: unknown }).type;
  const accepted = ["collections", "report", "standing", "preview", "applied", "error"];
  return accepted.includes(type as string) ? (message as ToUi) : undefined;
}
