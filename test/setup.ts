import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(cleanup);

/**
 * jsdom implements neither of these, and several components call them: the
 * shell listens for viewport changes, and anything with a scroll rail observes
 * intersection. Without stubs the component throws during render and the test
 * reports a crash rather than the behaviour under test.
 */
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds = [];
  } as unknown as typeof IntersectionObserver;
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

/**
 * jsdom has no layout, so `getClientRects` exists on Element but not on Text.
 *
 * ProseMirror calls it on the selection's target node when a selection change
 * fires, to decide whether to scroll the caret into view. On a text node that
 * throws — asynchronously, from a MutationObserver callback, so it surfaces as
 * an unhandled error that fails the run while every test still passes. That
 * combination is worth a comment: the suite was green and the command exited 1.
 *
 * An empty list is the honest answer. There is no layout, so there are no
 * rects, and ProseMirror's own code handles the empty case by not scrolling.
 */
const EMPTY_RECT = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
  toJSON() {
    return {};
  },
} as DOMRect;

// jsdom gives `Element` both methods and `Range` neither, and ProseMirror
// measures through a Range. That was the actual gap: shimming Text alone
// changed nothing, because the call was never on a Text node.
Object.defineProperty(Range.prototype, "getClientRects", {
  configurable: true,
  writable: true,
  value: () => Object.assign([], { item: () => null }) as unknown as DOMRectList,
});
Object.defineProperty(Range.prototype, "getBoundingClientRect", {
  configurable: true,
  writable: true,
  value: () => EMPTY_RECT,
});

Object.defineProperty(Text.prototype, "getClientRects", {
  configurable: true,
  writable: true,
  value: () => Object.assign([], { item: () => null }) as unknown as DOMRectList,
});
Object.defineProperty(Text.prototype, "getBoundingClientRect", {
  configurable: true,
  writable: true,
  value: () => EMPTY_RECT,
});
