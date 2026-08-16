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
import { WORKSPACE_ALIASES } from "./emit/tsconfig-paths";
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
  // Shared with the emitted tsconfig.generated.json rather than restated. A
  // second copy of this map drifts the first time a support module is added.
  const paths: ts.MapLike<string[]> = { ...WORKSPACE_ALIASES };

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

/**
 * Is this declaration ours, or something we inherited from a dependency?
 *
 * "Ours" means it is inside the repository and not inside node_modules — which
 * covers `registry/` today and `packages/react/` after Phase 1, without either
 * path being named here.
 */
function isOwnSource(fileName: string): boolean {
  const resolved = path.resolve(fileName);
  if (resolved.split(path.sep).includes("node_modules")) return false;
  return resolved.startsWith(path.resolve(ROOT) + path.sep);
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

/**
 * Type text fit to publish: one line, and no filesystem paths.
 *
 * TypeScript prints a type imported from another module as
 * `import("/abs/path/to/module").LoaderAnnounce`, with the path *absolute* and
 * machine-specific. Three things go wrong if that reaches the output:
 *
 *   1. **The generated catalog can never be stable.** It differs on every
 *      machine, so the "no stale generated files" check fails for everyone
 *      whose checkout is not at the same path — which is how this was found,
 *      as a 44-line diff between a laptop and CI.
 *   2. **It publishes the author's home directory.** The catalog is rendered
 *      on the docs site, so `/Users/<name>/...` ends up on a public page.
 *   3. **It is unreadable.** A props table should say `LoaderAnnounce`, not a
 *      path to the file that declares it.
 *
 * Stripping the wrapper leaves exactly the name a reader wants. It is done on
 * the text rather than with a TypeFormatFlag because no flag suppresses it:
 * `UseFullyQualifiedType` controls qualification, not the `import(...)` form,
 * which tsc emits whenever the type has no local alias in scope.
 */
const IMPORT_PATH = /\bimport\((?:"[^"]*"|'[^']*')\)\./g;

function renderType(checker: ts.TypeChecker, type: ts.Type, at: ts.Node): string {
  return checker
    .typeToString(
      type,
      at,
      ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType,
    )
    .replace(IMPORT_PATH, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Drop a trailing `| undefined` from a union, leaving everything else alone.
 *
 * Text rather than type surgery: `getNonNullableType` would also strip `null`,
 * which is a value a prop can meaningfully accept and distinct from being
 * absent — `background: string | null` on the rasteriser means "deliberately
 * transparent", not "unset".
 */
function withoutUndefined(type: string): string {
  const parts = type.split(" | ").filter((part) => part !== "undefined");
  return parts.length ? parts.join(" | ") : type;
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

    // A prop this repository declares is part of the designed API, wherever in
    // the repository it lives. Anything reached through
    // `extends React.HTMLAttributes<...>` is the HTML surface — around 280
    // properties, none of them this component's design — and is summarised as a
    // single `extendsType` line instead.
    //
    // This used to compare against the component's OWN file. That was correct
    // while every prop was declared beside its component, and silently wrong
    // the moment a shared interface appeared: PulseLoader documented one prop
    // (`bpm`) and hid the twenty in `LoaderCommonProps`, because that interface
    // lives in lib/loader.tsx. The docs said a loader took no label, no mode,
    // and no progress. The boundary that matters is ours-versus-vendored, not
    // this-file-versus-that-file.
    if (!isOwnSource(declaration.getSourceFile().fileName)) continue;

    const optional = (symbol.flags & ts.SymbolFlags.Optional) !== 0;
    const propType = checker.getTypeOfSymbolAtLocation(symbol, declaration);

    props.push({
      name: symbol.getName(),
      // `| undefined` is dropped from an optional prop's type.
      //
      // tsc reports `Capacity[] | undefined` for `capacities?: Capacity[]`,
      // which is true and useless in a table that already has a column for
      // whether a prop is required — it repeats that fact on every row and
      // pushes the part a reader came for off the edge on narrow screens. It
      // is only stripped when the prop is optional, so a required prop that
      // genuinely accepts `undefined` still says so.
      type: optional
        ? withoutUndefined(renderType(checker, propType, at))
        : renderType(checker, propType, at),
      description: ts
        .displayPartsToString(symbol.getDocumentationComment(checker))
        .replace(/\s+/g, " ")
        .trim(),
      required: !optional,
      ...((defaults.get(symbol.getName()) ?? defaultFromJsDoc(symbol))
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
  const declaration = type
    .getSymbol()
    ?.declarations?.find(
      (d) =>
        ts.isInterfaceDeclaration(d) &&
        path.resolve(d.getSourceFile().fileName) === path.resolve(ownFile),
    ) as ts.InterfaceDeclaration | undefined;

  const heritage = declaration?.heritageClauses?.find(
    (c) => c.token === ts.SyntaxKind.ExtendsKeyword,
  );
  if (!heritage) return undefined;

  return heritage.types.map((t) => t.getText().replace(/\s+/g, " ").trim()).join(", ");
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
  // `propsFile`, not `sourceFile`: a package component has no registry source
  // and still has a public API to document.
  const program = ts.createProgram(
    components.map((c) => c.propsFile).filter(Boolean),
    compilerOptions(components),
  );
  const checker = program.getTypeChecker();
  const byComponent = new Map<string, ExtractedExport[]>();

  for (const component of components) {
    const sourceFile = component.propsFile ? program.getSourceFile(component.propsFile) : undefined;
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
