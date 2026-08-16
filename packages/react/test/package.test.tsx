/**
 * The npm React channel, exercised the way a consumer would.
 *
 * `packages/react/src` is generated from the registry source, so this is not a
 * second copy of the component tests — it asserts the things that can only go
 * wrong in *packaging*: that the barrel exports what it claims, that the
 * rewritten import specifiers resolve, that `"use client"` survives generation
 * in a position a bundler will honour, and that the stylesheet ships.
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BreathLoader,
  HelixLoader,
  InfusionLoader,
  PageLoader,
  PulseLoader,
  RhythmLoader,
  cn,
  useLoadingGate,
  LOADER_ART,
  LOADER_SIZE_PX,
} from "../src/index.js";

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const LOADERS = [
  ["PulseLoader", PulseLoader],
  ["RhythmLoader", RhythmLoader],
  ["BreathLoader", BreathLoader],
  ["HelixLoader", HelixLoader],
  ["InfusionLoader", InfusionLoader],
] as const;

describe("the public barrel", () => {
  it.each(LOADERS)("exports %s as a component", (_name, Component) => {
    expect(typeof Component).toBe("function");
  });

  it("exports the PageLoader preset", () => {
    expect(typeof PageLoader).toBe("function");
  });

  it("exports the shared hook and helpers a consumer composes with", () => {
    expect(typeof useLoadingGate).toBe("function");
    expect(typeof cn).toBe("function");
    expect(LOADER_SIZE_PX.xl).toBe(88);
    expect(LOADER_ART.heartTop).toMatch(/^M/);
  });
});

describe("rendering through the package entry point", () => {
  it.each(LOADERS)("%s renders and announces itself", (_name, Component) => {
    const view = render(<Component label="Loading results" />);
    const root = view.container.querySelector("[data-ox-loader]");

    expect(root).not.toBeNull();
    expect(root).toHaveAttribute("role", "status");
    expect(view.container.textContent).toContain("Loading results");
    expect(view.container.querySelector("svg")).not.toBeNull();
  });

  it("resolves the rewritten sibling import — Pulse delegates to Rhythm when small", () => {
    // This is the specifier the generator rewrites from
    // "@/components/oxygen/rhythm-loader". If the rewrite were wrong the module
    // would not resolve at all, so reaching this assertion is most of the test.
    const view = render(<PulseLoader label="Loading" size={24} />);
    expect(view.container.querySelector("[data-ox-loader]")).toHaveAttribute(
      "data-ox-loader",
      "rhythm",
    );
  });

  it("keeps the determinate progressbar contract", () => {
    const view = render(<InfusionLoader progress={42} label="Importing records" />);
    const root = view.container.querySelector("[role='progressbar']");
    expect(root).toHaveAttribute("aria-valuenow", "42");
    expect(root).toHaveAttribute("aria-valuetext", "42 percent");
  });
});

describe("packaging correctness", () => {
  const sourceFiles = [
    "src/index.ts",
    "src/lib/loader.tsx",
    "src/lib/utils.ts",
    "src/styles.css",
    ...LOADERS.map(([,]) => null).filter(Boolean),
  ].filter(Boolean) as string[];

  it.each(sourceFiles)("%s is generated into the package", (file) => {
    expect(existsSync(path.join(PKG, file))).toBe(true);
  });

  it('puts "use client" first, where a bundler will honour it', () => {
    // A directive after a comment is legal JavaScript but bundlers disagree
    // about it, and one that is ignored turns a client component into a server
    // component — which fails at the first hook, far from the cause.
    for (const file of ["src/lib/loader.tsx", "src/components/pulse-loader/pulse-loader.tsx"]) {
      const source = readFileSync(path.join(PKG, file), "utf8");
      expect(source.startsWith('"use client";'), `${file} must open with the directive`).toBe(true);
    }
  });

  it("rewrote every consumer-project specifier", () => {
    // "@/lib/..." and "@/components/oxygen/..." only resolve inside a project
    // that has the shadcn path aliases. Inside a package they resolve nowhere.
    for (const file of [
      "src/index.ts",
      "src/lib/loader.tsx",
      "src/components/pulse-loader/pulse-loader.tsx",
      "src/components/infusion-loader/infusion-loader.tsx",
    ]) {
      const source = readFileSync(path.join(PKG, file), "utf8");
      expect(source, `${file} still contains a consumer alias`).not.toMatch(/from\s+["']@\//);
    }
  });

  it("declares react as a peer dependency, never a dependency", () => {
    // Bundling React gives the host two copies and breaks every hook.
    const pkg = JSON.parse(readFileSync(path.join(PKG, "package.json"), "utf8"));
    expect(pkg.peerDependencies.react).toBeTruthy();
    expect(pkg.dependencies?.react).toBeUndefined();
    expect(pkg.dependencies?.["react-dom"]).toBeUndefined();
  });

  it("supports both React 18 and 19", () => {
    const pkg = JSON.parse(readFileSync(path.join(PKG, "package.json"), "utf8"));
    expect(pkg.peerDependencies.react).toContain("18");
    expect(pkg.peerDependencies.react).toContain("19");
  });

  it("ships the stylesheet the components need to animate", () => {
    const css = readFileSync(path.join(PKG, "src/styles.css"), "utf8");
    expect(css).toContain("@keyframes ox-loader-beat");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain("forced-colors");
  });
});
