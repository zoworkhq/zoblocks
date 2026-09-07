"use client";

/**
 * SignatureInk — draws an `Ink` as React elements.
 *
 * Exists because the obvious implementation is a security hole. Rendering a
 * stored `ink.svg` means `dangerouslySetInnerHTML`, and `Ink` round-trips
 * through a database: anyone able to write that record could store
 * `<image href=x onerror=…>` and have it run in the next reviewer's browser.
 * `<script>` inside injected SVG is inert, which is exactly what makes this
 * feel safe and is not.
 *
 * So the value carries structured render data — path strings and, for a typed
 * signature, positioned text — and this component builds real elements from
 * it. Path data cannot carry script. The `svg` string stays on the value for
 * storage, print and export, where it never touches a DOM parser.
 *
 * The repository's own `no-forbidden-capability` lint rule is what caught the
 * first version of this file.
 */

import * as React from "react";
import type { Ink } from "@zoblocks/signature-core";

export interface SignatureInkProps {
  ink: Ink;
  /**
   * Accessible name.
   *
   * Omit for a live capture surface, where the ink is decorative and the
   * group carries the semantics. Supply it wherever a *finished* signature is
   * presented — and make it whose it is and when, which is the equivalent
   * purpose under SC 1.1.1, never a description of the strokes.
   */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
  preserveAspectRatio?: string;
}

export function SignatureInk({
  ink,
  label,
  className,
  style,
  width,
  height,
  preserveAspectRatio,
}: SignatureInkProps) {
  const { viewBox, paths, text } = ink.render;

  // An uploaded image is a data: URL this package produced by re-encoding
  // through a canvas, so it is a bitmap and not markup.
  if (paths.length === 0 && !text && ink.png) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={ink.png}
        alt={label ?? ""}
        className={className}
        style={{ maxWidth: "100%", ...style }}
        {...(label ? {} : { "aria-hidden": true })}
      />
    );
  }

  return (
    <svg
      viewBox={viewBox}
      className={className}
      style={style}
      width={width}
      height={height}
      preserveAspectRatio={preserveAspectRatio}
      focusable="false"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {paths.map((path, index) => (
        <path
          // Segments are positional and stable for a given model; there is no
          // identity to key on beyond the index.
          key={index}
          d={path.d}
          fill="none"
          // currentColor, never a literal — it is what makes one stored
          // signature render correctly in light, dark and forced-colors.
          stroke="currentColor"
          strokeWidth={path.width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {text ? (
        <text
          x={text.x}
          y={text.y}
          fontFamily={text.fontFamily}
          fontSize={text.fontSize}
          fill="currentColor"
          {...(text.italic ? { fontStyle: "italic" } : {})}
        >
          {text.value}
        </text>
      ) : null}
    </svg>
  );
}
