/**
 * The agent-eval graders, tested before anything trusts them.
 *
 * Each grader gets code that is right and code that is wrong in exactly the
 * way an agent gets it wrong — an invented Button, a prop composed from a
 * component's name, a stylesheet never imported — and must tell them apart,
 * against the real catalog.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  checkImports,
  checkProcess,
  checkProps,
  checkStylesheets,
  checkUses,
  toolCalls,
  type ManifestLike,
} from "../scripts/ai-evals/grade";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(path.join(ROOT, "apps/docs/public/ai/manifest.json"), "utf8"),
) as ManifestLike;

const page = (source: string) => [{ path: "src/app/page.tsx", source }];
const installed = new Set(["switch"]);

describe("checkImports", () => {
  it("passes a real, installed component", () => {
    const files = page('import { Switch } from "@/components/zoblocks/switch";');
    expect(checkImports(files, manifest, installed).ok).toBe(true);
  });

  it("fails an invented component", () => {
    const result = checkImports(
      page('import { Button } from "@/components/zoblocks/button";'),
      manifest,
      installed,
    );
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("no such ZoBlocks component");
  });

  it("fails a real component that was never installed", () => {
    const result = checkImports(
      page('import { ResultValue } from "@/components/zoblocks/result-value";'),
      manifest,
      installed,
    );
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("never installed");
  });

  it("fails an export the component does not have", () => {
    const result = checkImports(
      page('import { SwitchGroup } from "@/components/zoblocks/switch";'),
      manifest,
      installed,
    );
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("SwitchGroup is not exported");
  });

  it("accepts npm-package components, the bridges, and adapters", () => {
    const files = page(
      [
        'import { Signature } from "@zoblocks/signature";',
        'import { AntdBridge } from "@zoblocks/bridge-antd";',
        'import { Switch, type SwitchProps } from "@/components/zoblocks/switch";',
      ].join("\n"),
    );
    expect(checkImports(files, manifest, installed)).toMatchObject({ ok: true });
  });

  it("fails an @zoblocks package that does not exist", () => {
    expect(
      checkImports(page('import { X } from "@zoblocks/buttons";'), manifest, installed).ok,
    ).toBe(false);
  });
});

describe("checkProps", () => {
  it("passes props the catalog lists, and attributes every element takes", () => {
    const files = page(`
      import { Switch } from "@/components/zoblocks/switch";
      export default () => <Switch label="Contact precautions" checked={false} aria-describedby="x" className="m-2" />;
    `);
    expect(checkProps(files, manifest)).toMatchObject({ ok: true });
  });

  it("fails a prop composed from the component's name", () => {
    const files = page(`
      import { Switch } from "@/components/zoblocks/switch";
      export default () => <Switch label="x" onToggle={() => {}} />;
    `);
    const result = checkProps(files, manifest);
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("onToggle");
  });

  it("follows an import alias", () => {
    const files = page(`
      import { Switch as Toggle } from "@/components/zoblocks/switch";
      export default () => <Toggle label="x" enabled />;
    `);
    expect(checkProps(files, manifest).detail).toContain("<Toggle enabled>");
  });

  it("ignores elements that are not ZoBlocks", () => {
    const files = page('export default () => <button onToggle="x">Go</button>;');
    expect(checkProps(files, manifest)).toMatchObject({
      ok: true,
      detail: "no ZoBlocks elements used",
    });
  });
});

describe("checkStylesheets", () => {
  const css = `@import "tailwindcss";
@import "../styles/zoblocks-tokens.css";
@import "../styles/zoblocks-switch.css";
@source "../components/zoblocks";`;

  it("passes when every installed sheet is imported and @source is set", () => {
    expect(checkStylesheets(css, ["zoblocks-tokens.css", "zoblocks-switch.css"]).ok).toBe(true);
  });

  it("fails a sheet that was installed but not imported", () => {
    const result = checkStylesheets(css, ["zoblocks-tokens.css", "zoblocks-loader.css"]);
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("zoblocks-loader.css");
  });

  it("fails a missing @source", () => {
    expect(
      checkStylesheets('@import "../styles/zoblocks-tokens.css";', ["zoblocks-tokens.css"]).ok,
    ).toBe(false);
  });

  it("has nothing to check when nothing was installed", () => {
    expect(checkStylesheets(undefined, []).ok).toBe(true);
  });

  it("matches the file name, not a name that merely ends the same way", () => {
    const lookalike = `@import "../styles/my-zoblocks-switch.css";\n@source "../components/zoblocks";`;
    const result = checkStylesheets(lookalike, ["zoblocks-switch.css"]);
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("zoblocks-switch.css is not imported");
  });

  it("accepts single quotes, a bare file name, and Vite's ./ paths", () => {
    const vite = `@import 'tailwindcss';\n@import './styles/zoblocks-tokens.css';\n@import "zoblocks-switch.css";\n@source "./components/zoblocks";`;
    expect(checkStylesheets(vite, ["zoblocks-tokens.css", "zoblocks-switch.css"]).ok).toBe(true);
  });

  it("treats a sheet name as text, never as a pattern", () => {
    // Under the old RegExp, `+` and `(` in a name were pattern syntax.
    const css = `@import "../styles/zoblocks-a+b(c).css";\n@source "../components/zoblocks";`;
    expect(checkStylesheets(css, ["zoblocks-a+b(c).css"]).ok).toBe(true);
    expect(checkStylesheets(css, ["zoblocks-aab(c).css"]).ok).toBe(false);
  });
});

describe("checkUses", () => {
  it("passes when the expected component is used, and says what was used otherwise", () => {
    const files = page('import { Switch } from "@/components/zoblocks/switch";');
    expect(checkUses(files, manifest, ["switch"]).ok).toBe(true);
    expect(checkUses(files, manifest, ["result-value"]).detail).toContain("used switch");
  });
});

describe("process", () => {
  const event = (blocks: unknown[]) =>
    JSON.stringify({ type: "assistant", message: { content: blocks } });
  const tool = (name: string, input: unknown = {}) => ({ type: "tool_use", name, input });

  it("reads tool calls from a stream-json transcript, skipping everything else", () => {
    const transcript = [
      JSON.stringify({ type: "system", subtype: "init" }),
      event([
        { type: "text", text: "Looking." },
        tool("mcp__zoblocks__search_components", { query: "toggle" }),
      ]),
      "not json",
      event([tool("Write", { file_path: "src/app/page.tsx" })]),
    ].join("\n");
    expect(toolCalls(transcript).map((c) => c.name)).toEqual([
      "mcp__zoblocks__search_components",
      "Write",
    ]);
  });

  it("passes an agent that searched and read the contract before writing the page", () => {
    const calls = toolCalls(
      [
        event([tool("mcp__zoblocks__search_components")]),
        event([tool("mcp__zoblocks__get_component")]),
        event([tool("Write", { file_path: "/app/src/app/settings/page.tsx" })]),
      ].join("\n"),
    );
    expect(checkProcess(calls).ok).toBe(true);
  });

  it("fails an agent that wrote the page first", () => {
    const calls = toolCalls(
      [
        event([tool("Write", { file_path: "/app/src/app/settings/page.tsx" })]),
        event([tool("mcp__zoblocks__get_component")]),
      ].join("\n"),
    );
    expect(checkProcess(calls).ok).toBe(false);
  });

  it("does not count the CLI's own writes into components/zoblocks as writing the page", () => {
    const calls = toolCalls(
      [
        event([tool("Edit", { file_path: "/app/src/styles/zoblocks-tokens.css" })]),
        event([tool("mcp__zoblocks__search_components"), tool("mcp__zoblocks__get_component")]),
        event([tool("Write", { file_path: "/app/src/app/page.tsx" })]),
      ].join("\n"),
    );
    expect(checkProcess(calls).ok).toBe(true);
  });
});
