/**
 * What the Figma plugin may read, and the one thing it may write.
 *
 * Three functions, and the asymmetry between them is the design. Two read; one
 * proposes. Nothing here publishes, and that is structural rather than
 * remembered: `publishTheme` is not imported, so there is no line to review for
 * whether it is reachable.
 *
 * See `content/decisions/0015-the-direction-of-truth-for-design-tool-sync.md`
 * for which side owns each tier. In short: Figma holds the brand anchor and
 * proposes it; the app holds the ramp, the semantic tier and the component
 * tier and pushes them; clinical tokens travel one way and are refused on the
 * way back.
 */

import { CLINICAL_SEMANTIC } from "@oxygenui-design/tokens/surface";
import {
  ANCHOR_STEP,
  RAMP_STEPS,
  generateRamp,
  type ValidationRecord,
} from "@oxygenui-design/theme";
import type { Authorized } from "@/lib/authorize";
import { THEME_NAMES, buildEditorModel, type ThemeName } from "@/lib/token-editor";
import { ThemeError, saveBrand, type BaseTokens } from "@/lib/themes";
import { withTierDefaults } from "@oxygenui-design/theme";

export interface ThemeSummary {
  slug: string;
  name: string;
  status: string;
  /** The version applications are running, or null before the first publish. */
  liveVersion: number | null;
  updatedAt: string;
}

export async function listThemes(auth: Authorized): Promise<ThemeSummary[]> {
  const themes = await auth.data.themes
    .find({ status: { $ne: "archived" } })
    .sort({ updatedAt: -1 })
    .toArray();

  return themes.map((theme) => ({
    slug: theme.slug,
    name: theme.name,
    status: theme.status,
    liveVersion: theme.liveVersion,
    updatedAt: theme.updatedAt.toISOString(),
  }));
}

/**
 * A theme resolved into the shape `figma-core`'s `toVariablePlan` consumes.
 *
 * The component tier is absent, and the absence is a decision rather than an
 * omission. `TOKEN_SURFACE` carries 282 entries but only 169 exist in the DTCG
 * component tier with a value; the other 113 are declared in stylesheets and
 * hold nothing a theme could push. Sending a partial tier that looks complete
 * is worse than sending none, so the opt-in ships with Phase 4 alongside the
 * checkbox that states the count before it writes anything.
 */
export interface ResolvedPayload {
  slug: string;
  name: string;
  /** The version this describes, or 0 for the draft. */
  version: number;
  status: "published" | "draft";
  ramp: Record<string, string>;
  semantic: Record<ThemeName, Record<string, string>>;
  /** Token names a customer may not change, mapped to why. */
  locked: Record<string, string>;
  /** Absent for a draft that has never been validated. */
  validation?: ValidationRecord;
}

const LOCKED_REASON =
  "Clinical. Carries a validated contrast floor and 60° of hue separation, so the direction of an abnormal result survives monochrome output and colour vision deficiency.";

export async function resolvedTheme(
  auth: Authorized,
  base: BaseTokens,
  slug: string,
  version?: number,
): Promise<ResolvedPayload | undefined> {
  const theme = await auth.data.themes.findOne({ slug });
  if (!theme) return undefined;

  /*
   * A named version, or the live one, or the draft — in that order.
   *
   * Asking for a version that does not exist returns nothing rather than
   * quietly serving the draft. A designer who pinned a file to v6 and receives
   * v7's colours under v6's number has been handed something that will not
   * reproduce, and they will find out from a stakeholder rather than from us.
   */
  const wanted = version ?? theme.liveVersion ?? undefined;
  const published =
    wanted === undefined
      ? null
      : await auth.data.versions.findOne({ themeId: theme._id, version: wanted });
  if (wanted !== undefined && !published) return undefined;

  const tokens = published?.tokens ?? withTierDefaults(theme.tokens);

  const semantic = {} as Record<ThemeName, Record<string, string>>;
  for (const name of THEME_NAMES) {
    semantic[name] = buildEditorModel(base, theme.slug, tokens, name).resolved;
  }

  return {
    slug: theme.slug,
    name: theme.name,
    version: published?.version ?? 0,
    status: published ? "published" : "draft",
    ramp: rampOf(tokens),
    semantic,
    locked: Object.fromEntries(CLINICAL_SEMANTIC.map((token) => [token, LOCKED_REASON])),
    ...(published?.validation ? { validation: published.validation } : {}),
  };
}

/** The eleven steps as strings, which is the key space a variable plan uses. */
function rampOf(tokens: ReturnType<typeof withTierDefaults>): Record<string, string> {
  const brand = tokens.ref.brand ?? {};
  const out: Record<string, string> = {};
  for (const step of RAMP_STEPS) {
    const value = brand[String(step) as keyof typeof brand];
    if (typeof value === "string") out[String(step)] = value;
  }
  return out;
}

export interface Proposal {
  slug: string;
  anchor: string;
  steps: number;
  /** Where a person with the role for it reviews and publishes. */
  url: string;
}

/**
 * One brand colour in; a draft out, and never anything more.
 *
 * The plugin sends an anchor, not a ramp. The app derives the other ten
 * steps with `generateRamp` — the same function the new-theme form runs — so a
 * designer cannot hand over eleven hand-picked values under the name of one
 * decision. ADR 0015 puts the ramp on the app's side of the line; this is
 * where that line is.
 *
 * `saveBrand` then validates and *refuses* rather than warning, so a failing
 * anchor never becomes a draft. The response is a URL, because publishing stays
 * an app action by a person with the role for it.
 */
export async function proposeBrand(
  auth: Authorized,
  base: BaseTokens,
  origin: string,
  slug: string,
  anchor: unknown,
): Promise<Proposal> {
  if (typeof anchor !== "string" || !anchor.trim()) {
    throw new ThemeError("Send a brand colour as `anchor`.");
  }

  const theme = await auth.data.themes.findOne({ slug });
  if (!theme) throw new ThemeError("No such theme.");

  const ramp = generateRamp(anchor.trim());
  if (!ramp) {
    throw new ThemeError(`"${anchor}" is not a colour.`, [
      "A six-digit hex, like #1d63c9. The other ten steps are derived from it.",
    ]);
  }

  const { steps } = await saveBrand(auth, base, theme._id, ramp);

  return {
    slug: theme.slug,
    anchor: ramp[ANCHOR_STEP],
    steps,
    url: `${origin}/themes/${theme.slug}/brand`,
  };
}
