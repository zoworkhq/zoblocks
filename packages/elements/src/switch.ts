/**
 * `<ox-switch>` — the clinical switch, for a page that is not React.
 *
 * Same three axes as the React component: what the record says, what the
 * system is doing about it, and whether you may change it. What differs is who
 * owns the machine. React can take a promise; a custom element cannot assume
 * one, so `phase` is an attribute the host sets and the element reflects. The
 * host drives, the element renders and announces — which is also how the
 * loaders package works, and how a Vue or Angular consumer expects to bind.
 *
 *     <ox-switch label="Contact precautions" value="on" tone="caution"
 *                state-labels="in-effect"></ox-switch>
 *
 *     el.addEventListener("ox-switch-request", (event) => {
 *       el.phase = "pending";
 *       api.set(event.detail.value).then(
 *         () => { el.value = event.detail.value; el.phase = "committed"; },
 *         (error) => { el.error = error.message; el.phase = "reverted"; },
 *       );
 *     });
 *
 * Deliberate choices, mirroring the loader elements:
 *
 *   - **ARIA on the host, not inside the shadow root.** A role buried in a
 *     shadow tree is reachable by assistive technology but invisible to the
 *     host application's own queries and tests.
 *   - **The label is always in the DOM.** `role="status"` announces its
 *     contents; an empty live region announces nothing at all.
 *   - **No `innerHTML` from an attribute.** Every caller-supplied value is set
 *     with `textContent`. A clinical control is not a place to introduce an
 *     injection sink.
 */

import { SWITCH_CSS } from "./switch-css.js";
import {
  SWITCH_SIZE,
  nextValueFor,
  resolveStateLabels,
  wordFor,
  type CommitPhase,
  type SwitchSize,
  type SwitchTone,
  type SwitchValue,
} from "./vocabulary.js";

/**
 * Events the element dispatches. All bubble and cross the shadow boundary.
 *
 * Hyphens, not colons — Angular reserves the colon in `(event)` bindings for
 * its global-target syntax, so `(ox-switch:request)` fails to compile in a
 * template. The loaders package learned this the same way.
 */
export const SWITCH_EVENTS = [
  "ox-switch-request",
  "ox-switch-resolve-conflict",
  "ox-switch-cancel-queued",
] as const;
export type SwitchEvent = (typeof SWITCH_EVENTS)[number];

const OBSERVED = [
  "value",
  "phase",
  "tone",
  "size",
  "label",
  "description",
  "state-labels",
  "absent-reason",
  "locked-reason",
  "error",
  "readonly",
  "disabled",
  "show-state",
] as const;

function isValue(input: string | null): input is SwitchValue {
  return input === "on" || input === "off" || input === "unknown";
}

const CHECK =
  '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" part="glyph" class="ox-switch__glyph"><path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const QUERY =
  '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" part="glyph" class="ox-switch__glyph"><path d="M8 4.2v5.2M8 12.4v.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

export class OxSwitchElement extends HTMLElement {
  static get observedAttributes(): readonly string[] {
    return OBSERVED;
  }

  #root: ShadowRoot;
  #control!: HTMLButtonElement;
  #thumb!: HTMLSpanElement;
  #stateWord!: HTMLSpanElement;
  #labelText!: HTMLSpanElement;
  #note!: HTMLSpanElement;
  #polite!: HTMLSpanElement;
  #assertive!: HTMLSpanElement;
  #negative!: HTMLButtonElement;
  #upgraded = false;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: "open" });
  }

  /* ---- reflected properties ------------------------------------- */

  get value(): SwitchValue {
    const raw = this.getAttribute("value");
    return isValue(raw) ? raw : "off";
  }
  set value(next: SwitchValue) {
    this.setAttribute("value", next);
  }

  get phase(): CommitPhase {
    return (this.getAttribute("phase") as CommitPhase | null) ?? "idle";
  }
  set phase(next: CommitPhase) {
    this.setAttribute("phase", next);
  }

  get error(): string | null {
    return this.getAttribute("error");
  }
  set error(next: string | null) {
    if (next === null) this.removeAttribute("error");
    else this.setAttribute("error", next);
  }

  get readOnly(): boolean {
    return this.hasAttribute("readonly");
  }
  set readOnly(next: boolean) {
    this.toggleAttribute("readonly", next);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }
  set disabled(next: boolean) {
    this.toggleAttribute("disabled", next);
  }

  /* ---- lifecycle -------------------------------------------------- */

  connectedCallback(): void {
    if (!this.#upgraded) {
      this.#build();
      this.#upgraded = true;
    }
    this.#render();
  }

  attributeChangedCallback(): void {
    if (this.#upgraded) this.#render();
  }

  #build(): void {
    const style = document.createElement("style");
    style.textContent = SWITCH_CSS;

    const wrapper = document.createElement("span");
    wrapper.className = "ox-switch";
    wrapper.setAttribute("part", "root");

    this.#control = document.createElement("button");
    this.#control.type = "button";
    this.#control.className = "ox-switch__control";
    this.#control.setAttribute("part", "control");
    // The role goes on the host too, so a host application's own queries and
    // its axe run both find it without piercing the shadow boundary.
    this.#control.setAttribute("role", "switch");

    const track = document.createElement("span");
    track.className = "ox-switch__track";
    track.setAttribute("part", "track");

    this.#thumb = document.createElement("span");
    this.#thumb.className = "ox-switch__thumb";
    this.#thumb.setAttribute("part", "thumb");
    track.append(this.#thumb);
    this.#control.append(track);

    const text = document.createElement("span");
    text.className = "ox-switch__text";
    this.#labelText = document.createElement("span");
    this.#labelText.className = "ox-switch__label";
    this.#stateWord = document.createElement("span");
    this.#stateWord.className = "ox-switch__state";
    this.#stateWord.setAttribute("part", "state");
    this.#note = document.createElement("span");
    this.#note.className = "ox-switch__note";
    text.append(this.#labelText, this.#stateWord, this.#note);

    // The path out of "unknown" that records the negative. Visually hidden,
    // always keyboard reachable — a third click position would let somebody
    // un-ask a question, which is the one thing this control must not allow.
    this.#negative = document.createElement("button");
    this.#negative.type = "button";
    this.#negative.className = "ox-switch__sr";

    this.#polite = document.createElement("span");
    this.#polite.className = "ox-switch__sr";
    this.#polite.setAttribute("role", "status");
    this.#polite.setAttribute("aria-live", "polite");

    this.#assertive = document.createElement("span");
    this.#assertive.className = "ox-switch__sr";
    this.#assertive.setAttribute("role", "alert");
    this.#assertive.setAttribute("aria-live", "assertive");

    wrapper.append(this.#control, this.#negative, text, this.#polite, this.#assertive);
    this.#root.append(style, wrapper);

    this.#control.addEventListener("click", (event) => {
      if (this.readOnly || this.disabled) return;
      const shift = (event as MouseEvent).shiftKey;
      const next = shift && this.value === "unknown" ? "off" : nextValueFor(this.value);
      this.#request(next);
    });
    this.#negative.addEventListener("click", () => {
      if (this.readOnly || this.disabled) return;
      this.#request("off");
    });
  }

  #request(next: "on" | "off"): void {
    this.dispatchEvent(
      new CustomEvent("ox-switch-request", {
        detail: { value: next, from: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /* ---- render ------------------------------------------------------ */

  #render(): void {
    const value = this.value;
    const phase = this.phase;
    const labels = resolveStateLabels(
      this.getAttribute("state-labels"),
      this.getAttribute("absent-reason"),
    );
    const word = wordFor(value, labels);
    const label = this.getAttribute("label") ?? "";
    const size = (this.getAttribute("size") as SwitchSize | null) ?? "default";
    const geometry = SWITCH_SIZE[size] ?? SWITCH_SIZE.default;

    // Host attributes: state is readable from outside the shadow boundary.
    this.setAttribute("data-ox-switch", "");
    this.setAttribute("data-ox-state", value);
    this.setAttribute("data-ox-phase", phase);
    this.setAttribute(
      "data-ox-tone",
      (this.getAttribute("tone") as SwitchTone | null) ?? "affirmative",
    );
    this.setAttribute("data-ox-size", size);
    this.style.setProperty("--ox-switch-track-w", `${geometry.track[0]}px`);
    this.style.setProperty("--ox-switch-track-h", `${geometry.track[1]}px`);
    this.style.setProperty("--ox-switch-thumb-size", `${geometry.thumb}px`);

    this.#control.setAttribute(
      "aria-checked",
      value === "unknown" ? "mixed" : String(value === "on"),
    );
    this.#control.setAttribute("aria-busy", String(phase === "pending"));
    if (label) this.#control.setAttribute("aria-label", label);
    if (this.readOnly) this.#control.setAttribute("aria-readonly", "true");
    else this.#control.removeAttribute("aria-readonly");
    if (this.disabled) this.#control.setAttribute("aria-disabled", "true");
    else this.#control.removeAttribute("aria-disabled");

    // The glyph, so the state survives greyscale and forced colours.
    this.#thumb.innerHTML = value === "unknown" ? QUERY : value === "on" ? CHECK : "";

    this.#labelText.textContent = label;
    const showState = this.getAttribute("show-state") !== "false";
    this.#stateWord.textContent = showState ? word : "";

    const lockedReason = this.getAttribute("locked-reason");
    const error = this.getAttribute("error");
    this.#note.textContent = error ?? (this.readOnly ? (lockedReason ?? "") : "");
    this.#note.className = error
      ? "ox-switch__note ox-switch__note--error"
      : "ox-switch__note ox-switch__note--locked";

    this.#negative.textContent =
      value === "unknown" && !this.readOnly && !this.disabled
        ? `Record ${labels.off.toLowerCase()} for ${label || "this setting"}`
        : "";
    this.#negative.hidden = this.#negative.textContent === "";

    this.#announce(phase, label || "This setting", word, labels.off, error);
  }

  #announce(
    phase: CommitPhase,
    label: string,
    word: string,
    offWord: string,
    error: string | null,
  ): void {
    const lower = word.toLowerCase();
    let polite = "";
    let assertive = "";

    switch (phase) {
      case "pending":
        polite = `${label}: setting to ${lower}…`;
        break;
      case "queued":
        polite = `${label}: ${lower} queued. Not sent yet — it will apply when the connection returns.`;
        break;
      case "committed":
        polite = `${label}: ${lower}.`;
        break;
      case "reverted":
        // "Still {state}" is the load-bearing clause: a listener who hears only
        // that it failed still does not know what is true.
        assertive = `${label} was not changed. ${error ?? ""} Still ${lower}.`.replace(/\s+/g, " ");
        break;
      case "blocked":
        assertive = `${label} cannot be changed. ${error ?? ""}`.trim();
        break;
      case "stale":
        assertive = `${label} was changed by someone else. Choose which value to keep.`;
        break;
      default:
        break;
    }

    // textContent, never innerHTML. Every string here can contain a
    // caller-supplied label or a server error message.
    if (this.#polite.textContent !== polite) this.#polite.textContent = polite;
    if (this.#assertive.textContent !== assertive) this.#assertive.textContent = assertive;
    void offWord;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ox-switch")) {
  customElements.define("ox-switch", OxSwitchElement);
}

declare global {
  interface HTMLElementTagNameMap {
    "ox-switch": OxSwitchElement;
  }
}
