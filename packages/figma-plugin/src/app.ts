/**
 * The app's API, as plain data in and plain data out.
 *
 * `fetch` is injected rather than imported. Only the UI iframe has networking —
 * the sandbox has none at all — and a module that reached for a global would be
 * a module that cannot be tested and cannot be reasoned about from the sandbox
 * side of the boundary. Passing it in makes both true.
 *
 * Every call returns a result rather than throwing. A network failure inside a
 * design tool is ordinary: the laptop is on a train, the token expired, the
 * app is deploying. Those are three different sentences for a designer and
 * an exception collapses them into one.
 */

import type { ThemeName } from "@oxygenui-design/figma-core";

export interface ThemeSummary {
  slug: string;
  name: string;
  status: string;
  liveVersion: number | null;
  updatedAt: string;
}

export interface ValidationRecord {
  validatedAt: string;
  validatorVersion: string;
  contrastPairs: { checked: number; failed: number };
  themes: string[];
}

export interface ResolvedPayload {
  slug: string;
  name: string;
  version: number;
  status: "published" | "draft";
  ramp: Record<string, string>;
  semantic: Record<ThemeName, Record<string, string>>;
  locked: Record<string, string>;
  validation?: ValidationRecord;
}

export interface Proposal {
  slug: string;
  anchor: string;
  steps: number;
  url: string;
}

export type Outcome<T> =
  { ok: true; value: T } | { ok: false; error: string; detail?: string[]; status?: number };

export interface Credential {
  /** Origin only — `https://app.oxygenui.design`. No path. */
  origin: string;
  token: string;
}

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * A refusal a designer can act on.
 *
 * The status codes are the app's own vocabulary and each means something
 * different to the person reading it: 401 is "you have not connected", 404 is
 * "this key does not reach that", 403 is "your key's role is not enough", 422
 * is "the gate measured it and said no". Collapsing them into "request failed"
 * would make three fixable problems look like one unfixable one.
 */
async function readError(response: Response): Promise<Outcome<never>> {
  let body: { error?: unknown; detail?: unknown } = {};
  try {
    body = (await response.json()) as typeof body;
  } catch {
    // A proxy or an outage returns HTML. The status is still the useful part.
  }

  const error =
    typeof body.error === "string"
      ? body.error
      : response.status === 401
        ? "This plugin is not connected. Paste a Figma key from the app."
        : response.status === 404
          ? "Not found — or this key does not reach it."
          : `The app answered ${response.status}.`;

  const detail = Array.isArray(body.detail) ? body.detail.filter(isString) : undefined;
  return { ok: false, error, status: response.status, ...(detail ? { detail } : {}) };
}

const isString = (v: unknown): v is string => typeof v === "string";

async function call<T>(
  fetcher: Fetcher,
  credential: Credential,
  path: string,
  init?: RequestInit,
): Promise<Outcome<T>> {
  let response: Response;
  try {
    response = await fetcher(`${credential.origin}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${credential.token}`,
        ...(init?.body ? { "content-type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    /*
     * Named as reachability rather than as a failure.
     *
     * The plugin's manifest lists exactly one domain, so the two things that
     * produce this are an offline laptop and an app origin that is not the
     * one allowed. Both are the designer's to fix and neither is obvious from
     * "request failed".
     */
    return { ok: false, error: `Could not reach ${credential.origin}.` };
  }

  if (!response.ok) return readError(response);

  try {
    return { ok: true, value: (await response.json()) as T };
  } catch {
    return { ok: false, error: "The app sent something that is not JSON." };
  }
}

export function appApi(fetcher: Fetcher, credential: Credential) {
  return {
    themes: () =>
      call<{ themes: ThemeSummary[] }>(fetcher, credential, "/api/v1/themes").then((r) =>
        r.ok ? ({ ok: true, value: r.value.themes } as Outcome<ThemeSummary[]>) : r,
      ),

    resolved: (slug: string, version?: number) =>
      call<ResolvedPayload>(
        fetcher,
        credential,
        `/api/v1/themes/${encodeURIComponent(slug)}/resolved${
          version === undefined ? "" : `?version=${version}`
        }`,
      ),

    /** Proposes a brand anchor. Writes a draft; there is no publish call. */
    propose: (slug: string, anchor: string) =>
      call<Proposal>(fetcher, credential, `/api/v1/themes/${encodeURIComponent(slug)}/draft`, {
        method: "POST",
        body: JSON.stringify({ anchor }),
      }),
  };
}

export type AppApi = ReturnType<typeof appApi>;

/**
 * An origin, or nothing.
 *
 * The manifest allows one domain, so a typo here fails at the network layer
 * with a message about reachability rather than about the address. Checking the
 * shape at the point somebody types it turns that into a correction.
 */
export function readOrigin(raw: string): string | undefined {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.hostname !== "localhost") return undefined;
    if (url.pathname !== "/" && url.pathname !== "") return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

/** Prefixed, so a mistyped paste is caught before a round trip. */
export function readToken(raw: string): string | undefined {
  const trimmed = raw.trim();
  return /^oxy_live_[\w-]{20,}$/.test(trimmed) ? trimmed : undefined;
}
