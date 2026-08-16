import "@testing-library/jest-dom/vitest";

/**
 * Environment shims, not component shims.
 *
 * Everything below papers over something jsdom does not implement. Each one is
 * a capability the real browser has and the Playwright suite exercises for
 * real; none of them changes what the components do.
 */

// antd reads matchMedia for its responsive breakpoints. Reporting "no match"
// pins the tests to the desktop layout, which is the one the assertions assume.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

/**
 * jsdom has no layout engine, so container queries never fire. The banner's
 * field-drop is therefore asserted through the resolved plan and the emitted
 * data attributes rather than through computed styles — the CSS itself is
 * covered by the Playwright suite, which has a real layout engine.
 */
