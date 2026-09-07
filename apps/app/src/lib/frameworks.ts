/**
 * What each theme bridge actually does, computed from the bridges themselves.
 *
 * Every number on `/frameworks` comes from here, and none of it is written
 * down twice. A bridge that gains a mapping changes this page on the next
 * build; a hand-maintained list would have gone stale the first time one did.
 *
 * The import path is load-bearing. `@zoblocks/bridge-antd` — the
 * barrel — pulls in `AntdBridge.tsx`, which imports `antd`. The app must
 * never resolve a UI framework: that is the whole architectural claim, and an
 * admin app quietly depending on both antd *and* MUI would falsify it in
 * its own package graph. `/definition` is the mapping alone, and its only
 * import is `bridge-core`. If someone changes these to the barrel the build
 * fails with "Cannot find module 'antd'" before any test runs, which is the
 * gate working.
 */

import { resolvePatch, type BridgeDefinition } from "@zoblocks/bridge-core";
import { antdBridge, type AntdTokens } from "@zoblocks/bridge-antd/definition";
import { muiBridge, type MuiTheme } from "@zoblocks/bridge-mui/definition";
import {
  CLINICAL_SEMANTIC,
  NOT_BRIDGEABLE,
  TOKEN_SURFACE,
  surfaceEntry,
} from "@zoblocks/tokens/surface";
import type { FrameworkId } from "@/db/collections";

/**
 * A host theme with every field a bridge reads set to something.
 *
 * **Not** a copy of antd's or MUI's defaults, and it is never rendered — the
 * values are deliberately obvious nonsense so that nobody mistakes this for a
 * palette. Its only job is to make every branch in `map()` produce a value, so
 * `Object.keys()` on the result is the complete set of tokens the bridge is
 * *capable* of writing.
 *
 * The alternative — a hand-written list of token names beside each bridge —
 * is the thing that goes stale, and it goes stale silently, because nothing
 * renders differently when the list is wrong.
 */
const ANTD_PROBE: Required<AntdTokens> = {
  colorPrimary: "#000001",
  colorPrimaryHover: "#000002",
  colorPrimaryBg: "#000003",
  colorPrimaryBorder: "#000004",
  colorTextLightSolid: "#000010",
  colorText: "#000005",
  colorTextSecondary: "#000006",
  colorTextTertiary: "#000007",
  colorTextDisabled: "#000008",
  colorBgContainer: "#000009",
  colorBgElevated: "#00000a",
  colorBgLayout: "#00000b",
  colorFillQuaternary: "#00000c",
  colorFillTertiary: "#00000d",
  colorBorder: "#00000e",
  colorBorderSecondary: "#00000f",
  borderRadiusSM: 1,
  borderRadius: 2,
  borderRadiusLG: 3,
  fontFamily: "probe",
  fontFamilyCode: "probe-mono",
  fontSize: 4,
  controlHeight: 5,
  controlHeightSM: 6,
  motionDurationFast: "1ms",
  motionDurationMid: "2ms",
  motionDurationSlow: "3ms",
  motionEaseInOut: "linear",
  boxShadowTertiary: "0 0 0 #000",
  boxShadowSecondary: "0 0 1px #000",
  boxShadow: "0 0 2px #000",
};

const MUI_PROBE: MuiTheme = {
  palette: {
    mode: "light",
    primary: { main: "#000001", dark: "#000002", light: "#000003", contrastText: "#000004" },
    text: { primary: "#000005", secondary: "#000006", disabled: "#000007" },
    background: { default: "#000008", paper: "#000009" },
    divider: "#00000a",
  },
  shape: { borderRadius: 2 },
  typography: { fontFamily: "probe", fontSize: 4 },
  // Index 8 is the deepest step sampled, so the array has to reach it. "none"
  // is excluded on purpose: MUI's elevation 0 is the string "none", which the
  // bridge treats as absent rather than as a shadow.
  shadows: Array.from({ length: 25 }, (_, i) => `0 0 ${i}px #000`),
  transitions: {
    duration: { shorter: 1, short: 2, standard: 3, complex: 4 },
    easing: { easeInOut: "linear" },
  },
};

/**
 * Semantic tokens that carry a clinical meaning.
 *
 * Read from the generated manifest, not re-derived here. The first version of
 * this file collected the `semantic` field of every `bridgeable: false`
 * component token, which is the same rule read from the wrong end: it only
 * finds clinical tokens some component already consumes. `--zb-flag-provisional`
 * is defined in the semantic tier and referenced by nothing yet, so it fell
 * through and this screen described an identity flag as an ordinary gap in Ant
 * Design's palette. The generator now publishes the rule as data.
 */
const CLINICAL = new Set<string>(CLINICAL_SEMANTIC);

export interface UnmappedToken {
  token: string;
  /**
   * Clinical tokens are refused by the contract and will never be mapped. The
   * rest are gaps in the host framework, which a future major might close —
   * different facts, so the screen must not present them as one list.
   */
  kind: "clinical" | "no-counterpart";
}

export interface FrameworkFacts {
  id: FrameworkId;
  /** "Ant Design", "Material UI". */
  name: string;
  /** The single peer major the bridge is written against. */
  supports: string;
  /** Every token the bridge can write, given a host theme that defines everything. */
  writes: readonly string[];
  /** Component tokens reached through those semantic tokens. */
  componentTokensReached: number;
  /** Distinct components at least one of those tokens belongs to. */
  componentsReached: number;
  unmapped: readonly UnmappedToken[];
}

/** The component-token surface, for the denominator beside every reach count. */
export const SURFACE_TOTAL = TOKEN_SURFACE.length;

/** Component tokens no bridge may ever write, in any framework. */
export const CLINICAL_TOTAL = NOT_BRIDGEABLE.length;

function factsFor<Host>(
  id: FrameworkId,
  bridge: BridgeDefinition<Host>,
  probe: Host,
): FrameworkFacts {
  const writes = Object.keys(resolvePatch(bridge, probe)).sort();
  const written = new Set(writes);

  /*
   * Reach, counted through the fallback chain rather than by name.
   *
   * A bridge writes `--zb-accent` once; forty component tokens fall through to
   * it. Counting only what the bridge writes would report 40-odd tokens for a
   * bridge that in fact restyles most of the library, which understates the
   * architecture by an order of magnitude — and that reach is the entire
   * argument for bridging tokens instead of swapping components.
   */
  const reached = TOKEN_SURFACE.filter(
    (entry) => entry.bridgeable && entry.semantic && written.has(entry.semantic),
  );

  return {
    id,
    name: bridge.framework,
    supports: bridge.supports,
    writes,
    componentTokensReached: reached.length,
    componentsReached: new Set(reached.map((entry) => entry.component)).size,
    unmapped: bridge.unmapped.map((token) => ({
      token,
      kind: CLINICAL.has(token) ? "clinical" : "no-counterpart",
    })),
  };
}

/**
 * Both bridges, in a stable order.
 *
 * Computed once at module scope: the inputs are constants, so recomputing per
 * request would burn the same cycles for the same answer on every page view.
 */
export const FRAMEWORKS: readonly FrameworkFacts[] = [
  factsFor("antd", antdBridge, ANTD_PROBE),
  factsFor("mui", muiBridge, MUI_PROBE),
];

export function frameworkFacts(id: FrameworkId): FrameworkFacts | undefined {
  return FRAMEWORKS.find((framework) => framework.id === id);
}

/** Whether a token name is part of the published component surface. */
export function isSurfaceToken(name: string): boolean {
  return surfaceEntry(name) !== undefined;
}
