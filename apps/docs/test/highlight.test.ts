import { describe, expect, it } from "vitest";
import { jsxAttr, jsxElement, showLineNumbers, tokenize } from "@/lib/highlight";
import { DOCUMENTED_ORDER } from "@zoblocks/component-meta";
import { CATALOG } from "@/lib/generated/catalog";
import {
  RUNNABLE_EXAMPLES,
  exampleModule,
  stackBlitzProject,
} from "@/components/site/docs/sandbox";

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
  it("only offers examples that are on a component page", () => {
    const shown = new Set(
      CATALOG.filter((c) => DOCUMENTED_ORDER.includes(c.name)).flatMap((c) =>
        (c.examples ?? []).map((e) => `${c.name}/${e.id}`),
      ),
    );
    for (const key of RUNNABLE_EXAMPLES) expect(shown, key).toContain(key);
  });

  it("leaves a full module alone but for the registry path", () => {
    const code = `import { Switch } from "@/components/zoblocks/switch";\n\nexport default function Example() {\n  return <Switch label="Smoker" />;\n}\n`;
    expect(exampleModule(code)).toBe(
      code.replace("@/components/zoblocks/switch", "@zoblocks/react"),
    );
  });

  it("wraps a bare snippet and imports what it renders from the component's package", () => {
    const code = `const items = [{ value: "a", label: "A" }];\n\n// Two of them.\n<Tabs aria-label="One" items={items} />\n<Tabs aria-label="Two" items={items} />;`;
    expect(exampleModule(code, "@zoblocks/tabs")).toBe(
      `import { Tabs } from "@zoblocks/tabs";\n\nconst items = [{ value: "a", label: "A" }];\n\n// Two of them.\n\nexport default function Example() {\n  return (\n    <>\n      <Tabs aria-label="One" items={items} />\n      <Tabs aria-label="Two" items={items} />\n    </>\n  );\n}\n`,
    );
  });

  it("turns a top-level comment inside the JSX into a JSX comment", () => {
    expect(exampleModule(`<Switch label="A" />\n// then\n<Switch label="B" />`)).toContain(
      "      {/* then */}\n",
    );
  });

  it("builds the boilerplate StackBlitz needs to run the example", () => {
    const project = stackBlitzProject({
      component: "tabs",
      id: "underline",
      title: "Underline",
      code: `<Tabs aria-label="Results" items={[]} />`,
      packageName: "@zoblocks/tabs",
    });
    expect(project.template).toBe("create-react-app");
    expect(JSON.parse(project.files["tsconfig.json"]!).compilerOptions.jsx).toBe("react-jsx");
    expect(project.dependencies).toMatchObject({
      react: "^19.0.0",
      "@zoblocks/react": expect.any(String),
      "@zoblocks/tokens": expect.any(String),
      "@zoblocks/identity": expect.any(String),
      "@zoblocks/copilot-react": expect.any(String),
      "@zoblocks/recorder-core": expect.any(String),
      "@zoblocks/tabs": expect.any(String),
    });
    expect(project.files["src/index.tsx"]).toContain('import "@zoblocks/react/styles.css";');
    expect(project.files["src/index.tsx"]).toContain(
      'import "@zoblocks/tokens/zoblocks-tokens.css";',
    );
    expect(project.files["src/index.tsx"]).toContain('import "@zoblocks/tabs/styles.css";');
  });
});
