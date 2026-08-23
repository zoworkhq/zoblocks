/**
 * `PatientBanner` — the last surface a clinician reads before they act.
 *
 * Four things here that no other banner does:
 *
 *   1. **Two identifiers are a compile error, not a review comment.** Joint
 *      Commission NPSG.01.01.01 requires two person-specific identifiers before
 *      any care action; `context="action"` therefore takes a `readonly [T, T,
 *      ...T[]]`.
 *   2. **`Patient.gender` cannot be rendered.** It is administrative gender —
 *      correspondence and registries, not dosing. The `fields` union names the
 *      four alternatives and omits it.
 *   3. **Identity is atomic.** All fields or a skeleton. A name above a
 *      still-loading identifier reads as a complete record and someone acts on
 *      it.
 *   4. **It publishes who it is showing**, so `PatientGuard` can refuse to let
 *      a form disagree with it.
 */

import {
  SENSITIVITY_LABEL,
  disclosureAllows,
  identityLabel,
  shortName,
  switchAnnouncement,
  type Identity,
} from "@oxygenui-design/identity-core";
import type { OperationOutcome, Patient } from "@oxygenui-design/fhir";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BannerAvatar } from "./IdentityAvatar.js";
import { useIdentity, useIdentityPolicy } from "./IdentityProvider.js";
import { PatientContextProvider, useBannerRegistration } from "./PatientGuard.js";
import { StateTags, railTone } from "./states.js";

/**
 * The renderable fields, in the order the caller wants them kept.
 *
 * `"gender"` is deliberately absent. A caller who needs what their server put
 * in `Patient.gender` asks for `"recorded-sex-or-gender"`, which renders it
 * labelled as what it is rather than as a bare letter a prescriber can mistake
 * for a clinical fact.
 */
export type Field =
  | "photo"
  | "name"
  | "pronouns"
  | "dob"
  | "age"
  | "spcu"
  | "gender-identity"
  | "recorded-sex-or-gender"
  | "identifier"
  | "ward";

export const DEFAULT_FIELDS: Field[] = [
  "photo",
  "name",
  "pronouns",
  "dob",
  "identifier",
  "age",
  "spcu",
  "ward",
];

export interface IdentifierSpec {
  /** Identifier kind, matching `IdentifierSystemSpec.kind` — e.g. `"mrn"`. */
  kind: string;
}

/** At least two. This is the type that encodes NPSG.01.01.01. */
export type TwoOrMore<T> = readonly [T, T, ...T[]];

type ContextProps =
  | {
      /** Navigation and read-only surfaces. One identifier is enough. */
      context: "navigation";
      identifiers?: readonly IdentifierSpec[];
    }
  | {
      /** Anything that precedes a care action. Two identifiers, enforced. */
      context: "action" | "verification";
      identifiers: TwoOrMore<IdentifierSpec>;
    };

type SourceProps =
  | { patient: Patient; loading?: never; error?: never }
  | { patient?: never; loading: true; error?: never }
  | { patient?: never; loading?: never; error: OperationOutcome | Error };

export type PatientBannerProps = ContextProps &
  SourceProps & {
    identityKey?: string;
    /** Priority order. The container query drops from the tail. */
    fields?: Field[];
    ward?: string;
    /** Rendered at the end of the banner — actions belong to the application. */
    actions?: ReactNode;
    className?: string;
    /** Fired when a user reveals a withheld field. The app writes the audit. */
    onReveal?: () => void;
    /**
     * Screen content rendered beneath the banner, inside its patient context.
     *
     * This is what lets `PatientGuard` compare a form against the chart on
     * screen. React context needs nesting, and a banner that owns the region
     * below it is the honest shape: the banner is not a decoration above the
     * content, it is the statement the content is made under.
     */
    children?: ReactNode;
  };

/**
 * How many rungs of the field list survive at each container width.
 *
 * The breakpoints live in CSS; this array is what the accessible label and the
 * `data-ox-fields` attribute report, so tests and audit tooling can see what a
 * given width actually rendered.
 */
/** Literal rail classes. See the note in `states.tsx`. */
const RAIL_CLASS: Record<string, string> = {
  neutral: "ox-banner__rail--neutral",
  warn: "ox-banner__rail--warn",
  restricted: "ox-banner__rail--restricted",
  error: "ox-banner__rail--error",
  none: "ox-banner__rail--none",
};

const BANNER_RAIL_CLASS: Record<string, string> = {
  neutral: "ox-banner--rail-neutral",
  warn: "ox-banner--rail-warn",
  restricted: "ox-banner--rail-restricted",
  error: "ox-banner--rail-error",
  none: "ox-banner--rail-none",
};

const DROP_CLASS: Record<string, string> = {
  ward: "ox-drop-4",
  spcu: "ox-drop-3",
  "gender-identity": "ox-drop-3",
  "recorded-sex-or-gender": "ox-drop-3",
  age: "ox-drop-3",
  pronouns: "ox-drop-2",
  identifier: "ox-drop-1",
};

export function PatientBanner(props: PatientBannerProps): ReactNode {
  const {
    context,
    identifiers,
    identityKey,
    fields = DEFAULT_FIELDS,
    ward,
    actions,
    className,
    onReveal,
    children,
  } = props;

  const patient = "patient" in props ? props.patient : undefined;
  const identity = useIdentity(patient, identityKey);
  const { policy, onSensitiveReveal } = useIdentityPolicy();
  const [photoFailed, setPhotoFailed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useBannerRegistration(identity?.key);

  if ("error" in props && props.error) {
    return (
      <div
        className={joined("ox-banner ox-banner--error", className)}
        // Marked like every other root in the library. Without it the failure
        // states are the two a visual-regression harness cannot target and a
        // host's CSS cannot reach — which is the wrong two to leave out.
        data-ox-banner="error"
        role="alert"
      >
        <span className="ox-banner__rail ox-banner__rail--error" aria-hidden="true" />
        <div className="ox-banner__block">
          <div className="ox-banner__line1">
            <span className="ox-banner__name">Could not load the patient record</span>
          </div>
          <div className="ox-banner__line2">
            Nothing below this point is confirmed to belong to anyone. Do not act on it.
          </div>
        </div>
      </div>
    );
  }

  // Identity is atomic: a skeleton, or everything. There is no shape here that
  // carries a name without its identifiers.
  if (!identity) {
    return (
      <div
        className={joined("ox-banner ox-banner--loading", className)}
        data-ox-banner="loading"
        aria-busy="true"
      >
        <span className="ox-avatar ox-avatar--40 ox-avatar--loading" aria-hidden="true" />
        <div className="ox-banner__block">
          <span className="ox-banner__skeleton ox-banner__skeleton--name" aria-hidden="true" />
          <span className="ox-banner__skeleton ox-banner__skeleton--line" aria-hidden="true" />
        </div>
        <span className="ox-visually-hidden">Loading patient</span>
      </div>
    );
  }

  const restricted = identity.states.find((s) => s.kind === "restricted");
  const withheld = !!restricted && !revealed && policy.disclosure !== "full";

  const wanted = new Set(fields);
  const rendered: Field[] = [];
  const push = (f: Field): boolean => {
    if (!wanted.has(f)) return false;
    rendered.push(f);
    return true;
  };

  /*
   * Disclosure reduces the field set, not only the identifiers.
   *
   * It used to reach `resolveIdentifiers` and nothing else, so a waiting-room
   * screen masked the medical record number and then printed the patient's full
   * name, date of birth and sex parameter for clinical use beside it. That
   * removed the one field nobody reads across a room and kept every field they
   * do.
   */
  const allow = disclosureAllows(policy.disclosure);

  const showPhoto = push("photo");
  push("name");
  const showPronouns = allow.pronouns && push("pronouns") && !!identity.pronouns;
  const showDob = allow.birthDate && push("dob") && !!identity.birthDate;
  const showAge = allow.age && push("age") && !!identity.age;
  const showSpcu = allow.clinicalSex && push("spcu") && !!identity.spcu;
  const showGi = allow.clinicalSex && push("gender-identity") && !!identity.genderIdentity;
  const showRsg =
    allow.clinicalSex && push("recorded-sex-or-gender") && !!identity.recordedSexOrGender;
  const showIdentifiers =
    allow.identifiers && push("identifier") && identity.identifiers.length > 0;
  const showWard = allow.identifiers && push("ward") && !!ward;

  const selected = selectIdentifiers(identity, identifiers);
  const label = identityLabel(identity, policy);

  const reveal = (): void => {
    setRevealed(true);
    onReveal?.();
    onSensitiveReveal?.({
      patientId: identity.key,
      codes: restricted?.kind === "restricted" ? restricted.codes : [],
      // In an event handler, not during render. The rule exists so a rendered
      // age cannot drift between the server and the client or between two
      // visual-regression runs; a break-the-glass audit entry has to say when
      // the glass was actually broken, and no injected clock can answer that.
      // eslint-disable-next-line no-restricted-syntax
      at: new Date().toISOString(),
    });
  };

  return (
    <PatientContextProvider identity={identity}>
      <PatientSwitchAnnouncer identity={identity} />
      {/*
        A `section` with an accessible name, not `<header role="region">`.
        `header` does not permit an explicit `region` role — axe flags it as
        `aria-allowed-role` — and a labelled `section` maps to `region`
        natively, which is the same landmark with none of the argument.
      */}
      <section
        aria-label={label}
        data-ox-banner="ready"
        data-ox-patient-id={identity.key}
        data-ox-context={context}
        data-ox-fields={rendered.join(",")}
        className={joined(
          "ox-banner",
          BANNER_RAIL_CLASS[railTone(identity)],
          restricted ? "ox-banner--restricted" : "",
          identity.states.some((s) => s.kind === "test") ? "ox-banner--test" : "",
          className,
        )}
      >
        <span
          className={joined("ox-banner__rail", RAIL_CLASS[railTone(identity)])}
          aria-hidden="true"
        />
        {showPhoto && (
          <BannerAvatar
            identity={identity}
            size={40}
            {...(photoFailed ? { photo: { kind: "unavailable" as const } } : {})}
            onPhotoError={() => setPhotoFailed(true)}
          />
        )}
        <div className="ox-banner__block">
          <div className="ox-banner__line1">
            <span className="ox-banner__name">
              {allow.name === "short" ? shortName(identity.name) : identity.name.text}
            </span>
            {showPronouns && (
              <span className="ox-banner__pronouns ox-drop-2">{identity.pronouns}</span>
            )}
            <StateTags identity={identity} size="xs" showActive />
          </div>
          <div className="ox-banner__line2">
            {showDob && identity.birthDate && (
              <Fld field="dob" label="DOB" value={identity.birthDate.text} />
            )}
            {showAge && identity.age && (
              <Fld
                field="age"
                label={identity.age.atDeath ? "Aged" : "Age"}
                value={identity.age.atDeath ? `${identity.age.text} at death` : identity.age.text}
              />
            )}
            {showSpcu && identity.spcu && (
              <Fld field="spcu" label="SPCU" value={identity.spcu.label} />
            )}
            {showGi && identity.genderIdentity && (
              <Fld
                field="gender-identity"
                label="Gender identity"
                value={identity.genderIdentity.label}
              />
            )}
            {showRsg && identity.recordedSexOrGender && (
              <Fld
                field="recorded-sex-or-gender"
                label="Recorded sex"
                value={identity.recordedSexOrGender.label}
              />
            )}
            {showIdentifiers &&
              selected.map((id) => (
                <Fld
                  key={id.kind + id.raw}
                  field="identifier"
                  label={id.label}
                  value={id.text}
                  assigner={id.assigner}
                  invalid={id.checkDigitValid === false}
                />
              ))}
            {showWard && ward && <Fld field="ward" label="Ward" value={ward} />}
          </div>
          {/*
            The banner does not render a programme name or a care team — those
            are not fields it has. An earlier version said "Programme and care
            team withheld", which claimed to be hiding information the component
            never held: a safeguard that describes a protection it is not
            providing is worse than no message.

            What it *does* hold, and can honestly withhold, is which sensitivity
            categories the record carries. Before the reveal a reader knows the
            record is sensitive; after it, they know it is a substance-use or a
            psychiatry record — and the application has been told, so it can
            unmask whatever else it holds and write the audit entry.
          */}
          {restricted?.kind === "restricted" && (
            <div className="ox-banner__withheld">
              {withheld ? (
                <>
                  <span>
                    This record carries sensitivity labels. Revealing which ones is recorded against
                    your account.
                  </span>
                  <button type="button" className="ox-banner__reveal" onClick={reveal}>
                    Reveal
                  </button>
                </>
              ) : (
                <span data-ox-field="sensitivity">
                  Sensitivity: {restricted.codes.map((c) => SENSITIVITY_LABEL[c]).join(", ")}
                </span>
              )}
            </div>
          )}
        </div>
        {actions && <div className="ox-banner__actions">{actions}</div>}
      </section>
      {children}
    </PatientContextProvider>
  );
}

function Fld(props: {
  field: Field;
  label: string;
  value: string;
  assigner?: string | undefined;
  invalid?: boolean;
}): ReactNode {
  const { field, label, value, assigner, invalid } = props;
  const drop = DROP_CLASS[field];
  return (
    <span className={joined("ox-banner__fld", drop)} data-ox-field={field}>
      <span className="ox-banner__lbl">{label}</span>
      <span className="ox-banner__val">{value}</span>
      {assigner && <span className="ox-banner__assigner">{assigner}</span>}
      {invalid && (
        <span className="ox-banner__invalid" title="This identifier fails its check digit">
          ⚠
        </span>
      )}
    </span>
  );
}

function selectIdentifiers(
  identity: Identity,
  wanted: readonly IdentifierSpec[] | undefined,
): Identity["identifiers"] {
  if (!wanted || wanted.length === 0) return identity.identifiers.slice(0, 1);
  const order = wanted.map((w) => w.kind);
  const picked = identity.identifiers.filter((id) => order.includes(id.kind));
  // A caller who asked for two identifiers and whose record has only one gets
  // the one it has, plus whatever else is on the record — silently rendering a
  // single identifier under `context="action"` would defeat the type.
  if (picked.length >= order.length) return picked;
  const extra = identity.identifiers.filter((id) => !picked.includes(id));
  return [...picked, ...extra].slice(0, Math.max(order.length, picked.length));
}

/**
 * The patient changed and nobody said so.
 *
 * A sighted user gets a full visual repaint; a screen-reader user gets nothing,
 * because focus is wherever it was and the DOM swapped underneath them. Polite
 * rather than assertive, so it never interrupts a value being read, and
 * debounced so a rapid list traversal does not queue up announcements.
 */
function PatientSwitchAnnouncer({ identity }: { identity: Identity }): ReactNode {
  const [message, setMessage] = useState("");
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (previous.current === identity.key) return;
    const isFirst = previous.current === null;
    previous.current = identity.key;
    // The first render is not a switch — announcing it would talk over a page
    // load that the user has already been told about.
    if (isFirst) return;
    const timer = setTimeout(() => setMessage(switchAnnouncement(identity)), 150);
    return () => clearTimeout(timer);
  }, [identity]);

  return (
    <div aria-live="polite" aria-atomic="true" className="ox-visually-hidden">
      {message}
    </div>
  );
}

function joined(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(" ");
}
