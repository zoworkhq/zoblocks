/**
 * Deep-linking, through an adapter.
 *
 * Oxygen does not depend on a router, and it must not: a component library
 * that picks a router picks its customers. `syncTo` therefore takes an object
 * with three methods, and the two built-in adapters use nothing but the
 * platform. A Next.js or React Router host writes ten lines and keeps its own
 * navigation semantics.
 *
 * `replace` is the default rather than `push`. Tab selection is a view state,
 * not a destination, and pushing means the back button walks the user through
 * every tab they glanced at before it leaves the page.
 */

export interface UrlAdapter {
  read(): string | undefined;
  write(value: string, options: { replace: boolean }): void;
  /** Returns an unsubscribe function. */
  subscribe(listener: (value: string | undefined) => void): () => void;
}

/** No-op adapter, used when `syncTo` is false and in non-browser rendering. */
export const noopAdapter: UrlAdapter = {
  read: () => undefined,
  write: () => {},
  subscribe: () => () => {},
};

/**
 * `#value` in the location hash.
 *
 * Note the deliberate refusal to decode an empty hash as the empty string:
 * `#` on its own means "no tab specified", not "the tab whose value is ''".
 */
export function hashAdapter(win: Window | undefined = globalThis.window): UrlAdapter {
  if (!win) return noopAdapter;
  return {
    read() {
      const raw = win.location.hash.replace(/^#/, "");
      return raw.length > 0 ? decodeURIComponent(raw) : undefined;
    },
    write(value, { replace }) {
      const url = `${win.location.pathname}${win.location.search}#${encodeURIComponent(value)}`;
      if (replace) win.history.replaceState(win.history.state, "", url);
      else win.history.pushState(win.history.state, "", url);
    },
    subscribe(listener) {
      const handler = () => {
        const raw = win.location.hash.replace(/^#/, "");
        listener(raw.length > 0 ? decodeURIComponent(raw) : undefined);
      };
      win.addEventListener("hashchange", handler);
      win.addEventListener("popstate", handler);
      return () => {
        win.removeEventListener("hashchange", handler);
        win.removeEventListener("popstate", handler);
      };
    },
  };
}

/**
 * `?key=value` in the query string.
 *
 * Nothing personal ever goes in a URL — that is a repo-wide rule — so this is
 * for tab keys like `labs` or `billing`, never for a record identifier the
 * host has not already put there itself.
 */
export function searchParamAdapter(
  key: string,
  win: Window | undefined = globalThis.window,
): UrlAdapter {
  if (!win) return noopAdapter;
  const current = () => new URLSearchParams(win.location.search).get(key) ?? undefined;
  return {
    read: current,
    write(value, { replace }) {
      const params = new URLSearchParams(win.location.search);
      params.set(key, value);
      const query = params.toString();
      const url = `${win.location.pathname}${query ? `?${query}` : ""}${win.location.hash}`;
      if (replace) win.history.replaceState(win.history.state, "", url);
      else win.history.pushState(win.history.state, "", url);
    },
    subscribe(listener) {
      const handler = () => listener(current());
      win.addEventListener("popstate", handler);
      return () => win.removeEventListener("popstate", handler);
    },
  };
}

export type SyncTarget = false | "hash" | "search" | UrlAdapter;

export function resolveAdapter(
  target: SyncTarget,
  searchKey = "tab",
  win: Window | undefined = globalThis.window,
): UrlAdapter {
  if (target === false) return noopAdapter;
  if (target === "hash") return hashAdapter(win);
  if (target === "search") return searchParamAdapter(searchKey, win);
  return target;
}
