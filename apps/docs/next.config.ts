import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /*
   * Two ways in, because the packages resolve differently.
   *
   * `fhir`, `fixtures` and the signature packages import without extensions,
   * so Turbopack can follow them straight into `src` — they are transpiled
   * from source and a change shows up here without a build. (Their published
   * output is still valid Node ESM: a post-build pass adds the extensions to
   * `dist` only, which is why the source can stay bundler-friendly.)
   *
   * The tab and copilot packages are NodeNext ESM, so their relative imports
   * carry `.js` extensions that resolve to `.ts`/`.tsx` on disk — correct for
   * Node, and unresolvable to Turbopack, which takes the specifier literally
   * and has no `extensionAlias`. They are aliased to `dist` instead, which is
   * the better answer for them anyway: the docs render the exact artefact
   * published to npm rather than a separately-compiled copy of it, so a build
   * that works here is evidence the package works. Turbo guarantees the order —
   * this app depends on all of them, and `build` declares
   * `dependsOn: ["^build"]`.
   *
   * Every NodeNext workspace package the docs import needs an entry here. A
   * missing one is not a subtle failure — the module simply does not resolve,
   * and the page that imports it 500s — but it is only discovered by importing
   * the package, which is how Copilot reached this app without one.
   */
  transpilePackages: [
    "@zoblocks/component-meta",
    /*
     * `@zoblocks/tokens` publishes `./validate` as TypeScript source, and the
     * Pro page's demo imports `generateRamp` and `contrastBetween` from it so
     * the numbers on that page are the console's own rather than a mock-up.
     * Its relative imports carry no extensions, so it transpiles from source
     * rather than needing an alias to `dist` like the NodeNext packages below.
     */
    "@zoblocks/tokens",
    /*
     * Only for `@zoblocks/theme/vision`, which the Pro demo uses to simulate
     * colour-vision deficiency on the brand ramp. That module is deliberately
     * exported on its own: `@zoblocks/theme` itself pulls a schema library and
     * the whole theme document model, and `vision.ts` imports nothing at all.
     */
    "@zoblocks/theme",
    "@zoblocks/fhir",
    "@zoblocks/fixtures",
    // host-react resolves the two bridges from source as well, because all
    // three publish `main: src/index.ts` for local development and swap to
    // `dist` only in `publishConfig`. A missing entry here does not warn — the
    // module simply fails to resolve and the page 500s.
    "@zoblocks/host-react",
    "@zoblocks/bridge-core",
    "@zoblocks/bridge-antd",
    "@zoblocks/bridge-mui",
    "@zoblocks/signature",
    "@zoblocks/signature-core",
  ],

  turbopack: {
    resolveAlias: {
      "@zoblocks/tabs": "../../packages/tabs/dist/index.js",
      "@zoblocks/tabs-core": "../../packages/tabs-core/dist/index.js",
      "@zoblocks/copilot-core": "../../packages/copilot-core/dist/index.js",
      "@zoblocks/copilot-react": "../../packages/copilot-react/dist/index.js",
      "@zoblocks/clinical-note-core": "../../packages/clinical-note-core/dist/index.js",
      "@zoblocks/identity": "../../packages/identity/dist/index.js",
      "@zoblocks/identity-core": "../../packages/identity-core/dist/index.js",
    },
  },

  /*
   * Marketplace and Pro became one page, Premium, on 16 Sep 2026. The old
   * addresses are indexed and linked from outside, so they move permanently
   * rather than 404. Pack detail pages keep their `/marketplace/<slug>` URLs.
   */
  async redirects() {
    return [
      { source: "/pro", destination: "/premium", permanent: true },
      { source: "/marketplace", destination: "/premium#design-packs", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        // Registry JSON is fetched by the ZoBlocks CLI from any origin.
        source: "/r/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
