/**
 * Grading an agent's work by script, not by eye (ADR 0017).
 *
 * Every check reads what the agent left on disk — or, for the process check,
 * what it called — and compares it with the catalog manifest. None asks a
 * model whether the code looks right: the failures this exists to catch (an
 * invented component, an invented prop, a stylesheet never imported) all
 * compile in the reader's head and are visible only to a check that knows the
 * catalog.
 *
 * Pure functions over strings and the manifest, so they are unit-tested on
 * their own (test/ai-evals.test.ts) before anything trusts them.
 */

import ts from "typescript";

export interface ManifestLike {
  components: Array<{
    name: string;
    distribution: "registry" | "package";
    packageName?: string;
    exports: Array<{ name: string; props: Array<{ name: string }> }>;
  }>;
}

export interface Finding {
  check: string;
  ok: boolean;
  detail: string;
}

/** A file the agent wrote, relative to the app root, with its source. */
export interface SourceFile {
  path: string;
  source: string;
}

/* ------------------------------------------------------------------ */
/* Imports                                                            */
/* ------------------------------------------------------------------ */

interface ZoBlocksImport {
  file: string;
  module: string;
  /** The catalog component the module is, when it is one. */
  component?: string;
  names: Array<{ imported: string; local: string }>;
}

const REGISTRY_MODULE = /^@\/components\/zoblocks\/([a-z0-9-]+)$/;

/** Packages a project may import that are ZoBlocks but not catalog components. */
const SUPPORT_PACKAGES =
  /^@zoblocks\/(bridge-antd|bridge-mui|bridge-core|tokens|fhir|loaders|elements)(\/|$)/;

export function zoblocksImports(file: SourceFile, manifest: ManifestLike): ZoBlocksImport[] {
  const sf = ts.createSourceFile(
    file.path,
    file.source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const found: ZoBlocksImport[] = [];

  for (const statement of sf.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
      continue;
    const module = statement.moduleSpecifier.text;
    if (!REGISTRY_MODULE.test(module) && !module.startsWith("@zoblocks/")) continue;

    const registryName = REGISTRY_MODULE.exec(module)?.[1];
    const component =
      registryName ??
      manifest.components.find((c) => c.distribution === "package" && c.packageName === module)
        ?.name;

    const names: ZoBlocksImport["names"] = [];
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        if (element.isTypeOnly || statement.importClause?.isTypeOnly) continue;
        names.push({
          imported: (element.propertyName ?? element.name).text,
          local: element.name.text,
        });
      }
    }
    found.push({ file: file.path, module, ...(component ? { component } : {}), names });
  }
  return found;
}

/**
 * Every ZoBlocks import names a real component, and every named import is a
 * real export of it. The check that catches `@/components/zoblocks/button`.
 */
export function checkImports(
  files: SourceFile[],
  manifest: ManifestLike,
  installed: Set<string>,
): Finding {
  const problems: string[] = [];
  const byName = new Map(manifest.components.map((c) => [c.name, c]));

  for (const file of files) {
    for (const imp of zoblocksImports(file, manifest)) {
      if (!imp.component) {
        if (!SUPPORT_PACKAGES.test(imp.module))
          problems.push(`${imp.file}: ${imp.module} is not a ZoBlocks component`);
        continue;
      }
      const component = byName.get(imp.component);
      if (!component) {
        problems.push(`${imp.file}: ${imp.module} — no such ZoBlocks component`);
        continue;
      }
      if (component.distribution === "registry" && !installed.has(imp.component)) {
        problems.push(`${imp.file}: ${imp.module} is imported but was never installed`);
      }
      const exported = new Set(component.exports.map((e) => e.name));
      for (const { imported } of imp.names) {
        // Non-component exports (adapters like fromObservation, types) are fine
        // when the catalog lists them; a capitalised name that is not an export
        // is an invented component.
        if (
          /^[A-Z]/.test(imported) &&
          !exported.has(imported) &&
          !/(Props|Data|Value|Item|Type)$/.test(imported)
        ) {
          problems.push(`${imp.file}: ${imported} is not exported by ${imp.module}`);
        }
      }
    }
  }
  return {
    check: "imports are real",
    ok: problems.length === 0,
    detail: problems.length
      ? problems.join("; ")
      : "every ZoBlocks import is a real, installed component",
  };
}

/* ------------------------------------------------------------------ */
/* Props                                                              */
/* ------------------------------------------------------------------ */

/** Attributes every element takes, which no component lists among its own props. */
const UNIVERSAL = new Set([
  "key",
  "ref",
  "className",
  "style",
  "id",
  "children",
  "title",
  "role",
  "tabIndex",
  "hidden",
]);
const isUniversal = (name: string) =>
  UNIVERSAL.has(name) || name.startsWith("aria-") || name.startsWith("data-");

/**
 * Every attribute on a ZoBlocks element is a prop the catalog lists for that
 * export. The check that catches a prop composed from the component's name.
 */
export function checkProps(files: SourceFile[], manifest: ManifestLike): Finding {
  const problems: string[] = [];
  let checked = 0;

  for (const file of files) {
    const locals = new Map<string, Set<string>>();
    for (const imp of zoblocksImports(file, manifest)) {
      const component = manifest.components.find((c) => c.name === imp.component);
      for (const { imported, local } of imp.names) {
        const exported = component?.exports.find((e) => e.name === imported);
        if (exported) locals.set(local, new Set(exported.props.map((p) => p.name)));
      }
    }
    if (!locals.size) continue;

    const sf = ts.createSourceFile(
      file.path,
      file.source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const visit = (node: ts.Node) => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(sf);
        const props = locals.get(tag);
        if (props) {
          checked++;
          for (const attr of node.attributes.properties) {
            if (!ts.isJsxAttribute(attr)) continue;
            const name = attr.name.getText(sf);
            if (!props.has(name) && !isUniversal(name))
              problems.push(`${file.path}: <${tag} ${name}> is not a prop of ${tag}`);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  return {
    check: "props are real",
    ok: problems.length === 0,
    detail: problems.length
      ? problems.join("; ")
      : checked
        ? `${checked} ZoBlocks element(s), every prop in the catalog`
        : "no ZoBlocks elements used",
  };
}

/* ------------------------------------------------------------------ */
/* Stylesheets                                                        */
/* ------------------------------------------------------------------ */

/**
 * Every stylesheet the install wrote is imported by the global stylesheet,
 * and Tailwind is told where the components are. A miss here renders bare
 * markup with nothing in the console to say why.
 */
export function checkStylesheets(
  globalCss: string | undefined,
  installedSheets: string[],
): Finding {
  if (!installedSheets.length)
    return { check: "stylesheets imported", ok: true, detail: "no ZoBlocks stylesheets installed" };
  if (globalCss === undefined)
    return { check: "stylesheets imported", ok: false, detail: "no global stylesheet found" };

  // Read the imports with one fixed pattern and compare file names as strings.
  // It used to build a RegExp from each sheet name, escaping only the dots —
  // a name is data, and data has no business in a pattern (CodeQL
  // js/incomplete-sanitization). Comparing the file name also stops
  // `my-zoblocks-switch.css` counting as an import of `zoblocks-switch.css`.
  const imported = new Set(
    [...globalCss.matchAll(/@import\s+["']([^"']*)["']/g)].map(
      ([, specifier = ""]) => specifier.split("/").pop() ?? "",
    ),
  );
  const missing = installedSheets.filter((sheet) => !imported.has(sheet));
  const source = /@source\s+["'][^"']*components\/zoblocks["']/.test(globalCss);
  const problems = [
    ...missing.map((m) => `${m} is not imported`),
    ...(source ? [] : ["no @source for components/zoblocks"]),
  ];
  return {
    check: "stylesheets imported",
    ok: problems.length === 0,
    detail: problems.length
      ? problems.join("; ")
      : `${installedSheets.length} stylesheet(s) imported, @source present`,
  };
}

/* ------------------------------------------------------------------ */
/* Expected components                                                */
/* ------------------------------------------------------------------ */

export function checkUses(
  files: SourceFile[],
  manifest: ManifestLike,
  expected: string[],
): Finding {
  const used = new Set(
    files.flatMap((f) =>
      zoblocksImports(f, manifest)
        .map((i) => i.component)
        .filter(Boolean),
    ),
  );
  const missing = expected.filter((name) => !used.has(name));
  return {
    check: "uses the right component",
    ok: missing.length === 0,
    detail: missing.length
      ? `expected ${missing.join(", ")}; used ${[...used].join(", ") || "none"}`
      : `uses ${expected.join(", ")}`,
  };
}

/* ------------------------------------------------------------------ */
/* Process                                                            */
/* ------------------------------------------------------------------ */

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

/** The tool calls in a Claude Code `stream-json` transcript, in order. */
export function toolCalls(streamJson: string): ToolCall[] {
  const calls: ToolCall[] = [];
  for (const line of streamJson.split("\n")) {
    if (!line.trim().startsWith("{")) continue;
    let event: { type?: string; message?: { content?: unknown } };
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (event.type !== "assistant" || !Array.isArray(event.message?.content)) continue;
    for (const block of event.message.content as Array<{
      type?: string;
      name?: string;
      input?: unknown;
    }>) {
      if (block.type === "tool_use" && block.name) {
        calls.push({ name: block.name, input: (block.input ?? {}) as Record<string, unknown> });
      }
    }
  }
  return calls;
}

const isZoBlocksTool = (name: string, tool: string) => name === `mcp__zoblocks__${tool}`;
const isWrite = (call: ToolCall) =>
  ["Write", "Edit", "MultiEdit"].includes(call.name) &&
  !/components\/zoblocks\/|\/lib\/|\/styles\//.test(String(call.input.file_path ?? ""));

/**
 * Did the agent look before it wrote? The skill's whole workflow: search and
 * read the real contract before writing the page.
 */
export function checkProcess(calls: ToolCall[]): Finding {
  const firstWrite = calls.findIndex(isWrite);
  const before = firstWrite === -1 ? calls : calls.slice(0, firstWrite);
  const looked = before.some(
    (c) => isZoBlocksTool(c.name, "search_components") || isZoBlocksTool(c.name, "list_components"),
  );
  const contract = before.some(
    (c) =>
      isZoBlocksTool(c.name, "get_component") || isZoBlocksTool(c.name, "get_component_examples"),
  );
  const used = [
    ...new Set(
      calls.filter((c) => c.name.startsWith("mcp__zoblocks__")).map((c) => c.name.slice(15)),
    ),
  ];
  return {
    check: "looked before writing",
    ok: looked && contract,
    detail: `${looked ? "searched" : "did not search"}, ${contract ? "read the contract" : "did not read the contract"} before writing; ZoBlocks tools used: ${used.join(", ") || "none"}`,
  };
}
