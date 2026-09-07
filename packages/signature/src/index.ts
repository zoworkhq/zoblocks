/**
 * @zoblocks/signature — healthcare signature capture for Ant Design.
 *
 * Draw, type or upload — and record the times nobody signed, which is most of
 * what makes this different from a signature pad.
 *
 *     import { Signature, signatureRequired } from "@zoblocks/signature";
 *     import "@zoblocks/signature/styles.css";
 *
 *     <Form.Item name="consent" label="Patient signature" rules={[signatureRequired()]}>
 *       <Signature now={serverTime} meaning="consent" attestation="…" />
 *     </Form.Item>
 *
 * antd is a peer dependency. The engine underneath —
 * `@zoblocks/signature-core` — has no dependency on React or antd at
 * all, so an application with a different design system can use it directly.
 */

export {
  Signature,
  signatureRequired,
  signatureAffirmative,
  type SignatureProps,
} from "./Signature";
export { SignaturePad, type SignaturePadProps } from "./SignaturePad";
export { SignatureModal, type SignatureModalProps } from "./SignatureModal";
export { SignatureManifest, type SignatureManifestProps } from "./SignatureManifest";
export { SignatureBlock, type SignatureBlockProps } from "./SignatureBlock";
export { SignatureInk, type SignatureInkProps } from "./SignatureInk";
export { OutcomeSheet, type OutcomeSheetProps } from "./OutcomeSheet";
export {
  useSignatureCapture,
  type SignatureCaptureApi,
  type UseSignatureCaptureOptions,
} from "./use-signature-capture";
export { renderTypedSignature, readImageFile } from "./typed";
// Exported for the same reason as the two above: the modal uses it, and a host
// that stores `Ink` and later needs the archival PNG — for a PDF, an email, a
// printout — would otherwise have to reimplement the currentColor
// substitution and the opaque-background rule to get a usable one.
export { rasterise, type RasteriseOptions } from "./rasterise";
export { DEFAULT_LOCALE, SignatureLocaleProvider, useLocale, type SignatureLocale } from "./locale";

// Re-exported so a consumer never needs to reach past this package for the
// value type, the guards, or the FHIR mapping.
export {
  isAffirmative,
  isAnswered,
  isDeclined,
  isRevoked,
  isSigned,
  isUnable,
  toFhirBundle,
  toFhirProvenance,
  toFhirSignature,
  validate,
  withDetachedSignature,
  type Capacity,
  type CaptureMethod,
  type SignatureMeaning,
  type SignatureValue,
  type SignedValue,
  type Signer,
  type Stroke,
  type Subject,
} from "@zoblocks/signature-core";
