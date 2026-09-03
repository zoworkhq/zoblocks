"use client";

/**
 * Where a demo asks for its chrome.
 *
 *     const { Button, Input } = useHost();
 *
 * One context, seeded with the Oxygen implementation, so a subtree with no
 * provider above it still renders — a demo that throws when nobody wrapped it
 * is a demo that breaks the page it is illustrating.
 */

import * as React from "react";
import type { HostPrimitives } from "./contract";
import { oxygenPrimitives } from "./primitives-oxygen";

const HostContext = React.createContext<HostPrimitives>(oxygenPrimitives);
HostContext.displayName = "OxygenHost";

export function useHost(): HostPrimitives {
  return React.useContext(HostContext);
}

/** The resolved id, for a demo that wants to name what it is rendering. */
export function useHostId() {
  return React.useContext(HostContext).id;
}

/**
 * The inner half of every adapter.
 *
 * Each framework wrapper mounts its own provider and bridge around this, so
 * this component knows nothing about either. Kept separate rather than
 * inlined three times because the three wrappers must agree, and three copies
 * is where they stop agreeing.
 */
export function HostPrimitivesProvider({
  value,
  children,
}: {
  value: HostPrimitives;
  children: React.ReactNode;
}) {
  return <HostContext.Provider value={value}>{children}</HostContext.Provider>;
}
