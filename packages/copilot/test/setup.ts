import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * Testing Library only registers its own auto-cleanup when Vitest runs with
 * `globals: true`. This project does not, so unmounting between tests is done
 * here explicitly — without it, every `getByRole` after the first render in a
 * file matches leftovers from the previous one and the failures look like
 * component bugs rather than harness bugs.
 */
afterEach(() => {
  cleanup();
});

/*
 * The jsdom gaps antd falls into.
 *
 * These are not conveniences. `@rc-component/resize-observer` calls
 * `ResizeObserver` from a passive effect, and jsdom ships none — so the
 * constructor throws *during commit*, React tears the tree down, and every
 * subsequent query runs against `<body><div /></body>`. The failure that
 * reaches you is "unable to find role=group", which reads as a missing feature
 * rather than a missing global, and it only appeared in CI because whether the
 * observer is reached at all depends on which antd overlays a test happens to
 * open.
 *
 * The signature package (also antd) carries the same block for the same
 * reason. Reporting nothing from each of these is correct: layout is not what
 * these suites assert on, and the real geometry is covered by Playwright.
 */

/** antd's Modal measures the scrollbar with a pseudo-element, which jsdom refuses. */
const realGetComputedStyle = window.getComputedStyle.bind(window);
// The pseudo-element argument is dropped deliberately — nothing under test
// asserts on pseudo-element styles, and passing it through is what jsdom
// refuses.
window.getComputedStyle = ((element: Element) =>
  realGetComputedStyle(element)) as typeof window.getComputedStyle;

/** antd reads `matchMedia` for its breakpoints. "No match" pins us to desktop. */
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

if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}
