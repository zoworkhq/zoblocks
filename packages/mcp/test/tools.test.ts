/**
 * The answers, asserted against the real catalog.
 *
 * Every test here reads the manifest `pnpm gen` wrote — the same file the
 * server bundles — so a question is checked against the components that
 * actually exist, not a fixture that agrees with the code by construction.
 * Where the docs page states the same thing (the stylesheet lines, the
 * Pages Router setup), the answer is checked against that statement too.
 */

import { describe, expect, it } from "vitest";
import { readSnapshot } from "../src/manifest.js";
import {
  NotFound,
  getComponent,
  getComponentExamples,
  getConventions,
  getFrameworkRules,
  getInstallation,
  listComponents,
  searchComponents,
} from "../src/tools.js";

const manifest = readSnapshot();
const names = (results: Array<{ name: string }>) => results.map((r) => r.name);

describe("search_components", () => {
  it.each([
    ["toggle", "switch"],
    ["lab result", "result-value"],
    ["Observation", "result-value"],
    ["patient banner", "identity"],
    ["progress bar", "infusion-loader"],
    ["command palette", "chart-command-palette"],
  ])("finds %s → %s", (query, expected) => {
    expect(names(searchComponents(manifest, query).results).slice(0, 3)).toContain(expected);
  });

  it("finds every loader for 'spinner'", () => {
    const found = names(searchComponents(manifest, "spinner", 10).results);
    for (const loader of ["pulse-loader", "rhythm-loader", "breath-loader", "helix-loader"]) {
      expect(found).toContain(loader);
    }
  });

  it("says plainly that there is no Button, even when some components mention one", () => {
    const answer = searchComponents(manifest, "button");
    expect(answer.note).toMatch(/No ZoBlocks component is a "button"/);
    expect(answer.note).toMatch(/no ZoBlocks Button/);
    for (const result of answer.results) {
      expect(result.matched.some((m) => m.startsWith("name:") || m.startsWith("alias:"))).toBe(
        false,
      );
    }
  });

  it("says so when nothing matches at all", () => {
    const answer = searchComponents(manifest, "modal");
    expect(answer.results).toEqual([]);
    expect(answer.note).toMatch(/No ZoBlocks component matches "modal"/);
  });

  it("adds no note when a component is the thing asked for", () => {
    expect(searchComponents(manifest, "toggle")).not.toHaveProperty("note");
  });
});

describe("get_component", () => {
  it.each(["result-value", "ResultValue", "Result Value", "@/components/zoblocks/result-value"])(
    "resolves %s",
    (name) => {
      expect(getComponent(manifest, name).name).toBe("result-value");
    },
  );

  it("resolves an alias", () => {
    expect(getComponent(manifest, "toggle").name).toBe("switch");
  });

  it("returns exactly the extracted props, for every export", () => {
    const answer = getComponent(manifest, "switch");
    const source = manifest.components.find((c) => c.name === "switch")!;
    expect(answer.exports).toEqual(source.exports.map((e) => ({ name: e.name, props: e.props })));
    expect(answer.exports!.length).toBeGreaterThan(0);
  });

  it("limits the answer to the sections asked for", () => {
    const answer = getComponent(manifest, "switch", ["props"]);
    expect(answer.exports).toBeDefined();
    expect(answer).not.toHaveProperty("guidance");
    expect(answer).not.toHaveProperty("accessibility");
  });

  it("answers a misspelling with the real name, not a bare miss", () => {
    try {
      getComponent(manifest, "swtich");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(NotFound);
      expect((error as NotFound).suggestions).toContain("switch");
    }
  });

  it("refuses an invented component, and says what ZoBlocks does not ship", () => {
    expect(() => getComponent(manifest, "button")).toThrow(/no ZoBlocks Button/);
  });

  it("gives an announced component no install command", () => {
    const answer = getComponent(manifest, "identity");
    expect(answer.availability).toBe("announced");
    expect(answer.install).toBeNull();
  });
});

describe("get_component_examples", () => {
  it("returns the usage and every named example", () => {
    const answer = getComponentExamples(manifest, "result-value");
    expect(answer.usage).toContain("@/components/zoblocks/result-value");
    expect(answer.examples.length).toBeGreaterThan(1);
  });

  it("narrows to one example by id", () => {
    const first = manifest.components.find((c) => c.name === "result-value")!.examples![0]!;
    expect(getComponentExamples(manifest, "result-value", first.id).examples).toEqual([first]);
  });

  it("rejects an unknown example id and lists the real ones", () => {
    expect(() => getComponentExamples(manifest, "result-value", "nope")).toThrow(/Its examples:/);
  });

  it("still gives usage for a component with no named examples", () => {
    const answer = getComponentExamples(manifest, "switch");
    expect(answer.usage.length).toBeGreaterThan(0);
  });
});

describe("list_components", () => {
  it("lists the whole catalog by default", () => {
    expect(listComponents(manifest, {}).components).toHaveLength(manifest.components.length);
  });

  it("filters by layer", () => {
    const answer = listComponents(manifest, { layer: "clinical" });
    expect(answer.components.length).toBeGreaterThan(0);
    expect(answer.components.every((c) => c.layer === "clinical")).toBe(true);
  });

  it("filters by category, whatever its case", () => {
    const answer = listComponents(manifest, { category: "loaders" });
    expect(answer.components.length).toBeGreaterThan(3);
    expect(answer.components.every((c) => c.name.endsWith("-loader"))).toBe(true);
  });

  it("outside React, lists only the web components, with their modules", () => {
    const answer = listComponents(manifest, { framework: "vue" });
    expect(names(answer.components).sort()).toEqual(
      manifest.integration.webComponents.elements.map((e) => e.replace(/^zb-/, "")).sort(),
    );
    expect(answer.components).toContainEqual(
      expect.objectContaining({ name: "pulse-loader", module: "@zoblocks/loaders/pulse" }),
    );
    expect(answer.components).toContainEqual(
      expect.objectContaining({ name: "switch", module: "@zoblocks/elements/switch" }),
    );
  });
});

describe("get_installation", () => {
  /** The /docs page's stylesheet, minus the Tailwind import and the comment. */
  const docsLines = (framework: "next-app" | "next-pages" | "vite") =>
    manifest.integration.globalStylesheet[framework].code
      .split("\n")
      .filter(
        (line) =>
          line.startsWith('@import "./') ||
          line.startsWith('@import "../') ||
          line.startsWith("@source"),
      );

  it.each(["next-app", "next-pages", "vite"] as const)(
    "writes the same stylesheet lines as the /docs page for the Pulse Loader (%s)",
    (framework) => {
      const answer = getInstallation(manifest, { components: ["pulse-loader"], framework });
      expect(answer.cssLines).toEqual(docsLines(framework));
    },
  );

  it("renders the commands for the package manager", () => {
    const answer = getInstallation(manifest, {
      components: ["switch", "result-value"],
      framework: "next-app",
      packageManager: "pnpm",
    });
    expect(answer.commands).toEqual([
      "pnpm dlx @zoblocks/cli init",
      "pnpm dlx @zoblocks/cli add switch result-value --yes",
    ]);
    expect(answer.filesWritten).toContain("src/components/zoblocks/switch.tsx");
    expect(answer.filesWritten).toContain("src/styles/zoblocks-clinical-status.css");
    expect(answer.cssLines![0]).toBe('@import "../styles/zoblocks-tokens.css";');
    expect(answer.npmDependencies).toEqual(["clsx", "tailwind-merge"]);
  });

  it("falls back to npm for a package manager it does not know", () => {
    const answer = getInstallation(manifest, {
      components: ["switch"],
      framework: "vite",
      packageManager: "pip",
    });
    expect(answer.commands[0]).toBe("npx @zoblocks/cli init");
  });

  it("installs an npm-package component with its stylesheet, and antd when it wraps antd", () => {
    const answer = getInstallation(manifest, { components: ["signature"], framework: "vite" });
    expect(answer.commands).toEqual(["npm install @zoblocks/signature antd"]);
    expect(answer.packageImports).toEqual(['import "@zoblocks/signature/styles.css";']);
  });

  it("outside React, installs the web components and names what is not available", () => {
    const answer = getInstallation(manifest, {
      components: ["pulse-loader", "result-value"],
      framework: "svelte",
      packageManager: "bun",
    });
    expect(answer.commands).toEqual(["bun add @zoblocks/loaders @zoblocks/elements"]);
    expect(answer.imports).toEqual(['import "@zoblocks/loaders/pulse";']);
    expect(answer.unavailable).toEqual(["result-value"]);
  });

  it("says an announced component has nothing to install", () => {
    const answer = getInstallation(manifest, { components: ["identity"], framework: "next-app" });
    expect(answer.commands).toEqual([]);
    expect(answer.notes.join(" ")).toMatch(/Announced.*identity/);
  });

  it("rejects an unknown component", () => {
    expect(() =>
      getInstallation(manifest, { components: ["button"], framework: "next-app" }),
    ).toThrow(NotFound);
  });
});

describe("get_framework_rules", () => {
  it("gives the Pages Router antd setup with transpilePackages — the line the guides omit", () => {
    const answer = getFrameworkRules(manifest, { framework: "next-pages", style: "antd" });
    const files = (answer.style as { files: Array<{ file: string; code: string }> }).files;
    expect(files.map((f) => f.file)).toEqual([
      "next.config.ts",
      "src/pages/_document.tsx",
      "src/pages/_app.tsx",
    ]);
    expect(files[0]!.code).toContain("transpilePackages");
  });

  it("includes Server Component rules on the App Router only", () => {
    expect(getFrameworkRules(manifest, { framework: "next-app" })).toHaveProperty(
      "serverComponents",
    );
    expect(getFrameworkRules(manifest, { framework: "next-pages" })).not.toHaveProperty(
      "serverComponents",
    );
  });

  it("gives Vite its alias in vite.config.ts", () => {
    const answer = getFrameworkRules(manifest, { framework: "vite" });
    expect((answer.alias as Array<{ file: string }>)[0]!.file).toBe("vite.config.ts");
  });

  it("outside React, gives the web-component setup and says the bridges do not apply", () => {
    const answer = getFrameworkRules(manifest, { framework: "angular", style: "mui" });
    expect(answer).toHaveProperty("setup");
    expect(answer.note).toMatch(/React-only/);
  });
});

describe("get_conventions", () => {
  it("states the rules, the scope, and the clinical colours", () => {
    const answer = getConventions(manifest);
    expect(answer.rules).toEqual([...manifest.rules, manifest.integration.clinicalColoursNote]);
    expect(answer.scope).toMatch(/no ZoBlocks Button/);
    expect(answer.lintRules.rules.length).toBeGreaterThan(10);
    expect(answer.catalog.contentHash).toBe(manifest.contentHash);
  });
});
