"use client";

/**
 * The React binding for `SignatureCapture`.
 *
 * Everything hard lives in `signature-core`; this is the layer that turns
 * `PointerEvent`s into samples and re-renders when the model changes. It is
 * exported because a customer with their own design system will want the
 * engine and the event plumbing without any of our chrome.
 *
 * Three pieces of plumbing that are easy to get wrong and expensive to debug:
 *
 *   - **`touch-action: none`.** Without it the browser claims the gesture for
 *     scrolling and the signature comes out as a few disconnected dots. It is
 *     set in CSS rather than here so it applies before the first pointerdown.
 *   - **`setPointerCapture`.** A stroke that leaves the pad still belongs to
 *     the pad. Without capture, `pointerup` fires on whatever is underneath and
 *     the stroke never closes — leaving a line that follows the cursor around.
 *   - **Coalesced events.** High-rate styluses deliver several positions per
 *     frame; `getCoalescedEvents()` recovers the ones the frame boundary would
 *     otherwise drop, which is the difference between a smooth curve and a
 *     polygon on a 120 Hz pen.
 */

import * as React from "react";
import {
  SignatureCapture,
  type CaptureOptions,
  type Sample,
  type Stroke,
} from "@zoblocks/signature-core";

export interface UseSignatureCaptureOptions extends Partial<CaptureOptions> {
  /** Restore an existing signature for editing. */
  initialStrokes?: readonly Stroke[];
  /** Fires whenever the model changes, including undo, redo and clear. */
  onChange?: (strokes: Stroke[]) => void;
  disabled?: boolean;
}

export interface SignaturePadBinding {
  ref: React.RefObject<HTMLDivElement | null>;
  onPointerDown: React.PointerEventHandler<HTMLDivElement>;
  onPointerMove: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp: React.PointerEventHandler<HTMLDivElement>;
  onPointerCancel: React.PointerEventHandler<HTMLDivElement>;
  onLostPointerCapture: React.PointerEventHandler<HTMLDivElement>;
}

export interface SignatureCaptureApi {
  /** Spread onto the drawing surface. */
  bind: SignaturePadBinding;
  strokes: Stroke[];
  /**
   * Strokes that have been finished, excluding one still being drawn.
   *
   * What the live region counts. `strokes` includes the in-progress stroke so
   * the ink renders as the pen moves; announcing off that would say "signature
   * captured" the instant the pen touched down, then again for every stroke,
   * producing continuous speech while somebody is trying to write their name.
   */
  committedCount: number;
  isEmpty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  /** Ink present but below the threshold — a stray tap rather than a signature. */
  isTooLittleInk: boolean;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  load: (strokes: readonly Stroke[]) => void;
  /** Milliseconds from first contact to the last sample. */
  durationMs: number;
  pointerType: Stroke["pointerType"];
}

export function useSignatureCapture(options: UseSignatureCaptureOptions = {}): SignatureCaptureApi {
  const { initialStrokes, onChange, disabled, ...captureOptions } = options;

  const ref = React.useRef<HTMLDivElement | null>(null);
  // The engine is a mutable object rather than state: it changes on every
  // pointermove, and cloning it sixty times a second to satisfy immutability
  // would be the whole performance budget.
  const engine = React.useRef<SignatureCapture>(undefined as unknown as SignatureCapture);
  if (engine.current === undefined) {
    engine.current = new SignatureCapture(captureOptions);
    if (initialStrokes?.length) engine.current.load(initialStrokes);
  }

  // The clock is relative to the first contact, so the model contains no wall
  // time at all — see the note in signature-core/capture.ts.
  const origin = React.useRef<number | null>(null);
  const [version, setVersion] = React.useState(0);

  const commit = React.useCallback(() => {
    setVersion((n) => n + 1);
    onChange?.(engine.current.strokes);
  }, [onChange]);

  /**
   * Client coordinates into capture space.
   *
   * Capture space is CSS pixels relative to the pad's own box, which makes the
   * model independent of where the pad sits and of how the page is scrolled or
   * zoomed. Storing client coordinates would make a signature un-replayable the
   * moment the layout changed.
   */
  const toSample = React.useCallback((event: React.PointerEvent | PointerEvent): Sample | null => {
    const node = ref.current;
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    if (origin.current === null) origin.current = event.timeStamp;

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      t: Math.max(0, event.timeStamp - origin.current),
      // Chrome reports 0 pressure for a mouse; 0.5 is the neutral value that
      // leaves the width curve unmodified.
      pressure: event.pressure > 0 ? event.pressure : 0.5,
      // Only forwarded when the hardware actually measured it. A mouse
      // reports 0/0, which is indistinguishable from an upright stylus, so
      // passing it on would record a pen angle that was never observed.
      ...(event.pointerType === "pen" ? { tiltX: event.tiltX, tiltY: event.tiltY } : {}),
      pointerType: normalisePointerType(event.pointerType),
      pointerId: event.pointerId,
    };
  }, []);

  const onPointerDown = React.useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (event) => {
      if (disabled) return;
      // Secondary buttons and the eraser end of a stylus are not drawing.
      if (event.button !== 0 && event.pointerType === "mouse") return;

      const sample = toSample(event);
      if (!sample || !engine.current.down(sample)) return;

      // The stroke follows the pointer even off the pad. Without this,
      // pointerup lands on whatever is underneath and the stroke never closes.
      event.currentTarget.setPointerCapture(event.pointerId);
      commit();
    },
    [commit, disabled, toSample],
  );

  const onPointerMove = React.useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (event) => {
      if (disabled) return;

      // A 120 Hz stylus delivers several positions per frame. Without this the
      // curve is sampled at frame rate and looks like a polygon.
      const native = event.nativeEvent;
      const coalesced =
        typeof native.getCoalescedEvents === "function" ? native.getCoalescedEvents() : [];
      const events = coalesced.length > 0 ? coalesced : [native];

      let changed = false;
      for (const raw of events) {
        const sample = toSample(raw);
        if (sample && engine.current.move(sample)) changed = true;
      }
      if (changed) commit();
    },
    [commit, disabled, toSample],
  );

  const onPointerUp = React.useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (event) => {
      if (disabled) return;
      const sample = toSample(event);
      if (engine.current.up(sample ?? undefined)) commit();
    },
    [commit, disabled, toSample],
  );

  const onPointerCancel = React.useCallback<React.PointerEventHandler<HTMLDivElement>>(() => {
    // The browser took the gesture — a scroll, an edge swipe, the tab hiding.
    // Committing a half-drawn stroke would leave a mark nobody made.
    if (engine.current.cancel()) commit();
  }, [commit]);

  const act = React.useCallback(
    (fn: () => boolean | void) => {
      fn();
      commit();
    },
    [commit],
  );

  const snapshot = React.useMemo(() => {
    void version; // recomputed on every commit
    return engine.current.snapshot();
  }, [version]);

  /*
   * Nothing survives the pad being taken off screen.
   *
   * The kiosk case from the brief: a bedside or waiting-room terminal moves
   * from one patient to the next, and a signature still sitting in memory
   * belongs to whoever signed it last. React discards this hook's state on
   * unmount, but the engine is a ref — a mutable object that outlives the
   * render — and a host using the headless hook can hold that reference
   * across a route change. Emptying it here means the strokes are gone
   * whichever way the pad left the screen.
   */
  React.useEffect(() => {
    const capture = engine.current;
    return () => capture.clear();
  }, []);

  return {
    committedCount: snapshot.committedCount,
    bind: {
      ref,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      // Losing capture (another app stealing focus, a device disconnect) has
      // the same consequence as a cancel: the stroke is not finished and must
      // not be committed as if it were.
      onLostPointerCapture: onPointerCancel,
    },
    strokes: snapshot.strokes,
    isEmpty: snapshot.strokes.length === 0,
    isTooLittleInk: snapshot.isEmpty,
    canUndo: snapshot.canUndo,
    canRedo: snapshot.canRedo,
    undo: React.useCallback(() => act(() => engine.current.undo()), [act]),
    redo: React.useCallback(() => act(() => engine.current.redo()), [act]),
    clear: React.useCallback(() => {
      origin.current = null;
      act(() => engine.current.clear());
    }, [act]),
    load: React.useCallback(
      (strokes: readonly Stroke[]) => act(() => engine.current.load(strokes)),
      [act],
    ),
    durationMs: engine.current.durationMs,
    pointerType: engine.current.pointerType,
  };
}

function normalisePointerType(type: string): Stroke["pointerType"] {
  return type === "pen" || type === "touch" || type === "mouse" ? type : "unknown";
}
