"use client";

/**
 * The Oxygen host — the default state of the framework switch.
 *
 * No provider and no bridge, because there is no foreign theme to translate:
 * the tokens on the page are already Oxygen's. `mode` is accepted and ignored
 * so all three wrappers keep one shape, which is the same reason `AntdBridge`
 * and `MuiBridge` share theirs.
 */

import * as React from "react";
import type { HostProviderProps } from "./contract";
import { HostPrimitivesProvider } from "./context";
import { oxygenPrimitives } from "./primitives-oxygen";

export { oxygenPrimitives } from "./primitives-oxygen";

export function OxygenHost({ children, className }: HostProviderProps) {
  return (
    <div className={className} data-ox-host="oxygen">
      <HostPrimitivesProvider value={oxygenPrimitives}>{children}</HostPrimitivesProvider>
    </div>
  );
}
