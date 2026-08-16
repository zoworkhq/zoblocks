/**
 * What a non-React host actually observes.
 *
 * Every assertion here is something a Vue, Angular, Svelte, or plain-HTML
 * consumer depends on: that the element upgrades, that setting an attribute
 * re-renders it, that the accessibility semantics land on the host element
 * where the application's own queries can see them, and that events cross the
 * shadow boundary.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../src/index.js";
import { INFUSION, LOADER_ART, PULSE_MIN_SIZE_PX } from "../src/art.js";
import { slugWidth } from "../src/infusion.js";

const TAGS = [
  "ox-pulse-loader",
  "ox-rhythm-loader",
  "ox-breath-loader",
  "ox-helix-loader",
  "ox-infusion-loader",
] as const;

function mount(tag: string, attributes: Record<string, string> = {}): HTMLElement {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  document.body.append(element);
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("registration", () => {
  it.each(TAGS)("defines %s", (tag) => {
    expect(customElements.get(tag)).toBeTypeOf("function");
  });

  it.each(TAGS)("upgrades %s on connect and builds a shadow root", (tag) => {
    const element = mount(tag);
    expect(element.shadowRoot).not.toBeNull();
    expect(element.shadowRoot?.querySelector("svg")).not.toBeNull();
  });

  it("tolerates a second import of the same module", async () => {
    // A page that imports both the barrel and a subpath must not throw on the
    // duplicate definition and take the host application down over a loader.
    await expect(import("../src/pulse.js")).resolves.toBeDefined();
    expect(customElements.get("ox-pulse-loader")).toBeTypeOf("function");
  });

  it.each(TAGS)("%s survives being upgraded after the markup exists", (tag) => {
    // The CDN case: HTML parses first, the module loads later.
    document.body.innerHTML = `<${tag} label="Loading"></${tag}>`;
    const element = document.body.firstElementChild as HTMLElement;
    expect(element.shadowRoot?.querySelector("svg")).not.toBeNull();
  });
});

describe("accessibility semantics", () => {
  it.each(TAGS)("%s announces itself politely on the host element", (tag) => {
    // On the host, not inside the shadow root, so the application's own
    // queries and tests can see it.
    const element = mount(tag, { label: "Loading results" });
    expect(element.getAttribute("role")).toBe("status");
    expect(element.getAttribute("aria-live")).toBe("polite");
  });

  it.each(TAGS)("%s keeps its label in the DOM when hidden", (tag) => {
    const element = mount(tag, { label: "Loading your results", "show-label": "false" });
    const label = element.shadowRoot?.querySelector("[part='label']");
    expect(label?.textContent).toBe("Loading your results");
    expect(label?.className).toBe("sr");
  });

  it.each(TAGS)("%s hides its art from assistive technology", (tag) => {
    const element = mount(tag);
    expect(element.shadowRoot?.querySelector(".art")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("can be silenced for a region that is already live", () => {
    const element = mount("ox-breath-loader", { announce: "off" });
    expect(element.hasAttribute("aria-live")).toBe(false);
  });

  it("can escalate to assertive", () => {
    const element = mount("ox-breath-loader", { announce: "assertive" });
    expect(element.getAttribute("aria-live")).toBe("assertive");
  });

  it("never writes caller text as markup", () => {
    // A loader is not an injection sink.
    const element = mount("ox-breath-loader", {
      label: "<img src=x onerror=alert(1)>",
      "show-label": "true",
    });
    const label = element.shadowRoot?.querySelector("[part='label']");
    expect(label?.querySelector("img")).toBeNull();
    expect(label?.textContent).toContain("<img");
  });
});

describe("attribute reactivity", () => {
  it("re-renders when an attribute changes", () => {
    const element = mount("ox-breath-loader", { label: "First" });
    expect(element.shadowRoot?.querySelector("[part='label']")?.textContent).toBe("First");

    element.setAttribute("label", "Second");
    expect(element.shadowRoot?.querySelector("[part='label']")?.textContent).toBe("Second");
  });

  it.each([
    ["sm", "20px"],
    ["md", "32px"],
    ["lg", "56px"],
    ["xl", "88px"],
    ["64", "64px"],
  ])("resolves size=%s to %s", (size, expected) => {
    const element = mount("ox-breath-loader", { size });
    expect(element.style.getPropertyValue("--ox-loader-size")).toBe(expected);
  });

  it("clamps an absurd size rather than rendering it", () => {
    const element = mount("ox-breath-loader", { size: "9000" });
    expect(element.style.getPropertyValue("--ox-loader-size")).toBe("480px");
  });

  it.each([
    ["40", "1500ms"],
    ["60", "1000ms"],
    ["100", "600ms"],
    ["240", "600ms"],
    ["nonsense", "1000ms"],
  ])("converts bpm=%s to a %s period", (bpm, expected) => {
    const element = mount("ox-pulse-loader", { bpm });
    expect(element.style.getPropertyValue("--ox-loader-beat")).toBe(expected);
  });

  it("clamps speed so nothing can be driven into a flicker", () => {
    const fast = mount("ox-breath-loader", { speed: "40" });
    expect(fast.style.getPropertyValue("--ox-loader-cycle")).toBe("2000ms");

    const slow = mount("ox-breath-loader", { speed: "0.01" });
    expect(slow.style.getPropertyValue("--ox-loader-cycle")).toBe("8000ms");
  });

  it.each(["auto", "reduced", "full"])(
    "keeps motion=%s on the host for CSS to act on",
    (motion) => {
      const element = mount("ox-breath-loader", { motion });
      expect(element.getAttribute("motion")).toBe(motion);
    },
  );
});

describe("pulse", () => {
  it("draws the heart open at both sides", () => {
    const element = mount("ox-pulse-loader");
    const html = element.shadowRoot?.innerHTML ?? "";
    expect(html).toContain(LOADER_ART.heartTop);
    expect(html).toContain(LOADER_ART.heartBottom);
    expect(html).toContain(LOADER_ART.heartLine);
  });

  it("renders the rhythm line three times: track, tail, head", () => {
    const element = mount("ox-pulse-loader");
    const lines = [...(element.shadowRoot?.querySelectorAll("path") ?? [])].filter(
      (p) => p.getAttribute("d") === LOADER_ART.heartLine,
    );
    expect(lines).toHaveLength(3);
  });

  it(`renders the rhythm line alone below ${PULSE_MIN_SIZE_PX}px`, () => {
    const element = mount("ox-pulse-loader", { size: "24" });
    const html = element.shadowRoot?.innerHTML ?? "";
    expect(html).not.toContain(LOADER_ART.heartTop);
    expect(html).toContain(LOADER_ART.strip);
    expect(element.getAttribute("data-ox-loader")).toBe("rhythm");
  });

  it("keeps the heart at the threshold size", () => {
    const element = mount("ox-pulse-loader", { size: String(PULSE_MIN_SIZE_PX) });
    expect(element.getAttribute("data-ox-loader")).toBe("pulse");
  });
});

describe("helix", () => {
  it("renders two strands of nine with distinct phases", () => {
    const element = mount("ox-helix-loader");
    const dots = [...(element.shadowRoot?.querySelectorAll(".dot") ?? [])];
    expect(dots).toHaveLength(18);

    const phases = dots.map((dot) =>
      (dot as SVGElement).style.getPropertyValue("--ox-loader-phase"),
    );
    expect(new Set(phases).size).toBe(18);
  });

  it("offsets the second strand by half a turn", () => {
    const element = mount("ox-helix-loader");
    const phases = [...(element.shadowRoot?.querySelectorAll(".dot") ?? [])].map((dot) =>
      Number((dot as SVGElement).style.getPropertyValue("--ox-loader-phase")),
    );
    phases.slice(0, 9).forEach((phase, index) => {
      expect(phases[9 + index]).toBeCloseTo(phase - 0.5, 5);
    });
  });
});

describe("infusion", () => {
  it("is a status region with a drifting slug when indeterminate", () => {
    const element = mount("ox-infusion-loader", { label: "Preparing the export" });
    expect(element.getAttribute("role")).toBe("status");
    expect(element.hasAttribute("aria-valuenow")).toBe(false);
    expect(element.shadowRoot?.querySelector(".slug")?.getAttribute("width")).toBe(
      String(INFUSION.driftWidth),
    );
  });

  it("becomes a progressbar with a full value set when determinate", () => {
    const element = mount("ox-infusion-loader", { label: "Importing records", progress: "42" });
    expect(element.getAttribute("role")).toBe("progressbar");
    expect(element.getAttribute("aria-valuemin")).toBe("0");
    expect(element.getAttribute("aria-valuemax")).toBe("100");
    expect(element.getAttribute("aria-valuenow")).toBe("42");
    expect(element.getAttribute("aria-valuetext")).toBe("42 percent");
    expect(element.getAttribute("aria-label")).toBe("Importing records");
    expect(element.hasAttribute("aria-live")).toBe(false);
  });

  it("returns to a status region when progress is removed", () => {
    const element = mount("ox-infusion-loader", { progress: "42" });
    element.removeAttribute("progress");
    expect(element.getAttribute("role")).toBe("status");
    expect(element.hasAttribute("aria-valuenow")).toBe(false);
    expect(element.hasAttribute("aria-label")).toBe(false);
  });

  it.each([
    ["0", 30],
    ["42", 74.52],
    ["100", 136],
    ["-40", 30],
    ["140", 136],
  ])("fills to width %s → %s", (progress, expected) => {
    const element = mount("ox-infusion-loader", { progress });
    expect(Number(element.shadowRoot?.querySelector(".slug")?.getAttribute("width"))).toBeCloseTo(
      expected,
      2,
    );
  });

  it("agrees with its own width function", () => {
    expect(slugWidth(0)).toBe(INFUSION.slugMin);
    expect(slugWidth(100)).toBe(INFUSION.slugMax);
  });
});

describe("timing and events", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("stays hidden until the delay elapses", () => {
    const element = mount("ox-breath-loader", { delay: "200" });
    expect(element.hasAttribute("hidden")).toBe(true);

    vi.advanceTimersByTime(200);
    expect(element.hasAttribute("hidden")).toBe(false);
  });

  it("never appears when the wait resolves inside the delay", () => {
    const element = mount("ox-breath-loader", { delay: "200" });
    vi.advanceTimersByTime(120);
    element.setAttribute("open", "false");
    vi.advanceTimersByTime(1000);
    expect(element.hasAttribute("hidden")).toBe(true);
  });

  it("stays for its minimum duration once shown", () => {
    const element = mount("ox-breath-loader", { "min-duration": "400" });
    vi.advanceTimersByTime(100);
    element.setAttribute("open", "false");
    expect(element.hasAttribute("hidden")).toBe(false);

    vi.advanceTimersByTime(300);
    expect(element.hasAttribute("hidden")).toBe(true);
  });

  it("emits show, slow, and hide across the shadow boundary", () => {
    const events: string[] = [];
    for (const type of ["ox-loader-show", "ox-loader-slow", "ox-loader-hide"]) {
      document.addEventListener(type, () => events.push(type));
    }

    const element = mount("ox-breath-loader", { "slow-after": "1000", "min-duration": "0" });
    vi.advanceTimersByTime(1000);
    element.setAttribute("open", "false");
    vi.advanceTimersByTime(10);

    expect(events).toEqual(["ox-loader-show", "ox-loader-slow", "ox-loader-hide"]);
  });

  it("shows the stall wording, and says what is still possible", () => {
    const element = mount("ox-breath-loader", { "slow-after": "1000", "show-label": "true" });
    vi.advanceTimersByTime(1000);
    const hint = element.shadowRoot?.querySelector("[part='hint']")?.textContent ?? "";
    expect(hint).toContain("Still loading");
    expect(hint).toContain("go back");
  });

  it("lets the application replace the stall wording", () => {
    const element = mount("ox-breath-loader", {
      "slow-after": "100",
      "show-label": "true",
      "slow-hint": "The records service is slow. Your work is saved.",
    });
    vi.advanceTimersByTime(100);
    expect(element.shadowRoot?.querySelector("[part='hint']")?.textContent).toContain(
      "Your work is saved.",
    );
  });

  it("never claims a stall when slow-after is disabled", () => {
    const element = mount("ox-breath-loader", { "slow-after": "0", "show-label": "true" });
    vi.advanceTimersByTime(60_000);
    expect(element.shadowRoot?.querySelector("[part='hint']")?.textContent).toBe("");
  });

  it("clears its timers when removed from the document", () => {
    const onSlow = vi.fn();
    document.addEventListener("ox-loader-slow", onSlow);
    const element = mount("ox-breath-loader", { "slow-after": "1000" });
    element.remove();
    vi.advanceTimersByTime(5000);
    expect(onSlow).not.toHaveBeenCalled();
    document.removeEventListener("ox-loader-slow", onSlow);
  });
});
