/**
 * URL adapters.
 *
 * A fake window rather than jsdom, deliberately: this package runs in the
 * `node` environment precisely so that a DOM dependency cannot creep in
 * unnoticed, and the adapters only ever touch `location` and `history`.
 */

import { describe, expect, it, vi } from "vitest";
import { hashAdapter, noopAdapter, resolveAdapter, searchParamAdapter } from "../src/index.js";

function fakeWindow(url = "https://example.test/chart?tab=labs#vitals") {
  const parsed = new URL(url);
  const listeners = new Map<string, Set<() => void>>();
  const win = {
    location: {
      get pathname() {
        return parsed.pathname;
      },
      get search() {
        return parsed.search;
      },
      get hash() {
        return parsed.hash;
      },
    },
    history: {
      state: { some: "state" },
      replaceState: vi.fn((_state: unknown, _title: string, next: string) => {
        const resolved = new URL(next, parsed.origin);
        parsed.pathname = resolved.pathname;
        parsed.search = resolved.search;
        parsed.hash = resolved.hash;
      }),
      pushState: vi.fn((_state: unknown, _title: string, next: string) => {
        const resolved = new URL(next, parsed.origin);
        parsed.pathname = resolved.pathname;
        parsed.search = resolved.search;
        parsed.hash = resolved.hash;
      }),
    },
    addEventListener: (type: string, handler: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)?.add(handler);
    },
    removeEventListener: (type: string, handler: () => void) => {
      listeners.get(type)?.delete(handler);
    },
    emit: (type: string) => {
      for (const handler of listeners.get(type) ?? []) handler();
    },
    listenerCount: (type: string) => listeners.get(type)?.size ?? 0,
  };
  return win as unknown as Window & {
    emit: (type: string) => void;
    listenerCount: (type: string) => number;
  };
}

describe("noopAdapter", () => {
  it("reads nothing, writes nothing and unsubscribes cleanly", () => {
    expect(noopAdapter.read()).toBeUndefined();
    expect(() => noopAdapter.write("a", { replace: true })).not.toThrow();
    expect(() => noopAdapter.subscribe(() => {})()).not.toThrow();
  });
});

describe("hashAdapter", () => {
  it("reads and decodes the hash", () => {
    const win = fakeWindow("https://example.test/x#care%20plan");
    expect(hashAdapter(win).read()).toBe("care plan");
  });

  it('treats a bare "#" as no tab rather than the empty-string tab', () => {
    expect(hashAdapter(fakeWindow("https://example.test/x#")).read()).toBeUndefined();
    expect(hashAdapter(fakeWindow("https://example.test/x")).read()).toBeUndefined();
  });

  it("replaces by default — tab selection is a view state, not a destination", () => {
    const win = fakeWindow("https://example.test/chart?a=1#vitals");
    hashAdapter(win).write("labs", { replace: true });
    expect(win.history.replaceState).toHaveBeenCalledWith(win.history.state, "", "/chart?a=1#labs");
    expect(win.history.pushState).not.toHaveBeenCalled();
  });

  it("can push when the host asks for it", () => {
    const win = fakeWindow("https://example.test/chart#vitals");
    hashAdapter(win).write("labs", { replace: false });
    expect(win.history.pushState).toHaveBeenCalled();
  });

  it("encodes a value with spaces", () => {
    const win = fakeWindow("https://example.test/chart");
    hashAdapter(win).write("care plan", { replace: true });
    expect(win.history.replaceState).toHaveBeenCalledWith(
      win.history.state,
      "",
      "/chart#care%20plan",
    );
  });

  it("notifies on hashchange and popstate, and detaches both on unsubscribe", () => {
    const win = fakeWindow("https://example.test/x#labs");
    const seen: Array<string | undefined> = [];
    const unsubscribe = hashAdapter(win).subscribe((value) => seen.push(value));
    win.emit("hashchange");
    win.emit("popstate");
    expect(seen).toEqual(["labs", "labs"]);
    unsubscribe();
    expect(win.listenerCount("hashchange")).toBe(0);
    expect(win.listenerCount("popstate")).toBe(0);
  });

  it("falls back to the no-op adapter with no window", () => {
    expect(hashAdapter(undefined)).toBe(noopAdapter);
  });
});

describe("searchParamAdapter", () => {
  it("reads its own key", () => {
    const win = fakeWindow("https://example.test/x?tab=labs&other=1");
    expect(searchParamAdapter("tab", win).read()).toBe("labs");
  });

  it("returns undefined when the key is absent", () => {
    expect(searchParamAdapter("tab", fakeWindow("https://example.test/x")).read()).toBeUndefined();
  });

  it("preserves the other parameters and the hash when writing", () => {
    const win = fakeWindow("https://example.test/chart?other=1&tab=vitals#anchor");
    searchParamAdapter("tab", win).write("labs", { replace: true });
    expect(win.history.replaceState).toHaveBeenCalledWith(
      win.history.state,
      "",
      "/chart?other=1&tab=labs#anchor",
    );
  });

  it("notifies on popstate and detaches on unsubscribe", () => {
    const win = fakeWindow("https://example.test/x?tab=labs");
    const seen: Array<string | undefined> = [];
    const unsubscribe = searchParamAdapter("tab", win).subscribe((value) => seen.push(value));
    win.emit("popstate");
    expect(seen).toEqual(["labs"]);
    unsubscribe();
    expect(win.listenerCount("popstate")).toBe(0);
  });

  it("falls back to the no-op adapter with no window", () => {
    expect(searchParamAdapter("tab", undefined)).toBe(noopAdapter);
  });
});

describe("resolveAdapter", () => {
  const win = fakeWindow();

  it("returns the no-op adapter when sync is off", () => {
    expect(resolveAdapter(false, "tab", win)).toBe(noopAdapter);
  });

  it("resolves the two built-in names", () => {
    expect(resolveAdapter("hash", "tab", win).read()).toBe("vitals");
    expect(resolveAdapter("search", "tab", win).read()).toBe("labs");
  });

  it("passes a custom adapter straight through, so a router keeps its own semantics", () => {
    const custom = { read: () => "x", write: () => {}, subscribe: () => () => {} };
    expect(resolveAdapter(custom, "tab", win)).toBe(custom);
  });
});
