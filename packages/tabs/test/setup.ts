import "@testing-library/jest-dom/vitest";

/**
 * jsdom has no layout engine, which matters more for tabs than for most
 * components: the indicator, the scroll affordances and the priority-plus
 * fitter are all measurement.
 *
 * The shims below give the *environment* the APIs it lacks. They never fake a
 * component's behaviour — where geometry is the thing under test, the test
 * sets explicit box sizes itself (see `test/geometry.ts`), and the real
 * measurement is exercised in the Playwright suite against a browser that has
 * a layout engine.
 */

/**
 * A controllable ResizeObserver.
 *
 * jsdom ships none, and a no-op stub would silently skip the re-measure path
 * entirely — the overflow tests would pass by never running the code they
 * exist to test. This records live observers so a test can fire an
 * observation explicitly via `triggerResize()`, which exercises the real
 * callback rather than a substitute for it.
 */
const liveObservers = new Set<{ callback: ResizeObserverCallback; targets: Set<Element> }>();

globalThis.ResizeObserver = class {
  private readonly entry = {
    callback: undefined as unknown as ResizeObserverCallback,
    targets: new Set<Element>(),
  };

  constructor(callback: ResizeObserverCallback) {
    this.entry.callback = callback;
    liveObservers.add(this.entry);
  }
  observe(target: Element) {
    this.entry.targets.add(target);
  }
  unobserve(target: Element) {
    this.entry.targets.delete(target);
  }
  disconnect() {
    this.entry.targets.clear();
    liveObservers.delete(this.entry);
  }
} as unknown as typeof ResizeObserver;

/** Fire every live observer, as a browser would after a layout change. */
(globalThis as { triggerResize?: () => void }).triggerResize = () => {
  for (const observer of liveObservers) {
    observer.callback([], {} as ResizeObserver);
  }
};

/**
 * `scrollIntoView` is called on every arrow keypress in a scrollable strip and
 * simply does not exist in jsdom, so without this the keyboard tests die on
 * the first ArrowRight with a TypeError that looks like a component bug.
 */
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

/** Same for programmatic scrolling behind the nudge buttons. */
if (!Element.prototype.scrollBy) {
  Element.prototype.scrollBy = function scrollBy() {};
}

/**
 * `document.fonts.ready` drives one of the six re-measure triggers. jsdom
 * ships no FontFaceSet; an already-resolved promise means the font-load
 * re-measure runs immediately rather than never, which is the branch the
 * tests want to reach.
 */
if (!(document as Document & { fonts?: FontFaceSet }).fonts) {
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { ready: Promise.resolve() },
  });
}

/**
 * jsdom implements `requestAnimationFrame`, but its default 16ms cadence makes
 * every measurement assertion a timing race. Running the callback on a
 * microtask keeps the batching semantics — reads still happen after the
 * current synchronous block — while making them deterministic.
 */
const originalRaf = globalThis.requestAnimationFrame;
globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
  const id = setTimeout(() => callback(performance.now()), 0);
  return id as unknown as number;
}) as typeof requestAnimationFrame;
globalThis.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as typeof cancelAnimationFrame;

// Kept so a test that genuinely wants the real thing can restore it.
(globalThis as { __zbOriginalRaf?: typeof requestAnimationFrame }).__zbOriginalRaf = originalRaf;
