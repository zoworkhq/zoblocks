/**
 * What a Vue or Angular host actually observes: the element upgrades,
 * attributes reflect, roles land on the host as well as the control, events
 * cross the shadow boundary, and nothing renders through innerHTML.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import "../src/switch.js";
import type { ZbSwitchElement } from "../src/switch.js";
import { ABSENT_REASON_LABEL, STATE_LABEL_PRESETS, SWITCH_SIZE } from "../src/vocabulary.js";

function mount(attributes: Record<string, string> = {}): ZbSwitchElement {
  const element = document.createElement("zb-switch");
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  document.body.append(element);
  return element;
}

const control = (element: ZbSwitchElement) =>
  element.shadowRoot!.querySelector<HTMLButtonElement>(".zb-switch__control")!;
const stateWord = (element: ZbSwitchElement) =>
  element.shadowRoot!.querySelector(".zb-switch__state")!.textContent;
const polite = (element: ZbSwitchElement) =>
  element.shadowRoot!.querySelector('[role="status"]')!.textContent;
const assertive = (element: ZbSwitchElement) =>
  element.shadowRoot!.querySelector('[role="alert"]')!.textContent;

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("upgrade", () => {
  it("defines itself on import", () => {
    expect(customElements.get("zb-switch")).toBeTruthy();
  });

  it("drops the accessible name when the label is cleared", () => {
    const element = mount({ label: "Contact precautions", value: "on" });
    expect(control(element).getAttribute("aria-label")).toBe("Contact precautions");

    element.setAttribute("label", "");
    expect(control(element).hasAttribute("aria-label")).toBe(false);

    element.setAttribute("label", "Falls risk");
    element.removeAttribute("label");
    expect(control(element).hasAttribute("aria-label")).toBe(false);
  });

  it("upgrades with a shadow root and a real switch inside it", () => {
    const element = mount({ label: "Contact precautions", value: "on" });
    expect(element.shadowRoot).toBeTruthy();
    expect(control(element).getAttribute("role")).toBe("switch");
    expect(control(element).getAttribute("aria-checked")).toBe("true");
  });

  it("exposes its state on the host, where a host application can query it", () => {
    // A role or a state buried in a shadow tree is reachable by assistive
    // technology but invisible to the host's own tests and queries.
    const element = mount({ label: "Contact precautions", value: "on", tone: "caution" });
    expect(element.getAttribute("data-zb-state")).toBe("on");
    expect(element.getAttribute("data-zb-tone")).toBe("caution");
    expect(element.hasAttribute("data-zb-switch")).toBe(true);
  });
});

describe("value", () => {
  it.each(["on", "off", "unknown"] as const)("reflects value=%s", (value) => {
    const element = mount({ label: "Advance directive", value });
    expect(element.value).toBe(value);
    expect(element.getAttribute("data-zb-state")).toBe(value);
  });

  it("reports mixed for an absent value", () => {
    const element = mount({ label: "Advance directive", value: "unknown" });
    expect(control(element).getAttribute("aria-checked")).toBe("mixed");
  });

  it.each(Object.keys(ABSENT_REASON_LABEL))("renders a distinct word for %s", (reason) => {
    const element = mount({
      label: "Advance directive",
      value: "unknown",
      "absent-reason": reason,
    });
    expect(stateWord(element)).toBe(
      ABSENT_REASON_LABEL[reason as keyof typeof ABSENT_REASON_LABEL],
    );
  });

  it("renders the preset's words rather than On and Off", () => {
    const element = mount({ label: "Contact", value: "off", "state-labels": "in-effect" });
    expect(stateWord(element)).toBe("Not in effect");
  });

  it("updates when the property is set, not only the attribute", () => {
    const element = mount({ label: "Contact", value: "off" });
    element.value = "on";
    expect(control(element).getAttribute("aria-checked")).toBe("true");
    expect(stateWord(element)).toBe("On");
  });
});

describe("requests", () => {
  it("asks rather than deciding — the host owns the write", () => {
    const element = mount({ label: "Contact precautions", value: "off" });
    const spy = vi.fn();
    element.addEventListener("zb-switch-request", spy);

    control(element).click();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].detail).toEqual({ value: "on", from: "off" });
    // Nothing changed on its own. An element that commits optimistically is the
    // failure this whole component exists to prevent.
    expect(element.value).toBe("off");
  });

  it("dispatches an event that crosses the shadow boundary and bubbles", () => {
    const element = mount({ label: "Contact", value: "off" });
    const spy = vi.fn();
    document.addEventListener("zb-switch-request", spy);
    control(element).click();
    expect(spy).toHaveBeenCalledTimes(1);
    document.removeEventListener("zb-switch-request", spy);
  });

  it("commits the affirmative from unknown, and never returns to it", () => {
    const element = mount({ label: "Latex allergy", value: "unknown" });
    const spy = vi.fn();
    element.addEventListener("zb-switch-request", spy);

    control(element).click();
    expect(spy.mock.calls[0][0].detail.value).toBe("on");

    element.value = "on";
    control(element).click();
    expect(spy.mock.calls[1][0].detail.value).toBe("off");
    element.value = "off";
    control(element).click();
    expect(spy.mock.calls[2][0].detail.value).toBe("on");

    const requested = spy.mock.calls.map((call) => call[0].detail.value);
    expect(requested).not.toContain("unknown");
  });

  it("offers a keyboard-reachable path to record the negative from unknown", () => {
    const element = mount({ label: "Latex allergy", value: "unknown", "state-labels": "yes-no" });
    const negative = element.shadowRoot!.querySelectorAll("button")[1]!;
    expect(negative.textContent).toBe("Record no for Latex allergy");
    expect(negative.hidden).toBe(false);

    const spy = vi.fn();
    element.addEventListener("zb-switch-request", spy);
    negative.click();
    expect(spy.mock.calls[0][0].detail.value).toBe("off");
  });

  it("hides the negative affordance once an answer exists", () => {
    const element = mount({ label: "Latex allergy", value: "on" });
    expect(element.shadowRoot!.querySelectorAll("button")[1]!.hidden).toBe(true);
  });

  it("refuses to request from a read-only or disabled control", () => {
    for (const attribute of ["readonly", "disabled"]) {
      const element = mount({ label: "Consent", value: "off", [attribute]: "" });
      const spy = vi.fn();
      element.addEventListener("zb-switch-request", spy);
      control(element).click();
      expect(spy, attribute).not.toHaveBeenCalled();
    }
  });
});

describe("phase", () => {
  it("keeps the control operable while pending", () => {
    const element = mount({ label: "Contact", value: "on", phase: "pending" });
    expect(control(element).getAttribute("aria-busy")).toBe("true");
    expect(control(element).hasAttribute("disabled")).toBe(false);
    expect(control(element).hasAttribute("aria-disabled")).toBe(false);
  });

  it("announces a success politely and a failure assertively", () => {
    const element = mount({
      label: "Contact precautions",
      value: "on",
      "state-labels": "in-effect",
    });

    element.phase = "committed";
    expect(polite(element)).toBe("Contact precautions: in effect.");
    expect(assertive(element)).toBe("");

    element.phase = "reverted";
    element.error = "Could not reach the record.";
    // "Still {state}" is the clause that tells a listener what is true now.
    expect(assertive(element)).toContain("was not changed");
    expect(assertive(element)).toContain("Still in effect");
  });

  it("says a queued change has not been sent", () => {
    const element = mount({ label: "Falls risk", value: "on", phase: "queued" });
    expect(polite(element)).toContain("Not sent yet");
  });

  it("reflects every phase onto the host for styling", () => {
    const element = mount({ label: "Contact", value: "on" });
    for (const phase of [
      "idle",
      "pending",
      "committed",
      "reverted",
      "blocked",
      "queued",
      "stale",
    ] as const) {
      element.phase = phase;
      expect(element.getAttribute("data-zb-phase")).toBe(phase);
    }
  });
});

describe("availability", () => {
  it("marks read-only without leaving the tab order", () => {
    const element = mount({ label: "Consent", value: "on", readonly: "" });
    expect(control(element).getAttribute("aria-readonly")).toBe("true");
    expect(control(element).hasAttribute("disabled")).toBe(false);
    expect(control(element).tabIndex).toBe(0);
  });

  it("renders the locked reason as text", () => {
    const element = mount({
      label: "Consent",
      value: "on",
      readonly: "",
      "locked-reason": "Encounter signed 14:32.",
    });
    expect(element.shadowRoot!.textContent).toContain("Encounter signed 14:32.");
  });

  it("marks disabled with aria-disabled rather than only visually", () => {
    const element = mount({ label: "Consent", value: "on", disabled: "" });
    expect(control(element).getAttribute("aria-disabled")).toBe("true");
  });
});

describe("geometry", () => {
  it.each(Object.keys(SWITCH_SIZE))("size=%s writes the geometry custom properties", (size) => {
    const element = mount({ label: "NPO", value: "on", size });
    const { track, thumb } = SWITCH_SIZE[size as keyof typeof SWITCH_SIZE];
    expect(element.style.getPropertyValue("--zb-switch-track-w")).toBe(`${track[0]}px`);
    expect(element.style.getPropertyValue("--zb-switch-track-h")).toBe(`${track[1]}px`);
    expect(element.style.getPropertyValue("--zb-switch-thumb-size")).toBe(`${thumb}px`);
  });

  it("never writes the hit-area token, so density governs the target", () => {
    const element = mount({ label: "NPO", value: "on", size: "micro" });
    expect(element.style.getPropertyValue("--zb-switch-target-min")).toBe("");
  });
});

describe("safety", () => {
  /**
   * A clinical control is not a place to introduce an injection sink, and every
   * string here can carry a caller-supplied label or a server error message.
   */
  it("sets caller-supplied text with textContent, never innerHTML", () => {
    const element = mount({
      label: "<img src=x onerror=alert(1)>",
      value: "on",
      "locked-reason": "<script>bad()</script>",
      readonly: "",
    });
    const shadow = element.shadowRoot!;
    expect(shadow.querySelector("img")).toBeNull();
    expect(shadow.querySelector("script")).toBeNull();
    expect(shadow.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("keeps the label out of the announcement as markup", () => {
    const element = mount({ label: "<b>Contact</b>", value: "on", phase: "committed" });
    expect(element.shadowRoot!.querySelector('[role="status"]')!.querySelector("b")).toBeNull();
  });
});

describe("presets", () => {
  it("gives on, off and unknown their own word in every preset", () => {
    for (const [name, labels] of Object.entries(STATE_LABEL_PRESETS)) {
      expect(new Set([labels.on, labels.off, labels.unknown]).size, name).toBe(3);
    }
  });
});
