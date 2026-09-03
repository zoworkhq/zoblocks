/**
 * The environment antd and MUI expect, which jsdom does not provide.
 *
 * Nothing here fakes a component's behaviour. Both libraries measure real
 * layout — antd's Tabs observes its strip, MUI's ripple animates — and jsdom
 * has no layout engine, so without these the adapters die on APIs that are
 * missing rather than on anything the tests are about. The visual result is
 * checked in a real browser instead; these shims only keep the DOM assertions
 * reachable.
 */

/**
 * antd's Tabs, Select and Dropdown all observe their own size through
 * `@rc-component/resize-observer`, which throws outright when the global is
 * absent — every antd test failed with `ResizeObserver is not defined` before
 * this existed. Inert on purpose: no test here asserts on a re-measure.
 */
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

/** MUI reads `prefers-reduced-motion` before deciding to animate a ripple. */
if (!globalThis.matchMedia) {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof matchMedia;
}

/** antd's Tabs scrolls the active tab into view on selection. */
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
