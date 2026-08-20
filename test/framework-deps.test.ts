/**
 * A package's declared UI-framework dependency must match what it imports.
 *
 * Four packages sit next to Ant Design and, until this test, all four described
 * that relationship differently — and one described it wrongly. `identity` was
 * documented in the README as *"Patient avatar, chip and banner for Ant Design.
 * antd is a peer"* while importing antd exactly nowhere, so a buyer reading the
 * package table installed a UI framework they did not need.
 *
 * ADR 0010 draws the line the declarations are checked against:
 *
 *   compatible — matches antd's API, imports nothing. No peer.
 *   wrapping   — imports antd for behaviour worth inheriting. Required peer.
 *   bridge     — imports antd only behind a subpath. Optional peer, so
 *                installing the package never drags a framework in.
 */

import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FRAMEWORKS = ["antd", "@mui/material"] as const;

interface Manifest {
  name: string;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  devDependencies?: Record<string, string>;
}

function manifest(pkg: string): Manifest {
  return JSON.parse(readFileSync(path.join(ROOT, "packages", pkg, "package.json"), "utf8"));
}

/**
 * Source files under `src/` with a real import of the framework.
 *
 * Parsed rather than grepped. Two files mention `from "antd"` in prose and
 * neither imports it: `switch.tsx` documents the migration diff
 * (`import { Switch } from "antd"` becomes ...), which is the ADR 0010 promise
 * written down, and the codemod names the specifier it rewrites. A text search
 * reports both as violations, which would make this test something to silence.
 */
function importers(pkg: string, framework: string): string[] {
  const dir = path.join(ROOT, "packages", pkg, "src");
  const files = execSync(
    `find ${JSON.stringify(dir)} -type f \\( -name '*.ts' -o -name '*.tsx' \\) 2>/dev/null || true`,
    { encoding: "utf8" },
  )
    .split("\n")
    .filter(Boolean);

  const spec = framework.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const statement = new RegExp(
    `^\\s*(?:import|export)\\b[^;]*?from\\s+["']${spec}(?:/[^"']*)?["']|` +
      `^\\s*import\\s+["']${spec}(?:/[^"']*)?["']|` +
      `\\bimport\\(\\s*["']${spec}(?:/[^"']*)?["']\\s*\\)`,
    "m",
  );

  return files
    .filter((f) => statement.test(stripComments(readFileSync(f, "utf8"))))
    .map((f) => path.relative(dir, f))
    .sort();
}

/** Block and line comments removed, so prose about a specifier is not an import. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** Every workspace package, so a new one cannot quietly opt out of this test. */
function packages(): string[] {
  return execSync("ls -d packages/*/ | xargs -n1 basename", { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
}

describe("declared framework dependencies match imports", () => {
  it.each(packages())("%s", (pkg) => {
    let json: Manifest;
    try {
      json = manifest(pkg);
    } catch {
      return; // not a package
    }

    for (const framework of FRAMEWORKS) {
      const files = importers(pkg, framework);
      const declared = Boolean(json.peerDependencies?.[framework]);

      if (files.length > 0) {
        expect(
          declared,
          `${json.name} imports ${framework} in ${files.join(", ")} but does not declare it as a peer dependency. A consumer's install would resolve it by luck.`,
        ).toBe(true);
      } else {
        expect(
          declared,
          `${json.name} declares ${framework} as a peer dependency and imports it nowhere. That tells a buyer to install a UI framework they do not need.`,
        ).toBe(false);
        expect(
          Boolean(json.devDependencies?.[framework]),
          `${json.name} carries ${framework} as a devDependency and imports it nowhere — including in its tests.`,
        ).toBe(false);
      }
    }
  });
});

describe("the bridge rule", () => {
  /**
   * A package whose only antd import is a bridge subpath must mark the peer
   * optional. Otherwise `pnpm add @oxygenui-design/tabs` warns about a missing
   * framework the consumer has no intention of using, and the "you never pay
   * for a bridge you did not ask for" claim is false at install time.
   */
  it("tabs imports antd only in its bridge, and marks the peer optional", () => {
    const files = importers("tabs", "antd");
    expect(files).toEqual(["antd.ts"]);
    expect(manifest("tabs").peerDependenciesMeta?.antd?.optional).toBe(true);
  });

  it("identity takes no antd dependency at all, as its metadata claims", () => {
    expect(importers("identity", "antd")).toEqual([]);
    const json = manifest("identity");
    expect(json.peerDependencies?.antd).toBeUndefined();
    expect(json.devDependencies?.antd).toBeUndefined();
  });

  /**
   * Signature and Copilot genuinely wrap antd — Modal's focus trap, Form's
   * control contract, Upload's file handling. ADR 0010 permits that for a
   * compound organism and requires the inherited behaviour to be named. The
   * peer is required rather than optional because the component does not
   * render without it.
   */
  it.each(["signature", "copilot"])("%s wraps antd and requires it", (pkg) => {
    expect(importers(pkg, "antd").length).toBeGreaterThan(0);
    const json = manifest(pkg);
    expect(json.peerDependencies?.antd).toBeDefined();
    expect(json.peerDependenciesMeta?.antd?.optional ?? false).toBe(false);
  });
});

describe("the README package table agrees with the packages", () => {
  it("does not describe an antd-free package as needing antd", () => {
    const readme = readFileSync(path.join(ROOT, "README.md"), "utf8");
    const rows = readme
      .split("\n")
      .filter((l) => l.startsWith("| `@oxygenui-design/") && /antd|Ant Design/.test(l));

    for (const row of rows) {
      const name = /`@oxygenui-design\/([a-z-]+)`/.exec(row)?.[1];
      if (!name) continue;
      let json: Manifest;
      try {
        json = manifest(name);
      } catch {
        continue;
      }
      // A row may mention antd to say a package does *not* use it.
      if (!/antd is a peer|for Ant Design/.test(row)) continue;
      expect(
        Boolean(json.peerDependencies?.antd),
        `README says "${name}" needs antd; its package.json does not declare it.`,
      ).toBe(true);
    }
  });
});
