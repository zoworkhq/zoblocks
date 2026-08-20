/**
 * The report, as a panel.
 *
 * Split from the entry point because everything here is a pure function of a
 * `GateReport` and can be asserted in jsdom — which is the only way any of this
 * gets tested, since the real panel lives in an iframe inside somebody else's
 * canvas.
 *
 * The vocabulary is the console's, deliberately: the measured ratio, the floor
 * it is held to, and the criterion that imposes the floor. A tick and a cross
 * would be smaller and would teach a designer nothing about why, or about what
 * would fix it.
 */

import type { GateReport, PairReading } from "../gate";

/** `4.5` reads as a floor; `4.50` reads as a measurement. Only one is. */
const ratio = (value: number) => `${value.toFixed(2)}:1`;

export function renderReport(root: HTMLElement, report: GateReport): void {
  root.textContent = "";
  root.append(summary(report));

  const failures = report.readings.filter((r) => !r.passes);
  const passes = report.readings.filter((r) => r.passes);

  if (report.readings.length === 0) {
    root.append(
      note(
        report.mode === "oxygen"
          ? "This collection carries Oxygen tokens, but none of the pairs the gate checks resolved to a colour in this mode."
          : "No colour variables in this collection.",
      ),
    );
  }

  for (const finding of report.findings) root.append(note(finding.message, "finding"));

  if (failures.length > 0) {
    root.append(table("Failing", failures));
  }
  if (passes.length > 0) {
    root.append(table("Passing", passes, failures.length > 0));
  }

  if (report.missing.length > 0) {
    root.append(
      details(
        `Not in this collection (${report.missing.length})`,
        report.missing,
        "A pair the gate checks that this file does not carry. Not a failure — but not a pass either, because nothing was measured.",
      ),
    );
  }

  if (report.mode === "oxygen" && report.unstamped.length > 0) {
    root.append(
      details(
        `Not Oxygen tokens (${report.unstamped.length})`,
        report.unstamped,
        "Variables in this collection with no Oxygen identity. They are left alone.",
      ),
    );
  }
}

function summary(report: GateReport): HTMLElement {
  const failures = report.readings.filter((r) => !r.passes).length;
  const el = document.createElement("div");
  el.className = "summary";
  el.dataset.state = failures > 0 ? "fail" : "pass";

  const count = document.createElement("p");
  count.className = "count";
  count.textContent =
    report.readings.length === 0
      ? "Nothing measured"
      : failures === 0
        ? `All ${report.readings.length} pairs pass`
        : `${failures} of ${report.readings.length} pairs fail`;

  const where = document.createElement("p");
  where.className = "where";
  where.textContent =
    report.mode === "oxygen"
      ? `${report.collection} · mode “${report.figmaMode}” · held to the ${report.theme} floors`
      : `${report.collection} · mode “${report.figmaMode}” · measured against one ground`;

  /*
   * The panel says which reading it gave.
   *
   * A designer who does not know their file carries no Oxygen stamps will read
   * a palette measurement as the real gate, and a passing palette measurement
   * is not the same claim as a passing theme. Stating the mode is what keeps
   * the number honest.
   */
  const how = document.createElement("p");
  how.className = "how";
  how.textContent =
    report.mode === "oxygen"
      ? "Measured against Oxygen’s own pair list — the same list the build and the publish gate enforce."
      : "No Oxygen tokens here, so the pairs are not known. Every colour is measured against the ground you choose.";

  el.append(count, where, how);
  return el;
}

function table(caption: string, rows: PairReading[], collapsed = false): HTMLElement {
  const wrap = document.createElement(collapsed ? "details" : "div");
  wrap.className = "group";

  if (wrap instanceof HTMLDetailsElement) {
    const label = document.createElement("summary");
    label.textContent = `${caption} (${rows.length})`;
    wrap.append(label);
  } else {
    const label = document.createElement("h2");
    label.textContent = `${caption} (${rows.length})`;
    wrap.append(label);
  }

  const scroll = document.createElement("div");
  scroll.className = "scroll";

  const el = document.createElement("table");
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of ["Pair", "Measured", "Floor", "Criterion", "Nearest passing"]) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = label;
    headRow.append(th);
  }
  head.append(headRow);
  el.append(head);

  const body = document.createElement("tbody");
  for (const row of rows) body.append(rowFor(row));
  el.append(body);
  scroll.append(el);
  wrap.append(scroll);
  return wrap;
}

function rowFor(reading: PairReading): HTMLElement {
  const tr = document.createElement("tr");
  tr.dataset.state = reading.passes ? "pass" : "fail";

  const pair = document.createElement("th");
  pair.scope = "row";
  pair.className = "pair";
  pair.append(swatch(reading.fgValue, reading.bgValue));

  const names = document.createElement("span");
  names.className = "names";
  const fg = document.createElement("code");
  fg.textContent = reading.fg;
  const on = document.createElement("span");
  on.className = "on";
  on.textContent = " on ";
  const bg = document.createElement("code");
  bg.textContent = reading.bg;
  names.append(fg, on, bg);
  pair.append(names);

  const measured = document.createElement("td");
  measured.className = "num";
  measured.textContent = ratio(reading.ratio);

  const floor = document.createElement("td");
  floor.className = "num";
  floor.textContent = ratio(reading.floor);

  const criterion = document.createElement("td");
  criterion.className = "criterion";
  criterion.textContent = reading.criterion;

  const fix = document.createElement("td");
  fix.className = "fix";
  if (reading.suggestion) fix.append(suggestion(reading.suggestion));
  else if (!reading.passes) {
    const none = document.createElement("span");
    none.className = "muted";
    none.textContent = "No shade of this colour clears the floor";
    fix.append(none);
  }

  tr.append(pair, measured, floor, criterion, fix);
  return tr;
}

/**
 * The pair, drawn.
 *
 * `aria-hidden`, because it repeats the two hex values that are already in the
 * row as text. A screen-reader user gets the names, the ratio, the floor and
 * the criterion; a sighted user additionally gets to see that the combination
 * is unreadable, which is faster than any of them.
 */
function swatch(fg: string, bg: string): HTMLElement {
  const el = document.createElement("span");
  el.className = "swatch";
  el.setAttribute("aria-hidden", "true");
  el.style.background = bg;
  el.style.color = fg;
  el.textContent = "Aa";
  return el;
}

/**
 * The suggestion is offered as a value, not applied.
 *
 * Phase 4 is where this plugin earns the right to write to a file, and it earns
 * it by previewing every change first. A button here that silently changed a
 * variable would spend that credibility to save one paste.
 */
function suggestion(hex: string): HTMLElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy";
  button.dataset.copy = hex;
  button.setAttribute("aria-label", `Copy ${hex}, the nearest passing shade`);

  const chip = document.createElement("span");
  chip.className = "chip";
  chip.setAttribute("aria-hidden", "true");
  chip.style.background = hex;

  const label = document.createElement("code");
  label.textContent = hex;

  const state = document.createElement("span");
  state.className = "copied";
  state.textContent = "Copied";

  button.append(chip, label, state);
  return button;
}

function note(message: string, kind = "note"): HTMLElement {
  const el = document.createElement("p");
  el.className = kind;
  el.textContent = message;
  return el;
}

function details(caption: string, items: string[], explanation: string): HTMLElement {
  const el = document.createElement("details");
  el.className = "group";
  const label = document.createElement("summary");
  label.textContent = caption;
  const why = document.createElement("p");
  why.className = "note";
  why.textContent = explanation;
  const list = document.createElement("ul");
  for (const item of items) {
    const li = document.createElement("li");
    const code = document.createElement("code");
    code.textContent = item;
    li.append(code);
    list.append(li);
  }
  el.append(label, why, list);
  return el;
}
