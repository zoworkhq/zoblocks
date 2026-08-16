"use client";

/**
 * SignaturePad — the drawing surface.
 *
 * The accessibility architecture here is the whole point, so it is worth
 * stating what it deliberately is *not*: the `<canvas>` is not the control.
 *
 * A `<canvas>` has no implicit ARIA role, and there is no role meaning
 * "freehand drawing surface" — that absence is itself the argument. Putting
 * `role="img"` on a live capture surface asserts a non-interactive graphic,
 * which is a lie about an element that takes input and discards any notion of
 * state, failing SC 4.1.2 directly. So:
 *
 *   - The widget is a `role="group"` with a real label and description, which
 *     is what satisfies SC 1.3.1 — the label, the instruction and the error
 *     relate to the field programmatically, not just visually.
 *   - The surface is `aria-hidden`. It is the visual affordance for one *mode*,
 *     not the control, and the operable path is native DOM.
 *   - State changes are announced through a polite live region. Canvas bitmap
 *     changes are invisible to assistive technology and nothing else reports
 *     them.
 *   - Every toolbar control is a real `<button>` at 24×24 minimum (SC 2.5.8).
 *
 * The pad renders as SVG rather than canvas, which falls out of the
 * stroke-model decision and buys three things: the ink inherits `currentColor`
 * so it is correct in dark mode and under forced colors without any special
 * casing; there is no device-pixel-ratio bookkeeping; and what is on screen is
 * literally what gets exported, so a visual-regression baseline is meaningful.
 */

import * as React from "react";
import { toInkPaths, type Stroke } from "@oxygenui-design/signature-core";
import { useSignatureCapture, type UseSignatureCaptureOptions } from "./use-signature-capture";
import { useLocale, type SignatureLocale } from "./locale";

export interface SignaturePadProps extends UseSignatureCaptureOptions {
  id?: string;
  /** Accessible name. Rendered visibly unless `hideLabel`. */
  label?: string;
  hideLabel?: boolean;
  /** Guidance shown under the pad and wired with `aria-describedby`. */
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** The "sign above this line" rule. */
  baseline?: boolean;
  height?: number;
  /** `currentColor` by default, which is what makes the ink theme-correct. */
  ink?: string;
  locale?: Partial<SignatureLocale>;
  className?: string;
  style?: React.CSSProperties;
  /** Called when the model changes. */
  onChange?: (strokes: Stroke[]) => void;
}

let seq = 0;
const nextId = () => `ox-sig-${++seq}`;

export function SignaturePad({
  id,
  label,
  hideLabel,
  hint,
  error,
  baseline = true,
  height = 190,
  ink,
  locale: localeOverrides,
  className,
  style,
  disabled,
  onChange,
  ...captureOptions
}: SignaturePadProps) {
  const t = useLocale(localeOverrides);
  const reactId = React.useId();
  const base = id ?? `${reactId}${nextId()}`.replace(/:/g, "");

  const labelId = `${base}-label`;
  const hintId = `${base}-hint`;
  const errorId = `${base}-error`;

  const capture = useSignatureCapture({ ...captureOptions, disabled, onChange });
  const { strokes, canUndo, canRedo, isEmpty, committedCount } = capture;

  /**
   * What the live region says.
   *
   * Only announced on a *settled* change — after a stroke completes, not during
   * one. Announcing every pointermove would produce a continuous stream of
   * speech while somebody is trying to write their name, which is worse than
   * silence.
   */
  const [announcement, setAnnouncement] = React.useState("");
  // Committed strokes, not `strokes.length` — the latter includes the one
  // being drawn, so announcing off it speaks the moment the pen lands.
  const strokeCount = committedCount;
  const previousCount = React.useRef(strokeCount);

  React.useEffect(() => {
    if (strokeCount === previousCount.current) return;
    const grew = strokeCount > previousCount.current;
    previousCount.current = strokeCount;
    setAnnouncement(
      strokeCount === 0
        ? t.announceCleared
        : grew
          ? t.announceCaptured(strokeCount)
          : t.announceUndone(strokeCount),
    );
  }, [strokeCount, t]);

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");
  // Structured segments, never markup: the pad has no business injecting HTML,
  // and this is the same path the manifest uses.
  const segments = React.useMemo(() => toInkPaths(strokes), [strokes]);

  return (
    <div
      className={["ox-signature", disabled ? "ox-signature--disabled" : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      style={style}
      // A group rather than nothing: this is what ties the visible label, the
      // instructions and the error to the control for assistive technology.
      role="group"
      aria-labelledby={labelId}
      {...(describedBy ? { "aria-describedby": describedBy } : {})}
      aria-disabled={disabled || undefined}
    >
      <span id={labelId} className={hideLabel ? "ox-signature__sr" : "ox-signature__label"}>
        {label ?? t.padLabel}
      </span>

      <div className="ox-signature__frame" data-ox-error={error ? "true" : undefined}>
        <div className="ox-signature__toolbar">
          <PadButton
            onClick={capture.undo}
            disabled={disabled || !canUndo}
            label={t.undo}
            icon="↶"
          />
          <PadButton
            onClick={capture.redo}
            disabled={disabled || !canRedo}
            label={t.redo}
            icon="↷"
          />
          <span className="ox-signature__divider" aria-hidden="true" />
          <PadButton
            onClick={capture.clear}
            disabled={disabled || isEmpty}
            label={t.clear}
            icon="⌫"
          />
        </div>

        <div
          {...capture.bind}
          // Marks the box the setup shim gives a size to in jsdom, and the
          // hook measures for coordinate mapping.
          data-ox-signature-pad=""
          className="ox-signature__surface"
          style={{ height, ...(ink ? { color: ink } : {}) }}
        >
          {baseline ? <span className="ox-signature__baseline" aria-hidden="true" /> : null}
          {baseline ? (
            <span className="ox-signature__cue" aria-hidden="true">
              ✕
            </span>
          ) : null}

          <svg
            className="ox-signature__ink"
            // The surface is the affordance for one mode, not the control. Its
            // contents are decorative; the accessible story is the group, the
            // live region, and the typed alternative.
            aria-hidden="true"
            focusable="false"
            preserveAspectRatio="none"
          >
            {segments.map((segment, index) => (
              <path
                key={index}
                d={segment.d}
                fill="none"
                stroke="currentColor"
                strokeWidth={segment.width}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>

          {isEmpty && !disabled ? (
            <span className="ox-signature__placeholder" aria-hidden="true">
              {t.drawHere}
            </span>
          ) : null}
        </div>
      </div>

      {/*
        Canvas — and SVG — changes are invisible to assistive technology.
        Without this, a screen-reader user has no way to know whether anything
        was captured at all.
      */}
      <div className="ox-signature__sr" role="status" aria-live="polite">
        {announcement}
      </div>

      {hint ? (
        <div id={hintId} className="ox-signature__hint">
          {hint}
        </div>
      ) : null}
      {error ? (
        <div id={errorId} className="ox-signature__error">
          {error}
        </div>
      ) : null}
    </div>
  );
}

/**
 * A toolbar control.
 *
 * `type="button"` because this renders inside a `<form>` far more often than
 * not, and the default `submit` would make Clear submit the consent form.
 *
 * The icon is decorative and the label is real text, visually hidden. An
 * icon-only button whose accessible name is its glyph announces as "left
 * arrow", which tells nobody anything.
 */
function PadButton({
  onClick,
  disabled,
  label,
  icon,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  icon: string;
}) {
  return (
    <button
      type="button"
      className="ox-signature__tool"
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="ox-signature__sr">{label}</span>
    </button>
  );
}
