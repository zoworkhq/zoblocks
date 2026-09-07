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
 * 358 tokens across 31 components:
 *
 *   switch          55
 *   tabs            44
 *   banner          39
 *   accordion       29
 *   datetime        27
 *   badge           16
 *   field           14
 *   grid            13
 *   alert           12
 *   chart           11
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
  /** The `--zb-*` token this falls through to, when it has one. */
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
    "name": "--zb-absent-error-fg",
    "component": "absent",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-absent-fg",
    "component": "absent",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-absent-restricted-fg",
    "component": "absent",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-flag-restricted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-accordion-body-fg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-border",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-divider",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-duration",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "duration",
    "semantic": "--zb-density-duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-font",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-font",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-gap",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-gap",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-gate-bg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-gate-border",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-header-bg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-header-bg-hover",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-bg-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-header-bg-open",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-header-fg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-icon-fg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-pad-x",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-pad-x",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-pad-y",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-pad-y",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-radius",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-radius-lg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-rail",
    "component": "accordion",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-rail-critical",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-accordion-rail-high",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-high",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-accordion-rail-low",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-low",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-accordion-rail-normal",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-normal",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-accordion-rail-restricted",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-flag-restricted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-accordion-rail-unknown",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-unknown",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-accordion-rail-width",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-restricted-bg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-flag-restricted-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-accordion-restricted-fg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-flag-restricted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-accordion-summary-fg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-target",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-target",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-accordion-withheld-fg",
    "component": "accordion",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-alert-critical-bg",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-critical-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-alert-critical-border",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-critical-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-alert-critical-fg",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-alert-info-bg",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-low-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-alert-info-border",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-low-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-alert-info-fg",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-low",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-alert-pad-x",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-pad-x",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-alert-pad-y",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-pad-y",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-alert-radius",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-radius",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-alert-warning-bg",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-high-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-alert-warning-border",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-high-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-alert-warning-fg",
    "component": "alert",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-high",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-allergy-gap",
    "component": "allergy",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-av-size",
    "component": "avatar",
    "source": "packages/identity/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-sw-bg",
    "component": "avatar",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-swatch-1-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-sw-border",
    "component": "avatar",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-swatch-1-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-sw-fg",
    "component": "avatar",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-swatch-1",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-badge-critical-bg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-critical-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-badge-critical-border",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-critical-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-badge-critical-fg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-badge-high-bg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-high-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-badge-high-border",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-high-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-badge-high-fg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-high",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-badge-low-bg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-low-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-badge-low-border",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-low-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-badge-low-fg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-low",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-badge-normal-bg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-normal-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-badge-normal-border",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-normal-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-badge-normal-fg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-normal",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-badge-radius",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-radius-full",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-badge-unknown-bg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-unknown-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-badge-unknown-border",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-unknown-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-badge-unknown-fg",
    "component": "badge",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-unknown",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-banner-bg",
    "component": "banner",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-banner-border",
    "component": "banner",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-banner-deceased-fg",
    "component": "banner",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-flag-deceased",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-banner-fg",
    "component": "banner",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-banner-meta-fg",
    "component": "banner",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-banner-restricted-bg",
    "component": "banner",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-flag-restricted-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-banner-restricted-border",
    "component": "banner",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-flag-restricted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-dur-escalate",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-dur-reveal",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-dur-swap",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-accent",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-accent",
    "frameworks": [
      "--ant-color-primary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-border",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [
      "--ant-color-border"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-border-subtle",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [
      "--ant-color-border-secondary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-critical",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-critical",
    "frameworks": [
      "--ant-color-error"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-identity-critical-bg",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-critical-bg",
    "frameworks": [
      "--ant-color-error-bg"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-identity-deceased",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-flag-deceased",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-identity-dur-alert",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "semantic": "--zb-duration-alert",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-dur-escalate",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "semantic": "--zb-duration-identity-escalate",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-dur-reveal",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "semantic": "--zb-duration-identity-reveal",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-dur-swap",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "semantic": "--zb-duration-identity-swap",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-ease",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "easing",
    "semantic": "--zb-ease",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-fg",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [
      "--ant-color-text"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-fg-faint",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text-subtle",
    "frameworks": [
      "--ant-color-text-quaternary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-fg-muted",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [
      "--ant-color-text-secondary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-fg-subtle",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text-subtle",
    "frameworks": [
      "--ant-color-text-tertiary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-fill",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-bg-muted",
    "frameworks": [
      "--ant-color-fill-tertiary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-fill-subtle",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-bg-subtle",
    "frameworks": [
      "--ant-color-fill-quaternary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-loop-skeleton",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "duration",
    "semantic": "--zb-duration-skeleton-loop",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-ok",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-normal",
    "frameworks": [
      "--ant-color-success"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-identity-ok-bg",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-normal-bg",
    "frameworks": [
      "--ant-color-success-bg"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-identity-ok-border",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-normal-border",
    "frameworks": [
      "--ant-color-success-border"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-identity-radius",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "dimension",
    "semantic": "--zb-radius",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-radius-lg",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "dimension",
    "semantic": "--zb-radius-lg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-restricted",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-flag-restricted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-identity-restricted-bg",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-flag-restricted-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-identity-surface",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-surface",
    "frameworks": [
      "--ant-color-bg-container"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-identity-warn",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-high",
    "frameworks": [
      "--ant-color-warning"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-identity-warn-bg",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-high-bg",
    "frameworks": [
      "--ant-color-warning-bg"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-identity-warn-border",
    "component": "banner",
    "source": "packages/identity/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-high-border",
    "frameworks": [
      "--ant-color-warning-border"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-care-timeline-divider",
    "component": "care-timeline",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-care-timeline-meta",
    "component": "care-timeline",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-chart-axis",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border-strong",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-chart-band-bg",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-normal-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-chart-band-border",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-normal-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-chart-grid",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-chart-label-fg",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-chart-line",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-chart-line-width",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-chart-point",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-chart-point-radius",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-chart-point-radius-flagged",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-chart-surface",
    "component": "chart",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-chart-header-tone",
    "component": "chart-header",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-copilot-accent",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--zb-accent",
    "frameworks": [
      "--ant-color-primary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-copilot-bad",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-critical",
    "frameworks": [
      "--ant-color-error"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-copilot-ink",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [
      "--ant-color-text"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-copilot-muted",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [
      "--ant-color-text-secondary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-copilot-ok",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-normal",
    "frameworks": [
      "--ant-color-success"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-copilot-radius",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "dimension",
    "semantic": "--zb-radius-lg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-copilot-rule",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [
      "--ant-color-border-secondary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-copilot-shadow",
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
    "name": "--zb-copilot-surface",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--zb-surface",
    "frameworks": [
      "--ant-color-bg-container"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-copilot-warn",
    "component": "copilot",
    "source": "packages/copilot/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-high",
    "frameworks": [
      "--ant-color-warning"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-cs-bg",
    "component": "cs",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-unknown-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-cs-border",
    "component": "cs",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-unknown-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-cs-fg",
    "component": "cs",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-unknown",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-cs-glyph",
    "component": "cs",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-cs-glyph-compact",
    "component": "cs",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-cs-height",
    "component": "cs",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "semantic": "--zb-cs-height-default",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-cs-height-compact",
    "component": "cs",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-cs-height-default",
    "component": "cs",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-cell-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-cell-hover-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent-wash",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-cell-muted-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-cell-radius",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-radius",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-cell-range-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-cell-range-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-cell-selected-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-cell-selected-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-on-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-cell-size",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-chip-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-chip-border",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-chip-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-chip-on-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-chip-on-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-on-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-derived-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-duration",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "duration",
    "semantic": "--zb-density-duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-duration-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-duration-held-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-duration-held-border",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-font",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-font",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-gap",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-gap",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-held-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-popover-bg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-surface-overlay",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-popover-border",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-target",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-target",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-today-marker",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-datetime-weekday-fg",
    "component": "datetime",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-field-bg",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-field-border",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border-strong",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-field-border-focus",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-focus-ring",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-field-border-invalid",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-field-error-fg",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-field-fg",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-field-hint-fg",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-field-label-fg",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-field-pad-x",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-pad-x",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-field-pad-y",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-pad-y",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-field-placeholder-fg",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-field-prefilled-bg",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-field-prefilled-border",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-field-radius",
    "component": "field",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-radius",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-grid-accent",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-grid-accent-bg",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-accent-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-grid-accent-line",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-accent-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-grid-font",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "font",
    "semantic": "--zb-text-sm",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-grid-ink",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-grid-muted",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-grid-pad-x",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-grid-pad-y",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-grid-rule",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-grid-rule-strong",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-border-strong",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-grid-subtle",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-grid-sunk",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-grid-surface",
    "component": "grid",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-loader-beat",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-loader-color",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "semantic": "--zb-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-loader-cycle",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-loader-ease",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "easing",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-loader-ease-out",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "easing",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-loader-scrim",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-loader-size",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-loader-stroke",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-loader-track",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-loader-color",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-loader-z",
    "component": "loader",
    "source": "packages/react/src/styles.css",
    "kind": "number",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-menu-bg",
    "component": "menu",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-surface-overlay",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-menu-border",
    "component": "menu",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-menu-radius",
    "component": "menu",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-radius-lg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-menu-row-hover-bg",
    "component": "menu",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-menu-sep",
    "component": "menu",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-menu-subject-bg",
    "component": "menu",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-menu-subject-border",
    "component": "menu",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-nav-bg",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-nav-bg-current",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-nav-bg-hover",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-nav-border",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-nav-border-current",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-nav-fg",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-nav-fg-current",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-nav-radius",
    "component": "nav",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-radius",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-patient-chip-rail",
    "component": "patient-chip",
    "source": "packages/identity/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-presence-avatar",
    "component": "presence",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-presence-ring",
    "component": "presence",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-normal",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-prov-glyph",
    "component": "prov",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-range-band",
    "component": "range",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-normal-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-range-band-border",
    "component": "range",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-normal-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-range-height",
    "component": "range",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-range-marker",
    "component": "range",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-range-marker-abnormal",
    "component": "range",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-range-track",
    "component": "range",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-recorder-bar-gap",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-recorder-bar-w",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-recorder-lane-h",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-recorder-pane",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-bg-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-recorder-rec",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-recording",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-recorder-rec-ink",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-recorder-rec-line",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-recording-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-recorder-rec-soft",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-recording-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-recorder-wave",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-recorder-wave-off",
    "component": "recorder",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-risk-figure",
    "component": "risk",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-rv-gap",
    "component": "rv",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-rv-value-compact",
    "component": "rv",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-rv-value-default",
    "component": "rv",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-rv-value-size",
    "component": "rv",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "semantic": "--zb-rv-value-default",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-stack-accent",
    "component": "stack",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-surface-card-bg",
    "component": "surface-card",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-surface-card-border",
    "component": "surface-card",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-surface-card-pad-x",
    "component": "surface-card",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-pad-x",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-surface-card-pad-y",
    "component": "surface-card",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-pad-y",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-surface-card-radius",
    "component": "surface-card",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-radius-lg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-surface-card-shadow",
    "component": "surface-card",
    "source": "packages/tokens/tokens/component.json",
    "kind": "shadow",
    "semantic": "--zb-shadow-sm",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-desc-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-duration",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "duration",
    "semantic": "--zb-duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-ease",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "easing",
    "semantic": "--zb-ease",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-error-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-focus-offset",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-focus-ring",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-focus-ring",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-focus-width",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-gap",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-gap",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-hold-ms",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-hold-ring",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-high",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-impact-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-low-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-impact-border",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-low",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-impact-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-label-font",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-text-2xs",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-label-off-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-on-fill",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-label-on-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-on-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-locked-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-bg-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-locked-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-flag-restricted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-pad",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-pending-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-low",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-prov-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-queued-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-low",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-radius",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-radius-full",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-segment-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-segment-border",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border-strong",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-segment-divider",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-segment-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-segment-hover-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-bg-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-segment-unasked-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-unknown-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-segment-unasked-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-unknown",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-stale-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-flag-restricted-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-stale-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-flag-restricted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-state-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-state-font",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-text-xs",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-state-on-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-target-min",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "semantic": "--zb-density-target",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-thumb-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-thumb-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-thumb-size",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-thumb-unknown-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-unknown",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-thumb-unknown-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-track-caution-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-high",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-track-critical-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-critical",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-track-h",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-track-neutral-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-track-off-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border-strong",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-track-off-border",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-border-strong",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-track-on-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-track-on-border",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-track-unknown-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-unknown-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-track-unknown-border",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-unknown",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-track-w",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-switch-until-bg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-high-bg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-until-border",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-high-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-switch-until-fg",
    "component": "switch",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-status-high",
    "frameworks": [],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-tabs-accent",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-accent",
    "frameworks": [
      "--ant-color-primary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-accent-border",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-accent-border",
    "frameworks": [
      "--ant-color-primary-border"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-accent-fg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-accent-hover",
    "frameworks": [
      "--ant-color-primary-hover"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-accent-subtle",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-accent-subtle",
    "frameworks": [
      "--ant-color-primary-bg"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-badge-bg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-bg-muted",
    "frameworks": [
      "--ant-color-fill-tertiary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-badge-bg-selected",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "semantic": "--zb-tabs-accent-subtle",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-badge-fg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [
      "--ant-color-text-secondary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-badge-fg-selected",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "semantic": "--zb-tabs-accent-fg",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-bg-hover",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-border",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [
      "--ant-color-border"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-critical",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-critical",
    "frameworks": [
      "--ant-color-error"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-tabs-critical-bg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-critical-bg",
    "frameworks": [
      "--ant-color-error-bg"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-tabs-duration",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "duration",
    "semantic": "--zb-duration",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-ease",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "easing",
    "semantic": "--zb-ease",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-fg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [
      "--ant-color-text-secondary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-fg-disabled",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text-subtle",
    "frameworks": [
      "--ant-color-text-disabled"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-fg-hover",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [
      "--ant-color-text"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-fg-selected",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [
      "--ant-color-text"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-focus",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-focus-ring",
    "frameworks": [
      "--ant-color-primary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-font",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "font",
    "semantic": "--zb-density-font",
    "frameworks": [
      "--ant-font-size"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-gap",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-high",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-high",
    "frameworks": [
      "--ant-color-warning"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-tabs-high-bg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-high-bg",
    "frameworks": [
      "--ant-color-warning-bg"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-tabs-high-border",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-high-border",
    "frameworks": [
      "--ant-color-warning-border"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-tabs-indicator",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "semantic": "--zb-tabs-accent",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-indicator-radius",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-indicator-size",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-min-h",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "semantic": "--zb-density-target",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-normal",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-status-normal",
    "frameworks": [
      "--ant-color-success"
    ],
    "fallback": true,
    "bridgeable": false
  },
  {
    "name": "--zb-tabs-pad-x",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "semantic": "--zb-density-pad-x",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-pad-y",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "semantic": "--zb-density-pad-y",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-rail",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [
      "--ant-color-border-secondary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-surface",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-surface",
    "frameworks": [
      "--ant-color-bg-container"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-surface-subtle",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-bg-subtle",
    "frameworks": [
      "--ant-color-fill-quaternary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-thumb-bg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-surface-raised",
    "frameworks": [
      "--ant-color-bg-container"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-thumb-border",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-thumb-radius",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-thumb-shadow",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "shadow",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-track-bg",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "semantic": "--zb-bg-muted",
    "frameworks": [
      "--ant-color-fill-tertiary"
    ],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-track-border",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "color",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-track-pad",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-track-radius",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "dimension",
    "semantic": "--zb-radius-xl",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-weight",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "number",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-tabs-weight-selected",
    "component": "tabs",
    "source": "packages/tabs/src/styles.css",
    "kind": "number",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-timeline-font",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "font",
    "semantic": "--zb-density-font",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-timeline-gap",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-timeline-node-bg",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-surface",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-timeline-node-border",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-timeline-node-fg",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-text-muted",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-timeline-node-size",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-timeline-rail",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "color",
    "semantic": "--zb-border",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-timeline-rail-width",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-timeline-row-gap",
    "component": "timeline",
    "source": "packages/react/src/styles.css",
    "kind": "dimension",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-value-fg",
    "component": "value",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-value-font",
    "component": "value",
    "source": "packages/tokens/tokens/component.json",
    "kind": "font",
    "semantic": "--zb-font-numeric",
    "frameworks": [],
    "fallback": true,
    "bridgeable": true
  },
  {
    "name": "--zb-value-unit-fg",
    "component": "value",
    "source": "packages/tokens/tokens/component.json",
    "kind": "color",
    "semantic": "--zb-text-muted",
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
  "--zb-absent-fg",
  "--zb-accordion-body-fg",
  "--zb-accordion-border",
  "--zb-accordion-divider",
  "--zb-accordion-duration",
  "--zb-accordion-font",
  "--zb-accordion-gap",
  "--zb-accordion-gate-bg",
  "--zb-accordion-gate-border",
  "--zb-accordion-header-bg",
  "--zb-accordion-header-bg-hover",
  "--zb-accordion-header-bg-open",
  "--zb-accordion-header-fg",
  "--zb-accordion-icon-fg",
  "--zb-accordion-pad-x",
  "--zb-accordion-pad-y",
  "--zb-accordion-radius",
  "--zb-accordion-rail",
  "--zb-accordion-rail-width",
  "--zb-accordion-summary-fg",
  "--zb-accordion-target",
  "--zb-accordion-withheld-fg",
  "--zb-alert-pad-x",
  "--zb-alert-pad-y",
  "--zb-alert-radius",
  "--zb-allergy-gap",
  "--zb-av-size",
  "--zb-sw-bg",
  "--zb-sw-border",
  "--zb-sw-fg",
  "--zb-badge-radius",
  "--zb-banner-bg",
  "--zb-banner-border",
  "--zb-banner-fg",
  "--zb-banner-meta-fg",
  "--zb-dur-escalate",
  "--zb-dur-reveal",
  "--zb-dur-swap",
  "--zb-identity-accent",
  "--zb-identity-border",
  "--zb-identity-border-subtle",
  "--zb-identity-dur-alert",
  "--zb-identity-dur-escalate",
  "--zb-identity-dur-reveal",
  "--zb-identity-dur-swap",
  "--zb-identity-ease",
  "--zb-identity-fg",
  "--zb-identity-fg-faint",
  "--zb-identity-fg-muted",
  "--zb-identity-fg-subtle",
  "--zb-identity-fill",
  "--zb-identity-fill-subtle",
  "--zb-identity-loop-skeleton",
  "--zb-identity-radius",
  "--zb-identity-radius-lg",
  "--zb-identity-surface",
  "--zb-care-timeline-divider",
  "--zb-care-timeline-meta",
  "--zb-chart-axis",
  "--zb-chart-grid",
  "--zb-chart-label-fg",
  "--zb-chart-line",
  "--zb-chart-line-width",
  "--zb-chart-point",
  "--zb-chart-point-radius",
  "--zb-chart-point-radius-flagged",
  "--zb-chart-surface",
  "--zb-chart-header-tone",
  "--zb-copilot-accent",
  "--zb-copilot-ink",
  "--zb-copilot-muted",
  "--zb-copilot-radius",
  "--zb-copilot-rule",
  "--zb-copilot-shadow",
  "--zb-copilot-surface",
  "--zb-cs-glyph",
  "--zb-cs-glyph-compact",
  "--zb-cs-height",
  "--zb-cs-height-compact",
  "--zb-cs-height-default",
  "--zb-datetime-cell-fg",
  "--zb-datetime-cell-hover-bg",
  "--zb-datetime-cell-muted-fg",
  "--zb-datetime-cell-radius",
  "--zb-datetime-cell-range-bg",
  "--zb-datetime-cell-range-fg",
  "--zb-datetime-cell-selected-bg",
  "--zb-datetime-cell-selected-fg",
  "--zb-datetime-cell-size",
  "--zb-datetime-chip-bg",
  "--zb-datetime-chip-border",
  "--zb-datetime-chip-fg",
  "--zb-datetime-chip-on-bg",
  "--zb-datetime-chip-on-fg",
  "--zb-datetime-derived-fg",
  "--zb-datetime-duration",
  "--zb-datetime-duration-bg",
  "--zb-datetime-duration-held-bg",
  "--zb-datetime-duration-held-border",
  "--zb-datetime-font",
  "--zb-datetime-gap",
  "--zb-datetime-held-fg",
  "--zb-datetime-popover-bg",
  "--zb-datetime-popover-border",
  "--zb-datetime-target",
  "--zb-datetime-today-marker",
  "--zb-datetime-weekday-fg",
  "--zb-field-bg",
  "--zb-field-border",
  "--zb-field-border-focus",
  "--zb-field-fg",
  "--zb-field-hint-fg",
  "--zb-field-label-fg",
  "--zb-field-pad-x",
  "--zb-field-pad-y",
  "--zb-field-placeholder-fg",
  "--zb-field-prefilled-bg",
  "--zb-field-prefilled-border",
  "--zb-field-radius",
  "--zb-grid-accent",
  "--zb-grid-accent-bg",
  "--zb-grid-accent-line",
  "--zb-grid-font",
  "--zb-grid-ink",
  "--zb-grid-muted",
  "--zb-grid-pad-x",
  "--zb-grid-pad-y",
  "--zb-grid-rule",
  "--zb-grid-rule-strong",
  "--zb-grid-subtle",
  "--zb-grid-sunk",
  "--zb-grid-surface",
  "--zb-loader-beat",
  "--zb-loader-color",
  "--zb-loader-cycle",
  "--zb-loader-ease",
  "--zb-loader-ease-out",
  "--zb-loader-scrim",
  "--zb-loader-size",
  "--zb-loader-stroke",
  "--zb-loader-track",
  "--zb-loader-z",
  "--zb-menu-bg",
  "--zb-menu-border",
  "--zb-menu-radius",
  "--zb-menu-row-hover-bg",
  "--zb-menu-sep",
  "--zb-menu-subject-bg",
  "--zb-menu-subject-border",
  "--zb-nav-bg",
  "--zb-nav-bg-current",
  "--zb-nav-bg-hover",
  "--zb-nav-border",
  "--zb-nav-border-current",
  "--zb-nav-fg",
  "--zb-nav-fg-current",
  "--zb-nav-radius",
  "--zb-patient-chip-rail",
  "--zb-presence-avatar",
  "--zb-prov-glyph",
  "--zb-range-height",
  "--zb-range-marker",
  "--zb-range-track",
  "--zb-recorder-bar-gap",
  "--zb-recorder-bar-w",
  "--zb-recorder-lane-h",
  "--zb-recorder-pane",
  "--zb-recorder-wave",
  "--zb-recorder-wave-off",
  "--zb-risk-figure",
  "--zb-rv-gap",
  "--zb-rv-value-compact",
  "--zb-rv-value-default",
  "--zb-rv-value-size",
  "--zb-stack-accent",
  "--zb-surface-card-bg",
  "--zb-surface-card-border",
  "--zb-surface-card-pad-x",
  "--zb-surface-card-pad-y",
  "--zb-surface-card-radius",
  "--zb-surface-card-shadow",
  "--zb-switch-desc-fg",
  "--zb-switch-duration",
  "--zb-switch-ease",
  "--zb-switch-focus-offset",
  "--zb-switch-focus-ring",
  "--zb-switch-focus-width",
  "--zb-switch-gap",
  "--zb-switch-hold-ms",
  "--zb-switch-impact-fg",
  "--zb-switch-label-font",
  "--zb-switch-label-off-fg",
  "--zb-switch-label-on-fg",
  "--zb-switch-locked-bg",
  "--zb-switch-pad",
  "--zb-switch-prov-fg",
  "--zb-switch-radius",
  "--zb-switch-segment-bg",
  "--zb-switch-segment-border",
  "--zb-switch-segment-divider",
  "--zb-switch-segment-fg",
  "--zb-switch-segment-hover-bg",
  "--zb-switch-state-fg",
  "--zb-switch-state-font",
  "--zb-switch-state-on-fg",
  "--zb-switch-target-min",
  "--zb-switch-thumb-bg",
  "--zb-switch-thumb-fg",
  "--zb-switch-thumb-size",
  "--zb-switch-thumb-unknown-fg",
  "--zb-switch-track-h",
  "--zb-switch-track-neutral-bg",
  "--zb-switch-track-off-bg",
  "--zb-switch-track-off-border",
  "--zb-switch-track-on-bg",
  "--zb-switch-track-on-border",
  "--zb-switch-track-w",
  "--zb-tabs-accent",
  "--zb-tabs-accent-border",
  "--zb-tabs-accent-fg",
  "--zb-tabs-accent-subtle",
  "--zb-tabs-badge-bg",
  "--zb-tabs-badge-bg-selected",
  "--zb-tabs-badge-fg",
  "--zb-tabs-badge-fg-selected",
  "--zb-tabs-bg-hover",
  "--zb-tabs-border",
  "--zb-tabs-duration",
  "--zb-tabs-ease",
  "--zb-tabs-fg",
  "--zb-tabs-fg-disabled",
  "--zb-tabs-fg-hover",
  "--zb-tabs-fg-selected",
  "--zb-tabs-focus",
  "--zb-tabs-font",
  "--zb-tabs-gap",
  "--zb-tabs-indicator",
  "--zb-tabs-indicator-radius",
  "--zb-tabs-indicator-size",
  "--zb-tabs-min-h",
  "--zb-tabs-pad-x",
  "--zb-tabs-pad-y",
  "--zb-tabs-rail",
  "--zb-tabs-surface",
  "--zb-tabs-surface-subtle",
  "--zb-tabs-thumb-bg",
  "--zb-tabs-thumb-border",
  "--zb-tabs-thumb-radius",
  "--zb-tabs-thumb-shadow",
  "--zb-tabs-track-bg",
  "--zb-tabs-track-border",
  "--zb-tabs-track-pad",
  "--zb-tabs-track-radius",
  "--zb-tabs-weight",
  "--zb-tabs-weight-selected",
  "--zb-timeline-font",
  "--zb-timeline-gap",
  "--zb-timeline-node-bg",
  "--zb-timeline-node-border",
  "--zb-timeline-node-fg",
  "--zb-timeline-node-size",
  "--zb-timeline-rail",
  "--zb-timeline-rail-width",
  "--zb-timeline-row-gap",
  "--zb-value-fg",
  "--zb-value-font",
  "--zb-value-unit-fg"
];

/**
 * The tokens a theme bridge must never write, and a customer theme may never
 * override. Exported so a bridge's own test can assert it wrote none of them.
 */
export const NOT_BRIDGEABLE: readonly string[] = [
  "--zb-absent-error-fg",
  "--zb-absent-restricted-fg",
  "--zb-accordion-rail-critical",
  "--zb-accordion-rail-high",
  "--zb-accordion-rail-low",
  "--zb-accordion-rail-normal",
  "--zb-accordion-rail-restricted",
  "--zb-accordion-rail-unknown",
  "--zb-accordion-restricted-bg",
  "--zb-accordion-restricted-fg",
  "--zb-alert-critical-bg",
  "--zb-alert-critical-border",
  "--zb-alert-critical-fg",
  "--zb-alert-info-bg",
  "--zb-alert-info-border",
  "--zb-alert-info-fg",
  "--zb-alert-warning-bg",
  "--zb-alert-warning-border",
  "--zb-alert-warning-fg",
  "--zb-badge-critical-bg",
  "--zb-badge-critical-border",
  "--zb-badge-critical-fg",
  "--zb-badge-high-bg",
  "--zb-badge-high-border",
  "--zb-badge-high-fg",
  "--zb-badge-low-bg",
  "--zb-badge-low-border",
  "--zb-badge-low-fg",
  "--zb-badge-normal-bg",
  "--zb-badge-normal-border",
  "--zb-badge-normal-fg",
  "--zb-badge-unknown-bg",
  "--zb-badge-unknown-border",
  "--zb-badge-unknown-fg",
  "--zb-banner-deceased-fg",
  "--zb-banner-restricted-bg",
  "--zb-banner-restricted-border",
  "--zb-identity-critical",
  "--zb-identity-critical-bg",
  "--zb-identity-deceased",
  "--zb-identity-ok",
  "--zb-identity-ok-bg",
  "--zb-identity-ok-border",
  "--zb-identity-restricted",
  "--zb-identity-restricted-bg",
  "--zb-identity-warn",
  "--zb-identity-warn-bg",
  "--zb-identity-warn-border",
  "--zb-chart-band-bg",
  "--zb-chart-band-border",
  "--zb-copilot-bad",
  "--zb-copilot-ok",
  "--zb-copilot-warn",
  "--zb-cs-bg",
  "--zb-cs-border",
  "--zb-cs-fg",
  "--zb-field-border-invalid",
  "--zb-field-error-fg",
  "--zb-presence-ring",
  "--zb-range-band",
  "--zb-range-band-border",
  "--zb-range-marker-abnormal",
  "--zb-recorder-rec",
  "--zb-recorder-rec-ink",
  "--zb-recorder-rec-line",
  "--zb-recorder-rec-soft",
  "--zb-switch-error-fg",
  "--zb-switch-hold-ring",
  "--zb-switch-impact-bg",
  "--zb-switch-impact-border",
  "--zb-switch-locked-fg",
  "--zb-switch-pending-fg",
  "--zb-switch-queued-fg",
  "--zb-switch-segment-unasked-bg",
  "--zb-switch-segment-unasked-fg",
  "--zb-switch-stale-bg",
  "--zb-switch-stale-fg",
  "--zb-switch-thumb-unknown-bg",
  "--zb-switch-track-caution-bg",
  "--zb-switch-track-critical-bg",
  "--zb-switch-track-unknown-bg",
  "--zb-switch-track-unknown-border",
  "--zb-switch-until-bg",
  "--zb-switch-until-border",
  "--zb-switch-until-fg",
  "--zb-tabs-critical",
  "--zb-tabs-critical-bg",
  "--zb-tabs-high",
  "--zb-tabs-high-bg",
  "--zb-tabs-high-border",
  "--zb-tabs-normal"
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
  "--zb-flag-deceased",
  "--zb-flag-provisional",
  "--zb-flag-restricted",
  "--zb-flag-restricted-bg",
  "--zb-status-critical",
  "--zb-status-critical-bg",
  "--zb-status-critical-border",
  "--zb-status-high",
  "--zb-status-high-bg",
  "--zb-status-high-border",
  "--zb-status-low",
  "--zb-status-low-bg",
  "--zb-status-low-border",
  "--zb-status-normal",
  "--zb-status-normal-bg",
  "--zb-status-normal-border",
  "--zb-status-provisional",
  "--zb-status-provisional-bg",
  "--zb-status-provisional-border",
  "--zb-status-recording",
  "--zb-status-recording-bg",
  "--zb-status-recording-border",
  "--zb-status-restricted",
  "--zb-status-restricted-bg",
  "--zb-status-restricted-border",
  "--zb-status-unknown",
  "--zb-status-unknown-bg",
  "--zb-status-unknown-border"
];

/** Lookup by custom-property name. */
export function surfaceEntry(name: string): SurfaceEntry | undefined {
  return TOKEN_SURFACE.find((e) => e.name === name);
}

/** Every token belonging to one component. */
export function surfaceFor(component: string): readonly SurfaceEntry[] {
  return TOKEN_SURFACE.filter((e) => e.component === component);
}
