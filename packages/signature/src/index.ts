/**
 * @oxygenui-design/signature — healthcare signature capture for Ant Design.
 *
 * Draw, type or upload — and record the times nobody signed, which is most of
 * what makes this different from a signature pad.
 *
 *     import { Signature, signatureRequired } from "@oxygenui-design/signature";
 *     import "@oxygenui-design/signature/styles.css";
 *
 *     <Form.Item name="consent" label="Patient signature" rules={[signatureRequired()]}>
 *       <Signature now={serverTime} meaning="consent" attestation="…" />
 *     </Form.Item>
 *
 * antd is a peer dependency. The engine underneath —
 * `@oxygenui-design/signature-core` — has no dependency on React or antd at
 * all, so an application with a different design system can use it directly.
 */

export {
  Signature,
  signatureRequired,
  signatureAffirmative,
  type SignatureProps,
} from "./Signature.js";
export { SignaturePad, type SignaturePadProps } from "./SignaturePad.js";
export { SignatureModal, type SignatureModalProps } from "./SignatureModal.js";
export { SignatureManifest, type SignatureManifestProps } from "./SignatureManifest.js";
export { SignatureInk, type SignatureInkProps } from "./SignatureInk.js";
export { OutcomeSheet, type OutcomeSheetProps } from "./OutcomeSheet.js";
export {
  useSignatureCapture,
  type SignatureCaptureApi,
  type UseSignatureCaptureOptions,
} from "./use-signature-capture.js";
export { renderTypedSignature, readImageFile } from "./typed.js";
export {
  DEFAULT_LOCALE,
  SignatureLocaleProvider,
  useLocale,
  type SignatureLocale,
} from "./locale.js";

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
} from "@oxygenui-design/signature-core";
