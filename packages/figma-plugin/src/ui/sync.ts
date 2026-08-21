/**
 * Connecting, pulling and proposing — the three screens that talk to a server.
 *
 * Rendering only. Every decision they present was made somewhere else:
 * `previewPull` decided what would change, the console decided whether a colour
 * passes. What is here is the part a designer reads before agreeing, and the
 * words matter as much as the counts — "18 created, 4 updated, 2 no longer in
 * this theme" is a sentence somebody can act on; "sync 24 changes" is not.
 */

import type { Credential, ThemeSummary } from "../console";
import type { PullPreview } from "../pull";
import { summarise, versionMove } from "../pull";

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

/* ---------------------------------------------------------------- connect */

export interface ConnectOptions {
  credential?: Credential;
  invalid?: string;
  onConnect(origin: string, token: string): void;
  onDisconnect(): void;
}

export function renderConnect(root: HTMLElement, options: ConnectOptions): void {
  root.textContent = "";

  if (options.credential) {
    const wrap = el("div", "connected");
    wrap.append(el("p", "note", `Connected to ${options.credential.origin}.`));

    const forget = el("button", "secondary", "Disconnect");
    forget.type = "button";
    forget.addEventListener("click", options.onDisconnect);
    wrap.append(forget);
    root.append(wrap);
    return;
  }

  const form = el("form", "connect");
  form.append(
    field("origin", "Console address", "https://console.oxygenui.design", "url"),
    field("token", "Figma key", "oxy_live_…", "password"),
  );

  /*
   * A password field, for a value that is pasted once and not read back.
   *
   * It is not a password, and the reason to mask it anyway is that designers
   * screen-share. A bearer token sitting in plain text in a panel during a
   * design review is the most ordinary way one leaks.
   */
  form.append(
    el(
      "p",
      "note",
      "Mint one in the console at Market → Tokens, with the scope set to Figma. It reads your themes and proposes a brand colour; it cannot publish.",
    ),
  );

  if (options.invalid) {
    const problem = el("p", "finding", options.invalid);
    problem.setAttribute("role", "alert");
    form.append(problem);
  }

  const submit = el("button", "primary", "Connect");
  submit.type = "submit";
  form.append(submit);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    options.onConnect(String(data.get("origin") ?? ""), String(data.get("token") ?? ""));
  });

  root.append(form);
}

function field(name: string, label: string, placeholder: string, type: string): HTMLElement {
  const wrap = el("div", "field");
  const id = `connect-${name}`;

  const labelEl = el("label", undefined, label);
  labelEl.htmlFor = id;

  const input = el("input");
  input.id = id;
  input.name = name;
  input.type = type;
  input.placeholder = placeholder;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.required = true;

  wrap.append(labelEl, input);
  return wrap;
}

/* ------------------------------------------------------------------- pull */

export interface PullOptions {
  themes: ThemeSummary[];
  chosen?: string;
  pinned?: { slug: string; version: number };
  preview?: PullPreview;
  busy?: boolean;
  onChoose(slug: string): void;
  onPreview(): void;
  onApply(): void;
}

export function renderPull(root: HTMLElement, options: PullOptions): void {
  root.textContent = "";

  if (options.themes.length === 0) {
    root.append(el("p", "note", "This organisation has no themes yet."));
    return;
  }

  const picker = el("div", "field");
  const label = el("label", undefined, "Theme");
  label.htmlFor = "pull-theme";
  const select = el("select");
  select.id = "pull-theme";
  for (const theme of options.themes) {
    const option = el("option");
    option.value = theme.slug;
    option.textContent =
      theme.liveVersion === null
        ? `${theme.name} — draft`
        : `${theme.name} — v${theme.liveVersion}`;
    if (theme.slug === options.chosen) option.selected = true;
    select.append(option);
  }
  select.addEventListener("change", () => options.onChoose(select.value));
  picker.append(label, select);
  root.append(picker);

  const pinned = options.pinned;
  if (pinned) {
    const live = options.themes.find((t) => t.slug === pinned.slug)?.liveVersion;
    root.append(
      el(
        "p",
        "note",
        live === null || live === undefined
          ? `This file is on ${pinned.slug} v${pinned.version}.`
          : live === pinned.version
            ? `This file is on ${pinned.slug} v${pinned.version}, which is live.`
            : `This file is on ${pinned.slug} v${pinned.version}; v${live} is live.`,
      ),
    );
  }

  const check = el("button", "primary", options.busy ? "Checking…" : "Check for changes");
  check.type = "button";
  check.disabled = Boolean(options.busy);
  check.addEventListener("click", options.onPreview);
  root.append(check);

  if (options.preview) root.append(previewBlock(options.preview, options.onApply, options.busy));
}

function previewBlock(preview: PullPreview, onApply: () => void, busy?: boolean): HTMLElement {
  const wrap = el("div", "preview");

  const head = el("p", "count", summarise(preview.diff));
  head.dataset.state = preview.diff.clean ? "pass" : "fail";
  wrap.append(head);

  wrap.append(
    el(
      "p",
      "note",
      `${preview.name} v${preview.version}${preview.status === "draft" ? " (draft — nothing published yet)" : ""}`,
    ),
  );

  const move = versionMove(preview.pinned, { slug: preview.slug, version: preview.version });
  if (move === "back") {
    /*
     * Going backwards is legitimate and is also how somebody undoes a week of
     * work by picking the wrong row. Said out loud, not blocked.
     */
    const warn = el(
      "p",
      "finding",
      `This is older than what the file is on (v${preview.pinned?.version}). Applying it moves the file back.`,
    );
    wrap.append(warn);
  }
  if (move === "different-theme") {
    wrap.append(
      el(
        "p",
        "finding",
        `This file was pulled from ${preview.pinned?.slug}. Applying this replaces it with ${preview.slug}.`,
      ),
    );
  }

  if (preview.restores.length > 0) {
    const restore = el("div", "restores");
    restore.append(
      el(
        "p",
        "note",
        `${preview.restores.length} clinical variable${preview.restores.length === 1 ? "" : "s"} will be restored. These carry a validated contrast floor and 60° of hue separation, so they are not a customer's to change:`,
      ),
    );
    const list = el("ul");
    for (const item of preview.restores) {
      const li = el("li");
      li.append(el("code", undefined, item.name));
      list.append(li);
    }
    restore.append(list);
    wrap.append(restore);
  }

  if (preview.diff.orphan.length > 0) {
    const orphans = el("details", "group");
    orphans.append(
      el("summary", undefined, `No longer in this theme (${preview.diff.orphan.length})`),
    );
    orphans.append(
      el(
        "p",
        "note",
        "Left exactly as they are. This plugin cannot delete a variable — something else in your file may still be using these.",
      ),
    );
    const list = el("ul");
    for (const orphan of preview.diff.orphan) {
      const li = el("li");
      li.append(el("code", undefined, orphan.name));
      list.append(li);
    }
    orphans.append(list);
    wrap.append(orphans);
  }

  if (!preview.diff.clean) {
    const apply = el("button", "primary", busy ? "Applying…" : "Apply to this file");
    apply.type = "button";
    apply.disabled = Boolean(busy);
    apply.addEventListener("click", onApply);
    wrap.append(apply);
  }

  return wrap;
}

/* ------------------------------------------------------------------- push */

export interface PushOptions {
  themes: ThemeSummary[];
  chosen?: string;
  anchor: string;
  /** Measured here, from the theme that was pulled. Indicative, not the gate. */
  local?: { ratio: number; floor: number; against: string; passes: boolean };
  outcome?: { url: string; steps: number } | { error: string; detail?: string[] };
  busy?: boolean;
  onChoose(slug: string): void;
  onAnchor(hex: string): void;
  onPropose(): void;
}

export function renderPush(root: HTMLElement, options: PushOptions): void {
  root.textContent = "";

  root.append(
    el(
      "p",
      "note",
      "Propose a brand colour. The console derives the other ten steps, measures them, and opens a draft — it cannot publish, and neither can this.",
    ),
  );

  const picker = el("div", "field");
  const label = el("label", undefined, "Theme");
  label.htmlFor = "push-theme";
  const select = el("select");
  select.id = "push-theme";
  for (const theme of options.themes) {
    const option = el("option");
    option.value = theme.slug;
    option.textContent = theme.name;
    if (theme.slug === options.chosen) option.selected = true;
    select.append(option);
  }
  select.addEventListener("change", () => options.onChoose(select.value));
  picker.append(label, select);
  root.append(picker);

  const anchorField = el("div", "field");
  const anchorLabel = el("label", undefined, "Brand colour");
  anchorLabel.htmlFor = "push-anchor";
  const anchor = el("input");
  anchor.id = "push-anchor";
  anchor.type = "text";
  anchor.value = options.anchor;
  anchor.placeholder = "#1d63c9";
  anchor.spellcheck = false;
  anchor.addEventListener("input", () => options.onAnchor(anchor.value));
  anchorField.append(anchorLabel, anchor);
  root.append(anchorField);

  if (options.local) {
    /*
     * Measured here, decided there.
     *
     * This is one pair — the label colour on the step the accent comes from —
     * and it is the pair that fails most often, so seeing it while choosing is
     * worth a lot. It is not the gate: the console measures twenty-odd pairs
     * across three themes and is the only thing that can refuse. Saying which
     * is which is the difference between a helpful number and a false pass.
     */
    const line = el(
      "p",
      options.local.passes ? "note" : "finding",
      `${options.local.against} on this colour measures ${options.local.ratio.toFixed(2)}:1 against a ${options.local.floor}:1 floor. One pair, measured here — the console checks the rest.`,
    );
    root.append(line);
  }

  const propose = el("button", "primary", options.busy ? "Proposing…" : "Propose as a draft");
  propose.type = "button";
  propose.disabled = Boolean(options.busy);
  propose.addEventListener("click", options.onPropose);
  root.append(propose);

  if (options.outcome && "url" in options.outcome) {
    const done = el("div", "preview");
    done.append(el("p", "count", `Draft opened, ${options.outcome.steps} steps.`));
    done.append(
      el(
        "p",
        "note",
        "Somebody with the role for it reviews and publishes in the console. Nothing is live yet.",
      ),
    );
    const link = el("a", undefined, options.outcome.url);
    link.href = options.outcome.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    done.append(link);
    root.append(done);
  }

  if (options.outcome && "error" in options.outcome) {
    const problem = el("div", "refusal");
    problem.setAttribute("role", "alert");
    problem.append(el("p", "finding", options.outcome.error));
    if (options.outcome.detail?.length) {
      const list = el("ul");
      for (const line of options.outcome.detail) list.append(el("li", undefined, line));
      problem.append(list);
    }
    root.append(problem);
  }
}
