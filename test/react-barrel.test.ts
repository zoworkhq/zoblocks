/**
 * Two components must not export the same name from the npm barrel.
 *
 * `packages/react/src/index.ts` re-exports every component and every shared
 * lib flat, so two modules exporting `fromFHIR` is a TypeScript error — but
 * only at `pnpm build`, several minutes after the component was written and
 * in a package the author was not thinking about. It has happened three times
 * in a row now: `wordFor` and `AbsentReason` collided with Switch, and
 * `fromFHIR` collided between ResultValue and AllergyChip because "the FHIR
 * adapter" is the obvious name in every module that has one.
 *
 * The barrel is generated, so the fix is never to edit it. It is to name the
 * export for what it takes — `fromObservation`, `fromAllergyIntolerance` —
 * and this fails at test time so that decision happens while the file is open.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BARREL = path.join(ROOT, "packages", "react", "src", "index.ts");

/**
 * The modules the barrel re-exports with a bare `export * from`.
 *
 * A named re-export cannot collide silently — TypeScript makes the author
 * write the name — so only the star exports are walked.
 */
function starExports(source: string): string[] {
  const parsed = ts.createSourceFile("index.ts", source, ts.ScriptTarget.Latest, true);
  const out: string[] = [];
  for (const statement of parsed.statements) {
    if (
      ts.isExportDeclaration(statement) &&
      !statement.exportClause &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      out.push(statement.moduleSpecifier.text);
    }
  }
  return out;
}

/**
 * Every name a module exports, paired with where the symbol actually lives.
 *
 * A component re-exporting its own lib — `export { isUnknown } from
 * "./lib/switch"` inside `switch.tsx` — is not a collision: it is one symbol
 * reachable by two paths, and TypeScript is happy with it. So a re-export is
 * attributed to its source rather than to the file doing the re-exporting,
 * which collapses the chain and leaves only genuine clashes.
 */
function exportedNames(file: string): Array<[name: string, origin: string]> {
  const source = readFileSync(file, "utf8");
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const names: Array<[string, string]> = [];
  const own = path.relative(ROOT, file);

  for (const statement of parsed.statements) {
    // `export { a, b } from "..."` and `export { a, b }`
    if (ts.isExportDeclaration(statement) && statement.exportClause) {
      const from =
        statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
          ? path.relative(ROOT, resolve(statement.moduleSpecifier.text, path.dirname(file)))
          : own;
      if (ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements)
          names.push([element.name.text, from]);
      }
      continue;
    }

    const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;
    const exported = modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;

    if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      statement.name
    ) {
      names.push([statement.name.text, own]);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.push([declaration.name.text, own]);
      }
    }
  }
  return names;
}

function resolve(specifier: string, from: string = path.dirname(BARREL)): string {
  const base = path.join(from, specifier);
  for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
    try {
      readFileSync(candidate);
      return candidate;
    } catch {
      /* next */
    }
  }
  throw new Error(`cannot resolve ${specifier} from ${path.relative(ROOT, from)}`);
}

describe("the npm barrel", () => {
  const source = readFileSync(BARREL, "utf8");
  const modules = starExports(source);

  it("re-exports the component modules with a star", () => {
    expect(modules.length).toBeGreaterThan(5);
  });

  it("has no two modules exporting the same name", () => {
    // Keyed by where the symbol lives, not by which module re-exported it.
    const owners = new Map<string, Set<string>>();
    for (const specifier of modules) {
      for (const [name, origin] of exportedNames(resolve(specifier))) {
        owners.set(name, (owners.get(name) ?? new Set()).add(origin));
      }
    }

    const collisions = [...owners.entries()]
      .filter(([, from]) => from.size > 1)
      .map(([name, from]) => `${name} — declared in ${[...from].join(" and ")}`)
      .sort();

    expect(
      collisions,
      "name the export for what it takes rather than for what it does: fromObservation, not fromFHIR",
    ).toEqual([]);
  });
});
