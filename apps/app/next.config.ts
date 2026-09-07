import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ZoBlocks components live at the repo root, outside this app's tree. Same
  // arrangement as apps/docs: transpile them from source rather than expecting
  // a built package. This app is the dogfood consumer of that registry.
  transpilePackages: ["@zoblocks/tokens"],
  /*
   * The CLI is aliased to `dist` rather than transpiled from source.
   *
   * It is a NodeNext package: its relative imports carry `.js` extensions that
   * resolve to `.ts` on disk — correct for Node, and unresolvable to Turbopack,
   * which takes the specifier literally. Same arrangement, and same reasoning,
   * as the tab and copilot packages in apps/docs/next.config.ts.
   *
   * Only `/r/pro/[name]` imports it, and only for the registry `$schema` URL —
   * so the format this route serves and the format the CLI parses cannot drift.
   * Turbo guarantees the order: this app declares the package as a dependency
   * and `build` declares `dependsOn: ["^build"]`.
   */
  turbopack: {
    resolveAlias: {
      "@zoblocks/cli": "../../packages/cli/dist/index.js",
    },
  },
  // Internal tool on a public hostname. These are cheap and there is no reason
  // for any of it to be embeddable or sniffable.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
