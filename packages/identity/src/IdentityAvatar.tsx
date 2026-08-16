/**
 * `IdentityAvatar` — one element, six decorative swatches, five kinds of
 * absence.
 *
 * Two things make this different from every other avatar component:
 *
 *   1. **The absence of a photograph is five different facts.** Displaying a
 *      patient's photograph in the banner is associated with a measurable
 *      reduction in wrong-patient order entry, which makes a silently missing
 *      photograph a silently degraded safety control. "No photo on file" and
 *      "we could not load the photo we have" must not look the same.
 *   2. **It is one DOM node.** At five thousand rows the difference between one
 *      element and three is ten thousand elements of decoration.
 */

import type { Identity, PhotoState } from "@oxygenui-design/identity-core";
import { type CSSProperties, type ReactNode } from "react";

export type AvatarSize = 20 | 24 | 32 | 40 | 56 | "auto";

/**
 * Literal class maps rather than interpolated names.
 *
 * Tailwind resolves classes by scanning source text; a name built at runtime
 * produces no CSS and renders an untinted circle that looks exactly like a
 * loading state. See `@oxygenui/no-dynamic-class-name`.
 */
const SWATCH_CLASS = [
  "ox-avatar--sw1",
  "ox-avatar--sw2",
  "ox-avatar--sw3",
  "ox-avatar--sw4",
  "ox-avatar--sw5",
  "ox-avatar--sw6",
] as const;

const SIZE_CLASS: Record<string, string> = {
  "20": "ox-avatar--20",
  "24": "ox-avatar--24",
  "32": "ox-avatar--32",
  "40": "ox-avatar--40",
  "56": "ox-avatar--56",
  auto: "ox-avatar--auto",
};

const PHOTO_CLASS: Record<string, string> = {
  "none-on-file": "ox-avatar--none-on-file",
  unavailable: "ox-avatar--unavailable",
  withheld: "ox-avatar--withheld",
  loading: "ox-avatar--loading",
};

/** Wraps out-of-range indices, so a caller-supplied bucket count cannot crash. */
function swatchClass(index: number): string {
  return (
    SWATCH_CLASS[((index % SWATCH_CLASS.length) + SWATCH_CLASS.length) % SWATCH_CLASS.length] ??
    SWATCH_CLASS[0]
  );
}

export interface IdentityAvatarProps {
  identity: Identity;
  /**
   * `"auto"` derives the size from the container via a container query, which
   * is the right axis for components that live in split panes and SMART on FHIR
   * frames. A number is an override.
   */
  size?: AvatarSize;
  /**
   * Overrides the resolved photo state. Used by the banner when a real `<img>`
   * has reported an error — see the note on the single-node trade-off below.
   */
  photo?: PhotoState;
  /**
   * Interactive avatars get a 24×24 minimum hit area (WCAG 2.2 SC 2.5.8), which
   * is why `size={20}` rejects this at the type level.
   */
  onClick?: never;
  className?: string;
  /**
   * The avatar is decorative and hidden from assistive technology by default.
   * Set this only where the avatar renders with no adjacent name — a rare case,
   * and one where the caller has to supply the label the engine composed.
   */
  label?: string;
  style?: CSSProperties;
}

/**
 * Glyphs for the states where something is *wrong* or *withheld*.
 *
 * `none-on-file` is deliberately absent. It renders the initials instead,
 * because a generic silhouette carries strictly less information than two
 * letters of the patient's name, and "this record has no photograph" is the
 * ordinary case for most records rather than an exception worth an icon. The
 * dashed, muted border is what distinguishes it — and it keeps the common path
 * a single DOM node, which is the whole performance argument at 5,000 rows.
 */
const GLYPH: Record<
  Exclude<PhotoState["kind"], "present" | "loading" | "none-on-file">,
  ReactNode
> = {
  unavailable: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 7v6" />
      <circle cx="12" cy="16.5" r=".6" fill="currentColor" />
      <path d="M3.5 20h17L12 4z" />
    </svg>
  ),
  withheld: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="1.6" />
      <path d="M8.2 10.5V7.8a3.8 3.8 0 017.6 0v2.7" />
    </svg>
  ),
};

/**
 * The accessible description of each absence.
 *
 * Only used when `label` is supplied — an avatar beside a name says nothing a
 * screen-reader user can use. But when it is exposed, a sighted user's ability
 * to tell "no photo" from "photo failed" has to survive.
 */
export const PHOTO_STATE_TEXT: Record<PhotoState["kind"], string> = {
  present: "",
  "none-on-file": "no photo on record",
  unavailable: "photo could not be loaded",
  withheld: "photo withheld by policy",
  loading: "loading",
};

export function IdentityAvatar(props: IdentityAvatarProps): ReactNode {
  const { identity, size = "auto", photo, className, label, style } = props;
  const state = photo ?? identity.photo;

  const classes = ["ox-avatar", swatchClass(identity.swatch)];
  classes.push(SIZE_CLASS[String(size)] ?? SIZE_CLASS.auto ?? "ox-avatar--auto");
  if (state.kind !== "present") {
    const photoClass = PHOTO_CLASS[state.kind];
    if (photoClass) classes.push(photoClass);
  }
  for (const s of identity.states) {
    if (s.kind === "deceased") classes.push("ox-avatar--deceased");
    if (s.kind === "test") classes.push("ox-avatar--test");
  }
  if (className) classes.push(className);

  // The tint travels as a custom property index rather than an inline colour,
  // so a strict Content-Security-Policy with no `unsafe-inline` still works.
  const inline: CSSProperties = { ...style };

  const a11y = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };

  if (state.kind === "present") {
    // The banner variant uses a real <img> so `onError` exists; the list
    // variant is one node with a background image. Different constraints, one
    // API — see the performance section of the identity brief.
    return (
      <span
        {...a11y}
        className={classes.join(" ")}
        data-ox-photo="present"
        style={{ ...inline, backgroundImage: `url("${state.src}")` }}
      />
    );
  }

  return (
    <span {...a11y} className={classes.join(" ")} data-ox-photo={state.kind} style={inline}>
      {state.kind === "loading" || state.kind === "none-on-file"
        ? state.kind === "loading"
          ? null
          : identity.initials
        : GLYPH[state.kind]}
    </span>
  );
}

/**
 * The banner's avatar: a real `<img>` with a real error handler.
 *
 * There is exactly one of these per screen, so the extra nodes are free, and it
 * is the surface where "the photo we have failed to load" has to be
 * distinguishable from "there is no photo".
 */
export interface BannerAvatarProps extends IdentityAvatarProps {
  onPhotoError?: () => void;
}

export function BannerAvatar(props: BannerAvatarProps): ReactNode {
  const { identity, size = 40, photo, onPhotoError, label } = props;
  const state = photo ?? identity.photo;

  if (state.kind !== "present") return <IdentityAvatar {...props} size={size} />;

  const classes = [
    "ox-avatar",
    swatchClass(identity.swatch),
    SIZE_CLASS[String(size)] ?? "ox-avatar--auto",
    "ox-avatar--img",
  ];

  return (
    <span
      className={classes.join(" ")}
      data-ox-photo="present"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {/*
        A plain `img`. `next/image` is a Next.js dependency this library cannot
        take — it ships to Vite, Remix and CRA consumers too — and the
        optimisation it offers is the wrong trade here anyway: a patient
        photograph must not be proxied through a third-party image CDN.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={state.src}
        alt=""
        // A signed photo URL must never leak into a third party's Referer log.
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        decoding="async"
        // The banner is above the fold and is a safety control; a list row is
        // not. This is the opposite of the framework default in both cases.
        fetchPriority="high"
        onError={onPhotoError}
        draggable={false}
      />
    </span>
  );
}
