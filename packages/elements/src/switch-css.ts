/**
 * The stylesheet `<zb-switch>` adopts into its shadow root.
 *
 * Inlined rather than shipped as a file a consumer imports, for the reason the
 * loader elements give: the element's promise is that it works the moment the
 * script runs — in a Vue app, an Angular app, a Rails template, or a plain HTML
 * page with a CDN tag. A stylesheet someone has to remember to import is a
 * control that renders as unstyled text in a quarter of installs.
 *
 * The React registry component takes the opposite trade deliberately: it ships
 * `styles/zoblocks-switch.css`, because a component copied into a customer's repo
 * should be readable source rather than a string.
 *
 * Colours resolve through the same `--zb-switch-*` component tokens as the
 * React side, and fall back to sensible literals when the ZoBlocks token
 * stylesheet is not present — so the element is themed by a host that has
 * tokens, and legible in one that does not.
 *
 * `test/switch-parity.test.ts` asserts the invariants this shares with
 * `registry/zoblocks/lib/switch.css`, so the two cannot drift silently.
 */

export const SWITCH_CSS = `
:host {
  --_track-w: var(--zb-switch-track-w, 44px);
  --_track-h: var(--zb-switch-track-h, 24px);
  --_thumb: var(--zb-switch-thumb-size, 20px);
  --_pad: var(--zb-switch-pad, 2px);
  --_radius: var(--zb-switch-radius, 9999px);
  --_gap: var(--zb-switch-gap, var(--zb-density-gap, 0.75rem));
  --_target: var(--zb-switch-target-min, var(--zb-density-target, 2.75rem));
  --_duration: var(--zb-switch-duration, var(--zb-duration, 180ms));
  --_ease: var(--zb-switch-ease, var(--zb-ease, cubic-bezier(0.22, 1, 0.36, 1)));

  --_off: var(--zb-switch-track-off-bg, var(--zb-border-strong, #64748b));
  --_on: var(--zb-switch-track-on-bg, var(--zb-accent, #067662));
  --_unknown-bg: var(--zb-switch-track-unknown-bg, var(--zb-status-unknown-bg, #f8fafc));
  --_unknown: var(--zb-switch-track-unknown-border, var(--zb-status-unknown, #64748b));
  --_thumb-bg: var(--zb-switch-thumb-bg, var(--zb-surface, #ffffff));
  --_thumb-fg: var(--zb-switch-thumb-fg, var(--zb-text-muted, #475569));
  --_ring: var(--zb-switch-focus-ring, var(--zb-focus-ring, #059478));
  --_text: var(--zb-text, #0f172a);
  --_muted: var(--zb-switch-state-fg, var(--zb-text-muted, #475569));
  --_error: var(--zb-switch-error-fg, var(--zb-status-critical, #b91c1c));
  --_locked: var(--zb-switch-locked-fg, var(--zb-flag-restricted, #7c3aed));

  display: inline-block;
  color: var(--_text);
  font: inherit;
}

:host([data-zb-tone="caution"]) { --_on: var(--zb-switch-track-caution-bg, var(--zb-status-high, #b45309)); }
:host([data-zb-tone="critical"]) { --_on: var(--zb-switch-track-critical-bg, var(--zb-status-critical, #b91c1c)); }
:host([data-zb-tone="neutral"]) { --_on: var(--zb-switch-track-neutral-bg, var(--zb-text-muted, #475569)); }

:host([disabled]) { opacity: 0.45; }

.zb-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--_gap);
}

.zb-switch__control {
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  position: relative;
  flex: none;
  touch-action: manipulation;
}

/* The hit area, decoupled from the visual size. Shrinking the pill for a dense
   flowsheet must never shrink the target. */
.zb-switch__control::before {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  translate: -50% -50%;
  inline-size: max(var(--_track-w), var(--_target));
  block-size: max(var(--_track-h), var(--_target));
}

:host([readonly]) .zb-switch__control { cursor: default; }
:host([disabled]) .zb-switch__control { cursor: not-allowed; }

.zb-switch__control:focus-visible { outline: none; }
.zb-switch__control:focus-visible .zb-switch__track {
  outline: var(--zb-switch-focus-width, 2px) solid var(--_ring);
  outline-offset: var(--zb-switch-focus-offset, 2px);
}

.zb-switch__track {
  position: relative;
  display: grid;
  align-items: center;
  inline-size: var(--_track-w);
  block-size: var(--_track-h);
  border-radius: var(--_radius);
  background: var(--_off);
  border: 1px solid var(--_off);
  transition: background var(--_duration) var(--_ease), border-color var(--_duration) var(--_ease);
}

:host([data-zb-state="on"]) .zb-switch__track {
  background: var(--_on);
  border-color: var(--_on);
}

:host([data-zb-state="unknown"]) .zb-switch__track {
  background: var(--_unknown-bg);
  border-color: var(--_unknown);
  border-style: dashed;
}

.zb-switch__thumb {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: var(--_pad);
  translate: 0 -50%;
  inline-size: var(--_thumb);
  block-size: var(--_thumb);
  border-radius: var(--_radius);
  background: var(--_thumb-bg);
  color: var(--_thumb-fg);
  box-shadow: 0 1px 2px rgb(2 6 23 / 0.28);
  display: grid;
  place-items: center;
  transition: inset-inline-start var(--_duration) var(--_ease), translate var(--_duration) var(--_ease);
}

:host([data-zb-state="on"]) .zb-switch__thumb {
  inset-inline-start: calc(100% - var(--_thumb) - var(--_pad));
}

:host([data-zb-state="unknown"]) .zb-switch__thumb {
  inset-inline-start: 50%;
  translate: -50% -50%;
  background: var(--_unknown);
  color: var(--zb-bg, #ffffff);
}

.zb-switch__glyph {
  inline-size: 62%;
  block-size: 62%;
  display: block;
}
:host([data-zb-size="micro"]) .zb-switch__glyph,
:host([data-zb-size="small"]) .zb-switch__glyph {
  inline-size: 78%;
  block-size: 78%;
}

/* Pending keeps the control: focusable, named, and busy — never disabled. */
:host([data-zb-phase="pending"]) .zb-switch__track {
  background: repeating-linear-gradient(135deg, var(--_on) 0 6px, color-mix(in oklab, var(--_on) 62%, var(--zb-bg, #ffffff)) 6px 12px);
  animation: zb-switch-march 900ms linear infinite;
}
:host([data-zb-phase="pending"][data-zb-state="off"]) .zb-switch__track {
  background: repeating-linear-gradient(135deg, var(--_off) 0 6px, color-mix(in oklab, var(--_off) 62%, var(--zb-bg, #ffffff)) 6px 12px);
}

@keyframes zb-switch-march {
  to { background-position: 34px 0; }
}

:host([data-zb-phase="committed"]) .zb-switch__thumb {
  animation: zb-switch-confirm 600ms var(--_ease);
}

@keyframes zb-switch-confirm {
  from { box-shadow: 0 1px 2px rgb(2 6 23 / 0.28), 0 0 0 0 color-mix(in oklab, var(--_on) 60%, transparent); }
  to { box-shadow: 0 1px 2px rgb(2 6 23 / 0.28), 0 0 0 10px transparent; }
}

:host([data-zb-phase="reverted"]) .zb-switch__track,
:host([data-zb-phase="blocked"]) .zb-switch__track {
  outline: 2px solid var(--_error);
  outline-offset: 2px;
}

:host([data-zb-phase="queued"]) .zb-switch__track {
  background: var(--zb-bg-subtle, #f8fafc);
  border: 1px dashed var(--zb-switch-queued-fg, var(--zb-status-low, #2563eb));
}

:host([data-zb-phase="stale"]) .zb-switch__track {
  outline: 2px dashed var(--zb-switch-stale-fg, var(--zb-flag-restricted, #7c3aed));
  outline-offset: 2px;
}

:host([readonly]) .zb-switch__track {
  background: var(--zb-switch-locked-bg, var(--zb-bg-subtle, #f8fafc));
  border: 1px dashed var(--_off);
}
:host([readonly][data-zb-state="on"]) .zb-switch__track {
  background: var(--zb-accent-subtle, #ecfdf8);
  border-color: var(--_on);
}
:host([readonly]) .zb-switch__thumb {
  background: var(--_off);
  color: var(--zb-bg, #ffffff);
  box-shadow: none;
}

.zb-switch__text {
  display: grid;
  gap: 0.1rem;
  min-inline-size: 0;
}
.zb-switch__state {
  font-size: var(--zb-switch-state-font, var(--zb-text-xs, 0.75rem));
  font-weight: 600;
  color: var(--_muted);
}
:host([data-zb-state="on"]) .zb-switch__state {
  color: var(--zb-switch-state-on-fg, var(--_on));
}
.zb-switch__note {
  font-size: var(--zb-switch-state-font, var(--zb-text-xs, 0.75rem));
  line-height: 1.45;
}
.zb-switch__note--error { color: var(--_error); font-weight: 600; }
.zb-switch__note--locked { color: var(--_locked); }

.zb-switch__sr {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .zb-switch__track,
  .zb-switch__thumb { transition-duration: 1ms; }
  :host([data-zb-phase="pending"]) .zb-switch__track { animation: none; }
  :host([data-zb-phase="committed"]) .zb-switch__thumb { animation: none; }
}

@media (forced-colors: active) {
  .zb-switch__track {
    forced-color-adjust: none;
    border: 1px solid CanvasText;
    background: Canvas !important;
  }
  :host([data-zb-state="on"]) .zb-switch__track { background: Highlight !important; }
  .zb-switch__thumb { background: CanvasText !important; color: Canvas !important; box-shadow: none; }
  :host([data-zb-state="on"]) .zb-switch__thumb { background: HighlightText !important; color: Highlight !important; }
  .zb-switch__state { color: CanvasText !important; }
}
`;
