"use client";

/**
 * The ZoBlocks host — the default state of the framework switch.
 *
 * No provider and no bridge, because there is no foreign theme to translate:
 * the tokens on the page are already ZoBlocks's. `mode` is accepted and ignored
 * so all three wrappers keep one shape, which is the same reason `AntdBridge`
 * and `MuiBridge` share theirs.
 */

import * as React from "react";
import type { HostProviderProps } from "./contract";
import { HostPrimitivesProvider } from "./context";
import { zoblocksPrimitives } from "./primitives-zoblocks";

export { zoblocksPrimitives } from "./primitives-zoblocks";

export function ZoBlocksHost({ children, className }: HostProviderProps) {
  return (
    <div className={className} data-zb-host="zoblocks">
      <HostPrimitivesProvider value={zoblocksPrimitives}>{children}</HostPrimitivesProvider>
    </div>
  );
}
