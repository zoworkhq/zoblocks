/**
 * A Figma file, in memory, that records what was written to it.
 *
 * The counters are the point. "Pulling twice writes nothing the second time" is
 * a claim about writes, not about the values afterwards — a run that sets every
 * variable to the value it already had reaches the same end state and churns
 * the version history a designer opened to see what changed. Only a fake that
 * counts calls can tell those apart.
 */

import type {
  FigmaClientStorage,
  FigmaMode,
  FigmaVariableValue,
  FigmaWritableCollection,
  FigmaWritableVariable,
  FigmaWriteApi,
} from "../src/sandbox/api";

export interface Writes {
  createdCollections: string[];
  createdVariables: string[];
  addedModes: string[];
  renamedModes: string[];
  values: number;
  pluginData: number;
  descriptions: number;
  renames: number;
}

export class FakeFigma {
  readonly writes: Writes = {
    createdCollections: [],
    createdVariables: [],
    addedModes: [],
    renamedModes: [],
    values: 0,
    pluginData: 0,
    descriptions: 0,
    renames: 0,
  };

  readonly clientStorage: FigmaClientStorage;

  private readonly collections: FigmaWritableCollection[] = [];
  private readonly vars: FigmaWritableVariable[] = [];
  private readonly store = new Map<string, unknown>();
  private next = 0;

  constructor() {
    this.clientStorage = {
      getAsync: (key) => Promise.resolve(this.store.get(key)),
      setAsync: (key, value) => {
        this.store.set(key, value);
        return Promise.resolve();
      },
      deleteAsync: (key) => {
        this.store.delete(key);
        return Promise.resolve();
      },
    };
  }

  private id(): string {
    this.next += 1;
    return `id-${this.next}`;
  }

  /** Reset the counters without resetting the file, to measure a second run. */
  settle(): void {
    this.writes.createdCollections = [];
    this.writes.createdVariables = [];
    this.writes.addedModes = [];
    this.writes.renamedModes = [];
    this.writes.values = 0;
    this.writes.pluginData = 0;
    this.writes.descriptions = 0;
    this.writes.renames = 0;
  }

  get total(): number {
    const w = this.writes;
    return (
      w.createdCollections.length +
      w.createdVariables.length +
      w.addedModes.length +
      w.renamedModes.length +
      w.values +
      w.pluginData +
      w.descriptions +
      w.renames
    );
  }

  variable(token: string): FigmaWritableVariable | undefined {
    return this.vars.find((v) => v.getPluginData("ox.token") === token);
  }

  collection(name: string): FigmaWritableCollection | undefined {
    return this.collections.find((c) => c.name === name);
  }

  /** A collection this plugin did not create, to test finding rather than making. */
  seedCollection(name: string, modes: string[]): FigmaWritableCollection {
    const collection = this.makeCollection(name, modes);
    this.writes.createdCollections.pop();
    return collection;
  }

  private makeCollection(name: string, modes: string[]): FigmaWritableCollection {
    const writes = this.writes;
    const data = new Map<string, string>();
    const modeList: FigmaMode[] = modes.map((m) => ({ modeId: this.id(), name: m }));

    const collection: FigmaWritableCollection = {
      id: this.id(),
      name,
      modes: modeList,
      addMode: (mode) => {
        writes.addedModes.push(`${name}/${mode}`);
        return this.id();
      },
      renameMode: (_modeId, mode) => {
        writes.renamedModes.push(`${name}/${mode}`);
      },
      setPluginData: (key, value) => {
        writes.pluginData += 1;
        data.set(key, value);
      },
      getPluginData: (key) => data.get(key) ?? "",
    };

    writes.createdCollections.push(name);
    this.collections.push(collection);
    return collection;
  }

  /** A variable already in the file, as if a previous pull had made it. */
  seedVariable(
    token: string,
    name: string,
    collection: FigmaWritableCollection,
    values: Record<string, FigmaVariableValue>,
    options: { description?: string; locked?: string } = {},
  ): FigmaWritableVariable {
    const variable = this.makeVariable(name, collection);
    this.writes.createdVariables.pop();
    variable.setPluginData("ox.token", token);
    if (options.locked) variable.setPluginData("ox.locked", options.locked);
    if (options.description !== undefined) variable.description = options.description;
    for (const [modeName, value] of Object.entries(values)) {
      const modeId = collection.modes.find((m) => m.name === modeName)?.modeId;
      if (modeId) variable.setValueForMode(modeId, value);
    }
    this.settle();
    return variable;
  }

  private makeVariable(name: string, collection: FigmaWritableCollection): FigmaWritableVariable {
    const writes = this.writes;
    const data = new Map<string, string>();
    let description = "";
    let label = name;

    const variable: FigmaWritableVariable = {
      id: this.id(),
      resolvedType: "COLOR",
      variableCollectionId: collection.id,
      valuesByMode: {},
      get name() {
        return label;
      },
      set name(next: string) {
        if (next !== label) writes.renames += 1;
        label = next;
      },
      get description() {
        return description;
      },
      set description(next: string) {
        if (next !== description) writes.descriptions += 1;
        description = next;
      },
      setValueForMode: (modeId, value) => {
        writes.values += 1;
        variable.valuesByMode[modeId] = value;
      },
      setPluginData: (key, value) => {
        writes.pluginData += 1;
        data.set(key, value);
      },
      getPluginData: (key) => data.get(key) ?? "",
    };

    writes.createdVariables.push(name);
    this.vars.push(variable);
    return variable;
  }

  api(): FigmaWriteApi {
    return {
      clientStorage: this.clientStorage,
      variables: {
        getLocalVariableCollectionsAsync: () => Promise.resolve([...this.collections]),
        getLocalVariablesAsync: () => Promise.resolve([...this.vars]),
        getVariableByIdAsync: (id) => Promise.resolve(this.vars.find((v) => v.id === id) ?? null),
        getVariableCollectionByIdAsync: (id) =>
          Promise.resolve(this.collections.find((c) => c.id === id) ?? null),
        createVariableCollection: (name) => this.makeCollection(name, ["Mode 1"]),
        createVariable: (name, collection) => this.makeVariable(name, collection),
      },
    };
  }
}
