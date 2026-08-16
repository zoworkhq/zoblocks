/**
 * Drawing, the remaining outcomes, the typed renderer, and localisation.
 *
 * The pointer sequences here exercise the React ↔ engine boundary — the part
 * `signature-core`'s own tests cannot reach, because they feed the engine
 * samples directly rather than through `PointerEvent`s and a bounding box.
 */

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DEFAULT_LOCALE,
  Signature,
  SignatureInk,
  SignatureLocaleProvider,
  SignaturePad,
  readImageFile,
  renderTypedSignature,
  type SignatureValue,
} from "../src/index";

const NOW = "2026-08-16T14:36:02.000Z";

/** The pad's box, which the setup shim reports as 600×200. */
function surfaceOf(container: HTMLElement): HTMLElement {
  const node = container.querySelector<HTMLElement>("[data-ox-signature-pad]");
  if (!node) throw new Error("no capture surface");
  return node;
}

/** Draw one stroke across the pad, as a stylus would. */
function draw(
  surface: HTMLElement,
  points: Array<[number, number]>,
  options: { pointerType?: string; pointerId?: number } = {},
) {
  const pointerType = options.pointerType ?? "pen";
  const pointerId = options.pointerId ?? 1;
  const [first, ...rest] = points;
  if (!first) return;

  fireEvent.pointerDown(surface, {
    clientX: first[0],
    clientY: first[1],
    pointerId,
    pointerType,
    pressure: 0.5,
    button: 0,
  });
  for (const [x, y] of rest) {
    fireEvent.pointerMove(surface, {
      clientX: x,
      clientY: y,
      pointerId,
      pointerType,
      pressure: 0.5,
    });
  }
  const last = points[points.length - 1];
  fireEvent.pointerUp(surface, {
    clientX: last?.[0],
    clientY: last?.[1],
    pointerId,
    pointerType,
  });
}

/** A path long enough and wide enough to clear the minimum-ink gate. */
const SIGNATURE: Array<[number, number]> = [
  [40, 120],
  [70, 60],
  [110, 140],
  [150, 60],
  [190, 130],
  [230, 70],
  [270, 120],
  [310, 80],
  [350, 120],
];

afterEach(() => vi.restoreAllMocks());

/* ------------------------------------------------------------------ */

describe("drawing", () => {
  it("captures a stroke from pointer events", () => {
    const onChange = vi.fn();
    const { container } = render(<SignaturePad onChange={onChange} />);
    draw(surfaceOf(container), SIGNATURE);

    expect(onChange).toHaveBeenCalled();
    const strokes = onChange.mock.calls.at(-1)?.[0];
    expect(strokes).toHaveLength(1);
    expect(strokes[0].points.length).toBeGreaterThan(2);
    expect(strokes[0].pointerType).toBe("pen");
  });

  it("maps client coordinates into the pad's own space", () => {
    // Capture space is relative to the pad's box, so a signature is replayable
    // after the layout changes. Storing client coordinates would make it not.
    const onChange = vi.fn();
    const { container } = render(<SignaturePad onChange={onChange} />);
    draw(surfaceOf(container), [
      [40, 120],
      [200, 60],
    ]);

    const first = onChange.mock.calls.at(-1)?.[0][0].points[0];
    expect(first.x).toBe(40);
    expect(first.y).toBe(120);
  });

  it("renders the ink it captured", () => {
    const { container } = render(<SignaturePad />);
    draw(surfaceOf(container), SIGNATURE);
    expect(container.querySelector(".ox-signature__ink")?.innerHTML).toContain("<path");
  });

  it("takes pointer capture so a stroke leaving the pad still tracks", () => {
    // Without capture, pointerup fires on whatever is underneath and the
    // stroke never closes — leaving a line that follows the cursor around.
    const { container } = render(<SignaturePad />);
    const surface = surfaceOf(container);
    const capture = vi.spyOn(surface, "setPointerCapture");
    draw(surface, SIGNATURE);
    expect(capture).toHaveBeenCalledWith(1);
  });

  it("ignores a right-click", () => {
    const onChange = vi.fn();
    const { container } = render(<SignaturePad onChange={onChange} />);
    fireEvent.pointerDown(surfaceOf(container), {
      clientX: 40,
      clientY: 100,
      pointerType: "mouse",
      button: 2,
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("abandons a stroke the browser cancels", () => {
    // pointercancel fires when a scroll or edge swipe takes the gesture.
    // Committing half a stroke would leave a mark nobody made.
    const onChange = vi.fn();
    const { container } = render(<SignaturePad onChange={onChange} />);
    const surface = surfaceOf(container);

    fireEvent.pointerDown(surface, { clientX: 40, clientY: 100, pointerId: 1, button: 0 });
    fireEvent.pointerMove(surface, { clientX: 200, clientY: 60, pointerId: 1 });
    fireEvent.pointerCancel(surface, { pointerId: 1 });

    expect(onChange.mock.calls.at(-1)?.[0]).toHaveLength(0);
  });

  it("treats losing capture the same as a cancel", () => {
    const onChange = vi.fn();
    const { container } = render(<SignaturePad onChange={onChange} />);
    const surface = surfaceOf(container);

    fireEvent.pointerDown(surface, { clientX: 40, clientY: 100, pointerId: 1, button: 0 });
    fireEvent.pointerMove(surface, { clientX: 200, clientY: 60, pointerId: 1 });
    fireEvent.lostPointerCapture(surface, { pointerId: 1 });

    expect(onChange.mock.calls.at(-1)?.[0]).toHaveLength(0);
  });

  it("does nothing at all when disabled", () => {
    const onChange = vi.fn();
    const { container } = render(<SignaturePad disabled onChange={onChange} />);
    draw(surfaceOf(container), SIGNATURE);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects a palm once a stylus has been used", () => {
    const onChange = vi.fn();
    const { container } = render(<SignaturePad onChange={onChange} />);
    const surface = surfaceOf(container);

    draw(surface, SIGNATURE, { pointerType: "pen", pointerId: 1 });
    draw(
      surface,
      [
        [10, 10],
        [400, 190],
      ],
      { pointerType: "touch", pointerId: 2 },
    );

    expect(onChange.mock.calls.at(-1)?.[0]).toHaveLength(1);
  });
});

describe("undo, redo and clear", () => {
  it("removes and restores whole strokes", async () => {
    const user = userEvent.setup();
    const { container } = render(<SignaturePad />);
    const surface = surfaceOf(container);

    draw(surface, SIGNATURE);
    draw(
      surface,
      SIGNATURE.map(([x, y]) => [x, y - 30] as [number, number]),
    );

    const undo = screen.getByRole("button", { name: /undo/i });
    const redo = screen.getByRole("button", { name: /redo/i });

    expect(undo).toBeEnabled();
    await user.click(undo);
    expect(redo).toBeEnabled();
    await user.click(redo);
    expect(redo).toBeDisabled();
  });

  it("clear empties the pad and disables itself", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<SignaturePad onChange={onChange} />);
    draw(surfaceOf(container), SIGNATURE);

    const clear = screen.getByRole("button", { name: /clear/i });
    expect(clear).toBeEnabled();
    await user.click(clear);

    expect(onChange.mock.calls.at(-1)?.[0]).toHaveLength(0);
    expect(clear).toBeDisabled();
  });

  it("announces what happened, because nothing else does", async () => {
    // Canvas and SVG changes are invisible to assistive technology.
    const { container } = render(<SignaturePad />);
    const live = container.querySelector('[role="status"]');

    draw(surfaceOf(container), SIGNATURE);
    await waitFor(() => expect(live).toHaveTextContent(/captured, 1 stroke/i));

    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    await waitFor(() => expect(live).toHaveTextContent(/cleared/i));
  });

  it("does not announce mid-stroke", async () => {
    // Announcing every pointermove would produce continuous speech while
    // somebody is trying to write their name.
    const { container } = render(<SignaturePad />);
    const live = container.querySelector('[role="status"]');
    const surface = surfaceOf(container);

    fireEvent.pointerDown(surface, { clientX: 40, clientY: 100, pointerId: 1, button: 0 });
    fireEvent.pointerMove(surface, { clientX: 120, clientY: 60, pointerId: 1 });
    expect(live).toHaveTextContent("");
  });
});

describe("the minimum-ink gate, through the UI", () => {
  it("refuses to commit a stray tap and says why", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Signature now={NOW} onChange={onChange} signer={{ name: "Josh Randall" }} />);

    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");

    const surface = dialog.querySelector<HTMLElement>("[data-ox-signature-pad]");
    fireEvent.pointerDown(surface!, { clientX: 100, clientY: 100, pointerId: 1, button: 0 });
    fireEvent.pointerUp(surface!, { clientX: 101, clientY: 100, pointerId: 1 });

    await user.click(within(dialog).getByRole("button", { name: /sign and continue/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("commits a real signature drawn with a stylus", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Signature now={NOW} onChange={onChange} signer={{ name: "Josh Randall" }} />);

    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");
    draw(dialog.querySelector<HTMLElement>("[data-ox-signature-pad]")!, SIGNATURE);

    await user.click(within(dialog).getByRole("button", { name: /sign and continue/i }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());

    const value = onChange.mock.calls[0]?.[0] as SignatureValue;
    expect(value.outcome === "signed" && value.method).toBe("draw");
    expect(value.outcome === "signed" && value.provenance.strokeCount).toBe(1);
    expect(value.outcome === "signed" && value.ink.svg).toContain("<svg");
    // The timestamp is the injected one, never a clock reading.
    expect(value.recordedAt).toBe(NOW);
  });

  it("records the representative capacity and who it is for", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Signature
        now={NOW}
        onChange={onChange}
        capacities={["parent", "self"]}
        subject={{ display: "Randall, Josh", reference: "Patient/4471902" }}
        signer={{ name: "Marie Randall" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");
    draw(dialog.querySelector<HTMLElement>("[data-ox-signature-pad]")!, SIGNATURE);
    await user.click(within(dialog).getByRole("button", { name: /sign and continue/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const value = onChange.mock.calls[0]?.[0] as SignatureValue;
    expect(value.outcome === "signed" && value.capacity).toBe("parent");
    // A signature in a representative capacity has to say who it is for.
    expect(value.outcome === "signed" && value.onBehalfOf?.reference).toBe("Patient/4471902");
  });
});

describe("the remaining outcomes", () => {
  async function openSheet() {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Signature
        now={NOW}
        onChange={onChange}
        recordedBy={{ name: "A. Okafor", credential: "RN" }}
        outcomes={["declined", "unable", "verbal", "on-paper"]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /add signature/i }));
    await user.click(await screen.findByRole("button", { name: /can't sign/i }));
    return { user, onChange, sheet: await screen.findByRole("dialog") };
  }

  it("records an unable with its reason and witness", async () => {
    const { user, onChange, sheet } = await openSheet();

    await user.click(within(sheet).getByRole("radio", { name: /unable to sign/i }));
    await user.type(within(sheet).getByPlaceholderText(/name and credential/i), "M. Silva, MD");
    await user.click(within(sheet).getByRole("button", { name: /^record$/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const value = onChange.mock.calls[0]?.[0] as SignatureValue;
    expect(value.outcome).toBe("unable");
    expect(value.outcome === "unable" && value.witness.name).toBe("M. Silva, MD");
    expect(value.outcome === "unable" && value.reason).toBe("physically-unable");
  });

  it("records verbal consent with its channel", async () => {
    const { user, onChange, sheet } = await openSheet();

    await user.click(within(sheet).getByRole("radio", { name: /given verbally/i }));
    await user.type(within(sheet).getByPlaceholderText(/name and credential/i), "M. Silva, MD");
    await user.click(within(sheet).getByRole("button", { name: /^record$/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const value = onChange.mock.calls[0]?.[0] as SignatureValue;
    expect(value.outcome).toBe("verbal");
    expect(value.outcome === "verbal" && value.channel).toBe("phone");
  });

  it("records a paper signature with no further evidence needed", async () => {
    const { user, onChange, sheet } = await openSheet();

    await user.click(within(sheet).getByRole("radio", { name: /signed on paper/i }));
    await user.click(within(sheet).getByRole("button", { name: /^record$/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect((onChange.mock.calls[0]?.[0] as SignatureValue).outcome).toBe("on-paper");
  });

  it("goes back to signing without losing the dialog", async () => {
    const { user, sheet } = await openSheet();
    await user.click(within(sheet).getByRole("button", { name: /^back$/i }));
    expect(await screen.findByRole("tab", { name: /draw/i })).toBeInTheDocument();
  });

  it("always attributes the outcome to whoever recorded it", async () => {
    const { user, onChange, sheet } = await openSheet();
    await user.type(within(sheet).getByRole("textbox"), "Wants to think about it.");
    await user.click(within(sheet).getByRole("button", { name: /^record$/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect((onChange.mock.calls[0]?.[0] as SignatureValue).recordedBy?.name).toBe("A. Okafor");
  });

  it("passes axe", async () => {
    const { sheet } = await openSheet();
    const axe = (await import("axe-core")).default;
    const results = await axe.run(sheet, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});

describe("renderTypedSignature", () => {
  it("produces the same Ink shape a drawn signature does", () => {
    // A typed signature that could not render in the manifest would be a
    // second-class path in practice, whatever the docs claimed.
    const ink = renderTypedSignature("Josh Randall");
    expect(ink.svg).toContain("<svg");
    expect(ink.svg).toContain("Josh Randall");
    expect(ink.bounds.width).toBeGreaterThan(0);
  });

  it("carries no strokes, because a typed signature has none", () => {
    // Fabricating geometry would put invented evidence into a legal record.
    expect(renderTypedSignature("Josh Randall").strokes).toEqual([]);
  });

  it("uses currentColor so it re-themes like the drawn path", () => {
    expect(renderTypedSignature("Josh Randall").svg).toContain('fill="currentColor"');
  });

  it("escapes the name", () => {
    const ink = renderTypedSignature("<script>alert(1)</script>");
    expect(ink.svg).not.toContain("<script>");
    expect(ink.svg).toContain("&lt;script&gt;");
  });

  it("varies with the chosen style", () => {
    expect(renderTypedSignature("A B", "formal").svg).toContain("font-style");
    expect(renderTypedSignature("A B", "plain").svg).not.toContain("font-style");
    expect(renderTypedSignature("A B", "script").svg).toContain("cursive");
  });

  it("trims surrounding whitespace", () => {
    expect(renderTypedSignature("  Josh Randall  ").svg).toContain(">Josh Randall<");
  });

  it("survives an unknown style rather than rendering nothing", () => {
    expect(renderTypedSignature("Josh", "nonsense").svg).toContain("Josh");
  });
});

describe("readImageFile", () => {
  it("re-encodes to PNG, which is what strips EXIF", async () => {
    // A phone photo of a signed page carries GPS coordinates. Re-encoding
    // through a canvas discards every metadata block.
    stubCanvas();
    stubImage(800, 400);

    const result = await readImageFile(new Blob(["x"], { type: "image/jpeg" }));
    expect(result.dataUrl.startsWith("data:image/png")).toBe(true);
    expect(result.width).toBe(800);
    expect(result.height).toBe(400);
  });

  it("caps the stored size", async () => {
    // A 12-megapixel photo of a signature is 11.9 megapixels of desk.
    stubCanvas();
    stubImage(4000, 3000);

    const result = await readImageFile(new Blob(["x"], { type: "image/jpeg" }));
    expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(1200);
  });

  it("rejects a file that is not an image", async () => {
    stubCanvas();
    stubImage(0, 0, { fail: true });
    await expect(readImageFile(new Blob(["nope"]))).rejects.toThrow(/readable image/i);
  });

  it("releases the object URL even when reading fails", async () => {
    // Otherwise a kiosk left open all day leaks a blob per rejected upload.
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    stubCanvas();
    stubImage(0, 0, { fail: true });
    await expect(readImageFile(new Blob(["nope"]))).rejects.toThrow();
    expect(revoke).toHaveBeenCalled();
  });
});

describe("localisation", () => {
  it("ships a complete default locale", () => {
    for (const [key, value] of Object.entries(DEFAULT_LOCALE)) {
      expect(value, key).toBeTruthy();
    }
  });

  it("gives the close affordance a name distinct from Cancel", () => {
    // Two controls with the same accessible name doing the same thing means a
    // screen-reader user hears "Cancel button" twice with no way to tell them
    // apart.
    expect(DEFAULT_LOCALE.close).not.toBe(DEFAULT_LOCALE.cancel);
  });

  it("takes overrides from a provider", () => {
    render(
      <SignatureLocaleProvider
        value={{ padLabel: "Unterschrift", drawHere: "Hier unterschreiben" }}
      >
        <SignaturePad />
      </SignatureLocaleProvider>,
    );
    expect(screen.getByRole("group", { name: "Unterschrift" })).toBeInTheDocument();
  });

  it("lets a prop beat the provider", () => {
    render(
      <SignatureLocaleProvider value={{ padLabel: "From provider" }}>
        <SignaturePad locale={{ padLabel: "From prop" }} />
      </SignatureLocaleProvider>,
    );
    expect(screen.getByRole("group", { name: "From prop" })).toBeInTheDocument();
  });

  it("counts strokes in the announcement", () => {
    expect(DEFAULT_LOCALE.announceCaptured(1)).toMatch(/1 stroke\b/);
    expect(DEFAULT_LOCALE.announceCaptured(3)).toMatch(/3 strokes/);
    expect(DEFAULT_LOCALE.announceUndone(0)).toMatch(/cleared/i);
    expect(DEFAULT_LOCALE.announceUndone(2)).toMatch(/2 remaining/);
  });
});

/* ------------------------------------------------------------------ */

/** jsdom has no 2D context; the component only needs drawImage and toDataURL. */
function stubCanvas() {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: () => {},
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    "data:image/png;base64,iVBORw0KGgo=",
  );
}

/** jsdom never loads images, so `onload` has to be driven by hand. */
function stubImage(width: number, height: number, options: { fail?: boolean } = {}) {
  class StubImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    width = width;
    height = height;
    set src(_value: string) {
      queueMicrotask(() => (options.fail ? this.onerror?.() : this.onload?.()));
    }
  }
  vi.stubGlobal("Image", StubImage);
}

describe("pad variants", () => {
  it("can drop the baseline guide", () => {
    const { container } = render(<SignaturePad baseline={false} />);
    expect(container.querySelector(".ox-signature__baseline")).toBeNull();
    expect(container.querySelector(".ox-signature__cue")).toBeNull();
  });

  it("shows the baseline and its cue by default", () => {
    const { container } = render(<SignaturePad />);
    expect(container.querySelector(".ox-signature__baseline")).not.toBeNull();
  });

  it("hides the label visually while keeping it announced", () => {
    // display:none would remove it from the accessibility tree, leaving the
    // group unnamed.
    render(<SignaturePad hideLabel label="Patient signature" />);
    const group = screen.getByRole("group", { name: "Patient signature" });
    expect(group.querySelector(".ox-signature__sr")).toHaveTextContent("Patient signature");
  });

  it("applies a custom ink colour through currentColor, not into the path", () => {
    // The paths always say `stroke="currentColor"` and inherit the surface's
    // colour. Baking a literal into the geometry is exactly what makes a
    // stored signature invisible in dark mode and under forced colors.
    const { container } = render(<SignaturePad ink="#1d39c4" />);
    draw(surfaceOf(container), SIGNATURE);

    expect(surfaceOf(container).style.color).toBe("rgb(29, 57, 196)");
    const path = container.querySelector(".ox-signature__ink path");
    expect(path).toHaveAttribute("stroke", "currentColor");
  });

  it("marks the frame and wires the message when there is an error", () => {
    const { container } = render(<SignaturePad error="Sign across the line." />);
    expect(container.querySelector('[data-ox-error="true"]')).not.toBeNull();
    expect(screen.getByRole("group")).toHaveAccessibleDescription("Sign across the line.");
  });

  it("describes the group by both hint and error when both are present", () => {
    render(<SignaturePad hint="Sign above the line." error="Too small." />);
    expect(screen.getByRole("group")).toHaveAccessibleDescription(
      "Sign above the line. Too small.",
    );
  });

  it("hides the placeholder once there is ink", () => {
    const { container } = render(<SignaturePad />);
    expect(container.querySelector(".ox-signature__placeholder")).not.toBeNull();
    draw(surfaceOf(container), SIGNATURE);
    expect(container.querySelector(".ox-signature__placeholder")).toBeNull();
  });

  it("shows no placeholder when disabled", () => {
    const { container } = render(<SignaturePad disabled />);
    expect(container.querySelector(".ox-signature__placeholder")).toBeNull();
    expect(container.querySelector(".ox-signature--disabled")).not.toBeNull();
  });

  it("restores an existing signature for editing", () => {
    const { container } = render(<SignaturePad />);
    draw(surfaceOf(container), SIGNATURE);
    const markup = container.querySelector(".ox-signature__ink")?.innerHTML ?? "";

    const restored = render(
      <SignaturePad
        initialStrokes={[
          {
            pointerType: "pen",
            points: SIGNATURE.map(([x, y], i) => ({ x, y, t: i * 16, pressure: 0.5 })),
          },
        ]}
      />,
    );
    expect(restored.container.querySelector(".ox-signature__ink")?.innerHTML).toBeTruthy();
    expect(markup).toBeTruthy();
  });
});

describe("outcome sheet branches", () => {
  async function openSheet(outcomes: Array<"declined" | "unable" | "verbal" | "on-paper">) {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Signature
        now={NOW}
        onChange={onChange}
        recordedBy={{ name: "A. Okafor", credential: "RN" }}
        outcomes={outcomes}
      />,
    );
    await user.click(screen.getByRole("button", { name: /add signature/i }));
    await user.click(await screen.findByRole("button", { name: /can't sign/i }));
    return { user, onChange, sheet: await screen.findByRole("dialog") };
  }

  it("demands detail when the unable reason is 'other'", async () => {
    // The controlled list drives what happens next; "other" carries no
    // information on its own.
    const { user, onChange, sheet } = await openSheet(["unable"]);

    await user.type(within(sheet).getByPlaceholderText(/name and credential/i), "M. Silva, MD");
    // Pick "Other" from the reason list.
    await user.click(within(sheet).getByRole("combobox"));
    await user.click(await screen.findByTitle("Other"));
    await user.click(within(sheet).getByRole("button", { name: /^record$/i }));

    expect(onChange).not.toHaveBeenCalled();
    expect(within(sheet).getByText(/still needed/i)).toBeInTheDocument();
  });

  it("offers only the outcomes it was given", async () => {
    const { sheet } = await openSheet(["on-paper"]);
    expect(within(sheet).getAllByRole("radio")).toHaveLength(1);
    expect(within(sheet).getByRole("radio", { name: /signed on paper/i })).toBeInTheDocument();
  });

  it("keeps the options in a stable order regardless of prop order", async () => {
    const { sheet } = await openSheet(["on-paper", "declined"]);
    const labels = within(sheet)
      .getAllByRole("radio")
      .map((r) => r.closest("label")?.textContent ?? "");
    expect(labels[0]).toMatch(/declined/i);
  });

  it("hides 'Can't sign?' entirely when no outcomes are offered", async () => {
    const user = userEvent.setup();
    render(<Signature now={NOW} outcomes={[]} />);
    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: /can't sign/i })).not.toBeInTheDocument();
  });
});

describe("the field, remaining paths", () => {
  it("shows a subtitle when given one", async () => {
    const user = userEvent.setup();
    render(<Signature now={NOW} title="Consent" subtitle="Randall, Josh · MRN 4471902" />);
    await user.click(screen.getByRole("button", { name: /add signature/i }));
    expect(await screen.findByText(/MRN 4471902/)).toBeInTheDocument();
  });

  it("takes an explicit error status without a Form", () => {
    const { container } = render(<Signature now={NOW} status="error" />);
    expect(container.querySelector('[data-status="error"]')).not.toBeNull();
  });

  it("offers only the methods it was given", async () => {
    const user = userEvent.setup();
    render(<Signature now={NOW} methods={["type", "upload"]} />);
    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getAllByRole("tab")).toHaveLength(2);
    expect(within(dialog).queryByRole("tab", { name: /draw/i })).not.toBeInTheDocument();
  });

  it("closes without committing when cancelled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Signature now={NOW} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /^cancel$/i }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("carries the document hash into the value", async () => {
    // What makes tampering after signing detectable.
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Signature
        now={NOW}
        onChange={onChange}
        documentHash="sha256:9f4bc210"
        signer={{ name: "Josh Randall" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");
    draw(dialog.querySelector<HTMLElement>("[data-ox-signature-pad]")!, SIGNATURE);
    await user.click(within(dialog).getByRole("button", { name: /sign and continue/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const value = onChange.mock.calls[0]?.[0] as SignatureValue;
    expect(value.outcome === "signed" && value.documentHash).toBe("sha256:9f4bc210");
  });

  it("stores the attestation so the manifest can reprint it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Signature
        now={NOW}
        onChange={onChange}
        attestation="I agree to the procedure described above."
        signer={{ name: "Josh Randall" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");
    draw(dialog.querySelector<HTMLElement>("[data-ox-signature-pad]")!, SIGNATURE);
    await user.click(within(dialog).getByRole("button", { name: /sign and continue/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const value = onChange.mock.calls[0]?.[0] as SignatureValue;
    expect(value.outcome === "signed" && value.attestation).toMatch(/agree to the procedure/);
  });

  it("refuses to commit without a name", async () => {
    // 21 CFR 11.50(a)(1) is the printed name. Ink alone is not a manifestation.
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Signature now={NOW} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");
    draw(dialog.querySelector<HTMLElement>("[data-ox-signature-pad]")!, SIGNATURE);

    expect(within(dialog).getByRole("button", { name: /sign and continue/i })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("SignatureInk", () => {
  const drawn = {
    strokes: [],
    svg: "",
    render: {
      viewBox: "0 0 100 40",
      paths: [
        { d: "M 0 0 L 40 20", width: 2.4 },
        { d: "M 40 20 L 90 5", width: 1.8 },
      ],
    },
    bounds: { x: 0, y: 0, width: 100, height: 40 },
  };

  it("draws paths as real elements, never as injected markup", () => {
    // The reason this component exists. `Ink` round-trips through a database,
    // so rendering a stored svg string with innerHTML would let anyone able to
    // write that record run script in the next reviewer's browser.
    const { container } = render(<SignatureInk ink={drawn} label="Signature of Josh Randall" />);
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(2);
    expect(paths[0]).toHaveAttribute("d", "M 0 0 L 40 20");
    expect(paths[0]).toHaveAttribute("stroke", "currentColor");
  });

  it("cannot be made to execute injected markup", () => {
    // Path data is not markup. Even a hostile `d` is inert.
    const hostile = {
      ...drawn,
      render: {
        ...drawn.render,
        paths: [{ d: '"><image href="x" onerror="globalThis.__pwned = true">', width: 2 }],
      },
    };
    const { container } = render(<SignatureInk ink={hostile} />);
    expect(container.querySelector("image")).toBeNull();
    expect((globalThis as Record<string, unknown>).__pwned).toBeUndefined();
  });

  it("names a finished signature and hides an unnamed one", () => {
    // role="img" is right for a static graphic and wrong for a live capture
    // surface, where it would assert something false about an input.
    const named = render(<SignatureInk ink={drawn} label="Signature of Josh Randall" />);
    expect(named.container.querySelector("svg")).toHaveAttribute("role", "img");

    const anonymous = render(<SignatureInk ink={drawn} />);
    expect(anonymous.container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders a typed signature as text", () => {
    const typed = renderTypedSignature("Josh Randall", "formal");
    const { container } = render(<SignatureInk ink={typed} label="Signature of Josh Randall" />);
    const text = container.querySelector("text");
    expect(text).toHaveTextContent("Josh Randall");
    expect(text).toHaveAttribute("fill", "currentColor");
    expect(text).toHaveAttribute("font-style", "italic");
  });

  it("renders an uploaded image as an img, not an svg", () => {
    // The data URL came from our own canvas re-encode, so it is a bitmap.
    const uploaded = {
      strokes: [],
      svg: "",
      render: { viewBox: "0 0 200 80", paths: [] },
      png: "data:image/png;base64,iVBORw0KGgo=",
      bounds: { x: 0, y: 0, width: 200, height: 80 },
    };
    const { container } = render(<SignatureInk ink={uploaded} label="Signature of Josh Randall" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("alt", "Signature of Josh Randall");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("leaves an unnamed uploaded image out of the accessibility tree", () => {
    const uploaded = {
      strokes: [],
      svg: "",
      render: { viewBox: "0 0 200 80", paths: [] },
      png: "data:image/png;base64,iVBORw0KGgo=",
      bounds: { x: 0, y: 0, width: 200, height: 80 },
    };
    const { container } = render(<SignatureInk ink={uploaded} />);
    expect(container.querySelector("img")).toHaveAttribute("aria-hidden", "true");
  });

  it("takes explicit dimensions when the layout needs them", () => {
    const { container } = render(<SignatureInk ink={drawn} width={120} height={40} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "120");
    expect(svg).toHaveAttribute("viewBox", "0 0 100 40");
  });
});

describe("PNG export", () => {
  /**
   * The gap this closes: `Signature.data` in the FHIR mapping *is* the PNG, so
   * before the rasteriser existed a drawn or typed signature produced a FHIR
   * Signature element with no payload at all. Only an upload carried one,
   * because an upload arrives as a bitmap already.
   */
  function stubRaster() {
    const drawn: string[] = [];
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: () => drawn.push("drawn"),
      fillRect: () => {},
      set fillStyle(_v: string) {},
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/png;base64,UE5H",
    );

    const seen: string[] = [];
    class StubImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = 200;
      height = 80;
      set src(value: string) {
        seen.push(value);
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", StubImage);
    return { seen, drawn };
  }

  it("gives a drawn signature a PNG, so FHIR Signature.data is populated", async () => {
    const { seen } = stubRaster();
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Signature now={NOW} onChange={onChange} signer={{ name: "Josh Randall" }} />);

    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");
    draw(dialog.querySelector<HTMLElement>("[data-ox-signature-pad]")!, SIGNATURE);
    await user.click(within(dialog).getByRole("button", { name: /sign and continue/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const value = onChange.mock.calls[0]?.[0] as SignatureValue;
    expect(value.outcome === "signed" && value.ink.png).toBe("data:image/png;base64,UE5H");

    // currentColor cannot resolve in a standalone raster; it must be
    // substituted before serialising or the PNG comes out blank.
    expect(seen[0]).toBeDefined();
    expect(decodeURIComponent(seen[0]!)).not.toContain("currentColor");
    expect(decodeURIComponent(seen[0]!)).toContain("#141414");
  });

  it("commits without a PNG rather than blocking when rasterising fails", async () => {
    // A signature recorded without its raster is recoverable from the stroke
    // model. A signature the person could not complete is not.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Signature now={NOW} onChange={onChange} signer={{ name: "Josh Randall" }} />);

    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");
    draw(dialog.querySelector<HTMLElement>("[data-ox-signature-pad]")!, SIGNATURE);
    await user.click(within(dialog).getByRole("button", { name: /sign and continue/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect((onChange.mock.calls[0]?.[0] as SignatureValue).outcome).toBe("signed");
  });

  it("bakes the chosen ink colour into the raster", async () => {
    const { seen } = stubRaster();
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Signature now={NOW} onChange={onChange} signer={{ name: "Josh Randall" }} />);

    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("radio", { name: /blue/i }));
    draw(dialog.querySelector<HTMLElement>("[data-ox-signature-pad]")!, SIGNATURE);
    await user.click(within(dialog).getByRole("button", { name: /sign and continue/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(decodeURIComponent(seen[0]!)).toContain("#1d39c4");
  });
});

describe("ink colour", () => {
  it("names each colour rather than relying on the swatch", async () => {
    // Two unlabelled dots are unusable by keyboard and invisible to a screen
    // reader — and colour alone is never a control label here.
    const user = userEvent.setup();
    render(<Signature now={NOW} />);
    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");

    const group = within(dialog).getByRole("radiogroup", { name: /ink/i });
    expect(within(group).getByRole("radio", { name: /black/i })).toBeInTheDocument();
    expect(within(group).getByRole("radio", { name: /blue/i })).toBeInTheDocument();
  });

  it("defaults to black and reports the selection", async () => {
    const user = userEvent.setup();
    render(<Signature now={NOW} />);
    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("radio", { name: /black/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await user.click(within(dialog).getByRole("radio", { name: /blue/i }));
    expect(within(dialog).getByRole("radio", { name: /blue/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});
