/**
 * `PatientChip` — a reference to a person, inline.
 *
 * Not an antd `Tag`. A Tag is a label on a thing; this is a person, and calling
 * it a Tag invites callers to drop it into a Tag-shaped slot where a name gets
 * truncated. Names and identifiers are never ellipsised here, at any width.
 */

import { identityLabel, type Identity } from "@oxygenui-design/identity-core";
import type { Patient } from "@oxygenui-design/fhir";
import { type ReactNode } from "react";
import { IdentityAvatar, type AvatarSize } from "./IdentityAvatar.js";
import { useIdentity, useIdentityPolicy } from "./IdentityProvider.js";
import { useEscalation } from "./IdentitySet.js";
import { StateTags } from "./states.js";

export interface PatientChipProps {
  patient?: Patient;
  /** Pre-resolved identity, when the caller already has one. */
  identity?: Identity;
  /** Overrides the swatch key. Prefer a stable record id over anything else. */
  identityKey?: string;
  size?: AvatarSize;
  /** Hide the avatar entirely — for dense tables where the name is enough. */
  hideAvatar?: boolean;
  /** Show status tags. Off by default; a chip is a reference, not a summary. */
  showStates?: boolean;
  className?: string;
}

export function PatientChip(props: PatientChipProps): ReactNode {
  const {
    patient,
    identity: given,
    identityKey,
    size = 24,
    hideAvatar,
    showStates,
    className,
  } = props;
  const resolved = useIdentity(patient, identityKey);
  const identity = given ?? resolved;
  const { policy } = useIdentityPolicy();

  // Registering with the set in scope is what makes the escalation possible.
  // Called unconditionally — hooks cannot be skipped, and the hook handles the
  // undefined case rather than the caller branching around it.
  const escalation = useEscalation(identity);

  if (!identity) {
    return (
      <span className={["ox-chip", "ox-chip--loading", className].filter(Boolean).join(" ")}>
        <span className="ox-avatar ox-avatar--24 ox-avatar--loading" aria-hidden="true" />
        <span className="ox-chip__skeleton" aria-hidden="true" />
        <span className="ox-visually-hidden">Loading patient</span>
      </span>
    );
  }

  const add = escalation?.add ?? [];
  // The escalation ladder appends; it never substitutes. A row that gains a
  // date of birth keeps everything it already had.
  const showGivenFull = add.includes("given-full");
  const showDob = add.includes("dob");
  const showIdentifier = add.includes("identifier");
  const forcePhoto = add.includes("photo");

  const displayName = showGivenFull ? identity.name.text : shortName(identity);

  const detail: string[] = [];
  if (showDob && identity.birthDate) detail.push(identity.birthDate.text);
  if (showIdentifier && identity.identifiers[0]) {
    const id = identity.identifiers[0];
    detail.push(`${id.label} ${id.text}`);
  }

  const classes = ["ox-chip"];
  if (escalation?.mark) classes.push("ox-chip--escalated");
  if (className) classes.push(className);

  return (
    <span
      className={classes.join(" ")}
      data-ox-patient-id={identity.key}
      data-ox-escalated={escalation?.mark ? escalation.reason : undefined}
    >
      {!hideAvatar && (
        <IdentityAvatar
          identity={identity}
          size={size}
          {...(forcePhoto && identity.photo.kind === "none-on-file"
            ? { photo: identity.photo }
            : {})}
        />
      )}
      <span className="ox-chip__text">
        <span className="ox-chip__name">{displayName}</span>
        {detail.length > 0 && <span className="ox-chip__detail">{detail.join(" · ")}</span>}
        {showStates && <StateTags identity={identity} size="xs" />}
      </span>
      {/*
        The visual rendering above is several nodes; a screen reader needs one
        person. `identityLabel` composes it, which is why that function lives in
        the engine — the label and the pixels are two projections of one value
        and must not be allowed to disagree.
      */}
      <span className="ox-visually-hidden">
        {identityLabel(identity, policy, { identifiers: showIdentifier })}
        {escalation?.mark ? " Similar name on this list." : ""}
      </span>
    </span>
  );
}

/**
 * The compact form: first given initial plus family name.
 *
 * This is what the reference design shows by default, and it is fine right up
 * until two of them appear on the same list — which is what the escalation
 * exists to notice.
 */
function shortName(identity: Identity): string {
  const first = identity.name.given[0];
  const family = identity.name.family;
  if (!family) return identity.name.text;
  if (!first) return family;
  return `${Array.from(first)[0]}. ${family}`;
}
