/**
 * The sandbox half. The only file in this package that touches `figma`.
 *
 * It reads the file, measures it, applies a pull it was handed, and holds the
 * credential. It cannot reach the network — the sandbox has no `fetch` at all —
 * so every request goes through the iframe, which is why the credential crosses
 * `postMessage` on its way to being spent.
 *
 * What it cannot do is worth listing, because each is enforced by `api.ts` not
 * declaring the call rather than by a check somebody could remove: it cannot
 * delete a variable, a mode or a collection; it cannot publish a library; and
 * it cannot decide that something should change — `applyPull` takes a list it
 * did not compute.
 */

import { readPluginMessage, type ToUi } from "../protocol";
import { runGate, themeFromModeName } from "../gate";
import { previewPull } from "../pull";
import { readFile, type ReadResult } from "./read";
import { applyPull, readPin } from "./apply";
import { forgetCredential, loadCredential, saveCredential } from "./credential";
import type { FigmaWriteApi } from "./api";

/** Figma's global, narrowed to what this plugin holds. */
declare const figma: FigmaWriteApi & {
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
const MIN_HEIGHT = 460;

function post(message: ToUi): void {
  figma.ui.postMessage(message);
}

/**
 * Re-read on every request rather than caching.
 *
 * A designer changes a colour and presses the panel again expecting the new
 * number. Serving a cached one reports a ratio for a file that no longer
 * exists, which is the single most damaging thing a measuring tool can do — and
 * the same argument applies to a diff.
 */
async function load(): Promise<ReadResult> {
  return readFile(figma);
}

async function standing(): Promise<ToUi> {
  const [credential, pinned] = await Promise.all([
    loadCredential(figma.clientStorage),
    readPin(figma),
  ]);
  return {
    type: "standing",
    standing: { ...(credential ? { credential } : {}), ...(pinned ? { pinned } : {}) },
  };
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
          post(await standing());
          return;
        }

        case "inspect": {
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

        case "connect": {
          await saveCredential(figma.clientStorage, message.credential);
          post(await standing());
          return;
        }

        case "disconnect": {
          await forgetCredential(figma.clientStorage);
          post(await standing());
          return;
        }

        case "preview": {
          const { snapshot } = await load();
          const pinned = await readPin(figma);
          post({
            type: "preview",
            preview: previewPull(message.payload, snapshot, {
              ...(message.includeComponent ? { includeComponent: true } : {}),
              ...(pinned ? { pinned } : {}),
            }),
          });
          return;
        }

        case "apply": {
          /*
           * The diff is recomputed here, against the file as it is now.
           *
           * The designer agreed to a preview taken a moment ago. Applying that
           * stored decision would overwrite anything they changed since, which
           * is the one way a preview-first flow can still surprise somebody.
           */
          const { snapshot } = await load();
          const preview = previewPull(message.payload, snapshot, {
            ...(message.includeComponent ? { includeComponent: true } : {}),
          });

          const applied = await applyPull(figma, {
            write: [...preview.diff.create, ...preview.diff.update.map((u) => u.variable)],
            pin: { slug: preview.slug, version: preview.version },
          });

          post({ type: "applied", applied });
          figma.notify(
            applied.created + applied.updated === 0
              ? "Already up to date."
              : `${applied.created} created, ${applied.updated} updated.`,
          );
          // The panel's own numbers come next, from the file as it now is.
          post({ type: "collections", collections: (await load()).collections });
          post(await standing());
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
