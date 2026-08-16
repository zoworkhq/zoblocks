/**
 * Property/attribute reflection.
 *
 * This file exists because of a bug that reached the repository and was found
 * by apps/smoke, not by any unit test:
 *
 *     TypeError: Cannot set property label of #<OxLoaderElement>
 *                which has only a getter
 *
 * React 19 and Vue 3 both decide per binding whether to write a DOM property
 * or an attribute, and both decide with `if (key in element)`. Every
 * attribute-backed value on these elements was a getter with no setter, which
 * passes `in` and then throws on assignment. The elements were unusable in
 * React 19 — the single most important framework for this library — and the
 * whole jsdom suite was green, because it drives elements through
 * `setAttribute`, which is the path that always worked.
 *
 * So the tests below are written the way the frameworks behave, not the way
 * the class is written:
 *
 *   1. Enumerated from COMMON_ATTRIBUTES, so a new attribute without a setter
 *      fails without anyone remembering to add a case.
 *   2. Assignment through the property, never `setAttribute`.
 *   3. Values that frameworks actually produce — `false`, `0`, `null`.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { COMMON_ATTRIBUTES, LOADER_EVENTS, OxLoaderElement } from "../src/base.js";
import "../src/index.js";

const TAGS = [
  "ox-pulse-loader",
  "ox-rhythm-loader",
  "ox-breath-loader",
  "ox-helix-loader",
  "ox-infusion-loader",
] as const;

/** `show-label` → `showLabel`, which is the name a framework binds to. */
const camel = (attribute: string) =>
  attribute.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** Walk the prototype chain: these live on OxLoaderElement, not the instance. */
function describeProperty(
  object: object,
  key: string,
): { descriptor: PropertyDescriptor; owner: string } | null {
  let current: object | null = object;
  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor) {
      return { descriptor, owner: (current.constructor as { name: string }).name };
    }
    current = Object.getPrototypeOf(current) as object | null;
  }
  return null;
}

describe("every observed attribute is reachable as a writable property", () => {
  for (const attribute of COMMON_ATTRIBUTES) {
    const property = camel(attribute);

    it(`${attribute} → .${property} has both a getter and a setter`, () => {
      const found = describeProperty(OxLoaderElement.prototype, property);
      expect(found, `.${property} is missing entirely`).not.toBeNull();

      const { descriptor } = found!;
      // A data property would also be assignable, but on a custom element it
      // shadows the attribute instead of reflecting to it, so the getter/setter
      // pair is the shape being asserted rather than mere writability.
      expect(typeof descriptor.get, `.${property} must have a getter`).toBe("function");
      expect(
        typeof descriptor.set,
        `.${property} has a getter and no setter — React 19 and Vue will throw on assignment`,
      ).toBe("function");
    });
  }
});

describe("assigning a property writes the attribute", () => {
  let element: OxLoaderElement;

  beforeEach(() => {
    element = document.createElement("ox-pulse-loader") as OxLoaderElement;
    document.body.append(element);
  });

  it.each([
    ["label", "Loading vitals", "label", "Loading vitals"],
    ["mode", "overlay", "mode", "overlay"],
    ["size", "sm", "size", "sm"],
    ["size", 64, "size", "64"],
    ["speed", 1.5, "speed", "1.5"],
    ["hint", "Still working", "hint", "Still working"],
    ["slowHint", "Taking longer", "slow-hint", "Taking longer"],
    ["motion", "reduced", "motion", "reduced"],
    ["announce", "assertive", "announce", "assertive"],
    ["delay", 250, "delay", "250"],
    ["minDuration", 0, "min-duration", "0"],
    ["slowAfter", 5000, "slow-after", "5000"],
    ["progress", 42, "progress", "42"],
  ] as const)("%s = %o → [%s=%s]", (property, value, attribute, expected) => {
    (element as unknown as Record<string, unknown>)[property] = value;
    expect(element.getAttribute(attribute)).toBe(expected);
  });

  it("round-trips through the getter", () => {
    element.label = "Loading medication list";
    expect(element.label).toBe("Loading medication list");

    element.progress = 30;
    expect(element.progress).toBe(30);

    element.mode = "page";
    expect(element.mode).toBe("page");
  });

  it("keeps the getter's clamping — a property write is not a back door", () => {
    element.progress = 150;
    expect(element.progress).toBe(100);

    element.speed = 99;
    expect(element.speed).toBe(2);
  });

  /* ---------------------------------------------------------------- */
  /* The values frameworks actually produce                            */
  /* ---------------------------------------------------------------- */

  it("writes open=false rather than removing the attribute", () => {
    // An absent `open` means open. Removing it on `false` would reopen the
    // loader, which is the opposite of what the caller asked for — and this is
    // the exact line React 18 depends on, since it stringifies `open={false}`
    // to the same "false" by a completely different route.
    element.open = false;
    expect(element.getAttribute("open")).toBe("false");
    expect(element.open).toBe(false);

    element.open = true;
    expect(element.getAttribute("open")).toBe("true");
    expect(element.open).toBe(true);
  });

  it("treats null and undefined as 'unset', restoring the default", () => {
    element.label = "Custom";
    element.label = null;
    expect(element.hasAttribute("label")).toBe(false);
    expect(element.label).toBe("Loading");

    element.progress = 40;
    element.progress = undefined;
    expect(element.hasAttribute("progress")).toBe(false);
    expect(element.progress).toBeNull();
  });

  it("survives progress = 0, which a falsy check would drop", () => {
    element.progress = 0;
    expect(element.getAttribute("progress")).toBe("0");
    expect(element.progress).toBe(0);
    // 0% determinate is a real state — a request that has started and sent
    // nothing — and is not the same as an indeterminate wait.
    expect(element.getAttribute("aria-valuenow")).toBe("0");
    expect(element.getAttribute("role")).toBe("progressbar");
  });

  it("re-renders on a property write, not only an attribute write", () => {
    // The two paths must be indistinguishable after the fact. If a setter ever
    // stopped going through setAttribute, attributeChangedCallback would not
    // fire and the element would show stale content.
    element.label = "Loading imaging study";
    const rendered = element.shadowRoot?.querySelector("[part='label']")?.textContent;
    expect(rendered).toBe("Loading imaging study");
  });

  it("applies to every loader, not just the one under test", () => {
    for (const tag of TAGS) {
      const node = document.createElement(tag) as OxLoaderElement;
      document.body.append(node);
      node.label = `Loading ${tag}`;
      expect(node.getAttribute("label"), tag).toBe(`Loading ${tag}`);
      node.remove();
    }
  });
});

describe("the framework property path", () => {
  /**
   * A direct transcription of what React 19 and Vue 3 do, so a regression is
   * caught here rather than in a browser. Both walk the props and assign to the
   * element when the key is `in` it.
   */
  function setLikeReact19(element: Element, props: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(props)) {
      if (key in element) (element as unknown as Record<string, unknown>)[key] = value;
      else if (value === null || value === undefined) element.removeAttribute(key);
      else element.setAttribute(key, String(value));
    }
  }

  it("does not throw for any observed attribute", () => {
    const element = document.createElement("ox-pulse-loader");
    document.body.append(element);

    const props = Object.fromEntries(COMMON_ATTRIBUTES.map((a) => [camel(a), "1"]));
    expect(() => setLikeReact19(element, props)).not.toThrow();
  });

  it("produces the same element state as the attribute path", () => {
    const viaProperty = document.createElement("ox-pulse-loader") as OxLoaderElement;
    const viaAttribute = document.createElement("ox-pulse-loader") as OxLoaderElement;
    document.body.append(viaProperty, viaAttribute);

    setLikeReact19(viaProperty, { label: "Loading", mode: "overlay", progress: 25, open: false });

    viaAttribute.setAttribute("label", "Loading");
    viaAttribute.setAttribute("mode", "overlay");
    viaAttribute.setAttribute("progress", "25");
    viaAttribute.setAttribute("open", "false");

    // Attribute-for-attribute, because "the same state" for a custom element is
    // its attributes — anything else and the two channels could diverge on the
    // next render.
    const snapshot = (node: Element) =>
      [...node.attributes]
        .map((a) => `${a.name}=${a.value}`)
        .sort()
        .join(" ");
    expect(snapshot(viaProperty)).toBe(snapshot(viaAttribute));
  });
});

/* ------------------------------------------------------------------ */
/* Event names                                                         */
/* ------------------------------------------------------------------ */

describe("event names are bindable in every framework's template syntax", () => {
  it("contains no colon — Angular cannot bind one", () => {
    // Angular parses the colon in `(event)` as its global-target separator, so
    // `(ox-loader:show)` fails to compile with "Unexpected global target
    // 'ox-loader'". There is no escape syntax. This was a real defect found by
    // apps/smoke, not a hypothetical.
    for (const name of LOADER_EVENTS) {
      expect(name, `"${name}" is unbindable in an Angular template`).not.toContain(":");
    }
  });

  it("is a valid custom event name in Vue, Svelte, and plain HTML too", () => {
    // Lowercase and hyphen-separated: no framework lowercases it into something
    // different, and it cannot collide with a native event.
    for (const name of LOADER_EVENTS) {
      expect(name).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(name.startsWith("ox-loader-"), `"${name}" must be namespaced`).toBe(true);
    }
  });

  it("dispatches exactly the names it publishes", () => {
    // The constant and the dispatch sites are separate strings; if one is
    // renamed and not the other, consumers subscribe to an event that never
    // fires and nothing else notices.
    const element = document.createElement("ox-pulse-loader") as OxLoaderElement;
    const seen: string[] = [];
    for (const name of LOADER_EVENTS) {
      element.addEventListener(name, () => seen.push(name));
    }
    element.minDuration = 0;
    element.slowAfter = 0;
    document.body.append(element);
    element.open = false;

    expect(seen).toEqual(["ox-loader-show", "ox-loader-hide"]);
  });

  it("bubbles and crosses the shadow boundary", () => {
    // `composed: true` is what lets a host application listen on a wrapper or
    // on document rather than on the element itself — which is how React, Vue,
    // and Angular host listeners are all written.
    const wrapper = document.createElement("div");
    const element = document.createElement("ox-pulse-loader") as OxLoaderElement;
    element.minDuration = 0;
    wrapper.append(element);
    document.body.append(wrapper);

    const seen: string[] = [];
    wrapper.addEventListener("ox-loader-hide", () => seen.push("hide"));
    element.open = false;

    expect(seen).toEqual(["hide"]);
  });
});
