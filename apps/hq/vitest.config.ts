import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * hq's tests run against a real MongoDB.
 *
 * `mongodb-memory-server` starts an actual mongod, so unique indexes, TTL
 * behaviour, and the duplicate-key error code are the real ones. A mocked
 * driver would assert that this code calls the functions it calls, which is not
 * the same as asserting it is correct — and the guarantees under test here
 * (an index deciding a race, a $ne filter sparing one session) live in the
 * database, not in the call.
 */
export default defineConfig({
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
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
    // One mongod, shared. Starting one per file costs seconds each; the setup
    // file drops every collection between tests instead, which is faster and
    // makes cross-test leakage impossible rather than unlikely.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
