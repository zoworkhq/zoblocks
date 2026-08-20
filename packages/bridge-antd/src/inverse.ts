/**
 * The inverse bridge: an Oxygen brand, pushed into Ant Design.
 *
 * `AntdBridge` answers "make Oxygen's components look like our antd app".
 * This answers the question customers actually ask second, and care about
 * more: *"we configured our brand in your console — why do our **own** buttons
 * still look like Ant Design's default blue?"*
 *
 * Same correspondence as `map.ts`, read the other way. That is deliberate and
 * it is what keeps the two honest: if `colorPrimary ↔ --ox-accent` is ever
 * wrong, it is wrong in both directions and one test catches it.
 *
 * **What is not pushed.** Clinical status, again, and for the mirror-image
 * reason. Going in, a host's `colorError` must not become `status.critical`
 * because it has passed no gate. Coming out, `status.critical` must not become
 * `colorError` because antd will apply it to a validation message and a delete
 * button — a colour that means *this result is dangerous* used to mean *this
 * form field is wrong*. The token is safe; the meaning does not survive.
 */

import { toPx, type OxygenTokens } from "@oxygenui-design/bridge-core";

/** The shape `ConfigProvider` takes. Structural, so antd stays a peer. */
export interface AntdThemeConfig {
  token?: Record<string, string | number>;
}

/**
 * An Oxygen brand as antd's token object.
 *
 * Only the tokens with an honest counterpart, the same rule the forward bridge
 * follows: antd has around a hundred seed tokens and filling them from a
 * palette we have no equivalents for would produce a theme that is uniformly
 * slightly wrong.
 */
export function toAntdTheme(tokens: OxygenTokens): AntdThemeConfig {
  const token: Record<string, string | number> = {};

  const set = (key: string, value: string | number | undefined) => {
    if (value !== undefined && value !== "") token[key] = value;
  };

  set("colorPrimary", tokens["--ox-accent"]);
  set("colorPrimaryHover", tokens["--ox-accent-hover"]);
  set("colorPrimaryBg", tokens["--ox-accent-subtle"]);
  set("colorPrimaryBorder", tokens["--ox-accent-border"]);

  set("colorText", tokens["--ox-text"]);
  set("colorTextSecondary", tokens["--ox-text-muted"]);
  set("colorTextTertiary", tokens["--ox-text-subtle"]);

  set("colorBgLayout", tokens["--ox-bg"]);
  set("colorBgContainer", tokens["--ox-surface"]);
  set("colorBgElevated", tokens["--ox-surface-raised"]);
  set("colorFillQuaternary", tokens["--ox-bg-subtle"]);
  set("colorFillTertiary", tokens["--ox-bg-muted"]);

  set("colorBorder", tokens["--ox-border"]);

  // antd states radii as numbers of pixels; Oxygen states them in rem.
  set("borderRadiusSM", toPx(tokens["--ox-radius-sm"]));
  set("borderRadius", toPx(tokens["--ox-radius"]));
  set("borderRadiusLG", toPx(tokens["--ox-radius-lg"]));

  set("fontFamily", tokens["--ox-font-sans"]);
  set("fontFamilyCode", tokens["--ox-font-mono"]);
  set("fontSize", toPx(tokens["--ox-text-base"]));

  set("motionDurationMid", tokens["--ox-duration"]);
  set("motionEaseInOut", tokens["--ox-ease"]);

  return { token };
}

/**
 * Tokens deliberately not written, for the docs table.
 *
 * Named so a customer sees the boundary before they file it as a bug, and so
 * the reason travels with the code rather than living in a wiki.
 */
export const NOT_PUSHED_TO_ANTD = [
  "colorError",
  "colorWarning",
  "colorSuccess",
  "colorInfo",
] as const;
