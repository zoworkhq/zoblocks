/**
 * The stylesheet `<ox-switch>` adopts into its shadow root.
 *
 * Inlined rather than shipped as a file a consumer imports, for the reason the
 * loader elements give: the element's promise is that it works the moment the
 * script runs — in a Vue app, an Angular app, a Rails template, or a plain HTML
 * page with a CDN tag. A stylesheet someone has to remember to import is a
 * control that renders as unstyled text in a quarter of installs.
 *
 * The React registry component takes the opposite trade deliberately: it ships
 * `styles/oxygen-switch.css`, because a component copied into a customer's repo
 * should be readable source rather than a string.
 *
 * Colours resolve through the same `--ox-switch-*` component tokens as the
 * React side, and fall back to sensible literals when the Oxygen token
 * stylesheet is not present — so the element is themed by a host that has
 * tokens, and legible in one that does not.
 *
 * `test/switch-parity.test.ts` asserts the invariants this shares with
 * `registry/oxygen/lib/switch.css`, so the two cannot drift silently.
 */

export const SWITCH_CSS = `
:host {
  --_track-w: var(--ox-switch-track-w, 44px);
  --_track-h: var(--ox-switch-track-h, 24px);
  --_thumb: var(--ox-switch-thumb-size, 20px);
  --_pad: var(--ox-switch-pad, 2px);
  --_radius: var(--ox-switch-radius, 9999px);
  --_gap: var(--ox-switch-gap, var(--ox-density-gap, 0.75rem));
  --_target: var(--ox-switch-target-min, var(--ox-density-target, 2.75rem));
  --_duration: var(--ox-switch-duration, var(--ox-duration, 180ms));
  --_ease: var(--ox-switch-ease, var(--ox-ease, cubic-bezier(0.22, 1, 0.36, 1)));

  --_off: var(--ox-switch-track-off-bg, var(--ox-border-strong, #64748b));
  --_on: var(--ox-switch-track-on-bg, var(--ox-accent, #067662));
  --_unknown-bg: var(--ox-switch-track-unknown-bg, var(--ox-status-unknown-bg, #f8fafc));
  --_unknown: var(--ox-switch-track-unknown-border, var(--ox-status-unknown, #64748b));
  --_thumb-bg: var(--ox-switch-thumb-bg, var(--ox-surface, #ffffff));
  --_thumb-fg: var(--ox-switch-thumb-fg, var(--ox-text-muted, #475569));
  --_ring: var(--ox-switch-focus-ring, var(--ox-focus-ring, #059478));
  --_text: var(--ox-text, #0f172a);
  --_muted: var(--ox-switch-state-fg, var(--ox-text-muted, #475569));
  --_error: var(--ox-switch-error-fg, var(--ox-status-critical, #b91c1c));
  --_locked: var(--ox-switch-locked-fg, var(--ox-flag-restricted, #7c3aed));

  display: inline-block;
  color: var(--_text);
  font: inherit;
}

:host([data-ox-tone="caution"]) { --_on: var(--ox-switch-track-caution-bg, var(--ox-status-high, #b45309)); }
:host([data-ox-tone="critical"]) { --_on: var(--ox-switch-track-critical-bg, var(--ox-status-critical, #b91c1c)); }
:host([data-ox-tone="neutral"]) { --_on: var(--ox-switch-track-neutral-bg, var(--ox-text-muted, #475569)); }

:host([disabled]) { opacity: 0.45; }

.ox-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--_gap);
}

.ox-switch__control {
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
.ox-switch__control::before {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  translate: -50% -50%;
  inline-size: max(var(--_track-w), var(--_target));
  block-size: max(var(--_track-h), var(--_target));
}

:host([readonly]) .ox-switch__control { cursor: default; }
:host([disabled]) .ox-switch__control { cursor: not-allowed; }

.ox-switch__control:focus-visible { outline: none; }
.ox-switch__control:focus-visible .ox-switch__track {
  outline: var(--ox-switch-focus-width, 2px) solid var(--_ring);
  outline-offset: var(--ox-switch-focus-offset, 2px);
}

.ox-switch__track {
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

:host([data-ox-state="on"]) .ox-switch__track {
  background: var(--_on);
  border-color: var(--_on);
}

:host([data-ox-state="unknown"]) .ox-switch__track {
  background: var(--_unknown-bg);
  border-color: var(--_unknown);
  border-style: dashed;
}

.ox-switch__thumb {
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

:host([data-ox-state="on"]) .ox-switch__thumb {
  inset-inline-start: calc(100% - var(--_thumb) - var(--_pad));
}

:host([data-ox-state="unknown"]) .ox-switch__thumb {
  inset-inline-start: 50%;
  translate: -50% -50%;
  background: var(--_unknown);
  color: var(--ox-bg, #ffffff);
}

.ox-switch__glyph {
  inline-size: 62%;
  block-size: 62%;
  display: block;
}
:host([data-ox-size="micro"]) .ox-switch__glyph,
:host([data-ox-size="small"]) .ox-switch__glyph {
  inline-size: 78%;
  block-size: 78%;
}

/* Pending keeps the control: focusable, named, and busy — never disabled. */
:host([data-ox-phase="pending"]) .ox-switch__track {
  background: repeating-linear-gradient(135deg, var(--_on) 0 6px, color-mix(in oklab, var(--_on) 62%, var(--ox-bg, #ffffff)) 6px 12px);
  animation: ox-switch-march 900ms linear infinite;
}
:host([data-ox-phase="pending"][data-ox-state="off"]) .ox-switch__track {
  background: repeating-linear-gradient(135deg, var(--_off) 0 6px, color-mix(in oklab, var(--_off) 62%, var(--ox-bg, #ffffff)) 6px 12px);
}

@keyframes ox-switch-march {
  to { background-position: 34px 0; }
}

:host([data-ox-phase="committed"]) .ox-switch__thumb {
  animation: ox-switch-confirm 600ms var(--_ease);
}

@keyframes ox-switch-confirm {
  from { box-shadow: 0 1px 2px rgb(2 6 23 / 0.28), 0 0 0 0 color-mix(in oklab, var(--_on) 60%, transparent); }
  to { box-shadow: 0 1px 2px rgb(2 6 23 / 0.28), 0 0 0 10px transparent; }
}

:host([data-ox-phase="reverted"]) .ox-switch__track,
:host([data-ox-phase="blocked"]) .ox-switch__track {
  outline: 2px solid var(--_error);
  outline-offset: 2px;
}

:host([data-ox-phase="queued"]) .ox-switch__track {
  background: var(--ox-bg-subtle, #f8fafc);
  border: 1px dashed var(--ox-switch-queued-fg, var(--ox-status-low, #2563eb));
}

:host([data-ox-phase="stale"]) .ox-switch__track {
  outline: 2px dashed var(--ox-switch-stale-fg, var(--ox-flag-restricted, #7c3aed));
  outline-offset: 2px;
}

:host([readonly]) .ox-switch__track {
  background: var(--ox-switch-locked-bg, var(--ox-bg-subtle, #f8fafc));
  border: 1px dashed var(--_off);
}
:host([readonly][data-ox-state="on"]) .ox-switch__track {
  background: var(--ox-accent-subtle, #ecfdf8);
  border-color: var(--_on);
}
:host([readonly]) .ox-switch__thumb {
  background: var(--_off);
  color: var(--ox-bg, #ffffff);
  box-shadow: none;
}

.ox-switch__text {
  display: grid;
  gap: 0.1rem;
  min-inline-size: 0;
}
.ox-switch__state {
  font-size: var(--ox-switch-state-font, var(--ox-text-xs, 0.75rem));
  font-weight: 600;
  color: var(--_muted);
}
:host([data-ox-state="on"]) .ox-switch__state {
  color: var(--ox-switch-state-on-fg, var(--_on));
}
.ox-switch__note {
  font-size: var(--ox-switch-state-font, var(--ox-text-xs, 0.75rem));
  line-height: 1.45;
}
.ox-switch__note--error { color: var(--_error); font-weight: 600; }
.ox-switch__note--locked { color: var(--_locked); }

.ox-switch__sr {
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
  .ox-switch__track,
  .ox-switch__thumb { transition-duration: 1ms; }
  :host([data-ox-phase="pending"]) .ox-switch__track { animation: none; }
  :host([data-ox-phase="committed"]) .ox-switch__thumb { animation: none; }
}

@media (forced-colors: active) {
  .ox-switch__track {
    forced-color-adjust: none;
    border: 1px solid CanvasText;
    background: Canvas !important;
  }
  :host([data-ox-state="on"]) .ox-switch__track { background: Highlight !important; }
  .ox-switch__thumb { background: CanvasText !important; color: Canvas !important; box-shadow: none; }
  :host([data-ox-state="on"]) .ox-switch__thumb { background: HighlightText !important; color: Highlight !important; }
  .ox-switch__state { color: CanvasText !important; }
}
`;
