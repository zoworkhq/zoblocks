/**
 * @zoblocks/signature-core — the engine behind ZoBlocks's Signature.
 *
 * No React, no Ant Design, no DOM. It accepts plain samples and returns a
 * stroke model, SVG, and a value that says what actually happened — including
 * the cases where nobody signed.
 *
 *     import { SignatureCapture, toInk, toFhirBundle } from "@zoblocks/signature-core";
 *
 *     const pad = new SignatureCapture();
 *     pad.down({ x: 10, y: 40, t: 0, pointerType: "pen" });
 *     pad.move({ x: 32, y: 18, t: 16 });
 *     pad.up({ x: 61, y: 44, t: 33 });
 *
 *     pad.isEmpty;            // false — enough ink to be a signature
 *     toInk(pad.strokes).svg; // trimmed, themeable, printable
 *
 * The React surface, the Ant Design dialog, and the read-only manifest live in
 * `@zoblocks/signature`. This package is what stays the same whichever
 * way that goes.
 */

export {
  SignatureCapture,
  DEFAULT_CAPTURE,
  type CaptureOptions,
  type CaptureSnapshot,
  type Sample,
} from "./capture";

export {
  DEFAULT_INK_THRESHOLD,
  DEFAULT_WIDTH,
  assessInk,
  decimate,
  inkBounds,
  pathLength,
  speeds,
  summariseBiometrics,
  toPathData,
  widths,
  type InkThreshold,
  type InkVerdict,
  type WidthOptions,
} from "./strokes";

export {
  DEFAULT_RENDER,
  toInk,
  toInkPaths,
  toPathMarkup,
  toSVG,
  type RenderOptions,
} from "./export";

export {
  OUTCOMES,
  isAffirmative,
  isAnswered,
  isDeclined,
  isRevoked,
  isSigned,
  isUnable,
  validate,
  type BiometricSummary,
  type Bounds,
  type Capacity,
  type CaptureContext,
  type CaptureMethod,
  type DeclinedValue,
  type Ink,
  type InkPath,
  type InkText,
  type OnPaperValue,
  type Outcome,
  type PendingValue,
  type Point,
  type RevokedValue,
  type SignatureMeaning,
  type SignatureValue,
  type SignedValue,
  type Signer,
  type Stroke,
  type Subject,
  type UnableReason,
  type UnableValue,
  type VerbalValue,
} from "./value";

export {
  SIGNATURE_TYPE,
  SIGNATURE_TYPE_SYSTEM,
  toFhirBundle,
  toFhirProvenance,
  toFhirSignature,
  withDetachedSignature,
  type FhirBundle,
  type FhirProvenance,
  type FhirReference,
  type FhirSignature,
  type ToFhirOptions,
} from "./fhir";
