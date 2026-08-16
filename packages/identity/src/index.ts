/**
 * @oxygenui-design/identity — patient identity for Ant Design.
 *
 *     import { IdentityProvider, PatientBanner, PatientGuard } from "@oxygenui-design/identity";
 *     import "@oxygenui-design/identity/styles.css";
 *
 *     <IdentityProvider disclosure="clinical" photos="allow">
 *       <PatientBanner
 *         patient={patient}
 *         context="action"
 *         identifiers={[{ kind: "mrn" }, { kind: "nhs" }]}   // two, enforced by the type
 *       />
 *       <PatientGuard expect={openedFor.id}>
 *         <OrderForm />
 *       </PatientGuard>
 *     </IdentityProvider>
 *
 * The engine — name resolution, deterministic swatches, script-aware initials,
 * and the disambiguation pass — lives in `@oxygenui-design/identity-core` and
 * has no React and no Ant Design in it.
 */

export {
  IdentityProvider,
  useIdentity,
  useIdentityPolicy,
  type IdentifierCopyEvent,
  type IdentityProviderProps,
  type NameContextProp,
  type SensitiveRevealEvent,
} from "./IdentityProvider.js";

export {
  BannerAvatar,
  IdentityAvatar,
  PHOTO_STATE_TEXT,
  type AvatarSize,
  type BannerAvatarProps,
  type IdentityAvatarProps,
} from "./IdentityAvatar.js";

export {
  IdentitySet,
  IdentitySetNotice,
  useEscalation,
  type IdentitySetProps,
} from "./IdentitySet.js";

export { PatientChip, type PatientChipProps } from "./PatientChip.js";

export {
  DEFAULT_FIELDS,
  PatientBanner,
  type Field,
  type IdentifierSpec,
  type PatientBannerProps,
  type TwoOrMore,
} from "./PatientBanner.js";

export {
  PatientGuard,
  onBannerViolation,
  useDisplayedPatient,
  __resetBannerRegistry,
  type BannerViolation,
  type MismatchInfo,
  type PatientGuardProps,
} from "./PatientGuard.js";

export {
  PatientVerify,
  useWristbandMatch,
  wristbandMessage,
  type PatientVerifyProps,
  type ScannedIdentifier,
  type VerifyMode,
  type WristbandVerdict,
} from "./Verify.js";

export { StateTags, describeState, railTone, type StateTagsProps } from "./states.js";

// Re-exported for convenience: an application that renders an identity almost
// always needs the type of the thing it is rendering.
export type {
  DisclosureLevel,
  Identity,
  IdentityPolicy,
  IdentityState,
  PhotoState,
  SensitivityCode,
} from "@oxygenui-design/identity-core";
