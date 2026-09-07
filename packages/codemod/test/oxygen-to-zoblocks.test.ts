import { describe, expect, it } from "vitest";

import { transformOxygenToZoblocks } from "../src/oxygen-to-zoblocks";

const run = (source: string) => transformOxygenToZoblocks(source);
const messages = (source: string) => run(source).notes.map((n) => n.message);

describe("imports", () => {
  it("moves the npm scope", () => {
    const { code } = run('import { Accordion } from "@oxygenui-design/react";');
    expect(code).toBe('import { Accordion } from "@zoblocks/react";');
  });

  it("moves the short scope the early docs used", () => {
    expect(run('from "@oxygenui/intl"').code).toBe('from "@zoblocks/intl"');
  });

  it("moves the registry namespace", () => {
    expect(run('"@oxygen-pro": { "url": "…" }').code).toContain('"@zoblocks-pro"');
  });

  it("moves the directory the CLI writes into", () => {
    const { code } = run('import { Timeline } from "@/components/oxygen/timeline";');
    expect(code).toBe('import { Timeline } from "@/components/zoblocks/timeline";');
  });

  it("moves the lib and styles filenames", () => {
    expect(run('import "@/lib/oxygen-loader";').code).toContain("@/lib/zoblocks-loader");
    expect(run('@import "./styles/oxygen-switch.css";').code).toContain(
      "./styles/zoblocks-switch.css",
    );
  });
});

describe("the ox- family", () => {
  it("moves custom properties", () => {
    expect(run("--ox-accent: red;").code).toBe("--zb-accent: red;");
    expect(run("color: var(--ox-fg, var(--ox-text));").code).toBe(
      "color: var(--zb-fg, var(--zb-text));",
    );
  });

  it("moves the Tailwind theme namespace", () => {
    expect(run("--color-ox-surface: var(--ox-surface);").code).toBe(
      "--color-zb-surface: var(--zb-surface);",
    );
  });

  it("moves data attributes and the camelCase form dataset exposes", () => {
    expect(run('<div data-ox-density="compact" />').code).toBe('<div data-zb-density="compact" />');
    expect(run("el.dataset.oxPhoto").code).toBe("el.dataset.zbPhoto");
  });

  it("moves custom element tags, opening and closing", () => {
    expect(run("<ox-pulse-loader></ox-pulse-loader>").code).toBe(
      "<zb-pulse-loader></zb-pulse-loader>",
    );
  });

  it("moves class selectors and class attributes", () => {
    expect(run(".ox-switch__track { color: red }").code).toBe(".zb-switch__track { color: red }");
    expect(run('className="ox-grid ox-grid--dense"').code).toBe(
      'className="zb-grid zb-grid--dense"',
    );
  });

  it("moves animation names", () => {
    expect(run("@keyframes ox-fade { }").code).toBe("@keyframes zb-fade { }");
    expect(run("animation: ox-sweep 3s;").code).toBe("animation: zb-sweep 3s;");
  });

  /*
   * The rule this transform is most likely to get wrong, so it is pinned
   * hardest. `box-shadow` contains `ox-`, and an unanchored substitution
   * turns every stylesheet in the consumer's project into `bzb-shadow`.
   */
  it("leaves box-shadow, box-sizing and checkbox alone", () => {
    const css = ".card { box-shadow: 0 1px 2px #000; box-sizing: border-box; }";
    expect(run(css).code).toBe(css);
    expect(run('<input className="checkbox-label" />').code).toBe(
      '<input className="checkbox-label" />',
    );
    expect(run("--box-shadow-sm: none;").code).toBe("--box-shadow-sm: none;");
  });

  it("moves a class name at the start of a line", () => {
    expect(run("ox-pulse-loader {\n  display: block;\n}").code).toBe(
      "zb-pulse-loader {\n  display: block;\n}",
    );
  });
});

describe("credentials", () => {
  it("moves the environment variable and the token prefix", () => {
    expect(run("Bearer ${OXYGEN_TOKEN}").code).toBe("Bearer ${ZOBLOCKS_TOKEN}");
    expect(run("oxy_live_abc123").code).toBe("zb_live_abc123");
    expect(run("oxy_test_abc123").code).toBe("zb_test_abc123");
  });
});

describe("what it refuses to do", () => {
  it("reports the config file rather than renaming it", () => {
    const notes = messages('{ "$schema": "…/oxygen.json" }');
    expect(notes.some((m) => m.includes("Rename oxygen.json"))).toBe(true);
  });

  it("leaves the consumer's own identifiers alone and says it saw them", () => {
    const { code, notes } = run("const oxygenTheme = buildTheme();");
    expect(code).toBe("const oxygenTheme = buildTheme();");
    expect(notes.some((n) => n.severity === "info")).toBe(true);
  });

  it("reports each remaining line once, not each occurrence", () => {
    const { notes } = run("// oxygen and oxygen and oxygen\n");
    expect(notes.filter((n) => n.severity === "info")).toHaveLength(1);
  });
});

describe("results", () => {
  it("reports no change for a file that needs none", () => {
    const clean = 'import { Accordion } from "@zoblocks/react";';
    expect(run(clean).changed).toBe(false);
  });

  it("sorts notes by line", () => {
    const { notes } = run("const a = 1;\n// oxygen\nconst b = 2;\n// oxygen again\n");
    expect(notes.map((n) => n.line)).toEqual([...notes.map((n) => n.line)].sort((x, y) => x - y));
  });
});
