import { describe, expect, it } from "vitest";
import { jsxAttr, jsxElement, showLineNumbers, tokenize } from "@/lib/highlight";
import { DOCUMENTED_ORDER } from "@zoblocks/component-meta";
import { CATALOG } from "@/lib/generated/catalog";
import { NOT_RUNNABLE, SANDBOXES } from "@/lib/generated/sandboxes";
import { assembleProject } from "@/lib/sandbox-project";

const kinds = (line: string, lang: "tsx" | "css" | "sh" = "tsx") =>
  tokenize(line, lang)[0]!
    .toks.filter((t) => t.v.trim())
    .map((t) => `${t.k}:${t.v}`);

describe("tokenize", () => {
  it("never changes the text", () => {
    const source = `import { Switch } from "@/components/zoblocks/switch";\n\n<Switch label="Smoker" allowUnset checked={null} />\n`;
    const back = tokenize(source, "tsx")
      .map((line) => line.toks.map((t) => t.v).join(""))
      .join("\n");
    expect(back).toBe(source.replace(/\n$/, ""));
  });

  it("colours keywords, strings, tags and props", () => {
    expect(kinds(`import { DataGrid } from "x";`)).toEqual([
      "kw:import",
      "p:{",
      "type:DataGrid",
      "p:}",
      "kw:from",
      'str:"x"',
      "p:;",
    ]);
    expect(kinds(`<Switch size="sm" />`)).toEqual(
      expect.arrayContaining(["tag:Switch", "attr:size", 'str:"sm"']),
    );
  });

  it("does not mistake an arrow function or a comparison for a prop", () => {
    expect(kinds("const f = (a) => a")).toContain("t:f");
    expect(kinds("if (a == b)")).not.toContain("attr:a");
  });

  it("reads CSS custom properties and shell commands", () => {
    expect(kinds("  --zb-switch-radius: 6px;", "css")).toContain("attr:--zb-switch-radius");
    expect(kinds("npx @zoblocks/cli add switch", "sh")).toEqual([
      "fn:npx",
      "str:@zoblocks/cli",
      "kw:add",
      "t:switch",
    ]);
  });

  it("numbers lines only past four", () => {
    expect(showLineNumbers("a\nb\nc\nd")).toBe(false);
    expect(showLineNumbers("a\nb\nc\nd\ne")).toBe(true);
    expect(showLineNumbers("a\nb\nc\nd\ne", false)).toBe(false);
  });
});

describe("jsx", () => {
  it("writes props the way a reader would", () => {
    expect(jsxAttr("size", "sm")).toBe('size="sm"');
    expect(jsxAttr("disabled", true)).toBe("disabled");
    expect(jsxAttr("disabled", false)).toBe("disabled={false}");
    expect(jsxAttr("count", 3)).toBe("count={3}");
    expect(jsxAttr("items", "patientRoutine", true)).toBe("items={patientRoutine}");
    expect(jsxAttr("size", undefined)).toBeNull();
  });

  it("keeps a short element on one line and wraps a long one", () => {
    expect(jsxElement("Tabs", ['as="nav"'])).toBe('<Tabs as="nav" />');
    const long = jsxElement(
      "Signature",
      ['attestation="I agree to the treatment."', 'outcomes="declined"'],
      "    ",
    );
    expect(long.split("\n")).toHaveLength(4);
  });

  it("wraps children in an opening and closing tag", () => {
    expect(jsxElement("Menu", ["subject={order}"], "", "{(trigger) => <tr {...trigger} />}")).toBe(
      "<Menu\n  subject={order}\n>\n  {(trigger) => <tr {...trigger} />}\n</Menu>",
    );
    expect(jsxElement("Menu", [], "  ", "{body}")).toBe("<Menu>\n    {body}\n  </Menu>");
  });
});

describe("StackBlitz projects", () => {
  const shown = CATALOG.filter((c) => DOCUMENTED_ORDER.includes(c.name)).flatMap((c) =>
    (c.examples ?? []).map((e) => `${c.name}/${e.id}`),
  );

  it("either runs every example on a component page or says why not", () => {
    for (const key of shown) {
      expect(SANDBOXES.has(key) || key in NOT_RUNNABLE, key).toBe(true);
    }
  });

  it("never both runs an example and says it cannot", () => {
    for (const key of SANDBOXES) expect(NOT_RUNNABLE, key).not.toHaveProperty(key);
  });

  it("lays registry files out where the CLI writes them, under the example", () => {
    const project = assembleProject(
      {
        title: "t",
        description: "d",
        openFile: "src/examples/switch/tones.tsx",
        items: ["switch"],
        files: { "src/examples/switch/tones.tsx": "example", "src/lib/utils.ts": "mine" },
      },
      [
        {
          name: "switch",
          files: [
            { target: "components/zoblocks/switch.tsx", content: "component" },
            { target: "lib/utils.ts", content: "registry" },
          ],
        },
      ],
    );
    expect(project.template).toBe("node");
    expect(project.files).toEqual({
      "src/components/zoblocks/switch.tsx": "component",
      "src/examples/switch/tones.tsx": "example",
      // The manifest's own files win over anything an item installs.
      "src/lib/utils.ts": "mine",
    });
  });
});
