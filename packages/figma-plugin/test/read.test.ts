/**
 * The adapter, against a fake Figma.
 *
 * The fake exists because `api.ts` declares a structural interface rather than
 * importing `@figma/plugin-typings` — which is the entire reason this file can
 * exist at all. What is asserted here is the work the adapter actually does:
 * mode ids resolved to names, aliases kept as aliases, identity taken from
 * plugin data rather than from the label.
 */

import { describe, expect, it } from "vitest";

import { TOKEN_KEY, readFile } from "../src/sandbox/read";
import { rgb } from "./fixture";
import type {
  FigmaReadApi,
  FigmaVariable,
  FigmaVariableCollection,
  FigmaVariableValue,
} from "../src/sandbox/api";

interface Spec {
  id: string;
  name: string;
  collection: string;
  token?: string;
  values: Record<string, FigmaVariableValue>;
}

function fakeFigma(collections: FigmaVariableCollection[], specs: Spec[]): FigmaReadApi {
  const variables: FigmaVariable[] = specs.map((spec) => ({
    id: spec.id,
    name: spec.name,
    resolvedType: "COLOR",
    variableCollectionId: spec.collection,
    valuesByMode: spec.values,
    getPluginData: (key: string) => (key === TOKEN_KEY ? (spec.token ?? "") : ""),
  }));

  return {
    variables: {
      getLocalVariableCollectionsAsync: () => Promise.resolve(collections),
      getLocalVariablesAsync: () => Promise.resolve(variables),
    },
  };
}

const BRAND: FigmaVariableCollection = {
  id: "c1",
  name: "Oxygen / Brand",
  modes: [{ modeId: "m1", name: "Default" }],
};

const SEMANTIC: FigmaVariableCollection = {
  id: "c2",
  name: "Oxygen / Semantic",
  modes: [
    { modeId: "m2", name: "light" },
    { modeId: "m3", name: "dark" },
  ],
};

describe("readFile", () => {
  it("keys values by mode name, because ids mean nothing outside the file", async () => {
    const figma = fakeFigma(
      [SEMANTIC],
      [
        {
          id: "v1",
          name: "accent",
          collection: "c2",
          token: "--ox-accent",
          values: { m2: rgb("#1851a5"), m3: rgb("#5a94e7") },
        },
      ],
    );

    const { snapshot } = await readFile(figma);
    const accent = snapshot.variables[0]!;
    expect(accent.values.light).toMatchObject({ kind: "color", hex: "#1851a5" });
    expect(accent.values.dark).toMatchObject({ kind: "color", hex: "#5a94e7" });
  });

  it("takes identity from plugin data, never from the name", async () => {
    const figma = fakeFigma(
      [SEMANTIC],
      [
        {
          id: "v1",
          name: "Brand blue",
          collection: "c2",
          token: "--ox-accent",
          values: { m2: rgb("#1851a5") },
        },
        { id: "v2", name: "accent", collection: "c2", values: { m2: rgb("#ff00ff") } },
      ],
    );

    const { snapshot } = await readFile(figma);
    expect(snapshot.variables[0]!.token).toBe("--ox-accent");
    expect(snapshot.variables[0]!.name).toBe("Brand blue");
    // Named `accent` and claiming nothing. A gate that matched on labels would
    // have measured this magenta as the brand.
    expect(snapshot.variables[1]!.token).toBeUndefined();
  });

  it("keeps an alias as an alias, resolved to the token it points at", async () => {
    const figma = fakeFigma(
      [BRAND, SEMANTIC],
      [
        {
          id: "v1",
          name: "brand/700",
          collection: "c1",
          token: "--ox-ref-brand-700",
          values: { m1: rgb("#1851a5") },
        },
        {
          id: "v2",
          name: "accent",
          collection: "c2",
          token: "--ox-accent",
          values: { m2: { type: "VARIABLE_ALIAS", id: "v1" } },
        },
      ],
    );

    const { snapshot } = await readFile(figma);
    const accent = snapshot.variables.find((v) => v.token === "--ox-accent")!;
    expect(accent.values.light).toEqual({ kind: "alias", token: "--ox-ref-brand-700" });
  });

  it("drops an alias that points at nothing this file can see", async () => {
    const figma = fakeFigma(
      [SEMANTIC],
      [
        {
          id: "v2",
          name: "accent",
          collection: "c2",
          token: "--ox-accent",
          values: { m2: { type: "VARIABLE_ALIAS", id: "gone" } },
        },
      ],
    );

    const { snapshot } = await readFile(figma);
    // An alias to nothing is not a value, and inventing one would put a colour
    // in the report that the file does not contain.
    expect(snapshot.variables[0]!.values.light).toBeUndefined();
  });

  it("stores an unnamed mode under `default`", async () => {
    const figma = fakeFigma(
      [BRAND],
      [
        {
          id: "v1",
          name: "brand/600",
          collection: "c1",
          token: "--ox-ref-brand-600",
          values: { m1: rgb("#1d63c9") },
        },
      ],
    );

    const { snapshot } = await readFile(figma);
    expect(snapshot.variables[0]!.values.default).toMatchObject({ hex: "#1d63c9" });
  });

  it("skips a mode the collection does not declare", async () => {
    const figma = fakeFigma(
      [SEMANTIC],
      [
        {
          id: "v1",
          name: "accent",
          collection: "c2",
          values: { m2: rgb("#1851a5"), ghost: rgb("#000000") },
        },
      ],
    );

    const { snapshot } = await readFile(figma);
    expect(Object.keys(snapshot.variables[0]!.values)).toEqual(["light"]);
  });

  it("skips a variable whose collection is not local", async () => {
    const figma = fakeFigma(
      [SEMANTIC],
      [{ id: "v1", name: "remote", collection: "elsewhere", values: {} }],
    );
    const { snapshot } = await readFile(figma);
    expect(snapshot.variables).toEqual([]);
  });

  it("summarises each collection with the two counts the picker needs", async () => {
    const figma = fakeFigma(
      [BRAND, SEMANTIC],
      [
        {
          id: "v1",
          name: "brand/600",
          collection: "c1",
          token: "--ox-ref-brand-600",
          values: { m1: rgb("#1d63c9") },
        },
        {
          id: "v2",
          name: "accent",
          collection: "c2",
          token: "--ox-accent",
          values: { m2: rgb("#1851a5") },
        },
        { id: "v3", name: "Scratch", collection: "c2", values: { m2: rgb("#ff00ff") } },
      ],
    );

    const { collections } = await readFile(figma);
    expect(collections).toEqual([
      { id: "c1", name: "Oxygen / Brand", modes: ["Default"], stamped: 1, colours: 1 },
      { id: "c2", name: "Oxygen / Semantic", modes: ["light", "dark"], stamped: 1, colours: 2 },
    ]);
  });

  it("reports a collection with no variables rather than omitting it", async () => {
    const { collections } = await readFile(fakeFigma([BRAND], []));
    // A designer who selected an empty collection should be told it is empty,
    // not shown a picker that silently lacks the thing they clicked.
    expect(collections).toEqual([
      { id: "c1", name: "Oxygen / Brand", modes: ["Default"], stamped: 0, colours: 0 },
    ]);
  });
});

describe("values that are not colours", () => {
  it("keeps a string and a number, because a collection may hold either", async () => {
    const figma = fakeFigma(
      [BRAND],
      [
        { id: "v1", name: "family", collection: "c1", values: { m1: "Inter" } },
        { id: "v2", name: "radius", collection: "c1", values: { m1: 8 } },
        { id: "v3", name: "bold", collection: "c1", values: { m1: true } },
      ],
    );

    const { snapshot } = await readFile(figma);
    expect(snapshot.variables[0]!.values.default).toEqual({ kind: "string", value: "Inter" });
    expect(snapshot.variables[1]!.values.default).toEqual({ kind: "number", value: 8 });
    // A boolean is a Figma variable type this plugin has no reading for, and
    // inventing one would put it in a contrast table.
    expect(snapshot.variables[2]!.values.default).toBeUndefined();
  });
});
