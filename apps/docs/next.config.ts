import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Registry components live outside this app, at the repo root. Next needs to
  // transpile them from source rather than expecting a built package.
  transpilePackages: [
    "@oxygenui-design/fhir",
    "@oxygenui-design/fixtures",
    "@oxygenui-design/signature",
    "@oxygenui-design/signature-core",
  ],
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
