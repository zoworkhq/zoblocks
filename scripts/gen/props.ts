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
import type { PropDoc } from "@zoblocks/component-meta";
import { ROOT } from "./config";
import type { LoadedComponent } from "./load";

export interface ExtractedExport {
  /** The exported identifier, e.g. "ObservationPanel". */
  exportName: string;
  /** The component's own props. Inherited HTML attributes are summarised in `extendsType`. */
  props: PropDoc[];
  /** What the props interface extends, e.g. "React.HTMLAttributes<HTMLSpanElement>". */
  extendsType?: string;
  /**
   * The string-literal members of any prop whose type is a union of them,
   * by prop name.
   *
   * Not emitted anywhere. It exists so metadata that *names* a value — a
   * playground control's `options`, a variant's `args` — can be checked
   * against the values the type actually admits. The displayed type is the
   * alias (`TabVariant`), which reads better and proves nothing.
   */
  enums: Record<string, string[]>;
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

/**
 * The element type of an array prop, or the type itself.
 *
 * `T[] | undefined` on an optional prop is the common shape, so the undefined
 * arm is stripped before asking whether what remains is an array.
 */
function elementOfArray(checker: ts.TypeChecker, type: ts.Type): ts.Type {
  const arms = type.isUnion()
    ? type.types.filter((t) => !(t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)))
    : [type];
  if (arms.length !== 1) return type;

  const only = arms[0]!;
  const element = checker.getIndexTypeOfType(only, ts.IndexKind.Number);
  return checker.isArrayLikeType(only) && element ? element : type;
}

/**
 * The string-literal members of each prop whose type is a union of them.
 *
 * Read from the checker rather than from the rendered type string: the string
 * says `TabVariant`, which is the right thing to print and the wrong thing to
 * validate against. Only props declared in this repository are walked, for the
 * same reason the props table skips the ~280 inherited HTML attributes.
 */
function enumsFromType(checker: ts.TypeChecker, type: ts.Type, ownFile: string) {
  const enums: Record<string, string[]> = {};

  for (const symbol of checker.getPropertiesOfType(type)) {
    const declaration = symbol.declarations?.[0];
    if (!declaration || !isOwnSource(declaration.getSourceFile().fileName)) continue;

    /*
     * An array of literals counts.
     *
     * `methods?: CaptureMethod[]` has no literal members of its own, so
     * reading only the prop's own union would leave it unvalidated — and an
     * unvalidated array prop is where a playground control offers a value the
     * component then maps over and crashes on. The element type is what a
     * control's `options` are actually naming, so that is what is recorded.
     */
    const propType = elementOfArray(
      checker,
      checker.getTypeOfSymbolAtLocation(symbol, declaration),
    );
    if (!propType.isUnion()) continue;

    const literals: string[] = [];
    let onlyLiteralsAndUndefined = true;
    for (const member of propType.types) {
      if (member.isStringLiteral()) literals.push(member.value);
      else if (member.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)) continue;
      // A union mixing literals with `string` admits anything, so naming its
      // members would produce a check that rejects valid values.
      else onlyLiteralsAndUndefined = false;
    }

    if (onlyLiteralsAndUndefined && literals.length) enums[symbol.getName()] = literals;
  }

  void ownFile;
  return enums;
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

/**
 * The render function inside a wrapped component.
 *
 * `export const Switch = React.forwardRef<HTMLSpanElement, SwitchProps>(...)` is
 * a variable statement, not a function declaration, so a reader that only walks
 * function and class declarations sees no export at all — and emits an empty
 * prop table rather than failing. That is how Switch and Tabs, two of the
 * largest APIs in the library, came to document zero props on their own pages
 * while `pnpm gen` reported success.
 *
 * Unwrapping the call rather than reading the type arguments keeps one code
 * path for every component shape: whatever comes back is a function whose first
 * parameter is the props, which is exactly what the declaration branches
 * already hand to `propsFromType` and `defaultsFromParameter`. Nesting is
 * unwrapped too, so `memo(forwardRef(...))` reads the same as either alone.
 */
const COMPONENT_WRAPPERS = new Set(["forwardRef", "memo"]);

/**
 * `Object.assign(Root, { Item })` — the compound-component shape.
 *
 * Ant Design's own components are written this way and any primitive that
 * matches their API inherits it: `Timeline.Item`, `Tabs.TabPane`. The first
 * argument is a plain identifier pointing at a function declared above, so
 * unwrapping it needs one more hop than `forwardRef(...)` does — and without
 * that hop the component documents zero props while `pnpm gen` reports
 * success, which is exactly the failure this file was written to end.
 */
function isObjectAssign(callee: ts.Expression): boolean {
  return (
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(callee.expression) &&
    callee.expression.text === "Object" &&
    callee.name.text === "assign"
  );
}

/** The declaration an identifier refers to, resolved within its own file. */
function resolveInFile(
  name: string,
  sourceFile: ts.SourceFile,
): ts.Expression | ts.SignatureDeclaration | undefined {
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) return statement;
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
          return declaration.initializer;
        }
      }
    }
  }
  return undefined;
}

function unwrapComponent(
  node: ts.Expression | ts.SignatureDeclaration,
  sourceFile: ts.SourceFile,
  depth = 0,
): ts.SignatureDeclaration | undefined {
  // A cycle would be a component assigned to itself; bounded rather than
  // tracked, because the bound is also a readable limit on how wrapped a
  // component may be before it stops being documentable.
  if (depth > 6) return undefined;
  if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
    return node;
  }

  if (ts.isIdentifier(node)) {
    const resolved = resolveInFile(node.text, sourceFile);
    return resolved ? unwrapComponent(resolved, sourceFile, depth + 1) : undefined;
  }

  if (ts.isCallExpression(node)) {
    const callee = node.expression;
    const first = node.arguments[0];
    if (!first) return undefined;

    if (isObjectAssign(callee)) return unwrapComponent(first, sourceFile, depth + 1);

    const name = ts.isPropertyAccessExpression(callee)
      ? callee.name.text
      : ts.isIdentifier(callee)
        ? callee.text
        : undefined;
    if (!name || !COMPONENT_WRAPPERS.has(name)) return undefined;

    return unwrapComponent(first, sourceFile, depth + 1);
  }

  return undefined;
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
    components.flatMap((c) => [c.propsFile, ...c.extraPropsFiles]).filter(Boolean),
    compilerOptions(components),
  );
  const checker = program.getTypeChecker();
  const byComponent = new Map<string, ExtractedExport[]>();

  for (const component of components) {
    // The component's own file first: its first export is the one the docs
    // page leads with, and for a dispatch component that has to stay the
    // dispatch rather than whichever part happens to be declared first.
    const sourceFiles = [component.propsFile, ...component.extraPropsFiles]
      .filter(Boolean)
      .map((file) => program.getSourceFile(file))
      .filter((file): file is ts.SourceFile => file !== undefined);

    if (sourceFiles.length === 0) {
      byComponent.set(component.meta.name, []);
      continue;
    }

    const exports: ExtractedExport[] = [];

    for (const sourceFile of sourceFiles)
      for (const statement of sourceFile.statements) {
        if (!hasExportModifier(statement)) continue;

        if (ts.isFunctionDeclaration(statement) && statement.name) {
          const name = statement.name.text;
          if (!isComponentName(name)) continue;

          const parameter = statement.parameters[0];
          if (!parameter) {
            exports.push({ exportName: name, props: [], enums: {} });
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
            enums: enumsFromType(checker, propsType, component.sourceFile),
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
            enums: propsType ? enumsFromType(checker, propsType, component.sourceFile) : {},
          });
          continue;
        }

        // `export const Foo = forwardRef(...)` / `memo(...)` / `(props) => ...`.
        if (ts.isVariableStatement(statement)) {
          for (const declaration of statement.declarationList.declarations) {
            if (!ts.isIdentifier(declaration.name)) continue;
            const name = declaration.name.text;
            if (!isComponentName(name)) continue;

            const fn = declaration.initializer
              ? unwrapComponent(declaration.initializer, sourceFile)
              : undefined;
            if (!fn) continue;

            const parameter = fn.parameters[0];
            if (!parameter) {
              exports.push({ exportName: name, props: [], enums: {} });
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
              enums: enumsFromType(checker, propsType, component.sourceFile),
              ...(extendsType ? { extendsType } : {}),
            });
          }
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
