/**
 * Opening one documented example in StackBlitz.
 *
 * The project is built in the browser from the example's own code and handed
 * to StackBlitz with `openProject`, so what opens is the snippet the reader was
 * looking at and nothing else: a Create React App shell, the published
 * `@zoblocks/*` packages, and `src/Example.tsx`.
 *
 * Only examples in `RUNNABLE_EXAMPLES` get the button. Many examples are
 * fragments that lean on names the page never shows (`events`, `today`, a
 * fixture that is not on npm), and a button that opens a red screen inside
 * someone else's editor is worse than no button. The examples are not edited
 * to make them run; the ones that cannot are simply not offered.
 */

import sdk, { type Project } from "@stackblitz/sdk";

/*
 * Every example that compiles, as `component/example-id`, once turned into a
 * project by `exampleModule` below.
 *
 * Checked by writing each catalogue example through `stackBlitzProject`,
 * installing the dependencies it declares from npm, and running `tsc --noEmit`
 * with the project's own tsconfig. An example joins this list only with zero
 * errors. Re-check when the examples, the transform, or `VERSIONS` change.
 */
export const RUNNABLE_EXAMPLES: ReadonlySet<string> = new Set<string>([
  "accordion/disclosure",
  "allergy-chip/criticality-is-not-severity",
  "allergy-chip/intolerance",
  "allergy-chip/refuted",
  "breath-loader/patient-facing",
  "clinical-status/both-registers",
  "clinical-status/grid-affix",
  "clinical-status/hue-removed",
  "clinical-status/patient-register",
  "clinical-status/restricted-is-not-absent",
  "clinical-status/three-shapes",
  "helix-loader/lab-panel",
  "helix-loader/sizes",
  "helix-loader/slow-with-a-way-out",
  "infusion-loader/before-the-total",
  "infusion-loader/known-progress",
  "infusion-loader/live-import",
  "pulse-loader/below-forty",
  "recorder/held",
  "recorder/no-consent",
  "result-value/absence",
  "result-value/correction",
  "result-value/delta-suppressed",
  "rhythm-loader/cadence",
  "rhythm-loader/in-a-button",
  "rhythm-loader/reduced-motion",
  "switch/absence",
  "switch/anatomy-matrix",
  "switch/antd-surface",
  "switch/appearances",
  "switch/labeled-track",
  "switch/locked",
  "switch/panel",
  "switch/rtl",
  "switch/tones",
  "switch/without-colour",
  "tabs/segmented",
  "tabs/theme-density",
  "trend-indicator/noise",
  "trend-indicator/too-few",
]);

export function isRunnable(component: string, id: string): boolean {
  return RUNNABLE_EXAMPLES.has(`${component}/${id}`);
}

/*
 * The current npm versions. React is a range on purpose: an exact pin gives
 * antd a second copy of React and every hook in it throws "Invalid hook call".
 */
const VERSIONS: Readonly<Record<string, string>> = {
  react: "^19.0.0",
  "react-dom": "^19.0.0",
  "@zoblocks/react": "0.2.1",
  "@zoblocks/tokens": "0.2.1",
  "@zoblocks/tabs": "0.2.0",
  "@zoblocks/signature": "0.2.0",
  /*
   * `@zoblocks/react` imports these without declaring them, so the sandbox
   * has to.
   */
  "@zoblocks/identity": "0.2.0",
  "@zoblocks/copilot-react": "0.2.0",
  "@zoblocks/recorder-core": "0.2.0",
  antd: "^6.7.0",
};

const BASE_DEPENDENCIES = [
  "react",
  "react-dom",
  "@zoblocks/react",
  "@zoblocks/tokens",
  "@zoblocks/identity",
  "@zoblocks/copilot-react",
  "@zoblocks/recorder-core",
];

/* Without `react-jsx` StackBlitz compiles JSX to `React.createElement` and fails on "React is not defined". */
const TSCONFIG = {
  compilerOptions: {
    target: "es2020",
    lib: ["dom", "dom.iterable", "es2020"],
    module: "esnext",
    moduleResolution: "node",
    jsx: "react-jsx",
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
  },
};

/* The component packages that ship their own sheet beside `@zoblocks/react`'s. */
const STYLED_PACKAGES = new Set(["@zoblocks/tabs", "@zoblocks/signature", "@zoblocks/identity"]);

function indexFile(packages: Iterable<string>): string {
  const sheets = ["@zoblocks/tokens/zoblocks-tokens.css", "@zoblocks/react/styles.css"];
  for (const name of packages) if (STYLED_PACKAGES.has(name)) sheets.push(`${name}/styles.css`);
  return `import { createRoot } from "react-dom/client";
${sheets.map((sheet) => `import "${sheet}";`).join("\n")}
import Example from "./Example";

createRoot(document.getElementById("root")!).render(<Example />);
`;
}

const HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin: 0; padding: 24px">
    <div id="root"></div>
  </body>
</html>
`;

/* ------------------------------------------------------------------ */

const IMPORT = /^import\s[^;]*?["']([^"']+)["'];?[ \t]*(?:\r?\n|$)/gm;

/** The package an import specifier installs from: `@scope/name` or `name`. */
function packageOf(specifier: string): string | null {
  if (specifier.startsWith(".") || specifier.startsWith("@/")) return null;
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]!;
}

/** Names a snippet already has: imported, or declared at the top level. */
function boundNames(code: string): Set<string> {
  const names = new Set<string>();
  for (const [, clause] of code.matchAll(/^import\s+(?:type\s+)?([^;"']*?)\s+from\s/gm)) {
    for (const part of clause!.replace(/[{}]/g, ",").split(",")) {
      const name = part
        .trim()
        .split(/\s+as\s+/)
        .pop()!
        .replace(/^type\s+|^\*\s*/, "")
        .trim();
      if (name) names.add(name);
    }
  }
  for (const [, name] of code.matchAll(
    /^(?:export\s+)?(?:function|const|let|var|class)\s+([\w$]+)/gm,
  )) {
    names.add(name!);
  }
  return names;
}

/**
 * The example as a module whose default export renders it.
 *
 * A full module only has its registry imports pointed at the published
 * package. A snippet — imports, maybe a few declarations, then bare JSX — has
 * its JSX wrapped in `export default function Example()`, and the components
 * it renders without importing are imported from `from` — the component's
 * package, or `@zoblocks/react` for a registry component — as the page around
 * it would have.
 */
export function exampleModule(code: string, from = "@zoblocks/react"): string {
  const source = code.replace(/(["'])@\/components\/zoblocks\/[^"']+\1/g, '"@zoblocks/react"');
  if (/^export\s+default\b/m.test(source)) return source;

  const imports = [...source.matchAll(IMPORT)].map((match) => match[0].trimEnd());
  const body = source.replace(IMPORT, "").replace(/^\s*\n/, "");

  /* The JSX starts at the first top-level line that opens an element or an expression. */
  const lines = body.split("\n");
  const start = lines.findIndex((line) => /^[<{]/.test(line));
  if (start < 0) return source;
  const preamble = lines.slice(0, start).join("\n").trimEnd();
  const jsx = lines
    .slice(start)
    .join("\n")
    .trimEnd()
    .replace(/;$/, "")
    .split("\n")
    // A top-level `//` line would render as text inside the fragment.
    .map((line) => line.replace(/^\/\/\s?(.*)$/, "{/* $1 */}"))
    .map((line) => (line.trim() ? `      ${line}` : ""))
    .join("\n");

  const bound = boundNames(source);
  const rendered = new Set<string>();
  for (const [, tag] of jsx.matchAll(/(?<![\w$.)\]])<([A-Z][\w$]*)/g)) {
    if (!bound.has(tag!)) rendered.add(tag!);
  }
  if (rendered.size) imports.push(`import { ${[...rendered].join(", ")} } from "${from}";`);

  return [
    imports.join("\n"),
    preamble,
    `export default function Example() {\n  return (\n    <>\n${jsx}\n    </>\n  );\n}`,
  ]
    .filter(Boolean)
    .join("\n\n")
    .concat("\n");
}

export interface SandboxExample {
  component: string;
  id: string;
  title: string;
  code: string;
  /** The package a package-distributed component installs from; registry components ship in `@zoblocks/react`. */
  packageName?: string;
}

/** The whole StackBlitz project for one example. */
export function stackBlitzProject(example: SandboxExample): Project {
  const source = exampleModule(example.code, example.packageName);
  const imported = new Set<string>();
  for (const [, specifier] of source.matchAll(IMPORT)) {
    const name = packageOf(specifier!);
    if (name) imported.add(name);
  }
  const dependencies: Record<string, string> = {};
  for (const name of new Set([...BASE_DEPENDENCIES, ...imported])) {
    dependencies[name] = VERSIONS[name] ?? "latest";
  }

  return {
    title: `ZoBlocks ${example.component} — ${example.title}`,
    description: `The "${example.title}" example from zoblocks.design/components/${example.component}.`,
    template: "create-react-app",
    dependencies,
    files: {
      "public/index.html": HTML,
      "src/index.tsx": indexFile(imported),
      "src/Example.tsx": source,
      "tsconfig.json": `${JSON.stringify(TSCONFIG, null, 2)}\n`,
    },
  };
}

/* ------------------------------------------------------------------ */

export interface DemoLink {
  id: string;
  label: string;
  /** Two-letter mark drawn in the button, as on the design. */
  mark: string;
  title: string;
  open: () => void;
}

/**
 * The button for one example, or none when the example cannot run.
 *
 * CodeSandbox is not offered: its demos are on hold. `openProject` runs inside
 * the click, not after an await, so the browser lets it open the new window.
 */
export function exampleLinks(example: SandboxExample): DemoLink[] {
  if (!isRunnable(example.component, example.id)) return [];
  return [
    {
      id: "stackblitz",
      label: "StackBlitz",
      mark: "SB",
      title: `Open the ${example.title} example in StackBlitz`,
      open: () =>
        sdk.openProject(stackBlitzProject(example), {
          openFile: "src/Example.tsx",
          newWindow: true,
        }),
    },
  ];
}
