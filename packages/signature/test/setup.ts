import "@testing-library/jest-dom/vitest";

/**
 * jsdom implements neither of the two APIs a canvas-backed signature pad needs.
 *
 * `PointerEvent` simply does not exist, and `setPointerCapture` is not on
 * Element — so the component's own event plumbing would throw before any
 * assertion ran. Both stubs are shims for the *environment*, not for the
 * component: every behaviour they enable is still exercised for real in the
 * Playwright suite, which uses a browser that has them.
 */
if (typeof window.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly pressure: number;
    readonly isPrimary: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 1;
      this.pointerType = params.pointerType ?? "mouse";
      this.pressure = params.pressure ?? 0.5;
      this.isPrimary = params.isPrimary ?? true;
    }
  }
  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = function setPointerCapture() {};
  Element.prototype.releasePointerCapture = function releasePointerCapture() {};
  Element.prototype.hasPointerCapture = function hasPointerCapture() {
    return false;
  };
}

// jsdom has no layout engine, so every element reports a zero-sized box. The
// pad maps client coordinates into capture space through this, and a zero box
// would collapse every sample onto the origin.
if (!HTMLElement.prototype.getBoundingClientRect.toString().includes("native")) {
  const original = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    const rect = original.call(this);
    if (rect.width === 0 && rect.height === 0 && this.dataset.oxSignaturePad !== undefined) {
      return {
        ...rect,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 600,
        bottom: 200,
        width: 600,
        height: 200,
        toJSON: () => ({}),
      } as DOMRect;
    }
    return rect;
  };
}

/**
 * jsdom throws "Not implemented" for `getComputedStyle(el, pseudoElt)`.
 *
 * antd's Modal measures the scrollbar before locking scroll, and that
 * measurement passes a pseudo-element. Without this shim every Modal test dies
 * during render, which looks exactly like a component bug and is not one.
 * Dropping the second argument is safe here: nothing under test asserts on
 * pseudo-element styles.
 */
const realGetComputedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = ((element: Element, pseudoElement?: string | null) =>
  pseudoElement
    ? realGetComputedStyle(element)
    : realGetComputedStyle(element)) as typeof window.getComputedStyle;

/**
 * antd reads `matchMedia` for its responsive breakpoints; jsdom ships none.
 * Reports "no match", which pins the tests to the desktop layout.
 */
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

/**
 * antd's Tabs positions its ink bar with a ResizeObserver, which jsdom does
 * not ship. Reporting nothing is correct here: layout is not what these tests
 * assert on, and the real geometry is covered by the Playwright suite.
 */
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

/**
 * jsdom has no object-URL API, which `readImageFile` uses to hand a Blob to an
 * `<img>`. The identity of the URL does not matter — the tests stub `Image`
 * anyway — but `revokeObjectURL` must exist and be observable, because one of
 * them asserts the URL is released even when reading fails.
 */
if (typeof URL.createObjectURL !== "function") {
  let n = 0;
  URL.createObjectURL = () => `blob:oxygen/${++n}`;
  URL.revokeObjectURL = () => {};
}
