/**
 * The capture engine, driven by synthetic pointer sequences.
 *
 * No DOM, no canvas, no headless browser. That is the whole payoff of keeping
 * the engine pure: the properties below are *asserted*, not eyeballed, and
 * they run in milliseconds.
 *
 * Each block corresponds to a failure that ships in real signature pads:
 * a resting palm drawing a second line, a stray tap committing as a legal
 * signature, "Back" destroying work with no way forward, and an export that
 * differs between runs so nobody trusts the visual-regression suite.
 */

import { describe, expect, it } from "vitest";
import { SignatureCapture, type Sample } from "../src/capture.js";
import { assessInk, inkBounds, pathLength, speeds } from "../src/strokes.js";
import { toSVG } from "../src/export.js";

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

/** A plausible signature: three strokes, sampled at ~60 Hz. */
function scribble(
  pad: SignatureCapture,
  opts: { pointerType?: Sample["pointerType"]; t0?: number; strokes?: number } = {},
): void {
  const type = opts.pointerType ?? "pen";
  let t = opts.t0 ?? 0;
  const count = opts.strokes ?? 3;

  for (let s = 0; s < count; s++) {
    const x0 = 20 + s * 70;
    pad.down({ x: x0, y: 60, t, pointerType: type, pointerId: 1, pressure: 0.5 });
    for (let i = 1; i <= 12; i++) {
      t += 16;
      pad.move({
        x: x0 + i * 5,
        y: 60 + Math.sin(i / 2) * 22,
        t,
        pointerType: type,
        pointerId: 1,
        pressure: 0.5,
      });
    }
    pad.up({ x: x0 + 60, y: 60, t, pointerType: type, pointerId: 1 });
    t += 120;
  }
}

/* ------------------------------------------------------------------ */

describe("capture", () => {
  it("records a stroke from down through move to up", () => {
    const pad = new SignatureCapture();
    expect(pad.down({ x: 0, y: 0, t: 0 })).toBe(true);
    expect(pad.move({ x: 10, y: 10, t: 16 })).toBe(true);
    expect(pad.up({ x: 20, y: 0, t: 32 })).toBe(true);

    expect(pad.strokes).toHaveLength(1);
    expect(pad.strokes[0]!.points).toHaveLength(3);
  });

  it("ignores a move with no stroke in progress", () => {
    const pad = new SignatureCapture();
    expect(pad.move({ x: 5, y: 5, t: 0 })).toBe(false);
    expect(pad.strokes).toHaveLength(0);
  });

  it("drops repeated identical samples", () => {
    // Pointer events fire on a timer as well as on motion, so a stylus held
    // still otherwise accumulates hundreds of identical points.
    const pad = new SignatureCapture();
    pad.down({ x: 4, y: 4, t: 0 });
    pad.move({ x: 4, y: 4, t: 16 });
    pad.move({ x: 4, y: 4, t: 32 });
    pad.up();
    expect(pad.strokes[0]!.points).toHaveLength(1);
  });

  it("defaults pressure to neutral, and clamps nonsense", () => {
    const pad = new SignatureCapture();
    pad.down({ x: 0, y: 0, t: 0 });
    pad.move({ x: 1, y: 1, t: 8, pressure: 4 });
    pad.move({ x: 2, y: 2, t: 16, pressure: Number.NaN });
    pad.up();

    const [a, b, c] = pad.strokes[0]!.points;
    expect(a!.pressure).toBe(0.5);
    expect(b!.pressure).toBe(1);
    expect(c!.pressure).toBe(0.5);
  });

  it("cancel abandons the stroke instead of committing it", () => {
    // pointercancel fires when the browser takes the gesture — a scroll
    // starting, a system edge swipe. Committing half a stroke there leaves a
    // stray line the person did not draw and cannot explain.
    const pad = new SignatureCapture();
    pad.down({ x: 0, y: 0, t: 0 });
    pad.move({ x: 30, y: 30, t: 16 });
    expect(pad.cancel()).toBe(true);
    expect(pad.strokes).toHaveLength(0);
  });

  it("refuses a second contact while one is active", () => {
    const pad = new SignatureCapture();
    pad.down({ x: 0, y: 0, t: 0, pointerId: 1 });
    expect(pad.down({ x: 50, y: 50, t: 4, pointerId: 2 })).toBe(false);
    pad.move({ x: 90, y: 90, t: 8, pointerId: 2 });

    // The second pointer contributed nothing.
    pad.up({ x: 10, y: 10, t: 12, pointerId: 1 });
    expect(pad.strokes).toHaveLength(1);
    expect(inkBounds(pad.strokes).width).toBeLessThan(50);
  });
});

describe("palm rejection", () => {
  it("ignores touch once a pen has been seen", () => {
    // The resting-palm problem. Browsers report the palm as a legitimate touch
    // pointer, so this heuristic is the only thing between a signature and a
    // line drawn across it by the side of someone's hand.
    const pad = new SignatureCapture();
    pad.down({ x: 0, y: 0, t: 0, pointerType: "pen" });
    pad.up({ x: 20, y: 20, t: 16, pointerType: "pen" });

    expect(pad.down({ x: 200, y: 90, t: 20, pointerType: "touch" })).toBe(false);
    expect(pad.strokes).toHaveLength(1);
  });

  it("is sticky across strokes, because a palm can land before the nib", () => {
    const pad = new SignatureCapture();
    pad.down({ x: 0, y: 0, t: 0, pointerType: "pen" });
    pad.up({ x: 10, y: 10, t: 8, pointerType: "pen" });
    pad.down({ x: 0, y: 0, t: 100, pointerType: "touch" });
    pad.down({ x: 30, y: 0, t: 120, pointerType: "pen" });
    pad.up({ x: 50, y: 20, t: 136, pointerType: "pen" });

    expect(pad.strokes.every((s) => s.pointerType === "pen")).toBe(true);
  });

  it("leaves touch alone when no pen is involved", () => {
    // Most patients sign with a finger. Rejecting touch outright would break
    // the common case to fix the rare one.
    const pad = new SignatureCapture();
    pad.down({ x: 0, y: 0, t: 0, pointerType: "touch" });
    pad.up({ x: 40, y: 20, t: 16, pointerType: "touch" });
    expect(pad.strokes).toHaveLength(1);
  });

  it("can be turned off", () => {
    const pad = new SignatureCapture({ palmRejection: false });
    pad.down({ x: 0, y: 0, t: 0, pointerType: "pen" });
    pad.up({ x: 10, y: 10, t: 8, pointerType: "pen" });
    expect(pad.down({ x: 50, y: 50, t: 20, pointerType: "touch" })).toBe(true);
  });
});

describe("undo and redo", () => {
  it("undo then redo is the identity, for any number of strokes", () => {
    // Property rather than a worked example: an off-by-one in the redo stack
    // passes a single-stroke test and corrupts a three-stroke signature.
    for (const count of [1, 2, 3, 5, 8]) {
      const pad = new SignatureCapture();
      scribble(pad, { strokes: count });
      const before = JSON.stringify(pad.strokes);

      for (let i = 0; i < count; i++) expect(pad.undo()).toBe(true);
      expect(pad.strokes).toHaveLength(0);
      for (let i = 0; i < count; i++) expect(pad.redo()).toBe(true);

      expect(JSON.stringify(pad.strokes)).toBe(before);
    }
  });

  it("reports what is available rather than failing silently", () => {
    const pad = new SignatureCapture();
    expect(pad.canUndo).toBe(false);
    expect(pad.canRedo).toBe(false);
    expect(pad.undo()).toBe(false);

    scribble(pad, { strokes: 1 });
    expect(pad.canUndo).toBe(true);
    pad.undo();
    expect(pad.canRedo).toBe(true);
  });

  it("a new stroke discards the redo stack", () => {
    // Same rule as a text editor. Redoing onto a diverged history would
    // produce a signature the person never drew.
    const pad = new SignatureCapture();
    scribble(pad, { strokes: 2 });
    pad.undo();
    expect(pad.canRedo).toBe(true);

    scribble(pad, { strokes: 1, t0: 5000 });
    expect(pad.canRedo).toBe(false);
  });

  it("undo abandons a stroke still in progress", () => {
    const pad = new SignatureCapture();
    scribble(pad, { strokes: 1 });
    pad.down({ x: 300, y: 60, t: 900 });
    pad.move({ x: 320, y: 40, t: 916 });

    pad.undo();
    expect(pad.strokes).toHaveLength(0);
  });

  it("clear resets everything, including palm-rejection state", () => {
    const pad = new SignatureCapture();
    scribble(pad, { pointerType: "pen" });
    pad.clear();

    expect(pad.strokes).toHaveLength(0);
    expect(pad.canUndo).toBe(false);
    expect(pad.canRedo).toBe(false);
    // A cleared pad on a shared bedside tablet is a new patient. Touch must
    // work again.
    expect(pad.down({ x: 0, y: 0, t: 0, pointerType: "touch" })).toBe(true);
  });

  it("load restores a model for editing", () => {
    const source = new SignatureCapture();
    scribble(source);

    const pad = new SignatureCapture();
    pad.load(source.strokes);
    expect(JSON.stringify(pad.strokes)).toBe(JSON.stringify(source.strokes));
  });

  it("load copies rather than aliasing", () => {
    const source = new SignatureCapture();
    scribble(source, { strokes: 1 });
    const strokes = source.strokes;

    const pad = new SignatureCapture();
    pad.load(strokes);
    pad.clear();

    expect(strokes[0]!.points.length).toBeGreaterThan(0);
  });
});

describe("the minimum-ink gate", () => {
  it.each([
    ["a single tap", [{ x: 50, y: 50 }]],
    [
      "two taps in the same place",
      [
        { x: 50, y: 50 },
        { x: 51, y: 50 },
      ],
    ],
    [
      "a three-pixel twitch",
      [
        { x: 50, y: 50 },
        { x: 52, y: 51 },
        { x: 53, y: 50 },
      ],
    ],
  ])("rejects %s", (_label, points) => {
    // Without this, a stray tap on a tablet enables the commit button and a
    // dot becomes a legal signature. Nothing downstream can tell it apart.
    const pad = new SignatureCapture();
    points.forEach((p, i) => {
      if (i === 0) pad.down({ ...p, t: i * 16 });
      else pad.move({ ...p, t: i * 16 });
    });
    pad.up();
    expect(pad.isEmpty).toBe(true);
  });

  it("accepts a real signature", () => {
    const pad = new SignatureCapture();
    scribble(pad);
    expect(pad.isEmpty).toBe(false);
  });

  it("names which measures failed, so a UI can explain itself", () => {
    const pad = new SignatureCapture();
    pad.down({ x: 10, y: 10, t: 0 });
    pad.up({ x: 11, y: 10, t: 16 });

    const verdict = pad.snapshot().verdict;
    expect(verdict.ok).toBe(false);
    expect(verdict.failed).toContain("minPathLength");
    expect(verdict.failed).toContain("minDiagonal");
    expect(verdict.failed).toContain("minPoints");
  });

  it("needs all three measures — each alone has a hole", () => {
    // A slow press that never moves: plenty of points, no distance.
    const held = new SignatureCapture();
    held.down({ x: 40, y: 40, t: 0 });
    for (let i = 1; i < 30; i++) held.move({ x: 40 + i * 0.01, y: 40, t: i * 16 });
    held.up();
    expect(assessInk(held.strokes).failed).toContain("minPathLength");

    // A fast scribble in one spot: distance, but no spread.
    const dense = new SignatureCapture();
    dense.down({ x: 40, y: 40, t: 0 });
    for (let i = 1; i < 30; i++) dense.move({ x: 40 + (i % 2) * 4, y: 40, t: i * 16 });
    dense.up();
    expect(assessInk(dense.strokes).failed).toContain("minDiagonal");
  });

  it("takes a custom threshold", () => {
    const pad = new SignatureCapture({
      threshold: { minPathLength: 1, minDiagonal: 1, minPoints: 1 },
    });
    pad.down({ x: 0, y: 0, t: 0 });
    pad.move({ x: 3, y: 3, t: 16 });
    pad.up();
    expect(pad.isEmpty).toBe(false);
  });
});

describe("capture metadata", () => {
  it("measures duration from the samples, never from a clock", () => {
    // Reading Date.now() here would make identical input produce different
    // output — the thing that makes visual-regression suites flaky, and on a
    // signature also an unverifiable timestamp in a legal record.
    const pad = new SignatureCapture();
    pad.down({ x: 0, y: 0, t: 1000 });
    pad.move({ x: 30, y: 30, t: 1500 });
    pad.up({ x: 60, y: 0, t: 2200 });
    expect(pad.durationMs).toBe(1200);
  });

  it("reports the pointer type, preferring pen when mixed", () => {
    const pen = new SignatureCapture();
    scribble(pen, { pointerType: "pen" });
    expect(pen.pointerType).toBe("pen");

    const finger = new SignatureCapture();
    scribble(finger, { pointerType: "touch" });
    expect(finger.pointerType).toBe("touch");

    expect(new SignatureCapture().pointerType).toBe("unknown");
  });

  it("caps retained strokes", () => {
    const pad = new SignatureCapture({ maxStrokes: 3 });
    for (let i = 0; i < 10; i++) {
      pad.down({ x: i * 10, y: 0, t: i * 100 });
      pad.up({ x: i * 10 + 5, y: 10, t: i * 100 + 16 });
    }
    expect(pad.strokes).toHaveLength(3);
  });
});

describe("derived geometry", () => {
  it("bounds are the tightest box containing every point", () => {
    const pad = new SignatureCapture();
    pad.down({ x: 10, y: 20, t: 0 });
    pad.move({ x: 90, y: 5, t: 16 });
    pad.up({ x: 50, y: 70, t: 32 });

    expect(inkBounds(pad.strokes)).toEqual({ x: 10, y: 5, width: 80, height: 65 });
  });

  it("empty strokes have zero bounds rather than Infinity", () => {
    expect(inkBounds([])).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });

  it("path length sums point to point", () => {
    const pad = new SignatureCapture();
    pad.down({ x: 0, y: 0, t: 0 });
    pad.move({ x: 3, y: 4, t: 16 }); // 5
    pad.up({ x: 3, y: 14, t: 32 }); // 10
    expect(pathLength(pad.strokes)).toBeCloseTo(15, 6);
  });

  it("the first speed inherits the second, never zero", () => {
    // A zero there renders the start of every stroke at maximum width, which
    // reads as a blot rather than a pen touching down.
    const points = [
      { x: 0, y: 0, t: 0, pressure: 0.5 },
      { x: 10, y: 0, t: 100, pressure: 0.5 },
      { x: 20, y: 0, t: 200, pressure: 0.5 },
    ];
    const v = speeds(points);
    expect(v[0]).toBe(v[1]);
    expect(v[0]).toBeGreaterThan(0);
  });

  it("survives a zero time delta without dividing by zero", () => {
    const v = speeds([
      { x: 0, y: 0, t: 5, pressure: 0.5 },
      { x: 10, y: 0, t: 5, pressure: 0.5 },
    ]);
    expect(Number.isFinite(v[1])).toBe(true);
  });
});

describe("export determinism", () => {
  it("identical input produces byte-identical SVG", () => {
    // This is what makes the visual-regression layer trustworthy. If the same
    // strokes could render two ways, a VRT failure would never be diagnosable.
    const a = new SignatureCapture();
    const b = new SignatureCapture();
    scribble(a);
    scribble(b);
    expect(toSVG(a.strokes)).toBe(toSVG(b.strokes));
  });

  it("rounds coordinates, so platform float noise cannot leak in", () => {
    const pad = new SignatureCapture();
    pad.down({ x: 1 / 3, y: 2 / 3, t: 0 });
    pad.move({ x: 10.987654321, y: 20.123456789, t: 16 });
    pad.up({ x: 30, y: 15, t: 32 });

    const svg = toSVG(pad.strokes);
    expect(svg).not.toMatch(/\d\.\d{3,}/);
  });

  it("carries no colour, so the same signature re-themes", () => {
    // Ink stored as dark pixels is invisible in dark mode. currentColor is
    // what lets one stored signature render correctly in light, dark, and
    // forced-colors without re-capture.
    const pad = new SignatureCapture();
    scribble(pad);
    expect(toSVG(pad.strokes)).toContain('stroke="currentColor"');
  });

  it("trims to the ink, with room for the stroke's own width", () => {
    // Without the bleed the outermost stroke is clipped by the viewBox — a
    // defect that only shows on signatures that reach the edge.
    const pad = new SignatureCapture();
    pad.down({ x: 100, y: 100, t: 0 });
    pad.move({ x: 160, y: 130, t: 16 });
    pad.up({ x: 220, y: 100, t: 32 });

    const svg = toSVG(pad.strokes, { margin: 10 });
    const view = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg);
    expect(view).not.toBeNull();

    const [x, y, w, h] = view!.slice(1).map(Number) as [number, number, number, number];
    expect(x).toBeLessThan(100 - 10);
    expect(y).toBeLessThan(100 - 10);
    expect(w).toBeGreaterThan(120 + 20);
    expect(h).toBeGreaterThan(30 + 20);
  });

  it("escapes the colour, because it reaches the markup", () => {
    // A signature is not a place to introduce an injection sink.
    const pad = new SignatureCapture();
    scribble(pad, { strokes: 1 });
    const svg = toSVG(pad.strokes, { color: '"><script>alert(1)</script>' });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&quot;&gt;&lt;script&gt;");
  });

  it("renders an empty model without throwing", () => {
    const svg = toSVG([]);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("hides the art from assistive technology", () => {
    // The accessible name belongs on whatever presents the signature, where it
    // can say whose it is and when. A description of the strokes serves no
    // equivalent purpose.
    const pad = new SignatureCapture();
    scribble(pad, { strokes: 1 });
    expect(toSVG(pad.strokes)).toContain('aria-hidden="true"');
  });
});
