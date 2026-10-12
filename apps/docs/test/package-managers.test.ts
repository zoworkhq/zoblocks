/**
 * The docs' commands, per package manager.
 *
 * Each expected line below is one that was run against a fresh project with
 * that package manager before the docs were written. A change here changes
 * what a reader pastes into a terminal, so it should be re-run, not just
 * re-snapshotted.
 */

import { describe, expect, it } from "vitest";
import { PACKAGE_MANAGERS, toCommand } from "@zoblocks/component-meta";

describe("toCommand", () => {
  it("runs the CLI with each manager's runner — npx for Yarn, which has no dlx in v1", () => {
    expect(PACKAGE_MANAGERS.map((pm) => toCommand(pm, { dlx: "@zoblocks/cli init" }))).toEqual([
      "npx @zoblocks/cli init",
      "pnpm dlx @zoblocks/cli init",
      "npx @zoblocks/cli init",
      "bunx @zoblocks/cli init",
    ]);
  });

  it("adds packages", () => {
    expect(PACKAGE_MANAGERS.map((pm) => toCommand(pm, { add: "antd" }))).toEqual([
      "npm install antd",
      "pnpm add antd",
      "yarn add antd",
      "bun add antd",
    ]);
  });

  it("installs and runs scripts", () => {
    expect(PACKAGE_MANAGERS.map((pm) => toCommand(pm, { install: true }))).toEqual([
      "npm install",
      "pnpm install",
      "yarn",
      "bun install",
    ]);
    expect(PACKAGE_MANAGERS.map((pm) => toCommand(pm, { run: "dev" }))).toEqual([
      "npm run dev",
      "pnpm dev",
      "yarn dev",
      "bun run dev",
    ]);
  });

  it("creates a Vite app — npm alone needs `--` before the template flag", () => {
    expect(PACKAGE_MANAGERS.map((pm) => toCommand(pm, { createVite: "my-app" }))).toEqual([
      "npm create vite@latest my-app -- --template react-ts",
      "pnpm create vite my-app --template react-ts",
      "yarn create vite my-app --template react-ts",
      "bun create vite my-app --template react-ts",
    ]);
  });

  it("creates a Next.js app that uses the chosen manager", () => {
    for (const pm of PACKAGE_MANAGERS) {
      const line = toCommand(pm, { createNext: "my-app" });
      expect(line).toContain(" my-app ");
      expect(line).toContain("--src-dir");
      expect(line).toContain('--import-alias "@/*"');
      expect(line.endsWith(`--use-${pm}`)).toBe(true);
    }
    expect(toCommand("npm", { createNext: "my-app" })).toMatch(/^npx create-next-app@latest /);
    expect(toCommand("yarn", { createNext: "my-app" })).toMatch(/^yarn create next-app /);
  });

  it("leaves a plain command alone", () => {
    for (const pm of PACKAGE_MANAGERS)
      expect(toCommand(pm, { raw: "cd my-app" })).toBe("cd my-app");
  });
});
