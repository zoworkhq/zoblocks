/**
 * The sandbox half. The only file in this package that touches `figma`.
 *
 * It reads, it measures, it posts the result. It cannot reach the network — the
 * sandbox has no `fetch` at all — and this phase gives it no way to write
 * either: `api.ts` declares only the read calls, so a write would be a compile
 * error rather than a code review someone has to catch.
 */

import { readPluginMessage, type ToUi } from "../protocol";
import { runGate, themeFromModeName } from "../gate";
import { readFile, type ReadResult } from "./read";
import type { FigmaReadApi } from "./api";

/** Figma's global, narrowed to what this plugin holds. */
declare const figma: FigmaReadApi & {
  showUI(html: string, options?: { width?: number; height?: number; themeColors?: boolean }): void;
  ui: {
    postMessage(message: unknown): void;
    onmessage: ((message: unknown) => void) | null;
    resize(width: number, height: number): void;
  };
  notify(message: string): void;
};

declare const __html__: string;

const MIN_WIDTH = 380;
const MIN_HEIGHT = 420;

let cached: ReadResult | undefined;

async function load(): Promise<ReadResult> {
  cached = await readFile(figma);
  return cached;
}

function post(message: ToUi): void {
  figma.ui.postMessage(message);
}

figma.showUI(__html__, { width: MIN_WIDTH, height: MIN_HEIGHT, themeColors: true });

figma.ui.onmessage = (raw: unknown) => {
  const message = readPluginMessage(raw);
  if (!message) return;

  void (async () => {
    try {
      switch (message.type) {
        case "ready": {
          const { collections } = await load();
          post({ type: "collections", collections });
          return;
        }
        case "inspect": {
          /*
           * Re-read rather than reuse the snapshot.
           *
           * A designer changes a colour and presses the panel again expecting
           * the new number. Serving a cached one would report a ratio for a
           * file that no longer exists, which is the single most damaging thing
           * a measuring tool can do.
           */
          const { snapshot } = await load();
          post({
            type: "report",
            report: runGate(snapshot, {
              collection: message.collection,
              figmaMode: message.mode,
              theme: themeFromModeName(message.mode),
              ...(message.ground ? { ground: message.ground } : {}),
              ...(message.kind ? { kind: message.kind } : {}),
            }),
          });
          return;
        }
        case "resize": {
          figma.ui.resize(
            Math.max(MIN_WIDTH, Math.round(message.width)),
            Math.max(MIN_HEIGHT, Math.round(message.height)),
          );
          return;
        }
      }
    } catch (error) {
      post({ type: "error", message: error instanceof Error ? error.message : String(error) });
    }
  })();
};
