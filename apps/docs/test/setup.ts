import "@testing-library/jest-dom/vitest";

/*
 * jsdom implements neither, and both are load-bearing here: the tab indicator
 * measures with ResizeObserver, and antd's Modal and Select read
 * matchMedia for their responsive breakpoints. Without them the playground
 * throws before a single assertion runs.
 */
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

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
