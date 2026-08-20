/**
 * A published theme, in the shape the console stores.
 *
 * `northwind` deliberately, matching the worked brand the token gate already
 * runs against — so the console's fixture and the build's fixture are the same
 * customer, and a divergence between the two channels shows up as a difference
 * in one palette rather than two unrelated ones.
 */

import { emptyAssets, type ThemeDocument } from "../src/document";
// The current version rather than a literal: this fixture stands for "a theme
// that was just validated", and pinning the string meant every validator bump
// silently turned it into "a theme that needs re-validating" — which is a real
// behaviour with its own test, and not what the other twenty are about.
import { VALIDATOR_VERSION } from "../src/validate";

export function publishedTheme(overrides: Partial<ThemeDocument> = {}): ThemeDocument {
  return {
    id: "thm_01",
    orgId: "org_01",
    name: "Northwind Clinical",
    slug: "northwind-clinical",
    version: 7,
    status: "published",
    tokens: {
      ref: {
        brand: {
          "50": "#eff6ff",
          "200": "#bfdbfe",
          "500": "#3b82f6",
          "600": "#1d63c9",
          "700": "#1a53a8",
          "800": "#17458a",
        },
      },
      // Empty rather than absent: this fixture stands for a theme authored
      // through the current console, which always writes all three tiers.
      // `emit.test.ts` covers the pre-migration `{ ref: … }` shape explicitly.
      semantic: { light: {}, dark: {}, "high-contrast": {} },
      component: { light: {}, dark: {}, "high-contrast": {} },
    },
    assets: emptyAssets(),
    validation: {
      validatedAt: "2026-08-19T09:14:22.000Z",
      validatorVersion: VALIDATOR_VERSION,
      contrastPairs: { checked: 78, failed: 0 },
      themes: ["light", "dark", "high-contrast"],
    },
    audit: {
      createdBy: "usr_01",
      createdAt: "2026-08-01T10:00:00.000Z",
      publishedBy: "usr_01",
      publishedAt: "2026-08-17T09:14:22.000Z",
    },
    ...overrides,
  };
}
