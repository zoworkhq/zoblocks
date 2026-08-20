"use client";

import * as React from "react";
import { Check, Pipette } from "lucide-react";
import { contrastBetween } from "@oxygenui-design/tokens/validate";
import { cn } from "@/lib/utils";

/**
 * A colour picker that knows what this product knows.
 *
 * The native `<input type="color">` was here first and it is worse than nothing
 * in three specific ways, none of them cosmetic. It cannot be operated from a
 * keyboard — the OS dialog it opens is outside the page and outside the tab
 * order. It cannot be read by a screen reader for the same reason. And it is
 * blind to everything that makes this a *design system* editor rather than a
 * paint program: it does not know the customer has a brand ramp, and it does
 * not know the colour being picked has to clear a contrast floor against
 * whatever sits behind it.
 *
 * So this replaces it with three things a generic picker cannot offer:
 *
 *   - **The customer's own ramp, first.** Eleven steps they have already
 *     approved. Most edits are "the 700 one", and hunting for it in a gradient
 *     is how a palette drifts into eleven near-identical blues.
 *   - **Live contrast against the pairing.** The number that decides whether
 *     this value can be published, shown while choosing rather than after
 *     saving.
 *   - **A keyboard path through all of it.** Arrow keys move the saturation
 *     cursor and the hue; every swatch is a real button.
 *
 * The hex field stays the control of record — it is what a brand guideline is
 * pasted into — and this is the visual way to reach the same value.
 */

interface Hsv {
  h: number;
  s: number;
  v: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | undefined {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match?.[1]) return undefined;
  const n = parseInt(match[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsv(r: number, g: number, b: number): Hsv {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function hsvToHex({ h, s, v }: Hsv): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export interface ColorPickerProps {
  value: string;
  onChange: (next: string) => void;
  /** The customer's ramp, so the first move is picking a step they approved. */
  ramp?: Record<string, string>;
  /** What this colour is drawn against, for the contrast readout. */
  against?: { value: string; label: string; floor: number };
  onClose?: () => void;
}

export function ColorPicker({ value, onChange, ramp, against, onClose }: ColorPickerProps) {
  const rgb = hexToRgb(value) ?? { r: 0, g: 0, b: 0 };
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const areaRef = React.useRef<HTMLDivElement>(null);

  const set = (next: Partial<Hsv>) => onChange(hsvToHex({ ...hsv, ...next }));

  /*
   * Pointer events rather than mouse events, so a stylus and a touch drag work.
   * Capture keeps the drag alive when the pointer leaves the square, which is
   * what makes dragging to full saturation at the edge possible at all.
   */
  const track = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = areaRef.current;
    if (!el) return;
    el.setPointerCapture(event.pointerId);

    const apply = (clientX: number, clientY: number) => {
      const box = el.getBoundingClientRect();
      const s = Math.max(0, Math.min(1, (clientX - box.left) / box.width));
      const v = Math.max(0, Math.min(1, 1 - (clientY - box.top) / box.height));
      set({ s, v });
    };

    apply(event.clientX, event.clientY);
    const move = (e: PointerEvent) => apply(e.clientX, e.clientY);
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };

  const ratio = against ? contrastBetween(value, against.value) : undefined;
  const passes = ratio !== undefined && ratio >= against!.floor;

  return (
    <div
      className="w-[17.5rem] rounded-xl border border-rule bg-paper p-3 shadow-lg"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose?.();
        }
      }}
    >
      {/*
        The ramp first, because it is the answer most of the time. A designer
        reaching for "the 700 one" should not have to find it in a gradient.
      */}
      {ramp && Object.keys(ramp).length > 0 && (
        <div className="mb-3">
          <p className="eyebrow mb-1.5 text-[0.5625rem] text-graphite-soft">
            This brand&rsquo;s ramp
          </p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(ramp).map(([step, hex]) => (
              <button
                key={step}
                type="button"
                onClick={() => onChange(hex)}
                title={`${step} · ${hex}`}
                aria-label={`Step ${step}, ${hex}`}
                className={cn(
                  "size-6 rounded border transition-transform duration-150 hover:scale-110",
                  hex.toLowerCase() === value.toLowerCase()
                    ? "border-ink ring-1 ring-ink"
                    : "border-rule-strong",
                )}
                style={{ background: hex }}
              />
            ))}
          </div>
        </div>
      )}

      {/*
        Saturation and value. `role="application"` is deliberate and narrow: it
        is a two-dimensional continuous control with no HTML equivalent, and
        without it a screen reader intercepts the arrow keys that are the only
        way to operate it.
      */}
      <div
        ref={areaRef}
        role="application"
        aria-label={`Saturation and brightness, currently ${value}`}
        tabIndex={0}
        onPointerDown={track}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.1 : 0.02;
          const map: Record<string, Partial<Hsv>> = {
            ArrowRight: { s: Math.min(1, hsv.s + step) },
            ArrowLeft: { s: Math.max(0, hsv.s - step) },
            ArrowUp: { v: Math.min(1, hsv.v + step) },
            ArrowDown: { v: Math.max(0, hsv.v - step) },
          };
          const next = map[event.key];
          if (next) {
            event.preventDefault();
            set(next);
          }
        }}
        className="relative h-32 w-full cursor-crosshair rounded-lg border border-rule focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-oxygen/30"
        style={{
          backgroundImage:
            "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
          backgroundColor: hsvToHex({ h: hsv.h, s: 1, v: 1 }),
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: value }}
        />
      </div>

      {/* Hue as a real range input: it is one dimension, so HTML already has it. */}
      <label className="mt-3 block">
        <span className="sr-only">Hue</span>
        <input
          type="range"
          min={0}
          max={359}
          value={Math.round(hsv.h)}
          onChange={(event) => set({ h: Number(event.target.value) })}
          className="ox-hue h-3 w-full cursor-pointer appearance-none rounded-full"
        />
      </label>

      <div className="mt-3 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="size-8 shrink-0 rounded-lg border border-rule-strong"
          style={{ background: value }}
        />
        <label className="min-w-0 flex-1">
          <span className="sr-only">Hex value</span>
          <input
            value={value.toUpperCase()}
            onChange={(event) => {
              const next = event.target.value.trim();
              if (/^#?[0-9a-f]{6}$/i.test(next)) {
                onChange(next.startsWith("#") ? next.toLowerCase() : `#${next.toLowerCase()}`);
              }
            }}
            spellCheck={false}
            className="w-full rounded-lg border border-rule-strong bg-paper px-2.5 py-1.5 font-mono text-[0.8125rem] uppercase focus:border-oxygen-deep focus:outline-none focus:ring-[3px] focus:ring-oxygen/20"
          />
        </label>
        {/*
          The eyedropper, where the browser has one. Feature-detected rather
          than assumed: it is Chromium-only, and a button that does nothing in
          Safari is worse than one that is not there.
        */}
        {typeof window !== "undefined" && "EyeDropper" in window && (
          <button
            type="button"
            title="Pick from the screen"
            aria-label="Pick a colour from the screen"
            onClick={async () => {
              try {
                const Dropper = (
                  window as unknown as {
                    EyeDropper: new () => { open(): Promise<{ sRGBHex: string }> };
                  }
                ).EyeDropper;
                const result = await new Dropper().open();
                onChange(result.sRGBHex.toLowerCase());
              } catch {
                // The user dismissed it. Not an error, and not worth a message.
              }
            }}
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-rule-strong text-graphite hover:bg-paper-sunk hover:text-ink"
          >
            <Pipette aria-hidden="true" strokeWidth={2} className="size-4" />
          </button>
        )}
      </div>

      {/*
        The number that decides whether this can be published, shown while
        choosing rather than after saving. This is the whole reason the console
        has its own picker.
      */}
      {against && ratio !== undefined && (
        <p
          className={cn(
            "mt-2.5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.6875rem]",
            passes
              ? "bg-[var(--site-pass-wash)] text-pass"
              : "bg-[var(--site-fail-wash)] text-fail",
          )}
        >
          {passes ? (
            <Check aria-hidden="true" strokeWidth={2.5} className="size-3.5" />
          ) : (
            <span aria-hidden="true" className="font-bold">
              !
            </span>
          )}
          <span className="tabular-nums font-semibold">{ratio.toFixed(2)}:1</span>
          <span className="text-graphite">
            against {against.label} · needs {against.floor}
          </span>
        </p>
      )}
    </div>
  );
}
