/**
 * The panel.
 *
 * Two things are being protected. The first is that the numbers on screen are
 * the numbers the gate measured — a rounding applied at render time is how a
 * row comes to read "4.50:1, below the 4.5:1 floor". The second is that the
 * panel is operable and readable without sight or a mouse, which is not a lower
 * bar because it happens to be running inside somebody else's canvas.
 */

import { beforeEach, describe, expect, it } from "vitest";

import { runGate, type GateReport } from "../src/gate";
import { renderReport } from "../src/ui/render";
import { wireCopy } from "../src/ui/copy";
import { colour, zoblocksFile, snapshot } from "./fixture";

const ZOBLOCKS = "ZoBlocks / Semantic";

let root: HTMLElement;

beforeEach(() => {
  document.body.textContent = "";
  root = document.createElement("div");
  document.body.append(root);
});

const failing = (): GateReport =>
  runGate(zoblocksFile({ "--zb-text-muted": "#a8b0bb" }), {
    collection: ZOBLOCKS,
    figmaMode: "light",
  });

const text = () => root.textContent ?? "";

describe("the summary", () => {
  it("leads with the count, not with a tick", () => {
    renderReport(root, failing());
    expect(root.querySelector(".count")!.textContent).toMatch(/^\d+ of \d+ pairs fail$/);
  });

  it("says everything passed when everything passed", () => {
    renderReport(root, runGate(zoblocksFile(), { collection: ZOBLOCKS, figmaMode: "light" }));
    expect(root.querySelector(".count")!.textContent).toMatch(/^All \d+ pairs pass$/);
    expect(root.querySelector(".summary")!.getAttribute("data-state")).toBe("pass");
  });

  it("states which reading it gave", () => {
    renderReport(root, runGate(zoblocksFile(), { collection: ZOBLOCKS, figmaMode: "light" }));
    expect(text()).toContain("the same list the build and the publish gate enforce");

    const palette = runGate(
      snapshot([
        colour("Paper", "#ffffff", { collection: "Swatches" }),
        colour("Mist", "#c9d1d9", { collection: "Swatches" }),
      ]),
      { collection: "Swatches", figmaMode: "light" },
    );
    renderReport(root, palette);
    // A passing palette measurement is not the same claim as a passing theme,
    // and a designer who does not know which they got will read it as the
    // stronger one.
    expect(text()).toContain("No ZoBlocks tokens here");
  });

  it("names the mode and the floors applied", () => {
    renderReport(
      root,
      runGate(zoblocksFile({}, "dark"), { collection: ZOBLOCKS, figmaMode: "dark" }),
    );
    expect(root.querySelector(".where")!.textContent).toContain("dark");
  });
});

describe("a row", () => {
  it("shows the measured ratio, the floor, and the criterion that imposes it", () => {
    const report = failing();
    renderReport(root, report);

    const row = [...root.querySelectorAll("tbody tr")].find((tr) =>
      tr.textContent?.includes("text-muted"),
    )!;
    const reading = report.readings.find((r) => r.fg === "text-muted" && r.bg === "bg")!;

    expect(row.getAttribute("data-state")).toBe("fail");
    expect(row.textContent).toContain(`${reading.ratio.toFixed(2)}:1`);
    expect(row.textContent).toContain("4.50:1");
    expect(row.textContent).toContain("SC 1.4.3 (text)");
  });

  it("prints the ratio the gate judged, at the precision it judged it", () => {
    const report = failing();
    renderReport(root, report);
    for (const reading of report.readings) {
      // Judging a raw float and printing a rounded one is how a row comes to
      // read "4.50:1, below the 4.5:1 floor" — true, and indistinguishable from
      // a bug to whoever reads it.
      expect(text()).toContain(`${reading.ratio.toFixed(2)}:1`);
    }
  });

  it("hides the swatch from a screen reader, because the row already says it", () => {
    renderReport(root, failing());
    const swatch = root.querySelector(".swatch")!;
    expect(swatch.getAttribute("aria-hidden")).toBe("true");
  });

  it("puts failures before passes", () => {
    renderReport(root, failing());
    const groups = [...root.querySelectorAll(".group")];
    expect(groups[0]!.textContent).toMatch(/^Failing/);
  });

  it("collapses the passing rows but keeps them reachable", () => {
    renderReport(root, failing());
    const passing = [...root.querySelectorAll("details.group")].find((d) =>
      d.querySelector("summary")?.textContent?.startsWith("Passing"),
    );
    expect(passing).toBeDefined();
    expect(passing!.querySelectorAll("tbody tr").length).toBeGreaterThan(0);
  });
});

describe("the suggestion", () => {
  it("offers a value rather than applying one", () => {
    renderReport(root, failing());
    const button = root.querySelector<HTMLButtonElement>("button[data-copy]")!;
    expect(button.dataset.copy).toMatch(/^#[0-9a-f]{6}$/);
    expect(button.getAttribute("aria-label")).toContain("nearest passing shade");
  });

  it("copies it, and says so", async () => {
    const written: string[] = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (value: string) => {
          written.push(value);
          return Promise.resolve();
        },
      },
    });

    renderReport(root, failing());
    wireCopy(root);

    const button = root.querySelector<HTMLButtonElement>("button[data-copy]")!;
    button.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(written).toEqual([button.dataset.copy]);
    expect(button.dataset.state).toBe("copied");
  });

  it("selects the value instead when the clipboard is unreachable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () => Promise.reject(new Error("blocked")),
      },
    });

    renderReport(root, failing());
    wireCopy(root);

    const button = root.querySelector<HTMLButtonElement>("button[data-copy]")!;
    button.click();
    await Promise.resolve();
    await Promise.resolve();

    // A worse experience than a button, and a much better one than a button
    // that does nothing.
    expect(window.getSelection()?.toString()).toBe(button.dataset.copy);
    expect(button.dataset.state).toBeUndefined();
  });
});

describe("what the panel refuses to hide", () => {
  it("reports hue separation in the validator's own words", () => {
    renderReport(
      root,
      runGate(zoblocksFile({ "--zb-status-high": "#8a1c22", "--zb-status-low": "#a02216" }), {
        collection: ZOBLOCKS,
        figmaMode: "light",
      }),
    );
    expect(root.querySelector(".finding")!.textContent).toContain(
      "survives monochrome output and colour vision deficiency",
    );
  });

  it("lists pairs it could not measure, and says they are not passes", () => {
    const report = runGate(
      snapshot([colour("text", "#16181d", { token: "--zb-text", collection: ZOBLOCKS })]),
      { collection: ZOBLOCKS, figmaMode: "light" },
    );
    renderReport(root, report);
    expect(text()).toContain("Not in this collection");
    expect(text()).toContain("not a pass either");
  });

  it("says nothing was measured rather than showing an empty table", () => {
    renderReport(root, runGate(snapshot([]), { collection: "Swatches", figmaMode: "light" }));
    expect(text()).toContain("No colour variables in this collection");
    expect(root.querySelector("table")).toBeNull();
  });

  it("clears the previous report before drawing the next", () => {
    renderReport(root, failing());
    renderReport(root, runGate(zoblocksFile(), { collection: ZOBLOCKS, figmaMode: "light" }));
    expect(root.querySelectorAll(".summary")).toHaveLength(1);
    expect(text()).not.toContain("pairs fail");
  });
});

describe("the rows with nothing to offer", () => {
  it("says so when no shade of a colour can clear the floor", () => {
    // White on white: every shade of white is white, and lightness is the only
    // axis `nearestPassing` moves along, so there is genuinely nothing to
    // suggest. Saying nothing would read as "no fix needed".
    const report: GateReport = {
      mode: "zoblocks",
      collection: "ZoBlocks / Semantic",
      figmaMode: "light",
      theme: "light",
      findings: [],
      missing: [],
      unstamped: [],
      readings: [
        {
          fg: "text",
          bg: "bg",
          fgValue: "#ffffff",
          bgValue: "#ffffff",
          kind: "text",
          criterion: "SC 1.4.3 (text)",
          ratio: 1,
          floor: 4.5,
          passes: false,
        },
      ],
    };

    renderReport(root, report);
    expect(text()).toContain("No shade of this colour clears the floor");
    expect(root.querySelector("button[data-copy]")).toBeNull();
  });

  it("lists the unstamped variables it left alone", () => {
    renderReport(
      root,
      runGate(
        snapshot([
          ...zoblocksFile().variables,
          colour("Scratch pink", "#ff00ff", { collection: ZOBLOCKS }),
        ]),
        { collection: ZOBLOCKS, figmaMode: "light" },
      ),
    );
    expect(text()).toContain("Not ZoBlocks tokens (1)");
    expect(text()).toContain("They are left alone");
  });

  it("does not repeat the swatch list in a palette reading", () => {
    // In palette mode every colour is unstamped by definition, so the same
    // block would restate the collection the designer just picked.
    renderReport(
      root,
      runGate(
        snapshot([
          colour("Paper", "#ffffff", { collection: "Swatches" }),
          colour("Mist", "#c9d1d9", { collection: "Swatches" }),
        ]),
        { collection: "Swatches", figmaMode: "light" },
      ),
    );
    expect(text()).not.toContain("Not ZoBlocks tokens");
  });
});

describe("readable without sight", () => {
  it("gives every table a header row with scoped columns", () => {
    renderReport(root, failing());
    for (const table of root.querySelectorAll("table")) {
      const headers = [...table.querySelectorAll("thead th")];
      expect(headers.length).toBe(5);
      expect(headers.every((th) => th.getAttribute("scope") === "col")).toBe(true);
    }
  });

  it("makes the pair the row header, so a cell is announced with its pair", () => {
    renderReport(root, failing());
    const row = root.querySelector("tbody tr")!;
    const header = row.querySelector("th")!;
    expect(header.getAttribute("scope")).toBe("row");
    expect(header.textContent).toContain(" on ");
  });
});

describe("copying, at the edges", () => {
  it("ignores a click that is not on a suggestion", () => {
    renderReport(root, failing());
    wireCopy(root);
    // No throw, and nothing marked copied.
    root.querySelector("table")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(root.querySelector("[data-state='copied']")).toBeNull();
  });

  it("does nothing when there is no clipboard and no value to select", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });

    const button = document.createElement("button");
    button.dataset.copy = "#123456";
    root.append(button);
    wireCopy(root);

    // A button with no `<code>` inside it: the fallback has nothing to select,
    // and must fail quietly rather than throwing inside an event handler.
    button.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(button.dataset.state).toBeUndefined();
  });
});
