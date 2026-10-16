import { describe, expect, it } from "vitest";
import { jsxAttr, jsxElement, showLineNumbers, tokenize } from "@/lib/highlight";
import { DOCUMENTED_ORDER } from "@zoblocks/component-meta";
import { HOSTED_DEMOS, demoLinks } from "@/components/site/docs/sandbox";

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

describe("hosted demos", () => {
  it("only links demos for components that have a page", () => {
    for (const name of HOSTED_DEMOS) expect(DOCUMENTED_ORDER).toContain(name);
  });

  it("points at the demo folder on both platforms", () => {
    const links = demoLinks("switch", "Switch");
    expect(links.map((l) => l.href)).toEqual([
      "https://stackblitz.com/github/md-nabas-pm/zoblocks-examples/tree/main/demos/switch?file=src/App.tsx",
      "https://codesandbox.io/p/devbox/github/md-nabas-pm/zoblocks-examples/tree/main/demos/switch",
    ]);
    expect(demoLinks("signature", "Signature")).toEqual([]);
  });
});
