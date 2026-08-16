/**
 * Explicit geometry for a layout engine that has none.
 *
 * jsdom reports every box as zero, so anything measurement-driven — the
 * indicator, the priority-plus fitter, the scroll affordances — would take the
 * "nothing to do" branch and the tests would pass without proving anything.
 *
 * These helpers install real numbers rather than faking the component's
 * behaviour: the component still does its own arithmetic, it just gets sizes
 * to do it on. The genuine browser measurement is covered by Playwright.
 */

export interface StubSizes {
  /** Inline size of the list's viewport. */
  clientWidth: number;
  /** Inline size of the list's content, including what overflows. */
  scrollWidth: number;
  /** Width given to every trigger. */
  tabWidth: number;
  tabHeight?: number;
  gap?: number;
}

const patched = new Set<HTMLElement>();

/**
 * Give a list and its triggers measurable boxes.
 *
 * Returns a restore function; call it in `afterEach` so one test's geometry
 * cannot leak into the next.
 */
export function stubGeometry(list: HTMLElement, sizes: StubSizes): () => void {
  const { clientWidth, scrollWidth, tabWidth, tabHeight = 32, gap = 0 } = sizes;

  const define = (element: HTMLElement, props: Record<string, number>) => {
    for (const [key, value] of Object.entries(props)) {
      Object.defineProperty(element, key, { configurable: true, value });
    }
    patched.add(element);
  };

  define(list, { clientWidth, scrollWidth, offsetWidth: clientWidth, offsetHeight: tabHeight });

  const tabs = Array.from(list.querySelectorAll<HTMLElement>("[data-ox-tab]"));
  tabs.forEach((tab, index) => {
    const left = index * (tabWidth + gap);
    define(tab, {
      offsetLeft: left,
      offsetTop: 0,
      offsetWidth: tabWidth,
      offsetHeight: tabHeight,
    });
    tab.getBoundingClientRect = () =>
      ({
        x: left,
        y: 0,
        left,
        top: 0,
        right: left + tabWidth,
        bottom: tabHeight,
        width: tabWidth,
        height: tabHeight,
        toJSON: () => ({}),
      }) as DOMRect;
  });

  return () => {
    for (const element of patched) {
      for (const key of [
        "clientWidth",
        "scrollWidth",
        "offsetWidth",
        "offsetHeight",
        "offsetLeft",
        "offsetTop",
      ]) {
        // Deleting the own property restores jsdom's prototype getter.
        delete (element as unknown as Record<string, unknown>)[key];
      }
    }
    patched.clear();
  };
}

/** Drive the scroll position a list reports, for the fade/nudge assertions. */
export function stubScroll(list: HTMLElement, scrollLeft: number): void {
  Object.defineProperty(list, "scrollLeft", {
    configurable: true,
    value: scrollLeft,
    writable: true,
  });
  list.dispatchEvent(new Event("scroll"));
}

/**
 * Fire every live ResizeObserver, as a browser would once layout settles.
 *
 * The stubbed geometry has to be installed after render — there is nothing to
 * measure before then — so something has to tell the component that its boxes
 * changed. In a browser that is the observer; here it is this.
 */
export function triggerResize(): void {
  (globalThis as { triggerResize?: () => void }).triggerResize?.();
}
