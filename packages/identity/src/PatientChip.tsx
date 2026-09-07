/**
 * `PatientChip` — a reference to a person, inline.
 *
 * Not an antd `Tag`. A Tag is a label on a thing; this is a person, and calling
 * it a Tag invites callers to drop it into a Tag-shaped slot where a name gets
 * truncated. Names and identifiers are never ellipsised here, at any width.
 */

import { identityLabel, shortName, type Identity } from "@zoblocks/identity-core";
import type { Patient } from "@zoblocks/fhir";
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
  /**
   * Fill the inline axis, for worklists and ward lists. A column of
   * content-width chips is a staircase with no left edge to scan, and the
   * ragged right edge reads as a rendering fault rather than as information.
   *
   * To stagger the escalation down a list, set `--zb-row` to the row index on
   * each row's wrapper — the value inherits, so the chip needs no prop for it:
   *
   * ```tsx
   * <li style={{ "--zb-row": i } as React.CSSProperties}>
   *   <PatientChip patient={p} block />
   * </li>
   * ```
   */
  block?: boolean;
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
    block,
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
      <span
        className={[
          "zb-patient-chip",
          "zb-patient-chip--loading",
          block ? "zb-patient-chip--block" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="zb-avatar zb-avatar--24 zb-avatar--loading" aria-hidden="true" />
        <span className="zb-patient-chip__skeleton" aria-hidden="true" />
        <span className="zb-visually-hidden">Loading patient</span>
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

  const displayName = showGivenFull ? identity.name.text : shortName(identity.name);

  const detail: string[] = [];
  if (showDob && identity.birthDate) detail.push(identity.birthDate.text);
  if (showIdentifier && identity.identifiers[0]) {
    const id = identity.identifiers[0];
    detail.push(`${id.label} ${id.text}`);
  }

  const classes = ["zb-patient-chip"];
  if (block) classes.push("zb-patient-chip--block");
  if (escalation?.mark) classes.push("zb-patient-chip--escalated");
  if (className) classes.push(className);

  return (
    <span
      className={classes.join(" ")}
      data-zb-patient-id={identity.key}
      data-zb-escalated={escalation?.mark ? escalation.reason : undefined}
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
      <span className="zb-patient-chip__text">
        <span className="zb-patient-chip__name">{displayName}</span>
        {detail.length > 0 && <span className="zb-patient-chip__detail">{detail.join(" · ")}</span>}
        {showStates && <StateTags identity={identity} size="xs" />}
      </span>
      {/*
        The visual rendering above is several nodes; a screen reader needs one
        person. `identityLabel` composes it, which is why that function lives in
        the engine — the label and the pixels are two projections of one value
        and must not be allowed to disagree.
      */}
      <span className="zb-visually-hidden">
        {identityLabel(identity, policy, { identifiers: showIdentifier })}
        {escalation?.mark ? " Similar name on this list." : ""}
      </span>
    </span>
  );
}
