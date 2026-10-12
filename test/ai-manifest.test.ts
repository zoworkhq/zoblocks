/**
 * The agent manifest (ADR 0017), checked against the things it claims to
 * restate.
 *
 * `gen --check` proves the manifest is what the generator would write today.
 * It cannot prove the generator is right. These tests do that by comparing
 * the manifest with independent sources: the registry payloads the CLI
 * actually installs from, the catalog the docs render, the integration data
 * the /docs page renders, and `llms.txt`. An agent told something different
 * from what `zoblocks add` does is the whole failure this exists to prevent.
 *
 * The manifest is gitignored build output, like `public/r/*.json`: CI runs
 * `pnpm gen` before the tests, and so must a local run.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BRIDGED_STYLES,
  CODING_RULES,
  REACT_FRAMEWORKS,
  WEB_COMPONENT_FRAMEWORKS,
  WEB_COMPONENTS,
} from "@zoblocks/component-meta";
import { CATALOG } from "../apps/docs/src/lib/generated/catalog";
import type { AiManifest } from "../scripts/gen/emit/ai-manifest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) => readFileSync(path.join(ROOT, relative), "utf8");

const MANIFEST_PATH = "apps/docs/public/ai/manifest.json";
const manifest = JSON.parse(read(MANIFEST_PATH)) as AiManifest;
const byName = new Map(manifest.components.map((c) => [c.name, c]));

/** A registry payload, as the CLI fetches it. */
interface RegistryItem {
  name: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: Array<{ target: string }>;
}

function payload(name: string): RegistryItem | undefined {
  const file = path.join(ROOT, "apps/docs/public/r", `${name}.json`);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as RegistryItem) : undefined;
}

/** What the CLI would write for `add <name>`, walked from the published payloads. */
function closureFromRegistry(name: string) {
  const files = new Set<string>();
  const deps = new Set<string>();
  const seen = new Set<string>();
  const visit = (item: string) => {
    if (seen.has(item)) return;
    seen.add(item);
    const doc = payload(item);
    if (!doc) throw new Error(`no registry payload for ${item}`);
    for (const dep of doc.registryDependencies ?? []) if (!dep.includes("/")) visit(dep);
    for (const file of doc.files) files.add(file.target);
    for (const dep of doc.dependencies ?? []) deps.add(dep);
  };
  visit(name);
  return { files: [...files].sort(), deps: [...deps].sort() };
}

const normalise = (text: string) => text.replace(/\s+/g, " ").trim();

describe("the agent manifest", () => {
  it("declares a schema version and a content hash", () => {
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.contentHash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("lists every free catalog component, and nothing from the Pro tier", () => {
    const free = CATALOG.filter((c) => c.tier === "free").map((c) => c.name);
    expect(manifest.components.map((c) => c.name).sort()).toEqual([...free].sort());
    expect(manifest.components.every((c) => c.tier === "free")).toBe(true);
  });

  it("carries props for every export, extracted from the types", () => {
    for (const component of manifest.components) {
      const docs = CATALOG.find((c) => c.name === component.name)!;
      expect(component.exports, component.name).toEqual(docs.exports);
    }
  });

  it("links a docs page only when one exists", () => {
    for (const component of manifest.components) {
      if (component.availability === "ready") {
        expect(component.docsUrl, component.name).toMatch(
          /^https:\/\/zoblocks\.design\/components\//,
        );
      } else {
        expect(component.docsUrl, component.name).toBeUndefined();
      }
    }
  });

  it("imports registry components from @/components/zoblocks and packages from npm", () => {
    for (const component of manifest.components) {
      expect(component.importFrom, component.name).toBe(
        component.distribution === "registry"
          ? `@/components/zoblocks/${component.name}`
          : component.packageName,
      );
    }
  });
});

describe("install closures match what the CLI installs", () => {
  const installable = manifest.components.filter((c) => c.installs);

  it("has installable components to check", () => {
    expect(installable.length).toBeGreaterThan(10);
  });

  it.each(installable.map((c) => c.name))("%s", (name) => {
    const component = byName.get(name)!;
    const fromRegistry = closureFromRegistry(name);

    expect(component.installs!.files).toEqual(fromRegistry.files);
    expect(component.installs!.npmDependencies).toEqual(fromRegistry.deps);

    // Every stylesheet the install writes, tokens first — every other sheet
    // reads the tokens, so an import order with them later renders unstyled.
    const sheets = fromRegistry.files.filter((f) => f.endsWith(".css"));
    expect([...component.installs!.stylesheets].sort()).toEqual(sheets.sort());
    if (sheets.length)
      expect(component.installs!.stylesheets[0]).toBe("styles/zoblocks-tokens.css");
  });

  it("gives an announced component nothing to install", () => {
    for (const component of manifest.components.filter((c) => c.availability === "announced")) {
      expect(component.installs, component.name).toBeUndefined();
    }
  });
});

describe("setup and rules are the /docs page's, not a copy", () => {
  it("covers every React framework for both bridged styles", () => {
    for (const style of Object.keys(BRIDGED_STYLES) as Array<keyof typeof BRIDGED_STYLES>) {
      for (const framework of REACT_FRAMEWORKS) {
        const setup = manifest.integration.styles[style].frameworks[framework];
        expect(setup.packages, `${style} ${framework}`).toMatch(/@zoblocks\/bridge-/);
        expect(setup.files.length, `${style} ${framework}`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the two findings the builds turned up", () => {
    // The Pages Router needs transpilePackages, or the bridge reads the
    // library's default theme; the MUI App Router theme needs "use client",
    // or `next build` fails. Both were found by building, not by reading.
    for (const style of ["antd", "mui"] as const) {
      const pages = manifest.integration.styles[style].frameworks["next-pages"];
      expect(pages.files.some((f) => f.code.includes("transpilePackages"))).toBe(true);
    }
    const muiTheme = manifest.integration.styles.mui.frameworks["next-app"].files[0]!;
    expect(muiTheme.code.startsWith('"use client";')).toBe(true);
  });

  it("offers every web-component framework, and only the loaders and the switch", () => {
    expect(Object.keys(manifest.integration.webComponents.frameworks).sort()).toEqual(
      [...WEB_COMPONENT_FRAMEWORKS].sort(),
    );
    expect(manifest.integration.webComponents.elements).toEqual(WEB_COMPONENTS.elements);
  });

  it("states the same rules as llms.txt", () => {
    const llms = normalise(read("apps/docs/public/llms.txt"));
    expect(manifest.rules).toEqual(CODING_RULES);
    for (const rule of manifest.rules) expect(llms).toContain(normalise(rule));
  });

  it("describes every lint rule it names", () => {
    expect(manifest.lintRules.length).toBeGreaterThan(10);
    for (const rule of manifest.lintRules) {
      expect(rule.id).toMatch(/^@zoblocks\/[a-z-]+$/);
      expect(rule.description.length, rule.id).toBeGreaterThan(20);
    }
  });
});

describe("the skill's reference files", () => {
  const components = read("skills/zoblocks/references/components.md");
  const frameworks = read("skills/zoblocks/references/frameworks.md");
  const conventions = read("skills/zoblocks/references/conventions.md");

  it("list every component in the manifest", () => {
    for (const component of manifest.components) {
      expect(components, component.name).toContain(`(\`${component.name}\`)`);
    }
  });

  it("carry every setup file the manifest does", () => {
    for (const style of Object.values(manifest.integration.styles)) {
      if (!("frameworks" in style)) continue;
      for (const setup of Object.values(style.frameworks)) {
        for (const file of setup.files) expect(frameworks).toContain(file.code);
      }
    }
  });

  it("carry every rule", () => {
    for (const rule of manifest.rules) expect(conventions).toContain(rule);
    for (const rule of manifest.lintRules) expect(conventions).toContain(rule.id);
  });

  it("contain no machine-specific path", () => {
    for (const text of [components, frameworks, conventions, read(MANIFEST_PATH)]) {
      expect(text).not.toMatch(/\/(?:Users|home|private|var\/folders)\//);
    }
  });
});
