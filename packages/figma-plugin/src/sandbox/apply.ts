/**
 * Applying a pull. The only code in this plugin that changes a file.
 *
 * It takes a diff it did not compute and writes exactly that. There is no
 * branch here that decides a variable should change — `previewPull` decided,
 * the designer agreed, and this walks the list. That separation is what makes
 * "preview first" true rather than a claim about intent.
 *
 * Three properties it has to get right, and each fails silently:
 *
 *   - **Order.** A semantic variable aliasing `--ox-ref-brand-700` cannot be
 *     written before that variable exists, so the brand tier goes first and the
 *     alias resolves a name to an id at the moment of writing.
 *   - **Identity.** Every variable is stamped with its Oxygen token, and an
 *     existing one is found by that stamp. Matching on the label would create a
 *     duplicate the first time somebody tidies a collection.
 *   - **Nothing is deleted.** Orphans were listed in the preview and are left
 *     alone. `api.ts` has no `remove` at all, so this is structural.
 */

import type { PlannedValue, PlannedVariable, ThemeName } from "@oxygenui-design/figma-core";

import { PIN, applyOrder, modesFor } from "../pull";
import { TIER_KEY, TOKEN_KEY, LOCKED_KEY } from "./read";
import type {
  FigmaVariableValue,
  FigmaWritableCollection,
  FigmaWritableVariable,
  FigmaWriteApi,
} from "./api";

export interface ApplyPlan {
  /**
   * Only what the diff said changed — never the whole plan.
   *
   * Writing every variable would be simpler and would be idempotent in the
   * sense that matters least: the values would end up identical, and Figma's
   * version history would record three hundred writes every time somebody
   * pressed the button. A designer opens history to see what changed, and a
   * sync that churns it has taken that away to save a comparison.
   */
  write: PlannedVariable[];
  /** Stamped on each collection so the panel can say what the file is on. */
  pin: { slug: string; version: number };
}

export interface ApplyResult {
  created: number;
  updated: number;
  /** Named, because these are the ones that undid somebody's edit. */
  restored: string[];
}

export async function applyPull(figma: FigmaWriteApi, plan: ApplyPlan): Promise<ApplyResult> {
  const collections = await collectionIndex(figma);
  const existing = await variableIndex(figma);

  const result: ApplyResult = { created: 0, updated: 0, restored: [] };
  /** Token → Figma id, for the aliases written after their targets. */
  const ids = new Map<string, string>();
  for (const [token, variable] of existing) ids.set(token, variable.id);

  for (const planned of applyOrder(plan.write)) {
    const collection = await ensureCollection(figma, collections, planned.collection);
    const found = existing.get(planned.token);

    const variable = found ?? figma.variables.createVariable(planned.name, collection, "COLOR");
    if (found) {
      result.updated += 1;
      // The label is the designer's until it drifts from the plan; restoring it
      // is what keeps a collection navigable, and it is an update rather than a
      // second variable because the identity came from plugin data.
      if (variable.name !== planned.name) variable.name = planned.name;
    } else {
      result.created += 1;
      existing.set(planned.token, variable);
    }
    ids.set(planned.token, variable.id);

    // Re-stamped only when it is not already right, for the same reason the pin
    // is: identity that has not moved is not a change.
    stamp(variable, TOKEN_KEY, planned.token);
    stamp(variable, TIER_KEY, planned.tier);
    stamp(variable, LOCKED_KEY, planned.locked ?? "");

    /*
     * The reason a clinical variable cannot be edited, in Figma's own field.
     *
     * A designer who changes one and finds it restored needs the explanation
     * where they are, not in a changelog. Figma shows a variable's description
     * in the panel beside it, which is the only place they will be looking.
     */
    const description = planned.locked ?? planned.description ?? "";
    if (variable.description !== description) variable.description = description;
    if (found && planned.locked) result.restored.push(planned.name);

    for (const [mode, value] of Object.entries(planned.values)) {
      const modeId = modeIdFor(collection, mode);
      if (!modeId || !value) continue;
      const resolved = toFigmaValue(value, ids);
      if (resolved !== undefined) variable.setValueForMode(modeId, resolved);
    }
    /*
     * Collections a variable needs are created even when nothing in them
     * changed, because `ensureCollection` runs per variable. That is deliberate:
     * a file where somebody deleted the Brand collection but kept the semantic
     * one should get it back on the next pull, and finding out at alias-
     * resolution time would leave half a write applied.
     */
  }

  /*
   * Pinned last, and only where it differs.
   *
   * Last, so a run that throws halfway leaves the file honestly unpinned rather
   * than claiming a version it does not hold. Only where it differs, because
   * plugin data is a write like any other and re-stamping an unchanged pin
   * would put a second pull in the file's history with nothing in it.
   */
  const version = String(plan.pin.version);
  for (const collection of collections.values()) {
    if (collection.getPluginData(PIN.theme) !== plan.pin.slug) {
      collection.setPluginData(PIN.theme, plan.pin.slug);
    }
    if (collection.getPluginData(PIN.version) !== version) {
      collection.setPluginData(PIN.version, version);
    }
  }

  return result;
}

async function collectionIndex(
  figma: FigmaWriteApi,
): Promise<Map<string, FigmaWritableCollection>> {
  const out = new Map<string, FigmaWritableCollection>();
  for (const summary of await figma.variables.getLocalVariableCollectionsAsync()) {
    const full = await figma.variables.getVariableCollectionByIdAsync(summary.id);
    if (full) out.set(full.name, full);
  }
  return out;
}

/**
 * Keyed by the Oxygen token, and only for variables that carry one.
 *
 * A file with a hand-made variable called `accent` is not a file where somebody
 * already pulled; treating it as one would silently take ownership of a swatch
 * this plugin did not create.
 */
async function variableIndex(figma: FigmaWriteApi): Promise<Map<string, FigmaWritableVariable>> {
  const out = new Map<string, FigmaWritableVariable>();
  for (const summary of await figma.variables.getLocalVariablesAsync("COLOR")) {
    const token = summary.getPluginData(TOKEN_KEY);
    if (!token) continue;
    const full = await figma.variables.getVariableByIdAsync(summary.id);
    if (full) out.set(token, full);
  }
  return out;
}

async function ensureCollection(
  figma: FigmaWriteApi,
  index: Map<string, FigmaWritableCollection>,
  name: string,
): Promise<FigmaWritableCollection> {
  const found = index.get(name);
  const collection = found ?? figma.variables.createVariableCollection(name);
  if (!found) index.set(name, collection);

  /*
   * A new collection arrives with one mode, already named something Figma
   * chose. Renaming it rather than adding a fourth is what stops every pull
   * leaving a "Mode 1" nobody uses beside three that are used.
   */
  const wanted = modesFor(name);
  const [first, ...rest] = wanted;
  if (first && collection.modes[0] && collection.modes[0].name !== first) {
    const present = collection.modes.some((m) => m.name === first);
    if (!present) {
      collection.renameMode(collection.modes[0].modeId, first);
      collection.modes[0].name = first;
    }
  }
  for (const mode of rest) {
    if (collection.modes.some((m) => m.name === mode)) continue;
    const modeId = collection.addMode(mode);
    collection.modes.push({ modeId, name: mode });
  }
  return collection;
}

function modeIdFor(collection: FigmaWritableCollection, mode: string): string | undefined {
  const wanted = mode === "default" ? modesFor(collection.name)[0] : (mode as ThemeName);
  return collection.modes.find((m) => m.name === wanted)?.modeId;
}

/**
 * A planned value as something Figma accepts.
 *
 * An alias becomes a reference to the id its token now has — which is why the
 * brand tier is written first. A target that is somehow still missing yields
 * nothing rather than a colour, because writing the resolved hex instead would
 * silently flatten the tiering the plan went to trouble to express.
 */
function toFigmaValue(
  value: PlannedValue,
  ids: Map<string, string>,
): FigmaVariableValue | undefined {
  switch (value.kind) {
    case "color":
      return { r: value.rgb.r, g: value.rgb.g, b: value.rgb.b };
    case "alias": {
      const id = ids.get(value.token);
      return id ? { type: "VARIABLE_ALIAS", id } : undefined;
    }
    case "string":
      return value.value;
    case "number":
      return value.value;
  }
}

function stamp(variable: FigmaWritableVariable, key: string, value: string): void {
  if (variable.getPluginData(key) !== value) variable.setPluginData(key, value);
}

/** What this file was last pulled to, from any collection that carries it. */
export async function readPin(
  figma: FigmaWriteApi,
): Promise<{ slug: string; version: number } | undefined> {
  for (const summary of await figma.variables.getLocalVariableCollectionsAsync()) {
    const full = await figma.variables.getVariableCollectionByIdAsync(summary.id);
    if (!full) continue;
    const slug = full.getPluginData(PIN.theme);
    const version = Number(full.getPluginData(PIN.version));
    if (slug && Number.isInteger(version)) return { slug, version };
  }
  return undefined;
}
