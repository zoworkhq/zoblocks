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
import oxygen from "@oxygenui-design/eslint-plugin";
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
      // Generated. Lint the generator, not its output.
      "apps/docs/src/lib/generated/**",
      "apps/docs/public/**",
      // Written by Next on every build.
      "apps/docs/next-env.d.ts",
      "apps/hq/next-env.d.ts",
      "oxygen-ui-component-library-proposal.html",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // -------------------------------------------------------------------------
  // Component source — everything copied into a customer's repository.
  // -------------------------------------------------------------------------
  {
    files: ["registry/**/*.{ts,tsx}", "packages/react/**/*.{ts,tsx}", "packages/pro-*/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      "@oxygenui": oxygen,
      "react-hooks": reactHooks,
      // Components carry Next-specific disable directives so they lint
      // cleanly inside a consumer's Next app. The rules have to be live here
      // for those directives to mean anything — an unregistered rule name is
      // an error, and a registered-but-disabled one makes the directive dead.
      "@next/next": next,
    },
    rules: {
      ...oxygen.configs.components.rules,
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
  // Build tooling. Runs in Node, may read the environment and write output.
  // -------------------------------------------------------------------------
  {
    files: [
      "scripts/**/*.ts",
      "*.config.{mjs,ts}",
      "packages/eslint-plugin/**/*.js",
      // Per-package tooling: the fhir publish guard and dist rewriter, the hq
      // dev seed and its drizzle config. Same job, same environment.
      "packages/*/scripts/**/*.mjs",
      "apps/*/scripts/**/*.mjs",
      "apps/*/*.config.{mjs,ts}",
    ],
    languageOptions: {
      globals: { ...globals.node },
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
