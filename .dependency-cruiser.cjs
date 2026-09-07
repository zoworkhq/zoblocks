/**
 * The layer rule, made executable.
 *
 * ARCHITECTURE.md §2 says dependencies point away from the domain and that this
 * is "enforced, not documented — an architecture rule that is only written down
 * is a suggestion". It was, in fact, only written down. This is the enforcement.
 *
 *   L0 foundation   tokens · fhir · intl        no React, no DOM assumptions
 *   L1 behaviour    the loading gate, ARIA contracts
 *   L2 components   react · loaders · registry
 *   L3 composition  blocks and patterns
 *   L4 distribution registry JSON, npm, docs
 *
 * A module may import from its own layer or below, never above.
 */

module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "A cycle means neither module can be understood, tested, or replaced on its own.",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment: "A module nothing imports is either dead or a missing wiring.",
      from: {
        orphan: true,
        pathNot: [
          "\\.d\\.ts$",
          "(^|/)\\.[^/]+\\.(js|cjs|mjs|ts)$",
          "\\.config\\.(js|cjs|mjs|ts)$",
          // Entry points and build tooling are reached by npm scripts and by
          // package `exports`, not by an import from inside the graph.
          "^packages/[^/]+/scripts/",
          "^packages/[^/]+/test/setup\\.ts$",
          "^packages/tokens/src/tokens\\.ts$",
        ],
      },
      to: {},
    },
    {
      name: "l0-holds-no-react",
      severity: "error",
      comment:
        "packages/{tokens,fhir} are L0. They must be consumable by a Vue app, a server, or a test harness — ARCHITECTURE.md §2.",
      from: { path: "^packages/(tokens|fhir)/src" },
      to: { path: "^(react|react-dom)$", dependencyTypes: ["npm", "npm-dev", "npm-peer"] },
    },
    {
      name: "no-upward-imports",
      severity: "error",
      comment:
        "A lower layer importing a higher one inverts the dependency direction the whole topology rests on.",
      from: { path: "^packages/(tokens|fhir|intl)/src" },
      to: { path: "^packages/(react|loaders)/src" },
    },
    {
      name: "components-do-not-import-apps",
      severity: "error",
      comment: "Shipped source must never depend on an application in this repository.",
      from: { path: "^(packages|registry)/" },
      to: { path: "^apps/" },
    },
    {
      name: "registry-is-self-contained",
      severity: "error",
      comment:
        "Registry *implementation* files are copied verbatim into a customer's project, so a workspace import compiles here and fails there. Scoped to what is actually shipped: `meta.files` in each component's metadata lists the .tsx and the .css, never the .meta.ts, .stories.tsx, or .test.tsx — those are build-time inputs and may import from the workspace freely.",
      from: {
        path: "^registry/",
        pathNot: "\\.(meta|test|stories)\\.(ts|tsx)$",
      },
      to: {
        path: "^packages/",
        // `@zoblocks/fhir` is the one exception, and it is a resolution
        // artefact rather than a real coupling: the package is published, and
        // every registry item that imports it declares it in `dependencies`, so
        // the ZoBlocks CLI installs it and the specifier resolves from npm in the
        // customer's project. It only appears here as a workspace path because
        // the package's `main` points at `src` for this repository's benefit,
        // where every other published package points at `dist`.
        pathNot: "^packages/fhir/src",
        dependencyTypes: ["local"],
      },
    },
    {
      name: "host-react-stays-at-composition",
      severity: "error",
      comment:
        "ADR 0010 keeps ZoBlocks's primitives at Ant Design's API and free of any dependency on it, which is what preserves copy-as-source distribution for the whole form family (ADR 0002). `@zoblocks/host-react` imports antd and MUI behind its subpath exports; the moment a component or a registry item reaches it, both frameworks enter the graph of everything downstream and that channel closes. It belongs to composition — apps and demos — and nothing below.",
      from: {
        path: "^(packages/(?!host-react)[^/]+/src|registry)/",
      },
      to: {
        /*
         * Two spellings, because only one of them is a file path.
         *
         * `registry/` is not inside any package, so `@zoblocks/host-react`
         * does not resolve from there at all — dependency-cruiser reports the
         * bare specifier with `dependencyTypes: ["unknown"]`, and a rule matching
         * only `^packages/host-react/` silently never fires. That was the first
         * version of this rule, and it passed a deliberate violation.
         */
        path: "^packages/host-react/|^@zoblocks/host-react($|/)",
      },
    },
    {
      name: "no-framework-in-zoblocks-host",
      severity: "error",
      comment:
        "The ZoBlocks host is the switch's third state and its whole claim is that it is ours: structure of our own, drawn from `--zb-*`. A framework import here would make it antd or MUI wearing our colours, and the switcher would be comparing two things that were the same thing.",
      from: { path: "^packages/host-react/src/(primitives-zoblocks|contract|context|index)\\." },
      to: { path: "node_modules/(antd|@mui|@ant-design)/" },
    },
    {
      name: "no-dev-dep-in-shipped-source",
      severity: "error",
      comment:
        "A devDependency imported by shipped source is a runtime failure in a consumer's build.",
      from: {
        path: "^(packages/(react|loaders|tokens|fhir|intl)/src|registry)/",
        pathNot: "\\.(test|stories)\\.(ts|tsx)$",
      },
      to: { dependencyTypes: ["npm-dev"] },
    },
    {
      name: "not-to-deprecated",
      severity: "error",
      from: {},
      to: { dependencyTypes: ["deprecated"] },
    },
  ],

  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(node_modules|dist|\\.next|\\.turbo|coverage)(/|$)" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "types", "default"],
      extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
