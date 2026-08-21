import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * The app's tests run against a real MongoDB.
 *
 * `mongodb-memory-server` starts an actual mongod, so unique indexes, TTL
 * behaviour, and the duplicate-key error code are the real ones. A mocked
 * driver would assert that this code calls the functions it calls, which is not
 * the same as asserting it is correct — and the guarantees under test here
 * (an index deciding a race, a $ne filter sparing one session) live in the
 * database, not in the call.
 */
export default defineConfig({
  /*
   * Next requires `jsx: "preserve"` at the app root because it runs its own
   * transform, and Vite cannot parse the result — the kit's components fail to
   * load with "invalid JS syntax". Setting the runtime here covers the whole
   * test graph, source components included, without touching the build.
   *
   * `oxc` rather than the older `esbuild` key: Vite 8 moved the transform and
   * warns that `esbuild` is deprecated.
   */
  oxc: { jsx: { runtime: "automatic" } },

  resolve: {
    alias: {
      // Next's request-scoped modules do not exist outside a request.
      "next/headers": path.resolve(__dirname, "test/stubs/next-headers.ts"),
      "next/navigation": path.resolve(__dirname, "test/stubs/next-navigation.ts"),
      "next/cache": path.resolve(__dirname, "test/stubs/next-cache.ts"),
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      /*
       * The logic, not the screens.
       *
       * `src/app` is React pages, exercised by the E2E suite and by looking at
       * them; measuring them here would report a number that moves when
       * somebody changes a heading. What this floor protects is the part where
       * being wrong is invisible: the scope layer that makes a cross-tenant
       * read impossible, the role table, and the theme lifecycle that decides
       * whether a failing palette can reach a customer's application.
       */
      include: ["src/lib/**/*.ts", "src/db/**/*.ts"],
      exclude: [
        "src/lib/utils.ts",
        "**/*.d.ts",
        /*
         * Three exclusions, each with a reason that is not "it was hard".
         *
         * `auth.ts` is hq's file with `User` renamed to `Member` and an
         * `orgId` added — eleven differing lines against 42 tests in
         * `apps/hq/src/lib/auth.test.ts`. Re-testing bcrypt rounds and TTL
         * sweeps here would duplicate that suite, and the duplicate is the one
         * that would rot.
         *
         * The password-reset functions at the bottom of it are the exception:
         * they are this product's, not hq's — an administrator mints a link by
         * hand because there is no mailer, and the guards around that (single
         * use, expiry, a grant dying with the account it was issued for, every
         * session destroyed on spend) are app decisions. `test/reset.ts`
         * covers them directly. They are still inside an excluded file, so
         * that suite moves none of the numbers below; it is here because the
         * behaviour is worth a regression test, not to buy coverage.
         */
        "src/lib/auth.ts",
        /*
         * `actions.ts` is `"use server"` wrappers that authorise, parse, and
         * turn a thrown error into something a form can render. Every one of
         * them needs a Next request scope. The operations they wrap live in
         * `themes.ts` precisely so the lifecycle is testable without one, and
         * that file is at 96%.
         */
        "src/lib/actions.ts",
        /** A fourteen-line `cache()` wrapper around the token loader. */
        "src/lib/base-tokens.ts",
      ],
      /*
       * Set at what the suite already clears, so it ratchets rather than
       * aspires — the same rule the root config states. Raise these; never
       * lower one to make a build pass.
       *
       * Branches sits lower than the rest and the gap is honest: `auth.ts` came
       * from hq with its own reset and throttling paths, and this suite drives
       * sign-in rather than every branch of password recovery.
       *
       * Ratcheted from 90/90/80/90 once the asset store, the marketplace and
       * the webhook route were covered. Doing that is the whole point of the
       * rule above — a floor left at what the suite cleared two features ago
       * stops being a floor and becomes a decoration.
       */
      thresholds: { lines: 96, functions: 95, branches: 87, statements: 94 },
    },
    /*
     * jsdom, not node.
     *
     * The kit's contracts are accessibility contracts — a hint bound with
     * `aria-describedby`, a disabled control that stays focusable, a chip that
     * carries a word rather than only a colour. Every one of those is a
     * property of rendered DOM, and none of them can be checked by reading the
     * source.
     */
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts", "./test/ui/setup.ts"],
    // One mongod, shared. Starting one per file costs seconds each; the setup
    // file drops every collection between tests instead, which is faster and
    // makes cross-test leakage impossible rather than unlikely.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
