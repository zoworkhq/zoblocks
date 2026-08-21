/**
 * The panel half. DOM and `fetch`, and no `figma` API.
 *
 * Everything with a rule in it lives elsewhere — `gate.ts` decides what a
 * reading is, `pull.ts` decides what a sync would change, `console.ts` decides
 * what a refusal means. What is left here is state and wiring across two
 * boundaries that cannot be unit-tested: `postMessage` to the sandbox, and the
 * network. Keeping it thin is the point.
 */

import type { CollectionSummary, FromUi, Standing } from "../protocol";
import { readUiMessage } from "../protocol";
import {
  consoleApi,
  readOrigin,
  readToken,
  type ConsoleApi,
  type ResolvedPayload,
  type ThemeSummary,
} from "../console";
import { readAnchorLocally, type PullPreview } from "../pull";
import { renderControls, type Choice } from "./controls";
import { renderReport } from "./render";
import { renderTabs, type Pane } from "./tabs";
import { renderConnect, renderPull, renderPush } from "./sync";
import { wireCopy } from "./copy";

const tabsRoot = document.getElementById("tabs");
const paneRoot = document.getElementById("pane");
const reportRoot = document.getElementById("report");

interface State {
  pane: Pane;
  collections: CollectionSummary[];
  standing: Standing;
  choice: Choice;
  grounds: string[];
  themes: ThemeSummary[];
  theme?: string;
  payload?: ResolvedPayload;
  preview?: PullPreview;
  anchor: string;
  busy: boolean;
  invalid?: string;
  pushOutcome?: { url: string; steps: number } | { error: string; detail?: string[] };
}

const state: State = {
  pane: "check",
  collections: [],
  standing: {},
  choice: { collection: "", mode: "", kind: "text" },
  grounds: [],
  themes: [],
  anchor: "",
  busy: false,
};

function send(message: FromUi): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

function api(): ConsoleApi | undefined {
  const credential = state.standing.credential;
  return credential ? consoleApi((url, init) => fetch(url, init), credential) : undefined;
}

/* ------------------------------------------------------------------ paint */

function paint(): void {
  if (!tabsRoot || !paneRoot) return;

  renderTabs(tabsRoot, {
    active: state.pane,
    connected: Boolean(state.standing.credential),
    onSelect: (pane) => {
      state.pane = pane;
      paint();
      if (pane !== "check" && state.themes.length === 0) void loadThemes();
    },
  });

  if (reportRoot) reportRoot.hidden = state.pane !== "check";

  switch (state.pane) {
    case "check": {
      renderControls(paneRoot, {
        collections: state.collections,
        grounds: state.grounds,
        value: state.choice,
        onChange: (next) => {
          const changedCollection = next.collection !== state.choice.collection;
          state.choice = changedCollection ? { ...next, ground: undefined } : next;
          if (changedCollection) state.choice.mode = modeFor(next.collection);
          paint();
          inspect();
        },
      });
      // The connect form sits under the reading, so a designer who only wants
      // the gate never has to deal with a credential to get it.
      const connect = document.createElement("div");
      connect.className = "connect-block";
      renderConnect(connect, {
        ...(state.standing.credential ? { credential: state.standing.credential } : {}),
        ...(state.invalid ? { invalid: state.invalid } : {}),
        onConnect: connectTo,
        onDisconnect: () => {
          state.themes = [];
          state.payload = undefined;
          state.preview = undefined;
          send({ type: "disconnect" });
        },
      });
      paneRoot.append(connect);
      return;
    }

    case "pull": {
      renderPull(paneRoot, {
        themes: state.themes,
        ...(state.theme ? { chosen: state.theme } : {}),
        ...(state.standing.pinned ? { pinned: state.standing.pinned } : {}),
        ...(state.preview ? { preview: state.preview } : {}),
        busy: state.busy,
        onChoose: (slug) => {
          state.theme = slug;
          state.preview = undefined;
          paint();
        },
        onPreview: () => void previewPull(),
        onApply: () => void applyPull(),
      });
      return;
    }

    case "push": {
      const local = localReading();
      renderPush(paneRoot, {
        themes: state.themes,
        ...(state.theme ? { chosen: state.theme } : {}),
        anchor: state.anchor,
        ...(local ? { local } : {}),
        ...(state.pushOutcome ? { outcome: state.pushOutcome } : {}),
        busy: state.busy,
        onChoose: (slug) => {
          state.theme = slug;
          state.pushOutcome = undefined;
          state.payload = undefined;
          paint();
          void loadPayload(slug);
        },
        onAnchor: (hex) => {
          state.anchor = hex;
          state.pushOutcome = undefined;
          paint();
        },
        onPropose: () => void propose(),
      });
      return;
    }
  }
}

/** One pair, measured while a colour is being chosen. See `readAnchorLocally`. */
function localReading() {
  return state.payload ? readAnchorLocally(state.payload, state.anchor) : undefined;
}

function modeFor(collection: string): string {
  return state.collections.find((c) => c.name === collection)?.modes[0] ?? "";
}

function inspect(): void {
  if (!state.choice.collection || !state.choice.mode) return;
  send({
    type: "inspect",
    collection: state.choice.collection,
    mode: state.choice.mode,
    ...(state.choice.ground ? { ground: state.choice.ground } : {}),
    kind: state.choice.kind,
  });
}

/* ---------------------------------------------------------------- network */

function connectTo(rawOrigin: string, rawToken: string): void {
  const origin = readOrigin(rawOrigin);
  const token = readToken(rawToken);

  // Checked before a round trip, so a typo is a correction rather than a 404.
  state.invalid = !origin
    ? "That is not a console address. It should look like https://console.oxygenui.design."
    : !token
      ? "That is not a Figma key. They start oxy_live_ and are minted in the console."
      : undefined;

  if (state.invalid || !origin || !token) {
    paint();
    return;
  }
  send({ type: "connect", credential: { origin, token } });
}

async function loadThemes(): Promise<void> {
  const client = api();
  if (!client) return;

  state.busy = true;
  paint();
  const result = await client.themes();
  state.busy = false;

  if (!result.ok) {
    fail(result.error);
    return;
  }
  state.themes = result.value;
  state.theme ??= state.standing.pinned?.slug ?? state.themes[0]?.slug;
  if (state.theme) void loadPayload(state.theme);
  paint();
}

async function loadPayload(slug: string): Promise<void> {
  const client = api();
  if (!client) return;

  const result = await client.resolved(slug);
  if (!result.ok) {
    fail(result.error);
    return;
  }
  state.payload = result.value;
  state.anchor ||= result.value.ramp["600"] ?? "";
  paint();
}

async function previewPull(): Promise<void> {
  const client = api();
  if (!client || !state.theme) return;

  state.busy = true;
  state.preview = undefined;
  paint();

  const result = await client.resolved(state.theme);
  state.busy = false;
  if (!result.ok) {
    fail(result.error);
    return;
  }

  state.payload = result.value;
  send({ type: "preview", payload: result.value });
}

async function applyPull(): Promise<void> {
  if (!state.payload) return;
  state.busy = true;
  paint();
  send({ type: "apply", payload: state.payload });
}

async function propose(): Promise<void> {
  const client = api();
  if (!client || !state.theme) return;

  state.busy = true;
  state.pushOutcome = undefined;
  paint();

  const result = await client.propose(state.theme, state.anchor.trim());
  state.busy = false;
  state.pushOutcome = result.ok
    ? { url: result.value.url, steps: result.value.steps }
    : { error: result.error, ...(result.detail ? { detail: result.detail } : {}) };
  paint();
}

function fail(message: string): void {
  if (!reportRoot) return;
  reportRoot.hidden = false;
  reportRoot.textContent = "";
  const note = document.createElement("p");
  note.className = "finding";
  note.setAttribute("role", "alert");
  note.textContent = message;
  reportRoot.append(note);
}

/* --------------------------------------------------------------- messages */

window.onmessage = (event: MessageEvent) => {
  const message = readUiMessage(event.data);
  if (!message) return;

  switch (message.type) {
    case "collections": {
      state.collections = message.collections;
      const first = state.collections[0];
      if (first && !state.choice.collection) {
        state.choice = { collection: first.name, mode: first.modes[0] ?? "", kind: "text" };
      }
      paint();
      inspect();
      return;
    }

    case "standing": {
      state.standing = message.standing;
      state.invalid = undefined;
      if (state.standing.credential && state.themes.length === 0) void loadThemes();
      paint();
      return;
    }

    case "report": {
      if (message.report.mode === "palette") state.grounds = message.report.unstamped;
      if (reportRoot && state.pane === "check") renderReport(reportRoot, message.report);
      return;
    }

    case "preview": {
      state.busy = false;
      state.preview = message.preview;
      paint();
      return;
    }

    case "applied": {
      state.busy = false;
      state.preview = undefined;
      paint();
      return;
    }

    case "error": {
      state.busy = false;
      fail(message.message);
      return;
    }
  }
};

if (reportRoot) wireCopy(reportRoot);
send({ type: "ready" });
