/**
 * The four states the reference design draws as one grey pill, plus the fifth
 * one it does not draw at all.
 *
 * Deceased, inactive, merged, test and restricted come from four unrelated
 * places in FHIR and mean four unrelated things. Collapsing them is how an
 * automated appointment reminder reaches a bereaved family.
 *
 * Every tag pairs a colour with an icon **and** a word, because forced-colors
 * discards the colour, monochrome printing discards the hue, and roughly one in
 * twelve men cannot separate red from green.
 */

import {
  SENSITIVITY_LABEL,
  type Identity,
  type IdentityState,
} from "@oxygenui-design/identity-core";
import type { ReactNode } from "react";

export interface StateTagsProps {
  identity: Identity;
  size?: "xs" | "sm";
  /**
   * Render "Active" when there is nothing else to say.
   *
   * On by default for a banner: an active patient and a patient whose status
   * failed to load must not look identical. Off for a chip, where a row of
   * "Active" tags is noise.
   */
  showActive?: boolean;
}

interface Rendered {
  tone: "neutral" | "warn" | "error" | "restricted" | "ok";
  icon: string;
  text: string;
}

export function describeState(state: IdentityState): Rendered {
  switch (state.kind) {
    case "deceased":
      return {
        tone: "neutral",
        icon: "✝",
        text: state.date ? `Deceased ${state.date.text}` : "Deceased",
      };
    case "inactive":
      // "Inactive" alone is what routes a reminder to someone who has died or
      // been discharged. Say which.
      return {
        tone: "neutral",
        icon: "○",
        text: "Inactive — not receiving care from this service",
      };
    case "merged":
      return { tone: "warn", icon: "⇢", text: "Record merged — care is recorded elsewhere" };
    case "test":
      return { tone: "warn", icon: "⚠", text: "TEST PATIENT — not a person" };
    case "restricted":
      return {
        tone: "restricted",
        icon: "🔒",
        text: `Sensitive record: ${state.codes.map((c) => SENSITIVITY_LABEL[c]).join(", ")}`,
      };
    default: {
      // Exhaustiveness: a new state added to the engine fails the build here
      // rather than silently rendering as nothing.
      const never: never = state;
      return never;
    }
  }
}

/**
 * Literal class maps rather than interpolated names.
 *
 * Tailwind resolves classes by scanning source text, so a name assembled at
 * runtime produces no CSS and renders the element unstyled — which on a status
 * chip silently deletes the status signal. A map also makes the full set
 * greppable, which is what a reviewer actually needs.
 */
const TONE_CLASS: Record<Rendered["tone"], string> = {
  neutral: "ox-tag--neutral",
  warn: "ox-tag--warn",
  error: "ox-tag--error",
  restricted: "ox-tag--restricted",
  ok: "ox-tag--ok",
};

const SIZE_CLASS: Record<NonNullable<StateTagsProps["size"]>, string> = {
  xs: "ox-tag--xs",
  sm: "ox-tag--sm",
};

export function StateTags({ identity, size = "sm", showActive }: StateTagsProps): ReactNode {
  if (identity.states.length === 0) {
    if (!showActive) return null;
    return (
      <span className={["ox-tag", TONE_CLASS.ok, SIZE_CLASS[size]].join(" ")}>
        <span aria-hidden="true">●</span> Active
      </span>
    );
  }

  return (
    <>
      {identity.states.map((state) => {
        const r = describeState(state);
        return (
          <span
            key={state.kind}
            className={["ox-tag", TONE_CLASS[r.tone], SIZE_CLASS[size]].join(" ")}
            data-ox-state={state.kind}
          >
            <span aria-hidden="true">{r.icon}</span> {r.text}
          </span>
        );
      })}
    </>
  );
}

/** The accent rail colour for a banner carrying these states. */
export function railTone(identity: Identity): string {
  for (const s of identity.states) {
    if (s.kind === "restricted") return "restricted";
    if (s.kind === "test" || s.kind === "merged") return "warn";
    if (s.kind === "deceased") return "neutral";
  }
  return "none";
}
