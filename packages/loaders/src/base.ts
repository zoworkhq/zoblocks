/**
 * OxLoaderElement — everything the five loader elements share.
 *
 * A subclass supplies its tag name and its art; this supplies the shadow root,
 * the attribute contract, the accessibility semantics, and the timing gate.
 *
 * Deliberate choices worth stating:
 *
 *   - **ARIA on the host, not inside the shadow root.** A role buried in a
 *     shadow tree is reachable by assistive technology but invisible to the
 *     host application's own queries and tests. Putting it on the element
 *     means `document.querySelector('[role=status]')` finds it, and a host
 *     framework can override it if it must.
 *   - **The label is always in the DOM.** `role="status"` announces its
 *     *contents*; an empty live region announces nothing at all. Hiding the
 *     label visually is a style decision, never a semantic one.
 *   - **No innerHTML from an attribute.** Every value a caller supplies is set
 *     with `textContent`. A loader is not a place to introduce an injection
 *     sink, and the same constraint is lint-enforced on the React side.
 *   - **Animations pause with the tab.** A loader left open in a background
 *     tab should not keep a phone's compositor awake.
 */

import { LOADER_CSS } from "./css.js";
import { DEFAULT_SLOW_HINT, LOADER_SIZE_PX, type LoaderSize } from "./art.js";

export type LoaderMode = "inline" | "overlay" | "page";
export type LoaderMotion = "auto" | "reduced" | "full";
export type LoaderAnnounce = "polite" | "assertive" | "off";

/**
 * Events every loader dispatches. All bubble and cross the shadow boundary.
 *
 * Hyphens, not colons, and that is not a style preference.
 *
 * These were `ox-loader:show` / `:slow` / `:hide` until apps/smoke tried to
 * bind them in an Angular template. Angular reserves the colon in `(event)`
 * bindings for its *global target* syntax — `(window:resize)`, `(document:
 * click)` — so `(ox-loader:show)` is parsed as the event `show` on a target
 * named `ox-loader` and rejected at compile time:
 *
 *     Unexpected global target 'ox-loader' defined for 'show' event.
 *     Supported list of global targets: window,document,body.
 *
 * There is no escape syntax. An Angular consumer would have had to drop to
 * `ElementRef` and `addEventListener` for every subscription — in a package
 * whose description claims Angular support. Hyphenated names cost nothing,
 * bind natively in all five frameworks, and match what the rest of the web
 * components ecosystem emits.
 *
 * `packages/loaders/test/reflection.test.ts` fails on any event name
 * containing a colon, so this cannot come back by habit.
 */
export const LOADER_EVENTS = ["ox-loader-show", "ox-loader-slow", "ox-loader-hide"] as const;
export type LoaderEvent = (typeof LOADER_EVENTS)[number];

/** Attributes every loader observes. Subclasses append their own. */
export const COMMON_ATTRIBUTES = [
  "size",
  "mode",
  "label",
  "show-label",
  "hint",
  "speed",
  "delay",
  "min-duration",
  "slow-after",
  "slow-hint",
  "open",
  "motion",
  "scrim",
  "announce",
  "progress",
] as const;

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Beats per minute → CSS period, clamped to a resting range.
 *
 * The clamp is not a nicety. This is decoration on a healthcare screen, and a
 * loader beating at 180 would be read as a number by the only people qualified
 * to read it.
 */
export function beatMs(bpm: number | undefined, speed: number): number {
  const rate =
    typeof bpm === "number" && !Number.isNaN(bpm) ? clamp(bpm, 40, 100) : 60 * clamp(speed, 0.5, 2);
  return Math.round(60000 / rate);
}

export function cycleMs(base: number, speed: number): number {
  return Math.round(base / clamp(speed, 0.5, 2));
}

export function strokePx(sizePx: number): number {
  return sizePx < 28 ? 2 : 2.4;
}

export function resolveSize(raw: string | null, fallback: LoaderSize): number {
  if (raw === null || raw === "") return LOADER_SIZE_PX[fallback];
  if (raw in LOADER_SIZE_PX) return LOADER_SIZE_PX[raw as LoaderSize];
  const parsed = Number.parseFloat(raw);
  return Number.isNaN(parsed) ? LOADER_SIZE_PX[fallback] : clamp(parsed, 12, 480);
}

/**
 * The base to extend from — the real `HTMLElement` in a browser, an inert stand-in
 * on a server.
 *
 * `class X extends HTMLElement` is evaluated when the module is *imported*, not
 * when an element is constructed. In Node — Nuxt's server build, Angular
 * Universal, Astro, SvelteKit, a Next.js server component — `HTMLElement` does
 * not exist, so importing this package threw `ReferenceError` before anything
 * rendered. Every SSR framework the README names was affected.
 *
 * The stand-in is never instantiated: `define()` below refuses to register when
 * `customElements` is absent, and custom elements are only constructed by the
 * parser or by `document.createElement`. So on a server this class is declared,
 * never used, and the import is a no-op — which is exactly what a server needs
 * from a package whose whole job is client-side.
 *
 * `packages/loaders/test/ssr.test.ts` runs in the `node` environment and fails
 * if this guard is removed. Its absence is why the bug shipped: jsdom supplies
 * `HTMLElement`, so the browser-environment suite could not see it.
 */
const ElementBase: typeof HTMLElement =
  typeof HTMLElement === "undefined" ? (class {} as unknown as typeof HTMLElement) : HTMLElement;

export abstract class OxLoaderElement extends ElementBase {
  static get observedAttributes(): string[] {
    return [...COMMON_ATTRIBUTES];
  }

  /** Default size step when none is given. */
  protected defaultSize: LoaderSize = "lg";

  /** Name reported through `data-ox-loader`, for tests and host styling. */
  protected abstract variant: string;

  /** The art, as an SVG string. Called on every render. */
  protected abstract renderArt(sizePx: number): string;

  /** CSS custom properties the art needs, as [name, value] pairs. */
  protected vars(sizePx: number): Array<[string, string]> {
    return [
      ["--ox-loader-size", `${sizePx}px`],
      ["--ox-loader-cycle", `${cycleMs(4000, this.speed)}ms`],
      ["--ox-loader-stroke", `${strokePx(sizePx)}px`],
    ];
  }

  #showTimer: ReturnType<typeof setTimeout> | undefined;
  #hideTimer: ReturnType<typeof setTimeout> | undefined;
  #slowTimer: ReturnType<typeof setTimeout> | undefined;
  #holdTimer: ReturnType<typeof setTimeout> | undefined;
  /**
   * True while the minimum on-screen time has not yet elapsed.
   *
   * A countdown rather than two clock readings, matching the React gate in
   * registry/oxygen/lib/loader.tsx. Reading the wall clock to decide what to
   * render makes output depend on when it rendered, which is what makes a
   * visual-regression test flaky — and the two channels must agree exactly.
   */
  #held = false;
  #pendingClose = false;
  #visible = false;
  #slow = false;
  #built = false;

  constructor() {
    super();
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
  }

  /* -------------------------------------------------------------- */
  /* Properties                                                      */
  /* -------------------------------------------------------------- */

  /**
   * Every observed attribute has a matching property, and every one of those
   * properties is writable.
   *
   * This is not API surface for its own sake — it is the difference between
   * working in React and Vue and not. Both frameworks decide per binding
   * whether to write a DOM property or an attribute, and both use the same
   * test: `if (key in element)`. A getter with no setter passes that test and
   * then throws on assignment:
   *
   *     TypeError: Cannot set property label of #<OxLoaderElement>
   *                which has only a getter
   *
   * which is what these elements did in React 19 and Vue 3 until
   * apps/smoke caught it. Nothing in the jsdom suite could: it constructs
   * elements and calls `setAttribute` directly, which is the *other* path.
   *
   * Attributes stay the source of truth. A setter writes the attribute and
   * the getter reads it back, so a property write and an attribute write are
   * indistinguishable afterwards, and `attributeChangedCallback` fires for
   * both. Reflection in one direction only, which is what avoids the
   * property/attribute desync every hand-rolled two-way binding eventually
   * grows.
   *
   * `packages/loaders/test/reflection.test.ts` walks COMMON_ATTRIBUTES and
   * fails if any of them loses its setter, so a new attribute cannot
   * reintroduce the bug.
   */
  #reflect(attribute: string, value: unknown): void {
    // null and undefined mean "unset", restoring the documented default. Every
    // other value is stringified, including `false` — see `open`.
    if (value === null || value === undefined) this.removeAttribute(attribute);
    else this.setAttribute(attribute, String(value));
  }

  get size(): LoaderSize | number | null {
    const raw = this.getAttribute("size");
    if (raw === null) return null;
    const parsed = Number.parseFloat(raw);
    return Number.isNaN(parsed) ? (raw as LoaderSize) : parsed;
  }
  set size(value: LoaderSize | number | null | undefined) {
    this.#reflect("size", value);
  }

  /** The resolved pixel size. Derived, so deliberately read-only. */
  get sizePx(): number {
    return resolveSize(this.getAttribute("size"), this.defaultSize);
  }

  get speed(): number {
    return clamp(Number.parseFloat(this.getAttribute("speed") ?? "1") || 1, 0.5, 2);
  }
  set speed(value: number | null | undefined) {
    this.#reflect("speed", value);
  }

  get label(): string {
    return this.getAttribute("label") || "Loading";
  }
  set label(value: string | null | undefined) {
    this.#reflect("label", value);
  }

  get mode(): LoaderMode {
    const value = this.getAttribute("mode");
    return value === "overlay" || value === "page" ? value : "inline";
  }
  set mode(value: LoaderMode | null | undefined) {
    this.#reflect("mode", value);
  }

  get showLabel(): boolean {
    const value = this.getAttribute("show-label");
    if (value === null) return this.mode !== "inline";
    return value !== "false";
  }
  set showLabel(value: boolean | null | undefined) {
    this.#reflect("show-label", value);
  }

  get hint(): string {
    return this.getAttribute("hint") ?? "";
  }
  set hint(value: string | null | undefined) {
    this.#reflect("hint", value);
  }

  get slowHint(): string {
    return this.getAttribute("slow-hint") || DEFAULT_SLOW_HINT;
  }
  set slowHint(value: string | null | undefined) {
    this.#reflect("slow-hint", value);
  }

  get motion(): LoaderMotion {
    const value = this.getAttribute("motion");
    return value === "reduced" || value === "full" ? value : "auto";
  }
  set motion(value: LoaderMotion | null | undefined) {
    this.#reflect("motion", value);
  }

  get scrim(): string | null {
    return this.getAttribute("scrim");
  }
  set scrim(value: string | null | undefined) {
    this.#reflect("scrim", value);
  }

  get announce(): LoaderAnnounce {
    const value = this.getAttribute("announce");
    return value === "assertive" || value === "off" ? value : "polite";
  }
  set announce(value: LoaderAnnounce | null | undefined) {
    this.#reflect("announce", value);
  }

  /** A number in 0–100, or null when the wait is of unknown length. */
  get progress(): number | null {
    const raw = this.getAttribute("progress");
    if (raw === null || raw === "") return null;
    const parsed = Number.parseFloat(raw);
    return Number.isNaN(parsed) ? null : clamp(parsed, 0, 100);
  }
  set progress(value: number | null | undefined) {
    this.#reflect("progress", value);
  }

  get delay(): number {
    return this.#num("delay", 0);
  }
  set delay(value: number | null | undefined) {
    this.#reflect("delay", value);
  }

  get minDuration(): number {
    return this.#num("min-duration", 400);
  }
  set minDuration(value: number | null | undefined) {
    this.#reflect("min-duration", value);
  }

  get slowAfter(): number {
    return this.#num("slow-after", 8000);
  }
  set slowAfter(value: number | null | undefined) {
    this.#reflect("slow-after", value);
  }

  /**
   * Whether the loader is showing.
   *
   * An absent attribute means open, so `open = false` writes the string
   * "false" rather than removing the attribute. That asymmetry is deliberate
   * and it is also what makes React 18 work: React 18 has no property path at
   * all and stringifies `open={false}` to `open="false"`, so both majors end
   * up at the same attribute value by different routes.
   */
  get open(): boolean {
    return this.getAttribute("open") !== "false";
  }
  set open(value: boolean | null | undefined) {
    this.#reflect("open", value);
  }

  /** @deprecated Use `open`. Kept so existing callers keep compiling. */
  get isOpen(): boolean {
    return this.open;
  }

  #num(attribute: string, fallback: number): number {
    const raw = this.getAttribute(attribute);
    if (raw === null || raw === "") return fallback;
    const parsed = Number.parseFloat(raw);
    return Number.isNaN(parsed) ? fallback : Math.max(0, parsed);
  }

  /* -------------------------------------------------------------- */
  /* Lifecycle                                                       */
  /* -------------------------------------------------------------- */

  connectedCallback(): void {
    this.#build();
    this.#syncGate();
    document.addEventListener("visibilitychange", this.#onVisibilityChange);
  }

  disconnectedCallback(): void {
    this.#clearTimers();
    document.removeEventListener("visibilitychange", this.#onVisibilityChange);
  }

  attributeChangedCallback(name: string): void {
    if (!this.isConnected) return;
    if (name === "open" || name === "delay" || name === "min-duration" || name === "slow-after") {
      this.#syncGate();
      return;
    }
    this.#render();
  }

  /** Restart the entrance. Useful after a route change reuses the element. */
  replay(): void {
    this.#built = false;
    this.#build();
    this.#render();
  }

  #onVisibilityChange = (): void => {
    // A loader in a background tab should not keep the compositor awake.
    const root = this.shadowRoot;
    if (!root) return;
    const state = document.visibilityState === "hidden" ? "paused" : "running";
    for (const node of root.querySelectorAll<SVGElement>("svg *")) {
      node.style.animationPlayState = state;
    }
  };

  /* -------------------------------------------------------------- */
  /* Timing                                                          */
  /* -------------------------------------------------------------- */

  #clearTimers(): void {
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
    clearTimeout(this.#slowTimer);
    clearTimeout(this.#holdTimer);
    this.#showTimer = undefined;
    this.#hideTimer = undefined;
    this.#slowTimer = undefined;
    this.#holdTimer = undefined;
  }

  #syncGate(): void {
    const delay = this.delay;

    if (this.isOpen) {
      clearTimeout(this.#hideTimer);
      if (this.#visible) return;
      if (delay <= 0) {
        this.#show();
        return;
      }
      // Hidden for the whole of the delay. Without this the element is on
      // screen from the moment it is connected, and `delay` — whose entire job
      // is to stop a fast response flashing a loader — does nothing at all.
      this.#applyVisibility();
      clearTimeout(this.#showTimer);
      this.#showTimer = setTimeout(() => this.#show(), delay);
      return;
    }

    clearTimeout(this.#showTimer);
    clearTimeout(this.#slowTimer);
    this.#slow = false;
    if (!this.#visible) {
      this.#applyVisibility();
      return;
    }

    // Still inside the minimum: remember the intent and let the hold timer
    // close it when the countdown expires.
    if (this.#held) {
      this.#pendingClose = true;
      return;
    }
    this.#hide();
  }

  #show(): void {
    this.#visible = true;
    this.#applyVisibility();

    const minDuration = this.minDuration;
    clearTimeout(this.#holdTimer);
    this.#held = minDuration > 0;
    this.#pendingClose = false;
    if (this.#held) {
      this.#holdTimer = setTimeout(() => {
        this.#held = false;
        if (this.#pendingClose) this.#hide();
      }, minDuration);
    }

    this.#render();
    this.dispatchEvent(new CustomEvent("ox-loader-show", { bubbles: true, composed: true }));

    const slowAfter = this.slowAfter;
    clearTimeout(this.#slowTimer);
    if (slowAfter > 0) {
      this.#slowTimer = setTimeout(() => {
        this.#slow = true;
        this.#render();
        this.dispatchEvent(new CustomEvent("ox-loader-slow", { bubbles: true, composed: true }));
      }, slowAfter);
    }
  }

  #hide(): void {
    this.#visible = false;
    this.#applyVisibility();
    this.dispatchEvent(new CustomEvent("ox-loader-hide", { bubbles: true, composed: true }));
  }

  #applyVisibility(): void {
    if (this.#visible) this.removeAttribute("hidden");
    else this.setAttribute("hidden", "");
  }

  /* -------------------------------------------------------------- */
  /* Render                                                          */
  /* -------------------------------------------------------------- */

  #build(): void {
    const root = this.shadowRoot;
    if (!root || this.#built) return;

    const style = document.createElement("style");
    style.textContent = LOADER_CSS;

    const art = document.createElement("div");
    art.className = "art";
    art.setAttribute("part", "art");
    art.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.setAttribute("part", "label");

    const value = document.createElement("span");
    value.className = "value";
    value.setAttribute("part", "progress");

    const hint = document.createElement("span");
    hint.className = "hint";
    hint.setAttribute("part", "hint");

    const actions = document.createElement("slot");
    actions.setAttribute("name", "actions");

    root.replaceChildren(style, art, label, value, hint, actions);
    this.#built = true;
  }

  #render(): void {
    const root = this.shadowRoot;
    if (!root || !this.#visible) return;
    this.#build();

    const sizePx = this.sizePx;
    for (const [name, value] of this.vars(sizePx)) this.style.setProperty(name, value);

    const progress = this.progress;
    const determinate = progress !== null;
    this.setAttribute("data-ox-loader", this.variant);
    this.setAttribute("data-ox-determinate", String(determinate));

    // Roles live on the host so the application's own queries can see them.
    if (determinate) {
      this.setAttribute("role", "progressbar");
      this.removeAttribute("aria-live");
      this.setAttribute("aria-valuemin", "0");
      this.setAttribute("aria-valuemax", "100");
      this.setAttribute("aria-valuenow", String(Math.round(progress)));
      this.setAttribute("aria-valuetext", `${Math.round(progress)} percent`);
      // A progressbar is not announced by its contents, so it needs a name.
      this.setAttribute("aria-label", this.label);
    } else {
      this.setAttribute("role", "status");
      const announce = this.announce;
      if (announce === "off") this.removeAttribute("aria-live");
      else this.setAttribute("aria-live", announce);
      for (const attribute of [
        "aria-valuemin",
        "aria-valuemax",
        "aria-valuenow",
        "aria-valuetext",
        "aria-label",
      ]) {
        this.removeAttribute(attribute);
      }
    }

    const artHost = root.querySelector(".art");
    if (artHost) artHost.innerHTML = this.renderArt(sizePx);

    const showLabel = this.showLabel;
    const label = root.querySelector<HTMLElement>("[part='label']");
    if (label) {
      // textContent, never innerHTML: a loader is not an injection sink.
      label.textContent = this.label;
      label.className = showLabel ? "label" : "sr";
    }

    const value = root.querySelector<HTMLElement>("[part='progress']");
    if (value) value.textContent = determinate && showLabel ? `${Math.round(progress)}%` : "";

    const hint = root.querySelector<HTMLElement>("[part='hint']");
    if (hint) {
      const message = this.#slow ? this.slowHint : this.hint;
      hint.textContent = showLabel ? message : "";
    }
  }
}

/**
 * Register an element, tolerating a second import of the same module.
 *
 * A page that imports both `@oxygenui-design/loaders` and
 * `@oxygenui-design/loaders/pulse` would otherwise throw on the duplicate
 * definition and take the host application down with it — over a loader.
 */
export function define(tag: string, constructor: CustomElementConstructor): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(tag)) return;
  customElements.define(tag, constructor);
}
