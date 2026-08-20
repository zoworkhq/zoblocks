"use client";

import dynamic from "next/dynamic";

/**
 * The client-only boundary for the framework specimen.
 *
 * A separate file for one reason: `"use client"` marks where the client bundle
 * begins, not where server rendering stops. Next still imports and evaluates a
 * client module on the server to produce the first HTML — so importing antd and
 * MUI directly put both into the request path, and the render stream died with
 * "the destination stream closed early" before anything reached the browser.
 *
 * `ssr: false` is what keeps them out of it. The skeleton holds the specimen's
 * height so the card does not jump when the chunk arrives.
 */
export const FrameworkSpecimen = dynamic(
  () => import("./FrameworkSpecimenImpl").then((m) => m.FrameworkSpecimenImpl),
  {
    ssr: false,
    loading: () => (
      <div className="h-[4.5rem] animate-pulse rounded-lg bg-paper-sunk" aria-hidden="true" />
    ),
  },
);
