/**
 * Which design language the component previews render in.
 *
 * A second axis, not a second theme. Light/dark is a colour mode and lives in
 * `theme.ts`; this is which UI framework's components and tokens the demo
 * uses. Three by two is six states, and folding them into one control would
 * make four of them unreachable.
 *
 * Held in a module-level store rather than React context because the control
 * and the preview are in different subtrees of a server-rendered page — the
 * switch sits in the component header, the preview is most of a screen below
 * it — and threading a provider around both would mean turning the whole
 * route into a client component to move a radio button.
 *
 * Persisted the same way the theme is, and for the same reason: a cookie so
 * the choice survives the hop to the app on another origin, with
 * `localStorage` alongside it so a test can set the value before first paint.
 */

import * as React from "react";
import type { HostId } from "@zoblocks/host-react";

export type DesignLanguage = HostId;

export const LANGUAGE_COOKIE = "zoblocks-language";
export const LANGUAGE_STORAGE_KEY = "zoblocks-language";
export const LANGUAGE_PARAM = "lang";

/** A year, matching the theme cookie. */
const MAX_AGE = 60 * 60 * 24 * 365;

const VALID: readonly string[] = ["zoblocks", "antd", "mui"];

function isLanguage(value: string | null | undefined): value is DesignLanguage {
  return typeof value === "string" && VALID.includes(value);
}

function cookieDomain(): string {
  const host = location.hostname;
  return host === "zoblocks.design" || host.endsWith(".zoblocks.design")
    ? "; domain=.zoblocks.design"
    : "";
}

/**
 * Precedence: the URL, then the cookie, then storage, then Zoblocks.
 *
 * The query parameter wins so a link can pin a language — a support reply
 * showing a customer their own framework is the case this exists for, and it
 * must not be overridden by whatever that reader happened to click last.
 */
export function readStoredLanguage(): DesignLanguage {
  try {
    const fromUrl = new URLSearchParams(location.search).get(LANGUAGE_PARAM);
    if (isLanguage(fromUrl)) return fromUrl;

    const match = document.cookie.match(/(?:^|;\s*)zoblocks-language=([^;]*)/);
    const fromCookie = match?.[1] === undefined ? null : decodeURIComponent(match[1]);
    if (isLanguage(fromCookie)) return fromCookie;

    const fromStorage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(fromStorage)) return fromStorage;
  } catch {
    /* Private mode, or a browser refusing storage. Zoblocks is a safe default. */
  }
  return "zoblocks";
}

/* ------------------------------------------------------------------ */
/* The store                                                           */
/* ------------------------------------------------------------------ */

let current: DesignLanguage = "zoblocks";
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  // The first subscriber reads what was stored. Deferring it to here rather
  // than doing it at module scope keeps this file importable on the server,
  // where there is no `document` to read.
  if (!hydrated) {
    hydrated = true;
    current = readStoredLanguage();
    /*
     * A pinned link is a choice, so it persists.
     *
     * Without this, `?lang=mui` styled the page it was opened on and then
     * evaporated on the next navigation — which is the opposite of what a
     * reader following a support reply expects, and it made the URL feel
     * broken rather than deliberate. Writing it here means the URL is a way of
     * *setting* the preference, not a one-page override.
     */
    if (current !== "zoblocks") persist(current);
    // Nothing is subscribed yet on this tick, so tell React on the next one.
    queueMicrotask(emit);
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => current;

/**
 * `"zoblocks"` on the server and on the first client render.
 *
 * The stored value is applied in the subscription instead, because reading it
 * during render would disagree with the server-rendered HTML — the same
 * hydration rule `useSiteTheme` follows for the colour mode.
 */
const getServerSnapshot = (): DesignLanguage => "zoblocks";

/** Write the choice where the next page load will find it. */
function persist(value: DesignLanguage): void {
  try {
    document.cookie = `${LANGUAGE_COOKIE}=${value}; path=/; max-age=${MAX_AGE}; SameSite=Lax${cookieDomain()}`;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
  } catch {
    /* Private mode, or a browser refusing storage. It still applies here. */
  }
}

export function setDesignLanguage(next: DesignLanguage): void {
  if (next === current) return;
  current = next;

  persist(next);

  // Reflected in the URL so the state is linkable and survives a reload, but
  // through `replaceState` rather than the router: this is a presentational
  // selection, and pushing it through Next would re-render the whole route.
  try {
    const url = new URL(location.href);
    if (next === "zoblocks") url.searchParams.delete(LANGUAGE_PARAM);
    else url.searchParams.set(LANGUAGE_PARAM, next);
    history.replaceState(null, "", url);
  } catch {
    /* A sandboxed frame with no history access. Harmless. */
  }

  emit();
}

export function useDesignLanguage(): DesignLanguage {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Test seam: drop the store back to its initial state. */
export function resetDesignLanguageForTests(): void {
  current = "zoblocks";
  hydrated = false;
  listeners.clear();
}
