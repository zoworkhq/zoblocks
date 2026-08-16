/**
 * The stylesheet every loader element adopts into its shadow root.
 *
 * Inlined rather than shipped as a file that consumers import, because the
 * element's promise is that `<ox-pulse-loader>` works the moment the script
 * runs — in a Vue app, an Angular app, a Rails template, or a plain HTML page
 * with a CDN tag. A stylesheet someone has to remember to import is a loader
 * that renders as a static mark in a quarter of installs.
 *
 * The React registry components take the opposite trade deliberately: they ship
 * `styles/oxygen-loader.css`, because a component copied into a customer's repo
 * should be readable source rather than a string.
 *
 * Colours resolve through the same `--ox-*` semantic tokens as everything else
 * in Oxygen, and fall back to `currentColor` when the token stylesheet is not
 * present — so the element is themed by a host that has Oxygen tokens, and
 * still legible in one that does not.
 */

export const LOADER_CSS = `
:host {
  --_size: var(--ox-loader-size, 56px);
  --_color: var(--ox-loader-color, var(--ox-accent, currentColor));
  --_track: var(--ox-loader-track, color-mix(in oklab, var(--_color) 22%, transparent));
  --_stroke: var(--ox-loader-stroke, 2.4px);
  --_beat: var(--ox-loader-beat, 1000ms);
  --_cycle: var(--ox-loader-cycle, 4000ms);
  --_scrim: var(--ox-loader-scrim, color-mix(in oklab, var(--ox-bg, Canvas) 72%, transparent));
  --_ease: cubic-bezier(0.45, 0, 0.55, 1);
  --_ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);

  display: inline-grid;
  justify-items: center;
  gap: 0.6em;
  color: var(--_color);
  font-family: var(--ox-font-sans, inherit);
  font-size: var(--ox-text-sm, 0.875rem);
  line-height: 1.45;
  text-align: center;
  animation: ox-loader-enter 160ms var(--ox-ease, ease-out) both;
}

:host([hidden]) { display: none; }

@keyframes ox-loader-enter { from { opacity: 0; } to { opacity: 1; } }

:host([mode="overlay"]), :host([mode="page"]) {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  z-index: var(--ox-loader-z, 1000);
}

:host([mode="page"]) { position: fixed; }

:host([mode="overlay"]:not([scrim="false"])),
:host([mode="page"]:not([scrim="false"])) { background: var(--_scrim); }

.art { display: block; line-height: 0; position: relative; }
.mark { position: absolute; inset: 0; display: grid; place-items: center; line-height: 1; pointer-events: none; }
.mark ::slotted(*) { max-width: 42%; max-height: 42%; }
svg { display: block; width: var(--_size); height: auto; overflow: visible; }

.label { color: var(--ox-text, currentColor); font-weight: 500; }
.value { color: var(--ox-text, currentColor); font-variant-numeric: tabular-nums; font-weight: 600; }
.hint { color: var(--ox-text-muted, currentColor); font-size: var(--ox-text-xs, 0.8125rem); max-width: 34ch; }
.hint:empty, .label:empty, .value:empty { display: none; }

/* Visually hidden, still announced. An empty live region announces nothing. */
.sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;
}

.stroke {
  fill: none;
  stroke: currentColor;
  stroke-width: var(--_stroke);
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.fill { fill: currentColor; }
.track { opacity: 0.22; }

/* Pulse and Rhythm ------------------------------------------------ */
.draw {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: ox-loader-draw 700ms var(--_ease-out) forwards;
}
.beat {
  transform-box: fill-box;
  transform-origin: center;
  animation: ox-loader-beat var(--_beat) var(--_ease) infinite;
  animation-delay: 400ms;
}
.head {
  stroke-dasharray: 22 200;
  stroke-dashoffset: 22;
  animation: ox-loader-head var(--_beat) cubic-bezier(0.4, 0, 0.6, 1) infinite;
  animation-delay: 400ms;
}
.tail {
  stroke-dasharray: 44 200;
  stroke-dashoffset: 44;
  opacity: 0.35;
  animation: ox-loader-tail var(--_beat) cubic-bezier(0.4, 0, 0.6, 1) infinite;
  animation-delay: 400ms;
}
@keyframes ox-loader-draw { to { stroke-dashoffset: 0; } }
@keyframes ox-loader-beat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.07); } }
@keyframes ox-loader-head { to { stroke-dashoffset: -100; } }
@keyframes ox-loader-tail { to { stroke-dashoffset: -78; } }

/* Breath ---------------------------------------------------------- */
.ring {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  animation: ox-loader-ring var(--_cycle) cubic-bezier(0.2, 0.6, 0.4, 1) infinite;
}
.ring:nth-of-type(2) { animation-delay: calc(var(--_cycle) / -3); }
.ring:nth-of-type(3) { animation-delay: calc(var(--_cycle) * -2 / 3); }
.core {
  transform-box: fill-box;
  transform-origin: center;
  animation: ox-loader-core var(--_cycle) var(--_ease) infinite;
}
@keyframes ox-loader-ring {
  0% { transform: scale(0.3); opacity: 0.55; }
  70% { opacity: 0.08; }
  100% { transform: scale(1); opacity: 0; }
}
@keyframes ox-loader-core { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.18); } }

/* Helix ----------------------------------------------------------- */
.dot {
  transform-box: fill-box;
  transform-origin: center;
  animation: ox-loader-helix calc(var(--_cycle) * 0.65) ease-in-out infinite;
  animation-delay: calc(var(--_cycle) * 0.65 * var(--ox-loader-phase, 0));
}
@keyframes ox-loader-helix {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  25% { transform: translateY(-12px) scale(0.85); opacity: 0.85; }
  50% { transform: translateY(0) scale(0.6); opacity: 0.45; }
  75% { transform: translateY(12px) scale(0.85); opacity: 0.85; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

/* Infusion -------------------------------------------------------- */
.slug { animation: ox-loader-slug calc(var(--_cycle) * 0.7) var(--_ease) infinite alternate; }
:host([progress]) .slug { animation: none; transform: none; }
@keyframes ox-loader-slug { from { transform: translateX(0); } to { transform: translateX(88px); } }

@keyframes ox-loader-still { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }

/* Reduced motion --------------------------------------------------- */
/* The still state is designed, not paused: shapes complete, the track comes to
   full strength, and the mark breathes in opacity. */
@media (prefers-reduced-motion: reduce) {
  :host(:not([motion="full"])) .draw,
  :host(:not([motion="full"])) .beat,
  :host(:not([motion="full"])) .head,
  :host(:not([motion="full"])) .tail,
  :host(:not([motion="full"])) .ring,
  :host(:not([motion="full"])) .core,
  :host(:not([motion="full"])) .dot,
  :host(:not([motion="full"])) .slug { animation: none; }
  :host(:not([motion="full"])) { animation: none; }
  :host(:not([motion="full"])) .draw { stroke-dashoffset: 0; }
  :host(:not([motion="full"])) .head,
  :host(:not([motion="full"])) .tail { opacity: 0; }
  :host(:not([motion="full"])) .track { opacity: 1; }
  :host(:not([motion="full"])) .ring { opacity: 0; }
  :host(:not([motion="full"])) .ring:nth-of-type(1) { opacity: 0.35; transform: scale(0.7); }
  :host(:not([motion="full"])) .art { animation: ox-loader-still 2400ms var(--_ease) infinite; }
}

:host([motion="reduced"]) .draw,
:host([motion="reduced"]) .beat,
:host([motion="reduced"]) .head,
:host([motion="reduced"]) .tail,
:host([motion="reduced"]) .ring,
:host([motion="reduced"]) .core,
:host([motion="reduced"]) .dot,
:host([motion="reduced"]) .slug { animation: none; }
:host([motion="reduced"]) { animation: none; }
:host([motion="reduced"]) .draw { stroke-dashoffset: 0; }
:host([motion="reduced"]) .head,
:host([motion="reduced"]) .tail { opacity: 0; }
:host([motion="reduced"]) .track { opacity: 1; }
:host([motion="reduced"]) .ring { opacity: 0; }
:host([motion="reduced"]) .ring:nth-of-type(1) { opacity: 0.35; transform: scale(0.7); }
:host([motion="reduced"]) .art { animation: ox-loader-still 2400ms var(--_ease) infinite; }

/* Forced colours --------------------------------------------------- */
@media (forced-colors: active) {
  :host { color: CanvasText; }
  :host([mode="overlay"]:not([scrim="false"])),
  :host([mode="page"]:not([scrim="false"])) { background: Canvas; }
  .track { opacity: 0.5; }
}
`;
