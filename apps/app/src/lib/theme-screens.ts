import {
  ArrowLeftRight,
  Blocks,
  Droplet,
  History,
  LayoutGrid,
  SlidersHorizontal,
  Shapes,
  Type as TypeIcon,
} from "lucide-react";
import { RAMP_STEPS, type ThemeTokens } from "@oxygenui-design/theme";

/**
 * The eight screens that operate on one theme — declared once.
 *
 * They were declared in the rail, as two hardcoded arrays. That was survivable
 * while the rail was the only thing that listed them, and it stopped being
 * survivable the moment the theme page needed the same list: three copies of
 * "what screens does a theme have", drifting the first time one gained a
 * screen the others did not.
 *
 * So the table is the source and the components are readers. Adding a screen is
 * one row here — its address, its label, its icon, the sentence explaining it,
 * and how to say what state it is in. Nothing else in the app has to be
 * touched, which is the whole test of whether a structure like this earns its
 * place.
 *
 * `status` lives on the row for the same reason. Keeping it in a second map
 * keyed by `path` would recreate exactly the drift this removes — two
 * structures, same keys, no compiler complaining when one gains an entry.
 *
 * Playground is deliberately absent: it compares every theme an organisation
 * has rather than operating on one, so it is not theme-scoped and the rail
 * adds it separately.
 */

export interface ThemeFacts {
  tokens: ThemeTokens;
  /** Faces uploaded for this theme. */
  fonts: number;
  /** Glyphs replaced. */
  icons: number;
  /** Published versions. */
  versions: number;
}

export interface ThemeScreen {
  /** The segment under `/themes/{slug}/`. Also the key. */
  path: string;
  label: string;
  /** Which rail group it belongs to. */
  group: "design" | "tools";
  Icon: typeof Droplet;
  /** One line. What the screen is for, not what it contains. */
  purpose: string;
  /**
   * What this screen currently holds, in three or four words.
   *
   * The reason the overview is a status board rather than a menu: "Tokens" is
   * a destination, "12 overrides" is a reason to go there. Returns undefined
   * when there is nothing true to say, which reads better than "0 of
   * something" on a theme nobody has touched yet.
   */
  status: (facts: ThemeFacts) => string | undefined;
}

/** Overrides across every theme layer — light, dark and high contrast together. */
function countLayer(layer: Record<string, Record<string, unknown>>): number {
  return Object.values(layer).reduce((total, entries) => total + Object.keys(entries).length, 0);
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export const THEME_SCREENS: readonly ThemeScreen[] = [
  {
    path: "brand",
    label: "Brand",
    group: "design",
    Icon: Droplet,
    purpose: "The palette every semantic token resolves through.",
    status: ({ tokens }) => {
      const steps = Object.keys(tokens.ref.brand ?? {}).length;
      return steps ? `${steps} of ${RAMP_STEPS.length} steps set` : "No brand colour yet";
    },
  },
  {
    path: "tokens",
    label: "Tokens",
    group: "design",
    Icon: SlidersHorizontal,
    purpose: "Three tiers, measured against the contrast floors on every edit.",
    status: ({ tokens }) => {
      const n = countLayer(tokens.semantic);
      return n ? plural(n, "override") : "Using the defaults";
    },
  },
  {
    path: "typography",
    label: "Typography",
    group: "design",
    Icon: TypeIcon,
    purpose: "The faces this brand ships, and the families that reference them.",
    status: ({ fonts }) => (fonts ? plural(fonts, "face") : "No faces uploaded"),
  },
  {
    path: "components",
    label: "Components",
    group: "design",
    Icon: Blocks,
    purpose: "Per-component values, for the few that have to differ.",
    status: ({ tokens }) => {
      const n = countLayer(tokens.component);
      return n ? plural(n, "override") : "All falling through";
    },
  },
  {
    path: "icons",
    label: "Icons",
    group: "design",
    Icon: Shapes,
    purpose: "The copilot's glyphs, where a brand has its own.",
    status: ({ icons }) =>
      icons ? plural(icons, "glyph replaced", "glyphs replaced") : "All shipped glyphs",
  },
  {
    path: "compare",
    label: "Compare",
    group: "tools",
    Icon: LayoutGrid,
    // Stated as a precondition rather than a feature: a reader who arrives with
    // one version should learn why there is nothing to see before they click.
    purpose: "Two published versions, token by token.",
    status: ({ versions }) =>
      versions >= 2 ? `${versions} versions to compare` : "Needs a second version",
  },
  {
    path: "history",
    label: "History",
    group: "tools",
    Icon: History,
    purpose: "Every publish, and the way back to one.",
    status: ({ versions }) => (versions ? plural(versions, "version") : "Never published"),
  },
  {
    path: "transfer",
    label: "Import and export",
    group: "tools",
    Icon: ArrowLeftRight,
    purpose: "Five ways out, one way in — including the antd and MUI mappings.",
    // Nothing about a theme changes what this screen offers.
    status: () => undefined,
  },
];

/** `/themes/{slug}/{path}`, in one place so the shape cannot drift either. */
export function themeScreenHref(slug: string, path: string): string {
  return `/themes/${slug}/${path}`;
}

export function themeScreens(group: ThemeScreen["group"]): readonly ThemeScreen[] {
  return THEME_SCREENS.filter((screen) => screen.group === group);
}
