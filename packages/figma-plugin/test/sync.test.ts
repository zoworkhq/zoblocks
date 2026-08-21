/**
 * The three screens that talk to a server, and what they say before they do.
 *
 * The counts are computed elsewhere and tested there. What is asserted here is
 * the sentence a designer reads on the way to agreeing — which is the part that
 * decides whether "apply" is an informed click or a hopeful one.
 */

import { beforeEach, describe, expect, it } from "vitest";

import { renderConnect, renderPull, renderPush } from "../src/ui/sync";
import { renderControls } from "../src/ui/controls";
import { renderTabs } from "../src/ui/tabs";
import { previewPull } from "../src/pull";
import type { ResolvedPayload, ThemeSummary } from "../src/app";
import { snapshot } from "./fixture";

const payload: ResolvedPayload = {
  slug: "clinical",
  name: "Clinical",
  version: 3,
  status: "published",
  ramp: { "600": "#1d63c9" },
  semantic: {
    light: { "--ox-accent": "#1851a5", "--ox-status-critical": "#b4232b" },
    dark: { "--ox-accent": "#5a94e7", "--ox-status-critical": "#f08b96" },
    "high-contrast": { "--ox-accent": "#0f3568", "--ox-status-critical": "#8c0d16" },
  },
  locked: { "--ox-status-critical": "Clinical. Carries a validated contrast floor." },
};

const THEMES: ThemeSummary[] = [
  { slug: "clinical", name: "Clinical", status: "published", liveVersion: 4, updatedAt: "" },
  { slug: "oncology", name: "Oncology", status: "draft", liveVersion: null, updatedAt: "" },
];

let root: HTMLElement;
const text = () => root.textContent ?? "";
const noop = () => {};

beforeEach(() => {
  document.body.textContent = "";
  root = document.createElement("div");
  document.body.append(root);
});

describe("connecting", () => {
  it("labels both fields and masks the key", () => {
    renderConnect(root, { onConnect: noop, onDisconnect: noop });

    for (const input of root.querySelectorAll("input")) {
      expect(root.querySelector(`label[for="${input.id}"]`), input.name).not.toBeNull();
    }
    // Not because it is a password, but because designers screen-share, and a
    // bearer token in plain text during a review is how one leaks.
    expect(root.querySelector<HTMLInputElement>("input[name=token]")!.type).toBe("password");
  });

  it("says where to get a key and what it can do", () => {
    renderConnect(root, { onConnect: noop, onDisconnect: noop });
    expect(text()).toContain("Market → Tokens");
    expect(text()).toContain("cannot publish");
  });

  it("hands both values over on submit", () => {
    const got: string[][] = [];
    renderConnect(root, { onConnect: (o, t) => got.push([o, t]), onDisconnect: noop });

    root.querySelector<HTMLInputElement>("input[name=origin]")!.value = "https://c.example";
    root.querySelector<HTMLInputElement>("input[name=token]")!.value = "oxy_live_abc";
    root.querySelector("form")!.dispatchEvent(new Event("submit", { cancelable: true }));

    expect(got).toEqual([["https://c.example", "oxy_live_abc"]]);
  });

  it("raises a refusal to a screen reader rather than only showing it", () => {
    renderConnect(root, {
      invalid: "That is not an app address.",
      onConnect: noop,
      onDisconnect: noop,
    });
    expect(root.querySelector("[role=alert]")?.textContent).toContain("not an app address");
  });

  it("offers to disconnect once connected, and never shows the key again", () => {
    const credential = { origin: "https://c.example", token: "oxy_live_secret" };
    renderConnect(root, { credential, onConnect: noop, onDisconnect: noop });

    expect(text()).toContain("https://c.example");
    expect(text()).not.toContain("oxy_live_secret");
    expect(root.querySelector("button")!.textContent).toBe("Disconnect");
  });
});

describe("the pull screen", () => {
  const preview = (file = snapshot([])) => previewPull(payload, file);

  it("says which version the file is on and which is live", () => {
    renderPull(root, {
      themes: THEMES,
      chosen: "clinical",
      pinned: { slug: "clinical", version: 3 },
      onChoose: noop,
      onPreview: noop,
      onApply: noop,
    });
    expect(text()).toContain("This file is on clinical v3; v4 is live.");
  });

  it("says so plainly when the file is already on the live version", () => {
    renderPull(root, {
      themes: THEMES,
      chosen: "clinical",
      pinned: { slug: "clinical", version: 4 },
      onChoose: noop,
      onPreview: noop,
      onApply: noop,
    });
    expect(text()).toContain("which is live");
  });

  it("leads the preview with what will change, not with a button", () => {
    renderPull(root, {
      themes: THEMES,
      chosen: "clinical",
      preview: preview(),
      onChoose: noop,
      onPreview: noop,
      onApply: noop,
    });
    expect(root.querySelector(".count")!.textContent).toMatch(/\d+ created/);
  });

  it("offers no apply button when there is nothing to apply", () => {
    const plan = preview().plan;
    const already = snapshot(
      plan.variables.map((v) => ({
        token: v.token,
        name: v.name,
        collection: v.collection,
        values: v.values,
      })),
    );

    renderPull(root, {
      themes: THEMES,
      chosen: "clinical",
      preview: preview(already),
      onChoose: noop,
      onPreview: noop,
      onApply: noop,
    });

    expect(text()).toContain("Nothing to change");
    expect([...root.querySelectorAll("button")].map((b) => b.textContent)).not.toContain(
      "Apply to this file",
    );
  });

  it("warns before moving a file backwards, without blocking it", () => {
    const older = previewPull({ ...payload, version: 2 }, snapshot([]), {
      pinned: { slug: "clinical", version: 4 },
    });
    renderPull(root, {
      themes: THEMES,
      chosen: "clinical",
      preview: older,
      onChoose: noop,
      onPreview: noop,
      onApply: noop,
    });

    // Legitimate on purpose, and also how somebody undoes a week by misclicking.
    expect(root.querySelector(".finding")!.textContent).toContain("moves the file back");
    expect([...root.querySelectorAll("button")].map((b) => b.textContent)).toContain(
      "Apply to this file",
    );
  });

  it("warns when the file was pulled from a different theme", () => {
    const swapped = previewPull(payload, snapshot([]), {
      pinned: { slug: "oncology", version: 1 },
    });
    renderPull(root, {
      themes: THEMES,
      preview: swapped,
      onChoose: noop,
      onPreview: noop,
      onApply: noop,
    });
    expect(text()).toContain("replaces it with clinical");
  });

  it("names what it is putting back, and why", () => {
    const edited = snapshot([
      {
        token: "--ox-status-critical",
        name: "status/critical",
        collection: "Oxygen / Semantic",
        values: { light: { kind: "color", hex: "#ff00ff", rgb: { r: 1, g: 0, b: 1 } } },
      },
    ]);
    renderPull(root, {
      themes: THEMES,
      preview: preview(edited),
      onChoose: noop,
      onPreview: noop,
      onApply: noop,
    });

    expect(text()).toContain("clinical variable");
    expect(text()).toContain("60°");
  });

  it("promises not to delete an orphan, in the place it lists them", () => {
    const stale = snapshot([
      { token: "--ox-legacy", name: "legacy", collection: "Oxygen / Semantic", values: {} },
    ]);
    renderPull(root, {
      themes: THEMES,
      preview: preview(stale),
      onChoose: noop,
      onPreview: noop,
      onApply: noop,
    });

    expect(text()).toContain("No longer in this theme (1)");
    expect(text()).toContain("cannot delete a variable");
  });

  it("says the organisation is empty rather than showing a blank picker", () => {
    renderPull(root, { themes: [], onChoose: noop, onPreview: noop, onApply: noop });
    expect(text()).toContain("no themes yet");
  });
});

describe("the propose screen", () => {
  const base = { themes: THEMES, chosen: "clinical", anchor: "#1d63c9" };

  it("states what proposing does and does not do", () => {
    renderPush(root, { ...base, onChoose: noop, onAnchor: noop, onPropose: noop });
    expect(text()).toContain("cannot publish");
  });

  it("labels a local reading as one pair, not as the gate", () => {
    renderPush(root, {
      ...base,
      local: { ratio: 2.98, floor: 4.5, against: "text-on-accent", passes: false },
      onChoose: noop,
      onAnchor: noop,
      onPropose: noop,
    });

    expect(text()).toContain("2.98:1");
    // Claiming more than one pair here would be a false pass, which is worse
    // than no number at all.
    expect(text()).toContain("One pair, measured here");
    expect(text()).toContain("the app checks the rest");
  });

  it("shows the app's measured refusal in full", () => {
    renderPush(root, {
      ...base,
      outcome: {
        error: "1 problem(s) with that ramp.",
        detail: ['text-on-accent on accent in theme "light" is 2.98:1'],
      },
      onChoose: noop,
      onAnchor: noop,
      onPropose: noop,
    });

    expect(root.querySelector("[role=alert]")).not.toBeNull();
    expect(text()).toContain("2.98:1");
  });

  it("hands back a link and says nothing is live", () => {
    renderPush(root, {
      ...base,
      outcome: { url: "https://c.example/themes/clinical/brand", steps: 11 },
      onChoose: noop,
      onAnchor: noop,
      onPropose: noop,
    });

    expect(text()).toContain("Nothing is live yet");
    expect(root.querySelector("a")!.href).toBe("https://c.example/themes/clinical/brand");
  });

  it("reports the colour as it is typed", () => {
    const typed: string[] = [];
    renderPush(root, { ...base, onChoose: noop, onAnchor: (h) => typed.push(h), onPropose: noop });

    const input = root.querySelector<HTMLInputElement>("#push-anchor")!;
    input.value = "#0f766e";
    input.dispatchEvent(new Event("input"));
    expect(typed).toEqual(["#0f766e"]);
  });
});

describe("the tab strip", () => {
  it("is a tablist with one selected tab", () => {
    renderTabs(root, { active: "check", connected: true, onSelect: noop });
    expect(root.getAttribute("role")).toBe("tablist");

    const tabs = [...root.querySelectorAll("[role=tab]")];
    expect(tabs).toHaveLength(3);
    expect(tabs.filter((t) => t.getAttribute("aria-selected") === "true")).toHaveLength(1);
  });

  it("keeps Tab reaching the strip once, not three times", () => {
    renderTabs(root, { active: "pull", connected: true, onSelect: noop });
    const tabs = [...root.querySelectorAll<HTMLButtonElement>("[role=tab]")];
    expect(tabs.filter((t) => t.tabIndex === 0)).toHaveLength(1);
    expect(tabs.find((t) => t.tabIndex === 0)!.dataset.pane).toBe("pull");
  });

  it("disables what needs an app, and says why", () => {
    renderTabs(root, { active: "check", connected: false, onSelect: noop });
    const disabled = [...root.querySelectorAll<HTMLButtonElement>("button")].filter(
      (b) => b.disabled,
    );
    expect(disabled.map((b) => b.dataset.pane)).toEqual(["pull", "push"]);
    // A grey button with no explanation is a dead end.
    expect(disabled[0]!.title).toContain("Connect");
  });

  it("moves with the arrow keys and skips what it cannot reach", () => {
    const chosen: string[] = [];
    renderTabs(root, { active: "check", connected: false, onSelect: (p) => chosen.push(p) });

    root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    // Pull and push are disabled, so right from check wraps back to check
    // rather than focusing a tab that does nothing.
    expect(chosen).toEqual(["check"]);
  });

  it("moves between tabs when they are all reachable", () => {
    const chosen: string[] = [];
    renderTabs(root, { active: "check", connected: true, onSelect: (p) => chosen.push(p) });

    root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(chosen).toEqual(["pull"]);
  });
});

describe("the radio group when nothing changes", () => {
  it("reports nothing when a radio is cleared rather than chosen", () => {
    // Browsers fire `change` on the radio losing selection too. Reporting that
    // would emit the value the designer just moved *away* from.
    const changes: unknown[] = [];
    const paletteOnly = {
      id: "c2",
      name: "Swatches",
      modes: ["Mode 1"],
      stamped: 0,
      colours: 3,
    };

    renderControls(root, {
      collections: [paletteOnly],
      grounds: ["Paper"],
      value: { collection: "Swatches", mode: "Mode 1", kind: "text" },
      onChange: (c) => changes.push(c),
    });

    const ui = root.querySelector<HTMLInputElement>("input[value='ui']")!;
    const text = root.querySelector<HTMLInputElement>("input[value='text']")!;
    text.checked = false;
    text.dispatchEvent(new Event("change"));
    expect(changes).toEqual([]);

    ui.checked = true;
    ui.dispatchEvent(new Event("change"));
    expect(changes).toHaveLength(1);
  });
});
