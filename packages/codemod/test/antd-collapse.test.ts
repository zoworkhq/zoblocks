/**
 * Tests for the antd Collapse codemod.
 *
 * Two things carry the weight here, and neither is "does it rename the tag".
 *
 * The first is that it must not damage a file it only partly understands. A
 * codemod that deletes a sibling antd import, or mangles a `Collapse.Panel`, is
 * worse than no codemod: the build breaks somewhere that looks unrelated, and
 * the team stops trusting the tool on the file where it would have helped.
 *
 * The second is that it must *report* what it declined to do. The headingLevel
 * note is the whole reason this ships as a codemod rather than as a
 * find-and-replace in the migration guide.
 */

import { describe, expect, it } from "vitest";
import { transformAntdCollapse } from "../src/antd-collapse";

const run = (code: string) => transformAntdCollapse(code);
const messages = (code: string) => run(code).notes.map((n) => n.message);

describe("imports", () => {
  it("replaces a lone Collapse import", () => {
    const { code } = run('import { Collapse } from "antd";\n<Collapse items={items} />;');
    expect(code).toContain('import { Accordion } from "@oxygenui-design/react";');
    expect(code).not.toContain('from "antd"');
  });

  it("keeps the antd import for everything else in it", () => {
    // Deleting Button here would break the build somewhere that looks
    // unrelated, and the team would stop trusting the tool.
    const { code } = run('import { Button, Collapse, Modal } from "antd";');
    expect(code).toContain('import { Button, Modal } from "antd";');
    expect(code).toContain('import { Accordion } from "@oxygenui-design/react";');
  });

  it("leaves single quotes as it found them", () => {
    const { code } = run("import { Button, Collapse } from 'antd';");
    expect(code).toContain("import { Button } from 'antd';");
  });

  it("ignores an antd import with no Collapse in it", () => {
    const source = 'import { Button } from "antd";\nconst a = 1;';
    expect(run(source).code).toBe(source);
    expect(run(source).changed).toBe(false);
  });

  it("reports an aliased import rather than renaming the local binding", () => {
    const source = 'import { Collapse as Foldy } from "antd";\n<Foldy items={x} />;';
    expect(messages(source).join(" ")).toContain("imported as `Collapse as Foldy`");
  });

  it("does not touch a Collapse imported from somewhere else", () => {
    const source = 'import { Collapse } from "./my-collapse";';
    expect(run(source).code).toBe(source);
  });
});

describe("elements", () => {
  it("renames opening and closing tags", () => {
    const { code } = run("<Collapse items={items}>\n</Collapse>");
    expect(code).toContain("<Accordion items={items}>");
    expect(code).toContain("</Accordion>");
  });

  it("renames a self-closing element", () => {
    expect(run("<Collapse items={items} />").code).toContain("<Accordion items={items} />");
  });

  it("leaves Collapse.Panel intact rather than half-migrating it", () => {
    // Rewriting the parent and mangling the child would produce a file that
    // compiles and renders nothing.
    const { code } = run(
      "<Collapse>\n  <Collapse.Panel header='A' key='1'>x</Collapse.Panel>\n</Collapse>",
    );
    expect(code).toContain("<Accordion>");
    expect(code).toContain("<Collapse.Panel header='A' key='1'>");
    expect(code).toContain("</Collapse.Panel>");
  });

  it("says what to do about Collapse.Panel", () => {
    const note = messages(
      "<Collapse><Collapse.Panel header='A' key='1'>x</Collapse.Panel></Collapse>",
    );
    expect(note.join(" ")).toContain("`items` array");
  });
});

describe("antd v6 renames", () => {
  it("renames expandIconPosition", () => {
    const { code } = run('<Collapse expandIconPosition="end" />');
    expect(code).toContain('expandIconPlacement="end"');
    expect(code).not.toContain("expandIconPosition");
  });

  it("renames destroyOnClose", () => {
    expect(run("<Collapse destroyOnClose />").code).toContain("destroyOnHidden");
  });

  it("renames the middle size, which silently falls back if left alone", () => {
    expect(run('<Collapse size="middle" />').code).toContain('size="medium"');
  });

  it("leaves the other sizes alone", () => {
    expect(run('<Collapse size="small" />').code).toContain('size="small"');
    expect(run('<Collapse size="large" />').code).toContain('size="large"');
  });

  it("explains each rename rather than performing it silently", () => {
    const note = messages('<Collapse expandIconPosition="end" destroyOnClose />').join(" ");
    expect(note).toContain("antd v6");
  });
});

describe("headingLevel", () => {
  it("reports it rather than guessing", () => {
    // The correct level depends on the surrounding outline, which a text
    // transform cannot see. A wrong one is invisible at runtime.
    const note = run('import { Collapse } from "antd";\n<Collapse items={items} />').notes;
    const heading = note.find((n) => n.message.includes("headingLevel"));
    expect(heading?.severity).toBe("action");
  });

  it("stays quiet when the call site already sets it", () => {
    const note = messages("<Collapse headingLevel={2} items={items} />");
    expect(note.some((m) => m.includes("Set headingLevel"))).toBe(false);
  });

  it("stays quiet when a spread might carry it", () => {
    const note = messages("<Collapse {...rest} items={items} />");
    expect(note.some((m) => m.includes("Set headingLevel"))).toBe(false);
  });

  it("reports once per call site", () => {
    const note = messages("<Collapse items={a} />\n<Collapse items={b} />\n<Collapse items={c} />");
    expect(note.filter((m) => m.includes("Set headingLevel"))).toHaveLength(3);
  });
});

describe("the accordion prop", () => {
  it("notes that the ARIA pattern no longer changes with it", () => {
    const note = messages("<Collapse accordion items={items} />").join(" ");
    expect(note).toContain("disclosure widget in every configuration");
  });

  it("does not rewrite it — the name and the meaning both survive", () => {
    expect(run("<Collapse accordion items={items} />").code).toContain("accordion");
  });
});

describe("notes", () => {
  it("reports 1-indexed lines, so they line up with an editor", () => {
    const { notes } = run("const a = 1;\nconst b = 2;\n<Collapse items={items} />");
    expect(notes[0]?.line).toBe(3);
  });

  it("comes back sorted by line", () => {
    const { notes } = run(
      'import { Collapse } from "antd";\n\n<Collapse items={a} />\n<Collapse items={b} />',
    );
    const lines = notes.map((n) => n.line);
    expect([...lines].sort((x, y) => x - y)).toEqual(lines);
  });

  it("says nothing about a file it did not touch", () => {
    const result = run("const a = 1;");
    expect(result.notes).toEqual([]);
    expect(result.changed).toBe(false);
  });
});

describe("a realistic file", () => {
  const BEFORE = `import { Button, Collapse } from "antd";
import { useState } from "react";

export function Chart({ sections }) {
  const [open, setOpen] = useState([]);
  return (
    <Collapse
      accordion
      size="middle"
      expandIconPosition="end"
      destroyOnClose
      activeKey={open}
      onChange={setOpen}
      items={sections}
    />
  );
}`;

  it("produces code with no antd Collapse left in it", () => {
    const { code } = run(BEFORE);
    expect(code).not.toMatch(/<Collapse\b/);
    expect(code).not.toContain("expandIconPosition");
    expect(code).not.toContain("destroyOnClose");
    expect(code).not.toContain('size="middle"');
  });

  it("keeps every prop the two APIs share", () => {
    const { code } = run(BEFORE);
    for (const kept of [
      "accordion",
      "activeKey={open}",
      "onChange={setOpen}",
      "items={sections}",
    ]) {
      expect(code, kept).toContain(kept);
    }
  });

  it("keeps the sibling imports", () => {
    const { code } = run(BEFORE);
    expect(code).toContain('import { Button } from "antd";');
    expect(code).toContain('import { useState } from "react";');
  });

  it("hands back exactly one thing to do by hand", () => {
    const actions = run(BEFORE).notes.filter((n) => n.severity === "action");
    expect(actions).toHaveLength(1);
    expect(actions[0]?.message).toContain("headingLevel");
  });

  it("is idempotent — running it twice changes nothing the second time", () => {
    const once = run(BEFORE).code;
    const twice = run(once);
    expect(twice.code).toBe(once);
    expect(twice.changed).toBe(false);
  });
});
