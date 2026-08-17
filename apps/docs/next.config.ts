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
    "@oxygenui-design/component-meta",
    "@oxygenui-design/fhir",
    "@oxygenui-design/fixtures",
    "@oxygenui-design/signature",
    "@oxygenui-design/signature-core",
  ],

  turbopack: {
    resolveAlias: {
      "@oxygenui-design/tabs": "../../packages/tabs/dist/index.js",
      "@oxygenui-design/tabs-core": "../../packages/tabs-core/dist/index.js",
      "@oxygenui-design/copilot-core": "../../packages/copilot-core/dist/index.js",
      "@oxygenui-design/copilot-react": "../../packages/copilot-react/dist/index.js",
      "@oxygenui-design/clinical-note-core": "../../packages/clinical-note-core/dist/index.js",
    },
  },

  async headers() {
    return [
      {
        // Registry JSON is fetched by the shadcn CLI from any origin.
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
