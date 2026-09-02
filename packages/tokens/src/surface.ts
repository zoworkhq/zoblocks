// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from the component token tier and the component
// stylesheets. Edit those, then re-run. CI fails if this file is stale.
//
// See content/decisions/0012-token-surface-is-a-contract.md

/**
 * The component token surface — every custom property a consumer may set to
 * restyle a component, and every property a theme bridge may write.
 *
 * This is a public contract. Removing or renaming an entry is a breaking
 * change, because customers style against these names. The manifest is
 * committed so that change shows up as a reviewable diff.
 *
 * 356 tokens across 31 components:
 *
 *   switch          55
 *   tabs            44
 *   banner          39
 *   accordion       29
 *   datetime        27
 *   badge           16
 *   field           14
 *   alert           12
 *   chart           11
 *   grid            11
 *   copilot         10
 *   loader          10
 *   recorder        10
 *   timeline         9
 *   cs               8
 *   nav              8
 *   menu             7
 *   range            6
 *   surface-card     6
 *   avatar           4
 *   rv               4
 *   absent           3
 *   value            3
 *   care-timeline    2
 *   presence         2
 *   allergy          1
 *   chart-header     1
 *   patient-chip     1
 *   prov             1
 *   risk             1
 *   stack            1
 *
 * `bridgeable: false` (91 tokens) marks the ones resolving to clinical
 * status or an identity flag. A host framework's `colorError` is not our
 * `status.critical`: ours carries a validated contrast floor and a 60° hue
 * separation from `status.low`, so the direction of an abnormal result
 * survives colour-vision deficiency. A bridge writing one of these would
 * replace a clinical signal with a brand colour.
 *
 * `fallback: false` (0 tokens) marks declarations that do not terminate in a
 * literal. Those render as nothing when no token system is present.
 */

export type TokenKind =
  | "color"
  | "dimension"
  | "duration"
  | "easing"
  | "font"
  | "shadow"
  | "number";

export interface SurfaceEntry {
  /** The custom property, exactly as declared. */
  readonly name: string;
  /** Group it belongs to — `tabs`, `avatar`, `badge`. */
  readonly component: string;
  /** Where the declaration lives. */
  readonly source: string;
  readonly kind: TokenKind;
  /** The `--ox-*` token this falls through to, when it has one. */
  readonly semantic?: string;
  /** Host-framework variables already in the chain, in order. */
  readonly frameworks: readonly string[];
  /** True when the chain ends in a literal rather than another `var()`. */
  readonly fallback: boolean;
  /** False for clinical status and identity flags. A bridge may not write these. */
  readonly bridgeable: boolean;
}

export const TOKEN_SURFACE: readonly SurfaceEntry[] = [
  {
    "name": "--ox-absent-error-fg",
    "component": "absent",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-absent-fg",
    "component": "absent",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-absent-restricted-fg",
    "component": "absent",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-flag-restricted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-accordion-body-fg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-border",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-divider",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-duration",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "duration",
    "semantic": "--ox-density-duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-font",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-font",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-gap",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-gap",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-gate-bg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-gate-border",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-header-bg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-header-bg-hover",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-bg-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-header-bg-open",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-header-fg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-icon-fg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-pad-x",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-pad-x",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-pad-y",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-pad-y",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-radius",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-radius-lg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-rail",
    "component": "accordion",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-rail-critical",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-accordion-rail-high",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-high",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-accordion-rail-low",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-low",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-accordion-rail-normal",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-normal",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-accordion-rail-restricted",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-flag-restricted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-accordion-rail-unknown",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-unknown",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-accordion-rail-width",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-restricted-bg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-flag-restricted-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-accordion-restricted-fg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-flag-restricted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-accordion-summary-fg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-target",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-target",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-accordion-withheld-fg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-alert-critical-bg",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-critical-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-alert-critical-border",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-critical-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-alert-critical-fg",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-alert-info-bg",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-low-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-alert-info-border",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-low-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-alert-info-fg",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-low",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-alert-pad-x",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-pad-x",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-alert-pad-y",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-pad-y",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-alert-radius",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-radius",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-alert-warning-bg",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-high-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-alert-warning-border",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-high-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-alert-warning-fg",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-high",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-allergy-gap",
    "component": "allergy",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-av-size",
    "component": "avatar",
    "source": "packages/identity/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-sw-bg",
    "component": "avatar",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-swatch-1-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-sw-border",
    "component": "avatar",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-swatch-1-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-sw-fg",
    "component": "avatar",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-swatch-1",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-badge-critical-bg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-critical-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-badge-critical-border",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-critical-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-badge-critical-fg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-badge-high-bg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-high-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-badge-high-border",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-high-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-badge-high-fg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-high",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-badge-low-bg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-low-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-badge-low-border",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-low-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-badge-low-fg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-low",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-badge-normal-bg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-normal-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-badge-normal-border",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-normal-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-badge-normal-fg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-normal",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-badge-radius",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-radius-full",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-badge-unknown-bg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-unknown-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-badge-unknown-border",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-unknown-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-badge-unknown-fg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-unknown",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-banner-bg",
    "component": "banner",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-banner-border",
    "component": "banner",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-banner-deceased-fg",
    "component": "banner",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-flag-deceased",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-banner-fg",
    "component": "banner",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-banner-meta-fg",
    "component": "banner",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-banner-restricted-bg",
    "component": "banner",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-flag-restricted-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-banner-restricted-border",
    "component": "banner",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-flag-restricted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-dur-escalate",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-dur-reveal",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-dur-swap",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-accent",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-accent",
    "frameworks": [
      "--ant-color-primary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-border",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [
      "--ant-color-border"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-border-subtle",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [
      "--ant-color-border-secondary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-critical",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-critical",
    "frameworks": [
      "--ant-color-error"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-identity-critical-bg",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-critical-bg",
    "frameworks": [
      "--ant-color-error-bg"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-identity-deceased",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-flag-deceased",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-identity-dur-alert",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "semantic": "--ox-duration-alert",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-dur-escalate",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "semantic": "--ox-duration-identity-escalate",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-dur-reveal",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "semantic": "--ox-duration-identity-reveal",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-dur-swap",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "semantic": "--ox-duration-identity-swap",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-ease",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "easing",
    "semantic": "--ox-ease",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-fg",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [
      "--ant-color-text"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-fg-faint",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text-subtle",
    "frameworks": [
      "--ant-color-text-quaternary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-fg-muted",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [
      "--ant-color-text-secondary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-fg-subtle",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text-subtle",
    "frameworks": [
      "--ant-color-text-tertiary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-fill",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-bg-muted",
    "frameworks": [
      "--ant-color-fill-tertiary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-fill-subtle",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-bg-subtle",
    "frameworks": [
      "--ant-color-fill-quaternary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-loop-skeleton",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "semantic": "--ox-duration-skeleton-loop",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-ok",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-normal",
    "frameworks": [
      "--ant-color-success"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-identity-ok-bg",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-normal-bg",
    "frameworks": [
      "--ant-color-success-bg"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-identity-ok-border",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-normal-border",
    "frameworks": [
      "--ant-color-success-border"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-identity-radius",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "dimension",
    "semantic": "--ox-radius",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-radius-lg",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "dimension",
    "semantic": "--ox-radius-lg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-restricted",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-flag-restricted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-identity-restricted-bg",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-flag-restricted-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-identity-surface",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-surface",
    "frameworks": [
      "--ant-color-bg-container"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-identity-warn",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-high",
    "frameworks": [
      "--ant-color-warning"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-identity-warn-bg",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-high-bg",
    "frameworks": [
      "--ant-color-warning-bg"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-identity-warn-border",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-high-border",
    "frameworks": [
      "--ant-color-warning-border"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-care-timeline-divider",
    "component": "care-timeline",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-care-timeline-meta",
    "component": "care-timeline",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-chart-axis",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border-strong",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-chart-band-bg",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-normal-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-chart-band-border",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-normal-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-chart-grid",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-chart-label-fg",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-chart-line",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-chart-line-width",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-chart-point",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-chart-point-radius",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-chart-point-radius-flagged",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-chart-surface",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-chart-header-tone",
    "component": "chart-header",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-copilot-accent",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--ox-accent",
    "frameworks": [
      "--ant-color-primary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-copilot-bad",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-critical",
    "frameworks": [
      "--ant-color-error"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-copilot-ink",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [
      "--ant-color-text"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-copilot-muted",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [
      "--ant-color-text-secondary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-copilot-ok",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-normal",
    "frameworks": [
      "--ant-color-success"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-copilot-radius",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "dimension",
    "semantic": "--ox-radius-lg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-copilot-rule",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [
      "--ant-color-border-secondary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-copilot-shadow",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "shadow",
    "frameworks": [
      "--ant-box-shadow-secondary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-copilot-surface",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--ox-surface",
    "frameworks": [
      "--ant-color-bg-container"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-copilot-warn",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-high",
    "frameworks": [
      "--ant-color-warning"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-cs-bg",
    "component": "cs",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-unknown-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-cs-border",
    "component": "cs",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-unknown-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-cs-fg",
    "component": "cs",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-unknown",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-cs-glyph",
    "component": "cs",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-cs-glyph-compact",
    "component": "cs",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-cs-height",
    "component": "cs",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "semantic": "--ox-cs-height-default",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-cs-height-compact",
    "component": "cs",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-cs-height-default",
    "component": "cs",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-cell-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-cell-hover-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-cell-muted-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-cell-radius",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-radius",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-cell-range-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-accent-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-cell-range-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-cell-selected-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-cell-selected-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-on-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-cell-size",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-chip-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-chip-border",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-chip-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-chip-on-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-chip-on-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-on-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-derived-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-duration",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "duration",
    "semantic": "--ox-density-duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-duration-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-duration-held-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-accent-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-duration-held-border",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-accent-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-font",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-font",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-gap",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-gap",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-held-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-popover-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-surface-overlay",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-popover-border",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-target",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-target",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-today-marker",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-datetime-weekday-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-field-bg",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-field-border",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border-strong",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-field-border-focus",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-focus-ring",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-field-border-invalid",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-field-error-fg",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-field-fg",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-field-hint-fg",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-field-label-fg",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-field-pad-x",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-pad-x",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-field-pad-y",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-pad-y",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-field-placeholder-fg",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-field-prefilled-bg",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-accent-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-field-prefilled-border",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-accent-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-field-radius",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-radius",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-grid-accent",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-grid-font",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "font",
    "semantic": "--ox-text-sm",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-grid-ink",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-grid-muted",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-grid-pad-x",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-grid-pad-y",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-grid-rule",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-grid-rule-strong",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-border-strong",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-grid-subtle",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-grid-sunk",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-grid-surface",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-loader-beat",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-loader-color",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "semantic": "--ox-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-loader-cycle",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-loader-ease",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "easing",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-loader-ease-out",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "easing",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-loader-scrim",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-loader-size",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-loader-stroke",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-loader-track",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-loader-color",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-loader-z",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "number",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-menu-bg",
    "component": "menu",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-surface-overlay",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-menu-border",
    "component": "menu",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-menu-radius",
    "component": "menu",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-radius-lg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-menu-row-hover-bg",
    "component": "menu",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-menu-sep",
    "component": "menu",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-menu-subject-bg",
    "component": "menu",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-menu-subject-border",
    "component": "menu",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-nav-bg",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-nav-bg-current",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-accent-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-nav-bg-hover",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-nav-border",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-nav-border-current",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-nav-fg",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-nav-fg-current",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-nav-radius",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-radius",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-patient-chip-rail",
    "component": "patient-chip",
    "source": "packages/identity/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-presence-avatar",
    "component": "presence",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-presence-ring",
    "component": "presence",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-normal",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-prov-glyph",
    "component": "prov",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-range-band",
    "component": "range",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-normal-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-range-band-border",
    "component": "range",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-normal-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-range-height",
    "component": "range",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-range-marker",
    "component": "range",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-range-marker-abnormal",
    "component": "range",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-range-track",
    "component": "range",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-recorder-bar-gap",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-recorder-bar-w",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-recorder-lane-h",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-recorder-pane",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-recorder-rec",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-recording",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-recorder-rec-ink",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-recorder-rec-line",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-recording-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-recorder-rec-soft",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-recording-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-recorder-wave",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-recorder-wave-off",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-risk-figure",
    "component": "risk",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-rv-gap",
    "component": "rv",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-rv-value-compact",
    "component": "rv",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-rv-value-default",
    "component": "rv",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-rv-value-size",
    "component": "rv",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "semantic": "--ox-rv-value-default",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-stack-accent",
    "component": "stack",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-surface-card-bg",
    "component": "surface-card",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-surface-card-border",
    "component": "surface-card",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-surface-card-pad-x",
    "component": "surface-card",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-pad-x",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-surface-card-pad-y",
    "component": "surface-card",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-pad-y",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-surface-card-radius",
    "component": "surface-card",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-radius-lg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-surface-card-shadow",
    "component": "surface-card",
    "source": "packages/tokens/tokens/component.json",
    "kind": "shadow",
    "semantic": "--ox-shadow-sm",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-desc-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-duration",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "duration",
    "semantic": "--ox-duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-ease",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "easing",
    "semantic": "--ox-ease",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-error-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-focus-offset",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-focus-ring",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-focus-ring",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-focus-width",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-gap",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-gap",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-hold-ms",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-hold-ring",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-high",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-impact-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-low-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-impact-border",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-low",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-impact-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-label-font",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-text-2xs",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-label-off-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-on-fill",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-label-on-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-on-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-locked-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-bg-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-locked-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-flag-restricted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-pad",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-pending-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-low",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-prov-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-queued-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-low",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-radius",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-radius-full",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-segment-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-segment-border",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border-strong",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-segment-divider",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-segment-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-segment-hover-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-bg-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-segment-unasked-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-unknown-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-segment-unasked-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-unknown",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-stale-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-flag-restricted-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-stale-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-flag-restricted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-state-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-state-font",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-text-xs",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-state-on-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-target-min",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--ox-density-target",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-thumb-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-thumb-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-thumb-size",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-thumb-unknown-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-unknown",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-thumb-unknown-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-track-caution-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-high",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-track-critical-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-track-h",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-track-neutral-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-track-off-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border-strong",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-track-off-border",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-border-strong",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-track-on-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-track-on-border",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-track-unknown-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-unknown-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-track-unknown-border",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-unknown",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-track-w",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-switch-until-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-high-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-until-border",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-high-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-switch-until-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-status-high",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-tabs-accent",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-accent",
    "frameworks": [
      "--ant-color-primary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-accent-border",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-accent-border",
    "frameworks": [
      "--ant-color-primary-border"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-accent-fg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-accent-hover",
    "frameworks": [
      "--ant-color-primary-hover"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-accent-subtle",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-accent-subtle",
    "frameworks": [
      "--ant-color-primary-bg"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-badge-bg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-bg-muted",
    "frameworks": [
      "--ant-color-fill-tertiary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-badge-bg-selected",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "semantic": "--ox-tabs-accent-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-badge-fg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [
      "--ant-color-text-secondary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-badge-fg-selected",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "semantic": "--ox-tabs-accent-fg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-bg-hover",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-border",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [
      "--ant-color-border"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-critical",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-critical",
    "frameworks": [
      "--ant-color-error"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-tabs-critical-bg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-critical-bg",
    "frameworks": [
      "--ant-color-error-bg"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-tabs-duration",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "duration",
    "semantic": "--ox-duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-ease",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "easing",
    "semantic": "--ox-ease",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-fg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [
      "--ant-color-text-secondary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-fg-disabled",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text-subtle",
    "frameworks": [
      "--ant-color-text-disabled"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-fg-hover",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [
      "--ant-color-text"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-fg-selected",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [
      "--ant-color-text"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-focus",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-focus-ring",
    "frameworks": [
      "--ant-color-primary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-font",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "font",
    "semantic": "--ox-density-font",
    "frameworks": [
      "--ant-font-size"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-gap",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-high",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-high",
    "frameworks": [
      "--ant-color-warning"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-tabs-high-bg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-high-bg",
    "frameworks": [
      "--ant-color-warning-bg"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-tabs-high-border",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-high-border",
    "frameworks": [
      "--ant-color-warning-border"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-tabs-indicator",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "semantic": "--ox-tabs-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-indicator-radius",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-indicator-size",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-min-h",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "semantic": "--ox-density-target",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-normal",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-status-normal",
    "frameworks": [
      "--ant-color-success"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--ox-tabs-pad-x",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "semantic": "--ox-density-pad-x",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-pad-y",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "semantic": "--ox-density-pad-y",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-rail",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [
      "--ant-color-border-secondary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-surface",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-surface",
    "frameworks": [
      "--ant-color-bg-container"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-surface-subtle",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-bg-subtle",
    "frameworks": [
      "--ant-color-fill-quaternary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-thumb-bg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-surface-raised",
    "frameworks": [
      "--ant-color-bg-container"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-thumb-border",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-thumb-radius",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-thumb-shadow",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "shadow",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-track-bg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--ox-bg-muted",
    "frameworks": [
      "--ant-color-fill-tertiary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-track-border",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-track-pad",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-track-radius",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "semantic": "--ox-radius-xl",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-weight",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "number",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-tabs-weight-selected",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "number",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-timeline-font",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "font",
    "semantic": "--ox-density-font",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-timeline-gap",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-timeline-node-bg",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-timeline-node-border",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-timeline-node-fg",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-timeline-node-size",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-timeline-rail",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--ox-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-timeline-rail-width",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-timeline-row-gap",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-value-fg",
    "component": "value",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-value-font",
    "component": "value",
    "source": "packages/tokens/tokens/component.json",
    "kind": "font",
    "semantic": "--ox-font-numeric",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--ox-value-unit-fg",
    "component": "value",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--ox-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  }
];

/** Every component group with an override surface. */
export const SURFACE_COMPONENTS: readonly string[] = [
  "absent",
  "accordion",
  "alert",
  "allergy",
  "avatar",
  "badge",
  "banner",
  "care-timeline",
  "chart",
  "chart-header",
  "copilot",
  "cs",
  "datetime",
  "field",
  "grid",
  "loader",
  "menu",
  "nav",
  "patient-chip",
  "presence",
  "prov",
  "range",
  "recorder",
  "risk",
  "rv",
  "stack",
  "surface-card",
  "switch",
  "tabs",
  "timeline",
  "value"
];

/** The tokens a theme bridge is permitted to write. */
export const BRIDGEABLE: readonly string[] = [
  "--ox-absent-fg",
  "--ox-accordion-body-fg",
  "--ox-accordion-border",
  "--ox-accordion-divider",
  "--ox-accordion-duration",
  "--ox-accordion-font",
  "--ox-accordion-gap",
  "--ox-accordion-gate-bg",
  "--ox-accordion-gate-border",
  "--ox-accordion-header-bg",
  "--ox-accordion-header-bg-hover",
  "--ox-accordion-header-bg-open",
  "--ox-accordion-header-fg",
  "--ox-accordion-icon-fg",
  "--ox-accordion-pad-x",
  "--ox-accordion-pad-y",
  "--ox-accordion-radius",
  "--ox-accordion-rail",
  "--ox-accordion-rail-width",
  "--ox-accordion-summary-fg",
  "--ox-accordion-target",
  "--ox-accordion-withheld-fg",
  "--ox-alert-pad-x",
  "--ox-alert-pad-y",
  "--ox-alert-radius",
  "--ox-allergy-gap",
  "--ox-av-size",
  "--ox-sw-bg",
  "--ox-sw-border",
  "--ox-sw-fg",
  "--ox-badge-radius",
  "--ox-banner-bg",
  "--ox-banner-border",
  "--ox-banner-fg",
  "--ox-banner-meta-fg",
  "--ox-dur-escalate",
  "--ox-dur-reveal",
  "--ox-dur-swap",
  "--ox-identity-accent",
  "--ox-identity-border",
  "--ox-identity-border-subtle",
  "--ox-identity-dur-alert",
  "--ox-identity-dur-escalate",
  "--ox-identity-dur-reveal",
  "--ox-identity-dur-swap",
  "--ox-identity-ease",
  "--ox-identity-fg",
  "--ox-identity-fg-faint",
  "--ox-identity-fg-muted",
  "--ox-identity-fg-subtle",
  "--ox-identity-fill",
  "--ox-identity-fill-subtle",
  "--ox-identity-loop-skeleton",
  "--ox-identity-radius",
  "--ox-identity-radius-lg",
  "--ox-identity-surface",
  "--ox-care-timeline-divider",
  "--ox-care-timeline-meta",
  "--ox-chart-axis",
  "--ox-chart-grid",
  "--ox-chart-label-fg",
  "--ox-chart-line",
  "--ox-chart-line-width",
  "--ox-chart-point",
  "--ox-chart-point-radius",
  "--ox-chart-point-radius-flagged",
  "--ox-chart-surface",
  "--ox-chart-header-tone",
  "--ox-copilot-accent",
  "--ox-copilot-ink",
  "--ox-copilot-muted",
  "--ox-copilot-radius",
  "--ox-copilot-rule",
  "--ox-copilot-shadow",
  "--ox-copilot-surface",
  "--ox-cs-glyph",
  "--ox-cs-glyph-compact",
  "--ox-cs-height",
  "--ox-cs-height-compact",
  "--ox-cs-height-default",
  "--ox-datetime-cell-fg",
  "--ox-datetime-cell-hover-bg",
  "--ox-datetime-cell-muted-fg",
  "--ox-datetime-cell-radius",
  "--ox-datetime-cell-range-bg",
  "--ox-datetime-cell-range-fg",
  "--ox-datetime-cell-selected-bg",
  "--ox-datetime-cell-selected-fg",
  "--ox-datetime-cell-size",
  "--ox-datetime-chip-bg",
  "--ox-datetime-chip-border",
  "--ox-datetime-chip-fg",
  "--ox-datetime-chip-on-bg",
  "--ox-datetime-chip-on-fg",
  "--ox-datetime-derived-fg",
  "--ox-datetime-duration",
  "--ox-datetime-duration-bg",
  "--ox-datetime-duration-held-bg",
  "--ox-datetime-duration-held-border",
  "--ox-datetime-font",
  "--ox-datetime-gap",
  "--ox-datetime-held-fg",
  "--ox-datetime-popover-bg",
  "--ox-datetime-popover-border",
  "--ox-datetime-target",
  "--ox-datetime-today-marker",
  "--ox-datetime-weekday-fg",
  "--ox-field-bg",
  "--ox-field-border",
  "--ox-field-border-focus",
  "--ox-field-fg",
  "--ox-field-hint-fg",
  "--ox-field-label-fg",
  "--ox-field-pad-x",
  "--ox-field-pad-y",
  "--ox-field-placeholder-fg",
  "--ox-field-prefilled-bg",
  "--ox-field-prefilled-border",
  "--ox-field-radius",
  "--ox-grid-accent",
  "--ox-grid-font",
  "--ox-grid-ink",
  "--ox-grid-muted",
  "--ox-grid-pad-x",
  "--ox-grid-pad-y",
  "--ox-grid-rule",
  "--ox-grid-rule-strong",
  "--ox-grid-subtle",
  "--ox-grid-sunk",
  "--ox-grid-surface",
  "--ox-loader-beat",
  "--ox-loader-color",
  "--ox-loader-cycle",
  "--ox-loader-ease",
  "--ox-loader-ease-out",
  "--ox-loader-scrim",
  "--ox-loader-size",
  "--ox-loader-stroke",
  "--ox-loader-track",
  "--ox-loader-z",
  "--ox-menu-bg",
  "--ox-menu-border",
  "--ox-menu-radius",
  "--ox-menu-row-hover-bg",
  "--ox-menu-sep",
  "--ox-menu-subject-bg",
  "--ox-menu-subject-border",
  "--ox-nav-bg",
  "--ox-nav-bg-current",
  "--ox-nav-bg-hover",
  "--ox-nav-border",
  "--ox-nav-border-current",
  "--ox-nav-fg",
  "--ox-nav-fg-current",
  "--ox-nav-radius",
  "--ox-patient-chip-rail",
  "--ox-presence-avatar",
  "--ox-prov-glyph",
  "--ox-range-height",
  "--ox-range-marker",
  "--ox-range-track",
  "--ox-recorder-bar-gap",
  "--ox-recorder-bar-w",
  "--ox-recorder-lane-h",
  "--ox-recorder-pane",
  "--ox-recorder-wave",
  "--ox-recorder-wave-off",
  "--ox-risk-figure",
  "--ox-rv-gap",
  "--ox-rv-value-compact",
  "--ox-rv-value-default",
  "--ox-rv-value-size",
  "--ox-stack-accent",
  "--ox-surface-card-bg",
  "--ox-surface-card-border",
  "--ox-surface-card-pad-x",
  "--ox-surface-card-pad-y",
  "--ox-surface-card-radius",
  "--ox-surface-card-shadow",
  "--ox-switch-desc-fg",
  "--ox-switch-duration",
  "--ox-switch-ease",
  "--ox-switch-focus-offset",
  "--ox-switch-focus-ring",
  "--ox-switch-focus-width",
  "--ox-switch-gap",
  "--ox-switch-hold-ms",
  "--ox-switch-impact-fg",
  "--ox-switch-label-font",
  "--ox-switch-label-off-fg",
  "--ox-switch-label-on-fg",
  "--ox-switch-locked-bg",
  "--ox-switch-pad",
  "--ox-switch-prov-fg",
  "--ox-switch-radius",
  "--ox-switch-segment-bg",
  "--ox-switch-segment-border",
  "--ox-switch-segment-divider",
  "--ox-switch-segment-fg",
  "--ox-switch-segment-hover-bg",
  "--ox-switch-state-fg",
  "--ox-switch-state-font",
  "--ox-switch-state-on-fg",
  "--ox-switch-target-min",
  "--ox-switch-thumb-bg",
  "--ox-switch-thumb-fg",
  "--ox-switch-thumb-size",
  "--ox-switch-thumb-unknown-fg",
  "--ox-switch-track-h",
  "--ox-switch-track-neutral-bg",
  "--ox-switch-track-off-bg",
  "--ox-switch-track-off-border",
  "--ox-switch-track-on-bg",
  "--ox-switch-track-on-border",
  "--ox-switch-track-w",
  "--ox-tabs-accent",
  "--ox-tabs-accent-border",
  "--ox-tabs-accent-fg",
  "--ox-tabs-accent-subtle",
  "--ox-tabs-badge-bg",
  "--ox-tabs-badge-bg-selected",
  "--ox-tabs-badge-fg",
  "--ox-tabs-badge-fg-selected",
  "--ox-tabs-bg-hover",
  "--ox-tabs-border",
  "--ox-tabs-duration",
  "--ox-tabs-ease",
  "--ox-tabs-fg",
  "--ox-tabs-fg-disabled",
  "--ox-tabs-fg-hover",
  "--ox-tabs-fg-selected",
  "--ox-tabs-focus",
  "--ox-tabs-font",
  "--ox-tabs-gap",
  "--ox-tabs-indicator",
  "--ox-tabs-indicator-radius",
  "--ox-tabs-indicator-size",
  "--ox-tabs-min-h",
  "--ox-tabs-pad-x",
  "--ox-tabs-pad-y",
  "--ox-tabs-rail",
  "--ox-tabs-surface",
  "--ox-tabs-surface-subtle",
  "--ox-tabs-thumb-bg",
  "--ox-tabs-thumb-border",
  "--ox-tabs-thumb-radius",
  "--ox-tabs-thumb-shadow",
  "--ox-tabs-track-bg",
  "--ox-tabs-track-border",
  "--ox-tabs-track-pad",
  "--ox-tabs-track-radius",
  "--ox-tabs-weight",
  "--ox-tabs-weight-selected",
  "--ox-timeline-font",
  "--ox-timeline-gap",
  "--ox-timeline-node-bg",
  "--ox-timeline-node-border",
  "--ox-timeline-node-fg",
  "--ox-timeline-node-size",
  "--ox-timeline-rail",
  "--ox-timeline-rail-width",
  "--ox-timeline-row-gap",
  "--ox-value-fg",
  "--ox-value-font",
  "--ox-value-unit-fg"
];

/**
 * The tokens a theme bridge must never write, and a customer theme may never
 * override. Exported so a bridge's own test can assert it wrote none of them.
 */
export const NOT_BRIDGEABLE: readonly string[] = [
  "--ox-absent-error-fg",
  "--ox-absent-restricted-fg",
  "--ox-accordion-rail-critical",
  "--ox-accordion-rail-high",
  "--ox-accordion-rail-low",
  "--ox-accordion-rail-normal",
  "--ox-accordion-rail-restricted",
  "--ox-accordion-rail-unknown",
  "--ox-accordion-restricted-bg",
  "--ox-accordion-restricted-fg",
  "--ox-alert-critical-bg",
  "--ox-alert-critical-border",
  "--ox-alert-critical-fg",
  "--ox-alert-info-bg",
  "--ox-alert-info-border",
  "--ox-alert-info-fg",
  "--ox-alert-warning-bg",
  "--ox-alert-warning-border",
  "--ox-alert-warning-fg",
  "--ox-badge-critical-bg",
  "--ox-badge-critical-border",
  "--ox-badge-critical-fg",
  "--ox-badge-high-bg",
  "--ox-badge-high-border",
  "--ox-badge-high-fg",
  "--ox-badge-low-bg",
  "--ox-badge-low-border",
  "--ox-badge-low-fg",
  "--ox-badge-normal-bg",
  "--ox-badge-normal-border",
  "--ox-badge-normal-fg",
  "--ox-badge-unknown-bg",
  "--ox-badge-unknown-border",
  "--ox-badge-unknown-fg",
  "--ox-banner-deceased-fg",
  "--ox-banner-restricted-bg",
  "--ox-banner-restricted-border",
  "--ox-identity-critical",
  "--ox-identity-critical-bg",
  "--ox-identity-deceased",
  "--ox-identity-ok",
  "--ox-identity-ok-bg",
  "--ox-identity-ok-border",
  "--ox-identity-restricted",
  "--ox-identity-restricted-bg",
  "--ox-identity-warn",
  "--ox-identity-warn-bg",
  "--ox-identity-warn-border",
  "--ox-chart-band-bg",
  "--ox-chart-band-border",
  "--ox-copilot-bad",
  "--ox-copilot-ok",
  "--ox-copilot-warn",
  "--ox-cs-bg",
  "--ox-cs-border",
  "--ox-cs-fg",
  "--ox-field-border-invalid",
  "--ox-field-error-fg",
  "--ox-presence-ring",
  "--ox-range-band",
  "--ox-range-band-border",
  "--ox-range-marker-abnormal",
  "--ox-recorder-rec",
  "--ox-recorder-rec-ink",
  "--ox-recorder-rec-line",
  "--ox-recorder-rec-soft",
  "--ox-switch-error-fg",
  "--ox-switch-hold-ring",
  "--ox-switch-impact-bg",
  "--ox-switch-impact-border",
  "--ox-switch-locked-fg",
  "--ox-switch-pending-fg",
  "--ox-switch-queued-fg",
  "--ox-switch-segment-unasked-bg",
  "--ox-switch-segment-unasked-fg",
  "--ox-switch-stale-bg",
  "--ox-switch-stale-fg",
  "--ox-switch-thumb-unknown-bg",
  "--ox-switch-track-caution-bg",
  "--ox-switch-track-critical-bg",
  "--ox-switch-track-unknown-bg",
  "--ox-switch-track-unknown-border",
  "--ox-switch-until-bg",
  "--ox-switch-until-border",
  "--ox-switch-until-fg",
  "--ox-tabs-critical",
  "--ox-tabs-critical-bg",
  "--ox-tabs-high",
  "--ox-tabs-high-bg",
  "--ox-tabs-high-border",
  "--ox-tabs-normal"
];

/**
 * Semantic tokens carrying a clinical meaning — every `status.*` and
 * `flag.*`.
 *
 * The tier *above* `NOT_BRIDGEABLE`: those are the component tokens that fall
 * through to one of these. Both are generated from the same rule, and this one
 * is complete whether or not a component references the token yet — which is
 * the distinction a consumer cannot make from `NOT_BRIDGEABLE` alone.
 */
export const CLINICAL_SEMANTIC: readonly string[] = [
  "--ox-flag-deceased",
  "--ox-flag-provisional",
  "--ox-flag-restricted",
  "--ox-flag-restricted-bg",
  "--ox-status-critical",
  "--ox-status-critical-bg",
  "--ox-status-critical-border",
  "--ox-status-high",
  "--ox-status-high-bg",
  "--ox-status-high-border",
  "--ox-status-low",
  "--ox-status-low-bg",
  "--ox-status-low-border",
  "--ox-status-normal",
  "--ox-status-normal-bg",
  "--ox-status-normal-border",
  "--ox-status-provisional",
  "--ox-status-provisional-bg",
  "--ox-status-provisional-border",
  "--ox-status-recording",
  "--ox-status-recording-bg",
  "--ox-status-recording-border",
  "--ox-status-restricted",
  "--ox-status-restricted-bg",
  "--ox-status-restricted-border",
  "--ox-status-unknown",
  "--ox-status-unknown-bg",
  "--ox-status-unknown-border"
];

/** Lookup by custom-property name. */
export function surfaceEntry(name: string): SurfaceEntry | undefined {
  return TOKEN_SURFACE.find((e) => e.name === name);
}

/** Every token belonging to one component. */
export function surfaceFor(component: string): readonly SurfaceEntry[] {
  return TOKEN_SURFACE.filter((e) => e.component === component);
}
