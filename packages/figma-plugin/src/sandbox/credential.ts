/**
 * The app key, held where a document cannot carry it.
 *
 * `figma.clientStorage` is per-user and per-plugin on one machine. That is the
 * whole reason it is used rather than the file's plugin data, which would be
 * the obvious place and is the wrong one: plugin data travels with the
 * document, so a token written there ends up in every branch, every duplicate,
 * and every copy handed to an agency — a bearer credential distributed by
 * somebody pressing ⌘D.
 *
 * The sandbox holds it and the iframe spends it. That split is not ideal —
 * the token crosses `postMessage` to reach the half that has `fetch` — but the
 * alternative is storing it in the iframe, where the only durable store is
 * `localStorage` on a Figma-owned origin shared with every other plugin.
 */

import { readOrigin, readToken, type Credential } from "../app";
import type { FigmaClientStorage } from "./api";

const KEY = "ox.credential";

export async function loadCredential(storage: FigmaClientStorage): Promise<Credential | undefined> {
  const raw = await storage.getAsync(KEY).catch(() => undefined);
  if (typeof raw !== "object" || raw === null) return undefined;

  /*
   * Re-validated on the way out, not trusted because we wrote it.
   *
   * The stored shape can predate a change to what is accepted, and a token that
   * no longer matches the prefix is one the app will refuse anyway — better
   * to ask for it again than to send it and report a 404.
   */
  const { origin, token } = raw as { origin?: unknown; token?: unknown };
  const validOrigin = typeof origin === "string" ? readOrigin(origin) : undefined;
  const validToken = typeof token === "string" ? readToken(token) : undefined;
  if (!validOrigin || !validToken) return undefined;

  return { origin: validOrigin, token: validToken };
}

export async function saveCredential(
  storage: FigmaClientStorage,
  credential: Credential,
): Promise<void> {
  await storage.setAsync(KEY, credential);
}

export async function forgetCredential(storage: FigmaClientStorage): Promise<void> {
  await storage.deleteAsync(KEY).catch(() => {});
}
