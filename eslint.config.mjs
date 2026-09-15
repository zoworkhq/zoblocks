/**
 * Workspace lint configuration.
 *
 * Scoped deliberately. The strict component rules apply to source that is
 * shipped to customers; the docs site is a marketing surface with different
 * constraints (it may fetch, it may log) and the generator is a build tool.
 * Applying one ruleset everywhere would mean weakening it to the loosest case.
 *
 * See ARCHITECTURE.md §2 for the layer model these rules enforce.
 */

import next from "@next/eslint-plugin-next";
import js from "@eslint/js";
import zoblocks from "@zoblocks/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      /*
       * `next export` output, the static twin of `.next/`. Gitignored like the
       * others but missed here, so linting a tree that had been built reported
       * 5,122 errors in minified vendor bundles — `self is not defined`, on one
       * line of someone else's compiled JavaScript.
       *
       * CI never saw it because `pnpm lint` runs before `pnpm build` there. It
       * fails only on a machine that has built, which includes every machine
       * running a release: `pnpm release` builds, and `pnpm verify` afterwards
       * then lints the output of the build it just made.
       */
      "**/out/**",
      /*
       * Agent worktrees — checkouts of this same repository under a scratch
       * directory. Linting them counts every warning in the repo once per
       * worktree, so three stale checkouts put the `--max-warnings` ratchet
       * four times over budget on a tree whose own source was clean. CI never
       * has them, which is the worst version of this: the gate fails only on
       * the machine where the work is being done.
       */
      ".claude/worktrees/**",
      /*
       * Brief generators. `content/archive/briefs/<name>/*.js` are standalone
       * browser scripts inlined into a design document by a Python build — not
       * library source, not bundled, and not typed. Linting them as if they
       * were reports `window is not defined` on prose. The Python and the
       * Markdown beside them are already outside eslint's reach; this puts the
       * JS with them.
       *
       * They moved under `content/archive/` with the rest of the pre-rename
       * record in September 2026, and the whole directory is frozen, so the
       * ignore covers it rather than just the briefs.
       */
      "content/archive/**",
      // Generated. Lint the generator, not its output.
      "apps/docs/src/lib/generated/**",
      "apps/docs/public/**",
      // Written by Next on every build.
      "apps/docs/next-env.d.ts",
      "apps/hq/next-env.d.ts",
      "zoblocks-ui-component-library-proposal.html",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // -------------------------------------------------------------------------
  // Component source — everything copied into a customer's repository.
  // -------------------------------------------------------------------------
  {
    // Everything that reaches a customer, through either channel.
    //
    // This used to name `packages/react/**` and `packages/pro-*/**`, neither of
    // which exists — so `packages/loaders`, the one package actually published,
    // received none of these rules. `eslint --print-config` reported
    // "@zoblocks rules applied: NONE" for the source shipped to every non-React
    // framework. Globs that match nothing fail silently, which is why the
    // negation below names what is excluded rather than listing what is included.
    files: [
      "registry/**/*.{ts,tsx}",
      "packages/*/src/**/*.{ts,tsx}",
      "packages/pro-*/**/*.{ts,tsx}",
    ],
    ignores: [
      // Build tooling and fixtures, not shipped component source.
      "packages/eslint-plugin/**",
      "packages/component-meta/**",
      "packages/fixtures/**",
      "packages/tsconfig/**",
      "**/*.test.{ts,tsx}",
    ],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      "@zoblocks": zoblocks,
      "react-hooks": reactHooks,
      // Components carry Next-specific disable directives so they lint
      // cleanly inside a consumer's Next app. The rules have to be live here
      // for those directives to mean anything — an unregistered rule name is
      // an error, and a registered-but-disabled one makes the directive dead.
      "@next/next": next,
    },
    rules: {
      ...zoblocks.configs.components.rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // A registry component renders in plain React, Vite, and Next alike, so
      // it uses <img> deliberately and says so at the call site. Live here so
      // that acknowledgement is a real suppression rather than a stale comment.
      "@next/next/no-img-element": "warn",

      // A component that throws on a malformed payload takes the chart down
      // with it. Explicit handling, never a silent non-null assertion.
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],

      // `new Date()` inside a component makes its rendering depend on
      // wall-clock time: visual-regression baselines drift, and "is this
      // timestamp in the future" cannot be tested. Clinical time should be a
      // prop.
      //
      // Ten components read the clock today, so this is a warning. It becomes
      // an error in Phase 2, when visual regression lands and the determinism
      // actually starts costing something. Promoting it before then would
      // just teach people to ignore the output.
      "no-restricted-syntax": [
        "warn",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message:
            "Reading the current time inside a component makes it untestable and breaks visual-regression determinism. Take the time as a prop.",
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message:
            "Reading the current time inside a component makes it untestable and breaks visual-regression determinism. Take the time as a prop.",
        },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // Metadata files. Data, not code.
  // -------------------------------------------------------------------------
  {
    files: ["**/*.meta.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // -------------------------------------------------------------------------
  // The Figma plugin is an application, not shipped component source.
  //
  // It matches `packages/*/src/**` and gets the component rules, and one of
  // them is actively wrong here: `no-forbidden-capability` refuses network
  // calls because data fetching belongs to the application rather than to a
  // component (ARCHITECTURE.md §14). This *is* the application — a plugin whose
  // whole iframe exists to talk to the app — so the rule would be arguing
  // with the architecture rather than enforcing it.
  //
  // Turned off by name rather than by ignoring the package, so the rest stay
  // live. The claim the rule was standing in for is asserted directly instead:
  // `test/manifest.test.ts` holds the sandbox to no `fetch` at all, and the
  // client to three URLs and one POST.
  // -------------------------------------------------------------------------
  {
    files: ["packages/figma-plugin/**/*.ts"],
    rules: { "@zoblocks/no-forbidden-capability": "off" },
  },

  // -------------------------------------------------------------------------
  // The CLI is a Node binary, not shipped component source.
  //
  // It matches `packages/*/src/**` and inherits the component rules, two of
  // which it must break to do its job: it reads `process.env` to expand the
  // `${ZOBLOCKS_TOKEN}` reference out of `zoblocks.json`, and it fetches registry
  // items over the network. Both are the entire point of an installer, and the
  // rule they violate exists to protect *copied component source* — code that
  // lands in a customer's repository, where their build has neither our
  // environment nor a reason to make requests.
  //
  // Off by name rather than by ignoring the package, so everything else stays
  // live. The claims that matter here are asserted directly instead:
  // `test/cli.test.ts` holds target resolution to paths inside the project and
  // refuses a token written literally into a committed file.
  // -------------------------------------------------------------------------
  {
    files: ["packages/cli/**/*.ts", "packages/cli/**/*.mjs"],
    rules: { "@zoblocks/no-forbidden-capability": "off" },
  },

  // -------------------------------------------------------------------------
  // Build tooling. Runs in Node, may read the environment and write output.
  // -------------------------------------------------------------------------
  {
    files: [
      "scripts/**/*.ts",
      // Root-level node scripts had no entry here at all, so `flaky.mjs`
      // linted against browser globals and failed on `process`.
      "scripts/**/*.mjs",
      "*.config.{mjs,ts}",
      ".dependency-cruiser.cjs",
      "packages/eslint-plugin/**/*.js",
      // Per-package tooling: the fhir publish guard and dist rewriter, the hq
      // dev seed and its drizzle config. Same job, same environment.
      "packages/*/scripts/**/*.mjs",
      "apps/*/scripts/**/*.mjs",
      "apps/*/*.config.{mjs,ts}",
    ],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: "commonjs",
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      // Build tooling talks to untyped third-party output (axe results, CLI
      // JSON). Narrowing that is not where the risk is.
      "@typescript-eslint/no-explicit-any": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  // -------------------------------------------------------------------------
  // Our own product surfaces — the docs site and the console.
  //
  // These had no @zoblocks rules at all, and that is exactly where the content
  // rules were being broken: the console's root error boundary opened with
  // "Something went wrong", and four page descriptions carried counts that had
  // been accurate months earlier. `configs.components` is scoped to
  // `registry/**` and `packages/*/src/**`, so it never reached either.
  //
  // `configs.product` is two rules rather than the whole component preset —
  // see the note beside it. The rest of the clinical rules would be noise on a
  // pricing page, and a preset that fires on the wrong things gets turned off.
  // -------------------------------------------------------------------------
  {
    files: ["apps/docs/**/*.{ts,tsx}", "apps/app/**/*.{ts,tsx}"],
    ignores: [
      "**/*.test.{ts,tsx}",
      /*
       * Demo modules are exempt from `no-hardcoded-count`, and the distinction
       * is real rather than convenient.
       *
       * A page that says "27 components" asserts a total this repository can
       * compute, and it goes stale on its own. A demo panel labelled "Nine
       * states, one green dot" is describing the nine things in *that panel* —
       * a curated set the author chose, which no expression can derive — and a
       * fixture reading "24 items across 3 shipments" is invented delivery
       * data. Deriving either would make it wrong.
       *
       * The rule cannot tell those apart from the string alone, so the scope
       * does it. Everything here is a demo definition; everything outside it is
       * a page, a page description, or the data one reads from.
       */
      "apps/docs/src/components/site/component-preview.tsx",
      "apps/docs/src/components/site/*-gallery.tsx",
      "apps/docs/src/components/site/*-demo.tsx",
      "apps/docs/src/components/site/*-showcase.tsx",
      "apps/docs/src/components/blocks/**",
    ],
    ...zoblocks.configs.product,
  },

  // -------------------------------------------------------------------------
  // Docs site. A marketing surface, not a shipped component.
  // -------------------------------------------------------------------------
  {
    files: ["apps/docs/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks, "@next/next": next },
    rules: {
      ...next.configs.recommended.rules,
      "react-hooks/rules-of-hooks": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },

  // -------------------------------------------------------------------------
  // hq. Internal tool, not shipped to anyone — but it is the dogfood consumer
  // of the registry, so it is held to the same rules as the docs site rather
  // than exempted for being internal.
  // -------------------------------------------------------------------------
  {
    files: ["apps/hq/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks, "@next/next": next },
    rules: {
      ...next.configs.recommended.rules,
      "react-hooks/rules-of-hooks": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
);
