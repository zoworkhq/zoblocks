/**
 * The panel half. DOM, and no `figma` API.
 *
 * Everything with a rule in it lives elsewhere — `gate.ts` decides what a
 * reading is, `render.ts` decides what it looks like, `controls.ts` decides
 * what a designer can choose. What is left here is the wiring across
 * `postMessage`, which is the one thing that cannot be unit-tested and is
 * therefore the one thing worth keeping this short.
 */

import type { CollectionSummary, FromUi } from "../protocol";
import { readUiMessage } from "../protocol";
import { renderControls, type Choice } from "./controls";
import { renderReport } from "./render";
import { wireCopy } from "./copy";

const controlsRoot = document.getElementById("controls");
const reportRoot = document.getElementById("report");

let collections: CollectionSummary[] = [];
let choice: Choice = { collection: "", mode: "", kind: "text" };
/** Ground names, learned from the last report rather than asked for twice. */
let grounds: string[] = [];

function send(message: FromUi): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

function inspect(): void {
  if (!choice.collection || !choice.mode) return;
  send({
    type: "inspect",
    collection: choice.collection,
    mode: choice.mode,
    ...(choice.ground ? { ground: choice.ground } : {}),
    kind: choice.kind,
  });
}

function drawControls(): void {
  if (!controlsRoot) return;
  renderControls(controlsRoot, {
    collections,
    grounds,
    value: choice,
    onChange: (next) => {
      /*
       * Changing the collection drops the ground.
       *
       * A ground is a variable name, and a name from the previous collection is
       * not in this one — keeping it would silently fall back to the default
       * and show a reading against a colour the designer did not choose.
       */
      const changedCollection = next.collection !== choice.collection;
      choice = changedCollection ? { ...next, ...{ ground: undefined } } : next;
      if (changedCollection) choice.mode = modeFor(next.collection);
      drawControls();
      inspect();
    },
  });
}

function modeFor(collection: string): string {
  const found = collections.find((c) => c.name === collection);
  return found?.modes[0] ?? "";
}

window.onmessage = (event: MessageEvent) => {
  const message = readUiMessage(event.data);
  if (!message || !reportRoot) return;

  switch (message.type) {
    case "collections": {
      collections = message.collections;
      const first = collections[0];
      if (first) choice = { collection: first.name, mode: first.modes[0] ?? "", kind: "text" };
      drawControls();
      inspect();
      return;
    }
    case "report": {
      // The palette reading names every colour it saw; that list is what the
      // ground picker offers, so the two can never disagree about what is in
      // the collection.
      if (message.report.mode === "palette") {
        grounds = message.report.unstamped;
        if (!choice.ground) drawControls();
      }
      renderReport(reportRoot, message.report);
      return;
    }
    case "error": {
      reportRoot.textContent = "";
      const note = document.createElement("p");
      note.className = "finding";
      note.textContent = message.message;
      reportRoot.append(note);
      return;
    }
  }
};

if (reportRoot) wireCopy(reportRoot);
send({ type: "ready" });
