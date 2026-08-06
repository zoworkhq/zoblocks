/**
 * Extracts the public prop contract from TypeScript types.
 *
 * This exists so that no prop is ever written down twice. The previous
 * arrangement restated each component's props in prose in the docs catalog,
 * and nothing checked the restatement against the implementation — a prop table
 * is read as a contract, so one that has silently drifted is worse than none.
 *
 * Uses the TypeScript compiler API directly rather than react-docgen-typescript.
 * Under content/decisions/0009 every runtime dependency needs justification, and
 * `typescript` is already present; adding a wrapper around the API we would call
 * anyway is not worth a supply-chain entry.
 *
 * Props declared in the component's own file are "own"; anything reached through
 * an extended interface (React.HTMLAttributes and friends) is "inherited" and is
 * rendered collapsed, so the HTML surface does not bury the real API.
 */

import path from "node:path";
import ts from "typescript";
import type { PropDoc } from "@oxygenui-design/component-meta";
import { ROOT } from "./config";
import type { LoadedComponent } from "./load";

export interface ExtractedExport {
  /** The exported identifier, e.g. "ObservationPanel". */
  exportName: string;
  /** The component's own props. Inherited HTML attributes are summarised in `extendsType`. */
  props: PropDoc[];
  /** What the props interface extends, e.g. "React.HTMLAttributes<HTMLSpanElement>". */
  extendsType?: string;
}

/**
 * Compiler options are constructed here rather than read from tsconfig.json.
 *
 * The path mappings are derived from the component list, which is the same
 * derivation that produces tsconfig.generated.json. Reading the generated file
 * instead would make extraction depend on an artifact this run has not written
 * yet — and would make a stale mapping silently degrade the prop tables rather
 * than fail.
 */
function compilerOptions(components: LoadedComponent[]): ts.CompilerOptions {
  const paths: ts.MapLike<string[]> = {
    "@oxygenui-design/fhir": ["./packages/fhir/src/index.ts"],
    "@oxygenui-design/fixtures": ["./packages/fixtures/src/index.ts"],
    "@oxygenui-design/component-meta": ["./packages/component-meta/src/index.ts"],
    "@/lib/utils": ["./registry/oxygen/lib/utils.ts"],
  };

  for (const component of components) {
    paths[component.consumerSpecifier] = [`./${component.sourcePath.split(path.sep).join("/")}`];
  }

  return {
    target: ts.ScriptTarget.ES2022,
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    esModuleInterop: true,
    resolveJsonModule: true,
    baseUrl: ROOT,
    paths,
  };
}

/** A component export, as opposed to a hook or a helper. */
function isComponentName(name: string): boolean {
  return /^[A-Z]/.test(name);
}

function hasExportModifier(node: ts.Node): boolean {
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  );
}

/** `@default` in a doc comment, for props whose default is not a destructuring initialiser. */
function defaultFromJsDoc(symbol: ts.Symbol): string | undefined {
  for (const tag of symbol.getJsDocTags()) {
    if (tag.name === "default" || tag.name === "defaultValue") {
      const text = ts.displayPartsToString(tag.text ?? []).trim();
      if (text) return text;
    }
  }
  return undefined;
}

/**
 * Reads defaults out of the component's destructuring pattern —
 * `function StatusBadge({ tone = "neutral", size = "sm" })`.
 *
 * This is where defaults actually live in this codebase, and reading them from
 * the source means the documented default cannot disagree with the applied one.
 */
function defaultsFromParameter(parameter: ts.ParameterDeclaration): Map<string, string> {
  const defaults = new Map<string, string>();
  if (!ts.isObjectBindingPattern(parameter.name)) return defaults;

  for (const element of parameter.name.elements) {
    if (!element.initializer) continue;
    const key = element.propertyName ?? element.name;
    if (!ts.isIdentifier(key)) continue;
    defaults.set(key.text, element.initializer.getText().trim());
  }
  return defaults;
}

/** Collapses the whitespace tsc emits inside object and union types onto one line. */
function renderType(checker: ts.TypeChecker, type: ts.Type, at: ts.Node): string {
  return checker
    .typeToString(type, at, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType)
    .replace(/\s+/g, " ")
    .trim();
}

function propsFromType(
  checker: ts.TypeChecker,
  type: ts.Type,
  at: ts.Node,
  ownFile: string,
  defaults: Map<string, string>,
): PropDoc[] {
  const props: PropDoc[] = [];

  for (const symbol of checker.getPropertiesOfType(type)) {
    const declaration = symbol.declarations?.[0];
    if (!declaration) continue;

    // A prop declared in the component's own file is part of its designed API.
    // Anything reached through `extends React.HTMLAttributes<...>` is the HTML
    // surface — around 280 properties, none of them this component's design.
    // Those are summarised as a single `extendsType` line instead.
    if (path.resolve(declaration.getSourceFile().fileName) !== path.resolve(ownFile)) continue;

    const optional = (symbol.flags & ts.SymbolFlags.Optional) !== 0;
    const propType = checker.getTypeOfSymbolAtLocation(symbol, declaration);

    props.push({
      name: symbol.getName(),
      type: renderType(checker, propType, at),
      description: ts.displayPartsToString(symbol.getDocumentationComment(checker)).replace(/\s+/g, " ").trim(),
      required: !optional,
      ...(defaults.get(symbol.getName()) ?? defaultFromJsDoc(symbol)
        ? { default: defaults.get(symbol.getName()) ?? defaultFromJsDoc(symbol) }
        : {}),
    });
  }

  // Required first, then alphabetical. Stable regardless of declaration order,
  // so a reordering in source does not produce a diff in generated output.
  return props.sort((a, b) => {
    if (a.required !== b.required) return a.required ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * What the props interface extends, verbatim from the source.
 *
 * `Omit<React.HTMLAttributes<HTMLSpanElement>, "children">` says more in one
 * line than the 280 properties it resolves to say in a table.
 */
function extendsTypeOf(type: ts.Type, ownFile: string): string | undefined {
  const declaration = type.getSymbol()?.declarations?.find(
    (d) =>
      ts.isInterfaceDeclaration(d) &&
      path.resolve(d.getSourceFile().fileName) === path.resolve(ownFile),
  ) as ts.InterfaceDeclaration | undefined;

  const heritage = declaration?.heritageClauses?.find((c) => c.token === ts.SyntaxKind.ExtendsKeyword);
  if (!heritage) return undefined;

  return heritage.types
    .map((t) => t.getText().replace(/\s+/g, " ").trim())
    .join(", ");
}

/** The props type of a class component, read from `extends React.Component<Props>`. */
function classPropsType(checker: ts.TypeChecker, node: ts.ClassDeclaration): ts.Type | undefined {
  for (const clause of node.heritageClauses ?? []) {
    if (clause.token !== ts.SyntaxKind.ExtendsKeyword) continue;
    const typeArg = clause.types[0]?.typeArguments?.[0];
    if (typeArg) return checker.getTypeAtLocation(typeArg);
  }
  return undefined;
}

export function extractProps(components: LoadedComponent[]): Map<string, ExtractedExport[]> {
  const program = ts.createProgram(
    components.map((c) => c.sourceFile),
    compilerOptions(components),
  );
  const checker = program.getTypeChecker();
  const byComponent = new Map<string, ExtractedExport[]>();

  for (const component of components) {
    const sourceFile = program.getSourceFile(component.sourceFile);
    if (!sourceFile) {
      byComponent.set(component.meta.name, []);
      continue;
    }

    const exports: ExtractedExport[] = [];

    for (const statement of sourceFile.statements) {
      if (!hasExportModifier(statement)) continue;

      if (ts.isFunctionDeclaration(statement) && statement.name) {
        const name = statement.name.text;
        if (!isComponentName(name)) continue;

        const parameter = statement.parameters[0];
        if (!parameter) {
          exports.push({ exportName: name, props: [] });
          continue;
        }

        const propsType = checker.getTypeAtLocation(parameter);
        const extendsType = extendsTypeOf(propsType, component.sourceFile);

        exports.push({
          exportName: name,
          props: propsFromType(
            checker,
            propsType,
            parameter,
            component.sourceFile,
            defaultsFromParameter(parameter),
          ),
          ...(extendsType ? { extendsType } : {}),
        });
        continue;
      }

      if (ts.isClassDeclaration(statement) && statement.name) {
        const name = statement.name.text;
        if (!isComponentName(name)) continue;

        const propsType = classPropsType(checker, statement);
        exports.push({
          exportName: name,
          props: propsType
            ? propsFromType(checker, propsType, statement, component.sourceFile, new Map())
            : [],
        });
      }
    }

    byComponent.set(component.meta.name, exports);
  }

  return byComponent;
}

/**
 * Typechecks component source and returns diagnostics.
 *
 * Run as part of generation because these are the exact files copied into a
 * customer's project. Before this existed the root tsconfig covering them was
 * not run by any workspace task, and four components had unresolvable imports
 * that nothing reported.
 */
export function diagnoseComponents(components: LoadedComponent[]): string[] {
  const program = ts.createProgram(
    components.map((c) => c.sourceFile),
    compilerOptions(components),
  );

  const sources = new Set(components.map((c) => path.resolve(c.sourceFile)));

  return ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.file && sources.has(path.resolve(d.file.fileName)))
    .map((d) => {
      const message = ts.flattenDiagnosticMessageText(d.messageText, " ");
      if (!d.file || d.start === undefined) return message;
      const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
      return `${path.relative(ROOT, d.file.fileName)}(${line + 1},${character + 1}): ${message}`;
    });
}
