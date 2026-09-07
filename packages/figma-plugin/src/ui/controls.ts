/**
 * The controls above the report, and the state they hold.
 *
 * Kept apart from `render.ts` because they are the half a keyboard has to be
 * able to operate. Everything here is a real form control with a real label —
 * a `<select>` rather than a listbox built out of divs, a `<fieldset>` of
 * radios rather than a segmented bar of buttons. A plugin panel is 320 pixels
 * wide inside somebody else's application, which is a reason to be economical
 * and not a reason to reimplement the browser's own widgets worse.
 */

import type { CollectionSummary } from "../protocol";
import type { PairKindName } from "../gate";

export interface Choice {
  collection: string;
  mode: string;
  ground?: string;
  kind: PairKindName;
}

export interface ControlsOptions {
  collections: CollectionSummary[];
  /** Colour variable names in the chosen collection, for the ground picker. */
  grounds: string[];
  value: Choice;
  onChange(choice: Choice): void;
}

export function renderControls(root: HTMLElement, options: ControlsOptions): void {
  root.textContent = "";

  const chosen =
    options.collections.find((c) => c.name === options.value.collection) ?? options.collections[0];

  if (!chosen) {
    const empty = document.createElement("p");
    empty.className = "note";
    empty.textContent =
      "This file has no local variable collections. Create one, or open a file that has some.";
    root.append(empty);
    return;
  }

  root.append(
    select({
      id: "collection",
      label: "Collection",
      value: chosen.name,
      options: options.collections.map((c) => ({
        value: c.name,
        // The counts are the reason a designer can tell why one collection gets
        // the real pair list and another gets a single ground.
        label: `${c.name} — ${c.colours} colours, ${c.stamped} Zoblocks`,
      })),
      onChange: (value) => options.onChange({ ...options.value, collection: value }),
    }),
  );

  root.append(
    select({
      id: "mode",
      label: "Mode",
      value: options.value.mode,
      options: chosen.modes.map((m) => ({ value: m, label: m })),
      onChange: (value) => options.onChange({ ...options.value, mode: value }),
    }),
  );

  // Only the palette reading needs a ground and a floor: with Zoblocks stamps,
  // the pair list already knows which colour is text and which rule applies.
  if (chosen.stamped === 0) {
    root.append(
      select({
        id: "ground",
        label: "Measure against",
        value: options.value.ground ?? options.grounds[0] ?? "",
        options: options.grounds.map((g) => ({ value: g, label: g })),
        onChange: (value) => options.onChange({ ...options.value, ground: value }),
      }),
    );
    root.append(
      kindField(options.value.kind, (kind) => options.onChange({ ...options.value, kind })),
    );
  }
}

interface SelectOptions {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange(value: string): void;
}

function select(options: SelectOptions): HTMLElement {
  const field = document.createElement("div");
  field.className = "field";

  const label = document.createElement("label");
  label.htmlFor = options.id;
  label.textContent = options.label;

  const el = document.createElement("select");
  el.id = options.id;
  for (const option of options.options) {
    const child = document.createElement("option");
    child.value = option.value;
    child.textContent = option.label;
    if (option.value === options.value) child.selected = true;
    el.append(child);
  }
  el.addEventListener("change", () => options.onChange(el.value));

  field.append(label, el);
  return field;
}

/**
 * Which WCAG floor to hold this palette to.
 *
 * Radios rather than a default, because there is no honest default: 4.5:1
 * governs readable text and 3:1 governs the components and graphics of SC
 * 1.4.11, and a tool that silently picked one would report a passing icon as a
 * failing one, or a failing label as a passing one. Text is preselected because
 * it is the stricter of the two, so the error is in the safe direction.
 */
function kindField(value: PairKindName, onChange: (kind: PairKindName) => void): HTMLElement {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "field kinds";

  const legend = document.createElement("legend");
  legend.textContent = "These colours are";
  fieldset.append(legend);

  const choices: { value: PairKindName; label: string; hint: string }[] = [
    { value: "text", label: "Text", hint: "4.5:1 — SC 1.4.3" },
    { value: "ui", label: "Interface", hint: "3:1 — SC 1.4.11" },
  ];

  for (const choice of choices) {
    const wrap = document.createElement("label");
    wrap.className = "radio";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "kind";
    input.value = choice.value;
    input.checked = choice.value === value;
    input.addEventListener("change", () => {
      if (input.checked) onChange(choice.value);
    });

    const text = document.createElement("span");
    text.textContent = choice.label;

    const hint = document.createElement("small");
    hint.textContent = choice.hint;

    wrap.append(input, text, hint);
    fieldset.append(wrap);
  }
  return fieldset;
}
