import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Registry components live outside this app, at the repo root. Next needs to
  // transpile them from source rather than expecting a built package.
  transpilePackages: ["@oxygenui-design/fhir", "@oxygenui-design/fixtures"],

  /*
   * The tab packages are consumed as built output, not as source.
   *
   * They are NodeNext ESM, so their relative imports carry `.js` extensions
   * that resolve to `.ts`/`.tsx` on disk — correct for Node, and unresolvable
   * to Turbopack, which takes the specifier literally and has no
   * `extensionAlias`. (`fhir` and `fixtures` predate that convention and
   * import without extensions, which is why they transpile from source.)
   *
   * Aliasing to `dist` is the better answer anyway: the docs then render the
   * exact artefact published to npm rather than a separately-compiled copy of
   * it, so a build that works here is evidence the package works. Turbo
   * guarantees the order — `apps/docs` depends on both packages, and `build`
   * declares `dependsOn: ["^build"]`.
   */
  turbopack: {
    resolveAlias: {
      "@oxygenui-design/tabs": "../../packages/tabs/dist/index.js",
      "@oxygenui-design/tabs-core": "../../packages/tabs-core/dist/index.js",
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
